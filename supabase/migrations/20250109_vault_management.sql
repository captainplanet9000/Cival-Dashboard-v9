-- Vault Management and Multi-Wallet Tables Migration
-- Purpose: Add comprehensive wallet management, multi-signature vaults, and asset custody
-- Generated: 2025-01-09
-- Priority: 3 (Important for Vault Dashboard functionality)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- WALLET AND VAULT MANAGEMENT TABLES
-- ==============================================

-- Enhanced wallets table with multi-chain support
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_name TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('hot', 'cold', 'hardware', 'multisig', 'smart_contract')),
  blockchain TEXT NOT NULL DEFAULT 'ethereum',
  address TEXT NOT NULL,
  
  -- Balance tracking
  total_balance_usd DECIMAL(20,8) DEFAULT 0,
  available_balance_usd DECIMAL(20,8) DEFAULT 0,
  locked_balance_usd DECIMAL(20,8) DEFAULT 0,
  
  -- Asset holdings
  token_balances JSONB DEFAULT '{}',
  nft_holdings JSONB DEFAULT '[]',
  
  -- Security and access
  is_active BOOLEAN DEFAULT true,
  is_custody BOOLEAN DEFAULT false,
  security_level TEXT DEFAULT 'standard' CHECK (security_level IN ('basic', 'standard', 'high', 'enterprise')),
  
  -- Multi-signature configuration
  required_signatures INTEGER DEFAULT 1,
  total_signers INTEGER DEFAULT 1,
  signers JSONB DEFAULT '[]',
  
  -- Metadata
  description TEXT,
  tags JSONB DEFAULT '[]',
  external_wallet_id TEXT,
  provider TEXT,
  derivation_path TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(blockchain, address)
);

-- Vault configurations for multi-wallet management
CREATE TABLE IF NOT EXISTS vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_name TEXT NOT NULL UNIQUE,
  vault_type TEXT NOT NULL CHECK (vault_type IN ('trading', 'custody', 'yield', 'treasury', 'emergency')),
  description TEXT,
  
  -- Vault configuration
  strategy TEXT DEFAULT 'balanced',
  allocation_rules JSONB DEFAULT '{}',
  risk_parameters JSONB DEFAULT '{}',
  rebalancing_rules JSONB DEFAULT '{}',
  
  -- Financial metrics
  total_value_usd DECIMAL(20,8) DEFAULT 0,
  target_allocation_usd DECIMAL(20,8) DEFAULT 0,
  performance_metrics JSONB DEFAULT '{}',
  
  -- Access control
  access_level TEXT DEFAULT 'restricted' CHECK (access_level IN ('public', 'restricted', 'private', 'emergency_only')),
  authorized_agents JSONB DEFAULT '[]',
  authorized_users JSONB DEFAULT '[]',
  
  -- Security settings
  daily_withdrawal_limit_usd DECIMAL(20,2) DEFAULT 10000,
  requires_approval BOOLEAN DEFAULT true,
  approval_threshold_usd DECIMAL(20,2) DEFAULT 1000,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  lock_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet-to-vault associations
CREATE TABLE IF NOT EXISTS vault_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Allocation settings
  allocation_percentage DECIMAL(5,2) DEFAULT 0 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  max_allocation_usd DECIMAL(20,8),
  min_allocation_usd DECIMAL(20,8),
  
  -- Role and permissions
  wallet_role TEXT DEFAULT 'trading' CHECK (wallet_role IN ('trading', 'custody', 'cold_storage', 'hot_wallet', 'yield_farming')),
  permissions JSONB DEFAULT '{}',
  
  -- Performance tracking
  allocated_amount_usd DECIMAL(20,8) DEFAULT 0,
  performance_contribution DECIMAL(10,6) DEFAULT 0,
  last_rebalance_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(vault_id, wallet_id)
);

