# Panduan CekNaskah Online

## Mulai dari kredit gratis

Daftar pada dashboard API Winston: https://dev.gowinston.ai/. Dashboard API berbeda dengan layanan konsumen Winston. Buat token, lalu tempelkan di kolom **API token Winston** pada CekNaskah Online. Token akan hilang ketika tab dimuat ulang; tombol **Hapus token dari sesi** dapat menghapusnya lebih awal.

Winston mendokumentasikan penawaran 2.000 kredit awal tanpa kartu kredit. Periksa penawaran dan saldo aktual di akun Anda. Untuk 500 kata, AI + plagiarisme diperkirakan membutuhkan 1.500 kredit. Hitungan kata penyedia bisa berbeda dengan perkiraan aplikasi. Aplikasi tidak membeli kredit atau menambah saldo secara otomatis.

## Periksa naskah

1. Buka https://ceknaskah-online.sri-ismulyati.chatgpt.site dan masuk dengan akun pemilik Sites bila diminta.
2. Pilih **AI & Plagiarisme Online**. Unggah TXT, DOCX, atau PDF yang dapat diseleksi teksnya; impor menampilkan pratinjau ekstraksi sebelum diterima.
3. Isi judul, periksa teks hasil ekstraksi, pilih bahasa dan jenis pemeriksaan.
4. Tempel token Winston. Baca estimasi kredit dan persetujuan pengiriman teks.
5. Klik **Periksa naskah online**. Pertahankan tab hingga kedua pemeriksaan selesai. AI dan plagiarisme dijalankan berurutan; kegagalan salah satu tidak diubah menjadi skor nol.
6. Tinjau laporan. Simpan melalui JSON atau **Laporan / PDF**; buka HTML hasil unduhan lalu pilih Cetak → Simpan PDF.

Untuk AI minimal 300 karakter; teks di bawah 600 karakter lebih sulit dinilai. Plagiarisme minimal 100 karakter. Batas aplikasi 120.000 karakter. Gunakan sampel 300–500 kata saat mencoba dengan kredit awal. Pengecualian manual dalam mode lokal tidak diterapkan pada pemeriksaan online.

## Membaca hasil

- Indikasi AI = 100 − Human Score yang dikembalikan Winston. Skor tersebut indikator penilaian model, bukan persentase kata yang pasti buatan AI. Tinjauan per kalimat lebih tidak pasti daripada skor keseluruhan.
- Kemiripan internet mengikuti skor agregat penyedia. Sumber dapat bertumpang tindih; jangan menjumlahkan persentasenya. Tinjau cuplikan dan sitasi, termasuk kutipan dan daftar pustaka.
- Tanda “—” berarti pemeriksaan tidak dipilih, belum selesai, atau gagal. Baca pesan di bawahnya; jangan menganggapnya 0%.
- Tidak ada sumber cocok tidak menjamin bebas plagiarisme. Cakupan mengikuti mesin dan sumber Winston, bukan database Turnitin.

## Data dan riwayat

Berkas asli dibaca di perangkat. Teks hasil ekstraksi diteruskan melalui server CekNaskah ke Winston hanya saat Anda menjalankan pemeriksaan. Backend aplikasi tidak menyimpan naskah atau token. Winston dapat menyimpan kiriman sesuai kebijakannya: https://gowinston.ai/privacy-policy/.

50 laporan terbaru tersimpan di browser/perangkat yang dipakai. Ekspor tiap laporan agar tidak bergantung pada penyimpanan browser. Arsip online tidak termasuk cadangan mode lokal. Jika berpindah dari localhost/GitHub ke Sites, data tidak berpindah otomatis. Mode lokal masih tersedia melalui **Kemiripan Lokal**, tanpa kredit Winston.

## Saat terjadi kendala

Token tidak valid: periksa bahwa token berasal dari dashboard API, bukan kata sandi login. Kredit habis: periksa saldo Winston; CekNaskah tidak membeli kredit. Koneksi terputus atau waktu tunggu habis: periksa riwayat pemakaian di Winston sebelum mengulang, karena layanan mungkin telah memproses teks. Ulangi hanya jenis pemeriksaan yang gagal agar tidak membayar pemeriksaan yang sudah berhasil sekali lagi.

Halaman GitHub Pages tidak memiliki server API. Gunakan alamat Sites untuk deteksi online atau jalankan server lokal dengan internet. Deteksi nyata perlu diuji setelah token akun tersedia; pengujian awal pengembangan menggunakan respons sintetis, bukan analisis AI nyata.
