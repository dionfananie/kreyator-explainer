// Synthetic underscore bed (pad + bass + soft kick + hat) with a paper whoosh at every beat change.
// Beat changes are read from cues.json: a cue that starts >= --gap s after the previous one ends.
// usage (cwd = project): node <tools>/music.mjs --dur 75 [--cues cues.json] [--gap 0.6] [--out music.wav]
// Writes 48 kHz mono 16-bit WAV. No external audio files.
import fs from 'node:fs';
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const SR = 48000, DUR = +opt('dur', 75), N = SR * DUR, OUT = opt('out', 'music.wav'), GAP = +opt('gap', 0.6);
const cues = fs.existsSync(opt('cues', 'cues.json')) ? JSON.parse(fs.readFileSync(opt('cues', 'cues.json'), 'utf8')) : [];
const B = cues.filter((c, i) => i && c[0] - cues[i - 1][1] >= GAP).map((c) => c[0] - 0.18);
const out = new Float32Array(N);
const BEAT = 0.6, BAR = 2.4;
const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
const roots = [110, 87.31, 130.81, 98];
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
let lp = 0, lpw = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const bar = Math.floor(t / BAR) % 4, tb = t % BAR, tbeat = t % BEAT;
  const ch = chords[bar];
  const env = Math.min(1, tb / 0.4) * (0.75 + 0.25 * Math.cos(2 * Math.PI * tb / BAR));
  let pad = 0; for (const f of ch) pad += Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 1.003 * t);
  pad *= 0.035 * env;
  const bass = 0.10 * Math.sin(2 * Math.PI * roots[bar] * t) * Math.exp(-tbeat * 3.5);
  const tk = t % (BEAT * 2);
  const kick = 0.28 * Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-tk * 30)) * tk) * Math.exp(-tk * 9);
  const th = (t + BEAT / 2) % BEAT;
  const n = rnd() * 2 - 1; lp += 0.5 * (n - lp); const hp = n - lp;
  const hat = 0.035 * hp * Math.exp(-th * 40);
  let wh = 0; for (const b of B) { const d = t - b; if (Math.abs(d) < 0.5) wh += Math.exp(-(d * d) / 0.02); }
  lpw += 0.08 * (n - lpw); const whoosh = 0.22 * lpw * wh;
  const fin = Math.min(1, t / 0.5) * Math.min(1, (DUR - t) / 2.5);
  out[i] = (pad + bass + kick + hat + whoosh) * fin;
}
const buf = Buffer.alloc(44 + N * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i])) * 32767), 44 + i * 2);
fs.writeFileSync(OUT, buf);
console.log(`${OUT} written, ${B.length} whooshes at ${B.map((x) => x.toFixed(2)).join(', ')}`);
