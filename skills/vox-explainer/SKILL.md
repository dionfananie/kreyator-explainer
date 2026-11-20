---
name: vox-explainer
description: Membuat video explainer isu 9:16 (Reels/TikTok/Shorts) untuk bang.oppia bergaya kolase kertas koran ala Vox — potongan kertas sobek dengan bayangan, judul serif hitam, stabilo kuning, satu aksen merah, stempel, grafik data dari kertas, gerak stop-motion 12 fps, grain — durasi ±75 dtk, dirender cepat dengan Group C (tanpa After Effects). Gunakan saat diminta membuat video gaya Vox/kolase kertas/newsprint/paper collage dari naskah isu sosial-ekonomi, data, atau opini, termasuk naskah dari Content Creator. Untuk biografi tokoh pakai biografi-explainer; untuk spidol & papan tulis pakai whiteboard-explainer.
example-prompt: Buat video vox-explainer dari naskah "Kelas Menengah Turun Kasta" Content Creator, tanpa VO dulu, jangan dipublish.
---

# Vox Explainer

Video explainer kolase kertas 9:16. File ini berisi aturan; langkah lengkap per video ada di `styles/vox.md` (script di `vox/scripts/`, contoh di `vox/references/`).

Bukan untuk biografi tokoh dengan foto (pakai `biografi-explainer`) atau gaya gambar tangan di papan tulis (pakai `whiteboard-explainer`), keduanya di paket `kreyator-explainer` yang sama. Bila tidak jelas gaya mana yang diminta, tanyakan satu kali.

## Aturan
- **Format:** 1080×1920, 9:16, 30 fps output (gerak dibulatkan ke 12 fps), MP4 H.264 + AAC, subtitle burn-in (top 1560), safe zone atas 11% & bawah 20%.
- **Durasi:** target ±75 dtk, 6–7 beat + CTA, 2 shot per beat (wide dengan judul, lalu detail tanpa judul), cut tiap 4–7 dtk.
- **Tampilan default (newsprint editorial):** satu pelat kertas krem untuk seluruh video; judul serif hitam (Georgia Bold) 2–3 kata di kertas sobek; stabilo kuning `#ffd84a` di kata kunci; SATU aksen merah `#d6261c` (stempel, panah, data utama); potongan duotone hitam-krem. Jangan isi layar penuh dengan warna jenuh.
- **Gerak:** satu gerak kamera per shot; beat bersebelahan tidak boleh sama geraknya; `static` hanya untuk payoff. Tiap elemen punya gerak sendiri (slide/pop/slam/drift) yang tidak serempak. Gerak besar (slam + shake, wipe koran, confetti) maksimal 1–2× per video.
- **Data:** setiap angka di layar harus ada di naskah atau sumbernya; tulis sumber kecil di layar (`.src`). Grafik boleh stylized, tapi jangan menampilkan angka yang tidak ada sumbernya. Angka contoh (mis. saldo di struk) harus jelas ilustrasi.
- **Aset:** potongan foto (PNG transparan, halftone) dari user atau dibuat; sisanya native (kartu, stempel, selotip, halftone, ikon orang, panah). Catat asal setiap aset di `vo-script.md`.
- **VO:** opsional. Tanpa VO = draft dengan timing perkiraan (±2,6 kata/dtk) + musik. Dengan VO: ElevenLabs Jefri `1ijzBXcD3AIVH8RGMcQd`, `eleven_v4`, satu take, `generations_count: 1`, lalu `align.mjs`. Generate VO memakai kredit: tanya dulu.
- **Penutup wajib:** layar terakhir (dan VO bila ada): "Mau tau hal-hal menarik lainnya? Follow bang oppia."
- **Verifikasi sebelum lapor:** ffprobe (frame = durasi × 30), `max_volume` ≤ −1 dB, lihat `check/contact.jpg` dan still per shot (teks tidak terpotong ≤1010 px, tidak bertabrakan dengan subtitle).
- **Jujur soal batas:** sebutkan yang belum dicek (timing tanpa VO, hak aset, fakta yang belum terverifikasi, belum ditonton utuh).
- **Tidak ada aksi eksternal tanpa izin:** jangan publish/jadwalkan.
