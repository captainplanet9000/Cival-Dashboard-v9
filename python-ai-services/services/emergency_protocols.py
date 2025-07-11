"""
Emergency Protocols and Circuit Breakers Service
Autonomous emergency response system for critical trading situations
Built on existing risk_management_service.py and autonomous infrastructure
"""

import asyncio
import logging
import uuid
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json
from collections import defaultdict, deque

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class EmergencyType(Enum):
    """Types of emergency situations"""
    MARKET_CRASH = "market_crash"
    RISK_BREACH = "risk_breach"
    SYSTEM_FAILURE = "system_failure"
    LIQUIDITY_CRISIS = "liquidity_crisis"
    AGENT_MALFUNCTION = "agent_malfunction"
    EXTERNAL_THREAT = "external_threat"
    REGULATORY_HALT = "regulatory_halt"
    TECHNICAL_FAILURE = "technical_failure"
    MANUAL_TRIGGER = "manual_trigger"

class EmergencySeverity(Enum):
    """Severity levels for emergencies"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CircuitBreakerType(Enum):
    """Types of circuit breakers"""
    PORTFOLIO_LOSS = "portfolio_loss"
    POSITION_SIZE = "position_size"
    DAILY_DRAWDOWN = "daily_drawdown"
    VOLATILITY_SPIKE = "volatility_spike"
    CORRELATION_BREAKDOWN = "correlation_breakdown"
    LIQUIDITY_SHORTAGE = "liquidity_shortage"
    AGENT_ERROR_RATE = "agent_error_rate"
    MARKET_CIRCUIT_BREAKER = "market_circuit_breaker"

class EmergencyAction(Enum):
    """Available emergency actions"""
    HALT_ALL_TRADING = "halt_all_trading"
    REDUCE_POSITIONS = "reduce_positions"
    LIQUIDATE_POSITIONS = "liquidate_positions"
    PAUSE_AGENTS = "pause_agents"
    EMERGENCY_HEDGE = "emergency_hedge"
    NOTIFY_OPERATORS = "notify_operators"
    SWITCH_TO_MANUAL = "switch_to_manual"
    BACKUP_SYSTEM_STATE = "backup_system_state"
    ISOLATE_FAILED_COMPONENT = "isolate_failed_component"
    ACTIVATE_CONTINGENCY_PLAN = "activate_contingency_plan"

class ProtocolStatus(Enum):
    """Status of emergency protocols"""
    ACTIVE = "active"
    TRIGGERED = "triggered"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    DISABLED = "disabled"

@dataclass
class EmergencyCondition:
    """Condition that triggers emergency response"""
    condition_id: str
    emergency_type: EmergencyType
    severity: EmergencySeverity
    trigger_threshold: float
    current_value: float
    description: str
    enabled: bool
    last_checked: datetime
    breach_count: int

@dataclass
class CircuitBreaker:
    """Circuit breaker configuration"""
    breaker_id: str
    breaker_type: CircuitBreakerType
    threshold: float
    cooldown_seconds: int
    max_triggers_per_day: int
    enabled: bool
    last_triggered: Optional[datetime]
    triggers_today: int
    recovery_conditions: List[str]
    emergency_actions: List[EmergencyAction]

@dataclass
class EmergencyEvent:
    """Emergency event record"""
    event_id: str
    emergency_type: EmergencyType
    severity: EmergencySeverity
    trigger_condition: str
    triggered_at: datetime
    resolved_at: Optional[datetime]
    actions_taken: List[EmergencyAction]
    impact_assessment: Dict[str, Any]
    resolution_notes: str
    auto_resolved: bool
    metadata: Dict[str, Any]

@dataclass
class EmergencyResponse:
    """Emergency response execution"""
    response_id: str
    event_id: str
    actions: List[EmergencyAction]
    started_at: datetime
    completed_at: Optional[datetime]
    success: bool
    error_messages: List[str]
    recovery_time_seconds: Optional[int]
    financial_impact: Dict[str, float]

class EmergencyProtocols:
    """
    Comprehensive emergency protocols and circuit breaker system
    Integrates with existing risk management and autonomous infrastructure
    """
    
    def __init__(self):
        self.db_service = None
        self.event_service = None
        self.risk_service = None
        self.agent_coordinator = None
        self.market_regime_detector = None
        
        # Emergency state
        self.emergency_conditions: Dict[str, EmergencyCondition] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.active_emergencies: Dict[str, EmergencyEvent] = {}
        self.emergency_history: List[EmergencyEvent] = []
        self.response_history: List[EmergencyResponse] = []
        
        # System state
        self.system_halted = False
        self.autonomous_mode_suspended = False
        self.emergency_mode_active = False
        self.last_health_check = datetime.now(timezone.utc)
        
        # Configuration
        self.protocol_config = {
            'max_simultaneous_emergencies': 5,
            'emergency_cooldown_seconds': 300,
            'auto_recovery_enabled': True,
            'manual_override_timeout': 3600,
            'health_check_interval': 30,
            'circuit_breaker_check_interval': 10,
            'emergency_notification_enabled': True,
        }
        
        # Monitoring
        self.monitoring_metrics = {
            'total_emergencies': 0,
            'emergencies_today': 0,
            'circuit_breaker_triggers': 0,
            'auto_recoveries': 0,
            'manual_interventions': 0,
            'system_downtime_seconds': 0,
            'average_response_time': 0.0,
        }
        
        # Background tasks
        self.monitoring_task = None
        self.circuit_breaker_task = None
        self.recovery_task = None
        
        logger.info("Emergency Protocols service initialized")
    
    async def initialize(self):
        """Initialize emergency protocols service"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            self.risk_service = registry.get_service("advanced_risk_management")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            self.market_regime_detector = registry.get_service("market_regime_detector")
            
            # Create database tables
            if self.db_service:
                await self._create_emergency_tables()
            
            # Initialize emergency conditions and circuit breakers
            await self._initialize_emergency_conditions()
            await self._initialize_circuit_breakers()
            
            # Load historical data
            await self._load_emergency_history()
            
            # Start background tasks
            self.monitoring_task = asyncio.create_task(self._emergency_monitoring_loop())
            self.circuit_breaker_task = asyncio.create_task(self._circuit_breaker_loop())
            self.recovery_task = asyncio.create_task(self._recovery_monitoring_loop())
            
            logger.info("Emergency Protocols service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Emergency Protocols: {e}")
            raise
    
    async def trigger_emergency(self, emergency_type: EmergencyType, severity: EmergencySeverity,
                               trigger_condition: str, manual_trigger: bool = False,
                               metadata: Dict[str, Any] = None) -> str:
        """Trigger emergency response"""
        try:
            # Check if emergency mode is already active for this type
            if self.emergency_mode_active and not manual_trigger:
                similar_active = [e for e in self.active_emergencies.values() 
                                if e.emergency_type == emergency_type and not e.resolved_at]
                if similar_active:
                    logger.warning(f"Emergency {emergency_type.value} already active, skipping duplicate")
                    return similar_active[0].event_id
            
            # Check max simultaneous emergencies
            if len(self.active_emergencies) >= self.protocol_config['max_simultaneous_emergencies']:
                logger.error("Maximum simultaneous emergencies reached")
                return None
            
            # Create emergency event
            event_id = str(uuid.uuid4())
            emergency_event = EmergencyEvent(
                event_id=event_id,
                emergency_type=emergency_type,
                severity=severity,
                trigger_condition=trigger_condition,
                triggered_at=datetime.now(timezone.utc),
                resolved_at=None,
                actions_taken=[],
                impact_assessment={},
                resolution_notes="",
                auto_resolved=False,
                metadata=metadata or {}
            )
            
            # Store emergency
            self.active_emergencies[event_id] = emergency_event
            self.emergency_history.append(emergency_event)
            
            # Update metrics
            self.monitoring_metrics['total_emergencies'] += 1
            self.monitoring_metrics['emergencies_today'] += 1
            
            # Activate emergency mode
            self.emergency_mode_active = True
            
            # Execute emergency response
            response = await self._execute_emergency_response(emergency_event)
            
            # Persist to database
            if self.db_service:
                await self._persist_emergency_event(emergency_event)
                await self._persist_emergency_response(response)
            
            # Emit emergency event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'emergency_protocols.emergency_triggered',
                    'event_id': event_id,
                    'emergency_type': emergency_type.value,
                    'severity': severity.value,
                    'trigger_condition': trigger_condition,
                    'manual_trigger': manual_trigger,
                    'timestamp': emergency_event.triggered_at.isoformat()
                })
            
            logger.critical(f"Emergency triggered: {emergency_type.value} (Severity: {severity.value}) - {trigger_condition}")
            return event_id
            
        except Exception as e:
            logger.error(f"Failed to trigger emergency: {e}")
            return None
    
    async def activate_circuit_breaker(self, breaker_type: CircuitBreakerType, 
                                     current_value: float, metadata: Dict[str, Any] = None) -> bool:
        """Activate circuit breaker"""
        try:
            breaker_id = f"{breaker_type.value}_breaker"
            breaker = self.circuit_breakers.get(breaker_id)
            
            if not breaker or not breaker.enabled:
                return False
            
            # Check cooldown
            if breaker.last_triggered:
                time_since_last = (datetime.now(timezone.utc) - breaker.last_triggered).total_seconds()
                if time_since_last < breaker.cooldown_seconds:
                    logger.debug(f"Circuit breaker {breaker_id} still in cooldown")
                    return False
            
            # Check daily limit
            if breaker.triggers_today >= breaker.max_triggers_per_day:
                logger.warning(f"Circuit breaker {breaker_id} reached daily limit")
                return False
            
            # Check threshold
            if current_value < breaker.threshold:
                return False
            
            # Activate circuit breaker
            breaker.last_triggered = datetime.now(timezone.utc)
            breaker.triggers_today += 1
            
            # Update metrics
            self.monitoring_metrics['circuit_breaker_triggers'] += 1
            
            # Execute emergency actions
            for action in breaker.emergency_actions:
                await self._execute_emergency_action(action, metadata or {})
            
            # Create emergency event
            emergency_type = EmergencyType.RISK_BREACH
            severity = EmergencySeverity.HIGH if current_value > breaker.threshold * 2 else EmergencySeverity.MEDIUM
            
            await self.trigger_emergency(
                emergency_type=emergency_type,
                severity=severity,
                trigger_condition=f"Circuit breaker {breaker_type.value} activated at {current_value}",
                metadata={
                    'circuit_breaker_id': breaker_id,
                    'threshold': breaker.threshold,
                    'current_value': current_value,
                    'breaker_type': breaker_type.value,
                    **metadata
                }
            )
            
            logger.warning(f"Circuit breaker activated: {breaker_type.value} (Value: {current_value}, Threshold: {breaker.threshold})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to activate circuit breaker: {e}")
            return False
    
    async def resolve_emergency(self, event_id: str, resolution_notes: str = "", 
                              auto_resolved: bool = False) -> bool:
        """Resolve emergency event"""
        try:
            if event_id not in self.active_emergencies:
                logger.warning(f"Emergency {event_id} not found in active emergencies")
                return False
            
            emergency = self.active_emergencies[event_id]
            emergency.resolved_at = datetime.now(timezone.utc)
            emergency.resolution_notes = resolution_notes
            emergency.auto_resolved = auto_resolved
            
            # Remove from active emergencies
            del self.active_emergencies[event_id]
            
            # Update metrics
            if auto_resolved:
                self.monitoring_metrics['auto_recoveries'] += 1
            else:
                self.monitoring_metrics['manual_interventions'] += 1
            
            # Check if emergency mode can be deactivated
            if not self.active_emergencies:
                self.emergency_mode_active = False
                logger.info("Emergency mode deactivated - no active emergencies")
            
            # Emit resolution event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'emergency_protocols.emergency_resolved',
                    'event_id': event_id,
                    'emergency_type': emergency.emergency_type.value,
                    'resolution_notes': resolution_notes,
                    'auto_resolved': auto_resolved,
                    'duration_seconds': (emergency.resolved_at - emergency.triggered_at).total_seconds(),
                    'timestamp': emergency.resolved_at.isoformat()
                })
            
            # Update database
            if self.db_service:
                await self._update_emergency_event(emergency)
            
            logger.info(f"Emergency resolved: {event_id} ({'auto' if auto_resolved else 'manual'})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to resolve emergency: {e}")
            return False
    
    async def halt_all_trading(self, reason: str = "Emergency protocol activated") -> bool:
        """Emergency halt all trading activities"""
        try:
            if self.system_halted:
                logger.info("System already halted")
                return True
            
            self.system_halted = True
            
            # Halt all agent trading
            if self.agent_coordinator:
                await self.agent_coordinator.halt_all_agents()
            
            # Cancel all pending orders
            # This would integrate with exchange APIs
            
            # Suspend autonomous mode
            self.autonomous_mode_suspended = True
            
            # Emit halt event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'emergency_protocols.trading_halted',
                    'reason': reason,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            
            logger.critical(f"All trading halted: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to halt trading: {e}")
            return False
    
    async def resume_trading(self, reason: str = "Emergency resolved") -> bool:
        """Resume trading after emergency"""
        try:
            if not self.system_halted:
                logger.info("System not currently halted")
                return True
            
            # Check if it's safe to resume
            if self.active_emergencies:
                logger.warning("Cannot resume trading - active emergencies exist")
                return False
            
            # Resume autonomous mode
            self.autonomous_mode_suspended = False
            self.system_halted = False
            
            # Resume agent trading
            if self.agent_coordinator:
                await self.agent_coordinator.resume_all_agents()
            
            # Emit resume event
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'emergency_protocols.trading_resumed',
                    'reason': reason,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            
            logger.info(f"Trading resumed: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to resume trading: {e}")
            return False
    
    async def get_emergency_status(self) -> Dict[str, Any]:
        """Get current emergency status"""
        return {
            'emergency_mode_active': self.emergency_mode_active,
            'system_halted': self.system_halted,
            'autonomous_mode_suspended': self.autonomous_mode_suspended,
            'active_emergencies': len(self.active_emergencies),
            'active_emergency_details': [
                {
                    'event_id': e.event_id,
                    'type': e.emergency_type.value,
                    'severity': e.severity.value,
                    'triggered_at': e.triggered_at.isoformat(),
                    'duration_seconds': (datetime.now(timezone.utc) - e.triggered_at).total_seconds()
                }
                for e in self.active_emergencies.values()
            ],
            'circuit_breakers_active': sum(1 for cb in self.circuit_breakers.values() if cb.enabled),
            'emergency_conditions_monitored': len(self.emergency_conditions),
            'metrics': self.monitoring_metrics,
            'last_health_check': self.last_health_check.isoformat()
        }
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            'service': 'emergency_protocols',
            'status': 'running',
            'emergency_mode_active': self.emergency_mode_active,
            'system_halted': self.system_halted,
            'active_emergencies': len(self.active_emergencies),
            'circuit_breakers_enabled': sum(1 for cb in self.circuit_breakers.values() if cb.enabled),
            'emergency_conditions': len(self.emergency_conditions),
            'monitoring_metrics': self.monitoring_metrics,
            'protocol_config': self.protocol_config,
            'last_health_check': datetime.now(timezone.utc).isoformat()
        }
    
    # Private methods
    
    async def _initialize_emergency_conditions(self):
        """Initialize emergency monitoring conditions"""
        try:
            # Portfolio loss condition
            self.emergency_conditions['portfolio_loss'] = EmergencyCondition(
                condition_id='portfolio_loss',
                emergency_type=EmergencyType.RISK_BREACH,
                severity=EmergencySeverity.HIGH,
                trigger_threshold=0.05,  # 5% loss
                current_value=0.0,
                description="Portfolio total loss threshold",
                enabled=True,
                last_checked=datetime.now(timezone.utc),
                breach_count=0
            )
            
            # Daily drawdown condition
            self.emergency_conditions['daily_drawdown'] = EmergencyCondition(
                condition_id='daily_drawdown',
                emergency_type=EmergencyType.RISK_BREACH,
                severity=EmergencySeverity.MEDIUM,
                trigger_threshold=0.03,  # 3% daily drawdown
                current_value=0.0,
                description="Daily drawdown threshold",
                enabled=True,
                last_checked=datetime.now(timezone.utc),
                breach_count=0
            )
            
            # Volatility spike condition
            self.emergency_conditions['volatility_spike'] = EmergencyCondition(
                condition_id='volatility_spike',
                emergency_type=EmergencyType.MARKET_CRASH,
                severity=EmergencySeverity.HIGH,
                trigger_threshold=0.05,  # 5% volatility
                current_value=0.0,
                description="Market volatility spike threshold",
                enabled=True,
                last_checked=datetime.now(timezone.utc),
                breach_count=0
            )
            
            # Agent error rate condition
            self.emergency_conditions['agent_error_rate'] = EmergencyCondition(
                condition_id='agent_error_rate',
                emergency_type=EmergencyType.AGENT_MALFUNCTION,
                severity=EmergencySeverity.MEDIUM,
                trigger_threshold=0.10,  # 10% error rate
                current_value=0.0,
                description="Agent error rate threshold",
                enabled=True,
                last_checked=datetime.now(timezone.utc),
                breach_count=0
            )
            
            logger.info(f"Initialized {len(self.emergency_conditions)} emergency conditions")
            
        except Exception as e:
            logger.error(f"Failed to initialize emergency conditions: {e}")
    
    async def _initialize_circuit_breakers(self):
        """Initialize circuit breakers"""
        try:
            # Portfolio loss circuit breaker
            self.circuit_breakers['portfolio_loss_breaker'] = CircuitBreaker(
                breaker_id='portfolio_loss_breaker',
                breaker_type=CircuitBreakerType.PORTFOLIO_LOSS,
                threshold=0.05,  # 5% loss
                cooldown_seconds=300,  # 5 minutes
                max_triggers_per_day=3,
                enabled=True,
                last_triggered=None,
                triggers_today=0,
                recovery_conditions=['portfolio_stabilized', 'manual_override'],
                emergency_actions=[EmergencyAction.HALT_ALL_TRADING, EmergencyAction.NOTIFY_OPERATORS]
            )
            
            # Daily drawdown circuit breaker
            self.circuit_breakers['daily_drawdown_breaker'] = CircuitBreaker(
                breaker_id='daily_drawdown_breaker',
                breaker_type=CircuitBreakerType.DAILY_DRAWDOWN,
                threshold=0.03,  # 3% daily drawdown
                cooldown_seconds=600,  # 10 minutes
                max_triggers_per_day=5,
                enabled=True,
                last_triggered=None,
                triggers_today=0,
                recovery_conditions=['drawdown_recovered'],
                emergency_actions=[EmergencyAction.REDUCE_POSITIONS, EmergencyAction.PAUSE_AGENTS]
            )
            
            # Volatility spike circuit breaker
            self.circuit_breakers['volatility_spike_breaker'] = CircuitBreaker(
                breaker_id='volatility_spike_breaker',
                breaker_type=CircuitBreakerType.VOLATILITY_SPIKE,
                threshold=0.05,  # 5% volatility
                cooldown_seconds=180,  # 3 minutes
                max_triggers_per_day=10,
                enabled=True,
                last_triggered=None,
                triggers_today=0,
                recovery_conditions=['volatility_normalized'],
                emergency_actions=[EmergencyAction.REDUCE_POSITIONS, EmergencyAction.EMERGENCY_HEDGE]
            )
            
            # Agent error rate circuit breaker
            self.circuit_breakers['agent_error_rate_breaker'] = CircuitBreaker(
                breaker_id='agent_error_rate_breaker',
                breaker_type=CircuitBreakerType.AGENT_ERROR_RATE,
                threshold=0.10,  # 10% error rate
                cooldown_seconds=900,  # 15 minutes
                max_triggers_per_day=3,
                enabled=True,
                last_triggered=None,
                triggers_today=0,
                recovery_conditions=['agent_errors_resolved'],
                emergency_actions=[EmergencyAction.PAUSE_AGENTS, EmergencyAction.SWITCH_TO_MANUAL]
            )
            
            logger.info(f"Initialized {len(self.circuit_breakers)} circuit breakers")
            
        except Exception as e:
            logger.error(f"Failed to initialize circuit breakers: {e}")
    
    async def _execute_emergency_response(self, emergency_event: EmergencyEvent) -> EmergencyResponse:
        """Execute emergency response actions"""
        try:
            response_id = str(uuid.uuid4())
            response = EmergencyResponse(
                response_id=response_id,
                event_id=emergency_event.event_id,
                actions=[],
                started_at=datetime.now(timezone.utc),
                completed_at=None,
                success=False,
                error_messages=[],
                recovery_time_seconds=None,
                financial_impact={}
            )
            
            # Determine actions based on emergency type and severity
            actions = self._determine_emergency_actions(emergency_event)
            response.actions = actions
            
            # Execute each action
            for action in actions:
                try:
                    await self._execute_emergency_action(action, emergency_event.metadata)
                    emergency_event.actions_taken.append(action)
                except Exception as e:
                    response.error_messages.append(f"Failed to execute {action.value}: {e}")
            
            response.completed_at = datetime.now(timezone.utc)
            response.success = len(response.error_messages) == 0
            
            if response.completed_at:
                response.recovery_time_seconds = (response.completed_at - response.started_at).total_seconds()
            
            self.response_history.append(response)
            return response
            
        except Exception as e:
            logger.error(f"Failed to execute emergency response: {e}")
            return response
    
    def _determine_emergency_actions(self, emergency_event: EmergencyEvent) -> List[EmergencyAction]:
        """Determine appropriate emergency actions"""
        actions = []
        
        if emergency_event.emergency_type == EmergencyType.MARKET_CRASH:
            actions.extend([
                EmergencyAction.HALT_ALL_TRADING,
                EmergencyAction.EMERGENCY_HEDGE,
                EmergencyAction.NOTIFY_OPERATORS,
                EmergencyAction.BACKUP_SYSTEM_STATE
            ])
        elif emergency_event.emergency_type == EmergencyType.RISK_BREACH:
            if emergency_event.severity == EmergencySeverity.CRITICAL:
                actions.extend([
                    EmergencyAction.HALT_ALL_TRADING,
                    EmergencyAction.LIQUIDATE_POSITIONS,
                    EmergencyAction.NOTIFY_OPERATORS
                ])
            else:
                actions.extend([
                    EmergencyAction.REDUCE_POSITIONS,
                    EmergencyAction.PAUSE_AGENTS,
                    EmergencyAction.EMERGENCY_HEDGE
                ])
        elif emergency_event.emergency_type == EmergencyType.SYSTEM_FAILURE:
            actions.extend([
                EmergencyAction.HALT_ALL_TRADING,
                EmergencyAction.BACKUP_SYSTEM_STATE,
                EmergencyAction.ISOLATE_FAILED_COMPONENT,
                EmergencyAction.SWITCH_TO_MANUAL
            ])
        elif emergency_event.emergency_type == EmergencyType.AGENT_MALFUNCTION:
            actions.extend([
                EmergencyAction.PAUSE_AGENTS,
                EmergencyAction.ISOLATE_FAILED_COMPONENT,
                EmergencyAction.SWITCH_TO_MANUAL
            ])
        else:
            # Default actions
            actions.extend([
                EmergencyAction.NOTIFY_OPERATORS,
                EmergencyAction.BACKUP_SYSTEM_STATE
            ])
        
        return actions
    
    async def _execute_emergency_action(self, action: EmergencyAction, metadata: Dict[str, Any]):
        """Execute specific emergency action"""
        try:
            if action == EmergencyAction.HALT_ALL_TRADING:
                await self.halt_all_trading("Emergency action triggered")
            
            elif action == EmergencyAction.REDUCE_POSITIONS:
                # Reduce positions by 50%
                if self.agent_coordinator:
                    await self.agent_coordinator.reduce_all_positions(0.5)
            
            elif action == EmergencyAction.LIQUIDATE_POSITIONS:
                # Liquidate all positions
                if self.agent_coordinator:
                    await self.agent_coordinator.liquidate_all_positions()
            
            elif action == EmergencyAction.PAUSE_AGENTS:
                # Pause all agents
                if self.agent_coordinator:
                    await self.agent_coordinator.pause_all_agents()
            
            elif action == EmergencyAction.EMERGENCY_HEDGE:
                # Implement emergency hedging
                if self.agent_coordinator:
                    await self.agent_coordinator.emergency_hedge_portfolio()
            
            elif action == EmergencyAction.NOTIFY_OPERATORS:
                # Send notifications to operators
                if self.event_service:
                    await self.event_service.emit_event({
                        'event_type': 'emergency_protocols.operator_notification',
                        'action': action.value,
                        'metadata': metadata,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    })
            
            elif action == EmergencyAction.SWITCH_TO_MANUAL:
                # Switch to manual mode
                self.autonomous_mode_suspended = True
            
            elif action == EmergencyAction.BACKUP_SYSTEM_STATE:
                # Backup system state
                # This would integrate with state persistence service
                pass
            
            elif action == EmergencyAction.ISOLATE_FAILED_COMPONENT:
                # Isolate failed component
                # This would integrate with health monitor
                pass
            
            elif action == EmergencyAction.ACTIVATE_CONTINGENCY_PLAN:
                # Activate contingency plan
                # This would implement predefined contingency procedures
                pass
            
            logger.info(f"Emergency action executed: {action.value}")
            
        except Exception as e:
            logger.error(f"Failed to execute emergency action {action.value}: {e}")
            raise
    
    async def _emergency_monitoring_loop(self):
        """Background task for emergency monitoring"""
        while True:
            try:
                await asyncio.sleep(self.protocol_config['health_check_interval'])
                
                # Check emergency conditions
                await self._check_emergency_conditions()
                
                # Update health check timestamp
                self.last_health_check = datetime.now(timezone.utc)
                
                # Check for auto-recovery opportunities
                if self.protocol_config['auto_recovery_enabled']:
                    await self._check_auto_recovery()
                
            except Exception as e:
                logger.error(f"Error in emergency monitoring loop: {e}")
    
    async def _circuit_breaker_loop(self):
        """Background task for circuit breaker monitoring"""
        while True:
            try:
                await asyncio.sleep(self.protocol_config['circuit_breaker_check_interval'])
                
                # Check circuit breaker conditions
                await self._check_circuit_breakers()
                
                # Reset daily counters if needed
                await self._reset_daily_counters()
                
            except Exception as e:
                logger.error(f"Error in circuit breaker loop: {e}")
    
    async def _recovery_monitoring_loop(self):
        """Background task for recovery monitoring"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Check recovery conditions
                await self._check_recovery_conditions()
                
                # Clean up old emergency events
                await self._cleanup_old_events()
                
            except Exception as e:
                logger.error(f"Error in recovery monitoring loop: {e}")
    
    async def _check_emergency_conditions(self):
        """Check all emergency conditions"""
        try:
            # Get current system metrics
            current_metrics = await self._get_current_metrics()
            
            for condition in self.emergency_conditions.values():
                if not condition.enabled:
                    continue
                
                # Update current value based on condition type
                if condition.condition_id == 'portfolio_loss':
                    condition.current_value = current_metrics.get('portfolio_loss', 0.0)
                elif condition.condition_id == 'daily_drawdown':
                    condition.current_value = current_metrics.get('daily_drawdown', 0.0)
                elif condition.condition_id == 'volatility_spike':
                    condition.current_value = current_metrics.get('volatility', 0.0)
                elif condition.condition_id == 'agent_error_rate':
                    condition.current_value = current_metrics.get('agent_error_rate', 0.0)
                
                # Check threshold breach
                if condition.current_value >= condition.trigger_threshold:
                    condition.breach_count += 1
                    
                    # Trigger emergency if threshold breached
                    await self.trigger_emergency(
                        emergency_type=condition.emergency_type,
                        severity=condition.severity,
                        trigger_condition=f"Condition {condition.condition_id} breached: {condition.current_value} >= {condition.trigger_threshold}"
                    )
                
                condition.last_checked = datetime.now(timezone.utc)
                
        except Exception as e:
            logger.error(f"Failed to check emergency conditions: {e}")
    
    async def _check_circuit_breakers(self):
        """Check circuit breaker conditions"""
        try:
            # Get current system metrics
            current_metrics = await self._get_current_metrics()
            
            for breaker in self.circuit_breakers.values():
                if not breaker.enabled:
                    continue
                
                # Get relevant metric for this breaker
                if breaker.breaker_type == CircuitBreakerType.PORTFOLIO_LOSS:
                    current_value = current_metrics.get('portfolio_loss', 0.0)
                elif breaker.breaker_type == CircuitBreakerType.DAILY_DRAWDOWN:
                    current_value = current_metrics.get('daily_drawdown', 0.0)
                elif breaker.breaker_type == CircuitBreakerType.VOLATILITY_SPIKE:
                    current_value = current_metrics.get('volatility', 0.0)
                elif breaker.breaker_type == CircuitBreakerType.AGENT_ERROR_RATE:
                    current_value = current_metrics.get('agent_error_rate', 0.0)
                else:
                    continue
                
                # Check if breaker should activate
                await self.activate_circuit_breaker(breaker.breaker_type, current_value)
                
        except Exception as e:
            logger.error(f"Failed to check circuit breakers: {e}")
    
    async def _get_current_metrics(self) -> Dict[str, float]:
        """Get current system metrics for monitoring"""
        try:
            metrics = {
                'portfolio_loss': 0.0,
                'daily_drawdown': 0.0,
                'volatility': 0.0,
                'agent_error_rate': 0.0
            }
            
            # Get metrics from risk service
            if self.risk_service:
                risk_metrics = await self.risk_service.get_current_risk_metrics()
                if risk_metrics:
                    metrics['portfolio_loss'] = risk_metrics.get('portfolio_loss', 0.0)
                    metrics['daily_drawdown'] = risk_metrics.get('daily_drawdown', 0.0)
            
            # Get metrics from market regime detector
            if self.market_regime_detector:
                current_regime = await self.market_regime_detector.get_current_regime()
                if current_regime:
                    metrics['volatility'] = current_regime.market_conditions.volatility_1d
            
            # Get metrics from agent coordinator
            if self.agent_coordinator:
                agent_metrics = await self.agent_coordinator.get_agent_metrics()
                if agent_metrics:
                    metrics['agent_error_rate'] = agent_metrics.get('error_rate', 0.0)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get current metrics: {e}")
            return {}
    
    async def _check_auto_recovery(self):
        """Check for auto-recovery opportunities"""
        try:
            for event_id, emergency in list(self.active_emergencies.items()):
                # Check if conditions have normalized
                if await self._check_recovery_conditions_for_event(emergency):
                    await self.resolve_emergency(event_id, "Auto-recovery: conditions normalized", auto_resolved=True)
                    
        except Exception as e:
            logger.error(f"Failed to check auto-recovery: {e}")
    
    async def _check_recovery_conditions_for_event(self, emergency: EmergencyEvent) -> bool:
        """Check if recovery conditions are met for specific event"""
        try:
            # Get current metrics
            current_metrics = await self._get_current_metrics()
            
            # Check recovery based on emergency type
            if emergency.emergency_type == EmergencyType.RISK_BREACH:
                # Check if risk has normalized
                if emergency.trigger_condition.startswith("portfolio_loss"):
                    return current_metrics.get('portfolio_loss', 0.0) < 0.02  # Below 2%
                elif emergency.trigger_condition.startswith("daily_drawdown"):
                    return current_metrics.get('daily_drawdown', 0.0) < 0.01  # Below 1%
                    
            elif emergency.emergency_type == EmergencyType.MARKET_CRASH:
                # Check if volatility has normalized
                return current_metrics.get('volatility', 0.0) < 0.025  # Below 2.5%
                
            elif emergency.emergency_type == EmergencyType.AGENT_MALFUNCTION:
                # Check if agent error rate has normalized
                return current_metrics.get('agent_error_rate', 0.0) < 0.05  # Below 5%
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to check recovery conditions: {e}")
            return False
    
    async def _reset_daily_counters(self):
        """Reset daily counters at midnight"""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Check if it's a new day
            for breaker in self.circuit_breakers.values():
                if breaker.last_triggered:
                    days_since_last = (current_time - breaker.last_triggered).days
                    if days_since_last >= 1:
                        breaker.triggers_today = 0
                        
            # Reset daily emergency counter
            # This would be more sophisticated in a real implementation
            if current_time.hour == 0 and current_time.minute == 0:
                self.monitoring_metrics['emergencies_today'] = 0
                
        except Exception as e:
            logger.error(f"Failed to reset daily counters: {e}")
    
    async def _check_recovery_conditions(self):
        """Check recovery conditions for all active emergencies"""
        try:
            for event_id in list(self.active_emergencies.keys()):
                emergency = self.active_emergencies[event_id]
                
                # Check if emergency has been active too long
                duration = (datetime.now(timezone.utc) - emergency.triggered_at).total_seconds()
                if duration > self.protocol_config['manual_override_timeout']:
                    logger.warning(f"Emergency {event_id} has been active for {duration} seconds - requiring manual intervention")
                    # Emit notification for manual intervention
                    if self.event_service:
                        await self.event_service.emit_event({
                            'event_type': 'emergency_protocols.manual_intervention_required',
                            'event_id': event_id,
                            'duration_seconds': duration,
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        })
                        
        except Exception as e:
            logger.error(f"Failed to check recovery conditions: {e}")
    
    async def _cleanup_old_events(self):
        """Clean up old emergency events"""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)
            
            # Keep only recent events in memory
            self.emergency_history = [
                event for event in self.emergency_history
                if event.triggered_at > cutoff_time
            ]
            
            self.response_history = [
                response for response in self.response_history
                if response.started_at > cutoff_time
            ]
            
        except Exception as e:
            logger.error(f"Failed to cleanup old events: {e}")
    
    async def _create_emergency_tables(self):
        """Create database tables for emergency protocols"""
        try:
            # Emergency events table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS emergency_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id TEXT UNIQUE NOT NULL,
                    emergency_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    trigger_condition TEXT NOT NULL,
                    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    resolved_at TIMESTAMP WITH TIME ZONE,
                    actions_taken TEXT[],
                    impact_assessment JSONB,
                    resolution_notes TEXT,
                    auto_resolved BOOLEAN DEFAULT FALSE,
                    metadata JSONB
                )
            """)
            
            # Emergency responses table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS emergency_responses (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    response_id TEXT UNIQUE NOT NULL,
                    event_id TEXT NOT NULL,
                    actions TEXT[],
                    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    completed_at TIMESTAMP WITH TIME ZONE,
                    success BOOLEAN DEFAULT FALSE,
                    error_messages TEXT[],
                    recovery_time_seconds INTEGER,
                    financial_impact JSONB,
                    FOREIGN KEY (event_id) REFERENCES emergency_events(event_id)
                )
            """)
            
            # Circuit breaker activations table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS circuit_breaker_activations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    breaker_id TEXT NOT NULL,
                    breaker_type TEXT NOT NULL,
                    threshold DECIMAL NOT NULL,
                    current_value DECIMAL NOT NULL,
                    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    metadata JSONB
                )
            """)
            
        except Exception as e:
            logger.error(f"Failed to create emergency tables: {e}")
            raise
    
    async def _load_emergency_history(self):
        """Load emergency history from database"""
        try:
            if not self.db_service:
                return
                
            # Load recent emergency events
            events = await self.db_service.execute_query("""
                SELECT * FROM emergency_events 
                WHERE triggered_at > NOW() - INTERVAL '7 days'
                ORDER BY triggered_at DESC
                LIMIT 100
            """)
            
            # Load recent responses
            responses = await self.db_service.execute_query("""
                SELECT * FROM emergency_responses 
                WHERE started_at > NOW() - INTERVAL '7 days'
                ORDER BY started_at DESC
                LIMIT 100
            """)
            
            logger.info(f"Loaded {len(events) if events else 0} emergency events and {len(responses) if responses else 0} responses")
            
        except Exception as e:
            logger.error(f"Failed to load emergency history: {e}")
    
    async def _persist_emergency_event(self, event: EmergencyEvent):
        """Persist emergency event to database"""
        try:
            if not self.db_service:
                return
                
            await self.db_service.execute_query("""
                INSERT INTO emergency_events (
                    event_id, emergency_type, severity, trigger_condition,
                    triggered_at, resolved_at, actions_taken, impact_assessment,
                    resolution_notes, auto_resolved, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, (
                event.event_id,
                event.emergency_type.value,
                event.severity.value,
                event.trigger_condition,
                event.triggered_at,
                event.resolved_at,
                [a.value for a in event.actions_taken],
                json.dumps(event.impact_assessment),
                event.resolution_notes,
                event.auto_resolved,
                json.dumps(event.metadata)
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist emergency event: {e}")
    
    async def _persist_emergency_response(self, response: EmergencyResponse):
        """Persist emergency response to database"""
        try:
            if not self.db_service:
                return
                
            await self.db_service.execute_query("""
                INSERT INTO emergency_responses (
                    response_id, event_id, actions, started_at, completed_at,
                    success, error_messages, recovery_time_seconds, financial_impact
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, (
                response.response_id,
                response.event_id,
                [a.value for a in response.actions],
                response.started_at,
                response.completed_at,
                response.success,
                response.error_messages,
                response.recovery_time_seconds,
                json.dumps(response.financial_impact)
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist emergency response: {e}")
    
    async def _update_emergency_event(self, event: EmergencyEvent):
        """Update emergency event in database"""
        try:
            if not self.db_service:
                return
                
            await self.db_service.execute_query("""
                UPDATE emergency_events 
                SET resolved_at = $2, actions_taken = $3, impact_assessment = $4,
                    resolution_notes = $5, auto_resolved = $6
                WHERE event_id = $1
            """, (
                event.event_id,
                event.resolved_at,
                [a.value for a in event.actions_taken],
                json.dumps(event.impact_assessment),
                event.resolution_notes,
                event.auto_resolved
            ))
            
        except Exception as e:
            logger.error(f"Failed to update emergency event: {e}")


# Factory function for service registry
def create_emergency_protocols():
    """Factory function to create EmergencyProtocols instance"""
    return EmergencyProtocols()