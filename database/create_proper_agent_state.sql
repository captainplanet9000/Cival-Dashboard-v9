-- Create the proper agent_state table with correct structure
-- The existing agent_state table has a different structure, so we'll rename it and create the correct one

-- First, backup the existing agent_state table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_state') THEN
        -- Rename existing table to keep as backup
        ALTER TABLE public.agent_state RENAME TO agent_state_backup;
        RAISE NOTICE 'Renamed existing agent_state table to agent_state_backup';
    END IF;
END $$;

-- Create the proper agent_state table as designed
CREATE TABLE IF NOT EXISTS public.agent_state (
    agent_id UUID PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Current state
    current_positions JSONB DEFAULT '[]',
    pending_orders JSONB DEFAULT '[]',
    portfolio_value DECIMAL(15,2) DEFAULT 0,
    available_cash DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Risk state
    current_drawdown DECIMAL(5,4) DEFAULT 0,
    daily_pnl DECIMAL(15,2) DEFAULT 0,
    var_risk DECIMAL(15,2) DEFAULT 0,
    
    -- Trading state
    last_decision_at TIMESTAMPTZ,
    last_trade_at TIMESTAMPTZ,
    consecutive_losses INTEGER DEFAULT 0,
    consecutive_wins INTEGER DEFAULT 0,
    
    -- Learning state
    learning_phase VARCHAR(50) DEFAULT 'active',
    exploration_rate DECIMAL(3,2) DEFAULT 0.1,
    confidence_trend DECIMAL(3,2) DEFAULT 0.5,
    
    -- Coordination state
    coordination_status VARCHAR(50) DEFAULT 'available',
    last_signal_sent_at TIMESTAMPTZ,
    last_signal_received_at TIMESTAMPTZ,
    
    -- Health monitoring
    health_score DECIMAL(3,2) DEFAULT 1.0,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify the new table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_state'
ORDER BY ordinal_position;

COMMIT;