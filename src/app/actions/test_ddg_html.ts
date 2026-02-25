import * as cheerio from "cheerio"

async function test() {
    const q = 'site:reddit.com "Amazon" ("work life balance" OR wlb OR "toxic" OR "great culture" OR "working at")';
    console.log("Fetching query:", q);
    const response = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: `q=${encodeURIComponent(q)}`
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log("Snippets length:", $('.result__snippet').length);

    if ($('.result__snippet').length === 0) {
        console.log("BODY DUMP:", $('body').text().substring(0, 1000).replace(/\s+/g, ' '));
    } else {
        $('.result__snippet').each((i, element) => {
            console.log(`SNIPPET [${i}]:`, $(element).text().trim());
        });
    }
}

test();
