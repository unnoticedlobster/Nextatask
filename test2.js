const cheerio = require('cheerio');

async function test() {
    const res = await fetch('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: 'q=site:reddit.com+working+environment+review'
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    let snippets = [];
    $('.result-snippet').each((i, e) => snippets.push($(e).text().trim()));
    console.log("Found:", snippets.length);
    if (snippets.length > 0) console.log(snippets[0]);
}
test();
