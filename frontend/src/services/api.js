import axios from 'axios';

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const nodeEnv = typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {};

export const API_BASE_URL =
  viteEnv.VITE_API_URL || viteEnv.REACT_APP_API_URL || nodeEnv.REACT_APP_API_URL || '/api';

// ── Safe localStorage wrapper ────────────────────────────────
export const storage = {
  get(key)         { try { return localStorage.getItem(key); }        catch { return null; } },
  set(key, value)  { try { localStorage.setItem(key, value); }        catch {} },
  remove(key)      { try { localStorage.removeItem(key); }            catch {} },
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,           // 15 s — avoids infinite pending requests on slow networks
});

// ── Attach JWT token on every request ───────────────────────
api.interceptors.request.use((config) => {
  const token = storage.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Public paths that should NOT trigger an auth redirect ───
const PUBLIC_PATHS = ['/login', '/register'];
const isPublicPage = () => PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));

// ── Handle 401 globally — without window.location.href ──────
// We dispatch a custom DOM event; AuthContext subscribes to it
// and calls logout() + navigate('/login') via React Router.
// This avoids full-page reloads, redirect loops, and state loss.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isPublicPage()) {
      // Clean up storage so the state is consistent
      storage.remove('token');
      storage.remove('user');
      // Signal the React layer — AuthContext will handle navigation
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;
