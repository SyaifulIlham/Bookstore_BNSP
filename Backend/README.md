# Worthbook backend

Laravel API untuk katalog buku di aplikasi React. Data buku dibaca dari
database MySQL/MariaDB `db_penjualan_buku`.

## Menjalankan aplikasi

1. Buat database `db_penjualan_buku`, lalu impor
   `database/db_penjualan_buku.sql` melalui phpMyAdmin atau klien MySQL.
2. Jalankan `composer install`. Salin `.env.example` menjadi `.env` jika belum
   ada, lalu sesuaikan `DB_HOST`, `DB_PORT`, `DB_USERNAME`, dan `DB_PASSWORD`.
3. Jalankan `php artisan key:generate` jika `APP_KEY` belum diisi.
4. Jalankan `php artisan migrate --force` untuk menambahkan tabel token,
   kolom kuantitas transaksi, dan meng-hash password lama yang masih berupa
   teks biasa.
5. Jalankan `php artisan storage:link` agar sampul buku yang diunggah dapat
   diakses melalui URL publik.
6. Dari folder root project, jalankan `npm install` sekali lalu `npm run dev`.
   Script ini menjalankan Laravel API dan React Vite bersamaan.

API katalog: `GET /api/books` dan `GET /api/books/{id}`. Login dan registrasi
tersedia di `/api/auth/login` dan `/api/auth/register`. CRUD admin tersedia di
`/api/admin/books`, `/api/admin/authors`, dan `/api/admin/genres`; endpoint
tersebut memerlukan token admin. Sampul buku dapat diunggah pada field
`cover_photo_file` (JPG, PNG, atau WebP, maksimal 5 MB). Customer dapat membuat
pesanan langsung melalui `/api/customer/transactions`, atau checkout beberapa
buku sekaligus secara atomik melalui `/api/customer/transactions/checkout`.
Daftar pesanan tersedia di `/api/customer/transactions`.

Pendaftaran publik selalu membuat akun customer. Buat akun admin dengan
mengubah `role` pengguna tepercaya menjadi `admin` di database. Pembelian
mencatat pesanan dan mengurangi stok, tetapi belum memproses pembayaran online.
