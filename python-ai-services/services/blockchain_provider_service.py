"""
Multi-Provider Blockchain Service
Manages connections to Alchemy, Infura, and QuickNode with intelligent routing and failover
"""

import asyncio
import os
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from web3 import Web3, AsyncWeb3
from web3.middleware import geth_poa_middleware
import json

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class NetworkType(Enum):
    """Supported blockchain networks"""
    ETHEREUM_MAINNET = "ethereum_mainnet"
    ARBITRUM_SEPOLIA = "arbitrum_sepolia"
    SONIC_TESTNET = "sonic_testnet"
    POLYGON_MAINNET = "polygon_mainnet"

class ProviderType(Enum):
    """Blockchain infrastructure providers"""
    ALCHEMY = "alchemy"
    INFURA = "infura"
    QUICKNODE = "quicknode"

class OperationType(Enum):
    """Types of blockchain operations"""
    BALANCE_CHECK = "balance_check"
    TRANSACTION = "transaction"
    CONTRACT_CALL = "contract_call"
    SIMULATION = "simulation"
    ENHANCED_LOGS = "enhanced_logs"
    REAL_TIME_MONITOR = "real_time_monitor"

@dataclass
class ProviderConfig:
    """Provider configuration and status"""
    provider_type: ProviderType
    network: NetworkType
    rpc_url: str
    api_key: str
    status: str = "unknown"
    latency: float = 0.0
    last_check: Optional[datetime] = None
    error_count: int = 0
    success_count: int = 0

@dataclass
class NetworkMetrics:
    """Network performance metrics"""
    network: NetworkType
    active_provider: ProviderType
    latency: float
    block_number: int
    gas_price: int
    success_rate: float
    last_updated: datetime

