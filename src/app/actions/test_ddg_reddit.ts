import * as cheerio from "cheerio"

async function test() {
    const q = 'site:reddit.com "Amazon" ("work life balance" OR wlb OR "toxic" OR "great culture" OR "working at")';
    console.log("Fetching query:", q);
    const response = await fetch('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: `q=${encodeURIComponent(q)}`
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log("Snippets length:", $('.result-snippet').length);

    $('.result-snippet').each((i, element) => {
        console.log(`SNIPPET [${i}]:`, $(element).text().trim());
    });
}

test();
