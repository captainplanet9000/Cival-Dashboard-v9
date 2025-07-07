import { NextRequest, NextResponse } from 'next/server'
import { realPaperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

// In-memory storage for stress test results
let stressTestResults: any[] = []

export async function POST(request: NextRequest) {
  try {
    const scenario = await request.json()
    
    // Get current portfolio state
    const agents = await realPaperTradingEngine.getAllAgents()
    const portfolioValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    
    // Run stress test simulation
    const stressTestResult = await runStressTestScenario(scenario, agents)
    
    // Store result
    const result = {
      id: scenario.id || `stress_test_${Date.now()}`,
      name: scenario.name,
      description: scenario.description,
      scenario,
      result: stressTestResult,
      timestamp: Date.now(),
      portfolioValueBefore: portfolioValue,
      portfolioValueAfter: stressTestResult.portfolioValueAfter
    }
    
    stressTestResults.unshift(result)
    
    // Keep only last 20 results
    if (stressTestResults.length > 20) {
      stressTestResults = stressTestResults.slice(0, 20)
    }
    
    // Broadcast stress test result
    try {
      const { broadcastRiskEvent } = await import('@/lib/websocket/risk-broadcaster')
      await broadcastRiskEvent('stress_test_completed', {
        testId: result.id,
        scenario: scenario.name,
        impact: stressTestResult.portfolioImpact,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error broadcasting stress test result:', error)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error running stress test:', error)
    return NextResponse.json(
      { error: 'Failed to run stress test' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      scenarios: stressTestResults,
      total: stressTestResults.length
    })
  } catch (error) {
    console.error('Error fetching stress test results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stress test results' },
      { status: 500 }
    )
  }
}

async function runStressTestScenario(scenario: any, agents: any[]) {
  const results = {
    portfolioImpact: 0,
    varImpact: 0,
    maxDrawdownImpact: 0,
    liquidityImpact: 0,
    portfolioValueAfter: 0,
    positionImpacts: [] as any[],
    riskMetrics: {
      before: {} as any,
      after: {} as any
    }
  }
  
  try {
    // Calculate current portfolio metrics
    const currentPortfolioValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const currentExposure = agents.reduce((sum, agent) => 
      sum + agent.portfolio.positions.reduce((posSum: number, pos: any) => posSum + Math.abs(pos.marketValue), 0), 0
    )
    
    results.riskMetrics.before = {
      portfolioValue: currentPortfolioValue,
      exposure: currentExposure,
      leverage: currentPortfolioValue > 0 ? currentExposure / currentPortfolioValue : 0
    }
    
    // Apply stress test shocks
    let portfolioValueAfterShock = currentPortfolioValue
    const positionImpacts: any[] = []
    
    // Apply shocks to each position
    agents.forEach(agent => {
      agent.portfolio.positions.forEach((position: any) => {
        const symbol = position.symbol
        const shock = scenario.shocks[symbol] || 0
        
        if (shock !== 0) {
          const positionValue = Math.abs(position.marketValue)
          const impactValue = positionValue * shock
          const newPositionValue = positionValue + impactValue
          
          // Calculate impact on portfolio
          portfolioValueAfterShock += impactValue
          
          positionImpacts.push({
            symbol,
            agentId: agent.id,
            originalValue: positionValue,
            shock: shock * 100, // Convert to percentage
            impactValue,
            newValue: newPositionValue,
            impactPercent: positionValue > 0 ? (impactValue / positionValue) * 100 : 0
          })
        }
      })
    })
    
    // Calculate scenario-specific impacts
    switch (scenario.id) {
      case 'market_crash':
        results.liquidityImpact = 3.5 // Liquidity becomes 3.5 points worse during crash
        results.varImpact = 150 // VaR increases by 150%
        break
        
      case 'liquidity_crisis':
        results.liquidityImpact = 7.0 // Severe liquidity constraints
        results.varImpact = 75 // VaR increases by 75%
        // Apply liquidity penalty
        portfolioValueAfterShock *= 0.95 // 5% liquidity discount
        break
        
      case 'flash_crash':
        results.liquidityImpact = 2.0 // Temporary liquidity issues
        results.varImpact = 200 // VaR spikes dramatically
        // Flash crashes affect smaller positions more
        positionImpacts.forEach(impact => {
          if (impact.originalValue < 10000) { // Smaller positions
            impact.impactValue *= 1.5 // 50% more impact
            portfolioValueAfterShock -= impact.originalValue * 0.1 // Additional 10% impact
          }
        })
        break
        
      default:
        results.liquidityIimpact = Math.abs(scenario.shocks.BTC || 0) * 5
        results.varImpact = Math.abs(scenario.shocks.BTC || 0) * 100
    }
    
    // Calculate overall portfolio impact
    results.portfolioImpact = currentPortfolioValue > 0 ? 
      ((portfolioValueAfterShock - currentPortfolioValue) / currentPortfolioValue) * 100 : 0
    
    // Calculate maximum drawdown impact
    const currentDrawdowns = agents.map(agent => agent.portfolio.performance.maxDrawdown)
    const avgCurrentDrawdown = currentDrawdowns.reduce((sum, dd) => sum + dd, 0) / currentDrawdowns.length
    const additionalDrawdown = Math.abs(results.portfolioImpact) * 0.8 // 80% of portfolio impact becomes drawdown
    results.maxDrawdownImpact = additionalDrawdown
    
    results.portfolioValueAfter = portfolioValueAfterShock
    results.positionImpacts = positionImpacts
    
    results.riskMetrics.after = {
      portfolioValue: portfolioValueAfterShock,
      exposure: currentExposure * (1 + (results.portfolioImpact / 100)),
      leverage: portfolioValueAfterShock > 0 ? 
        (currentExposure * (1 + (results.portfolioImpact / 100))) / portfolioValueAfterShock : 0
    }
    
    console.log(`Stress test "${scenario.name}" completed:`)
    console.log(`- Portfolio impact: ${results.portfolioImpact.toFixed(2)}%`)
    console.log(`- VaR impact: +${results.varImpact.toFixed(1)}%`)
    console.log(`- Liquidity impact: ${results.liquidityImpact.toFixed(1)}/10`)
    console.log(`- Max drawdown impact: +${results.maxDrawdownImpact.toFixed(2)}%`)
    
  } catch (error) {
    console.error('Error in stress test calculation:', error)
    // Return empty results on error
  }
  
  return results
}