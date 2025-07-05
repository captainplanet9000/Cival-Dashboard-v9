#!/usr/bin/env python3
"""
LLM Integration Service
Provides AI-powered analysis, sentiment, and decision support
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel
import openai
from openai import AsyncOpenAI

# Configure logging
logger = logging.getLogger(__name__)

class LLMRequest(BaseModel):
    """Request model for LLM operations"""
    prompt: str
    context: Optional[Dict[str, Any]] = None
    model: str = "gpt-3.5-turbo"
    max_tokens: int = 1000
    temperature: float = 0.7
    system_prompt: Optional[str] = None

class LLMResponse(BaseModel):
    """Response model for LLM operations"""
    content: str
    model: str
    tokens_used: int
    cost_estimate: float
    timestamp: datetime
    success: bool = True
    error: Optional[str] = None

class SentimentAnalysis(BaseModel):
    """Sentiment analysis result"""
    sentiment: str  # "positive", "negative", "neutral"
    confidence: float  # 0.0 to 1.0
    emotions: Dict[str, float]  # emotion scores
    keywords: List[str]
    summary: str

class TradingDecision(BaseModel):
    """AI-generated trading decision"""
    action: str  # "buy", "sell", "hold"
    confidence: float
    reasoning: str
    risk_level: str
    suggested_position_size: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class LLMService:
    """AI-powered analysis and decision support service"""
    
    def __init__(self, api_key: Optional[str] = None):
        # Load API key from environment variables (Railway deployment)
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("NEXT_PUBLIC_OPENAI_API_KEY")
        self.client = None
        self.models_available = [
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-turbo-preview"
        ]
        self.cost_per_token = {
            "gpt-3.5-turbo": 0.0000015,
            "gpt-4": 0.00003,
            "gpt-4-turbo-preview": 0.00001
        }
        
        # Initialize client if API key is available
        if self.api_key:
            try:
                self.client = AsyncOpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized with API key")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
        else:
            logger.info("No OpenAI API key found - running in mock mode")
        
    async def initialize(self) -> bool:
        """Initialize the LLM service"""
        try:
            if not self.api_key:
                logger.warning("No OpenAI API key provided, using mock responses")
                return True
                
            if not self.client:
                self.client = AsyncOpenAI(api_key=self.api_key)
                
            # Test connection
            await self.client.models.list()
            logger.info("LLM service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            return False
    
    async def generate_response(self, request: LLMRequest) -> LLMResponse:
        """Generate AI response for given prompt"""
        try:
            if not self.client:
                return await self._mock_response(request)
            
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            
            # Add context if provided
            if request.context:
                context_str = f"Context: {json.dumps(request.context, indent=2)}"
                messages.append({"role": "system", "content": context_str})
            
            messages.append({"role": "user", "content": request.prompt})
            
            response = await self.client.chat.completions.create(
                model=request.model,
                messages=messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )
            
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            cost = tokens_used * self.cost_per_token.get(request.model, 0.000002)
            
            return LLMResponse(
                content=content,
                model=request.model,
                tokens_used=tokens_used,
                cost_estimate=cost,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return LLMResponse(
                content="",
                model=request.model,
                tokens_used=0,
                cost_estimate=0.0,
                timestamp=datetime.now(),
                success=False,
                error=str(e)
            )
    
    async def analyze_market_sentiment(self, market_data: Dict[str, Any]) -> SentimentAnalysis:
        """Analyze market sentiment from data"""
        try:
            if not self.client:
                return await self._mock_sentiment_analysis()
            
            prompt = f"""
            Analyze the market sentiment based on the following data:
            
            Market Data:
            {json.dumps(market_data, indent=2)}
            
            Provide a sentiment analysis including:
            1. Overall sentiment (positive/negative/neutral)
            2. Confidence level (0-1)
            3. Key emotions detected
            4. Important keywords
            5. Brief summary
            
            Respond in JSON format.
            """
            
            request = LLMRequest(
                prompt=prompt,
                system_prompt="You are an expert financial analyst specializing in market sentiment analysis.",
                model="gpt-3.5-turbo",
                temperature=0.3
            )
            
            response = await self.generate_response(request)
            
            if response.success:
                # Parse JSON response
                try:
                    sentiment_data = json.loads(response.content)
                    return SentimentAnalysis(
                        sentiment=sentiment_data.get("sentiment", "neutral"),
                        confidence=sentiment_data.get("confidence", 0.5),
                        emotions=sentiment_data.get("emotions", {}),
                        keywords=sentiment_data.get("keywords", []),
                        summary=sentiment_data.get("summary", "Analysis unavailable")
                    )
                except json.JSONDecodeError:
                    logger.error("Failed to parse sentiment analysis JSON")
                    return await self._mock_sentiment_analysis()
            else:
                return await self._mock_sentiment_analysis()
                
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return await self._mock_sentiment_analysis()
    
    async def generate_trading_decision(self, 
                                      symbol: str, 
                                      market_data: Dict[str, Any],
                                      portfolio_context: Dict[str, Any]) -> TradingDecision:
        """Generate AI-powered trading decision"""
        try:
            if not self.client:
                return await self._mock_trading_decision(symbol)
            
            prompt = f"""
            Generate a trading decision for {symbol} based on the following information:
            
            Market Data:
            {json.dumps(market_data, indent=2)}
            
            Portfolio Context:
            {json.dumps(portfolio_context, indent=2)}
            
            Provide a trading recommendation including:
            1. Action (buy/sell/hold)
            2. Confidence level (0-1)
            3. Detailed reasoning
            4. Risk level (low/medium/high)
            5. Suggested position size (% of portfolio)
            6. Stop loss level (if applicable)
            7. Take profit level (if applicable)
            
            Respond in JSON format.
            """
            
            request = LLMRequest(
                prompt=prompt,
                system_prompt="You are an expert quantitative trader with deep knowledge of technical analysis, risk management, and portfolio optimization.",
                model="gpt-4",
                temperature=0.2
            )
            
            response = await self.generate_response(request)
            
            if response.success:
                try:
                    decision_data = json.loads(response.content)
                    return TradingDecision(
                        action=decision_data.get("action", "hold"),
                        confidence=decision_data.get("confidence", 0.5),
                        reasoning=decision_data.get("reasoning", "Analysis unavailable"),
                        risk_level=decision_data.get("risk_level", "medium"),
                        suggested_position_size=decision_data.get("suggested_position_size", 0.01),
                        stop_loss=decision_data.get("stop_loss"),
                        take_profit=decision_data.get("take_profit")
                    )
                except json.JSONDecodeError:
                    logger.error("Failed to parse trading decision JSON")
                    return await self._mock_trading_decision(symbol)
            else:
                return await self._mock_trading_decision(symbol)
                
        except Exception as e:
            logger.error(f"Trading decision generation failed: {e}")
            return await self._mock_trading_decision(symbol)
    
    async def analyze_risk_scenario(self, 
                                  portfolio: Dict[str, Any],
                                  scenario: str) -> Dict[str, Any]:
        """Analyze risk scenario using AI"""
        try:
            if not self.client:
                return await self._mock_risk_analysis(scenario)
            
            prompt = f"""
            Analyze the risk impact of the following scenario on this portfolio:
            
            Portfolio:
            {json.dumps(portfolio, indent=2)}
            
            Scenario: {scenario}
            
            Provide analysis including:
            1. Potential impact (percentage)
            2. Affected positions
            3. Risk mitigation strategies
            4. Time horizon for impact
            5. Confidence in analysis
            
            Respond in JSON format.
            """
            
            request = LLMRequest(
                prompt=prompt,
                system_prompt="You are a risk management expert specializing in portfolio stress testing and scenario analysis.",
                model="gpt-4",
                temperature=0.1
            )
            
            response = await self.generate_response(request)
            
            if response.success:
                try:
                    return json.loads(response.content)
                except json.JSONDecodeError:
                    return await self._mock_risk_analysis(scenario)
            else:
                return await self._mock_risk_analysis(scenario)
                
        except Exception as e:
            logger.error(f"Risk scenario analysis failed: {e}")
            return await self._mock_risk_analysis(scenario)
    
    # Mock methods for fallback when API is unavailable
    async def _mock_response(self, request: LLMRequest) -> LLMResponse:
        """Mock LLM response when service unavailable"""
        await asyncio.sleep(0.1)  # Simulate processing time
        
        mock_responses = {
            "market": "Based on current market conditions, I observe moderate volatility with neutral sentiment indicators.",
            "trading": "Current market conditions suggest a cautious approach with limited position sizing.",
            "risk": "Risk analysis indicates moderate exposure with manageable downside potential.",
            "sentiment": "Market sentiment appears neutral with mixed signals from various indicators."
        }
        
        # Choose response based on prompt keywords
        content = mock_responses.get("market", "Analysis complete.")
        for key, response in mock_responses.items():
            if key in request.prompt.lower():
                content = response
                break
        
        return LLMResponse(
            content=content,
            model=request.model,
            tokens_used=50,
            cost_estimate=0.0001,
            timestamp=datetime.now()
        )
    
    async def _mock_sentiment_analysis(self) -> SentimentAnalysis:
        """Mock sentiment analysis"""
        await asyncio.sleep(0.1)
        
        return SentimentAnalysis(
            sentiment="neutral",
            confidence=0.75,
            emotions={
                "optimism": 0.4,
                "concern": 0.3,
                "uncertainty": 0.3
            },
            keywords=["volatility", "market", "trading", "opportunity"],
            summary="Market sentiment appears neutral with mixed signals from various indicators."
        )
    
    async def _mock_trading_decision(self, symbol: str) -> TradingDecision:
        """Mock trading decision"""
        await asyncio.sleep(0.1)
        
        return TradingDecision(
            action="hold",
            confidence=0.65,
            reasoning=f"Current market conditions for {symbol} suggest maintaining current position size with careful monitoring of key support/resistance levels.",
            risk_level="medium",
            suggested_position_size=0.02,
            stop_loss=None,
            take_profit=None
        )
    
    async def _mock_risk_analysis(self, scenario: str) -> Dict[str, Any]:
        """Mock risk analysis"""
        await asyncio.sleep(0.1)
        
        return {
            "potential_impact": -0.05,  # -5%
            "affected_positions": ["BTCUSD", "ETHUSD"],
            "risk_mitigation": [
                "Reduce position sizes",
                "Implement stop losses",
                "Diversify holdings"
            ],
            "time_horizon": "1-3 days",
            "confidence": 0.7,
            "scenario": scenario
        }
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get LLM service status"""
        return {
            "service": "llm_service",
            "status": "healthy" if self.client else "mock_mode",
            "models_available": self.models_available,
            "api_connected": bool(self.client),
            "api_key_detected": bool(self.api_key),
            "api_key_source": "environment" if self.api_key else "none",
            "environment_vars_checked": ["OPENAI_API_KEY", "NEXT_PUBLIC_OPENAI_API_KEY"],
            "last_check": datetime.now().isoformat()
        }

# Global service instance
llm_service = LLMService()