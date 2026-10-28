# Treatment · "Buku Jaga IGD" (Paper Pop-up Book)

Gaya: Paper Pop-up Book · 1080×1920 · 30 fps · ±74 detik · teks layar bahasa Indonesia + musik orisinal + SFX, tanpa narasi.
Copy, urutan beat, dan timing baca diambil dari versi Halftone Dossier (`../ket-igd/`), yang sudah lolos readcheck.

## 1. Tiga kandidat struktur

1. **Buku jaga yang dibuka halaman demi halaman.** Satu buku pop-up bersampul kain "BUKU JAGA IGD" di meja ruang jaga malam. Tiap halaman adalah satu babak kasus; balik halaman = ganti adegan. Dunia nyata ikut bermain: lampu meja berkedip merah saat alarm, sticky note sungguhan menempel di samping buku saat tindakan darurat.
2. **Satu spread yang ditarik berulang kali.** Satu ruang IGD pop-up; pull-tab menggeser keadaan pasien dari stabil ke syok. Hemat set, tapi 10 beat di satu ruangan jadi monoton dan grafik/checklist tidak punya tempat.
3. **Dua buku berhadapan** (buku resep vs buku pasien). Menarik secara konsep, tapi terlalu rumit dibaca di layar ponsel dalam 70 detik.

**Dipilih: 1.** Balik halaman memberi ritme alami untuk 10 beat, warna tiap spread bisa bercerita (biru tenang → merah krisis → hijau putusan), dan "benda nyata ikut bermain" memberi momen yang hanya bisa dilakukan gaya ini.

Nada: gaya ini aslinya ceria. Supaya pantas untuk kasus perdarahan, palet tiap spread diredam, karakter digambar sederhana dan tenang (tanpa gag), dan krisis ditandai dengan lampu nyata yang meredup dan memerah.

## 2. Logline dan arc

Di meja jaga malam, sebuah buku pop-up memutar ulang kasus perempuan 26 tahun yang hampir pulang dengan obat maag, sampai satu kalimat soal haid membalik semuanya.

Setup (resep, pasien, triase stabil) → godaan memulangkan → satu kalimat → pasien kembali pucat → reveal KET → kenapa tensi menipu → 3 hal yang dicek → resep yang sama dicoret tebal, buku ditutup.

## 3. Benchmark

- **Buku pop-up berlapis karya seniman kertas modern.** Pelajari: potongan naik dari belakang ke depan, mekanisme pull-tab sebagai "event". Jangan ambil: desain potongan atau ilustrasi tertentu.
- **Fotografi makro "dunia kecil di meja".** Pelajari: lensa dangkal, cahaya lampu hangat, bayangan potongan kertas. Jangan ambil: komposisi foto tertentu.

## 4. Spread dan shot

| # | Waktu | Spread / warna | Kamera | Isi |
|---|---|---|---|---|
| 1 | 0–6.5 | Meja jaga, buku sudah terbuka; spread biru malam | turun dari ketinggian manusia ke halaman | Kartu resep pop-up; coretan merah; **lampu meja nyata berkedip merah** |
| 2 | 6.5–12 | Balik halaman → bilik IGD (biru-teal) | 3/4 view lalu push | Pasien kertas duduk di bed; kartu "Perempuan, 26 tahun"; label "KB: pil" dilingkari |
| 3 | 12–18 | Sama | top-down | Lembar triase: slat pull-tab membalik satu per satu menunjukkan angka; kartu shock index 0,82 |
| 4 | 18–23 | Sama | eye-level makro | Bubble pasien; dokter kertas menulis resep setengah |
| 5 | 23–30.5 | Sama | push-in ke wajah pasien | Bubble "haidnya cuma flek"; catatan "kadang lupa minum?"; pasien berjalan ke pintu kamar mandi |
| 6 | 30.5–38 | Spread yang sama versi malam (desaturasi) | lampu nyata meredup, kamera mendekat | Pasien kembali, wajah pucat; monitor pop-up dengan angka naik; kartu 1,50 |
| 7 | 38–46 | Balik halaman → spread merah | 3/4, lalu locked saat banner jatuh | Test pack & kartu USG; banner kertas "KEHAMILAN EKTOPIK TERGANGGU" jatuh di tali; **sticky note nyata** di meja |
| 8 | 46–56.5 | Balik halaman → spread kertas krem (grafik) | top-down | Grafik nadi vs TD sebagai garis pita kertas yang ditarik; tag "pasien ini di sini" |
| 9 | 56.5–65.5 | Balik halaman → spread hijau | locked frontal | Kartu "Cek 3 hal ini", tiga flap terbuka satu per satu |
| 10 | 65.5–74 | Kembali ke kartu resep | crane naik | Coretan resep ditebalkan; pintu "OPERASI" menyala; buku menutup; handle |

## 5. Teks

Teks utama berupa subtitle narasi gaya buku (krem, outline cokelat tua tebal) di zona aman bawah-tengah, dan bubble di dunia kertas untuk ucapan pasien. Angka dan label berupa kartu kertas yang ikut tersorot cahaya. Semua copy lolos `readcheck.mjs`.

## 6. Cue map

Tempo 120 BPM (grid 0,5 s, sama dengan timing teks), aransemen ringan gaya buku cerita. Instrumen: music box, pizzicato, glockenspiel, klarinet sintetis, brush.
- Hook: pizz + music box, berhenti di coretan, alarm (lampu merah).
- Bilik IGD: motif music box tenang, "rutin".
- Satu kalimat: hening (hanya room tone + jam dinding) sebelum bubble.
- Eskalasi: pizz ostinato makin cepat, detak monitor.
- Reveal: senyap penuh sebelum banner jatuh; banner + bunyi kardus.
- Konsep: klarinet + glockenspiel pelan.
- Takeaway: motif kembali, glockenspiel di tiap flap.
- Penutup: music box tag, buku menutup (thump), room tone.

## 7. Tabel suara

| Bagian | Ambience | Foley | Musik |
|---|---|---|---|
| Semua | room tone + jam dinding | balik halaman, snap pop-up, lipatan | sesuai cue map |
| Hook | ruang jaga | spidol, alarm | pizz, stop |
| Eskalasi | dengung lampu | beep monitor | ostinato |
| Reveal | hening | tali + kardus jatuh, sticky note ditempel | senyap → pad |
| Penutup | ruang jaga | buku menutup | tag |

## 8. Tipografi

Fredoka (subtitle, bubble), Lilita One (judul, angka besar), IM Fell English (judul sampul) dari `core/fonts/`, ditambah Caveat Brush untuk tulisan tangan dokter.
