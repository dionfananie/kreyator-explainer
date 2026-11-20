# Whiteboard Explainer

The look, textures, lettering, tools, transitions and sound palette are **fixed** in the skill's `lib/` (lifted unchanged from the style reference; `examples/ai-learn.js` renders pixel-identical to it). Per video you write **one file, `piece.js`**: the story as timed world-space strokes and text, a camera path, eraser scene changes, and the sound score. Never retype or "improve" the libraries; never invent a new look.

## 0. Setup (once per session)

The libraries, fonts and scripts live in the GitHub repo `dionfananie/whiteboard-explainer`. Fetch them before anything else:

```bash
S=$HOME/.cache/whiteboard-explainer/skills/whiteboard-explainer
[ -f "$S/SKILL.md" ] || git clone --depth 1 -q https://github.com/dionfananie/whiteboard-explainer "$HOME/.cache/whiteboard-explainer"
mkdir -p ~/wbx-work && cd ~/wbx-work && [ -d node_modules/playwright-core ] || npm i -s playwright-core
which ffmpeg google-chrome chromium 2>/dev/null   # need ffmpeg + Chrome (or: npx playwright install chromium)
```

If the clone fails (no network or no git), say so plainly and ask the user to attach `whiteboard-explainer.skill` (a zip of the skill folder); unzip it and set `S` to its `whiteboard-explainer` folder. Then read `$S/references/api.md` and skim `$S/examples/ai-learn.js` for the idioms.

## Flow

1. **Content.** Topic, points, numbers, takeaway, language from the user. Default 50-90 s (`DURATION`). Look up and list any fact you had to assume. On-screen text in the user's language.
2. **Storyboard as a text table** (`$S/references/storyboard.md`) and wait for the user's OK, unless they said to go straight through. No drawn panels unless asked (then: `render.mjs --stills` of 2-3 key frames from a draft piece).
3. **Write `piece.js`** in the work folder from `$S/templates/piece.js`. API in `$S/references/api.md`; copy idioms (arrows, counters, emphasis ring, wrong to right, eraser, camera travel) from `$S/examples/ai-learn.js`. Read `$S/references/style-rules.md` only when a rule is unclear.
4. **Build + check:**
   ```bash
   node $S/scripts/build.mjs piece.js piece.html            # one self-contained HTML (player, fonts, libs)
   node $S/scripts/check.mjs piece.html                     # errors, text < 28px on screen, frames > 100 ms
   node $S/scripts/layout-check.mjs piece.html              # text colliding with text
   node $S/scripts/render.mjs piece.html sheet.jpg --sheet 1   # contact sheet: look at it
   node $S/scripts/render.mjs piece.html shot --stills 12.5s,30s  # only the frames you changed
   ```
   Fix with targeted edits to `piece.js`; re-check only what changed.
5. **Render:** `node $S/scripts/render.mjs piece.html piece.mp4` (1280x720, 30 fps, score rendered offline and muxed). Optional: `node $S/scripts/sync-check.mjs piece.mp4 --cues-file piece.cues.json` (eraser starts and soft cues may read OFF-BEAT; that is fine).
6. **Deliver** the MP4 and the HTML (plays in a browser with play/pause, scrub, time, sound toggle, loop) with the file-sending tool. One line on what can change.

## Rules (summary of `references/style-rules.md`)

- **Pure function of t.** No `Math.random`/`Date`; derive everything from `t`, fixed seeds, `win()`/`eio()`.
- **Explainer, not a title card.** Hook gone within ~2 s; then something changes every 1-2 s; arrows draw on to show cause and flow; labels land on what they label; one emphasis move on the key moment; short takeaway held ~1 s.
- **Flow.** Decide beat by beat. Builds on the last idea: continuous (camera travels across the same board, a label becomes the next heading, a counter grows into a chart). Story really moves on: felt-eraser wipe (`ERASES`). A mix, not a cut every beat nor one unbroken shot.
- **Accurate drawings** for the topic; don't reuse the reference's props (cats, dogs, neural net) unless they fit. Double-check facts and numbers shown.
- **Phone-legible** at 1280x720: headlines >= 44 px, every label >= 28 px, key numbers >= 64 px *on screen* (world size x camera zoom); frame each beat to fill most of the screen.
- **Palette roles:** ink black; blue `acc1` structure/underlines; red `acc2` errors, emphasis, feedback; green `acc3` right answers, results. Fonts: `title`/`num` Permanent Marker, `label` Kalam.
- **Sound in sync** with the same times as the picture: every draw-on gets `mk`/`write` for its exact span; eraser gets `erase(E)`; counters tick <= 12/s slowing as they settle; the key number is the biggest hit (`impact` + `ding`); takeaway resolves (`success`); quiet `room` bed; effects in front, <= 3 at once, small silences before big hits; no generic swooshes.

## Files in the repo skill folder (`$S`)

- `lib/harness.js` (H helpers), `lib/sound.js` (SOUND kit), `lib/whiteboard.js` (the medium + `WB.render`, `WB.pen`), `lib/fonts.css` (embedded Permanent Marker + Kalam): fixed.
- `templates/piece.js` (skeleton), `templates/shell.html` (player page; used by build).
- `examples/ai-learn.js`: the reference explainer as a piece.
- `scripts/build.mjs`, `scripts/check.mjs`; `render.mjs`, `layout-check.mjs`, `sync-check.mjs` vendored from iart-ai/javascript-animation-skills (MIT).
- `references/api.md`, `references/storyboard.md`, `references/style-rules.md`, `references/reference-whiteboard.js` (original style source; rarely needed).