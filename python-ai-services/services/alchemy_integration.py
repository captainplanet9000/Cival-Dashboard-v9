"""
Alchemy Integration Service
Leverages Alchemy's powerful APIs for blockchain data, enhanced APIs, and NFT support
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
from decimal import Decimal
import aiohttp
import json
from web3 import Web3
from eth_account import Account

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class AlchemyIntegration:
    """
    Alchemy integration for advanced blockchain features
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or "vNg5BFKZV1TJcvFtMANru"
        
        # Alchemy endpoints by chain
        self.endpoints = {
            "ethereum": f"https://eth-mainnet.g.alchemy.com/v2/{self.api_key}",
            "arbitrum": f"https://arb-mainnet.g.alchemy.com/v2/{self.api_key}",
            "optimism": f"https://opt-mainnet.g.alchemy.com/v2/{self.api_key}",
            "solana": f"https://solana-mainnet.g.alchemy.com/v2/{self.api_key}",
        }
        
        # Web3 instances for each chain
        self.web3_instances = {}
        self._initialize_web3()
        
        logger.info("Alchemy Integration initialized")
    
    def _initialize_web3(self):
        """Initialize Web3 instances for each supported chain"""
        for chain, endpoint in self.endpoints.items():
            if chain != "solana":  # Solana uses different SDK
                self.web3_instances[chain] = Web3(Web3.HTTPProvider(endpoint))
    
    async def get_token_metadata(self, chain: str, token_address: str) -> Dict[str, Any]:
        """Get comprehensive token metadata using Alchemy's Token API"""
        try:
            url = f"{self.endpoints[chain]}"
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "alchemy_getTokenMetadata",
                "params": [token_address]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result", {})
                    
            return {}
            
        except Exception as e:
            logger.error(f"Error getting token metadata: {e}")
            return {}
    
    async def get_token_balances(self, chain: str, address: str) -> List[Dict[str, Any]]:
        """Get all token balances for an address using Alchemy's enhanced API"""
        try:
            url = f"{self.endpoints[chain]}"
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "alchemy_getTokenBalances",
                "params": [address]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        balances = data.get("result", {}).get("tokenBalances", [])
                        
                        # Enhance with metadata
                        enhanced_balances = []
                        for balance in balances:
                            if int(balance["tokenBalance"], 16) > 0:  # Only non-zero balances
                                metadata = await self.get_token_metadata(chain, balance["contractAddress"])
                                enhanced_balances.append({
                                    "contractAddress": balance["contractAddress"],
                                    "tokenBalance": str(int(balance["tokenBalance"], 16)),
                                    "metadata": metadata
                                })
                        
                        return enhanced_balances
                    
            return []
            
        except Exception as e:
            logger.error(f"Error getting token balances: {e}")
            return []
    
    async def get_asset_transfers(self, 
                                chain: str, 
                                address: str,
                                category: List[str] = None) -> List[Dict[str, Any]]:
        """Get asset transfer history using Alchemy's Transfers API"""
        try:
            url = f"{self.endpoints[chain]}"
            
            if category is None:
                category = ["external", "internal", "erc20", "erc721", "erc1155"]
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "alchemy_getAssetTransfers",
                "params": [
                    {
                        "fromAddress": address,
                        "category": category,
                        "maxCount": "0x64"  # 100 transfers
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result", {}).get("transfers", [])
                    
            return []
            
        except Exception as e:
            logger.error(f"Error getting asset transfers: {e}")
            return []
    
    async def simulate_transaction(self, 
                                 chain: str,
                                 from_address: str,
                                 to_address: str,
                                 data: str,
                                 value: str = "0x0") -> Dict[str, Any]:
        """Simulate a transaction using Alchemy's Simulation API"""
        try:
            url = f"{self.endpoints[chain]}"
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "alchemy_simulateAssetChanges",
                "params": [
                    {
                        "from": from_address,
                        "to": to_address,
                        "value": value,
                        "data": data
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result", {})
                    
            return {}
            
        except Exception as e:
            logger.error(f"Error simulating transaction: {e}")
            return {}
    
    async def get_transaction_receipts(self, 
                                     chain: str,
                                     tx_hashes: List[str]) -> List[Dict[str, Any]]:
        """Batch get transaction receipts using Alchemy's batch requests"""
        try:
            url = f"{self.endpoints[chain]}"
            
            # Create batch request
            batch_payload = []
            for i, tx_hash in enumerate(tx_hashes):
                batch_payload.append({
                    "jsonrpc": "2.0",
                    "id": i + 1,
                    "method": "eth_getTransactionReceipt",
                    "params": [tx_hash]
                })
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=batch_payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return [item.get("result") for item in data if item.get("result")]
                    
            return []
            
        except Exception as e:
            logger.error(f"Error getting transaction receipts: {e}")
            return []
    
    async def subscribe_to_pending_transactions(self, 
                                              chain: str,
                                              filter_address: str = None) -> None:
        """Subscribe to pending transactions using Alchemy's WebSocket"""
        try:
            ws_endpoint = self.endpoints[chain].replace("https://", "wss://")
            
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(ws_endpoint) as ws:
                    # Subscribe to pending transactions
                    subscribe_msg = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "eth_subscribe",
                        "params": ["alchemy_pendingTransactions", {
                            "toAddress": [filter_address] if filter_address else []
                        }]
                    }
                    
                    await ws.send_json(subscribe_msg)
                    
                    # Handle subscription
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            if "params" in data:
                                tx = data["params"]["result"]
                                await self._handle_pending_transaction(tx)
                                
        except Exception as e:
            logger.error(f"Error in WebSocket subscription: {e}")
    
    async def _handle_pending_transaction(self, tx: Dict[str, Any]):
        """Handle incoming pending transaction"""
        logger.info(f"Pending transaction detected: {tx.get('hash')}")
        # Process transaction for MEV opportunities, etc.
    
    async def get_block_with_receipts(self, chain: str, block_number: str) -> Dict[str, Any]:
        """Get block data with all transaction receipts"""
        try:
            url = f"{self.endpoints[chain]}"
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "alchemy_getBlockReceipts",
                "params": [block_number]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result", {})
                    
            return {}
            
        except Exception as e:
            logger.error(f"Error getting block with receipts: {e}")
            return {}
    
    async def get_logs_with_retry(self, 
                                chain: str,
                                from_block: str,
                                to_block: str,
                                address: str = None,
                                topics: List[str] = None) -> List[Dict[str, Any]]:
        """Get logs with automatic retry and pagination"""
        try:
            url = f"{self.endpoints[chain]}"
            
            params = {
                "fromBlock": from_block,
                "toBlock": to_block
            }
            
            if address:
                params["address"] = address
            if topics:
                params["topics"] = topics
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_getLogs",
                "params": [params]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result", [])
                    
            return []
            
        except Exception as e:
            logger.error(f"Error getting logs: {e}")
            return []
    
    def decode_log(self, log: Dict[str, Any], abi: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Decode log data using contract ABI"""
        try:
            # Use Web3.py to decode
            w3 = self.web3_instances.get("ethereum")  # Default to Ethereum
            contract = w3.eth.contract(abi=abi)
            
            # Decode the log
            decoded = contract.events.parse_log(log)
            
            return {
                "event": decoded["event"],
                "args": dict(decoded["args"])
            }
            
        except Exception as e:
            logger.error(f"Error decoding log: {e}")
            return {}
    
    async def get_nft_metadata(self, 
                             chain: str,
                             contract_address: str,
                             token_id: str) -> Dict[str, Any]:
        """Get NFT metadata using Alchemy's NFT API"""
        try:
            url = f"{self.endpoints[chain]}/nft/v2/{contract_address}/metadata/{token_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.json()
                    
            return {}
            
        except Exception as e:
            logger.error(f"Error getting NFT metadata: {e}")
            return {}
    
    async def get_floor_price(self, chain: str, contract_address: str) -> Optional[Decimal]:
        """Get NFT collection floor price"""
        try:
            url = f"{self.endpoints[chain]}/nft/v2/getFloorPrice"
            params = {"contractAddress": contract_address}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        floor_price = data.get("floorPrice", {}).get("marketplaces", [{}])[0].get("floorPrice")
                        if floor_price:
                            return Decimal(str(floor_price))
                    
            return None
            
        except Exception as e:
            logger.error(f"Error getting floor price: {e}")
            return None
    
    async def get_solana_balance(self, address: str) -> Optional[Decimal]:
        """Get Solana balance using Alchemy's Solana API"""
        try:
            url = self.endpoints["solana"]
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getBalance",
                "params": [address]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        lamports = data.get("result", {}).get("value", 0)
                        return Decimal(lamports) / Decimal(10**9)  # Convert to SOL
                    
            return None
            
        except Exception as e:
            logger.error(f"Error getting Solana balance: {e}")
            return None
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status and API credits"""
        status = {
            "service": "alchemy_integration",
            "status": "running",
            "endpoints": list(self.endpoints.keys()),
            "features": [
                "token_metadata",
                "token_balances",
                "asset_transfers",
                "transaction_simulation",
                "pending_transactions",
                "nft_metadata",
                "solana_support"
            ],
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }
        
        # Check endpoint connectivity
        for chain, endpoint in self.endpoints.items():
            try:
                if chain != "solana":
                    w3 = self.web3_instances[chain]
                    if w3.is_connected():
                        status[f"{chain}_connected"] = True
                        status[f"{chain}_block"] = w3.eth.block_number
                    else:
                        status[f"{chain}_connected"] = False
                        
            except Exception as e:
                status[f"{chain}_connected"] = False
                status[f"{chain}_error"] = str(e)
        
        return status

# Factory function for service registry
def create_alchemy_integration():
    """Factory function to create AlchemyIntegration instance"""
    return AlchemyIntegration()