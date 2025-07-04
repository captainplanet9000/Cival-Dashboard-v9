#!/usr/bin/env python3
"""
Advanced Trading Service
Sophisticated trading strategies, order management, and execution
"""

import asyncio
import json
import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from pydantic import BaseModel
from enum import Enum
import uuid

# Configure logging
logger = logging.getLogger(__name__)

class OrderType(str, Enum):
    """Order types"""
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    TRAILING_STOP = "trailing_stop"
    OCO = "oco"  # One-Cancels-Other

class OrderSide(str, Enum):
    """Order sides"""
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    """Order status"""
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"

class TradingStrategy(str, Enum):
    """Trading strategies"""
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    ARBITRAGE = "arbitrage"
    PAIRS_TRADING = "pairs_trading"
    GRID_TRADING = "grid_trading"
    DCA = "dollar_cost_averaging"
    SCALPING = "scalping"

class TradingOrder(BaseModel):
    """Advanced trading order"""
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: str = "GTC"  # Good Till Cancelled
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    average_fill_price: Optional[float] = None
    fees: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    strategy: Optional[str] = None
    metadata: Dict[str, Any] = {}

class TradingSignal(BaseModel):
    """Trading signal generated by strategies"""
    signal_id: str
    symbol: str
    strategy: TradingStrategy
    action: OrderSide
    strength: float  # 0.0 to 1.0
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    confidence: float
    reasoning: str
    indicators: Dict[str, float]
    timestamp: datetime
    expires_at: Optional[datetime] = None

class PositionManagement(BaseModel):
    """Position management configuration"""
    symbol: str
    max_position_size: float
    risk_per_trade: float  # % of portfolio
    stop_loss_pct: float
    take_profit_pct: float
    trailing_stop_pct: Optional[float] = None
    max_drawdown_pct: float
    position_sizing_method: str = "fixed"  # fixed, kelly, volatility_based

class StrategyPerformance(BaseModel):
    """Strategy performance metrics"""
    strategy: TradingStrategy
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_pnl: float
    max_profit: float
    max_loss: float
    avg_profit: float
    avg_loss: float
    profit_factor: float
    sharpe_ratio: float
    max_drawdown: float
    recovery_factor: float

