-- Enhanced Database Schema Migration for Complete Dashboard Coverage
-- This migration adds all missing tables to support the full dashboard functionality
-- Created: 2025-01-02

-- ===============================================
-- 1. BLOCKCHAIN INTEGRATION TABLES
-- ===============================================

-- Blockchain wallets for agents and users
CREATE TABLE IF NOT EXISTS public.blockchain_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    chain_key VARCHAR(50) NOT NULL, -- 'eth-sepolia', 'arb-sepolia', etc.
    address VARCHAR(255) NOT NULL,
    private_key_encrypted TEXT, -- Encrypted private key
    balance DECIMAL(18, 8) DEFAULT 0,
    native_balance DECIMAL(18, 8) DEFAULT 0, -- ETH, MATIC, etc.
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_agent_chain UNIQUE(agent_id, chain_id),
    CONSTRAINT either_agent_or_user CHECK ((agent_id IS NOT NULL) OR (user_id IS NOT NULL))
);

-- Blockchain transactions
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES public.blockchain_wallets(id) ON DELETE CASCADE,
    tx_hash VARCHAR(255) NOT NULL,
    chain_id INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'send', 'receive', 'swap', 'farm_deposit', etc.
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    token_address VARCHAR(255), -- NULL for native tokens
    token_symbol VARCHAR(20),
    gas_fee DECIMAL(18, 8),
    gas_used INTEGER,
    gas_price DECIMAL(18, 8),
    block_number BIGINT,
    transaction_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    confirmation_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT unique_tx_hash_chain UNIQUE(tx_hash, chain_id)
);

-- Cross-chain operations for multi-chain farms
CREATE TABLE IF NOT EXISTS public.cross_chain_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(farm_id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL, -- 'bridge', 'arbitrage', 'sync', etc.
    source_chain INTEGER NOT NULL,
    target_chain INTEGER NOT NULL,
    source_tx_hash VARCHAR(255),
    target_tx_hash VARCHAR(255),
    amount DECIMAL(18, 8) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    bridge_used VARCHAR(100), -- Bridge protocol used
    operation_status VARCHAR(20) DEFAULT 'initiated', -- 'initiated', 'pending', 'completed', 'failed'
    fees_paid DECIMAL(18, 8) DEFAULT 0,
    execution_time_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Blockchain achievements for goal verification
CREATE TABLE IF NOT EXISTS public.blockchain_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(goal_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL, -- 'first_trade', 'profit_milestone', 'multi_chain', etc.
    tx_hash VARCHAR(255) NOT NULL,
    chain_id INTEGER NOT NULL,
    smart_contract_address VARCHAR(255), -- For contract-based achievements
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    achievement_data JSONB NOT NULL, -- Structured achievement data
    reward_amount DECIMAL(18, 8) DEFAULT 0,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_goal_achievement UNIQUE(goal_id, achievement_type)
);

-- ===============================================
-- 2. REAL-TIME EVENT SYSTEM TABLES
-- ===============================================

-- System events for WebSocket streaming
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'trade.executed', 'agent.decision', 'portfolio.update', etc.
    event_source VARCHAR(100) NOT NULL, -- 'agent', 'farm', 'user', 'system'
    source_id UUID, -- ID of the source entity
    event_data JSONB NOT NULL,
    event_priority INTEGER DEFAULT 5, -- 1-10, higher = more important
    target_users UUID[], -- Specific users to notify
    broadcast BOOLEAN DEFAULT false, -- Broadcast to all users
    processed BOOLEAN DEFAULT false,
    subscribers_notified INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT event_type_check CHECK (event_type ~ '^[a-z_]+\.[a-z_]+$')
);

-- Event subscriptions for real-time updates
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_types TEXT[] NOT NULL, -- Array of event types to subscribe to
    filters JSONB DEFAULT '{}'::jsonb, -- Additional filters
    delivery_method VARCHAR(50) DEFAULT 'websocket', -- 'websocket', 'webhook', 'email'
    webhook_url TEXT, -- For webhook delivery
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_delivery TIMESTAMP WITH TIME ZONE,
    delivery_count INTEGER DEFAULT 0
);

