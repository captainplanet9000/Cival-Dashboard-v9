-- Flash Loan Profit Integration Tables Migration
-- Created: December 21, 2025
-- Features: Flash loan profit rules, profit history, and goal integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FLASH LOAN PROFIT RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS flashloan_profit_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('profit_amount', 'profit_percentage', 'opportunity_score')),
    trigger_value DECIMAL(20, 8) NOT NULL,
    secure_percentage DECIMAL(5, 2) DEFAULT 50.00 CHECK (secure_percentage >= 0 AND secure_percentage <= 100),
    reinvest_percentage DECIMAL(5, 2) DEFAULT 30.00 CHECK (reinvest_percentage >= 0 AND reinvest_percentage <= 100),
    reserve_percentage DECIMAL(5, 2) DEFAULT 20.00 CHECK (reserve_percentage >= 0 AND reserve_percentage <= 100),
    min_profit_usd DECIMAL(20, 8) DEFAULT 100,
    max_loan_usd DECIMAL(20, 8) DEFAULT 1000000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure percentages add up to reasonable total
    CONSTRAINT check_percentage_total CHECK (
        secure_percentage + reinvest_percentage + reserve_percentage <= 100
    )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_flashloan_profit_rules_active 
ON flashloan_profit_rules(is_active, trigger_type, trigger_value);

