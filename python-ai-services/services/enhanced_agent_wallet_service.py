"""
Enhanced Agent Wallet Service
Real wallet management for autonomous trading agents with multi-chain support
"""

import asyncio
import os
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import secrets
from decimal import Decimal
from cryptography.fernet import Fernet
import base64

from eth_account import Account
from web3 import Web3
from hdwallet import HDWallet
from hdwallet.symbols import ETH, BTC

from .blockchain_provider_service import BlockchainProviderService, NetworkType
from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class WalletType(Enum):
    """Types of wallets"""
    ETHEREUM = "ethereum"
    BITCOIN = "bitcoin" 
    HD_WALLET = "hd_wallet"
    MULTI_CHAIN = "multi_chain"

class TransactionType(Enum):
    """Types of transactions"""
    TRANSFER = "transfer"
    DEX_SWAP = "dex_swap"
    CONTRACT_CALL = "contract_call"
    CROSS_CHAIN = "cross_chain"
    DEFI_INTERACTION = "defi_interaction"

@dataclass
class AgentWallet:
    """Agent wallet configuration"""
    agent_id: str
    wallet_type: WalletType
    address: str
    network: NetworkType
    encrypted_private_key: str
    derivation_path: Optional[str] = None
    created_at: datetime = None
    last_used: Optional[datetime] = None
    is_active: bool = True

@dataclass
class WalletBalance:
    """Wallet balance information"""
    agent_id: str
    network: NetworkType
    address: str
    native_balance: Decimal
    token_balances: Dict[str, Decimal]
    usd_value: Decimal
    last_updated: datetime

@dataclass
class TransactionRequest:
    """Transaction request structure"""
    agent_id: str
    network: NetworkType
    transaction_type: TransactionType
    to_address: str
    amount: Decimal
    token_address: Optional[str] = None
    gas_limit: Optional[int] = None
    gas_price: Optional[int] = None
    data: Optional[str] = None
    priority: str = "normal"

@dataclass
class TransactionResult:
    """Transaction execution result"""
    transaction_hash: str
    status: str
    gas_used: int
    effective_gas_price: int
    block_number: int
    confirmation_time: float
    network: NetworkType

