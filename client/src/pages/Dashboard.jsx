import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { STATUS_LABELS, formatDate, isOverdue } from '../utils.js';

function ProgressBar({ stats }) {
  const total = stats.total || 1;
  return (
    <div className="progress" role="img" aria-label={`${stats.done} of ${stats.total} tasks done`}>
      <span className="seg done" style={{ width: `${(stats.done / total) * 100}%` }} />
      <span className="seg progress-seg" style={{ width: `${(stats['in-progress'] / total) * 100}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api('/projects'), api('/tasks/mine')]);
      setProjects(p.projects);
      setMine(t.tasks);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const d = await api('/projects', { method: 'POST', body: form });
      navigate(`/projects/${d.project._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi, {user.name.split(' ')[0]}</h1>
          <p className="muted">Your projects and everything assigned to you.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New project'}</button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {showForm && (
        <form className="panel create-project" onSubmit={create}>
          <label className="field">
            <span>Project name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} required autoFocus />
          </label>
          <label className="field">
            <span>Description (optional)</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
          </label>
          <button className="btn" disabled={saving}>Create project</button>
        </form>
      )}

      <div className="dash-grid">
        <section aria-label="Your projects">
          <h2>Projects</h2>
          {!projects && !error && <div className="spinner" role="status" aria-label="Loading" />}
          {projects && projects.length === 0 && (
            <p className="empty">You are not in any project yet. Create one to start adding tasks.</p>
          )}
          <div className="project-grid">
            {projects?.map((p) => (
              <Link key={p._id} to={`/projects/${p._id}`} className="project-card">
                <div className="project-card-head">
                  <h3>{p.name}</h3>
                  <span className="pill">{p.myRole === 'admin' ? 'Admin' : 'Member'}</span>
                </div>
                {p.description && <p className="muted clamp">{p.description}</p>}
                <ProgressBar stats={p.stats} />
                <p className="project-foot">
                  <span>{p.stats.done}/{p.stats.total} done</span>
                  {p.stats.overdue > 0 && <span className="overdue">{p.stats.overdue} overdue</span>}
                  <span className="muted">{p.memberCount} {p.memberCount === 1 ? 'member' : 'members'}</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        <aside aria-label="Assigned to you">
          <h2>Assigned to you</h2>
          {projects && mine.length === 0 && <p className="empty small">Nothing assigned to you right now.</p>}
          <ul className="mine">
            {mine.map((t) => (
              <li key={t._id}>
                <Link to={`/projects/${t.project?._id}`}>{t.title}</Link>
                <span className="muted">
                  {t.project?.name} · {STATUS_LABELS[t.status]}
                  {t.dueDate && <span className={isOverdue(t) ? 'overdue' : ''}> · Due {formatDate(t.dueDate)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
