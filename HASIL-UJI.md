# Pembaruan pengujian versi 2.0

25 tes otomatis lulus, termasuk 9 tes backend online. Kontrak Winston diuji dengan respons sintetis: skor AI dibalik dari Human Score secara benar; skor kemiripan tidak dijumlahkan antar sumber; skor hilang tidak dianggap nol; token salah, kredit habis, kegagalan jaringan, URL berbahaya, arsip parsial, dan ekspor ter-escape ditangani. Backend membatasi endpoint, body, bahasa, dan persetujuan serta tidak melakukan retry otomatis.

**Belum diverifikasi:** permintaan dengan API token Winston nyata, akurasi deteksi terhadap korpus Indonesia, dan interaksi browser versi online. Tidak ada penggunaan kredit provider selama tes. Pengujian versi lokal di bawah adalah hasil versi 1 dan bukan klaim pengujian ulang antarmuka versi 2.

---

# Hasil verifikasi CekNaskah 1.0

Dijalankan 10 September 2026 pada macOS, Node.js 24.15.0 dan browser bawaan Codex. Ini catatan pengujian aplikasi, bukan evaluasi akurasi deteksi plagiarisme atau AI.

## Lulus

- Build produksi bundel statis: 201 aset lokal, termasuk PDF.js worker, CMaps, font PDF, WASM, parser, ikon, dan service worker.
- 14 pengujian otomatis: salinan diketahui 8/10 token; dua sumber tumpang tindih tanpa penghitungan ganda; Unicode dan offset asli; masukan kosong; seluruh teks dikecualikan; minimum 2–100; hasil parsial; checksum; perbandingan algoritma terhadap brute force pada 120 kasus; pembatasan sumber repetitif tanpa mencemari skor; roundtrip IndexedDB dan cadangan; penolakan cadangan dengan relasi rusak; escaping laporan HTML.
- Antarmuka: contoh dihitung 28/45 token atau 62,2%, dengan sorotan dan konteks sumber sesuai bukti.
- Impor DOCX dan PDF teks diuji di browser. DOCX contoh menghasilkan 15/15 token cocok atau 100%.
- PDF tanpa teks ditolak dengan pesan OCR. DOCX rusak ditolak. Draf lama tidak berubah karena kegagalan impor.
- Riwayat, catatan revisi, dan draf tersedia setelah reload.
- Pratinjau dan penggabungan cadangan diuji melalui antarmuka: satu sumber dan laporan pemulihan muncul dengan skor 100%. Roundtrip pemulihan ke penyimpanan kosong diverifikasi dalam pengujian IndexedDB menggunakan fake-indexeddb.
- Uji offline: server lokal dihentikan dan curl mengonfirmasi koneksi ditolak. Halaman ditinggalkan lalu alamat dibuka kembali. Draf tersimpan tetap tersedia; impor TXT baru, pemeriksaan, revisi, dan ekstraksi PDF baru berjalan tanpa server.
- Revisi offline: penambahan tiga kata mengubah hasil dari 15/15 menjadi 15/18 token (83,3%); perbandingan menampilkan kedua naskah.
- Pemilihan dan pengecualian seluruh isi melalui editor menghasilkan 0 token diperiksa dan skor tidak tersedia, bukan 0%.
- Tampilan 390 × 844 diperiksa; lebar konten dan layar sama-sama 390, tanpa overflow horizontal. Tampilan default juga diperiksa secara visual.
- WebMCP opsional get_ceknaskah_status mengembalikan jumlah arsip dan kesiapan offline; masukan tambahan yang tidak valid ditolak.

## Benchmark sintetis

Pada proses Node.js lokal: 50 sumber × 2.000 kata dan naskah 5.000 kata, 154 ms, dua rentang cocok, skor 80% sesuai data yang sengaja menyalin 4.000 kata. Ini satu pengukuran sintetis, bukan jaminan waktu untuk PDF besar atau bahasa alami repetitif; bukan benchmark browser atau angka akurasi.

## Batas verifikasi

- Tombol ekspor HTML/JSON dipicu di browser tanpa galat konsol. Alat browser tidak melaporkan event unduhan dan file akhir tidak dapat dikonfirmasi. Generator HTML dan JSON/backup serta keamanan escaping diuji terpisah. Unduhan aktual dan dialog Cetak/Simpan PDF perlu dicoba pada browser pengguna, misalnya Chrome atau Safari.
- Belum diuji: PDF terenkripsi, contoh berkas PDF rusak di browser, DOCX/PDF kompleks multi-kolom, kuota penyimpanan benar-benar habis, pemutusan seluruh jaringan perangkat, penutupan proses browser sepenuhnya, instalasi ikon PWA, serta seluruh browser/OS lain.
- Pembatalan menggunakan penghentian Web Worker dan status terhenti telah diimplementasikan; uji interaksi pembatalan pekerjaan panjang belum dijalankan.
- Semua data yang digunakan adalah data contoh buatan. Tidak ada naskah pengguna yang dikirim ke server atau dianalisis selama pengujian.

Proyek ini menggunakan React dan JavaScript ESM, bukan TypeScript/Vite yang disarankan dalam referensi. Aplikasi diserahkan lokal beserta build statis, tanpa publikasi hosting eksternal. Antarmuka utama memiliki kamus ID/EN; beberapa pesan diagnostik dan laporan tetap Indonesia.
