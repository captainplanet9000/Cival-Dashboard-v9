'use client'

import { EventEmitter } from 'events'

export interface RiskLimits {
  // Portfolio limits
  maxPortfolioValue: number
  maxDailyLoss: number
  maxDrawdown: number
  maxConcentration: number // Max % in single asset
  
  // Position limits
  maxPositionSize: number
  maxPositionsPerSymbol: number
  maxOpenPositions: number
  
  // Trading limits
  maxDailyTrades: number
  maxOrderValue: number
  maxLeverage: number
  
  // Time-based limits
  tradingHours: { start: string; end: string }
  allowWeekends: boolean
  
  // Volatility limits
  maxVolatility: number
  correlationThreshold: number
}

export interface RiskAlert {
  id: string
  type: 'warning' | 'critical' | 'emergency'
  category: 'position' | 'portfolio' | 'market' | 'system'
  message: string
  agentId?: string
  symbol?: string
  currentValue: number
  limitValue: number
  timestamp: Date
  acknowledged: boolean
}

export interface MarketCondition {
  symbol: string
  volatility: number
  trend: 'bullish' | 'bearish' | 'sideways'
  volume: number
  correlations: { [symbol: string]: number }
  timestamp: Date
}

export interface SystemHealth {
  isHealthy: boolean
  uptime: number
  memoryUsage: number
  apiLatency: number
  dbConnectionStatus: boolean
  exchangeConnections: { [exchange: string]: boolean }
  lastCheck: Date
}

export class ProductionRiskManager extends EventEmitter {
  private globalLimits: RiskLimits
  private agentLimits = new Map<string, RiskLimits>()
  private activeAlerts = new Map<string, RiskAlert>()
  private marketConditions = new Map<string, MarketCondition>()
  private systemHealth: SystemHealth
  private emergencyStop = false
  private riskCheckInterval?: NodeJS.Timeout
  private healthCheckInterval?: NodeJS.Timeout

  constructor(globalLimits: RiskLimits) {
    super()
    this.globalLimits = globalLimits
    this.systemHealth = {
      isHealthy: true,
      uptime: 0,
      memoryUsage: 0,
      apiLatency: 0,
      dbConnectionStatus: true,
      exchangeConnections: {},
      lastCheck: new Date()
    }
    this.startMonitoring()
  }

  // Initialize monitoring
  private startMonitoring() {
    // Real-time risk checks every 5 seconds
    this.riskCheckInterval = setInterval(() => {
      this.performRiskChecks()
    }, 5000)

    // System health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, 30000)

    console.log('🛡️ Production Risk Manager: Monitoring started')
  }

  // Set agent-specific risk limits
  setAgentLimits(agentId: string, limits: RiskLimits) {
    this.agentLimits.set(agentId, limits)
    console.log(`🛡️ Risk limits set for agent ${agentId}`)
  }

  // Pre-trade risk check
  async checkPreTrade(agentId: string, order: {
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    portfolio: any
  }): Promise<{ allowed: boolean; reason?: string; risk: 'low' | 'medium' | 'high' }> {
    
    // Emergency stop check
    if (this.emergencyStop) {
      return { allowed: false, reason: 'Emergency stop activated', risk: 'high' }
    }

    // System health check
    if (!this.systemHealth.isHealthy) {
      return { allowed: false, reason: 'System health compromised', risk: 'high' }
    }

    // Market conditions check
    const marketCondition = this.marketConditions.get(order.symbol)
    if (marketCondition && marketCondition.volatility > this.globalLimits.maxVolatility) {
      return { allowed: false, reason: 'Market volatility too high', risk: 'high' }
    }

    // Trading hours check
    if (!this.isWithinTradingHours()) {
      return { allowed: false, reason: 'Outside trading hours', risk: 'medium' }
    }

    // Agent-specific limits
    const agentLimits = this.agentLimits.get(agentId) || this.globalLimits
    const orderValue = order.quantity * order.price

    // Order value check
    if (orderValue > agentLimits.maxOrderValue) {
      return { allowed: false, reason: 'Order value exceeds limit', risk: 'high' }
    }

    // Daily trades check
    const dailyTrades = this.getDailyTradeCount(agentId)
    if (dailyTrades >= agentLimits.maxDailyTrades) {
      return { allowed: false, reason: 'Daily trade limit reached', risk: 'medium' }
    }

    // Portfolio concentration check
    const concentration = this.calculateConcentration(order.portfolio, order.symbol, orderValue)
    if (concentration > agentLimits.maxConcentration) {
      return { allowed: false, reason: 'Portfolio concentration too high', risk: 'high' }
    }

    // Position size check
    const currentPosition = this.getCurrentPosition(order.portfolio, order.symbol)
    const newPositionSize = order.side === 'buy' ? 
      currentPosition + orderValue : 
      Math.abs(currentPosition - orderValue)

    if (newPositionSize > agentLimits.maxPositionSize) {
      return { allowed: false, reason: 'Position size limit exceeded', risk: 'high' }
    }

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(order, agentLimits, marketCondition)

    return { allowed: true, risk: riskLevel }
  }

