#!/usr/bin/env python3
"""
Simple FastAPI Backend for Dashboard Integration
Provides core endpoints for frontend API integration
"""

import asyncio
import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, AsyncGenerator
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events"""
    logger.info("Starting background tasks...")
    
    # Start WebSocket broadcasting
    broadcast_task = asyncio.create_task(broadcast_real_time_data())
    
    # Initialize performance service if available
    if PERFORMANCE_SERVICES_AVAILABLE:
        await performance_service.initialize()
        logger.info("Performance optimization service initialized")
    
    # Initialize monitoring service if available
    if MONITORING_SERVICES_AVAILABLE:
        await monitoring_service.initialize()
        logger.info("Monitoring service initialized")
    
    logger.info("Background tasks started successfully")
    
    yield
    
    logger.info("Shutting down background tasks...")
    broadcast_task.cancel()
    
    # Cleanup performance service
    if PERFORMANCE_SERVICES_AVAILABLE and performance_service.auto_cleanup_task:
        performance_service.auto_cleanup_task.cancel()
    
    # Cleanup monitoring service
    if MONITORING_SERVICES_AVAILABLE and monitoring_service.monitoring_task:
        monitoring_service.monitoring_task.cancel()
    
    try:
        await broadcast_task
    except asyncio.CancelledError:
        logger.info("Background tasks cancelled")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Cival Trading Dashboard API",
    description="Backend API for AI Trading Dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class APIResponse(BaseModel):
    success: bool = True
    message: str = ""
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = datetime.now()

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "cival-backend-api"
    version: str = "1.0.0"
    timestamp: datetime = datetime.now()

class WebSocketMessage(BaseModel):
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = datetime.now()

# WebSocket connection manager
class WebSocketConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscription_data = {}
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connection established. Total connections: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket connection closed. Total connections: {len(self.active_connections)}")
    
    async def send_message(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
            self.disconnect(websocket)
    
    async def broadcast_message(self, message: dict):
        """Broadcast message to all connected clients"""
        if self.active_connections:
            logger.info(f"Broadcasting message to {len(self.active_connections)} clients")
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for connection in disconnected:
                self.disconnect(connection)

# Create WebSocket manager instance
ws_manager = WebSocketConnectionManager()

# Background task function for real-time broadcasts
async def broadcast_real_time_data():
    """Background task to broadcast real-time data to connected clients"""
    while True:
        try:
            # Portfolio updates
            portfolio_update = {
                "type": "portfolio_update",
                "data": {
                    "total_equity": 125000.00 + (asyncio.get_event_loop().time() % 100),
                    "daily_pnl": 1250.00 + (asyncio.get_event_loop().time() % 50),
                    "unrealized_pnl": 5000.00 + (asyncio.get_event_loop().time() % 200),
                    "last_updated": datetime.now().isoformat()
                },
                "timestamp": datetime.now().isoformat()
            }
            await ws_manager.broadcast_message(portfolio_update)
            
            # Wait 5 seconds before next broadcast
            await asyncio.sleep(5)
            
            # Agent status updates
            agent_update = {
                "type": "agent_status_update",
                "data": {
                    "active_agents": 3,
                    "total_trades": 45 + int(asyncio.get_event_loop().time() % 10),
                    "agents": [
                        {
                            "name": "Marcus Momentum",
                            "status": "active",
                            "last_action": datetime.now().isoformat()
                        },
                        {
                            "name": "Alex Arbitrage", 
                            "status": "active",
                            "last_action": datetime.now().isoformat()
                        }
                    ]
                },
                "timestamp": datetime.now().isoformat()
            }
            await ws_manager.broadcast_message(agent_update)
            
            # Wait 10 seconds before next broadcast
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error(f"Error in broadcast task: {e}")
            await asyncio.sleep(5)

# Health endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse()

# Portfolio endpoints
@app.get("/api/v1/portfolio/summary")
async def get_portfolio_summary():
    """Get portfolio summary"""
    return APIResponse(
        message="Portfolio summary retrieved",
        data={
            "total_equity": 125000.00,
            "cash_balance": 25000.00,
            "total_position_value": 100000.00,
            "total_unrealized_pnl": 5000.00,
            "total_realized_pnl": 2500.00,
            "total_pnl": 7500.00,
            "daily_pnl": 1250.00,
            "total_return_percent": 6.0,
            "number_of_positions": 8,
            "long_positions": 6,
            "short_positions": 2,
            "last_updated": datetime.now().isoformat()
        }
    )

@app.get("/api/v1/portfolio/positions")
async def get_portfolio_positions():
    """Get current positions"""
    return APIResponse(
        message="Positions retrieved",
        data=[
            {
                "symbol": "BTCUSD",
                "quantity": 0.5,
                "avg_cost": 45000.00,
                "current_price": 47000.00,
                "market_value": 23500.00,
                "unrealized_pnl": 1000.00,
                "realized_pnl": 0.00,
                "pnl_percent": 4.44,
                "last_updated": datetime.now().isoformat()
            },
            {
                "symbol": "ETHUSD", 
                "quantity": 10.0,
                "avg_cost": 2800.00,
                "current_price": 2950.00,
                "market_value": 29500.00,
                "unrealized_pnl": 1500.00,
                "realized_pnl": 0.00,
                "pnl_percent": 5.36,
                "last_updated": datetime.now().isoformat()
            }
        ]
    )

# Agent endpoints
@app.get("/api/v1/agents/status")
async def get_agent_status():
    """Get agent status overview"""
    return APIResponse(
        message="Agent status retrieved",
        data={
            "total_agents": 4,
            "active_agents": 3,
            "paused_agents": 1,
            "agents": [
                {
                    "id": "agent_marcus_momentum",
                    "name": "Marcus Momentum",
                    "strategy": "momentum",
                    "status": "active",
                    "performance": {
                        "total_pnl": 2500.00,
                        "win_rate": 72.5,
                        "total_trades": 45,
                        "active_positions": 3
                    }
                },
                {
                    "id": "agent_alex_arbitrage",
                    "name": "Alex Arbitrage", 
                    "strategy": "arbitrage",
                    "status": "active",
                    "performance": {
                        "total_pnl": 1800.00,
                        "win_rate": 68.2,
                        "total_trades": 32,
                        "active_positions": 2
                    }
                }
            ]
        }
    )

# Market data endpoints
@app.get("/api/v1/market/live-data/{symbol}")
async def get_live_market_data(symbol: str):
    """Get live market data for symbol"""
    return APIResponse(
        message=f"Live data for {symbol}",
        data={
            "symbol": symbol,
            "price": 47250.00 if symbol.upper() == "BTCUSD" else 2975.00,
            "change_24h": 2.5,
            "change_percent_24h": 5.3,
            "volume_24h": 15000000.00,
            "high_24h": 47500.00 if symbol.upper() == "BTCUSD" else 3000.00,
            "low_24h": 46000.00 if symbol.upper() == "BTCUSD" else 2900.00,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/api/v1/market/watchlist")
async def get_market_watchlist():
    """Get market watchlist"""
    return APIResponse(
        message="Watchlist retrieved",
        data=[
            {"symbol": "BTCUSD", "price": 47250.00, "change_percent": 5.3},
            {"symbol": "ETHUSD", "price": 2975.00, "change_percent": 3.2},
            {"symbol": "SOLUSD", "price": 185.50, "change_percent": 8.1},
            {"symbol": "ADAUSD", "price": 0.85, "change_percent": -2.1}
        ]
    )

# Trading endpoints
@app.post("/api/v1/trading/paper/order")
async def create_paper_trade_order(order_data: dict):
    """Create a paper trading order"""
    return APIResponse(
        message="Paper trade order created",
        data={
            "order_id": f"order_{datetime.now().timestamp()}",
            "symbol": order_data.get("symbol", "BTCUSD"),
            "side": order_data.get("side", "buy"),
            "quantity": order_data.get("quantity", 0.1),
            "price": order_data.get("price", 47250.00),
            "status": "filled",
            "created_at": datetime.now().isoformat()
        }
    )

@app.get("/api/v1/trading/paper/portfolio")
async def get_paper_portfolio():
    """Get paper trading portfolio"""
    return APIResponse(
        message="Paper portfolio retrieved",
        data={
            "cash_balance": 50000.00,
            "total_value": 72500.00,
            "unrealized_pnl": 22500.00,
            "realized_pnl": 0.00,
            "positions": [
                {"symbol": "BTCUSD", "quantity": 0.5, "value": 23500.00},
                {"symbol": "ETHUSD", "quantity": 10.0, "value": 29500.00}
            ]
        }
    )

# Risk management endpoints
@app.get("/api/v1/risk/metrics")
async def get_risk_metrics():
    """Get comprehensive risk metrics"""
    return APIResponse(
        message="Risk metrics retrieved",
        data={
            "portfolio_var": 0.02,
            "max_drawdown": 0.05,
            "sharpe_ratio": 1.8,
            "beta": 0.75,
            "volatility": 0.15,
            "risk_level": "moderate",
            "alerts": []
        }
    )

# AI Services Integration
try:
    from services.llm_service import llm_service, LLMRequest
    from services.sentiment_analysis_service import sentiment_service
    from services.risk_assessment_service import risk_service
    from services.advanced_trading_service import trading_service, TradingStrategy, OrderSide
    from services.performance_optimization_service import performance_service
    from services.monitoring_service import monitoring_service
    AI_SERVICES_AVAILABLE = True
    TRADING_SERVICES_AVAILABLE = True
    PERFORMANCE_SERVICES_AVAILABLE = True
    MONITORING_SERVICES_AVAILABLE = True
    logger.info("AI services, trading services, performance optimization, and monitoring services loaded successfully")
except ImportError as e:
    AI_SERVICES_AVAILABLE = False
    TRADING_SERVICES_AVAILABLE = False
    PERFORMANCE_SERVICES_AVAILABLE = False
    MONITORING_SERVICES_AVAILABLE = False
    logger.warning(f"Services not available: {e}")

# AI Services endpoints
@app.post("/api/v1/ai/llm/generate")
async def generate_llm_response(request_data: dict):
    """Generate AI response using LLM"""
    if not AI_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="AI services not available",
            data={"error": "LLM service not loaded"}
        )
    
    try:
        llm_request = LLMRequest(**request_data)
        response = await llm_service.generate_response(llm_request)
        
        return APIResponse(
            message="LLM response generated",
            data=response.dict()
        )
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return APIResponse(
            success=False,
            message="LLM generation failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/ai/sentiment/analyze")
async def analyze_sentiment(request_data: dict):
    """Analyze market sentiment"""
    if not AI_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="AI services not available",
            data={"error": "Sentiment service not loaded"}
        )
    
    try:
        market_data = request_data.get("market_data", {
            "BTCUSD": {"price": 47250.00, "change_24h": 5.3, "volume_24h": 15000000},
            "ETHUSD": {"price": 2975.00, "change_24h": 3.2, "volume_24h": 8000000}
        })
        
        sentiment = await sentiment_service.analyze_market_sentiment(market_data)
        
        return APIResponse(
            message="Sentiment analysis completed",
            data=sentiment.dict()
        )
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        return APIResponse(
            success=False,
            message="Sentiment analysis failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/ai/risk/assess")
async def assess_portfolio_risk(request_data: dict):
    """Assess portfolio risk"""
    if not AI_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="AI services not available",
            data={"error": "Risk service not loaded"}
        )
    
    try:
        portfolio = request_data.get("portfolio", {
            "total_value": 125000.00,
            "positions": [
                {"symbol": "BTCUSD", "quantity": 0.5, "market_value": 23500.00},
                {"symbol": "ETHUSD", "quantity": 10.0, "market_value": 29500.00}
            ]
        })
        
        market_data = request_data.get("market_data", {
            "BTCUSD": {"price": 47250.00, "change_24h": 5.3, "volume_24h": 15000000},
            "ETHUSD": {"price": 2975.00, "change_24h": 3.2, "volume_24h": 8000000}
        })
        
        risk_metrics = await risk_service.calculate_portfolio_risk(portfolio, market_data)
        
        return APIResponse(
            message="Risk assessment completed",
            data=risk_metrics.dict()
        )
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        return APIResponse(
            success=False,
            message="Risk assessment failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/ai/trading/decision")
async def generate_trading_decision(request_data: dict):
    """Generate AI-powered trading decision"""
    if not AI_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="AI services not available",
            data={"error": "LLM service not loaded"}
        )
    
    try:
        symbol = request_data.get("symbol", "BTCUSD")
        market_data = request_data.get("market_data", {
            "price": 47250.00,
            "change_24h": 5.3,
            "volume_24h": 15000000,
            "rsi": 65,
            "macd": "bullish"
        })
        portfolio_context = request_data.get("portfolio_context", {
            "total_value": 125000.00,
            "cash_balance": 25000.00,
            "risk_tolerance": "medium"
        })
        
        decision = await llm_service.generate_trading_decision(symbol, market_data, portfolio_context)
        
        return APIResponse(
            message="Trading decision generated",
            data=decision.dict()
        )
    except Exception as e:
        logger.error(f"Trading decision generation failed: {e}")
        return APIResponse(
            success=False,
            message="Trading decision generation failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/ai/status")
async def get_ai_services_status():
    """Get AI services status"""
    try:
        services_status = []
        
        if AI_SERVICES_AVAILABLE:
            # Get individual service statuses
            llm_status = await llm_service.get_service_status()
            sentiment_status = await sentiment_service.get_service_status()
            risk_status = await risk_service.get_service_status()
            
            services_status = [llm_status, sentiment_status, risk_status]
        
        return APIResponse(
            message="AI services status retrieved",
            data={
                "ai_services_available": AI_SERVICES_AVAILABLE,
                "total_ai_services": len(services_status),
                "services": services_status
            }
        )
    except Exception as e:
        logger.error(f"AI services status check failed: {e}")
        return APIResponse(
            success=False,
            message="AI services status check failed",
            data={"error": str(e)}
        )

# Advanced Trading endpoints
@app.post("/api/v1/trading/order/create")
async def create_trading_order(request_data: dict):
    """Create advanced trading order"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        order = await trading_service.create_order(request_data)
        
        return APIResponse(
            message="Trading order created",
            data=order.dict()
        )
    except Exception as e:
        logger.error(f"Order creation failed: {e}")
        return APIResponse(
            success=False,
            message="Order creation failed",
            data={"error": str(e)}
        )

