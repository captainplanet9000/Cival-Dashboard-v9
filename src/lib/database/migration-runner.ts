'use client'

import React from 'react'

/**
 * Database Migration Runner
 * Automatically runs database migrations for missing tables
 */

interface Migration {
  id: string
  name: string
  sql: string
  version: number
}

class MigrationRunner {
  private static instance: MigrationRunner
  private useSupabase = false
  private migrations: Migration[] = []

  private constructor() {
    this.loadMigrations()
    this.checkSupabaseAvailability()
  }

  static getInstance(): MigrationRunner {
    if (!MigrationRunner.instance) {
      MigrationRunner.instance = new MigrationRunner()
    }
    return MigrationRunner.instance
  }

  private async checkSupabaseAvailability() {
    try {
      const { isSupabaseAvailable } = await import('@/lib/supabase/client')
      const available = await isSupabaseAvailable()
      
      if (available) {
        this.useSupabase = true
        console.log('🗄️ Migration runner: Using Supabase for database migrations')
        // Auto-run migrations
        await this.runPendingMigrations()
      } else {
        console.log('🟡 Migration runner: Supabase not available, migrations skipped')
      }
    } catch (error) {
      console.log('🟡 Migration runner: Supabase unavailable, migrations skipped')
      this.useSupabase = false
    }
  }

