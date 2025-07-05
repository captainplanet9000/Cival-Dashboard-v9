-- Migration 012: Dashboard UI Preferences and State Management
-- This migration creates tables for managing dashboard layouts and user preferences

-- User dashboard layouts
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout_type VARCHAR(50) DEFAULT 'custom' CHECK (layout_type IN ('default', 'custom', 'template')),
    layout_config JSONB NOT NULL DEFAULT '{
        "version": 1,
        "breakpoints": {"lg": 1200, "md": 996, "sm": 768, "xs": 480, "xxs": 0},
        "cols": {"lg": 12, "md": 10, "sm": 6, "xs": 4, "xxs": 2},
        "layouts": {}
    }'::jsonb,
    theme_settings JSONB DEFAULT '{
        "theme": "dark",
        "primaryColor": "#0070f3",
        "fontSize": "medium",
        "animations": true
    }'::jsonb,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component preferences and configurations
CREATE TABLE IF NOT EXISTS public.component_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    component_type VARCHAR(100) NOT NULL,
    component_id VARCHAR(255),
    preferences JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    refresh_interval INTEGER DEFAULT 30000, -- milliseconds
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, component_type, component_id)
);

-- Sortable component state (for watchlists, portfolios, etc.)
CREATE TABLE IF NOT EXISTS public.sortable_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    sortable_type VARCHAR(100) NOT NULL CHECK (sortable_type IN (
        'watchlist', 'portfolio', 'strategies', 'agents', 'farms', 'goals'
    )),
    sortable_id VARCHAR(255),
    items_order JSONB NOT NULL DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    sort_criteria JSONB DEFAULT '{
        "field": "name",
        "direction": "asc"
    }'::jsonb,
    view_mode VARCHAR(50) DEFAULT 'grid' CHECK (view_mode IN ('grid', 'list', 'table', 'card')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sortable_type, sortable_id)
);

-- Feature flags and preferences
CREATE TABLE IF NOT EXISTS public.user_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    feature_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_name)
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    notification_type VARCHAR(100) NOT NULL CHECK (notification_type IN (
        'trade_execution', 'risk_alert', 'portfolio_update', 'market_event',
        'goal_achievement', 'system_maintenance', 'performance_report'
    )),
    enabled BOOLEAN DEFAULT true,
    delivery_methods JSONB DEFAULT '["in_app"]'::jsonb, -- in_app, email, sms, webhook
    filters JSONB DEFAULT '{}',
    frequency VARCHAR(50) DEFAULT 'immediate' CHECK (frequency IN (
        'immediate', 'hourly', 'daily', 'weekly', 'monthly'
    )),
    quiet_hours JSONB DEFAULT '{
        "enabled": false,
        "start": "22:00",
        "end": "08:00",
        "timezone": "UTC"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- UI performance monitoring
CREATE TABLE IF NOT EXISTS public.ui_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(255),
    page_name VARCHAR(100),
    component_name VARCHAR(100),
    metric_type VARCHAR(50) CHECK (metric_type IN (
        'load_time', 'render_time', 'interaction_time', 'memory_usage', 'error_rate'
    )),
    metric_value DECIMAL(10,4),
    metadata JSONB DEFAULT '{}',
    user_agent TEXT,
    viewport_size VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Saved chart configurations
CREATE TABLE IF NOT EXISTS public.chart_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL CHECK (chart_type IN (
        'candlestick', 'line', 'area', 'volume', 'rsi', 'macd', 'bollinger_bands'
    )),
    symbol VARCHAR(50),
    timeframe VARCHAR(10),
    indicators JSONB DEFAULT '[]'::jsonb,
    drawing_objects JSONB DEFAULT '[]'::jsonb,
    color_scheme VARCHAR(50) DEFAULT 'dark',
    configuration JSONB NOT NULL DEFAULT '{}',
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Command palette usage analytics
CREATE TABLE IF NOT EXISTS public.command_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    command VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    average_execution_time_ms INTEGER,
    success_rate DECIMAL(5,4) DEFAULT 1.0,
    UNIQUE(user_id, command)
);

