import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { CartContext } from './cartContext';

function readCart(storageKey) {
  const savedCart = localStorage.getItem(storageKey);
  if (!savedCart) return [];

  try {
    const items = JSON.parse(savedCart);
    if (!Array.isArray(items)) throw new Error('Data keranjang harus berupa daftar.');

    return items
      .filter((item) => Number.isInteger(Number(item.bookId)) && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
      .map((item) => ({ bookId: Number(item.bookId), quantity: Number(item.quantity) }));
  } catch (error) {
    console.error('Data keranjang tersimpan tidak dapat dibaca.', error);
    return [];
  }
}

function CartStateProvider({ children, storageKey }) {
  const [items, setItems] = useState(() => readCart(storageKey));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addToCart = useCallback((book, quantity = 1) => {
    if (book.stock < 1) return 'Stok buku habis.';
    if (!Number.isInteger(quantity) || quantity < 1) return 'Jumlah minimal satu buku.';

    const existing = items.find((item) => item.bookId === Number(book.id));
    if ((existing?.quantity || 0) + quantity > book.stock) {
      return 'Jumlah di keranjang melebihi stok yang tersedia.';
    }

    setItems(existing
      ? items.map((item) => (
        item.bookId === Number(book.id) ? { ...item, quantity: item.quantity + quantity } : item
      ))
      : [...items, { bookId: Number(book.id), quantity }]);

    return '';
  }, [items]);

  const updateQuantity = useCallback((bookId, quantity, maxStock) => {
    const bookItem = items.find((item) => item.bookId === Number(bookId));
    if (!bookItem) return 'Buku tidak ditemukan di keranjang.';
    if (!Number.isInteger(quantity) || quantity < 1) return 'Jumlah minimal satu buku.';
    if (quantity > maxStock) return 'Jumlah melebihi stok yang tersedia.';

    setItems(items.map((item) => (
      item.bookId === Number(bookId) ? { ...item, quantity } : item
    )));
    return '';
  }, [items]);

  const removeFromCart = useCallback((bookId) => {
    setItems(items.filter((item) => item.bookId !== Number(bookId)));
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }), [items, addToCart, updateQuantity, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = `worthbook_cart_${user?.id ?? 'guest'}`;

  return (
    <CartStateProvider key={storageKey} storageKey={storageKey}>
      {children}
    </CartStateProvider>
  );
}
