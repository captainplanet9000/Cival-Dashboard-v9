-- Calendar Events and Task Management Tables Migration
-- Purpose: Add comprehensive calendar, event scheduling, and task management for trading operations
-- Generated: 2025-01-09
-- Priority: 4 (Important for Calendar Dashboard functionality)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- CALENDAR AND EVENT MANAGEMENT TABLES
-- ==============================================

-- Calendar events for trading operations and market events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('market_event', 'earnings', 'fed_announcement', 'trading_session', 'maintenance', 'analysis', 'meeting', 'deadline', 'alert')),
  
  -- Timing
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  all_day_event BOOLEAN DEFAULT false,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Market relevance
  market_symbols TEXT[] DEFAULT '{}',
  market_sectors TEXT[] DEFAULT '{}',
  importance_level TEXT DEFAULT 'medium' CHECK (importance_level IN ('low', 'medium', 'high', 'critical')),
  impact_rating DECIMAL(3,2) DEFAULT 0.5,
  
  -- Event details
  event_source TEXT,
  external_event_id TEXT,
  event_url TEXT,
  location TEXT,
  
  -- Notifications and reminders
  notification_settings JSONB DEFAULT '{}',
  reminder_minutes INTEGER[] DEFAULT '{60, 15}',
  
  -- Agent associations
  assigned_agents UUID[] DEFAULT '{}',
  created_by_agent UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Status and metadata
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading tasks and action items
CREATE TABLE IF NOT EXISTS trading_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('analysis', 'research', 'trading', 'monitoring', 'reporting', 'optimization', 'maintenance', 'review')),
  
  -- Task assignment
  assigned_to_agent UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_by_agent UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Priority and scheduling
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  -- Task details
  requirements JSONB DEFAULT '{}',
  expected_output TEXT,
  success_criteria TEXT,
  related_symbols TEXT[] DEFAULT '{}',
  
  -- Progress tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_notes TEXT,
  
  -- Dependencies
  depends_on_tasks UUID[] DEFAULT '{}',
  blocks_tasks UUID[] DEFAULT '{}',
  
  -- Results and performance
  task_results JSONB DEFAULT '{}',
  performance_score DECIMAL(3,2),
  quality_rating DECIMAL(3,2),
  
  -- Calendar integration
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Market event calendar (earnings, announcements, etc.)
CREATE TABLE IF NOT EXISTS market_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('earnings', 'dividend', 'split', 'merger', 'ipo', 'fed_meeting', 'economic_data', 'conference', 'product_launch')),
  
  -- Market details
  symbol TEXT,
  company_name TEXT,
  exchange TEXT,
  sector TEXT,
  market_cap_category TEXT CHECK (market_cap_category IN ('large_cap', 'mid_cap', 'small_cap', 'micro_cap')),
  
  -- Event timing
  event_date DATE NOT NULL,
  event_time TIME,
  announcement_datetime TIMESTAMP WITH TIME ZONE,
  
  -- Financial data (for earnings)
  expected_eps DECIMAL(10,4),
  actual_eps DECIMAL(10,4),
  expected_revenue DECIMAL(20,2),
  actual_revenue DECIMAL(20,2),
  guidance_update TEXT,
  
  -- Market impact
  pre_market_reaction DECIMAL(8,4),
  post_market_reaction DECIMAL(8,4),
  volume_impact_ratio DECIMAL(8,4),
  analyst_sentiment TEXT CHECK (analyst_sentiment IN ('very_bearish', 'bearish', 'neutral', 'bullish', 'very_bullish')),
  
  -- Data sources
  data_source TEXT,
  source_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Trading relevance
  trading_opportunity_score DECIMAL(3,2) DEFAULT 0.5,
  volatility_expectation TEXT DEFAULT 'medium' CHECK (volatility_expectation IN ('low', 'medium', 'high', 'extreme')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent schedules and availability
CREATE TABLE IF NOT EXISTS agent_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Schedule details
  schedule_name TEXT NOT NULL,
  schedule_type TEXT DEFAULT 'trading_hours' CHECK (schedule_type IN ('trading_hours', 'maintenance', 'analysis', 'custom')),
  
  -- Time patterns
  day_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday = 1, Sunday = 7
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  
  -- Effective dates
  effective_from DATE NOT NULL,
  effective_until DATE,
  
  -- Schedule configuration
  is_active BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 1,
  
  -- Operational parameters
  max_concurrent_tasks INTEGER DEFAULT 1,
  max_daily_tasks INTEGER DEFAULT 10,
  break_intervals JSONB DEFAULT '[]',
  
  -- Market hours alignment
  follows_market_hours BOOLEAN DEFAULT true,
  market_timezone TEXT DEFAULT 'America/New_York',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event notifications and alerts
CREATE TABLE IF NOT EXISTS event_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target and source
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  task_id UUID REFERENCES trading_tasks(id) ON DELETE CASCADE,
  market_event_id UUID REFERENCES market_events(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'alert', 'update', 'completion', 'deadline', 'market_event')),
  notification_title TEXT NOT NULL,
  notification_message TEXT NOT NULL,
  
  -- Delivery settings
  delivery_method TEXT[] DEFAULT '{in_app}' CHECK (ARRAY['email', 'sms', 'webhook', 'in_app'] @> delivery_method),
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Response tracking
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  response_action TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task templates for common trading operations
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  template_description TEXT,
  task_type TEXT NOT NULL,
  
  -- Template configuration
  default_priority TEXT DEFAULT 'medium',
  estimated_duration_minutes INTEGER,
  requirements_template JSONB DEFAULT '{}',
  success_criteria_template TEXT,
  
  -- Task structure
  subtasks JSONB DEFAULT '[]',
  checklist_items JSONB DEFAULT '[]',
  
  -- Usage and performance
  usage_count INTEGER DEFAULT 0,
  average_completion_time INTEGER,
  success_rate DECIMAL(5,4) DEFAULT 1.0,
  
  -- Template metadata
  category TEXT,
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- Calendar event indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_importance ON calendar_events(importance_level);
CREATE INDEX IF NOT EXISTS idx_calendar_events_symbols ON calendar_events USING gin(market_symbols);
CREATE INDEX IF NOT EXISTS idx_calendar_events_agents ON calendar_events USING gin(assigned_agents);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring ON calendar_events(is_recurring, parent_event_id);

