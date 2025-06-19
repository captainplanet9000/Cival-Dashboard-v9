-- SAFE MINIMAL SETUP - Only creates what's absolutely needed
-- This script is designed to work with your existing tables

-- 1. Create the new tables we need (without foreign keys to avoid conflicts)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,  -- No foreign key constraint
    agent_id UUID, -- No foreign key constraint
    strategy_id UUID, -- No foreign key constraint
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    stop_price DECIMAL(20,8),
    status VARCHAR(20) DEFAULT 'pending',
    filled_quantity DECIMAL(20,8) DEFAULT 0,
    average_fill_price DECIMAL(20,8),
    exchange VARCHAR(50),
    exchange_order_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- No foreign key constraint
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID, -- No foreign key constraint (references wallets)
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(20,8) NOT NULL,
    timeframe VARCHAR(20),
    confidence_level DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS exchange_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- No foreign key constraint
    exchange_name VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    passphrase_encrypted TEXT,
    testnet BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{"spot": true, "futures": false, "margin": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_connected_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID, -- No foreign key constraint
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(20,8) NOT NULL,
    final_capital DECIMAL(20,8) NOT NULL,
    total_return DECIMAL(10,4),
    sharpe_ratio DECIMAL(10,4),
    max_drawdown DECIMAL(10,4),
    win_rate DECIMAL(5,2),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    avg_win DECIMAL(20,8),
    avg_loss DECIMAL(20,8),
    profit_factor DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parameters JSONB DEFAULT '{}'::jsonb,
    trade_log JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- No foreign key constraint
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_metrics_portfolio_id ON risk_metrics(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_type ON risk_metrics(metric_type);

-- 3. Enable real-time subscriptions
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE risk_metrics REPLICA IDENTITY FULL;

-- 4. Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Add update triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exchange_connections_updated_at ON exchange_connections;
CREATE TRIGGER update_exchange_connections_updated_at 
    BEFORE UPDATE ON exchange_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Create a simple user for testing (only if users table exists and has required columns)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email' AND table_schema = 'public'
    ) THEN
        INSERT INTO users (email, role, created_at)
        VALUES ('admin@cival.trading', 'admin', NOW())
        ON CONFLICT (email) DO NOTHING;
        
        RAISE NOTICE 'Default user created/verified';
    ELSE
        RAISE NOTICE 'Users table not ready - skipping user creation';
    END IF;
END $$;

-- 7. Add some basic test data to the new tables
INSERT INTO alerts (
    user_id, alert_type, severity, title, message, source
) VALUES 
    (NULL, 'system', 'info', 'Database Setup Complete', 'Trading tables have been created successfully', 'setup_script'),
    (NULL, 'system', 'info', 'Ready for Trading', 'Dashboard is now ready for trading operations', 'setup_script')
ON CONFLICT (id) DO NOTHING;

-- 8. Add sample market data if the table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'market_data' AND table_schema = 'public'
    ) THEN
        INSERT INTO market_data (symbol, price, volume, timestamp)
        VALUES 
            ('BTC/USDT', 45000.00, 1000000.00, NOW() - INTERVAL '5 minutes'),
            ('BTC/USDT', 45100.00, 1100000.00, NOW() - INTERVAL '4 minutes'),
            ('BTC/USDT', 45050.00, 950000.00, NOW() - INTERVAL '3 minutes'),
            ('BTC/USDT', 45150.00, 1200000.00, NOW() - INTERVAL '2 minutes'),
            ('BTC/USDT', 45200.00, 1050000.00, NOW() - INTERVAL '1 minute'),
            ('BTC/USDT', 45250.00, 1150000.00, NOW()),
            ('ETH/USDT', 2400.00, 500000.00, NOW() - INTERVAL '5 minutes'),
            ('ETH/USDT', 2410.00, 520000.00, NOW() - INTERVAL '4 minutes'),
            ('ETH/USDT', 2405.00, 480000.00, NOW() - INTERVAL '3 minutes'),
            ('ETH/USDT', 2415.00, 550000.00, NOW() - INTERVAL '2 minutes'),
            ('ETH/USDT', 2420.00, 510000.00, NOW() - INTERVAL '1 minute'),
            ('ETH/USDT', 2425.00, 530000.00, NOW());
            
        RAISE NOTICE 'Sample market data added';
    ELSE
        RAISE NOTICE 'Market data table not found - skipping';
    END IF;
END $$;

-- 9. Verify what we created
SELECT 'Setup completed successfully! Created tables:' as message;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('orders', 'alerts', 'risk_metrics', 'exchange_connections', 'backtest_results', 'audit_logs')
ORDER BY t.table_name;