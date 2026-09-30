import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils.js';

export default function MembersPanel({ project, myRole, onChange, onLeft }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isAdmin = myRole === 'admin';

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      const d = await api(`/projects/${project._id}/members`, { method: 'POST', body: { email, role } });
      onChange(d.project);
      setEmail('');
    });
  };

  const changeRole = (userId, newRole) =>
    run(async () => {
      const d = await api(`/projects/${project._id}/members/${userId}`, { method: 'PATCH', body: { role: newRole } });
      onChange(d.project);
    });

  const remove = (member) => {
    const isSelf = member.user._id === user._id;
    const msg = isSelf ? 'Leave this project?' : `Remove ${member.user.name} from this project?`;
    if (!window.confirm(msg)) return;
    run(async () => {
      const d = await api(`/projects/${project._id}/members/${member.user._id}`, { method: 'DELETE' });
      if (isSelf) onLeft();
      else onChange(d.project);
    });
  };

  return (
    <section className="panel members" aria-label="Project members">
      <h2>Members</h2>
      {error && <p className="error" role="alert">{error}</p>}

      <ul className="member-list">
        {project.members.map((m) => {
          const isSelf = m.user._id === user._id;
          return (
            <li key={m.user._id}>
              <span className="avatar">{initials(m.user.name)}</span>
              <div className="member-info">
                <strong>{m.user.name}{isSelf ? ' (you)' : ''}</strong>
                <span className="muted">{m.user.email}</span>
              </div>
              {isAdmin ? (
                <select
                  value={m.role}
                  disabled={busy}
                  onChange={(e) => changeRole(m.user._id, e.target.value)}
                  aria-label={`Role for ${m.user.name}`}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              ) : (
                <span className="pill">{m.role === 'admin' ? 'Admin' : 'Member'}</span>
              )}
              {(isAdmin || isSelf) && (
                <button className="link-btn danger-text" disabled={busy} onClick={() => remove(m)}>
                  {isSelf ? 'Leave' : 'Remove'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isAdmin && (
        <form className="add-member" onSubmit={add}>
          <input
            type="email"
            required
            placeholder="Teammate's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Teammate's email"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role for new member">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn small" disabled={busy}>Add member</button>
        </form>
      )}
    </section>
  );
}
