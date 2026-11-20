// Generic Group C, step 1 (Chrome via Rustwright, runs once per piece).
// Works with any piece.html that has #stage and window.render(t) driving inline styles / text.
//  1. detect: play every frame, find elements whose inline style or own text ever changes ("animated nodes").
//  2. build:  split the DOM, in paint order, into runs of static content owned by the same chain of animated
//             ancestors; SVG <path> elements with animated stroke-dash become vector items.
//  3. states: play every frame again and record, per animated node: visible, transform matrix + origin,
//             opacity, clip-path, content variant (own text + other inline styles), stroke dash.
//  4. export: for every run (and every content variant of its owner) render the frame where it is visible,
//             reset animated transforms/opacity/clip, and screenshot just that run as a transparent PNG.
// Output: <out>/manifest.json, <out>/states.json, <out>/*.png, cues.json (window.CUES, if any).
// usage (cwd = project folder): node <this dir>/gc-export.mjs --dur 57 [--fps 30] [--piece piece.html] [--out gc]
import { openPage } from './rw.mjs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const DUR = +opt('dur'); if (!DUR) throw new Error('--dur <seconds> is required');
const FPS = +opt('fps', 30), N = Math.round(DUR * FPS);
const PIECE = opt('piece', 'piece.html'), OUT = opt('out', 'gc');
const t0 = Date.now();
const lap = (s) => console.log(`${s} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const { page, close, cdp } = await openPage(pathToFileURL(path.resolve(PIECE)).href, 1080, 1920);
lap('chrome ready');

// ---------------------------------------------------------------- in-page helpers
await page.evaluate(() => {
  const stage = document.getElementById('stage');
  if (!stage || typeof window.render !== 'function') throw new Error('piece needs #stage and window.render(t)');
  const all = [stage, ...stage.querySelectorAll('*')];
  all.forEach((e, i) => e.setAttribute('data-gci', i));
  const own = (e) => { let s = ''; for (const n of e.childNodes) if (n.nodeType === 3) s += n.data; return s; };
  const STRIP = new Set(['transform', 'opacity', 'clip-path', 'display', 'will-change', 'stroke-dasharray', 'stroke-dashoffset']);
  const vkey = (e) => { const st = e.style; const p = []; for (let k = 0; k < st.length; k++) if (!STRIP.has(st[k])) p.push(st[k] + ':' + st.getPropertyValue(st[k])); return own(e) + '\u0001' + p.join(';'); };
  const sig = (e) => (e.getAttribute('style') || '') + '\u0001' + own(e);
  const G = (window.__gc = { stage, all, cur: -1 });

  G.detect = ({ N, FPS }) => {
    const base = all.map(sig), anim = new Set(), dash = new Set();
    for (let f = 0; f < N; f++) {
      window.render(f / FPS);
      for (let i = 0; i < all.length; i++) {
        const e = all[i];
        if (!anim.has(i) && sig(e) !== base[i]) anim.add(i);
        if (e instanceof SVGPathElement && /stroke-dash/.test(e.getAttribute('style') || '')) dash.add(i);
      }
    }
    G.cur = N - 1;
    G.anim = [...anim].sort((a, b) => a - b);
    G.A = new Set(G.anim);
    G.vec = new Set([...dash].filter((i) => anim.has(i)));
    return { elements: all.length, anim: G.anim.length, vec: G.vec.size };
  };

  G.build = () => {
    const items = [];
    let run = null;
    const flush = () => { if (run) items.push(run); run = null; };
    const z = (e) => { const cs = getComputedStyle(e); return cs.position !== 'static' && cs.zIndex !== 'auto' ? +cs.zIndex || 0 : 0; };
    const walk = (e, chain) => {
      const i = +e.getAttribute('data-gci');
      if (G.vec.has(i)) { flush(); items.push({ type: 'vec', node: i, chain: chain.slice() }); return; }
      const c = G.A.has(i) ? [...chain, i] : chain;
      if (!run || run.chain.join() !== c.join()) { flush(); run = { type: 'run', chain: c, els: [], vnode: G.A.has(i) ? i : null }; }
      run.els.push(i);
      const kids = [...e.children].map((k, j) => [k, j, z(k)]).sort((a, b) => a[2] - b[2] || a[1] - b[1]);
      for (const [k] of kids) walk(k, c);
    };
    walk(stage, []);
    flush();
    for (const it of items) {
      const first = all[it.type === 'vec' ? it.node : it.els[0]];
      it.clipEls = [];
      for (let a = first.parentElement; a && a !== stage; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          const ch = [];
          for (let b = a; b && b !== stage; b = b.parentElement) { const j = +b.getAttribute('data-gci'); if (G.A.has(j)) ch.unshift(j); }
          it.clipEls.push({ el: +a.getAttribute('data-gci'), chain: ch });
        }
      }
    }
    G.items = items;
    return items;
  };

  G.states = ({ N, FPS }) => {
    const S = {}, vk = {}, clipTab = ['none'], ci = new Map([['none', 0]]);
    for (const i of G.anim) { S[i] = { vis: [], m: [], o: [], op: [], clip: [], v: [], da: [], dof: [] }; vk[i] = new Map(); }
    for (let f = 0; f < N; f++) {
      window.render(f / FPS);
      for (const i of G.anim) {
        const e = all[i], s = S[i];
        s.vis.push(e.checkVisibility() ? 1 : 0);
        const cs = getComputedStyle(e);
        if (cs.transform === 'none') s.m.push(0); else { const m = new DOMMatrix(cs.transform); s.m.push([m.a, m.b, m.c, m.d, m.e, m.f]); }
        const to = cs.transformOrigin.split(' ').map(parseFloat); s.o.push([to[0] || 0, to[1] || 0]);
        s.op.push(+cs.opacity);
        const cp = cs.clipPath; if (!ci.has(cp)) { ci.set(cp, clipTab.length); clipTab.push(cp); } s.clip.push(ci.get(cp));
        const k = vkey(e); if (!vk[i].has(k)) vk[i].set(k, vk[i].size); s.v.push(vk[i].get(k));
        if (G.vec.has(i)) { s.da.push(cs.strokeDasharray); s.dof.push(parseFloat(cs.strokeDashoffset) || 0); }
      }
    }
    G.cur = N - 1;
    G.S = S;
    return { clipTab };
  };
  G.getState = (i) => G.S[i];

  G.seek = ({ f, FPS }) => { if (f < G.cur) G.cur = -1; for (let k = G.cur + 1; k <= f; k++) window.render(k / FPS); G.cur = f; };
  G.reset = () => {
    G.saved = G.anim.map((i) => all[i].getAttribute('style'));
    for (const i of G.anim) { const s = all[i].style; s.setProperty('transform', 'none', 'important'); s.setProperty('opacity', '1', 'important'); s.setProperty('clip-path', 'none', 'important'); }
  };
  G.restore = () => G.anim.forEach((i, k) => { const v = G.saved[k]; if (v === null) all[i].removeAttribute('style'); else all[i].setAttribute('style', v); });
  const sr = () => stage.getBoundingClientRect();
  G.box = (i) => { const s = sr(), r = all[i].getBoundingClientRect(); return { l: r.left - s.left, t: r.top - s.top, w: r.width, h: r.height }; };
  G.padBox = (i) => {
    const cs = getComputedStyle(all[i]), b = G.box(i);
    const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
    return { l: b.l + bl, t: b.t + bt, w: b.w - bl - br, h: b.h - bt - bb };
  };
  G.rect = (els) => {
    const s = sr();
    let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    const add = (r) => { if (!r.width && !r.height) return; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); };
    for (const i of els) {
      const e = all[i];
      add(e.getBoundingClientRect());
      for (const n of e.childNodes) if (n.nodeType === 3 && n.data.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) add(r); }
    }
    if (L > R) return null;
    const P = 120;
    return { l: Math.floor(L - s.left - P), t: Math.floor(T - s.top - P), r: Math.ceil(R - s.left + P), b: Math.ceil(B - s.top + P) };
  };
  G.vecInfo = (i) => {
    const e = all[i], cs = getComputedStyle(e), s = sr(), m = e.getScreenCTM();
    return { d: e.getAttribute('d'), stroke: cs.stroke, width: parseFloat(cs.strokeWidth) || 1, cap: cs.strokeLinecap, join: cs.strokeLinejoin, ctm: [m.a, m.b, m.c, m.d, m.e - s.left, m.f - s.top] };
  };
  G.exportMode = ({ ox, oy }) => {
    const st = document.createElement('style');
    st.textContent = `html,body{background:transparent!important;overflow:visible!important}
#stage{position:absolute!important;left:${ox}px!important;top:${oy}px!important;right:auto!important;bottom:auto!important;width:1080px!important;height:1920px!important;overflow:visible!important}
#stage,#stage *{visibility:hidden!important}
#stage[data-gshow],#stage [data-gshow]{visibility:visible!important}`;
    document.head.appendChild(st);
  };
  G.show = (els) => els.forEach((i) => all[i].setAttribute('data-gshow', ''));
  G.unshow = () => document.querySelectorAll('[data-gshow]').forEach((e) => e.removeAttribute('data-gshow'));
});

