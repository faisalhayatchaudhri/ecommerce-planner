# E-commerce Business Planner Tool

A full-stack planning and financial modeling app for pre-launch and growing e-commerce businesses.

## About This Application

This application helps e-commerce founders plan their business before launch and track key financial decisions in one place.
It combines operational planning with finance tools, so users can:

- define business profile, market, and tax setup,
- manage products with pricing, costs, and margin visibility,
- project sales, break-even points, and 12-month growth,
- model cash flow, investment injections, and partner distributions,
- monitor KPIs and export reports (PDF, Excel, CSV) for analysis and sharing.

In short, it is a practical business-planning dashboard for testing whether an e-commerce model is viable and how profitable it can become.

## What Is Implemented

### Section-by-section planner

1. Business Profile Setup
- Business name, business type, country, currency (country-driven defaults), tax region.

2. Product Information
- Product catalog (category, ASP/selling price, COGS, shipping, platform fee).
- Product planner: initial product count, planned ASP, planned COGS.

3. Operational Costs Setup
- Monthly platform cost, hosting/dev cost, marketing budget, gateway fee percent.

4. Sales Forecasting
- Monthly sales target, traffic forecast, conversion rate, expected ASP.
- Revenue/units auto-calculations.

5. Tax & Legal Considerations
- Sales tax rate, import duties percent, VAT/GST rate.
- Tax impact estimator.

6. Partner/Investor Setup
- Partner equity %, profit-sharing %, capital invested.
- Distribution calculator based on net profit.

7. Profit Margin & Break-Even
- Gross margin, net margin, fixed costs.
- Break-even units/revenue via:
  - Gross Profit Margin = (Revenue - COGS) / Revenue
  - Break-Even Units = Fixed Costs / Gross Profit per Unit

8. Cash Flow Management
- Initial investment, monthly cash injection, injection duration.
- Operating inflow/outflow/net cash-flow projection.

9. Scalability Projections
- Monthly growth rate and future product launches (year 1).
- 12-month projected units/traffic/revenue with chart + table.

10. ROI & Investment Returns
- Business ROI and partner ROE:
  - ROI = (Net Profit / Total Investment) x 100
  - ROE = Partner Profit Share / Partner Capital Invested

## Tech Stack

- Frontend: React 18, React Router 6, Chart.js
- Backend: Node.js, Express
- Database: SQLite (via better-sqlite3 adapter that provides a pg-like query interface)
- Auth: JWT + bcrypt
- Reports: ExcelJS, PDFKit, CSV
- Security: Helmet, express-rate-limit, request validation

## Quick Start

### Prerequisites
- Node.js 18+

### 1. Install dependencies

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Set JWT_SECRET and optional currency API key
```

```bash
cd ../frontend
cp .env.example .env
```

### 3. Run migrations

```bash
cd backend
npm run migrate
```

### 4. Start backend

```bash
cd backend
npm run dev
# or npm start
```

Backend: `http://localhost:5000`

### 5. Start frontend

```bash
cd frontend
npm start
```

Frontend: `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Runtime mode | `development` |
| `JWT_SECRET` | JWT signing secret | required |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `CURRENCY_API_KEY` | CurrencyLayer API key (optional) | empty/fallback |
| `CURRENCY_API_URL` | Currency API base URL | `http://apilayer.net/api` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

Note: `DB_*` fields still exist in `.env.example` for compatibility, but current runtime storage is SQLite in `data/ecommerce.sqlite`.

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL | `/api` |

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Profile
- `GET /api/profile`
- `POST /api/profile`
- `PATCH /api/profile/planner`
- `PATCH /api/profile/operational-costs`
- `PATCH /api/profile/sales-forecast`
- `PATCH /api/profile/tax-legal`
- `PATCH /api/profile/cashflow-plan`
- `PATCH /api/profile/scalability`

### Products
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/:id/margin`

### Forecast
- `GET /api/forecast`
- `POST /api/forecast`
- `POST /api/forecast/simulate`
- `GET /api/forecast/breakeven`

### Cash Flow
- `GET /api/cashflow`
- `POST /api/cashflow`
- `DELETE /api/cashflow/:id`
- `GET /api/cashflow/summary`
- `POST /api/cashflow/inject`

### Partners
- `GET /api/partners`
- `POST /api/partners`
- `DELETE /api/partners/:id`
- `GET /api/partners/distribution`

### Analytics
- `GET /api/analytics/kpis`
- `GET /api/analytics/profitability`
- `GET /api/analytics/returns`
- `GET /api/analytics/monthly-trends`
- `GET /api/analytics/product-performance`

### Reports
- `GET /api/reports/excel`
- `GET /api/reports/pdf`
- `GET /api/reports/csv`

### Currency
- `GET /api/currency/rates`
- `GET /api/currency/convert`
- `GET /api/currency/taxes`

## Security

- Password hashing with bcrypt (12 rounds)
- JWT-protected private routes
- Rate limiting on `/api/*`
- Input validation on write routes
- Helmet security headers
- CORS restricted by `FRONTEND_URL`

## Project Structure

```text
ecommerce-planner/
  backend/
    src/
      app.js
      server.js
      db/
        pool.js
        migrate.js
      middleware/
        auth.js
        validate.js
      routes/
        auth.js
        profile.js
        products.js
        forecast.js
        cashflow.js
        partners.js
        analytics.js
        reports.js
        currency.js
  frontend/
    src/
      pages/
        Onboarding.js
        Dashboard.js
        Products.js
        Forecast.js
        CashFlow.js
        Partners.js
        Analytics.js
        Currency.js
        Reports.js
```
