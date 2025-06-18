import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/farm/daily/${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Daily performance API error:', error)
    
    // Return mock data on error for development
    const mockData = generateMockDailyData(request.nextUrl.searchParams.get('date') || '')
    return NextResponse.json({ 
      data: mockData,
      error: 'Using mock data - backend unavailable',
      status: 'mock'
    })
  }
}

function generateMockDailyData(dateStr: string) {
  const agents = ['marcus_momentum', 'alex_arbitrage', 'sophia_reversion']
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'MATIC']
  
  const numTrades = Math.floor(Math.random() * 15) + 1
  const numDecisions = Math.floor(Math.random() * 8) + 1
  
  // Generate mock trades
  const trades = Array.from({ length: numTrades }, (_, i) => {
    const pnl = (Math.random() - 0.4) * 500
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    
    return {
      trade_id: `trade_${dateStr}_${i}`,
      symbol,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      quantity: Math.random() * 2 + 0.1,
      entry_price: 50000 + Math.random() * 20000,
      exit_price: 50000 + Math.random() * 20000,
      net_pnl: pnl,
      entry_time: `${dateStr}T${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
      exit_time: `${dateStr}T${String(10 + Math.floor(Math.random() * 7)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
      agent_id: agent
    }
  })

  // Generate mock decisions
  const decisions = Array.from({ length: numDecisions }, (_, i) => ({
    decision_id: `decision_${dateStr}_${i}`,
    agent_id: agents[Math.floor(Math.random() * agents.length)],
    decision_type: ['entry', 'exit', 'hold'][Math.floor(Math.random() * 3)],
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    reasoning: `Market analysis indicates ${['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)]} sentiment with ${['high', 'medium', 'low'][Math.floor(Math.random() * 3)]} confidence based on technical indicators.`,
    confidence_score: 0.5 + Math.random() * 0.4,
    executed: Math.random() > 0.3,
    decision_time: `${dateStr}T${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`
  }))

  // Calculate totals
  const totalPnL = trades.reduce((sum, trade) => sum + trade.net_pnl, 0)
  const winningTrades = trades.filter(t => t.net_pnl > 0).length

  // Calculate agent performance
  const agentPerformance: { [key: string]: any } = {}
  agents.forEach(agent => {
    const agentTrades = trades.filter(t => t.agent_id === agent)
    const agentPnL = agentTrades.reduce((sum, t) => sum + t.net_pnl, 0)
    const agentWins = agentTrades.filter(t => t.net_pnl > 0).length
    
    agentPerformance[agent] = {
      pnl: agentPnL,
      trades: agentTrades.length,
      winning_trades: agentWins,
      win_rate: agentTrades.length > 0 ? agentWins / agentTrades.length : 0
    }
  })

  return {
    date: dateStr,
    summary: {
      total_pnl: totalPnL,
      total_trades: numTrades,
      winning_trades: winningTrades,
      active_agents: agents.length,
      net_profit: totalPnL * 0.98
    },
    trades,
    decisions,
    agent_performance: agentPerformance,
    trade_count: numTrades,
    decision_count: numDecisions
  }
}