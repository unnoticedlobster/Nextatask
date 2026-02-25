'use server'

import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export async function fetchCompanyIntel(companyName: string) {
    // 1. Authenticate user to ensure abusing the endpoint isn't possible
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Unauthorized access to Investigator." }
    }

    if (!companyName || companyName.trim() === '') {
        return { error: "Company name is required for investigation." }
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

        const prompt = `
You are an expert Employee Rights Investigator. 
Your task is to use the Google Search tool to find recent public chatter regarding what it is like to work at the company: "${companyName}".
Specifically, look for Reddit discussions, forums, or employee reviews regarding their work-life balance, culture, and turnover risk.

Synthesize your findings into a completely objective, highly specific "Culture Dossier." 
Do NOT make up information. If the search results do not contain enough information to make a determination for a category, explicitly state "Insufficient data found in recent chatter."

Return ONLY a strictly valid JSON object matching this exact shape. Do not include markdown blocks or conversational text.
{
  "red_flags": [ "an array of 1-3 specific negative things mentioned by employees, warning the user." ],
  "work_life_balance": "A 1-2 sentence summary of how employees describe the WLB, PTO, or crunch time.",
  "turnover_risk": "A 1-sentence assessment of whether people seem likely to quit quickly (e.g., 'High turnover due to burnout.').",
  "hidden_gems": [ "an array of 1-3 positive perks, cultural strengths, or benefits mentioned" ]
}
`

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
            }
        })

        let text = aiResponse.text;
        if (!text) {
            throw new Error("No response returned from Gemini Investigator.");
        }

        // Clean out possible markdown fences (```json ... ```)
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        let structuredDossier;
        try {
            structuredDossier = JSON.parse(text);
        } catch (parseErr) {
            console.error("Failed to parse Gemini JSON:", text);
            throw new Error("AI failed to output valid JSON for the dossier.");
        }

        return { dossier: structuredDossier };

    } catch (err: any) {
        console.error("Investigator Agent Error:", err);
        return { error: "Failed to compile the Culture Dossier. The AI Search Grounding may have failed." };
    }
}
