'use client'

import { useState, useEffect, useCallback } from 'react'
import { enhancedAgentTrading } from '@/lib/agents/enhanced-agent-trading'
import type { 
  AgentConfig, 
  AgentPerformance, 
  AgentPosition, 
  AgentDecision 
} from '@/lib/agents/enhanced-agent-trading'

export interface AgentTradingState {
  agents: AgentConfig[]
  isRunning: boolean
  totalAgents: number
  activeAgents: number
  totalTrades: number
  totalPnL: number
}

export function useAgentTrading() {
  const [state, setState] = useState<AgentTradingState>({
    agents: [],
    isRunning: false,
    totalAgents: 0,
    activeAgents: 0,
    totalTrades: 0,
    totalPnL: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const agents = enhancedAgentTrading.getAgents()
        updateState(agents)
      } catch (error) {
        console.error('Error loading agent data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Periodic refresh
    const interval = setInterval(() => {
      const agents = enhancedAgentTrading.getAgents()
      updateState(agents)
    }, 5000) // Every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const updateState = useCallback((agents: AgentConfig[]) => {
    const activeAgents = agents.filter(a => a.isActive).length
    let totalTrades = 0
    let totalPnL = 0

    agents.forEach(agent => {
      const performance = enhancedAgentTrading.getAgentPerformance(agent.id)
      if (performance) {
        totalTrades += performance.totalTrades
        totalPnL += performance.totalPnL
      }
    })

    setState({
      agents,
      isRunning: enhancedAgentTrading.running,
      totalAgents: agents.length,
      activeAgents,
      totalTrades,
      totalPnL
    })
  }, [])

  // Agent Management
  const createAgent = useCallback(async (config: Omit<AgentConfig, 'id'>): Promise<string | null> => {
    try {
      const agentId = await enhancedAgentTrading.createAgent(config)
      const agents = enhancedAgentTrading.getAgents()
      updateState(agents)
      return agentId
    } catch (error) {
      console.error('Error creating agent:', error)
      return null
    }
  }, [updateState])

  const updateAgent = useCallback(async (agentId: string, updates: Partial<AgentConfig>): Promise<boolean> => {
    try {
      const success = await enhancedAgentTrading.updateAgent(agentId, updates)
      if (success) {
        const agents = enhancedAgentTrading.getAgents()
        updateState(agents)
      }
      return success
    } catch (error) {
      console.error('Error updating agent:', error)
      return false
    }
  }, [updateState])

  const deleteAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      const success = await enhancedAgentTrading.deleteAgent(agentId)
      if (success) {
        const agents = enhancedAgentTrading.getAgents()
        updateState(agents)
      }
      return success
    } catch (error) {
      console.error('Error deleting agent:', error)
      return false
    }
  }, [updateState])

  const activateAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      const success = await enhancedAgentTrading.activateAgent(agentId)
      if (success) {
        const agents = enhancedAgentTrading.getAgents()
        updateState(agents)
      }
      return success
    } catch (error) {
      console.error('Error activating agent:', error)
      return false
    }
  }, [updateState])

  const deactivateAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      const success = await enhancedAgentTrading.deactivateAgent(agentId)
      if (success) {
        const agents = enhancedAgentTrading.getAgents()
        updateState(agents)
      }
      return success
    } catch (error) {
      console.error('Error deactivating agent:', error)
      return false
    }
  }, [updateState])

  // Trading Engine Control
  const startTradingEngine = useCallback(async (): Promise<void> => {
    try {
      await enhancedAgentTrading.startTradingEngine()
      const agents = enhancedAgentTrading.getAgents()
      updateState(agents)
    } catch (error) {
      console.error('Error starting trading engine:', error)
    }
  }, [updateState])

  const stopTradingEngine = useCallback(async (): Promise<void> => {
    try {
      await enhancedAgentTrading.stopTradingEngine()
      const agents = enhancedAgentTrading.getAgents()
      updateState(agents)
    } catch (error) {
      console.error('Error stopping trading engine:', error)
    }
  }, [updateState])

  // Data Access
  const getAgent = useCallback((agentId: string): AgentConfig | undefined => {
    return enhancedAgentTrading.getAgent(agentId)
  }, [])

  const getAgentPerformance = useCallback((agentId: string): AgentPerformance | undefined => {
    return enhancedAgentTrading.getAgentPerformance(agentId)
  }, [])

  const getAgentPositions = useCallback((agentId: string): AgentPosition[] => {
    return enhancedAgentTrading.getAgentPositions(agentId)
  }, [])

  const getAgentDecisions = useCallback((agentId: string, limit?: number): AgentDecision[] => {
    return enhancedAgentTrading.getAgentDecisions(agentId, limit)
  }, [])

  const getAllPositions = useCallback((): AgentPosition[] => {
    const allPositions: AgentPosition[] = []
    state.agents.forEach(agent => {
      const positions = enhancedAgentTrading.getAgentPositions(agent.id)
      allPositions.push(...positions)
    })
    return allPositions
  }, [state.agents])

  const getAllDecisions = useCallback((): AgentDecision[] => {
    const allDecisions: AgentDecision[] = []
    state.agents.forEach(agent => {
      const decisions = enhancedAgentTrading.getAgentDecisions(agent.id, 10)
      allDecisions.push(...decisions)
    })
    return allDecisions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [state.agents])

  return {
    // State
    ...state,
    isLoading,

    // Actions
    createAgent,
    updateAgent,
    deleteAgent,
    activateAgent,
    deactivateAgent,
    startTradingEngine,
    stopTradingEngine,

    // Data Access
    getAgent,
    getAgentPerformance,
    getAgentPositions,
    getAgentDecisions,
    getAllPositions,
    getAllDecisions
  }
}

