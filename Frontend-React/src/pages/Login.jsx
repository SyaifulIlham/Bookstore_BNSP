import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import FormField from '../elements/FormField';

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/pesanan', { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');

    try {
      const authenticatedUser = await login({
        email: form.elements.namedItem('email').value,
        password: form.elements.namedItem('password').value,
      });
      navigate(authenticatedUser.role === 'admin' ? '/admin' : '/pesanan', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login gagal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page py-5">
      <Container>
        <section className="auth-card mx-auto">
          <p className="eyebrow">Selamat datang kembali</p>
          <h1 className="h2 fw-bold">Masuk</h1>
          <p className="text-muted">Masuk ke akun Worthbook Anda.</p>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <FormField id="login-email" name="email" label="Email" type="email" placeholder="nama@email.com" autoComplete="email" required />
            <FormField id="login-password" name="password" label="Password" type="password" placeholder="Masukkan password" autoComplete="current-password" required />
            <Button type="submit" className="w-100 mt-2" disabled={saving}>{saving ? 'Memeriksa...' : 'Masuk'}</Button>
          </Form>
          <p className="mt-4 mb-0 text-center text-muted">
            Belum punya akun? <Link to="/register">Daftar sekarang</Link>
          </p>
          <p className="mt-2 mb-0 text-center text-muted">
            Admin? <Link to="/admin/login">Masuk sebagai admin</Link>
          </p>
        </section>
      </Container>
    </main>
  );
}

export default LoginPage;
