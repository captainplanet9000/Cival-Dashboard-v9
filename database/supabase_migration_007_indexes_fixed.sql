-- Agent Ecosystem Database Indexes - FIXED VERSION
-- Run this AFTER the tables have been created successfully
-- This version handles type mismatches and missing columns

-- ============================================================================
-- VERIFY TABLE EXISTS FIRST
-- ============================================================================

-- Check if agent_state table exists before creating any indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') THEN
        RAISE EXCEPTION 'agent_state table does not exist. Run tables script first.';
    END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE (SAFE VERSION)
-- ============================================================================

-- Market data indexes (these tables should definitely exist)
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol ON public.market_snapshots (symbol);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_time ON public.market_snapshots (snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol_time ON public.market_snapshots (symbol, snapshot_time DESC);

-- Coordination indexes
CREATE INDEX IF NOT EXISTS idx_coordination_groups_active ON public.coordination_groups (is_active);
CREATE INDEX IF NOT EXISTS idx_coordination_groups_strategy ON public.coordination_groups (strategy_name);

CREATE INDEX IF NOT EXISTS idx_agent_group_agent_id ON public.agent_group_memberships (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_group_group_id ON public.agent_group_memberships (group_id);
CREATE INDEX IF NOT EXISTS idx_agent_group_role ON public.agent_group_memberships (role);

CREATE INDEX IF NOT EXISTS idx_coordination_messages_group ON public.coordination_messages (group_id);
CREATE INDEX IF NOT EXISTS idx_coordination_messages_from ON public.coordination_messages (from_agent_id);
CREATE INDEX IF NOT EXISTS idx_coordination_messages_to ON public.coordination_messages (to_agent_id);
CREATE INDEX IF NOT EXISTS idx_coordination_messages_type ON public.coordination_messages (message_type);
CREATE INDEX IF NOT EXISTS idx_coordination_messages_priority ON public.coordination_messages (priority DESC);
CREATE INDEX IF NOT EXISTS idx_coordination_messages_sent ON public.coordination_messages (sent_at DESC);

-- RL indexes
CREATE INDEX IF NOT EXISTS idx_rl_q_values_agent_id ON public.rl_q_values (agent_id);
CREATE INDEX IF NOT EXISTS idx_rl_q_values_q_value ON public.rl_q_values (q_value DESC);
CREATE INDEX IF NOT EXISTS idx_rl_q_values_updated ON public.rl_q_values (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rl_experiences_agent_id ON public.rl_experiences (agent_id);
CREATE INDEX IF NOT EXISTS idx_rl_experiences_episode ON public.rl_experiences (episode_id);
CREATE INDEX IF NOT EXISTS idx_rl_experiences_reward ON public.rl_experiences (reward_received DESC);
CREATE INDEX IF NOT EXISTS idx_rl_experiences_experienced ON public.rl_experiences (experienced_at DESC);

-- Agent state indexes - ONLY CREATE IF COLUMNS EXIST
DO $$
BEGIN
    -- Check if updated_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_state' 
               AND column_name = 'updated_at') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_state_updated ON public.agent_state (updated_at DESC);
        RAISE NOTICE 'Created index on agent_state.updated_at';
    ELSE
        RAISE NOTICE 'Column updated_at does not exist in agent_state table';
    END IF;

    -- Check if health_score column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'agent_state' 
               AND column_name = 'health_score') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_state_health ON public.agent_state (health_score);
        RAISE NOTICE 'Created index on agent_state.health_score';
    ELSE
        RAISE NOTICE 'Column health_score does not exist in agent_state table - skipping index creation';
    END IF;
END $$;

-- ============================================================================
-- VIEWS FOR EASY DATA ACCESS (TYPE-SAFE VERSION)
-- ============================================================================

-- Create a simple view first to test basic functionality
CREATE OR REPLACE VIEW public.agent_basic_summary AS
SELECT 
    a.id,
    a.name,
    a.strategy_type,
    a.status,
    a.current_capital,
    a.initial_capital,
    (a.current_capital - a.initial_capital) AS total_pnl,
    a.last_active_at,
    a.created_at
FROM public.agents a;

-- Agent coordination summary view (simpler version)
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

-- Create the full performance view with explicit type casting
DO $$
BEGIN
    -- Check if agent_performance table exists and has compatible types
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_performance') THEN
        -- Create view with explicit casting to handle type mismatches
        EXECUTE '
        CREATE OR REPLACE VIEW public.agent_performance_summary AS
        SELECT 
            a.id,
            a.name,
            a.strategy_type,
            a.status,
            a.current_capital,
            a.initial_capital,
            (a.current_capital - a.initial_capital) AS total_pnl,
            ((a.current_capital - a.initial_capital) / a.initial_capital * 100) AS total_return_pct,
            
            -- Recent performance (last 30 days) with explicit casting
            ap.total_trades,
            ap.win_rate,
            ap.sharpe_ratio,
            ap.max_drawdown,
            ap.profit_factor,
            
            -- Activity
            a.last_active_at,
            a.created_at
            
        FROM public.agents a
        LEFT JOIN public.agent_performance ap ON a.id::text = ap.agent_id::text
            AND ap.period_type = ''monthly'' 
            AND ap.period_start >= NOW() - INTERVAL ''30 days'';
        ';
        RAISE NOTICE 'Created agent_performance_summary view with type casting';
    ELSE
        RAISE NOTICE 'agent_performance table does not exist - skipping performance view';
    END IF;
END $$;

-- Add agent_state to the view if it exists and has compatible columns
DO $$
DECLARE
    has_agent_state boolean := false;
    has_portfolio_value boolean := false;
    has_unrealized_pnl boolean := false;
    has_current_drawdown boolean := false;
    has_last_heartbeat boolean := false;
BEGIN
    -- Check if agent_state table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') INTO has_agent_state;
    
    IF has_agent_state THEN
        -- Check which columns exist
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'portfolio_value') INTO has_portfolio_value;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'unrealized_pnl') INTO has_unrealized_pnl;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'current_drawdown') INTO has_current_drawdown;
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_state' AND column_name = 'last_heartbeat') INTO has_last_heartbeat;
        
        -- Recreate the view with agent_state data if columns exist
        IF has_portfolio_value AND has_unrealized_pnl AND has_current_drawdown AND has_last_heartbeat THEN
            EXECUTE '
            CREATE OR REPLACE VIEW public.agent_performance_summary AS
            SELECT 
                a.id,
                a.name,
                a.strategy_type,
                a.status,
                a.current_capital,
                a.initial_capital,
                (a.current_capital - a.initial_capital) AS total_pnl,
                ((a.current_capital - a.initial_capital) / a.initial_capital * 100) AS total_return_pct,
                
                -- Recent performance (last 30 days) with explicit casting
                ap.total_trades,
                ap.win_rate,
                ap.sharpe_ratio,
                ap.max_drawdown,
                ap.profit_factor,
                
                -- State information
                ast.portfolio_value,
                ast.unrealized_pnl,
                ast.current_drawdown,
                ast.last_heartbeat,
                
                -- Activity
                a.last_active_at,
                a.created_at
                
            FROM public.agents a
            LEFT JOIN public.agent_performance ap ON a.id::text = ap.agent_id::text
                AND ap.period_type = ''monthly'' 
                AND ap.period_start >= NOW() - INTERVAL ''30 days''
            LEFT JOIN public.agent_state ast ON a.id::text = ast.agent_id::text;
            ';
            RAISE NOTICE 'Updated agent_performance_summary view with agent_state data';
        ELSE
            RAISE NOTICE 'Some agent_state columns missing - using basic performance view';
        END IF;
    ELSE
        RAISE NOTICE 'agent_state table does not exist - using basic performance view';
    END IF;
END $$;

-- ============================================================================
-- SCHEDULED JOBS (if pg_cron is available)
-- ============================================================================

-- Only create scheduled jobs if the extension is available
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
            $$
            DELETE FROM public.agent_thoughts WHERE created_at < NOW() - INTERVAL '90 days';
            DELETE FROM public.coordination_messages WHERE sent_at < NOW() - INTERVAL '30 days';
            DELETE FROM public.market_snapshots WHERE snapshot_time < NOW() - INTERVAL '7 days';
            $$
        );
        
        RAISE NOTICE 'Created scheduled jobs with pg_cron';
    ELSE
        RAISE NOTICE 'pg_cron extension not available - skipping scheduled jobs';
    END IF;
END $$;

COMMIT;