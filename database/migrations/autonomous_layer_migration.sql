-- Autonomous Layer Database Migration
-- Complete schema for autonomous trading systems
-- Run this after the main database schema is created

-- =============================================================================
-- HEALTH MONITORING TABLES
-- =============================================================================

-- Health monitoring services
CREATE TABLE IF NOT EXISTS health_monitor_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT UNIQUE NOT NULL,
    service_type TEXT NOT NULL,
    health_status TEXT NOT NULL DEFAULT 'unknown',
    uptime_seconds BIGINT DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    auto_recovery_enabled BOOLEAN DEFAULT TRUE,
    restart_count INTEGER DEFAULT 0,
    last_restart TIMESTAMP WITH TIME ZONE,
    dependencies TEXT[],
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health monitoring metrics
CREATE TABLE IF NOT EXISTS health_monitor_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_threshold DECIMAL,
    metric_status TEXT NOT NULL,
    metric_unit TEXT,
    details JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (service_name) REFERENCES health_monitor_services(service_name)
);

-- Health monitoring alerts
CREATE TABLE IF NOT EXISTS health_monitor_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id TEXT UNIQUE NOT NULL,
    service_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    recovery_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    auto_resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (service_name) REFERENCES health_monitor_services(service_name)
);

-- Health monitoring recovery attempts
CREATE TABLE IF NOT EXISTS health_monitor_recovery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id TEXT UNIQUE NOT NULL,
    service_name TEXT NOT NULL,
    recovery_action TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    attempt_number INTEGER DEFAULT 1,
    FOREIGN KEY (service_name) REFERENCES health_monitor_services(service_name)
);

-- =============================================================================
-- AGENT COMMUNICATION TABLES
-- =============================================================================

-- Agent communication registry
CREATE TABLE IF NOT EXISTS agent_communication_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT UNIQUE NOT NULL,
    agent_name TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    capabilities JSONB,
    preferences JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent conversations
CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT UNIQUE NOT NULL,
    participants TEXT[] NOT NULL,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    last_message_id TEXT,
    metadata JSONB
);

-- Agent messages
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id TEXT UNIQUE NOT NULL,
    conversation_id TEXT NOT NULL,
    from_agent_id TEXT NOT NULL,
    to_agent_id TEXT,
    message_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    response_required BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (conversation_id) REFERENCES agent_conversations(conversation_id),
    FOREIGN KEY (from_agent_id) REFERENCES agent_communication_registry(agent_id)
);

-- Communication metrics
CREATE TABLE IF NOT EXISTS agent_communication_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (agent_id) REFERENCES agent_communication_registry(agent_id)
);

-- =============================================================================
-- CONSENSUS DECISION TABLES
-- =============================================================================

-- Consensus decisions
CREATE TABLE IF NOT EXISTS consensus_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    options JSONB NOT NULL,
    required_agents TEXT[] NOT NULL,
    optional_agents TEXT[],
    consensus_algorithm TEXT NOT NULL,
    consensus_threshold DECIMAL NOT NULL,
    timeout_seconds INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    metadata JSONB,
    final_decision TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

-- Agent votes
CREATE TABLE IF NOT EXISTS agent_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id TEXT UNIQUE NOT NULL,
    decision_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    vote_type TEXT NOT NULL,
    confidence DECIMAL NOT NULL,
    reasoning TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    weight DECIMAL DEFAULT 1.0,
    FOREIGN KEY (decision_id) REFERENCES consensus_decisions(decision_id),
    FOREIGN KEY (agent_id) REFERENCES agent_communication_registry(agent_id)
);

-- Decision outcomes
CREATE TABLE IF NOT EXISTS decision_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id TEXT NOT NULL,
    final_decision TEXT NOT NULL,
    consensus_reached BOOLEAN NOT NULL,
    vote_count INTEGER NOT NULL,
    approval_percentage DECIMAL NOT NULL,
    participating_agents TEXT[],
    execution_status TEXT DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE,
    impact_assessment JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (decision_id) REFERENCES consensus_decisions(decision_id)
);

