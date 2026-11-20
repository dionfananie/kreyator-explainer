// vox-explainer runtime for Group C pieces: paper-collage motion vocabulary + render loop.
// Contract (gc-export): #stage + window.render(t) that only changes inline transform/opacity/text/display.
// Piece order: /*TIMING*/ block (defines B, CUES, C) -> voxSetup({...}) -> scene functions F[] -> voxRun(F).
// Needs in the page: #stage, .scene#<id> with .cam inside, #wipe (torn sheet), #sub > #subt.
const $ = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const P = (t, a, d) => clamp((t - a) / d);
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eb = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------------------------------------------------------------- timeline
// L: [[seconds, text, newBeat?], ...] used when there is no VO (estimated ~2.6 words/s).
// With VO, align.mjs fills /*TIMING*/ with B (beat starts, from "---" in script.txt) and CUES; L durations are ignored.
// SH: shots [[sceneId, firstCueIndex], ...]; two adjacent shots may share a scene (the cut is a camera jump).
function voxSetup({ L, SH, DUR, stepFps = 12, noSubFrom = Infinity, lead = 0.8, gap = 0.22, beatGap = 0.45 }) {
  let beatCues = new Set();
  if (!window.CUES) {
    const cues = []; let t = lead;
    L.forEach(([d, s, b], i) => { if (b && i) t += beatGap; if (b) beatCues.add(i); cues.push([+t.toFixed(2), +(t + d).toFixed(2), s]); t += d + gap; });
    window.CUES = cues;
  } else if (typeof B !== 'undefined' && B) {
    for (const b of B.slice(0, -1)) { const i = CUES.findIndex((c) => c[0] >= b - 0.01); if (i >= 0) beatCues.add(i); }
  }
  const st = (c) => CUES[c][0];
  const ST = SH.map(([, c], i) => (i ? +(st(c) - 0.18).toFixed(2) : 0));
  const BEATS = SH.map(([, c], i) => (i && beatCues.has(c) && SH[i - 1][0] !== SH[i][0] ? i : -1)).filter((i) => i > 0);
  if (noSubFrom === 'cta') noSubFrom = SH[SH.length - 1][1];
  window.VOX = { SH, ST, BEATS, DUR, stepFps, noSubFrom, SCENES: [...new Set(SH.map((s) => s[0]))] };
  return window.VOX;
}

