"""
Real-Time Trading Loop Service
Continuous market monitoring and autonomous trading execution
"""
import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Set
from loguru import logger
from pydantic import BaseModel, Field
from enum import Enum
import uuid

# Core service imports
from .agent_coordination_service import AgentCoordinationService, FrameworkType
from .trading_coordinator import TradingCoordinator
from .market_data_service import MarketDataService
from .risk_manager_service import RiskManagerService
from .agent_performance_service import AgentPerformanceService
from .advanced_risk_management import AdvancedRiskManagement
from .multi_exchange_integration import MultiExchangeIntegration

# Model imports
from ..models.trading_history_models import TradeSide, OrderType
from ..models.agent_models import AgentStatus
from ..core.websocket_manager import connection_manager as global_connection_manager
from ..models.websocket_models import WebSocketEnvelope

class TradingLoopStatus(str, Enum):
    """Trading loop status states"""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    STOPPING = "stopping"

class MarketCondition(str, Enum):
    """Market condition classifications"""
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    VOLATILE = "volatile"
    UNKNOWN = "unknown"

class TradingSignal(BaseModel):
    """Enhanced trading signal with execution metadata"""
    signal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    symbol: str
    action: str  # buy, sell, hold
    quantity: float
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    confidence: float = Field(ge=0.0, le=1.0)
    strategy: str
    timeframe: str = "1m"
    priority: int = Field(default=5, ge=1, le=10)  # 1=highest, 10=lowest
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

class MarketScanResult(BaseModel):
    """Market scanning results"""
    scan_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbols_analyzed: List[str]
    opportunities_found: int
    signals_generated: List[TradingSignal]
    market_condition: MarketCondition
    scan_duration_ms: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TradingLoopMetrics(BaseModel):
    """Trading loop performance metrics"""
    loop_count: int = 0
    signals_generated: int = 0
    trades_executed: int = 0
    successful_trades: int = 0
    failed_trades: int = 0
    total_pnl: float = 0.0
    win_rate: float = 0.0
    avg_execution_time_ms: float = 0.0
    last_scan_duration_ms: float = 0.0
    uptime_seconds: float = 0.0
    errors_encountered: int = 0

