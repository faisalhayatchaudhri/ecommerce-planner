import React, { useState } from 'react';
import { useCurrencyCtx } from '../../context/CurrencyContext';
import { Target, Info } from 'lucide-react';

export default function GoalCalculator() {
  const { symbol, fmtDec, fmt } = useCurrencyCtx();
  const [targetIncome, setTargetIncome] = useState(100000);
  const [netProfitPerSale, setNetProfitPerSale] = useState(500);
  const [conversionRate, setConversionRate] = useState(2);
  const [cpc, setCpc] = useState(25);

  const requiredOrders = netProfitPerSale > 0 ? Math.ceil(targetIncome / netProfitPerSale) : 0;
  const requiredVisitors = conversionRate > 0 ? Math.ceil(requiredOrders / (conversionRate / 100)) : 0;
  const requiredAdBudget = cpc > 0 ? requiredVisitors * cpc : 0;
  const dailyOrders = (requiredOrders / 30).toFixed(1);
  const dailyVisitors = Math.ceil(requiredVisitors / 30);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={26} color="#8b5cf6" /> Goal Planner
          </h1>
          <p className="page-subtitle">Work backward from your income target — how many orders, visitors, and ad budget do you need?</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '0.95rem' }}>Your Goals & Numbers</h3>

          {[
            {
              label: `Monthly Income Goal (${symbol})`,
              tip: 'How much net profit do you want to take home each month?',
              val: targetIncome, set: setTargetIncome
            },
            {
              label: `Net Profit Per Sale (${symbol})`,
              tip: 'Profit per order after all costs — use the Profit Per Order calculator to get this number.',
              val: netProfitPerSale, set: setNetProfitPerSale
            },
            {
              label: 'Store Conversion Rate (%)',
              tip: 'What % of visitors buy? E-commerce average is 1–3%. Beginners often see 0.5–1%.',
              val: conversionRate, set: setConversionRate, step: '0.1'
            },
            {
              label: `Cost Per Click / CPC (${symbol})`,
              tip: 'How much does each ad click cost? Check your Facebook/Google Ads manager.',
              val: cpc, set: setCpc
            },
          ].map((field, idx) => (
            <div className="field" key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <label className="label" style={{ margin: 0 }}>{field.label}</label>
                <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">{field.tip}</div></div>
              </div>
              <input type="number" className="input" value={field.val} min="0" step={field.step || '1'} onChange={e => field.set(Number(e.target.value))} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Monthly overview */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a78bfa', marginBottom: '0.35rem' }}>To Earn {fmtDec(targetIncome)} / month</div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c4b5fd' }}>{requiredOrders.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>orders / month</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8' }}>{requiredVisitors.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>visitors needed</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Breakdown</h3>
            {[
              { label: 'Monthly Income Goal', value: fmtDec(targetIncome), highlight: true },
              { label: 'Net Profit Per Sale', value: fmtDec(netProfitPerSale) },
              { label: 'Orders Required (monthly)', value: `${requiredOrders.toLocaleString()} orders`, bold: true },
              { label: 'Orders Required (daily)', value: `${dailyOrders} orders/day` },
              { label: 'Conversion Rate', value: `${conversionRate}%` },
              { label: 'Visitors Needed (monthly)', value: `${requiredVisitors.toLocaleString()} visitors`, bold: true },
              { label: 'Visitors Needed (daily)', value: `${dailyVisitors.toLocaleString()} visitors/day` },
              { label: 'Ad Budget Needed (monthly)', value: fmtDec(requiredAdBudget), warning: true },
            ].map((row, idx) => (
              <div key={idx} className="info-row">
                <span className="info-row-label">{row.label}</span>
                <span style={{ fontWeight: row.bold ? 800 : 600, color: row.highlight ? '#c4b5fd' : row.warning ? '#fbbf24' : '#f1f5f9' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Info size={15} color="#a78bfa" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#a78bfa' }}>Action Plan:</strong> Break it into daily goals. If you need {dailyOrders} orders/day, focus on getting {dailyVisitors} visitors/day through ads or organic posts. Track this every morning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
