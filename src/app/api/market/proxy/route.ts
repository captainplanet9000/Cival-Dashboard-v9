import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS-safe market data proxy API
 * Proxies external API calls to avoid CORS issues in the browser
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') || 'coingecko'
    const symbols = searchParams.get('symbols') || 'bitcoin,ethereum,solana'

    let apiUrl: string
    let headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'CivalDashboard/1.0'
    }

    switch (provider) {
      case 'coingecko':
        apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${symbols}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        break
      
      case 'binance':
        // For Binance, we need to format symbols differently
        const binanceSymbols = symbols.split(',').map(s => `${s.toUpperCase()}USDT`)
        apiUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(binanceSymbols)}`
        break
      
      case 'coinbase':
        apiUrl = `https://api.coinbase.com/v2/exchange-rates?currency=USD`
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid provider specified' },
          { status: 400 }
        )
    }

    console.log(`🔄 Proxying request to ${provider}: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers,
      next: { revalidate: 15 } // Cache for 15 seconds
    })

    if (!response.ok) {
      throw new Error(`${provider} API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Add CORS headers to allow frontend access
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=15' // Cache for 15 seconds
      }
    })

  } catch (error) {
    console.error('Market data proxy error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}