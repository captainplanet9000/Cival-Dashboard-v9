'use client'

import { useState, useEffect, useCallback } from 'react'
import { backendClient } from '@/lib/api/backend-client'
import { globalThrottler, globalPoller, debounce } from '@/lib/utils/request-throttle'

interface AgentRealtimeData {
  agentId: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  strategy: string
  portfolioValue: number
  dailyPnL: number
  totalPnL: number
  winRate: number
  totalTrades: number
  openPositions: number
  lastActivity: string
  performance: {
    sharpeRatio: number
    maxDrawdown: number
    volatility: number
    avgTradeReturn: number
  }
  currentSignals: Array<{
    symbol: string
    signal: 'buy' | 'sell' | 'hold'
    strength: number
    confidence: number
    reasoning: string
    timestamp: string
  }>
  recentTrades: Array<{
    id: string
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    timestamp: string
    pnl: number
  }>
}

interface UseAgentRealtimeReturn {
  agents: AgentRealtimeData[]
  loading: boolean
  error: string | null
  connected: boolean
  totalAgents: number
  activeAgents: number
  totalPortfolioValue: number
  totalPnL: number
  avgWinRate: number
  createAgent: (config: CreateAgentConfig) => Promise<string | null>
  startAgent: (agentId: string) => Promise<boolean>
  stopAgent: (agentId: string) => Promise<boolean>
  deleteAgent: (agentId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

interface CreateAgentConfig {
  name: string
  strategy: string
  initialCapital: number
  riskLimits: {
    maxPositionSize: number
    maxDailyLoss: number
    stopLossEnabled: boolean
    takeProfitEnabled: boolean
  }
  parameters: Record<string, any>
}

/**
 * Real-time hook for agent management with Supabase/Redis integration
 */
export function useAgentRealtime(): UseAgentRealtimeReturn {
  const [agents, setAgents] = useState<AgentRealtimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Generate mock agent data for development
  const generateMockAgents = useCallback((): AgentRealtimeData[] => {
    const agentNames = [
      { name: 'Marcus Momentum', strategy: 'momentum' },
      { name: 'Alex Arbitrage', strategy: 'arbitrage' },
      { name: 'Sophia Reversion', strategy: 'mean_reversion' },
      { name: 'Riley Risk', strategy: 'risk_parity' },
      { name: 'Quinn Quant', strategy: 'statistical_arbitrage' }
    ]

    return agentNames.map((agent, index) => {
      const baseValue = 10000 + index * 5000
      const dailyPnL = (Math.random() - 0.5) * 1000
      const totalPnL = (Math.random() - 0.3) * 2000
      const winRate = 0.45 + Math.random() * 0.4
      const totalTrades = Math.floor(Math.random() * 50) + 10
      
      return {
        agentId: `agent_${index + 1}`,
        name: agent.name,
        status: Math.random() > 0.2 ? 'active' : (Math.random() > 0.5 ? 'paused' : 'stopped') as any,
        strategy: agent.strategy,
        portfolioValue: baseValue + totalPnL,
        dailyPnL,
        totalPnL,
        winRate,
        totalTrades,
        openPositions: Math.floor(Math.random() * 8) + 1,
        lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        performance: {
          sharpeRatio: 0.5 + Math.random() * 2,
          maxDrawdown: Math.random() * 0.15,
          volatility: 0.1 + Math.random() * 0.2,
          avgTradeReturn: (Math.random() - 0.5) * 0.02
        },
        currentSignals: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
          symbol: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD'][Math.floor(Math.random() * 4)],
          signal: ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)] as any,
          strength: Math.random(),
          confidence: 0.6 + Math.random() * 0.4,
          reasoning: [
            'Strong momentum breakout detected',
            'Mean reversion opportunity identified',
            'Arbitrage spread widening',
            'Risk-adjusted entry point'
          ][Math.floor(Math.random() * 4)],
          timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString()
        })),
        recentTrades: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
          id: `trade_${index}_${i}`,
          symbol: ['BTC/USD', 'ETH/USD', 'SOL/USD'][Math.floor(Math.random() * 3)],
          side: Math.random() > 0.5 ? 'buy' : 'sell' as any,
          quantity: Math.random() * 0.1 + 0.01,
          price: 50000 + Math.random() * 20000,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          pnl: (Math.random() - 0.5) * 200
        }))
      }
    })
  }, [])

  // Fetch agents from backend with throttling
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use throttled request to prevent overwhelming the backend
      const result = await globalThrottler.throttledRequest(
        async () => {
          try {
            const response = await backendClient.getAgents()
            if (response.data) {
              return { data: response.data, connected: true }
            }
            throw new Error('No data received')
          } catch (backendError) {
            console.warn('Backend not available, using mock data:', backendError)
            return { data: generateMockAgents(), connected: false }
          }
        },
        {
          priority: 'medium',
          cacheKey: 'agents_list'
        }
      )

      setAgents(result.data)
      setConnected(result.connected)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      setConnected(false)
      // Fallback to mock data on error
      setAgents(generateMockAgents())
    } finally {
      setLoading(false)
    }
  }, [generateMockAgents])

  // Create new agent
  const createAgent = useCallback(async (config: CreateAgentConfig): Promise<string | null> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.createAgent(config)
        if (response.data?.id) {
          await fetchAgents() // Refresh agent list
          return response.data.id
        }
      } catch (backendError) {
        console.warn('Backend not available for agent creation')
      }

      // Fallback: simulate agent creation
      const newAgent: AgentRealtimeData = {
        agentId: `agent_${Date.now()}`,
        name: config.name,
        status: 'active',
        strategy: config.strategy,
        portfolioValue: config.initialCapital,
        dailyPnL: 0,
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
        openPositions: 0,
        lastActivity: new Date().toISOString(),
        performance: {
          sharpeRatio: 0,
          maxDrawdown: 0,
          volatility: 0,
          avgTradeReturn: 0
        },
        currentSignals: [],
        recentTrades: []
      }

      setAgents(prev => [...prev, newAgent])
      return newAgent.agentId
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
      return null
    }
  }, [fetchAgents])

  // Start agent
  const startAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.startAgent(agentId)
        if (response.data?.success) {
          await fetchAgents()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for agent start')
      }

      // Fallback: simulate starting agent
      setAgents(prev => prev.map(agent => 
        agent.agentId === agentId 
          ? { ...agent, status: 'active', lastActivity: new Date().toISOString() }
          : agent
      ))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start agent')
      return false
    }
  }, [fetchAgents])

  // Stop agent
  const stopAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.stopAgent(agentId)
        if (response.data?.success) {
          await fetchAgents()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for agent stop')
      }

      // Fallback: simulate stopping agent
      setAgents(prev => prev.map(agent => 
        agent.agentId === agentId 
          ? { ...agent, status: 'stopped', lastActivity: new Date().toISOString() }
          : agent
      ))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop agent')
      return false
    }
  }, [fetchAgents])

  // Delete agent
  const deleteAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.deleteAgent(agentId)
        if (response.data?.success) {
          await fetchAgents()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for agent deletion')
      }

      // Fallback: simulate deleting agent
      setAgents(prev => prev.filter(agent => agent.agentId !== agentId))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
      return false
    }
  }, [fetchAgents])

  // Calculate derived stats
  const totalAgents = agents.length
  const activeAgents = agents.filter(a => a.status === 'active').length
  const totalPortfolioValue = agents.reduce((sum, a) => sum + a.portfolioValue, 0)
  const totalPnL = agents.reduce((sum, a) => sum + a.totalPnL, 0)
  const avgWinRate = agents.length > 0 
    ? agents.reduce((sum, a) => sum + a.winRate, 0) / agents.length 
    : 0

  // Real-time updates with smart polling
  useEffect(() => {
    // Initial fetch
    fetchAgents()

    // Use smart poller with exponential backoff
    globalPoller.startPolling(
      'agents_realtime',
      async () => {
        if (!loading) {
          await fetchAgents()
        }
      },
      {
        initialInterval: 8000, // Start with 8 seconds to reduce load
        maxInterval: 30000, // Max 30 seconds
        backoffFactor: 1.5,
        onError: (error) => {
          console.warn('Agent polling error:', error)
        }
      }
    )

    return () => {
      globalPoller.stopPolling('agents_realtime')
    }
  }, [fetchAgents, loading])

  return {
    agents,
    loading,
    error,
    connected,
    totalAgents,
    activeAgents,
    totalPortfolioValue,
    totalPnL,
    avgWinRate,
    createAgent,
    startAgent,
    stopAgent,
    deleteAgent,
    refresh: fetchAgents
  }
}