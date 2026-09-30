export const STATUS_LABELS = { todo: 'To-Do', 'in-progress': 'In progress', done: 'Done' };
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

// Due dates are stored as UTC midnight, so format them in UTC to avoid off-by-one days
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });

export const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'done') return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return task.dueDate.slice(0, 10) < today;
};