  private loadMigrations() {
    // Define migrations inline for reliability
    this.migrations = [
      {
        id: '001_create_dashboard_state',
        name: 'Create dashboard_state table',
        version: 1,
        sql: `
          CREATE TABLE IF NOT EXISTS dashboard_state (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID,
              dashboard_type VARCHAR(50) NOT NULL DEFAULT 'main',
              state_data JSONB NOT NULL DEFAULT '{}',
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              expires_at TIMESTAMP WITH TIME ZONE,
              
              CONSTRAINT dashboard_state_type_check CHECK (dashboard_type IN ('main', 'trading', 'analytics', 'overview', 'agents', 'farms', 'goals', 'risk', 'history'))
          );
          
          CREATE INDEX IF NOT EXISTS idx_dashboard_state_type ON dashboard_state(dashboard_type);
          CREATE INDEX IF NOT EXISTS idx_dashboard_state_user_id ON dashboard_state(user_id);
          CREATE INDEX IF NOT EXISTS idx_dashboard_state_updated_at ON dashboard_state(updated_at);
          
          CREATE OR REPLACE FUNCTION update_dashboard_state_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trigger_update_dashboard_state_updated_at
              BEFORE UPDATE ON dashboard_state
              FOR EACH ROW
              EXECUTE FUNCTION update_dashboard_state_updated_at();
        `
      },
      {
        id: '002_create_paper_trades',
        name: 'Create paper_trades table',
        version: 2,
        sql: `
          CREATE TABLE IF NOT EXISTS paper_trades (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              trade_id VARCHAR(255) UNIQUE NOT NULL,
              agent_id VARCHAR(255) NOT NULL,
              agent_name VARCHAR(255),
              symbol VARCHAR(50) NOT NULL,
              side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
              order_type VARCHAR(20) NOT NULL DEFAULT 'market',
              quantity DECIMAL(20, 8) NOT NULL,
              price DECIMAL(20, 8) NOT NULL,
              execution_price DECIMAL(20, 8),
              status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
              realized_pnl DECIMAL(20, 8) DEFAULT 0,
              unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
              fee DECIMAL(20, 8) DEFAULT 0,
              commission DECIMAL(20, 8) DEFAULT 0,
              position_id VARCHAR(255),
              strategy VARCHAR(100),
              signal_strength DECIMAL(5, 2),
              confidence DECIMAL(5, 2),
              reason TEXT,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              executed_at TIMESTAMP WITH TIME ZONE,
              
              CONSTRAINT paper_trades_quantity_positive CHECK (quantity > 0),
              CONSTRAINT paper_trades_price_positive CHECK (price > 0)
          );
          
          CREATE INDEX IF NOT EXISTS idx_paper_trades_agent_id ON paper_trades(agent_id);
          CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON paper_trades(symbol);
          CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON paper_trades(status);
          CREATE INDEX IF NOT EXISTS idx_paper_trades_created_at ON paper_trades(created_at);
          CREATE INDEX IF NOT EXISTS idx_paper_trades_side ON paper_trades(side);
          CREATE INDEX IF NOT EXISTS idx_paper_trades_trade_id ON paper_trades(trade_id);
          
          CREATE OR REPLACE FUNCTION update_paper_trades_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trigger_update_paper_trades_updated_at
              BEFORE UPDATE ON paper_trades
              FOR EACH ROW
              EXECUTE FUNCTION update_paper_trades_updated_at();
        `
      },
      {
        id: '003_create_agents_table',
        name: 'Create agents table',
        version: 3,
        sql: `
          CREATE TABLE IF NOT EXISTS agents (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              agent_id VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              strategy_type VARCHAR(100) NOT NULL DEFAULT 'momentum',
              status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'error')),
              
              config JSONB NOT NULL DEFAULT '{}',
              initial_capital DECIMAL(20, 8) DEFAULT 10000,
              current_capital DECIMAL(20, 8) DEFAULT 10000,
              
              total_trades INTEGER DEFAULT 0,
              winning_trades INTEGER DEFAULT 0,
              losing_trades INTEGER DEFAULT 0,
              total_pnl DECIMAL(20, 8) DEFAULT 0,
              realized_pnl DECIMAL(20, 8) DEFAULT 0,
              unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
              max_drawdown DECIMAL(5, 2) DEFAULT 0,
              sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
              win_rate DECIMAL(5, 2) DEFAULT 0,
              
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              last_trade_at TIMESTAMP WITH TIME ZONE,
              
              farm_id UUID,
              metadata JSONB DEFAULT '{}'
          );
          
          CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
          CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
          CREATE INDEX IF NOT EXISTS idx_agents_strategy_type ON agents(strategy_type);
          CREATE INDEX IF NOT EXISTS idx_agents_farm_id ON agents(farm_id);
          CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);
          
          CREATE OR REPLACE FUNCTION update_agents_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trigger_update_agents_updated_at
              BEFORE UPDATE ON agents
              FOR EACH ROW
              EXECUTE FUNCTION update_agents_updated_at();
        `
      },
      {
        id: '004_create_farms_table',
        name: 'Create farms table',
        version: 4,
        sql: `
          CREATE TABLE IF NOT EXISTS farms (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              farm_id VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              
              strategy VARCHAR(100) NOT NULL DEFAULT 'darvas_box',
              agent_count INTEGER DEFAULT 5,
              total_allocated_usd DECIMAL(20, 8) DEFAULT 50000,
              coordination_mode VARCHAR(50) DEFAULT 'coordinated' CHECK (coordination_mode IN ('independent', 'coordinated', 'hierarchical')),
              
              status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'deploying')),
              is_active BOOLEAN DEFAULT true,
              
              performance_metrics JSONB DEFAULT '{}',
              total_value DECIMAL(20, 8) DEFAULT 0,
              total_pnl DECIMAL(20, 8) DEFAULT 0,
              win_rate DECIMAL(5, 2) DEFAULT 0,
              trade_count INTEGER DEFAULT 0,
              roi_percent DECIMAL(5, 2) DEFAULT 0,
              active_agents INTEGER DEFAULT 0,
              
              risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
              max_drawdown_percent DECIMAL(5, 2) DEFAULT 15,
              position_size_limit DECIMAL(5, 2) DEFAULT 10,
              
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              last_rebalance_at TIMESTAMP WITH TIME ZONE,
              
              config JSONB DEFAULT '{}',
              goals JSONB DEFAULT '[]',
              wallet_allocations JSONB DEFAULT '{}'
          );
          
          CREATE INDEX IF NOT EXISTS idx_farms_farm_id ON farms(farm_id);
          CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);
          CREATE INDEX IF NOT EXISTS idx_farms_strategy ON farms(strategy);
          CREATE INDEX IF NOT EXISTS idx_farms_is_active ON farms(is_active);
          CREATE INDEX IF NOT EXISTS idx_farms_created_at ON farms(created_at);
          
          CREATE OR REPLACE FUNCTION update_farms_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trigger_update_farms_updated_at
              BEFORE UPDATE ON farms
              FOR EACH ROW
              EXECUTE FUNCTION update_farms_updated_at();
        `
      },
      {
        id: '005_create_goals_table',
        name: 'Create goals table',
        version: 5,
        sql: `
          CREATE TABLE IF NOT EXISTS goals (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              goal_id VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              
              goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('profit', 'winRate', 'trades', 'drawdown', 'sharpe', 'portfolio', 'farm', 'blockchain')),
              target_value DECIMAL(20, 8) NOT NULL,
              current_value DECIMAL(20, 8) DEFAULT 0,
              
              completion_percentage DECIMAL(5, 2) DEFAULT 0,
              completion_status VARCHAR(50) DEFAULT 'active' CHECK (completion_status IN ('active', 'completed', 'failed', 'paused')),
              
              deadline DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              completed_at TIMESTAMP WITH TIME ZONE,
              
              priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 4),
              category VARCHAR(50) DEFAULT 'trading' CHECK (category IN ('trading', 'farm', 'portfolio', 'risk')),
              tags JSONB DEFAULT '[]',
              
              farm_id UUID,
              agent_id VARCHAR(255),
              
              target_criteria JSONB DEFAULT '{}',
              current_progress JSONB DEFAULT '{}',
              milestones JSONB DEFAULT '[]',
              
              reward TEXT,
              metadata JSONB DEFAULT '{}'
          );
          
          CREATE INDEX IF NOT EXISTS idx_goals_goal_id ON goals(goal_id);
          CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);
          CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(completion_status);
          CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
          CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
          CREATE INDEX IF NOT EXISTS idx_goals_farm_id ON goals(farm_id);
          CREATE INDEX IF NOT EXISTS idx_goals_agent_id ON goals(agent_id);
          CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
          CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);
          
          CREATE OR REPLACE FUNCTION update_goals_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trigger_update_goals_updated_at
              BEFORE UPDATE ON goals
              FOR EACH ROW
              EXECUTE FUNCTION update_goals_updated_at();
        `
      }
    ]
  }

