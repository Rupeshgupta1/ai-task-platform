'use client';
import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../lib/auth';
import { tasksApi } from '../../../../lib/api';
import StatusBadge from '../../../../components/ui/StatusBadge';

const POLL_MS = 2000;

export default function TaskDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [running, setRunning] = useState(false);
  const pollRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const fetchTask = useCallback(async () => {
    try {
      const data = await tasksApi.get(params.id);
      setTask(data.task);
    } catch {
      router.replace('/dashboard');
    } finally {
      setFetching(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    if (!task) return;
    if (task.status === 'running' || task.status === 'pending') {
      pollRef.current = setInterval(fetchTask, POLL_MS);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [task?.status, fetchTask]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.logs?.length]);

  const handleRun = async () => {
    setRunning(true);
    try {
      await tasksApi.run(task._id);
      await fetchTask();
    } catch (err) {
      alert(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading || fetching || !task) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const duration = task.startedAt && task.completedAt
    ? `${((new Date(task.completedAt) - new Date(task.startedAt)) / 1000).toFixed(2)}s`
    : null;

  return (
    <div className="grid-bg" style={{ minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'rgba(6,9,16,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.25rem', height: 56, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
            {task.title}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <StatusBadge status={task.status} />
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-page">

        {/* Meta card */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.2rem' }}>{task.title}</h1>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Operation', value: task.operation },
                  { label: 'Created',   value: new Date(task.createdAt).toLocaleString() },
                  ...(duration ? [{ label: 'Duration', value: duration }] : []),
                  { label: 'ID', value: task._id.slice(-8) },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(task.status === 'pending' || task.status === 'failed') && (
              <button className="btn-primary" onClick={handleRun} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {running
                  ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Running…</>
                  : '▶ Run Task'
                }
              </button>
            )}
          </div>
        </div>

        {/* Input / Result */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={sectionLabel}>Input</div>
            <pre style={preStyle}>{task.inputText}</pre>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem', borderColor: task.status === 'success' ? 'rgba(34,197,94,0.25)' : 'var(--border)' }}>
            <div style={sectionLabel}>Result</div>
            {task.result !== null ? (
              <pre style={{ ...preStyle, color: 'var(--success)' }}>
                {typeof task.result === 'object' ? JSON.stringify(task.result, null, 2) : task.result}
              </pre>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                {task.status === 'running'
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                      <span className="spinner" /> Processing…
                    </span>
                  : 'No result yet. Run the task to process.'
                }
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={sectionLabel}>Execution Logs</div>
          <div style={{ background: 'var(--bg-1)', borderRadius: 8, padding: '0.85rem 1rem', maxHeight: 220, overflowY: 'auto', marginTop: '0.6rem', border: '1px solid var(--border)' }}>
            {task.logs.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>No logs yet.</span>
            ) : (
              task.logs.map((log, i) => (
                <div key={i} className={`log-line log-${log.level}`} style={{ marginBottom: '0.15rem' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.75rem' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.message}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </main>
    </div>
  );
}

const sectionLabel = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
};

const preStyle = {
  margin: 0,
  fontFamily: 'monospace',
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: 140,
  overflowY: 'auto',
};