-- =====================================================
-- FLASH LOAN PROFIT HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS flashloan_profit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flashloan_tx_id UUID REFERENCES flashloan_transactions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL,
    gross_profit_usd DECIMAL(20, 8) NOT NULL,
    secured_amount_usd DECIMAL(20, 8) DEFAULT 0,
    reinvested_amount_usd DECIMAL(20, 8) DEFAULT 0,
    reserved_amount_usd DECIMAL(20, 8) DEFAULT 0,
    goal_contribution_usd DECIMAL(20, 8) DEFAULT 0,
    agent_reward_usd DECIMAL(20, 8) DEFAULT 0,
    profit_rule_id UUID REFERENCES flashloan_profit_rules(id) ON DELETE SET NULL,
    destination_wallet VARCHAR(255),
    destination_type VARCHAR(50) NOT NULL CHECK (destination_type IN ('stable_coin', 'master_wallet', 'agent_wallet', 'goal_fund')),
    reinvestment_protocol VARCHAR(50) CHECK (reinvestment_protocol IN ('aave', 'compound', 'curve', 'yearn')),
    reinvestment_apy DECIMAL(8, 4),
    tx_hash VARCHAR(255),
    gas_cost_usd DECIMAL(20, 8),
    profit_distribution_status VARCHAR(20) DEFAULT 'pending' CHECK (profit_distribution_status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure amounts are consistent
    CONSTRAINT check_profit_amounts CHECK (
        gross_profit_usd >= 0 AND
        secured_amount_usd >= 0 AND
        reinvested_amount_usd >= 0 AND
        reserved_amount_usd >= 0 AND
        goal_contribution_usd >= 0 AND
        agent_reward_usd >= 0 AND
        (secured_amount_usd + reinvested_amount_usd + reserved_amount_usd + goal_contribution_usd + agent_reward_usd) <= gross_profit_usd
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashloan_profit_history_agent 
ON flashloan_profit_history(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_flashloan_profit_history_tx 
ON flashloan_profit_history(flashloan_tx_id);

CREATE INDEX IF NOT EXISTS idx_flashloan_profit_history_date 
ON flashloan_profit_history(created_at DESC);

-- =====================================================
-- FLASH LOAN PROFIT GOALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS flashloan_profit_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_name VARCHAR(255) NOT NULL,
    target_amount_usd DECIMAL(20, 8) NOT NULL CHECK (target_amount_usd > 0),
    current_amount_usd DECIMAL(20, 8) DEFAULT 0 CHECK (current_amount_usd >= 0),
    deadline DATE,
    auto_execute_loans BOOLEAN DEFAULT TRUE,
    min_opportunity_score DECIMAL(5, 2) DEFAULT 80.00 CHECK (min_opportunity_score >= 0 AND min_opportunity_score <= 100),
    allocation_percentage DECIMAL(5, 2) DEFAULT 100.00 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1),
    is_active BOOLEAN DEFAULT TRUE,
    goal_type VARCHAR(50) DEFAULT 'profit_accumulation' CHECK (goal_type IN ('profit_accumulation', 'emergency_fund', 'reinvestment_pool', 'agent_rewards')),
    wallet_address VARCHAR(255),
    completion_action VARCHAR(50) DEFAULT 'create_new' CHECK (completion_action IN ('create_new', 'pause', 'increase_target')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Goal progress constraint
    CONSTRAINT check_goal_progress CHECK (current_amount_usd <= target_amount_usd * 1.1) -- Allow 10% overage
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashloan_profit_goals_active 
ON flashloan_profit_goals(is_active, priority);

CREATE INDEX IF NOT EXISTS idx_flashloan_profit_goals_progress 
ON flashloan_profit_goals(current_amount_usd, target_amount_usd);

-- =====================================================
-- AGENT FLASH LOAN PROFIT SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_flashloan_profit_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE,
    profit_sharing_enabled BOOLEAN DEFAULT TRUE,
    agent_profit_share DECIMAL(5, 2) DEFAULT 10.00 CHECK (agent_profit_share >= 0 AND agent_profit_share <= 50),
    master_wallet_share DECIMAL(5, 2) DEFAULT 40.00 CHECK (master_wallet_share >= 0 AND master_wallet_share <= 100),
    goal_contribution_share DECIMAL(5, 2) DEFAULT 30.00 CHECK (goal_contribution_share >= 0 AND goal_contribution_share <= 100),
    reserve_share DECIMAL(5, 2) DEFAULT 20.00 CHECK (reserve_share >= 0 AND reserve_share <= 100),
    auto_execute_threshold DECIMAL(20, 8) DEFAULT 100,
    max_daily_executions INTEGER DEFAULT 50 CHECK (max_daily_executions >= 1),
    preferred_protocols TEXT[] DEFAULT ARRAY['aave-v3', 'uniswap-v3'],
    risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure shares add up to 100%
    CONSTRAINT check_profit_shares CHECK (
        agent_profit_share + master_wallet_share + goal_contribution_share + reserve_share = 100
    )
);

-- Add index for agent lookups
CREATE INDEX IF NOT EXISTS idx_agent_flashloan_profit_settings_agent 
ON agent_flashloan_profit_settings(agent_id);

-- =====================================================
-- FLASH LOAN PROFIT ANALYTICS VIEW
-- =====================================================

CREATE OR REPLACE VIEW flashloan_profit_analytics AS
SELECT 
    fph.agent_id,
    COUNT(*) as total_distributions,
    SUM(fph.gross_profit_usd) as total_gross_profit,
    SUM(fph.secured_amount_usd) as total_secured,
    SUM(fph.reinvested_amount_usd) as total_reinvested,
    SUM(fph.reserved_amount_usd) as total_reserved,
    SUM(fph.goal_contribution_usd) as total_goal_contributions,
    SUM(fph.agent_reward_usd) as total_agent_rewards,
    AVG(fph.gross_profit_usd) as avg_profit_per_loan,
    AVG(CASE WHEN fph.reinvestment_apy IS NOT NULL THEN fph.reinvestment_apy ELSE 0 END) as avg_reinvestment_apy,
    COUNT(CASE WHEN fph.profit_distribution_status = 'completed' THEN 1 END) as successful_distributions,
    COUNT(CASE WHEN fph.profit_distribution_status = 'failed' THEN 1 END) as failed_distributions,
    (COUNT(CASE WHEN fph.profit_distribution_status = 'completed' THEN 1 END) * 100.0 / COUNT(*)) as success_rate,
    DATE_TRUNC('month', fph.created_at) as month_year
FROM flashloan_profit_history fph
GROUP BY fph.agent_id, DATE_TRUNC('month', fph.created_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update goal progress when profit is contributed
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update goal current amount if goal contribution is made
    IF NEW.goal_contribution_usd > 0 AND NEW.profit_distribution_status = 'completed' THEN
        UPDATE flashloan_profit_goals
        SET 
            current_amount_usd = current_amount_usd + NEW.goal_contribution_usd,
            updated_at = NOW(),
            completed_at = CASE 
                WHEN current_amount_usd + NEW.goal_contribution_usd >= target_amount_usd 
                THEN NOW() 
                ELSE completed_at 
            END
        WHERE is_active = TRUE
        ORDER BY priority ASC
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal progress
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON flashloan_profit_history;
CREATE TRIGGER trigger_update_goal_progress
    AFTER INSERT OR UPDATE ON flashloan_profit_history
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Function to update agent statistics
CREATE OR REPLACE FUNCTION update_agent_flashloan_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update agent flash loan limits with latest statistics
    UPDATE agent_flashloan_limits
    SET 
        total_profit_usd = COALESCE((
            SELECT SUM(fph.gross_profit_usd)
            FROM flashloan_profit_history fph
            WHERE fph.agent_id = NEW.agent_id
            AND fph.profit_distribution_status = 'completed'
        ), 0),
        success_rate = COALESCE((
            SELECT (COUNT(CASE WHEN fph.profit_distribution_status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
            FROM flashloan_profit_history fph
            WHERE fph.agent_id = NEW.agent_id
        ), 0),
        updated_at = NOW()
    WHERE agent_id = NEW.agent_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update agent statistics
DROP TRIGGER IF EXISTS trigger_update_agent_flashloan_stats ON flashloan_profit_history;
CREATE TRIGGER trigger_update_agent_flashloan_stats
    AFTER INSERT OR UPDATE ON flashloan_profit_history
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_flashloan_stats();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default profit rules
INSERT INTO flashloan_profit_rules (rule_name, trigger_type, trigger_value, secure_percentage, reinvest_percentage, reserve_percentage, min_profit_usd, max_loan_usd) 
VALUES 
    ('Conservative Flash Loan Profit', 'profit_amount', 100, 50.00, 30.00, 10.00, 100, 100000),
    ('Aggressive Flash Loan Profit', 'profit_amount', 500, 40.00, 40.00, 10.00, 500, 500000),
    ('High Score Opportunity', 'opportunity_score', 90, 35.00, 45.00, 10.00, 200, 1000000),
    ('Small Profit Accumulation', 'profit_amount', 50, 60.00, 25.00, 5.00, 50, 50000),
    ('Large Profit Distribution', 'profit_amount', 1000, 30.00, 50.00, 10.00, 1000, 2000000)
ON CONFLICT DO NOTHING;

-- Insert default profit goals
INSERT INTO flashloan_profit_goals (goal_name, target_amount_usd, deadline, goal_type, priority)
VALUES 
    ('Emergency Fund Target', 10000.00, '2025-06-30', 'emergency_fund', 1),
    ('Reinvestment Pool Building', 25000.00, '2025-12-31', 'reinvestment_pool', 2),
    ('Agent Reward Pool', 5000.00, '2025-03-31', 'agent_rewards', 3),
    ('Q1 Profit Target', 50000.00, '2025-03-31', 'profit_accumulation', 4)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECURITY POLICIES (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE flashloan_profit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashloan_profit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashloan_profit_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_flashloan_profit_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view profit rules" ON flashloan_profit_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view profit history" ON flashloan_profit_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view profit goals" ON flashloan_profit_goals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view agent settings" ON agent_flashloan_profit_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for service role (full access)
CREATE POLICY "Service role full access profit rules" ON flashloan_profit_rules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access profit history" ON flashloan_profit_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access profit goals" ON flashloan_profit_goals
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access agent settings" ON agent_flashloan_profit_settings
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON flashloan_profit_analytics TO authenticated;
GRANT SELECT ON flashloan_profit_analytics TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE flashloan_profit_rules IS 'Rules for automatically distributing flash loan profits based on triggers';
COMMENT ON TABLE flashloan_profit_history IS 'Historical record of all flash loan profit distributions';
COMMENT ON TABLE flashloan_profit_goals IS 'Goals for accumulating profits from flash loan operations';
COMMENT ON TABLE agent_flashloan_profit_settings IS 'Per-agent settings for flash loan profit sharing and execution';
COMMENT ON VIEW flashloan_profit_analytics IS 'Analytics view for flash loan profit performance by agent and time period';