import { NextRequest, NextResponse } from 'next/server'
import { realPaperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

export async function GET(request: NextRequest) {
  try {
    const agents = await realPaperTradingEngine.getAllAgents()
    const positionRisks: any[] = []
    
    // Analyze risk for each position across all agents
    const symbolMap = new Map<string, any[]>()
    
    // Group positions by symbol
    agents.forEach(agent => {
      agent.portfolio.positions.forEach((position: any) => {
        if (!symbolMap.has(position.symbol)) {
          symbolMap.set(position.symbol, [])
        }
        symbolMap.get(position.symbol)!.push({
          ...position,
          agentId: agent.id,
          agentName: agent.name,
          portfolioValue: agent.portfolio.totalValue
        })
      })
    })
    
    // Calculate risk metrics for each symbol
    for (const [symbol, positions] of symbolMap.entries()) {
      const totalExposure = positions.reduce((sum, pos) => sum + Math.abs(pos.marketValue), 0)
      const totalPortfolioValue = positions.reduce((sum, pos) => sum + pos.portfolioValue, 0)
      const avgPrice = positions.reduce((sum, pos) => sum + pos.currentPrice, 0) / positions.length
      
      // Calculate position-level risk metrics
      const concentration = totalPortfolioValue > 0 ? (totalExposure / totalPortfolioValue) * 100 : 0
      const volatility = calculateAssetVolatility(symbol)
      const beta = calculateAssetBeta(symbol)
      const correlation = calculateAssetCorrelation(symbol)
      const liquidityScore = calculateLiquidityScore(symbol, totalExposure)
      
      // Calculate Value at Risk for this position
      const var95 = totalExposure * volatility * 1.645 // 95% confidence
      
      // Calculate overall risk score (0-10)
      const riskScore = Math.min(10, 
        (concentration / 10) + // Concentration risk
        (volatility * 100) + // Volatility risk
        (Math.abs(beta - 1) * 2) + // Beta risk
        ((10 - liquidityScore) / 2) // Liquidity risk
      )
      
      // Calculate recommended position size based on risk
      const maxRecommendedConcentration = 15 // 15% max concentration
      const recommendedSize = (totalPortfolioValue * maxRecommendedConcentration / 100) / avgPrice
      const currentSize = positions.reduce((sum, pos) => sum + Math.abs(pos.quantity), 0)
      
      positionRisks.push({
        symbol,
        exposure: totalExposure,
        var95: -Math.abs(var95),
        beta,
        correlation,
        liquidityScore,
        concentrationPercent: concentration,
        riskScore,
        recommendedSize: recommendedSize * avgPrice,
        currentSize: currentSize * avgPrice,
        volatility,
        agentCount: positions.length,
        avgPrice,
        positions: positions.map(pos => ({
          agentId: pos.agentId,
          agentName: pos.agentName,
          quantity: pos.quantity,
          marketValue: pos.marketValue,
          unrealizedPnL: pos.unrealizedPnL
        }))
      })
    }
    
    // Sort by risk score (highest first)
    positionRisks.sort((a, b) => b.riskScore - a.riskScore)
    
    return NextResponse.json({
      positions: positionRisks,
      summary: {
        totalPositions: positionRisks.length,
        highRiskPositions: positionRisks.filter(p => p.riskScore > 7).length,
        mediumRiskPositions: positionRisks.filter(p => p.riskScore > 4 && p.riskScore <= 7).length,
        lowRiskPositions: positionRisks.filter(p => p.riskScore <= 4).length,
        totalExposure: positionRisks.reduce((sum, p) => sum + p.exposure, 0),
        avgRiskScore: positionRisks.reduce((sum, p) => sum + p.riskScore, 0) / positionRisks.length
      }
    })
    
  } catch (error) {
    console.error('Error fetching position risks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch position risks' },
      { status: 500 }
    )
  }
}

// Helper functions for risk calculations
function calculateAssetVolatility(symbol: string): number {
  // Simplified volatility calculation
  // In production, would use historical price data
  const volatilityMap: { [key: string]: number } = {
    'BTC/USD': 0.04,
    'ETH/USD': 0.05,
    'SOL/USD': 0.08,
    'ADA/USD': 0.07,
    'DOT/USD': 0.06,
    'LINK/USD': 0.06,
    'UNI/USD': 0.08,
    'AAVE/USD': 0.07,
    'MATIC/USD': 0.09,
    'AVAX/USD': 0.08
  }
  
  return volatilityMap[symbol] || 0.06 // Default 6% daily volatility
}

function calculateAssetBeta(symbol: string): number {
  // Simplified beta calculation relative to market
  // In production, would calculate vs market index
  const betaMap: { [key: string]: number } = {
    'BTC/USD': 1.0,
    'ETH/USD': 1.2,
    'SOL/USD': 1.5,
    'ADA/USD': 1.3,
    'DOT/USD': 1.4,
    'LINK/USD': 1.3,
    'UNI/USD': 1.6,
    'AAVE/USD': 1.4,
    'MATIC/USD': 1.7,
    'AVAX/USD': 1.5
  }
  
  return betaMap[symbol] || 1.2 // Default beta of 1.2
}

function calculateAssetCorrelation(symbol: string): number {
  // Simplified correlation with BTC
  // In production, would calculate actual correlations
  const correlationMap: { [key: string]: number } = {
    'BTC/USD': 1.0,
    'ETH/USD': 0.8,
    'SOL/USD': 0.7,
    'ADA/USD': 0.6,
    'DOT/USD': 0.6,
    'LINK/USD': 0.5,
    'UNI/USD': 0.4,
    'AAVE/USD': 0.5,
    'MATIC/USD': 0.4,
    'AVAX/USD': 0.6
  }
  
  return correlationMap[symbol] || 0.5 // Default 50% correlation
}

function calculateLiquidityScore(symbol: string, exposure: number): number {
  // Simplified liquidity scoring (0-10, 10 being most liquid)
  // Based on typical trading volumes and market depth
  const baseLiquidityMap: { [key: string]: number } = {
    'BTC/USD': 10,
    'ETH/USD': 9,
    'SOL/USD': 7,
    'ADA/USD': 6,
    'DOT/USD': 6,
    'LINK/USD': 5,
    'UNI/USD': 5,
    'AAVE/USD': 4,
    'MATIC/USD': 6,
    'AVAX/USD': 5
  }
  
  const baseLiquidity = baseLiquidityMap[symbol] || 3
  
  // Adjust for position size - larger positions are harder to liquidate
  const sizeAdjustment = Math.max(0, 2 - (exposure / 50000)) // Penalize positions > $50K
  
  return Math.max(1, Math.min(10, baseLiquidity + sizeAdjustment))
}