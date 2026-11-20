// Add the "bang.oppia" trademark badge (icon + text) to a 1080x1920 cover image.
// usage: node cover-badge.mjs <in.jpg> <out.jpg>
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
GlobalFonts.registerFromPath(path.join(here, 'node_modules/@fontsource/inter/files/inter-latin-800-normal.woff2'), 'Inter800');
const [inp, out] = process.argv.slice(2);
const bg = await loadImage(fs.readFileSync(inp));
const icon = await loadImage(fs.readFileSync(path.join(here, 'brand/oppia.png')));
const W = bg.width, H = bg.height;
const cv = createCanvas(W, H), g = cv.getContext('2d');
g.drawImage(bg, 0, 0);

// icon: white background -> transparent (alpha from darkness)
const IS = 74;
const ic = createCanvas(IS, IS), ig = ic.getContext('2d');
ig.imageSmoothingQuality = 'high';
ig.drawImage(icon, 0, 0, IS, IS);
const d = ig.getImageData(0, 0, IS, IS);
for (let i = 0; i < d.data.length; i += 4) { const lum = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; d.data[i + 3] = 255 - lum; d.data[i] = d.data[i + 1] = d.data[i + 2] = 17; }
ig.putImageData(d, 0, 0);

// badge: white pill, ink border + hard shadow (matches the editorial style), bottom-right inside the 3:4 grid crop
const text = 'bang.oppia';
g.font = '44px Inter800';
const tw = g.measureText(text).width;
const padX = 26, gap = 16, bh = 104, bw = padX + IS + gap + tw + padX + 6;
const x = W - 60 - bw, y = Math.round(H * 0.8) + 30; // just below the subtitle band, above the bottom 3:4 crop edge
const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
g.fillStyle = '#111'; rr(x + 8, y + 8, bw, bh, 52); g.fill();
g.fillStyle = '#fff'; rr(x, y, bw, bh, 52); g.fill();
g.lineWidth = 5; g.strokeStyle = '#111'; rr(x, y, bw, bh, 52); g.stroke();
g.drawImage(ic, x + padX, y + (bh - IS) / 2);
g.fillStyle = '#111'; g.textBaseline = 'middle';
g.fillText(text, x + padX + IS + gap, y + bh / 2 + 2);
fs.writeFileSync(out, cv.toBuffer('image/jpeg', 92));
console.log('badge ->', out);
