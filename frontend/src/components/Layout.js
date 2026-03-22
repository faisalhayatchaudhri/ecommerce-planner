import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, TrendingUp, DollarSign,
  Users, BarChart3, FileText, Globe, LogOut,
  Menu, X, ChevronRight, Sparkles, Calculator, Zap
} from 'lucide-react';

const MAIN_NAV = [
  { path: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/products',   label: 'Products',      icon: Package },
  { path: '/forecast',   label: 'Forecast',      icon: TrendingUp },
  { path: '/cashflow',   label: 'Cash Flow',     icon: DollarSign },
  { path: '/partners',   label: 'Partners',      icon: Users },
  { path: '/analytics',  label: 'Analytics',     icon: BarChart3 },
  { path: '/reports',    label: 'Reports',       icon: FileText },
  { path: '/currency',   label: 'Currency & Tax',icon: Globe },
];

const CALC_NAV = [
  { path: '/beginner-wizard',           label: 'Start Here',    icon: Sparkles, isNew: true },
  { path: '/calculators/profit-per-order', label: 'Profit/Order', icon: Calculator },
  { path: '/calculators/startup-budget', label: 'Startup Budget',  icon: DollarSign },
  { path: '/calculators/ads',           label: 'Ads Math',      icon: Zap },
  { path: '/calculators/cod',           label: 'COD & Returns', icon: TrendingUp },
  { path: '/calculators/pricing',       label: 'Pricing Tool',  icon: BarChart3 },
  { path: '/calculators/goals',         label: 'Goal Planner',  icon: Package },
];

const ALL_NAV = [...MAIN_NAV, ...CALC_NAV];

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
    return ['Home', ...parts.map(part => part.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()))];
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="app-overlay" />
      )}

      <aside className={`app-sidebar ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : ''}`}>
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
          <div className="sidebar-section-label">Main</div>
          {MAIN_NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path} to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Beginner Tools</div>
          {CALC_NAV.map(({ path, label, icon: Icon, isNew }) => (
            <NavLink
              key={path} to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
              {isNew && <span className="sidebar-badge">NEW</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link sidebar-logout">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-btn" aria-label="Toggle menu">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ flex: 1 }}>
            <div className="breadcrumb-row" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb}-${index}`}>
                  {index > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
                  <span className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <h1 className="header-title">{currentLabel}</h1>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
