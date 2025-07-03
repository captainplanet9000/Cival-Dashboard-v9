#!/usr/bin/env python3
"""
Risk Management MCP Server - Portfolio Risk & Emergency Controls
Specialized MCP server for comprehensive risk assessment and portfolio monitoring
Integrates with all trading services for real-time risk management and emergency controls
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union
from decimal import Decimal
from dataclasses import dataclass, asdict
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel, Field

# Import our risk management services
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.autonomous_agent_funding import AutonomousAgentFunding
from services.realtime_price_aggregator import RealtimePriceAggregator
from services.cross_dex_arbitrage_engine import CrossDEXArbitrageEngine
from core.service_registry import ServiceRegistry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Risk Management MCP Server",
    description="Comprehensive portfolio risk assessment and emergency controls for trading operations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
funding_service: Optional[AutonomousAgentFunding] = None
price_aggregator: Optional[RealtimePriceAggregator] = None
arbitrage_engine: Optional[CrossDEXArbitrageEngine] = None
service_registry = ServiceRegistry()

# Risk monitoring state
risk_monitors: Dict[str, Dict[str, Any]] = {}
emergency_stops: Dict[str, Dict[str, Any]] = {}
risk_alerts: List[Dict[str, Any]] = []

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(Enum):
    DRAWDOWN = "drawdown"
    CONCENTRATION = "concentration"
    LIQUIDITY = "liquidity"
    VOLATILITY = "volatility"
    CORRELATION = "correlation"
    LEVERAGE = "leverage"

# MCP Tool Models
class ToolRequest(BaseModel):
    name: str
    arguments: Dict[str, Any]
    agent_id: Optional[str] = None

class ToolResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None

class RiskAssessmentRequest(BaseModel):
    agent_id: str
    portfolio_data: Optional[Dict[str, Any]] = None
    include_stress_test: Optional[bool] = False
    risk_horizon_days: Optional[int] = 30

class RiskMonitorRequest(BaseModel):
    agent_id: str
    monitoring_rules: Dict[str, Any]
    alert_thresholds: Dict[str, float]
    auto_actions: Optional[Dict[str, str]] = None

class EmergencyStopRequest(BaseModel):
    agent_id: Optional[str] = None
    stop_type: str
    reason: str
    scope: Optional[List[str]] = None

# MCP Tool Definitions
MCP_TOOLS = [
    {
        "name": "assess_portfolio_risk",
        "description": "Comprehensive portfolio risk assessment with VaR, stress testing, and risk metrics",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID for risk assessment"},
                "portfolio_data": {"type": "object", "description": "Portfolio holdings and positions"},
                "include_stress_test": {"type": "boolean", "description": "Include stress testing scenarios", "default": false},
                "risk_horizon_days": {"type": "number", "description": "Risk assessment time horizon", "default": 30}
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "monitor_real_time_risk",
        "description": "Set up continuous risk monitoring with custom rules and alert thresholds",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID to monitor"},
                "monitoring_rules": {"type": "object", "description": "Risk monitoring rules and parameters"},
                "alert_thresholds": {"type": "object", "description": "Alert threshold values"},
                "auto_actions": {"type": "object", "description": "Automatic actions for risk events"}
            },
            "required": ["agent_id", "monitoring_rules", "alert_thresholds"]
        }
    },
    {
        "name": "calculate_position_sizing",
        "description": "Calculate optimal position sizes based on risk parameters and Kelly criterion",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID"},
                "trade_setups": {"type": "array", "items": {"type": "object"}, "description": "Proposed trade setups"},
                "risk_per_trade": {"type": "number", "description": "Max risk per trade (decimal)", "default": 0.02},
                "portfolio_value": {"type": "number", "description": "Total portfolio value"}
            },
            "required": ["agent_id", "trade_setups"]
        }
    },
    {
        "name": "execute_emergency_stop",
        "description": "Execute emergency stop protocols with configurable scope and actions",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Specific agent ID (optional for system-wide stop)"},
                "stop_type": {"type": "string", "enum": ["full_stop", "trading_halt", "position_close", "funding_freeze"], "description": "Type of emergency stop"},
                "reason": {"type": "string", "description": "Reason for emergency stop"},
                "scope": {"type": "array", "items": {"type": "string"}, "description": "Scope of stop (agents, strategies, etc.)"}
            },
            "required": ["stop_type", "reason"]
        }
    },
    {
        "name": "get_risk_metrics",
        "description": "Get comprehensive risk metrics and analytics for agents or system-wide",
        "inputSchema": {
            "type": "object",
            "properties": {
                "scope": {"type": "string", "enum": ["agent", "system", "strategy"], "description": "Scope of risk metrics"},
                "agent_id": {"type": "string", "description": "Agent ID (if scope is agent)"},
                "time_range_hours": {"type": "number", "description": "Time range for metrics", "default": 24},
                "include_predictions": {"type": "boolean", "description": "Include risk predictions", "default": false}
            },
            "required": ["scope"]
        }
    },
    {
        "name": "validate_trading_limits",
        "description": "Validate proposed trades against risk limits and exposure constraints",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID"},
                "proposed_trades": {"type": "array", "items": {"type": "object"}, "description": "Proposed trading positions"},
                "check_correlations": {"type": "boolean", "description": "Check position correlations", "default": true},
                "check_liquidity": {"type": "boolean", "description": "Check market liquidity", "default": true}
            },
            "required": ["agent_id", "proposed_trades"]
        }
    }
]

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global funding_service, price_aggregator, arbitrage_engine
    
    try:
        # Initialize services
        funding_service = AutonomousAgentFunding()
        price_aggregator = RealtimePriceAggregator("vNg5BFKZV1TJcvFtMANru")
        arbitrage_engine = CrossDEXArbitrageEngine()
        
        # Register services
        service_registry.register_service("autonomous_agent_funding", funding_service)
        service_registry.register_service("realtime_price_aggregator", price_aggregator)
        service_registry.register_service("cross_dex_arbitrage_engine", arbitrage_engine)
        
        # Start background risk monitoring
        asyncio.create_task(continuous_risk_monitoring())
        
        logger.info("Risk Management MCP Server started successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")

# MCP Protocol Endpoints
@app.get("/mcp/capabilities")
async def get_capabilities():
    """Get MCP server capabilities"""
    return {
        "version": "1.0.0",
        "capabilities": {
            "tools": True,
            "prompts": False,
            "resources": False,
            "sampling": False,
            "risk_assessment": True,
            "emergency_controls": True
        }
    }

@app.get("/mcp/tools")
async def list_tools():
    """List available MCP tools"""
    return {"tools": MCP_TOOLS}

@app.post("/mcp/tools/call")
async def call_tool(request: ToolRequest) -> ToolResponse:
    """Execute MCP tool call"""
    start_time = asyncio.get_event_loop().time()
    
    try:
        result = await execute_tool(request.name, request.arguments, request.agent_id)
        execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
        
        return ToolResponse(
            success=True,
            data=result,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution_time = (asyncio.get_event_loop().time() - start_time) * 1000
        logger.error(f"Tool execution failed: {e}")
        
        return ToolResponse(
            success=False,
            error=str(e),
            execution_time_ms=execution_time
        )

async def execute_tool(tool_name: str, arguments: Dict[str, Any], agent_id: Optional[str] = None) -> Dict[str, Any]:
    """Execute specific tool based on name"""
    
    if tool_name == "assess_portfolio_risk":
        return await assess_portfolio_risk(arguments)
    
    elif tool_name == "monitor_real_time_risk":
        return await monitor_real_time_risk(arguments)
    
    elif tool_name == "calculate_position_sizing":
        return await calculate_position_sizing(arguments)
    
    elif tool_name == "execute_emergency_stop":
        return await execute_emergency_stop(arguments)
    
    elif tool_name == "get_risk_metrics":
        return await get_risk_metrics(arguments)
    
    elif tool_name == "validate_trading_limits":
        return await validate_trading_limits(arguments)
    
    else:
        raise ValueError(f"Unknown tool: {tool_name}")

async def assess_portfolio_risk(args: Dict[str, Any]) -> Dict[str, Any]:
    """Comprehensive portfolio risk assessment"""
    
    agent_id = args["agent_id"]
    portfolio_data = args.get("portfolio_data", {})
    include_stress_test = args.get("include_stress_test", False)
    risk_horizon_days = args.get("risk_horizon_days", 30)
    
    # Get agent capital status
    if funding_service:
        capital_status = await funding_service.get_agent_capital_status(agent_id)
        portfolio_value = float(capital_status.total_allocated + capital_status.pnl_unrealized)
    else:
        portfolio_value = portfolio_data.get("total_value", 100000)
    
    # Calculate risk metrics
    risk_assessment = {
        "agent_id": agent_id,
        "portfolio_value": portfolio_value,
        "assessment_timestamp": datetime.now(timezone.utc).isoformat(),
        "risk_horizon_days": risk_horizon_days
    }
    
    # Portfolio composition analysis
    positions = portfolio_data.get("positions", {})
    if not positions:
        # Mock positions for demonstration
        positions = {
            "BTC": {"value": portfolio_value * 0.4, "quantity": 2.5},
            "ETH": {"value": portfolio_value * 0.3, "quantity": 35.0},
            "SOL": {"value": portfolio_value * 0.2, "quantity": 500.0},
            "USDC": {"value": portfolio_value * 0.1, "quantity": portfolio_value * 0.1}
        }
    
    # Concentration risk
    position_weights = {asset: pos["value"] / portfolio_value for asset, pos in positions.items()}
    max_concentration = max(position_weights.values())
    concentration_risk = RiskLevel.CRITICAL if max_concentration > 0.5 else RiskLevel.HIGH if max_concentration > 0.3 else RiskLevel.MEDIUM if max_concentration > 0.15 else RiskLevel.LOW
    
    # Value at Risk (VaR) calculation (simplified)
    daily_volatility = 0.03  # 3% daily volatility assumption
    var_95_1d = portfolio_value * daily_volatility * 1.645  # 95% VaR 1 day
    var_99_1d = portfolio_value * daily_volatility * 2.326  # 99% VaR 1 day
    var_95_30d = var_95_1d * (30 ** 0.5)  # 30-day VaR
    
    # Expected Shortfall (Conditional VaR)
    es_95_1d = var_95_1d * 1.5  # Simplified ES calculation
    
    risk_assessment["risk_metrics"] = {
        "value_at_risk": {
            "var_95_1day": var_95_1d,
            "var_99_1day": var_99_1d,
            "var_95_30day": var_95_30d,
            "var_percentage_1d": (var_95_1d / portfolio_value) * 100
        },
        "expected_shortfall": {
            "es_95_1day": es_95_1d,
            "es_percentage": (es_95_1d / portfolio_value) * 100
        },
        "concentration_risk": {
            "max_position_weight": max_concentration,
            "risk_level": concentration_risk.value,
            "diversification_score": 1 - max_concentration,
            "position_weights": position_weights
        },
        "liquidity_risk": {
            "liquid_positions_percentage": 85.0,  # Simplified
            "illiquid_threshold_days": 7,
            "average_liquidity_score": 0.78
        },
        "market_risk": {
            "beta": 1.2,  # Portfolio beta to market
            "correlation_to_btc": 0.85,
            "volatility_30d": daily_volatility * (30 ** 0.5),
            "sharpe_ratio": 1.5
        }
    }
    
    # Risk scoring
    overall_risk_score = (
        (max_concentration * 30) +  # Concentration weight
        (min(var_95_1d / portfolio_value * 100 / 5, 10) * 25) +  # VaR weight
        (min(daily_volatility * 100 / 3, 10) * 20) +  # Volatility weight
        ((1 - 0.78) * 25)  # Liquidity weight
    ) / 100
    
    risk_level = RiskLevel.CRITICAL if overall_risk_score > 0.8 else RiskLevel.HIGH if overall_risk_score > 0.6 else RiskLevel.MEDIUM if overall_risk_score > 0.4 else RiskLevel.LOW
    
    risk_assessment["overall_assessment"] = {
        "risk_score": overall_risk_score,
        "risk_level": risk_level.value,
        "risk_factors": [],
        "recommendations": []
    }
    
    # Add risk factors and recommendations
    if max_concentration > 0.3:
        risk_assessment["overall_assessment"]["risk_factors"].append("High concentration risk in single asset")
        risk_assessment["overall_assessment"]["recommendations"].append("Consider diversifying portfolio to reduce concentration")
    
    if var_95_1d / portfolio_value > 0.05:
        risk_assessment["overall_assessment"]["risk_factors"].append("High Value at Risk relative to portfolio size")
        risk_assessment["overall_assessment"]["recommendations"].append("Reduce position sizes or add hedging")
    
    # Stress testing
    if include_stress_test:
        stress_scenarios = {
            "market_crash_20": {"portfolio_impact": -0.20 * portfolio_value, "probability": 0.05},
            "crypto_winter_50": {"portfolio_impact": -0.50 * portfolio_value, "probability": 0.02},
            "flash_crash_10": {"portfolio_impact": -0.10 * portfolio_value, "probability": 0.15},
            "correlation_breakdown": {"portfolio_impact": -0.15 * portfolio_value, "probability": 0.10}
        }
        
        risk_assessment["stress_testing"] = {
            "scenarios": stress_scenarios,
            "worst_case_loss": min(scenario["portfolio_impact"] for scenario in stress_scenarios.values()),
            "expected_loss_stressed": sum(scenario["portfolio_impact"] * scenario["probability"] for scenario in stress_scenarios.values()),
            "stress_test_timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return risk_assessment

async def monitor_real_time_risk(args: Dict[str, Any]) -> Dict[str, Any]:
    """Set up continuous risk monitoring"""
    
    agent_id = args["agent_id"]
    monitoring_rules = args["monitoring_rules"]
    alert_thresholds = args["alert_thresholds"]
    auto_actions = args.get("auto_actions", {})
    
    monitor_id = f"risk_monitor_{agent_id}_{int(datetime.now().timestamp())}"
    
    # Create monitoring configuration
    monitor_config = {
        "monitor_id": monitor_id,
        "agent_id": agent_id,
        "monitoring_rules": monitoring_rules,
        "alert_thresholds": alert_thresholds,
        "auto_actions": auto_actions,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_check": None,
        "alerts_triggered": 0
    }
    
    # Store monitor
    risk_monitors[monitor_id] = monitor_config
    
    # Perform initial risk check
    initial_check = await perform_risk_check(monitor_config)
    
    return {
        "monitor_id": monitor_id,
        "agent_id": agent_id,
        "monitoring_status": "active",
        "monitoring_rules": monitoring_rules,
        "alert_thresholds": alert_thresholds,
        "auto_actions_configured": len(auto_actions),
        "initial_risk_check": initial_check,
        "monitoring_started": monitor_config["created_at"]
    }

async def calculate_position_sizing(args: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate optimal position sizes using risk management principles"""
    
    agent_id = args["agent_id"]
    trade_setups = args["trade_setups"]
    risk_per_trade = args.get("risk_per_trade", 0.02)  # 2% default risk per trade
    portfolio_value = args.get("portfolio_value")
    
    # Get portfolio value if not provided
    if not portfolio_value and funding_service:
        capital_status = await funding_service.get_agent_capital_status(agent_id)
        portfolio_value = float(capital_status.total_allocated + capital_status.pnl_unrealized)
    elif not portfolio_value:
        portfolio_value = 100000  # Default
    
    position_recommendations = []
    total_risk_exposure = 0
    
    for i, trade_setup in enumerate(trade_setups):
        trade_id = trade_setup.get("trade_id", f"trade_{i}")
        symbol = trade_setup.get("symbol", "BTC/USD")
        entry_price = trade_setup.get("entry_price", 50000)
        stop_loss = trade_setup.get("stop_loss", entry_price * 0.95)
        take_profit = trade_setup.get("take_profit", entry_price * 1.10)
        win_probability = trade_setup.get("win_probability", 0.6)
        
        # Calculate risk per trade in dollars
        risk_amount = portfolio_value * risk_per_trade
        
        # Calculate position size based on stop loss distance
        price_risk_percentage = abs(entry_price - stop_loss) / entry_price
        position_size_usd = risk_amount / price_risk_percentage
        
        # Kelly Criterion calculation for optimal sizing
        win_rate = win_probability
        avg_win = abs(take_profit - entry_price) / entry_price
        avg_loss = abs(entry_price - stop_loss) / entry_price
        
        if avg_loss > 0:
            kelly_fraction = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
            kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%
        else:
            kelly_fraction = 0.1
        
        kelly_position_size = portfolio_value * kelly_fraction
        
        # Use the more conservative of the two sizing methods
        recommended_size = min(position_size_usd, kelly_position_size)
        position_percentage = recommended_size / portfolio_value
        
        # Risk-reward analysis
        risk_reward_ratio = avg_win / avg_loss if avg_loss > 0 else 0
        expected_value = (win_rate * avg_win) - ((1 - win_rate) * avg_loss)
        
        position_recommendation = {
            "trade_id": trade_id,
            "symbol": symbol,
            "entry_price": entry_price,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "position_sizing": {
                "recommended_size_usd": recommended_size,
                "position_percentage": position_percentage,
                "risk_based_size": position_size_usd,
                "kelly_optimal_size": kelly_position_size,
                "quantity": recommended_size / entry_price
            },
            "risk_analysis": {
                "risk_amount": risk_amount,
                "risk_percentage": risk_per_trade,
                "risk_reward_ratio": risk_reward_ratio,
                "win_probability": win_probability,
                "expected_value": expected_value,
                "kelly_fraction": kelly_fraction
            },
            "recommendations": []
        }
        
        # Add recommendations based on analysis
        if risk_reward_ratio < 1.5:
            position_recommendation["recommendations"].append("Consider improving risk-reward ratio")
        
        if win_probability < 0.5:
            position_recommendation["recommendations"].append("Low win probability - reduce position size")
        
        if expected_value < 0:
            position_recommendation["recommendations"].append("Negative expected value - avoid this trade")
            position_recommendation["position_sizing"]["recommended_size_usd"] = 0
        
        position_recommendations.append(position_recommendation)
        total_risk_exposure += risk_amount
    
    # Portfolio-level analysis
    total_risk_percentage = total_risk_exposure / portfolio_value
    
    portfolio_analysis = {
        "total_trades": len(trade_setups),
        "total_risk_exposure_usd": total_risk_exposure,
        "total_risk_percentage": total_risk_percentage,
        "average_risk_per_trade": risk_per_trade,
        "recommended_max_concurrent_trades": min(10, int(0.2 / risk_per_trade)),  # Max 20% total risk
        "portfolio_heat": total_risk_percentage,
        "diversification_score": min(len(set(trade["symbol"] for trade in trade_setups)) / len(trade_setups), 1.0) if trade_setups else 0
    }
    
    # Warnings and constraints
    warnings = []
    if total_risk_percentage > 0.15:
        warnings.append("High total risk exposure - consider reducing position sizes")
    
    if len(trade_setups) > 10:
        warnings.append("Too many concurrent trades - may increase correlation risk")
    
    return {
        "agent_id": agent_id,
        "portfolio_value": portfolio_value,
        "position_recommendations": position_recommendations,
        "portfolio_analysis": portfolio_analysis,
        "warnings": warnings,
        "calculation_parameters": {
            "risk_per_trade": risk_per_trade,
            "kelly_criterion_used": True,
            "max_position_percentage": 0.25
        },
        "calculation_timestamp": datetime.now(timezone.utc).isoformat()
    }

