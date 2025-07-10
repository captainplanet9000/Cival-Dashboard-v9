-- DeFi Protocol Integration Tables Migration
-- Purpose: Add comprehensive DeFi protocol integration, yield farming, and multi-chain support
-- Generated: 2025-01-09
-- Priority: 2 (Important for DeFi Dashboard functionality)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- DEFI PROTOCOL TABLES
-- ==============================================

-- DeFi protocol definitions and configurations
CREATE TABLE IF NOT EXISTS defi_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_name TEXT NOT NULL UNIQUE,
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('dex', 'lending', 'yield_farming', 'liquidity_pool', 'staking', 'bridge', 'derivatives')),
  blockchain TEXT NOT NULL,
  contract_address TEXT,
  abi_hash TEXT,
  description TEXT,
  website_url TEXT,
  documentation_url TEXT,
  
  -- Protocol metrics
  tvl_usd DECIMAL(20,2) DEFAULT 0,
  volume_24h_usd DECIMAL(20,2) DEFAULT 0,
  fees_24h_usd DECIMAL(20,2) DEFAULT 0,
  users_24h INTEGER DEFAULT 0,
  
  -- Integration status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  integration_status TEXT DEFAULT 'pending' CHECK (integration_status IN ('pending', 'testing', 'active', 'deprecated')),
  
  -- Risk assessment
  risk_score DECIMAL(3,2) DEFAULT 0.5,
  audit_status TEXT DEFAULT 'unaudited' CHECK (audit_status IN ('unaudited', 'pending', 'audited', 'verified')),
  audit_reports JSONB DEFAULT '[]',
  
  -- Configuration
  supported_tokens JSONB DEFAULT '[]',
  fee_structure JSONB DEFAULT '{}',
  slippage_tolerance DECIMAL(5,4) DEFAULT 0.005,
  gas_optimization JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DeFi position tracking for agents
