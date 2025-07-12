"""
Leverage Engine API Routes
RESTful endpoints for leverage management and monitoring
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
import logging

from pydantic import BaseModel, Field, validator
from services.leverage_engine_service import get_leverage_engine_service, LeveragePosition, LeverageRiskMetrics
from services.risk_management_service import get_risk_management_service, LeverageRiskControl
from core.service_registry import ServiceRegistry

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/leverage", tags=["Leverage Management"])

# Request/Response Models

class SetLeverageRequest(BaseModel):
    """Request to set agent leverage"""
    agent_id: str
    asset: str
    leverage_ratio: float = Field(ge=1.0, le=20.0)
    
    @validator('leverage_ratio')
    def validate_leverage(cls, v):
        if v < 1.0 or v > 20.0:
            raise ValueError('Leverage must be between 1x and 20x')
        return v


class ExecuteLeveragePositionRequest(BaseModel):
    """Request to execute leveraged position"""
    agent_id: str
    asset: str
    side: str = Field(regex="^(long|short)$")
    size: float = Field(gt=0)
    leverage: float = Field(ge=1.0, le=20.0)
    price: Optional[float] = None
    market_conditions: Optional[Dict[str, Any]] = {}


class CoordinateLeverageRequest(BaseModel):
    """Request for cross-agent leverage coordination"""
    agent_ids: List[str]
    strategy: str = "balanced"
    max_portfolio_leverage: float = Field(default=10.0, le=15.0)
    risk_tolerance: str = Field(default="moderate", regex="^(conservative|moderate|aggressive)$")


class LeverageControlsRequest(BaseModel):
    """Request to update leverage controls"""
    agent_id: str
    max_leverage: float = Field(default=20.0, le=20.0)
    max_portfolio_leverage: float = Field(default=10.0, le=15.0)
    margin_call_threshold: float = Field(default=0.8, ge=0.5, le=0.95)
    liquidation_threshold: float = Field(default=0.95, ge=0.8, le=0.99)
    enable_auto_delever: bool = True


class LeverageStatusResponse(BaseModel):
    """Agent leverage status response"""
    agent_id: str
    agent_name: str
    current_leverage: float
    max_leverage: float
    margin_usage: float
    available_margin: float
    total_margin_used: float
    positions_count: int
    liquidation_risk_score: float
    risk_level: str
    recommendations: List[str]


class PortfolioLeverageResponse(BaseModel):
    """Portfolio-wide leverage response"""
    total_portfolio_leverage: float
    total_margin_used: float
    total_available_margin: float
    agents_count: int
    high_risk_agents: int
    portfolio_var_1d: float
    coordination_score: float
    recommendations: List[str]


# API Endpoints

@router.post("/set-agent-leverage")
async def set_agent_leverage(
    request: SetLeverageRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Set leverage ratio for a specific agent and asset"""
    try:
        leverage_service = await get_leverage_engine_service()
        
        # Validate leverage limits
        risk_service = await get_risk_management_service()
        validation = await risk_service.validate_leverage_limits(
            request.agent_id, request.asset, request.leverage_ratio
        )
        
        if not validation["approved"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Leverage validation failed",
                    "issues": validation["critical_issues"],
                    "max_allowed": validation["max_allowed_leverage"]
                }
            )
        
        # Set the leverage
        success = await leverage_service.set_agent_leverage(
            request.agent_id, request.asset, request.leverage_ratio
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to set agent leverage"
            )
        
        # Schedule background risk monitoring update
        background_tasks.add_task(
            monitor_agent_leverage_background, request.agent_id
        )
        
        return {
            "success": True,
            "agent_id": request.agent_id,
            "asset": request.asset,
            "leverage_ratio": request.leverage_ratio,
            "warnings": validation.get("warnings", []),
            "message": f"Leverage set to {request.leverage_ratio}x for {request.agent_id}"
        }
        
    except Exception as e:
        logger.error(f"Error setting agent leverage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agent-status/{agent_id}")
