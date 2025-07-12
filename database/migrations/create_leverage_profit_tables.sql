-- =====================================================
-- Leverage Engine and Profit Securing Database Schema
-- Complete tables for autonomous trading system
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LEVERAGE ENGINE TABLES
-- =====================================================

-- Leverage positions table
CREATE TABLE IF NOT EXISTS leverage_positions (
    position_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    asset TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    size DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8) NOT NULL,
    leverage_ratio DECIMAL(5, 2) NOT NULL CHECK (leverage_ratio >= 1.0 AND leverage_ratio <= 20.0),
    margin_used DECIMAL(20, 2) NOT NULL,
    unrealized_pnl DECIMAL(20, 2) NOT NULL DEFAULT 0,
    liquidation_price DECIMAL(20, 8) NOT NULL,
    margin_status TEXT NOT NULL DEFAULT 'safe' CHECK (margin_status IN ('safe', 'warning', 'critical', 'liquidation')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_leverage_positions_agent_id (agent_id),
    INDEX idx_leverage_positions_asset (asset),
    INDEX idx_leverage_positions_status (margin_status),
    INDEX idx_leverage_positions_active (is_active),
    INDEX idx_leverage_positions_created (created_at)
);

-- Agent leverage settings and limits
CREATE TABLE IF NOT EXISTS agent_leverage_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE,
    max_leverage DECIMAL(5, 2) NOT NULL DEFAULT 10.0 CHECK (max_leverage >= 1.0 AND max_leverage <= 20.0),
    risk_tolerance TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    max_position_size DECIMAL(20, 2) NOT NULL DEFAULT 10000,
    margin_call_threshold DECIMAL(3, 2) NOT NULL DEFAULT 0.80,
    liquidation_threshold DECIMAL(3, 2) NOT NULL DEFAULT 0.95,
    auto_deleveraging_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_agent_leverage_settings_agent_id (agent_id)
);

-- Leverage risk metrics history
CREATE TABLE IF NOT EXISTS leverage_risk_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    portfolio_leverage DECIMAL(8, 4) NOT NULL,
    margin_usage_percentage DECIMAL(5, 2) NOT NULL,
    available_margin DECIMAL(20, 2) NOT NULL,
    total_margin_used DECIMAL(20, 2) NOT NULL,
    liquidation_risk_score DECIMAL(5, 2) NOT NULL,
    var_with_leverage DECIMAL(20, 2),
    max_drawdown_with_leverage DECIMAL(20, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_leverage_risk_metrics_agent_id (agent_id),
    INDEX idx_leverage_risk_metrics_recorded (recorded_at),
    INDEX idx_leverage_risk_metrics_risk_score (liquidation_risk_score)
);

-- =====================================================
-- PROFIT SECURING TABLES
-- =====================================================

-- Profit milestones configuration and status
CREATE TABLE IF NOT EXISTS profit_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    secure_percentage DECIMAL(5, 2) NOT NULL CHECK (secure_percentage >= 0 AND secure_percentage <= 100),
    protocol TEXT NOT NULL CHECK (protocol IN ('aave', 'compound', 'makerdao')),
    triggered BOOLEAN NOT NULL DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    secured_amount DECIMAL(20, 2),
    borrowed_amount DECIMAL(20, 2),
    deposit_tx_id TEXT,
    borrow_tx_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_profit_milestones_agent_id (agent_id),
    INDEX idx_profit_milestones_amount (amount),
    INDEX idx_profit_milestones_triggered (triggered),
    INDEX idx_profit_milestones_protocol (protocol)
);

-- Goal completion profit securing records
CREATE TABLE IF NOT EXISTS goal_completion_profits (
    completion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    completion_profit DECIMAL(20, 2) NOT NULL,
    secured_amount DECIMAL(20, 2) NOT NULL,
    protocol TEXT NOT NULL CHECK (protocol IN ('aave', 'compound', 'makerdao')),
    deposit_tx_id TEXT NOT NULL,
    borrowed_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,
    borrow_tx_id TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_goal_completion_profits_goal_id (goal_id),
    INDEX idx_goal_completion_profits_agent_id (agent_id),
    INDEX idx_goal_completion_profits_protocol (protocol),
    INDEX idx_goal_completion_profits_completed (completed_at)
);

