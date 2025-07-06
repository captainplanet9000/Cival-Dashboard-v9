-- Migration for Advanced Trading Agent Analysis Sessions
-- This table stores real-time analysis sessions from the multi-agent framework

-- Create agent analysis sessions table
CREATE TABLE IF NOT EXISTS public.agent_analysis_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Market conditions at analysis time
    market_conditions JSONB NOT NULL DEFAULT '{}',
    
    -- Individual agent decisions
    agent_decisions JSONB NOT NULL DEFAULT '[]',
    
    -- Final coordinated recommendation
    final_recommendation JSONB NOT NULL DEFAULT '{}',
    
    -- Consensus percentage (0-1)
    consensus DECIMAL(3,2) NOT NULL DEFAULT 0,
    
    -- Whether the recommendation was executed
    executed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Symbols analyzed
    symbols TEXT[] NOT NULL DEFAULT '{}',
    
    -- Optional paper trade results
    paper_trade_results JSONB,
    
    -- Gemini AI enhancement flag
    gemini_enhanced BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Performance tracking
    execution_time_ms INTEGER,
    confidence_score DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_analysis_sessions_timestamp 
    ON agent_analysis_sessions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_agent_analysis_sessions_session_id 
    ON agent_analysis_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_analysis_sessions_symbols 
    ON agent_analysis_sessions USING GIN(symbols);

CREATE INDEX IF NOT EXISTS idx_agent_analysis_sessions_executed 
    ON agent_analysis_sessions(executed);

