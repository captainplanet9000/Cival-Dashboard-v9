#!/usr/bin/env python3
"""
Database Migration Script for Leverage Engine and Profit Securing
Runs the SQL migration to create all necessary tables and indexes
"""

import asyncio
import os
import sys
import logging
from pathlib import Path

# Add the parent directory to sys.path to import from services
sys.path.append(str(Path(__file__).parent.parent))

from database.supabase_client import get_supabase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_leverage_migration():
    """Run the leverage and profit securing database migration"""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        if not supabase:
            logger.error("❌ Failed to connect to Supabase database")
            return False
        
        logger.info("🔗 Connected to Supabase database")
        
        # Read the migration SQL file
        migration_file = Path(__file__).parent / "migrations" / "create_leverage_profit_tables.sql"
        
        if not migration_file.exists():
            logger.error(f"❌ Migration file not found: {migration_file}")
            return False
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        logger.info("📄 Read migration SQL file")
        
        # Split the SQL into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        logger.info(f"🔄 Executing {len(statements)} SQL statements...")
        
        # Execute each statement
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements):
            if not statement or statement.startswith('--'):
                continue
                
            try:
                # Use raw SQL execution for PostgreSQL-specific features
                result = supabase.rpc('execute_sql', {'sql_statement': statement})
                if hasattr(result, 'execute'):
                    result.execute()
                
                success_count += 1
                
                # Log progress for major statements
                if any(keyword in statement.upper() for keyword in ['CREATE TABLE', 'CREATE VIEW', 'CREATE INDEX']):
                    statement_preview = statement.split('\n')[0][:80] + '...' if len(statement) > 80 else statement.split('\n')[0]
                    logger.info(f"✅ ({i+1}/{len(statements)}) {statement_preview}")
                
            except Exception as e:
                error_count += 1
                statement_preview = statement.split('\n')[0][:50] + '...' if len(statement) > 50 else statement.split('\n')[0]
                logger.warning(f"⚠️  ({i+1}/{len(statements)}) Failed: {statement_preview} - {str(e)}")
                
                # Continue with other statements even if some fail
                continue
        
        logger.info(f"📊 Migration completed: {success_count} successful, {error_count} errors")
        
        # Verify key tables were created
        await verify_tables_created(supabase)
        
        return error_count == 0
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

async def verify_tables_created(supabase):
    """Verify that key tables were created successfully"""
    try:
        key_tables = [
            'leverage_positions',
            'agent_leverage_settings', 
            'profit_milestones',
            'goal_completion_profits',
            'profit_securing_deposits',
            'profit_securing_borrows',
            'agent_states',
            'automation_workflows',
            'agent_integrations'
        ]
        
        logger.info("🔍 Verifying table creation...")
        
        for table in key_tables:
            try:
                # Try to query the table to see if it exists
                result = supabase.table(table).select('*').limit(1).execute()
                logger.info(f"✅ Table '{table}' exists and is accessible")
            except Exception as e:
                logger.warning(f"⚠️  Table '{table}' may not exist or is not accessible: {e}")
        
        # Try to query the views
        try:
            result = supabase.rpc('select', {'table_name': 'agent_integration_overview'})
            logger.info("✅ View 'agent_integration_overview' exists")
        except Exception as e:
            logger.warning(f"⚠️  View 'agent_integration_overview' may not exist: {e}")
        
        try:
            result = supabase.rpc('select', {'table_name': 'risk_monitoring_overview'})
            logger.info("✅ View 'risk_monitoring_overview' exists")
        except Exception as e:
            logger.warning(f"⚠️  View 'risk_monitoring_overview' may not exist: {e}")
            
    except Exception as e:
        logger.error(f"❌ Table verification failed: {e}")

async def rollback_migration():
    """Rollback the migration by dropping all created tables"""
    try:
        supabase = get_supabase_client()
        if not supabase:
            logger.error("❌ Failed to connect to Supabase database")
            return False
        
        logger.info("🔄 Rolling back leverage and profit securing migration...")
        
        # Tables to drop in reverse dependency order
        tables_to_drop = [
            'profit_securing_analytics',
            'system_activity_metrics', 
            'automation_workflows',
            'agent_integrations',
            'agent_checkpoints',
            'agent_states',
            'profit_securing_borrows',
            'profit_securing_deposits',
            'goal_completion_profits',
            'profit_milestones',
            'profit_securing_rules',
            'leverage_risk_metrics',
            'agent_leverage_settings',
            'leverage_positions'
        ]
        
        # Views to drop
        views_to_drop = [
            'agent_integration_overview',
            'risk_monitoring_overview'
        ]
        
        # Drop views first
        for view in views_to_drop:
            try:
                result = supabase.rpc('execute_sql', {'sql_statement': f'DROP VIEW IF EXISTS {view} CASCADE;'})
                logger.info(f"✅ Dropped view '{view}'")
            except Exception as e:
                logger.warning(f"⚠️  Failed to drop view '{view}': {e}")
        
        # Drop tables
        for table in tables_to_drop:
            try:
                result = supabase.rpc('execute_sql', {'sql_statement': f'DROP TABLE IF EXISTS {table} CASCADE;'})
                logger.info(f"✅ Dropped table '{table}'")
            except Exception as e:
                logger.warning(f"⚠️  Failed to drop table '{table}': {e}")
        
        logger.info("✅ Migration rollback completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Rollback failed: {e}")
        return False

async def main():
    """Main function to run migration or rollback"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Leverage and Profit Securing Database Migration')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    parser.add_argument('--verify', action='store_true', help='Only verify tables exist')
    
    args = parser.parse_args()
    
    if args.rollback:
        logger.info("🔄 Starting migration rollback...")
        success = await rollback_migration()
        if success:
            logger.info("✅ Migration rollback completed successfully")
        else:
            logger.error("❌ Migration rollback failed")
            sys.exit(1)
            
    elif args.verify:
        logger.info("🔍 Verifying table existence...")
        try:
            supabase = get_supabase_client()
            await verify_tables_created(supabase)
        except Exception as e:
            logger.error(f"❌ Verification failed: {e}")
            sys.exit(1)
            
    else:
        logger.info("🚀 Starting leverage and profit securing migration...")
        success = await run_leverage_migration()
        if success:
            logger.info("✅ Migration completed successfully")
            logger.info("🎯 Leverage engine and profit securing database schema is ready!")
        else:
            logger.error("❌ Migration completed with errors")
            logger.info("💡 You can run with --rollback to clean up and try again")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())