"""
Enhanced Event Propagation Service
Provides comprehensive event-driven communication between orchestration services
Handles real-time events, notifications, and cross-service coordination
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set, Callable, Union
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
import weakref
from collections import defaultdict, deque

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class EventType(Enum):
    """Event types for orchestration system"""
    # Agent events
    AGENT_ASSIGNED = "agent_assigned"
    AGENT_UNASSIGNED = "agent_unassigned"
    AGENT_PERFORMANCE_UPDATE = "agent_performance_update"
    AGENT_DECISION_MADE = "agent_decision_made"
    AGENT_TRADE_EXECUTED = "agent_trade_executed"
    AGENT_STATUS_CHANGED = "agent_status_changed"
    
    # Farm events
    FARM_CREATED = "farm_created"
    FARM_UPDATED = "farm_updated"
    FARM_REBALANCED = "farm_rebalanced"
    FARM_PERFORMANCE_UPDATE = "farm_performance_update"
    FARM_CAPITAL_ALLOCATED = "farm_capital_allocated"
    FARM_AGENT_ADDED = "farm_agent_added"
    FARM_AGENT_REMOVED = "farm_agent_removed"
    
    # Goal events
    GOAL_CREATED = "goal_created"
    GOAL_UPDATED = "goal_updated"
    GOAL_ACHIEVED = "goal_achieved"
    GOAL_PROGRESS_UPDATE = "goal_progress_update"
    GOAL_CAPITAL_ALLOCATED = "goal_capital_allocated"
    GOAL_FARM_ASSIGNED = "goal_farm_assigned"
    GOAL_FARM_UNASSIGNED = "goal_farm_unassigned"
    
    # Capital flow events
    CAPITAL_ALLOCATED = "capital_allocated"
    CAPITAL_REALLOCATED = "capital_reallocated"
    CAPITAL_WITHDRAWN = "capital_withdrawn"
    CAPITAL_THRESHOLD_REACHED = "capital_threshold_reached"
    
    # Performance events
    PERFORMANCE_CALCULATED = "performance_calculated"
    ATTRIBUTION_UPDATED = "attribution_updated"
    RANKING_CHANGED = "ranking_changed"
    BENCHMARK_EXCEEDED = "benchmark_exceeded"
    
    # Risk events
    RISK_LIMIT_BREACHED = "risk_limit_breached"
    RISK_ASSESSMENT_UPDATED = "risk_assessment_updated"
    EMERGENCY_STOP_TRIGGERED = "emergency_stop_triggered"
    
    # System events
    SERVICE_STARTED = "service_started"
    SERVICE_STOPPED = "service_stopped"
    HEALTH_CHECK_FAILED = "health_check_failed"
    CONFIGURATION_CHANGED = "configuration_changed"

class EventPriority(Enum):
    """Event priority levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class EventScope(Enum):
    """Event propagation scope"""
    LOCAL = "local"          # Within same service
    SERVICE = "service"      # Between services
    GLOBAL = "global"        # System-wide
    EXTERNAL = "external"    # External systems

@dataclass
class Event:
    """Event data structure"""
    event_id: str
    event_type: EventType
    source_service: str
    target_service: Optional[str]
    priority: EventPriority
    scope: EventScope
    timestamp: datetime
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    correlation_id: Optional[str] = None
    parent_event_id: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    ttl_seconds: int = 300  # 5 minutes default TTL

@dataclass
class EventSubscription:
    """Event subscription configuration"""
    subscription_id: str
    subscriber_service: str
    event_types: List[EventType]
    handler: Callable
    priority_filter: Optional[EventPriority] = None
    scope_filter: Optional[EventScope] = None
    data_filter: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

@dataclass
class EventDeliveryStatus:
    """Event delivery tracking"""
    event_id: str
    subscription_id: str
    status: str  # 'pending', 'delivered', 'failed', 'retry'
    delivery_time: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0

class EventBuffer:
    """Event buffer for batch processing"""
    def __init__(self, max_size: int = 1000, flush_interval: int = 5):
        self.max_size = max_size
        self.flush_interval = flush_interval
        self.buffer: deque = deque()
        self.last_flush = datetime.now(timezone.utc)
        
    def add(self, event: Event):
        """Add event to buffer"""
        self.buffer.append(event)
        
    def should_flush(self) -> bool:
        """Check if buffer should be flushed"""
        return (
            len(self.buffer) >= self.max_size or
            (datetime.now(timezone.utc) - self.last_flush).seconds >= self.flush_interval
        )
    
    def flush(self) -> List[Event]:
        """Flush and return buffered events"""
        events = list(self.buffer)
        self.buffer.clear()
        self.last_flush = datetime.now(timezone.utc)
        return events

