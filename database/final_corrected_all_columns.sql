-- Final Indexes and Views - FULLY CORRECTED VERSION
-- This version checks ALL columns before using them

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE (only if tables exist)
-- ============================================================================

-- Market data indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_snapshots') THEN
        CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol ON public.market_snapshots (symbol);
        CREATE INDEX IF NOT EXISTS idx_market_snapshots_time ON public.market_snapshots (snapshot_time DESC);
        CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol_time ON public.market_snapshots (symbol, snapshot_time DESC);
        RAISE NOTICE 'Created market_snapshots indexes';
    ELSE
        RAISE NOTICE 'market_snapshots table does not exist - skipping indexes';
    END IF;
END $$;

-- Coordination indexes (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coordination_groups') THEN
        CREATE INDEX IF NOT EXISTS idx_coordination_groups_active ON public.coordination_groups (is_active);
        CREATE INDEX IF NOT EXISTS idx_coordination_groups_strategy ON public.coordination_groups (strategy_name);
        RAISE NOTICE 'Created coordination_groups indexes';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_group_memberships') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_group_agent_id ON public.agent_group_memberships (agent_id);
        CREATE INDEX IF NOT EXISTS idx_agent_group_group_id ON public.agent_group_memberships (group_id);
        CREATE INDEX IF NOT EXISTS idx_agent_group_role ON public.agent_group_memberships (role);
        RAISE NOTICE 'Created agent_group_memberships indexes';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coordination_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_coordination_messages_group ON public.coordination_messages (group_id);
        CREATE INDEX IF NOT EXISTS idx_coordination_messages_from ON public.coordination_messages (from_agent_id);
        CREATE INDEX IF NOT EXISTS idx_coordination_messages_to ON public.coordination_messages (to_agent_id);
        CREATE INDEX IF NOT EXISTS idx_coordination_messages_type ON public.coordination_messages (message_type);
        CREATE INDEX IF NOT EXISTS idx_coordination_messages_priority ON public.coordination_messages (priority DESC);
        CREATE INDEX IF NOT EXISTS idx_coordination_messages_sent ON public.coordination_messages (sent_at DESC);
        RAISE NOTICE 'Created coordination_messages indexes';
    END IF;
END $$;

-- RL indexes (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rl_q_values') THEN
        CREATE INDEX IF NOT EXISTS idx_rl_q_values_agent_id ON public.rl_q_values (agent_id);
        CREATE INDEX IF NOT EXISTS idx_rl_q_values_q_value ON public.rl_q_values (q_value DESC);
        CREATE INDEX IF NOT EXISTS idx_rl_q_values_updated ON public.rl_q_values (updated_at DESC);
        RAISE NOTICE 'Created rl_q_values indexes';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rl_experiences') THEN
        CREATE INDEX IF NOT EXISTS idx_rl_experiences_agent_id ON public.rl_experiences (agent_id);
        CREATE INDEX IF NOT EXISTS idx_rl_experiences_episode ON public.rl_experiences (episode_id);
        CREATE INDEX IF NOT EXISTS idx_rl_experiences_reward ON public.rl_experiences (reward_received DESC);
        CREATE INDEX IF NOT EXISTS idx_rl_experiences_experienced ON public.rl_experiences (experienced_at DESC);
        RAISE NOTICE 'Created rl_experiences indexes';
    END IF;
END $$;

-- Agent state indexes (if table exists and has the columns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') THEN
        -- Check if columns exist before creating indexes
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'updated_at') THEN
            CREATE INDEX IF NOT EXISTS idx_agent_state_updated ON public.agent_state (updated_at DESC);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'health_score') THEN
            CREATE INDEX IF NOT EXISTS idx_agent_state_health ON public.agent_state (health_score);
        END IF;
        
        RAISE NOTICE 'Created agent_state indexes';
    ELSE
        RAISE NOTICE 'agent_state table does not exist - skipping indexes';
    END IF;
END $$;

-- ============================================================================
-- VIEWS FOR EASY DATA ACCESS (DYNAMIC BASED ON ACTUAL COLUMNS)
-- ============================================================================

-- Create dynamic agent summary view based on what columns actually exist in agents table
DO $$
DECLARE
    has_strategy_type boolean := false;
    has_status boolean := false;
    has_current_capital boolean := false;
    has_initial_capital boolean := false;
    has_last_active_at boolean := false;
    has_created_at boolean := false;
    view_sql text;
BEGIN
    -- Check which columns exist in agents table
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'strategy_type') INTO has_strategy_type;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'status') INTO has_status;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'current_capital') INTO has_current_capital;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'initial_capital') INTO has_initial_capital;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'last_active_at') INTO has_last_active_at;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'created_at') INTO has_created_at;
    
    -- Build the view SQL dynamically
    view_sql := 'CREATE OR REPLACE VIEW public.agent_basic_summary AS
    SELECT 
        a.id';
    
    -- Add name if it exists (assuming it should exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'name') THEN
        view_sql := view_sql || ',
        a.name';
    END IF;
    
    -- Add optional columns
    IF has_strategy_type THEN
        view_sql := view_sql || ',
        a.strategy_type';
    END IF;
    
    IF has_status THEN
        view_sql := view_sql || ',
        a.status';
    END IF;
    
    IF has_current_capital THEN
        view_sql := view_sql || ',
        a.current_capital';
    END IF;
    
    IF has_initial_capital THEN
        view_sql := view_sql || ',
        a.initial_capital';
    END IF;
    
    -- Add calculated fields only if we have the required columns
    IF has_current_capital AND has_initial_capital THEN
        view_sql := view_sql || ',
        (a.current_capital - a.initial_capital) AS total_pnl,
        ((a.current_capital - a.initial_capital) / a.initial_capital * 100) AS total_return_pct';
    END IF;
    
    IF has_last_active_at THEN
        view_sql := view_sql || ',
        a.last_active_at';
    END IF;
    
    IF has_created_at THEN
        view_sql := view_sql || ',
        a.created_at';
    END IF;
    
    view_sql := view_sql || '
    FROM public.agents a;';
    
    -- Execute the dynamic SQL
    EXECUTE view_sql;
    
    RAISE NOTICE 'Created agent_basic_summary view with available columns';
    RAISE NOTICE 'strategy_type: %, status: %, current_capital: %, initial_capital: %, last_active_at: %, created_at: %', 
                 has_strategy_type, has_status, has_current_capital, has_initial_capital, has_last_active_at, has_created_at;
