import { NextRequest, NextResponse } from 'next/server'
import { mlAnalyticsService } from '@/lib/services/ml-analytics-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolio_id')

    console.log('📊 Generating ML insights...', { portfolioId })

    const insights = await mlAnalyticsService.generateInsights(portfolioId || undefined)

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Analytics insights error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      insights: [],
      count: 0
    }, { status: 500 })
  }
}