  async runPendingMigrations(): Promise<boolean> {
    if (!this.useSupabase) {
      console.log('🟡 Migrations skipped: Supabase not available')
      return false
    }

    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable()

      // Get already applied migrations
      const { data: appliedMigrations } = await supabase
        .from('schema_migrations')
        .select('migration_id, version')

      const appliedIds = new Set(appliedMigrations?.map(m => m.migration_id) || [])

      // Run pending migrations
      let migrationsRun = 0
      for (const migration of this.migrations) {
        if (!appliedIds.has(migration.id)) {
          console.log(`🗄️ Running migration: ${migration.name}`)
          
          const success = await this.runSingleMigration(migration)
          if (success) {
            migrationsRun++
            console.log(`✅ Migration completed: ${migration.name}`)
          } else {
            console.error(`❌ Migration failed: ${migration.name}`)
            break
          }
        }
      }

      if (migrationsRun > 0) {
        console.log(`🗄️ Completed ${migrationsRun} database migrations`)
      } else {
        console.log('🗄️ Database schema is up to date')
      }

      return true
    } catch (error) {
      console.error('Migration runner error:', error)
      return false
    }
  }

  private async createMigrationsTable(): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS schema_migrations (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              migration_id VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              version INTEGER NOT NULL,
              applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })

      if (error && !error.message.includes('already exists')) {
        throw error
      }
    } catch (error) {
      // Table might already exist, ignore the error
      console.log('🗄️ Migrations table initialized')
    }
  }

  private async runSingleMigration(migration: Migration): Promise<boolean> {
    try {
      const { supabase } = await import('@/lib/supabase/client')

      // Execute the migration SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: migration.sql
      })

      if (sqlError) {
        console.error(`Migration SQL error for ${migration.id}:`, sqlError)
        return false
      }

      // Record the migration as applied
      const { error: recordError } = await supabase
        .from('schema_migrations')
        .insert({
          migration_id: migration.id,
          name: migration.name,
          version: migration.version
        })

      if (recordError && !recordError.message.includes('duplicate key')) {
        console.error(`Migration record error for ${migration.id}:`, recordError)
        return false
      }

      return true
    } catch (error) {
      console.error(`Migration execution error for ${migration.id}:`, error)
      return false
    }
  }

  // Manual migration runner for specific tables
  async ensureTablesExist(tables: string[]): Promise<boolean> {
    if (!this.useSupabase) return false

    try {
      const { supabase } = await import('@/lib/supabase/client')

      for (const table of tables) {
        // Try to query the table to see if it exists
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error && error.message.includes('does not exist')) {
          console.log(`🗄️ Table ${table} missing, running migration...`)
          
          // Find and run the migration for this table
          const migration = this.migrations.find(m => 
            m.sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
          )
          
          if (migration) {
            await this.runSingleMigration(migration)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Table check error:', error)
      return false
    }
  }
}

// Auto-run migrations when the service is imported
let migrationPromise: Promise<void> | null = null

export function runMigrations(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const runner = MigrationRunner.getInstance()
      await runner.runPendingMigrations()
    })()
  }
  return migrationPromise
}

// Hook for React components
export function useMigrations() {
  const [migrationsComplete, setMigrationsComplete] = React.useState(false)
  
  React.useEffect(() => {
    runMigrations().then(() => {
      setMigrationsComplete(true)
    })
  }, [])
  
  return { migrationsComplete }
}

export default MigrationRunner