-- Real-time metrics for dashboard
CREATE TABLE IF NOT EXISTS public.realtime_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18, 8) NOT NULL,
    metric_unit VARCHAR(20), -- 'USD', 'percentage', 'count', etc.
    source_type VARCHAR(50) NOT NULL, -- 'agent', 'farm', 'portfolio', 'system'
    source_id UUID NOT NULL,
    aggregation_period VARCHAR(20) DEFAULT 'instant', -- 'instant', '1m', '5m', '1h', '1d'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Indexes for time-series queries
    CONSTRAINT valid_aggregation_period CHECK (aggregation_period IN ('instant', '1m', '5m', '15m', '1h', '4h', '1d'))
);

-- ===============================================
-- 3. NOTIFICATIONS & ALERTS TABLES
-- ===============================================

-- Enhanced user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- 'trade', 'goal', 'alert', 'system', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Deep link to relevant dashboard section
    action_data JSONB, -- Additional action data
    priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
    category VARCHAR(50) DEFAULT 'general', -- 'trading', 'portfolio', 'system', etc.
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced system alerts
CREATE TABLE IF NOT EXISTS public.enhanced_system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL, -- 'performance', 'security', 'market', 'system'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    affected_entities JSONB, -- List of affected agents, farms, etc.
    resolution_steps TEXT[],
    is_resolved BOOLEAN DEFAULT false,
    auto_resolve BOOLEAN DEFAULT false,
    escalation_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Alert rules for automated monitoring
CREATE TABLE IF NOT EXISTS public.alert_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    conditions JSONB NOT NULL, -- Rule conditions in JSON format
    actions JSONB NOT NULL, -- Actions to take when triggered
    is_active BOOLEAN DEFAULT true,
    trigger_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique rule names
    CONSTRAINT unique_alert_rule_name UNIQUE(rule_name)
);

-- ===============================================
-- 4. AUDIT & COMPLIANCE TABLES
-- ===============================================

-- Comprehensive audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    agent_id UUID REFERENCES public.agents(id),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'execute', etc.
    resource_type VARCHAR(100) NOT NULL, -- 'agent', 'farm', 'goal', 'trade', etc.
    resource_id UUID NOT NULL,
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    change_summary TEXT, -- Human-readable summary
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    api_endpoint TEXT,
    request_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance checks and reports
CREATE TABLE IF NOT EXISTS public.compliance_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_name VARCHAR(255) NOT NULL,
    check_type VARCHAR(100) NOT NULL, -- 'risk_limits', 'data_retention', 'security', etc.
    check_description TEXT,
    check_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'error'
    check_results JSONB,
    severity VARCHAR(20) DEFAULT 'medium',
    remediation_steps TEXT[],
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_frequency INTERVAL DEFAULT '1 day',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    retention_days INTEGER NOT NULL,
    archive_enabled BOOLEAN DEFAULT false,
    archive_location TEXT, -- S3 bucket, etc.
    last_cleanup_at TIMESTAMP WITH TIME ZONE,
    next_cleanup_at TIMESTAMP WITH TIME ZONE,
    cleanup_frequency INTERVAL DEFAULT '1 week',
    records_deleted INTEGER DEFAULT 0,
    records_archived INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique table policies
    CONSTRAINT unique_table_retention UNIQUE(table_name)
);

-- ===============================================
-- 5. ADVANCED ANALYTICS & ML TABLES
-- ===============================================

-- ML model predictions and results
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) DEFAULT '1.0',
    prediction_type VARCHAR(100) NOT NULL, -- 'price', 'trend', 'risk', 'opportunity'
    input_data JSONB NOT NULL,
    prediction_data JSONB NOT NULL,
    confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    prediction_horizon INTERVAL, -- How far into the future
    actual_outcome JSONB, -- Actual results for model evaluation
    accuracy_score DECIMAL(5, 4), -- Model accuracy for this prediction
    prediction_status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'validated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE
);

