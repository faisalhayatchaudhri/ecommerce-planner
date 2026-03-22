import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, TrendingUp, DollarSign,
  Users, BarChart3, FileText, Globe, LogOut,
  Menu, X, ChevronRight, Sparkles, Zap, Target,
  ShoppingCart, Tag, Star, Rocket
} from 'lucide-react';

/*
  NAV ORDER PHILOSOPHY — Beginner → Advanced:
  1. Start Here (Wizard)          ← "What is my idea worth?"
  2. Profit / Order               ← "If I sell 1 unit, what do I earn?"
  3. Pricing Tool                 ← "What price should I charge?"
  4. Startup Budget               ← "How much do I need to start?"
  5. Ads Calculator               ← "Will my ads make money?"
  6. COD & Returns                ← "How do failed deliveries hurt me?"
  7. Goal Planner                 ← "How many sales to hit my target?"
  ─── advanced divider ───
  8. Dashboard                    ← Full business overview
  9. Products                     ← Detailed product catalog
  10. Sales Forecast              ← Project revenue
  11. Cash Flow                   ← Real cash in/out
  12. Partners                    ← Equity & investors
  13. Analytics                   ← Charts & KPIs
  14. Reports                     ← Export
  15. Currency & Tax              ← Settings
*/

const BEGINNER_NAV = [
  { path: '/beginner-wizard',              label: 'Start Here',      icon: Sparkles,     badge: 'NEW', desc: 'Set up your business' },
  { path: '/calculators/profit-per-order', label: 'Profit / Order',  icon: ShoppingCart, desc: '1 sale = how much profit?' },
  { path: '/calculators/pricing',          label: 'Pricing Tool',    icon: Tag,          desc: 'What price should I charge?' },
  { path: '/calculators/startup-budget',   label: 'Startup Budget',  icon: Rocket,       desc: 'Capital to get started' },
  { path: '/calculators/ads',              label: 'Ads Calculator',  icon: Zap,          desc: 'Will ads make profit?' },
  { path: '/calculators/cod',              label: 'COD & Returns',   icon: Package,      desc: 'Impact of failed deliveries' },
  { path: '/calculators/goals',            label: 'Goal Planner',    icon: Target,       desc: 'Orders needed to hit income goal' },
];

const ADVANCED_NAV = [
  { path: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/products',   label: 'Products',        icon: Star },
  { path: '/forecast',   label: 'Sales Forecast',  icon: TrendingUp },
  { path: '/cashflow',   label: 'Cash Flow',        icon: DollarSign },
  { path: '/partners',   label: 'Partners',         icon: Users },
  { path: '/analytics',  label: 'Analytics',        icon: BarChart3 },
  { path: '/reports',    label: 'Reports',          icon: FileText },
  { path: '/currency',   label: 'Currency & Tax',   icon: Globe },
];

const ALL_NAV = [...BEGINNER_NAV, ...ADVANCED_NAV];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [location.pathname, isMobile]);

  const currentLabel = useMemo(() => {
    const match = ALL_NAV.find(item => location.pathname.startsWith(item.path));
    return match?.label || 'Dashboard';
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return ['Dashboard'];
    return parts.map(part => part.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()));
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="app-overlay" />
      )}

      <aside className={`app-sidebar ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>
            <span>EcomPlanner</span>
          </div>
          <div className="sidebar-user">
            <span className="sidebar-user-dot" />
            {user?.full_name || user?.email}
          </div>
        </div>

        <nav className="sidebar-nav">

          {/* ── BEGINNER TOOLS FIRST ── */}
          <div className="sidebar-section-label" style={{ color: '#818cf8' }}>
            🚀 Get Started
          </div>

          {BEGINNER_NAV.map(({ path, label, icon: Icon, badge }) => (
            <NavLink
              key={path} to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && <span className="sidebar-badge">{badge}</span>}
            </NavLink>
          ))}

          {/* ── ADVANCED TOOLS ── */}
          <div className="sidebar-section-label" style={{ marginTop: '1rem' }}>
            📊 Advanced
          </div>

          {ADVANCED_NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path} to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}

        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link sidebar-logout" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        <header className="app-header">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-btn" aria-label="Toggle menu">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ flex: 1 }}>
            <div className="breadcrumb-row" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb}-${index}`}>
                  {index > 0 && <ChevronRight size={11} className="breadcrumb-sep" />}
                  <span className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <p className="header-title">{currentLabel}</p>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