-- Asset allocation tracking across vaults
CREATE TABLE IF NOT EXISTS vault_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  asset_type TEXT DEFAULT 'token' CHECK (asset_type IN ('token', 'nft', 'lp_token', 'derivative')),
  
  -- Allocation details
  target_allocation_percent DECIMAL(5,2) DEFAULT 0,
  current_allocation_percent DECIMAL(5,2) DEFAULT 0,
  target_amount DECIMAL(30,18) DEFAULT 0,
  current_amount DECIMAL(30,18) DEFAULT 0,
  current_value_usd DECIMAL(20,8) DEFAULT 0,
  
  -- Rebalancing parameters
  rebalance_threshold_percent DECIMAL(4,2) DEFAULT 5.0,
  min_trade_size_usd DECIMAL(20,2) DEFAULT 100,
  max_trade_size_usd DECIMAL(20,2),
  
  -- Performance tracking
  total_pnl_usd DECIMAL(20,8) DEFAULT 0,
  daily_pnl_usd DECIMAL(20,8) DEFAULT 0,
  avg_entry_price DECIMAL(20,8),
  last_rebalance_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  auto_rebalance BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(vault_id, asset_symbol)
);

-- Vault transaction history and audit log
CREATE TABLE IF NOT EXISTS vault_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'rebalance', 'yield_claim', 'fee_payment')),
  transaction_hash TEXT,
  block_number BIGINT,
  
  -- Asset information
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(30,18) NOT NULL,
  amount_usd DECIMAL(20,8) NOT NULL,
  price_per_unit DECIMAL(20,8),
  
  -- Transfer details
  from_address TEXT,
  to_address TEXT,
  from_vault_id UUID REFERENCES vaults(id) ON DELETE SET NULL,
  to_vault_id UUID REFERENCES vaults(id) ON DELETE SET NULL,
  
  -- Transaction costs
  gas_fee_usd DECIMAL(20,8) DEFAULT 0,
  protocol_fee_usd DECIMAL(20,8) DEFAULT 0,
  slippage_percent DECIMAL(5,4) DEFAULT 0,
  
  -- Approval and authorization
  requires_approval BOOLEAN DEFAULT false,
  approved_by JSONB DEFAULT '[]',
  approval_status TEXT DEFAULT 'auto_approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  
  -- Status and metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  error_message TEXT,
  transaction_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Vault performance analytics
CREATE TABLE IF NOT EXISTS vault_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL DEFAULT '24h' CHECK (timeframe IN ('1h', '24h', '7d', '30d', '90d', '1y')),
  
  -- Performance metrics
  total_value_start_usd DECIMAL(20,8) NOT NULL,
  total_value_end_usd DECIMAL(20,8) NOT NULL,
  total_return_usd DECIMAL(20,8) DEFAULT 0,
  total_return_percent DECIMAL(10,6) DEFAULT 0,
  
  -- Risk metrics
  volatility DECIMAL(10,6) DEFAULT 0,
  max_drawdown_percent DECIMAL(10,6) DEFAULT 0,
  sharpe_ratio DECIMAL(8,4) DEFAULT 0,
  sortino_ratio DECIMAL(8,4) DEFAULT 0,
  
  -- Activity metrics
  total_transactions INTEGER DEFAULT 0,
  total_volume_usd DECIMAL(20,8) DEFAULT 0,
  total_fees_usd DECIMAL(20,8) DEFAULT 0,
  rebalance_count INTEGER DEFAULT 0,
  
  -- Asset allocation metrics
  allocation_efficiency DECIMAL(5,4) DEFAULT 1.0,
  diversification_score DECIMAL(5,4) DEFAULT 0.5,
  
  -- Benchmarking
  benchmark_return_percent DECIMAL(10,6) DEFAULT 0,
  alpha DECIMAL(10,6) DEFAULT 0,
  beta DECIMAL(8,4) DEFAULT 1.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(vault_id, timeframe, created_at)
);