-- DeFi deposit positions
CREATE TABLE IF NOT EXISTS profit_securing_deposits (
    position_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    protocol TEXT NOT NULL CHECK (protocol IN ('aave', 'compound', 'makerdao')),
    asset TEXT NOT NULL DEFAULT 'USDC',
    deposited_amount DECIMAL(20, 2) NOT NULL,
    current_value DECIMAL(20, 2) NOT NULL,
    apy DECIMAL(8, 4) NOT NULL,
    health_factor DECIMAL(8, 4) NOT NULL DEFAULT 2.0,
    borrowed_against DECIMAL(20, 2) NOT NULL DEFAULT 0,
    available_to_borrow DECIMAL(20, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_profit_deposits_agent_id (agent_id),
    INDEX idx_profit_deposits_protocol (protocol),
    INDEX idx_profit_deposits_health_factor (health_factor),
    INDEX idx_profit_deposits_active (is_active)
);

-- DeFi borrowing positions
CREATE TABLE IF NOT EXISTS profit_securing_borrows (
    borrow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_position_id UUID NOT NULL REFERENCES profit_securing_deposits(position_id),
    agent_id UUID NOT NULL,
    protocol TEXT NOT NULL CHECK (protocol IN ('aave', 'compound', 'makerdao')),
    borrowed_amount DECIMAL(20, 2) NOT NULL,
    current_debt DECIMAL(20, 2) NOT NULL,
    apy DECIMAL(8, 4) NOT NULL,
    health_factor DECIMAL(8, 4) NOT NULL,
    liquidation_threshold DECIMAL(3, 2) NOT NULL DEFAULT 0.8,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_profit_borrows_deposit_id (deposit_position_id),
    INDEX idx_profit_borrows_agent_id (agent_id),
    INDEX idx_profit_borrows_protocol (protocol),
    INDEX idx_profit_borrows_health_factor (health_factor),
    INDEX idx_profit_borrows_active (is_active)
);

-- Profit securing rules configuration per agent
CREATE TABLE IF NOT EXISTS profit_securing_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE,
    milestone_amounts DECIMAL(20, 2)[] NOT NULL DEFAULT '{100, 1000, 10000, 50000, 100000}',
    auto_secure_on_milestone BOOLEAN NOT NULL DEFAULT true,
    leverage_integration BOOLEAN NOT NULL DEFAULT true,
    borrow_percentage DECIMAL(3, 2) NOT NULL DEFAULT 0.20,
    preferred_protocol TEXT CHECK (preferred_protocol IN ('aave', 'compound', 'makerdao')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_profit_rules_agent_id (agent_id)
);

-- =====================================================
-- AUTONOMOUS COORDINATION TABLES
-- =====================================================

-- Agent state persistence for 24/7 operation
CREATE TABLE IF NOT EXISTS agent_states (
    state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    state_type TEXT NOT NULL CHECK (state_type IN ('configuration', 'memory', 'performance', 'decisions', 'positions', 'strategies')),
    state_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per agent per state type
    UNIQUE(agent_id, state_type),
    
    -- Indexes for performance
    INDEX idx_agent_states_agent_id (agent_id),
    INDEX idx_agent_states_type (state_type),
    INDEX idx_agent_states_updated (updated_at)
);

-- System checkpoints for recovery
CREATE TABLE IF NOT EXISTS agent_checkpoints (
    checkpoint_id TEXT PRIMARY KEY,
    checkpoint_name TEXT NOT NULL,
    agents_included TEXT[] NOT NULL,
    state_snapshot JSONB NOT NULL,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('creating', 'completed', 'failed', 'restoring')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_agent_checkpoints_created (created_at),
    INDEX idx_agent_checkpoints_status (status)
);

-- Automation workflows tracking
CREATE TABLE IF NOT EXISTS automation_workflows (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('goal_completion', 'milestone_reached', 'leverage_violation', 'performance_adjustment')),
    agent_id UUID NOT NULL,
    trigger_event JSONB NOT NULL,
    actions_taken JSONB NOT NULL DEFAULT '[]'::jsonb,
    workflow_status TEXT NOT NULL DEFAULT 'pending' CHECK (workflow_status IN ('pending', 'in_progress', 'completed', 'failed')),
    result_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    INDEX idx_automation_workflows_type (workflow_type),
    INDEX idx_automation_workflows_agent_id (agent_id),
    INDEX idx_automation_workflows_status (workflow_status),
    INDEX idx_automation_workflows_created (created_at)
);

