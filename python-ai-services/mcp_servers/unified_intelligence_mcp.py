#!/usr/bin/env python3
"""
Unified Intelligence MCP Server
Combines OpenRouter LLM capabilities with SerpAPI web intelligence
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
class UnifiedIntelligenceRequest:
    task: str
    prompt: str
    symbols: Optional[List[str]] = None
    timeframe: Optional[str] = None
    strategy_type: Optional[str] = None
    use_web_search: bool = True
    use_llm_analysis: bool = True
    cost_priority: str = 'medium'
    quality_priority: str = 'high'
    max_cost: float = 1.0

class UnifiedIntelligenceMCPServer:
    def __init__(self):
        self.server = Server("unified-intelligence-mcp")
        
        # Configuration
        self.openrouter_api_key = os.getenv('OPENROUTER_API_KEY', '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')
        self.serpapi_api_key = os.getenv('SERPAPI_API_KEY', '')
        
        # Task routing configuration
        self.task_routing = {
            'market_analysis': {
                'web_search': True,
                'llm_analysis': True,
                'web_task': 'financial_news',
                'llm_task': 'data_analysis',
                'complexity': 0.8
            },
            'news_analysis': {
                'web_search': True,
                'llm_analysis': True,
                'web_task': 'financial_news',
                'llm_task': 'sentiment_analysis',
                'complexity': 0.6
            },
            'sentiment_analysis': {
                'web_search': True,
                'llm_analysis': True,
                'web_task': 'sentiment_analysis',
                'llm_task': 'sentiment_analysis',
                'complexity': 0.5
            },
            'research': {
                'web_search': True,
                'llm_analysis': True,
                'web_task': 'company_research',
                'llm_task': 'research',
                'complexity': 0.9
            },
            'strategy_generation': {
                'web_search': False,
                'llm_analysis': True,
                'web_task': None,
                'llm_task': 'strategy_analysis',
                'complexity': 0.7
            },
            'risk_assessment': {
                'web_search': True,
                'llm_analysis': True,
                'web_task': 'regulatory_updates',
                'llm_task': 'data_analysis',
                'complexity': 0.8
            }
        }
        
        # Statistics tracking
        self.task_history: Dict[str, Dict] = {}
        self.processing_tasks: Dict[str, bool] = {}
        
        self.setup_tools()
        self.setup_resources()
        
    def setup_tools(self):
        """Set up MCP tools for unified intelligence"""
        
        # Tool 1: Intelligent Market Analysis
        @self.server.call_tool()
        async def intelligent_market_analysis(arguments: dict) -> List[TextContent]:
            """Combined web search and AI analysis for market intelligence"""
            try:
                request = UnifiedIntelligenceRequest(
                    task='market_analysis',
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    timeframe=arguments.get('timeframe', 'day'),
                    use_web_search=arguments.get('use_web_search', True),
                    use_llm_analysis=arguments.get('use_llm_analysis', True)
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in intelligent_market_analysis: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 2: Adaptive News Processing
        @self.server.call_tool()
        async def adaptive_news_processing(arguments: dict) -> List[TextContent]:
            """Smart news analysis with model selection and web intelligence"""
            try:
                request = UnifiedIntelligenceRequest(
                    task='news_analysis',
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    timeframe=arguments.get('timeframe', 'day'),
                    quality_priority=arguments.get('quality_priority', 'high')
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in adaptive_news_processing: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 3: Dynamic Strategy Generation
        @self.server.call_tool()
        async def dynamic_strategy_generation(arguments: dict) -> List[TextContent]:
            """Generate trading strategies with optional web research"""
            try:
                request = UnifiedIntelligenceRequest(
                    task='strategy_generation',
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    strategy_type=arguments.get('strategy_type', 'general'),
                    use_web_search=arguments.get('include_market_context', False),
                    quality_priority='high'
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in dynamic_strategy_generation: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 4: Cost-Optimized Processing
        @self.server.call_tool()
        async def cost_optimized_processing(arguments: dict) -> List[TextContent]:
            """Process requests with intelligent cost optimization"""
            try:
                max_cost = arguments.get('max_cost', 0.5)
                
                request = UnifiedIntelligenceRequest(
                    task=arguments.get('task_type', 'market_analysis'),
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    cost_priority='high',
                    quality_priority='medium',
                    max_cost=max_cost
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in cost_optimized_processing: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 5: Real-time Sentiment Analysis
        @self.server.call_tool()
        async def real_time_sentiment_analysis(arguments: dict) -> List[TextContent]:
            """Real-time sentiment analysis with web intelligence"""
            try:
                request = UnifiedIntelligenceRequest(
                    task='sentiment_analysis',
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    timeframe=arguments.get('timeframe', 'hour'),
                    use_web_search=True,
                    use_llm_analysis=True
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in real_time_sentiment_analysis: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 6: Comprehensive Market Research
        @self.server.call_tool()
        async def comprehensive_market_research(arguments: dict) -> List[TextContent]:
            """Deep dive market research combining multiple sources"""
            try:
                request = UnifiedIntelligenceRequest(
                    task='research',
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    timeframe=arguments.get('timeframe', 'week'),
                    quality_priority='high',
                    cost_priority='low'
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in comprehensive_market_research: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 7: Adaptive Risk Assessment
        @self.server.call_tool()
        async def adaptive_risk_assessment(arguments: dict) -> List[TextContent]:
            """Dynamic risk assessment with regulatory monitoring"""
            try:
                request = UnifiedIntelligenceRequest(
                    task='risk_assessment',
                    prompt=arguments.get('prompt', ''),
                    symbols=arguments.get('symbols', []),
                    timeframe=arguments.get('timeframe', 'day'),
                    use_web_search=True,
                    use_llm_analysis=True
                )
                
                result = await self.process_unified_request(request)
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in adaptive_risk_assessment: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 8: Performance Optimization
        @self.server.call_tool()
        async def performance_optimization(arguments: dict) -> List[TextContent]:
            """Optimize performance and cost across all intelligence services"""
            try:
                optimization_type = arguments.get('optimization_type', 'cost')
                
                if optimization_type == 'cost':
                    result = await self.optimize_cost_performance()
                elif optimization_type == 'speed':
                    result = await self.optimize_speed_performance()
                elif optimization_type == 'quality':
                    result = await self.optimize_quality_performance()
                else:
                    result = await self.optimize_balanced_performance()
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in performance_optimization: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
    
    def setup_resources(self):
        """Set up MCP resources for unified intelligence"""
        
        @self.server.list_resources()
        async def list_resources() -> List[Resource]:
            """List available unified intelligence resources"""
            return [
                Resource(
                    uri="unified://analytics",
                    name="Unified Analytics",
                    description="Combined web and AI analytics for trading",
                    mimeType="application/json"
                ),
                Resource(
                    uri="unified://performance",
                    name="Performance Metrics",
                    description="Performance metrics for unified intelligence",
                    mimeType="application/json"
                ),
                Resource(
                    uri="unified://tasks",
                    name="Task History",
                    description="History of processed intelligence tasks",
                    mimeType="application/json"
                ),
                Resource(
                    uri="unified://config",
                    name="Configuration",
                    description="Unified intelligence configuration",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            """Read unified intelligence resource data"""
            if uri == "unified://analytics":
                return json.dumps(await self.get_analytics_summary())
            elif uri == "unified://performance":
                return json.dumps(await self.get_performance_metrics())
            elif uri == "unified://tasks":
                return json.dumps(list(self.task_history.values())[-10:])  # Last 10 tasks
            elif uri == "unified://config":
                return json.dumps(self.task_routing)
            else:
                raise ValueError(f"Unknown resource: {uri}")
    
    async def process_unified_request(self, request: UnifiedIntelligenceRequest) -> Dict[str, Any]:
        """Process a unified intelligence request"""
        task_id = self.generate_task_id()
        start_time = time.time()
        
        try:
            # Initialize task
            self.processing_tasks[task_id] = True
            
            # Determine task configuration
            task_config = self.task_routing.get(request.task, self.task_routing['market_analysis'])
            
            # Initialize result
            result = {
                "success": True,
                "data": {
                    "analysis": "",
                    "web_results": [],
                    "sources": [],
                    "confidence": 0.0,
                    "recommendations": []
                },
                "metadata": {
                    "task_id": task_id,
                    "task_type": request.task,
                    "web_searches": 0,
                    "llm_calls": 0,
                    "total_cost": 0.0,
                    "processing_time": 0,
                    "cache_hits": 0
                }
            }
            
            # Step 1: Web search if required
            if request.use_web_search and task_config.get('web_search', False):
                web_results = await self.perform_web_search(request, task_config)
                result["data"]["web_results"] = web_results.get("data", [])
                result["data"]["sources"] = self.extract_sources(web_results)
                result["metadata"]["web_searches"] = 1
                result["metadata"]["total_cost"] += 0.01  # SerpAPI cost
            
            # Step 2: LLM analysis if required
            if request.use_llm_analysis and task_config.get('llm_analysis', False):
                llm_results = await self.perform_llm_analysis(request, task_config, result["data"]["web_results"])
                result["data"]["analysis"] = llm_results.get("data", "")
                result["data"]["confidence"] = self.calculate_confidence(llm_results, result["data"]["web_results"])
                result["data"]["recommendations"] = self.extract_recommendations(llm_results.get("data", ""))
                result["metadata"]["llm_calls"] = 1
                result["metadata"]["total_cost"] += llm_results.get("cost_estimate", 0.05)
            
            # Step 3: Synthesize results if both services were used
            if request.use_web_search and request.use_llm_analysis:
                result["data"]["analysis"] = await self.synthesize_results(
                    result["data"]["analysis"],
                    result["data"]["web_results"],
                    request
                )
                result["data"]["confidence"] = min(result["data"]["confidence"] + 0.1, 1.0)
            
            # Complete task
            processing_time = time.time() - start_time
            result["metadata"]["processing_time"] = processing_time
            
            # Store in history
            self.task_history[task_id] = {
                "task_id": task_id,
                "timestamp": datetime.now().isoformat(),
                "request": asdict(request),
                "result": result,
                "processing_time": processing_time
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing unified request: {e}")
            return {
                "success": False,
                "error": str(e),
                "metadata": {
                    "task_id": task_id,
                    "processing_time": time.time() - start_time
                }
            }
        finally:
            self.processing_tasks.pop(task_id, None)
    
    async def perform_web_search(self, request: UnifiedIntelligenceRequest, task_config: Dict) -> Dict[str, Any]:
        """Perform web search using SerpAPI"""
        try:
            # This would make actual calls to SerpAPI
            # For now, returning mock data
            return {
                "success": True,
                "data": [
                    {
                        "title": f"Market analysis for {' '.join(request.symbols or ['market'])}",
                        "snippet": f"Analysis of {request.prompt}",
                        "source": "reuters.com",
                        "date": datetime.now().strftime("%Y-%m-%d")
                    }
                ]
            }
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return {"success": False, "error": str(e)}
    
    async def perform_llm_analysis(self, request: UnifiedIntelligenceRequest, task_config: Dict, web_results: List) -> Dict[str, Any]:
        """Perform LLM analysis using OpenRouter"""
        try:
            # Build enhanced prompt
            enhanced_prompt = request.prompt
            
            if web_results:
                context_summary = self.build_context_summary(web_results)
                enhanced_prompt = f"{request.prompt}\n\nContext from web search:\n{context_summary}"
            
            # Add trading context
            if request.symbols:
                enhanced_prompt += f"\n\nSymbols: {', '.join(request.symbols)}"
            if request.timeframe:
                enhanced_prompt += f"\nTimeframe: {request.timeframe}"
            if request.strategy_type:
                enhanced_prompt += f"\nStrategy Type: {request.strategy_type}"
            
            # This would make actual calls to OpenRouter
            # For now, returning mock analysis
            return {
                "success": True,
                "data": f"Analysis of {request.prompt} with enhanced context from web search. " +
                       f"Based on the provided information, here are the key insights and recommendations.",
                "cost_estimate": 0.05,
                "model_used": "anthropic/claude-3.5-sonnet"
            }
        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            return {"success": False, "error": str(e)}
    
    async def synthesize_results(self, analysis: str, web_results: List, request: UnifiedIntelligenceRequest) -> str:
        """Synthesize web results with LLM analysis"""
        try:
            # This would make an actual synthesis call
            # For now, returning enhanced analysis
            return f"{analysis}\n\nSynthesis with web data: Enhanced analysis incorporating real-time market data and news."
        except Exception as e:
            logger.error(f"Synthesis error: {e}")
            return analysis
    
    def extract_sources(self, web_results: Dict) -> List[str]:
        """Extract sources from web results"""
        sources = []
        if web_results.get("data"):
            for item in web_results["data"]:
                if item.get("source"):
                    sources.append(item["source"])
        return list(set(sources))
    
    def calculate_confidence(self, llm_results: Dict, web_results: List) -> float:
        """Calculate confidence score"""
        confidence = 0.5  # Base confidence
        
        if llm_results.get("success"):
            confidence += 0.3
        
        if web_results:
            confidence += min(0.2, len(web_results) * 0.02)
        
        return min(1.0, confidence)
    
    def extract_recommendations(self, analysis: str) -> List[str]:
        """Extract recommendations from analysis"""
        recommendations = []
        
        # Simple extraction - would be more sophisticated
        if "recommend" in analysis.lower():
            recommendations.append("Based on analysis, consider the recommended actions")
        if "suggest" in analysis.lower():
            recommendations.append("Analysis suggests specific market actions")
        if "should" in analysis.lower():
            recommendations.append("Key actions identified in analysis")
        
        return recommendations
    
    def build_context_summary(self, web_results: List) -> str:
        """Build context summary from web results"""
        summary_items = []
        for item in web_results[:3]:  # Use top 3
            if item.get("title") and item.get("snippet"):
                summary_items.append(f"{item['title']}: {item['snippet']}")
        
        return "\n".join(summary_items)
    
    def generate_task_id(self) -> str:
        """Generate unique task ID"""
        return f"unified_task_{int(time.time())}_{hash(time.time()) % 10000}"
    
    async def optimize_cost_performance(self) -> Dict[str, Any]:
        """Optimize for cost efficiency"""
        return {
            "success": True,
            "optimization_type": "cost",
            "recommendations": [
                "Use cost-efficient models for routine tasks",
                "Implement aggressive caching",
                "Batch similar requests"
            ],
            "estimated_savings": "30-50%"
        }
    
    async def optimize_speed_performance(self) -> Dict[str, Any]:
        """Optimize for speed"""
        return {
            "success": True,
            "optimization_type": "speed",
            "recommendations": [
                "Use faster models for time-sensitive tasks",
                "Parallel processing for web searches",
                "Precomputed analysis for common queries"
            ],
            "estimated_improvement": "40-60% faster"
        }
    
    async def optimize_quality_performance(self) -> Dict[str, Any]:
        """Optimize for quality"""
        return {
            "success": True,
            "optimization_type": "quality",
            "recommendations": [
                "Use premium models for analysis",
                "Multi-source web verification",
                "Confidence scoring and validation"
            ],
            "estimated_improvement": "20-30% better accuracy"
        }
    
    async def optimize_balanced_performance(self) -> Dict[str, Any]:
        """Optimize for balanced performance"""
        return {
            "success": True,
            "optimization_type": "balanced",
            "recommendations": [
                "Dynamic model selection based on task",
                "Intelligent caching strategy",
                "Cost-quality trade-off optimization"
            ],
            "estimated_improvement": "Balanced 20% improvement across all metrics"
        }
    
    async def get_analytics_summary(self) -> Dict[str, Any]:
        """Get analytics summary"""
        return {
            "total_tasks": len(self.task_history),
            "successful_tasks": len([t for t in self.task_history.values() if t["result"]["success"]]),
            "average_processing_time": sum(t["processing_time"] for t in self.task_history.values()) / len(self.task_history) if self.task_history else 0,
            "total_cost": sum(t["result"]["metadata"]["total_cost"] for t in self.task_history.values()),
            "task_distribution": self.get_task_distribution()
        }
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics"""
        return {
            "average_response_time": 2.5,
            "success_rate": 0.95,
            "cost_efficiency": 0.8,
            "cache_hit_rate": 0.6,
            "user_satisfaction": 0.9
        }
    
    def get_task_distribution(self) -> Dict[str, int]:
        """Get task type distribution"""
        distribution = {}
        for task in self.task_history.values():
            task_type = task["request"]["task"]
            distribution[task_type] = distribution.get(task_type, 0) + 1
        return distribution

async def main():
    """Main function to run the Unified Intelligence MCP server"""
    server_instance = UnifiedIntelligenceMCPServer()
    
    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        await server_instance.server.run(
            read_stream, 
            write_stream, 
            InitializationOptions(
                server_name="unified-intelligence-mcp",
                server_version="1.0.0",
                capabilities=server_instance.server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())