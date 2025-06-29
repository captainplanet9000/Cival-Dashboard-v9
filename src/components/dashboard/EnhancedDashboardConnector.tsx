'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { paperTradingEngine, TradingAgent, Order, Position } from '@/lib/trading/real-paper-trading-engine'
import { toast } from 'react-hot-toast'

// Performance optimization: Debounce helper
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

// Enhanced Dashboard State with caching
export interface EnhancedDashboardState {
  // Core metrics
  portfolioValue: number
  totalPnL: number
  dailyPnL: number
  weeklyPnL: number
  monthlyPnL: number
  
  // Agent metrics
  activeAgents: number
  totalAgents: number
  agentPerformance: Map<string, AgentPerformance>
  
  // Trading metrics
  openPositions: Position[]
  pendingOrders: Order[]
  executedOrders: Order[]
  winRate: number
  avgWinLoss: number
  
  // Market data
  marketPrices: Map<string, number>
  marketVolumes: Map<string, number>
  
  // System status
  isConnected: boolean
  isLoading: boolean
  error: string | null
  lastUpdate: Date
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'
  
  // Performance metrics
  updateLatency: number
  memoryUsage: number
  cacheHitRate: number
}

interface AgentPerformance {
  agentId: string
  name: string
  portfolioValue: number
  pnl: number
  winRate: number
  tradeCount: number
  lastActivity: Date
  status: 'active' | 'paused' | 'stopped'
}

// Enhanced cache system
class DashboardCache {
  private cache = new Map<string, { data: any, timestamp: number, ttl: number }>()
  private hitCount = 0
  private missCount = 0
  
  set(key: string, data: any, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.missCount++
      return null
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.missCount++
      return null
    }
    
    this.hitCount++
    return entry.data
  }
  
  clear() {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }
  
  getHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.hitCount / total) * 100 : 0
  }
  
  getSize(): number {
    return this.cache.size
  }
}

// Global cache instance
const dashboardCache = new DashboardCache()

