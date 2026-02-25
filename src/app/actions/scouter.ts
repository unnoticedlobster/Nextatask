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
    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Securely construct prompt with isolated user data
    const remoteQuery = profileData.remote_only
        ? "STRICT: You must ONLY return 100% Remote positions. No hybrid, no on-site."
        : `Location Context: The user prefers jobs within ${profileData.distance_miles} miles of ${profileData.location}, but some remote roles are also acceptable.`;

    const prompt = `
You are the Nexatask Targeting Agent.
Your task is to simulate scraping job boards and return 3 Highly Relevant job descriptions that match the user's isolated profile data. 
${remoteQuery}

Return ONLY a strictly valid JSON array of objects. No markdown formatting, no code blocks, just raw JSON.
Each object must have: 
- "title" (string)
- "company" (string)
- "description" (string, realistic job description under 150 words)
- "url" (string, a realistic simulated URL to the job posting, e.g., https://linkedin.com/jobs/view/12345)
- "salary_range" (string, e.g., "$120,000 - $140,000" or "Competitive")
- "employment_type" (string, e.g., "Full-Time", "Contract", "Part-Time")

======= USER_PROFILE_DATA =======
Name: ${profileData.name}
Location: ${profileData.location}
Target Roles: ${profileData.target_roles.join(', ')}
Certifications: ${profileData.certifications.join(', ')}
Education: ${profileData.education}
======= END_USER_PROFILE_DATA =======
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
        return { error: "Failed to run Scouter Agent." }
    }
}
