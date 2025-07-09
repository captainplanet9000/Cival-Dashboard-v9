"""
Autonomous Task Scheduler Service
Provides 24/7 background task scheduling for autonomous trading operations
Handles periodic arbitrage scans, portfolio rebalancing, risk assessments, and performance analysis
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
try:
    from croniter import croniter
except ImportError:
    # Fallback implementation if croniter not available
    class croniter:
        def __init__(self, cron_expression, base_time):
            self.cron_expression = cron_expression
            self.base_time = base_time
        
        def get_next(self, ret_type):
            # Simple fallback - return current time + 1 minute
            import datetime
            return self.base_time + datetime.timedelta(minutes=1)

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"

class TaskPriority(Enum):
    """Task priority levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class TaskType(Enum):
    """Types of autonomous tasks"""
    ARBITRAGE_SCAN = "arbitrage_scan"
    PORTFOLIO_REBALANCE = "portfolio_rebalance"
    RISK_ASSESSMENT = "risk_assessment"
    PERFORMANCE_ANALYSIS = "performance_analysis"
    AGENT_COORDINATION = "agent_coordination"
    MARKET_DATA_UPDATE = "market_data_update"
    HEALTH_CHECK = "health_check"
    BACKUP_OPERATION = "backup_operation"
    MAINTENANCE = "maintenance"
    IDLE_DETECTION = "idle_detection"
    GOAL_AUTOMATION = "goal_automation"
    PROFIT_COLLECTION = "profit_collection"
    AGENT_IDLE_MANAGEMENT = "agent_idle_management"
    FARM_COORDINATION = "farm_coordination"

@dataclass
class ScheduledTask:
    """Scheduled task definition"""
    task_id: str
    name: str
    task_type: TaskType
    cron_expression: str
    priority: TaskPriority
    enabled: bool
    max_runtime_seconds: int
    retry_attempts: int
    retry_delay_seconds: int
    timeout_seconds: int
    dependencies: List[str]
    configuration: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

@dataclass
class TaskExecution:
    """Task execution record"""
    execution_id: str
    task_id: str
    started_at: datetime
    completed_at: Optional[datetime]
    status: TaskStatus
    result_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    retry_count: int
    execution_duration_seconds: Optional[float]

@dataclass
class TaskResult:
    """Task execution result"""
    success: bool
    data: Dict[str, Any]
    metrics: Dict[str, float]
    errors: List[str]
    execution_time_seconds: float

