-- Complete Dashboard Schema for Production Functionality
-- This migration creates all necessary tables for the trading dashboard

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- Create storage bucket for agent files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-files', 'agent-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to agent files bucket
CREATE POLICY "Public read access for agent files" ON storage.objects
FOR SELECT USING (bucket_id = 'agent-files');

-- Allow authenticated users to upload agent files
CREATE POLICY "Authenticated users can upload agent files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'agent-files' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete own agent files" ON storage.objects
FOR DELETE USING (bucket_id = 'agent-files');

-- =====================================
-- AGENTS AND AI SYSTEM TABLES
-- =====================================

-- Main agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY DEFAULT 'agent_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'trading',
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused', 'error')),
    personality JSONB DEFAULT '{}',
    strategies TEXT[] DEFAULT ARRAY[]::TEXT[],
    paper_balance DECIMAL(15,2) DEFAULT 100.00,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    trades_count INTEGER DEFAULT 0,
    risk_tolerance DECIMAL(3,2) DEFAULT 0.50 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
    max_position_size DECIMAL(5,2) DEFAULT 10.00,
    llm_provider TEXT DEFAULT 'openai',
    llm_model TEXT DEFAULT 'gpt-4',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent decisions and reasoning log
CREATE TABLE IF NOT EXISTS agent_decisions (
    id TEXT PRIMARY KEY DEFAULT 'decision_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('trade', 'hold', 'rebalance', 'analysis', 'risk_check')),
    symbol TEXT,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    market_data JSONB DEFAULT '{}',
    action_taken BOOLEAN DEFAULT false,
    result JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent file management
CREATE TABLE IF NOT EXISTS agent_files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    agent_ingested BOOLEAN DEFAULT false,
    ingested_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- PAPER TRADING SYSTEM TABLES
-- =====================================

-- Paper trading accounts for agents
CREATE TABLE IF NOT EXISTS agent_paper_accounts (
    id TEXT PRIMARY KEY DEFAULT 'paper_acc_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 100.00,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 100.00,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    realized_pnl DECIMAL(15,2) DEFAULT 0.00,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0.00,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, account_name)
);

-- Paper trading orders and executions
CREATE TABLE IF NOT EXISTS agent_paper_trades (
    id TEXT PRIMARY KEY DEFAULT 'trade_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES agent_paper_accounts(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type TEXT NOT NULL DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    executed_price DECIMAL(15,8),
    executed_quantity DECIMAL(15,8) DEFAULT 0,
    executed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'filled', 'cancelled', 'rejected')),
    strategy TEXT,
    reasoning TEXT,
    pnl DECIMAL(15,2) DEFAULT 0.00,
    commission DECIMAL(15,2) DEFAULT 0.00,
    market_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent portfolio positions (paper trading)
CREATE TABLE IF NOT EXISTS agent_portfolios (
    id TEXT PRIMARY KEY DEFAULT 'position_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES agent_paper_accounts(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    quantity DECIMAL(15,8) NOT NULL DEFAULT 0,
    avg_price DECIMAL(15,8) NOT NULL DEFAULT 0,
    current_price DECIMAL(15,8) DEFAULT 0,
    market_value DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    realized_pnl DECIMAL(15,2) DEFAULT 0,
    last_trade_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, account_id, symbol)
);

-- =====================================
-- MARKET DATA AND ANALYTICS TABLES
-- =====================================

-- Market data cache
CREATE TABLE IF NOT EXISTS market_data (
    id TEXT PRIMARY KEY DEFAULT 'market_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    symbol TEXT NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    volume DECIMAL(20,8) DEFAULT 0,
    change_24h DECIMAL(8,4) DEFAULT 0,
    change_percent_24h DECIMAL(8,4) DEFAULT 0,
    market_cap DECIMAL(20,2),
    data_source TEXT NOT NULL,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, data_source, DATE(created_at))
);

