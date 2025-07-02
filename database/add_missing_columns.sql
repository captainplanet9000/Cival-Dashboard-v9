-- Add any missing columns to agent_state table

-- Check if health_score column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agent_state' 
                   AND column_name = 'health_score') THEN
        ALTER TABLE public.agent_state ADD COLUMN health_score DECIMAL(3,2) DEFAULT 1.0;
        RAISE NOTICE 'Added health_score column to agent_state table';
    ELSE
        RAISE NOTICE 'health_score column already exists';
    END IF;
END $$;

-- Check if error_count column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agent_state' 
                   AND column_name = 'error_count') THEN
        ALTER TABLE public.agent_state ADD COLUMN error_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added error_count column to agent_state table';
    ELSE
        RAISE NOTICE 'error_count column already exists';
    END IF;
END $$;

-- Check if last_error_at column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agent_state' 
                   AND column_name = 'last_error_at') THEN
        ALTER TABLE public.agent_state ADD COLUMN last_error_at TIMESTAMPTZ;
        RAISE NOTICE 'Added last_error_at column to agent_state table';
    ELSE
        RAISE NOTICE 'last_error_at column already exists';
    END IF;
END $$;

-- Check if last_heartbeat column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agent_state' 
                   AND column_name = 'last_heartbeat') THEN
        ALTER TABLE public.agent_state ADD COLUMN last_heartbeat TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_heartbeat column to agent_state table';
    ELSE
        RAISE NOTICE 'last_heartbeat column already exists';
    END IF;
END $$;

-- Verify all columns now exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_state'
ORDER BY ordinal_position;

COMMIT;