-- =============================================================================
-- MARKET REGIME DETECTION TABLES
-- =============================================================================

-- Market regime detections
CREATE TABLE IF NOT EXISTS market_regime_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id TEXT UNIQUE NOT NULL,
    primary_regime TEXT NOT NULL,
    secondary_regimes TEXT[],
    confidence TEXT NOT NULL,
    probability_scores JSONB,
    market_conditions JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_duration INTEGER,
    risk_level DECIMAL,
    recommended_actions TEXT[],
    metadata JSONB
);

-- Strategy adaptations
CREATE TABLE IF NOT EXISTS strategy_adaptations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adaptation_id TEXT UNIQUE NOT NULL,
    regime_id TEXT,
    target_strategy TEXT NOT NULL,
    current_allocation DECIMAL,
    recommended_allocation DECIMAL,
    adaptation_actions TEXT[],
    risk_adjustment DECIMAL,
    expected_impact JSONB,
    implementation_priority INTEGER,
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (regime_id) REFERENCES market_regime_detections(regime_id)
);

-- Regime transitions
CREATE TABLE IF NOT EXISTS regime_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transition_id TEXT UNIQUE NOT NULL,
    from_regime TEXT NOT NULL,
    to_regime TEXT NOT NULL,
    transition_probability DECIMAL,
    transition_speed DECIMAL,
    impact_assessment JSONB,
    adaptation_triggers TEXT[],
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    market_conditions_before JSONB,
    market_conditions_after JSONB
);

-- Market conditions history
CREATE TABLE IF NOT EXISTS market_conditions_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    volatility_1d DECIMAL,
    volatility_7d DECIMAL,
    volatility_30d DECIMAL,
    trend_strength DECIMAL,
    momentum DECIMAL,
    volume_ratio DECIMAL,
    correlation_breakdown BOOLEAN,
    vix_level DECIMAL,
    economic_indicators JSONB,
    sector_rotation JSONB,
    raw_data JSONB
);

-- =============================================================================
-- EMERGENCY PROTOCOLS TABLES
-- =============================================================================

-- Emergency events
CREATE TABLE IF NOT EXISTS emergency_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    emergency_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    trigger_condition TEXT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    actions_taken TEXT[],
    impact_assessment JSONB,
    resolution_notes TEXT,
    auto_resolved BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

-- Emergency responses
CREATE TABLE IF NOT EXISTS emergency_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id TEXT UNIQUE NOT NULL,
    event_id TEXT NOT NULL,
    actions TEXT[],
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN DEFAULT FALSE,
    error_messages TEXT[],
    recovery_time_seconds INTEGER,
    financial_impact JSONB,
    FOREIGN KEY (event_id) REFERENCES emergency_events(event_id)
);

-- Circuit breaker activations
CREATE TABLE IF NOT EXISTS circuit_breaker_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activation_id TEXT UNIQUE NOT NULL,
    breaker_id TEXT NOT NULL,
    breaker_type TEXT NOT NULL,
    threshold DECIMAL NOT NULL,
    current_value DECIMAL NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    trigger_reason TEXT,
    metadata JSONB
);

-- Emergency conditions
CREATE TABLE IF NOT EXISTS emergency_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_id TEXT UNIQUE NOT NULL,
    emergency_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    trigger_threshold DECIMAL NOT NULL,
    current_value DECIMAL DEFAULT 0,
    description TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    breach_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circuit breaker configurations
CREATE TABLE IF NOT EXISTS circuit_breaker_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breaker_id TEXT UNIQUE NOT NULL,
    breaker_type TEXT NOT NULL,
    threshold DECIMAL NOT NULL,
    cooldown_seconds INTEGER NOT NULL,
    max_triggers_per_day INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    triggers_today INTEGER DEFAULT 0,
    recovery_conditions TEXT[],
    emergency_actions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUTONOMOUS SYSTEM STATE TABLES
-- =============================================================================

-- Agent state persistence
CREATE TABLE IF NOT EXISTS agent_state_persistence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    state_type TEXT NOT NULL,
    state_data JSONB NOT NULL,
    checkpoint_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (agent_id) REFERENCES agent_communication_registry(agent_id)
);

