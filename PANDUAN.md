# CekNaskah Offline

Aplikasi lokal untuk meninjau kemiripan jurnal, artikel, dan naskah terhadap sumber yang Anda masukkan. Seluruh pemrosesan dokumen berlangsung di browser. Tidak ada API GPT, unggahan dokumen, database Turnitin, atau pemeriksaan seluruh internet.

## Mulai memakai

1. Pada komputer tempat aplikasi ini disiapkan, buka **http://localhost:4173/**. Pratinjau lokal sedang berjalan.
2. Tunggu status **Siap digunakan offline**. Status ini memeriksa keberadaan seluruh aset dalam cache, termasuk parser PDF/DOCX dan worker.
3. Pilih **Koleksi Sumber → Tambah sumber**. Tempelkan teks atau impor TXT, DOCX, dan PDF yang memiliki lapisan teks. Tinjau hasil ekstraksinya sebelum menyimpan.
4. Buka **Periksa Naskah**, masukkan judul dan teks atau impor dokumen. Pilih sumber pembanding, lalu **Periksa kemiripan**.
5. Baca bagian yang disorot beserta nomor sumber. Periksa konteks sumber dan tambahkan catatan revisi. Kutipan dengan sitasi yang benar juga dapat cocok.
6. Gunakan **Buat revisi** untuk mempertahankan hasil lama. Setelah pemeriksaan baru, gunakan **Bandingkan versi**.
7. Unduh **Laporan HTML** atau **Laporan JSON**. **Cetak / Simpan PDF** membuka dialog cetak browser.
8. Ekspor cadangan dari **Pengaturan & Cadangan** secara berkala. Cadangan mencakup teks hasil ekstraksi, koleksi, laporan, catatan, draf, dan pengaturan; file PDF/DOCX asli tidak disertakan.

Gunakan browser dan alamat yang sama agar arsip lokal tetap tersedia. `localhost` dan `127.0.0.1` merupakan origin berbeda dengan penyimpanan berbeda. Data pada browser lain atau mode privat juga terpisah.

## Membuka ulang tanpa internet

Sesudah seluruh aset siap, alamat yang sama dapat dibuka dari cache service worker. Pemasangan ikon opsional, bergantung dukungan browser. Internet tidak diperlukan untuk memproses naskah atau mengimpor berkas baru.

Jika cache belum tersedia atau pernah dihapus, jalankan **Buka-CekNaskah.command** di macOS, atau jalankan `npm start` dari folder proyek (memerlukan Node.js 20+), lalu buka http://localhost:4173/. Server tersebut hanya menyajikan berkas aplikasi pada loopback perangkat ini; server tidak menerima dokumen.

Jangan membuka `dist/index.html` dengan klik dua kali (`file://`): cara itu tidak mendukung alur PWA yang dijanjikan. Untuk distribusi ke komputer lain tanpa pemasangan Node.js, unggah isi folder `dist` ke hosting statis HTTPS. Tidak ada naskah pengguna dalam folder build. Versi ini belum dipublikasikan ke hosting eksternal.

Saat pembaruan tersedia, tutup semua tab CekNaskah sesudah data tersimpan lalu buka lagi. Pembaruan tidak memaksa reload atau menghapus IndexedDB. Pemeriksaan yang terhenti saat tab ditutup ditandai **Terhenti** dan dapat dijalankan ulang.

## Arti skor

**Skor = 100 × jumlah token cocok unik / jumlah token yang layak diperiksa.**

Token adalah kata atau angka setelah normalisasi Unicode dan huruf kecil. Mesin menggunakan kandidat n-gram hingga 5 token, memverifikasi urutan katanya, dan memperluas rentang yang sama. Minimum awal 8 token, dapat diatur 2–100.

