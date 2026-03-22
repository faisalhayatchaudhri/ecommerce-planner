const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [req.userId]
    );
    res.json({ profile: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/profile
router.post(
  '/',
  [
    body('business_name').trim().notEmpty(),
    body('business_type').isIn(['dropshipping', 'direct_sales', 'subscription', 'marketplace', 'other']),
    body('country').trim().notEmpty(),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('planned_products_count').optional().isInt({ min: 0 }),
    body('planned_asp').optional().isFloat({ min: 0 }),
    body('planned_cogs').optional().isFloat({ min: 0 }),
    body('monthly_platform_cost').optional().isFloat({ min: 0 }),
    body('monthly_website_hosting_cost').optional().isFloat({ min: 0 }),
    body('monthly_marketing_budget').optional().isFloat({ min: 0 }),
    body('payment_gateway_fee_pct').optional().isFloat({ min: 0, max: 1 }),
    body('monthly_sales_target').optional().isInt({ min: 0 }),
    body('monthly_traffic_forecast').optional().isInt({ min: 0 }),
    body('expected_conversion_rate').optional().isFloat({ min: 0, max: 1 }),
    body('expected_average_selling_price').optional().isFloat({ min: 0 }),
    body('sales_tax_rate').optional().isFloat({ min: 0, max: 1 }),
    body('import_duties_pct').optional().isFloat({ min: 0, max: 1 }),
    body('vat_gst_rate').optional().isFloat({ min: 0, max: 1 })
  ],
  validate,
  async (req, res) => {
    const {
      business_name, business_type, country, target_market, currency,
      shipping_regions, payment_methods, monthly_traffic_estimate,
      tax_rate, tax_region, planned_products_count, planned_asp, planned_cogs,
      monthly_platform_cost, monthly_website_hosting_cost, monthly_marketing_budget, payment_gateway_fee_pct,
      monthly_sales_target, monthly_traffic_forecast, expected_conversion_rate, expected_average_selling_price,
      sales_tax_rate, import_duties_pct, vat_gst_rate
    } = req.body;
    try {
      const existing = await pool.query(
        'SELECT id FROM business_profiles WHERE user_id = $1', [req.userId]
      );
      let result;
      if (existing.rows.length > 0) {
        result = await pool.query(
          `UPDATE business_profiles SET
            business_name=$1, business_type=$2, country=$3, target_market=$4, currency=$5,
            shipping_regions=$6, payment_methods=$7, monthly_traffic_estimate=$8,
            tax_rate=$9, tax_region=$10, planned_products_count=$11, planned_asp=$12,
            planned_cogs=$13, monthly_platform_cost=$14, monthly_website_hosting_cost=$15,
            monthly_marketing_budget=$16, payment_gateway_fee_pct=$17, monthly_sales_target=$18,
            monthly_traffic_forecast=$19, expected_conversion_rate=$20, expected_average_selling_price=$21,
            sales_tax_rate=$22, import_duties_pct=$23, vat_gst_rate=$24,
            updated_at=NOW()
           WHERE user_id=$25 RETURNING *`,
          [business_name, business_type, country, target_market, currency || 'USD',
           shipping_regions, payment_methods, monthly_traffic_estimate || 0,
           tax_rate || 0, tax_region, planned_products_count || 0, planned_asp || 0,
           planned_cogs || 0, monthly_platform_cost || 0, monthly_website_hosting_cost || 0,
           monthly_marketing_budget || 0, payment_gateway_fee_pct || 0, monthly_sales_target || 0,
           monthly_traffic_forecast || 0, expected_conversion_rate || 0, expected_average_selling_price || 0,
           sales_tax_rate || 0, import_duties_pct || 0, vat_gst_rate || 0, req.userId]
        );
      } else {
        result = await pool.query(
          `INSERT INTO business_profiles
            (user_id, business_name, business_type, country, target_market, currency,
             shipping_regions, payment_methods, monthly_traffic_estimate, tax_rate, tax_region,
             planned_products_count, planned_asp, planned_cogs, monthly_platform_cost,
             monthly_website_hosting_cost, monthly_marketing_budget, payment_gateway_fee_pct,
             monthly_sales_target, monthly_traffic_forecast, expected_conversion_rate, expected_average_selling_price,
             sales_tax_rate, import_duties_pct, vat_gst_rate)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING *`,
          [req.userId, business_name, business_type, country, target_market, currency || 'USD',
           shipping_regions, payment_methods, monthly_traffic_estimate || 0,
           tax_rate || 0, tax_region, planned_products_count || 0, planned_asp || 0, planned_cogs || 0,
           monthly_platform_cost || 0, monthly_website_hosting_cost || 0, monthly_marketing_budget || 0, payment_gateway_fee_pct || 0,
           monthly_sales_target || 0, monthly_traffic_forecast || 0, expected_conversion_rate || 0, expected_average_selling_price || 0,
           sales_tax_rate || 0, import_duties_pct || 0, vat_gst_rate || 0]
        );
      }
      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  }
);

// PATCH /api/profile/tax-legal
router.patch(
  '/tax-legal',
  [
    body('sales_tax_rate').isFloat({ min: 0, max: 1 }),
    body('import_duties_pct').isFloat({ min: 0, max: 1 }),
    body('vat_gst_rate').isFloat({ min: 0, max: 1 })
  ],
  validate,
  async (req, res) => {
    const { sales_tax_rate, import_duties_pct, vat_gst_rate } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          sales_tax_rate=$1, import_duties_pct=$2, vat_gst_rate=$3, updated_at=NOW()
         WHERE user_id=$4 RETURNING *`,
        [sales_tax_rate, import_duties_pct, vat_gst_rate, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save tax/legal settings' });
    }
  }
);

// PATCH /api/profile/cashflow-plan
router.patch(
  '/cashflow-plan',
  [
    body('initial_investment_amount').isFloat({ min: 0 }),
    body('monthly_cash_injection').isFloat({ min: 0 }),
    body('cash_injection_months').isInt({ min: 0, max: 60 })
  ],
  validate,
  async (req, res) => {
    const { initial_investment_amount, monthly_cash_injection, cash_injection_months } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          initial_investment_amount=$1, monthly_cash_injection=$2, cash_injection_months=$3, updated_at=NOW()
         WHERE user_id=$4 RETURNING *`,
        [initial_investment_amount, monthly_cash_injection, cash_injection_months, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save cash flow planning settings' });
    }
  }
);

// PATCH /api/profile/scalability
router.patch(
  '/scalability',
  [
    body('projected_monthly_growth_rate').isFloat({ min: 0 }),
    body('future_product_launches_year1').isInt({ min: 0, max: 1000 })
  ],
  validate,
  async (req, res) => {
    const { projected_monthly_growth_rate, future_product_launches_year1 } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          projected_monthly_growth_rate=$1, future_product_launches_year1=$2, updated_at=NOW()
         WHERE user_id=$3 RETURNING *`,
        [projected_monthly_growth_rate, future_product_launches_year1, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save scalability settings' });
    }
  }
);

// PATCH /api/profile/sales-forecast
router.patch(
  '/sales-forecast',
  [
    body('monthly_sales_target').isInt({ min: 0 }),
    body('monthly_traffic_forecast').isInt({ min: 0 }),
    body('expected_conversion_rate').isFloat({ min: 0, max: 1 }),
    body('expected_average_selling_price').isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    const {
      monthly_sales_target,
      monthly_traffic_forecast,
      expected_conversion_rate,
      expected_average_selling_price
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          monthly_sales_target=$1, monthly_traffic_forecast=$2, expected_conversion_rate=$3,
          expected_average_selling_price=$4, updated_at=NOW()
         WHERE user_id=$5 RETURNING *`,
        [monthly_sales_target, monthly_traffic_forecast, expected_conversion_rate, expected_average_selling_price, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save sales forecasting settings' });
    }
  }
);

// PATCH /api/profile/operational-costs
router.patch(
  '/operational-costs',
  [
    body('monthly_platform_cost').isFloat({ min: 0 }),
    body('monthly_website_hosting_cost').isFloat({ min: 0 }),
    body('monthly_marketing_budget').isFloat({ min: 0 }),
    body('payment_gateway_fee_pct').isFloat({ min: 0, max: 1 })
  ],
  validate,
  async (req, res) => {
    const {
      monthly_platform_cost,
      monthly_website_hosting_cost,
      monthly_marketing_budget,
      payment_gateway_fee_pct
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          monthly_platform_cost=$1, monthly_website_hosting_cost=$2,
          monthly_marketing_budget=$3, payment_gateway_fee_pct=$4, updated_at=NOW()
         WHERE user_id=$5 RETURNING *`,
        [monthly_platform_cost, monthly_website_hosting_cost, monthly_marketing_budget, payment_gateway_fee_pct, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save operational costs settings' });
    }
  }
);

// PATCH /api/profile/planner
router.patch(
  '/planner',
  [
    body('planned_products_count').isInt({ min: 0 }),
    body('planned_asp').isFloat({ min: 0 }),
    body('planned_cogs').isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    const { planned_products_count, planned_asp, planned_cogs } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          planned_products_count=$1, planned_asp=$2, planned_cogs=$3, updated_at=NOW()
         WHERE user_id=$4 RETURNING *`,
        [planned_products_count, planned_asp, planned_cogs, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save product planner settings' });
    }
  }
);

// PATCH /api/profile/startup-budget
router.patch(
  '/startup-budget',
  [
    body('startup_initial_stock').optional().isFloat({ min: 0 }),
    body('startup_website_setup').optional().isFloat({ min: 0 }),
    body('startup_branding').optional().isFloat({ min: 0 }),
    body('startup_photography').optional().isFloat({ min: 0 }),
    body('startup_ads_budget').optional().isFloat({ min: 0 }),
    body('startup_legal').optional().isFloat({ min: 0 }),
    body('startup_emergency').optional().isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    const {
      startup_initial_stock, startup_website_setup, startup_branding,
      startup_photography, startup_ads_budget, startup_legal, startup_emergency
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          startup_initial_stock=COALESCE($1, startup_initial_stock),
          startup_website_setup=COALESCE($2, startup_website_setup),
          startup_branding=COALESCE($3, startup_branding),
          startup_photography=COALESCE($4, startup_photography),
          startup_ads_budget=COALESCE($5, startup_ads_budget),
          startup_legal=COALESCE($6, startup_legal),
          startup_emergency=COALESCE($7, startup_emergency),
          updated_at=NOW()
         WHERE user_id=$8 RETURNING *`,
        [startup_initial_stock, startup_website_setup, startup_branding, startup_photography, startup_ads_budget, startup_legal, startup_emergency, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save startup budget settings' });
    }
  }
);

// PATCH /api/profile/cod-rates
router.patch(
  '/cod-rates',
  [
    body('cod_order_pct').optional().isFloat({ min: 0, max: 1 }),
    body('rto_pct').optional().isFloat({ min: 0, max: 1 }),
    body('courier_cod_fee_pct').optional().isFloat({ min: 0, max: 1 })
  ],
  validate,
  async (req, res) => {
    const { cod_order_pct, rto_pct, courier_cod_fee_pct } = req.body;
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          cod_order_pct=COALESCE($1, cod_order_pct),
          rto_pct=COALESCE($2, rto_pct),
          courier_cod_fee_pct=COALESCE($3, courier_cod_fee_pct),
          updated_at=NOW()
         WHERE user_id=$4 RETURNING *`,
        [cod_order_pct, rto_pct, courier_cod_fee_pct, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }

      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save COD rates' });
    }
  }
);

// PATCH /api/profile/beginner-wizard
router.patch(
  '/beginner-wizard',
  [
    body('beginner_mode_completed').isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET beginner_mode_completed=$1, updated_at=NOW() WHERE user_id=$2 RETURNING *`,
        [req.body.beginner_mode_completed, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Create your business profile first in onboarding.' });
      }
      res.json({ profile: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save beginner wizard status' });
    }
  }
);

// PATCH /api/profile/goals
router.patch(
  '/goals',
  [
    body('target_monthly_income').optional().isFloat({ min: 0 }),
    body('target_profit_margin').optional().isFloat({ min: 0, max: 1 })
  ],
  validate,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE business_profiles SET
          target_monthly_income=COALESCE($1, target_monthly_income),
          target_profit_margin=COALESCE($2, target_profit_margin),
          updated_at=NOW()
         WHERE user_id=$3 RETURNING *`,
        [req.body.target_monthly_income, req.body.target_profit_margin, req.userId]
      );
      if (result.rows.length === 0) return res.status(400).json({ error: 'Profile not found.' });
      res.json({ profile: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save goals target' });
    }
  }
);

module.exports = router;
