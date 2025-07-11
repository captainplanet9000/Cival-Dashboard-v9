#!/usr/bin/env python3
"""
Simple Calendar Migration Script
Standalone script to create calendar tables without complex dependencies
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Simple database connection using environment variables
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL from environment"""
    # Try different environment variable names
    db_url = (
        os.getenv('DATABASE_URL') or 
        os.getenv('POSTGRES_URL') or 
        os.getenv('SUPABASE_DB_URL') or
        'postgresql://localhost:5432/trading_platform'
    )
    
    logger.info(f"Using database URL: {db_url.split('@')[0]}@[HIDDEN]")
    return db_url

def run_calendar_migration():
    """Run the calendar database migration"""
    try:
        logger.info("Starting calendar database migration...")
        
        # Get database connection
        db_url = get_database_url()
        
        # Connect to database
        logger.info("Connecting to database...")
        conn = psycopg2.connect(db_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Read calendar schema file
        schema_path = os.path.join(
            os.path.dirname(__file__),
            'migrations/calendar_events_schema.sql'
        )
        
        if not os.path.exists(schema_path):
            logger.error(f"Calendar schema file not found: {schema_path}")
            return False
        
        logger.info(f"Reading calendar schema from: {schema_path}")
        
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Split the schema into individual statements
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        
        logger.info(f"Executing {len(statements)} SQL statements...")
        
        # Execute each statement
        for i, statement in enumerate(statements):
            try:
                if statement.strip():
                    logger.debug(f"Executing statement {i+1}/{len(statements)}")
                    cursor.execute(statement)
                    logger.debug(f"✓ Statement {i+1} executed successfully")
            except Exception as e:
                # Some statements may already exist, log but continue
                if "already exists" in str(e).lower():
                    logger.warning(f"Statement {i+1} skipped (already exists): {str(e)[:100]}")
                else:
                    logger.error(f"Error in statement {i+1}: {e}")
                    raise
        
        logger.info("Calendar database migration completed successfully!")
        
        # Verify tables were created
        logger.info("Verifying table creation...")
        
        tables_to_check = [
            'calendar_events',
            'task_calendar_mapping', 
            'calendar_data',
            'calendar_notifications',
            'event_recurrence',
            'scheduler_status',
            'task_execution_history',
            'event_participants',
            'trading_session_schedules',
            'calendar_performance_metrics'
        ]
        
        for table_name in tables_to_check:
            cursor.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = '{table_name}'
            );
            """)
            
            result = cursor.fetchone()
            
            if result and result[0]:
                logger.info(f"✓ Table '{table_name}' created successfully")
            else:
                logger.warning(f"✗ Table '{table_name}' not found")
        
        # Test sample data insertion
        logger.info("Testing sample data...")
        
        cursor.execute("SELECT COUNT(*) FROM calendar_events;")
        result = cursor.fetchone()
        
        if result:
            event_count = result[0]
            logger.info(f"✓ Found {event_count} sample calendar events")
        
        cursor.execute("SELECT COUNT(*) FROM task_calendar_mapping;")
        result = cursor.fetchone()
        
        if result:
            task_count = result[0]
            logger.info(f"✓ Found {task_count} task mappings")
        
        # Close connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Calendar migration failed: {e}")
        return False

def main():
    """Main function"""
    try:
        success = run_calendar_migration()
        
        if success:
            logger.info("🎉 Calendar migration completed successfully!")
            sys.exit(0)
        else:
            logger.error("❌ Calendar migration failed!")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Migration script error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()