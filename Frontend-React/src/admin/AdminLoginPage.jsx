import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AdminLogin from './components/AdminLogin';

function AdminLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');

    try {
      const user = await login({
        email: form.elements.namedItem('email').value,
        password: form.elements.namedItem('password').value,
      });

      if (user.role !== 'admin') {
        await logout();
        setError('Akun ini tidak memiliki akses administrator.');
        return;
      }

      navigate('/admin', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login admin gagal.');
    } finally {
      setSaving(false);
    }
  }

  return <AdminLogin error={error} onSubmit={handleSubmit} saving={saving} />;
}

export default AdminLoginPage;
