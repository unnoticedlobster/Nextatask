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
    const keywords = profileData.target_roles.join(" OR ") || "Software Engineer";
    const location = profileData.remote_only ? "Remote" : profileData.location;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

        const prompt = `
You are the Nexatask Orchestrating Agent.
Your task is to use the Google Search tool to find 5 to 10 recent, currently open job postings for "${keywords}" in "${location}".
Focus heavily on direct company careers pages, LinkedIn, or high-quality startup boards like BuiltIn or YCombinator.
DO NOT return aggregate results from Jooble, ZipRecruiter, or Indeed if possible.

======= USER PROFILE =======
Name: ${profileData.name}
Role Target: ${profileData.target_roles.join(', ')}
Skills & Certs: ${profileData.certifications.join(', ')}
=============

Select the top best matching real jobs you find and format them perfectly into the required JSON schema. 
Return ONLY a strictly valid JSON array of objects. No markdown formatting, no code blocks, just raw JSON.
Each object must have: 
- "title" (string, the exact job title)
- "company" (string, the company name)
- "description" (string, write a clean 50-100 word summary of the role based on the posting)
- "salary_range" (string, provide salary if listed, or "Based on Experience" if none)
- "employment_type" (string, e.g., "Full-Time", "Contract")
- "url" (string, the direct link to the real job application page)
`

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        })

        let text = response.text
        if (!text) {
            throw new Error("No response from Gemini API.")
        }

        // Clean out possible markdown fences (```json ... ```)
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        let newJobsRaw;
        try {
            newJobsRaw = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini Jobs JSON", text);
            return { error: "AI failed to format job listings properly." }
        }

        // Save to Supabase job_logs
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const inserts = newJobsRaw.map((job: any) => {
                return {
                    user_id: user.id,
                    title: job.title,
                    company: job.company,
                    description: job.description,
                    url: job.url || "",
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
