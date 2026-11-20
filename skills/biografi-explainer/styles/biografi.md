# Biografi Explainer — video biografi 75 detik (Group C)

Hasil: per tokoh satu folder `projects/<nn>-<slug>/` berisi `preview.mp4` (1080×1920, 30 fps, H.264+AAC, tepat 2.250 frame/75 dtk), `cover-XXXX.jpg` (badge bang.oppia), `subs.srt`, `audio/scene_NN.mp3`, `vo-script.md` (naskah + sumber), `caption-metadata.md` (IG/FB, TikTok, YT Shorts). Setelah user approve: salin `preview.mp4` → `final.mp4`.

Jangan publish/jadwalkan apa pun. Publish butuh konfirmasi teks dan akun dari user.

## Setup sekali
1. Salin `biografi/scripts/` skill ini ke `tools/groupc/` di workspace (template mengasumsikan `projects/<folder>/` dan `tools/groupc/` bersaudara: `../../tools/groupc/`).
2. Di `tools/groupc/`: `npm install` (rustwright, @napi-rs/canvas, @fontsource/anton, @fontsource/inter, playwright-core).
3. Env opsional: `FFMPEG_DIR` (folder ffmpeg.exe/ffprobe.exe), `FFMPEG` (path ffmpeg untuk gc-render), `RUSTWRIGHT_CHROMIUM` (chrome.exe).

## Alur per video
1. **Naskah.** Ambil dari user/Content Creator. Buang kalimat arahan editor (bukan narasi). Selalu tutup dengan "Mau tau hal-hal menarik lainnya? Follow bang oppia." Target ±150–170 kata ≈ 68–73 dtk suara. Kalau pendek, tambah fakta yang dicek singkat (web search) dan catat sumbernya; jangan mengarang. Hindari angka/rekor tanpa sumber dan kontroversi kecuali diminta.
2. **Folder.** `projects/<nn>-<slug>/` dengan `audio/`, `img/`, `audio_v4/`; salin `music.mjs`, `srt.mjs` dari `tools/groupc/`.
3. **VO.** ElevenLabs `creative_generate_speech`, model `eleven_v4`, voice Jefri `1ijzBXcD3AIVH8RGMcQd` (kecuali user minta lain), `generations_count: 1`, seluruh naskah satu take. Tag: `[curious]` di hook, `[warmly]` isi & CTA, `[pause]` di setiap pergantian scene. Jangan ulang generate untuk retry (bayar dua kali). Unduh → `audio_v4/full.wav` (48 kHz mono).
4. **Foto.** Wikimedia dulu: `node tools/groupc/commons-dl.mjs <proj>/img "File:X.jpg=name"` (cetak lisensi & penulis, tahan 429). Kalau tidak ada, ambil `og:image` artikel sumber naskah. Selalu lihat contact sheet: buang foto yang ternyata orang lain. Kredit di layar (`.credit`).
5. **script.txt.** Satu baris = satu subtitle; scene dipisah baris `---` tepat di titik `[pause]`. Baris yang dibaca tanpa jeda: gabungkan dengan ` | ` (dibagi proporsional). Contoh: `biografi/references/script-contoh.txt`.
6. **piece.html.** Mulai dari `biografi/references/piece-contoh.html`. Jumlah `.scene` = jumlah blok di script.txt; scene terakhir `class="scene cta"` diisi `CTA_HTML()`. Sisakan baris `/*TIMING*//*END*/`. Animasi ditautkan ke awal subtitle `C(i)` (indeks global baris script.txt); helper di `editorial.js`: `pop`, `slide`, `photo`, `count`, `wob`, `bob`, `draw`, `cta`.
7. **Timing.** Di folder project: `node ../../tools/groupc/align.mjs --target 72 --lead 1.0 --dur 75` → pencocokan DP teks↔jeda, jeda scene dipanjangkan sampai 72 dtk, `audio_v4/edit.wav`, `timing.json`, dan blok TIMING di piece.html. Periksa daftar cue: baris panjang dengan durasi sangat pendek = salah batas → ubah pemenggalan/gunakan ` | `, jalankan ulang. VO > 72 dtk tidak dipotong otomatis: pangkas kalimat di titik hening (ffmpeg atrim+concat) lalu align ulang.
8. **Cek still.** `& ../../tools/groupc/build-project.ps1 -Dur 75 -StillsOnly "3,7,…,73"` → baca `sheet1.jpg`. Perbaiki teks terpotong di kanan (≤1010 px), elemen bertabrakan, subtitle (top 1395) menutupi elemen.
9. **Render penuh.** `$t=Get-Content timing.json -Raw|ConvertFrom-Json; & ../../tools/groupc/build-project.ps1 -Dur 75 -B (($t.B[1..($t.B.Count-2)]) -join ', ') -Cover <dtk> -Vo audio_v4\edit.wav -Cuts ($t.cuts -join ',')`. Lulus bila: `nb_read_frames=2250`, durasi 75,000, tidak ada `freeze_start` (kalau ada: tambah `bob/wob` di scene itu, render ulang), `black_start` hanya di titik wipe, `max_volume` ≤ −1 dB.
10. **Cover.** Pilih detik di scene hook tanpa subtitle panjang dan bukan saat wipe (±0,3 dtk dari batas scene). Badge otomatis lewat `cover-badge.mjs`; lihat hasilnya.
11. **Dokumen & serah terima.** Tulis `vo-script.md` (voice/model, tabel subtitle dari timing.json, sumber, catatan) dan `caption-metadata.md` (IG/FB, TikTok, YT Shorts: 3 judul + rekomendasi, deskripsi, 5–10 hashtag, kredit foto, made_for_kids false, label AI, jam posting = estimasi). Lampirkan preview + cover. Laporkan apa yang belum bisa dicek (pelafalan, timing per kata, hak foto).

## Jebakan yang sudah terjadi
- PowerShell `-replace`/`.Replace()` dengan kutip miring “ ” → parser error; edit file pakai tool Edit.
- `Set-Content` tanpa `-Encoding` merusak UTF-8 (emoji jadi `ðŸ”¥`); perbaiki dengan `node tools/groupc/fix-mojibake.mjs <file>`.
- Group C hanya membaca inline style/teks: animasi lewat atribut SVG (`setAttribute('transform')`) tidak ikut; pakai style pada elemen pembungkus.
- Wikimedia sering 429: pakai `commons-dl.mjs` (backoff), jangan unduh beruntun tanpa jeda.
- Symlink butuh admin; untuk `node_modules` bersama pakai `New-Item -ItemType Junction`.
- `freezedetect` menandai scene yang hanya bergerak sedikit; tambahkan gerak halus pada elemen besar.
