import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCurrencyCtx } from '../context/CurrencyContext';
import {
  TrendingUp, DollarSign, Package, BarChart3,
  ArrowRight, Sparkles, Zap, Target, ShoppingCart, Star
} from 'lucide-react';

function KPICard({ label, value, sub, icon: Icon, accentColor = '#6366f1', trend }) {
  return (
    <div className="kpi-card" style={{ padding: '1.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <p className="stat-label">{label}</p>
        <div style={{ background: `${accentColor}22`, borderRadius: 10, padding: '0.45rem', border: `1px solid ${accentColor}33` }}>
          <Icon size={18} color={accentColor} />
        </div>
      </div>
      <p className="stat-value" style={{ color: '#f1f5f9' }}>{value}</p>
      {sub && <p className="stat-sub">{sub} {trend && <span style={{ color: trend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%</span>}</p>}
    </div>
  );
}

function QuickLink({ to, label, desc, accent = false, icon: Icon }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '0.85rem',
      padding: '0.85rem 1rem', borderRadius: 12,
      border: accent ? '1px solid rgba(99,102,241,0.4)' : '1px solid #1e293b',
      textDecoration: 'none', color: 'inherit',
      transition: 'all 0.2s',
      background: accent ? 'rgba(99,102,241,0.08)' : 'transparent',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = accent ? 'rgba(99,102,241,0.08)' : 'transparent'; e.currentTarget.style.borderColor = accent ? 'rgba(99,102,241,0.4)' : '#1e293b'; }}
    >
      {Icon && (
        <div style={{ background: accent ? 'rgba(99,102,241,0.2)' : '#0f172a', borderRadius: 8, padding: '0.45rem', flexShrink: 0 }}>
          <Icon size={16} color={accent ? '#818cf8' : '#64748b'} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: accent ? 700 : 600, color: accent ? '#c7d2fe' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{desc}</div>
      </div>
      <ArrowRight size={14} color={accent ? '#818cf8' : '#334155'} style={{ flexShrink: 0 }} />
    </Link>
  );
}

export default function Dashboard() {
  const { fmt, fmtDec } = useCurrencyCtx();
  const [kpis, setKpis] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics/kpis'), api.get('/profile')])
      .then(([k, p]) => { setKpis(k.data); setProfile(p.data.profile); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /><div className="spinner-text">Loading dashboard...</div></div>;

  const healthScore = (() => {
    if (!kpis) return 0;
    let s = 0;
    if (kpis.net_profit > 0) s += 40;
    if (kpis.avg_gross_margin_pct > 20) s += 30;
    if (kpis.active_products > 0) s += 15;
    if (kpis.total_units_sold > 0) s += 15;
    return s;
  })();

  const healthLabel = healthScore >= 70 ? 'Strong' : healthScore >= 40 ? 'Average' : 'Needs Work';
  const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {profile?.business_name || 'My Dashboard'}
            {profile && <span className="badge badge-cyan" style={{ fontSize: '0.65rem', fontWeight: 700 }}>{profile.currency}</span>}
          </h1>
          <p className="page-subtitle">
            {profile
              ? `${profile.business_type.replace(/_/g, ' ')} · ${profile.country || 'Location not set'} · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              : 'Welcome to your e-commerce command center'}
          </p>
        </div>
        {!profile && (
          <Link to="/onboarding" className="btn-primary">
            <Sparkles size={14} /> Set Up Business
          </Link>
        )}
      </div>

      {/* Business Health Banner */}
      {kpis && (
        <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: '0.4rem' }}>Business Health Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: healthColor }}>{healthScore}</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/100</span>
                <span className="badge" style={{ background: `${healthColor}22`, color: healthColor, border: `1px solid ${healthColor}44` }}>{healthLabel}</span>
              </div>
            </div>
            <div style={{ width: 160 }}>
              <div className="progress-bar-outer">
                <div className="progress-bar-inner" style={{ width: `${healthScore}%`, background: `linear-gradient(90deg, ${healthColor}, ${healthColor}99)` }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profitable</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: kpis.net_profit >= 0 ? '#10b981' : '#ef4444', marginTop: '0.2rem' }}>{kpis.net_profit >= 0 ? '✓ Yes' : '✗ No'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: kpis.avg_gross_margin_pct > 20 ? '#10b981' : '#f59e0b', marginTop: '0.2rem' }}>{kpis.avg_gross_margin_pct}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginTop: '0.2rem' }}>{kpis.active_products}</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      {kpis && (
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          <KPICard label="Total Revenue" value={fmtDec(kpis.total_revenue)} sub="From sales forecasts" icon={DollarSign} accentColor="#6366f1" />
          <KPICard label="Net Profit" value={fmtDec(kpis.net_profit)} sub={`${kpis.net_margin_pct}% net margin`} icon={TrendingUp} accentColor={kpis.net_profit >= 0 ? '#10b981' : '#ef4444'} />
          <KPICard label="Avg Gross Margin" value={`${kpis.avg_gross_margin_pct}%`} sub="Across active products" icon={BarChart3} accentColor="#f59e0b" />
          <KPICard label="Active Products" value={kpis.active_products} sub={`${kpis.total_units_sold} units sold`} icon={Package} accentColor="#06b6d4" />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Beginner Tools */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={16} color="#818cf8" />
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>Beginner Calculators</h3>
            <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>7 TOOLS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <QuickLink to="/beginner-wizard" icon={Sparkles} label="Start Here — Build Your Business Plan" desc="Fastest path to see if your idea works" accent />
            <QuickLink to="/calculators/profit-per-order" icon={ShoppingCart} label="Profit Per Order" desc="If I sell 1 product, what do I earn?" />
            <QuickLink to="/calculators/startup-budget" icon={DollarSign} label="Startup Budget" desc="How much money do I need to start?" />
            <QuickLink to="/calculators/ads" icon={Zap} label="Ads Calculator" desc="Will my ads make profit or loss?" />
            <QuickLink to="/calculators/cod" icon={Target} label="COD & Returns" desc="Impact of failed deliveries on profit" />
            <QuickLink to="/calculators/pricing" icon={Star} label="Pricing Tool" desc="What is the perfect selling price?" />
            <QuickLink to="/calculators/goals" icon={TrendingUp} label="Goal Planner" desc="Work backward from your income goal" />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Advanced workflows */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart3 size={16} color="#f59e0b" />
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>Advanced Workflows</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <QuickLink to="/products" icon={Package} label="Manage Products" desc="Pricing, COGS, margin analysis" />
              <QuickLink to="/forecast" icon={TrendingUp} label="Sales Forecast" desc="Project monthly revenue & growth" />
              <QuickLink to="/cashflow" icon={DollarSign} label="Cash Flow" desc="Track inflows & outflows" />
              <QuickLink to="/analytics" icon={BarChart3} label="Analytics" desc="KPIs, charts, product performance" />
              <QuickLink to="/reports" icon={Package} label="Reports" desc="Export PDF, Excel, CSV" />
            </div>
          </div>

          {/* Setup Checklist */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', marginBottom: '1rem' }}>Setup Checklist</h3>
            {[
              { label: 'Connect business profile', done: !!profile },
              { label: 'Add your first product', done: (kpis?.active_products || 0) > 0 },
              { label: 'Create a sales forecast', done: (kpis?.total_units_sold || 0) > 0 },
              { label: 'Log cash flow entries', done: (kpis?.total_inflow || 0) > 0 },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: idx < 3 ? '1px solid #1e293b' : 'none' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: item.done ? 'rgba(16,185,129,0.15)' : '#1e293b',
                  border: `1px solid ${item.done ? 'rgba(16,185,129,0.4)' : '#334155'}`,
                  fontSize: '0.65rem', fontWeight: 800,
                  color: item.done ? '#34d399' : '#475569',
                }}>
                  {item.done ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '0.85rem', color: item.done ? '#64748b' : '#cbd5e1', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
