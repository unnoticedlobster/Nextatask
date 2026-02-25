import * as cheerio from "cheerio"

async function test() {
    console.log("Fetching...");
    const response = await fetch('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: 'q=Google employee reviews'
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log("HTML length:", html.length);
    console.log("Snippets length:", $('.result-snippet').length);

    $('td.result-snippet').each((i, element) => {
        console.log("SNIPPET:", $(element).text().trim());
    });
}

test();
