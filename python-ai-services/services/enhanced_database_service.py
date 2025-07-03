"""
Enhanced Database Service - Integration Layer for New Database Schema
Provides unified access to all newly created database tables with comprehensive functionality
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
import uuid
import json

from sqlalchemy import text, select, insert, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

# Import the database connection
from core.database_manager import get_connection_dependency

logger = logging.getLogger(__name__)

# ===============================================
# PYDANTIC MODELS FOR NEW DATABASE TABLES
# ===============================================

class BlockchainWalletModel(BaseModel):
    id: Optional[str] = None
    agent_id: Optional[str] = None
    user_id: Optional[str] = None
    chain_id: int
    chain_key: str  # 'eth-sepolia', 'arb-sepolia', etc.
    address: str
    private_key_encrypted: Optional[str] = None
    balance: Decimal = Decimal('0')
    native_balance: Decimal = Decimal('0')
    is_active: bool = True
    last_sync_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BlockchainTransactionModel(BaseModel):
    id: Optional[str] = None
    wallet_id: str
    tx_hash: str
    chain_id: int
    transaction_type: str  # 'send', 'receive', 'swap', 'farm_deposit', etc.
    from_address: str
    to_address: str
    amount: Decimal
    token_address: Optional[str] = None
    token_symbol: Optional[str] = None
    gas_fee: Optional[Decimal] = None
    gas_used: Optional[int] = None
    gas_price: Optional[Decimal] = None
    block_number: Optional[int] = None
    transaction_status: str = 'pending'  # 'pending', 'confirmed', 'failed'
    confirmation_count: int = 0
    timestamp: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class SystemEventModel(BaseModel):
    id: Optional[str] = None
    event_type: str  # 'trade.executed', 'agent.decision', 'portfolio.update', etc.
    event_source: str  # 'agent', 'farm', 'user', 'system'
    source_id: Optional[str] = None
    event_data: Dict[str, Any]
    event_priority: int = 5  # 1-10, higher = more important
    target_users: List[str] = []
    broadcast: bool = False
    processed: bool = False
    subscribers_notified: int = 0
    retry_count: int = 0
    created_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None

class NotificationModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    notification_type: str  # 'trade', 'goal', 'alert', 'system', etc.
    title: str
    message: str
    action_url: Optional[str] = None
    action_data: Optional[Dict[str, Any]] = None
    priority: int = 5  # 1-10, higher = more urgent
    category: str = 'general'  # 'trading', 'portfolio', 'system', etc.
    is_read: bool = False
    is_dismissed: bool = False
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

class MLPredictionModel(BaseModel):
    id: Optional[str] = None
    model_name: str
    model_version: str = '1.0'
    prediction_type: str  # 'price', 'trend', 'risk', 'opportunity'
    input_data: Dict[str, Any]
    prediction_data: Dict[str, Any]
    confidence_score: Optional[Decimal] = None
    prediction_horizon: Optional[timedelta] = None
    actual_outcome: Optional[Dict[str, Any]] = None
    accuracy_score: Optional[Decimal] = None
    prediction_status: str = 'active'  # 'active', 'expired', 'validated'
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None

class RealtimeMetricModel(BaseModel):
    id: Optional[str] = None
    metric_name: str
    metric_value: Decimal
    metric_unit: Optional[str] = None  # 'USD', 'percentage', 'count', etc.
    source_type: str  # 'agent', 'farm', 'portfolio', 'system'
    source_id: str
    aggregation_period: str = 'instant'  # 'instant', '1m', '5m', '1h', '1d'
    timestamp: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class AuditLogModel(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    action: str  # 'create', 'update', 'delete', 'execute', etc.
    resource_type: str  # 'agent', 'farm', 'goal', 'trade', etc.
    resource_id: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    change_summary: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    api_endpoint: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: Optional[datetime] = None

# ===============================================
# ENHANCED DATABASE SERVICE CLASS
# ===============================================

class EnhancedDatabaseService:
    """
    Enhanced Database Service providing unified access to all new database tables
    with comprehensive CRUD operations, analytics, and real-time capabilities.
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        
    # ===============================================
    # BLOCKCHAIN WALLET OPERATIONS
    # ===============================================
    
    async def create_blockchain_wallet(self, wallet_data: BlockchainWalletModel) -> Dict[str, Any]:
        """Create a new blockchain wallet for an agent or user"""
        try:
            wallet_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.blockchain_wallets 
                (id, agent_id, user_id, chain_id, chain_key, address, private_key_encrypted, 
                 balance, native_balance, is_active, last_sync_at, created_at, updated_at)
                VALUES (:id, :agent_id, :user_id, :chain_id, :chain_key, :address, :private_key_encrypted,
                        :balance, :native_balance, :is_active, :last_sync_at, :created_at, :updated_at)
                RETURNING *
            """)
            
            now = datetime.now(timezone.utc)
            result = await self.db.execute(query, {
                'id': wallet_id,
                'agent_id': wallet_data.agent_id,
                'user_id': wallet_data.user_id,
                'chain_id': wallet_data.chain_id,
                'chain_key': wallet_data.chain_key,
                'address': wallet_data.address,
                'private_key_encrypted': wallet_data.private_key_encrypted,
                'balance': float(wallet_data.balance),
                'native_balance': float(wallet_data.native_balance),
                'is_active': wallet_data.is_active,
                'last_sync_at': now,
                'created_at': now,
                'updated_at': now
            })
            
            await self.db.commit()
            wallet = result.fetchone()
            
            # Log audit trail
            await self.create_audit_log(
                action='create',
                resource_type='blockchain_wallet',
                resource_id=wallet_id,
                new_values=wallet_data.dict(),
                change_summary=f"Created blockchain wallet for chain {wallet_data.chain_key}"
            )
            
            return {'success': True, 'wallet_id': wallet_id, 'wallet': dict(wallet._mapping)}
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating blockchain wallet: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_user_wallets(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all blockchain wallets for a specific user"""
        try:
            query = text("""
                SELECT bw.*, a.name as agent_name
                FROM public.blockchain_wallets bw
                LEFT JOIN public.agents a ON bw.agent_id = a.id
                WHERE bw.user_id = :user_id OR bw.agent_id IN (
                    SELECT id FROM public.agents WHERE user_id = :user_id
                )
                ORDER BY bw.created_at DESC
            """)
            
            result = await self.db.execute(query, {'user_id': user_id})
            wallets = [dict(row._mapping) for row in result.fetchall()]
            return wallets
            
        except Exception as e:
            logger.error(f"Error getting user wallets: {e}")
            return []
    
    async def update_wallet_balance(self, wallet_id: str, balance: Decimal, native_balance: Decimal) -> bool:
        """Update wallet balance and native balance"""
        try:
            query = text("""
                UPDATE public.blockchain_wallets 
                SET balance = :balance, native_balance = :native_balance, 
                    last_sync_at = :sync_time, updated_at = :updated_at
                WHERE id = :wallet_id
            """)
            
            now = datetime.now(timezone.utc)
            await self.db.execute(query, {
                'wallet_id': wallet_id,
                'balance': float(balance),
                'native_balance': float(native_balance),
                'sync_time': now,
                'updated_at': now
            })
            
            await self.db.commit()
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating wallet balance: {e}")
            return False
    
    # ===============================================
    # BLOCKCHAIN TRANSACTION OPERATIONS
    # ===============================================
    
    async def create_blockchain_transaction(self, tx_data: BlockchainTransactionModel) -> Dict[str, Any]:
        """Create a new blockchain transaction record"""
        try:
            tx_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.blockchain_transactions 
                (id, wallet_id, tx_hash, chain_id, transaction_type, from_address, to_address,
                 amount, token_address, token_symbol, gas_fee, gas_used, gas_price, 
                 block_number, transaction_status, confirmation_count, timestamp, metadata)
                VALUES (:id, :wallet_id, :tx_hash, :chain_id, :transaction_type, :from_address, 
                        :to_address, :amount, :token_address, :token_symbol, :gas_fee, :gas_used,
                        :gas_price, :block_number, :transaction_status, :confirmation_count,
                        :timestamp, :metadata)
                RETURNING *
            """)
            
            now = datetime.now(timezone.utc)
            result = await self.db.execute(query, {
                'id': tx_id,
                'wallet_id': tx_data.wallet_id,
                'tx_hash': tx_data.tx_hash,
                'chain_id': tx_data.chain_id,
                'transaction_type': tx_data.transaction_type,
                'from_address': tx_data.from_address,
                'to_address': tx_data.to_address,
                'amount': float(tx_data.amount),
                'token_address': tx_data.token_address,
                'token_symbol': tx_data.token_symbol,
                'gas_fee': float(tx_data.gas_fee) if tx_data.gas_fee else None,
                'gas_used': tx_data.gas_used,
                'gas_price': float(tx_data.gas_price) if tx_data.gas_price else None,
                'block_number': tx_data.block_number,
                'transaction_status': tx_data.transaction_status,
                'confirmation_count': tx_data.confirmation_count,
                'timestamp': tx_data.timestamp or now,
                'metadata': json.dumps(tx_data.metadata)
            })
            
            await self.db.commit()
            transaction = result.fetchone()
            
            # Create system event for real-time updates
            await self.create_system_event(
                event_type='blockchain.transaction_created',
                event_source='system',
                source_id=tx_data.wallet_id,
                event_data={
                    'transaction_id': tx_id,
                    'tx_hash': tx_data.tx_hash,
                    'amount': str(tx_data.amount),
                    'type': tx_data.transaction_type,
                    'status': tx_data.transaction_status
                }
            )
            
            return {'success': True, 'transaction_id': tx_id, 'transaction': dict(transaction._mapping)}
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating blockchain transaction: {e}")
            return {'success': False, 'error': str(e)}
    
    async def get_wallet_transactions(self, wallet_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get transactions for a specific wallet"""
        try:
            query = text("""
                SELECT * FROM public.blockchain_transactions
                WHERE wallet_id = :wallet_id
                ORDER BY timestamp DESC
                LIMIT :limit
            """)
            
            result = await self.db.execute(query, {'wallet_id': wallet_id, 'limit': limit})
            transactions = [dict(row._mapping) for row in result.fetchall()]
            return transactions
            
        except Exception as e:
            logger.error(f"Error getting wallet transactions: {e}")
            return []
    
    # ===============================================
    # SYSTEM EVENT OPERATIONS
    # ===============================================
    
    async def create_system_event(self, event_type: str, event_source: str, source_id: Optional[str], 
                                 event_data: Dict[str, Any], target_users: List[str] = None, 
                                 broadcast: bool = False, priority: int = 5) -> str:
        """Create a new system event for real-time streaming"""
        try:
            event_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.system_events 
                (id, event_type, event_source, source_id, event_data, event_priority,
                 target_users, broadcast, processed, created_at)
                VALUES (:id, :event_type, :event_source, :source_id, :event_data, :event_priority,
                        :target_users, :broadcast, :processed, :created_at)
            """)
            
            await self.db.execute(query, {
                'id': event_id,
                'event_type': event_type,
                'event_source': event_source,
                'source_id': source_id,
                'event_data': json.dumps(event_data),
                'event_priority': priority,
                'target_users': target_users or [],
                'broadcast': broadcast,
                'processed': False,
                'created_at': datetime.now(timezone.utc)
            })
            
            await self.db.commit()
            return event_id
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating system event: {e}")
            return ""
    
    async def get_unprocessed_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get unprocessed system events for real-time streaming"""
        try:
            query = text("""
                SELECT * FROM public.system_events
                WHERE processed = false
                ORDER BY event_priority DESC, created_at ASC
                LIMIT :limit
            """)
            
            result = await self.db.execute(query, {'limit': limit})
            events = [dict(row._mapping) for row in result.fetchall()]
            return events
            
        except Exception as e:
            logger.error(f"Error getting unprocessed events: {e}")
            return []
    
    async def mark_event_processed(self, event_id: str, subscribers_notified: int = 0) -> bool:
        """Mark a system event as processed"""
        try:
            query = text("""
                UPDATE public.system_events 
                SET processed = true, processed_at = :processed_at, subscribers_notified = :subscribers_notified
                WHERE id = :event_id
            """)
            
            await self.db.execute(query, {
                'event_id': event_id,
                'processed_at': datetime.now(timezone.utc),
                'subscribers_notified': subscribers_notified
            })
            
            await self.db.commit()
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error marking event processed: {e}")
            return False
    
    # ===============================================
    # NOTIFICATION OPERATIONS
    # ===============================================
    
    async def create_notification(self, notification_data: NotificationModel) -> str:
        """Create a new user notification"""
        try:
            notification_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.notifications 
                (id, user_id, notification_type, title, message, action_url, action_data,
                 priority, category, is_read, is_dismissed, expires_at, created_at)
                VALUES (:id, :user_id, :notification_type, :title, :message, :action_url, :action_data,
                        :priority, :category, :is_read, :is_dismissed, :expires_at, :created_at)
            """)
            
            await self.db.execute(query, {
                'id': notification_id,
                'user_id': notification_data.user_id,
                'notification_type': notification_data.notification_type,
                'title': notification_data.title,
                'message': notification_data.message,
                'action_url': notification_data.action_url,
                'action_data': json.dumps(notification_data.action_data) if notification_data.action_data else None,
                'priority': notification_data.priority,
                'category': notification_data.category,
                'is_read': notification_data.is_read,
                'is_dismissed': notification_data.is_dismissed,
                'expires_at': notification_data.expires_at,
                'created_at': datetime.now(timezone.utc)
            })
            
            await self.db.commit()
            
            # Create system event for real-time notification
            await self.create_system_event(
                event_type='notification.created',
                event_source='system',
                source_id=notification_data.user_id,
                event_data={
                    'notification_id': notification_id,
                    'title': notification_data.title,
                    'type': notification_data.notification_type,
                    'priority': notification_data.priority
                },
                target_users=[notification_data.user_id]
            )
            
            return notification_id
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating notification: {e}")
            return ""
    
    async def get_user_notifications(self, user_id: str, unread_only: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
        """Get notifications for a specific user"""
        try:
            where_clause = "WHERE user_id = :user_id"
            if unread_only:
                where_clause += " AND is_read = false"
            
            query = text(f"""
                SELECT * FROM public.notifications
                {where_clause}
                ORDER BY priority DESC, created_at DESC
                LIMIT :limit
            """)
            
            result = await self.db.execute(query, {'user_id': user_id, 'limit': limit})
            notifications = [dict(row._mapping) for row in result.fetchall()]
            return notifications
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {e}")
            return []
    
    async def mark_notification_read(self, notification_id: str) -> bool:
        """Mark a notification as read"""
        try:
            query = text("""
                UPDATE public.notifications 
                SET is_read = true, read_at = :read_at
                WHERE id = :notification_id
            """)
            
            await self.db.execute(query, {
                'notification_id': notification_id,
                'read_at': datetime.now(timezone.utc)
            })
            
            await self.db.commit()
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error marking notification read: {e}")
            return False
    
    # ===============================================
    # REALTIME METRICS OPERATIONS
    # ===============================================
    
    async def record_realtime_metric(self, metric_data: RealtimeMetricModel) -> bool:
        """Record a real-time metric"""
        try:
            metric_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.realtime_metrics 
                (id, metric_name, metric_value, metric_unit, source_type, source_id,
                 aggregation_period, timestamp, metadata)
                VALUES (:id, :metric_name, :metric_value, :metric_unit, :source_type, :source_id,
                        :aggregation_period, :timestamp, :metadata)
            """)
            
            await self.db.execute(query, {
                'id': metric_id,
                'metric_name': metric_data.metric_name,
                'metric_value': float(metric_data.metric_value),
                'metric_unit': metric_data.metric_unit,
                'source_type': metric_data.source_type,
                'source_id': metric_data.source_id,
                'aggregation_period': metric_data.aggregation_period,
                'timestamp': metric_data.timestamp or datetime.now(timezone.utc),
                'metadata': json.dumps(metric_data.metadata)
            })
            
            await self.db.commit()
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error recording realtime metric: {e}")
            return False
    
    async def get_recent_metrics(self, source_type: str = None, source_id: str = None, 
                                metric_name: str = None, hours: int = 24) -> List[Dict[str, Any]]:
        """Get recent real-time metrics with optional filtering"""
        try:
            where_conditions = ["timestamp >= :since"]
            params = {'since': datetime.now(timezone.utc) - timedelta(hours=hours)}
            
            if source_type:
                where_conditions.append("source_type = :source_type")
                params['source_type'] = source_type
            
            if source_id:
                where_conditions.append("source_id = :source_id")
                params['source_id'] = source_id
                
            if metric_name:
                where_conditions.append("metric_name = :metric_name")
                params['metric_name'] = metric_name
            
            where_clause = " AND ".join(where_conditions)
            
            query = text(f"""
                SELECT * FROM public.realtime_metrics
                WHERE {where_clause}
                ORDER BY timestamp DESC
                LIMIT 1000
            """)
            
            result = await self.db.execute(query, params)
            metrics = [dict(row._mapping) for row in result.fetchall()]
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting recent metrics: {e}")
            return []
    
    # ===============================================
    # ML PREDICTION OPERATIONS
    # ===============================================
    
    async def create_ml_prediction(self, prediction_data: MLPredictionModel) -> str:
        """Create a new ML prediction record"""
        try:
            prediction_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.ml_predictions 
                (id, model_name, model_version, prediction_type, input_data, prediction_data,
                 confidence_score, prediction_horizon, prediction_status, created_at, expires_at)
                VALUES (:id, :model_name, :model_version, :prediction_type, :input_data, :prediction_data,
                        :confidence_score, :prediction_horizon, :prediction_status, :created_at, :expires_at)
            """)
            
            now = datetime.now(timezone.utc)
            await self.db.execute(query, {
                'id': prediction_id,
                'model_name': prediction_data.model_name,
                'model_version': prediction_data.model_version,
                'prediction_type': prediction_data.prediction_type,
                'input_data': json.dumps(prediction_data.input_data),
                'prediction_data': json.dumps(prediction_data.prediction_data),
                'confidence_score': float(prediction_data.confidence_score) if prediction_data.confidence_score else None,
                'prediction_horizon': prediction_data.prediction_horizon,
                'prediction_status': prediction_data.prediction_status,
                'created_at': now,
                'expires_at': prediction_data.expires_at
            })
            
            await self.db.commit()
            return prediction_id
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating ML prediction: {e}")
            return ""
    
    async def get_active_predictions(self, prediction_type: str = None, model_name: str = None) -> List[Dict[str, Any]]:
        """Get active ML predictions with optional filtering"""
        try:
            where_conditions = ["prediction_status = 'active'", "(expires_at IS NULL OR expires_at > :now)"]
            params = {'now': datetime.now(timezone.utc)}
            
            if prediction_type:
                where_conditions.append("prediction_type = :prediction_type")
                params['prediction_type'] = prediction_type
                
            if model_name:
                where_conditions.append("model_name = :model_name")
                params['model_name'] = model_name
            
            where_clause = " AND ".join(where_conditions)
            
            query = text(f"""
                SELECT * FROM public.ml_predictions
                WHERE {where_clause}
                ORDER BY confidence_score DESC, created_at DESC
                LIMIT 100
            """)
            
            result = await self.db.execute(query, params)
            predictions = [dict(row._mapping) for row in result.fetchall()]
            return predictions
            
        except Exception as e:
            logger.error(f"Error getting active predictions: {e}")
            return []
    
    # ===============================================
    # AUDIT LOG OPERATIONS
    # ===============================================
    
    async def create_audit_log(self, action: str, resource_type: str, resource_id: str,
                              user_id: str = None, agent_id: str = None, old_values: Dict = None,
                              new_values: Dict = None, change_summary: str = None,
                              ip_address: str = None, user_agent: str = None) -> str:
        """Create an audit log entry"""
        try:
            audit_id = str(uuid.uuid4())
            query = text("""
                INSERT INTO public.audit_logs 
                (id, user_id, agent_id, action, resource_type, resource_id, old_values, new_values,
                 change_summary, ip_address, user_agent, timestamp)
                VALUES (:id, :user_id, :agent_id, :action, :resource_type, :resource_id, :old_values,
                        :new_values, :change_summary, :ip_address, :user_agent, :timestamp)
            """)
            
            await self.db.execute(query, {
                'id': audit_id,
                'user_id': user_id,
                'agent_id': agent_id,
                'action': action,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'old_values': json.dumps(old_values) if old_values else None,
                'new_values': json.dumps(new_values) if new_values else None,
                'change_summary': change_summary,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'timestamp': datetime.now(timezone.utc)
            })
            
            await self.db.commit()
            return audit_id
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating audit log: {e}")
            return ""
    
    # ===============================================
    # ANALYTICS AND DASHBOARD OPERATIONS
    # ===============================================
    
    async def get_dashboard_summary(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive dashboard summary for a user"""
        try:
            # Get user's wallets and total balances
            wallets = await self.get_user_wallets(user_id)
            total_balance = sum(float(w.get('balance', 0)) + float(w.get('native_balance', 0)) for w in wallets)
            
            # Get recent transactions count
            recent_tx_query = text("""
                SELECT COUNT(*) as tx_count
                FROM public.blockchain_transactions bt
                JOIN public.blockchain_wallets bw ON bt.wallet_id = bw.id
                WHERE (bw.user_id = :user_id OR bw.agent_id IN (
                    SELECT id FROM public.agents WHERE user_id = :user_id
                )) AND bt.timestamp >= :since
            """)
            
            since = datetime.now(timezone.utc) - timedelta(hours=24)
            tx_result = await self.db.execute(recent_tx_query, {'user_id': user_id, 'since': since})
            recent_transactions = tx_result.fetchone()[0]
            
            # Get unread notifications count
            unread_notifications = len(await self.get_user_notifications(user_id, unread_only=True))
            
            # Get active predictions count
            active_predictions = len(await self.get_active_predictions())
            
            # Get recent metrics
            portfolio_metrics = await self.get_recent_metrics(
                source_type='portfolio', 
                source_id=user_id, 
                hours=1
            )
            
            return {
                'total_portfolio_value': total_balance,
                'wallet_count': len(wallets),
                'recent_transactions_24h': recent_transactions,
                'unread_notifications': unread_notifications,
                'active_predictions': active_predictions,
                'recent_metrics': len(portfolio_metrics),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard summary: {e}")
            return {}

# ===============================================
# SERVICE FACTORY AND DEPENDENCY INJECTION
# ===============================================

async def get_enhanced_database_service(db: AsyncSession = Depends(get_connection_dependency)) -> EnhancedDatabaseService:
    """Dependency injection for EnhancedDatabaseService"""
    return EnhancedDatabaseService(db)

# Export the service class for use in other modules
__all__ = [
    'EnhancedDatabaseService',
    'get_enhanced_database_service',
    'BlockchainWalletModel',
    'BlockchainTransactionModel',
    'SystemEventModel',
    'NotificationModel',
    'MLPredictionModel',
    'RealtimeMetricModel',
    'AuditLogModel'
]