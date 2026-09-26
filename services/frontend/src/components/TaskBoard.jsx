import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/client';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo',        label: 'To do'       },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done',        label: 'Done'        },
];

export default function TaskBoard() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPri,   setNewPri]   = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await tasksApi.list();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      await tasksApi.create({ title: newTitle.trim(), priority: newPri });
      setNewTitle('');
      setNewPri('medium');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    await tasksApi.update(id, { status });
    await load();
  };

  const deleteTask = async (id) => {
    await tasksApi.remove(id);
    await load();
  };

  if (loading) return <div className="state-msg">Loading tasks...</div>;
  if (error)   return (
    <div className="state-msg state-msg--error">
      {error}
      <button onClick={load} className="retry-btn">Retry</button>
    </div>
  );

  return (
    <div className="board">
      <form onSubmit={createTask} className="new-task-form">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title..."
          maxLength={255}
          disabled={submitting}
          required
        />
        <select
          value={newPri}
          onChange={e => setNewPri(e.target.value)}
          disabled={submitting}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button type="submit" disabled={submitting || !newTitle.trim()}>
          {submitting ? 'Adding...' : 'Add task'}
        </button>
      </form>

      <div className="board__stats">
        <span>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
        <span>{tasks.filter(t => t.status === 'done').length} done</span>
        <span>{tasks.filter(t => t.priority === 'critical').length} critical</span>
      </div>

      <div className="columns">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="column">
              <div className="column__header">
                <h2>{col.label}</h2>
                <span className="column__count">{colTasks.length}</span>
              </div>
              {colTasks.length === 0
                ? <div className="column__empty">No tasks</div>
                : colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={updateStatus}
                      onDelete={deleteTask}
                    />
                  ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
