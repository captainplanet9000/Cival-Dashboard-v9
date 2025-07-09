import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS-safe market data proxy API
 * Proxies external API calls to avoid CORS issues in the browser
 * Supports multiple providers: Messari, CoinAPI, CoinGecko, Binance, Coinbase
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') || 'messari'
    const symbols = searchParams.get('symbols') || 'bitcoin,ethereum,solana'
    // For specific asset lookup (Messari)
    const asset = searchParams.get('asset')
    // For specific symbol lookup (CoinAPI)
    const symbol = searchParams.get('symbol')

    let apiUrl: string
    let headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'CivalDashboard/1.0'
    }

    switch (provider) {
      case 'messari':
        // Handle Messari API requests
        if (asset) {
          apiUrl = `https://data.messari.io/api/v1/assets/${asset}/metrics`
          // Add Messari API key from environment variables
          const messariApiKey = process.env.MESSARI_API_KEY || request.headers.get('X-Api-Key') || ''
          if (messariApiKey) {
            headers['x-messari-api-key'] = messariApiKey
          }
        } else {
          // Fallback to market data endpoint
          apiUrl = `https://data.messari.io/api/v1/markets`
        }
        break

      case 'coinapi':
        // Handle CoinAPI requests
        if (symbol) {
          apiUrl = `https://rest.coinapi.io/v1/exchangerate/${symbol.split('/')[0]}/${symbol.split('/')[1]}`
          const coinApiKey = process.env.COINAPI_KEY || request.headers.get('X-CoinAPI-Key') || ''
          headers['X-CoinAPI-Key'] = coinApiKey
        } else {
          // If no specific symbol, get exchange rates for all assets
          apiUrl = `https://rest.coinapi.io/v1/exchangerate/USD`
          const coinApiKey = process.env.COINAPI_KEY || request.headers.get('X-CoinAPI-Key') || ''
          headers['X-CoinAPI-Key'] = coinApiKey
        }
        break
      
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
      
      case 'coincap':
        // CoinCap API for asset prices
        apiUrl = `https://api.coincap.io/v2/assets?ids=${symbols}`
        break
      
      case 'coinpaprika':
        // CoinPaprika API for ticker data
        apiUrl = `https://api.coinpaprika.com/v1/tickers?quotes=USD`
        break
      
      case 'coindesk':
        // CoinDesk Bitcoin Price Index
        apiUrl = `https://api.coindesk.com/v1/bpi/currentprice.json`
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