@app.delete("/api/v1/trading/order/{order_id}")
async def cancel_trading_order(order_id: str):
    """Cancel trading order"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        success = await trading_service.cancel_order(order_id)
        
        return APIResponse(
            message="Order cancelled" if success else "Order cancellation failed",
            data={"order_id": order_id, "cancelled": success}
        )
    except Exception as e:
        logger.error(f"Order cancellation failed: {e}")
        return APIResponse(
            success=False,
            message="Order cancellation failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/trading/signals/generate")
async def generate_trading_signals(request_data: dict):
    """Generate trading signals"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        market_data = request_data.get("market_data", {
            "BTCUSD": {"price": 47250.00, "change_24h": 5.3, "volume_24h": 15000000},
            "ETHUSD": {"price": 2975.00, "change_24h": 3.2, "volume_24h": 8000000}
        })
        
        signals = await trading_service.generate_trading_signals(market_data)
        
        return APIResponse(
            message="Trading signals generated",
            data={
                "signals": [signal.dict() for signal in signals],
                "count": len(signals)
            }
        )
    except Exception as e:
        logger.error(f"Signal generation failed: {e}")
        return APIResponse(
            success=False,
            message="Signal generation failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/trading/strategy/execute")
async def execute_trading_strategy(request_data: dict):
    """Execute trading strategy"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        strategy_name = request_data.get("strategy", "momentum")
        strategy = TradingStrategy(strategy_name)
        
        portfolio = request_data.get("portfolio", {
            "total_value": 125000.00,
            "cash_balance": 25000.00,
            "positions": [
                {"symbol": "BTCUSD", "quantity": 0.5, "market_value": 23500.00},
                {"symbol": "ETHUSD", "quantity": 10.0, "market_value": 29500.00}
            ]
        })
        
        market_data = request_data.get("market_data", {
            "BTCUSD": {"price": 47250.00, "change_24h": 5.3, "volume_24h": 15000000},
            "ETHUSD": {"price": 2975.00, "change_24h": 3.2, "volume_24h": 8000000}
        })
        
        result = await trading_service.execute_strategy(strategy, portfolio, market_data)
        
        return APIResponse(
            message="Trading strategy executed",
            data=result
        )
    except Exception as e:
        logger.error(f"Strategy execution failed: {e}")
        return APIResponse(
            success=False,
            message="Strategy execution failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/trading/portfolio/optimize")
async def optimize_portfolio(request_data: dict):
    """Optimize portfolio allocation"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        portfolio = request_data.get("portfolio", {
            "total_value": 125000.00,
            "positions": [
                {"symbol": "BTCUSD", "quantity": 0.5, "market_value": 23500.00},
                {"symbol": "ETHUSD", "quantity": 10.0, "market_value": 29500.00}
            ]
        })
        
        target_allocation = request_data.get("target_allocation", {
            "BTCUSD": 0.4,  # 40%
            "ETHUSD": 0.3,  # 30%
            "SOLUSD": 0.2,  # 20%
            "cash": 0.1     # 10%
        })
        
        optimization = await trading_service.optimize_portfolio(portfolio, target_allocation)
        
        return APIResponse(
            message="Portfolio optimization completed",
            data=optimization
        )
    except Exception as e:
        logger.error(f"Portfolio optimization failed: {e}")
        return APIResponse(
            success=False,
            message="Portfolio optimization failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/trading/risk/manage")
