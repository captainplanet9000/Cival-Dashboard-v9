-- Real Wallet and Agent Integration Migration
-- Adds tables for real blockchain wallets and enhanced agent features

-- Master wallets table for real blockchain wallet management
CREATE TABLE IF NOT EXISTS master_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL UNIQUE,
    private_key_encrypted TEXT NOT NULL, -- Encrypted private key
    chain TEXT NOT NULL CHECK (chain IN ('ethereum', 'arbitrum')),
    network TEXT NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    balance_eth DECIMAL(36,18) DEFAULT 0,
    balance_usdc DECIMAL(36,6) DEFAULT 0,
    balance_usdt DECIMAL(36,6) DEFAULT 0,
    balance_dai DECIMAL(36,6) DEFAULT 0,
    balance_wbtc DECIMAL(36,8) DEFAULT 0,
    total_deposited DECIMAL(36,6) DEFAULT 0,
    total_withdrawn DECIMAL(36,6) DEFAULT 0,
    allocated_funds DECIMAL(36,6) DEFAULT 0,
    available_funds DECIMAL(36,6) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funding transactions for master wallet operations
CREATE TABLE IF NOT EXISTS master_wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_wallet_id UUID REFERENCES master_wallets(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw', 'allocate', 'deallocate')),
    amount DECIMAL(36,6) NOT NULL,
    token TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    gas_used BIGINT,
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Agent allocations from master wallets
CREATE TABLE IF NOT EXISTS agent_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    master_wallet_id UUID REFERENCES master_wallets(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(36,6) NOT NULL,
    allocated_tokens JSONB DEFAULT '{}', -- Token breakdown
    performance_multiplier DECIMAL(10,4) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real agent wallets for blockchain integration
CREATE TABLE IF NOT EXISTS real_agent_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    address TEXT NOT NULL UNIQUE,
    private_key_encrypted TEXT NOT NULL, -- Encrypted private key
    chain TEXT NOT NULL CHECK (chain IN ('ethereum', 'arbitrum')),
    network TEXT NOT NULL CHECK (network IN ('mainnet', 'testnet')),
    balance_eth DECIMAL(36,18) DEFAULT 0,
    balance_usdc DECIMAL(36,6) DEFAULT 0,
    balance_usdt DECIMAL(36,6) DEFAULT 0,
    balance_dai DECIMAL(36,6) DEFAULT 0,
    balance_wbtc DECIMAL(36,8) DEFAULT 0,
    allocated_amount DECIMAL(36,6) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent wallet configuration
CREATE TABLE IF NOT EXISTS agent_wallet_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL UNIQUE,
    agent_name TEXT NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('trading', 'arbitrage', 'liquidity', 'yield_farming')),
    chains TEXT[] DEFAULT ARRAY['ethereum'], -- Supported chains
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    max_trade_size DECIMAL(36,6) DEFAULT 1000,
    allowed_tokens TEXT[] DEFAULT ARRAY['USDC', 'USDT', 'ETH', 'WBTC'],
    trading_strategy TEXT,
    auto_trading BOOLEAN DEFAULT false,
    use_real_wallets BOOLEAN DEFAULT false, -- Use real vs testnet wallets
    master_wallet_allocation DECIMAL(36,6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent trades tracking for both real and testnet
CREATE TABLE IF NOT EXISTS agent_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    wallet_id TEXT NOT NULL, -- Can reference real_agent_wallets or testnet wallets
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('real', 'testnet')),
    trade_type TEXT NOT NULL CHECK (trade_type IN ('swap', 'arbitrage', 'liquidity_add', 'liquidity_remove')),
    input_token TEXT NOT NULL,
    output_token TEXT NOT NULL,
    input_amount DECIMAL(36,18) NOT NULL,
    output_amount DECIMAL(36,18) NOT NULL,
    tx_hash TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    gas_used BIGINT DEFAULT 0,
    profit DECIMAL(36,6) DEFAULT 0,
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced market data quality tracking
CREATE TABLE IF NOT EXISTS market_data_quality (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    provider TEXT NOT NULL,
    quality_score TEXT NOT NULL CHECK (quality_score IN ('excellent', 'good', 'fair', 'poor')),
    data_age_seconds INTEGER NOT NULL,
    last_update TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(36,8),
    volume_24h DECIMAL(36,2),
    is_live_data BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet performance tracking
CREATE TABLE IF NOT EXISTS wallet_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('master', 'agent_real', 'agent_testnet')),
    performance_date DATE NOT NULL,
    total_value_usd DECIMAL(36,6) DEFAULT 0,
    daily_pnl DECIMAL(36,6) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    gas_spent_usd DECIMAL(36,6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, wallet_type, performance_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_wallets_chain_network ON master_wallets(chain, network);
CREATE INDEX IF NOT EXISTS idx_master_wallets_address ON master_wallets(address);
CREATE INDEX IF NOT EXISTS idx_master_wallet_transactions_wallet_id ON master_wallet_transactions(master_wallet_id);
CREATE INDEX IF NOT EXISTS idx_master_wallet_transactions_status ON master_wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_agent_allocations_agent_id ON agent_allocations(agent_id);
CREATE INDEX IF NOT EXISTS idx_real_agent_wallets_agent_id ON real_agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_real_agent_wallets_address ON real_agent_wallets(address);
CREATE INDEX IF NOT EXISTS idx_agent_wallet_configs_agent_id ON agent_wallet_configs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trades_agent_id ON agent_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trades_status ON agent_trades(status);
CREATE INDEX IF NOT EXISTS idx_market_data_quality_symbol ON market_data_quality(symbol);
CREATE INDEX IF NOT EXISTS idx_wallet_performance_wallet ON wallet_performance(wallet_id, wallet_type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_master_wallets_updated_at ON master_wallets;
CREATE TRIGGER update_master_wallets_updated_at
    BEFORE UPDATE ON master_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_allocations_updated_at ON agent_allocations;
CREATE TRIGGER update_agent_allocations_updated_at
    BEFORE UPDATE ON agent_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_real_agent_wallets_updated_at ON real_agent_wallets;
CREATE TRIGGER update_real_agent_wallets_updated_at
    BEFORE UPDATE ON real_agent_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_wallet_configs_updated_at ON agent_wallet_configs;
CREATE TRIGGER update_agent_wallet_configs_updated_at
    BEFORE UPDATE ON agent_wallet_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) if needed
ALTER TABLE master_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallet_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_performance ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for authenticated users - adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON master_wallets FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON master_wallet_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON agent_allocations FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON real_agent_wallets FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON agent_wallet_configs FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON agent_trades FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON market_data_quality FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON wallet_performance FOR ALL USING (true);

-- Insert some initial data for testing
INSERT INTO master_wallets (name, address, private_key_encrypted, chain, network) 
VALUES 
    ('Test Master Wallet', '0x742d35Cc6635C0532925a3b8D5c3FA7d0F261e4A', 'encrypted_key_placeholder', 'ethereum', 'testnet')
ON CONFLICT (address) DO NOTHING;

-- Migration complete
SELECT 'Real Wallet and Agent Integration Migration Completed Successfully' as result;