#!/usr/bin/env python3
"""
Orchestration Background Task Scheduler
Handles automated orchestration tasks like performance attribution, capital rebalancing, 
agent reassignment, and event cleanup on scheduled intervals.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger(__name__)

class TaskPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class ScheduledTask:
    task_id: str
    name: str
    function: Callable
    interval_seconds: int
    priority: TaskPriority
    description: str
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING
    error_count: int = 0
    max_retries: int = 3
    is_active: bool = True
    execution_time_avg: float = 0.0
    success_count: int = 0
    total_runs: int = 0

class OrchestrationScheduler:
    """
    Background task scheduler for orchestration system operations
    """
    
    def __init__(self, registry=None):
        self.registry = registry
        self.tasks: Dict[str, ScheduledTask] = {}
        self.is_running = False
        self.scheduler_task = None
        self.task_queue = asyncio.Queue()
        self.worker_tasks: List[asyncio.Task] = []
        self.max_workers = 3
        self.shutdown_event = asyncio.Event()
        
        # Initialize default tasks
        self._setup_default_tasks()
    
    def _setup_default_tasks(self):
        """Setup default orchestration tasks"""
        default_tasks = [
            {
                "task_id": "performance_attribution_5m",
                "name": "Performance Attribution Calculation",
                "function": self.run_performance_attribution,
                "interval_seconds": 300,  # 5 minutes
                "priority": TaskPriority.HIGH,
                "description": "Calculate multi-level performance attribution for agents, farms, and goals"
            },
            {
                "task_id": "capital_rebalancing_1h",
                "name": "Capital Rebalancing",
                "function": self.run_capital_rebalancing,
                "interval_seconds": 3600,  # 1 hour
                "priority": TaskPriority.MEDIUM,
                "description": "Rebalance capital allocation across farms and agents based on performance"
            },
            {
                "task_id": "agent_reassignment_30m",
                "name": "Agent Reassignment Evaluation",
                "function": self.run_agent_reassignment,
                "interval_seconds": 1800,  # 30 minutes
                "priority": TaskPriority.MEDIUM,
                "description": "Evaluate and execute agent reassignments based on performance metrics"
            },
            {
                "task_id": "event_cleanup_daily",
                "name": "Event System Cleanup",
                "function": self.run_event_cleanup,
                "interval_seconds": 86400,  # 24 hours
                "priority": TaskPriority.LOW,
                "description": "Clean up old events and maintain event system health"
            },
            {
                "task_id": "risk_assessment_15m",
                "name": "Risk Assessment",
                "function": self.run_risk_assessment,
                "interval_seconds": 900,  # 15 minutes
                "priority": TaskPriority.HIGH,
                "description": "Comprehensive risk assessment across portfolio, farms, and agents"
            },
            {
                "task_id": "market_data_sync_1m",
                "name": "Market Data Synchronization",
                "function": self.run_market_data_sync,
                "interval_seconds": 60,  # 1 minute
                "priority": TaskPriority.CRITICAL,
                "description": "Synchronize market data and update agent strategies"
            },
            {
                "task_id": "health_monitoring_2m",
                "name": "System Health Monitoring",
                "function": self.run_health_monitoring,
                "interval_seconds": 120,  # 2 minutes
                "priority": TaskPriority.HIGH,
                "description": "Monitor system health and detect issues across orchestration services"
            },
            {
                "task_id": "backup_operation_6h",
                "name": "Data Backup Operation",
                "function": self.run_backup_operation,
                "interval_seconds": 21600,  # 6 hours
                "priority": TaskPriority.MEDIUM,
                "description": "Backup critical orchestration data and state"
            }
        ]
        
        for task_config in default_tasks:
            task = ScheduledTask(**task_config)
            task.next_run = datetime.now(timezone.utc) + timedelta(seconds=task.interval_seconds)
            self.tasks[task.task_id] = task
            logger.info(f"Registered task: {task.name} (every {task.interval_seconds}s)")
    
    async def start(self):
        """Start the background scheduler"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        self.is_running = True
        self.shutdown_event.clear()
        
        logger.info(f"Starting orchestration scheduler with {len(self.tasks)} tasks")
        
        # Start worker tasks
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.worker_tasks.append(worker)
        
        # Start main scheduler task
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        
        logger.info("Orchestration scheduler started successfully")
    
    async def stop(self):
        """Stop the background scheduler"""
        if not self.is_running:
            return
        
        logger.info("Stopping orchestration scheduler...")
        
        self.is_running = False
        self.shutdown_event.set()
        
        # Cancel scheduler task
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
        
        # Cancel worker tasks
        for worker in self.worker_tasks:
            worker.cancel()
        
        if self.worker_tasks:
            await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        
        self.worker_tasks.clear()
        
        logger.info("Orchestration scheduler stopped")
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        try:
            while self.is_running and not self.shutdown_event.is_set():
                current_time = datetime.now(timezone.utc)
                
                # Check which tasks need to run
                for task_id, task in self.tasks.items():
                    if not task.is_active:
                        continue
                    
                    if task.next_run and current_time >= task.next_run:
                        # Schedule task for execution
                        await self.task_queue.put((task.priority.value, task_id))
                        logger.debug(f"Scheduled task: {task.name}")
                
                # Wait before next check (check every 10 seconds)
                try:
                    await asyncio.wait_for(self.shutdown_event.wait(), timeout=10.0)
                    break
                except asyncio.TimeoutError:
                    continue
                    
        except Exception as e:
            logger.error(f"Scheduler loop error: {e}")
            raise
    
    async def _worker(self, worker_name: str):
        """Worker task to execute scheduled tasks"""
        try:
            while self.is_running and not self.shutdown_event.is_set():
                try:
                    # Get task from queue (priority, task_id)
                    priority, task_id = await asyncio.wait_for(
                        self.task_queue.get(), timeout=1.0
                    )
                    
                    task = self.tasks.get(task_id)
                    if not task or not task.is_active:
                        continue
                    
                    # Execute task
                    await self._execute_task(task, worker_name)
                    
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Worker {worker_name} error: {e}")
                    
        except Exception as e:
            logger.error(f"Worker {worker_name} failed: {e}")
    
    async def _execute_task(self, task: ScheduledTask, worker_name: str):
        """Execute a single task"""
        start_time = datetime.now(timezone.utc)
        
        try:
            task.status = TaskStatus.RUNNING
            task.total_runs += 1
            
            logger.info(f"[{worker_name}] Executing task: {task.name}")
            
            # Execute the task function
            result = await task.function()
            
            # Update task statistics
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            task.execution_time_avg = (
                (task.execution_time_avg * task.success_count + execution_time) / 
                (task.success_count + 1)
            )
            
            task.status = TaskStatus.COMPLETED
            task.success_count += 1
            task.error_count = 0  # Reset error count on success
            task.last_run = start_time
            task.next_run = start_time + timedelta(seconds=task.interval_seconds)
            
            logger.info(f"[{worker_name}] Task completed: {task.name} (took {execution_time:.2f}s)")
            
            # Emit task completion event
            await self._emit_task_event("task_completed", task, result)
            
        except Exception as e:
            # Handle task failure
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            
            task.status = TaskStatus.FAILED
            task.error_count += 1
            
            logger.error(f"[{worker_name}] Task failed: {task.name} - {str(e)} (took {execution_time:.2f}s)")
            
            # Decide whether to retry or disable task
            if task.error_count >= task.max_retries:
                task.is_active = False
                logger.error(f"Task disabled after {task.max_retries} failures: {task.name}")
                await self._emit_task_event("task_disabled", task, {"error": str(e)})
            else:
                # Schedule retry with exponential backoff
                retry_delay = min(300, 60 * (2 ** task.error_count))  # Max 5 minutes
                task.next_run = datetime.now(timezone.utc) + timedelta(seconds=retry_delay)
                logger.info(f"Task retry scheduled in {retry_delay}s: {task.name}")
                await self._emit_task_event("task_retry_scheduled", task, {"retry_in": retry_delay})
    
    async def _emit_task_event(self, event_type: str, task: ScheduledTask, data: Any):
        """Emit task-related events"""
        try:
            event_propagation = self.registry.get_service("enhanced_event_propagation") if self.registry else None
            
            if event_propagation:
                await event_propagation.publish_event(
                    event_type=event_type,
                    data={
                        "task_id": task.task_id,
                        "task_name": task.name,
                        "status": task.status.value,
                        "execution_data": data,
                        "stats": {
                            "success_count": task.success_count,
                            "error_count": task.error_count,
                            "avg_execution_time": task.execution_time_avg,
                            "total_runs": task.total_runs
                        }
                    },
                    source_service="orchestration_scheduler",
                    priority="medium"
                )
        except Exception as e:
            logger.error(f"Failed to emit task event: {e}")
    
    # ========================================================================
    # TASK IMPLEMENTATIONS
    # ========================================================================
    
    async def run_performance_attribution(self) -> Dict[str, Any]:
        """Calculate performance attribution across all levels"""
        try:
            attribution_engine = self.registry.get_service("performance_attribution_engine") if self.registry else None
            
            if not attribution_engine:
                return {"status": "skipped", "reason": "Attribution engine not available"}
            
            # Calculate attribution for all active agents
            agent_attributions = await attribution_engine.calculate_all_agent_attributions()
            
            # Calculate farm-level attributions
            farm_attributions = await attribution_engine.calculate_all_farm_attributions()
            
            # Calculate goal-level attributions
            goal_attributions = await attribution_engine.calculate_all_goal_attributions()
            
            return {
                "status": "completed",
                "attributions_calculated": {
                    "agents": len(agent_attributions),
                    "farms": len(farm_attributions),
                    "goals": len(goal_attributions)
                },
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Performance attribution task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_capital_rebalancing(self) -> Dict[str, Any]:
        """Perform capital rebalancing across the system"""
        try:
            capital_manager = self.registry.get_service("goal_capital_manager") if self.registry else None
            
            if not capital_manager:
                return {"status": "skipped", "reason": "Capital manager not available"}
            
            # Analyze current allocations
            current_allocations = await capital_manager.get_all_allocations()
            
            # Perform rebalancing based on performance
            rebalance_result = await capital_manager.rebalance_all_allocations({
                "strategy": "performance_weighted",
                "rebalance_threshold": 0.1
            })
            
            return {
                "status": "completed",
                "rebalance_result": rebalance_result,
                "allocations_before": len(current_allocations),
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Capital rebalancing task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_agent_reassignment(self) -> Dict[str, Any]:
        """Evaluate and perform agent reassignments"""
        try:
            orchestrator = self.registry.get_service("farm_agent_orchestrator") if self.registry else None
            
            if not orchestrator:
                return {"status": "skipped", "reason": "Farm orchestrator not available"}
            
            # Get current assignments
            current_assignments = await orchestrator.get_all_assignments()
            
            # Evaluate reassignment opportunities
            reassignment_opportunities = await orchestrator.evaluate_reassignment_opportunities()
            
            # Execute reassignments
            reassignments_executed = 0
            for opportunity in reassignment_opportunities:
                try:
                    await orchestrator.execute_reassignment(opportunity)
                    reassignments_executed += 1
                except Exception as e:
                    logger.error(f"Failed to execute reassignment: {e}")
            
            return {
                "status": "completed",
                "current_assignments": len(current_assignments),
                "opportunities_found": len(reassignment_opportunities),
                "reassignments_executed": reassignments_executed,
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Agent reassignment task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_event_cleanup(self) -> Dict[str, Any]:
        """Clean up old events and maintain event system health"""
        try:
            event_propagation = self.registry.get_service("enhanced_event_propagation") if self.registry else None
            
            if not event_propagation:
                return {"status": "skipped", "reason": "Event propagation not available"}
            
            # Clean up events older than 7 days
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            # Clean up delivered events
            delivered_cleaned = await event_propagation.cleanup_delivered_events(cutoff_date)
            
            # Clean up failed events older than 24 hours
            failed_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            failed_cleaned = await event_propagation.cleanup_failed_events(failed_cutoff)
            
            # Clean up inactive subscriptions
            inactive_cleaned = await event_propagation.cleanup_inactive_subscriptions()
            
            return {
                "status": "completed",
                "events_cleaned": {
                    "delivered": delivered_cleaned,
                    "failed": failed_cleaned,
                    "inactive_subscriptions": inactive_cleaned
                },
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Event cleanup task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_risk_assessment(self) -> Dict[str, Any]:
        """Perform comprehensive risk assessment"""
        try:
            # Mock risk assessment for now
            return {
                "status": "completed",
                "risk_metrics": {
                    "portfolio_var": 0.05,
                    "max_drawdown": 0.08,
                    "concentration_risk": "medium",
                    "correlation_risk": "low"
                },
                "alerts_generated": 0,
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Risk assessment task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_market_data_sync(self) -> Dict[str, Any]:
        """Synchronize market data and update strategies"""
        try:
            # Mock market data sync for now
            return {
                "status": "completed",
                "symbols_updated": 15,
                "strategies_updated": 8,
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market data sync task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_health_monitoring(self) -> Dict[str, Any]:
        """Monitor system health across orchestration services"""
        try:
            health_data = {
                "services_checked": 0,
                "services_healthy": 0,
                "services_degraded": 0,
                "services_failed": 0
            }
            
            if self.registry:
                # Check all registered services
                services = self.registry.get_all_services()
                health_data["services_checked"] = len(services)
                
                for service_name, service in services.items():
                    try:
                        # Basic health check - service exists and is callable
                        if hasattr(service, 'health_check'):
                            health_result = await service.health_check()
                            if health_result.get("status") == "healthy":
                                health_data["services_healthy"] += 1
                            else:
                                health_data["services_degraded"] += 1
                        else:
                            health_data["services_healthy"] += 1
                    except Exception:
                        health_data["services_failed"] += 1
            
            return {
                "status": "completed",
                "health_data": health_data,
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health monitoring task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def run_backup_operation(self) -> Dict[str, Any]:
        """Backup critical orchestration data"""
        try:
            # Mock backup operation for now
            return {
                "status": "completed",
                "backup_size_mb": 125.5,
                "files_backed_up": 8,
                "backup_location": "/tmp/orchestration_backup",
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Backup operation task failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    # ========================================================================
    # MANAGEMENT METHODS
    # ========================================================================
    
    def add_task(self, task: ScheduledTask):
        """Add a new scheduled task"""
        self.tasks[task.task_id] = task
        logger.info(f"Added task: {task.name}")
    
    def remove_task(self, task_id: str):
        """Remove a scheduled task"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info(f"Removed task: {task_id}")
    
    def pause_task(self, task_id: str):
        """Pause a scheduled task"""
        if task_id in self.tasks:
            self.tasks[task_id].is_active = False
            logger.info(f"Paused task: {task_id}")
    
    def resume_task(self, task_id: str):
        """Resume a paused task"""
        if task_id in self.tasks:
            self.tasks[task_id].is_active = True
            self.tasks[task_id].error_count = 0  # Reset error count
            logger.info(f"Resumed task: {task_id}")
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific task"""
        task = self.tasks.get(task_id)
        if not task:
            return None
        
        return {
            "task_id": task.task_id,
            "name": task.name,
            "status": task.status.value,
            "is_active": task.is_active,
            "interval_seconds": task.interval_seconds,
            "last_run": task.last_run.isoformat() if task.last_run else None,
            "next_run": task.next_run.isoformat() if task.next_run else None,
            "success_count": task.success_count,
            "error_count": task.error_count,
            "total_runs": task.total_runs,
            "avg_execution_time": task.execution_time_avg,
            "priority": task.priority.name
        }
    
    def get_all_tasks_status(self) -> Dict[str, Any]:
        """Get status of all tasks"""
        return {
            "scheduler_running": self.is_running,
            "total_tasks": len(self.tasks),
            "active_tasks": len([t for t in self.tasks.values() if t.is_active]),
            "failed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED]),
            "tasks": {task_id: self.get_task_status(task_id) for task_id in self.tasks.keys()}
        }

# Service factory function
async def get_orchestration_scheduler(registry=None) -> OrchestrationScheduler:
    """Get or create orchestration scheduler instance"""
    scheduler = OrchestrationScheduler(registry)
    return scheduler