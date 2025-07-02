-- Verify the agent_state table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_state'
ORDER BY ordinal_position;