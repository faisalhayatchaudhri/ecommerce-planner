const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// GET /api/cashflow?year=2026
router.get('/', async (req, res) => {
  const year = req.query.year;
  try {
    let q = 'SELECT * FROM cash_flow WHERE user_id=$1';
    const params = [req.userId];
    if (year) {
      q += ' AND EXTRACT(YEAR FROM month) = $2';
      params.push(parseInt(year));
    }
    q += ' ORDER BY month ASC';
    const result = await pool.query(q, params);
    res.json({ records: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cash flow' });
  }
});

// POST /api/cashflow
router.post(
  '/',
  [
    body('month').isISO8601(),
    body('type').isIn(['inflow', 'outflow', 'funding']),
    body('category').trim().notEmpty(),
    body('amount').isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    const { month, type, category, amount, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO cash_flow (user_id, month, type, category, amount, description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [req.userId, month, type, category, amount, description]
      );
      res.status(201).json({ record: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add cash flow record' });
    }
  }
);

// DELETE /api/cashflow/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cash_flow WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// GET /api/cashflow/summary?year=2026 — monthly net cash flow
router.get('/summary', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const result = await pool.query(
      `SELECT
        TO_CHAR(month, 'YYYY-MM') as period,
        SUM(CASE WHEN type='inflow' THEN amount ELSE 0 END) as total_inflow,
        SUM(CASE WHEN type='outflow' THEN amount ELSE 0 END) as total_outflow,
        SUM(CASE WHEN type='funding' THEN amount ELSE 0 END) as total_funding,
        SUM(CASE WHEN type IN ('inflow','funding') THEN amount ELSE -amount END) as net_cashflow
       FROM cash_flow
       WHERE user_id=$1 AND EXTRACT(YEAR FROM month)=$2
       GROUP BY period ORDER BY period`,
      [req.userId, year]
    );
    res.json({ summary: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to summarize cash flow' });
  }
});

// POST /api/cashflow/inject — simulate a fund injection
router.post('/inject', async (req, res) => {
  const { amount, description, month } = req.body;
  if (!amount || !month) {
    return res.status(400).json({ error: 'amount and month are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cash_flow (user_id, month, type, category, amount, description)
       VALUES ($1,$2,'funding','Capital Injection',$3,$4) RETURNING *`,
      [req.userId, month, parseFloat(amount), description || 'External funding injection']
    );
    res.status(201).json({ record: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record injection' });
  }
});

module.exports = router;
