/**
 * Enhanced Trading Redis Service
 * Optimized for high-frequency trading with advanced caching strategies
 */

import { Redis } from 'ioredis'
import { createHash } from 'crypto'

export interface TradingCacheConfig {
  maxMemory: string
  evictionPolicy: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu'
  keyPrefix: string
  defaultTTL: number
  compressionEnabled: boolean
  clusterEnabled: boolean
  monitoringEnabled: boolean
}

export interface CacheStrategy {
  key: string
  ttl: number
  serialize: (data: any) => string
  deserialize: (data: string) => any
  shouldCache: (data: any) => boolean
  preload?: () => Promise<any>
}

export interface PerformanceMetrics {
  hitRate: number
  missRate: number
  avgLatency: number
  commandsPerSecond: number
  memoryUsage: number
  connectionCount: number
  errorRate: number
  lastUpdated: number
}

export interface TradingData {
  symbol: string
  exchange: string
  price: number
  volume: number
  timestamp: number
  spread?: number
  depth?: any
}

export class EnhancedTradingRedis {
  private redis: Redis
  private cluster: Redis.Cluster | null = null
  private readonly config: TradingCacheConfig
  private connectionPool: Redis[] = []
  private performanceMetrics: PerformanceMetrics = {
    hitRate: 0,
    missRate: 0,
    avgLatency: 0,
    commandsPerSecond: 0,
    memoryUsage: 0,
    connectionCount: 0,
    errorRate: 0,
    lastUpdated: Date.now()
  }
  private metricsInterval: NodeJS.Timeout | null = null

  // Cache strategies for different data types
  private cacheStrategies: Map<string, CacheStrategy> = new Map()

  constructor(config: Partial<TradingCacheConfig> = {}) {
    this.config = {
      maxMemory: '2gb',
      evictionPolicy: 'allkeys-lru',
      keyPrefix: 'trading:',
      defaultTTL: 60, // 1 minute
      compressionEnabled: true,
      clusterEnabled: false,
      monitoringEnabled: true,
      ...config
    }

    this.initializeRedis()
    this.setupCacheStrategies()
    this.setupConnectionPool()
    
    if (this.config.monitoringEnabled) {
      this.startPerformanceMonitoring()
    }
  }

