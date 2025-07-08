-- Create analytics tables for storing performance metrics and analysis data
-- This includes portfolio analytics, trading performance, and risk metrics

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Snapshot identification
    snapshot_date DATE NOT NULL,
    snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    snapshot_type VARCHAR(50) DEFAULT 'daily' CHECK (snapshot_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    
    -- Portfolio metrics
    total_portfolio_value DECIMAL(20, 8) DEFAULT 0,
    cash_balance DECIMAL(20, 8) DEFAULT 0,
    invested_amount DECIMAL(20, 8) DEFAULT 0,
    unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    
    -- Trading performance
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    average_win DECIMAL(20, 8) DEFAULT 0,
    average_loss DECIMAL(20, 8) DEFAULT 0,
    profit_factor DECIMAL(10, 4) DEFAULT 0,
    
    -- Risk metrics
    sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
    max_drawdown DECIMAL(5, 2) DEFAULT 0,
    volatility DECIMAL(5, 2) DEFAULT 0,
    var_95 DECIMAL(20, 8) DEFAULT 0, -- Value at Risk 95%
    
    -- Agent performance summary
    active_agents INTEGER DEFAULT 0,
    total_agents INTEGER DEFAULT 0,
    best_performing_agent VARCHAR(255),
    worst_performing_agent VARCHAR(255),
    
    -- Farm performance summary
    active_farms INTEGER DEFAULT 0,
    total_farms INTEGER DEFAULT 0,
    best_performing_farm VARCHAR(255),
    farm_coordination_score DECIMAL(5, 2) DEFAULT 0,
    
    -- Market context
    market_conditions JSONB DEFAULT '{}', -- Market volatility, trends, etc.
    
    -- Detailed metrics
    detailed_metrics JSONB DEFAULT '{}', -- Additional detailed performance data
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_history table for detailed trade-by-trade analysis
CREATE TABLE IF NOT EXISTS performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Trade identification
    trade_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255),
    farm_id UUID, -- Foreign key to farms.farm_id
    
    -- Trade details
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    exit_price DECIMAL(20, 8),
    
    -- Performance metrics
    pnl DECIMAL(20, 8) DEFAULT 0,
    pnl_percentage DECIMAL(5, 2) DEFAULT 0,
    holding_period_minutes INTEGER DEFAULT 0,
    
    -- Execution quality
    slippage DECIMAL(5, 4) DEFAULT 0,
    execution_delay_ms INTEGER DEFAULT 0,
    fees DECIMAL(20, 8) DEFAULT 0,
    
    -- Strategy context
    strategy_type VARCHAR(100),
    signal_strength DECIMAL(3, 2), -- 0-1 scale
    confidence DECIMAL(3, 2), -- 0-1 scale
    
    -- Timestamps
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional context
    market_context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create risk_events table for tracking risk-related events
CREATE TABLE IF NOT EXISTS risk_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event identification
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('drawdown', 'position_limit', 'var_breach', 'correlation_spike', 'volatility_spike')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Event details
    description TEXT NOT NULL,
    affected_agents TEXT[], -- Array of agent IDs
    affected_farms TEXT[], -- Array of farm IDs
    
    -- Risk metrics at time of event
    portfolio_value DECIMAL(20, 8),
    drawdown_percentage DECIMAL(5, 2),
    var_value DECIMAL(20, 8),
    
    -- Response and resolution
    action_taken TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional context
    event_data JSONB DEFAULT '{}'
);

-- Create indexes for analytics_snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type ON analytics_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_time ON analytics_snapshots(snapshot_time);

-- Create indexes for performance_history
CREATE INDEX IF NOT EXISTS idx_performance_history_trade_id ON performance_history(trade_id);
CREATE INDEX IF NOT EXISTS idx_performance_history_agent_id ON performance_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_history_farm_id ON performance_history(farm_id);
CREATE INDEX IF NOT EXISTS idx_performance_history_symbol ON performance_history(symbol);
CREATE INDEX IF NOT EXISTS idx_performance_history_entry_time ON performance_history(entry_time);

