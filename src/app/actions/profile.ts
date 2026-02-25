'use server'

import { createClient } from "@/lib/supabase/server"
import { profileSchema } from "@/lib/validations/profile"
import { redirect } from "next/navigation"
import { GoogleGenAI } from "@google/genai"

// Optional dependencies for parsing files. 
// Uses require inside try-catch to avoid breaking if not installed.
async function parseFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    try {
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            return data.text;
        }
        else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
            return buffer.toString('utf-8');
        }
    } catch (err) {
        console.error("Failed to parse file:", err);
    }
    return null;
}

export async function saveProfileActon(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Handle File parsing first
    const resumeFile = formData.get("master_resume_file") as File | null;
    const coverLetterFile = formData.get("master_cover_letter_file") as File | null;

    let parsedResumeText = await parseFile(resumeFile!);
    let parsedCoverLetterText = await parseFile(coverLetterFile!);

    // Fallback to text area if file parsing fails or no file is given
    const finalResumeText = parsedResumeText || formData.get("master_resume") || "";
    const finalCoverLetterText = parsedCoverLetterText || formData.get("master_cover_letter") || "";

    const rawData = {
        name: formData.get("name"),
        location: formData.get("location"),
        target_roles: formData.get("target_roles"),
        certifications: formData.get("certifications"),
        education: formData.get("education"),
        contact_email: formData.get("contact_email") || "",
        contact_phone: formData.get("contact_phone") || "",
        portfolio_links: formData.get("portfolio_links") || "",
        skills: formData.get("skills") || "",
        work_experience: formData.get("work_experience") || "",
        master_resume: finalResumeText,
        master_cover_letter: finalCoverLetterText,
        remote_only: formData.get("remote_only") === "on",
        distance_miles: parseInt(formData.get("distance_miles") as string || "25", 10),
    }

    const validatedFields = profileSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten().fieldErrors }
    }

    const rolesArray = validatedFields.data.target_roles.split(',').map(s => s.trim()).filter(Boolean)
    const certsArray = validatedFields.data.certifications ? validatedFields.data.certifications.split(',').map(s => s.trim()).filter(Boolean) : []

    // AI Certification Skills Generator
    let certSkillsDescription = "";
    if (certsArray.length > 0 || validatedFields.data.education) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
            const certPrompt = `
You are an expert IT Career Analyst. 
The user has listed the following Education and Certifications:
Education: ${validatedFields.data.education}
Certifications: ${certsArray.join(', ')}

Please output a concise, dense paragraph detailing the SPECIFIC technical and soft skills this individual has acquired as a result of earning these specific credentials. 
List out exactly what technologies, concepts, and methodologies they are proficient in based on these certifications and degrees.
Do not use conversational filler. Just the hard facts and skills.
            `
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: certPrompt,
            })
            certSkillsDescription = response.text || "";
        } catch (err: any) {
            console.error("AI Cert Skills Generator Failed:", err);
            // Continue saving even if AI gen fails
        }
    }

    const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        name: validatedFields.data.name,
        location: validatedFields.data.location,
        target_roles: rolesArray,
        certifications: certsArray,
        education: validatedFields.data.education,
        contact_email: validatedFields.data.contact_email,
        contact_phone: validatedFields.data.contact_phone,
        portfolio_links: validatedFields.data.portfolio_links,
        skills: validatedFields.data.skills,
        work_experience: validatedFields.data.work_experience,
        cert_skills_description: certSkillsDescription,
        master_resume: validatedFields.data.master_resume,
        master_cover_letter: validatedFields.data.master_cover_letter,
        remote_only: validatedFields.data.remote_only,
        distance_miles: validatedFields.data.distance_miles,
    })

    if (error) {
        console.error("Supabase Error:", error)
        return { error: "Supabase Error: " + error.message }
    }

    redirect('/app/dashboard')
}
