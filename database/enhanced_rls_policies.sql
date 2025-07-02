-- Row Level Security Policies for Enhanced Database Schema
-- This script adds comprehensive RLS policies for all new tables
-- Created: 2025-01-02

-- ===============================================
-- ENABLE ROW LEVEL SECURITY ON ALL NEW TABLES
-- ===============================================

ALTER TABLE public.blockchain_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_chain_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- BLOCKCHAIN WALLETS POLICIES
-- ===============================================

-- Users can view and manage their own wallets and their agents' wallets
CREATE POLICY "Users can view their blockchain wallets" ON public.blockchain_wallets
    FOR SELECT USING (
        user_id = auth.uid() OR 
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their blockchain wallets" ON public.blockchain_wallets
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their blockchain wallets" ON public.blockchain_wallets
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their blockchain wallets" ON public.blockchain_wallets
    FOR DELETE USING (
        user_id = auth.uid() OR 
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

-- ===============================================
-- BLOCKCHAIN TRANSACTIONS POLICIES
-- ===============================================

-- Users can view transactions for their wallets
CREATE POLICY "Users can view their blockchain transactions" ON public.blockchain_transactions
    FOR SELECT USING (
        wallet_id IN (
            SELECT id FROM public.blockchain_wallets 
            WHERE user_id = auth.uid() OR 
                  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert their blockchain transactions" ON public.blockchain_transactions
    FOR INSERT WITH CHECK (
        wallet_id IN (
            SELECT id FROM public.blockchain_wallets 
            WHERE user_id = auth.uid() OR 
                  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their blockchain transactions" ON public.blockchain_transactions
    FOR UPDATE USING (
        wallet_id IN (
            SELECT id FROM public.blockchain_wallets 
            WHERE user_id = auth.uid() OR 
                  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
        )
    );

-- ===============================================
-- CROSS-CHAIN OPERATIONS POLICIES
-- ===============================================

-- Users can view cross-chain operations for their farms
CREATE POLICY "Users can view their cross-chain operations" ON public.cross_chain_operations
    FOR SELECT USING (
        farm_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())
    );

CREATE POLICY "Users can insert cross-chain operations for their farms" ON public.cross_chain_operations
    FOR INSERT WITH CHECK (
        farm_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())
    );

CREATE POLICY "Users can update their cross-chain operations" ON public.cross_chain_operations
    FOR UPDATE USING (
        farm_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())
    );

-- ===============================================
-- BLOCKCHAIN ACHIEVEMENTS POLICIES
-- ===============================================

-- Users can view achievements for their goals and agents
CREATE POLICY "Users can view their blockchain achievements" ON public.blockchain_achievements
    FOR SELECT USING (
        goal_id IN (SELECT goal_id FROM public.goals WHERE user_id = auth.uid()) OR
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert blockchain achievements for their entities" ON public.blockchain_achievements
    FOR INSERT WITH CHECK (
        goal_id IN (SELECT goal_id FROM public.goals WHERE user_id = auth.uid()) AND
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    );

-- ===============================================
-- SYSTEM EVENTS POLICIES
-- ===============================================

-- Users can view events targeted to them or broadcast events
CREATE POLICY "Users can view relevant system events" ON public.system_events
    FOR SELECT USING (
        broadcast = true OR 
        auth.uid() = ANY(target_users) OR
        source_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()) OR
        source_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())
    );

-- System can insert events (handled by service account)
CREATE POLICY "System can insert events" ON public.system_events
    FOR INSERT WITH CHECK (true);

-- ===============================================
-- EVENT SUBSCRIPTIONS POLICIES
-- ===============================================

-- Users can only manage their own subscriptions
CREATE POLICY "Users can manage their event subscriptions" ON public.event_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- ===============================================
-- REALTIME METRICS POLICIES
-- ===============================================

-- Users can view metrics for their entities
CREATE POLICY "Users can view their realtime metrics" ON public.realtime_metrics
    FOR SELECT USING (
        (source_type = 'agent' AND source_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())) OR
        (source_type = 'farm' AND source_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())) OR
        (source_type = 'portfolio' AND source_id = auth.uid()) OR
        source_type = 'system'
    );

-- System can insert metrics
CREATE POLICY "System can insert realtime metrics" ON public.realtime_metrics
    FOR INSERT WITH CHECK (true);

-- ===============================================
-- NOTIFICATIONS POLICIES
-- ===============================================

-- Users can only view and manage their own notifications
CREATE POLICY "Users can manage their notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- ===============================================
-- SYSTEM ALERTS POLICIES
-- ===============================================

-- All authenticated users can view system alerts
CREATE POLICY "Authenticated users can view system alerts" ON public.enhanced_system_alerts
    FOR SELECT TO authenticated USING (true);

-- Only specific roles can manage alerts (implement role-based access)
CREATE POLICY "Admins can manage system alerts" ON public.enhanced_system_alerts
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- ===============================================
-- ALERT RULES POLICIES
-- ===============================================

-- Users can view all alert rules but only manage their own
CREATE POLICY "Users can view alert rules" ON public.alert_rules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their alert rules" ON public.alert_rules
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their alert rules" ON public.alert_rules
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their alert rules" ON public.alert_rules
    FOR DELETE USING (created_by = auth.uid());

-- ===============================================
-- AUDIT LOGS POLICIES
-- ===============================================