  // Post-trade risk monitoring
  async monitorPostTrade(agentId: string, trade: {
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    portfolio: any
  }) {
    const agentLimits = this.agentLimits.get(agentId) || this.globalLimits
    
    // Check for drawdown alerts
    const drawdown = this.calculateDrawdown(trade.portfolio)
    if (drawdown > agentLimits.maxDrawdown * 0.8) {
      this.createAlert({
        type: 'warning',
        category: 'portfolio',
        message: `Agent ${agentId} approaching max drawdown: ${drawdown.toFixed(2)}%`,
        agentId,
        currentValue: drawdown,
        limitValue: agentLimits.maxDrawdown
      })
    }

    // Check for daily loss alerts
    const dailyPnL = this.calculateDailyPnL(trade.portfolio)
    if (dailyPnL < -agentLimits.maxDailyLoss * 0.8) {
      this.createAlert({
        type: 'critical',
        category: 'portfolio',
        message: `Agent ${agentId} approaching daily loss limit: $${dailyPnL.toFixed(2)}`,
        agentId,
        currentValue: Math.abs(dailyPnL),
        limitValue: agentLimits.maxDailyLoss
      })
    }

    // Correlation monitoring
    await this.updateCorrelations(trade.symbol)
  }

  // Real-time risk monitoring
  private async performRiskChecks() {
    try {
      // Check all active agents
      for (const [agentId, limits] of this.agentLimits) {
        await this.checkAgentRisk(agentId, limits)
      }

      // Check market conditions
      await this.updateMarketConditions()

      // Check for system-wide risks
      await this.checkSystemWideRisks()

    } catch (error) {
      console.error('Error in risk checks:', error)
      this.createAlert({
        type: 'critical',
        category: 'system',
        message: 'Risk monitoring system error',
        currentValue: 0,
        limitValue: 0
      })
    }
  }

  // System health monitoring
  private async performHealthCheck() {
    try {
      const startTime = Date.now()
      
      // Check memory usage
      if (typeof window !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory
        this.systemHealth.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }

      // Check API latency (mock for now)
      const apiLatency = Date.now() - startTime
      this.systemHealth.apiLatency = apiLatency

      // Check database connections (mock for now)
      this.systemHealth.dbConnectionStatus = true

      // Update uptime
      this.systemHealth.uptime = Date.now() - (this.systemHealth.lastCheck.getTime() - 30000)
      this.systemHealth.lastCheck = new Date()

      // Determine overall health
      this.systemHealth.isHealthy = 
        this.systemHealth.memoryUsage < 0.9 &&
        this.systemHealth.apiLatency < 5000 &&
        this.systemHealth.dbConnectionStatus

      if (!this.systemHealth.isHealthy) {
        this.createAlert({
          type: 'critical',
          category: 'system',
          message: 'System health degraded',
          currentValue: this.systemHealth.memoryUsage,
          limitValue: 0.9
        })
      }

    } catch (error) {
      console.error('Health check error:', error)
      this.systemHealth.isHealthy = false
    }
  }

  // Emergency stop mechanism
  activateEmergencyStop(reason: string) {
    this.emergencyStop = true
    this.createAlert({
      type: 'emergency',
      category: 'system',
      message: `Emergency stop activated: ${reason}`,
      currentValue: 1,
      limitValue: 0
    })
    
    this.emit('emergencyStop', reason)
    console.log('🚨 EMERGENCY STOP ACTIVATED:', reason)
  }

  deactivateEmergencyStop() {
    this.emergencyStop = false
    console.log('✅ Emergency stop deactivated')
  }

  // Helper methods
  private isWithinTradingHours(): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const startTime = parseInt(this.globalLimits.tradingHours.start.replace(':', ''))
    const endTime = parseInt(this.globalLimits.tradingHours.end.replace(':', ''))
    
    // Check weekend trading
    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    if (isWeekend && !this.globalLimits.allowWeekends) {
      return false
    }

