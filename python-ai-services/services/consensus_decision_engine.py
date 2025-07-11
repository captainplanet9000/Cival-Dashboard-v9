"""
Consensus Decision Engine
Byzantine fault-tolerant decision making for autonomous agents
Built on top of existing autonomous_agent_coordinator.py and cross_agent_communication.py
"""

import asyncio
import logging
import uuid
from typing import Dict, List, Optional, Any, Set, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
import hashlib
from collections import defaultdict, Counter

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class DecisionType(Enum):
    """Types of decisions requiring consensus"""
    TRADING_STRATEGY = "trading_strategy"
    RISK_MANAGEMENT = "risk_management"
    RESOURCE_ALLOCATION = "resource_allocation"
    EMERGENCY_ACTION = "emergency_action"
    PARAMETER_ADJUSTMENT = "parameter_adjustment"
    MARKET_POSITION = "market_position"
    PORTFOLIO_REBALANCE = "portfolio_rebalance"
    AGENT_COORDINATION = "agent_coordination"

class VoteType(Enum):
    """Types of votes"""
    APPROVE = "approve"
    REJECT = "reject"
    ABSTAIN = "abstain"
    CONDITIONAL = "conditional"

class DecisionStatus(Enum):
    """Status of decisions"""
    PENDING = "pending"
    VOTING = "voting"
    CONSENSUS_REACHED = "consensus_reached"
    REJECTED = "rejected"
    TIMEOUT = "timeout"
    EXECUTED = "executed"
    FAILED = "failed"

class ConsensusAlgorithm(Enum):
    """Consensus algorithms"""
    SIMPLE_MAJORITY = "simple_majority"
    SUPERMAJORITY = "supermajority"
    UNANIMOUS = "unanimous"
    WEIGHTED_MAJORITY = "weighted_majority"
    BYZANTINE_FAULT_TOLERANT = "byzantine_fault_tolerant"

@dataclass
class AgentVote:
    """Individual agent vote"""
    vote_id: str
    decision_id: str
    agent_id: str
    vote_type: VoteType
    confidence: float
    reasoning: str
    metadata: Dict[str, Any]
    timestamp: datetime
    weight: float = 1.0  # Voting weight based on agent performance

@dataclass
class DecisionContext:
    """Context for a decision requiring consensus"""
    decision_id: str
    decision_type: DecisionType
    title: str
    description: str
    options: List[Dict[str, Any]]
    required_agents: List[str]
    optional_agents: List[str]
    minimum_votes: int
    consensus_threshold: float
    consensus_algorithm: ConsensusAlgorithm
    timeout_seconds: int
    created_by: str
    created_at: datetime
    expires_at: datetime
    metadata: Dict[str, Any]
    status: DecisionStatus = DecisionStatus.PENDING
    priority: str = "medium"

@dataclass
class DecisionResult:
    """Result of a consensus decision"""
    decision_id: str
    final_decision: str
    consensus_reached: bool
    vote_count: int
    approval_percentage: float
    participating_agents: List[str]
    non_participating_agents: List[str]
    votes: List[AgentVote]
    execution_status: str
    execution_details: Dict[str, Any]
    completed_at: datetime
    metadata: Dict[str, Any]

