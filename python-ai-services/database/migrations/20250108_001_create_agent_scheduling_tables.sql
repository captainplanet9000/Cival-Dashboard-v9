-- Agent Scheduling Tables Migration
-- Creates tables for APScheduler agent service and autonomous state persistence
-- Compatible with Supabase PostgreSQL

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agent states table for persistent state management
CREATE TABLE IF NOT EXISTS agent_states (
    agent_id UUID NOT NULL,
    state_type TEXT NOT NULL,
    state_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (agent_id, state_type)
);

-- Create agent checkpoints table for system-wide state snapshots
CREATE TABLE IF NOT EXISTS agent_checkpoints (
    id TEXT PRIMARY KEY,
    checkpoint_name TEXT NOT NULL,
    agents_included TEXT[] NOT NULL,
    state_snapshot JSONB NOT NULL,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled tasks table for APScheduler persistence
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    task_id TEXT PRIMARY KEY,
    agent_id UUID NOT NULL,
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    schedule_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL,
    task_config JSONB,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_delay INTEGER DEFAULT 60,
    is_persistent BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

-- Create task execution history table
CREATE TABLE IF NOT EXISTS task_execution_history (
    execution_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_id UUID NOT NULL,
    status TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration REAL,
    result_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (task_id) REFERENCES scheduled_tasks(task_id) ON DELETE CASCADE
);

-- Create agent wallets table for blockchain integration
CREATE TABLE IF NOT EXISTS agent_wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    wallet_type TEXT NOT NULL,
    address TEXT NOT NULL,
    network TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    derivation_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(agent_id, network)
);

-- Create wallet balances table for balance tracking
CREATE TABLE IF NOT EXISTS wallet_balances (
    balance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    native_balance DECIMAL(36, 18) DEFAULT 0,
    token_balances JSONB DEFAULT '{}',
    usd_value DECIMAL(18, 8) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, network, address)
);

-- Create wallet transactions table for transaction history
CREATE TABLE IF NOT EXISTS wallet_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    network TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    from_address TEXT,
    to_address TEXT,
    amount DECIMAL(36, 18),
    token_address TEXT,
    status TEXT NOT NULL,
    gas_used INTEGER,
    gas_price BIGINT,
    block_number INTEGER,
    confirmation_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(network, transaction_hash)
);

-- Create blockchain providers table for provider management
CREATE TABLE IF NOT EXISTS blockchain_providers (
    provider_id TEXT PRIMARY KEY,
    provider_type TEXT NOT NULL,
    network TEXT NOT NULL,
    rpc_url TEXT NOT NULL,
    api_key TEXT,
    status TEXT DEFAULT 'unknown',
    latency REAL DEFAULT 0.0,
    last_check TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_type, network)
);

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(18, 8),
    metric_data JSONB,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (agent_id, metric_type, created_at)
);

