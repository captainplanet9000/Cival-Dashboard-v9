-- Bank Master Dashboard - Complete Database Schema
-- Migration: 20250109_bank_master_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  amount DECIMAL(20,8) NOT NULL,
  token TEXT NOT NULL DEFAULT 'USDC',
  chain TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  tx_hash TEXT,
  reason TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Vault Operations Table
CREATE TABLE IF NOT EXISTS vault_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_master_id UUID REFERENCES bank_master_config(id) ON DELETE CASCADE,
  operation_id TEXT UNIQUE NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('deposit', 'withdraw', 'allocate', 'rebalance', 'emergency')),
  amount DECIMAL(20,8) NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  tx_hash TEXT,
  gas_used BIGINT,
  gas_price_gwei DECIMAL(20,8),
  reason TEXT NOT NULL,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Bank Master Decisions Table
CREATE TABLE IF NOT EXISTS bank_master_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_master_id UUID REFERENCES bank_master_config(id) ON DELETE CASCADE,
  decision_id TEXT UNIQUE NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('allocation', 'collection', 'rebalance', 'emergency', 'optimization')),
  reasoning TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  expected_outcome TEXT NOT NULL,
  risk_assessment INTEGER NOT NULL CHECK (risk_assessment >= 0 AND risk_assessment <= 100),
  parameters JSONB DEFAULT '{}',
  result JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS bank_master_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_master_id UUID REFERENCES bank_master_config(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS bank_master_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_master_id UUID REFERENCES bank_master_config(id) ON DELETE CASCADE,
  total_assets_managed DECIMAL(20,8) DEFAULT 0,
  total_profits_collected DECIMAL(20,8) DEFAULT 0,
  total_allocated DECIMAL(20,8) DEFAULT 0,
  total_returns DECIMAL(20,8) DEFAULT 0,
  avg_roi DECIMAL(10,4) DEFAULT 0,
  sharpe_ratio DECIMAL(10,4) DEFAULT 0,
  max_drawdown DECIMAL(10,4) DEFAULT 0,
  win_rate DECIMAL(10,4) DEFAULT 0,
  total_decisions INTEGER DEFAULT 0,
  successful_decisions INTEGER DEFAULT 0,
  chain_distribution JSONB DEFAULT '{}',
  top_performing_agents JSONB DEFAULT '[]',
  risk_exposure JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal Profit Mappings Table
CREATE TABLE IF NOT EXISTS goal_profit_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id TEXT NOT NULL,
  goal_name TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  profit_amount DECIMAL(20,8) NOT NULL,
  profit_token TEXT NOT NULL DEFAULT 'USDC',
  profit_chain TEXT NOT NULL,
  source_agent_id TEXT,
  source_farm_id TEXT,
  collection_status TEXT NOT NULL CHECK (collection_status IN ('pending', 'collecting', 'completed', 'failed')) DEFAULT 'pending',
  collection_tx_hash TEXT,
  collection_timestamp TIMESTAMP WITH TIME ZONE,
  vault_address TEXT NOT NULL,
  collection_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profit Collection Rules Table
CREATE TABLE IF NOT EXISTS profit_collection_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  trigger_condition TEXT NOT NULL CHECK (trigger_condition IN ('immediate', 'threshold', 'percentage', 'time_based')),
  trigger_value DECIMAL(20,8),
  collection_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  preferred_chain TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profit Collection Events Table
CREATE TABLE IF NOT EXISTS profit_collection_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal_completed', 'threshold_reached', 'manual_trigger', 'emergency_collection')),
  goal_id TEXT NOT NULL,
  goal_name TEXT NOT NULL,
  profit_amount DECIMAL(20,8) NOT NULL,
  collection_amount DECIMAL(20,8) NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  execution_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Balances Table
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES vault_wallets(id) ON DELETE CASCADE,
  token_symbol TEXT NOT NULL,
  token_address TEXT,
  balance DECIMAL(30,18) NOT NULL DEFAULT 0,
  decimals INTEGER NOT NULL DEFAULT 18,
  usd_value DECIMAL(20,8),
  is_native BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_id, token_symbol)
);

