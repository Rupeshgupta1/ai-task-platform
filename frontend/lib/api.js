const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Token helpers ─────────────────────────────────────────────
export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export const setToken = (t) => localStorage.setItem('token', t);
export const removeToken = () => localStorage.removeItem('token');

// ── Core fetch wrapper ────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({ error: 'Invalid server response' }));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/api/auth/me'),
};

// ── Tasks ─────────────────────────────────────────────────────
export const tasksApi = {
  list:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/tasks${q ? '?' + q : ''}`);
  },
  create: (body) => request('/api/tasks',           { method: 'POST',   body: JSON.stringify(body) }),
  get:    (id)   => request(`/api/tasks/${id}`),
  run:    (id)   => request(`/api/tasks/${id}/run`, { method: 'POST' }),
  delete: (id)   => request(`/api/tasks/${id}`,     { method: 'DELETE' }),
};