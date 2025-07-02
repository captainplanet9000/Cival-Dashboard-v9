// Enhanced Backend Client - Premium API Integration Layer
// Preserves ALL existing functionality from backend-client.ts (1,966 lines)
// Adds premium features: caching, retry logic, performance monitoring

import { createClient } from '@supabase/supabase-js'

// ===== ENHANCED CLIENT CONFIGURATION =====

interface EnhancedClientConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  cacheEnabled: boolean
  cacheTTL: number
  performanceMonitoring: boolean
  debugMode: boolean
}

const DEFAULT_CONFIG: EnhancedClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 30000, // 30 seconds
  performanceMonitoring: true,
  debugMode: process.env.NODE_ENV === 'development'
}

// ===== CACHE MANAGEMENT =====

class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = DEFAULT_CONFIG.cacheTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// ===== PERFORMANCE MONITORING =====

interface PerformanceMetric {
  endpoint: string
  method: string
  duration: number
  timestamp: Date
  success: boolean
  cached: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageResponseTime(endpoint?: string): number {
    const filtered = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics

    if (filtered.length === 0) return 0
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0)
    return total / filtered.length
  }

  getSuccessRate(endpoint?: string): number {
    const filtered = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics

    if (filtered.length === 0) return 0
    
    const successful = filtered.filter(m => m.success).length
    return (successful / filtered.length) * 100
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0
    
    const cached = this.metrics.filter(m => m.cached).length
    return (cached / this.metrics.length) * 100
  }
}

// ===== ENHANCED BACKEND CLIENT CLASS =====

export class EnhancedBackendClient {
  private config: EnhancedClientConfig
  private cache: APICache
  private performanceMonitor: PerformanceMonitor
  private supabase: any

  constructor(config?: Partial<EnhancedClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.cache = new APICache()
    this.performanceMonitor = new PerformanceMonitor()
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
  }

  // ===== CORE REQUEST METHOD WITH ENHANCEMENTS =====

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    const startTime = performance.now()
    const method = options.method || 'GET'
    let cached = false

    try {
      // Check cache for GET requests
      if (method === 'GET' && this.config.cacheEnabled && cacheKey) {
        const cachedData = this.cache.get(cacheKey)
        if (cachedData) {
          cached = true
          if (this.config.performanceMonitoring) {
            this.performanceMonitor.recordMetric({
              endpoint,
              method,
              duration: performance.now() - startTime,
              timestamp: new Date(),
              success: true,
              cached: true
            })
          }
          return cachedData
        }
      }

      // Make the actual request with retry logic
      const response = await this.makeRequestWithRetry(endpoint, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache GET requests
      if (method === 'GET' && this.config.cacheEnabled && cacheKey) {
        this.cache.set(cacheKey, data, cacheTTL || this.config.cacheTTL)
      }

      // Record performance metric
      if (this.config.performanceMonitoring) {
        this.performanceMonitor.recordMetric({
          endpoint,
          method,
          duration: performance.now() - startTime,
          timestamp: new Date(),
          success: true,
          cached: false
        })
      }

      return data

    } catch (error) {
      // Record failed metric
      if (this.config.performanceMonitoring) {
        this.performanceMonitor.recordMetric({
          endpoint,
          method,
          duration: performance.now() - startTime,
          timestamp: new Date(),
          success: false,
          cached: false
        })
      }

      if (this.config.debugMode) {
        console.error(`API Request failed: ${method} ${endpoint}`, error)
      }

      throw error
    }
  }

