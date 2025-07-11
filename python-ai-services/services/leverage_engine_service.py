"""
Advanced Leverage Engine Service
Provides up to 20x leverage capabilities for autonomous trading agents
Integrated with risk management and portfolio optimization
"""

import asyncio
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import json
import logging
import numpy as np
from collections import defaultdict
from enum import Enum

from pydantic import BaseModel, Field, validator
from fastapi import HTTPException

# Internal imports
from models.trading_strategy_models import TradingPosition, TradingSignal, RiskLevel
from services.risk_management_service import get_risk_management_service
from services.portfolio_management_service import get_portfolio_management_service
from database.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class LeverageLevel(str, Enum):
    """Leverage level categories"""
    CONSERVATIVE = "conservative"  # 1x-3x
    MODERATE = "moderate"          # 3x-10x
    AGGRESSIVE = "aggressive"      # 10x-20x
    

class MarginStatus(str, Enum):
    """Margin status indicators"""
    SAFE = "safe"                 # <50% margin usage
    WARNING = "warning"           # 50-80% margin usage
    CRITICAL = "critical"         # 80-95% margin usage
    LIQUIDATION = "liquidation"   # >95% margin usage


class LeveragePosition(BaseModel):
    """Leveraged trading position"""
    position_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    asset: str
    side: str  # long/short
    size: Decimal
    entry_price: Decimal
    current_price: Decimal
    leverage_ratio: float = Field(ge=1.0, le=20.0)
    margin_used: Decimal
    unrealized_pnl: Decimal
    liquidation_price: Decimal
    margin_status: MarginStatus = MarginStatus.SAFE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('leverage_ratio')
    def validate_leverage(cls, v):
        if v < 1.0 or v > 20.0:
            raise ValueError('Leverage must be between 1x and 20x')
        return v


class LeverageRiskMetrics(BaseModel):
    """Risk metrics for leveraged positions"""
    agent_id: str
    total_margin_used: Decimal
    available_margin: Decimal
    margin_usage_percentage: float
    portfolio_leverage: float
    liquidation_risk_score: float  # 0-100
    estimated_liquidation_time: Optional[str] = None
    var_with_leverage: Decimal
    max_drawdown_with_leverage: Decimal
    recommended_leverage: float
    risk_level: RiskLevel


