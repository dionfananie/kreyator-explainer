# Piece API (lib/whiteboard.js)

A piece is `const PIECE = { title, DURATION, CUES, CAMERA, ERASES?, GHOST?, BOARD?, build(t, A), score(k) }`.
See `templates/piece.js` (skeleton) and `examples/ai-learn.js` (complete 15 s worked example, pixel-identical to the style reference).

## build(t, A): describe the diagram as timed world-space items
- `A.line(points, role, w, a, b, group)` — marker stroke drawn on from t=a to t=b (felt tip follows it; streaky body, pooled ends, wobble). `w` ≈ 3-8.
- `A.text(str, x, y, size, font, role, a, b, { align, rot, g })` — lettered on char by char. font: `title` (Permanent Marker, headlines), `label` (Kalam 700, labels), `num` (Permanent Marker, numbers).
- `A.dot(x, y, r, role, t, group)` — ink dot (eyes, bullets).
- `A.push(item)` — raw item; `{ ..., a: -1, b: 0, inst: true }` draws it complete this frame: counters (`live`), things moving along a path, knobs turning.
- roles: `ink` #1d1f26, `acc1` blue #1f4fc2, `acc2` red #d4262f (errors, emphasis), `acc3` green #16884a (correct, result).
- geometry: `circ(x,y,rx,ry,a0,a1)`, `ell`, `quad(p0,p1,p2)`, `cubic(p0,p1,p2,p3)`, `bez`, `rrect(x,y,w,h,r)`, `head(pts,len)` (arrowhead for a path), `fmt(n)` (1,000,000), timing `win(t,a,b)` 0..1, `eio(x)` ease-in-out, `clamp`.
- Item order = draw order; the marker in hand follows the last item currently drawing.
- Arrow idiom: `const P = cubic(...); line(P, 'ink', 5, a, a+.3, g); line(head(P, 22), 'ink', 5, a+.3, a+.36, g);`
- Counter idiom (re-scrawled on twos): `const u = win(Math.floor(t * 12) / 12, a, b);` then `push({ k: 'text', s: fmt(v), ..., inst: true, live: true })`.
- Emphasis idiom: red ring `line(circ(cx, cy, rx, ry, -2.4, 4.2), 'acc2', 6, a, a + .3, g)` after the number lands; strike-through + rewrite in green for a wrong → right moment.

## CAMERA
`[[t, x, y, zoom], ...]` eased (cubic in-out, log zoom). On screen size = world size × zoom; keep labels ≥ 28 px, headlines ≥ 44, key numbers ≥ 64. Lay beats out left→right / top→bottom on one board and travel between them.

## ERASES (the medium's scene change)
`{ a, b, groups, x0, x1, y0, y1, rows = 7 }`: the felt eraser zig-zags over the box during a..b (~0.6-0.7 s), wiping every item whose group is listed, leaving streaky ghost residue and grey haze. Items of listed groups live on that eraser's layer from the start. Draw the next beat in the wiped area after b. Score it with `erase(PIECE.ERASES[i])`.

## GHOST / BOARD
The board carries faint residue of old lessons (default: the reference's, around x -200..3400, y -100..1300). If the piece's board is much bigger or elsewhere, pass `GHOST: { x0, y0, w, h, draw(gc, wl), haze }` with a few unrelated old notes (Permanent Marker/Kalam via `gc.font`, `wl(points, seed)` for wobbly lines), and `BOARD` for the blotch area. `GHOST: false` removes it (not recommended: it is part of the look).

## score(k): SOUND kit + pen helpers
`const { mk, write, erase } = WB.pen(k)`:
- `mk(a, b, gain=1, pan=0, material='marker', minor=true)` — tip touch + stroke for exactly a..b (use the same a/b as the line). `'sharpie'` for hard emphasis slashes/rings; `minor=false` for key strokes.
- `write(str, a, b, gain)` — one stroke per word, timed like the lettering.
- `erase(E)` — eraser scrubs per pass for an ERASES entry.
- Kit: `k.play(name, t, { gain, pan, f, dur, minor })` with pop, tick, click, tock, count, thud, impact, stamp, ding, success, error, paper, slap, erase, whoosh, swish…; `k.bed('room', t0, t1, { gain: .5 })`; `k.music('pad', t0, t1, { gain <= .6 })` only if it suits.
- Typical hits: cap pop at 0, cap click at end; `error` on a wrong guess; ticks ≤ 12/s on counters slowing as they settle; `impact` + `ding` on the key number; `success` on the takeaway. ≤ 3 sounds at once, small silences before big hits.
