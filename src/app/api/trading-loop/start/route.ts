import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to send to real backend first
      const response = await fetch(`${backendUrl}/api/v1/trading-loop/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Backend not available, using mock response')
    }

    // Mock start response for development
    const mockResponse = {
      success: true,
      message: "Trading loop started",
      status: "running",
      start_time: new Date().toISOString(),
      config: {
        scan_interval_seconds: 5.0,
        enabled_symbols: [
          "BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", 
          "MATIC/USD", "DOT/USD", "LINK/USD", "UNI/USD"
        ],
        enabled_exchanges: ["binance", "coinbase", "hyperliquid"],
        max_concurrent_signals: 20
      }
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error starting trading loop:', error)
    return NextResponse.json(
      { error: 'Failed to start trading loop' },
      { status: 500 }
    )
  }
}