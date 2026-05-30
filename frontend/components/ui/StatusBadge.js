export default function StatusBadge({ status }) {
    const dotColors = {
      pending: 'var(--pending)',
      running: 'var(--accent)',
      success: 'var(--success)',
      failed:  'var(--danger)',
    };
  
    return (
      <span className={`badge badge-${status}`}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColors[status] || 'currentColor',
          display: 'inline-block',
          animation: status === 'running' ? 'pulse 1.2s ease infinite' : 'none',
        }} />
        {status}
      </span>
    );
  }