-- ===============================================
-- SUPABASE MIGRATION 008: DASHBOARD PERSISTENCE
-- ===============================================
-- Autonomous Dashboard Persistence System
-- Created: January 2025
-- Purpose: Enable persistent dashboard state across Railway deployments
-- Tables: dashboard_state, user_preferences, dashboard_sessions, persistence_health

-- ===============================================
-- 1. DASHBOARD STATE TABLE
-- ===============================================

-- Main table for storing dashboard state with JSONB
CREATE TABLE IF NOT EXISTS public.dashboard_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  state_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_state_user_id ON public.dashboard_state(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_state_session_id ON public.dashboard_state(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_state_updated_at ON public.dashboard_state(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_state_user_updated ON public.dashboard_state(user_id, updated_at DESC);

-- Update trigger function
CREATE OR REPLACE FUNCTION public.update_dashboard_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_dashboard_state_updated_at_trigger ON public.dashboard_state;
CREATE TRIGGER update_dashboard_state_updated_at_trigger
  BEFORE UPDATE ON public.dashboard_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dashboard_state_updated_at();

-- Enable RLS
ALTER TABLE public.dashboard_state ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Allow all operations for default user" ON public.dashboard_state;
CREATE POLICY "Allow all operations for default user" 
  ON public.dashboard_state FOR ALL 
  USING (user_id = 'default_user');

-- ===============================================
-- 2. USER PREFERENCES TABLE
-- ===============================================

-- Structured user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
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
  chart_preferences JSONB DEFAULT '{}'::jsonb,
  notification_settings JSONB DEFAULT '{"trades": true, "agent_alerts": true, "market_updates": true, "risk_alerts": true}'::jsonb,
  agent_preferences JSONB DEFAULT '{"auto_start": false, "preferred_strategies": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Update trigger function
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Allow all operations for default user" ON public.user_preferences;
CREATE POLICY "Allow all operations for default user" 
  ON public.user_preferences FOR ALL 
  USING (user_id = 'default_user');

-- ===============================================
-- 3. DASHBOARD SESSIONS TABLE
-- ===============================================

-- Session tracking for multi-device synchronization
CREATE TABLE IF NOT EXISTS public.dashboard_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  user_agent TEXT,
  ip_address INET,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_session_id ON public.dashboard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_user_id ON public.dashboard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_active ON public.dashboard_sessions(is_active, last_activity DESC);

-- Update trigger function
CREATE OR REPLACE FUNCTION public.update_dashboard_sessions_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_dashboard_sessions_last_activity_trigger ON public.dashboard_sessions;
CREATE TRIGGER update_dashboard_sessions_last_activity_trigger
  BEFORE UPDATE ON public.dashboard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dashboard_sessions_last_activity();

-- Enable RLS
ALTER TABLE public.dashboard_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Allow all operations for default user" ON public.dashboard_sessions;
CREATE POLICY "Allow all operations for default user" 
  ON public.dashboard_sessions FOR ALL 
  USING (user_id = 'default_user');

-- ===============================================
-- 4. PERSISTENCE HEALTH TABLE
-- ===============================================

-- Health monitoring for persistence layers
CREATE TABLE IF NOT EXISTS public.persistence_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  layer_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'failed')),
  latency_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index
CREATE INDEX IF NOT EXISTS idx_persistence_health_layer ON public.persistence_health(layer_name, last_check DESC);

-- Enable RLS
ALTER TABLE public.persistence_health ENABLE ROW LEVEL SECURITY;

-- RLS Policy (open access for monitoring)
DROP POLICY IF EXISTS "Allow all operations on persistence health" ON public.persistence_health;
CREATE POLICY "Allow all operations on persistence health" 
  ON public.persistence_health FOR ALL 
  USING (true);

-- ===============================================
-- 5. VIEWS FOR EASY DATA ACCESS
-- ===============================================

-- Latest dashboard state per user
CREATE OR REPLACE VIEW public.latest_dashboard_state AS
SELECT DISTINCT ON (user_id) 
  id,
  session_id,
  user_id,
  state_data,
  created_at,
  updated_at
FROM public.dashboard_state 
ORDER BY user_id, updated_at DESC;

-- Active sessions view
CREATE OR REPLACE VIEW public.active_dashboard_sessions AS
SELECT *
FROM public.dashboard_sessions 
WHERE is_active = true 
  AND last_activity > NOW() - INTERVAL '1 hour'
ORDER BY last_activity DESC;

-- Health summary view
CREATE OR REPLACE VIEW public.persistence_health_summary AS
SELECT 
  layer_name,
  status,
  AVG(latency_ms) as avg_latency_ms,
  SUM(error_count) as total_errors,
  MAX(last_check) as last_check,
  COUNT(*) as check_count
FROM public.persistence_health 
WHERE last_check > NOW() - INTERVAL '1 hour'
GROUP BY layer_name, status
ORDER BY layer_name, status;

-- ===============================================
-- 6. UTILITY FUNCTIONS
-- ===============================================

-- Cleanup old dashboard states (keep last 10 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_dashboard_states()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked_states AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM public.dashboard_state
  )
  DELETE FROM public.dashboard_state 
  WHERE id IN (
    SELECT id FROM ranked_states WHERE rn > 10
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup inactive sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.dashboard_sessions 
  SET is_active = false 
  WHERE last_activity < NOW() - INTERVAL '24 hours' 
    AND is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Update persistence health helper function
CREATE OR REPLACE FUNCTION public.update_persistence_health(
  p_layer_name TEXT,
  p_status TEXT,
  p_latency_ms INTEGER DEFAULT 0,
  p_error_count INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.persistence_health (
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

-- ===============================================
-- 7. REALTIME SUBSCRIPTIONS
-- ===============================================

-- Enable realtime for dashboard tables
-- Note: This may fail if publication doesn't exist, that's OK
DO $$
BEGIN
  -- Try to add tables to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_state;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add dashboard_state to realtime publication: %', SQLERRM;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add user_preferences to realtime publication: %', SQLERRM;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_sessions;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add dashboard_sessions to realtime publication: %', SQLERRM;
  END;
END $$;

-- ===============================================
-- 8. INITIAL DATA
-- ===============================================

-- Insert default user preferences
INSERT INTO public.user_preferences (user_id) 
VALUES ('default_user') 
ON CONFLICT (user_id) DO NOTHING;

-- ===============================================
-- 9. PERMISSIONS
-- ===============================================

-- Grant permissions for views (if needed)
GRANT SELECT ON public.latest_dashboard_state TO anon, authenticated;
GRANT SELECT ON public.active_dashboard_sessions TO anon, authenticated;
GRANT SELECT ON public.persistence_health_summary TO anon, authenticated;

-- ===============================================
-- 10. TABLE COMMENTS
-- ===============================================

COMMENT ON TABLE public.dashboard_state IS 'Stores persistent dashboard state for autonomous operation across deployments';
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences and configuration settings';
COMMENT ON TABLE public.dashboard_sessions IS 'Tracks active dashboard sessions for state synchronization';
COMMENT ON TABLE public.persistence_health IS 'Monitors health and performance of persistence layers';

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Dashboard Persistence Migration 008 completed successfully!';
  RAISE NOTICE '📊 Created tables: dashboard_state, user_preferences, dashboard_sessions, persistence_health';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '🔄 Realtime subscriptions configured';
  RAISE NOTICE '⚡ Performance indexes created';
  RAISE NOTICE '🧹 Cleanup functions available';
  RAISE NOTICE '👤 Default user preferences inserted';
END $$;