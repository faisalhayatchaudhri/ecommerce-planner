const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../db/pool');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Safely retrieve JWT_SECRET — fail loudly at startup if missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── POST /api/auth/register ──────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ max: 100 })
      .withMessage('Name is too long'),
  ],
  validate,
  async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      const password_hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
        [email, password_hash, full_name]
      );
      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      res.status(201).json({ token, user });
    } catch (err) {
      // Never expose internal error details to the client
      console.error('[register]', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      // Only fetch the columns we need — never SELECT *
      const result = await pool.query(
        'SELECT id, email, full_name, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );
      if (result.rows.length === 0) {
        // Generic message — don't reveal which field is wrong
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      // Strip password_hash before responding
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      console.error('[login]', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[/me]', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

module.exports = router;
