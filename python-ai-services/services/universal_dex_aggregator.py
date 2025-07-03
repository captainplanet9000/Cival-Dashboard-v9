"""
Universal DEX Aggregator Service - Phase 1A
Multi-chain DEX integration for autonomous HFT trading across all major DEXs
Supports Ethereum, Polygon, BSC, Solana, and Sui ecosystems
"""

import asyncio
import logging
import os
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime, timezone
from decimal import Decimal
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
import aiohttp
from web3 import Web3

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class Chain(Enum):
    ETHEREUM = "ethereum"
    SOLANA = "solana"
    SUI = "sui"
    SONIC = "sonic"
    HYPERLIQUID = "hyperliquid"
    BITCOIN = "bitcoin"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"

class DEXProtocol(Enum):
    # Ethereum DEXs
    UNISWAP_V2 = "uniswap_v2"
    UNISWAP_V3 = "uniswap_v3"
    SUSHISWAP = "sushiswap"
    CURVE = "curve"
    BALANCER = "balancer"
    ONEINCH = "1inch"
    
    # Solana DEXs
    JUPITER = "jupiter"
    RAYDIUM = "raydium"
    ORCA = "orca"
    SERUM = "serum"
    PHOENIX = "phoenix"
    
    # Sui DEXs
    CETUS = "cetus"
    TURBOS = "turbos"
    DEEPBOOK = "deepbook"
    FLOWX = "flowx"
    KRIYA = "kriya"
    
    # Sonic DEXs
    SONICDEX = "sonicdex"
    SONIC_AMM = "sonic_amm"
    
    # Hyperliquid
    HYPERLIQUID_PERP = "hyperliquid_perp"
    HYPERLIQUID_SPOT = "hyperliquid_spot"
    
    # Bitcoin/Lightning
    THORCHAIN = "thorchain"
    LIGHTNING_POOL = "lightning_pool"

@dataclass
class DEXConfig:
    """DEX configuration for each protocol"""
    protocol: DEXProtocol
    chain: Chain
    router_address: str
    factory_address: str
    fee_tiers: List[int]
    supports_multi_hop: bool
    gas_estimate: int
    api_endpoint: Optional[str] = None
    websocket_endpoint: Optional[str] = None

@dataclass
class TokenInfo:
    """Token information"""
    address: str
    symbol: str
    decimals: int
    chain: Chain
    is_native: bool = False

@dataclass
class SwapQuote:
    """Swap quote from a DEX"""
    dex_protocol: DEXProtocol
    chain: Chain
    token_in: TokenInfo
    token_out: TokenInfo
    amount_in: Decimal
    amount_out: Decimal
    price: Decimal
    price_impact: float
    gas_estimate: int
    fee: Decimal
    route: List[str]
    execution_time_ms: int
    confidence_score: float

@dataclass
class ArbitrageOpportunity:
    """Cross-DEX arbitrage opportunity"""
    opportunity_id: str
    token_pair: str
    buy_dex: DEXProtocol
    sell_dex: DEXProtocol
    buy_chain: Chain
    sell_chain: Chain
    buy_price: Decimal
    sell_price: Decimal
    profit_estimate: Decimal
    profit_percentage: float
    required_capital: Decimal
    gas_costs: Decimal
    execution_time_estimate: int
    confidence_score: float
    expires_at: datetime

