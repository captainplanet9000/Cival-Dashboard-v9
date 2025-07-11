-- Calendar Events Database Schema
-- Comprehensive database schema for calendar events, scheduling, and trading calendar integration
-- Last Updated: July 2025

-- Calendar Events table for storing scheduled events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'general',
    date DATE NOT NULL,
    time TIME,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'scheduled',
    recurring BOOLEAN DEFAULT FALSE,
    notifications BOOLEAN DEFAULT TRUE,
    agent_id VARCHAR(100),
    task_id VARCHAR(100),
    cron_expression VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Calendar Mapping table for linking scheduled tasks to calendar
CREATE TABLE IF NOT EXISTS task_calendar_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(100) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    enabled BOOLEAN DEFAULT TRUE,
    calendar_event_id UUID,
    agent_id VARCHAR(100),
    last_execution TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    average_execution_time DECIMAL(10,3) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE SET NULL
);

-- Calendar Data table for storing daily trading performance
CREATE TABLE IF NOT EXISTS calendar_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_date DATE NOT NULL,
    total_pnl DECIMAL(15,2) DEFAULT 0.0,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    active_agents INTEGER DEFAULT 0,
    net_profit DECIMAL(15,2) DEFAULT 0.0,
    market_volatility DECIMAL(10,4),
    trading_volume DECIMAL(18,2),
    largest_win DECIMAL(15,2),
    largest_loss DECIMAL(15,2),
    sharpe_ratio DECIMAL(10,4),
    drawdown DECIMAL(10,4),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trading_date)
);

-- Calendar Notifications table for event notifications
CREATE TABLE IF NOT EXISTS calendar_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_event_id UUID NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'reminder',
    notification_time TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

-- Event Recurrence table for managing recurring events
CREATE TABLE IF NOT EXISTS event_recurrence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_event_id UUID NOT NULL,
    recurrence_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly', 'custom'
    recurrence_pattern VARCHAR(100), -- 'every 2 weeks', 'first monday', etc.
    recurrence_end_date DATE,
    max_occurrences INTEGER,
    current_occurrences INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

-- Scheduler Status table for monitoring task scheduler health
CREATE TABLE IF NOT EXISTS scheduler_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL DEFAULT 'autonomous_task_scheduler',
    initialized BOOLEAN DEFAULT FALSE,
    running BOOLEAN DEFAULT FALSE,
    scheduled_tasks INTEGER DEFAULT 0,
    active_executions INTEGER DEFAULT 0,
    worker_count INTEGER DEFAULT 0,
    queue_size INTEGER DEFAULT 0,
    uptime_seconds INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Execution History table for tracking task performance
CREATE TABLE IF NOT EXISTS task_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(100) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    execution_start TIMESTAMP WITH TIME ZONE NOT NULL,
    execution_end TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
    result JSONB,
    error_message TEXT,
    agent_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Participants table for multi-participant events
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_event_id UUID NOT NULL,
    participant_type VARCHAR(50) NOT NULL, -- 'agent', 'user', 'system'
    participant_id VARCHAR(100) NOT NULL,
    participant_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'participant', -- 'organizer', 'participant', 'observer'
    status VARCHAR(20) DEFAULT 'invited', -- 'invited', 'accepted', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

-- Trading Session Schedules table for automated trading schedules
CREATE TABLE IF NOT EXISTS trading_session_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name VARCHAR(255) NOT NULL,
    market VARCHAR(50) NOT NULL, -- 'US', 'EU', 'ASIA', 'CRYPTO'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    active_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
    enabled BOOLEAN DEFAULT TRUE,
    calendar_event_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE SET NULL
);

