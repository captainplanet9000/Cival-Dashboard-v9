-- Enable real-time subscriptions for existing critical tables
ALTER TABLE positions REPLICA IDENTITY FULL;
ALTER TABLE market_data REPLICA IDENTITY FULL;
ALTER TABLE agent_decisions REPLICA IDENTITY FULL;
ALTER TABLE trading_signals REPLICA IDENTITY FULL;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_history_created_at ON trading_history(created_at DESC);