-- Multi-signature transaction proposals
CREATE TABLE IF NOT EXISTS multisig_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  proposed_by TEXT NOT NULL,
  
  -- Proposal details
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('transfer', 'contract_call', 'vault_operation', 'configuration_change')),
  description TEXT NOT NULL,
  target_address TEXT,
  value_wei DECIMAL(30,0) DEFAULT 0,
  calldata TEXT,
  
  -- Approval tracking
  required_signatures INTEGER NOT NULL,
  current_signatures INTEGER DEFAULT 0,
  signatures JSONB DEFAULT '[]',
  
  -- Execution details
  executed BOOLEAN DEFAULT false,
  execution_tx_hash TEXT,
  execution_block_number BIGINT,
  
  -- Timeline
  expires_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'cancelled', 'expired')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_wallets_blockchain_address ON wallets(blockchain, address);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(total_balance_usd DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_security_level ON wallets(security_level);

-- Vault indexes
CREATE INDEX IF NOT EXISTS idx_vaults_type ON vaults(vault_type);
CREATE INDEX IF NOT EXISTS idx_vaults_active ON vaults(is_active);
CREATE INDEX IF NOT EXISTS idx_vaults_value ON vaults(total_value_usd DESC);
CREATE INDEX IF NOT EXISTS idx_vaults_locked ON vaults(is_locked);

-- Vault wallet indexes
CREATE INDEX IF NOT EXISTS idx_vault_wallets_vault ON vault_wallets(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_wallets_wallet ON vault_wallets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vault_wallets_active ON vault_wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_vault_wallets_role ON vault_wallets(wallet_role);

-- Vault allocation indexes
CREATE INDEX IF NOT EXISTS idx_vault_allocations_vault ON vault_allocations(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_allocations_asset ON vault_allocations(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_vault_allocations_active ON vault_allocations(is_active);
CREATE INDEX IF NOT EXISTS idx_vault_allocations_auto_rebalance ON vault_allocations(auto_rebalance);

-- Vault transaction indexes
CREATE INDEX IF NOT EXISTS idx_vault_transactions_vault ON vault_transactions(vault_id);
CREATE INDEX IF NOT EXISTS idx_vault_transactions_wallet ON vault_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vault_transactions_type ON vault_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_vault_transactions_hash ON vault_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_vault_transactions_status ON vault_transactions(status);
CREATE INDEX IF NOT EXISTS idx_vault_transactions_created_at ON vault_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_vault_transactions_approval_status ON vault_transactions(approval_status);

-- Vault performance indexes
CREATE INDEX IF NOT EXISTS idx_vault_performance_vault_timeframe ON vault_performance(vault_id, timeframe);
CREATE INDEX IF NOT EXISTS idx_vault_performance_created_at ON vault_performance(created_at);
CREATE INDEX IF NOT EXISTS idx_vault_performance_return ON vault_performance(total_return_percent DESC);

-- Multisig proposal indexes
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_wallet ON multisig_proposals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_status ON multisig_proposals(status);
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_executed ON multisig_proposals(executed);
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_expires_at ON multisig_proposals(expires_at);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all vault tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE multisig_proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON wallets FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vaults FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vault_wallets FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vault_allocations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vault_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vault_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON multisig_proposals FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample wallets
INSERT INTO wallets (wallet_name, wallet_type, blockchain, address, total_balance_usd, security_level, description) VALUES
('Primary Trading Wallet', 'hot', 'ethereum', '0x742d35Cc9679d4E0B2C3b1Bd6E4e3e2E8a5D4B1c', 150000.00, 'standard', 'Main hot wallet for active trading operations'),
('Cold Storage Vault', 'cold', 'ethereum', '0x1234567890ABCDEFabcdef1234567890abcdef12', 2500000.00, 'enterprise', 'Secure cold storage for long-term holdings'),
('Multi-Sig Treasury', 'multisig', 'ethereum', '0xABCDEF1234567890abcdef1234567890ABCDEF12', 800000.00, 'high', 'Treasury multi-signature wallet requiring 3 of 5 signatures'),
('DeFi Yield Wallet', 'hot', 'ethereum', '0x9876543210fedcbaFEDCBA9876543210fedcba98', 75000.00, 'standard', 'Dedicated wallet for DeFi yield farming activities'),
('BSC Trading Wallet', 'hot', 'binance_smart_chain', '0xDEADBEEF1234567890deadbeef1234567890DEAD', 50000.00, 'standard', 'Binance Smart Chain trading operations'),
('Polygon Yield Farm', 'hot', 'polygon', '0xCAFEBABE1234567890cafebabe1234567890CAFE', 25000.00, 'standard', 'Polygon network yield farming wallet')
ON CONFLICT (blockchain, address) DO UPDATE SET
  wallet_name = EXCLUDED.wallet_name,
  wallet_type = EXCLUDED.wallet_type,
  total_balance_usd = EXCLUDED.total_balance_usd,
  security_level = EXCLUDED.security_level,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert sample vaults
INSERT INTO vaults (vault_name, vault_type, description, strategy, total_value_usd, daily_withdrawal_limit_usd, allocation_rules) VALUES
('Primary Trading Vault', 'trading', 'Main vault for active trading strategies with balanced risk approach', 'balanced', 450000.00, 50000.00, '{"max_single_position": 0.15, "max_sector_allocation": 0.3, "rebalance_threshold": 0.05}'),
('Conservative Yield Vault', 'yield', 'Low-risk vault focused on stable yield generation through DeFi protocols', 'conservative', 180000.00, 10000.00, '{"max_apy_target": 0.12, "max_protocol_allocation": 0.25, "min_liquidity_ratio": 0.1}'),
('Emergency Reserve Fund', 'emergency', 'Emergency fund for system operations and unexpected market conditions', 'cash', 100000.00, 25000.00, '{"stable_coin_min": 0.8, "max_drawdown_limit": 0.05, "instant_liquidity": 0.5}'),
('High Growth Vault', 'trading', 'Aggressive growth vault targeting high-return opportunities', 'aggressive', 350000.00, 75000.00, '{"max_single_position": 0.25, "leverage_limit": 2.0, "stop_loss_threshold": 0.15}'),
('Treasury Custody Vault', 'custody', 'Long-term custody vault for treasury management and institutional holdings', 'custody', 2500000.00, 100000.00, '{"cold_storage_min": 0.7, "multi_sig_required": true, "approval_threshold": 10000}')
ON CONFLICT (vault_name) DO UPDATE SET
  vault_type = EXCLUDED.vault_type,
  description = EXCLUDED.description,
  strategy = EXCLUDED.strategy,
  total_value_usd = EXCLUDED.total_value_usd,
  daily_withdrawal_limit_usd = EXCLUDED.daily_withdrawal_limit_usd,
  allocation_rules = EXCLUDED.allocation_rules,
  updated_at = NOW();

-- Link wallets to vaults
INSERT INTO vault_wallets (vault_id, wallet_id, allocation_percentage, wallet_role)
SELECT 
  v.id as vault_id,
  w.id as wallet_id,
  CASE 
    WHEN v.vault_name = 'Primary Trading Vault' AND w.wallet_name = 'Primary Trading Wallet' THEN 60.0
    WHEN v.vault_name = 'Primary Trading Vault' AND w.wallet_name = 'DeFi Yield Wallet' THEN 40.0
    WHEN v.vault_name = 'Conservative Yield Vault' AND w.wallet_name = 'DeFi Yield Wallet' THEN 70.0
    WHEN v.vault_name = 'Conservative Yield Vault' AND w.wallet_name = 'Polygon Yield Farm' THEN 30.0
    WHEN v.vault_name = 'Treasury Custody Vault' AND w.wallet_name = 'Cold Storage Vault' THEN 80.0
    WHEN v.vault_name = 'Treasury Custody Vault' AND w.wallet_name = 'Multi-Sig Treasury' THEN 20.0
    WHEN v.vault_name = 'High Growth Vault' AND w.wallet_name = 'Primary Trading Wallet' THEN 50.0
    WHEN v.vault_name = 'High Growth Vault' AND w.wallet_name = 'BSC Trading Wallet' THEN 50.0
    ELSE 100.0
  END as allocation_percentage,
  CASE 
    WHEN w.wallet_type = 'cold' THEN 'cold_storage'
    WHEN w.wallet_type = 'multisig' THEN 'custody'
    WHEN w.wallet_name LIKE '%Yield%' THEN 'yield_farming'
    ELSE 'trading'
  END as wallet_role
FROM vaults v
CROSS JOIN wallets w
WHERE (v.vault_name = 'Primary Trading Vault' AND w.wallet_name IN ('Primary Trading Wallet', 'DeFi Yield Wallet'))
   OR (v.vault_name = 'Conservative Yield Vault' AND w.wallet_name IN ('DeFi Yield Wallet', 'Polygon Yield Farm'))
   OR (v.vault_name = 'Treasury Custody Vault' AND w.wallet_name IN ('Cold Storage Vault', 'Multi-Sig Treasury'))
   OR (v.vault_name = 'High Growth Vault' AND w.wallet_name IN ('Primary Trading Wallet', 'BSC Trading Wallet'))
   OR (v.vault_name = 'Emergency Reserve Fund' AND w.wallet_name = 'Primary Trading Wallet')
ON CONFLICT (vault_id, wallet_id) DO NOTHING;

-- Insert sample vault allocations
INSERT INTO vault_allocations (vault_id, asset_symbol, target_allocation_percent, current_allocation_percent, current_value_usd, auto_rebalance)
SELECT 
  v.id as vault_id,
  asset_data.symbol,
  asset_data.target_percent,
  asset_data.current_percent,
  v.total_value_usd * asset_data.current_percent / 100,
  asset_data.auto_rebalance
FROM vaults v
CROSS JOIN (
  VALUES 
    ('BTC', 30.0, 32.5, true),
    ('ETH', 25.0, 28.0, true),
    ('USDC', 20.0, 18.5, true),
    ('LINK', 10.0, 8.5, true),
    ('UNI', 8.0, 7.0, true),
    ('AAVE', 7.0, 5.5, true)
) AS asset_data(symbol, target_percent, current_percent, auto_rebalance)
WHERE v.vault_name = 'Primary Trading Vault'
ON CONFLICT (vault_id, asset_symbol) DO NOTHING;

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all vault tables
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE vaults;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_performance;
ALTER PUBLICATION supabase_realtime ADD TABLE multisig_proposals;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update vault totals when wallet balances change
CREATE OR REPLACE FUNCTION update_vault_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vault total value when wallet balance changes
  UPDATE vaults
  SET 
    total_value_usd = (
      SELECT COALESCE(SUM(w.total_balance_usd * vw.allocation_percentage / 100), 0)
      FROM vault_wallets vw
      JOIN wallets w ON vw.wallet_id = w.id
      WHERE vw.vault_id = vaults.id AND vw.is_active = true
    ),
    updated_at = NOW()
  WHERE id IN (
    SELECT vw.vault_id 
    FROM vault_wallets vw 
    WHERE vw.wallet_id = NEW.id AND vw.is_active = true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vault totals when wallet balances change
CREATE TRIGGER update_vault_totals_trigger
  AFTER UPDATE OF total_balance_usd ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_vault_totals();

-- Function to calculate vault performance metrics
CREATE OR REPLACE FUNCTION calculate_vault_performance()
RETURNS TRIGGER AS $$
DECLARE
  vault_record RECORD;
  start_value DECIMAL(20,8);
  end_value DECIMAL(20,8);
  return_amount DECIMAL(20,8);
  return_percent DECIMAL(10,6);
BEGIN
  -- Calculate performance for the vault
  SELECT * INTO vault_record FROM vaults WHERE id = NEW.vault_id;
  
  -- Get starting value (24 hours ago)
  SELECT COALESCE(total_value_end_usd, vault_record.total_value_usd) INTO start_value
  FROM vault_performance 
  WHERE vault_id = NEW.vault_id 
    AND timeframe = '24h' 
    AND created_at >= NOW() - INTERVAL '25 hours'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  end_value := vault_record.total_value_usd;
  return_amount := end_value - COALESCE(start_value, end_value);
  return_percent := CASE WHEN start_value > 0 THEN return_amount / start_value ELSE 0 END;
  
  -- Insert or update performance record
  INSERT INTO vault_performance (
    vault_id, timeframe, total_value_start_usd, total_value_end_usd,
    total_return_usd, total_return_percent
  )
  VALUES (
    NEW.vault_id, '24h', COALESCE(start_value, end_value), end_value,
    return_amount, return_percent
  )
  ON CONFLICT (vault_id, timeframe, created_at) DO UPDATE SET
    total_value_end_usd = EXCLUDED.total_value_end_usd,
    total_return_usd = EXCLUDED.total_return_usd,
    total_return_percent = EXCLUDED.total_return_percent;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate performance when vault transactions occur
CREATE TRIGGER calculate_vault_performance_trigger
  AFTER INSERT ON vault_transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_vault_performance();

-- Add triggers for updated_at columns
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_wallets_updated_at BEFORE UPDATE ON vault_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_allocations_updated_at BEFORE UPDATE ON vault_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_multisig_proposals_updated_at BEFORE UPDATE ON multisig_proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Vault Management Migration completed successfully!';
  RAISE NOTICE 'Tables created: wallets, vaults, vault_wallets, vault_allocations, vault_transactions, vault_performance, multisig_proposals';
  RAISE NOTICE 'Sample data inserted for 6 wallets across multiple blockchains';
  RAISE NOTICE 'Sample vaults created with different strategies and allocations';
  RAISE NOTICE 'Multi-signature support and approval workflows configured';
  RAISE NOTICE 'Performance tracking and automatic calculations enabled';
  RAISE NOTICE 'Realtime subscriptions enabled for all vault tables';
  RAISE NOTICE 'Vault dashboard ready for multi-wallet management!';
END $$;