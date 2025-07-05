-- Migration 008: Trading Strategy System
-- This migration creates tables for managing trading strategies and their execution history

-- Trading strategies table
CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    strategy_type VARCHAR(100) NOT NULL CHECK (strategy_type IN ('momentum', 'mean_reversion', 'arbitrage', 'darvas_box', 'williams_alligator', 'renko_breakout', 'heikin_ashi', 'elliott_wave')),
    timeframes TEXT[] DEFAULT ARRAY['15m', '1h', '4h', '1d'],
    symbols TEXT[] DEFAULT ARRAY['BTCUSD', 'ETHUSD'],
    parameters JSONB DEFAULT '{}',
    risk_parameters JSONB DEFAULT '{
        "max_position_size": 0.1,
        "stop_loss_percentage": 0.02,
        "take_profit_percentage": 0.05,
        "max_drawdown": 0.15
    }'::jsonb,
    max_position_size DECIMAL(18,8) DEFAULT 0.1,
    max_portfolio_allocation DECIMAL(5,4) DEFAULT 0.2,
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    stop_loss_percentage DECIMAL(5,4) DEFAULT 0.02,
    take_profit_percentage DECIMAL(5,4) DEFAULT 0.05,
    preferred_conditions TEXT[] DEFAULT ARRAY['trending', 'volatile'],
    min_volatility DECIMAL(5,4) DEFAULT 0.01,
    max_volatility DECIMAL(5,4) DEFAULT 0.10,
    active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategy execution history
CREATE TABLE IF NOT EXISTS public.strategy_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    agent_id UUID,
    execution_time TIMESTAMPTZ DEFAULT NOW(),
    market_conditions JSONB DEFAULT '{}',
    decision VARCHAR(20) CHECK (decision IN ('buy', 'sell', 'hold', 'close')),
    confidence DECIMAL(5,4) DEFAULT 0.5,
    reasoning TEXT,
    result JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{
        "profit_loss": 0,
        "win_rate": 0,
        "sharpe_ratio": 0,
        "max_drawdown": 0
    }'::jsonb,
    execution_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategy backtesting results
CREATE TABLE IF NOT EXISTS public.strategy_backtests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(18,8) DEFAULT 100000,
    final_capital DECIMAL(18,8),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(18,8),
    max_drawdown DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    win_rate DECIMAL(5,4),
    avg_win DECIMAL(18,8),
    avg_loss DECIMAL(18,8),
    parameters_used JSONB,
    detailed_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_strategies_active ON strategies(active) WHERE active = true;
CREATE INDEX idx_strategies_type ON strategies(strategy_type);
CREATE INDEX idx_strategy_executions_strategy ON strategy_executions(strategy_id, execution_time DESC);
CREATE INDEX idx_strategy_executions_agent ON strategy_executions(agent_id, execution_time DESC);
CREATE INDEX idx_strategy_backtests_strategy ON strategy_backtests(strategy_id, created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_backtests ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
CREATE POLICY "Users can view all active strategies" ON strategies
    FOR SELECT USING (active = true);

CREATE POLICY "Users can create their own strategies" ON strategies
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own strategies" ON strategies
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own strategies" ON strategies
    FOR DELETE USING (auth.uid() = created_by);

-- Initial seed data for default strategies
INSERT INTO strategies (name, strategy_type, description, parameters) VALUES
('Momentum Trader', 'momentum', 'Trend-following strategy using moving averages and volume', 
    '{"ma_fast": 20, "ma_slow": 50, "volume_threshold": 1.5}'::jsonb),
('Mean Reversion Bot', 'mean_reversion', 'Trades pullbacks to the mean using Bollinger Bands',
    '{"period": 20, "std_dev": 2, "rsi_oversold": 30, "rsi_overbought": 70}'::jsonb),
('Darvas Box Breakout', 'darvas_box', 'Classic box breakout strategy with modern risk management',
    '{"box_period": 20, "breakout_threshold": 1.02, "volume_confirmation": true}'::jsonb),
('Williams Alligator', 'williams_alligator', 'Bill Williams Alligator indicator strategy',
    '{"jaw_period": 13, "teeth_period": 8, "lips_period": 5, "jaw_offset": 8}'::jsonb),
('Elliott Wave Trader', 'elliott_wave', 'Advanced Elliott Wave pattern recognition',
    '{"wave_threshold": 0.618, "fibonacci_levels": [0.236, 0.382, 0.5, 0.618, 0.786]}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE strategies IS 'Trading strategy definitions with parameters and risk management settings';
COMMENT ON TABLE strategy_executions IS 'Historical record of strategy execution decisions and outcomes';
COMMENT ON TABLE strategy_backtests IS 'Backtesting results for strategy performance validation';