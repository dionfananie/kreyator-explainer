# whiteboard-explainer

An agent skill for animated explainers in one fixed **Whiteboard Explainer** style: dry-erase marker on a glossy board, streaky chisel-tip strokes, a ghost of the last erased lesson, ceiling-light sheen, the marker drawing live in hand, felt-eraser scene changes, and a synthesized marker/eraser soundtrack.

The medium lives in `lib/` and never changes. Per video the agent writes one `piece.js` (story, camera, eraser changes, sound score), builds a self-contained HTML player, checks it and renders an MP4. The included example renders pixel-identical to the original style reference.

## Install

```bash
npx skills add <you>/whiteboard-explainer
# or, in Claude Code
/plugin marketplace add <you>/whiteboard-explainer
/plugin install whiteboard-explainer
```

Needs Node 18+, ffmpeg, Chrome (or `npx playwright install chromium`), and `npm i playwright-core` in the folder you work in.

## Use

Ask: "Make a whiteboard explainer about …" with your points and numbers. The agent replies with a storyboard table; approve it and it builds and renders.

Manual:

```bash
S=skills/whiteboard-explainer
cp $S/templates/piece.js my.js            # write the story
node $S/scripts/build.mjs my.js my.html
node $S/scripts/check.mjs my.html
node $S/scripts/render.mjs my.html my.mp4
```

## Credits and licenses

- `scripts/render.mjs`, `layout-check.mjs`, `sync-check.mjs`: from [iart-ai/javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills), MIT (see `scripts/LICENSE-motion-skills`); render/layout-check only add a wait for embedded fonts.
- Fonts embedded in `lib/fonts.css`: Permanent Marker (Apache 2.0) and Kalam (SIL OFL 1.1), from google/fonts; licenses in `lib/licenses/`.
- The style reference, H helpers and SOUND kit come from the original "Whiteboard Explainer" brief.