END $$;

-- Create agent state summary view (if agent_state table exists)
DO $$
DECLARE
    has_portfolio_value boolean := false;
    has_unrealized_pnl boolean := false;
    has_current_drawdown boolean := false;
    has_health_score boolean := false;
    has_last_heartbeat boolean := false;
    has_learning_phase boolean := false;
    has_coordination_status boolean := false;
    view_sql text;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') THEN
        -- Check which columns exist in agent_state table
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'portfolio_value') INTO has_portfolio_value;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'unrealized_pnl') INTO has_unrealized_pnl;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'current_drawdown') INTO has_current_drawdown;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'health_score') INTO has_health_score;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'last_heartbeat') INTO has_last_heartbeat;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'learning_phase') INTO has_learning_phase;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'coordination_status') INTO has_coordination_status;
        
        -- Build the view SQL dynamically
        view_sql := 'CREATE OR REPLACE VIEW public.agent_state_summary AS
        SELECT 
            a.id';
        
        -- Add name if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'name') THEN
            view_sql := view_sql || ',
            a.name';
        END IF;
        
        -- Add agent columns that exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'strategy_type') THEN
            view_sql := view_sql || ',
            a.strategy_type';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'status') THEN
            view_sql := view_sql || ',
            a.status';
        END IF;
        
        -- Add state columns if they exist
        IF has_portfolio_value THEN
            view_sql := view_sql || ',
            ast.portfolio_value';
        END IF;
        
        IF has_unrealized_pnl THEN
            view_sql := view_sql || ',
            ast.unrealized_pnl';
        END IF;
        
        IF has_current_drawdown THEN
            view_sql := view_sql || ',
            ast.current_drawdown';
        END IF;
        
        IF has_health_score THEN
            view_sql := view_sql || ',
            ast.health_score';
        END IF;
        
        IF has_last_heartbeat THEN
            view_sql := view_sql || ',
            ast.last_heartbeat';
        END IF;
        
        IF has_learning_phase THEN
            view_sql := view_sql || ',
            ast.learning_phase';
        END IF;
        
        IF has_coordination_status THEN
            view_sql := view_sql || ',
            ast.coordination_status';
        END IF;
        
        -- Add activity columns if they exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'last_active_at') THEN
            view_sql := view_sql || ',
            a.last_active_at';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'created_at') THEN
            view_sql := view_sql || ',
            a.created_at';
        END IF;
        
        view_sql := view_sql || '
        FROM public.agents a
        LEFT JOIN public.agent_state ast ON a.id = ast.agent_id;';
        
        -- Execute the dynamic SQL
        EXECUTE view_sql;
        
        RAISE NOTICE 'Created agent_state_summary view with available columns';
    ELSE
        RAISE NOTICE 'agent_state table does not exist - skipping agent_state_summary view';
    END IF;
END $$;

-- Create agent performance summary view (we know this table exists with the right columns)
DO $$
DECLARE
    view_sql text;
