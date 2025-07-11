#!/usr/bin/env python3
"""
Run Calendar Database Migration
Script to execute the calendar events schema migration
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.service_registry import registry
from core.database_manager import DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def run_calendar_migration():
    """Run the calendar database migration"""
    try:
        logger.info("Starting calendar database migration...")
        
        # Initialize database manager
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        # Get database connection
        connection = await db_manager.get_connection()
        
        if not connection:
            logger.error("Failed to get database connection")
            return False
        
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
        
        # Execute schema
        logger.info("Executing calendar schema migration...")
        await connection.execute_script(schema_sql)
        
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
            check_query = f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = '{table_name}'
            );
            """
            
            result = await connection.execute_query(check_query)
            
            if result and result[0][0]:
                logger.info(f"✓ Table '{table_name}' created successfully")
            else:
                logger.warning(f"✗ Table '{table_name}' not found")
        
        # Test sample data insertion
        logger.info("Testing sample data insertion...")
        
        test_query = "SELECT COUNT(*) FROM calendar_events;"
        result = await connection.execute_query(test_query)
        
        if result:
            event_count = result[0][0]
            logger.info(f"✓ Found {event_count} sample calendar events")
        
        return True
        
    except Exception as e:
        logger.error(f"Calendar migration failed: {e}")
        return False

async def main():
    """Main function"""
    try:
        success = await run_calendar_migration()
        
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
    asyncio.run(main())