async def get_agent_leverage_status(agent_id: str) -> LeverageStatusResponse:
    """Get comprehensive leverage status for an agent"""
    try:
        leverage_service = await get_leverage_engine_service()
        risk_service = await get_risk_management_service()
        
        # Get leverage risk metrics
        risk_metrics = await leverage_service.get_leverage_risk_metrics(agent_id)
        
        # Get real-time risk monitoring
        monitoring_data = await risk_service.monitor_real_time_leverage_risk(agent_id)
        
        return LeverageStatusResponse(
            agent_id=agent_id,
            agent_name=f"Agent-{agent_id[-6:]}",  # Mock name
            current_leverage=risk_metrics.portfolio_leverage,
            max_leverage=20.0,  # From configuration
            margin_usage=risk_metrics.margin_usage_percentage,
            available_margin=float(risk_metrics.available_margin),
            total_margin_used=float(risk_metrics.total_margin_used),
            positions_count=len(leverage_service.active_positions.get(agent_id, [])),
            liquidation_risk_score=risk_metrics.liquidation_risk_score,
            risk_level=risk_metrics.risk_level.value,
            recommendations=monitoring_data.get("recommendations", [])
        )
        
    except Exception as e:
        logger.error(f"Error getting agent leverage status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-leveraged-position")
