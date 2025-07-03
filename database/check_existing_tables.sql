-- Check existing table structures to fix foreign key references
-- Run this first to see what columns actually exist

-- Check farms table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'farms'
ORDER BY ordinal_position;

-- Check goals table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'goals'
ORDER BY ordinal_position;

-- Check agents table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agents'
ORDER BY ordinal_position;

-- Check if auth.users exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;