-- Create farms table with goal functionality
CREATE TABLE IF NOT EXISTS public.farms (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) > 2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'configuring' 
    CHECK (status IN ('configuring', 'active', 'stopped', 'goal_met', 'error')),
  
  -- Farm configuration
  config JSONB DEFAULT '{}'::jsonb,
  resources JSONB DEFAULT '{}'::jsonb,
  farm_type TEXT DEFAULT 'standard',
  
  -- Performance metrics
  total_trades INTEGER DEFAULT 0,
  profitable_trades INTEGER DEFAULT 0,
  total_pnl NUMERIC(18,6) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add standard triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create the function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_farms_updated_at') THEN
    CREATE TRIGGER handle_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_farms_created_at') THEN
    CREATE TRIGGER handle_farms_created_at
    BEFORE INSERT ON public.farms
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_created_at();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS farms_user_id_idx ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS farms_status_idx ON public.farms(status);

-- Enable Row Level Security
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_select_own_farms') THEN
    CREATE POLICY users_select_own_farms ON public.farms
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_insert_own_farms') THEN
    CREATE POLICY users_insert_own_farms ON public.farms
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_update_own_farms') THEN
    CREATE POLICY users_update_own_farms ON public.farms
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_delete_own_farms') THEN
    CREATE POLICY users_delete_own_farms ON public.farms
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.farms IS 'Trading farms created by users to organize their trading agents and goals';
COMMENT ON COLUMN public.farms.id IS 'Primary key for the farm';
COMMENT ON COLUMN public.farms.user_id IS 'Foreign key to the user who owns this farm';
COMMENT ON COLUMN public.farms.name IS 'Name of the farm';
COMMENT ON COLUMN public.farms.description IS 'Description of the farm purpose';
COMMENT ON COLUMN public.farms.status IS 'Current status of the farm (configuring, active, stopped, goal_met, error)';
COMMENT ON COLUMN public.farms.config IS 'JSON configuration for the farm';
COMMENT ON COLUMN public.farms.resources IS 'Resources allocated to the farm';
COMMENT ON COLUMN public.farms.farm_type IS 'Type of farm (standard, pro, enterprise)';
COMMENT ON COLUMN public.farms.total_trades IS 'Total number of trades executed by agents in this farm';
COMMENT ON COLUMN public.farms.profitable_trades IS 'Number of profitable trades executed by agents in this farm';
COMMENT ON COLUMN public.farms.total_pnl IS 'Total profit and loss for this farm';

-- Insert sample farms for development
INSERT INTO public.farms (user_id, name, description, status, config, farm_type)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Alpha Strategies', 'Trading farm focused on alpha generation strategies', 'active', '{"max_drawdown": 0.1, "risk_level": "medium"}'::jsonb, 'standard'),
  ('00000000-0000-0000-0000-000000000000', 'DEX Arbitrage', 'Farm specialized in DEX arbitrage opportunities', 'configuring', '{"max_slippage": 0.005, "gas_limit": 500000}'::jsonb, 'pro')
ON CONFLICT (id) DO NOTHING;
