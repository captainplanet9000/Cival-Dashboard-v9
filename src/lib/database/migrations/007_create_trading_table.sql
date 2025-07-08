-- Create trading tables for order management and execution tracking
-- This includes orders, executions, positions, and trading signals

CREATE TABLE IF NOT EXISTS trading_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Order identification
    order_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    farm_id UUID, -- Optional: if part of a farm (foreign key to farms.farm_id)
    
    -- Order details
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8), -- For limit orders
    stop_price DECIMAL(20, 8), -- For stop orders
    
    -- Order status and execution
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'rejected')),
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    filled_price DECIMAL(20, 8),
    remaining_quantity DECIMAL(20, 8),
    
    -- Execution details
    execution_time TIMESTAMP WITH TIME ZONE,
    execution_venue VARCHAR(50) DEFAULT 'paper', -- paper, binance, coinbase, etc.
    
    -- Fees and costs
    commission DECIMAL(20, 8) DEFAULT 0,
    fees DECIMAL(20, 8) DEFAULT 0,
    slippage DECIMAL(5, 4) DEFAULT 0,
    
    -- Strategy context
    strategy_type VARCHAR(100),
    signal_id VARCHAR(255), -- Reference to trading signal
    signal_strength DECIMAL(3, 2), -- 0-1 scale
    confidence DECIMAL(3, 2), -- 0-1 scale
    
    -- Risk management
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    position_size_percent DECIMAL(5, 2), -- % of portfolio
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- Create trading_positions table for position tracking
CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Position identification
    position_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    farm_id UUID, -- Optional: if part of a farm (foreign key to farms.farm_id)
    
    -- Position details
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    quantity DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    
    -- Position metrics
    market_value DECIMAL(20, 8),
    unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    total_pnl DECIMAL(20, 8) DEFAULT 0,
    
    -- Risk management
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    max_loss DECIMAL(20, 8),
    
    -- Position status
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'partial')),
    
    -- Timestamps
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Strategy context
    strategy_type VARCHAR(100),
    entry_signal_id VARCHAR(255),
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- Create trading_signals table for AI-generated trading signals
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Signal identification
    signal_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    farm_id UUID, -- Optional: if part of a farm (foreign key to farms.farm_id)
    
    -- Signal details
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
    strength DECIMAL(3, 2) NOT NULL, -- 0-1 scale
    confidence DECIMAL(3, 2) NOT NULL, -- 0-1 scale
    
    -- Price and timing
    recommended_price DECIMAL(20, 8),
    price_tolerance DECIMAL(5, 4) DEFAULT 0.01, -- 1% default tolerance
    time_validity_minutes INTEGER DEFAULT 30,
    
    -- Strategy context
    strategy_type VARCHAR(100) NOT NULL,
    reasoning TEXT, -- AI reasoning for the signal
    
    -- Market context
    market_conditions JSONB DEFAULT '{}',
    technical_indicators JSONB DEFAULT '{}',
    
    -- Signal outcome
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'expired', 'cancelled')),
    executed_order_id VARCHAR(255), -- Reference to order if executed
    execution_price DECIMAL(20, 8),
    execution_time TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- Create market_data_snapshots table for storing market data used in trading decisions
CREATE TABLE IF NOT EXISTS market_data_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Market data identification
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(50) DEFAULT 'mock', -- mock, binance, coinbase, etc.
    
    -- Price data
    price DECIMAL(20, 8) NOT NULL,
    bid DECIMAL(20, 8),
    ask DECIMAL(20, 8),
    spread DECIMAL(5, 4),
    
    -- Volume and liquidity
    volume_24h DECIMAL(20, 8),
    volume_1h DECIMAL(20, 8),
    
    -- Price changes
    change_24h DECIMAL(5, 2),
    change_1h DECIMAL(5, 2),
    change_percentage_24h DECIMAL(5, 2),
    
    -- Technical indicators
    rsi_14 DECIMAL(5, 2),
    sma_20 DECIMAL(20, 8),
    sma_50 DECIMAL(20, 8),
    ema_12 DECIMAL(20, 8),
    ema_26 DECIMAL(20, 8),
    
    -- Market metrics
    market_cap DECIMAL(20, 2),
    liquidity_score DECIMAL(3, 2), -- 0-1 scale
    
    -- Additional data
    raw_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for trading_orders
