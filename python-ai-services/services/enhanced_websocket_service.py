"""
Enhanced WebSocket Service for Real-time Communication
Provides comprehensive WebSocket handling with event routing, subscriptions,
and integration with the enhanced database system
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, List, Any, Optional
from uuid import uuid4
import traceback

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

# Import enhanced database service
from services.enhanced_database_service import (
    EnhancedDatabaseService, SystemEventModel, NotificationModel,
    RealtimeMetricModel, get_enhanced_database_service
)

logger = logging.getLogger(__name__)

# WebSocket Message Models
class WebSocketMessage(BaseModel):
    type: str
    data: Any
    timestamp: str
    id: Optional[str] = None

class SubscriptionRequest(BaseModel):
    types: List[str]

class ConnectionInfo(BaseModel):
    connection_id: str
    user_id: Optional[str] = None
    agent_ids: List[str] = []
    subscriptions: Set[str] = Field(default_factory=set)
    connected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnhancedWebSocketService:
    """
    Enhanced WebSocket service for real-time communication
    """
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
        self.connection_info: Dict[str, ConnectionInfo] = {}
        self.event_handlers: Dict[str, callable] = {}
        self.setup_event_handlers()
        self.db_service: Optional[EnhancedDatabaseService] = None
        
    def setup_event_handlers(self):
        """Register event handlers for different message types"""
        self.event_handlers = {
            'ping': self.handle_ping,
            'subscribe': self.handle_subscribe,
            'unsubscribe': self.handle_unsubscribe,
            'get_portfolio': self.handle_get_portfolio,
            'get_agents': self.handle_get_agents,
            'execute_trade': self.handle_execute_trade,
            'get_market_data': self.handle_get_market_data,
            'get_notifications': self.handle_get_notifications,
            'mark_notification_read': self.handle_mark_notification_read,
            'get_metrics': self.handle_get_metrics,
            'get_predictions': self.handle_get_predictions,
        }
    
    async def connect(self, websocket: WebSocket, user_id: str = None) -> str:
        """Handle new WebSocket connection"""
        await websocket.accept()
        
        connection_id = str(uuid4())
        self.connections[connection_id] = websocket
        self.connection_info[connection_id] = ConnectionInfo(
            connection_id=connection_id,
            user_id=user_id or "solo_operator"
        )
        
        # Send connection confirmation
        await self.send_message(connection_id, WebSocketMessage(
            type='connected',
            data={'connection_id': connection_id, 'user_id': user_id},
            timestamp=datetime.now(timezone.utc).isoformat()
        ))
        
        # Send initial data
        await self.send_initial_data(connection_id)
        
        logger.info(f"WebSocket connected: {connection_id} (user: {user_id})")
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """Handle WebSocket disconnection"""
        if connection_id in self.connections:
            del self.connections[connection_id]
            del self.connection_info[connection_id]
            logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def handle_message(self, connection_id: str, message: str, db: EnhancedDatabaseService):
        """Process incoming WebSocket message"""
        self.db_service = db
        
        try:
            data = json.loads(message)
            ws_message = WebSocketMessage(**data)
            
            # Log received message
            logger.debug(f"Received message: {ws_message.type} from {connection_id}")
            
            # Route to appropriate handler
            handler = self.event_handlers.get(ws_message.type)
            if handler:
                response = await handler(connection_id, ws_message)
                if response:
                    await self.send_message(connection_id, response)
            else:
                await self.send_error(connection_id, f"Unknown message type: {ws_message.type}", ws_message.id)
                
        except json.JSONDecodeError:
            await self.send_error(connection_id, "Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message: {e}\n{traceback.format_exc()}")
            await self.send_error(connection_id, str(e))
    
    async def send_message(self, connection_id: str, message: WebSocketMessage):
        """Send message to specific connection"""
        if connection_id in self.connections:
            try:
                await self.connections[connection_id].send_text(message.json())
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                await self.disconnect(connection_id)
    
    async def send_error(self, connection_id: str, error: str, request_id: str = None):
        """Send error message to connection"""
        await self.send_message(connection_id, WebSocketMessage(
            type='error',
            data={'error': error, 'request_id': request_id},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=request_id
        ))
    
    async def broadcast(self, message: WebSocketMessage, filter_func=None):
        """Broadcast message to all or filtered connections"""
        disconnected = []
        
        for conn_id, websocket in self.connections.items():
            if filter_func and not filter_func(self.connection_info[conn_id]):
                continue
                
            try:
                await websocket.send_text(message.json())
            except Exception as e:
                logger.error(f"Error broadcasting to {conn_id}: {e}")
                disconnected.append(conn_id)
        
        # Clean up disconnected connections
        for conn_id in disconnected:
            await self.disconnect(conn_id)
    
    async def send_to_subscribers(self, event_type: str, data: Any):
        """Send message to all connections subscribed to event type"""
        message = WebSocketMessage(
            type=event_type,
            data=data,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        def is_subscribed(info: ConnectionInfo) -> bool:
            return event_type in info.subscriptions or any(
                event_type.startswith(sub) for sub in info.subscriptions
            )
        
        await self.broadcast(message, filter_func=is_subscribed)
    
    # Event Handlers
    async def handle_ping(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle ping message"""
        return WebSocketMessage(
            type='pong',
            data={'timestamp': datetime.now(timezone.utc).timestamp()},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_subscribe(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle subscription request"""
        sub_request = SubscriptionRequest(**message.data)
        info = self.connection_info[connection_id]
        
        for event_type in sub_request.types:
            info.subscriptions.add(event_type)
        
        return WebSocketMessage(
            type='subscribed',
            data={'types': sub_request.types},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_unsubscribe(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle unsubscription request"""
        sub_request = SubscriptionRequest(**message.data)
        info = self.connection_info[connection_id]
        
        for event_type in sub_request.types:
            info.subscriptions.discard(event_type)
        
        return WebSocketMessage(
            type='unsubscribed',
            data={'types': sub_request.types},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_get_portfolio(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle portfolio data request"""
        info = self.connection_info[connection_id]
        
        if self.db_service:
            summary = await self.db_service.get_dashboard_summary(info.user_id)
            return WebSocketMessage(
                type='portfolio.update',
                data=summary,
                timestamp=datetime.now(timezone.utc).isoformat(),
                id=message.id
            )
        
        return WebSocketMessage(
            type='portfolio.update',
            data={'error': 'Database service not available'},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_get_agents(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle agent data request"""
        # Mock agent data for now
        agents = [
            {
                'id': 'marcus_momentum',
                'name': 'Marcus Momentum',
                'status': 'active',
                'pnl': 3247.85,
                'trades': 47,
                'win_rate': 0.74
            },
            {
                'id': 'alex_arbitrage',
                'name': 'Alex Arbitrage',
                'status': 'active',
                'pnl': 1234.56,
                'trades': 156,
                'win_rate': 0.91
            }
        ]
        
        return WebSocketMessage(
            type='agent.update',
            data={'agents': agents},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_execute_trade(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle trade execution request"""
        # This would integrate with the trading services
        trade_data = message.data
        
        # Mock trade execution
        trade_result = {
            'order_id': str(uuid4()),
            'status': 'submitted',
            'symbol': trade_data.get('symbol'),
            'side': trade_data.get('side'),
            'quantity': trade_data.get('quantity'),
            'price': trade_data.get('price')
        }
        
        # Broadcast trade execution to relevant subscribers
        await self.send_to_subscribers('trade.executed', trade_result)
        
        return WebSocketMessage(
            type='trade.response',
            data=trade_result,
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_get_market_data(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle market data request"""
        symbol = message.data.get('symbol', 'BTC/USDT')
        
        # Mock market data
        market_data = {
            'symbol': symbol,
            'price': 68467.50,
            'change': 2.34,
            'volume': 1234567890,
            'high': 69000.00,
            'low': 67000.00
        }
        
        return WebSocketMessage(
            type=f'market.update.{symbol}',
            data=market_data,
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_get_notifications(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle notifications request"""
        info = self.connection_info[connection_id]
        
        if self.db_service:
            notifications = await self.db_service.get_user_notifications(
                info.user_id,
                unread_only=message.data.get('unread_only', False),
                limit=message.data.get('limit', 50)
            )
            
            return WebSocketMessage(
                type='notifications.list',
                data={'notifications': notifications},
                timestamp=datetime.now(timezone.utc).isoformat(),
                id=message.id
            )
        
        return WebSocketMessage(
            type='notifications.list',
            data={'notifications': []},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_mark_notification_read(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle mark notification as read request"""
        notification_id = message.data.get('notification_id')
        
        if self.db_service and notification_id:
            success = await self.db_service.mark_notification_read(notification_id)
            
            return WebSocketMessage(
                type='notification.marked_read',
                data={'notification_id': notification_id, 'success': success},
                timestamp=datetime.now(timezone.utc).isoformat(),
                id=message.id
            )
        
        return WebSocketMessage(
            type='notification.marked_read',
            data={'error': 'Invalid request'},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_get_metrics(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle metrics request"""
        if self.db_service:
            metrics = await self.db_service.get_recent_metrics(
                source_type=message.data.get('source_type'),
                source_id=message.data.get('source_id'),
                metric_name=message.data.get('metric_name'),
                hours=message.data.get('hours', 24)
            )
            
            return WebSocketMessage(
                type='metrics.data',
                data={'metrics': metrics},
                timestamp=datetime.now(timezone.utc).isoformat(),
                id=message.id
            )
        
        return WebSocketMessage(
            type='metrics.data',
            data={'metrics': []},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def handle_get_predictions(self, connection_id: str, message: WebSocketMessage) -> WebSocketMessage:
        """Handle ML predictions request"""
        if self.db_service:
            predictions = await self.db_service.get_active_predictions(
                prediction_type=message.data.get('prediction_type'),
                model_name=message.data.get('model_name')
            )
            
            return WebSocketMessage(
                type='predictions.data',
                data={'predictions': predictions},
                timestamp=datetime.now(timezone.utc).isoformat(),
                id=message.id
            )
        
        return WebSocketMessage(
            type='predictions.data',
            data={'predictions': []},
            timestamp=datetime.now(timezone.utc).isoformat(),
            id=message.id
        )
    
    async def send_initial_data(self, connection_id: str):
        """Send initial data to newly connected client"""
        info = self.connection_info[connection_id]
        
        # Send portfolio summary
        if self.db_service:
            summary = await self.db_service.get_dashboard_summary(info.user_id)
            await self.send_message(connection_id, WebSocketMessage(
                type='portfolio.update',
                data=summary,
                timestamp=datetime.now(timezone.utc).isoformat()
            ))
        
        # Send recent notifications
        if self.db_service:
            notifications = await self.db_service.get_user_notifications(
                info.user_id,
                unread_only=True,
                limit=10
            )
            
            if notifications:
                await self.send_message(connection_id, WebSocketMessage(
                    type='notifications.initial',
                    data={'notifications': notifications},
                    timestamp=datetime.now(timezone.utc).isoformat()
                ))
    
    # Background Tasks
    async def process_system_events(self):
        """Process unprocessed system events and broadcast to subscribers"""
        while True:
            try:
                if self.db_service:
                    events = await self.db_service.get_unprocessed_events(limit=50)
                    
                    for event in events:
                        # Broadcast event to relevant subscribers
                        await self.send_to_subscribers(
                            f"system.event.{event['event_type']}",
                            event['event_data']
                        )
                        
                        # Mark event as processed
                        await self.db_service.mark_event_processed(
                            event['id'],
                            subscribers_notified=len(self.connections)
                        )
                
                await asyncio.sleep(1)  # Check every second
                
            except Exception as e:
                logger.error(f"Error processing system events: {e}")
                await asyncio.sleep(5)  # Wait longer on error
    
    async def broadcast_market_updates(self):
        """Broadcast mock market updates for demo purposes"""
        symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
        
        while True:
            try:
                for symbol in symbols:
                    # Generate mock market update
                    import random
                    base_prices = {'BTC/USDT': 68000, 'ETH/USDT': 3800, 'SOL/USDT': 140}
                    base_price = base_prices.get(symbol, 100)
                    
                    market_data = {
                        'symbol': symbol,
                        'price': base_price + random.uniform(-500, 500),
                        'change': random.uniform(-5, 5),
                        'volume': random.randint(1000000, 10000000),
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                    
                    await self.send_to_subscribers(f'market.update.{symbol}', market_data)
                
                await asyncio.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                logger.error(f"Error broadcasting market updates: {e}")
                await asyncio.sleep(10)

# Global WebSocket service instance
ws_service = EnhancedWebSocketService()

# FastAPI WebSocket endpoint handler
async def websocket_endpoint(websocket: WebSocket, db: EnhancedDatabaseService):
    """FastAPI WebSocket endpoint"""
    connection_id = await ws_service.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            await ws_service.handle_message(connection_id, data, db)
            
    except WebSocketDisconnect:
        await ws_service.disconnect(connection_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await ws_service.disconnect(connection_id)

# Export for use in main application
__all__ = ['ws_service', 'websocket_endpoint', 'EnhancedWebSocketService']