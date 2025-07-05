#!/usr/bin/env python3
"""
Monitoring and Reliability Service
Health checks, monitoring, alerting, and reliability patterns
"""

import asyncio
import json
import logging
import time
import psutil
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Union
from pydantic import BaseModel
from collections import defaultdict, deque
from enum import Enum
import weakref
import threading

# Configure logging
logger = logging.getLogger(__name__)

class HealthStatus(str, Enum):
    """Health status levels"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    DOWN = "down"

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class ServiceMetrics(BaseModel):
    """Service metrics tracking"""
    service_name: str
    status: HealthStatus
    response_time: float
    error_rate: float
    throughput: float
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    uptime: float
    last_check: datetime
    metadata: Dict[str, Any] = {}

class HealthCheck(BaseModel):
    """Health check definition"""
    name: str
    service: str
    check_function: str
    interval: int = 30  # seconds
    timeout: int = 5
    retries: int = 3
    critical: bool = False
    dependencies: List[str] = []

class Alert(BaseModel):
    """Alert definition"""
    alert_id: str
    service: str
    severity: AlertSeverity
    message: str
    metric: str
    threshold: float
    current_value: float
    timestamp: datetime
    acknowledged: bool = False
    resolved: bool = False
    metadata: Dict[str, Any] = {}

class CircuitBreakerState(str, Enum):
    """Circuit breaker states"""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    """Circuit breaker implementation for resilience"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60, 
                 success_threshold: int = 3):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED
        self.lock = threading.Lock()
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == CircuitBreakerState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitBreakerState.HALF_OPEN
                    self.success_count = 0
                else:
                    raise Exception("Circuit breaker is OPEN")
            
            try:
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                self._on_success()
                return result
                
            except Exception as e:
                self._on_failure()
                raise e
    
    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt reset"""
        if self.last_failure_time is None:
            return True
        
        return time.time() - self.last_failure_time >= self.recovery_timeout
    
    def _on_success(self) -> None:
        """Handle successful operation"""
        self.failure_count = 0
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitBreakerState.CLOSED
    
    def _on_failure(self) -> None:
        """Handle failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
    
    def get_state(self) -> Dict[str, Any]:
        """Get circuit breaker state"""
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "failure_threshold": self.failure_threshold,
            "last_failure_time": self.last_failure_time
        }

class RetryPolicy:
    """Retry policy for failed operations"""
    
    def __init__(self, max_retries: int = 3, backoff_factor: float = 2.0, 
                 max_delay: float = 60.0):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.max_delay = max_delay
    
    async def retry(self, func: Callable, *args, **kwargs) -> Any:
        """Retry function with exponential backoff"""
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
                    
            except Exception as e:
                last_exception = e
                
                if attempt < self.max_retries:
                    delay = min(self.backoff_factor ** attempt, self.max_delay)
                    logger.warning(f"Retry attempt {attempt + 1} failed, retrying in {delay}s: {e}")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"All retry attempts failed: {e}")
                    raise e
        
        raise last_exception

