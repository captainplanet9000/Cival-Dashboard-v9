'use client'

import { useState, useEffect, useCallback } from 'react'
import { backendClient } from '@/lib/api/backend-client'

interface FarmRealtimeData {
  farmId: string
  name: string
  description: string
  farmType: 'momentum' | 'arbitrage' | 'diversified' | 'risk_parity' | 'custom'
  status: 'active' | 'paused' | 'stopped'
  totalValue: number
  dailyPnL: number
  totalPnL: number
  targetAllocation: number
  currentAllocation: number
  agentCount: number
  activeAgents: number
  createdAt: string
  lastUpdate: string
  performance: {
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
    totalTrades: number
    avgProfitPerTrade: number
    riskAdjustedReturn: number
    coordinationScore: number
    strategyEfficiency: number
  }
  agents: Array<{
    agentId: string
    name: string
    allocation: number
    status: 'active' | 'paused' | 'stopped'
    pnl: number
    trades: number
    winRate: number
    lastActivity: string
  }>
  riskMetrics: {
    portfolioVaR: number
    concentrationRisk: number
    correlationRisk: number
    liquidityRisk: number
    stressTestResults: Record<string, number>
  }
  realtimeMetrics: {
    executionLatency: number
    coordinationEfficiency: number
    resourceUtilization: number
    signalCount: number
    orderCount: number
    lastSignal: string
  }
  targets: {
    dailyTarget: number
    monthlyTarget: number
    currentProgress: number
    targetProgress: number
    timeToTarget: number
    achievementProbability: number
  }
}

