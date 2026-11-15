// Example piece: the style reference's own explainer ("How does AI learn?", 15 s), ported to the piece format.
// Rendered through lib/whiteboard.js it matches the reference pixel for pixel — use it as a worked example of
// camera travel across one big board, a counter, a guess -> check -> adjust loop, an eraser wipe and a chart.
const PIECE = {
  title: 'How does AI learn?',
  DURATION: 15,
  CUES: [2.5, 6.4, 10.35, 11.0, 12.75, 13.05],
  // [t, worldX, worldY, zoom]: the camera follows the marker across one board
  CAMERA: [[0, 640, 360, 1.0], [2.0, 650, 362, 1.05], [2.8, 1830, 610, 0.95], [5.95, 1860, 620, 0.97], [6.55, 2580, 640, 0.9], [10.3, 2600, 645, 0.93],
    [10.95, 2560, 660, 0.92], [12.9, 2570, 670, 0.95], [13.6, 2560, 760, 0.88], [15, 2560, 760, 0.9]],
  // the felt eraser wipes the loop (group C) and the model (group M) to make room for the chart
  ERASES: [{ a: 10.35, b: 11.0, groups: ['C', 'M'], x0: 2040, x1: 3060, y0: 250, y1: 1050, rows: 7 }],

  build(t, A) {
    const { line, text, dot, push, win, eio, circ, cubic, rrect, head, fmt } = A;
    const cat = (x, y, s) => [
      circ(x, y + 0.06 * s, 0.3 * s, 0.27 * s, -1.2, 5.1),
      [[x - 0.27 * s, y - 0.02 * s], [x - 0.24 * s, y - 0.34 * s], [x - 0.07 * s, y - 0.2 * s]],
      [[x + 0.07 * s, y - 0.2 * s], [x + 0.24 * s, y - 0.34 * s], [x + 0.27 * s, y - 0.02 * s]],
      [[x - 0.03 * s, y + 0.1 * s], [x, y + 0.13 * s], [x + 0.03 * s, y + 0.1 * s]],
      [[x - 0.12 * s, y + 0.12 * s], [x - 0.36 * s, y + 0.08 * s]], [[x - 0.12 * s, y + 0.16 * s], [x - 0.35 * s, y + 0.2 * s]],
      [[x + 0.12 * s, y + 0.12 * s], [x + 0.36 * s, y + 0.08 * s]], [[x + 0.12 * s, y + 0.16 * s], [x + 0.35 * s, y + 0.2 * s]],
    ];
    const dog = (x, y, s) => [
      circ(x, y + 0.04 * s, 0.26 * s, 0.28 * s, -1.4, 4.9),
      circ(x - 0.29 * s, y + 0.04 * s, 0.09 * s, 0.2 * s, 0, 6.4),
      circ(x + 0.29 * s, y + 0.04 * s, 0.09 * s, 0.2 * s, 0, 6.4),
      circ(x, y + 0.15 * s, 0.07 * s, 0.045 * s, 0, 6.4),
      [[x - 0.08 * s, y + 0.23 * s], [x, y + 0.26 * s], [x + 0.08 * s, y + 0.23 * s]],
    ];
    const eyes = (x, y, s, dy = 0.02) => [[x - 0.1 * s, y + dy * s], [x + 0.1 * s, y + dy * s]];

    // ---- 1 HOOK ----
    const TX = 640, TY = 350;
    text('How does AI learn?', TX, TY, 84, 'title', 'ink', 0.15, 1.3, { align: 'center', rot: -0.015, g: 'A' });
    line([[TX - 330, TY + 32], [TX + 330, TY + 24]], 'acc1', 7, 1.3, 1.55, 'A');
    // ---- 2 DATA ----
    const MX = 2250, MY = 640;
    const mAdj = eio(win(t, 8.95, 9.5));
    { // the model: a box with a small neural net and three weight knobs (group M)
      const cx = MX, cy = MY, g = 'M';
      line(rrect(cx - 170, cy - 152, 340, 330, 34), 'ink', 6, 2.5, 2.85, g);
      const cols = [[cx - 110, [-110, -50, 10]], [cx, [-125, -75, -25, 25]], [cx + 110, [-90, -10]]];
      const nodes = cols.map(([x, ys]) => ys.map((y) => [x, cy + y]));
      let li = 0;
      for (let c = 0; c < 2; c++) for (const a of nodes[c]) for (const b of nodes[c + 1]) {
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
        const P = [[a[0] + ux * 16, a[1] + uy * 16], [b[0] - ux * 16, b[1] - uy * 16]];
        line(P, 'acc1', 2.6, 2.95 + li * 0.012, 3.05 + li * 0.012, g);
        if ([1, 6, 9, 15].includes(li)) line(P, 'acc3', 6, 9.15 + li * 0.01, 9.3 + li * 0.01, g); // strengthened weights
        li++;
      }
      nodes.flat().forEach(([x, y], i) => line(circ(x, y, 14, 14, -1.6 + i, -1.6 + i + 6.6), 'acc1', 4.5, 2.8 + i * 0.015, 2.88 + i * 0.015, g));
      [-1, 0, 1].forEach((k, i) => {
        const x = cx + k * 92, y = cy + 98;
        line(circ(x, y, 26, 26, -1.2, 5.2), 'ink', 4, 3.0 + i * 0.05, 3.12 + i * 0.05, g);
        if (t > 3.15 + i * 0.05) {
          const a0 = [-2.4, -0.6, -1.9][i], a1 = [-0.7, -2.2, -0.4][i];
          const a = a0 + (a1 - a0) * mAdj + Math.sin(mAdj * Math.PI) * 0.25;
          push({ k: 'line', pts: [[x, y], [x + Math.cos(a) * 20, y + Math.sin(a) * 20]], role: mAdj > 0 && mAdj < 1 ? 'acc2' : 'ink', w: 4.5, a: -1, b: 0, inst: true, g });
        }
      });
      text('weights', cx, cy + 158, 30, 'label', 'ink', 3.2, 3.35, { align: 'center', g });
    }
    text('model', MX, MY + 228, 38, 'label', 'ink', 3.15, 3.4, { align: 'center', g: 'M' });
    const CS = 118, cx0 = MX - 870, cy0 = MY - 175;
    for (let i = 0; i < 6; i++) {
      const col = i % 3, row = (i / 3) | 0, x = cx0 + col * 150 + (row ? 40 : 0), y = cy0 + row * 170, isCat = [1, 0, 1, 1, 0, 0][i];
      const a = 3.0 + i * 0.17;
      line(rrect(x - CS / 2, y - CS / 2, CS, CS, 12), 'ink', 4, a, a + 0.12, 'B');
      (isCat ? cat : dog)(x, y - 6, CS * 0.82).forEach((p) => line(p, 'ink', 3.2, a + 0.1, a + 0.22, 'B'));
      eyes(x, y - 6, CS * 0.82).forEach(([ex, ey]) => dot(ex, ey, 3.2, 'ink', a + 0.22, 'B'));
      const tx = x + 18, ty = y + CS / 2 - 4;
      line([[tx, ty], [tx + 70, ty], [tx + 84, ty + 19], [tx + 70, ty + 38], [tx, ty + 38], [tx, ty]], isCat ? 'acc1' : 'acc3', 3, a + 0.2, a + 0.3, 'B');
      text(isCat ? 'cat' : 'dog', tx + 8, ty + 30, 31, 'label', isCat ? 'acc1' : 'acc3', a + 0.28, a + 0.36, { g: 'B' });
    }
    const fa = cubic([cx0 + 370, MY - 10], [cx0 + 470, MY - 60], [MX - 260, MY - 40], [MX - 165, MY - 10]);
    line(fa, 'ink', 5, 4.15, 4.45, 'B'); line(head(fa, 24), 'ink', 5, 4.45, 4.55, 'B');
    if (t > 4.5 && t < 6.2) { // little example cards streaming along the arrow
      for (let k = 0; k < 9; k++) {
        const u = ((t - 4.5) * 0.9 + k / 9) % 1, ix = Math.min(fa.length - 1, Math.floor(u * fa.length));
        const [px, py] = fa[ix], sz = 26 * (1 - 0.5 * u);
        if (t - 4.5 < k / 9 / 0.9) continue;
        push({ k: 'line', pts: rrect(px - sz / 2, py - sz / 2 - 18, sz, sz, 4), role: k % 2 ? 'acc1' : 'acc3', w: 2.5, a: -1, b: 0, g: 'F', inst: true });
      }
    }
    if (t > 4.5) { // counter, numerals redrawn on twos
      const u = win(Math.floor(t * 12) / 12, 4.55, 5.25), n = u >= 1 ? 1e6 : (Math.pow(10, u * 6) - 1) / (1e6 - 1) * 1e6;
      push({ k: 'text', s: fmt(n), x: cx0 + 150, y: cy0 + 425, size: 76, font: 'num', role: 'ink', a: -1, b: 0, align: 'center', g: 'B', inst: true, live: true });
      text('examples', cx0 + 150, cy0 + 472, 36, 'label', 'ink', 4.55, 4.8, { align: 'center', g: 'B' });
    }
    // ---- 3 GUESS -> CHECK -> ADJUST ----
    const qx = MX, qy = MY - 300;
    line(rrect(qx - 62, qy - 62, 124, 124, 12), 'acc2', 4, 6.4, 6.55, 'C');
    cat(qx, qy - 4, 100).forEach((p) => line(p, 'ink', 3.2, 6.5, 6.7, 'C'));
    eyes(qx, qy - 4, 100).forEach(([ex, ey]) => dot(ex, ey, 3, 'ink', 6.7, 'C'));
    text('new!', qx + 72, qy - 30, 30, 'label', 'acc2', 6.65, 6.8, { g: 'C' });
    const dn = [[qx, qy + 70], [qx + 2, MY - 170]];
    line(dn, 'ink', 5, 6.8, 6.95, 'C'); line(head(dn, 18), 'ink', 5, 6.95, 7.02, 'C');
    const gA = [[MX + 175, MY - 10], [MX + 300, MY - 14], [MX + 400, MY - 8]];
    line(gA, 'ink', 5, 7.02, 7.2, 'C'); line(head(gA, 20), 'ink', 5, 7.2, 7.26, 'C');
    text('Guess', MX + 290, MY - 40, 38, 'label', 'ink', 7.15, 7.4, { align: 'center', g: 'C' });
    const BX = MX + 540, BY = MY - 10;
    line(rrect(BX - 120, BY - 55, 240, 110, 40), 'ink', 5, 7.3, 7.5, 'C');
    line([[BX - 70, BY + 52], [BX - 96, BY + 92], [BX - 40, BY + 54]], 'ink', 5, 7.48, 7.55, 'C');
    text('dog?', BX, BY + 18, 52, 'title', 'ink', 7.52, 7.75, { align: 'center', g: 'C' });
    text('Check', BX, BY - 82, 38, 'label', 'acc2', 7.85, 8.05, { align: 'center', g: 'C' });
    line([[BX + 140, BY - 40], [BX + 200, BY + 30]], 'acc2', 8, 8.0, 8.08, 'C');
    line([[BX + 200, BY - 40], [BX + 140, BY + 30]], 'acc2', 8, 8.08, 8.16, 'C');
    line(circ(BX + 4, BY + 2, 150, 82, -2.2, 4.4), 'acc2', 5, 8.15, 8.45, 'C'); // emphasis ring
    const back = cubic([BX - 60, BY + 70], [BX - 80, BY + 290], [MX + 290, MY + 300], [MX + 155, MY + 190]);
    line(back, 'acc2', 6, 8.45, 8.95, 'C'); line(head(back, 22), 'acc2', 6, 8.95, 9.02, 'C');
    text('Adjust', (BX + MX) / 2 - 10, MY + 315, 40, 'label', 'acc2', 8.8, 9.05, { align: 'center', g: 'C' });
    if (t > 8.95 && t < 9.4) { // error signal travelling back
      const u = win(t, 8.95, 9.35), p = back[Math.min(back.length - 1, Math.floor((1 - u) * (back.length - 1)))];
      push({ k: 'dot', x: p[0], y: p[1], r: 13, role: 'acc2', a: -1, b: 0, g: 'C', inst: true });
    }
    line([[BX - 66, BY + 4], [BX - 20, BY - 6], [BX + 24, BY + 6], [BX + 66, BY - 4]], 'ink', 5, 9.5, 9.62, 'C'); // strike
    text('cat', BX + 30, BY + 118, 52, 'title', 'acc3', 9.62, 9.85, { align: 'center', g: 'C' });
    line([[BX + 92, BY + 96], [BX + 112, BY + 122], [BX + 156, BY + 66]], 'acc3', 8, 9.85, 10.05, 'C');
    // ---- 4 PROGRESS (drawn where the loop was, after the eraser) ----
    const D = [2560, 640], pT = 11.0, kT = 13.05;
    const ox = D[0] - 380, oy = D[1] + 150, cw = 560, ch = 330;
    line([[ox, oy - ch], [ox, oy], [ox + cw, oy]], 'ink', 5, pT, pT + 0.35, 'D');
    line(head([[ox, oy], [ox, oy - ch]], 16), 'ink', 5, pT + 0.35, pT + 0.4, 'D');
    line(head([[ox, oy], [ox + cw, oy]], 16), 'ink', 5, pT + 0.4, pT + 0.45, 'D');
    text('training rounds', ox + cw / 2, oy + 48, 34, 'label', 'ink', pT + 0.3, pT + 0.55, { align: 'center', g: 'D' });
    const cpts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, acc = 61 + 36 * (1 - Math.pow(1 - u, 2.2)) + (i % 3 === 1 ? -2.5 : i % 3 === 2 ? 1.5 : 0) * (1 - u);
      cpts.push([ox + 20 + u * (cw - 50), oy - (acc - 50) / 50 * ch]);
    }
    line(cpts, 'acc1', 6, pT + 0.5, pT + 1.7, 'D');
    text('accuracy', D[0] + 330, D[1] - 120, 40, 'label', 'ink', pT + 0.45, pT + 0.7, { align: 'center', g: 'D' });
    if (t > pT + 0.55) {
      const u = win(Math.floor(t * 12) / 12, pT + 0.6, pT + 1.7), v = 61 + 36 * (1 - Math.pow(1 - u, 2.2));
      push({ k: 'text', s: Math.round(v) + '%', x: D[0] + 330, y: D[1] + 10, size: 110, font: 'num', role: u >= 1 ? 'acc3' : 'ink', a: -1, b: 0, align: 'center', g: 'D', inst: true, live: true });
    }
    line(circ(D[0] + 335, D[1] - 25, 140, 90, -2.4, 4.2), 'acc2', 6, pT + 1.75, pT + 2.05, 'D');
    // ---- 5 TAKEAWAY ----
    text('More examples → better guesses', D[0], D[1] + 290, 62, 'title', 'ink', kT, kT + 0.75, { align: 'center', rot: -0.01, g: 'E' });
    line([[D[0] - 450, D[1] + 316], [D[0] + 455, D[1] + 308]], 'acc1', 6, kT + 0.75, kT + 0.95, 'E');
  },

  // Sound: same times as the picture. Pen strokes for every draw-on, eraser scrubs, ticking counters, hits.
  score(k) {
    const { mk, write, erase } = WB.pen(k);
    const pT = 11.0, kT = 13.05;
    k.bed('room', 0, 15, { gain: 0.5 });
    k.play('pop', 0.03, { f: 330, gain: 0.45, minor: true }); // cap off
    write('How does AI learn?', 0.15, 1.3, 0.95);
    mk(1.3, 1.55, 1.15, 0, 'marker', false);
    mk(2.5, 2.8, 1.0, 0, 'marker', false);
    for (let i = 0; i < 9; i += 3) mk(2.8 + i * 0.015, 2.85 + i * 0.015, 0.7);
    for (let i = 0; i < 6; i++) { const a = 3.0 + i * 0.17; mk(a, a + (i < 5 ? 0.15 : 0.21), 0.85, (i % 3 - 1) * 0.15); }
    mk(4.15, 4.45, 1.0); mk(4.46, 4.55, 0.9);
    k.play('paper', 4.5, { dur: 1.6, gain: 0.4, minor: true });
    write('examples', 4.55, 4.8, 0.7);
    for (let f = 55; f < 63; f++) k.play('count', f / 12, { gain: 0.85, f: 3800 + (f - 55) * 180, minor: true });
    k.play('tock', 63 / 12, { f: 620, gain: 0.45 });
    [[6.4, 6.53], [6.55, 6.66], [6.67, 6.79], [6.8, 6.94], [6.96, 7.02], [7.03, 7.14]].forEach(([a, b]) => mk(a, b, 0.9));
    write('Guess', 7.16, 7.29, 0.75);
    mk(7.3, 7.47, 0.9); mk(7.48, 7.53, 0.8);
    write('dog?', 7.54, 7.75, 1.0);
    write('Check', 7.86, 8.0, 0.7);
    mk(8.0, 8.08, 1.7, 0.1, 'sharpie', false); mk(8.08, 8.15, 1.7, 0.1, 'sharpie', false);
    k.play('error', 8.0, { f: 'F3', gain: 0.6 });
    mk(8.16, 8.45, 1.1, 0, 'sharpie');
    mk(8.45, 8.79, 1.0); write('Adjust', 8.8, 9.05, 0.75);
    for (let i = 0, x = 8.97; x < 9.48; i++, x += 0.07 + i * 0.006) k.play('click', x, { f: 1100, gain: 0.55, pan: -0.15, minor: true });
    mk(9.16, 9.45, 0.8);
    mk(9.5, 9.62, 1.1);
    write('cat', 9.62, 9.85, 1.0);
    mk(9.85, 10.05, 1.1, 0, 'marker', false);
    k.play('success', 9.98, { gain: 0.8 });
    erase(PIECE.ERASES[0]);
    mk(pT, pT + 0.29, 1.0);
    write('training rounds', pT + 0.3, pT + 0.44, 0.65);
    write('accuracy', pT + 0.45, pT + 0.7, 0.7);
    mk(pT + 0.7, pT + 1.7, 0.55);
    { let last = -1;
      for (let f = Math.ceil((pT + 0.6) * 12); f < 153; f++) {
        const u = Math.min(1, (f / 12 - (pT + 0.6)) / 1.1), v = Math.round(61 + 36 * (1 - Math.pow(1 - u, 2.2)));
        if (v !== last) { k.play('tick', f / 12, { gain: 0.8, f: 3000 + (v - 61) * 30, pan: 0.2, minor: true }); last = v; }
      } }
    k.play('impact', 153 / 12, { gain: 0.85 });
    k.play('ding', 153 / 12 + 0.01, { f: 'E6', gain: 0.55 });
    mk(pT + 1.75, pT + 2.05, 1.2, 0.2, 'sharpie', false);
    write('More examples → better guesses', kT, kT + 0.75, 0.9);
    k.play('success', kT + 0.75, { f: 'G5', gain: 0.7 });
    mk(kT + 0.75, kT + 0.95, 1.1, 0, 'marker', false);
    k.play('click', 14.35, { f: 1300, gain: 0.9, minor: true }); // cap back on
  },
};
