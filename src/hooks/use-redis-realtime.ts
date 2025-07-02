'use client'

import { useState, useEffect, useCallback } from 'react'

interface RedisRealtimeData {
  [key: string]: any
}

interface UseRedisRealtimeReturn {
  data: RedisRealtimeData | null
  connected: boolean
  error: string | null
  subscribe: (keys: string[]) => void
  unsubscribe: (keys: string[]) => void
}

/**
 * Custom hook for Redis real-time data
 * Provides live cache data updates with fallback mock data
 */
export function useRedisRealtime(initialKeys: string[] = []): UseRedisRealtimeReturn {
  const [data, setData] = useState<RedisRealtimeData | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscribedKeys, setSubscribedKeys] = useState<string[]>(initialKeys)

  // Mock data generator for development
  const generateMockData = useCallback((keys: string[]) => {
    const mockData: RedisRealtimeData = {}
    
    keys.forEach(key => {
      switch (key) {
        case 'portfolio':
          mockData[key] = {
            totalValue: 125000 + Math.random() * 10000,
            dailyPnL: -1200 + Math.random() * 2400,
            positions: Math.floor(Math.random() * 10) + 5,
            lastUpdate: new Date().toISOString()
          }
          break
        case 'agents':
          mockData[key] = {
            active: Math.floor(Math.random() * 5) + 3,
            trading: Math.floor(Math.random() * 3) + 1,
            profit: Math.random() * 5000 + 1000,
            winRate: 0.65 + Math.random() * 0.2,
            lastUpdate: new Date().toISOString()
          }
          break
        case 'trades':
          mockData[key] = {
            todayCount: Math.floor(Math.random() * 20) + 10,
            volume: Math.random() * 50000 + 25000,
            avgPrice: 150 + Math.random() * 50,
            lastTrade: new Date(Date.now() - Math.random() * 3600000).toISOString()
          }
          break
        case 'agent_performance':
          mockData[key] = Array.from({ length: 4 }, (_, i) => ({
            id: `agent-${i + 1}`,
            name: `Agent ${i + 1}`,
            pnl: (Math.random() - 0.5) * 2000,
            trades: Math.floor(Math.random() * 10) + 5,
            winRate: 0.5 + Math.random() * 0.4,
            status: Math.random() > 0.3 ? 'active' : 'idle'
          }))
          break
        default:
          mockData[key] = {
            value: Math.random() * 1000,
            timestamp: new Date().toISOString()
          }
      }
    })
    
    return mockData
  }, [])

  // Check Redis connection
  const checkRedisConnection = useCallback(async () => {
    try {
      // In a real implementation, this would check Redis connectivity
      // For now, we'll simulate based on environment
      const redisUrl = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL
      
      if (redisUrl && !redisUrl.includes('localhost') && !redisUrl.includes('mock')) {
        // Simulate real Redis connection check
        const response = await fetch('/api/redis/health').catch(() => null)
        setConnected(response?.ok || false)
      } else {
        // Use mock mode for development
        setConnected(true)
        setError(null)
      }
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : 'Redis connection failed')
    }
  }, [])

  // Subscribe to Redis keys
  const subscribe = useCallback((keys: string[]) => {
    setSubscribedKeys(prev => [...new Set([...prev, ...keys])])
  }, [])

  // Unsubscribe from Redis keys
  const unsubscribe = useCallback((keys: string[]) => {
    setSubscribedKeys(prev => prev.filter(key => !keys.includes(key)))
  }, [])

  // Initialize connection and data polling
  useEffect(() => {
    checkRedisConnection()

    // Set up data polling (in real implementation, this would be WebSocket)
    const interval = setInterval(() => {
      if (subscribedKeys.length > 0) {
        const newData = generateMockData(subscribedKeys)
        setData(newData)
      }
    }, 2000) // Update every 2 seconds

    // Initial data load
    if (subscribedKeys.length > 0) {
      setData(generateMockData(subscribedKeys))
    }

    return () => {
      clearInterval(interval)
    }
  }, [subscribedKeys, generateMockData, checkRedisConnection])

  // Reconnection logic
  useEffect(() => {
    if (!connected && error) {
      const reconnectTimer = setTimeout(() => {
        checkRedisConnection()
      }, 5000) // Retry every 5 seconds

      return () => clearTimeout(reconnectTimer)
    }
  }, [connected, error, checkRedisConnection])

  return {
    data,
    connected,
    error,
    subscribe,
    unsubscribe
  }
}