class SystemMonitor:
    """System resource monitoring"""
    
    def __init__(self):
        self.cpu_history = deque(maxlen=60)  # Last 60 measurements
        self.memory_history = deque(maxlen=60)
        self.disk_history = deque(maxlen=60)
        self.network_history = deque(maxlen=60)
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.cpu_history.append(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            self.memory_history.append(memory_percent)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            self.disk_history.append(disk_percent)
            
            # Network I/O
            network = psutil.net_io_counters()
            
            return {
                "cpu_percent": cpu_percent,
                "cpu_avg_1m": statistics.mean(self.cpu_history) if self.cpu_history else 0,
                "memory_percent": memory_percent,
                "memory_available_gb": memory.available / (1024**3),
                "memory_avg_1m": statistics.mean(self.memory_history) if self.memory_history else 0,
                "disk_percent": disk_percent,
                "disk_free_gb": disk.free / (1024**3),
                "disk_avg_1m": statistics.mean(self.disk_history) if self.disk_history else 0,
                "network_bytes_sent": network.bytes_sent,
                "network_bytes_recv": network.bytes_recv,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"System metrics collection failed: {e}")
            return {"error": str(e)}

class AlertManager:
    """Alert management system"""
    
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.alert_rules: Dict[str, Dict[str, Any]] = {}
        self.notification_channels: List[Callable] = []
        self.suppression_rules: Dict[str, datetime] = {}
    
    def add_alert_rule(self, service: str, metric: str, threshold: float, 
                      severity: AlertSeverity, comparison: str = "greater_than") -> None:
        """Add alert rule"""
        rule_id = f"{service}_{metric}_{comparison}_{threshold}"
        self.alert_rules[rule_id] = {
            "service": service,
            "metric": metric,
            "threshold": threshold,
            "severity": severity,
            "comparison": comparison,
            "enabled": True
        }
        
        logger.info(f"Added alert rule: {rule_id}")
    
    def evaluate_metrics(self, metrics: Dict[str, ServiceMetrics]) -> List[Alert]:
        """Evaluate metrics against alert rules"""
        new_alerts = []
        
        for rule_id, rule in self.alert_rules.items():
            if not rule["enabled"]:
                continue
                
            service_metrics = metrics.get(rule["service"])
            if not service_metrics:
                continue
            
            metric_value = getattr(service_metrics, rule["metric"], None)
            if metric_value is None:
                continue
            
            # Check if alert should trigger
            should_alert = False
            if rule["comparison"] == "greater_than" and metric_value > rule["threshold"]:
                should_alert = True
            elif rule["comparison"] == "less_than" and metric_value < rule["threshold"]:
                should_alert = True
            elif rule["comparison"] == "equals" and metric_value == rule["threshold"]:
                should_alert = True
            
            if should_alert and not self._is_suppressed(rule_id):
                alert = Alert(
                    alert_id=f"{rule_id}_{int(time.time())}",
                    service=rule["service"],
                    severity=rule["severity"],
                    message=f"{rule['service']} {rule['metric']} is {metric_value} (threshold: {rule['threshold']})",
                    metric=rule["metric"],
                    threshold=rule["threshold"],
                    current_value=metric_value,
                    timestamp=datetime.now()
                )
                
                self.alerts[alert.alert_id] = alert
                new_alerts.append(alert)
        
        return new_alerts
    
    def _is_suppressed(self, rule_id: str) -> bool:
        """Check if alert is suppressed"""
        if rule_id in self.suppression_rules:
            return datetime.now() < self.suppression_rules[rule_id]
        return False
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].acknowledged = True
            return True
        return False
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].resolved = True
            return True
        return False
    
    def get_active_alerts(self) -> List[Alert]:
        """Get active (unresolved) alerts"""
        return [alert for alert in self.alerts.values() if not alert.resolved]

