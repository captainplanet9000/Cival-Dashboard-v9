# Cival Dashboard Database Migrations

This directory contains all the Supabase database migrations required for the Cival Trading Dashboard to function properly.

## Migration Overview

The dashboard requires a comprehensive database schema to support:
- Multi-agent autonomous trading systems
- Real-time portfolio management
- Risk management and compliance
- Paper trading simulation
- Advanced UI preferences and layouts
- Market data storage and analysis

## Migration Files

### Core Migrations (Required)

1. **008_trading_strategies_system.sql**
   - Trading strategy definitions and parameters
   - Strategy execution history and backtesting
   - Strategy performance metrics

2. **009_portfolio_market_data.sql**
   - Portfolio management and position tracking
   - Market data storage (OHLCV, live prices)
   - Technical indicators and market events

3. **010_paper_trading_system.sql**
   - Paper trading sessions and simulation
   - Virtual trades and positions
   - Performance tracking and trade journal

4. **011_risk_management_system.sql**
   - Risk profiles and limits
   - Risk metrics calculation (VaR, Sharpe ratio, etc.)
   - Stress testing and alerts

5. **012_dashboard_ui_preferences.sql**
   - Dashboard layouts and themes
   - Component preferences and sortable configurations
   - Feature flags and notification settings

### Setup Script

- **setup_complete_dashboard.sql**
  - Complete database setup with extensions
  - Utility functions and triggers
  - System configuration and audit logging
  - Materialized views for performance

## Installation Instructions

### Method 1: Using Supabase CLI (Recommended)

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Apply all migrations in order
npx supabase db push

# Or apply individual migrations
npx supabase migration new trading_strategies_system --create-only
# Copy content from 008_trading_strategies_system.sql
npx supabase db push

# Verify migrations
npx supabase db diff
```

### Method 2: Manual SQL Execution

1. Connect to your Supabase database
2. Run the setup script first:
   ```sql
   \i supabase/setup_complete_dashboard.sql
   ```
3. Run migrations in order:
   ```sql
   \i supabase/migrations/008_trading_strategies_system.sql
   \i supabase/migrations/009_portfolio_market_data.sql
   \i supabase/migrations/010_paper_trading_system.sql
   \i supabase/migrations/011_risk_management_system.sql
   \i supabase/migrations/012_dashboard_ui_preferences.sql
   ```

### Method 3: Using Database Management Tool

Import and execute each SQL file in your preferred database management tool (pgAdmin, DBeaver, etc.) in the order listed above.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URL (for direct connections)
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: API Keys for market data
BINANCE_API_KEY=your_binance_api_key
COINBASE_API_KEY=your_coinbase_api_key
```

## Verification Steps

After running all migrations, verify the setup:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check system configuration
SELECT * FROM system_configuration;

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test materialized view
SELECT * FROM portfolio_summary_mv LIMIT 5;
```

## Key Features Enabled

### Trading System
- ✅ Multi-strategy trading framework
- ✅ Real-time portfolio tracking
- ✅ Paper trading simulation
- ✅ Risk management and alerts

### Data Management
- ✅ Market data storage (OHLCV, live prices)
- ✅ Technical indicators caching
- ✅ Performance metrics calculation
- ✅ Audit logging for compliance

### User Experience
- ✅ Customizable dashboard layouts
- ✅ Component preferences
- ✅ Notification management
- ✅ Chart configurations

### Security & Compliance
- ✅ Row Level Security (RLS) on all tables
- ✅ Encrypted API key storage
- ✅ Comprehensive audit logging
- ✅ User access controls

## Default Data

The migrations include default data for:
- Risk profiles (Conservative, Moderate, Aggressive)
- Trading strategies (Momentum, Mean Reversion, etc.)
- System configurations
- Notification preferences

## Performance Optimizations

- **Indexes**: Optimized for common query patterns
- **Materialized Views**: Portfolio summaries for fast lookups
- **Partitioning**: Ready for time-series data partitioning
- **Caching**: Technical indicators and market data caching

## Backup and Recovery

Before running migrations in production:

```bash
# Backup existing database
pg_dump -h hostname -U username -d database > backup.sql

# Test migrations on staging first
# Then apply to production
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure your database user has CREATE privileges
2. **Extension Errors**: Enable required extensions (uuid-ossp, pgcrypto)
3. **RLS Conflicts**: Disable RLS temporarily if needed during migration
4. **Foreign Key Errors**: Run setup script first to create referenced tables

### Reset Database (Development Only)

```sql
-- WARNING: This will delete all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run migrations again
```

## Support

For migration issues:
1. Check the Supabase logs
2. Verify all prerequisites are met
3. Test on a development database first
4. Review the migration files for any customizations needed

## Next Steps

After successful migration:
1. Configure your frontend environment variables
2. Test the dashboard connectivity
3. Set up real-time subscriptions
4. Configure market data sources
5. Create your first trading strategy

The dashboard should now be fully functional with complete database support for all features!