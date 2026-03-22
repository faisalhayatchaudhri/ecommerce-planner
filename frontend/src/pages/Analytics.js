import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useCurrencyCtx } from '../context/CurrencyContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
  }
};

function KPICard({ label, value, sub, icon: Icon, color = '#6366f1' }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <p className="stat-label">{label}</p>
        <div style={{ background: `${color}22`, borderRadius: 8, padding: '0.4rem', border: `1px solid ${color}33` }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p className="stat-value" style={{ color: '#f1f5f9', fontSize: '1.5rem' }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const { fmt, fmtDec } = useCurrencyCtx();
  const [kpis, setKpis] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [trends, setTrends] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/kpis'),
      api.get('/analytics/profitability'),
      api.get(`/analytics/monthly-trends?year=${year}`),
      api.get('/analytics/product-performance')
    ]).then(([k, pf, t, p]) => {
      setKpis(k.data);
      setProfitability(pf.data);
      setTrends(t.data.trends);
      setPerformance(p.data.performance);
    }).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="spinner-container"><div className="spinner"/><div className="spinner-text">Loading analytics...</div></div>;

  const revenueVsCostChart = trends.length ? {
    labels: trends.map(t => t.period),
    datasets: [
      { label: 'Revenue', data: trends.map(t => t.revenue), backgroundColor: 'rgba(99,102,241,0.75)', borderRadius: 6 },
      { label: 'Costs', data: trends.map(t => t.costs), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6 },
      { label: 'Net Profit', data: trends.map(t => t.net_profit), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 6 }
    ]
  } : null;

  const productRevenueChart = performance.length ? {
    labels: performance.slice(0, 8).map(p => p.name),
    datasets: [{
      data: performance.slice(0, 8).map(p => p.total_revenue),
      backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'],
      borderWidth: 0,
    }]
  } : null;

  const marginChart = performance.length ? {
    labels: performance.slice(0, 8).map(p => p.name),
    datasets: [{
      label: 'Gross Margin %',
      data: performance.slice(0, 8).map(p => p.gross_margin_pct),
      borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#6366f1'
    }]
  } : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Real-time KPIs, revenue trends and product performance</p>
        </div>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(e.target.value)}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {kpis && (
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          <KPICard label="Total Revenue" value={fmtDec(kpis.total_revenue)} sub={`${kpis.total_units_sold} units sold`} icon={DollarSign} color="#6366f1" />
          <KPICard label="Net Profit" value={fmtDec(kpis.net_profit)} sub={`${kpis.net_margin_pct}% net margin`} icon={TrendingUp} color={kpis.net_profit >= 0 ? '#10b981' : '#ef4444'} />
          <KPICard label="Avg Gross Margin" value={`${kpis.avg_gross_margin_pct}%`} sub="Across active products" icon={BarChart3} color="#f59e0b" />
          <KPICard label="Cash Outflow" value={fmtDec(kpis.total_outflow)} sub={`Inflow: ${fmtDec(kpis.total_inflow)}`} icon={Package} color="#06b6d4" />
        </div>
      )}

      {profitability?.calculations && (
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.95rem', color: '#f1f5f9' }}>
            Break-Even & Margin Analysis
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
            Gross Margin = (Revenue − COGS) / Revenue &nbsp;·&nbsp; Break-Even = Fixed Costs / Gross Profit per Unit
          </p>
          <div className="grid-4" style={{ marginBottom: '0.75rem' }}>
            <KPICard label="Revenue" value={fmtDec(profitability.calculations.revenue)} icon={DollarSign} color="#6366f1" />
            <KPICard label="Gross Profit" value={fmtDec(profitability.calculations.gross_profit)} icon={TrendingUp} color="#10b981" />
            <KPICard label="Gross Margin" value={`${profitability.calculations.gross_margin_pct}%`} icon={BarChart3} color="#f59e0b" />
            <KPICard label="Net Margin" value={`${profitability.calculations.net_margin_pct}%`} icon={Package} color="#06b6d4" />
          </div>
          <div className="grid-4">
            <KPICard label="Net Profit" value={fmtDec(profitability.calculations.net_profit)} icon={TrendingUp} color={profitability.calculations.net_profit >= 0 ? '#10b981' : '#ef4444'} />
            <KPICard label="Fixed Costs" value={fmtDec(profitability.assumptions.fixed_costs)} icon={DollarSign} color="#ef4444" />
            <KPICard label="Break-Even Units" value={profitability.calculations.break_even_units ?? 'N/A'} icon={Package} color="#8b5cf6" />
            <KPICard label="Break-Even Revenue" value={profitability.calculations.break_even_revenue !== null ? fmtDec(profitability.calculations.break_even_revenue) : 'N/A'} icon={DollarSign} color="#f97316" />
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {revenueVsCostChart && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', color: '#f1f5f9' }}>Revenue vs Costs — {year}</h3>
            <Bar data={revenueVsCostChart} options={{ ...CHART_DEFAULTS, responsive: true }} />
          </div>
        )}
        {productRevenueChart && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', color: '#f1f5f9' }}>Revenue by Product</h3>
            <Doughnut data={productRevenueChart} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } } } }} />
          </div>
        )}
      </div>

      {marginChart && (
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', color: '#f1f5f9' }}>Gross Margin by Product</h3>
          <Line data={marginChart} options={{ ...CHART_DEFAULTS, responsive: true, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Margin %', color: '#64748b' } } } }} />
        </div>
      )}

      {performance.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', color: '#f1f5f9' }}>Product Performance Table</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>COGS</th>
                  <th>Gross Margin</th><th>Units</th><th>Revenue</th><th>Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{p.name}</td>
                    <td><span className="badge badge-blue">{p.category || 'N/A'}</span></td>
                    <td>{fmtDec(p.selling_price)}</td>
                    <td>{fmtDec(p.cogs)}</td>
                    <td>
                      <span className={`badge ${p.gross_margin_pct > 30 ? 'badge-green' : p.gross_margin_pct > 15 ? 'badge-yellow' : 'badge-red'}`}>
                        {p.gross_margin_pct}%
                      </span>
                    </td>
                    <td>{p.total_units}</td>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{fmtDec(p.total_revenue)}</td>
                    <td style={{ color: '#34d399', fontWeight: 600 }}>{fmtDec(p.total_gross_profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {performance.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <BarChart3 size={48} color="#334155" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No analytics data yet</h3>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>Add products and sales forecasts to generate analytics.</p>
        </div>
      )}
    </div>
  );
}