async def manage_trading_risk(request_data: dict):
    """Manage trading risk positions"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        portfolio = request_data.get("portfolio", {
            "total_value": 125000.00,
            "positions": [
                {"symbol": "BTCUSD", "quantity": 0.5, "avg_cost": 45000.00, "market_value": 23500.00},
                {"symbol": "ETHUSD", "quantity": 10.0, "avg_cost": 2800.00, "market_value": 29500.00}
            ]
        })
        
        market_data = request_data.get("market_data", {
            "BTCUSD": {"price": 47250.00, "change_24h": 5.3, "volume_24h": 15000000},
            "ETHUSD": {"price": 2975.00, "change_24h": 3.2, "volume_24h": 8000000}
        })
        
        risk_orders = await trading_service.manage_risk_positions(portfolio, market_data)
        
        return APIResponse(
            message="Risk management completed",
            data={
                "risk_orders": [order.dict() for order in risk_orders],
                "orders_created": len(risk_orders)
            }
        )
    except Exception as e:
        logger.error(f"Risk management failed: {e}")
        return APIResponse(
            success=False,
            message="Risk management failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/trading/performance/{strategy}")
async def get_strategy_performance(strategy: str):
    """Get strategy performance metrics"""
    if not TRADING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Trading services not available",
            data={"error": "Trading service not loaded"}
        )
    
    try:
        strategy_enum = TradingStrategy(strategy)
        performance = await trading_service.calculate_strategy_performance(strategy_enum)
        
        return APIResponse(
            message="Strategy performance retrieved",
            data=performance.dict()
        )
    except Exception as e:
        logger.error(f"Strategy performance retrieval failed: {e}")
        return APIResponse(
            success=False,
            message="Strategy performance retrieval failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/trading/status")
async def get_trading_services_status():
    """Get trading services status"""
    try:
        services_status = []
        
        if TRADING_SERVICES_AVAILABLE:
            trading_status = await trading_service.get_service_status()
            services_status.append(trading_status)
        
        return APIResponse(
            message="Trading services status retrieved",
            data={
                "trading_services_available": TRADING_SERVICES_AVAILABLE,
                "total_trading_services": len(services_status),
                "services": services_status
            }
        )
    except Exception as e:
        logger.error(f"Trading services status check failed: {e}")
        return APIResponse(
            success=False,
            message="Trading services status check failed",
            data={"error": str(e)}
        )

# Performance Optimization endpoints
@app.get("/api/v1/performance/cache/stats")
async def get_cache_stats():
    """Get cache performance statistics"""
    if not PERFORMANCE_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Performance services not available",
            data={"error": "Performance service not loaded"}
        )
    
    try:
        cache_stats = performance_service.cache.get_stats()
        
        return APIResponse(
            message="Cache statistics retrieved",
            data=cache_stats
        )
    except Exception as e:
        logger.error(f"Cache stats retrieval failed: {e}")
        return APIResponse(
            success=False,
            message="Cache stats retrieval failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/performance/cache/clear")
async def clear_cache():
    """Clear performance cache"""
    if not PERFORMANCE_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Performance services not available",
            data={"error": "Performance service not loaded"}
        )
    
    try:
        success = await performance_service.cache.clear()
        
        return APIResponse(
            message="Cache cleared successfully" if success else "Cache clear failed",
            data={"cleared": success}
        )
    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        return APIResponse(
            success=False,
            message="Cache clear failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/performance/metrics")
async def get_performance_metrics():
    """Get comprehensive performance metrics"""
    if not PERFORMANCE_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Performance services not available",
            data={"error": "Performance service not loaded"}
        )
    
    try:
        metrics = performance_service.monitor.get_all_metrics()
        
        return APIResponse(
            message="Performance metrics retrieved",
            data={
                "metrics": [metric.dict() for metric in metrics],
                "count": len(metrics)
            }
        )
    except Exception as e:
        logger.error(f"Performance metrics retrieval failed: {e}")
        return APIResponse(
            success=False,
            message="Performance metrics retrieval failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/performance/report")
async def get_performance_report():
    """Get comprehensive performance report"""
    if not PERFORMANCE_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Performance services not available",
            data={"error": "Performance service not loaded"}
        )
    
    try:
        report = await performance_service.get_performance_report()
        
        return APIResponse(
            message="Performance report generated",
            data=report
        )
    except Exception as e:
        logger.error(f"Performance report generation failed: {e}")
        return APIResponse(
            success=False,
            message="Performance report generation failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/performance/optimize")
async def optimize_performance():
    """Auto-optimize performance configuration"""
    if not PERFORMANCE_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Performance services not available",
            data={"error": "Performance service not loaded"}
        )
    
    try:
        optimization_result = await performance_service.optimize_configuration()
        
        return APIResponse(
            message="Performance optimization completed",
            data=optimization_result
        )
    except Exception as e:
        logger.error(f"Performance optimization failed: {e}")
        return APIResponse(
            success=False,
            message="Performance optimization failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/performance/memory/optimize")
async def optimize_memory():
    """Optimize memory usage"""
    if not PERFORMANCE_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Performance services not available",
            data={"error": "Performance service not loaded"}
        )
    
    try:
        memory_result = performance_service.memory_optimizer.optimize_memory()
        
        return APIResponse(
            message="Memory optimization completed",
            data=memory_result
        )
    except Exception as e:
        logger.error(f"Memory optimization failed: {e}")
        return APIResponse(
            success=False,
            message="Memory optimization failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/performance/status")
async def get_performance_status():
    """Get performance optimization service status"""
    try:
        services_status = []
        
        if PERFORMANCE_SERVICES_AVAILABLE:
            performance_status = await performance_service.get_service_status()
            services_status.append(performance_status)
        
        return APIResponse(
            message="Performance services status retrieved",
            data={
                "performance_services_available": PERFORMANCE_SERVICES_AVAILABLE,
                "total_performance_services": len(services_status),
                "services": services_status
            }
        )
    except Exception as e:
        logger.error(f"Performance services status check failed: {e}")
        return APIResponse(
            success=False,
            message="Performance services status check failed",
            data={"error": str(e)}
        )

# Monitoring and Reliability endpoints
@app.get("/api/v1/monitoring/health")
async def get_overall_health():
    """Get overall system health status"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        health_status = await monitoring_service.get_overall_health()
        
        return APIResponse(
            message="Overall health status retrieved",
            data=health_status
        )
    except Exception as e:
        logger.error(f"Health status check failed: {e}")
        return APIResponse(
            success=False,
            message="Health status check failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/monitoring/service/{service_name}")
