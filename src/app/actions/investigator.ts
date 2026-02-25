'use server'

import { GoogleGenAI } from "@google/genai"
import * as cheerio from "cheerio"
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
        // 2. Perform the rogue scrape against DuckDuckGo
        // We look specifically for reddit threads about the working environment
        const query = encodeURIComponent(`site:reddit.com "${companyName}" working environment OR culture OR review`);
        const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;

        const response = await fetch(searchUrl, {
            cache: 'no-store',
            headers: {
                // Simplify headers to look less like an automated headless script trying to spoof Chrome
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch search results from DuckDuckGo. Status: ${response.status}`);
        }

        const htmlUrl = await response.text();
        const $ = cheerio.load(htmlUrl);

        // 3. Extract the snippet text from search results
        let rawSnippets: string[] = [];
        $('.result__snippet').each((i, element) => {
            rawSnippets.push($(element).text().trim());
        });

        if (rawSnippets.length === 0) {
            return {
                dossier: {
                    red_flags: ["No significant chatter found."],
                    work_life_balance: "Insufficient data.",
                    turnover_risk: "Insufficient data.",
                    hidden_gems: ["Company might be too small or too new for active internet chatter."]
                }
            }
        }

        // Combile all snippets into one massive string of raw intel
        const compiledIntel = rawSnippets.join('\n\n---\n\n');

        // 4. Send the compiled chaotic intel to Gemini for synthesis
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

        const prompt = `
You are an expert Employee Rights Investigator. 
I have scraped the internet (specifically Reddit and review sites) for anonymous chatter regarding the company: "${companyName}".

Here are the raw, chaotic text snippets pulled from search results regarding what it is like to work there:
=================
${compiledIntel}
=================

Your task is to synthesize this unstructured data into a completely objective, highly specific "Culture Dossier." 
Do NOT make up information. If the snippets do not contain enough information to make a determination for a category, explicitly state "Insufficient datat found in recent chatter."

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
        return { error: "Failed to compile the Culture Dossier. The intel source may be blocking us or the AI failed to parse." };
    }
}
