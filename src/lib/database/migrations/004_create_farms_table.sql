-- Create farms table for storing trading farm configurations
-- This table stores multi-agent trading farm setups and coordination

CREATE TABLE IF NOT EXISTS farms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id VARCHAR(255) UNIQUE NOT NULL, -- External farm identifier
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Farm Configuration
    strategy VARCHAR(100) NOT NULL DEFAULT 'darvas_box',
    agent_count INTEGER DEFAULT 5,
    total_allocated_usd DECIMAL(20, 8) DEFAULT 50000,
    coordination_mode VARCHAR(50) DEFAULT 'coordinated' CHECK (coordination_mode IN ('independent', 'coordinated', 'hierarchical')),
    
    -- Farm Status
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'deploying')),
    is_active BOOLEAN DEFAULT true,
    
    -- Performance Metrics
    performance_metrics JSONB DEFAULT '{}',
    total_value DECIMAL(20, 8) DEFAULT 0,
    total_pnl DECIMAL(20, 8) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    trade_count INTEGER DEFAULT 0,
    roi_percent DECIMAL(5, 2) DEFAULT 0,
    active_agents INTEGER DEFAULT 0,
    
    -- Risk Management
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    max_drawdown_percent DECIMAL(5, 2) DEFAULT 15,
    position_size_limit DECIMAL(5, 2) DEFAULT 10,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_rebalance_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuration and metadata
    config JSONB DEFAULT '{}',
    goals JSONB DEFAULT '[]', -- Array of associated goals
    wallet_allocations JSONB DEFAULT '{}' -- Wallet allocation configuration
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_farms_farm_id ON farms(farm_id);
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);
CREATE INDEX IF NOT EXISTS idx_farms_strategy ON farms(strategy);
CREATE INDEX IF NOT EXISTS idx_farms_is_active ON farms(is_active);
CREATE INDEX IF NOT EXISTS idx_farms_created_at ON farms(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_farms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION update_farms_updated_at();

-- Add foreign key constraint to agents table (if it exists)
-- This will be created after agents table exists
-- ALTER TABLE agents ADD CONSTRAINT fk_agents_farm_id FOREIGN KEY (farm_id) REFERENCES farms(id);

-- Insert sample farm data for development
INSERT INTO farms (farm_id, name, description, strategy, agent_count, total_allocated_usd) VALUES 
('farm_darvas_1', 'Darvas Box Farm', 'High-momentum trading with breakout detection', 'darvas_box', 5, 50000),
('farm_elliott_1', 'Elliott Wave Farm', 'Advanced wave pattern analysis', 'elliott_wave', 3, 30000),
('farm_williams_1', 'Williams Alligator Farm', 'Trend-following with smoothed averages', 'williams_alligator', 4, 40000)
ON CONFLICT (farm_id) DO NOTHING;

-- Comments
COMMENT ON TABLE farms IS 'Stores trading farm configurations and multi-agent coordination settings';
COMMENT ON COLUMN farms.performance_metrics IS 'JSON object containing detailed performance statistics';
COMMENT ON COLUMN farms.coordination_mode IS 'How agents in this farm coordinate (independent, coordinated, hierarchical)';
COMMENT ON COLUMN farms.goals IS 'Array of goal IDs associated with this farm';