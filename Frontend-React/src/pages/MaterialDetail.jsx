import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { FaHeart } from 'react-icons/fa6';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatRupiah } from '../services/bookApi';
import { apiRequest } from '../services/api';
import { useAuth } from '../auth/useAuth';
import { useCart } from '../auth/useCart';

function MaterialDetailPage({ books, loading, error }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { addToCart } = useCart();
  const book = books.find((item) => item.id === Number(id));
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const isFavorite = favoriteIds.has(id);

  function handleAddToCart() {
    if (!user) {
      navigate('/login');
      return;
    }

    setCartMessage(addToCart(book, Number(quantity)) || `${book.title} ditambahkan ke keranjang.`);
  }

  async function handlePurchase() {
    if (!user) {
      navigate('/login');
      return;
    }

    setPurchasing(true);
    setPurchaseError('');
    setPurchaseMessage('');

    try {
      const transaction = await apiRequest('/customer/transactions', {
        method: 'POST',
        token,
        body: { book_id: book.id, quantity: Number(quantity) },
      });
      setPurchaseMessage(`Pesanan ${transaction.order_number} berhasil dibuat.`);
    } catch (requestError) {
      setPurchaseError(requestError instanceof Error ? requestError.message : 'Pesanan gagal dibuat.');
    } finally {
      setPurchasing(false);
    }
  }

  if (!book) {
    if (loading) {
      return (
        <main className="container page-shell py-5 text-center" role="status">
          <Spinner animation="border" className="me-2" />
          Memuat detail buku...
        </main>
      );
    }

    return (
      <main className="container page-shell py-5">
        <Alert variant="warning">
          {error || 'Buku tidak ditemukan.'} <Link to="/">Lihat semua buku</Link>
        </Alert>
      </main>
    );
  }

  return (
    <main>
      <Container className="page-shell py-5">
        <Link to="/#buku" className="text-decoration-none">← Kembali ke koleksi buku</Link>
        <article className="book-detail mt-4">
          <div className="row align-items-center g-5">
            <div className="col-md-4">
              <div className="book-detail__cover">
                <div className="book-card__fallback" aria-hidden="true">
                  <span>{book.author}</span>
                  <strong>{book.title}</strong>
                </div>
                {book.image && (
                  <img
                    src={book.image}
                    alt={`Sampul buku ${book.title} karya ${book.author}`}
                    onError={(event) => event.currentTarget.remove()}
                  />
                )}
              </div>
            </div>
            <div className="col-md-8">
              <span className="book-detail__category">{book.genre}</span>
              <h1 className="display-5 fw-bold">{book.title}</h1>
              <p className="lead text-muted">oleh {book.author}</p>
              <div className="book-detail__purchase">
                <strong className="book-detail__price">{formatRupiah(book.price)}</strong>
                <div className="text-muted mt-1">Stok tersedia: {book.stock}</div>
                {user?.role !== 'admin' && (
                  <div className="d-flex flex-wrap align-items-end gap-2 mt-3">
                    <label className="form-label mb-0">
                      Jumlah
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        max={book.stock}
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        disabled={book.stock < 1 || purchasing}
                      />
                    </label>
                    <Button
                      type="button"
                      onClick={handlePurchase}
                      disabled={book.stock < 1 || purchasing || Number(quantity) < 1 || Number(quantity) > book.stock}
                    >
                      {purchasing ? 'Memproses...' : book.stock < 1 ? 'Stok habis' : 'Beli sekarang'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={book.stock < 1 || Number(quantity) < 1 || Number(quantity) > book.stock}
                      variant="outline-dark"
                    >
                      Tambah ke keranjang
                    </Button>
                  </div>
                )}
                {cartMessage && (
                  <Alert
                    className="mt-3 mb-0"
                    dismissible
                    onClose={() => setCartMessage('')}
                    variant={cartMessage.startsWith('Jumlah') || cartMessage.startsWith('Stok') ? 'warning' : 'success'}
                  >
                    {cartMessage} {cartMessage.includes('ditambahkan') && <Link to="/keranjang">Lihat keranjang</Link>}
                  </Alert>
                )}
                {purchaseError && <Alert className="mt-3 mb-0" variant="danger" role="alert">{purchaseError}</Alert>}
                {purchaseMessage && (
                  <Alert className="mt-3 mb-0" variant="success" role="status">
                    {purchaseMessage} <Link to="/pesanan">Lihat pesanan</Link>
                  </Alert>
                )}
              </div>
              <section className="book-detail__synopsis" aria-labelledby="book-synopsis-heading">
                <h2 id="book-synopsis-heading" className="book-detail__section-title">Tentang buku ini</h2>
                <p className="book-detail__description">{book.description}</p>
              </section>
              <div className="book-detail__purchase">
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Button
                    type="button"
                    variant={isFavorite ? 'danger' : 'outline-danger'}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                    onClick={() => {
                      setFavoriteIds((previous) => {
                        const next = new Set(previous);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      });
                    }}
                  >
                    <FaHeart aria-hidden="true" className="me-2" />
                    {isFavorite ? 'Tersimpan di favorit' : 'Simpan ke favorit'}
                  </Button>
                  <Button as={Link} to="/#buku" variant="outline-dark">
                    Jelajahi buku lainnya
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </Container>
    </main>
  );
}

export default MaterialDetailPage;