"""
Service Initialization Module
Handles the initialization of all platform services with proper dependency injection
"""

import logging
from typing import Dict, Any, List
import asyncio

from .service_registry import registry
from .database_manager import db_manager

# Import factory functions for new services
from services.historical_data_service import create_historical_data_service
from services.trading_engine_service import create_trading_engine_service
from services.order_management_service import create_order_management_service
from services.portfolio_tracker_service import create_portfolio_tracker_service
from services.ai_prediction_service import create_ai_prediction_service
from services.technical_analysis_service import create_technical_analysis_service
from services.sentiment_analysis_service import create_sentiment_analysis_service
from services.ml_portfolio_optimizer_service import create_ml_portfolio_optimizer_service

# Import new autonomous services
try:
    from services.apscheduler_agent_service import create_apscheduler_agent_service
except ImportError:
    create_apscheduler_agent_service = None

try:
    from services.universal_trading_mode_service import create_universal_trading_mode_service
except ImportError:
    create_universal_trading_mode_service = None

try:
    from services.blockchain_provider_service import create_blockchain_provider_service
except ImportError:
    create_blockchain_provider_service = None

try:
    from services.enhanced_agent_wallet_service import create_enhanced_agent_wallet_service
except ImportError:
    create_enhanced_agent_wallet_service = None

try:
    from services.autonomous_state_persistence import create_autonomous_state_persistence
except ImportError:
    create_autonomous_state_persistence = None

try:
    from services.autonomous_health_monitor import create_autonomous_health_monitor
except ImportError:
    create_autonomous_health_monitor = None

# Import existing services (keeping imports for services that exist)
try:
    from services.market_data_service import MarketDataService
except ImportError:
    MarketDataService = None
    
try:
    from services.risk_management_service import RiskManagementService
except ImportError:
    RiskManagementService = None
    
try:
    from services.agent_management_service import AgentManagementService
except ImportError:
    AgentManagementService = None
    
try:
    from services.execution_specialist_service import ExecutionSpecialistService
except ImportError:
    ExecutionSpecialistService = None
    
try:
    from services.hyperliquid_execution_service import HyperliquidExecutionService
except ImportError:
    HyperliquidExecutionService = None
    
try:
    from services.strategy_config_service import StrategyConfigService
except ImportError:
    StrategyConfigService = None
    
try:
    from services.watchlist_service import WatchlistService
except ImportError:
    WatchlistService = None
    
try:
    from services.user_preference_service import UserPreferenceService
except ImportError:
    UserPreferenceService = None

# Import agent frameworks (optional)
try:
    from agents.crew_setup import trading_analysis_crew
except ImportError:
    trading_analysis_crew = None
    
try:
    from agents.autogen_setup import autogen_trading_system
except ImportError:
    autogen_trading_system = None

logger = logging.getLogger(__name__)

