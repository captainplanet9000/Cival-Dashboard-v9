'use client'

import { 
  defaultRedisConfig, 
  defaultCacheConfig, 
  cacheKeys, 
  cacheTTL,
  wsEventTypes,
  type RedisConfig,
  type CacheConfig
} from './redis-config'

// Browser-compatible Redis client interface
interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<boolean>
  del(key: string): Promise<number>
  exists(key: string): Promise<boolean>
  keys(pattern: string): Promise<string[]>
  publish(channel: string, message: string): Promise<number>
  subscribe(channel: string, callback: (message: string) => void): Promise<void>
  disconnect(): Promise<void>
  ping(): Promise<string>
}

// Mock Redis client for browser environment
class MockRedisClient implements RedisClient {
  private data = new Map<string, { value: string; expiry?: number }>()
  private subscribers = new Map<string, Array<(message: string) => void>>()

  async get(key: string): Promise<string | null> {
    const item = this.data.get(key)
    if (!item) return null
    
    if (item.expiry && Date.now() > item.expiry) {
      this.data.delete(key)
      return null
    }
    
    return item.value
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    const expiry = ttl ? Date.now() + (ttl * 1000) : undefined
    this.data.set(key, { value, expiry })
    return true
  }

  async del(key: string): Promise<number> {
    return this.data.delete(key) ? 1 : 0
  }

  async exists(key: string): Promise<boolean> {
    const item = this.data.get(key)
    if (!item) return false
    
    if (item.expiry && Date.now() > item.expiry) {
      this.data.delete(key)
      return false
    }
    
    return true
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.data.keys()).filter(key => regex.test(key))
  }

  async publish(channel: string, message: string): Promise<number> {
    const callbacks = this.subscribers.get(channel) || []
    callbacks.forEach(callback => callback(message))
    return callbacks.length
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, [])
    }
    this.subscribers.get(channel)!.push(callback)
  }

  async disconnect(): Promise<void> {
    this.data.clear()
    this.subscribers.clear()
  }

  async ping(): Promise<string> {
    return 'PONG'
  }
}

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number
}

export interface RedisServiceOptions {
  config?: Partial<RedisConfig>
  cacheConfig?: Partial<CacheConfig>
  enableMockMode?: boolean
}

export class EnhancedRedisService {
  private client: RedisClient
  private config: RedisConfig
  private cacheConfig: CacheConfig
  private isConnected = false
  private isMockMode = false
  private connectionListeners: Array<(connected: boolean) => void> = []

  constructor(options: RedisServiceOptions = {}) {
    this.config = { ...defaultRedisConfig, ...options.config }
    this.cacheConfig = { ...defaultCacheConfig, ...options.cacheConfig }
    
    // Always use mock mode in browser environment
    this.isMockMode = true
    this.client = new MockRedisClient()
    this.isConnected = true
    
    console.log('Enhanced Redis Service initialized in mock mode for browser compatibility')
  }