CREATE TABLE IF NOT EXISTS defi_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES defi_protocols(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL CHECK (position_type IN ('liquidity_pool', 'lending', 'borrowing', 'staking', 'farming', 'vault')),
  
  -- Position details
  token_pair TEXT NOT NULL,
  position_size_usd DECIMAL(20,8) NOT NULL,
  entry_price_usd DECIMAL(20,8),
  current_price_usd DECIMAL(20,8),
  
  -- Token amounts
  token_a_amount DECIMAL(30,18) DEFAULT 0,
  token_b_amount DECIMAL(30,18) DEFAULT 0,
  lp_token_amount DECIMAL(30,18) DEFAULT 0,
  
  -- Yield information
  apy_current DECIMAL(8,4) DEFAULT 0,
  apy_historical DECIMAL(8,4) DEFAULT 0,
  rewards_earned_usd DECIMAL(20,8) DEFAULT 0,
  fees_earned_usd DECIMAL(20,8) DEFAULT 0,
  
  -- Risk metrics
  impermanent_loss_usd DECIMAL(20,8) DEFAULT 0,
  liquidation_price DECIMAL(20,8),
  health_ratio DECIMAL(8,4),
  
  -- Transaction info
  entry_tx_hash TEXT,
  entry_block_number BIGINT,
  last_update_tx_hash TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  auto_compound BOOLEAN DEFAULT false,
  stop_loss_price DECIMAL(20,8),
  take_profit_price DECIMAL(20,8),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DeFi transaction history
CREATE TABLE IF NOT EXISTS defi_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES defi_protocols(id) ON DELETE CASCADE,
  position_id UUID REFERENCES defi_positions(id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw', 'swap', 'stake', 'unstake', 'claim', 'compound', 'borrow', 'repay')),
  transaction_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Token information
  token_in TEXT,
  token_out TEXT,
  amount_in DECIMAL(30,18) DEFAULT 0,
  amount_out DECIMAL(30,18) DEFAULT 0,
  amount_in_usd DECIMAL(20,8) DEFAULT 0,
  amount_out_usd DECIMAL(20,8) DEFAULT 0,
  
  -- Transaction costs
  gas_used BIGINT DEFAULT 0,
  gas_price_gwei DECIMAL(20,8) DEFAULT 0,
  gas_cost_usd DECIMAL(20,8) DEFAULT 0,
  protocol_fee_usd DECIMAL(20,8) DEFAULT 0,
  slippage_percent DECIMAL(5,4) DEFAULT 0,
  
  -- Status and metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
  error_message TEXT,
  transaction_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yield farming opportunities tracking
CREATE TABLE IF NOT EXISTS yield_farming_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID REFERENCES defi_protocols(id) ON DELETE CASCADE,
  
  -- Pool information
  pool_name TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  token_pair TEXT NOT NULL,
  pool_type TEXT DEFAULT 'liquidity_pool',
  
  -- Yield metrics
  apy_base DECIMAL(8,4) DEFAULT 0,
  apy_reward DECIMAL(8,4) DEFAULT 0,
  apy_total DECIMAL(8,4) DEFAULT 0,
  tvl_usd DECIMAL(20,2) DEFAULT 0,
  volume_24h_usd DECIMAL(20,2) DEFAULT 0,
  
  -- Rewards
  reward_tokens JSONB DEFAULT '[]',
  reward_frequency TEXT DEFAULT 'continuous',
  lock_period_days INTEGER DEFAULT 0,
  
  -- Risk assessment
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
  impermanent_loss_risk DECIMAL(3,2) DEFAULT 0.5,
  smart_contract_risk DECIMAL(3,2) DEFAULT 0.5,
  
  -- Requirements
  minimum_deposit_usd DECIMAL(20,2) DEFAULT 0,
  maximum_deposit_usd DECIMAL(20,2),
  supported_wallets JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  recommendation_score DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-chain bridge tracking
CREATE TABLE IF NOT EXISTS cross_chain_bridges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bridge_name TEXT NOT NULL,
  source_chain TEXT NOT NULL,
  destination_chain TEXT NOT NULL,
  bridge_contract_address TEXT NOT NULL,
  
  -- Bridge metrics
  tvl_usd DECIMAL(20,2) DEFAULT 0,
  volume_24h_usd DECIMAL(20,2) DEFAULT 0,
  fee_percent DECIMAL(5,4) DEFAULT 0,
  
  -- Supported tokens
  supported_tokens JSONB DEFAULT '[]',
  token_mappings JSONB DEFAULT '{}',
  
  -- Performance metrics
  average_bridge_time_minutes INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 1.0,
  
  -- Security
  security_score DECIMAL(3,2) DEFAULT 0.5,
  audit_status TEXT DEFAULT 'unaudited',
  
  -- Limits
  min_bridge_amount_usd DECIMAL(20,2) DEFAULT 0,
  max_bridge_amount_usd DECIMAL(20,2),
  daily_limit_usd DECIMAL(20,2),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bridge transaction tracking
CREATE TABLE IF NOT EXISTS bridge_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  bridge_id UUID REFERENCES cross_chain_bridges(id) ON DELETE CASCADE,
  
  -- Transaction details
  source_tx_hash TEXT NOT NULL,
  destination_tx_hash TEXT,
  source_block_number BIGINT,
  destination_block_number BIGINT,
  
  -- Token transfer
  token_symbol TEXT NOT NULL,
  amount DECIMAL(30,18) NOT NULL,
  amount_usd DECIMAL(20,8) NOT NULL,
  
  -- Fees
  bridge_fee_usd DECIMAL(20,8) DEFAULT 0,
  gas_fee_source_usd DECIMAL(20,8) DEFAULT 0,
  gas_fee_destination_usd DECIMAL(20,8) DEFAULT 0,
  
  -- Timing
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  bridge_time_minutes INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'bridging', 'completed', 'failed', 'timeout')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- DeFi protocol indexes
CREATE INDEX IF NOT EXISTS idx_defi_protocols_type_blockchain ON defi_protocols(protocol_type, blockchain);
CREATE INDEX IF NOT EXISTS idx_defi_protocols_active ON defi_protocols(is_active);
CREATE INDEX IF NOT EXISTS idx_defi_protocols_tvl ON defi_protocols(tvl_usd DESC);
CREATE INDEX IF NOT EXISTS idx_defi_protocols_risk_score ON defi_protocols(risk_score);

-- DeFi position indexes
CREATE INDEX IF NOT EXISTS idx_defi_positions_agent_protocol ON defi_positions(agent_id, protocol_id);
CREATE INDEX IF NOT EXISTS idx_defi_positions_type ON defi_positions(position_type);
CREATE INDEX IF NOT EXISTS idx_defi_positions_active ON defi_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_defi_positions_size ON defi_positions(position_size_usd DESC);
CREATE INDEX IF NOT EXISTS idx_defi_positions_apy ON defi_positions(apy_current DESC);

-- DeFi transaction indexes
CREATE INDEX IF NOT EXISTS idx_defi_transactions_agent_protocol ON defi_transactions(agent_id, protocol_id);
CREATE INDEX IF NOT EXISTS idx_defi_transactions_hash ON defi_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_defi_transactions_block ON defi_transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_defi_transactions_timestamp ON defi_transactions(block_timestamp);
CREATE INDEX IF NOT EXISTS idx_defi_transactions_type ON defi_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_defi_transactions_status ON defi_transactions(status);

-- Yield farming indexes
CREATE INDEX IF NOT EXISTS idx_yield_farming_protocol ON yield_farming_opportunities(protocol_id);
CREATE INDEX IF NOT EXISTS idx_yield_farming_apy ON yield_farming_opportunities(apy_total DESC);
CREATE INDEX IF NOT EXISTS idx_yield_farming_active ON yield_farming_opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_yield_farming_recommended ON yield_farming_opportunities(is_recommended);
CREATE INDEX IF NOT EXISTS idx_yield_farming_risk ON yield_farming_opportunities(risk_level);

-- Bridge indexes
CREATE INDEX IF NOT EXISTS idx_cross_chain_bridges_chains ON cross_chain_bridges(source_chain, destination_chain);
CREATE INDEX IF NOT EXISTS idx_cross_chain_bridges_active ON cross_chain_bridges(is_active);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_agent ON bridge_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_status ON bridge_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_initiated ON bridge_transactions(initiated_at);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all DeFi tables
ALTER TABLE defi_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_farming_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON defi_protocols FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON defi_positions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON defi_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON yield_farming_opportunities FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cross_chain_bridges FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bridge_transactions FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert popular DeFi protocols
INSERT INTO defi_protocols (protocol_name, protocol_type, blockchain, contract_address, description, tvl_usd, volume_24h_usd, risk_score, audit_status, supported_tokens, fee_structure) VALUES
('Uniswap V3', 'dex', 'ethereum', '0xE592427A0AEce92De3Edee1F18E0157C05861564', 'Leading decentralized exchange with concentrated liquidity', 4500000000.00, 1200000000.00, 0.3, 'audited', '["ETH", "USDC", "USDT", "WBTC", "DAI"]', '{"swap_fee": 0.003, "protocol_fee": 0.0005}'),
('Aave V3', 'lending', 'ethereum', '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', 'Decentralized money market protocol for lending and borrowing', 8900000000.00, 45000000.00, 0.25, 'audited', '["ETH", "USDC", "USDT", "WBTC", "DAI", "LINK"]', '{"origination_fee": 0.001, "liquidation_bonus": 0.05}'),
('Compound V3', 'lending', 'ethereum', '0xc3d688B66703497DAA19211EEdff47f25384cdc3', 'Algorithmic money markets for earning interest and borrowing', 2100000000.00, 23000000.00, 0.35, 'audited', '["ETH", "USDC", "WBTC", "LINK", "UNI"]', '{"interest_rate_model": "variable", "reserve_factor": 0.15}'),
('PancakeSwap V3', 'dex', 'binance_smart_chain', '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4', 'Leading DEX on Binance Smart Chain', 1800000000.00, 180000000.00, 0.4, 'audited', '["BNB", "BUSD", "USDT", "CAKE", "ETH"]', '{"swap_fee": 0.0025, "cake_rewards": true}'),
('Curve Finance', 'dex', 'ethereum', '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46', 'Decentralized exchange optimized for stablecoin trading', 3200000000.00, 85000000.00, 0.2, 'audited', '["USDC", "USDT", "DAI", "FRAX", "LUSD"]', '{"base_fee": 0.0004, "admin_fee": 0.5}'),
('Yearn Finance', 'yield_farming', 'ethereum', '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804', 'Yield optimization protocol with automated strategies', 650000000.00, 5000000.00, 0.45, 'audited', '["ETH", "USDC", "USDT", "WBTC", "DAI"]', '{"management_fee": 0.02, "performance_fee": 0.2}')
ON CONFLICT (protocol_name) DO UPDATE SET
  protocol_type = EXCLUDED.protocol_type,
  blockchain = EXCLUDED.blockchain,
  contract_address = EXCLUDED.contract_address,
  description = EXCLUDED.description,
  tvl_usd = EXCLUDED.tvl_usd,
  volume_24h_usd = EXCLUDED.volume_24h_usd,
  risk_score = EXCLUDED.risk_score,
  audit_status = EXCLUDED.audit_status,
  supported_tokens = EXCLUDED.supported_tokens,
  fee_structure = EXCLUDED.fee_structure,
  updated_at = NOW();

-- Insert popular yield farming opportunities
INSERT INTO yield_farming_opportunities (protocol_id, pool_name, pool_address, token_pair, apy_base, apy_reward, apy_total, tvl_usd, risk_level, reward_tokens, minimum_deposit_usd) 
SELECT 
  p.id,
  'ETH/USDC Pool',
  '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  'ETH/USDC',
  8.50,
  12.30,
  20.80,
  125000000.00,
  'medium',
  '["UNI"]',
  100.00
FROM defi_protocols p WHERE p.protocol_name = 'Uniswap V3'
UNION ALL
SELECT 
  p.id,
  'USDC Lending Pool',
  '0xBcca60bB61934080951369a648Fb03DF4F96263C',
  'USDC',
  4.25,
  2.10,
  6.35,
  890000000.00,
  'low',
  '["AAVE"]',
  50.00
FROM defi_protocols p WHERE p.protocol_name = 'Aave V3'
UNION ALL
SELECT 
  p.id,
  'yvUSDC Vault',
  '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
  'USDC',
  6.80,
  4.20,
  11.00,
  45000000.00,
  'low',
  '["YFI"]',
  200.00
FROM defi_protocols p WHERE p.protocol_name = 'Yearn Finance'
ON CONFLICT (protocol_id, pool_address) DO NOTHING;

-- Insert cross-chain bridges
INSERT INTO cross_chain_bridges (bridge_name, source_chain, destination_chain, bridge_contract_address, tvl_usd, volume_24h_usd, fee_percent, supported_tokens, average_bridge_time_minutes, success_rate, security_score) VALUES
('Polygon Bridge', 'ethereum', 'polygon', '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77', 850000000.00, 25000000.00, 0.001, '["ETH", "USDC", "USDT", "WBTC", "DAI"]', 15, 0.9985, 0.85),
('Arbitrum Bridge', 'ethereum', 'arbitrum', '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', 1200000000.00, 45000000.00, 0.0005, '["ETH", "USDC", "USDT", "WBTC", "DAI", "LINK"]', 180, 0.9992, 0.90),
('Optimism Bridge', 'ethereum', 'optimism', '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1', 950000000.00, 35000000.00, 0.0008, '["ETH", "USDC", "USDT", "WBTC", "DAI"]', 420, 0.9988, 0.88),
('BSC Bridge', 'ethereum', 'binance_smart_chain', '0x3ee18B2214AFF97000D974cf647E7C347E8fa585', 650000000.00, 18000000.00, 0.002, '["ETH", "USDC", "USDT", "WBTC"]', 8, 0.9975, 0.75)
ON CONFLICT (bridge_name, source_chain, destination_chain) DO UPDATE SET
  tvl_usd = EXCLUDED.tvl_usd,
  volume_24h_usd = EXCLUDED.volume_24h_usd,
  fee_percent = EXCLUDED.fee_percent,
  supported_tokens = EXCLUDED.supported_tokens,
  average_bridge_time_minutes = EXCLUDED.average_bridge_time_minutes,
  success_rate = EXCLUDED.success_rate,
  security_score = EXCLUDED.security_score,
  updated_at = NOW();

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all DeFi tables
ALTER PUBLICATION supabase_realtime ADD TABLE defi_protocols;
ALTER PUBLICATION supabase_realtime ADD TABLE defi_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE defi_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE yield_farming_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE cross_chain_bridges;
ALTER PUBLICATION supabase_realtime ADD TABLE bridge_transactions;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update DeFi position metrics
CREATE OR REPLACE FUNCTION update_defi_position_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate impermanent loss and update current prices
  IF TG_OP = 'UPDATE' AND NEW.current_price_usd IS NOT NULL THEN
    -- Calculate impermanent loss based on price movement
    IF NEW.entry_price_usd > 0 THEN
      NEW.impermanent_loss_usd := NEW.position_size_usd * 
        ABS(1 - SQRT(NEW.current_price_usd / NEW.entry_price_usd));
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for DeFi position updates
CREATE TRIGGER update_defi_position_metrics_trigger
  BEFORE UPDATE ON defi_positions
  FOR EACH ROW EXECUTE FUNCTION update_defi_position_metrics();

-- Function to update protocol metrics from transactions
CREATE OR REPLACE FUNCTION update_protocol_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update protocol volume and fees when new transaction is added
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE defi_protocols
    SET 
      volume_24h_usd = volume_24h_usd + NEW.amount_in_usd,
      fees_24h_usd = fees_24h_usd + NEW.protocol_fee_usd,
      updated_at = NOW()
    WHERE id = NEW.protocol_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for protocol metrics updates
CREATE TRIGGER update_protocol_metrics_trigger
  AFTER INSERT ON defi_transactions
  FOR EACH ROW EXECUTE FUNCTION update_protocol_metrics();

-- Add triggers for updated_at columns
CREATE TRIGGER update_defi_protocols_updated_at BEFORE UPDATE ON defi_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defi_positions_updated_at BEFORE UPDATE ON defi_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_yield_farming_opportunities_updated_at BEFORE UPDATE ON yield_farming_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cross_chain_bridges_updated_at BEFORE UPDATE ON cross_chain_bridges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bridge_transactions_updated_at BEFORE UPDATE ON bridge_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'DeFi Integration Migration completed successfully!';
  RAISE NOTICE 'Tables created: defi_protocols, defi_positions, defi_transactions';
  RAISE NOTICE 'Tables created: yield_farming_opportunities, cross_chain_bridges, bridge_transactions';
  RAISE NOTICE 'Sample data inserted for popular DeFi protocols and yield farms';
  RAISE NOTICE 'Cross-chain bridge configurations added for major networks';
  RAISE NOTICE 'Real-time position tracking and metrics calculation enabled';
  RAISE NOTICE 'Realtime subscriptions enabled for all DeFi tables';
  RAISE NOTICE 'DeFi dashboard ready for multi-protocol integration!';
END $$;