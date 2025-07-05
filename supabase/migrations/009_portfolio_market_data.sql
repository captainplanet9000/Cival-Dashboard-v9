-- Migration 009: Portfolio Management and Market Data Tables
-- This migration creates tables for portfolio tracking and market data storage

-- Portfolio management
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'trading' CHECK (type IN ('trading', 'paper', 'backtest', 'demo')),
    initial_balance DECIMAL(18,8) DEFAULT 100000,
    current_balance DECIMAL(18,8),
    currency VARCHAR(10) DEFAULT 'USD',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio positions tracking
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    avg_cost DECIMAL(18,8) NOT NULL,
    current_price DECIMAL(18,8),
    market_value DECIMAL(18,8),
    unrealized_pnl DECIMAL(18,8),
    realized_pnl DECIMAL(18,8) DEFAULT 0,
    position_type VARCHAR(20) DEFAULT 'long' CHECK (position_type IN ('long', 'short')),
    exchange VARCHAR(50) DEFAULT 'binance',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio performance history
CREATE TABLE IF NOT EXISTS public.portfolio_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    total_value DECIMAL(18,8) NOT NULL,
    cash_balance DECIMAL(18,8) NOT NULL,
    positions_value DECIMAL(18,8) NOT NULL,
    daily_pnl DECIMAL(18,8),
    total_pnl DECIMAL(18,8),
    daily_return DECIMAL(8,6),
    total_return DECIMAL(8,6),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    win_rate DECIMAL(5,4),
    metrics JSONB DEFAULT '{}'
);

-- Market data OHLCV storage
CREATE TABLE IF NOT EXISTS public.market_data_ohlcv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL,
    exchange VARCHAR(50) DEFAULT 'binance',
    timeframe VARCHAR(10) NOT NULL CHECK (timeframe IN ('1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M')),
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(18,8) NOT NULL,
    high DECIMAL(18,8) NOT NULL,
    low DECIMAL(18,8) NOT NULL,
    close DECIMAL(18,8) NOT NULL,
    volume DECIMAL(18,8) NOT NULL,
    quote_volume DECIMAL(18,8),
    trades_count INTEGER,
    taker_buy_volume DECIMAL(18,8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, exchange, timeframe, timestamp)
);

-- Real-time market data
CREATE TABLE IF NOT EXISTS public.market_data_live (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL,
    exchange VARCHAR(50) DEFAULT 'binance',
    price DECIMAL(18,8) NOT NULL,
    bid DECIMAL(18,8),
    ask DECIMAL(18,8),
    bid_size DECIMAL(18,8),
    ask_size DECIMAL(18,8),
    volume_24h DECIMAL(18,8),
    high_24h DECIMAL(18,8),
    low_24h DECIMAL(18,8),
    change_24h DECIMAL(8,4),
    change_percent_24h DECIMAL(8,4),
    last_update TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, exchange)
);

-- Technical indicators cache
CREATE TABLE IF NOT EXISTS public.technical_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    indicator_name VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    values JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, timeframe, indicator_name, timestamp)
);

-- Market events and news sentiment
CREATE TABLE IF NOT EXISTS public.market_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('news', 'earnings', 'economic', 'technical', 'social')),
    symbol VARCHAR(50),
    title TEXT NOT NULL,
    description TEXT,
    sentiment_score DECIMAL(5,4) DEFAULT 0, -- -1 to 1
    impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    source VARCHAR(100),
    source_url TEXT,
    event_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_portfolio_positions_portfolio ON portfolio_positions(portfolio_id);
CREATE INDEX idx_portfolio_positions_symbol ON portfolio_positions(portfolio_id, symbol) WHERE closed_at IS NULL;
CREATE INDEX idx_portfolio_performance_time ON portfolio_performance(portfolio_id, timestamp DESC);
CREATE INDEX idx_market_data_ohlcv_lookup ON market_data_ohlcv(symbol, timeframe, timestamp DESC);
CREATE INDEX idx_market_data_live_symbol ON market_data_live(symbol);
CREATE INDEX idx_technical_indicators_lookup ON technical_indicators(symbol, timeframe, indicator_name, timestamp DESC);
CREATE INDEX idx_market_events_time ON market_events(event_time DESC);
CREATE INDEX idx_market_events_symbol ON market_events(symbol, event_time DESC) WHERE symbol IS NOT NULL;

-- Create hypertable for time-series data if using TimescaleDB
-- SELECT create_hypertable('market_data_ohlcv', 'timestamp', chunk_time_interval => INTERVAL '1 week');
-- SELECT create_hypertable('portfolio_performance', 'timestamp', chunk_time_interval => INTERVAL '1 month');

-- Create updated_at triggers
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_positions_updated_at BEFORE UPDATE ON portfolio_positions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own portfolios" ON portfolios
    FOR ALL USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their portfolio positions" ON portfolio_positions
    FOR SELECT USING (
        portfolio_id IN (SELECT id FROM portfolios WHERE created_by = auth.uid() OR created_by IS NULL)
    );

CREATE POLICY "Users can view their portfolio performance" ON portfolio_performance
    FOR SELECT USING (
        portfolio_id IN (SELECT id FROM portfolios WHERE created_by = auth.uid() OR created_by IS NULL)
    );

-- Public access for market data
CREATE POLICY "Market data is public" ON market_data_ohlcv
    FOR SELECT USING (true);

CREATE POLICY "Live market data is public" ON market_data_live
    FOR SELECT USING (true);

CREATE POLICY "Technical indicators are public" ON technical_indicators
    FOR SELECT USING (true);

CREATE POLICY "Market events are public" ON market_events
    FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE portfolios IS 'Portfolio containers for tracking trading performance';
COMMENT ON TABLE portfolio_positions IS 'Current and historical positions within portfolios';
COMMENT ON TABLE portfolio_performance IS 'Time-series performance metrics for portfolios';
COMMENT ON TABLE market_data_ohlcv IS 'Historical OHLCV candlestick data for all trading pairs';
COMMENT ON TABLE market_data_live IS 'Real-time price data and market statistics';
COMMENT ON TABLE technical_indicators IS 'Cached technical indicator calculations';
COMMENT ON TABLE market_events IS 'Market events, news, and sentiment data';