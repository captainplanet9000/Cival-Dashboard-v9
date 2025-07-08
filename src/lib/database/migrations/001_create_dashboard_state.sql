-- Create dashboard_state table for storing UI state and preferences
-- This table stores user dashboard configuration and real-time state

CREATE TABLE IF NOT EXISTS dashboard_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Optional: for multi-user support later
    dashboard_type VARCHAR(50) NOT NULL DEFAULT 'main', -- main, trading, analytics, etc.
    state_data JSONB NOT NULL DEFAULT '{}', -- Flexible JSON storage for any state
    metadata JSONB DEFAULT '{}', -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for temporary state
    
    -- Indexes for performance
    CONSTRAINT dashboard_state_type_check CHECK (dashboard_type IN ('main', 'trading', 'analytics', 'overview', 'agents', 'farms', 'goals', 'risk', 'history'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dashboard_state_type ON dashboard_state(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_state_user_id ON dashboard_state(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_state_updated_at ON dashboard_state(updated_at);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_dashboard_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboard_state_updated_at
    BEFORE UPDATE ON dashboard_state
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_state_updated_at();

-- Create function to clean up expired state
CREATE OR REPLACE FUNCTION cleanup_expired_dashboard_state()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM dashboard_state 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some default dashboard states for development
INSERT INTO dashboard_state (dashboard_type, state_data) VALUES 
('main', '{"active_tab": "overview", "layout": "default", "preferences": {"theme": "light"}}'),
('trading', '{"active_pair": "BTC/USD", "chart_type": "candlestick", "timeframe": "1h"}'),
('analytics', '{"date_range": "7d", "metrics": ["portfolio", "performance"], "view": "summary"}')
ON CONFLICT DO NOTHING;

-- Add some helpful comments
COMMENT ON TABLE dashboard_state IS 'Stores dashboard UI state and user preferences';
COMMENT ON COLUMN dashboard_state.state_data IS 'Flexible JSON storage for dashboard state';
COMMENT ON COLUMN dashboard_state.dashboard_type IS 'Type of dashboard (main, trading, analytics, etc.)';
COMMENT ON COLUMN dashboard_state.expires_at IS 'Optional expiration time for temporary state';