class ServiceInitializer:
    """
    Handles the initialization of all platform services
    Manages service dependencies and startup order
    """
    
    def __init__(self):
        self.initialization_order = [
            # Phase 1: Core Infrastructure Services
            "market_data",
            "historical_data",
            
            # Phase 2: Trading Engine Services (dependent on core infrastructure)
            "portfolio_tracker",
            "trading_engine", 
            "order_management",
            "risk_management",
            
            # Phase 3: AI and Analytics Services (independent)
            "ai_prediction",
            "technical_analysis",
            "sentiment_analysis",
            "ml_portfolio_optimizer",
            
            # Phase 4: Agent and Execution Services (dependent on trading engine)
            "execution_specialist",
            "hyperliquid_execution",
            "agent_management",
            
            # Phase 5: Business Logic Services
            "strategy_config",
            "watchlist",
            "user_preference",
            
            # Phase 6: Agent Frameworks
            "crew_trading_analysis",
            "autogen_trading_system",
            
            # Phase 7: Orchestration Services
            "farm_agent_orchestrator",
            "goal_capital_manager",
            "performance_attribution_engine",
            "enhanced_event_propagation",
            "orchestration_scheduler",
            "orchestration_recovery",
            
            # Phase 8: Autonomous Services (new)
            "autonomous_state_persistence",
            "blockchain_provider_service", 
            "enhanced_agent_wallet_service",
            "universal_trading_mode_service",
            "apscheduler_agent_service",
            "autonomous_health_monitor"
        ]
    
    async def initialize_all_services(self) -> Dict[str, str]:
        """Initialize all services in the correct order"""
        logger.info("🔧 Starting service initialization...")
        
        # Ensure database connections are ready
        if not db_manager.is_initialized():
            await db_manager.initialize_connections()
        
        results = {}
        
        for service_name in self.initialization_order:
            try:
                result = await self._initialize_service(service_name)
                results[service_name] = result
                logger.info(f"✅ {service_name} initialized successfully")
            except Exception as e:
                results[service_name] = f"failed: {str(e)}"
                logger.error(f"❌ Failed to initialize {service_name}: {e}")
                
                # Check if this is a critical service
                if service_name in ["market_data", "trading_engine", "portfolio_tracker"]:
                    logger.error(f"Critical service {service_name} failed - stopping initialization")
                    break
        
        # Register all connections in the registry
        self._register_connections()
        
        registry.mark_initialized()
        logger.info("✅ Service initialization completed")
        
        return results
    
    async def _initialize_service(self, service_name: str) -> str:
        """Initialize a single service"""
        
        if service_name == "market_data":
            if MarketDataService:
                service = MarketDataService(redis_client=db_manager.get_redis_client())
                registry.register_service("market_data", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "historical_data":
            service = create_historical_data_service()
            registry.register_service("historical_data", service)
            return "initialized"
        
        elif service_name == "portfolio_tracker":
            service = create_portfolio_tracker_service()
            registry.register_service("portfolio_tracker", service)
            return "initialized"
        
        elif service_name == "trading_engine":
            service = create_trading_engine_service()
            registry.register_service("trading_engine", service)
            return "initialized"
        
        elif service_name == "order_management":
            service = create_order_management_service()
            registry.register_service("order_management", service)
            return "initialized"
        
        elif service_name == "risk_management":
            if RiskManagementService:
                service = RiskManagementService(
                    portfolio_service=registry.get_service("portfolio_tracker")
                )
                registry.register_service("risk_management", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "ai_prediction":
            service = create_ai_prediction_service()
            registry.register_service("ai_prediction", service)
            return "initialized"
        
        elif service_name == "technical_analysis":
            service = create_technical_analysis_service()
            registry.register_service("technical_analysis", service)
            return "initialized"
        
        elif service_name == "sentiment_analysis":
            service = create_sentiment_analysis_service()
            registry.register_service("sentiment_analysis", service)
            return "initialized"
        
        elif service_name == "ml_portfolio_optimizer":
            service = create_ml_portfolio_optimizer_service()
            registry.register_service("ml_portfolio_optimizer", service)
            return "initialized"
        
        elif service_name == "execution_specialist":
            if ExecutionSpecialistService:
                service = ExecutionSpecialistService()
                registry.register_service("execution_specialist", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "hyperliquid_execution":
            if HyperliquidExecutionService:
                service = HyperliquidExecutionService()
                registry.register_service("hyperliquid_execution", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "agent_management":
            if AgentManagementService:
                service = AgentManagementService(session_factory=db_manager.get_session_factory())
                # Load existing agent statuses from database
                try:
                    await service.load_all_agent_statuses_from_db()
                except Exception as e:
                    logger.warning(f"Could not load agent statuses: {e}")
                registry.register_service("agent_management", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "strategy_config":
            if StrategyConfigService:
                service = StrategyConfigService(session_factory=db_manager.get_session_factory())
                registry.register_service("strategy_config", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "watchlist":
            if WatchlistService:
                service = WatchlistService(supabase_client=db_manager.get_supabase_client())
                registry.register_service("watchlist", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "user_preference":
            if UserPreferenceService:
                service = UserPreferenceService(supabase_client=db_manager.get_supabase_client())
                registry.register_service("user_preference", service)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "crew_trading_analysis":
            if trading_analysis_crew:
                # Initialize CrewAI framework
                registry.register_service("crew_trading_analysis", trading_analysis_crew)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "autogen_trading_system":
            if autogen_trading_system:
                # Initialize AutoGen framework
                registry.register_service("autogen_trading_system", autogen_trading_system)
                return "initialized"
            else:
                return "skipped - service not available"
        
        elif service_name == "realtime_price_aggregator":
            try:
                from services.realtime_price_aggregator import create_realtime_price_aggregator
                service = create_realtime_price_aggregator()
                registry.register_service("realtime_price_aggregator", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Real-time price aggregator dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "universal_dex_aggregator":
            try:
                from services.universal_dex_aggregator import create_universal_dex_aggregator
                service = create_universal_dex_aggregator()
                registry.register_service("universal_dex_aggregator", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Universal DEX aggregator dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "cross_chain_bridge":
            try:
                from services.cross_chain_bridge_service import create_cross_chain_bridge_service
                service = create_cross_chain_bridge_service()
                registry.register_service("cross_chain_bridge", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Cross-chain bridge dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "alchemy_integration":
            try:
                from services.alchemy_integration import create_alchemy_integration
                service = create_alchemy_integration()
                registry.register_service("alchemy_integration", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Alchemy integration dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "autonomous_agent_funding":
            try:
                from services.autonomous_agent_funding import create_autonomous_agent_funding
                service = create_autonomous_agent_funding()
                registry.register_service("autonomous_agent_funding", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Autonomous agent funding dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "cross_dex_arbitrage_engine":
            try:
                from services.cross_dex_arbitrage_engine import create_cross_dex_arbitrage_engine
                service = create_cross_dex_arbitrage_engine()
                registry.register_service("cross_dex_arbitrage_engine", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Cross-DEX arbitrage engine dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        # Orchestration Services
        elif service_name == "farm_agent_orchestrator":
            try:
                from services.farm_agent_orchestrator import get_farm_agent_orchestrator
                service = await get_farm_agent_orchestrator(registry)
                registry.register_service("farm_agent_orchestrator", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Farm agent orchestrator dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "goal_capital_manager":
            try:
                from services.goal_capital_manager import get_goal_capital_manager
                service = await get_goal_capital_manager(registry)
                registry.register_service("goal_capital_manager", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Goal capital manager dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        # Phase 8: Autonomous Services
        elif service_name == "autonomous_state_persistence":
            if create_autonomous_state_persistence:
                try:
                    service = create_autonomous_state_persistence()
                    await service.initialize()
                    registry.register_service("autonomous_state_persistence", service)
                    return "initialized"
                except Exception as e:
                    logger.warning(f"Autonomous state persistence initialization failed: {e}")
                    return "skipped - initialization failed"
            else:
                return "skipped - service not available"
        
        elif service_name == "blockchain_provider_service":
            if create_blockchain_provider_service:
                try:
                    service = create_blockchain_provider_service()
                    await service.initialize()
                    registry.register_service("blockchain_provider_service", service)
                    return "initialized"
                except Exception as e:
                    logger.warning(f"Blockchain provider service initialization failed: {e}")
                    return "skipped - initialization failed"
            else:
                return "skipped - service not available"
        
        elif service_name == "enhanced_agent_wallet_service":
            if create_enhanced_agent_wallet_service:
                try:
                    service = create_enhanced_agent_wallet_service()
                    await service.initialize()
                    registry.register_service("enhanced_agent_wallet_service", service)
                    return "initialized"
                except Exception as e:
                    logger.warning(f"Enhanced agent wallet service initialization failed: {e}")
                    return "skipped - initialization failed"
            else:
                return "skipped - service not available"
        
        elif service_name == "universal_trading_mode_service":
            if create_universal_trading_mode_service:
                try:
                    service = create_universal_trading_mode_service()
                    await service.initialize()
                    registry.register_service("universal_trading_mode_service", service)
                    return "initialized"
                except Exception as e:
                    logger.warning(f"Universal trading mode service initialization failed: {e}")
                    return "skipped - initialization failed"
            else:
                return "skipped - service not available"
        
        elif service_name == "apscheduler_agent_service":
            if create_apscheduler_agent_service:
                try:
                    service = create_apscheduler_agent_service()
                    await service.initialize()
                    registry.register_service("apscheduler_agent_service", service)
                    return "initialized"
                except Exception as e:
                    logger.warning(f"APScheduler agent service initialization failed: {e}")
                    return "skipped - initialization failed"
            else:
                return "skipped - service not available"
        
        elif service_name == "autonomous_health_monitor":
            if create_autonomous_health_monitor:
                try:
                    service = create_autonomous_health_monitor()
                    await service.initialize()
                    registry.register_service("autonomous_health_monitor", service)
                    # Start the 24/7 monitoring
                    await service.start_monitoring()
                    return "initialized"
                except Exception as e:
                    logger.warning(f"Autonomous health monitor initialization failed: {e}")
                    return "skipped - initialization failed"
            else:
                return "skipped - service not available"
        
        elif service_name == "performance_attribution_engine":
            try:
                from services.performance_attribution_engine import get_performance_attribution_engine
                service = await get_performance_attribution_engine(registry)
                registry.register_service("performance_attribution_engine", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Performance attribution engine dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "enhanced_event_propagation":
            try:
                from services.enhanced_event_propagation import get_enhanced_event_propagation
                service = await get_enhanced_event_propagation(registry)
                registry.register_service("enhanced_event_propagation", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Enhanced event propagation dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "orchestration_scheduler":
            try:
                from services.orchestration_scheduler import get_orchestration_scheduler
                service = await get_orchestration_scheduler(registry)
                # Start the scheduler
                await service.start()
                registry.register_service("orchestration_scheduler", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Orchestration scheduler dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        elif service_name == "orchestration_recovery":
            try:
                from services.orchestration_recovery import get_orchestration_recovery
                service = await get_orchestration_recovery(registry)
                registry.register_service("orchestration_recovery", service)
                return "initialized"
            except ImportError as e:
                logger.warning(f"Orchestration recovery dependencies not available: {e}")
                return "skipped - dependencies not available"
        
        else:
            raise ValueError(f"Unknown service: {service_name}")
    
    def _register_connections(self):
        """Register all database connections in the service registry"""
        registry.register_connection("supabase", db_manager.get_supabase_client())
        registry.register_connection("redis", db_manager.get_redis_client())
        registry.register_connection("async_redis", db_manager.get_async_redis_client())
        registry.register_connection("database_engine", db_manager.get_database_engine())
        registry.register_connection("session_factory", db_manager.get_session_factory())
    
    async def get_service_dependencies(self, service_name: str) -> List[str]:
        """Get the dependencies for a service"""
        dependencies = {
            "market_data": [],
            "historical_data": [],
            "portfolio_tracker": ["market_data"],
            "trading_engine": ["market_data"],
            "order_management": [],
            "risk_management": ["portfolio_tracker"],
            "ai_prediction": [],
            "technical_analysis": [],
            "sentiment_analysis": [],
            "ml_portfolio_optimizer": [],
            "execution_specialist": [],
            "hyperliquid_execution": [],
            "agent_management": [],
            "strategy_config": [],
            "watchlist": [],
            "user_preference": [],
            "crew_trading_analysis": [],
            "autogen_trading_system": []
        }
        
        return dependencies.get(service_name, [])
    
    async def health_check_all_services(self) -> Dict[str, Any]:
        """Perform health check on all initialized services"""
        return await registry.health_check()

# Global service initializer
service_initializer = ServiceInitializer()

def get_service_initializer() -> ServiceInitializer:
    """Get the global service initializer"""
    return service_initializer