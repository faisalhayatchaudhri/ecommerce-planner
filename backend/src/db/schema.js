const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business profiles
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL, -- dropshipping, direct_sales, subscription, marketplace
  target_market TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  shipping_regions TEXT[],
  payment_methods TEXT[],
  monthly_traffic_estimate INTEGER DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_region VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cogs DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost_local DECIMAL(12,2) DEFAULT 0,
  shipping_cost_international DECIMAL(12,2) DEFAULT 0,
  platform_fee_pct DECIMAL(5,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly operating costs
CREATE TABLE IF NOT EXISTS operating_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  advertising_spend DECIMAL(12,2) DEFAULT 0,
  platform_fees DECIMAL(12,2) DEFAULT 0,
  salaries DECIMAL(12,2) DEFAULT 0,
  other_overheads DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales forecasts
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  units_sold INTEGER DEFAULT 0,
  average_order_value DECIMAL(12,2) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  traffic_estimate INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash flow records
CREATE TABLE IF NOT EXISTS cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  type VARCHAR(50) NOT NULL, -- inflow | outflow | funding
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partners / investors
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  equity_pct DECIMAL(5,4) DEFAULT 0,
  capital_invested DECIMAL(12,2) DEFAULT 0,
  investment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user ON sales_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_user ON cash_flow(user_id);
CREATE INDEX IF NOT EXISTS idx_costs_user ON operating_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_user ON partners(user_id);
`;

const alterStatements = [
  'ALTER TABLE business_profiles ADD COLUMN country VARCHAR(100)',
  'ALTER TABLE business_profiles ADD COLUMN planned_products_count INTEGER DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN planned_asp DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN planned_cogs DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN monthly_platform_cost DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN monthly_website_hosting_cost DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN monthly_marketing_budget DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN payment_gateway_fee_pct DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN monthly_sales_target INTEGER DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN monthly_traffic_forecast INTEGER DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN expected_conversion_rate DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN expected_average_selling_price DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN sales_tax_rate DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN import_duties_pct DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN vat_gst_rate DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN initial_investment_amount DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN monthly_cash_injection DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN cash_injection_months INTEGER DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN projected_monthly_growth_rate DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN future_product_launches_year1 INTEGER DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_initial_stock DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_website_setup DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_branding DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_photography DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_ads_budget DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_legal DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN startup_emergency DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN cod_order_pct DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN rto_pct DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN courier_cod_fee_pct DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN cpc DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN target_monthly_income DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN target_profit_margin DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE business_profiles ADD COLUMN beginner_mode_completed BOOLEAN DEFAULT FALSE',
  'ALTER TABLE partners ADD COLUMN profit_share_pct DECIMAL(5,4) DEFAULT 0',
  'ALTER TABLE products ADD COLUMN packaging_cost DECIMAL(12,2) DEFAULT 0',
  'ALTER TABLE products ADD COLUMN ad_cost_per_order DECIMAL(12,2) DEFAULT 0'
];

module.exports = { schema, alterStatements };