async def check_service_health(service_name: str):
    """Check health of specific service"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        service_metrics = await monitoring_service.check_service_health(service_name)
        
        return APIResponse(
            message=f"Service {service_name} health checked",
            data=service_metrics.dict()
        )
    except Exception as e:
        logger.error(f"Service health check failed for {service_name}: {e}")
        return APIResponse(
            success=False,
            message=f"Service health check failed for {service_name}",
            data={"error": str(e)}
        )

@app.get("/api/v1/monitoring/alerts")
async def get_active_alerts():
    """Get active alerts"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        active_alerts = monitoring_service.alert_manager.get_active_alerts()
        
        return APIResponse(
            message="Active alerts retrieved",
            data={
                "total_alerts": len(active_alerts),
                "alerts": [alert.dict() for alert in active_alerts]
            }
        )
    except Exception as e:
        logger.error(f"Alert retrieval failed: {e}")
        return APIResponse(
            success=False,
            message="Alert retrieval failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/monitoring/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge alert"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        success = monitoring_service.alert_manager.acknowledge_alert(alert_id)
        
        return APIResponse(
            message=f"Alert {alert_id} acknowledgment status",
            data={"acknowledged": success}
        )
    except Exception as e:
        logger.error(f"Alert acknowledgment failed: {e}")
        return APIResponse(
            success=False,
            message="Alert acknowledgment failed",
            data={"error": str(e)}
        )

@app.post("/api/v1/monitoring/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Resolve alert"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        success = monitoring_service.alert_manager.resolve_alert(alert_id)
        
        return APIResponse(
            message=f"Alert {alert_id} resolution status",
            data={"resolved": success}
        )
    except Exception as e:
        logger.error(f"Alert resolution failed: {e}")
        return APIResponse(
            success=False,
            message="Alert resolution failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/monitoring/circuit-breakers")
async def get_circuit_breakers():
    """Get circuit breaker status"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        circuit_breakers = {}
        for service_name, circuit_breaker in monitoring_service.circuit_breakers.items():
            circuit_breakers[service_name] = circuit_breaker.get_state()
        
        return APIResponse(
            message="Circuit breaker status retrieved",
            data={
                "total_circuit_breakers": len(circuit_breakers),
                "circuit_breakers": circuit_breakers
            }
        )
    except Exception as e:
        logger.error(f"Circuit breaker status check failed: {e}")
        return APIResponse(
            success=False,
            message="Circuit breaker status check failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/monitoring/system-metrics")
async def get_system_metrics():
    """Get system resource metrics"""
    if not MONITORING_SERVICES_AVAILABLE:
        return APIResponse(
            success=False,
            message="Monitoring services not available",
            data={"error": "Monitoring service not loaded"}
        )
    
    try:
        system_metrics = monitoring_service.system_monitor.get_system_metrics()
        
        return APIResponse(
            message="System metrics retrieved",
            data=system_metrics
        )
    except Exception as e:
        logger.error(f"System metrics retrieval failed: {e}")
        return APIResponse(
            success=False,
            message="System metrics retrieval failed",
            data={"error": str(e)}
        )

@app.get("/api/v1/monitoring/status")
async def get_monitoring_status():
    """Get monitoring service status"""
    try:
        services_status = []
        
        if MONITORING_SERVICES_AVAILABLE:
            monitoring_status = await monitoring_service.get_service_status()
            services_status.append(monitoring_status)
        
        return APIResponse(
            message="Monitoring services status retrieved",
            data={
                "monitoring_services_available": MONITORING_SERVICES_AVAILABLE,
                "total_monitoring_services": len(services_status),
                "services": services_status
            }
        )
    except Exception as e:
        logger.error(f"Monitoring services status check failed: {e}")
        return APIResponse(
            success=False,
            message="Monitoring services status check failed",
            data={"error": str(e)}
        )

# Services status endpoint
@app.get("/api/v1/services")
async def get_services_status():
    """Get service registry status"""
    return APIResponse(
        message="Services status retrieved", 
        data={
            "total_services": 25,
            "active_services": 25,
            "services": [
                {"name": "portfolio_service", "status": "healthy", "uptime": "99.9%"},
                {"name": "market_data_service", "status": "healthy", "uptime": "99.8%"},
                {"name": "trading_service", "status": "healthy", "uptime": "99.7%"},
                {"name": "risk_service", "status": "healthy", "uptime": "99.9%"},
                {"name": "agent_service", "status": "healthy", "uptime": "99.6%"},
                {"name": "websocket_service", "status": "healthy", "uptime": "99.8%"},
                {"name": "llm_service", "status": "healthy" if AI_SERVICES_AVAILABLE else "unavailable", "uptime": "99.5%"},
                {"name": "sentiment_service", "status": "healthy" if AI_SERVICES_AVAILABLE else "unavailable", "uptime": "99.4%"},
                {"name": "risk_assessment_service", "status": "healthy" if AI_SERVICES_AVAILABLE else "unavailable", "uptime": "99.3%"},
                {"name": "advanced_trading_service", "status": "healthy" if TRADING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.7%"},
                {"name": "order_management_service", "status": "healthy" if TRADING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.6%"},
                {"name": "strategy_execution_service", "status": "healthy" if TRADING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.5%"},
                {"name": "performance_optimization_service", "status": "healthy" if PERFORMANCE_SERVICES_AVAILABLE else "unavailable", "uptime": "99.8%"},
                {"name": "cache_service", "status": "healthy" if PERFORMANCE_SERVICES_AVAILABLE else "unavailable", "uptime": "99.9%"},
                {"name": "memory_optimizer_service", "status": "healthy" if PERFORMANCE_SERVICES_AVAILABLE else "unavailable", "uptime": "99.7%"},
                {"name": "monitoring_service", "status": "healthy" if MONITORING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.9%"},
                {"name": "health_monitoring_service", "status": "healthy" if MONITORING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.8%"},
                {"name": "alert_management_service", "status": "healthy" if MONITORING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.7%"},
                {"name": "circuit_breaker_service", "status": "healthy" if MONITORING_SERVICES_AVAILABLE else "unavailable", "uptime": "99.9%"}
            ]
        }
    )

# Market proxy endpoints (commonly requested by frontend)
@app.get("/api/market/proxy")
async def market_proxy(provider: str = "messari", asset: str = "bitcoin", symbol: str = None):
    """Market data proxy endpoint"""
    # Use symbol if provided, otherwise use asset
    target_symbol = symbol or asset
    
    # Mock market data based on common assets
    mock_prices = {
        "bitcoin": {"price": 43500.00, "change_24h": 2.5, "volume": 28500000000},
        "ethereum": {"price": 2650.00, "change_24h": 3.2, "volume": 15200000000},
        "solana": {"price": 95.75, "change_24h": 8.1, "volume": 2100000000},
        "cardano": {"price": 0.85, "change_24h": -2.1, "volume": 850000000},
        "polkadot": {"price": 12.50, "change_24h": 1.8, "volume": 320000000},
        "avalanche": {"price": 35.25, "change_24h": 4.2, "volume": 580000000},
        "polygon": {"price": 1.15, "change_24h": -0.8, "volume": 420000000},
        "chainlink": {"price": 18.75, "change_24h": 6.5, "volume": 890000000},
    }
    
    asset_data = mock_prices.get(target_symbol.lower(), mock_prices["bitcoin"])
    
    return APIResponse(
        message=f"Market data for {target_symbol}",
        data={
            "symbol": target_symbol.upper(),
            "provider": provider,
            "price": asset_data["price"],
            "change_24h": asset_data["change_24h"],
            "volume_24h": asset_data["volume"],
            "timestamp": datetime.now().isoformat()
        }
    )

# Generic catch-all for unimplemented endpoints
@app.get("/api/v1/{path:path}")
async def generic_api_handler(path: str):
    """Generic handler for API endpoints"""
    return APIResponse(
        message=f"Endpoint /{path} is available",
        data={"endpoint": path, "status": "mock_response"}
    )

@app.post("/api/v1/{path:path}")
async def generic_api_post_handler(path: str, request: Request):
    """Generic POST handler for API endpoints"""
    try:
        body = await request.json()
    except:
        body = {}
    
    return APIResponse(
        message=f"POST to /{path} received",
        data={"endpoint": path, "received_data": body, "status": "processed"}
    )

# WebSocket endpoint (matches frontend expectation)
@app.websocket("/")
async def websocket_root(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Listen for messages from client
            data = await websocket.receive_json()
            message_type = data.get("type", "unknown")
            
            # Handle different message types
            if message_type == "ping":
                await ws_manager.send_message(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            elif message_type == "subscribe":
                # Handle subscription requests
                subscription_type = data.get("subscription", "general")
                await ws_manager.send_message(websocket, {
                    "type": "subscription_confirmed",
                    "subscription": subscription_type,
                    "timestamp": datetime.now().isoformat()
                })
            else:
                # Echo unknown messages
                await ws_manager.send_message(websocket, {
                    "type": "echo",
                    "received": data,
                    "timestamp": datetime.now().isoformat()
                })
                
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Listen for messages from client
            data = await websocket.receive_json()
            message_type = data.get("type", "unknown")
            
            # Handle different message types
            if message_type == "ping":
                await ws_manager.send_message(websocket, {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            elif message_type == "subscribe":
                # Handle subscription requests
                subscription_type = data.get("subscription", "general")
                await ws_manager.send_message(websocket, {
                    "type": "subscription_confirmed",
                    "subscription": subscription_type,
                    "timestamp": datetime.now().isoformat()
                })
            else:
                # Echo unknown messages
                await ws_manager.send_message(websocket, {
                    "type": "echo",
                    "received": data,
                    "timestamp": datetime.now().isoformat()
                })
                
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))  # Default to 8001 to avoid conflicts
    logger.info(f"Starting Cival Trading Dashboard Backend API on {host}:{port}...")
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info"
    )