-- Create indexes for risk_events
CREATE INDEX IF NOT EXISTS idx_risk_events_type ON risk_events(event_type);
CREATE INDEX IF NOT EXISTS idx_risk_events_severity ON risk_events(severity);
CREATE INDEX IF NOT EXISTS idx_risk_events_time ON risk_events(event_time);
CREATE INDEX IF NOT EXISTS idx_risk_events_resolved ON risk_events(resolved);

-- Create function to automatically create daily snapshots
CREATE OR REPLACE FUNCTION create_daily_analytics_snapshot()
RETURNS VOID AS $$
DECLARE
    snapshot_data RECORD;
BEGIN
    -- Calculate current portfolio metrics
    WITH portfolio_summary AS (
        SELECT 
            COALESCE(SUM(current_capital), 0) as total_value,
            COUNT(*) as total_agents_count,
            COUNT(*) FILTER (WHERE status = 'active') as active_agents_count
        FROM agents
    ),
    trading_summary AS (
        SELECT 
            COUNT(*) as total_trades_count,
            COUNT(*) FILTER (WHERE pnl > 0) as winning_trades_count,
            COUNT(*) FILTER (WHERE pnl < 0) as losing_trades_count,
            COALESCE(AVG(pnl), 0) as avg_pnl,
            COALESCE(SUM(pnl), 0) as total_pnl
        FROM performance_history 
        WHERE entry_time >= CURRENT_DATE
    ),
    farm_summary AS (
        SELECT 
            COUNT(*) as total_farms_count,
            COUNT(*) FILTER (WHERE is_active = true) as active_farms_count
        FROM farms
    )
    SELECT 
        p.total_value,
        p.total_agents_count,
        p.active_agents_count,
        t.total_trades_count,
        t.winning_trades_count,
        t.losing_trades_count,
        CASE WHEN t.total_trades_count > 0 THEN (t.winning_trades_count::DECIMAL / t.total_trades_count * 100) ELSE 0 END as win_rate,
        t.total_pnl,
        f.total_farms_count,
        f.active_farms_count
    INTO snapshot_data
    FROM portfolio_summary p
    CROSS JOIN trading_summary t
    CROSS JOIN farm_summary f;
    
    -- Insert the snapshot
    INSERT INTO analytics_snapshots (
        snapshot_date,
        total_portfolio_value,
        total_trades,
        winning_trades,
        losing_trades,
        win_rate,
        realized_pnl,
        active_agents,
        total_agents,
        active_farms,
        total_farms
    ) VALUES (
        CURRENT_DATE,
        snapshot_data.total_value,
        snapshot_data.total_trades_count,
        snapshot_data.winning_trades_count,
        snapshot_data.losing_trades_count,
        snapshot_data.win_rate,
        snapshot_data.total_pnl,
        snapshot_data.active_agents_count,
        snapshot_data.total_agents_count,
        snapshot_data.active_farms_count,
        snapshot_data.total_farms_count
    ) ON CONFLICT DO NOTHING; -- Prevent duplicate daily snapshots
    
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraint to farms table using farm_id
ALTER TABLE performance_history ADD CONSTRAINT fk_performance_history_farm_id 
FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE SET NULL;

-- Comments
COMMENT ON TABLE analytics_snapshots IS 'Daily/hourly snapshots of portfolio and trading performance metrics';
COMMENT ON TABLE performance_history IS 'Detailed trade-by-trade performance tracking';
COMMENT ON TABLE risk_events IS 'Risk management events and alerts tracking';
COMMENT ON COLUMN performance_history.farm_id IS 'Reference to the farm this trade belongs to (foreign key to farms.farm_id)';
COMMENT ON FUNCTION create_daily_analytics_snapshot IS 'Creates a daily analytics snapshot with current portfolio and performance metrics';