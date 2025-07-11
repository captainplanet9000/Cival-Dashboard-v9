"""
Market Regime Detection and Adaptation Service
Autonomous market condition analysis and strategy adaptation
Built on top of existing risk_management_service.py and autonomous infrastructure
"""

import asyncio
import logging
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import pandas as pd
from collections import defaultdict, deque
import json

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class MarketRegime(Enum):
    """Types of market regimes"""
    BULL_MARKET = "bull_market"
    BEAR_MARKET = "bear_market"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    TRENDING = "trending"
    MEAN_REVERTING = "mean_reverting"
    CRISIS = "crisis"
    RECOVERY = "recovery"

class RegimeConfidence(Enum):
    """Confidence levels for regime detection"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class AdaptationAction(Enum):
    """Types of adaptation actions"""
    INCREASE_POSITION = "increase_position"
    DECREASE_POSITION = "decrease_position"
    CHANGE_STRATEGY = "change_strategy"
    ADJUST_RISK_PARAMS = "adjust_risk_params"
    PAUSE_TRADING = "pause_trading"
    RESUME_TRADING = "resume_trading"
    EMERGENCY_EXIT = "emergency_exit"
    REBALANCE_PORTFOLIO = "rebalance_portfolio"

@dataclass
class MarketConditions:
    """Current market conditions"""
    timestamp: datetime
    volatility_1d: float
    volatility_7d: float
    volatility_30d: float
    trend_strength: float
    momentum: float
    volume_ratio: float
    correlation_breakdown: bool
    vix_level: float
    economic_indicators: Dict[str, float]
    sector_rotation: Dict[str, float]
    
@dataclass
class RegimeDetection:
    """Regime detection result"""
    regime_id: str
    primary_regime: MarketRegime
    secondary_regimes: List[MarketRegime]
    confidence: RegimeConfidence
    probability_scores: Dict[MarketRegime, float]
    market_conditions: MarketConditions
    detected_at: datetime
    expected_duration: Optional[int]  # seconds
    risk_level: float
    recommended_actions: List[AdaptationAction]
    metadata: Dict[str, Any]

@dataclass
class StrategyAdaptation:
    """Strategy adaptation recommendation"""
    adaptation_id: str
    target_strategy: str
    current_allocation: float
    recommended_allocation: float
    adaptation_actions: List[AdaptationAction]
    risk_adjustment: float
    expected_impact: Dict[str, float]
    implementation_priority: int
    rationale: str
    created_at: datetime
    expires_at: Optional[datetime]

@dataclass
class RegimeTransition:
    """Regime transition event"""
    transition_id: str
    from_regime: MarketRegime
    to_regime: MarketRegime
    transition_probability: float
    transition_speed: float  # How fast the transition occurred
    impact_assessment: Dict[str, float]
    adaptation_triggers: List[str]
    occurred_at: datetime

class MarketRegimeDetector:
    """
    Advanced market regime detection and adaptation system
    Integrates with existing risk management and autonomous infrastructure
    """
    
    def __init__(self):
        self.db_service = None
        self.event_service = None
        self.risk_service = None
        self.agent_coordinator = None
        
        # Detection data
        self.current_regime: Optional[RegimeDetection] = None
        self.regime_history: List[RegimeDetection] = []
        self.market_data_buffer = deque(maxlen=1000)  # Store recent market data
        self.regime_models: Dict[str, Any] = {}
        
        # Adaptation tracking
        self.active_adaptations: Dict[str, StrategyAdaptation] = {}
        self.adaptation_history: List[StrategyAdaptation] = []
        self.regime_transitions: List[RegimeTransition] = []
        
        # Configuration
        self.detection_config = {
            'min_detection_interval': 60,  # seconds
            'regime_confirmation_threshold': 0.7,
            'volatility_lookback_days': 30,
            'trend_lookback_days': 20,
            'momentum_lookback_days': 10,
            'transition_sensitivity': 0.8,
            'adaptation_cooldown': 300,  # seconds
        }
        
        # Regime thresholds
        self.regime_thresholds = {
            MarketRegime.HIGH_VOLATILITY: {'volatility_1d': 0.03, 'volatility_7d': 0.025},
            MarketRegime.LOW_VOLATILITY: {'volatility_1d': 0.01, 'volatility_7d': 0.008},
            MarketRegime.BULL_MARKET: {'trend_strength': 0.6, 'momentum': 0.3},
            MarketRegime.BEAR_MARKET: {'trend_strength': -0.6, 'momentum': -0.3},
            MarketRegime.SIDEWAYS: {'trend_strength': 0.2, 'volatility_ratio': 0.8},
            MarketRegime.CRISIS: {'volatility_1d': 0.05, 'correlation_breakdown': True},
        }
        
        # Background tasks
        self.detection_task = None
        self.adaptation_task = None
        self.monitoring_task = None
        
        logger.info("Market Regime Detector initialized")
    
    async def initialize(self):
        """Initialize the regime detection service"""
        try:
            # Get required services
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            self.event_service = registry.get_service("wallet_event_streaming_service")
            self.risk_service = registry.get_service("advanced_risk_management")
            self.agent_coordinator = registry.get_service("autonomous_agent_coordinator")
            
            # Create database tables
            if self.db_service:
                await self._create_regime_tables()
            
            # Load historical data
            await self._load_historical_data()
            
            # Initialize regime models
            await self._initialize_detection_models()
            
            # Start background tasks
            self.detection_task = asyncio.create_task(self._regime_detection_loop())
            self.adaptation_task = asyncio.create_task(self._adaptation_loop())
            self.monitoring_task = asyncio.create_task(self._monitoring_loop())
            
            logger.info("Market Regime Detector initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Market Regime Detector: {e}")
            raise
    
    async def analyze_market_conditions(self, market_data: Dict[str, Any]) -> MarketConditions:
        """Analyze current market conditions"""
        try:
            # Add market data to buffer
            self.market_data_buffer.append({
                'timestamp': datetime.now(timezone.utc),
                'data': market_data
            })
            
            # Calculate volatility metrics
            recent_data = list(self.market_data_buffer)[-100:]  # Last 100 data points
            prices = [d['data'].get('close', 0) for d in recent_data]
            
            volatility_1d = self._calculate_volatility(prices, 24)
            volatility_7d = self._calculate_volatility(prices, 168)
            volatility_30d = self._calculate_volatility(prices, 720)
            
            # Calculate trend and momentum
            trend_strength = self._calculate_trend_strength(prices)
            momentum = self._calculate_momentum(prices)
            
            # Calculate volume metrics
            volumes = [d['data'].get('volume', 0) for d in recent_data]
            volume_ratio = self._calculate_volume_ratio(volumes)
            
            # Check for correlation breakdown
            correlation_breakdown = await self._detect_correlation_breakdown(market_data)
            
            # Get VIX level (mock for now)
            vix_level = market_data.get('vix', 20.0)
            
            # Economic indicators
            economic_indicators = {
                'unemployment': market_data.get('unemployment', 4.0),
                'inflation': market_data.get('inflation', 2.5),
                'interest_rate': market_data.get('interest_rate', 5.0),
                'gdp_growth': market_data.get('gdp_growth', 2.1)
            }
            
            # Sector rotation analysis
            sector_rotation = await self._analyze_sector_rotation(market_data)
            
            conditions = MarketConditions(
                timestamp=datetime.now(timezone.utc),
                volatility_1d=volatility_1d,
                volatility_7d=volatility_7d,
                volatility_30d=volatility_30d,
                trend_strength=trend_strength,
                momentum=momentum,
                volume_ratio=volume_ratio,
                correlation_breakdown=correlation_breakdown,
                vix_level=vix_level,
                economic_indicators=economic_indicators,
                sector_rotation=sector_rotation
            )
            
            return conditions
            
        except Exception as e:
            logger.error(f"Failed to analyze market conditions: {e}")
            raise
    
    async def detect_regime(self, market_conditions: MarketConditions) -> RegimeDetection:
        """Detect current market regime"""
        try:
            # Calculate probability scores for each regime
            probability_scores = {}
            
            # Bull/Bear market detection
            if market_conditions.trend_strength > 0.6 and market_conditions.momentum > 0.3:
                probability_scores[MarketRegime.BULL_MARKET] = 0.8
            elif market_conditions.trend_strength < -0.6 and market_conditions.momentum < -0.3:
                probability_scores[MarketRegime.BEAR_MARKET] = 0.8
            else:
                probability_scores[MarketRegime.SIDEWAYS] = 0.6
            
            # Volatility regimes
            if market_conditions.volatility_1d > 0.03:
                probability_scores[MarketRegime.HIGH_VOLATILITY] = 0.9
            elif market_conditions.volatility_1d < 0.01:
                probability_scores[MarketRegime.LOW_VOLATILITY] = 0.8
            
            # Trending vs Mean Reverting
            if abs(market_conditions.trend_strength) > 0.4:
                probability_scores[MarketRegime.TRENDING] = 0.7
            else:
                probability_scores[MarketRegime.MEAN_REVERTING] = 0.6
            
            # Crisis detection
            if (market_conditions.volatility_1d > 0.05 or 
                market_conditions.correlation_breakdown or 
                market_conditions.vix_level > 30):
                probability_scores[MarketRegime.CRISIS] = 0.9
            
            # Recovery detection
            if (self.current_regime and 
                self.current_regime.primary_regime == MarketRegime.CRISIS and
                market_conditions.volatility_1d < 0.025 and
                market_conditions.trend_strength > 0.2):
                probability_scores[MarketRegime.RECOVERY] = 0.8
            
            # Determine primary regime
            primary_regime = max(probability_scores, key=probability_scores.get)
            primary_probability = probability_scores[primary_regime]
            
            # Determine confidence
            if primary_probability > 0.9:
                confidence = RegimeConfidence.VERY_HIGH
            elif primary_probability > 0.7:
                confidence = RegimeConfidence.HIGH
            elif primary_probability > 0.5:
                confidence = RegimeConfidence.MEDIUM
            else:
                confidence = RegimeConfidence.LOW
            
            # Secondary regimes
            secondary_regimes = [
                regime for regime, score in probability_scores.items()
                if regime != primary_regime and score > 0.3
            ]
            
            # Risk level assessment
            risk_level = self._calculate_risk_level(market_conditions, primary_regime)
            
            # Recommended actions
            recommended_actions = self._generate_regime_actions(primary_regime, market_conditions)
            
            # Expected duration
            expected_duration = self._estimate_regime_duration(primary_regime, market_conditions)
            
            detection = RegimeDetection(
                regime_id=str(uuid.uuid4()),
                primary_regime=primary_regime,
                secondary_regimes=secondary_regimes,
                confidence=confidence,
                probability_scores=probability_scores,
                market_conditions=market_conditions,
                detected_at=datetime.now(timezone.utc),
                expected_duration=expected_duration,
                risk_level=risk_level,
                recommended_actions=recommended_actions,
                metadata={
                    'detection_model': 'rule_based_v1',
                    'data_points_used': len(self.market_data_buffer)
                }
            )
            
            return detection
            
        except Exception as e:
            logger.error(f"Failed to detect market regime: {e}")
            raise
    
    async def adapt_strategies(self, regime_detection: RegimeDetection) -> List[StrategyAdaptation]:
        """Generate strategy adaptations based on regime detection"""
        try:
            adaptations = []
            
            # Get current strategy allocations
            current_allocations = await self._get_current_allocations()
            
            # Generate adaptations for each strategy
            for strategy_name, current_allocation in current_allocations.items():
                adaptation = await self._generate_strategy_adaptation(
                    strategy_name, 
                    current_allocation, 
                    regime_detection
                )
                
                if adaptation:
                    adaptations.append(adaptation)
                    self.active_adaptations[adaptation.adaptation_id] = adaptation
            
            # Store adaptations
            if self.db_service:
                for adaptation in adaptations:
                    await self._persist_adaptation(adaptation)
            
            # Emit adaptation events
            if self.event_service:
                await self.event_service.emit_event({
                    'event_type': 'market_regime.adaptations_generated',
                    'regime_id': regime_detection.regime_id,
                    'primary_regime': regime_detection.primary_regime.value,
                    'adaptations_count': len(adaptations),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            
            logger.info(f"Generated {len(adaptations)} strategy adaptations for regime {regime_detection.primary_regime.value}")
            return adaptations
            
        except Exception as e:
            logger.error(f"Failed to adapt strategies: {e}")
            return []
    
    async def get_current_regime(self) -> Optional[RegimeDetection]:
        """Get current market regime"""
        return self.current_regime
    
    async def get_regime_history(self, limit: int = 50) -> List[RegimeDetection]:
        """Get regime detection history"""
        return self.regime_history[-limit:]
    
    async def get_adaptation_status(self) -> Dict[str, Any]:
        """Get current adaptation status"""
        return {
            'active_adaptations': len(self.active_adaptations),
            'adaptations_by_action': {
                action.value: sum(1 for a in self.active_adaptations.values() 
                                if action in a.adaptation_actions)
                for action in AdaptationAction
            },
            'recent_transitions': len([t for t in self.regime_transitions 
                                     if t.occurred_at > datetime.now(timezone.utc) - timedelta(hours=24)]),
            'current_regime': self.current_regime.primary_regime.value if self.current_regime else None
        }
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            'service': 'market_regime_detector',
            'status': 'running',
            'current_regime': self.current_regime.primary_regime.value if self.current_regime else None,
            'regime_confidence': self.current_regime.confidence.value if self.current_regime else None,
            'active_adaptations': len(self.active_adaptations),
            'market_data_points': len(self.market_data_buffer),
            'regime_history_length': len(self.regime_history),
            'last_detection': self.current_regime.detected_at.isoformat() if self.current_regime else None,
            'detection_config': self.detection_config,
            'last_health_check': datetime.now(timezone.utc).isoformat()
        }
    
    # Private methods
    
    async def _regime_detection_loop(self):
        """Background task for regime detection"""
        while True:
            try:
                await asyncio.sleep(self.detection_config['min_detection_interval'])
                
                # Get latest market data
                market_data = await self._get_latest_market_data()
                if not market_data:
                    continue
                
                # Analyze conditions
                conditions = await self.analyze_market_conditions(market_data)
                
                # Detect regime
                new_detection = await self.detect_regime(conditions)
                
                # Check for regime change
                if (not self.current_regime or 
                    new_detection.primary_regime != self.current_regime.primary_regime or
                    new_detection.confidence != self.current_regime.confidence):
                    
                    # Record transition
                    if self.current_regime:
                        transition = RegimeTransition(
                            transition_id=str(uuid.uuid4()),
                            from_regime=self.current_regime.primary_regime,
                            to_regime=new_detection.primary_regime,
                            transition_probability=max(new_detection.probability_scores.values()),
                            transition_speed=1.0,  # Calculate based on time since last detection
                            impact_assessment=await self._assess_transition_impact(
                                self.current_regime.primary_regime, 
                                new_detection.primary_regime
                            ),
                            adaptation_triggers=new_detection.recommended_actions,
                            occurred_at=datetime.now(timezone.utc)
                        )
                        
                        self.regime_transitions.append(transition)
                        
                        # Emit transition event
                        if self.event_service:
                            await self.event_service.emit_event({
                                'event_type': 'market_regime.transition',
                                'transition_id': transition.transition_id,
                                'from_regime': transition.from_regime.value,
                                'to_regime': transition.to_regime.value,
                                'timestamp': transition.occurred_at.isoformat()
                            })
                    
                    # Update current regime
                    self.current_regime = new_detection
                    self.regime_history.append(new_detection)
                    
                    # Persist detection
                    if self.db_service:
                        await self._persist_detection(new_detection)
                    
                    # Generate adaptations
                    adaptations = await self.adapt_strategies(new_detection)
                    
                    logger.info(f"Regime changed to {new_detection.primary_regime.value} with {new_detection.confidence.value} confidence")
                
            except Exception as e:
                logger.error(f"Error in regime detection loop: {e}")
    
    async def _adaptation_loop(self):
        """Background task for adaptation monitoring"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                current_time = datetime.now(timezone.utc)
                
                # Remove expired adaptations
                expired_adaptations = [
                    adaptation_id for adaptation_id, adaptation in self.active_adaptations.items()
                    if adaptation.expires_at and adaptation.expires_at < current_time
                ]
                
                for adaptation_id in expired_adaptations:
                    del self.active_adaptations[adaptation_id]
                    logger.info(f"Adaptation {adaptation_id} expired")
                
                # Monitor adaptation effectiveness
                await self._monitor_adaptation_effectiveness()
                
            except Exception as e:
                logger.error(f"Error in adaptation loop: {e}")
    
    async def _monitoring_loop(self):
        """Background task for system monitoring"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                # Clean up old data
                cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)
                
                # Keep only recent regime history
                self.regime_history = [
                    detection for detection in self.regime_history
                    if detection.detected_at > cutoff_time
                ]
                
                # Keep only recent transitions
                self.regime_transitions = [
                    transition for transition in self.regime_transitions
                    if transition.occurred_at > cutoff_time
                ]
                
                # Update detection models if needed
                await self._update_detection_models()
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
    
    def _calculate_volatility(self, prices: List[float], window: int) -> float:
        """Calculate volatility over a window"""
        if len(prices) < window:
            return 0.0
        
        recent_prices = prices[-window:]
        returns = [
            (recent_prices[i] - recent_prices[i-1]) / recent_prices[i-1]
            for i in range(1, len(recent_prices))
        ]
        
        if not returns:
            return 0.0
        
        return np.std(returns) * np.sqrt(24)  # Annualized volatility
    
    def _calculate_trend_strength(self, prices: List[float]) -> float:
        """Calculate trend strength"""
        if len(prices) < 10:
            return 0.0
        
        # Linear regression slope
        x = np.arange(len(prices))
        y = np.array(prices)
        
        slope, _ = np.polyfit(x, y, 1)
        return slope / np.mean(prices)  # Normalized slope
    
    def _calculate_momentum(self, prices: List[float]) -> float:
        """Calculate momentum"""
        if len(prices) < 20:
            return 0.0
        
        # Rate of change over last 20 periods
        return (prices[-1] - prices[-20]) / prices[-20]
    
    def _calculate_volume_ratio(self, volumes: List[float]) -> float:
        """Calculate volume ratio"""
        if len(volumes) < 10:
            return 1.0
        
        recent_avg = np.mean(volumes[-5:])
        long_avg = np.mean(volumes[-20:])
        
        return recent_avg / long_avg if long_avg > 0 else 1.0
    
    async def _detect_correlation_breakdown(self, market_data: Dict[str, Any]) -> bool:
        """Detect correlation breakdown"""
        # Simplified correlation breakdown detection
        # In a real implementation, this would analyze correlations between assets
        volatility = market_data.get('volatility', 0.02)
        return volatility > 0.04
    
    async def _analyze_sector_rotation(self, market_data: Dict[str, Any]) -> Dict[str, float]:
        """Analyze sector rotation"""
        # Mock sector rotation analysis
        return {
            'technology': 0.15,
            'healthcare': 0.12,
            'financials': -0.08,
            'energy': 0.22,
            'utilities': -0.05
        }
    
    def _calculate_risk_level(self, conditions: MarketConditions, regime: MarketRegime) -> float:
        """Calculate risk level based on conditions and regime"""
        base_risk = 0.5
        
        # Adjust based on volatility
        if conditions.volatility_1d > 0.03:
            base_risk += 0.3
        elif conditions.volatility_1d < 0.01:
            base_risk -= 0.1
        
        # Adjust based on regime
        if regime == MarketRegime.CRISIS:
            base_risk += 0.4
        elif regime == MarketRegime.HIGH_VOLATILITY:
            base_risk += 0.2
        elif regime == MarketRegime.LOW_VOLATILITY:
            base_risk -= 0.1
        
        return min(1.0, max(0.0, base_risk))
    
    def _generate_regime_actions(self, regime: MarketRegime, conditions: MarketConditions) -> List[AdaptationAction]:
        """Generate recommended actions for a regime"""
        actions = []
        
        if regime == MarketRegime.CRISIS:
            actions.extend([
                AdaptationAction.DECREASE_POSITION,
                AdaptationAction.ADJUST_RISK_PARAMS,
                AdaptationAction.EMERGENCY_EXIT
            ])
        elif regime == MarketRegime.HIGH_VOLATILITY:
            actions.extend([
                AdaptationAction.DECREASE_POSITION,
                AdaptationAction.ADJUST_RISK_PARAMS
            ])
        elif regime == MarketRegime.BULL_MARKET:
            actions.extend([
                AdaptationAction.INCREASE_POSITION,
                AdaptationAction.CHANGE_STRATEGY
            ])
        elif regime == MarketRegime.BEAR_MARKET:
            actions.extend([
                AdaptationAction.DECREASE_POSITION,
                AdaptationAction.CHANGE_STRATEGY
            ])
        elif regime == MarketRegime.SIDEWAYS:
            actions.extend([
                AdaptationAction.CHANGE_STRATEGY,
                AdaptationAction.REBALANCE_PORTFOLIO
            ])
        
        return actions
    
    def _estimate_regime_duration(self, regime: MarketRegime, conditions: MarketConditions) -> Optional[int]:
        """Estimate regime duration in seconds"""
        # Based on historical patterns
        duration_estimates = {
            MarketRegime.CRISIS: 86400 * 7,  # 1 week
            MarketRegime.HIGH_VOLATILITY: 86400 * 3,  # 3 days
            MarketRegime.BULL_MARKET: 86400 * 90,  # 3 months
            MarketRegime.BEAR_MARKET: 86400 * 60,  # 2 months
            MarketRegime.SIDEWAYS: 86400 * 30,  # 1 month
        }
        
        return duration_estimates.get(regime)
    
    async def _get_current_allocations(self) -> Dict[str, float]:
        """Get current strategy allocations"""
        # Mock allocations - in real implementation, get from portfolio service
        return {
            'momentum_strategy': 0.3,
            'arbitrage_strategy': 0.2,
            'mean_reversion_strategy': 0.25,
            'risk_parity_strategy': 0.25
        }
    
    async def _generate_strategy_adaptation(self, strategy_name: str, current_allocation: float, 
                                          regime_detection: RegimeDetection) -> Optional[StrategyAdaptation]:
        """Generate adaptation for a specific strategy"""
        regime = regime_detection.primary_regime
        
        # Strategy-specific adaptations
        adaptation_rules = {
            'momentum_strategy': {
                MarketRegime.BULL_MARKET: {'allocation_change': 0.1, 'risk_adjustment': -0.1},
                MarketRegime.BEAR_MARKET: {'allocation_change': -0.2, 'risk_adjustment': 0.2},
                MarketRegime.HIGH_VOLATILITY: {'allocation_change': -0.15, 'risk_adjustment': 0.3},
                MarketRegime.CRISIS: {'allocation_change': -0.5, 'risk_adjustment': 0.5}
            },
            'mean_reversion_strategy': {
                MarketRegime.SIDEWAYS: {'allocation_change': 0.15, 'risk_adjustment': -0.1},
                MarketRegime.HIGH_VOLATILITY: {'allocation_change': 0.1, 'risk_adjustment': 0.1},
                MarketRegime.TRENDING: {'allocation_change': -0.2, 'risk_adjustment': 0.2}
            },
            'arbitrage_strategy': {
                MarketRegime.HIGH_VOLATILITY: {'allocation_change': 0.2, 'risk_adjustment': 0.0},
                MarketRegime.CRISIS: {'allocation_change': 0.1, 'risk_adjustment': 0.1}
            }
        }
        
        if strategy_name not in adaptation_rules:
            return None
        
        strategy_rules = adaptation_rules[strategy_name]
        if regime not in strategy_rules:
            return None
        
        rule = strategy_rules[regime]
        new_allocation = max(0.0, min(1.0, current_allocation + rule['allocation_change']))
        
        if abs(new_allocation - current_allocation) < 0.05:
            return None  # Change too small
        
        # Determine actions
        actions = []
        if new_allocation > current_allocation:
            actions.append(AdaptationAction.INCREASE_POSITION)
        else:
            actions.append(AdaptationAction.DECREASE_POSITION)
        
        actions.append(AdaptationAction.ADJUST_RISK_PARAMS)
        
        adaptation = StrategyAdaptation(
            adaptation_id=str(uuid.uuid4()),
            target_strategy=strategy_name,
            current_allocation=current_allocation,
            recommended_allocation=new_allocation,
            adaptation_actions=actions,
            risk_adjustment=rule['risk_adjustment'],
            expected_impact={
                'return_change': (new_allocation - current_allocation) * 0.1,
                'risk_change': rule['risk_adjustment']
            },
            implementation_priority=1 if regime == MarketRegime.CRISIS else 2,
            rationale=f"Regime change to {regime.value} suggests {strategy_name} allocation should be {'increased' if new_allocation > current_allocation else 'decreased'}",
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        
        return adaptation
    
    async def _get_latest_market_data(self) -> Optional[Dict[str, Any]]:
        """Get latest market data"""
        # Mock market data - in real implementation, get from market data service
        return {
            'close': 100.0 + np.random.normal(0, 2),
            'volume': 1000000 + np.random.normal(0, 100000),
            'volatility': 0.02 + np.random.normal(0, 0.005),
            'vix': 20.0 + np.random.normal(0, 3),
            'unemployment': 4.0,
            'inflation': 2.5,
            'interest_rate': 5.0,
            'gdp_growth': 2.1
        }
    
    async def _assess_transition_impact(self, from_regime: MarketRegime, to_regime: MarketRegime) -> Dict[str, float]:
        """Assess impact of regime transition"""
        # Mock impact assessment
        return {
            'portfolio_risk_change': 0.1,
            'expected_return_change': 0.05,
            'adaptation_urgency': 0.8 if to_regime == MarketRegime.CRISIS else 0.3
        }
    
    async def _monitor_adaptation_effectiveness(self):
        """Monitor how well adaptations are working"""
        # This would track actual performance vs expected
        pass
    
    async def _create_regime_tables(self):
        """Create database tables for regime detection"""
        try:
            # Regime detections table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS market_regime_detections (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    regime_id TEXT UNIQUE NOT NULL,
                    primary_regime TEXT NOT NULL,
                    secondary_regimes TEXT[],
                    confidence TEXT NOT NULL,
                    probability_scores JSONB,
                    market_conditions JSONB,
                    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    expected_duration INTEGER,
                    risk_level FLOAT,
                    recommended_actions TEXT[],
                    metadata JSONB
                )
            """)
            
            # Strategy adaptations table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS strategy_adaptations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    adaptation_id TEXT UNIQUE NOT NULL,
                    target_strategy TEXT NOT NULL,
                    current_allocation FLOAT,
                    recommended_allocation FLOAT,
                    adaptation_actions TEXT[],
                    risk_adjustment FLOAT,
                    expected_impact JSONB,
                    implementation_priority INTEGER,
                    rationale TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    expires_at TIMESTAMP WITH TIME ZONE
                )
            """)
            
            # Regime transitions table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS regime_transitions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    transition_id TEXT UNIQUE NOT NULL,
                    from_regime TEXT NOT NULL,
                    to_regime TEXT NOT NULL,
                    transition_probability FLOAT,
                    transition_speed FLOAT,
                    impact_assessment JSONB,
                    adaptation_triggers TEXT[],
                    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
        except Exception as e:
            logger.error(f"Failed to create regime tables: {e}")
            raise
    
    async def _load_historical_data(self):
        """Load historical regime data"""
        try:
            if not self.db_service:
                return
            
            # Load recent detections
            detections = await self.db_service.execute_query("""
                SELECT * FROM market_regime_detections 
                WHERE detected_at > NOW() - INTERVAL '7 days'
                ORDER BY detected_at DESC
                LIMIT 100
            """)
            
            # Load recent transitions
            transitions = await self.db_service.execute_query("""
                SELECT * FROM regime_transitions 
                WHERE occurred_at > NOW() - INTERVAL '7 days'
                ORDER BY occurred_at DESC
                LIMIT 50
            """)
            
            logger.info(f"Loaded {len(detections) if detections else 0} regime detections and {len(transitions) if transitions else 0} transitions")
            
        except Exception as e:
            logger.error(f"Failed to load historical data: {e}")
    
    async def _initialize_detection_models(self):
        """Initialize regime detection models"""
        # Initialize ML models for regime detection
        # For now, using rule-based approach
        self.regime_models['rule_based'] = {
            'version': '1.0',
            'initialized_at': datetime.now(timezone.utc)
        }
        
        logger.info("Regime detection models initialized")
    
    async def _persist_detection(self, detection: RegimeDetection):
        """Persist regime detection to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO market_regime_detections (
                    regime_id, primary_regime, secondary_regimes, confidence,
                    probability_scores, market_conditions, detected_at,
                    expected_duration, risk_level, recommended_actions, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, (
                detection.regime_id,
                detection.primary_regime.value,
                [r.value for r in detection.secondary_regimes],
                detection.confidence.value,
                json.dumps({k.value: v for k, v in detection.probability_scores.items()}),
                json.dumps(asdict(detection.market_conditions), default=str),
                detection.detected_at,
                detection.expected_duration,
                detection.risk_level,
                [a.value for a in detection.recommended_actions],
                json.dumps(detection.metadata)
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist detection: {e}")
    
    async def _persist_adaptation(self, adaptation: StrategyAdaptation):
        """Persist strategy adaptation to database"""
        try:
            if not self.db_service:
                return
            
            await self.db_service.execute_query("""
                INSERT INTO strategy_adaptations (
                    adaptation_id, target_strategy, current_allocation,
                    recommended_allocation, adaptation_actions, risk_adjustment,
                    expected_impact, implementation_priority, rationale,
                    created_at, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, (
                adaptation.adaptation_id,
                adaptation.target_strategy,
                adaptation.current_allocation,
                adaptation.recommended_allocation,
                [a.value for a in adaptation.adaptation_actions],
                adaptation.risk_adjustment,
                json.dumps(adaptation.expected_impact),
                adaptation.implementation_priority,
                adaptation.rationale,
                adaptation.created_at,
                adaptation.expires_at
            ))
            
        except Exception as e:
            logger.error(f"Failed to persist adaptation: {e}")
    
    async def _update_detection_models(self):
        """Update detection models based on recent performance"""
        # This would retrain/update ML models
        pass


# Factory function for service registry
def create_market_regime_detector():
    """Factory function to create MarketRegimeDetector instance"""
    return MarketRegimeDetector()