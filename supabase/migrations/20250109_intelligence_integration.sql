-- Intelligence Integration Tables Migration
-- Purpose: Add comprehensive OpenRouter + SerpAPI + Unified Intelligence tracking
-- Generated: 2025-01-09
-- Priority: 1 (Critical for new Intelligence Dashboard functionality)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- OPENROUTER INTEGRATION TABLES
-- ==============================================

-- OpenRouter model definitions and capabilities
CREATE TABLE IF NOT EXISTS openrouter_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id TEXT NOT NULL UNIQUE,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  context_length INTEGER,
  prompt_cost DECIMAL(10,8),
  completion_cost DECIMAL(10,8),
  capabilities JSONB DEFAULT '[]',
  specialized_for JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OpenRouter API request tracking
CREATE TABLE IF NOT EXISTS openrouter_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  session_id UUID,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'general',
  prompt TEXT NOT NULL,
  prompt_tokens INTEGER,
  response TEXT,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  cache_hit BOOLEAN DEFAULT false,
  cost_priority TEXT DEFAULT 'medium',
  quality_priority TEXT DEFAULT 'medium',
  request_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OpenRouter performance metrics by model
CREATE TABLE IF NOT EXISTS openrouter_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2) DEFAULT 0,
  average_cost DECIMAL(10,6) DEFAULT 0,
  total_cost DECIMAL(12,6) DEFAULT 0,
  cache_hit_rate DECIMAL(5,4) DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  accuracy_score DECIMAL(5,4),
  user_satisfaction DECIMAL(5,4),
  last_used_at TIMESTAMP WITH TIME ZONE,
  timeframe TEXT DEFAULT '24h',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(model_id, agent_id, task_type, timeframe)
);

-- ==============================================
-- SERPAPI INTEGRATION TABLES
-- ==============================================

-- SerpAPI search history and results
CREATE TABLE IF NOT EXISTS serpapi_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  session_id UUID,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'search',
  search_engine TEXT DEFAULT 'google',
  search_parameters JSONB DEFAULT '{}',
  results JSONB,
  organic_results JSONB DEFAULT '[]',
  news_results JSONB DEFAULT '[]',
  related_searches JSONB DEFAULT '[]',
  result_count INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6),
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  cache_hit BOOLEAN DEFAULT false,
  task_type TEXT,
  symbols TEXT[],
  sentiment_analysis JSONB,
  relevance_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SerpAPI performance and usage tracking
CREATE TABLE IF NOT EXISTS serpapi_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  search_type TEXT NOT NULL,
  total_searches INTEGER DEFAULT 0,
  successful_searches INTEGER DEFAULT 0,
  failed_searches INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2) DEFAULT 0,
  average_cost DECIMAL(10,6) DEFAULT 0,
  total_cost DECIMAL(12,6) DEFAULT 0,
  cache_hit_rate DECIMAL(5,4) DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  average_result_count DECIMAL(8,2) DEFAULT 0,
  last_search_at TIMESTAMP WITH TIME ZONE,
  timeframe TEXT DEFAULT '24h',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, search_type, timeframe)
);

-- ==============================================
-- UNIFIED INTELLIGENCE TABLES
-- ==============================================

-- Unified intelligence processing sessions
CREATE TABLE IF NOT EXISTS intelligence_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  task_name TEXT,
  prompt TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  
  -- Processing flags
  use_web_search BOOLEAN DEFAULT true,
  use_llm_analysis BOOLEAN DEFAULT true,
  
  -- Results
  analysis TEXT,
  web_results JSONB DEFAULT '[]',
  sources TEXT[],
  confidence_score DECIMAL(3,2) DEFAULT 0,
  recommendations TEXT[],
  
  -- Performance metrics
  total_cost DECIMAL(10,6) DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  web_searches INTEGER DEFAULT 0,
  llm_calls INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intelligence task routing and optimization
CREATE TABLE IF NOT EXISTS intelligence_routing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL UNIQUE,
  routing_config JSONB NOT NULL DEFAULT '{}',
  web_search_enabled BOOLEAN DEFAULT true,
  llm_analysis_enabled BOOLEAN DEFAULT true,
  default_web_task TEXT,
  default_llm_task TEXT,
  complexity_score DECIMAL(3,2) DEFAULT 0.5,
  cost_optimization JSONB DEFAULT '{}',
  performance_thresholds JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intelligence system usage analytics
