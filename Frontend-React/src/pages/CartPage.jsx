import { useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useCart } from '../auth/useCart';
import { apiRequest } from '../services/api';
import { formatRupiah } from '../services/bookApi';

function CartPage({ books, loading, error: catalogError }) {
  const { token } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const cartItems = useMemo(() => items.map((item) => ({
    ...item,
    book: books.find((book) => Number(book.id) === item.bookId),
  })), [books, items]);
  const subtotal = cartItems.reduce(
    (total, item) => total + (item.book ? item.book.price * item.quantity : 0),
    0,
  );
  const hasInvalidItems = cartItems.some(
    (item) => !item.book || item.quantity > Number(item.book.stock),
  );

  async function handleCheckout() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const transactions = await apiRequest('/customer/transactions/checkout', {
        method: 'POST',
        token,
        body: {
          items: items.map((item) => ({ book_id: item.bookId, quantity: item.quantity })),
        },
      });

      if (!Array.isArray(transactions)) {
        throw new Error('Respons checkout dari server tidak valid.');
      }

      const orderNumbers = transactions.map((transaction) => transaction.order_number).filter(Boolean);
      clearCart();
      setSuccess(
        orderNumbers.length
          ? `Pesanan berhasil dibuat: ${orderNumbers.join(', ')}.`
          : 'Pesanan berhasil dibuat.',
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Checkout gagal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">BELANJA ANDA</p>
          <h1 className="h2 fw-bold mb-0">Keranjang</h1>
        </div>
        <Link className="btn btn-outline-dark" to="/book">Lanjut belanja</Link>
      </div>

      {catalogError && <Alert variant="danger" role="alert">{catalogError}</Alert>}
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      {success && (
        <Alert variant="success" role="status">
          {success} <Link to="/pesanan">Lihat pesanan</Link>
        </Alert>
      )}

      {loading ? (
        <p className="text-muted" role="status">Memuat detail buku...</p>
      ) : items.length === 0 ? (
        <Alert variant="info">
          Keranjang masih kosong. <Link to="/book">Jelajahi katalog buku</Link>
        </Alert>
      ) : (
        <>
          {hasInvalidItems && (
            <Alert variant="warning" role="alert">
              Periksa kembali stok buku yang berubah atau buku yang tidak lagi tersedia sebelum checkout.
            </Alert>
          )}
          <div className="table-responsive cart-table">
            <table className="table align-middle">
              <thead>
                <tr><th>Buku</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.bookId}>
                    <td>
                      <strong>{item.book?.title || 'Buku tidak tersedia'}</strong>
                      {item.book && <div className="text-muted small">oleh {item.book.author}</div>}
                    </td>
                    <td>{item.book ? formatRupiah(item.book.price) : '—'}</td>
                    <td>
                      <input
                        aria-label={`Jumlah ${item.book?.title || 'buku'}`}
                        className="form-control cart-quantity"
                        disabled={!item.book || saving}
                        max={item.book?.stock}
                        min="1"
                        onChange={(event) => {
                          const nextQuantity = Number(event.target.value);
                          if (event.target.value === '') return;
                          const updateError = updateQuantity(item.bookId, nextQuantity, Number(item.book?.stock));
                          if (updateError) setError(updateError);
                          else setError('');
                        }}
                        type="number"
                        value={item.quantity}
                      />
                    </td>
                    <td>{item.book ? formatRupiah(item.book.price * item.quantity) : '—'}</td>
                    <td>
                      <Button
                        disabled={saving}
                        onClick={() => removeFromCart(item.bookId)}
                        size="sm"
                        variant="outline-danger"
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3">Total</th>
                  <th>{formatRupiah(subtotal)}</th>
                  <th />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <Button
              disabled={saving || hasInvalidItems || cartItems.length === 0}
              onClick={handleCheckout}
              variant="dark"
            >
              {saving ? 'Memproses pesanan...' : 'Checkout'}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}

export default CartPage;
