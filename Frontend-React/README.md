# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Menghubungkan katalog buku

Frontend mengambil daftar buku dari Laravel melalui `/api/books`. Saat
development, Vite meneruskan request tersebut ke `http://127.0.0.1:8000`.
Jalankan backend dan pastikan backend terhubung ke database `db_penjualan_buku`
sebelum menjalankan `npm run dev`.

Login customer, pendaftaran, riwayat pesanan, dan dashboard admin juga memakai
API Laravel. Dashboard tersedia di `/admin`; akun admin harus sudah diberi
role `admin` di database. Customer yang login dapat memesan buku dari halaman
detailnya.

Untuk memakai host API lain, buat `.env` di folder frontend dan isi
`VITE_API_URL` (contoh: `VITE_API_URL=http://127.0.0.1:8000/api`), lalu
jalankan ulang Vite.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
