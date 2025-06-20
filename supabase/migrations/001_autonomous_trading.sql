-- Create schema for autonomous trading platform
CREATE SCHEMA IF NOT EXISTS trading;

-- Agent States Table
CREATE TABLE IF NOT EXISTS trading.agent_states (
    agent_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'idle',
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    config JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Positions Table
CREATE TABLE IF NOT EXISTS trading.positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    unrealized_pnl DECIMAL(20, 8),
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    status VARCHAR(20) DEFAULT 'open',
    agent_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Orders Table
CREATE TABLE IF NOT EXISTS trading.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES trading.positions(position_id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8),
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    agent_id VARCHAR(255),
    exchange VARCHAR(50),
    exchange_order_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Analysis Table
CREATE TABLE IF NOT EXISTS trading.market_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10),
    analysis JSONB NOT NULL,
    signals JSONB DEFAULT '[]',
    confidence_score DECIMAL(5, 4),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Signals Table
CREATE TABLE IF NOT EXISTS trading.signals (
    signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL,
    strength DECIMAL(5, 4),
    confidence DECIMAL(5, 4),
    price_target DECIMAL(20, 8),
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Metrics Table
CREATE TABLE IF NOT EXISTS trading.risk_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_value DECIMAL(20, 8),
    total_exposure DECIMAL(20, 8),
    var_95 DECIMAL(10, 6),
    sharpe_ratio DECIMAL(10, 6),
    max_drawdown DECIMAL(10, 6),
    concentration_risk DECIMAL(10, 6),
    metrics JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS trading.agent_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    parameters JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    error TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance History Table
CREATE TABLE IF NOT EXISTS trading.performance_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255),
    date DATE NOT NULL,
    starting_balance DECIMAL(20, 8),
    ending_balance DECIMAL(20, 8),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(20, 8),
    win_rate DECIMAL(5, 4),
    profit_factor DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 6),
    sharpe_ratio DECIMAL(10, 6),
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS trading.alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255),
    level VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_positions_symbol ON trading.positions(symbol);
CREATE INDEX idx_positions_status ON trading.positions(status);
CREATE INDEX idx_positions_agent ON trading.positions(agent_id);
CREATE INDEX idx_orders_symbol ON trading.orders(symbol);
CREATE INDEX idx_orders_status ON trading.orders(status);
CREATE INDEX idx_analysis_symbol ON trading.market_analysis(symbol);
CREATE INDEX idx_analysis_timestamp ON trading.market_analysis(timestamp);
CREATE INDEX idx_signals_symbol ON trading.signals(symbol);
CREATE INDEX idx_signals_created ON trading.signals(created_at);
CREATE INDEX idx_tasks_agent ON trading.agent_tasks(agent_id);
CREATE INDEX idx_tasks_status ON trading.agent_tasks(status);
CREATE INDEX idx_alerts_level ON trading.alerts(level);
CREATE INDEX idx_alerts_created ON trading.alerts(created_at);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION trading.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables
CREATE TRIGGER update_agent_states_updated_at BEFORE UPDATE ON trading.agent_states
    FOR EACH ROW EXECUTE FUNCTION trading.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON trading.positions
    FOR EACH ROW EXECUTE FUNCTION trading.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON trading.orders
    FOR EACH ROW EXECUTE FUNCTION trading.update_updated_at_column();

-- Create RLS policies (if needed)
ALTER TABLE trading.agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Service role has full access" ON trading.agent_states
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.positions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.market_analysis
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.signals
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.risk_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.agent_tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.performance_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON trading.alerts
    FOR ALL USING (auth.role() = 'service_role');