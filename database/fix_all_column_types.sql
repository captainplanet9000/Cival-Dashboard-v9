-- Fix all agent_id column types to be UUID consistently

-- Check current types first
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
AND column_name = 'agent_id'

UNION ALL

SELECT 
    'agent_thoughts' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_thoughts'
AND column_name = 'agent_id'

UNION ALL

SELECT 
    'agent_decisions' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_decisions'
AND column_name = 'agent_id';

-- Fix agent_performance.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_performance' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.agent_performance 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed agent_performance.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'agent_performance.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix agent_performance.agent_id: %', SQLERRM;
END $$;

-- Fix agent_thoughts.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_thoughts' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.agent_thoughts 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed agent_thoughts.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'agent_thoughts.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix agent_thoughts.agent_id: %', SQLERRM;
END $$;

-- Fix agent_decisions.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_decisions' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.agent_decisions 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed agent_decisions.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'agent_decisions.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix agent_decisions.agent_id: %', SQLERRM;
END $$;

-- Fix agent_memory.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_memory' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.agent_memory 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed agent_memory.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'agent_memory.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix agent_memory.agent_id: %', SQLERRM;
END $$;

-- Fix agent_group_memberships.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_group_memberships' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.agent_group_memberships 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed agent_group_memberships.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'agent_group_memberships.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix agent_group_memberships.agent_id: %', SQLERRM;
END $$;

-- Fix coordination_messages.from_agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'coordination_messages' 
               AND column_name = 'from_agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.coordination_messages 
        ALTER COLUMN from_agent_id TYPE UUID USING from_agent_id::UUID;
        RAISE NOTICE 'Fixed coordination_messages.from_agent_id to UUID type';
    ELSE
        RAISE NOTICE 'coordination_messages.from_agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix coordination_messages.from_agent_id: %', SQLERRM;
END $$;

-- Fix coordination_messages.to_agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'coordination_messages' 
               AND column_name = 'to_agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.coordination_messages 
        ALTER COLUMN to_agent_id TYPE UUID USING to_agent_id::UUID;
        RAISE NOTICE 'Fixed coordination_messages.to_agent_id to UUID type';
    ELSE
        RAISE NOTICE 'coordination_messages.to_agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix coordination_messages.to_agent_id: %', SQLERRM;
END $$;

-- Fix rl_q_values.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'rl_q_values' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.rl_q_values 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed rl_q_values.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'rl_q_values.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix rl_q_values.agent_id: %', SQLERRM;
END $$;

-- Fix rl_experiences.agent_id if it's not UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'rl_experiences' 
               AND column_name = 'agent_id' 
               AND data_type = 'character varying') THEN
        ALTER TABLE public.rl_experiences 
        ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
        RAISE NOTICE 'Fixed rl_experiences.agent_id to UUID type';
    ELSE
        RAISE NOTICE 'rl_experiences.agent_id is already correct type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not fix rl_experiences.agent_id: %', SQLERRM;
END $$;

-- Verify all types are now consistent
SELECT 
    'Final verification - agents' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agents'
AND column_name = 'id'

UNION ALL

SELECT 
    'Final verification - agent_performance' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_performance'
AND column_name = 'agent_id'

UNION ALL

SELECT 
    'Final verification - agent_state' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_state'
AND column_name = 'agent_id';

COMMIT;