-- Create indexes for performance
CREATE INDEX idx_dashboard_layouts_user ON dashboard_layouts(user_id, is_default);
CREATE INDEX idx_dashboard_layouts_public ON dashboard_layouts(is_public, view_count DESC) WHERE is_public = true;
CREATE INDEX idx_component_preferences_user ON component_preferences(user_id, component_type);
CREATE INDEX idx_sortable_configs_user ON sortable_configurations(user_id, sortable_type);
CREATE INDEX idx_feature_flags_user ON user_feature_flags(user_id, enabled) WHERE enabled = true;
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id, enabled) WHERE enabled = true;
CREATE INDEX idx_ui_performance_page ON ui_performance_metrics(page_name, timestamp DESC);
CREATE INDEX idx_ui_performance_user ON ui_performance_metrics(user_id, timestamp DESC);
CREATE INDEX idx_chart_configs_user ON chart_configurations(user_id, chart_type);
CREATE INDEX idx_chart_configs_public ON chart_configurations(is_public, chart_type) WHERE is_public = true;
CREATE INDEX idx_command_usage_user ON command_usage_analytics(user_id, usage_count DESC);

-- Create triggers
CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON dashboard_layouts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_preferences_updated_at BEFORE UPDATE ON component_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sortable_configurations_updated_at BEFORE UPDATE ON sortable_configurations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feature_flags_updated_at BEFORE UPDATE ON user_feature_flags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_configurations_updated_at BEFORE UPDATE ON chart_configurations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment command usage
CREATE OR REPLACE FUNCTION increment_command_usage(p_user_id UUID, p_command VARCHAR, p_category VARCHAR DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO command_usage_analytics (user_id, command, category, usage_count)
    VALUES (p_user_id, p_command, p_category, 1)
    ON CONFLICT (user_id, command)
    DO UPDATE SET
        usage_count = command_usage_analytics.usage_count + 1,
        last_used_at = NOW(),
        category = COALESCE(EXCLUDED.category, command_usage_analytics.category);
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sortable_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own dashboard layouts" ON dashboard_layouts
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Public layouts are viewable by all" ON dashboard_layouts
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own component preferences" ON component_preferences
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own sortable configurations" ON sortable_configurations
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own feature flags" ON user_feature_flags
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own performance metrics" ON ui_performance_metrics
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own chart configurations" ON chart_configurations
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Public charts are viewable by all" ON chart_configurations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own command usage" ON command_usage_analytics
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Default notification preferences
INSERT INTO notification_preferences (user_id, notification_type, enabled, delivery_methods) VALUES
(NULL, 'trade_execution', true, '["in_app"]'::jsonb),
(NULL, 'risk_alert', true, '["in_app", "email"]'::jsonb),
(NULL, 'portfolio_update', true, '["in_app"]'::jsonb),
(NULL, 'market_event', false, '["in_app"]'::jsonb),
(NULL, 'goal_achievement', true, '["in_app", "email"]'::jsonb),
(NULL, 'system_maintenance', true, '["in_app", "email"]'::jsonb),
(NULL, 'performance_report', true, '["email"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE dashboard_layouts IS 'User dashboard layout configurations and themes';
COMMENT ON TABLE component_preferences IS 'Individual component preferences and settings';
COMMENT ON TABLE sortable_configurations IS 'Sortable list configurations for various components';
COMMENT ON TABLE user_feature_flags IS 'Feature flags and experimental features per user';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and delivery settings';
COMMENT ON TABLE ui_performance_metrics IS 'UI performance monitoring and analytics';
COMMENT ON TABLE chart_configurations IS 'Saved chart configurations and templates';
COMMENT ON TABLE command_usage_analytics IS 'Command palette usage statistics';