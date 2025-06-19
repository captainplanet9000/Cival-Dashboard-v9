#!/usr/bin/env python3
"""
Create Supabase Memory Schema for Production
Comprehensive database schema for agent memory management
"""

import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Memory schema SQL
MEMORY_SCHEMA_SQL = """
-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent Memory Tables
CREATE TABLE IF NOT EXISTS agent_memories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id text NOT NULL,
    content text NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata jsonb DEFAULT '{}',
    importance_score decimal DEFAULT 0.5,
    memory_type text DEFAULT 'general',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Agent Memory Search Function
CREATE OR REPLACE FUNCTION match_agent_memories(
    agent_id_filter text,
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    match_threshold float DEFAULT 0.7
) RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
) LANGUAGE sql STABLE AS $$
    SELECT
        agent_memories.id,
        agent_memories.content,
        agent_memories.metadata,
        1 - (agent_memories.embedding <=> query_embedding) AS similarity
    FROM agent_memories
    WHERE agent_memories.agent_id = agent_id_filter
    AND 1 - (agent_memories.embedding <=> query_embedding) > match_threshold
    ORDER BY agent_memories.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Agent Checkpoints (enhanced)
CREATE TABLE IF NOT EXISTS agent_checkpoints (
    checkpoint_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id text NOT NULL,
    checkpoint_name text,
    state_snapshot jsonb NOT NULL,
    memory_references text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    is_auto_checkpoint boolean DEFAULT true
);

-- Agent Decision History (enhanced)
CREATE TABLE IF NOT EXISTS agent_decision_history (
    decision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id text NOT NULL,
    decision_type text NOT NULL, -- entry, exit, hold, rebalance
    symbol text NOT NULL,
    decision_data jsonb NOT NULL,
    market_context jsonb DEFAULT '{}',
    reasoning text,
    confidence_score decimal,
    outcome_data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Agent Learning Patterns
CREATE TABLE IF NOT EXISTS agent_learning_patterns (
    pattern_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id text NOT NULL,
    pattern_type text NOT NULL, -- success, failure, market_condition
    pattern_data jsonb NOT NULL,
    frequency_count int DEFAULT 1,
    success_rate decimal DEFAULT 0.0,
    last_occurrence timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Memory Usage Analytics
CREATE TABLE IF NOT EXISTS memory_usage_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id text NOT NULL,
    memory_size_mb decimal DEFAULT 0.0,
    total_memories int DEFAULT 0,
    cleanup_operations int DEFAULT 0,
    retrieval_operations int DEFAULT 0,
    recorded_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_id ON agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memories_importance ON agent_memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_created ON agent_memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_agent_id ON agent_checkpoints(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_created ON agent_checkpoints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_id ON agent_decision_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_symbol ON agent_decision_history(symbol);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON agent_decision_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_agent_id ON agent_learning_patterns(agent_id);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON agent_learning_patterns(pattern_type);

-- Row Level Security (RLS)
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learning_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, customize based on auth requirements)
CREATE POLICY "Allow all operations on agent_memories" ON agent_memories FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_checkpoints" ON agent_checkpoints FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_decision_history" ON agent_decision_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on agent_learning_patterns" ON agent_learning_patterns FOR ALL USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_memories_updated_at BEFORE UPDATE ON agent_memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_decisions_updated_at BEFORE UPDATE ON agent_decision_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

async def create_memory_schema():
    """Create the memory schema in Supabase"""
    try:
        # Get Supabase connection
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Missing Supabase credentials. Please set:")
            print("   - NEXT_PUBLIC_SUPABASE_URL")
            print("   - SUPABASE_SERVICE_ROLE_KEY")
            return False
            
        print(f"🔗 Connecting to Supabase: {supabase_url[:30]}...")
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Execute schema creation
        print("🗄️ Creating memory schema...")
        
        # Split into individual statements for better error handling
        statements = [stmt.strip() for stmt in MEMORY_SCHEMA_SQL.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                try:
                    print(f"   Executing statement {i+1}/{len(statements)}...")
                    result = supabase.rpc('sql', {'query': statement}).execute()
                    
                    if hasattr(result, 'error') and result.error:
                        print(f"   ⚠️ Warning on statement {i+1}: {result.error}")
                    else:
                        print(f"   ✅ Statement {i+1} completed")
                        
                except Exception as e:
                    print(f"   ❌ Error on statement {i+1}: {e}")
                    # Continue with other statements
        
        print("✅ Memory schema creation completed!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create memory schema: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(create_memory_schema())