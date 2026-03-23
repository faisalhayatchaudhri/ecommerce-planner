import React, { useState, useEffect } from 'react';
import { useCurrencyCtx } from '../../context/CurrencyContext';
import { Zap, Info } from 'lucide-react';

export default function AdsCalculator() {
  const { symbol, fmtDec } = useCurrencyCtx();
  useEffect(() => { document.title = 'Ads Calculator — EcomPlanner'; }, []);
  const [adSpend, setAdSpend] = useState(50000);
  const [cpc, setCpc] = useState(25);
  const [conversionRate, setConversionRate] = useState(2);
  const [productMargin, setProductMargin] = useState(400);
  const guardPos = (v) => Math.max(0, Number(v));

  const clicks = cpc > 0 ? adSpend / cpc : 0;
  const orders = clicks * (conversionRate / 100);
  const cpa = orders > 0 ? adSpend / orders : 0;
  const totalProfit = orders * productMargin;
  const profitAfterAds = totalProfit - adSpend;
  const roas = adSpend > 0 ? totalProfit / adSpend : 0;
  const isPositive = profitAfterAds >= 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Zap size={26} color="#f59e0b" /> Ads Calculator
          </h1>
          <p className="page-subtitle">Will your ad budget make profit — or burn money?</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '0.95rem' }}>Advertising Inputs</h3>

          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <label className="label" style={{ margin: 0 }}>Monthly Ad Budget ({symbol})</label>
              <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">Total amount you spend on Facebook, Google, TikTok ads per month.</div></div>
            </div>
            <input type="number" className="input" value={adSpend} min="0" onChange={e => setAdSpend(Number(e.target.value))} />
          </div>

          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <label className="label" style={{ margin: 0 }}>Cost Per Click / CPC ({symbol})</label>
              <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">Average cost each time someone clicks your ad. Check your ad dashboard for this number.</div></div>
            </div>
            <input type="number" className="input" value={cpc} min="0" onChange={e => setCpc(Number(e.target.value))} />
          </div>

          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <label className="label" style={{ margin: 0 }}>Store Conversion Rate (%)</label>
              <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">What % of visitors actually buy? E-commerce average is 1–3%. Beginners often see 0.5–1%.</div></div>
            </div>
            <input type="number" className="input" value={conversionRate} min="0" max="100" step="0.1" onChange={e => setConversionRate(Number(e.target.value))} />
          </div>

          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <label className="label" style={{ margin: 0 }}>Gross Profit Per Sale ({symbol})</label>
              <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">Selling price minus product cost, packaging, and shipping — before ads. Use the Profit Per Order calculator to get this number.</div></div>
            </div>
            <input type="number" className="input" value={productMargin} min="0" onChange={e => setProductMargin(Number(e.target.value))} />
            <small style={{ color: '#64748b', marginTop: '0.3rem', display: 'block' }}>This is profit before subtracting ad cost</small>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={isPositive ? 'result-positive' : 'result-negative'}>
            <div className="result-label" style={{ color: isPositive ? '#34d399' : '#f87171' }}>Net Profit After Ads</div>
            <div className="result-value" style={{ color: isPositive ? '#34d399' : '#f87171' }}>{fmtDec(profitAfterAds)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: isPositive ? '#6ee7b7' : '#fca5a5' }}>
              {isPositive ? `✓ Profitable! Return on Ad Spend: ${roas.toFixed(2)}x` : `✗ Losing money. Lower your CPC or raise conversion rate.`}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Calculated Metrics</h3>
            {[
              { label: 'Total Clicks from Budget', value: `${Math.round(clicks).toLocaleString()} clicks`, mono: true },
              { label: 'Estimated Orders', value: `${Math.round(orders).toLocaleString()} orders`, mono: true },
              { label: 'Cost Per Acquisition (CPA)', value: fmtDec(cpa) },
              { label: 'Total Gross Profit (before ads)', value: fmtDec(totalProfit) },
              { label: 'Ad Spend', value: `- ${fmtDec(adSpend)}`, negative: true },
              { label: 'ROAS (Return on Ad Spend)', value: `${roas.toFixed(2)}x`, highlight: true },
              { label: 'Net Profit After Ads', value: fmtDec(profitAfterAds), result: true },
            ].map((row, idx) => (
              <div key={idx} className="info-row">
                <span className="info-row-label">{row.label}</span>
                <span style={{ fontWeight: 700, color: row.result ? (isPositive ? '#34d399' : '#f87171') : row.negative ? '#f87171' : row.highlight ? '#fbbf24' : '#f1f5f9', fontFamily: row.mono ? 'monospace' : 'inherit' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Info size={15} color="#fbbf24" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#fbbf24' }}>ROAS Target:</strong> Aim for ROAS above 3x to be safely profitable. A ROAS of 1x means you break even. Below 1x — you are losing money on every order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
