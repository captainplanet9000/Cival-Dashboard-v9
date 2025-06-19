-- Fix existing tables that may be missing required columns
-- Run this to add missing columns to existing tables

-- First, let's check what columns exist in wallets table
-- (Comment this out after checking)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'wallets' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Fix wallets table - add missing columns if they don't exist
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN id UUID DEFAULT gen_random_uuid();
        -- If table has data, update existing rows to have UUIDs
        UPDATE wallets SET id = gen_random_uuid() WHERE id IS NULL;
        -- Make it primary key
        ALTER TABLE wallets ALTER COLUMN id SET NOT NULL;
        ALTER TABLE wallets ADD PRIMARY KEY (id);
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'user_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN user_id UUID;
    END IF;

    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN name VARCHAR(255);
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN type VARCHAR(50) DEFAULT 'spot';
    END IF;

    -- Add balance column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'balance' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN balance DECIMAL(20,8) DEFAULT 0;
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'currency' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN currency VARCHAR(10) DEFAULT 'USDT';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'is_active' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'updated_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE wallets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Fix users table - add missing columns if they don't exist
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN id UUID DEFAULT gen_random_uuid();
        UPDATE users SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE users ALTER COLUMN id SET NOT NULL;
        ALTER TABLE users ADD PRIMARY KEY (id);
    END IF;

    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email' AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
    END IF;

    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role' AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Fix autonomous_agents table
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN id UUID DEFAULT gen_random_uuid();
        UPDATE autonomous_agents SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE autonomous_agents ALTER COLUMN id SET NOT NULL;
        ALTER TABLE autonomous_agents ADD PRIMARY KEY (id);
    END IF;

    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN name VARCHAR(255);
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN type VARCHAR(100);
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'status' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN status VARCHAR(50) DEFAULT 'inactive';
    END IF;

    -- Add configuration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'configuration' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN configuration JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add capabilities column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'capabilities' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN capabilities JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add memory_bank column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'memory_bank' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN memory_bank JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add learning_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'learning_rate' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN learning_rate DECIMAL(10,6) DEFAULT 0.001;
    END IF;

    -- Add exploration_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'exploration_rate' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN exploration_rate DECIMAL(10,6) DEFAULT 0.1;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Fix trading_strategies table
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN id UUID DEFAULT gen_random_uuid();
        UPDATE trading_strategies SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE trading_strategies ALTER COLUMN id SET NOT NULL;
        ALTER TABLE trading_strategies ADD PRIMARY KEY (id);
    END IF;

    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN name VARCHAR(255);
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN type VARCHAR(100);
    END IF;

    -- Add parameters column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'parameters' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN parameters JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'status' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN status VARCHAR(50) DEFAULT 'inactive';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add user_id foreign key to wallets if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wallets_user_id_fkey' AND table_name = 'wallets'
    ) THEN
        ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Success message
SELECT 'Fixed existing table structures - ready for main migration!' as status;