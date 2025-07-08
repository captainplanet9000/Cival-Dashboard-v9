-- Create paper_trades table for storing paper trading transactions
-- This table stores all paper trading activities for the dashboard

CREATE TABLE IF NOT EXISTS paper_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255),
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL DEFAULT 'market',
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    execution_price DECIMAL(20, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
    realized_pnl DECIMAL(20, 8) DEFAULT 0, -- This column was missing!
    unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    fee DECIMAL(20, 8) DEFAULT 0,
    commission DECIMAL(20, 8) DEFAULT 0,
    position_id VARCHAR(255),
    strategy VARCHAR(100),
    signal_strength DECIMAL(5, 2),
    confidence DECIMAL(5, 2),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT paper_trades_side_check CHECK (side IN ('buy', 'sell')),
    CONSTRAINT paper_trades_status_check CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
    CONSTRAINT paper_trades_quantity_positive CHECK (quantity > 0),
    CONSTRAINT paper_trades_price_positive CHECK (price > 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_paper_trades_agent_id ON paper_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON paper_trades(status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_created_at ON paper_trades(created_at);
CREATE INDEX IF NOT EXISTS idx_paper_trades_side ON paper_trades(side);
CREATE INDEX IF NOT EXISTS idx_paper_trades_trade_id ON paper_trades(trade_id);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_paper_trades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_paper_trades_updated_at
    BEFORE UPDATE ON paper_trades
    FOR EACH ROW
    EXECUTE FUNCTION update_paper_trades_updated_at();

-- Add some helpful comments
COMMENT ON TABLE paper_trades IS 'Stores all paper trading transactions and positions';
COMMENT ON COLUMN paper_trades.realized_pnl IS 'Realized profit/loss for closed positions';
COMMENT ON COLUMN paper_trades.unrealized_pnl IS 'Unrealized profit/loss for open positions';
COMMENT ON COLUMN paper_trades.signal_strength IS 'AI signal strength (0-1)';
COMMENT ON COLUMN paper_trades.confidence IS 'AI confidence level (0-1)';
COMMENT ON COLUMN paper_trades.metadata IS 'Additional trade metadata and context';

-- Insert some sample data for development
INSERT INTO paper_trades (trade_id, agent_id, agent_name, symbol, side, quantity, price, status, realized_pnl) VALUES 
('trade_sample_1', 'agent_alpha', 'Alpha Trader', 'BTC/USD', 'buy', 0.001, 96420.50, 'filled', 0.00),
('trade_sample_2', 'agent_alpha', 'Alpha Trader', 'ETH/USD', 'buy', 0.01, 3285.75, 'filled', 0.00),
('trade_sample_3', 'agent_alpha', 'Alpha Trader', 'SOL/USD', 'sell', 1.0, 205.32, 'filled', 10.50)
ON CONFLICT (trade_id) DO NOTHING;