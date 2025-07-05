-- Complete Dashboard Setup Script
-- This script sets up all necessary extensions, functions, and initial data for the Cival Dashboard

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Drop existing trigger function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create the updated_at trigger function (used across all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to safely add columns if they don't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(table_name TEXT, column_name TEXT, column_definition TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = table_name 
        AND column_name = column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to safely create indexes
CREATE OR REPLACE FUNCTION create_index_if_not_exists(index_name TEXT, table_name TEXT, column_definition TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = index_name AND n.nspname = 'public'
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I %s', index_name, table_name, column_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive user profiles table if not exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    theme_preference VARCHAR(20) DEFAULT 'dark',
    trading_experience VARCHAR(20) DEFAULT 'beginner' CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    risk_tolerance VARCHAR(20) DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    notifications_enabled BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API keys table for third-party integrations
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('binance', 'coinbase', 'kraken', 'openai', 'anthropic')),
    key_name VARCHAR(100),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    passphrase_encrypted TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_testnet BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT false,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider, key_name)
);

-- Create system configuration table
CREATE TABLE IF NOT EXISTS public.system_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system configurations
INSERT INTO system_configuration (config_key, config_value, description, is_public) VALUES
('trading_hours', '{"market_open": "09:30", "market_close": "16:00", "timezone": "EST"}', 'Market trading hours', true),
('risk_defaults', '{"max_position_size": 0.05, "max_daily_loss": 0.02, "max_drawdown": 0.15}', 'Default risk parameters', true),
('commission_rates', '{"binance": 0.001, "coinbase": 0.005, "paper": 0.0}', 'Commission rates by exchange', true),
('market_data_sources', '["binance", "coinbase", "yahoo_finance"]', 'Available market data sources', true),
('supported_symbols', '["BTCUSD", "ETHUSD", "SOLUSD", "ADAUSD", "LINKUSD", "DOTUSD"]', 'Supported trading symbols', true),
('supported_timeframes', '["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]', 'Supported chart timeframes', true),
('feature_flags', '{"real_trading": false, "ai_recommendations": true, "social_trading": false}', 'Global feature flags', false)
ON CONFLICT (config_key) DO NOTHING;

-- Create audit log table for compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable Row Level Security on all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data
CREATE POLICY "Users can view and edit their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys" ON user_api_keys
    FOR ALL USING (user_id IN (SELECT user_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details)
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get system configuration
CREATE OR REPLACE FUNCTION get_system_config(config_key TEXT)
RETURNS JSONB AS $$
DECLARE
    config_value JSONB;
BEGIN
    SELECT sc.config_value INTO config_value
    FROM system_configuration sc
    WHERE sc.config_key = get_system_config.config_key;
    
    RETURN COALESCE(config_value, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update system configuration
CREATE OR REPLACE FUNCTION update_system_config(
    config_key TEXT,
    config_value JSONB,
    updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO system_configuration (config_key, config_value, updated_by)
    VALUES (config_key, config_value, updated_by)
    ON CONFLICT (config_key) 
    DO UPDATE SET 
        config_value = EXCLUDED.config_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at BEFORE UPDATE ON system_configuration
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for portfolio summaries (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS portfolio_summary_mv AS
SELECT 
    p.id as portfolio_id,
    p.name as portfolio_name,
    p.type as portfolio_type,
    p.initial_balance,
    p.current_balance,
    COUNT(pp.id) as position_count,
    COALESCE(SUM(pp.market_value), 0) as total_positions_value,
    COALESCE(SUM(pp.unrealized_pnl), 0) as total_unrealized_pnl,
    COALESCE(SUM(pp.realized_pnl), 0) as total_realized_pnl,
    (p.current_balance + COALESCE(SUM(pp.market_value), 0)) as total_portfolio_value,
    p.updated_at
FROM portfolios p
LEFT JOIN portfolio_positions pp ON p.id = pp.portfolio_id AND pp.closed_at IS NULL
GROUP BY p.id, p.name, p.type, p.initial_balance, p.current_balance, p.updated_at;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_summary_mv_id ON portfolio_summary_mv(portfolio_id);

-- Create function to refresh portfolio summaries
CREATE OR REPLACE FUNCTION refresh_portfolio_summaries()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_summary_mv;
END;
$$ LANGUAGE plpgsql;

-- Create function to safely drop materialized view if needed
CREATE OR REPLACE FUNCTION recreate_portfolio_summary_mv()
RETURNS VOID AS $$
BEGIN
    DROP MATERIALIZED VIEW IF EXISTS portfolio_summary_mv;
    
    CREATE MATERIALIZED VIEW portfolio_summary_mv AS
    SELECT 
        p.id as portfolio_id,
        p.name as portfolio_name,
        p.type as portfolio_type,
        p.initial_balance,
        p.current_balance,
        COUNT(pp.id) as position_count,
        COALESCE(SUM(pp.market_value), 0) as total_positions_value,
        COALESCE(SUM(pp.unrealized_pnl), 0) as total_unrealized_pnl,
        COALESCE(SUM(pp.realized_pnl), 0) as total_realized_pnl,
        (p.current_balance + COALESCE(SUM(pp.market_value), 0)) as total_portfolio_value,
        p.updated_at
    FROM portfolios p
    LEFT JOIN portfolio_positions pp ON p.id = pp.portfolio_id AND pp.closed_at IS NULL
    GROUP BY p.id, p.name, p.type, p.initial_balance, p.current_balance, p.updated_at;
    
    CREATE UNIQUE INDEX idx_portfolio_summary_mv_id ON portfolio_summary_mv(portfolio_id);
END;
$$ LANGUAGE plpgsql;

-- Comment on the setup script
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamps';
COMMENT ON FUNCTION log_audit_event(UUID, VARCHAR, VARCHAR, UUID, JSONB) IS 'Function to log audit events for compliance tracking';
COMMENT ON FUNCTION get_system_config(TEXT) IS 'Function to retrieve system configuration values';
COMMENT ON FUNCTION update_system_config(TEXT, JSONB, UUID) IS 'Function to update system configuration values';
COMMENT ON MATERIALIZED VIEW portfolio_summary_mv IS 'Materialized view for fast portfolio summary queries';

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Cival Dashboard database setup completed successfully!';
    RAISE NOTICE 'Tables created: user_profiles, user_api_keys, system_configuration, audit_logs';
    RAISE NOTICE 'Functions created: update_updated_at_column, log_audit_event, get_system_config, update_system_config';
    RAISE NOTICE 'Materialized view created: portfolio_summary_mv';
    RAISE NOTICE 'Row Level Security enabled on all user tables';
END $$;