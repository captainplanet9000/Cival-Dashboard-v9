import { NextResponse } from 'next/server'

// Mock trading pairs data
const mockTradingPairs = [
  {
    symbol: 'BTC/USD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    currentPrice: 67523.45,
    change24h: 2.34,
    volume24h: 28567123.45,
    minOrderSize: 0.0001,
    maxOrderSize: 10.0,
    tickSize: 0.01,
    stepSize: 0.0001,
    exchange: 'hyperliquid'
  },
  {
    symbol: 'ETH/USD',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    currentPrice: 3421.67,
    change24h: -0.87,
    volume24h: 15234567.89,
    minOrderSize: 0.001,
    maxOrderSize: 100.0,
    tickSize: 0.01,
    stepSize: 0.001,
    exchange: 'hyperliquid'
  },
  {
    symbol: 'SOL/USD',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    currentPrice: 234.56,
    change24h: 4.23,
    volume24h: 8765432.10,
    minOrderSize: 0.01,
    maxOrderSize: 1000.0,
    tickSize: 0.01,
    stepSize: 0.01,
    exchange: 'hyperliquid'
  },
  {
    symbol: 'AVAX/USD',
    baseAsset: 'AVAX',
    quoteAsset: 'USD',
    currentPrice: 89.23,
    change24h: -1.45,
    volume24h: 3456789.12,
    minOrderSize: 0.1,
    maxOrderSize: 5000.0,
    tickSize: 0.01,
    stepSize: 0.1,
    exchange: 'hyperliquid'
  },
  {
    symbol: 'LINK/USD',
    baseAsset: 'LINK',
    quoteAsset: 'USD',
    currentPrice: 23.45,
    change24h: 1.67,
    volume24h: 2345678.90,
    minOrderSize: 1.0,
    maxOrderSize: 10000.0,
    tickSize: 0.01,
    stepSize: 1.0,
    exchange: 'hyperliquid'
  },
  {
    symbol: 'MATIC/USD',
    baseAsset: 'MATIC',
    quoteAsset: 'USD',
    currentPrice: 1.23,
    change24h: 3.45,
    volume24h: 1234567.89,
    minOrderSize: 10.0,
    maxOrderSize: 100000.0,
    tickSize: 0.001,
    stepSize: 10.0,
    exchange: 'hyperliquid'
  }
]

export async function GET() {
  try {
    // Add some realistic price fluctuation
    const pairs = mockTradingPairs.map(pair => ({
      ...pair,
      currentPrice: pair.currentPrice * (1 + (Math.random() - 0.5) * 0.02), // ±1% price variation
      change24h: pair.change24h + (Math.random() - 0.5) * 2, // ±1% additional variation
      volume24h: pair.volume24h * (0.8 + Math.random() * 0.4) // 80%-120% volume variation
    }))

    return NextResponse.json({
      success: true,
      pairs,
      count: pairs.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching trading pairs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trading pairs',
        pairs: []
      },
      { status: 500 }
    )
  }
}