-- Calendar Performance Metrics table for analytics
CREATE TABLE IF NOT EXISTS calendar_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    scheduled_events INTEGER DEFAULT 0,
    completed_events INTEGER DEFAULT 0,
    cancelled_events INTEGER DEFAULT 0,
    missed_events INTEGER DEFAULT 0,
    total_trading_sessions INTEGER DEFAULT 0,
    successful_sessions INTEGER DEFAULT 0,
    average_session_pnl DECIMAL(15,2) DEFAULT 0.0,
    best_session_pnl DECIMAL(15,2) DEFAULT 0.0,
    worst_session_pnl DECIMAL(15,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_agent ON calendar_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_data_date ON calendar_data(trading_date);
CREATE INDEX IF NOT EXISTS idx_task_calendar_mapping_task_id ON task_calendar_mapping(task_id);
CREATE INDEX IF NOT EXISTS idx_task_calendar_mapping_enabled ON task_calendar_mapping(enabled);
CREATE INDEX IF NOT EXISTS idx_task_execution_history_task_id ON task_execution_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_history_start ON task_execution_history(execution_start);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_trading_session_schedules_enabled ON trading_session_schedules(enabled);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_calendar_mapping_updated_at
    BEFORE UPDATE ON task_calendar_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_calendar_data_updated_at
    BEFORE UPDATE ON calendar_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_scheduler_status_updated_at
    BEFORE UPDATE ON scheduler_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_trading_session_schedules_updated_at
    BEFORE UPDATE ON trading_session_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion for testing
INSERT INTO calendar_events (title, description, event_type, date, time, priority, status) VALUES
('Daily Market Open', 'Automated market analysis and strategy preparation', 'market', CURRENT_DATE, '09:00:00', 'high', 'scheduled'),
('Risk Assessment', 'Portfolio risk evaluation and adjustment', 'analysis', CURRENT_DATE, '15:30:00', 'high', 'scheduled'),
('Portfolio Rebalance', 'Automated portfolio rebalancing based on performance', 'rebalance', CURRENT_DATE + 1, '16:00:00', 'medium', 'scheduled'),
('Agent Coordination Meeting', 'Multi-agent decision making session', 'meeting', CURRENT_DATE + 2, '10:00:00', 'medium', 'scheduled'),
('FOMC Meeting', 'Federal Reserve monetary policy announcement', 'news', '2025-07-31', '14:00:00', 'high', 'scheduled');

-- Insert task mapping for existing autonomous tasks
INSERT INTO task_calendar_mapping (
    task_id, task_name, task_type, cron_expression, priority, enabled, agent_id
) VALUES
('arbitrage_scan_10s', 'High-Frequency Arbitrage Scan', 'arbitrage_scan', '*/10 * * * * *', 'high', true, 'alex_arbitrage'),
('risk_assessment_15m', 'Portfolio Risk Assessment', 'risk_assessment', '*/15 * * * *', 'high', true, 'riley_risk'),
('portfolio_rebalance_1h', 'Automated Portfolio Rebalancing', 'portfolio_rebalance', '0 * * * *', 'medium', true, 'system'),
('agent_coordination_5m', 'Multi-Agent Coordination', 'agent_coordination', '*/5 * * * *', 'medium', true, 'system'),
('market_data_update_30s', 'Market Data Refresh', 'market_data_update', '*/30 * * * * *', 'medium', true, 'system'),
('performance_analysis_daily', 'Daily Performance Analysis', 'performance_analysis', '0 22 * * *', 'low', true, 'system'),
('health_check_2m', 'System Health Check', 'health_check', '*/2 * * * *', 'low', true, 'system'),
('backup_operation_6h', 'State Backup Operation', 'backup_operation', '0 */6 * * *', 'medium', true, 'system');

-- Insert sample calendar data for current month
INSERT INTO calendar_data (trading_date, total_pnl, total_trades, winning_trades, active_agents, net_profit) VALUES
(CURRENT_DATE - 5, 1245.67, 34, 23, 4, 1221.18),
(CURRENT_DATE - 4, -234.12, 28, 15, 4, -258.47),
(CURRENT_DATE - 3, 567.89, 41, 29, 5, 556.34),
(CURRENT_DATE - 2, 890.45, 36, 24, 4, 872.15),
(CURRENT_DATE - 1, 432.10, 29, 18, 4, 425.26);

-- Insert trading session schedules
INSERT INTO trading_session_schedules (session_name, market, start_time, end_time, timezone, active_days) VALUES
('US Market Session', 'US', '09:30:00', '16:00:00', 'America/New_York', '{1,2,3,4,5}'),
('EU Market Session', 'EU', '08:00:00', '16:30:00', 'Europe/London', '{1,2,3,4,5}'),
('ASIA Market Session', 'ASIA', '09:00:00', '15:00:00', 'Asia/Tokyo', '{1,2,3,4,5}'),
('Crypto 24/7 Session', 'CRYPTO', '00:00:00', '23:59:59', 'UTC', '{1,2,3,4,5,6,7}');

COMMENT ON TABLE calendar_events IS 'Stores scheduled events, meetings, and trading activities';
COMMENT ON TABLE task_calendar_mapping IS 'Maps autonomous scheduler tasks to calendar events';
COMMENT ON TABLE calendar_data IS 'Daily trading performance data for calendar visualization';
COMMENT ON TABLE calendar_notifications IS 'Event notifications and reminders';
COMMENT ON TABLE event_recurrence IS 'Recurring event patterns and schedules';
COMMENT ON TABLE scheduler_status IS 'Real-time scheduler health and performance metrics';
COMMENT ON TABLE task_execution_history IS 'Historical record of task executions';
COMMENT ON TABLE event_participants IS 'Event participants including agents and users';
COMMENT ON TABLE trading_session_schedules IS 'Automated trading session schedules';
COMMENT ON TABLE calendar_performance_metrics IS 'Calendar and trading performance analytics';