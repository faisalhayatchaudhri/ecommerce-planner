const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/analytics/kpis — summary KPIs
router.get('/kpis', async (req, res) => {
  try {
    const [productsRes, forecastsRes, cashflowRes, costsRes] = await Promise.all([
      pool.query('SELECT * FROM products WHERE user_id=$1 AND is_active=TRUE', [req.userId]),
      pool.query(
        `SELECT SUM(units_sold * average_order_value) as total_revenue,
                SUM(units_sold) as total_units
         FROM sales_forecasts WHERE user_id=$1`,
        [req.userId]
      ),
      pool.query(
        `SELECT
          SUM(CASE WHEN type='inflow' THEN amount ELSE 0 END) as total_inflow,
          SUM(CASE WHEN type='outflow' THEN amount ELSE 0 END) as total_outflow
         FROM cash_flow WHERE user_id=$1`,
        [req.userId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(advertising_spend + platform_fees + salaries + other_overheads), 0) as total_costs
         FROM operating_costs WHERE user_id=$1`,
        [req.userId]
      )
    ]);

    const products = productsRes.rows;
    const totalRevenue = parseFloat(forecastsRes.rows[0].total_revenue) || 0;
    const totalUnits = parseInt(forecastsRes.rows[0].total_units) || 0;
    const totalInflow = parseFloat(cashflowRes.rows[0].total_inflow) || 0;
    const totalOutflow = parseFloat(cashflowRes.rows[0].total_outflow) || 0;
    const totalOpCosts = parseFloat(costsRes.rows[0].total_costs) || 0;

    // Average profit margin across active products
    let avgGrossMargin = 0;
    if (products.length > 0) {
      const margins = products.map(p => {
        const price = parseFloat(p.selling_price);
        const cogs = parseFloat(p.cogs);
        return price > 0 ? ((price - cogs) / price) * 100 : 0;
      });
      avgGrossMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
    }

    const netProfit = totalInflow - totalOutflow - totalOpCosts;
    const netMargin = totalInflow > 0 ? (netProfit / totalInflow) * 100 : 0;

    res.json({
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_units_sold: totalUnits,
      total_inflow: parseFloat(totalInflow.toFixed(2)),
      total_outflow: parseFloat(totalOutflow.toFixed(2)),
      net_profit: parseFloat(netProfit.toFixed(2)),
      net_margin_pct: parseFloat(netMargin.toFixed(2)),
      avg_gross_margin_pct: parseFloat(avgGrossMargin.toFixed(2)),
      active_products: products.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute KPIs' });
  }
});

// GET /api/analytics/profitability â€” section 7 profitability & break-even
router.get('/profitability', async (req, res) => {
  try {
    const profileRes = await pool.query(
      'SELECT * FROM business_profiles WHERE user_id=$1',
      [req.userId]
    );
    const profile = profileRes.rows[0];
    if (!profile) {
      return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
    }

    const monthlySalesTarget = parseFloat(profile.monthly_sales_target) || 0;
    const asp = parseFloat(profile.expected_average_selling_price || profile.planned_asp) || 0;
    const cogsPerUnit = parseFloat(profile.planned_cogs) || 0;

    const revenue = monthlySalesTarget * asp;
    const cogsTotal = monthlySalesTarget * cogsPerUnit;
    const grossProfit = revenue - cogsTotal;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const fixedCosts =
      (parseFloat(profile.monthly_platform_cost) || 0) +
      (parseFloat(profile.monthly_website_hosting_cost) || 0) +
      (parseFloat(profile.monthly_marketing_budget) || 0);

    const paymentGatewayFees = revenue * (parseFloat(profile.payment_gateway_fee_pct) || 0);
    const salesTaxAmount = revenue * (parseFloat(profile.sales_tax_rate) || 0);
    const vatGstAmount = revenue * (parseFloat(profile.vat_gst_rate) || 0);
    const importDutiesAmount = cogsTotal * (parseFloat(profile.import_duties_pct) || 0);

    const totalDeductions = fixedCosts + paymentGatewayFees + salesTaxAmount + vatGstAmount + importDutiesAmount;
    const netProfit = grossProfit - totalDeductions;
    const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const grossProfitPerUnit = asp - cogsPerUnit;
    const breakEvenUnits = grossProfitPerUnit > 0 ? Math.ceil(fixedCosts / grossProfitPerUnit) : null;
    const breakEvenRevenue = breakEvenUnits !== null ? breakEvenUnits * asp : null;

    res.json({
      assumptions: {
        monthly_sales_target: monthlySalesTarget,
        asp,
        cogs_per_unit: cogsPerUnit,
        fixed_costs: parseFloat(fixedCosts.toFixed(2))
      },
      calculations: {
        revenue: parseFloat(revenue.toFixed(2)),
        cogs_total: parseFloat(cogsTotal.toFixed(2)),
        gross_profit: parseFloat(grossProfit.toFixed(2)),
        gross_margin_pct: parseFloat(grossMarginPct.toFixed(2)),
        payment_gateway_fees: parseFloat(paymentGatewayFees.toFixed(2)),
        sales_tax_amount: parseFloat(salesTaxAmount.toFixed(2)),
        vat_gst_amount: parseFloat(vatGstAmount.toFixed(2)),
        import_duties_amount: parseFloat(importDutiesAmount.toFixed(2)),
        net_profit: parseFloat(netProfit.toFixed(2)),
        net_margin_pct: parseFloat(netMarginPct.toFixed(2)),
        gross_profit_per_unit: parseFloat(grossProfitPerUnit.toFixed(2)),
        break_even_units: breakEvenUnits,
        break_even_revenue: breakEvenRevenue !== null ? parseFloat(breakEvenRevenue.toFixed(2)) : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute profitability metrics' });
  }
});

// GET /api/analytics/monthly-trends?year=2026
router.get('/monthly-trends', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const [forecastRes, costsRes] = await Promise.all([
      pool.query(
        `SELECT
          TO_CHAR(month, 'YYYY-MM') as period,
          SUM(units_sold * average_order_value) as revenue,
          SUM(units_sold) as units
         FROM sales_forecasts
         WHERE user_id=$1 AND EXTRACT(YEAR FROM month)=$2
         GROUP BY period ORDER BY period`,
        [req.userId, year]
      ),
      pool.query(
        `SELECT
          TO_CHAR(month, 'YYYY-MM') as period,
          SUM(advertising_spend + platform_fees + salaries + other_overheads) as total_costs
         FROM operating_costs
         WHERE user_id=$1 AND EXTRACT(YEAR FROM month)=$2
         GROUP BY period ORDER BY period`,
        [req.userId, year]
      )
    ]);

    // Merge by period
    const periodsMap = {};
    forecastRes.rows.forEach(r => {
      periodsMap[r.period] = { period: r.period, revenue: parseFloat(r.revenue) || 0, units: parseInt(r.units) || 0, costs: 0 };
    });
    costsRes.rows.forEach(r => {
      if (!periodsMap[r.period]) periodsMap[r.period] = { period: r.period, revenue: 0, units: 0 };
      periodsMap[r.period].costs = parseFloat(r.total_costs) || 0;
    });

    const trends = Object.values(periodsMap).map(r => ({
      period: r.period,
      revenue: parseFloat((r.revenue || 0).toFixed(2)),
      costs: parseFloat((r.costs || 0).toFixed(2)),
      net_profit: parseFloat(((r.revenue || 0) - (r.costs || 0)).toFixed(2)),
      units: r.units || 0
    })).sort((a, b) => a.period.localeCompare(b.period));

    res.json({ year: parseInt(year), trends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/analytics/returns â€” section 10 ROI and ROE
router.get('/returns', async (req, res) => {
  try {
    const [profileRes, partnersRes] = await Promise.all([
      pool.query('SELECT * FROM business_profiles WHERE user_id=$1', [req.userId]),
      pool.query('SELECT * FROM partners WHERE user_id=$1', [req.userId])
    ]);

    const profile = profileRes.rows[0];
    if (!profile) {
      return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
    }

    const monthlySalesTarget = parseFloat(profile.monthly_sales_target) || 0;
    const asp = parseFloat(profile.expected_average_selling_price || profile.planned_asp) || 0;
    const cogsPerUnit = parseFloat(profile.planned_cogs) || 0;
    const revenue = monthlySalesTarget * asp;
    const cogsTotal = monthlySalesTarget * cogsPerUnit;
    const grossProfit = revenue - cogsTotal;

    const fixedCosts =
      (parseFloat(profile.monthly_platform_cost) || 0) +
      (parseFloat(profile.monthly_website_hosting_cost) || 0) +
      (parseFloat(profile.monthly_marketing_budget) || 0);
    const paymentGatewayFees = revenue * (parseFloat(profile.payment_gateway_fee_pct) || 0);
    const salesTaxAmount = revenue * (parseFloat(profile.sales_tax_rate) || 0);
    const vatGstAmount = revenue * (parseFloat(profile.vat_gst_rate) || 0);
    const importDutiesAmount = cogsTotal * (parseFloat(profile.import_duties_pct) || 0);
    const monthlyNetProfit = grossProfit - (fixedCosts + paymentGatewayFees + salesTaxAmount + vatGstAmount + importDutiesAmount);

    const totalPartnerInvestment = partnersRes.rows.reduce(
      (sum, p) => sum + (parseFloat(p.capital_invested) || 0),
      0
    );
    const ownerInitialInvestment = parseFloat(profile.initial_investment_amount) || 0;
    const totalInvestment = ownerInitialInvestment + totalPartnerInvestment;
    const roiPct = totalInvestment > 0 ? (monthlyNetProfit / totalInvestment) * 100 : null;

    const partnerReturns = partnersRes.rows.map((partner) => {
      const capitalInvested = parseFloat(partner.capital_invested) || 0;
      const sharePct = parseFloat(partner.profit_share_pct || partner.equity_pct) || 0;
      const partnerProfitShare = monthlyNetProfit * sharePct;
      const roePct = capitalInvested > 0 ? (partnerProfitShare / capitalInvested) * 100 : null;
      return {
        partner_id: partner.id,
        name: partner.name,
        equity_pct: (parseFloat(partner.equity_pct) || 0) * 100,
        profit_share_pct: sharePct * 100,
        capital_invested: parseFloat(capitalInvested.toFixed(2)),
        partner_profit_share: parseFloat(partnerProfitShare.toFixed(2)),
        roe_pct: roePct !== null ? parseFloat(roePct.toFixed(2)) : null
      };
    });

    res.json({
      monthly_net_profit: parseFloat(monthlyNetProfit.toFixed(2)),
      total_investment: parseFloat(totalInvestment.toFixed(2)),
      owner_initial_investment: parseFloat(ownerInitialInvestment.toFixed(2)),
      total_partner_investment: parseFloat(totalPartnerInvestment.toFixed(2)),
      roi_pct: roiPct !== null ? parseFloat(roiPct.toFixed(2)) : null,
      partner_returns: partnerReturns
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute ROI and ROE' });
  }
});

// GET /api/analytics/product-performance
router.get('/product-performance', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        p.id, p.name, p.category, p.selling_price, p.cogs,
        COALESCE(SUM(sf.units_sold), 0) as total_units,
        COALESCE(SUM(sf.units_sold * p.selling_price), 0) as total_revenue,
        COALESCE(SUM(sf.units_sold * (p.selling_price - p.cogs)), 0) as total_gross_profit
       FROM products p
       LEFT JOIN sales_forecasts sf ON sf.product_id = p.id
       WHERE p.user_id=$1
       GROUP BY p.id
       ORDER BY total_revenue DESC`,
      [req.userId]
    );

    const performance = result.rows.map(r => ({
      ...r,
      selling_price: parseFloat(r.selling_price),
      cogs: parseFloat(r.cogs),
      total_revenue: parseFloat(parseFloat(r.total_revenue).toFixed(2)),
      total_gross_profit: parseFloat(parseFloat(r.total_gross_profit).toFixed(2)),
      gross_margin_pct: parseFloat(r.selling_price) > 0
        ? parseFloat((((parseFloat(r.selling_price) - parseFloat(r.cogs)) / parseFloat(r.selling_price)) * 100).toFixed(2))
        : 0
    }));

    res.json({ performance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product performance' });
  }
});

module.exports = router;
