import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import FormField from '../elements/FormField';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = form.elements.namedItem('password');
    const confirmation = form.elements.namedItem('confirmPassword');

    confirmation.setCustomValidity(
      password.value === confirmation.value ? '' : 'Konfirmasi password tidak cocok.',
    );
    if (!form.reportValidity()) return;

    setSaving(true);
    setError('');

    try {
      await register({
        name: form.elements.namedItem('name').value,
        email: form.elements.namedItem('email').value,
        password: password.value,
        password_confirmation: confirmation.value,
      });
      navigate('/pesanan', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Pendaftaran gagal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page py-5">
      <Container>
        <section className="auth-card mx-auto">
          <p className="eyebrow">Bergabung dengan Worthbook</p>
          <h1 className="h2 fw-bold">Buat akun</h1>
          <p className="text-muted">Buat akun untuk menyimpan dan menemukan cerita favorit Anda.</p>
          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <FormField id="register-name" name="name" label="Nama lengkap" placeholder="Nama Anda" autoComplete="name" required />
            <FormField id="register-email" name="email" label="Email" type="email" placeholder="nama@email.com" autoComplete="email" required />
            <FormField id="register-password" name="password" label="Password" type="password" placeholder="Minimal 8 karakter" autoComplete="new-password" minLength={8} required />
            <FormField
              id="register-confirm-password"
              name="confirmPassword"
              label="Konfirmasi password"
              type="password"
              placeholder="Ulangi password"
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => event.currentTarget.setCustomValidity('')}
              required
            />
            <Button type="submit" className="w-100 mt-2" disabled={saving}>{saving ? 'Mendaftarkan...' : 'Daftar'}</Button>
          </Form>
          <p className="mt-4 mb-0 text-center text-muted">
            Sudah punya akun? <Link to="/login">Login</Link>
          </p>
        </section>
      </Container>
    </main>
  );
}

export default RegisterPage;