-- Agent integration mappings
CREATE TABLE IF NOT EXISTS agent_integrations (
    integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE,
    leverage_enabled BOOLEAN NOT NULL DEFAULT false,
    profit_securing_enabled BOOLEAN NOT NULL DEFAULT false,
    milestone_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
    leverage_settings_id UUID REFERENCES agent_leverage_settings(setting_id),
    profit_rules_id UUID REFERENCES profit_securing_rules(rule_id),
    integration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_agent_integrations_agent_id (agent_id),
    INDEX idx_agent_integrations_leverage (leverage_enabled),
    INDEX idx_agent_integrations_profit (profit_securing_enabled)
);

-- =====================================================
-- PERFORMANCE AND ANALYTICS TABLES
-- =====================================================

-- Profit securing performance metrics
CREATE TABLE IF NOT EXISTS profit_securing_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    total_secured DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_borrowed DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_milestones_triggered INTEGER NOT NULL DEFAULT 0,
    total_goals_completed INTEGER NOT NULL DEFAULT 0,
    net_yield DECIMAL(8, 4) NOT NULL DEFAULT 0,
    average_health_factor DECIMAL(8, 4) NOT NULL DEFAULT 2.0,
    compounding_rate DECIMAL(8, 4) NOT NULL DEFAULT 0,
    risk_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_profit_analytics_agent_id (agent_id),
    INDEX idx_profit_analytics_calculated (calculated_at),
    INDEX idx_profit_analytics_yield (net_yield),
    INDEX idx_profit_analytics_risk (risk_score)
);

-- System activity tracking for adaptive frequencies
CREATE TABLE IF NOT EXISTS system_activity_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('trade_executed', 'goal_completed', 'leverage_violation', 'milestone_reached')),
    activity_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_activity_metrics_agent_id (agent_id),
    INDEX idx_activity_metrics_type (activity_type),
    INDEX idx_activity_metrics_recorded (recorded_at)
);

-- =====================================================
-- VIEWS FOR EASIER QUERYING
-- =====================================================

-- Agent overview with all integrations
CREATE OR REPLACE VIEW agent_integration_overview AS
SELECT 
    ai.agent_id,
    ai.leverage_enabled,
    ai.profit_securing_enabled,
    ai.milestone_tracking_enabled,
    als.max_leverage,
    als.risk_tolerance,
    psr.milestone_amounts,
    psr.borrow_percentage,
    COUNT(DISTINCT lp.position_id) as active_leverage_positions,
    COUNT(DISTINCT pm.milestone_id) as total_milestones,
    COUNT(DISTINCT pm.milestone_id) FILTER (WHERE pm.triggered = true) as triggered_milestones,
    COALESCE(psa.total_secured, 0) as total_secured,
    COALESCE(psa.total_borrowed, 0) as total_borrowed,
    COALESCE(psa.net_yield, 0) as net_yield
FROM agent_integrations ai
LEFT JOIN agent_leverage_settings als ON ai.leverage_settings_id = als.setting_id
LEFT JOIN profit_securing_rules psr ON ai.profit_rules_id = psr.rule_id
LEFT JOIN leverage_positions lp ON ai.agent_id = lp.agent_id AND lp.is_active = true
LEFT JOIN profit_milestones pm ON ai.agent_id = pm.agent_id
LEFT JOIN profit_securing_analytics psa ON ai.agent_id = psa.agent_id
GROUP BY ai.agent_id, ai.leverage_enabled, ai.profit_securing_enabled, ai.milestone_tracking_enabled,
         als.max_leverage, als.risk_tolerance, psr.milestone_amounts, psr.borrow_percentage,
         psa.total_secured, psa.total_borrowed, psa.net_yield;

