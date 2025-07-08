"""
Universal Trading Mode Service
Provides system-wide toggle between paper trading and live market data
Ensures consistent trading mode across all dashboard components and agents
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import json

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class TradingMode(Enum):
    """Trading mode options"""
    PAPER = "paper"
    LIVE = "live"
    SIMULATION = "simulation"
    BACKTEST = "backtest"

class ComponentType(Enum):
    """Types of components that need mode coordination"""
    DASHBOARD = "dashboard"
    TRADING_INTERFACE = "trading_interface"
    AGENT = "agent"
    PORTFOLIO_TRACKER = "portfolio_tracker"
    RISK_MANAGER = "risk_manager"
    MARKET_DATA = "market_data"
    ORDER_MANAGER = "order_manager"
    ANALYTICS = "analytics"

@dataclass
class TradingModeConfig:
    """Trading mode configuration"""
    mode: TradingMode
    enabled_exchanges: List[str]
    risk_limits: Dict[str, float]
    position_limits: Dict[str, float]
    safety_checks: bool
    real_funds: bool
    live_data: bool
    notifications: bool
    audit_logging: bool
    paper_balance: float = 100000.0  # Default paper trading balance

@dataclass
class ComponentModeStatus:
    """Component mode status tracking"""
    component_id: str
    component_type: ComponentType
    current_mode: TradingMode
    last_updated: datetime
    status: str  # 'synced', 'updating', 'error'
    error_message: Optional[str] = None

class UniversalTradingModeService:
    """
    Universal service for coordinating trading mode across all system components
    Ensures consistent paper/live trading mode across dashboard, agents, and APIs
    """
    
    def __init__(self):
        self.current_mode = TradingMode.PAPER  # Default to paper trading for safety
        self.mode_config = self._get_default_config()
        self.registered_components: Dict[str, ComponentModeStatus] = {}
        self.mode_change_callbacks: Dict[str, Callable] = {}
        self.mode_history: List[Dict[str, Any]] = []
        self.is_initialized = False
        
        # Related services
        self.exchange_api_service = None
        self.portfolio_tracker = None
        self.risk_manager = None
        self.agent_coordinator = None
        
        logger.info("Universal Trading Mode Service initialized in PAPER mode")
    
    async def initialize(self):
        """Initialize the universal trading mode service"""
        try:
            # Get related services
            registry = get_registry()
            self.exchange_api_service = registry.get_service("exchange_api_service")
            self.portfolio_tracker = registry.get_service("portfolio_tracker_service")
            self.risk_manager = registry.get_service("advanced_risk_management")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            
            # Load saved mode configuration
            await self._load_mode_configuration()
            
            # Register core system components
            await self._register_core_components()
            
            # Start background monitoring
            asyncio.create_task(self._mode_monitoring_loop())
            
            self.is_initialized = True
            logger.info(f"Universal Trading Mode Service initialized in {self.current_mode.value.upper()} mode")
            
        except Exception as e:
            logger.error(f"Failed to initialize trading mode service: {e}")
            raise
    
    # ==================== MODE MANAGEMENT ====================
    
    async def set_trading_mode(self, mode: TradingMode, config: Optional[TradingModeConfig] = None) -> bool:
        """Set system-wide trading mode"""
        try:
            previous_mode = self.current_mode
            
            # Validate mode change
            if not await self._validate_mode_change(mode):
                return False
            
            # Update configuration
            if config:
                self.mode_config = config
            else:
                self.mode_config.mode = mode
                # Adjust config based on mode
                self.mode_config.real_funds = (mode == TradingMode.LIVE)
                self.mode_config.live_data = (mode in [TradingMode.LIVE, TradingMode.SIMULATION])
                self.mode_config.safety_checks = (mode != TradingMode.BACKTEST)
            
            # Record mode change
            mode_change = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'previous_mode': previous_mode.value,
                'new_mode': mode.value,
                'config': asdict(self.mode_config),
                'initiated_by': 'system'
            }
            self.mode_history.append(mode_change)
            
            # Update current mode
            self.current_mode = mode
            
            # Propagate mode change to all components
            await self._propagate_mode_change()
            
            # Save configuration
            await self._save_mode_configuration()
            
            logger.info(f"Trading mode changed from {previous_mode.value} to {mode.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set trading mode: {e}")
            return False
    
    async def get_trading_mode(self) -> TradingMode:
        """Get current trading mode"""
        return self.current_mode
    
    async def get_mode_config(self) -> TradingModeConfig:
        """Get current mode configuration"""
        return self.mode_config
    
    async def toggle_trading_mode(self) -> bool:
        """Toggle between paper and live trading"""
        new_mode = TradingMode.LIVE if self.current_mode == TradingMode.PAPER else TradingMode.PAPER
        return await self.set_trading_mode(new_mode)
    
    # ==================== COMPONENT REGISTRATION ====================
    
    async def register_component(self, 
                               component_id: str, 
                               component_type: ComponentType,
                               mode_change_callback: Optional[Callable] = None) -> bool:
        """Register a component for mode coordination"""
        try:
            # Create component status
            component_status = ComponentModeStatus(
                component_id=component_id,
                component_type=component_type,
                current_mode=self.current_mode,
                last_updated=datetime.now(timezone.utc),
                status='synced'
            )
            
            # Register component
            self.registered_components[component_id] = component_status
            
            # Register callback if provided
            if mode_change_callback:
                self.mode_change_callbacks[component_id] = mode_change_callback
            
            logger.info(f"Registered component {component_id} ({component_type.value})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register component {component_id}: {e}")
            return False
    
    async def unregister_component(self, component_id: str) -> bool:
        """Unregister a component from mode coordination"""
        try:
            if component_id in self.registered_components:
                del self.registered_components[component_id]
            
            if component_id in self.mode_change_callbacks:
                del self.mode_change_callbacks[component_id]
            
            logger.info(f"Unregistered component {component_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unregister component {component_id}: {e}")
            return False
    
    # ==================== MODE PROPAGATION ====================
    
    async def _propagate_mode_change(self):
        """Propagate mode change to all registered components"""
        try:
            # Update exchange API service
            if self.exchange_api_service:
                await self._update_exchange_api_mode()
            
            # Update portfolio tracker
            if self.portfolio_tracker:
                await self._update_portfolio_tracker_mode()
            
            # Update risk manager
            if self.risk_manager:
                await self._update_risk_manager_mode()
            
            # Update agent coordinator
            if self.agent_coordinator:
                await self._update_agent_coordinator_mode()
            
            # Call registered callbacks
            for component_id, callback in self.mode_change_callbacks.items():
                try:
                    await self._call_component_callback(component_id, callback)
                except Exception as e:
                    logger.error(f"Failed to call callback for {component_id}: {e}")
                    await self._update_component_status(component_id, 'error', str(e))
            
            logger.info(f"Mode change propagated to {len(self.registered_components)} components")
            
        except Exception as e:
            logger.error(f"Failed to propagate mode change: {e}")
            raise
    
    async def _update_exchange_api_mode(self):
        """Update exchange API service mode"""
        try:
            if hasattr(self.exchange_api_service, 'set_live_mode'):
                live_mode = (self.current_mode == TradingMode.LIVE)
                await self.exchange_api_service.set_live_mode(live_mode)
                
                # Update safety checks
                if hasattr(self.exchange_api_service, 'set_safety_checks'):
                    await self.exchange_api_service.set_safety_checks(self.mode_config.safety_checks)
            
            await self._update_component_status('exchange_api_service', 'synced')
            
        except Exception as e:
            await self._update_component_status('exchange_api_service', 'error', str(e))
            raise
    
    async def _update_portfolio_tracker_mode(self):
        """Update portfolio tracker mode"""
        try:
            if hasattr(self.portfolio_tracker, 'set_trading_mode'):
                await self.portfolio_tracker.set_trading_mode(self.current_mode)
            
            # Update data source
            if hasattr(self.portfolio_tracker, 'set_live_data'):
                await self.portfolio_tracker.set_live_data(self.mode_config.live_data)
            
            await self._update_component_status('portfolio_tracker', 'synced')
            
        except Exception as e:
            await self._update_component_status('portfolio_tracker', 'error', str(e))
            raise
    
    async def _update_risk_manager_mode(self):
        """Update risk manager mode"""
        try:
            if hasattr(self.risk_manager, 'set_risk_limits'):
                await self.risk_manager.set_risk_limits(self.mode_config.risk_limits)
            
            if hasattr(self.risk_manager, 'set_position_limits'):
                await self.risk_manager.set_position_limits(self.mode_config.position_limits)
            
            await self._update_component_status('risk_manager', 'synced')
            
        except Exception as e:
            await self._update_component_status('risk_manager', 'error', str(e))
            raise
    
    async def _update_agent_coordinator_mode(self):
        """Update agent coordinator mode"""
        try:
            if hasattr(self.agent_coordinator, 'set_trading_mode'):
                await self.agent_coordinator.set_trading_mode(self.current_mode)
            
            # Update all registered agents
            if hasattr(self.agent_coordinator, 'broadcast_mode_change'):
                await self.agent_coordinator.broadcast_mode_change(
                    self.current_mode, 
                    self.mode_config
                )
            
            await self._update_component_status('agent_coordinator', 'synced')
            
        except Exception as e:
            await self._update_component_status('agent_coordinator', 'error', str(e))
            raise
    
    async def _call_component_callback(self, component_id: str, callback: Callable):
        """Call component callback with mode change information"""
        try:
            await self._update_component_status(component_id, 'updating')
            
            # Call callback with mode information
            if asyncio.iscoroutinefunction(callback):
                await callback(self.current_mode, self.mode_config)
            else:
                callback(self.current_mode, self.mode_config)
            
            await self._update_component_status(component_id, 'synced')
            
        except Exception as e:
            await self._update_component_status(component_id, 'error', str(e))
            raise
    
    async def _update_component_status(self, component_id: str, status: str, error_message: str = None):
        """Update component status"""
        if component_id in self.registered_components:
            component = self.registered_components[component_id]
            component.current_mode = self.current_mode
            component.last_updated = datetime.now(timezone.utc)
            component.status = status
            component.error_message = error_message
    
    # ==================== VALIDATION & SAFETY ====================
    
    async def _validate_mode_change(self, mode: TradingMode) -> bool:
        """Validate that mode change is safe"""
        try:
            # Check if live mode requirements are met
            if mode == TradingMode.LIVE:
                # Verify exchange connections
                if self.exchange_api_service:
                    if not await self._verify_exchange_connections():
                        logger.error("Cannot switch to live mode: Exchange connections not ready")
                        return False
                
                # Verify risk management is active
                if self.risk_manager:
                    if not await self._verify_risk_management():
                        logger.error("Cannot switch to live mode: Risk management not active")
                        return False
                
                # Check for sufficient funds (if applicable)
                if not await self._verify_sufficient_funds():
                    logger.warning("Switching to live mode with limited funds")
            
            return True
            
        except Exception as e:
            logger.error(f"Mode validation failed: {e}")
            return False
    
    async def _verify_exchange_connections(self) -> bool:
        """Verify exchange connections are healthy"""
        try:
            if hasattr(self.exchange_api_service, 'test_connections'):
                return await self.exchange_api_service.test_connections()
            return True
            
        except Exception as e:
            logger.error(f"Exchange connection verification failed: {e}")
            return False
    
    async def _verify_risk_management(self) -> bool:
        """Verify risk management is active"""
        try:
            if hasattr(self.risk_manager, 'is_active'):
                return await self.risk_manager.is_active()
            return True
            
        except Exception as e:
            logger.error(f"Risk management verification failed: {e}")
            return False
    
    async def _verify_sufficient_funds(self) -> bool:
        """Verify sufficient funds for live trading"""
        try:
            if self.portfolio_tracker:
                if hasattr(self.portfolio_tracker, 'get_total_balance'):
                    balance = await self.portfolio_tracker.get_total_balance()
                    return balance > 0
            return True
            
        except Exception as e:
            logger.error(f"Fund verification failed: {e}")
            return True  # Don't block on fund checks
    
    # ==================== CORE COMPONENTS REGISTRATION ====================
    
    async def _register_core_components(self):
        """Register core system components"""
        core_components = [
            ('exchange_api_service', ComponentType.TRADING_INTERFACE),
            ('portfolio_tracker', ComponentType.PORTFOLIO_TRACKER),
            ('risk_manager', ComponentType.RISK_MANAGER),
            ('agent_coordinator', ComponentType.AGENT),
            ('market_data_service', ComponentType.MARKET_DATA),
            ('order_manager', ComponentType.ORDER_MANAGER)
        ]
        
        for component_id, component_type in core_components:
            await self.register_component(component_id, component_type)
    
    # ==================== CONFIGURATION PERSISTENCE ====================
    
    def _get_default_config(self) -> TradingModeConfig:
        """Get default trading mode configuration"""
        return TradingModeConfig(
            mode=TradingMode.PAPER,
            enabled_exchanges=['binance', 'coinbase'],
            risk_limits={
                'max_position_size': 0.1,
                'max_daily_loss': 0.05,
                'max_portfolio_risk': 0.15
            },
            position_limits={
                'max_single_position': 0.05,
                'max_sector_allocation': 0.3,
                'max_leverage': 1.0
            },
            safety_checks=True,
            real_funds=False,
            live_data=False,
            notifications=True,
            audit_logging=True,
            paper_balance=100000.0
        )
    
    async def _load_mode_configuration(self):
        """Load trading mode configuration from storage"""
        try:
            # Try to load from autonomous state persistence
            if hasattr(self, 'autonomous_state_service'):
                saved_config = await self.autonomous_state_service.restore_agent_state(
                    'system', 'trading_mode_config'
                )
                
                if saved_config:
                    self.current_mode = TradingMode(saved_config.get('mode', 'paper'))
                    # Restore full config if available
                    if 'config' in saved_config:
                        config_data = saved_config['config']
                        self.mode_config = TradingModeConfig(**config_data)
            
        except Exception as e:
            logger.warning(f"Could not load mode configuration: {e}")
            # Use defaults
            self.current_mode = TradingMode.PAPER
            self.mode_config = self._get_default_config()
    
    async def _save_mode_configuration(self):
        """Save trading mode configuration to storage"""
        try:
            config_data = {
                'mode': self.current_mode.value,
                'config': asdict(self.mode_config),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            
            # Save to autonomous state persistence
            if hasattr(self, 'autonomous_state_service'):
                await self.autonomous_state_service.save_agent_state(
                    'system', 'trading_mode_config', config_data
                )
            
        except Exception as e:
            logger.warning(f"Could not save mode configuration: {e}")
    
    # ==================== MONITORING & STATUS ====================
    
    async def _mode_monitoring_loop(self):
        """Background loop to monitor component mode synchronization"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Check component synchronization
                await self._check_component_sync()
                
                # Clean up old history
                await self._cleanup_mode_history()
                
            except Exception as e:
                logger.error(f"Mode monitoring error: {e}")
    
    async def _check_component_sync(self):
        """Check if all components are synchronized with current mode"""
        try:
            out_of_sync = []
            
            for component_id, component in self.registered_components.items():
                if component.current_mode != self.current_mode:
                    out_of_sync.append(component_id)
                elif component.status == 'error':
                    logger.warning(f"Component {component_id} has error status: {component.error_message}")
            
            if out_of_sync:
                logger.warning(f"Components out of sync: {out_of_sync}")
                # Attempt resynchronization
                await self._propagate_mode_change()
            
        except Exception as e:
            logger.error(f"Component sync check failed: {e}")
    
    async def _cleanup_mode_history(self):
        """Clean up old mode history entries"""
        try:
            # Keep only last 100 entries
            if len(self.mode_history) > 100:
                self.mode_history = self.mode_history[-100:]
                
        except Exception as e:
            logger.error(f"History cleanup failed: {e}")
    
    async def get_mode_status(self) -> Dict[str, Any]:
        """Get comprehensive mode status"""
        try:
            component_status = {}
            for component_id, component in self.registered_components.items():
                component_status[component_id] = {
                    'type': component.component_type.value,
                    'current_mode': component.current_mode.value,
                    'status': component.status,
                    'last_updated': component.last_updated.isoformat(),
                    'error_message': component.error_message
                }
            
            return {
                'service': 'universal_trading_mode',
                'current_mode': self.current_mode.value,
                'config': asdict(self.mode_config),
                'components': component_status,
                'total_components': len(self.registered_components),
                'synced_components': len([c for c in self.registered_components.values() if c.status == 'synced']),
                'error_components': len([c for c in self.registered_components.values() if c.status == 'error']),
                'mode_changes_today': len([h for h in self.mode_history if 
                    datetime.fromisoformat(h['timestamp']).date() == datetime.now().date()]),
                'last_mode_change': self.mode_history[-1]['timestamp'] if self.mode_history else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get mode status: {e}")
            return {'error': str(e)}
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "service": "universal_trading_mode_service",
            "initialized": self.is_initialized,
            "current_mode": self.current_mode.value,
            "total_components": len(self.registered_components),
            "synced_components": len([c for c in self.registered_components.values() if c.status == 'synced']),
            "mode_history_count": len(self.mode_history),
            "safety_checks_enabled": self.mode_config.safety_checks,
            "live_data_enabled": self.mode_config.live_data,
            "real_funds_enabled": self.mode_config.real_funds
        }

# Factory function for service registry
def create_universal_trading_mode_service():
    """Factory function to create universal trading mode service"""
    return UniversalTradingModeService()