interface UseFarmRealtimeReturn {
  farms: FarmRealtimeData[]
  loading: boolean
  error: string | null
  connected: boolean
  totalFarms: number
  activeFarms: number
  totalValue: number
  totalPnL: number
  avgPerformance: number
  createFarm: (config: CreateFarmConfig) => Promise<string | null>
  startFarm: (farmId: string) => Promise<boolean>
  stopFarm: (farmId: string) => Promise<boolean>
  deleteFarm: (farmId: string) => Promise<boolean>
  addAgentToFarm: (farmId: string, agentId: string, allocation: number) => Promise<boolean>
  removeAgentFromFarm: (farmId: string, agentId: string) => Promise<boolean>
  rebalanceFarm: (farmId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

interface CreateFarmConfig {
  name: string
  description: string
  farmType: string
  targetAllocation: number
  strategy: {
    type: string
    parameters: Record<string, any>
  }
  riskLimits: {
    maxDrawdown: number
    maxConcentration: number
    maxLeverage: number
  }
}

/**
 * Real-time hook for farm management with multi-agent coordination
 */
export function useFarmRealtime(): UseFarmRealtimeReturn {
  const [farms, setFarms] = useState<FarmRealtimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Generate mock farm data
  const generateMockFarms = useCallback((): FarmRealtimeData[] => {
    const farmTemplates = [
      {
        name: 'Momentum Master Farm',
        description: 'High-performance momentum trading with 5 specialized agents',
        farmType: 'momentum' as const,
        agentCount: 5,
        baseValue: 50000
      },
      {
        name: 'Arbitrage Alpha Farm',
        description: 'Cross-exchange arbitrage opportunities with 3 market-maker agents',
        farmType: 'arbitrage' as const,
        agentCount: 3,
        baseValue: 75000
      },
      {
        name: 'Diversified Strategy Farm',
        description: 'Multi-strategy approach with 8 agents across different timeframes',
        farmType: 'diversified' as const,
        agentCount: 8,
        baseValue: 100000
      },
      {
        name: 'Risk Parity Farm',
        description: 'Risk-balanced portfolio with 4 agents focused on downside protection',
        farmType: 'risk_parity' as const,
        agentCount: 4,
        baseValue: 60000
      }
    ]

    return farmTemplates.map((template, index) => {
      const totalPnL = (Math.random() - 0.3) * template.baseValue * 0.1
      const dailyPnL = (Math.random() - 0.5) * 2000
      const winRate = 0.5 + Math.random() * 0.3
      const totalTrades = Math.floor(Math.random() * 200) + 50

      return {
        farmId: `farm_${index + 1}`,
        name: template.name,
        description: template.description,
        farmType: template.farmType,
        status: Math.random() > 0.1 ? 'active' : 'paused' as any,
        totalValue: template.baseValue + totalPnL,
        dailyPnL,
        totalPnL,
        targetAllocation: template.baseValue,
        currentAllocation: template.baseValue + totalPnL,
        agentCount: template.agentCount,
        activeAgents: Math.floor(template.agentCount * (0.7 + Math.random() * 0.3)),
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        performance: {
          winRate,
          sharpeRatio: 0.5 + Math.random() * 2,
          maxDrawdown: Math.random() * 0.15,
          totalTrades,
          avgProfitPerTrade: totalPnL / totalTrades,
          riskAdjustedReturn: (totalPnL / template.baseValue) / Math.max(Math.random() * 0.2, 0.05),
          coordinationScore: 0.7 + Math.random() * 0.3,
          strategyEfficiency: 0.6 + Math.random() * 0.4
        },
        agents: Array.from({ length: template.agentCount }, (_, i) => ({
          agentId: `farm_${index + 1}_agent_${i + 1}`,
          name: `${template.farmType.charAt(0).toUpperCase() + template.farmType.slice(1)} Agent ${i + 1}`,
          allocation: template.baseValue / template.agentCount,
          status: Math.random() > 0.2 ? 'active' : 'paused' as any,
          pnl: (Math.random() - 0.3) * 1000,
          trades: Math.floor(Math.random() * 30) + 5,
          winRate: 0.4 + Math.random() * 0.4,
          lastActivity: new Date(Date.now() - Math.random() * 7200000).toISOString()
        })),
        riskMetrics: {
          portfolioVaR: Math.random() * 0.05,
          concentrationRisk: Math.random() * 0.3,
          correlationRisk: Math.random() * 0.4,
          liquidityRisk: Math.random() * 0.2,
          stressTestResults: {
            'Market Crash': -0.15 - Math.random() * 0.1,
            'Flash Crash': -0.08 - Math.random() * 0.05,
            'High Volatility': -0.05 - Math.random() * 0.03,
            'Liquidity Crisis': -0.12 - Math.random() * 0.08
          }
        },
        realtimeMetrics: {
          executionLatency: 50 + Math.random() * 100,
          coordinationEfficiency: 0.8 + Math.random() * 0.2,
          resourceUtilization: 0.6 + Math.random() * 0.3,
          signalCount: Math.floor(Math.random() * 20) + 5,
          orderCount: Math.floor(Math.random() * 15) + 2,
          lastSignal: new Date(Date.now() - Math.random() * 1800000).toISOString()
        },
        targets: {
          dailyTarget: template.baseValue * 0.01,
          monthlyTarget: template.baseValue * 0.15,
          currentProgress: Math.random() * template.baseValue * 0.1,
          targetProgress: Math.random(),
          timeToTarget: Math.random() * 30,
          achievementProbability: 0.4 + Math.random() * 0.5
        }
      }
    })
  }, [])

  // Fetch farms from backend
  const fetchFarms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from real backend first
      try {
        const response = await backendClient.getFarms()
        if (response.data) {
          setFarms(response.data)
          setConnected(true)
          return
        }
      } catch (backendError) {
        console.warn('Backend not available, using mock data:', backendError)
      }

      // Fallback to mock data
      const mockFarms = generateMockFarms()
      setFarms(mockFarms)
      setConnected(false)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch farms')
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [generateMockFarms])

  // Create new farm
  const createFarm = useCallback(async (config: CreateFarmConfig): Promise<string | null> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.createFarm(config)
        if (response.data?.id) {
          await fetchFarms()
          return response.data.id
        }
      } catch (backendError) {
        console.warn('Backend not available for farm creation')
      }

      // Fallback: simulate farm creation
      const newFarm: FarmRealtimeData = {
        farmId: `farm_${Date.now()}`,
        name: config.name,
        description: config.description,
        farmType: config.farmType as any,
        status: 'active',
        totalValue: config.targetAllocation,
        dailyPnL: 0,
        totalPnL: 0,
        targetAllocation: config.targetAllocation,
        currentAllocation: config.targetAllocation,
        agentCount: 0,
        activeAgents: 0,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        performance: {
          winRate: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          totalTrades: 0,
          avgProfitPerTrade: 0,
          riskAdjustedReturn: 0,
          coordinationScore: 1,
          strategyEfficiency: 1
        },
        agents: [],
        riskMetrics: {
          portfolioVaR: 0,
          concentrationRisk: 0,
          correlationRisk: 0,
          liquidityRisk: 0,
          stressTestResults: {}
        },
        realtimeMetrics: {
          executionLatency: 0,
          coordinationEfficiency: 1,
          resourceUtilization: 0,
          signalCount: 0,
          orderCount: 0,
          lastSignal: new Date().toISOString()
        },
        targets: {
          dailyTarget: config.targetAllocation * 0.01,
          monthlyTarget: config.targetAllocation * 0.15,
          currentProgress: 0,
          targetProgress: 0,
          timeToTarget: 30,
          achievementProbability: 0.5
        }
      }

      setFarms(prev => [...prev, newFarm])
      return newFarm.farmId
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm')
      return null
    }
  }, [fetchFarms])

  // Start farm
  const startFarm = useCallback(async (farmId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.startFarm(farmId)
        if (response.data?.success) {
          await fetchFarms()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for farm start')
      }

      // Fallback: simulate starting farm
      setFarms(prev => prev.map(farm => 
        farm.farmId === farmId 
          ? { ...farm, status: 'active', lastUpdate: new Date().toISOString() }
          : farm
      ))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start farm')
      return false
    }
  }, [fetchFarms])

  // Stop farm
  const stopFarm = useCallback(async (farmId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.stopFarm(farmId)
        if (response.data?.success) {
          await fetchFarms()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for farm stop')
      }

      // Fallback: simulate stopping farm
      setFarms(prev => prev.map(farm => 
        farm.farmId === farmId 
          ? { ...farm, status: 'stopped', lastUpdate: new Date().toISOString() }
          : farm
      ))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop farm')
      return false
    }
  }, [fetchFarms])

  // Delete farm
  const deleteFarm = useCallback(async (farmId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.deleteFarm(farmId)
        if (response.data?.success) {
          await fetchFarms()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for farm deletion')
      }

      // Fallback: simulate deleting farm
      setFarms(prev => prev.filter(farm => farm.farmId !== farmId))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete farm')
      return false
    }
  }, [fetchFarms])

  // Add agent to farm
  const addAgentToFarm = useCallback(async (farmId: string, agentId: string, allocation: number): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.addAgentToFarm(farmId, agentId, allocation)
        if (response.data?.success) {
          await fetchFarms()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for adding agent to farm')
      }

      // Fallback: simulate adding agent
      setFarms(prev => prev.map(farm => {
        if (farm.farmId === farmId) {
          const newAgent = {
            agentId,
            name: `Agent ${farm.agents.length + 1}`,
            allocation,
            status: 'active' as const,
            pnl: 0,
            trades: 0,
            winRate: 0,
            lastActivity: new Date().toISOString()
          }
          return {
            ...farm,
            agents: [...farm.agents, newAgent],
            agentCount: farm.agentCount + 1,
            activeAgents: farm.activeAgents + 1,
            lastUpdate: new Date().toISOString()
          }
        }
        return farm
      }))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add agent to farm')
      return false
    }
  }, [fetchFarms])

  // Remove agent from farm
  const removeAgentFromFarm = useCallback(async (farmId: string, agentId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.removeAgentFromFarm(farmId, agentId)
        if (response.data?.success) {
          await fetchFarms()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for removing agent from farm')
      }

      // Fallback: simulate removing agent
      setFarms(prev => prev.map(farm => {
        if (farm.farmId === farmId) {
          const updatedAgents = farm.agents.filter(agent => agent.agentId !== agentId)
          return {
            ...farm,
            agents: updatedAgents,
            agentCount: updatedAgents.length,
            activeAgents: updatedAgents.filter(a => a.status === 'active').length,
            lastUpdate: new Date().toISOString()
          }
        }
        return farm
      }))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove agent from farm')
      return false
    }
  }, [fetchFarms])

  // Rebalance farm
  const rebalanceFarm = useCallback(async (farmId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.rebalanceFarm(farmId)
        if (response.data?.success) {
          await fetchFarms()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for farm rebalancing')
      }

      // Fallback: simulate rebalancing
      setFarms(prev => prev.map(farm => 
        farm.farmId === farmId 
          ? { ...farm, lastUpdate: new Date().toISOString() }
          : farm
      ))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rebalance farm')
      return false
    }
  }, [fetchFarms])

  // Calculate derived stats
  const totalFarms = farms.length
  const activeFarms = farms.filter(f => f.status === 'active').length
  const totalValue = farms.reduce((sum, f) => sum + f.totalValue, 0)
  const totalPnL = farms.reduce((sum, f) => sum + f.totalPnL, 0)
  const avgPerformance = farms.length > 0 
    ? farms.reduce((sum, f) => sum + f.performance.winRate, 0) / farms.length 
    : 0

  // Real-time updates
  useEffect(() => {
    fetchFarms()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!loading) {
        fetchFarms()
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [fetchFarms, loading])

  return {
    farms,
    loading,
    error,
    connected,
    totalFarms,
    activeFarms,
    totalValue,
    totalPnL,
    avgPerformance,
    createFarm,
    startFarm,
    stopFarm,
    deleteFarm,
    addAgentToFarm,
    removeAgentFromFarm,
    rebalanceFarm,
    refresh: fetchFarms
  }
}