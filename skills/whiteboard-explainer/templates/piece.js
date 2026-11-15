// piece.js — the ONLY file written per video. Copy this, fill it in, then:
//   node <skill>/scripts/build.mjs piece.js out.html
// World space: one big whiteboard (default residue spans x -200..3400, y -100..1300; the camera shows 1280x720 / zoom).
// Every frame is a pure function of t: no Math.random / Date; use win()/eio() of t and fixed seeds.
const PIECE = {
  title: 'TITLE',
  DURATION: 60,                 // seconds (aim 50-90)
  CUES: [],                     // seconds of every scene change / key hit (for sync-check)
  // camera keys [t, worldX, worldY, zoom], eased between keys; keep text >= 28px on screen (size * zoom)
  CAMERA: [[0, 640, 360, 1.0], [2.0, 650, 362, 1.05]],
  // felt-eraser scene changes: items whose group (opt.g / last arg) is listed get wiped between a and b
  ERASES: [
    // { a: 20.0, b: 20.65, groups: ['B'], x0: 1400, x1: 2400, y0: 200, y1: 900, rows: 7 },
  ],
  // GHOST: false,              // or { x0, y0, w, h, draw(gc, wl), haze: [[cx, cy, rx, ry]] } to change the old-lesson residue
  // BOARD: [-200, -200, 3600, 1400],  // world box the faint cleaner blotches cover

  build(t, A) {
    const { line, text, dot, push, win, eio, circ, quad, cubic, rrect, head, fmt, ell, bez } = A;
    // line(points, role, width, tStart, tEnd, group)        role: 'ink' | 'acc1' blue | 'acc2' red | 'acc3' green
    // text(str, x, y, size, font, role, tStart, tEnd, { align: 'center', rot, g })   font: 'title' | 'label' | 'num'
    // dot(x, y, r, role, t, group)
    // push({ k: 'text'|'line'|'dot', ..., a: -1, b: 0, inst: true })  -> drawn fully this frame (counters, moving things)

    // ---- 1 HOOK (gets out of the way within ~2 s) ----
    text('Your hook?', 640, 350, 84, 'title', 'ink', 0.15, 1.3, { align: 'center', rot: -0.015, g: 'A' });
    line([[310, 382], [970, 374]], 'acc1', 7, 1.3, 1.55, 'A');

    // ---- 2.. BEATS: something changes every 1-2 s; arrows draw on to show cause; labels land on what they label ----

    // ---- KEY NUMBER: counter re-scrawled on twos (12 fps), >= 64px, then circled in red ----
    // if (t > T) { const u = win(Math.floor(t * 12) / 12, T, T + 1); push({ k: 'text', s: fmt(1234 * eio(u)), x, y, size: 110, font: 'num', role: u >= 1 ? 'acc3' : 'ink', a: -1, b: 0, align: 'center', inst: true }); }

    // ---- TAKEAWAY (held ~1 s at the end) ----
  },

  // Sound: same times as the picture. WB.pen(k) gives mk (pen stroke), write (handwriting), erase (eraser passes).
  score(k) {
    const { mk, write, erase } = WB.pen(k);
    k.bed('room', 0, PIECE.DURATION, { gain: 0.5 });
    k.play('pop', 0.03, { f: 330, gain: 0.45, minor: true });   // cap off
    write('Your hook?', 0.15, 1.3, 0.95);
    mk(1.3, 1.55, 1.15, 0, 'marker', false);                    // confident underline
    // PIECE.ERASES.forEach(erase);
    // key number: ticks while it counts (<= 12/s, slowing), then k.play('impact') + k.play('ding') + a sharpie ring
    // takeaway: write(...) then k.play('success', t, { f: 'G5', gain: 0.7 })
    k.play('click', PIECE.DURATION - 0.6, { f: 1300, gain: 0.9, minor: true }); // cap back on
  },
};
