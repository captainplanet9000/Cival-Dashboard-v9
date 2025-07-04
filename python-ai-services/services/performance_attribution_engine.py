"""
Performance Attribution Engine Service
Provides multi-level performance tracking from agents to farms to goals
Tracks agent decisions → trade outcomes → farm attribution → goal progress
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
from collections import defaultdict

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class AttributionLevel(Enum):
    """Performance attribution levels"""
    AGENT = "agent"
    FARM = "farm"
    GOAL = "goal"
    PORTFOLIO = "portfolio"
    STRATEGY = "strategy"

class PerformanceMetric(Enum):
    """Performance metrics types"""
    TOTAL_RETURN = "total_return"
    SHARPE_RATIO = "sharpe_ratio"
    MAX_DRAWDOWN = "max_drawdown"
    WIN_RATE = "win_rate"
    PROFIT_FACTOR = "profit_factor"
    SORTINO_RATIO = "sortino_ratio"
    CALMAR_RATIO = "calmar_ratio"
    ALPHA = "alpha"
    BETA = "beta"
    INFORMATION_RATIO = "information_ratio"

class AttributionPeriod(Enum):
    """Attribution calculation periods"""
    REALTIME = "realtime"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

@dataclass
class AgentDecisionRecord:
    """Agent decision tracking record"""
    decision_id: str
    agent_id: str
    farm_id: str
    goal_id: str
    decision_type: str  # 'trade', 'rebalance', 'risk_adjustment'
    decision_data: Dict[str, Any]
    decision_timestamp: datetime
    confidence_score: float
    expected_return: Decimal
    risk_assessment: Dict[str, float]
    market_conditions: Dict[str, Any]
    execution_status: str  # 'pending', 'executed', 'failed', 'cancelled'
    
@dataclass
class TradeOutcome:
    """Trade execution outcome"""
    trade_id: str
    decision_id: str
    agent_id: str
    farm_id: str
    goal_id: str
    symbol: str
    side: str  # 'buy', 'sell'
    quantity: Decimal
    entry_price: Decimal
    exit_price: Optional[Decimal]
    realized_pnl: Decimal
    unrealized_pnl: Decimal
    fees: Decimal
    execution_time: datetime
    holding_period: Optional[timedelta]
    trade_status: str  # 'open', 'closed', 'cancelled'

@dataclass
class FarmAttribution:
    """Farm-level performance attribution"""
    farm_id: str
    goal_id: str
    period: AttributionPeriod
    period_start: datetime
    period_end: datetime
    total_return: Decimal
    attributed_return: Decimal
    capital_allocated: Decimal
    capital_utilized: Decimal
    agent_contributions: Dict[str, Decimal]  # agent_id -> contribution
    strategy_performance: Dict[str, Decimal]  # strategy -> performance
    risk_adjusted_return: Decimal
    attribution_confidence: float

@dataclass
class GoalProgressAttribution:
    """Goal progress attribution"""
    goal_id: str
    period: AttributionPeriod
    period_start: datetime
    period_end: datetime
    goal_target: Decimal
    current_progress: Decimal
    progress_change: Decimal
    farm_contributions: Dict[str, Decimal]  # farm_id -> contribution
    agent_contributions: Dict[str, Decimal]  # agent_id -> contribution
    strategy_contributions: Dict[str, Decimal]  # strategy -> contribution
    time_to_target: Optional[timedelta]
    achievement_probability: float

@dataclass
class PerformanceAttribution:
    """Complete performance attribution record"""
    attribution_id: str
    level: AttributionLevel
    entity_id: str  # agent_id, farm_id, goal_id
    period: AttributionPeriod
    period_start: datetime
    period_end: datetime
    metrics: Dict[PerformanceMetric, float]
    contributions: Dict[str, Decimal]
    risk_metrics: Dict[str, float]
    attribution_breakdown: Dict[str, Any]
    confidence_score: float
    calculated_at: datetime

class PerformanceAttributionEngine:
    """
    Multi-level performance attribution engine
    Tracks performance from individual agent decisions to overall goal achievement
    """
    
    def __init__(self):
        # Service dependencies
        self.db_service = None
        self.agent_coordinator = None
        self.farm_orchestrator = None
        self.goal_manager = None
        self.trading_service = None
        
        # Attribution tracking
        self.decision_records: Dict[str, AgentDecisionRecord] = {}
        self.trade_outcomes: Dict[str, TradeOutcome] = {}
        self.farm_attributions: Dict[str, List[FarmAttribution]] = defaultdict(list)
        self.goal_attributions: Dict[str, List[GoalProgressAttribution]] = defaultdict(list)
        
        # Performance calculations
        self.performance_cache: Dict[str, Dict[str, Any]] = {}
        self.attribution_cache: Dict[str, PerformanceAttribution] = {}
        
        # Background tasks
        self.background_tasks: Set[asyncio.Task] = set()
        self.is_running = False
        
    async def initialize(self):
        """Initialize the performance attribution engine"""
        try:
            registry = get_registry()
            
            # Get service dependencies
            self.db_service = registry.get_service("database_service")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            self.farm_orchestrator = registry.get_service("farm_agent_orchestrator")
            self.goal_manager = registry.get_service("goal_capital_manager")
            self.trading_service = registry.get_service("trading_service")
            
            # Create database tables
            await self._create_attribution_tables()
            
            # Start background tasks
            await self._start_background_tasks()
            
            self.is_running = True
            logger.info("Performance Attribution Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Performance Attribution Engine: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the performance attribution engine"""
        self.is_running = False
        
        # Cancel background tasks
        for task in self.background_tasks:
            task.cancel()
        
        await asyncio.gather(*self.background_tasks, return_exceptions=True)
        self.background_tasks.clear()
        
        logger.info("Performance Attribution Engine shutdown complete")
    
    async def record_agent_decision(self, decision: AgentDecisionRecord) -> bool:
        """Record an agent decision for attribution tracking"""
        try:
            # Store decision record
            self.decision_records[decision.decision_id] = decision
            
            # Store in database
            if self.db_service:
                await self.db_service.execute_query(
                    """
                    INSERT INTO agent_decision_records 
                    (decision_id, agent_id, farm_id, goal_id, decision_type, decision_data, 
                     decision_timestamp, confidence_score, expected_return, risk_assessment, 
                     market_conditions, execution_status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (decision_id) DO UPDATE SET
                    execution_status = EXCLUDED.execution_status
                    """,
                    decision.decision_id, decision.agent_id, decision.farm_id, decision.goal_id,
                    decision.decision_type, json.dumps(decision.decision_data),
                    decision.decision_timestamp, decision.confidence_score, decision.expected_return,
                    json.dumps(decision.risk_assessment), json.dumps(decision.market_conditions),
                    decision.execution_status
                )
            
            logger.info(f"Recorded agent decision: {decision.decision_id} for agent {decision.agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record agent decision {decision.decision_id}: {e}")
            return False
    
    async def record_trade_outcome(self, outcome: TradeOutcome) -> bool:
        """Record a trade outcome for attribution tracking"""
        try:
            # Store trade outcome
            self.trade_outcomes[outcome.trade_id] = outcome
            
            # Store in database
            if self.db_service:
                await self.db_service.execute_query(
                    """
                    INSERT INTO trade_outcomes 
                    (trade_id, decision_id, agent_id, farm_id, goal_id, symbol, side, quantity,
                     entry_price, exit_price, realized_pnl, unrealized_pnl, fees, execution_time,
                     holding_period, trade_status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    ON CONFLICT (trade_id) DO UPDATE SET
                    exit_price = EXCLUDED.exit_price,
                    realized_pnl = EXCLUDED.realized_pnl,
                    unrealized_pnl = EXCLUDED.unrealized_pnl,
                    trade_status = EXCLUDED.trade_status
                    """,
                    outcome.trade_id, outcome.decision_id, outcome.agent_id, outcome.farm_id,
                    outcome.goal_id, outcome.symbol, outcome.side, outcome.quantity,
                    outcome.entry_price, outcome.exit_price, outcome.realized_pnl,
                    outcome.unrealized_pnl, outcome.fees, outcome.execution_time,
                    outcome.holding_period, outcome.trade_status
                )
            
            # Trigger attribution calculation
            await self._trigger_attribution_calculation(outcome.agent_id, outcome.farm_id, outcome.goal_id)
            
            logger.info(f"Recorded trade outcome: {outcome.trade_id} for agent {outcome.agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record trade outcome {outcome.trade_id}: {e}")
            return False
    
    async def calculate_agent_attribution(self, agent_id: str, period: AttributionPeriod, 
                                        period_start: datetime, period_end: datetime) -> Optional[PerformanceAttribution]:
        """Calculate performance attribution for an agent"""
        try:
            # Get agent trades in period
            agent_trades = await self._get_agent_trades(agent_id, period_start, period_end)
            
            if not agent_trades:
                return None
            
            # Calculate performance metrics
            metrics = await self._calculate_agent_metrics(agent_trades)
            
            # Calculate contributions
            contributions = await self._calculate_agent_contributions(agent_id, agent_trades)
            
            # Calculate risk metrics
            risk_metrics = await self._calculate_risk_metrics(agent_trades)
            
            # Build attribution breakdown
            attribution_breakdown = {
                "total_trades": len(agent_trades),
                "winning_trades": len([t for t in agent_trades if t.realized_pnl > 0]),
                "losing_trades": len([t for t in agent_trades if t.realized_pnl < 0]),
                "total_pnl": sum(t.realized_pnl for t in agent_trades),
                "average_holding_period": self._calculate_average_holding_period(agent_trades),
                "strategy_breakdown": self._calculate_strategy_breakdown(agent_trades),
                "symbol_breakdown": self._calculate_symbol_breakdown(agent_trades)
            }
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(agent_trades, metrics)
            
            attribution = PerformanceAttribution(
                attribution_id=str(uuid.uuid4()),
                level=AttributionLevel.AGENT,
                entity_id=agent_id,
                period=period,
                period_start=period_start,
                period_end=period_end,
                metrics=metrics,
                contributions=contributions,
                risk_metrics=risk_metrics,
                attribution_breakdown=attribution_breakdown,
                confidence_score=confidence_score,
                calculated_at=datetime.now(timezone.utc)
            )
            
            # Cache attribution
            self.attribution_cache[f"{agent_id}_{period.value}"] = attribution
            
            # Store in database
            if self.db_service:
                await self._store_attribution(attribution)
            
            return attribution
            
        except Exception as e:
            logger.error(f"Failed to calculate agent attribution for {agent_id}: {e}")
            return None
    
    async def calculate_farm_attribution(self, farm_id: str, period: AttributionPeriod,
                                       period_start: datetime, period_end: datetime) -> Optional[FarmAttribution]:
        """Calculate performance attribution for a farm"""
        try:
            # Get farm agents
            farm_agents = await self._get_farm_agents(farm_id)
            
            if not farm_agents:
                return None
            
            # Calculate individual agent attributions
            agent_attributions = {}
            total_return = Decimal(0)
            
            for agent_id in farm_agents:
                agent_attr = await self.calculate_agent_attribution(agent_id, period, period_start, period_end)
                if agent_attr:
                    agent_attributions[agent_id] = agent_attr
                    total_return += agent_attr.contributions.get("total_pnl", Decimal(0))
            
            # Get farm capital allocation
            capital_allocated = await self._get_farm_capital_allocation(farm_id)
            capital_utilized = await self._get_farm_capital_utilization(farm_id)
            
            # Calculate agent contributions
            agent_contributions = {}
            for agent_id, attribution in agent_attributions.items():
                agent_contributions[agent_id] = attribution.contributions.get("total_pnl", Decimal(0))
            
            # Calculate strategy performance
            strategy_performance = await self._calculate_farm_strategy_performance(farm_id, period_start, period_end)
            
            # Calculate risk-adjusted return
            risk_adjusted_return = await self._calculate_risk_adjusted_return(total_return, capital_allocated)
            
            # Calculate attribution confidence
            attribution_confidence = self._calculate_farm_attribution_confidence(agent_attributions)
            
            # Get goal_id for this farm
            goal_id = await self._get_farm_goal_id(farm_id)
            
            farm_attribution = FarmAttribution(
                farm_id=farm_id,
                goal_id=goal_id,
                period=period,
                period_start=period_start,
                period_end=period_end,
                total_return=total_return,
                attributed_return=total_return,  # All return is attributed to agents
                capital_allocated=capital_allocated,
                capital_utilized=capital_utilized,
                agent_contributions=agent_contributions,
                strategy_performance=strategy_performance,
                risk_adjusted_return=risk_adjusted_return,
                attribution_confidence=attribution_confidence
            )
            
            # Store farm attribution
            self.farm_attributions[farm_id].append(farm_attribution)
            
            # Store in database
            if self.db_service:
                await self._store_farm_attribution(farm_attribution)
            
            return farm_attribution
            
        except Exception as e:
            logger.error(f"Failed to calculate farm attribution for {farm_id}: {e}")
            return None
    
    async def calculate_goal_attribution(self, goal_id: str, period: AttributionPeriod,
                                       period_start: datetime, period_end: datetime) -> Optional[GoalProgressAttribution]:
        """Calculate performance attribution for a goal"""
        try:
            # Get goal farms
            goal_farms = await self._get_goal_farms(goal_id)
            
            if not goal_farms:
                return None
            
            # Calculate farm attributions
            farm_attributions = {}
            total_progress_change = Decimal(0)
            
            for farm_id in goal_farms:
                farm_attr = await self.calculate_farm_attribution(farm_id, period, period_start, period_end)
                if farm_attr:
                    farm_attributions[farm_id] = farm_attr
                    total_progress_change += farm_attr.total_return
            
            # Get goal information
            goal_info = await self._get_goal_info(goal_id)
            goal_target = goal_info.get("target_value", Decimal(0))
            current_progress = goal_info.get("current_value", Decimal(0))
            
            # Calculate farm contributions
            farm_contributions = {}
            for farm_id, attribution in farm_attributions.items():
                farm_contributions[farm_id] = attribution.total_return
            
            # Calculate agent contributions across all farms
            agent_contributions = {}
            for farm_attr in farm_attributions.values():
                for agent_id, contribution in farm_attr.agent_contributions.items():
                    agent_contributions[agent_id] = agent_contributions.get(agent_id, Decimal(0)) + contribution
            
            # Calculate strategy contributions
            strategy_contributions = {}
            for farm_attr in farm_attributions.values():
                for strategy, performance in farm_attr.strategy_performance.items():
                    strategy_contributions[strategy] = strategy_contributions.get(strategy, Decimal(0)) + performance
            
            # Calculate time to target
            time_to_target = await self._calculate_time_to_target(goal_id, current_progress, goal_target, total_progress_change)
            
            # Calculate achievement probability
            achievement_probability = await self._calculate_achievement_probability(goal_id, current_progress, goal_target, farm_attributions)
            
            goal_attribution = GoalProgressAttribution(
                goal_id=goal_id,
                period=period,
                period_start=period_start,
                period_end=period_end,
                goal_target=goal_target,
                current_progress=current_progress,
                progress_change=total_progress_change,
                farm_contributions=farm_contributions,
                agent_contributions=agent_contributions,
                strategy_contributions=strategy_contributions,
                time_to_target=time_to_target,
                achievement_probability=achievement_probability
            )
            
            # Store goal attribution
            self.goal_attributions[goal_id].append(goal_attribution)
            
            # Store in database
            if self.db_service:
                await self._store_goal_attribution(goal_attribution)
            
            return goal_attribution
            
        except Exception as e:
            logger.error(f"Failed to calculate goal attribution for {goal_id}: {e}")
            return None
    
    async def get_multi_level_attribution(self, entity_id: str, level: AttributionLevel,
                                        period: AttributionPeriod, lookback_days: int = 30) -> Dict[str, Any]:
        """Get multi-level attribution analysis"""
        try:
            period_end = datetime.now(timezone.utc)
            period_start = period_end - timedelta(days=lookback_days)
            
            result = {
                "entity_id": entity_id,
                "level": level.value,
                "period": period.value,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "attribution_levels": {}
            }
            
            if level == AttributionLevel.AGENT:
                # Get agent attribution
                agent_attr = await self.calculate_agent_attribution(entity_id, period, period_start, period_end)
                if agent_attr:
                    result["attribution_levels"]["agent"] = asdict(agent_attr)
                
                # Get parent farm attribution
                farm_id = await self._get_agent_farm_id(entity_id)
                if farm_id:
                    farm_attr = await self.calculate_farm_attribution(farm_id, period, period_start, period_end)
                    if farm_attr:
                        result["attribution_levels"]["farm"] = asdict(farm_attr)
                    
                    # Get parent goal attribution
                    goal_id = await self._get_farm_goal_id(farm_id)
                    if goal_id:
                        goal_attr = await self.calculate_goal_attribution(goal_id, period, period_start, period_end)
                        if goal_attr:
                            result["attribution_levels"]["goal"] = asdict(goal_attr)
            
            elif level == AttributionLevel.FARM:
                # Get farm attribution
                farm_attr = await self.calculate_farm_attribution(entity_id, period, period_start, period_end)
                if farm_attr:
                    result["attribution_levels"]["farm"] = asdict(farm_attr)
                    
                    # Get child agent attributions
                    agent_attrs = {}
                    for agent_id in farm_attr.agent_contributions.keys():
                        agent_attr = await self.calculate_agent_attribution(agent_id, period, period_start, period_end)
                        if agent_attr:
                            agent_attrs[agent_id] = asdict(agent_attr)
                    result["attribution_levels"]["agents"] = agent_attrs
                
                # Get parent goal attribution
                goal_id = await self._get_farm_goal_id(entity_id)
                if goal_id:
                    goal_attr = await self.calculate_goal_attribution(goal_id, period, period_start, period_end)
                    if goal_attr:
                        result["attribution_levels"]["goal"] = asdict(goal_attr)
            
            elif level == AttributionLevel.GOAL:
                # Get goal attribution
                goal_attr = await self.calculate_goal_attribution(entity_id, period, period_start, period_end)
                if goal_attr:
                    result["attribution_levels"]["goal"] = asdict(goal_attr)
                    
                    # Get child farm attributions
                    farm_attrs = {}
                    for farm_id in goal_attr.farm_contributions.keys():
                        farm_attr = await self.calculate_farm_attribution(farm_id, period, period_start, period_end)
                        if farm_attr:
                            farm_attrs[farm_id] = asdict(farm_attr)
                    result["attribution_levels"]["farms"] = farm_attrs
                    
                    # Get child agent attributions
                    agent_attrs = {}
                    for agent_id in goal_attr.agent_contributions.keys():
                        agent_attr = await self.calculate_agent_attribution(agent_id, period, period_start, period_end)
                        if agent_attr:
                            agent_attrs[agent_id] = asdict(agent_attr)
                    result["attribution_levels"]["agents"] = agent_attrs
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get multi-level attribution for {entity_id}: {e}")
            return {"error": str(e)}
    
    async def get_performance_ranking(self, level: AttributionLevel, period: AttributionPeriod,
                                    metric: PerformanceMetric, lookback_days: int = 30) -> List[Dict[str, Any]]:
        """Get performance ranking for entities at a specific level"""
        try:
            period_end = datetime.now(timezone.utc)
            period_start = period_end - timedelta(days=lookback_days)
            
            # Get all entities at the specified level
            entities = await self._get_entities_by_level(level)
            
            ranking = []
            for entity_id in entities:
                if level == AttributionLevel.AGENT:
                    attr = await self.calculate_agent_attribution(entity_id, period, period_start, period_end)
                elif level == AttributionLevel.FARM:
                    attr = await self.calculate_farm_attribution(entity_id, period, period_start, period_end)
                elif level == AttributionLevel.GOAL:
                    attr = await self.calculate_goal_attribution(entity_id, period, period_start, period_end)
                
                if attr:
                    metric_value = attr.metrics.get(metric, 0.0) if hasattr(attr, 'metrics') else 0.0
                    ranking.append({
                        "entity_id": entity_id,
                        "level": level.value,
                        "metric": metric.value,
                        "value": metric_value,
                        "confidence": attr.confidence_score if hasattr(attr, 'confidence_score') else 0.0
                    })
            
            # Sort by metric value (descending)
            ranking.sort(key=lambda x: x["value"], reverse=True)
            
            # Add ranks
            for i, item in enumerate(ranking):
                item["rank"] = i + 1
            
            return ranking
            
        except Exception as e:
            logger.error(f"Failed to get performance ranking: {e}")
            return []
    
    # Background tasks
    async def _start_background_tasks(self):
        """Start background tasks for performance attribution"""
        if self.background_tasks:
            return
        
        # Real-time attribution calculation
        task1 = asyncio.create_task(self._realtime_attribution_task())
        self.background_tasks.add(task1)
        
        # Hourly attribution calculation
        task2 = asyncio.create_task(self._hourly_attribution_task())
        self.background_tasks.add(task2)
        
        # Daily attribution calculation
        task3 = asyncio.create_task(self._daily_attribution_task())
        self.background_tasks.add(task3)
        
        # Performance ranking updates
        task4 = asyncio.create_task(self._ranking_update_task())
        self.background_tasks.add(task4)
        
        # Attribution cache cleanup
        task5 = asyncio.create_task(self._cache_cleanup_task())
        self.background_tasks.add(task5)
    
    async def _realtime_attribution_task(self):
        """Real-time attribution calculation task"""
        while self.is_running:
            try:
                # Calculate attribution for recently updated entities
                await self._calculate_realtime_attributions()
                await asyncio.sleep(60)  # Run every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in realtime attribution task: {e}")
                await asyncio.sleep(60)
    
    async def _hourly_attribution_task(self):
        """Hourly attribution calculation task"""
        while self.is_running:
            try:
                # Calculate hourly attributions
                await self._calculate_hourly_attributions()
                await asyncio.sleep(3600)  # Run every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in hourly attribution task: {e}")
                await asyncio.sleep(3600)
    
    async def _daily_attribution_task(self):
        """Daily attribution calculation task"""
        while self.is_running:
            try:
                # Calculate daily attributions
                await self._calculate_daily_attributions()
                await asyncio.sleep(86400)  # Run every day
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in daily attribution task: {e}")
                await asyncio.sleep(86400)
    
    async def _ranking_update_task(self):
        """Performance ranking update task"""
        while self.is_running:
            try:
                # Update performance rankings
                await self._update_performance_rankings()
                await asyncio.sleep(1800)  # Run every 30 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in ranking update task: {e}")
                await asyncio.sleep(1800)
    
    async def _cache_cleanup_task(self):
        """Attribution cache cleanup task"""
        while self.is_running:
            try:
                # Clean up old cache entries
                await self._cleanup_attribution_cache()
                await asyncio.sleep(3600)  # Run every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cache cleanup task: {e}")
                await asyncio.sleep(3600)
    
    # Database operations
    async def _create_attribution_tables(self):
        """Create database tables for performance attribution"""
        if not self.db_service:
            return
        
        try:
            # Agent decision records table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS agent_decision_records (
                    decision_id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    farm_id TEXT NOT NULL,
                    goal_id TEXT NOT NULL,
                    decision_type TEXT NOT NULL,
                    decision_data JSONB,
                    decision_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    confidence_score REAL NOT NULL,
                    expected_return DECIMAL,
                    risk_assessment JSONB,
                    market_conditions JSONB,
                    execution_status TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Trade outcomes table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS trade_outcomes (
                    trade_id TEXT PRIMARY KEY,
                    decision_id TEXT REFERENCES agent_decision_records(decision_id),
                    agent_id TEXT NOT NULL,
                    farm_id TEXT NOT NULL,
                    goal_id TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    quantity DECIMAL NOT NULL,
                    entry_price DECIMAL NOT NULL,
                    exit_price DECIMAL,
                    realized_pnl DECIMAL DEFAULT 0,
                    unrealized_pnl DECIMAL DEFAULT 0,
                    fees DECIMAL DEFAULT 0,
                    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    holding_period INTERVAL,
                    trade_status TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Performance attributions table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS performance_attributions (
                    attribution_id TEXT PRIMARY KEY,
                    level TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    period TEXT NOT NULL,
                    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
                    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
                    metrics JSONB,
                    contributions JSONB,
                    risk_metrics JSONB,
                    attribution_breakdown JSONB,
                    confidence_score REAL,
                    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Farm attributions table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS farm_attributions (
                    id SERIAL PRIMARY KEY,
                    farm_id TEXT NOT NULL,
                    goal_id TEXT NOT NULL,
                    period TEXT NOT NULL,
                    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
                    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
                    total_return DECIMAL,
                    attributed_return DECIMAL,
                    capital_allocated DECIMAL,
                    capital_utilized DECIMAL,
                    agent_contributions JSONB,
                    strategy_performance JSONB,
                    risk_adjusted_return DECIMAL,
                    attribution_confidence REAL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Goal attributions table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS goal_attributions (
                    id SERIAL PRIMARY KEY,
                    goal_id TEXT NOT NULL,
                    period TEXT NOT NULL,
                    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
                    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
                    goal_target DECIMAL,
                    current_progress DECIMAL,
                    progress_change DECIMAL,
                    farm_contributions JSONB,
                    agent_contributions JSONB,
                    strategy_contributions JSONB,
                    time_to_target INTERVAL,
                    achievement_probability REAL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_id ON agent_decision_records(agent_id);
                CREATE INDEX IF NOT EXISTS idx_agent_decisions_farm_id ON agent_decision_records(farm_id);
                CREATE INDEX IF NOT EXISTS idx_agent_decisions_goal_id ON agent_decision_records(goal_id);
                CREATE INDEX IF NOT EXISTS idx_agent_decisions_timestamp ON agent_decision_records(decision_timestamp);
                
                CREATE INDEX IF NOT EXISTS idx_trade_outcomes_agent_id ON trade_outcomes(agent_id);
                CREATE INDEX IF NOT EXISTS idx_trade_outcomes_farm_id ON trade_outcomes(farm_id);
                CREATE INDEX IF NOT EXISTS idx_trade_outcomes_goal_id ON trade_outcomes(goal_id);
                CREATE INDEX IF NOT EXISTS idx_trade_outcomes_execution_time ON trade_outcomes(execution_time);
                
                CREATE INDEX IF NOT EXISTS idx_performance_attributions_entity_id ON performance_attributions(entity_id);
                CREATE INDEX IF NOT EXISTS idx_performance_attributions_level ON performance_attributions(level);
                CREATE INDEX IF NOT EXISTS idx_performance_attributions_period ON performance_attributions(period);
                
                CREATE INDEX IF NOT EXISTS idx_farm_attributions_farm_id ON farm_attributions(farm_id);
                CREATE INDEX IF NOT EXISTS idx_farm_attributions_goal_id ON farm_attributions(goal_id);
                
                CREATE INDEX IF NOT EXISTS idx_goal_attributions_goal_id ON goal_attributions(goal_id);
            """)
            
            logger.info("Performance attribution tables created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create attribution tables: {e}")
            raise
    
    # Helper methods for calculations
    async def _calculate_agent_metrics(self, trades: List[TradeOutcome]) -> Dict[PerformanceMetric, float]:
        """Calculate performance metrics for an agent"""
        if not trades:
            return {}
        
        # Calculate basic metrics
        total_pnl = sum(trade.realized_pnl for trade in trades)
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t.realized_pnl > 0])
        losing_trades = len([t for t in trades if t.realized_pnl < 0])
        
        # Win rate
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        # Profit factor
        gross_profit = sum(t.realized_pnl for t in trades if t.realized_pnl > 0)
        gross_loss = abs(sum(t.realized_pnl for t in trades if t.realized_pnl < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Calculate returns for ratio calculations
        returns = [float(trade.realized_pnl) for trade in trades]
        
        # Sharpe ratio (assuming risk-free rate of 0)
        sharpe_ratio = np.mean(returns) / np.std(returns) if len(returns) > 1 and np.std(returns) > 0 else 0
        
        # Maximum drawdown
        cumulative_pnl = np.cumsum(returns)
        running_max = np.maximum.accumulate(cumulative_pnl)
        drawdown = cumulative_pnl - running_max
        max_drawdown = abs(min(drawdown)) if len(drawdown) > 0 else 0
        
        # Sortino ratio (downside deviation)
        negative_returns = [r for r in returns if r < 0]
        downside_deviation = np.std(negative_returns) if len(negative_returns) > 1 else 0
        sortino_ratio = np.mean(returns) / downside_deviation if downside_deviation > 0 else 0
        
        # Calmar ratio
        calmar_ratio = np.mean(returns) / max_drawdown if max_drawdown > 0 else 0
        
        return {
            PerformanceMetric.TOTAL_RETURN: float(total_pnl),
            PerformanceMetric.WIN_RATE: win_rate,
            PerformanceMetric.PROFIT_FACTOR: profit_factor,
            PerformanceMetric.SHARPE_RATIO: sharpe_ratio,
            PerformanceMetric.MAX_DRAWDOWN: max_drawdown,
            PerformanceMetric.SORTINO_RATIO: sortino_ratio,
            PerformanceMetric.CALMAR_RATIO: calmar_ratio
        }
    
    async def _calculate_agent_contributions(self, agent_id: str, trades: List[TradeOutcome]) -> Dict[str, Decimal]:
        """Calculate agent contributions breakdown"""
        total_pnl = sum(trade.realized_pnl for trade in trades)
        total_fees = sum(trade.fees for trade in trades)
        
        return {
            "total_pnl": total_pnl,
            "gross_pnl": total_pnl + total_fees,
            "total_fees": total_fees,
            "trade_count": Decimal(len(trades))
        }
    
    async def _calculate_risk_metrics(self, trades: List[TradeOutcome]) -> Dict[str, float]:
        """Calculate risk metrics for trades"""
        if not trades:
            return {}
        
        returns = [float(trade.realized_pnl) for trade in trades]
        
        return {
            "volatility": np.std(returns) if len(returns) > 1 else 0,
            "skewness": float(np.mean([(r - np.mean(returns))**3 for r in returns]) / (np.std(returns)**3)) if len(returns) > 1 and np.std(returns) > 0 else 0,
            "kurtosis": float(np.mean([(r - np.mean(returns))**4 for r in returns]) / (np.std(returns)**4)) if len(returns) > 1 and np.std(returns) > 0 else 0,
            "var_95": float(np.percentile(returns, 5)) if len(returns) > 0 else 0,
            "cvar_95": float(np.mean([r for r in returns if r <= np.percentile(returns, 5)])) if len(returns) > 0 else 0
        }
    
    def _calculate_confidence_score(self, trades: List[TradeOutcome], metrics: Dict[PerformanceMetric, float]) -> float:
        """Calculate confidence score for attribution"""
        if not trades:
            return 0.0
        
        # Base confidence on trade count
        trade_count_score = min(len(trades) / 100, 1.0)  # Max confidence at 100 trades
        
        # Confidence based on win rate consistency
        win_rate = metrics.get(PerformanceMetric.WIN_RATE, 0)
        win_rate_score = 1.0 - abs(win_rate - 0.5) * 2  # Penalize extreme win rates
        
        # Confidence based on profit factor
        profit_factor = metrics.get(PerformanceMetric.PROFIT_FACTOR, 0)
        profit_factor_score = min(profit_factor / 2, 1.0) if profit_factor > 0 else 0
        
        # Combined confidence score
        confidence = (trade_count_score * 0.4 + win_rate_score * 0.3 + profit_factor_score * 0.3)
        
        return max(0.0, min(1.0, confidence))
    
    # Additional helper methods would continue here...
    # (Due to length constraints, I'm showing the core structure)
    
    async def _trigger_attribution_calculation(self, agent_id: str, farm_id: str, goal_id: str):
        """Trigger attribution calculation for updated entities"""
        # This would trigger real-time calculations
        pass
    
    async def _get_agent_trades(self, agent_id: str, start_time: datetime, end_time: datetime) -> List[TradeOutcome]:
        """Get agent trades in time period"""
        # Query database for agent trades
        return []
    
    async def _get_farm_agents(self, farm_id: str) -> List[str]:
        """Get agents assigned to a farm"""
        return []
    
    async def _get_goal_farms(self, goal_id: str) -> List[str]:
        """Get farms assigned to a goal"""
        return []
    
    # ... (Additional helper methods would continue)