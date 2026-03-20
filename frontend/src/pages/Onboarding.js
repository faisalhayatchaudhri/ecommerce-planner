import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = [
  { value: 'dropshipping', label: 'Dropshipping' },
  { value: 'direct_sales', label: 'Direct Sales' },
  { value: 'subscription', label: 'Subscription-Based' },
  { value: 'marketplace', label: 'Marketplace Seller' },
  { value: 'other', label: 'Other' }
];

const COUNTRY_CURRENCY_MAP = {
  'United States': 'USD',
  Canada: 'CAD',
  'United Kingdom': 'GBP',
  Germany: 'EUR',
  France: 'EUR',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  India: 'INR',
  Japan: 'JPY',
  Singapore: 'SGD',
  Australia: 'AUD'
};

const COUNTRIES = Object.keys(COUNTRY_CURRENCY_MAP);
const CURRENCIES = Array.from(new Set(Object.values(COUNTRY_CURRENCY_MAP)));

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    business_name: '', business_type: 'direct_sales', target_market: '',
    country: 'United States', currency: 'USD', payment_methods: [], monthly_traffic_estimate: '',
    tax_region: '', tax_rate: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const selectedCountryCurrency = useMemo(() => COUNTRY_CURRENCY_MAP[form.country] || 'USD', [form.country]);

  const togglePayment = (method) => {
    setForm(f => ({
      ...f,
      payment_methods: f.payment_methods.includes(method)
        ? f.payment_methods.filter(m => m !== method)
        : [...f.payment_methods, method]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/profile', {
        ...form,
        monthly_traffic_estimate: parseInt(form.monthly_traffic_estimate) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0
      });
      toast.success('Business profile saved!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? '#6366f1' : '#e2e8f0'
            }} />
          ))}
        </div>

        <div className="card">
          {step === 1 && (
            <>
              <h2 className="modal-title">Business Details</h2>
              <div className="field">
                <label className="label">Business Name</label>
                <input className="input" placeholder="My Store" value={form.business_name}
                  onChange={e => set('business_name', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Business Type</label>
                <select className="input" value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                  {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Country</label>
                <select
                  className="input"
                  value={form.country}
                  onChange={e => {
                    const country = e.target.value;
                    setForm(f => ({ ...f, country, currency: COUNTRY_CURRENCY_MAP[country] || f.currency }));
                  }}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Target Market</label>
                <input className="input" placeholder="e.g. USA, Europe, Global" value={form.target_market}
                  onChange={e => set('target_market', e.target.value)} />
              </div>
              <button className="btn-primary" onClick={() => setStep(2)} disabled={!form.business_name}>
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="modal-title">Currency & Payment</h2>
              <div className="field">
                <label className="label">Primary Currency</label>
                <select className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                  Auto-selected from country ({form.country} {'->'} {selectedCountryCurrency}).
                </p>
              </div>
              <div className="field">
                <label className="label">Estimated Monthly Traffic</label>
                <input className="input" type="number" min="0" placeholder="e.g. 5000"
                  value={form.monthly_traffic_estimate} onChange={e => set('monthly_traffic_estimate', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Payment Methods</label>
                {['PayPal', 'Stripe', 'Credit Card', 'Bank Transfer', 'Crypto'].map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={form.payment_methods.includes(m)} onChange={() => togglePayment(m)} />
                    {m}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" onClick={() => setStep(3)}>Next</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="modal-title">Tax & Region</h2>
              <div className="field">
                <label className="label">Tax Region</label>
                <input className="input" placeholder="e.g. United States, EU, UAE"
                  value={form.tax_region} onChange={e => set('tax_region', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Tax Rate (decimal, e.g. 0.05 for 5%)</label>
                <input className="input" type="number" step="0.01" min="0" max="1"
                  placeholder="0.05" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
