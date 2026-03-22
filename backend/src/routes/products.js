const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('selling_price').isFloat({ min: 0 }),
    body('cogs').isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    const {
      name, description, category, selling_price, cogs,
      shipping_cost_local, shipping_cost_international, platform_fee_pct,
      packaging_cost, ad_cost_per_order
    } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO products
          (user_id, name, description, category, selling_price, cogs,
           shipping_cost_local, shipping_cost_international, platform_fee_pct,
           packaging_cost, ad_cost_per_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [req.userId, name, description, category, selling_price, cogs,
         shipping_cost_local || 0, shipping_cost_international || 0, platform_fee_pct || 0,
         packaging_cost || 0, ad_cost_per_order || 0]
      );
      res.status(201).json({ product: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// PUT /api/products/:id
router.put(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req, res) => {
    const {
      name, description, category, selling_price, cogs,
      shipping_cost_local, shipping_cost_international, platform_fee_pct, is_active,
      packaging_cost, ad_cost_per_order
    } = req.body;
    try {
      const result = await pool.query(
        `UPDATE products SET
          name=$1, description=$2, category=$3, selling_price=$4, cogs=$5,
          shipping_cost_local=$6, shipping_cost_international=$7, platform_fee_pct=$8,
          is_active=$9, packaging_cost=$10, ad_cost_per_order=$11, updated_at=NOW()
         WHERE id=$12 AND user_id=$13 RETURNING *`,
        [name, description, category, selling_price, cogs,
         shipping_cost_local || 0, shipping_cost_international || 0,
         platform_fee_pct || 0, is_active !== undefined ? is_active : true,
         packaging_cost || 0, ad_cost_per_order || 0,
         req.params.id, req.userId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ product: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// DELETE /api/products/:id
router.delete('/:id', [param('id').isUUID()], validate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /api/products/:id/margin — profit margin for a single product
router.get('/:id/margin', [param('id').isUUID()], validate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const p = result.rows[0];
    const revenue = parseFloat(p.selling_price);
    const totalCost = parseFloat(p.cogs) +
      parseFloat(p.shipping_cost_local) +
      revenue * parseFloat(p.platform_fee_pct) +
      parseFloat(p.packaging_cost || 0) +
      parseFloat(p.ad_cost_per_order || 0);
    const grossProfit = revenue - parseFloat(p.cogs) - parseFloat(p.packaging_cost || 0);
    const netProfit = revenue - totalCost;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    res.json({
      product_id: p.id,
      selling_price: revenue,
      cogs: parseFloat(p.cogs),
      gross_profit: grossProfit,
      gross_margin_pct: parseFloat(grossMarginPct.toFixed(2)),
      net_profit: parseFloat(netProfit.toFixed(2)),
      net_margin_pct: parseFloat(netMarginPct.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate margin' });
  }
});

module.exports = router;
