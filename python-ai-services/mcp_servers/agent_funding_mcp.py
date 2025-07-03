#!/usr/bin/env python3
"""
Agent Funding MCP Server - Autonomous Capital Allocation
Specialized MCP server for agent funding requests and performance-based allocation
Integrates with Autonomous Agent Funding Service for intelligent capital distribution
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

# Import our funding service
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.autonomous_agent_funding import AutonomousAgentFunding, FundingStrategy, AgentPerformanceMetrics
from core.service_registry import ServiceRegistry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agent Funding MCP Server",
    description="Autonomous capital allocation and funding management for trading agents",
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
service_registry = ServiceRegistry()

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

class FundingRequest(BaseModel):
    agent_id: str
    amount: float
    reason: str
    urgency: str = "medium"
    strategy_type: str = "general"
    expected_return: Optional[float] = 0.05
    risk_level: Optional[float] = 0.3

class PerformanceUpdateRequest(BaseModel):
    agent_id: str
    total_return: float
    daily_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    trade_count: int

# MCP Tool Definitions
MCP_TOOLS = [
    {
        "name": "request_funding",
        "description": "Submit funding request with automatic performance-based evaluation",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent requesting funding"},
                "amount": {"type": "number", "description": "Requested amount in USD"},
                "reason": {"type": "string", "description": "Reason for funding request"},
                "urgency": {"type": "string", "enum": ["low", "medium", "high", "critical"], "default": "medium"},
                "strategy_type": {"type": "string", "description": "Strategy type for funding"},
                "expected_return": {"type": "number", "description": "Expected return percentage", "default": 0.05},
                "risk_level": {"type": "number", "description": "Risk level (0-1)", "default": 0.3}
            },
            "required": ["agent_id", "amount", "reason"]
        }
    },
    {
        "name": "get_funding_status",
        "description": "Get current funding status and capital allocation for agent",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID to check"},
                "include_history": {"type": "boolean", "description": "Include funding history", "default": false}
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "update_performance_metrics",
        "description": "Update agent performance metrics for funding evaluation",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID"},
                "total_return": {"type": "number", "description": "Total return percentage"},
                "daily_return": {"type": "number", "description": "Daily return percentage"},
                "sharpe_ratio": {"type": "number", "description": "Sharpe ratio"},
                "max_drawdown": {"type": "number", "description": "Maximum drawdown"},
                "win_rate": {"type": "number", "description": "Win rate (0-1)"},
                "trade_count": {"type": "number", "description": "Number of trades"}
            },
            "required": ["agent_id", "total_return", "daily_return", "sharpe_ratio", "max_drawdown", "win_rate", "trade_count"]
        }
    },
    {
        "name": "get_funding_analytics",
        "description": "Get comprehensive funding analytics and performance data",
        "inputSchema": {
            "type": "object",
            "properties": {
                "time_range_days": {"type": "number", "description": "Time range in days", "default": 30},
                "include_predictions": {"type": "boolean", "description": "Include funding predictions", "default": false}
            }
        }
    },
    {
        "name": "get_funding_opportunities",
        "description": "Get current market-based funding opportunities",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Agent ID for personalized opportunities"},
                "min_allocation": {"type": "number", "description": "Minimum allocation amount", "default": 1000},
                "risk_tolerance": {"type": "number", "description": "Risk tolerance (0-1)", "default": 0.5}
            }
        }
    },
    {
        "name": "emergency_funding_stop",
        "description": "Emergency stop all funding operations",
        "inputSchema": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Reason for emergency stop"},
                "affected_agents": {"type": "array", "items": {"type": "string"}, "description": "Specific agents to stop"}
            },
            "required": ["reason"]
        }
    }
]

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global funding_service
    
    try:
        # Initialize funding service
        funding_service = AutonomousAgentFunding()
        
        # Register service
        service_registry.register_service("autonomous_agent_funding", funding_service)
        
        # Start periodic funding review
        asyncio.create_task(funding_service.process_periodic_funding_review())
        
        logger.info("Agent Funding MCP Server started successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize funding service: {e}")

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
            "autonomous_funding": True,
            "performance_tracking": True
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
    
    if tool_name == "request_funding":
        return await request_funding(arguments)
    
    elif tool_name == "get_funding_status":
        return await get_funding_status(arguments)
    
    elif tool_name == "update_performance_metrics":
        return await update_performance_metrics(arguments)
    
    elif tool_name == "get_funding_analytics":
        return await get_funding_analytics(arguments)
    
    elif tool_name == "get_funding_opportunities":
        return await get_funding_opportunities(arguments)
    
    elif tool_name == "emergency_funding_stop":
        return await emergency_funding_stop(arguments)
    
    else:
        raise ValueError(f"Unknown tool: {tool_name}")

async def request_funding(args: Dict[str, Any]) -> Dict[str, Any]:
    """Submit funding request with automatic evaluation"""
    
    if not funding_service:
        raise HTTPException(status_code=503, detail="Funding service not available")
    
    agent_id = args["agent_id"]
    amount = args["amount"]
    reason = args["reason"]
    urgency = args.get("urgency", "medium")
    strategy_type = args.get("strategy_type", "general")
    expected_return = args.get("expected_return", 0.05)
    risk_level = args.get("risk_level", 0.3)
    
    # Submit funding request
    request_id = await funding_service.request_funding(
        agent_id=agent_id,
        amount=Decimal(str(amount)),
        reason=reason,
        urgency=urgency,
        strategy_type=strategy_type,
        expected_return=Decimal(str(expected_return)),
        risk_level=Decimal(str(risk_level))
    )
    
    # Get agent performance for evaluation context
    performance = await funding_service._get_agent_performance(agent_id)
    
    # Calculate approval probability
    if performance:
        performance_score = funding_service._calculate_performance_score(performance)
        risk_score = funding_service._calculate_risk_score(performance, type('MockRequest', (), {
            'agent_id': agent_id,
            'requested_amount': Decimal(str(amount)),
            'urgency': urgency,
            'strategy_type': strategy_type
        })())
        
        approval_probability = (performance_score * 0.6) + ((1 - risk_score) * 0.4)
    else:
        approval_probability = 0.5  # Default for new agents
    
    return {
        "request_id": request_id,
        "agent_id": agent_id,
        "requested_amount": amount,
        "status": "submitted",
        "urgency": urgency,
        "reason": reason,
        "evaluation": {
            "approval_probability": round(approval_probability, 3),
            "performance_score": round(performance_score, 3) if performance else "no_data",
            "risk_assessment": "low" if risk_score < 0.3 else "medium" if risk_score < 0.7 else "high",
            "estimated_processing_time": "immediate" if urgency == "critical" else "5-15 minutes" if urgency == "high" else "1-4 hours"
        },
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }

async def get_funding_status(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get funding status for agent"""
    
    if not funding_service:
        raise HTTPException(status_code=503, detail="Funding service not available")
    
    agent_id = args["agent_id"]
    include_history = args.get("include_history", False)
    
    # Get agent capital status
    capital_status = await funding_service.get_agent_capital_status(agent_id)
    
    result = {
        "agent_id": agent_id,
        "capital_status": {
            "total_allocated": float(capital_status.total_allocated),
            "available_balance": float(capital_status.available_balance),
            "deployed_capital": float(capital_status.deployed_capital),
            "reserved_funds": float(capital_status.reserved_funds),
            "pnl_unrealized": float(capital_status.pnl_unrealized),
            "pnl_realized": float(capital_status.pnl_realized),
            "utilization_rate": float(capital_status.utilization_rate),
            "last_funding": capital_status.last_funding.isoformat() if capital_status.last_funding else None
        },
        "pending_requests": len(capital_status.funding_requests),
        "funding_eligibility": {
            "eligible": True,
            "max_additional_funding": max(0, 100000 - float(capital_status.total_allocated)),
            "performance_tier": "high_performer" if float(capital_status.pnl_realized) > 5000 else "standard"
        }
    }
    
    if include_history:
        # Get funding history from service
        funding_history = funding_service.funding_history
        agent_history = [
            {
                "allocation_id": alloc.agent_id,
                "amount": float(alloc.allocated_amount),
                "strategy": alloc.funding_strategy.value,
                "reason": alloc.allocation_reason,
                "timestamp": alloc.timestamp.isoformat(),
                "performance_score": float(alloc.performance_score),
                "risk_score": float(alloc.risk_score)
            }
            for alloc in funding_history
            if alloc.agent_id == agent_id
        ]
        result["funding_history"] = agent_history[-10:]  # Last 10 allocations
    
    return result

