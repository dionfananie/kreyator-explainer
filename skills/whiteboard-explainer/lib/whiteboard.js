// whiteboard.js — the "Whiteboard Explainer" medium (Hand-Drawn): dry-erase marker on a glossy board.
// The drawing/texture/finishing code is lifted unchanged from the style reference; only the story is per piece.
// Exposes window.WB. Needs harness.js (window.H) first.
{
  const seg = (pts, step = 2.5) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let j = 0; j < n; j++) out.push([x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const normals = (P) => P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    return [-dy / d, dx / d];
  });
  const wobble = (pts, nz, seed, amp = 1.6, freq = 0.011) => {
    const N = normals(pts); let L = 0;
    return pts.map((p, i) => {
      if (i) L += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const o = nz.n2(L * freq + seed * 1.37, seed * 0.71) * amp + nz.n2(L * freq * 6 + seed, seed + 3.3) * amp * 0.25;
      return [p[0] + N[i][0] * o, p[1] + N[i][1] * o];
    });
  };
  const ell = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, grow = 0) => {
    const n = Math.max(10, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 2.5)), out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = a0 + (a1 - a0) * u, g = 1 + grow * u;
      out.push([cx + Math.cos(a) * rx * g, cy + Math.sin(a) * ry * g]);
    }
    return out;
  };
  const bez = (p0, p1, p2, p3) => {
    const out = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, m = 1 - t;
      out.push([m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
        m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]);
    }
    return out;
  };
  const tracePath = (ctx, P) => { ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); };

  // A dry-erase marker stroke: lighter wet center, darker pooled edges, streaky dry lines.
  const BOARD = [236, 240, 239];
  const MN = H.makeNoise(4242);
  let TIP = null; // where the marker tip currently is (during the build)
  const marker = (ctx, pts, col, w, seed, prog = 1) => {
    if (prog <= 0) return;
    if (prog < 1) { const q = pts[Math.max(1, Math.ceil(pts.length * prog)) - 1]; TIP = [q[0], q[1], col]; }
    const P = prog < 1 ? pts.slice(0, Math.max(2, Math.ceil(pts.length * prog))) : pts;
    const r = H.rng(seed), rgb = H.hex(col), N = normals(P);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = H.rgba(rgb, 0.3); ctx.lineWidth = w; tracePath(ctx, P); ctx.stroke();
    ctx.lineCap = 'butt';
    // body ink density drifts along the stroke (wetter / drier patches)
    const CH = 10;
    for (let i = 0; i < P.length - 1; i += CH) {
      const a = 0.16 + 0.22 * (0.5 + 0.5 * MN.n2(i * 0.03 + seed * 3.1, seed * 0.37));
      ctx.strokeStyle = H.rgba(rgb, a); ctx.lineWidth = w * 0.96;
      ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]);
      for (let j = i + 1; j <= Math.min(P.length - 1, i + CH); j++) ctx.lineTo(P[j][0], P[j][1]);
      ctx.stroke();
    }
    const n = 7;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) - 0.5, edge = Math.abs(u) * 2;
      const a = (0.08 + 0.5 * Math.pow(edge, 2.2)) * (0.65 + r() * 0.7);
      ctx.strokeStyle = H.rgba(rgb, a); ctx.lineWidth = (w / n) * 1.5;
      const off = u * w * 0.84;
      ctx.beginPath();
      P.forEach((p, i) => { const x = p[0] + N[i][0] * off, y = p[1] + N[i][1] * off; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    // dry streaks where the felt tip skipped
    for (let k = 0; k < 4; k++) {
      const off = (r() - 0.5) * w * 0.6;
      ctx.strokeStyle = H.rgba(BOARD, 0.14 + r() * 0.2); ctx.lineWidth = 0.6 + r() * 0.6;
      const s = Math.floor(r() * P.length * 0.4), e = Math.min(P.length, s + Math.floor(P.length * (0.3 + r() * 0.6)));
      ctx.beginPath();
      for (let i = s; i < e; i++) { const x = P[i][0] + N[i][0] * off, y = P[i][1] + N[i][1] * off; i > s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    // ink pools where the tip lands and lifts
    [P[0], prog >= 1 ? P[P.length - 1] : null].forEach((p, j) => {
      if (!p) return;
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], w * 0.62);
      g.addColorStop(0, H.rgba(rgb, j ? 0.25 : 0.42)); g.addColorStop(1, H.rgba(rgb, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], w * 0.62, 0, 7); ctx.fill();
    });
    ctx.restore();
  };

  // Marker lettering: per-glyph jitter, pale centers with darker rims.
  const mText = (ctx, str, x, y, font, col, seed, prog = 1, rot = 0) => {
    if (prog <= 0) return;
    const r = H.rng(seed), rgb = H.hex(col);
    ctx.save(); ctx.font = font; ctx.textBaseline = 'alphabetic';
    ctx.translate(x, y); ctx.rotate(rot);
    const nChars = Math.ceil(str.length * prog);
    if (prog < 1) {
      const wsofar = ctx.measureText(str.slice(0, nChars)).width;
      TIP = [x + Math.cos(rot) * wsofar, y + Math.sin(rot) * wsofar - 10, col];
    }
    let cx = 0;
    for (let i = 0; i < nChars; i++) {
      const ch = str[i], wch = ctx.measureText(ch).width;
      ctx.save(); ctx.translate(cx + wch / 2, (r() - 0.5) * 3); ctx.rotate((r() - 0.5) * 0.07);
      ctx.fillStyle = H.rgba(rgb, 0.8 + r() * 0.1); ctx.fillText(ch, -wch / 2, 0);
      ctx.strokeStyle = H.rgba(rgb, 0.7); ctx.lineWidth = 1.3; ctx.strokeText(ch, -wch / 2, 0);
      ctx.restore();
      cx += wch + (r() - 0.5) * 1.5;
    }
    ctx.restore();
  };

  // ===================== geometry + timing helpers (from the reference XE engine, unchanged) =====================
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const win = (t, a, b) => clamp((t - a) / (b - a));
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const camAt = (keys, t) => {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b[0]) {
        const u = eio((t - a[0]) / Math.max(1e-6, b[0] - a[0]));
        return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, Math.exp(Math.log(a[3]) + (Math.log(b[3]) - Math.log(a[3])) * u)];
      }
    }
    return keys[keys.length - 1].slice(1);
  };
  const circ = (x, y, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 0) => {
    n = n || Math.max(12, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 6)); const o = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
    return o;
  };
  const quad = (p0, p1, p2, n = 30) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, m = 1 - t; o.push([m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0], m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1]]); } return o; };
  const cubic = (p0, p1, p2, p3, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, m = 1 - t; o.push([m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]); } return o; };
  const rrect = (x, y, w, h, r) => {
    const o = [[x + r, y], [x + w - r, y]]; o.push(...circ(x + w - r, y + r, r, r, -Math.PI / 2, 0, 5).slice(1));
    o.push([x + w, y + h - r]); o.push(...circ(x + w - r, y + h - r, r, r, 0, Math.PI / 2, 5).slice(1));
    o.push([x + r, y + h]); o.push(...circ(x + r, y + h - r, r, r, Math.PI / 2, Math.PI, 5).slice(1));
    o.push([x, y + r]); o.push(...circ(x + r, y + r, r, r, Math.PI, Math.PI * 1.5, 5).slice(1));
    o.push([x + r + 6, y - 1]); return o;
  };
  const head = (P, len = 20, spread = 0.5) => {
    const a = P[P.length - 1], b = P[Math.max(0, P.length - 4)], an = Math.atan2(a[1] - b[1], a[0] - b[0]);
    return [[a[0] - Math.cos(an - spread) * len, a[1] - Math.sin(an - spread) * len], a, [a[0] - Math.cos(an + spread) * len, a[1] - Math.sin(an + spread) * len]];
  };
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const tipOf = (items, t, measure) => {
    let tip = null;
    for (const it of items) {
      if (it.inst || it.k === 'dot') continue;
      const p = win(t, it.a, it.b);
      if (p > 0 && p < 1) {
        if (it.k === 'line') { const P = it.pts; tip = P[Math.min(P.length - 1, Math.floor(p * (P.length - 1)))]; }
        else tip = measure ? measure(it, p) : [it.x, it.y];
      }
    }
    return tip;
  };

  // ===================== board residue: ghosts of earlier, half-erased lessons =====================
  // GHOST = { x0, y0, w, h, draw(gc, wl), haze: [[cx, cy, rx, ry], ...] } in world space. DEFAULT_GHOST is the
  // reference's own residue (fits a board spanning roughly x -200..3400, y -100..1300).
  const DEFAULT_GHOST = {
    x0: -200, y0: -100, w: 3600, h: 1400,
    draw(gc, wl) {
      gc.font = '400 52px "Permanent Marker"'; gc.fillText('WEEK 6 QUIZ', 850, 118);
      gc.font = '700 34px "Kalam"';
      ['- read ch. 4', '- lab due Fri', '- bring calc!'].forEach((t, i) => gc.fillText(t, 872, 182 + i * 44));
      wl([[840, 138], [1020, 135], [1210, 132]], 1);
      gc.beginPath(); gc.arc(190, 588, 72, 0, 7); gc.stroke();
      gc.beginPath(); gc.moveTo(190, 588); gc.lineTo(190, 516); gc.moveTo(190, 588); gc.lineTo(252, 626); gc.stroke();
      wl([[300, 660], [360, 600], [420, 630], [520, 540]], 2);
      gc.font = '700 30px "Kalam"'; gc.fillText('sales / mo', 330, 694);
      gc.font = '400 40px "Permanent Marker"'; gc.fillText('f(x) = w·x + b', 1740, 830);
      wl([[1730, 850], [1890, 846], [2030, 852]], 3, 1.4);
      gc.beginPath(); gc.rect(3070, 300, 150, 80); gc.stroke();
      wl([[3010, 340], [3062, 340]], 4, 0.8);
      gc.font = '700 30px "Kalam"'; gc.fillText('step 2', 3100, 350);
      gc.font = '400 44px "Permanent Marker"'; gc.fillText('HW: p. 112', 2180, 1086);
      gc.beginPath(); gc.rect(2560, 1030, 200, 84); gc.stroke();
      wl([[2470, 1070], [2550, 1072]], 5, 0.8);
      gc.font = '700 30px "Kalam"'; gc.fillText('#3, #7', 2800, 1084);
    },
    haze: [[1040, 180, 200, 70], [330, 600, 200, 80], [1880, 820, 160, 30], [3140, 340, 90, 40], [2470, 1070, 330, 40]],
  };
  const XC = {}; // caches for static textures (output still depends only on t)
  const ghostBoard = (G) => {
    if (XC.ghost) return XC.ghost;
    const { x0, y0, w, h } = G, s = 0.5;
    const nz = H.makeNoise(23);
    const g = H.layer(w * s, h * s), gc = g.getContext('2d');
    gc.scale(s, s); gc.translate(-x0, -y0);
    gc.strokeStyle = '#30343c'; gc.fillStyle = '#30343c'; gc.lineCap = 'round'; gc.lineJoin = 'round'; gc.lineWidth = 7;
    const wl = (pts, sd, amp = 1.8) => { tracePath(gc, wobble(seg(pts), nz, sd, amp)); gc.stroke(); };
    G.draw(gc, wl);
    // eraser-wipe mask: the residue survives only in streaky swipe bands
    const m = H.layer(w * s, h * s), mc = m.getContext('2d'), rm = H.rng(77);
    mc.scale(s, s); mc.translate(-x0, -y0); mc.lineCap = 'round';
    const n = Math.round(230 * (w * h) / (3600 * 1400));
    for (let i = 0; i < n; i++) {
      const y = rm.range(y0 + 100, y0 + h - 50), x = rm.range(x0 + 50, x0 + w - 100), len = rm.range(150, 420);
      mc.strokeStyle = `rgba(0,0,0,${rm.range(0.15, 0.8)})`; mc.lineWidth = rm.range(4, 26);
      mc.beginPath(); mc.moveTo(x, y); mc.quadraticCurveTo(x + len / 2, y + rm.range(-30, 30), x + len, y + rm.range(-18, 18)); mc.stroke();
    }
    gc.setTransform(1, 0, 0, 1, 0, 0); gc.globalCompositeOperation = 'destination-in'; gc.drawImage(m, 0, 0);
    const cv = H.layer(w * s, h * s), c = cv.getContext('2d');
    c.filter = 'blur(0.5px)'; c.globalAlpha = 0.12; c.drawImage(g, 0, 0); c.globalAlpha = 1;
    // grey eraser haze smeared over each old lesson
    const rh = H.rng(78);
    c.scale(s, s); c.translate(-x0, -y0); c.lineCap = 'round'; c.filter = 'blur(3px)';
    (G.haze || []).forEach(([cx, cy, rx, ry]) => {
      for (let i = 0; i < 4; i++) {
        const x = cx + rh.range(-rx, rx) * 0.6, y = cy + rh.range(-ry, ry);
        c.strokeStyle = `rgba(120,128,135,${rh.range(0.014, 0.03)})`; c.lineWidth = rh.range(30, 60);
        c.beginPath(); c.moveTo(x - 120, y); c.quadraticCurveTo(x, y + rh.range(-25, 25), x + 120, y + rh.range(-10, 10)); c.stroke();
      }
    });
    const out = { cv, x0, y0, w, h };
    let ready = true;
    try { ready = document.fonts.check('400 52px "Permanent Marker"') && document.fonts.check('700 34px "Kalam"'); } catch (e) { /* assume ready */ }
    if (ready) XC.ghost = out;
    return out;
  };
  // Streaky felt-eraser brush (reference, unchanged)
  const FIBRES = (() => {
    const r = H.rng(313), out = [];
    for (let i = 0; i < 16; i++) out.push({ dy: (r() - 0.5) * 118, w: 5 + r() * 14, a: 0.45 + r() * 0.5 });
    return out;
  })();

  // ===================== palette + fonts (the style's, do not change) =====================
  const COLS = { ink: '#1d1f26', acc1: '#1f4fc2', acc2: '#d4262f', acc3: '#16884a' }; // black, blue, red, green
  const FONT = { title: '"Permanent Marker"', label: '"Kalam"', num: '"Permanent Marker"' };
  const FW = { title: 400, label: 700, num: 400 };
  const NZ = H.makeNoise(11);

  // ===================== the frame renderer =====================
  // PIECE: { DURATION, CAMERA: [[t, x, y, zoom], ...], build(t, A), ERASES?: [...], GHOST?: obj | false, BOARD?: [x0, y0, x1, y1] }
  // ERASES: [{ a, b, groups: ['C', ...], x0, x1, y0, y1, rows = 7 }] — the felt eraser zig-zags x0..x1 over rows
  //   from y0 to y1 between a and b; items whose group is listed live on that erase's layer and get wiped.
  function storyItems(PIECE, t) {
    const items = [];
    const line = (pts, role, w, a, b, g) => items.push({ k: 'line', pts, role, w, a, b, g });
    const text = (s, x, y, size, font, role, a, b, opt = {}) => items.push({ k: 'text', s, x, y, size, font, role, a, b, rot: opt.rot || 0, align: opt.align || 'left', g: opt.g });
    const dot = (x, y, r, role, a, g) => items.push({ k: 'dot', x, y, r, role, a, b: a + 0.05, g });
    const push = (it) => items.push(it);
    PIECE.build(t, { line, text, dot, push, t, ...WB.geo });
    return items;
  }

  function render(ctx, W, H_, t, PIECE) {
    const nz = NZ;
    const items = storyItems(PIECE, t);
    const cam = camAt(PIECE.CAMERA, t);
    const apply = (c) => { c.translate(W / 2, H_ / 2); c.scale(cam[2], cam[2]); c.translate(-cam[0], -cam[1]); };
    const toS = ([x, y]) => [(x - cam[0]) * cam[2] + W / 2, (y - cam[1]) * cam[2] + H_ / 2];
    const LAYOUT = [];

    // ---------- board ----------
    const bg = ctx.createLinearGradient(0, 0, W, H_);
    bg.addColorStop(0, '#f6f8f7'); bg.addColorStop(0.55, '#ecefee'); bg.addColorStop(1, '#dfe4e3');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H_);
    ctx.save(); apply(ctx);
    { // faint residue blotches fixed to the board
      const [bx0, by0, bx1, by1] = PIECE.BOARD || [-200, -200, 3600, 1400];
      const n = Math.round(40 * ((bx1 - bx0) * (by1 - by0)) / (3800 * 1600));
      const rb = H.rng(5);
      for (let i = 0; i < n; i++) {
        const x = rb.range(bx0, bx1), y = rb.range(by0, by1), rr = rb.range(80, 260);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, `rgba(150,160,165,${rb.range(0.02, 0.045)})`); g.addColorStop(1, 'rgba(150,160,165,0)');
        ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
    }
    if (PIECE.GHOST !== false) { const G = ghostBoard(PIECE.GHOST || DEFAULT_GHOST); ctx.drawImage(G.cv, G.x0, G.y0, G.w, G.h); }
    ctx.restore();

    const measure = (it, p) => {
      ctx.save(); ctx.font = `${FW[it.font]} ${it.size}px ${FONT[it.font]}`;
      const w = ctx.measureText(it.s).width, x0 = it.align === 'center' ? it.x - w / 2 : it.x;
      const w2 = ctx.measureText(it.s.slice(0, Math.ceil(it.s.length * p))).width; ctx.restore();
      return [x0 + w2, it.y - it.size * 0.35];
    };
    const drawItem = (c, it) => {
      const p = it.inst ? 1 : win(t, it.a, it.b);
      if (p <= 0) return;
      const col = COLS[it.role] || it.role;
      if (it.k === 'line') {
        const seed = ((it.pts[0][0] * 13 + it.pts[0][1] * 7) | 0) + 17;
        const P = wobble(seg(it.pts, 2.5), nz, seed % 97, it.inst ? 0.6 : 1.4);
        marker(c, P, col, it.w * 1.25, seed, p);
      } else if (it.k === 'dot') {
        c.fillStyle = H.rgba(col, 0.85); c.beginPath(); c.arc(it.x, it.y, it.r, 0, 7); c.fill();
      } else {
        const font = `${FW[it.font]} ${it.size}px ${FONT[it.font]}`;
        c.save(); c.font = font; const w = c.measureText(it.s).width; c.restore();
        const x0 = it.align === 'center' ? it.x - w / 2 : it.x;
        mText(c, it.s, x0, it.y, font, col, (it.s.length * 31 + (it.x | 0)) % 991, p, it.rot);
        const [sx, sy] = toS([x0, it.y - it.size * 0.8]);
        if (!c.__wiped) LAYOUT.push({ id: it.s, kind: 'text', x: sx, y: sy, w: w * cam[2], h: it.size * cam[2], size: it.size * cam[2] });
      }
    };
    // items of erased groups live on their erase's layer
    const ERASES = PIECE.ERASES || [];
    const layers = ERASES.map(() => { const L = H.layer(W, H_); return { L, c: L.getContext('2d') }; });
    const layerOf = (it) => { const i = ERASES.findIndex((e) => e.groups.includes(it.g)); return i < 0 ? null : layers[i].c; };
    layers.forEach(({ c }, i) => { c.save(); apply(c); c.__wiped = t > ERASES[i].a; }); // wiped text leaves the layout check
    ctx.save(); apply(ctx);
    for (const it of items) drawItem(layerOf(it) || ctx, it);
    ctx.restore(); layers.forEach(({ c }) => c.restore());

    let eraserAt = null;
    ERASES.forEach((E, ei) => {
      const ec = layers[ei].c;
      if (t > E.a) {
        const u = win(t, E.a, E.b), path = [];
        const { x0, x1, y0, y1 } = E, rows = E.rows || 7;
        for (let r = 0; r <= rows; r++) { const y = y0 + (y1 - y0) * r / rows; path.push(r % 2 ? [x1, y] : [x0, y]); path.push(r % 2 ? [x0, y + 10] : [x1, y + 10]); }
        const P = seg(path, 12), n = Math.max(2, Math.ceil(P.length * u));
        const wipe = (c2, m) => {
          c2.lineCap = 'round'; c2.lineJoin = 'round';
          const sweep = (dy) => { c2.beginPath(); P.slice(0, m).forEach(([x, y], i) => (i ? c2.lineTo(x, y + dy) : c2.moveTo(x, y + dy))); c2.stroke(); };
          c2.strokeStyle = 'rgba(0,0,0,0.95)'; c2.lineWidth = 135; sweep(0);
          for (const f of FIBRES) { c2.strokeStyle = `rgba(0,0,0,${f.a})`; c2.lineWidth = f.w; sweep(f.dy); }
        };
        ec.save(); apply(ec); ec.globalCompositeOperation = 'destination-out';
        if (u < 1) wipe(ec, n);
        else {
          const key = 'wipe' + ei;
          if (!XC[key]) {
            const mx0 = x0 - 100, my0 = y0 - 90, mw = (x1 - x0) + 180, mh = (y1 - y0) + 180, s = 0.5;
            const mcv = H.layer(mw * s, mh * s), mc = mcv.getContext('2d');
            mc.scale(s, s); mc.translate(-mx0, -my0); wipe(mc, P.length);
            XC[key] = { cv: mcv, mx0, my0, mw, mh };
          }
          const Wp = XC[key]; ec.drawImage(Wp.cv, Wp.mx0, Wp.my0, Wp.mw, Wp.mh);
        }
        ec.restore();
        if (u < 1) eraserAt = toS(P[n - 1]);
      }
      ctx.drawImage(layers[ei].L, 0, 0);
      if (t > E.a) { // grey eraser haze left on the wiped area
        const key = 'haze' + ei;
        if (!XC[key]) {
          const { x0, x1, y0, y1 } = E;
          const hx0 = x0 - 80, hy0 = y0 - 50, hw = (x1 - x0) + 160, hh = (y1 - y0) + 100, s = 0.5;
          const hc = H.layer(hw * s, hh * s), c = hc.getContext('2d'), rh = H.rng(79 + ei);
          c.scale(s, s); c.translate(-hx0, -hy0); c.lineCap = 'round'; c.filter = 'blur(6px)';
          for (let i = 0; i < 16; i++) {
            const x = rh.range(x0 + 110, x1 - 110), y = rh.range(y0 + 30, y1 - 10);
            c.strokeStyle = `rgba(120,128,135,${rh.range(0.007, 0.016)})`; c.lineWidth = rh.range(40, 90);
            c.beginPath(); c.moveTo(x - 200, y); c.quadraticCurveTo(x, y + rh.range(-25, 25), x + 200, y + rh.range(-12, 12)); c.stroke();
          }
          XC[key] = { cv: hc, hx0, hy0, hw, hh };
        }
        const Z = XC[key];
        ctx.save(); apply(ctx); ctx.globalAlpha = win(t, E.a, E.b);
        ctx.drawImage(Z.cv, Z.hx0, Z.hy0, Z.hw, Z.hh); ctx.restore();
      }
    });

    // ---------- gloss ----------
    const sh = ctx.createLinearGradient(220 - cam[0] * 0.15, -60, 760 - cam[0] * 0.15, 760);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); sh.addColorStop(0.46, 'rgba(255,255,255,0.22)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0.1)'); sh.addColorStop(0.53, 'rgba(255,255,255,0.24)'); sh.addColorStop(0.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H_);
    { // ceiling-light reflections sliding by with parallax
      const off = -(cam[0] - 640) * 0.15;
      for (let i = 0; i < 4; i++) {
        const x = 380 + i * 550 + off, rx = i % 2 ? 230 : 260, ry = i % 2 ? 22 : 26, y = i % 2 ? 66 : 70;
        if (x + rx < 0 || x - rx > W) continue;
        ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore();
      }
      const fo = ctx.createLinearGradient(0, H_ - 240, 0, H_);
      fo.addColorStop(0, 'rgba(60,70,80,0)'); fo.addColorStop(1, 'rgba(60,70,80,0.08)');
      ctx.fillStyle = fo; ctx.fillRect(0, H_ - 240, W, 240);
    }

    // ---------- tools: felt eraser while wiping, otherwise the marker in hand ----------
    if (eraserAt) {
      const [ex, ey] = eraserAt;
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(-0.08);
      ctx.save(); ctx.filter = 'blur(8px)'; ctx.fillStyle = 'rgba(30,40,50,0.3)'; ctx.fillRect(-70, -34, 160, 80); ctx.restore();
      const eg = ctx.createLinearGradient(0, -40, 0, 30); eg.addColorStop(0, '#6a7480'); eg.addColorStop(1, '#2c323a');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.roundRect(-80, -42, 160, 66, 10); ctx.fill();
      ctx.fillStyle = '#3b3b3b'; ctx.fillRect(-78, 18, 156, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-70, -36, 140, 5);
      ctx.restore();
    } else {
      const tp = tipOf(items, t, measure);
      if (tp) {
        const [tx, ty] = toS(tp), it = items.find((q) => !q.inst && win(t, q.a, q.b) > 0 && win(t, q.a, q.b) < 1 && q.k !== 'dot');
        const r = (items.filter((q) => !q.inst && q.k !== 'dot' && win(t, q.a, q.b) > 0 && win(t, q.a, q.b) < 1).pop() || it || { role: 'ink' }).role;
        const col = COLS[r] || r;
        const ang = 0.95, len = 230;
        ctx.save();
        ctx.save(); ctx.filter = 'blur(8px)'; ctx.fillStyle = 'rgba(40,50,60,0.25)'; ctx.translate(tx + 14, ty + 18); ctx.rotate(ang); ctx.beginPath(); ctx.roundRect(8, -14, len, 28, 12); ctx.fill(); ctx.restore();
        ctx.translate(tx, ty); ctx.rotate(ang);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(16, -6); ctx.lineTo(16, 6); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill();
        const g = ctx.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#e4e6e8'); g.addColorStop(1, '#9ea3a8');
        ctx.fillStyle = '#c9ccd0'; ctx.beginPath(); ctx.roundRect(14, -9, 20, 18, 4); ctx.fill();
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(32, -14, len - 32, 28, 10); ctx.fill();
        ctx.fillStyle = col; ctx.fillRect(len - 52, -14, 40, 28);
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(40, -9, len - 100, 4);
        ctx.fillStyle = H.rgba(col, 0.85); ctx.fillRect(70, -2, 60, 5);
        ctx.restore();
      }
    }
    H.grain(ctx, W, H_, 0.018, 9 + (Math.floor(t * 12) % 5));
    window.LAYOUT = LAYOUT;
  }

  // ===================== sound helpers for scores (from the reference explainerSound) =====================
  // WB.pen(k) -> { mk(a, b, gain, pan, material, minor), write(str, a, b, gain, pan), erase(E) }
  function pen(k) {
    const mk = (a, b, gain = 1, pan = 0, material = 'marker', minor = true) => {
      k.noise(a, { dur: 0.022, filter: 'bandpass', f: 1500, q: 1.4, gain: 0.22 * gain, a: 0.001, pan, minor }); // felt tip touching down
      k.play('stroke', a, { material, dur: b - a, gain, pan, minor });
    };
    const write = (s, a, b, gain = 0.9, pan = 0) => {
      const n = s.length, re = /\S+/g; let m;
      while ((m = re.exec(s))) mk(a + (b - a) * m.index / n, a + (b - a) * (m.index + m[0].length) / n, gain, pan);
    };
    // felt eraser: one scrub per pass, matched to the zig-zag path of an ERASES entry
    const erase = (E) => {
      const rows = E.rows || 7, passes = rows + 1, run = Math.abs(E.x1 - E.x0), step = (E.y1 - E.y0) / rows - 10;
      const total = passes * run + rows * step, sp = (E.b - E.a) / total;
      for (let r = 0; r < passes; r++) {
        const a = E.a + r * (run + step) * sp, d = run * sp, dir = r % 2 ? -1 : 1;
        for (let j = 0; j < 3; j++) k.noise(a + j * d / 3, { dur: d / 3 + 0.03, color: 'pink', filter: 'bandpass', f: 650 + j * 120, q: 0.7, gain: 0.3, a: 0.01, pan: dir * (j - 1) * 0.5 });
      }
      k.play('erase', E.a, { dur: E.b - E.a, gain: 0.6 });
    };
    return { mk, write, erase };
  }

  const WB = (window.WB = { render, pen, storyItems, COLS, FONT, FW, DEFAULT_GHOST, marker, mText, wobble, seg, ell, bez });
  WB.geo = { clamp, win, eio, camAt, circ, quad, cubic, rrect, head, fmt, ell, bez };
}
