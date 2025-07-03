-- Real-time Subscriptions Configuration for Enhanced Database Schema - FIXED VERSION
-- This script enables real-time features for all relevant tables
-- Created: 2025-01-02 - Fixed to avoid column reference issues

-- ===============================================
-- ENABLE REAL-TIME ON RELEVANT TABLES
-- ===============================================

-- Enable real-time on blockchain tables for live wallet updates
ALTER publication supabase_realtime ADD TABLE public.blockchain_wallets;
ALTER publication supabase_realtime ADD TABLE public.blockchain_transactions;
ALTER publication supabase_realtime ADD TABLE public.cross_chain_operations;
ALTER publication supabase_realtime ADD TABLE public.blockchain_achievements;

-- Enable real-time on event system tables
ALTER publication supabase_realtime ADD TABLE public.system_events;
ALTER publication supabase_realtime ADD TABLE public.event_subscriptions;
ALTER publication supabase_realtime ADD TABLE public.realtime_metrics;

-- Enable real-time on notification tables
ALTER publication supabase_realtime ADD TABLE public.notifications;
ALTER publication supabase_realtime ADD TABLE public.enhanced_system_alerts;

-- Enable real-time on performance tables
ALTER publication supabase_realtime ADD TABLE public.performance_benchmarks;
ALTER publication supabase_realtime ADD TABLE public.enhanced_market_analysis;
ALTER publication supabase_realtime ADD TABLE public.system_health;

-- Enable real-time on ML predictions for live updates
ALTER publication supabase_realtime ADD TABLE public.ml_predictions;

-- ===============================================
-- REAL-TIME EVENT TRIGGERS
-- ===============================================

-- Function to emit custom real-time events
CREATE OR REPLACE FUNCTION emit_realtime_event()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
    event_type TEXT;