class EnhancedEventPropagation:
    """
    Enhanced event propagation system for orchestration services
    Provides real-time event distribution, subscription management, and delivery tracking
    """
    
    def __init__(self):
        # Service dependencies
        self.db_service = None
        self.websocket_service = None
        
        # Event management
        self.subscriptions: Dict[str, EventSubscription] = {}
        self.event_handlers: Dict[EventType, List[Callable]] = defaultdict(list)
        self.event_history: Dict[str, Event] = {}
        self.delivery_status: Dict[str, List[EventDeliveryStatus]] = defaultdict(list)
        
        # Event buffering
        self.event_buffers: Dict[EventPriority, EventBuffer] = {
            EventPriority.LOW: EventBuffer(max_size=1000, flush_interval=10),
            EventPriority.MEDIUM: EventBuffer(max_size=500, flush_interval=5),
            EventPriority.HIGH: EventBuffer(max_size=100, flush_interval=2),
            EventPriority.CRITICAL: EventBuffer(max_size=10, flush_interval=1)
        }
        
        # Performance tracking
        self.event_metrics: Dict[str, Any] = {
            "events_published": 0,
            "events_delivered": 0,
            "events_failed": 0,
            "average_delivery_time": 0,
            "active_subscriptions": 0
        }
        
        # Background tasks
        self.background_tasks: Set[asyncio.Task] = set()
        self.is_running = False
        
        # Weak references to avoid circular dependencies
        self.service_refs: Dict[str, weakref.ref] = {}
    
    async def initialize(self):
        """Initialize the event propagation system"""
        try:
            registry = get_registry()
            
            # Get service dependencies
            self.db_service = registry.get_service("database_service")
            self.websocket_service = registry.get_service("websocket_service")
            
            # Create database tables
            await self._create_event_tables()
            
            # Load existing subscriptions
            await self._load_subscriptions()
            
            # Start background tasks
            await self._start_background_tasks()
            
            # Register core event handlers
            await self._register_core_handlers()
            
            self.is_running = True
            logger.info("Enhanced Event Propagation system initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Enhanced Event Propagation: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the event propagation system"""
        self.is_running = False
        
        # Cancel background tasks
        for task in self.background_tasks:
            task.cancel()
        
        await asyncio.gather(*self.background_tasks, return_exceptions=True)
        self.background_tasks.clear()
        
        # Flush remaining events
        await self._flush_all_buffers()
        
        logger.info("Enhanced Event Propagation system shutdown complete")
    
    async def publish_event(self, event_type: EventType, data: Dict[str, Any], 
                          source_service: str, target_service: Optional[str] = None,
                          priority: EventPriority = EventPriority.MEDIUM,
                          scope: EventScope = EventScope.SERVICE,
                          correlation_id: Optional[str] = None,
                          parent_event_id: Optional[str] = None,
                          metadata: Optional[Dict[str, Any]] = None) -> str:
        """Publish an event to the system"""
        try:
            # Create event
            event = Event(
                event_id=str(uuid.uuid4()),
                event_type=event_type,
                source_service=source_service,
                target_service=target_service,
                priority=priority,
                scope=scope,
                timestamp=datetime.now(timezone.utc),
                data=data,
                metadata=metadata or {},
                correlation_id=correlation_id,
                parent_event_id=parent_event_id
            )
            
            # Store event in history
            self.event_history[event.event_id] = event
            
            # Add to appropriate buffer
            self.event_buffers[priority].add(event)
            
            # Immediate delivery for critical events
            if priority == EventPriority.CRITICAL:
                await self._deliver_event(event)
            
            # Update metrics
            self.event_metrics["events_published"] += 1
            
            # Store in database
            if self.db_service:
                await self._store_event(event)
            
            logger.debug(f"Published event: {event.event_id} ({event_type.value})")
            return event.event_id
            
        except Exception as e:
            logger.error(f"Failed to publish event {event_type.value}: {e}")
            raise
    
    async def subscribe(self, subscriber_service: str, event_types: List[EventType],
                       handler: Callable, priority_filter: Optional[EventPriority] = None,
                       scope_filter: Optional[EventScope] = None,
                       data_filter: Optional[Dict[str, Any]] = None) -> str:
        """Subscribe to events"""
        try:
            subscription = EventSubscription(
                subscription_id=str(uuid.uuid4()),
                subscriber_service=subscriber_service,
                event_types=event_types,
                handler=handler,
                priority_filter=priority_filter,
                scope_filter=scope_filter,
                data_filter=data_filter
            )
            
            # Store subscription
            self.subscriptions[subscription.subscription_id] = subscription
            
            # Add to event handlers
            for event_type in event_types:
                self.event_handlers[event_type].append(handler)
            
            # Store in database
            if self.db_service:
                await self._store_subscription(subscription)
            
            # Update metrics
            self.event_metrics["active_subscriptions"] = len(self.subscriptions)
            
            logger.info(f"Created subscription: {subscription.subscription_id} for {subscriber_service}")
            return subscription.subscription_id
            
        except Exception as e:
            logger.error(f"Failed to create subscription for {subscriber_service}: {e}")
            raise
    
    async def unsubscribe(self, subscription_id: str) -> bool:
        """Unsubscribe from events"""
        try:
            if subscription_id not in self.subscriptions:
                return False
            
            subscription = self.subscriptions[subscription_id]
            
            # Remove from event handlers
            for event_type in subscription.event_types:
                if subscription.handler in self.event_handlers[event_type]:
                    self.event_handlers[event_type].remove(subscription.handler)
            
            # Remove subscription
            del self.subscriptions[subscription_id]
            
            # Remove from database
            if self.db_service:
                await self._remove_subscription(subscription_id)
            
            # Update metrics
            self.event_metrics["active_subscriptions"] = len(self.subscriptions)
            
            logger.info(f"Removed subscription: {subscription_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove subscription {subscription_id}: {e}")
            return False
    
    async def get_event_history(self, event_type: Optional[EventType] = None,
                               source_service: Optional[str] = None,
                               start_time: Optional[datetime] = None,
                               end_time: Optional[datetime] = None,
                               limit: int = 100) -> List[Event]:
        """Get event history with filters"""
        try:
            events = list(self.event_history.values())
            
            # Apply filters
            if event_type:
                events = [e for e in events if e.event_type == event_type]
            
            if source_service:
                events = [e for e in events if e.source_service == source_service]
            
            if start_time:
                events = [e for e in events if e.timestamp >= start_time]
            
            if end_time:
                events = [e for e in events if e.timestamp <= end_time]
            
            # Sort by timestamp (most recent first)
            events.sort(key=lambda x: x.timestamp, reverse=True)
            
            return events[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get event history: {e}")
            return []
    
    async def get_delivery_status(self, event_id: str) -> List[EventDeliveryStatus]:
        """Get delivery status for an event"""
        return self.delivery_status.get(event_id, [])
    
    async def get_subscription_info(self, subscription_id: str) -> Optional[EventSubscription]:
        """Get subscription information"""
        return self.subscriptions.get(subscription_id)
    
    async def get_system_metrics(self) -> Dict[str, Any]:
        """Get system metrics"""
        return {
            **self.event_metrics,
            "buffer_sizes": {
                priority.value: len(buffer.buffer) 
                for priority, buffer in self.event_buffers.items()
            },
            "event_history_size": len(self.event_history),
            "delivery_status_count": sum(len(statuses) for statuses in self.delivery_status.values())
        }
    
    # Event delivery methods
    async def _deliver_event(self, event: Event):
        """Deliver event to subscribers"""
        try:
            # Find matching subscriptions
            matching_subscriptions = self._find_matching_subscriptions(event)
            
            # Deliver to each subscriber
            for subscription in matching_subscriptions:
                await self._deliver_to_subscription(event, subscription)
            
        except Exception as e:
            logger.error(f"Failed to deliver event {event.event_id}: {e}")
    
    def _find_matching_subscriptions(self, event: Event) -> List[EventSubscription]:
        """Find subscriptions that match the event"""
        matching = []
        
        for subscription in self.subscriptions.values():
            if not subscription.is_active:
                continue
            
            # Check event type
            if event.event_type not in subscription.event_types:
                continue
            
            # Check priority filter
            if subscription.priority_filter and event.priority != subscription.priority_filter:
                continue
            
            # Check scope filter
            if subscription.scope_filter and event.scope != subscription.scope_filter:
                continue
            
            # Check target service
            if event.target_service and event.target_service != subscription.subscriber_service:
                continue
            
            # Check data filter
            if subscription.data_filter and not self._matches_data_filter(event.data, subscription.data_filter):
                continue
            
            matching.append(subscription)
        
        return matching
    
    def _matches_data_filter(self, event_data: Dict[str, Any], filter_data: Dict[str, Any]) -> bool:
        """Check if event data matches filter"""
        for key, value in filter_data.items():
            if key not in event_data or event_data[key] != value:
                return False
        return True
    
    async def _deliver_to_subscription(self, event: Event, subscription: EventSubscription):
        """Deliver event to a specific subscription"""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Create delivery status
            delivery_status = EventDeliveryStatus(
                event_id=event.event_id,
                subscription_id=subscription.subscription_id,
                status="pending"
            )
            
            try:
                # Call handler
                if asyncio.iscoroutinefunction(subscription.handler):
                    await subscription.handler(event)
                else:
                    subscription.handler(event)
                
                # Update delivery status
                delivery_status.status = "delivered"
                delivery_status.delivery_time = datetime.now(timezone.utc)
                
                # Update metrics
                self.event_metrics["events_delivered"] += 1
                delivery_time = (delivery_status.delivery_time - start_time).total_seconds()
                self._update_average_delivery_time(delivery_time)
                
            except Exception as e:
                # Update delivery status
                delivery_status.status = "failed"
                delivery_status.error_message = str(e)
                delivery_status.retry_count = event.retry_count
                
                # Update metrics
                self.event_metrics["events_failed"] += 1
                
                # Schedule retry if applicable
                if event.retry_count < event.max_retries:
                    await self._schedule_retry(event, subscription)
                
                logger.error(f"Failed to deliver event {event.event_id} to {subscription.subscriber_service}: {e}")
            
            # Store delivery status
            self.delivery_status[event.event_id].append(delivery_status)
            
        except Exception as e:
            logger.error(f"Error in event delivery: {e}")
    
    async def _schedule_retry(self, event: Event, subscription: EventSubscription):
        """Schedule event retry"""
        try:
            # Increase retry count
            event.retry_count += 1
            
            # Calculate delay (exponential backoff)
            delay = 2 ** event.retry_count
            
            # Schedule retry
            async def retry_delivery():
                await asyncio.sleep(delay)
                await self._deliver_to_subscription(event, subscription)
            
            task = asyncio.create_task(retry_delivery())
            self.background_tasks.add(task)
            
        except Exception as e:
            logger.error(f"Failed to schedule retry for event {event.event_id}: {e}")
    
    def _update_average_delivery_time(self, delivery_time: float):
        """Update average delivery time metric"""
        current_avg = self.event_metrics["average_delivery_time"]
        delivered_count = self.event_metrics["events_delivered"]
        
        if delivered_count == 1:
            self.event_metrics["average_delivery_time"] = delivery_time
        else:
            # Moving average
            self.event_metrics["average_delivery_time"] = (
                (current_avg * (delivered_count - 1) + delivery_time) / delivered_count
            )
    
    # Background tasks
    async def _start_background_tasks(self):
        """Start background tasks"""
        if self.background_tasks:
            return
        
        # Event buffer processing
        task1 = asyncio.create_task(self._buffer_processing_task())
        self.background_tasks.add(task1)
        
        # Event history cleanup
        task2 = asyncio.create_task(self._history_cleanup_task())
        self.background_tasks.add(task2)
        
        # Delivery status cleanup
        task3 = asyncio.create_task(self._delivery_status_cleanup_task())
        self.background_tasks.add(task3)
        
        # Metrics calculation
        task4 = asyncio.create_task(self._metrics_calculation_task())
        self.background_tasks.add(task4)
    
    async def _buffer_processing_task(self):
        """Process event buffers"""
        while self.is_running:
            try:
                # Process buffers in priority order
                for priority in [EventPriority.CRITICAL, EventPriority.HIGH, EventPriority.MEDIUM, EventPriority.LOW]:
                    buffer = self.event_buffers[priority]
                    
                    if buffer.should_flush():
                        events = buffer.flush()
                        for event in events:
                            await self._deliver_event(event)
                
                await asyncio.sleep(1)  # Check every second
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in buffer processing task: {e}")
                await asyncio.sleep(5)
    
    async def _history_cleanup_task(self):
        """Clean up old event history"""
        while self.is_running:
            try:
                # Remove events older than 24 hours
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
                
                to_remove = []
                for event_id, event in self.event_history.items():
                    if event.timestamp < cutoff_time:
                        to_remove.append(event_id)
                
                for event_id in to_remove:
                    del self.event_history[event_id]
                
                if to_remove:
                    logger.info(f"Cleaned up {len(to_remove)} old events from history")
                
                await asyncio.sleep(3600)  # Run every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in history cleanup task: {e}")
                await asyncio.sleep(3600)
    
    async def _delivery_status_cleanup_task(self):
        """Clean up old delivery status records"""
        while self.is_running:
            try:
                # Remove delivery status older than 1 hour
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
                
                to_remove = []
                for event_id, statuses in self.delivery_status.items():
                    filtered_statuses = [
                        status for status in statuses
                        if status.delivery_time and status.delivery_time > cutoff_time
                    ]
                    
                    if filtered_statuses:
                        self.delivery_status[event_id] = filtered_statuses
                    else:
                        to_remove.append(event_id)
                
                for event_id in to_remove:
                    del self.delivery_status[event_id]
                
                await asyncio.sleep(1800)  # Run every 30 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in delivery status cleanup task: {e}")
                await asyncio.sleep(1800)
    
    async def _metrics_calculation_task(self):
        """Calculate and update metrics"""
        while self.is_running:
            try:
                # Calculate additional metrics
                self.event_metrics["active_subscriptions"] = len(self.subscriptions)
                
                # Calculate success rate
                total_events = self.event_metrics["events_delivered"] + self.event_metrics["events_failed"]
                if total_events > 0:
                    self.event_metrics["success_rate"] = self.event_metrics["events_delivered"] / total_events
                else:
                    self.event_metrics["success_rate"] = 0
                
                await asyncio.sleep(300)  # Update every 5 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in metrics calculation task: {e}")
                await asyncio.sleep(300)
    
    async def _flush_all_buffers(self):
        """Flush all event buffers"""
        for priority, buffer in self.event_buffers.items():
            events = buffer.flush()
            for event in events:
                await self._deliver_event(event)
    
    # Database operations
    async def _create_event_tables(self):
        """Create database tables for events"""
        if not self.db_service:
            return
        
        try:
            # Events table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    source_service TEXT NOT NULL,
                    target_service TEXT,
                    priority INTEGER NOT NULL,
                    scope TEXT NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    data JSONB,
                    metadata JSONB,
                    correlation_id TEXT,
                    parent_event_id TEXT,
                    retry_count INTEGER DEFAULT 0,
                    max_retries INTEGER DEFAULT 3,
                    ttl_seconds INTEGER DEFAULT 300,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Event subscriptions table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS event_subscriptions (
                    subscription_id TEXT PRIMARY KEY,
                    subscriber_service TEXT NOT NULL,
                    event_types TEXT[] NOT NULL,
                    priority_filter INTEGER,
                    scope_filter TEXT,
                    data_filter JSONB,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Event delivery status table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS event_delivery_status (
                    id SERIAL PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    subscription_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    delivery_time TIMESTAMP WITH TIME ZONE,
                    error_message TEXT,
                    retry_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
                CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_service);
                CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
                CREATE INDEX IF NOT EXISTS idx_events_correlation ON events(correlation_id);
                
                CREATE INDEX IF NOT EXISTS idx_subscriptions_service ON event_subscriptions(subscriber_service);
                CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON event_subscriptions(is_active);
                
                CREATE INDEX IF NOT EXISTS idx_delivery_status_event ON event_delivery_status(event_id);
                CREATE INDEX IF NOT EXISTS idx_delivery_status_subscription ON event_delivery_status(subscription_id);
            """)
            
            logger.info("Event propagation tables created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create event tables: {e}")
            raise
    
    async def _store_event(self, event: Event):
        """Store event in database"""
        try:
            await self.db_service.execute_query("""
                INSERT INTO events (event_id, event_type, source_service, target_service, priority, scope,
                                  timestamp, data, metadata, correlation_id, parent_event_id, retry_count,
                                  max_retries, ttl_seconds)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, event.event_id, event.event_type.value, event.source_service, event.target_service,
                event.priority.value, event.scope.value, event.timestamp, json.dumps(event.data),
                json.dumps(event.metadata), event.correlation_id, event.parent_event_id,
                event.retry_count, event.max_retries, event.ttl_seconds)
        except Exception as e:
            logger.error(f"Failed to store event {event.event_id}: {e}")
    
    async def _store_subscription(self, subscription: EventSubscription):
        """Store subscription in database"""
        try:
            await self.db_service.execute_query("""
                INSERT INTO event_subscriptions (subscription_id, subscriber_service, event_types,
                                               priority_filter, scope_filter, data_filter, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, subscription.subscription_id, subscription.subscriber_service,
                [et.value for et in subscription.event_types], subscription.priority_filter,
                subscription.scope_filter, json.dumps(subscription.data_filter),
                subscription.is_active)
        except Exception as e:
            logger.error(f"Failed to store subscription {subscription.subscription_id}: {e}")
    
    async def _remove_subscription(self, subscription_id: str):
        """Remove subscription from database"""
        try:
            await self.db_service.execute_query("""
                DELETE FROM event_subscriptions WHERE subscription_id = $1
            """, subscription_id)
        except Exception as e:
            logger.error(f"Failed to remove subscription {subscription_id}: {e}")
    
    async def _load_subscriptions(self):
        """Load subscriptions from database"""
        if not self.db_service:
            return
        
        try:
            results = await self.db_service.fetch_all("""
                SELECT subscription_id, subscriber_service, event_types, priority_filter,
                       scope_filter, data_filter, is_active, created_at
                FROM event_subscriptions
                WHERE is_active = TRUE
            """)
            
            for row in results:
                # Note: This loads subscriptions metadata but not the actual handlers
                # Handlers need to be re-registered by services on startup
                subscription = EventSubscription(
                    subscription_id=row['subscription_id'],
                    subscriber_service=row['subscriber_service'],
                    event_types=[EventType(et) for et in row['event_types']],
                    handler=lambda x: None,  # Placeholder handler
                    priority_filter=EventPriority(row['priority_filter']) if row['priority_filter'] else None,
                    scope_filter=EventScope(row['scope_filter']) if row['scope_filter'] else None,
                    data_filter=json.loads(row['data_filter']) if row['data_filter'] else None,
                    is_active=row['is_active'],
                    created_at=row['created_at']
                )
                
                self.subscriptions[subscription.subscription_id] = subscription
            
            logger.info(f"Loaded {len(self.subscriptions)} subscriptions from database")
            
        except Exception as e:
            logger.error(f"Failed to load subscriptions: {e}")
    
    async def _register_core_handlers(self):
        """Register core system event handlers"""
        # Register handler for service lifecycle events
        await self.subscribe(
            subscriber_service="event_propagation",
            event_types=[EventType.SERVICE_STARTED, EventType.SERVICE_STOPPED],
            handler=self._handle_service_lifecycle
        )
        
        # Register handler for health check events
        await self.subscribe(
            subscriber_service="event_propagation",
            event_types=[EventType.HEALTH_CHECK_FAILED],
            handler=self._handle_health_check_failed,
            priority_filter=EventPriority.HIGH
        )
    
    async def _handle_service_lifecycle(self, event: Event):
        """Handle service lifecycle events"""
        logger.info(f"Service lifecycle event: {event.event_type.value} from {event.source_service}")
        
        if event.event_type == EventType.SERVICE_STOPPED:
            # Clean up subscriptions for stopped service
            to_remove = []
            for sub_id, subscription in self.subscriptions.items():
                if subscription.subscriber_service == event.source_service:
                    to_remove.append(sub_id)
            
            for sub_id in to_remove:
                await self.unsubscribe(sub_id)
    
    async def _handle_health_check_failed(self, event: Event):
        """Handle health check failed events"""
        logger.warning(f"Health check failed for service: {event.source_service}")
        
        # Could trigger additional monitoring or recovery actions
        # For now, just log the event