CREATE INDEX IF NOT EXISTS idx_agent_analysis_sessions_consensus 
    ON agent_analysis_sessions(consensus DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_analysis_sessions_updated_at 
    BEFORE UPDATE ON agent_analysis_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create agent decision history table for individual agent tracking
CREATE TABLE IF NOT EXISTS public.agent_decision_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES agent_analysis_sessions(session_id),
    
    -- Agent information
    agent_type TEXT NOT NULL, -- FUNDAMENTAL, TECHNICAL, SENTIMENT, RISK_MANAGER
    agent_id TEXT NOT NULL,
    
    -- Decision details
    recommendation TEXT NOT NULL CHECK (recommendation IN ('BUY', 'SELL', 'HOLD')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    
    -- Analysis reasoning
    reasoning TEXT NOT NULL,
    
    -- Supporting data
    supporting_data JSONB NOT NULL DEFAULT '{}',
    
    -- Market data used
    market_data JSONB NOT NULL DEFAULT '{}',
    
    -- News data used
    news_data JSONB NOT NULL DEFAULT '[]',
    
    -- Gemini enhancement
    gemini_enhanced BOOLEAN NOT NULL DEFAULT FALSE,
    gemini_enhancements JSONB,
    
    -- Performance tracking
    analysis_duration_ms INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for agent decision history
CREATE INDEX IF NOT EXISTS idx_agent_decision_history_session_id 
    ON agent_decision_history(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_decision_history_agent_type 
    ON agent_decision_history(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_decision_history_recommendation 
    ON agent_decision_history(recommendation);

CREATE INDEX IF NOT EXISTS idx_agent_decision_history_confidence 
    ON agent_decision_history(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_agent_decision_history_timestamp 
    ON agent_decision_history(created_at DESC);

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS public.agent_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_type TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    
    -- Performance statistics
    total_decisions INTEGER NOT NULL DEFAULT 0,
    correct_decisions INTEGER NOT NULL DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Decision breakdown
    buy_decisions INTEGER NOT NULL DEFAULT 0,
    sell_decisions INTEGER NOT NULL DEFAULT 0,
    hold_decisions INTEGER NOT NULL DEFAULT 0,
    
    -- Confidence statistics
    avg_confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
    high_confidence_decisions INTEGER NOT NULL DEFAULT 0, -- confidence > 80
    
    -- Risk assessment accuracy
    risk_assessments_correct INTEGER NOT NULL DEFAULT 0,
    total_risk_assessments INTEGER NOT NULL DEFAULT 0,
    
    -- Gemini enhancement usage
    gemini_enhanced_decisions INTEGER NOT NULL DEFAULT 0,
    
    -- Time periods
    last_7_days_decisions INTEGER NOT NULL DEFAULT 0,
    last_30_days_decisions INTEGER NOT NULL DEFAULT 0,
    
    -- Last updated tracking
    last_decision_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(agent_type, agent_id)
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_agent_type 
    ON agent_performance_metrics(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_accuracy 
    ON agent_performance_metrics(accuracy_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_last_updated 
    ON agent_performance_metrics(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE agent_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations on agent_analysis_sessions" 
    ON agent_analysis_sessions FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on agent_decision_history" 
    ON agent_decision_history FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on agent_performance_metrics" 
    ON agent_performance_metrics FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Create functions for updating performance metrics
CREATE OR REPLACE FUNCTION update_agent_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update performance metrics for the agent
    INSERT INTO agent_performance_metrics (
        agent_type, 
        agent_id, 
        total_decisions,
        last_decision_at,
        last_updated
    ) VALUES (
        NEW.agent_type,
        NEW.agent_id,
        1,
        NEW.created_at,
        NOW()
    )
    ON CONFLICT (agent_type, agent_id) DO UPDATE SET
        total_decisions = agent_performance_metrics.total_decisions + 1,
        buy_decisions = agent_performance_metrics.buy_decisions + 
            CASE WHEN NEW.recommendation = 'BUY' THEN 1 ELSE 0 END,
        sell_decisions = agent_performance_metrics.sell_decisions + 
            CASE WHEN NEW.recommendation = 'SELL' THEN 1 ELSE 0 END,
        hold_decisions = agent_performance_metrics.hold_decisions + 
            CASE WHEN NEW.recommendation = 'HOLD' THEN 1 ELSE 0 END,
        high_confidence_decisions = agent_performance_metrics.high_confidence_decisions + 
            CASE WHEN NEW.confidence > 80 THEN 1 ELSE 0 END,
        gemini_enhanced_decisions = agent_performance_metrics.gemini_enhanced_decisions + 
            CASE WHEN NEW.gemini_enhanced THEN 1 ELSE 0 END,
        last_decision_at = NEW.created_at,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update performance metrics
CREATE TRIGGER update_agent_performance_on_decision
    AFTER INSERT ON agent_decision_history
    FOR EACH ROW EXECUTE FUNCTION update_agent_performance_metrics();

-- Create view for easy querying of recent analysis sessions
CREATE OR REPLACE VIEW recent_agent_analysis AS
SELECT 
    aas.id,
    aas.session_id,
    aas.timestamp,
    aas.symbols,
    aas.consensus,
    aas.executed,
    aas.gemini_enhanced,
    aas.confidence_score,
    (aas.final_recommendation->>'recommendation') AS final_recommendation,
    (aas.final_recommendation->>'confidence')::INTEGER AS final_confidence,
    (aas.final_recommendation->>'riskLevel') AS risk_level,
    COUNT(adh.id) AS agent_decisions_count,
    AVG(adh.confidence) AS avg_agent_confidence
FROM agent_analysis_sessions aas
LEFT JOIN agent_decision_history adh ON aas.session_id = adh.session_id
GROUP BY aas.id, aas.session_id, aas.timestamp, aas.symbols, aas.consensus, 
         aas.executed, aas.gemini_enhanced, aas.confidence_score,
         aas.final_recommendation
ORDER BY aas.timestamp DESC;

-- Create view for agent performance dashboard
CREATE OR REPLACE VIEW agent_performance_dashboard AS
SELECT 
    apm.agent_type,
    apm.agent_id,
    apm.total_decisions,
    apm.accuracy_percentage,
    apm.avg_confidence,
    apm.buy_decisions,
    apm.sell_decisions,
    apm.hold_decisions,
    apm.high_confidence_decisions,
    apm.gemini_enhanced_decisions,
    apm.last_decision_at,
    apm.last_7_days_decisions,
    apm.last_30_days_decisions,
    CASE 
        WHEN apm.total_decisions > 0 
        THEN ROUND((apm.high_confidence_decisions::DECIMAL / apm.total_decisions) * 100, 2)
        ELSE 0 
    END AS high_confidence_percentage,
    CASE 
        WHEN apm.total_decisions > 0 
        THEN ROUND((apm.gemini_enhanced_decisions::DECIMAL / apm.total_decisions) * 100, 2)
        ELSE 0 
    END AS gemini_enhancement_percentage
FROM agent_performance_metrics apm
ORDER BY apm.accuracy_percentage DESC, apm.total_decisions DESC;

-- Grant permissions
GRANT ALL ON agent_analysis_sessions TO authenticated;
GRANT ALL ON agent_decision_history TO authenticated;
GRANT ALL ON agent_performance_metrics TO authenticated;
GRANT SELECT ON recent_agent_analysis TO authenticated;
GRANT SELECT ON agent_performance_dashboard TO authenticated;

-- Insert initial data for testing
INSERT INTO agent_analysis_sessions (
    session_id,
    market_conditions,
    agent_decisions,
    final_recommendation,
    consensus,
    symbols,
    gemini_enhanced
) VALUES (
    'test_session_' || extract(epoch from now()),
    '{"volatility": 0.15, "trend": "bullish", "volume": 1000000, "sentiment": 0.3}',
    '[{"agentType": "FUNDAMENTAL", "recommendation": "BUY", "confidence": 85}]',
    '{"recommendation": "BUY", "confidence": 85, "riskLevel": "MEDIUM"}',
    0.85,
    ARRAY['BTC/USD'],
    true
);

COMMENT ON TABLE agent_analysis_sessions IS 'Stores complete analysis sessions from the multi-agent trading framework';
COMMENT ON TABLE agent_decision_history IS 'Individual agent decisions within each analysis session';
COMMENT ON TABLE agent_performance_metrics IS 'Performance tracking and statistics for each trading agent';
COMMENT ON VIEW recent_agent_analysis IS 'Quick view of recent analysis sessions with summary data';
COMMENT ON VIEW agent_performance_dashboard IS 'Dashboard view for agent performance metrics and statistics';