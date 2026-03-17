import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Globe, ArrowRight } from 'lucide-react';

export default function Currency() {
  const [rates, setRates] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [taxPlanner, setTaxPlanner] = useState({
    sales_tax_rate: 0,
    import_duties_pct: 0,
    vat_gst_rate: 0
  });
  const [taxableRevenue, setTaxableRevenue] = useState(0);
  const [importValue, setImportValue] = useState(0);
  const [savingTax, setSavingTax] = useState(false);
  const [base, setBase] = useState('USD');
  const [converter, setConverter] = useState({ from: 'USD', to: 'EUR', amount: '100' });
  const [converted, setConverted] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/currency/rates?base=${base}`)
      .then(r => setRates(r.data))
      .finally(() => setLoading(false));
    api.get('/currency/taxes').then(r => setTaxes(r.data.tax_rates));
    api.get('/profile').then(r => {
      const p = r.data.profile || {};
      setTaxPlanner({
        sales_tax_rate: Number(p.sales_tax_rate || 0),
        import_duties_pct: Number(p.import_duties_pct || 0),
        vat_gst_rate: Number(p.vat_gst_rate || 0)
      });
    });
  }, [base]);

  const handleConvert = async () => {
    try {
      const res = await api.get(
        `/currency/convert?from=${converter.from}&to=${converter.to}&amount=${converter.amount}`
      );
      setConverted(res.data);
    } catch { toast.error('Conversion failed'); }
  };

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'JPY', 'CAD', 'AUD', 'INR', 'SGD'];
  const salesTaxAmount = Number(taxableRevenue || 0) * Number(taxPlanner.sales_tax_rate || 0);
  const vatGstAmount = Number(taxableRevenue || 0) * Number(taxPlanner.vat_gst_rate || 0);
  const importDutyAmount = Number(importValue || 0) * Number(taxPlanner.import_duties_pct || 0);
  const totalEstimatedTax = salesTaxAmount + vatGstAmount + importDutyAmount;

  const saveTaxPlanner = async () => {
    setSavingTax(true);
    try {
      await api.patch('/profile/tax-legal', {
        sales_tax_rate: Math.max(0, Math.min(1, parseFloat(taxPlanner.sales_tax_rate) || 0)),
        import_duties_pct: Math.max(0, Math.min(1, parseFloat(taxPlanner.import_duties_pct) || 0)),
        vat_gst_rate: Math.max(0, Math.min(1, parseFloat(taxPlanner.vat_gst_rate) || 0))
      });
      toast.success('Section 5 tax/legal settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save tax/legal settings');
    } finally {
      setSavingTax(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Currency & Tax</h1>
          <p className="page-subtitle">Exchange rates, currency conversion, and localized tax rates</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Section 5: Tax & Legal Planner</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.9rem' }}>
          Set your sales tax, import duties, and VAT/GST rates to estimate tax impact before launch.
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label">Sales Tax Rate (e.g. 0.07)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={taxPlanner.sales_tax_rate}
              onChange={e => setTaxPlanner(t => ({ ...t, sales_tax_rate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Import Duties % (e.g. 0.05)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={taxPlanner.import_duties_pct}
              onChange={e => setTaxPlanner(t => ({ ...t, import_duties_pct: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">VAT/GST Rate (e.g. 0.20)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="1"
              step="0.0001"
              value={taxPlanner.vat_gst_rate}
              onChange={e => setTaxPlanner(t => ({ ...t, vat_gst_rate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Monthly Taxable Revenue (estimate)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={taxableRevenue}
              onChange={e => setTaxableRevenue(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Monthly Import Value (estimate)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={importValue}
              onChange={e => setImportValue(e.target.value)}
            />
          </div>
        </div>
        <div className="grid-4" style={{ marginBottom: '0.9rem' }}>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Sales Tax</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>${salesTaxAmount.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>VAT/GST</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>${vatGstAmount.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Import Duties</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>${importDutyAmount.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Estimated Taxes</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>${totalEstimatedTax.toFixed(2)}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={saveTaxPlanner} disabled={savingTax}>
          {savingTax ? 'Saving...' : 'Save Section 5 Tax Setup'}
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Converter */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Currency Converter</h3>
          <div className="field">
            <label className="label">Amount</label>
            <input className="input" type="number" step="0.01" value={converter.amount}
              onChange={e => setConverter(c => ({ ...c, amount: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label">From</label>
              <select className="input" value={converter.from}
                onChange={e => setConverter(c => ({ ...c, from: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <ArrowRight size={20} color="#6366f1" style={{ marginTop: 20 }} />
            <div style={{ flex: 1 }}>
              <label className="label">To</label>
              <select className="input" value={converter.to}
                onChange={e => setConverter(c => ({ ...c, to: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleConvert}>Convert</button>
          {converted && (
            <div style={{ marginTop: '1rem', background: '#f0fdf4', borderRadius: 8, padding: '1rem', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065f46' }}>
                {converted.original_amount} {converted.from} = {converted.converted_amount} {converted.to}
              </p>
            </div>
          )}
        </div>

        {/* Live Rates */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Exchange Rates</h3>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label className="label" style={{ margin: 0 }}>Base:</label>
              <select className="input" style={{ width: 'auto' }} value={base} onChange={e => setBase(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {loading ? (
            <p style={{ color: '#64748b' }}>Loading rates...</p>
          ) : rates && (
            <>
              {rates.source === 'fallback' && (
                <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginBottom: '0.75rem' }}>
                  Using static reference rates. Add a CurrencyLayer API key for live rates.
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {Object.entries(rates.rates)
                  .filter(([code]) => code !== base)
                  .map(([code, rate]) => (
                    <div key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{code}</span>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{rate.toFixed(4)}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tax Rates */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>
          <Globe size={16} style={{ display: 'inline', marginRight: 6 }} />
          E-commerce Tax Rates by Region
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Region</th><th>Code</th><th>VAT/GST Rate</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {taxes.map(t => (
                <tr key={t.code}>
                  <td style={{ fontWeight: 600 }}>{t.region}</td>
                  <td><span className="badge badge-blue">{t.code}</span></td>
                  <td>
                    <span className={`badge ${t.vat_rate > 0.15 ? 'badge-red' : t.vat_rate > 0 ? 'badge-yellow' : 'badge-green'}`}>
                      {(t.vat_rate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
