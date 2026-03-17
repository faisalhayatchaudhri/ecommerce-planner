import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Zap } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CATEGORIES = {
  inflow: ['Sales Revenue', 'Returns', 'Other Income'],
  outflow: ['Product Purchase', 'Advertising', 'Platform Fees', 'Salaries', 'Shipping', 'Other Expense'],
  funding: ['Capital Injection', 'Investor Funding', 'Loan', 'Crowdfunding']
};

export default function CashFlow() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [cashflowPlan, setCashflowPlan] = useState({
    initial_investment_amount: 0,
    monthly_cash_injection: 0,
    cash_injection_months: 0
  });
  const [cashflowAssumptions, setCashflowAssumptions] = useState({
    monthly_sales_target: 0,
    planned_cogs: 0
  });
  const [savingCashflowPlan, setSavingCashflowPlan] = useState(false);
  const [operational, setOperational] = useState({
    monthly_platform_cost: 0,
    monthly_website_hosting_cost: 0,
    monthly_marketing_budget: 0,
    payment_gateway_fee_pct: 0
  });
  const [projectedMonthlyRevenue, setProjectedMonthlyRevenue] = useState(0);
  const [savingOperational, setSavingOperational] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showInject, setShowInject] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ month: '', type: 'inflow', category: 'Sales Revenue', amount: '', description: '' });
  const [inject, setInject] = useState({ amount: '', month: '', description: '' });
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    Promise.all([
      api.get(`/cashflow?year=${year}`),
      api.get(`/cashflow/summary?year=${year}`),
      api.get('/profile')
    ]).then(([r, s, p]) => {
      setRecords(r.data.records);
      setSummary(s.data.summary);
      const profile = p.data.profile || {};
      setOperational({
        monthly_platform_cost: Number(profile.monthly_platform_cost || 0),
        monthly_website_hosting_cost: Number(profile.monthly_website_hosting_cost || 0),
        monthly_marketing_budget: Number(profile.monthly_marketing_budget || 0),
        payment_gateway_fee_pct: Number(profile.payment_gateway_fee_pct || 0)
      });
      setCashflowPlan({
        initial_investment_amount: Number(profile.initial_investment_amount || 0),
        monthly_cash_injection: Number(profile.monthly_cash_injection || 0),
        cash_injection_months: Number(profile.cash_injection_months || 0)
      });
      setCashflowAssumptions({
        monthly_sales_target: Number(profile.monthly_sales_target || 0),
        planned_cogs: Number(profile.planned_cogs || 0)
      });
      const revenueFromForecast =
        Number(profile.monthly_sales_target || 0) * Number(profile.expected_average_selling_price || profile.planned_asp || 0);
      setProjectedMonthlyRevenue(revenueFromForecast);
    });
  };

  useEffect(loadData, [year]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/cashflow', { ...form, amount: parseFloat(form.amount) });
      toast.success('Record added');
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  const handleInject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cashflow/inject', { ...inject, amount: parseFloat(inject.amount) });
      toast.success('Capital injection recorded');
      setShowInject(false);
      loadData();
    } catch { toast.error('Failed to record injection'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/cashflow/${id}`);
    toast.success('Deleted');
    loadData();
  };

  const fixedMonthlyOperationalCosts =
    Number(operational.monthly_platform_cost || 0) +
    Number(operational.monthly_website_hosting_cost || 0) +
    Number(operational.monthly_marketing_budget || 0);
  const projectedGatewayFees =
    Number(projectedMonthlyRevenue || 0) * Number(operational.payment_gateway_fee_pct || 0);
  const estimatedTotalOperationalCosts = fixedMonthlyOperationalCosts + projectedGatewayFees;
  const estimatedMonthlyCogsOutflow =
    Number(cashflowAssumptions.monthly_sales_target || 0) * Number(cashflowAssumptions.planned_cogs || 0);

  const monthlyOperatingInflow = Number(projectedMonthlyRevenue || 0);
  const monthlyOperatingOutflow = estimatedTotalOperationalCosts + estimatedMonthlyCogsOutflow;
  const monthlyOperatingCashFlow = monthlyOperatingInflow - monthlyOperatingOutflow;
  const monthlyNetWithInjection = monthlyOperatingCashFlow + Number(cashflowPlan.monthly_cash_injection || 0);
  const projectedCashAfterInjectionWindow =
    Number(cashflowPlan.initial_investment_amount || 0) +
    (Number(cashflowPlan.cash_injection_months || 0) * monthlyNetWithInjection);

  const saveOperational = async () => {
    setSavingOperational(true);
    try {
      await api.patch('/profile/operational-costs', {
        monthly_platform_cost: Math.max(0, parseFloat(operational.monthly_platform_cost) || 0),
        monthly_website_hosting_cost: Math.max(0, parseFloat(operational.monthly_website_hosting_cost) || 0),
        monthly_marketing_budget: Math.max(0, parseFloat(operational.monthly_marketing_budget) || 0),
        payment_gateway_fee_pct: Math.max(0, Math.min(1, parseFloat(operational.payment_gateway_fee_pct) || 0))
      });
      toast.success('Section 3 operational costs saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save operational costs');
    } finally {
      setSavingOperational(false);
    }
  };

  const saveCashflowPlan = async () => {
    setSavingCashflowPlan(true);
    try {
      await api.patch('/profile/cashflow-plan', {
        initial_investment_amount: Math.max(0, parseFloat(cashflowPlan.initial_investment_amount) || 0),
        monthly_cash_injection: Math.max(0, parseFloat(cashflowPlan.monthly_cash_injection) || 0),
        cash_injection_months: Math.max(0, parseInt(cashflowPlan.cash_injection_months, 10) || 0)
      });
      toast.success('Section 8 cash flow planning saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save cash flow planning');
    } finally {
      setSavingCashflowPlan(false);
    }
  };

  const chartData = summary.length ? {
    labels: summary.map(r => r.period),
    datasets: [
      { label: 'Inflow', data: summary.map(r => parseFloat(r.total_inflow)), backgroundColor: 'rgba(16,185,129,0.7)' },
      { label: 'Outflow', data: summary.map(r => parseFloat(r.total_outflow)), backgroundColor: 'rgba(239,68,68,0.7)' },
      { label: 'Funding', data: summary.map(r => parseFloat(r.total_funding)), backgroundColor: 'rgba(99,102,241,0.7)' }
    ]
  } : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cash Flow</h1>
          <p className="page-subtitle">Track monthly inflows, outflows, and capital injections</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => setShowInject(true)}>
            <Zap size={15} /> Inject Capital
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Record
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Section 3: Operational Costs Setup</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.9rem' }}>
          Configure monthly platform, hosting/development, marketing, and payment gateway costs.
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label">Platform Costs (Monthly)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={operational.monthly_platform_cost}
              onChange={e => setOperational(o => ({ ...o, monthly_platform_cost: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Website Development/Hosting (Monthly)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={operational.monthly_website_hosting_cost}
              onChange={e => setOperational(o => ({ ...o, monthly_website_hosting_cost: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Marketing & Advertising Budget (Monthly)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={operational.monthly_marketing_budget}
              onChange={e => setOperational(o => ({ ...o, monthly_marketing_budget: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Payment Gateway Fee % (e.g. 0.029)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={operational.payment_gateway_fee_pct}
              onChange={e => setOperational(o => ({ ...o, payment_gateway_fee_pct: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Projected Monthly Revenue (for gateway fee estimate)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={projectedMonthlyRevenue}
              onChange={e => setProjectedMonthlyRevenue(e.target.value)}
            />
          </div>
        </div>
        <div className="grid-3" style={{ marginBottom: '0.9rem' }}>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Fixed Monthly Costs</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${fixedMonthlyOperationalCosts.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Estimated Gateway Fees</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${projectedGatewayFees.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Estimated Total Monthly Opex</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${estimatedTotalOperationalCosts.toFixed(2)}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={saveOperational} disabled={savingOperational}>
          {savingOperational ? 'Saving...' : 'Save Section 3 Costs'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Section 8: Cash Flow Management</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.9rem' }}>
          Plan startup capital, monthly cash injections, and view projected operating cash flow.
        </p>
        <div className="grid-3">
          <div className="field">
            <label className="label">Initial Investment</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={cashflowPlan.initial_investment_amount}
              onChange={e => setCashflowPlan(c => ({ ...c, initial_investment_amount: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Monthly Cash Injection</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={cashflowPlan.monthly_cash_injection}
              onChange={e => setCashflowPlan(c => ({ ...c, monthly_cash_injection: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Injection Months</label>
            <input
              className="input"
              type="number"
              min="0"
              max="60"
              value={cashflowPlan.cash_injection_months}
              onChange={e => setCashflowPlan(c => ({ ...c, cash_injection_months: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid-4" style={{ marginBottom: '0.9rem' }}>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Monthly Operating Inflow</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${monthlyOperatingInflow.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Monthly Operating Outflow</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${monthlyOperatingOutflow.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Operating Cash Flow</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: monthlyOperatingCashFlow >= 0 ? '#10b981' : '#ef4444' }}>
              ${monthlyOperatingCashFlow.toFixed(2)}
            </p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Projected Cash After Injection Window</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${projectedCashAfterInjectionWindow.toFixed(2)}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={saveCashflowPlan} disabled={savingCashflowPlan}>
          {savingCashflowPlan ? 'Saving...' : 'Save Section 8 Plan'}
        </button>
      </div>

      {chartData && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Monthly Cash Flow — {year}</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      )}

      {summary.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Monthly Summary</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Period</th><th>Inflow</th><th>Outflow</th><th>Funding</th><th>Net Cash Flow</th></tr>
              </thead>
              <tbody>
                {summary.map(r => (
                  <tr key={r.period}>
                    <td>{r.period}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>${parseFloat(r.total_inflow).toFixed(2)}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>${parseFloat(r.total_outflow).toFixed(2)}</td>
                    <td style={{ color: '#6366f1', fontWeight: 600 }}>${parseFloat(r.total_funding).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: parseFloat(r.net_cashflow) >= 0 ? '#10b981' : '#ef4444' }}>
                      ${parseFloat(r.net_cashflow).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction log */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Month</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th><th></th></tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.month?.slice(0, 7)}</td>
                <td>
                  <span className={`badge ${r.type === 'inflow' ? 'badge-green' : r.type === 'funding' ? 'badge-blue' : 'badge-red'}`}>
                    {r.type}
                  </span>
                </td>
                <td>{r.category}</td>
                <td style={{ fontWeight: 600 }}>${parseFloat(r.amount).toFixed(2)}</td>
                <td style={{ color: '#64748b' }}>{r.description}</td>
                <td>
                  <button className="btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(r.id)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Record Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Add Cash Flow Record</h3>
            <form onSubmit={handleAdd}>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Month *</label>
                  <input className="input" type="month" required
                    onChange={e => setForm(f => ({ ...f, month: e.target.value + '-01' }))} />
                </div>
                <div className="field">
                  <label className="label">Type *</label>
                  <select className="input" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value, category: CATEGORIES[e.target.value][0] }))}>
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                    <option value="funding">Funding</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Category *</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Amount ($) *</label>
                  <input className="input" type="number" step="0.01" min="0" required
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inject Capital Modal */}
      {showInject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Inject Capital</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              Simulate adding external funds to your business (e.g., investor capital, loans).
            </p>
            <form onSubmit={handleInject}>
              <div className="field">
                <label className="label">Amount ($)</label>
                <input className="input" type="number" step="0.01" min="0" required
                  value={inject.amount} onChange={e => setInject(i => ({ ...i, amount: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Month</label>
                <input className="input" type="month" required
                  onChange={e => setInject(i => ({ ...i, month: e.target.value + '-01' }))} />
              </div>
              <div className="field">
                <label className="label">Description</label>
                <input className="input" value={inject.description} onChange={e => setInject(i => ({ ...i, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowInject(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Injection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
