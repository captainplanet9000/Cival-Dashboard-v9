-- Fix invalid UUID format for default_user
-- Migration to convert 'default_user' strings to proper UUID format

-- Define the constant UUID to use (matching the one in Python code)
DO $$
DECLARE
  default_user_uuid UUID := '09c1de86-05fc-4326-a62b-fd5ff1c8b8f3';
BEGIN
  -- Update dashboard_state table
  ALTER TABLE IF EXISTS public.dashboard_state 
    ALTER COLUMN user_id TYPE UUID USING 
      CASE WHEN user_id = 'default_user' THEN default_user_uuid::UUID ELSE user_id::UUID END;

  -- Update widget_state table 
  ALTER TABLE IF EXISTS public.widget_state
    ALTER COLUMN user_id TYPE UUID USING 
      CASE WHEN user_id = 'default_user' THEN default_user_uuid::UUID ELSE user_id::UUID END;

  -- Update layout_state table
  ALTER TABLE IF EXISTS public.layout_state
    ALTER COLUMN user_id TYPE UUID USING 
      CASE WHEN user_id = 'default_user' THEN default_user_uuid::UUID ELSE user_id::UUID END;

  -- Update any RLS policies to use UUID instead of text comparison
  -- Note: This requires dropping and recreating policies that reference 'default_user'

  -- For dashboard_state
  DROP POLICY IF EXISTS "Public read access for dashboard_state" ON public.dashboard_state;
  CREATE POLICY "Public read access for dashboard_state" ON public.dashboard_state
    FOR SELECT USING (user_id = default_user_uuid);

  -- For widget_state
  DROP POLICY IF EXISTS "Public read access for widget_state" ON public.widget_state;
  CREATE POLICY "Public read access for widget_state" ON public.widget_state
    FOR SELECT USING (user_id = default_user_uuid);

  -- For layout_state
  DROP POLICY IF EXISTS "Public read access for layout_state" ON public.layout_state;
  CREATE POLICY "Public read access for layout_state" ON public.layout_state
    FOR SELECT USING (user_id = default_user_uuid);
END $$;