// ---------------------------------------------------------------- 1-3: detect, build, states
const ev = (fn, arg) => page.evaluate(fn, arg);
const det = await ev((a) => window.__gc.detect(a), { N, FPS });
lap(`detect: ${det.elements} elements, ${det.anim} animated, ${det.vec} vector paths`);
const items = await ev(() => window.__gc.build());
const { clipTab } = await ev((a) => window.__gc.states(a), { N, FPS });
const S = {};
for (const it of items) for (const i of [...it.chain, ...(it.type === 'vec' ? [it.node] : [])]) if (!S[i]) S[i] = await ev((i) => window.__gc.getState(i), i);
for (const it of items) for (const c of it.clipEls) for (const i of c.chain) if (!S[i]) S[i] = await ev((i) => window.__gc.getState(i), i);
lap(`states: ${items.length} paint items, ${Object.keys(S).length} animated nodes recorded`);

// ---------------------------------------------------------------- 4: plan captures
const visAll = (ch, f) => ch.every((i) => S[i].vis[f]);
const jobs = new Map(); // frame -> [{item, v}]
const addJob = (f, j) => { if (!jobs.has(f)) jobs.set(f, []); jobs.get(f).push(j); };
items.forEach((it, k) => {
  it.id = k;
  const ch = it.type === 'vec' ? [...it.chain, it.node] : it.chain;
  if (it.type === 'run' && it.vnode !== null) {
    const seen = new Set();
    for (let f = 0; f < N; f++) { const v = S[it.vnode].v[f]; if (!seen.has(v) && visAll(ch, f)) { seen.add(v); addJob(f, { k, v }); } }
  } else {
    let f = 0; while (f < N && !visAll(ch, f)) f++;
    if (f < N) addJob(f, { k, v: 0 });
  }
});
const frames = [...jobs.keys()].sort((a, b) => a - b);
lap(`plan: ${[...jobs.values()].reduce((s, j) => s + j.length, 0)} captures on ${frames.length} frames`);

