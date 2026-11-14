import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

function ProtectedRoute({ role, children }) {
  const { user, loading, authError } = useAuth();

  if (loading) {
    return (
      <main className="container py-5 text-center" role="status">
        <Spinner animation="border" className="me-2" />
        Memeriksa sesi...
      </main>
    );
  }

  if (authError) {
    return <main className="container py-5"><Alert variant="danger">{authError}</Alert></main>;
  }

  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  }

  if (user.role !== role) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
