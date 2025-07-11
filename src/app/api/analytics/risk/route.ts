import { NextRequest, NextResponse } from 'next/server'
import { mlAnalyticsService } from '@/lib/services/ml-analytics-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolio_id')

    if (!portfolioId) {
      return NextResponse.json({
        success: false,
        error: 'portfolio_id parameter is required'
      }, { status: 400 })
    }

    console.log('🛡️ Analyzing portfolio risk...', { portfolioId })

    const riskAnalysis = await mlAnalyticsService.analyzeRisk(portfolioId)

    return NextResponse.json({
      success: true,
      risk_analysis: riskAnalysis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Risk analysis error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}