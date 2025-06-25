/**
 * AI Sentiment Analysis API Route
 * Server-side sentiment analysis to avoid exposing API keys on client
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, newsData = [], marketData } = body

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Build sentiment analysis prompt
    const prompt = `Analyze market sentiment for ${symbol}.

Market Data: ${JSON.stringify(marketData || {}, null, 2)}
${newsData.length > 0 ? `Recent News: ${JSON.stringify(newsData.slice(0, 5), null, 2)}` : 'No recent news available.'}

Provide sentiment analysis in JSON format with:
- sentiment: "bullish" | "bearish" | "neutral"
- confidence: 0-1 scale
- factors: array of key sentiment drivers
- score: numerical sentiment score (-100 to +100)
- summary: brief explanation

Focus on actionable sentiment insights for trading decisions.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a market sentiment analyst. Analyze news, social media, and market data to determine overall sentiment for trading assets.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI service')
    }

    const analysis = JSON.parse(content)
    
    return NextResponse.json({
      symbol,
      sentiment: analysis.sentiment || 'neutral',
      confidence: analysis.confidence || 0.5,
      factors: analysis.factors || [],
      score: analysis.score || 0,
      summary: analysis.summary || 'No sentiment analysis available',
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('AI sentiment analysis error:', error)
    return NextResponse.json({
      symbol: 'unknown',
      sentiment: 'neutral',
      confidence: 0,
      factors: ['Analysis temporarily unavailable'],
      score: 0,
      summary: 'Sentiment analysis temporarily unavailable',
      timestamp: Date.now()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Sentiment Analysis API',
    endpoints: {
      POST: '/api/ai/sentiment - Get market sentiment analysis'
    }
  })
}