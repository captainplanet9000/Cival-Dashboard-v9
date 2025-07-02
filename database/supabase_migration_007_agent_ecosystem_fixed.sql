-- Comprehensive Agent Ecosystem Database Schema - FIXED VERSION
-- Migration 007: Complete autonomous agent data model
-- Created: December 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- AGENT CORE TABLES
-- ============================================================================

-- Enhanced agents table with autonomous capabilities
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    strategy_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('active', 'paused', 'stopped', 'error')),
    
    -- Configuration
    initial_capital DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    current_capital DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    max_drawdown_limit DECIMAL(5,4) DEFAULT 0.15,
    risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    
    -- Autonomous settings
    autonomous_enabled BOOLEAN DEFAULT true,
    decision_frequency INTEGER DEFAULT 300, -- seconds
    learning_enabled BOOLEAN DEFAULT true,
    coordination_enabled BOOLEAN DEFAULT true,
    
    -- Integration settings
    wallet_address VARCHAR(255),
    vault_id UUID,
    api_keys JSONB DEFAULT '{}',
    
    -- Strategy parameters
    strategy_parameters JSONB DEFAULT '{}',
    risk_parameters JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'system',
    
    -- Constraints
    CONSTRAINT unique_agent_name UNIQUE(name)
);

-- Agent thoughts and reasoning
CREATE TABLE IF NOT EXISTS public.agent_thoughts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Thought classification
    thought_type VARCHAR(50) NOT NULL CHECK (thought_type IN ('analysis', 'decision', 'learning', 'strategy', 'risk', 'coordination')),
    content TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Context data
    market_context JSONB DEFAULT '{}',
    technical_signals JSONB DEFAULT '{}',
    portfolio_context JSONB DEFAULT '{}',
    
    -- LLM metadata
    llm_provider VARCHAR(50),
    model_used VARCHAR(100),
    processing_time_ms INTEGER,
    token_usage JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent decisions and actions
CREATE TABLE IF NOT EXISTS public.agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Decision details
    action VARCHAR(20) NOT NULL CHECK (action IN ('buy', 'sell', 'hold', 'reduce', 'increase', 'adjust_stop', 'adjust_target')),
    symbol VARCHAR(50) NOT NULL,
    quantity DECIMAL(15,6) NOT NULL DEFAULT 0,
    price DECIMAL(15,6),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Risk management
    stop_loss DECIMAL(15,6),
    take_profit DECIMAL(15,6),
    risk_amount DECIMAL(15,2),
    expected_return DECIMAL(15,2),
    time_horizon VARCHAR(50),
    
    -- Decision context
    reasoning TEXT NOT NULL,
    market_conditions JSONB DEFAULT '{}',
    technical_analysis JSONB DEFAULT '{}',
    sentiment_analysis JSONB DEFAULT '{}',
    
    -- Execution tracking
    execution_status VARCHAR(20) DEFAULT 'pending' CHECK (execution_status IN ('pending', 'executed', 'partial', 'cancelled', 'failed')),
    executed_at TIMESTAMPTZ,
    executed_price DECIMAL(15,6),
    executed_quantity DECIMAL(15,6),
    execution_fees DECIMAL(15,6) DEFAULT 0,
    
    -- Performance tracking
    outcome VARCHAR(20) CHECK (outcome IN ('win', 'loss', 'neutral', 'pending')),
    actual_return DECIMAL(15,2),
    return_percentage DECIMAL(8,4),
    hold_duration_minutes INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent memory and learning data
CREATE TABLE IF NOT EXISTS public.agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Memory classification
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN ('pattern', 'experience', 'parameter', 'insight', 'correlation', 'failure')),
    category VARCHAR(100) NOT NULL,
    
    -- Memory content
    content JSONB NOT NULL,
    summary TEXT,
    importance DECIMAL(3,2) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
    
    -- Learning metrics
    success_rate DECIMAL(5,4),
    occurrence_count INTEGER DEFAULT 1,
    avg_return DECIMAL(8,4),
    confidence_level DECIMAL(3,2),
    
    -- Context
    market_conditions JSONB DEFAULT '{}',
    associated_symbols TEXT[],
    timeframes TEXT[],
    
    -- Access tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ============================================================================
