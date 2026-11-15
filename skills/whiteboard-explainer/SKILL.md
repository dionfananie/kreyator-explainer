---
name: whiteboard-explainer
description: Make an animated explainer video in the fixed "Whiteboard Explainer" hand-drawn style (dry-erase marker on a glossy board, marker in hand, felt-eraser scene changes, synthesized marker/eraser sound), rendered to MP4. Use when the user asks for a whiteboard explainer, a whiteboard animation of a topic, or "the whiteboard style" video. Only the story is written per video; the medium is a fixed library.
version: 1.0.0
---

# Whiteboard Explainer

The look, textures, lettering, tools, transitions and sound palette are **fixed** in `lib/` (lifted unchanged from the style reference; `examples/ai-learn.js` renders pixel-identical to it). Per video you write **one file, `piece.js`**: the story as timed world-space strokes and text, a camera path, eraser scene changes, and the sound score. Never retype or "improve" the libraries; never invent a new look.

## Flow

1. **Content.** Topic, points, numbers, takeaway, language from the user. Default 50-90 s (`DURATION`). Look up and list any fact you had to assume. On-screen text in the user's language.
2. **Storyboard as a text table** (`references/storyboard.md`) and wait for the user's OK, unless they said to go straight through. No drawn panels unless asked (then: `render.mjs --stills` of 2-3 key frames from a draft piece).
3. **Write `piece.js`** from `templates/piece.js`. API in `references/api.md`; copy idioms (arrows, counters, emphasis ring, wrong→right, eraser, camera travel) from `examples/ai-learn.js`. Read `references/style-rules.md` only when a rule is unclear.
4. **Build + check** (from a work folder with `npm i playwright-core`; Chrome or `npx playwright install chromium`; ffmpeg):
   ```bash
   S=<this skill dir>
   node $S/scripts/build.mjs piece.js piece.html            # one self-contained HTML (player, fonts, libs)
   node $S/scripts/check.mjs piece.html                     # errors, text < 28px on screen, frames > 100 ms
   node $S/scripts/layout-check.mjs piece.html              # text colliding with text
   node $S/scripts/render.mjs piece.html sheet.jpg --sheet 1   # contact sheet: look at it
   node $S/scripts/render.mjs piece.html shot --stills 12.5s,30s  # only the frames you changed
   ```
   Fix with targeted edits to `piece.js`; re-check only what changed.
5. **Render:** `node $S/scripts/render.mjs piece.html piece.mp4` (1280x720, 30 fps, score rendered offline and muxed). Optional: `node $S/scripts/sync-check.mjs piece.mp4 --cues-file piece.cues.json` (eraser starts and soft cues may read OFF-BEAT; that is fine).
6. **Deliver** the MP4 and the HTML (plays in a browser with play/pause, scrub, time, sound toggle, loop). One line on what can change.

## Rules (summary of `references/style-rules.md`)

- **Pure function of t.** No `Math.random`/`Date`; derive everything from `t`, fixed seeds, `win()`/`eio()`.
- **Explainer, not a title card.** Hook gone within ~2 s; then something changes every 1-2 s; arrows draw on to show cause and flow; labels land on what they label; one emphasis move on the key moment; short takeaway held ~1 s.
- **Flow.** Decide beat by beat. Builds on the last idea → continuous (camera travels across the same board, a label becomes the next heading, a counter grows into a chart). Story really moves on → felt-eraser wipe (`ERASES`). A mix, not a cut every beat nor one unbroken shot.
- **Accurate drawings** for the topic; don't reuse the reference's props (cats, dogs, neural net) unless they fit. Double-check facts and numbers shown.
- **Phone-legible** at 1280x720: headlines ≥ 44 px, every label ≥ 28 px, key numbers ≥ 64 px *on screen* (world size × camera zoom); frame each beat to fill most of the screen.
- **Palette roles:** ink black; blue `acc1` structure/underlines; red `acc2` errors, emphasis, feedback; green `acc3` right answers, results. Fonts: `title`/`num` Permanent Marker, `label` Kalam.
- **Sound in sync** with the same times as the picture: every draw-on gets `mk`/`write` for its exact span; eraser gets `erase(E)`; counters tick ≤ 12/s slowing as they settle; the key number is the biggest hit (`impact` + `ding`); takeaway resolves (`success`); quiet `room` bed; effects in front, ≤ 3 at once, small silences before big hits; no generic swooshes.

## Files

- `lib/harness.js` (H helpers), `lib/sound.js` (SOUND kit), `lib/whiteboard.js` (the medium + `WB.render`, `WB.pen`), `lib/fonts.css` (embedded Permanent Marker + Kalam) — fixed.
- `templates/piece.js` (skeleton), `templates/shell.html` (player page; used by build).
- `examples/ai-learn.js` — the reference explainer as a piece.
- `scripts/build.mjs`, `scripts/check.mjs`; `render.mjs`, `layout-check.mjs`, `sync-check.mjs` vendored from iart-ai/javascript-animation-skills (MIT).
- `references/api.md`, `references/storyboard.md`, `references/style-rules.md`, `references/reference-whiteboard.js` (original style source; rarely needed).
