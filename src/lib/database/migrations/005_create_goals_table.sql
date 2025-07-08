-- Create goals table for trading farms
CREATE TABLE IF NOT EXISTS public.goals (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Goal configuration
  metric TEXT NOT NULL CHECK (metric IN ('balance_usdc', 'balance_eth', 'profit_percentage', 'trade_count', 'win_rate', 'cumulative_gas_usd_limit')),
  target_value NUMERIC(22,6) NOT NULL,
  current_value NUMERIC(22,6) DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Goal status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  deadline TIMESTAMP WITH TIME ZONE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  priority INTEGER DEFAULT 1,
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add triggers for the goals table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_goals_updated_at') THEN
    CREATE TRIGGER handle_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_goals_created_at') THEN
    CREATE TRIGGER handle_goals_created_at
    BEFORE INSERT ON public.goals
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_created_at();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS goals_farm_id_idx ON public.goals(farm_id);
CREATE INDEX IF NOT EXISTS goals_status_idx ON public.goals(status);
CREATE INDEX IF NOT EXISTS goals_metric_idx ON public.goals(metric);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies based on farm ownership
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_select_goals_for_their_farms') THEN
    CREATE POLICY users_select_goals_for_their_farms ON public.goals
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM farms 
          WHERE farms.id = goals.farm_id AND farms.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_insert_goals_for_their_farms') THEN
    CREATE POLICY users_insert_goals_for_their_farms ON public.goals
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM farms 
          WHERE farms.id = goals.farm_id AND farms.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_update_goals_for_their_farms') THEN
    CREATE POLICY users_update_goals_for_their_farms ON public.goals
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM farms 
          WHERE farms.id = goals.farm_id AND farms.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'users_delete_goals_for_their_farms') THEN
    CREATE POLICY users_delete_goals_for_their_farms ON public.goals
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM farms 
          WHERE farms.id = goals.farm_id AND farms.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create function to update goal progress
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_value > 0 AND NEW.current_value IS NOT NULL THEN
    -- Calculate progress percentage (cap at 100%)
    NEW.progress_percentage := LEAST(100.0, (NEW.current_value / NEW.target_value) * 100.0);
    
    -- Update achieved_at timestamp if goal is newly completed
    IF NEW.progress_percentage >= 100.0 AND 
       (OLD.progress_percentage IS NULL OR OLD.progress_percentage < 100.0) THEN
      NEW.achieved_at := now();
      NEW.status := 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for goal progress updates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_goal_progress_trigger') THEN
    CREATE TRIGGER update_goal_progress_trigger
    BEFORE UPDATE OF current_value ON public.goals
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_goal_progress();
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.goals IS 'Trading goals associated with farms';
COMMENT ON COLUMN public.goals.id IS 'Primary key for the goal';
COMMENT ON COLUMN public.goals.farm_id IS 'Foreign key to the farm this goal belongs to';
COMMENT ON COLUMN public.goals.metric IS 'Type of metric to track (balance_usdc, balance_eth, profit_percentage, etc)';
COMMENT ON COLUMN public.goals.target_value IS 'Target value for the goal';
COMMENT ON COLUMN public.goals.current_value IS 'Current value for the goal metric';
COMMENT ON COLUMN public.goals.progress_percentage IS 'Goal progress as a percentage';
COMMENT ON COLUMN public.goals.status IS 'Current status of the goal (active, paused, completed, failed)';
COMMENT ON COLUMN public.goals.deadline IS 'Optional deadline for achieving the goal';
COMMENT ON COLUMN public.goals.achieved_at IS 'Timestamp when the goal was achieved';

-- Insert sample goals for development
INSERT INTO public.goals (farm_id, title, description, metric, target_value, current_value, progress_percentage)
VALUES 
  (1, 'USDC Balance Goal', 'Reach 10,000 USDC in farm balance', 'balance_usdc', 10000, 2500, 25),
  (1, 'ETH Balance Goal', 'Accumulate 5 ETH', 'balance_eth', 5, 0.75, 15),
  (2, 'Profit Percentage', 'Achieve 30% return on investment', 'profit_percentage', 30, 12, 40)
ON CONFLICT (id) DO NOTHING;
