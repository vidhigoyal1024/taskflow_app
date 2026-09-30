import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRIORITY_LABELS, STATUS_LABELS } from '../utils.js';

export default function TaskModal({ task, project, myRole, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const isNew = !task;
  const canEdit = isNew || myRole === 'admin' || task.createdBy?._id === user._id || task.assignee?._id === user._id;
  const canDelete = !isNew && (myRole === 'admin' || task.createdBy?._id === user._id);

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (isNew) return;
    api(`/tasks/${task._id}/comments`)
      .then((d) => setComments(d.comments))
      .catch((e) => setCommentError(e.message));
  }, [isNew, task]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, assignee: form.assignee || null, dueDate: form.dueDate || null };
      if (isNew) await api(`/projects/${project._id}/tasks`, { method: 'POST', body });
      else await api(`/tasks/${task._id}`, { method: 'PUT', body });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this task and its comments?')) return;
    try {
      await api(`/tasks/${task._id}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    setCommentError('');
    try {
      const d = await api(`/tasks/${task._id}/comments`, { method: 'POST', body: { text: commentText } });
      setComments((c) => [...c, d.comment]);
      setCommentText('');
    } catch (err) {
      setCommentError(err.message);
    }
  };

  const removeComment = async (id) => {
    try {
      await api(`/comments/${id}`, { method: 'DELETE' });
      setComments((c) => c.filter((x) => x._id !== id));
    } catch (err) {
      setCommentError(err.message);
    }
  };

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-head">
          <h2 id="task-modal-title">{isNew ? 'New task' : 'Task details'}</h2>
          <button className="link-btn" onClick={onClose} aria-label="Close">Close</button>
        </div>

        {!canEdit && <p className="notice">You can view this task and comment on it. Only admins, its creator or its assignee can edit it.</p>}

        <form onSubmit={save}>
          <fieldset disabled={!canEdit || saving}>
            <label className="field">
              <span>Title</span>
              <input value={form.title} onChange={set('title')} maxLength={120} required autoFocus />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
            </label>
            <div className="row">
              <label className="field">
                <span>Status</span>
                <select value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Priority</span>
                <select value={form.priority} onChange={set('priority')}>
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            <div className="row">
              <label className="field">
                <span>Assignee</span>
                <select value={form.assignee} onChange={set('assignee')}>
                  <option value="">Unassigned</option>
                  {project.members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Due date</span>
                <input type="date" value={form.dueDate} onChange={set('dueDate')} />
              </label>
            </div>
          </fieldset>

          {error && <p className="error" role="alert">{error}</p>}

          <div className="modal-actions">
            {canDelete && <button type="button" className="btn danger ghost" onClick={remove}>Delete task</button>}
            <span className="spacer" />
            {canEdit && <button className="btn" disabled={saving}>{isNew ? 'Create task' : 'Save changes'}</button>}
          </div>
        </form>

        {!isNew && (
          <section className="comments" aria-label="Comments">
            <h3>Comments ({comments.length})</h3>
            {comments.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}
            <ul>
              {comments.map((c) => (
                <li key={c._id}>
                  <div className="comment-head">
                    <strong>{c.author?.name || 'Former member'}</strong>
                    <span className="muted">{new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {(myRole === 'admin' || c.author?._id === user._id) && (
                      <button className="link-btn danger-text" onClick={() => removeComment(c._id)}>Delete</button>
                    )}
                  </div>
                  <p>{c.text}</p>
                </li>
              ))}
            </ul>
            {commentError && <p className="error" role="alert">{commentError}</p>}
            <form className="comment-form" onSubmit={addComment}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment"
                maxLength={1000}
                required
                aria-label="Write a comment"
              />
              <button className="btn small">Post comment</button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
