-- Create goals table for storing trading goals and objectives
-- This table stores user-defined trading goals, milestones, and progress tracking

CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id VARCHAR(255) UNIQUE NOT NULL, -- External goal identifier
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Goal Configuration
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('profit', 'winRate', 'trades', 'drawdown', 'sharpe', 'portfolio', 'farm', 'blockchain')),
    target_value DECIMAL(20, 8) NOT NULL,
    current_value DECIMAL(20, 8) DEFAULT 0,
    
    -- Progress Tracking
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    completion_status VARCHAR(50) DEFAULT 'active' CHECK (completion_status IN ('active', 'completed', 'failed', 'paused')),
    
    -- Timeline
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Priority and categorization
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 4), -- 1=low, 2=medium, 3=high, 4=critical
    category VARCHAR(50) DEFAULT 'trading' CHECK (category IN ('trading', 'farm', 'portfolio', 'risk')),
    tags JSONB DEFAULT '[]',
    
    -- Associations
    farm_id UUID, -- Reference to farms table
    agent_id VARCHAR(255), -- Reference to specific agent
    
    -- Goal configuration and metadata
    target_criteria JSONB DEFAULT '{}', -- Detailed goal criteria and parameters
    current_progress JSONB DEFAULT '{}', -- Current progress details
    milestones JSONB DEFAULT '[]', -- Array of milestone objects
    
    -- Reward and motivation
    reward TEXT, -- Description of reward upon completion
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_goal_id ON goals(goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(completion_status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_farm_id ON goals(farm_id);
CREATE INDEX IF NOT EXISTS idx_goals_agent_id ON goals(agent_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goals_updated_at();

-- Create function to update completion percentage
CREATE OR REPLACE FUNCTION update_goal_progress(goal_uuid UUID, new_current_value DECIMAL)
RETURNS VOID AS $$
DECLARE
    target_val DECIMAL;
    completion_pct DECIMAL;
BEGIN
    -- Get target value
    SELECT target_value INTO target_val FROM goals WHERE id = goal_uuid;
    
    -- Calculate completion percentage
    IF target_val > 0 THEN
        completion_pct = LEAST(100, (new_current_value / target_val) * 100);
    ELSE
        completion_pct = 0;
    END IF;
    
    -- Update the goal
    UPDATE goals 
    SET 
        current_value = new_current_value,
        completion_percentage = completion_pct,
        completion_status = CASE 
            WHEN completion_pct >= 100 THEN 'completed'
            WHEN completion_pct > 0 THEN 'active'
            ELSE completion_status
        END,
        completed_at = CASE 
            WHEN completion_pct >= 100 AND completed_at IS NULL THEN NOW()
            ELSE completed_at
        END
    WHERE id = goal_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert sample goals for development
INSERT INTO goals (goal_id, name, description, goal_type, target_value, priority, category) VALUES 
('goal_profit_1000', 'First $1000 Profit', 'Achieve first $1000 in trading profits', 'profit', 1000, 2, 'trading'),
('goal_winrate_75', '75% Win Rate', 'Maintain a 75% win rate over 100 trades', 'winRate', 75, 3, 'trading'),
('goal_trades_100', '100 Successful Trades', 'Complete 100 successful trades', 'trades', 100, 2, 'trading'),
('goal_portfolio_20', '20% Portfolio Growth', 'Grow portfolio by 20%', 'portfolio', 20, 3, 'portfolio')
ON CONFLICT (goal_id) DO NOTHING;

-- Add foreign key constraint to farms table using farm_id
ALTER TABLE goals ADD CONSTRAINT fk_goals_farm_id 
FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE SET NULL;

-- Comments
COMMENT ON TABLE goals IS 'Stores trading goals, objectives, and progress tracking';
COMMENT ON COLUMN goals.target_criteria IS 'Detailed criteria and parameters for goal achievement';
COMMENT ON COLUMN goals.current_progress IS 'Current progress details and metrics';
COMMENT ON COLUMN goals.milestones IS 'Array of milestone objects for tracking progress steps';
COMMENT ON COLUMN goals.farm_id IS 'Reference to the farm this goal belongs to (foreign key to farms.farm_id)';
COMMENT ON FUNCTION update_goal_progress IS 'Updates goal progress and automatically marks as completed when target is reached';