BEGIN
    -- Determine event type based on table and operation
    event_type := TG_TABLE_NAME || '.' || lower(TG_OP);
    
    -- Create payload based on operation
    IF TG_OP = 'DELETE' THEN
        payload := json_build_object(
            'event_type', event_type,
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old_record', row_to_json(OLD),
            'timestamp', extract(epoch from now())
        );
    ELSE
        payload := json_build_object(
            'event_type', event_type,
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'record', row_to_json(NEW),
            'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
            'timestamp', extract(epoch from now())
        );
    END IF;
    
    -- Emit the event
    PERFORM pg_notify('realtime_events', payload::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- ATTACH TRIGGERS TO KEY TABLES
-- ===============================================

-- Blockchain wallet balance updates
CREATE TRIGGER blockchain_wallets_realtime_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.blockchain_wallets
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- New blockchain transactions
CREATE TRIGGER blockchain_transactions_realtime_trigger
    AFTER INSERT OR UPDATE ON public.blockchain_transactions
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- Cross-chain operation updates
CREATE TRIGGER cross_chain_operations_realtime_trigger
    AFTER INSERT OR UPDATE ON public.cross_chain_operations
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- New achievements
CREATE TRIGGER blockchain_achievements_realtime_trigger
    AFTER INSERT OR UPDATE ON public.blockchain_achievements
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- System event creation
CREATE TRIGGER system_events_realtime_trigger
    AFTER INSERT ON public.system_events
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- Real-time metrics updates
CREATE TRIGGER realtime_metrics_trigger
    AFTER INSERT ON public.realtime_metrics
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- New notifications
CREATE TRIGGER notifications_realtime_trigger
    AFTER INSERT OR UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- System alerts
CREATE TRIGGER system_alerts_realtime_trigger
    AFTER INSERT OR UPDATE ON public.enhanced_system_alerts
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- Performance benchmark updates
CREATE TRIGGER performance_benchmarks_realtime_trigger
    AFTER INSERT ON public.performance_benchmarks
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- Market analysis updates
CREATE TRIGGER market_analysis_realtime_trigger
    AFTER INSERT ON public.enhanced_market_analysis
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- ML prediction updates
CREATE TRIGGER ml_predictions_realtime_trigger
    AFTER INSERT OR UPDATE ON public.ml_predictions
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- System health updates
CREATE TRIGGER system_health_realtime_trigger
    AFTER INSERT OR UPDATE ON public.system_health
    FOR EACH ROW EXECUTE FUNCTION emit_realtime_event();

-- ===============================================
-- REAL-TIME CLEANUP FUNCTIONS
-- ===============================================

-- Function to clean up old real-time data
CREATE OR REPLACE FUNCTION cleanup_realtime_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up old system events (keep last 24 hours)
    DELETE FROM public.system_events 
    WHERE created_at < NOW() - INTERVAL '24 hours' AND processed = true;
    
    -- Clean up old real-time metrics (keep last 7 days by default)
    DELETE FROM public.realtime_metrics 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Clean up old performance benchmarks (keep last 30 days)
    DELETE FROM public.performance_benchmarks 
    WHERE calculated_at < NOW() - INTERVAL '30 days';
    
    -- Clean up expired ML predictions
    DELETE FROM public.ml_predictions 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Clean up old market analysis (keep last 7 days)
    DELETE FROM public.enhanced_market_analysis 
    WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- REAL-TIME METRICS AGGREGATION
-- ===============================================

-- Function to aggregate real-time metrics for dashboard
CREATE OR REPLACE FUNCTION aggregate_realtime_metrics(
    time_period INTERVAL DEFAULT '1 hour'
)
RETURNS TABLE(
    metric_name TEXT,
    source_type TEXT,
    avg_value DECIMAL,
    min_value DECIMAL,
    max_value DECIMAL,
    count_values BIGINT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.metric_name,
        rm.source_type,
        AVG(rm.metric_value) as avg_value,
        MIN(rm.metric_value) as min_value,
        MAX(rm.metric_value) as max_value,
        COUNT(*) as count_values,
        date_trunc('hour', MIN(rm.timestamp)) as period_start,
        date_trunc('hour', MAX(rm.timestamp)) as period_end
    FROM public.realtime_metrics rm
    WHERE rm.timestamp >= NOW() - time_period
    GROUP BY rm.metric_name, rm.source_type, date_trunc('hour', rm.timestamp)
    ORDER BY period_start DESC, rm.metric_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- BASIC DASHBOARD DATA FUNCTION
-- ===============================================

-- Simplified function to get live dashboard data
CREATE OR REPLACE FUNCTION get_basic_dashboard_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    agent_count INTEGER;
    total_portfolio DECIMAL;
    active_alerts INTEGER;
    recent_events INTEGER;
BEGIN
    -- Get user's agent count
    SELECT COUNT(*) INTO agent_count
    FROM public.agents WHERE user_id = user_uuid;
    
    -- Get total portfolio value from blockchain wallets
    SELECT COALESCE(SUM(balance + native_balance), 0) INTO total_portfolio
    FROM public.blockchain_wallets bw
    LEFT JOIN public.agents a ON bw.agent_id = a.id
    WHERE bw.user_id = user_uuid OR a.user_id = user_uuid;
    
    -- Get active alerts count
    SELECT COUNT(*) INTO active_alerts
    FROM public.enhanced_system_alerts
    WHERE is_resolved = false;
    
    -- Get recent events count (last hour)
    SELECT COUNT(*) INTO recent_events
    FROM public.system_events
    WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND (broadcast = true OR user_uuid = ANY(target_users));
    
    -- Build result JSON
    result := json_build_object(
        'timestamp', extract(epoch from now()),
        'agent_count', agent_count,
        'total_portfolio_value', total_portfolio,
        'active_alerts', active_alerts,
        'recent_events', recent_events,
        'status', 'live'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- COMMENTS AND DOCUMENTATION
-- ===============================================

COMMENT ON FUNCTION emit_realtime_event() IS 
'Trigger function that emits real-time events for table changes';

COMMENT ON FUNCTION cleanup_realtime_data() IS 
'Clean up old real-time data based on retention policies';

COMMENT ON FUNCTION aggregate_realtime_metrics() IS 
'Aggregate real-time metrics for dashboard display';

COMMENT ON FUNCTION get_basic_dashboard_data() IS 
'Get basic live dashboard data for a specific user';

-- Real-time setup completed successfully
SELECT 'Real-time subscriptions configured successfully!' as status;