BEGIN
    -- Build the view SQL dynamically
    view_sql := 'CREATE OR REPLACE VIEW public.agent_performance_summary AS
    SELECT 
        a.id';
    
    -- Add name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'name') THEN
        view_sql := view_sql || ',
        a.name';
    END IF;
    
    -- Add agent columns that exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'strategy_type') THEN
        view_sql := view_sql || ',
        a.strategy_type';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'status') THEN
        view_sql := view_sql || ',
        a.status';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'current_capital') THEN
        view_sql := view_sql || ',
        a.current_capital';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'initial_capital') THEN
        view_sql := view_sql || ',
        a.initial_capital';
    END IF;
    
    -- Add calculated fields only if we have the required columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'current_capital') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'initial_capital') THEN
        view_sql := view_sql || ',
        (a.current_capital - a.initial_capital) AS total_pnl,
        ((a.current_capital - a.initial_capital) / a.initial_capital * 100) AS total_return_pct';
    END IF;
    
    -- Add performance columns (we know these exist from your table structure)
    view_sql := view_sql || ',
        ap.total_trades,
        ap.successful_trades,
        ap.failed_trades,
        ap.total_profit_loss,
        ap.win_rate,
        ap.sharpe_ratio,
        ap.max_drawdown';
    
    -- Add state information if agent_state table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'portfolio_value') THEN
            view_sql := view_sql || ',
            ast.portfolio_value';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'unrealized_pnl') THEN
            view_sql := view_sql || ',
            ast.unrealized_pnl';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'current_drawdown') THEN
            view_sql := view_sql || ',
            ast.current_drawdown';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'health_score') THEN
            view_sql := view_sql || ',
            ast.health_score';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'last_heartbeat') THEN
            view_sql := view_sql || ',
            ast.last_heartbeat';
        END IF;
    END IF;
    
    -- Add activity columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'last_active_at') THEN
        view_sql := view_sql || ',
        a.last_active_at';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'created_at') THEN
        view_sql := view_sql || ',
        a.created_at';
    END IF;
    
    -- Add performance table columns
    view_sql := view_sql || ',
        ap.date,
        ap.created_at AS performance_created_at,
        ap.updated_at AS performance_updated_at
        
    FROM public.agents a
    LEFT JOIN public.agent_performance ap ON a.id = ap.agent_id';
    
    -- Add agent_state join if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') THEN
        view_sql := view_sql || '
    LEFT JOIN public.agent_state ast ON a.id = ast.agent_id';
    END IF;
    
    view_sql := view_sql || ';';
    
    -- Execute the dynamic SQL
    EXECUTE view_sql;
    
    RAISE NOTICE 'Created agent_performance_summary view with available columns';
END $$;

-- Agent coordination summary view (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_group_memberships') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coordination_groups') THEN
        
        CREATE OR REPLACE VIEW public.agent_coordination_summary AS
        SELECT 
            a.id AS agent_id,
            a.name AS agent_name,
            cg.id AS group_id,
            cg.name AS group_name,
            cg.strategy_name,
            agm.role,
            agm.priority,
            agm.decisions_coordinated,
            agm.conflicts_caused,
            agm.signals_shared,
            cg.is_active AS group_active,
            cg.emergency_mode
            
        FROM public.agents a
        JOIN public.agent_group_memberships agm ON a.id = agm.agent_id
        JOIN public.coordination_groups cg ON agm.group_id = cg.id
        WHERE agm.is_active = true;
        
        RAISE NOTICE 'Created agent_coordination_summary view';
    ELSE
        RAISE NOTICE 'Coordination tables do not exist - skipping coordination view';
    END IF;
END $$;

-- ============================================================================
-- SCHEDULED JOBS (if pg_cron is available)
-- ============================================================================

-- Check if pg_cron extension is available before creating jobs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Daily performance calculation (runs at midnight)
        PERFORM cron.schedule(
            'calculate-daily-performance',
            '0 0 * * *',
            'SELECT calculate_agent_daily_performance();'
        );

        -- Clean old data (runs weekly)
        PERFORM cron.schedule(
            'cleanup-old-data',
            '0 2 * * 0',
            'DELETE FROM public.agent_thoughts WHERE created_at < NOW() - INTERVAL ''90 days''; DELETE FROM public.coordination_messages WHERE sent_at < NOW() - INTERVAL ''30 days''; DELETE FROM public.market_snapshots WHERE snapshot_time < NOW() - INTERVAL ''7 days'';'
        );
        
        RAISE NOTICE 'Successfully created scheduled jobs';
    ELSE
        RAISE NOTICE 'pg_cron extension not available - skipping scheduled jobs';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create scheduled jobs: %', SQLERRM;
END $$;

COMMIT;