-- Leverage Engine Database Schema
-- Tables for managing leverage positions, risk controls, and monitoring

-- Drop existing tables if they exist (for development only)
DROP TABLE IF EXISTS leverage_risk_events CASCADE;
DROP TABLE IF EXISTS leverage_positions CASCADE;
DROP TABLE IF EXISTS agent_leverage_settings CASCADE;
DROP TABLE IF EXISTS leverage_coordination_history CASCADE;
DROP TABLE IF EXISTS leverage_performance_metrics CASCADE;

-- Agent Leverage Settings Table
CREATE TABLE agent_leverage_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    asset VARCHAR(20) NOT NULL DEFAULT 'default',
    
    -- Leverage Configuration
    current_leverage DECIMAL(5,2) DEFAULT 1.00,
    max_leverage DECIMAL(5,2) DEFAULT 20.00,
    max_portfolio_leverage DECIMAL(5,2) DEFAULT 10.00,
    max_single_position_leverage DECIMAL(5,2) DEFAULT 15.00,
    
    -- Risk Controls
    margin_call_threshold DECIMAL(5,4) DEFAULT 0.8000,  -- 80%
    liquidation_threshold DECIMAL(5,4) DEFAULT 0.9500,  -- 95%
    min_margin_buffer DECIMAL(5,4) DEFAULT 0.1000,      -- 10%
    
    -- Auto-management Settings
    auto_delever_enabled BOOLEAN DEFAULT TRUE,
    risk_monitoring_interval INTEGER DEFAULT 30,        -- seconds
    enable_circuit_breaker BOOLEAN DEFAULT TRUE,
    max_daily_loss_percentage DECIMAL(5,4) DEFAULT 0.0500, -- 5%
    
    -- Risk Tolerance
    risk_tolerance VARCHAR(20) DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    UNIQUE(agent_id, asset),
    CHECK (current_leverage >= 1.0 AND current_leverage <= max_leverage),
    CHECK (max_leverage <= 20.0),
    CHECK (margin_call_threshold < liquidation_threshold)
);

-- Create index for fast agent lookups
CREATE INDEX idx_agent_leverage_settings_agent_id ON agent_leverage_settings(agent_id);
CREATE INDEX idx_agent_leverage_settings_active ON agent_leverage_settings(is_active) WHERE is_active = TRUE;

-- Leverage Positions Table
CREATE TABLE leverage_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    
    -- Position Details
    asset VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short', 'buy', 'sell')),
    size DECIMAL(20,8) NOT NULL,
    entry_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    
    -- Leverage Information
    leverage_ratio DECIMAL(5,2) NOT NULL,
    margin_used DECIMAL(20,8) NOT NULL,
    unrealized_pnl DECIMAL(20,8) DEFAULT 0.0,
    liquidation_price DECIMAL(20,8),
    
    -- Risk Status
    margin_status VARCHAR(20) DEFAULT 'safe' CHECK (margin_status IN ('safe', 'warning', 'critical', 'liquidation')),
    risk_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Position Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated', 'partial')),
    
    -- Trading Information
    order_id VARCHAR(100),
    exchange VARCHAR(50),
    strategy VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CHECK (size > 0),
    CHECK (leverage_ratio >= 1.0 AND leverage_ratio <= 20.0),
    CHECK (margin_used > 0),
    CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Indexes for leverage positions
CREATE INDEX idx_leverage_positions_agent_id ON leverage_positions(agent_id);
CREATE INDEX idx_leverage_positions_status ON leverage_positions(status);
CREATE INDEX idx_leverage_positions_asset ON leverage_positions(asset);
CREATE INDEX idx_leverage_positions_created_at ON leverage_positions(created_at);
CREATE INDEX idx_leverage_positions_agent_status ON leverage_positions(agent_id, status);

