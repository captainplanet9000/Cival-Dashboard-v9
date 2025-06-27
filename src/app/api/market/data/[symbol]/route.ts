import { NextResponse } from 'next/server'

// Generate realistic market data
const generateMarketData = (symbol: string) => {
  // Get base price for different symbols
  let basePrice = 67523.45 // Default BTC price
  if (symbol.includes('ETH')) basePrice = 3421.67
  else if (symbol.includes('SOL')) basePrice = 234.56
  else if (symbol.includes('AVAX')) basePrice = 89.23
  else if (symbol.includes('LINK')) basePrice = 23.45
  else if (symbol.includes('MATIC')) basePrice = 1.23

  // Add realistic price variation
  const priceVariation = 0.98 + Math.random() * 0.04 // ±2% variation
  const currentPrice = basePrice * priceVariation

  // Generate 24h data
  const change24h = (Math.random() - 0.5) * 0.1 * currentPrice // ±5% change
  const changePercent24h = (change24h / (currentPrice - change24h)) * 100

  // Generate highs and lows
  const high24h = currentPrice * (1 + Math.random() * 0.05) // Up to 5% higher
  const low24h = currentPrice * (1 - Math.random() * 0.05) // Up to 5% lower

  // Generate volume based on symbol popularity
  let baseVolume = 50000000 // Default volume
  if (symbol.includes('ETH')) baseVolume = 30000000
  else if (symbol.includes('SOL')) baseVolume = 15000000
  else if (symbol.includes('AVAX')) baseVolume = 8000000
  else if (symbol.includes('LINK')) baseVolume = 5000000
  else if (symbol.includes('MATIC')) baseVolume = 3000000

  const volume24h = baseVolume * (0.7 + Math.random() * 0.6) // ±30% volume variation

  return {
    symbol,
    price: currentPrice,
    change24h,
    changePercent24h,
    volume24h,
    high24h,
    low24h,
    timestamp: Date.now(),
    source: 'hyperliquid'
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const marketData = generateMarketData(symbol)

    return NextResponse.json({
      success: true,
      ...marketData
    })
  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market data',
        symbol: 'unknown'
      },
      { status: 500 }
    )
  }
}