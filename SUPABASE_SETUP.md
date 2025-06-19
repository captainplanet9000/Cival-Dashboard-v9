# Supabase Setup Guide for Cival Dashboard

This guide will help you set up your Supabase database for the Cival Trading Dashboard.

## Prerequisites

- Supabase account and project created
- Supabase CLI installed (optional but recommended)
- PostgreSQL client (psql) or Supabase Dashboard access

## Option 1: Using Supabase Dashboard (Easiest)

### Step 1: Run Migration Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20241219_missing_tables.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

### Step 2: Run Seed Data

1. Still in SQL Editor, click **New Query**
2. Copy the entire contents of `supabase/seed.sql`
3. Paste into the SQL editor
4. Click **Run**

### Step 3: Enable Real-time

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Enable replication for these tables:
   - positions
   - orders
   - market_data
   - agent_decisions
   - trading_signals
   - alerts
   - risk_metrics

## Option 2: Using Supabase CLI

### Step 1: Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

### Step 2: Initialize Supabase

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Your project ref is in your Supabase URL: https://YOUR-PROJECT-REF.supabase.co
```

### Step 3: Run Migrations

```bash
# Create migration from our SQL file
supabase migration new add_trading_tables

# Copy the migration content
cp supabase/migrations/20241219_missing_tables.sql supabase/migrations/[timestamp]_add_trading_tables.sql

# Push to remote database
supabase db push
```

### Step 4: Run Seed Data

```bash
# Run seed data
supabase db seed -f supabase/seed.sql
```

## Option 3: Using Direct Database Connection

### Step 1: Get Database Connection String

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Copy the connection string (use the one with password)
3. Add to your `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 2: Run Scripts Using psql

```bash
# Run migration
psql $DATABASE_URL -f supabase/migrations/20241219_missing_tables.sql

# Run seed data
psql $DATABASE_URL -f supabase/seed.sql
```

### Step 3: Or Use the Provided Script

```bash
# Make sure .env.local is configured
./scripts/setup-database.sh
```

## Option 4: Manual Table Creation (If Scripts Fail)

If you encounter issues, you can create tables one by one:

### 1. Orders Table
```sql
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES autonomous_agents(id),
    strategy_id UUID REFERENCES trading_strategies(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    stop_price DECIMAL(20,8),
    status VARCHAR(20) DEFAULT 'pending',
    filled_quantity DECIMAL(20,8) DEFAULT 0,
    average_fill_price DECIMAL(20,8),
    exchange VARCHAR(50),
    exchange_order_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 2. Risk Metrics Table
```sql
CREATE TABLE IF NOT EXISTS risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES wallets(id),
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(20,8) NOT NULL,
    timeframe VARCHAR(20),
    confidence_level DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 3. Alerts Table
```sql
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

## Environment Configuration

### Required Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Database Direct Connection
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Where to Find These Values

1. **Supabase URL & Keys**: 
   - Go to **Settings** → **API** in Supabase Dashboard
   - Copy the URL and anon/public key
   - Service role key is under "Service role key" (keep this secret!)

2. **Database URL**: 
   - Go to **Settings** → **Database**
   - Use the connection string with your password

## Verification Steps

### 1. Check Tables Were Created

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all your tables including:
- orders
- risk_metrics
- alerts
- exchange_connections
- backtest_results
- audit_logs

### 2. Check Sample Data

```sql
-- Check if data was inserted
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as wallets FROM wallets;
SELECT COUNT(*) as agents FROM autonomous_agents;
SELECT COUNT(*) as strategies FROM trading_strategies;
```

### 3. Test Real-time

```sql
-- This should show enabled tables
SELECT * FROM pg_publication_tables;
```

## Troubleshooting

### Common Issues

1. **"relation does not exist" errors**
   - Some tables might already exist from your initial setup
   - The scripts use `IF NOT EXISTS` so this is safe
   - Continue with the next steps

2. **Permission denied errors**
   - Make sure you're using the correct database URL
   - Check that your user has necessary permissions

3. **Duplicate key errors**
   - The seed data uses `ON CONFLICT DO NOTHING`
   - These errors are safe to ignore

4. **Real-time not working**
   - Enable replication manually in Dashboard
   - Go to Database → Replication → Enable for tables

## Quick Test

After setup, test your connection:

```javascript
// In your browser console on the dashboard
const response = await fetch('/api/v1/portfolio/summary');
const data = await response.json();
console.log('Portfolio:', data);
```

## Next Steps

1. Start the backend API:
   ```bash
   cd python-ai-services
   python main_consolidated.py
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Access the dashboard:
   ```
   http://localhost:3000/dashboard
   ```

## Support

If you encounter issues:
1. Check the Supabase logs in Dashboard → Logs
2. Verify all environment variables are set correctly
3. Ensure all table references exist (users, wallets, etc.)
4. Try running scripts one section at a time

The dashboard is now ready for trading operations! 🚀