CREATE TABLE IF NOT EXISTS intelligence_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  
  -- Usage metrics
  total_sessions INTEGER DEFAULT 0,
  successful_sessions INTEGER DEFAULT 0,
  failed_sessions INTEGER DEFAULT 0,
  
  -- Performance metrics
  average_processing_time DECIMAL(8,2) DEFAULT 0,
  average_cost DECIMAL(10,6) DEFAULT 0,
  total_cost DECIMAL(12,6) DEFAULT 0,
  average_confidence DECIMAL(5,4) DEFAULT 0,
  
  -- Service usage
  web_search_usage_rate DECIMAL(5,4) DEFAULT 0,
  llm_analysis_usage_rate DECIMAL(5,4) DEFAULT 0,
  cache_hit_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Quality metrics
  user_satisfaction DECIMAL(5,4),
  recommendation_accuracy DECIMAL(5,4),
  
  timeframe TEXT DEFAULT '24h',
  last_session_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, task_type, timeframe)
);

-- ==============================================
-- RATE LIMITING AND QUOTAS
-- ==============================================

-- Service rate limits and quota tracking
CREATE TABLE IF NOT EXISTS service_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  quota_type TEXT NOT NULL,
  quota_limit INTEGER NOT NULL,
  quota_used INTEGER DEFAULT 0,
  quota_period TEXT NOT NULL DEFAULT 'daily',
  cost_limit DECIMAL(10,2),
  cost_used DECIMAL(10,2) DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_name, agent_id, quota_type, quota_period)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================

-- OpenRouter indexes
CREATE INDEX IF NOT EXISTS idx_openrouter_models_provider ON openrouter_models(provider);
CREATE INDEX IF NOT EXISTS idx_openrouter_models_available ON openrouter_models(is_available);
CREATE INDEX IF NOT EXISTS idx_openrouter_requests_agent_model ON openrouter_requests(agent_id, model_id);
CREATE INDEX IF NOT EXISTS idx_openrouter_requests_task_type ON openrouter_requests(task_type);
CREATE INDEX IF NOT EXISTS idx_openrouter_requests_created_at ON openrouter_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_openrouter_requests_success ON openrouter_requests(success);
CREATE INDEX IF NOT EXISTS idx_openrouter_performance_model_task ON openrouter_performance(model_id, task_type);

-- SerpAPI indexes
CREATE INDEX IF NOT EXISTS idx_serpapi_searches_agent_type ON serpapi_searches(agent_id, search_type);
CREATE INDEX IF NOT EXISTS idx_serpapi_searches_query ON serpapi_searches USING gin(to_tsvector('english', query));
CREATE INDEX IF NOT EXISTS idx_serpapi_searches_created_at ON serpapi_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_serpapi_searches_success ON serpapi_searches(success);
CREATE INDEX IF NOT EXISTS idx_serpapi_searches_symbols ON serpapi_searches USING gin(symbols);

