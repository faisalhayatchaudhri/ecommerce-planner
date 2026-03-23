import React, { useState, useEffect } from 'react';
import { useCurrencyCtx } from '../../context/CurrencyContext';
import { ShoppingCart, Info } from 'lucide-react';

function Tip({ text }) {
  return (
    <div className="tooltip-wrap">
      <div className="tooltip-icon">?</div>
      <div className="tooltip-box">{text}</div>
    </div>
  );
}

function Field({ label, tip, children }) {
  return (
    <div className="field">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
        <label className="label" style={{ margin: 0 }}>{label}</label>
        {tip && <Tip text={tip} />}
      </div>
      {children}
    </div>
  );
}

export default function ProfitPerOrder() {
  const { symbol, fmtDec } = useCurrencyCtx();
  useEffect(() => { document.title = 'Profit Per Order — EcomPlanner'; }, []);
  const [price, setPrice] = useState(1000);
  const [cogs, setCogs] = useState(300);
  const [packaging, setPackaging] = useState(50);
  const [shipping, setShipping] = useState(150);
  const [codFeePct, setCodFeePct] = useState(3);
  const [platformFeePct, setPlatformFeePct] = useState(5);
  const [adCost, setAdCost] = useState(200);
  const [taxPct, setTaxPct] = useState(0);

  const platformFee = price * (platformFeePct / 100);
  const codFee = price * (codFeePct / 100);
  const tax = price * (taxPct / 100);
  const totalCost = cogs + packaging + shipping + platformFee + codFee + adCost + tax;
  const netProfit = price - totalCost;
  const marginStr = price > 0 ? ((netProfit / price) * 100).toFixed(1) : '0';
  const isPositive = netProfit >= 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={26} color="#6366f1" /> Profit Per Order
          </h1>
          <p className="page-subtitle">If I sell 1 product — how much do I actually pocket?</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Inputs */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '0.95rem' }}>Your Costs & Fees</h3>
          <div className="grid-2">
            <Field label={`Selling Price (${symbol})`} tip="The price the customer pays for your product.">
              <input type="number" className="input" value={price} min="0" onChange={e => setPrice(Math.max(0, Number(e.target.value)))} />
            </Field>
            <Field label={`Product Cost (${symbol})`} tip="How much you pay to manufacture or buy the product.">
              <input type="number" className="input" value={cogs} min="0" onChange={e => setCogs(Math.max(0, Number(e.target.value)))} />
            </Field>
            <Field label={`Packaging (${symbol})`} tip="Boxes, bags, tape, tissue paper etc. per order.">
              <input type="number" className="input" value={packaging} min="0" onChange={e => setPackaging(Math.max(0, Number(e.target.value)))} />
            </Field>
            <Field label={`Shipping / Delivery (${symbol})`} tip="Courier charges to deliver the order.">
              <input type="number" className="input" value={shipping} min="0" onChange={e => setShipping(Math.max(0, Number(e.target.value)))} />
            </Field>
            <Field label="COD / Payment Fee (%)" tip="Cash on delivery fee or payment gateway fee, as % of selling price.">
              <input type="number" className="input" value={codFeePct} min="0" max="100" onChange={e => setCodFeePct(Number(e.target.value))} />
              <small style={{ color: '#64748b', marginTop: '0.3rem', display: 'block' }}>= {fmtDec(codFee)}</small>
            </Field>
            <Field label="Marketplace / Platform Fee (%)" tip="Daraz, Shopify, or other platform commission on each sale.">
              <input type="number" className="input" value={platformFeePct} min="0" max="100" onChange={e => setPlatformFeePct(Number(e.target.value))} />
              <small style={{ color: '#64748b', marginTop: '0.3rem', display: 'block' }}>= {fmtDec(platformFee)}</small>
            </Field>
            <Field label={`Ad Cost Per Order (${symbol})`} tip="How much did you spend on ads to get this 1 sale? (Total ads budget ÷ orders)">
              <input type="number" className="input" value={adCost} min="0" onChange={e => setAdCost(Number(e.target.value))} />
            </Field>
            <Field label="Tax (%)" tip="Sales or income tax applied on each order.">
              <input type="number" className="input" value={taxPct} min="0" max="100" onChange={e => setTaxPct(Number(e.target.value))} />
              <small style={{ color: '#64748b', marginTop: '0.3rem', display: 'block' }}>= {fmtDec(tax)}</small>
            </Field>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={isPositive ? 'result-positive' : 'result-negative'}>
            <div className="result-label" style={{ color: isPositive ? '#34d399' : '#f87171' }}>Net Profit Per Order</div>
            <div className="result-value" style={{ color: isPositive ? '#34d399' : '#f87171' }}>{fmtDec(netProfit)}</div>
            <div style={{ fontSize: '0.875rem', color: isPositive ? '#6ee7b7' : '#fca5a5', marginTop: '0.3rem' }}>
              {marginStr}% profit margin
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: isPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {isPositive ? '✓ Your product is profitable at this price.' : '✗ You are losing money on each sale. Reduce costs or raise price.'}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Cost Breakdown</h3>
            {[
              { label: 'Selling Price', value: price, isIncome: true },
              { label: 'Product Cost (COGS)', value: cogs },
              { label: 'Packaging', value: packaging },
              { label: 'Shipping', value: shipping },
              { label: `COD / Payment Fee (${codFeePct}%)`, value: codFee },
              { label: `Platform Fee (${platformFeePct}%)`, value: platformFee },
              { label: 'Ad Cost (CPA)', value: adCost },
              { label: `Tax (${taxPct}%)`, value: tax },
              { label: 'Total Costs', value: totalCost, isTotal: true },
            ].map((row, idx) => (
              <div key={idx} className="info-row">
                <span className="info-row-label">{row.label}</span>
                <span className="info-row-value" style={{ color: row.isIncome ? '#34d399' : row.isTotal ? '#f87171' : '#f1f5f9' }}>
                  {row.isIncome ? '+' : row.isTotal ? '' : '− '}{fmtDec(row.value)}
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={15} color="#818cf8" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#c7d2fe' }}>Tip:</strong> Try to keep all costs below 60–65% of your selling price to maintain a healthy margin above 35%. Use the Pricing Tool to calculate an ideal price.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
