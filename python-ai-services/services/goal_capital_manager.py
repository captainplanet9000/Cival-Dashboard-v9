"""
Goal-Capital Manager Service
Manages automatic capital flow from goals to farms to agents based on performance and achievement
Provides intelligent capital allocation and reallocation based on goal progress
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

class CapitalFlowDirection(Enum):
    """Direction of capital flow"""
    GOAL_TO_FARM = "goal_to_farm"
    FARM_TO_AGENT = "farm_to_agent"
    AGENT_TO_FARM = "agent_to_farm"
    FARM_TO_GOAL = "farm_to_goal"
    REBALANCE = "rebalance"

class CapitalAllocationStrategy(Enum):
    """Capital allocation strategies"""
    PERFORMANCE_WEIGHTED = "performance_weighted"
    EQUAL_DISTRIBUTION = "equal_distribution"
    GOAL_PROGRESS_BASED = "goal_progress_based"
    RISK_ADJUSTED = "risk_adjusted"
    DYNAMIC_OPTIMIZATION = "dynamic_optimization"

class GoalAchievementAction(Enum):
    """Actions to take when goals are achieved or missed"""
    INCREASE_CAPITAL = "increase_capital"
    DECREASE_CAPITAL = "decrease_capital"
    MAINTAIN_CAPITAL = "maintain_capital"
    REALLOCATE_CAPITAL = "reallocate_capital"
    EMERGENCY_HALT = "emergency_halt"

@dataclass
class CapitalFlowTransaction:
    """Capital flow transaction record"""
    transaction_id: str
    flow_direction: CapitalFlowDirection
    source_id: str
    source_type: str  # 'goal', 'farm', 'agent'
    target_id: str
    target_type: str  # 'goal', 'farm', 'agent'
    amount: Decimal
    reason: str
    strategy: CapitalAllocationStrategy
    goal_progress_data: Dict[str, Any]
    performance_data: Dict[str, Any]
    risk_data: Dict[str, Any]
    executed_at: datetime
    status: str  # 'pending', 'completed', 'failed'
    metadata: Dict[str, Any]

@dataclass
class GoalCapitalAllocation:
    """Goal-based capital allocation configuration"""
    goal_id: str
    goal_name: str
    target_allocation: Decimal
    current_allocation: Decimal
    allocation_strategy: CapitalAllocationStrategy
    performance_requirements: Dict[str, float]
    risk_limits: Dict[str, float]
    achievement_thresholds: Dict[str, float]
    assigned_farms: List[str]
    capital_flow_rules: Dict[str, Any]
    auto_reallocation_enabled: bool
    created_at: datetime
    updated_at: datetime

@dataclass
class FarmCapitalStatus:
    """Farm capital status and allocation"""
    farm_id: str
    assigned_from_goals: Dict[str, Decimal]  # goal_id -> amount
    total_capital: Decimal
    utilized_capital: Decimal
    available_capital: Decimal
    capital_efficiency: float
    performance_score: float
    agent_allocations: Dict[str, Decimal]  # agent_id -> amount
    last_reallocation: datetime
    reallocation_frequency: int  # hours

class GoalCapitalManager:
    """
    Manages intelligent capital flow between goals, farms, and agents
    Provides automatic capital allocation based on performance and goal achievement
    """
    
    def __init__(self):
        # Service dependencies
        self.db_service = None
        self.goals_service = None
        self.farms_service = None
        self.farm_agent_orchestrator = None
        self.performance_service = None
        self.risk_service = None
        self.event_service = None
        
        # Capital management state
        self.goal_allocations: Dict[str, GoalCapitalAllocation] = {}
        self.farm_capital_status: Dict[str, FarmCapitalStatus] = {}
        self.capital_transactions: List[CapitalFlowTransaction] = []
        self.pending_reallocations: List[Dict[str, Any]] = []
        
        # Capital flow rules and strategies
        self.allocation_strategies = {
            CapitalAllocationStrategy.PERFORMANCE_WEIGHTED: self._allocate_by_performance,
            CapitalAllocationStrategy.EQUAL_DISTRIBUTION: self._allocate_equally,
            CapitalAllocationStrategy.GOAL_PROGRESS_BASED: self._allocate_by_goal_progress,
            CapitalAllocationStrategy.RISK_ADJUSTED: self._allocate_risk_adjusted,
            CapitalAllocationStrategy.DYNAMIC_OPTIMIZATION: self._allocate_dynamically
        }
        
        # Configuration
        self.reallocation_interval = 3600  # 1 hour
        self.goal_review_interval = 14400  # 4 hours
        self.emergency_threshold = 0.05  # 5% loss threshold for emergency action
        self.performance_boost_threshold = 1.2  # 20% overperformance for capital increase
        
        # Capital limits and rules
        self.min_capital_per_farm = Decimal("1000")
        self.max_capital_per_farm = Decimal("100000")
        self.max_reallocation_per_hour = Decimal("10000")
        
        self.is_initialized = False
        
        logger.info("Goal-Capital Manager initialized")
    
    async def initialize(self):
        """Initialize the goal-capital manager"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.goals_service = registry.get_service("intelligent_goal_service")
            self.farms_service = registry.get_service("farms_service")
            self.farm_agent_orchestrator = registry.get_service("farm_agent_orchestrator")
            self.risk_service = registry.get_service("advanced_risk_management")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            
            # Initialize database tables
            if self.db_service:
                await self._create_capital_management_tables()
            
            # Load existing allocations and transactions
            await self._load_goal_allocations()
            await self._load_farm_capital_status()
            await self._load_recent_transactions()
            
            # Start background tasks
            asyncio.create_task(self._capital_reallocation_task())
            asyncio.create_task(self._goal_achievement_monitoring_task())
            asyncio.create_task(self._performance_based_adjustment_task())
            asyncio.create_task(self._risk_monitoring_task())
            
            self.is_initialized = True
            logger.info("Goal-Capital Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize goal-capital manager: {e}")
            raise
    
    async def create_goal_capital_allocation(self, allocation_data: Dict[str, Any]) -> GoalCapitalAllocation:
        """Create a new goal-based capital allocation"""
        try:
            allocation = GoalCapitalAllocation(
                goal_id=allocation_data['goal_id'],
                goal_name=allocation_data['goal_name'],
                target_allocation=Decimal(str(allocation_data['target_allocation'])),
                current_allocation=Decimal("0"),
                allocation_strategy=CapitalAllocationStrategy(allocation_data.get('allocation_strategy', 'performance_weighted')),
                performance_requirements=allocation_data.get('performance_requirements', {
                    'min_roi': 0.15,
                    'max_drawdown': 0.1,
                    'min_sharpe_ratio': 1.0
                }),
                risk_limits=allocation_data.get('risk_limits', {
                    'max_var': 0.05,
                    'max_concentration': 0.3,
                    'max_correlation': 0.7
                }),
                achievement_thresholds=allocation_data.get('achievement_thresholds', {
                    'target_progress': 0.8,
                    'overachievement': 1.2,
                    'underperformance': 0.6
                }),
                assigned_farms=allocation_data.get('assigned_farms', []),
                capital_flow_rules=allocation_data.get('capital_flow_rules', {}),
                auto_reallocation_enabled=allocation_data.get('auto_reallocation_enabled', True),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Store allocation
            self.goal_allocations[allocation.goal_id] = allocation
            
            # Persist to database
            if self.db_service:
                await self._persist_goal_allocation(allocation)
            
            # Initialize farm capital status for assigned farms
            for farm_id in allocation.assigned_farms:
                await self._initialize_farm_capital_status(farm_id, allocation.goal_id)
            
            # Perform initial capital allocation
            if allocation.target_allocation > 0:
                await self._perform_initial_capital_allocation(allocation)
            
            logger.info(f"Created goal capital allocation: {allocation.goal_name} - ${allocation.target_allocation}")
            return allocation
            
        except Exception as e:
            logger.error(f"Failed to create goal capital allocation: {e}")
            raise
    
    async def allocate_capital_to_farms(self, 
                                      goal_id: str, 
                                      amount: Decimal,
                                      allocation_strategy: Optional[CapitalAllocationStrategy] = None) -> List[CapitalFlowTransaction]:
        """Allocate capital from goal to assigned farms"""
        try:
            if goal_id not in self.goal_allocations:
                raise ValueError(f"Goal allocation {goal_id} not found")
            
            goal_allocation = self.goal_allocations[goal_id]
            
            if not goal_allocation.assigned_farms:
                raise ValueError(f"No farms assigned to goal {goal_id}")
            
            # Use specified strategy or goal's default strategy
            strategy = allocation_strategy or goal_allocation.allocation_strategy
            
            # Calculate farm allocations based on strategy
            farm_allocations = await self.allocation_strategies[strategy](
                goal_allocation, amount, goal_allocation.assigned_farms
            )
            
            # Execute capital transfers
            transactions = []
            for farm_id, farm_amount in farm_allocations.items():
                if farm_amount > 0:
                    transaction = await self._execute_capital_transfer(
                        source_id=goal_id,
                        source_type="goal",
                        target_id=farm_id,
                        target_type="farm",
                        amount=farm_amount,
                        reason=f"Goal-based allocation using {strategy.value} strategy",
                        strategy=strategy
                    )
                    transactions.append(transaction)
            
            # Update goal allocation
            goal_allocation.current_allocation += amount
            goal_allocation.updated_at = datetime.now(timezone.utc)
            
            # Persist updates
            if self.db_service:
                await self._persist_goal_allocation(goal_allocation)
            
            logger.info(f"Allocated ${amount} from goal {goal_id} to {len(farm_allocations)} farms")
            return transactions
            
        except Exception as e:
            logger.error(f"Failed to allocate capital to farms for goal {goal_id}: {e}")
            raise
    
    async def reallocate_based_on_performance(self, goal_id: str) -> List[CapitalFlowTransaction]:
        """Reallocate capital based on farm and agent performance"""
        try:
            if goal_id not in self.goal_allocations:
                raise ValueError(f"Goal allocation {goal_id} not found")
            
            goal_allocation = self.goal_allocations[goal_id]
            
            if not goal_allocation.auto_reallocation_enabled:
                logger.debug(f"Auto-reallocation disabled for goal {goal_id}")
                return []
            
            # Get performance data for all assigned farms
            farm_performance = {}
            total_performance_score = 0
            
            for farm_id in goal_allocation.assigned_farms:
                if self.farm_agent_orchestrator:
                    farm_status = await self.farm_agent_orchestrator.get_farm_agent_status(farm_id)
                    performance_score = farm_status.get('avg_performance_score', 0.5)
                    capital_efficiency = farm_status.get('avg_capital_utilization', 0.5)
                    
                    # Combined performance metric
                    combined_score = (performance_score * 0.7) + (capital_efficiency * 0.3)
                    farm_performance[farm_id] = combined_score
                    total_performance_score += combined_score
                else:
                    # Mock performance data
                    farm_performance[farm_id] = 0.6 + (hash(farm_id) % 40) / 100
                    total_performance_score += farm_performance[farm_id]
            
            if total_performance_score == 0:
                logger.warning(f"No performance data available for goal {goal_id} farms")
                return []
            
            # Calculate optimal capital distribution
            current_farm_capital = {}
            total_current_capital = Decimal("0")
            
            for farm_id in goal_allocation.assigned_farms:
                farm_status = self.farm_capital_status.get(farm_id)
                if farm_status:
                    farm_capital = farm_status.assigned_from_goals.get(goal_id, Decimal("0"))
                    current_farm_capital[farm_id] = farm_capital
                    total_current_capital += farm_capital
                else:
                    current_farm_capital[farm_id] = Decimal("0")
            
            # Calculate target allocations based on performance
            target_allocations = {}
            for farm_id, performance in farm_performance.items():
                performance_weight = performance / total_performance_score
                target_allocation = total_current_capital * Decimal(str(performance_weight))
                target_allocations[farm_id] = target_allocation
            
            # Execute reallocation transactions
            transactions = []
            reallocation_threshold = total_current_capital * Decimal("0.05")  # 5% threshold
            
            for farm_id in goal_allocation.assigned_farms:
                current_capital = current_farm_capital[farm_id]
                target_capital = target_allocations[farm_id]
                difference = target_capital - current_capital
                
                # Only reallocate if difference is significant
                if abs(difference) > reallocation_threshold:
                    if difference > 0:
                        # Need to allocate more capital to this farm
                        # Find farms with excess capital
                        for donor_farm_id in goal_allocation.assigned_farms:
                            if donor_farm_id != farm_id:
                                donor_current = current_farm_capital[donor_farm_id]
                                donor_target = target_allocations[donor_farm_id]
                                donor_excess = donor_current - donor_target
                                
                                if donor_excess > 0:
                                    transfer_amount = min(difference, donor_excess)
                                    
                                    # Execute transfer via goal (farm -> goal -> farm)
                                    transaction1 = await self._execute_capital_transfer(
                                        source_id=donor_farm_id,
                                        source_type="farm",
                                        target_id=goal_id,
                                        target_type="goal",
                                        amount=transfer_amount,
                                        reason="Performance-based reallocation (return to goal)",
                                        strategy=CapitalAllocationStrategy.PERFORMANCE_WEIGHTED
                                    )
                                    
                                    transaction2 = await self._execute_capital_transfer(
                                        source_id=goal_id,
                                        source_type="goal",
                                        target_id=farm_id,
                                        target_type="farm",
                                        amount=transfer_amount,
                                        reason="Performance-based reallocation (allocate to farm)",
                                        strategy=CapitalAllocationStrategy.PERFORMANCE_WEIGHTED
                                    )
                                    
                                    transactions.extend([transaction1, transaction2])
                                    
                                    # Update tracking
                                    current_farm_capital[donor_farm_id] -= transfer_amount
                                    current_farm_capital[farm_id] += transfer_amount
                                    difference -= transfer_amount
                                    
                                    if difference <= reallocation_threshold:
                                        break
            
            logger.info(f"Executed {len(transactions)} reallocation transactions for goal {goal_id}")
            return transactions
            
        except Exception as e:
            logger.error(f"Failed to reallocate based on performance for goal {goal_id}: {e}")
            return []
    
    async def handle_goal_achievement(self, goal_id: str, achievement_data: Dict[str, Any]) -> List[CapitalFlowTransaction]:
        """Handle capital flow when goal is achieved or missed"""
        try:
            if goal_id not in self.goal_allocations:
                logger.warning(f"Goal allocation {goal_id} not found for achievement handling")
                return []
            
            goal_allocation = self.goal_allocations[goal_id]
            progress_ratio = achievement_data.get('progress_ratio', 0.0)
            achievement_type = achievement_data.get('achievement_type', 'target_met')
            
            transactions = []
            
            # Determine action based on achievement level
            if progress_ratio >= goal_allocation.achievement_thresholds.get('overachievement', 1.2):
                # Overachievement - increase capital allocation
                action = GoalAchievementAction.INCREASE_CAPITAL
                increase_factor = min(1.5, 1.0 + (progress_ratio - 1.0))  # Cap at 50% increase
                additional_capital = goal_allocation.current_allocation * Decimal(str(increase_factor - 1.0))
                
                if additional_capital > 0:
                    allocation_transactions = await self.allocate_capital_to_farms(
                        goal_id, 
                        additional_capital,
                        CapitalAllocationStrategy.PERFORMANCE_WEIGHTED
                    )
                    transactions.extend(allocation_transactions)
                
                logger.info(f"Goal {goal_id} overachieved ({progress_ratio:.2%}), increased capital by ${additional_capital}")
                
            elif progress_ratio >= goal_allocation.achievement_thresholds.get('target_progress', 0.8):
                # Target achieved - maintain current allocation
                action = GoalAchievementAction.MAINTAIN_CAPITAL
                logger.info(f"Goal {goal_id} achieved target ({progress_ratio:.2%}), maintaining capital allocation")
                
            elif progress_ratio >= goal_allocation.achievement_thresholds.get('underperformance', 0.6):
                # Underperformance - reallocate capital
                action = GoalAchievementAction.REALLOCATE_CAPITAL
                reallocation_transactions = await self.reallocate_based_on_performance(goal_id)
                transactions.extend(reallocation_transactions)
                
                logger.info(f"Goal {goal_id} underperforming ({progress_ratio:.2%}), triggered reallocation")
                
            else:
                # Severe underperformance - decrease capital allocation
                action = GoalAchievementAction.DECREASE_CAPITAL
                reduction_factor = max(0.5, progress_ratio)  # Reduce capital proportionally, min 50%
                reduction_amount = goal_allocation.current_allocation * Decimal(str(1.0 - reduction_factor))
                
                # Return capital from farms to goal
                for farm_id in goal_allocation.assigned_farms:
                    farm_status = self.farm_capital_status.get(farm_id)
                    if farm_status:
                        farm_capital = farm_status.assigned_from_goals.get(goal_id, Decimal("0"))
                        reduction_per_farm = min(farm_capital, reduction_amount / len(goal_allocation.assigned_farms))
                        
                        if reduction_per_farm > 0:
                            transaction = await self._execute_capital_transfer(
                                source_id=farm_id,
                                source_type="farm",
                                target_id=goal_id,
                                target_type="goal",
                                amount=reduction_per_farm,
                                reason=f"Capital reduction due to severe underperformance ({progress_ratio:.2%})",
                                strategy=CapitalAllocationStrategy.RISK_ADJUSTED
                            )
                            transactions.append(transaction)
                
                logger.warning(f"Goal {goal_id} severely underperforming ({progress_ratio:.2%}), reduced capital by ${reduction_amount}")
            
            # Record achievement event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'goal.achievement_handled',
                    'goal_id': goal_id,
                    'progress_ratio': progress_ratio,
                    'achievement_type': achievement_type,
                    'action_taken': action.value,
                    'transactions_count': len(transactions),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            
            return transactions
            
        except Exception as e:
            logger.error(f"Failed to handle goal achievement for {goal_id}: {e}")
            return []
    
    async def _execute_capital_transfer(self,
                                      source_id: str,
                                      source_type: str,
                                      target_id: str,
                                      target_type: str,
                                      amount: Decimal,
                                      reason: str,
                                      strategy: CapitalAllocationStrategy) -> CapitalFlowTransaction:
        """Execute a capital transfer transaction"""
        try:
            # Create transaction record
            transaction = CapitalFlowTransaction(
                transaction_id=str(uuid.uuid4()),
                flow_direction=CapitalFlowDirection(f"{source_type}_to_{target_type}"),
                source_id=source_id,
                source_type=source_type,
                target_id=target_id,
                target_type=target_type,
                amount=amount,
                reason=reason,
                strategy=strategy,
                goal_progress_data={},
                performance_data={},
                risk_data={},
                executed_at=datetime.now(timezone.utc),
                status="completed",
                metadata={}
            )
            
            # Update capital tracking
            if source_type == "goal" and target_type == "farm":
                # Goal to farm allocation
                await self._update_farm_capital_from_goal(target_id, source_id, amount, "add")
                
            elif source_type == "farm" and target_type == "goal":
                # Farm to goal return
                await self._update_farm_capital_from_goal(source_id, target_id, amount, "subtract")
                
            elif source_type == "farm" and target_type == "agent":
                # Farm to agent allocation (handled by farm orchestrator)
                if self.farm_agent_orchestrator:
                    # This would trigger agent capital allocation
                    pass
            
            # Store transaction
            self.capital_transactions.append(transaction)
            
            # Persist to database
            if self.db_service:
                await self._persist_capital_transaction(transaction)
            
            # Emit transfer event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'capital.transfer_executed',
                    'transaction_id': transaction.transaction_id,
                    'flow_direction': transaction.flow_direction.value,
                    'source_id': source_id,
                    'source_type': source_type,
                    'target_id': target_id,
                    'target_type': target_type,
                    'amount': float(amount),
                    'reason': reason,
                    'timestamp': transaction.executed_at.isoformat()
                })
            
            logger.debug(f"Executed capital transfer: {source_type} {source_id} -> {target_type} {target_id}, amount: ${amount}")
            return transaction
            
        except Exception as e:
            logger.error(f"Failed to execute capital transfer: {e}")
            raise
    
    async def _update_farm_capital_from_goal(self, farm_id: str, goal_id: str, amount: Decimal, operation: str):
        """Update farm capital tracking from goal allocation"""
        try:
            if farm_id not in self.farm_capital_status:
                await self._initialize_farm_capital_status(farm_id, goal_id)
            
            farm_status = self.farm_capital_status[farm_id]
            
            if operation == "add":
                # Add capital from goal
                current_from_goal = farm_status.assigned_from_goals.get(goal_id, Decimal("0"))
                farm_status.assigned_from_goals[goal_id] = current_from_goal + amount
                farm_status.total_capital += amount
                farm_status.available_capital += amount
                
            elif operation == "subtract":
                # Return capital to goal
                current_from_goal = farm_status.assigned_from_goals.get(goal_id, Decimal("0"))
                reduction = min(current_from_goal, amount)
                farm_status.assigned_from_goals[goal_id] = current_from_goal - reduction
                farm_status.total_capital -= reduction
                farm_status.available_capital = max(Decimal("0"), farm_status.available_capital - reduction)
            
            # Update timestamp
            farm_status.last_reallocation = datetime.now(timezone.utc)
            
            # Persist updates
            if self.db_service:
                await self._persist_farm_capital_status(farm_status)
                
        except Exception as e:
            logger.error(f"Failed to update farm capital for {farm_id}: {e}")
    
    async def _allocate_by_performance(self, 
                                     goal_allocation: GoalCapitalAllocation, 
                                     total_amount: Decimal, 
                                     farm_ids: List[str]) -> Dict[str, Decimal]:
        """Allocate capital based on farm performance"""
        try:
            if not farm_ids:
                return {}
            
            # Get performance scores for all farms
            farm_performance = {}
            total_performance = 0
            
            for farm_id in farm_ids:
                if self.farm_agent_orchestrator:
                    farm_status = await self.farm_agent_orchestrator.get_farm_agent_status(farm_id)
                    performance_score = farm_status.get('avg_performance_score', 0.5)
                else:
                    # Mock performance
                    performance_score = 0.6 + (hash(farm_id) % 40) / 100
                
                farm_performance[farm_id] = performance_score
                total_performance += performance_score
            
            # Allocate proportionally to performance
            allocations = {}
            if total_performance > 0:
                for farm_id in farm_ids:
                    performance_weight = farm_performance[farm_id] / total_performance
                    allocation = total_amount * Decimal(str(performance_weight))
                    allocations[farm_id] = allocation
            else:
                # Equal allocation if no performance data
                equal_amount = total_amount / len(farm_ids)
                for farm_id in farm_ids:
                    allocations[farm_id] = equal_amount
            
            return allocations
            
        except Exception as e:
            logger.error(f"Failed to allocate by performance: {e}")
            return {}
    
    async def _allocate_equally(self, 
                              goal_allocation: GoalCapitalAllocation, 
                              total_amount: Decimal, 
                              farm_ids: List[str]) -> Dict[str, Decimal]:
        """Allocate capital equally among farms"""
        try:
            if not farm_ids:
                return {}
            
            equal_amount = total_amount / len(farm_ids)
            return {farm_id: equal_amount for farm_id in farm_ids}
            
        except Exception as e:
            logger.error(f"Failed to allocate equally: {e}")
            return {}
    
    async def _allocate_by_goal_progress(self, 
                                       goal_allocation: GoalCapitalAllocation, 
                                       total_amount: Decimal, 
                                       farm_ids: List[str]) -> Dict[str, Decimal]:
        """Allocate capital based on goal progress and contribution"""
        try:
            # This would integrate with goal service to get farm contributions
            # For now, use performance-based allocation
            return await self._allocate_by_performance(goal_allocation, total_amount, farm_ids)
            
        except Exception as e:
            logger.error(f"Failed to allocate by goal progress: {e}")
            return {}
    
    async def _allocate_risk_adjusted(self, 
                                    goal_allocation: GoalCapitalAllocation, 
                                    total_amount: Decimal, 
                                    farm_ids: List[str]) -> Dict[str, Decimal]:
        """Allocate capital with risk adjustment"""
        try:
            # Get risk-adjusted performance for each farm
            risk_adjusted_scores = {}
            total_risk_adjusted = 0
            
            for farm_id in farm_ids:
                # Get performance and risk data
                if self.farm_agent_orchestrator:
                    farm_status = await self.farm_agent_orchestrator.get_farm_agent_status(farm_id)
                    performance_score = farm_status.get('avg_performance_score', 0.5)
                else:
                    performance_score = 0.6 + (hash(farm_id) % 40) / 100
                
                # Mock risk adjustment (lower risk = higher score)
                risk_factor = 0.8 + (hash(farm_id) % 40) / 200  # 0.8 to 1.0
                risk_adjusted_score = performance_score * risk_factor
                
                risk_adjusted_scores[farm_id] = risk_adjusted_score
                total_risk_adjusted += risk_adjusted_score
            
            # Allocate based on risk-adjusted performance
            allocations = {}
            if total_risk_adjusted > 0:
                for farm_id in farm_ids:
                    weight = risk_adjusted_scores[farm_id] / total_risk_adjusted
                    allocation = total_amount * Decimal(str(weight))
                    allocations[farm_id] = allocation
            else:
                # Fallback to equal allocation
                equal_amount = total_amount / len(farm_ids)
                allocations = {farm_id: equal_amount for farm_id in farm_ids}
            
            return allocations
            
        except Exception as e:
            logger.error(f"Failed to allocate risk adjusted: {e}")
            return {}
    
    async def _allocate_dynamically(self, 
                                  goal_allocation: GoalCapitalAllocation, 
                                  total_amount: Decimal, 
                                  farm_ids: List[str]) -> Dict[str, Decimal]:
        """Dynamically optimize capital allocation"""
        try:
            # Combine multiple factors for optimal allocation
            allocations = {}
            total_score = 0
            
            # Calculate composite scores for each farm
            farm_scores = {}
            for farm_id in farm_ids:
                # Performance component (40%)
                if self.farm_agent_orchestrator:
                    farm_status = await self.farm_agent_orchestrator.get_farm_agent_status(farm_id)
                    performance_score = farm_status.get('avg_performance_score', 0.5)
                    capital_efficiency = farm_status.get('avg_capital_utilization', 0.5)
                else:
                    performance_score = 0.6 + (hash(farm_id) % 40) / 100
                    capital_efficiency = 0.7 + (hash(farm_id) % 30) / 100
                
                # Risk component (30%)
                risk_score = 0.8 + (hash(farm_id) % 40) / 200  # Mock risk score
                
                # Capacity component (30%)
                capacity_score = capital_efficiency
                
                # Composite score
                composite_score = (
                    performance_score * 0.4 +
                    risk_score * 0.3 +
                    capacity_score * 0.3
                )
                
                farm_scores[farm_id] = composite_score
                total_score += composite_score
            
            # Allocate based on composite scores
            if total_score > 0:
                for farm_id in farm_ids:
                    weight = farm_scores[farm_id] / total_score
                    allocation = total_amount * Decimal(str(weight))
                    allocations[farm_id] = allocation
            else:
                # Fallback to equal allocation
                equal_amount = total_amount / len(farm_ids)
                allocations = {farm_id: equal_amount for farm_id in farm_ids}
            
            return allocations
            
        except Exception as e:
            logger.error(f"Failed to allocate dynamically: {e}")
            return {}
    
    async def _capital_reallocation_task(self):
        """Periodic capital reallocation task"""
        while True:
            try:
                await asyncio.sleep(self.reallocation_interval)
                
                for goal_id in self.goal_allocations:
                    goal_allocation = self.goal_allocations[goal_id]
                    if goal_allocation.auto_reallocation_enabled:
                        await self.reallocate_based_on_performance(goal_id)
                
            except Exception as e:
                logger.error(f"Error in capital reallocation task: {e}")
    
    async def _goal_achievement_monitoring_task(self):
        """Monitor goal achievements and trigger capital adjustments"""
        while True:
            try:
                await asyncio.sleep(self.goal_review_interval)
                
                for goal_id in self.goal_allocations:
                    await self._check_goal_achievement(goal_id)
                
            except Exception as e:
                logger.error(f"Error in goal achievement monitoring task: {e}")
    
    async def _performance_based_adjustment_task(self):
        """Adjust capital based on performance metrics"""
        while True:
            try:
                await asyncio.sleep(7200)  # Check every 2 hours
                
                for goal_id in self.goal_allocations:
                    await self._evaluate_performance_adjustments(goal_id)
                
            except Exception as e:
                logger.error(f"Error in performance adjustment task: {e}")
    
    async def _risk_monitoring_task(self):
        """Monitor risk levels and trigger emergency actions if needed"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                for goal_id in self.goal_allocations:
                    await self._monitor_goal_risk_levels(goal_id)
                
            except Exception as e:
                logger.error(f"Error in risk monitoring task: {e}")
    
    async def _check_goal_achievement(self, goal_id: str):
        """Check goal achievement status and trigger actions"""
        try:
            if self.goals_service:
                # Get goal progress from goals service
                goal_progress = await self.goals_service.get_goal_progress(goal_id)
                
                if goal_progress:
                    progress_ratio = goal_progress.get('progress_ratio', 0.0)
                    
                    # Check if action is needed based on thresholds
                    goal_allocation = self.goal_allocations[goal_id]
                    
                    significant_change = False
                    if progress_ratio >= goal_allocation.achievement_thresholds.get('overachievement', 1.2):
                        significant_change = True
                    elif progress_ratio <= goal_allocation.achievement_thresholds.get('underperformance', 0.6):
                        significant_change = True
                    
                    if significant_change:
                        achievement_data = {
                            'progress_ratio': progress_ratio,
                            'achievement_type': 'progress_update',
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                        await self.handle_goal_achievement(goal_id, achievement_data)
            
        except Exception as e:
            logger.error(f"Failed to check goal achievement for {goal_id}: {e}")
    
    async def _evaluate_performance_adjustments(self, goal_id: str):
        """Evaluate if performance-based capital adjustments are needed"""
        try:
            goal_allocation = self.goal_allocations[goal_id]
            
            # Calculate aggregate performance across assigned farms
            total_performance = 0
            farm_count = len(goal_allocation.assigned_farms)
            
            if farm_count == 0:
                return
            
            for farm_id in goal_allocation.assigned_farms:
                if self.farm_agent_orchestrator:
                    farm_status = await self.farm_agent_orchestrator.get_farm_agent_status(farm_id)
                    performance_score = farm_status.get('avg_performance_score', 0.5)
                    total_performance += performance_score
                else:
                    total_performance += 0.6  # Mock performance
            
            avg_performance = total_performance / farm_count
            
            # Check if performance warrants capital adjustment
            if avg_performance >= self.performance_boost_threshold:
                # Outstanding performance - consider capital increase
                boost_factor = min(1.3, 1.0 + (avg_performance - 1.0) * 0.5)
                additional_capital = goal_allocation.current_allocation * Decimal(str(boost_factor - 1.0))
                
                if additional_capital > Decimal("100"):  # Minimum threshold
                    logger.info(f"Outstanding performance detected for goal {goal_id}, considering ${additional_capital} capital boost")
                    
                    # This would trigger external approval process in real implementation
                    # For now, just log the recommendation
            
            elif avg_performance <= (1.0 - self.emergency_threshold):
                # Poor performance - consider capital reduction
                logger.warning(f"Poor performance detected for goal {goal_id} (avg: {avg_performance:.2f})")
                
                # Trigger more frequent reallocation
                await self.reallocate_based_on_performance(goal_id)
        
        except Exception as e:
            logger.error(f"Failed to evaluate performance adjustments for {goal_id}: {e}")
    
    async def _monitor_goal_risk_levels(self, goal_id: str):
        """Monitor risk levels for goal and trigger emergency actions if needed"""
        try:
            goal_allocation = self.goal_allocations[goal_id]
            
            # Calculate aggregate risk across farms
            high_risk_farms = []
            
            for farm_id in goal_allocation.assigned_farms:
                farm_status = self.farm_capital_status.get(farm_id)
                if farm_status:
                    # Mock risk calculation
                    farm_risk_score = 0.3 + (hash(farm_id) % 70) / 100  # 0.3 to 1.0
                    
                    if farm_risk_score > 0.8:  # High risk threshold
                        high_risk_farms.append(farm_id)
            
            # If too many farms are high risk, trigger emergency reallocation
            if len(high_risk_farms) > len(goal_allocation.assigned_farms) * 0.5:
                logger.warning(f"High risk detected in {len(high_risk_farms)} farms for goal {goal_id}")
                
                # Trigger emergency reallocation away from high-risk farms
                await self._emergency_risk_reallocation(goal_id, high_risk_farms)
        
        except Exception as e:
            logger.error(f"Failed to monitor risk levels for {goal_id}: {e}")
    
    async def _emergency_risk_reallocation(self, goal_id: str, high_risk_farms: List[str]):
        """Perform emergency reallocation away from high-risk farms"""
        try:
            goal_allocation = self.goal_allocations[goal_id]
            safe_farms = [f for f in goal_allocation.assigned_farms if f not in high_risk_farms]
            
            if not safe_farms:
                logger.error(f"No safe farms available for emergency reallocation for goal {goal_id}")
                return
            
            # Calculate capital to move from high-risk farms
            total_to_move = Decimal("0")
            for farm_id in high_risk_farms:
                farm_status = self.farm_capital_status.get(farm_id)
                if farm_status:
                    farm_capital = farm_status.assigned_from_goals.get(goal_id, Decimal("0"))
                    # Move 50% of capital from high-risk farms
                    to_move = farm_capital * Decimal("0.5")
                    total_to_move += to_move
                    
                    # Return capital to goal
                    if to_move > 0:
                        await self._execute_capital_transfer(
                            source_id=farm_id,
                            source_type="farm",
                            target_id=goal_id,
                            target_type="goal",
                            amount=to_move,
                            reason="Emergency risk reallocation",
                            strategy=CapitalAllocationStrategy.RISK_ADJUSTED
                        )
            
            # Redistribute to safe farms
            if total_to_move > 0:
                safe_allocations = await self._allocate_risk_adjusted(
                    goal_allocation, total_to_move, safe_farms
                )
                
                for farm_id, amount in safe_allocations.items():
                    if amount > 0:
                        await self._execute_capital_transfer(
                            source_id=goal_id,
                            source_type="goal",
                            target_id=farm_id,
                            target_type="farm",
                            amount=amount,
                            reason="Emergency reallocation to safe farms",
                            strategy=CapitalAllocationStrategy.RISK_ADJUSTED
                        )
            
            # Emit emergency event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'capital.emergency_reallocation',
                    'goal_id': goal_id,
                    'high_risk_farms': high_risk_farms,
                    'safe_farms': safe_farms,
                    'amount_moved': float(total_to_move),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            
            logger.info(f"Emergency reallocation completed for goal {goal_id}: moved ${total_to_move}")
        
        except Exception as e:
            logger.error(f"Failed to perform emergency reallocation for {goal_id}: {e}")
    
    async def _perform_initial_capital_allocation(self, goal_allocation: GoalCapitalAllocation):
        """Perform initial capital allocation when goal is created"""
        try:
            if goal_allocation.assigned_farms and goal_allocation.target_allocation > 0:
                await self.allocate_capital_to_farms(
                    goal_allocation.goal_id,
                    goal_allocation.target_allocation,
                    goal_allocation.allocation_strategy
                )
        except Exception as e:
            logger.error(f"Failed to perform initial capital allocation: {e}")
    
    async def _initialize_farm_capital_status(self, farm_id: str, goal_id: str):
        """Initialize capital status tracking for a farm"""
        try:
            if farm_id not in self.farm_capital_status:
                self.farm_capital_status[farm_id] = FarmCapitalStatus(
                    farm_id=farm_id,
                    assigned_from_goals={},
                    total_capital=Decimal("0"),
                    utilized_capital=Decimal("0"),
                    available_capital=Decimal("0"),
                    capital_efficiency=0.0,
                    performance_score=0.0,
                    agent_allocations={},
                    last_reallocation=datetime.now(timezone.utc),
                    reallocation_frequency=24
                )
            
            # Ensure goal is tracked
            if goal_id not in self.farm_capital_status[farm_id].assigned_from_goals:
                self.farm_capital_status[farm_id].assigned_from_goals[goal_id] = Decimal("0")
        
        except Exception as e:
            logger.error(f"Failed to initialize farm capital status for {farm_id}: {e}")
    
    async def _create_capital_management_tables(self):
        """Create database tables for capital management"""
        try:
            # Goal capital allocations table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS goal_capital_allocations (
                    goal_id UUID PRIMARY KEY,
                    goal_name TEXT NOT NULL,
                    target_allocation DECIMAL(20, 2) NOT NULL,
                    current_allocation DECIMAL(20, 2) DEFAULT 0,
                    allocation_strategy TEXT NOT NULL,
                    performance_requirements JSONB,
                    risk_limits JSONB,
                    achievement_thresholds JSONB,
                    assigned_farms TEXT[],
                    capital_flow_rules JSONB,
                    auto_reallocation_enabled BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Farm capital status table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS farm_capital_status (
                    farm_id TEXT PRIMARY KEY,
                    assigned_from_goals JSONB NOT NULL DEFAULT '{}',
                    total_capital DECIMAL(20, 2) DEFAULT 0,
                    utilized_capital DECIMAL(20, 2) DEFAULT 0,
                    available_capital DECIMAL(20, 2) DEFAULT 0,
                    capital_efficiency REAL DEFAULT 0.0,
                    performance_score REAL DEFAULT 0.0,
                    agent_allocations JSONB DEFAULT '{}',
                    last_reallocation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    reallocation_frequency INTEGER DEFAULT 24
                )
            """)
            
            # Capital flow transactions table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS capital_flow_transactions (
                    transaction_id UUID PRIMARY KEY,
                    flow_direction TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    target_id TEXT NOT NULL,
                    target_type TEXT NOT NULL,
                    amount DECIMAL(20, 2) NOT NULL,
                    reason TEXT NOT NULL,
                    strategy TEXT NOT NULL,
                    goal_progress_data JSONB DEFAULT '{}',
                    performance_data JSONB DEFAULT '{}',
                    risk_data JSONB DEFAULT '{}',
                    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    status TEXT DEFAULT 'completed',
                    metadata JSONB DEFAULT '{}'
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_capital_transactions_source ON capital_flow_transactions(source_id, source_type);
                CREATE INDEX IF NOT EXISTS idx_capital_transactions_target ON capital_flow_transactions(target_id, target_type);
                CREATE INDEX IF NOT EXISTS idx_capital_transactions_executed_at ON capital_flow_transactions(executed_at);
                CREATE INDEX IF NOT EXISTS idx_farm_capital_reallocation ON farm_capital_status(last_reallocation);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create capital management tables: {e}")
            raise
    
    async def _load_goal_allocations(self):
        """Load existing goal allocations from database"""
        try:
            if not self.db_service:
                return
            
            allocations = await self.db_service.fetch_all(
                "SELECT * FROM goal_capital_allocations ORDER BY created_at"
            )
            
            for allocation_record in allocations:
                allocation = GoalCapitalAllocation(
                    goal_id=allocation_record['goal_id'],
                    goal_name=allocation_record['goal_name'],
                    target_allocation=Decimal(str(allocation_record['target_allocation'])),
                    current_allocation=Decimal(str(allocation_record['current_allocation'])),
                    allocation_strategy=CapitalAllocationStrategy(allocation_record['allocation_strategy']),
                    performance_requirements=allocation_record['performance_requirements'] or {},
                    risk_limits=allocation_record['risk_limits'] or {},
                    achievement_thresholds=allocation_record['achievement_thresholds'] or {},
                    assigned_farms=allocation_record['assigned_farms'] or [],
                    capital_flow_rules=allocation_record['capital_flow_rules'] or {},
                    auto_reallocation_enabled=allocation_record['auto_reallocation_enabled'],
                    created_at=allocation_record['created_at'],
                    updated_at=allocation_record['updated_at']
                )
                
                self.goal_allocations[allocation.goal_id] = allocation
            
            logger.info(f"Loaded {len(self.goal_allocations)} goal capital allocations")
            
        except Exception as e:
            logger.error(f"Failed to load goal allocations: {e}")
    
    async def _load_farm_capital_status(self):
        """Load existing farm capital status from database"""
        try:
            if not self.db_service:
                return
            
            statuses = await self.db_service.fetch_all(
                "SELECT * FROM farm_capital_status"
            )
            
            for status_record in statuses:
                status = FarmCapitalStatus(
                    farm_id=status_record['farm_id'],
                    assigned_from_goals={k: Decimal(str(v)) for k, v in (status_record['assigned_from_goals'] or {}).items()},
                    total_capital=Decimal(str(status_record['total_capital'])),
                    utilized_capital=Decimal(str(status_record['utilized_capital'])),
                    available_capital=Decimal(str(status_record['available_capital'])),
                    capital_efficiency=status_record['capital_efficiency'],
                    performance_score=status_record['performance_score'],
                    agent_allocations={k: Decimal(str(v)) for k, v in (status_record['agent_allocations'] or {}).items()},
                    last_reallocation=status_record['last_reallocation'],
                    reallocation_frequency=status_record['reallocation_frequency']
                )
                
                self.farm_capital_status[status.farm_id] = status
            
            logger.info(f"Loaded {len(self.farm_capital_status)} farm capital statuses")
            
        except Exception as e:
            logger.error(f"Failed to load farm capital status: {e}")
    
    async def _load_recent_transactions(self):
        """Load recent capital flow transactions"""
        try:
            if not self.db_service:
                return
            
            # Load transactions from last 7 days
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            transactions = await self.db_service.fetch_all(
                "SELECT * FROM capital_flow_transactions WHERE executed_at > %s ORDER BY executed_at DESC LIMIT 1000",
                (cutoff_date,)
            )
            
            self.capital_transactions = []
            for transaction_record in transactions:
                transaction = CapitalFlowTransaction(
                    transaction_id=transaction_record['transaction_id'],
                    flow_direction=CapitalFlowDirection(transaction_record['flow_direction']),
                    source_id=transaction_record['source_id'],
                    source_type=transaction_record['source_type'],
                    target_id=transaction_record['target_id'],
                    target_type=transaction_record['target_type'],
                    amount=Decimal(str(transaction_record['amount'])),
                    reason=transaction_record['reason'],
                    strategy=CapitalAllocationStrategy(transaction_record['strategy']),
                    goal_progress_data=transaction_record['goal_progress_data'] or {},
                    performance_data=transaction_record['performance_data'] or {},
                    risk_data=transaction_record['risk_data'] or {},
                    executed_at=transaction_record['executed_at'],
                    status=transaction_record['status'],
                    metadata=transaction_record['metadata'] or {}
                )
                
                self.capital_transactions.append(transaction)
            
            logger.info(f"Loaded {len(self.capital_transactions)} recent capital transactions")
            
        except Exception as e:
            logger.error(f"Failed to load recent transactions: {e}")
    
    async def _persist_goal_allocation(self, allocation: GoalCapitalAllocation):
        """Persist goal allocation to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO goal_capital_allocations (
                    goal_id, goal_name, target_allocation, current_allocation, allocation_strategy,
                    performance_requirements, risk_limits, achievement_thresholds, assigned_farms,
                    capital_flow_rules, auto_reallocation_enabled, created_at, updated_at
                ) VALUES (
                    %(goal_id)s, %(goal_name)s, %(target_allocation)s, %(current_allocation)s, %(allocation_strategy)s,
                    %(performance_requirements)s, %(risk_limits)s, %(achievement_thresholds)s, %(assigned_farms)s,
                    %(capital_flow_rules)s, %(auto_reallocation_enabled)s, %(created_at)s, %(updated_at)s
                ) ON CONFLICT (goal_id) DO UPDATE SET
                    goal_name = EXCLUDED.goal_name,
                    target_allocation = EXCLUDED.target_allocation,
                    current_allocation = EXCLUDED.current_allocation,
                    allocation_strategy = EXCLUDED.allocation_strategy,
                    performance_requirements = EXCLUDED.performance_requirements,
                    risk_limits = EXCLUDED.risk_limits,
                    achievement_thresholds = EXCLUDED.achievement_thresholds,
                    assigned_farms = EXCLUDED.assigned_farms,
                    capital_flow_rules = EXCLUDED.capital_flow_rules,
                    auto_reallocation_enabled = EXCLUDED.auto_reallocation_enabled,
                    updated_at = EXCLUDED.updated_at
            """, {
                'goal_id': allocation.goal_id,
                'goal_name': allocation.goal_name,
                'target_allocation': float(allocation.target_allocation),
                'current_allocation': float(allocation.current_allocation),
                'allocation_strategy': allocation.allocation_strategy.value,
                'performance_requirements': allocation.performance_requirements,
                'risk_limits': allocation.risk_limits,
                'achievement_thresholds': allocation.achievement_thresholds,
                'assigned_farms': allocation.assigned_farms,
                'capital_flow_rules': allocation.capital_flow_rules,
                'auto_reallocation_enabled': allocation.auto_reallocation_enabled,
                'created_at': allocation.created_at.isoformat(),
                'updated_at': allocation.updated_at.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to persist goal allocation {allocation.goal_id}: {e}")
    
    async def _persist_farm_capital_status(self, status: FarmCapitalStatus):
        """Persist farm capital status to database"""
        try:
            if not self.db_service:
                return
            
            # Convert Decimal values to float for JSON serialization
            assigned_from_goals_json = {k: float(v) for k, v in status.assigned_from_goals.items()}
            agent_allocations_json = {k: float(v) for k, v in status.agent_allocations.items()}
            
            await self.db_service.execute_query("""
                INSERT INTO farm_capital_status (
                    farm_id, assigned_from_goals, total_capital, utilized_capital, available_capital,
                    capital_efficiency, performance_score, agent_allocations, last_reallocation, reallocation_frequency
                ) VALUES (
                    %(farm_id)s, %(assigned_from_goals)s, %(total_capital)s, %(utilized_capital)s, %(available_capital)s,
                    %(capital_efficiency)s, %(performance_score)s, %(agent_allocations)s, %(last_reallocation)s, %(reallocation_frequency)s
                ) ON CONFLICT (farm_id) DO UPDATE SET
                    assigned_from_goals = EXCLUDED.assigned_from_goals,
                    total_capital = EXCLUDED.total_capital,
                    utilized_capital = EXCLUDED.utilized_capital,
                    available_capital = EXCLUDED.available_capital,
                    capital_efficiency = EXCLUDED.capital_efficiency,
                    performance_score = EXCLUDED.performance_score,
                    agent_allocations = EXCLUDED.agent_allocations,
                    last_reallocation = EXCLUDED.last_reallocation,
                    reallocation_frequency = EXCLUDED.reallocation_frequency
            """, {
                'farm_id': status.farm_id,
                'assigned_from_goals': assigned_from_goals_json,
                'total_capital': float(status.total_capital),
                'utilized_capital': float(status.utilized_capital),
                'available_capital': float(status.available_capital),
                'capital_efficiency': status.capital_efficiency,
                'performance_score': status.performance_score,
                'agent_allocations': agent_allocations_json,
                'last_reallocation': status.last_reallocation.isoformat(),
                'reallocation_frequency': status.reallocation_frequency
            })
            
        except Exception as e:
            logger.error(f"Failed to persist farm capital status {status.farm_id}: {e}")
    
    async def _persist_capital_transaction(self, transaction: CapitalFlowTransaction):
        """Persist capital transaction to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO capital_flow_transactions (
                    transaction_id, flow_direction, source_id, source_type, target_id, target_type,
                    amount, reason, strategy, goal_progress_data, performance_data, risk_data,
                    executed_at, status, metadata
                ) VALUES (
                    %(transaction_id)s, %(flow_direction)s, %(source_id)s, %(source_type)s, %(target_id)s, %(target_type)s,
                    %(amount)s, %(reason)s, %(strategy)s, %(goal_progress_data)s, %(performance_data)s, %(risk_data)s,
                    %(executed_at)s, %(status)s, %(metadata)s
                )
            """, {
                'transaction_id': transaction.transaction_id,
                'flow_direction': transaction.flow_direction.value,
                'source_id': transaction.source_id,
                'source_type': transaction.source_type,
                'target_id': transaction.target_id,
                'target_type': transaction.target_type,
                'amount': float(transaction.amount),
                'reason': transaction.reason,
                'strategy': transaction.strategy.value,
                'goal_progress_data': transaction.goal_progress_data,
                'performance_data': transaction.performance_data,
                'risk_data': transaction.risk_data,
                'executed_at': transaction.executed_at.isoformat(),
                'status': transaction.status,
                'metadata': transaction.metadata
            })
            
        except Exception as e:
            logger.error(f"Failed to persist capital transaction {transaction.transaction_id}: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "service": "goal_capital_manager",
            "initialized": self.is_initialized,
            "goal_allocations": len(self.goal_allocations),
            "farm_capital_tracking": len(self.farm_capital_status),
            "total_transactions": len(self.capital_transactions),
            "pending_reallocations": len(self.pending_reallocations),
            "reallocation_interval_hours": self.reallocation_interval / 3600,
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_goal_capital_manager():
    """Factory function to create GoalCapitalManager instance"""
    return GoalCapitalManager()