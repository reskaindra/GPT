# Treatment · "Berkas IGD: Nyeri Perut"

Gaya: Halftone Dossier · 1080×1920 · 30 fps · ±70 detik · teks layar bahasa Indonesia + musik orisinal + SFX, tanpa narasi.

## 1. Tiga kandidat struktur

1. **Berkas kasus yang dibuka barang bukti demi barang bukti.** Satu map kasus IGD. Setiap beat adalah satu barang bukti bernomor (resep, catatan pasien, lembar triase, bubble ucapan, monitor, test pack). Ditutup dengan stempel diagnosis dan "putusan" berupa checklist.
2. **Laporan yang disensor (redaction).** Seluruh kasus muncul sebagai satu halaman penuh blok hitam; tiap beat mengangkat satu sensor. Kuat untuk misteri, tapi teks yang muncul sepotong-sepotong menyulitkan keterbacaan di layar vertikal.
3. **Mundur dari kamar operasi.** Dibuka dengan pasien di OK, lalu mundur ke triase. Membuang hook "obat maag" yang sudah kuat di draft dan merusak callback resep.

**Dipilih: 1.** Strukturnya paling sesuai dengan draft (hook resep, cliffhanger per beat, reveal stempel, callback resep), dan aturan gaya "satu ide per kartu + caption bar" langsung menjawab kebutuhan keterbacaan. Nuansa lucu gaya ini ditekan: tanpa karakter berwajah, tanpa gag. Pasien hanya hadir lewat barang bukti.

## 2. Logline dan arc

Dokter jaga IGD hampir memulangkan perempuan 26 tahun dengan obat maag, sampai satu kalimat soal haid membalik semuanya: kehamilan ektopik terganggu yang disembunyikan oleh tensi yang masih bagus.

Setup (resep, pasien, triase stabil) → godaan memulangkan → satu kalimat → syok → reveal KET → kenapa tensi menipu → 3 hal yang dicek → resep yang sama, coretan ditebalkan.

## 3. Benchmark

- **Kartu judul investigasi koran cetak dan berkas polisi lama.** Pelajari: hierarki satu headline per halaman, nomor barang bukti besar, stempel sebagai titik akhir kalimat. Jangan ambil: logo, tipografi spesifik, tata letak berkas tertentu.
- **Reels edukasi medis tanpa suara.** Pelajari: teks dibaca tanpa audio, kata kunci disorot, ritme cliffhanger tiap 5-8 detik. Jangan ambil: template atau gaya akun lain.

## 4. Daftar shot

| # | Waktu | Framing | Kamera | Isi | Alasan |
|---|---|---|---|---|---|
| 1 | Hook | medium, frontal | push-in pelan, lalu shake | Resep obat maag, headline, caption; coretan merah + flash + alarm | Hook 3 detik pertama, resep jadi motif yang kembali |
| 2 | Pasien | medium | lock + pulse | Kartu pasien barang bukti 01, "KB: pil" ditulis tangan dan dilingkari | Menanam baris yang nanti jadi masalah |
| 3 | Triase | close pada angka | snap zoom ke shock index | Lembar triase angka teal, kartu SI 0,82 | Rasa aman palsu, angka "aman" diberi warna aman |
| 4 | Godaan | medium | push-in | Bubble ucapan, resep menulis dirinya setengah | Tegangan moral |
| 5 | Satu kalimat | close | lock, lalu sedikit pull | Bubble "haidnya cuma flek", catatan "kadang lupa minum?" di samping "KB: pil" | Turn cerita; diawali hening |
| 6 | Eskalasi | close, adegan gelap | shake kecil berulang | Monitor tercetak, angka count-up, SI 1,50 merah | Adegan gelap tinta navy, detak jantung makin cepat |
| 7 | Reveal | medium → insert stempel | hening → stempel + flash + shake | Test pack positif, USG, stempel KET, sticky tindakan | Puncak emosi, native move "the stamp" |
| 8 | Konsep | wide grafik | pan pelan sepanjang grafik | Grafik nadi vs TD, tag "pasien ini di sini" | Menjawab "kenapa tensinya bagus" |
| 9 | Takeaway | medium | lock frontal, pulse | Sticky "Cek 3 hal ini" dengan angka halftone besar | Frame yang di-screenshot, ditahan lama |
| 10 | Penutup | medium → pull back | pull back | Resep beat 1 kembali, coretan ditebalkan, map ditutup | Bookend, handle @dokter.emergency |

## 5. Beat sheet

Waktu final diatur di `timeline.js` dan diverifikasi `readcheck.mjs`. Teks dalam satu beat menumpuk; kalimat lama naik dan mengecil, tidak langsung hilang.

## 6. Cue map

Tempo 120 BPM (grid 0,5 s), semua cut dan hit di grid.

- Hook: kick + clap kering, bass 8th, stop mendadak di coretan, alarm.
- Pasien, triase, godaan: groove pelan (kick, hat, bass, pluck marimba minor), seolah "rutin".
- Satu kalimat: musik ditarik ke pad tunggal, hening 1 ketukan sebelum bubble.
- Eskalasi: detak/beep monitor makin cepat, bass pulse, tanpa melodi.
- Reveal: senar snare + sweep naik, **hening penuh** sebelum stempel, stempel jatuh sendirian.
- Konsep: pad + pluck lambat, ruang bernapas.
- Takeaway: groove kembali, bell di tiap item checklist.
- Penutup: groove menipis, bell arpeggio sebagai tag.

## 7. Tabel suara

| Bagian | Ambience | Foley | Musik |
|---|---|---|---|
| Hook | ruang IGD samar (noise rendah) | kertas meluncur, spidol menggores, alarm | groove, stop di coretan |
| Pasien–godaan | ruang IGD samar | pop per huruf, kertas, pena menulis | groove pelan |
| Satu kalimat | ruang IGD | pop bubble | pad tunggal, hening |
| Eskalasi | dengung monitor | beep monitor makin cepat, alarm | bass pulse |
| Reveal | hening | sweep, stempel (boom + klik), shutter | hening → pad |
| Konsep | ruang | spidol menggambar garis | pad + pluck |
| Takeaway | ruang | pop, bell per item | groove |
| Penutup | ruang | spidol tebal, map ditutup | tag bell |

## 8. Desain tipografi

- Headline: Alfa Slab One (slab hitam) dengan bayangan misregistrasi, rata kiri.
- Angka besar: Bagel Fat One berisi halftone.
- Tulisan tangan dokter: Caveat Brush, hanya untuk catatan 2-4 kata.
- HUD dan data: JetBrains Mono ExtraBold.
- Caption bar dan stempel: Archivo Black.
- Palet: kertas krem, tinta navy, teal (angka "stabil"), mustard (sorot kata kunci), vermilion (stempel, alarm, coretan). Maksimal lima tinta.
- Safe zone Reels: konten di y 260–1500, x 64–940; HUD di dalam area aman atas.
