// Shared editorial motion helpers + render loop. Needs globals B (scene bounds), CUES, and per-piece SCN functions.
const $ = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const P = (t, a, d) => clamp((t - a) / d);
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eb = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function S(id, { x = 0, y = 0, s = 1, r = 0, o = 1, clip = null } = {}) { const e = $(id); e.style.transform = `translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`; e.style.opacity = o; if (clip !== null) e.style.clipPath = clip; }
function pop(id, t, a, { r = 0, dx = 0, dy = 0, d = 0.45 } = {}) { const p = P(t, a, d); S(id, { x: dx * (1 - eo(p)), y: dy * (1 - eo(p)), s: p <= 0 ? 0.6 : 0.6 + 0.4 * eb(p), r, o: p > 0 ? 1 : 0 }); }
function slide(id, t, a, { dx = 0, dy = 60, d = 0.5, r = 0 } = {}) { const p = eo(P(t, a, d)); S(id, { x: dx * (1 - p), y: dy * (1 - p), o: p, r }); }
function maskUp(id, t, a, d = 0.6, extra = {}) { const p = eio(P(t, a, d)); S(id, { ...extra, clip: `inset(${(1 - p) * 100}% 0 0 0)` }); }
const wob = (id, t, a, amp = 1.2, sp = 2.5) => { if (t > a) $(id).style.transform += ` rotate(${Math.sin((t - a) * sp) * amp}deg)`; };
const bob = (id, t, a, amp = 8, sp = 2) => { if (t > a) $(id).style.transform += ` translateY(${Math.sin((t - a) * sp) * amp}px)`; };
const draw = (id, t, a, d) => { const e = $(id); const L = e.getTotalLength(); e.style.strokeDasharray = L; e.style.strokeDashoffset = L * (1 - eio(P(t, a, d))); };
// photo card: mask reveal + slow zoom over the scene
function photo(id, t, a, span, r = 0) { maskUp(id, t, a, 0.6, { r }); $(id).querySelector('img').style.transform = `scale(${1.04 + 0.07 * clamp((t - a) / span)})`; }
// count-up year/number into element text
function count(id, t, a, from, to, d = 1.0) { const p = P(t, a, d); $(id).textContent = Math.round(from + (to - from) * eo(p)); S(id, { o: p > 0 ? 1 : 0, y: 40 * (1 - eo(P(t, a, 0.4))) }); }
// standard CTA scene (ids: <p>h, <p>p1, <p>d1, <p>d2, <p>q, <p>f), a = start of "Mau tau…" cue, b = start of "Follow…" cue
function cta(p, t, a, b) {
  const hp = P(t, a - 0.1, 0.6); S(p + 'h', { o: hp, y: 60 * (1 - eo(hp)) });
  draw(p + 'p1', t, a, 1.8); $(p + 'd1').style.opacity = P(t, a, 0.2); $(p + 'd2').style.opacity = P(t, a + 1.7, 0.2);
  slide(p + 'q', t, a, { dy: 30 });
  const fp = P(t, b - 0.05, 0.5); S(p + 'f', { o: fp > 0 ? 1 : 0, s: fp > 0 ? 0.6 + 0.4 * eb(fp) : 0.6, r: -2 + (t > b + 0.6 ? Math.sin((t - b - 0.6) * 3) * 1.2 : 0) });
}
const CTA_HTML = (p, head) => `<svg class="abs" width="1080" height="1920" style="left:0;top:90px"><path id="${p}p1" d="M140 780 C 300 540, 420 1000, 540 720 S 800 540, 940 780" fill="none" stroke="#111" stroke-width="14" stroke-linecap="round"/><circle id="${p}d1" cx="140" cy="780" r="34" fill="#111"/><circle id="${p}d2" cx="940" cy="780" r="34" fill="#E8402C"/></svg>
<div class="abs anton" id="${p}h" style="left:70px;top:320px;font-size:118px;width:940px">${head}</div>
<div class="abs" id="${p}q" style="left:70px;top:1010px;font:800 46px Inter;color:#111;width:940px">Mau tau hal-hal menarik lainnya?</div>
<div class="tag k abs" id="${p}f" style="left:70px;top:1100px;font-size:110px;padding:22px 40px 12px">FOLLOW BANG OPPIA</div>`;
function runEditorial(SCN) {
  const WC = ['#FFD21F', '#111', '#E8402C'];
  window.render = (t) => {
    const n = B.length - 1;
    for (let i = 1; i <= n; i++) $('s' + i).style.display = t >= B[i - 1] && (t < B[i] || i === n) ? 'block' : 'none';
    let w = null; for (let i = 1; i < n; i++) if (Math.abs(t - B[i]) < 0.28) { w = i; break; }
    if (w) { const q = (t - B[w] + 0.28) / 0.56; const dir = w % 2 ? 1 : -1; const x = q < 0.5 ? -1600 + 1600 * eio(q * 2) : 1600 * eio((q - 0.5) * 2); $('wipe').style.background = WC[(w - 1) % 3]; S('wipe', { x: x * dir, r: 8 * dir }); } else S('wipe', { x: -3000, o: 0 });
    const c = CUES.find((c) => t >= c[0] && t < c[1]); $('sub').style.display = c ? 'block' : 'none';
    if (c) { $('subt').textContent = c[2]; const p = eo(P(t, c[0], 0.18)); S('subt', { y: 14 * (1 - p), o: p }); }
    for (let i = 0; i < n; i++) if (t >= B[i] && (t < B[i + 1] || i === n - 1)) SCN[i](t);
  };
}
