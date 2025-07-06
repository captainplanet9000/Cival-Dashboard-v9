'use client'

import { EventEmitter } from 'events'
import { liveMarketDataService } from '@/lib/market/live-market-data-service'
import { exchangeAPIService } from '@/lib/trading/exchange-api-service'
import { productionRiskManager } from '@/lib/risk/production-risk-manager'
import { operationalManager } from '@/lib/infrastructure/operational-manager'
import { hftExecutionEngine } from '@/lib/trading/hft-execution-engine'
import { multiAgentCoordinator } from '@/lib/coordination/multi-agent-coordinator'

export interface DataSource {
  id: string
  name: string
  type: 'market_data' | 'trading' | 'risk' | 'operational' | 'coordination'
  status: 'connected' | 'disconnected' | 'error' | 'degraded'
  lastUpdate: Date
  errorCount: number
  healthScore: number
}

export interface DataIntegrationConfig {
  retryAttempts: number
  retryDelay: number
  timeoutMs: number
  circuitBreakerThreshold: number
  healthCheckInterval: number
  dataValidationEnabled: boolean
  compressionEnabled: boolean
  encryptionEnabled: boolean
}

export interface IntegrationMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  errorRate: number
  uptime: number
  dataVolume: number
  lastUpdated: Date
}

export interface DataValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedData?: any
}

export class DataIntegrationManager extends EventEmitter {
  private dataSources = new Map<string, DataSource>()
  private integrationConfig: DataIntegrationConfig
  private metrics: IntegrationMetrics
  private circuitBreakers = new Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>()
  private healthCheckInterval?: NodeJS.Timeout
  private retryQueues = new Map<string, any[]>()
  private isInitialized = false

  constructor(config?: Partial<DataIntegrationConfig>) {
    super()
    
    this.integrationConfig = {
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutMs: 5000,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      dataValidationEnabled: true,
      compressionEnabled: false,
      encryptionEnabled: false,
      ...config
    }

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      uptime: 0,
      dataVolume: 0,
      lastUpdated: new Date()
    }

