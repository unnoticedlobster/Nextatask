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
    const keywords = profileData.target_roles[0] || "Software Engineer";
    const location = profileData.remote_only ? "Remote" : profileData.location;

    let realJobs = [];
    try {
        const joobleResponse = await fetch(`https://jooble.org/api/${process.env.JOOBLE_API_KEY}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                keywords: keywords,
                location: location,
                ResultingFrom: 1, // Page number
                count: 20 // Number of jobs to fetch for AI to filter
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

    } catch (err) {
        console.error("Error fetching from Jooble:", err);
        return { error: "Job Search API failure." }
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
${JSON.stringify(realJobs.map((j: any) => ({
        title: j.title,
        company: j.company,
        location: j.location,
        snippet: j.snippet,
        source: j.source,
        link: j.link,
        salary: j.salary
    })).slice(0, 15), null, 2)} // Limit to 15 to stay well within token limits
=============

Return ONLY a strictly valid JSON array of the 3 selected objects. No markdown formatting, no code blocks, just raw JSON.
Each object must have: 
- "title" (string, the job title)
- "company" (string, the company name)
- "description" (string, write a clean 50-100 word summary of the role based on the provided snippet. Remove any HTML tags.)
- "url" (string, MUST BE EXACTLY THE 'link' PROVIDED IN THE RAW DATA)
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
            const inserts = newJobsRaw.map((job: any) => ({
                user_id: user.id,
                title: job.title,
                company: job.company,
                description: job.description,
                url: job.url,
                salary_range: job.salary_range,
                employment_type: job.employment_type,
                status: 'scouted'
            }))

            const { data, error } = await supabase.from('job_logs').insert(inserts).select()

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
