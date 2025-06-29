'use client'

import React, { useEffect, useState, useRef } from 'react'
import { paperTradingEngine, TradingAgent, Order, Position } from '@/lib/trading/real-paper-trading-engine'
import { toast } from 'react-hot-toast'

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

// Hook to connect any dashboard tab to the paper trading engine
export function useDashboardConnection(tabId: string) {
  const [state, setState] = useState<DashboardState>({
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
  
  // Initialize connection and data refresh
  useEffect(() => {
    console.log(`[DashboardTabConnector] Connecting tab: ${tabId}`)
    
    // Initial data load
    updateDashboardState()
    setState(prev => ({ ...prev, isConnected: true }))
    
    // Set up real-time listeners
    const listeners = setupEventListeners()
    
    // Set up periodic updates
    updateInterval.current = setInterval(updateDashboardState, 5000) // Update every 5 seconds
    
    // Cleanup
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
      }
      
      // Remove event listeners
      listeners.forEach(({ event, handler }) => {
        paperTradingEngine.off(event, handler)
      })
      
      setState(prev => ({ ...prev, isConnected: false }))
    }
  }, [tabId])
  
  // Update all dashboard state from paper trading engine
  const updateDashboardState = () => {
    try {
      const allAgents = paperTradingEngine.getAllAgents()
      const prices = paperTradingEngine.getCurrentPrices()
      
      // Calculate portfolio metrics
      const portfolioValue = allAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
      const totalPnL = portfolioValue - (allAgents.length * 10000) // Assuming $10k starting capital per agent
      
      // Calculate time-based P&L (mock calculation for now)
      const dailyPnL = totalPnL * 0.1 // Mock 10% of total as daily
      const weeklyPnL = totalPnL * 0.3 // Mock 30% of total as weekly
      const monthlyPnL = totalPnL * 0.8 // Mock 80% of total as monthly
      
      // Agent performance metrics
      const agentPerformance = new Map<string, AgentPerformance>()
      allAgents.forEach(agent => {
        agentPerformance.set(agent.id, {
          agentId: agent.id,
          name: agent.name,
          portfolioValue: agent.portfolio.totalValue,
          pnl: agent.portfolio.totalValue - 10000,
          winRate: agent.performance.winRate || 0,
          tradeCount: agent.performance.totalTrades || 0,
          status: agent.isActive ? 'active' : 'paused'
        })
      })
      
      // Collect all positions and orders
      const openPositions: Position[] = []
      const pendingOrders: Order[] = []
      const executedOrders: Order[] = []
      
      allAgents.forEach(agent => {
        openPositions.push(...agent.portfolio.positions)
        agent.orders.forEach(order => {
          if (order.status === 'pending') {
            pendingOrders.push(order)
          } else if (order.status === 'filled') {
            executedOrders.push(order)
          }
        })
      })
      
      // Calculate win rate
      const winningTrades = executedOrders.filter(order => {
        const position = openPositions.find(p => p.symbol === order.symbol)
        if (!position) return false
        const currentPrice = prices.get(order.symbol) || order.price
        const pnl = order.side === 'buy' 
          ? (currentPrice - order.price) * order.quantity
          : (order.price - currentPrice) * order.quantity
        return pnl > 0
      }).length
      
      const winRate = executedOrders.length > 0 
        ? (winningTrades / executedOrders.length) * 100 
        : 0
      
      // Load farm data from localStorage
      const storedFarms = localStorage.getItem('trading_farms')
      const farms = storedFarms ? JSON.parse(storedFarms) : []
      const farmPerformance = new Map<string, FarmPerformance>()
      
      farms.forEach((farm: any) => {
        const farmAgents = allAgents.filter(agent => 
          farm.agents?.includes(agent.id)
        )
        
        farmPerformance.set(farm.id, {
          farmId: farm.id,
          name: farm.name,
          totalValue: farmAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0),
          totalPnL: farmAgents.reduce((sum, agent) => sum + (agent.portfolio.totalValue - 10000), 0),
          agentCount: farmAgents.length,
          coordinationMode: farm.coordinationMode || 'independent'
        })
      })
      
      // Load goal data from localStorage
      const storedGoals = localStorage.getItem('trading_goals')
      const goals = storedGoals ? JSON.parse(storedGoals) : []
      const goalProgress = new Map<string, number>()
      
      goals.forEach((goal: any) => {
        // Calculate progress based on goal type
        let progress = 0
        switch (goal.type) {
          case 'profit':
            progress = Math.min((totalPnL / goal.target) * 100, 100)
            break
          case 'winRate':
            progress = Math.min((winRate / goal.target) * 100, 100)
            break
          case 'trades':
            const totalTrades = allAgents.reduce((sum, agent) => 
              sum + (agent.performance.totalTrades || 0), 0
            )
            progress = Math.min((totalTrades / goal.target) * 100, 100)
            break
        }
        goalProgress.set(goal.id, progress)
      })
      
      // Convert price map to state format
      const marketPrices = new Map<string, number>()
      const marketVolumes = new Map<string, number>()
      
      prices.forEach((price, symbol) => {
        marketPrices.set(symbol, price)
        marketVolumes.set(symbol, Math.random() * 1000000) // Mock volume
      })
      
      // Update state
      setState({
        portfolioValue,
        totalPnL,
        dailyPnL,
        weeklyPnL,
        monthlyPnL,
        activeAgents: allAgents.filter(a => a.isActive).length,
        totalAgents: allAgents.length,
        agentPerformance,
        openPositions,
        pendingOrders,
        executedOrders,
        winRate,
        avgWinLoss: 0, // TODO: Calculate average win/loss
        activeFarms: farms.filter((f: any) => f.status === 'active').length,
        farmPerformance,
        activeGoals: goals.filter((g: any) => g.status === 'active').length,
        goalProgress,
        marketPrices,
        marketVolumes,
        isConnected: true,
        lastUpdate: new Date()
      })
      
    } catch (error) {
      console.error('[DashboardTabConnector] Error updating state:', error)
      toast.error('Failed to update dashboard data')
    }
  }
  
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
  }
  
  // Tab-specific actions
  const actions = {
    // Agent management
    createAgent: (config: any) => {
      const agent = paperTradingEngine.createAgent(config)
      toast.success(`Agent ${agent.name} created successfully`)
      updateDashboardState()
      return agent
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
    
    // Trading actions
    placeOrder: (agentId: string, order: Partial<Order>) => {
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
      updateDashboardState()
    },
    
    // Farm management
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
      updateDashboardState()
      return farm
    },
    
    // Goal management
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
      updateDashboardState()
      return goal
    },
    
    // Refresh data
    refresh: () => {
      updateDashboardState()
      toast.success('Dashboard refreshed')
    }
  }
  
  return {
    state,
    actions,
    isConnected: state.isConnected
  }
}

// Export types for use in components
export type { AgentPerformance, FarmPerformance }
export type DashboardActions = ReturnType<typeof useDashboardConnection>['actions']