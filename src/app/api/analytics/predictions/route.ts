import { NextRequest, NextResponse } from 'next/server'
import { mlAnalyticsService } from '@/lib/services/ml-analytics-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    
    // Default symbols if none provided
    const symbols = symbolsParam ? symbolsParam.split(',') : ['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL', 'MSFT']

    console.log('🔮 Generating market predictions...', { symbols })

    const predictions = await mlAnalyticsService.getMarketPredictions(symbols)

    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length,
      symbols_requested: symbols,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Market predictions error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      predictions: [],
      count: 0
    }, { status: 500 })
  }
}