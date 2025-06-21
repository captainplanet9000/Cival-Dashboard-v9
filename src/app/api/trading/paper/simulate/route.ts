import { NextRequest, NextResponse } from 'next/server'

// Simulate a paper trade execution
const simulateTrade = () => {
  const agents = [
    { id: 'alpha_trading_bot', name: 'Alpha Trading Bot', strategy: 'momentum' },
    { id: 'risk_guardian', name: 'Risk Guardian', strategy: 'arbitrage' },
    { id: 'sophia_reversion', name: 'Sophia Reversion', strategy: 'mean_reversion' },
    { id: 'marcus_momentum', name: 'Marcus Momentum', strategy: 'momentum' },
    { id: 'alex_arbitrage', name: 'Alex Arbitrage', strategy: 'arbitrage' }
  ]

  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AVAX/USDT']
  
  const agent = agents[Math.floor(Math.random() * agents.length)]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const side = Math.random() > 0.5 ? 'buy' : 'sell'
  
  // Generate realistic price based on symbol
  let price = 50000
  if (symbol.includes('ETH')) price = 3800 + (Math.random() - 0.5) * 200
  else if (symbol.includes('SOL')) price = 220 + (Math.random() - 0.5) * 20
  else if (symbol.includes('ADA')) price = 1.20 + (Math.random() - 0.5) * 0.10
  else if (symbol.includes('AVAX')) price = 46 + (Math.random() - 0.5) * 4
  else if (symbol.includes('BTC')) price = 67000 + (Math.random() - 0.5) * 2000

  const quantity = Math.random() * 10 + 1
  const pnl = (Math.random() - 0.4) * 500 // Slight positive bias

  return {
    tradeId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId: agent.id,
    agentName: agent.name,
    symbol,
    side,
    quantity: Math.round(quantity * 1000) / 1000,
    price: Math.round(price * 100) / 100,
    pnl: Math.round(pnl * 100) / 100,
    strategy: agent.strategy,
    timestamp: new Date().toISOString(),
    reasoning: generateReasoning(agent.strategy, symbol, side)
  }
}

const generateReasoning = (strategy: string, symbol: string, side: string) => {
  const reasoningTemplates = {
    momentum: [
      `Strong ${side === 'buy' ? 'bullish' : 'bearish'} momentum detected in ${symbol}`,
      `Price breaking ${side === 'buy' ? 'above' : 'below'} key resistance with volume`,
      `RSI showing ${side === 'buy' ? 'continued strength' : 'weakness'} in ${symbol}`
    ],
    arbitrage: [
      `Price discrepancy detected between exchanges for ${symbol}`,
      `Funding rate opportunity identified in ${symbol}`,
      `Cross-exchange spread profitable for ${symbol}`
    ],
    mean_reversion: [
      `${symbol} extended beyond normal range, expecting reversion`,
      `Oversold conditions detected in ${symbol}`,
      `Support level holding for ${symbol}, bounce expected`
    ]
  }

  const templates = reasoningTemplates[strategy as keyof typeof reasoningTemplates] || reasoningTemplates.momentum
  return templates[Math.floor(Math.random() * templates.length)]
}

export async function POST(request: NextRequest) {
  try {
    const { count = 1 } = await request.json()
    
    const trades = []
    for (let i = 0; i < Math.min(count, 10); i++) {
      trades.push(simulateTrade())
    }

    // In a real implementation, this would:
    // 1. Execute the trade through the paper trading engine
    // 2. Update agent balances and positions
    // 3. Emit AG-UI events to all connected clients
    // 4. Store the trade in the database

    return NextResponse.json({
      success: true,
      trades,
      message: `Simulated ${trades.length} paper trade(s)`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Trade simulation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to simulate trades'
    }, { status: 500 })
  }
}

// For testing AG-UI events
export async function GET(request: NextRequest) {
  try {
    const trade = simulateTrade()
    
    // This would normally emit an AG-UI event
    // emit('paper_trading.trade_executed', trade)
    
    return NextResponse.json({
      success: true,
      trade,
      message: 'Simulated single trade for testing',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Trade simulation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to simulate trade'
    }, { status: 500 })
  }
}