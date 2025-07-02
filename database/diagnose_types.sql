-- Diagnose data type issues
SELECT 
    'agents' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agents'
AND column_name = 'id'

UNION ALL

SELECT 
    'agent_performance' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_performance'
AND column_name = 'agent_id'

UNION ALL

SELECT 
    'agent_state' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_state'
AND column_name = 'agent_id';