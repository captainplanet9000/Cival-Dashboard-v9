import { NextRequest, NextResponse } from 'next/server'

// Generate realistic trade history for agents
const generateTradeHistory = (agentId?: string, limit = 50) => {
  const agents = [
    { id: 'alpha_trading_bot', name: 'Alpha Trading Bot', strategy: 'momentum', winRate: 0.68 },
    { id: 'risk_guardian', name: 'Risk Guardian', strategy: 'arbitrage', winRate: 0.82 },
    { id: 'sophia_reversion', name: 'Sophia Reversion', strategy: 'mean_reversion', winRate: 0.48 },
    { id: 'marcus_momentum', name: 'Marcus Momentum', strategy: 'momentum', winRate: 0.61 },
    { id: 'alex_arbitrage', name: 'Alex Arbitrage', strategy: 'arbitrage', winRate: 0.75 }
  ]

  const symbols = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AVAX/USDT', 
    'MATIC/USDT', 'DOT/USDT', 'LINK/USDT', 'UNI/USDT', 'AAVE/USDT'
  ]

  const trades = []
  const filteredAgents = agentId ? agents.filter(a => a.id === agentId) : agents

  for (let i = 0; i < limit; i++) {
    const agent = filteredAgents[Math.floor(Math.random() * filteredAgents.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const isWin = Math.random() < agent.winRate

    // Generate realistic prices based on symbol
    let basePrice = 50000
    if (symbol.includes('ETH')) basePrice = 3800
    else if (symbol.includes('SOL')) basePrice = 220
    else if (symbol.includes('ADA')) basePrice = 1.20
    else if (symbol.includes('AVAX')) basePrice = 46
    else if (symbol.includes('MATIC')) basePrice = 0.95
    else if (symbol.includes('DOT')) basePrice = 7.50
    else if (symbol.includes('LINK')) basePrice = 14.50
    else if (symbol.includes('UNI')) basePrice = 6.80
    else if (symbol.includes('AAVE')) basePrice = 145

    const entryPrice = basePrice + (Math.random() - 0.5) * (basePrice * 0.05)
    const exitPrice = isWin 
      ? entryPrice * (1 + Math.random() * 0.08) // 0-8% profit
      : entryPrice * (1 - Math.random() * 0.06) // 0-6% loss

    // Generate quantity based on position size
    let quantity = 1
    if (symbol.includes('BTC')) quantity = 0.01 + Math.random() * 0.05
    else if (symbol.includes('ETH')) quantity = 0.1 + Math.random() * 1
    else if (symbol.includes('SOL')) quantity = 1 + Math.random() * 10
    else if (symbol.includes('ADA')) quantity = 50 + Math.random() * 500
    else if (symbol.includes('AVAX')) quantity = 1 + Math.random() * 20
    else quantity = 10 + Math.random() * 100

    const value = entryPrice * quantity
    const pnl = (exitPrice - entryPrice) * quantity * (side === 'sell' ? -1 : 1)
    const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * (side === 'sell' ? -1 : 1)

    // Generate realistic timestamps
    const tradeTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Within last 30 days
    const exitTime = new Date(tradeTime.getTime() + Math.random() * 24 * 60 * 60 * 1000) // Exit within 24h

    const trade = {
      id: `trade_${agent.id}_${Date.now()}_${i}`,
      agentId: agent.id,
      agentName: agent.name,
      symbol,
      side,
      orderType: Math.random() > 0.7 ? 'limit' : 'market',
      quantity: Math.round(quantity * 1000) / 1000,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      value: Math.round(value * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      fees: Math.round(value * 0.001 * 100) / 100, // 0.1% fees
      strategy: agent.strategy,
      reasoning: generateTradeReasoning(agent.strategy, symbol, side, isWin),
      confidence: 0.6 + Math.random() * 0.3, // 60-90% confidence
      entryTime: tradeTime.toISOString(),
      exitTime: exitTime.toISOString(),
      duration: Math.round((exitTime.getTime() - tradeTime.getTime()) / 1000 / 60), // minutes
      status: 'completed',
      exchange: ['binance', 'coinbase', 'hyperliquid'][Math.floor(Math.random() * 3)]
    }

    trades.push(trade)
  }

  // Sort by most recent first
  return trades.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
}

const generateTradeReasoning = (strategy: string, symbol: string, side: string, isWin: boolean) => {
  const reasoningTemplates = {
    momentum: [
      `Strong ${side === 'buy' ? 'bullish' : 'bearish'} momentum detected in ${symbol} with high volume confirmation`,
      `Price breaking ${side === 'buy' ? 'above' : 'below'} key resistance level with conviction`,
      `RSI showing ${side === 'buy' ? 'continued strength' : 'weakness'}, trend likely to continue`,
      `Moving averages aligned for ${side === 'buy' ? 'upward' : 'downward'} momentum in ${symbol}`,
      `Volume surge indicates strong ${side === 'buy' ? 'buying' : 'selling'} interest`
    ],
    arbitrage: [
      `Price discrepancy detected between exchanges for ${symbol}`,
      `Funding rate differential creating profitable opportunity`,
      `Cross-exchange spread exceeding threshold for ${symbol}`,
      `Triangular arbitrage opportunity identified`,
      `Market inefficiency spotted in ${symbol} pricing`
    ],
    mean_reversion: [
      `${symbol} price extended beyond 2 standard deviations`,
      `Oversold conditions with reversal signals emerging`,
      `Support level holding, expect bounce back to mean`,
      `Bollinger Bands indicating ${side === 'buy' ? 'oversold' : 'overbought'} conditions`,
      `Price deviation from moving average suggests reversion`
    ]
  }

  const templates = reasoningTemplates[strategy as keyof typeof reasoningTemplates] || reasoningTemplates.momentum
  const baseReason = templates[Math.floor(Math.random() * templates.length)]
  
  if (!isWin) {
    const failureReasons = [
      ' - Market conditions changed unexpectedly',
      ' - Stop loss triggered due to volatility',
      ' - External news impact exceeded expectations',
      ' - Algorithm adjustment needed for better performance'
    ]
    return baseReason + failureReasons[Math.floor(Math.random() * failureReasons.length)]
  }
  
  return baseReason
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || 'all' // all, completed, open

    const trades = generateTradeHistory(agentId, limit)
    
    // Filter by status if needed
    const filteredTrades = status === 'all' ? trades : trades.filter(t => t.status === status)

    // Calculate summary statistics
    const totalTrades = filteredTrades.length
    const winningTrades = filteredTrades.filter(t => t.pnl > 0).length
    const losingTrades = filteredTrades.filter(t => t.pnl < 0).length
    const totalPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0)
    const totalFees = filteredTrades.reduce((sum, t) => sum + t.fees, 0)
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0
    const bestTrade = filteredTrades.reduce((best, current) => 
      current.pnl > best.pnl ? current : best, filteredTrades[0] || null
    )
    const worstTrade = filteredTrades.reduce((worst, current) => 
      current.pnl < worst.pnl ? current : worst, filteredTrades[0] || null
    )

    const summary = {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: Math.round(winRate * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      netPnl: Math.round((totalPnl - totalFees) * 100) / 100,
      avgPnl: Math.round(avgPnl * 100) / 100,
      bestTrade,
      worstTrade
    }

    return NextResponse.json({
      success: true,
      trades: filteredTrades,
      summary,
      filters: { agentId, limit, status },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Paper trading trades error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trading history'
    }, { status: 500 })
  }
}