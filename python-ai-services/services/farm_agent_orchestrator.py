"""
Farm-Agent Orchestrator Service
Manages dynamic assignment of agents to farms based on strategy, performance, and risk alignment
Provides intelligent agent allocation and farm-level coordination
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
from decimal import Decimal
import numpy as np

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class FarmAgentAssignmentStrategy(Enum):
    """Agent assignment strategies"""
    PERFORMANCE_BASED = "performance_based"
    STRATEGY_ALIGNMENT = "strategy_alignment"
    RISK_BALANCED = "risk_balanced"
    CAPITAL_WEIGHTED = "capital_weighted"
    DYNAMIC_OPTIMIZATION = "dynamic_optimization"

class AgentFarmStatus(Enum):
    """Agent status within farm"""
    ACTIVE = "active"
    PAUSED = "paused"
    UNDER_REVIEW = "under_review"
    PROBATION = "probation"
    GRADUATED = "graduated"
    RETIRED = "retired"

@dataclass
class FarmAgentAssignment:
    """Agent assignment to farm"""
    assignment_id: str
    farm_id: str
    agent_id: str
    assigned_capital: Decimal
    capital_utilization: float
    status: AgentFarmStatus
    performance_score: float
    risk_alignment_score: float
    strategy_compatibility_score: float
    assignment_date: datetime
    last_review_date: datetime
    next_review_date: datetime
    performance_metrics: Dict[str, Any]
    constraints: Dict[str, Any]

@dataclass
class FarmConfiguration:
    """Farm configuration and parameters"""
    farm_id: str
    name: str
    strategy_type: str
    target_allocation: Decimal
    max_agents: int
    min_agents: int
    risk_tolerance: float
    performance_requirements: Dict[str, float]
    agent_selection_criteria: Dict[str, Any]
    rebalancing_frequency: int  # hours
    auto_assignment_enabled: bool
    created_at: datetime
    updated_at: datetime

@dataclass
class AgentPerformanceMetrics:
    """Comprehensive agent performance metrics"""
    agent_id: str
    total_trades: int
    winning_trades: int
    total_pnl: Decimal
    max_drawdown: float
    sharpe_ratio: float
    win_rate: float
    avg_trade_duration: float
    risk_adjusted_return: float
    consistency_score: float
    strategy_alignment: float
    last_updated: datetime

class FarmAgentOrchestrator:
    """
    Orchestrates dynamic assignment and management of agents within farms
    Provides intelligent allocation based on performance, strategy, and risk alignment
    """
    
    def __init__(self):
        # Service dependencies
        self.db_service = None
        self.agent_coordinator = None
        self.farms_service = None
        self.goals_service = None
        self.risk_service = None
        self.performance_service = None
        self.event_service = None
        
        # Farm and agent management
        self.farm_configurations: Dict[str, FarmConfiguration] = {}
        self.agent_assignments: Dict[str, List[FarmAgentAssignment]] = {}
        self.agent_performance_cache: Dict[str, AgentPerformanceMetrics] = {}
        self.farm_agent_mapping: Dict[str, List[str]] = {}  # farm_id -> agent_ids
        
        # Assignment strategies
        self.assignment_strategies = {
            FarmAgentAssignmentStrategy.PERFORMANCE_BASED: self._assign_by_performance,
            FarmAgentAssignmentStrategy.STRATEGY_ALIGNMENT: self._assign_by_strategy,
            FarmAgentAssignmentStrategy.RISK_BALANCED: self._assign_by_risk_balance,
            FarmAgentAssignmentStrategy.CAPITAL_WEIGHTED: self._assign_by_capital,
            FarmAgentAssignmentStrategy.DYNAMIC_OPTIMIZATION: self._assign_dynamically
        }
        
        # Configuration
        self.rebalancing_interval = 3600  # 1 hour
        self.performance_review_interval = 86400  # 24 hours
        self.max_agents_per_farm = 10
        self.min_performance_threshold = 0.6
        
        self.is_initialized = False
        
        logger.info("Farm-Agent Orchestrator initialized")
    
    async def initialize(self):
        """Initialize the farm-agent orchestrator"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            self.farms_service = registry.get_service("farms_service")
            self.goals_service = registry.get_service("intelligent_goal_service")
            self.risk_service = registry.get_service("advanced_risk_management")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            
            # Initialize database tables
            if self.db_service:
                await self._create_orchestration_tables()
            
            # Load existing configurations and assignments
            await self._load_farm_configurations()
            await self._load_agent_assignments()
            
            # Start background tasks
            asyncio.create_task(self._periodic_rebalancing_task())
            asyncio.create_task(self._performance_review_task())
            asyncio.create_task(self._auto_assignment_task())
            asyncio.create_task(self._farm_health_monitoring_task())
            
            self.is_initialized = True
            logger.info("Farm-Agent Orchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize farm-agent orchestrator: {e}")
            raise
    
    async def create_farm_configuration(self, farm_data: Dict[str, Any]) -> FarmConfiguration:
        """Create a new farm configuration"""
        try:
            farm_config = FarmConfiguration(
                farm_id=farm_data.get('farm_id', str(uuid.uuid4())),
                name=farm_data['name'],
                strategy_type=farm_data['strategy_type'],
                target_allocation=Decimal(str(farm_data['target_allocation'])),
                max_agents=farm_data.get('max_agents', self.max_agents_per_farm),
                min_agents=farm_data.get('min_agents', 1),
                risk_tolerance=farm_data.get('risk_tolerance', 0.5),
                performance_requirements=farm_data.get('performance_requirements', {
                    'min_win_rate': 0.55,
                    'min_sharpe_ratio': 1.0,
                    'max_drawdown': 0.15
                }),
                agent_selection_criteria=farm_data.get('agent_selection_criteria', {}),
                rebalancing_frequency=farm_data.get('rebalancing_frequency', 24),
                auto_assignment_enabled=farm_data.get('auto_assignment_enabled', True),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Store configuration
            self.farm_configurations[farm_config.farm_id] = farm_config
            self.farm_agent_mapping[farm_config.farm_id] = []
            
            # Persist to database
            if self.db_service:
                await self._persist_farm_configuration(farm_config)
            
            # Trigger initial agent assignment if enabled
            if farm_config.auto_assignment_enabled:
                await self._assign_agents_to_farm(farm_config.farm_id)
            
            logger.info(f"Created farm configuration: {farm_config.name}")
            return farm_config
            
        except Exception as e:
            logger.error(f"Failed to create farm configuration: {e}")
            raise
    
    async def assign_agent_to_farm(self, 
                                  farm_id: str, 
                                  agent_id: str, 
                                  assigned_capital: Optional[Decimal] = None,
                                  assignment_strategy: FarmAgentAssignmentStrategy = FarmAgentAssignmentStrategy.DYNAMIC_OPTIMIZATION) -> FarmAgentAssignment:
        """Manually assign an agent to a farm"""
        try:
            if farm_id not in self.farm_configurations:
                raise ValueError(f"Farm {farm_id} not found")
            
            farm_config = self.farm_configurations[farm_id]
            
            # Check if farm has capacity
            current_agents = len(self.farm_agent_mapping.get(farm_id, []))
            if current_agents >= farm_config.max_agents:
                raise ValueError(f"Farm {farm_id} has reached maximum agent capacity")
            
            # Check if agent is already assigned
            existing_assignments = self.agent_assignments.get(agent_id, [])
            for assignment in existing_assignments:
                if assignment.farm_id == farm_id and assignment.status == AgentFarmStatus.ACTIVE:
                    raise ValueError(f"Agent {agent_id} already assigned to farm {farm_id}")
            
            # Get agent performance metrics
            agent_performance = await self._get_agent_performance_metrics(agent_id)
            
            # Calculate scores
            performance_score = self._calculate_performance_score(agent_performance)
            risk_alignment_score = self._calculate_risk_alignment_score(agent_performance, farm_config)
            strategy_compatibility_score = self._calculate_strategy_compatibility_score(agent_id, farm_config)
            
            # Calculate assigned capital
            if assigned_capital is None:
                assigned_capital = await self._calculate_optimal_capital_allocation(farm_id, agent_id)
            
            # Create assignment
            assignment = FarmAgentAssignment(
                assignment_id=str(uuid.uuid4()),
                farm_id=farm_id,
                agent_id=agent_id,
                assigned_capital=assigned_capital,
                capital_utilization=0.0,
                status=AgentFarmStatus.ACTIVE,
                performance_score=performance_score,
                risk_alignment_score=risk_alignment_score,
                strategy_compatibility_score=strategy_compatibility_score,
                assignment_date=datetime.now(timezone.utc),
                last_review_date=datetime.now(timezone.utc),
                next_review_date=datetime.now(timezone.utc) + timedelta(days=7),
                performance_metrics=asdict(agent_performance) if agent_performance else {},
                constraints={}
            )
            
            # Store assignment
            if agent_id not in self.agent_assignments:
                self.agent_assignments[agent_id] = []
            self.agent_assignments[agent_id].append(assignment)
            
            # Update farm mapping
            if farm_id not in self.farm_agent_mapping:
                self.farm_agent_mapping[farm_id] = []
            self.farm_agent_mapping[farm_id].append(agent_id)
            
            # Persist to database
            if self.db_service:
                await self._persist_agent_assignment(assignment)
            
            # Emit assignment event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'farm.agent_assigned',
                    'farm_id': farm_id,
                    'agent_id': agent_id,
                    'assigned_capital': float(assigned_capital),
                    'performance_score': performance_score,
                    'assignment_id': assignment.assignment_id,
                    'timestamp': assignment.assignment_date.isoformat()
                })
            
            logger.info(f"Assigned agent {agent_id} to farm {farm_id} with capital {assigned_capital}")
            return assignment
            
        except Exception as e:
            logger.error(f"Failed to assign agent {agent_id} to farm {farm_id}: {e}")
            raise
    
    async def _assign_agents_to_farm(self, farm_id: str):
        """Automatically assign optimal agents to a farm"""
        try:
            if farm_id not in self.farm_configurations:
                return
            
            farm_config = self.farm_configurations[farm_id]
            current_agents = len(self.farm_agent_mapping.get(farm_id, []))
            
            # Calculate how many agents we need
            target_agents = min(farm_config.max_agents, max(farm_config.min_agents, 3))
            agents_needed = max(0, target_agents - current_agents)
            
            if agents_needed == 0:
                return
            
            # Get available agents
            available_agents = await self._get_available_agents_for_farm(farm_id)
            
            # Score and rank agents
            agent_scores = []
            for agent_id in available_agents:
                score = await self._calculate_agent_farm_compatibility_score(agent_id, farm_id)
                agent_scores.append((agent_id, score))
            
            # Sort by score (highest first)
            agent_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Assign top agents
            assigned_count = 0
            for agent_id, score in agent_scores[:agents_needed]:
                if score > 0.6:  # Minimum compatibility threshold
                    try:
                        await self.assign_agent_to_farm(farm_id, agent_id)
                        assigned_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to auto-assign agent {agent_id} to farm {farm_id}: {e}")
            
            logger.info(f"Auto-assigned {assigned_count} agents to farm {farm_id}")
            
        except Exception as e:
            logger.error(f"Failed to auto-assign agents to farm {farm_id}: {e}")
    
    async def _get_available_agents_for_farm(self, farm_id: str) -> List[str]:
        """Get list of agents available for assignment to farm"""
        try:
            # Get all active agents
            if self.agent_coordinator:
                coordinator_status = await self.agent_coordinator.get_service_status()
                all_agents = list(self.agent_coordinator.active_agents.keys()) if hasattr(self.agent_coordinator, 'active_agents') else []
            else:
                # Fallback to mock agents
                all_agents = ['agent_001', 'agent_002', 'agent_003', 'agent_004', 'agent_005']
            
            # Filter out agents already assigned to this farm
            farm_agents = set(self.farm_agent_mapping.get(farm_id, []))
            available_agents = [agent_id for agent_id in all_agents if agent_id not in farm_agents]
            
            # Filter out agents with too many assignments
            max_assignments_per_agent = 3
            filtered_agents = []
            for agent_id in available_agents:
                agent_assignment_count = len(self.agent_assignments.get(agent_id, []))
                if agent_assignment_count < max_assignments_per_agent:
                    filtered_agents.append(agent_id)
            
            return filtered_agents
            
        except Exception as e:
            logger.error(f"Failed to get available agents for farm {farm_id}: {e}")
            return []
    
    async def _calculate_agent_farm_compatibility_score(self, agent_id: str, farm_id: str) -> float:
        """Calculate compatibility score between agent and farm"""
        try:
            if farm_id not in self.farm_configurations:
                return 0.0
            
            farm_config = self.farm_configurations[farm_id]
            agent_performance = await self._get_agent_performance_metrics(agent_id)
            
            if not agent_performance:
                return 0.3  # Default score for agents without history
            
            # Calculate component scores
            performance_score = self._calculate_performance_score(agent_performance)
            risk_alignment_score = self._calculate_risk_alignment_score(agent_performance, farm_config)
            strategy_compatibility_score = self._calculate_strategy_compatibility_score(agent_id, farm_config)
            
            # Weighted average
            compatibility_score = (
                performance_score * 0.4 +
                risk_alignment_score * 0.3 +
                strategy_compatibility_score * 0.3
            )
            
            return min(1.0, max(0.0, compatibility_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate compatibility score for agent {agent_id} and farm {farm_id}: {e}")
            return 0.0
    
    def _calculate_performance_score(self, agent_performance: AgentPerformanceMetrics) -> float:
        """Calculate normalized performance score for agent"""
        try:
            if not agent_performance:
                return 0.5
            
            # Normalize individual metrics
            win_rate_score = min(1.0, agent_performance.win_rate / 0.8)  # Target 80% win rate
            sharpe_score = min(1.0, agent_performance.sharpe_ratio / 2.0)  # Target Sharpe ratio 2.0
            drawdown_score = max(0.0, 1.0 - (agent_performance.max_drawdown / 0.2))  # Max 20% drawdown
            
            # Risk-adjusted return score
            risk_adj_score = min(1.0, agent_performance.risk_adjusted_return / 0.3)  # Target 30% risk-adj return
            
            # Weighted average
            performance_score = (
                win_rate_score * 0.25 +
                sharpe_score * 0.25 +
                drawdown_score * 0.25 +
                risk_adj_score * 0.25
            )
            
            return min(1.0, max(0.0, performance_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate performance score: {e}")
            return 0.5
    
    def _calculate_risk_alignment_score(self, agent_performance: AgentPerformanceMetrics, farm_config: FarmConfiguration) -> float:
        """Calculate how well agent's risk profile aligns with farm"""
        try:
            if not agent_performance:
                return 0.5
            
            # Compare agent risk metrics with farm requirements
            risk_tolerance_diff = abs(agent_performance.max_drawdown - farm_config.risk_tolerance)
            risk_alignment = max(0.0, 1.0 - (risk_tolerance_diff / 0.3))  # Allow 30% difference
            
            # Check if agent meets farm's performance requirements
            requirements_met = 0
            requirements_total = 0
            
            if 'min_win_rate' in farm_config.performance_requirements:
                requirements_total += 1
                if agent_performance.win_rate >= farm_config.performance_requirements['min_win_rate']:
                    requirements_met += 1
            
            if 'min_sharpe_ratio' in farm_config.performance_requirements:
                requirements_total += 1
                if agent_performance.sharpe_ratio >= farm_config.performance_requirements['min_sharpe_ratio']:
                    requirements_met += 1
            
            if 'max_drawdown' in farm_config.performance_requirements:
                requirements_total += 1
                if agent_performance.max_drawdown <= farm_config.performance_requirements['max_drawdown']:
                    requirements_met += 1
            
            requirements_score = requirements_met / max(requirements_total, 1)
            
            # Combined risk alignment score
            risk_alignment_score = (risk_alignment * 0.6 + requirements_score * 0.4)
            
            return min(1.0, max(0.0, risk_alignment_score))
            
        except Exception as e:
            logger.error(f"Failed to calculate risk alignment score: {e}")
            return 0.5
    
    def _calculate_strategy_compatibility_score(self, agent_id: str, farm_config: FarmConfiguration) -> float:
        """Calculate strategy compatibility between agent and farm"""
        try:
            # Get agent's strategy type (mock implementation)
            agent_strategy_types = {
                'agent_001': 'momentum',
                'agent_002': 'arbitrage', 
                'agent_003': 'mean_reversion',
                'agent_004': 'momentum',
                'agent_005': 'arbitrage'
            }
            
            agent_strategy = agent_strategy_types.get(agent_id, 'unknown')
            
            # Strategy compatibility matrix
            compatibility_matrix = {
                'momentum': {'momentum': 1.0, 'trend_following': 0.9, 'arbitrage': 0.3, 'mean_reversion': 0.2},
                'arbitrage': {'arbitrage': 1.0, 'momentum': 0.3, 'mean_reversion': 0.4, 'trend_following': 0.3},
                'mean_reversion': {'mean_reversion': 1.0, 'arbitrage': 0.4, 'momentum': 0.2, 'trend_following': 0.3},
                'trend_following': {'trend_following': 1.0, 'momentum': 0.9, 'arbitrage': 0.3, 'mean_reversion': 0.3}
            }
            
            farm_strategy = farm_config.strategy_type.lower()
            agent_strategy_lower = agent_strategy.lower()
            
            if agent_strategy_lower in compatibility_matrix and farm_strategy in compatibility_matrix[agent_strategy_lower]:
                return compatibility_matrix[agent_strategy_lower][farm_strategy]
            
            return 0.5  # Default compatibility
            
        except Exception as e:
            logger.error(f"Failed to calculate strategy compatibility score: {e}")
            return 0.5
    
    async def _calculate_optimal_capital_allocation(self, farm_id: str, agent_id: str) -> Decimal:
        """Calculate optimal capital allocation for agent in farm"""
        try:
            if farm_id not in self.farm_configurations:
                return Decimal("1000")  # Default allocation
            
            farm_config = self.farm_configurations[farm_id]
            agent_performance = await self._get_agent_performance_metrics(agent_id)
            
            # Base allocation (equal distribution)
            current_agents = len(self.farm_agent_mapping.get(farm_id, []))
            base_allocation = farm_config.target_allocation / max(current_agents + 1, farm_config.min_agents)
            
            # Performance-based adjustment
            if agent_performance:
                performance_multiplier = 0.5 + (self._calculate_performance_score(agent_performance) * 1.5)
                adjusted_allocation = base_allocation * Decimal(str(performance_multiplier))
            else:
                adjusted_allocation = base_allocation * Decimal("0.8")  # Conservative for new agents
            
            # Ensure allocation is within reasonable bounds
            min_allocation = farm_config.target_allocation * Decimal("0.05")  # 5% minimum
            max_allocation = farm_config.target_allocation * Decimal("0.4")   # 40% maximum
            
            optimal_allocation = max(min_allocation, min(max_allocation, adjusted_allocation))
            
            return optimal_allocation
            
        except Exception as e:
            logger.error(f"Failed to calculate optimal capital allocation: {e}")
            return Decimal("1000")
    
    async def _get_agent_performance_metrics(self, agent_id: str) -> Optional[AgentPerformanceMetrics]:
        """Get comprehensive performance metrics for agent"""
        try:
            # Check cache first
            if agent_id in self.agent_performance_cache:
                cached_metrics = self.agent_performance_cache[agent_id]
                # Return if cache is recent (within 1 hour)
                if (datetime.now(timezone.utc) - cached_metrics.last_updated).total_seconds() < 3600:
                    return cached_metrics
            
            # Mock performance metrics (replace with actual data source)
            mock_metrics = AgentPerformanceMetrics(
                agent_id=agent_id,
                total_trades=150 + hash(agent_id) % 100,
                winning_trades=95 + hash(agent_id) % 50,
                total_pnl=Decimal(str(2500 + (hash(agent_id) % 5000))),
                max_drawdown=0.08 + (hash(agent_id) % 20) / 1000,
                sharpe_ratio=1.2 + (hash(agent_id) % 100) / 100,
                win_rate=0.6 + (hash(agent_id) % 25) / 100,
                avg_trade_duration=240 + hash(agent_id) % 300,
                risk_adjusted_return=0.15 + (hash(agent_id) % 30) / 100,
                consistency_score=0.7 + (hash(agent_id) % 25) / 100,
                strategy_alignment=0.8 + (hash(agent_id) % 20) / 100,
                last_updated=datetime.now(timezone.utc)
            )
            
            # Cache the metrics
            self.agent_performance_cache[agent_id] = mock_metrics
            
            return mock_metrics
            
        except Exception as e:
            logger.error(f"Failed to get agent performance metrics for {agent_id}: {e}")
            return None
    
    async def _periodic_rebalancing_task(self):
        """Periodic farm rebalancing task"""
        while True:
            try:
                await asyncio.sleep(self.rebalancing_interval)
                
                for farm_id in self.farm_configurations:
                    await self._rebalance_farm_agents(farm_id)
                
            except Exception as e:
                logger.error(f"Error in periodic rebalancing task: {e}")
    
    async def _rebalance_farm_agents(self, farm_id: str):
        """Rebalance agents within a farm based on performance"""
        try:
            if farm_id not in self.farm_configurations:
                return
            
            farm_config = self.farm_configurations[farm_id]
            current_agents = self.farm_agent_mapping.get(farm_id, [])
            
            if not current_agents:
                return
            
            # Review each agent's performance
            agent_scores = []
            for agent_id in current_agents:
                assignments = self.agent_assignments.get(agent_id, [])
                farm_assignment = next((a for a in assignments if a.farm_id == farm_id), None)
                
                if farm_assignment:
                    # Recalculate scores
                    agent_performance = await self._get_agent_performance_metrics(agent_id)
                    if agent_performance:
                        performance_score = self._calculate_performance_score(agent_performance)
                        risk_alignment_score = self._calculate_risk_alignment_score(agent_performance, farm_config)
                        
                        # Update assignment scores
                        farm_assignment.performance_score = performance_score
                        farm_assignment.risk_alignment_score = risk_alignment_score
                        farm_assignment.last_review_date = datetime.now(timezone.utc)
                        
                        agent_scores.append((agent_id, performance_score))
            
            # Identify underperforming agents
            underperformers = [agent_id for agent_id, score in agent_scores if score < self.min_performance_threshold]
            
            # Put underperformers on probation or remove them
            for agent_id in underperformers:
                await self._handle_underperforming_agent(farm_id, agent_id)
            
            # Check if we need more agents
            remaining_agents = len(current_agents) - len(underperformers)
            if remaining_agents < farm_config.min_agents:
                await self._assign_agents_to_farm(farm_id)
            
            logger.debug(f"Rebalanced farm {farm_id}: {len(underperformers)} underperformers identified")
            
        except Exception as e:
            logger.error(f"Failed to rebalance farm {farm_id}: {e}")
    
    async def _handle_underperforming_agent(self, farm_id: str, agent_id: str):
        """Handle underperforming agent in farm"""
        try:
            assignments = self.agent_assignments.get(agent_id, [])
            farm_assignment = next((a for a in assignments if a.farm_id == farm_id), None)
            
            if not farm_assignment:
                return
            
            if farm_assignment.status == AgentFarmStatus.ACTIVE:
                # First warning - put on probation
                farm_assignment.status = AgentFarmStatus.PROBATION
                farm_assignment.next_review_date = datetime.now(timezone.utc) + timedelta(days=3)
                
                logger.info(f"Agent {agent_id} put on probation in farm {farm_id}")
                
            elif farm_assignment.status == AgentFarmStatus.PROBATION:
                # Second warning - remove from farm
                farm_assignment.status = AgentFarmStatus.RETIRED
                
                # Remove from farm mapping
                if farm_id in self.farm_agent_mapping and agent_id in self.farm_agent_mapping[farm_id]:
                    self.farm_agent_mapping[farm_id].remove(agent_id)
                
                # Emit removal event
                if self.event_service:
                    await self.event_service.emit_event({
                        'event_type': 'farm.agent_removed',
                        'farm_id': farm_id,
                        'agent_id': agent_id,
                        'reason': 'underperformance',
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    })
                
                logger.info(f"Agent {agent_id} removed from farm {farm_id} due to underperformance")
            
            # Update in database
            if self.db_service:
                await self._persist_agent_assignment(farm_assignment)
                
        except Exception as e:
            logger.error(f"Failed to handle underperforming agent {agent_id} in farm {farm_id}: {e}")
    
    async def get_farm_agent_status(self, farm_id: str) -> Dict[str, Any]:
        """Get comprehensive status of agents in farm"""
        try:
            if farm_id not in self.farm_configurations:
                raise ValueError(f"Farm {farm_id} not found")
            
            farm_config = self.farm_configurations[farm_id]
            current_agents = self.farm_agent_mapping.get(farm_id, [])
            
            agent_details = []
            total_capital = Decimal("0")
            total_utilization = 0.0
            avg_performance = 0.0
            
            for agent_id in current_agents:
                assignments = self.agent_assignments.get(agent_id, [])
                farm_assignment = next((a for a in assignments if a.farm_id == farm_id), None)
                
                if farm_assignment:
                    agent_performance = await self._get_agent_performance_metrics(agent_id)
                    
                    agent_detail = {
                        'agent_id': agent_id,
                        'assigned_capital': float(farm_assignment.assigned_capital),
                        'capital_utilization': farm_assignment.capital_utilization,
                        'status': farm_assignment.status.value,
                        'performance_score': farm_assignment.performance_score,
                        'risk_alignment_score': farm_assignment.risk_alignment_score,
                        'strategy_compatibility_score': farm_assignment.strategy_compatibility_score,
                        'assignment_date': farm_assignment.assignment_date.isoformat(),
                        'last_review_date': farm_assignment.last_review_date.isoformat(),
                        'next_review_date': farm_assignment.next_review_date.isoformat()
                    }
                    
                    if agent_performance:
                        agent_detail.update({
                            'total_trades': agent_performance.total_trades,
                            'win_rate': agent_performance.win_rate,
                            'total_pnl': float(agent_performance.total_pnl),
                            'sharpe_ratio': agent_performance.sharpe_ratio,
                            'max_drawdown': agent_performance.max_drawdown
                        })
                    
                    agent_details.append(agent_detail)
                    total_capital += farm_assignment.assigned_capital
                    total_utilization += farm_assignment.capital_utilization
                    avg_performance += farm_assignment.performance_score
            
            if current_agents:
                avg_utilization = total_utilization / len(current_agents)
                avg_performance = avg_performance / len(current_agents)
            else:
                avg_utilization = 0.0
                avg_performance = 0.0
            
            return {
                'farm_id': farm_id,
                'farm_name': farm_config.name,
                'strategy_type': farm_config.strategy_type,
                'target_allocation': float(farm_config.target_allocation),
                'total_allocated_capital': float(total_capital),
                'capital_utilization_rate': float(total_capital) / float(farm_config.target_allocation) if farm_config.target_allocation > 0 else 0,
                'agent_count': len(current_agents),
                'max_agents': farm_config.max_agents,
                'min_agents': farm_config.min_agents,
                'avg_capital_utilization': avg_utilization,
                'avg_performance_score': avg_performance,
                'auto_assignment_enabled': farm_config.auto_assignment_enabled,
                'agents': agent_details,
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get farm agent status for {farm_id}: {e}")
            return {}
    
    async def _periodic_rebalancing_task(self):
        """Periodic farm rebalancing task"""
        while True:
            try:
                await asyncio.sleep(self.rebalancing_interval)
                
                for farm_id in self.farm_configurations:
                    await self._rebalance_farm_agents(farm_id)
                
            except Exception as e:
                logger.error(f"Error in periodic rebalancing task: {e}")
    
    async def _performance_review_task(self):
        """Periodic performance review task"""
        while True:
            try:
                await asyncio.sleep(self.performance_review_interval)
                
                for farm_id in self.farm_configurations:
                    await self._review_farm_performance(farm_id)
                
            except Exception as e:
                logger.error(f"Error in performance review task: {e}")
    
    async def _auto_assignment_task(self):
        """Automatic agent assignment task"""
        while True:
            try:
                await asyncio.sleep(1800)  # Check every 30 minutes
                
                for farm_id, farm_config in self.farm_configurations.items():
                    if farm_config.auto_assignment_enabled:
                        current_agents = len(self.farm_agent_mapping.get(farm_id, []))
                        if current_agents < farm_config.min_agents:
                            await self._assign_agents_to_farm(farm_id)
                
            except Exception as e:
                logger.error(f"Error in auto assignment task: {e}")
    
    async def _farm_health_monitoring_task(self):
        """Monitor farm health and performance"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                for farm_id in self.farm_configurations:
                    await self._monitor_farm_health(farm_id)
                
            except Exception as e:
                logger.error(f"Error in farm health monitoring task: {e}")
    
    async def _review_farm_performance(self, farm_id: str):
        """Review overall farm performance"""
        try:
            farm_status = await self.get_farm_agent_status(farm_id)
            
            # Check if farm is meeting performance targets
            avg_performance = farm_status.get('avg_performance_score', 0)
            agent_count = farm_status.get('agent_count', 0)
            
            if avg_performance < 0.5 or agent_count == 0:
                logger.warning(f"Farm {farm_id} underperforming: avg_score={avg_performance}, agents={agent_count}")
                
                # Trigger rebalancing
                await self._rebalance_farm_agents(farm_id)
        
        except Exception as e:
            logger.error(f"Failed to review farm performance for {farm_id}: {e}")
    
    async def _monitor_farm_health(self, farm_id: str):
        """Monitor individual farm health metrics"""
        try:
            farm_status = await self.get_farm_agent_status(farm_id)
            
            # Check various health metrics
            capital_utilization = farm_status.get('capital_utilization_rate', 0)
            agent_count = farm_status.get('agent_count', 0)
            avg_performance = farm_status.get('avg_performance_score', 0)
            
            # Generate health alerts if needed
            alerts = []
            
            if capital_utilization < 0.5:
                alerts.append(f"Low capital utilization: {capital_utilization:.2%}")
            
            if agent_count == 0:
                alerts.append("No active agents assigned")
            
            if avg_performance < 0.4:
                alerts.append(f"Low average performance: {avg_performance:.2f}")
            
            if alerts and self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'farm.health_alert',
                    'farm_id': farm_id,
                    'alerts': alerts,
                    'farm_status': farm_status,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
        
        except Exception as e:
            logger.error(f"Failed to monitor farm health for {farm_id}: {e}")
    
    async def _create_orchestration_tables(self):
        """Create database tables for farm-agent orchestration"""
        try:
            # Farm configurations table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS farm_configurations (
                    farm_id UUID PRIMARY KEY,
                    name TEXT NOT NULL,
                    strategy_type TEXT NOT NULL,
                    target_allocation DECIMAL(20, 2) NOT NULL,
                    max_agents INTEGER NOT NULL,
                    min_agents INTEGER NOT NULL,
                    risk_tolerance REAL NOT NULL,
                    performance_requirements JSONB,
                    agent_selection_criteria JSONB,
                    rebalancing_frequency INTEGER NOT NULL,
                    auto_assignment_enabled BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Agent assignments table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS farm_agent_assignments (
                    assignment_id UUID PRIMARY KEY,
                    farm_id UUID NOT NULL,
                    agent_id TEXT NOT NULL,
                    assigned_capital DECIMAL(20, 2) NOT NULL,
                    capital_utilization REAL DEFAULT 0.0,
                    status TEXT NOT NULL,
                    performance_score REAL DEFAULT 0.0,
                    risk_alignment_score REAL DEFAULT 0.0,
                    strategy_compatibility_score REAL DEFAULT 0.0,
                    assignment_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    last_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    performance_metrics JSONB,
                    constraints JSONB,
                    FOREIGN KEY (farm_id) REFERENCES farm_configurations(farm_id)
                )
            """)
            
            # Agent performance cache table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS agent_performance_cache (
                    agent_id TEXT PRIMARY KEY,
                    total_trades INTEGER DEFAULT 0,
                    winning_trades INTEGER DEFAULT 0,
                    total_pnl DECIMAL(20, 2) DEFAULT 0,
                    max_drawdown REAL DEFAULT 0.0,
                    sharpe_ratio REAL DEFAULT 0.0,
                    win_rate REAL DEFAULT 0.0,
                    avg_trade_duration REAL DEFAULT 0.0,
                    risk_adjusted_return REAL DEFAULT 0.0,
                    consistency_score REAL DEFAULT 0.0,
                    strategy_alignment REAL DEFAULT 0.0,
                    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_farm_id ON farm_agent_assignments(farm_id);
                CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_agent_id ON farm_agent_assignments(agent_id);
                CREATE INDEX IF NOT EXISTS idx_farm_agent_assignments_status ON farm_agent_assignments(status);
                CREATE INDEX IF NOT EXISTS idx_agent_performance_cache_updated ON agent_performance_cache(last_updated);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create orchestration tables: {e}")
            raise
    
    async def _load_farm_configurations(self):
        """Load existing farm configurations from database"""
        try:
            if not self.db_service:
                return
            
            configs = await self.db_service.fetch_all(
                "SELECT * FROM farm_configurations ORDER BY created_at"
            )
            
            for config_record in configs:
                farm_config = FarmConfiguration(
                    farm_id=config_record['farm_id'],
                    name=config_record['name'],
                    strategy_type=config_record['strategy_type'],
                    target_allocation=Decimal(str(config_record['target_allocation'])),
                    max_agents=config_record['max_agents'],
                    min_agents=config_record['min_agents'],
                    risk_tolerance=config_record['risk_tolerance'],
                    performance_requirements=config_record['performance_requirements'] or {},
                    agent_selection_criteria=config_record['agent_selection_criteria'] or {},
                    rebalancing_frequency=config_record['rebalancing_frequency'],
                    auto_assignment_enabled=config_record['auto_assignment_enabled'],
                    created_at=config_record['created_at'],
                    updated_at=config_record['updated_at']
                )
                
                self.farm_configurations[farm_config.farm_id] = farm_config
                self.farm_agent_mapping[farm_config.farm_id] = []
            
            logger.info(f"Loaded {len(self.farm_configurations)} farm configurations")
            
        except Exception as e:
            logger.error(f"Failed to load farm configurations: {e}")
    
    async def _load_agent_assignments(self):
        """Load existing agent assignments from database"""
        try:
            if not self.db_service:
                return
            
            assignments = await self.db_service.fetch_all(
                "SELECT * FROM farm_agent_assignments WHERE status IN ('active', 'probation') ORDER BY assignment_date"
            )
            
            for assignment_record in assignments:
                assignment = FarmAgentAssignment(
                    assignment_id=assignment_record['assignment_id'],
                    farm_id=assignment_record['farm_id'],
                    agent_id=assignment_record['agent_id'],
                    assigned_capital=Decimal(str(assignment_record['assigned_capital'])),
                    capital_utilization=assignment_record['capital_utilization'],
                    status=AgentFarmStatus(assignment_record['status']),
                    performance_score=assignment_record['performance_score'],
                    risk_alignment_score=assignment_record['risk_alignment_score'],
                    strategy_compatibility_score=assignment_record['strategy_compatibility_score'],
                    assignment_date=assignment_record['assignment_date'],
                    last_review_date=assignment_record['last_review_date'],
                    next_review_date=assignment_record['next_review_date'],
                    performance_metrics=assignment_record['performance_metrics'] or {},
                    constraints=assignment_record['constraints'] or {}
                )
                
                # Add to agent assignments
                if assignment.agent_id not in self.agent_assignments:
                    self.agent_assignments[assignment.agent_id] = []
                self.agent_assignments[assignment.agent_id].append(assignment)
                
                # Add to farm mapping
                if assignment.farm_id not in self.farm_agent_mapping:
                    self.farm_agent_mapping[assignment.farm_id] = []
                if assignment.agent_id not in self.farm_agent_mapping[assignment.farm_id]:
                    self.farm_agent_mapping[assignment.farm_id].append(assignment.agent_id)
            
            logger.info(f"Loaded {len(assignments)} agent assignments")
            
        except Exception as e:
            logger.error(f"Failed to load agent assignments: {e}")
    
    async def _persist_farm_configuration(self, farm_config: FarmConfiguration):
        """Persist farm configuration to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO farm_configurations (
                    farm_id, name, strategy_type, target_allocation, max_agents, min_agents,
                    risk_tolerance, performance_requirements, agent_selection_criteria,
                    rebalancing_frequency, auto_assignment_enabled, created_at, updated_at
                ) VALUES (
                    %(farm_id)s, %(name)s, %(strategy_type)s, %(target_allocation)s, %(max_agents)s, %(min_agents)s,
                    %(risk_tolerance)s, %(performance_requirements)s, %(agent_selection_criteria)s,
                    %(rebalancing_frequency)s, %(auto_assignment_enabled)s, %(created_at)s, %(updated_at)s
                ) ON CONFLICT (farm_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    strategy_type = EXCLUDED.strategy_type,
                    target_allocation = EXCLUDED.target_allocation,
                    max_agents = EXCLUDED.max_agents,
                    min_agents = EXCLUDED.min_agents,
                    risk_tolerance = EXCLUDED.risk_tolerance,
                    performance_requirements = EXCLUDED.performance_requirements,
                    agent_selection_criteria = EXCLUDED.agent_selection_criteria,
                    rebalancing_frequency = EXCLUDED.rebalancing_frequency,
                    auto_assignment_enabled = EXCLUDED.auto_assignment_enabled,
                    updated_at = EXCLUDED.updated_at
            """, {
                'farm_id': farm_config.farm_id,
                'name': farm_config.name,
                'strategy_type': farm_config.strategy_type,
                'target_allocation': float(farm_config.target_allocation),
                'max_agents': farm_config.max_agents,
                'min_agents': farm_config.min_agents,
                'risk_tolerance': farm_config.risk_tolerance,
                'performance_requirements': farm_config.performance_requirements,
                'agent_selection_criteria': farm_config.agent_selection_criteria,
                'rebalancing_frequency': farm_config.rebalancing_frequency,
                'auto_assignment_enabled': farm_config.auto_assignment_enabled,
                'created_at': farm_config.created_at.isoformat(),
                'updated_at': farm_config.updated_at.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to persist farm configuration {farm_config.farm_id}: {e}")
    
    async def _persist_agent_assignment(self, assignment: FarmAgentAssignment):
        """Persist agent assignment to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO farm_agent_assignments (
                    assignment_id, farm_id, agent_id, assigned_capital, capital_utilization,
                    status, performance_score, risk_alignment_score, strategy_compatibility_score,
                    assignment_date, last_review_date, next_review_date, performance_metrics, constraints
                ) VALUES (
                    %(assignment_id)s, %(farm_id)s, %(agent_id)s, %(assigned_capital)s, %(capital_utilization)s,
                    %(status)s, %(performance_score)s, %(risk_alignment_score)s, %(strategy_compatibility_score)s,
                    %(assignment_date)s, %(last_review_date)s, %(next_review_date)s, %(performance_metrics)s, %(constraints)s
                ) ON CONFLICT (assignment_id) DO UPDATE SET
                    assigned_capital = EXCLUDED.assigned_capital,
                    capital_utilization = EXCLUDED.capital_utilization,
                    status = EXCLUDED.status,
                    performance_score = EXCLUDED.performance_score,
                    risk_alignment_score = EXCLUDED.risk_alignment_score,
                    strategy_compatibility_score = EXCLUDED.strategy_compatibility_score,
                    last_review_date = EXCLUDED.last_review_date,
                    next_review_date = EXCLUDED.next_review_date,
                    performance_metrics = EXCLUDED.performance_metrics,
                    constraints = EXCLUDED.constraints
            """, {
                'assignment_id': assignment.assignment_id,
                'farm_id': assignment.farm_id,
                'agent_id': assignment.agent_id,
                'assigned_capital': float(assignment.assigned_capital),
                'capital_utilization': assignment.capital_utilization,
                'status': assignment.status.value,
                'performance_score': assignment.performance_score,
                'risk_alignment_score': assignment.risk_alignment_score,
                'strategy_compatibility_score': assignment.strategy_compatibility_score,
                'assignment_date': assignment.assignment_date.isoformat(),
                'last_review_date': assignment.last_review_date.isoformat(),
                'next_review_date': assignment.next_review_date.isoformat(),
                'performance_metrics': assignment.performance_metrics,
                'constraints': assignment.constraints
            })
            
        except Exception as e:
            logger.error(f"Failed to persist agent assignment {assignment.assignment_id}: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "service": "farm_agent_orchestrator",
            "initialized": self.is_initialized,
            "farm_count": len(self.farm_configurations),
            "total_assignments": sum(len(assignments) for assignments in self.agent_assignments.values()),
            "active_assignments": sum(
                len([a for a in assignments if a.status == AgentFarmStatus.ACTIVE])
                for assignments in self.agent_assignments.values()
            ),
            "assignment_strategies": len(self.assignment_strategies),
            "rebalancing_interval_hours": self.rebalancing_interval / 3600,
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_farm_agent_orchestrator():
    """Factory function to create FarmAgentOrchestrator instance"""
    return FarmAgentOrchestrator()