import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';
import MembersPanel from '../components/MembersPanel.jsx';
import { STATUS_LABELS } from '../utils.js';

const COLUMNS = ['todo', 'in-progress', 'done'];
const PAGE_SIZE = 12;
const DEFAULT_FILTERS = { q: '', status: '', priority: '', assignee: '', sort: 'newest', overdue: false };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState('');
  const [fatal, setFatal] = useState('');
  const [modal, setModal] = useState(null); // null or { task: object | null }
  const [showMembers, setShowMembers] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const isAdmin = myRole === 'admin';

  useEffect(() => {
    api(`/projects/${id}`)
      .then((d) => { setProject(d.project); setMyRole(d.myRole); })
      .catch((e) => setFatal(e.message));
  }, [id]);

  const fetchStats = useCallback(
    () => api(`/projects/${id}/stats`).then((d) => setStats(d.stats)).catch(() => {}),
    [id]
  );
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Wait for the user to stop typing before searching
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 350);
    return () => clearTimeout(t);
  }, [filters.q]);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const d = await api(`/projects/${id}/tasks`, {
        params: {
          q: debouncedQ,
          status: filters.status,
          priority: filters.priority,
          assignee: filters.assignee,
          sort: filters.sort,
          overdue: filters.overdue ? 'true' : '',
          page,
          limit: PAGE_SIZE,
        },
      });
      if (d.tasks.length === 0 && page > 1) setPage(page - 1); // page emptied by a delete
      setTasks(d.tasks);
      setPagination(d.pagination);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingTasks(false);
    }
  }, [id, debouncedQ, filters.status, filters.priority, filters.assignee, filters.sort, filters.overdue, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const filtersActive =
    filters.q || filters.status || filters.priority || filters.assignee || filters.overdue;
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setDebouncedQ(''); setPage(1); };

  const canEditTask = (t) =>
    isAdmin || t.createdBy?._id === user._id || t.assignee?._id === user._id;

  const moveTask = async (task, status) => {
    try {
      const d = await api(`/tasks/${task._id}/status`, { method: 'PATCH', body: { status } });
      setTasks((ts) => ts.map((t) => (t._id === task._id ? d.task : t)));
      fetchStats();
    } catch (e) {
      setError(e.message);
    }
  };

  const afterTaskChange = () => { setModal(null); fetchTasks(); fetchStats(); };

  const startEdit = () => {
    setEditForm({ name: project.name, description: project.description || '' });
    setEditing(true);
  };
  const saveProject = async (e) => {
    e.preventDefault();
    try {
      const d = await api(`/projects/${id}`, { method: 'PUT', body: editForm });
      setProject((p) => ({ ...p, name: d.project.name, description: d.project.description }));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };
  const deleteProject = async () => {
    if (!window.confirm('Delete this project, all of its tasks and comments? This cannot be undone.')) return;
    try {
      await api(`/projects/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  if (fatal) {
    return (
      <div className="empty">
        <p>{fatal}</p>
        <Link to="/">Back to your projects</Link>
      </div>
    );
  }
  if (!project) return <div className="spinner" role="status" aria-label="Loading" />;

  const total = stats?.total || 0;

  return (
    <>
      <Link to="/" className="back">Back to projects</Link>

      <div className="page-head">
        {editing ? (
          <form className="edit-project" onSubmit={saveProject}>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} maxLength={80} required aria-label="Project name" />
            <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} maxLength={500} placeholder="Description" aria-label="Project description" />
            <button className="btn small">Save</button>
            <button type="button" className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        ) : (
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="muted">{project.description}</p>}
          </div>
        )}
        <div className="head-actions">
          <button className="btn" onClick={() => setModal({ task: null })}>New task</button>
          <button className="btn ghost" onClick={() => setShowMembers((s) => !s)} aria-expanded={showMembers}>
            Members ({project.members.length})
          </button>
          {isAdmin && !editing && <button className="btn ghost" onClick={startEdit}>Edit project</button>}
          {isAdmin && <button className="btn ghost danger" onClick={deleteProject}>Delete project</button>}
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {showMembers && (
        <MembersPanel
          project={project}
          myRole={myRole}
          onChange={(p) => setProject((prev) => ({ ...prev, members: p.members }))}
          onLeft={() => navigate('/')}
        />
      )}

      {stats && (
        <section className="stats" aria-label="Project progress">
          <div className="stat-bar" role="img" aria-label={`${stats.done} done, ${stats['in-progress']} in progress, ${stats.todo} to do`}>
            <span className="seg done" style={{ width: `${total ? (stats.done / total) * 100 : 0}%` }} />
            <span className="seg progress-seg" style={{ width: `${total ? (stats['in-progress'] / total) * 100 : 0}%` }} />
          </div>
          <p>
            <strong>{stats.done}</strong> of {total} tasks done
            {stats.overdue > 0 && <span className="overdue"> · {stats.overdue} overdue</span>}
          </p>
        </section>
      )}

      <div className="toolbar" role="search">
        <input
          type="search"
          placeholder="Search tasks"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          aria-label="Search tasks"
        />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {COLUMNS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Filter by priority">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.assignee} onChange={(e) => setFilter('assignee', e.target.value)} aria-label="Filter by assignee">
          <option value="">Everyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {project.members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort tasks">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="due-soon">Due soonest</option>
          <option value="due-late">Due latest</option>
          <option value="priority">Highest priority</option>
          <option value="title">Title A to Z</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={filters.overdue} onChange={(e) => setFilter('overdue', e.target.checked)} />
          Overdue only
        </label>
        {filtersActive && <button className="link-btn" onClick={clearFilters}>Clear filters</button>}
      </div>

      {!loadingTasks && tasks.length === 0 ? (
        <p className="empty">
          {filtersActive ? 'No tasks match these filters.' : 'No tasks yet. Create the first one to get this project moving.'}
        </p>
      ) : (
        <div className={`board ${loadingTasks ? 'loading' : ''}`}>
          {COLUMNS.map((status) => {
            const col = tasks.filter((t) => t.status === status);
            return (
              <section key={status} className={`column col-${status}`} aria-label={STATUS_LABELS[status]}>
                <h2>{STATUS_LABELS[status]} <span className="count">{col.length}</span></h2>
                {col.length === 0 && <p className="muted col-empty">Nothing here</p>}
                {col.map((t) => (
                  <TaskCard key={t._id} task={t} canEdit={canEditTask(t)} onOpen={(task) => setModal({ task })} onMove={moveTask} />
                ))}
              </section>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <nav className="pager" aria-label="Task pages">
          <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} tasks</span>
          <button className="btn ghost small" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}

      {modal && (
        <TaskModal
          task={modal.task}
          project={project}
          myRole={myRole}
          onClose={() => setModal(null)}
          onSaved={afterTaskChange}
          onDeleted={afterTaskChange}
        />
      )}
    </>
  );
}