class BlockchainProviderService:
    """
    Multi-provider blockchain service with intelligent routing and failover
    """
    
    def __init__(self):
        self.providers: Dict[str, ProviderConfig] = {}
        self.web3_instances: Dict[str, AsyncWeb3] = {}
        self.network_metrics: Dict[NetworkType, NetworkMetrics] = {}
        self.provider_priorities: Dict[NetworkType, List[ProviderType]] = {}
        self.is_initialized = False
        
        # Configuration
        self.health_check_interval = 60  # 1 minute
        self.max_retries = 3
        self.timeout = 30
        
        logger.info("BlockchainProviderService initialized")
    
    async def initialize(self):
        """Initialize blockchain providers and connections"""
        try:
            await self._setup_providers()
            await self._initialize_web3_instances()
            await self._setup_provider_priorities()
            await self._start_health_monitoring()
            
            self.is_initialized = True
            logger.info("Blockchain provider service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize blockchain provider service: {e}")
            raise
    
    async def _setup_providers(self):
        """Setup provider configurations from environment variables"""
        
        # Alchemy Sonic
        alchemy_sonic_rpc = os.getenv('ALCHEMY_SONIC_RPC')
        alchemy_api_key = os.getenv('ALCHEMY_API_KEY')
        
        if alchemy_sonic_rpc and alchemy_api_key:
            self.providers['alchemy_sonic'] = ProviderConfig(
                provider_type=ProviderType.ALCHEMY,
                network=NetworkType.SONIC_TESTNET,
                rpc_url=alchemy_sonic_rpc,
                api_key=alchemy_api_key
            )
        
        # Alchemy Arbitrum Sepolia
        alchemy_arb_rpc = os.getenv('ALCHEMY_ARB_SEPOLIA_RPC')
        
        if alchemy_arb_rpc and alchemy_api_key:
            self.providers['alchemy_arbitrum'] = ProviderConfig(
                provider_type=ProviderType.ALCHEMY,
                network=NetworkType.ARBITRUM_SEPOLIA,
                rpc_url=alchemy_arb_rpc,
                api_key=alchemy_api_key
            )
        
        # QuickNode Arbitrum Sepolia
        quicknode_arb_rpc = os.getenv('QUICKNODE_ARB_SEPOLIA_RPC')
        
        if quicknode_arb_rpc:
            self.providers['quicknode_arbitrum'] = ProviderConfig(
                provider_type=ProviderType.QUICKNODE,
                network=NetworkType.ARBITRUM_SEPOLIA,
                rpc_url=quicknode_arb_rpc,
                api_key=""  # QuickNode URL contains auth
            )
        
        # Infura Ethereum Mainnet
        infura_api_key = os.getenv('INFURA_API_KEY')
        
        if infura_api_key:
            self.providers['infura_ethereum'] = ProviderConfig(
                provider_type=ProviderType.INFURA,
                network=NetworkType.ETHEREUM_MAINNET,
                rpc_url=f"https://mainnet.infura.io/v3/{infura_api_key}",
                api_key=infura_api_key
            )
        
        logger.info(f"Configured {len(self.providers)} blockchain providers")
    
    async def _initialize_web3_instances(self):
        """Initialize Web3 instances for each provider"""
        
        for provider_id, config in self.providers.items():
            try:
                # Create Web3 instance with custom middleware
                web3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(
                    config.rpc_url,
                    request_kwargs={'timeout': self.timeout}
                ))
                
                # Add POA middleware for testnets
                if config.network in [NetworkType.ARBITRUM_SEPOLIA, NetworkType.SONIC_TESTNET]:
                    web3.middleware_onion.inject(geth_poa_middleware, layer=0)
                
                # Test connection
                if await web3.is_connected():
                    self.web3_instances[provider_id] = web3
                    config.status = "online"
                    config.last_check = datetime.now(timezone.utc)
                    logger.info(f"Successfully connected to {provider_id}")
                else:
                    config.status = "offline"
                    logger.warning(f"Failed to connect to {provider_id}")
                    
            except Exception as e:
                config.status = "error"
                config.error_count += 1
                logger.error(f"Error initializing {provider_id}: {e}")
    
    async def _setup_provider_priorities(self):
        """Setup provider priority order for each network"""
        
        self.provider_priorities = {
            NetworkType.SONIC_TESTNET: [ProviderType.ALCHEMY],
            NetworkType.ARBITRUM_SEPOLIA: [ProviderType.QUICKNODE, ProviderType.ALCHEMY],
            NetworkType.ETHEREUM_MAINNET: [ProviderType.INFURA, ProviderType.ALCHEMY],
            NetworkType.POLYGON_MAINNET: [ProviderType.ALCHEMY, ProviderType.INFURA]
        }
    
    async def get_optimal_provider(self, network: NetworkType, 
                                 operation: OperationType) -> Optional[AsyncWeb3]:
        """Get optimal provider for network and operation type"""
        
        provider_priorities = self.provider_priorities.get(network, [])
        
        # Special routing for enhanced operations
        if operation in [OperationType.SIMULATION, OperationType.ENHANCED_LOGS]:
            # Prefer Alchemy for advanced features
            provider_priorities = [ProviderType.ALCHEMY] + [p for p in provider_priorities if p != ProviderType.ALCHEMY]
        
        # Find best available provider
        for provider_type in provider_priorities:
            provider_id = self._get_provider_id(network, provider_type)
            
            if provider_id and provider_id in self.web3_instances:
                config = self.providers[provider_id]
                
                if config.status == "online":
                    return self.web3_instances[provider_id]
        
        # No online provider found
        logger.warning(f"No online provider found for {network}")
        return None
    
    async def execute_with_fallback(self, network: NetworkType, operation: OperationType,
                                  method: str, *args, **kwargs) -> Any:
        """Execute blockchain operation with automatic failover"""
        
        provider_priorities = self.provider_priorities.get(network, [])
        last_error = None
        
        for provider_type in provider_priorities:
            provider_id = self._get_provider_id(network, provider_type)
            
            if not provider_id or provider_id not in self.web3_instances:
                continue
            
            web3 = self.web3_instances[provider_id]
            config = self.providers[provider_id]
            
            if config.status != "online":
                continue
            
            try:
                # Execute the operation
                start_time = datetime.now()
                
                if hasattr(web3.eth, method):
                    result = await getattr(web3.eth, method)(*args, **kwargs)
                else:
                    raise AttributeError(f"Method {method} not found")
                
                # Update metrics
                latency = (datetime.now() - start_time).total_seconds() * 1000
                config.latency = latency
                config.success_count += 1
                config.last_check = datetime.now(timezone.utc)
                
                logger.debug(f"Successfully executed {method} on {provider_id} in {latency:.2f}ms")
                return result
                
            except Exception as e:
                config.error_count += 1
                last_error = e
                logger.warning(f"Provider {provider_id} failed for {method}: {e}")
                
                # Mark provider as degraded if too many errors
                if config.error_count >= 5:
                    config.status = "degraded"
                
                continue
        
        # All providers failed
        raise Exception(f"All providers failed for {method} on {network}. Last error: {last_error}")
    
    async def get_balance(self, network: NetworkType, address: str) -> int:
        """Get balance for address on network"""
        return await self.execute_with_fallback(
            network, OperationType.BALANCE_CHECK, 'get_balance', address
        )
    
    async def get_transaction_count(self, network: NetworkType, address: str) -> int:
        """Get transaction count (nonce) for address"""
        return await self.execute_with_fallback(
            network, OperationType.BALANCE_CHECK, 'get_transaction_count', address
        )
    
    async def send_raw_transaction(self, network: NetworkType, signed_txn: bytes) -> str:
        """Send signed transaction to network"""
        result = await self.execute_with_fallback(
            network, OperationType.TRANSACTION, 'send_raw_transaction', signed_txn
        )
        return result.hex()
    
    async def wait_for_transaction_receipt(self, network: NetworkType, 
                                         tx_hash: str, timeout: int = 300) -> Dict:
        """Wait for transaction confirmation"""
        return await self.execute_with_fallback(
            network, OperationType.TRANSACTION, 'wait_for_transaction_receipt', tx_hash, timeout
        )
    
    async def get_gas_price(self, network: NetworkType) -> int:
        """Get current gas price for network"""
        return await self.execute_with_fallover(
            network, OperationType.BALANCE_CHECK, 'gas_price'
        )
    
    async def get_block_number(self, network: NetworkType) -> int:
        """Get latest block number"""
        return await self.execute_with_fallback(
            network, OperationType.BALANCE_CHECK, 'block_number'
        )
    
    async def _start_health_monitoring(self):
        """Start background health monitoring"""
        asyncio.create_task(self._health_monitoring_loop())
    
    async def _health_monitoring_loop(self):
        """Background health monitoring loop"""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._check_all_providers_health()
            except Exception as e:
                logger.error(f"Error in health monitoring: {e}")
    
    async def _check_all_providers_health(self):
        """Check health of all providers"""
        
        for provider_id, config in self.providers.items():
            if provider_id not in self.web3_instances:
                continue
            
            web3 = self.web3_instances[provider_id]
            
            try:
                start_time = datetime.now()
                
                # Simple health check - get latest block
                await web3.eth.block_number
                
                # Update metrics
                latency = (datetime.now() - start_time).total_seconds() * 1000
                config.latency = latency
                config.status = "online"
                config.last_check = datetime.now(timezone.utc)
                
                # Update network metrics
                await self._update_network_metrics(config.network, provider_id)
                
            except Exception as e:
                config.error_count += 1
                config.status = "offline" if config.error_count >= 3 else "degraded"
                logger.warning(f"Health check failed for {provider_id}: {e}")
    
    async def _update_network_metrics(self, network: NetworkType, provider_id: str):
        """Update network-level metrics"""
        
        try:
            web3 = self.web3_instances[provider_id]
            config = self.providers[provider_id]
            
            block_number = await web3.eth.block_number
            gas_price = await web3.eth.gas_price
            
            # Calculate success rate
            total_requests = config.success_count + config.error_count
            success_rate = config.success_count / total_requests if total_requests > 0 else 0
            
            self.network_metrics[network] = NetworkMetrics(
                network=network,
                active_provider=config.provider_type,
                latency=config.latency,
                block_number=block_number,
                gas_price=gas_price,
                success_rate=success_rate,
                last_updated=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Failed to update network metrics for {network}: {e}")
    
    def _get_provider_id(self, network: NetworkType, provider_type: ProviderType) -> Optional[str]:
        """Get provider ID for network and provider type"""
        
        for provider_id, config in self.providers.items():
            if config.network == network and config.provider_type == provider_type:
                return provider_id
        
        return None
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get comprehensive provider status"""
        
        status = {
            "providers": {},
            "networks": {},
            "summary": {
                "total_providers": len(self.providers),
                "online_providers": 0,
                "degraded_providers": 0,
                "offline_providers": 0
            }
        }
        
        # Provider status
        for provider_id, config in self.providers.items():
            status["providers"][provider_id] = {
                "provider_type": config.provider_type.value,
                "network": config.network.value,
                "status": config.status,
                "latency": config.latency,
                "success_count": config.success_count,
                "error_count": config.error_count,
                "last_check": config.last_check.isoformat() if config.last_check else None
            }
            
            # Update summary
            if config.status == "online":
                status["summary"]["online_providers"] += 1
            elif config.status == "degraded":
                status["summary"]["degraded_providers"] += 1
            else:
                status["summary"]["offline_providers"] += 1
        
        # Network metrics
        for network, metrics in self.network_metrics.items():
            status["networks"][network.value] = asdict(metrics)
        
        return status
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status for health checks"""
        
        return {
            "service": "blockchain_provider_service",
            "status": "running" if self.is_initialized else "initializing",
            "providers_configured": len(self.providers),
            "providers_online": len([p for p in self.providers.values() if p.status == "online"]),
            "networks_supported": len(set(p.network for p in self.providers.values())),
            "last_health_check": max(
                (p.last_check for p in self.providers.values() if p.last_check),
                default=None
            )
        }

# Factory function for service registry
def create_blockchain_provider_service():
    """Factory function to create blockchain provider service"""
    return BlockchainProviderService()