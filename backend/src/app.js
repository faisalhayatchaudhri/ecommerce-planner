const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const profileRoutes  = require('./routes/profile');
const productRoutes  = require('./routes/products');
const forecastRoutes = require('./routes/forecast');
const cashflowRoutes = require('./routes/cashflow');
const partnerRoutes  = require('./routes/partners');
const analyticsRoutes= require('./routes/analytics');
const reportRoutes   = require('./routes/reports');
const currencyRoutes = require('./routes/currency');

const app = express();
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ── Rate limiting ─────────────────────────────────────
// General API: 1000 req / 15 min — generous for dev & real use
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Auth routes only: stricter to prevent brute-force on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Logging & parsing ─────────────────────────────────
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/forecast',  forecastRoutes);
app.use('/api/cashflow',  cashflowRoutes);
app.use('/api/partners',  partnerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/currency',  currencyRoutes);

// ── Health check ──────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