  // Connection Management
  async connect(): Promise<boolean> {
    try {
      await this.client.ping()
      this.isConnected = true
      this.notifyConnectionListeners(true)
      console.log('Redis service connected successfully')
      return true
    } catch (error) {
      console.warn('Redis connection failed, continuing in mock mode:', error)
      this.isConnected = false
      this.notifyConnectionListeners(false)
      return false
    }
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect()
    this.isConnected = false
    this.notifyConnectionListeners(false)
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback)
    return () => {
      const index = this.connectionListeners.indexOf(callback)
      if (index > -1) this.connectionListeners.splice(index, 1)
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => callback(connected))
  }

  // Caching Operations
  async cacheSet<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.cacheConfig.defaultTTL
      }
      
      const serialized = JSON.stringify(cacheItem)
      await this.client.set(key, serialized, cacheItem.ttl)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const serialized = await this.client.get(key)
      if (!serialized) return null

      const cacheItem: CacheItem<T> = JSON.parse(serialized)
      
      // Check if cache item has expired
      if (Date.now() - cacheItem.timestamp > (cacheItem.ttl * 1000)) {
        await this.client.del(key)
        return null
      }
      
      return cacheItem.data
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async cacheDelete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async cacheExists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key)
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Portfolio Caching
  async cachePortfolioSummary(data: any, userId?: string): Promise<boolean> {
    const key = cacheKeys.portfolioSummary(userId)
    return await this.cacheSet(key, data, cacheTTL.portfolioSummary)
  }

  async getCachedPortfolioSummary(userId?: string): Promise<any> {
    const key = cacheKeys.portfolioSummary(userId)
    return await this.cacheGet(key)
  }

  async cachePortfolioPositions(data: any, userId?: string): Promise<boolean> {
    const key = cacheKeys.portfolioPositions(userId)
    return await this.cacheSet(key, data, cacheTTL.portfolioPositions)
  }

  async getCachedPortfolioPositions(userId?: string): Promise<any> {
    const key = cacheKeys.portfolioPositions(userId)
    return await this.cacheGet(key)
  }

  // Market Data Caching
  async cacheMarketData(symbol: string, data: any): Promise<boolean> {
    const key = cacheKeys.marketData(symbol)
    return await this.cacheSet(key, data, cacheTTL.marketData)
  }

  async getCachedMarketData(symbol: string): Promise<any> {
    const key = cacheKeys.marketData(symbol)
    return await this.cacheGet(key)
  }

  async cacheOrderBook(symbol: string, data: any): Promise<boolean> {
    const key = cacheKeys.orderBook(symbol)
    return await this.cacheSet(key, data, cacheTTL.orderBook)
  }

  async getCachedOrderBook(symbol: string): Promise<any> {
    const key = cacheKeys.orderBook(symbol)
    return await this.cacheGet(key)
  }

  // Agent Caching
  async cacheAgentStatus(agentId: string, data: any): Promise<boolean> {
    const key = cacheKeys.agentStatus(agentId)
    return await this.cacheSet(key, data, cacheTTL.agentStatus)
  }

  async getCachedAgentStatus(agentId: string): Promise<any> {
    const key = cacheKeys.agentStatus(agentId)
    return await this.cacheGet(key)
  }

  async cacheAgentPerformance(agentId: string, data: any): Promise<boolean> {
    const key = cacheKeys.agentPerformance(agentId)
    return await this.cacheSet(key, data, cacheTTL.agentPerformance)
  }

  async getCachedAgentPerformance(agentId: string): Promise<any> {
    const key = cacheKeys.agentPerformance(agentId)
    return await this.cacheGet(key)
  }

  // Chart Data Caching
  async cacheChartData(symbol: string, timeframe: string, data: any): Promise<boolean> {
    const key = cacheKeys.chartData(symbol, timeframe)
    return await this.cacheSet(key, data, cacheTTL.chartData)
  }

  async getCachedChartData(symbol: string, timeframe: string): Promise<any> {
    const key = cacheKeys.chartData(symbol, timeframe)
    return await this.cacheGet(key)
  }

  // Real-time Pub/Sub
  async publishUpdate(eventType: string, data: any): Promise<number> {
    try {
      const message = JSON.stringify({
        type: eventType,
        data,
        timestamp: Date.now()
      })
      
      return await this.client.publish(`realtime:${eventType}`, message)
    } catch (error) {
      console.error('Publish error:', error)
      return 0
    }
  }

  async subscribeToUpdates(eventType: string, callback: (data: any) => void): Promise<void> {
    try {
      await this.client.subscribe(`realtime:${eventType}`, (message) => {
        try {
          const parsed = JSON.parse(message)
          callback(parsed.data)
        } catch (error) {
          console.error('Message parse error:', error)
        }
      })
    } catch (error) {
      console.error('Subscribe error:', error)
    }
  }

  // Utility Methods
  async flushCache(pattern?: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern || `${this.cacheConfig.keyPrefix}*`)
      let deleted = 0
      
      for (const key of keys) {
        const result = await this.client.del(key)
        deleted += result
      }
      
      return deleted
    } catch (error) {
      console.error('Flush cache error:', error)
      return 0
    }
  }

  async getCacheStats(): Promise<{
    totalKeys: number
    hitRate: number
    memoryUsage: number
    isConnected: boolean
    isMockMode: boolean
  }> {
    try {
      const keys = await this.client.keys(`${this.cacheConfig.keyPrefix}*`)
      
      return {
        totalKeys: keys.length,
        hitRate: 0.85, // Mock value
        memoryUsage: keys.length * 100, // Mock value
        isConnected: this.isConnected,
        isMockMode: this.isMockMode
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        totalKeys: 0,
        hitRate: 0,
        memoryUsage: 0,
        isConnected: false,
        isMockMode: this.isMockMode
      }
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; details: any }> {
    const start = Date.now()
    
    try {
      await this.client.ping()
      const latency = Date.now() - start
      
      return {
        status: 'healthy',
        latency,
        details: {
          connected: this.isConnected,
          mockMode: this.isMockMode,
          config: this.config
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        details: { error: error.message }
      }
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get mockMode(): boolean {
    return this.isMockMode
  }

  get configuration(): { redis: RedisConfig; cache: CacheConfig } {
    return {
      redis: this.config,
      cache: this.cacheConfig
    }
  }
}

// Export singleton instance
export const enhancedRedisService = new EnhancedRedisService()
export default enhancedRedisService