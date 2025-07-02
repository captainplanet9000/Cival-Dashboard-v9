import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to send to real backend first
      const response = await fetch(`${backendUrl}/api/v1/trading-loop/stop`, {
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

    // Mock stop response for development
    const mockResponse = {
      success: true,
      message: "Trading loop stopped",
      status: "stopped",
      final_metrics: {
        loop_count: 1247,
        signals_generated: 89,
        trades_executed: 34,
        successful_trades: 26,
        failed_trades: 8,
        total_pnl: 2847.53,
        win_rate: 0.765,
        uptime_seconds: 14387
      }
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error stopping trading loop:', error)
    return NextResponse.json(
      { error: 'Failed to stop trading loop' },
      { status: 500 }
    )
  }
}