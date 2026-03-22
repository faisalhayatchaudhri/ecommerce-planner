import React, { useState } from 'react';
import { useCurrencyCtx } from '../../context/CurrencyContext';
import { Package, Info } from 'lucide-react';

export default function CodCalculator() {
  const { symbol, fmtDec } = useCurrencyCtx();
  const [totalOrders, setTotalOrders] = useState(100);
  const [codPercentage, setCodPercentage] = useState(80);
  const [rtoRate, setRtoRate] = useState(15);
  const [grossProfitPerOrder, setGrossProfitPerOrder] = useState(400);
  const [forwardShipping, setForwardShipping] = useState(150);
  const [reverseShipping, setReverseShipping] = useState(100);

  const codOrders = totalOrders * (codPercentage / 100);
  const rtoCount = codOrders * (rtoRate / 100);
  const successfulDeliveries = totalOrders - rtoCount;
  const lostShippingCosts = rtoCount * (forwardShipping + reverseShipping);
  const grossProfit = successfulDeliveries * grossProfitPerOrder;
  const trueProfit = grossProfit - lostShippingCosts;
  const isPositive = trueProfit >= 0;
  const withoutRTO = totalOrders * grossProfitPerOrder;
  const profitLoss = trueProfit - withoutRTO;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={26} color="#06b6d4" /> COD & Returns Calculator
          </h1>
          <p className="page-subtitle">How failed deliveries eat into your real profit — and what to do about it</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '0.95rem' }}>Order & Shipping Details</h3>

          {[
            { label: 'Expected Total Orders per Month', tip: 'Total orders you expect to receive from all channels.', val: totalOrders, set: setTotalOrders, unit: 'orders' },
            { label: 'COD Rate (%)', tip: 'What % of your orders are Cash on Delivery? In Pakistan, this is typically 70–95%.', val: codPercentage, set: setCodPercentage, unit: '%' },
            { label: 'RTO Rate (%)', tip: 'Return to Origin — % of COD orders that are refused or undeliverable. Average in Pakistan is 15–30%.', val: rtoRate, set: setRtoRate, unit: '%' },
            { label: `Gross Profit Per Delivered Order (${symbol})`, tip: 'Your profit when an order is successfully delivered (before shipping costs).', val: grossProfitPerOrder, set: setGrossProfitPerOrder },
            { label: `Forward Shipping Cost (${symbol})`, tip: 'Courier fee to send the order to the customer.', val: forwardShipping, set: setForwardShipping },
            { label: `Reverse Shipping Cost (${symbol})`, tip: 'Courier fee to return the failed package back to you.', val: reverseShipping, set: setReverseShipping },
          ].map((field, idx) => (
            <div className="field" key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <label className="label" style={{ margin: 0 }}>{field.label}</label>
                <div className="tooltip-wrap"><div className="tooltip-icon">?</div><div className="tooltip-box">{field.tip}</div></div>
              </div>
              <input type="number" className="input" value={field.val} min="0" onChange={e => field.set(Number(e.target.value))} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={isPositive ? 'result-positive' : 'result-negative'}>
            <div className="result-label" style={{ color: isPositive ? '#34d399' : '#f87171' }}>True Net Profit After RTOs</div>
            <div className="result-value" style={{ color: isPositive ? '#34d399' : '#f87171' }}>{fmtDec(trueProfit)}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Without RTOs, you would have earned: <strong style={{ color: '#f1f5f9' }}>{fmtDec(withoutRTO)}</strong>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>Order Flow Analysis</h3>
            {[
              { label: 'Total Orders', value: `${totalOrders} orders` },
              { label: `COD Orders (${codPercentage}%)`, value: `${Math.round(codOrders)} orders` },
              { label: `RTO / Failed Deliveries (${rtoRate}% of COD)`, value: `${Math.round(rtoCount)} orders`, negative: true },
              { label: 'Successful Deliveries', value: `${Math.round(successfulDeliveries)} orders`, positive: true },
              { label: 'Gross Profit (successful)', value: fmtDec(grossProfit), positive: true },
              { label: 'Loss from RTO Shipping', value: `- ${fmtDec(lostShippingCosts)}`, negative: true },
              { label: 'Profit Impact from RTOs', value: fmtDec(profitLoss), negative: profitLoss < 0, positive: profitLoss >= 0 },
              { label: 'True Net Profit', value: fmtDec(trueProfit), result: true },
            ].map((row, idx) => (
              <div key={idx} className="info-row">
                <span className="info-row-label">{row.label}</span>
                <span style={{ fontWeight: 700, color: row.result ? (isPositive ? '#34d399' : '#f87171') : row.positive ? '#34d399' : row.negative ? '#f87171' : '#f1f5f9' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Info size={15} color="#22d3ee" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#22d3ee' }}>Reducing RTO Impact:</strong> Confirm orders by phone, use address verification, and start with prepaid orders for new areas. Dropping RTO from 25% to 15% can increase profits by 20–40%.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
