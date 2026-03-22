# ⚡ EcomPlanner: Advanced E-commerce Business Suite

A full-stack, premium planning and financial modeling application for pre-launch and growing e-commerce businesses.

Last updated: March 2026.

## 🌟 About This Application

**EcomPlanner** helps e-commerce founders plan their business before launch and track key financial decisions in one centralized command center. 

Recently overhauled to feature a stunning **Premium Dark-Mode UI**, the application embraces a **"Beginner to Advanced"** philosophy. New users can simply walk through 7 guided calculators to validate their business idea, while experienced operators can dive straight into complex 12-month forecasting, cash flow modeling, and partner equity distributions.

---

## 🚀 The Beginner Toolkit (New!)

We've added 7 standalone sandbox tools designed specifically for first-time founders to test the waters:

1. **Start Here (Business Wizard):** Create an entire baseline business plan in 2 minutes.
2. **Profit Per Order:** If you sell exactly 1 unit, how much profit do you actually pocket after shipping, packaging, and ads?
3. **Pricing Tool:** Work backward from your target profit margin to find the exact selling price you should charge.
4. **Startup Budget:** Calculate the exact capital required to launch (stock, website, legal, emergency reserves).
5. **Ads Calculator:** Forecast Cost Per Click (CPC), acquisition costs (CPA), and Return on Ad Spend (ROAS).
6. **COD & Returns:** See the devastating impact of failed deliveries (RTOs) on your margins — crucial for markets like Pakistan and India.
7. **Goal Planner:** Working backward from an income goal to tell you exactly how many website visitors and orders you need daily.

---

## 📊 Advanced Modules (For Operating Businesses)

Once your baseline is established, scale up using the advanced command center:

- **Dashboard:** Features a live "Business Health Score" (0-100), setup checklist, and dynamic KPI cards.
- **Product Catalog:** Manage COGS, selling prices, and live margin status (green/yellow/red indicators).
- **Sales Forecast:** Project 12-month revenue growth based on unit targets, expected traffic, and new product launches.
- **Cash Flow Management:** Track real operating inflows, outflows, and model capital injections to avoid going bankrupt.
- **Partners & Equity:** Manage investor equity %, profit-sharing distributions, and track Return on Equity (ROE).
- **Deep Analytics:** Visualize revenue vs. cost trends, product performance breakdowns, and break-even points via Chart.js.
- **Global Currency System:** Currency symbols and formatting automatically adapt across the entire app based on your profile selection.
- **Export Reports:** Generate professional PDF, Excel, and CSV reports for investors or banks.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router v6, Chart.js, Lucide Icons, Vanilla CSS (Premium Dark Mode)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (via `pg` and schema migrations)
- **Auth:** JWT + bcrypt
- **Security:** Helmet, express-rate-limit, request validation

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Create `.env` files in both backend and frontend directories using provided `.env.example` templates.

**Backend `.env`:**
```env
PORT=5000
NODE_ENV=development
DB_USER=postgres
DB_HOST=localhost
DB_NAME=ecommerce_planner
DB_PASSWORD=yourpassword
DB_PORT=5432
JWT_SECRET=supersecretjwtkey
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run database migrations

```bash
cd backend
npm run migrate
```

### 4. Start the Application

**Run Backend:**
```bash
cd backend
npm run dev
```

**Run Frontend:**
```bash
cd frontend
npm start
```

Access the app at: `http://localhost:3000`

---

## 🔒 Security & Architecture

- Password hashing with `bcrypt` (12 rounds)
- JWT-protected private API routes
- Rate limiting on all `/api/*` endpoints
- Input sanitization via `express-validator`
- Global React Context for authentication routing and dynamic currency formatting

---

## 📂 Project Structure Snapshot

```text
ecommerce-planner/
  backend/
    src/
      db/
        index.js          # PostgreSQL pool setup
        migrate.js        # Table creation & migrations
      routes/
        auth.js           # JWT issuing
        profile.js        # Business profile & global currency
        products.js       # Catalog CRUD
        forecast.js       # 12-mo projections
        cashflow.js       # Cash flow logs
        analytics.js      # Aggregation & KPIs
  frontend/
    src/
      context/
        AuthContext.js    # JWT state
        CurrencyContext.js # Global symbol & formatting
      pages/
        Dashboard.js      # Command center
        calculators/      # 7 Beginner Sandbox tools
          BeginnerWizard.js
          ProfitPerOrder.js
          PricingTool.js
          ...
        Analytics.js      # Charts
        Products.js       # Data tables
```
