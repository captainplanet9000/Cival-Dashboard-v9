'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { paperTradingEngine, TradingAgent, Order, Position } from '@/lib/trading/real-paper-trading-engine'
import { useBackendData } from '@/lib/hooks/useBackendData'
import { backendClient } from '@/lib/api/backend-client'
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

// Comprehensive dashboard state management
export interface DashboardState {
  // Overview metrics
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
  
  // Farm metrics
  activeFarms: number
  farmPerformance: Map<string, FarmPerformance>
  
  // Goal tracking
  activeGoals: number
  goalProgress: Map<string, number>
  
  // Market data
  marketPrices: Map<string, number>
  marketVolumes: Map<string, number>
  
  // System status
  isConnected: boolean
  lastUpdate: Date
}

interface AgentPerformance {
  agentId: string
  name: string
  portfolioValue: number
  pnl: number
  winRate: number
  tradeCount: number
  status: 'active' | 'paused' | 'stopped'
}

interface FarmPerformance {
  farmId: string
  name: string
  totalValue: number
  totalPnL: number
  agentCount: number
  coordinationMode: string
}

// Hook to connect any dashboard tab to the backend API
export function useDashboardConnection(tabId: string) {
  // Use the backend data hook
  const backendData = useBackendData({
    autoRefresh: true,
    refreshInterval: 5000, // 5 seconds
    retryCount: 3,
    enableMonitoring: true
  })

  const [localState, setLocalState] = useState<DashboardState>({
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
    activeFarms: 0,
    farmPerformance: new Map(),
    activeGoals: 0,
    goalProgress: new Map(),
    marketPrices: new Map(),
    marketVolumes: new Map(),
    isConnected: false,
    lastUpdate: new Date()
  })
  
  const updateInterval = useRef<NodeJS.Timeout>()
  
  // Transform backend data to dashboard state
  useEffect(() => {
    console.log(`[DashboardTabConnector] Connecting tab: ${tabId}`)
    console.log('[DashboardTabConnector] Backend data status:', {
      portfolio: !!backendData.portfolio,
      agents: !!backendData.agents,
      isConnected: backendData.isConnected,
      isLoading: backendData.isLoading
    })
    
    // Transform backend data to dashboard state format OR load fallback data
    if (backendData.portfolio || backendData.agents) {
      const portfolio = backendData.portfolio
      const agents = backendData.agents
      
      // Calculate portfolio metrics
      const portfolioValue = portfolio?.total_equity || 0
      const totalPnL = portfolio?.total_pnl || 0
      const dailyPnL = portfolio?.daily_pnl || 0
      
      // Transform agent data
      const agentPerformance = new Map<string, AgentPerformance>()
      if (agents?.agents) {
        agents.agents.forEach(agent => {
          agentPerformance.set(agent.id, {
            agentId: agent.id,
            name: agent.name,
            portfolioValue: agent.performance.total_pnl || 0,
            pnl: agent.performance.total_pnl || 0,
            winRate: agent.performance.win_rate || 0,
            tradeCount: agent.performance.total_trades || 0,
            status: agent.status as 'active' | 'paused' | 'stopped'
          })
        })
      }

      // Transform positions data
      const openPositions: Position[] = backendData.positions.map(pos => ({
        ...pos,
        id: pos.symbol,
        agentId: 'backend',
        entryPrice: pos.avg_cost,
        currentPrice: pos.current_price,
        value: pos.market_value,
        pnl: pos.unrealized_pnl
      }))

      // Load farm data from localStorage (fallback)
      let farmPerformance = new Map<string, FarmPerformance>()
      try {
        const storedFarms = localStorage.getItem('trading_farms')
        const farms = storedFarms ? JSON.parse(storedFarms) : []
        
        farms.forEach((farm: any) => {
          if (farm && farm.id) {
            farmPerformance.set(farm.id, {
              farmId: farm.id,
              name: farm.name || 'Unknown Farm',
              totalValue: farm.totalValue || farm.performance?.totalValue || 50000,
              totalPnL: farm.totalPnL || farm.performance?.totalPnL || 0,
              agentCount: farm.agents?.length || 0,
              coordinationMode: farm.coordinationMode || 'independent'
            })
          }
        })
      } catch (error) {
        console.error('[DashboardTabConnector] Error loading farm data:', error)
        farmPerformance = new Map()
      }

      // Load goal data from localStorage (fallback)
      let goalProgress = new Map<string, number>()
      try {
        const storedGoals = localStorage.getItem('trading_goals')
        const goals = storedGoals ? JSON.parse(storedGoals) : []
        
        goals.forEach((goal: any) => {
          if (goal && goal.id) {
            let progress = 0
            switch (goal.type) {
              case 'profit':
                progress = Math.min((totalPnL / Math.max(goal.target || 1, 1)) * 100, 100)
                break
              case 'winRate':
                const agentValues = Array.from(agentPerformance.values())
                const avgWinRate = agentValues.length > 0 
                  ? agentValues.reduce((sum, agent) => sum + (agent.winRate || 0), 0) / agentValues.length
                  : 0
                progress = Math.min((avgWinRate / Math.max(goal.target || 1, 1)) * 100, 100)
                break
              case 'trades':
                const agentTradeValues = Array.from(agentPerformance.values())
                const totalTrades = agentTradeValues.reduce((sum, agent) => sum + (agent.tradeCount || 0), 0)
                progress = Math.min((totalTrades / Math.max(goal.target || 1, 1)) * 100, 100)
                break
            }
            goalProgress.set(goal.id, Math.max(0, Math.min(100, progress)))
          }
        })
      } catch (error) {
        console.error('[DashboardTabConnector] Error loading goal data:', error)
        goalProgress = new Map()
      }

      // Mock market data for now
      const marketPrices = new Map<string, number>()
      const marketVolumes = new Map<string, number>()
      
      // Add some default symbols
      const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD']
      symbols.forEach(symbol => {
        marketPrices.set(symbol, 45000 + Math.random() * 10000)
        marketVolumes.set(symbol, Math.random() * 1000000)
      })

      setLocalState({
        portfolioValue,
        totalPnL,
        dailyPnL,
        weeklyPnL: totalPnL * 0.3, // Mock
        monthlyPnL: totalPnL * 0.8, // Mock
        activeAgents: agents?.active_agents || 0,
        totalAgents: agents?.total_agents || 0,
        agentPerformance,
        openPositions,
        pendingOrders: [], // TODO: Get from backend
        executedOrders: [], // TODO: Get from backend
        winRate: Array.from(agentPerformance.values())
          .reduce((sum, agent) => sum + agent.winRate, 0) / (agentPerformance.size || 1),
        avgWinLoss: 0, // TODO: Calculate
        activeFarms: farms.filter((f: any) => f.status === 'active').length,
        farmPerformance,
        activeGoals: goals.filter((g: any) => g.status === 'active').length,
        goalProgress,
        marketPrices,
        marketVolumes,
        isConnected: backendData.isConnected,
        lastUpdate: backendData.lastUpdate || new Date()
      })
    } else {
      // Fallback: Load localStorage data when backend is not available
      console.log('[DashboardTabConnector] Loading localStorage fallback data')
      loadLocalStorageData()
    }
  }, [
    tabId, 
    backendData.portfolio, 
    backendData.agents, 
    backendData.positions, 
    backendData.isConnected, 
    backendData.lastUpdate
  ])

  // Load data from localStorage when backend is not available
  const loadLocalStorageData = useCallback(() => {
    try {
      // Load farm data from localStorage
      let farmPerformance = new Map<string, FarmPerformance>()
      try {
        const storedFarms = localStorage.getItem('trading_farms')
        const farms = storedFarms ? JSON.parse(storedFarms) : []
        
        farms.forEach((farm: any) => {
          if (farm && farm.id) {
            farmPerformance.set(farm.id, {
              farmId: farm.id,
              name: farm.name || 'Unknown Farm',
              totalValue: farm.totalValue || farm.performance?.totalValue || 50000,
              totalPnL: farm.totalPnL || farm.performance?.totalPnL || 0,
              agentCount: farm.agents?.length || 0,
              coordinationMode: farm.coordinationMode || 'independent'
            })
          }
        })
      } catch (error) {
        console.error('[DashboardTabConnector] Error loading farm data:', error)
      }

      // Load goal data from localStorage  
      let goalProgress = new Map<string, number>()
      try {
        const storedGoals = localStorage.getItem('trading_goals')
        const goals = storedGoals ? JSON.parse(storedGoals) : []
        
        goals.forEach((goal: any) => {
          if (goal && goal.id) {
            goalProgress.set(goal.id, goal.progress || 0)
          }
        })
      } catch (error) {
        console.error('[DashboardTabConnector] Error loading goal data:', error)
      }

      // Mock market data
      const marketPrices = new Map<string, number>()
      const marketVolumes = new Map<string, number>()
      const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD']
      symbols.forEach(symbol => {
        marketPrices.set(symbol, 45000 + Math.random() * 10000)
        marketVolumes.set(symbol, Math.random() * 1000000)
      })

      // Calculate total farm values
      const totalFarmValue = Array.from(farmPerformance.values())
        .reduce((sum, farm) => sum + (farm.totalValue || 0), 0)
      const totalFarmPnL = Array.from(farmPerformance.values())
        .reduce((sum, farm) => sum + (farm.totalPnL || 0), 0)

      setLocalState({
        portfolioValue: totalFarmValue || 100000,
        totalPnL: totalFarmPnL || 2500,
        dailyPnL: totalFarmPnL * 0.1 || 250,
        weeklyPnL: totalFarmPnL * 0.3 || 750,
        monthlyPnL: totalFarmPnL * 0.8 || 2000,
        activeAgents: farmPerformance.size,
        totalAgents: farmPerformance.size,
        agentPerformance: new Map(),
        openPositions: [],
        pendingOrders: [],
        executedOrders: [],
        winRate: 65,
        avgWinLoss: 1.2,
        activeFarms: farmPerformance.size,
        farmPerformance,
        activeGoals: goalProgress.size,
        goalProgress,
        marketPrices,
        marketVolumes,
        isConnected: false,
        lastUpdate: new Date()
      })
      
      console.log('[DashboardTabConnector] Loaded localStorage data:', {
        farms: farmPerformance.size,
        goals: goalProgress.size,
        totalValue: totalFarmValue
      })
    } catch (error) {
      console.error('[DashboardTabConnector] Error loading localStorage data:', error)
    }
  }, [])

  // Initial data load on mount
  useEffect(() => {
    console.log('[DashboardTabConnector] Initial mount, loading fallback data')
    loadLocalStorageData()
  }, [loadLocalStorageData])
  
  // Legacy paper trading engine integration (fallback)
  const updateDashboardStateFromPaperEngine = useCallback(() => {
    try {
      const allAgents = paperTradingEngine.getAllAgents() || []
      const prices = paperTradingEngine.getCurrentPrices() || new Map()
      
      // Only use paper trading engine if backend is not connected
      if (!backendData.isConnected && allAgents.length > 0) {
        console.log('[DashboardTabConnector] Using paper trading engine fallback')
        
        const portfolioValue = allAgents.reduce((sum, agent) => {
          const value = agent?.portfolio?.totalValue || 0
          return sum + value
        }, 0)
        
        const totalPnL = portfolioValue - (allAgents.length * 10000)
        
        const agentPerformance = new Map<string, AgentPerformance>()
        allAgents.forEach(agent => {
          if (agent && agent.id) {
            agentPerformance.set(agent.id, {
              agentId: agent.id,
              name: agent.name || 'Unknown Agent',
              portfolioValue: agent.portfolio?.totalValue || 0,
              pnl: (agent.portfolio?.totalValue || 0) - 10000,
              winRate: agent.performance?.winRate || 0,
              tradeCount: agent.performance?.totalTrades || 0,
              status: agent.isActive ? 'active' : 'paused'
            })
          }
        })

        setLocalState(prev => ({
          ...prev,
          portfolioValue,
          totalPnL,
          dailyPnL: totalPnL * 0.1,
          agentPerformance,
          activeAgents: allAgents.filter(a => a.isActive).length,
          totalAgents: allAgents.length,
          isConnected: true,
          lastUpdate: new Date()
        }))
      }
    } catch (error) {
      console.error('[DashboardTabConnector] Paper engine fallback error:', error)
    }
  }, [backendData.isConnected])
  
  // Set up event listeners for real-time updates
  const setupEventListeners = () => {
    const listeners: Array<{ event: string; handler: any }> = []
    
    // Agent events
    const handleAgentCreated = (agent: TradingAgent) => {
      console.log(`[DashboardTabConnector] Agent created: ${agent.name}`)
      updateDashboardState()
    }
    
    const handleOrderFilled = (order: Order) => {
      console.log(`[DashboardTabConnector] Order filled: ${order.symbol} ${order.side} ${order.quantity}`)
      updateDashboardState()
    }
    
    const handlePricesUpdated = (prices: Map<string, number>) => {
      if (prices && typeof prices.forEach === 'function') {
        setState(prev => ({
          ...prev,
          marketPrices: new Map(prices),
          lastUpdate: new Date()
        }))
      }
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
  }
  
  // Tab-specific actions using backend API
  const actions = {
    // Agent management (backend + fallback)
    createAgent: async (config: any) => {
      try {
        // Try backend first, fallback to paper trading engine
        if (backendData.isConnected) {
          // Backend agent creation would go here
          // For now, use paper trading engine
          const agent = paperTradingEngine.createAgent(config)
          toast.success(`Agent ${agent.name} created successfully`)
          await backendData.refresh()
          return agent
        } else {
          const agent = paperTradingEngine.createAgent(config)
          toast.success(`Agent ${agent.name} created successfully`)
          updateDashboardStateFromPaperEngine()
          return agent
        }
      } catch (error) {
        toast.error('Failed to create agent')
        console.error('Create agent error:', error)
        throw error
      }
    },
    
    startAgent: async (agentId: string) => {
      try {
        if (backendData.isConnected) {
          const response = await backendData.actions.startAgent(agentId)
          if (response.success) {
            toast.success('Agent started')
          } else {
            toast.error('Failed to start agent')
          }
          return response
        } else {
          paperTradingEngine.startAgent(agentId)
          toast.success('Agent started')
          updateDashboardStateFromPaperEngine()
        }
      } catch (error) {
        toast.error('Failed to start agent')
        console.error('Start agent error:', error)
      }
    },
    
    stopAgent: async (agentId: string) => {
      try {
        if (backendData.isConnected) {
          const response = await backendData.actions.stopAgent(agentId)
          if (response.success) {
            toast.success('Agent stopped')
          } else {
            toast.error('Failed to stop agent')
          }
          return response
        } else {
          paperTradingEngine.stopAgent(agentId)
          toast.success('Agent stopped')
          updateDashboardStateFromPaperEngine()
        }
      } catch (error) {
        toast.error('Failed to stop agent')
        console.error('Stop agent error:', error)
      }
    },
    
    // Trading actions (backend + fallback)
    placeOrder: async (agentId: string, order: Partial<Order>) => {
      try {
        if (backendData.isConnected) {
          const tradingOrder = {
            symbol: order.symbol || 'BTCUSD',
            side: order.side as 'buy' | 'sell' || 'buy',
            quantity: order.quantity || 0,
            price: order.price,
            order_type: order.type === 'market' ? 'market' as const : 'limit' as const,
            strategy: agentId
          }
          
          const response = await backendData.actions.createOrder(tradingOrder)
          if (response.success) {
            toast.success('Order placed')
          } else {
            toast.error('Failed to place order')
          }
          return response
        } else {
          const fullOrder: Order = {
            id: `order_${Date.now()}`,
            agentId,
            symbol: order.symbol || 'BTC/USD',
            side: order.side || 'buy',
            price: order.price || 0,
            quantity: order.quantity || 0,
            type: order.type || 'market',
            status: 'pending',
            timestamp: new Date()
          }
          
          paperTradingEngine.placeOrder(fullOrder)
          toast.success('Order placed')
          updateDashboardStateFromPaperEngine()
          return fullOrder
        }
      } catch (error) {
        toast.error('Failed to place order')
        console.error('Place order error:', error)
        throw error
      }
    },
    
    // Farm management (localStorage for now)
    createFarm: (farmConfig: any) => {
      const farmId = `farm_${Date.now()}`
      const farm = {
        id: farmId,
        ...farmConfig,
        status: 'active',
        createdAt: new Date().toISOString()
      }
      
      // Store in localStorage
      const existingFarms = localStorage.getItem('trading_farms')
      const farms = existingFarms ? JSON.parse(existingFarms) : []
      farms.push(farm)
      localStorage.setItem('trading_farms', JSON.stringify(farms))
      
      toast.success(`Farm ${farm.name} created`)
      // Trigger re-render
      setLocalState(prev => ({ ...prev, lastUpdate: new Date() }))
      return farm
    },
    
    // Goal management (localStorage for now)
    createGoal: (goalConfig: any) => {
      const goalId = `goal_${Date.now()}`
      const goal = {
        id: goalId,
        ...goalConfig,
        status: 'active',
        progress: 0,
        createdAt: new Date().toISOString()
      }
      
      // Store in localStorage
      const existingGoals = localStorage.getItem('trading_goals')
      const goals = existingGoals ? JSON.parse(existingGoals) : []
      goals.push(goal)
      localStorage.setItem('trading_goals', JSON.stringify(goals))
      
      toast.success(`Goal ${goal.name} created`)
      // Trigger re-render
      setLocalState(prev => ({ ...prev, lastUpdate: new Date() }))
      return goal
    },
    
    // Refresh data
    refresh: async () => {
      try {
        if (backendData.isConnected) {
          await backendData.refresh()
          toast.success('Dashboard refreshed')
        } else {
          updateDashboardStateFromPaperEngine()
          toast.success('Dashboard refreshed (offline mode)')
        }
      } catch (error) {
        toast.error('Failed to refresh dashboard')
        console.error('Refresh error:', error)
      }
    }
  }
  
  return {
    state: localState,
    actions,
    isConnected: localState.isConnected,
    isLoading: backendData.isLoading,
    error: backendData.error,
    backendConnected: backendData.isConnected,
    monitoring: backendData.monitoring,
    systemMetrics: backendData.systemMetrics
  }
}

// Export types for use in components
export type { AgentPerformance, FarmPerformance }
export type DashboardActions = ReturnType<typeof useDashboardConnection>['actions']