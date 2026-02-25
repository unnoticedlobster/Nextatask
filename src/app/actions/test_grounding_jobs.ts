import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function test() {
    console.log("Starting GenAI Search Grounding test for Jobs...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Search the web for 5 recent, currently open job postings for "Cloud Engineer" in "Remote" or "United States". Focus heavily on direct company careers pages, LinkedIn, or high-quality boards like BuiltIn or YCombinator. Do NOT return aggregate results from Jooble, ZipRecruiter, or Indeed if possible. Return strictly valid JSON array of objects. Keys: "title", "company", "description" (2 sentence summary), "salary_range", "employment_type" (e.g. Full-Time), "url" (the direct link to the real job posting).',
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        console.log("RESPONSE TEXT:\n", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