-- Leverage Risk Events Table
CREATE TABLE leverage_risk_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    position_id UUID REFERENCES leverage_positions(position_id) ON DELETE SET NULL,
    
    -- Event Classification
    event_type VARCHAR(50) NOT NULL,  -- margin_call, liquidation_warning, auto_delever, etc.
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
    
    -- Event Details
    message TEXT NOT NULL,
    current_value DECIMAL(20,8),
    threshold_value DECIMAL(20,8),
    risk_score DECIMAL(5,2),
    
    -- Response Actions
    recommended_action VARCHAR(100),
    action_taken VARCHAR(100),
    auto_resolved BOOLEAN DEFAULT FALSE,
    
    -- Status
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Event Data (JSON for flexibility)
    event_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Indexes for risk events
CREATE INDEX idx_leverage_risk_events_agent_id ON leverage_risk_events(agent_id);
CREATE INDEX idx_leverage_risk_events_severity ON leverage_risk_events(severity);
CREATE INDEX idx_leverage_risk_events_resolved ON leverage_risk_events(resolved);
CREATE INDEX idx_leverage_risk_events_created_at ON leverage_risk_events(created_at);
CREATE INDEX idx_leverage_risk_events_type ON leverage_risk_events(event_type);

-- Leverage Coordination History Table
CREATE TABLE leverage_coordination_history (
    coordination_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Coordination Details
    strategy_name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL,
    participant_agents TEXT[] NOT NULL,  -- Array of agent IDs
    
    -- Coordination Results
    total_portfolio_leverage DECIMAL(8,4),
    optimization_score DECIMAL(5,2),
    risk_distribution JSONB,
    
    -- Agent Allocations (JSON structure)
    agent_allocations JSONB NOT NULL,
    
    -- Execution Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'failed', 'cancelled')),
    execution_time DECIMAL(8,3),  -- seconds
    
    -- Results
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    recommendations TEXT[],
    
    -- Performance Tracking
    before_leverage JSONB,  -- Agent leverages before coordination
    after_leverage JSONB,   -- Agent leverages after coordination
    performance_improvement DECIMAL(8,4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for coordination history
CREATE INDEX idx_coordination_history_strategy ON leverage_coordination_history(strategy_name);
CREATE INDEX idx_coordination_history_status ON leverage_coordination_history(status);
CREATE INDEX idx_coordination_history_created_at ON leverage_coordination_history(created_at);
CREATE INDEX idx_coordination_history_agents ON leverage_coordination_history USING GIN(participant_agents);

-- Leverage Performance Metrics Table
CREATE TABLE leverage_performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    
    -- Time Period
    measurement_date DATE NOT NULL,
    measurement_hour INTEGER CHECK (measurement_hour >= 0 AND measurement_hour <= 23),
    
    -- Leverage Metrics
    avg_leverage DECIMAL(8,4),
    max_leverage DECIMAL(8,4),
    min_leverage DECIMAL(8,4),
    leverage_volatility DECIMAL(8,4),
    
    -- Risk Metrics
    avg_margin_usage DECIMAL(8,4),
    max_margin_usage DECIMAL(8,4),
    var_1d DECIMAL(20,8),
    var_5d DECIMAL(20,8),
    
    -- Performance Metrics
    total_pnl DECIMAL(20,8),
    leverage_adjusted_pnl DECIMAL(20,8),
    positions_count INTEGER DEFAULT 0,
    successful_positions INTEGER DEFAULT 0,
    liquidated_positions INTEGER DEFAULT 0,
    
    -- Risk Events
    margin_calls INTEGER DEFAULT 0,
    auto_delever_events INTEGER DEFAULT 0,
    liquidation_warnings INTEGER DEFAULT 0,
    
    -- Efficiency Metrics
    leverage_utilization DECIMAL(8,4),  -- How efficiently leverage is used
    risk_adjusted_return DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(agent_id, measurement_date, measurement_hour)
);

-- Indexes for performance metrics
CREATE INDEX idx_performance_metrics_agent_id ON leverage_performance_metrics(agent_id);
CREATE INDEX idx_performance_metrics_date ON leverage_performance_metrics(measurement_date);
CREATE INDEX idx_performance_metrics_agent_date ON leverage_performance_metrics(agent_id, measurement_date);