  private async makeRequestWithRetry(
    endpoint: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const url = `${this.config.baseURL}${endpoint}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)
      return response

    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        if (this.config.debugMode) {
          console.warn(`Request failed, retrying (${attempt}/${this.config.retryAttempts}):`, error)
        }
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt))
        return this.makeRequestWithRetry(endpoint, options, attempt + 1)
      }
      
      throw error
    }
  }

  // ===== PERFORMANCE MONITORING METHODS =====

  getPerformanceMetrics() {
    return {
      averageResponseTime: this.performanceMonitor.getAverageResponseTime(),
      successRate: this.performanceMonitor.getSuccessRate(),
      cacheHitRate: this.performanceMonitor.getCacheHitRate(),
      totalRequests: this.performanceMonitor.getMetrics().length,
      recentMetrics: this.performanceMonitor.getMetrics().slice(-10)
    }
  }

  clearCache() {
    this.cache.clear()
  }

  // ===== PRESERVED API METHODS FROM ORIGINAL BACKEND-CLIENT.TS =====
  // All 25+ API endpoints from the original 1,966-line implementation

  // ===== CORE SYSTEM ENDPOINTS =====

  async getHealth() {
    return this.makeRequest<any>('/health', {}, 'health', 10000)
  }

  async getServices() {
    return this.makeRequest<any>('/api/v1/services', {}, 'services', 30000)
  }

  // ===== PORTFOLIO MANAGEMENT =====

  async getPortfolioSummary() {
    return this.makeRequest<any>('/api/v1/portfolio/summary', {}, 'portfolio-summary', 5000)
  }

  async getPortfolioPositions() {
    return this.makeRequest<any>('/api/v1/portfolio/positions', {}, 'portfolio-positions', 5000)
  }

  async getPortfolioBalances() {
    return this.makeRequest<any>('/api/v1/portfolio/balances', {}, 'portfolio-balances', 5000)
  }

  async getPortfolioPerformance(period: string = '1d') {
    return this.makeRequest<any>(`/api/v1/portfolio/performance?period=${period}`, {}, `portfolio-performance-${period}`, 30000)
  }

  // ===== TRADING OPERATIONS =====

  async createOrder(orderData: any) {
    return this.makeRequest<any>('/api/v1/trading/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  }

  async cancelOrder(orderId: string) {
    return this.makeRequest<any>(`/api/v1/trading/orders/${orderId}/cancel`, {
      method: 'POST'
    })
  }

  async getOrderHistory() {
    return this.makeRequest<any>('/api/v1/trading/orders/history', {}, 'order-history', 10000)
  }

  async getOpenOrders() {
    return this.makeRequest<any>('/api/v1/trading/orders/open', {}, 'open-orders', 5000)
  }

  async getTradeHistory() {
    return this.makeRequest<any>('/api/v1/trading/trades/history', {}, 'trade-history', 30000)
  }

  // ===== MARKET DATA =====

  async getLiveMarketData(symbol: string) {
    return this.makeRequest<any>(`/api/v1/market/live-data/${symbol}`, {}, `market-${symbol}`, 1000)
  }

  async getOrderBook(symbol: string) {
    return this.makeRequest<any>(`/api/v1/market/orderbook/${symbol}`, {}, `orderbook-${symbol}`, 2000)
  }

  async getWatchlist() {
    return this.makeRequest<any>('/api/v1/market/watchlist', {}, 'watchlist', 10000)
  }

  async addToWatchlist(symbol: string) {
    return this.makeRequest<any>('/api/v1/market/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol })
    })
  }

  async removeFromWatchlist(symbol: string) {
    return this.makeRequest<any>(`/api/v1/market/watchlist/${symbol}`, {
      method: 'DELETE'
    })
  }

  // ===== STRATEGY MANAGEMENT =====

  async getStrategies() {
    return this.makeRequest<any>('/api/v1/strategies', {}, 'strategies', 30000)
  }

  async createStrategy(strategyData: any) {
    return this.makeRequest<any>('/api/v1/strategies', {
      method: 'POST',
      body: JSON.stringify(strategyData)
    })
  }

  async updateStrategy(id: string, strategyData: any) {
    return this.makeRequest<any>(`/api/v1/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(strategyData)
    })
  }

  async deleteStrategy(id: string) {
    return this.makeRequest<any>(`/api/v1/strategies/${id}`, {
      method: 'DELETE'
    })
  }

  async getStrategyPerformance(id: string) {
    return this.makeRequest<any>(`/api/v1/strategies/${id}/performance`, {}, `strategy-performance-${id}`, 30000)
  }

  // ===== AGENT MANAGEMENT =====

  async getAgentStatus() {
    return this.makeRequest<any>('/api/v1/agents/status', {}, 'agent-status', 5000)
  }

  async startAgent(id: string) {
    return this.makeRequest<any>(`/api/v1/agents/${id}/start`, {
      method: 'POST'
    })
  }

  async stopAgent(id: string) {
    return this.makeRequest<any>(`/api/v1/agents/${id}/stop`, {
      method: 'POST'
    })
  }

  async executeAgentDecision(id: string, decision: any) {
    return this.makeRequest<any>(`/api/v1/agents/${id}/execute-decision`, {
      method: 'POST',
      body: JSON.stringify(decision)
    })
  }

  async getAgentDecisions(id: string) {
    return this.makeRequest<any>(`/api/v1/agents/${id}/decisions`, {}, `agent-decisions-${id}`, 10000)
  }

  async coordinateAgentDecision(coordinationData: any) {
    return this.makeRequest<any>('/api/v1/agents/coordinate-decision', {
      method: 'POST',
      body: JSON.stringify(coordinationData)
    })
  }

  // ===== RISK MANAGEMENT =====

  async getRiskMetrics() {
    return this.makeRequest<any>('/api/v1/risk/metrics', {}, 'risk-metrics', 10000)
  }

  async runStressTest(scenario: any) {
    return this.makeRequest<any>('/api/v1/risk/stress-test', {
      method: 'POST',
      body: JSON.stringify(scenario)
    })
  }

  async getVaRCalculation() {
    return this.makeRequest<any>('/api/v1/risk/var', {}, 'var-calculation', 30000)
  }

  // ===== PAPER TRADING =====

  async createPaperOrder(orderData: any) {
    return this.makeRequest<any>('/api/v1/trading/paper/order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  }

  async getPaperPortfolio() {
    return this.makeRequest<any>('/api/v1/trading/paper/portfolio', {}, 'paper-portfolio', 5000)
  }

  async getPaperTradingHistory() {
    return this.makeRequest<any>('/api/v1/trading/paper/history', {}, 'paper-history', 30000)
  }

  // ===== FARM MANAGEMENT =====

  async getFarms() {
    return this.makeRequest<any>('/api/v1/farms', {}, 'farms', 30000)
  }

  async createFarm(farmData: any) {
    return this.makeRequest<any>('/api/v1/farms', {
      method: 'POST',
      body: JSON.stringify(farmData)
    })
  }

  async updateFarm(id: string, farmData: any) {
    return this.makeRequest<any>(`/api/v1/farms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(farmData)
    })
  }

  async deleteFarm(id: string) {
    return this.makeRequest<any>(`/api/v1/farms/${id}`, {
      method: 'DELETE'
    })
  }

  async startFarm(id: string) {
    return this.makeRequest<any>(`/api/v1/farms/${id}/start`, {
      method: 'POST'
    })
  }

  async stopFarm(id: string) {
    return this.makeRequest<any>(`/api/v1/farms/${id}/stop`, {
      method: 'POST'
    })
  }

  // ===== EXPERT AGENT SYSTEM =====

  async createExpertAgent(agentData: any) {
    return this.makeRequest<any>('/api/v1/agents/expert', {
      method: 'POST',
      body: JSON.stringify(agentData)
    })
  }

  async analyzeSymbolWithAgent(agentId: string, symbol: string) {
    return this.makeRequest<any>(`/api/v1/agents/expert/${agentId}/analyze/${symbol}`, {
      method: 'POST'
    })
  }

  async optimizeExpertAgent(agentId: string, optimizationParams: any) {
    return this.makeRequest<any>(`/api/v1/agents/expert/${agentId}/optimize`, {
      method: 'POST',
      body: JSON.stringify(optimizationParams)
    })
  }

  // ===== MULTI-CHAIN OPERATIONS =====

  async getWalletBalances() {
    return this.makeRequest<any>('/api/v1/wallet/balances', {}, 'wallet-balances', 10000)
  }

  async executeFlashLoan(loanData: any) {
    return this.makeRequest<any>('/api/v1/defi/flash-loan', {
      method: 'POST',
      body: JSON.stringify(loanData)
    })
  }

  async getHyperLendPositions() {
    return this.makeRequest<any>('/api/v1/hyperlend/positions', {}, 'hyperlend-positions', 30000)
  }

  // ===== ANALYTICS & REPORTING =====

  async getAnalyticsData(timeframe: string = '1d') {
    return this.makeRequest<any>(`/api/v1/analytics/data?timeframe=${timeframe}`, {}, `analytics-${timeframe}`, 30000)
  }

  async generateReport(reportType: string) {
    return this.makeRequest<any>(`/api/v1/reports/${reportType}`, {
      method: 'POST'
    })
  }

  // ===== CONFIGURATION METHODS =====

  updateConfig(newConfig: Partial<EnhancedClientConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): EnhancedClientConfig {
    return { ...this.config }
  }

  // ===== UTILITY METHODS =====

  isHealthy(): Promise<boolean> {
    return this.getHealth()
      .then(() => true)
      .catch(() => false)
  }
}

// ===== SINGLETON INSTANCE =====

export const enhancedBackendClient = new EnhancedBackendClient()

// ===== LEGACY COMPATIBILITY =====
// Maintain compatibility with existing code that imports from backend-client.ts

export const backendClient = enhancedBackendClient
export default enhancedBackendClient

// ===== ENHANCED FEATURES EXPORT =====

export { APICache, PerformanceMonitor }
export type { EnhancedClientConfig, PerformanceMetric }