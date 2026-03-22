import React, { useState } from 'react';
import { useCurrencyCtx } from '../../context/CurrencyContext';
import { DollarSign, Info } from 'lucide-react';

function Field({ label, tip, children }) {
  return (
    <div className="field">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
        <label className="label" style={{ margin: 0 }}>{label}</label>
        {tip && (
          <div className="tooltip-wrap">
            <div className="tooltip-icon">?</div>
            <div className="tooltip-box">{tip}</div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

const ITEMS = [
  { key: 'stock',       label: 'Initial Stock Purchase',          tip: 'Cost to buy your first batch of inventory.' },
  { key: 'website',     label: 'Website / Store Setup',           tip: 'Shopify, domain, hosting, or web developer cost.' },
  { key: 'branding',    label: 'Branding, Logo & Packaging Design',tip: 'Designer fees for logo, brand kit, and box design.' },
  { key: 'photography', label: 'Product Photography',              tip: 'Cost to shoot professional product photos.' },
  { key: 'adsLaunch',   label: 'Ads Launch Budget',               tip: 'Initial ad spend before you have any organic traffic.' },
  { key: 'legal',       label: 'Legal / Business Registration',   tip: 'Company registration, NTN, or lawyer fees.' },
  { key: 'emergency',   label: 'Emergency Reserve (3 months)',     tip: 'Buffer for unexpected expenses — strongly recommended.' },
];

export default function StartupBudget() {
  const { symbol, fmt, fmtDec } = useCurrencyCtx();
  const [vals, setVals] = useState({ stock:50000, website:15000, branding:5000, photography:8000, adsLaunch:20000, legal:5000, emergency:15000 });
  const set = (k, v) => setVals(prev => ({ ...prev, [k]: Number(v) }));
  const total = Object.values(vals).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={26} color="#f59e0b" /> Startup Budget
          </h1>
          <p className="page-subtitle">Calculate the total capital needed to launch your e-commerce business</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '0.95rem' }}>One-Time Startup Costs ({symbol})</h3>
          {ITEMS.map(item => (
            <Field key={item.key} label={item.label} tip={item.tip}>
              <input type="number" className="input" min="0" value={vals[item.key]} onChange={e => set(item.key, e.target.value)} />
            </Field>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="result-neutral">
            <div className="result-label" style={{ color: '#818cf8' }}>Total Capital Needed</div>
            <div className="result-value" style={{ color: '#c7d2fe' }}>{fmtDec(total)}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem' }}>
              This is how much money you need to raise or have saved before starting.
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Cost Breakdown</h3>
            {ITEMS.map((item, idx) => {
              const pct = total > 0 ? ((vals[item.key] / total) * 100).toFixed(1) : 0;
              return (
                <div key={item.key} style={{ marginBottom: idx < ITEMS.length - 1 ? '0.85rem' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                    <span style={{ color: '#94a3b8' }}>{item.label}</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{fmtDec(vals[item.key])}</span>
                  </div>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Info size={15} color="#fbbf24" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#fbbf24' }}>Rule of thumb:</strong> Keep 20–25% of your total budget as an emergency reserve. Most beginners fail because they run out of cash, not because their product is bad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