class LeverageEngineService:
    """Advanced leverage engine with 20x capability"""
    
    MAX_LEVERAGE = 20.0
    MARGIN_CALL_THRESHOLD = 0.8   # 80% margin usage
    LIQUIDATION_THRESHOLD = 0.95  # 95% margin usage
    MIN_MARGIN_BUFFER = 0.1       # 10% minimum margin buffer
    
    def __init__(self):
        self.active_positions: Dict[str, List[LeveragePosition]] = defaultdict(list)
        self.leverage_limits: Dict[str, float] = {}  # Per agent
        self.margin_requirements: Dict[str, Decimal] = {}
        self.risk_management = None
        self.portfolio_service = None
        self.supabase = None
        
    async def initialize(self):
        """Initialize service dependencies"""
        try:
            self.risk_management = await get_risk_management_service()
            self.portfolio_service = await get_portfolio_management_service()
            self.supabase = get_supabase_client()
            logger.info("Leverage engine service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize leverage engine: {e}")
            raise
    
    async def calculate_max_leverage(self, agent_id: str, asset: str, market_conditions: Dict) -> float:
        """Calculate maximum safe leverage for an agent and asset"""
        try:
            # Get agent risk profile
            agent_risk = await self._get_agent_risk_profile(agent_id)
            
            # Asset volatility analysis
            asset_volatility = market_conditions.get('volatility', 0.02)
            
            # Market condition adjustment
            market_sentiment = market_conditions.get('sentiment', 'neutral')
            
            # Base leverage calculation
            base_leverage = {
                'conservative': 3.0,
                'moderate': 10.0,
                'aggressive': 20.0
            }.get(agent_risk.get('risk_tolerance', 'moderate'), 10.0)
            
            # Volatility adjustment
            volatility_multiplier = max(0.3, 1.0 - (asset_volatility * 20))
            
            # Market sentiment adjustment
            sentiment_multiplier = {
                'bullish': 1.2,
                'neutral': 1.0,
                'bearish': 0.7
            }.get(market_sentiment, 1.0)
            
            # Calculate adjusted max leverage
            max_leverage = min(
                self.MAX_LEVERAGE,
                base_leverage * volatility_multiplier * sentiment_multiplier
            )
            
            # Ensure minimum 1x leverage
            return max(1.0, round(max_leverage, 2))
            
        except Exception as e:
            logger.error(f"Error calculating max leverage for {agent_id}: {e}")
            return 1.0  # Conservative fallback
    
    async def set_agent_leverage(self, agent_id: str, asset: str, leverage_ratio: float) -> bool:
        """Set leverage ratio for an agent's asset"""
        try:
            # Validate leverage ratio
            if leverage_ratio < 1.0 or leverage_ratio > self.MAX_LEVERAGE:
                raise ValueError(f"Leverage must be between 1x and {self.MAX_LEVERAGE}x")
            
            # Check if agent has sufficient margin
            margin_available = await self._get_available_margin(agent_id)
            required_margin = await self._calculate_required_margin(agent_id, asset, leverage_ratio)
            
            if required_margin > margin_available:
                logger.warning(f"Insufficient margin for {agent_id} leverage {leverage_ratio}x")
                return False
            
            # Store leverage setting
            if agent_id not in self.leverage_limits:
                self.leverage_limits[agent_id] = {}
            
            self.leverage_limits[agent_id][asset] = leverage_ratio
            
            # Update database
            await self._update_agent_leverage_db(agent_id, asset, leverage_ratio)
            
            logger.info(f"Set leverage {leverage_ratio}x for agent {agent_id} asset {asset}")
            return True
            
        except Exception as e:
            logger.error(f"Error setting leverage for {agent_id}: {e}")
            return False
    
    async def execute_leveraged_position(
        self, 
        agent_id: str, 
        position_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a leveraged trading position"""
        try:
            asset = position_data['asset']
            side = position_data['side']
            size = Decimal(str(position_data['size']))
            leverage_ratio = position_data.get('leverage', 1.0)
            
            # Validate leverage
            max_leverage = await self.calculate_max_leverage(
                agent_id, asset, position_data.get('market_conditions', {})
            )
            
            if leverage_ratio > max_leverage:
                raise ValueError(f"Leverage {leverage_ratio}x exceeds maximum {max_leverage}x")
            
            # Calculate position metrics
            entry_price = Decimal(str(position_data['price']))
            notional_size = size * leverage_ratio
            margin_required = size / Decimal(str(leverage_ratio))
            
            # Check margin availability
            available_margin = await self._get_available_margin(agent_id)
            if margin_required > available_margin:
                raise ValueError("Insufficient margin for leveraged position")
            
            # Calculate liquidation price
            liquidation_price = await self._calculate_liquidation_price(
                entry_price, side, leverage_ratio
            )
            
            # Create position
            position = LeveragePosition(
                agent_id=agent_id,
                asset=asset,
                side=side,
                size=notional_size,
                entry_price=entry_price,
                current_price=entry_price,
                leverage_ratio=leverage_ratio,
                margin_used=margin_required,
                unrealized_pnl=Decimal('0'),
                liquidation_price=liquidation_price
            )
            
            # Store position
            self.active_positions[agent_id].append(position)
            
            # Update margin requirements
            if agent_id not in self.margin_requirements:
                self.margin_requirements[agent_id] = Decimal('0')
            self.margin_requirements[agent_id] += margin_required
            
            # Save to database
            await self._save_position_db(position)
            
            # Execute trade through portfolio service
            trade_result = await self._execute_trade(position)
            
            logger.info(f"Executed leveraged position for {agent_id}: {leverage_ratio}x {side} {asset}")
            
            return {
                'success': True,
                'position_id': position.position_id,
                'leverage_ratio': leverage_ratio,
                'margin_used': float(margin_required),
                'liquidation_price': float(liquidation_price),
                'trade_result': trade_result
            }
            
        except Exception as e:
            logger.error(f"Error executing leveraged position for {agent_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def monitor_margin_requirements(self, agent_id: str) -> MarginStatus:
        """Monitor agent's margin usage and status"""
        try:
            # Get current positions
            positions = self.active_positions.get(agent_id, [])
            if not positions:
                return MarginStatus.SAFE
            
            # Calculate total margin usage
            total_margin_used = sum(pos.margin_used for pos in positions)
            available_margin = await self._get_available_margin(agent_id)
            total_margin = total_margin_used + available_margin
            
            if total_margin <= 0:
                return MarginStatus.LIQUIDATION
            
            margin_usage_percentage = float(total_margin_used / total_margin)
            
            # Determine status
            if margin_usage_percentage >= 0.95:
                return MarginStatus.LIQUIDATION
            elif margin_usage_percentage >= 0.8:
                return MarginStatus.CRITICAL
            elif margin_usage_percentage >= 0.5:
                return MarginStatus.WARNING
            else:
                return MarginStatus.SAFE
                
        except Exception as e:
            logger.error(f"Error monitoring margin for {agent_id}: {e}")
            return MarginStatus.CRITICAL  # Conservative fallback
    
    async def auto_delever_on_risk(self, agent_id: str, risk_threshold: float = 0.85) -> bool:
        """Automatically reduce leverage when risk threshold is breached"""
        try:
            margin_status = await self.monitor_margin_requirements(agent_id)
            
            if margin_status in [MarginStatus.CRITICAL, MarginStatus.LIQUIDATION]:
                logger.warning(f"Auto-deleveraging triggered for {agent_id}")
                
                # Get positions to close
                positions = self.active_positions.get(agent_id, [])
                positions_closed = 0
                
                # Sort by P&L (close losing positions first)
                positions.sort(key=lambda p: p.unrealized_pnl)
                
                for position in positions:
                    # Close position
                    close_result = await self._close_position(position)
                    if close_result:
                        positions_closed += 1
                        
                    # Check if we've reduced risk enough
                    current_status = await self.monitor_margin_requirements(agent_id)
                    if current_status == MarginStatus.SAFE:
                        break
                
                logger.info(f"Auto-deleveraging completed for {agent_id}: {positions_closed} positions closed")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error in auto-deleveraging for {agent_id}: {e}")
            return False
    
    async def get_leverage_risk_metrics(self, agent_id: str) -> LeverageRiskMetrics:
        """Get comprehensive leverage risk metrics for an agent"""
        try:
            positions = self.active_positions.get(agent_id, [])
            
            # Calculate metrics
            total_margin_used = sum(pos.margin_used for pos in positions)
            available_margin = await self._get_available_margin(agent_id)
            total_margin = total_margin_used + available_margin
            
            margin_usage_percentage = float(total_margin_used / total_margin) if total_margin > 0 else 0
            
            # Portfolio leverage (weighted average)
            if positions:
                total_notional = sum(pos.size for pos in positions)
                portfolio_leverage = float(total_notional / total_margin_used) if total_margin_used > 0 else 1.0
            else:
                portfolio_leverage = 1.0
            
            # Liquidation risk score (0-100)
            liquidation_risk_score = min(100, margin_usage_percentage * 100)
            
            # VAR with leverage
            base_var = Decimal('1000')  # Placeholder - integrate with risk service
            var_with_leverage = base_var * Decimal(str(portfolio_leverage))
            
            # Max drawdown with leverage
            max_drawdown_with_leverage = Decimal('0.1') * Decimal(str(portfolio_leverage))
            
            # Recommended leverage
            recommended_leverage = await self._calculate_recommended_leverage(agent_id)
            
            # Risk level
            if margin_usage_percentage >= 0.8:
                risk_level = RiskLevel.HIGH
            elif margin_usage_percentage >= 0.5:
                risk_level = RiskLevel.MEDIUM
            else:
                risk_level = RiskLevel.LOW
            
            return LeverageRiskMetrics(
                agent_id=agent_id,
                total_margin_used=total_margin_used,
                available_margin=available_margin,
                margin_usage_percentage=margin_usage_percentage,
                portfolio_leverage=portfolio_leverage,
                liquidation_risk_score=liquidation_risk_score,
                var_with_leverage=var_with_leverage,
                max_drawdown_with_leverage=max_drawdown_with_leverage,
                recommended_leverage=recommended_leverage,
                risk_level=risk_level
            )
            
        except Exception as e:
            logger.error(f"Error calculating leverage risk metrics for {agent_id}: {e}")
            # Return safe fallback metrics
            return LeverageRiskMetrics(
                agent_id=agent_id,
                total_margin_used=Decimal('0'),
                available_margin=Decimal('1000'),
                margin_usage_percentage=0.0,
                portfolio_leverage=1.0,
                liquidation_risk_score=0.0,
                var_with_leverage=Decimal('100'),
                max_drawdown_with_leverage=Decimal('0.02'),
                recommended_leverage=1.0,
                risk_level=RiskLevel.LOW
            )
    
    async def coordinate_leverage_across_agents(self, agent_ids: List[str]) -> Dict[str, Any]:
        """Coordinate leverage allocation across multiple agents"""
        try:
            coordination_result = {
                'total_portfolio_leverage': 0.0,
                'agent_allocations': {},
                'risk_distribution': {},
                'recommendations': []
            }
            
            total_capital = Decimal('0')
            agent_metrics = {}
            
            # Collect metrics for each agent
            for agent_id in agent_ids:
                metrics = await self.get_leverage_risk_metrics(agent_id)
                agent_metrics[agent_id] = metrics
                total_capital += metrics.available_margin + metrics.total_margin_used
            
            # Calculate optimal leverage distribution
            for agent_id in agent_ids:
                metrics = agent_metrics[agent_id]
                
                # Capital allocation percentage
                agent_capital = metrics.available_margin + metrics.total_margin_used
                capital_percentage = float(agent_capital / total_capital) if total_capital > 0 else 0
                
                # Risk-adjusted leverage recommendation
                if metrics.risk_level == RiskLevel.LOW:
                    recommended_leverage = min(15.0, metrics.recommended_leverage * 1.2)
                elif metrics.risk_level == RiskLevel.MEDIUM:
                    recommended_leverage = metrics.recommended_leverage
                else:
                    recommended_leverage = max(1.0, metrics.recommended_leverage * 0.8)
                
                coordination_result['agent_allocations'][agent_id] = {
                    'capital_percentage': capital_percentage,
                    'current_leverage': metrics.portfolio_leverage,
                    'recommended_leverage': recommended_leverage,
                    'margin_usage': metrics.margin_usage_percentage
                }
                
                coordination_result['risk_distribution'][agent_id] = {
                    'risk_level': metrics.risk_level.value,
                    'liquidation_risk': metrics.liquidation_risk_score,
                    'var_contribution': float(metrics.var_with_leverage)
                }
            
            # Calculate total portfolio leverage
            weighted_leverage = sum(
                metrics.portfolio_leverage * float(metrics.total_margin_used) 
                for metrics in agent_metrics.values()
            )
            total_margin_used = sum(metrics.total_margin_used for metrics in agent_metrics.values())
            
            coordination_result['total_portfolio_leverage'] = float(
                weighted_leverage / total_margin_used
            ) if total_margin_used > 0 else 1.0
            
            # Generate recommendations
            if coordination_result['total_portfolio_leverage'] > 10.0:
                coordination_result['recommendations'].append(
                    "Consider reducing overall portfolio leverage below 10x"
                )
            
            high_risk_agents = [
                agent_id for agent_id, metrics in agent_metrics.items()
                if metrics.risk_level == RiskLevel.HIGH
            ]
            if high_risk_agents:
                coordination_result['recommendations'].append(
                    f"High risk agents requiring attention: {', '.join(high_risk_agents)}"
                )
            
            logger.info(f"Leverage coordination completed for {len(agent_ids)} agents")
            return coordination_result
            
        except Exception as e:
            logger.error(f"Error coordinating leverage across agents: {e}")
            return {
                'error': str(e),
                'total_portfolio_leverage': 1.0,
                'agent_allocations': {},
                'risk_distribution': {},
                'recommendations': ['Error in coordination - using conservative settings']
            }
    
    # Helper methods
    
    async def _get_agent_risk_profile(self, agent_id: str) -> Dict[str, Any]:
        """Get agent's risk profile from database"""
        try:
            if self.supabase:
                result = self.supabase.table('agents').select('*').eq('agent_id', agent_id).execute()
                if result.data:
                    return result.data[0]
            
            # Fallback
            return {'risk_tolerance': 'moderate'}
        except Exception as e:
            logger.error(f"Error getting agent risk profile: {e}")
            return {'risk_tolerance': 'moderate'}
    
    async def _get_available_margin(self, agent_id: str) -> Decimal:
        """Get agent's available margin"""
        try:
            # Get from portfolio service
            if self.portfolio_service:
                portfolio = await self.portfolio_service.get_portfolio_summary(agent_id)
                return Decimal(str(portfolio.get('cash_balance', 1000)))
            
            # Fallback
            return Decimal('1000')
        except Exception as e:
            logger.error(f"Error getting available margin: {e}")
            return Decimal('1000')
    
    async def _calculate_required_margin(self, agent_id: str, asset: str, leverage: float) -> Decimal:
        """Calculate required margin for leverage"""
        try:
            # Base position size (from portfolio or default)
            base_position = Decimal('100')  # Default $100 position
            return base_position / Decimal(str(leverage))
        except Exception as e:
            logger.error(f"Error calculating required margin: {e}")
            return Decimal('100')
    
    async def _calculate_liquidation_price(self, entry_price: Decimal, side: str, leverage: float) -> Decimal:
        """Calculate liquidation price for position"""
        try:
            # Simplified liquidation calculation
            margin_percentage = 1.0 / leverage
            liquidation_buffer = 0.05  # 5% buffer before liquidation
            
            if side.lower() == 'long':
                liquidation_price = entry_price * Decimal(str(1 - margin_percentage + liquidation_buffer))
            else:  # short
                liquidation_price = entry_price * Decimal(str(1 + margin_percentage - liquidation_buffer))
            
            return liquidation_price
        except Exception as e:
            logger.error(f"Error calculating liquidation price: {e}")
            return entry_price * Decimal('0.9')  # Conservative fallback
    
    async def _calculate_recommended_leverage(self, agent_id: str) -> float:
        """Calculate AI-recommended leverage for agent"""
        try:
            # Get agent performance and risk metrics
            margin_status = await self.monitor_margin_requirements(agent_id)
            
            # Base recommendation based on current status
            if margin_status == MarginStatus.SAFE:
                return 8.0
            elif margin_status == MarginStatus.WARNING:
                return 5.0
            elif margin_status == MarginStatus.CRITICAL:
                return 2.0
            else:
                return 1.0
        except Exception as e:
            logger.error(f"Error calculating recommended leverage: {e}")
            return 3.0
    
    async def _update_agent_leverage_db(self, agent_id: str, asset: str, leverage: float):
        """Update agent leverage in database"""
        try:
            if self.supabase:
                self.supabase.table('agent_leverage_settings').upsert({
                    'agent_id': agent_id,
                    'asset': asset,
                    'leverage_ratio': leverage,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error updating leverage in database: {e}")
    
    async def _save_position_db(self, position: LeveragePosition):
        """Save position to database"""
        try:
            if self.supabase:
                self.supabase.table('leverage_positions').insert({
                    'position_id': position.position_id,
                    'agent_id': position.agent_id,
                    'asset': position.asset,
                    'side': position.side,
                    'size': str(position.size),
                    'entry_price': str(position.entry_price),
                    'leverage_ratio': position.leverage_ratio,
                    'margin_used': str(position.margin_used),
                    'liquidation_price': str(position.liquidation_price),
                    'created_at': position.created_at.isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error saving position to database: {e}")
    
    async def _execute_trade(self, position: LeveragePosition) -> Dict[str, Any]:
        """Execute trade through portfolio service"""
        try:
            # Placeholder - integrate with actual trading execution
            return {
                'success': True,
                'order_id': str(uuid.uuid4()),
                'executed_price': str(position.entry_price),
                'executed_size': str(position.size)
            }
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _close_position(self, position: LeveragePosition) -> bool:
        """Close a leveraged position"""
        try:
            # Remove from active positions
            if position.agent_id in self.active_positions:
                self.active_positions[position.agent_id] = [
                    p for p in self.active_positions[position.agent_id] 
                    if p.position_id != position.position_id
                ]
            
            # Update margin requirements
            if position.agent_id in self.margin_requirements:
                self.margin_requirements[position.agent_id] -= position.margin_used
                if self.margin_requirements[position.agent_id] < 0:
                    self.margin_requirements[position.agent_id] = Decimal('0')
            
            logger.info(f"Closed position {position.position_id} for agent {position.agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error closing position: {e}")
            return False


# Global service instance
_leverage_engine_service = None

async def get_leverage_engine_service() -> LeverageEngineService:
    """Get or create leverage engine service instance"""
    global _leverage_engine_service
    if _leverage_engine_service is None:
        _leverage_engine_service = LeverageEngineService()
        await _leverage_engine_service.initialize()
    return _leverage_engine_service