-- Trading strategies and performance
CREATE TABLE IF NOT EXISTS trading_strategies (
    id TEXT PRIMARY KEY DEFAULT 'strategy_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    strategy_type TEXT NOT NULL CHECK (strategy_type IN ('momentum', 'mean_reversion', 'arbitrage', 'ml_prediction', 'custom')),
    parameters JSONB DEFAULT '{}',
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    performance_metrics JSONB DEFAULT '{}',
    backtest_results JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- SYSTEM MONITORING AND LOGS TABLES
-- =====================================

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id TEXT PRIMARY KEY DEFAULT 'metric_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value DECIMAL(15,8) NOT NULL,
    unit TEXT,
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application logs
CREATE TABLE IF NOT EXISTS app_logs (
    id TEXT PRIMARY KEY DEFAULT 'log_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    component TEXT,
    agent_id TEXT REFERENCES agents(id),
    context JSONB DEFAULT '{}',
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time events for WebSocket streaming
CREATE TABLE IF NOT EXISTS realtime_events (
    id TEXT PRIMARY KEY DEFAULT 'event_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    payload JSONB NOT NULL,
    agent_id TEXT REFERENCES agents(id),
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- PORTFOLIO AND WALLET TABLES
-- =====================================

-- Master wallet for live trading
CREATE TABLE IF NOT EXISTS master_wallet (
    id TEXT PRIMARY KEY DEFAULT 'wallet_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    wallet_name TEXT NOT NULL UNIQUE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('paper', 'testnet', 'mainnet')),
    exchange TEXT NOT NULL,
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    total_balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2) DEFAULT 0.00,
    locked_balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet balances by asset
CREATE TABLE IF NOT EXISTS wallet_balances (
    id TEXT PRIMARY KEY DEFAULT 'balance_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    wallet_id TEXT NOT NULL REFERENCES master_wallet(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    total_balance DECIMAL(15,8) DEFAULT 0,
    available_balance DECIMAL(15,8) DEFAULT 0,
    locked_balance DECIMAL(15,8) DEFAULT 0,
    usd_value DECIMAL(15,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, symbol)
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Agent-related indexes
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created_at ON agent_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_type ON agent_decisions(decision_type);

-- Paper trading indexes
CREATE INDEX IF NOT EXISTS idx_paper_trades_agent_id ON agent_paper_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON agent_paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON agent_paper_trades(status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_created_at ON agent_paper_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_agent_id ON agent_portfolios(agent_id);

-- Market data indexes
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_created_at ON market_data(created_at DESC);

-- System monitoring indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON system_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_component ON app_logs(component);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);

-- =====================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_files_updated_at ON agent_files;
CREATE TRIGGER update_agent_files_updated_at BEFORE UPDATE ON agent_files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_paper_accounts_updated_at ON agent_paper_accounts;
CREATE TRIGGER update_paper_accounts_updated_at BEFORE UPDATE ON agent_paper_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_paper_trades_updated_at ON agent_paper_trades;
CREATE TRIGGER update_paper_trades_updated_at BEFORE UPDATE ON agent_paper_trades
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON agent_portfolios;
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON agent_portfolios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategies_updated_at ON trading_strategies;
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON trading_strategies
FOR EACH ROW EXECUTE FUNCTION update_strategies_updated_at_column();

DROP TRIGGER IF EXISTS update_master_wallet_updated_at ON master_wallet;
CREATE TRIGGER update_master_wallet_updated_at BEFORE UPDATE ON master_wallet
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- INITIAL DATA SEEDING
-- =====================================

-- Insert default trading strategies
INSERT INTO trading_strategies (name, description, strategy_type, parameters, risk_level) VALUES
('Moving Average Crossover', 'Buy when short MA crosses above long MA, sell when it crosses below', 'momentum', '{"short_period": 20, "long_period": 50}', 'medium'),
('RSI Mean Reversion', 'Buy when RSI < 30, sell when RSI > 70', 'mean_reversion', '{"period": 14, "oversold": 30, "overbought": 70}', 'low'),
('Bollinger Bands', 'Trade on bollinger band breakouts and mean reversion', 'mean_reversion', '{"period": 20, "std_dev": 2}', 'medium'),
('Momentum Scanner', 'Identify and trade momentum breakouts', 'momentum', '{"volume_threshold": 1.5, "price_change": 5}', 'high')
ON CONFLICT (name) DO NOTHING;

-- Insert default agent with paper trading account
INSERT INTO agents (name, type, status, personality, strategies, paper_balance) VALUES
('Alpha Trader', 'momentum_trader', 'inactive', 
 '{"risk_tolerance": 0.6, "aggression": 0.7, "patience": 0.4, "analysis_depth": "high"}',
 ARRAY['Moving Average Crossover', 'Momentum Scanner'], 
 100.00
)
ON CONFLICT (id) DO NOTHING;

-- Create paper trading account for the default agent
INSERT INTO agent_paper_accounts (agent_id, account_name, initial_balance, current_balance)
SELECT id, 'Primary Account', 100.00, 100.00 
FROM agents 
WHERE name = 'Alpha Trader'
ON CONFLICT (agent_id, account_name) DO NOTHING;

-- =====================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_paper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- Allow public read access for demo/development
CREATE POLICY "Public read access for agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Public write access for agents" ON agents FOR ALL USING (true);

CREATE POLICY "Public read access for decisions" ON agent_decisions FOR SELECT USING (true);
CREATE POLICY "Public write access for decisions" ON agent_decisions FOR ALL USING (true);

CREATE POLICY "Public read access for files" ON agent_files FOR SELECT USING (true);
CREATE POLICY "Public write access for files" ON agent_files FOR ALL USING (true);

CREATE POLICY "Public read access for paper accounts" ON agent_paper_accounts FOR SELECT USING (true);
CREATE POLICY "Public write access for paper accounts" ON agent_paper_accounts FOR ALL USING (true);

CREATE POLICY "Public read access for paper trades" ON agent_paper_trades FOR SELECT USING (true);
CREATE POLICY "Public write access for paper trades" ON agent_paper_trades FOR ALL USING (true);

CREATE POLICY "Public read access for portfolios" ON agent_portfolios FOR SELECT USING (true);
CREATE POLICY "Public write access for portfolios" ON agent_portfolios FOR ALL USING (true);

CREATE POLICY "Public read access for market data" ON market_data FOR SELECT USING (true);
CREATE POLICY "Public write access for market data" ON market_data FOR ALL USING (true);

CREATE POLICY "Public read access for strategies" ON trading_strategies FOR SELECT USING (true);
CREATE POLICY "Public write access for strategies" ON trading_strategies FOR ALL USING (true);

CREATE POLICY "Public read access for metrics" ON system_metrics FOR SELECT USING (true);
CREATE POLICY "Public write access for metrics" ON system_metrics FOR ALL USING (true);

CREATE POLICY "Public read access for logs" ON app_logs FOR SELECT USING (true);
CREATE POLICY "Public write access for logs" ON app_logs FOR ALL USING (true);

CREATE POLICY "Public read access for events" ON realtime_events FOR SELECT USING (true);
CREATE POLICY "Public write access for events" ON realtime_events FOR ALL USING (true);

CREATE POLICY "Public read access for wallets" ON master_wallet FOR SELECT USING (true);
CREATE POLICY "Public write access for wallets" ON master_wallet FOR ALL USING (true);

CREATE POLICY "Public read access for balances" ON wallet_balances FOR SELECT USING (true);
CREATE POLICY "Public write access for balances" ON wallet_balances FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;