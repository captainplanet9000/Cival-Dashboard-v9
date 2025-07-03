"""
Autonomous Agent Funding Service - Phase 2
Automated funding allocation to agents based on performance and opportunity assessment
Integrates with Master Wallet and Real-Time Price Aggregation for optimal capital distribution
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from dataclasses import dataclass, asdict
from enum import Enum
import json

from ..core.service_registry import get_registry
from .universal_dex_aggregator import Chain, DEXProtocol
from .realtime_price_aggregator import AggregatedPrice

logger = logging.getLogger(__name__)

class FundingStrategy(Enum):
    """Funding allocation strategies"""
    PERFORMANCE_BASED = "performance_based"
    EQUAL_ALLOCATION = "equal_allocation"
    OPPORTUNITY_WEIGHTED = "opportunity_weighted"
    RISK_ADJUSTED = "risk_adjusted"
    KELLY_CRITERION = "kelly_criterion"

class AgentStatus(Enum):
    """Agent operational status"""
    ACTIVE = "active"
    PAUSED = "paused"
    STOPPED = "stopped"
    FUNDING_REQUESTED = "funding_requested"
    INSUFFICIENT_FUNDS = "insufficient_funds"

@dataclass
class AgentPerformanceMetrics:
    """Agent performance metrics for funding decisions"""
    agent_id: str
    total_return: Decimal
    daily_return: Decimal
    weekly_return: Decimal
    sharpe_ratio: Decimal
    max_drawdown: Decimal
    win_rate: Decimal
    trade_count: int
    avg_trade_size: Decimal
    volatility: Decimal
    calmar_ratio: Decimal
    sortino_ratio: Decimal
    last_updated: datetime

@dataclass
class FundingRequest:
    """Agent funding request"""
    agent_id: str
    requested_amount: Decimal
    reason: str
    urgency: str  # "low", "medium", "high", "critical"
    strategy_type: str
    expected_return: Decimal
    risk_level: Decimal
    holding_period: timedelta
    created_at: datetime
    approved: bool = False
    approved_amount: Optional[Decimal] = None

@dataclass
class FundingAllocation:
    """Funding allocation result"""
    agent_id: str
    allocated_amount: Decimal
    funding_strategy: FundingStrategy
    allocation_reason: str
    performance_score: Decimal
    risk_score: Decimal
    opportunity_score: Decimal
    timestamp: datetime
    conditions: Dict[str, Any]

@dataclass
class AgentCapitalStatus:
    """Agent's current capital status"""
    agent_id: str
    total_allocated: Decimal
    available_balance: Decimal
    deployed_capital: Decimal
    reserved_funds: Decimal
    pnl_unrealized: Decimal
    pnl_realized: Decimal
    utilization_rate: Decimal
    last_funding: Optional[datetime]
    funding_requests: List[FundingRequest]

