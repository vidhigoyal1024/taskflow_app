import { PRIORITY_LABELS, formatDate, initials, isOverdue } from '../utils.js';

// Buttons that move a task between columns, by current status
const MOVES = {
  todo: [{ label: 'Start', to: 'in-progress' }],
  'in-progress': [
    { label: 'Back to to-do', to: 'todo' },
    { label: 'Mark done', to: 'done' },
  ],
  done: [{ label: 'Reopen', to: 'in-progress' }],
};

export default function TaskCard({ task, canEdit, onOpen, onMove }) {
  const overdue = isOverdue(task);
  return (
    <article className={`task priority-${task.priority}`}>
      <button className="task-title" onClick={() => onOpen(task)}>{task.title}</button>

      <div className="task-meta">
        <span className={`pill pri-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {task.dueDate && (
          <span className={`due ${overdue ? 'overdue' : ''}`}>
            {overdue ? 'Overdue: ' : 'Due '}
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.assignee && (
          <span className="avatar" title={task.assignee.name} aria-label={`Assigned to ${task.assignee.name}`}>
            {initials(task.assignee.name)}
          </span>
        )}
      </div>

      {canEdit && (
        <div className="task-actions">
          {MOVES[task.status].map((m) => (
            <button key={m.to} className="link-btn" onClick={() => onMove(task, m.to)}>{m.label}</button>
          ))}
        </div>
      )}
    </article>
  );
}
