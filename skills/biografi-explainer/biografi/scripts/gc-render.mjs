// Generic Group C, step 2 (no browser): composite every frame from gc-export's layers + recorded states
// with @napi-rs/canvas, pipe raw RGBA to ffmpeg (H.264, yuv420p, CFR).
// usage (cwd = project folder): node <this dir>/gc-render.mjs [out.mp4] [--in gc] [--stills t1,t2,...] [--frames N]
import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const FFMPEG = process.env.FFMPEG || 'C:/Users/Dion/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const out = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'video_noaudio.mp4';
const IN = opt('in', 'gc');
const t0 = Date.now();
const lap = (s) => console.log(`${s} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

const man = JSON.parse(fs.readFileSync(`${IN}/manifest.json`, 'utf8'));
const S = JSON.parse(fs.readFileSync(`${IN}/states.json`, 'utf8'));
const { W, H, FPS } = man;
const N = Number(opt('frames', man.N));
for (const it of man.items) {
  if (it.layers) for (const L of Object.values(it.layers)) L.img = await loadImage(fs.readFileSync(`${IN}/${L.file}`));
  if (it.vec) it.vec.p2d = new Path2D(it.vec.d);
}
lap(`loaded ${man.items.length} paint items`);

// ---- 2D affine helpers: [a,b,c,d,e,f] like canvas setTransform
const I = [1, 0, 0, 1, 0, 0];
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const boxOf = (n, f) => { const bs = man.boxes[n]; if (!bs) return null; return bs[S[n].v[f]] || Object.values(bs)[0]; };
let cache = new Map();
function local(n, f) {
  if (cache.has(n)) return cache.get(n);
  const s = S[n], m = s.m[f];
  let M = I;
  if (m) {
    const b = boxOf(n, f) || { l: 0, t: 0 };
    const ox = b.l + s.o[f][0], oy = b.t + s.o[f][1];
    M = mul(mul([1, 0, 0, 1, ox, oy], m), [1, 0, 0, 1, -ox, -oy]);
  }
  cache.set(n, M);
  return M;
}
const chainM = (ch, f) => ch.reduce((M, n) => mul(M, local(n, f)), I);
function inset(str, b) {
  const m = /inset\(([^)]*)\)/.exec(str);
  if (!m || !b) return null;
  const v = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
  const t = v[0], r = v[1] ?? t, bo = v[2] ?? t, l = v[3] ?? r;
  const c = (x, ref) => (x.endsWith('%') ? (parseFloat(x) / 100) * ref : parseFloat(x) || 0);
  const L = c(l, b.w), T = c(t, b.h);
  return [b.l + L, b.t + T, b.w - L - c(r, b.w), b.h - T - c(bo, b.h)];
}

const cv = createCanvas(W, H);
const g = cv.getContext('2d');
g.imageSmoothingEnabled = true;
g.imageSmoothingQuality = 'high';
const warned = new Set();

function frame(f) {
  cache = new Map();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.clearRect(0, 0, W, H);
  for (const it of man.items) {
    const ch = it.type === 'vec' ? [...it.chain, it.node] : it.chain;
    if (!ch.every((n) => S[n].vis[f])) continue;
    let a = 1;
    for (const n of ch) a *= S[n].op[f];
    if (a <= 0.002) continue;
    let L;
    if (it.type === 'run') { L = it.layers[it.vnode !== null ? S[it.vnode].v[f] : 0]; if (!L) continue; }
    g.save();
    for (const c of it.clips) { g.setTransform(...chainM(c.chain, f)); g.beginPath(); g.rect(c.rect.l, c.rect.t, c.rect.w, c.rect.h); g.clip(); }
    for (let k = 0; k < ch.length; k++) {
      const cp = man.clipTab[S[ch[k]].clip[f]];
      if (cp === 'none') continue;
      const r = inset(cp, boxOf(ch[k], f));
      if (!r) { if (!warned.has(cp)) { warned.add(cp); console.warn('unsupported clip-path, ignored:', cp); } continue; }
      g.setTransform(...chainM(ch.slice(0, k + 1), f)); g.beginPath(); g.rect(...r); g.clip();
    }
    g.globalAlpha = Math.min(1, a);
    if (it.type === 'run') {
      g.setTransform(...chainM(it.chain, f));
      g.drawImage(L.img, L.x, L.y);
    } else {
      const v = it.vec, s = S[it.node];
      g.setTransform(...mul(chainM(ch, f), v.ctm));
      g.strokeStyle = v.stroke; g.lineWidth = v.width; g.lineCap = v.cap; g.lineJoin = v.join;
      const da = s.da[f];
      g.setLineDash(!da || da === 'none' ? [] : da.split(/[\s,]+/).map(parseFloat).filter((x) => !isNaN(x)));
      g.lineDashOffset = s.dof[f];
      g.stroke(v.p2d);
    }
    g.restore();
  }
}

const stills = opt('stills', '');
if (stills) {
  fs.mkdirSync('check', { recursive: true });
  for (const t of stills.split(',').map(Number)) { frame(Math.round(t * FPS)); fs.writeFileSync(`check/gc_${t.toFixed(2)}.png`, cv.toBuffer('image/png')); }
  lap('stills done');
  process.exit(0);
}

const ff = spawn(FFMPEG, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-frames:v', String(N), out], { stdio: ['pipe', 'ignore', 'inherit'] });
let drawMs = 0;
for (let f = 0; f < N; f++) {
  const a = performance.now();
  frame(f);
  const buf = cv.data();
  drawMs += performance.now() - a;
  if (!ff.stdin.write(Buffer.from(buf))) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 300 === 0) lap(`frame ${f}/${N}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
lap(`done ${out}; compositing ${(drawMs / N).toFixed(1)} ms/frame`);