class UniversalDEXAggregator:
    """
    Universal DEX aggregator for autonomous trading across all major chains and DEXs
    """
    
    def __init__(self):
        self.registry = get_registry()
        
        # DEX configurations
        self.dex_configs = self._initialize_dex_configs()
        
        # Active price feeds
        self.price_feeds: Dict[str, Dict[str, Any]] = {}
        
        # WebSocket connections for real-time data
        self.websocket_connections: Dict[str, Any] = {}
        
        # Arbitrage opportunities cache
        self.arbitrage_opportunities: Dict[str, ArbitrageOpportunity] = {}
        
        # Performance metrics
        self.execution_stats = {
            "total_swaps": 0,
            "successful_swaps": 0,
            "total_arbitrages": 0,
            "total_profit": Decimal("0"),
            "avg_execution_time": 0
        }
        
        logger.info("Universal DEX Aggregator initialized")
    
    def _initialize_dex_configs(self) -> Dict[str, DEXConfig]:
        """Initialize DEX configurations for all supported protocols"""
        configs = {}
        
        # Get Alchemy API key from environment or use provided key
        alchemy_key = os.getenv("ALCHEMY_API_KEY", "vNg5BFKZV1TJcvFtMANru")
        
        # Alchemy-powered RPC endpoints
        self.rpc_endpoints = {
            Chain.ETHEREUM: f"https://eth-mainnet.g.alchemy.com/v2/{alchemy_key}",
            Chain.ARBITRUM: f"https://arb-mainnet.g.alchemy.com/v2/{alchemy_key}",
            Chain.OPTIMISM: f"https://opt-mainnet.g.alchemy.com/v2/{alchemy_key}",
            Chain.SOLANA: f"https://solana-mainnet.g.alchemy.com/v2/{alchemy_key}",
            # Non-Alchemy chains
            Chain.SUI: "https://fullnode.mainnet.sui.io:443",
            Chain.SONIC: "https://rpc.sonic.game",
            Chain.HYPERLIQUID: "https://api.hyperliquid.xyz",
            Chain.BITCOIN: "https://btc.thorchain.com"
        }
        
        # Ethereum DEXs
        configs["ethereum_uniswap_v2"] = DEXConfig(
            protocol=DEXProtocol.UNISWAP_V2,
            chain=Chain.ETHEREUM,
            router_address="0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            factory_address="0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
            fee_tiers=[3000],
            supports_multi_hop=True,
            gas_estimate=150000,
            api_endpoint=self.rpc_endpoints[Chain.ETHEREUM]
        )
        
        configs["ethereum_uniswap_v3"] = DEXConfig(
            protocol=DEXProtocol.UNISWAP_V3,
            chain=Chain.ETHEREUM,
            router_address="0xE592427A0AEce92De3Edee1F18E0157C05861564",
            factory_address="0x1F98431c8aD98523631AE4a59f267346ea31F984",
            fee_tiers=[500, 3000, 10000],
            supports_multi_hop=True,
            gas_estimate=180000
        )
        
        configs["ethereum_sushiswap"] = DEXConfig(
            protocol=DEXProtocol.SUSHISWAP,
            chain=Chain.ETHEREUM,
            router_address="0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            factory_address="0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
            fee_tiers=[3000],
            supports_multi_hop=True,
            gas_estimate=160000
        )
        
        # Sonic DEXs
        configs["sonic_sonicdex"] = DEXConfig(
            protocol=DEXProtocol.SONICDEX,
            chain=Chain.SONIC,
            router_address="0x0000000000000000000000000000000000000001",  # Placeholder - needs actual address
            factory_address="0x0000000000000000000000000000000000000002",
            fee_tiers=[3000],
            supports_multi_hop=True,
            gas_estimate=100000,
            api_endpoint=self.rpc_endpoints[Chain.SONIC]
        )
        
        configs["sonic_amm"] = DEXConfig(
            protocol=DEXProtocol.SONIC_AMM,
            chain=Chain.SONIC,
            router_address="0x0000000000000000000000000000000000000003",
            factory_address="0x0000000000000000000000000000000000000004",
            fee_tiers=[2500],
            supports_multi_hop=True,
            gas_estimate=80000,
            api_endpoint=self.rpc_endpoints[Chain.SONIC]
        )
        
        # Hyperliquid DEXs
        configs["hyperliquid_perp"] = DEXConfig(
            protocol=DEXProtocol.HYPERLIQUID_PERP,
            chain=Chain.HYPERLIQUID,
            router_address="",  # API-based, no contract address
            factory_address="",
            fee_tiers=[],
            supports_multi_hop=False,
            gas_estimate=1000,
            api_endpoint="https://api.hyperliquid.xyz/info",
            websocket_endpoint="wss://api.hyperliquid.xyz/ws"
        )
        
        configs["hyperliquid_spot"] = DEXConfig(
            protocol=DEXProtocol.HYPERLIQUID_SPOT,
            chain=Chain.HYPERLIQUID,
            router_address="",
            factory_address="",
            fee_tiers=[],
            supports_multi_hop=False,
            gas_estimate=1000,
            api_endpoint="https://api.hyperliquid.xyz/info",
            websocket_endpoint="wss://api.hyperliquid.xyz/ws"
        )
        
        # Solana DEXs (API-based)
        configs["solana_jupiter"] = DEXConfig(
            protocol=DEXProtocol.JUPITER,
            chain=Chain.SOLANA,
            router_address="JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
            factory_address="",
            fee_tiers=[],
            supports_multi_hop=True,
            gas_estimate=5000,
            api_endpoint="https://quote-api.jup.ag/v6"
        )
        
        configs["solana_raydium"] = DEXConfig(
            protocol=DEXProtocol.RAYDIUM,
            chain=Chain.SOLANA,
            router_address="675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
            factory_address="",
            fee_tiers=[],
            supports_multi_hop=True,
            gas_estimate=4000,
            api_endpoint="https://api.raydium.io/v2"
        )
        
        # Sui DEXs (API-based)
        configs["sui_cetus"] = DEXConfig(
            protocol=DEXProtocol.CETUS,
            chain=Chain.SUI,
            router_address="0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb",
            factory_address="",
            fee_tiers=[],
            supports_multi_hop=True,
            gas_estimate=3000,
            api_endpoint="https://api-sui.cetus.zone"
        )
        
        return configs
    
    async def initialize(self):
        """Initialize the universal DEX aggregator"""
        try:
            # Start price feed monitoring
            asyncio.create_task(self._monitor_price_feeds())
            
            # Start arbitrage opportunity scanning
            asyncio.create_task(self._scan_arbitrage_opportunities())
            
            # Initialize WebSocket connections for real-time data
            await self._initialize_websocket_connections()
            
            logger.info("Universal DEX Aggregator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Universal DEX Aggregator: {e}")
    
    async def get_best_price(self, 
                           token_in: str, 
                           token_out: str, 
                           amount: Decimal,
                           chains: List[Chain] = None,
                           max_slippage: float = 0.01) -> Optional[SwapQuote]:
        """Get the best price across all DEXs for a token swap"""
        try:
            if chains is None:
                chains = [Chain.ETHEREUM, Chain.POLYGON, Chain.BSC, Chain.SOLANA]
            
            quotes = []
            
            # Get quotes from all relevant DEXs
            for chain in chains:
                chain_quotes = await self._get_chain_quotes(
                    token_in, token_out, amount, chain, max_slippage
                )
                quotes.extend(chain_quotes)
            
            if not quotes:
                return None
            
            # Sort by amount out (best price first)
            quotes.sort(key=lambda x: x.amount_out, reverse=True)
            
            best_quote = quotes[0]
            logger.info(f"Best price found: {best_quote.dex_protocol.value} on {best_quote.chain.value}")
            
            return best_quote
            
        except Exception as e:
            logger.error(f"Error getting best price: {e}")
            return None
    
    async def execute_optimal_swap(self, swap_quote: SwapQuote) -> Dict[str, Any]:
        """Execute a swap using the optimal route"""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Get the appropriate execution service
            execution_result = await self._execute_swap_by_protocol(swap_quote)
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            # Update performance metrics
            self.execution_stats["total_swaps"] += 1
            if execution_result.get("status") == "success":
                self.execution_stats["successful_swaps"] += 1
            
            self.execution_stats["avg_execution_time"] = (
                (self.execution_stats["avg_execution_time"] * (self.execution_stats["total_swaps"] - 1) + execution_time) /
                self.execution_stats["total_swaps"]
            )
            
            execution_result["execution_time_ms"] = execution_time
            
            logger.info(f"Swap executed in {execution_time:.0f}ms on {swap_quote.dex_protocol.value}")
            
            return execution_result
            
        except Exception as e:
            logger.error(f"Error executing swap: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def find_arbitrage_opportunities(self, 
                                         token_pairs: List[Tuple[str, str]],
                                         min_profit_usd: Decimal = Decimal("10"),
                                         max_capital_usd: Decimal = Decimal("10000")) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities across DEXs and chains"""
        try:
            opportunities = []
            
            for token_in, token_out in token_pairs:
                # Get prices from all DEXs
                all_prices = await self._get_all_prices(token_in, token_out)
                
                # Find arbitrage opportunities
                pair_opportunities = await self._find_pair_arbitrage(
                    token_in, token_out, all_prices, min_profit_usd, max_capital_usd
                )
                opportunities.extend(pair_opportunities)
            
            # Sort by profit estimate
            opportunities.sort(key=lambda x: x.profit_estimate, reverse=True)
            
            # Cache opportunities
            for opp in opportunities:
                self.arbitrage_opportunities[opp.opportunity_id] = opp
            
            logger.info(f"Found {len(opportunities)} arbitrage opportunities")
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Error finding arbitrage opportunities: {e}")
            return []
    
    async def execute_arbitrage(self, opportunity: ArbitrageOpportunity) -> Dict[str, Any]:
        """Execute an arbitrage opportunity"""
        try:
            start_time = datetime.now(timezone.utc)
            
            # Check if opportunity is still valid
            if datetime.now(timezone.utc) > opportunity.expires_at:
                return {"status": "failed", "error": "Opportunity expired"}
            
            # Execute buy order
            buy_result = await self._execute_arbitrage_leg(
                opportunity, "buy", opportunity.buy_dex, opportunity.buy_chain
            )
            
            if buy_result.get("status") != "success":
                return {"status": "failed", "error": "Buy order failed", "details": buy_result}
            
            # Execute sell order
            sell_result = await self._execute_arbitrage_leg(
                opportunity, "sell", opportunity.sell_dex, opportunity.sell_chain
            )
            
            if sell_result.get("status") != "success":
                # TODO: Implement rollback logic if needed
                logger.warning("Sell order failed after successful buy - manual intervention may be required")
                return {"status": "partial", "buy_result": buy_result, "sell_result": sell_result}
            
            # Calculate actual profit
            actual_profit = self._calculate_actual_profit(buy_result, sell_result, opportunity)
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            # Update performance metrics
            self.execution_stats["total_arbitrages"] += 1
            self.execution_stats["total_profit"] += actual_profit
            
            result = {
                "status": "success",
                "opportunity_id": opportunity.opportunity_id,
                "estimated_profit": float(opportunity.profit_estimate),
                "actual_profit": float(actual_profit),
                "execution_time_ms": execution_time,
                "buy_result": buy_result,
                "sell_result": sell_result
            }
            
            logger.info(f"Arbitrage executed successfully: ${actual_profit:.2f} profit in {execution_time:.0f}ms")
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing arbitrage: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def get_gas_estimate(self, chain: Chain, transaction_type: str) -> int:
        """Get gas estimate for a transaction type on a specific chain"""
        gas_estimates = {
            Chain.ETHEREUM: {
                "simple_swap": 150000,
                "multi_hop_swap": 300000,
                "add_liquidity": 200000,
                "remove_liquidity": 180000
            },
            Chain.POLYGON: {
                "simple_swap": 120000,
                "multi_hop_swap": 250000,
                "add_liquidity": 160000,
                "remove_liquidity": 140000
            },
            Chain.BSC: {
                "simple_swap": 140000,
                "multi_hop_swap": 280000,
                "add_liquidity": 180000,
                "remove_liquidity": 160000
            },
            Chain.SOLANA: {
                "simple_swap": 5000,
                "multi_hop_swap": 10000,
                "add_liquidity": 8000,
                "remove_liquidity": 6000
            },
            Chain.SUI: {
                "simple_swap": 3000,
                "multi_hop_swap": 8000,
                "add_liquidity": 6000,
                "remove_liquidity": 4000
            }
        }
        
        return gas_estimates.get(chain, {}).get(transaction_type, 200000)
    
    async def _get_chain_quotes(self, 
                              token_in: str, 
                              token_out: str, 
                              amount: Decimal,
                              chain: Chain,
                              max_slippage: float) -> List[SwapQuote]:
        """Get quotes from all DEXs on a specific chain"""
        quotes = []
        
        # Get relevant DEX configs for the chain
        chain_configs = [config for config in self.dex_configs.values() if config.chain == chain]
        
        for config in chain_configs:
            try:
                quote = await self._get_dex_quote(token_in, token_out, amount, config, max_slippage)
                if quote:
                    quotes.append(quote)
            except Exception as e:
                logger.warning(f"Failed to get quote from {config.protocol.value}: {e}")
        
        return quotes
    
    async def _get_dex_quote(self, 
                           token_in: str, 
                           token_out: str, 
                           amount: Decimal,
                           config: DEXConfig,
                           max_slippage: float) -> Optional[SwapQuote]:
        """Get quote from a specific DEX"""
        try:
            if config.chain in [Chain.SOLANA, Chain.SUI]:
                # API-based quotes for Solana and Sui
                return await self._get_api_quote(token_in, token_out, amount, config, max_slippage)
            else:
                # On-chain quotes for EVM chains
                return await self._get_onchain_quote(token_in, token_out, amount, config, max_slippage)
                
        except Exception as e:
            logger.error(f"Error getting quote from {config.protocol.value}: {e}")
            return None
    
    async def _get_api_quote(self, 
                           token_in: str, 
                           token_out: str, 
                           amount: Decimal,
                           config: DEXConfig,
                           max_slippage: float) -> Optional[SwapQuote]:
        """Get quote from API-based DEX (Solana, Sui, Hyperliquid)"""
        try:
            if config.protocol == DEXProtocol.JUPITER:
                # Jupiter API quote
                url = f"{config.api_endpoint}/quote"
                params = {
                    "inputMint": token_in,
                    "outputMint": token_out,
                    "amount": str(int(amount * 10**6)),  # Assume 6 decimals for simplicity
                    "slippageBps": int(max_slippage * 10000)
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            return SwapQuote(
                                dex_protocol=config.protocol,
                                chain=config.chain,
                                token_in=TokenInfo(token_in, "TOKEN_IN", 6, config.chain),
                                token_out=TokenInfo(token_out, "TOKEN_OUT", 6, config.chain),
                                amount_in=amount,
                                amount_out=Decimal(data["outAmount"]) / Decimal(10**6),
                                price=Decimal(data["outAmount"]) / amount,
                                price_impact=data.get("priceImpactPct", 0) / 100,
                                gas_estimate=config.gas_estimate,
                                fee=Decimal("0"),
                                route=data.get("routePlan", []),
                                execution_time_ms=50,
                                confidence_score=0.9
                            )
                            
            elif config.protocol in [DEXProtocol.HYPERLIQUID_PERP, DEXProtocol.HYPERLIQUID_SPOT]:
                # Hyperliquid API quote
                return await self._get_hyperliquid_quote(token_in, token_out, amount, config, max_slippage)
                
            elif config.protocol == DEXProtocol.CETUS:
                # Cetus (Sui) API quote
                return await self._get_sui_dex_quote(token_in, token_out, amount, config, max_slippage)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting API quote: {e}")
            return None
    
    async def _get_hyperliquid_quote(self,
                                    symbol: str,
                                    side: str,
                                    amount: Decimal,
                                    config: DEXConfig,
                                    max_slippage: float) -> Optional[SwapQuote]:
        """Get quote from Hyperliquid exchange"""
        try:
            # Hyperliquid API endpoint
            url = f"{config.api_endpoint}"
            
            # Get order book data
            payload = {
                "type": "l2Book",
                "coin": symbol
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Parse order book
                        bids = data.get("levels", []).get("bids", [])
                        asks = data.get("levels", []).get("asks", [])
                        
                        # Calculate execution price based on order book
                        if side == "buy" and asks:
                            best_ask = Decimal(asks[0]["px"])
                            return SwapQuote(
                                dex_protocol=config.protocol,
                                chain=config.chain,
                                token_in=TokenInfo("USDC", "USDC", 6, config.chain),
                                token_out=TokenInfo(symbol, symbol, 8, config.chain),
                                amount_in=amount,
                                amount_out=amount / best_ask,
                                price=best_ask,
                                price_impact=0.1,  # Estimate
                                gas_estimate=1000,
                                fee=amount * Decimal("0.0002"),  # 2bps maker fee
                                route=[symbol],
                                execution_time_ms=20,
                                confidence_score=0.95
                            )
                        elif side == "sell" and bids:
                            best_bid = Decimal(bids[0]["px"])
                            return SwapQuote(
                                dex_protocol=config.protocol,
                                chain=config.chain,
                                token_in=TokenInfo(symbol, symbol, 8, config.chain),
                                token_out=TokenInfo("USDC", "USDC", 6, config.chain),
                                amount_in=amount,
                                amount_out=amount * best_bid,
                                price=best_bid,
                                price_impact=0.1,
                                gas_estimate=1000,
                                fee=amount * Decimal("0.0002"),
                                route=[symbol],
                                execution_time_ms=20,
                                confidence_score=0.95
                            )
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting Hyperliquid quote: {e}")
            return None
    
    async def _get_sui_dex_quote(self,
                               token_in: str,
                               token_out: str,
                               amount: Decimal,
                               config: DEXConfig,
                               max_slippage: float) -> Optional[SwapQuote]:
        """Get quote from Sui DEX (Cetus, Turbos, etc)"""
        try:
            # Mock implementation for Sui DEXs
            # In production, would use actual Sui DEX APIs
            base_price = Decimal("1.5")  # Mock price
            
            return SwapQuote(
                dex_protocol=config.protocol,
                chain=config.chain,
                token_in=TokenInfo(token_in, token_in, 9, config.chain),
                token_out=TokenInfo(token_out, token_out, 9, config.chain),
                amount_in=amount,
                amount_out=amount * base_price,
                price=base_price,
                price_impact=0.2,
                gas_estimate=config.gas_estimate,
                fee=amount * Decimal("0.003"),
                route=[token_in, token_out],
                execution_time_ms=100,
                confidence_score=0.85
            )
            
        except Exception as e:
            logger.error(f"Error getting Sui DEX quote: {e}")
            return None
    
    async def _get_onchain_quote(self, 
                               token_in: str, 
                               token_out: str, 
                               amount: Decimal,
                               config: DEXConfig,
                               max_slippage: float) -> Optional[SwapQuote]:
        """Get quote from on-chain DEX (EVM chains)"""
        try:
            # Mock implementation - in production, this would make actual Web3 calls
            # to get real quotes from DEX contracts
            
            base_price = Decimal("2000")  # Mock price
            slippage_factor = 1 - (float(amount) / 100000)  # Mock slippage based on amount
            amount_out = amount * base_price * Decimal(str(slippage_factor))
            
            return SwapQuote(
                dex_protocol=config.protocol,
                chain=config.chain,
                token_in=TokenInfo(token_in, "TOKEN_IN", 18, config.chain),
                token_out=TokenInfo(token_out, "TOKEN_OUT", 18, config.chain),
                amount_in=amount,
                amount_out=amount_out,
                price=amount_out / amount,
                price_impact=(1 - slippage_factor) * 100,
                gas_estimate=config.gas_estimate,
                fee=amount * Decimal("0.003"),  # 0.3% fee
                route=[token_in, token_out],
                execution_time_ms=100,
                confidence_score=0.85
            )
            
        except Exception as e:
            logger.error(f"Error getting on-chain quote: {e}")
            return None
    
    async def _execute_swap_by_protocol(self, swap_quote: SwapQuote) -> Dict[str, Any]:
        """Execute swap based on the protocol"""
        try:
            if swap_quote.chain in [Chain.SOLANA, Chain.SUI]:
                return await self._execute_api_swap(swap_quote)
            else:
                return await self._execute_onchain_swap(swap_quote)
                
        except Exception as e:
            logger.error(f"Error executing swap: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def _execute_api_swap(self, swap_quote: SwapQuote) -> Dict[str, Any]:
        """Execute swap using API (Solana, Sui)"""
        try:
            # Mock implementation - in production, this would execute actual swaps
            await asyncio.sleep(0.05)  # Simulate execution time
            
            return {
                "status": "success",
                "tx_hash": f"mock_tx_{uuid.uuid4().hex[:16]}",
                "amount_in": float(swap_quote.amount_in),
                "amount_out": float(swap_quote.amount_out),
                "gas_used": swap_quote.gas_estimate,
                "execution_price": float(swap_quote.price)
            }
            
        except Exception as e:
            logger.error(f"Error executing API swap: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def _execute_onchain_swap(self, swap_quote: SwapQuote) -> Dict[str, Any]:
        """Execute swap on-chain (EVM chains)"""
        try:
            # Mock implementation - in production, this would execute actual on-chain swaps
            await asyncio.sleep(0.1)  # Simulate execution time
            
            return {
                "status": "success",
                "tx_hash": f"0x{uuid.uuid4().hex[:62]}",
                "amount_in": float(swap_quote.amount_in),
                "amount_out": float(swap_quote.amount_out),
                "gas_used": swap_quote.gas_estimate,
                "execution_price": float(swap_quote.price)
            }
            
        except Exception as e:
            logger.error(f"Error executing on-chain swap: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def _get_all_prices(self, token_in: str, token_out: str) -> Dict[str, SwapQuote]:
        """Get prices from all DEXs for arbitrage analysis"""
        all_quotes = {}
        test_amount = Decimal("1000")  # Standard test amount
        
        for config_key, config in self.dex_configs.items():
            try:
                quote = await self._get_dex_quote(token_in, token_out, test_amount, config, 0.01)
                if quote:
                    all_quotes[config_key] = quote
            except Exception as e:
                logger.warning(f"Failed to get price from {config_key}: {e}")
        
        return all_quotes
    
    async def _find_pair_arbitrage(self, 
                                 token_in: str, 
                                 token_out: str,
                                 all_prices: Dict[str, SwapQuote],
                                 min_profit_usd: Decimal,
                                 max_capital_usd: Decimal) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities for a token pair"""
        opportunities = []
        
        # Compare all price combinations
        quotes_list = list(all_prices.values())
        
        for i, buy_quote in enumerate(quotes_list):
            for j, sell_quote in enumerate(quotes_list):
                if i >= j:  # Avoid duplicate comparisons
                    continue
                
                # Check if this is a valid arbitrage opportunity
                if sell_quote.price > buy_quote.price:
                    profit_per_unit = sell_quote.price - buy_quote.price
                    profit_percentage = (profit_per_unit / buy_quote.price) * 100
                    
                    # Calculate optimal trade size
                    max_amount_by_capital = max_capital_usd / buy_quote.price
                    max_amount_by_liquidity = min(buy_quote.amount_in, sell_quote.amount_in)
                    optimal_amount = min(max_amount_by_capital, max_amount_by_liquidity)
                    
                    estimated_profit = optimal_amount * profit_per_unit
                    
                    # Subtract estimated gas costs
                    gas_cost_buy = Decimal("20")  # Mock gas cost in USD
                    gas_cost_sell = Decimal("20")  # Mock gas cost in USD
                    net_profit = estimated_profit - gas_cost_buy - gas_cost_sell
                    
                    if net_profit >= min_profit_usd:
                        opportunity = ArbitrageOpportunity(
                            opportunity_id=str(uuid.uuid4()),
                            token_pair=f"{token_in}/{token_out}",
                            buy_dex=buy_quote.dex_protocol,
                            sell_dex=sell_quote.dex_protocol,
                            buy_chain=buy_quote.chain,
                            sell_chain=sell_quote.chain,
                            buy_price=buy_quote.price,
                            sell_price=sell_quote.price,
                            profit_estimate=net_profit,
                            profit_percentage=float(profit_percentage),
                            required_capital=optimal_amount * buy_quote.price,
                            gas_costs=gas_cost_buy + gas_cost_sell,
                            execution_time_estimate=200,  # Mock execution time
                            confidence_score=min(buy_quote.confidence_score, sell_quote.confidence_score),
                            expires_at=datetime.now(timezone.utc).replace(second=0, microsecond=0) + timedelta(minutes=5)
                        )
                        opportunities.append(opportunity)
        
        return opportunities
    
    async def _execute_arbitrage_leg(self, 
                                   opportunity: ArbitrageOpportunity,
                                   side: str,
                                   dex_protocol: DEXProtocol,
                                   chain: Chain) -> Dict[str, Any]:
        """Execute one leg of an arbitrage trade"""
        try:
            # Mock implementation
            await asyncio.sleep(0.1)  # Simulate execution time
            
            return {
                "status": "success",
                "side": side,
                "dex": dex_protocol.value,
                "chain": chain.value,
                "tx_hash": f"mock_tx_{uuid.uuid4().hex[:16]}",
                "executed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error executing arbitrage leg: {e}")
            return {"status": "failed", "error": str(e)}
    
    def _calculate_actual_profit(self, 
                               buy_result: Dict[str, Any],
                               sell_result: Dict[str, Any],
                               opportunity: ArbitrageOpportunity) -> Decimal:
        """Calculate actual profit from arbitrage execution"""
        # Mock calculation - in production, would use actual execution results
        return opportunity.profit_estimate * Decimal("0.95")  # Assume 95% of estimated profit
    
    async def _monitor_price_feeds(self):
        """Monitor real-time price feeds"""
        while True:
            try:
                await asyncio.sleep(1)  # Update every second
                
                # Update price feeds for all DEXs
                for config_key, config in self.dex_configs.items():
                    # Mock price update
                    current_time = datetime.now(timezone.utc)
                    if config_key not in self.price_feeds:
                        self.price_feeds[config_key] = {}
                    
                    self.price_feeds[config_key]["last_update"] = current_time
                    self.price_feeds[config_key]["status"] = "active"
                
                # Clean up old opportunities
                current_time = datetime.now(timezone.utc)
                expired_opportunities = [
                    opp_id for opp_id, opp in self.arbitrage_opportunities.items()
                    if current_time > opp.expires_at
                ]
                
                for opp_id in expired_opportunities:
                    del self.arbitrage_opportunities[opp_id]
                
            except Exception as e:
                logger.error(f"Error in price feed monitoring: {e}")
                await asyncio.sleep(5)
    
    async def _scan_arbitrage_opportunities(self):
        """Continuously scan for arbitrage opportunities"""
        while True:
            try:
                await asyncio.sleep(10)  # Scan every 10 seconds
                
                # Common trading pairs
                common_pairs = [
                    ("USDC", "USDT"),
                    ("ETH", "USDC"),
                    ("BTC", "ETH"),
                    ("SOL", "USDC"),
                    ("MATIC", "USDC")
                ]
                
                opportunities = await self.find_arbitrage_opportunities(common_pairs)
                
                if opportunities:
                    logger.info(f"Scanned and found {len(opportunities)} arbitrage opportunities")
                
            except Exception as e:
                logger.error(f"Error scanning arbitrage opportunities: {e}")
                await asyncio.sleep(30)
    
    async def _initialize_websocket_connections(self):
        """Initialize WebSocket connections for real-time data"""
        try:
            # Initialize WebSocket connections for supported DEXs
            # Mock implementation - in production, would establish real WebSocket connections
            logger.info("WebSocket connections initialized")
            
        except Exception as e:
            logger.error(f"Error initializing WebSocket connections: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status and performance metrics"""
        active_opportunities = len(self.arbitrage_opportunities)
        total_profit = float(self.execution_stats["total_profit"])
        
        return {
            "service": "universal_dex_aggregator",
            "status": "running",
            "supported_dexs": len(self.dex_configs),
            "active_opportunities": active_opportunities,
            "execution_stats": {
                "total_swaps": self.execution_stats["total_swaps"],
                "successful_swaps": self.execution_stats["successful_swaps"],
                "success_rate": (self.execution_stats["successful_swaps"] / max(self.execution_stats["total_swaps"], 1)) * 100,
                "total_arbitrages": self.execution_stats["total_arbitrages"],
                "total_profit_usd": total_profit,
                "avg_execution_time_ms": self.execution_stats["avg_execution_time"]
            },
            "supported_chains": [chain.value for chain in Chain],
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_universal_dex_aggregator():
    """Factory function to create UniversalDEXAggregator instance"""
    from .alchemy_integration import create_alchemy_integration
    alchemy_service = create_alchemy_integration()
    return UniversalDEXAggregator(alchemy_api_key="vNg5BFKZV1TJcvFtMANru")