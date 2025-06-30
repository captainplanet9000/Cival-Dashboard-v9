/**
 * AI Recommendations API Route
 * Server-side AI analysis to avoid exposing API keys on client
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock AI recommendations for development - using unified LLM service approach

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, timeframe = '1h', marketData, context } = body

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Build trading analysis prompt
    const prompt = `Analyze ${symbol} for ${timeframe} trading.

Market Data: ${JSON.stringify(marketData || {}, null, 2)}
${context ? `Additional Context: ${context}` : ''}

Provide trading recommendation in JSON format with:
- action: "buy" | "sell" | "hold"
- confidence: 0-1 scale
- reasoning: detailed explanation
- riskLevel: "low" | "medium" | "high"
- targetPrice: optional number
- stopLoss: optional number  
- timeHorizon: e.g. "1h", "1d", "1w"

Focus on actionable insights for paper trading.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert trading analyst. Provide concise, actionable trading recommendations based on market data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI service')
    }

    const analysis = JSON.parse(content)
    
    return NextResponse.json({
      symbol,
      action: analysis.action || 'hold',
      confidence: analysis.confidence || 0.5,
      reasoning: analysis.reasoning || 'No analysis available',
      riskLevel: analysis.riskLevel || 'medium',
      targetPrice: analysis.targetPrice,
      stopLoss: analysis.stopLoss,
      timeHorizon: analysis.timeHorizon || timeframe,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('AI recommendations error:', error)
    return NextResponse.json({
      symbol: 'unknown',
      action: 'hold',
      confidence: 0,
      reasoning: 'Analysis temporarily unavailable',
      riskLevel: 'medium',
      timeHorizon: '1h',
      timestamp: Date.now()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Recommendations API',
    endpoints: {
      POST: '/api/ai/recommendations - Get trading recommendations'
    }
  })
}