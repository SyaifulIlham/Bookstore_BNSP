import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { useAuth } from '../auth/useAuth';
import { apiRequest } from '../services/api';

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    apiRequest('/customer/transactions', { token })
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Pesanan gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="page-shell container py-5">
      <h1 className="h2 fw-bold mb-4">Pesanan saya</h1>
      {loading ? (
        <div className="text-center py-4" role="status">
          <Spinner animation="border" className="me-2" />
          Memuat pesanan...
        </div>
      ) : error ? (
        <Alert variant="danger" role="alert">{error}</Alert>
      ) : orders.length === 0 ? (
        <Alert variant="info">Anda belum memiliki pesanan.</Alert>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr><th>Nomor pesanan</th><th>Buku</th><th>Jumlah</th><th>Total</th><th>Alamat pengiriman</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.book?.title || 'Buku tidak tersedia'}</td>
                  <td>{order.quantity}</td>
                  <td>{Number(order.total_amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                  <td>{order.delivery_address || 'Alamat belum tersedia'}</td>
                  <td>{order.status || 'menunggu'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default OrdersPage;
