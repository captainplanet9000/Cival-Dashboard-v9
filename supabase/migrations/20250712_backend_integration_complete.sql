-- Migration: Backend Integration Complete
-- Date: July 12, 2025
-- Description: Complete backend API integration for all dashboard components

-- Create backend integration tracking table
CREATE TABLE IF NOT EXISTS backend_integration_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name text NOT NULL,
    integration_status text NOT NULL DEFAULT 'active',
    api_endpoints jsonb,
    fallback_mechanism text,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Insert integration status for completed components
INSERT INTO backend_integration_log (component_name, integration_status, api_endpoints, fallback_mechanism) VALUES
('ConnectedTradingTab', 'active', '["createTradingOrder", "getTradingPositions"]', 'paper_trading_engine'),
('ConnectedAgentsTab', 'active', '["startAgent", "stopAgent", "deleteAgent", "updateAgent"]', 'mock_data'),
('AutonomousCoordinatorStatus', 'active', '["getCoordinatorStatus", "getSystemConnections"]', 'mock_data'),
('ConnectedAnalyticsTab', 'active', '["getPerformanceAnalytics", "getRiskMetrics"]', 'mock_data'),
('ConnectedFarmsTab', 'active', '["getFarmStatus", "updateFarmConfiguration"]', 'mock_data');

-- Create API response cache table for fallback scenarios
CREATE TABLE IF NOT EXISTS api_response_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint_name text NOT NULL,
    request_params jsonb,
    response_data jsonb,
    cache_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create backend health monitoring table
CREATE TABLE IF NOT EXISTS backend_health_monitor (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name text NOT NULL,
    health_status text NOT NULL DEFAULT 'unknown',
    response_time_ms integer,
    last_check timestamp with time zone DEFAULT now(),
    error_message text,
    consecutive_failures integer DEFAULT 0
);

-- Insert initial health monitoring entries
INSERT INTO backend_health_monitor (service_name, health_status) VALUES
('backend_api_client', 'active'),
('coordinator_service', 'active'),
('trading_service', 'active'),
('agent_management_service', 'active'),
('analytics_service', 'active');

-- Create RLS policies for backend integration tables
ALTER TABLE backend_integration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE backend_health_monitor ENABLE ROW LEVEL SECURITY;

-- Allow public access for dashboard integration
CREATE POLICY "Allow public read access on backend_integration_log" ON backend_integration_log FOR SELECT USING (true);
CREATE POLICY "Allow public read access on api_response_cache" ON api_response_cache FOR SELECT USING (true);
CREATE POLICY "Allow public read access on backend_health_monitor" ON backend_health_monitor FOR SELECT USING (true);

-- Allow system updates
CREATE POLICY "Allow system updates on backend_health_monitor" ON backend_health_monitor FOR ALL USING (true);
CREATE POLICY "Allow system updates on api_response_cache" ON api_response_cache FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backend_integration_log_component ON backend_integration_log(component_name);
CREATE INDEX IF NOT EXISTS idx_api_response_cache_endpoint ON api_response_cache(endpoint_name);
CREATE INDEX IF NOT EXISTS idx_backend_health_monitor_service ON backend_health_monitor(service_name);
CREATE INDEX IF NOT EXISTS idx_backend_health_monitor_last_check ON backend_health_monitor(last_check);

-- Create function to update backend health status
CREATE OR REPLACE FUNCTION update_backend_health(
    p_service_name text,
    p_health_status text,
    p_response_time_ms integer DEFAULT NULL,
    p_error_message text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO backend_health_monitor (service_name, health_status, response_time_ms, error_message, last_check)
    VALUES (p_service_name, p_health_status, p_response_time_ms, p_error_message, now())
    ON CONFLICT (service_name) 
    DO UPDATE SET 
        health_status = EXCLUDED.health_status,
        response_time_ms = EXCLUDED.response_time_ms,
        error_message = EXCLUDED.error_message,
        last_check = now(),
        consecutive_failures = CASE 
            WHEN EXCLUDED.health_status = 'error' THEN backend_health_monitor.consecutive_failures + 1
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cache API responses
CREATE OR REPLACE FUNCTION cache_api_response(
    p_endpoint_name text,
    p_request_params jsonb,
    p_response_data jsonb,
    p_cache_duration_minutes integer DEFAULT 5
) RETURNS void AS $$
BEGIN
    INSERT INTO api_response_cache (endpoint_name, request_params, response_data, cache_expires_at)
    VALUES (p_endpoint_name, p_request_params, p_response_data, now() + (p_cache_duration_minutes || ' minutes')::interval)
    ON CONFLICT (endpoint_name, request_params)
    DO UPDATE SET
        response_data = EXCLUDED.response_data,
        cache_expires_at = EXCLUDED.cache_expires_at,
        created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cached API response
CREATE OR REPLACE FUNCTION get_cached_api_response(
    p_endpoint_name text,
    p_request_params jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb AS $$
DECLARE
    cached_response jsonb;
BEGIN
    SELECT response_data INTO cached_response
    FROM api_response_cache
    WHERE endpoint_name = p_endpoint_name
    AND request_params = p_request_params
    AND cache_expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN cached_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable realtime for backend monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE backend_health_monitor;
ALTER PUBLICATION supabase_realtime ADD TABLE backend_integration_log;

COMMENT ON TABLE backend_integration_log IS 'Tracks status of backend API integration for dashboard components';
COMMENT ON TABLE api_response_cache IS 'Caches API responses for fallback scenarios when backend is unavailable';
COMMENT ON TABLE backend_health_monitor IS 'Monitors health and performance of backend services';