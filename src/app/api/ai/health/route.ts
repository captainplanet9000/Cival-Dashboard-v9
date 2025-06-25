/**
 * AI Health Check API Route
 * Server-side health monitoring for AI services
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test OpenAI connection
    const testResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Health check test' }],
      max_tokens: 5
    })

    const responseTime = Date.now() - startTime
    const hasValidResponse = testResponse.choices[0]?.message?.content

    return NextResponse.json({
      status: hasValidResponse ? 'healthy' : 'degraded',
      provider: 'openai',
      model: 'gpt-4o-mini',
      responseTime,
      lastChecked: Date.now(),
      capabilities: {
        recommendations: true,
        sentiment: true,
        riskAssessment: true,
        streaming: false
      },
      usage: {
        totalCalls: 0, // Would track in production
        totalTokens: 0,
        dailyCost: 0
      },
      endpoints: {
        '/api/ai/recommendations': 'Trading recommendations',
        '/api/ai/sentiment': 'Market sentiment analysis', 
        '/api/ai/risk-assessment': 'Portfolio risk analysis',
        '/api/ai/health': 'Service health check'
      }
    })

  } catch (error) {
    console.error('AI health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      provider: 'openai',
      model: 'gpt-4o-mini',
      responseTime: 0,
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
      capabilities: {
        recommendations: false,
        sentiment: false,
        riskAssessment: false,
        streaming: false
      },
      usage: {
        totalCalls: 0,
        totalTokens: 0,
        dailyCost: 0
      }
    }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'basic' } = body

    let testPrompt = 'Health check test'
    let maxTokens = 5

    if (testType === 'advanced') {
      testPrompt = 'Provide a brief analysis of BTC/USDT market conditions in JSON format with sentiment and recommendation.'
      maxTokens = 200
    }

    const startTime = Date.now()
    
    const testResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: testPrompt }],
      max_tokens: maxTokens,
      ...(testType === 'advanced' && { response_format: { type: 'json_object' } })
    })

    const responseTime = Date.now() - startTime
    const content = testResponse.choices[0]?.message?.content

    return NextResponse.json({
      testType,
      status: content ? 'passed' : 'failed',
      responseTime,
      tokenUsage: testResponse.usage,
      response: content,
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