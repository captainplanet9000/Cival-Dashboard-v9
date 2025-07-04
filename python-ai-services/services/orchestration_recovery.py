#!/usr/bin/env python3
"""
Orchestration Error Handling & Recovery System
Provides comprehensive error handling, recovery mechanisms, and rollback capabilities
for the orchestration system.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import json
import traceback

logger = logging.getLogger(__name__)

class RecoveryAction(Enum):
    RETRY = "retry"
    ROLLBACK = "rollback"
    ESCALATE = "escalate"
    IGNORE = "ignore"
    RESTART_SERVICE = "restart_service"
    FAILOVER = "failover"

class ErrorSeverity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class SystemState(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILING = "failing"
    CRITICAL = "critical"
    RECOVERY = "recovery"

@dataclass
class ErrorContext:
    error_id: str
    service_name: str
    operation: str
    error_type: str
    error_message: str
    severity: ErrorSeverity
    timestamp: datetime
    stacktrace: Optional[str] = None
    metadata: Dict[str, Any] = None
    retry_count: int = 0
    max_retries: int = 3

@dataclass
class RecoveryPlan:
    plan_id: str
    error_context: ErrorContext
    actions: List[RecoveryAction]
    rollback_steps: List[Dict[str, Any]]
    estimated_recovery_time: int  # seconds
    requires_manual_intervention: bool = False

@dataclass
class SystemSnapshot:
    snapshot_id: str
    timestamp: datetime
    state: Dict[str, Any]
    services_status: Dict[str, str]
    active_operations: List[str]
    metadata: Dict[str, Any]

class OrchestrationRecovery:
    """
    Comprehensive error handling and recovery system for orchestration
    """
    
    def __init__(self, registry=None):
        self.registry = registry
        self.error_handlers: Dict[str, Callable] = {}
        self.recovery_plans: Dict[str, RecoveryPlan] = {}
        self.system_snapshots: List[SystemSnapshot] = []
        self.error_history: List[ErrorContext] = []
        self.max_snapshots = 50
        self.max_error_history = 1000
        self.current_system_state = SystemState.HEALTHY
        self.is_recovery_active = False
        
        # Initialize error handlers
        self._setup_error_handlers()
        
        # Start background health monitoring
        self.health_monitor_task = None
        
    def _setup_error_handlers(self):
        """Setup default error handlers for common scenarios"""
        self.error_handlers.update({
            "agent_failure": self.handle_agent_failure,
            "farm_failure": self.handle_farm_failure,
            "capital_allocation_failure": self.handle_capital_allocation_failure,
            "attribution_calculation_failure": self.handle_attribution_calculation_failure,
            "database_connection_failure": self.handle_database_failure,
            "service_unavailable": self.handle_service_unavailable,
            "timeout_error": self.handle_timeout_error,
            "validation_error": self.handle_validation_error,
            "performance_degradation": self.handle_performance_degradation,
            "resource_exhaustion": self.handle_resource_exhaustion
        })
    
    async def start_monitoring(self):
        """Start background health monitoring"""
        if self.health_monitor_task:
            return
        
        self.health_monitor_task = asyncio.create_task(self._health_monitor_loop())
        logger.info("Started orchestration recovery monitoring")
    
    async def stop_monitoring(self):
        """Stop background health monitoring"""
        if self.health_monitor_task:
            self.health_monitor_task.cancel()
            try:
                await self.health_monitor_task
            except asyncio.CancelledError:
                pass
            self.health_monitor_task = None
        
        logger.info("Stopped orchestration recovery monitoring")
    
    async def _health_monitor_loop(self):
        """Background health monitoring loop"""
        try:
            while True:
                try:
                    await self._perform_health_check()
                    await asyncio.sleep(30)  # Check every 30 seconds
                except Exception as e:
                    logger.error(f"Health monitor error: {e}")
                    await asyncio.sleep(60)  # Wait longer on error
        except asyncio.CancelledError:
            pass
    
    async def _perform_health_check(self):
        """Perform comprehensive health check"""
        try:
            if not self.registry:
                return
            
            services = self.registry.get_all_services()
            failing_services = []
            degraded_services = []
            
            for service_name, service in services.items():
                try:
                    if hasattr(service, 'health_check'):
                        health = await service.health_check()
                        status = health.get("status", "unknown")
                        
                        if status == "failed":
                            failing_services.append(service_name)
                        elif status == "degraded":
                            degraded_services.append(service_name)
                            
                except Exception as e:
                    failing_services.append(service_name)
                    logger.error(f"Health check failed for {service_name}: {e}")
            
            # Update system state
            previous_state = self.current_system_state
            
            if failing_services:
                if len(failing_services) > len(services) * 0.5:
                    self.current_system_state = SystemState.CRITICAL
                else:
                    self.current_system_state = SystemState.FAILING
            elif degraded_services:
                self.current_system_state = SystemState.DEGRADED
            else:
                self.current_system_state = SystemState.HEALTHY
            
            # Trigger recovery if state changed to worse
            if (previous_state != self.current_system_state and 
                self.current_system_state in [SystemState.FAILING, SystemState.CRITICAL]):
                await self._trigger_automatic_recovery(failing_services, degraded_services)
                
        except Exception as e:
            logger.error(f"Health check error: {e}")
    
    async def handle_error(self, error_context: ErrorContext) -> RecoveryPlan:
        """Main entry point for error handling"""
        try:
            logger.error(f"Handling error in {error_context.service_name}: {error_context.error_message}")
            
            # Add to error history
            self.error_history.append(error_context)
            if len(self.error_history) > self.max_error_history:
                self.error_history = self.error_history[-self.max_error_history:]
            
            # Create system snapshot for potential rollback
            await self.create_system_snapshot(f"before_recovery_{error_context.error_id}")
            
            # Determine recovery plan
            recovery_plan = await self._create_recovery_plan(error_context)
            
            # Execute recovery plan
            await self._execute_recovery_plan(recovery_plan)
            
            return recovery_plan
            
        except Exception as e:
            logger.error(f"Error handling failed: {e}")
            # Escalate to manual intervention
            return await self._escalate_to_manual_intervention(error_context, str(e))
    
    async def _create_recovery_plan(self, error_context: ErrorContext) -> RecoveryPlan:
        """Create a recovery plan based on error context"""
        plan_id = f"recovery_{error_context.error_id}_{datetime.now().timestamp()}"
        
        # Get appropriate handler
        handler = self.error_handlers.get(error_context.error_type, self.handle_generic_error)
        
        # Create recovery actions
        actions = await handler(error_context)
        
        # Create rollback steps
        rollback_steps = await self._create_rollback_steps(error_context)
        
        # Estimate recovery time
        estimated_time = self._estimate_recovery_time(actions)
        
        # Determine if manual intervention is required
        requires_manual = (
            error_context.severity == ErrorSeverity.CRITICAL or
            error_context.retry_count >= error_context.max_retries or
            self.current_system_state == SystemState.CRITICAL
        )
        
        recovery_plan = RecoveryPlan(
            plan_id=plan_id,
            error_context=error_context,
            actions=actions,
            rollback_steps=rollback_steps,
            estimated_recovery_time=estimated_time,
            requires_manual_intervention=requires_manual
        )
        
        self.recovery_plans[plan_id] = recovery_plan
        return recovery_plan
    
    async def _execute_recovery_plan(self, plan: RecoveryPlan):
        """Execute a recovery plan"""
        try:
            self.is_recovery_active = True
            self.current_system_state = SystemState.RECOVERY
            
            logger.info(f"Executing recovery plan {plan.plan_id}")
            
            for action in plan.actions:
                await self._execute_recovery_action(action, plan.error_context)
            
            # Verify recovery success
            if await self._verify_recovery_success(plan):
                logger.info(f"Recovery plan {plan.plan_id} completed successfully")
                self.current_system_state = SystemState.HEALTHY
            else:
                logger.warning(f"Recovery plan {plan.plan_id} did not fully resolve the issue")
                await self._execute_rollback(plan)
                
        except Exception as e:
            logger.error(f"Recovery plan execution failed: {e}")
            await self._execute_rollback(plan)
        finally:
            self.is_recovery_active = False
    
    async def _execute_recovery_action(self, action: RecoveryAction, error_context: ErrorContext):
        """Execute a specific recovery action"""
        logger.info(f"Executing recovery action: {action.value}")
        
        try:
            if action == RecoveryAction.RETRY:
                await self._retry_operation(error_context)
            elif action == RecoveryAction.ROLLBACK:
                await self._execute_rollback_for_context(error_context)
            elif action == RecoveryAction.RESTART_SERVICE:
                await self._restart_service(error_context.service_name)
            elif action == RecoveryAction.FAILOVER:
                await self._failover_service(error_context.service_name)
            elif action == RecoveryAction.ESCALATE:
                await self._escalate_error(error_context)
            # IGNORE action does nothing intentionally
                
        except Exception as e:
            logger.error(f"Recovery action {action.value} failed: {e}")
            raise
    
    # ========================================================================
    # ERROR HANDLERS
    # ========================================================================
    
    async def handle_agent_failure(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle agent failure scenarios"""
        actions = []
        
        if error_context.retry_count < 2:
            actions.append(RecoveryAction.RETRY)
        else:
            # Try to reassign agent to different farm or disable
            actions.extend([RecoveryAction.FAILOVER, RecoveryAction.ESCALATE])
        
        return actions
    
    async def handle_farm_failure(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle farm failure scenarios"""
        actions = []
        
        if error_context.severity in [ErrorSeverity.LOW, ErrorSeverity.MEDIUM]:
            actions.append(RecoveryAction.RESTART_SERVICE)
        else:
            # Critical farm failure - redistribute agents and capital
            actions.extend([RecoveryAction.FAILOVER, RecoveryAction.ROLLBACK])
        
        return actions
    
    async def handle_capital_allocation_failure(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle capital allocation failure"""
        actions = []
        
        if "insufficient_funds" in error_context.error_message.lower():
            # Try to rebalance existing allocations
            actions.append(RecoveryAction.RETRY)
        else:
            # Data consistency issue - rollback to last known good state
            actions.append(RecoveryAction.ROLLBACK)
        
        return actions
    
    async def handle_attribution_calculation_failure(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle performance attribution calculation failures"""
        actions = []
        
        if error_context.retry_count < 1:
            actions.append(RecoveryAction.RETRY)
        else:
            # Use cached attribution data temporarily
            actions.extend([RecoveryAction.IGNORE, RecoveryAction.ESCALATE])
        
        return actions
    
    async def handle_database_failure(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle database connection failures"""
        actions = []
        
        if error_context.retry_count < 3:
            actions.append(RecoveryAction.RETRY)
        else:
            # Switch to failover database or local cache
            actions.extend([RecoveryAction.FAILOVER, RecoveryAction.ESCALATE])
        
        return actions
    
    async def handle_service_unavailable(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle service unavailability"""
        actions = [RecoveryAction.RESTART_SERVICE]
        
        if error_context.retry_count >= 2:
            actions.append(RecoveryAction.ESCALATE)
        
        return actions
    
    async def handle_timeout_error(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle timeout errors"""
        actions = []
        
        if error_context.retry_count < 2:
            actions.append(RecoveryAction.RETRY)
        else:
            actions.append(RecoveryAction.ESCALATE)
        
        return actions
    
    async def handle_validation_error(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle validation errors"""
        # Validation errors usually require manual intervention
        return [RecoveryAction.ESCALATE]
    
    async def handle_performance_degradation(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle performance degradation"""
        actions = [RecoveryAction.RESTART_SERVICE]
        
        if error_context.severity == ErrorSeverity.CRITICAL:
            actions.append(RecoveryAction.FAILOVER)
        
        return actions
    
    async def handle_resource_exhaustion(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Handle resource exhaustion (memory, CPU, etc.)"""
        return [RecoveryAction.RESTART_SERVICE, RecoveryAction.ESCALATE]
    
    async def handle_generic_error(self, error_context: ErrorContext) -> List[RecoveryAction]:
        """Generic error handler for unknown error types"""
        actions = []
        
        if error_context.retry_count < 1:
            actions.append(RecoveryAction.RETRY)
        else:
            actions.append(RecoveryAction.ESCALATE)
        
        return actions
    
    # ========================================================================
    # RECOVERY OPERATIONS
    # ========================================================================
    
    async def _retry_operation(self, error_context: ErrorContext):
        """Retry the failed operation"""
        # Implementation depends on the specific operation
        logger.info(f"Retrying operation: {error_context.operation}")
        
        # Add delay before retry (exponential backoff)
        delay = min(300, 10 * (2 ** error_context.retry_count))
        await asyncio.sleep(delay)
        
        # The actual retry would be handled by the calling service
        
    async def _restart_service(self, service_name: str):
        """Restart a specific service"""
        logger.info(f"Restarting service: {service_name}")
        
        if not self.registry:
            return
        
        try:
            service = self.registry.get_service(service_name)
            if service and hasattr(service, 'restart'):
                await service.restart()
            else:
                # Attempt to reinitialize the service
                await self.registry.reinitialize_service(service_name)
                
        except Exception as e:
            logger.error(f"Failed to restart service {service_name}: {e}")
            raise
    
    async def _failover_service(self, service_name: str):
        """Failover to backup service instance"""
        logger.info(f"Failing over service: {service_name}")
        
        # Implementation would depend on your failover strategy
        # This is a placeholder for failover logic
        
    async def _escalate_error(self, error_context: ErrorContext):
        """Escalate error to manual intervention"""
        logger.critical(f"Escalating error to manual intervention: {error_context.error_id}")
        
        # Send notification to administrators
        await self._send_escalation_notification(error_context)
    
    async def _send_escalation_notification(self, error_context: ErrorContext):
        """Send notification for escalated errors"""
        # Implementation would send email, Slack, etc.
        logger.critical(f"MANUAL INTERVENTION REQUIRED: {error_context.service_name} - {error_context.error_message}")
    
    # ========================================================================
    # ROLLBACK OPERATIONS
    # ========================================================================
    
    async def create_system_snapshot(self, snapshot_id: str) -> SystemSnapshot:
        """Create a system state snapshot"""
        try:
            snapshot = SystemSnapshot(
                snapshot_id=snapshot_id,
                timestamp=datetime.now(timezone.utc),
                state={},
                services_status={},
                active_operations=[],
                metadata={}
            )
            
            if self.registry:
                # Capture service states
                services = self.registry.get_all_services()
                for service_name, service in services.items():
                    try:
                        if hasattr(service, 'get_state'):
                            snapshot.state[service_name] = await service.get_state()
                        
                        if hasattr(service, 'health_check'):
                            health = await service.health_check()
                            snapshot.services_status[service_name] = health.get("status", "unknown")
                    except Exception as e:
                        logger.error(f"Failed to capture state for {service_name}: {e}")
                        snapshot.services_status[service_name] = "error"
            
            self.system_snapshots.append(snapshot)
            
            # Keep only recent snapshots
            if len(self.system_snapshots) > self.max_snapshots:
                self.system_snapshots = self.system_snapshots[-self.max_snapshots:]
            
            logger.info(f"Created system snapshot: {snapshot_id}")
            return snapshot
            
        except Exception as e:
            logger.error(f"Failed to create system snapshot: {e}")
            raise
    
    async def rollback_to_snapshot(self, snapshot_id: str) -> bool:
        """Rollback system to a previous snapshot"""
        try:
            snapshot = next((s for s in self.system_snapshots if s.snapshot_id == snapshot_id), None)
            
            if not snapshot:
                logger.error(f"Snapshot not found: {snapshot_id}")
                return False
            
            logger.info(f"Rolling back to snapshot: {snapshot_id}")
            
            if self.registry:
                services = self.registry.get_all_services()
                
                for service_name, service in services.items():
                    try:
                        if service_name in snapshot.state and hasattr(service, 'restore_state'):
                            await service.restore_state(snapshot.state[service_name])
                    except Exception as e:
                        logger.error(f"Failed to restore state for {service_name}: {e}")
            
            logger.info(f"Rollback to snapshot {snapshot_id} completed")
            return True
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False
    
    async def rollback_to_last_known_state(self) -> bool:
        """Rollback to the most recent snapshot"""
        if not self.system_snapshots:
            logger.error("No snapshots available for rollback")
            return False
        
        latest_snapshot = self.system_snapshots[-1]
        return await self.rollback_to_snapshot(latest_snapshot.snapshot_id)
    
    async def _create_rollback_steps(self, error_context: ErrorContext) -> List[Dict[str, Any]]:
        """Create rollback steps for specific error context"""
        steps = []
        
        # Generic rollback steps
        steps.append({
            "action": "restore_service_state",
            "service": error_context.service_name,
            "description": f"Restore {error_context.service_name} to previous state"
        })
        
        # Add specific rollback steps based on operation
        if "capital" in error_context.operation.lower():
            steps.append({
                "action": "restore_capital_allocations",
                "description": "Restore previous capital allocation state"
            })
        elif "agent" in error_context.operation.lower():
            steps.append({
                "action": "restore_agent_assignments",
                "description": "Restore previous agent assignment state"
            })
        
        return steps
    
    async def _execute_rollback(self, recovery_plan: RecoveryPlan):
        """Execute rollback steps"""
        logger.info(f"Executing rollback for plan: {recovery_plan.plan_id}")
        
        for step in recovery_plan.rollback_steps:
            try:
                await self._execute_rollback_step(step)
            except Exception as e:
                logger.error(f"Rollback step failed: {step} - {e}")
    
    async def _execute_rollback_step(self, step: Dict[str, Any]):
        """Execute a single rollback step"""
        action = step.get("action")
        
        if action == "restore_service_state":
            service_name = step.get("service")
            if service_name:
                await self._restore_service_to_last_snapshot(service_name)
        elif action == "restore_capital_allocations":
            await self._restore_capital_allocations()
        elif action == "restore_agent_assignments":
            await self._restore_agent_assignments()
    
    async def _restore_service_to_last_snapshot(self, service_name: str):
        """Restore a specific service to its last known good state"""
        if not self.system_snapshots:
            return
        
        latest_snapshot = self.system_snapshots[-1]
        
        if service_name in latest_snapshot.state and self.registry:
            service = self.registry.get_service(service_name)
            if service and hasattr(service, 'restore_state'):
                await service.restore_state(latest_snapshot.state[service_name])
    
    async def _restore_capital_allocations(self):
        """Restore capital allocations to previous state"""
        # Implementation would restore capital allocation state
        logger.info("Restoring capital allocations to previous state")
    
    async def _restore_agent_assignments(self):
        """Restore agent assignments to previous state"""
        # Implementation would restore agent assignment state
        logger.info("Restoring agent assignments to previous state")
    
    # ========================================================================
    # UTILITY METHODS
    # ========================================================================
    
    def _estimate_recovery_time(self, actions: List[RecoveryAction]) -> int:
        """Estimate recovery time in seconds"""
        time_estimates = {
            RecoveryAction.RETRY: 30,
            RecoveryAction.ROLLBACK: 120,
            RecoveryAction.RESTART_SERVICE: 60,
            RecoveryAction.FAILOVER: 180,
            RecoveryAction.ESCALATE: 0,  # Manual intervention time is unknown
            RecoveryAction.IGNORE: 0
        }
        
        return sum(time_estimates.get(action, 60) for action in actions)
    
    async def _verify_recovery_success(self, plan: RecoveryPlan) -> bool:
        """Verify that recovery was successful"""
        try:
            service_name = plan.error_context.service_name
            
            if not self.registry:
                return True  # Can't verify without registry
            
            service = self.registry.get_service(service_name)
            if service and hasattr(service, 'health_check'):
                health = await service.health_check()
                return health.get("status") in ["healthy", "degraded"]
            
            return True  # Assume success if can't check
            
        except Exception as e:
            logger.error(f"Recovery verification failed: {e}")
            return False
    
    async def _execute_rollback_for_context(self, error_context: ErrorContext):
        """Execute rollback for specific error context"""
        # Find the most recent snapshot before the error
        error_time = error_context.timestamp
        
        suitable_snapshot = None
        for snapshot in reversed(self.system_snapshots):
            if snapshot.timestamp < error_time:
                suitable_snapshot = snapshot
                break
        
        if suitable_snapshot:
            await self.rollback_to_snapshot(suitable_snapshot.snapshot_id)
        else:
            logger.warning("No suitable snapshot found for rollback")
    
    async def _trigger_automatic_recovery(self, failing_services: List[str], degraded_services: List[str]):
        """Trigger automatic recovery for system-wide issues"""
        logger.warning(f"Triggering automatic recovery - Failing: {failing_services}, Degraded: {degraded_services}")
        
        # Create recovery plans for each failing service
        for service_name in failing_services:
            error_context = ErrorContext(
                error_id=f"auto_recovery_{service_name}_{datetime.now().timestamp()}",
                service_name=service_name,
                operation="health_check",
                error_type="service_unavailable",
                error_message=f"Service {service_name} failed health check",
                severity=ErrorSeverity.HIGH,
                timestamp=datetime.now(timezone.utc)
            )
            
            await self.handle_error(error_context)
    
    async def _escalate_to_manual_intervention(self, error_context: ErrorContext, additional_info: str) -> RecoveryPlan:
        """Create escalation plan for manual intervention"""
        plan_id = f"escalation_{error_context.error_id}"
        
        recovery_plan = RecoveryPlan(
            plan_id=plan_id,
            error_context=error_context,
            actions=[RecoveryAction.ESCALATE],
            rollback_steps=[],
            estimated_recovery_time=0,
            requires_manual_intervention=True
        )
        
        await self._send_escalation_notification(error_context)
        
        return recovery_plan
    
    # ========================================================================
    # PUBLIC API METHODS
    # ========================================================================
    
    def get_error_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent error history"""
        return [asdict(error) for error in self.error_history[-limit:]]
    
    def get_recovery_plans(self) -> List[Dict[str, Any]]:
        """Get all recovery plans"""
        return [asdict(plan) for plan in self.recovery_plans.values()]
    
    def get_system_snapshots(self) -> List[Dict[str, Any]]:
        """Get all system snapshots"""
        return [asdict(snapshot) for snapshot in self.system_snapshots]
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get current system health status"""
        return {
            "current_state": self.current_system_state.value,
            "is_recovery_active": self.is_recovery_active,
            "total_errors": len(self.error_history),
            "critical_errors": len([e for e in self.error_history if e.severity == ErrorSeverity.CRITICAL]),
            "recent_errors": len([e for e in self.error_history if e.timestamp > datetime.now(timezone.utc) - timedelta(hours=1)]),
            "total_snapshots": len(self.system_snapshots),
            "total_recovery_plans": len(self.recovery_plans),
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Service factory function
async def get_orchestration_recovery(registry=None) -> OrchestrationRecovery:
    """Get or create orchestration recovery instance"""
    recovery = OrchestrationRecovery(registry)
    await recovery.start_monitoring()
    return recovery