Token yang cocok dengan beberapa sumber tetap dihitung satu kali dalam skor total. Kontribusi per sumber dapat tumpang tindih. Pengecualian sumber mengubah sumber yang diperiksa. Pengecualian teks mengeluarkan token yang bersinggungan dari pembilang dan penyebut; mengubah isi draf menghapus pengecualian lama untuk menghindari posisi yang keliru.

Naskah kosong, koleksi kosong, semua token dikecualikan, atau semua sumber gagal menghasilkan skor tidak tersedia. Jika hanya sebagian sumber berhasil, hasil ditandai parsial. Skor lama merupakan snapshot dan tidak berubah ketika sumber koleksi diedit atau dihapus.

**Skor ini bukan persentase plagiarisme, nilai orisinalitas, skor AI, sertifikat bebas plagiarisme, atau skor Turnitin.** Aplikasi membantu meninjau bukti tekstual dan sitasi. Ia tidak memverifikasi kebenaran referensi secara otomatis.

## Batas versi awal

- Mendukung teks Indonesia/Inggris; antarmuka utama tersedia dalam Bahasa Indonesia dan Inggris. Beberapa pesan diagnostik dan laporan HTML tetap berbahasa Indonesia.
- PDF pindai tanpa teks memerlukan OCR di luar aplikasi. PDF terkunci harus dibuka proteksinya lebih dahulu.
- Ekstraksi PDF tidak menjamin urutan kolom atau pemenggalan kata sempurna. Pratinjau wajib ditinjau.
- Tidak mendeteksi parafrase menyeluruh, kemiripan makna, terjemahan, atau teks dari sumber yang tidak dimasukkan.
- Tidak menjalankan model GPT atau model detektor AI lokal.
- Batas: 10 MB per berkas, 1 juta karakter per dokumen, 20 berkas per batch impor, 200 sumber, 500 laporan, PDF hingga 500 halaman, dan cadangan maksimal 100 MB.
- Sumber yang sangat repetitif dapat melampaui batas kerja mesin dan ditandai gagal. Pecah sumber tersebut atau naikkan minimum kecocokan. Batas ini mencegah pemeriksaan tanpa akhir; skor parsial tidak menyembunyikan sumber gagal.
- Arsip bergantung pada penyimpanan browser. Penghapusan data browser atau kuota yang habis dapat menghilangkannya. Persistensi browser tidak menggantikan cadangan.
- Uji offline dilakukan pada pratinjau lokal dengan server dimatikan; pengujian jaringan perangkat sepenuhnya terputus dan pemasangan PWA pada semua browser belum dilakukan.

## Untuk pengembang

Sumber: React dengan modul JavaScript ESM, esbuild, IndexedDB, Web Worker, service worker, Mammoth, dan PDF.js. Tidak memerlukan backend pemrosesan, akun, kunci API, font luar, atau CDN.

```
npm ci
npm test
npm run build
npm start
```

`src/engine.mjs` memuat tokenisasi, hash, pencocokan, dan skor. `src/parser.mjs` memuat parser. `src/storage.mjs` memuat penyimpanan, validasi dan penggabungan cadangan. `src/reports.mjs` membuat ekspor. `src/App.jsx` memuat antarmuka. `src/i18n.mjs` memuat kamus. `build.mjs` membundel semua dependensi dan menghasilkan manifest cache berversi.

`dist/` adalah hasil build statis siap hosting HTTPS. `package-lock.json` mengunci versi dependensi. Semua hasil impor diperlakukan sebagai teks; HTML laporan melakukan escaping, membatasi CSP, dan tidak memuat skrip aktif atau aset luar.

## Rujukan interpretasi

- [Turnitin: memahami skor kemiripan](https://guides.turnitin.com/hc/en-us/articles/23435833938701-Understanding-the-similarity-score). Skor kemiripan memerlukan penilaian konteks dan bukan putusan plagiarisme.
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
- [PDF.js](https://mozilla.github.io/pdf.js/) dan [Mammoth](https://github.com/mwilliamson/mammoth.js).
