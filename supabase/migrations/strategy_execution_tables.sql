-- Strategy Execution and Learning Tables Migration
-- Purpose: Add comprehensive strategy execution tracking and agent learning capabilities
-- Generated: 2025-01-09

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- STRATEGY EXECUTION TRACKING TABLES
-- ==============================================

-- Enhanced strategies table (extends existing if needed)
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  indicators JSONB NOT NULL DEFAULT '[]',
  rules JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  complexity TEXT DEFAULT 'intermediate',
  win_rate DECIMAL(5,4) DEFAULT 0.5,
  risk_reward_ratio DECIMAL(5,2) DEFAULT 2.0,
  optimal_conditions JSONB DEFAULT '[]',
  avoid_conditions JSONB DEFAULT '[]',
  timeframes JSONB DEFAULT '[]',
  asset_classes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy execution logs for detailed tracking
CREATE TABLE IF NOT EXISTS strategy_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('analysis', 'signal', 'entry', 'exit')),
  input_data JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  performance JSONB NOT NULL DEFAULT '{}',
  market_conditions JSONB DEFAULT '{}',
  conditions_met JSONB DEFAULT '[]',
  signal_type TEXT,
  signal_strength DECIMAL(5,2) DEFAULT 0,
  confidence DECIMAL(5,2) DEFAULT 0,
  entry_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  pnl DECIMAL(20,8),
  execution_time_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy learning data for agent improvement
CREATE TABLE IF NOT EXISTS strategy_learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market_conditions JSONB NOT NULL DEFAULT '{}',
  signals_generated JSONB NOT NULL DEFAULT '{}',
  actions_taken JSONB DEFAULT '{}',
  outcome JSONB DEFAULT '{}',
  reward DECIMAL(10,6) DEFAULT 0,
  learning_metrics JSONB DEFAULT '{}',
  optimization_data JSONB DEFAULT '{}',
  feedback_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy performance metrics aggregated by agent
CREATE TABLE IF NOT EXISTS strategy_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  symbol TEXT,
  timeframe TEXT DEFAULT '30d',
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  total_signals INTEGER DEFAULT 0,
  buy_signals INTEGER DEFAULT 0,
  sell_signals INTEGER DEFAULT 0,
  hold_signals INTEGER DEFAULT 0,
  avg_confidence DECIMAL(5,2) DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,
  total_pnl DECIMAL(20,8) DEFAULT 0,
  win_rate DECIMAL(5,4) DEFAULT 0,
  avg_return DECIMAL(10,6) DEFAULT 0,
  max_drawdown DECIMAL(10,6) DEFAULT 0,
  sharpe_ratio DECIMAL(8,4) DEFAULT 0,
  profit_factor DECIMAL(8,4) DEFAULT 0,
  risk_reward_ratio DECIMAL(8,4) DEFAULT 0,
  volatility DECIMAL(10,6) DEFAULT 0,
  max_consecutive_losses INTEGER DEFAULT 0,
  avg_trade_duration_hours INTEGER DEFAULT 0,
  last_execution_at TIMESTAMP WITH TIME ZONE,
  performance_score DECIMAL(5,2) DEFAULT 0,
  optimization_suggestions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy signals tracking
CREATE TABLE IF NOT EXISTS strategy_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
  strength DECIMAL(5,2) NOT NULL DEFAULT 0,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  entry_price DECIMAL(20,8) NOT NULL,
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  conditions_met JSONB DEFAULT '[]',
  market_conditions JSONB DEFAULT '{}',
  recommendation TEXT,
  executed BOOLEAN DEFAULT false,
  execution_price DECIMAL(20,8),
  execution_timestamp TIMESTAMP WITH TIME ZONE,
  outcome JSONB DEFAULT '{}',
  pnl DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy optimization history
