import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

export default function Forecast() {
  const [forecasts, setForecasts] = useState([]);
  const [products, setProducts] = useState([]);
  const [forecastPlanner, setForecastPlanner] = useState({
    monthly_sales_target: 0,
    monthly_traffic_forecast: 0,
    expected_conversion_rate: 0,
    expected_average_selling_price: 0
  });
  const [savingPlanner, setSavingPlanner] = useState(false);
  const [scalabilityPlan, setScalabilityPlan] = useState({
    projected_monthly_growth_rate: 0,
    future_product_launches_year1: 0
  });
  const [savingScalability, setSavingScalability] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_id: '', month: '', units_sold: '', average_order_value: '',
    conversion_rate: '', traffic_estimate: '', growth_rate: ''
  });
  const [sim, setSim] = useState({
    initial_monthly_revenue: '', monthly_growth_rate: '', months: '12',
    initial_investment: '', monthly_operating_costs: ''
  });

  const loadData = () => {
    Promise.all([api.get('/forecast'), api.get('/products'), api.get('/profile')])
      .then(([fr, pr, pf]) => {
        setForecasts(fr.data.forecasts);
        setProducts(pr.data.products);
        const profile = pf.data.profile || {};
        setForecastPlanner({
          monthly_sales_target: Number(profile.monthly_sales_target || 0),
          monthly_traffic_forecast: Number(profile.monthly_traffic_forecast || 0),
          expected_conversion_rate: Number(profile.expected_conversion_rate || 0),
          expected_average_selling_price: Number(
            profile.expected_average_selling_price || profile.planned_asp || 0
          )
        });
        setScalabilityPlan({
          projected_monthly_growth_rate: Number(profile.projected_monthly_growth_rate || 0),
          future_product_launches_year1: Number(profile.future_product_launches_year1 || 0)
        });
      });
  };

  useEffect(loadData, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/forecast', {
        ...form,
        product_id: form.product_id || undefined,
        units_sold: parseInt(form.units_sold),
        average_order_value: parseFloat(form.average_order_value),
        conversion_rate: parseFloat(form.conversion_rate),
        traffic_estimate: parseInt(form.traffic_estimate),
        growth_rate: parseFloat(form.growth_rate) || 0
      });
      toast.success('Forecast added');
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/forecast/simulate', {
        initial_monthly_revenue: parseFloat(sim.initial_monthly_revenue),
        monthly_growth_rate: parseFloat(sim.monthly_growth_rate) || 0,
        months: parseInt(sim.months),
        initial_investment: parseFloat(sim.initial_investment) || 0,
        monthly_operating_costs: parseFloat(sim.monthly_operating_costs) || 0
      });
      setSimResult(res.data.projections);
    } catch (err) {
      toast.error('Simulation failed');
    }
  };

  const saveForecastPlanner = async () => {
    setSavingPlanner(true);
    try {
      await api.patch('/profile/sales-forecast', {
        monthly_sales_target: Math.max(0, parseInt(forecastPlanner.monthly_sales_target, 10) || 0),
        monthly_traffic_forecast: Math.max(0, parseInt(forecastPlanner.monthly_traffic_forecast, 10) || 0),
        expected_conversion_rate: Math.max(0, Math.min(1, parseFloat(forecastPlanner.expected_conversion_rate) || 0)),
        expected_average_selling_price: Math.max(0, parseFloat(forecastPlanner.expected_average_selling_price) || 0)
      });
      toast.success('Section 4 sales forecast settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save sales forecast settings');
    } finally {
      setSavingPlanner(false);
    }
  };

  const saveScalabilityPlan = async () => {
    setSavingScalability(true);
    try {
      await api.patch('/profile/scalability', {
        projected_monthly_growth_rate: Math.max(0, parseFloat(scalabilityPlan.projected_monthly_growth_rate) || 0),
        future_product_launches_year1: Math.max(0, parseInt(scalabilityPlan.future_product_launches_year1, 10) || 0)
      });
      toast.success('Section 9 scalability settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save scalability settings');
    } finally {
      setSavingScalability(false);
    }
  };

  const chartData = simResult ? {
    labels: simResult.map(r => `Mo ${r.month}`),
    datasets: [
      { label: 'Revenue', data: simResult.map(r => r.revenue), backgroundColor: 'rgba(99,102,241,0.7)' },
      { label: 'Net Profit', data: simResult.map(r => r.net_profit), backgroundColor: 'rgba(16,185,129,0.7)' }
    ]
  } : null;

  const forecastRevenueFromSalesTarget =
    Number(forecastPlanner.monthly_sales_target || 0) *
    Number(forecastPlanner.expected_average_selling_price || 0);
  const forecastUnitsFromTraffic =
    Number(forecastPlanner.monthly_traffic_forecast || 0) *
    Number(forecastPlanner.expected_conversion_rate || 0);
  const forecastRevenueFromTraffic =
    forecastUnitsFromTraffic * Number(forecastPlanner.expected_average_selling_price || 0);
  const monthlyGrowthRate = Number(scalabilityPlan.projected_monthly_growth_rate || 0);
  const yearlyLaunches = Number(scalabilityPlan.future_product_launches_year1 || 0);

  const scalabilityProjection = Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    const growthMultiplier = Math.pow(1 + monthlyGrowthRate, idx);
    const cumulativeLaunches = Math.floor((yearlyLaunches * month) / 12);
    const launchBoostMultiplier = 1 + (cumulativeLaunches * 0.01);
    const projectedUnits = forecastUnitsFromTraffic * growthMultiplier * launchBoostMultiplier;
    const projectedRevenue = projectedUnits * Number(forecastPlanner.expected_average_selling_price || 0);
    const projectedTraffic = Number(forecastPlanner.monthly_traffic_forecast || 0) * growthMultiplier;
    return {
      month,
      projected_units: projectedUnits,
      projected_revenue: projectedRevenue,
      projected_traffic: projectedTraffic,
      cumulative_launches: cumulativeLaunches
    };
  });

  const scalabilityChartData = {
    labels: scalabilityProjection.map((p) => `M${p.month}`),
    datasets: [
      {
        label: 'Projected Revenue',
        data: scalabilityProjection.map((p) => Number(p.projected_revenue.toFixed(2))),
        borderColor: 'rgba(99,102,241,1)',
        backgroundColor: 'rgba(99,102,241,0.15)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Projected Units',
        data: scalabilityProjection.map((p) => Number(p.projected_units.toFixed(2))),
        borderColor: 'rgba(16,185,129,1)',
        backgroundColor: 'rgba(16,185,129,0.15)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  const yearEndRevenueRunRate = scalabilityProjection.length
    ? scalabilityProjection[scalabilityProjection.length - 1].projected_revenue
    : 0;
  const yearTotalProjectedRevenue = scalabilityProjection.reduce((sum, p) => sum + p.projected_revenue, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Forecast</h1>
          <p className="page-subtitle">Project revenue, simulate growth, and calculate break-even</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowSimulator(!showSimulator)}>
            <TrendingUp size={15} /> Growth Simulator
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Forecast
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Section 4: Sales Forecasting Planner</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.9rem' }}>
          Set monthly sales target, traffic forecast, and conversion rate to estimate monthly revenue.
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label">Monthly Sales Target (Units)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={forecastPlanner.monthly_sales_target}
              onChange={e => setForecastPlanner(p => ({ ...p, monthly_sales_target: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Monthly Traffic Forecast (Visitors)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={forecastPlanner.monthly_traffic_forecast}
              onChange={e => setForecastPlanner(p => ({ ...p, monthly_traffic_forecast: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Expected Conversion Rate (e.g. 0.02)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={forecastPlanner.expected_conversion_rate}
              onChange={e => setForecastPlanner(p => ({ ...p, expected_conversion_rate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Expected Average Selling Price (ASP)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={forecastPlanner.expected_average_selling_price}
              onChange={e => setForecastPlanner(p => ({ ...p, expected_average_selling_price: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid-4" style={{ marginBottom: '0.9rem' }}>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Revenue (Units x ASP)</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${forecastRevenueFromSalesTarget.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Units from Traffic x CVR</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{forecastUnitsFromTraffic.toFixed(0)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Revenue (Traffic Model)</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${forecastRevenueFromTraffic.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Target vs Traffic Units Gap</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {(Number(forecastPlanner.monthly_sales_target || 0) - forecastUnitsFromTraffic).toFixed(0)}
            </p>
          </div>
        </div>
        <button className="btn-primary" onClick={saveForecastPlanner} disabled={savingPlanner}>
          {savingPlanner ? 'Saving...' : 'Save Section 4 Forecast'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Section 9: Scalability Projections</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.9rem' }}>
          Set expected monthly growth and planned new product launches to project 12-month units, traffic, and revenue.
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label">Projected Monthly Growth Rate (e.g. 0.05)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.0001"
              value={scalabilityPlan.projected_monthly_growth_rate}
              onChange={e => setScalabilityPlan(s => ({ ...s, projected_monthly_growth_rate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Future Product Launches (Year 1)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={scalabilityPlan.future_product_launches_year1}
              onChange={e => setScalabilityPlan(s => ({ ...s, future_product_launches_year1: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid-3" style={{ marginBottom: '0.9rem' }}>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Year-End Revenue Run Rate</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${yearEndRevenueRunRate.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Projected Year 1 Revenue</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${yearTotalProjectedRevenue.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Planned New Launches</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{yearlyLaunches}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={saveScalabilityPlan} disabled={savingScalability} style={{ marginBottom: '1rem' }}>
          {savingScalability ? 'Saving...' : 'Save Section 9 Scalability'}
        </button>

        <Line data={scalabilityChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        <div className="table-wrapper" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr><th>Month</th><th>Projected Units</th><th>Projected Traffic</th><th>Projected Revenue</th><th>Cumulative Launches</th></tr>
            </thead>
            <tbody>
              {scalabilityProjection.map((p) => (
                <tr key={p.month}>
                  <td>M{p.month}</td>
                  <td>{p.projected_units.toFixed(0)}</td>
                  <td>{p.projected_traffic.toFixed(0)}</td>
                  <td>${p.projected_revenue.toFixed(2)}</td>
                  <td>{p.cumulative_launches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth Simulator */}
      {showSimulator && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Revenue Growth Simulator</h3>
          <form onSubmit={handleSimulate}>
            <div className="grid-3">
              <div className="field">
                <label className="label">Initial Monthly Revenue ($)</label>
                <input className="input" type="number" step="0.01" min="0" required
                  value={sim.initial_monthly_revenue} onChange={e => setSim(s => ({ ...s, initial_monthly_revenue: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Monthly Growth Rate (e.g. 0.05 = 5%)</label>
                <input className="input" type="number" step="0.001" min="0"
                  value={sim.monthly_growth_rate} onChange={e => setSim(s => ({ ...s, monthly_growth_rate: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Number of Months</label>
                <input className="input" type="number" min="1" max="60"
                  value={sim.months} onChange={e => setSim(s => ({ ...s, months: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Initial Investment ($)</label>
                <input className="input" type="number" step="0.01" min="0"
                  value={sim.initial_investment} onChange={e => setSim(s => ({ ...s, initial_investment: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Monthly Operating Costs ($)</label>
                <input className="input" type="number" step="0.01" min="0"
                  value={sim.monthly_operating_costs} onChange={e => setSim(s => ({ ...s, monthly_operating_costs: e.target.value }))} />
              </div>
            </div>
            <button className="btn-primary" type="submit">Run Simulation</button>
          </form>

          {simResult && (
            <div style={{ marginTop: '1.5rem' }}>
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
              <div className="table-wrapper" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr><th>Month</th><th>Revenue</th><th>Costs</th><th>Net Profit</th><th>Cumulative Profit</th><th>ROI %</th></tr>
                  </thead>
                  <tbody>
                    {simResult.map(r => (
                      <tr key={r.month}>
                        <td>{r.month}</td>
                        <td>${r.revenue.toLocaleString()}</td>
                        <td>${r.operating_costs.toLocaleString()}</td>
                        <td style={{ color: r.net_profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          ${r.net_profit.toLocaleString()}
                        </td>
                        <td>${r.cumulative_profit.toLocaleString()}</td>
                        <td>{r.roi_pct !== null ? `${r.roi_pct}%` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Forecasts */}
      {forecasts.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Month</th><th>Product</th><th>Units</th><th>Avg Order</th><th>Revenue</th><th>Traffic</th><th>Conv. Rate</th></tr>
            </thead>
            <tbody>
              {forecasts.map(f => (
                <tr key={f.id}>
                  <td>{f.month?.slice(0, 7)}</td>
                  <td>{f.product_name || 'All Products'}</td>
                  <td>{f.units_sold}</td>
                  <td>${parseFloat(f.average_order_value).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>${(f.units_sold * parseFloat(f.average_order_value)).toFixed(2)}</td>
                  <td>{f.traffic_estimate?.toLocaleString()}</td>
                  <td>{(parseFloat(f.conversion_rate) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Forecast Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Add Sales Forecast</h3>
            <form onSubmit={handleAdd}>
              <div className="field">
                <label className="label">Product (optional)</label>
                <select className="input" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                  <option value="">All Products</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Month *</label>
                  <input className="input" type="month" required value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value + '-01' }))} />
                </div>
                <div className="field">
                  <label className="label">Units Sold *</label>
                  <input className="input" type="number" min="0" required value={form.units_sold} onChange={e => setForm(f => ({ ...f, units_sold: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Average Order Value ($) *</label>
                  <input className="input" type="number" step="0.01" min="0" required value={form.average_order_value} onChange={e => setForm(f => ({ ...f, average_order_value: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Conversion Rate (0-1) *</label>
                  <input className="input" type="number" step="0.001" min="0" max="1" required value={form.conversion_rate} onChange={e => setForm(f => ({ ...f, conversion_rate: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Traffic Estimate *</label>
                  <input className="input" type="number" min="0" required value={form.traffic_estimate} onChange={e => setForm(f => ({ ...f, traffic_estimate: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Growth Rate (e.g. 0.05)</label>
                  <input className="input" type="number" step="0.001" min="0" value={form.growth_rate} onChange={e => setForm(f => ({ ...f, growth_rate: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Forecast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