-- Create views for common queries

-- Active Agent Leverage Summary
CREATE VIEW active_agent_leverage_summary AS
SELECT 
    als.agent_id,
    als.current_leverage,
    als.max_leverage,
    als.risk_tolerance,
    COUNT(lp.position_id) as active_positions,
    COALESCE(SUM(lp.margin_used), 0) as total_margin_used,
    COALESCE(SUM(lp.unrealized_pnl), 0) as total_unrealized_pnl,
    COALESCE(AVG(lp.risk_score), 0) as avg_risk_score,
    COUNT(lre.event_id) FILTER (WHERE lre.severity = 'critical' AND lre.resolved = FALSE) as critical_alerts
FROM agent_leverage_settings als
LEFT JOIN leverage_positions lp ON als.agent_id = lp.agent_id AND lp.status = 'open'
LEFT JOIN leverage_risk_events lre ON als.agent_id = lre.agent_id AND lre.created_at > NOW() - INTERVAL '24 hours'
WHERE als.is_active = TRUE
GROUP BY als.agent_id, als.current_leverage, als.max_leverage, als.risk_tolerance;

-- Portfolio Leverage Overview
CREATE VIEW portfolio_leverage_overview AS
SELECT 
    COUNT(DISTINCT agent_id) as total_agents,
    AVG(current_leverage) as avg_leverage,
    MAX(current_leverage) as max_leverage,
    SUM(total_margin_used) as total_margin_used,
    SUM(total_unrealized_pnl) as total_unrealized_pnl,
    SUM(active_positions) as total_positions,
    SUM(critical_alerts) as total_critical_alerts,
    CURRENT_TIMESTAMP as last_updated
FROM active_agent_leverage_summary;

-- Recent Risk Events Summary
CREATE VIEW recent_risk_events_summary AS
SELECT 
    agent_id,
    event_type,
    severity,
    COUNT(*) as event_count,
    MAX(created_at) as last_occurrence
FROM leverage_risk_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY agent_id, event_type, severity
ORDER BY last_occurrence DESC;

-- Functions for automatic updates

-- Function to update position current price and PnL
CREATE OR REPLACE FUNCTION update_position_metrics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calculate unrealized PnL if current_price is updated
    IF NEW.current_price IS NOT NULL AND NEW.current_price != OLD.current_price THEN
        IF NEW.side IN ('long', 'buy') THEN
            NEW.unrealized_pnl = NEW.size * (NEW.current_price - NEW.entry_price);
        ELSE
            NEW.unrealized_pnl = NEW.size * (NEW.entry_price - NEW.current_price);
        END IF;
        
        -- Update risk score based on distance to liquidation
        IF NEW.liquidation_price IS NOT NULL THEN
            NEW.risk_score = CASE 
                WHEN ABS(NEW.current_price - NEW.liquidation_price) / NEW.current_price < 0.05 THEN 95.0
                WHEN ABS(NEW.current_price - NEW.liquidation_price) / NEW.current_price < 0.10 THEN 80.0
                WHEN ABS(NEW.current_price - NEW.liquidation_price) / NEW.current_price < 0.20 THEN 60.0
                ELSE GREATEST(0, 40.0 - (ABS(NEW.current_price - NEW.liquidation_price) / NEW.current_price * 100))
            END;
        END IF;
        
        -- Update margin status
        NEW.margin_status = CASE 
            WHEN NEW.risk_score >= 90 THEN 'liquidation'
            WHEN NEW.risk_score >= 70 THEN 'critical'
            WHEN NEW.risk_score >= 40 THEN 'warning'
            ELSE 'safe'
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position updates
CREATE TRIGGER trigger_update_position_metrics
    BEFORE UPDATE ON leverage_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_position_metrics();

-- Function to automatically update agent leverage settings timestamp
CREATE OR REPLACE FUNCTION update_leverage_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leverage settings updates
CREATE TRIGGER trigger_update_leverage_settings_timestamp
    BEFORE UPDATE ON agent_leverage_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_leverage_settings_timestamp();

