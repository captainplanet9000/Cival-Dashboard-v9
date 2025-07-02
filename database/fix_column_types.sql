-- Fix column type mismatches
-- This script corrects the agent_id columns to be UUID type

-- Fix agent_performance.agent_id column type
ALTER TABLE public.agent_performance 
ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;

-- Fix agent_state.agent_id column type  
ALTER TABLE public.agent_state 
ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;

-- Verify the changes
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

COMMIT;