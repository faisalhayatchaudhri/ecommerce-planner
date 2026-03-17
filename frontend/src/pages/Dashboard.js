import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { TrendingUp, DollarSign, Package, BarChart3, ArrowRight } from 'lucide-react';

function KPICard({ label, value, sub, color = '#0056d2', icon: Icon }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
          <p style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{value}</p>
          {sub && <p style={{ fontSize: '0.78rem', color: '#6c757d', marginTop: 3 }}>{sub}</p>}
        </div>
        <div style={{ background: `${color}22`, borderRadius: 10, padding: 10 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/kpis'),
      api.get('/profile')
    ]).then(([kpiRes, profRes]) => {
      setKpis(kpiRes.data);
      setProfile(profRes.data.profile);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return <div style={{ padding: '2rem', color: '#6c757d' }}>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {profile ? `${profile.business_name}` : 'Dashboard'}
          </h1>
          <p className="page-subtitle">
            {profile ? `${profile.business_type} | ${profile.country || 'Country not set'} | ${profile.currency}` : 'Welcome to your business planner'}
          </p>
        </div>
        {!profile && (
          <Link to="/onboarding" className="btn-primary">
            Set Up Business Profile <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {kpis && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <KPICard label="Total Revenue" value={fmt(kpis.total_revenue)} sub="From sales forecasts" icon={DollarSign} color="#0056d2" />
          <KPICard label="Net Profit" value={fmt(kpis.net_profit)} sub={`${kpis.net_margin_pct}% net margin`} icon={TrendingUp} color="#28a745" />
          <KPICard label="Avg Gross Margin" value={`${kpis.avg_gross_margin_pct}%`} sub="Across active products" icon={BarChart3} color="#fd7e14" />
          <KPICard label="Active Products" value={kpis.active_products} sub={`${kpis.total_units_sold} units sold`} icon={Package} color="#17a2b8" />
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { to: '/products', label: 'Add a product', desc: 'Define pricing & cost structure' },
              { to: '/forecast', label: 'Create sales forecast', desc: 'Project monthly revenue' },
              { to: '/cashflow', label: 'Log cash flow', desc: 'Track inflows & outflows' },
              { to: '/partners', label: 'Add a partner', desc: 'Manage equity & profit sharing' },
              { to: '/reports', label: 'Download report', desc: 'Excel, PDF, or CSV export' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                title={item.desc}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem', borderRadius: 8, border: '1px solid #d7dde4', textDecoration: 'none', color: 'inherit', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>{item.desc}</div>
                </div>
                <ArrowRight size={15} color="#0056d2" />
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Getting Started</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { step: '1', label: 'Set up your business profile', done: !!profile },
              { step: '2', label: 'Add your products with pricing & COGS', done: kpis?.active_products > 0 },
              { step: '3', label: 'Create a sales forecast', done: kpis?.total_units_sold > 0 },
              { step: '4', label: 'Log your cash flow entries', done: kpis?.total_inflow > 0 },
              { step: '5', label: 'Invite partners / investors', done: false },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.done ? '#28a745' : '#e2e8f0',
                    color: item.done ? 'white' : '#6c757d',
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {item.done ? 'Done' : item.step}
                </div>
                <span style={{ color: item.done ? '#6c757d' : '#1e293b', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
