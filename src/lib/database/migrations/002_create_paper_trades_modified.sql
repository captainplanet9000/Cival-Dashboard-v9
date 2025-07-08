-- Modified migration for paper_trades table
-- This migration adds missing columns to the existing paper_trades table
-- and inserts sample data in a compatible format

-- First, check if any columns need to be added
DO $$
BEGIN
    -- Add trade_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'paper_trades' AND column_name = 'trade_id') THEN
        ALTER TABLE public.paper_trades ADD COLUMN trade_id UUID DEFAULT gen_random_uuid();
        COMMENT ON COLUMN public.paper_trades.trade_id IS 'Unique identifier for the trade';
    END IF;

    -- Add realized_pnl column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'paper_trades' AND column_name = 'realized_pnl') THEN
        ALTER TABLE public.paper_trades ADD COLUMN realized_pnl NUMERIC DEFAULT 0;
        COMMENT ON COLUMN public.paper_trades.realized_pnl IS 'Realized profit and loss';
    END IF;

    -- Add unrealized_pnl column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'paper_trades' AND column_name = 'unrealized_pnl') THEN
        ALTER TABLE public.paper_trades ADD COLUMN unrealized_pnl NUMERIC DEFAULT 0;
        COMMENT ON COLUMN public.paper_trades.unrealized_pnl IS 'Unrealized profit and loss';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'paper_trades' AND column_name = 'metadata') THEN
        ALTER TABLE public.paper_trades ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN public.paper_trades.metadata IS 'Additional trade metadata';
    END IF;

    -- Add agent_name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'paper_trades' AND column_name = 'agent_name') THEN
        ALTER TABLE public.paper_trades ADD COLUMN agent_name VARCHAR;
        COMMENT ON COLUMN public.paper_trades.agent_name IS 'Name of the trading agent';
    END IF;
END
$$;

-- Add index on trade_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'paper_trades_trade_id_idx') THEN
        CREATE INDEX IF NOT EXISTS paper_trades_trade_id_idx ON public.paper_trades(trade_id);
    END IF;
END
$$;

-- Make sure all timestamps are managed by triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at' AND tgrelid = 'public.paper_trades'::regclass) THEN
        CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.paper_trades
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END
$$;

-- Insert sample data with UUID-compatible values and safer insertion logic
-- Only insert if no records exist
DO $$
DECLARE
    sample_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sample_count FROM public.paper_trades;
    
    IF sample_count = 0 THEN
        -- Generate proper UUIDs for agent_id values
        INSERT INTO public.paper_trades 
        (id, agent_id, symbol, side, order_type, quantity, price, status, strategy_name, agent_name, created_at, executed_at, updated_at) 
        VALUES
        (gen_random_uuid(), gen_random_uuid(), 'BTC/USDT', 'buy', 'limit', 0.1, 29350.5, 'filled', 'momentum_breakout', 'Alpha', NOW(), NOW(), NOW()),
        (gen_random_uuid(), gen_random_uuid(), 'ETH/USDT', 'sell', 'limit', 1.5, 1810.25, 'filled', 'mean_reversion', 'Beta', NOW(), NOW(), NOW()),
        (gen_random_uuid(), gen_random_uuid(), 'SOL/USDT', 'buy', 'market', 10, 64.75, 'filled', 'trend_following', 'Gamma', NOW(), NOW(), NOW());
    END IF;
END
$$;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.paper_trades ENABLE ROW LEVEL SECURITY;

-- Check if RLS policies exist and create if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paper_trades' AND policyname = 'Users can view all paper trades') THEN
        CREATE POLICY "Users can view all paper trades" ON public.paper_trades
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paper_trades' AND policyname = 'Authenticated users can insert paper trades') THEN
        CREATE POLICY "Authenticated users can insert paper trades" ON public.paper_trades
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paper_trades' AND policyname = 'Authenticated users can update paper trades') THEN
        CREATE POLICY "Authenticated users can update paper trades" ON public.paper_trades
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END
$$;