-- Risk monitoring view
CREATE OR REPLACE VIEW risk_monitoring_overview AS
SELECT 
    lp.agent_id,
    COUNT(*) as total_positions,
    SUM(lp.margin_used) as total_margin_used,
    SUM(lp.unrealized_pnl) as total_unrealized_pnl,
    AVG(lp.leverage_ratio) as avg_leverage_ratio,
    COUNT(*) FILTER (WHERE lp.margin_status IN ('warning', 'critical')) as risk_positions,
    MIN(psd.health_factor) as min_health_factor,
    COUNT(DISTINCT psd.position_id) as defi_positions
FROM leverage_positions lp
LEFT JOIN profit_securing_deposits psd ON lp.agent_id = psd.agent_id AND psd.is_active = true
WHERE lp.is_active = true
GROUP BY lp.agent_id;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_leverage_positions_updated_at BEFORE UPDATE ON leverage_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_leverage_settings_updated_at BEFORE UPDATE ON agent_leverage_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_milestones_updated_at BEFORE UPDATE ON profit_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_deposits_updated_at BEFORE UPDATE ON profit_securing_deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_borrows_updated_at BEFORE UPDATE ON profit_securing_borrows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profit_rules_updated_at BEFORE UPDATE ON profit_securing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_states_updated_at BEFORE UPDATE ON agent_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default profit securing rules for common milestone amounts
INSERT INTO profit_securing_rules (agent_id, milestone_amounts, borrow_percentage) 
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, '{100, 1000, 10000, 50000, 100000}', 0.20),
    ('00000000-0000-0000-0000-000000000002'::uuid, '{500, 2500, 15000, 75000}', 0.20),
    ('00000000-0000-0000-0000-000000000003'::uuid, '{250, 1500, 7500, 35000}', 0.15)
ON CONFLICT (agent_id) DO NOTHING;

-- Insert default leverage settings
INSERT INTO agent_leverage_settings (agent_id, max_leverage, risk_tolerance, max_position_size)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, 10.0, 'moderate', 10000),
    ('00000000-0000-0000-0000-000000000002'::uuid, 5.0, 'conservative', 5000),
    ('00000000-0000-0000-0000-000000000003'::uuid, 15.0, 'aggressive', 15000)
ON CONFLICT (agent_id) DO NOTHING;

-- Insert agent integrations
INSERT INTO agent_integrations (agent_id, leverage_enabled, profit_securing_enabled, milestone_tracking_enabled)
VALUES 
    ('00000000-0000-0000-0000-000000000001'::uuid, true, true, true),
    ('00000000-0000-0000-0000-000000000002'::uuid, true, true, true),
    ('00000000-0000-0000-0000-000000000003'::uuid, true, true, true)
ON CONFLICT (agent_id) DO NOTHING;

-- Create indexes for optimal query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leverage_positions_composite 
ON leverage_positions (agent_id, is_active, margin_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profit_milestones_composite 
ON profit_milestones (agent_id, triggered, amount);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profit_deposits_composite 
ON profit_securing_deposits (agent_id, is_active, protocol);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE leverage_positions IS 'Stores active leveraged trading positions for all agents';
COMMENT ON TABLE agent_leverage_settings IS 'Configuration and limits for agent leverage usage';
COMMENT ON TABLE profit_milestones IS 'Profit milestone configuration and trigger status';
COMMENT ON TABLE goal_completion_profits IS 'Records of profit secured when goals are completed';
COMMENT ON TABLE profit_securing_deposits IS 'DeFi protocol deposit positions for secured profits';
COMMENT ON TABLE profit_securing_borrows IS 'Borrowing positions against DeFi deposits';
COMMENT ON TABLE agent_states IS 'Persistent state storage for autonomous agent operation';
COMMENT ON TABLE automation_workflows IS 'Tracking of automated workflows and their execution';
COMMENT ON TABLE agent_integrations IS 'Master table linking agents to leverage and profit securing features';

COMMENT ON VIEW agent_integration_overview IS 'Comprehensive view of agent integration status and metrics';
COMMENT ON VIEW risk_monitoring_overview IS 'Real-time risk monitoring across all agent positions';