CREATE TABLE IF NOT EXISTS strategy_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL DEFAULT 'parameter_tuning',
  previous_parameters JSONB NOT NULL DEFAULT '{}',
  optimized_parameters JSONB NOT NULL DEFAULT '{}',
  performance_before JSONB DEFAULT '{}',
  performance_after JSONB DEFAULT '{}',
  improvement_metrics JSONB DEFAULT '{}',
  optimization_method TEXT DEFAULT 'automated',
  reasoning TEXT,
  applied BOOLEAN DEFAULT false,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent strategy access and permissions
CREATE TABLE IF NOT EXISTS agent_strategy_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'read_execute' CHECK (access_level IN ('read_only', 'read_execute', 'full_access')),
  permissions JSONB NOT NULL DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  performance_rating DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, strategy_id)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- Strategy execution indexes
CREATE INDEX IF NOT EXISTS idx_strategy_executions_agent_strategy ON strategy_executions(agent_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_executions_symbol ON strategy_executions(symbol);
CREATE INDEX IF NOT EXISTS idx_strategy_executions_execution_type ON strategy_executions(execution_type);
CREATE INDEX IF NOT EXISTS idx_strategy_executions_signal_type ON strategy_executions(signal_type);
CREATE INDEX IF NOT EXISTS idx_strategy_executions_created_at ON strategy_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_strategy_executions_success ON strategy_executions(success);

-- Strategy learning indexes
CREATE INDEX IF NOT EXISTS idx_strategy_learning_agent_strategy ON strategy_learning(agent_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_learning_symbol ON strategy_learning(symbol);
CREATE INDEX IF NOT EXISTS idx_strategy_learning_reward ON strategy_learning(reward);
CREATE INDEX IF NOT EXISTS idx_strategy_learning_created_at ON strategy_learning(created_at);

-- Strategy performance indexes
CREATE INDEX IF NOT EXISTS idx_strategy_performance_agent_strategy ON strategy_performance(agent_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_symbol ON strategy_performance(symbol);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_timeframe ON strategy_performance(timeframe);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_win_rate ON strategy_performance(win_rate);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_performance_score ON strategy_performance(performance_score);

-- Strategy signals indexes
CREATE INDEX IF NOT EXISTS idx_strategy_signals_agent_strategy ON strategy_signals(agent_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_signals_symbol ON strategy_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_strategy_signals_signal_type ON strategy_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_strategy_signals_executed ON strategy_signals(executed);
CREATE INDEX IF NOT EXISTS idx_strategy_signals_created_at ON strategy_signals(created_at);

-- Strategy optimization indexes
CREATE INDEX IF NOT EXISTS idx_strategy_optimizations_agent_strategy ON strategy_optimizations(agent_id, strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_optimizations_optimization_type ON strategy_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_strategy_optimizations_applied ON strategy_optimizations(applied);
CREATE INDEX IF NOT EXISTS idx_strategy_optimizations_created_at ON strategy_optimizations(created_at);

-- Agent strategy access indexes
CREATE INDEX IF NOT EXISTS idx_agent_strategy_access_agent ON agent_strategy_access(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_strategy_access_strategy ON agent_strategy_access(strategy_id);
CREATE INDEX IF NOT EXISTS idx_agent_strategy_access_active ON agent_strategy_access(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_strategy_access_last_used ON agent_strategy_access(last_used_at);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all strategy tables
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_strategy_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON strategies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON strategy_executions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON strategy_learning FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON strategy_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON strategy_signals FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON strategy_optimizations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON agent_strategy_access FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert comprehensive strategy definitions
INSERT INTO strategies (name, type, parameters, indicators, rules, description, complexity, win_rate, risk_reward_ratio, optimal_conditions, avoid_conditions, timeframes, asset_classes) 
VALUES 
  ('Darvas Box Breakout', 'darvas_box', 
   '{"box_period": 20, "volume_threshold": 1.5, "breakout_confirmation": 2, "stop_loss_percent": 8, "profit_target_ratio": 2}',
   '["Volume", "ATR", "200-day MA", "Box levels", "Support/Resistance"]',
   '{"entry_conditions": ["Box formation", "Breakout confirmation", "Volume surge", "Trend alignment"], "exit_conditions": ["Stop loss", "Profit target", "Trailing stop"]}',
   'Breakout strategy based on Nicolas Darvas box theory - identifying consolidation boxes and trading breakouts',
   'intermediate', 0.45, 2.0,
   '["trending_market", "medium_volatility", "strong_volume"]',
   '["sideways_market", "low_volume", "high_correlation"]',
   '["1d", "4h", "1h"]',
   '["stocks", "crypto", "forex"]'),
   
  ('Williams Alligator Trend', 'williams_alligator',
   '{"jaw_period": 13, "teeth_period": 8, "lips_period": 5, "jaw_offset": 8, "teeth_offset": 5, "lips_offset": 3}',
   '["Alligator Lines", "Fractals", "Awesome Oscillator", "AC/DC"]',
   '{"entry_conditions": ["Alligator awakening", "Fractal breakout", "Momentum confirmation"], "exit_conditions": ["Alligator sleeping", "Opposite fractal", "Momentum divergence"]}',
   'Bill Williams Alligator system using 3 displaced moving averages to identify trend and momentum',
   'advanced', 0.40, 2.5,
   '["trending_market", "clear_direction", "low_noise"]',
   '["choppy_market", "low_volatility", "news_driven"]',
   '["1d", "4h", "1h", "15m"]',
   '["forex", "stocks", "commodities", "crypto"]'),
   
  ('Renko Momentum Breakout', 'renko_breakout',
   '{"brick_size": "ATR", "atr_period": 14, "atr_multiplier": 2.0, "confirmation_bricks": 3, "momentum_threshold": 1.2}',
   '["Renko Bricks", "ATR", "Momentum", "Volume", "Trend Strength"]',
   '{"entry_conditions": ["Brick color change", "Momentum surge", "Trend continuation"], "exit_conditions": ["Brick reversal", "Momentum fade", "Pattern completion"]}',
   'Price-based Renko chart strategy focusing on momentum and trend continuation',
   'intermediate', 0.50, 3.0,
   '["trending_market", "medium_volatility", "clear_momentum"]',
   '["sideways_market", "low_volatility", "erratic_movement"]',
   '["renko", "1d", "4h"]',
   '["forex", "crypto", "stocks"]'),
   
  ('Heikin Ashi Trend Follow', 'heikin_ashi',
   '{"ema_period": 20, "confirmation_candles": 2, "trend_strength": 0.7, "stop_loss_atr": 2, "macd_fast": 12, "macd_slow": 26}',
   '["Heikin Ashi", "EMA", "MACD", "RSI", "ATR"]',
   '{"entry_conditions": ["HA color change", "EMA cross", "MACD confirmation"], "exit_conditions": ["HA doji", "EMA recross", "MACD divergence"]}',
   'Modified candlestick chart strategy using Heikin Ashi candles for trend identification',
   'beginner', 0.55, 1.8,
   '["trending_market", "normal_volatility", "clear_direction"]',
   '["choppy_market", "high_volatility", "news_driven"]',
   '["1d", "4h", "1h", "30m"]',
   '["stocks", "forex", "crypto", "indices"]'),
   
  ('Elliott Wave Analyst', 'elliott_wave',
   '{"wave_degree": "Minor", "fib_levels": [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618], "rsi_period": 14, "min_wave_size": 50}',
   '["Wave Patterns", "Fibonacci", "RSI", "MACD", "Volume", "Trendlines"]',
   '{"entry_conditions": ["Wave identification", "Wave 3 characteristics", "Fibonacci confluence"], "exit_conditions": ["Wave completion", "Fibonacci resistance", "RSI divergence"]}',
   'Ralph Nelson Elliott wave theory for market cycle analysis and trend prediction',
   'advanced', 0.35, 3.5,
   '["trending_market", "clear_cycles", "normal_volatility"]',
   '["choppy_market", "low_volatility", "unclear_waves"]',
   '["1d", "1w", "4h", "1h"]',
   '["stocks", "indices", "forex", "crypto"]')
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  parameters = EXCLUDED.parameters,
  indicators = EXCLUDED.indicators,
  rules = EXCLUDED.rules,
  description = EXCLUDED.description,
  complexity = EXCLUDED.complexity,
  win_rate = EXCLUDED.win_rate,
  risk_reward_ratio = EXCLUDED.risk_reward_ratio,
  optimal_conditions = EXCLUDED.optimal_conditions,
  avoid_conditions = EXCLUDED.avoid_conditions,
  timeframes = EXCLUDED.timeframes,
  asset_classes = EXCLUDED.asset_classes,
  updated_at = NOW();

-- Create sample agent strategy access for existing agents
INSERT INTO agent_strategy_access (agent_id, strategy_id, access_level, permissions, preferences)
SELECT 
  a.id as agent_id,
  s.id as strategy_id,
  'read_execute' as access_level,
  '{"can_execute_analysis": true, "can_get_signals": true, "can_optimize_params": true, "can_log_executions": true}' as permissions,
  '{"risk_tolerance": 0.02, "preferred_timeframes": ["1h", "4h", "1d"], "asset_classes": ["crypto", "stocks"]}' as preferences
FROM agents a
CROSS JOIN strategies s
WHERE a.is_active = true
ON CONFLICT (agent_id, strategy_id) DO NOTHING;

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all strategy tables
ALTER PUBLICATION supabase_realtime ADD TABLE strategies;
ALTER PUBLICATION supabase_realtime ADD TABLE strategy_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE strategy_learning;
ALTER PUBLICATION supabase_realtime ADD TABLE strategy_performance;
ALTER PUBLICATION supabase_realtime ADD TABLE strategy_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE strategy_optimizations;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_strategy_access;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update strategy performance automatically
CREATE OR REPLACE FUNCTION update_strategy_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics when strategy execution is inserted
  IF TG_OP = 'INSERT' THEN
    INSERT INTO strategy_performance (strategy_id, agent_id, symbol, total_executions, successful_executions, last_execution_at)
    VALUES (NEW.strategy_id, NEW.agent_id, NEW.symbol, 1, CASE WHEN NEW.success THEN 1 ELSE 0 END, NEW.created_at)
    ON CONFLICT (strategy_id, agent_id, symbol) DO UPDATE SET
      total_executions = strategy_performance.total_executions + 1,
      successful_executions = strategy_performance.successful_executions + CASE WHEN NEW.success THEN 1 ELSE 0 END,
      last_execution_at = NEW.created_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update performance metrics
CREATE TRIGGER update_strategy_performance_trigger
  AFTER INSERT ON strategy_executions
  FOR EACH ROW EXECUTE FUNCTION update_strategy_performance();

-- Function to update agent strategy access usage
CREATE OR REPLACE FUNCTION update_agent_strategy_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage count and last used timestamp
  UPDATE agent_strategy_access 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE agent_id = NEW.agent_id AND strategy_id = NEW.strategy_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update agent strategy usage
CREATE TRIGGER update_agent_strategy_usage_trigger
  AFTER INSERT ON strategy_executions
  FOR EACH ROW EXECUTE FUNCTION update_agent_strategy_usage();

-- Add triggers for updated_at columns
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_executions_updated_at BEFORE UPDATE ON strategy_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_performance_updated_at BEFORE UPDATE ON strategy_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_signals_updated_at BEFORE UPDATE ON strategy_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_optimizations_updated_at BEFORE UPDATE ON strategy_optimizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_strategy_access_updated_at BEFORE UPDATE ON agent_strategy_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Strategy Execution Tables Migration completed successfully!';
  RAISE NOTICE 'Tables created: strategies, strategy_executions, strategy_learning, strategy_performance, strategy_signals, strategy_optimizations, agent_strategy_access';
  RAISE NOTICE 'Sample data inserted for 5 comprehensive trading strategies';
  RAISE NOTICE 'Agent strategy access configured for all active agents';
  RAISE NOTICE 'Performance tracking and automatic updates enabled';
  RAISE NOTICE 'Realtime subscriptions enabled for all strategy tables';
  RAISE NOTICE 'Strategy system ready for agent integration!';
END $$;