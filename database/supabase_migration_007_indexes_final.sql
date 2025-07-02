-- Agent Ecosystem Database Indexes - FINAL VERSION
-- Run this AFTER fixing the column types
-- This version assumes all types are correct

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

-- Agent state indexes (now that types are correct)
CREATE INDEX IF NOT EXISTS idx_agent_state_updated ON public.agent_state (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_state_health ON public.agent_state (health_score);

-- ============================================================================
-- VIEWS FOR EASY DATA ACCESS
-- ============================================================================

-- Agent performance summary view (with correct UUID joins)
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
    
    -- Recent performance (last 30 days)
    ap.total_trades,
    ap.win_rate,
    ap.sharpe_ratio,
    ap.max_drawdown,
    ap.profit_factor,
    
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
LEFT JOIN public.agent_performance ap ON a.id = ap.agent_id 
    AND ap.period_type = 'monthly' 
    AND ap.period_start >= NOW() - INTERVAL '30 days'
LEFT JOIN public.agent_state ast ON a.id = ast.agent_id;

-- Agent coordination summary view
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

-- ============================================================================
-- SCHEDULED JOBS (if pg_cron is available)
-- ============================================================================

-- Daily performance calculation (runs at midnight)
SELECT cron.schedule(
    'calculate-daily-performance',
    '0 0 * * *',
    'SELECT calculate_agent_daily_performance();'
);

-- Clean old data (runs weekly)
SELECT cron.schedule(
    'cleanup-old-data',
    '0 2 * * 0',
    $$
    DELETE FROM public.agent_thoughts WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.coordination_messages WHERE sent_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.market_snapshots WHERE snapshot_time < NOW() - INTERVAL '7 days';
    $$
);

COMMIT;