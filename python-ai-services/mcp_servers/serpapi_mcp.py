#!/usr/bin/env python3
"""
SerpAPI MCP Server for Trading Intelligence
Provides web intelligence and financial search through MCP protocol
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
import aiohttp

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
class SerpAPIRequest:
    query: str
    search_type: str = 'search'
    location: Optional[str] = None
    language: Optional[str] = None
    num_results: int = 10
    time_period: Optional[str] = None
    task_type: str = 'general'

@dataclass
class MarketNewsResult:
    title: str
    link: str
    snippet: str
    source: str
    date: str
    thumbnail: Optional[str] = None
    sentiment: str = 'neutral'
    relevance_score: float = 0.5

@dataclass
class MarketEventResult:
    event_type: str
    title: str
    description: str
    date: str
    impact_level: str
    affected_symbols: List[str]
    source: str
    url: str

class SerpAPIMCPServer:
    def __init__(self):
        self.server = Server("serpapi-mcp")
        
        # Configuration
        self.api_key = os.getenv('SERPAPI_API_KEY', '')
        self.base_url = 'https://serpapi.com/search'
        self.cost_per_search = 0.01  # $0.01 per search
        
        # Rate limiting and caching
        self.rate_limiter: Dict[str, Dict[str, Any]] = {}
        self.request_cache: Dict[str, Dict[str, Any]] = {}
        self.max_requests_per_minute = 100
        self.max_requests_per_hour = 5000
        self.max_daily_cost = 15.0
        self.daily_cost_tracker = {"date": "", "total_cost": 0.0}
        
        # Intelligent cache TTL by task type
        self.cache_ttl = {
            'financial_news': 2 * 60,  # 2 minutes
            'sentiment_analysis': 5 * 60,  # 5 minutes
            'company_research': 15 * 60,  # 15 minutes
            'regulatory_updates': 30 * 60,  # 30 minutes
            'market_events': 1 * 60,  # 1 minute
            'default': 10 * 60  # 10 minutes
        }
        
        self.setup_tools()
        self.setup_resources()
        
    def setup_tools(self):
        """Set up MCP tools for SerpAPI integration"""
        
        # Tool 1: Search Financial News
        @self.server.call_tool()
        async def search_financial_news(arguments: dict) -> List[TextContent]:
            """Search for financial news and market updates"""
            try:
                query = arguments.get('query', '')
                symbols = arguments.get('symbols', [])
                time_period = arguments.get('time_period', 'day')
                
                # Build search query
                search_query = f"{query} finance news"
                if symbols:
                    search_query += f" {' OR '.join(symbols)}"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='news',
                    time_period=time_period,
                    num_results=20,
                    task_type='financial_news'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'news_results' in response:
                    processed_results = []
                    for item in response['news_results']:
                        news_item = MarketNewsResult(
                            title=item.get('title', ''),
                            link=item.get('link', ''),
                            snippet=item.get('snippet', ''),
                            source=item.get('source', ''),
                            date=item.get('date', ''),
                            thumbnail=item.get('thumbnail'),
                            sentiment=self.analyze_sentiment(item.get('title', '') + ' ' + item.get('snippet', '')),
                            relevance_score=self.calculate_relevance_score(item, symbols)
                        )
                        processed_results.append(asdict(news_item))
                    
                    result = {
                        "success": True,
                        "data": processed_results,
                        "metadata": {
                            "query": search_query,
                            "symbols": symbols,
                            "count": len(processed_results)
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_financial_news: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 2: Search Market Sentiment
        @self.server.call_tool()
        async def search_market_sentiment(arguments: dict) -> List[TextContent]:
            """Analyze market sentiment from social media and news"""
            try:
                symbols = arguments.get('symbols', [])
                time_period = arguments.get('time_period', 'day')
                
                search_query = ' OR '.join([f"{symbol} sentiment" for symbol in symbols])
                search_query += " market sentiment social media"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='search',
                    time_period=time_period,
                    num_results=25,
                    task_type='sentiment_analysis'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'organic_results' in response:
                    sentiment_data = self.analyze_bulk_sentiment(response['organic_results'], symbols)
                    
                    result = {
                        "success": True,
                        "data": sentiment_data,
                        "metadata": {
                            "symbols": symbols,
                            "analysis_type": "bulk_sentiment"
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_market_sentiment: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 3: Search Company Research
        @self.server.call_tool()
        async def search_company_research(arguments: dict) -> List[TextContent]:
            """Search for company research and fundamentals"""
            try:
                company_name = arguments.get('company_name', '')
                ticker = arguments.get('ticker', '')
                
                search_query = f"{company_name}"
                if ticker:
                    search_query += f" {ticker}"
                search_query += " company profile financials earnings"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='search',
                    num_results=10,
                    task_type='company_research'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'organic_results' in response:
                    # Get recent news about the company
                    news_request = SerpAPIRequest(
                        query=f"{company_name} {ticker} finance news",
                        search_type='news',
                        num_results=10,
                        task_type='financial_news'
                    )
                    news_response = await self.make_serpapi_request(news_request)
                    
                    company_data = {
                        "company_name": company_name,
                        "ticker": ticker,
                        "description": self.extract_company_description(response['organic_results']),
                        "key_metrics": self.extract_key_metrics(response['organic_results']),
                        "recent_news": news_response.get('news_results', [])[:5],
                        "financial_data": self.extract_financial_data(response['organic_results']),
                        "search_results": response['organic_results'][:5]
                    }
                    
                    result = {
                        "success": True,
                        "data": company_data,
                        "metadata": {
                            "company": company_name,
                            "ticker": ticker
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_company_research: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 4: Search Regulatory Updates
        @self.server.call_tool()
        async def search_regulatory_updates(arguments: dict) -> List[TextContent]:
            """Search for regulatory updates and SEC filings"""
            try:
                query = arguments.get('query', '')
                time_period = arguments.get('time_period', 'week')
                
                search_query = f"{query} SEC filing regulatory update"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='search',
                    time_period=time_period,
                    num_results=15,
                    task_type='regulatory_updates'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'organic_results' in response:
                    processed_results = []
                    for item in response['organic_results']:
                        if self.is_regulatory_source(item.get('source', '')):
                            processed_item = {
                                "title": item.get('title', ''),
                                "link": item.get('link', ''),
                                "snippet": item.get('snippet', ''),
                                "source": item.get('source', ''),
                                "date": item.get('date', ''),
                                "filing_type": self.extract_filing_type(item.get('title', '')),
                                "importance": self.assess_regulatory_importance(item)
                            }
                            processed_results.append(processed_item)
                    
                    result = {
                        "success": True,
                        "data": processed_results,
                        "metadata": {
                            "query": query,
                            "regulatory_sources": len(processed_results)
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_regulatory_updates: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 5: Search Market Events
        @self.server.call_tool()
        async def search_market_events(arguments: dict) -> List[TextContent]:
            """Search for breaking market events and alerts"""
            try:
                query = arguments.get('query', '')
                time_period = arguments.get('time_period', 'hour')
                
                search_query = f"{query} market breaking news alert"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='news',
                    time_period=time_period,
                    num_results=30,
                    task_type='market_events'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'news_results' in response:
                    processed_results = []
                    for item in response['news_results']:
                        if self.is_market_event(item):
                            event = MarketEventResult(
                                event_type=self.classify_event_type(item.get('title', '')),
                                title=item.get('title', ''),
                                description=item.get('snippet', ''),
                                date=item.get('date', ''),
                                impact_level=self.assess_impact_level(item),
                                affected_symbols=self.extract_affected_symbols(item),
                                source=item.get('source', ''),
                                url=item.get('link', '')
                            )
                            processed_results.append(asdict(event))
                    
                    result = {
                        "success": True,
                        "data": processed_results,
                        "metadata": {
                            "query": query,
                            "events_found": len(processed_results)
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_market_events: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 6: Search Technical Analysis
        @self.server.call_tool()
        async def search_technical_analysis(arguments: dict) -> List[TextContent]:
            """Search for technical analysis and chart patterns"""
            try:
                symbol = arguments.get('symbol', '')
                analysis_type = arguments.get('analysis_type', 'general')
                
                search_query = f"{symbol} technical analysis {analysis_type} chart pattern"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='search',
                    num_results=15,
                    task_type='technical_analysis'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'organic_results' in response:
                    technical_data = {
                        "symbol": symbol,
                        "analysis_type": analysis_type,
                        "patterns_found": self.extract_chart_patterns(response['organic_results']),
                        "price_targets": self.extract_price_targets(response['organic_results']),
                        "support_resistance": self.extract_support_resistance(response['organic_results']),
                        "analyst_views": self.extract_analyst_views(response['organic_results']),
                        "search_results": response['organic_results'][:8]
                    }
                    
                    result = {
                        "success": True,
                        "data": technical_data,
                        "metadata": {
                            "symbol": symbol,
                            "analysis_type": analysis_type
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_technical_analysis: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 7: Search Competitor Intelligence
        @self.server.call_tool()
        async def search_competitor_intelligence(arguments: dict) -> List[TextContent]:
            """Search for competitive intelligence and market analysis"""
            try:
                company = arguments.get('company', '')
                industry = arguments.get('industry', '')
                competitors = arguments.get('competitors', [])
                
                search_query = f"{company} {industry} competitive analysis market share"
                if competitors:
                    search_query += f" vs {' vs '.join(competitors)}"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='search',
                    num_results=20,
                    task_type='competitor_analysis'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'organic_results' in response:
                    competitive_data = {
                        "company": company,
                        "industry": industry,
                        "competitors": competitors,
                        "market_share_data": self.extract_market_share(response['organic_results']),
                        "competitive_advantages": self.extract_competitive_advantages(response['organic_results']),
                        "industry_trends": self.extract_industry_trends(response['organic_results']),
                        "swot_analysis": self.extract_swot_elements(response['organic_results']),
                        "search_results": response['organic_results'][:10]
                    }
                    
                    result = {
                        "success": True,
                        "data": competitive_data,
                        "metadata": {
                            "company": company,
                            "industry": industry
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in search_competitor_intelligence: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
        
        # Tool 8: Monitor Market Trends
        @self.server.call_tool()
        async def monitor_market_trends(arguments: dict) -> List[TextContent]:
            """Monitor market trends and emerging themes"""
            try:
                keywords = arguments.get('keywords', [])
                time_period = arguments.get('time_period', 'week')
                trend_type = arguments.get('trend_type', 'general')
                
                search_query = f"{' OR '.join(keywords)} market trend {trend_type}"
                
                request = SerpAPIRequest(
                    query=search_query,
                    search_type='news',
                    time_period=time_period,
                    num_results=25,
                    task_type='trend_monitoring'
                )
                
                response = await self.make_serpapi_request(request)
                
                if response['success'] and 'news_results' in response:
                    trend_data = {
                        "keywords": keywords,
                        "trend_type": trend_type,
                        "time_period": time_period,
                        "trending_topics": self.extract_trending_topics(response['news_results']),
                        "sentiment_trends": self.analyze_trend_sentiment(response['news_results']),
                        "volume_indicators": self.calculate_trend_volume(response['news_results']),
                        "related_themes": self.extract_related_themes(response['news_results']),
                        "news_results": response['news_results'][:15]
                    }
                    
                    result = {
                        "success": True,
                        "data": trend_data,
                        "metadata": {
                            "keywords": keywords,
                            "trend_type": trend_type
                        }
                    }
                else:
                    result = response
                
                return [TextContent(type="text", text=json.dumps(result))]
                
            except Exception as e:
                logger.error(f"Error in monitor_market_trends: {e}")
                return [TextContent(type="text", text=json.dumps({"success": False, "error": str(e)}))]
    
    def setup_resources(self):
        """Set up MCP resources for SerpAPI data"""
        
        @self.server.list_resources()
        async def list_resources() -> List[Resource]:
            """List available SerpAPI resources"""
            return [
                Resource(
                    uri="serpapi://news",
                    name="Financial News",
                    description="Latest financial news and market updates",
                    mimeType="application/json"
                ),
                Resource(
                    uri="serpapi://sentiment",
                    name="Market Sentiment",
                    description="Real-time market sentiment analysis",
                    mimeType="application/json"
                ),
                Resource(
                    uri="serpapi://regulatory",
                    name="Regulatory Updates",
                    description="SEC filings and regulatory updates",
                    mimeType="application/json"
                ),
                Resource(
                    uri="serpapi://events",
                    name="Market Events",
                    description="Breaking market events and alerts",
                    mimeType="application/json"
                ),
                Resource(
                    uri="serpapi://trends",
                    name="Market Trends",
                    description="Emerging market trends and themes",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            """Read SerpAPI resource data"""
            if uri == "serpapi://news":
                # Return recent financial news
                request = SerpAPIRequest(
                    query="financial market news",
                    search_type='news',
                    num_results=10,
                    task_type='financial_news'
                )
                response = await self.make_serpapi_request(request)
                return json.dumps(response)
            elif uri == "serpapi://sentiment":
                # Return market sentiment data
                return json.dumps({"message": "Use search_market_sentiment tool with specific symbols"})
            elif uri == "serpapi://regulatory":
                # Return regulatory updates
                request = SerpAPIRequest(
                    query="SEC regulatory filing",
                    search_type='search',
                    num_results=10,
                    task_type='regulatory_updates'
                )
                response = await self.make_serpapi_request(request)
                return json.dumps(response)
            elif uri == "serpapi://events":
                # Return market events
                request = SerpAPIRequest(
                    query="market breaking news",
                    search_type='news',
                    time_period='hour',
                    num_results=10,
                    task_type='market_events'
                )
                response = await self.make_serpapi_request(request)
                return json.dumps(response)
            elif uri == "serpapi://trends":
                # Return market trends
                request = SerpAPIRequest(
                    query="market trends emerging themes",
                    search_type='news',
                    time_period='week',
                    num_results=15,
                    task_type='trend_monitoring'
                )
                response = await self.make_serpapi_request(request)
                return json.dumps(response)
            else:
                raise ValueError(f"Unknown resource: {uri}")
    
    async def make_serpapi_request(self, request: SerpAPIRequest) -> Dict[str, Any]:
        """Make request to SerpAPI with rate limiting and caching"""
        try:
            # Check cache first
            cache_key = self.generate_cache_key(request)
            cached_response = self.get_cached_response(cache_key, request.task_type)
            if cached_response:
                logger.info(f"Cache hit for {request.task_type}: {request.query[:50]}...")
                return cached_response
            
            # Check rate limits
            if not self.check_rate_limits():
                return {"success": False, "error": "Rate limit exceeded"}
            
            # Check daily cost limit
            if not self.check_daily_cost_limit():
                return {"success": False, "error": "Daily cost limit exceeded"}
            
            # Build parameters
            params = {
                'api_key': self.api_key,
                'q': request.query,
                'engine': 'google',
                'num': str(request.num_results)
            }
            
            if request.search_type == 'news':
                params['tbm'] = 'nws'
            elif request.search_type == 'shopping':
                params['tbm'] = 'shop'
            elif request.search_type == 'images':
                params['tbm'] = 'isch'
            
            if request.location:
                params['location'] = request.location
            
            if request.language:
                params['hl'] = request.language
            
            if request.time_period:
                time_map = {'hour': 'h', 'day': 'd', 'week': 'w', 'month': 'm', 'year': 'y'}
                params['tbs'] = f"qdr:{time_map.get(request.time_period, 'd')}"
            
            # Make the request
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Update rate limits and costs
                        self.update_rate_limits()
                        self.track_cost(self.cost_per_search)
                        
                        result = {
                            "success": True,
                            "organic_results": data.get('organic_results', []),
                            "news_results": data.get('news_results', []),
                            "shopping_results": data.get('shopping_results', []),
                            "search_metadata": data.get('search_metadata', {}),
                            "search_parameters": data.get('search_parameters', {})
                        }
                        
                        # Cache the response
                        self.cache_response(cache_key, result, request.task_type)
                        
                        return result
                    else:
                        return {"success": False, "error": f"HTTP {response.status}"}
        
        except Exception as e:
            logger.error(f"SerpAPI request failed: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_cache_key(self, request: SerpAPIRequest) -> str:
        """Generate cache key for request"""
        key_data = {
            "query": request.query,
            "search_type": request.search_type,
            "time_period": request.time_period,
            "num_results": request.num_results,
            "location": request.location
        }
        return hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
    
    def get_cached_response(self, cache_key: str, task_type: str) -> Optional[Dict]:
        """Get cached response if available and valid"""
        cached = self.request_cache.get(cache_key)
        if not cached:
            return None
        
        ttl = self.cache_ttl.get(task_type, self.cache_ttl['default'])
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
            ttl = self.cache_ttl.get(cached['task_type'], self.cache_ttl['default'])
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
        
        return True
    
    def check_daily_cost_limit(self) -> bool:
        """Check daily cost limit"""
        today = datetime.now().strftime("%Y-%m-%d")
        if self.daily_cost_tracker["date"] != today:
            self.daily_cost_tracker = {"date": today, "total_cost": 0.0}
        
        return self.daily_cost_tracker["total_cost"] < self.max_daily_cost
    
    def update_rate_limits(self):
        """Update rate limit counters"""
        current_time = time.time()
        
        minute_key = f"minute_{int(current_time // 60)}"
        hour_key = f"hour_{int(current_time // 3600)}"
        
        if minute_key in self.rate_limiter:
            self.rate_limiter[minute_key]["count"] += 1
        
        if hour_key in self.rate_limiter:
            self.rate_limiter[hour_key]["count"] += 1
    
    def track_cost(self, cost: float):
        """Track daily cost"""
        today = datetime.now().strftime("%Y-%m-%d")
        if self.daily_cost_tracker["date"] != today:
            self.daily_cost_tracker = {"date": today, "total_cost": 0.0}
        
        self.daily_cost_tracker["total_cost"] += cost
    
    # Content analysis helper methods
    
    def analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment of text"""
        positive_words = ['gain', 'rise', 'up', 'bull', 'bullish', 'profit', 'growth', 'increase', 'strong', 'buy']
        negative_words = ['loss', 'fall', 'down', 'bear', 'bearish', 'decline', 'decrease', 'weak', 'sell', 'crash']
        
        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        return 'neutral'
    
    def calculate_relevance_score(self, item: dict, symbols: List[str]) -> float:
        """Calculate relevance score for news item"""
        score = 0.5  # Base score
        
        if symbols:
            text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
            matched_symbols = [s for s in symbols if s.lower() in text]
            score += len(matched_symbols) * 0.2
        
        # Boost for financial sources
        financial_sources = ['bloomberg', 'reuters', 'cnbc', 'marketwatch', 'yahoo finance']
        source = item.get('source', '').lower()
        if any(fs in source for fs in financial_sources):
            score += 0.3
        
        return min(1.0, score)
    
    def analyze_bulk_sentiment(self, results: List[dict], symbols: List[str]) -> dict:
        """Analyze sentiment for multiple symbols"""
        sentiment_data = {}
        
        for symbol in symbols:
            sentiment_data[symbol] = {"positive": 0, "negative": 0, "neutral": 0}
        
        for item in results:
            text = item.get('title', '') + ' ' + item.get('snippet', '')
            sentiment = self.analyze_sentiment(text)
            
            for symbol in symbols:
                if symbol.lower() in text.lower():
                    sentiment_data[symbol][sentiment] += 1
        
        return sentiment_data
    
    def extract_company_description(self, results: List[dict]) -> str:
        """Extract company description from search results"""
        descriptions = []
        for item in results[:3]:
            snippet = item.get('snippet', '')
            if len(snippet) > 50:
                descriptions.append(snippet)
        
        return ' '.join(descriptions)[:500]
    
    def extract_key_metrics(self, results: List[dict]) -> dict:
        """Extract key metrics from search results"""
        return {
            "market_cap": "N/A",
            "pe_ratio": "N/A", 
            "revenue": "N/A"
        }
    
    def extract_financial_data(self, results: List[dict]) -> dict:
        """Extract financial data from search results"""
        return {
            "quarterly_earnings": "N/A",
            "revenue_growth": "N/A"
        }
    
    def is_regulatory_source(self, source: str) -> bool:
        """Check if source is regulatory"""
        regulatory_sources = ['sec.gov', 'finra.org', 'cftc.gov', 'federalreserve.gov']
        return any(rs in source.lower() for rs in regulatory_sources)
    
    def extract_filing_type(self, title: str) -> str:
        """Extract filing type from title"""
        filing_types = ['10-K', '10-Q', '8-K', '13F', 'S-1', 'Form 4']
        for filing_type in filing_types:
            if filing_type in title:
                return filing_type
        return 'Other'
    
    def assess_regulatory_importance(self, item: dict) -> str:
        """Assess regulatory importance"""
        high_words = ['investigation', 'fine', 'penalty', 'violation', 'fraud']
        medium_words = ['filing', 'disclosure', 'report', 'amendment']
        
        text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
        
        if any(word in text for word in high_words):
            return 'high'
        elif any(word in text for word in medium_words):
            return 'medium'
        return 'low'
    
    def is_market_event(self, item: dict) -> bool:
        """Check if item is a market event"""
        event_keywords = ['breaking', 'alert', 'urgent', 'developing', 'just in']
        text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
        return any(keyword in text for keyword in event_keywords)
    
    def classify_event_type(self, title: str) -> str:
        """Classify event type"""
        event_types = {
            'earnings': ['earnings', 'eps', 'revenue', 'quarterly'],
            'merger': ['merger', 'acquisition', 'takeover', 'buyout'],
            'regulatory': ['sec', 'regulatory', 'investigation', 'fine'],
            'market': ['market', 'trading', 'volume', 'price'],
            'economic': ['fed', 'interest', 'inflation', 'gdp']
        }
        
        title_lower = title.lower()
        for event_type, keywords in event_types.items():
            if any(keyword in title_lower for keyword in keywords):
                return event_type
        
        return 'general'
    
    def assess_impact_level(self, item: dict) -> str:
        """Assess impact level of event"""
        high_impact = ['crash', 'surge', 'plunge', 'soar', 'breaking']
        medium_impact = ['rise', 'fall', 'gain', 'loss', 'change']
        
        text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
        
        if any(word in text for word in high_impact):
            return 'high'
        elif any(word in text for word in medium_impact):
            return 'medium'
        return 'low'
    
    def extract_affected_symbols(self, item: dict) -> List[str]:
        """Extract affected symbols from text"""
        text = (item.get('title', '') + ' ' + item.get('snippet', '')).upper()
        
        # Simple regex for potential symbols
        import re
        matches = re.findall(r'\b[A-Z]{1,5}\b', text)
        
        # Filter out common non-symbol words
        common_words = {'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'NEW', 'TOP', 'GET', 'HOW', 'WHO', 'WHY', 'NOW', 'MAY', 'WAY', 'USE', 'ITS', 'OUR', 'OUT', 'DAY', 'HAS', 'HIS', 'HER', 'HAD', 'HIM', 'OLD', 'SEE', 'TWO'}
        
        symbols = [m for m in matches if len(m) >= 2 and len(m) <= 5 and m not in common_words]
        return symbols[:5]  # Limit to 5 symbols
    
    def extract_chart_patterns(self, results: List[dict]) -> List[str]:
        """Extract chart patterns from results"""
        patterns = ['head and shoulders', 'triangle', 'flag', 'pennant', 'cup and handle', 'double top', 'double bottom']
        found_patterns = []
        
        for item in results:
            text = (item.get('title', '') + ' ' + item.get('snippet', '')).lower()
            for pattern in patterns:
                if pattern in text and pattern not in found_patterns:
                    found_patterns.append(pattern)
        
        return found_patterns
    
    def extract_price_targets(self, results: List[dict]) -> List[dict]:
        """Extract price targets from results"""
        targets = []
        for item in results:
            text = item.get('snippet', '')
            # Simple price target extraction
            import re
            matches = re.findall(r'\$(\d+(?:\.\d{2})?)', text)
            if matches:
                targets.append({
                    "source": item.get('source', ''),
                    "targets": matches[:3],  # Limit to 3 targets
                    "title": item.get('title', '')
                })
        
        return targets[:5]  # Limit to 5 sources
    
    def extract_support_resistance(self, results: List[dict]) -> dict:
        """Extract support and resistance levels"""
        return {
            "support_levels": [],
            "resistance_levels": [],
            "note": "Extracted from search results"
        }
    
    def extract_analyst_views(self, results: List[dict]) -> List[dict]:
        """Extract analyst views"""
        views = []
        for item in results:
            title = item.get('title', '').lower()
            if any(word in title for word in ['analyst', 'rating', 'target', 'upgrade', 'downgrade']):
                views.append({
                    "source": item.get('source', ''),
                    "title": item.get('title', ''),
                    "snippet": item.get('snippet', '')
                })
        
        return views[:5]
    
    def extract_market_share(self, results: List[dict]) -> dict:
        """Extract market share data"""
        return {"note": "Market share data would be extracted from search results"}
    
    def extract_competitive_advantages(self, results: List[dict]) -> List[str]:
        """Extract competitive advantages"""
        return ["Competitive advantages would be extracted from search results"]
    
    def extract_industry_trends(self, results: List[dict]) -> List[str]:
        """Extract industry trends"""
        return ["Industry trends would be extracted from search results"]
    
    def extract_swot_elements(self, results: List[dict]) -> dict:
        """Extract SWOT analysis elements"""
        return {
            "strengths": [],
            "weaknesses": [],
            "opportunities": [],
            "threats": []
        }
    
    def extract_trending_topics(self, results: List[dict]) -> List[str]:
        """Extract trending topics"""
        topics = []
        for item in results:
            title = item.get('title', '')
            # Simple keyword extraction
            words = title.split()
            for word in words:
                if len(word) > 5 and word.lower() not in topics:
                    topics.append(word.lower())
        
        return topics[:10]
    
    def analyze_trend_sentiment(self, results: List[dict]) -> dict:
        """Analyze sentiment trends"""
        sentiments = {'positive': 0, 'negative': 0, 'neutral': 0}
        
        for item in results:
            text = item.get('title', '') + ' ' + item.get('snippet', '')
            sentiment = self.analyze_sentiment(text)
            sentiments[sentiment] += 1
        
        return sentiments
    
    def calculate_trend_volume(self, results: List[dict]) -> dict:
        """Calculate trend volume indicators"""
        return {
            "total_mentions": len(results),
            "sources": len(set(item.get('source', '') for item in results)),
            "time_distribution": "Would be calculated from dates"
        }
    
    def extract_related_themes(self, results: List[dict]) -> List[str]:
        """Extract related themes"""
        themes = []
        for item in results:
            title = item.get('title', '').lower()
            # Simple theme extraction
            theme_keywords = ['technology', 'healthcare', 'finance', 'energy', 'retail', 'manufacturing']
            for keyword in theme_keywords:
                if keyword in title and keyword not in themes:
                    themes.append(keyword)
        
        return themes

async def main():
    """Main function to run the SerpAPI MCP server"""
    server_instance = SerpAPIMCPServer()
    
    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        await server_instance.server.run(
            read_stream, 
            write_stream, 
            InitializationOptions(
                server_name="serpapi-mcp",
                server_version="1.0.0",
                capabilities=server_instance.server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())