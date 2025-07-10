-- System Diagnostics and Monitoring Tables Migration
-- Purpose: Add comprehensive system monitoring, performance tracking, and diagnostic capabilities
-- Generated: 2025-01-09
-- Priority: 5 (Important for System Dashboard functionality)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- SYSTEM MONITORING AND DIAGNOSTICS TABLES
-- ==============================================

-- System health monitoring and metrics
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Service identification
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('frontend', 'backend', 'database', 'cache', 'websocket', 'external_api', 'ai_service')),
  instance_id TEXT,
  version TEXT,
  
  -- Health metrics
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'maintenance', 'unknown')),
  uptime_seconds BIGINT DEFAULT 0,
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Resource utilization
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_percent DECIMAL(5,2),
  disk_usage_percent DECIMAL(5,2),
  network_latency_ms INTEGER,
  
  -- Performance metrics
  requests_per_minute INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  cache_hit_rate DECIMAL(5,4),
  
  -- Service-specific metrics
  database_connections INTEGER,
  queue_size INTEGER,
  active_sessions INTEGER,
  custom_metrics JSONB DEFAULT '{}',
  
  -- Geographical and deployment info
  region TEXT,
  availability_zone TEXT,
  deployment_environment TEXT DEFAULT 'production' CHECK (deployment_environment IN ('development', 'staging', 'production')),
  
  -- Status metadata
  last_error_message TEXT,
  error_count_1h INTEGER DEFAULT 0,
  error_count_24h INTEGER DEFAULT 0,
  dependencies_status JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metric identification
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer', 'rate')),
  service_name TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Metric values
  value DECIMAL(20,8) NOT NULL,
  unit TEXT DEFAULT 'count',
  tags JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  
  -- Aggregation info
  aggregation_period TEXT DEFAULT '1m' CHECK (aggregation_period IN ('1m', '5m', '15m', '1h', '1d')),
  sample_count INTEGER DEFAULT 1,
  min_value DECIMAL(20,8),
  max_value DECIMAL(20,8),
  avg_value DECIMAL(20,8),
  
  -- Metric context
  operation_name TEXT,
  endpoint TEXT,
  user_agent TEXT,
  ip_address INET,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error tracking and logging
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Error identification
  error_id TEXT,
  error_hash TEXT, -- Hash of error message for grouping
  service_name TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Error details
  error_level TEXT NOT NULL CHECK (error_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  error_type TEXT,
  error_message TEXT NOT NULL,
  error_stack_trace TEXT,
  
  -- Context information
  operation_name TEXT,
  function_name TEXT,
  file_name TEXT,
  line_number INTEGER,
  
  -- Request context
  request_id TEXT,
  session_id TEXT,
  user_id TEXT,
  endpoint TEXT,
  http_method TEXT,
  
  -- Environment context
  environment TEXT DEFAULT 'production',
  version TEXT,
  deployment_id TEXT,
  
  -- Error metadata
  additional_data JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  
  -- Resolution tracking
  is_resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail for important system events
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event identification
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('authentication', 'authorization', 'data_access', 'configuration', 'trading', 'system', 'security')),
  action TEXT NOT NULL,
  
  -- Actor information
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system', 'api')),
  actor_id TEXT,
  actor_name TEXT,
  session_id TEXT,
  
  -- Target information
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  
  -- Event details
  description TEXT NOT NULL,
  outcome TEXT CHECK (outcome IN ('success', 'failure', 'partial')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  source_system TEXT,
  api_endpoint TEXT,
  
  -- Changes made
  changes_made JSONB DEFAULT '{}',
  previous_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  
  -- Metadata
  additional_metadata JSONB DEFAULT '{}',
  correlation_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts and notifications
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Alert identification
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold', 'anomaly', 'error', 'security', 'performance', 'availability')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Alert source
  service_name TEXT NOT NULL,
  metric_name TEXT,
  rule_name TEXT,
  
  -- Alert details
  description TEXT NOT NULL,
  current_value DECIMAL(20,8),
  threshold_value DECIMAL(20,8),
  deviation_percent DECIMAL(8,4),
  
  -- Alert status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Notification settings
  notification_channels TEXT[] DEFAULT '{}',
  notification_sent BOOLEAN DEFAULT false,
  escalation_level INTEGER DEFAULT 1,
  
  -- Alert metadata
  affected_components TEXT[] DEFAULT '{}',
  remediation_steps TEXT,
  runbook_url TEXT,
  tags JSONB DEFAULT '[]',
  
  -- Recurrence tracking
  first_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database performance monitoring
CREATE TABLE IF NOT EXISTS database_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Database identification
  database_name TEXT NOT NULL DEFAULT 'main',
  schema_name TEXT DEFAULT 'public',
  table_name TEXT,
  
  -- Connection metrics
  active_connections INTEGER DEFAULT 0,
  idle_connections INTEGER DEFAULT 0,
  max_connections INTEGER DEFAULT 100,
  connection_pool_usage DECIMAL(5,4) DEFAULT 0,
  
  -- Query performance
  avg_query_time_ms DECIMAL(10,3) DEFAULT 0,
  slow_queries_count INTEGER DEFAULT 0,
  blocked_queries_count INTEGER DEFAULT 0,
  deadlocks_count INTEGER DEFAULT 0,
  
  -- Storage metrics
  database_size_mb DECIMAL(15,3) DEFAULT 0,
  table_size_mb DECIMAL(15,3) DEFAULT 0,
  index_size_mb DECIMAL(15,3) DEFAULT 0,
  free_space_mb DECIMAL(15,3) DEFAULT 0,
  
  -- Transaction metrics
  transactions_per_second DECIMAL(10,3) DEFAULT 0,
  commits_per_second DECIMAL(10,3) DEFAULT 0,
  rollbacks_per_second DECIMAL(10,3) DEFAULT 0,
  
  -- Cache metrics
  buffer_hit_ratio DECIMAL(5,4) DEFAULT 0,
  index_hit_ratio DECIMAL(5,4) DEFAULT 0,
  
  -- Specific table metrics
  table_scan_count INTEGER DEFAULT 0,
  index_scan_count INTEGER DEFAULT 0,
  insert_count INTEGER DEFAULT 0,
  update_count INTEGER DEFAULT 0,
  delete_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API endpoint performance tracking
CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Endpoint identification
  endpoint_path TEXT NOT NULL,
  http_method TEXT NOT NULL,
  service_name TEXT NOT NULL,
  
  -- Request metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  client_errors INTEGER DEFAULT 0, -- 4xx
  server_errors INTEGER DEFAULT 0, -- 5xx
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(10,3) DEFAULT 0,
  min_response_time_ms DECIMAL(10,3) DEFAULT 0,
  max_response_time_ms DECIMAL(10,3) DEFAULT 0,
  p95_response_time_ms DECIMAL(10,3) DEFAULT 0,
  p99_response_time_ms DECIMAL(10,3) DEFAULT 0,
  
  -- Throughput metrics
  requests_per_minute DECIMAL(10,3) DEFAULT 0,
  bytes_sent BIGINT DEFAULT 0,
  bytes_received BIGINT DEFAULT 0,
  
  -- Aggregation period
  aggregation_period TEXT DEFAULT '5m' CHECK (aggregation_period IN ('1m', '5m', '15m', '1h', '1d')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Additional context
  user_agents JSONB DEFAULT '{}',
  ip_addresses JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(endpoint_path, http_method, service_name, aggregation_period, period_start)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name, service_type);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_updated_at ON system_health(updated_at);
CREATE INDEX IF NOT EXISTS idx_system_health_error_rate ON system_health(error_rate DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_service ON performance_metrics(metric_name, service_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agent ON performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tags ON performance_metrics USING gin(tags);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_service_level ON error_logs(service_name, error_level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_hash ON error_logs(error_hash);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_agent ON error_logs(agent_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type, event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);

-- System alerts indexes
CREATE INDEX IF NOT EXISTS idx_system_alerts_service_severity ON system_alerts(service_name, severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);

-- Database metrics indexes
CREATE INDEX IF NOT EXISTS idx_database_metrics_table ON database_metrics(database_name, table_name);
CREATE INDEX IF NOT EXISTS idx_database_metrics_created_at ON database_metrics(created_at);

-- API metrics indexes
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint_path, http_method);
CREATE INDEX IF NOT EXISTS idx_api_metrics_service ON api_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_api_metrics_period ON api_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_api_metrics_response_time ON api_metrics(avg_response_time_ms DESC);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all system tables
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON system_health FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON performance_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON error_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON system_alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON database_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON api_metrics FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample system health data
INSERT INTO system_health (service_name, service_type, status, uptime_seconds, response_time_ms, error_rate, cpu_usage_percent, memory_usage_percent, requests_per_minute, successful_requests, failed_requests, cache_hit_rate) VALUES
('cival-dashboard-frontend', 'frontend', 'healthy', 86400, 45, 0.001, 15.5, 32.1, 150, 8950, 5, 0.95),
('trading-api-service', 'backend', 'healthy', 172800, 120, 0.005, 45.2, 68.3, 75, 4480, 25, 0.88),
('supabase-postgres', 'database', 'healthy', 604800, 25, 0.0001, 25.8, 55.7, 200, 11950, 2, 0.92),
('redis-cache', 'cache', 'healthy', 432000, 8, 0.0005, 12.3, 28.4, 500, 29750, 15, 0.98),
('websocket-service', 'websocket', 'healthy', 259200, 35, 0.002, 18.7, 41.2, 300, 17850, 35, null),
('openrouter-api', 'external_api', 'degraded', 518400, 450, 0.025, null, null, 25, 1475, 38, null),
('serpapi-service', 'external_api', 'healthy', 345600, 180, 0.008, null, null, 40, 2380, 20, null)
ON CONFLICT DO NOTHING;

-- Insert sample performance metrics
INSERT INTO performance_metrics (metric_name, metric_type, service_name, value, unit, tags, operation_name) VALUES
('http_requests_total', 'counter', 'trading-api-service', 15234, 'requests', '{"endpoint": "/api/portfolio", "method": "GET"}', 'get_portfolio'),
('response_time_histogram', 'histogram', 'trading-api-service', 125.5, 'milliseconds', '{"endpoint": "/api/trades", "method": "POST"}', 'create_trade'),
('database_query_duration', 'timer', 'supabase-postgres', 45.2, 'milliseconds', '{"table": "agents", "operation": "select"}', 'query_agents'),
('cache_hit_ratio', 'gauge', 'redis-cache', 0.92, 'ratio', '{"cache_type": "market_data"}', 'cache_lookup'),
('websocket_connections', 'gauge', 'websocket-service', 245, 'connections', '{"type": "active"}', 'connection_count'),
('ai_requests_per_minute', 'rate', 'openrouter-api', 12.5, 'requests_per_minute', '{"model": "claude-3.5-sonnet"}', 'llm_request'),
('search_api_latency', 'timer', 'serpapi-service', 180.3, 'milliseconds', '{"search_type": "financial_news"}', 'web_search')
ON CONFLICT DO NOTHING;

-- Insert sample error logs
INSERT INTO error_logs (service_name, error_level, error_type, error_message, operation_name, request_id, is_resolved) VALUES
('trading-api-service', 'warning', 'ValidationError', 'Invalid symbol format in trading request: "BTC-USD" should be "BTCUSD"', 'validate_trade_request', 'req_7f8e9d2a', true),
('supabase-postgres', 'error', 'ConnectionError', 'Connection pool exhausted, waited 30s for available connection', 'database_connect', 'db_conn_timeout_001', false),
('websocket-service', 'info', 'ConnectionClosed', 'WebSocket connection closed by client', 'websocket_cleanup', 'ws_close_normal_002', true),
('openrouter-api', 'error', 'APIError', 'Rate limit exceeded for model claude-3.5-sonnet: 60 requests per minute', 'llm_request', 'or_rate_limit_003', false),
('cival-dashboard-frontend', 'warning', 'RenderError', 'Component rendered with null portfolio data, using fallback', 'portfolio_render', 'frontend_null_004', true)
ON CONFLICT DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_logs (event_type, event_category, action, actor_type, actor_id, actor_name, target_type, target_id, description, outcome, risk_level, ip_address) VALUES
('agent_created', 'configuration', 'create', 'user', 'user_123', 'admin@cival.ai', 'agent', 'agent_456', 'Created new trading agent "Momentum Trader v2" with $10,000 allocation', 'success', 'medium', '192.168.1.100'),
('trade_executed', 'trading', 'execute', 'agent', 'agent_456', 'Momentum Trader v2', 'trade', 'trade_789', 'Executed BUY order for 0.5 BTC at $45,230.50', 'success', 'low', null),
('api_key_rotated', 'security', 'update', 'system', 'system', 'Auto Security Service', 'api_key', 'key_abc123', 'Automatically rotated OpenRouter API key due to scheduled rotation', 'success', 'low', null),
('unauthorized_access_attempt', 'security', 'access_denied', 'api', 'unknown', 'Unauthorized API Client', 'endpoint', '/api/admin/users', 'Attempted access to admin endpoint without proper authentication', 'failure', 'high', '203.0.113.45'),
('vault_withdrawal', 'trading', 'withdraw', 'agent', 'agent_789', 'DeFi Yield Farmer', 'vault', 'vault_custody_001', 'Withdrew $5,000 from custody vault for yield farming opportunity', 'success', 'medium', null)
ON CONFLICT DO NOTHING;

-- Insert sample system alerts
INSERT INTO system_alerts (alert_name, alert_type, severity, service_name, metric_name, description, current_value, threshold_value, status, affected_components) VALUES
('High Error Rate', 'threshold', 'warning', 'openrouter-api', 'error_rate', 'Error rate exceeded 2% threshold for OpenRouter API service', 2.5, 2.0, 'active', '{"openrouter-api", "ai-analysis-service"}'),
('Database Connection Pool Near Limit', 'threshold', 'warning', 'supabase-postgres', 'connection_pool_usage', 'Database connection pool usage above 85%', 88.5, 85.0, 'acknowledged', '{"supabase-postgres", "trading-api-service"}'),
('Disk Space Low', 'threshold', 'error', 'cival-dashboard-frontend', 'disk_usage_percent', 'Disk space usage above 90% on frontend service', 92.3, 90.0, 'active', '{"cival-dashboard-frontend"}'),
('WebSocket Connection Spike', 'anomaly', 'info', 'websocket-service', 'active_connections', 'Unusual spike in WebSocket connections detected', 450, 300, 'resolved', '{"websocket-service"}'),
('API Response Time Degraded', 'performance', 'warning', 'trading-api-service', 'avg_response_time_ms', 'Average API response time exceeded 200ms', 245.8, 200.0, 'active', '{"trading-api-service", "database"}}')
ON CONFLICT DO NOTHING;

-- Insert sample database metrics
INSERT INTO database_metrics (database_name, active_connections, max_connections, avg_query_time_ms, database_size_mb, transactions_per_second, buffer_hit_ratio, index_hit_ratio) VALUES
('cival_dashboard', 15, 100, 45.2, 2048.5, 125.3, 0.95, 0.88),
('cival_dashboard', 12, 100, 38.7, 2048.5, 98.7, 0.94, 0.91),
('cival_dashboard', 18, 100, 52.1, 2048.5, 143.2, 0.93, 0.87)
ON CONFLICT DO NOTHING;

-- Insert sample API metrics
INSERT INTO api_metrics (endpoint_path, http_method, service_name, total_requests, successful_requests, client_errors, server_errors, avg_response_time_ms, requests_per_minute, period_start, period_end) VALUES
('/api/portfolio/summary', 'GET', 'trading-api-service', 1250, 1238, 8, 4, 85.3, 25.0, NOW() - INTERVAL '5 minutes', NOW()),
('/api/agents/status', 'GET', 'trading-api-service', 890, 885, 3, 2, 45.7, 17.8, NOW() - INTERVAL '5 minutes', NOW()),
('/api/trades', 'POST', 'trading-api-service', 156, 152, 3, 1, 180.2, 3.1, NOW() - INTERVAL '5 minutes', NOW()),
('/api/market/live-data/{symbol}', 'GET', 'trading-api-service', 3420, 3398, 15, 7, 120.5, 68.4, NOW() - INTERVAL '5 minutes', NOW()),
('/api/risk/metrics', 'GET', 'trading-api-service', 245, 242, 2, 1, 95.8, 4.9, NOW() - INTERVAL '5 minutes', NOW())
ON CONFLICT (endpoint_path, http_method, service_name, aggregation_period, period_start) DO NOTHING;

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all system tables
ALTER PUBLICATION supabase_realtime ADD TABLE system_health;
ALTER PUBLICATION supabase_realtime ADD TABLE performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE system_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE database_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE api_metrics;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to auto-resolve alerts based on metrics
CREATE OR REPLACE FUNCTION check_alert_resolution()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-resolve threshold alerts when metric returns to normal
  IF NEW.current_value IS NOT NULL AND NEW.threshold_value IS NOT NULL THEN
    -- For error rate and usage metrics (lower is better)
    IF NEW.metric_name IN ('error_rate', 'cpu_usage_percent', 'memory_usage_percent', 'disk_usage_percent') THEN
      IF NEW.current_value < NEW.threshold_value * 0.9 AND NEW.status = 'active' THEN
        NEW.status := 'resolved';
        NEW.resolved_at := NOW();
      END IF;
    -- For performance metrics like response time (lower is better)
    ELSIF NEW.metric_name IN ('response_time_ms', 'avg_response_time_ms') THEN
      IF NEW.current_value < NEW.threshold_value * 0.8 AND NEW.status = 'active' THEN
        NEW.status := 'resolved';
        NEW.resolved_at := NOW();
      END IF;
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for alert resolution
CREATE TRIGGER check_alert_resolution_trigger
  BEFORE UPDATE ON system_alerts
  FOR EACH ROW EXECUTE FUNCTION check_alert_resolution();

-- Function to aggregate error counts
CREATE OR REPLACE FUNCTION update_error_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update hourly and daily error counts in system_health
  UPDATE system_health
  SET 
    error_count_1h = (
      SELECT COUNT(*)
      FROM error_logs
      WHERE service_name = NEW.service_name
        AND error_level IN ('error', 'critical')
        AND created_at >= NOW() - INTERVAL '1 hour'
    ),
    error_count_24h = (
      SELECT COUNT(*)
      FROM error_logs
      WHERE service_name = NEW.service_name
        AND error_level IN ('error', 'critical')
        AND created_at >= NOW() - INTERVAL '24 hours'
    ),
    last_error_message = CASE
      WHEN NEW.error_level IN ('error', 'critical') THEN NEW.error_message
      ELSE system_health.last_error_message
    END,
    updated_at = NOW()
  WHERE service_name = NEW.service_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for error count updates
CREATE TRIGGER update_error_counts_trigger
  AFTER INSERT ON error_logs
  FOR EACH ROW EXECUTE FUNCTION update_error_counts();

-- Add triggers for updated_at columns
CREATE TRIGGER update_system_health_updated_at BEFORE UPDATE ON system_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'System Diagnostics Migration completed successfully!';
  RAISE NOTICE 'Tables created: system_health, performance_metrics, error_logs, audit_logs, system_alerts, database_metrics, api_metrics';
  RAISE NOTICE 'Sample data inserted for comprehensive system monitoring';
  RAISE NOTICE 'Performance tracking and error aggregation configured';
  RAISE NOTICE 'Audit logging for security and compliance enabled';
  RAISE NOTICE 'Alert management with auto-resolution logic implemented';
  RAISE NOTICE 'Realtime subscriptions enabled for all system tables';
  RAISE NOTICE 'System dashboard ready for comprehensive monitoring!';
END $$;