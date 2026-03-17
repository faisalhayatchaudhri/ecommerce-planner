import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, PieChart } from 'lucide-react';

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [returns, setReturns] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDist, setShowDist] = useState(false);
  const [netProfit, setNetProfit] = useState('');
  const [distribution, setDistribution] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    equity_pct: '',
    capital_invested: '',
    profit_share_pct: '',
    investment_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const load = () => {
    Promise.all([api.get('/partners'), api.get('/analytics/returns')])
      .then(([partnersRes, returnsRes]) => {
        setPartners(partnersRes.data.partners);
        setReturns(returnsRes.data);
      })
      .catch(async () => {
        const fallback = await api.get('/partners');
        setPartners(fallback.data.partners);
        setReturns(null);
      });
  };
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/partners', {
        ...form,
        equity_pct: parseFloat(form.equity_pct),
        capital_invested: parseFloat(form.capital_invested),
        profit_share_pct: parseFloat(form.profit_share_pct)
      });
      toast.success('Partner added');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add partner');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove partner?')) return;
    await api.delete(`/partners/${id}`);
    toast.success('Partner removed');
    load();
  };

  const handleDistribution = async () => {
    if (!netProfit) return;
    try {
      const res = await api.get(`/partners/distribution?net_profit=${netProfit}`);
      setDistribution(res.data);
    } catch {
      toast.error('Failed to calculate distribution');
    }
  };

  const totalEquity = partners.reduce((sum, p) => sum + parseFloat(p.equity_pct), 0);
  const totalProfitShare = partners.reduce((sum, p) => sum + parseFloat(p.profit_share_pct || 0), 0);
  const totalInvested = partners.reduce((sum, p) => sum + parseFloat(p.capital_invested), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners & Investors</h1>
          <p className="page-subtitle">Manage equity, capital, and profit sharing</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowDist(!showDist)}>
            <PieChart size={15} /> Profit Distribution
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Partner
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Partners</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4 }}>{partners.length}</p>
        </div>
        <div className="kpi-card">
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Equity Allocated</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4 }}>{(totalEquity * 100).toFixed(1)}%</p>
          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{((1 - totalEquity) * 100).toFixed(1)}% remaining</p>
        </div>
        <div className="kpi-card">
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Capital Invested</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4 }}>${totalInvested.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Profit Share Allocated</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4 }}>{(totalProfitShare * 100).toFixed(1)}%</p>
          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{((1 - totalProfitShare) * 100).toFixed(1)}% remaining</p>
        </div>
      </div>

      {returns && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.95rem' }}>Section 10: ROI & Investment Returns</h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.8rem' }}>
            ROI = (Net Profit / Total Investment) x 100, ROE = Net Profit Share / Equity Invested
          </p>
          <div className="grid-4" style={{ marginBottom: '0.8rem' }}>
            <div className="kpi-card">
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Monthly Net Profit</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${returns.monthly_net_profit.toLocaleString()}</p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Investment</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${returns.total_investment.toLocaleString()}</p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Business ROI</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: (returns.roi_pct || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                {returns.roi_pct !== null ? `${returns.roi_pct}%` : 'N/A'}
              </p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Owner Initial Investment</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${returns.owner_initial_investment.toLocaleString()}</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Partner</th><th>Profit Share %</th><th>Capital Invested</th><th>Profit Share Amount</th><th>ROE %</th></tr>
              </thead>
              <tbody>
                {returns.partner_returns.map((row) => (
                  <tr key={row.partner_id}>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td>{row.profit_share_pct.toFixed(1)}%</td>
                    <td>${row.capital_invested.toLocaleString()}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>${row.partner_profit_share.toLocaleString()}</td>
                    <td>{row.roe_pct !== null ? `${row.roe_pct}%` : 'N/A'}</td>
                  </tr>
                ))}
                {returns.partner_returns.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '1.25rem' }}>No partner records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDist && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Profit Distribution Calculator</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label className="label">Net Profit to Distribute ($)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={netProfit}
                onChange={(e) => setNetProfit(e.target.value)}
                placeholder="e.g. 10000"
              />
            </div>
            <button className="btn-primary" onClick={handleDistribution}>Calculate</button>
          </div>
          {distribution && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Partner</th><th>Equity %</th><th>Profit Share %</th><th>Capital Invested</th><th>Profit Share</th><th>ROI %</th></tr>
                </thead>
                <tbody>
                  {distribution.distribution.map((d) => (
                    <tr key={d.partner_id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>{d.equity_pct.toFixed(1)}%</td>
                      <td>{d.profit_share_pct.toFixed(1)}%</td>
                      <td>${d.capital_invested.toLocaleString()}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>${d.profit_share.toLocaleString()}</td>
                      <td>{d.roi_pct !== null ? <span className={`badge ${d.roi_pct >= 0 ? 'badge-green' : 'badge-red'}`}>{d.roi_pct}%</span> : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Equity</th><th>Profit Share</th><th>Capital Invested</th><th>Investment Date</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: '#64748b' }}>{p.email || '-'}</td>
                <td><span className="badge badge-blue">{(parseFloat(p.equity_pct) * 100).toFixed(1)}%</span></td>
                <td><span className="badge badge-yellow">{(parseFloat(p.profit_share_pct || 0) * 100).toFixed(1)}%</span></td>
                <td style={{ fontWeight: 600 }}>${parseFloat(p.capital_invested).toLocaleString()}</td>
                <td>{p.investment_date?.slice(0, 10) || '-'}</td>
                <td style={{ color: '#64748b', maxWidth: 200 }}>{p.notes || '-'}</td>
                <td>
                  <button className="btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(p.id)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No partners yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Add Partner / Investor</h3>
            <form onSubmit={handleAdd}>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Name *</label>
                  <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Equity % (decimal, e.g. 0.25) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    required
                    value={form.equity_pct}
                    onChange={(e) => setForm((f) => ({ ...f, equity_pct: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="label">Profit Sharing % (decimal, e.g. 0.25) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    required
                    value={form.profit_share_pct}
                    onChange={(e) => setForm((f) => ({ ...f, profit_share_pct: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="label">Capital Invested ($) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.capital_invested}
                    onChange={(e) => setForm((f) => ({ ...f, capital_invested: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="label">Investment Date</label>
                  <input className="input" type="date" value={form.investment_date} onChange={(e) => setForm((f) => ({ ...f, investment_date: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label className="label">Notes</label>
                <input className="input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