class ConsensusDecisionEngine:
    """
    Byzantine fault-tolerant consensus decision engine
    Enables multi-agent democratic decision making with weighted voting
    """
    
    def __init__(self):
        self.db_service = None
        self.event_service = None
        self.communication_service = None
        self.agent_coordinator = None
        
        # Decision management
        self.active_decisions: Dict[str, DecisionContext] = {}
        self.decision_votes: Dict[str, List[AgentVote]] = {}
        self.decision_results: Dict[str, DecisionResult] = {}
        
        # Agent weights and reputation
        self.agent_weights: Dict[str, float] = {}
        self.agent_reputation: Dict[str, float] = {}
        self.agent_performance_history: Dict[str, List[float]] = defaultdict(list)
        
        # Consensus rules
        self.consensus_rules = {
            'default_timeout_seconds': 300,  # 5 minutes
            'minimum_participation_rate': 0.6,  # 60% participation required
            'byzantine_fault_tolerance': 0.33,  # Can tolerate up to 33% Byzantine nodes
            'reputation_decay_factor': 0.95,  # Reputation decay over time
            'performance_weight_factor': 0.3,  # How much performance affects voting weight
            'recency_bias_factor': 0.2,  # Recent performance weighted more heavily
            'emergency_fast_track_threshold': 0.8,  # 80% for emergency decisions
        }
        
        # Decision history
        self.decision_history: List[DecisionResult] = []
        
        # Background tasks
        self.decision_monitor_task = None
        self.consensus_processor_task = None
        self.reputation_updater_task = None
        
        logger.info("Consensus Decision Engine initialized")
    
    async def initialize(self):
        """Initialize the consensus decision engine"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            self.communication_service = registry.get_service("cross_agent_communication")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            
            # Create database tables
            if self.db_service:
                await self._create_consensus_tables()
            
            # Load existing data
            await self._load_existing_data()
            
            # Initialize agent weights
            await self._initialize_agent_weights()
            
            # Start background tasks
            self.decision_monitor_task = asyncio.create_task(self._decision_monitor_loop())
            self.consensus_processor_task = asyncio.create_task(self._consensus_processor_loop())
            self.reputation_updater_task = asyncio.create_task(self._reputation_updater_loop())
            
            logger.info("Consensus Decision Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Consensus Decision Engine: {e}")
            raise
    
    async def create_decision(self, decision_type: DecisionType, title: str, description: str,
                            options: List[Dict[str, Any]], required_agents: List[str],
                            created_by: str, optional_agents: List[str] = None,
                            consensus_algorithm: ConsensusAlgorithm = ConsensusAlgorithm.SIMPLE_MAJORITY,
                            consensus_threshold: float = 0.5, timeout_seconds: int = None,
                            priority: str = "medium", metadata: Dict[str, Any] = None) -> str:
        """Create a new decision requiring consensus"""
        try:
            decision_id = str(uuid.uuid4())
            
            # Set defaults
            if timeout_seconds is None:
                timeout_seconds = (
                    60 if priority == "critical" else
                    180 if priority == "high" else
                    self.consensus_rules['default_timeout_seconds']
                )
            
            if optional_agents is None:
                optional_agents = []
            
            # Calculate minimum votes based on algorithm
            total_agents = len(required_agents) + len(optional_agents)
            if consensus_algorithm == ConsensusAlgorithm.UNANIMOUS:
                minimum_votes = len(required_agents)
            elif consensus_algorithm == ConsensusAlgorithm.SUPERMAJORITY:
                minimum_votes = max(1, int(len(required_agents) * 0.67))
            elif consensus_algorithm == ConsensusAlgorithm.BYZANTINE_FAULT_TOLERANT:
                minimum_votes = max(1, int(len(required_agents) * 0.67))  # 2/3 majority
            else:
                minimum_votes = max(1, int(len(required_agents) * 0.5))
            
            # Create decision context
            decision_context = DecisionContext(
                decision_id=decision_id,
                decision_type=decision_type,
                title=title,
                description=description,
                options=options,
                required_agents=required_agents,
                optional_agents=optional_agents,
                minimum_votes=minimum_votes,
                consensus_threshold=consensus_threshold,
                consensus_algorithm=consensus_algorithm,
                timeout_seconds=timeout_seconds,
                created_by=created_by,
                created_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(seconds=timeout_seconds),
                metadata=metadata or {},
                status=DecisionStatus.PENDING,
                priority=priority
            )
            
            # Store decision
            self.active_decisions[decision_id] = decision_context
            self.decision_votes[decision_id] = []
            
            # Persist to database
            if self.db_service:
                await self._persist_decision(decision_context)
            
            # Send voting requests to agents
            await self._send_voting_requests(decision_context)
            
            # Update status to voting
            decision_context.status = DecisionStatus.VOTING
            
            # Emit decision event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'consensus.decision_created',
                    'decision_id': decision_id,
                    'decision_type': decision_type.value,
                    'title': title,
                    'required_agents': required_agents,
                    'timeout_seconds': timeout_seconds,
                    'created_by': created_by,
                    'timestamp': decision_context.created_at.isoformat()
                })
            
            logger.info(f"Decision created: {title} (ID: {decision_id})")
            return decision_id
            
        except Exception as e:
            logger.error(f"Failed to create decision: {e}")
            raise
    
    async def cast_vote(self, decision_id: str, agent_id: str, vote_type: VoteType,
                       confidence: float, reasoning: str, metadata: Dict[str, Any] = None) -> bool:
        """Cast a vote for a decision"""
        try:
            # Validate decision exists and is active
            if decision_id not in self.active_decisions:
                raise ValueError(f"Decision {decision_id} not found")
            
            decision = self.active_decisions[decision_id]
            
            if decision.status != DecisionStatus.VOTING:
                raise ValueError(f"Decision {decision_id} is not in voting state")
            
            # Check if decision has expired
            if datetime.now(timezone.utc) > decision.expires_at:
                decision.status = DecisionStatus.TIMEOUT
                raise ValueError(f"Decision {decision_id} has expired")
            
            # Validate agent is eligible to vote
            if agent_id not in decision.required_agents and agent_id not in decision.optional_agents:
                raise ValueError(f"Agent {agent_id} is not eligible to vote on this decision")
            
            # Check if agent has already voted
            existing_votes = [v for v in self.decision_votes[decision_id] if v.agent_id == agent_id]
            if existing_votes:
                raise ValueError(f"Agent {agent_id} has already voted on this decision")
            
            # Get agent voting weight
            agent_weight = self.agent_weights.get(agent_id, 1.0)
            
            # Create vote
            vote = AgentVote(
                vote_id=str(uuid.uuid4()),
                decision_id=decision_id,
                agent_id=agent_id,
                vote_type=vote_type,
                confidence=confidence,
                reasoning=reasoning,
                metadata=metadata or {},
                timestamp=datetime.now(timezone.utc),
                weight=agent_weight
            )
            
            # Store vote
            self.decision_votes[decision_id].append(vote)
            
            # Persist to database
            if self.db_service:
                await self._persist_vote(vote)
            
            # Check if consensus has been reached
            await self._check_consensus(decision_id)
            
            # Emit vote event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'consensus.vote_cast',
                    'decision_id': decision_id,
                    'agent_id': agent_id,
                    'vote_type': vote_type.value,
                    'confidence': confidence,
                    'weight': agent_weight,
                    'timestamp': vote.timestamp.isoformat()
                })
            
            logger.info(f"Vote cast by {agent_id} for decision {decision_id}: {vote_type.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cast vote: {e}")
            return False
    
    async def get_decision_status(self, decision_id: str) -> Optional[Dict[str, Any]]:
        """Get the current status of a decision"""
        try:
            if decision_id not in self.active_decisions:
                # Check completed decisions
                result = next((r for r in self.decision_history if r.decision_id == decision_id), None)
                if result:
                    return {
                        'decision_id': decision_id,
                        'status': 'completed',
                        'result': asdict(result)
                    }
                return None
            
            decision = self.active_decisions[decision_id]
            votes = self.decision_votes.get(decision_id, [])
            
            # Calculate vote statistics
            vote_counts = Counter(v.vote_type for v in votes)
            total_votes = len(votes)
            weighted_votes = {}
            
            for vote_type in VoteType:
                weighted_votes[vote_type.value] = sum(
                    v.weight for v in votes if v.vote_type == vote_type
                )
            
            # Calculate participation rate
            total_eligible = len(decision.required_agents) + len(decision.optional_agents)
            participation_rate = total_votes / total_eligible if total_eligible > 0 else 0
            
            # Get voting agents
            voting_agents = [v.agent_id for v in votes]
            non_voting_agents = [
                agent for agent in decision.required_agents + decision.optional_agents
                if agent not in voting_agents
            ]
            
            return {
                'decision_id': decision_id,
                'title': decision.title,
                'status': decision.status.value,
                'decision_type': decision.decision_type.value,
                'consensus_algorithm': decision.consensus_algorithm.value,
                'total_votes': total_votes,
                'required_votes': decision.minimum_votes,
                'vote_counts': dict(vote_counts),
                'weighted_votes': weighted_votes,
                'participation_rate': participation_rate,
                'voting_agents': voting_agents,
                'non_voting_agents': non_voting_agents,
                'time_remaining': max(0, (decision.expires_at - datetime.now(timezone.utc)).total_seconds()),
                'created_at': decision.created_at.isoformat(),
                'expires_at': decision.expires_at.isoformat(),
                'options': decision.options,
                'metadata': decision.metadata
            }
            
        except Exception as e:
            logger.error(f"Failed to get decision status: {e}")
            return None
    
    async def get_consensus_metrics(self) -> Dict[str, Any]:
        """Get consensus engine metrics"""
        try:
            # Calculate success rates
            total_decisions = len(self.decision_history)
            successful_decisions = sum(1 for r in self.decision_history if r.consensus_reached)
            
            # Calculate average decision time
            completed_decisions = [r for r in self.decision_history if r.consensus_reached]
            if completed_decisions:
                avg_decision_time = sum(
                    (r.completed_at - next(d.created_at for d in self.active_decisions.values() 
                                          if d.decision_id == r.decision_id)).total_seconds()
                    for r in completed_decisions
                ) / len(completed_decisions)
            else:
                avg_decision_time = 0
            
            # Agent participation statistics
            agent_participation = {}
            for decision_id, votes in self.decision_votes.items():
                for vote in votes:
                    if vote.agent_id not in agent_participation:
                        agent_participation[vote.agent_id] = 0
                    agent_participation[vote.agent_id] += 1
            
            return {
                'total_decisions': total_decisions,
                'successful_decisions': successful_decisions,
                'success_rate': successful_decisions / max(total_decisions, 1),
                'active_decisions': len(self.active_decisions),
                'average_decision_time_seconds': avg_decision_time,
                'agent_participation': agent_participation,
                'agent_weights': self.agent_weights,
                'agent_reputation': self.agent_reputation,
                'consensus_rules': self.consensus_rules,
                'decision_types': [dt.value for dt in DecisionType],
                'consensus_algorithms': [ca.value for ca in ConsensusAlgorithm]
            }
            
        except Exception as e:
            logger.error(f"Failed to get consensus metrics: {e}")
            return {}
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            'service': 'consensus_decision_engine',
            'status': 'running',
            'active_decisions': len(self.active_decisions),
            'total_decisions': len(self.decision_history),
            'registered_agents': len(self.agent_weights),
            'consensus_algorithms': [ca.value for ca in ConsensusAlgorithm],
            'decision_types': [dt.value for dt in DecisionType],
            'last_health_check': datetime.now(timezone.utc).isoformat()
        }
    
    # Private methods
    
    async def _send_voting_requests(self, decision: DecisionContext):
        """Send voting requests to eligible agents"""
        try:
            if not self.communication_service:
                return
            
            # Send to required agents
            for agent_id in decision.required_agents:
                await self.communication_service.send_message(
                    from_agent_id='consensus_engine',
                    to_agent_id=agent_id,
                    message_type='decision_vote',
                    subject=f"Consensus Required: {decision.title}",
                    content=json.dumps({
                        'decision_id': decision.decision_id,
                        'title': decision.title,
                        'description': decision.description,
                        'options': decision.options,
                        'timeout_seconds': decision.timeout_seconds,
                        'consensus_algorithm': decision.consensus_algorithm.value,
                        'metadata': decision.metadata
                    }),
                    priority='high' if decision.priority == 'critical' else 'medium',
                    response_required=True,
                    expires_in_seconds=decision.timeout_seconds
                )
            
            # Send to optional agents
            for agent_id in decision.optional_agents:
                await self.communication_service.send_message(
                    from_agent_id='consensus_engine',
                    to_agent_id=agent_id,
                    message_type='decision_vote',
                    subject=f"Optional Vote: {decision.title}",
                    content=json.dumps({
                        'decision_id': decision.decision_id,
                        'title': decision.title,
                        'description': decision.description,
                        'options': decision.options,
                        'timeout_seconds': decision.timeout_seconds,
                        'consensus_algorithm': decision.consensus_algorithm.value,
                        'metadata': decision.metadata,
                        'optional': True
                    }),
                    priority='medium',
                    response_required=False,
                    expires_in_seconds=decision.timeout_seconds
                )
            
            logger.info(f"Voting requests sent for decision {decision.decision_id}")
            
        except Exception as e:
            logger.error(f"Failed to send voting requests: {e}")
    
    async def _check_consensus(self, decision_id: str):
        """Check if consensus has been reached for a decision"""
        try:
            decision = self.active_decisions[decision_id]
            votes = self.decision_votes[decision_id]
            
            # Check if minimum votes reached
            if len(votes) < decision.minimum_votes:
                return False
            
            # Apply consensus algorithm
            consensus_reached = False
            final_decision = None
            
            if decision.consensus_algorithm == ConsensusAlgorithm.SIMPLE_MAJORITY:
                consensus_reached, final_decision = await self._simple_majority_consensus(votes)
            elif decision.consensus_algorithm == ConsensusAlgorithm.SUPERMAJORITY:
                consensus_reached, final_decision = await self._supermajority_consensus(votes, 0.67)
            elif decision.consensus_algorithm == ConsensusAlgorithm.UNANIMOUS:
                consensus_reached, final_decision = await self._unanimous_consensus(votes)
            elif decision.consensus_algorithm == ConsensusAlgorithm.WEIGHTED_MAJORITY:
                consensus_reached, final_decision = await self._weighted_majority_consensus(votes)
            elif decision.consensus_algorithm == ConsensusAlgorithm.BYZANTINE_FAULT_TOLERANT:
                consensus_reached, final_decision = await self._byzantine_fault_tolerant_consensus(votes, decision)
            
            if consensus_reached:
                await self._complete_decision(decision_id, final_decision, True)
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to check consensus: {e}")
            return False
    
    async def _simple_majority_consensus(self, votes: List[AgentVote]) -> Tuple[bool, Optional[str]]:
        """Simple majority consensus algorithm"""
        vote_counts = Counter(v.vote_type for v in votes)
        total_votes = len(votes)
        
        if total_votes == 0:
            return False, None
        
        approve_votes = vote_counts.get(VoteType.APPROVE, 0)
        reject_votes = vote_counts.get(VoteType.REJECT, 0)
        
        if approve_votes > reject_votes and approve_votes > total_votes / 2:
            return True, "approved"
        elif reject_votes > approve_votes and reject_votes > total_votes / 2:
            return True, "rejected"
        
        return False, None
    
    async def _supermajority_consensus(self, votes: List[AgentVote], threshold: float) -> Tuple[bool, Optional[str]]:
        """Supermajority consensus algorithm"""
        vote_counts = Counter(v.vote_type for v in votes)
        total_votes = len(votes)
        
        if total_votes == 0:
            return False, None
        
        approve_votes = vote_counts.get(VoteType.APPROVE, 0)
        reject_votes = vote_counts.get(VoteType.REJECT, 0)
        
        if approve_votes >= total_votes * threshold:
            return True, "approved"
        elif reject_votes >= total_votes * threshold:
            return True, "rejected"
        
        return False, None
    
    async def _unanimous_consensus(self, votes: List[AgentVote]) -> Tuple[bool, Optional[str]]:
        """Unanimous consensus algorithm"""
        if not votes:
            return False, None
        
        vote_types = set(v.vote_type for v in votes)
        
        if len(vote_types) == 1:
            vote_type = next(iter(vote_types))
            if vote_type == VoteType.APPROVE:
                return True, "approved"
            elif vote_type == VoteType.REJECT:
                return True, "rejected"
        
        return False, None
    
    async def _weighted_majority_consensus(self, votes: List[AgentVote]) -> Tuple[bool, Optional[str]]:
        """Weighted majority consensus algorithm"""
        weighted_votes = defaultdict(float)
        total_weight = 0
        
        for vote in votes:
            weighted_votes[vote.vote_type] += vote.weight
            total_weight += vote.weight
        
        if total_weight == 0:
            return False, None
        
        approve_weight = weighted_votes.get(VoteType.APPROVE, 0)
        reject_weight = weighted_votes.get(VoteType.REJECT, 0)
        
        if approve_weight > reject_weight and approve_weight > total_weight / 2:
            return True, "approved"
        elif reject_weight > approve_weight and reject_weight > total_weight / 2:
            return True, "rejected"
        
        return False, None
    
    async def _byzantine_fault_tolerant_consensus(self, votes: List[AgentVote], 
                                                decision: DecisionContext) -> Tuple[bool, Optional[str]]:
        """Byzantine fault tolerant consensus algorithm"""
        # Requires 2/3 majority to tolerate up to 1/3 Byzantine faults
        threshold = 2.0 / 3.0
        return await self._supermajority_consensus(votes, threshold)
    
    async def _complete_decision(self, decision_id: str, final_decision: str, consensus_reached: bool):
        """Complete a decision and execute if necessary"""
        try:
            decision = self.active_decisions[decision_id]
            votes = self.decision_votes[decision_id]
            
            # Calculate final statistics
            vote_counts = Counter(v.vote_type for v in votes)
            total_votes = len(votes)
            approval_percentage = (vote_counts.get(VoteType.APPROVE, 0) / max(total_votes, 1)) * 100
            
            participating_agents = [v.agent_id for v in votes]
            all_agents = decision.required_agents + decision.optional_agents
            non_participating_agents = [a for a in all_agents if a not in participating_agents]
            
            # Create decision result
            result = DecisionResult(
                decision_id=decision_id,
                final_decision=final_decision,
                consensus_reached=consensus_reached,
                vote_count=total_votes,
                approval_percentage=approval_percentage,
                participating_agents=participating_agents,
                non_participating_agents=non_participating_agents,
                votes=votes,
                execution_status="pending",
                execution_details={},
                completed_at=datetime.now(timezone.utc),
                metadata=decision.metadata
            )
            
            # Execute decision if consensus reached
            if consensus_reached and final_decision == "approved":
                execution_result = await self._execute_decision(decision, result)
                result.execution_status = "completed" if execution_result else "failed"
                result.execution_details = execution_result or {}
            
            # Update decision status
            decision.status = DecisionStatus.CONSENSUS_REACHED if consensus_reached else DecisionStatus.REJECTED
            
            # Store result
            self.decision_results[decision_id] = result
            self.decision_history.append(result)
            
            # Update agent reputation based on participation and vote quality
            await self._update_agent_reputation(decision, votes, result)
            
            # Remove from active decisions
            del self.active_decisions[decision_id]
            del self.decision_votes[decision_id]
            
            # Persist to database
            if self.db_service:
                await self._persist_decision_result(result)
            
            # Emit completion event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'consensus.decision_completed',
                    'decision_id': decision_id,
                    'final_decision': final_decision,
                    'consensus_reached': consensus_reached,
                    'vote_count': total_votes,
                    'approval_percentage': approval_percentage,
                    'execution_status': result.execution_status,
                    'timestamp': result.completed_at.isoformat()
                })
            
            logger.info(f"Decision completed: {decision_id} - {final_decision} (consensus: {consensus_reached})")
            
        except Exception as e:
            logger.error(f"Failed to complete decision: {e}")
    
    async def _execute_decision(self, decision: DecisionContext, result: DecisionResult) -> Optional[Dict[str, Any]]:
        """Execute an approved decision"""
        try:
            # Execute based on decision type
            if decision.decision_type == DecisionType.EMERGENCY_ACTION:
                return await self._execute_emergency_action(decision, result)
            elif decision.decision_type == DecisionType.TRADING_STRATEGY:
                return await self._execute_trading_strategy(decision, result)
            elif decision.decision_type == DecisionType.RESOURCE_ALLOCATION:
                return await self._execute_resource_allocation(decision, result)
            elif decision.decision_type == DecisionType.RISK_MANAGEMENT:
                return await self._execute_risk_management(decision, result)
            
            # Default execution
            return {
                'status': 'executed',
                'message': f'Decision {decision.decision_id} executed successfully',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to execute decision: {e}")
            return None
    
    async def _execute_emergency_action(self, decision: DecisionContext, result: DecisionResult) -> Dict[str, Any]:
        """Execute emergency action decision"""
        # Implementation would depend on the specific emergency action
        return {
            'status': 'executed',
            'action': 'emergency_action',
            'details': decision.metadata,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _execute_trading_strategy(self, decision: DecisionContext, result: DecisionResult) -> Dict[str, Any]:
        """Execute trading strategy decision"""
        # Implementation would integrate with trading system
        return {
            'status': 'executed',
            'action': 'trading_strategy',
            'details': decision.metadata,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _execute_resource_allocation(self, decision: DecisionContext, result: DecisionResult) -> Dict[str, Any]:
        """Execute resource allocation decision"""
        # Implementation would manage resource allocation
        return {
            'status': 'executed',
            'action': 'resource_allocation',
            'details': decision.metadata,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _execute_risk_management(self, decision: DecisionContext, result: DecisionResult) -> Dict[str, Any]:
        """Execute risk management decision"""
        # Implementation would integrate with risk management system
        return {
            'status': 'executed',
            'action': 'risk_management',
            'details': decision.metadata,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def _initialize_agent_weights(self):
        """Initialize agent voting weights based on performance"""
        try:
            if self.agent_coordinator:
                # Get agent performance data
                # This would integrate with the actual agent coordinator
                pass
            
            # Set default weights
            default_agents = [
                'marcus_momentum', 'alex_arbitrage', 'sophia_reversion', 'riley_risk'
            ]
            
            for agent_id in default_agents:
                self.agent_weights[agent_id] = 1.0
                self.agent_reputation[agent_id] = 0.8  # Start with good reputation
            
        except Exception as e:
            logger.error(f"Failed to initialize agent weights: {e}")
    
    async def _update_agent_reputation(self, decision: DecisionContext, votes: List[AgentVote], 
                                     result: DecisionResult):
        """Update agent reputation based on decision outcome"""
        try:
            # Update reputation based on participation
            for agent_id in decision.required_agents:
                voted = any(v.agent_id == agent_id for v in votes)
                if voted:
                    # Reward participation
                    self.agent_reputation[agent_id] = min(1.0, self.agent_reputation.get(agent_id, 0.5) + 0.1)
                else:
                    # Penalize non-participation
                    self.agent_reputation[agent_id] = max(0.0, self.agent_reputation.get(agent_id, 0.5) - 0.1)
            
            # Update reputation based on vote quality (simplified)
            for vote in votes:
                if result.consensus_reached:
                    if ((vote.vote_type == VoteType.APPROVE and result.final_decision == "approved") or
                        (vote.vote_type == VoteType.REJECT and result.final_decision == "rejected")):
                        # Reward correct prediction
                        self.agent_reputation[vote.agent_id] = min(1.0, 
                            self.agent_reputation.get(vote.agent_id, 0.5) + 0.05)
                    else:
                        # Slight penalty for incorrect prediction
                        self.agent_reputation[vote.agent_id] = max(0.0, 
                            self.agent_reputation.get(vote.agent_id, 0.5) - 0.02)
            
            # Update voting weights based on reputation
            for agent_id in self.agent_reputation:
                reputation = self.agent_reputation[agent_id]
                self.agent_weights[agent_id] = 0.5 + (reputation * 0.5)  # Weight between 0.5 and 1.0
            
        except Exception as e:
            logger.error(f"Failed to update agent reputation: {e}")
    
    async def _decision_monitor_loop(self):
        """Monitor decisions for timeout and other issues"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                current_time = datetime.now(timezone.utc)
                
                # Check for timed out decisions
                for decision_id, decision in list(self.active_decisions.items()):
                    if current_time > decision.expires_at:
                        decision.status = DecisionStatus.TIMEOUT
                        await self._complete_decision(decision_id, "timeout", False)
                
            except Exception as e:
                logger.error(f"Error in decision monitor loop: {e}")
    
    async def _consensus_processor_loop(self):
        """Process consensus checks periodically"""
        while True:
            try:
                await asyncio.sleep(10)  # Check every 10 seconds
                
                # Check consensus for all active decisions
                for decision_id in list(self.active_decisions.keys()):
                    await self._check_consensus(decision_id)
                
            except Exception as e:
                logger.error(f"Error in consensus processor loop: {e}")
    
    async def _reputation_updater_loop(self):
        """Update agent reputation periodically"""
        while True:
            try:
                await asyncio.sleep(3600)  # Update every hour
                
                # Apply reputation decay
                decay_factor = self.consensus_rules['reputation_decay_factor']
                for agent_id in self.agent_reputation:
                    self.agent_reputation[agent_id] *= decay_factor
                
            except Exception as e:
                logger.error(f"Error in reputation updater loop: {e}")
    
    async def _create_consensus_tables(self):
        """Create database tables for consensus decisions"""
        try:
            # Decision contexts table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS consensus_decisions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    decision_id TEXT UNIQUE NOT NULL,
                    decision_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    options JSONB NOT NULL,
                    required_agents TEXT[] NOT NULL,
                    optional_agents TEXT[] NOT NULL,
                    minimum_votes INTEGER NOT NULL,
                    consensus_threshold DECIMAL NOT NULL,
                    consensus_algorithm TEXT NOT NULL,
                    timeout_seconds INTEGER NOT NULL,
                    created_by TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    status TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    metadata JSONB
                )
            """)
            
            # Agent votes table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS consensus_votes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    vote_id TEXT UNIQUE NOT NULL,
                    decision_id TEXT NOT NULL,
                    agent_id TEXT NOT NULL,
                    vote_type TEXT NOT NULL,
                    confidence DECIMAL NOT NULL,
                    reasoning TEXT NOT NULL,
                    metadata JSONB,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    weight DECIMAL NOT NULL DEFAULT 1.0,
                    FOREIGN KEY (decision_id) REFERENCES consensus_decisions(decision_id)
                )
            """)
            
            # Decision results table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS consensus_results (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    decision_id TEXT UNIQUE NOT NULL,
                    final_decision TEXT NOT NULL,
                    consensus_reached BOOLEAN NOT NULL,
                    vote_count INTEGER NOT NULL,
                    approval_percentage DECIMAL NOT NULL,
                    participating_agents TEXT[] NOT NULL,
                    non_participating_agents TEXT[] NOT NULL,
                    execution_status TEXT NOT NULL,
                    execution_details JSONB,
                    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    metadata JSONB
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_consensus_decisions_status ON consensus_decisions(status, created_at);
                CREATE INDEX IF NOT EXISTS idx_consensus_votes_decision ON consensus_votes(decision_id, timestamp);
                CREATE INDEX IF NOT EXISTS idx_consensus_votes_agent ON consensus_votes(agent_id, timestamp);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create consensus tables: {e}")
            raise
    
    async def _load_existing_data(self):
        """Load existing consensus data"""
        try:
            if not self.db_service:
                return
            
            # Load active decisions
            decisions = await self.db_service.execute_query("""
                SELECT * FROM consensus_decisions 
                WHERE status IN ('pending', 'voting')
                AND expires_at > NOW()
                ORDER BY created_at DESC
            """)
            
            # Load recent results
            results = await self.db_service.execute_query("""
                SELECT * FROM consensus_results 
                WHERE completed_at > NOW() - INTERVAL '7 days'
                ORDER BY completed_at DESC
            """)
            
            logger.info(f"Loaded {len(decisions) if decisions else 0} active decisions and {len(results) if results else 0} recent results")
            
        except Exception as e:
            logger.error(f"Failed to load existing data: {e}")
    
    async def _persist_decision(self, decision: DecisionContext):
        """Persist decision to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO consensus_decisions (
                    decision_id, decision_type, title, description, options,
                    required_agents, optional_agents, minimum_votes, consensus_threshold,
                    consensus_algorithm, timeout_seconds, created_by, created_at,
                    expires_at, status, priority, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            """, (
                decision.decision_id, decision.decision_type.value, decision.title,
                decision.description, json.dumps(decision.options), decision.required_agents,
                decision.optional_agents, decision.minimum_votes, decision.consensus_threshold,
                decision.consensus_algorithm.value, decision.timeout_seconds, decision.created_by,
                decision.created_at, decision.expires_at, decision.status.value,
                decision.priority, json.dumps(decision.metadata)
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist decision: {e}")
    
    async def _persist_vote(self, vote: AgentVote):
        """Persist vote to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO consensus_votes (
                    vote_id, decision_id, agent_id, vote_type, confidence,
                    reasoning, metadata, timestamp, weight
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, (
                vote.vote_id, vote.decision_id, vote.agent_id, vote.vote_type.value,
                vote.confidence, vote.reasoning, json.dumps(vote.metadata),
                vote.timestamp, vote.weight
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist vote: {e}")
    
    async def _persist_decision_result(self, result: DecisionResult):
        """Persist decision result to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO consensus_results (
                    decision_id, final_decision, consensus_reached, vote_count,
                    approval_percentage, participating_agents, non_participating_agents,
                    execution_status, execution_details, completed_at, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, (
                result.decision_id, result.final_decision, result.consensus_reached,
                result.vote_count, result.approval_percentage, result.participating_agents,
                result.non_participating_agents, result.execution_status,
                json.dumps(result.execution_details), result.completed_at,
                json.dumps(result.metadata)
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist decision result: {e}")


# Factory function for service registry
def create_consensus_decision_engine():
    """Factory function to create ConsensusDecisionEngine instance"""
    return ConsensusDecisionEngine()