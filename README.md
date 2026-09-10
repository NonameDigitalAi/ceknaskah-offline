# CekNaskah Online + Lokal

Pemeriksaan naskah melalui Winston AI (indikasi tulisan AI dan kemiripan sumber internet), serta pemeriksaan kemiripan terhadap koleksi lokal.

- Versi online: https://ceknaskah-online.sri-ismulyati.chatgpt.site (akses pemilik akun Sites).
- GitHub Pages: https://nonamedigitalai.github.io/ceknaskah-offline/ (aset aplikasi dan pemeriksaan lokal; tidak menjalankan backend).
- Panduan: [PANDUAN-ONLINE.md](PANDUAN-ONLINE.md). Panduan mode lokal: [PANDUAN.md](PANDUAN.md).

## Mengaktifkan uji coba

1. Buat akun API di https://dev.gowinston.ai/ dan buat API token. Dokumentasi penyedia menawarkan 2.000 kredit awal tanpa kartu kredit; ketentuan dan saldo aktual mengikuti akun penyedia.
2. Buka versi online dan tempel token pada kolom **API token Winston**. Jangan masukkan token dalam kode, GitHub, URL, atau chat.
3. Tempel atau impor naskah TXT, DOCX, atau PDF teks. Untuk uji awal gunakan 300–500 kata.
4. Pilih bahasa dan pemeriksaan, tinjau estimasi kredit, setujui pengiriman teks, lalu mulai.
5. Tinjau kedua hasil secara terpisah, kalimat yang ditandai, dan sumber rujukan. Unduh JSON atau laporan HTML, yang dapat dicetak menjadi PDF.

AI memakai 1 kredit/kata, plagiarisme 2 kredit/kata menurut dokumentasi Winston. CekNaskah tidak membeli kredit, tidak berlangganan otomatis, dan tidak menjalankan pemeriksaan tanpa token serta persetujuan pengguna. Tanpa token, tidak ada hasil deteksi nyata. Tidak ada skor demo atau heuristik yang ditampilkan sebagai hasil layanan.

## Arsitektur dan privasi

React + esbuild, Node.js 24 untuk lokal, Cloudflare Worker untuk Sites. Parser dokumen tetap di browser. Hanya teks diekstrak yang diteruskan melalui backend HTTPS ke endpoint tetap Winston; berkas asli tidak diunggah. Bahasa Indonesia dan Inggris tersedia, serta deteksi bahasa otomatis. Token hanya berada di memori tab dan request; tidak ditulis ke database, cadangan, source, atau log aplikasi. Backend tidak menyimpan naskah ataupun laporan.

50 laporan online terbaru disimpan dalam IndexedDB terpisah pada perangkat/browser saat ini. Riwayat tersebut tidak sinkron antarperangkat dan tidak termasuk cadangan mode lokal. Ekspor tiap laporan untuk arsip. Riwayat di origin localhost, GitHub Pages, dan Sites terpisah. Kebijakan penyimpanan Winston: https://gowinston.ai/privacy-policy/.

Tidak memakai GPT untuk menebak skor, tidak berafiliasi dengan Turnitin, tidak mempunyai database Turnitin. Skor AI adalah indikator model (100 dikurangi Human Score Winston), bukan persentase kata yang pasti ditulis AI. Skor kemiripan mengikuti agregat penyedia, bukan penjumlahan sumber yang dapat bertumpang tindih. Hasil tidak membuktikan pelanggaran akademik.

## Pengembangan

Node.js 24 dan npm:

```sh
npm ci
npm run build
npm test
npm start
```

Buka http://localhost:4173/. Mode lokal tetap bekerja tanpa Winston atau internet setelah aset tersimpan. Pemrosesan AI dan pencarian internet memerlukan koneksi. PDF pindai memerlukan OCR di luar aplikasi.

`server/online-api.mjs` menyediakan `GET /api/online/status` dan `POST /api/online/scan`. Tidak ada kredensial bersama; tiap permintaan memakai token pribadi dari header `X-Winston-Key`. Server memvalidasi origin, jenis, bahasa, persetujuan, ukuran, dan format respons. Kredit yang telah terpakai tidak otomatis dikembalikan ketika koneksi klien terputus. Tidak ada retry otomatis.

## Publikasi

`npm run build` menghasilkan `dist/client` untuk aset publik dan `dist/server/index.js` dengan default Worker fetch handler. Sites memakai manifest `.openai/hosting.json` dan arsip build lengkap. GitHub Actions hanya mengunggah `dist/client`; source server tidak masuk artefak Pages. GitHub Pages tidak dapat menjalankan layanan API ini.

## Validasi

25 tes otomatis lulus: mesin lokal, arsip, jalur aset, serta kontrak backend online memakai respons sintetis. Pengujian tersebut memverifikasi pemetaan skor, error, privasi token, URL aman, dan laporan, **bukan akurasi deteksi AI**. Pemeriksaan ke akun Winston nyata belum diuji karena token pengguna belum tersedia. Tidak ada biaya API yang dikeluarkan selama pengembangan.

Dokumentasi API: https://docs.gowinston.ai/api-reference/v2/ai-content-detection/post dan https://docs.gowinston.ai/api-reference/v2/plagiarism/post. React, Mammoth, PDF.js, dan dependensi lain memakai lisensinya masing-masing.
