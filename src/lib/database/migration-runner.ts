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