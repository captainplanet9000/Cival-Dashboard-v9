import { NextResponse } from 'next/server'

// Generate realistic order book data
const generateOrderBook = (symbol: string, basePrice: number) => {
  const bids: [number, number][] = []
  const asks: [number, number][] = []

  // Generate bids (below current price)
  for (let i = 0; i < 20; i++) {
    const priceOffset = (i + 1) * 0.001 * basePrice // Decreasing prices
    const price = basePrice - priceOffset
    const quantity = Math.random() * 50 + 1 // 1-51 quantity
    bids.push([price, quantity])
  }

  // Generate asks (above current price) 
  for (let i = 0; i < 20; i++) {
    const priceOffset = (i + 1) * 0.001 * basePrice // Increasing prices
    const price = basePrice + priceOffset
    const quantity = Math.random() * 50 + 1 // 1-51 quantity
    asks.push([price, quantity])
  }

  return {
    symbol,
    bids: bids.sort((a, b) => b[0] - a[0]), // Highest bids first
    asks: asks.sort((a, b) => a[0] - b[0]), // Lowest asks first
    timestamp: Date.now(),
    source: 'hyperliquid'
  }
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol

    // Get base price for different symbols
    let basePrice = 50000 // Default BTC price
    if (symbol.includes('ETH')) basePrice = 3421.67
    else if (symbol.includes('SOL')) basePrice = 234.56
    else if (symbol.includes('AVAX')) basePrice = 89.23
    else if (symbol.includes('LINK')) basePrice = 23.45
    else if (symbol.includes('MATIC')) basePrice = 1.23

    // Add small price variation
    const currentPrice = basePrice * (0.999 + Math.random() * 0.002) // ±0.1% variation

    const orderBook = generateOrderBook(symbol, currentPrice)

    return NextResponse.json({
      success: true,
      ...orderBook
    })
  } catch (error) {
    console.error('Error fetching order book:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch order book',
        symbol: params.symbol,
        bids: [],
        asks: []
      },
      { status: 500 }
    )
  }
}