class RealTimeTradingLoop:
    """
    Real-time trading loop that continuously:
    1. Scans markets for opportunities
    2. Coordinates multi-agent analysis
    3. Executes trades with risk management
    4. Monitors performance and adapts
    """
    
    def __init__(
        self,
        agent_coordination_service: AgentCoordinationService,
        trading_coordinator: TradingCoordinator,
        market_data_service: MarketDataService,
        risk_manager: RiskManagerService,
        performance_service: AgentPerformanceService,
        advanced_risk_management: AdvancedRiskManagement,
        multi_exchange_integration: MultiExchangeIntegration,
        connection_manager: Optional[Any] = None
    ):
        self.agent_coordination = agent_coordination_service
        self.trading_coordinator = trading_coordinator
        self.market_data = market_data_service
        self.risk_manager = risk_manager
        self.performance_service = performance_service
        self.advanced_risk = advanced_risk_management
        self.multi_exchange = multi_exchange_integration
        self.connection_manager = connection_manager or global_connection_manager
        
        # Trading loop state
        self.status = TradingLoopStatus.STOPPED
        self.loop_task: Optional[asyncio.Task] = None
        self.start_time: Optional[datetime] = None
        self.metrics = TradingLoopMetrics()
        
        # Configuration
        self.scan_interval_seconds = 5.0  # Scan every 5 seconds
        self.max_concurrent_signals = 20
        self.signal_expiry_minutes = 15
        self.enabled_symbols = [
            "BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", 
            "MATIC/USD", "DOT/USD", "LINK/USD", "UNI/USD"
        ]
        self.enabled_exchanges = ["binance", "coinbase", "hyperliquid"]
        
        # Active tracking
        self.active_signals: Dict[str, TradingSignal] = {}
        self.pending_executions: Set[str] = set()
        self.recent_scans: List[MarketScanResult] = []
        self.max_recent_scans = 100
        
        # Performance tracking
        self.execution_times: List[float] = []
        self.max_execution_history = 1000
        
        logger.info("RealTimeTradingLoop initialized")
    
    async def start_trading_loop(self) -> Dict[str, Any]:
        """Start the real-time trading loop"""
        
        if self.status in [TradingLoopStatus.RUNNING, TradingLoopStatus.STARTING]:
            return {
                "success": False,
                "message": f"Trading loop is already {self.status.value}",
                "status": self.status.value
            }
        
        logger.info("Starting real-time trading loop")
        self.status = TradingLoopStatus.STARTING
        self.start_time = datetime.now(timezone.utc)
        self.metrics = TradingLoopMetrics()  # Reset metrics
        
        try:
            # Validate dependencies
            await self._validate_dependencies()
            
            # Start the main trading loop
            self.loop_task = asyncio.create_task(self._main_trading_loop())
            self.status = TradingLoopStatus.RUNNING
            
            # Broadcast status update
            await self._broadcast_status_update()
            
            logger.info("Real-time trading loop started successfully")
            return {
                "success": True,
                "message": "Trading loop started",
                "status": self.status.value,
                "start_time": self.start_time.isoformat(),
                "config": {
                    "scan_interval_seconds": self.scan_interval_seconds,
                    "enabled_symbols": self.enabled_symbols,
                    "enabled_exchanges": self.enabled_exchanges,
                    "max_concurrent_signals": self.max_concurrent_signals
                }
            }
            
        except Exception as e:
            self.status = TradingLoopStatus.ERROR
            logger.error(f"Failed to start trading loop: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"Failed to start trading loop: {str(e)}",
                "status": self.status.value
            }
    
    async def stop_trading_loop(self) -> Dict[str, Any]:
        """Stop the real-time trading loop"""
        
        if self.status == TradingLoopStatus.STOPPED:
            return {
                "success": True,
                "message": "Trading loop is already stopped",
                "status": self.status.value
            }
        
        logger.info("Stopping real-time trading loop")
        self.status = TradingLoopStatus.STOPPING
        
        try:
            # Cancel main loop task
            if self.loop_task and not self.loop_task.done():
                self.loop_task.cancel()
                try:
                    await self.loop_task
                except asyncio.CancelledError:
                    pass
            
            # Cancel any pending signal executions
            for signal_id in self.pending_executions.copy():
                logger.info(f"Cancelling pending execution for signal {signal_id}")
            
            self.status = TradingLoopStatus.STOPPED
            end_time = datetime.now(timezone.utc)
            
            if self.start_time:
                self.metrics.uptime_seconds = (end_time - self.start_time).total_seconds()
            
            # Broadcast final status
            await self._broadcast_status_update()
            
            logger.info(f"Trading loop stopped. Final metrics: {self.metrics}")
            return {
                "success": True,
                "message": "Trading loop stopped",
                "status": self.status.value,
                "final_metrics": self.metrics.model_dump()
            }
            
        except Exception as e:
            self.status = TradingLoopStatus.ERROR
            logger.error(f"Error stopping trading loop: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"Error stopping trading loop: {str(e)}",
                "status": self.status.value
            }
    
    async def pause_trading_loop(self) -> Dict[str, Any]:
        """Pause the trading loop (stop scanning but keep monitoring)"""
        
        if self.status != TradingLoopStatus.RUNNING:
            return {
                "success": False,
                "message": f"Cannot pause trading loop in {self.status.value} status",
                "status": self.status.value
            }
        
        self.status = TradingLoopStatus.PAUSED
        await self._broadcast_status_update()
        
        logger.info("Trading loop paused")
        return {
            "success": True,
            "message": "Trading loop paused",
            "status": self.status.value
        }
    
    async def resume_trading_loop(self) -> Dict[str, Any]:
        """Resume the trading loop from paused state"""
        
        if self.status != TradingLoopStatus.PAUSED:
            return {
                "success": False,
                "message": f"Cannot resume trading loop from {self.status.value} status",
                "status": self.status.value
            }
        
        self.status = TradingLoopStatus.RUNNING
        await self._broadcast_status_update()
        
        logger.info("Trading loop resumed")
        return {
            "success": True,
            "message": "Trading loop resumed",
            "status": self.status.value
        }
    
    async def _main_trading_loop(self):
        """Main trading loop execution"""
        
        logger.info("Main trading loop started")
        
        try:
            while self.status in [TradingLoopStatus.RUNNING, TradingLoopStatus.PAUSED]:
                loop_start = datetime.now(timezone.utc)
                
                try:
                    if self.status == TradingLoopStatus.RUNNING:
                        # Perform one complete trading cycle
                        await self._execute_trading_cycle()
                    
                    # Clean up expired signals and update metrics
                    await self._cleanup_expired_signals()
                    await self._update_metrics()
                    
                    # Broadcast periodic status updates
                    if self.metrics.loop_count % 12 == 0:  # Every minute at 5s intervals
                        await self._broadcast_status_update()
                    
                    self.metrics.loop_count += 1
                    
                    # Calculate sleep time to maintain consistent interval
                    loop_duration = (datetime.now(timezone.utc) - loop_start).total_seconds()
                    sleep_time = max(0, self.scan_interval_seconds - loop_duration)
                    
                    if sleep_time > 0:
                        await asyncio.sleep(sleep_time)
                    
                except Exception as e:
                    self.metrics.errors_encountered += 1
                    logger.error(f"Error in trading loop cycle: {e}", exc_info=True)
                    
                    # Brief pause before retry
                    await asyncio.sleep(1.0)
                    
        except asyncio.CancelledError:
            logger.info("Trading loop cancelled")
            raise
        except Exception as e:
            logger.error(f"Fatal error in trading loop: {e}", exc_info=True)
            self.status = TradingLoopStatus.ERROR
            await self._broadcast_status_update()
    
    async def _execute_trading_cycle(self):
        """Execute one complete trading cycle"""
        
        cycle_start = datetime.now(timezone.utc)
        
        try:
            # 1. Scan markets for opportunities
            scan_result = await self._scan_markets()
            
            # 2. Process new signals
            if scan_result.signals_generated:
                await self._process_new_signals(scan_result.signals_generated)
            
            # 3. Execute pending trades
            await self._execute_pending_trades()
            
            # 4. Monitor and update existing positions
            await self._monitor_positions()
            
            # Track execution time
            cycle_duration = (datetime.now(timezone.utc) - cycle_start).total_seconds() * 1000
            self.execution_times.append(cycle_duration)
            
            # Keep execution history manageable
            if len(self.execution_times) > self.max_execution_history:
                self.execution_times = self.execution_times[-self.max_execution_history:]
            
            # Update metrics
            if self.execution_times:
                self.metrics.avg_execution_time_ms = sum(self.execution_times) / len(self.execution_times)
            
        except Exception as e:
            logger.error(f"Error in trading cycle: {e}", exc_info=True)
            raise
    
    async def _scan_markets(self) -> MarketScanResult:
        """Scan markets for trading opportunities"""
        
        scan_start = datetime.now(timezone.utc)
        signals_generated = []
        
        try:
            # Get current market data for all symbols
            market_data = {}
            for symbol in self.enabled_symbols:
                try:
                    data = await self.market_data.get_real_time_data(symbol)
                    if data:
                        market_data[symbol] = data
                except Exception as e:
                    logger.warning(f"Failed to get market data for {symbol}: {e}")
            
            # Determine overall market condition
            market_condition = await self._analyze_market_condition(market_data)
            
            # Generate signals for each symbol
            for symbol, data in market_data.items():
                try:
                    # Run multi-agent consensus analysis
                    consensus_task = await self.agent_coordination.run_consensus_analysis(
                        symbol=symbol,
                        context={
                            "market_data": data,
                            "market_condition": market_condition.value,
                            "scan_timestamp": scan_start.isoformat()
                        }
                    )
                    
                    # Convert consensus to trading signal if consensus reached
                    if consensus_task.consensus_reached and consensus_task.final_recommendation:
                        signal = await self._consensus_to_signal(symbol, consensus_task)
                        if signal:
                            signals_generated.append(signal)
                            
                except Exception as e:
                    logger.warning(f"Failed to analyze {symbol}: {e}")
            
            # Calculate scan duration
            scan_duration = (datetime.now(timezone.utc) - scan_start).total_seconds() * 1000
            
            # Create scan result
            scan_result = MarketScanResult(
                symbols_analyzed=list(market_data.keys()),
                opportunities_found=len(signals_generated),
                signals_generated=signals_generated,
                market_condition=market_condition,
                scan_duration_ms=scan_duration
            )
            
            # Store scan result
            self.recent_scans.append(scan_result)
            if len(self.recent_scans) > self.max_recent_scans:
                self.recent_scans = self.recent_scans[-self.max_recent_scans:]
            
            self.metrics.last_scan_duration_ms = scan_duration
            
            logger.info(f"Market scan completed: {len(signals_generated)} signals generated for {len(market_data)} symbols")
            return scan_result
            
        except Exception as e:
            logger.error(f"Error scanning markets: {e}", exc_info=True)
            return MarketScanResult(
                symbols_analyzed=[],
                opportunities_found=0,
                signals_generated=[],
                market_condition=MarketCondition.UNKNOWN,
                scan_duration_ms=(datetime.now(timezone.utc) - scan_start).total_seconds() * 1000
            )
    
    async def _analyze_market_condition(self, market_data: Dict[str, Any]) -> MarketCondition:
        """Analyze overall market condition"""
        
        if not market_data:
            return MarketCondition.UNKNOWN
        
        try:
            # Simple market condition analysis based on price movements
            bullish_count = 0
            bearish_count = 0
            volatile_count = 0
            
            for symbol, data in market_data.items():
                price_change_24h = data.get("price_change_24h", 0)
                volatility = data.get("volatility", 0)
                
                if abs(price_change_24h) > 5:  # High volatility threshold
                    volatile_count += 1
                elif price_change_24h > 2:  # Bullish threshold
                    bullish_count += 1
                elif price_change_24h < -2:  # Bearish threshold
                    bearish_count += 1
            
            total_symbols = len(market_data)
            
            # Determine condition based on ratios
            if volatile_count / total_symbols > 0.6:
                return MarketCondition.VOLATILE
            elif bullish_count / total_symbols > 0.6:
                return MarketCondition.BULL
            elif bearish_count / total_symbols > 0.6:
                return MarketCondition.BEAR
            else:
                return MarketCondition.SIDEWAYS
                
        except Exception as e:
            logger.warning(f"Error analyzing market condition: {e}")
            return MarketCondition.UNKNOWN
    
    async def _consensus_to_signal(self, symbol: str, consensus_task: Any) -> Optional[TradingSignal]:
        """Convert consensus result to trading signal"""
        
        try:
            recommendation = consensus_task.final_recommendation
            action = recommendation.get("action", "").upper()
            
            if action not in ["BUY", "SELL"]:
                return None
            
            # Create trading signal
            signal = TradingSignal(
                agent_id="consensus_coordinator",
                symbol=symbol,
                action=action.lower(),
                quantity=100.0,  # Default quantity - should be calculated based on risk
                confidence=recommendation.get("confidence", 0.5),
                strategy="multi_agent_consensus",
                priority=self._calculate_signal_priority(recommendation),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=self.signal_expiry_minutes),
                metadata={
                    "consensus_task_id": consensus_task.task_id,
                    "supporting_frameworks": recommendation.get("supporting_frameworks", 0),
                    "consensus_strength": recommendation.get("consensus_strength", 0.0),
                    "analysis_data": recommendation.get("analysis_data", {})
                }
            )
            
            return signal
            
        except Exception as e:
            logger.error(f"Error converting consensus to signal for {symbol}: {e}")
            return None
    
    def _calculate_signal_priority(self, recommendation: Dict[str, Any]) -> int:
        """Calculate signal priority based on recommendation strength"""
        
        try:
            confidence = recommendation.get("confidence", 0.5)
            consensus_strength = recommendation.get("consensus_strength", 0.5)
            
            # Higher confidence and consensus = higher priority (lower number)
            combined_strength = (confidence + consensus_strength) / 2
            
            if combined_strength >= 0.9:
                return 1  # Highest priority
            elif combined_strength >= 0.8:
                return 2
            elif combined_strength >= 0.7:
                return 3
            elif combined_strength >= 0.6:
                return 4
            else:
                return 5  # Medium priority
                
        except Exception:
            return 5  # Default priority
    
    async def _process_new_signals(self, signals: List[TradingSignal]):
        """Process and queue new trading signals"""
        
        for signal in signals:
            try:
                # Check if we have room for more signals
                if len(self.active_signals) >= self.max_concurrent_signals:
                    logger.warning(f"Max concurrent signals reached, skipping signal {signal.signal_id}")
                    continue
                
                # Risk validation
                is_safe = await self._validate_signal_risk(signal)
                if not is_safe:
                    logger.warning(f"Signal {signal.signal_id} failed risk validation")
                    continue
                
                # Add to active signals
                self.active_signals[signal.signal_id] = signal
                self.metrics.signals_generated += 1
                
                logger.info(f"New signal queued: {signal.symbol} {signal.action} confidence={signal.confidence:.2f}")
                
                # Broadcast signal to connected clients
                await self._broadcast_signal(signal)
                
            except Exception as e:
                logger.error(f"Error processing signal {signal.signal_id}: {e}")
    
    async def _execute_pending_trades(self):
        """Execute pending trades based on active signals"""
        
        # Sort signals by priority and confidence
        sorted_signals = sorted(
            self.active_signals.values(),
            key=lambda s: (s.priority, -s.confidence)
        )
        
        for signal in sorted_signals:
            if signal.signal_id in self.pending_executions:
                continue  # Already being processed
            
            try:
                # Mark as pending execution
                self.pending_executions.add(signal.signal_id)
                
                # Execute trade
                await self._execute_signal(signal)
                
            except Exception as e:
                logger.error(f"Error executing signal {signal.signal_id}: {e}")
            finally:
                # Remove from pending
                self.pending_executions.discard(signal.signal_id)
    
    async def _execute_signal(self, signal: TradingSignal):
        """Execute a specific trading signal"""
        
        try:
            logger.info(f"Executing signal: {signal.symbol} {signal.action} qty={signal.quantity}")
            
            # Prepare trade parameters
            trade_params = {
                "action": signal.action,
                "symbol": signal.symbol,
                "quantity": signal.quantity,
                "order_type": "market",  # Default to market orders for speed
                "strategy_name": signal.strategy,
                "confidence": signal.confidence,
                "signal_id": signal.signal_id
            }
            
            # Add limit price if specified
            if signal.price_target:
                trade_params["order_type"] = "limit"
                trade_params["price"] = signal.price_target
            
            # Execute through trading coordinator
            execution_result = await self.trading_coordinator._execute_trade_decision(
                trade_params, 
                signal.agent_id
            )
            
            # Update metrics
            self.metrics.trades_executed += 1
            
            if execution_result.get("status") in ["paper_executed", "live_executed", "hyperliquid"]:
                self.metrics.successful_trades += 1
                logger.info(f"Signal {signal.signal_id} executed successfully")
            else:
                self.metrics.failed_trades += 1
                logger.warning(f"Signal {signal.signal_id} execution failed: {execution_result}")
            
            # Remove from active signals
            self.active_signals.pop(signal.signal_id, None)
            
            # Record execution for performance tracking
            await self._record_signal_execution(signal, execution_result)
            
        except Exception as e:
            self.metrics.failed_trades += 1
            logger.error(f"Error executing signal {signal.signal_id}: {e}", exc_info=True)
    
    async def _monitor_positions(self):
        """Monitor existing positions and manage risk"""
        
        try:
            # Get current positions from risk manager
            positions = await self.risk_manager.get_current_positions()
            
            # Check each position for risk management
            for position in positions:
                await self._check_position_risk(position)
            
        except Exception as e:
            logger.error(f"Error monitoring positions: {e}")
    
    async def _check_position_risk(self, position: Dict[str, Any]):
        """Check individual position for risk management"""
        
        try:
            # Get current price
            symbol = position.get("symbol")
            current_price = await self.market_data.get_current_price(symbol)
            
            if not current_price:
                return
            
            # Calculate unrealized PnL
            entry_price = position.get("entry_price", 0)
            quantity = position.get("quantity", 0)
            side = position.get("side", "long")
            
            if side == "long":
                unrealized_pnl = (current_price - entry_price) * quantity
            else:
                unrealized_pnl = (entry_price - current_price) * quantity
            
            # Check stop loss
            stop_loss = position.get("stop_loss")
            if stop_loss and ((side == "long" and current_price <= stop_loss) or 
                            (side == "short" and current_price >= stop_loss)):
                await self._trigger_stop_loss(position)
            
            # Check take profit
            take_profit = position.get("take_profit")
            if take_profit and ((side == "long" and current_price >= take_profit) or 
                              (side == "short" and current_price <= take_profit)):
                await self._trigger_take_profit(position)
            
        except Exception as e:
            logger.error(f"Error checking position risk: {e}")
    
    async def _trigger_stop_loss(self, position: Dict[str, Any]):
        """Trigger stop loss for a position"""
        
        logger.warning(f"Triggering stop loss for position: {position.get('symbol')}")
        
        # Create exit signal
        exit_signal = TradingSignal(
            agent_id="risk_manager",
            symbol=position.get("symbol"),
            action="sell" if position.get("side") == "long" else "buy",
            quantity=abs(position.get("quantity", 0)),
            strategy="stop_loss",
            confidence=1.0,
            priority=1,  # Highest priority
            metadata={"position_id": position.get("id"), "exit_reason": "stop_loss"}
        )
        
        await self._execute_signal(exit_signal)
    
    async def _trigger_take_profit(self, position: Dict[str, Any]):
        """Trigger take profit for a position"""
        
        logger.info(f"Triggering take profit for position: {position.get('symbol')}")
        
        # Create exit signal
        exit_signal = TradingSignal(
            agent_id="profit_manager",
            symbol=position.get("symbol"),
            action="sell" if position.get("side") == "long" else "buy",
            quantity=abs(position.get("quantity", 0)),
            strategy="take_profit",
            confidence=1.0,
            priority=2,  # High priority
            metadata={"position_id": position.get("id"), "exit_reason": "take_profit"}
        )
        
        await self._execute_signal(exit_signal)
    
    async def _validate_signal_risk(self, signal: TradingSignal) -> bool:
        """Validate signal against risk parameters"""
        
        try:
            # Check with risk manager
            is_safe = await self.risk_manager.validate_trade_safety(
                agent_id=signal.agent_id,
                symbol=signal.symbol,
                quantity=signal.quantity,
                price=signal.price_target
            )
            
            if not is_safe[0]:  # Assuming tuple return (bool, reason)
                logger.warning(f"Signal risk validation failed: {is_safe[1]}")
                return False
            
            # Additional risk checks with advanced risk management
            risk_metrics = await self.advanced_risk._calculate_risk_metrics()
            if risk_metrics and risk_metrics.var_95 > 0.1:  # 10% VaR limit
                logger.warning("Portfolio VaR exceeds limit, rejecting signal")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating signal risk: {e}")
            return False
    
    async def _cleanup_expired_signals(self):
        """Clean up expired signals"""
        
        now = datetime.now(timezone.utc)
        expired_signals = []
        
        for signal_id, signal in self.active_signals.items():
            if signal.expires_at and now > signal.expires_at:
                expired_signals.append(signal_id)
        
        for signal_id in expired_signals:
            expired_signal = self.active_signals.pop(signal_id, None)
            if expired_signal:
                logger.info(f"Expired signal removed: {expired_signal.symbol}")
    
    async def _update_metrics(self):
        """Update trading loop metrics"""
        
        if self.start_time:
            self.metrics.uptime_seconds = (datetime.now(timezone.utc) - self.start_time).total_seconds()
        
        # Calculate win rate
        total_completed = self.metrics.successful_trades + self.metrics.failed_trades
        if total_completed > 0:
            self.metrics.win_rate = self.metrics.successful_trades / total_completed
    
    async def _record_signal_execution(self, signal: TradingSignal, execution_result: Dict[str, Any]):
        """Record signal execution for performance analysis"""
        
        try:
            # Record with performance service
            await self.performance_service.record_signal_performance(
                signal_id=signal.signal_id,
                agent_id=signal.agent_id,
                symbol=signal.symbol,
                strategy=signal.strategy,
                confidence=signal.confidence,
                execution_result=execution_result,
                execution_timestamp=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Error recording signal execution: {e}")
    
    async def _validate_dependencies(self):
        """Validate required service dependencies"""
        
        if not self.agent_coordination:
            raise Exception("AgentCoordinationService is required")
        
        if not self.trading_coordinator:
            raise Exception("TradingCoordinator is required")
        
        if not self.market_data:
            raise Exception("MarketDataService is required")
        
        if not self.risk_manager:
            raise Exception("RiskManagerService is required")
        
        logger.info("All dependencies validated")
    
    async def _broadcast_status_update(self):
        """Broadcast trading loop status to connected clients"""
        
        try:
            status_data = {
                "status": self.status.value,
                "metrics": self.metrics.model_dump(),
                "active_signals": len(self.active_signals),
                "pending_executions": len(self.pending_executions),
                "recent_scan_count": len(self.recent_scans),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Broadcast via WebSocket
            if self.connection_manager:
                envelope = WebSocketEnvelope(
                    event_type="TRADING_LOOP_STATUS",
                    agent_id="trading_loop",
                    payload=status_data
                )
                await self.connection_manager.broadcast(envelope)
            
        except Exception as e:
            logger.error(f"Error broadcasting status update: {e}")
    
    async def _broadcast_signal(self, signal: TradingSignal):
        """Broadcast new signal to connected clients"""
        
        try:
            if self.connection_manager:
                envelope = WebSocketEnvelope(
                    event_type="NEW_TRADING_SIGNAL",
                    agent_id=signal.agent_id,
                    payload=signal.model_dump()
                )
                await self.connection_manager.broadcast(envelope)
            
        except Exception as e:
            logger.error(f"Error broadcasting signal: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current trading loop status"""
        
        return {
            "status": self.status.value,
            "metrics": self.metrics.model_dump(),
            "configuration": {
                "scan_interval_seconds": self.scan_interval_seconds,
                "max_concurrent_signals": self.max_concurrent_signals,
                "signal_expiry_minutes": self.signal_expiry_minutes,
                "enabled_symbols": self.enabled_symbols,
                "enabled_exchanges": self.enabled_exchanges
            },
            "active_signals": len(self.active_signals),
            "pending_executions": len(self.pending_executions),
            "recent_scans": len(self.recent_scans),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "uptime_seconds": self.metrics.uptime_seconds
        }
    
    def get_active_signals(self) -> List[Dict[str, Any]]:
        """Get list of active trading signals"""
        
        return [signal.model_dump() for signal in self.active_signals.values()]
    
    def get_recent_scans(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent market scan results"""
        
        return [scan.model_dump() for scan in self.recent_scans[-limit:]]

# Factory function for service registry
def create_real_time_trading_loop(
    agent_coordination_service: AgentCoordinationService,
    trading_coordinator: TradingCoordinator,
    market_data_service: MarketDataService,
    risk_manager_service: RiskManagerService,
    performance_service: AgentPerformanceService,
    advanced_risk_management: AdvancedRiskManagement,
    multi_exchange_integration: MultiExchangeIntegration
) -> RealTimeTradingLoop:
    """Factory function to create real-time trading loop service"""
    return RealTimeTradingLoop(
        agent_coordination_service,
        trading_coordinator,
        market_data_service,
        risk_manager_service,
        performance_service,
        advanced_risk_management,
        multi_exchange_integration
    )