import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0); // 0-4

  useEffect(() => { document.title = 'Create Account — EcomPlanner'; }, []);

  // Real-time password strength
  useEffect(() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8)               s++;
    if (/[A-Z]/.test(p))             s++;
    if (/[0-9]/.test(p))             s++;
    if (/[^A-Za-z0-9]/.test(p))      s++;
    setStrength(s);
  }, [form.password]);

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())       e.full_name = 'Name is required';
    if (!form.email)                  e.email     = 'Email is required';
    if (form.password.length < 8)     e.password  = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
      toast.success('Account created! Set up your business now.');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        toast.error('Cannot reach the server. Make sure the backend is running.');
      } else {
        const msg =
          err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.error ||
          'Registration failed. Please try again.';
        toast.error(msg);
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthColor  = ['#334155', '#ef4444', '#f59e0b', '#10b981', '#6366f1'][strength];
  const strengthLabel  = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', marginBottom: '0.75rem',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            EcomPlanner
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
            Create your free account — takes 30 seconds
          </p>
        </div>

        <div className="card">
          {errors.general && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
              fontSize: '0.875rem', color: '#f87171',
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className="input"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={handleChange('full_name')}
                style={{ borderColor: errors.full_name ? '#ef4444' : undefined }}
              />
              {errors.full_name && (
                <span style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.25rem', display: 'block' }}>
                  {errors.full_name}
                </span>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange('email')}
                style={{ borderColor: errors.email ? '#ef4444' : undefined }}
              />
              {errors.email && (
                <span style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.25rem', display: 'block' }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="reg-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                  style={{ borderColor: errors.password ? '#ef4444' : undefined, paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Strength bar — only shows once user starts typing */}
              {form.password.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor : '#1e293b', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  {strengthLabel && (
                    <span style={{ fontSize: '0.72rem', color: strengthColor, marginTop: '0.2rem', display: 'block' }}>
                      {strengthLabel} password
                    </span>
                  )}
                </div>
              )}

              {errors.password && (
                <span style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.25rem', display: 'block' }}>
                  {errors.password}
                </span>
              )}
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
              id="register-submit"
            >
              {loading ? 'Creating account…' : 'Create Free Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 Your data is encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
