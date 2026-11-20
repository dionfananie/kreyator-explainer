---
name: biografi-explainer
description: Pembuat video explainer pendek (Reels/TikTok/Shorts) untuk bang.oppia dengan dua gaya — biografi motion graphic editorial (foto tokoh, render cepat Group C, 75 dtk) dan whiteboard tangan (spidol & penghapus). Gunakan saat diminta membuat, mengulang, atau merevisi video explainer/biografi/whiteboard dari topik atau naskah, termasuk naskah dari Content Creator.
example-prompt: Buat video dari naskah biografi terbaru Content Creator, 75 detik, VO Jefri v4, jangan dipublish.
---

# Biografi Explainer

Satu skill, dua gaya video. File ini berisi aturan bersama dan cara memilih gaya; detail tiap gaya ada di `styles/` dan **dibaca hanya saat gaya itu dipakai**.

## Pilih gaya
| Permintaan | Gaya | Baca |
|---|---|---|
| Biografi/profil tokoh, naskah dari Content Creator, video berfoto, "seperti video #22–#37" | **Biografi editorial** (9:16, kartu foto, tag Anton, wipe, subtitle) | `styles/biografi.md` (+ `biografi/scripts/`, `biografi/references/`) |
| "Whiteboard", gambar tangan, spidol, papan tulis, penjelasan konsep/angka tanpa foto | **Whiteboard** | `styles/whiteboard.md` |
| Tidak jelas | Tanyakan satu kali dengan dua opsi di atas | — |

## Aturan bersama (semua gaya)
- **Format:** 1080×1920, 9:16, 30 fps, MP4 H.264 + AAC, subtitle burn-in, safe zone atas 15% & bawah 20%. Whiteboard default 1280×720 → render/adaptasi ke 9:16 bila untuk Reels/TikTok/Shorts.
- **Durasi:** target 75 dtk. Naskah pendek → tambah fakta yang dicek singkat (catat sumber); jangan mengarang angka, kutipan, atau rekor.
- **VO:** ElevenLabs, voice Jefri `1ijzBXcD3AIVH8RGMcQd`, model `eleven_v4`, satu take utuh, `generations_count: 1` (jangan generate ulang untuk retry), lalu dipotong per scene. Tag `[curious]` hook, `[warmly]` isi/CTA, `[pause]` antar-scene.
- **Penutup wajib:** VO dan layar terakhir: "Mau tau hal-hal menarik lainnya? Follow bang oppia."
- **Cover:** frame hook tanpa subtitle panjang/wipe + badge bang.oppia (`biografi/scripts/cover-badge.mjs`, ikon di `biografi/scripts/brand/oppia.png`).
- **Serah terima per video:** `preview.mp4`, `cover-*.jpg`, `subs.srt`, `audio/scene_NN.mp3`, `vo-script.md` (naskah + sumber), `caption-metadata.md` (IG/FB, TikTok, YT Shorts: 3 judul + rekomendasi, deskripsi, 5–10 hashtag, kredit foto, made_for_kids false, label konten AI, jam posting = estimasi). Setelah user approve: `final.mp4`.
- **Verifikasi sebelum lapor:** ffprobe (frame = durasi × 30, durasi tepat), tidak ada `freeze_start`, `black_start` hanya di transisi, puncak audio ≤ −1 dB, lihat contact sheet frame kunci.
- **Jujur soal batas:** sebutkan yang tidak bisa dicek (pelafalan, timing per kata, hak foto, fakta yang belum terverifikasi).
- **Tidak ada aksi eksternal tanpa izin:** jangan publish/jadwalkan; publish butuh konfirmasi teks & akun dari user. Jika ada agent Social Media Manager, kirimi daftar konten yang selesai (judul, status, path) tanpa meminta publish.