    this.initializeDataSources()
    this.startHealthMonitoring()
  }

  private initializeDataSources() {
    // Register all data sources
    this.registerDataSource({
      id: 'live_market_data',
      name: 'Live Market Data',
      type: 'market_data',
      status: 'disconnected',
      lastUpdate: new Date(),
      errorCount: 0,
      healthScore: 100
    })

    this.registerDataSource({
      id: 'exchange_api',
      name: 'Exchange API',
      type: 'trading',
      status: 'disconnected',
      lastUpdate: new Date(),
      errorCount: 0,
      healthScore: 100
    })

    this.registerDataSource({
      id: 'risk_manager',
      name: 'Risk Manager',
      type: 'risk',
      status: 'disconnected',
      lastUpdate: new Date(),
      errorCount: 0,
      healthScore: 100
    })

    this.registerDataSource({
      id: 'operational_manager',
      name: 'Operational Manager',
      type: 'operational',
      status: 'disconnected',
      lastUpdate: new Date(),
      errorCount: 0,
      healthScore: 100
    })

    this.registerDataSource({
      id: 'hft_engine',
      name: 'HFT Execution Engine',
      type: 'trading',
      status: 'disconnected',
      lastUpdate: new Date(),
      errorCount: 0,
      healthScore: 100
    })

    this.registerDataSource({
      id: 'multi_agent_coordinator',
      name: 'Multi-Agent Coordinator',
      type: 'coordination',
      status: 'disconnected',
      lastUpdate: new Date(),
      errorCount: 0,
      healthScore: 100
    })

    console.log('📊 Data Integration Manager: Initialized with', this.dataSources.size, 'data sources')
  }

  private registerDataSource(source: DataSource) {
    this.dataSources.set(source.id, source)
    this.circuitBreakers.set(source.id, { failures: 0, lastFailure: new Date(), isOpen: false })
    this.retryQueues.set(source.id, [])
  }

  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, this.integrationConfig.healthCheckInterval)

    console.log('🔍 Data Integration Manager: Health monitoring started')
  }

  private async performHealthChecks() {
    try {
      for (const [sourceId, source] of this.dataSources) {
        await this.checkDataSourceHealth(sourceId)
      }
      
      this.updateMetrics()
      this.emit('healthCheckCompleted', this.getSystemHealth())

    } catch (error) {
      console.error('Health check error:', error)
      this.emit('healthCheckError', error)
    }
  }

  private async checkDataSourceHealth(sourceId: string): Promise<void> {
    const source = this.dataSources.get(sourceId)
    if (!source) return

    const startTime = Date.now()
    let newStatus: DataSource['status'] = 'connected'
    let healthScore = 100

    try {
      switch (sourceId) {
        case 'live_market_data':
          const isMarketDataConnected = liveMarketDataService.isConnected()
          newStatus = isMarketDataConnected ? 'connected' : 'disconnected'
          healthScore = isMarketDataConnected ? 100 : 0
          break

        case 'exchange_api':
          const exchanges = exchangeAPIService.getConfiguredExchanges()
          if (exchanges.length === 0) {
            newStatus = 'disconnected'
            healthScore = 0
          } else {
            // Test connectivity to first exchange
            const isConnected = await exchangeAPIService.testConnectivity(exchanges[0])
            newStatus = isConnected ? 'connected' : 'error'
            healthScore = isConnected ? 100 : 20
          }
          break

        case 'risk_manager':
          const riskHealth = productionRiskManager.getSystemHealth()
          newStatus = riskHealth.isHealthy ? 'connected' : 'degraded'
          healthScore = riskHealth.isHealthy ? 100 : 60
          break

        case 'operational_manager':
          const isOperational = operationalManager.isSystemOperational()
          newStatus = isOperational ? 'connected' : 'degraded'
          healthScore = isOperational ? 100 : 40
          break

        case 'hft_engine':
          const executionMetrics = hftExecutionEngine.getExecutionMetrics()
          const isHftHealthy = executionMetrics.fillRate > 80 && executionMetrics.rejectionRate < 10
          newStatus = isHftHealthy ? 'connected' : 'degraded'
          healthScore = isHftHealthy ? 100 : Math.max(20, 100 - executionMetrics.rejectionRate * 5)
          break

        case 'multi_agent_coordinator':
          const coordinationStats = multiAgentCoordinator.getRegisteredAgents()
          newStatus = coordinationStats.length > 0 ? 'connected' : 'disconnected'
          healthScore = coordinationStats.length > 0 ? 100 : 0
          break

        default:
          newStatus = 'error'
          healthScore = 0
      }

      const responseTime = Date.now() - startTime
      
      // Update source status
      source.status = newStatus
      source.lastUpdate = new Date()
      source.healthScore = healthScore
      
      if (newStatus === 'error') {
        source.errorCount++
        this.handleDataSourceError(sourceId, new Error(`Health check failed`))
      } else {
        // Reset error count on successful check
        source.errorCount = Math.max(0, source.errorCount - 1)
        this.resetCircuitBreaker(sourceId)
      }

      this.dataSources.set(sourceId, source)

    } catch (error) {
      console.error(`Health check failed for ${sourceId}:`, error)
      source.status = 'error'
      source.errorCount++
      source.healthScore = 0
      this.dataSources.set(sourceId, source)
      this.handleDataSourceError(sourceId, error as Error)
    }
  }

  // Data retrieval with error handling and retries
  async retrieveData<T>(
    sourceId: string, 
    operation: () => Promise<T>, 
    options?: {
      retries?: number
      timeout?: number
      validate?: boolean
    }
  ): Promise<T | null> {
    
    const source = this.dataSources.get(sourceId)
    if (!source) {
      throw new Error(`Unknown data source: ${sourceId}`)
    }

    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(sourceId)!
    if (circuitBreaker.isOpen) {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure.getTime()
      if (timeSinceLastFailure < 60000) { // 1 minute circuit breaker
        console.warn(`Circuit breaker open for ${sourceId}, skipping request`)
        return null
      } else {
        // Reset circuit breaker after timeout
        this.resetCircuitBreaker(sourceId)
      }
    }

    const maxRetries = options?.retries ?? this.integrationConfig.retryAttempts
    const timeout = options?.timeout ?? this.integrationConfig.timeoutMs
    const shouldValidate = options?.validate ?? this.integrationConfig.dataValidationEnabled

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.metrics.totalRequests++
        const startTime = Date.now()

        // Execute operation with timeout
        const data = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ])

        const responseTime = Date.now() - startTime
        this.updateResponseTimeMetrics(responseTime)

        // Validate data if enabled
        if (shouldValidate) {
          const validationResult = this.validateData(data)
          if (!validationResult.isValid) {
            throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`)
          }
        }

        this.metrics.successfulRequests++
        source.lastUpdate = new Date()
        source.status = 'connected'
        this.dataSources.set(sourceId, source)

        return data

      } catch (error) {
        lastError = error as Error
        this.metrics.failedRequests++
        
        console.warn(`Data retrieval attempt ${attempt + 1} failed for ${sourceId}:`, error)

        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.integrationConfig.retryDelay * (attempt + 1)))
        } else {
          // Max retries exceeded
          this.handleDataSourceError(sourceId, lastError)
        }
      }
    }

    return null
  }

  // Data validation
  private validateData(data: any): DataValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Basic validation checks
      if (data === null || data === undefined) {
        errors.push('Data is null or undefined')
        return { isValid: false, errors, warnings }
      }

      // Type-specific validation
      if (typeof data === 'object') {
        if (Array.isArray(data)) {
          if (data.length === 0) {
            warnings.push('Empty array returned')
          }
        } else {
          // Validate object structure
          if (Object.keys(data).length === 0) {
            warnings.push('Empty object returned')
          }
        }
      }

      // Market data specific validation
      if (data.price !== undefined) {
        if (typeof data.price !== 'number' || data.price <= 0) {
          errors.push('Invalid price data')
        }
      }

      // Timestamp validation
      if (data.timestamp) {
        const timestamp = new Date(data.timestamp)
        const now = new Date()
        const timeDiff = Math.abs(now.getTime() - timestamp.getTime())
        
        if (timeDiff > 300000) { // 5 minutes
          warnings.push('Data timestamp is more than 5 minutes old')
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`)
      return { isValid: false, errors, warnings }
    }
  }

  // Error handling
  private handleDataSourceError(sourceId: string, error: Error) {
    const circuitBreaker = this.circuitBreakers.get(sourceId)!
    circuitBreaker.failures++
    circuitBreaker.lastFailure = new Date()

    if (circuitBreaker.failures >= this.integrationConfig.circuitBreakerThreshold) {
      circuitBreaker.isOpen = true
      console.warn(`🔴 Circuit breaker opened for ${sourceId} after ${circuitBreaker.failures} failures`)
      this.emit('circuitBreakerOpened', sourceId)
    }

    const source = this.dataSources.get(sourceId)!
    source.status = 'error'
    source.errorCount++
    this.dataSources.set(sourceId, source)

    this.emit('dataSourceError', { sourceId, error, source })
  }

  private resetCircuitBreaker(sourceId: string) {
    const circuitBreaker = this.circuitBreakers.get(sourceId)!
    if (circuitBreaker.isOpen || circuitBreaker.failures > 0) {
      circuitBreaker.failures = 0
      circuitBreaker.isOpen = false
      console.log(`✅ Circuit breaker reset for ${sourceId}`)
      this.emit('circuitBreakerReset', sourceId)
    }
  }

  // Metrics updates
  private updateResponseTimeMetrics(responseTime: number) {
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2
  }

  private updateMetrics() {
    this.metrics.errorRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0
    
    const connectedSources = Array.from(this.dataSources.values()).filter(s => s.status === 'connected').length
    this.metrics.uptime = (connectedSources / this.dataSources.size) * 100
    
    this.metrics.lastUpdated = new Date()
  }

  // Public API methods
  getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values())
  }

  getDataSource(sourceId: string): DataSource | undefined {
    return this.dataSources.get(sourceId)
  }

  getIntegrationMetrics(): IntegrationMetrics {
    return { ...this.metrics }
  }

  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical'
    score: number
    sources: DataSource[]
    issues: string[]
  } {
    const sources = Array.from(this.dataSources.values())
    const avgHealthScore = sources.reduce((sum, s) => sum + s.healthScore, 0) / sources.length
    
    const connectedCount = sources.filter(s => s.status === 'connected').length
    const errorCount = sources.filter(s => s.status === 'error').length
    const degradedCount = sources.filter(s => s.status === 'degraded').length

    const issues: string[] = []
    
    if (errorCount > 0) {
      issues.push(`${errorCount} data sources in error state`)
    }
    if (degradedCount > 0) {
      issues.push(`${degradedCount} data sources degraded`)
    }
    if (this.metrics.errorRate > 10) {
      issues.push(`High error rate: ${this.metrics.errorRate.toFixed(1)}%`)
    }

    let overall: 'healthy' | 'degraded' | 'critical'
    if (avgHealthScore >= 90 && errorCount === 0) {
      overall = 'healthy'
    } else if (avgHealthScore >= 60 && errorCount <= 1) {
      overall = 'degraded'
    } else {
      overall = 'critical'
    }

    return {
      overall,
      score: avgHealthScore,
      sources,
      issues
    }
  }

  // Force refresh all data sources
  async refreshAllSources(): Promise<void> {
    console.log('🔄 Forcing refresh of all data sources')
    await this.performHealthChecks()
  }

  // Reset all circuit breakers
  resetAllCircuitBreakers(): void {
    for (const sourceId of this.circuitBreakers.keys()) {
      this.resetCircuitBreaker(sourceId)
    }
    console.log('🔄 All circuit breakers reset')
  }

  // Update configuration
  updateConfig(newConfig: Partial<DataIntegrationConfig>): void {
    this.integrationConfig = { ...this.integrationConfig, ...newConfig }
    console.log('⚙️ Data integration configuration updated')
  }

  // Cleanup
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    console.log('🛑 Data Integration Manager stopped')
    this.emit('stopped')
  }
}

// Error types
export class DataIntegrationError extends Error {
  constructor(
    message: string,
    public sourceId: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DataIntegrationError'
  }
}

export class CircuitBreakerError extends Error {
  constructor(public sourceId: string) {
    super(`Circuit breaker is open for data source: ${sourceId}`)
    this.name = 'CircuitBreakerError'
  }
}

export class DataValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: string[]
  ) {
    super(message)
    this.name = 'DataValidationError'
  }
}

// Singleton instance
export const dataIntegrationManager = new DataIntegrationManager()