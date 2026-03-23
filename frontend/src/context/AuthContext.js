import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { storage } from '../services/api';

const AuthContext = createContext(null);

// ── Try to parse the cached user from localStorage ──────────
function loadCachedUser() {
  try { return JSON.parse(storage.get('user')); } catch { return null; }
}

export function AuthProvider({ children }) {
  // Initialise user immediately from cache — eliminates first-render flicker.
  // The /auth/me check below will correct this if the token is stale.
  const [user, setUser] = useState(loadCachedUser);
  // Start as true only if we have a token that needs server validation.
  // If there's no token, we're immediately "done loading" — no spinner.
  const [loading, setLoading] = useState(() => !!storage.get('token'));
  const navigateRef = useRef(null);

  // ── Expose a navigate ref that the event handler can use ──
  // (We cannot call useNavigate outside a Router, so this is
  //  resolved by App.js passing it via context once mounted.)
  const setNavigate = useCallback((fn) => { navigateRef.current = fn; }, []);

  // ── Validate the stored token once on mount ────────────────
  useEffect(() => {
    const token = storage.get('token');
    if (!token) {
      // No token at all — nothing to validate
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.get('/auth/me')
      .then((res) => {
        if (cancelled) return;
        const freshUser = res.data.user;
        storage.set('user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        if (cancelled) return;
        // Token is invalid / expired — clean up
        storage.remove('token');
        storage.remove('user');
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []); // ← runs only once; no repeated fetches on re-renders

  // ── Listen for 401 events from the API interceptor ─────────
  useEffect(() => {
    const handle = () => {
      setUser(null);
      storage.remove('token');
      storage.remove('user');
      // Navigate via React Router (no full-page reload)
      if (navigateRef.current) {
        navigateRef.current('/login', { replace: true });
      }
    };
    window.addEventListener('auth:unauthorized', handle);
    return () => window.removeEventListener('auth:unauthorized', handle);
  }, []);

  // ── Auth actions ────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    storage.set('token', res.data.token);
    storage.set('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (email, password, full_name) => {
    const res = await api.post('/auth/register', { email, password, full_name });
    storage.set('token', res.data.token);
    storage.set('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = useCallback(() => {
    storage.remove('token');
    storage.remove('user');
    setUser(null);
  }, []);

  // ── Profile update helper (used after onboarding) ──────────
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      storage.set('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, setNavigate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