// pass A: measure everything at rest
const meas = new Map(); // `${k}:${v}` -> rect
const boxes = {};      // node -> {v: box}
const clipRects = {};  // `${k}:${clipIdx}` -> padBox
const vecs = {};
let U = { l: 0, t: 0, r: 1080, b: 1920 };
for (const f of frames) {
  await ev((a) => window.__gc.seek(a), { f, FPS });
  await ev(() => window.__gc.reset());
  for (const { k, v } of jobs.get(f)) {
    const it = items[k];
    if (it.type === 'vec') { vecs[k] = await ev((i) => window.__gc.vecInfo(i), it.node); }
    else {
      const r = await ev((els) => window.__gc.rect(els), it.els);
      if (r) { meas.set(`${k}:${v}`, r); U = { l: Math.min(U.l, r.l), t: Math.min(U.t, r.t), r: Math.max(U.r, r.r), b: Math.max(U.b, r.b) }; }
      if (it.vnode !== null) { (boxes[it.vnode] ??= {})[v] = await ev((i) => window.__gc.box(i), it.vnode); }
    }
    for (let c = 0; c < it.clipEls.length; c++) clipRects[`${k}:${c}`] ??= await ev((i) => window.__gc.padBox(i), it.clipEls[c].el);
  }
  await ev(() => window.__gc.restore());
}
const ox = 10 - U.l, oy = 10 - U.t, VW = Math.ceil(ox + U.r + 10), VH = Math.ceil(oy + U.b + 10);
lap(`measured; export viewport ${VW}x${VH}`);