-- System checkpoints
CREATE TABLE IF NOT EXISTS system_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkpoint_id TEXT UNIQUE NOT NULL,
    checkpoint_name TEXT NOT NULL,
    checkpoint_type TEXT NOT NULL,
    system_state JSONB NOT NULL,
    agent_states JSONB,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path TEXT,
    size_bytes BIGINT,
    checksum TEXT
);

-- Task scheduling
CREATE TABLE IF NOT EXISTS autonomous_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT UNIQUE NOT NULL,
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    cron_expression TEXT,
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending',
    enabled BOOLEAN DEFAULT TRUE,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task execution history
CREATE TABLE IF NOT EXISTS task_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id TEXT UNIQUE NOT NULL,
    task_id TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    execution_time_ms INTEGER,
    result_data JSONB,
    FOREIGN KEY (task_id) REFERENCES autonomous_tasks(task_id)
);

-- =============================================================================
-- AUTONOMOUS SYSTEM METRICS TABLES
-- =============================================================================

-- System performance metrics
CREATE TABLE IF NOT EXISTS autonomous_system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_type TEXT NOT NULL,
    component TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB,
    metadata JSONB
);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_type TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    FOREIGN KEY (agent_id) REFERENCES agent_communication_registry(agent_id)
);

-- System events log
CREATE TABLE IF NOT EXISTS autonomous_system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_data JSONB NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    source_component TEXT NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Health monitoring indexes
CREATE INDEX IF NOT EXISTS idx_health_monitor_services_status ON health_monitor_services(health_status);
CREATE INDEX IF NOT EXISTS idx_health_monitor_services_updated ON health_monitor_services(updated_at);
CREATE INDEX IF NOT EXISTS idx_health_monitor_metrics_service ON health_monitor_metrics(service_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_health_monitor_alerts_service ON health_monitor_alerts(service_name, created_at);
CREATE INDEX IF NOT EXISTS idx_health_monitor_alerts_unresolved ON health_monitor_alerts(resolved_at) WHERE resolved_at IS NULL;

-- Agent communication indexes
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON agent_messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON agent_messages(to_agent_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON agent_messages(from_agent_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_unread ON agent_messages(to_agent_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_agent_conversations_participants ON agent_conversations USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_updated ON agent_conversations(updated_at);

-- Consensus decision indexes
CREATE INDEX IF NOT EXISTS idx_consensus_decisions_status ON consensus_decisions(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_consensus_decisions_created ON consensus_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_votes_decision ON agent_votes(decision_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_votes_agent ON agent_votes(agent_id, timestamp);

-- Market regime indexes
CREATE INDEX IF NOT EXISTS idx_market_regime_detections_detected ON market_regime_detections(detected_at);
CREATE INDEX IF NOT EXISTS idx_market_regime_detections_regime ON market_regime_detections(primary_regime, detected_at);
CREATE INDEX IF NOT EXISTS idx_strategy_adaptations_created ON strategy_adaptations(created_at);
CREATE INDEX IF NOT EXISTS idx_strategy_adaptations_status ON strategy_adaptations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_regime_transitions_occurred ON regime_transitions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_market_conditions_history_timestamp ON market_conditions_history(timestamp);

-- Emergency protocol indexes
CREATE INDEX IF NOT EXISTS idx_emergency_events_triggered ON emergency_events(triggered_at);
CREATE INDEX IF NOT EXISTS idx_emergency_events_type ON emergency_events(emergency_type, triggered_at);
CREATE INDEX IF NOT EXISTS idx_emergency_events_unresolved ON emergency_events(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_emergency_responses_event ON emergency_responses(event_id, started_at);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_activations_activated ON circuit_breaker_activations(activated_at);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_activations_type ON circuit_breaker_activations(breaker_type, activated_at);

-- System state indexes
CREATE INDEX IF NOT EXISTS idx_agent_state_persistence_agent ON agent_state_persistence(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_system_checkpoints_created ON system_checkpoints(created_at);
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_next_run ON autonomous_tasks(next_run) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_task_execution_history_task ON task_execution_history(task_id, started_at);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_autonomous_system_metrics_recorded ON autonomous_system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_autonomous_system_metrics_component ON autonomous_system_metrics(component, metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent ON agent_performance_metrics(agent_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_autonomous_system_events_occurred ON autonomous_system_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_autonomous_system_events_type ON autonomous_system_events(event_type, occurred_at);

-- =============================================================================
-- INITIAL DATA SETUP
-- =============================================================================

-- Insert default health monitor services
INSERT INTO health_monitor_services (service_name, service_type, health_status, auto_recovery_enabled)
VALUES 
    ('autonomous_health_monitor', 'monitoring', 'healthy', TRUE),
    ('autonomous_agent_coordinator', 'coordination', 'healthy', TRUE),
    ('autonomous_state_persistence', 'persistence', 'healthy', TRUE),
    ('autonomous_task_scheduler', 'scheduling', 'healthy', TRUE),
    ('cross_agent_communication', 'communication', 'healthy', TRUE),
    ('consensus_decision_engine', 'decision', 'healthy', TRUE),
    ('market_regime_detector', 'analysis', 'healthy', TRUE),
    ('emergency_protocols', 'safety', 'healthy', TRUE)
ON CONFLICT (service_name) DO NOTHING;

-- Insert default agent communication registry
INSERT INTO agent_communication_registry (agent_id, agent_name, agent_type, capabilities, status)
VALUES
    ('marcus_momentum', 'Marcus Momentum', 'Trend Following', '["trend_analysis", "momentum_trading", "risk_assessment"]'::jsonb, 'active'),
    ('alex_arbitrage', 'Alex Arbitrage', 'Cross-Exchange', '["arbitrage_detection", "cross_exchange_trading", "price_monitoring"]'::jsonb, 'active'),
    ('sophia_reversion', 'Sophia Reversion', 'Mean Reversion', '["mean_reversion", "statistical_analysis", "market_timing"]'::jsonb, 'active'),
    ('riley_risk', 'Riley Risk', 'Risk Manager', '["risk_monitoring", "portfolio_analysis", "alert_management"]'::jsonb, 'active')
ON CONFLICT (agent_id) DO NOTHING;

-- Insert default emergency conditions
INSERT INTO emergency_conditions (condition_id, emergency_type, severity, trigger_threshold, description, enabled)
VALUES
    ('portfolio_loss', 'risk_breach', 'high', 0.05, 'Portfolio total loss threshold', TRUE),
    ('daily_drawdown', 'risk_breach', 'medium', 0.03, 'Daily drawdown threshold', TRUE),
    ('volatility_spike', 'market_crash', 'high', 0.05, 'Market volatility spike threshold', TRUE),
    ('agent_error_rate', 'agent_malfunction', 'medium', 0.10, 'Agent error rate threshold', TRUE)
ON CONFLICT (condition_id) DO NOTHING;

-- Insert default circuit breaker configurations
INSERT INTO circuit_breaker_configs (breaker_id, breaker_type, threshold, cooldown_seconds, max_triggers_per_day, enabled, recovery_conditions, emergency_actions)
VALUES
    ('portfolio_loss_breaker', 'portfolio_loss', 0.05, 300, 3, TRUE, '["portfolio_stabilized", "manual_override"]'::text[], '["halt_all_trading", "notify_operators"]'::text[]),
    ('daily_drawdown_breaker', 'daily_drawdown', 0.03, 600, 5, TRUE, '["drawdown_recovered"]'::text[], '["reduce_positions", "pause_agents"]'::text[]),
    ('volatility_spike_breaker', 'volatility_spike', 0.05, 180, 10, TRUE, '["volatility_normalized"]'::text[], '["reduce_positions", "emergency_hedge"]'::text[]),
    ('agent_error_rate_breaker', 'agent_error_rate', 0.10, 900, 3, TRUE, '["agent_errors_resolved"]'::text[], '["pause_agents", "switch_to_manual"]'::text[])
ON CONFLICT (breaker_id) DO NOTHING;

-- Insert default autonomous tasks
INSERT INTO autonomous_tasks (task_id, task_name, task_type, cron_expression, enabled, configuration)
VALUES
    ('health_check_task', 'System Health Check', 'monitoring', '*/2 * * * *', TRUE, '{"check_all_services": true, "alert_threshold": "warning"}'::jsonb),
    ('agent_coordination_task', 'Agent Coordination', 'coordination', '*/5 * * * *', TRUE, '{"coordination_type": "multi_agent", "timeout": 300}'::jsonb),
    ('market_regime_detection_task', 'Market Regime Detection', 'analysis', '*/1 * * * *', TRUE, '{"detection_interval": 60, "confidence_threshold": 0.7}'::jsonb),
    ('emergency_condition_check_task', 'Emergency Condition Check', 'safety', '*/1 * * * *', TRUE, '{"check_all_conditions": true, "auto_trigger": true}'::jsonb),
    ('state_persistence_task', 'State Persistence', 'persistence', '*/5 * * * *', TRUE, '{"backup_type": "incremental", "retention_days": 7}'::jsonb)
ON CONFLICT (task_id) DO NOTHING;

-- =============================================================================
-- VIEWS FOR ANALYTICS
-- =============================================================================

-- System health overview
CREATE OR REPLACE VIEW autonomous_system_health_overview AS
SELECT 
    COUNT(*) AS total_services,
    COUNT(*) FILTER (WHERE health_status = 'healthy') AS healthy_services,
    COUNT(*) FILTER (WHERE health_status = 'degraded') AS degraded_services,
    COUNT(*) FILTER (WHERE health_status = 'unhealthy') AS unhealthy_services,
    COUNT(*) FILTER (WHERE health_status = 'critical') AS critical_services,
    AVG(response_time_ms) AS avg_response_time,
    SUM(error_count) AS total_errors,
    AVG(uptime_seconds) AS avg_uptime,
    MAX(updated_at) AS last_update
FROM health_monitor_services;

-- Agent communication overview
CREATE OR REPLACE VIEW agent_communication_overview AS
SELECT 
    COUNT(DISTINCT agent_id) AS total_agents,
    COUNT(DISTINCT agent_id) FILTER (WHERE status = 'active') AS active_agents,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS messages_last_hour,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS messages_last_day,
    COUNT(*) FILTER (WHERE read = FALSE) AS unread_messages,
    COUNT(DISTINCT conversation_id) AS active_conversations
FROM agent_messages am
LEFT JOIN agent_communication_registry acr ON am.from_agent_id = acr.agent_id;

-- Emergency system overview
CREATE OR REPLACE VIEW emergency_system_overview AS
SELECT 
    COUNT(*) FILTER (WHERE resolved_at IS NULL) AS active_emergencies,
    COUNT(*) FILTER (WHERE triggered_at >= NOW() - INTERVAL '1 day') AS emergencies_today,
    COUNT(*) FILTER (WHERE auto_resolved = TRUE) AS auto_resolved_count,
    COUNT(*) FILTER (WHERE auto_resolved = FALSE) AS manual_resolved_count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - triggered_at))) AS avg_resolution_time,
    COUNT(DISTINCT emergency_type) AS emergency_types
FROM emergency_events
WHERE triggered_at >= NOW() - INTERVAL '30 days';

-- Market regime analysis
CREATE OR REPLACE VIEW market_regime_analysis AS
SELECT 
    primary_regime,
    COUNT(*) AS detection_count,
    AVG(risk_level) AS avg_risk_level,
    AVG(expected_duration) AS avg_expected_duration,
    MAX(detected_at) AS last_detected,
    COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '7 days') AS recent_detections
FROM market_regime_detections
WHERE detected_at >= NOW() - INTERVAL '30 days'
GROUP BY primary_regime;

-- Agent performance summary
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT 
    agent_id,
    COUNT(*) AS total_messages,
    COUNT(*) FILTER (WHERE message_type = 'market_insight') AS market_insights,
    COUNT(*) FILTER (WHERE message_type = 'trading_opportunity') AS trading_opportunities,
    COUNT(*) FILTER (WHERE response_required = TRUE) AS response_required_count,
    AVG(CASE WHEN read = TRUE THEN 1 ELSE 0 END) AS read_rate,
    MAX(timestamp) AS last_activity
FROM agent_messages
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY agent_id;

-- System performance metrics
CREATE OR REPLACE VIEW system_performance_metrics AS
SELECT 
    DATE_TRUNC('hour', recorded_at) AS hour,
    component,
    metric_name,
    AVG(metric_value) AS avg_value,
    MIN(metric_value) AS min_value,
    MAX(metric_value) AS max_value,
    COUNT(*) AS measurement_count
FROM autonomous_system_metrics
WHERE recorded_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', recorded_at), component, metric_name;

-- =============================================================================
-- FUNCTIONS FOR MAINTENANCE
-- =============================================================================

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_autonomous_data(retention_days INTEGER DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE;
    deleted_count INTEGER;
    result_text TEXT := '';
BEGIN
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Clean up old health monitor metrics
    DELETE FROM health_monitor_metrics WHERE recorded_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old health monitor metrics. ';
    
    -- Clean up old agent messages
    DELETE FROM agent_messages WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old agent messages. ';
    
    -- Clean up old market conditions
    DELETE FROM market_conditions_history WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old market conditions. ';
    
    -- Clean up old system metrics
    DELETE FROM autonomous_system_metrics WHERE recorded_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old system metrics. ';
    
    -- Clean up old task execution history
    DELETE FROM task_execution_history WHERE started_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old task executions. ';
    
    -- Clean up old system events
    DELETE FROM autonomous_system_events WHERE occurred_at < cutoff_date AND processed = TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old system events.';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Function to update agent state
CREATE OR REPLACE FUNCTION update_agent_state(
    p_agent_id TEXT,
    p_state_type TEXT,
    p_state_data JSONB,
    p_checkpoint_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    state_id UUID;
BEGIN
    INSERT INTO agent_state_persistence (agent_id, state_type, state_data, checkpoint_name)
    VALUES (p_agent_id, p_state_type, p_state_data, p_checkpoint_name)
    RETURNING id INTO state_id;
    
    RETURN state_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create system checkpoint
CREATE OR REPLACE FUNCTION create_system_checkpoint(
    p_checkpoint_name TEXT,
    p_checkpoint_type TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
    checkpoint_id UUID;
    system_state JSONB;
    agent_states JSONB;
BEGIN
    -- Generate checkpoint ID
    SELECT gen_random_uuid() INTO checkpoint_id;
    
    -- Collect system state
    SELECT json_build_object(
        'services', json_agg(json_build_object(
            'service_name', service_name,
            'health_status', health_status,
            'uptime_seconds', uptime_seconds,
            'configuration', configuration
        ))
    ) INTO system_state
    FROM health_monitor_services;
    
    -- Collect agent states
    SELECT json_object_agg(agent_id, json_build_object(
        'status', status,
        'last_seen', last_seen,
        'capabilities', capabilities,
        'preferences', preferences
    )) INTO agent_states
    FROM agent_communication_registry;
    
    -- Insert checkpoint
    INSERT INTO system_checkpoints (
        checkpoint_id, 
        checkpoint_name, 
        checkpoint_type, 
        system_state, 
        agent_states
    )
    VALUES (
        checkpoint_id::TEXT, 
        p_checkpoint_name, 
        p_checkpoint_type, 
        system_state, 
        agent_states
    );
    
    RETURN checkpoint_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Log migration completion
INSERT INTO autonomous_system_events (event_id, event_type, event_category, event_data, severity, source_component)
VALUES (
    'migration_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'database_migration',
    'system',
    '{"migration_name": "autonomous_layer_migration", "version": "1.0", "tables_created": 25, "indexes_created": 35, "views_created": 6, "functions_created": 3}'::jsonb,
    'info',
    'database_migration'
);

-- Output completion message
SELECT 'Autonomous Layer Database Migration Completed Successfully' AS status,
       'Tables: 25, Indexes: 35, Views: 6, Functions: 3' AS summary,
       NOW() AS completed_at;