-- Create agents table for AI trading agents
-- This includes configuration, state, and performance metrics

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER,
  agent_type TEXT DEFAULT 'MVA',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  state JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'error', 'waiting_gas')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  current_capital DECIMAL(20, 8) DEFAULT 0,
  cumulative_gas_usd NUMERIC(16,6) DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add standard triggers
CREATE OR REPLACE FUNCTION handle_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_agents_created_at BEFORE INSERT ON agents
FOR EACH ROW EXECUTE PROCEDURE handle_created_at();

CREATE TRIGGER handle_agents_updated_at BEFORE UPDATE ON agents
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create farm-based RLS policies
CREATE POLICY "Users can view agents for their farms" ON agents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM farms WHERE farms.id = agents.farm_id AND farms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update agents for their farms" ON agents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM farms WHERE farms.id = agents.farm_id AND farms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert agents for their farms" ON agents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM farms WHERE farms.id = agents.farm_id AND farms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete agents for their farms" ON agents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM farms WHERE farms.id = agents.farm_id AND farms.user_id = auth.uid()
  )
);

-- Create agent_logs table
CREATE TABLE IF NOT EXISTS agent_logs (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES public.agents(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level TEXT CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  details JSONB DEFAULT NULL
);

-- Create index for more efficient log queries
CREATE INDEX IF NOT EXISTS agent_logs_agent_id_timestamp_idx ON agent_logs(agent_id, timestamp DESC);

-- Enable RLS for agent logs
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for logs
CREATE POLICY "Users can view logs for their farms' agents" ON agent_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM agents 
    JOIN farms ON farms.id = agents.farm_id
    WHERE agent_logs.agent_id = agents.id AND farms.user_id = auth.uid()
  )
);

-- Insert sample agent data for development
INSERT INTO agents (
    agent_type, 
    config, 
    state, 
    status
) VALUES (
    'MVA', 
    '{"strategy": "mean_reversion", "risk_tolerance": 0.5, "base_asset": "ETH"}'::jsonb,
    '{"last_analysis": "2025-07-07T10:30:00Z", "active_trades": 2}'::jsonb,
    'idle'
) ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE agents IS 'Stores AI trading agents with their configuration and state';
COMMENT ON TABLE agent_logs IS 'Logs of agent activities and events';
COMMENT ON COLUMN agents.config IS 'JSON configuration for the agent strategy and settings';
COMMENT ON COLUMN agents.state IS 'Current state of the agent, including trading history';
COMMENT ON COLUMN agents.status IS 'Current operational status of the agent';