class AutonomousAgentFunding:
    """
    Autonomous agent funding system with intelligent capital allocation
    """
    
    def __init__(self, master_wallet_address: str = None):
        self.master_wallet_address = master_wallet_address or "0x1234567890abcdef"
        self.funding_strategies = {}
        self.agent_performance_cache = {}
        self.funding_history = []
        self.active_requests = []
        self.allocation_rules = self._initialize_allocation_rules()
        
        # Performance tracking
        self.total_funds_allocated = Decimal(0)
        self.successful_allocations = 0
        self.failed_allocations = 0
        
        logger.info("Autonomous Agent Funding service initialized")
    
    def _initialize_allocation_rules(self) -> Dict[str, Any]:
        """Initialize funding allocation rules"""
        return {
            "min_sharpe_ratio": 1.0,
            "max_drawdown_threshold": 0.15,  # 15%
            "min_win_rate": 0.55,  # 55%
            "min_trade_count": 10,
            "max_allocation_per_agent": Decimal(100000),  # $100K max
            "min_allocation_amount": Decimal(1000),  # $1K min
            "performance_lookback_days": 30,
            "max_daily_allocation": Decimal(500000),  # $500K daily limit
            "emergency_reserve_ratio": 0.20,  # 20% reserve
            "high_performers_bonus": 1.5,  # 1.5x allocation for top performers
            "risk_adjustment_factor": 0.8,  # Reduce allocation by 20% for high risk
        }
    
    async def request_funding(self, 
                            agent_id: str,
                            amount: Decimal,
                            reason: str,
                            urgency: str = "medium",
                            strategy_type: str = "general",
                            expected_return: Decimal = None,
                            risk_level: Decimal = None) -> str:
        """Submit funding request from an agent"""
        
        request = FundingRequest(
            agent_id=agent_id,
            requested_amount=amount,
            reason=reason,
            urgency=urgency,
            strategy_type=strategy_type,
            expected_return=expected_return or Decimal(0.05),  # 5% default
            risk_level=risk_level or Decimal(0.3),  # 30% default risk
            holding_period=timedelta(hours=24),  # Default 24h holding
            created_at=datetime.now(timezone.utc)
        )
        
        self.active_requests.append(request)
        
        # Auto-process if criteria met
        if urgency == "critical":
            await self._process_critical_request(request)
        elif urgency == "high":
            # Process within 5 minutes
            asyncio.create_task(self._delayed_processing(request, 300))
        
        logger.info(f"Funding request submitted: {agent_id} for ${float(amount)}")
        return f"request_{agent_id}_{int(request.created_at.timestamp())}"
    
    async def _delayed_processing(self, request: FundingRequest, delay_seconds: int):
        """Process request after delay"""
        await asyncio.sleep(delay_seconds)
        await self._evaluate_funding_request(request)
    
    async def _process_critical_request(self, request: FundingRequest):
        """Immediately process critical funding request"""
        # Get agent performance
        performance = await self._get_agent_performance(request.agent_id)
        
        if performance and self._meets_critical_criteria(performance):
            # Approve immediately with reduced amount for safety
            approved_amount = min(request.requested_amount, Decimal(50000))  # Max $50K critical
            
            allocation = await self._execute_funding_allocation(
                request.agent_id,
                approved_amount,
                FundingStrategy.RISK_ADJUSTED,
                "Critical request - emergency allocation"
            )
            
            request.approved = True
            request.approved_amount = approved_amount
            
            logger.info(f"Critical funding approved: {request.agent_id} - ${float(approved_amount)}")
        else:
            logger.warning(f"Critical funding denied: {request.agent_id} - insufficient performance")
    
    def _meets_critical_criteria(self, performance: AgentPerformanceMetrics) -> bool:
        """Check if agent meets criteria for critical funding"""
        return (
            performance.sharpe_ratio >= 1.5 and
            performance.max_drawdown <= 0.10 and
            performance.win_rate >= 0.60 and
            performance.trade_count >= 20
        )
    
    async def _evaluate_funding_request(self, request: FundingRequest) -> bool:
        """Evaluate and potentially approve a funding request"""
        try:
            # Get agent performance metrics
            performance = await self._get_agent_performance(request.agent_id)
            if not performance:
                logger.warning(f"No performance data for agent {request.agent_id}")
                return False
            
            # Calculate scores
            performance_score = self._calculate_performance_score(performance)
            risk_score = self._calculate_risk_score(performance, request)
            opportunity_score = await self._calculate_opportunity_score(request)
            
            # Overall score
            overall_score = (
                performance_score * 0.4 +
                opportunity_score * 0.35 +
                (1 - risk_score) * 0.25  # Lower risk = higher score
            )
            
            # Decision threshold based on urgency
            thresholds = {
                "low": 0.7,
                "medium": 0.6,
                "high": 0.5,
                "critical": 0.4
            }
            
            threshold = thresholds.get(request.urgency, 0.6)
            
            if overall_score >= threshold:
                # Approve with adjusted amount
                allocation_multiplier = min(overall_score * 1.2, 1.0)
                approved_amount = request.requested_amount * Decimal(str(allocation_multiplier))
                
                # Apply limits
                approved_amount = min(
                    approved_amount,
                    self.allocation_rules["max_allocation_per_agent"]
                )
                approved_amount = max(
                    approved_amount,
                    self.allocation_rules["min_allocation_amount"]
                )
                
                allocation = await self._execute_funding_allocation(
                    request.agent_id,
                    approved_amount,
                    FundingStrategy.PERFORMANCE_BASED,
                    f"Automated approval - Score: {overall_score:.3f}"
                )
                
                request.approved = True
                request.approved_amount = approved_amount
                self.successful_allocations += 1
                
                logger.info(f"Funding approved: {request.agent_id} - ${float(approved_amount)}")
                return True
            else:
                logger.info(f"Funding denied: {request.agent_id} - Score {overall_score:.3f} below threshold {threshold}")
                self.failed_allocations += 1
                return False
                
        except Exception as e:
            logger.error(f"Error evaluating funding request: {e}")
            self.failed_allocations += 1
            return False
    
    def _calculate_performance_score(self, performance: AgentPerformanceMetrics) -> float:
        """Calculate normalized performance score (0-1)"""
        # Normalize metrics
        sharpe_norm = min(performance.sharpe_ratio / 3.0, 1.0)  # Max 3.0 Sharpe
        return_norm = min(float(performance.daily_return) / 0.05, 1.0)  # Max 5% daily
        win_rate_norm = float(performance.win_rate)
        drawdown_norm = 1.0 - min(float(performance.max_drawdown), 1.0)
        
        # Weighted score
        score = (
            sharpe_norm * 0.3 +
            return_norm * 0.25 +
            win_rate_norm * 0.25 +
            drawdown_norm * 0.20
        )
        
        return max(0.0, min(1.0, score))
    
    def _calculate_risk_score(self, 
                            performance: AgentPerformanceMetrics, 
                            request: FundingRequest) -> float:
        """Calculate risk score (0-1, where 1 = highest risk)"""
        
        # Historical risk metrics
        drawdown_risk = float(performance.max_drawdown)
        volatility_risk = min(float(performance.volatility), 1.0)
        
        # Request-specific risk
        amount_risk = min(float(request.requested_amount) / 100000, 1.0)  # Relative to $100K
        strategy_risk = {
            "conservative": 0.2,
            "moderate": 0.4,
            "aggressive": 0.7,
            "speculative": 0.9
        }.get(request.strategy_type, 0.5)
        
        # Urgency risk (higher urgency = higher risk)
        urgency_risk = {
            "low": 0.1,
            "medium": 0.3,
            "high": 0.6,
            "critical": 0.8
        }.get(request.urgency, 0.3)
        
        risk_score = (
            drawdown_risk * 0.3 +
            volatility_risk * 0.25 +
            amount_risk * 0.2 +
            strategy_risk * 0.15 +
            urgency_risk * 0.1
        )
        
        return max(0.0, min(1.0, risk_score))
    
    async def _calculate_opportunity_score(self, request: FundingRequest) -> float:
        """Calculate market opportunity score based on current conditions"""
        try:
            # Get real-time price aggregator
            price_aggregator = get_registry().get_service("realtime_price_aggregator")
            if not price_aggregator:
                return 0.5  # Default neutral score
            
            # Get arbitrage opportunities
            opportunities = await price_aggregator.get_arbitrage_opportunities(min_spread_pct=0.05)
            
            # Score based on opportunity count and spread
            if not opportunities:
                return 0.3  # Low opportunity
            
            opportunity_count_score = min(len(opportunities) / 10, 1.0)  # Max 10 opportunities
            avg_spread = sum(opp["spread_pct"] for opp in opportunities) / len(opportunities)
            spread_score = min(avg_spread / 1.0, 1.0)  # Max 1% spread
            
            # Market volatility score (higher volatility = more opportunities)
            volatility_score = 0.5  # Would integrate with market data
            
            opportunity_score = (
                opportunity_count_score * 0.4 +
                spread_score * 0.4 +
                volatility_score * 0.2
            )
            
            return max(0.0, min(1.0, opportunity_score))
            
        except Exception as e:
            logger.error(f"Error calculating opportunity score: {e}")
            return 0.5  # Default neutral score
    
    async def _execute_funding_allocation(self,
                                        agent_id: str,
                                        amount: Decimal,
                                        strategy: FundingStrategy,
                                        reason: str) -> FundingAllocation:
        """Execute the actual funding allocation"""
        
        allocation = FundingAllocation(
            agent_id=agent_id,
            allocated_amount=amount,
            funding_strategy=strategy,
            allocation_reason=reason,
            performance_score=Decimal(0),  # Would be calculated
            risk_score=Decimal(0),
            opportunity_score=Decimal(0),
            timestamp=datetime.now(timezone.utc),
            conditions={}
        )
        
        # Record allocation
        self.funding_history.append(allocation)
        self.total_funds_allocated += amount
        
        # TODO: Integrate with actual wallet transfer
        # await self._transfer_funds_to_agent(agent_id, amount)
        
        logger.info(f"Executed funding allocation: {agent_id} - ${float(amount)}")
        return allocation
    
    async def _get_agent_performance(self, agent_id: str) -> Optional[AgentPerformanceMetrics]:
        """Get agent performance metrics"""
        # Check cache first
        if agent_id in self.agent_performance_cache:
            cached = self.agent_performance_cache[agent_id]
            if (datetime.now(timezone.utc) - cached.last_updated).seconds < 300:  # 5min cache
                return cached
        
        # Mock performance data for now
        # TODO: Integrate with actual agent performance tracking
        mock_performance = AgentPerformanceMetrics(
            agent_id=agent_id,
            total_return=Decimal("0.15"),  # 15% total return
            daily_return=Decimal("0.02"),  # 2% daily
            weekly_return=Decimal("0.08"),  # 8% weekly
            sharpe_ratio=Decimal("1.8"),
            max_drawdown=Decimal("0.08"),  # 8% max drawdown
            win_rate=Decimal("0.72"),  # 72% win rate
            trade_count=45,
            avg_trade_size=Decimal("5000"),
            volatility=Decimal("0.25"),
            calmar_ratio=Decimal("2.1"),
            sortino_ratio=Decimal("2.4"),
            last_updated=datetime.now(timezone.utc)
        )
        
        self.agent_performance_cache[agent_id] = mock_performance
        return mock_performance
    
    async def get_agent_capital_status(self, agent_id: str) -> AgentCapitalStatus:
        """Get current capital status for an agent"""
        
        # Get active funding requests for this agent
        agent_requests = [r for r in self.active_requests if r.agent_id == agent_id]
        
        return AgentCapitalStatus(
            agent_id=agent_id,
            total_allocated=Decimal("50000"),  # Mock data
            available_balance=Decimal("25000"),
            deployed_capital=Decimal("20000"),
            reserved_funds=Decimal("5000"),
            pnl_unrealized=Decimal("3000"),
            pnl_realized=Decimal("7500"),
            utilization_rate=Decimal("0.8"),  # 80% utilization
            last_funding=datetime.now(timezone.utc) - timedelta(hours=6),
            funding_requests=agent_requests
        )
    
    async def process_periodic_funding_review(self):
        """Periodic review and rebalancing of agent funding"""
        logger.info("Starting periodic funding review")
        
        try:
            # Process pending requests
            for request in self.active_requests:
                if not request.approved:
                    await self._evaluate_funding_request(request)
            
            # Performance-based rebalancing
            await self._rebalance_agent_allocations()
            
            # Clean up old requests
            cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            self.active_requests = [r for r in self.active_requests if r.created_at > cutoff]
            
        except Exception as e:
            logger.error(f"Error in periodic funding review: {e}")
    
    async def _rebalance_agent_allocations(self):
        """Rebalance allocations based on performance"""
        # Get all active agents
        active_agents = ["marcus_momentum", "alex_arbitrage", "sophia_reversion", "riley_risk"]
        
        for agent_id in active_agents:
            performance = await self._get_agent_performance(agent_id)
            if not performance:
                continue
            
            # Check if agent needs rebalancing
            performance_score = self._calculate_performance_score(performance)
            
            if performance_score > 0.8:  # High performer - increase allocation
                bonus_amount = Decimal("10000")  # $10K bonus
                await self._execute_funding_allocation(
                    agent_id,
                    bonus_amount,
                    FundingStrategy.PERFORMANCE_BASED,
                    f"Performance bonus - Score: {performance_score:.3f}"
                )
            elif performance_score < 0.3:  # Poor performer - reduce allocation
                logger.warning(f"Agent {agent_id} underperforming - considering allocation reduction")
    
    async def get_funding_analytics(self) -> Dict[str, Any]:
        """Get comprehensive funding analytics"""
        
        # Calculate success rate
        total_requests = self.successful_allocations + self.failed_allocations
        success_rate = self.successful_allocations / max(total_requests, 1)
        
        # Analyze funding by strategy
        strategy_breakdown = {}
        for allocation in self.funding_history:
            strategy = allocation.funding_strategy.value
            if strategy not in strategy_breakdown:
                strategy_breakdown[strategy] = {"count": 0, "total_amount": 0}
            strategy_breakdown[strategy]["count"] += 1
            strategy_breakdown[strategy]["total_amount"] += float(allocation.allocated_amount)
        
        return {
            "total_funds_allocated": float(self.total_funds_allocated),
            "successful_allocations": self.successful_allocations,
            "failed_allocations": self.failed_allocations,
            "success_rate": success_rate,
            "active_requests": len(self.active_requests),
            "funding_history_count": len(self.funding_history),
            "strategy_breakdown": strategy_breakdown,
            "avg_allocation_size": float(self.total_funds_allocated) / max(self.successful_allocations, 1),
            "last_allocation": self.funding_history[-1].timestamp.isoformat() if self.funding_history else None
        }
    
    async def emergency_stop_funding(self, reason: str = "Emergency stop triggered"):
        """Emergency stop all funding operations"""
        logger.critical(f"EMERGENCY FUNDING STOP: {reason}")
        
        # Clear all pending requests
        self.active_requests.clear()
        
        # TODO: Implement wallet freeze mechanisms
        # await self._freeze_all_agent_wallets()
        
        return {
            "status": "emergency_stop",
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "funds_protected": float(self.total_funds_allocated)
        }
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service health and status"""
        return {
            "service": "autonomous_agent_funding",
            "status": "running",
            "total_funds_allocated": float(self.total_funds_allocated),
            "active_requests": len(self.active_requests),
            "successful_allocations": self.successful_allocations,
            "failed_allocations": self.failed_allocations,
            "funding_strategies": len(self.funding_strategies),
            "master_wallet": self.master_wallet_address,
            "allocation_rules": self.allocation_rules,
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_autonomous_agent_funding():
    """Factory function to create AutonomousAgentFunding instance"""
    return AutonomousAgentFunding()