-- Create agents table for storing AI trading agents
-- This table stores all agent configurations, strategies, and states

CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR(255) UNIQUE NOT NULL, -- External agent identifier
    name VARCHAR(255) NOT NULL,
    description TEXT,
    strategy_type VARCHAR(100) NOT NULL DEFAULT 'momentum',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'error')),
    
    -- Agent Configuration
    config JSONB NOT NULL DEFAULT '{}', -- Strategy parameters, risk limits, etc.
    initial_capital DECIMAL(20, 8) DEFAULT 10000,
    current_capital DECIMAL(20, 8) DEFAULT 10000,
    
    -- Performance Metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(20, 8) DEFAULT 0,
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    max_drawdown DECIMAL(5, 2) DEFAULT 0,
    sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_trade_at TIMESTAMP WITH TIME ZONE,
    
    -- Farm association
    farm_id UUID, -- Reference to farms table when created
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_strategy_type ON agents(strategy_type);
CREATE INDEX IF NOT EXISTS idx_agents_farm_id ON agents(farm_id);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agents_updated_at();

-- Comments
COMMENT ON TABLE agents IS 'Stores AI trading agent configurations and performance metrics';
COMMENT ON COLUMN agents.config IS 'Agent configuration including strategy parameters and risk limits';
COMMENT ON COLUMN agents.total_pnl IS 'Total profit and loss across all trades';
COMMENT ON COLUMN agents.farm_id IS 'Reference to the farm this agent belongs to';