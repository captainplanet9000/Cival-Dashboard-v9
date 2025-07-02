-- Check what columns actually exist in agent_performance table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_performance'
ORDER BY ordinal_position;