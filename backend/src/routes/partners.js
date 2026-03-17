const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/partners
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM partners WHERE user_id=$1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ partners: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// POST /api/partners
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('equity_pct').isFloat({ min: 0, max: 1 }),
    body('capital_invested').isFloat({ min: 0 }),
    body('profit_share_pct').isFloat({ min: 0, max: 1 })
  ],
  validate,
  async (req, res) => {
    const { name, email, equity_pct, capital_invested, profit_share_pct, investment_date, notes } = req.body;
    try {
      // Validate total equity doesn't exceed 100%
      const existing = await pool.query(
        'SELECT SUM(equity_pct) as total_equity, SUM(profit_share_pct) as total_profit_share FROM partners WHERE user_id=$1',
        [req.userId]
      );
      const currentEquity = parseFloat(existing.rows[0].total_equity) || 0;
      const currentProfitShare = parseFloat(existing.rows[0].total_profit_share) || 0;
      if (currentEquity + parseFloat(equity_pct) > 1.0) {
        return res.status(400).json({ error: 'Total equity allocation cannot exceed 100%' });
      }
      if (currentProfitShare + parseFloat(profit_share_pct) > 1.0) {
        return res.status(400).json({ error: 'Total profit-sharing allocation cannot exceed 100%' });
      }

      const result = await pool.query(
        `INSERT INTO partners (user_id, name, email, equity_pct, capital_invested, profit_share_pct, investment_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.userId, name, email, equity_pct, capital_invested, profit_share_pct, investment_date, notes]
      );
      res.status(201).json({ partner: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add partner' });
    }
  }
);

// DELETE /api/partners/:id
router.delete('/:id', [param('id').isUUID()], validate, async (req, res) => {
  try {
    await pool.query('DELETE FROM partners WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Partner removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove partner' });
  }
});

// GET /api/partners/distribution — profit share calculation
router.get('/distribution', async (req, res) => {
  const { net_profit } = req.query;
  if (!net_profit) return res.status(400).json({ error: 'net_profit query param required' });

  try {
    const result = await pool.query(
      'SELECT * FROM partners WHERE user_id=$1',
      [req.userId]
    );
    const profit = parseFloat(net_profit);
    const distribution = result.rows.map(p => ({
      partner_id: p.id,
      name: p.name,
      equity_pct: parseFloat(p.equity_pct) * 100,
      profit_share_pct: parseFloat((p.profit_share_pct || p.equity_pct)) * 100,
      capital_invested: parseFloat(p.capital_invested),
      profit_share: parseFloat((profit * parseFloat(p.profit_share_pct || p.equity_pct)).toFixed(2)),
      roi_pct: p.capital_invested > 0
        ? parseFloat(((profit * parseFloat(p.profit_share_pct || p.equity_pct) / parseFloat(p.capital_invested)) * 100).toFixed(2))
        : null
    }));
    res.json({ net_profit: profit, distribution });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate distribution' });
  }
});

module.exports = router;
