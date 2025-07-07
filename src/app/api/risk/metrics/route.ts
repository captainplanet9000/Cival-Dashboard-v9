import { NextRequest, NextResponse } from 'next/server'
import { productionRiskManager } from '@/lib/risk/production-risk-manager'
import { realPaperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

export async function GET(request: NextRequest) {
  try {
    // Get portfolio data from paper trading engine
    const portfolioSummary = await realPaperTradingEngine.getPortfolioSummary()
    const agents = await realPaperTradingEngine.getAllAgents()
    
    // Calculate comprehensive risk metrics
    const totalPortfolioValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const totalExposure = agents.reduce((sum, agent) => 
      sum + agent.portfolio.positions.reduce((posSum, pos) => posSum + Math.abs(pos.marketValue), 0), 0
    )
    
    // Calculate portfolio risk metrics
    const leverageRatio = totalPortfolioValue > 0 ? totalExposure / totalPortfolioValue : 0
    const concentrationRisk = calculateConcentrationRisk(agents)
    const correlationMatrix = calculateCorrelationMatrix(agents)
    
    // Calculate Value at Risk (simplified)
    const portfolioVolatility = 0.02 // 2% daily volatility assumption
    const var95 = totalPortfolioValue * portfolioVolatility * 1.645 // 95% confidence
    const var99 = totalPortfolioValue * portfolioVolatility * 2.326 // 99% confidence
    
    // Calculate drawdown metrics
    const allTimeHigh = Math.max(...agents.map(a => a.portfolio.performance.allTimeHigh))
    const currentValue = totalPortfolioValue
    const currentDrawdown = allTimeHigh > 0 ? ((allTimeHigh - currentValue) / allTimeHigh) * 100 : 0
    const maxDrawdown = Math.max(...agents.map(a => a.portfolio.performance.maxDrawdown))
    
    // Calculate performance ratios
    const totalReturn = agents.reduce((sum, a) => sum + a.portfolio.performance.totalReturn, 0) / agents.length
    const volatility = agents.reduce((sum, a) => sum + a.portfolio.performance.volatility, 0) / agents.length
    const sharpeRatio = volatility > 0 ? totalReturn / volatility : 0
    const sortinoRatio = calculateSortinoRatio(agents)
    
    // Portfolio beta and alpha (relative to market)
    const beta = 1.0 // Simplified - would calculate vs market index
    const alpha = totalReturn - (0.02 * beta) // Simplified alpha calculation
    
    // Liquidity and margin metrics
    const liquidityRisk = calculateLiquidityRisk(agents)
    const marginUtilization = calculateMarginUtilization(agents)
    
    const riskMetrics = {
      portfolioRisk: Math.abs(currentDrawdown) + (leverageRatio * 2) + concentrationRisk,
      valueAtRisk: {
        var95: -Math.abs(var95),
        var99: -Math.abs(var99),
        timeHorizon: '1 day'
      },
      maxDrawdown: {
        current: currentDrawdown,
        historical: maxDrawdown,
        peak: allTimeHigh,
        trough: currentValue
      },
      sharpeRatio,
      sortinoRatio,
      beta,
      alpha,
      correlations: correlationMatrix,
      concentrationRisk,
      liquidityRisk,
      leverageRatio,
      marginUtilization,
      lastUpdate: Date.now()
    }
    
    return NextResponse.json(riskMetrics)
    
  } catch (error) {
    console.error('Error fetching risk metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk metrics' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateConcentrationRisk(agents: any[]): number {
  const assetExposure = new Map<string, number>()
  let totalValue = 0
  
  agents.forEach(agent => {
    agent.portfolio.positions.forEach((pos: any) => {
      const exposure = Math.abs(pos.marketValue)
      assetExposure.set(pos.symbol, (assetExposure.get(pos.symbol) || 0) + exposure)
      totalValue += exposure
    })
  })
  
  if (totalValue === 0) return 0
  
  // Calculate concentration as % of largest single asset exposure
  const maxExposure = Math.max(...Array.from(assetExposure.values()))
  return (maxExposure / totalValue) * 100
}

function calculateCorrelationMatrix(agents: any[]): { [pair: string]: number } {
  // Simplified correlation calculation
  // In production, would use historical price data
  const correlations: { [pair: string]: number } = {}
  
  const symbols = new Set<string>()
  agents.forEach(agent => {
    agent.portfolio.positions.forEach((pos: any) => symbols.add(pos.symbol))
  })
  
  const symbolArray = Array.from(symbols)
  for (let i = 0; i < symbolArray.length; i++) {
    for (let j = i + 1; j < symbolArray.length; j++) {
      const pair = `${symbolArray[i]}_${symbolArray[j]}`
      // Mock correlation - in production would calculate from price history
      correlations[pair] = Math.random() * 0.8 - 0.4 // -0.4 to 0.4
    }
  }
  
  return correlations
}

function calculateSortinoRatio(agents: any[]): number {
  const returns = agents.map(a => a.portfolio.performance.totalReturn)
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  
  // Calculate downside deviation
  const negativeReturns = returns.filter(r => r < 0)
  if (negativeReturns.length === 0) return avgReturn > 0 ? Infinity : 0
  
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length
  const downsideDeviation = Math.sqrt(downsideVariance)
  
  return downsideDeviation > 0 ? avgReturn / downsideDeviation : 0
}

function calculateLiquidityRisk(agents: any[]): number {
  // Simplified liquidity risk calculation
  // In production, would consider actual market liquidity, trading volumes, etc.
  const positions = agents.flatMap(a => a.portfolio.positions)
  const totalPositions = positions.length
  
  if (totalPositions === 0) return 0
  
  // Mock calculation - larger positions in less liquid assets = higher risk
  const liquidityScores = positions.map((pos: any) => {
    const size = Math.abs(pos.marketValue)
    // Assume BTC/ETH are more liquid, others less so
    const liquidityMultiplier = ['BTC/USD', 'ETH/USD'].includes(pos.symbol) ? 0.5 : 1.5
    return (size / 10000) * liquidityMultiplier // Normalize to 10K position size
  })
  
  return Math.min(liquidityScores.reduce((sum, score) => sum + score, 0) / totalPositions, 10)
}

function calculateMarginUtilization(agents: any[]): number {
  const totalEquity = agents.reduce((sum, a) => sum + a.portfolio.totalValue, 0)
  const totalMarginUsed = agents.reduce((sum, a) => sum + (a.portfolio.marginUsed || 0), 0)
  
  return totalEquity > 0 ? totalMarginUsed / totalEquity : 0
}