// ---------------------------------------------------------------- torn paper edges (static, once)
function tear(el, amp, seed, sides) {
  const w = el.offsetWidth, h = el.offsetHeight, R = rng(seed * 7919 + 17), st = 22, pts = [];
  const j = (s) => (sides.includes(s) ? R() * amp : 0);
  for (let x = 0; x < w; x += st) pts.push([x, j('t')]);
  for (let y = 0; y < h; y += st) pts.push([w - j('r'), y]);
  for (let x = w; x > 0; x -= st) pts.push([x, h - j('b')]);
  for (let y = h; y > 0; y -= st) pts.push([j('l'), y]);
  el.style.clipPath = 'polygon(' + pts.map((p) => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')';
}

// ---------------------------------------------------------------- reusable markup
const PERSON = '<svg width="56" height="104" viewBox="0 0 56 104"><circle cx="28" cy="16" r="14" fill="#1f1d1a"/><path d="M6 104 V56 a22 22 0 0 1 44 0 V104 z" fill="#1f1d1a"/></svg>';
const voxPeople = (boxId, n, prefix = 'p') => { $(boxId).innerHTML = Array.from({ length: n }, (_, k) => `<div class="person" id="${prefix}${k}">${PERSON}</div>`).join(''); };
const CONF = ['#ffd84a', '#1f1d1a', '#d6261c', '#fbf7ee', '#cdb991'];
const voxConfetti = (boxId, n = 12, prefix = 'c') => { $(boxId).innerHTML = Array.from({ length: n }, (_, k) => `<div class="abs" id="${prefix}${k}" style="left:${60 + ((k * 89) % 940)}px;top:-120px;width:${40 + (k % 3) * 16}px;height:${24 + (k % 2) * 14}px"><b class="sheet" data-tear="4" style="background:${CONF[k % 5]}"></b></div>`).join(''); };

// ---------------------------------------------------------------- motion vocabulary
// Each returns a partial {x,y,r,s,sx,sy,o}; T(id, ...parts) combines them (x/y/r add, scales/opacity multiply).
const add = (...ms) => ms.reduce((A, m) => ({ x: A.x + (m.x || 0), y: A.y + (m.y || 0), r: A.r + (m.r || 0), s: A.s * (m.s ?? 1), sx: A.sx * (m.sx ?? 1), sy: A.sy * (m.sy ?? 1), o: A.o * (m.o ?? 1) }), { x: 0, y: 0, r: 0, s: 1, sx: 1, sy: 1, o: 1 });
function T(id, ...ms) { const m = add(...ms), e = $(id); e.style.transform = `translate(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px) rotate(${m.r.toFixed(2)}deg) scale(${(m.s * m.sx).toFixed(4)},${(m.s * m.sy).toFixed(4)})`; e.style.opacity = +clamp(m.o).toFixed(3); }
const pop = (t, a, { d = 0.42, r = 0 } = {}) => { const p = P(t, a, d); return p <= 0 ? { o: 0 } : { s: 0.45 + 0.55 * eb(p), r }; };
const slide = (t, a, { dx = 0, dy = 0, d = 0.5, r = 0, r0 = 0 } = {}) => { const p = P(t, a, d), k = eb(p); return p <= 0 ? { o: 0 } : { x: dx * (1 - k), y: dy * (1 - k), r: r + r0 * (1 - k) }; };
const slam = (t, a, { d = 0.26, r = 0 } = {}) => { const p = P(t, a, d); return p <= 0 ? { o: 0 } : { s: 2.3 - 1.3 * eo(p), r, o: clamp(p * 3) }; };
const drift = (t, a, { x = 0, y = 6, r = 0, sp = 1.8, ph = 0 } = {}) => { const w = eio(P(t, a, 0.6)), q = Math.sin((t - a) * sp + ph); return { x: x * q * w, y: y * q * w, r: r * q * w }; };
const wipeX = (t, a, d = 0.35) => { const p = eio(P(t, a, d)); return p <= 0 ? { o: 0 } : { sx: Math.max(p, 0.001) }; };
const growY = (t, a, d = 0.6) => { const p = eo(P(t, a, d)); return p <= 0 ? { o: 0 } : { sy: Math.max(p, 0.001) }; };
const out = (t, a, d = 0.25) => ({ o: 1 - P(t, a, d) });
const shown = (t, a) => ({ o: t >= a ? 1 : 0 });
const shake = (t, a, amp = 16, d = 0.4) => { const p = P(t, a, d); if (p <= 0 || p >= 1) return {}; const k = amp * (1 - p); return { x: Math.sin(t * 91) * k, y: Math.cos(t * 77) * k, r: Math.sin(t * 53) * k * 0.05 }; };
const ramp = (a, b, t0, t1, t, f = eio) => a + (b - a) * f(P(t, t0, t1 - t0));
const lin = (x) => x;
const cam = (id, ...ms) => T(id, ...ms);
function draw(id, t, a, d) { const e = $(id), Ln = e.getTotalLength(); e.style.strokeDasharray = Ln; e.style.strokeDashoffset = (Ln * (1 - eio(P(t, a, d)))).toFixed(2); }
const fmt = (v, dec) => v.toFixed(dec).replace('.', ',');
function count(id, t, a, to, dec = 0, d = 0.9, from = 0) { $(id).textContent = fmt(from + (to - from) * eo(P(t, a, d)), dec); }

// ---------------------------------------------------------------- render loop
// F[k](tq, shotStart, shotEnd) sets every animated element of shot k's scene. tq is posterized to stepFps.
function voxRun(F) {
  const V = window.VOX;
  V.SCENES.forEach((s) => ($(s).style.display = 'block'));
  document.querySelectorAll('[data-tear]').forEach((e, i) => tear(e, +e.dataset.tear, i + 1, e.dataset.sides || 'trbl'));
  V.SCENES.forEach((s) => ($(s).style.display = 'none'));
  window.render = (t) => {
    const tq = Math.floor(t * V.stepFps + 1e-6) / V.stepFps;
    let k = 0; for (let i = 0; i < V.SH.length; i++) if (t >= V.ST[i]) k = i;
    for (const s of V.SCENES) $(s).style.display = s === V.SH[k][0] ? 'block' : 'none';
    F[k](tq, V.ST[k], V.ST[k + 1] ?? V.DUR);
    let w = null; for (const i of V.BEATS) if (Math.abs(tq - V.ST[i]) < 0.34) w = i;
    if (w !== null) { const q = (tq - V.ST[w] + 0.34) / 0.68, dir = w % 2 ? 1 : -1, x = q < 0.5 ? 1750 * (1 - eio(q * 2)) : -1750 * eio((q - 0.5) * 2); T('wipe', { x: x * dir, r: 7 * dir }); } else T('wipe', { x: 3000, o: 0 });
    const ci = CUES.findIndex((c) => t >= c[0] && t < c[1]);
    const on = ci >= 0 && ci < V.noSubFrom; $('sub').style.display = on ? 'block' : 'none';
    if (on) { $('subt').textContent = CUES[ci][2]; T('subt', { o: P(tq, CUES[ci][0], 0.12) }); }
  };
  window.render(0);
}
