-- Enhanced Market Data Integration Migration
-- Adds tables for enhanced live market data tracking and quality monitoring

-- Enhanced market prices with quality tracking
CREATE TABLE IF NOT EXISTS enhanced_market_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    price DECIMAL(36,8) NOT NULL,
    change_24h DECIMAL(36,8) DEFAULT 0,
    change_percent_24h DECIMAL(10,4) DEFAULT 0,
    volume_24h DECIMAL(36,2) DEFAULT 0,
    high_24h DECIMAL(36,8) DEFAULT 0,
    low_24h DECIMAL(36,8) DEFAULT 0,
    open_24h DECIMAL(36,8) DEFAULT 0,
    market_cap DECIMAL(36,2),
    rank INTEGER,
    circulating_supply DECIMAL(36,8),
    total_supply DECIMAL(36,8),
    max_supply DECIMAL(36,8),
    ath DECIMAL(36,8), -- All time high
    ath_date TIMESTAMP WITH TIME ZONE,
    atl DECIMAL(36,8), -- All time low
    atl_date TIMESTAMP WITH TIME ZONE,
    source TEXT NOT NULL,
    data_quality TEXT NOT NULL CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor')),
    is_live_data BOOLEAN DEFAULT false,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data providers configuration
CREATE TABLE IF NOT EXISTS market_data_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('rest_api', 'websocket', 'webhook')),
    base_url TEXT,
    websocket_url TEXT,
    api_key_required BOOLEAN DEFAULT false,
    rate_limit_per_minute INTEGER DEFAULT 60,
    supported_symbols TEXT[] DEFAULT ARRAY['BTC/USD', 'ETH/USD'],
    priority INTEGER DEFAULT 1, -- Lower number = higher priority
    is_active BOOLEAN DEFAULT true,
    health_check_url TEXT,
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status TEXT CHECK (health_status IN ('healthy', 'degraded', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data requests tracking for rate limiting
CREATE TABLE IF NOT EXISTS market_data_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('price', 'ohlcv', 'orderbook', 'trades')),
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    rate_limited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WebSocket connections tracking
CREATE TABLE IF NOT EXISTS websocket_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL,
    connection_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('connecting', 'connected', 'disconnected', 'error')),
    subscribed_symbols TEXT[] DEFAULT ARRAY[],
    last_message_at TIMESTAMP WITH TIME ZONE,
    reconnect_attempts INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading signals from market data analysis
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
    strength INTEGER CHECK (strength >= 0 AND strength <= 100),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    source TEXT NOT NULL, -- Strategy or analysis source
    reasoning TEXT,
    price_target DECIMAL(36,8),
    stop_loss DECIMAL(36,8),
    take_profit DECIMAL(36,8),
    timeframe TEXT DEFAULT '1h',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market conditions tracking
CREATE TABLE IF NOT EXISTS market_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('bull_market', 'bear_market', 'sideways', 'high_volatility', 'low_volatility')),
    symbol TEXT,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT,
    indicators JSONB DEFAULT '{}', -- Technical indicators supporting this condition
    duration_hours INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Market news and sentiment
CREATE TABLE IF NOT EXISTS market_news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    source TEXT NOT NULL,
    symbols TEXT[] DEFAULT ARRAY[], -- Related symbols
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical indicators cache
CREATE TABLE IF NOT EXISTS technical_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL DEFAULT '1h',
    indicator_type TEXT NOT NULL, -- RSI, MACD, SMA, EMA, etc.
    value DECIMAL(36,8),
    additional_data JSONB DEFAULT '{}', -- For complex indicators like Bollinger Bands
    calculation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_market_prices_symbol ON enhanced_market_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_enhanced_market_prices_last_update ON enhanced_market_prices(last_update);