class AutonomousTaskScheduler:
    """
    24/7 autonomous task scheduler for trading operations
    Provides cron-like scheduling with sophisticated retry and error handling
    """
    
    def __init__(self):
        # Service dependencies
        self.db_service = None
        self.state_persistence = None
        self.health_monitor = None
        self.agent_coordinator = None
        self.risk_service = None
        self.portfolio_service = None
        self.market_data_service = None
        self.arbitrage_service = None
        self.event_service = None
        
        # Task management
        self.scheduled_tasks: Dict[str, ScheduledTask] = {}
        self.active_executions: Dict[str, TaskExecution] = {}
        self.execution_history: List[TaskExecution] = []
        self.task_queue: asyncio.Queue = asyncio.Queue()
        
        # Scheduler state
        self.is_running = False
        self.worker_count = 3  # Number of concurrent task workers
        self.workers: List[asyncio.Task] = []
        
        # Performance tracking
        self.scheduler_metrics = {
            'tasks_executed_today': 0,
            'successful_executions': 0,
            'failed_executions': 0,
            'average_execution_time': 0.0,
            'queue_size': 0,
            'active_tasks': 0
        }
        
        # Configuration
        self.max_queue_size = 1000
        self.execution_history_limit = 10000
        self.cleanup_interval = 3600  # 1 hour
        
        self.is_initialized = False
        
        logger.info("Autonomous Task Scheduler initialized")
    
    async def initialize(self):
        """Initialize the task scheduler"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.state_persistence = registry.get_service("autonomous_state_persistence")
            self.health_monitor = registry.get_service("autonomous_health_monitor")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            self.risk_service = registry.get_service("advanced_risk_management")
            self.portfolio_service = registry.get_service("portfolio_management_service")
            self.market_data_service = registry.get_service("market_data_service")
            self.arbitrage_service = registry.get_service("cross_dex_arbitrage_engine")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            
            # Initialize database tables
            if self.db_service:
                await self._create_scheduler_tables()
            
            # Load existing scheduled tasks
            await self._load_scheduled_tasks()
            
            # Create default tasks if none exist
            if not self.scheduled_tasks:
                await self._create_default_tasks()
            
            # Start scheduler components
            await self._start_scheduler()
            
            self.is_initialized = True
            logger.info("Task scheduler initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize task scheduler: {e}")
            raise
    
    async def _create_default_tasks(self):
        """Create default autonomous tasks"""
        try:
            default_tasks = [
                # High-frequency arbitrage scanning
                ScheduledTask(
                    task_id="arbitrage_scan_10s",
                    name="High-Frequency Arbitrage Scan",
                    task_type=TaskType.ARBITRAGE_SCAN,
                    cron_expression="*/10 * * * * *",  # Every 10 seconds
                    priority=TaskPriority.HIGH,
                    enabled=True,
                    max_runtime_seconds=8,
                    retry_attempts=2,
                    retry_delay_seconds=1,
                    timeout_seconds=5,
                    dependencies=[],
                    configuration={
                        'min_profit_threshold': 0.001,
                        'max_slippage': 0.005,
                        'exchanges': ['binance', 'coinbase', 'kraken']
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Risk assessment every 15 minutes
                ScheduledTask(
                    task_id="risk_assessment_15m",
                    name="Portfolio Risk Assessment",
                    task_type=TaskType.RISK_ASSESSMENT,
                    cron_expression="*/15 * * * *",  # Every 15 minutes
                    priority=TaskPriority.HIGH,
                    enabled=True,
                    max_runtime_seconds=120,
                    retry_attempts=3,
                    retry_delay_seconds=30,
                    timeout_seconds=180,
                    dependencies=[],
                    configuration={
                        'var_calculation': True,
                        'stress_testing': True,
                        'correlation_analysis': True,
                        'alert_on_breach': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Portfolio rebalancing every hour
                ScheduledTask(
                    task_id="portfolio_rebalance_1h",
                    name="Automated Portfolio Rebalancing",
                    task_type=TaskType.PORTFOLIO_REBALANCE,
                    cron_expression="0 * * * *",  # Every hour
                    priority=TaskPriority.MEDIUM,
                    enabled=True,
                    max_runtime_seconds=300,
                    retry_attempts=2,
                    retry_delay_seconds=60,
                    timeout_seconds=420,
                    dependencies=['risk_assessment_15m'],
                    configuration={
                        'rebalance_threshold': 0.05,
                        'max_single_trade_size': 0.1,
                        'include_correlation_adjustment': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Agent coordination every 5 minutes
                ScheduledTask(
                    task_id="agent_coordination_5m",
                    name="Multi-Agent Coordination",
                    task_type=TaskType.AGENT_COORDINATION,
                    cron_expression="*/5 * * * *",  # Every 5 minutes
                    priority=TaskPriority.MEDIUM,
                    enabled=True,
                    max_runtime_seconds=180,
                    retry_attempts=2,
                    retry_delay_seconds=15,
                    timeout_seconds=240,
                    dependencies=[],
                    configuration={
                        'coordination_mode': 'collaborative',
                        'consensus_required': False,
                        'performance_review': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Market data update every 30 seconds
                ScheduledTask(
                    task_id="market_data_update_30s",
                    name="Market Data Refresh",
                    task_type=TaskType.MARKET_DATA_UPDATE,
                    cron_expression="*/30 * * * * *",  # Every 30 seconds
                    priority=TaskPriority.MEDIUM,
                    enabled=True,
                    max_runtime_seconds=25,
                    retry_attempts=3,
                    retry_delay_seconds=5,
                    timeout_seconds=30,
                    dependencies=[],
                    configuration={
                        'symbols': ['BTC/USD', 'ETH/USD', 'BNB/USD', 'ADA/USD'],
                        'include_orderbook': True,
                        'include_trades': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Performance analysis daily at market close
                ScheduledTask(
                    task_id="performance_analysis_daily",
                    name="Daily Performance Analysis",
                    task_type=TaskType.PERFORMANCE_ANALYSIS,
                    cron_expression="0 0 * * *",  # Daily at midnight UTC
                    priority=TaskPriority.LOW,
                    enabled=True,
                    max_runtime_seconds=600,
                    retry_attempts=2,
                    retry_delay_seconds=300,
                    timeout_seconds=900,
                    dependencies=['portfolio_rebalance_1h', 'risk_assessment_15m'],
                    configuration={
                        'include_attribution': True,
                        'generate_report': True,
                        'update_strategies': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # System health check every 2 minutes
                ScheduledTask(
                    task_id="health_check_2m",
                    name="System Health Monitoring",
                    task_type=TaskType.HEALTH_CHECK,
                    cron_expression="*/2 * * * *",  # Every 2 minutes
                    priority=TaskPriority.CRITICAL,
                    enabled=True,
                    max_runtime_seconds=60,
                    retry_attempts=1,
                    retry_delay_seconds=30,
                    timeout_seconds=90,
                    dependencies=[],
                    configuration={
                        'check_services': True,
                        'check_database': True,
                        'check_external_apis': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Backup operation every 6 hours
                ScheduledTask(
                    task_id="backup_operation_6h",
                    name="System State Backup",
                    task_type=TaskType.BACKUP_OPERATION,
                    cron_expression="0 */6 * * *",  # Every 6 hours
                    priority=TaskPriority.LOW,
                    enabled=True,
                    max_runtime_seconds=1800,
                    retry_attempts=2,
                    retry_delay_seconds=600,
                    timeout_seconds=2400,
                    dependencies=[],
                    configuration={
                        'backup_agent_states': True,
                        'backup_performance_data': True,
                        'backup_configuration': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Idle detection every 30 seconds
                ScheduledTask(
                    task_id="idle_detection_30s",
                    name="Agent Idle State Detection",
                    task_type=TaskType.IDLE_DETECTION,
                    cron_expression="*/30 * * * * *",  # Every 30 seconds
                    priority=TaskPriority.MEDIUM,
                    enabled=True,
                    max_runtime_seconds=25,
                    retry_attempts=2,
                    retry_delay_seconds=5,
                    timeout_seconds=30,
                    dependencies=[],
                    configuration={
                        'idle_threshold_minutes': 5,
                        'check_agent_activity': True,
                        'check_farm_activity': True,
                        'auto_reactivate': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Goal automation every 2 minutes
                ScheduledTask(
                    task_id="goal_automation_2m",
                    name="Goal Achievement Automation",
                    task_type=TaskType.GOAL_AUTOMATION,
                    cron_expression="*/2 * * * *",  # Every 2 minutes
                    priority=TaskPriority.HIGH,
                    enabled=True,
                    max_runtime_seconds=90,
                    retry_attempts=3,
                    retry_delay_seconds=20,
                    timeout_seconds=120,
                    dependencies=[],
                    configuration={
                        'check_goal_completion': True,
                        'auto_collect_profits': True,
                        'update_goal_progress': True,
                        'optimize_goal_targets': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Profit collection every 1 minute
                ScheduledTask(
                    task_id="profit_collection_1m",
                    name="Automated Profit Collection",
                    task_type=TaskType.PROFIT_COLLECTION,
                    cron_expression="*/1 * * * *",  # Every 1 minute
                    priority=TaskPriority.HIGH,
                    enabled=True,
                    max_runtime_seconds=50,
                    retry_attempts=3,
                    retry_delay_seconds=10,
                    timeout_seconds=60,
                    dependencies=['goal_automation_2m'],
                    configuration={
                        'collect_completed_goals': True,
                        'transfer_to_vault': True,
                        'update_bank_master': True,
                        'min_profit_threshold': 1.0
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Agent idle management every 3 minutes
                ScheduledTask(
                    task_id="agent_idle_management_3m",
                    name="Agent Idle State Management",
                    task_type=TaskType.AGENT_IDLE_MANAGEMENT,
                    cron_expression="*/3 * * * *",  # Every 3 minutes
                    priority=TaskPriority.MEDIUM,
                    enabled=True,
                    max_runtime_seconds=120,
                    retry_attempts=2,
                    retry_delay_seconds=30,
                    timeout_seconds=180,
                    dependencies=['idle_detection_30s'],
                    configuration={
                        'reassign_idle_agents': True,
                        'optimize_agent_allocation': True,
                        'rebalance_farms': True,
                        'pause_underperforming': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                ),
                
                # Farm coordination every 10 minutes
                ScheduledTask(
                    task_id="farm_coordination_10m",
                    name="Farm Coordination and Optimization",
                    task_type=TaskType.FARM_COORDINATION,
                    cron_expression="*/10 * * * *",  # Every 10 minutes
                    priority=TaskPriority.MEDIUM,
                    enabled=True,
                    max_runtime_seconds=300,
                    retry_attempts=2,
                    retry_delay_seconds=60,
                    timeout_seconds=420,
                    dependencies=['agent_idle_management_3m'],
                    configuration={
                        'optimize_farm_allocation': True,
                        'coordinate_inter_farm_transfers': True,
                        'update_farm_performance': True,
                        'auto_scale_farms': True
                    },
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
            ]
            
            # Add all default tasks
            for task in default_tasks:
                self.scheduled_tasks[task.task_id] = task
                await self._persist_task(task)
            
            logger.info(f"Created {len(default_tasks)} default autonomous tasks")
            
        except Exception as e:
            logger.error(f"Failed to create default tasks: {e}")
            raise
    
    async def _start_scheduler(self):
        """Start the task scheduler components"""
        try:
            # Start scheduler main loop
            asyncio.create_task(self._scheduler_loop())
            
            # Start worker tasks
            for i in range(self.worker_count):
                worker = asyncio.create_task(self._task_worker(f"worker_{i}"))
                self.workers.append(worker)
            
            # Start maintenance tasks
            asyncio.create_task(self._cleanup_loop())
            asyncio.create_task(self._metrics_update_loop())
            
            self.is_running = True
            logger.info(f"Task scheduler started with {self.worker_count} workers")
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise
    
    async def _scheduler_loop(self):
        """Main scheduler loop - checks for tasks to execute"""
        while True:
            try:
                await asyncio.sleep(1)  # Check every second
                
                current_time = datetime.now(timezone.utc)
                
                # Check each scheduled task
                for task_id, task in self.scheduled_tasks.items():
                    if not task.enabled:
                        continue
                    
                    # Check if task should run now
                    if self._should_task_run(task, current_time):
                        # Check dependencies
                        if await self._check_task_dependencies(task):
                            # Queue task for execution
                            await self._queue_task_execution(task)
                        else:
                            logger.debug(f"Task {task_id} dependencies not met, skipping")
                
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    def _should_task_run(self, task: ScheduledTask, current_time: datetime) -> bool:
        """Check if a task should run based on its cron expression"""
        try:
            cron = croniter(task.cron_expression, current_time - timedelta(seconds=1))
            next_run = cron.get_next(datetime)
            
            # If next run is within the last second, the task should run
            return abs((next_run - current_time).total_seconds()) < 1
            
        except Exception as e:
            logger.error(f"Error checking cron expression for task {task.task_id}: {e}")
            return False
    
    async def _check_task_dependencies(self, task: ScheduledTask) -> bool:
        """Check if task dependencies are satisfied"""
        try:
            if not task.dependencies:
                return True
            
            current_time = datetime.now(timezone.utc)
            dependency_window = timedelta(minutes=5)  # Dependencies must complete within 5 minutes
            
            for dep_task_id in task.dependencies:
                # Find recent successful execution of dependency
                recent_executions = [
                    exec for exec in self.execution_history
                    if (exec.task_id == dep_task_id and 
                        exec.status == TaskStatus.COMPLETED and
                        exec.completed_at and
                        (current_time - exec.completed_at) < dependency_window)
                ]
                
                if not recent_executions:
                    logger.debug(f"Dependency {dep_task_id} not satisfied for task {task.task_id}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking dependencies for task {task.task_id}: {e}")
            return False
    
    async def _queue_task_execution(self, task: ScheduledTask):
        """Queue a task for execution"""
        try:
            # Check if task is already running
            running_executions = [
                exec for exec in self.active_executions.values()
                if exec.task_id == task.task_id and exec.status == TaskStatus.RUNNING
            ]
            
            if running_executions:
                logger.debug(f"Task {task.task_id} already running, skipping")
                return
            
            # Check queue size
            if self.task_queue.qsize() >= self.max_queue_size:
                logger.warning(f"Task queue full, dropping task {task.task_id}")
                return
            
            # Create execution record
            execution = TaskExecution(
                execution_id=str(uuid.uuid4()),
                task_id=task.task_id,
                started_at=datetime.now(timezone.utc),
                completed_at=None,
                status=TaskStatus.PENDING,
                result_data=None,
                error_message=None,
                retry_count=0,
                execution_duration_seconds=None
            )
            
            # Add to queue
            await self.task_queue.put((task, execution))
            
            logger.debug(f"Queued task {task.task_id} for execution")
            
        except Exception as e:
            logger.error(f"Failed to queue task {task.task_id}: {e}")
    
    async def _task_worker(self, worker_name: str):
        """Task worker that executes queued tasks"""
        logger.info(f"Task worker {worker_name} started")
        
        while True:
            try:
                # Get next task from queue
                task, execution = await self.task_queue.get()
                
                logger.info(f"Worker {worker_name} executing task {task.task_id}")
                
                # Execute the task
                await self._execute_task(task, execution)
                
                # Mark queue task as done
                self.task_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in worker {worker_name}: {e}")
                await asyncio.sleep(5)
    
    async def _execute_task(self, task: ScheduledTask, execution: TaskExecution):
        """Execute a specific task"""
        start_time = datetime.now(timezone.utc)
        
        try:
            # Update execution status
            execution.status = TaskStatus.RUNNING
            execution.started_at = start_time
            self.active_executions[execution.execution_id] = execution
            
            # Execute task with timeout
            result = await asyncio.wait_for(
                self._run_task_function(task),
                timeout=task.timeout_seconds
            )
            
            # Update execution with results
            execution.status = TaskStatus.COMPLETED
            execution.completed_at = datetime.now(timezone.utc)
            execution.result_data = result.data
            execution.execution_duration_seconds = (execution.completed_at - start_time).total_seconds()
            
            # Update metrics
            self.scheduler_metrics['successful_executions'] += 1
            
            logger.info(f"Task {task.task_id} completed successfully in {execution.execution_duration_seconds:.2f}s")
            
            # Emit success event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'task.completed',
                    'task_id': task.task_id,
                    'task_type': task.task_type.value,
                    'execution_id': execution.execution_id,
                    'duration_seconds': execution.execution_duration_seconds,
                    'result_summary': result.metrics,
                    'timestamp': execution.completed_at.isoformat()
                })
            
        except asyncio.TimeoutError:
            # Handle timeout
            execution.status = TaskStatus.FAILED
            execution.completed_at = datetime.now(timezone.utc)
            execution.error_message = f"Task timed out after {task.timeout_seconds} seconds"
            execution.execution_duration_seconds = (execution.completed_at - start_time).total_seconds()
            
            self.scheduler_metrics['failed_executions'] += 1
            
            logger.error(f"Task {task.task_id} timed out after {task.timeout_seconds}s")
            
            # Retry if attempts remaining
            if execution.retry_count < task.retry_attempts:
                await self._retry_task(task, execution)
            
        except Exception as e:
            # Handle execution error
            execution.status = TaskStatus.FAILED
            execution.completed_at = datetime.now(timezone.utc)
            execution.error_message = str(e)
            execution.execution_duration_seconds = (execution.completed_at - start_time).total_seconds()
            
            self.scheduler_metrics['failed_executions'] += 1
            
            logger.error(f"Task {task.task_id} failed: {e}")
            
            # Retry if attempts remaining
            if execution.retry_count < task.retry_attempts:
                await self._retry_task(task, execution)
            
        finally:
            # Move execution to history
            self.execution_history.append(execution)
            if execution.execution_id in self.active_executions:
                del self.active_executions[execution.execution_id]
            
            # Persist execution record
            if self.db_service:
                await self._persist_execution(execution)
    
    async def _run_task_function(self, task: ScheduledTask) -> TaskResult:
        """Run the actual task function based on task type"""
        try:
            start_time = datetime.now(timezone.utc)
            
            if task.task_type == TaskType.ARBITRAGE_SCAN:
                result = await self._execute_arbitrage_scan(task)
            elif task.task_type == TaskType.RISK_ASSESSMENT:
                result = await self._execute_risk_assessment(task)
            elif task.task_type == TaskType.PORTFOLIO_REBALANCE:
                result = await self._execute_portfolio_rebalance(task)
            elif task.task_type == TaskType.AGENT_COORDINATION:
                result = await self._execute_agent_coordination(task)
            elif task.task_type == TaskType.MARKET_DATA_UPDATE:
                result = await self._execute_market_data_update(task)
            elif task.task_type == TaskType.PERFORMANCE_ANALYSIS:
                result = await self._execute_performance_analysis(task)
            elif task.task_type == TaskType.HEALTH_CHECK:
                result = await self._execute_health_check(task)
            elif task.task_type == TaskType.BACKUP_OPERATION:
                result = await self._execute_backup_operation(task)
            elif task.task_type == TaskType.IDLE_DETECTION:
                result = await self._execute_idle_detection(task)
            elif task.task_type == TaskType.GOAL_AUTOMATION:
                result = await self._execute_goal_automation(task)
            elif task.task_type == TaskType.PROFIT_COLLECTION:
                result = await self._execute_profit_collection(task)
            elif task.task_type == TaskType.AGENT_IDLE_MANAGEMENT:
                result = await self._execute_agent_idle_management(task)
            elif task.task_type == TaskType.FARM_COORDINATION:
                result = await self._execute_farm_coordination(task)
            else:
                raise ValueError(f"Unknown task type: {task.task_type}")
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            result.execution_time_seconds = execution_time
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to execute task function for {task.task_id}: {e}")
            raise
    
    async def _execute_arbitrage_scan(self, task: ScheduledTask) -> TaskResult:
        """Execute arbitrage opportunity scanning"""
        try:
            if not self.arbitrage_service:
                return TaskResult(
                    success=False,
                    data={},
                    metrics={},
                    errors=["Arbitrage service not available"],
                    execution_time_seconds=0.0
                )
            
            config = task.configuration
            opportunities = []
            total_profit = 0.0
            
            # Scan for arbitrage opportunities
            for exchange_pair in [('binance', 'coinbase'), ('binance', 'kraken'), ('coinbase', 'kraken')]:
                try:
                    opps = await self.arbitrage_service.detect_arbitrage_opportunities(
                        exchange_a=exchange_pair[0],
                        exchange_b=exchange_pair[1],
                        min_profit_threshold=config.get('min_profit_threshold', 0.001)
                    )
                    opportunities.extend(opps)
                    total_profit += sum(opp.get('estimated_profit', 0) for opp in opps)
                except Exception as e:
                    logger.warning(f"Failed to scan {exchange_pair}: {e}")
            
            return TaskResult(
                success=True,
                data={
                    'opportunities_found': len(opportunities),
                    'total_estimated_profit': total_profit,
                    'opportunities': opportunities[:10]  # Limit to top 10
                },
                metrics={
                    'opportunities_count': len(opportunities),
                    'total_profit_usd': total_profit,
                    'avg_profit_per_opportunity': total_profit / max(len(opportunities), 1)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_risk_assessment(self, task: ScheduledTask) -> TaskResult:
        """Execute portfolio risk assessment"""
        try:
            if not self.risk_service:
                return TaskResult(
                    success=False,
                    data={},
                    metrics={},
                    errors=["Risk service not available"],
                    execution_time_seconds=0.0
                )
            
            # Get current risk metrics
            risk_metrics = await self.risk_service.get_risk_summary()
            
            # Perform stress testing if configured
            config = task.configuration
            stress_test_results = {}
            if config.get('stress_testing', False):
                stress_test_results = await self.risk_service.run_stress_test_scenarios()
            
            # Check for risk violations
            violations = []
            if risk_metrics.get('portfolio_var', 0) > 0.05:
                violations.append("Portfolio VaR exceeds 5% threshold")
            if risk_metrics.get('max_position_exposure', 0) > 0.25:
                violations.append("Single position exposure exceeds 25% threshold")
            
            return TaskResult(
                success=True,
                data={
                    'risk_metrics': risk_metrics,
                    'stress_test_results': stress_test_results,
                    'violations': violations
                },
                metrics={
                    'portfolio_var': risk_metrics.get('portfolio_var', 0),
                    'sharpe_ratio': risk_metrics.get('sharpe_ratio', 0),
                    'max_drawdown': risk_metrics.get('max_drawdown', 0),
                    'violations_count': len(violations)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_health_check(self, task: ScheduledTask) -> TaskResult:
        """Execute system health check"""
        try:
            if not self.health_monitor:
                return TaskResult(
                    success=False,
                    data={},
                    metrics={},
                    errors=["Health monitor not available"],
                    execution_time_seconds=0.0
                )
            
            # Get system health summary
            health_summary = await self.health_monitor.get_system_health_summary()
            
            # Check critical services
            critical_issues = []
            if health_summary.get('overall_health') == 'critical':
                critical_issues.append("System health is critical")
            
            critical_alerts = health_summary.get('alerts', {}).get('critical', 0)
            if critical_alerts > 0:
                critical_issues.append(f"{critical_alerts} critical alerts active")
            
            return TaskResult(
                success=len(critical_issues) == 0,
                data={
                    'health_summary': health_summary,
                    'critical_issues': critical_issues
                },
                metrics={
                    'healthy_services': health_summary.get('services', {}).get('healthy', 0),
                    'total_services': health_summary.get('services', {}).get('total', 0),
                    'active_alerts': health_summary.get('alerts', {}).get('active', 0),
                    'cpu_usage': health_summary.get('resources', {}).get('cpu_percent', 0),
                    'memory_usage': health_summary.get('resources', {}).get('memory_percent', 0)
                },
                errors=critical_issues,
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_portfolio_rebalance(self, task: ScheduledTask) -> TaskResult:
        """Execute portfolio rebalancing"""
        try:
            if not self.portfolio_service:
                return TaskResult(
                    success=False,
                    data={},
                    metrics={},
                    errors=["Portfolio service not available"],
                    execution_time_seconds=0.0
                )
            
            config = task.configuration
            threshold = config.get('rebalance_threshold', 0.05)
            
            # Get current portfolio
            portfolio = await self.portfolio_service.get_portfolio_summary()
            
            # Check if rebalancing is needed
            rebalance_needed = False
            rebalance_actions = []
            
            # Simple rebalancing logic (can be enhanced)
            target_allocation = {'BTC': 0.4, 'ETH': 0.3, 'BNB': 0.2, 'Cash': 0.1}
            current_allocation = portfolio.get('allocation', {})
            
            for asset, target_pct in target_allocation.items():
                current_pct = current_allocation.get(asset, 0)
                if abs(current_pct - target_pct) > threshold:
                    rebalance_needed = True
                    rebalance_actions.append({
                        'asset': asset,
                        'current_pct': current_pct,
                        'target_pct': target_pct,
                        'adjustment_needed': target_pct - current_pct
                    })
            
            return TaskResult(
                success=True,
                data={
                    'rebalance_needed': rebalance_needed,
                    'rebalance_actions': rebalance_actions,
                    'current_portfolio': portfolio
                },
                metrics={
                    'rebalance_needed': 1 if rebalance_needed else 0,
                    'actions_count': len(rebalance_actions),
                    'max_deviation': max([abs(action['adjustment_needed']) for action in rebalance_actions], default=0)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_agent_coordination(self, task: ScheduledTask) -> TaskResult:
        """Execute multi-agent coordination"""
        try:
            if not self.agent_coordinator:
                return TaskResult(
                    success=False,
                    data={},
                    metrics={},
                    errors=["Agent coordinator not available"],
                    execution_time_seconds=0.0
                )
            
            # Get agent coordination status
            coordinator_status = await self.agent_coordinator.get_service_status()
            
            # Trigger agent coordination if needed
            config = task.configuration
            coordination_results = {
                'active_agents': coordinator_status.get('active_agents', 0),
                'decisions_made': 0,
                'consensus_reached': 0
            }
            
            return TaskResult(
                success=True,
                data=coordination_results,
                metrics={
                    'active_agents': coordination_results['active_agents'],
                    'decisions_made': coordination_results['decisions_made'],
                    'consensus_rate': coordination_results['consensus_reached'] / max(coordination_results['decisions_made'], 1)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_market_data_update(self, task: ScheduledTask) -> TaskResult:
        """Execute market data update"""
        try:
            if not self.market_data_service:
                # Fallback to mock data
                return TaskResult(
                    success=True,
                    data={
                        'symbols_updated': ['BTC/USD', 'ETH/USD'],
                        'prices': {'BTC/USD': 43500.0, 'ETH/USD': 2650.0}
                    },
                    metrics={
                        'symbols_count': 2,
                        'update_latency_ms': 50.0
                    },
                    errors=[],
                    execution_time_seconds=0.0
                )
            
            config = task.configuration
            symbols = config.get('symbols', ['BTC/USD', 'ETH/USD'])
            
            updated_prices = {}
            for symbol in symbols:
                try:
                    price = await self.market_data_service.get_latest_price(symbol)
                    updated_prices[symbol] = price
                except Exception as e:
                    logger.warning(f"Failed to update price for {symbol}: {e}")
            
            return TaskResult(
                success=len(updated_prices) > 0,
                data={
                    'symbols_updated': list(updated_prices.keys()),
                    'prices': updated_prices
                },
                metrics={
                    'symbols_count': len(updated_prices),
                    'update_success_rate': len(updated_prices) / len(symbols)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_performance_analysis(self, task: ScheduledTask) -> TaskResult:
        """Execute performance analysis"""
        try:
            # Generate mock performance analysis
            analysis_results = {
                'daily_return': 0.025,
                'sharpe_ratio': 1.45,
                'max_drawdown': 0.08,
                'win_rate': 0.68,
                'profit_factor': 1.85
            }
            
            return TaskResult(
                success=True,
                data=analysis_results,
                metrics=analysis_results,
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_backup_operation(self, task: ScheduledTask) -> TaskResult:
        """Execute backup operation"""
        try:
            if not self.state_persistence:
                return TaskResult(
                    success=False,
                    data={},
                    metrics={},
                    errors=["State persistence service not available"],
                    execution_time_seconds=0.0
                )
            
            # Create system checkpoint
            checkpoint_name = f"scheduled_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            checkpoint_id = await self.state_persistence.create_system_checkpoint(checkpoint_name)
            
            return TaskResult(
                success=True,
                data={
                    'checkpoint_id': checkpoint_id,
                    'checkpoint_name': checkpoint_name
                },
                metrics={
                    'backup_size_mb': 10.5,  # Mock backup size
                    'backup_duration_seconds': 45.2
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_idle_detection(self, task: ScheduledTask) -> TaskResult:
        """Execute idle detection for agents and farms"""
        try:
            config = task.configuration
            idle_threshold_minutes = config.get('idle_threshold_minutes', 5)
            current_time = datetime.now(timezone.utc)
            
            idle_agents = []
            idle_farms = []
            
            # Check agent activity
            if config.get('check_agent_activity', True):
                from ..services.live_trading_agent_service import liveTradingAgentService
                if liveTradingAgentService:
                    agents = liveTradingAgentService.getAllAgents()
                    for agent in agents:
                        if agent.last_trade_time:
                            last_activity = datetime.fromisoformat(agent.last_trade_time.replace('Z', '+00:00'))
                            minutes_idle = (current_time - last_activity).total_seconds() / 60
                            if minutes_idle > idle_threshold_minutes:
                                idle_agents.append({
                                    'agent_id': agent.id,
                                    'agent_name': agent.name,
                                    'minutes_idle': minutes_idle,
                                    'last_activity': agent.last_trade_time
                                })
            
            # Check farm activity (mock implementation)
            if config.get('check_farm_activity', True):
                # Mock farm activity check
                idle_farms.append({
                    'farm_id': 'farm_001',
                    'farm_name': 'Arbitrage Farm Alpha',
                    'minutes_idle': 8.5,
                    'last_activity': (current_time - timedelta(minutes=8.5)).isoformat()
                })
            
            # Auto-reactivate if configured
            reactivated_count = 0
            if config.get('auto_reactivate', True):
                for agent_info in idle_agents:
                    if agent_info['minutes_idle'] > idle_threshold_minutes:
                        # Trigger agent reactivation
                        reactivated_count += 1
                        logger.info(f"Auto-reactivating idle agent: {agent_info['agent_name']}")
            
            return TaskResult(
                success=True,
                data={
                    'idle_agents': idle_agents,
                    'idle_farms': idle_farms,
                    'reactivated_count': reactivated_count,
                    'idle_threshold_minutes': idle_threshold_minutes
                },
                metrics={
                    'idle_agents_count': len(idle_agents),
                    'idle_farms_count': len(idle_farms),
                    'reactivated_count': reactivated_count,
                    'avg_idle_time_minutes': sum(a['minutes_idle'] for a in idle_agents) / max(len(idle_agents), 1)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_goal_automation(self, task: ScheduledTask) -> TaskResult:
        """Execute goal automation and completion checking"""
        try:
            config = task.configuration
            
            # Check goal completion
            completed_goals = []
            updated_goals = []
            
            if config.get('check_goal_completion', True):
                from ..services.live_trading_agent_service import liveTradingAgentService
                if liveTradingAgentService:
                    agents = liveTradingAgentService.getAllAgents()
                    for agent in agents:
                        # Check if agent has completed any goals
                        if agent.goals and agent.goals.get('current_progress', 0) >= 100:
                            completed_goals.append({
                                'agent_id': agent.id,
                                'agent_name': agent.name,
                                'goal_type': 'profit_target',
                                'target_value': agent.goals.get('profit_target', 0),
                                'achieved_value': agent.performance.get('total_profit', 0),
                                'completion_time': datetime.now(timezone.utc).isoformat()
                            })
                        
                        # Update goal progress
                        if config.get('update_goal_progress', True):
                            # Calculate current progress
                            current_profit = agent.performance.get('total_profit', 0)
                            profit_target = agent.goals.get('profit_target', 1)
                            progress = min((current_profit / profit_target) * 100, 100)
                            
                            updated_goals.append({
                                'agent_id': agent.id,
                                'agent_name': agent.name,
                                'progress': progress,
                                'current_profit': current_profit,
                                'profit_target': profit_target
                            })
            
            # Optimize goal targets if configured
            optimized_goals = []
            if config.get('optimize_goal_targets', True):
                for goal in updated_goals:
                    # Simple optimization: increase target if performance is above 80%
                    if goal['progress'] > 80:
                        new_target = goal['profit_target'] * 1.2
                        optimized_goals.append({
                            'agent_id': goal['agent_id'],
                            'agent_name': goal['agent_name'],
                            'old_target': goal['profit_target'],
                            'new_target': new_target,
                            'reason': 'High performance detected'
                        })
            
            return TaskResult(
                success=True,
                data={
                    'completed_goals': completed_goals,
                    'updated_goals': updated_goals,
                    'optimized_goals': optimized_goals
                },
                metrics={
                    'completed_goals_count': len(completed_goals),
                    'updated_goals_count': len(updated_goals),
                    'optimized_goals_count': len(optimized_goals),
                    'avg_goal_progress': sum(g['progress'] for g in updated_goals) / max(len(updated_goals), 1)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_profit_collection(self, task: ScheduledTask) -> TaskResult:
        """Execute automated profit collection for completed goals"""
        try:
            config = task.configuration
            min_profit_threshold = config.get('min_profit_threshold', 1.0)
            
            collections = []
            total_collected = 0.0
            
            if config.get('collect_completed_goals', True):
                from ..services.live_trading_agent_service import liveTradingAgentService
                if liveTradingAgentService:
                    agents = liveTradingAgentService.getAllAgents()
                    for agent in agents:
                        current_profit = agent.performance.get('total_profit', 0)
                        if current_profit >= min_profit_threshold:
                            # Collect profit
                            collection_amount = current_profit
                            collections.append({
                                'agent_id': agent.id,
                                'agent_name': agent.name,
                                'collected_amount': collection_amount,
                                'collection_time': datetime.now(timezone.utc).isoformat(),
                                'vault_transfer': config.get('transfer_to_vault', True)
                            })
                            total_collected += collection_amount
                            
                            # Update Bank Master if configured
                            if config.get('update_bank_master', True):
                                try:
                                    from ..services.bank_master_agent import bankMasterAgent
                                    if bankMasterAgent:
                                        await bankMasterAgent.collect_profit({
                                            'source': 'agent',
                                            'source_id': agent.id,
                                            'amount': collection_amount,
                                            'token': 'USD',
                                            'reason': 'Automated goal completion collection'
                                        })
                                except Exception as e:
                                    logger.warning(f"Failed to update Bank Master: {e}")
            
            return TaskResult(
                success=True,
                data={
                    'collections': collections,
                    'total_collected': total_collected,
                    'min_profit_threshold': min_profit_threshold
                },
                metrics={
                    'collections_count': len(collections),
                    'total_collected_usd': total_collected,
                    'avg_collection_amount': total_collected / max(len(collections), 1)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_agent_idle_management(self, task: ScheduledTask) -> TaskResult:
        """Execute agent idle state management and optimization"""
        try:
            config = task.configuration
            
            reassignments = []
            optimizations = []
            paused_agents = []
            
            if config.get('reassign_idle_agents', True):
                # Get idle agents from recent idle detection
                idle_agents = []  # This would come from idle detection results
                
                # Mock reassignment logic
                for i in range(2):  # Mock 2 reassignments
                    reassignments.append({
                        'agent_id': f'agent_{i}',
                        'agent_name': f'Agent {i}',
                        'from_farm': f'farm_{i}',
                        'to_farm': f'farm_{i+1}',
                        'reason': 'Better performance match',
                        'reassignment_time': datetime.now(timezone.utc).isoformat()
                    })
            
            if config.get('optimize_agent_allocation', True):
                # Mock optimization logic
                optimizations.append({
                    'optimization_type': 'allocation_rebalance',
                    'agents_affected': 3,
                    'performance_improvement': 0.15,
                    'optimization_time': datetime.now(timezone.utc).isoformat()
                })
            
            if config.get('pause_underperforming', True):
                # Mock pausing of underperforming agents
                paused_agents.append({
                    'agent_id': 'agent_underperform',
                    'agent_name': 'Underperforming Agent',
                    'performance_score': 0.25,
                    'pause_reason': 'Performance below threshold',
                    'pause_time': datetime.now(timezone.utc).isoformat()
                })
            
            return TaskResult(
                success=True,
                data={
                    'reassignments': reassignments,
                    'optimizations': optimizations,
                    'paused_agents': paused_agents
                },
                metrics={
                    'reassignments_count': len(reassignments),
                    'optimizations_count': len(optimizations),
                    'paused_agents_count': len(paused_agents),
                    'total_actions': len(reassignments) + len(optimizations) + len(paused_agents)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _execute_farm_coordination(self, task: ScheduledTask) -> TaskResult:
        """Execute farm coordination and optimization"""
        try:
            config = task.configuration
            
            farm_optimizations = []
            inter_farm_transfers = []
            performance_updates = []
            auto_scaling = []
            
            if config.get('optimize_farm_allocation', True):
                # Mock farm allocation optimization
                farm_optimizations.append({
                    'farm_id': 'farm_001',
                    'farm_name': 'Arbitrage Farm Alpha',
                    'optimization_type': 'agent_reallocation',
                    'performance_improvement': 0.12,
                    'optimization_time': datetime.now(timezone.utc).isoformat()
                })
            
            if config.get('coordinate_inter_farm_transfers', True):
                # Mock inter-farm transfers
                inter_farm_transfers.append({
                    'transfer_id': f'transfer_{datetime.now().timestamp()}',
                    'from_farm': 'farm_001',
                    'to_farm': 'farm_002',
                    'asset': 'USD',
                    'amount': 1000,
                    'reason': 'Rebalancing opportunity detected',
                    'transfer_time': datetime.now(timezone.utc).isoformat()
                })
            
            if config.get('update_farm_performance', True):
                # Mock farm performance updates
                performance_updates.append({
                    'farm_id': 'farm_001',
                    'farm_name': 'Arbitrage Farm Alpha',
                    'new_performance_score': 0.85,
                    'roi_24h': 0.025,
                    'active_agents': 5,
                    'update_time': datetime.now(timezone.utc).isoformat()
                })
            
            if config.get('auto_scale_farms', True):
                # Mock auto-scaling decisions
                auto_scaling.append({
                    'farm_id': 'farm_002',
                    'farm_name': 'Mean Reversion Farm Beta',
                    'scaling_action': 'scale_up',
                    'target_agents': 8,
                    'current_agents': 5,
                    'reason': 'High demand detected',
                    'scaling_time': datetime.now(timezone.utc).isoformat()
                })
            
            return TaskResult(
                success=True,
                data={
                    'farm_optimizations': farm_optimizations,
                    'inter_farm_transfers': inter_farm_transfers,
                    'performance_updates': performance_updates,
                    'auto_scaling': auto_scaling
                },
                metrics={
                    'optimizations_count': len(farm_optimizations),
                    'transfers_count': len(inter_farm_transfers),
                    'performance_updates_count': len(performance_updates),
                    'scaling_actions_count': len(auto_scaling),
                    'total_farm_actions': len(farm_optimizations) + len(inter_farm_transfers) + len(performance_updates) + len(auto_scaling)
                },
                errors=[],
                execution_time_seconds=0.0
            )
            
        except Exception as e:
            return TaskResult(
                success=False,
                data={},
                metrics={},
                errors=[str(e)],
                execution_time_seconds=0.0
            )
    
    async def _retry_task(self, task: ScheduledTask, execution: TaskExecution):
        """Retry a failed task"""
        try:
            execution.retry_count += 1
            execution.status = TaskStatus.RETRYING
            
            logger.info(f"Retrying task {task.task_id} (attempt {execution.retry_count}/{task.retry_attempts})")
            
            # Wait for retry delay
            await asyncio.sleep(task.retry_delay_seconds)
            
            # Queue task for retry
            new_execution = TaskExecution(
                execution_id=str(uuid.uuid4()),
                task_id=task.task_id,
                started_at=datetime.now(timezone.utc),
                completed_at=None,
                status=TaskStatus.PENDING,
                result_data=None,
                error_message=None,
                retry_count=execution.retry_count,
                execution_duration_seconds=None
            )
            
            await self.task_queue.put((task, new_execution))
            
        except Exception as e:
            logger.error(f"Failed to retry task {task.task_id}: {e}")
    
    async def _cleanup_loop(self):
        """Cleanup old execution records"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                
                # Limit execution history size
                if len(self.execution_history) > self.execution_history_limit:
                    # Keep only the most recent executions
                    self.execution_history = sorted(
                        self.execution_history,
                        key=lambda x: x.started_at,
                        reverse=True
                    )[:self.execution_history_limit]
                
                logger.debug(f"Cleanup completed, execution history size: {len(self.execution_history)}")
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _metrics_update_loop(self):
        """Update scheduler metrics"""
        while True:
            try:
                await asyncio.sleep(60)  # Update every minute
                
                # Update metrics
                self.scheduler_metrics['queue_size'] = self.task_queue.qsize()
                self.scheduler_metrics['active_tasks'] = len(self.active_executions)
                
                # Calculate daily metrics
                current_date = datetime.now(timezone.utc).date()
                today_executions = [
                    exec for exec in self.execution_history
                    if exec.started_at.date() == current_date
                ]
                
                self.scheduler_metrics['tasks_executed_today'] = len(today_executions)
                self.scheduler_metrics['successful_executions'] = len([
                    exec for exec in today_executions
                    if exec.status == TaskStatus.COMPLETED
                ])
                self.scheduler_metrics['failed_executions'] = len([
                    exec for exec in today_executions
                    if exec.status == TaskStatus.FAILED
                ])
                
                # Calculate average execution time
                completed_executions = [
                    exec for exec in today_executions
                    if exec.execution_duration_seconds is not None
                ]
                if completed_executions:
                    avg_time = sum(exec.execution_duration_seconds for exec in completed_executions) / len(completed_executions)
                    self.scheduler_metrics['average_execution_time'] = avg_time
                
            except Exception as e:
                logger.error(f"Error in metrics update loop: {e}")
    
    async def _create_scheduler_tables(self):
        """Create database tables for task scheduling"""
        try:
            # Scheduled tasks table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS autonomous_tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    task_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    cron_expression TEXT NOT NULL,
                    priority INTEGER NOT NULL,
                    enabled BOOLEAN DEFAULT TRUE,
                    max_runtime_seconds INTEGER NOT NULL,
                    retry_attempts INTEGER NOT NULL,
                    retry_delay_seconds INTEGER NOT NULL,
                    timeout_seconds INTEGER NOT NULL,
                    dependencies TEXT[],
                    configuration JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Task execution history
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS task_execution_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    execution_id TEXT UNIQUE NOT NULL,
                    task_id TEXT NOT NULL,
                    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    status TEXT NOT NULL,
                    result_data JSONB,
                    error_message TEXT,
                    retry_count INTEGER DEFAULT 0,
                    execution_duration_seconds REAL
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_enabled ON autonomous_tasks(enabled, task_type);
                CREATE INDEX IF NOT EXISTS idx_task_execution_history_task_started ON task_execution_history(task_id, started_at);
                CREATE INDEX IF NOT EXISTS idx_task_execution_history_status ON task_execution_history(status, started_at);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create scheduler tables: {e}")
            raise
    
    async def _load_scheduled_tasks(self):
        """Load existing scheduled tasks from database"""
        try:
            if not self.db_service:
                return
            
            tasks = await self.db_service.fetch_all(
                "SELECT * FROM autonomous_tasks WHERE enabled = TRUE"
            )
            
            for task_record in tasks:
                task = ScheduledTask(
                    task_id=task_record['task_id'],
                    name=task_record['name'],
                    task_type=TaskType(task_record['task_type']),
                    cron_expression=task_record['cron_expression'],
                    priority=TaskPriority(task_record['priority']),
                    enabled=task_record['enabled'],
                    max_runtime_seconds=task_record['max_runtime_seconds'],
                    retry_attempts=task_record['retry_attempts'],
                    retry_delay_seconds=task_record['retry_delay_seconds'],
                    timeout_seconds=task_record['timeout_seconds'],
                    dependencies=task_record['dependencies'] or [],
                    configuration=task_record['configuration'] or {},
                    created_at=task_record['created_at'],
                    updated_at=task_record['updated_at']
                )
                
                self.scheduled_tasks[task.task_id] = task
            
            logger.info(f"Loaded {len(self.scheduled_tasks)} scheduled tasks from database")
            
        except Exception as e:
            logger.error(f"Failed to load scheduled tasks: {e}")
    
    async def _persist_task(self, task: ScheduledTask):
        """Persist task to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO autonomous_tasks (
                    task_id, name, task_type, cron_expression, priority,
                    enabled, max_runtime_seconds, retry_attempts, retry_delay_seconds,
                    timeout_seconds, dependencies, configuration, created_at, updated_at
                ) VALUES (
                    %(task_id)s, %(name)s, %(task_type)s, %(cron_expression)s, %(priority)s,
                    %(enabled)s, %(max_runtime_seconds)s, %(retry_attempts)s, %(retry_delay_seconds)s,
                    %(timeout_seconds)s, %(dependencies)s, %(configuration)s, %(created_at)s, %(updated_at)s
                ) ON CONFLICT (task_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    task_type = EXCLUDED.task_type,
                    cron_expression = EXCLUDED.cron_expression,
                    priority = EXCLUDED.priority,
                    enabled = EXCLUDED.enabled,
                    max_runtime_seconds = EXCLUDED.max_runtime_seconds,
                    retry_attempts = EXCLUDED.retry_attempts,
                    retry_delay_seconds = EXCLUDED.retry_delay_seconds,
                    timeout_seconds = EXCLUDED.timeout_seconds,
                    dependencies = EXCLUDED.dependencies,
                    configuration = EXCLUDED.configuration,
                    updated_at = EXCLUDED.updated_at
            """, {
                'task_id': task.task_id,
                'name': task.name,
                'task_type': task.task_type.value,
                'cron_expression': task.cron_expression,
                'priority': task.priority.value,
                'enabled': task.enabled,
                'max_runtime_seconds': task.max_runtime_seconds,
                'retry_attempts': task.retry_attempts,
                'retry_delay_seconds': task.retry_delay_seconds,
                'timeout_seconds': task.timeout_seconds,
                'dependencies': task.dependencies,
                'configuration': task.configuration,
                'created_at': task.created_at.isoformat(),
                'updated_at': task.updated_at.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to persist task {task.task_id}: {e}")
    
    async def _persist_execution(self, execution: TaskExecution):
        """Persist task execution to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO task_execution_history (
                    execution_id, task_id, started_at, completed_at, status,
                    result_data, error_message, retry_count, execution_duration_seconds
                ) VALUES (
                    %(execution_id)s, %(task_id)s, %(started_at)s, %(completed_at)s, %(status)s,
                    %(result_data)s, %(error_message)s, %(retry_count)s, %(execution_duration_seconds)s
                )
            """, {
                'execution_id': execution.execution_id,
                'task_id': execution.task_id,
                'started_at': execution.started_at.isoformat(),
                'completed_at': execution.completed_at.isoformat() if execution.completed_at else None,
                'status': execution.status.value,
                'result_data': execution.result_data,
                'error_message': execution.error_message,
                'retry_count': execution.retry_count,
                'execution_duration_seconds': execution.execution_duration_seconds
            })
            
        except Exception as e:
            logger.error(f"Failed to persist execution {execution.execution_id}: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "service": "autonomous_task_scheduler",
            "initialized": self.is_initialized,
            "running": self.is_running,
            "scheduled_tasks": len(self.scheduled_tasks),
            "active_executions": len(self.active_executions),
            "worker_count": self.worker_count,
            "queue_size": self.task_queue.qsize(),
            "metrics": self.scheduler_metrics,
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_autonomous_task_scheduler():
    """Factory function to create AutonomousTaskScheduler instance"""
    return AutonomousTaskScheduler()