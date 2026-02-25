'use server'

import * as cheerio from 'cheerio'
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export async function parseAndSaveJob(input: { url?: string, text?: string }) {
    try {
        let rawContent = input.text || ""

        // If a URL is provided, try to scrape it
        if (input.url && !input.text) {
            try {
                const response = await fetch(input.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    // Remove scripts and styles
                    $('script, style').remove();
                    rawContent = $('body').text().replace(/\s+/g, ' ').trim();
                } else {
                    console.log(`Failed to fetch URL, status: ${response.status}`);
                    // Will fall back to empty or fail in Gemini
                }
            } catch (err) {
                console.error("Error fetching URL:", err);
                // Will fall back to empty or fail in Gemini
            }
        }

        if (!rawContent) {
            return { error: "No job description content could be extracted. Try pasting the raw text instead." }
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

        const prompt = `
You are an expert ATS parser and job data extractor.
Analyze the following raw scraped text from a job posting.
Extract or infer the core job details.
If information is missing, use sensible defaults (e.g., "Not Specified" for salary).

Raw Content:
${rawContent.substring(0, 5000)} // Limit to fit in prompt if it's very large

Return ONLY a strictly valid JSON object. No markdown formatting, no code blocks, just raw JSON.
The object must have:
- "title" (string, the job title)
- "company" (string, the hiring company)
- "description" (string, a clean, concise summary of the job and requirements, under 200 words)
- "salary_range" (string, e.g., "$120k", "Not Specified")
- "employment_type" (string, e.g., "Full-Time", "Contract", "Not Specified")
`

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        })

        const textResult = response.text
        if (!textResult) {
            throw new Error("No response from AI")
        }

        const jobData = JSON.parse(textResult)

        // Save to Supabase job_logs
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: "User not authenticated" }
        }

        const insertData = {
            user_id: user.id,
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            url: input.url || "Manual Entry",
            salary_range: jobData.salary_range,
            employment_type: jobData.employment_type,
            status: 'scouted'
        }

        const { data, error } = await supabase.from('job_logs').insert([insertData]).select()

        if (error) {
            console.error("Database error saving manual job:", error)
            return { error: "Database save failed" }
        }

        return { job: data[0] }

    } catch (error: any) {
        console.error("Parse and Save Job Error:", error)
        return { error: error.message || "Failed to process job." }
    }
}