class AdvancedTradingService:
    """Advanced trading features and strategy execution"""
    
    def __init__(self):
        self.active_orders: Dict[str, TradingOrder] = {}
        self.order_history: List[TradingOrder] = []
        self.active_signals: Dict[str, TradingSignal] = {}
        self.position_configs: Dict[str, PositionManagement] = {}
        self.strategy_performance: Dict[TradingStrategy, StrategyPerformance] = {}
        self.trading_enabled = True
        self.risk_limits = {
            "max_orders_per_minute": 10,
            "max_position_value": 50000.0,
            "max_daily_loss": -5000.0,
            "max_portfolio_risk": 0.1
        }
        
    async def initialize(self) -> bool:
        """Initialize trading service"""
        try:
            # Initialize default position management configs
            await self._initialize_default_configs()
            logger.info("Advanced trading service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize trading service: {e}")
            return False
    
    async def create_order(self, order_data: Dict[str, Any]) -> TradingOrder:
        """Create advanced trading order"""
        try:
            # Validate order data
            await self._validate_order(order_data)
            
            # Create order
            order = TradingOrder(
                order_id=str(uuid.uuid4()),
                symbol=order_data["symbol"],
                side=OrderSide(order_data["side"]),
                order_type=OrderType(order_data.get("order_type", "market")),
                quantity=order_data["quantity"],
                price=order_data.get("price"),
                stop_price=order_data.get("stop_price"),
                time_in_force=order_data.get("time_in_force", "GTC"),
                created_at=datetime.now(),
                strategy=order_data.get("strategy")
            )
            
            # Apply position management rules
            order = await self._apply_position_management(order)
            
            # Add to active orders
            self.active_orders[order.order_id] = order
            
            # Simulate order execution (in real implementation, this would connect to exchange)
            await self._simulate_order_execution(order)
            
            logger.info(f"Order created: {order.order_id} - {order.symbol} {order.side} {order.quantity}")
            return order
            
        except Exception as e:
            logger.error(f"Order creation failed: {e}")
            raise
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel active order"""
        try:
            if order_id not in self.active_orders:
                raise ValueError(f"Order {order_id} not found")
            
            order = self.active_orders[order_id]
            if order.status not in [OrderStatus.PENDING, OrderStatus.OPEN]:
                raise ValueError(f"Cannot cancel order with status {order.status}")
            
            order.status = OrderStatus.CANCELLED
            order.updated_at = datetime.now()
            
            # Move to history
            self.order_history.append(order)
            del self.active_orders[order_id]
            
            logger.info(f"Order cancelled: {order_id}")
            return True
            
        except Exception as e:
            logger.error(f"Order cancellation failed: {e}")
            return False
    
    async def generate_trading_signals(self, market_data: Dict[str, Any]) -> List[TradingSignal]:
        """Generate trading signals using multiple strategies"""
        try:
            signals = []
            
            for symbol, data in market_data.items():
                # Momentum strategy
                momentum_signal = await self._momentum_strategy(symbol, data)
                if momentum_signal:
                    signals.append(momentum_signal)
                
                # Mean reversion strategy
                reversion_signal = await self._mean_reversion_strategy(symbol, data)
                if reversion_signal:
                    signals.append(reversion_signal)
                
                # Arbitrage opportunities
                arbitrage_signal = await self._arbitrage_strategy(symbol, data)
                if arbitrage_signal:
                    signals.append(arbitrage_signal)
            
            # Store active signals
            for signal in signals:
                self.active_signals[signal.signal_id] = signal
            
            return signals
            
        except Exception as e:
            logger.error(f"Signal generation failed: {e}")
            return []
    
    async def execute_strategy(self, strategy: TradingStrategy, 
                             portfolio: Dict[str, Any],
                             market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute specific trading strategy"""
        try:
            if strategy == TradingStrategy.MOMENTUM:
                return await self._execute_momentum_strategy(portfolio, market_data)
            elif strategy == TradingStrategy.MEAN_REVERSION:
                return await self._execute_mean_reversion_strategy(portfolio, market_data)
            elif strategy == TradingStrategy.ARBITRAGE:
                return await self._execute_arbitrage_strategy(portfolio, market_data)
            elif strategy == TradingStrategy.GRID_TRADING:
                return await self._execute_grid_trading_strategy(portfolio, market_data)
            elif strategy == TradingStrategy.DCA:
                return await self._execute_dca_strategy(portfolio, market_data)
            else:
                return {"success": False, "message": f"Strategy {strategy} not implemented"}
                
        except Exception as e:
            logger.error(f"Strategy execution failed for {strategy}: {e}")
            return {"success": False, "error": str(e)}
    
    async def optimize_portfolio(self, portfolio: Dict[str, Any],
                               target_allocation: Dict[str, float]) -> Dict[str, Any]:
        """Optimize portfolio allocation"""
        try:
            current_positions = portfolio.get("positions", [])
            total_value = portfolio.get("total_value", 0)
            
            optimization_orders = []
            rebalancing_needed = False
            
            # Calculate current allocations
            current_allocation = {}
            for position in current_positions:
                symbol = position["symbol"]
                weight = position["market_value"] / total_value if total_value > 0 else 0
                current_allocation[symbol] = weight
            
            # Generate rebalancing orders
            for symbol, target_weight in target_allocation.items():
                current_weight = current_allocation.get(symbol, 0)
                weight_diff = target_weight - current_weight
                
                if abs(weight_diff) > 0.01:  # 1% threshold
                    rebalancing_needed = True
                    target_value = target_weight * total_value
                    current_value = current_weight * total_value
                    trade_value = target_value - current_value
                    
                    if trade_value > 0:
                        # Buy more
                        order_data = {
                            "symbol": symbol,
                            "side": "buy",
                            "order_type": "market",
                            "quantity": abs(trade_value) / 1000,  # Simplified quantity calc
                            "strategy": "portfolio_optimization"
                        }
                    else:
                        # Sell some
                        order_data = {
                            "symbol": symbol,
                            "side": "sell", 
                            "order_type": "market",
                            "quantity": abs(trade_value) / 1000,
                            "strategy": "portfolio_optimization"
                        }
                    
                    optimization_orders.append(order_data)
            
            return {
                "rebalancing_needed": rebalancing_needed,
                "current_allocation": current_allocation,
                "target_allocation": target_allocation,
                "optimization_orders": optimization_orders,
                "estimated_cost": len(optimization_orders) * 5.0  # $5 per trade estimate
            }
            
        except Exception as e:
            logger.error(f"Portfolio optimization failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def manage_risk_positions(self, portfolio: Dict[str, Any],
                                  market_data: Dict[str, Any]) -> List[TradingOrder]:
        """Manage risk through stop losses and profit taking"""
        try:
            risk_orders = []
            positions = portfolio.get("positions", [])
            
            for position in positions:
                symbol = position["symbol"]
                quantity = position["quantity"]
                avg_cost = position.get("avg_cost", 0)
                current_price = market_data.get(symbol, {}).get("price", avg_cost)
                
                if avg_cost == 0:
                    continue
                
                # Calculate P&L
                if quantity > 0:  # Long position
                    pnl_pct = (current_price - avg_cost) / avg_cost
                    
                    # Stop loss at -5%
                    if pnl_pct < -0.05:
                        stop_order = await self.create_order({
                            "symbol": symbol,
                            "side": "sell",
                            "order_type": "market",
                            "quantity": quantity,
                            "strategy": "risk_management"
                        })
                        risk_orders.append(stop_order)
                    
                    # Take profit at +15%
                    elif pnl_pct > 0.15:
                        profit_quantity = quantity * 0.5  # Take partial profit
                        profit_order = await self.create_order({
                            "symbol": symbol,
                            "side": "sell",
                            "order_type": "market", 
                            "quantity": profit_quantity,
                            "strategy": "profit_taking"
                        })
                        risk_orders.append(profit_order)
                
                elif quantity < 0:  # Short position
                    pnl_pct = (avg_cost - current_price) / avg_cost
                    
                    # Stop loss at -5%
                    if pnl_pct < -0.05:
                        stop_order = await self.create_order({
                            "symbol": symbol,
                            "side": "buy",
                            "order_type": "market",
                            "quantity": abs(quantity),
                            "strategy": "risk_management"
                        })
                        risk_orders.append(stop_order)
            
            return risk_orders
            
        except Exception as e:
            logger.error(f"Risk management failed: {e}")
            return []
    
    async def calculate_strategy_performance(self, strategy: TradingStrategy) -> StrategyPerformance:
        """Calculate performance metrics for strategy"""
        try:
            # Filter orders by strategy
            strategy_orders = [order for order in self.order_history 
                             if order.strategy == strategy.value and order.status == OrderStatus.FILLED]
            
            if not strategy_orders:
                return StrategyPerformance(
                    strategy=strategy,
                    total_trades=0,
                    winning_trades=0,
                    losing_trades=0,
                    win_rate=0.0,
                    total_pnl=0.0,
                    max_profit=0.0,
                    max_loss=0.0,
                    avg_profit=0.0,
                    avg_loss=0.0,
                    profit_factor=0.0,
                    sharpe_ratio=0.0,
                    max_drawdown=0.0,
                    recovery_factor=0.0
                )
            
            # Calculate metrics
            trades = []
            for order in strategy_orders:
                # Simplified P&L calculation
                if order.side == OrderSide.BUY:
                    pnl = (47000 - order.average_fill_price) * order.filled_quantity  # Mock calculation
                else:
                    pnl = (order.average_fill_price - 47000) * order.filled_quantity
                
                trades.append(pnl)
            
            winning_trades = [t for t in trades if t > 0]
            losing_trades = [t for t in trades if t < 0]
            
            total_pnl = sum(trades)
            win_rate = len(winning_trades) / len(trades) if trades else 0
            avg_profit = sum(winning_trades) / len(winning_trades) if winning_trades else 0
            avg_loss = sum(losing_trades) / len(losing_trades) if losing_trades else 0
            profit_factor = abs(sum(winning_trades) / sum(losing_trades)) if losing_trades else float('inf')
            
            # Mock additional metrics
            sharpe_ratio = 1.5 if total_pnl > 0 else -0.5
            max_drawdown = 0.08  # 8%
            recovery_factor = total_pnl / max_drawdown if max_drawdown > 0 else 0
            
            performance = StrategyPerformance(
                strategy=strategy,
                total_trades=len(trades),
                winning_trades=len(winning_trades),
                losing_trades=len(losing_trades),
                win_rate=win_rate,
                total_pnl=total_pnl,
                max_profit=max(winning_trades) if winning_trades else 0,
                max_loss=min(losing_trades) if losing_trades else 0,
                avg_profit=avg_profit,
                avg_loss=avg_loss,
                profit_factor=profit_factor,
                sharpe_ratio=sharpe_ratio,
                max_drawdown=max_drawdown,
                recovery_factor=recovery_factor
            )
            
            self.strategy_performance[strategy] = performance
            return performance
            
        except Exception as e:
            logger.error(f"Strategy performance calculation failed: {e}")
            return StrategyPerformance(
                strategy=strategy,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0.0,
                total_pnl=0.0,
                max_profit=0.0,
                max_loss=0.0,
                avg_profit=0.0,
                avg_loss=0.0,
                profit_factor=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                recovery_factor=0.0
            )
    
    # Private helper methods
    async def _validate_order(self, order_data: Dict[str, Any]) -> None:
        """Validate order before creation"""
        required_fields = ["symbol", "side", "quantity"]
        for field in required_fields:
            if field not in order_data:
                raise ValueError(f"Missing required field: {field}")
        
        if order_data["quantity"] <= 0:
            raise ValueError("Quantity must be positive")
        
        # Check risk limits
        if order_data["quantity"] * 1000 > self.risk_limits["max_position_value"]:
            raise ValueError("Order size exceeds position limits")
    
    async def _apply_position_management(self, order: TradingOrder) -> TradingOrder:
        """Apply position management rules"""
        config = self.position_configs.get(order.symbol)
        if not config:
            return order
        
        # Apply stop loss and take profit
        if order.price and order.side == OrderSide.BUY:
            order.metadata["stop_loss"] = order.price * (1 - config.stop_loss_pct)
            order.metadata["take_profit"] = order.price * (1 + config.take_profit_pct)
        elif order.price and order.side == OrderSide.SELL:
            order.metadata["stop_loss"] = order.price * (1 + config.stop_loss_pct)
            order.metadata["take_profit"] = order.price * (1 - config.take_profit_pct)
        
        return order
    
    async def _simulate_order_execution(self, order: TradingOrder) -> None:
        """Simulate order execution (replace with real exchange integration)"""
        await asyncio.sleep(0.1)  # Simulate network delay
        
        # Mock execution
        if order.order_type == OrderType.MARKET:
            order.status = OrderStatus.FILLED
            order.filled_quantity = order.quantity
            order.average_fill_price = 47000.0  # Mock price
            order.fees = order.quantity * 47000.0 * 0.001  # 0.1% fee
        else:
            order.status = OrderStatus.OPEN
        
        order.updated_at = datetime.now()
    
    async def _momentum_strategy(self, symbol: str, data: Dict[str, Any]) -> Optional[TradingSignal]:
        """Generate momentum trading signal"""
        try:
            change_24h = data.get("change_24h", 0)
            volume_24h = data.get("volume_24h", 0)
            
            # Simple momentum rules
            if change_24h > 5 and volume_24h > 1000000:
                return TradingSignal(
                    signal_id=str(uuid.uuid4()),
                    symbol=symbol,
                    strategy=TradingStrategy.MOMENTUM,
                    action=OrderSide.BUY,
                    strength=min(change_24h / 10, 1.0),
                    confidence=0.7,
                    reasoning=f"Strong upward momentum with {change_24h}% gain and high volume",
                    indicators={"momentum": change_24h, "volume": volume_24h},
                    timestamp=datetime.now()
                )
            elif change_24h < -5 and volume_24h > 1000000:
                return TradingSignal(
                    signal_id=str(uuid.uuid4()),
                    symbol=symbol,
                    strategy=TradingStrategy.MOMENTUM,
                    action=OrderSide.SELL,
                    strength=min(abs(change_24h) / 10, 1.0),
                    confidence=0.6,
                    reasoning=f"Strong downward momentum with {change_24h}% decline and high volume",
                    indicators={"momentum": change_24h, "volume": volume_24h},
                    timestamp=datetime.now()
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Momentum strategy failed for {symbol}: {e}")
            return None
    
    async def _mean_reversion_strategy(self, symbol: str, data: Dict[str, Any]) -> Optional[TradingSignal]:
        """Generate mean reversion signal"""
        try:
            change_24h = data.get("change_24h", 0)
            
            # Simple mean reversion rules
            if change_24h < -8:  # Oversold
                return TradingSignal(
                    signal_id=str(uuid.uuid4()),
                    symbol=symbol,
                    strategy=TradingStrategy.MEAN_REVERSION,
                    action=OrderSide.BUY,
                    strength=min(abs(change_24h) / 15, 1.0),
                    confidence=0.6,
                    reasoning=f"Oversold condition with {change_24h}% decline",
                    indicators={"rsi_proxy": abs(change_24h)},
                    timestamp=datetime.now()
                )
            elif change_24h > 8:  # Overbought
                return TradingSignal(
                    signal_id=str(uuid.uuid4()),
                    symbol=symbol,
                    strategy=TradingStrategy.MEAN_REVERSION,
                    action=OrderSide.SELL,
                    strength=min(change_24h / 15, 1.0),
                    confidence=0.6,
                    reasoning=f"Overbought condition with {change_24h}% gain",
                    indicators={"rsi_proxy": change_24h},
                    timestamp=datetime.now()
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Mean reversion strategy failed for {symbol}: {e}")
            return None
    
    async def _arbitrage_strategy(self, symbol: str, data: Dict[str, Any]) -> Optional[TradingSignal]:
        """Generate arbitrage signal"""
        try:
            # Mock arbitrage opportunity detection
            price = data.get("price", 0)
            
            # Simulate price difference detection
            if symbol == "BTCUSD" and abs(price - 47000) > 500:
                return TradingSignal(
                    signal_id=str(uuid.uuid4()),
                    symbol=symbol,
                    strategy=TradingStrategy.ARBITRAGE,
                    action=OrderSide.BUY if price < 47000 else OrderSide.SELL,
                    strength=0.9,
                    confidence=0.8,
                    reasoning=f"Arbitrage opportunity detected with price difference",
                    indicators={"price_diff": abs(price - 47000)},
                    timestamp=datetime.now()
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Arbitrage strategy failed for {symbol}: {e}")
            return None
    
    async def _execute_momentum_strategy(self, portfolio: Dict[str, Any], 
                                       market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute momentum strategy"""
        try:
            signals = await self.generate_trading_signals(market_data)
            momentum_signals = [s for s in signals if s.strategy == TradingStrategy.MOMENTUM]
            
            executed_orders = []
            for signal in momentum_signals:
                if signal.strength > 0.7:  # High confidence signals only
                    order_data = {
                        "symbol": signal.symbol,
                        "side": signal.action.value,
                        "order_type": "market",
                        "quantity": 0.1,  # Fixed quantity for demo
                        "strategy": "momentum"
                    }
                    
                    order = await self.create_order(order_data)
                    executed_orders.append(order)
            
            return {
                "success": True,
                "strategy": "momentum",
                "signals_generated": len(momentum_signals),
                "orders_executed": len(executed_orders),
                "orders": [order.dict() for order in executed_orders]
            }
            
        except Exception as e:
            logger.error(f"Momentum strategy execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _execute_mean_reversion_strategy(self, portfolio: Dict[str, Any],
                                             market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute mean reversion strategy"""
        try:
            signals = await self.generate_trading_signals(market_data)
            reversion_signals = [s for s in signals if s.strategy == TradingStrategy.MEAN_REVERSION]
            
            executed_orders = []
            for signal in reversion_signals:
                if signal.strength > 0.6:
                    order_data = {
                        "symbol": signal.symbol,
                        "side": signal.action.value,
                        "order_type": "limit",
                        "quantity": 0.05,
                        "price": market_data[signal.symbol]["price"] * 0.99,  # Slight discount
                        "strategy": "mean_reversion"
                    }
                    
                    order = await self.create_order(order_data)
                    executed_orders.append(order)
            
            return {
                "success": True,
                "strategy": "mean_reversion", 
                "signals_generated": len(reversion_signals),
                "orders_executed": len(executed_orders),
                "orders": [order.dict() for order in executed_orders]
            }
            
        except Exception as e:
            logger.error(f"Mean reversion strategy execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _execute_arbitrage_strategy(self, portfolio: Dict[str, Any],
                                        market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute arbitrage strategy"""
        try:
            signals = await self.generate_trading_signals(market_data)
            arbitrage_signals = [s for s in signals if s.strategy == TradingStrategy.ARBITRAGE]
            
            executed_orders = []
            for signal in arbitrage_signals:
                order_data = {
                    "symbol": signal.symbol,
                    "side": signal.action.value,
                    "order_type": "market",
                    "quantity": 0.02,  # Small quantity for arbitrage
                    "strategy": "arbitrage"
                }
                
                order = await self.create_order(order_data)
                executed_orders.append(order)
            
            return {
                "success": True,
                "strategy": "arbitrage",
                "signals_generated": len(arbitrage_signals),
                "orders_executed": len(executed_orders),
                "orders": [order.dict() for order in executed_orders]
            }
            
        except Exception as e:
            logger.error(f"Arbitrage strategy execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _execute_grid_trading_strategy(self, portfolio: Dict[str, Any],
                                           market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute grid trading strategy"""
        try:
            # Simplified grid trading implementation
            executed_orders = []
            
            for symbol, data in market_data.items():
                current_price = data.get("price", 0)
                if current_price == 0:
                    continue
                
                # Create buy and sell grid orders
                grid_levels = 5
                grid_spacing = 0.02  # 2%
                
                for i in range(1, grid_levels + 1):
                    # Buy orders below current price
                    buy_price = current_price * (1 - grid_spacing * i)
                    buy_order_data = {
                        "symbol": symbol,
                        "side": "buy",
                        "order_type": "limit",
                        "quantity": 0.01,
                        "price": buy_price,
                        "strategy": "grid_trading"
                    }
                    
                    # Sell orders above current price
                    sell_price = current_price * (1 + grid_spacing * i)
                    sell_order_data = {
                        "symbol": symbol,
                        "side": "sell",
                        "order_type": "limit",
                        "quantity": 0.01,
                        "price": sell_price,
                        "strategy": "grid_trading"
                    }
                    
                    buy_order = await self.create_order(buy_order_data)
                    sell_order = await self.create_order(sell_order_data)
                    
                    executed_orders.extend([buy_order, sell_order])
            
            return {
                "success": True,
                "strategy": "grid_trading",
                "grid_levels": grid_levels,
                "orders_executed": len(executed_orders),
                "orders": [order.dict() for order in executed_orders]
            }
            
        except Exception as e:
            logger.error(f"Grid trading strategy execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _execute_dca_strategy(self, portfolio: Dict[str, Any],
                                  market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute dollar cost averaging strategy"""
        try:
            executed_orders = []
            cash_available = portfolio.get("cash_balance", 0)
            dca_amount = min(cash_available * 0.1, 1000)  # 10% of cash or $1000 max
            
            # DCA into major cryptocurrencies
            dca_symbols = ["BTCUSD", "ETHUSD"]
            amount_per_symbol = dca_amount / len(dca_symbols)
            
            for symbol in dca_symbols:
                if symbol in market_data:
                    price = market_data[symbol].get("price", 0)
                    if price > 0:
                        quantity = amount_per_symbol / price
                        
                        order_data = {
                            "symbol": symbol,
                            "side": "buy",
                            "order_type": "market",
                            "quantity": quantity,
                            "strategy": "dollar_cost_averaging"
                        }
                        
                        order = await self.create_order(order_data)
                        executed_orders.append(order)
            
            return {
                "success": True,
                "strategy": "dollar_cost_averaging",
                "dca_amount": dca_amount,
                "orders_executed": len(executed_orders),
                "orders": [order.dict() for order in executed_orders]
            }
            
        except Exception as e:
            logger.error(f"DCA strategy execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _initialize_default_configs(self) -> None:
        """Initialize default position management configurations"""
        default_symbols = ["BTCUSD", "ETHUSD", "SOLUSD", "ADAUSD"]
        
        for symbol in default_symbols:
            self.position_configs[symbol] = PositionManagement(
                symbol=symbol,
                max_position_size=10000.0,
                risk_per_trade=0.02,
                stop_loss_pct=0.05,
                take_profit_pct=0.15,
                trailing_stop_pct=0.03,
                max_drawdown_pct=0.10,
                position_sizing_method="fixed"
            )
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get trading service status"""
        return {
            "service": "advanced_trading",
            "status": "healthy",
            "trading_enabled": self.trading_enabled,
            "active_orders": len(self.active_orders),
            "order_history": len(self.order_history),
            "active_signals": len(self.active_signals),
            "position_configs": len(self.position_configs),
            "risk_limits": self.risk_limits,
            "last_check": datetime.now().isoformat()
        }

# Global service instance
trading_service = AdvancedTradingService()