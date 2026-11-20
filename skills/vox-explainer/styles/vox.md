# Vox Explainer — kolase kertas koran ±75 detik (Group C)

Hasil: per video satu folder `projects/<nn>-<slug>/` berisi `preview.mp4` (1080×1920, 30 fps, H.264+AAC, grain, tepat durasi × 30 frame), `subs.srt`, `check/contact.jpg`, `cover-XXXX.jpg` (opsional), `vo-script.md` (naskah, sumber, asal aset). Setelah user approve: salin `preview.mp4` → `final.mp4`.

Jangan publish/jadwalkan apa pun.

## Setup sekali
1. Salin `vox/scripts/` skill ini ke `tools/vox/` di workspace (template mengasumsikan `projects/<folder>/` dan `tools/vox/` bersaudara: `../../tools/vox/`).
2. Di `tools/vox/`: `npm install` (rustwright, @napi-rs/canvas, playwright-core). Font: Georgia (bawaan Windows).
3. Env opsional: `FFMPEG_DIR` (folder ffmpeg.exe/ffprobe.exe), `FFMPEG` (path ffmpeg untuk gc-render), `RUSTWRIGHT_CHROMIUM` (chrome.exe).

## Cara kerja template
- `vox.css`: kertas, `.card` (bergerak) + `.sheet` (diam, warna + tepi sobek), `.h` judul, `.kw/.hl/.kt` stabilo, `.stamp`, `.tape`, `.dots` halftone, `.src`, `#sub`, `#wipe`.
- `vox.js`: `voxSetup({L, SH, DUR})` → CUES, awal shot `ST`, beat; helper gerak `T(id, ...)` dengan `pop`, `slide`, `slam`, `drift`, `wipeX`, `growY`, `shake`, `shown`, `ramp`, `cam`, `draw`, `count`; `voxPeople`, `voxConfetti`; `voxRun(F)` = render loop (12 fps, wipe koran di tiap beat, subtitle).
- `L` = `[detik, teks subtitle, awal beat?]` per baris narasi. `SH` = `[sceneId, indeks cue pertama]` per shot; dua shot berurutan di scene yang sama = cut ke framing detail (kamera lompat). `F[k](t, awalShot, akhirShot)` mengatur semua elemen scene shot k; animasi ditautkan ke `C(i)` (awal cue i).
- Batas Group C: elemen yang bergerak hanya boleh berubah transform/opacity/teks/display. `clip-path` (tepi sobek), `filter` (bayangan), gradient, mask: hanya pada elemen diam (anak `.sheet`). Animasi atribut SVG tidak terbaca; `<path>` dengan stroke-dash (`draw`) didukung.

## Alur per video
1. **Naskah.** Dari user/Content Creator; buang arahan editor. Tutup dengan CTA bang oppia. ±150–175 kata.
2. **Beat map.** Pecah naskah jadi 6–7 beat + CTA (hook < 3 dtk → data → turn → konsekuensi → payoff → CTA). Tiap beat: judul 2–3 kata, 2 shot (wide + detail), gerak kamera berbeda dari beat sebelumnya, 3–6 elemen per shot (kedalaman bg/mid/fg). Tunjukkan beat map ke user bila diminta; untuk POC boleh langsung render lalu revisi.
3. **Folder.** `projects/<nn>-<slug>/` dengan `img/`. Kertas: `img/paper.jpg` 1080×1920 (pelat kertas user, diputar ke potret). Potongan foto: PNG transparan, perkecil ke ≤1200 px (`ffmpeg -vf scale=1000:-1`).
4. **piece.html.** Mulai dari `vox/references/piece-contoh.html` (contoh lengkap 13 shot). Ganti isi scene, `L`, `SH`, dan `F[]`. Sisakan baris `/*TIMING*/.../*END*/`.
5. **Cek still.** `& ../../tools/vox/build-vox.ps1 -Dur 75 -StillsOnly "6.5,13.5,…"` (satu still per shot, menjelang akhir shot) → baca `sheet1.jpg`. Perbaiki: teks pecah baris (`white-space:nowrap`, kecilkan font), teks keluar kanan (>1010 px), elemen di bawah subtitle (top 1560), stabilo tidak pas di kata. Ulangi.
6. **VO (opsional, pakai kredit, tanya dulu).** ElevenLabs satu take → `audio_v4/full.wav`. Tulis `script.txt` (satu baris = satu cue, sama urutannya dengan `L`; beat dipisah `---`). `node ../../tools/vox/align.mjs --target 72 --lead 1.0 --dur 75` → mengisi CUES & B di blok TIMING (durasi `L` diabaikan).
7. **Render penuh.** `& ../../tools/vox/build-vox.ps1 -Dur 75 [-Vo audio_v4\edit.wav] [-Cover <dtk>]`: export → srt → musik (whoosh otomatis di tiap beat) → mix → render dengan grain + audio dalam satu encode → cek. Lulus bila `nb_read_frames` = durasi × 30, durasi tepat, `max_volume` ≤ −1 dB, `check/contact.jpg` bersih. Kalau hanya scene yang berubah setelah export: tetap export ulang; kalau hanya audio: `-SkipExport`.
8. **Cover.** Pilih detik di shot hook saat judul sudah tampil dan **tidak ada subtitle** (mis. sebelum cue pertama selesai masuk atau di jeda), bukan saat wipe.
9. **Serah terima.** `vo-script.md` (naskah/subtitle + waktu, sumber data, asal aset, timing perkiraan atau VO). Lampirkan preview (+ contact sheet). Laporkan apa yang belum dicek.

## Angka acuan (laptop ini, contoh Kelas Menengah, 75 dtk, 2.250 frame)
Export Chrome 62–67 dtk (180 layer) + render 45–54 dtk (13,9–16,1 ms/frame, grain + AAC dalam satu encode) ≈ 2 menit total; ±20 MB pada `--crf 23 --maxrate 4M`.

## Jebakan yang sudah terjadi
- Teks besar dengan angka penghitung (`<span id=n>1,2</span> JUTA`) pecah baris saat lebar berubah → `white-space:nowrap` dan font lebih kecil.
- Label di atas batang grafik menutupi angka; taruh label di dalam batang.
- Framing detail (kamera `s` > 1.2) memotong elemen kiri; cek still shot detail.
- Grain di encode terpisah membuat file 670 MB pada CRF 19; pakai `gc-render --grain` (default CRF 23 + maxrate 4M).
- `clip-path` / `filter` pada elemen yang dianimasikan direset saat export → letakkan di anak `.sheet` yang diam.
- Highlighter harus di DOM sebelum teks kata (`.hl` lalu `.kt`), kalau tidak stabilo menutupi huruf.
