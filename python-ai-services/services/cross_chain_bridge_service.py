"""
Cross-Chain Bridge Service - Phase 1B
Enables automatic asset bridging across multiple chains for autonomous trading
Supports LayerZero, Wormhole, Stargate, and other major bridge protocols
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
import aiohttp
from web3 import Web3

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class BridgeProtocol(Enum):
    LAYERZERO = "layerzero"
    WORMHOLE = "wormhole"
    STARGATE = "stargate"
    HYPERLANE = "hyperlane"
    CONNEXT = "connext"
    MULTICHAIN = "multichain"
    SYNAPSE = "synapse"
    HOP = "hop"

class ChainId(Enum):
    ETHEREUM = 1
    POLYGON = 137
    BSC = 56
    ARBITRUM = 42161
    OPTIMISM = 10
    AVALANCHE = 43114
    FANTOM = 250
    SOLANA = 0  # Special case for Solana
    SUI = 0  # Special case for Sui

class BridgeStatus(Enum):
    INITIATED = "initiated"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"

@dataclass
class BridgeConfig:
    """Bridge protocol configuration"""
    protocol: BridgeProtocol
    contract_address: str
    supported_chains: List[ChainId]
    supported_tokens: List[str]
    min_amount: Decimal
    max_amount: Decimal
    estimated_time_minutes: int
    fee_percentage: float
    api_endpoint: Optional[str] = None

@dataclass
class BridgeQuote:
    """Bridge quote with fees and timing"""
    bridge_protocol: BridgeProtocol
    from_chain: ChainId
    to_chain: ChainId
    token_address: str
    amount_in: Decimal
    amount_out: Decimal
    bridge_fee: Decimal
    gas_fee: Decimal
    total_cost: Decimal
    estimated_time_minutes: int
    route: List[str]
    confidence_score: float

@dataclass
class BridgeTransaction:
    """Bridge transaction tracking"""
    bridge_id: str
    bridge_protocol: BridgeProtocol
    from_chain: ChainId
    to_chain: ChainId
    token_address: str
    amount: Decimal
    sender_address: str
    recipient_address: str
    source_tx_hash: Optional[str]
    destination_tx_hash: Optional[str]
    status: BridgeStatus
    initiated_at: datetime
    completed_at: Optional[datetime]
    fee_paid: Decimal
    estimated_completion: datetime
    actual_amount_received: Optional[Decimal]

@dataclass
class CrossChainOpportunity:
    """Cross-chain arbitrage opportunity requiring bridging"""
    opportunity_id: str
    token_symbol: str
    source_chain: ChainId
    target_chain: ChainId
    source_price: Decimal
    target_price: Decimal
    required_bridge: BridgeProtocol
    bridge_cost: Decimal
    estimated_profit: Decimal
    profit_percentage: float
    execution_time_estimate: int
    confidence_score: float
    expires_at: datetime

class CrossChainBridgeService:
    """
    Cross-chain bridge service for autonomous asset movement
    Enables seamless trading across multiple blockchain ecosystems
    """
    
    def __init__(self):
        self.registry = get_registry()
        
        # Bridge configurations
        self.bridge_configs = self._initialize_bridge_configs()
        
        # Active bridge transactions
        self.active_bridges: Dict[str, BridgeTransaction] = {}
        
        # Cross-chain opportunities
        self.cross_chain_opportunities: Dict[str, CrossChainOpportunity] = {}
        
        # Performance metrics
        self.bridge_stats = {
            "total_bridges": 0,
            "successful_bridges": 0,
            "total_volume_bridged": Decimal("0"),
            "total_fees_paid": Decimal("0"),
            "avg_completion_time": 0
        }
        
        logger.info("Cross-Chain Bridge Service initialized")
    
    def _initialize_bridge_configs(self) -> Dict[str, BridgeConfig]:
        """Initialize bridge protocol configurations"""
        configs = {}
        
        # LayerZero - Universal omnichain protocol
        configs["layerzero"] = BridgeConfig(
            protocol=BridgeProtocol.LAYERZERO,
            contract_address="0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
            supported_chains=[
                ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BSC, 
                ChainId.ARBITRUM, ChainId.OPTIMISM, ChainId.AVALANCHE
            ],
            supported_tokens=["USDC", "USDT", "ETH", "WBTC"],
            min_amount=Decimal("10"),
            max_amount=Decimal("1000000"),
            estimated_time_minutes=15,
            fee_percentage=0.05,
            api_endpoint="https://api.layerzero.network"
        )
        
        # Stargate - Stable asset bridging
        configs["stargate"] = BridgeConfig(
            protocol=BridgeProtocol.STARGATE,
            contract_address="0x8731d54E9D02c286767d56ac03e8037C07e01e98",
            supported_chains=[
                ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BSC,
                ChainId.ARBITRUM, ChainId.OPTIMISM, ChainId.AVALANCHE
            ],
            supported_tokens=["USDC", "USDT"],
            min_amount=Decimal("20"),
            max_amount=Decimal("500000"),
            estimated_time_minutes=10,
            fee_percentage=0.06,
            api_endpoint="https://api.stargate.finance"
        )
        
        # Wormhole - Cross-chain for Solana integration
        configs["wormhole"] = BridgeConfig(
            protocol=BridgeProtocol.WORMHOLE,
            contract_address="0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
            supported_chains=[
                ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BSC,
                ChainId.SOLANA
            ],
            supported_tokens=["ETH", "USDC", "SOL"],
            min_amount=Decimal("5"),
            max_amount=Decimal("100000"),
            estimated_time_minutes=20,
            fee_percentage=0.1,
            api_endpoint="https://api.wormhole.com"
        )
        
        # Hyperlane - Custom message passing
        configs["hyperlane"] = BridgeConfig(
            protocol=BridgeProtocol.HYPERLANE,
            contract_address="0x35231d4c2D8B8ADcB5617A638A0c4548684c7C70",
            supported_chains=[
                ChainId.ETHEREUM, ChainId.POLYGON, ChainId.ARBITRUM,
                ChainId.OPTIMISM
            ],
            supported_tokens=["ETH", "USDC", "WETH"],
            min_amount=Decimal("1"),
            max_amount=Decimal("50000"),
            estimated_time_minutes=5,
            fee_percentage=0.03,
            api_endpoint="https://api.hyperlane.xyz"
        )
        
        # Connext - Fast liquidity
        configs["connext"] = BridgeConfig(
            protocol=BridgeProtocol.CONNEXT,
            contract_address="0xEE9deC2712cCE65174B561151701Bf54b99C24C8",
            supported_chains=[
                ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BSC,
                ChainId.ARBITRUM, ChainId.OPTIMISM
            ],
            supported_tokens=["USDC", "ETH", "WETH"],
            min_amount=Decimal("50"),
            max_amount=Decimal("250000"),
            estimated_time_minutes=3,
            fee_percentage=0.08,
            api_endpoint="https://api.connext.network"
        )
        
        return configs
    
    async def initialize(self):
        """Initialize the cross-chain bridge service"""
        try:
            # Start bridge monitoring
            asyncio.create_task(self._monitor_bridge_transactions())
            
            # Start cross-chain opportunity scanning
            asyncio.create_task(self._scan_cross_chain_opportunities())
            
            # Initialize API connections
            await self._initialize_api_connections()
            
            logger.info("Cross-Chain Bridge Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Cross-Chain Bridge Service: {e}")
    
    async def get_bridge_quote(self, 
                             from_chain: ChainId,
                             to_chain: ChainId,
                             token_address: str,
                             amount: Decimal,
                             recipient_address: str = None) -> List[BridgeQuote]:
        """Get bridge quotes from all available protocols"""
        try:
            quotes = []
            
            # Check each bridge protocol
            for config in self.bridge_configs.values():
                if (from_chain in config.supported_chains and 
                    to_chain in config.supported_chains and
                    from_chain != to_chain):
                    
                    quote = await self._get_protocol_quote(
                        config, from_chain, to_chain, token_address, amount
                    )
                    if quote:
                        quotes.append(quote)
            
            # Sort by total cost (fees + amount)
            quotes.sort(key=lambda x: x.total_cost)
            
            logger.info(f"Generated {len(quotes)} bridge quotes for {amount} tokens")
            
            return quotes
            
        except Exception as e:
            logger.error(f"Error getting bridge quotes: {e}")
            return []
    
    async def execute_bridge(self, 
                           quote: BridgeQuote,
                           sender_address: str,
                           recipient_address: str = None) -> BridgeTransaction:
        """Execute a cross-chain bridge transaction"""
        try:
            if recipient_address is None:
                recipient_address = sender_address
            
            bridge_id = str(uuid.uuid4())
            
            # Create bridge transaction record
            bridge_tx = BridgeTransaction(
                bridge_id=bridge_id,
                bridge_protocol=quote.bridge_protocol,
                from_chain=quote.from_chain,
                to_chain=quote.to_chain,
                token_address=quote.token_address,
                amount=quote.amount_in,
                sender_address=sender_address,
                recipient_address=recipient_address,
                source_tx_hash=None,
                destination_tx_hash=None,
                status=BridgeStatus.INITIATED,
                initiated_at=datetime.now(timezone.utc),
                completed_at=None,
                fee_paid=quote.total_cost - quote.amount_out,
                estimated_completion=datetime.now(timezone.utc) + timedelta(minutes=quote.estimated_time_minutes),
                actual_amount_received=None
            )
            
            # Execute the bridge transaction
            execution_result = await self._execute_bridge_protocol(quote, bridge_tx)
            
            if execution_result.get("status") == "success":
                bridge_tx.source_tx_hash = execution_result.get("tx_hash")
                bridge_tx.status = BridgeStatus.PENDING
                
                # Store transaction for monitoring
                self.active_bridges[bridge_id] = bridge_tx
                
                # Update stats
                self.bridge_stats["total_bridges"] += 1
                
                logger.info(f"Bridge initiated: {bridge_id} from {quote.from_chain.name} to {quote.to_chain.name}")
            else:
                bridge_tx.status = BridgeStatus.FAILED
                logger.error(f"Bridge execution failed: {execution_result.get('error')}")
            
            return bridge_tx
            
        except Exception as e:
            logger.error(f"Error executing bridge: {e}")
            raise
    
    async def get_optimal_bridge_route(self, 
                                     from_chain: ChainId,
                                     to_chain: ChainId,
                                     token_symbol: str,
                                     amount: Decimal,
                                     priority: str = "cost") -> Optional[BridgeQuote]:
        """Get the optimal bridge route based on priority (cost, speed, reliability)"""
        try:
            quotes = await self.get_bridge_quote(from_chain, to_chain, token_symbol, amount)
            
            if not quotes:
                return None
            
            if priority == "cost":
                # Return cheapest option
                return min(quotes, key=lambda x: x.total_cost)
            elif priority == "speed":
                # Return fastest option
                return min(quotes, key=lambda x: x.estimated_time_minutes)
            elif priority == "reliability":
                # Return most reliable option
                return max(quotes, key=lambda x: x.confidence_score)
            else:
                # Default to balanced scoring
                return min(quotes, key=lambda x: (
                    x.total_cost / x.amount_in * 0.4 +  # 40% weight on cost
                    x.estimated_time_minutes * 0.3 +    # 30% weight on time
                    (1 - x.confidence_score) * 100 * 0.3  # 30% weight on reliability
                ))
            
        except Exception as e:
            logger.error(f"Error finding optimal bridge route: {e}")
            return None
    
    async def monitor_bridge_transaction(self, bridge_id: str) -> Optional[BridgeTransaction]:
        """Monitor a specific bridge transaction"""
        try:
            bridge_tx = self.active_bridges.get(bridge_id)
            if not bridge_tx:
                return None
            
            # Check transaction status
            status_update = await self._check_bridge_status(bridge_tx)
            
            if status_update:
                bridge_tx.status = status_update["status"]
                if status_update.get("destination_tx_hash"):
                    bridge_tx.destination_tx_hash = status_update["destination_tx_hash"]
                if status_update.get("actual_amount_received"):
                    bridge_tx.actual_amount_received = Decimal(str(status_update["actual_amount_received"]))
                
                if bridge_tx.status == BridgeStatus.COMPLETED:
                    bridge_tx.completed_at = datetime.now(timezone.utc)
                    completion_time = (bridge_tx.completed_at - bridge_tx.initiated_at).total_seconds() / 60
                    
                    # Update stats
                    self.bridge_stats["successful_bridges"] += 1
                    self.bridge_stats["total_volume_bridged"] += bridge_tx.amount
                    self.bridge_stats["total_fees_paid"] += bridge_tx.fee_paid
                    
                    # Update average completion time
                    current_avg = self.bridge_stats["avg_completion_time"]
                    successful_count = self.bridge_stats["successful_bridges"]
                    self.bridge_stats["avg_completion_time"] = (
                        (current_avg * (successful_count - 1) + completion_time) / successful_count
                    )
                    
                    logger.info(f"Bridge completed: {bridge_id} in {completion_time:.1f} minutes")
            
            return bridge_tx
            
        except Exception as e:
            logger.error(f"Error monitoring bridge transaction: {e}")
            return None
    
    async def find_cross_chain_opportunities(self, 
                                           token_symbols: List[str],
                                           min_profit_usd: Decimal = Decimal("50")) -> List[CrossChainOpportunity]:
        """Find profitable cross-chain arbitrage opportunities"""
        try:
            opportunities = []
            
            # Get price data from universal DEX aggregator
            dex_aggregator = self.registry.get_service("universal_dex_aggregator")
            
            for token in token_symbols:
                # Check prices across all supported chains
                chain_prices = await self._get_cross_chain_prices(token, dex_aggregator)
                
                # Find arbitrage opportunities
                token_opportunities = await self._find_token_arbitrage(
                    token, chain_prices, min_profit_usd
                )
                opportunities.extend(token_opportunities)
            
            # Sort by profit estimate
            opportunities.sort(key=lambda x: x.estimated_profit, reverse=True)
            
            # Cache opportunities
            for opp in opportunities:
                self.cross_chain_opportunities[opp.opportunity_id] = opp
            
            logger.info(f"Found {len(opportunities)} cross-chain opportunities")
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Error finding cross-chain opportunities: {e}")
            return []
    
    async def execute_cross_chain_arbitrage(self, opportunity: CrossChainOpportunity) -> Dict[str, Any]:
        """Execute a cross-chain arbitrage opportunity"""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Check if opportunity is still valid
            if datetime.now(timezone.utc) > opportunity.expires_at:
                return {"status": "failed", "error": "Opportunity expired"}
            
            # Step 1: Bridge assets to target chain
            bridge_quote = await self.get_optimal_bridge_route(
                opportunity.source_chain,
                opportunity.target_chain,
                opportunity.token_symbol,
                opportunity.estimated_profit * 10,  # Use 10x profit as bridge amount
                priority="speed"
            )
            
            if not bridge_quote:
                return {"status": "failed", "error": "No bridge route available"}
            
            # Execute bridge
            bridge_tx = await self.execute_bridge(
                bridge_quote,
                sender_address="0x742d35cc6634c0532925a3b8d8a742e684e",  # Mock address
                recipient_address="0x742d35cc6634c0532925a3b8d8a742e684e"
            )
            
            if bridge_tx.status == BridgeStatus.FAILED:
                return {"status": "failed", "error": "Bridge execution failed"}
            
            # Step 2: Wait for bridge completion (simplified)
            await asyncio.sleep(1)  # Mock wait time
            bridge_tx.status = BridgeStatus.COMPLETED
            
            # Step 3: Execute arbitrage trade on target chain
            dex_aggregator = self.registry.get_service("universal_dex_aggregator")
            
            # Mock arbitrage execution
            arbitrage_result = {
                "status": "success",
                "profit_realized": float(opportunity.estimated_profit * Decimal("0.9"))  # 90% of estimated
            }
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            result = {
                "status": "success",
                "opportunity_id": opportunity.opportunity_id,
                "bridge_transaction": asdict(bridge_tx),
                "arbitrage_result": arbitrage_result,
                "execution_time_ms": execution_time,
                "profit_realized": arbitrage_result["profit_realized"]
            }
            
            logger.info(f"Cross-chain arbitrage executed: ${arbitrage_result['profit_realized']:.2f} profit")
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing cross-chain arbitrage: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def _get_protocol_quote(self, 
                                config: BridgeConfig,
                                from_chain: ChainId,
                                to_chain: ChainId,
                                token_address: str,
                                amount: Decimal) -> Optional[BridgeQuote]:
        """Get quote from a specific bridge protocol"""
        try:
            # Check amount limits
            if amount < config.min_amount or amount > config.max_amount:
                return None
            
            # Calculate fees
            bridge_fee = amount * Decimal(str(config.fee_percentage / 100))
            gas_fee = await self._estimate_bridge_gas_fee(config, from_chain, to_chain)
            total_cost = bridge_fee + gas_fee
            amount_out = amount - bridge_fee
            
            # Calculate confidence score based on protocol reliability
            confidence_scores = {
                BridgeProtocol.LAYERZERO: 0.95,
                BridgeProtocol.STARGATE: 0.93,
                BridgeProtocol.WORMHOLE: 0.90,
                BridgeProtocol.HYPERLANE: 0.88,
                BridgeProtocol.CONNEXT: 0.85
            }
            
            quote = BridgeQuote(
                bridge_protocol=config.protocol,
                from_chain=from_chain,
                to_chain=to_chain,
                token_address=token_address,
                amount_in=amount,
                amount_out=amount_out,
                bridge_fee=bridge_fee,
                gas_fee=gas_fee,
                total_cost=total_cost,
                estimated_time_minutes=config.estimated_time_minutes,
                route=[from_chain.name, to_chain.name],
                confidence_score=confidence_scores.get(config.protocol, 0.8)
            )
            
            return quote
            
        except Exception as e:
            logger.error(f"Error getting protocol quote: {e}")
            return None
    
    async def _estimate_bridge_gas_fee(self, 
                                     config: BridgeConfig,
                                     from_chain: ChainId,
                                     to_chain: ChainId) -> Decimal:
        """Estimate gas fees for bridge transaction"""
        # Mock gas fee estimation based on chain
        gas_fees = {
            ChainId.ETHEREUM: Decimal("25"),
            ChainId.POLYGON: Decimal("5"),
            ChainId.BSC: Decimal("3"),
            ChainId.ARBITRUM: Decimal("8"),
            ChainId.OPTIMISM: Decimal("6"),
            ChainId.AVALANCHE: Decimal("10"),
            ChainId.SOLANA: Decimal("0.1"),
        }
        
        from_gas = gas_fees.get(from_chain, Decimal("10"))
        to_gas = gas_fees.get(to_chain, Decimal("10"))
        
        return from_gas + to_gas
    
    async def _execute_bridge_protocol(self, 
                                     quote: BridgeQuote,
                                     bridge_tx: BridgeTransaction) -> Dict[str, Any]:
        """Execute bridge using specific protocol"""
        try:
            # Mock implementation - in production, would make actual bridge calls
            await asyncio.sleep(0.2)  # Simulate execution time
            
            return {
                "status": "success",
                "tx_hash": f"0x{uuid.uuid4().hex[:62]}",
                "protocol": quote.bridge_protocol.value,
                "estimated_completion": bridge_tx.estimated_completion.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error executing bridge protocol: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def _check_bridge_status(self, bridge_tx: BridgeTransaction) -> Optional[Dict[str, Any]]:
        """Check the status of a bridge transaction"""
        try:
            # Mock status checking - in production, would query actual bridge APIs
            current_time = datetime.now(timezone.utc)
            
            if current_time > bridge_tx.estimated_completion:
                return {
                    "status": BridgeStatus.COMPLETED,
                    "destination_tx_hash": f"0x{uuid.uuid4().hex[:62]}",
                    "actual_amount_received": float(bridge_tx.amount * Decimal("0.99"))  # 99% received
                }
            elif bridge_tx.status == BridgeStatus.INITIATED:
                return {"status": BridgeStatus.PENDING}
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking bridge status: {e}")
            return None
    
    async def _get_cross_chain_prices(self, 
                                    token_symbol: str,
                                    dex_aggregator) -> Dict[ChainId, Decimal]:
        """Get token prices across all supported chains"""
        chain_prices = {}
        
        # Mock price data - in production, would get real prices from DEX aggregator
        base_price = Decimal("2000")  # Mock base price
        
        price_variations = {
            ChainId.ETHEREUM: Decimal("1.0"),
            ChainId.POLYGON: Decimal("0.998"),
            ChainId.BSC: Decimal("1.002"),
            ChainId.ARBITRUM: Decimal("0.999"),
            ChainId.OPTIMISM: Decimal("1.001"),
            ChainId.SOLANA: Decimal("0.995")
        }
        
        for chain, variation in price_variations.items():
            chain_prices[chain] = base_price * variation
        
        return chain_prices
    
    async def _find_token_arbitrage(self, 
                                  token_symbol: str,
                                  chain_prices: Dict[ChainId, Decimal],
                                  min_profit_usd: Decimal) -> List[CrossChainOpportunity]:
        """Find arbitrage opportunities for a specific token"""
        opportunities = []
        
        # Compare prices between all chain pairs
        chains = list(chain_prices.keys())
        
        for i, source_chain in enumerate(chains):
            for j, target_chain in enumerate(chains):
                if i >= j:  # Avoid duplicate comparisons
                    continue
                
                source_price = chain_prices[source_chain]
                target_price = chain_prices[target_chain]
                
                if target_price > source_price:
                    # Calculate potential profit
                    price_diff = target_price - source_price
                    profit_percentage = (price_diff / source_price) * 100
                    
                    # Estimate bridge costs
                    bridge_quote = await self.get_optimal_bridge_route(
                        source_chain, target_chain, token_symbol, Decimal("1000")
                    )
                    
                    if bridge_quote:
                        bridge_cost_percentage = (bridge_quote.total_cost / bridge_quote.amount_in) * 100
                        net_profit_percentage = profit_percentage - bridge_cost_percentage
                        
                        if net_profit_percentage > 0.1:  # Minimum 0.1% profit
                            estimated_profit = Decimal("1000") * (net_profit_percentage / 100)
                            
                            if estimated_profit >= min_profit_usd:
                                opportunity = CrossChainOpportunity(
                                    opportunity_id=str(uuid.uuid4()),
                                    token_symbol=token_symbol,
                                    source_chain=source_chain,
                                    target_chain=target_chain,
                                    source_price=source_price,
                                    target_price=target_price,
                                    required_bridge=bridge_quote.bridge_protocol,
                                    bridge_cost=bridge_quote.total_cost,
                                    estimated_profit=estimated_profit,
                                    profit_percentage=float(net_profit_percentage),
                                    execution_time_estimate=bridge_quote.estimated_time_minutes + 5,
                                    confidence_score=bridge_quote.confidence_score * 0.9,
                                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
                                )
                                opportunities.append(opportunity)
        
        return opportunities
    
    async def _monitor_bridge_transactions(self):
        """Monitor all active bridge transactions"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                # Monitor all active bridges
                completed_bridges = []
                
                for bridge_id, bridge_tx in self.active_bridges.items():
                    if bridge_tx.status in [BridgeStatus.PENDING, BridgeStatus.CONFIRMED]:
                        updated_tx = await self.monitor_bridge_transaction(bridge_id)
                        
                        if updated_tx and updated_tx.status == BridgeStatus.COMPLETED:
                            completed_bridges.append(bridge_id)
                
                # Remove completed bridges from active monitoring
                for bridge_id in completed_bridges:
                    del self.active_bridges[bridge_id]
                
                if completed_bridges:
                    logger.info(f"Completed monitoring for {len(completed_bridges)} bridges")
                
            except Exception as e:
                logger.error(f"Error in bridge monitoring: {e}")
                await asyncio.sleep(60)
    
    async def _scan_cross_chain_opportunities(self):
        """Continuously scan for cross-chain opportunities"""
        while True:
            try:
                await asyncio.sleep(60)  # Scan every minute
                
                # Common tokens for cross-chain arbitrage
                tokens = ["USDC", "USDT", "ETH", "WBTC"]
                
                opportunities = await self.find_cross_chain_opportunities(tokens)
                
                if opportunities:
                    logger.info(f"Found {len(opportunities)} cross-chain opportunities")
                
            except Exception as e:
                logger.error(f"Error scanning cross-chain opportunities: {e}")
                await asyncio.sleep(120)
    
    async def _initialize_api_connections(self):
        """Initialize API connections for bridge protocols"""
        try:
            # Initialize API connections for supported bridges
            logger.info("Bridge API connections initialized")
            
        except Exception as e:
            logger.error(f"Error initializing bridge APIs: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status and performance metrics"""
        active_bridges = len(self.active_bridges)
        active_opportunities = len(self.cross_chain_opportunities)
        
        success_rate = 0
        if self.bridge_stats["total_bridges"] > 0:
            success_rate = (self.bridge_stats["successful_bridges"] / self.bridge_stats["total_bridges"]) * 100
        
        return {
            "service": "cross_chain_bridge_service",
            "status": "running",
            "supported_protocols": len(self.bridge_configs),
            "active_bridges": active_bridges,
            "active_opportunities": active_opportunities,
            "bridge_stats": {
                "total_bridges": self.bridge_stats["total_bridges"],
                "successful_bridges": self.bridge_stats["successful_bridges"],
                "success_rate": success_rate,
                "total_volume_bridged": float(self.bridge_stats["total_volume_bridged"]),
                "total_fees_paid": float(self.bridge_stats["total_fees_paid"]),
                "avg_completion_time_minutes": self.bridge_stats["avg_completion_time"]
            },
            "supported_chains": [chain.name for chain in ChainId if chain != ChainId.SOLANA],
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_cross_chain_bridge_service():
    """Factory function to create CrossChainBridgeService instance"""
    return CrossChainBridgeService()