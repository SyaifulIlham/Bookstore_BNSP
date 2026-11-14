import { apiRequest } from './api';

function normalizeBook(book) {
  const cover = typeof book.cover_photo === 'string' ? book.cover_photo.trim() : '';

  return {
    id: book.id,
    title: book.title,
    description: book.description,
    author: book.author?.name || 'Penulis belum diketahui',
    genre: book.genre?.name || 'Koleksi buku',
    price: Number(book.price),
    stock: Number(book.stock),
    image: /^(https?:\/\/|\/)/i.test(cover) ? cover : null,
  };
}

export async function fetchBooks() {
  const books = await apiRequest('/books');
  if (!Array.isArray(books)) {
    throw new Error('Format data katalog buku dari API tidak valid.');
  }

  return books.map(normalizeBook);
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
