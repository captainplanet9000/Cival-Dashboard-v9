import { NextResponse } from 'next/server'

// Mock portfolio balances data
const generateMockBalances = () => {
  const assets = [
    { asset: 'USD', baseAmount: 50000, priceUsd: 1.0 },
    { asset: 'BTC', baseAmount: 1.5, priceUsd: 67523.45 },
    { asset: 'ETH', baseAmount: 12.3, priceUsd: 3421.67 },
    { asset: 'SOL', baseAmount: 450.0, priceUsd: 234.56 },
    { asset: 'AVAX', baseAmount: 234.5, priceUsd: 89.23 },
    { asset: 'LINK', baseAmount: 1200.0, priceUsd: 23.45 },
    { asset: 'MATIC', baseAmount: 5000.0, priceUsd: 1.23 }
  ]

  return assets.map(({ asset, baseAmount, priceUsd }) => {
    // Add some realistic variation
    const total = baseAmount * (0.9 + Math.random() * 0.2) // ±10% variation
    const locked = total * Math.random() * 0.3 // Up to 30% locked in orders
    const free = total - locked

    // Add price fluctuation
    const currentPrice = priceUsd * (0.98 + Math.random() * 0.04) // ±2% price variation

    return {
      asset,
      free: Math.max(0, free),
      locked: Math.max(0, locked),
      total,
      usdValue: total * currentPrice,
      priceUsd: currentPrice
    }
  })
}

export async function GET() {
  try {
    const balances = generateMockBalances()
    const totalUsdValue = balances.reduce((sum, balance) => sum + balance.usdValue, 0)

    return NextResponse.json({
      success: true,
      balances,
      totalUsdValue,
      count: balances.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching portfolio balances:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch portfolio balances',
        balances: []
      },
      { status: 500 }
    )
  }
}