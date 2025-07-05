-- Migration 011: Risk Management System
-- This migration creates tables for comprehensive risk management

-- Risk profiles and limits
CREATE TABLE IF NOT EXISTS public.risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),
    max_position_size DECIMAL(5,4) DEFAULT 0.05, -- 5% max per position
    max_portfolio_risk DECIMAL(5,4) DEFAULT 0.20, -- 20% max portfolio risk
    max_daily_loss DECIMAL(5,4) DEFAULT 0.02, -- 2% daily loss limit
    max_drawdown DECIMAL(5,4) DEFAULT 0.15, -- 15% max drawdown
    stop_loss_required BOOLEAN DEFAULT true,
    min_sharpe_ratio DECIMAL(8,4) DEFAULT 1.0,
    max_leverage DECIMAL(5,2) DEFAULT 1.0,
    position_limits JSONB DEFAULT '{
        "max_positions": 10,
        "max_correlated_positions": 3,
        "correlation_threshold": 0.7
    }'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk metrics tracking
CREATE TABLE IF NOT EXISTS public.risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    -- Value at Risk metrics
    var_95 DECIMAL(18,8), -- 95% VaR
    var_99 DECIMAL(18,8), -- 99% VaR
    cvar_95 DECIMAL(18,8), -- Conditional VaR (Expected Shortfall)
    -- Portfolio metrics
    portfolio_beta DECIMAL(8,4),
    portfolio_alpha DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    sortino_ratio DECIMAL(8,4),
    calmar_ratio DECIMAL(8,4),
    -- Risk metrics
    current_drawdown DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    drawdown_duration_days INTEGER,
    volatility_daily DECIMAL(8,4),
    volatility_annual DECIMAL(8,4),
    downside_deviation DECIMAL(8,4),
    -- Exposure metrics
    gross_exposure DECIMAL(18,8),
    net_exposure DECIMAL(18,8),
    long_exposure DECIMAL(18,8),
    short_exposure DECIMAL(18,8),
    -- Additional metrics
    correlation_matrix JSONB,
    sector_exposure JSONB,
    currency_exposure JSONB,
    risk_contributions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk limits and rules
CREATE TABLE IF NOT EXISTS public.risk_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN (
        'position_size', 'portfolio_risk', 'daily_loss', 'drawdown',
        'leverage', 'concentration', 'correlation', 'var', 'exposure'
    )),
    scope VARCHAR(50) DEFAULT 'portfolio' CHECK (scope IN ('position', 'portfolio', 'account', 'global')),
    metric_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL CHECK (operator IN ('less_than', 'greater_than', 'equal', 'between')),
    limit_value DECIMAL(18,8) NOT NULL,
    limit_value_max DECIMAL(18,8), -- For 'between' operator
    action VARCHAR(50) DEFAULT 'alert' CHECK (action IN ('alert', 'warning', 'block', 'close_positions')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk alerts and violations
CREATE TABLE IF NOT EXISTS public.risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    limit_id UUID REFERENCES risk_limits(id) ON DELETE CASCADE,
    portfolio_id UUID,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric_value DECIMAL(18,8),
    limit_value DECIMAL(18,8),
    violation_percentage DECIMAL(8,4),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
    resolution_notes TEXT,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stress test scenarios
CREATE TABLE IF NOT EXISTS public.stress_test_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('historical', 'hypothetical', 'sensitivity', 'custom')),
    parameters JSONB NOT NULL DEFAULT '{
        "market_shock": -0.10,
        "volatility_multiplier": 2.0,
        "correlation_increase": 0.2,
        "liquidity_discount": 0.1
    }'::jsonb,
    affected_assets TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stress test results
CREATE TABLE IF NOT EXISTS public.stress_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL,
    test_date DATE NOT NULL,
    initial_value DECIMAL(18,8) NOT NULL,
    stressed_value DECIMAL(18,8) NOT NULL,
    loss_amount DECIMAL(18,8),
    loss_percentage DECIMAL(8,4),
    var_impact DECIMAL(18,8),
    affected_positions JSONB,
    detailed_results JSONB,
    recommendations TEXT[],
    passed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position risk analysis
