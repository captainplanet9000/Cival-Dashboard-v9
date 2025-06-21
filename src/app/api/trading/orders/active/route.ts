import { NextResponse } from 'next/server'

// Mock active orders data
const generateMockOrders = () => {
  const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD', 'LINK/USD']
  const sides = ['buy', 'sell']
  const types = ['limit', 'stop', 'stop_limit']
  const statuses = ['pending', 'partial']
  const exchanges = ['hyperliquid', 'binance', 'coinbase']

  const orders = []
  const orderCount = Math.floor(Math.random() * 5) + 2 // 2-6 orders

  for (let i = 0; i < orderCount; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    const side = sides[Math.floor(Math.random() * sides.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const exchange = exchanges[Math.floor(Math.random() * exchanges.length)]

    // Generate realistic price based on symbol
    let basePrice = 50000
    if (symbol.includes('ETH')) basePrice = 3400
    else if (symbol.includes('SOL')) basePrice = 235
    else if (symbol.includes('AVAX')) basePrice = 89
    else if (symbol.includes('LINK')) basePrice = 23

    const priceVariation = 0.95 + Math.random() * 0.1 // ±5% price variation
    const price = basePrice * priceVariation

    orders.push({
      id: `order_${Date.now()}_${i}`,
      symbol,
      side,
      type,
      quantity: Math.random() * 10 + 0.1,
      price: type !== 'market' ? price : undefined,
      stopPrice: (type === 'stop' || type === 'stop_limit') ? price * (side === 'buy' ? 0.98 : 1.02) : undefined,
      status,
      exchange,
      timeInForce: 'GTC',
      timestamp: Date.now() - Math.random() * 3600000, // Up to 1 hour ago
      fillQuantity: status === 'partial' ? Math.random() * 0.5 : undefined
    })
  }

  return orders
}

export async function GET() {
  try {
    const orders = generateMockOrders()

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching active orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch active orders',
        orders: []
      },
      { status: 500 }
    )
  }
}