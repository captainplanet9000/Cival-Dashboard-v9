-- Advanced Trading Platform Schema Migration
-- Created: December 17, 2025
-- Features: Watchlists, Multi-chain wallets, Flash loans, HyperLend, Profit tracking, USDT.D monitoring

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- WATCHLIST TABLES
-- =====================================================

-- User watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlist items
CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    exchange VARCHAR(50),
    target_price DECIMAL(20, 8),
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(watchlist_id, symbol)
);

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('above', 'below', 'change_percent')),
    target_price DECIMAL(20, 8),
    percentage_change DECIMAL(10, 4),
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent watchlist assignments
CREATE TABLE IF NOT EXISTS agent_watchlist_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    strategy VARCHAR(50),
    max_position_size DECIMAL(20, 8),
    max_trade_size DECIMAL(20, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, watchlist_id, symbol)
);

-- =====================================================
-- MULTI-CHAIN WALLET TABLES
-- =====================================================

-- Supported blockchain networks
CREATE TABLE IF NOT EXISTS blockchain_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    chain_id INTEGER,
    rpc_url TEXT,
    explorer_url TEXT,
    native_currency VARCHAR(10),
    is_testnet BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-chain wallet addresses
CREATE TABLE IF NOT EXISTS multichain_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    network_id UUID REFERENCES blockchain_networks(id),
    address VARCHAR(255) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('hot', 'hardware', 'exchange')),
    private_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, network_id, address)
);

-- Cross-chain token balances
CREATE TABLE IF NOT EXISTS multichain_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES multichain_wallets(id) ON DELETE CASCADE,
    token_address VARCHAR(255),
    token_symbol VARCHAR(20) NOT NULL,
    token_name VARCHAR(100),
    decimals INTEGER DEFAULT 18,
    balance DECIMAL(30, 18) NOT NULL DEFAULT 0,
    balance_usd DECIMAL(20, 8),
    is_native BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, token_address)
);

-- Cross-chain transactions
CREATE TABLE IF NOT EXISTS multichain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES multichain_wallets(id),
    tx_hash VARCHAR(255) NOT NULL,
    block_number BIGINT,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('send', 'receive', 'swap', 'bridge', 'stake', 'unstake')),
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    token_symbol VARCHAR(20),
    amount DECIMAL(30, 18),
    amount_usd DECIMAL(20, 8),
    gas_used DECIMAL(30, 18),
    gas_price DECIMAL(30, 18),
    gas_cost_usd DECIMAL(20, 8),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- FLASH LOAN TABLES
-- =====================================================