class MonitoringService:
    """Main monitoring and reliability service"""
    
    def __init__(self):
        self.health_checks: Dict[str, HealthCheck] = {}
        self.service_metrics: Dict[str, ServiceMetrics] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.retry_policies: Dict[str, RetryPolicy] = {}
        self.system_monitor = SystemMonitor()
        self.alert_manager = AlertManager()
        self.monitoring_enabled = True
        self.check_interval = 30  # seconds
        self.monitoring_task = None
        
        # Initialize default alert rules
        self._initialize_default_alerts()
    
    async def initialize(self) -> bool:
        """Initialize monitoring service"""
        try:
            # Start monitoring task
            self.monitoring_task = asyncio.create_task(self._monitoring_loop())
            
            # Add default health checks
            await self._add_default_health_checks()
            
            logger.info("Monitoring service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize monitoring service: {e}")
            return False
    
    def add_health_check(self, check: HealthCheck) -> None:
        """Add health check"""
        self.health_checks[check.name] = check
        logger.info(f"Added health check: {check.name}")
    
    def add_circuit_breaker(self, service: str, **kwargs) -> CircuitBreaker:
        """Add circuit breaker for service"""
        circuit_breaker = CircuitBreaker(**kwargs)
        self.circuit_breakers[service] = circuit_breaker
        logger.info(f"Added circuit breaker for service: {service}")
        return circuit_breaker
    
    def add_retry_policy(self, service: str, **kwargs) -> RetryPolicy:
        """Add retry policy for service"""
        retry_policy = RetryPolicy(**kwargs)
        self.retry_policies[service] = retry_policy
        logger.info(f"Added retry policy for service: {service}")
        return retry_policy
    
    async def check_service_health(self, service_name: str) -> ServiceMetrics:
        """Check health of specific service"""
        try:
            start_time = time.time()
            
            # Get health check for service
            health_check = self.health_checks.get(service_name)
            if not health_check:
                # Default health check
                status = HealthStatus.HEALTHY
                error_rate = 0.0
                throughput = 0.0
            else:
                # Execute health check
                status = await self._execute_health_check(health_check)
                error_rate = 0.0  # Simplified for now
                throughput = 0.0  # Simplified for now
            
            response_time = time.time() - start_time
            
            # Get system metrics
            system_metrics = self.system_monitor.get_system_metrics()
            
            metrics = ServiceMetrics(
                service_name=service_name,
                status=status,
                response_time=response_time,
                error_rate=error_rate,
                throughput=throughput,
                cpu_usage=system_metrics.get("cpu_percent", 0),
                memory_usage=system_metrics.get("memory_percent", 0),
                disk_usage=system_metrics.get("disk_percent", 0),
                uptime=time.time(),  # Simplified
                last_check=datetime.now(),
                metadata=system_metrics
            )
            
            self.service_metrics[service_name] = metrics
            return metrics
            
        except Exception as e:
            logger.error(f"Health check failed for {service_name}: {e}")
            
            # Return unhealthy metrics
            return ServiceMetrics(
                service_name=service_name,
                status=HealthStatus.DOWN,
                response_time=0.0,
                error_rate=1.0,
                throughput=0.0,
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_usage=0.0,
                uptime=0.0,
                last_check=datetime.now(),
                metadata={"error": str(e)}
            )
    
    async def get_overall_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        try:
            # Check all services
            all_metrics = {}
            for service_name in self.health_checks.keys():
                metrics = await self.check_service_health(service_name)
                all_metrics[service_name] = metrics
            
            # Calculate overall status
            overall_status = HealthStatus.HEALTHY
            critical_services = []
            warning_services = []
            
            for service_name, metrics in all_metrics.items():
                if metrics.status == HealthStatus.DOWN or metrics.status == HealthStatus.CRITICAL:
                    overall_status = HealthStatus.CRITICAL
                    critical_services.append(service_name)
                elif metrics.status == HealthStatus.WARNING:
                    if overall_status == HealthStatus.HEALTHY:
                        overall_status = HealthStatus.WARNING
                    warning_services.append(service_name)
            
            # Get system metrics
            system_metrics = self.system_monitor.get_system_metrics()
            
            # Get active alerts
            active_alerts = self.alert_manager.get_active_alerts()
            
            return {
                "overall_status": overall_status.value,
                "services": {name: metrics.dict() for name, metrics in all_metrics.items()},
                "system_metrics": system_metrics,
                "critical_services": critical_services,
                "warning_services": warning_services,
                "active_alerts": len(active_alerts),
                "circuit_breakers": {name: cb.get_state() for name, cb in self.circuit_breakers.items()},
                "monitoring_enabled": self.monitoring_enabled,
                "last_check": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Overall health check failed: {e}")
            return {
                "overall_status": HealthStatus.DOWN.value,
                "error": str(e),
                "last_check": datetime.now().isoformat()
            }
    
    async def _monitoring_loop(self) -> None:
        """Main monitoring loop"""
        while self.monitoring_enabled:
            try:
                # Check all services
                for service_name in self.health_checks.keys():
                    await self.check_service_health(service_name)
                
                # Evaluate alerts
                new_alerts = self.alert_manager.evaluate_metrics(self.service_metrics)
                
                # Process new alerts
                for alert in new_alerts:
                    await self._process_alert(alert)
                
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(5)  # Short delay on error
    
    async def _execute_health_check(self, check: HealthCheck) -> HealthStatus:
        """Execute health check"""
        try:
            # Mock health check execution
            await asyncio.sleep(0.1)  # Simulate check time
            
            # For demo purposes, return healthy status
            # In real implementation, this would execute the actual check
            return HealthStatus.HEALTHY
            
        except Exception as e:
            logger.error(f"Health check execution failed: {e}")
            return HealthStatus.DOWN
    
    async def _process_alert(self, alert: Alert) -> None:
        """Process new alert"""
        try:
            logger.warning(f"ALERT: {alert.severity.value.upper()} - {alert.message}")
            
            # In real implementation, this would send notifications
            # to configured channels (email, Slack, PagerDuty, etc.)
            
        except Exception as e:
            logger.error(f"Alert processing failed: {e}")
    
    async def _add_default_health_checks(self) -> None:
        """Add default health checks"""
        default_checks = [
            HealthCheck(
                name="api_server",
                service="api_server",
                check_function="check_api_health",
                interval=30,
                timeout=5,
                critical=True
            ),
            HealthCheck(
                name="database",
                service="database",
                check_function="check_database_health",
                interval=60,
                timeout=10,
                critical=True
            ),
            HealthCheck(
                name="cache",
                service="cache",
                check_function="check_cache_health",
                interval=30,
                timeout=5,
                critical=False
            ),
            HealthCheck(
                name="websocket",
                service="websocket",
                check_function="check_websocket_health",
                interval=30,
                timeout=5,
                critical=False
            )
        ]
        
        for check in default_checks:
            self.add_health_check(check)
    
    def _initialize_default_alerts(self) -> None:
        """Initialize default alert rules"""
        # System resource alerts
        self.alert_manager.add_alert_rule("system", "cpu_usage", 80.0, AlertSeverity.WARNING)
        self.alert_manager.add_alert_rule("system", "cpu_usage", 95.0, AlertSeverity.CRITICAL)
        self.alert_manager.add_alert_rule("system", "memory_usage", 85.0, AlertSeverity.WARNING)
        self.alert_manager.add_alert_rule("system", "memory_usage", 95.0, AlertSeverity.CRITICAL)
        self.alert_manager.add_alert_rule("system", "disk_usage", 90.0, AlertSeverity.WARNING)
        
        # Service performance alerts
        self.alert_manager.add_alert_rule("api_server", "response_time", 5.0, AlertSeverity.WARNING)
        self.alert_manager.add_alert_rule("api_server", "response_time", 10.0, AlertSeverity.CRITICAL)
        self.alert_manager.add_alert_rule("api_server", "error_rate", 0.05, AlertSeverity.WARNING)
        self.alert_manager.add_alert_rule("api_server", "error_rate", 0.1, AlertSeverity.CRITICAL)
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get monitoring service status"""
        return {
            "service": "monitoring",
            "status": "healthy" if self.monitoring_enabled else "disabled",
            "health_checks": len(self.health_checks),
            "circuit_breakers": len(self.circuit_breakers),
            "retry_policies": len(self.retry_policies),
            "active_alerts": len(self.alert_manager.get_active_alerts()),
            "monitoring_enabled": self.monitoring_enabled,
            "check_interval": self.check_interval,
            "last_check": datetime.now().isoformat()
        }

# Global service instance
monitoring_service = MonitoringService()