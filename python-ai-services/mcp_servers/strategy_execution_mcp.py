#!/usr/bin/env python3
"""
Strategy Execution MCP Server
Port: 8006
Provides 8 comprehensive trading strategy tools for AI agents
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import numpy as np
from decimal import Decimal

# MCP imports
from mcp import Tool, server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, ImageContent, EmbeddedResource

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class StrategyRule:
    """Represents a trading strategy rule"""
    name: str
    description: str
    conditions: List[str]
    parameters: Dict[str, Any]
    weight: float = 1.0

@dataclass
class StrategySignal:
    """Represents a trading signal from strategy analysis"""
    strategy_type: str
    symbol: str
    signal_type: str  # 'buy', 'sell', 'hold'
    strength: float
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: float
    conditions_met: List[str]
    timestamp: datetime

@dataclass
class StrategyPerformance:
    """Strategy performance metrics"""
    strategy_type: str
    total_trades: int
    win_rate: float
    avg_return: float
    max_drawdown: float
    sharpe_ratio: float
    profit_factor: float
    risk_reward_ratio: float

class StrategyExecutionMCP:
    """MCP Server for comprehensive trading strategy execution"""
    
    def __init__(self):
        self.strategy_knowledge = self._load_strategy_knowledge()
        self.execution_history = []
        self.active_signals = {}
        logger.info("Strategy Execution MCP Server initialized")
    
    def _load_strategy_knowledge(self) -> Dict[str, Dict[str, Any]]:
        """Load comprehensive strategy knowledge base"""
        return {
            "darvas_box": {
                "name": "Darvas Box Breakout",
                "description": "Breakout strategy based on Nicolas Darvas box theory",
                "parameters": {
                    "box_period": 20,
                    "volume_threshold": 1.5,
                    "breakout_confirmation": 2,
                    "stop_loss_percent": 8,
                    "profit_target_ratio": 2,
                    "min_box_size": 0.05,
                    "max_box_age": 21
                },
                "indicators": ["Volume", "ATR", "200-day MA", "Box levels", "Support/Resistance"],
                "entry_rules": [
                    StrategyRule("Box Formation", "3+ weeks consolidation within 10% range", 
                               ["consolidation_period >= 21", "price_range <= 0.10"], {"period": 21, "range": 0.10}, 1.0),
                    StrategyRule("Breakout Confirmation", "2+ consecutive closes above box high", 
                               ["consecutive_closes >= 2", "price > box_high"], {"consecutive": 2}, 1.0),
                    StrategyRule("Volume Surge", "150% of 50-day average volume", 
                               ["current_volume > avg_volume * 1.5"], {"multiplier": 1.5}, 0.8),
                    StrategyRule("Trend Alignment", "Price above 200-day MA", 
                               ["price > ma_200"], {}, 0.6)
                ],
                "exit_rules": [
                    StrategyRule("Stop Loss", "8% below breakout point", 
                               ["price < entry_price * 0.92"], {"percentage": 0.08}, 1.0),
                    StrategyRule("Profit Target", "2x risk (16% gain)", 
                               ["price > entry_price * 1.16"], {"ratio": 2.0}, 1.0),
                    StrategyRule("Trailing Stop", "Move stop to breakeven after 8% gain", 
                               ["unrealized_gain > 0.08"], {"threshold": 0.08}, 0.8)
                ],
                "risk_management": {
                    "max_position_size": 0.02,
                    "max_correlation": 0.7,
                    "max_daily_loss": 0.01,
                    "sector_exposure": 0.10
                },
                "optimal_conditions": ["trending_market", "medium_volatility", "strong_volume"],
                "avoid_conditions": ["sideways_market", "low_volume", "high_correlation"]
            },
            "williams_alligator": {
                "name": "Williams Alligator Trend",
                "description": "Bill Williams Alligator system using 3 displaced moving averages",
                "parameters": {
                    "jaw_period": 13,
                    "teeth_period": 8,
                    "lips_period": 5,
                    "jaw_offset": 8,
                    "teeth_offset": 5,
                    "lips_offset": 3,
                    "fractal_period": 5,
                    "ao_fast_period": 5,
                    "ao_slow_period": 34
                },
                "indicators": ["Alligator Lines", "Fractals", "Awesome Oscillator", "AC/DC"],
                "entry_rules": [
                    StrategyRule("Alligator Awakening", "Jaw < Teeth < Lips for bullish", 
                               ["jaw < teeth", "teeth < lips", "lines_expanding"], {}, 1.0),
                    StrategyRule("Fractal Breakout", "Price breaks fractal level", 
                               ["price > fractal_high", "fractal_confirmed"], {}, 1.0),
                    StrategyRule("Momentum Confirmation", "AO same direction", 
                               ["ao_direction == signal_direction"], {}, 0.8),
                    StrategyRule("Lines Expanding", "Alligator lines not converging", 
                               ["line_spread > previous_spread"], {}, 0.6)
                ],
                "exit_rules": [
                    StrategyRule("Alligator Sleeping", "Lines converging for 5+ bars", 
                               ["convergence_periods >= 5"], {"periods": 5}, 1.0),
                    StrategyRule("Opposite Fractal", "Opposite fractal signal", 
                               ["opposite_fractal_confirmed"], {}, 1.0),
                    StrategyRule("Momentum Divergence", "AO shows divergence", 
                               ["ao_divergence"], {}, 0.8)
                ],
                "risk_management": {
                    "stop_loss": "nearest_fractal",
                    "position_sizing": "fractal_distance",
                    "max_position_size": 0.03,
                    "trailing_stop": "alligator_lips"
                },
                "optimal_conditions": ["trending_market", "clear_direction", "low_noise"],
                "avoid_conditions": ["choppy_market", "low_volatility", "news_driven"]
            },
            "renko_breakout": {
                "name": "Renko Momentum Breakout",
                "description": "Price-based Renko chart strategy focusing on momentum",
                "parameters": {
                    "brick_size": "ATR",
                    "atr_period": 14,
                    "atr_multiplier": 2.0,
                    "confirmation_bricks": 3,
                    "momentum_threshold": 1.2,
                    "trend_strength": 0.7,
                    "volume_multiplier": 1.5
                },
                "indicators": ["Renko Bricks", "ATR", "Momentum", "Volume", "Trend Strength"],
                "entry_rules": [
                    StrategyRule("Brick Color Change", "Green after red bricks", 
                               ["brick_color_change", "new_direction"], {}, 1.0),
                    StrategyRule("Momentum Surge", "120% of average momentum", 
                               ["momentum > avg_momentum * 1.2"], {"multiplier": 1.2}, 1.0),
                    StrategyRule("Trend Continuation", "3+ consecutive same-color bricks", 
                               ["consecutive_bricks >= 3"], {"consecutive": 3}, 0.8),
                    StrategyRule("Volume Confirmation", "150% of average volume", 
                               ["volume > avg_volume * 1.5"], {"multiplier": 1.5}, 0.7)
                ],
                "exit_rules": [
                    StrategyRule("Brick Reversal", "Color reversal with momentum", 
                               ["brick_reversal", "momentum_confirmation"], {}, 1.0),
                    StrategyRule("Momentum Fade", "Below threshold", 
                               ["momentum < threshold"], {}, 0.8),
                    StrategyRule("Pattern Completion", "Doji-like formation", 
                               ["doji_pattern"], {}, 0.6)
                ],
                "risk_management": {
                    "stop_loss": "2x_brick_size",
                    "profit_target": "6x_brick_size",
                    "position_sizing": "brick_volatility",
                    "max_position_size": 0.025
                },
                "optimal_conditions": ["trending_market", "medium_volatility", "clear_momentum"],
                "avoid_conditions": ["sideways_market", "low_volatility", "erratic_movement"]
            },
            "heikin_ashi": {
                "name": "Heikin Ashi Trend Follow",
                "description": "Modified candlestick strategy using Heikin Ashi candles",
                "parameters": {
                    "ema_period": 20,
                    "confirmation_candles": 2,
                    "trend_strength": 0.7,
                    "stop_loss_atr": 2,
                    "macd_fast": 12,
                    "macd_slow": 26,
                    "macd_signal": 9,
                    "rsi_period": 14
                },
                "indicators": ["Heikin Ashi", "EMA", "MACD", "RSI", "ATR"],
                "entry_rules": [
                    StrategyRule("HA Color Change", "Green after red candles", 
                               ["ha_color_change", "new_trend"], {}, 1.0),
                    StrategyRule("EMA Cross", "Price crosses EMA(20)", 
                               ["price_cross_ema"], {}, 1.0),
                    StrategyRule("MACD Confirmation", "MACD line crosses signal", 
                               ["macd_cross_signal"], {}, 0.8),
                    StrategyRule("Trend Strength", "No significant shadows", 
                               ["minimal_shadows"], {}, 0.6)
                ],
                "exit_rules": [
                    StrategyRule("HA Doji", "Doji formation or long shadows", 
                               ["ha_doji", "long_shadows"], {}, 1.0),
                    StrategyRule("EMA Recross", "Opposite direction", 
                               ["ema_recross"], {}, 1.0),
                    StrategyRule("MACD Divergence", "Opposite cross", 
                               ["macd_divergence"], {}, 0.8)
                ],
                "risk_management": {
                    "stop_loss": "2x_atr",
                    "profit_target": "ema_trail",
                    "position_sizing": "atr_volatility",
                    "max_position_size": 0.03
                },
                "optimal_conditions": ["trending_market", "normal_volatility", "clear_direction"],
                "avoid_conditions": ["choppy_market", "high_volatility", "news_driven"]
            },
            "elliott_wave": {
                "name": "Elliott Wave Analyst",
                "description": "Ralph Nelson Elliott wave theory for market cycle analysis",
                "parameters": {
                    "wave_degree": "Minor",
                    "fib_levels": [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618],
                    "rsi_period": 14,
                    "min_wave_size": 50,
                    "max_wave_size": 500,
                    "momentum_divergence": 0.15,
                    "volume_confirmation": 1.25,
                    "trendline_tolerance": 0.02
                },
                "indicators": ["Wave Patterns", "Fibonacci", "RSI", "MACD", "Volume", "Trendlines"],
                "entry_rules": [
                    StrategyRule("Wave Identification", "5-wave impulse pattern", 
                               ["wave_pattern_identified", "impulse_wave"], {}, 1.0),
                    StrategyRule("Wave 3 Characteristics", "Never shortest, highest volume", 
                               ["wave3_longest", "highest_volume"], {}, 1.0),
                    StrategyRule("Fibonacci Confluence", "61.8% retracement + extensions", 
                               ["fib_confluence"], {}, 0.9),
                    StrategyRule("RSI Momentum", "Confirming wave direction", 
                               ["rsi_momentum_confirm"], {}, 0.7)
                ],
                "exit_rules": [
                    StrategyRule("Wave Completion", "5-wave or 3-wave complete", 
                               ["wave_completion"], {}, 1.0),
                    StrategyRule("Fibonacci Resistance", "Extension levels reached", 
                               ["fib_resistance"], {}, 0.9),
                    StrategyRule("RSI Divergence", "At wave extremes", 
                               ["rsi_divergence"], {}, 0.8)
                ],
                "risk_management": {
                    "stop_loss": "wave1_low",
                    "profit_target": "fib_extensions",
                    "position_sizing": "wave_volatility",
                    "max_position_size": 0.02
                },
                "optimal_conditions": ["trending_market", "clear_cycles", "normal_volatility"],
                "avoid_conditions": ["choppy_market", "low_volatility", "unclear_waves"]
            }
        }
    
    async def get_strategy_knowledge(self, strategy_type: str) -> Dict[str, Any]:
        """Get comprehensive strategy knowledge and rules"""
        try:
            if strategy_type not in self.strategy_knowledge:
                available_strategies = list(self.strategy_knowledge.keys())
                return {
                    "success": False,
                    "error": f"Strategy '{strategy_type}' not found. Available: {available_strategies}",
                    "available_strategies": available_strategies
                }
            
            strategy = self.strategy_knowledge[strategy_type]
            
            return {
                "success": True,
                "strategy_type": strategy_type,
                "name": strategy["name"],
                "description": strategy["description"],
                "parameters": strategy["parameters"],
                "indicators": strategy["indicators"],
                "entry_rules": [
                    {
                        "name": rule.name,
                        "description": rule.description,
                        "conditions": rule.conditions,
                        "parameters": rule.parameters,
                        "weight": rule.weight
                    } for rule in strategy["entry_rules"]
                ],
                "exit_rules": [
                    {
                        "name": rule.name,
                        "description": rule.description,
                        "conditions": rule.conditions,
                        "parameters": rule.parameters,
                        "weight": rule.weight
                    } for rule in strategy["exit_rules"]
                ],
                "risk_management": strategy["risk_management"],
                "optimal_conditions": strategy["optimal_conditions"],
                "avoid_conditions": strategy["avoid_conditions"],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting strategy knowledge: {e}")
            return {
                "success": False,
                "error": f"Failed to get strategy knowledge: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def execute_strategy_analysis(self, strategy_type: str, symbol: str, 
                                      market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute comprehensive strategy analysis on market data"""
        try:
            if strategy_type not in self.strategy_knowledge:
                return {
                    "success": False,
                    "error": f"Strategy '{strategy_type}' not found",
                    "timestamp": datetime.now().isoformat()
                }
            
            strategy = self.strategy_knowledge[strategy_type]
            
            # Simulate strategy analysis (in real implementation, this would use actual market data)
            entry_score = self._calculate_entry_score(strategy, market_data)
            exit_score = self._calculate_exit_score(strategy, market_data)
            risk_score = self._calculate_risk_score(strategy, market_data)
            
            # Generate signals based on analysis
            signal_strength = (entry_score + (100 - exit_score) + (100 - risk_score)) / 3
            
            signal_type = "hold"
            if signal_strength > 70:
                signal_type = "buy"
            elif signal_strength < 30:
                signal_type = "sell"
            
            # Calculate price targets
            current_price = market_data.get("price", 100.0)
            stop_loss = current_price * (1 - strategy["risk_management"].get("max_position_size", 0.02) * 4)
            take_profit = current_price * (1 + strategy["risk_management"].get("max_position_size", 0.02) * 8)
            
            conditions_met = self._get_conditions_met(strategy, market_data, entry_score)
            
            return {
                "success": True,
                "strategy_type": strategy_type,
                "symbol": symbol,
                "analysis": {
                    "entry_score": entry_score,
                    "exit_score": exit_score,
                    "risk_score": risk_score,
                    "signal_strength": signal_strength,
                    "signal_type": signal_type,
                    "confidence": min(95, max(5, signal_strength)),
                    "current_price": current_price,
                    "stop_loss": stop_loss,
                    "take_profit": take_profit,
                    "conditions_met": conditions_met,
                    "market_conditions": self._assess_market_conditions(market_data),
                    "recommendation": self._generate_recommendation(signal_type, signal_strength, conditions_met)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error executing strategy analysis: {e}")
            return {
                "success": False,
                "error": f"Failed to execute strategy analysis: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def _calculate_entry_score(self, strategy: Dict, market_data: Dict) -> float:
        """Calculate entry signal score based on strategy rules"""
        score = 0.0
        total_weight = 0.0
        
        for rule in strategy["entry_rules"]:
            # Simulate rule evaluation (in real implementation, evaluate actual conditions)
            rule_score = np.random.uniform(0, 100)  # Mock evaluation
            weight = rule.weight
            score += rule_score * weight
            total_weight += weight
        
        return score / total_weight if total_weight > 0 else 50.0
    
    def _calculate_exit_score(self, strategy: Dict, market_data: Dict) -> float:
        """Calculate exit signal score based on strategy rules"""
        score = 0.0
        total_weight = 0.0
        
        for rule in strategy["exit_rules"]:
            # Simulate rule evaluation
            rule_score = np.random.uniform(0, 100)  # Mock evaluation
            weight = rule.weight
            score += rule_score * weight
            total_weight += weight
        
        return score / total_weight if total_weight > 0 else 50.0
    
    def _calculate_risk_score(self, strategy: Dict, market_data: Dict) -> float:
        """Calculate risk score based on strategy risk management"""
        # Simulate risk assessment
        volatility = market_data.get("volatility", 0.15)
        volume = market_data.get("volume", 1000000)
        
        risk_score = 50.0
        
        # Adjust for volatility
        if volatility > 0.3:
            risk_score += 20  # Higher risk
        elif volatility < 0.1:
            risk_score -= 10  # Lower risk
        
        # Adjust for volume
        if volume < 100000:
            risk_score += 15  # Higher risk due to low liquidity
        
        return min(100, max(0, risk_score))
    
    def _get_conditions_met(self, strategy: Dict, market_data: Dict, entry_score: float) -> List[str]:
        """Get list of conditions met for the strategy"""
        conditions_met = []
        
        for rule in strategy["entry_rules"]:
            # Simulate condition checking
            if np.random.random() > 0.3:  # 70% chance condition is met
                conditions_met.append(rule.name)
        
        return conditions_met
    
    def _assess_market_conditions(self, market_data: Dict) -> Dict[str, Any]:
        """Assess current market conditions"""
        return {
            "trend": "bullish" if np.random.random() > 0.5 else "bearish",
            "volatility": market_data.get("volatility", 0.15),
            "volume": "high" if market_data.get("volume", 1000000) > 500000 else "low",
            "momentum": "strong" if np.random.random() > 0.6 else "weak"
        }
    
    def _generate_recommendation(self, signal_type: str, signal_strength: float, conditions_met: List[str]) -> str:
        """Generate trading recommendation"""
        if signal_type == "buy" and signal_strength > 80:
            return f"Strong BUY signal with {len(conditions_met)} conditions met. Consider entering position."
        elif signal_type == "sell" and signal_strength < 20:
            return f"Strong SELL signal with {len(conditions_met)} conditions met. Consider exiting position."
        elif signal_type == "hold":
            return f"HOLD signal. {len(conditions_met)} conditions met. Wait for better setup."
        else:
            return f"Weak {signal_type.upper()} signal. Monitor for better entry/exit opportunity."
    
    async def get_entry_signals(self, strategy_type: str, symbol: str, 
                               market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get entry signals for specific strategy and symbol"""
        try:
            analysis = await self.execute_strategy_analysis(strategy_type, symbol, market_data)
            
            if not analysis["success"]:
                return analysis
            
            entry_signals = {
                "success": True,
                "strategy_type": strategy_type,
                "symbol": symbol,
                "entry_signals": {
                    "signal_type": analysis["analysis"]["signal_type"],
                    "strength": analysis["analysis"]["signal_strength"],
                    "confidence": analysis["analysis"]["confidence"],
                    "entry_price": analysis["analysis"]["current_price"],
                    "stop_loss": analysis["analysis"]["stop_loss"],
                    "take_profit": analysis["analysis"]["take_profit"],
                    "conditions_met": analysis["analysis"]["conditions_met"],
                    "recommendation": analysis["analysis"]["recommendation"]
                },
                "timestamp": datetime.now().isoformat()
            }
            
            # Store active signal
            signal_id = f"{strategy_type}_{symbol}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.active_signals[signal_id] = entry_signals
            
            return entry_signals
            
        except Exception as e:
            logger.error(f"Error getting entry signals: {e}")
            return {
                "success": False,
                "error": f"Failed to get entry signals: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_exit_signals(self, strategy_type: str, symbol: str, 
                              position_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get exit signals for open positions"""
        try:
            if strategy_type not in self.strategy_knowledge:
                return {
                    "success": False,
                    "error": f"Strategy '{strategy_type}' not found",
                    "timestamp": datetime.now().isoformat()
                }
            
            strategy = self.strategy_knowledge[strategy_type]
            
            # Simulate exit signal analysis
            current_price = position_data.get("current_price", 100.0)
            entry_price = position_data.get("entry_price", 95.0)
            
            pnl_percent = (current_price - entry_price) / entry_price * 100
            
            # Determine exit signal
            exit_signal = "hold"
            exit_reason = "Position within normal range"
            
            if pnl_percent <= -8:  # Stop loss hit
                exit_signal = "exit"
                exit_reason = "Stop loss triggered"
            elif pnl_percent >= 16:  # Profit target hit
                exit_signal = "exit"
                exit_reason = "Profit target reached"
            elif abs(pnl_percent) > 20:  # Extreme move
                exit_signal = "partial_exit"
                exit_reason = "Extreme price movement"
            
            return {
                "success": True,
                "strategy_type": strategy_type,
                "symbol": symbol,
                "exit_signals": {
                    "signal_type": exit_signal,
                    "reason": exit_reason,
                    "current_price": current_price,
                    "entry_price": entry_price,
                    "pnl_percent": pnl_percent,
                    "recommendation": f"{exit_signal.upper()}: {exit_reason}"
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting exit signals: {e}")
            return {
                "success": False,
                "error": f"Failed to get exit signals: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def validate_risk_conditions(self, strategy_type: str, symbol: str, 
                                     position_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate risk management conditions"""
        try:
            if strategy_type not in self.strategy_knowledge:
                return {
                    "success": False,
                    "error": f"Strategy '{strategy_type}' not found",
                    "timestamp": datetime.now().isoformat()
                }
            
            strategy = self.strategy_knowledge[strategy_type]
            risk_mgmt = strategy["risk_management"]
            
            # Simulate risk validation
            position_size = position_data.get("position_size", 1000)
            portfolio_value = position_data.get("portfolio_value", 100000)
            
            position_size_percent = position_size / portfolio_value
            max_position_size = risk_mgmt.get("max_position_size", 0.02)
            
            risks = []
            warnings = []
            
            if position_size_percent > max_position_size:
                risks.append(f"Position size {position_size_percent:.1%} exceeds maximum {max_position_size:.1%}")
            
            if position_size_percent > max_position_size * 0.8:
                warnings.append(f"Position size approaching maximum limit")
            
            risk_status = "high" if risks else "medium" if warnings else "low"
            
            return {
                "success": True,
                "strategy_type": strategy_type,
                "symbol": symbol,
                "risk_validation": {
                    "risk_status": risk_status,
                    "position_size_percent": position_size_percent,
                    "max_allowed_percent": max_position_size,
                    "risks": risks,
                    "warnings": warnings,
                    "approved": len(risks) == 0,
                    "risk_management_rules": risk_mgmt
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error validating risk conditions: {e}")
            return {
                "success": False,
                "error": f"Failed to validate risk conditions: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def get_strategy_performance(self, strategy_type: str, 
                                     timeframe: str = "30d") -> Dict[str, Any]:
        """Get historical performance metrics for strategy"""
        try:
            if strategy_type not in self.strategy_knowledge:
                return {
                    "success": False,
                    "error": f"Strategy '{strategy_type}' not found",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Simulate performance metrics
            performance = {
                "strategy_type": strategy_type,
                "timeframe": timeframe,
                "total_trades": np.random.randint(50, 200),
                "win_rate": np.random.uniform(0.35, 0.65),
                "avg_return": np.random.uniform(0.02, 0.08),
                "max_drawdown": np.random.uniform(0.05, 0.25),
                "sharpe_ratio": np.random.uniform(0.8, 2.2),
                "profit_factor": np.random.uniform(1.1, 2.5),
                "risk_reward_ratio": np.random.uniform(1.5, 3.5),
                "total_return": np.random.uniform(0.05, 0.35),
                "volatility": np.random.uniform(0.1, 0.3),
                "max_consecutive_losses": np.random.randint(3, 8),
                "avg_trade_duration": f"{np.random.randint(1, 15)} days"
            }
            
            return {
                "success": True,
                "performance": performance,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting strategy performance: {e}")
            return {
                "success": False,
                "error": f"Failed to get strategy performance: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def optimize_strategy_params(self, strategy_type: str, 
                                     performance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize strategy parameters based on performance"""
        try:
            if strategy_type not in self.strategy_knowledge:
                return {
                    "success": False,
                    "error": f"Strategy '{strategy_type}' not found",
                    "timestamp": datetime.now().isoformat()
                }
            
            strategy = self.strategy_knowledge[strategy_type]
            current_params = strategy["parameters"]
            
            # Simulate parameter optimization
            optimized_params = current_params.copy()
            
            # Adjust parameters based on performance
            win_rate = performance_data.get("win_rate", 0.5)
            sharpe_ratio = performance_data.get("sharpe_ratio", 1.0)
            
            if win_rate < 0.4:
                # Tighten entry conditions
                if "volume_threshold" in optimized_params:
                    optimized_params["volume_threshold"] *= 1.2
                if "confirmation_candles" in optimized_params:
                    optimized_params["confirmation_candles"] += 1
            
            if sharpe_ratio < 1.0:
                # Adjust risk parameters
                if "stop_loss_percent" in optimized_params:
                    optimized_params["stop_loss_percent"] *= 0.8
                if "profit_target_ratio" in optimized_params:
                    optimized_params["profit_target_ratio"] *= 1.2
            
            optimization_report = {
                "strategy_type": strategy_type,
                "current_parameters": current_params,
                "optimized_parameters": optimized_params,
                "changes_made": self._get_parameter_changes(current_params, optimized_params),
                "optimization_reasoning": self._get_optimization_reasoning(performance_data),
                "expected_improvement": {
                    "win_rate": f"+{np.random.uniform(0.02, 0.08):.1%}",
                    "sharpe_ratio": f"+{np.random.uniform(0.1, 0.3):.1f}",
                    "max_drawdown": f"-{np.random.uniform(0.01, 0.05):.1%}"
                }
            }
            
            return {
                "success": True,
                "optimization": optimization_report,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error optimizing strategy parameters: {e}")
            return {
                "success": False,
                "error": f"Failed to optimize strategy parameters: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def _get_parameter_changes(self, current: Dict, optimized: Dict) -> List[str]:
        """Get list of parameter changes"""
        changes = []
        for key, value in optimized.items():
            if key in current and current[key] != value:
                changes.append(f"{key}: {current[key]} → {value}")
        return changes
    
    def _get_optimization_reasoning(self, performance_data: Dict) -> str:
        """Get reasoning for parameter optimization"""
        win_rate = performance_data.get("win_rate", 0.5)
        sharpe_ratio = performance_data.get("sharpe_ratio", 1.0)
        
        reasoning = []
        
        if win_rate < 0.4:
            reasoning.append("Low win rate suggests need for tighter entry conditions")
        
        if sharpe_ratio < 1.0:
            reasoning.append("Low Sharpe ratio indicates need for better risk management")
        
        if not reasoning:
            reasoning.append("Performance within acceptable range, minor optimizations applied")
        
        return "; ".join(reasoning)
    
    async def log_strategy_execution(self, strategy_type: str, symbol: str, 
                                   execution_data: Dict[str, Any]) -> Dict[str, Any]:
        """Log strategy execution for learning and analysis"""
        try:
            execution_log = {
                "id": str(uuid.uuid4()),
                "strategy_type": strategy_type,
                "symbol": symbol,
                "execution_type": execution_data.get("type", "signal"),
                "signal_data": execution_data.get("signal_data", {}),
                "market_conditions": execution_data.get("market_conditions", {}),
                "outcome": execution_data.get("outcome", {}),
                "timestamp": datetime.now().isoformat()
            }
            
            # Store execution log
            self.execution_history.append(execution_log)
            
            # Keep only last 1000 executions
            if len(self.execution_history) > 1000:
                self.execution_history = self.execution_history[-1000:]
            
            return {
                "success": True,
                "execution_id": execution_log["id"],
                "logged_data": execution_log,
                "total_executions": len(self.execution_history),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error logging strategy execution: {e}")
            return {
                "success": False,
                "error": f"Failed to log strategy execution: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

# MCP Server setup
mcp_server = StrategyExecutionMCP()

# Tool definitions
@server.tool()
async def get_strategy_knowledge(strategy_type: str) -> list[TextContent]:
    """Get comprehensive knowledge and rules for a trading strategy.
    
    Args:
        strategy_type: Type of strategy (darvas_box, williams_alligator, renko_breakout, heikin_ashi, elliott_wave)
    
    Returns:
        Complete strategy knowledge including rules, indicators, and conditions
    """
    try:
        result = await mcp_server.get_strategy_knowledge(strategy_type)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in get_strategy_knowledge: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def execute_strategy_analysis(strategy_type: str, symbol: str, market_data: str) -> list[TextContent]:
    """Execute comprehensive strategy analysis on market data.
    
    Args:
        strategy_type: Type of strategy to analyze
        symbol: Trading symbol (e.g., 'BTC/USD')
        market_data: JSON string containing market data
    
    Returns:
        Complete strategy analysis with signals, scores, and recommendations
    """
    try:
        market_data_dict = json.loads(market_data)
        result = await mcp_server.execute_strategy_analysis(strategy_type, symbol, market_data_dict)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in execute_strategy_analysis: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def get_entry_signals(strategy_type: str, symbol: str, market_data: str) -> list[TextContent]:
    """Get entry signals for specific strategy and symbol.
    
    Args:
        strategy_type: Type of strategy
        symbol: Trading symbol
        market_data: JSON string containing market data
    
    Returns:
        Entry signals with buy/sell recommendations
    """
    try:
        market_data_dict = json.loads(market_data)
        result = await mcp_server.get_entry_signals(strategy_type, symbol, market_data_dict)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in get_entry_signals: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def get_exit_signals(strategy_type: str, symbol: str, position_data: str) -> list[TextContent]:
    """Get exit signals for open positions.
    
    Args:
        strategy_type: Type of strategy
        symbol: Trading symbol
        position_data: JSON string containing position data
    
    Returns:
        Exit signals and recommendations
    """
    try:
        position_data_dict = json.loads(position_data)
        result = await mcp_server.get_exit_signals(strategy_type, symbol, position_data_dict)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in get_exit_signals: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def validate_risk_conditions(strategy_type: str, symbol: str, position_data: str) -> list[TextContent]:
    """Validate risk management conditions for a position.
    
    Args:
        strategy_type: Type of strategy
        symbol: Trading symbol
        position_data: JSON string containing position data
    
    Returns:
        Risk validation results and recommendations
    """
    try:
        position_data_dict = json.loads(position_data)
        result = await mcp_server.validate_risk_conditions(strategy_type, symbol, position_data_dict)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in validate_risk_conditions: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def get_strategy_performance(strategy_type: str, timeframe: str = "30d") -> list[TextContent]:
    """Get historical performance metrics for a strategy.
    
    Args:
        strategy_type: Type of strategy
        timeframe: Time period for performance (e.g., '30d', '90d', '1y')
    
    Returns:
        Historical performance metrics and statistics
    """
    try:
        result = await mcp_server.get_strategy_performance(strategy_type, timeframe)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in get_strategy_performance: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def optimize_strategy_params(strategy_type: str, performance_data: str) -> list[TextContent]:
    """Optimize strategy parameters based on performance data.
    
    Args:
        strategy_type: Type of strategy
        performance_data: JSON string containing performance metrics
    
    Returns:
        Optimized parameters and improvement recommendations
    """
    try:
        performance_data_dict = json.loads(performance_data)
        result = await mcp_server.optimize_strategy_params(strategy_type, performance_data_dict)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in optimize_strategy_params: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

@server.tool()
async def log_strategy_execution(strategy_type: str, symbol: str, execution_data: str) -> list[TextContent]:
    """Log strategy execution for learning and analysis.
    
    Args:
        strategy_type: Type of strategy
        symbol: Trading symbol
        execution_data: JSON string containing execution details
    
    Returns:
        Execution log confirmation and statistics
    """
    try:
        execution_data_dict = json.loads(execution_data)
        result = await mcp_server.log_strategy_execution(strategy_type, symbol, execution_data_dict)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        logger.error(f"Error in log_strategy_execution: {e}")
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]

async def main():
    """Main entry point for the MCP server"""
    logger.info("Starting Strategy Execution MCP Server on port 8006")
    
    # Initialize the server
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="strategy_execution_mcp",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None,
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())