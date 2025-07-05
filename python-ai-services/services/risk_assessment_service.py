#!/usr/bin/env python3
"""
Risk Assessment Service
Advanced risk analysis and portfolio risk management
"""

import asyncio
import json
import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from pydantic import BaseModel
import statistics

# Configure logging
logger = logging.getLogger(__name__)

class RiskMetrics(BaseModel):
    """Risk metrics for portfolio assessment"""
    value_at_risk: float  # VaR (1-day, 95% confidence)
    expected_shortfall: float  # CVaR/ES
    max_drawdown: float  # Maximum historical drawdown
    sharpe_ratio: float  # Risk-adjusted return
    sortino_ratio: float  # Downside deviation adjusted return
    beta: float  # Market beta
    alpha: float  # Alpha (excess return)
    volatility: float  # Annualized volatility
    correlation_risk: float  # Portfolio correlation risk
    concentration_risk: float  # Position concentration risk

class PositionRisk(BaseModel):
    """Risk assessment for individual position"""
    symbol: str
    position_size: float
    market_value: float
    weight: float  # % of portfolio
    individual_var: float
    contribution_to_var: float
    volatility: float
    beta: float
    correlation: float
    liquidity_risk: str  # "low", "medium", "high"
    credit_risk: str  # "low", "medium", "high"

class ScenarioAnalysis(BaseModel):
    """Stress test scenario analysis"""
    scenario_name: str
    description: str
    probability: float  # Estimated probability
    portfolio_impact: float  # % impact on portfolio
    positions_affected: List[str]
    recovery_time: str  # Estimated recovery time
    mitigation_strategies: List[str]
    severity: str  # "low", "medium", "high", "extreme"

class RiskAlert(BaseModel):
    """Risk alert for monitoring"""
    alert_id: str
    severity: str  # "info", "warning", "critical"
    message: str
    affected_positions: List[str]
    recommended_actions: List[str]
    timestamp: datetime
    resolved: bool = False

class RiskLimits(BaseModel):
    """Risk limits configuration"""
    max_position_size: float = 0.1  # 10% max position
    max_sector_exposure: float = 0.3  # 30% max sector
    max_var: float = 0.05  # 5% max VaR
    max_drawdown: float = 0.15  # 15% max drawdown
    min_sharpe_ratio: float = 0.5  # Minimum Sharpe ratio
    max_correlation: float = 0.8  # Maximum position correlation

