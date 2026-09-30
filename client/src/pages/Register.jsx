import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <h1>Create your account</h1>
      <p className="muted">Set up projects, invite your team and track every task.</p>
      <form onSubmit={submit} className="panel">
        <label className="field">
          <span>Full name</span>
          <input required maxLength={50} autoComplete="name" value={form.name} onChange={set('name')} />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
          <small className="muted">At least 6 characters</small>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Creating account' : 'Create account'}</button>
      </form>
      <p className="muted center">Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}
