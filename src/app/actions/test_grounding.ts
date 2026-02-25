import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function test() {
    console.log("Starting GenAI Search Grounding test...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Search the web for what employees say about working at Amazon. Specifically, look at Reddit discussions about work-life balance and turnover risk. Summarize the findings in 3 sentences.',
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        console.log("RESPONSE TEXT:\n", response.text);

        // Check for grounding metadata
        const metadata = response.candidates?.[0]?.groundingMetadata;
        if (metadata) {
            console.log("Grounding info found. Search Queries:");
            console.log(metadata.webSearchQueries);
        } else {
            console.log("No grounding metadata found");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
