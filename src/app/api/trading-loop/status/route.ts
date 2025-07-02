import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to fetch from real backend first
      const response = await fetch(`${backendUrl}/api/v1/trading-loop/status`, {
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

    // Mock trading loop status for development
    const mockStatus = {
      status: ["running", "paused", "stopped"][Math.floor(Math.random() * 3)],
      metrics: {
        loop_count: 1247,
        signals_generated: 89,
        trades_executed: 34,
        successful_trades: 26,
        failed_trades: 8,
        total_pnl: 2847.53,
        win_rate: 0.765, // 76.5%
        avg_execution_time_ms: 147.8,
        last_scan_duration_ms: 234.5,
        uptime_seconds: 14387,
        errors_encountered: 3
      },
      configuration: {
        scan_interval_seconds: 5.0,
        max_concurrent_signals: 20,
        signal_expiry_minutes: 15,
        enabled_symbols: [
          "BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", 
          "MATIC/USD", "DOT/USD", "LINK/USD", "UNI/USD"
        ],
        enabled_exchanges: ["binance", "coinbase", "hyperliquid"]
      },
      active_signals: 7,
      pending_executions: 2,
      recent_scans: 45,
      start_time: new Date(Date.now() - 14387000).toISOString(), // 4 hours ago
      uptime_seconds: 14387
    }

    return NextResponse.json(mockStatus)
  } catch (error) {
    console.error('Error fetching trading loop status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trading loop status' },
      { status: 500 }
    )
  }
}