// pass B: capture
await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
await cdp('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
await ev((a) => window.__gc.exportMode(a), { ox, oy });
const layers = {}; // `${k}:${v}` -> {file,x,y,w,h}
let bytes = 0, empty = 0;
for (const f of frames) {
  await ev((a) => window.__gc.seek(a), { f, FPS });
  await ev(() => window.__gc.reset());
  for (const { k, v } of jobs.get(f)) {
    const r = meas.get(`${k}:${v}`);
    if (!r) continue;
    await ev((els) => window.__gc.show(els), items[k].els);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false, clip: { x: ox + r.l, y: oy + r.t, width: r.r - r.l, height: r.b - r.t, scale: 1 } });
    await ev(() => window.__gc.unshow());
    // trim transparent borders
    const img = await loadImage(Buffer.from(shot.data, 'base64'));
    const cv = createCanvas(img.width, img.height), g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, img.width, img.height).data;
    let L = img.width, T = img.height, R = -1, B = -1;
    for (let y = 0; y < img.height; y++) { const row = y * img.width * 4; for (let x = 0; x < img.width; x++) if (px[row + x * 4 + 3]) { if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y; } }
    if (R < 0) { empty++; continue; }
    const w = R - L + 1, h = B - T + 1, out = createCanvas(w, h);
    out.getContext('2d').drawImage(img, L, T, w, h, 0, 0, w, h);
    const png = out.toBuffer('image/png'), file = `L${k}_${v}.png`;
    fs.writeFileSync(`${OUT}/${file}`, png);
    bytes += png.length;
    layers[`${k}:${v}`] = { file, x: r.l + L, y: r.t + T, w, h };
  }
  await ev(() => window.__gc.restore());
}
const cues = await ev(() => window.CUES || null);
await close();
if (cues) fs.writeFileSync('cues.json', JSON.stringify(cues));

const man = {
  W: 1080, H: 1920, FPS, N, clipTab, boxes,
  items: items.map((it) => ({
    type: it.type, chain: it.chain, node: it.node, vnode: it.vnode,
    vec: it.type === 'vec' ? vecs[it.id] : undefined,
    clips: it.clipEls.map((c, j) => ({ chain: c.chain, rect: clipRects[`${it.id}:${j}`] })),
    layers: it.type === 'run' ? Object.fromEntries(Object.entries(layers).filter(([key]) => key.startsWith(it.id + ':')).map(([key, L]) => [key.split(':')[1], L])) : undefined,
  })).filter((it) => it.type === 'vec' ? !!it.vec : Object.keys(it.layers).length),
};
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(man));
fs.writeFileSync(`${OUT}/states.json`, JSON.stringify(S));
lap(`exported ${Object.keys(layers).length} layers (${(bytes / 1048576).toFixed(1)} MB, ${empty} empty skipped), ${man.items.length} paint items`);
