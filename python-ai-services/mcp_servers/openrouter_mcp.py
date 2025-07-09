#!/usr/bin/env python3
"""
OpenRouter MCP Server for Trading AI
Provides intelligent LLM routing and cost optimization through MCP protocol
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import sys
import hashlib
import time
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource, 
    Tool, 
    TextContent, 
    EmbeddedResource,
    CallToolResult,
    LoggingLevel
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OpenRouterModel:
    id: str
    name: str
    description: str
    pricing_prompt: float
    pricing_completion: float
    context_length: int
    provider: str
    capabilities: List[str]
    specialized_for: List[str]

@dataclass
class ModelPerformanceMetrics:
    model_id: str
    average_response_time: float
    success_rate: float
    cost_per_request: float
    accuracy_score: float
    last_updated: datetime

@dataclass
class OpenRouterRequest:
    prompt: str
    model: Optional[str] = None
    max_tokens: int = 2000
    temperature: float = 0.7
    task_type: str = 'analysis'
    cost_priority: str = 'medium'
    quality_priority: str = 'high'

class OpenRouterMCPServer:
    def __init__(self):
        self.server = Server("openrouter-mcp")
        self.openai_client = None
        self.models: Dict[str, OpenRouterModel] = {}
        self.performance_metrics: Dict[str, ModelPerformanceMetrics] = {}
        self.cost_tracker: Dict[str, float] = {}
        self.rate_limiter: Dict[str, Dict[str, Any]] = {}
        self.request_cache: Dict[str, Dict[str, Any]] = {}
        
        # Configuration
        self.api_key = os.getenv('OPENROUTER_API_KEY', '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')
        self.max_requests_per_minute = 60
        self.max_requests_per_hour = 1000
        self.max_daily_cost = 50.0
        self.daily_cost_tracker = {"date": "", "total_cost": 0.0}
        
        # Trading-specific model configurations
        self.trading_model_config = {
            "strategy_analysis": {
                "primary": "anthropic/claude-3.5-sonnet",
                "fallback": "openai/gpt-4-turbo",
                "cost_efficient": "anthropic/claude-3-haiku"
            },
            "sentiment_analysis": {
                "primary": "openai/gpt-4o",
                "fallback": "anthropic/claude-3.5-sonnet",
                "cost_efficient": "openai/gpt-3.5-turbo"
            },
            "data_analysis": {
                "primary": "google/gemini-pro-1.5",
                "fallback": "openai/gpt-4-turbo",
                "cost_efficient": "google/gemini-flash-1.5"
            },
            "technical_analysis": {
                "primary": "openai/gpt-4o",
                "fallback": "anthropic/claude-3.5-sonnet",
                "cost_efficient": "openai/gpt-3.5-turbo"
            },
            "calculations": {
                "primary": "openai/gpt-3.5-turbo",
                "fallback": "anthropic/claude-3-haiku",
                "cost_efficient": "openai/gpt-3.5-turbo"
            },
            "research": {
                "primary": "anthropic/claude-3.5-sonnet",
                "fallback": "openai/gpt-4-turbo",
                "cost_efficient": "google/gemini-flash-1.5"
            }
        }
        
        # Intelligent cache TTL by task type
        self.cache_ttl = {
            'calculations': 30 * 60,  # 30 minutes
            'sentiment_analysis': 2 * 60,  # 2 minutes
            'data_analysis': 10 * 60,  # 10 minutes
            'technical_analysis': 5 * 60,  # 5 minutes
            'strategy_analysis': 1 * 60,  # 1 minute
            'research': 15 * 60  # 15 minutes
        }
        
        self.setup_tools()
        self.setup_resources()
        
    def setup_tools(self):
        """Set up MCP tools for OpenRouter integration"""
        
        # Tool 1: Route Model Request
        @self.server.call_tool()
        async def route_model_request(arguments: dict) -> List[TextContent]:
            """Intelligently route request to optimal model based on task type and priorities"""
            try:
                request = OpenRouterRequest(**arguments)
                
                # Check rate limits and cache
                if not self.check_rate_limits():
                    return [TextContent(
                        type="text", 
                        text=json.dumps({
                            "success": False,
                            "error": "Rate limit exceeded",
                            "model_used": "none",
                            "cost_estimate": 0
                        })
                    )]
                
                # Check cache first
                cache_key = self.generate_cache_key(request)
                cached_response = self.get_cached_response(cache_key, request.task_type)
                if cached_response:
                    logger.info(f"Cache hit for {request.task_type}")
                    return [TextContent(type="text", text=json.dumps(cached_response))]
                
                # Select optimal model
                selected_model = self.select_optimal_model(
                    request.task_type, 
                    request.cost_priority, 
                    request.quality_priority
                )
                
                # Make OpenRouter request
                response = await self.make_openrouter_request(request, selected_model)
                
                # Cache the response
                self.cache_response(cache_key, response, request.task_type)
                
                return [TextContent(type="text", text=json.dumps(response))]
                
            except Exception as e:
                logger.error(f"Error in route_model_request: {e}")
                return [TextContent(
                    type="text", 
                    text=json.dumps({
                        "success": False,
                        "error": str(e),
                        "model_used": "none",
                        "cost_estimate": 0
                    })
                )]
        
        # Tool 2: Analyze Market Sentiment
        @self.server.call_tool()
        async def analyze_market_sentiment(arguments: dict) -> List[TextContent]:
            """Analyze market sentiment using optimal model for sentiment analysis"""
            try:
                text = arguments.get('text', '')
                symbol = arguments.get('symbol', 'UNKNOWN')
                
                request = OpenRouterRequest(
                    prompt=f"Analyze the market sentiment for {symbol} based on this text: {text}",
                    task_type='sentiment_analysis',
                    cost_priority='medium',
                    quality_priority='high'
                )
                
                response = await self.route_model_request(asdict(request))
                return response
                
            except Exception as e:
                logger.error(f"Error in analyze_market_sentiment: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 3: Generate Trading Strategy
        @self.server.call_tool()
        async def generate_trading_strategy(arguments: dict) -> List[TextContent]:
            """Generate trading strategy using optimal model for strategy analysis"""
            try:
                market_data = arguments.get('market_data', {})
                strategy_type = arguments.get('strategy_type', 'general')
                
                request = OpenRouterRequest(
                    prompt=f"Generate a {strategy_type} trading strategy based on this market data: {json.dumps(market_data)}",
                    task_type='strategy_analysis',
                    cost_priority='low',
                    quality_priority='high'
                )
                
                response = await self.route_model_request(asdict(request))
                return response
                
            except Exception as e:
                logger.error(f"Error in generate_trading_strategy: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 4: Process Financial Data
        @self.server.call_tool()
        async def process_financial_data(arguments: dict) -> List[TextContent]:
            """Process financial data using optimal model for data analysis"""
            try:
                data = arguments.get('data', {})
                analysis_type = arguments.get('analysis_type', 'general')
                
                request = OpenRouterRequest(
                    prompt=f"Analyze this financial data for {analysis_type}: {json.dumps(data)}",
                    task_type='data_analysis',
                    cost_priority='medium',
                    quality_priority='high'
                )
                
                response = await self.route_model_request(asdict(request))
                return response
                
            except Exception as e:
                logger.error(f"Error in process_financial_data: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 5: Optimize Model Costs
        @self.server.call_tool()
        async def optimize_model_costs(arguments: dict) -> List[TextContent]:
            """Optimize model selection for cost efficiency"""
            try:
                task_type = arguments.get('task_type', 'analysis')
                budget_limit = arguments.get('budget_limit', 1.0)
                
                # Get cost statistics
                cost_stats = self.get_cost_statistics()
                
                # Recommend cost-efficient models
                recommendations = self.get_cost_optimized_recommendations(task_type, budget_limit)
                
                result = {
                    "success": True,
                    "cost_statistics": cost_stats,
                    "recommendations": recommendations,
                    "current_daily_cost": self.daily_cost_tracker["total_cost"],
                    "daily_limit": self.max_daily_cost
                }
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in optimize_model_costs: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 6: Monitor Model Performance
        @self.server.call_tool()
        async def monitor_model_performance(arguments: dict) -> List[TextContent]:
            """Monitor and report model performance metrics"""
            try:
                model_id = arguments.get('model_id', None)
                
                if model_id:
                    # Get specific model metrics
                    metrics = self.performance_metrics.get(model_id)
                    if metrics:
                        result = {
                            "success": True,
                            "model_metrics": asdict(metrics),
                            "cost_data": self.cost_tracker.get(model_id, 0)
                        }
                    else:
                        result = {"success": False, "error": f"No metrics found for model {model_id}"}
                else:
                    # Get all model metrics
                    all_metrics = {k: asdict(v) for k, v in self.performance_metrics.items()}
                    result = {
                        "success": True,
                        "all_metrics": all_metrics,
                        "cost_data": self.cost_tracker,
                        "rate_limits": self.get_rate_limit_status()
                    }
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in monitor_model_performance: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 7: Switch Model Context
        @self.server.call_tool()
        async def switch_model_context(arguments: dict) -> List[TextContent]:
            """Switch model context for ongoing conversations"""
            try:
                from_model = arguments.get('from_model', '')
                to_model = arguments.get('to_model', '')
                context = arguments.get('context', '')
                
                # Generate context transfer prompt
                transfer_prompt = f"Continue this conversation context from {from_model} to {to_model}: {context}"
                
                request = OpenRouterRequest(
                    prompt=transfer_prompt,
                    model=to_model,
                    task_type='research',
                    cost_priority='medium',
                    quality_priority='high'
                )
                
                response = await self.route_model_request(asdict(request))
                return response
                
            except Exception as e:
                logger.error(f"Error in switch_model_context: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 8: Get Model Recommendations
        @self.server.call_tool()
        async def get_model_recommendations(arguments: dict) -> List[TextContent]:
            """Get model recommendations for specific tasks"""
            try:
                task_type = arguments.get('task_type', 'analysis')
                cost_priority = arguments.get('cost_priority', 'medium')
                quality_priority = arguments.get('quality_priority', 'high')
                
                recommendations = self.get_model_recommendations(task_type, cost_priority, quality_priority)
                
                result = {
                    "success": True,
                    "recommendations": recommendations,
                    "available_models": [asdict(model) for model in self.models.values()],
                    "trading_config": self.trading_model_config.get(task_type, {})
                }
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in get_model_recommendations: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
    
    def setup_resources(self):
        """Set up MCP resources for OpenRouter data"""
        
        @self.server.list_resources()
        async def list_resources() -> List[Resource]:
            """List available OpenRouter resources"""
            return [
                Resource(
                    uri="openrouter://models",
                    name="Available Models",
                    description="List of available OpenRouter models",
                    mimeType="application/json"
                ),
                Resource(
                    uri="openrouter://performance",
                    name="Performance Metrics",
                    description="Model performance metrics and statistics",
                    mimeType="application/json"
                ),
                Resource(
                    uri="openrouter://costs",
                    name="Cost Tracking",
                    description="Cost tracking and optimization data",
                    mimeType="application/json"
                ),
                Resource(
                    uri="openrouter://config",
                    name="Trading Configuration",
                    description="Trading-specific model configurations",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            """Read OpenRouter resource data"""
            if uri == "openrouter://models":
                return json.dumps([asdict(model) for model in self.models.values()])
            elif uri == "openrouter://performance":
                return json.dumps({k: asdict(v) for k, v in self.performance_metrics.items()})
            elif uri == "openrouter://costs":
                return json.dumps({
                    "cost_tracker": self.cost_tracker,
                    "daily_cost": self.daily_cost_tracker,
                    "rate_limits": self.get_rate_limit_status()
                })
            elif uri == "openrouter://config":
                return json.dumps(self.trading_model_config)
            else:
                raise ValueError(f"Unknown resource: {uri}")
    
    def generate_cache_key(self, request: OpenRouterRequest) -> str:
        """Generate cache key for request"""
        key_data = {
            "prompt": request.prompt,
            "model": request.model,
            "task_type": request.task_type,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens
        }
        return hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
    
    def get_cached_response(self, cache_key: str, task_type: str) -> Optional[Dict]:
        """Get cached response if available and valid"""
        cached = self.request_cache.get(cache_key)
        if not cached:
            return None
        
        ttl = self.cache_ttl.get(task_type, 300)  # Default 5 minutes
        if time.time() - cached['timestamp'] > ttl:
            del self.request_cache[cache_key]
            return None
        
        return cached['response']
    
    def cache_response(self, cache_key: str, response: Dict, task_type: str):
        """Cache response with intelligent TTL"""
        self.request_cache[cache_key] = {
            'response': response,
            'timestamp': time.time(),
            'task_type': task_type
        }
        
        # Clean up old cache entries
        self.cleanup_cache()
    
    def cleanup_cache(self):
        """Clean up expired cache entries"""
        current_time = time.time()
        expired_keys = []
        
        for key, cached in self.request_cache.items():
            ttl = self.cache_ttl.get(cached['task_type'], 300)
            if current_time - cached['timestamp'] > ttl:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.request_cache[key]
    
    def check_rate_limits(self) -> bool:
        """Check if request is within rate limits"""
        current_time = time.time()
        
        # Check minute limit
        minute_key = f"minute_{int(current_time // 60)}"
        if minute_key not in self.rate_limiter:
            self.rate_limiter[minute_key] = {"count": 0, "reset_time": current_time + 60}
        
        if self.rate_limiter[minute_key]["count"] >= self.max_requests_per_minute:
            return False
        
        # Check hour limit
        hour_key = f"hour_{int(current_time // 3600)}"
        if hour_key not in self.rate_limiter:
            self.rate_limiter[hour_key] = {"count": 0, "reset_time": current_time + 3600}
        
        if self.rate_limiter[hour_key]["count"] >= self.max_requests_per_hour:
            return False
        
        # Check daily cost limit
        today = datetime.now().strftime("%Y-%m-%d")
        if self.daily_cost_tracker["date"] != today:
            self.daily_cost_tracker = {"date": today, "total_cost": 0.0}
        
        if self.daily_cost_tracker["total_cost"] >= self.max_daily_cost:
            return False
        
        return True
    
    def update_rate_limits(self):
        """Update rate limit counters"""
        current_time = time.time()
        
        minute_key = f"minute_{int(current_time // 60)}"
        hour_key = f"hour_{int(current_time // 3600)}"
        
        if minute_key in self.rate_limiter:
            self.rate_limiter[minute_key]["count"] += 1
        
        if hour_key in self.rate_limiter:
            self.rate_limiter[hour_key]["count"] += 1
    
    def get_rate_limit_status(self) -> Dict:
        """Get current rate limit status"""
        current_time = time.time()
        minute_key = f"minute_{int(current_time // 60)}"
        hour_key = f"hour_{int(current_time // 3600)}"
        
        minute_count = self.rate_limiter.get(minute_key, {"count": 0})["count"]
        hour_count = self.rate_limiter.get(hour_key, {"count": 0})["count"]
        
        return {
            "minute": {
                "current": minute_count,
                "limit": self.max_requests_per_minute,
                "remaining": self.max_requests_per_minute - minute_count
            },
            "hour": {
                "current": hour_count,
                "limit": self.max_requests_per_hour,
                "remaining": self.max_requests_per_hour - hour_count
            },
            "daily_cost": {
                "current": self.daily_cost_tracker["total_cost"],
                "limit": self.max_daily_cost,
                "remaining": self.max_daily_cost - self.daily_cost_tracker["total_cost"]
            }
        }
    
    def select_optimal_model(self, task_type: str, cost_priority: str, quality_priority: str) -> str:
        """Select optimal model based on task and priorities"""
        config = self.trading_model_config.get(task_type, self.trading_model_config["strategy_analysis"])
        
        if cost_priority == "high" and quality_priority == "low":
            return config["cost_efficient"]
        elif cost_priority == "low" and quality_priority == "high":
            return config["primary"]
        else:
            return config["fallback"]
    
    def get_cost_statistics(self) -> Dict:
        """Get cost statistics"""
        return {
            "total_cost": sum(self.cost_tracker.values()),
            "cost_by_model": self.cost_tracker,
            "daily_cost": self.daily_cost_tracker,
            "daily_limit": self.max_daily_cost
        }
    
    def get_cost_optimized_recommendations(self, task_type: str, budget_limit: float) -> List[Dict]:
        """Get cost-optimized model recommendations"""
        config = self.trading_model_config.get(task_type, self.trading_model_config["strategy_analysis"])
        
        recommendations = []
        for level, model_id in config.items():
            estimated_cost = 0.01  # Simplified cost estimation
            if estimated_cost <= budget_limit:
                recommendations.append({
                    "model": model_id,
                    "level": level,
                    "estimated_cost": estimated_cost,
                    "recommended": level == "cost_efficient"
                })
        
        return recommendations
    
    def get_model_recommendations(self, task_type: str, cost_priority: str, quality_priority: str) -> Dict:
        """Get model recommendations for task"""
        config = self.trading_model_config.get(task_type, self.trading_model_config["strategy_analysis"])
        
        return {
            "recommended": self.select_optimal_model(task_type, cost_priority, quality_priority),
            "alternatives": list(config.values()),
            "reasoning": f"Optimized for {task_type} with {cost_priority} cost priority and {quality_priority} quality priority"
        }
    
    async def make_openrouter_request(self, request: OpenRouterRequest, model: str) -> Dict:
        """Make request to OpenRouter API"""
        try:
            # Import OpenAI here to avoid issues if not installed
            import openai
            
            if not self.openai_client:
                self.openai_client = openai.OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=self.api_key
                )
            
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": request.prompt}],
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )
            
            content = response.choices[0].message.content
            cost_estimate = 0.01  # Simplified cost calculation
            
            # Update rate limits and costs
            self.update_rate_limits()
            self.daily_cost_tracker["total_cost"] += cost_estimate
            
            return {
                "success": True,
                "data": content,
                "model_used": model,
                "cost_estimate": cost_estimate,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"OpenRouter request failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model_used": model,
                "cost_estimate": 0,
                "timestamp": datetime.now().isoformat()
            }
    
    async def initialize_models(self):
        """Initialize available models"""
        # Default models for fallback
        default_models = [
            OpenRouterModel(
                id="anthropic/claude-3.5-sonnet",
                name="Claude 3.5 Sonnet",
                description="Advanced reasoning and analysis",
                pricing_prompt=0.003,
                pricing_completion=0.015,
                context_length=200000,
                provider="anthropic",
                capabilities=["analysis", "reasoning", "strategy"],
                specialized_for=["strategy_analysis", "research"]
            ),
            OpenRouterModel(
                id="openai/gpt-4o",
                name="GPT-4 Omni",
                description="Multimodal AI for comprehensive tasks",
                pricing_prompt=0.005,
                pricing_completion=0.015,
                context_length=128000,
                provider="openai",
                capabilities=["general", "sentiment", "technical"],
                specialized_for=["sentiment_analysis", "technical_analysis"]
            ),
            OpenRouterModel(
                id="google/gemini-pro-1.5",
                name="Gemini Pro 1.5",
                description="Large-scale data processing",
                pricing_prompt=0.0025,
                pricing_completion=0.0075,
                context_length=1000000,
                provider="google",
                capabilities=["data", "patterns", "research"],
                specialized_for=["data_analysis"]
            )
        ]
        
        for model in default_models:
            self.models[model.id] = model
            self.performance_metrics[model.id] = ModelPerformanceMetrics(
                model_id=model.id,
                average_response_time=2.0,
                success_rate=0.95,
                cost_per_request=0.01,
                accuracy_score=0.85,
                last_updated=datetime.now()
            )
        
        logger.info(f"Initialized {len(self.models)} models")

async def main():
    """Main function to run the OpenRouter MCP server"""
    server_instance = OpenRouterMCPServer()
    await server_instance.initialize_models()
    
    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        await server_instance.server.run(
            read_stream, 
            write_stream, 
            InitializationOptions(
                server_name="openrouter-mcp",
                server_version="1.0.0",
                capabilities=server_instance.server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())