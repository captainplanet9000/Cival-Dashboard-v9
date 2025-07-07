import { NextRequest, NextResponse } from 'next/server'
import { productionRiskManager } from '@/lib/risk/production-risk-manager'
import { realPaperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

// In-memory storage for risk alerts (in production, would use database)
let riskAlerts: any[] = []

export async function GET(request: NextRequest) {
  try {
    // Generate real-time risk alerts based on current portfolio state
    const alerts = await generateCurrentRiskAlerts()
    
    return NextResponse.json({ 
      alerts: alerts,
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
      high: alerts.filter(a => a.severity === 'high' && !a.resolved).length,
      medium: alerts.filter(a => a.severity === 'medium' && !a.resolved).length,
      low: alerts.filter(a => a.severity === 'low' && !a.resolved).length
    })
    
  } catch (error) {
    console.error('Error fetching risk alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const alertData = await request.json()
    
    const newAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    }
    
    riskAlerts.unshift(newAlert)
    
    // Keep only last 100 alerts
    if (riskAlerts.length > 100) {
      riskAlerts = riskAlerts.slice(0, 100)
    }
    
    return NextResponse.json(newAlert)
    
  } catch (error) {
    console.error('Error creating risk alert:', error)
    return NextResponse.json(
      { error: 'Failed to create risk alert' },
      { status: 500 }
    )
  }
}

async function generateCurrentRiskAlerts() {
  const alerts = [...riskAlerts]
  
  try {
    const agents = await realPaperTradingEngine.getAllAgents()
    const now = Date.now()
    
    // Check each agent for risk conditions
    for (const agent of agents) {
      const portfolio = agent.portfolio
      
      // Check for high drawdown
      const drawdown = portfolio.performance.maxDrawdown
      if (drawdown > 15) {
        const existingAlert = alerts.find(a => 
          a.type === 'drawdown' && 
          a.agentId === agent.id && 
          !a.resolved &&
          (now - a.timestamp) < 3600000 // Within last hour
        )
        
        if (!existingAlert) {
          alerts.unshift({
            id: `drawdown_${agent.id}_${now}`,
            type: 'drawdown',
            severity: drawdown > 25 ? 'critical' : drawdown > 20 ? 'high' : 'medium',
            message: `High drawdown detected for agent ${agent.name}`,
            details: `Current drawdown: ${drawdown.toFixed(2)}% exceeds recommended limit of 15%`,
            agentId: agent.id,
            symbol: null,
            value: drawdown,
            threshold: 15,
            timestamp: now,
            acknowledged: false,
            resolved: false
          })
        }
      }
      
      // Check for position concentration
      const totalValue = portfolio.totalValue
      portfolio.positions.forEach((position: any) => {
        const concentration = (Math.abs(position.marketValue) / totalValue) * 100
        if (concentration > 25) {
          const existingAlert = alerts.find(a => 
            a.type === 'concentration' && 
            a.agentId === agent.id && 
            a.symbol === position.symbol &&
            !a.resolved &&
            (now - a.timestamp) < 3600000
          )
          
          if (!existingAlert) {
            alerts.unshift({
              id: `concentration_${agent.id}_${position.symbol}_${now}`,
              type: 'concentration',
              severity: concentration > 40 ? 'critical' : concentration > 30 ? 'high' : 'medium',
              message: `High position concentration in ${position.symbol}`,
              details: `Position represents ${concentration.toFixed(1)}% of portfolio, exceeding 25% limit`,
              agentId: agent.id,
              symbol: position.symbol,
              value: concentration,
              threshold: 25,
              timestamp: now,
              acknowledged: false,
              resolved: false
            })
          }
        }
      })
      
      // Check for daily loss limits
      const dailyPnL = portfolio.performance.dailyPnL || 0
      if (dailyPnL < -1000) { // $1000 daily loss threshold
        const existingAlert = alerts.find(a => 
          a.type === 'daily_loss' && 
          a.agentId === agent.id && 
          !a.resolved &&
          (now - a.timestamp) < 3600000
        )
        
        if (!existingAlert) {
          alerts.unshift({
            id: `daily_loss_${agent.id}_${now}`,
            type: 'daily_loss',
            severity: dailyPnL < -5000 ? 'critical' : dailyPnL < -2500 ? 'high' : 'medium',
            message: `Daily loss limit approached for agent ${agent.name}`,
            details: `Daily P&L: $${dailyPnL.toFixed(2)} exceeds recommended daily loss limit`,
            agentId: agent.id,
            symbol: null,
            value: Math.abs(dailyPnL),
            threshold: 1000,
            timestamp: now,
            acknowledged: false,
            resolved: false
          })
        }
      }
      
      // Check for margin utilization
      const marginUsed = portfolio.marginUsed || 0
      const marginUtilization = totalValue > 0 ? (marginUsed / totalValue) * 100 : 0
      if (marginUtilization > 70) {
        const existingAlert = alerts.find(a => 
          a.type === 'margin_call' && 
          a.agentId === agent.id && 
          !a.resolved &&
          (now - a.timestamp) < 3600000
        )
        
        if (!existingAlert) {
          alerts.unshift({
            id: `margin_${agent.id}_${now}`,
            type: 'margin_call',
            severity: marginUtilization > 90 ? 'critical' : marginUtilization > 80 ? 'high' : 'medium',
            message: `High margin utilization for agent ${agent.name}`,
            details: `Margin utilization: ${marginUtilization.toFixed(1)}% exceeds 70% threshold`,
            agentId: agent.id,
            symbol: null,
            value: marginUtilization,
            threshold: 70,
            timestamp: now,
            acknowledged: false,
            resolved: false
          })
        }
      }
    }
    
    // Check portfolio-wide risks
    const totalPortfolioValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const totalExposure = agents.reduce((sum, agent) => 
      sum + agent.portfolio.positions.reduce((posSum: number, pos: any) => posSum + Math.abs(pos.marketValue), 0), 0
    )
    
    const leverageRatio = totalPortfolioValue > 0 ? totalExposure / totalPortfolioValue : 0
    if (leverageRatio > 3) {
      const existingAlert = alerts.find(a => 
        a.type === 'leverage' && 
        !a.resolved &&
        (now - a.timestamp) < 3600000
      )
      
      if (!existingAlert) {
        alerts.unshift({
          id: `leverage_${now}`,
          type: 'leverage',
          severity: leverageRatio > 5 ? 'critical' : leverageRatio > 4 ? 'high' : 'medium',
          message: 'Portfolio leverage exceeds recommended levels',
          details: `Current leverage: ${leverageRatio.toFixed(2)}x exceeds 3x recommended limit`,
          agentId: null,
          symbol: null,
          value: leverageRatio,
          threshold: 3,
          timestamp: now,
          acknowledged: false,
          resolved: false
        })
      }
    }
    
  } catch (error) {
    console.error('Error generating risk alerts:', error)
  }
  
  // Sort by timestamp (newest first) and return
  return alerts.sort((a, b) => b.timestamp - a.timestamp)
}