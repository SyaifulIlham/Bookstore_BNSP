# Worthbook backend

Laravel API untuk katalog buku di aplikasi React. Data buku dibaca dari
database MySQL/MariaDB `db_penjualan_buku`.

## Menjalankan aplikasi

1. Buat database `db_penjualan_buku`. Untuk mempertahankan katalog dan akun
   contoh, impor `database/db_penjualan_buku.sql`; database kosong juga dapat
   dibuat langsung dengan menjalankan migrasi pada langkah berikutnya.
2. Jalankan `composer install`. Salin `.env.example` menjadi `.env` jika belum
   ada, lalu sesuaikan `DB_HOST`, `DB_PORT`, `DB_USERNAME`, dan `DB_PASSWORD`.
3. Jalankan `php artisan key:generate` jika `APP_KEY` belum diisi.
4. Jalankan `php artisan migrate --force` untuk menambahkan tabel fitur toko dan
   token, serta meng-hash password lama yang masih berupa teks biasa. Migrasi
   juga melengkapi timestamp pada tabel pengguna lama.
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
buku sekaligus secara atomik melalui `/api/customer/transactions/checkout`
dengan menyertakan `delivery_address`. Checkout menyimpan alamat, menghitung
total per buku, memberi status awal `menunggu`, dan langsung mengurangi stok;
pembayaran aktual masih dikelola di luar aplikasi tanpa payment gateway.
Admin dapat memajukan status pesanan melalui
`PATCH /api/admin/transactions/{id}/status` dari `menunggu` ke `diproses`, lalu
ke `selesai` setelah pesanan terkirim. Daftar pesanan tersedia di
`/api/customer/transactions`; admin dapat melihat transaksi, pengguna, serta
pesan masuk di endpoint `/api/admin`.
Katalog mendukung pencarian dengan parameter `q` pada `GET /api/books`.

Pendaftaran publik selalu membuat akun customer. Buat akun admin dengan
mengubah `role` pengguna tepercaya menjadi `admin` di database. Pesan kontak
disimpan dan dapat dibaca admin, sementara halaman Tentang Kami tersedia di
`/about` pada frontend.
