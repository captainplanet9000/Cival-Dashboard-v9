import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to fetch from real backend first
      const response = await fetch(`${backendUrl}/api/v1/trading-loop/scans`, {
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

    // Mock recent market scans for development
    const symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", "MATIC/USD", "DOT/USD", "LINK/USD", "UNI/USD"]
    const marketConditions = ["bull", "bear", "sideways", "volatile"]
    
    const mockScans = Array.from({ length: 15 }, (_, i) => {
      const symbolsAnalyzed = symbols.slice(0, Math.floor(Math.random() * symbols.length) + 1)
      const opportunitiesFound = Math.floor(Math.random() * symbolsAnalyzed.length + 1)
      
      return {
        scan_id: `scan_${Date.now() - i * 5000}`,
        symbols_analyzed: symbolsAnalyzed,
        opportunities_found: opportunitiesFound,
        signals_generated: Array.from({ length: opportunitiesFound }, (_, j) => ({
          signal_id: `signal_${Date.now() - i * 5000}_${j}`,
          symbol: symbolsAnalyzed[Math.floor(Math.random() * symbolsAnalyzed.length)],
          action: Math.random() > 0.5 ? "buy" : "sell",
          confidence: parseFloat((0.6 + Math.random() * 0.4).toFixed(3))
        })),
        market_condition: marketConditions[Math.floor(Math.random() * marketConditions.length)],
        scan_duration_ms: parseFloat((150 + Math.random() * 300).toFixed(1)),
        timestamp: new Date(Date.now() - i * 5000).toISOString() // Every 5 seconds
      }
    })

    return NextResponse.json(mockScans)
  } catch (error) {
    console.error('Error fetching recent scans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent scans' },
      { status: 500 }
    )
  }
}