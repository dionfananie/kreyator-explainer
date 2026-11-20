---
name: biografi-explainer
description: Membuat video biografi tokoh 9:16 (Reels/TikTok/Shorts) untuk bang.oppia bergaya motion graphic editorial — kartu foto, tag Anton, wipe, subtitle burn-in — durasi 75 dtk, VO ElevenLabs satu take, timing otomatis teks↔audio, dan render cepat Group C. Gunakan saat diminta membuat, mengulang, atau merevisi video biografi/profil tokoh dari naskah, termasuk naskah dari Content Creator. Untuk video whiteboard (spidol & papan tulis) pakai skill whiteboard-explainer.
example-prompt: Buat video dari naskah biografi terbaru Content Creator, 75 detik, VO Jefri v4, jangan dipublish.
---

# Biografi Explainer

Video biografi editorial 9:16. File ini berisi aturan; langkah lengkap per video ada di `styles/biografi.md` (script di `biografi/scripts/`, contoh di `biografi/references/`).

Bukan untuk gaya whiteboard (gambar tangan, spidol, papan tulis, penjelasan konsep/angka tanpa foto): pakai skill `whiteboard-explainer` di paket `kreyator-explainer` yang sama. Bila tidak jelas gaya mana yang diminta, tanyakan satu kali.

## Aturan
- **Format:** 1080×1920, 9:16, 30 fps, MP4 H.264 + AAC, subtitle burn-in, safe zone atas 15% & bawah 20%.
- **Durasi:** target 75 dtk. Naskah pendek → tambah fakta yang dicek singkat (catat sumber); jangan mengarang angka, kutipan, atau rekor.
- **VO:** ElevenLabs, voice Jefri `1ijzBXcD3AIVH8RGMcQd`, model `eleven_v4`, satu take utuh, `generations_count: 1` (jangan generate ulang untuk retry), lalu dipotong per scene. Tag `[curious]` hook, `[warmly]` isi/CTA, `[pause]` antar-scene.
- **Penutup wajib:** VO dan layar terakhir: "Mau tau hal-hal menarik lainnya? Follow bang oppia."
- **Cover:** frame hook tanpa subtitle panjang/wipe + badge bang.oppia (`biografi/scripts/cover-badge.mjs`, ikon di `biografi/scripts/brand/oppia.png`).
- **Serah terima per video:** `preview.mp4`, `cover-*.jpg`, `subs.srt`, `audio/scene_NN.mp3`, `vo-script.md` (naskah + sumber), `caption-metadata.md` (IG/FB, TikTok, YT Shorts: 3 judul + rekomendasi, deskripsi, 5–10 hashtag, kredit foto, made_for_kids false, label konten AI, jam posting = estimasi). Setelah user approve: `final.mp4`.
- **Verifikasi sebelum lapor:** ffprobe (frame = durasi × 30, durasi tepat), tidak ada `freeze_start`, `black_start` hanya di transisi, puncak audio ≤ −1 dB, lihat contact sheet frame kunci.
- **Jujur soal batas:** sebutkan yang tidak bisa dicek (pelafalan, timing per kata, hak foto, fakta yang belum terverifikasi).
- **Tidak ada aksi eksternal tanpa izin:** jangan publish/jadwalkan; publish butuh konfirmasi teks & akun dari user. Jika ada agent Social Media Manager, kirimi daftar konten yang selesai (judul, status, path) tanpa meminta publish.