-- Create autonomous system health table
CREATE TABLE IF NOT EXISTS system_health_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'health', 'performance', 'resource'
    metric_value REAL,
    metric_data JSONB,
    severity TEXT DEFAULT 'info', -- 'critical', 'error', 'warning', 'info'
    alert_status TEXT DEFAULT 'none', -- 'none', 'active', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (service_name, metric_type, created_at)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_agent_states_agent_id ON agent_states(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_states_updated_at ON agent_states(updated_at);
CREATE INDEX IF NOT EXISTS idx_agent_states_state_type ON agent_states(state_type);

CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_created_at ON agent_checkpoints(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_status ON agent_checkpoints(status);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_agent_id ON scheduled_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON scheduled_tasks(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_task_type ON scheduled_tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_task_execution_agent_id ON task_execution_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_task_id ON task_execution_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_start_time ON task_execution_history(start_time);

CREATE INDEX IF NOT EXISTS idx_agent_wallets_agent_id ON agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_wallets_network ON agent_wallets(network);
CREATE INDEX IF NOT EXISTS idx_agent_wallets_address ON agent_wallets(address);

CREATE INDEX IF NOT EXISTS idx_wallet_balances_agent_id ON wallet_balances(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_network ON wallet_balances(network);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_last_updated ON wallet_balances(last_updated);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_agent_id ON wallet_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_network ON wallet_transactions(network);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_hash ON wallet_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_blockchain_providers_network ON blockchain_providers(network);
CREATE INDEX IF NOT EXISTS idx_blockchain_providers_status ON blockchain_providers(status);

CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_type ON agent_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_agent_performance_created_at ON agent_performance_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_type ON system_health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_health_severity ON system_health_metrics(severity);
CREATE INDEX IF NOT EXISTS idx_system_health_created_at ON system_health_metrics(created_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_states_updated_at BEFORE UPDATE ON agent_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blockchain_providers_updated_at BEFORE UPDATE ON blockchain_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Row Level Security (RLS) policies for multi-tenancy
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (can be customized based on authentication system)
CREATE POLICY "Allow all operations for service role" ON agent_states
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON agent_checkpoints
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON scheduled_tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON task_execution_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON agent_wallets
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON wallet_balances
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON wallet_transactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON agent_performance_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Insert initial system health check record
INSERT INTO system_health_metrics (service_name, metric_type, metric_value, metric_data, severity)
VALUES ('migration_system', 'initialization', 1.0, '{"migration": "agent_scheduling_tables", "version": "20250108_001"}', 'info')
ON CONFLICT DO NOTHING;

-- Create a view for agent summary information
CREATE OR REPLACE VIEW agent_summary AS
SELECT 
    a.agent_id,
    COUNT(DISTINCT s.task_id) as scheduled_tasks_count,
    COUNT(DISTINCT w.wallet_id) as wallets_count,
    COUNT(DISTINCT t.execution_id) as executions_count,
    MAX(s.last_run) as last_task_run,
    MAX(w.last_used) as last_wallet_used,
    COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_tasks,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_tasks
FROM 
    (SELECT DISTINCT agent_id FROM agent_states 
     UNION 
     SELECT DISTINCT agent_id FROM scheduled_tasks
     UNION
     SELECT DISTINCT agent_id FROM agent_wallets) a
LEFT JOIN scheduled_tasks s ON a.agent_id = s.agent_id
LEFT JOIN agent_wallets w ON a.agent_id = w.agent_id
LEFT JOIN task_execution_history t ON a.agent_id = t.agent_id
GROUP BY a.agent_id;

-- Create a view for system health overview
CREATE OR REPLACE VIEW system_health_overview AS
SELECT 
    service_name,
    COUNT(*) as total_metrics,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
    COUNT(CASE WHEN severity = 'error' THEN 1 END) as error_count,
    COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_count,
    MAX(created_at) as last_metric_time,
    AVG(CASE WHEN metric_type = 'performance' THEN metric_value END) as avg_performance
FROM system_health_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY service_name
ORDER BY critical_count DESC, error_count DESC;

COMMENT ON TABLE agent_states IS 'Persistent state management for autonomous agents across system restarts';
COMMENT ON TABLE agent_checkpoints IS 'System-wide state snapshots for recovery and rollback capabilities';
COMMENT ON TABLE scheduled_tasks IS 'APScheduler persistent task storage for agent scheduling';
COMMENT ON TABLE task_execution_history IS 'Execution history and performance tracking for scheduled tasks';
COMMENT ON TABLE agent_wallets IS 'Blockchain wallet management for trading agents';
COMMENT ON TABLE wallet_balances IS 'Real-time balance tracking for agent wallets';
COMMENT ON TABLE wallet_transactions IS 'Comprehensive transaction history for all agent operations';
COMMENT ON TABLE blockchain_providers IS 'Multi-provider blockchain infrastructure management';
COMMENT ON TABLE agent_performance_metrics IS 'Performance tracking and analytics for agent optimization';
COMMENT ON TABLE system_health_metrics IS 'Autonomous system health monitoring and alerting';

-- Migration completed successfully
SELECT 'Agent scheduling and persistence tables created successfully' AS migration_status;