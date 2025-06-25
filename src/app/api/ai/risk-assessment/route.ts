/**
 * AI Risk Assessment API Route
 * Server-side risk analysis to avoid exposing API keys on client
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { portfolioData, marketConditions, timeframe = '1d' } = body

    if (!portfolioData) {
      return NextResponse.json({ error: 'Portfolio data is required' }, { status: 400 })
    }

    // Build risk assessment prompt
    const prompt = `Analyze portfolio risk based on this data:

Portfolio Data: ${JSON.stringify(portfolioData, null, 2)}
${marketConditions ? `Market Conditions: ${JSON.stringify(marketConditions, null, 2)}` : ''}
Timeframe: ${timeframe}

Provide comprehensive risk assessment in JSON format with:
- riskScore: 0-100 scale (0 = very low risk, 100 = very high risk)
- riskLevel: "low" | "medium" | "high"
- riskFactors: array of specific risk factors identified
- recommendations: array of risk mitigation suggestions
- warnings: array of immediate concerns
- diversificationScore: 0-100 scale for portfolio diversification
- volatilityAssessment: assessment of portfolio volatility
- maxDrawdownEstimate: estimated maximum potential loss percentage

Focus on actionable risk management insights.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a risk management specialist. Analyze portfolio data and provide comprehensive risk assessments with actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI service')
    }

    const analysis = JSON.parse(content)
    
    return NextResponse.json({
      riskScore: analysis.riskScore || 50,
      riskLevel: analysis.riskLevel || 'medium',
      riskFactors: analysis.riskFactors || [],
      recommendations: analysis.recommendations || [],
      warnings: analysis.warnings || [],
      diversificationScore: analysis.diversificationScore || 50,
      volatilityAssessment: analysis.volatilityAssessment || 'moderate',
      maxDrawdownEstimate: analysis.maxDrawdownEstimate || 10,
      timeframe,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('AI risk assessment error:', error)
    return NextResponse.json({
      riskScore: 50,
      riskLevel: 'medium',
      riskFactors: ['Analysis temporarily unavailable'],
      recommendations: ['Risk analysis temporarily unavailable'],
      warnings: [],
      diversificationScore: 50,
      volatilityAssessment: 'unknown',
      maxDrawdownEstimate: 0,
      timeframe: '1d',
      timestamp: Date.now()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Risk Assessment API',
    endpoints: {
      POST: '/api/ai/risk-assessment - Get portfolio risk analysis'
    }
  })
}