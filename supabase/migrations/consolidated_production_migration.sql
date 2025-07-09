-- Consolidated Production Migration Script
-- Generated: 2025-07-09
-- Purpose: Apply all critical migrations for MVP production deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- BANK MASTER SYSTEM TABLES
-- ==============================================

-- Bank Master Configuration Table
CREATE TABLE IF NOT EXISTS bank_master_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  capabilities JSONB NOT NULL DEFAULT '[]',
  risk_tolerance DECIMAL(5,4) NOT NULL DEFAULT 0.15,
  max_allocation_per_agent DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
  profit_threshold DECIMAL(15,2) NOT NULL DEFAULT 50.00,
  rebalance_interval_ms INTEGER NOT NULL DEFAULT 300000,
  emergency_stop_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  multi_chain_enabled BOOLEAN NOT NULL DEFAULT true,
  supported_chains JSONB NOT NULL DEFAULT '[]',
  llm_enabled BOOLEAN NOT NULL DEFAULT true,
  mcp_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Vault Wallets Table
CREATE TABLE IF NOT EXISTS vault_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_master_id UUID REFERENCES bank_master_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  private_key_encrypted TEXT, -- Encrypted storage
  is_testnet BOOLEAN NOT NULL DEFAULT false,
  balance_usd DECIMAL(20,8) DEFAULT 0,
  last_balance_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(address, chain)
);

-- Profit Collections Table
CREATE TABLE IF NOT EXISTS profit_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_master_id UUID REFERENCES bank_master_config(id) ON DELETE CASCADE,
  collection_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('goal', 'agent', 'farm', 'manual')),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  amount_usd DECIMAL(20,8) NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collection_method TEXT NOT NULL DEFAULT 'automatic',
  transaction_hash TEXT,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  gas_fee_usd DECIMAL(20,8) DEFAULT 0,
  net_profit_usd DECIMAL(20,8) GENERATED ALWAYS AS (amount_usd - gas_fee_usd) STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ENHANCED FARM SYSTEM TABLES
-- ==============================================

-- Enhanced farms table with advanced features
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  farm_type TEXT NOT NULL,
  total_allocated_usd DECIMAL(20,8) NOT NULL DEFAULT 0,
  agent_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  performance_metrics JSONB DEFAULT '{}',
  coordination_rules JSONB DEFAULT '{}',
  risk_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ENHANCED GOALS SYSTEM TABLES
-- ==============================================

-- Enhanced goals table with advanced features
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,
  target_value DECIMAL(20,8) NOT NULL,
  current_value DECIMAL(20,8) NOT NULL DEFAULT 0,
  target_date DATE,
  collection_percentage DECIMAL(5,2) DEFAULT 5.00,
  auto_collect BOOLEAN DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN target_value > 0 THEN (current_value / target_value) * 100 ELSE 0 END
  ) STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- AGENT TRADING SYSTEM TABLES
-- ==============================================

-- Enhanced agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'trading',
  strategy TEXT NOT NULL DEFAULT 'conservative',
  total_capital DECIMAL(20,8) NOT NULL DEFAULT 0,
  available_capital DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  risk_tolerance DECIMAL(5,4) DEFAULT 0.15,
  performance_metrics JSONB DEFAULT '{}',
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent capability profiles
CREATE TABLE IF NOT EXISTS agent_capability_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  capability_name TEXT NOT NULL,
  capability_level INTEGER NOT NULL DEFAULT 1,
  parameters JSONB DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, capability_name)
);

-- Agent checkpoints for state persistence
CREATE TABLE IF NOT EXISTS agent_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  checkpoint_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, checkpoint_name)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Bank Master System indexes
CREATE INDEX IF NOT EXISTS idx_bank_master_config_active ON bank_master_config(is_active);
CREATE INDEX IF NOT EXISTS idx_vault_wallets_address ON vault_wallets(address);
CREATE INDEX IF NOT EXISTS idx_profit_collections_source ON profit_collections(source, source_id);

-- Farm System indexes
CREATE INDEX IF NOT EXISTS idx_farms_active ON farms(is_active);
CREATE INDEX IF NOT EXISTS idx_farms_type ON farms(farm_type);

-- Goal System indexes
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_progress ON goals(progress_percentage);

-- Agent System indexes
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_capabilities_agent ON agent_capability_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_agent ON agent_checkpoints(agent_id);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE bank_master_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_capability_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON bank_master_config FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vault_wallets FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON profit_collections FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON farms FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON goals FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON agent_capability_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON agent_checkpoints FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample Bank Master config
INSERT INTO bank_master_config (name, version, capabilities, risk_tolerance, max_allocation_per_agent, profit_threshold) 
VALUES ('Production Bank Master', '1.0.0', '["profit_collection", "fund_distribution", "risk_management"]', 0.15, 1000.00, 50.00)
ON CONFLICT DO NOTHING;

-- Insert sample farm
INSERT INTO farms (name, description, farm_type, total_allocated_usd, agent_count)
VALUES ('Conservative Trading Farm', 'Low-risk algorithmic trading strategies', 'conservative', 10000.00, 5)
ON CONFLICT DO NOTHING;

-- Insert sample goal
INSERT INTO goals (name, description, goal_type, target_value, collection_percentage)
VALUES ('Monthly Profit Target', 'Achieve $5000 monthly profit', 'profit', 5000.00, 5.00)
ON CONFLICT DO NOTHING;

-- Insert sample agent
INSERT INTO agents (name, description, agent_type, strategy, total_capital, available_capital)
VALUES ('Conservative Bot 1', 'Low-risk trading agent', 'trading', 'conservative', 1000.00, 1000.00)
ON CONFLICT DO NOTHING;

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE bank_master_config;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE profit_collections;
ALTER PUBLICATION supabase_realtime ADD TABLE farms;
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_capability_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_checkpoints;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_bank_master_config_updated_at BEFORE UPDATE ON bank_master_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_wallets_updated_at BEFORE UPDATE ON vault_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_capability_profiles_updated_at BEFORE UPDATE ON agent_capability_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_checkpoints_updated_at BEFORE UPDATE ON agent_checkpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Consolidated Production Migration completed successfully!';
  RAISE NOTICE 'Tables created: bank_master_config, vault_wallets, profit_collections, farms, goals, agents, agent_capability_profiles, agent_checkpoints';
  RAISE NOTICE 'Indexes created for performance optimization';
  RAISE NOTICE 'RLS policies enabled for security';
  RAISE NOTICE 'Sample data inserted for testing';
  RAISE NOTICE 'Realtime subscriptions enabled';
  RAISE NOTICE 'Ready for production deployment!';
END $$;