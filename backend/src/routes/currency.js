const express = require('express');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Fallback static rates (used when API key is not configured)
const FALLBACK_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75,
  JPY: 149.5, CAD: 1.36, AUD: 1.53, INR: 83.1, SGD: 1.34
};

// GET /api/currency/rates?base=USD
router.get('/rates', async (req, res) => {
  const base = (req.query.base || 'USD').toUpperCase();
  const apiKey = process.env.CURRENCY_API_KEY;

  if (!apiKey || apiKey === 'your_currency_api_key_here') {
    // Return static fallback rates
    const rates = {};
    const baseRate = FALLBACK_RATES[base] || 1;
    Object.entries(FALLBACK_RATES).forEach(([code, rate]) => {
      rates[code] = parseFloat((rate / baseRate).toFixed(6));
    });
    return res.json({ base, rates, source: 'fallback' });
  }

  try {
    const response = await axios.get(`${process.env.CURRENCY_API_URL}/live`, {
      params: { access_key: apiKey, source: base },
      timeout: 5000
    });
    if (response.data.success) {
      const rates = {};
      Object.entries(response.data.quotes).forEach(([key, val]) => {
        rates[key.replace(base, '')] = val;
      });
      res.json({ base, rates, source: 'live' });
    } else {
      res.json({ base, rates: FALLBACK_RATES, source: 'fallback' });
    }
  } catch (err) {
    res.json({ base, rates: FALLBACK_RATES, source: 'fallback' });
  }
});

// GET /api/currency/convert?from=USD&to=AED&amount=100
router.get('/convert', async (req, res) => {
  const { from = 'USD', to = 'USD', amount } = req.query;
  if (!amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }
  const fromRate = FALLBACK_RATES[from.toUpperCase()] || 1;
  const toRate = FALLBACK_RATES[to.toUpperCase()] || 1;
  const converted = (parseFloat(amount) / fromRate) * toRate;
  res.json({
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    original_amount: parseFloat(amount),
    converted_amount: parseFloat(converted.toFixed(2))
  });
});

// GET /api/currency/taxes - common e-commerce tax rates by region
router.get('/taxes', (req, res) => {
  const taxRates = [
    { region: 'United States', code: 'US', vat_rate: 0, notes: 'State-level sales tax varies (0-12%)' },
    { region: 'European Union', code: 'EU', vat_rate: 0.20, notes: 'Standard VAT 20%, varies by country' },
    { region: 'United Kingdom', code: 'GB', vat_rate: 0.20, notes: 'Standard VAT 20%' },
    { region: 'UAE', code: 'AE', vat_rate: 0.05, notes: 'VAT 5%' },
    { region: 'Saudi Arabia', code: 'SA', vat_rate: 0.15, notes: 'VAT 15%' },
    { region: 'Australia', code: 'AU', vat_rate: 0.10, notes: 'GST 10%' },
    { region: 'Canada', code: 'CA', vat_rate: 0.05, notes: 'GST 5% + provincial taxes' },
    { region: 'India', code: 'IN', vat_rate: 0.18, notes: 'GST 18% (standard)' },
    { region: 'Singapore', code: 'SG', vat_rate: 0.09, notes: 'GST 9%' },
    { region: 'Japan', code: 'JP', vat_rate: 0.10, notes: 'Consumption tax 10%' }
  ];
  res.json({ tax_rates: taxRates });
});

module.exports = router;
