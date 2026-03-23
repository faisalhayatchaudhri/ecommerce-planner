import React, { useState, useEffect } from 'react';
import { useCurrencyCtx } from '../../context/CurrencyContext';
import { Tag, Info } from 'lucide-react';

export default function PricingTool() {
  const { symbol, currency, fmtDec } = useCurrencyCtx();
  useEffect(() => { document.title = 'Pricing Tool — EcomPlanner'; }, []);
  const [cogs, setCogs] = useState(500);
  const [packaging, setPackaging] = useState(50);
  const [shipping, setShipping] = useState(150);
  const [adCost, setAdCost] = useState(200);
  const [platformFeePct, setPlatformFeePct] = useState(5);
  const [targetMarginPct, setTargetMarginPct] = useState(30);

  // Formula: Price = TotalFixed / (1 - platformFee% - targetMargin%)
  const totalFixed = cogs + packaging + shipping + adCost;
  const denominator = 1 - (platformFeePct / 100) - (targetMarginPct / 100);
  const targetPrice = denominator > 0 ? totalFixed / denominator : 0;
  const platformFee = targetPrice * (platformFeePct / 100);
  const suggestedProfit = targetPrice - totalFixed - platformFee;
  const actualMargin = targetPrice > 0 ? ((suggestedProfit / targetPrice) * 100).toFixed(1) : 0;

  const isValid = denominator > 0;

  // Currency-aware rounding: USD/EUR/GBP → nearest $5; others (PKR, INR etc.) → nearest 50
  const roundStep = ['USD','EUR','GBP','CAD','AUD','SGD'].includes(currency) ? 5 : 50;
  const roundedPrice = Math.ceil(targetPrice / roundStep) * roundStep;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={26} color="#10b981" /> Pricing Tool
          </h1>
          <p className="page-subtitle">What should I charge? Work backward from your target profit margin.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '0.95rem' }}>Your Costs & Targets</h3>

          {[
            { label: `Product Cost / COGS (${symbol})`, tip: 'What you pay to buy or manufacture the product.', val: cogs, set: setCogs },
            { label: `Packaging (${symbol})`, tip: 'Box, bag, tissue paper, labels, etc.', val: packaging, set: setPackaging },
            { label: `Shipping / Delivery Cost (${symbol})`, tip: 'Courier charges to deliver the order.', val: shipping, set: setShipping },
            { label: `Ad Cost per Sale / CPA (${symbol})`, tip: 'How much you spend on ads to get one sale.', val: adCost, set: setAdCost },
          ].map((f, idx) => (
            <div className="field" key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <label className="label" style={{ margin: 0 }}>{f.label}</label>
                <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">{f.tip}</div></div>
              </div>
              <input type="number" className="input" value={f.val} min="0" onChange={e => f.set(Math.max(0, Number(e.target.value)))} />
            </div>
          ))}

          <div className="field">
            <label className="label">Platform / Marketplace Fee (%)</label>
            <input type="number" className="input" value={platformFeePct} min="0" max="50" onChange={e => setPlatformFeePct(Number(e.target.value))} />
          </div>

          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <label className="label" style={{ margin: 0 }}>Target Profit Margin (%)</label>
              <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">What % of the selling price should be pure profit? Beginners should aim for 25–40%.</div></div>
            </div>
            <input type="number" className="input" value={targetMarginPct} min="1" max="90" onChange={e => setTargetMarginPct(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isValid ? (
            <>
              <div className="result-positive">
                <div className="result-label" style={{ color: '#34d399' }}>Recommended Selling Price</div>
                <div className="result-value" style={{ color: '#34d399' }}>{fmtDec(targetPrice)}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6ee7b7' }}>
                  Round up to: <strong>{fmtDec(roundedPrice)}</strong> for a customer-friendly price
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Price Breakdown at {fmtDec(targetPrice)}</h3>
                {[
                  { label: 'Selling Price', value: fmtDec(targetPrice), income: true },
                  { label: 'Product Cost (COGS)', value: `- ${fmtDec(cogs)}`, negative: true },
                  { label: 'Packaging', value: `- ${fmtDec(packaging)}`, negative: true },
                  { label: 'Shipping', value: `- ${fmtDec(shipping)}`, negative: true },
                  { label: 'Ad Cost (CPA)', value: `- ${fmtDec(adCost)}`, negative: true },
                  { label: `Platform Fee (${platformFeePct}%)`, value: `- ${fmtDec(platformFee)}`, negative: true },
                  { label: 'Net Profit', value: fmtDec(suggestedProfit), result: true },
                  { label: 'Actual Margin', value: `${actualMargin}%`, margin: true },
                ].map((row, idx) => (
                  <div key={idx} className="info-row">
                    <span className="info-row-label">{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.income ? '#34d399' : row.negative ? '#64748b' : row.result ? '#34d399' : row.margin ? '#fbbf24' : '#f1f5f9' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="result-negative">
              <div className="result-label" style={{ color: '#f87171' }}>Invalid Configuration</div>
              <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Your target margin + platform fee exceeds 100%. Lower the target margin or platform fee.
              </div>
            </div>
          )}

          <div className="card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Info size={15} color="#34d399" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#34d399' }}>Competitive Tip:</strong> Search your competitors' prices on Daraz or Instagram. Your price should be within 10–20% of the market rate. If you charge too much more, customers will go elsewhere.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