  private initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    if (this.config.clusterEnabled) {
      // Initialize Redis cluster
      this.cluster = new Redis.Cluster([
        { port: 6379, host: 'localhost' },
        { port: 6380, host: 'localhost' },
        { port: 6381, host: 'localhost' }
      ], {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100
      })
      this.redis = this.cluster as any
    } else {
      // Single Redis instance with optimized settings
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        lazyConnect: true,
        keepAlive: 30000,
        commandTimeout: 5000,
        db: 0,
        keyPrefix: this.config.keyPrefix
      })
    }

    // Configure Redis for trading workloads
    this.configureRedisForTrading()
  }

  private async configureRedisForTrading() {
    try {
      // Optimize Redis configuration for trading
      await this.redis.config('SET', 'maxmemory', this.config.maxMemory)
      await this.redis.config('SET', 'maxmemory-policy', this.config.evictionPolicy)
      await this.redis.config('SET', 'timeout', '0') // No timeout for persistent connections
      await this.redis.config('SET', 'tcp-keepalive', '60')
      await this.redis.config('SET', 'save', '') // Disable RDB snapshots for performance
      
      console.log('✅ Redis configured for high-frequency trading')
    } catch (error) {
      console.error('❌ Redis configuration failed:', error)
    }
  }

  private setupCacheStrategies() {
    // Market data strategy (high frequency, short TTL)
    this.cacheStrategies.set('market_data', {
      key: 'market_data',
      ttl: 10, // 10 seconds
      serialize: (data) => this.compress(JSON.stringify(data)),
      deserialize: (data) => JSON.parse(this.decompress(data)),
      shouldCache: (data) => data && data.price > 0,
      preload: async () => {
        // Pre-load popular trading pairs
        const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']
        return Promise.all(symbols.map(symbol => this.preloadMarketData(symbol)))
      }
    })

    // Order book strategy (very high frequency, ultra short TTL)
    this.cacheStrategies.set('order_book', {
      key: 'order_book',
      ttl: 5, // 5 seconds
      serialize: (data) => this.compress(JSON.stringify(data)),
      deserialize: (data) => JSON.parse(this.decompress(data)),
      shouldCache: (data) => data && data.bids && data.asks,
      preload: async () => {
        // Pre-load order books for active trading pairs
        const symbols = ['BTC/USDT', 'ETH/USDT']
        return Promise.all(symbols.map(symbol => this.preloadOrderBook(symbol)))
      }
    })

    // Portfolio strategy (medium frequency, longer TTL)
    this.cacheStrategies.set('portfolio', {
      key: 'portfolio',
      ttl: 30, // 30 seconds
      serialize: (data) => JSON.stringify(data),
      deserialize: (data) => JSON.parse(data),
      shouldCache: (data) => data && data.totalValue !== undefined
    })

    // Trading signals strategy (lower frequency, longer TTL)
    this.cacheStrategies.set('trading_signals', {
      key: 'trading_signals',
      ttl: 60, // 1 minute
      serialize: (data) => JSON.stringify(data),
      deserialize: (data) => JSON.parse(data),
      shouldCache: (data) => data && data.signal && data.confidence > 0.5
    })

    // Performance metrics strategy
    this.cacheStrategies.set('performance_metrics', {
      key: 'performance_metrics',
      ttl: 120, // 2 minutes
      serialize: (data) => JSON.stringify(data),
      deserialize: (data) => JSON.parse(data),
      shouldCache: (data) => data && typeof data.totalReturn === 'number'
    })
  }

  private setupConnectionPool() {
    // Create connection pool for high-throughput scenarios
    const poolSize = 5
    
    for (let i = 0; i < poolSize; i++) {
      const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        lazyConnect: true,
        keepAlive: 30000,
        keyPrefix: this.config.keyPrefix
      })
      
      this.connectionPool.push(connection)
    }
  }

  private getConnection(): Redis {
    // Round-robin connection selection
    const index = Math.floor(Math.random() * this.connectionPool.length)
    return this.connectionPool[index] || this.redis
  }

  private compress(data: string): string {
    if (!this.config.compressionEnabled) return data
    
    // Simple compression using base64 encoding
    // In production, use proper compression like gzip
    return Buffer.from(data).toString('base64')
  }

  private decompress(data: string): string {
    if (!this.config.compressionEnabled) return data
    
    try {
      return Buffer.from(data, 'base64').toString()
    } catch {
      return data // Fallback to original if decompression fails
    }
  }

  private generateCacheKey(strategy: string, params: any): string {
    const paramsStr = JSON.stringify(params)
    const hash = createHash('md5').update(paramsStr).digest('hex')
    return `${strategy}:${hash}`
  }

  // High-performance market data caching
  async cacheMarketData(symbol: string, exchange: string, data: TradingData): Promise<void> {
    const strategy = this.cacheStrategies.get('market_data')!
    const key = this.generateCacheKey('market_data', { symbol, exchange })
    
    if (!strategy.shouldCache(data)) return
    
    const serialized = strategy.serialize(data)
    const connection = this.getConnection()
    
    await connection.setex(key, strategy.ttl, serialized)
  }

  async getMarketData(symbol: string, exchange: string): Promise<TradingData | null> {
    const strategy = this.cacheStrategies.get('market_data')!
    const key = this.generateCacheKey('market_data', { symbol, exchange })
    
    const connection = this.getConnection()
    const cached = await connection.get(key)
    
    if (cached) {
      this.performanceMetrics.hitRate++
      return strategy.deserialize(cached)
    }
    
    this.performanceMetrics.missRate++
    return null
  }

  // Order book caching with ultra-low latency
  async cacheOrderBook(symbol: string, exchange: string, orderBook: any): Promise<void> {
    const strategy = this.cacheStrategies.get('order_book')!
    const key = this.generateCacheKey('order_book', { symbol, exchange })
    
    if (!strategy.shouldCache(orderBook)) return
    
    const serialized = strategy.serialize(orderBook)
    const connection = this.getConnection()
    
    // Use pipeline for faster execution
    const pipeline = connection.pipeline()
    pipeline.setex(key, strategy.ttl, serialized)
    pipeline.zadd('order_book_updates', Date.now(), key) // Track update times
    await pipeline.exec()
  }

  async getOrderBook(symbol: string, exchange: string): Promise<any> {
    const strategy = this.cacheStrategies.get('order_book')!
    const key = this.generateCacheKey('order_book', { symbol, exchange })
    
    const connection = this.getConnection()
    const cached = await connection.get(key)
    
    if (cached) {
      this.performanceMetrics.hitRate++
      return strategy.deserialize(cached)
    }
    
    this.performanceMetrics.missRate++
    return null
  }

  // Portfolio caching with intelligent updates
  async cachePortfolio(userId: string, portfolioData: any): Promise<void> {
    const strategy = this.cacheStrategies.get('portfolio')!
    const key = this.generateCacheKey('portfolio', { userId })
    
    if (!strategy.shouldCache(portfolioData)) return
    
    const serialized = strategy.serialize(portfolioData)
    const connection = this.getConnection()
    
    await connection.setex(key, strategy.ttl, serialized)
  }

  async getPortfolio(userId: string): Promise<any> {
    const strategy = this.cacheStrategies.get('portfolio')!
    const key = this.generateCacheKey('portfolio', { userId })
    
    const connection = this.getConnection()
    const cached = await connection.get(key)
    
    if (cached) {
      this.performanceMetrics.hitRate++
      return strategy.deserialize(cached)
    }
    
    this.performanceMetrics.missRate++
    return null
  }

  // Trading signals caching
  async cacheTradingSignals(agentId: string, signals: any[]): Promise<void> {
    const strategy = this.cacheStrategies.get('trading_signals')!
    const key = this.generateCacheKey('trading_signals', { agentId })
    
    const validSignals = signals.filter(strategy.shouldCache)
    if (validSignals.length === 0) return
    
    const serialized = strategy.serialize(validSignals)
    const connection = this.getConnection()
    
    await connection.setex(key, strategy.ttl, serialized)
  }

  async getTradingSignals(agentId: string): Promise<any[]> {
    const strategy = this.cacheStrategies.get('trading_signals')!
    const key = this.generateCacheKey('trading_signals', { agentId })
    
    const connection = this.getConnection()
    const cached = await connection.get(key)
    
    if (cached) {
      this.performanceMetrics.hitRate++
      return strategy.deserialize(cached)
    }
    
    this.performanceMetrics.missRate++
    return []
  }

  // Performance metrics caching
  async cachePerformanceMetrics(type: string, metrics: any): Promise<void> {
    const strategy = this.cacheStrategies.get('performance_metrics')!
    const key = this.generateCacheKey('performance_metrics', { type })
    
    if (!strategy.shouldCache(metrics)) return
    
    const serialized = strategy.serialize(metrics)
    const connection = this.getConnection()
    
    await connection.setex(key, strategy.ttl, serialized)
  }

  async getPerformanceMetrics(type: string): Promise<any> {
    const strategy = this.cacheStrategies.get('performance_metrics')!
    const key = this.generateCacheKey('performance_metrics', { type })
    
    const connection = this.getConnection()
    const cached = await connection.get(key)
    
    if (cached) {
      this.performanceMetrics.hitRate++
      return strategy.deserialize(cached)
    }
    
    this.performanceMetrics.missRate++
    return null
  }

  // Batch operations for improved performance
  async batchCacheMarketData(dataArray: Array<{symbol: string, exchange: string, data: TradingData}>): Promise<void> {
    const strategy = this.cacheStrategies.get('market_data')!
    const connection = this.getConnection()
    const pipeline = connection.pipeline()
    
    for (const { symbol, exchange, data } of dataArray) {
      if (!strategy.shouldCache(data)) continue
      
      const key = this.generateCacheKey('market_data', { symbol, exchange })
      const serialized = strategy.serialize(data)
      pipeline.setex(key, strategy.ttl, serialized)
    }
    
    await pipeline.exec()
  }

  async batchGetMarketData(requests: Array<{symbol: string, exchange: string}>): Promise<(TradingData | null)[]> {
    const strategy = this.cacheStrategies.get('market_data')!
    const connection = this.getConnection()
    const pipeline = connection.pipeline()
    
    const keys = requests.map(({ symbol, exchange }) => 
      this.generateCacheKey('market_data', { symbol, exchange })
    )
    
    keys.forEach(key => pipeline.get(key))
    const results = await pipeline.exec()
    
    return results?.map((result, index) => {
      if (result && result[1]) {
        this.performanceMetrics.hitRate++
        return strategy.deserialize(result[1] as string)
      }
      this.performanceMetrics.missRate++
      return null
    }) || []
  }

  // Cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    console.log('🔥 Warming Redis cache for trading data...')
    
    const promises = Array.from(this.cacheStrategies.entries())
      .filter(([_, strategy]) => strategy.preload)
      .map(([name, strategy]) => {
        return strategy.preload!().catch(error => {
          console.error(`❌ Failed to preload ${name}:`, error)
        })
      })
    
    await Promise.all(promises)
    console.log('✅ Cache warming completed')
  }

  private async preloadMarketData(symbol: string): Promise<void> {
    // Mock preloading - in production, fetch from exchanges
    const mockData: TradingData = {
      symbol,
      exchange: 'binance',
      price: 45000 + Math.random() * 10000,
      volume: 1000000 + Math.random() * 500000,
      timestamp: Date.now(),
      spread: 0.01
    }
    
    await this.cacheMarketData(symbol, 'binance', mockData)
  }

  private async preloadOrderBook(symbol: string): Promise<void> {
    // Mock preloading - in production, fetch from exchanges
    const mockOrderBook = {
      symbol,
      bids: [[45000, 1.5], [44999, 2.0], [44998, 1.8]],
      asks: [[45001, 1.2], [45002, 1.9], [45003, 2.1]],
      timestamp: Date.now()
    }
    
    await this.cacheOrderBook(symbol, 'binance', mockOrderBook)
  }

  // Cache invalidation strategies
  async invalidateMarketData(symbol: string, exchange: string): Promise<void> {
    const key = this.generateCacheKey('market_data', { symbol, exchange })
    const connection = this.getConnection()
    await connection.del(key)
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const connection = this.getConnection()
    const keys = await connection.keys(`${this.config.keyPrefix}${pattern}`)
    
    if (keys.length === 0) return 0
    
    const pipeline = connection.pipeline()
    keys.forEach(key => pipeline.del(key))
    await pipeline.exec()
    
    return keys.length
  }

  async flushTradingCache(): Promise<void> {
    const connection = this.getConnection()
    await connection.flushdb()
    console.log('🗑️ Trading cache flushed')
  }

  // Performance monitoring
  private startPerformanceMonitoring(): void {
    this.metricsInterval = setInterval(async () => {
      await this.updatePerformanceMetrics()
    }, 5000) // Update every 5 seconds
  }

  private async updatePerformanceMetrics(): Promise<void> {
    try {
      const connection = this.getConnection()
      const info = await connection.info()
      
      // Parse Redis info for metrics
      const memoryUsage = this.parseRedisInfo(info, 'used_memory')
      const commandsProcessed = this.parseRedisInfo(info, 'total_commands_processed')
      const connectedClients = this.parseRedisInfo(info, 'connected_clients')
      
      this.performanceMetrics = {
        ...this.performanceMetrics,
        memoryUsage: parseInt(memoryUsage) || 0,
        commandsPerSecond: parseInt(commandsProcessed) || 0,
        connectionCount: parseInt(connectedClients) || 0,
        lastUpdated: Date.now()
      }
      
      // Calculate hit rate
      const totalRequests = this.performanceMetrics.hitRate + this.performanceMetrics.missRate
      this.performanceMetrics.hitRate = totalRequests > 0 ? 
        (this.performanceMetrics.hitRate / totalRequests) * 100 : 0
      
    } catch (error) {
      console.error('❌ Failed to update performance metrics:', error)
      this.performanceMetrics.errorRate++
    }
  }

  private parseRedisInfo(info: string, key: string): string {
    const lines = info.split('\n')
    const line = lines.find(l => l.startsWith(key))
    return line ? line.split(':')[1]?.trim() || '0' : '0'
  }

  // Health checks
  async healthCheck(): Promise<{ status: string; metrics: PerformanceMetrics }> {
    try {
      const connection = this.getConnection()
      const pong = await connection.ping()
      
      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        metrics: { ...this.performanceMetrics }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: { ...this.performanceMetrics }
      }
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    
    await this.redis.quit()
    
    for (const connection of this.connectionPool) {
      await connection.quit()
    }
    
    if (this.cluster) {
      await this.cluster.quit()
    }
    
    console.log('✅ Redis connections closed')
  }

  // Public API
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  async getCacheStats(): Promise<any> {
    const connection = this.getConnection()
    const info = await connection.info()
    
    return {
      memoryUsage: this.parseRedisInfo(info, 'used_memory'),
      hitRate: this.performanceMetrics.hitRate,
      missRate: this.performanceMetrics.missRate,
      keyCount: await connection.dbsize(),
      uptime: this.parseRedisInfo(info, 'uptime_in_seconds')
    }
  }

  // Advanced features
  async setupTradingPipeline(): Promise<void> {
    // Set up Redis streams for real-time trading data
    const connection = this.getConnection()
    
    const streams = [
      'market_data_stream',
      'order_book_stream',
      'trade_execution_stream',
      'portfolio_updates_stream'
    ]
    
    for (const stream of streams) {
      try {
        await connection.xgroup('CREATE', stream, 'trading_consumers', '$', 'MKSTREAM')
      } catch (error) {
        // Group might already exist
      }
    }
    
    console.log('✅ Trading pipeline streams configured')
  }

  async publishTradingEvent(stream: string, data: any): Promise<void> {
    const connection = this.getConnection()
    const serialized = this.compress(JSON.stringify(data))
    
    await connection.xadd(stream, '*', 'data', serialized, 'timestamp', Date.now())
  }

  async consumeTradingEvents(stream: string, callback: (data: any) => void): Promise<void> {
    const connection = this.getConnection()
    
    while (true) {
      try {
        const results = await connection.xreadgroup(
          'GROUP', 'trading_consumers', 'consumer_1',
          'COUNT', 10,
          'BLOCK', 1000,
          'STREAMS', stream, '>'
        )
        
        if (results) {
          for (const [streamName, messages] of results) {
            for (const [messageId, fields] of messages) {
              const data = JSON.parse(this.decompress(fields[1]))
              callback(data)
              
              // Acknowledge message
              await connection.xack(stream, 'trading_consumers', messageId)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error consuming trading events:', error)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}

// Singleton instance
let enhancedTradingRedis: EnhancedTradingRedis | null = null

export function getEnhancedTradingRedis(): EnhancedTradingRedis {
  if (!enhancedTradingRedis) {
    enhancedTradingRedis = new EnhancedTradingRedis({
      maxMemory: '2gb',
      evictionPolicy: 'allkeys-lru',
      keyPrefix: 'trading:',
      defaultTTL: 60,
      compressionEnabled: true,
      clusterEnabled: process.env.NODE_ENV === 'production',
      monitoringEnabled: true
    })
  }
  return enhancedTradingRedis
}

export default EnhancedTradingRedis