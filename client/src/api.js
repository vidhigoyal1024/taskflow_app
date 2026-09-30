export const TOKEN_KEY = 'taskflow_token';
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Small fetch wrapper: adds the JWT, serialises JSON, builds the query string
 * and throws an Error carrying the server's message when the request fails.
 */
export async function api(path, { method = 'GET', body, params } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const query = params
    ? '?' +
      new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    : '';

  let res;
  try {
    res = await fetch(`${BASE}/api${path}${query}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('taskflow:unauthorized'));
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}
