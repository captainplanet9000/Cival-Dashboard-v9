-- Force fix the agent_performance table agent_id column

-- First, let's see what's in the agent_performance table
SELECT COUNT(*) as row_count FROM public.agent_performance;

-- Check if there are any rows that would prevent the conversion
SELECT agent_id, LENGTH(agent_id) as length, agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' as is_valid_uuid
FROM public.agent_performance 
LIMIT 5;

-- If the table is empty or has valid UUID strings, we can convert directly
-- If not, we'll need to clean the data first

-- Method 1: Direct conversion (try this first)
DO $$
BEGIN
    ALTER TABLE public.agent_performance 
    ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
    RAISE NOTICE 'Successfully converted agent_performance.agent_id to UUID';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Direct conversion failed: %', SQLERRM;
        
        -- Method 2: Drop and recreate the foreign key constraint, then convert
        BEGIN
            -- Drop the foreign key constraint temporarily
            ALTER TABLE public.agent_performance DROP CONSTRAINT IF EXISTS agent_performance_agent_id_fkey;
            RAISE NOTICE 'Dropped foreign key constraint';
            
            -- Try conversion again
            ALTER TABLE public.agent_performance 
            ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
            RAISE NOTICE 'Converted agent_id column to UUID';
            
            -- Recreate the foreign key constraint
            ALTER TABLE public.agent_performance 
            ADD CONSTRAINT agent_performance_agent_id_fkey 
            FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
            RAISE NOTICE 'Recreated foreign key constraint';
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Method 2 also failed: %', SQLERRM;
                
                -- Method 3: Clear invalid data and then convert
                BEGIN
                    -- Delete any rows with invalid agent_id values
                    DELETE FROM public.agent_performance 
                    WHERE agent_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                       OR agent_id IS NULL;
                    RAISE NOTICE 'Deleted invalid agent_id rows';
                    
                    -- Try conversion one more time
                    ALTER TABLE public.agent_performance 
                    ALTER COLUMN agent_id TYPE UUID USING agent_id::UUID;
                    RAISE NOTICE 'Finally converted agent_id to UUID after cleanup';
                    
                    -- Recreate the foreign key constraint
                    ALTER TABLE public.agent_performance 
                    ADD CONSTRAINT agent_performance_agent_id_fkey 
                    FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
                    RAISE NOTICE 'Recreated foreign key constraint after cleanup';
                    
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE NOTICE 'All methods failed: %', SQLERRM;
                        RAISE NOTICE 'Manual intervention may be required';
                END;
        END;
END $$;

-- Verify the final result
SELECT 
    'agent_performance' as table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_performance'
AND column_name = 'agent_id';

COMMIT;