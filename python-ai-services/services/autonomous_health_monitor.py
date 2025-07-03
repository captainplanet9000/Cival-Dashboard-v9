"""
Autonomous Health Monitor Service
Provides 24/7 system health monitoring with auto-recovery for production deployment
Ensures agents and critical services remain operational with minimal downtime
"""

import asyncio
import logging
import psutil
import socket
import time
from typing import Dict, List, Optional, Any, Set, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
import aiohttp
import subprocess

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class ServiceHealth(Enum):
    """Service health status states"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class RecoveryAction(Enum):
    """Types of recovery actions"""
    RESTART_SERVICE = "restart_service"
    RESTART_DATABASE = "restart_database"
    RESTART_REDIS = "restart_redis"
    RESTART_WEBSOCKET = "restart_websocket"
    RESTART_MCP_SERVER = "restart_mcp_server"
    SCALE_UP = "scale_up"
    EMERGENCY_SHUTDOWN = "emergency_shutdown"

@dataclass
class HealthMetric:
    """Individual health metric data"""
    metric_name: str
    value: float
    threshold: float
    status: ServiceHealth
    unit: str
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None

@dataclass
class ServiceStatus:
    """Complete service status information"""
    service_name: str
    health: ServiceHealth
    uptime_seconds: float
    response_time_ms: float
    error_count: int
    last_error: Optional[str]
    metrics: Dict[str, HealthMetric]
    dependencies: List[str]
    auto_recovery_enabled: bool
    restart_count: int
    last_restart: Optional[datetime]

@dataclass
class SystemAlert:
    """System health alert"""
    alert_id: str
    service_name: str
    severity: AlertSeverity
    message: str
    details: Dict[str, Any]
    recovery_action: Optional[RecoveryAction]
    created_at: datetime
    resolved_at: Optional[datetime]
    auto_resolved: bool

@dataclass
class RecoveryAttempt:
    """Recovery action attempt record"""
    attempt_id: str
    service_name: str
    action: RecoveryAction
    started_at: datetime
    completed_at: Optional[datetime]
    success: bool
    error_message: Optional[str]
    attempt_number: int

class AutonomousHealthMonitor:
    """
    24/7 autonomous health monitoring system with auto-recovery
    Monitors all critical services and automatically resolves issues
    """
    
    def __init__(self):
        self.db_service = None
        self.state_persistence = None
        self.event_service = None
        
        # Service monitoring
        self.service_statuses: Dict[str, ServiceStatus] = {}
        self.monitored_services: Set[str] = set()
        self.service_endpoints: Dict[str, str] = {}
        
        # Health monitoring configuration
        self.check_interval = 30  # 30 seconds
        self.recovery_timeout = 300  # 5 minutes
        self.max_restart_attempts = 3
        self.restart_cooldown = 600  # 10 minutes
        
        # Alert management
        self.active_alerts: Dict[str, SystemAlert] = {}
        self.alert_history: List[SystemAlert] = []
        self.recovery_attempts: Dict[str, List[RecoveryAttempt]] = {}
        
        # System resource monitoring
        self.resource_thresholds = {
            'cpu_usage': 85.0,
            'memory_usage': 90.0,
            'disk_usage': 85.0,
            'network_latency': 1000.0,  # ms
            'database_connections': 80.0  # % of max
        }
        
        # Service health thresholds
        self.service_thresholds = {
            'response_time_ms': 5000,
            'error_rate': 0.05,
            'uptime_percentage': 99.0
        }
        
        # Auto-recovery settings
        self.auto_recovery_enabled = True
        self.critical_services = {
            'enhanced_database_service',
            'autonomous_agent_coordinator',
            'autonomous_state_persistence',
            'multi_exchange_integration',
            'advanced_risk_management'
        }
        
        self.is_initialized = False
        
        logger.info("Autonomous Health Monitor initialized for 24/7 operation")
    
    async def initialize(self):
        """Initialize the health monitoring system"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.state_persistence = registry.get_service("autonomous_state_persistence")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            
            # Initialize database tables
            if self.db_service:
                await self._create_health_tables()
            
            # Discover and register services
            await self._discover_services()
            
            # Load existing health data
            await self._load_health_history()
            
            # Start monitoring tasks
            asyncio.create_task(self._health_monitoring_loop())
            asyncio.create_task(self._resource_monitoring_loop())
            asyncio.create_task(self._recovery_manager_loop())
            asyncio.create_task(self._alert_manager_loop())
            asyncio.create_task(self._cleanup_task())
            
            self.is_initialized = True
            logger.info("Health monitoring system initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize health monitor: {e}")
            raise
    
    async def _discover_services(self):
        """Automatically discover services to monitor"""
        try:
            registry = get_registry()
            
            # Get all registered services
            services = registry.get_all_services()
            
            for service_name, service_instance in services.items():
                if hasattr(service_instance, 'get_service_status'):
                    self.monitored_services.add(service_name)
                    
                    # Try to determine service endpoint
                    if hasattr(service_instance, 'base_url'):
                        self.service_endpoints[service_name] = service_instance.base_url
                    elif service_name == 'enhanced_database_service':
                        self.service_endpoints[service_name] = 'database://internal'
                    else:
                        self.service_endpoints[service_name] = 'internal://service'
            
            # Add external services
            external_services = {
                'supabase_database': os.getenv('DATABASE_URL', ''),
                'redis_cache': os.getenv('REDIS_URL', ''),
                'fastapi_main': 'http://localhost:8000/health'
            }
            
            for service_name, endpoint in external_services.items():
                if endpoint:
                    self.monitored_services.add(service_name)
                    self.service_endpoints[service_name] = endpoint
            
            logger.info(f"Discovered {len(self.monitored_services)} services to monitor")
            
        except Exception as e:
            logger.error(f"Failed to discover services: {e}")
    
    async def _health_monitoring_loop(self):
        """Main health monitoring loop"""
        while True:
            try:
                await asyncio.sleep(self.check_interval)
                
                # Check health of all monitored services
                for service_name in self.monitored_services:
                    await self._check_service_health(service_name)
                
                # Evaluate overall system health
                await self._evaluate_system_health()
                
                # Update health metrics in database
                if self.db_service:
                    await self._persist_health_metrics()
                
            except Exception as e:
                logger.error(f"Error in health monitoring loop: {e}")
    
    async def _check_service_health(self, service_name: str):
        """Check health of individual service"""
        try:
            start_time = time.time()
            health_metrics = {}
            
            # Get service instance
            registry = get_registry()
            service_instance = registry.get_service(service_name)
            
            # Check internal service health
            if service_instance and hasattr(service_instance, 'get_service_status'):
                try:
                    status_data = await service_instance.get_service_status()
                    
                    # Calculate response time
                    response_time = (time.time() - start_time) * 1000
                    
                    # Create health metrics
                    health_metrics['response_time'] = HealthMetric(
                        metric_name='response_time',
                        value=response_time,
                        threshold=self.service_thresholds['response_time_ms'],
                        status=ServiceHealth.HEALTHY if response_time < self.service_thresholds['response_time_ms'] else ServiceHealth.DEGRADED,
                        unit='ms',
                        timestamp=datetime.now(timezone.utc),
                        details=status_data
                    )
                    
                    # Extract service-specific metrics
                    if isinstance(status_data, dict):
                        error_count = status_data.get('error_count', 0)
                        uptime = status_data.get('uptime_seconds', 0)
                        
                        health_metrics['error_count'] = HealthMetric(
                            metric_name='error_count',
                            value=error_count,
                            threshold=10,  # 10 errors threshold
                            status=ServiceHealth.HEALTHY if error_count < 10 else ServiceHealth.UNHEALTHY,
                            unit='count',
                            timestamp=datetime.now(timezone.utc)
                        )
                        
                        overall_health = self._determine_overall_health(health_metrics)
                        
                        # Update service status
                        self.service_statuses[service_name] = ServiceStatus(
                            service_name=service_name,
                            health=overall_health,
                            uptime_seconds=uptime,
                            response_time_ms=response_time,
                            error_count=error_count,
                            last_error=status_data.get('last_error'),
                            metrics=health_metrics,
                            dependencies=status_data.get('dependencies', []),
                            auto_recovery_enabled=service_name in self.critical_services,
                            restart_count=self._get_restart_count(service_name),
                            last_restart=self._get_last_restart(service_name)
                        )
                        
                except Exception as e:
                    # Service is unhealthy
                    self.service_statuses[service_name] = ServiceStatus(
                        service_name=service_name,
                        health=ServiceHealth.CRITICAL,
                        uptime_seconds=0,
                        response_time_ms=999999,
                        error_count=999,
                        last_error=str(e),
                        metrics={},
                        dependencies=[],
                        auto_recovery_enabled=service_name in self.critical_services,
                        restart_count=self._get_restart_count(service_name),
                        last_restart=self._get_last_restart(service_name)
                    )
                    
                    # Create alert for critical service failure
                    if service_name in self.critical_services:
                        await self._create_alert(
                            service_name=service_name,
                            severity=AlertSeverity.CRITICAL,
                            message=f"Critical service {service_name} is unresponsive",
                            details={'error': str(e)},
                            recovery_action=RecoveryAction.RESTART_SERVICE
                        )
            
            # Check external service endpoints
            elif service_name in self.service_endpoints:
                await self._check_external_service(service_name)
                
        except Exception as e:
            logger.error(f"Failed to check health for {service_name}: {e}")
    
    async def _check_external_service(self, service_name: str):
        """Check health of external service endpoint"""
        try:
            endpoint = self.service_endpoints[service_name]
            start_time = time.time()
            
            if endpoint.startswith('http'):
                # HTTP endpoint check
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                    async with session.get(endpoint) as response:
                        response_time = (time.time() - start_time) * 1000
                        
                        health = ServiceHealth.HEALTHY if response.status == 200 else ServiceHealth.UNHEALTHY
                        
                        self.service_statuses[service_name] = ServiceStatus(
                            service_name=service_name,
                            health=health,
                            uptime_seconds=0,  # External service uptime not tracked
                            response_time_ms=response_time,
                            error_count=0 if response.status == 200 else 1,
                            last_error=None if response.status == 200 else f"HTTP {response.status}",
                            metrics={},
                            dependencies=[],
                            auto_recovery_enabled=False,  # Cannot restart external services
                            restart_count=0,
                            last_restart=None
                        )
                        
            elif 'database' in endpoint.lower():
                # Database connection check
                if self.db_service:
                    try:
                        await self.db_service.execute_query("SELECT 1")
                        response_time = (time.time() - start_time) * 1000
                        
                        self.service_statuses[service_name] = ServiceStatus(
                            service_name=service_name,
                            health=ServiceHealth.HEALTHY,
                            uptime_seconds=0,
                            response_time_ms=response_time,
                            error_count=0,
                            last_error=None,
                            metrics={},
                            dependencies=[],
                            auto_recovery_enabled=True,
                            restart_count=0,
                            last_restart=None
                        )
                    except Exception as e:
                        await self._create_alert(
                            service_name=service_name,
                            severity=AlertSeverity.CRITICAL,
                            message=f"Database connection failed",
                            details={'error': str(e)},
                            recovery_action=RecoveryAction.RESTART_DATABASE
                        )
                        
        except Exception as e:
            logger.error(f"Failed to check external service {service_name}: {e}")
    
    async def _resource_monitoring_loop(self):
        """Monitor system resources"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                if cpu_percent > self.resource_thresholds['cpu_usage']:
                    await self._create_alert(
                        service_name='system_resources',
                        severity=AlertSeverity.WARNING,
                        message=f"High CPU usage: {cpu_percent}%",
                        details={'cpu_percent': cpu_percent},
                        recovery_action=RecoveryAction.SCALE_UP
                    )
                
                # Memory usage
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                if memory_percent > self.resource_thresholds['memory_usage']:
                    await self._create_alert(
                        service_name='system_resources',
                        severity=AlertSeverity.WARNING,
                        message=f"High memory usage: {memory_percent}%",
                        details={'memory_percent': memory_percent, 'available_mb': memory.available // 1024 // 1024},
                        recovery_action=RecoveryAction.RESTART_SERVICE
                    )
                
                # Disk usage
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                if disk_percent > self.resource_thresholds['disk_usage']:
                    await self._create_alert(
                        service_name='system_resources',
                        severity=AlertSeverity.ERROR,
                        message=f"High disk usage: {disk_percent:.1f}%",
                        details={'disk_percent': disk_percent, 'free_gb': disk.free // 1024 // 1024 // 1024}
                    )
                
                # Network connectivity
                await self._check_network_connectivity()
                
            except Exception as e:
                logger.error(f"Error in resource monitoring: {e}")
    
    async def _recovery_manager_loop(self):
        """Manage automatic recovery actions"""
        while True:
            try:
                await asyncio.sleep(10)  # Check every 10 seconds
                
                if not self.auto_recovery_enabled:
                    continue
                
                # Process active alerts that need recovery
                for alert_id, alert in list(self.active_alerts.items()):
                    if alert.recovery_action and not alert.resolved_at:
                        # Check if recovery should be attempted
                        if await self._should_attempt_recovery(alert):
                            await self._execute_recovery_action(alert)
                
            except Exception as e:
                logger.error(f"Error in recovery manager: {e}")
    
    async def _execute_recovery_action(self, alert: SystemAlert):
        """Execute recovery action for an alert"""
        try:
            service_name = alert.service_name
            action = alert.recovery_action
            
            # Check recovery attempt limits
            attempts = self.recovery_attempts.get(service_name, [])
            recent_attempts = [
                a for a in attempts 
                if (datetime.now(timezone.utc) - a.started_at).total_seconds() < self.restart_cooldown
            ]
            
            if len(recent_attempts) >= self.max_restart_attempts:
                logger.warning(f"Maximum recovery attempts reached for {service_name}")
                return
            
            # Create recovery attempt record
            attempt = RecoveryAttempt(
                attempt_id=str(uuid.uuid4()),
                service_name=service_name,
                action=action,
                started_at=datetime.now(timezone.utc),
                completed_at=None,
                success=False,
                error_message=None,
                attempt_number=len(attempts) + 1
            )
            
            if service_name not in self.recovery_attempts:
                self.recovery_attempts[service_name] = []
            self.recovery_attempts[service_name].append(attempt)
            
            logger.info(f"Starting recovery action {action.value} for {service_name}")
            
            # Execute specific recovery action
            success = False
            error_message = None
            
            try:
                if action == RecoveryAction.RESTART_SERVICE:
                    success = await self._restart_service(service_name)
                elif action == RecoveryAction.RESTART_DATABASE:
                    success = await self._restart_database_connection()
                elif action == RecoveryAction.RESTART_REDIS:
                    success = await self._restart_redis_connection()
                elif action == RecoveryAction.RESTART_WEBSOCKET:
                    success = await self._restart_websocket_server()
                elif action == RecoveryAction.RESTART_MCP_SERVER:
                    success = await self._restart_mcp_server(service_name)
                elif action == RecoveryAction.EMERGENCY_SHUTDOWN:
                    success = await self._emergency_shutdown()
                else:
                    error_message = f"Unknown recovery action: {action}"
                    
            except Exception as e:
                error_message = str(e)
                logger.error(f"Recovery action failed: {e}")
            
            # Update attempt record
            attempt.completed_at = datetime.now(timezone.utc)
            attempt.success = success
            attempt.error_message = error_message
            
            if success:
                # Mark alert as auto-resolved
                alert.resolved_at = datetime.now(timezone.utc)
                alert.auto_resolved = True
                del self.active_alerts[alert.alert_id]
                
                logger.info(f"Recovery successful for {service_name}")
                
                # Emit recovery success event
                if self.event_service:
                    await self.event_service.emit_event({
                        'event_type': 'recovery.success',
                        'service_name': service_name,
                        'action': action.value,
                        'attempt_number': attempt.attempt_number,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    })
            else:
                logger.error(f"Recovery failed for {service_name}: {error_message}")
                
        except Exception as e:
            logger.error(f"Failed to execute recovery action: {e}")
    
    async def _restart_service(self, service_name: str) -> bool:
        """Restart a specific service"""
        try:
            registry = get_registry()
            service_instance = registry.get_service(service_name)
            
            if service_instance:
                # Try to gracefully stop service
                if hasattr(service_instance, 'stop'):
                    await service_instance.stop()
                
                # Wait brief moment
                await asyncio.sleep(2)
                
                # Try to restart service
                if hasattr(service_instance, 'initialize'):
                    await service_instance.initialize()
                    return True
                elif hasattr(service_instance, 'start'):
                    await service_instance.start()
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to restart service {service_name}: {e}")
            return False
    
    async def _restart_database_connection(self) -> bool:
        """Restart database connection"""
        try:
            if self.db_service:
                await self.db_service.reset_connection_pool()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to restart database connection: {e}")
            return False
    
    async def _create_alert(self, 
                           service_name: str, 
                           severity: AlertSeverity, 
                           message: str, 
                           details: Dict[str, Any] = None,
                           recovery_action: Optional[RecoveryAction] = None):
        """Create a new system alert"""
        try:
            alert = SystemAlert(
                alert_id=str(uuid.uuid4()),
                service_name=service_name,
                severity=severity,
                message=message,
                details=details or {},
                recovery_action=recovery_action,
                created_at=datetime.now(timezone.utc),
                resolved_at=None,
                auto_resolved=False
            )
            
            self.active_alerts[alert.alert_id] = alert
            self.alert_history.append(alert)
            
            logger.warning(f"Alert created: {severity.value.upper()} - {service_name}: {message}")
            
            # Emit alert event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'health.alert',
                    'alert_id': alert.alert_id,
                    'service_name': service_name,
                    'severity': severity.value,
                    'message': message,
                    'details': details,
                    'recovery_action': recovery_action.value if recovery_action else None,
                    'timestamp': alert.created_at.isoformat()
                })
            
            # Persist alert to database
            if self.db_service:
                await self._persist_alert(alert)
                
        except Exception as e:
            logger.error(f"Failed to create alert: {e}")
    
    def _determine_overall_health(self, metrics: Dict[str, HealthMetric]) -> ServiceHealth:
        """Determine overall service health from metrics"""
        if not metrics:
            return ServiceHealth.UNKNOWN
        
        health_scores = [metric.status for metric in metrics.values()]
        
        if ServiceHealth.CRITICAL in health_scores:
            return ServiceHealth.CRITICAL
        elif ServiceHealth.UNHEALTHY in health_scores:
            return ServiceHealth.UNHEALTHY
        elif ServiceHealth.DEGRADED in health_scores:
            return ServiceHealth.DEGRADED
        else:
            return ServiceHealth.HEALTHY
    
    async def get_system_health_summary(self) -> Dict[str, Any]:
        """Get comprehensive system health summary"""
        try:
            healthy_services = sum(1 for s in self.service_statuses.values() if s.health == ServiceHealth.HEALTHY)
            total_services = len(self.service_statuses)
            
            critical_alerts = sum(1 for a in self.active_alerts.values() if a.severity == AlertSeverity.CRITICAL)
            warning_alerts = sum(1 for a in self.active_alerts.values() if a.severity == AlertSeverity.WARNING)
            
            # System resources
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'overall_health': 'healthy' if healthy_services == total_services and critical_alerts == 0 else 'degraded' if critical_alerts == 0 else 'critical',
                'services': {
                    'total': total_services,
                    'healthy': healthy_services,
                    'unhealthy': total_services - healthy_services
                },
                'alerts': {
                    'active': len(self.active_alerts),
                    'critical': critical_alerts,
                    'warning': warning_alerts
                },
                'resources': {
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'memory_available_mb': memory.available // 1024 // 1024,
                    'disk_percent': (disk.used / disk.total) * 100,
                    'disk_free_gb': disk.free // 1024 // 1024 // 1024
                },
                'recovery': {
                    'auto_recovery_enabled': self.auto_recovery_enabled,
                    'total_recovery_attempts': sum(len(attempts) for attempts in self.recovery_attempts.values()),
                    'successful_recoveries': sum(
                        sum(1 for attempt in attempts if attempt.success) 
                        for attempts in self.recovery_attempts.values()
                    )
                },
                'monitoring': {
                    'monitored_services': len(self.monitored_services),
                    'check_interval_seconds': self.check_interval,
                    'uptime_seconds': time.time() - getattr(self, 'start_time', time.time())
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get health summary: {e}")
            return {'error': str(e)}
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "service": "autonomous_health_monitor",
            "initialized": self.is_initialized,
            "monitored_services": len(self.monitored_services),
            "active_alerts": len(self.active_alerts),
            "auto_recovery_enabled": self.auto_recovery_enabled,
            "check_interval_seconds": self.check_interval,
            "critical_services": len(self.critical_services),
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }
    
    async def _create_health_tables(self):
        """Create database tables for health monitoring"""
        try:
            # System health metrics table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS system_health_metrics (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    service_name TEXT NOT NULL,
                    health_status TEXT NOT NULL,
                    response_time_ms INTEGER,
                    error_count INTEGER DEFAULT 0,
                    uptime_seconds BIGINT DEFAULT 0,
                    last_error_message TEXT,
                    metrics_data JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Service uptime tracking
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS service_uptime (
                    service_name TEXT PRIMARY KEY,
                    total_uptime_seconds BIGINT DEFAULT 0,
                    last_startup TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    failure_count INTEGER DEFAULT 0,
                    last_failure TIMESTAMP WITH TIME ZONE,
                    restart_count INTEGER DEFAULT 0,
                    last_restart TIMESTAMP WITH TIME ZONE
                )
            """)
            
            # Health alerts table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS health_alerts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    alert_id TEXT UNIQUE NOT NULL,
                    service_name TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    details JSONB,
                    recovery_action TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    resolved_at TIMESTAMP WITH TIME ZONE,
                    auto_resolved BOOLEAN DEFAULT FALSE
                )
            """)
            
            # Recovery attempts table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS recovery_attempts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    attempt_id TEXT UNIQUE NOT NULL,
                    service_name TEXT NOT NULL,
                    action TEXT NOT NULL,
                    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    success BOOLEAN DEFAULT FALSE,
                    error_message TEXT,
                    attempt_number INTEGER NOT NULL
                )
            """)
            
            # Create indexes for performance
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_system_health_service_time ON system_health_metrics(service_name, created_at);
                CREATE INDEX IF NOT EXISTS idx_health_alerts_service ON health_alerts(service_name, created_at);
                CREATE INDEX IF NOT EXISTS idx_recovery_attempts_service ON recovery_attempts(service_name, started_at);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create health tables: {e}")
            raise
    
    def _get_restart_count(self, service_name: str) -> int:
        """Get restart count for service"""
        attempts = self.recovery_attempts.get(service_name, [])
        return sum(1 for attempt in attempts if attempt.action == RecoveryAction.RESTART_SERVICE and attempt.success)
    
    def _get_last_restart(self, service_name: str) -> Optional[datetime]:
        """Get last restart time for service"""
        attempts = self.recovery_attempts.get(service_name, [])
        restart_attempts = [
            attempt for attempt in attempts 
            if attempt.action == RecoveryAction.RESTART_SERVICE and attempt.success
        ]
        if restart_attempts:
            return max(attempt.completed_at for attempt in restart_attempts if attempt.completed_at)
        return None
    
    async def _should_attempt_recovery(self, alert: SystemAlert) -> bool:
        """Determine if recovery should be attempted for an alert"""
        # Check if alert is recent enough
        age = (datetime.now(timezone.utc) - alert.created_at).total_seconds()
        if age > self.recovery_timeout:
            return False
        
        # Check recent recovery attempts
        attempts = self.recovery_attempts.get(alert.service_name, [])
        recent_attempts = [
            a for a in attempts 
            if (datetime.now(timezone.utc) - a.started_at).total_seconds() < self.restart_cooldown
        ]
        
        return len(recent_attempts) < self.max_restart_attempts

# Factory function for service registry
def create_autonomous_health_monitor():
    """Factory function to create AutonomousHealthMonitor instance"""
    return AutonomousHealthMonitor()