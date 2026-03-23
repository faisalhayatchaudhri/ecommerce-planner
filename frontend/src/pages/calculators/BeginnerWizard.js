import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { MARKETS } from '../../data/marketPresets';
import { INDUSTRIES } from '../../data/industryPresets';
import { CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Info, AlertTriangle, TrendingUp, DollarSign, Package, Target } from 'lucide-react';

/* ─────────────────────────────────────────────
   STEP PROGRESS BAR
───────────────────────────────────────────── */
function StepBar({ current, total, labels }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', margin: '0 auto 0.3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700,
              background: i < current ? '#10b981' : i === current ? '#6366f1' : '#1e293b',
              color: i <= current ? '#fff' : '#475569',
              border: i === current ? '2px solid #818cf8' : '2px solid transparent',
              boxShadow: i === current ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
              transition: 'all 0.3s',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: '0.65rem', color: i === current ? '#c7d2fe' : '#475569', fontWeight: i === current ? 700 : 400 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 3, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((current) / (total - 1)) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOOLTIP HELPER
───────────────────────────────────────────── */
function Tip({ text }) {
  return (
    <div className="tooltip-wrap" style={{ display: 'inline-flex' }}>
      <div className="tooltip-icon">?</div>
      <div className="tooltip-box">{text}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SMART FIELD  (input + "Use typical" button)
───────────────────────────────────────────── */
function SmartField({ label, tip, value, onChange, recommended, suffix, prefix, type = 'number', min = 0 }) {
  return (
    <div className="field">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
        <label className="label" style={{ margin: 0 }}>{label}</label>
        {tip && <Tip text={tip} />}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {prefix && <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.85rem', pointerEvents: 'none' }}>{prefix}</span>}
          <input
            type={type}
            className="input"
            value={value}
            min={min}
            onChange={e => onChange(Number(e.target.value))}
            style={{ paddingLeft: prefix ? '2rem' : undefined }}
          />
        </div>
        {recommended !== undefined && (
          <button
            type="button"
            onClick={() => onChange(recommended)}
            title={`Use typical value: ${recommended}`}
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#818cf8', fontSize: '0.72rem', fontWeight: 600, padding: '0 0.6rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
          >
            Use typical
          </button>
        )}
      </div>
      {recommended !== undefined && (
        <div style={{ fontSize: '0.71rem', color: '#475569', marginTop: '0.3rem' }}>
          💡 Typical for this market/industry: <strong style={{ color: '#64748b' }}>{prefix || ''}{Number(recommended).toLocaleString()}{suffix || ''}</strong>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RECOMMENDATION ENGINE
───────────────────────────────────────────── */
function calcRecommendation({ price, cogs, packaging, shipping, adCost, platformFeePct, codFeePct, taxPct, orders, market, industry }) {
  const M = MARKETS[market] || MARKETS.PK;
  const platformFee = price * (platformFeePct / 100);
  const codFee = price * (codFeePct / 100);
  const tax = price * (taxPct / 100);
  const totalCostPerOrder = cogs + packaging + shipping + adCost + platformFee + codFee + tax;
  const profitPerOrder = price - totalCostPerOrder;
  const marginPct = price > 0 ? (profitPerOrder / price) * 100 : 0;

  // Monthly with RTO accounted
  const codOrders = orders * (M.codPct / 100);
  const rtoOrders = codOrders * (M.rtoPct / 100);
  const successOrders = orders - rtoOrders;
  const rtoShippingLoss = rtoOrders * (M.forwardShipping + M.reverseShipping);
  const monthlyProfit = successOrders * profitPerOrder - rtoShippingLoss;

  // Break-even
  const fixedEstimate = 10000; // rough monthly fixed (platform sub, hosting)
  const breakEvenOrders = profitPerOrder > 0 ? Math.ceil(fixedEstimate / profitPerOrder) : null;

  // Startup budget
  const stock = cogs * 200; // 200 units starter stock
  const startupBudget = stock + (stock * 0.1) + 5000 + (adCost * 3); // stock + extras + website + 3mo ads

  // Verdict
  let verdict, verdictColor, verdictIcon;
  if (marginPct >= 25 && monthlyProfit > 0) {
    verdict = 'Looks Profitable ✓';
    verdictColor = '#10b981';
    verdictIcon = '🚀';
  } else if (marginPct >= 10 && monthlyProfit >= 0) {
    verdict = 'Proceed with Caution ⚠';
    verdictColor = '#f59e0b';
    verdictIcon = '⚠️';
  } else {
    verdict = 'High Risk — Review Numbers';
    verdictColor = '#ef4444';
    verdictIcon = '🛑';
  }

  // Risks
  const risks = [];
  if (marginPct < 20) risks.push('Very thin margin — one bad month erases all profit');
  if (rtoOrders / orders > 0.15) risks.push('High RTO rate from your market will eat into profit significantly');
  if (adCost / price > 0.3) risks.push('Ad cost is more than 30% of selling price — too high');
  if (cogs / price > 0.6) risks.push('COGS is more than 60% of price — margin is dangerously thin');
  if (monthlyProfit < 0) risks.push('At expected order volume, you are losing money every month');
  const industryRisks = (INDUSTRIES[industry]?.risks || []);
  industryRisks.forEach(r => risks.push(r));

  return {
    profitPerOrder, marginPct, monthlyProfit,
    breakEvenOrders, startupBudget, successOrders,
    verdict, verdictColor, verdictIcon,
    risks: [...new Set(risks)].slice(0, 4),
    totalCostPerOrder, rtoOrders,
  };
}

/* ─────────────────────────────────────────────
   MAIN WIZARD
───────────────────────────────────────────── */
const STEP_LABELS = ['Market', 'Industry', 'Product', 'Costs', 'Report'];

export default function BeginnerWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Selections
  const [marketKey, setMarketKey] = useState('');
  const [industryKey, setIndustryKey] = useState('');

  // Core numbers
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState(1500);
  const [orders, setOrders] = useState(100);
  const [cogs, setCogs] = useState(0);
  const [packaging, setPackaging] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [adBudget, setAdBudget] = useState(0);
  const [codFeePct, setCodFeePct] = useState(3);
  const [platformFeePct, setPlatformFeePct] = useState(3);
  const [taxPct, setTaxPct] = useState(0);

  const M = marketKey ? MARKETS[marketKey] : null;
  const IND = industryKey ? INDUSTRIES[industryKey] : null;

  // Smart recommendations
  const recCogs      = IND && price ? Math.round(price * IND.cogsMultiplier) : undefined;
  const recPackaging = IND && price ? Math.round(price * IND.packagingMultiplier) : undefined;
  const recShipping  = M?.forwardShipping;
  const recAdBudget  = IND && price && orders ? Math.round(price * orders * IND.adSpendMultiplier) : undefined;
  const recCodFee    = M ? M.platformFee : undefined;
  const recPlatform  = M ? M.platformFee : undefined;
  const recTax       = M ? M.taxPct : undefined;
  const adCostPerOrder = orders > 0 ? adBudget / orders : 0;

  const rec = useMemo(() => {
    if (!M || !IND) return null;
    return calcRecommendation({
      price, cogs, packaging, shipping,
      adCost: adCostPerOrder, platformFeePct, codFeePct, taxPct,
      orders, market: marketKey, industry: industryKey,
    });
  }, [price, cogs, packaging, shipping, adCostPerOrder, platformFeePct, codFeePct, taxPct, orders, marketKey, industryKey, M, IND]);

  // Prefill when market/industry are selected
  const applyMarket = (key) => {
    setMarketKey(key);
    const m = MARKETS[key];
    setShipping(m.forwardShipping);
    setCodFeePct(m.platformFee);
    setPlatformFeePct(m.platformFee);
    setTaxPct(m.taxPct);
  };

  const applyIndustry = (key) => {
    setIndustryKey(key);
    if (price && INDUSTRIES[key]) {
      const ind = INDUSTRIES[key];
      setCogs(Math.round(price * ind.cogsMultiplier));
      setPackaging(Math.round(price * ind.packagingMultiplier));
      if (M) setAdBudget(Math.round(price * orders * ind.adSpendMultiplier));
    }
  };

  const handleSave = async () => {
    if (!productName || !M) return;
    setSaving(true);
    try {
      await api.post('/profile', {
        business_name: productName + ' Store',
        business_type: 'dropshipping',
        country: M.name,
        currency: M.currency,
        planned_products_count: 1,
        planned_asp: price,
        planned_cogs: cogs,
      });
      await api.post('/products', {
        name: productName,
        category: IND?.name || 'Other',
        selling_price: price,
        cogs: cogs,
        shipping_cost_local: shipping,
        platform_fee_pct: platformFeePct / 100,
      });
      toast.success('Business plan saved!');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Could not save — you can still use all the calculators');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => {
    const s = M?.symbol || '$';
    return `${s}${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 0));

  /* ── STEP 0: Market ── */
  const Step0 = (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.4rem', color: '#f1f5f9' }}>Where are you selling?</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        This sets your currency, typical shipping costs, COD rates, and tax defaults automatically.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {Object.entries(MARKETS).map(([key, m]) => (
          <button
            key={key}
            type="button"
            onClick={() => { applyMarket(key); next(); }}
            style={{
              background: marketKey === key ? 'rgba(99,102,241,0.15)' : '#0f172a',
              border: `2px solid ${marketKey === key ? '#6366f1' : '#1e293b'}`,
              borderRadius: 14, padding: '1.1rem', cursor: 'pointer',
              transition: 'all 0.18s', textAlign: 'left',
              boxShadow: marketKey === key ? '0 0 18px rgba(99,102,241,0.3)' : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            onMouseLeave={e => { if (marketKey !== key) { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = '#0f172a'; } }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{m.flag}</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>{m.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>{m.currency} · {m.symbol}</div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.4rem', lineHeight: 1.4 }}>{m.note}</div>
          </button>
        ))}
      </div>
    </div>
  );

  /* ── STEP 1: Industry ── */
  const Step1 = (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.4rem', color: '#f1f5f9' }}>What are you selling?</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Your category sets realistic COGS, margin, packaging, and ad spend defaults so you don't have to guess.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {Object.entries(INDUSTRIES).map(([key, ind]) => (
          <button
            key={key}
            type="button"
            onClick={() => { applyIndustry(key); next(); }}
            style={{
              background: industryKey === key ? 'rgba(99,102,241,0.15)' : '#0f172a',
              border: `2px solid ${industryKey === key ? '#6366f1' : '#1e293b'}`,
              borderRadius: 14, padding: '1.1rem', cursor: 'pointer',
              transition: 'all 0.18s', textAlign: 'left',
              boxShadow: industryKey === key ? '0 0 18px rgba(99,102,241,0.3)' : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            onMouseLeave={e => { if (industryKey !== key) { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = '#0f172a'; } }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{ind.icon}</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.88rem' }}>{ind.name}</div>
            <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>{ind.desc}</div>
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem' }}>
              <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>~{ind.typicalMargin}% margin</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  /* ── STEP 2: Product ── */
  const Step2 = (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.4rem', color: '#f1f5f9' }}>Your product</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        We've pre-filled industry-typical values based on your category and market. Adjust anything you already know.
      </p>
      {IND && (
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#6ee7b7' }}>
          💡 {IND.adConversionNote}
        </div>
      )}
      <div className="grid-2">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="label">Product Name</label>
          <input type="text" className="input" placeholder="e.g. Premium Leather Wallet" value={productName} onChange={e => setProductName(e.target.value)} />
        </div>
        <SmartField label={`Selling Price (${M?.symbol || '$'})`} tip="The price the customer sees and pays for your product."
          value={price} onChange={setPrice} prefix={M?.symbol} />
        <SmartField label="Expected Orders per Month" tip="How many units do you realistically expect to sell in your first month?"
          value={orders} onChange={setOrders} recommended={50} />
        <SmartField label={`Product Cost / COGS (${M?.symbol || '$'})`}
          tip="What you pay to buy or manufacture the product. COGS = Cost of Goods Sold."
          value={cogs} onChange={setCogs} recommended={recCogs} prefix={M?.symbol} />
        <SmartField label={`Packaging (${M?.symbol || '$'})`}
          tip="Bags, boxes, tissue paper, labels, tape per order."
          value={packaging} onChange={setPackaging} recommended={recPackaging} prefix={M?.symbol} />
      </div>
    </div>
  );

  /* ── STEP 3: Costs ── */
  const Step3 = (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.4rem', color: '#f1f5f9' }}>Costs & advertising</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Markets defaults are pre-filled. Use the "Use typical" button if you're not sure about a value.
      </p>
      <div className="grid-2">
        <SmartField label={`Delivery / Shipping (${M?.symbol || '$'})`}
          tip="Courier fee to send 1 order to your customer."
          value={shipping} onChange={setShipping} recommended={recShipping} prefix={M?.symbol} />
        <SmartField label={`Monthly Ad Budget (${M?.symbol || '$'})`}
          tip="Total you'll spend on Facebook, TikTok, or Google ads per month."
          value={adBudget} onChange={setAdBudget} recommended={recAdBudget} prefix={M?.symbol} />
        <SmartField label="Platform / Marketplace Fee (%)"
          tip="Commission Daraz, Shopify, or other platforms charge. Usually 3–8%."
          value={platformFeePct} onChange={setPlatformFeePct} recommended={recPlatform} suffix="%" />
        <SmartField label="COD / Payment Fee (%)"
          tip="Cash on delivery surcharge or payment gateway fee per order."
          value={codFeePct} onChange={setCodFeePct} recommended={recCodFee} suffix="%" />
        <SmartField label="Tax Rate (%)"
          tip="Sales tax, GST, or VAT applicable in your market."
          value={taxPct} onChange={setTaxPct} recommended={recTax} suffix="%" />
        <div className="field">
          <label className="label">Ad Cost per Sale (auto-calculated)</label>
          <div className="input" style={{ background: '#0f172a', color: '#818cf8', cursor: 'default' }}>
            {fmt(adCostPerOrder)} per order
          </div>
          <div style={{ fontSize: '0.71rem', color: '#475569', marginTop: '0.3rem' }}>
            = Monthly Budget ÷ Expected Orders
          </div>
        </div>
      </div>
    </div>
  );

  /* ── STEP 4: Recommendation Report ── */
  const Step4 = rec ? (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.4rem', color: '#f1f5f9' }}>Your Business Plan Summary</h2>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Based on what you've entered — here's an honest assessment of your business.
      </p>

      {/* Verdict */}
      <div style={{
        borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem', textAlign: 'center',
        background: `${rec.verdictColor}14`, border: `2px solid ${rec.verdictColor}44`,
        boxShadow: `0 0 40px ${rec.verdictColor}22`,
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{rec.verdictIcon}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: rec.verdictColor }}>{rec.verdict}</div>
        <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {rec.marginPct.toFixed(1)}% profit margin · {fmt(rec.profitPerOrder)} per successful order
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: DollarSign, label: 'Profit Per Order', value: fmt(rec.profitPerOrder), color: rec.profitPerOrder >= 0 ? '#10b981' : '#ef4444' },
          { icon: TrendingUp, label: 'Est. Monthly Profit', value: fmt(rec.monthlyProfit), color: rec.monthlyProfit >= 0 ? '#10b981' : '#ef4444' },
          { icon: Target,     label: 'Break-Even Orders', value: rec.breakEvenOrders ? `${rec.breakEvenOrders}/mo` : '∞', color: '#f59e0b' },
          { icon: Package,    label: 'Startup Budget Est.', value: fmt(rec.startupBudget), color: '#818cf8' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <div key={i} className="kpi-card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <div style={{ background: `${color}18`, borderRadius: 8, padding: '0.4rem', border: `1px solid ${color}33` }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
            <div className="stat-label" style={{ marginTop: '0.2rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Cost breakdown + risks side by side */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>Cost per order breakdown</h3>
          {[
            { label: 'Selling Price', value: fmt(price), income: true },
            { label: 'Product Cost (COGS)', value: fmt(rec.totalCostPerOrder - adCostPerOrder - (price * platformFeePct / 100) - (price * codFeePct / 100) - (price * taxPct / 100) - packaging - shipping + cogs + packaging + shipping), note: true },
            { label: 'Packaging', value: fmt(packaging) },
            { label: 'Delivery', value: fmt(shipping) },
            { label: `Ad Cost (CPA)`, value: fmt(adCostPerOrder) },
            { label: `Platform Fee (${platformFeePct}%)`, value: fmt(price * platformFeePct / 100) },
            { label: `COD Fee (${codFeePct}%)`, value: fmt(price * codFeePct / 100) },
            { label: `Tax (${taxPct}%)`, value: fmt(price * taxPct / 100) },
            { label: '→ Net Profit', value: fmt(rec.profitPerOrder), result: true },
          ].map((row, idx) => (
            <div key={idx} className="info-row">
              <span className="info-row-label">{row.label}</span>
              <span style={{ fontWeight: 600, color: row.income ? '#34d399' : row.result ? (rec.profitPerOrder >= 0 ? '#34d399' : '#f87171') : '#94a3b8' }}>
                {row.income ? '' : '− '}{row.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Risks */}
          {rec.risks.length > 0 && (
            <div className="card" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={15} color="#f87171" />
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f87171' }}>Key Risks</h3>
              </div>
              {rec.risks.map((risk, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.45rem 0', borderTop: i > 0 ? '1px solid rgba(239,68,68,0.1)' : 'none', fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0 }}>⚠</span> {risk}
                </div>
              ))}
            </div>
          )}

          {/* Next steps */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle size={15} color="#818cf8" />
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#818cf8' }}>Recommended Next Steps</h3>
            </div>
            {[
              'Check your Profit Per Order calculator for exact breakdown',
              'Use the Pricing Tool to see if you can increase margin',
              'Run the Ads Calculator to validate your ROAS before spending',
              'Add your product to the catalog and create a month forecast',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0', borderTop: i > 0 ? '1px solid rgba(99,102,241,0.1)' : 'none', fontSize: '0.81rem', color: '#a5b4fc', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span> {step}
              </div>
            ))}
          </div>

          {/* Market note */}
          {M && (
            <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#67e8f9', lineHeight: 1.6 }}>
              <Info size={13} color="#22d3ee" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              <strong>{M.name}:</strong> {M.note}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 200 }}>
          {saving ? 'Saving...' : '✓ Save My Business Plan'}
        </button>
        <button className="btn-secondary" onClick={() => navigate('/calculators/profit-per-order')}>
          Open Profit Calculator →
        </button>
        <button className="btn-secondary" onClick={() => navigate('/calculators/pricing')}>
          Find Ideal Price →
        </button>
      </div>
    </div>
  ) : (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
      Please complete the previous steps to see your business report.
    </div>
  );

  const STEPS = [Step0, Step1, Step2, Step3, Step4];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            ✨ Business Wizard
          </h1>
          <p className="page-subtitle">Build your entire e-commerce business plan in 5 steps — no finance knowledge needed</p>
        </div>
        {step < 4 && M && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '0.5rem 0.85rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span style={{ fontSize: '1.2rem' }}>{M.flag}</span>
            <span>{M.name} · <strong style={{ color: M.currency === 'PKR' ? '#818cf8' : '#f1f5f9' }}>{M.currency}</strong></span>
            {IND && <><span style={{ color: '#334155' }}>·</span><span>{IND.icon} {IND.name}</span></>}
          </div>
        )}
      </div>

      <div className="card">
        <StepBar current={step} total={5} labels={STEP_LABELS} />
        {STEPS[step]}
      </div>

      {/* Nav buttons */}
      {step > 0 && step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={back}>
            <ArrowLeft size={14} /> Back
          </button>
          <button className="btn-primary" onClick={next} disabled={step === 2 && !productName}>
            Continue <ArrowRight size={14} />
          </button>
        </div>
      )}
      {step === 4 && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={back}>
            <ArrowLeft size={14} /> Edit Inputs
          </button>
        </div>
      )}
    </div>
  );
}