// Specialized hook for agent performance monitoring
export function useAgentPerformance(agentId?: string) {
  const [performance, setPerformance] = useState<AgentPerformance | null>(null)
  const [positions, setPositions] = useState<AgentPosition[]>([])
  const [recentDecisions, setRecentDecisions] = useState<AgentDecision[]>([])

  useEffect(() => {
    if (!agentId) return

    const updateData = () => {
      const perf = enhancedAgentTrading.getAgentPerformance(agentId)
      const pos = enhancedAgentTrading.getAgentPositions(agentId)
      const decisions = enhancedAgentTrading.getAgentDecisions(agentId, 20)

      setPerformance(perf || null)
      setPositions(pos)
      setRecentDecisions(decisions)
    }

    updateData()

    const interval = setInterval(updateData, 3000) // Every 3 seconds
    return () => clearInterval(interval)
  }, [agentId])

  return {
    performance,
    positions,
    recentDecisions,
    hasData: !!performance
  }
}

// Hook for real-time agent monitoring
export function useAgentMonitoring() {
  const [alerts, setAlerts] = useState<Array<{
    id: string
    agentId: string
    type: 'error' | 'warning' | 'success'
    message: string
    timestamp: Date
  }>>([])

  useEffect(() => {
    const checkForAlerts = () => {
      const agents = enhancedAgentTrading.getAgents()
      const newAlerts: typeof alerts = []

      agents.forEach(agent => {
        const performance = enhancedAgentTrading.getAgentPerformance(agent.id)
        
        if (performance) {
          // Check for high drawdown
          if (performance.maxDrawdown > agent.settings.maxDrawdown * 0.8) {
            newAlerts.push({
              id: `${agent.id}_drawdown`,
              agentId: agent.id,
              type: 'warning',
              message: `${agent.name} approaching max drawdown limit (${performance.maxDrawdown.toFixed(2)}%)`,
              timestamp: new Date()
            })
          }

          // Check for low win rate
          if (performance.totalTrades > 10 && performance.winRate < 30) {
            newAlerts.push({
              id: `${agent.id}_winrate`,
              agentId: agent.id,
              type: 'warning',
              message: `${agent.name} has low win rate (${performance.winRate.toFixed(1)}%)`,
              timestamp: new Date()
            })
          }

          // Check for successful trades
          if (performance.totalTrades > 0 && performance.winRate > 70) {
            newAlerts.push({
              id: `${agent.id}_success`,
              agentId: agent.id,
              type: 'success',
              message: `${agent.name} performing well (${performance.winRate.toFixed(1)}% win rate)`,
              timestamp: new Date()
            })
          }
        }

        // Check recent decisions for errors
        const recentDecisions = enhancedAgentTrading.getAgentDecisions(agent.id, 5)
        const failedDecisions = recentDecisions.filter(d => 
          d.executionResult?.status === 'failed'
        )

        if (failedDecisions.length > 2) {
          newAlerts.push({
            id: `${agent.id}_failures`,
            agentId: agent.id,
            type: 'error',
            message: `${agent.name} has multiple recent execution failures`,
            timestamp: new Date()
          })
        }
      })

      setAlerts(newAlerts)
    }

    checkForAlerts()
    const interval = setInterval(checkForAlerts, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return {
    alerts,
    clearAlert,
    clearAllAlerts
  }
}