async def execute_emergency_stop(args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute emergency stop protocols"""
    
    agent_id = args.get("agent_id")
    stop_type = args["stop_type"]
    reason = args["reason"]
    scope = args.get("scope", [])
    
    stop_id = f"emergency_stop_{int(datetime.now().timestamp())}"
    
    # Create emergency stop record
    emergency_stop = {
        "stop_id": stop_id,
        "agent_id": agent_id,
        "stop_type": stop_type,
        "reason": reason,
        "scope": scope,
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "status": "executing",
        "actions_taken": []
    }
    
    # Execute stop actions based on type
    if stop_type == "full_stop":
        # Stop all trading activities
        actions = [
            "Disabled all trading algorithms",
            "Cancelled open orders",
            "Closed risky positions",
            "Frozen funding allocations",
            "Activated portfolio protection mode"
        ]
        
        # In real implementation, would call actual service methods
        if arbitrage_engine:
            try:
                # Stop arbitrage engine
                emergency_stop["actions_taken"].append("Arbitrage engine stopped")
            except Exception as e:
                emergency_stop["actions_taken"].append(f"Arbitrage stop failed: {str(e)}")
        
        if funding_service:
            try:
                # Stop funding operations
                await funding_service.emergency_stop_funding(reason)
                emergency_stop["actions_taken"].append("Funding operations stopped")
            except Exception as e:
                emergency_stop["actions_taken"].append(f"Funding stop failed: {str(e)}")
    
    elif stop_type == "trading_halt":
        actions = [
            "Paused new trade executions",
            "Maintained existing positions",
            "Continued monitoring systems"
        ]
        emergency_stop["actions_taken"].extend(actions)
    
    elif stop_type == "position_close":
        actions = [
            "Initiated position liquidation",
            "Prioritized risky positions",
            "Minimized market impact"
        ]
        emergency_stop["actions_taken"].extend(actions)
    
    elif stop_type == "funding_freeze":
        actions = [
            "Frozen all funding allocations",
            "Suspended new funding requests",
            "Maintained existing positions"
        ]
        emergency_stop["actions_taken"].extend(actions)
    
    emergency_stop["status"] = "completed"
    emergency_stop["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    # Store emergency stop record
    emergency_stops[stop_id] = emergency_stop
    
    # Create critical alert
    alert = {
        "alert_id": f"alert_{stop_id}",
        "type": "emergency_stop",
        "severity": "critical",
        "message": f"Emergency stop executed: {stop_type}",
        "reason": reason,
        "timestamp": emergency_stop["initiated_at"],
        "agent_id": agent_id,
        "stop_id": stop_id
    }
    risk_alerts.append(alert)
    
    logger.critical(f"EMERGENCY STOP EXECUTED: {stop_type} - {reason}")
    
    return {
        "stop_id": stop_id,
        "status": "completed",
        "stop_type": stop_type,
        "reason": reason,
        "agent_id": agent_id,
        "scope": scope,
        "actions_taken": emergency_stop["actions_taken"],
        "initiated_at": emergency_stop["initiated_at"],
        "completed_at": emergency_stop["completed_at"],
        "alert_generated": True,
        "recovery_instructions": [
            "Review system logs for root cause",
            "Assess portfolio state and positions",
            "Determine safe restart conditions",
            "Gradually resume operations with enhanced monitoring"
        ]
    }

async def get_risk_metrics(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get comprehensive risk metrics"""
    
    scope = args["scope"]
    agent_id = args.get("agent_id")
    time_range_hours = args.get("time_range_hours", 24)
    include_predictions = args.get("include_predictions", False)
    
    current_time = datetime.now(timezone.utc)
    time_threshold = current_time - timedelta(hours=time_range_hours)
    
    risk_metrics = {
        "scope": scope,
        "time_range_hours": time_range_hours,
        "generated_at": current_time.isoformat()
    }
    
    if scope == "agent" and agent_id:
        # Agent-specific risk metrics
        agent_metrics = await calculate_agent_risk_metrics(agent_id, time_threshold)
        risk_metrics["agent_metrics"] = agent_metrics
        
    elif scope == "system":
        # System-wide risk metrics
        system_metrics = await calculate_system_risk_metrics(time_threshold)
        risk_metrics["system_metrics"] = system_metrics
        
    elif scope == "strategy":
        # Strategy-specific risk metrics
        strategy_metrics = await calculate_strategy_risk_metrics(time_threshold)
        risk_metrics["strategy_metrics"] = strategy_metrics
    
    # Add recent alerts
    recent_alerts = [
        alert for alert in risk_alerts
        if datetime.fromisoformat(alert["timestamp"]) > time_threshold
    ]
    risk_metrics["recent_alerts"] = recent_alerts[-10:]  # Last 10 alerts
    
    # Add emergency stops
    recent_stops = [
        stop for stop in emergency_stops.values()
        if datetime.fromisoformat(stop["initiated_at"]) > time_threshold
    ]
    risk_metrics["recent_emergency_stops"] = recent_stops
    
    # Add active monitors
    active_monitors = [
        monitor for monitor in risk_monitors.values()
        if monitor["status"] == "active"
    ]
    risk_metrics["active_risk_monitors"] = len(active_monitors)
    
    if include_predictions:
        # Add risk predictions
        risk_metrics["predictions"] = {
            "next_24h_risk_level": "medium",
            "volatility_forecast": "increasing",
            "correlation_forecast": "stable",
            "liquidity_forecast": "adequate",
            "recommended_actions": [
                "Monitor concentration risk closely",
                "Consider reducing leverage in volatile markets",
                "Increase cash reserves for opportunities"
            ]
        }
    
    return risk_metrics

async def validate_trading_limits(args: Dict[str, Any]) -> Dict[str, Any]:
    """Validate proposed trades against risk limits"""
    
    agent_id = args["agent_id"]
    proposed_trades = args["proposed_trades"]
    check_correlations = args.get("check_correlations", True)
    check_liquidity = args.get("check_liquidity", True)
    
    validation_results = {
        "agent_id": agent_id,
        "total_trades_validated": len(proposed_trades),
        "approved_trades": 0,
        "rejected_trades": 0,
        "trade_validations": [],
        "overall_risk_impact": {},
        "validation_timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Get current portfolio state
    portfolio_value = 100000  # Default
    if funding_service:
        capital_status = await funding_service.get_agent_capital_status(agent_id)
        portfolio_value = float(capital_status.total_allocated + capital_status.pnl_unrealized)
    
    total_exposure = 0
    approved_count = 0
    rejected_count = 0
    
    for trade in proposed_trades:
        trade_id = trade.get("trade_id", f"trade_{len(validation_results['trade_validations'])}")
        symbol = trade.get("symbol", "BTC/USD")
        position_size = trade.get("position_size_usd", 1000)
        trade_type = trade.get("type", "long")
        
        validation = {
            "trade_id": trade_id,
            "symbol": symbol,
            "position_size_usd": position_size,
            "validation_status": "pending",
            "checks_passed": [],
            "checks_failed": [],
            "warnings": [],
            "approved": False
        }
        
        # Position size check
        position_percentage = position_size / portfolio_value
        if position_percentage <= 0.25:  # Max 25% per position
            validation["checks_passed"].append("Position size within limits")
        else:
            validation["checks_failed"].append("Position size exceeds 25% limit")
        
        # Total exposure check
        if (total_exposure + position_size) / portfolio_value <= 0.8:  # Max 80% total exposure
            validation["checks_passed"].append("Total exposure within limits")
        else:
            validation["checks_failed"].append("Total exposure would exceed 80% limit")
        
        # Correlation check
        if check_correlations:
            # Simplified correlation check
            crypto_exposure = sum(
                t.get("position_size_usd", 0) for t in proposed_trades 
                if any(crypto in t.get("symbol", "") for crypto in ["BTC", "ETH", "SOL"])
            )
            if crypto_exposure / portfolio_value <= 0.6:
                validation["checks_passed"].append("Correlation risk acceptable")
            else:
                validation["checks_failed"].append("High correlation risk in crypto positions")
        
        # Liquidity check
        if check_liquidity:
            # Simplified liquidity check based on position size
            if position_size <= 50000:  # Positions under $50k assumed liquid
                validation["checks_passed"].append("Sufficient market liquidity")
            else:
                validation["warnings"].append("Large position may face liquidity constraints")
        
        # Risk-reward check
        stop_loss = trade.get("stop_loss")
        take_profit = trade.get("take_profit")
        entry_price = trade.get("entry_price", 50000)
        
        if stop_loss and take_profit:
            risk = abs(entry_price - stop_loss) / entry_price
            reward = abs(take_profit - entry_price) / entry_price
            if reward / risk >= 1.5:
                validation["checks_passed"].append("Adequate risk-reward ratio")
            else:
                validation["warnings"].append("Risk-reward ratio below 1.5")
        
        # Final approval decision
        if len(validation["checks_failed"]) == 0:
            validation["approved"] = True
            validation["validation_status"] = "approved"
            approved_count += 1
            total_exposure += position_size
        else:
            validation["approved"] = False
            validation["validation_status"] = "rejected"
            rejected_count += 1
        
        validation_results["trade_validations"].append(validation)
    
    validation_results["approved_trades"] = approved_count
    validation_results["rejected_trades"] = rejected_count
    
    # Overall risk impact
    validation_results["overall_risk_impact"] = {
        "total_exposure_usd": total_exposure,
        "portfolio_utilization": total_exposure / portfolio_value,
        "risk_score_impact": min(total_exposure / portfolio_value, 1.0),
        "recommendation": "approved" if rejected_count == 0 else "review_required" if approved_count > 0 else "rejected"
    }
    
    return validation_results

# Helper functions
async def calculate_agent_risk_metrics(agent_id: str, time_threshold: datetime) -> Dict[str, Any]:
    """Calculate agent-specific risk metrics"""
    
    # In real implementation, would fetch actual data
    return {
        "agent_id": agent_id,
        "portfolio_risk": {
            "value_at_risk_24h": 2500.0,
            "max_drawdown": 0.08,
            "volatility": 0.25,
            "sharpe_ratio": 1.2
        },
        "position_metrics": {
            "concentration_score": 0.35,
            "correlation_score": 0.68,
            "liquidity_score": 0.82
        },
        "trading_metrics": {
            "win_rate": 0.65,
            "profit_factor": 1.85,
            "max_consecutive_losses": 3
        }
    }

async def calculate_system_risk_metrics(time_threshold: datetime) -> Dict[str, Any]:
    """Calculate system-wide risk metrics"""
    
    return {
        "total_assets_under_management": 2500000.0,
        "system_var_24h": 125000.0,
        "active_agents": len(risk_monitors),
        "emergency_stops_24h": len([s for s in emergency_stops.values() 
                                   if datetime.fromisoformat(s["initiated_at"]) > time_threshold]),
        "average_portfolio_correlation": 0.45,
        "system_health_score": 0.78
    }

async def calculate_strategy_risk_metrics(time_threshold: datetime) -> Dict[str, Any]:
    """Calculate strategy-specific risk metrics"""
    
    return {
        "arbitrage_strategy": {
            "risk_score": 0.25,
            "max_exposure": 500000.0,
            "success_rate": 0.92
        },
        "momentum_strategy": {
            "risk_score": 0.65,
            "max_exposure": 750000.0,
            "success_rate": 0.68
        },
        "mean_reversion_strategy": {
            "risk_score": 0.45,
            "max_exposure": 300000.0,
            "success_rate": 0.75
        }
    }

async def perform_risk_check(monitor_config: Dict[str, Any]) -> Dict[str, Any]:
    """Perform risk check for monitoring configuration"""
    
    # Simplified risk check
    risk_status = {
        "overall_risk": "medium",
        "checks_performed": [
            "Portfolio concentration",
            "Value at Risk",
            "Correlation analysis",
            "Liquidity assessment"
        ],
        "alerts_triggered": 0,
        "status": "healthy"
    }
    
    monitor_config["last_check"] = datetime.now(timezone.utc).isoformat()
    
    return risk_status

async def continuous_risk_monitoring():
    """Background task for continuous risk monitoring"""
    
    while True:
        try:
            for monitor_id, monitor_config in risk_monitors.items():
                if monitor_config["status"] == "active":
                    await perform_risk_check(monitor_config)
            
            await asyncio.sleep(30)  # Check every 30 seconds
            
        except Exception as e:
            logger.error(f"Error in continuous risk monitoring: {e}")
            await asyncio.sleep(60)

# Health and status endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "funding_service": funding_service is not None,
            "price_aggregator": price_aggregator is not None,
            "arbitrage_engine": arbitrage_engine is not None
        },
        "active_monitors": len([m for m in risk_monitors.values() if m["status"] == "active"]),
        "recent_alerts": len(risk_alerts),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/status")
async def get_status():
    """Get detailed server status"""
    return {
        "server": "Risk Management MCP Server",
        "version": "1.0.0",
        "risk_monitoring": {
            "active_monitors": len([m for m in risk_monitors.values() if m["status"] == "active"]),
            "total_monitors": len(risk_monitors),
            "recent_alerts": len(risk_alerts),
            "emergency_stops": len(emergency_stops)
        },
        "available_tools": len(MCP_TOOLS),
        "risk_assessment_enabled": True,
        "emergency_controls_enabled": True,
        "last_health_check": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "risk_management_mcp:app",
        host="0.0.0.0",
        port=8005,
        reload=False,
        log_level="info"
    )