# CekNaskah Offline

**[Buka aplikasi di GitHub Pages](https://nonamedigitalai.github.io/ceknaskah-offline/)**

Aplikasi pemeriksaan kemiripan tekstual untuk jurnal dan artikel. Naskah dibandingkan dengan koleksi sumber yang pengguna masukkan; seluruh pemrosesan dan penyimpanan naskah berlangsung di browser.

**Bukan detektor GPT, layanan Turnitin, atau sertifikat bebas plagiarisme.** Tidak ada API AI, unggahan naskah ke server, database sumber daring, login aplikasi, atau biaya per pemeriksaan.

## Penggunaan

1. Buka website dan tunggu **Siap digunakan offline**.
2. Tambahkan sumber pembanding melalui **Koleksi Sumber**.
3. Tempelkan naskah atau impor TXT, DOCX, atau PDF teks.
4. Pilih sumber dan jalankan **Periksa kemiripan**.
5. Tinjau sorotan, konteks sumber, dan sitasi; simpan catatan dan versi revisi.
6. Ekspor laporan dan cadangan secara berkala.

Status offline memverifikasi seluruh aset dalam cache service worker. PDF pindai memerlukan OCR di luar aplikasi. Menghapus data browser dapat menghapus arsip lokal.

**Pindah dari localhost ke website publik:** penyimpanannya berbeda. Ekspor cadangan dari aplikasi lokal, kemudian gunakan **Pulihkan cadangan** pada alamat website baru. Arsip tidak otomatis berpindah atau diunggah.

## Pengembangan lokal

Memerlukan Node.js 24 dan npm.

```sh
npm ci
npm test
npm run build
npm start
```

Buka `http://localhost:4173/`. Jangan membuka `index.html` menggunakan `file://`.

## Deployment GitHub Pages

Workflow `.github/workflows/pages.yml` menguji aplikasi, membuat build, dan menerbitkan hanya folder `dist`. Aktifkan **Settings → Pages → Build and deployment → Source: GitHub Actions**. Push ke branch `main` atau jalankan workflow secara manual.

Semua URL aset, manifest, worker dan scope service worker relatif, sehingga aplikasi mendukung alamat GitHub Pages di subdirektori repositori. GitHub menyajikan berkas aplikasi; naskah pengguna tetap berada di perangkat pengguna.

## Dokumentasi dan batas kemampuan

- [Panduan penggunaan](PANDUAN.md)
- [Hasil pengujian dan keterbatasan verifikasi](HASIL-UJI.md)
- [Panduan GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Mesin mencocokkan urutan kata yang sama setelah normalisasi Unicode. Skor dihitung dari gabungan token cocok dibagi token yang layak diperiksa. Rentang yang cocok dengan beberapa sumber dihitung satu kali. Parafrase menyeluruh, terjemahan, kemiripan semantik, dan sumber yang tidak dimasukkan belum tercakup.

React, Mammoth, PDF.js, dan dependensi lain menggunakan lisensi masing-masing. Lihat pemberitahuan lisensi dalam dependensi dan hasil bundel.
