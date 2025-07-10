import { NextRequest, NextResponse } from 'next/server'
import { marketDataLogger } from '@/lib/market/market-data-logger'

/**
 * Market Data Logs API
 * Provides access to market data operation logs for debugging
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as 'info' | 'warn' | 'error' | null
    const provider = searchParams.get('provider')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined
    const stats = searchParams.get('stats') === 'true'

    if (stats) {
      // Return statistics instead of logs
      const statistics = marketDataLogger.getStats()
      return NextResponse.json(statistics, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    const logs = marketDataLogger.getLogs({
      level: level || undefined,
      provider: provider || undefined,
      since,
      limit
    })

    return NextResponse.json({
      logs,
      total: logs.length,
      filters: {
        level: level || 'all',
        provider: provider || 'all',
        since: since?.toISOString() || null,
        limit
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Market logs API error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch market logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear all logs
    marketDataLogger.clearLogs()
    
    return NextResponse.json({
      message: 'Market data logs cleared successfully',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Clear logs API error:', error)
    
    return NextResponse.json({
      error: 'Failed to clear market logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}