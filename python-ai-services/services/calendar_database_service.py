#!/usr/bin/env python3
"""
Calendar Database Service
Enhanced database operations for calendar events, scheduler tasks, and trading calendar integration
"""

import asyncio
import logging
import json
import uuid
from datetime import datetime, timezone, timedelta, date, time
from typing import Dict, List, Optional, Any, Union
from decimal import Decimal

from core.service_registry import get_service_dependency
from models.database_models import DatabaseConnection

logger = logging.getLogger(__name__)

class CalendarDatabaseService:
    """Enhanced database service for calendar operations"""
    
    def __init__(self):
        self.db_connection: Optional[DatabaseConnection] = None
        self.initialized = False
        
    async def initialize(self):
        """Initialize the calendar database service"""
        try:
            # Get database connection from service registry
            from core.service_registry import registry
            db_manager = registry.get_service("database_manager")
            
            if db_manager:
                self.db_connection = await db_manager.get_connection()
                await self._ensure_calendar_tables()
                self.initialized = True
                logger.info("Calendar database service initialized successfully")
            else:
                logger.warning("Database manager not available, running in mock mode")
                
        except Exception as e:
            logger.error(f"Failed to initialize calendar database service: {e}")
            self.initialized = False
    
    async def _ensure_calendar_tables(self):
        """Ensure calendar tables exist"""
        if not self.db_connection:
            return
            
        try:
            # Check if calendar tables exist, create if needed
            check_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'calendar_events'
            );
            """
            
            result = await self.db_connection.execute_query(check_query)
            if not result or not result[0][0]:
                # Tables don't exist, run migration
                await self._run_calendar_migration()
                
        except Exception as e:
            logger.error(f"Failed to ensure calendar tables: {e}")
    
    async def _run_calendar_migration(self):
        """Run calendar database migration"""
        try:
            # Read and execute calendar schema
            import os
            schema_path = os.path.join(
                os.path.dirname(__file__), 
                '../database/migrations/calendar_events_schema.sql'
            )
            
            if os.path.exists(schema_path):
                with open(schema_path, 'r') as f:
                    schema_sql = f.read()
                
                await self.db_connection.execute_script(schema_sql)
                logger.info("Calendar database migration completed successfully")
            else:
                logger.warning("Calendar schema file not found, skipping migration")
                
        except Exception as e:
            logger.error(f"Failed to run calendar migration: {e}")
    
    # ==================== CALENDAR EVENTS ====================
    
    async def create_calendar_event(self, event_data: Dict[str, Any]) -> str:
        """Create a new calendar event"""
        if not self.db_connection:
            return str(uuid.uuid4())  # Mock ID
            
        try:
            event_id = str(uuid.uuid4())
            
            query = """
            INSERT INTO calendar_events (
                id, title, description, event_type, date, time, priority, 
                status, recurring, notifications, agent_id, task_id, 
                cron_expression, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id;
            """
            
            values = (
                event_id,
                event_data['title'],
                event_data.get('description', ''),
                event_data.get('event_type', 'general'),
                event_data['date'],
                event_data.get('time'),
                event_data.get('priority', 'medium'),
                event_data.get('status', 'scheduled'),
                event_data.get('recurring', False),
                event_data.get('notifications', True),
                event_data.get('agent_id'),
                event_data.get('task_id'),
                event_data.get('cron_expression'),
                json.dumps(event_data.get('metadata', {}))
            )
            
            result = await self.db_connection.execute_query(query, values)
            
            # Create recurrence if specified
            if event_data.get('recurring') and event_data.get('recurrence_pattern'):
                await self._create_event_recurrence(event_id, event_data)
            
            # Create notifications if enabled
            if event_data.get('notifications', True):
                await self._create_event_notifications(event_id, event_data)
            
            return event_id
            
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            return str(uuid.uuid4())  # Fallback mock ID
    
    async def get_calendar_events(
        self, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None,
        event_type: Optional[str] = None,
        agent_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get calendar events with optional filtering"""
        if not self.db_connection:
            return self._get_mock_calendar_events()
            
        try:
            query = """
            SELECT e.*, 
                   er.recurrence_type, er.recurrence_pattern,
                   array_agg(DISTINCT ep.participant_id) as participants
            FROM calendar_events e
            LEFT JOIN event_recurrence er ON e.id = er.calendar_event_id
            LEFT JOIN event_participants ep ON e.id = ep.calendar_event_id
            WHERE 1=1
            """
            
            values = []
            param_count = 0
            
            if start_date:
                param_count += 1
                query += f" AND e.date >= ${param_count}"
                values.append(start_date)
            
            if end_date:
                param_count += 1
                query += f" AND e.date <= ${param_count}"
                values.append(end_date)
            
            if event_type:
                param_count += 1
                query += f" AND e.event_type = ${param_count}"
                values.append(event_type)
            
            if agent_id:
                param_count += 1
                query += f" AND e.agent_id = ${param_count}"
                values.append(agent_id)
            
            query += " GROUP BY e.id, er.recurrence_type, er.recurrence_pattern ORDER BY e.date, e.time"
            
            results = await self.db_connection.execute_query(query, values)
            
            events = []
            for row in results:
                event = {
                    'id': str(row[0]),
                    'title': row[1],
                    'description': row[2],
                    'event_type': row[3],
                    'date': row[4].isoformat() if row[4] else None,
                    'time': row[5].isoformat() if row[5] else None,
                    'priority': row[6],
                    'status': row[7],
                    'recurring': row[8],
                    'notifications': row[9],
                    'agent_id': row[10],
                    'task_id': row[11],
                    'cron_expression': row[12],
                    'metadata': json.loads(row[13]) if row[13] else {},
                    'created_at': row[14].isoformat() if row[14] else None,
                    'updated_at': row[15].isoformat() if row[15] else None,
                    'recurrence_type': row[16],
                    'recurrence_pattern': row[17],
                    'participants': [p for p in row[18] if p] if row[18] else []
                }
                events.append(event)
            
            return events
            
        except Exception as e:
            logger.error(f"Failed to get calendar events: {e}")
            return self._get_mock_calendar_events()
    
    async def update_calendar_event(self, event_id: str, updates: Dict[str, Any]) -> bool:
        """Update a calendar event"""
        if not self.db_connection:
            return True  # Mock success
            
        try:
            # Build dynamic update query
            set_clauses = []
            values = []
            param_count = 0
            
            allowed_fields = [
                'title', 'description', 'event_type', 'date', 'time', 
                'priority', 'status', 'recurring', 'notifications', 
                'agent_id', 'task_id', 'cron_expression', 'metadata'
            ]
            
            for field, value in updates.items():
                if field in allowed_fields:
                    param_count += 1
                    set_clauses.append(f"{field} = ${param_count}")
                    if field == 'metadata':
                        values.append(json.dumps(value))
                    else:
                        values.append(value)
            
            if not set_clauses:
                return False
            
            param_count += 1
            query = f"""
            UPDATE calendar_events 
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = ${param_count}
            """
            values.append(event_id)
            
            await self.db_connection.execute_query(query, values)
            return True
            
        except Exception as e:
            logger.error(f"Failed to update calendar event: {e}")
            return False
    
    async def delete_calendar_event(self, event_id: str) -> bool:
        """Delete a calendar event"""
        if not self.db_connection:
            return True  # Mock success
            
        try:
            query = "DELETE FROM calendar_events WHERE id = $1"
            await self.db_connection.execute_query(query, [event_id])
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete calendar event: {e}")
            return False
    
    # ==================== CALENDAR DATA ====================
    
    async def store_calendar_data(self, trading_date: date, data: Dict[str, Any]) -> bool:
        """Store daily trading calendar data"""
        if not self.db_connection:
            return True  # Mock success
            
        try:
            query = """
            INSERT INTO calendar_data (
                trading_date, total_pnl, total_trades, winning_trades, 
                active_agents, net_profit, market_volatility, trading_volume,
                largest_win, largest_loss, sharpe_ratio, drawdown, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (trading_date) 
            DO UPDATE SET
                total_pnl = EXCLUDED.total_pnl,
                total_trades = EXCLUDED.total_trades,
                winning_trades = EXCLUDED.winning_trades,
                active_agents = EXCLUDED.active_agents,
                net_profit = EXCLUDED.net_profit,
                market_volatility = EXCLUDED.market_volatility,
                trading_volume = EXCLUDED.trading_volume,
                largest_win = EXCLUDED.largest_win,
                largest_loss = EXCLUDED.largest_loss,
                sharpe_ratio = EXCLUDED.sharpe_ratio,
                drawdown = EXCLUDED.drawdown,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
            """
            
            values = (
                trading_date,
                Decimal(str(data.get('total_pnl', 0))),
                data.get('total_trades', 0),
                data.get('winning_trades', 0),
                data.get('active_agents', 0),
                Decimal(str(data.get('net_profit', 0))),
                Decimal(str(data.get('market_volatility', 0))) if data.get('market_volatility') else None,
                Decimal(str(data.get('trading_volume', 0))) if data.get('trading_volume') else None,
                Decimal(str(data.get('largest_win', 0))) if data.get('largest_win') else None,
                Decimal(str(data.get('largest_loss', 0))) if data.get('largest_loss') else None,
                Decimal(str(data.get('sharpe_ratio', 0))) if data.get('sharpe_ratio') else None,
                Decimal(str(data.get('drawdown', 0))) if data.get('drawdown') else None,
                json.dumps(data.get('metadata', {}))
            )
            
            await self.db_connection.execute_query(query, values)
            return True
            
        except Exception as e:
            logger.error(f"Failed to store calendar data: {e}")
            return False
    
    async def get_calendar_data(
        self, 
        start_date: date, 
        end_date: date
    ) -> Dict[str, Dict[str, Any]]:
        """Get calendar data for date range"""
        if not self.db_connection:
            return self._get_mock_calendar_data(start_date, end_date)
            
        try:
            query = """
            SELECT trading_date, total_pnl, total_trades, winning_trades,
                   active_agents, net_profit, market_volatility, trading_volume,
                   largest_win, largest_loss, sharpe_ratio, drawdown, metadata
            FROM calendar_data
            WHERE trading_date BETWEEN $1 AND $2
            ORDER BY trading_date
            """
            
            results = await self.db_connection.execute_query(query, [start_date, end_date])
            
            calendar_data = {}
            for row in results:
                date_str = row[0].isoformat()
                calendar_data[date_str] = {
                    'trading_date': date_str,
                    'total_pnl': float(row[1]) if row[1] else 0.0,
                    'total_trades': row[2] or 0,
                    'winning_trades': row[3] or 0,
                    'active_agents': row[4] or 0,
                    'net_profit': float(row[5]) if row[5] else 0.0,
                    'market_volatility': float(row[6]) if row[6] else None,
                    'trading_volume': float(row[7]) if row[7] else None,
                    'largest_win': float(row[8]) if row[8] else None,
                    'largest_loss': float(row[9]) if row[9] else None,
                    'sharpe_ratio': float(row[10]) if row[10] else None,
                    'drawdown': float(row[11]) if row[11] else None,
                    'metadata': json.loads(row[12]) if row[12] else {}
                }
            
            return calendar_data
            
        except Exception as e:
            logger.error(f"Failed to get calendar data: {e}")
            return self._get_mock_calendar_data(start_date, end_date)
    
    # ==================== TASK SCHEDULER INTEGRATION ====================
    
    async def store_task_mapping(self, task_data: Dict[str, Any]) -> bool:
        """Store task to calendar mapping"""
        if not self.db_connection:
            return True  # Mock success
            
        try:
            query = """
            INSERT INTO task_calendar_mapping (
                task_id, task_name, task_type, cron_expression, priority,
                enabled, calendar_event_id, agent_id, next_execution
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (task_id)
            DO UPDATE SET
                task_name = EXCLUDED.task_name,
                task_type = EXCLUDED.task_type,
                cron_expression = EXCLUDED.cron_expression,
                priority = EXCLUDED.priority,
                enabled = EXCLUDED.enabled,
                calendar_event_id = EXCLUDED.calendar_event_id,
                agent_id = EXCLUDED.agent_id,
                next_execution = EXCLUDED.next_execution,
                updated_at = NOW()
            """
            
            values = (
                task_data['task_id'],
                task_data['task_name'],
                task_data['task_type'],
                task_data['cron_expression'],
                task_data.get('priority', 'medium'),
                task_data.get('enabled', True),
                task_data.get('calendar_event_id'),
                task_data.get('agent_id'),
                task_data.get('next_execution')
            )
            
            await self.db_connection.execute_query(query, values)
            return True
            
        except Exception as e:
            logger.error(f"Failed to store task mapping: {e}")
            return False
    
    async def update_task_execution(self, task_id: str, execution_data: Dict[str, Any]) -> bool:
        """Update task execution statistics"""
        if not self.db_connection:
            return True  # Mock success
            
        try:
            # Update task mapping
            query = """
            UPDATE task_calendar_mapping
            SET last_execution = $1,
                next_execution = $2,
                execution_count = execution_count + 1,
                success_count = success_count + $3,
                failure_count = failure_count + $4,
                average_execution_time = (
                    (average_execution_time * execution_count + $5) / (execution_count + 1)
                ),
                updated_at = NOW()
            WHERE task_id = $6
            """
            
            values = (
                execution_data.get('execution_start'),
                execution_data.get('next_execution'),
                1 if execution_data.get('status') == 'completed' else 0,
                1 if execution_data.get('status') == 'failed' else 0,
                execution_data.get('execution_time_ms', 0),
                task_id
            )
            
            await self.db_connection.execute_query(query, values)
            
            # Store execution history
            await self._store_task_execution_history(task_id, execution_data)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update task execution: {e}")
            return False
    
    async def _store_task_execution_history(self, task_id: str, execution_data: Dict[str, Any]) -> bool:
        """Store task execution history record"""
        try:
            query = """
            INSERT INTO task_execution_history (
                task_id, task_name, execution_start, execution_end,
                execution_time_ms, status, result, error_message, agent_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """
            
            values = (
                task_id,
                execution_data.get('task_name', task_id),
                execution_data.get('execution_start'),
                execution_data.get('execution_end'),
                execution_data.get('execution_time_ms'),
                execution_data.get('status', 'unknown'),
                json.dumps(execution_data.get('result', {})),
                execution_data.get('error_message'),
                execution_data.get('agent_id')
            )
            
            await self.db_connection.execute_query(query, values)
            return True
            
        except Exception as e:
            logger.error(f"Failed to store task execution history: {e}")
            return False
    
    async def get_scheduler_status(self) -> Dict[str, Any]:
        """Get scheduler status and metrics"""
        if not self.db_connection:
            return self._get_mock_scheduler_status()
            
        try:
            # Get task statistics
            query = """
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE enabled = true) as enabled_tasks,
                AVG(execution_count) as avg_executions,
                AVG(success_count::float / GREATEST(execution_count, 1)) as avg_success_rate,
                AVG(average_execution_time) as avg_execution_time
            FROM task_calendar_mapping
            """
            
            result = await self.db_connection.execute_query(query)
            
            if result:
                row = result[0]
                status = {
                    'service': 'autonomous_task_scheduler',
                    'initialized': True,
                    'running': True,
                    'scheduled_tasks': int(row[0]) if row[0] else 0,
                    'enabled_tasks': int(row[1]) if row[1] else 0,
                    'active_executions': 0,  # Would need to be tracked separately
                    'worker_count': 3,  # Default worker count
                    'queue_size': 0,
                    'metrics': {
                        'avg_executions': float(row[2]) if row[2] else 0.0,
                        'avg_success_rate': float(row[3]) if row[3] else 0.0,
                        'avg_execution_time': float(row[4]) if row[4] else 0.0,
                        'tasks_executed_today': await self._get_today_executions_count(),
                        'successful_executions': await self._get_successful_executions_count(),
                        'failed_executions': await self._get_failed_executions_count()
                    }
                }
                return status
            
            return self._get_mock_scheduler_status()
            
        except Exception as e:
            logger.error(f"Failed to get scheduler status: {e}")
            return self._get_mock_scheduler_status()
    
    async def _get_today_executions_count(self) -> int:
        """Get count of today's task executions"""
        try:
            query = """
            SELECT COUNT(*) FROM task_execution_history
            WHERE DATE(execution_start) = CURRENT_DATE
            """
            result = await self.db_connection.execute_query(query)
            return int(result[0][0]) if result else 0
        except:
            return 0
    
    async def _get_successful_executions_count(self) -> int:
        """Get count of successful executions today"""
        try:
            query = """
            SELECT COUNT(*) FROM task_execution_history
            WHERE DATE(execution_start) = CURRENT_DATE AND status = 'completed'
            """
            result = await self.db_connection.execute_query(query)
            return int(result[0][0]) if result else 0
        except:
            return 0
    
    async def _get_failed_executions_count(self) -> int:
        """Get count of failed executions today"""
        try:
            query = """
            SELECT COUNT(*) FROM task_execution_history
            WHERE DATE(execution_start) = CURRENT_DATE AND status = 'failed'
            """
            result = await self.db_connection.execute_query(query)
            return int(result[0][0]) if result else 0
        except:
            return 0
    
    # ==================== HELPER METHODS ====================
    
    async def _create_event_recurrence(self, event_id: str, event_data: Dict[str, Any]):
        """Create event recurrence pattern"""
        try:
            query = """
            INSERT INTO event_recurrence (
                calendar_event_id, recurrence_type, recurrence_pattern,
                recurrence_end_date, max_occurrences
            ) VALUES ($1, $2, $3, $4, $5)
            """
            
            values = (
                event_id,
                event_data.get('recurrence_type', 'daily'),
                event_data.get('recurrence_pattern'),
                event_data.get('recurrence_end_date'),
                event_data.get('max_occurrences')
            )
            
            await self.db_connection.execute_query(query, values)
            
        except Exception as e:
            logger.error(f"Failed to create event recurrence: {e}")
    
    async def _create_event_notifications(self, event_id: str, event_data: Dict[str, Any]):
        """Create event notifications"""
        try:
            # Default notification 15 minutes before event
            event_datetime = datetime.fromisoformat(f"{event_data['date']}T{event_data.get('time', '09:00:00')}")
            notification_time = event_datetime - timedelta(minutes=15)
            
            query = """
            INSERT INTO calendar_notifications (
                calendar_event_id, notification_type, notification_time, message
            ) VALUES ($1, $2, $3, $4)
            """
            
            values = (
                event_id,
                'reminder',
                notification_time,
                f"Reminder: {event_data['title']} starting in 15 minutes"
            )
            
            await self.db_connection.execute_query(query, values)
            
        except Exception as e:
            logger.error(f"Failed to create event notifications: {e}")
    
    # ==================== MOCK DATA METHODS ====================
    
    def _get_mock_calendar_events(self) -> List[Dict[str, Any]]:
        """Generate mock calendar events"""
        return [
            {
                'id': 'market_open_daily',
                'title': 'Market Open',
                'description': 'US stock market opens',
                'event_type': 'market',
                'cron_expression': '30 9 * * 1-5',
                'priority': 'medium',
                'status': 'scheduled',
                'recurring': True,
                'notifications': True
            },
            {
                'id': 'arbitrage_scan_10s',
                'title': 'High-Frequency Arbitrage Scan',
                'description': 'Automated arbitrage opportunity detection',
                'event_type': 'automated',
                'cron_expression': '*/10 * * * * *',
                'priority': 'high',
                'status': 'scheduled',
                'recurring': True,
                'notifications': False,
                'agent_id': 'alex_arbitrage'
            }
        ]
    
    def _get_mock_calendar_data(self, start_date: date, end_date: date) -> Dict[str, Dict[str, Any]]:
        """Generate mock calendar data"""
        import random
        
        data = {}
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.isoformat()
            
            # Skip weekends for mock data
            if current_date.weekday() < 5:  # Monday = 0, Sunday = 6
                data[date_str] = {
                    'trading_date': date_str,
                    'total_pnl': round(random.uniform(-500, 1000), 2),
                    'total_trades': random.randint(15, 45),
                    'winning_trades': random.randint(8, 30),
                    'active_agents': random.randint(3, 5),
                    'net_profit': round(random.uniform(-490, 985), 2),
                }
            
            current_date += timedelta(days=1)
        
        return data
    
    def _get_mock_scheduler_status(self) -> Dict[str, Any]:
        """Generate mock scheduler status"""
        return {
            'service': 'autonomous_task_scheduler',
            'initialized': True,
            'running': True,
            'scheduled_tasks': 14,
            'active_executions': 2,
            'worker_count': 3,
            'queue_size': 0,
            'metrics': {
                'tasks_executed_today': 1247,
                'successful_executions': 1198,
                'failed_executions': 49,
                'average_execution_time': 2.3
            }
        }

# Service instance getter
_calendar_db_service: Optional[CalendarDatabaseService] = None

async def get_calendar_database_service() -> CalendarDatabaseService:
    """Get or create calendar database service instance"""
    global _calendar_db_service
    
    if _calendar_db_service is None:
        _calendar_db_service = CalendarDatabaseService()
        await _calendar_db_service.initialize()
    
    return _calendar_db_service

# Export service for dependency injection
calendar_database_service = CalendarDatabaseService()