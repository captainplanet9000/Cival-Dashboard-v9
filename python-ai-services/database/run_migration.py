#!/usr/bin/env python3
"""
Database Migration Runner
Executes SQL migrations for the AI Trading Dashboard
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_database_url(database_url):
    """Parse DATABASE_URL into connection parameters"""
    parsed = urlparse(database_url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'user': parsed.username,
        'password': parsed.password,
        'database': parsed.path[1:]  # Remove leading '/'
    }

def run_migrations():
    """Execute all SQL migration files"""
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        logger.error("DATABASE_URL environment variable not set!")
        logger.info("Please set DATABASE_URL in your .env file")
        logger.info("Example: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname")
        return False
    
    # Parse connection parameters
    conn_params = parse_database_url(database_url)
    
    # Get migrations directory
    migrations_dir = Path(__file__).parent / 'migrations'
    if not migrations_dir.exists():
        logger.error(f"Migrations directory not found: {migrations_dir}")
        return False
    
    # Get all SQL files
    migration_files = sorted(migrations_dir.glob('*.sql'))
    if not migration_files:
        logger.warning("No migration files found")
        return True
    
    try:
        # Connect to database
        logger.info(f"Connecting to database at {conn_params['host']}:{conn_params['port']}")
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = False
        cur = conn.cursor()
        
        # Create migrations tracking table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        # Check which migrations have been run
        cur.execute("SELECT version FROM schema_migrations")
        executed_migrations = {row[0] for row in cur.fetchall()}
        
        # Run pending migrations
        for migration_file in migration_files:
            version = migration_file.stem
            
            if version in executed_migrations:
                logger.info(f"Skipping already executed migration: {version}")
                continue
            
            logger.info(f"Running migration: {version}")
            
            try:
                # Read and execute migration
                with open(migration_file, 'r') as f:
                    migration_sql = f.read()
                
                cur.execute(migration_sql)
                
                # Record migration
                cur.execute(
                    "INSERT INTO schema_migrations (version) VALUES (%s)",
                    (version,)
                )
                
                conn.commit()
                logger.info(f"✅ Migration {version} completed successfully")
                
            except Exception as e:
                conn.rollback()
                logger.error(f"❌ Migration {version} failed: {str(e)}")
                raise
        
        logger.info("✨ All migrations completed successfully!")
        return True
        
    except psycopg2.OperationalError as e:
        logger.error(f"Database connection failed: {str(e)}")
        logger.info("\nTroubleshooting:")
        logger.info("1. Check if PostgreSQL is running")
        logger.info("2. Verify DATABASE_URL is correct")
        logger.info("3. Ensure database exists")
        logger.info("\nFor local development, you can use:")
        logger.info("  docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres")
        return False
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return False
        
    finally:
        if 'conn' in locals() and conn:
            conn.close()

def main():
    """Main entry point"""
    logger.info("🚀 Starting database migration...")
    
    # Check for mock mode
    if os.getenv('DATABASE_URL', '').startswith('postgresql://mock'):
        logger.info("📝 Running in mock mode - skipping database migrations")
        logger.info("   The application will use in-memory data")
        return 0
    
    # Run migrations
    success = run_migrations()
    
    if success:
        logger.info("\n✅ Database is ready!")
        logger.info("   You can now start the application")
        return 0
    else:
        logger.error("\n❌ Database setup failed")
        logger.info("   The application will fall back to mock data")
        return 1

if __name__ == "__main__":
    sys.exit(main())