-- Intelligence indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_sessions_agent_task ON intelligence_sessions(agent_id, task_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_sessions_status ON intelligence_sessions(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_sessions_created_at ON intelligence_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_intelligence_analytics_agent_task ON intelligence_analytics(agent_id, task_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_routing_task_type ON intelligence_routing(task_type);

-- Service quotas indexes
CREATE INDEX IF NOT EXISTS idx_service_quotas_service_agent ON service_quotas(service_name, agent_id);
CREATE INDEX IF NOT EXISTS idx_service_quotas_reset_at ON service_quotas(reset_at);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all intelligence tables
ALTER TABLE openrouter_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE openrouter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE openrouter_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE serpapi_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE serpapi_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON openrouter_models FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON openrouter_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON openrouter_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON serpapi_searches FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON serpapi_analytics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON intelligence_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON intelligence_routing FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON intelligence_analytics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON service_quotas FOR ALL USING (true);

-- ==============================================
-- SAMPLE DATA AND CONFIGURATION
-- ==============================================

-- Insert default OpenRouter models
INSERT INTO openrouter_models (model_id, model_name, provider, description, context_length, prompt_cost, completion_cost, capabilities, specialized_for) VALUES
('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 'Anthropic''s most capable model for complex reasoning', 200000, 0.000003, 0.000015, '["reasoning", "analysis", "coding", "math"]', '["data_analysis", "strategy_analysis", "research"]'),
('openai/gpt-4', 'GPT-4', 'openai', 'OpenAI''s most capable model for complex tasks', 128000, 0.00003, 0.00006, '["reasoning", "creativity", "analysis"]', '["calculations", "general", "creative_writing"]'),
('openai/gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', 'Fast and efficient model for most tasks', 16385, 0.0000005, 0.0000015, '["speed", "efficiency", "general"]', '["calculations", "quick_analysis"]'),
('google/gemini-pro', 'Gemini Pro', 'google', 'Google''s advanced multimodal model', 32768, 0.000125, 0.000375, '["multimodal", "reasoning", "analysis"]', '["data_analysis", "research"]'),
('meta-llama/llama-2-70b-chat', 'Llama 2 70B Chat', 'meta', 'Meta''s open-source conversational model', 4096, 0.000007, 0.000007, '["conversation", "general", "open_source"]', '["general", "conversation"]')
ON CONFLICT (model_id) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  provider = EXCLUDED.provider,
  description = EXCLUDED.description,
  context_length = EXCLUDED.context_length,
  prompt_cost = EXCLUDED.prompt_cost,
  completion_cost = EXCLUDED.completion_cost,
  capabilities = EXCLUDED.capabilities,
  specialized_for = EXCLUDED.specialized_for,
  updated_at = NOW();

-- Insert default intelligence routing configurations
INSERT INTO intelligence_routing (task_type, routing_config, web_search_enabled, llm_analysis_enabled, default_web_task, default_llm_task, complexity_score) VALUES
('market_analysis', '{"web_search": true, "llm_analysis": true, "web_task": "financial_news", "llm_task": "data_analysis", "complexity": 0.8}', true, true, 'financial_news', 'data_analysis', 0.8),
('news_analysis', '{"web_search": true, "llm_analysis": true, "web_task": "financial_news", "llm_task": "sentiment_analysis", "complexity": 0.6}', true, true, 'financial_news', 'sentiment_analysis', 0.6),
('sentiment_analysis', '{"web_search": true, "llm_analysis": true, "web_task": "sentiment_analysis", "llm_task": "sentiment_analysis", "complexity": 0.5}', true, true, 'sentiment_analysis', 'sentiment_analysis', 0.5),
('research', '{"web_search": true, "llm_analysis": true, "web_task": "company_research", "llm_task": "research", "complexity": 0.9}', true, true, 'company_research', 'research', 0.9),
('strategy_generation', '{"web_search": false, "llm_analysis": true, "web_task": null, "llm_task": "strategy_analysis", "complexity": 0.7}', false, true, null, 'strategy_analysis', 0.7),
('risk_assessment', '{"web_search": true, "llm_analysis": true, "web_task": "regulatory_updates", "llm_task": "data_analysis", "complexity": 0.8}', true, true, 'regulatory_updates', 'data_analysis', 0.8)
ON CONFLICT (task_type) DO UPDATE SET
  routing_config = EXCLUDED.routing_config,
  web_search_enabled = EXCLUDED.web_search_enabled,
  llm_analysis_enabled = EXCLUDED.llm_analysis_enabled,
  default_web_task = EXCLUDED.default_web_task,
  default_llm_task = EXCLUDED.default_llm_task,
  complexity_score = EXCLUDED.complexity_score,
  updated_at = NOW();

-- Insert default service quotas
INSERT INTO service_quotas (service_name, quota_type, quota_limit, quota_period, cost_limit, reset_at) VALUES
('openrouter', 'requests_per_minute', 60, 'minute', null, NOW() + INTERVAL '1 minute'),
('openrouter', 'requests_per_hour', 1000, 'hour', null, NOW() + INTERVAL '1 hour'),
('openrouter', 'daily_cost', 0, 'daily', 50.00, NOW() + INTERVAL '1 day'),
('serpapi', 'requests_per_minute', 100, 'minute', null, NOW() + INTERVAL '1 minute'),
('serpapi', 'requests_per_hour', 5000, 'hour', null, NOW() + INTERVAL '1 hour'),
('serpapi', 'daily_cost', 0, 'daily', 15.00, NOW() + INTERVAL '1 day')
ON CONFLICT (service_name, agent_id, quota_type, quota_period) DO UPDATE SET
  quota_limit = EXCLUDED.quota_limit,
  cost_limit = EXCLUDED.cost_limit,
  reset_at = EXCLUDED.reset_at,
  updated_at = NOW();

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

-- Enable realtime for all intelligence tables
ALTER PUBLICATION supabase_realtime ADD TABLE openrouter_models;
ALTER PUBLICATION supabase_realtime ADD TABLE openrouter_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE openrouter_performance;
ALTER PUBLICATION supabase_realtime ADD TABLE serpapi_searches;
ALTER PUBLICATION supabase_realtime ADD TABLE serpapi_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE intelligence_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE intelligence_routing;
ALTER PUBLICATION supabase_realtime ADD TABLE intelligence_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE service_quotas;

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update analytics automatically
CREATE OR REPLACE FUNCTION update_intelligence_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics when intelligence session is completed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'completed') THEN
    INSERT INTO intelligence_analytics (
      agent_id, task_type, total_sessions, successful_sessions, 
      average_processing_time, average_cost, total_cost, average_confidence,
      last_session_at
    )
    VALUES (
      NEW.agent_id, NEW.task_type, 1, 
      CASE WHEN NEW.success THEN 1 ELSE 0 END,
      NEW.processing_time_ms, NEW.total_cost, NEW.total_cost, NEW.confidence_score,
      NEW.created_at
    )
    ON CONFLICT (agent_id, task_type, timeframe) DO UPDATE SET
      total_sessions = intelligence_analytics.total_sessions + 1,
      successful_sessions = intelligence_analytics.successful_sessions + CASE WHEN NEW.success THEN 1 ELSE 0 END,
      average_processing_time = (intelligence_analytics.average_processing_time * intelligence_analytics.total_sessions + NEW.processing_time_ms) / (intelligence_analytics.total_sessions + 1),
      average_cost = (intelligence_analytics.average_cost * intelligence_analytics.total_sessions + NEW.total_cost) / (intelligence_analytics.total_sessions + 1),
      total_cost = intelligence_analytics.total_cost + NEW.total_cost,
      average_confidence = (intelligence_analytics.average_confidence * intelligence_analytics.total_sessions + NEW.confidence_score) / (intelligence_analytics.total_sessions + 1),
      last_session_at = NEW.created_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update analytics
CREATE TRIGGER update_intelligence_analytics_trigger
  AFTER INSERT OR UPDATE ON intelligence_sessions
  FOR EACH ROW EXECUTE FUNCTION update_intelligence_analytics();

-- Function to update OpenRouter performance metrics
CREATE OR REPLACE FUNCTION update_openrouter_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics when OpenRouter request is completed
  IF TG_OP = 'INSERT' THEN
    INSERT INTO openrouter_performance (
      model_id, agent_id, task_type, total_requests, successful_requests,
      average_response_time, average_cost, total_cost, last_used_at
    )
    VALUES (
      NEW.model_id, NEW.agent_id, NEW.task_type, 1,
      CASE WHEN NEW.success THEN 1 ELSE 0 END,
      NEW.response_time_ms, NEW.cost_usd, NEW.cost_usd, NEW.created_at
    )
    ON CONFLICT (model_id, agent_id, task_type, timeframe) DO UPDATE SET
      total_requests = openrouter_performance.total_requests + 1,
      successful_requests = openrouter_performance.successful_requests + CASE WHEN NEW.success THEN 1 ELSE 0 END,
      average_response_time = (openrouter_performance.average_response_time * openrouter_performance.total_requests + NEW.response_time_ms) / (openrouter_performance.total_requests + 1),
      average_cost = (openrouter_performance.average_cost * openrouter_performance.total_requests + NEW.cost_usd) / (openrouter_performance.total_requests + 1),
      total_cost = openrouter_performance.total_cost + NEW.cost_usd,
      success_rate = CAST(openrouter_performance.successful_requests AS DECIMAL) / openrouter_performance.total_requests,
      last_used_at = NEW.created_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update OpenRouter performance
CREATE TRIGGER update_openrouter_performance_trigger
  AFTER INSERT ON openrouter_requests
  FOR EACH ROW EXECUTE FUNCTION update_openrouter_performance();

-- Function to update service quotas
CREATE OR REPLACE FUNCTION update_service_quotas()
RETURNS TRIGGER AS $$
BEGIN
  -- Update quotas for OpenRouter requests
  IF TG_TABLE_NAME = 'openrouter_requests' THEN
    -- Update daily cost quota
    UPDATE service_quotas 
    SET quota_used = quota_used + 1, cost_used = cost_used + NEW.cost_usd, updated_at = NOW()
    WHERE service_name = 'openrouter' AND quota_type = 'daily_cost' AND agent_id IS NULL;
    
    -- Update hourly request quota
    UPDATE service_quotas 
    SET quota_used = quota_used + 1, updated_at = NOW()
    WHERE service_name = 'openrouter' AND quota_type = 'requests_per_hour' AND agent_id IS NULL;
    
    -- Update minute request quota
    UPDATE service_quotas 
    SET quota_used = quota_used + 1, updated_at = NOW()
    WHERE service_name = 'openrouter' AND quota_type = 'requests_per_minute' AND agent_id IS NULL;
  END IF;
  
  -- Update quotas for SerpAPI requests
  IF TG_TABLE_NAME = 'serpapi_searches' THEN
    -- Update daily cost quota
    UPDATE service_quotas 
    SET quota_used = quota_used + 1, cost_used = cost_used + NEW.cost_usd, updated_at = NOW()
    WHERE service_name = 'serpapi' AND quota_type = 'daily_cost' AND agent_id IS NULL;
    
    -- Update hourly request quota
    UPDATE service_quotas 
    SET quota_used = quota_used + 1, updated_at = NOW()
    WHERE service_name = 'serpapi' AND quota_type = 'requests_per_hour' AND agent_id IS NULL;
    
    -- Update minute request quota
    UPDATE service_quotas 
    SET quota_used = quota_used + 1, updated_at = NOW()
    WHERE service_name = 'serpapi' AND quota_type = 'requests_per_minute' AND agent_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update service quotas
CREATE TRIGGER update_openrouter_quotas_trigger
  AFTER INSERT ON openrouter_requests
  FOR EACH ROW EXECUTE FUNCTION update_service_quotas();

CREATE TRIGGER update_serpapi_quotas_trigger
  AFTER INSERT ON serpapi_searches
  FOR EACH ROW EXECUTE FUNCTION update_service_quotas();

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_openrouter_models_updated_at BEFORE UPDATE ON openrouter_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_openrouter_performance_updated_at BEFORE UPDATE ON openrouter_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_serpapi_analytics_updated_at BEFORE UPDATE ON serpapi_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intelligence_sessions_updated_at BEFORE UPDATE ON intelligence_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intelligence_routing_updated_at BEFORE UPDATE ON intelligence_routing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intelligence_analytics_updated_at BEFORE UPDATE ON intelligence_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_quotas_updated_at BEFORE UPDATE ON service_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Intelligence Integration Migration completed successfully!';
  RAISE NOTICE 'Tables created: openrouter_models, openrouter_requests, openrouter_performance';
  RAISE NOTICE 'Tables created: serpapi_searches, serpapi_analytics';
  RAISE NOTICE 'Tables created: intelligence_sessions, intelligence_routing, intelligence_analytics';
  RAISE NOTICE 'Tables created: service_quotas';
  RAISE NOTICE 'Sample data inserted for OpenRouter models and routing configurations';
  RAISE NOTICE 'Default service quotas configured with rate limiting';
  RAISE NOTICE 'Performance tracking and automatic analytics enabled';
  RAISE NOTICE 'Realtime subscriptions enabled for all intelligence tables';
  RAISE NOTICE 'Intelligence dashboard ready for OpenRouter + SerpAPI integration!';
END $$;