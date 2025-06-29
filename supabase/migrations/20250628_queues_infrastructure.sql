-- Enable pgmq extension for Supabase Queues
-- This migration sets up the queue infrastructure for reliable message processing

-- Enable the pgmq extension
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Enable necessary extensions for queue monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create custom functions for queue management
CREATE OR REPLACE FUNCTION get_queue_depth(queue_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    depth INTEGER;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM pgmq.q_%I', queue_name) INTO depth;
    RETURN depth;
EXCEPTION
    WHEN others THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get comprehensive queue metrics
CREATE OR REPLACE FUNCTION get_all_queue_metrics()
RETURNS TABLE(
    queue_name TEXT,
    queue_length INTEGER,
    total_messages INTEGER,
    oldest_message_age INTERVAL,
    newest_message_age INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.queue_name::TEXT,
        m.queue_length::INTEGER,
        m.total_messages::INTEGER,
        m.oldest_msg_age,
        m.newest_msg_age
    FROM pgmq.metrics_all() m;
END;
$$ LANGUAGE plpgsql;

-- Create function for queue health monitoring
CREATE OR REPLACE FUNCTION check_queue_health()
RETURNS TABLE(
    queue_name TEXT,
    status TEXT,
    message_count INTEGER,
    max_age_seconds INTEGER,
    health_score NUMERIC
) AS $$
DECLARE
    rec RECORD;
    max_age_secs INTEGER;
    health_val NUMERIC;
BEGIN
    FOR rec IN 
        SELECT m.queue_name, m.queue_length, m.oldest_msg_age
        FROM pgmq.metrics_all() m
    LOOP
        -- Calculate max age in seconds
        max_age_secs := EXTRACT(EPOCH FROM COALESCE(rec.oldest_msg_age, INTERVAL '0'));
        
        -- Calculate health score (0-100)
        CASE
            WHEN rec.queue_length = 0 THEN health_val := 100.0;
            WHEN max_age_secs > 300 THEN health_val := 0.0;  -- Messages older than 5 minutes
            WHEN max_age_secs > 60 THEN health_val := 50.0;  -- Messages older than 1 minute
            ELSE health_val := 90.0;
        END CASE;
        
        -- Determine status
        queue_name := rec.queue_name::TEXT;
        message_count := rec.queue_length::INTEGER;
        max_age_seconds := max_age_secs;
        health_score := health_val;
        
        CASE
            WHEN health_val >= 90 THEN status := 'healthy';
            WHEN health_val >= 50 THEN status := 'warning';
            ELSE status := 'critical';
        END CASE;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create table for tracking queue configuration
CREATE TABLE IF NOT EXISTS queue_configurations (
    id SERIAL PRIMARY KEY,
    queue_name TEXT UNIQUE NOT NULL,
    visibility_timeout_seconds INTEGER DEFAULT 30,
    max_retries INTEGER DEFAULT 3,
    dead_letter_queue TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Insert default queue configurations
INSERT INTO queue_configurations (queue_name, visibility_timeout_seconds, max_retries, dead_letter_queue) VALUES
('agent_messages', 30, 3, 'agent_messages_dlq'),
('trading_orders', 60, 5, 'trading_orders_dlq'),
('risk_alerts', 10, 3, 'risk_alerts_dlq'),
('memory_updates', 30, 3, 'memory_updates_dlq'),
('dashboard_updates', 15, 2, 'dashboard_updates_dlq'),
('market_data', 5, 1, 'market_data_dlq')
ON CONFLICT (queue_name) DO NOTHING;

-- Create table for queue statistics tracking
CREATE TABLE IF NOT EXISTS queue_statistics (
    id SERIAL PRIMARY KEY,
    queue_name TEXT NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    messages_processed INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    average_processing_time_ms NUMERIC DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queue statistics queries
CREATE INDEX IF NOT EXISTS idx_queue_statistics_queue_name ON queue_statistics(queue_name);
CREATE INDEX IF NOT EXISTS idx_queue_statistics_last_activity ON queue_statistics(last_activity);

-- Create table for dead letter queue monitoring
CREATE TABLE IF NOT EXISTS dead_letter_analysis (
    id SERIAL PRIMARY KEY,
    original_queue TEXT NOT NULL,
    message_id TEXT NOT NULL,
    failure_reason TEXT,
    failure_count INTEGER DEFAULT 1,
    first_failure TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_failure TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_payload JSONB,
    resolved BOOLEAN DEFAULT FALSE
);

-- Create index for efficient DLQ analysis
CREATE INDEX IF NOT EXISTS idx_dlq_analysis_original_queue ON dead_letter_analysis(original_queue);
CREATE INDEX IF NOT EXISTS idx_dlq_analysis_resolved ON dead_letter_analysis(resolved);

-- Function to update queue statistics
CREATE OR REPLACE FUNCTION update_queue_stats(
    p_queue_name TEXT,
    p_messages_sent INTEGER DEFAULT 0,
    p_messages_processed INTEGER DEFAULT 0,
    p_messages_failed INTEGER DEFAULT 0,
    p_processing_time_ms NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO queue_statistics (
        queue_name,
        messages_sent,
        messages_processed,
        messages_failed,
        average_processing_time_ms,
        last_activity
    ) VALUES (
        p_queue_name,
        p_messages_sent,
        p_messages_processed,
        p_messages_failed,
        p_processing_time_ms,
        NOW()
    )
    ON CONFLICT (queue_name) DO UPDATE SET
        messages_sent = queue_statistics.messages_sent + EXCLUDED.messages_sent,
        messages_processed = queue_statistics.messages_processed + EXCLUDED.messages_processed,
        messages_failed = queue_statistics.messages_failed + EXCLUDED.messages_failed,
        average_processing_time_ms = (
            (queue_statistics.average_processing_time_ms * queue_statistics.messages_processed + 
             EXCLUDED.average_processing_time_ms * EXCLUDED.messages_processed) /
            NULLIF(queue_statistics.messages_processed + EXCLUDED.messages_processed, 0)
        ),
        last_activity = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log dead letter queue entries
CREATE OR REPLACE FUNCTION log_dlq_message(
    p_original_queue TEXT,
    p_message_id TEXT,
    p_failure_reason TEXT,
    p_message_payload JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO dead_letter_analysis (
        original_queue,
        message_id,
        failure_reason,
        message_payload
    ) VALUES (
        p_original_queue,
        p_message_id,
        p_failure_reason,
        p_message_payload
    )
    ON CONFLICT (message_id) DO UPDATE SET
        failure_count = dead_letter_analysis.failure_count + 1,
        last_failure = NOW(),
        failure_reason = EXCLUDED.failure_reason;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on queue management tables
ALTER TABLE queue_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Queue configurations are viewable by authenticated users" ON queue_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Queue statistics are viewable by authenticated users" ON queue_statistics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dead letter analysis is viewable by authenticated users" ON dead_letter_analysis
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA pgmq TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pgmq TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO authenticated;

-- Grant permissions on our custom tables
GRANT SELECT, INSERT, UPDATE ON queue_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON queue_statistics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON dead_letter_analysis TO authenticated;

-- Grant permissions on our custom functions
GRANT EXECUTE ON FUNCTION get_queue_depth(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_queue_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION check_queue_health() TO authenticated;
GRANT EXECUTE ON FUNCTION update_queue_stats(TEXT, INTEGER, INTEGER, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION log_dlq_message(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Create a view for easy queue monitoring
CREATE OR REPLACE VIEW queue_health_dashboard AS
SELECT 
    qc.queue_name,
    qc.visibility_timeout_seconds,
    qc.max_retries,
    qc.dead_letter_queue,
    qc.active,
    COALESCE(get_queue_depth(qc.queue_name), 0) as current_depth,
    qs.messages_sent,
    qs.messages_processed,
    qs.messages_failed,
    qs.average_processing_time_ms,
    qs.last_activity,
    CASE 
        WHEN qs.messages_sent > 0 THEN 
            ROUND((qs.messages_processed::NUMERIC / qs.messages_sent::NUMERIC) * 100, 2)
        ELSE 0 
    END as success_rate_percent
FROM queue_configurations qc
LEFT JOIN queue_statistics qs ON qc.queue_name = qs.queue_name
WHERE qc.active = true
ORDER BY qc.queue_name;

-- Grant access to the view
GRANT SELECT ON queue_health_dashboard TO authenticated;

-- Add helpful comments
COMMENT ON TABLE queue_configurations IS 'Configuration settings for each queue including timeouts and retry policies';
COMMENT ON TABLE queue_statistics IS 'Runtime statistics and performance metrics for queue operations';
COMMENT ON TABLE dead_letter_analysis IS 'Analysis and tracking of failed messages that ended up in dead letter queues';
COMMENT ON VIEW queue_health_dashboard IS 'Comprehensive view of queue health, performance, and configuration';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Queue infrastructure migration completed successfully';
    RAISE NOTICE 'Available queues: agent_messages, trading_orders, risk_alerts, memory_updates, dashboard_updates, market_data';
    RAISE NOTICE 'Use queue_health_dashboard view to monitor queue performance';
END $$;