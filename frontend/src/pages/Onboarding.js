import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = [
  { value: 'dropshipping', label: '📦 Dropshipping',           desc: 'Sell without holding stock' },
  { value: 'direct_sales', label: '🏪 Direct Sales',           desc: 'Buy stock & sell it yourself' },
  { value: 'subscription',  label: '🔄 Subscription-Based',    desc: 'Recurring billing model' },
  { value: 'marketplace',  label: '🛒 Marketplace Seller',     desc: 'Sell on Daraz, Amazon, etc.' },
  { value: 'other',         label: '⚡ Other',                 desc: 'Something else entirely' },
];

const COUNTRY_CURRENCY_MAP = {
  'United States': 'USD',  'Canada': 'CAD',            'United Kingdom': 'GBP',
  'Germany': 'EUR',         'France': 'EUR',            'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',    'India': 'INR',             'Pakistan': 'PKR',
  'Japan': 'JPY',           'Singapore': 'SGD',         'Australia': 'AUD',
  'Malaysia': 'MYR',        'Bangladesh': 'BDT',        'Turkey': 'TRY',
  'Nigeria': 'NGN',         'Kenya': 'KES',             'South Africa': 'ZAR',
};

const COUNTRIES  = Object.keys(COUNTRY_CURRENCY_MAP).sort();
const CURRENCIES = Array.from(new Set(Object.values(COUNTRY_CURRENCY_MAP)));

const STEPS = [
  { label: 'Business',     icon: '🏢' },
  { label: 'Currency',     icon: '💰' },
  { label: 'Tax & Region', icon: '📋' },
];