-- Trading task indexes
CREATE INDEX IF NOT EXISTS idx_trading_tasks_agent ON trading_tasks(assigned_to_agent);
CREATE INDEX IF NOT EXISTS idx_trading_tasks_status ON trading_tasks(status);
CREATE INDEX IF NOT EXISTS idx_trading_tasks_priority ON trading_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_trading_tasks_due_date ON trading_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_trading_tasks_type ON trading_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_trading_tasks_symbols ON trading_tasks USING gin(related_symbols);
CREATE INDEX IF NOT EXISTS idx_trading_tasks_dependencies ON trading_tasks USING gin(depends_on_tasks);

-- Market event indexes
CREATE INDEX IF NOT EXISTS idx_market_events_date ON market_events(event_date);
CREATE INDEX IF NOT EXISTS idx_market_events_symbol ON market_events(symbol);
CREATE INDEX IF NOT EXISTS idx_market_events_type ON market_events(event_type);
CREATE INDEX IF NOT EXISTS idx_market_events_sector ON market_events(sector);
CREATE INDEX IF NOT EXISTS idx_market_events_opportunity_score ON market_events(trading_opportunity_score DESC);

-- Agent schedule indexes
CREATE INDEX IF NOT EXISTS idx_agent_schedules_agent ON agent_schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_active ON agent_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_effective ON agent_schedules(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_dow ON agent_schedules USING gin(day_of_week);

-- Event notification indexes
CREATE INDEX IF NOT EXISTS idx_event_notifications_agent ON event_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_send_at ON event_notifications(send_at);
CREATE INDEX IF NOT EXISTS idx_event_notifications_status ON event_notifications(status);
CREATE INDEX IF NOT EXISTS idx_event_notifications_type ON event_notifications(notification_type);

-- Task template indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_task_templates_usage ON task_templates(usage_count DESC);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all calendar tables
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON calendar_events FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON trading_tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON market_events FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON agent_schedules FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON event_notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON task_templates FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample calendar events
INSERT INTO calendar_events (event_title, event_description, event_type, start_datetime, end_datetime, market_symbols, importance_level, impact_rating) VALUES
('FOMC Interest Rate Decision', 'Federal Open Market Committee announces interest rate decision and monetary policy outlook', 'fed_announcement', '2025-01-29 19:00:00+00', '2025-01-29 20:30:00+00', '{"SPY", "QQQ", "USD", "GOLD"}', 'critical', 0.9),
('Apple Earnings Report', 'Apple Inc. Q1 2025 earnings announcement and investor call', 'earnings', '2025-01-30 21:30:00+00', '2025-01-30 23:00:00+00', '{"AAPL", "QQQ", "SPY"}', 'high', 0.8),
('Tesla Production Numbers', 'Tesla Q4 2024 vehicle production and delivery numbers release', 'market_event', '2025-01-03 13:00:00+00', '2025-01-03 14:00:00+00', '{"TSLA", "EV"}', 'high', 0.7),
('Bitcoin Halving Event', 'Estimated Bitcoin network halving event reducing block rewards', 'market_event', '2025-04-15 12:00:00+00', '2025-04-15 12:00:00+00', '{"BTC", "ETH", "CRYPTO"}', 'critical', 0.95),
('Weekly Portfolio Review', 'Comprehensive review of all agent portfolios and performance metrics', 'analysis', '2025-01-13 15:00:00+00', '2025-01-13 17:00:00+00', '{}', 'medium', 0.5),
('Market Close Analysis', 'Daily market close analysis and preparation for next trading session', 'analysis', '2025-01-10 21:00:00+00', '2025-01-10 22:00:00+00', '{}', 'medium', 0.4)
ON CONFLICT DO NOTHING;

-- Insert sample trading tasks
INSERT INTO trading_tasks (task_title, task_description, task_type, priority, due_date, estimated_duration_minutes, related_symbols, requirements) VALUES
('Analyze NVDA Technical Patterns', 'Perform comprehensive technical analysis of NVIDIA including support/resistance levels, momentum indicators, and volume patterns', 'analysis', 'high', '2025-01-10 16:00:00+00', 45, '{"NVDA"}', '{"required_indicators": ["RSI", "MACD", "Bollinger Bands"], "timeframes": ["1h", "4h", "1d"], "volume_analysis": true}'),
('Update Risk Parameters for High Vol Period', 'Review and adjust risk management parameters ahead of earnings season and FOMC meeting', 'optimization', 'urgent', '2025-01-12 09:00:00+00', 30, '{}', '{"review_items": ["position_sizing", "stop_losses", "correlation_limits"], "market_conditions": "high_volatility"}'),
('Research AI Chip Sector Trends', 'Comprehensive research on AI semiconductor industry trends, competitive landscape, and investment opportunities', 'research', 'medium', '2025-01-15 17:00:00+00', 120, '{"NVDA", "AMD", "INTC", "TSM"}', '{"research_scope": ["industry_trends", "competitive_analysis", "financial_metrics"], "deliverable": "investment_thesis"}'),
('Backtest New Momentum Strategy', 'Implement and backtest new momentum-based trading strategy across multiple timeframes and asset classes', 'optimization', 'medium', '2025-01-20 12:00:00+00', 180, '{"SPY", "QQQ", "BTC", "ETH"}', '{"backtest_period": "2_years", "metrics": ["sharpe_ratio", "max_drawdown", "win_rate"], "benchmarks": ["SPY", "60_40_portfolio"]}'),
('Prepare FOMC Trading Plan', 'Develop comprehensive trading plan for FOMC meeting including scenarios, position sizing, and risk management', 'trading', 'high', '2025-01-28 12:00:00+00', 90, '{"SPY", "QQQ", "TLT", "USD", "VIX"}', '{"scenarios": ["hawkish", "dovish", "neutral"], "instruments": ["options", "futures", "etfs"], "risk_budget": "2%"}')
ON CONFLICT DO NOTHING;

-- Insert sample market events
INSERT INTO market_events (event_name, event_type, symbol, company_name, exchange, sector, event_date, expected_eps, trading_opportunity_score, volatility_expectation) VALUES
('Apple Inc. Q1 2025 Earnings', 'earnings', 'AAPL', 'Apple Inc.', 'NASDAQ', 'Technology', '2025-01-30', 2.35, 0.8, 'high'),
('Microsoft Corporation Q2 2025 Earnings', 'earnings', 'MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', '2025-01-24', 3.12, 0.75, 'medium'),
('NVIDIA Corporation Q4 2024 Earnings', 'earnings', 'NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Technology', '2025-02-21', 5.55, 0.9, 'extreme'),
('Tesla Inc. Q4 2024 Earnings', 'earnings', 'TSLA', 'Tesla Inc.', 'NASDAQ', 'Consumer Discretionary', '2025-01-29', 0.85, 0.85, 'high'),
('Amazon.com Inc. Q4 2024 Earnings', 'earnings', 'AMZN', 'Amazon.com Inc.', 'NASDAQ', 'Consumer Discretionary', '2025-02-01', 1.28, 0.7, 'medium'),
('Federal Reserve Interest Rate Decision', 'fed_meeting', NULL, 'Federal Reserve', NULL, 'Monetary Policy', '2025-01-29', NULL, 0.95, 'extreme')
ON CONFLICT DO NOTHING;

-- Insert sample agent schedules
INSERT INTO agent_schedules (agent_id, schedule_name, schedule_type, day_of_week, start_time, end_time, timezone, effective_from, max_concurrent_tasks)
SELECT 
  a.id as agent_id,
  'US Market Hours',
  'trading_hours',
  '{1,2,3,4,5}',
  '09:30:00'::TIME,
  '16:00:00'::TIME,
  'America/New_York',
  '2025-01-01'::DATE,
  3
FROM agents a
WHERE a.is_enabled = true
LIMIT 3
ON CONFLICT DO NOTHING;

-- Insert sample task templates
INSERT INTO task_templates (template_name, template_description, task_type, default_priority, estimated_duration_minutes, requirements_template, success_criteria_template, checklist_items) VALUES
('Daily Market Analysis', 'Template for daily market analysis including key indicators, news, and sentiment', 'analysis', 'medium', 30, '{"indicators": ["market_sentiment", "volatility", "volume"], "news_sources": ["financial_news", "earnings"], "timeframe": "daily"}', 'Complete analysis report with actionable insights and risk assessment', '["Review overnight news", "Check economic calendar", "Analyze key indicators", "Update market sentiment", "Identify trading opportunities"]'),
('Earnings Event Preparation', 'Template for preparing trading strategy around earnings announcements', 'trading', 'high', 60, '{"company_research": true, "options_analysis": true, "volatility_forecast": true}', 'Trading plan with defined entry/exit criteria and risk management', '["Research company fundamentals", "Analyze options flow", "Set volatility expectations", "Define position size", "Plan entry and exit points"]'),
('Weekly Portfolio Review', 'Template for comprehensive weekly portfolio performance review', 'review', 'medium', 90, '{"performance_metrics": true, "risk_analysis": true, "rebalancing_check": true}', 'Portfolio review report with optimization recommendations', '["Calculate performance metrics", "Analyze risk exposure", "Review correlation changes", "Check rebalancing needs", "Update investment thesis"]'),
('Risk Parameter Optimization', 'Template for reviewing and optimizing risk management parameters', 'optimization', 'high', 45, '{"current_volatility": true, "correlation_matrix": true, "scenario_analysis": true}', 'Updated risk parameters with backtesting validation', '["Assess current market volatility", "Update correlation matrix", "Run scenario analysis", "Validate new parameters", "Implement changes"]')
ON CONFLICT (template_name) DO UPDATE SET
  template_description = EXCLUDED.template_description,
  task_type = EXCLUDED.task_type,
  default_priority = EXCLUDED.default_priority,
  estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
  requirements_template = EXCLUDED.requirements_template,
  success_criteria_template = EXCLUDED.success_criteria_template,
  checklist_items = EXCLUDED.checklist_items,
  updated_at = NOW();

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all calendar tables
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE trading_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE market_events;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE event_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE task_templates;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to auto-complete tasks when all subtasks are done
CREATE OR REPLACE FUNCTION check_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-complete task when progress reaches 100%
  IF NEW.progress_percentage = 100 AND OLD.progress_percentage < 100 THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();
  END IF;
  
  -- Auto-start task when progress goes from 0 to >0
  IF NEW.progress_percentage > 0 AND OLD.progress_percentage = 0 AND NEW.status = 'pending' THEN
    NEW.status := 'in_progress';
    NEW.started_at := NOW();
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task completion checking
CREATE TRIGGER check_task_completion_trigger
  BEFORE UPDATE OF progress_percentage ON trading_tasks
  FOR EACH ROW EXECUTE FUNCTION check_task_completion();

-- Function to create recurring calendar events
CREATE OR REPLACE FUNCTION create_recurring_events()
RETURNS TRIGGER AS $$
DECLARE
  next_date TIMESTAMP WITH TIME ZONE;
  recurrence_count INTEGER := 0;
  max_recurrences INTEGER := 52; -- Limit to prevent infinite loops
BEGIN
  -- Only create recurring events for parent events (not already recurring instances)
  IF NEW.is_recurring = true AND NEW.parent_event_id IS NULL THEN
    next_date := NEW.start_datetime;
    
    WHILE recurrence_count < max_recurrences AND 
          (NEW.recurrence_end_date IS NULL OR next_date::DATE <= NEW.recurrence_end_date) LOOP
      
      -- Calculate next occurrence based on pattern
      CASE NEW.recurrence_pattern
        WHEN 'daily' THEN
          next_date := next_date + (NEW.recurrence_interval || ' days')::INTERVAL;
        WHEN 'weekly' THEN
          next_date := next_date + (NEW.recurrence_interval || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
          next_date := next_date + (NEW.recurrence_interval || ' months')::INTERVAL;
        WHEN 'quarterly' THEN
          next_date := next_date + (NEW.recurrence_interval * 3 || ' months')::INTERVAL;
        WHEN 'yearly' THEN
          next_date := next_date + (NEW.recurrence_interval || ' years')::INTERVAL;
      END CASE;
      
      -- Insert next recurring event
      INSERT INTO calendar_events (
        event_title, event_description, event_type, start_datetime, end_datetime,
        timezone, all_day_event, market_symbols, market_sectors, importance_level,
        impact_rating, notification_settings, reminder_minutes, assigned_agents,
        parent_event_id, status, tags, metadata
      ) VALUES (
        NEW.event_title, NEW.event_description, NEW.event_type, 
        next_date, 
        CASE WHEN NEW.end_datetime IS NOT NULL THEN 
          next_date + (NEW.end_datetime - NEW.start_datetime) 
        ELSE NULL END,
        NEW.timezone, NEW.all_day_event, NEW.market_symbols, NEW.market_sectors,
        NEW.importance_level, NEW.impact_rating, NEW.notification_settings,
        NEW.reminder_minutes, NEW.assigned_agents, NEW.id, NEW.status,
        NEW.tags, NEW.metadata
      );
      
      recurrence_count := recurrence_count + 1;
      
      -- Break if we've reached the end date
      IF NEW.recurrence_end_date IS NOT NULL AND next_date::DATE > NEW.recurrence_end_date THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for creating recurring events
CREATE TRIGGER create_recurring_events_trigger
  AFTER INSERT ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION create_recurring_events();

-- Add triggers for updated_at columns
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_tasks_updated_at BEFORE UPDATE ON trading_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_events_updated_at BEFORE UPDATE ON market_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_schedules_updated_at BEFORE UPDATE ON agent_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_notifications_updated_at BEFORE UPDATE ON event_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Calendar Events Migration completed successfully!';
  RAISE NOTICE 'Tables created: calendar_events, trading_tasks, market_events, agent_schedules, event_notifications, task_templates';
  RAISE NOTICE 'Sample data inserted for upcoming market events and earnings';
  RAISE NOTICE 'Trading task templates created for common operations';
  RAISE NOTICE 'Agent scheduling system configured with market hours';
  RAISE NOTICE 'Recurring event generation and task automation enabled';
  RAISE NOTICE 'Realtime subscriptions enabled for all calendar tables';
  RAISE NOTICE 'Calendar dashboard ready for event and task management!';
END $$;