-- Users can view audit logs for their own actions and entities
CREATE POLICY "Users can view their audit logs" ON public.audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()) OR
        (resource_type = 'farm' AND resource_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())) OR
        (resource_type = 'goal' AND resource_id IN (SELECT goal_id FROM public.goals WHERE user_id = auth.uid()))
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ===============================================
-- COMPLIANCE CHECKS POLICIES
-- ===============================================

-- All authenticated users can view compliance status
CREATE POLICY "Authenticated users can view compliance checks" ON public.compliance_checks
    FOR SELECT TO authenticated USING (true);

-- Only admins can manage compliance checks
CREATE POLICY "Admins can manage compliance checks" ON public.compliance_checks
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- ===============================================
-- DATA RETENTION POLICIES
-- ===============================================

-- Only admins can view and manage data retention policies
CREATE POLICY "Admins can manage data retention policies" ON public.data_retention_policies
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- ===============================================
-- ML PREDICTIONS POLICIES
-- ===============================================

-- All authenticated users can view ML predictions
CREATE POLICY "Authenticated users can view ML predictions" ON public.ml_predictions
    FOR SELECT TO authenticated USING (true);

-- System can insert and update ML predictions
CREATE POLICY "System can manage ML predictions" ON public.ml_predictions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'system' OR
        auth.jwt() ->> 'role' = 'ml_service'
    );

-- ===============================================
-- PERFORMANCE BENCHMARKS POLICIES
-- ===============================================

-- Users can view benchmarks for their entities
CREATE POLICY "Users can view their performance benchmarks" ON public.performance_benchmarks
    FOR SELECT USING (
        (entity_type = 'agent' AND entity_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())) OR
        (entity_type = 'farm' AND entity_id IN (SELECT farm_id FROM public.farms WHERE created_by = auth.uid())) OR
        (entity_type = 'portfolio' AND entity_id = auth.uid())
    );

-- System can insert benchmarks
CREATE POLICY "System can insert performance benchmarks" ON public.performance_benchmarks
    FOR INSERT WITH CHECK (true);

-- ===============================================
-- MARKET ANALYSIS POLICIES
-- ===============================================

-- All authenticated users can view market analysis
CREATE POLICY "Authenticated users can view market analysis" ON public.enhanced_market_analysis
    FOR SELECT TO authenticated USING (true);

-- System can insert market analysis
CREATE POLICY "System can insert market analysis" ON public.enhanced_market_analysis
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'system' OR
        auth.jwt() ->> 'role' = 'market_service'
    );

-- ===============================================
-- SYSTEM HEALTH POLICIES
-- ===============================================

-- All authenticated users can view system health
CREATE POLICY "Authenticated users can view system health" ON public.system_health
    FOR SELECT TO authenticated USING (true);

-- System can insert health metrics
CREATE POLICY "System can insert health metrics" ON public.system_health
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'system' OR
        auth.jwt() ->> 'role' = 'monitoring'
    );

-- ===============================================
-- SYSTEM CONFIGURATION POLICIES
-- ===============================================

-- All authenticated users can view non-sensitive configuration
CREATE POLICY "Users can view public configuration" ON public.system_configuration
    FOR SELECT USING (
        is_sensitive = false OR 
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- Only admins can manage configuration
CREATE POLICY "Admins can manage system configuration" ON public.system_configuration
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- ===============================================
-- FEATURE FLAGS POLICIES
-- ===============================================

-- All authenticated users can view feature flags
CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags
    FOR SELECT TO authenticated USING (true);

-- Only admins can manage feature flags
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- ===============================================
-- SERVICE ACCOUNT ROLES
-- ===============================================

-- Create service roles for different system components
-- These would be set in the JWT token for service authentication

-- Example JWT claims for service accounts:
-- System service: {"role": "system", "service": "backend"}
-- ML service: {"role": "ml_service", "service": "predictions"}
-- Market service: {"role": "market_service", "service": "analysis"}
-- Monitoring service: {"role": "monitoring", "service": "health"}

-- ===============================================
-- HELPER FUNCTIONS FOR ROLE CHECKING
-- ===============================================

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION auth.has_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', '') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if request is from system service
CREATE OR REPLACE FUNCTION auth.is_system_service()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', '') IN ('system', 'ml_service', 'market_service', 'monitoring');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's agents
CREATE OR REPLACE FUNCTION auth.user_agent_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(SELECT id FROM public.agents WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's farms
CREATE OR REPLACE FUNCTION auth.user_farm_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(SELECT farm_id FROM public.farms WHERE created_by = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ===============================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ===============================================
-- COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON POLICY "Users can view their blockchain wallets" ON public.blockchain_wallets IS 
'Users can view wallets they own directly or through their agents';

COMMENT ON POLICY "Users can view relevant system events" ON public.system_events IS 
'Users can view broadcast events, targeted events, or events from their entities';

COMMENT ON POLICY "Users can view their audit logs" ON public.audit_logs IS 
'Users can view audit logs for actions they performed or entities they own';

COMMENT ON FUNCTION auth.has_admin_role() IS 
'Check if the current user has admin role from JWT token';

COMMENT ON FUNCTION auth.is_system_service() IS 
'Check if the request is from an authorized system service';

-- RLS policies setup completed successfully
SELECT 'Enhanced RLS policies setup completed successfully!' as status;