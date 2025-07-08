-- Skip agents table creation - it already exists with different schema
-- This migration is a no-op to preserve existing data

-- Add any missing columns to existing agents table if needed
DO $$ 
BEGIN
    -- Check if farm_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'farm_id') THEN
        ALTER TABLE agents ADD COLUMN farm_id UUID;
    END IF;
    
    -- Check if performance metrics columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'total_pnl') THEN
        ALTER TABLE agents ADD COLUMN total_pnl DECIMAL(20, 8) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'win_rate') THEN
        ALTER TABLE agents ADD COLUMN win_rate DECIMAL(5, 2) DEFAULT 0;
    END IF;
END $$;

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

-- Add foreign key constraint to farms table using farm_id
DO $$ 
BEGIN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agents_farm_id' 
        AND table_name = 'agents'
    ) THEN
        ALTER TABLE agents ADD CONSTRAINT fk_agents_farm_id 
        FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Comments
COMMENT ON TABLE agents IS 'Stores AI trading agent configurations and performance metrics';
COMMENT ON COLUMN agents.config IS 'Agent configuration including strategy parameters and risk limits';
COMMENT ON COLUMN agents.total_pnl IS 'Total profit and loss across all trades';
COMMENT ON COLUMN agents.farm_id IS 'Reference to the farm this agent belongs to (foreign key to farms.farm_id)';