CREATE INDEX IF NOT EXISTS idx_enhanced_market_prices_quality ON enhanced_market_prices(data_quality);
CREATE INDEX IF NOT EXISTS idx_market_data_providers_active ON market_data_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_market_data_providers_priority ON market_data_providers(priority);
CREATE INDEX IF NOT EXISTS idx_market_data_requests_provider ON market_data_requests(provider_name);
CREATE INDEX IF NOT EXISTS idx_market_data_requests_created_at ON market_data_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_provider ON websocket_connections(provider_name);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_status ON websocket_connections(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_active ON trading_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_market_conditions_type ON market_conditions(condition_type);
CREATE INDEX IF NOT EXISTS idx_market_conditions_active ON market_conditions(is_active);
CREATE INDEX IF NOT EXISTS idx_market_news_symbols ON market_news USING GIN(symbols);
CREATE INDEX IF NOT EXISTS idx_market_news_published_at ON market_news(published_at);
CREATE INDEX IF NOT EXISTS idx_technical_indicators_symbol_type ON technical_indicators(symbol, indicator_type);
CREATE INDEX IF NOT EXISTS idx_technical_indicators_timestamp ON technical_indicators(calculation_timestamp);

-- Create updated_at triggers for relevant tables
DROP TRIGGER IF EXISTS update_market_data_providers_updated_at ON market_data_providers;
CREATE TRIGGER update_market_data_providers_updated_at
    BEFORE UPDATE ON market_data_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_websocket_connections_updated_at ON websocket_connections;
CREATE TRIGGER update_websocket_connections_updated_at
    BEFORE UPDATE ON websocket_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE enhanced_market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_indicators ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON enhanced_market_prices FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON market_data_providers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON market_data_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON websocket_connections FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON trading_signals FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON market_conditions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON market_news FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON technical_indicators FOR ALL USING (true);

-- Insert initial market data providers
INSERT INTO market_data_providers (name, type, base_url, websocket_url, api_key_required, priority, supported_symbols) VALUES
    ('Binance', 'websocket', 'https://api.binance.com', 'wss://stream.binance.com:9443', false, 1, ARRAY['BTC/USD', 'ETH/USD', 'SOL/USD']),
    ('Coinbase', 'websocket', 'https://api.exchange.coinbase.com', 'wss://ws-feed.exchange.coinbase.com', false, 2, ARRAY['BTC/USD', 'ETH/USD']),
    ('CoinMarketCap', 'rest_api', 'https://pro-api.coinmarketcap.com', null, true, 3, ARRAY['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD']),
    ('CoinAPI', 'rest_api', 'https://rest.coinapi.io', null, true, 4, ARRAY['BTC/USD', 'ETH/USD']),
    ('Alpha Vantage', 'rest_api', 'https://www.alphavantage.co', null, true, 5, ARRAY['AAPL', 'TSLA', 'MSFT', 'NVDA'])
ON CONFLICT (name) DO NOTHING;

-- Insert some sample market data
INSERT INTO enhanced_market_prices (symbol, price, change_24h, change_percent_24h, volume_24h, source, data_quality, is_live_data) VALUES
    ('BTC/USD', 117234.50, 2156.30, 1.87, 28500000000, 'binance', 'excellent', true),
    ('ETH/USD', 3545.67, 89.23, 2.58, 15200000000, 'binance', 'excellent', true),
    ('SOL/USD', 245.89, -9.45, -3.70, 2800000000, 'binance', 'good', true),
    ('AAPL', 225.50, 3.25, 1.46, 45000000, 'alpha_vantage', 'good', false),
    ('TSLA', 389.75, -8.90, -2.23, 92000000, 'alpha_vantage', 'good', false)
ON CONFLICT DO NOTHING;

-- Create a view for latest market prices
CREATE OR REPLACE VIEW latest_market_prices AS
SELECT DISTINCT ON (symbol) 
    symbol,
    price,
    change_24h,
    change_percent_24h,
    volume_24h,
    high_24h,
    low_24h,
    source,
    data_quality,
    is_live_data,
    last_update
FROM enhanced_market_prices
ORDER BY symbol, last_update DESC;

-- Migration complete
SELECT 'Enhanced Market Data Integration Migration Completed Successfully' as result;