#!/usr/bin/env node
// build.mjs: piece.js -> one self-contained HTML (fonts, H library, SOUND kit, whiteboard medium, piece, player).
// usage: node build.mjs piece.js out.html [--title "My explainer"]
// The libraries are copied in byte for byte, so nobody (human or agent) retypes them.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const [piecePath, outPath] = args;
if (!piecePath || !outPath) { console.error('usage: node build.mjs piece.js out.html [--title "..."]'); process.exit(1); }
const ti = args.indexOf('--title');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const piece = readFileSync(resolve(piecePath), 'utf8');
if (!/\bconst\s+PIECE\s*=/.test(piece)) { console.error('piece must define `const PIECE = { DURATION, CAMERA, build(t, A), score(k), ... }`'); process.exit(1); }
const title = ti >= 0 ? args[ti + 1] : (piece.match(/title:\s*['"`]([^'"`]+)/) || [, basename(piecePath, '.js')])[1];
const fill = { TITLE: title.replace(/</g, '&lt;'), FONTS: read('lib/fonts.css'), HARNESS: read('lib/harness.js'), SOUND: read('lib/sound.js'), WB: read('lib/whiteboard.js'), PIECE: piece };
// function replacer: library code contains `$` sequences that a string replacement would mangle
const html = read('templates/shell.html').replace(/\/\*@(TITLE|FONTS|HARNESS|SOUND|WB|PIECE)\*\//g, (_, k) => fill[k]);
writeFileSync(resolve(outPath), html);
console.log(`built ${outPath} (${(html.length / 1024).toFixed(0)} KB)`);
