'use client';
import { useRouter } from 'next/navigation';
import StatusBadge from '../ui/StatusBadge';

const OP_ICONS = {
  uppercase:  'Aa',
  lowercase:  'aa',
  reverse:    '⇄',
  word_count: '#',
};

export default function TaskCard({ task, onRun, onDelete, running }) {
  const router = useRouter();
  const date = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="card"
      style={{ padding: '1.1rem 1.25rem', cursor: 'pointer' }}
      onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>

        {/* Left side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span style={{
              background: 'var(--bg-3)',
              color: 'var(--accent)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.1rem 0.45rem',
              borderRadius: 5,
            }}>
              {OP_ICONS[task.operation] || task.operation}
            </span>
            <StatusBadge status={task.status} />
          </div>

          <h3 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </h3>

          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.inputText}
          </p>
        </div>

        {/* Right side — actions */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {(task.status === 'pending' || task.status === 'failed') && (
            <button
              className="btn-primary"
              disabled={running}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => onRun(task._id)}
            >
              {running
                ? <span className="spinner" style={{ width: 12, height: 12 }} />
                : 'Run'
              }
            </button>
          )}
          <button
            className="btn-ghost"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
            onClick={() => onDelete(task._id)}
          >
            ×
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '0.7rem', paddingTop: '0.7rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {task.operation} · {date}
        </span>
        {task.status === 'success' && task.result !== null && (
          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--success)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ✓ {typeof task.result === 'object' ? JSON.stringify(task.result) : task.result}
          </span>
        )}
      </div>
    </div>
  );
}