-- Flash loan protocols
CREATE TABLE IF NOT EXISTS flashloan_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    protocol_type VARCHAR(20) NOT NULL CHECK (protocol_type IN ('aave', 'uniswap', 'balancer', 'dydx', 'maker')),
    contract_address VARCHAR(255),
    fee_percentage DECIMAL(8, 6),
    max_loan_usd DECIMAL(20, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash loan transactions
CREATE TABLE IF NOT EXISTS flashloan_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    protocol_id UUID REFERENCES flashloan_protocols(id),
    strategy VARCHAR(50) NOT NULL,
    assets JSONB NOT NULL, -- Array of {symbol, amount, address}
    loan_amount_usd DECIMAL(20, 8),
    profit_usd DECIMAL(20, 8),
    gas_cost_usd DECIMAL(20, 8),
    fee_usd DECIMAL(20, 8),
    net_profit_usd DECIMAL(20, 8),
    tx_hash VARCHAR(255),
    block_number BIGINT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'reverted')),
    error_reason TEXT,
    execution_time_ms INTEGER,
    calldata TEXT,
    simulation_profit DECIMAL(20, 8),
    actual_profit DECIMAL(20, 8),
    slippage_percent DECIMAL(8, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Agent flash loan limits
CREATE TABLE IF NOT EXISTS agent_flashloan_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE,
    max_loan_usd DECIMAL(20, 8) DEFAULT 100000,
    daily_limit_usd DECIMAL(20, 8) DEFAULT 500000,
    max_gas_price_gwei DECIMAL(10, 2) DEFAULT 100,
    min_profit_threshold_usd DECIMAL(10, 2) DEFAULT 10,
    is_enabled BOOLEAN DEFAULT FALSE,
    success_rate DECIMAL(5, 2) DEFAULT 0,
    total_profit_usd DECIMAL(20, 8) DEFAULT 0,
    total_volume_usd DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash loan opportunities (cached)
CREATE TABLE IF NOT EXISTS flashloan_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    exchange_from VARCHAR(50),
    exchange_to VARCHAR(50),
    price_from DECIMAL(20, 8),
    price_to DECIMAL(20, 8),
    spread_percentage DECIMAL(8, 4),
    estimated_profit_usd DECIMAL(20, 8),
    min_trade_size_usd DECIMAL(20, 8),
    max_trade_size_usd DECIMAL(20, 8),
    gas_cost_estimate DECIMAL(20, 8),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HYPERLEND TABLES
-- =====================================================

-- HyperLend markets
CREATE TABLE IF NOT EXISTS hyperlend_markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    contract_address VARCHAR(255),
    decimals INTEGER DEFAULT 18,
    supply_rate_apr DECIMAL(8, 4),
    borrow_rate_apr DECIMAL(8, 4),
    total_supply DECIMAL(30, 18),
    total_borrow DECIMAL(30, 18),
    utilization_rate DECIMAL(8, 4),
    collateral_factor DECIMAL(8, 4),
    liquidation_threshold DECIMAL(8, 4),
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User lending positions
CREATE TABLE IF NOT EXISTS hyperlend_lending_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    market_id UUID REFERENCES hyperlend_markets(id),
    position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('supply', 'borrow')),
    amount DECIMAL(30, 18) NOT NULL,
    amount_usd DECIMAL(20, 8),
    interest_earned DECIMAL(30, 18) DEFAULT 0,
    interest_earned_usd DECIMAL(20, 8) DEFAULT 0,
    apr_at_entry DECIMAL(8, 4),
    health_factor DECIMAL(10, 4),
    liquidation_price DECIMAL(20, 8),
    is_active BOOLEAN DEFAULT TRUE,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- HyperLend transaction history
CREATE TABLE IF NOT EXISTS hyperlend_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    position_id UUID REFERENCES hyperlend_lending_positions(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('supply', 'withdraw', 'borrow', 'repay', 'liquidate')),
    amount DECIMAL(30, 18),
    amount_usd DECIMAL(20, 8),
    tx_hash VARCHAR(255),
    block_number BIGINT,
    gas_cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROFIT TRACKING TABLES
-- =====================================================

-- Daily profit tracking
CREATE TABLE IF NOT EXISTS daily_profits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    agent_id UUID,
    date DATE NOT NULL,
    strategy VARCHAR(50),
    gross_profit_usd DECIMAL(20, 8) DEFAULT 0,
    fees_usd DECIMAL(20, 8) DEFAULT 0,
    gas_costs_usd DECIMAL(20, 8) DEFAULT 0,
    net_profit_usd DECIMAL(20, 8) DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    volume_usd DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agent_id, date, strategy)
);

-- Profit goals and targets
CREATE TABLE IF NOT EXISTS profit_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    target_amount_usd DECIMAL(20, 8) NOT NULL,
    current_amount_usd DECIMAL(20, 8) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secured profits (withdrawn/saved)
CREATE TABLE IF NOT EXISTS secured_profits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('trading', 'lending', 'staking', 'arbitrage', 'flashloan')),
    amount_usd DECIMAL(20, 8) NOT NULL,
    secured_to VARCHAR(50), -- wallet address or account
    tx_hash VARCHAR(255),
    notes TEXT,
    secured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profit distribution rules
