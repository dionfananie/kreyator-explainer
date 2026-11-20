// Align a one-take VO to its script, pad scene breaks to a target length, and inject timing into piece.html.
// script.txt: one subtitle cue per line; scenes separated by a line "---". Last scene = CTA.
// usage (cwd = project): node align.mjs --target 72 --lead 1.0 --dur 75 [--wav audio_v4/full.wav]
// Writes: audio_v4/edit.wav, timing.json, and replaces /*TIMING*/ ... /*END*/ in piece.html with
//   const B=[...]; window.CUES=[...]; const C=i=>CUES[i][0];  (C(i) = start of cue i in video time)
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const FF = (process.env.FFMPEG_DIR || 'C:/Users/Dion/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin').replace(/[\\/]?$/, '/');
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const target = +opt('target', 72), lead = +opt('lead', 1.0), DUR = +opt('dur', 75), wav = opt('wav', 'audio_v4/full.wav');
const maxPad = +opt('maxpad', 1.4);

const scenes = fs.readFileSync('script.txt', 'utf8').replace(/\r/g, '').split(/\n---\n/).map((s) => s.split('\n').map((l) => l.trim()).filter(Boolean));
const cues = scenes.flatMap((s, si) => s.map((t) => ({ t, si })));
const dur = +spawnSync(FF + 'ffprobe.exe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).stdout.toString().trim();
const detect = (n, d) => { const sd = spawnSync(FF + 'ffmpeg.exe', ['-hide_banner', '-i', wav, '-af', `silencedetect=n=${n}dB:d=${d}`, '-f', 'null', '-']).stderr.toString(); const out = []; let s0 = null; for (const l of sd.split('\n')) { let m; if ((m = /silence_start: ([\d.]+)/.exec(l))) s0 = +m[1]; if ((m = /silence_end: ([\d.]+)/.exec(l)) && s0 !== null) { out.push({ s: s0, e: +m[1], d: +m[1] - s0, m: (s0 + +m[1]) / 2 }); s0 = null; } } return out; };
let sil = detect(-38, 0.12);
const needK = cues.length - 1;
for (const [n, d] of [[-35, 0.09], [-32, 0.07], [-30, 0.05]]) { if (sil.length - 2 >= needK + 2) break; sil = detect(n, d); console.log(`retry silencedetect ${n}dB ${d}s -> ${sil.length}`); }
const speechStart = sil.length && sil[0].s < 0.05 ? sil[0].e : 0;
const lastSil = sil.length && sil[sil.length - 1].e > dur - 0.05 ? sil[sil.length - 1] : null;
const speechEnd = lastSil ? lastSil.s : dur;
const inner = sil.filter((x) => x.s > speechStart + 0.05 && x.e < speechEnd - 0.05);

// expected boundary times by character share (weight scene breaks slightly for the [pause])
// DP: choose K = cues-1 increasing silences as cue boundaries.
// cost per cue = squared relative error vs expected length (chars × rate) + penalty for long silences skipped inside a cue
// + penalty when a scene break lands on a short silence (scene breaks carry a [pause] tag, so they are long).
const len = cues.map((c) => c.t.replace(/[“”"]/g, '').length + 1);
const M = inner.length, K = cues.length - 1;
if (M < K) throw new Error(`only ${M} silences for ${K} boundaries`);
const bigSil = inner.map((x) => x.d).sort((p, q) => q - p);
const totalSpeech = speechEnd - speechStart - inner.reduce((p, x) => p + x.d, 0) + 0.2 * K;
const rate = totalSpeech / len.reduce((p, q) => p + q, 0);
const startOf = (j) => (j < 0 ? speechStart : inner[j].e);
const endOf = (j) => (j >= M ? speechEnd : inner[j].s);
const skipPen = (from, to) => { let p = 0; for (let i = from + 1; i < to; i++) if (inner[i].d > 0.33) p += (inner[i].d - 0.33) * 12; return p; };
const cueCost = (k, from, to) => { const d = endOf(to) - startOf(from); const e = len[k] * rate; const r = (d - e) / Math.max(e, 0.8); return 3 * r * r + (d < 0.6 ? 8 : 0) + skipPen(from, to); };
const sceneBreak = (k) => cues[k + 1].si !== cues[k].si;
const INF = 1e18;
const dp = Array.from({ length: K + 1 }, () => new Array(M).fill(INF));
const bk = Array.from({ length: K + 1 }, () => new Array(M).fill(-1));
for (let j = 0; j < M; j++) dp[0][j] = cueCost(0, -1, j) + (sceneBreak(0) && inner[j].d < 0.3 ? 6 : 0) - (sceneBreak(0) ? inner[j].d * 3 : 0);
for (let k = 1; k < K; k++) for (let j = k; j < M; j++) {
  const sp = (sceneBreak(k) && inner[j].d < 0.3 ? 6 : 0) - (sceneBreak(k) ? inner[j].d * 3 : 0);
  for (let i = k - 1; i < j; i++) { if (dp[k - 1][i] >= INF) continue; const v = dp[k - 1][i] + cueCost(k, i, j) + sp; if (v < dp[k][j]) { dp[k][j] = v; bk[k][j] = i; } }
}
let bestJ = -1, bestV = INF;
for (let j = K - 1; j < M; j++) { if (dp[K - 1][j] >= INF) continue; const v = dp[K - 1][j] + cueCost(K, j, M); if (v < bestV) { bestV = v; bestJ = j; } }
const idx = new Array(K); idx[K - 1] = bestJ;
for (let k = K - 1; k > 0; k--) idx[k - 1] = bk[k][idx[k]];
const bounds = idx.map((j, k) => ({ ...inner[j], isScene: sceneBreak(k) }));
// padding at scene breaks
const sceneB = bounds.filter((b) => b.isScene);
const extra = target - dur;
const pad = extra > 0 ? Math.min(maxPad, extra / sceneB.length) : 0;
if (extra < -0.3) console.log(`WARNING: VO ${dur.toFixed(2)}s longer than target ${target}s — no trimming done`);
const shift = (t) => t + lead + sceneB.filter((b) => b.m < t).length * pad;
// edited audio
const segs = []; let st = 0;
for (const b of sceneB) { segs.push([st, b.m]); st = b.m; }
segs.push([st, dur]);
let fc = '', lab = '';
segs.forEach(([x, y], i) => { fc += `[0]atrim=${x.toFixed(3)}:${y.toFixed(3)},asetpts=PTS-STARTPTS[s${i}];`; lab += `[s${i}]`; if (i < segs.length - 1 && pad > 0) { fc += `anullsrc=r=48000:cl=mono,atrim=0:${pad.toFixed(3)}[z${i}];`; lab += `[z${i}]`; } });
const n = segs.length + (pad > 0 ? segs.length - 1 : 0);
fc += `${lab}concat=n=${n}:v=0:a=1[o]`;
const r = spawnSync(FF + 'ffmpeg.exe', ['-v', 'error', '-y', '-i', wav, '-filter_complex', fc, '-map', '[o]', '-ar', '48000', '-ac', '1', 'audio_v4/edit.wav']);
if (r.status) throw new Error(r.stderr.toString());
const editDur = dur + pad * sceneB.length;
// cues in video time
const out = cues.map((c, k) => {
  const s = k === 0 ? speechStart : bounds[k - 1].e;
  const e = k === cues.length - 1 ? speechEnd : bounds[k].s;
  return [+shift(s).toFixed(2), +shift(e).toFixed(2), c.t];
});
// a cue with (almost) no audio of its own = reader did not pause there: split the joined span by characters
for (let k = 1; k < out.length; k++) {
  if (out[k][1] - out[k][0] < 0.6 && cues[k].si === cues[k - 1].si) {
    const s = out[k - 1][0], e = out[k][1], la = len[k - 1], lb = len[k];
    const mid = +(s + (e - s) * la / (la + lb)).toFixed(2);
    out[k - 1][1] = mid; out[k][0] = mid;
    console.log(`split cue ${k - 1}/${k} at ${mid} (no pause in audio)`);
  }
}
// "a | b" in one script line = one spoken phrase without a pause: split its time span by characters
for (let k = out.length - 1; k >= 0; k--) {
  if (!out[k][2].includes('|')) continue;
  const parts = out[k][2].split('|').map((x) => x.trim());
  const L = parts.map((x) => x.length), T = L.reduce((p, q) => p + q, 0);
  let t0 = out[k][0]; const span = out[k][1] - out[k][0];
  const rep = parts.map((x, i) => { const s = t0; t0 += span * L[i] / T; return [+s.toFixed(2), +t0.toFixed(2), x]; });
  out.splice(k, 1, ...rep);
}
const B = [0,...sceneB.map((b) => +(shift(b.m) + pad / 2).toFixed(2)), DUR];
const cuts = [0, ...sceneB.map((b) => +(shift(b.m) + pad / 2 - lead).toFixed(2)), +editDur.toFixed(2)];
fs.writeFileSync('timing.json', JSON.stringify({ B, cues: out, cuts, pad, editDur, lead }, null, 1));
if (fs.existsSync('piece.html')) {
let html = fs.readFileSync('piece.html', 'utf8');
const block = `/*TIMING*/const B=${JSON.stringify(B)};window.CUES=${JSON.stringify(out)};const C=i=>CUES[i][0];/*END*/`;
html = html.replace(/\/\*TIMING\*\/[\s\S]*?\/\*END\*\//, block);
fs.writeFileSync('piece.html', html);
}
console.log(`vo ${dur.toFixed(2)}s -> ${editDur.toFixed(2)}s (pad ${pad.toFixed(2)}s x${sceneB.length}); scenes ${scenes.length}, cues ${cues.length}`);
console.log('B', B.join(', '));
console.log('cuts', cuts.join(','));
out.forEach((c, i) => console.log(i, c[0], c[1], c[2]));
