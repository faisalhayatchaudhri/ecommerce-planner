const express = require('express');
const { body, query } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/forecast?months=12
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sf.*, p.name as product_name, p.selling_price, p.cogs
       FROM sales_forecasts sf
       LEFT JOIN products p ON sf.product_id = p.id
       WHERE sf.user_id = $1
       ORDER BY sf.month ASC`,
      [req.userId]
    );
    res.json({ forecasts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

// POST /api/forecast
router.post(
  '/',
  [
    body('month').isISO8601(),
    body('units_sold').isInt({ min: 0 }),
    body('average_order_value').isFloat({ min: 0 }),
    body('conversion_rate').isFloat({ min: 0, max: 1 }),
    body('traffic_estimate').isInt({ min: 0 })
  ],
  validate,
  async (req, res) => {
    const {
      product_id, month, units_sold, average_order_value,
      conversion_rate, traffic_estimate, growth_rate
    } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO sales_forecasts
          (user_id, product_id, month, units_sold, average_order_value,
           conversion_rate, traffic_estimate, growth_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.userId, product_id || null, month, units_sold, average_order_value,
         conversion_rate, traffic_estimate, growth_rate || 0]
      );
      res.status(201).json({ forecast: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create forecast' });
    }
  }
);

// POST /api/forecast/simulate — project growth over N months
router.post('/simulate', async (req, res) => {
  const {
    initial_monthly_revenue, monthly_growth_rate, months,
    initial_investment, monthly_operating_costs
  } = req.body;

  if (!initial_monthly_revenue || !months) {
    return res.status(400).json({ error: 'initial_monthly_revenue and months are required' });
  }

  const projections = [];
  let revenue = parseFloat(initial_monthly_revenue);
  const growthRate = parseFloat(monthly_growth_rate) || 0;
  const opCosts = parseFloat(monthly_operating_costs) || 0;
  const totalInvestment = parseFloat(initial_investment) || 0;
  let cumulativeProfit = 0;

  for (let i = 1; i <= parseInt(months); i++) {
    const netProfit = revenue - opCosts;
    cumulativeProfit += netProfit;
    const roi = totalInvestment > 0 ? ((cumulativeProfit / totalInvestment) * 100) : null;
    projections.push({
      month: i,
      revenue: parseFloat(revenue.toFixed(2)),
      operating_costs: opCosts,
      net_profit: parseFloat(netProfit.toFixed(2)),
      cumulative_profit: parseFloat(cumulativeProfit.toFixed(2)),
      roi_pct: roi !== null ? parseFloat(roi.toFixed(2)) : null
    });
    revenue = revenue * (1 + growthRate);
  }

  res.json({ projections });
});

// GET /api/forecast/breakeven
router.get('/breakeven', async (req, res) => {
  try {
    const profileRes = await pool.query(
      'SELECT * FROM business_profiles WHERE user_id=$1',
      [req.userId]
    );
    const profile = profileRes.rows[0];

    const productsResult = await pool.query(
      'SELECT selling_price, cogs FROM products WHERE user_id=$1 AND is_active=TRUE ORDER BY created_at DESC LIMIT 1',
      [req.userId]
    );

    const asp = parseFloat(profile?.expected_average_selling_price || profile?.planned_asp) ||
      (productsResult.rows[0] ? parseFloat(productsResult.rows[0].selling_price) : 0);
    const cogsPerUnit = parseFloat(profile?.planned_cogs) ||
      (productsResult.rows[0] ? parseFloat(productsResult.rows[0].cogs) : 0);

    if (asp <= 0 && cogsPerUnit <= 0) {
      return res.json({ breakeven_units: null, message: 'Set ASP and COGS in planner or add products first' });
    }

    const contributionMargin = asp - cogsPerUnit;

    if (contributionMargin <= 0) {
      return res.json({ breakeven_units: null, message: 'Contribution margin is zero or negative' });
    }

    const fixedCosts =
      (parseFloat(profile?.monthly_platform_cost) || 0) +
      (parseFloat(profile?.monthly_website_hosting_cost) || 0) +
      (parseFloat(profile?.monthly_marketing_budget) || 0);
    const breakevenUnits = Math.ceil(fixedCosts / contributionMargin);

    res.json({
      fixed_costs: fixedCosts,
      contribution_margin_per_unit: parseFloat(contributionMargin.toFixed(2)),
      breakeven_units: breakevenUnits,
      breakeven_revenue: parseFloat((breakevenUnits * asp).toFixed(2))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate break-even' });
  }
});

module.exports = router;
