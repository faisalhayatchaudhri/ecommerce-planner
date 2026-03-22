import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

function KPICard({ label, value, sub, color }) {
  return (
    <div className="kpi-card">
      <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: color || '#0f172a' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

export default function Analytics() {
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
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  const fmt = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const revenueVsCostChart = trends.length ? {
    labels: trends.map(t => t.period),
    datasets: [
      { label: 'Revenue', data: trends.map(t => t.revenue), backgroundColor: 'rgba(99,102,241,0.75)' },
      { label: 'Costs', data: trends.map(t => t.costs), backgroundColor: 'rgba(239,68,68,0.65)' },
      { label: 'Net Profit', data: trends.map(t => t.net_profit), backgroundColor: 'rgba(16,185,129,0.75)' }
    ]
  } : null;

  const productRevenueChart = performance.length ? {
    labels: performance.slice(0, 8).map(p => p.name),
    datasets: [{
      data: performance.slice(0, 8).map(p => p.total_revenue),
      backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16']
    }]
  } : null;

  const marginChart = performance.length ? {
    labels: performance.slice(0, 8).map(p => p.name),
    datasets: [{
      label: 'Gross Margin %',
      data: performance.slice(0, 8).map(p => p.gross_margin_pct),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.12)',
      fill: true,
      tension: 0.4
    }]
  } : null;

  if (loading) return <div style={{ color: '#64748b' }}>Loading analytics...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Real-time KPIs, trends, and product performance</p>
        </div>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(e.target.value)}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {kpis && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <KPICard label="Total Revenue" value={fmt(kpis.total_revenue)} sub={`${kpis.total_units_sold} units sold`} />
          <KPICard label="Net Profit" value={fmt(kpis.net_profit)} sub={`${kpis.net_margin_pct}% net margin`} color={kpis.net_profit >= 0 ? '#10b981' : '#ef4444'} />
          <KPICard label="Avg Gross Margin" value={`${kpis.avg_gross_margin_pct}%`} sub="Across active products" color="#f59e0b" />
          <KPICard label="Total Outflow" value={fmt(kpis.total_outflow)} sub={`Inflow: ${fmt(kpis.total_inflow)}`} />
        </div>
      )}

      {profitability?.calculations && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.95rem' }}>
            Section 7: Profit Margin & Break-Even
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.8rem' }}>
            Gross Margin = (Revenue - COGS) / Revenue, Break-Even = Fixed Costs / Gross Profit per Unit
          </p>
          <div className="grid-4" style={{ marginBottom: '0.75rem' }}>
            <KPICard label="Revenue" value={fmt(profitability.calculations.revenue)} />
            <KPICard label="Gross Profit" value={fmt(profitability.calculations.gross_profit)} />
            <KPICard label="Gross Margin" value={`${profitability.calculations.gross_margin_pct}%`} />
            <KPICard label="Net Margin" value={`${profitability.calculations.net_margin_pct}%`} />
          </div>
          <div className="grid-4">
            <KPICard label="Net Profit" value={fmt(profitability.calculations.net_profit)} color={profitability.calculations.net_profit >= 0 ? '#10b981' : '#ef4444'} />
            <KPICard label="Fixed Costs" value={fmt(profitability.assumptions.fixed_costs)} />
            <KPICard label="Break-Even Units" value={profitability.calculations.break_even_units ?? 'N/A'} />
            <KPICard label="Break-Even Revenue" value={profitability.calculations.break_even_revenue !== null ? fmt(profitability.calculations.break_even_revenue) : 'N/A'} />
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {revenueVsCostChart && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Revenue vs Costs — {year}</h3>
            <Bar data={revenueVsCostChart} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
        )}
        {productRevenueChart && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Revenue by Product</h3>
            <Doughnut data={productRevenueChart} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        )}
      </div>

      {marginChart && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Gross Margin by Product</h3>
          <Line data={marginChart} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { title: { display: true, text: 'Margin %' } } } }} />
        </div>
      )}

      {performance.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Product Performance</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>COGS</th>
                  <th>Gross Margin</th><th>Units Sold</th><th>Revenue</th><th>Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-blue">{p.category || 'N/A'}</span></td>
                    <td>${parseFloat(p.selling_price).toFixed(2)}</td>
                    <td>${parseFloat(p.cogs).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.gross_margin_pct > 30 ? 'badge-green' : p.gross_margin_pct > 15 ? 'badge-yellow' : 'badge-red'}`}>
                        {p.gross_margin_pct}%
                      </span>
                    </td>
                    <td>{p.total_units}</td>
                    <td style={{ fontWeight: 600 }}>${parseFloat(p.total_revenue).toFixed(2)}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>${parseFloat(p.total_gross_profit).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
