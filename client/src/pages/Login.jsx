import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <h1>Log in to TaskFlow</h1>
      <p className="muted">Pick up where your team left off.</p>
      <form onSubmit={submit} className="panel">
        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Logging in' : 'Log in'}</button>
      </form>
      <p className="muted center">New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
