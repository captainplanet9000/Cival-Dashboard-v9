#!/usr/bin/env python3
"""
Sentiment Analysis Service
Advanced sentiment analysis for market data, news, and social media
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel
import re

# Configure logging
logger = logging.getLogger(__name__)

class SentimentScore(BaseModel):
    """Sentiment score with details"""
    score: float  # -1.0 (very negative) to 1.0 (very positive)
    magnitude: float  # 0.0 to 1.0 (intensity)
    label: str  # "positive", "negative", "neutral"
    confidence: float  # 0.0 to 1.0

class MarketSentiment(BaseModel):
    """Market-wide sentiment analysis"""
    overall_sentiment: SentimentScore
    symbol_sentiments: Dict[str, SentimentScore]
    trending_topics: List[str]
    sentiment_drivers: List[str]
    timestamp: datetime
    data_sources: List[str]

class SentimentAnalysisService:
    """Advanced sentiment analysis service"""
    
    def __init__(self):
        self.positive_words = self._load_positive_words()
        self.negative_words = self._load_negative_words()
        self.financial_terms = self._load_financial_terms()
        self.sentiment_cache = {}
        self.cache_duration = timedelta(minutes=5)
        
    def _load_positive_words(self) -> set:
        """Load positive sentiment words"""
        return {
            "bullish", "gain", "profit", "up", "rise", "surge", "boost", "positive",
            "growth", "strong", "buy", "outperform", "rally", "breakthrough", "success",
            "opportunity", "optimistic", "confident", "excellent", "robust",
            "momentum", "uptrend", "breakout", "support", "recovery", "expansion"
        }
    
    def _load_negative_words(self) -> set:
        """Load negative sentiment words"""
        return {
            "bearish", "loss", "down", "fall", "crash", "drop", "negative", "decline",
            "weak", "sell", "underperform", "dump", "fear", "panic", "risk", "concern",
            "pessimistic", "worried", "poor", "bad", "fragile", "resistance",
            "downturn", "breakdown", "correction", "volatility", "uncertainty", "trouble"
        }
    
    def _load_financial_terms(self) -> Dict[str, float]:
        """Load financial terms with sentiment weights"""
        return {
            # Positive terms
            "earnings beat": 0.8, "revenue growth": 0.7, "market share": 0.6,
            "dividend increase": 0.7, "share buyback": 0.6, "merger": 0.5,
            "partnership": 0.4, "innovation": 0.6, "expansion": 0.5,
            
            # Negative terms
            "earnings miss": -0.8, "revenue decline": -0.7, "layoffs": -0.6,
            "debt concerns": -0.5, "investigation": -0.7, "lawsuit": -0.5,
            "bankruptcy": -0.9, "regulation": -0.4, "sanctions": -0.6,
            
            # Neutral but important
            "volatility": -0.2, "uncertainty": -0.3, "guidance": 0.1,
            "outlook": 0.0, "forecast": 0.0, "analysis": 0.0
        }
    
    async def analyze_text_sentiment(self, text: str, context: str = "general") -> SentimentScore:
        """Analyze sentiment of text"""
        try:
            # Cache check
            cache_key = f"{hash(text)}_{context}"
            if cache_key in self.sentiment_cache:
                cached_result, timestamp = self.sentiment_cache[cache_key]
                if datetime.now() - timestamp < self.cache_duration:
                    return cached_result
            
            # Preprocess text
            text_lower = text.lower()
            words = re.findall(r'\b\w+\b', text_lower)
            
            # Calculate base sentiment
            positive_score = sum(1 for word in words if word in self.positive_words)
            negative_score = sum(1 for word in words if word in self.negative_words)
            
            # Apply financial term weights
            financial_score = 0.0
            for term, weight in self.financial_terms.items():
                if term in text_lower:
                    financial_score += weight
            
            # Calculate overall score
            total_words = len(words) or 1
            base_score = (positive_score - negative_score) / total_words
            weighted_score = (base_score + financial_score) / 2
            
            # Normalize to -1 to 1 range
            score = max(-1.0, min(1.0, weighted_score))
            
            # Calculate magnitude (intensity)
            magnitude = min(1.0, abs(score) + (positive_score + negative_score) / total_words)
            
            # Determine label
            if score > 0.1:
                label = "positive"
            elif score < -0.1:
                label = "negative"
            else:
                label = "neutral"
            
            # Calculate confidence based on word count and sentiment strength
            confidence = min(1.0, magnitude * (total_words / 50) * 0.5 + abs(score))
            
            result = SentimentScore(
                score=round(score, 3),
                magnitude=round(magnitude, 3),
                label=label,
                confidence=round(confidence, 3)
            )
            
            # Cache result
            self.sentiment_cache[cache_key] = (result, datetime.now())
            
            return result
            
        except Exception as e:
            logger.error(f"Text sentiment analysis failed: {e}")
            return SentimentScore(score=0.0, magnitude=0.0, label="neutral", confidence=0.0)
    
    async def analyze_market_sentiment(self, market_data: Dict[str, Any]) -> MarketSentiment:
        """Analyze overall market sentiment"""
        try:
            symbol_sentiments = {}
            sentiment_scores = []
            trending_topics = []
            sentiment_drivers = []
            
            # Analyze individual symbols
            for symbol, data in market_data.items():
                if isinstance(data, dict):
                    # Create sentiment text from market data
                    sentiment_text = self._create_market_sentiment_text(symbol, data)
                    sentiment = await self.analyze_text_sentiment(sentiment_text, "market")
                    symbol_sentiments[symbol] = sentiment
                    sentiment_scores.append(sentiment.score)
                    
                    # Extract trending information
                    if abs(sentiment.score) > 0.5:
                        trending_topics.append(f"{symbol} ({sentiment.label})")
                    
                    if sentiment.magnitude > 0.7:
                        sentiment_drivers.append(f"{symbol}: {self._get_sentiment_driver(data)}")
            
            # Calculate overall sentiment
            if sentiment_scores:
                avg_score = sum(sentiment_scores) / len(sentiment_scores)
                avg_magnitude = sum(s.magnitude for s in symbol_sentiments.values()) / len(symbol_sentiments)
                
                overall_label = "positive" if avg_score > 0.1 else "negative" if avg_score < -0.1 else "neutral"
                overall_confidence = min(1.0, avg_magnitude)
                
                overall_sentiment = SentimentScore(
                    score=round(avg_score, 3),
                    magnitude=round(avg_magnitude, 3),
                    label=overall_label,
                    confidence=round(overall_confidence, 3)
                )
            else:
                overall_sentiment = SentimentScore(score=0.0, magnitude=0.0, label="neutral", confidence=0.0)
            
            return MarketSentiment(
                overall_sentiment=overall_sentiment,
                symbol_sentiments=symbol_sentiments,
                trending_topics=trending_topics[:10],  # Top 10
                sentiment_drivers=sentiment_drivers[:5],  # Top 5
                timestamp=datetime.now(),
                data_sources=["market_data", "price_analysis"]
            )
            
        except Exception as e:
            logger.error(f"Market sentiment analysis failed: {e}")
            return await self._mock_market_sentiment()
    
    def _create_market_sentiment_text(self, symbol: str, data: Dict[str, Any]) -> str:
        """Create sentiment analysis text from market data"""
        try:
            change = data.get("change_24h", 0)
            volume = data.get("volume_24h", 0)
            
            # Create descriptive text based on market data
            text_parts = []
            
            if change > 5:
                text_parts.append(f"{symbol} shows strong bullish momentum with significant gains")
            elif change > 2:
                text_parts.append(f"{symbol} demonstrates positive growth and upward trend")
            elif change > 0:
                text_parts.append(f"{symbol} maintains slight positive movement")
            elif change < -5:
                text_parts.append(f"{symbol} experiences heavy bearish pressure with major decline")
            elif change < -2:
                text_parts.append(f"{symbol} shows negative trend with concerning weakness")
            else:
                text_parts.append(f"{symbol} exhibits neutral price action with minimal change")
            
            if volume > 1000000:
                text_parts.append("with high trading volume indicating strong market interest")
            elif volume > 100000:
                text_parts.append("with moderate volume suggesting steady activity")
            else:
                text_parts.append("with low volume indicating limited market participation")
            
            return " ".join(text_parts)
            
        except Exception as e:
            logger.error(f"Failed to create market sentiment text: {e}")
            return f"{symbol} neutral market conditions"
    
    def _get_sentiment_driver(self, data: Dict[str, Any]) -> str:
        """Get main sentiment driver from market data"""
        change = data.get("change_24h", 0)
        volume = data.get("volume_24h", 0)
        
        if abs(change) > 5:
            return f"Price volatility ({change:+.1f}%)"
        elif volume > 1000000:
            return "High trading volume"
        else:
            return "Market conditions"
    
    # Mock methods for fallback
    async def _mock_market_sentiment(self) -> MarketSentiment:
        """Mock market sentiment when analysis fails"""
        return MarketSentiment(
            overall_sentiment=SentimentScore(score=0.1, magnitude=0.3, label="neutral", confidence=0.6),
            symbol_sentiments={
                "BTCUSD": SentimentScore(score=0.2, magnitude=0.4, label="positive", confidence=0.7),
                "ETHUSD": SentimentScore(score=0.0, magnitude=0.2, label="neutral", confidence=0.5)
            },
            trending_topics=["BTCUSD (positive)", "Market volatility"],
            sentiment_drivers=["Price momentum", "Trading volume"],
            timestamp=datetime.now(),
            data_sources=["mock_data"]
        )
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get sentiment analysis service status"""
        return {
            "service": "sentiment_analysis",
            "status": "healthy",
            "positive_words": len(self.positive_words),
            "negative_words": len(self.negative_words),
            "financial_terms": len(self.financial_terms),
            "cache_size": len(self.sentiment_cache),
            "last_check": datetime.now().isoformat()
        }

# Global service instance
sentiment_service = SentimentAnalysisService()