-- PERFORMANCE AND ANALYTICS TABLES
-- ============================================================================

-- Detailed agent performance tracking
CREATE TABLE IF NOT EXISTS public.agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Time period
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Trading metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Return metrics
    total_return DECIMAL(10,6) DEFAULT 0,
    realized_pnl DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    gross_profit DECIMAL(15,2) DEFAULT 0,
    gross_loss DECIMAL(15,2) DEFAULT 0,
    
    -- Risk metrics
    max_drawdown DECIMAL(5,4) DEFAULT 0,
    avg_drawdown DECIMAL(5,4) DEFAULT 0,
    volatility DECIMAL(6,4) DEFAULT 0,
    sharpe_ratio DECIMAL(6,4) DEFAULT 0,
    sortino_ratio DECIMAL(6,4) DEFAULT 0,
    calmar_ratio DECIMAL(6,4) DEFAULT 0,
    
    -- Trading efficiency
    avg_win_amount DECIMAL(15,2) DEFAULT 0,
    avg_loss_amount DECIMAL(15,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    avg_trade_duration_minutes INTEGER DEFAULT 0,
    
    -- Learning metrics
    decision_accuracy DECIMAL(5,4) DEFAULT 0,
    prediction_accuracy DECIMAL(5,4) DEFAULT 0,
    adaptation_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Coordination metrics
    coordination_score DECIMAL(5,4) DEFAULT 0,
    conflict_resolution_success DECIMAL(5,4) DEFAULT 0,
    signal_sharing_effectiveness DECIMAL(5,4) DEFAULT 0,
    
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_agent_period UNIQUE(agent_id, period_type, period_start)
);

-- Real-time agent state tracking
CREATE TABLE IF NOT EXISTS public.agent_state (
    agent_id UUID PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Current state
    current_positions JSONB DEFAULT '[]',
    pending_orders JSONB DEFAULT '[]',
    portfolio_value DECIMAL(15,2) DEFAULT 0,
    available_cash DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Risk state
    current_drawdown DECIMAL(5,4) DEFAULT 0,
    daily_pnl DECIMAL(15,2) DEFAULT 0,
    var_risk DECIMAL(15,2) DEFAULT 0,
    
    -- Trading state
    last_decision_at TIMESTAMPTZ,
    last_trade_at TIMESTAMPTZ,
    consecutive_losses INTEGER DEFAULT 0,
    consecutive_wins INTEGER DEFAULT 0,
    
    -- Learning state
    learning_phase VARCHAR(50) DEFAULT 'active',
    exploration_rate DECIMAL(3,2) DEFAULT 0.1,
    confidence_trend DECIMAL(3,2) DEFAULT 0.5,
    
    -- Coordination state
    coordination_status VARCHAR(50) DEFAULT 'available',
    last_signal_sent_at TIMESTAMPTZ,
    last_signal_received_at TIMESTAMPTZ,
    
    -- Health monitoring
    health_score DECIMAL(3,2) DEFAULT 1.0,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COORDINATION AND COMMUNICATION TABLES
-- ============================================================================

-- Agent coordination groups and strategies
CREATE TABLE IF NOT EXISTS public.coordination_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Coordination strategy
    strategy_name VARCHAR(100) NOT NULL,
    strategy_config JSONB NOT NULL DEFAULT '{}',
    
    -- Rules and limits
    max_concurrent_buys INTEGER DEFAULT 3,
    max_concurrent_sells INTEGER DEFAULT 3,
    max_portfolio_overlap DECIMAL(5,2) DEFAULT 50.0,
    min_capital_distribution DECIMAL(5,2) DEFAULT 20.0,
    conflict_resolution VARCHAR(50) DEFAULT 'confidence',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    emergency_mode BOOLEAN DEFAULT false,
    
    -- Performance
    total_coordinations INTEGER DEFAULT 0,
    successful_coordinations INTEGER DEFAULT 0,
    conflict_resolutions INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'system'
);