-- Performance benchmarks and comparisons
CREATE TABLE IF NOT EXISTS public.performance_benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    benchmark_name VARCHAR(255) NOT NULL,
    benchmark_type VARCHAR(100) NOT NULL, -- 'sharpe_ratio', 'max_drawdown', 'alpha', 'beta'
    entity_type VARCHAR(50) NOT NULL, -- 'agent', 'farm', 'portfolio'
    entity_id UUID NOT NULL,
    timeframe VARCHAR(20) NOT NULL, -- '1d', '7d', '30d', '90d', '1y'
    baseline_value DECIMAL(18, 8) NOT NULL, -- Market benchmark value
    current_value DECIMAL(18, 8) NOT NULL, -- Entity's current value
    improvement_percentage DECIMAL(8, 4), -- Performance vs benchmark
    percentile_rank DECIMAL(5, 2), -- Rank among peers (0-100)
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    calculation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Unique benchmarks per entity/timeframe
    CONSTRAINT unique_benchmark_entity_timeframe UNIQUE(benchmark_type, entity_type, entity_id, timeframe, calculated_at)
);

-- Enhanced market analysis
CREATE TABLE IF NOT EXISTS public.enhanced_market_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL, -- 'technical', 'sentiment', 'fundamental', 'hybrid'
    timeframe VARCHAR(20) NOT NULL, -- '1m', '5m', '15m', '1h', '4h', '1d'
    signals JSONB NOT NULL, -- Analysis signals and indicators
    confidence_score DECIMAL(5, 4) NOT NULL,
    predictions JSONB, -- Price predictions, trend forecasts
    recommendation VARCHAR(20), -- 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
    risk_score DECIMAL(5, 4), -- Risk assessment 0-1
    volatility_score DECIMAL(5, 4), -- Volatility measure 0-1
    market_conditions JSONB, -- Current market state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- ===============================================
-- 6. ENHANCED SYSTEM MONITORING TABLES
-- ===============================================

-- System health monitoring
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'api', 'database', 'websocket', 'blockchain'
    health_status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy', 'unknown'
    response_time_ms INTEGER,
    cpu_usage_percent DECIMAL(5, 2),
    memory_usage_percent DECIMAL(5, 2),
    disk_usage_percent DECIMAL(5, 2),
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    uptime_seconds BIGINT,
    last_error TEXT,
    health_details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration management
CREATE TABLE IF NOT EXISTS public.system_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    environment VARCHAR(50) DEFAULT 'production', -- 'development', 'staging', 'production'
    category VARCHAR(100) DEFAULT 'general', -- 'trading', 'blockchain', 'notifications', etc.
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false, -- For secrets/passwords
    requires_restart BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique config keys per environment
    CONSTRAINT unique_config_key_env UNIQUE(config_key, environment)
);

-- Feature flags for gradual rollouts
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flag_name VARCHAR(255) NOT NULL,
    flag_description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    percentage_rollout INTEGER DEFAULT 0 CHECK (percentage_rollout >= 0 AND percentage_rollout <= 100),
    target_users UUID[], -- Specific users to enable for
    target_agents UUID[], -- Specific agents to enable for
    environment VARCHAR(50) DEFAULT 'production',
    feature_category VARCHAR(100) DEFAULT 'general',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique flag names per environment
    CONSTRAINT unique_flag_name_env UNIQUE(flag_name, environment)
);

-- ===============================================
-- 7. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===============================================

