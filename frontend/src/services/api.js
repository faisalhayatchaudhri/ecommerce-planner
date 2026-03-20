import axios from 'axios';

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const nodeEnv = typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {};

export const API_BASE_URL = viteEnv.VITE_API_URL || viteEnv.REACT_APP_API_URL || nodeEnv.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
