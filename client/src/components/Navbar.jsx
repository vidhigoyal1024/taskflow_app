import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <Link to="/" className="brand">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#0F766E" />
          <rect x="6" y="7" width="5" height="18" rx="1.5" fill="#fff" />
          <rect x="13.5" y="7" width="5" height="12" rx="1.5" fill="#fff" />
          <rect x="21" y="7" width="5" height="7" rx="1.5" fill="#fff" />
        </svg>
        TaskFlow
      </Link>
      {user && (
        <div className="nav-user">
          <span className="nav-name">{user.name}</span>
          <button className="btn ghost small" onClick={logout}>Log out</button>
        </div>
      )}
    </header>
  );
}
