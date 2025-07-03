import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock farm statistics - replace with Supabase aggregations
    const stats = {
      totalFarms: 3,
      activeFarms: 2,
      pausedFarms: 1,
      stoppedFarms: 0,
      totalAgents: 10,
      activeAgents: 7,
      totalCapital: 185000,
      totalValue: 194850,
      totalPnL: 9850,
      avgWinRate: 91.0,
      avgROI: 5.32,
      totalTrades: 145,
      strategies: {
        'darvas_box': { farms: 1, performance: 92 },
        'williams_alligator': { farms: 1, performance: 87 },
        'renko_breakout': { farms: 1, performance: 94 },
        'heikin_ashi': { farms: 0, performance: 0 },
        'elliott_wave': { farms: 0, performance: 0 }
      },
      performanceHistory: [
        { date: '2024-01-01', value: 185000, pnl: 0 },
        { date: '2024-01-02', value: 187500, pnl: 2500 },
        { date: '2024-01-03', value: 189200, pnl: 4200 },
        { date: '2024-01-04', value: 192800, pnl: 7800 },
        { date: '2024-01-05', value: 194850, pnl: 9850 }
      ],
      lastUpdated: new Date().toISOString()
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching farm stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}