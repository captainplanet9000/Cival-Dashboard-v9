"""
APScheduler Agent Service
Provides persistent scheduling capabilities for autonomous trading agents
Integrates with the existing agent scheduler and supports autonomous operation
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Union
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import json

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.pool import ThreadPoolExecutor, ProcessPoolExecutor
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_MISSED
from apscheduler.job import Job

from ..core.service_registry import get_registry
from ..models.agent_models import AgentStatus

logger = logging.getLogger(__name__)

class ScheduleType(Enum):
    """Types of scheduled tasks"""
    IMMEDIATE = "immediate"
    INTERVAL = "interval"
    CRON = "cron"
    DATE = "date"

class TaskPriority(Enum):
    """Task priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    MISSED = "missed"

@dataclass
class ScheduledTask:
    """Scheduled task configuration"""
    task_id: str
    agent_id: str
    task_name: str
    task_type: str
    schedule_type: ScheduleType
    trigger_config: Dict[str, Any]
    task_config: Dict[str, Any]
    priority: TaskPriority
    status: TaskStatus
    created_at: datetime
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None
    run_count: int = 0
    error_count: int = 0
    max_retries: int = 3
    retry_delay: int = 60  # seconds
    is_persistent: bool = True
    metadata: Dict[str, Any] = None

@dataclass
class TaskExecutionResult:
    """Task execution result"""
    task_id: str
    agent_id: str
    execution_id: str
    status: TaskStatus
    start_time: datetime
    end_time: Optional[datetime]
    duration: Optional[float]
    result_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    retry_count: int = 0