function StepProgress({ current, total }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: '0.6rem' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: i < current ? '#10b981' : i === current - 1 ? '#6366f1' : '#1e293b', transition: 'background 0.3s' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569' }}>
        <span>Step {current} of {total}</span>
        <span>
          {STEPS[current - 1]?.icon} {STEPS[current - 1]?.label}
        </span>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    business_name: '', business_type: 'direct_sales', target_market: '',
    country: 'United States', currency: 'USD',
    payment_methods: [], monthly_traffic_estimate: '',
    tax_region: '', tax_rate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Setup Your Business — EcomPlanner'; }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const selectedCountryCurrency = useMemo(
    () => COUNTRY_CURRENCY_MAP[form.country] || 'USD',
    [form.country]
  );

  const togglePayment = (method) => {
    setForm(f => ({
      ...f,
      payment_methods: f.payment_methods.includes(method)
        ? f.payment_methods.filter(m => m !== method)
        : [...f.payment_methods, method],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/profile', {
        ...form,
        monthly_traffic_estimate: parseInt(form.monthly_traffic_estimate) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
      });
      toast.success('Business profile saved! Let\'s go! 🚀');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipToEnd = async () => {
    if (!form.business_name.trim()) {
      toast.error('Please enter your business name first.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/profile', {
        business_name: form.business_name || 'My Store',
        business_type: form.business_type,
        country: form.country,
        currency: form.currency,
        monthly_traffic_estimate: 0,
        tax_rate: 0,
        payment_methods: [],
      });
      toast.success('Profile saved with defaults — you can update settings anytime.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9' }}>
            ⚡ EcomPlanner
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
            Tell us about your business so we can personalise your experience
          </p>
        </div>

        <StepProgress current={step} total={STEPS.length} />

        <div className="card">

          {/* ── STEP 1: Business Details ── */}
          {step === 1 && (
            <>
              <h2 className="modal-title">Your Business</h2>

              <div className="field">
                <label className="label" htmlFor="ob-business-name">Business Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  id="ob-business-name"
                  className="input"
                  placeholder="e.g. My Awesome Store"
                  value={form.business_name}
                  onChange={e => set('business_name', e.target.value)}
                  autoFocus
                />
                {!form.business_name && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    You can change this anytime.
                  </span>
                )}
              </div>

              <div className="field">
                <label className="label">Business Type <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {BUSINESS_TYPES.map(t => (
                    <label key={t.value} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.65rem 0.8rem',
                      borderRadius: 10, border: `1.5px solid ${form.business_type === t.value ? '#6366f1' : '#1e293b'}`,
                      cursor: 'pointer', background: form.business_type === t.value ? 'rgba(99,102,241,0.08)' : 'transparent',
                      transition: 'all 0.15s',
                    }}>
                      <input
                        type="radio"
                        name="business_type"
                        value={t.value}
                        checked={form.business_type === t.value}
                        onChange={() => set('business_type', t.value)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: form.business_type === t.value ? '#c7d2fe' : '#cbd5e1' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>{t.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="ob-country">Country <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  id="ob-country"
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
                <label className="label" htmlFor="ob-target-market">
                  Target Market <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem' }}>(optional)</span>
                </label>
                <input
                  id="ob-target-market"
                  className="input"
                  placeholder="e.g. Pakistan, USA, Global"
                  value={form.target_market}
                  onChange={e => set('target_market', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!form.business_name.trim()}
                  style={{ flex: 1 }}
                >
                  Next: Currency & Payment →
                </button>
                <button
                  className="btn-secondary"
                  onClick={skipToEnd}
                  disabled={loading || !form.business_name.trim()}
                  title="Skip optional steps and go to dashboard"
                >
                  Skip
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Currency & Payment ── */}
          {step === 2 && (
            <>
              <h2 className="modal-title">Currency & Payment</h2>

              <div className="field">
                <label className="label" htmlFor="ob-currency">Primary Currency</label>
                <select id="ob-currency" className="input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                  Auto-selected from your country ({form.country} → {selectedCountryCurrency}). Change if needed.
                </p>
              </div>

              <div className="field">
                <label className="label" htmlFor="ob-traffic">
                  Estimated Monthly Visitors
                  <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', marginLeft: 6 }}>(optional)</span>
                </label>
                <input
                  id="ob-traffic"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="e.g. 5000 — leave blank if unsure"
                  value={form.monthly_traffic_estimate}
                  onChange={e => set('monthly_traffic_estimate', e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  Used for calculating conversion rates on your dashboard.
                </p>
              </div>

              <div className="field">
                <label className="label">
                  Payment Methods
                  <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', marginLeft: 6 }}>(optional)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['PayPal', 'Stripe', 'Credit Card', 'Bank Transfer', 'Cash on Delivery', 'Crypto'].map(m => (
                    <label key={m} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.75rem',
                      borderRadius: 8, border: `1.5px solid ${form.payment_methods.includes(m) ? '#6366f1' : '#1e293b'}`,
                      cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                      background: form.payment_methods.includes(m) ? 'rgba(99,102,241,0.08)' : 'transparent',
                      color: form.payment_methods.includes(m) ? '#c7d2fe' : '#94a3b8',
                      transition: 'all 0.15s',
                    }}>
                      <input type="checkbox" style={{ display: 'none' }} checked={form.payment_methods.includes(m)} onChange={() => togglePayment(m)} />
                      {form.payment_methods.includes(m) ? '✓ ' : ''}{m}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 1 }}>
                  Next: Tax Settings →
                </button>
                <button className="btn-secondary" onClick={skipToEnd} disabled={loading} title="Save and skip to dashboard">Skip</button>
              </div>
            </>
          )}

          {/* ── STEP 3: Tax & Region ── */}
          {step === 3 && (
            <>
              <h2 className="modal-title">Tax & Region</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                These settings affect margin calculations. You can update them anytime in <strong style={{ color: '#94a3b8' }}>Currency & Tax</strong> settings.
              </p>

              <div className="field">
                <label className="label" htmlFor="ob-tax-region">
                  Tax Region
                  <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', marginLeft: 6 }}>(optional)</span>
                </label>
                <input
                  id="ob-tax-region"
                  className="input"
                  placeholder="e.g. United States, EU, UAE, Pakistan"
                  value={form.tax_region}
                  onChange={e => set('tax_region', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="ob-tax-rate">
                  Tax / VAT Rate (%)
                  <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', marginLeft: 6 }}>(optional)</span>
                </label>
                <input
                  id="ob-tax-rate"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 17 for 17% GST — leave blank if not applicable"
                  value={form.tax_rate}
                  onChange={e => set('tax_rate', e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  Enter as a percentage, e.g. <strong>17</strong> for 17%. Not sure? Leave blank — you can set it later.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ flex: 1 }}
                  id="onboarding-complete"
                >
                  {loading ? 'Saving…' : '🚀 Complete Setup'}
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#334155' }}>
          All fields marked optional can be changed later in Settings.
        </p>
      </div>
    </div>
  );
}