-- Agent group memberships
CREATE TABLE IF NOT EXISTS public.agent_group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.coordination_groups(id) ON DELETE CASCADE,
    
    -- Membership details
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'coordinator', 'leader')),
    priority INTEGER DEFAULT 1,
    voting_weight DECIMAL(3,2) DEFAULT 1.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance in group
    decisions_coordinated INTEGER DEFAULT 0,
    conflicts_caused INTEGER DEFAULT 0,
    signals_shared INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT unique_agent_group UNIQUE(agent_id, group_id)
);

-- Coordination messages and signals
CREATE TABLE IF NOT EXISTS public.coordination_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.coordination_groups(id) ON DELETE CASCADE,
    from_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    to_agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE, -- NULL for broadcast
    
    -- Message details
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('market_signal', 'position_intent', 'risk_warning', 'opportunity', 'coordination_request', 'conflict_alert')),
    subject VARCHAR(255),
    content JSONB NOT NULL,
    
    -- Priority and urgency
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    
    -- Delivery tracking
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Response tracking
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_message_id UUID REFERENCES public.coordination_messages(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MARKET DATA AND ANALYSIS TABLES
-- ============================================================================

-- Market data snapshots for agent analysis
CREATE TABLE IF NOT EXISTS public.market_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,
    
    -- Price data
    price DECIMAL(15,6) NOT NULL,
    volume DECIMAL(20,2) DEFAULT 0,
    bid DECIMAL(15,6),
    ask DECIMAL(15,6),
    spread DECIMAL(15,6),
    
    -- OHLC data
    open_price DECIMAL(15,6),
    high_price DECIMAL(15,6),
    low_price DECIMAL(15,6),
    close_price DECIMAL(15,6),
    
    -- Technical indicators
    rsi DECIMAL(5,2),
    macd_value DECIMAL(10,6),
    macd_signal DECIMAL(10,6),
    bollinger_upper DECIMAL(15,6),
    bollinger_middle DECIMAL(15,6),
    bollinger_lower DECIMAL(15,6),
    ema_12 DECIMAL(15,6),
    ema_26 DECIMAL(15,6),
    ema_50 DECIMAL(15,6),
    ema_200 DECIMAL(15,6),
    
    -- Market sentiment
    sentiment_score DECIMAL(3,2), -- -1 to 1
    fear_greed_index INTEGER, -- 0 to 100
    volatility DECIMAL(6,4),
    
    -- Data source
    data_source VARCHAR(50) NOT NULL,
    snapshot_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REINFORCEMENT LEARNING TABLES
-- ============================================================================

-- Q-learning and RL state-action values
CREATE TABLE IF NOT EXISTS public.rl_q_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- State representation
    state_hash VARCHAR(255) NOT NULL,
    state_features JSONB NOT NULL,
    
    -- Action representation
    action_hash VARCHAR(255) NOT NULL,
    action_details JSONB NOT NULL,
    
    -- Q-learning values
    q_value DECIMAL(10,6) NOT NULL DEFAULT 0,
    confidence DECIMAL(3,2) DEFAULT 0,
    update_count INTEGER DEFAULT 0,
    
    -- Performance tracking
    avg_reward DECIMAL(8,4) DEFAULT 0,
    total_reward DECIMAL(15,2) DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_agent_state_action UNIQUE(agent_id, state_hash, action_hash)
);

-- Reinforcement learning experiences
CREATE TABLE IF NOT EXISTS public.rl_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Experience data
    state_before JSONB NOT NULL,
    action_taken JSONB NOT NULL,
    reward_received DECIMAL(8,4) NOT NULL,
    state_after JSONB,
    
    -- Episode information
    episode_id UUID,
    step_number INTEGER DEFAULT 1,
    is_terminal BOOLEAN DEFAULT false,
    
    -- Reward breakdown
    immediate_reward DECIMAL(8,4) DEFAULT 0,
    delayed_reward DECIMAL(8,4) DEFAULT 0,
    risk_adjusted_reward DECIMAL(8,4) DEFAULT 0,
    
    -- Market context
    market_conditions JSONB DEFAULT '{}',
    portfolio_state JSONB DEFAULT '{}',
    
    -- Learning metadata
    importance DECIMAL(3,2) DEFAULT 0.5,
    priority DECIMAL(3,2) DEFAULT 0.5,
    replay_count INTEGER DEFAULT 0,
    
    -- Timestamps
    experienced_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wait for all tables to be created before creating indexes