class RiskAssessmentService:
    """Advanced risk assessment and monitoring service"""
    
    def __init__(self):
        self.risk_cache = {}
        self.cache_duration = timedelta(minutes=1)
        self.price_history = {}  # Store price history for calculations
        self.risk_limits = RiskLimits()
        self.active_alerts = []
        
    async def initialize(self) -> bool:
        """Initialize the risk assessment service"""
        try:
            logger.info("Risk assessment service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize risk assessment service: {e}")
            return False
    
    async def calculate_portfolio_risk(self, portfolio: Dict[str, Any], 
                                     market_data: Dict[str, Any]) -> RiskMetrics:
        """Calculate comprehensive portfolio risk metrics"""
        try:
            # Cache check
            cache_key = f"portfolio_risk_{hash(str(portfolio))}"
            if cache_key in self.risk_cache:
                cached_result, timestamp = self.risk_cache[cache_key]
                if datetime.now() - timestamp < self.cache_duration:
                    return cached_result
            
            positions = portfolio.get("positions", [])
            total_value = portfolio.get("total_value", 100000)
            
            if not positions:
                return await self._mock_risk_metrics()
            
            # Calculate individual position metrics
            position_metrics = []
            for position in positions:
                symbol = position.get("symbol", "")
                market_value = position.get("market_value", 0)
                
                pos_risk = await self._calculate_position_risk(position, market_data, total_value)
                position_metrics.append(pos_risk)
            
            # Calculate portfolio-level metrics
            portfolio_var = self._calculate_portfolio_var(position_metrics, total_value)
            expected_shortfall = portfolio_var * 1.3  # Approximation
            max_drawdown = await self._calculate_max_drawdown(portfolio)
            sharpe_ratio = await self._calculate_sharpe_ratio(portfolio)
            sortino_ratio = await self._calculate_sortino_ratio(portfolio)
            beta = self._calculate_portfolio_beta(position_metrics)
            alpha = await self._calculate_alpha(portfolio, market_data)
            volatility = self._calculate_portfolio_volatility(position_metrics)
            correlation_risk = self._calculate_correlation_risk(position_metrics)
            concentration_risk = self._calculate_concentration_risk(position_metrics)
            
            result = RiskMetrics(
                value_at_risk=round(portfolio_var, 4),
                expected_shortfall=round(expected_shortfall, 4),
                max_drawdown=round(max_drawdown, 4),
                sharpe_ratio=round(sharpe_ratio, 2),
                sortino_ratio=round(sortino_ratio, 2),
                beta=round(beta, 2),
                alpha=round(alpha, 4),
                volatility=round(volatility, 4),
                correlation_risk=round(correlation_risk, 4),
                concentration_risk=round(concentration_risk, 4)
            )
            
            # Cache result
            self.risk_cache[cache_key] = (result, datetime.now())
            
            return result
            
        except Exception as e:
            logger.error(f"Portfolio risk calculation failed: {e}")
            return await self._mock_risk_metrics()
    
    async def assess_position_risk(self, position: Dict[str, Any], 
                                 portfolio_context: Dict[str, Any],
                                 market_data: Dict[str, Any]) -> PositionRisk:
        """Assess risk for individual position"""
        try:
            symbol = position.get("symbol", "")
            quantity = position.get("quantity", 0)
            market_value = position.get("market_value", 0)
            total_portfolio_value = portfolio_context.get("total_value", 100000)
            
            weight = market_value / total_portfolio_value if total_portfolio_value > 0 else 0
            
            # Get market data for symbol
            symbol_data = market_data.get(symbol, {})
            price_volatility = self._estimate_volatility(symbol, symbol_data)
            
            # Calculate risk metrics
            individual_var = market_value * price_volatility * 1.65  # 95% confidence
            contribution_to_var = individual_var * weight
            beta = self._estimate_beta(symbol, symbol_data)
            correlation = self._estimate_correlation(symbol, portfolio_context)
            
            # Assess qualitative risks
            liquidity_risk = self._assess_liquidity_risk(symbol, symbol_data)
            credit_risk = self._assess_credit_risk(symbol, symbol_data)
            
            return PositionRisk(
                symbol=symbol,
                position_size=quantity,
                market_value=market_value,
                weight=round(weight, 4),
                individual_var=round(individual_var, 2),
                contribution_to_var=round(contribution_to_var, 2),
                volatility=round(price_volatility, 4),
                beta=round(beta, 2),
                correlation=round(correlation, 2),
                liquidity_risk=liquidity_risk,
                credit_risk=credit_risk
            )
            
        except Exception as e:
            logger.error(f"Position risk assessment failed: {e}")
            return await self._mock_position_risk(position.get("symbol", "UNKNOWN"))
    
    async def run_stress_tests(self, portfolio: Dict[str, Any], 
                             scenarios: List[str] = None) -> List[ScenarioAnalysis]:
        """Run stress test scenarios on portfolio"""
        try:
            if scenarios is None:
                scenarios = [
                    "Market Crash (-20%)",
                    "Crypto Winter (-50%)",
                    "Interest Rate Spike (+2%)",
                    "Liquidity Crisis",
                    "Regulatory Crackdown",
                    "Black Swan Event"
                ]
            
            analyses = []
            
            for scenario in scenarios:
                analysis = await self._analyze_scenario(portfolio, scenario)
                analyses.append(analysis)
            
            return analyses
            
        except Exception as e:
            logger.error(f"Stress testing failed: {e}")
            return []
    
    async def monitor_risk_limits(self, portfolio: Dict[str, Any], 
                                market_data: Dict[str, Any]) -> List[RiskAlert]:
        """Monitor portfolio against risk limits"""
        try:
            alerts = []
            
            # Calculate current risk metrics
            risk_metrics = await self.calculate_portfolio_risk(portfolio, market_data)
            positions = portfolio.get("positions", [])
            total_value = portfolio.get("total_value", 100000)
            
            # Check VaR limit
            if risk_metrics.value_at_risk > self.risk_limits.max_var:
                alerts.append(RiskAlert(
                    alert_id=f"var_limit_{datetime.now().timestamp()}",
                    severity="critical",
                    message=f"Portfolio VaR ({risk_metrics.value_at_risk:.2%}) exceeds limit ({self.risk_limits.max_var:.2%})",
                    affected_positions=[p.get("symbol", "") for p in positions],
                    recommended_actions=[
                        "Reduce position sizes",
                        "Increase diversification",
                        "Add hedging positions"
                    ],
                    timestamp=datetime.now()
                ))
            
            # Check position concentration
            for position in positions:
                weight = position.get("market_value", 0) / total_value if total_value > 0 else 0
                if weight > self.risk_limits.max_position_size:
                    alerts.append(RiskAlert(
                        alert_id=f"concentration_{position.get('symbol', 'unknown')}_{datetime.now().timestamp()}",
                        severity="warning",
                        message=f"Position {position.get('symbol', 'UNKNOWN')} ({weight:.2%}) exceeds size limit ({self.risk_limits.max_position_size:.2%})",
                        affected_positions=[position.get("symbol", "")],
                        recommended_actions=[
                            f"Reduce {position.get('symbol', 'UNKNOWN')} position",
                            "Rebalance portfolio",
                            "Consider profit taking"
                        ],
                        timestamp=datetime.now()
                    ))
            
            # Check drawdown
            if risk_metrics.max_drawdown > self.risk_limits.max_drawdown:
                alerts.append(RiskAlert(
                    alert_id=f"drawdown_limit_{datetime.now().timestamp()}",
                    severity="critical",
                    message=f"Maximum drawdown ({risk_metrics.max_drawdown:.2%}) exceeds limit ({self.risk_limits.max_drawdown:.2%})",
                    affected_positions=[p.get("symbol", "") for p in positions],
                    recommended_actions=[
                        "Implement stop losses",
                        "Reduce overall exposure",
                        "Review risk management strategy"
                    ],
                    timestamp=datetime.now()
                ))
            
            # Check Sharpe ratio
            if risk_metrics.sharpe_ratio < self.risk_limits.min_sharpe_ratio:
                alerts.append(RiskAlert(
                    alert_id=f"sharpe_limit_{datetime.now().timestamp()}",
                    severity="warning",
                    message=f"Sharpe ratio ({risk_metrics.sharpe_ratio:.2f}) below minimum ({self.risk_limits.min_sharpe_ratio:.2f})",
                    affected_positions=[p.get("symbol", "") for p in positions],
                    recommended_actions=[
                        "Optimize position sizing",
                        "Review strategy performance",
                        "Consider alternative assets"
                    ],
                    timestamp=datetime.now()
                ))
            
            # Store active alerts
            self.active_alerts.extend(alerts)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Risk limit monitoring failed: {e}")
            return []
    
    async def calculate_optimal_position_size(self, symbol: str, 
                                           portfolio: Dict[str, Any],
                                           risk_tolerance: float = 0.02) -> float:
        """Calculate optimal position size using Kelly criterion"""
        try:
            # Simplified Kelly criterion calculation
            # In practice, this would use historical return data
            
            total_value = portfolio.get("total_value", 100000)
            estimated_win_rate = 0.55  # 55% win rate assumption
            estimated_avg_win = 0.05   # 5% average win
            estimated_avg_loss = 0.03  # 3% average loss
            
            # Kelly formula: f = (bp - q) / b
            # where b = odds, p = win probability, q = loss probability
            b = estimated_avg_win / estimated_avg_loss
            p = estimated_win_rate
            q = 1 - p
            
            kelly_fraction = (b * p - q) / b
            
            # Apply risk tolerance as a multiplier (typically 0.25 to 0.5 of Kelly)
            safe_kelly = kelly_fraction * 0.25
            
            # Apply position size limits
            max_position_pct = min(safe_kelly, self.risk_limits.max_position_size)
            
            # Calculate dollar amount
            position_size = total_value * max_position_pct
            
            return max(0, position_size)  # Ensure non-negative
            
        except Exception as e:
            logger.error(f"Optimal position size calculation failed: {e}")
            return total_value * 0.01  # Default to 1% of portfolio
    
    # Private helper methods
    async def _calculate_position_risk(self, position: Dict[str, Any], 
                                     market_data: Dict[str, Any],
                                     total_value: float) -> PositionRisk:
        """Calculate risk metrics for a position"""
        return await self.assess_position_risk(position, {"total_value": total_value}, market_data)
    
    def _calculate_portfolio_var(self, position_metrics: List[PositionRisk], 
                               total_value: float) -> float:
        """Calculate portfolio Value at Risk"""
        try:
            if not position_metrics:
                return 0.0
            
            # Simplified VaR calculation (assumes no correlation for simplicity)
            individual_vars = [pos.individual_var for pos in position_metrics]
            
            # Portfolio VaR (simplified, no correlation matrix)
            portfolio_var = math.sqrt(sum(var ** 2 for var in individual_vars))
            
            return portfolio_var / total_value if total_value > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Portfolio VaR calculation failed: {e}")
            return 0.05  # Default 5%
    
    async def _calculate_max_drawdown(self, portfolio: Dict[str, Any]) -> float:
        """Calculate maximum historical drawdown"""
        try:
            # Mock calculation - in practice would use historical portfolio values
            daily_returns = portfolio.get("daily_returns", [-0.02, 0.01, -0.015, 0.03, -0.01])
            
            if not daily_returns:
                return 0.0
            
            # Calculate cumulative returns
            cumulative = 1.0
            peak = 1.0
            max_dd = 0.0
            
            for ret in daily_returns:
                cumulative *= (1 + ret)
                if cumulative > peak:
                    peak = cumulative
                
                drawdown = (peak - cumulative) / peak
                max_dd = max(max_dd, drawdown)
            
            return max_dd
            
        except Exception as e:
            logger.error(f"Max drawdown calculation failed: {e}")
            return 0.05  # Default 5%
    
    async def _calculate_sharpe_ratio(self, portfolio: Dict[str, Any]) -> float:
        """Calculate Sharpe ratio"""
        try:
            # Mock calculation
            annual_return = portfolio.get("annual_return", 0.08)  # 8% default
            risk_free_rate = 0.02  # 2% risk-free rate
            volatility = portfolio.get("volatility", 0.15)  # 15% volatility
            
            if volatility == 0:
                return 0.0
            
            return (annual_return - risk_free_rate) / volatility
            
        except Exception as e:
            logger.error(f"Sharpe ratio calculation failed: {e}")
            return 0.5  # Default
    
    async def _calculate_sortino_ratio(self, portfolio: Dict[str, Any]) -> float:
        """Calculate Sortino ratio (downside deviation)"""
        try:
            # Mock calculation
            annual_return = portfolio.get("annual_return", 0.08)
            risk_free_rate = 0.02
            downside_deviation = portfolio.get("downside_deviation", 0.10)
            
            if downside_deviation == 0:
                return 0.0
            
            return (annual_return - risk_free_rate) / downside_deviation
            
        except Exception as e:
            logger.error(f"Sortino ratio calculation failed: {e}")
            return 0.7  # Default
    
    def _calculate_portfolio_beta(self, position_metrics: List[PositionRisk]) -> float:
        """Calculate portfolio beta"""
        try:
            if not position_metrics:
                return 1.0
            
            # Weighted average of position betas
            total_weight = sum(pos.weight for pos in position_metrics)
            
            if total_weight == 0:
                return 1.0
            
            weighted_beta = sum(pos.beta * pos.weight for pos in position_metrics)
            return weighted_beta / total_weight
            
        except Exception as e:
            logger.error(f"Portfolio beta calculation failed: {e}")
            return 1.0
    
    async def _calculate_alpha(self, portfolio: Dict[str, Any], 
                             market_data: Dict[str, Any]) -> float:
        """Calculate portfolio alpha"""
        try:
            # Mock alpha calculation
            portfolio_return = portfolio.get("annual_return", 0.08)
            market_return = 0.07  # Assume 7% market return
            beta = 1.0  # Portfolio beta
            risk_free_rate = 0.02
            
            alpha = portfolio_return - (risk_free_rate + beta * (market_return - risk_free_rate))
            return alpha
            
        except Exception as e:
            logger.error(f"Alpha calculation failed: {e}")
            return 0.01  # Default 1%
    
    def _calculate_portfolio_volatility(self, position_metrics: List[PositionRisk]) -> float:
        """Calculate portfolio volatility"""
        try:
            if not position_metrics:
                return 0.15  # Default 15%
            
            # Simplified volatility calculation
            weighted_volatilities = [pos.volatility * pos.weight for pos in position_metrics]
            return sum(weighted_volatilities)
            
        except Exception as e:
            logger.error(f"Portfolio volatility calculation failed: {e}")
            return 0.15
    
    def _calculate_correlation_risk(self, position_metrics: List[PositionRisk]) -> float:
        """Calculate correlation risk score"""
        try:
            if len(position_metrics) < 2:
                return 0.0
            
            # Average correlation across positions
            correlations = [pos.correlation for pos in position_metrics]
            avg_correlation = statistics.mean(correlations)
            
            # Risk increases with correlation
            return abs(avg_correlation)
            
        except Exception as e:
            logger.error(f"Correlation risk calculation failed: {e}")
            return 0.3  # Default moderate correlation
    
    def _calculate_concentration_risk(self, position_metrics: List[PositionRisk]) -> float:
        """Calculate concentration risk using Herfindahl index"""
        try:
            if not position_metrics:
                return 0.0
            
            # Herfindahl-Hirschman Index for concentration
            weights = [pos.weight for pos in position_metrics]
            hhi = sum(w ** 2 for w in weights)
            
            return hhi
            
        except Exception as e:
            logger.error(f"Concentration risk calculation failed: {e}")
            return 0.2  # Default moderate concentration
    
    def _estimate_volatility(self, symbol: str, symbol_data: Dict[str, Any]) -> float:
        """Estimate price volatility for symbol"""
        try:
            # Use change_24h as a proxy for volatility
            change_24h = abs(symbol_data.get("change_24h", 2.0))
            
            # Annualize daily volatility (rough approximation)
            daily_vol = change_24h / 100
            annual_vol = daily_vol * math.sqrt(365)
            
            return min(annual_vol, 2.0)  # Cap at 200%
            
        except Exception as e:
            logger.error(f"Volatility estimation failed for {symbol}: {e}")
            return 0.3  # Default 30% volatility
    
    def _estimate_beta(self, symbol: str, symbol_data: Dict[str, Any]) -> float:
        """Estimate beta for symbol"""
        try:
            # Mock beta estimation based on symbol type
            if "BTC" in symbol.upper():
                return 1.5  # Bitcoin typically has higher beta
            elif "ETH" in symbol.upper():
                return 1.3
            elif symbol.upper().endswith("USD"):
                return 1.2  # Crypto generally higher beta
            else:
                return 1.0  # Default market beta
                
        except Exception as e:
            logger.error(f"Beta estimation failed for {symbol}: {e}")
            return 1.0
    
    def _estimate_correlation(self, symbol: str, portfolio_context: Dict[str, Any]) -> float:
        """Estimate correlation with portfolio"""
        try:
            # Mock correlation estimation
            positions = portfolio_context.get("positions", [])
            
            if len(positions) <= 1:
                return 0.0
            
            # Crypto assets typically have moderate to high correlation
            if symbol.upper().endswith("USD"):
                return 0.6  # Moderate crypto correlation
            else:
                return 0.3  # Lower correlation for other assets
                
        except Exception as e:
            logger.error(f"Correlation estimation failed for {symbol}: {e}")
            return 0.5  # Default moderate correlation
    
    def _assess_liquidity_risk(self, symbol: str, symbol_data: Dict[str, Any]) -> str:
        """Assess liquidity risk for symbol"""
        try:
            volume_24h = symbol_data.get("volume_24h", 0)
            
            if volume_24h > 10000000:  # $10M+
                return "low"
            elif volume_24h > 1000000:  # $1M+
                return "medium"
            else:
                return "high"
                
        except Exception as e:
            logger.error(f"Liquidity risk assessment failed for {symbol}: {e}")
            return "medium"
    
    def _assess_credit_risk(self, symbol: str, symbol_data: Dict[str, Any]) -> str:
        """Assess credit risk for symbol"""
        try:
            # Mock credit risk assessment
            if symbol.upper() in ["BTCUSD", "ETHUSD"]:
                return "low"  # Major cryptocurrencies
            elif symbol.upper().endswith("USD"):
                return "medium"  # Other cryptocurrencies
            else:
                return "low"  # Assume low credit risk for others
                
        except Exception as e:
            logger.error(f"Credit risk assessment failed for {symbol}: {e}")
            return "medium"
    
    async def _analyze_scenario(self, portfolio: Dict[str, Any], 
                              scenario: str) -> ScenarioAnalysis:
        """Analyze specific stress test scenario"""
        try:
            positions = portfolio.get("positions", [])
            
            # Scenario-specific impacts
            scenario_impacts = {
                "Market Crash (-20%)": {
                    "impact": -0.20,
                    "probability": 0.05,
                    "recovery": "6-12 months",
                    "severity": "high"
                },
                "Crypto Winter (-50%)": {
                    "impact": -0.50,
                    "probability": 0.10,
                    "recovery": "12-24 months",
                    "severity": "extreme"
                },
                "Interest Rate Spike (+2%)": {
                    "impact": -0.10,
                    "probability": 0.15,
                    "recovery": "3-6 months",
                    "severity": "medium"
                },
                "Liquidity Crisis": {
                    "impact": -0.15,
                    "probability": 0.08,
                    "recovery": "6-18 months",
                    "severity": "high"
                },
                "Regulatory Crackdown": {
                    "impact": -0.30,
                    "probability": 0.12,
                    "recovery": "12-36 months",
                    "severity": "high"
                },
                "Black Swan Event": {
                    "impact": -0.35,
                    "probability": 0.02,
                    "recovery": "18+ months",
                    "severity": "extreme"
                }
            }
            
            scenario_data = scenario_impacts.get(scenario, {
                "impact": -0.10,
                "probability": 0.10,
                "recovery": "6-12 months",
                "severity": "medium"
            })
            
            affected_positions = [pos.get("symbol", "") for pos in positions]
            
            mitigation_strategies = [
                "Diversify across asset classes",
                "Implement stop-loss orders",
                "Reduce position concentrations",
                "Maintain cash reserves",
                "Use hedging instruments"
            ]
            
            return ScenarioAnalysis(
                scenario_name=scenario,
                description=f"Stress test analyzing {scenario} impact on portfolio",
                probability=scenario_data["probability"],
                portfolio_impact=scenario_data["impact"],
                positions_affected=affected_positions,
                recovery_time=scenario_data["recovery"],
                mitigation_strategies=mitigation_strategies,
                severity=scenario_data["severity"]
            )
            
        except Exception as e:
            logger.error(f"Scenario analysis failed for {scenario}: {e}")
            return ScenarioAnalysis(
                scenario_name=scenario,
                description="Scenario analysis unavailable",
                probability=0.1,
                portfolio_impact=-0.1,
                positions_affected=[],
                recovery_time="Unknown",
                mitigation_strategies=[],
                severity="medium"
            )
    
    # Mock methods for fallback
    async def _mock_risk_metrics(self) -> RiskMetrics:
        """Mock risk metrics when calculation fails"""
        return RiskMetrics(
            value_at_risk=0.025,  # 2.5%
            expected_shortfall=0.035,  # 3.5%
            max_drawdown=0.08,  # 8%
            sharpe_ratio=1.2,
            sortino_ratio=1.5,
            beta=1.1,
            alpha=0.02,  # 2%
            volatility=0.18,  # 18%
            correlation_risk=0.4,
            concentration_risk=0.25
        )
    
    async def _mock_position_risk(self, symbol: str) -> PositionRisk:
        """Mock position risk when calculation fails"""
        return PositionRisk(
            symbol=symbol,
            position_size=1.0,
            market_value=5000.0,
            weight=0.05,  # 5%
            individual_var=150.0,
            contribution_to_var=125.0,
            volatility=0.25,
            beta=1.2,
            correlation=0.6,
            liquidity_risk="medium",
            credit_risk="low"
        )
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get risk assessment service status"""
        return {
            "service": "risk_assessment",
            "status": "healthy",
            "cache_size": len(self.risk_cache),
            "active_alerts": len(self.active_alerts),
            "risk_limits": self.risk_limits.dict(),
            "last_check": datetime.now().isoformat()
        }

# Global service instance
risk_service = RiskAssessmentService()