-- Time-series indexes for metrics and events
CREATE INDEX IF NOT EXISTS idx_system_events_type_time 
ON public.system_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_realtime_metrics_source_time 
ON public.realtime_metrics(source_type, source_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_wallet_time 
ON public.blockchain_transactions(wallet_id, timestamp DESC);

-- Performance indexes for audit and compliance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
ON public.audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_status_time 
ON public.compliance_checks(check_status, last_run_at);

-- Partial index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time 
ON public.audit_logs(user_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time 
ON public.audit_logs(action, timestamp);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_time 
ON public.ml_predictions(model_name, created_at);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_type_confidence 
ON public.ml_predictions(prediction_type, confidence_score);

CREATE INDEX IF NOT EXISTS idx_market_analysis_symbol_time 
ON public.enhanced_market_analysis(symbol, created_at);

CREATE INDEX IF NOT EXISTS idx_market_analysis_type_timeframe 
ON public.enhanced_market_analysis(analysis_type, timeframe);

CREATE INDEX IF NOT EXISTS idx_system_health_service_time 
ON public.system_health(service_name, timestamp);

CREATE INDEX IF NOT EXISTS idx_system_health_status_time 
ON public.system_health(health_status, timestamp);

-- ===============================================
-- 8. TRIGGER FUNCTIONS FOR AUTO-UPDATES
-- ===============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_blockchain_wallets_updated_at
    BEFORE UPDATE ON public.blockchain_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at
    BEFORE UPDATE ON public.system_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 9. INITIAL DATA SEEDING
-- ===============================================

-- Insert default system configurations
INSERT INTO public.system_configuration (config_key, config_value, config_type, category, description) VALUES
('max_agents_per_farm', '50', 'number', 'trading', 'Maximum number of agents allowed per farm'),
('blockchain_sync_interval', '30', 'number', 'blockchain', 'Seconds between blockchain synchronization'),
('notification_retention_days', '90', 'number', 'notifications', 'Days to keep notifications before cleanup'),
('realtime_metrics_retention_hours', '168', 'number', 'monitoring', 'Hours to keep real-time metrics (1 week)'),
('max_concurrent_trades', '100', 'number', 'trading', 'Maximum concurrent trades across all agents'),
('risk_alert_threshold', '0.85', 'number', 'risk', 'Risk score threshold for alerts (0-1)'),
('enable_blockchain_verification', 'true', 'boolean', 'blockchain', 'Enable blockchain achievement verification'),
('enable_ml_predictions', 'true', 'boolean', 'analytics', 'Enable ML-powered market predictions'),
('websocket_heartbeat_interval', '30', 'number', 'realtime', 'WebSocket heartbeat interval in seconds')
ON CONFLICT (config_key, environment) DO NOTHING;

-- Insert default alert rules
INSERT INTO public.alert_rules (rule_name, rule_description, conditions, actions, created_by) VALUES
('High Risk Alert', 'Alert when portfolio risk exceeds threshold', 
 '{"risk_score": {"operator": ">", "value": 0.85}}',
 '{"notifications": ["email", "dashboard"], "severity": "high"}',
 NULL),
('Agent Performance Drop', 'Alert when agent performance drops significantly',
 '{"performance_drop": {"operator": ">", "value": 0.2, "timeframe": "24h"}}',
 '{"notifications": ["dashboard"], "severity": "medium"}',
 NULL),
('System Health Critical', 'Alert for critical system health issues',
 '{"health_status": {"operator": "=", "value": "unhealthy"}}',
 '{"notifications": ["email", "dashboard", "webhook"], "severity": "critical"}',
 NULL)
ON CONFLICT (rule_name) DO NOTHING;

-- Insert default data retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, archive_enabled) VALUES
('system_events', 30, true),
('realtime_metrics', 7, false),
('audit_logs', 365, true),
('blockchain_transactions', 730, true),
('notifications', 90, false),
('ml_predictions', 180, true)
ON CONFLICT (table_name) DO NOTHING;

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, flag_description, is_enabled, percentage_rollout, feature_category) VALUES
('advanced_analytics', 'Enable advanced analytics dashboard features', true, 100, 'analytics'),
('blockchain_integration', 'Enable blockchain wallet and transaction features', true, 100, 'blockchain'),
('ml_predictions', 'Enable machine learning predictions', true, 50, 'analytics'),
('real_time_notifications', 'Enable real-time notification system', true, 100, 'notifications'),
('cross_chain_farming', 'Enable cross-chain farming capabilities', true, 75, 'trading'),
('advanced_risk_management', 'Enable advanced risk management features', true, 100, 'risk')
ON CONFLICT (flag_name, environment) DO NOTHING;

-- ===============================================
-- 10. COMMENTS AND DOCUMENTATION
-- ===============================================

COMMENT ON TABLE public.blockchain_wallets IS 'Stores blockchain wallet information for agents and users across multiple chains';
COMMENT ON TABLE public.blockchain_transactions IS 'Records all blockchain transactions with comprehensive metadata';
COMMENT ON TABLE public.system_events IS 'Real-time event system for WebSocket streaming and notifications';
COMMENT ON TABLE public.notifications IS 'User notification system with priority and categorization';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE public.ml_predictions IS 'Machine learning predictions with accuracy tracking';
COMMENT ON TABLE public.system_health IS 'System health monitoring with detailed metrics';

-- Migration completed successfully
SELECT 'Enhanced database schema migration completed successfully!' as status;