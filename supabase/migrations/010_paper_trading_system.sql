-- Migration 010: Paper Trading System
-- This migration creates tables for paper trading simulation

-- Paper trading sessions
CREATE TABLE IF NOT EXISTS public.paper_trading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_balance DECIMAL(18,8) DEFAULT 100000,
    current_balance DECIMAL(18,8),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    settings JSONB DEFAULT '{
        "allow_shorting": false,
        "use_real_time_data": true,
        "commission_rate": 0.001,
        "slippage_rate": 0.0005,
        "margin_enabled": false,
        "margin_rate": 2.0
    }'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paper trades
CREATE TABLE IF NOT EXISTS public.paper_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES paper_trading_sessions(id) ON DELETE CASCADE,
    agent_id UUID,
    order_id VARCHAR(255) UNIQUE,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8) NOT NULL,
    stop_price DECIMAL(18,8),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'rejected')),
    filled_quantity DECIMAL(18,8) DEFAULT 0,
    avg_fill_price DECIMAL(18,8),
    commission DECIMAL(18,8) DEFAULT 0,
    slippage DECIMAL(18,8) DEFAULT 0,
    pnl DECIMAL(18,8),
    pnl_percentage DECIMAL(8,4),
    strategy_name VARCHAR(100),
    reasoning TEXT,
    market_conditions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paper trading positions
CREATE TABLE IF NOT EXISTS public.paper_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES paper_trading_sessions(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    avg_entry_price DECIMAL(18,8) NOT NULL,
    current_price DECIMAL(18,8),
    market_value DECIMAL(18,8),
    unrealized_pnl DECIMAL(18,8),
    realized_pnl DECIMAL(18,8) DEFAULT 0,
    position_type VARCHAR(20) DEFAULT 'long' CHECK (position_type IN ('long', 'short')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, symbol) WHERE closed_at IS NULL
);

-- Paper trading performance metrics
CREATE TABLE IF NOT EXISTS public.paper_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES paper_trading_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    total_equity DECIMAL(18,8) NOT NULL,
    cash_balance DECIMAL(18,8) NOT NULL,
    positions_value DECIMAL(18,8) NOT NULL,
    total_pnl DECIMAL(18,8),
    total_pnl_percentage DECIMAL(8,4),
    daily_pnl DECIMAL(18,8),
    daily_pnl_percentage DECIMAL(8,4),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,4),
    avg_win DECIMAL(18,8),
    avg_loss DECIMAL(18,8),
    profit_factor DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    max_drawdown_duration_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paper trading trade journal
CREATE TABLE IF NOT EXISTS public.paper_trade_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES paper_trading_sessions(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES paper_trades(id) ON DELETE CASCADE,
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('analysis', 'entry', 'exit', 'adjustment', 'note')),
    title VARCHAR(255),
    content TEXT,
    tags TEXT[],
    attachments JSONB,
    sentiment VARCHAR(20) CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_paper_sessions_status ON paper_trading_sessions(status) WHERE status = 'active';
CREATE INDEX idx_paper_sessions_user ON paper_trading_sessions(created_by, created_at DESC);
CREATE INDEX idx_paper_trades_session ON paper_trades(session_id, created_at DESC);
CREATE INDEX idx_paper_trades_symbol ON paper_trades(session_id, symbol, created_at DESC);
CREATE INDEX idx_paper_trades_status ON paper_trades(status, created_at DESC);
CREATE INDEX idx_paper_positions_session ON paper_positions(session_id) WHERE closed_at IS NULL;
CREATE INDEX idx_paper_performance_time ON paper_performance_metrics(session_id, timestamp DESC);
CREATE INDEX idx_paper_journal_session ON paper_trade_journal(session_id, created_at DESC);
CREATE INDEX idx_paper_journal_trade ON paper_trade_journal(trade_id);

-- Create triggers for updated_at
CREATE TRIGGER update_paper_sessions_updated_at BEFORE UPDATE ON paper_trading_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_trades_updated_at BEFORE UPDATE ON paper_trades
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_positions_updated_at BEFORE UPDATE ON paper_positions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update session balance after trades
CREATE OR REPLACE FUNCTION update_paper_session_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'filled' AND OLD.status != 'filled' THEN
        UPDATE paper_trading_sessions
        SET current_balance = current_balance - (NEW.quantity * NEW.avg_fill_price + NEW.commission + NEW.slippage)
        WHERE id = NEW.session_id AND NEW.side = 'buy';
        
        UPDATE paper_trading_sessions
        SET current_balance = current_balance + (NEW.quantity * NEW.avg_fill_price - NEW.commission - NEW.slippage)
        WHERE id = NEW.session_id AND NEW.side = 'sell';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_balance_on_trade
AFTER UPDATE ON paper_trades
FOR EACH ROW
WHEN (NEW.status = 'filled' AND OLD.status != 'filled')
EXECUTE FUNCTION update_paper_session_balance();

-- Row Level Security
ALTER TABLE paper_trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trade_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their paper trading sessions" ON paper_trading_sessions
    FOR ALL USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view paper trades in their sessions" ON paper_trades
    FOR SELECT USING (
        session_id IN (SELECT id FROM paper_trading_sessions WHERE created_by = auth.uid() OR created_by IS NULL)
    );

CREATE POLICY "Users can view paper positions in their sessions" ON paper_positions
    FOR SELECT USING (
        session_id IN (SELECT id FROM paper_trading_sessions WHERE created_by = auth.uid() OR created_by IS NULL)
    );

CREATE POLICY "Users can view performance metrics for their sessions" ON paper_performance_metrics
    FOR SELECT USING (
        session_id IN (SELECT id FROM paper_trading_sessions WHERE created_by = auth.uid() OR created_by IS NULL)
    );

CREATE POLICY "Users can manage their trade journal entries" ON paper_trade_journal
    FOR ALL USING (auth.uid() = created_by OR created_by IS NULL);

-- Comments for documentation
COMMENT ON TABLE paper_trading_sessions IS 'Paper trading simulation sessions with configurable parameters';
COMMENT ON TABLE paper_trades IS 'Individual trades executed within paper trading sessions';
COMMENT ON TABLE paper_positions IS 'Current open positions in paper trading sessions';
COMMENT ON TABLE paper_performance_metrics IS 'Performance metrics time series for paper trading sessions';
COMMENT ON TABLE paper_trade_journal IS 'Trading journal entries for learning and analysis';