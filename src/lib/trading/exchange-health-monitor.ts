'use client'

import { EventEmitter } from 'events'
import { secureAPIManager, type CredentialHealth } from './secure-api-manager'

/**
 * Exchange Health Monitor
 * Continuously monitors exchange connections, API limits, and performance
 */

export interface ExchangeStatus {
  exchangeId: string
  isOnline: boolean
  responseTime: number
  apiLimitsRemaining: number
  totalApiLimits: number
  lastSuccessfulCall: Date
  consecutiveErrors: number
  maintenanceMode: boolean
  tradingEnabled: boolean
  websocketConnected: boolean
  orderBookHealth: 'healthy' | 'stale' | 'disconnected'
  timestamp: Date
}

export interface ExchangeAlert {
  exchangeId: string
  alertType: 'connection' | 'rate_limit' | 'error' | 'maintenance' | 'performance'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  resolved: boolean
}

export interface HealthMetrics {
  uptime: number // percentage
  averageResponseTime: number
  successRate: number // percentage
  totalRequests: number
  errorRate: number
  maintenanceEvents: number
}

class ExchangeHealthMonitor extends EventEmitter {
  private static instance: ExchangeHealthMonitor
  private exchangeStatus: Map<string, ExchangeStatus> = new Map()
  private alerts: ExchangeAlert[] = []
  private metrics: Map<string, HealthMetrics> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isMonitoring = false

  private constructor() {
    super()
    this.startMonitoring()
  }

  static getInstance(): ExchangeHealthMonitor {
    if (!ExchangeHealthMonitor.instance) {
      ExchangeHealthMonitor.instance = new ExchangeHealthMonitor()
    }
    return ExchangeHealthMonitor.instance
  }

  /**
   * Start monitoring all configured exchanges
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔍 Starting exchange health monitoring...')

    // Monitor each exchange independently
    const exchanges = secureAPIManager.getConfiguredExchanges()
    
    for (const exchangeId of exchanges) {
      await this.startExchangeMonitoring(exchangeId)
    }

    // Start global monitoring tasks
    this.startGlobalMonitoring()
  }

  /**
   * Start monitoring for a specific exchange
   */
  async startExchangeMonitoring(exchangeId: string): Promise<void> {
    console.log(`📊 Starting monitoring for ${exchangeId}`)

    // Initialize status
    await this.updateExchangeStatus(exchangeId)

    // Set up regular health checks
    const interval = setInterval(async () => {
      await this.updateExchangeStatus(exchangeId)
    }, 30000) // Check every 30 seconds

    this.monitoringIntervals.set(exchangeId, interval)
  }

  /**
   * Update status for a specific exchange
   */
  private async updateExchangeStatus(exchangeId: string): Promise<void> {
    const startTime = Date.now()

    try {
      // Test basic connectivity
      const connectivityTest = await this.testExchangeConnectivity(exchangeId)
      
      // Get credential health from API manager
      const credentialHealth = await secureAPIManager.validateCredentials(exchangeId)

      // Test WebSocket connection if available
      const websocketHealth = await this.testWebSocketConnection(exchangeId)

      // Test order book health
      const orderBookHealth = await this.testOrderBookHealth(exchangeId)

      const responseTime = Date.now() - startTime
      const currentStatus = this.exchangeStatus.get(exchangeId)

      const newStatus: ExchangeStatus = {
        exchangeId,
        isOnline: connectivityTest.success && credentialHealth.isValid,
        responseTime,
        apiLimitsRemaining: credentialHealth.rateLimit.limit - credentialHealth.rateLimit.current,
        totalApiLimits: credentialHealth.rateLimit.limit,
        lastSuccessfulCall: connectivityTest.success ? new Date() : currentStatus?.lastSuccessfulCall || new Date(0),
        consecutiveErrors: connectivityTest.success ? 0 : (currentStatus?.consecutiveErrors || 0) + 1,
        maintenanceMode: connectivityTest.maintenanceMode || false,
        tradingEnabled: connectivityTest.tradingEnabled && credentialHealth.isValid,
        websocketConnected: websocketHealth,
        orderBookHealth,
        timestamp: new Date()
      }

      this.exchangeStatus.set(exchangeId, newStatus)
      this.updateMetrics(exchangeId, newStatus, connectivityTest.success)

      // Generate alerts if needed
      this.checkForAlerts(exchangeId, newStatus, currentStatus)

      // Emit status update event
      this.emit('statusUpdate', { exchangeId, status: newStatus })

    } catch (error) {
      console.error(`❌ Failed to update status for ${exchangeId}:`, error)
      
      const errorStatus: ExchangeStatus = {
        exchangeId,
        isOnline: false,
        responseTime: Date.now() - startTime,
        apiLimitsRemaining: 0,
        totalApiLimits: 0,
        lastSuccessfulCall: this.exchangeStatus.get(exchangeId)?.lastSuccessfulCall || new Date(0),
        consecutiveErrors: (this.exchangeStatus.get(exchangeId)?.consecutiveErrors || 0) + 1,
        maintenanceMode: false,
        tradingEnabled: false,
        websocketConnected: false,
        orderBookHealth: 'disconnected',
        timestamp: new Date()
      }

      this.exchangeStatus.set(exchangeId, errorStatus)
      this.updateMetrics(exchangeId, errorStatus, false)
    }
  }