-- Insert sample data for testing (optional)
INSERT INTO agent_leverage_settings (agent_id, asset, current_leverage, max_leverage, risk_tolerance) VALUES
('agent_marcus_momentum', 'default', 8.5, 20.0, 'moderate'),
('agent_alex_arbitrage', 'default', 12.3, 20.0, 'aggressive'), 
('agent_sophia_reversion', 'default', 5.2, 15.0, 'conservative'),
('agent_riley_risk', 'default', 3.1, 10.0, 'conservative');

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO leverage_service_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO leverage_service_user;

-- Create materialized view for real-time dashboard (refreshed periodically)
CREATE MATERIALIZED VIEW mv_leverage_dashboard_summary AS
SELECT 
    als.agent_id,
    als.current_leverage,
    als.max_leverage,
    als.risk_tolerance,
    als.margin_call_threshold,
    als.liquidation_threshold,
    COUNT(lp.position_id) as position_count,
    COALESCE(SUM(lp.margin_used), 0) as total_margin_used,
    COALESCE(SUM(lp.unrealized_pnl), 0) as unrealized_pnl,
    COALESCE(AVG(lp.risk_score), 0) as avg_risk_score,
    COALESCE(MAX(lp.risk_score), 0) as max_risk_score,
    COUNT(lre.event_id) FILTER (WHERE lre.severity IN ('critical', 'emergency') AND lre.resolved = FALSE) as critical_events,
    als.updated_at as last_settings_update,
    MAX(lp.updated_at) as last_position_update
FROM agent_leverage_settings als
LEFT JOIN leverage_positions lp ON als.agent_id = lp.agent_id AND lp.status = 'open'
LEFT JOIN leverage_risk_events lre ON als.agent_id = lre.agent_id AND lre.created_at > NOW() - INTERVAL '1 hour'
WHERE als.is_active = TRUE
GROUP BY als.agent_id, als.current_leverage, als.max_leverage, als.risk_tolerance, 
         als.margin_call_threshold, als.liquidation_threshold, als.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_mv_leverage_dashboard_agent_id ON mv_leverage_dashboard_summary(agent_id);

-- Function to refresh the materialized view (call this periodically)
CREATE OR REPLACE FUNCTION refresh_leverage_dashboard()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leverage_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE agent_leverage_settings IS 'Configuration and limits for agent leverage usage';
COMMENT ON TABLE leverage_positions IS 'Active and historical leveraged trading positions';
COMMENT ON TABLE leverage_risk_events IS 'Risk events and alerts related to leverage usage';
COMMENT ON TABLE leverage_coordination_history IS 'History of cross-agent leverage coordination';
COMMENT ON TABLE leverage_performance_metrics IS 'Performance tracking for leveraged trading';

COMMENT ON VIEW active_agent_leverage_summary IS 'Real-time summary of active agent leverage status';
COMMENT ON VIEW portfolio_leverage_overview IS 'Portfolio-wide leverage metrics';
COMMENT ON MATERIALIZED VIEW mv_leverage_dashboard_summary IS 'Optimized dashboard data (refresh periodically)';

-- Indexes for performance optimization
CREATE INDEX CONCURRENTLY idx_leverage_positions_composite 
ON leverage_positions(agent_id, status, created_at);

CREATE INDEX CONCURRENTLY idx_risk_events_recent 
ON leverage_risk_events(agent_id, severity, resolved) 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Leverage Engine database schema created successfully!';
    RAISE NOTICE 'Tables created: agent_leverage_settings, leverage_positions, leverage_risk_events, leverage_coordination_history, leverage_performance_metrics';
    RAISE NOTICE 'Views created: active_agent_leverage_summary, portfolio_leverage_overview, recent_risk_events_summary';
    RAISE NOTICE 'Materialized view: mv_leverage_dashboard_summary (remember to refresh periodically)';
END
$$;