-- Cross-Chain Transactions Table
CREATE TABLE IF NOT EXISTS cross_chain_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT UNIQUE NOT NULL,
  source_chain TEXT NOT NULL,
  target_chain TEXT NOT NULL,
  source_tx_hash TEXT,
  target_tx_hash TEXT,
  amount DECIMAL(30,18) NOT NULL,
  token_symbol TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  bridge_provider TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'bridging', 'completed', 'failed')) DEFAULT 'pending',
  fees_paid DECIMAL(30,18),
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profit_collections_bank_master ON profit_collections(bank_master_id);
CREATE INDEX IF NOT EXISTS idx_profit_collections_status ON profit_collections(status);
CREATE INDEX IF NOT EXISTS idx_profit_collections_source ON profit_collections(source, source_id);
CREATE INDEX IF NOT EXISTS idx_vault_operations_bank_master ON vault_operations(bank_master_id);
CREATE INDEX IF NOT EXISTS idx_vault_operations_status ON vault_operations(status);
CREATE INDEX IF NOT EXISTS idx_vault_operations_type ON vault_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bank_master_decisions_bank_master ON bank_master_decisions(bank_master_id);
CREATE INDEX IF NOT EXISTS idx_bank_master_decisions_type ON bank_master_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_bank_master ON bank_master_chat(bank_master_id);
CREATE INDEX IF NOT EXISTS idx_vault_wallets_chain ON vault_wallets(chain);
CREATE INDEX IF NOT EXISTS idx_vault_wallets_address ON vault_wallets(address);
CREATE INDEX IF NOT EXISTS idx_goal_profit_mappings_goal ON goal_profit_mappings(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_profit_mappings_status ON goal_profit_mappings(collection_status);
CREATE INDEX IF NOT EXISTS idx_profit_collection_rules_active ON profit_collection_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet ON wallet_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_status ON cross_chain_transactions(status);

-- Row Level Security (RLS) Policies
ALTER TABLE bank_master_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_master_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_master_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_master_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_profit_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_collection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_collection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON bank_master_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON vault_wallets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON profit_collections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON vault_operations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON bank_master_decisions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON bank_master_chat FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON bank_master_performance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON goal_profit_mappings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON profit_collection_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON profit_collection_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON wallet_balances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for authenticated users" ON cross_chain_transactions FOR ALL USING (auth.role() = 'authenticated');

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_bank_master_config_updated_at BEFORE UPDATE ON bank_master_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_wallets_updated_at BEFORE UPDATE ON vault_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profit_collection_rules_updated_at BEFORE UPDATE ON profit_collection_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default Bank Master configuration
INSERT INTO bank_master_config (
  name,
  version,
  capabilities,
  risk_tolerance,
  max_allocation_per_agent,
  profit_threshold,
  rebalance_interval_ms,
  emergency_stop_threshold,
  multi_chain_enabled,
  supported_chains,
  llm_enabled,
  mcp_enabled,
  is_active
) VALUES (
  'Primary Bank Master',
  '1.0.0',
  '["profit_collection", "fund_allocation", "risk_management", "portfolio_optimization", "emergency_controls", "cross_chain_operations", "llm_integration", "mcp_integration"]',
  0.15,
  1000.00,
  50.00,
  300000,
  50.00,
  true,
  '["ethereum", "arbitrum", "base", "sonic", "solana", "berachain", "bitcoin", "monad", "sui"]',
  true,
  true,
  false
) ON CONFLICT DO NOTHING;

-- Insert default profit collection rules
INSERT INTO profit_collection_rules (
  rule_id,
  name,
  goal_type,
  trigger_condition,
  trigger_value,
  collection_percentage,
  preferred_chain,
  is_active,
  priority
) VALUES 
(
  'profit_goal_immediate',
  'Immediate Profit Collection',
  'profit',
  'immediate',
  NULL,
  100.00,
  'ethereum',
  true,
  1
),
(
  'trading_goal_threshold',
  'Trading Goal Threshold Collection',
  'trades',
  'threshold',
  100.00,
  75.00,
  'arbitrum',
  true,
  2
),
(
  'winrate_goal_percentage',
  'Win Rate Goal Percentage Collection',
  'winRate',
  'percentage',
  85.00,
  50.00,
  'base',
  true,
  3
),
(
  'farm_goal_performance',
  'Farm Performance Collection',
  'farm',
  'immediate',
  NULL,
  80.00,
  'sonic',
  true,
  2
) ON CONFLICT (rule_id) DO NOTHING;