import { NextRequest, NextResponse } from 'next/server'

/**
 * Market Data Health Check API
 * Provides diagnostic information about market data providers
 */

export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      providers: {
        messari: { status: 'unknown', lastCheck: null },
        coinapi: { status: 'unknown', lastCheck: null },
        coingecko: { status: 'unknown', lastCheck: null },
        coincap: { status: 'unknown', lastCheck: null },
        coinpaprika: { status: 'unknown', lastCheck: null },
        coindesk: { status: 'unknown', lastCheck: null }
      },
      rateLimit: {
        messari: global.lastMessariRequest ? new Date(global.lastMessariRequest).toISOString() : null,
        coinapi: global.lastCoinAPIRequest ? new Date(global.lastCoinAPIRequest).toISOString() : null
      },
      deployment: {
        environment: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL,
        railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        wsUrl: process.env.NEXT_PUBLIC_WS_URL
      }
    }

    // Test a simple request to CoinGecko (free tier)
    try {
      const testResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (testResponse.ok) {
        healthStatus.providers.coingecko.status = 'healthy'
        healthStatus.providers.coingecko.lastCheck = new Date().toISOString()
      } else {
        healthStatus.providers.coingecko.status = `error_${testResponse.status}`
        healthStatus.providers.coingecko.lastCheck = new Date().toISOString()
      }
    } catch (error) {
      healthStatus.providers.coingecko.status = 'error'
      healthStatus.providers.coingecko.lastCheck = new Date().toISOString()
    }

    // Test CoinDesk (no API key required)
    try {
      const testResponse = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })
      
      if (testResponse.ok) {
        healthStatus.providers.coindesk.status = 'healthy'
        healthStatus.providers.coindesk.lastCheck = new Date().toISOString()
      } else {
        healthStatus.providers.coindesk.status = `error_${testResponse.status}`
        healthStatus.providers.coindesk.lastCheck = new Date().toISOString()
      }
    } catch (error) {
      healthStatus.providers.coindesk.status = 'error'
      healthStatus.providers.coindesk.lastCheck = new Date().toISOString()
    }

    // Determine overall status
    const healthyProviders = Object.values(healthStatus.providers).filter(p => p.status === 'healthy').length
    if (healthyProviders === 0) {
      healthStatus.status = 'degraded'
    } else if (healthyProviders < 2) {
      healthStatus.status = 'partial'
    }

    return NextResponse.json(healthStatus, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Market health check failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      providers: {},
      rateLimit: {},
      deployment: {}
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}