    return currentTime >= startTime && currentTime <= endTime
  }

  private calculateConcentration(portfolio: any, symbol: string, orderValue: number): number {
    const totalValue = portfolio.totalValue || 100000
    const currentSymbolValue = portfolio.positions
      ?.filter((p: any) => p.symbol === symbol)
      ?.reduce((sum: number, p: any) => sum + p.marketValue, 0) || 0
    
    return ((currentSymbolValue + orderValue) / totalValue) * 100
  }

  private getCurrentPosition(portfolio: any, symbol: string): number {
    return portfolio.positions
      ?.filter((p: any) => p.symbol === symbol)
      ?.reduce((sum: number, p: any) => sum + p.marketValue, 0) || 0
  }

  private calculateDrawdown(portfolio: any): number {
    const peak = portfolio.performance?.peakValue || portfolio.totalValue
    const current = portfolio.totalValue
    return ((peak - current) / peak) * 100
  }

  private calculateDailyPnL(portfolio: any): number {
    const dailyReturns = portfolio.performance?.dailyReturns || []
    const today = dailyReturns[dailyReturns.length - 1]
    return today ? today.return * portfolio.totalValue : 0
  }

  private getDailyTradeCount(agentId: string): number {
    // Mock implementation - would track actual trades
    return Math.floor(Math.random() * 10)
  }

  private calculateRiskLevel(
    order: any, 
    limits: RiskLimits, 
    marketCondition?: MarketCondition
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0
    
    // Order size risk
    const orderValueRatio = (order.quantity * order.price) / limits.maxOrderValue
    riskScore += orderValueRatio * 30
    
    // Market volatility risk
    if (marketCondition) {
      riskScore += (marketCondition.volatility / limits.maxVolatility) * 40
    }
    
    // Time-based risk
    const now = new Date()
    const isMarketOpen = this.isWithinTradingHours()
    if (!isMarketOpen) riskScore += 30
    
    if (riskScore >= 70) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
  }

  private async checkAgentRisk(agentId: string, limits: RiskLimits) {
    // Mock implementation - would check actual agent portfolio
  }

  private async updateMarketConditions() {
    // Mock implementation - would update from live market data
  }

  private async checkSystemWideRisks() {
    // Mock implementation - would check global portfolio exposure
  }

  private async updateCorrelations(symbol: string) {
    // Mock implementation - would calculate correlations
  }

  private createAlert(alert: Omit<RiskAlert, 'id' | 'timestamp' | 'acknowledged'>) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullAlert: RiskAlert = {
      ...alert,
      id: alertId,
      timestamp: new Date(),
      acknowledged: false
    }
    
    this.activeAlerts.set(alertId, fullAlert)
    this.emit('riskAlert', fullAlert)
    
    console.log(`🚨 Risk Alert [${alert.type.toUpperCase()}]: ${alert.message}`)
  }

  // Public API methods
  getActiveAlerts(): RiskAlert[] {
    return Array.from(this.activeAlerts.values())
  }

  acknowledgeAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      this.activeAlerts.set(alertId, alert)
    }
  }

  getSystemHealth(): SystemHealth {
    return this.systemHealth
  }

  isEmergencyStopActive(): boolean {
    return this.emergencyStop
  }

  getGlobalLimits(): RiskLimits {
    return this.globalLimits
  }

  updateGlobalLimits(limits: Partial<RiskLimits>) {
    this.globalLimits = { ...this.globalLimits, ...limits }
    console.log('🛡️ Global risk limits updated')
  }

  // Cleanup
  stop() {
    if (this.riskCheckInterval) {
      clearInterval(this.riskCheckInterval)
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    console.log('🛡️ Production Risk Manager: Monitoring stopped')
  }
}

// Default production risk limits
export const defaultProductionLimits: RiskLimits = {
  maxPortfolioValue: 1000000, // $1M
  maxDailyLoss: 50000, // $50K
  maxDrawdown: 20, // 20%
  maxConcentration: 25, // 25% max in single asset
  maxPositionSize: 100000, // $100K per position
  maxPositionsPerSymbol: 3,
  maxOpenPositions: 20,
  maxDailyTrades: 100,
  maxOrderValue: 50000, // $50K per order
  maxLeverage: 3,
  tradingHours: { start: '09:30', end: '16:00' },
  allowWeekends: false,
  maxVolatility: 0.05, // 5%
  correlationThreshold: 0.8
}

// Singleton instance
export const productionRiskManager = new ProductionRiskManager(defaultProductionLimits)