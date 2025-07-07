/**
 * Market Data Persistence Layer
 * Handles storage and retrieval of market data using Supabase and Redis
 */

import { 
  MarketPrice, 
  HistoricalPrice, 
  MarketAnalysis, 
  MarketEvent,
  MarketDataStorage,
  MarketDataResponse
} from '@/types/market-data'
import { createClient } from '@supabase/supabase-js'

interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  mget(keys: string[]): Promise<(string | null)[]>
  mset(data: Record<string, string>): Promise<void>
}

class MarketDataPersistence implements MarketDataStorage {
  private supabase: any
  private redis: RedisClient | null = null
  private initialized = false

  constructor() {
    this.initializeConnections()
  }

  private async initializeConnections(): Promise<void> {
    try {
      // Initialize Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey) {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey)
        console.log('Supabase connected for market data persistence')
      } else {
        console.warn('Supabase credentials not found, using localStorage fallback')
      }

      // Initialize Redis (optional)
      await this.initializeRedis()

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize market data persistence:', error)
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL
      if (redisUrl) {
        // In a real implementation, you would use a Redis client library
        // For now, we'll create a mock Redis interface using localStorage
        this.redis = {
          async get(key: string): Promise<string | null> {
            return localStorage.getItem(`redis:${key}`)
          },
          async set(key: string, value: string, ttl?: number): Promise<void> {
            localStorage.setItem(`redis:${key}`, value)
            if (ttl) {
              setTimeout(() => {
                localStorage.removeItem(`redis:${key}`)
              }, ttl * 1000)
            }
          },
          async del(key: string): Promise<void> {
            localStorage.removeItem(`redis:${key}`)
          },
          async exists(key: string): Promise<boolean> {
            return localStorage.getItem(`redis:${key}`) !== null
          },
          async mget(keys: string[]): Promise<(string | null)[]> {
            return keys.map(key => localStorage.getItem(`redis:${key}`))
          },
          async mset(data: Record<string, string>): Promise<void> {
            for (const [key, value] of Object.entries(data)) {
              localStorage.setItem(`redis:${key}`, value)
            }
          }
        }
        console.log('Redis mock client initialized')
      }
    } catch (error) {
      console.warn('Redis initialization failed, using memory cache:', error)
    }
  }

  // ===== REAL-TIME PRICES =====

  async storePrices(prices: MarketPrice[]): Promise<void> {
    try {
      // Store in Redis for fast access
      if (this.redis) {
        const redisData: Record<string, string> = {}
        for (const price of prices) {
          redisData[`price:${price.symbol}`] = JSON.stringify({
            ...price,
            lastUpdate: price.lastUpdate.toISOString()
          })
        }
        await this.redis.mset(redisData)
      }

      // Store in Supabase for persistence
      if (this.supabase) {
        const supabaseData = prices.map(price => ({
          symbol: price.symbol,
          price: price.price,
          change_24h: price.change24h,
          change_percent_24h: price.changePercent24h,
          volume_24h: price.volume24h,
          high_24h: price.high24h,
          low_24h: price.low24h,
          open_24h: price.open24h,
          market_cap: price.marketCap,
          source: price.source,
          bid: price.bid,
          ask: price.ask,
          spread: price.spread,
          last_update: price.lastUpdate.toISOString(),
          created_at: new Date().toISOString()
        }))

        const { error } = await this.supabase
          .from('market_prices')
          .upsert(supabaseData, { 
            onConflict: 'symbol',
            ignoreDuplicates: false 
          })

        if (error) {
          console.error('Supabase price storage error:', error)
        }
      }

      // Fallback to localStorage
      if (!this.redis && !this.supabase) {
        const stored = JSON.parse(localStorage.getItem('market_prices') || '{}')
        for (const price of prices) {
          stored[price.symbol] = {
            ...price,
            lastUpdate: price.lastUpdate.toISOString()
          }
        }
        localStorage.setItem('market_prices', JSON.stringify(stored))
      }
    } catch (error) {
      console.error('Failed to store prices:', error)
    }
  }

  async getPrices(symbols: string[]): Promise<MarketPrice[]> {
    try {
      const prices: MarketPrice[] = []

      // Try Redis first (fastest)
      if (this.redis) {
        const keys = symbols.map(symbol => `price:${symbol}`)
        const values = await this.redis.mget(keys)
        
        for (let i = 0; i < symbols.length; i++) {
          if (values[i]) {
            try {
              const data = JSON.parse(values[i]!)
              prices.push({
                ...data,
                lastUpdate: new Date(data.lastUpdate)
              })
            } catch (parseError) {
              console.warn(`Failed to parse Redis price for ${symbols[i]}:`, parseError)
            }
          }
        }

        if (prices.length === symbols.length) {
          return prices
        }
      }

      // Try Supabase for missing data
      if (this.supabase) {
        const missingSymbols = symbols.filter(symbol => 
          !prices.find(p => p.symbol === symbol)
        )

        if (missingSymbols.length > 0) {
          const { data, error } = await this.supabase
            .from('market_prices')
            .select('*')
            .in('symbol', missingSymbols)
            .order('created_at', { ascending: false })

          if (!error && data) {
            const supabasePrices = data.map((row: any) => ({
              symbol: row.symbol,
              price: row.price,
              change24h: row.change_24h,
              changePercent24h: row.change_percent_24h,
              volume24h: row.volume_24h,
              high24h: row.high_24h,
              low24h: row.low_24h,
              open24h: row.open_24h,
              marketCap: row.market_cap,
              source: row.source,
              bid: row.bid,
              ask: row.ask,
              spread: row.spread,
              lastUpdate: new Date(row.last_update)
            }))
            prices.push(...supabasePrices)
          }
        }
      }

      // Fallback to localStorage
      if (prices.length < symbols.length) {
        const stored = JSON.parse(localStorage.getItem('market_prices') || '{}')
        for (const symbol of symbols) {
          if (!prices.find(p => p.symbol === symbol) && stored[symbol]) {
            prices.push({
              ...stored[symbol],
              lastUpdate: new Date(stored[symbol].lastUpdate)
            })
          }
        }
      }

      return prices
    } catch (error) {
      console.error('Failed to get prices:', error)
      return []
    }
  }

  // ===== HISTORICAL DATA =====

  async storeHistorical(data: HistoricalPrice[]): Promise<void> {
    try {
      if (this.supabase) {
        const supabaseData = data.map(item => ({
          symbol: item.symbol,
          timestamp: item.timestamp.toISOString(),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          created_at: new Date().toISOString()
        }))

        const { error } = await this.supabase
          .from('historical_prices')
          .upsert(supabaseData, { 
            onConflict: 'symbol,timestamp',
            ignoreDuplicates: true 
          })

        if (error) {
          console.error('Supabase historical storage error:', error)
        }
      }

      // Cache recent data in Redis
      if (this.redis) {
        const grouped = this.groupBySymbol(data)
        for (const [symbol, prices] of Object.entries(grouped)) {
          const key = `historical:${symbol}:1h`
          const recentData = prices.slice(-100) // Keep last 100 data points in cache
          await this.redis.set(key, JSON.stringify(recentData), 3600) // 1 hour TTL
        }
      }

      // Fallback to localStorage (limited storage)
      if (!this.supabase) {
        const stored = JSON.parse(localStorage.getItem('historical_prices') || '{}')
        for (const item of data) {
          if (!stored[item.symbol]) {
            stored[item.symbol] = []
          }
          // Keep only last 1000 points per symbol in localStorage
          stored[item.symbol].push({
            ...item,
            timestamp: item.timestamp.toISOString()
          })
          stored[item.symbol] = stored[item.symbol].slice(-1000)
        }
        localStorage.setItem('historical_prices', JSON.stringify(stored))
      }
    } catch (error) {
      console.error('Failed to store historical data:', error)
    }
  }

  async getHistorical(
    symbol: string, 
    from: Date, 
    to: Date, 
    interval: string = '1h'
  ): Promise<HistoricalPrice[]> {
    try {
      // Try Redis cache first for recent data
      if (this.redis && this.isRecentData(from, to)) {
        const cacheKey = `historical:${symbol}:${interval}`
        const cached = await this.redis.get(cacheKey)
        if (cached) {
          const data = JSON.parse(cached)
          const filtered = data.filter((item: any) => {
            const timestamp = new Date(item.timestamp)
            return timestamp >= from && timestamp <= to
          })
          if (filtered.length > 0) {
            return filtered.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }))
          }
        }
      }

      // Query Supabase for historical data
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('historical_prices')
          .select('*')
          .eq('symbol', symbol)
          .gte('timestamp', from.toISOString())
          .lte('timestamp', to.toISOString())
          .order('timestamp', { ascending: true })

        if (!error && data) {
          return data.map((row: any) => ({
            symbol: row.symbol,
            timestamp: new Date(row.timestamp),
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume
          }))
        }
      }

      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('historical_prices') || '{}')
      if (stored[symbol]) {
        return stored[symbol]
          .filter((item: any) => {
            const timestamp = new Date(item.timestamp)
            return timestamp >= from && timestamp <= to
          })
          .map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
      }

      return []
    } catch (error) {
      console.error('Failed to get historical data:', error)
      return []
    }
  }

  // ===== ANALYSIS RESULTS =====

  async storeAnalysis(analysis: MarketAnalysis): Promise<void> {
    try {
      // Store in Supabase
      if (this.supabase) {
        const { error } = await this.supabase
          .from('market_analysis')
          .upsert({
            symbol: analysis.symbol,
            timestamp: analysis.timestamp.toISOString(),
            trend: analysis.trend,
            strength: analysis.strength,
            indicators: analysis.indicators,
            signals: analysis.signals,
            support_levels: analysis.supportLevels,
            resistance_levels: analysis.resistanceLevels,
            analysis_text: analysis.analysis,
            confidence: analysis.confidence,
            created_at: new Date().toISOString()
          }, { 
            onConflict: 'symbol,timestamp',
            ignoreDuplicates: false 
          })

        if (error) {
          console.error('Supabase analysis storage error:', error)
        }
      }

      // Cache in Redis
      if (this.redis) {
        const key = `analysis:${analysis.symbol}:latest`
        await this.redis.set(key, JSON.stringify({
          ...analysis,
          timestamp: analysis.timestamp.toISOString()
        }), 1800) // 30 minutes TTL
      }

      // Fallback to localStorage
      if (!this.supabase) {
        const stored = JSON.parse(localStorage.getItem('market_analysis') || '{}')
        if (!stored[analysis.symbol]) {
          stored[analysis.symbol] = []
        }
        stored[analysis.symbol].push({
          ...analysis,
          timestamp: analysis.timestamp.toISOString()
        })
        // Keep only last 50 analysis per symbol
        stored[analysis.symbol] = stored[analysis.symbol].slice(-50)
        localStorage.setItem('market_analysis', JSON.stringify(stored))
      }
    } catch (error) {
      console.error('Failed to store analysis:', error)
    }
  }

  async getAnalysis(symbol: string, from: Date, to: Date): Promise<MarketAnalysis[]> {
    try {
      // Try Redis for latest analysis
      if (this.redis && this.isRecentData(from, to)) {
        const key = `analysis:${symbol}:latest`
        const cached = await this.redis.get(key)
        if (cached) {
          const data = JSON.parse(cached)
          const timestamp = new Date(data.timestamp)
          if (timestamp >= from && timestamp <= to) {
            return [{
              ...data,
              timestamp
            }]
          }
        }
      }

      // Query Supabase
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('market_analysis')
          .select('*')
          .eq('symbol', symbol)
          .gte('timestamp', from.toISOString())
          .lte('timestamp', to.toISOString())
          .order('timestamp', { ascending: false })

        if (!error && data) {
          return data.map((row: any) => ({
            symbol: row.symbol,
            timestamp: new Date(row.timestamp),
            trend: row.trend,
            strength: row.strength,
            indicators: row.indicators,
            signals: row.signals,
            supportLevels: row.support_levels,
            resistanceLevels: row.resistance_levels,
            analysis: row.analysis_text,
            confidence: row.confidence
          }))
        }
      }

      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('market_analysis') || '{}')
      if (stored[symbol]) {
        return stored[symbol]
          .filter((item: any) => {
            const timestamp = new Date(item.timestamp)
            return timestamp >= from && timestamp <= to
          })
          .map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
      }

      return []
    } catch (error) {
      console.error('Failed to get analysis:', error)
      return []
    }
  }

  // ===== MARKET EVENTS =====

  async storeEvent(event: MarketEvent): Promise<void> {
    try {
      // Store in Supabase
      if (this.supabase) {
        const { error } = await this.supabase
          .from('market_events')
          .insert({
            id: event.id,
            type: event.type,
            symbol: event.symbol,
            timestamp: event.timestamp.toISOString(),
            description: event.description,
            severity: event.severity,
            data: event.data,
            triggered: event.triggered,
            agent_notified: event.agentNotified,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error('Supabase event storage error:', error)
        }
      }

      // Store in Redis with TTL
      if (this.redis) {
        const key = `event:${event.id}`
        await this.redis.set(key, JSON.stringify({
          ...event,
          timestamp: event.timestamp.toISOString()
        }), 86400) // 24 hours TTL
      }

      // Fallback to localStorage
      if (!this.supabase) {
        const stored = JSON.parse(localStorage.getItem('market_events') || '[]')
        stored.push({
          ...event,
          timestamp: event.timestamp.toISOString()
        })
        // Keep only last 1000 events
        localStorage.setItem('market_events', JSON.stringify(stored.slice(-1000)))
      }
    } catch (error) {
      console.error('Failed to store event:', error)
    }
  }

  async getEvents(symbols: string[], from: Date, to: Date): Promise<MarketEvent[]> {
    try {
      // Query Supabase
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('market_events')
          .select('*')
          .in('symbol', symbols)
          .gte('timestamp', from.toISOString())
          .lte('timestamp', to.toISOString())
          .order('timestamp', { ascending: false })

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            type: row.type,
            symbol: row.symbol,
            timestamp: new Date(row.timestamp),
            description: row.description,
            severity: row.severity,
            data: row.data,
            triggered: row.triggered,
            agentNotified: row.agent_notified
          }))
        }
      }

      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('market_events') || '[]')
      return stored
        .filter((event: any) => 
          symbols.includes(event.symbol) &&
          new Date(event.timestamp) >= from &&
          new Date(event.timestamp) <= to
        )
        .map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }))
    } catch (error) {
      console.error('Failed to get events:', error)
      return []
    }
  }

  // ===== UTILITY METHODS =====

  private groupBySymbol(data: HistoricalPrice[]): Record<string, HistoricalPrice[]> {
    return data.reduce((groups, item) => {
      if (!groups[item.symbol]) {
        groups[item.symbol] = []
      }
      groups[item.symbol].push(item)
      return groups
    }, {} as Record<string, HistoricalPrice[]>)
  }

  private isRecentData(from: Date, to: Date): boolean {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return from >= oneDayAgo
  }

  // ===== HEALTH CHECKS =====

  async checkHealth(): Promise<{ supabase: boolean; redis: boolean }> {
    const health = { supabase: false, redis: false }

    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('market_prices')
          .select('symbol')
          .limit(1)
        health.supabase = !error
      }
    } catch (error) {
      console.warn('Supabase health check failed:', error)
    }

    try {
      if (this.redis) {
        await this.redis.set('health_check', 'ok', 10)
        const result = await this.redis.get('health_check')
        health.redis = result === 'ok'
        await this.redis.del('health_check')
      }
    } catch (error) {
      console.warn('Redis health check failed:', error)
    }

    return health
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up old data in Supabase
      if (this.supabase) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        // Clean old market events
        await this.supabase
          .from('market_events')
          .delete()
          .lt('timestamp', oneWeekAgo.toISOString())

        // Clean old analysis (keep 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        await this.supabase
          .from('market_analysis')
          .delete()
          .lt('timestamp', thirtyDaysAgo.toISOString())
      }

      console.log('Market data cleanup completed')
    } catch (error) {
      console.error('Failed to cleanup market data:', error)
    }
  }
}

// Export singleton instance
export const marketDataPersistence = new MarketDataPersistence()
export default marketDataPersistence