-- This prevents dependency issues

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE (AFTER ALL TABLES)
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

-- Agent state indexes (create last with explicit column verification)
CREATE INDEX IF NOT EXISTS idx_agent_state_updated ON public.agent_state (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_state_health ON public.agent_state (health_score);

-- ============================================================================
-- VIEWS FOR EASY DATA ACCESS
-- ============================================================================

-- Agent performance summary view
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
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update agent state timestamp
CREATE OR REPLACE FUNCTION update_agent_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agent state updates
DROP TRIGGER IF EXISTS trigger_update_agent_state_timestamp ON public.agent_state;
CREATE TRIGGER trigger_update_agent_state_timestamp
    BEFORE UPDATE ON public.agent_state
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_state_timestamp();

-- Function to update agent last_active_at
CREATE OR REPLACE FUNCTION update_agent_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.agents 
    SET last_active_at = NOW() 
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agent activity tracking
DROP TRIGGER IF EXISTS trigger_agent_activity_thoughts ON public.agent_thoughts;
CREATE TRIGGER trigger_agent_activity_thoughts
    AFTER INSERT ON public.agent_thoughts
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_last_active();

DROP TRIGGER IF EXISTS trigger_agent_activity_decisions ON public.agent_decisions;
CREATE TRIGGER trigger_agent_activity_decisions
    AFTER INSERT ON public.agent_decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_last_active();

-- Function to automatically calculate performance metrics
CREATE OR REPLACE FUNCTION calculate_agent_daily_performance()
RETURNS void AS $$
DECLARE
    agent_record RECORD;
    start_of_day TIMESTAMPTZ;
    end_of_day TIMESTAMPTZ;
BEGIN
    start_of_day := DATE_TRUNC('day', NOW());
    end_of_day := start_of_day + INTERVAL '1 day';
    
    FOR agent_record IN SELECT id FROM public.agents WHERE status = 'active' LOOP
        INSERT INTO public.agent_performance (
            agent_id,
            period_type,
            period_start,
            period_end,
            total_trades,
            winning_trades,
            losing_trades,
            win_rate,
            total_return,
            realized_pnl
        )
        SELECT 
            agent_record.id,
            'daily',
            start_of_day,
            end_of_day,
            COUNT(*) AS total_trades,
            COUNT(*) FILTER (WHERE outcome = 'win') AS winning_trades,
            COUNT(*) FILTER (WHERE outcome = 'loss') AS losing_trades,
            COALESCE(COUNT(*) FILTER (WHERE outcome = 'win')::DECIMAL / NULLIF(COUNT(*), 0), 0) AS win_rate,
            COALESCE(SUM(return_percentage), 0) AS total_return,
            COALESCE(SUM(actual_return), 0) AS realized_pnl
        FROM public.agent_decisions
        WHERE agent_id = agent_record.id
            AND executed_at >= start_of_day
            AND executed_at < end_of_day
            AND execution_status = 'executed'
        ON CONFLICT (agent_id, period_type, period_start) 
        DO UPDATE SET
            total_trades = EXCLUDED.total_trades,
            winning_trades = EXCLUDED.winning_trades,
            losing_trades = EXCLUDED.losing_trades,
            win_rate = EXCLUDED.win_rate,
            total_return = EXCLUDED.total_return,
            realized_pnl = EXCLUDED.realized_pnl,
            calculated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

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

-- ============================================================================
-- INITIAL DATA AND PERMISSIONS
-- ============================================================================

-- Create default coordination group
INSERT INTO public.coordination_groups (name, description, strategy_name, strategy_config) 
VALUES (
    'Default Balanced Strategy',
    'Default coordination group for balanced risk-reward trading',
    'balanced',
    '{"maxConcurrentBuys": 3, "maxConcurrentSells": 3, "maxPortfolioOverlap": 50, "conflictResolution": "confidence"}'
) ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable Row Level Security (uncomment if needed)
-- ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.agent_thoughts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example - adjust as needed)
-- CREATE POLICY "Users can see their own agents" ON public.agents
--     FOR ALL USING (created_by = auth.jwt() ->> 'email');

COMMIT;