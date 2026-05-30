'use client';
import { useState } from 'react';
import { tasksApi } from '../../lib/api';

const OPERATIONS = [
  { value: 'uppercase',  label: 'Uppercase',  desc: 'CONVERTS TO UPPERCASE' },
  { value: 'lowercase',  label: 'Lowercase',  desc: 'converts to lowercase' },
  { value: 'reverse',    label: 'Reverse',    desc: 'txeT sesreveR' },
  { value: 'word_count', label: 'Word Count', desc: 'Counts every word' },
];

export default function CreateTaskForm({ onCreated, onClose }) {
  const [form, setForm] = useState({ title: '', inputText: '', operation: 'uppercase' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await tasksApi.create(form);
      onCreated(data.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(6,9,16,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-page"
        style={{ width: '100%', maxWidth: 520, padding: '2rem' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>New Task</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '1.1rem' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Task Title</label>
            <input
              className="input-base"
              style={{ marginTop: '0.4rem' }}
              placeholder="e.g. Process customer feedback"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Operation selector */}
          <div>
            <label style={labelStyle}>Operation</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
              {OPERATIONS.map(op => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, operation: op.value }))}
                  style={{
                    background: form.operation === op.value ? 'var(--accent-dim)' : 'var(--bg-1)',
                    border: `1px solid ${form.operation === op.value ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '0.6rem 0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: form.operation === op.value ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {op.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                    {op.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input text */}
          <div>
            <label style={labelStyle}>Input Text</label>
            <textarea
              className="input-base"
              style={{ marginTop: '0.4rem', resize: 'vertical', minHeight: 100, fontFamily: 'monospace', fontSize: '0.82rem' }}
              placeholder="Enter text to process…"
              value={form.inputText}
              onChange={e => setForm(f => ({ ...f, inputText: e.target.value }))}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.65rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};