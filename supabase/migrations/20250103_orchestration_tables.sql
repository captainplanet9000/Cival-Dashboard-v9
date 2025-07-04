-- ============================================================================
-- Agent-Farm-Goal Orchestration Database Schema
-- Phase 18F: Complete orchestration database tables for production deployment
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FARM ORCHESTRATION TABLES
-- ============================================================================

-- Farm configurations table
CREATE TABLE IF NOT EXISTS farm_configurations (
    farm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    strategy_type TEXT NOT NULL,
    target_allocation DECIMAL(20,8) NOT NULL DEFAULT 0,
    max_agents INTEGER NOT NULL DEFAULT 10,
    min_agents INTEGER NOT NULL DEFAULT 1,
    risk_tolerance REAL NOT NULL DEFAULT 0.5,
    performance_requirements JSONB DEFAULT '{}',
    agent_selection_criteria JSONB DEFAULT '{}',
    rebalancing_frequency INTEGER NOT NULL DEFAULT 24, -- hours
    auto_assignment_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm-agent assignments table
CREATE TABLE IF NOT EXISTS farm_agent_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_configurations(farm_id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    assigned_capital DECIMAL(20,8) NOT NULL DEFAULT 0,
    capital_utilization REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', -- active, paused, under_review, probation, graduated, retired
    performance_score REAL NOT NULL DEFAULT 0,
    risk_alignment_score REAL NOT NULL DEFAULT 0,
    strategy_compatibility_score REAL NOT NULL DEFAULT 0,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_review_date TIMESTAMP WITH TIME ZONE,
    performance_metrics JSONB DEFAULT '{}',
    constraints JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent performance metrics table
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    total_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
    max_drawdown REAL NOT NULL DEFAULT 0,
    sharpe_ratio REAL NOT NULL DEFAULT 0,
    win_rate REAL NOT NULL DEFAULT 0,
    avg_trade_duration REAL NOT NULL DEFAULT 0, -- hours
    risk_adjusted_return REAL NOT NULL DEFAULT 0,
    consistency_score REAL NOT NULL DEFAULT 0,
    strategy_alignment REAL NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CAPITAL FLOW MANAGEMENT TABLES
-- ============================================================================

-- Goal capital allocations table
CREATE TABLE IF NOT EXISTS goal_capital_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id TEXT NOT NULL,
    goal_name TEXT NOT NULL,
    target_allocation DECIMAL(20,8) NOT NULL DEFAULT 0,
    current_allocation DECIMAL(20,8) NOT NULL DEFAULT 0,
    allocation_strategy TEXT NOT NULL DEFAULT 'performance_weighted',
    performance_requirements JSONB DEFAULT '{}',
    risk_limits JSONB DEFAULT '{}',
    achievement_thresholds JSONB DEFAULT '{}',
    assigned_farms TEXT[] DEFAULT '{}',
    capital_flow_rules JSONB DEFAULT '{}',
    auto_reallocation_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Capital flow transactions table
CREATE TABLE IF NOT EXISTS capital_flow_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_direction TEXT NOT NULL, -- goal_to_farm, farm_to_agent, agent_to_farm, farm_to_goal, rebalance
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL, -- goal, farm, agent
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- goal, farm, agent
    amount DECIMAL(20,8) NOT NULL,
    reason TEXT NOT NULL,
    strategy TEXT NOT NULL DEFAULT 'performance_weighted',
    goal_progress_data JSONB DEFAULT '{}',
    performance_data JSONB DEFAULT '{}',
    risk_data JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm capital status table
CREATE TABLE IF NOT EXISTS farm_capital_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id TEXT NOT NULL,
    assigned_from_goals JSONB DEFAULT '{}', -- goal_id -> amount mapping
    total_capital DECIMAL(20,8) NOT NULL DEFAULT 0,
    utilized_capital DECIMAL(20,8) NOT NULL DEFAULT 0,
    available_capital DECIMAL(20,8) NOT NULL DEFAULT 0,
    capital_efficiency REAL NOT NULL DEFAULT 0,
    performance_score REAL NOT NULL DEFAULT 0,
    agent_allocations JSONB DEFAULT '{}', -- agent_id -> amount mapping
    last_reallocation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reallocation_frequency INTEGER NOT NULL DEFAULT 24, -- hours
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE ATTRIBUTION TABLES
-- ============================================================================

-- Agent decision records table
CREATE TABLE IF NOT EXISTS agent_decision_records (
    decision_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    farm_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    decision_type TEXT NOT NULL, -- trade, rebalance, risk_adjustment
    decision_data JSONB DEFAULT '{}',
    decision_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confidence_score REAL NOT NULL DEFAULT 0,
    expected_return DECIMAL(20,8) DEFAULT 0,
    risk_assessment JSONB DEFAULT '{}',
    market_conditions JSONB DEFAULT '{}',
    execution_status TEXT NOT NULL DEFAULT 'pending', -- pending, executed, failed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade outcomes table
CREATE TABLE IF NOT EXISTS trade_outcomes (
    trade_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES agent_decision_records(decision_id) ON DELETE SET NULL,
    agent_id TEXT NOT NULL,
    farm_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL, -- buy, sell
    quantity DECIMAL(20,8) NOT NULL,
    entry_price DECIMAL(20,8) NOT NULL,
    exit_price DECIMAL(20,8),
    realized_pnl DECIMAL(20,8) DEFAULT 0,
    unrealized_pnl DECIMAL(20,8) DEFAULT 0,
    fees DECIMAL(20,8) DEFAULT 0,
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    holding_period INTERVAL,
    trade_status TEXT NOT NULL DEFAULT 'open', -- open, closed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance attributions table
CREATE TABLE IF NOT EXISTS performance_attributions (
    attribution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL, -- agent, farm, goal, portfolio, strategy
    entity_id TEXT NOT NULL,
    period TEXT NOT NULL, -- realtime, hourly, daily, weekly, monthly
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metrics JSONB DEFAULT '{}',
    contributions JSONB DEFAULT '{}',
    risk_metrics JSONB DEFAULT '{}',
    attribution_breakdown JSONB DEFAULT '{}',
    confidence_score REAL NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm attributions table
CREATE TABLE IF NOT EXISTS farm_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    period TEXT NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_return DECIMAL(20,8) DEFAULT 0,
    attributed_return DECIMAL(20,8) DEFAULT 0,
    capital_allocated DECIMAL(20,8) DEFAULT 0,
    capital_utilized DECIMAL(20,8) DEFAULT 0,
    agent_contributions JSONB DEFAULT '{}',
    strategy_performance JSONB DEFAULT '{}',
    risk_adjusted_return DECIMAL(20,8) DEFAULT 0,
    attribution_confidence REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal attributions table
CREATE TABLE IF NOT EXISTS goal_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id TEXT NOT NULL,
    period TEXT NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    goal_target DECIMAL(20,8) DEFAULT 0,
    current_progress DECIMAL(20,8) DEFAULT 0,
    progress_change DECIMAL(20,8) DEFAULT 0,
    farm_contributions JSONB DEFAULT '{}',
    agent_contributions JSONB DEFAULT '{}',
    strategy_contributions JSONB DEFAULT '{}',
    time_to_target INTERVAL,
    achievement_probability REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EVENT PROPAGATION TABLES
-- ============================================================================

-- Events table (created first - no dependencies)
CREATE TABLE IF NOT EXISTS orchestration_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    source_service TEXT NOT NULL,
    target_service TEXT,
    priority INTEGER NOT NULL DEFAULT 2, -- 1=low, 2=medium, 3=high, 4=critical
    scope TEXT NOT NULL DEFAULT 'service', -- local, service, global, external
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    correlation_id UUID,
    parent_event_id UUID,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    ttl_seconds INTEGER DEFAULT 300,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event subscriptions table (created second - no dependencies)
CREATE TABLE IF NOT EXISTS event_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_service TEXT NOT NULL,
    event_types TEXT[] NOT NULL,
    priority_filter INTEGER,
    scope_filter TEXT,
    data_filter JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event delivery status table (created last - depends on both tables above)
CREATE TABLE IF NOT EXISTS event_delivery_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    subscription_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, delivered, failed, retry
    delivery_time TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after table creation
ALTER TABLE event_delivery_status 
ADD CONSTRAINT fk_event_delivery_event_id 
FOREIGN KEY (event_id) REFERENCES orchestration_events(event_id) ON DELETE CASCADE;

ALTER TABLE event_delivery_status 
ADD CONSTRAINT fk_event_delivery_subscription_id 
FOREIGN KEY (subscription_id) REFERENCES event_subscriptions(subscription_id) ON DELETE CASCADE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Farm orchestration indexes
CREATE INDEX IF NOT EXISTS idx_farm_configurations_strategy ON farm_configurations(strategy_type);
CREATE INDEX IF NOT EXISTS idx_farm_configurations_created ON farm_configurations(created_at);

CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_farm_id ON farm_agent_assignments(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_agent_id ON farm_agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_status ON farm_agent_assignments(status);
CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_assignment_date ON farm_agent_assignments(assignment_date);

CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_calculated_at ON agent_performance_metrics(calculated_at);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_period ON agent_performance_metrics(period_start, period_end);

-- Capital flow indexes
CREATE INDEX IF NOT EXISTS idx_goal_capital_allocations_goal_id ON goal_capital_allocations(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_capital_allocations_created_at ON goal_capital_allocations(created_at);

CREATE INDEX IF NOT EXISTS idx_capital_flow_transactions_source ON capital_flow_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_capital_flow_transactions_target ON capital_flow_transactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_capital_flow_transactions_executed_at ON capital_flow_transactions(executed_at);
CREATE INDEX IF NOT EXISTS idx_capital_flow_transactions_status ON capital_flow_transactions(status);

CREATE INDEX IF NOT EXISTS idx_farm_capital_status_farm_id ON farm_capital_status(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_capital_status_updated_at ON farm_capital_status(updated_at);

-- Performance attribution indexes
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_id ON agent_decision_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_farm_id ON agent_decision_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_goal_id ON agent_decision_records(goal_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_timestamp ON agent_decision_records(decision_timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_status ON agent_decision_records(execution_status);

CREATE INDEX IF NOT EXISTS idx_trade_outcomes_agent_id ON trade_outcomes(agent_id);
CREATE INDEX IF NOT EXISTS idx_trade_outcomes_farm_id ON trade_outcomes(farm_id);
CREATE INDEX IF NOT EXISTS idx_trade_outcomes_goal_id ON trade_outcomes(goal_id);
CREATE INDEX IF NOT EXISTS idx_trade_outcomes_symbol ON trade_outcomes(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_outcomes_execution_time ON trade_outcomes(execution_time);
CREATE INDEX IF NOT EXISTS idx_trade_outcomes_status ON trade_outcomes(trade_status);

CREATE INDEX IF NOT EXISTS idx_performance_attributions_entity_id ON performance_attributions(entity_id);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_level ON performance_attributions(level);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_period ON performance_attributions(period);
CREATE INDEX IF NOT EXISTS idx_performance_attributions_calculated_at ON performance_attributions(calculated_at);

CREATE INDEX IF NOT EXISTS idx_farm_attributions_farm_id ON farm_attributions(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_attributions_goal_id ON farm_attributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_farm_attributions_period ON farm_attributions(period);

CREATE INDEX IF NOT EXISTS idx_goal_attributions_goal_id ON goal_attributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_attributions_period ON goal_attributions(period);

-- Event propagation indexes
CREATE INDEX IF NOT EXISTS idx_orchestration_events_type ON orchestration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_orchestration_events_source ON orchestration_events(source_service);
CREATE INDEX IF NOT EXISTS idx_orchestration_events_timestamp ON orchestration_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_orchestration_events_priority ON orchestration_events(priority);
CREATE INDEX IF NOT EXISTS idx_orchestration_events_correlation ON orchestration_events(correlation_id);

CREATE INDEX IF NOT EXISTS idx_event_subscriptions_service ON event_subscriptions(subscriber_service);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_active ON event_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_event_delivery_status_event ON event_delivery_status(event_id);
CREATE INDEX IF NOT EXISTS idx_event_delivery_status_subscription ON event_delivery_status(subscription_id);
CREATE INDEX IF NOT EXISTS idx_event_delivery_status_status ON event_delivery_status(status);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_farm_configurations_updated_at BEFORE UPDATE ON farm_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farm_agent_assignments_updated_at BEFORE UPDATE ON farm_agent_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_capital_allocations_updated_at BEFORE UPDATE ON goal_capital_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farm_capital_status_updated_at BEFORE UPDATE ON farm_capital_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE farm_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_capital_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_flow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_capital_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_delivery_status ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust based on your auth setup)
CREATE POLICY "Enable read access for authenticated users" ON farm_configurations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON farm_configurations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON farm_configurations FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON farm_agent_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON farm_agent_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON farm_agent_assignments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON agent_performance_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON agent_performance_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON goal_capital_allocations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON goal_capital_allocations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON goal_capital_allocations FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON capital_flow_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON capital_flow_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON farm_capital_status FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON farm_capital_status FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON farm_capital_status FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON agent_decision_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON agent_decision_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON trade_outcomes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON trade_outcomes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON trade_outcomes FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON performance_attributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON performance_attributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON farm_attributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON farm_attributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON goal_attributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON goal_attributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON orchestration_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON orchestration_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON event_subscriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON event_subscriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON event_subscriptions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON event_delivery_status FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON event_delivery_status FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get farm performance summary
CREATE OR REPLACE FUNCTION get_farm_performance_summary(farm_id_param TEXT)
RETURNS TABLE (
    farm_id TEXT,
    total_agents BIGINT,
    total_capital DECIMAL,
    total_pnl DECIMAL,
    avg_performance REAL,
    win_rate REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        faa.farm_id,
        COUNT(faa.agent_id) as total_agents,
        SUM(faa.assigned_capital) as total_capital,
        SUM(apm.total_pnl) as total_pnl,
        AVG(apm.risk_adjusted_return) as avg_performance,
        AVG(apm.win_rate) as win_rate
    FROM farm_agent_assignments faa
    LEFT JOIN agent_performance_metrics apm ON faa.agent_id = apm.agent_id
    WHERE faa.farm_id = farm_id_param AND faa.status = 'active'
    GROUP BY faa.farm_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get goal progress summary
CREATE OR REPLACE FUNCTION get_goal_progress_summary(goal_id_param TEXT)
RETURNS TABLE (
    goal_id TEXT,
    current_progress DECIMAL,
    total_allocation DECIMAL,
    farm_count BIGINT,
    progress_percentage REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gca.goal_id,
        gca.current_allocation as current_progress,
        gca.target_allocation as total_allocation,
        array_length(gca.assigned_farms, 1)::BIGINT as farm_count,
        (gca.current_allocation / NULLIF(gca.target_allocation, 0) * 100)::REAL as progress_percentage
    FROM goal_capital_allocations gca
    WHERE gca.goal_id = goal_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA INSERTION (FOR TESTING)
-- ============================================================================

-- Insert sample farm configurations
INSERT INTO farm_configurations (farm_id, name, strategy_type, target_allocation, max_agents, min_agents, risk_tolerance)
VALUES 
    (uuid_generate_v4(), 'Momentum Trading Farm', 'momentum', 100000.00, 5, 2, 0.7),
    (uuid_generate_v4(), 'Arbitrage Opportunities Farm', 'arbitrage', 75000.00, 4, 2, 0.3),
    (uuid_generate_v4(), 'Mean Reversion Farm', 'mean_reversion', 50000.00, 3, 1, 0.5)
ON CONFLICT DO NOTHING;

-- Insert sample goal capital allocations
INSERT INTO goal_capital_allocations (goal_id, goal_name, target_allocation, current_allocation, allocation_strategy)
VALUES 
    ('goal_q1_2025', 'Q1 2025 Growth Target', 250000.00, 175000.00, 'performance_weighted'),
    ('goal_conservative', 'Conservative Income Goal', 100000.00, 85000.00, 'risk_adjusted'),
    ('goal_aggressive', 'Aggressive Growth Goal', 150000.00, 90000.00, 'dynamic_optimization')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE farm_configurations IS 'Configuration and parameters for trading farms';
COMMENT ON TABLE farm_agent_assignments IS 'Dynamic assignment of agents to farms with performance tracking';
COMMENT ON TABLE agent_performance_metrics IS 'Comprehensive performance metrics for individual agents';
COMMENT ON TABLE goal_capital_allocations IS 'Goal-based capital allocation configurations';
COMMENT ON TABLE capital_flow_transactions IS 'All capital flow transactions between goals, farms, and agents';
COMMENT ON TABLE farm_capital_status IS 'Real-time capital status and utilization for farms';
COMMENT ON TABLE agent_decision_records IS 'Record of all agent decisions for attribution tracking';
COMMENT ON TABLE trade_outcomes IS 'Trading outcomes linked to agent decisions';
COMMENT ON TABLE performance_attributions IS 'Multi-level performance attribution calculations';
COMMENT ON TABLE farm_attributions IS 'Farm-level performance attribution details';
COMMENT ON TABLE goal_attributions IS 'Goal-level progress attribution and tracking';
COMMENT ON TABLE orchestration_events IS 'Event propagation system for orchestration services';
COMMENT ON TABLE event_subscriptions IS 'Event subscription management';
COMMENT ON TABLE event_delivery_status IS 'Event delivery tracking and status';