  /**
   * Test basic exchange connectivity
   */
  private async testExchangeConnectivity(exchangeId: string): Promise<{
    success: boolean
    maintenanceMode: boolean
    tradingEnabled: boolean
  }> {
    try {
      let url: string
      
      switch (exchangeId) {
        case 'binance':
          url = 'https://api.binance.com/api/v3/exchangeInfo'
          break
        case 'coinbase':
          url = 'https://api.exchange.coinbase.com/products'
          break
        case 'hyperliquid':
          url = 'https://api.hyperliquid.xyz/info'
          break
        default:
          throw new Error(`Unknown exchange: ${exchangeId}`)
      }

      const response = await fetch(url, {
        method: exchangeId === 'hyperliquid' ? 'POST' : 'GET',
        headers: exchangeId === 'hyperliquid' ? { 'Content-Type': 'application/json' } : {},
        body: exchangeId === 'hyperliquid' ? JSON.stringify({ type: 'meta' }) : undefined,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        if (response.status === 503) {
          return { success: false, maintenanceMode: true, tradingEnabled: false }
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Check for maintenance mode based on exchange-specific indicators
      let maintenanceMode = false
      let tradingEnabled = true

      if (exchangeId === 'binance' && data.symbols) {
        const tradingSymbols = data.symbols.filter((s: any) => s.status === 'TRADING')
        tradingEnabled = tradingSymbols.length > 0
      }

      return { success: true, maintenanceMode, tradingEnabled }

    } catch (error) {
      console.error(`Connectivity test failed for ${exchangeId}:`, error)
      return { success: false, maintenanceMode: false, tradingEnabled: false }
    }
  }

  /**
   * Test WebSocket connection health
   */
  private async testWebSocketConnection(exchangeId: string): Promise<boolean> {
    // This is a simplified test - in production, you'd maintain persistent WebSocket connections
    try {
      let wsUrl: string
      
      switch (exchangeId) {
        case 'binance':
          wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@ticker'
          break
        case 'coinbase':
          wsUrl = 'wss://ws-feed.exchange.coinbase.com'
          break
        case 'hyperliquid':
          wsUrl = 'wss://api.hyperliquid.xyz/ws'
          break
        default:
          return false
      }

      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl)
        const timeout = setTimeout(() => {
          ws.close()
          resolve(false)
        }, 5000)

        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve(true)
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      })
    } catch (error) {
      return false
    }
  }

