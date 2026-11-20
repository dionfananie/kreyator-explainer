# kreyator-explainer

Agent skills for short explainer videos (Instagram Reels, TikTok, YouTube Shorts). The repo has two skills:

| Skill | What it does |
|---|---|
| [`skills/kreyator-explainer`](skills/kreyator-explainer/) | Umbrella skill. It picks a style, applies the shared rules (format, duration, VO, cover, delivery) and routes to the style guide. |
| [`skills/whiteboard-explainer`](skills/whiteboard-explainer/) | Hand-drawn whiteboard engine (libs, fonts, build/render scripts) used by the whiteboard style. |

## Styles

| Style | Look | Guide |
|---|---|---|
| **Biografi editorial** | 9:16 motion graphic: photo cards, Anton tags, wipes, burn-in subtitles. Fast "Group C" render (DOM layers exported once, composited with canvas, piped to ffmpeg). | `skills/kreyator-explainer/styles/biografi.md` |
| **Whiteboard** | Dry-erase marker on a glossy board, marker in hand, felt-eraser scene changes, synthesized marker sound. | `skills/kreyator-explainer/styles/whiteboard.md` |

## Shared rules (all styles)

- Output: 1080×1920, 9:16, 30 fps, MP4 H.264 + AAC, burn-in subtitles, safe zone 15% top and 20% bottom.
- Duration: 75 s target. Facts added to fill a short script are checked and sourced. Numbers, quotes and records are never made up.
- Voice-over: ElevenLabs, recorded as one take and then cut per scene (`audio/scene_NN.mp3`).
- Every video ends with a follow CTA. Every cover gets a brand badge (`cover-badge.mjs`).
- Delivery per video: `preview.mp4`, `cover-*.jpg`, `subs.srt`, per-scene audio, `vo-script.md` (script and sources), and `caption-metadata.md` (captions for IG, TikTok and YT Shorts). `final.mp4` is made only after approval.
- Checks before delivery: ffprobe frame count and duration, no frozen frames, black frames only at transitions, audio peak at or below −1 dB, and a contact sheet of key frames.
- The skill never publishes or schedules anything on its own.

## Install

```bash
npx skills add dionfananie/kreyator-explainer
# or, in Claude Code
/plugin marketplace add dionfananie/kreyator-explainer
/plugin install whiteboard-explainer
```

Requirements:

- Node 18+, ffmpeg/ffprobe, and Chrome or Chromium.
- Biografi style: run `npm install` in a copy of `skills/kreyator-explainer/biografi/scripts/` (installs rustwright, @napi-rs/canvas, @fontsource/anton, @fontsource/inter and playwright-core). Optional env vars: `FFMPEG_DIR`, `FFMPEG`, `RUSTWRIGHT_CHROMIUM`. `build-project.ps1` needs PowerShell.
- Whiteboard style: run `npm i playwright-core` in your work folder.
- ElevenLabs access for the voice-over.

## Use

Ask the agent, for example: "Buat video dari naskah biografi terbaru, 75 detik, jangan dipublish." It reads `SKILL.md`, picks a style (or asks), and follows that style's steps.

Whiteboard by hand:

```bash
S=skills/whiteboard-explainer
cp $S/templates/piece.js my.js            # write the story
node $S/scripts/build.mjs my.js my.html
node $S/scripts/check.mjs my.html
node $S/scripts/render.mjs my.html my.mp4
```

Biografi flow, in short (full steps in `styles/biografi.md`):

1. Write `script.txt` (one line per subtitle, `---` between scenes) and `piece.html` (start from `biografi/references/piece-contoh.html`).
2. Generate the VO in one take and save it as `audio_v4/full.wav`.
3. Run `align.mjs --target 72 --lead 1.0 --dur 75` to match text to audio and inject the timing.
4. Run `build-project.ps1 -StillsOnly …` to check stills, then do the full render with `-B … -Cover … -Vo … -Cuts …`.

## Layout

```
skills/
  kreyator-explainer/
    SKILL.md                 router + shared rules
    styles/biografi.md       editorial biography steps and pitfalls
    styles/whiteboard.md     whiteboard steps
    biografi/scripts/        Group C render, align, cover badge, Commons download, music, srt
    biografi/references/     example piece.html and script.txt
    assets/icon.png
  whiteboard-explainer/      whiteboard libs, templates, scripts, references
```

## Credits and licenses

- `whiteboard-explainer/scripts/render.mjs`, `layout-check.mjs`, `sync-check.mjs`: from [iart-ai/javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills), MIT (see `scripts/LICENSE-motion-skills`).
- Fonts in `whiteboard-explainer/lib/fonts.css`: Permanent Marker (Apache 2.0) and Kalam (SIL OFL 1.1), from google/fonts; licenses in `lib/licenses/`.
- Biografi fonts: Anton and Inter via @fontsource (SIL OFL 1.1).
- Photos used in videos come from Wikimedia Commons or the source articles. Credit them on screen and in the caption.