// Enhanced hook with performance optimizations
export function useEnhancedDashboardConnection(tabId: string) {
  const [state, setState] = useState<EnhancedDashboardState>({
    portfolioValue: 0,
    totalPnL: 0,
    dailyPnL: 0,
    weeklyPnL: 0,
    monthlyPnL: 0,
    activeAgents: 0,
    totalAgents: 0,
    agentPerformance: new Map(),
    openPositions: [],
    pendingOrders: [],
    executedOrders: [],
    winRate: 0,
    avgWinLoss: 0,
    marketPrices: new Map(),
    marketVolumes: new Map(),
    isConnected: false,
    isLoading: true,
    error: null,
    lastUpdate: new Date(),
    connectionQuality: 'disconnected',
    updateLatency: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  })
  
  const updateInterval = useRef<NodeJS.Timeout>()
  const retryCount = useRef(0)
  const maxRetries = 3
  const lastUpdateTime = useRef<number>(0)
  
  // Debounced update function
  const debouncedUpdate = useDebounce(updateDashboardState, 300)
  
  // Performance monitoring
  const measurePerformance = useCallback((operation: string, fn: () => any) => {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    console.log(`[Performance] ${operation}: ${(end - start).toFixed(2)}ms`)
    
    setState(prev => ({
      ...prev,
      updateLatency: end - start,
      cacheHitRate: dashboardCache.getHitRate()
    }))
    
    return result
  }, [])
  
  // Enhanced update function with caching
  const updateDashboardState = useCallback(() => {
    measurePerformance('Dashboard Update', () => {
      try {
        // Check cache first
        const cacheKey = `dashboard_${tabId}`
        const cachedData = dashboardCache.get(cacheKey)
        
        if (cachedData) {
          setState(prev => ({ ...prev, ...cachedData, lastUpdate: new Date() }))
          return
        }
        
        // Fetch fresh data with null safety
        const allAgents = paperTradingEngine.getAllAgents() || []
        const prices = paperTradingEngine.getCurrentPrices() || new Map()
        
        // Calculate metrics with null safety
        const portfolioValue = allAgents.reduce((sum, agent) => {
          const value = agent?.portfolioValue || agent?.portfolio?.totalValue || 0
          return sum + value
        }, 0)
        const totalPnL = allAgents.reduce((sum, agent) => {
          const pnl = agent?.pnl || ((agent?.portfolio?.totalValue || 0) - 10000)
          return sum + pnl
        }, 0)
        const activeAgents = allAgents.filter(agent => agent?.status === 'active' || agent?.isActive).length
        
        // Calculate win rate with null safety
        const allOrders = allAgents.flatMap(agent => agent?.orderHistory || agent?.orders || [])
        const completedOrders = allOrders.filter(order => order?.status === 'filled')
        const profitableOrders = completedOrders.filter(order => (order?.pnl || 0) > 0)
        const winRate = completedOrders.length > 0 ? (profitableOrders.length / completedOrders.length) * 100 : 0
        
        // Build agent performance map with null safety
        const agentPerformance = new Map<string, AgentPerformance>()
        allAgents.forEach(agent => {
          if (agent && agent.id) {
            agentPerformance.set(agent.id, {
              agentId: agent.id,
              name: agent.name || 'Unknown Agent',
              portfolioValue: agent.portfolioValue || agent?.portfolio?.totalValue || 0,
              pnl: agent.pnl || ((agent?.portfolio?.totalValue || 0) - 10000),
              winRate: agent.winRate || agent?.performance?.winRate || 0,
              tradeCount: agent.orderHistory?.length || agent?.orders?.length || agent?.performance?.totalTrades || 0,
              lastActivity: new Date(),
              status: (agent.status === 'active' || agent.isActive) ? 'active' : 'paused'
            })
          }
        })
        
        const newData = {
          portfolioValue,
          totalPnL,
          dailyPnL: totalPnL * 0.1, // Mock daily P&L
          weeklyPnL: totalPnL * 0.3, // Mock weekly P&L
          monthlyPnL: totalPnL,
          activeAgents,
          totalAgents: allAgents.length,
          agentPerformance,
          openPositions: allAgents.flatMap(agent => agent.positions || []),
          pendingOrders: allAgents.flatMap(agent => agent.pendingOrders || []),
          executedOrders: completedOrders,
          winRate,
          avgWinLoss: 1.2, // Mock average win/loss ratio
          marketPrices: new Map(prices),
          marketVolumes: new Map([
            ['BTC/USD', 1234567],
            ['ETH/USD', 987654],
            ['SOL/USD', 456789]
          ]),
          isConnected: true,
          error: null,
          connectionQuality: 'excellent' as const,
          memoryUsage: (process as any)?.memoryUsage?.()?.heapUsed || 0
        }
        
        // Cache the data
        dashboardCache.set(cacheKey, newData, 5000) // 5 second TTL
        
        setState(prev => ({
          ...prev,
          ...newData,
          lastUpdate: new Date(),
          isLoading: false
        }))
        
        retryCount.current = 0 // Reset retry count on success
        
      } catch (error) {
        console.error(`[EnhancedDashboard] Update error:`, error)
        handleUpdateError(error)
      }
    })
  }, [tabId, measurePerformance])
  
  // Enhanced error handling
  const handleUpdateError = useCallback((err: any) => {
    retryCount.current += 1
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    
    if (retryCount.current <= maxRetries) {
      console.log(`[EnhancedDashboard] Retrying update (${retryCount.current}/${maxRetries})`)
      
      setState(prev => ({
        ...prev,
        connectionQuality: 'poor',
        error: `Connection issue, retrying... (${retryCount.current}/${maxRetries})`
      }))
      
      setTimeout(() => {
        updateDashboardState()
      }, 2000 * retryCount.current) // Exponential backoff
    } else {
      setState(prev => ({
        ...prev,
        error: `Dashboard connection failed: ${errorMessage}`,
        isConnected: false,
        connectionQuality: 'disconnected',
        isLoading: false
      }))
    }
  }, [updateDashboardState])
  
  // Enhanced event listeners with performance monitoring
  const setupEventListeners = useCallback(() => {
    const listeners: Array<{ event: string, handler: (...args: any[]) => void }> = []
    
    const handleAgentCreated = (agent: TradingAgent) => {
      debouncedUpdate()
      toast.success(`Agent ${agent.name} created`)
    }
    
    const handleOrderFilled = (order: Order) => {
      debouncedUpdate()
      // Clear cache to force fresh data
      dashboardCache.clear()
    }
    
    const handlePricesUpdated = (prices: Map<string, number>) => {
      setState(prev => ({
        ...prev,
        marketPrices: new Map(prices),
        lastUpdate: new Date()
      }))
    }
    
    // Register listeners
    paperTradingEngine.on('agentCreated', handleAgentCreated)
    paperTradingEngine.on('orderFilled', handleOrderFilled)
    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)
    
    listeners.push(
      { event: 'agentCreated', handler: handleAgentCreated },
      { event: 'orderFilled', handler: handleOrderFilled },
      { event: 'pricesUpdated', handler: handlePricesUpdated }
    )
    
    return listeners
  }, [debouncedUpdate])
  
  // Memoized actions
  const actions = useMemo(() => ({
    refresh: () => {
      dashboardCache.clear()
      updateDashboardState()
    },
    
    createAgent: (config: any) => {
      return measurePerformance('Create Agent', () => {
        const agent = paperTradingEngine.createAgent(config)
        toast.success(`Agent ${agent.name} created successfully`)
        updateDashboardState()
        return agent
      })
    },
    
    startAgent: (agentId: string) => {
      paperTradingEngine.startAgent(agentId)
      toast.success('Agent started')
      updateDashboardState()
    },
    
    stopAgent: (agentId: string) => {
      paperTradingEngine.stopAgent(agentId)
      toast.success('Agent stopped')
      updateDashboardState()
    },
    
    placeOrder: (agentId: string, order: Partial<Order>) => {
      return measurePerformance('Place Order', () => {
        const fullOrder: Order = {
          id: `order_${Date.now()}`,
          agentId,
          symbol: order.symbol || 'BTC/USD',
          side: order.side || 'buy',
          type: order.type || 'market',
          quantity: order.quantity || 0,
          price: order.price || 0,
          status: 'pending',
          timestamp: new Date(),
          pnl: 0
        }
        
        paperTradingEngine.placeOrder(fullOrder)
        toast.success('Order placed successfully')
        
        // Clear cache to show immediate update
        dashboardCache.clear()
        updateDashboardState()
        
        return fullOrder
      })
    },
    
    // Cache management actions
    clearCache: () => {
      dashboardCache.clear()
      toast.success('Cache cleared')
      updateDashboardState()
    },
    
    getCacheStats: () => ({
      hitRate: dashboardCache.getHitRate(),
      size: dashboardCache.getSize()
    })
  }), [measurePerformance, updateDashboardState])
  
  // Initialize connection with enhanced error handling
  useEffect(() => {
    console.log(`[EnhancedDashboard] Connecting tab: ${tabId}`)
    
    const initializeTab = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        
        // Initial data load
        updateDashboardState()
        
        // Set up real-time listeners
        const listeners = setupEventListeners()
        
        // Set up periodic updates with performance monitoring
        updateInterval.current = setInterval(() => {
          const now = Date.now()
          if (now - lastUpdateTime.current > 4000) { // Avoid too frequent updates
            lastUpdateTime.current = now
            updateDashboardState()
          }
        }, 5000)
        
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionQuality: 'excellent',
          isLoading: false 
        }))
        
        // Cleanup function
        return () => {
          if (updateInterval.current) {
            clearInterval(updateInterval.current)
          }
          
          listeners.forEach(({ event, handler }) => {
            paperTradingEngine.off(event, handler)
          })
          
          setState(prev => ({ 
            ...prev, 
            isConnected: false, 
            connectionQuality: 'disconnected' 
          }))
        }
      } catch (err) {
        console.error(`[EnhancedDashboard] Initialization error:`, err)
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to initialize dashboard',
          isLoading: false,
          connectionQuality: 'disconnected'
        }))
      }
    }
    
    const cleanup = initializeTab()
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [tabId, updateDashboardState, setupEventListeners])
  
  return {
    state,
    actions,
    isLoading: state.isLoading,
    error: state.error,
    connectionQuality: state.connectionQuality
  }
}

export default useEnhancedDashboardConnection