-- Check existing tables and their structure
-- Run this first to see what tables exist in your database

-- List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check specific table structures for key tables
-- Uncomment and run these individually to check each table:

-- Check users table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public';

-- Check wallets table structure  
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'wallets' AND table_schema = 'public';

-- Check autonomous_agents table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'autonomous_agents' AND table_schema = 'public';

-- Check trading_strategies table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'trading_strategies' AND table_schema = 'public';