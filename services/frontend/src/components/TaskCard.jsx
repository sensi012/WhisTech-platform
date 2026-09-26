import { useState } from 'react';

const STATUS_LABELS = {
  todo:        'To do',
  in_progress: 'In progress',
  done:        'Done',
  cancelled:   'Cancelled',
};

const PRIORITY_COLOURS = {
  low:      'priority--low',
  medium:   'priority--medium',
  high:     'priority--high',
  critical: 'priority--critical',
};

const NEXT_STATUSES = {
  todo:        ['in_progress', 'cancelled'],
  in_progress: ['done', 'todo', 'cancelled'],
  done:        ['todo'],
  cancelled:   ['todo'],
};

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const [busy,    setBusy]    = useState(false);
  const [confirm, setConfirm] = useState(false);

  const moveStatus = async (status) => {
    setBusy(true);
    try     { await onStatusChange(task.id, status); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setBusy(true);
    await onDelete(task.id);
  };

  const fmt = (iso) => iso
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(iso))
    : null;

  return (
    <article className={`task-card ${busy ? 'task-card--busy' : ''}`}>
      <header className="task-card__header">
        <span className={`priority-badge ${PRIORITY_COLOURS[task.priority]}`}>
          {task.priority}
        </span>
        <button
          className="task-card__delete"
          onClick={handleDelete}
          aria-label={confirm ? 'Confirm delete' : 'Delete task'}
        >
          {confirm ? 'Confirm?' : 'Delete'}
        </button>
      </header>

      <h3 className="task-card__title">{task.title}</h3>

      {task.description && (
        <p className="task-card__desc">{task.description}</p>
      )}

      {task.due_date && (
        <p className="task-card__due">Due {fmt(task.due_date)}</p>
      )}

      <footer className="task-card__actions">
        {NEXT_STATUSES[task.status]?.map(s => (
          <button
            key={s}
            className="task-card__move"
            onClick={() => moveStatus(s)}
            disabled={busy}
          >
            &rarr; {STATUS_LABELS[s]}
          </button>
        ))}
      </footer>
    </article>
  );
}
