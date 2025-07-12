-- Apply Backend Integration Migration
-- This script should be run in your Supabase SQL editor or via psql

-- Include the latest migration
\i supabase/migrations/20250712_backend_integration_complete.sql

-- Verify the migration was applied successfully
SELECT 
    schemaname, 
    tablename,
    tableowner 
FROM pg_tables 
WHERE tablename IN ('backend_integration_log', 'api_response_cache', 'backend_health_monitor')
ORDER BY tablename;

-- Check if functions were created
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname IN ('update_backend_health', 'cache_api_response', 'get_cached_api_response');

-- Test the backend health monitoring function
SELECT update_backend_health('test_service', 'active', 150);

-- Verify the test worked
SELECT * FROM backend_health_monitor WHERE service_name = 'test_service';

-- Clean up test data
DELETE FROM backend_health_monitor WHERE service_name = 'test_service';