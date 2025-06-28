-- Agent Memory System Tables for Supabase
-- Extends existing dashboard with AI memory capabilities

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent Personalities Table
CREATE TABLE agent_personalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    preferred_strategies TEXT[] DEFAULT '{}',
    learning_style TEXT CHECK (learning_style IN ('quick_adapt', 'gradual_learn', 'pattern_focused')),
    trading_history JSONB DEFAULT '{}',
    memory_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Memory Nodes Table
CREATE TABLE agent_memory_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id TEXT UNIQUE NOT NULL,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    memory_type TEXT CHECK (memory_type IN ('trade_decision', 'market_insight', 'strategy_learning', 'risk_observation')),
    importance_score FLOAT CHECK (importance_score >= 0 AND importance_score <= 1),
    embedding vector(384), -- For semantic search
    metadata JSONB DEFAULT '{}',
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agent_personalities(agent_id)
);

-- Memory Connections Table
CREATE TABLE memory_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id TEXT UNIQUE NOT NULL,
    agent_id TEXT NOT NULL,
    source_memory_id TEXT NOT NULL,
    target_memory_id TEXT NOT NULL,
    connection_type TEXT CHECK (connection_type IN ('similar_strategy', 'opposite_outcome', 'temporal_sequence', 'causal_relationship')),
    strength FLOAT CHECK (strength >= 0 AND strength <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agent_personalities(agent_id),
    FOREIGN KEY (source_memory_id) REFERENCES agent_memory_nodes(memory_id),
    FOREIGN KEY (target_memory_id) REFERENCES agent_memory_nodes(memory_id)
);

-- Agent Thoughts Table
CREATE TABLE agent_thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thought_id TEXT UNIQUE NOT NULL,
    agent_id TEXT NOT NULL,
    thought TEXT NOT NULL,
    context TEXT,
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    related_memories TEXT[] DEFAULT '{}',
    thought_type TEXT CHECK (thought_type IN ('analysis', 'prediction', 'reflection', 'planning')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agent_personalities(agent_id)
);

-- Agent Decisions Table
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id TEXT UNIQUE NOT NULL,
    agent_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decision TEXT CHECK (decision IN ('buy', 'sell', 'hold')),
    quantity FLOAT,
    price FLOAT,
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    influencing_memories TEXT[] DEFAULT '{}',
    market_context JSONB DEFAULT '{}',
    executed BOOLEAN DEFAULT FALSE,
    outcome JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agent_personalities(agent_id)
);

-- Indexes for performance
CREATE INDEX idx_memory_nodes_agent_id ON agent_memory_nodes(agent_id);
CREATE INDEX idx_memory_nodes_type ON agent_memory_nodes(memory_type);
CREATE INDEX idx_memory_nodes_importance ON agent_memory_nodes(importance_score DESC);
CREATE INDEX idx_memory_nodes_created ON agent_memory_nodes(created_at DESC);
CREATE INDEX idx_connections_agent_id ON memory_connections(agent_id);
CREATE INDEX idx_connections_source ON memory_connections(source_memory_id);
CREATE INDEX idx_connections_target ON memory_connections(target_memory_id);
CREATE INDEX idx_thoughts_agent_id ON agent_thoughts(agent_id);
CREATE INDEX idx_thoughts_created ON agent_thoughts(created_at DESC);
CREATE INDEX idx_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX idx_decisions_symbol ON agent_decisions(symbol);
CREATE INDEX idx_decisions_created ON agent_decisions(created_at DESC);

-- Vector similarity search index
CREATE INDEX ON agent_memory_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS)
ALTER TABLE agent_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now, can be restricted later)
CREATE POLICY "Enable all access for agent_personalities" ON agent_personalities FOR ALL USING (true);
CREATE POLICY "Enable all access for agent_memory_nodes" ON agent_memory_nodes FOR ALL USING (true);
CREATE POLICY "Enable all access for memory_connections" ON memory_connections FOR ALL USING (true);
CREATE POLICY "Enable all access for agent_thoughts" ON agent_thoughts FOR ALL USING (true);
CREATE POLICY "Enable all access for agent_decisions" ON agent_decisions FOR ALL USING (true);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_agent_personalities_updated_at 
    BEFORE UPDATE ON agent_personalities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_nodes_updated_at 
    BEFORE UPDATE ON agent_memory_nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default agent personalities
INSERT INTO agent_personalities (agent_id, name, risk_tolerance, preferred_strategies, learning_style, trading_history, memory_preferences) VALUES 
(
    'alpha-momentum',
    'Alpha Momentum Trader',
    'aggressive',
    ARRAY['momentum', 'breakout', 'trend_following'],
    'quick_adapt',
    '{"totalTrades": 156, "successRate": 0.67, "avgProfitLoss": 127.50, "bestStrategy": "momentum"}',
    '{"maxMemoryNodes": 100, "importanceThreshold": 0.6, "forgetAfterDays": 30}'
),
(
    'beta-arbitrage',
    'Beta Arbitrage Master',
    'conservative',
    ARRAY['arbitrage', 'pairs_trading', 'mean_reversion'],
    'pattern_focused',
    '{"totalTrades": 89, "successRate": 0.84, "avgProfitLoss": 45.30, "bestStrategy": "arbitrage"}',
    '{"maxMemoryNodes": 200, "importanceThreshold": 0.4, "forgetAfterDays": 60}'
),
(
    'gamma-grid',
    'Gamma Grid Bot',
    'moderate',
    ARRAY['grid_trading', 'dollar_cost_average', 'rebalancing'],
    'gradual_learn',
    '{"totalTrades": 234, "successRate": 0.72, "avgProfitLoss": 89.20, "bestStrategy": "grid_trading"}',
    '{"maxMemoryNodes": 150, "importanceThreshold": 0.5, "forgetAfterDays": 45}'
);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE agent_memory_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_thoughts;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE memory_connections;