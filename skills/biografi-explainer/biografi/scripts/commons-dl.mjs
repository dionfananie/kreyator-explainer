// Download Wikimedia Commons files politely (thumb ≤1200px), with backoff on 429. Prints license/author.
// usage: node commons-dl.mjs <outDir> "File:A.jpg=name1" "File:B.png=name2" ...
import fs from 'node:fs';
import path from 'node:path';
const UA = 'OpenBotVideoMaker/1.0 (local video tool; contact via Wikimedia talk)';
const [outDir, ...specs] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429 || r.status >= 500) { const w = 8000 * (i + 1); console.log(`  ${r.status}, wait ${w / 1000}s`); await sleep(w); continue; }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r;
  }
  throw new Error('gave up ' + url);
}
for (const s of specs) {
  const [title, name] = s.split('=');
  try {
    const api = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1200&format=json&titles=' + encodeURIComponent(title);
    const j = await (await get(api)).json();
    const i = Object.values(j.query.pages)[0].imageinfo[0];
    const lic = i.extmetadata?.LicenseShortName?.value, art = (i.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, '').trim();
    await sleep(4000);
    const buf = Buffer.from(await (await get(i.thumburl || i.url)).arrayBuffer());
    const ext = /\.png/i.test(i.thumburl || i.url) ? '.png' : '.jpg';
    fs.writeFileSync(path.join(outDir, name + ext), buf);
    console.log(`ok ${name}${ext} | ${i.width}x${i.height} | ${lic} | ${art}`);
  } catch (e) { console.log(`FAIL ${name}: ${e.message}`); }
  await sleep(5000);
}