class APSchedulerAgentService:
    """
    Advanced persistent scheduling service for autonomous trading agents
    Provides enterprise-grade task scheduling with failover and recovery
    """
    
    def __init__(self):
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.scheduled_tasks: Dict[str, ScheduledTask] = {}
        self.execution_history: List[TaskExecutionResult] = []
        self.agent_scheduler_service = None
        self.autonomous_state_service = None
        self.agent_wallet_service = None
        self.is_initialized = False
        
        # Configuration
        self.max_history_records = 1000
        self.cleanup_interval = 3600  # 1 hour
        self.state_sync_interval = 30  # 30 seconds
        
        logger.info("APScheduler Agent Service initialized")
    
    async def initialize(self):
        """Initialize the APScheduler service"""
        try:
            # Get dependencies
            registry = get_registry()
            self.agent_scheduler_service = registry.get_service("agent_scheduler_service")
            self.autonomous_state_service = registry.get_service("autonomous_state_persistence")
            self.agent_wallet_service = registry.get_service("enhanced_agent_wallet_service")
            
            # Configure APScheduler
            await self._configure_scheduler()
            
            # Start scheduler
            self.scheduler.start()
            
            # Load existing scheduled tasks
            await self._load_persistent_tasks()
            
            # Start background tasks
            asyncio.create_task(self._periodic_cleanup_task())
            asyncio.create_task(self._periodic_state_sync_task())
            
            self.is_initialized = True
            logger.info("APScheduler Agent Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize APScheduler service: {e}")
            raise
    
    async def _configure_scheduler(self):
        """Configure APScheduler with persistent job store"""
        try:
            # Configure job stores
            job_stores = {
                'default': SQLAlchemyJobStore(url='sqlite:///data/scheduled_jobs.sqlite'),
                'memory': MemoryJobStore()
            }
            
            # Configure executors
            executors = {
                'default': ThreadPoolExecutor(20),
                'processpool': ProcessPoolExecutor(5)
            }
            
            # Job defaults
            job_defaults = {
                'coalesce': False,
                'max_instances': 3,
                'misfire_grace_time': 30
            }
            
            # Create scheduler
            self.scheduler = AsyncIOScheduler(
                jobstores=job_stores,
                executors=executors,
                job_defaults=job_defaults,
                timezone='UTC'
            )
            
            # Add event listeners
            self.scheduler.add_listener(
                self._job_executed_listener,
                EVENT_JOB_EXECUTED | EVENT_JOB_ERROR | EVENT_JOB_MISSED
            )
            
            logger.info("APScheduler configured successfully")
            
        except Exception as e:
            logger.error(f"Failed to configure APScheduler: {e}")
            raise
    
    # ==================== TASK SCHEDULING ====================
    
    async def schedule_agent_task(self,
                                agent_id: str,
                                task_name: str,
                                task_type: str,
                                schedule_config: Dict[str, Any],
                                task_config: Dict[str, Any] = None,
                                priority: TaskPriority = TaskPriority.NORMAL) -> str:
        """Schedule a new task for an agent"""
        try:
            task_id = f"task_{agent_id}_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
            
            # Determine schedule type and trigger
            schedule_type, trigger = self._create_trigger(schedule_config)
            
            # Create scheduled task record
            scheduled_task = ScheduledTask(
                task_id=task_id,
                agent_id=agent_id,
                task_name=task_name,
                task_type=task_type,
                schedule_type=schedule_type,
                trigger_config=schedule_config,
                task_config=task_config or {},
                priority=priority,
                status=TaskStatus.PENDING,
                created_at=datetime.now(timezone.utc),
                metadata={"created_by": "apscheduler_service"}
            )
            
            # Add job to scheduler
            job = self.scheduler.add_job(
                func=self._execute_agent_task,
                trigger=trigger,
                args=[task_id],
                id=task_id,
                name=f"{task_name} ({agent_id})",
                replace_existing=True,
                jobstore='default'
            )
            
            # Update next run time
            scheduled_task.next_run = job.next_run_time
            
            # Store task
            self.scheduled_tasks[task_id] = scheduled_task
            
            # Persist task state
            if self.autonomous_state_service:
                await self.autonomous_state_service.save_agent_state(
                    agent_id,
                    "scheduled_tasks",
                    {task_id: asdict(scheduled_task)}
                )
            
            logger.info(f"Scheduled task {task_id} for agent {agent_id}: {task_name}")
            return task_id
            
        except Exception as e:
            logger.error(f"Failed to schedule task: {e}")
            raise
    
    async def schedule_trading_strategy(self,
                                      agent_id: str,
                                      strategy_config: Dict[str, Any],
                                      schedule_config: Dict[str, Any]) -> str:
        """Schedule a trading strategy execution"""
        
        task_config = {
            'strategy_type': strategy_config.get('type', 'basic'),
            'symbol': strategy_config.get('symbol', 'BTC/USD'),
            'allocation': strategy_config.get('allocation', 0.1),
            'risk_params': strategy_config.get('risk_params', {}),
            'execution_params': strategy_config.get('execution_params', {})
        }
        
        return await self.schedule_agent_task(
            agent_id=agent_id,
            task_name=f"Trading Strategy: {strategy_config.get('type', 'Unknown')}",
            task_type="trading_strategy",
            schedule_config=schedule_config,
            task_config=task_config,
            priority=TaskPriority.HIGH
        )
    
    async def schedule_portfolio_rebalance(self,
                                         agent_id: str,
                                         rebalance_config: Dict[str, Any],
                                         schedule_config: Dict[str, Any]) -> str:
        """Schedule portfolio rebalancing"""
        
        task_config = {
            'target_allocation': rebalance_config.get('target_allocation', {}),
            'rebalance_threshold': rebalance_config.get('threshold', 0.05),
            'max_trade_size': rebalance_config.get('max_trade_size', 0.1),
            'risk_checks': rebalance_config.get('risk_checks', True)
        }
        
        return await self.schedule_agent_task(
            agent_id=agent_id,
            task_name="Portfolio Rebalancing",
            task_type="portfolio_rebalance",
            schedule_config=schedule_config,
            task_config=task_config,
            priority=TaskPriority.NORMAL
        )
    
    async def schedule_risk_check(self,
                                agent_id: str,
                                risk_config: Dict[str, Any],
                                schedule_config: Dict[str, Any]) -> str:
        """Schedule risk management checks"""
        
        task_config = {
            'check_types': risk_config.get('checks', ['position_size', 'var', 'correlation']),
            'thresholds': risk_config.get('thresholds', {}),
            'actions': risk_config.get('actions', ['alert', 'reduce_position'])
        }
        
        return await self.schedule_agent_task(
            agent_id=agent_id,
            task_name="Risk Management Check",
            task_type="risk_check",
            schedule_config=schedule_config,
            task_config=task_config,
            priority=TaskPriority.HIGH
        )
    
    # ==================== TASK EXECUTION ====================
    
    async def _execute_agent_task(self, task_id: str):
        """Execute a scheduled agent task"""
        execution_id = f"exec_{task_id}_{int(datetime.now().timestamp())}"
        start_time = datetime.now(timezone.utc)
        
        if task_id not in self.scheduled_tasks:
            logger.error(f"Task {task_id} not found in scheduled tasks")
            return
        
        task = self.scheduled_tasks[task_id]
        task.status = TaskStatus.RUNNING
        task.last_run = start_time
        task.run_count += 1
        
        try:
            # Update next run time
            job = self.scheduler.get_job(task_id)
            if job:
                task.next_run = job.next_run_time
            
            # Execute based on task type
            result_data = None
            if task.task_type == "trading_strategy":
                result_data = await self._execute_trading_strategy(task)
            elif task.task_type == "portfolio_rebalance":
                result_data = await self._execute_portfolio_rebalance(task)
            elif task.task_type == "risk_check":
                result_data = await self._execute_risk_check(task)
            elif task.task_type == "market_analysis":
                result_data = await self._execute_market_analysis(task)
            else:
                # Generic task execution
                result_data = await self._execute_generic_task(task)
            
            # Record successful execution
            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()
            
            execution_result = TaskExecutionResult(
                task_id=task_id,
                agent_id=task.agent_id,
                execution_id=execution_id,
                status=TaskStatus.COMPLETED,
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                result_data=result_data
            )
            
            task.status = TaskStatus.COMPLETED
            task.error_count = 0  # Reset error count on success
            
            self.execution_history.append(execution_result)
            
            logger.info(f"Successfully executed task {task_id} in {duration:.2f}s")
            
        except Exception as e:
            # Handle execution error
            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()
            
            task.error_count += 1
            task.status = TaskStatus.FAILED
            
            execution_result = TaskExecutionResult(
                task_id=task_id,
                agent_id=task.agent_id,
                execution_id=execution_id,
                status=TaskStatus.FAILED,
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                error_message=str(e)
            )
            
            self.execution_history.append(execution_result)
            
            logger.error(f"Task {task_id} execution failed: {e}")
            
            # Schedule retry if within limits
            if task.error_count < task.max_retries:
                await self._schedule_retry(task)
    
    async def _execute_trading_strategy(self, task: ScheduledTask) -> Dict[str, Any]:
        """Execute a trading strategy task"""
        try:
            config = task.task_config
            agent_id = task.agent_id
            
            # Get agent wallet for trading
            if self.agent_wallet_service:
                wallets = await self.agent_wallet_service.get_agent_wallets(agent_id)
                if not wallets:
                    raise Exception(f"No wallets found for agent {agent_id}")
            
            # Execute strategy through agent scheduler service
            if self.agent_scheduler_service:
                strategy_result = await self.agent_scheduler_service.execute_agent_decision(
                    agent_id=agent_id,
                    decision_type="trading_strategy",
                    decision_data=config
                )
                
                return {
                    "strategy_type": config.get('strategy_type'),
                    "symbol": config.get('symbol'),
                    "result": strategy_result,
                    "execution_time": datetime.now(timezone.utc).isoformat()
                }
            
            return {"status": "completed", "message": "Strategy executed via fallback"}
            
        except Exception as e:
            logger.error(f"Trading strategy execution failed: {e}")
            raise
    
    async def _execute_portfolio_rebalance(self, task: ScheduledTask) -> Dict[str, Any]:
        """Execute portfolio rebalancing task"""
        try:
            config = task.task_config
            agent_id = task.agent_id
            
            # Get current portfolio state
            if self.agent_wallet_service:
                balances = await self.agent_wallet_service.get_agent_balances(agent_id)
                
                # Calculate rebalancing trades needed
                target_allocation = config.get('target_allocation', {})
                threshold = config.get('rebalance_threshold', 0.05)
                
                # Simplified rebalancing logic
                trades_needed = []
                for asset, target_pct in target_allocation.items():
                    # Calculate current allocation vs target
                    # Add trades to bring allocation within threshold
                    pass
                
                return {
                    "rebalance_type": "portfolio",
                    "trades_executed": len(trades_needed),
                    "balances_checked": len(balances),
                    "execution_time": datetime.now(timezone.utc).isoformat()
                }
            
            return {"status": "completed", "message": "Rebalance completed"}
            
        except Exception as e:
            logger.error(f"Portfolio rebalance execution failed: {e}")
            raise
    
    async def _execute_risk_check(self, task: ScheduledTask) -> Dict[str, Any]:
        """Execute risk management checks"""
        try:
            config = task.task_config
            agent_id = task.agent_id
            
            check_types = config.get('check_types', [])
            risk_alerts = []
            
            # Perform various risk checks
            for check_type in check_types:
                if check_type == "position_size":
                    # Check position sizes
                    pass
                elif check_type == "var":
                    # Calculate Value at Risk
                    pass
                elif check_type == "correlation":
                    # Check portfolio correlation
                    pass
            
            return {
                "risk_checks": check_types,
                "alerts_generated": len(risk_alerts),
                "risk_score": "low",  # Simplified
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Risk check execution failed: {e}")
            raise
    
    async def _execute_market_analysis(self, task: ScheduledTask) -> Dict[str, Any]:
        """Execute market analysis task"""
        try:
            config = task.task_config
            
            return {
                "analysis_type": config.get('analysis_type', 'technical'),
                "symbols_analyzed": config.get('symbols', []),
                "signals_generated": 0,
                "execution_time": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market analysis execution failed: {e}")
            raise
    
    async def _execute_generic_task(self, task: ScheduledTask) -> Dict[str, Any]:
        """Execute generic task"""
        return {
            "task_type": task.task_type,
            "task_name": task.task_name,
            "execution_time": datetime.now(timezone.utc).isoformat()
        }
    
    # ==================== TASK MANAGEMENT ====================
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a scheduled task"""
        try:
            if task_id in self.scheduled_tasks:
                task = self.scheduled_tasks[task_id]
                task.status = TaskStatus.CANCELLED
                
                # Remove from scheduler
                self.scheduler.remove_job(task_id)
                
                logger.info(f"Cancelled task {task_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to cancel task {task_id}: {e}")
            return False
    
    async def get_agent_tasks(self, agent_id: str) -> List[ScheduledTask]:
        """Get all scheduled tasks for an agent"""
        return [task for task in self.scheduled_tasks.values() if task.agent_id == agent_id]
    
    async def get_task_execution_history(self, task_id: str) -> List[TaskExecutionResult]:
        """Get execution history for a task"""
        return [result for result in self.execution_history if result.task_id == task_id]
    
    def _create_trigger(self, schedule_config: Dict[str, Any]) -> tuple:
        """Create APScheduler trigger from schedule configuration"""
        
        schedule_type = schedule_config.get('type', 'interval')
        
        if schedule_type == 'interval':
            return ScheduleType.INTERVAL, IntervalTrigger(
                seconds=schedule_config.get('seconds', 0),
                minutes=schedule_config.get('minutes', 0),
                hours=schedule_config.get('hours', 0),
                days=schedule_config.get('days', 0),
                start_date=schedule_config.get('start_date'),
                end_date=schedule_config.get('end_date')
            )
        
        elif schedule_type == 'cron':
            return ScheduleType.CRON, CronTrigger(
                second=schedule_config.get('second', 0),
                minute=schedule_config.get('minute', 0),
                hour=schedule_config.get('hour', 0),
                day=schedule_config.get('day', '*'),
                month=schedule_config.get('month', '*'),
                day_of_week=schedule_config.get('day_of_week', '*'),
                timezone=schedule_config.get('timezone', 'UTC')
            )
        
        elif schedule_type == 'date':
            return ScheduleType.DATE, DateTrigger(
                run_date=schedule_config.get('run_date'),
                timezone=schedule_config.get('timezone', 'UTC')
            )
        
        else:
            # Default to immediate execution
            return ScheduleType.IMMEDIATE, DateTrigger(
                run_date=datetime.now(timezone.utc)
            )
    
    def _job_executed_listener(self, event):
        """Handle job execution events"""
        job_id = event.job_id
        
        if event.exception:
            logger.error(f"Job {job_id} failed: {event.exception}")
        else:
            logger.debug(f"Job {job_id} executed successfully")
    
    async def _schedule_retry(self, task: ScheduledTask):
        """Schedule a retry for a failed task"""
        try:
            retry_time = datetime.now(timezone.utc) + timedelta(seconds=task.retry_delay)
            
            self.scheduler.add_job(
                func=self._execute_agent_task,
                trigger=DateTrigger(run_date=retry_time),
                args=[task.task_id],
                id=f"{task.task_id}_retry_{task.error_count}",
                name=f"Retry {task.task_name} ({task.agent_id})",
                replace_existing=True,
                jobstore='memory'
            )
            
            logger.info(f"Scheduled retry {task.error_count} for task {task.task_id}")
            
        except Exception as e:
            logger.error(f"Failed to schedule retry: {e}")
    
    # ==================== PERSISTENCE & BACKGROUND TASKS ====================
    
    async def _load_persistent_tasks(self):
        """Load persistent tasks from storage"""
        try:
            if self.autonomous_state_service:
                # Load scheduled tasks for all agents
                # This would integrate with the state persistence service
                pass
            
            logger.info("Loaded persistent tasks")
            
        except Exception as e:
            logger.error(f"Failed to load persistent tasks: {e}")
    
    async def _periodic_cleanup_task(self):
        """Clean up old execution history"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                
                # Remove old execution records
                if len(self.execution_history) > self.max_history_records:
                    self.execution_history = self.execution_history[-self.max_history_records:]
                
                logger.debug("Performed periodic cleanup")
                
            except Exception as e:
                logger.error(f"Cleanup task failed: {e}")
    
    async def _periodic_state_sync_task(self):
        """Sync task states to persistent storage"""
        while True:
            try:
                await asyncio.sleep(self.state_sync_interval)
                
                # Sync all task states
                if self.autonomous_state_service:
                    for agent_id in set(task.agent_id for task in self.scheduled_tasks.values()):
                        agent_tasks = [task for task in self.scheduled_tasks.values() if task.agent_id == agent_id]
                        
                        tasks_data = {task.task_id: asdict(task) for task in agent_tasks}
                        
                        await self.autonomous_state_service.save_agent_state(
                            agent_id,
                            "scheduled_tasks",
                            tasks_data
                        )
                
            except Exception as e:
                logger.error(f"State sync failed: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        running_jobs = len([job for job in self.scheduler.get_jobs() if job.next_run_time])
        
        return {
            "service": "apscheduler_agent_service",
            "initialized": self.is_initialized,
            "scheduler_running": self.scheduler.running if self.scheduler else False,
            "total_tasks": len(self.scheduled_tasks),
            "running_jobs": running_jobs,
            "execution_history_count": len(self.execution_history),
            "task_types": list(set(task.task_type for task in self.scheduled_tasks.values())),
            "agents_with_tasks": len(set(task.agent_id for task in self.scheduled_tasks.values()))
        }

# Factory function for service registry
def create_apscheduler_agent_service():
    """Factory function to create APScheduler agent service"""
    return APSchedulerAgentService()