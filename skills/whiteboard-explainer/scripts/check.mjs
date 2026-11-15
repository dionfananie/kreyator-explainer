#!/usr/bin/env node
// check.mjs: whiteboard-explainer lint over the whole piece.
//   - page errors
//   - on-screen text below the style's minimums (captions >= 28px; pass --min to change)
//   - slow frames (> 100 ms)
// usage: node check.mjs page.html [--every 0.25] [--min 28]
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch {}
    try { return createRequire(process.cwd() + '/')(name).chromium; } catch {}
  }
  throw new Error('playwright-core not found: run `npm i playwright-core` in this folder');
}
const args = process.argv.slice(2), file = args[0];
const opt = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : Number(args[i + 1]); };
if (!file) { console.error('usage: node check.mjs page.html [--every 0.25] [--min 28]'); process.exit(1); }
const chromium = await loadChromium();
let browser; try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const page = await browser.newPage(); const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + resolve(file) + '?render'); await page.evaluate(() => window.READY);
const res = await page.evaluate(({ every, min }) => {
  const small = new Map(); let slow = [], worst = 0;
  for (let t = 0; t <= window.DURATION; t += every) window.seek(t); // warm caches (ghost, wipe masks) so baking isn't timed
  for (let t = 0; t <= window.DURATION; t += every) {
    const t0 = performance.now(); window.seek(t); const ms = performance.now() - t0; worst = Math.max(worst, ms); if (ms > 100) slow.push(+t.toFixed(2));
    for (const b of window.LAYOUT || []) {
      const on = b.x + b.w > 0 && b.y + b.h > 0 && b.x < 1280 && b.y < 720;
      if (on && b.size < min && !small.has(b.id)) small.set(b.id, { t: +t.toFixed(2), px: +b.size.toFixed(1) });
    }
  }
  return { small: [...small], slow, worst: Math.round(worst) };
}, { every: opt('--every', 0.25), min: opt('--min', 28) });
await browser.close();
let bad = 0;
if (errors.length) { bad++; console.log('PAGE ERRORS:', errors); }
for (const [id, v] of res.small) { bad++; console.log(`SMALL TEXT  "${id}" ${v.px}px on screen at ${v.t}s`); }
if (res.slow.length) { bad++; console.log(`SLOW FRAMES (>100ms) at: ${res.slow.join(', ')}`); }
console.log(bad ? `${bad} issue group(s); slowest frame ${res.worst} ms` : `CLEAN: no errors, all text >= min, slowest frame ${res.worst} ms`);
process.exit(bad ? 1 : 0);
