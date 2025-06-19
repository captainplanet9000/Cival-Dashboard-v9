# Database Setup Troubleshooting Guide

If you're getting foreign key errors, follow these steps in order:

## Step 1: Check What Tables Exist

Run this first to see your current database structure:

```sql
-- Copy and paste this into Supabase SQL Editor
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Step 2: Check Table Structures

For each important table, check if it has the required columns:

```sql
-- Check wallets table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check users table structure  
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check autonomous_agents table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'autonomous_agents' AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Step 3: Fix Your Existing Tables

Based on the error you got, your tables exist but are missing key columns. Run this script to fix them:

**File: `sql-scripts/02-fix-existing-tables.sql`**

This script will:
- Add missing `id` columns to existing tables
- Add any other missing columns like `name`, `type`, etc.
- Set up proper primary keys
- Add foreign key constraints safely

## Step 4: Run Migration Without Foreign Keys

If you're still having issues, use this safer migration:

**File: `sql-scripts/03-migration-without-foreign-keys.sql`**

This creates all the new tables (orders, alerts, etc.) without foreign key constraints, so it won't fail if the referenced tables don't exist.

## Step 5: Add Simplified Seed Data

Use the simplified seed data that checks if tables exist before inserting:

**File: `sql-scripts/04-simplified-seed-data.sql`**

## Quick Fix Scripts

### Option A: If you want to start fresh
```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then run the complete migration
```

### Option B: If you want to keep existing data
Run these scripts in order:
1. `00-check-existing-tables.sql` (to see what you have)
2. `02-fix-existing-tables.sql` (to fix missing columns)
3. `03-migration-without-foreign-keys.sql` (to add new tables)
4. `04-simplified-seed-data.sql` (to add test data)

## Common Error Solutions

### Error: "column id does not exist"
**Solution:** Run `02-fix-existing-tables.sql` to add missing ID columns

### Error: "relation does not exist"
**Solution:** The table doesn't exist yet. Run `01-create-missing-base-tables.sql` first

### Error: "foreign key constraint fails"
**Solution:** Use `03-migration-without-foreign-keys.sql` instead

### Error: "duplicate key value violates unique constraint"
**Solution:** Data already exists. The scripts use `ON CONFLICT DO NOTHING` so this is safe to ignore

## Manual Table Creation

If scripts keep failing, create tables manually one by one:

### 1. Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Wallets Table
```sql
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    balance DECIMAL(20,8) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USDT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Orders Table (No Foreign Keys)
```sql
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Verification

After running any script, verify it worked:

```sql
-- Check if new tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN 
('orders', 'alerts', 'risk_metrics', 'exchange_connections')
ORDER BY table_name;

-- Check if data was inserted
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL  
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts;
```

## Next Steps

Once your database is set up:

1. Update your `.env.local` with correct Supabase credentials
2. Test the connection:
   ```bash
   # Start backend
   cd python-ai-services
   python main_consolidated.py
   
   # Start frontend
   npm run dev
   ```
3. Visit `http://localhost:3000/dashboard`

## Get Help

If you're still stuck:
1. Share the output of the "Check What Tables Exist" query
2. Share the exact error message you're getting
3. Let me know which script you tried to run

## Emergency Reset

If everything is broken and you want to start completely fresh:

```sql
-- WARNING: This deletes EVERYTHING!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Then run: 01-create-missing-base-tables.sql
-- Then run: 03-migration-without-foreign-keys.sql  
-- Then run: 04-simplified-seed-data.sql
```