CREATE TABLE IF NOT EXISTS public.position_risk_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    analysis_date DATE NOT NULL,
    position_var DECIMAL(18,8),
    position_beta DECIMAL(8,4),
    concentration_risk DECIMAL(5,4),
    correlation_risk DECIMAL(5,4),
    liquidity_risk DECIMAL(5,4),
    volatility_30d DECIMAL(8,4),
    max_adverse_move DECIMAL(8,4),
    risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 100),
    risk_factors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(position_id, analysis_date)
);

-- Create indexes for performance
CREATE INDEX idx_risk_profiles_active ON risk_profiles(active) WHERE active = true;
CREATE INDEX idx_risk_metrics_portfolio_time ON risk_metrics(portfolio_id, timestamp DESC);
CREATE INDEX idx_risk_limits_active ON risk_limits(active, limit_type) WHERE active = true;
CREATE INDEX idx_risk_alerts_status ON risk_alerts(status, severity, triggered_at DESC) WHERE status = 'active';
CREATE INDEX idx_risk_alerts_portfolio ON risk_alerts(portfolio_id, triggered_at DESC);
CREATE INDEX idx_stress_test_results_portfolio ON stress_test_results(portfolio_id, test_date DESC);
CREATE INDEX idx_position_risk_symbol ON position_risk_analysis(symbol, analysis_date DESC);

-- Create triggers
CREATE TRIGGER update_risk_profiles_updated_at BEFORE UPDATE ON risk_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_limits_updated_at BEFORE UPDATE ON risk_limits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check risk limits
CREATE OR REPLACE FUNCTION check_risk_limits(p_portfolio_id UUID)
RETURNS TABLE(
    limit_id UUID,
    limit_name VARCHAR,
    metric_value DECIMAL,
    limit_value DECIMAL,
    violated BOOLEAN,
    violation_percentage DECIMAL
) AS $$
BEGIN
    -- This is a placeholder for the actual risk checking logic
    -- In production, this would calculate actual metrics and compare against limits
    RETURN QUERY
    SELECT 
        rl.id,
        rl.name,
        0::DECIMAL as metric_value,
        rl.limit_value,
        false as violated,
        0::DECIMAL as violation_percentage
    FROM risk_limits rl
    WHERE rl.active = true;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_risk_analysis ENABLE ROW LEVEL SECURITY;

-- Default risk profiles
INSERT INTO risk_profiles (name, risk_level, max_position_size, max_daily_loss, max_drawdown) VALUES
('Conservative', 'conservative', 0.02, 0.01, 0.10),
('Moderate', 'moderate', 0.05, 0.02, 0.15),
('Aggressive', 'aggressive', 0.10, 0.05, 0.25)
ON CONFLICT (name) DO NOTHING;

-- Default risk limits
INSERT INTO risk_limits (name, limit_type, metric_name, operator, limit_value, action, severity) VALUES
('Max Position Size', 'position_size', 'position_percentage', 'less_than', 0.10, 'block', 'high'),
('Daily Loss Limit', 'daily_loss', 'daily_pnl_percentage', 'greater_than', -0.02, 'block', 'critical'),
('Max Drawdown', 'drawdown', 'current_drawdown', 'less_than', 0.15, 'alert', 'high'),
('Portfolio VaR Limit', 'var', 'var_95', 'less_than', 0.05, 'warning', 'medium')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE risk_profiles IS 'Risk management profiles with predefined limits and parameters';
COMMENT ON TABLE risk_metrics IS 'Time-series risk metrics for portfolios including VaR, drawdown, and ratios';
COMMENT ON TABLE risk_limits IS 'Configurable risk limits and rules for automated monitoring';
COMMENT ON TABLE risk_alerts IS 'Risk limit violations and alerts requiring attention';
COMMENT ON TABLE stress_test_scenarios IS 'Predefined stress testing scenarios for risk assessment';
COMMENT ON TABLE stress_test_results IS 'Historical results of stress tests on portfolios';
COMMENT ON TABLE position_risk_analysis IS 'Individual position risk analysis and scoring';