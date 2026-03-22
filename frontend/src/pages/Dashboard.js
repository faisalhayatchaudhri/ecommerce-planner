import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCurrencyCtx } from '../context/CurrencyContext';
import {
  TrendingUp, DollarSign, Package, BarChart3,
  ArrowRight, Sparkles, Zap, Target, ShoppingCart,
  Tag, Rocket, LayoutDashboard, Users, FileText, Globe
} from 'lucide-react';

/* ── KPI Card ── */
function KPICard({ label, value, sub, icon: Icon, accentColor = '#6366f1' }) {
  return (
    <div className="kpi-card" style={{ padding: '1.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <p className="stat-label">{label}</p>
        <div style={{ background: `${accentColor}22`, borderRadius: 10, padding: '0.45rem', border: `1px solid ${accentColor}33` }}>
          <Icon size={18} color={accentColor} />
        </div>
      </div>
      <p className="stat-value" style={{ color: '#f1f5f9' }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

/* ── Navigation Link Row ── */
function NavRow({ to, icon: Icon, label, desc, accent, iconColor }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.85rem',
        padding: '0.75rem 0.9rem', borderRadius: 10,
        border: accent ? '1px solid rgba(99,102,241,0.35)' : '1px solid #1e293b',
        textDecoration: 'none', color: 'inherit',
        background: accent ? 'rgba(99,102,241,0.07)' : 'transparent',
        transition: 'all 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.13)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = accent ? 'rgba(99,102,241,0.07)' : 'transparent'; e.currentTarget.style.borderColor = accent ? 'rgba(99,102,241,0.35)' : '#1e293b'; }}
    >
      <div style={{ background: iconColor ? `${iconColor}18` : '#0f172a', borderRadius: 8, padding: '0.42rem', flexShrink: 0, border: iconColor ? `1px solid ${iconColor}33` : '1px solid #1e293b' }}>
        <Icon size={15} color={iconColor || '#475569'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.865rem', fontWeight: accent ? 700 : 600, color: accent ? '#c7d2fe' : '#cbd5e1' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '0.05rem' }}>{desc}</div>}
      </div>
      <ArrowRight size={13} color={accent ? '#818cf8' : '#334155'} style={{ flexShrink: 0 }} />
    </Link>
  );
}

export default function Dashboard() {
  const { fmtDec } = useCurrencyCtx();
  const [kpis, setKpis] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics/kpis'), api.get('/profile')])
      .then(([k, p]) => { setKpis(k.data); setProfile(p.data.profile); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /><div className="spinner-text">Loading...</div></div>;

  /* Health score */
  const healthScore = (() => {
    if (!kpis) return 0;
    let s = 0;
    if (kpis.net_profit > 0) s += 40;
    if (kpis.avg_gross_margin_pct > 20) s += 30;
    if (kpis.active_products > 0) s += 15;
    if (kpis.total_units_sold > 0) s += 15;
    return s;
  })();
  const healthLabel = healthScore >= 70 ? 'Strong 💪' : healthScore >= 40 ? 'Average ⚡' : 'Needs Work 🔧';
  const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444';

  /* Checklist */
  const checklist = [
    { label: 'Run the Beginner Wizard',   done: !!profile,                              to: '/beginner-wizard' },
    { label: 'Add your first product',    done: (kpis?.active_products || 0) > 0,       to: '/products' },
    { label: 'Create a sales forecast',   done: (kpis?.total_units_sold || 0) > 0,      to: '/forecast' },
    { label: 'Log cash flow entries',     done: (kpis?.total_inflow || 0) > 0,           to: '/cashflow' },
  ];
  const doneCount = checklist.filter(i => i.done).length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {profile?.business_name || 'My Dashboard'}
            {profile && (
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem', fontWeight: 700, marginLeft: '0.6rem', verticalAlign: 'middle' }}>
                {profile.currency}
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            {profile
              ? `${profile.business_type?.replace(/_/g, ' ')} · ${profile.country || ''}`
              : 'Welcome to your e-commerce command centre'}
          </p>
        </div>
        {!profile && (
          <Link to="/beginner-wizard" className="btn-primary">
            <Sparkles size={14} /> Start Here
          </Link>
        )}
      </div>

      {/* ── SECTION 1: BEGIN YOUR JOURNEY (always visible & prominent) ── */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.1rem' }}>
          <Sparkles size={17} color="#818cf8" />
          <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9' }}>Step-by-Step Beginner Tools</h2>
          <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700 }}>START HERE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.55rem' }}>
          <NavRow to="/beginner-wizard"              icon={Sparkles}     label="1. Start Here — Business Wizard"  desc="Create your entire plan in 2 minutes" accent iconColor="#818cf8" />
          <NavRow to="/calculators/profit-per-order" icon={ShoppingCart}  label="2. Profit Per Order"              desc="If I sell 1 unit, what do I keep?" iconColor="#34d399" />
          <NavRow to="/calculators/pricing"          icon={Tag}           label="3. Pricing Tool"                  desc="What should I charge?" iconColor="#fbbf24" />
          <NavRow to="/calculators/startup-budget"   icon={Rocket}        label="4. Startup Budget"                desc="Total capital needed to launch" iconColor="#f97316" />
          <NavRow to="/calculators/ads"              icon={Zap}           label="5. Ads Calculator"                desc="Will my ad spend be profitable?" iconColor="#a78bfa" />
          <NavRow to="/calculators/cod"              icon={Package}        label="6. COD & Returns"                desc="How failed deliveries eat margin" iconColor="#22d3ee" />
          <NavRow to="/calculators/goals"            icon={Target}         label="7. Goal Planner"                 desc="How many orders to hit my income?" iconColor="#f87171" />
        </div>
      </div>

      {/* ── SECTION 2: KPI summary (only if data exists) ── */}
      {kpis && (
        <>
          {/* Health banner */}
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: 12, padding: '0.9rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#475569', marginBottom: '0.3rem' }}>Business Health Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: healthColor, lineHeight: 1 }}>{healthScore}</span>
                  <span style={{ color: '#334155', fontSize: '0.8rem' }}>/100</span>
                  <span className="badge" style={{ background: `${healthColor}22`, color: healthColor, border: `1px solid ${healthColor}44`, fontSize: '0.68rem' }}>{healthLabel}</span>
                </div>
              </div>
              <div style={{ width: 130 }}>
                <div className="progress-bar-outer">
                  <div className="progress-bar-inner" style={{ width: `${healthScore}%`, background: `linear-gradient(90deg, ${healthColor}, ${healthColor}99)` }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { l: 'Profitable', v: kpis.net_profit >= 0 ? '✓ Yes' : '✗ No', c: kpis.net_profit >= 0 ? '#10b981' : '#ef4444' },
                { l: 'Avg Margin', v: `${kpis.avg_gross_margin_pct}%`, c: kpis.avg_gross_margin_pct > 20 ? '#10b981' : '#f59e0b' },
                { l: 'Products', v: kpis.active_products, c: '#f1f5f9' },
              ].map(item => (
                <div key={item.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.l}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: item.c, marginTop: '0.15rem' }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <KPICard label="Total Revenue"    value={fmtDec(kpis.total_revenue)}        sub={`${kpis.total_units_sold} units sold`}      icon={DollarSign}   accentColor="#6366f1" />
            <KPICard label="Net Profit"       value={fmtDec(kpis.net_profit)}           sub={`${kpis.net_margin_pct}% net margin`}       icon={TrendingUp}   accentColor={kpis.net_profit >= 0 ? '#10b981' : '#ef4444'} />
            <KPICard label="Avg Gross Margin" value={`${kpis.avg_gross_margin_pct}%`}  sub="Across active products"                     icon={BarChart3}    accentColor="#f59e0b" />
            <KPICard label="Active Products"  value={kpis.active_products}              sub={`${kpis.total_units_sold} units sold`}      icon={Package}      accentColor="#06b6d4" />
          </div>
        </>
      )}

      {/* ── SECTION 3: Advanced tools + Checklist ── */}
      <div className="grid-2">
        {/* Advanced */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={16} color="#f59e0b" />
            <h3 style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9' }}>Advanced Modules</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <NavRow to="/dashboard"  icon={LayoutDashboard} label="Dashboard Overview"  desc="Full KPI & analytics hub" iconColor="#6366f1" />
            <NavRow to="/products"   icon={Tag}             label="Product Catalog"     desc="Pricing, COGS, margin analysis" iconColor="#10b981" />
            <NavRow to="/forecast"   icon={TrendingUp}      label="Sales Forecast"      desc="12-month revenue projections" iconColor="#f59e0b" />
            <NavRow to="/cashflow"   icon={DollarSign}      label="Cash Flow Tracker"   desc="Real inflows & outflows" iconColor="#f97316" />
            <NavRow to="/partners"   icon={Users}           label="Partners & Equity"   desc="Investors & co-founders" iconColor="#8b5cf6" />
            <NavRow to="/analytics"  icon={BarChart3}       label="Deep Analytics"      desc="Charts, break-even, margins" iconColor="#06b6d4" />
            <NavRow to="/reports"    icon={FileText}        label="Export Reports"       desc="PDF, Excel, CSV downloads" iconColor="#64748b" />
            <NavRow to="/currency"   icon={Globe}           label="Currency & Tax"       desc="Multi-currency & tax settings" iconColor="#475569" />
          </div>
        </div>

        {/* Checklist */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9' }}>Setup Checklist</h3>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{doneCount}/{checklist.length} done</span>
          </div>

          {/* Overall progress */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="progress-bar-outer">
              <div className="progress-bar-inner" style={{ width: `${(doneCount / checklist.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.3rem' }}>{Math.round((doneCount / checklist.length) * 100)}% complete</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {checklist.map((item, idx) => (
              <Link
                key={idx} to={item.done ? '#' : item.to}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: 10, textDecoration: 'none', border: '1px solid', borderColor: item.done ? 'rgba(16,185,129,0.2)' : '#1e293b', background: item.done ? 'rgba(16,185,129,0.05)' : 'transparent', transition: 'all 0.15s', cursor: item.done ? 'default' : 'pointer' }}
                onClick={e => item.done && e.preventDefault()}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.done ? 'rgba(16,185,129,0.2)' : '#0f172a', border: `1px solid ${item.done ? 'rgba(16,185,129,0.5)' : '#1e293b'}`, fontSize: '0.68rem', fontWeight: 800, color: item.done ? '#34d399' : '#475569' }}>
                  {item.done ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '0.85rem', color: item.done ? '#475569' : '#cbd5e1', textDecoration: item.done ? 'line-through' : 'none', flex: 1 }}>
                  {item.label}
                </span>
                {!item.done && <ArrowRight size={12} color="#334155" />}
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', padding: '0.85rem', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
            💡 <strong style={{ color: '#94a3b8' }}>Tip:</strong> Complete the Beginner Wizard first — it fills in your entire business profile automatically so everything else works.
          </div>
        </div>
      </div>
    </div>
  );
}