async def execute_leveraged_position(
    request: ExecuteLeveragePositionRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Execute a leveraged trading position"""
    try:
        leverage_service = await get_leverage_engine_service()
        
        # Prepare position data
        position_data = {
            "asset": request.asset,
            "side": request.side,
            "size": request.size,
            "leverage": request.leverage,
            "price": request.price,
            "market_conditions": request.market_conditions
        }
        
        # Execute the leveraged position
        result = await leverage_service.execute_leveraged_position(
            request.agent_id, position_data
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Failed to execute leveraged position",
                    "details": result.get("error", "Unknown error")
                }
            )
        
        # Schedule background monitoring
        background_tasks.add_task(
            monitor_agent_leverage_background, request.agent_id
        )
        
        return {
            "success": True,
            "position_id": result["position_id"],
            "agent_id": request.agent_id,
            "leverage_ratio": result["leverage_ratio"],
            "margin_used": result["margin_used"],
            "liquidation_price": result["liquidation_price"],
            "trade_details": result["trade_result"]
        }
        
    except Exception as e:
        logger.error(f"Error executing leveraged position: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio-exposure")
async def get_portfolio_leverage_exposure() -> PortfolioLeverageResponse:
    """Get portfolio-wide leverage exposure and metrics"""
    try:
        leverage_service = await get_leverage_engine_service()
        risk_service = await get_risk_management_service()
        
        # Get all active agents (mock data for now)
        active_agents = ["agent_1", "agent_2", "agent_3", "agent_4"]
        
        # Calculate portfolio metrics
        total_leverage = 0.0
        total_margin_used = 0.0
        total_available_margin = 0.0
        high_risk_count = 0
        portfolio_var = 0.0
        
        for agent_id in active_agents:
            try:
                metrics = await leverage_service.get_leverage_risk_metrics(agent_id)
                risk_monitoring = await risk_service.monitor_real_time_leverage_risk(agent_id)
                
                total_leverage += metrics.portfolio_leverage
                total_margin_used += float(metrics.total_margin_used)
                total_available_margin += float(metrics.available_margin)
                portfolio_var += float(metrics.var_with_leverage)
                
                if risk_monitoring.get("risk_level") == "HIGH":
                    high_risk_count += 1
                    
            except Exception as e:
                logger.warning(f"Error getting metrics for agent {agent_id}: {e}")
                continue
        
        avg_leverage = total_leverage / len(active_agents) if active_agents else 0.0
        total_margin = total_margin_used + total_available_margin
        margin_usage = (total_margin_used / total_margin) if total_margin > 0 else 0.0
        
        # Calculate coordination score (simplified)
        coordination_score = max(0, 100 - (high_risk_count * 25) - (margin_usage * 50))
        
        # Generate recommendations
        recommendations = []
        if avg_leverage > 12.0:
            recommendations.append("Portfolio leverage above 12x - consider reduction")
        if high_risk_count > 0:
            recommendations.append(f"{high_risk_count} agents at high risk - immediate attention required")
        if margin_usage > 0.8:
            recommendations.append("High margin usage - monitor for margin calls")
        if not recommendations:
            recommendations.append("Portfolio leverage levels are within acceptable ranges")
        
        return PortfolioLeverageResponse(
            total_portfolio_leverage=avg_leverage,
            total_margin_used=total_margin_used,
            total_available_margin=total_available_margin,
            agents_count=len(active_agents),
            high_risk_agents=high_risk_count,
            portfolio_var_1d=portfolio_var,
            coordination_score=coordination_score,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error getting portfolio leverage exposure: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emergency-delever")
async def emergency_delever_agent(
    agent_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Execute emergency deleveraging for an agent"""
    try:
        leverage_service = await get_leverage_engine_service()
        risk_service = await get_risk_management_service()
        
        # Auto-delever the agent
        delever_result = await leverage_service.auto_delever_on_risk(agent_id, risk_threshold=0.5)
        
        if not delever_result:
            raise HTTPException(
                status_code=500,
                detail="Emergency deleveraging failed"
            )
        
        # Enforce risk limits
        risk_enforcement = await risk_service.enforce_leverage_limits(agent_id)
        
        # Schedule continued monitoring
        background_tasks.add_task(
            monitor_agent_leverage_background, agent_id
        )
        
        return {
            "success": True,
            "agent_id": agent_id,
            "action": "emergency_delever",
            "delever_result": delever_result,
            "risk_enforcement": risk_enforcement,
            "message": f"Emergency deleveraging executed for agent {agent_id}"
        }
        
    except Exception as e:
        logger.error(f"Error in emergency deleveraging: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-metrics")
async def get_leverage_risk_metrics(agent_id: Optional[str] = None) -> Dict[str, Any]:
    """Get comprehensive leverage risk metrics"""
    try:
        leverage_service = await get_leverage_engine_service()
        risk_service = await get_risk_management_service()
        
        if agent_id:
            # Single agent metrics
            metrics = await leverage_service.get_leverage_risk_metrics(agent_id)
            var_data = await risk_service.calculate_leverage_var(agent_id)
            stress_test = await risk_service.stress_test_leveraged_portfolio(agent_id)
            
            return {
                "agent_id": agent_id,
                "leverage_metrics": {
                    "portfolio_leverage": metrics.portfolio_leverage,
                    "margin_usage": metrics.margin_usage_percentage,
                    "liquidation_risk": metrics.liquidation_risk_score,
                    "risk_level": metrics.risk_level.value
                },
                "var_analysis": var_data,
                "stress_test_results": stress_test
            }
        else:
            # Portfolio-wide metrics
            active_agents = ["agent_1", "agent_2", "agent_3", "agent_4"]  # Mock data
            portfolio_metrics = {}
            
            for agent in active_agents:
                try:
                    metrics = await leverage_service.get_leverage_risk_metrics(agent)
                    portfolio_metrics[agent] = {
                        "leverage": metrics.portfolio_leverage,
                        "margin_usage": metrics.margin_usage_percentage,
                        "risk_level": metrics.risk_level.value
                    }
                except Exception as e:
                    logger.warning(f"Error getting metrics for {agent}: {e}")
            
            return {
                "portfolio_metrics": portfolio_metrics,
                "summary": {
                    "total_agents": len(active_agents),
                    "avg_leverage": sum(m["leverage"] for m in portfolio_metrics.values()) / len(portfolio_metrics) if portfolio_metrics else 0,
                    "high_risk_agents": len([m for m in portfolio_metrics.values() if m["risk_level"] == "HIGH"])
                }
            }
        
    except Exception as e:
        logger.error(f"Error getting leverage risk metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/coordinate-agents")
async def coordinate_agent_leverage(
    request: CoordinateLeverageRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Coordinate leverage allocation across multiple agents"""
    try:
        leverage_service = await get_leverage_engine_service()
        
        # Execute coordination
        coordination_result = await leverage_service.coordinate_leverage_across_agents(
            request.agent_ids
        )
        
        if "error" in coordination_result:
            raise HTTPException(
                status_code=500,
                detail=coordination_result["error"]
            )
        
        # Apply recommended leverage changes (in background)
        background_tasks.add_task(
            apply_coordination_background,
            request.agent_ids,
            coordination_result["agent_allocations"]
        )
        
        return {
            "success": True,
            "coordination_strategy": request.strategy,
            "agents_coordinated": len(request.agent_ids),
            "total_portfolio_leverage": coordination_result["total_portfolio_leverage"],
            "agent_allocations": coordination_result["agent_allocations"],
            "risk_distribution": coordination_result["risk_distribution"],
            "recommendations": coordination_result["recommendations"]
        }
        
    except Exception as e:
        logger.error(f"Error coordinating agent leverage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/leverage-controls/{agent_id}")
async def update_leverage_controls(
    agent_id: str,
    request: LeverageControlsRequest
) -> Dict[str, Any]:
    """Update leverage controls for an agent"""
    try:
        risk_service = await get_risk_management_service()
        
        # Create new leverage controls
        controls = LeverageRiskControl(
            agent_id=agent_id,
            max_leverage=request.max_leverage,
            max_portfolio_leverage=request.max_portfolio_leverage,
            margin_call_threshold=request.margin_call_threshold,
            liquidation_threshold=request.liquidation_threshold,
            enable_auto_delever=request.enable_auto_delever
        )
        
        # Store controls
        risk_service.leverage_controls[agent_id] = controls
        
        return {
            "success": True,
            "agent_id": agent_id,
            "leverage_controls": {
                "max_leverage": controls.max_leverage,
                "max_portfolio_leverage": controls.max_portfolio_leverage,
                "margin_call_threshold": controls.margin_call_threshold,
                "liquidation_threshold": controls.liquidation_threshold,
                "auto_delever_enabled": controls.enable_auto_delever
            },
            "message": f"Leverage controls updated for agent {agent_id}"
        }
        
    except Exception as e:
        logger.error(f"Error updating leverage controls: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def get_leverage_system_health() -> Dict[str, Any]:
    """Get leverage system health status"""
    try:
        leverage_service = await get_leverage_engine_service()
        risk_service = await get_risk_management_service()
        
        # Basic health checks
        health_status = {
            "leverage_engine": "healthy",
            "risk_management": "healthy",
            "active_positions": len([pos for positions in leverage_service.active_positions.values() for pos in positions]),
            "monitored_agents": len(leverage_service.leverage_limits),
            "system_status": "operational",
            "last_check": datetime.utcnow().isoformat()
        }
        
        return health_status
        
    except Exception as e:
        logger.error(f"Error getting leverage system health: {e}")
        return {
            "leverage_engine": "error",
            "risk_management": "error",
            "system_status": "degraded",
            "error": str(e),
            "last_check": datetime.utcnow().isoformat()
        }


# Background Tasks

async def monitor_agent_leverage_background(agent_id: str):
    """Background task to monitor agent leverage"""
    try:
        risk_service = await get_risk_management_service()
        await risk_service.monitor_real_time_leverage_risk(agent_id)
        logger.info(f"Background leverage monitoring completed for {agent_id}")
    except Exception as e:
        logger.error(f"Error in background leverage monitoring: {e}")


async def apply_coordination_background(agent_ids: List[str], allocations: Dict[str, Any]):
    """Background task to apply coordination results"""
    try:
        leverage_service = await get_leverage_engine_service()
        
        for agent_id in agent_ids:
            if agent_id in allocations:
                allocation = allocations[agent_id]
                recommended_leverage = allocation.get("recommended_leverage", 1.0)
                
                # Apply the recommended leverage
                await leverage_service.set_agent_leverage(
                    agent_id, "default", recommended_leverage
                )
        
        logger.info(f"Background coordination applied for {len(agent_ids)} agents")
    except Exception as e:
        logger.error(f"Error applying coordination in background: {e}")


# Error Handlers

@router.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return {"error": "Invalid input", "details": str(exc)}


@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception in leverage routes: {exc}")
    return {"error": "Internal server error", "details": "An unexpected error occurred"}