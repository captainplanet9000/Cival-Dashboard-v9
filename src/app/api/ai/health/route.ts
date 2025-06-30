/**
 * AI Health Check API Route
 * Server-side health monitoring for AI services
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock health check for development - using unified LLM service approach
const mockHealthResponse = {
  status: 'healthy',
  provider: 'unified-llm',
  model: 'gemini-1.5-flash',
  responseTime: 250,
  lastChecked: Date.now(),
  capabilities: {
    recommendations: true,
    sentiment: true,
    riskAssessment: true,
    streaming: false
  },
  usage: {
    totalCalls: 0,
    totalTokens: 0,
    dailyCost: 0
  },
  endpoints: {
    '/api/ai/recommendations': 'Trading recommendations',
    '/api/ai/sentiment': 'Market sentiment analysis', 
    '/api/ai/risk-assessment': 'Portfolio risk analysis',
    '/api/ai/health': 'Service health check'
  }
}

export async function GET() {
  try {
    // Simulate health check with current configuration
    const hasGeminiKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    return NextResponse.json({
      ...mockHealthResponse,
      status: hasGeminiKey ? 'healthy' : 'degraded',
      lastChecked: Date.now(),
      responseTime: 150 + Math.random() * 200, // Simulate realistic response time
      provider: hasGeminiKey ? 'gemini' : 'local-fallback'
    })

  } catch (error) {
    console.error('AI health check failed:', error)
    
    return NextResponse.json({
      ...mockHealthResponse,
      status: 'unhealthy',
      responseTime: 0,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
      capabilities: {
        recommendations: false,
        sentiment: false,
        riskAssessment: false,
        streaming: false
      }
    }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'basic' } = body

    // Simulate test response based on type
    const responseTime = 200 + Math.random() * 300
    
    let mockResponse = 'Health check passed'
    if (testType === 'advanced') {
      mockResponse = JSON.stringify({
        sentiment: 'bullish',
        recommendation: 'buy',
        confidence: 0.75,
        analysis: 'BTC showing strong momentum with positive indicators'
      })
    }

    return NextResponse.json({
      testType,
      status: 'passed',
      responseTime,
      tokenUsage: { total_tokens: 50, prompt_tokens: 20, completion_tokens: 30 },
      response: mockResponse,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('AI health test failed:', error)
    
    return NextResponse.json({
      testType: 'unknown',
      status: 'failed',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}