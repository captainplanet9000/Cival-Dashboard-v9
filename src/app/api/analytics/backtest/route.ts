import { NextRequest, NextResponse } from 'next/server'
import { mlAnalyticsService, BacktestRequest } from '@/lib/services/ml-analytics-service'

export async function POST(request: NextRequest) {
  try {
    const backtestRequest: BacktestRequest = await request.json()

    console.log('📈 Running strategy backtest...', {
      strategy: backtestRequest.strategy_config?.name,
      universe: backtestRequest.universe?.length,
      period: `${backtestRequest.start_date} to ${backtestRequest.end_date}`
    })

    // Validate required fields
    if (!backtestRequest.strategy_config || !backtestRequest.universe || 
        !backtestRequest.start_date || !backtestRequest.end_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: strategy_config, universe, start_date, end_date'
      }, { status: 400 })
    }

    const result = await mlAnalyticsService.runBacktest(backtestRequest)

    return NextResponse.json({
      success: true,
      backtest: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Backtest error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}