CREATE INDEX IF NOT EXISTS idx_trading_orders_order_id ON trading_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_agent_id ON trading_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_farm_id ON trading_orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);

-- Create indexes for trading_positions
CREATE INDEX IF NOT EXISTS idx_trading_positions_position_id ON trading_positions(position_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_agent_id ON trading_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_farm_id ON trading_positions(farm_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_symbol ON trading_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_positions_status ON trading_positions(status);

-- Create indexes for trading_signals
CREATE INDEX IF NOT EXISTS idx_trading_signals_signal_id ON trading_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_agent_id ON trading_signals(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_farm_id ON trading_signals(farm_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_generated_at ON trading_signals(generated_at);

-- Create indexes for market_data_snapshots
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data_snapshots(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data_snapshots(source);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_trading_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trading_orders_updated_at
    BEFORE UPDATE ON trading_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_trading_updated_at();

CREATE TRIGGER trigger_update_trading_positions_updated_at
    BEFORE UPDATE ON trading_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_trading_updated_at();

-- Create function to update position PnL
CREATE OR REPLACE FUNCTION update_position_pnl(pos_id UUID, current_market_price DECIMAL)
RETURNS VOID AS $$
DECLARE
    pos RECORD;
    pnl_amount DECIMAL;
BEGIN
    -- Get position details
    SELECT * INTO pos FROM trading_positions WHERE id = pos_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate unrealized PnL
    IF pos.side = 'long' THEN
        pnl_amount = (current_market_price - pos.entry_price) * pos.quantity;
    ELSE -- short position
        pnl_amount = (pos.entry_price - current_market_price) * pos.quantity;
    END IF;
    
    -- Update position
    UPDATE trading_positions 
    SET 
        current_price = current_market_price,
        market_value = current_market_price * quantity,
        unrealized_pnl = pnl_amount,
        total_pnl = realized_pnl + pnl_amount
    WHERE id = pos_id;
    
END;
$$ LANGUAGE plpgsql;

-- Insert sample trading data for development
INSERT INTO trading_signals (signal_id, agent_id, symbol, signal_type, strength, confidence, strategy_type, reasoning) VALUES 
('signal_btc_buy_1', 'agent_alpha', 'BTC/USD', 'buy', 0.85, 0.9, 'momentum', 'Strong upward momentum detected with RSI oversold recovery'),
('signal_eth_sell_1', 'agent_alpha', 'ETH/USD', 'sell', 0.7, 0.8, 'mean_reversion', 'Price approaching resistance level with high volume'),
('signal_sol_hold_1', 'agent_alpha', 'SOL/USD', 'hold', 0.3, 0.6, 'consolidation', 'Sideways movement expected, waiting for breakout')
ON CONFLICT (signal_id) DO NOTHING;

-- Add foreign key constraints to farms table using farm_id
ALTER TABLE trading_orders ADD CONSTRAINT fk_trading_orders_farm_id 
FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE SET NULL;

ALTER TABLE trading_positions ADD CONSTRAINT fk_trading_positions_farm_id 
FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE SET NULL;

ALTER TABLE trading_signals ADD CONSTRAINT fk_trading_signals_farm_id 
FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE SET NULL;

-- Comments
COMMENT ON TABLE trading_orders IS 'Stores all trading orders placed by agents';
COMMENT ON TABLE trading_positions IS 'Tracks open and closed trading positions';
COMMENT ON TABLE trading_signals IS 'AI-generated trading signals and recommendations';
COMMENT ON TABLE market_data_snapshots IS 'Historical market data used for trading decisions';
COMMENT ON FUNCTION update_position_pnl IS 'Updates position PnL based on current market price';