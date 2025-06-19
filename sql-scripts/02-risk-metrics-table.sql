-- Risk metrics table for real-time risk monitoring
CREATE TABLE IF NOT EXISTS risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES wallets(id),
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('var', 'sharpe_ratio', 'max_drawdown', 'beta', 'alpha', 'correlation')),
    value DECIMAL(20,8) NOT NULL,
    timeframe VARCHAR(20),
    confidence_level DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for risk_metrics table
CREATE INDEX IF NOT EXISTS idx_risk_metrics_portfolio_id ON risk_metrics(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_type ON risk_metrics(metric_type);

-- Enable real-time
ALTER TABLE risk_metrics REPLICA IDENTITY FULL;