'use server'

import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export async function runWriterAgent(jobId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: job } = await supabase.from('job_logs').select('*').eq('id', jobId).single()
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

    if (!job || !profile) throw new Error("Missing data")

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const prompt = `
You are a Senior Career Strategist and Expert Resume Writer specializing in ATS-optimized transformations across all industries.
The user's "Master Resume" and "Cover Letter" (if provided) are your absolute source of truth.

Your Mission:
Transform the user's history into a targeted, powerful document that speaks directly to the hiring manager and sails through Applicant Tracking Systems (ATS).

Process:
1. Deep Dive: Analyze the Target Job Description to identify core requirements, pain points, and critical keywords.
2. Gap Analysis: Compare the Target Job against the user's Core Competencies & Experience. Provide a Match Score (1-100) and list missing keywords.
3. Creative Strategic Alignment (STAR): Rewrite the resume sections using the STAR method (Situation, Task, Action, Result). 
   - CRITICAL - WORK HISTORY RETENTION: You MUST include ALL past work experiences that the user provided in their [Chronological Work Experience] section. Do not drop their past jobs.
   - CRITICAL - SKILL INJECTION: Seamlessly integrate the [Explicit Skills Provided] and the [Derived Skills from Credentials] into the bullet points.
   - CRITICAL - CREATIVE ALIGNMENT: You are encouraged to proactively invent, creatively align, or heavily tailor their bullet points to directly match the target job description's keywords and pain points. 
   - CRITICAL - HUMANIZED LANGUAGE: Ensure the language flows naturally, sounds human, and tells a compelling professional story. Do NOT use overly robotic or overly generic AI jargon.
   - Do NOT use placeholders like "[Insert Skill Here]". You must write convincing, realistic bullet points seamlessly integrated into their stated job history.
   - Ensure ATS compliance (clean markdown, standard headings).
4. Cover Letter Generation: Write a highly compelling, humanized, and targeted cover letter for this specific role, leveraging the user's background. Use clean markdown.
5. The Human Edge: Draft a 3-sentence LinkedIn message to the recruiter addressing a JD pain point. Provide one complex interview question they are likely to ask based on this JD.

OUTPUT FORMAT:
Return ONLY a strictly valid JSON object mirroring this exact structure. No markdown formatting outside of the JSON values.
{
  "match_score": number, // 1-100
  "missing_keywords": ["keyword1", "keyword2"],
  "resume_markdown": "string, the complete ATS-compliant resume in clean Markdown capturing ALL past jobs",
  "cover_letter_markdown": "string, the highly targeted humanized cover letter in clean Markdown",
  "linkedin_outreach": "string, a 3-sentence draft message to the recruiter",
  "interview_question": "string, a complex interview question"
}

======= USER_BASE_PROFILE =======
Name: ${profile.name}
Location: ${profile.location}
Email: ${profile.contact_email || "N/A"}
Phone: ${profile.contact_phone || "N/A"}
Portfolio/Links: ${profile.portfolio_links || "N/A"}
Target Roles: ${profile.target_roles?.join(', ')}
======= END_USER_BASE_PROFILE =======

======= CORE_COMPETENCIES & EXPERIENCE =======
[Explicit Skills Provided]:
${profile.skills || "None explicitly provided"}

[Chronological Work Experience]:
${profile.work_experience || "None explicitly provided"}

[Certifications & Derived Knowledge]:
Degrees: ${profile.education}
Certifications: ${profile.certifications?.join(', ') || "None"}
Derived Skills from Credentials: ${profile.cert_skills_description || "N/A"}
======= END_CORE_COMPETENCIES =======

======= ADDITIONAL_CONTEXT (OLD MASTER DOCS) =======
[Master Resume / Additional Notes]:
${profile.master_resume || "None provided"}

[Master Cover Letter]:
${profile.master_cover_letter || "None provided"}
======= END_ADDITIONAL_CONTEXT =======

======= TARGET_JOB =======
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
======= END_TARGET_JOB =======
`

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        })

        const rawJsonText = response.text
        if (!rawJsonText) throw new Error("No output generated")

        // Clean markdown backticks if Gemini wrapped the JSON response
        let cleanJsonText = rawJsonText.trim();
        if (cleanJsonText.startsWith("```")) {
            const lines = cleanJsonText.split('\n');
            if (lines[0].startsWith("```")) lines.shift();
            if (lines[lines.length - 1].startsWith("```")) lines.pop();
            cleanJsonText = lines.join('\n').trim();
        }

        let parsedContent;
        try {
            parsedContent = JSON.parse(cleanJsonText);
        } catch (e: any) {
            console.error("Failed to parse JSON string:", cleanJsonText);
            throw new Error("JSON Parse Error: " + e.message);
        }

        // The database currently stores resume_content as TEXT. We will store the stringified JSON payload here.
        // We could alter the schema to JSONB, but storing it stringified in the existing text column works fine.
        const { error } = await supabase.from('job_logs').update({
            resume_content: JSON.stringify(parsedContent),
            status: 'written'
        }).eq('id', jobId)

        if (error) {
            console.error(error)
            throw new Error("Failed to save resume content")
        }

        return { success: true, status: 'written', resumeContent: JSON.stringify(parsedContent) }
    } catch (err: any) {
        console.error("Advanced Writer error", err)
        return { error: "Writer Error: " + err.message }
    }
}
