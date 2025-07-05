#!/usr/bin/env python3
"""
Test script for AI services integration
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

async def test_ai_services():
    """Test all AI services"""
    print("🧪 Testing AI Services Integration...")
    
    try:
        # Import services
        from services.llm_service import llm_service, LLMRequest
        from services.sentiment_analysis_service import sentiment_service
        from services.risk_assessment_service import risk_service
        
        print("✅ All AI services imported successfully")
        
        # Test LLM Service
        print("\n📝 Testing LLM Service...")
        llm_request = LLMRequest(
            prompt="Analyze the current market conditions for BTCUSD",
            model="gpt-3.5-turbo",
            max_tokens=100
        )
        llm_response = await llm_service.generate_response(llm_request)
        print(f"   LLM Response: {llm_response.content[:100]}...")
        print(f"   Success: {llm_response.success}")
        
        # Test Sentiment Analysis Service
        print("\n📊 Testing Sentiment Analysis Service...")
        market_data = {
            "BTCUSD": {"price": 47250.00, "change_24h": 5.3, "volume_24h": 15000000},
            "ETHUSD": {"price": 2975.00, "change_24h": 3.2, "volume_24h": 8000000}
        }
        sentiment = await sentiment_service.analyze_market_sentiment(market_data)
        print(f"   Overall Sentiment: {sentiment.overall_sentiment.label} ({sentiment.overall_sentiment.score:.3f})")
        print(f"   Trending Topics: {sentiment.trending_topics}")
        
        # Test Risk Assessment Service
        print("\n⚠️  Testing Risk Assessment Service...")
        portfolio = {
            "total_value": 125000.00,
            "positions": [
                {"symbol": "BTCUSD", "quantity": 0.5, "market_value": 23500.00},
                {"symbol": "ETHUSD", "quantity": 10.0, "market_value": 29500.00}
            ]
        }
        risk_metrics = await risk_service.calculate_portfolio_risk(portfolio, market_data)
        print(f"   Portfolio VaR: {risk_metrics.value_at_risk:.2%}")
        print(f"   Sharpe Ratio: {risk_metrics.sharpe_ratio:.2f}")
        print(f"   Max Drawdown: {risk_metrics.max_drawdown:.2%}")
        
        # Test Trading Decision
        print("\n🤖 Testing Trading Decision Generation...")
        decision = await llm_service.generate_trading_decision(
            "BTCUSD", 
            market_data["BTCUSD"], 
            {"total_value": 125000.00, "risk_tolerance": "medium"}
        )
        print(f"   Trading Action: {decision.action}")
        print(f"   Confidence: {decision.confidence:.2f}")
        print(f"   Risk Level: {decision.risk_level}")
        
        # Test Service Status
        print("\n🔍 Testing Service Status...")
        llm_status = await llm_service.get_service_status()
        sentiment_status = await sentiment_service.get_service_status()
        risk_status = await risk_service.get_service_status()
        
        print(f"   LLM Service: {llm_status['status']}")
        print(f"   Sentiment Service: {sentiment_status['status']}")
        print(f"   Risk Service: {risk_status['status']}")
        
        print("\n🎉 All AI services tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ AI services test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ai_services())
    sys.exit(0 if success else 1)