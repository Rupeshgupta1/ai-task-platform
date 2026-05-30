'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { tasksApi } from '../../lib/api';
import TaskCard from '../../components/tasks/TaskCard';
import CreateTaskForm from '../../components/tasks/CreateTaskForm';

const POLL_MS = 30000;
const FILTERS = ['all', 'pending', 'running', 'success', 'failed'];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [runningIds, setRunningIds] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const pollRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const fetchTasks = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await tasksApi.list(params);
      setTasks(data.tasks);
    } catch (err) {
      if (err.status === 401) logout();
    } finally {
      setFetching(false);
    }
  }, [filter, logout]);

  useEffect(() => {
    fetchTasks();
    pollRef.current = setInterval(fetchTasks, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchTasks]);

  const handleRun = async (taskId) => {
    setRunningIds(s => new Set(s).add(taskId));
    try {
      await tasksApi.run(taskId);
      await fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setRunningIds(s => { const n = new Set(s); n.delete(taskId); return n; });
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      setTasks(ts => ts.filter(t => t._id !== taskId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreated = (task) => {
    setShowForm(false);
    setTasks(ts => [task, ...ts]);
  };

  const stats = tasks.reduce((acc, t) => ({
    ...acc, [t.status]: (acc[t.status] || 0) + 1
  }), {});

  if (loading || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="grid-bg" style={{ minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'rgba(6,9,16,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.25rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>TaskForge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.username}</span>
            <button className="btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.82rem' }} onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }} className="animate-page">
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Tasks</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {tasks.length} total · {stats.running || 0} running
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            + New Task
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'success', label: 'Completed', color: 'var(--success)' },
            { key: 'running', label: 'Running',   color: 'var(--accent)'   },
            { key: 'pending', label: 'Pending',   color: 'var(--pending)'  },
            { key: 'failed',  label: 'Failed',    color: 'var(--danger)'   },
          ].map(s => (
            <div key={s.key} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{stats[s.key] || 0}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.3rem 0.75rem', borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: filter === f ? 600 : 400,
              color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: filter === f ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Task list */}
        {fetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No tasks yet. Create one to get started.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              Create your first task
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {tasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onRun={handleRun}
                onDelete={handleDelete}
                running={runningIds.has(task._id)}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && <CreateTaskForm onCreated={handleCreated} onClose={() => setShowForm(false)} />}
    </div>
  );
}