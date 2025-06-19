-- CORRECTED: Fix existing tables script with proper syntax
-- This fixes the syntax error in the previous script

-- Fix wallets table - add missing columns if they don't exist
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        -- Add the column first
        ALTER TABLE wallets ADD COLUMN id UUID;
        -- Set default values for existing rows
        UPDATE wallets SET id = gen_random_uuid() WHERE id IS NULL;
        -- Make it NOT NULL
        ALTER TABLE wallets ALTER COLUMN id SET NOT NULL;
        -- Add primary key constraint
        ALTER TABLE wallets ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);
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
        -- Set default name for existing rows
        UPDATE wallets SET name = 'Default Wallet' WHERE name IS NULL;
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

    RAISE NOTICE 'Wallets table updated successfully';
END $$;

-- Fix users table
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN id UUID;
        UPDATE users SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE users ALTER COLUMN id SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;

    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email' AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
        -- Set default email for existing rows
        UPDATE users SET email = 'user@example.com' WHERE email IS NULL;
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

    RAISE NOTICE 'Users table updated successfully';
END $$;

-- Fix autonomous_agents table
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN id UUID;
        UPDATE autonomous_agents SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE autonomous_agents ALTER COLUMN id SET NOT NULL;
        ALTER TABLE autonomous_agents ADD CONSTRAINT autonomous_agents_pkey PRIMARY KEY (id);
    END IF;

    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN name VARCHAR(255);
        UPDATE autonomous_agents SET name = 'Default Agent' WHERE name IS NULL;
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'autonomous_agents' AND column_name = 'type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE autonomous_agents ADD COLUMN type VARCHAR(100);
        UPDATE autonomous_agents SET type = 'trading' WHERE type IS NULL;
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

    RAISE NOTICE 'Autonomous agents table updated successfully';
END $$;

-- Fix trading_strategies table
DO $$
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN id UUID;
        UPDATE trading_strategies SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE trading_strategies ALTER COLUMN id SET NOT NULL;
        ALTER TABLE trading_strategies ADD CONSTRAINT trading_strategies_pkey PRIMARY KEY (id);
    END IF;

    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN name VARCHAR(255);
        UPDATE trading_strategies SET name = 'Default Strategy' WHERE name IS NULL;
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_strategies' AND column_name = 'type' AND table_schema = 'public'
    ) THEN
        ALTER TABLE trading_strategies ADD COLUMN type VARCHAR(100);
        UPDATE trading_strategies SET type = 'momentum' WHERE type IS NULL;
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

    RAISE NOTICE 'Trading strategies table updated successfully';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_autonomous_agents_status ON autonomous_agents(status);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_status ON trading_strategies(status);

-- Success message
SELECT 'All existing tables have been fixed with proper syntax!' as status;