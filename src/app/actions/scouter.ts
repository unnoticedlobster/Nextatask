'use server'

import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export async function getScoutedJobs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { jobs: [] }

    const { data, error } = await supabase
        .from('job_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching jobs:", error)
        return { jobs: [] }
    }

    return { jobs: data }
}

export async function runScouterAgent(profileData: any) {
    if (!process.env.JOOBLE_API_KEY) {
        return { error: "Jooble API key not configured." }
    }

    // Step 1: Fetch Real Jobs from Jooble
    // Join target roles with ' OR ' so Jooble searches for any of them, not an exact string matching all words.
    const keywords = profileData.target_roles.join(" OR ") || "Software Engineer";
    const location = profileData.remote_only ? "Remote" : profileData.location;

    let realJobs = [];
    try {
        const joobleResponse = await fetch(`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`, {
            method: 'POST',
            cache: 'no-store', // CRITICAL: Stop Next.js from caching the identical job payload
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                keywords: keywords,
                location: location,
                radius: profileData.remote_only ? 0 : profileData.distance_miles,
                ResultingFrom: Math.floor(Math.random() * 3) + 1, // Randomize page 1-3 to get broader variations
                count: 30 // Pull slightly more to ensure AI has fresh options
            })
        });

        if (!joobleResponse.ok) {
            return { error: "Failed to fetch jobs from Jooble API." }
        }

        const joobleData = await joobleResponse.json();
        realJobs = joobleData.jobs || [];

        if (realJobs.length === 0) {
            return { error: `No active jobs found on Jooble for ${keywords} in ${location}.` }
        }

    } catch (err: any) {
        console.error("Error fetching from Jooble:", err);
        return { error: err.message || "Job Search API failure." }
    }

    // Step 2: Use Gemini to filter and shape the best matches
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `
You are the Nexatask Orchestrating Agent.
I am providing you with a list of ${realJobs.length} real, active job postings fetched from an API.
Your task is to analyze these jobs against the user's profile, select the top 3 best matching jobs, and format them perfectly into the required JSON schema.

======= USER PROFILE =======
Name: ${profileData.name}
Role Target: ${profileData.target_roles.join(', ')}
Skills & Certs: ${profileData.certifications.join(', ')}
=============

======= RAW JOB POSTINGS FROM API =======
${JSON.stringify(realJobs.map((j: any, index: number) => ({
        id: index,
        title: j.title,
        company: j.company,
        location: j.location,
        snippet: j.snippet,
        salary: j.salary
    })).slice(0, 15), null, 2)} // Limit to 15 to stay well within token limits
=============

Return ONLY a strictly valid JSON array of the 3 selected objects. No markdown formatting, no code blocks, just raw JSON.
Each object must have: 
- "id" (number, MUST BE THE EXACT 'id' PROVIDED IN THE RAW DATA)
- "title" (string, the job title)
- "company" (string, the company name)
- "description" (string, write a clean 50-100 word summary of the role based on the provided snippet. Remove any HTML tags.)
- "salary_range" (string, use the 'salary' provided, or "Based on Experience" if none)
- "employment_type" (string, guess based on title/snippet, e.g., "Full-Time", "Contract")
`
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        })

        const text = response.text
        if (!text) {
            throw new Error("No response from Gemini")
        }

        const newJobsRaw = JSON.parse(text)

        // Save to Supabase job_logs
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const inserts = newJobsRaw.map((job: any) => {
                const rawJob = realJobs[job.id];
                return {
                    user_id: user.id,
                    title: job.title,
                    company: job.company,
                    description: job.description,
                    url: rawJob?.link || job.url || "",
                    salary_range: job.salary_range,
                    employment_type: job.employment_type,
                    status: 'scouted'
                }
            })

            // Dedup check: Ensure we don't insert jobs the user already has on their dashboard
            const { data: existingJobs } = await supabase
                .from('job_logs')
                .select('title, company')
                .eq('user_id', user.id);

            const filteredInserts = inserts.filter((newJob: any) => {
                if (!existingJobs) return true;
                return !existingJobs.some(existing =>
                    existing.title === newJob.title && existing.company === newJob.company
                );
            });

            if (filteredInserts.length === 0) {
                return { jobs: [], message: "AI selected jobs you already have on your radar. Try scouting again." }
            }

            const { data, error } = await supabase.from('job_logs').insert(filteredInserts).select()

            if (error) {
                console.error("Error saving scouted jobs", error)
                return { error: "Database save failed" }
            }
            return { jobs: data }
        }

        return { jobs: [] }
    } catch (err: any) {
        console.error("Scouter Agent Error:", err)
        return { error: "Failed to run AI Scouter Agent filter." }
    }
}

// ==========================================
// UTILITY: Delete Tracked Job
// ==========================================
export async function deleteJobAction(jobId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized to delete job data.' }
    }

    // Ensure users can only delete their own jobs
    const { error } = await supabase
        .from('job_logs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Error deleting job:", error)
        return { error: "Failed to remove target from radar." }
    }

    return { success: true }
}
