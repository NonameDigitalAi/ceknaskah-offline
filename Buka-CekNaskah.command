#!/bin/zsh
cd -- "$(dirname -- "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if /usr/bin/curl --silent --fail --max-time 2 http://localhost:4173/ >/dev/null; then
  /usr/bin/open http://localhost:4173/
  exit 0
fi
if ! command -v node >/dev/null; then
  print "Node.js belum tersedia. Gunakan alamat aplikasi yang sudah dicache atau pasang Node.js dari nodejs.org."
  read "?Tekan Enter untuk menutup."
  exit 1
fi
node serve.mjs &
CEK_PID=$!
trap 'kill "$CEK_PID" 2>/dev/null' EXIT INT TERM
/usr/bin/open http://localhost:4173/
print "CekNaskah berjalan di http://localhost:4173/. Tunggu Siap digunakan offline."
wait "$CEK_PID"
