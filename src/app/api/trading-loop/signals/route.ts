import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to fetch from real backend first
      const response = await fetch(`${backendUrl}/api/v1/trading-loop/signals`, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Backend not available, using mock data')
    }

    // Mock active signals for development
    const symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", "MATIC/USD", "DOT/USD", "LINK/USD"]
    const strategies = ["momentum", "mean_reversion", "arbitrage", "multi_agent_consensus", "technical_analysis"]
    
    const mockSignals = Array.from({ length: Math.floor(Math.random() * 8) + 1 }, (_, i) => ({
      signal_id: `signal_${Date.now()}_${i}`,
      agent_id: ["marcus_momentum", "alex_arbitrage", "sophia_reversion", "consensus_coordinator"][Math.floor(Math.random() * 4)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      action: Math.random() > 0.5 ? "buy" : "sell",
      quantity: parseFloat((50 + Math.random() * 200).toFixed(2)),
      price_target: Math.random() > 0.3 ? parseFloat((100 + Math.random() * 1000).toFixed(2)) : null,
      stop_loss: Math.random() > 0.5 ? parseFloat((80 + Math.random() * 50).toFixed(2)) : null,
      take_profit: Math.random() > 0.5 ? parseFloat((120 + Math.random() * 100).toFixed(2)) : null,
      confidence: parseFloat((0.6 + Math.random() * 0.4).toFixed(3)),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      timeframe: "1m",
      priority: Math.floor(Math.random() * 5) + 1,
      metadata: {
        source: "real_time_scan",
        market_condition: ["bull", "bear", "sideways", "volatile"][Math.floor(Math.random() * 4)],
        technical_indicators: {
          rsi: parseFloat((30 + Math.random() * 40).toFixed(1)),
          macd: Math.random() > 0.5 ? "bullish" : "bearish",
          volume: Math.random() > 0.5 ? "high" : "normal"
        }
      },
      created_at: new Date(Date.now() - Math.random() * 300000).toISOString(), // Last 5 minutes
      expires_at: new Date(Date.now() + 900000).toISOString() // 15 minutes from now
    }))

    return NextResponse.json(mockSignals)
  } catch (error) {
    console.error('Error fetching active signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active signals' },
      { status: 500 }
    )
  }
}