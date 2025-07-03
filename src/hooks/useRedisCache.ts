'use client'

import { useState, useEffect, useCallback } from 'react'
import { enhancedRedisService } from '@/lib/redis/enhanced-redis-service'

export interface RedisStatus {
  connected: boolean
  mockMode: boolean
  totalKeys: number
  hitRate: number
  memoryUsage: number
}

export interface CacheOperations {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, data: T, ttl?: number) => Promise<boolean>
  delete: (key: string) => Promise<boolean>
  exists: (key: string) => Promise<boolean>
  flush: (pattern?: string) => Promise<number>
}

export function useRedisCache() {
  const [status, setStatus] = useState<RedisStatus>({
    connected: false,
    mockMode: true,
    totalKeys: 0,
    hitRate: 0,
    memoryUsage: 0
  })

  const [isLoading, setIsLoading] = useState(true)

  // Update status from Redis service
  const updateStatus = useCallback(async () => {
    try {
      const stats = await enhancedRedisService.getCacheStats()
      setStatus({
        connected: enhancedRedisService.connected,
        mockMode: enhancedRedisService.mockMode,
        totalKeys: stats.totalKeys,
        hitRate: stats.hitRate,
        memoryUsage: stats.memoryUsage
      })
    } catch (error) {
      console.error('Error updating Redis status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize Redis connection
  useEffect(() => {
    const initialize = async () => {
      try {
        await enhancedRedisService.connect()
        await updateStatus()
      } catch (error) {
        console.error('Error initializing Redis:', error)
        setIsLoading(false)
      }
    }

    initialize()

    // Listen for connection changes
    const unsubscribe = enhancedRedisService.onConnectionChange((connected) => {
      setStatus(prev => ({ ...prev, connected }))
    })

    // Periodic status updates
    const interval = setInterval(updateStatus, 30000) // Every 30 seconds

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [updateStatus])

  // Cache operations
  const operations: CacheOperations = {
    get: useCallback(async <T,>(key: string): Promise<T | null> => {
      return await enhancedRedisService.cacheGet<T>(key)
    }, []),

    set: useCallback(async <T,>(key: string, data: T, ttl?: number): Promise<boolean> => {
      const result = await enhancedRedisService.cacheSet(key, data, ttl)
      await updateStatus() // Update stats after cache operation
      return result
    }, [updateStatus]),

    delete: useCallback(async (key: string): Promise<boolean> => {
      const result = await enhancedRedisService.cacheDelete(key)
      await updateStatus() // Update stats after cache operation
      return result
    }, [updateStatus]),

    exists: useCallback(async (key: string): Promise<boolean> => {
      return await enhancedRedisService.cacheExists(key)
    }, []),

    flush: useCallback(async (pattern?: string): Promise<number> => {
      const result = await enhancedRedisService.flushCache(pattern)
      await updateStatus() // Update stats after cache operation
      return result
    }, [updateStatus])
  }

  return {
    status,
    isLoading,
    operations,
    refresh: updateStatus
  }
}

// Specialized hooks for common cache patterns
export function usePortfolioCache(userId?: string) {
  const { operations } = useRedisCache()

  const cachePortfolioSummary = useCallback(async (data: any) => {
    return await enhancedRedisService.cachePortfolioSummary(data, userId)
  }, [userId])

  const getPortfolioSummary = useCallback(async () => {
    return await enhancedRedisService.getCachedPortfolioSummary(userId)
  }, [userId])

  const cachePortfolioPositions = useCallback(async (data: any) => {
    return await enhancedRedisService.cachePortfolioPositions(data, userId)
  }, [userId])

  const getPortfolioPositions = useCallback(async () => {
    return await enhancedRedisService.getCachedPortfolioPositions(userId)
  }, [userId])

  return {
    cachePortfolioSummary,
    getPortfolioSummary,
    cachePortfolioPositions,
    getPortfolioPositions,
    ...operations
  }
}

export function useMarketDataCache() {
  const { operations } = useRedisCache()

  const cacheMarketData = useCallback(async (symbol: string, data: any) => {
    return await enhancedRedisService.cacheMarketData(symbol, data)
  }, [])

  const getMarketData = useCallback(async (symbol: string) => {
    return await enhancedRedisService.getCachedMarketData(symbol)
  }, [])

  const cacheOrderBook = useCallback(async (symbol: string, data: any) => {
    return await enhancedRedisService.cacheOrderBook(symbol, data)
  }, [])

  const getOrderBook = useCallback(async (symbol: string) => {
    return await enhancedRedisService.getCachedOrderBook(symbol)
  }, [])

  return {
    cacheMarketData,
    getMarketData,
    cacheOrderBook,
    getOrderBook,
    ...operations
  }
}

export function useAgentCache() {
  const { operations } = useRedisCache()

  const cacheAgentStatus = useCallback(async (agentId: string, data: any) => {
    return await enhancedRedisService.cacheAgentStatus(agentId, data)
  }, [])

  const getAgentStatus = useCallback(async (agentId: string) => {
    return await enhancedRedisService.getCachedAgentStatus(agentId)
  }, [])

  const cacheAgentPerformance = useCallback(async (agentId: string, data: any) => {
    return await enhancedRedisService.cacheAgentPerformance(agentId, data)
  }, [])

  const getAgentPerformance = useCallback(async (agentId: string) => {
    return await enhancedRedisService.getCachedAgentPerformance(agentId)
  }, [])

  return {
    cacheAgentStatus,
    getAgentStatus,
    cacheAgentPerformance,
    getAgentPerformance,
    ...operations
  }
}

export function useChartDataCache() {
  const { operations } = useRedisCache()

  const cacheChartData = useCallback(async (symbol: string, timeframe: string, data: any) => {
    return await enhancedRedisService.cacheChartData(symbol, timeframe, data)
  }, [])

  const getChartData = useCallback(async (symbol: string, timeframe: string) => {
    return await enhancedRedisService.getCachedChartData(symbol, timeframe)
  }, [])

  return {
    cacheChartData,
    getChartData,
    ...operations
  }
}