CREATE TABLE IF NOT EXISTS profit_distribution_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    trigger_amount_usd DECIMAL(20, 8),
    secure_percentage DECIMAL(5, 2), -- 0-100%
    destination_type VARCHAR(20) CHECK (destination_type IN ('wallet', 'savings', 'reinvest')),
    destination_address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USDT.D MONITORING TABLES
-- =====================================================

-- USDT.D index tracking
CREATE TABLE IF NOT EXISTS usdtd_index_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    index_value DECIMAL(10, 6) NOT NULL,
    change_24h DECIMAL(8, 4),
    change_7d DECIMAL(8, 4),
    volume_24h DECIMAL(20, 8),
    market_cap DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto correlation with USDT.D
CREATE TABLE IF NOT EXISTS usdtd_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    correlation_1h DECIMAL(6, 4),
    correlation_4h DECIMAL(6, 4),
    correlation_24h DECIMAL(6, 4),
    correlation_7d DECIMAL(6, 4),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol)
);

-- USDT.D trading signals
CREATE TABLE IF NOT EXISTS usdtd_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('long', 'short', 'neutral')),
    strength DECIMAL(3, 2), -- 0-1 scale
    usdtd_value DECIMAL(10, 6),
    trigger_reason TEXT,
    confidence DECIMAL(3, 2),
    recommended_symbols TEXT[], -- Array of symbols to trade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HIGH-FREQUENCY TRADING TABLES
-- =====================================================

-- HFT strategies and performance
CREATE TABLE IF NOT EXISTS hft_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL,
    symbols TEXT[] NOT NULL,
    parameters JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    max_position_size DECIMAL(20, 8),
    max_orders_per_second INTEGER DEFAULT 10,
    profit_target_bps INTEGER, -- basis points
    stop_loss_bps INTEGER,
    latency_threshold_ms INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HFT order execution log
