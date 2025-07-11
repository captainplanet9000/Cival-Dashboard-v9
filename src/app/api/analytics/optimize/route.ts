import { NextRequest, NextResponse } from 'next/server'
import { mlAnalyticsService, OptimizationRequest } from '@/lib/services/ml-analytics-service'

export async function POST(request: NextRequest) {
  try {
    const optimizationRequest: OptimizationRequest = await request.json()

    console.log('🎯 Running portfolio optimization...', {
      portfolio_id: optimizationRequest.portfolio_id,
      objective: optimizationRequest.objective
    })

    // Validate required fields
    if (!optimizationRequest.portfolio_id || !optimizationRequest.objective) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: portfolio_id and objective'
      }, { status: 400 })
    }

    const result = await mlAnalyticsService.optimizePortfolio(optimizationRequest)

    return NextResponse.json({
      success: true,
      optimization: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Portfolio optimization error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}