class EnhancedAgentWalletService:
    """
    Enhanced wallet service for autonomous trading agents
    Supports multi-chain wallets with secure key management
    """
    
    def __init__(self, blockchain_service: Optional[BlockchainProviderService] = None):
        self.blockchain_service = blockchain_service
        self.agent_wallets: Dict[str, List[AgentWallet]] = {}
        self.wallet_balances: Dict[str, WalletBalance] = {}
        self.pending_transactions: Dict[str, TransactionRequest] = {}
        self.transaction_history: List[TransactionResult] = []
        
        # Encryption setup
        self.encryption_key = self._get_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
        
        # Configuration
        self.balance_update_interval = 30  # 30 seconds
        self.transaction_timeout = 300  # 5 minutes
        self.max_gas_price = Web3.to_wei(100, 'gwei')  # Maximum gas price
        
        # DEX router addresses (testnet)
        self.dex_routers = {
            NetworkType.ARBITRUM_SEPOLIA: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",  # Sushiswap
            NetworkType.SONIC_TESTNET: "0x",  # To be configured
        }
        
        logger.info("Enhanced Agent Wallet Service initialized")
    
    async def initialize(self):
        """Initialize the wallet service"""
        try:
            # Get blockchain service if not provided
            if not self.blockchain_service:
                registry = get_registry()
                self.blockchain_service = registry.get_service("blockchain_provider_service")
            
            if not self.blockchain_service:
                raise Exception("Blockchain provider service not available")
            
            # Start background tasks
            asyncio.create_task(self._balance_monitoring_loop())
            asyncio.create_task(self._transaction_monitoring_loop())
            
            logger.info("Enhanced Agent Wallet Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize wallet service: {e}")
            raise
    
    def _get_encryption_key(self) -> bytes:
        """Get or generate encryption key for wallet storage"""
        
        encryption_key = os.getenv('WALLET_ENCRYPTION_KEY')
        
        if encryption_key:
            # Use provided key
            return base64.urlsafe_b64decode(encryption_key.encode())
        else:
            # Generate new key (for development only)
            logger.warning("No WALLET_ENCRYPTION_KEY found, generating temporary key")
            return Fernet.generate_key()
    
    def _encrypt_private_key(self, private_key: str) -> str:
        """Encrypt private key for secure storage"""
        encrypted = self.cipher_suite.encrypt(private_key.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def _decrypt_private_key(self, encrypted_key: str) -> str:
        """Decrypt private key for use"""
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted = self.cipher_suite.decrypt(encrypted_bytes)
        return decrypted.decode()
    
    async def create_agent_wallet_suite(self, agent_id: str, 
                                      networks: List[NetworkType] = None) -> Dict[str, Any]:
        """Create comprehensive wallet suite for an agent"""
        
        if networks is None:
            networks = [NetworkType.ARBITRUM_SEPOLIA, NetworkType.SONIC_TESTNET]
        
        # Generate master HD wallet
        hd_wallet = HDWallet(symbol=ETH)
        hd_wallet.from_mnemonic(mnemonic=hd_wallet.generate_mnemonic())
        
        wallets_created = []
        wallet_addresses = {}
        
        for i, network in enumerate(networks):
            try:
                # Derive wallet for each network
                derived_wallet = hd_wallet.from_path(f"m/44'/60'/0'/0/{i}")
                
                # Create Ethereum account from derived private key
                account = Account.from_key(derived_wallet.private_key())
                
                # Encrypt and store wallet
                encrypted_key = self._encrypt_private_key(derived_wallet.private_key())
                
                wallet = AgentWallet(
                    agent_id=agent_id,
                    wallet_type=WalletType.ETHEREUM,
                    address=account.address,
                    network=network,
                    encrypted_private_key=encrypted_key,
                    derivation_path=f"m/44'/60'/0'/0/{i}",
                    created_at=datetime.now(timezone.utc)
                )
                
                wallets_created.append(wallet)
                wallet_addresses[network.value] = account.address
                
                logger.info(f"Created wallet for agent {agent_id} on {network.value}: {account.address}")
                
            except Exception as e:
                logger.error(f"Failed to create wallet for {network}: {e}")
                continue
        
        # Store wallets for agent
        self.agent_wallets[agent_id] = wallets_created
        
        # Initialize balance monitoring
        await self._initialize_balance_monitoring(agent_id)
        
        return {
            "agent_id": agent_id,
            "wallets_created": len(wallets_created),
            "addresses": wallet_addresses,
            "networks": [network.value for network in networks],
            "hd_master_public": hd_wallet.public_key(),
            "derivation_path_base": "m/44'/60'/0'/0/",
            "monitoring_active": True
        }
    
    async def get_agent_wallets(self, agent_id: str) -> List[AgentWallet]:
        """Get all wallets for an agent"""
        return self.agent_wallets.get(agent_id, [])
    
    async def get_agent_wallet_for_network(self, agent_id: str, 
                                         network: NetworkType) -> Optional[AgentWallet]:
        """Get agent wallet for specific network"""
        
        wallets = self.agent_wallets.get(agent_id, [])
        
        for wallet in wallets:
            if wallet.network == network:
                return wallet
        
        return None
    
    async def get_agent_balances(self, agent_id: str) -> Dict[str, WalletBalance]:
        """Get balances for all agent wallets"""
        
        balances = {}
        wallets = self.agent_wallets.get(agent_id, [])
        
        for wallet in wallets:
            balance_key = f"{agent_id}:{wallet.network.value}:{wallet.address}"
            
            if balance_key in self.wallet_balances:
                balances[wallet.network.value] = self.wallet_balances[balance_key]
            else:
                # Fetch fresh balance
                balance = await self._fetch_wallet_balance(wallet)
                if balance:
                    balances[wallet.network.value] = balance
        
        return balances
    
    async def execute_agent_transaction(self, transaction_request: TransactionRequest) -> TransactionResult:
        """Execute transaction for an agent"""
        
        # Get agent wallet for network
        wallet = await self.get_agent_wallet_for_network(
            transaction_request.agent_id,
            transaction_request.network
        )
        
        if not wallet:
            raise ValueError(f"No wallet found for agent {transaction_request.agent_id} on {transaction_request.network}")
        
        # Validate balance
        await self._validate_transaction_balance(wallet, transaction_request)
        
        # Build and execute transaction
        if transaction_request.transaction_type == TransactionType.TRANSFER:
            return await self._execute_transfer(wallet, transaction_request)
        elif transaction_request.transaction_type == TransactionType.DEX_SWAP:
            return await self._execute_dex_swap(wallet, transaction_request)
        elif transaction_request.transaction_type == TransactionType.CONTRACT_CALL:
            return await self._execute_contract_call(wallet, transaction_request)
        else:
            raise ValueError(f"Unsupported transaction type: {transaction_request.transaction_type}")
    
    async def _execute_transfer(self, wallet: AgentWallet, 
                              request: TransactionRequest) -> TransactionResult:
        """Execute simple transfer transaction"""
        
        # Get Web3 instance for network
        web3 = await self.blockchain_service.get_optimal_provider(
            wallet.network, "transaction"
        )
        
        if not web3:
            raise Exception(f"No provider available for {wallet.network}")
        
        # Decrypt private key
        private_key = self._decrypt_private_key(wallet.encrypted_private_key)
        account = Account.from_key(private_key)
        
        # Get transaction parameters
        nonce = await self.blockchain_service.get_transaction_count(wallet.network, wallet.address)
        gas_price = request.gas_price or await self.blockchain_service.get_gas_price(wallet.network)
        
        # Ensure gas price is reasonable
        gas_price = min(gas_price, self.max_gas_price)
        
        # Build transaction
        transaction = {
            'to': request.to_address,
            'value': Web3.to_wei(request.amount, 'ether'),
            'gas': request.gas_limit or 21000,
            'gasPrice': gas_price,
            'nonce': nonce,
        }
        
        # Add data if provided
        if request.data:
            transaction['data'] = request.data
        
        # Sign transaction
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key)
        
        # Send transaction
        start_time = datetime.now()
        tx_hash = await self.blockchain_service.send_raw_transaction(
            wallet.network, signed_txn.rawTransaction
        )
        
        # Wait for confirmation
        receipt = await self.blockchain_service.wait_for_transaction_receipt(
            wallet.network, tx_hash, self.transaction_timeout
        )
        
        confirmation_time = (datetime.now() - start_time).total_seconds()
        
        # Create result
        result = TransactionResult(
            transaction_hash=tx_hash,
            status='success' if receipt['status'] == 1 else 'failed',
            gas_used=receipt['gasUsed'],
            effective_gas_price=receipt.get('effectiveGasPrice', gas_price),
            block_number=receipt['blockNumber'],
            confirmation_time=confirmation_time,
            network=wallet.network
        )
        
        # Store in history
        self.transaction_history.append(result)
        
        # Update wallet last used
        wallet.last_used = datetime.now(timezone.utc)
        
        logger.info(f"Transaction executed for agent {wallet.agent_id}: {tx_hash}")
        
        return result
    
    async def _execute_dex_swap(self, wallet: AgentWallet, 
                              request: TransactionRequest) -> TransactionResult:
        """Execute DEX swap transaction"""
        
        router_address = self.dex_routers.get(wallet.network)
        if not router_address:
            raise ValueError(f"No DEX router configured for {wallet.network}")
        
        # Build swap transaction data
        swap_data = self._build_swap_data(request)
        
        # Execute as contract call
        contract_request = TransactionRequest(
            agent_id=request.agent_id,
            network=request.network,
            transaction_type=TransactionType.CONTRACT_CALL,
            to_address=router_address,
            amount=Decimal('0'),  # ETH amount in data
            data=swap_data,
            gas_limit=request.gas_limit or 200000,
            gas_price=request.gas_price,
            priority=request.priority
        )
        
        return await self._execute_contract_call(wallet, contract_request)
    
    async def _execute_contract_call(self, wallet: AgentWallet, 
                                   request: TransactionRequest) -> TransactionResult:
        """Execute contract interaction"""
        
        # Similar to transfer but with contract data
        web3 = await self.blockchain_service.get_optimal_provider(
            wallet.network, "transaction"
        )
        
        private_key = self._decrypt_private_key(wallet.encrypted_private_key)
        account = Account.from_key(private_key)
        
        nonce = await self.blockchain_service.get_transaction_count(wallet.network, wallet.address)
        gas_price = request.gas_price or await self.blockchain_service.get_gas_price(wallet.network)
        gas_price = min(gas_price, self.max_gas_price)
        
        transaction = {
            'to': request.to_address,
            'value': Web3.to_wei(request.amount, 'ether'),
            'gas': request.gas_limit or 100000,
            'gasPrice': gas_price,
            'nonce': nonce,
            'data': request.data or '0x'
        }
        
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key)
        
        start_time = datetime.now()
        tx_hash = await self.blockchain_service.send_raw_transaction(
            wallet.network, signed_txn.rawTransaction
        )
        
        receipt = await self.blockchain_service.wait_for_transaction_receipt(
            wallet.network, tx_hash, self.transaction_timeout
        )
        
        confirmation_time = (datetime.now() - start_time).total_seconds()
        
        result = TransactionResult(
            transaction_hash=tx_hash,
            status='success' if receipt['status'] == 1 else 'failed',
            gas_used=receipt['gasUsed'],
            effective_gas_price=receipt.get('effectiveGasPrice', gas_price),
            block_number=receipt['blockNumber'],
            confirmation_time=confirmation_time,
            network=wallet.network
        )
        
        self.transaction_history.append(result)
        wallet.last_used = datetime.now(timezone.utc)
        
        logger.info(f"Contract call executed for agent {wallet.agent_id}: {tx_hash}")
        
        return result
    
    def _build_swap_data(self, request: TransactionRequest) -> str:
        """Build DEX swap transaction data"""
        
        # This is a simplified example - in production, use proper DEX SDK
        # For now, return empty data
        return '0x'
    
    async def _validate_transaction_balance(self, wallet: AgentWallet, 
                                          request: TransactionRequest):
        """Validate agent has sufficient balance for transaction"""
        
        balance = await self.blockchain_service.get_balance(wallet.network, wallet.address)
        balance_eth = Web3.from_wei(balance, 'ether')
        
        # Estimate total cost (amount + gas)
        gas_cost = Web3.from_wei(
            (request.gas_limit or 21000) * (request.gas_price or 20000000000),
            'ether'
        )
        
        total_needed = request.amount + Decimal(str(gas_cost))
        
        if Decimal(str(balance_eth)) < total_needed:
            raise ValueError(
                f"Insufficient balance. Need {total_needed} ETH, have {balance_eth} ETH"
            )
    
    async def _fetch_wallet_balance(self, wallet: AgentWallet) -> Optional[WalletBalance]:
        """Fetch current balance for a wallet"""
        
        try:
            balance_wei = await self.blockchain_service.get_balance(wallet.network, wallet.address)
            balance_eth = Web3.from_wei(balance_wei, 'ether')
            
            # For now, simplified USD conversion (would use price oracle in production)
            usd_value = Decimal(str(balance_eth)) * Decimal('2000')  # Assume 2000 USD/ETH
            
            balance = WalletBalance(
                agent_id=wallet.agent_id,
                network=wallet.network,
                address=wallet.address,
                native_balance=Decimal(str(balance_eth)),
                token_balances={},  # TODO: Add ERC-20 token support
                usd_value=usd_value,
                last_updated=datetime.now(timezone.utc)
            )
            
            # Store in cache
            balance_key = f"{wallet.agent_id}:{wallet.network.value}:{wallet.address}"
            self.wallet_balances[balance_key] = balance
            
            return balance
            
        except Exception as e:
            logger.error(f"Failed to fetch balance for {wallet.address}: {e}")
            return None
    
    async def _initialize_balance_monitoring(self, agent_id: str):
        """Initialize balance monitoring for agent wallets"""
        
        wallets = self.agent_wallets.get(agent_id, [])
        
        for wallet in wallets:
            await self._fetch_wallet_balance(wallet)
    
    async def _balance_monitoring_loop(self):
        """Background balance monitoring loop"""
        
        while True:
            try:
                await asyncio.sleep(self.balance_update_interval)
                
                # Update all wallet balances
                for agent_id, wallets in self.agent_wallets.items():
                    for wallet in wallets:
                        if wallet.is_active:
                            await self._fetch_wallet_balance(wallet)
                
            except Exception as e:
                logger.error(f"Error in balance monitoring: {e}")
    
    async def _transaction_monitoring_loop(self):
        """Background transaction monitoring loop"""
        
        while True:
            try:
                await asyncio.sleep(10)  # Check every 10 seconds
                
                # Monitor pending transactions
                # (Implementation would check transaction confirmations)
                
            except Exception as e:
                logger.error(f"Error in transaction monitoring: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status"""
        
        total_wallets = sum(len(wallets) for wallets in self.agent_wallets.values())
        active_wallets = sum(
            len([w for w in wallets if w.is_active])
            for wallets in self.agent_wallets.values()
        )
        
        return {
            "service": "enhanced_agent_wallet_service",
            "status": "running",
            "agents_with_wallets": len(self.agent_wallets),
            "total_wallets": total_wallets,
            "active_wallets": active_wallets,
            "networks_supported": len(set(
                wallet.network for wallets in self.agent_wallets.values() for wallet in wallets
            )),
            "transactions_executed": len(self.transaction_history),
            "last_balance_update": max(
                (balance.last_updated for balance in self.wallet_balances.values()),
                default=None
            )
        }

# Factory function for service registry
def create_enhanced_agent_wallet_service():
    """Factory function to create enhanced agent wallet service"""
    return EnhancedAgentWalletService()