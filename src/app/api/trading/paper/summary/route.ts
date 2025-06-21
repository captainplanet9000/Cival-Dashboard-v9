import { NextRequest, NextResponse } from 'next/server'

// Simulated agent trading data
const generateAgentTradingData = () => {
  const agents = [
    {
      agentId: 'alpha_trading_bot',
      agentName: 'Alpha Trading Bot',
      totalPnl: 1245.67 + (Math.random() - 0.5) * 100,
      realizedPnl: 890.23 + (Math.random() - 0.5) * 50,
      unrealizedPnl: 355.44 + (Math.random() - 0.5) * 50,
      currentBalance: 101245.67 + (Math.random() - 0.5) * 100,
      initialBalance: 100000,
      openPositions: 3,
      totalTrades: 47 + Math.floor(Math.random() * 5),
      winningTrades: 32 + Math.floor(Math.random() * 3),
      dailyPnl: 127.89 + (Math.random() - 0.5) * 50,
      status: 'active'
    },
    {
      agentId: 'risk_guardian',
      agentName: 'Risk Guardian',
      totalPnl: 789.12 + (Math.random() - 0.5) * 80,
      realizedPnl: 456.78 + (Math.random() - 0.5) * 40,
      unrealizedPnl: 332.34 + (Math.random() - 0.5) * 40,
      currentBalance: 100789.12 + (Math.random() - 0.5) * 80,
      initialBalance: 100000,
      openPositions: 2,
      totalTrades: 34 + Math.floor(Math.random() * 3),
      winningTrades: 28 + Math.floor(Math.random() * 2),
      dailyPnl: 45.67 + (Math.random() - 0.5) * 30,
      status: 'active'
    },
    {
      agentId: 'sophia_reversion',
      agentName: 'Sophia Reversion',
      totalPnl: -156.78 + (Math.random() - 0.5) * 60,
      realizedPnl: -89.45 + (Math.random() - 0.5) * 30,
      unrealizedPnl: -67.33 + (Math.random() - 0.5) * 30,
      currentBalance: 99843.22 + (Math.random() - 0.5) * 60,
      initialBalance: 100000,
      openPositions: 1,
      totalTrades: 23 + Math.floor(Math.random() * 2),
      winningTrades: 11,
      dailyPnl: -23.44 + (Math.random() - 0.5) * 20,
      status: 'active'
    },
    {
      agentId: 'marcus_momentum',
      agentName: 'Marcus Momentum',
      totalPnl: 567.89 + (Math.random() - 0.5) * 70,
      realizedPnl: 234.56 + (Math.random() - 0.5) * 35,
      unrealizedPnl: 333.33 + (Math.random() - 0.5) * 35,
      currentBalance: 100567.89 + (Math.random() - 0.5) * 70,
      initialBalance: 100000,
      openPositions: 4,
      totalTrades: 56 + Math.floor(Math.random() * 4),
      winningTrades: 34 + Math.floor(Math.random() * 2),
      dailyPnl: 78.90 + (Math.random() - 0.5) * 40,
      status: 'active'
    },
    {
      agentId: 'alex_arbitrage',
      agentName: 'Alex Arbitrage',
      totalPnl: 345.67 + (Math.random() - 0.5) * 50,
      realizedPnl: 123.45 + (Math.random() - 0.5) * 25,
      unrealizedPnl: 222.22 + (Math.random() - 0.5) * 25,
      currentBalance: 100345.67 + (Math.random() - 0.5) * 50,
      initialBalance: 100000,
      openPositions: 2,
      totalTrades: 28 + Math.floor(Math.random() * 2),
      winningTrades: 21,
      dailyPnl: 34.56 + (Math.random() - 0.5) * 20,
      status: Math.random() > 0.3 ? 'active' : 'paused'
    }
  ]

  // Calculate totals
  const totalPnl = agents.reduce((sum, agent) => sum + agent.totalPnl, 0)
  const totalRealizedPnl = agents.reduce((sum, agent) => sum + agent.realizedPnl, 0)
  const totalUnrealizedPnl = agents.reduce((sum, agent) => sum + agent.unrealizedPnl, 0)
  const totalValue = agents.reduce((sum, agent) => sum + agent.currentBalance, 0)
  const dailyPnl = agents.reduce((sum, agent) => sum + agent.dailyPnl, 0)
  const activeAgents = agents.filter(a => a.status === 'active').length

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    dailyPnl: Math.round(dailyPnl * 100) / 100,
    totalValue: Math.round(totalValue * 100) / 100,
    totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,
    totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
    activeAgents,
    totalAgents: agents.length,
    agents
  }
}

export async function GET(request: NextRequest) {
  try {
    const summary = generateAgentTradingData()

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Paper trading summary error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch paper trading summary'
    }, { status: 500 })
  }
}