  /**
   * Test order book health
   */
  private async testOrderBookHealth(exchangeId: string): Promise<'healthy' | 'stale' | 'disconnected'> {
    try {
      let url: string
      
      switch (exchangeId) {
        case 'binance':
          url = 'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5'
          break
        case 'coinbase':
          url = 'https://api.exchange.coinbase.com/products/BTC-USD/book?level=1'
          break
        case 'hyperliquid':
          url = 'https://api.hyperliquid.xyz/info'
          break
        default:
          return 'disconnected'
      }

      const response = await fetch(url, {
        method: exchangeId === 'hyperliquid' ? 'POST' : 'GET',
        headers: exchangeId === 'hyperliquid' ? { 'Content-Type': 'application/json' } : {},
        body: exchangeId === 'hyperliquid' ? JSON.stringify({ type: 'l2Book', coin: 'BTC' }) : undefined,
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        return 'disconnected'
      }

      const data = await response.json()
      
      // Check if order book has valid bid/ask data
      if (exchangeId === 'binance') {
        return (data.bids?.length > 0 && data.asks?.length > 0) ? 'healthy' : 'stale'
      } else if (exchangeId === 'coinbase') {
        return (data.bids?.length > 0 && data.asks?.length > 0) ? 'healthy' : 'stale'
      } else if (exchangeId === 'hyperliquid') {
        return (data.levels && data.levels.length > 0) ? 'healthy' : 'stale'
      }

      return 'healthy'
    } catch (error) {
      return 'disconnected'
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(exchangeId: string, status: ExchangeStatus, success: boolean): void {
    const current = this.metrics.get(exchangeId) || {
      uptime: 100,
      averageResponseTime: 0,
      successRate: 100,
      totalRequests: 0,
      errorRate: 0,
      maintenanceEvents: 0
    }

    const updated: HealthMetrics = {
      uptime: success ? Math.min(100, current.uptime + 0.1) : Math.max(0, current.uptime - 1),
      averageResponseTime: (current.averageResponseTime * current.totalRequests + status.responseTime) / (current.totalRequests + 1),
      successRate: ((current.successRate * current.totalRequests) + (success ? 100 : 0)) / (current.totalRequests + 1),
      totalRequests: current.totalRequests + 1,
      errorRate: success ? Math.max(0, current.errorRate - 0.1) : Math.min(100, current.errorRate + 1),
      maintenanceEvents: status.maintenanceMode && !current.uptime ? current.maintenanceEvents + 1 : current.maintenanceEvents
    }

    this.metrics.set(exchangeId, updated)
  }

  /**
   * Check for alert conditions
   */
  private checkForAlerts(exchangeId: string, newStatus: ExchangeStatus, previousStatus?: ExchangeStatus): void {
    const alerts: ExchangeAlert[] = []

    // Connection alerts
    if (!newStatus.isOnline && previousStatus?.isOnline) {
      alerts.push({
        exchangeId,
        alertType: 'connection',
        severity: 'error',
        message: `${exchangeId} exchange connection lost`,
        timestamp: new Date(),
        resolved: false
      })
    }

    // Rate limiting alerts
    if (newStatus.apiLimitsRemaining < newStatus.totalApiLimits * 0.1) {
      alerts.push({
        exchangeId,
        alertType: 'rate_limit',
        severity: newStatus.apiLimitsRemaining < newStatus.totalApiLimits * 0.05 ? 'critical' : 'warning',
        message: `${exchangeId} API rate limit usage at ${Math.round((1 - newStatus.apiLimitsRemaining / newStatus.totalApiLimits) * 100)}%`,
        timestamp: new Date(),
        resolved: false
      })
    }

    // Performance alerts
    if (newStatus.responseTime > 5000) {
      alerts.push({
        exchangeId,
        alertType: 'performance',
        severity: newStatus.responseTime > 10000 ? 'error' : 'warning',
        message: `${exchangeId} response time is ${newStatus.responseTime}ms`,
        timestamp: new Date(),
        resolved: false
      })
    }

    // Consecutive error alerts
    if (newStatus.consecutiveErrors >= 5) {
      alerts.push({
        exchangeId,
        alertType: 'error',
        severity: newStatus.consecutiveErrors >= 10 ? 'critical' : 'error',
        message: `${exchangeId} has ${newStatus.consecutiveErrors} consecutive errors`,
        timestamp: new Date(),
        resolved: false
      })
    }

    // Add new alerts
    for (const alert of alerts) {
      this.alerts.push(alert)
      this.emit('alert', alert)
      console.log(`🚨 Alert: ${alert.severity.toUpperCase()} - ${alert.message}`)
    }
  }

  /**
   * Start global monitoring tasks
   */
  private startGlobalMonitoring(): void {
    // Clean up old alerts (resolved alerts older than 1 hour)
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 3600000)
      this.alerts = this.alerts.filter(alert => 
        !alert.resolved || alert.timestamp > oneHourAgo
      )
    }, 300000) // Every 5 minutes

    // Generate health summary
    setInterval(() => {
      this.emit('healthSummary', this.getHealthSummary())
    }, 60000) // Every minute
  }

  /**
   * Get current status for all exchanges
   */
  getAllStatus(): Map<string, ExchangeStatus> {
    return new Map(this.exchangeStatus)
  }

  /**
   * Get status for specific exchange
   */
  getExchangeStatus(exchangeId: string): ExchangeStatus | undefined {
    return this.exchangeStatus.get(exchangeId)
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): ExchangeAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Get metrics for all exchanges
   */
  getAllMetrics(): Map<string, HealthMetrics> {
    return new Map(this.metrics)
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    totalExchanges: number
    onlineExchanges: number
    activeAlerts: number
    averageResponseTime: number
    overallHealth: 'healthy' | 'degraded' | 'unhealthy'
  } {
    const statuses = Array.from(this.exchangeStatus.values())
    const activeAlerts = this.getActiveAlerts()
    
    const totalExchanges = statuses.length
    const onlineExchanges = statuses.filter(s => s.isOnline).length
    const averageResponseTime = statuses.reduce((sum, s) => sum + s.responseTime, 0) / Math.max(totalExchanges, 1)
    
    let overallHealth: 'healthy' | 'degraded' | 'unhealthy'
    
    if (onlineExchanges === totalExchanges && activeAlerts.length === 0) {
      overallHealth = 'healthy'
    } else if (onlineExchanges >= totalExchanges * 0.5) {
      overallHealth = 'degraded'
    } else {
      overallHealth = 'unhealthy'
    }

    return {
      totalExchanges,
      onlineExchanges,
      activeAlerts: activeAlerts.length,
      averageResponseTime,
      overallHealth
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alertIndex = this.alerts.findIndex(alert => 
      `${alert.exchangeId}-${alert.timestamp.getTime()}` === alertId
    )
    
    if (alertIndex !== -1) {
      this.alerts[alertIndex].resolved = true
      this.emit('alertResolved', this.alerts[alertIndex])
      return true
    }
    
    return false
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    
    this.monitoringIntervals.clear()
    console.log('🛑 Exchange health monitoring stopped')
  }
}

export const exchangeHealthMonitor = ExchangeHealthMonitor.getInstance()
export default exchangeHealthMonitor