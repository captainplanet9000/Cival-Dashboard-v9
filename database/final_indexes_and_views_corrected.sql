-- Final Indexes and Views - CORRECTED VERSION
-- This version creates views based on actual table structures

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Market data indexes
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

-- Agent state indexes
CREATE INDEX IF NOT EXISTS idx_agent_state_updated ON public.agent_state (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_state_health ON public.agent_state (health_score);

-- ============================================================================
-- VIEWS FOR EASY DATA ACCESS (SIMPLIFIED VERSION)
-- ============================================================================

-- Create a basic agent summary view first (without performance data)
CREATE OR REPLACE VIEW public.agent_basic_summary AS
SELECT 
    a.id,
    a.name,
    a.strategy_type,
    a.status,
    a.current_capital,
    a.initial_capital,
    (a.current_capital - a.initial_capital) AS total_pnl,
    ((a.current_capital - a.initial_capital) / a.initial_capital * 100) AS total_return_pct,
    a.last_active_at,
    a.created_at
FROM public.agents a;

-- Create agent state summary view
CREATE OR REPLACE VIEW public.agent_state_summary AS
SELECT 
    a.id,
    a.name,
    a.strategy_type,
    a.status,
    
    -- State information
    ast.portfolio_value,
    ast.unrealized_pnl,
    ast.current_drawdown,
    ast.health_score,
    ast.last_heartbeat,
    ast.learning_phase,
    ast.coordination_status,
    
    -- Activity
    a.last_active_at,
    a.created_at
    
FROM public.agents a
LEFT JOIN public.agent_state ast ON a.id = ast.agent_id;

-- Create a dynamic performance view based on what columns actually exist
DO $$
DECLARE
    has_period_type boolean := false;
    has_total_trades boolean := false;
    has_win_rate boolean := false;
    has_sharpe_ratio boolean := false;
    has_max_drawdown boolean := false;
    has_profit_factor boolean := false;
    view_sql text;
BEGIN
    -- Check which columns exist in agent_performance
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_performance' AND column_name = 'period_type') INTO has_period_type;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_performance' AND column_name = 'total_trades') INTO has_total_trades;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_performance' AND column_name = 'win_rate') INTO has_win_rate;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_performance' AND column_name = 'sharpe_ratio') INTO has_sharpe_ratio;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_performance' AND column_name = 'max_drawdown') INTO has_max_drawdown;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_performance' AND column_name = 'profit_factor') INTO has_profit_factor;
    
    -- Build the view SQL dynamically
    view_sql := 'CREATE OR REPLACE VIEW public.agent_performance_summary AS
    SELECT 
        a.id,
        a.name,
        a.strategy_type,
        a.status,
        a.current_capital,
        a.initial_capital,
        (a.current_capital - a.initial_capital) AS total_pnl,
        ((a.current_capital - a.initial_capital) / a.initial_capital * 100) AS total_return_pct';
        
    -- Add performance columns if they exist
    IF has_total_trades THEN
        view_sql := view_sql || ',
        ap.total_trades';
    END IF;
    
    IF has_win_rate THEN
        view_sql := view_sql || ',
        ap.win_rate';
    END IF;
    
    IF has_sharpe_ratio THEN
        view_sql := view_sql || ',
        ap.sharpe_ratio';
    END IF;
    
    IF has_max_drawdown THEN
        view_sql := view_sql || ',
        ap.max_drawdown';
    END IF;
    
    IF has_profit_factor THEN
        view_sql := view_sql || ',
        ap.profit_factor';
    END IF;
    
    -- Add state information
    view_sql := view_sql || ',
        
        -- State information
        ast.portfolio_value,
        ast.unrealized_pnl,
        ast.current_drawdown,
        ast.health_score,
        ast.last_heartbeat,
        
        -- Activity
        a.last_active_at,
        a.created_at
        
    FROM public.agents a
    LEFT JOIN public.agent_performance ap ON a.id = ap.agent_id';
    
    -- Add period filter only if period_type column exists
    IF has_period_type THEN
        view_sql := view_sql || '
        AND ap.period_type = ''monthly''
        AND ap.period_start >= NOW() - INTERVAL ''30 days''';
    END IF;
    
    view_sql := view_sql || '
    LEFT JOIN public.agent_state ast ON a.id = ast.agent_id;';
    
    -- Execute the dynamic SQL
    EXECUTE view_sql;
    
    RAISE NOTICE 'Created agent_performance_summary view with available columns';
    RAISE NOTICE 'period_type: %, total_trades: %, win_rate: %, sharpe_ratio: %, max_drawdown: %, profit_factor: %', 
                 has_period_type, has_total_trades, has_win_rate, has_sharpe_ratio, has_max_drawdown, has_profit_factor;
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