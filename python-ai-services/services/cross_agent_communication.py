"""
Cross-Agent Communication Service
Enables real-time communication and coordination between autonomous agents
Built on top of existing autonomous_agent_coordinator.py
"""

import asyncio
import logging
import uuid
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Types of messages agents can send"""
    MARKET_INSIGHT = "market_insight"
    TRADING_OPPORTUNITY = "trading_opportunity"
    RISK_ALERT = "risk_alert"
    COORDINATION_REQUEST = "coordination_request"
    DECISION_VOTE = "decision_vote"
    STATUS_UPDATE = "status_update"
    RESOURCE_REQUEST = "resource_request"
    PERFORMANCE_SHARE = "performance_share"

class MessagePriority(Enum):
    """Message priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ConversationStatus(Enum):
    """Status of agent conversations"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

@dataclass
class AgentMessage:
    """Individual message between agents"""
    message_id: str
    conversation_id: str
    from_agent_id: str
    to_agent_id: Optional[str]  # None for broadcast
    message_type: MessageType
    priority: MessagePriority
    subject: str
    content: str
    metadata: Dict[str, Any]
    timestamp: datetime
    read: bool = False
    processed: bool = False
    response_required: bool = False
    expires_at: Optional[datetime] = None

@dataclass
class AgentConversation:
    """Conversation thread between agents"""
    conversation_id: str
    participants: List[str]
    topic: str
    status: ConversationStatus
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_id: Optional[str] = None
    metadata: Dict[str, Any] = None

@dataclass
class CommunicationMetrics:
    """Metrics for agent communication"""
    total_messages: int
    messages_by_type: Dict[MessageType, int]
    response_times: Dict[str, float]
    active_conversations: int
    agent_participation: Dict[str, int]
    message_success_rate: float

class CrossAgentCommunication:
    """
    Advanced cross-agent communication system
    Built on existing autonomous infrastructure
    """
    
    def __init__(self):
        self.db_service = None
        self.event_service = None
        self.agent_coordinator = None
        
        # Message storage
        self.active_messages: Dict[str, AgentMessage] = {}
        self.conversations: Dict[str, AgentConversation] = {}
        self.message_history: List[AgentMessage] = []
        
        # Agent management
        self.registered_agents: Set[str] = set()
        self.agent_capabilities: Dict[str, Dict[str, Any]] = {}
        self.agent_preferences: Dict[str, Dict[str, Any]] = {}
        
        # Communication rules
        self.communication_rules: Dict[str, Any] = {
            'max_messages_per_minute': 10,
            'max_conversation_duration': 3600,  # 1 hour
            'auto_archive_after_hours': 24,
            'require_response_timeout': 300,  # 5 minutes
            'broadcast_cooldown': 60  # 1 minute
        }
        
        # Metrics
        self.metrics = CommunicationMetrics(
            total_messages=0,
            messages_by_type={},
            response_times={},
            active_conversations=0,
            agent_participation={},
            message_success_rate=0.0
        )
        
        # Background tasks
        self.message_processor_task = None
        self.conversation_manager_task = None
        self.metrics_updater_task = None
        
        logger.info("Cross-Agent Communication service initialized")
    
    async def initialize(self):
        """Initialize the communication service"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            
            # Create database tables
            if self.db_service:
                await self._create_communication_tables()
            
            # Load existing data
            await self._load_existing_data()
            
            # Start background tasks
            self.message_processor_task = asyncio.create_task(self._message_processor_loop())
            self.conversation_manager_task = asyncio.create_task(self._conversation_manager_loop())
            self.metrics_updater_task = asyncio.create_task(self._metrics_updater_loop())
            
            logger.info("Cross-Agent Communication service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Cross-Agent Communication: {e}")
            raise
    
    async def register_agent(self, agent_id: str, capabilities: Dict[str, Any] = None, 
                           preferences: Dict[str, Any] = None) -> bool:
        """Register an agent for communication"""
        try:
            self.registered_agents.add(agent_id)
            
            if capabilities:
                self.agent_capabilities[agent_id] = capabilities
            
            if preferences:
                self.agent_preferences[agent_id] = preferences
            
            # Initialize agent metrics
            self.metrics.agent_participation[agent_id] = 0
            
            # Emit registration event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'agent_communication.registered',
                    'agent_id': agent_id,
                    'capabilities': capabilities,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            
            logger.info(f"Agent {agent_id} registered for communication")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register agent {agent_id}: {e}")
            return False
    
    async def send_message(self, from_agent_id: str, to_agent_id: Optional[str], 
                          message_type: MessageType, subject: str, content: str,
                          priority: MessagePriority = MessagePriority.MEDIUM,
                          metadata: Dict[str, Any] = None,
                          response_required: bool = False,
                          expires_in_seconds: Optional[int] = None) -> str:
        """Send a message from one agent to another (or broadcast)"""
        try:
            # Validate sender
            if from_agent_id not in self.registered_agents:
                raise ValueError(f"Agent {from_agent_id} not registered")
            
            # Validate recipient (if specified)
            if to_agent_id and to_agent_id not in self.registered_agents:
                raise ValueError(f"Recipient agent {to_agent_id} not registered")
            
            # Check rate limits
            if not await self._check_rate_limit(from_agent_id):
                raise ValueError(f"Rate limit exceeded for agent {from_agent_id}")
            
            # Create message
            message_id = str(uuid.uuid4())
            conversation_id = await self._get_or_create_conversation(from_agent_id, to_agent_id, subject)
            
            expires_at = None
            if expires_in_seconds:
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
            
            message = AgentMessage(
                message_id=message_id,
                conversation_id=conversation_id,
                from_agent_id=from_agent_id,
                to_agent_id=to_agent_id,
                message_type=message_type,
                priority=priority,
                subject=subject,
                content=content,
                metadata=metadata or {},
                timestamp=datetime.now(timezone.utc),
                response_required=response_required,
                expires_at=expires_at
            )
            
            # Store message
            self.active_messages[message_id] = message
            self.message_history.append(message)
            
            # Update metrics
            self.metrics.total_messages += 1
            if message_type not in self.metrics.messages_by_type:
                self.metrics.messages_by_type[message_type] = 0
            self.metrics.messages_by_type[message_type] += 1
            self.metrics.agent_participation[from_agent_id] += 1
            
            # Persist to database
            if self.db_service:
                await self._persist_message(message)
            
            # Emit message event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'agent_communication.message_sent',
                    'message_id': message_id,
                    'conversation_id': conversation_id,
                    'from_agent_id': from_agent_id,
                    'to_agent_id': to_agent_id,
                    'message_type': message_type.value,
                    'priority': priority.value,
                    'subject': subject,
                    'timestamp': message.timestamp.isoformat()
                })
            
            logger.info(f"Message sent from {from_agent_id} to {to_agent_id or 'broadcast'}: {subject}")
            return message_id
            
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise
    
    async def get_messages(self, agent_id: str, conversation_id: Optional[str] = None,
                          message_type: Optional[MessageType] = None,
                          unread_only: bool = False) -> List[AgentMessage]:
        """Get messages for an agent"""
        try:
            messages = []
            
            for message in self.message_history:
                # Check if message is for this agent
                if message.to_agent_id != agent_id and message.to_agent_id is not None:
                    continue
                
                # Apply filters
                if conversation_id and message.conversation_id != conversation_id:
                    continue
                
                if message_type and message.message_type != message_type:
                    continue
                
                if unread_only and message.read:
                    continue
                
                messages.append(message)
            
            return sorted(messages, key=lambda x: x.timestamp, reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to get messages for agent {agent_id}: {e}")
            return []
    
    async def mark_message_read(self, message_id: str, agent_id: str) -> bool:
        """Mark a message as read"""
        try:
            if message_id not in self.active_messages:
                return False
            
            message = self.active_messages[message_id]
            
            # Verify agent can read this message
            if message.to_agent_id != agent_id and message.to_agent_id is not None:
                return False
            
            message.read = True
            
            # Update in database
            if self.db_service:
                await self._update_message_status(message_id, read=True)
            
            logger.info(f"Message {message_id} marked as read by {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to mark message {message_id} as read: {e}")
            return False
    
    async def create_conversation(self, agent_ids: List[str], topic: str, 
                                metadata: Dict[str, Any] = None) -> str:
        """Create a new conversation between agents"""
        try:
            conversation_id = str(uuid.uuid4())
            
            # Validate all agents are registered
            for agent_id in agent_ids:
                if agent_id not in self.registered_agents:
                    raise ValueError(f"Agent {agent_id} not registered")
            
            conversation = AgentConversation(
                conversation_id=conversation_id,
                participants=agent_ids,
                topic=topic,
                status=ConversationStatus.ACTIVE,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                message_count=0,
                metadata=metadata or {}
            )
            
            self.conversations[conversation_id] = conversation
            self.metrics.active_conversations += 1
            
            # Persist to database
            if self.db_service:
                await self._persist_conversation(conversation)
            
            # Emit conversation event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'agent_communication.conversation_created',
                    'conversation_id': conversation_id,
                    'participants': agent_ids,
                    'topic': topic,
                    'timestamp': conversation.created_at.isoformat()
                })
            
            logger.info(f"Conversation created: {topic} with {len(agent_ids)} participants")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Failed to create conversation: {e}")
            raise
    
    async def get_conversations(self, agent_id: str, status: Optional[ConversationStatus] = None) -> List[AgentConversation]:
        """Get conversations for an agent"""
        try:
            conversations = []
            
            for conversation in self.conversations.values():
                if agent_id not in conversation.participants:
                    continue
                
                if status and conversation.status != status:
                    continue
                
                conversations.append(conversation)
            
            return sorted(conversations, key=lambda x: x.updated_at, reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to get conversations for agent {agent_id}: {e}")
            return []
    
    async def request_consensus(self, initiator_agent_id: str, decision_context: Dict[str, Any],
                              required_agents: List[str], timeout_seconds: int = 300) -> str:
        """Request consensus decision from multiple agents"""
        try:
            # Create consensus conversation
            conversation_id = await self.create_conversation(
                agent_ids=[initiator_agent_id] + required_agents,
                topic=f"Consensus: {decision_context.get('title', 'Decision Required')}",
                metadata={'type': 'consensus', 'timeout': timeout_seconds}
            )
            
            # Send consensus request to all agents
            for agent_id in required_agents:
                await self.send_message(
                    from_agent_id=initiator_agent_id,
                    to_agent_id=agent_id,
                    message_type=MessageType.DECISION_VOTE,
                    subject=f"Consensus Required: {decision_context.get('title', 'Decision')}",
                    content=json.dumps(decision_context),
                    priority=MessagePriority.HIGH,
                    response_required=True,
                    expires_in_seconds=timeout_seconds
                )
            
            logger.info(f"Consensus request initiated by {initiator_agent_id} for {len(required_agents)} agents")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Failed to request consensus: {e}")
            raise
    
    async def broadcast_market_insight(self, agent_id: str, insight: Dict[str, Any]) -> str:
        """Broadcast market insight to all agents"""
        try:
            message_id = await self.send_message(
                from_agent_id=agent_id,
                to_agent_id=None,  # Broadcast
                message_type=MessageType.MARKET_INSIGHT,
                subject=f"Market Insight: {insight.get('symbol', 'General')}",
                content=json.dumps(insight),
                priority=MessagePriority.MEDIUM,
                metadata={'insight_type': insight.get('type', 'general')}
            )
            
            logger.info(f"Market insight broadcasted by {agent_id}")
            return message_id
            
        except Exception as e:
            logger.error(f"Failed to broadcast market insight: {e}")
            raise
    
    async def get_communication_metrics(self) -> Dict[str, Any]:
        """Get communication metrics"""
        try:
            return {
                'total_messages': self.metrics.total_messages,
                'messages_by_type': {k.value: v for k, v in self.metrics.messages_by_type.items()},
                'active_conversations': self.metrics.active_conversations,
                'registered_agents': len(self.registered_agents),
                'agent_participation': self.metrics.agent_participation,
                'message_success_rate': self.metrics.message_success_rate,
                'recent_activity': {
                    'last_hour': len([m for m in self.message_history 
                                   if m.timestamp > datetime.now(timezone.utc) - timedelta(hours=1)]),
                    'last_day': len([m for m in self.message_history 
                                   if m.timestamp > datetime.now(timezone.utc) - timedelta(days=1)])
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get communication metrics: {e}")
            return {}
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            'service': 'cross_agent_communication',
            'status': 'running',
            'registered_agents': len(self.registered_agents),
            'active_messages': len(self.active_messages),
            'active_conversations': self.metrics.active_conversations,
            'total_messages': self.metrics.total_messages,
            'message_types': list(MessageType),
            'communication_rules': self.communication_rules,
            'last_health_check': datetime.now(timezone.utc).isoformat()
        }
    
    # Private methods
    
    async def _get_or_create_conversation(self, from_agent_id: str, to_agent_id: Optional[str], 
                                        subject: str) -> str:
        """Get existing conversation or create new one"""
        try:
            # For broadcast messages, create a new conversation
            if to_agent_id is None:
                return await self.create_conversation(
                    agent_ids=[from_agent_id],
                    topic=f"Broadcast: {subject}",
                    metadata={'type': 'broadcast'}
                )
            
            # Look for existing conversation between these agents
            for conversation in self.conversations.values():
                if (len(conversation.participants) == 2 and
                    from_agent_id in conversation.participants and
                    to_agent_id in conversation.participants and
                    conversation.status == ConversationStatus.ACTIVE):
                    return conversation.conversation_id
            
            # Create new conversation
            return await self.create_conversation(
                agent_ids=[from_agent_id, to_agent_id],
                topic=subject
            )
            
        except Exception as e:
            logger.error(f"Failed to get or create conversation: {e}")
            raise
    
    async def _check_rate_limit(self, agent_id: str) -> bool:
        """Check if agent is within rate limits"""
        try:
            max_per_minute = self.communication_rules['max_messages_per_minute']
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=1)
            
            recent_messages = [
                m for m in self.message_history 
                if m.from_agent_id == agent_id and m.timestamp > cutoff_time
            ]
            
            return len(recent_messages) < max_per_minute
            
        except Exception as e:
            logger.error(f"Failed to check rate limit: {e}")
            return False
    
    async def _message_processor_loop(self):
        """Background task to process messages"""
        while True:
            try:
                await asyncio.sleep(10)  # Process every 10 seconds
                
                # Process expired messages
                current_time = datetime.now(timezone.utc)
                expired_messages = [
                    m for m in self.active_messages.values()
                    if m.expires_at and m.expires_at < current_time
                ]
                
                for message in expired_messages:
                    await self._handle_expired_message(message)
                
                # Process unread urgent messages
                urgent_messages = [
                    m for m in self.active_messages.values()
                    if (m.priority == MessagePriority.CRITICAL and 
                        not m.read and 
                        m.timestamp < current_time - timedelta(minutes=5))
                ]
                
                for message in urgent_messages:
                    await self._escalate_urgent_message(message)
                
            except Exception as e:
                logger.error(f"Error in message processor loop: {e}")
    
    async def _conversation_manager_loop(self):
        """Background task to manage conversations"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                current_time = datetime.now(timezone.utc)
                
                # Auto-archive old conversations
                for conversation in list(self.conversations.values()):
                    if (conversation.status == ConversationStatus.COMPLETED and
                        conversation.updated_at < current_time - timedelta(hours=24)):
                        conversation.status = ConversationStatus.ARCHIVED
                        self.metrics.active_conversations -= 1
                
            except Exception as e:
                logger.error(f"Error in conversation manager loop: {e}")
    
    async def _metrics_updater_loop(self):
        """Background task to update metrics"""
        while True:
            try:
                await asyncio.sleep(300)  # Update every 5 minutes
                
                # Calculate message success rate
                total_messages = len(self.message_history)
                if total_messages > 0:
                    processed_messages = sum(1 for m in self.message_history if m.processed)
                    self.metrics.message_success_rate = processed_messages / total_messages
                
                # Update active conversations count
                self.metrics.active_conversations = sum(
                    1 for c in self.conversations.values() 
                    if c.status == ConversationStatus.ACTIVE
                )
                
            except Exception as e:
                logger.error(f"Error in metrics updater loop: {e}")
    
    async def _create_communication_tables(self):
        """Create database tables for communication"""
        try:
            # Agent messages table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS agent_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    message_id TEXT UNIQUE NOT NULL,
                    conversation_id TEXT NOT NULL,
                    from_agent_id TEXT NOT NULL,
                    to_agent_id TEXT,
                    message_type TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    read BOOLEAN DEFAULT FALSE,
                    processed BOOLEAN DEFAULT FALSE,
                    response_required BOOLEAN DEFAULT FALSE,
                    expires_at TIMESTAMP WITH TIME ZONE
                )
            """)
            
            # Agent conversations table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS agent_conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id TEXT UNIQUE NOT NULL,
                    participants TEXT[] NOT NULL,
                    topic TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    message_count INTEGER DEFAULT 0,
                    last_message_id TEXT,
                    metadata JSONB
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON agent_messages(to_agent_id, timestamp);
                CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON agent_messages(conversation_id, timestamp);
                CREATE INDEX IF NOT EXISTS idx_agent_conversations_participants ON agent_conversations USING GIN(participants);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create communication tables: {e}")
            raise
    
    async def _load_existing_data(self):
        """Load existing communication data"""
        try:
            if not self.db_service:
                return
            
            # Load recent messages
            messages = await self.db_service.execute_query("""
                SELECT * FROM agent_messages 
                WHERE timestamp > NOW() - INTERVAL '24 hours'
                ORDER BY timestamp DESC
            """)
            
            # Load active conversations
            conversations = await self.db_service.execute_query("""
                SELECT * FROM agent_conversations 
                WHERE status = 'active'
                ORDER BY updated_at DESC
            """)
            
            logger.info(f"Loaded {len(messages) if messages else 0} recent messages and {len(conversations) if conversations else 0} active conversations")
            
        except Exception as e:
            logger.error(f"Failed to load existing data: {e}")
    
    async def _persist_message(self, message: AgentMessage):
        """Persist message to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO agent_messages (
                    message_id, conversation_id, from_agent_id, to_agent_id,
                    message_type, priority, subject, content, metadata,
                    timestamp, read, processed, response_required, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """, (
                message.message_id, message.conversation_id, message.from_agent_id,
                message.to_agent_id, message.message_type.value, message.priority.value,
                message.subject, message.content, json.dumps(message.metadata),
                message.timestamp, message.read, message.processed,
                message.response_required, message.expires_at
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist message: {e}")
    
    async def _persist_conversation(self, conversation: AgentConversation):
        """Persist conversation to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO agent_conversations (
                    conversation_id, participants, topic, status,
                    created_at, updated_at, message_count, last_message_id, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, (
                conversation.conversation_id, conversation.participants, conversation.topic,
                conversation.status.value, conversation.created_at, conversation.updated_at,
                conversation.message_count, conversation.last_message_id,
                json.dumps(conversation.metadata or {})
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist conversation: {e}")
    
    async def _update_message_status(self, message_id: str, read: bool = None, processed: bool = None):
        """Update message status in database"""
        try:
            if not self.db_service:
                return
            
            updates = []
            params = []
            
            if read is not None:
                updates.append("read = $1")
                params.append(read)
            
            if processed is not None:
                updates.append(f"processed = ${len(params) + 1}")
                params.append(processed)
            
            if updates:
                params.append(message_id)
                await self.db_service.execute_query(f"""
                    UPDATE agent_messages 
                    SET {', '.join(updates)}
                    WHERE message_id = ${len(params)}
                """, params)
            
        except Exception as e:
            logger.error(f"Failed to update message status: {e}")
    
    async def _handle_expired_message(self, message: AgentMessage):
        """Handle expired message"""
        try:
            message.processed = True
            
            # Remove from active messages
            if message.message_id in self.active_messages:
                del self.active_messages[message.message_id]
            
            # Update in database
            await self._update_message_status(message.message_id, processed=True)
            
            logger.info(f"Expired message handled: {message.message_id}")
            
        except Exception as e:
            logger.error(f"Failed to handle expired message: {e}")
    
    async def _escalate_urgent_message(self, message: AgentMessage):
        """Escalate urgent unread message"""
        try:
            # Create escalation alert
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'agent_communication.urgent_message_unread',
                    'message_id': message.message_id,
                    'from_agent_id': message.from_agent_id,
                    'to_agent_id': message.to_agent_id,
                    'subject': message.subject,
                    'timestamp': message.timestamp.isoformat()
                })
            
            logger.warning(f"Urgent message escalated: {message.message_id}")
            
        except Exception as e:
            logger.error(f"Failed to escalate urgent message: {e}")


# Factory function for service registry
def create_cross_agent_communication():
    """Factory function to create CrossAgentCommunication instance"""
    return CrossAgentCommunication()