import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { useAuth } from '../auth/useAuth';
import { apiRequest } from '../services/api';
import { groupTransactions } from '../utils/groupTransactions';

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const groupedOrders = groupTransactions(orders);

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
        <div className="d-grid gap-3">
          {groupedOrders.map((order) => (
            <Card key={order.orderNumber} className="shadow-sm">
              <Card.Body>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <h2 className="h5 mb-1">Pesanan {order.orderNumber}</h2>
                    <span className="text-muted">{order.items.length} jenis buku · {order.quantity} buku</span>
                  </div>
                  <Badge bg="secondary">{order.items[0].status || 'menunggu'}</Badge>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle mb-3">
                    <thead>
                      <tr><th>Buku</th><th>Jumlah</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.book?.title || 'Buku tidak tersedia'}</td>
                          <td>{item.quantity}</td>
                          <td>{Number(item.total_amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex flex-wrap justify-content-between gap-2">
                  <span className="text-muted">{order.items[0].delivery_address || 'Alamat belum tersedia'}</span>
                  <strong>Total: {order.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</strong>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default OrdersPage;
