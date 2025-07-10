#!/usr/bin/env python3
"""
Apply database migration to Supabase
"""
import os
import asyncio
import asyncpg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def apply_migration():
    """Apply the consolidated agent trading schema migration"""
    
    # Database connection string
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    # Read the migration file
    migration_file = 'supabase/migrations/20250526105300_consolidated_agent_trading_schema.sql'
    
    try:
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print(f"📄 Loaded migration file: {migration_file}")
        print(f"📝 Migration contains {len(migration_sql)} characters")
        
        # Connect to database
        print("🔌 Connecting to Supabase database...")
        conn = await asyncpg.connect(database_url)
        
        # Apply the migration
        print("⚡ Applying migration...")
        await conn.execute(migration_sql)
        
        # Verify tables were created
        print("🔍 Verifying tables were created...")
        
        tables_to_check = [
            'agent_trading_permissions',
            'agent_trades', 
            'agent_positions',
            'agent_performance',
            'agent_status',
            'agent_market_data_subscriptions',
            'agent_state',
            'agent_checkpoints',
            'agent_decisions'
        ]
        
        for table in tables_to_check:
            result = await conn.fetchval(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public')",
                table
            )
            if result:
                print(f"✅ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' not found")
        
        # Close connection
        await conn.close()
        
        print("🎉 Migration applied successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(apply_migration())
    if success:
        print("\n✅ Database migration completed successfully!")
        print("🚀 All agent trading tables are now available in Supabase")
    else:
        print("\n❌ Migration failed - please check the error messages above")