CREATE TABLE IF NOT EXISTS hft_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID REFERENCES hft_strategies(id),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(30, 18),
    price DECIMAL(20, 8),
    order_id VARCHAR(255),
    execution_time_us BIGINT, -- microseconds
    latency_ms INTEGER,
    slippage_bps INTEGER,
    profit_loss_usd DECIMAL(20, 8),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Watchlist indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_symbol ON watchlist_items(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_symbol ON price_alerts(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_agent_watchlist_assignments_agent ON agent_watchlist_assignments(agent_id);

-- Multi-chain wallet indexes
CREATE INDEX IF NOT EXISTS idx_multichain_wallets_user_network ON multichain_wallets(user_id, network_id);
CREATE INDEX IF NOT EXISTS idx_multichain_balances_wallet ON multichain_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_multichain_transactions_wallet ON multichain_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_multichain_transactions_hash ON multichain_transactions(tx_hash);

-- Flash loan indexes
CREATE INDEX IF NOT EXISTS idx_flashloan_transactions_agent ON flashloan_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_flashloan_transactions_created ON flashloan_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashloan_opportunities_symbol ON flashloan_opportunities(symbol);
CREATE INDEX IF NOT EXISTS idx_flashloan_opportunities_active ON flashloan_opportunities(is_active, expires_at);

-- HyperLend indexes
CREATE INDEX IF NOT EXISTS idx_hyperlend_positions_user ON hyperlend_lending_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_hyperlend_positions_market ON hyperlend_lending_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_hyperlend_transactions_user ON hyperlend_transactions(user_id);

-- Profit tracking indexes
CREATE INDEX IF NOT EXISTS idx_daily_profits_user_date ON daily_profits(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_profits_agent_date ON daily_profits(agent_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_profit_goals_user_type ON profit_goals(user_id, goal_type);
CREATE INDEX IF NOT EXISTS idx_secured_profits_user ON secured_profits(user_id, secured_at DESC);

-- USDT.D indexes
CREATE INDEX IF NOT EXISTS idx_usdtd_index_timestamp ON usdtd_index_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usdtd_correlations_symbol ON usdtd_correlations(symbol);
CREATE INDEX IF NOT EXISTS idx_usdtd_signals_created ON usdtd_signals(created_at DESC);

-- HFT indexes
CREATE INDEX IF NOT EXISTS idx_hft_executions_strategy_time ON hft_executions(strategy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hft_executions_symbol_time ON hft_executions(symbol, created_at DESC);

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert supported blockchain networks
INSERT INTO blockchain_networks (name, chain_id, rpc_url, explorer_url, native_currency, is_testnet, is_active) VALUES
('Ethereum', 1, 'https://eth-mainnet.g.alchemy.com/v2/', 'https://etherscan.io', 'ETH', FALSE, TRUE),
('Polygon', 137, 'https://polygon-mainnet.g.alchemy.com/v2/', 'https://polygonscan.com', 'MATIC', FALSE, TRUE),
('BSC', 56, 'https://bsc-dataseed.binance.org', 'https://bscscan.com', 'BNB', FALSE, TRUE),
('Arbitrum', 42161, 'https://arb-mainnet.g.alchemy.com/v2/', 'https://arbiscan.io', 'ETH', FALSE, TRUE),
('Optimism', 10, 'https://opt-mainnet.g.alchemy.com/v2/', 'https://optimistic.etherscan.io', 'ETH', FALSE, TRUE),
('Solana', NULL, 'https://api.mainnet-beta.solana.com', 'https://explorer.solana.com', 'SOL', FALSE, TRUE),
('Sui', NULL, 'https://fullnode.mainnet.sui.io', 'https://explorer.sui.io', 'SUI', FALSE, TRUE),
('Sonic', NULL, 'https://rpc.sonic.network', 'https://explorer.sonic.network', 'SONIC', FALSE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert flash loan protocols
INSERT INTO flashloan_protocols (name, protocol_type, fee_percentage, max_loan_usd, is_active) VALUES
('Aave V3', 'aave', 0.0005, 2000000000, TRUE),
('Uniswap V3', 'uniswap', 0.0000, 1000000000, TRUE),
('Balancer V2', 'balancer', 0.0000, 500000000, TRUE),
('dYdX', 'dydx', 0.0000, 100000000, TRUE),
('MakerDAO', 'maker', 0.0000, 500000000, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert HyperLend markets (sample data)
INSERT INTO hyperlend_markets (symbol, supply_rate_apr, borrow_rate_apr, collateral_factor, liquidation_threshold, is_active) VALUES
('USDC', 4.50, 6.80, 0.85, 0.90, TRUE),
('ETH', 3.20, 5.40, 0.80, 0.85, TRUE),
('BTC', 2.80, 4.20, 0.75, 0.80, TRUE),
('WMATIC', 8.20, 12.50, 0.70, 0.75, TRUE)
ON CONFLICT (symbol) DO NOTHING;

-- Insert sample HFT strategies
INSERT INTO hft_strategies (name, strategy_type, symbols, parameters, max_position_size, profit_target_bps, stop_loss_bps) VALUES
('Market Making BTC/USDC', 'market_making', ARRAY['BTC'], '{"spread_bps": 5, "inventory_limit": 0.1}', 50000, 10, 20),
('Arbitrage ETH Cross-Exchange', 'arbitrage', ARRAY['ETH'], '{"min_spread_bps": 3, "max_execution_time_ms": 500}', 25000, 8, 15),
('Momentum BTC/ETH', 'momentum', ARRAY['BTC', 'ETH'], '{"lookback_minutes": 5, "momentum_threshold": 0.002}', 30000, 15, 25)
ON CONFLICT DO NOTHING;

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'watchlists', 'watchlist_items', 'price_alerts', 'agent_watchlist_assignments',
        'multichain_wallets', 'agent_flashloan_limits', 'hyperlend_lending_positions',
        'daily_profits', 'profit_goals', 'profit_distribution_rules', 'hft_strategies'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS tr_%s_updated_at ON %s;
            CREATE TRIGGER tr_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- Grant permissions (adjust as needed for your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;