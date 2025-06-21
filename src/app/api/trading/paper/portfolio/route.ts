import { NextRequest, NextResponse } from 'next/server'

// Generate realistic trading positions for agents
const generatePositions = () => {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AVAX/USDT', 'MATIC/USDT', 'DOT/USDT', 'LINK/USDT']
  const agents = [
    { id: 'alpha_trading_bot', name: 'Alpha Trading Bot' },
    { id: 'risk_guardian', name: 'Risk Guardian' },
    { id: 'sophia_reversion', name: 'Sophia Reversion' },
    { id: 'marcus_momentum', name: 'Marcus Momentum' },
    { id: 'alex_arbitrage', name: 'Alex Arbitrage' }
  ]

  const positions = []
  const numPositions = 5 + Math.floor(Math.random() * 8) // 5-12 positions

  for (let i = 0; i < numPositions; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    const side = Math.random() > 0.7 ? 'short' : 'long' // 70% long, 30% short
    
    // Generate realistic prices based on symbol
    let basePrice = 50000
    let currentPrice = basePrice
    if (symbol.includes('ETH')) {
      basePrice = 3800
      currentPrice = basePrice + (Math.random() - 0.5) * 200
    } else if (symbol.includes('SOL')) {
      basePrice = 220
      currentPrice = basePrice + (Math.random() - 0.5) * 20
    } else if (symbol.includes('ADA')) {
      basePrice = 1.20
      currentPrice = basePrice + (Math.random() - 0.5) * 0.10
    } else if (symbol.includes('AVAX')) {
      basePrice = 46
      currentPrice = basePrice + (Math.random() - 0.5) * 4
    } else if (symbol.includes('BTC')) {
      basePrice = 67000
      currentPrice = basePrice + (Math.random() - 0.5) * 2000
    }

    const entryPrice = basePrice + (Math.random() - 0.5) * (basePrice * 0.05)
    currentPrice = entryPrice + (Math.random() - 0.5) * (entryPrice * 0.08)

    // Generate quantity based on position size
    let quantity = 1
    if (symbol.includes('BTC')) {
      quantity = 0.01 + Math.random() * 0.1 // 0.01-0.11 BTC
    } else if (symbol.includes('ETH')) {
      quantity = 0.5 + Math.random() * 3 // 0.5-3.5 ETH
    } else if (symbol.includes('SOL')) {
      quantity = 5 + Math.random() * 20 // 5-25 SOL
    } else if (symbol.includes('ADA')) {
      quantity = 100 + Math.random() * 900 // 100-1000 ADA
    }

    const value = currentPrice * quantity
    let unrealizedPnl
    let unrealizedPnlPercent

    if (side === 'long') {
      unrealizedPnl = (currentPrice - entryPrice) * quantity
      unrealizedPnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100
    } else {
      unrealizedPnl = (entryPrice - currentPrice) * quantity
      unrealizedPnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100
    }

    positions.push({
      symbol,
      agentId: agent.id,
      agentName: agent.name,
      side,
      quantity: Math.round(quantity * 1000) / 1000,
      entryPrice: Math.round(entryPrice * 100) / 100,
      currentPrice: Math.round(currentPrice * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      unrealizedPnlPercent: Math.round(unrealizedPnlPercent * 100) / 100,
      value: Math.round(value * 100) / 100,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() // Within last 24h
    })
  }

  return positions
}

// Generate agent performance data
const generateAgentPerformance = () => {
  return [
    {
      agentId: 'alpha_trading_bot',
      agentName: 'Alpha Trading Bot',
      totalPnl: 1245.67 + (Math.random() - 0.5) * 100,
      realizedPnl: 890.23 + (Math.random() - 0.5) * 50,
      unrealizedPnl: 355.44 + (Math.random() - 0.5) * 50,
      currentBalance: 101245.67 + (Math.random() - 0.5) * 100,
      initialBalance: 100000,
      openPositions: Math.floor(Math.random() * 5) + 1,
      totalTrades: 47 + Math.floor(Math.random() * 10),
      winningTrades: 32 + Math.floor(Math.random() * 5),
      winRate: 65 + Math.random() * 15, // 65-80%
      dailyPnl: 127.89 + (Math.random() - 0.5) * 50,
      maxDrawdown: -234.56 - Math.random() * 100,
      status: 'active',
      strategy: 'momentum',
      riskLevel: 'medium'
    },
    {
      agentId: 'risk_guardian',
      agentName: 'Risk Guardian',
      totalPnl: 789.12 + (Math.random() - 0.5) * 80,
      realizedPnl: 456.78 + (Math.random() - 0.5) * 40,
      unrealizedPnl: 332.34 + (Math.random() - 0.5) * 40,
      currentBalance: 100789.12 + (Math.random() - 0.5) * 80,
      initialBalance: 100000,
      openPositions: Math.floor(Math.random() * 3) + 1,
      totalTrades: 34 + Math.floor(Math.random() * 8),
      winningTrades: 28 + Math.floor(Math.random() * 4),
      winRate: 75 + Math.random() * 10, // 75-85%
      dailyPnl: 45.67 + (Math.random() - 0.5) * 30,
      maxDrawdown: -123.45 - Math.random() * 50,
      status: 'active',
      strategy: 'arbitrage',
      riskLevel: 'low'
    },
    {
      agentId: 'sophia_reversion',
      agentName: 'Sophia Reversion',
      totalPnl: -156.78 + (Math.random() - 0.5) * 60,
      realizedPnl: -89.45 + (Math.random() - 0.5) * 30,
      unrealizedPnl: -67.33 + (Math.random() - 0.5) * 30,
      currentBalance: 99843.22 + (Math.random() - 0.5) * 60,
      initialBalance: 100000,
      openPositions: Math.floor(Math.random() * 2) + 1,
      totalTrades: 23 + Math.floor(Math.random() * 5),
      winningTrades: 11 + Math.floor(Math.random() * 3),
      winRate: 40 + Math.random() * 15, // 40-55%
      dailyPnl: -23.44 + (Math.random() - 0.5) * 20,
      maxDrawdown: -345.67 - Math.random() * 100,
      status: 'active',
      strategy: 'mean_reversion',
      riskLevel: 'medium'
    },
    {
      agentId: 'marcus_momentum',
      agentName: 'Marcus Momentum',
      totalPnl: 567.89 + (Math.random() - 0.5) * 70,
      realizedPnl: 234.56 + (Math.random() - 0.5) * 35,
      unrealizedPnl: 333.33 + (Math.random() - 0.5) * 35,
      currentBalance: 100567.89 + (Math.random() - 0.5) * 70,
      initialBalance: 100000,
      openPositions: Math.floor(Math.random() * 4) + 2,
      totalTrades: 56 + Math.floor(Math.random() * 10),
      winningTrades: 34 + Math.floor(Math.random() * 6),
      winRate: 55 + Math.random() * 15, // 55-70%
      dailyPnl: 78.90 + (Math.random() - 0.5) * 40,
      maxDrawdown: -189.45 - Math.random() * 80,
      status: 'active',
      strategy: 'momentum',
      riskLevel: 'high'
    },
    {
      agentId: 'alex_arbitrage',
      agentName: 'Alex Arbitrage',
      totalPnl: 345.67 + (Math.random() - 0.5) * 50,
      realizedPnl: 123.45 + (Math.random() - 0.5) * 25,
      unrealizedPnl: 222.22 + (Math.random() - 0.5) * 25,
      currentBalance: 100345.67 + (Math.random() - 0.5) * 50,
      initialBalance: 100000,
      openPositions: Math.floor(Math.random() * 3) + 1,
      totalTrades: 28 + Math.floor(Math.random() * 6),
      winningTrades: 21 + Math.floor(Math.random() * 3),
      winRate: 70 + Math.random() * 10, // 70-80%
      dailyPnl: 34.56 + (Math.random() - 0.5) * 20,
      maxDrawdown: -67.89 - Math.random() * 30,
      status: Math.random() > 0.3 ? 'active' : 'paused',
      strategy: 'arbitrage',
      riskLevel: 'low'
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const agents = generateAgentPerformance()
    const positions = generatePositions()

    // Calculate summary
    const totalPnl = agents.reduce((sum, agent) => sum + agent.totalPnl, 0)
    const totalRealizedPnl = agents.reduce((sum, agent) => sum + agent.realizedPnl, 0)
    const totalUnrealizedPnl = agents.reduce((sum, agent) => sum + agent.unrealizedPnl, 0)
    const totalPortfolioValue = agents.reduce((sum, agent) => sum + agent.currentBalance, 0)
    const dailyPnl = agents.reduce((sum, agent) => sum + agent.dailyPnl, 0)
    const activeAgents = agents.filter(a => a.status === 'active').length
    const totalTrades = agents.reduce((sum, agent) => sum + agent.totalTrades, 0)
    const totalWinningTrades = agents.reduce((sum, agent) => sum + agent.winningTrades, 0)
    const averageWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0

    const bestPerformer = agents.reduce((best, current) => 
      current.totalPnl > best.totalPnl ? current : best
    )
    
    const worstPerformer = agents.reduce((worst, current) => 
      current.totalPnl < worst.totalPnl ? current : worst
    )

    const summary = {
      totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,
      totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
      dailyPnl: Math.round(dailyPnl * 100) / 100,
      activeAgents,
      totalPositions: positions.length,
      totalTrades,
      averageWinRate: Math.round(averageWinRate * 100) / 100,
      bestPerformer,
      worstPerformer
    }

    return NextResponse.json({
      success: true,
      agents,
      positions,
      summary,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Paper trading portfolio error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch paper trading portfolio'
    }, { status: 500 })
  }
}