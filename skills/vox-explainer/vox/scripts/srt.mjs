// cues.json (from gc-export) -> subs.srt.  usage (cwd = project): node <tools>/srt.mjs
import fs from 'node:fs';
const cues = JSON.parse(fs.readFileSync('cues.json', 'utf8'));
const ts = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(r).padStart(3, '0')}`; };
fs.writeFileSync('subs.srt', cues.map((c, i) => `${i + 1}\n${ts(c[0])} --> ${ts(c[1])}\n${c[2]}\n`).join('\n'), 'utf8');
console.log(cues.length, 'cues -> subs.srt');
