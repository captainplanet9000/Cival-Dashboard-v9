"""
Cross-DEX Arbitrage Engine - Phase 3
Ultra-fast arbitrage opportunity detection and execution with sub-100ms scanning
Integrates with Real-Time Price Aggregation and Autonomous Agent Funding
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Tuple, Set
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from dataclasses import dataclass, asdict
from enum import Enum
import json
import statistics
from collections import deque, defaultdict

from ..core.service_registry import get_registry
from .universal_dex_aggregator import Chain, DEXProtocol, SwapQuote, TokenInfo
from .realtime_price_aggregator import AggregatedPrice, PriceUpdate

logger = logging.getLogger(__name__)

class ArbitrageType(Enum):
    """Types of arbitrage opportunities"""
    SIMPLE_ARBITRAGE = "simple_arbitrage"  # Buy low, sell high
    TRIANGULAR_ARBITRAGE = "triangular_arbitrage"  # ABC -> ACB cycle
    FLASH_LOAN_ARBITRAGE = "flash_loan_arbitrage"  # No capital required
    CROSS_CHAIN_ARBITRAGE = "cross_chain_arbitrage"  # Across different chains
    MEV_ARBITRAGE = "mev_arbitrage"  # Maximal Extractable Value

class OpportunityStatus(Enum):
    """Arbitrage opportunity lifecycle status"""
    DETECTED = "detected"
    VALIDATED = "validated" 
    EXECUTED = "executed"
    FAILED = "failed"
    EXPIRED = "expired"
    INSUFFICIENT_LIQUIDITY = "insufficient_liquidity"

@dataclass
class ArbitrageOpportunity:
    """Detected arbitrage opportunity"""
    opportunity_id: str
    arbitrage_type: ArbitrageType
    token_pair: str
    buy_dex: DEXProtocol
    sell_dex: DEXProtocol
    buy_chain: Chain
    sell_chain: Chain
    buy_price: Decimal
    sell_price: Decimal
    spread_percentage: Decimal
    profit_estimate: Decimal
    required_capital: Decimal
    gas_cost_estimate: Decimal
    net_profit: Decimal
    confidence_score: Decimal
    liquidity_score: Decimal
    execution_time_estimate: timedelta
    detected_at: datetime
    valid_until: datetime
    status: OpportunityStatus
    execution_path: List[Dict[str, Any]]
    risk_factors: List[str]

@dataclass
class ArbitrageExecution:
    """Arbitrage execution record"""
    execution_id: str
    opportunity_id: str
    agent_id: str
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    actual_profit: Optional[Decimal]
    gas_cost: Optional[Decimal]
    slippage: Optional[Decimal]
    execution_steps: List[Dict[str, Any]]
    error_message: Optional[str]

@dataclass
class MarketConditions:
    """Current market conditions for arbitrage"""
    volatility_index: Decimal
    liquidity_index: Decimal
    gas_price_gwei: Decimal
    network_congestion: Decimal
    mev_competition: Decimal
    optimal_opportunity_threshold: Decimal

class CrossDEXArbitrageEngine:
    """
    Ultra-fast cross-DEX arbitrage engine with sub-100ms opportunity detection
    """
    
    def __init__(self):
        self.opportunities: Dict[str, ArbitrageOpportunity] = {}
        self.execution_history: List[ArbitrageExecution] = []
        self.performance_metrics = {
            "opportunities_detected": 0,
            "opportunities_executed": 0,
            "total_profit": Decimal(0),
            "success_rate": Decimal(0),
            "avg_execution_time": 0,
            "scan_latency_ms": deque(maxlen=1000)
        }
        
        # Configuration
        self.min_profit_threshold = Decimal("10.0")  # $10 minimum profit
        self.max_execution_time = timedelta(seconds=30)  # 30s max execution
        self.min_confidence_score = 0.7  # 70% minimum confidence
        self.max_slippage_tolerance = Decimal("0.005")  # 0.5% max slippage
        
        # Real-time tracking
        self.active_scans = 0
        self.scan_start_times = {}
        self.opportunity_cache = {}
        self.liquidity_cache = {}
        
        # Market conditions
        self.current_market_conditions = MarketConditions(
            volatility_index=Decimal("0.3"),
            liquidity_index=Decimal("0.7"),
            gas_price_gwei=Decimal("30"),
            network_congestion=Decimal("0.4"),
            mev_competition=Decimal("0.6"),
            optimal_opportunity_threshold=Decimal("0.2")  # 0.2% minimum spread
        )
        
        logger.info("Cross-DEX Arbitrage Engine initialized")
    
    async def start_continuous_scanning(self):
        """Start continuous arbitrage opportunity scanning"""
        logger.info("Starting continuous arbitrage scanning")
        
        # Start multiple concurrent scanning tasks
        tasks = [
            asyncio.create_task(self._simple_arbitrage_scanner()),
            asyncio.create_task(self._triangular_arbitrage_scanner()),
            asyncio.create_task(self._cross_chain_arbitrage_scanner()),
            asyncio.create_task(self._opportunity_validator()),
            asyncio.create_task(self._market_conditions_monitor()),
            asyncio.create_task(self._performance_tracker()),
            asyncio.create_task(self._opportunity_cleanup())
        ]
        
        # Wait for all tasks
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _simple_arbitrage_scanner(self):
        """Scan for simple arbitrage opportunities across DEXs"""
        while True:
            try:
                scan_start = time.perf_counter()
                
                # Get price aggregator
                price_aggregator = get_registry().get_service("realtime_price_aggregator")
                if not price_aggregator:
                    await asyncio.sleep(0.1)
                    continue
                
                # Get current prices for all pairs
                all_prices = price_aggregator.get_all_prices()
                
                for token_pair, aggregated_price in all_prices.items():
                    if not aggregated_price or len(aggregated_price.price_by_dex) < 2:
                        continue
                    
                    await self._analyze_simple_arbitrage(token_pair, aggregated_price)
                
                # Track scan latency
                scan_time_ms = (time.perf_counter() - scan_start) * 1000
                self.performance_metrics["scan_latency_ms"].append(scan_time_ms)
                
                # Target sub-100ms scanning
                if scan_time_ms > 100:
                    logger.warning(f"Scan latency high: {scan_time_ms:.2f}ms")
                
                # Very short sleep for continuous scanning
                await asyncio.sleep(0.05)  # 50ms between scans
                
            except Exception as e:
                logger.error(f"Error in simple arbitrage scanner: {e}")
                await asyncio.sleep(1)
    
    async def _analyze_simple_arbitrage(self, token_pair: str, aggregated_price: AggregatedPrice):
        """Analyze simple arbitrage opportunity for a token pair"""
        try:
            dex_prices = aggregated_price.price_by_dex
            
            # Find min and max prices
            prices = [(dex, update.price) for dex, update in dex_prices.items()]
            if len(prices) < 2:
                return
            
            prices.sort(key=lambda x: x[1])
            buy_dex, buy_price = prices[0]
            sell_dex, sell_price = prices[-1]
            
            # Calculate spread
            spread_pct = (sell_price - buy_price) / buy_price * 100
            
            if spread_pct < self.current_market_conditions.optimal_opportunity_threshold:
                return
            
            # Estimate profit potential
            trade_amount = Decimal("10000")  # $10K test amount
            gross_profit = (sell_price - buy_price) * trade_amount / buy_price
            
            # Estimate costs
            gas_cost = await self._estimate_gas_cost(buy_dex, sell_dex)
            slippage_cost = trade_amount * self.max_slippage_tolerance
            
            net_profit = gross_profit - gas_cost - slippage_cost
            
            if net_profit < self.min_profit_threshold:
                return
            
            # Create opportunity
            opportunity_id = f"simple_{token_pair}_{buy_dex}_{sell_dex}_{int(time.time() * 1000)}"
            
            opportunity = ArbitrageOpportunity(
                opportunity_id=opportunity_id,
                arbitrage_type=ArbitrageType.SIMPLE_ARBITRAGE,
                token_pair=token_pair,
                buy_dex=DEXProtocol(buy_dex),
                sell_dex=DEXProtocol(sell_dex),
                buy_chain=self._get_dex_chain(buy_dex),
                sell_chain=self._get_dex_chain(sell_dex),
                buy_price=buy_price,
                sell_price=sell_price,
                spread_percentage=spread_pct,
                profit_estimate=gross_profit,
                required_capital=trade_amount,
                gas_cost_estimate=gas_cost,
                net_profit=net_profit,
                confidence_score=Decimal("0.8"),
                liquidity_score=await self._calculate_liquidity_score(buy_dex, sell_dex, trade_amount),
                execution_time_estimate=timedelta(seconds=15),
                detected_at=datetime.now(timezone.utc),
                valid_until=datetime.now(timezone.utc) + timedelta(minutes=5),
                status=OpportunityStatus.DETECTED,
                execution_path=[
                    {"step": 1, "action": "buy", "dex": buy_dex, "amount": float(trade_amount)},
                    {"step": 2, "action": "sell", "dex": sell_dex, "amount": float(trade_amount)}
                ],
                risk_factors=[]
            )
            
            # Store opportunity
            self.opportunities[opportunity_id] = opportunity
            self.performance_metrics["opportunities_detected"] += 1
            
            logger.info(f"Simple arbitrage detected: {token_pair} - {float(spread_pct):.3f}% spread, ${float(net_profit):.2f} profit")
            
        except Exception as e:
            logger.error(f"Error analyzing simple arbitrage: {e}")
    
    async def _triangular_arbitrage_scanner(self):
        """Scan for triangular arbitrage opportunities"""
        while True:
            try:
                # Get price aggregator
                price_aggregator = get_registry().get_service("realtime_price_aggregator")
                if not price_aggregator:
                    await asyncio.sleep(0.5)
                    continue
                
                # Common triangular paths
                triangular_paths = [
                    ("ETH/USD", "BTC/ETH", "BTC/USD"),
                    ("ETH/USD", "SOL/ETH", "SOL/USD"),
                    ("BTC/USD", "ETH/BTC", "ETH/USD")
                ]
                
                for path in triangular_paths:
                    await self._analyze_triangular_arbitrage(path, price_aggregator)
                
                await asyncio.sleep(0.1)  # 100ms between triangular scans
                
            except Exception as e:
                logger.error(f"Error in triangular arbitrage scanner: {e}")
                await asyncio.sleep(1)
    
    async def _analyze_triangular_arbitrage(self, path: Tuple[str, str, str], price_aggregator):
        """Analyze triangular arbitrage opportunity"""
        try:
            pair1, pair2, pair3 = path
            
            # Get prices for all three pairs
            price1 = price_aggregator.get_price(pair1)
            price2 = price_aggregator.get_price(pair2)  
            price3 = price_aggregator.get_price(pair3)
            
            if not all([price1, price2, price3]):
                return
            
            # Calculate triangular arbitrage profit
            # Start with 1 unit of base currency
            start_amount = Decimal("1")
            
            # Path: USD -> ETH -> BTC -> USD (example)
            step1_amount = start_amount / price1.mid_price  # USD to ETH
            step2_amount = step1_amount / price2.mid_price  # ETH to BTC
            final_amount = step2_amount * price3.mid_price  # BTC to USD
            
            profit_ratio = final_amount / start_amount
            profit_pct = (profit_ratio - 1) * 100
            
            if profit_pct < Decimal("0.1"):  # 0.1% minimum for triangular
                return
            
            # Create triangular arbitrage opportunity
            opportunity_id = f"triangular_{path[0]}_{path[1]}_{path[2]}_{int(time.time() * 1000)}"
            
            opportunity = ArbitrageOpportunity(
                opportunity_id=opportunity_id,
                arbitrage_type=ArbitrageType.TRIANGULAR_ARBITRAGE,
                token_pair=f"{path[0]}-{path[1]}-{path[2]}",
                buy_dex=DEXProtocol.UNISWAP_V3,  # Default DEX
                sell_dex=DEXProtocol.UNISWAP_V3,
                buy_chain=Chain.ETHEREUM,
                sell_chain=Chain.ETHEREUM,
                buy_price=price1.mid_price,
                sell_price=price3.mid_price,
                spread_percentage=profit_pct,
                profit_estimate=profit_pct * Decimal("10000") / 100,  # On $10K
                required_capital=Decimal("10000"),
                gas_cost_estimate=Decimal("50"),  # Higher gas for 3 trades
                net_profit=profit_pct * Decimal("10000") / 100 - Decimal("50"),
                confidence_score=Decimal("0.7"),
                liquidity_score=Decimal("0.6"),
                execution_time_estimate=timedelta(seconds=45),
                detected_at=datetime.now(timezone.utc),
                valid_until=datetime.now(timezone.utc) + timedelta(minutes=3),
                status=OpportunityStatus.DETECTED,
                execution_path=[
                    {"step": 1, "pair": pair1, "action": "buy"},
                    {"step": 2, "pair": pair2, "action": "buy"}, 
                    {"step": 3, "pair": pair3, "action": "sell"}
                ],
                risk_factors=["multiple_transactions", "price_impact"]
            )
            
            self.opportunities[opportunity_id] = opportunity
            self.performance_metrics["opportunities_detected"] += 1
            
            logger.info(f"Triangular arbitrage detected: {path} - {float(profit_pct):.3f}% profit")
            
        except Exception as e:
            logger.error(f"Error analyzing triangular arbitrage: {e}")
    
    async def _cross_chain_arbitrage_scanner(self):
        """Scan for cross-chain arbitrage opportunities"""
        while True:
            try:
                # Cross-chain pairs to monitor
                cross_chain_pairs = [
                    ("BTC/USD", Chain.ETHEREUM, Chain.SOLANA),
                    ("ETH/USD", Chain.ETHEREUM, Chain.SOLANA),
                    ("SOL/USD", Chain.SOLANA, Chain.SUI)
                ]
                
                for token_pair, chain1, chain2 in cross_chain_pairs:
                    await self._analyze_cross_chain_arbitrage(token_pair, chain1, chain2)
                
                await asyncio.sleep(0.2)  # 200ms between cross-chain scans
                
            except Exception as e:
                logger.error(f"Error in cross-chain arbitrage scanner: {e}")
                await asyncio.sleep(2)
    
    async def _analyze_cross_chain_arbitrage(self, token_pair: str, chain1: Chain, chain2: Chain):
        """Analyze cross-chain arbitrage opportunity"""
        try:
            # Mock cross-chain price analysis
            # In reality, would get prices from different chains
            price_diff_pct = Decimal("0.5")  # 0.5% price difference
            
            if price_diff_pct < Decimal("0.3"):  # 0.3% minimum for cross-chain
                return
            
            # Account for bridge costs and time
            bridge_cost = Decimal("25")  # $25 bridge fee
            bridge_time = timedelta(minutes=10)  # 10 min bridge time
            
            gross_profit = price_diff_pct * Decimal("10000") / 100
            net_profit = gross_profit - bridge_cost
            
            if net_profit < self.min_profit_threshold:
                return
            
            opportunity_id = f"cross_chain_{token_pair}_{chain1.value}_{chain2.value}_{int(time.time() * 1000)}"
            
            opportunity = ArbitrageOpportunity(
                opportunity_id=opportunity_id,
                arbitrage_type=ArbitrageType.CROSS_CHAIN_ARBITRAGE,
                token_pair=token_pair,
                buy_dex=DEXProtocol.UNISWAP_V3,
                sell_dex=DEXProtocol.JUPITER,
                buy_chain=chain1,
                sell_chain=chain2,
                buy_price=Decimal("45000"),  # Mock BTC price
                sell_price=Decimal("45225"),  # 0.5% higher
                spread_percentage=price_diff_pct,
                profit_estimate=gross_profit,
                required_capital=Decimal("10000"),
                gas_cost_estimate=bridge_cost,
                net_profit=net_profit,
                confidence_score=Decimal("0.6"),  # Lower confidence for cross-chain
                liquidity_score=Decimal("0.5"),
                execution_time_estimate=bridge_time + timedelta(seconds=30),
                detected_at=datetime.now(timezone.utc),
                valid_until=datetime.now(timezone.utc) + timedelta(minutes=15),
                status=OpportunityStatus.DETECTED,
                execution_path=[
                    {"step": 1, "action": "buy", "chain": chain1.value},
                    {"step": 2, "action": "bridge", "from": chain1.value, "to": chain2.value},
                    {"step": 3, "action": "sell", "chain": chain2.value}
                ],
                risk_factors=["bridge_risk", "execution_time", "price_volatility"]
            )
            
            self.opportunities[opportunity_id] = opportunity
            self.performance_metrics["opportunities_detected"] += 1
            
            logger.info(f"Cross-chain arbitrage detected: {token_pair} {chain1.value}->{chain2.value} - {float(price_diff_pct):.3f}%")
            
        except Exception as e:
            logger.error(f"Error analyzing cross-chain arbitrage: {e}")
    
    async def _opportunity_validator(self):
        """Validate detected opportunities before execution"""
        while True:
            try:
                current_time = datetime.now(timezone.utc)
                
                for opp_id, opportunity in list(self.opportunities.items()):
                    if opportunity.status != OpportunityStatus.DETECTED:
                        continue
                    
                    # Check if opportunity expired
                    if current_time > opportunity.valid_until:
                        opportunity.status = OpportunityStatus.EXPIRED
                        continue
                    
                    # Validate opportunity
                    is_valid = await self._validate_opportunity(opportunity)
                    
                    if is_valid:
                        opportunity.status = OpportunityStatus.VALIDATED
                        # Trigger execution if criteria met
                        if opportunity.confidence_score >= self.min_confidence_score:
                            await self._execute_arbitrage(opportunity)
                    else:
                        opportunity.status = OpportunityStatus.INSUFFICIENT_LIQUIDITY
                
                await asyncio.sleep(0.1)  # 100ms validation cycle
                
            except Exception as e:
                logger.error(f"Error in opportunity validator: {e}")
                await asyncio.sleep(1)
    
    async def _validate_opportunity(self, opportunity: ArbitrageOpportunity) -> bool:
        """Validate an arbitrage opportunity"""
        try:
            # Check liquidity
            if opportunity.liquidity_score < Decimal("0.3"):
                return False
            
            # Check market conditions
            if self.current_market_conditions.network_congestion > Decimal("0.8"):
                return False
            
            # Check gas price impact
            gas_impact = opportunity.gas_cost_estimate / opportunity.profit_estimate
            if gas_impact > Decimal("0.5"):  # Gas cost > 50% of profit
                return False
            
            # Validate price freshness (price updates within last 5 seconds)
            price_age_threshold = timedelta(seconds=5)
            if (datetime.now(timezone.utc) - opportunity.detected_at) > price_age_threshold:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating opportunity: {e}")
            return False
    
    async def _execute_arbitrage(self, opportunity: ArbitrageOpportunity):
        """Execute validated arbitrage opportunity"""
        execution_id = f"exec_{opportunity.opportunity_id}_{int(time.time() * 1000)}"
        
        execution = ArbitrageExecution(
            execution_id=execution_id,
            opportunity_id=opportunity.opportunity_id,
            agent_id="arbitrage_agent",
            start_time=datetime.now(timezone.utc),
            end_time=None,
            status="executing",
            actual_profit=None,
            gas_cost=None,
            slippage=None,
            execution_steps=[],
            error_message=None
        )
        
        try:
            logger.info(f"Executing arbitrage: {opportunity.opportunity_id}")
            
            # Request funding for execution
            funding_service = get_registry().get_service("autonomous_agent_funding")
            if funding_service:
                await funding_service.request_funding(
                    agent_id="arbitrage_agent",
                    amount=opportunity.required_capital,
                    reason=f"Arbitrage execution: {opportunity.token_pair}",
                    urgency="high",
                    expected_return=opportunity.profit_estimate / opportunity.required_capital
                )
            
            # Simulate execution steps
            for step in opportunity.execution_path:
                execution_step = {
                    "step": step["step"],
                    "status": "completed",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "gas_used": 21000,
                    "result": "success"
                }
                execution.execution_steps.append(execution_step)
                await asyncio.sleep(0.1)  # Simulate execution time
            
            # Calculate actual profit (simulate some slippage)
            slippage = min(self.max_slippage_tolerance, Decimal("0.002"))
            actual_profit = opportunity.net_profit * (1 - slippage)
            
            execution.end_time = datetime.now(timezone.utc)
            execution.status = "completed"
            execution.actual_profit = actual_profit
            execution.gas_cost = opportunity.gas_cost_estimate
            execution.slippage = slippage
            
            # Update opportunity status
            opportunity.status = OpportunityStatus.EXECUTED
            
            # Update performance metrics
            self.performance_metrics["opportunities_executed"] += 1
            self.performance_metrics["total_profit"] += actual_profit
            
            execution_time = (execution.end_time - execution.start_time).total_seconds()
            self.performance_metrics["avg_execution_time"] = (
                (self.performance_metrics["avg_execution_time"] * (self.performance_metrics["opportunities_executed"] - 1) + execution_time) /
                self.performance_metrics["opportunities_executed"]
            )
            
            logger.info(f"Arbitrage executed successfully: {execution_id} - Profit: ${float(actual_profit):.2f}")
            
        except Exception as e:
            execution.end_time = datetime.now(timezone.utc)
            execution.status = "failed"
            execution.error_message = str(e)
            opportunity.status = OpportunityStatus.FAILED
            
            logger.error(f"Arbitrage execution failed: {execution_id} - {e}")
        
        self.execution_history.append(execution)
    
    async def _market_conditions_monitor(self):
        """Monitor market conditions affecting arbitrage"""
        while True:
            try:
                # Update market conditions based on current state
                # In reality, would integrate with gas trackers, volatility indices, etc.
                
                # Mock market condition updates
                self.current_market_conditions.gas_price_gwei = Decimal("25") + Decimal(str(time.time() % 20))
                self.current_market_conditions.network_congestion = min(Decimal("1.0"), Decimal(str(time.time() % 100)) / 100)
                
                # Adjust opportunity threshold based on conditions
                if self.current_market_conditions.network_congestion > Decimal("0.7"):
                    self.current_market_conditions.optimal_opportunity_threshold = Decimal("0.5")  # Require higher spread
                else:
                    self.current_market_conditions.optimal_opportunity_threshold = Decimal("0.2")
                
                await asyncio.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                logger.error(f"Error monitoring market conditions: {e}")
                await asyncio.sleep(10)
    
    async def _performance_tracker(self):
        """Track performance metrics"""
        while True:
            try:
                # Calculate success rate
                if self.performance_metrics["opportunities_detected"] > 0:
                    self.performance_metrics["success_rate"] = (
                        Decimal(str(self.performance_metrics["opportunities_executed"])) /
                        Decimal(str(self.performance_metrics["opportunities_detected"]))
                    )
                
                # Log performance every minute
                logger.info(f"Arbitrage Performance - Detected: {self.performance_metrics['opportunities_detected']}, "
                           f"Executed: {self.performance_metrics['opportunities_executed']}, "
                           f"Success Rate: {float(self.performance_metrics['success_rate']):.3f}")
                
                await asyncio.sleep(60)  # Log every minute
                
            except Exception as e:
                logger.error(f"Error tracking performance: {e}")
                await asyncio.sleep(60)
    
    async def _opportunity_cleanup(self):
        """Clean up expired and old opportunities"""
        while True:
            try:
                current_time = datetime.now(timezone.utc)
                cleanup_threshold = current_time - timedelta(hours=1)
                
                # Remove old opportunities
                expired_ops = [
                    opp_id for opp_id, opp in self.opportunities.items()
                    if opp.detected_at < cleanup_threshold
                ]
                
                for opp_id in expired_ops:
                    del self.opportunities[opp_id]
                
                if expired_ops:
                    logger.info(f"Cleaned up {len(expired_ops)} expired opportunities")
                
                await asyncio.sleep(300)  # Cleanup every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in opportunity cleanup: {e}")
                await asyncio.sleep(300)
    
    def _get_dex_chain(self, dex: str) -> Chain:
        """Get the chain for a DEX"""
        dex_chain_mapping = {
            "uniswap_v3": Chain.ETHEREUM,
            "jupiter": Chain.SOLANA,
            "hyperliquid_perp": Chain.HYPERLIQUID,
            "cetus": Chain.SUI,
            "sonicdex": Chain.SONIC
        }
        return dex_chain_mapping.get(dex, Chain.ETHEREUM)
    
    async def _estimate_gas_cost(self, buy_dex: str, sell_dex: str) -> Decimal:
        """Estimate gas cost for arbitrage execution"""
        base_gas = Decimal("21000")  # Base transaction
        swap_gas = Decimal("150000")  # Uniswap V3 swap
        
        total_gas = base_gas + (swap_gas * 2)  # Buy + sell
        gas_price = self.current_market_conditions.gas_price_gwei
        
        # Convert to USD (assume ETH = $2500, 1 ETH = 10^9 gwei)
        eth_price = Decimal("2500")
        gas_cost_eth = total_gas * gas_price / Decimal("10") ** 9
        gas_cost_usd = gas_cost_eth * eth_price
        
        return gas_cost_usd
    
    async def _calculate_liquidity_score(self, buy_dex: str, sell_dex: str, amount: Decimal) -> Decimal:
        """Calculate liquidity score for the arbitrage"""
        # Mock liquidity calculation
        # In reality, would check actual liquidity on both DEXs
        
        dex_liquidity = {
            "uniswap_v3": Decimal("0.9"),
            "jupiter": Decimal("0.7"),
            "hyperliquid_perp": Decimal("0.8"),
            "cetus": Decimal("0.6"),
            "sonicdex": Decimal("0.5")
        }
        
        buy_liquidity = dex_liquidity.get(buy_dex, Decimal("0.5"))
        sell_liquidity = dex_liquidity.get(sell_dex, Decimal("0.5"))
        
        # Average liquidity score
        return (buy_liquidity + sell_liquidity) / 2
    
    async def get_active_opportunities(self) -> List[Dict[str, Any]]:
        """Get all active arbitrage opportunities"""
        active_opportunities = []
        
        for opportunity in self.opportunities.values():
            if opportunity.status in [OpportunityStatus.DETECTED, OpportunityStatus.VALIDATED]:
                active_opportunities.append({
                    "opportunity_id": opportunity.opportunity_id,
                    "arbitrage_type": opportunity.arbitrage_type.value,
                    "token_pair": opportunity.token_pair,
                    "spread_percentage": float(opportunity.spread_percentage),
                    "net_profit": float(opportunity.net_profit),
                    "confidence_score": float(opportunity.confidence_score),
                    "execution_time_estimate": opportunity.execution_time_estimate.total_seconds(),
                    "detected_at": opportunity.detected_at.isoformat(),
                    "valid_until": opportunity.valid_until.isoformat(),
                    "status": opportunity.status.value
                })
        
        return sorted(active_opportunities, key=lambda x: x["net_profit"], reverse=True)
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get arbitrage engine performance metrics"""
        scan_latencies = list(self.performance_metrics["scan_latency_ms"])
        
        return {
            "opportunities_detected": self.performance_metrics["opportunities_detected"],
            "opportunities_executed": self.performance_metrics["opportunities_executed"],
            "total_profit": float(self.performance_metrics["total_profit"]),
            "success_rate": float(self.performance_metrics["success_rate"]),
            "avg_execution_time": self.performance_metrics["avg_execution_time"],
            "scan_performance": {
                "avg_latency_ms": statistics.mean(scan_latencies) if scan_latencies else 0,
                "p95_latency_ms": statistics.quantiles(scan_latencies, n=20)[18] if len(scan_latencies) > 20 else 0,
                "scans_under_100ms": sum(1 for x in scan_latencies if x < 100),
                "total_scans": len(scan_latencies)
            },
            "active_opportunities": len([o for o in self.opportunities.values() if o.status in [OpportunityStatus.DETECTED, OpportunityStatus.VALIDATED]]),
            "market_conditions": {
                "gas_price_gwei": float(self.current_market_conditions.gas_price_gwei),
                "network_congestion": float(self.current_market_conditions.network_congestion),
                "optimal_threshold": float(self.current_market_conditions.optimal_opportunity_threshold)
            }
        }
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service health and status"""
        return {
            "service": "cross_dex_arbitrage_engine",
            "status": "running",
            "opportunities_detected": self.performance_metrics["opportunities_detected"],
            "opportunities_executed": self.performance_metrics["opportunities_executed"],
            "active_opportunities": len(self.opportunities),
            "success_rate": float(self.performance_metrics["success_rate"]),
            "total_profit": float(self.performance_metrics["total_profit"]),
            "market_conditions": asdict(self.current_market_conditions),
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_cross_dex_arbitrage_engine():
    """Factory function to create CrossDEXArbitrageEngine instance"""
    return CrossDEXArbitrageEngine()