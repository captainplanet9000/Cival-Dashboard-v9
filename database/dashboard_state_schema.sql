-- Dashboard State Persistence Schema
-- Supports autonomous dashboard state management across Railway deployments

-- Create dashboard_state table for persistent state storage
CREATE TABLE IF NOT EXISTS dashboard_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  state_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user-based queries
CREATE INDEX IF NOT EXISTS idx_dashboard_state_user_id ON dashboard_state(user_id);

-- Create index for session-based queries  
CREATE INDEX IF NOT EXISTS idx_dashboard_state_session_id ON dashboard_state(session_id);

-- Create index for timestamp-based queries (for latest state)
CREATE INDEX IF NOT EXISTS idx_dashboard_state_updated_at ON dashboard_state(updated_at DESC);

-- Create composite index for user + timestamp queries
CREATE INDEX IF NOT EXISTS idx_dashboard_state_user_updated ON dashboard_state(user_id, updated_at DESC);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_dashboard_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dashboard_state_updated_at_trigger ON dashboard_state;
CREATE TRIGGER update_dashboard_state_updated_at_trigger
  BEFORE UPDATE ON dashboard_state
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_state_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE dashboard_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboard state
DROP POLICY IF EXISTS "Allow all operations for default user" ON dashboard_state;
CREATE POLICY "Allow all operations for default user" 
  ON dashboard_state FOR ALL 
  USING (user_id = 'default_user');

-- Create user preferences table for more structured preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  layout_mode TEXT DEFAULT 'grid' CHECK (layout_mode IN ('grid', 'list', 'compact')),
  sidebar_collapsed BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  refresh_interval_ms INTEGER DEFAULT 30000,
  risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  default_timeframe TEXT DEFAULT '1h' CHECK (default_timeframe IN ('1m', '5m', '15m', '1h', '4h', '1d', '1w')),
  chart_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"trades": true, "agent_alerts": true, "market_updates": true, "risk_alerts": true}',
  agent_preferences JSONB DEFAULT '{"auto_start": false, "preferred_strategies": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for user preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create update trigger for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Enable RLS for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user preferences
DROP POLICY IF EXISTS "Allow all operations for default user" ON user_preferences;
CREATE POLICY "Allow all operations for default user" 
  ON user_preferences FOR ALL 
  USING (user_id = 'default_user');

-- Create dashboard sessions table for session tracking
CREATE TABLE IF NOT EXISTS dashboard_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  user_agent TEXT,
  ip_address INET,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_session_id ON dashboard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_user_id ON dashboard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_active ON dashboard_sessions(is_active, last_activity DESC);

-- Create update trigger for sessions
CREATE OR REPLACE FUNCTION update_dashboard_sessions_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dashboard_sessions_last_activity_trigger ON dashboard_sessions;
CREATE TRIGGER update_dashboard_sessions_last_activity_trigger
  BEFORE UPDATE ON dashboard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_sessions_last_activity();

-- Enable RLS for sessions
ALTER TABLE dashboard_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for sessions
DROP POLICY IF EXISTS "Allow all operations for default user" ON dashboard_sessions;
CREATE POLICY "Allow all operations for default user" 
  ON dashboard_sessions FOR ALL 
  USING (user_id = 'default_user');

-- Create persistence health monitoring table
CREATE TABLE IF NOT EXISTS persistence_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  layer_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'failed')),
  latency_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create index for health monitoring
CREATE INDEX IF NOT EXISTS idx_persistence_health_layer ON persistence_health(layer_name, last_check DESC);

-- Enable RLS for health monitoring
ALTER TABLE persistence_health ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for health monitoring
DROP POLICY IF EXISTS "Allow all operations on persistence health" ON persistence_health;
CREATE POLICY "Allow all operations on persistence health" 
  ON persistence_health FOR ALL 
  USING (true);

-- Insert default user preferences
INSERT INTO user_preferences (user_id) 
VALUES ('default_user') 
ON CONFLICT (user_id) DO NOTHING;

-- Create view for latest dashboard state per user
CREATE OR REPLACE VIEW latest_dashboard_state AS
SELECT DISTINCT ON (user_id) 
  id,
  session_id,
  user_id,
  state_data,
  created_at,
  updated_at
FROM dashboard_state 
ORDER BY user_id, updated_at DESC;

-- Create view for active sessions
CREATE OR REPLACE VIEW active_dashboard_sessions AS
SELECT *
FROM dashboard_sessions 
WHERE is_active = true 
  AND last_activity > NOW() - INTERVAL '1 hour'
ORDER BY last_activity DESC;

-- Create view for persistence health summary
CREATE OR REPLACE VIEW persistence_health_summary AS
SELECT 
  layer_name,
  status,
  AVG(latency_ms) as avg_latency_ms,
  SUM(error_count) as total_errors,
  MAX(last_check) as last_check,
  COUNT(*) as check_count
FROM persistence_health 
WHERE last_check > NOW() - INTERVAL '1 hour'
GROUP BY layer_name, status
ORDER BY layer_name, status;

-- Grant permissions for the views
GRANT SELECT ON latest_dashboard_state TO PUBLIC;
GRANT SELECT ON active_dashboard_sessions TO PUBLIC;
GRANT SELECT ON persistence_health_summary TO PUBLIC;

-- Create function to cleanup old dashboard states (keep last 10 per user)
CREATE OR REPLACE FUNCTION cleanup_old_dashboard_states()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked_states AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM dashboard_state
  )
  DELETE FROM dashboard_state 
  WHERE id IN (
    SELECT id FROM ranked_states WHERE rn > 10
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup inactive sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE dashboard_sessions 
  SET is_active = false 
  WHERE last_activity < NOW() - INTERVAL '24 hours' 
    AND is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update persistence health
CREATE OR REPLACE FUNCTION update_persistence_health(
  p_layer_name TEXT,
  p_status TEXT,
  p_latency_ms INTEGER DEFAULT 0,
  p_error_count INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO persistence_health (
    layer_name, 
    status, 
    latency_ms, 
    error_count, 
    error_message
  ) VALUES (
    p_layer_name,
    p_status,
    p_latency_ms,
    p_error_count,
    p_error_message
  );
END;
$$ LANGUAGE plpgsql;

-- Enable realtime subscriptions for dashboard_state table
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_state;
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_sessions;

COMMENT ON TABLE dashboard_state IS 'Stores persistent dashboard state for autonomous operation across deployments';
COMMENT ON TABLE user_preferences IS 'Stores user preferences and configuration settings';
COMMENT ON TABLE dashboard_sessions IS 'Tracks active dashboard sessions for state synchronization';
COMMENT ON TABLE persistence_health IS 'Monitors health and performance of persistence layers';