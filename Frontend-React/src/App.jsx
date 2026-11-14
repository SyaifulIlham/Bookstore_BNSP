import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import BookPage from './pages/Bookpage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ContactPage from './pages/Contact';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import MaterialDetailPage from './pages/MaterialDetail';
import RegisterPage from './pages/Register';
import TeamPage from './pages/Team';
import { fetchBooks } from './services/bookApi';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminPage from './admin/AdminPage';
import OrdersPage from './pages/OrdersPage';
import CartPage from './pages/CartPage';
import { useAuth } from './auth/useAuth';
import './App.css';

function NotFoundPage() {
  return (
    <main className="container my-5 text-center">
      <h1>Halaman tidak ditemukan</h1>
      <Link to="/">Kembali ke Home</Link>
    </main>
  );
}

function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [booksError, setBooksError] = useState('');

  useEffect(() => {
    let active = true;

    fetchBooks()
      .then((catalog) => {
        if (active) setBooks(catalog);
      })
      .catch((error) => {
        if (active) {
          setBooksError(error instanceof Error ? error.message : 'Katalog buku gagal dimuat.');
        }
      })
      .finally(() => {
        if (active) setLoadingBooks(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage books={books} loading={loadingBooks} error={booksError} />} />
        <Route path="/book" element={<BookPage books={books} loading={loadingBooks} error={booksError} />} />
        <Route path="/buku/:id" element={<MaterialDetailPage books={books} loading={loadingBooks} error={booksError} />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
        <Route path="/pesanan" element={<ProtectedRoute role="customer"><OrdersPage /></ProtectedRoute>} />
        <Route path="/keranjang" element={<ProtectedRoute role="customer"><CartPage books={books} loading={loadingBooks} error={booksError} /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {user?.role !== 'admin' && !pathname.startsWith('/admin') && <Footer />}
    </div>
  );
}

export default App;