import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
      toast.success('Account created! Set up your business profile.');
      navigate('/onboarding');
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        toast.error('Backend API is not reachable. Start backend on http://localhost:5000');
      } else {
        const validationMessage = err.response?.data?.errors?.[0]?.msg;
        toast.error(validationMessage || err.response?.data?.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 1rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366f1' }}>E-commerce Planner</div>
            <p style={{ color: '#64748b', marginTop: 6 }}>Create your free account</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Full Name</label>
              <input className="input" type="text" required placeholder="Jane Doe"
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" type="email" required placeholder="you@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Password <span style={{ color: '#9ca3af', fontWeight: 400 }}>(min 8 chars)</span></label>
              <input className="input" type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
