-- Skip farms table creation - it already exists with different schema
-- This migration adds any missing columns to the existing farms table

DO $$ 
BEGIN
    -- The existing farms table uses farm_id as primary key (UUID)
    -- Add any missing columns that our application needs
    
    -- Check if strategy column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farms' AND column_name = 'strategy') THEN
        ALTER TABLE farms ADD COLUMN strategy VARCHAR(100) DEFAULT 'darvas_box';
    END IF;
    
    -- Check if status column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farms' AND column_name = 'status') THEN
        ALTER TABLE farms ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    -- Check if is_active column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farms' AND column_name = 'is_active') THEN
        ALTER TABLE farms ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Check if coordination_mode exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farms' AND column_name = 'coordination_mode') THEN
        ALTER TABLE farms ADD COLUMN coordination_mode VARCHAR(50) DEFAULT 'coordinated';
    END IF;
    
    -- Check if goals column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farms' AND column_name = 'goals') THEN
        ALTER TABLE farms ADD COLUMN goals JSONB DEFAULT '[]';
    END IF;
    
    -- Check if config column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farms' AND column_name = 'config') THEN
        ALTER TABLE farms ADD COLUMN config JSONB DEFAULT '{}';
    END IF;
END $$;

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