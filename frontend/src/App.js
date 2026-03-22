import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

function lazyWithRetry(importer) {
  return lazy(() =>
    importer().catch((error) => {
      // Recover once from stale/chunk cache mismatch after deploy.
      const key = 'lazy-retried';
      try {
        const alreadyRetried = sessionStorage.getItem(key) === '1';
        if (!alreadyRetried) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
      throw error;
    })
  );
}

const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Products = lazyWithRetry(() => import('./pages/Products'));
const Forecast = lazyWithRetry(() => import('./pages/Forecast'));
const CashFlow = lazyWithRetry(() => import('./pages/CashFlow'));
const Partners = lazyWithRetry(() => import('./pages/Partners'));
const Analytics = lazyWithRetry(() => import('./pages/Analytics'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const Currency = lazyWithRetry(() => import('./pages/Currency'));
const Layout = lazyWithRetry(() => import('./components/Layout'));

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keeps production from failing silently on white screen.
    console.error('App render error:', error);
    this.setState({ message: error?.message || 'Unknown runtime error' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem', background: '#f8fafc' }}>
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#64748b' }}>
              The app hit an unexpected error. Refresh the page to retry.
            </p>
            {this.state.message && (
              <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem', color: '#334155' }}>
                {this.state.message}
              </pre>
            )}
            <button
              className="btn-primary"
              style={{ marginTop: '0.75rem' }}
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-container"><div className="spinner"></div><div className="spinner-text">Authenticating...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<div className="spinner-container"><div className="spinner"></div><div className="spinner-text">Loading module...</div></div>}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="forecast" element={<Forecast />} />
          <Route path="cashflow" element={<CashFlow />} />
          <Route path="partners" element={<Partners />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="currency" element={<Currency />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
