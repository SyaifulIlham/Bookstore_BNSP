import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useCart } from '../auth/useCart';
import { formatRupiah } from '../services/bookApi';

function MaterialCard({ material }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [cartFeedback, setCartFeedback] = useState('');

  function handleAddToCart() {
    if (!user) {
      navigate('/login');
      return;
    }

    setCartFeedback(addToCart(material) || `${material.title} ditambahkan ke keranjang.`);
  }

  return (
    <Card className="book-card h-100">
      <div className="book-card__cover">
        <div className="book-card__fallback" aria-hidden="true">
          <span>{material.author}</span>
          <strong>{material.title}</strong>
        </div>
        {material.image && (
          <img
            src={material.image}
            alt={`Sampul buku ${material.title} karya ${material.author}`}
            loading="lazy"
            onError={(event) => event.currentTarget.remove()}
          />
        )}
      </div>
      <Card.Body className="d-flex flex-column p-4">
        <span className="book-card__category">{material.genre}</span>
        <Card.Title className="book-card__title mt-2">{material.title}</Card.Title>
        <Card.Text className="book-card__author">oleh {material.author}</Card.Text>
        <Card.Text className="text-muted small">{material.description}</Card.Text>
        <div className="mt-auto">
          <strong className="book-card__price">{formatRupiah(material.price)}</strong>
          <div className="text-muted small mt-1">Stok: {material.stock}</div>
        </div>
        <div className="d-flex justify-content-end mt-auto pt-3">
          <Button as={Link} to={`/buku/${material.id}`} variant="outline-dark" size="sm">
            Lihat buku
          </Button>
        </div>
        {user?.role !== 'admin' && (
          <Button
            className="mt-2"
            disabled={material.stock < 1}
            onClick={handleAddToCart}
            size="sm"
            variant="dark"
          >
            {material.stock < 1 ? 'Stok habis' : 'Tambah ke keranjang'}
          </Button>
        )}
        {cartFeedback && (
          <Alert
            className="mt-2 mb-0 py-2"
            onClose={() => setCartFeedback('')}
            dismissible
            variant={cartFeedback.startsWith('Stok') || cartFeedback.startsWith('Jumlah') ? 'warning' : 'success'}
          >
            {cartFeedback}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}

export default MaterialCard;