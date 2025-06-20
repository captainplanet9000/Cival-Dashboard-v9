"""
Vault Management Service
Comprehensive vault/wallet hierarchy management with multi-asset support
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import json
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

import redis.asyncio as redis
from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class VaultType(Enum):
    MASTER = "master"
    STRATEGY = "strategy"
    LENDING = "lending"
    ARBITRAGE = "arbitrage"
    AGENT = "agent"
    RESERVE = "reserve"

class VaultStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    LOCKED = "locked"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"

class TransactionType(Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    ALLOCATION = "allocation"
    YIELD = "yield"
    FEE = "fee"

@dataclass
class Vault:
    """Vault definition"""
    vault_id: str
    vault_name: str
    vault_type: VaultType
    status: VaultStatus
    total_balance: Decimal
    available_balance: Decimal
    reserved_balance: Decimal
    parent_vault_id: Optional[str] = None
    hierarchy_level: int = 0
    created_at: datetime = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.metadata is None:
            self.metadata = {}

@dataclass
class VaultTransaction:
    """Vault transaction record"""
    transaction_id: str
    vault_id: str
    transaction_type: TransactionType
    asset_symbol: str
    amount: Decimal
    status: str
    created_at: datetime
    from_vault_id: Optional[str] = None
    to_vault_id: Optional[str] = None
    metadata: Dict[str, Any] = None

@dataclass
class VaultPerformance:
    """Vault performance metrics"""
    vault_id: str
    total_balance_usd: Decimal
    daily_pnl: Decimal
    cumulative_pnl: Decimal
    daily_return_pct: Decimal
    cumulative_return_pct: Decimal
    date: datetime

@dataclass
class VaultAllocation:
    """Vault allocation record"""
    allocation_id: str
    vault_id: str
    target_type: str
    target_id: str
    target_name: str
    asset_symbol: str
    allocated_amount: Decimal
    allocated_percentage: Decimal
    status: str
    performance: Optional[Dict[str, Any]] = None

class VaultManagementService:
    """
    Comprehensive vault management service with hierarchical structure support
    """
    
    def __init__(self, redis_client=None, supabase_client=None):
        self.registry = get_registry()
        self.redis = redis_client
        self.supabase = supabase_client
        
        # Active vaults tracking
        self.active_vaults: Dict[str, Vault] = {}
        self.vault_transactions: Dict[str, List[VaultTransaction]] = {}
        self.vault_performance: Dict[str, VaultPerformance] = {}
        self.vault_allocations: Dict[str, List[VaultAllocation]] = {}
        
        # Initialize with mock data for immediate functionality
        self._initialize_mock_data()
        
        logger.info("VaultManagementService initialized")
    
    def _initialize_mock_data(self):
        """Initialize with mock vault data"""
        # Master vault
        master_vault = Vault(
            vault_id="vault-master",
            vault_name="Master Trading Vault",
            vault_type=VaultType.MASTER,
            status=VaultStatus.ACTIVE,
            total_balance=Decimal("1258473.25"),
            available_balance=Decimal("270818.93"),
            reserved_balance=Decimal("987654.32"),
            hierarchy_level=0,
            metadata={"complianceScore": 98, "riskLevel": "Low"}
        )
        self.active_vaults[master_vault.vault_id] = master_vault
        
        # Strategy vaults
        algo_vault = Vault(
            vault_id="vault-algo",
            vault_name="Algorithmic Trading",
            vault_type=VaultType.STRATEGY,
            status=VaultStatus.ACTIVE,
            total_balance=Decimal("425847.50"),
            available_balance=Decimal("27596.75"),
            reserved_balance=Decimal("398250.75"),
            parent_vault_id="vault-master",
            hierarchy_level=1,
            metadata={"riskLevel": "Medium", "performance": 8.45, "strategies": ["Darvas Box", "Elliott Wave"]}
        )
        self.active_vaults[algo_vault.vault_id] = algo_vault
        
        defi_vault = Vault(
            vault_id="vault-defi",
            vault_name="DeFi Operations",
            vault_type=VaultType.LENDING,
            status=VaultStatus.ACTIVE,
            total_balance=Decimal("287954.12"),
            available_balance=Decimal("12273.67"),
            reserved_balance=Decimal("275680.45"),
            parent_vault_id="vault-master",
            hierarchy_level=1,
            metadata={"riskLevel": "High", "performance": 12.34, "protocols": ["Uniswap V3", "Aave"]}
        )
        self.active_vaults[defi_vault.vault_id] = defi_vault
        
        # Mock transactions
        self.vault_transactions["vault-master"] = [
            VaultTransaction(
                transaction_id="tx1",
                vault_id="vault-master",
                transaction_type=TransactionType.TRANSFER,
                asset_symbol="USD",
                amount=Decimal("50000"),
                status="completed",
                created_at=datetime.now(timezone.utc),
                from_vault_id="vault-master",
                to_vault_id="vault-algo",
                metadata={"purpose": "Strategy rebalancing"}
            )
        ]
        
        # Mock performance
        self.vault_performance["vault-master"] = VaultPerformance(
            vault_id="vault-master",
            total_balance_usd=Decimal("1258473.25"),
            daily_pnl=Decimal("5234.67"),
            cumulative_pnl=Decimal("125847.32"),
            daily_return_pct=Decimal("0.42"),
            cumulative_return_pct=Decimal("11.15"),
            date=datetime.now(timezone.utc)
        )

    async def initialize(self):
        """Initialize the vault management service"""
        try:
            # Load vaults from database if available
            await self._load_active_vaults()
            
            # Start background monitoring
            asyncio.create_task(self._vault_monitoring_loop())
            asyncio.create_task(self._performance_tracking_loop())
            
            logger.info("VaultManagementService initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize VaultManagementService: {e}")
            # Continue with mock data
            pass

    async def create_vault(self, vault_data: Dict[str, Any]) -> Vault:
        """Create a new vault"""
        try:
            vault = Vault(
                vault_id=str(uuid.uuid4()),
                vault_name=vault_data["vault_name"],
                vault_type=VaultType(vault_data.get("vault_type", "strategy")),
                status=VaultStatus(vault_data.get("status", "active")),
                total_balance=Decimal(str(vault_data.get("total_balance", "0"))),
                available_balance=Decimal(str(vault_data.get("available_balance", "0"))),
                reserved_balance=Decimal(str(vault_data.get("reserved_balance", "0"))),
                parent_vault_id=vault_data.get("parent_vault_id"),
                hierarchy_level=vault_data.get("hierarchy_level", 1),
                metadata=vault_data.get("metadata", {})
            )
            
            # Save to database
            if self.supabase:
                vault_dict = asdict(vault)
                vault_dict["vault_type"] = vault.vault_type.value
                vault_dict["status"] = vault.status.value
                vault_dict["created_at"] = vault.created_at.isoformat()
                
                self.supabase.table('vaults').insert(vault_dict).execute()
            
            # Add to active vaults
            self.active_vaults[vault.vault_id] = vault
            
            # Cache in Redis
            if self.redis:
                await self.redis.setex(
                    f"vault:{vault.vault_id}",
                    3600,
                    json.dumps(asdict(vault), default=str)
                )
            
            logger.info(f"Created vault: {vault.vault_name} ({vault.vault_id})")
            return vault
            
        except Exception as e:
            logger.error(f"Failed to create vault: {e}")
            raise

    async def get_all_vaults(self) -> List[Vault]:
        """Get all vaults"""
        return list(self.active_vaults.values())

    async def get_vault(self, vault_id: str) -> Optional[Vault]:
        """Get a specific vault"""
        return self.active_vaults.get(vault_id)

    async def update_vault(self, vault_id: str, updates: Dict[str, Any]) -> Optional[Vault]:
        """Update vault details"""
        try:
            vault = self.active_vaults.get(vault_id)
            if not vault:
                return None

            # Update fields
            for key, value in updates.items():
                if hasattr(vault, key):
                    if key in ["vault_type", "status"]:
                        setattr(vault, key, VaultType(value) if key == "vault_type" else VaultStatus(value))
                    elif key in ["total_balance", "available_balance", "reserved_balance"]:
                        setattr(vault, key, Decimal(str(value)))
                    else:
                        setattr(vault, key, value)

            # Update in database
            if self.supabase:
                update_dict = {k: v for k, v in updates.items()}
                if "vault_type" in update_dict:
                    update_dict["vault_type"] = vault.vault_type.value
                if "status" in update_dict:
                    update_dict["status"] = vault.status.value
                
                self.supabase.table('vaults').update(update_dict).eq('vault_id', vault_id).execute()

            # Update cache
            if self.redis:
                await self.redis.setex(
                    f"vault:{vault_id}",
                    3600,
                    json.dumps(asdict(vault), default=str)
                )

            logger.info(f"Updated vault: {vault.vault_name} ({vault_id})")
            return vault

        except Exception as e:
            logger.error(f"Failed to update vault {vault_id}: {e}")
            return None

    async def delete_vault(self, vault_id: str) -> bool:
        """Delete a vault"""
        try:
            vault = self.active_vaults.get(vault_id)
            if not vault:
                return False

            # Remove from database
            if self.supabase:
                self.supabase.table('vaults').delete().eq('vault_id', vault_id).execute()

            # Remove from active vaults
            del self.active_vaults[vault_id]

            # Remove from cache
            if self.redis:
                await self.redis.delete(f"vault:{vault_id}")

            logger.info(f"Deleted vault: {vault.vault_name} ({vault_id})")
            return True

        except Exception as e:
            logger.error(f"Failed to delete vault {vault_id}: {e}")
            return False

    async def transfer_funds(self, from_vault_id: str, to_vault_id: str, asset_symbol: str, amount: Decimal) -> bool:
        """Transfer funds between vaults"""
        try:
            from_vault = self.active_vaults.get(from_vault_id)
            to_vault = self.active_vaults.get(to_vault_id)
            
            if not from_vault or not to_vault:
                logger.error(f"Vault not found: {from_vault_id} or {to_vault_id}")
                return False

            if from_vault.available_balance < amount:
                logger.error(f"Insufficient balance in vault {from_vault_id}")
                return False

            # Update balances
            from_vault.available_balance -= amount
            from_vault.total_balance -= amount
            to_vault.available_balance += amount
            to_vault.total_balance += amount

            # Create transaction record
            transaction = VaultTransaction(
                transaction_id=str(uuid.uuid4()),
                vault_id=from_vault_id,
                transaction_type=TransactionType.TRANSFER,
                asset_symbol=asset_symbol,
                amount=amount,
                status="completed",
                created_at=datetime.now(timezone.utc),
                from_vault_id=from_vault_id,
                to_vault_id=to_vault_id,
                metadata={"transfer_type": "internal"}
            )

            # Store transaction
            if from_vault_id not in self.vault_transactions:
                self.vault_transactions[from_vault_id] = []
            self.vault_transactions[from_vault_id].append(transaction)

            logger.info(f"Transferred {amount} {asset_symbol} from {from_vault_id} to {to_vault_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to transfer funds: {e}")
            return False

    async def get_vault_transactions(self, vault_id: str, limit: int = 10) -> List[VaultTransaction]:
        """Get transaction history for a vault"""
        transactions = self.vault_transactions.get(vault_id, [])
        return sorted(transactions, key=lambda x: x.created_at, reverse=True)[:limit]

    async def get_vault_performance(self, vault_id: str) -> Optional[VaultPerformance]:
        """Get performance metrics for a vault"""
        return self.vault_performance.get(vault_id)

    async def get_vault_allocations(self, vault_id: str) -> List[VaultAllocation]:
        """Get allocations for a vault"""
        return self.vault_allocations.get(vault_id, [])

    async def get_vault_summary(self) -> Dict[str, Any]:
        """Get comprehensive vault summary"""
        try:
            total_balance = sum(vault.total_balance for vault in self.active_vaults.values())
            total_available = sum(vault.available_balance for vault in self.active_vaults.values())
            total_reserved = sum(vault.reserved_balance for vault in self.active_vaults.values())
            
            active_vaults = [v for v in self.active_vaults.values() if v.status == VaultStatus.ACTIVE]
            
            return {
                "total_vaults": len(self.active_vaults),
                "active_vaults": len(active_vaults),
                "total_balance": float(total_balance),
                "total_available": float(total_available),
                "total_reserved": float(total_reserved),
                "vault_types": self._get_vault_counts_by_type(),
                "vault_statuses": self._get_vault_counts_by_status(),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get vault summary: {e}")
            return {
                "total_vaults": 0,
                "active_vaults": 0,
                "total_balance": 0.0,
                "total_available": 0.0,
                "total_reserved": 0.0,
                "vault_types": {},
                "vault_statuses": {},
                "last_updated": datetime.now(timezone.utc).isoformat()
            }

    def _get_vault_counts_by_type(self) -> Dict[str, int]:
        """Get vault counts by type"""
        type_counts = {}
        for vault in self.active_vaults.values():
            vault_type = vault.vault_type.value
            type_counts[vault_type] = type_counts.get(vault_type, 0) + 1
        return type_counts

    def _get_vault_counts_by_status(self) -> Dict[str, int]:
        """Get vault counts by status"""
        status_counts = {}
        for vault in self.active_vaults.values():
            status = vault.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        return status_counts

    async def _load_active_vaults(self):
        """Load active vaults from database"""
        try:
            if self.supabase:
                response = self.supabase.table('vaults').select('*').execute()
                for vault_data in response.data:
                    vault = Vault(
                        vault_id=vault_data["vault_id"],
                        vault_name=vault_data["vault_name"],
                        vault_type=VaultType(vault_data["vault_type"]),
                        status=VaultStatus(vault_data["status"]),
                        total_balance=Decimal(str(vault_data["total_balance"])),
                        available_balance=Decimal(str(vault_data["available_balance"])),
                        reserved_balance=Decimal(str(vault_data["reserved_balance"])),
                        parent_vault_id=vault_data.get("parent_vault_id"),
                        hierarchy_level=vault_data.get("hierarchy_level", 0),
                        created_at=datetime.fromisoformat(vault_data["created_at"]),
                        metadata=vault_data.get("metadata", {})
                    )
                    self.active_vaults[vault.vault_id] = vault
        except Exception as e:
            logger.warning(f"Could not load vaults from database: {e}")
            # Continue with mock data

    async def _vault_monitoring_loop(self):
        """Background vault monitoring"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                # Implement vault health checks, balance validation, etc.
                logger.debug("Vault monitoring check completed")
            except Exception as e:
                logger.error(f"Error in vault monitoring loop: {e}")

    async def _performance_tracking_loop(self):
        """Background performance tracking"""
        while True:
            try:
                await asyncio.sleep(300)  # Update every 5 minutes
                # Update performance metrics for all vaults
                for vault_id in self.active_vaults.keys():
                    await self._update_vault_performance(vault_id)
                logger.debug("Performance tracking update completed")
            except Exception as e:
                logger.error(f"Error in performance tracking loop: {e}")

    async def _update_vault_performance(self, vault_id: str):
        """Update performance metrics for a vault"""
        try:
            vault = self.active_vaults.get(vault_id)
            if not vault:
                return

            # Calculate performance metrics (mock implementation)
            daily_pnl = Decimal(str((hash(vault_id) % 10000) - 5000))  # Mock daily P&L
            cumulative_pnl = vault.total_balance * Decimal("0.05")  # Mock 5% return
            
            performance = VaultPerformance(
                vault_id=vault_id,
                total_balance_usd=vault.total_balance,
                daily_pnl=daily_pnl,
                cumulative_pnl=cumulative_pnl,
                daily_return_pct=daily_pnl / vault.total_balance * 100,
                cumulative_return_pct=cumulative_pnl / vault.total_balance * 100,
                date=datetime.now(timezone.utc)
            )
            
            self.vault_performance[vault_id] = performance

        except Exception as e:
            logger.error(f"Failed to update performance for vault {vault_id}: {e}")

    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status and metrics"""
        return {
            "service": "vault_management_service",
            "status": "running",
            "active_vaults": len(self.active_vaults),
            "total_balance": float(sum(v.total_balance for v in self.active_vaults.values())),
            "vault_types": list(set(v.vault_type.value for v in self.active_vaults.values())),
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_vault_management_service():
    """Factory function to create VaultManagementService instance"""
    registry = get_registry()
    redis_client = registry.get_connection("redis")
    supabase_client = registry.get_connection("supabase")
    
    service = VaultManagementService(redis_client, supabase_client)
    return service