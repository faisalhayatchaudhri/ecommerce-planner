import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';

// ── Lazy chunk loader with per-module retry ─────────────────
// Uses a per-module key so a single chunk failure only retries
// that chunk — not the entire app. Key is cleared on success so
// future navigations always work.
function lazyWithRetry(importer) {
  const moduleKey = `lazy-retried-${importer.toString().replace(/\s/g, '').slice(0, 60)}`;
  return lazy(() =>
    importer()
      .then((mod) => {
        try { sessionStorage.removeItem(moduleKey); } catch {}
        return mod;
      })
      .catch((error) => {
        try {
          const alreadyRetried = sessionStorage.getItem(moduleKey) === '1';
          if (!alreadyRetried) {
            sessionStorage.setItem(moduleKey, '1');
            window.location.reload();
          }
        } catch {
          window.location.reload();
        }
        throw error;
      })
  );
}

const Login        = lazyWithRetry(() => import('./pages/Login'));
const Register     = lazyWithRetry(() => import('./pages/Register'));
const Onboarding   = lazyWithRetry(() => import('./pages/Onboarding'));
const Dashboard    = lazyWithRetry(() => import('./pages/Dashboard'));
const Products     = lazyWithRetry(() => import('./pages/Products'));
const Forecast     = lazyWithRetry(() => import('./pages/Forecast'));
const CashFlow     = lazyWithRetry(() => import('./pages/CashFlow'));
const Partners     = lazyWithRetry(() => import('./pages/Partners'));
const Analytics    = lazyWithRetry(() => import('./pages/Analytics'));
const Reports      = lazyWithRetry(() => import('./pages/Reports'));
const Currency     = lazyWithRetry(() => import('./pages/Currency'));
const Layout       = lazyWithRetry(() => import('./components/Layout'));

const BeginnerWizard  = lazyWithRetry(() => import('./pages/calculators/BeginnerWizard'));
const ProfitPerOrder  = lazyWithRetry(() => import('./pages/calculators/ProfitPerOrder'));
const StartupBudget   = lazyWithRetry(() => import('./pages/calculators/StartupBudget'));
const AdsCalculator   = lazyWithRetry(() => import('./pages/calculators/AdsCalculator'));
const CodCalculator   = lazyWithRetry(() => import('./pages/calculators/CodCalculator'));
const PricingTool     = lazyWithRetry(() => import('./pages/calculators/PricingTool'));
const GoalCalculator  = lazyWithRetry(() => import('./pages/calculators/GoalCalculator'));

// ── Shared fallback spinner ──────────────────────────────────
function PageSpinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <div className="spinner-text">{text}</div>
    </div>
  );
}

// ── Global Error Boundary ────────────────────────────────────
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, message: '' }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) {
    console.error('App render error:', error);
    this.setState({ message: error?.message || 'Unknown runtime error' });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem', background: '#0b1120' }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: '2rem', maxWidth: 520, width: '100%', border: '1px solid #334155' }}>
            <h2 style={{ marginBottom: '0.5rem', color: '#f1f5f9' }}>Something went wrong</h2>
            <p style={{ color: '#94a3b8' }}>The app hit an unexpected error. Refresh to retry.</p>
            {this.state.message && (
              <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem', color: '#64748b' }}>
                {this.state.message}
              </pre>
            )}
            <button className="btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => window.location.reload()} type="button">
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Protected route: requires auth ──────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── NavigateBridge: gives AuthContext access to useNavigate ─
// This component lives inside BrowserRouter, allowing the
// AuthContext 401 handler to navigate without a full reload.
function NavigateBridge() {
  const navigate = useNavigate();
  const { setNavigate } = useAuth();
  useEffect(() => { setNavigate(navigate); }, [navigate, setNavigate]);
  return null;
}

// ── App routes ───────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageSpinner />}>
      <NavigateBridge />
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/login"    element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* ── Onboarding (authenticated, but pre-completion) ── */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* ── Main app (authenticated) ── */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"                    element={<Dashboard />} />
          <Route path="products"                     element={<Products />} />
          <Route path="forecast"                     element={<Forecast />} />
          <Route path="cashflow"                     element={<CashFlow />} />
          <Route path="partners"                     element={<Partners />} />
          <Route path="analytics"                    element={<Analytics />} />
          <Route path="reports"                      element={<Reports />} />
          <Route path="currency"                     element={<Currency />} />
          <Route path="beginner-wizard"              element={<BeginnerWizard />} />
          <Route path="calculators/profit-per-order" element={<ProfitPerOrder />} />
          <Route path="calculators/startup-budget"   element={<StartupBudget />} />
          <Route path="calculators/ads"              element={<AdsCalculator />} />
          <Route path="calculators/cod"              element={<CodCalculator />} />
          <Route path="calculators/pricing"          element={<PricingTool />} />
          <Route path="calculators/goals"            element={<GoalCalculator />} />
        </Route>

        {/* ── Catch-all: authenticated → dashboard, else → login ── */}
        <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

// ── Root app ─────────────────────────────────────────────────
export default function App() {
  return (
    <AppErrorBoundary>
      {/* AuthProvider wraps BrowserRouter so it can own the 401 event listener.
          CurrencyProvider is inside — it reads useAuth(), which is only valid
          inside AuthProvider. */}
      <AuthProvider>
        <BrowserRouter>
          <CurrencyProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px' },
                success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
              }}
            />
          </CurrencyProvider>
        </BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