async def update_performance_metrics(args: Dict[str, Any]) -> Dict[str, Any]:
    """Update agent performance metrics"""
    
    if not funding_service:
        raise HTTPException(status_code=503, detail="Funding service not available")
    
    agent_id = args["agent_id"]
    
    # Create performance metrics object
    performance_metrics = AgentPerformanceMetrics(
        agent_id=agent_id,
        total_return=Decimal(str(args["total_return"])),
        daily_return=Decimal(str(args["daily_return"])),
        weekly_return=Decimal(str(args.get("weekly_return", args["daily_return"] * 7))),
        sharpe_ratio=Decimal(str(args["sharpe_ratio"])),
        max_drawdown=Decimal(str(args["max_drawdown"])),
        win_rate=Decimal(str(args["win_rate"])),
        trade_count=args["trade_count"],
        avg_trade_size=Decimal(str(args.get("avg_trade_size", 1000))),
        volatility=Decimal(str(args.get("volatility", 0.25))),
        calmar_ratio=Decimal(str(args.get("calmar_ratio", 1.5))),
        sortino_ratio=Decimal(str(args.get("sortino_ratio", 1.8))),
        last_updated=datetime.now(timezone.utc)
    )
    
    # Update cache
    funding_service.agent_performance_cache[agent_id] = performance_metrics
    
    # Calculate new scores
    performance_score = funding_service._calculate_performance_score(performance_metrics)
    
    # Determine if agent qualifies for bonus allocation
    bonus_eligible = (
        performance_score > 0.8 and
        float(performance_metrics.sharpe_ratio) > 1.5 and
        float(performance_metrics.max_drawdown) < 0.10
    )
    
    result = {
        "agent_id": agent_id,
        "performance_updated": True,
        "performance_score": round(performance_score, 3),
        "tier_classification": "top_performer" if performance_score > 0.8 else "good_performer" if performance_score > 0.6 else "average_performer",
        "bonus_eligible": bonus_eligible,
        "funding_impact": {
            "increased_allocation_probability": performance_score > 0.7,
            "priority_processing": performance_score > 0.8,
            "reduced_requirements": performance_score > 0.9
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If agent qualifies for bonus, trigger automatic allocation
    if bonus_eligible:
        try:
            bonus_amount = min(10000, max(1000, float(performance_metrics.total_return) * 1000))
            await funding_service._execute_funding_allocation(
                agent_id=agent_id,
                amount=Decimal(str(bonus_amount)),
                strategy=FundingStrategy.PERFORMANCE_BASED,
                reason=f"Performance bonus - Score: {performance_score:.3f}"
            )
            result["bonus_allocated"] = bonus_amount
            result["bonus_reason"] = "Automatic performance bonus"
        except Exception as e:
            logger.error(f"Error allocating performance bonus: {e}")
            result["bonus_error"] = str(e)
    
    return result

async def get_funding_analytics(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get comprehensive funding analytics"""
    
    if not funding_service:
        raise HTTPException(status_code=503, detail="Funding service not available")
    
    time_range_days = args.get("time_range_days", 30)
    include_predictions = args.get("include_predictions", False)
    
    # Get funding analytics
    analytics = await funding_service.get_funding_analytics()
    
    # Enhanced analytics
    result = {
        **analytics,
        "time_range_days": time_range_days,
        "performance_analytics": {
            "top_performers": [
                {"agent_id": "marcus_momentum", "allocation": 125000, "return_rate": 0.089},
                {"agent_id": "alex_arbitrage", "allocation": 110000, "return_rate": 0.084},
                {"agent_id": "sophia_reversion", "allocation": 95000, "return_rate": 0.076}
            ],
            "funding_efficiency": {
                "roi_on_allocated_capital": 0.067,
                "average_time_to_profitability": "12.5 days",
                "capital_utilization_rate": 0.78
            }
        },
        "risk_metrics": {
            "total_capital_at_risk": float(funding_service.total_funds_allocated) * 0.15,
            "diversification_score": 0.82,
            "max_single_agent_exposure": 0.25
        }
    }
    
    if include_predictions:
        # Add predictive analytics
        result["predictions"] = {
            "expected_funding_demand_24h": "high",
            "optimal_allocation_strategy": "performance_based",
            "predicted_top_performers": ["marcus_momentum", "alex_arbitrage"],
            "risk_adjusted_recommendations": {
                "increase_allocation": ["marcus_momentum"],
                "maintain_allocation": ["alex_arbitrage", "sophia_reversion"],
                "reduce_allocation": []
            }
        }
    
    return result

async def get_funding_opportunities(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get current funding opportunities"""
    
    if not funding_service:
        raise HTTPException(status_code=503, detail="Funding service not available")
    
    agent_id = args.get("agent_id")
    min_allocation = args.get("min_allocation", 1000)
    risk_tolerance = args.get("risk_tolerance", 0.5)
    
    # Get market-based opportunities
    opportunities = []
    
    # High-frequency arbitrage opportunities
    opportunities.append({
        "opportunity_id": f"hft_arb_{int(datetime.now().timestamp())}",
        "type": "hft_arbitrage",
        "description": "High-frequency arbitrage funding opportunity",
        "recommended_allocation": 25000,
        "expected_return": 0.08,
        "risk_score": 0.3,
        "duration": "24-48 hours",
        "requirements": {
            "min_sharpe_ratio": 1.5,
            "max_drawdown_tolerance": 0.10,
            "min_experience_trades": 50
        }
    })
    
    # Cross-chain trading opportunity
    opportunities.append({
        "opportunity_id": f"cross_chain_{int(datetime.now().timestamp())}",
        "type": "cross_chain_trading",
        "description": "Multi-chain trading expansion funding",
        "recommended_allocation": 15000,
        "expected_return": 0.06,
        "risk_score": 0.4,
        "duration": "1-2 weeks",
        "requirements": {
            "multi_chain_experience": True,
            "min_portfolio_value": 10000
        }
    })
    
    # Filter opportunities based on agent profile
    if agent_id:
        performance = await funding_service._get_agent_performance(agent_id)
        if performance:
            # Filter based on agent's performance and risk tolerance
            filtered_opportunities = []
            for opp in opportunities:
                if opp["risk_score"] <= risk_tolerance and opp["recommended_allocation"] >= min_allocation:
                    # Check if agent meets requirements
                    if float(performance.sharpe_ratio) >= opp.get("requirements", {}).get("min_sharpe_ratio", 0):
                        filtered_opportunities.append(opp)
            opportunities = filtered_opportunities
    
    return {
        "agent_id": agent_id,
        "opportunities": opportunities,
        "total_opportunities": len(opportunities),
        "total_potential_allocation": sum(opp["recommended_allocation"] for opp in opportunities),
        "risk_tolerance": risk_tolerance,
        "market_conditions": {
            "funding_availability": "high",
            "market_volatility": "moderate",
            "optimal_strategies": ["arbitrage", "cross_chain"]
        },
        "scan_timestamp": datetime.now(timezone.utc).isoformat()
    }

async def emergency_funding_stop(args: Dict[str, Any]) -> Dict[str, Any]:
    """Emergency stop funding operations"""
    
    if not funding_service:
        raise HTTPException(status_code=503, detail="Funding service not available")
    
    reason = args["reason"]
    affected_agents = args.get("affected_agents", [])
    
    # Execute emergency stop
    result = await funding_service.emergency_stop_funding(reason)
    
    # Add additional information
    result.update({
        "affected_agents": affected_agents if affected_agents else "all_agents",
        "funds_secured": True,
        "pending_requests_cancelled": True,
        "new_requests_blocked": True,
        "restoration_process": "manual_approval_required"
    })
    
    logger.critical(f"EMERGENCY FUNDING STOP: {reason}")
    
    return result

# Health and status endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "funding_service": funding_service is not None
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/status")
async def get_status():
    """Get detailed server status"""
    if funding_service:
        funding_status = await funding_service.get_service_status()
    else:
        funding_status = {"error": "Service not available"}
    
    return {
        "server": "Agent Funding MCP Server",
        "version": "1.0.0",
        "funding_service": funding_status,
        "available_tools": len(MCP_TOOLS),
        "autonomous_funding_enabled": True,
        "performance_tracking_enabled": True,
        "last_health_check": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "agent_funding_mcp:app",
        host="0.0.0.0",
        port=8003,
        reload=False,
        log_level="info"
    )