/**
 * Comprehensive Agent Persistence Hook
 * Provides complete agent state management for Railway deployment persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAgentMemory } from '@/components/agents/AgentMemoryProvider'
import { useAgentConfig } from './usePersistentState'
import { backendApi } from '@/lib/api/backend-client'

interface AgentPersistenceState {
  // Agent configuration
  config: any
  
  // Memory and learning
  decisionHistory: any[]
  tradingExperience: any[]
  
  // Current state
  isActive: boolean
  currentPositions: any[]
  performanceMetrics: any
  
  // Persistence status
  isLoading: boolean
  isInitialized: boolean
  lastSyncTime: Date | null
  error: string | null
}

interface AgentPersistenceActions {
  // Configuration management
  updateConfig: (config: any) => Promise<boolean>
  resetConfig: () => Promise<boolean>
  
  // Memory management
  recordDecision: (decision: any) => Promise<boolean>
  recordTrade: (trade: any) => Promise<boolean>
  clearMemory: (type?: string) => Promise<boolean>
  
  // State management
  startAgent: () => Promise<boolean>
  stopAgent: () => Promise<boolean>
  syncAgentState: () => Promise<boolean>
  
  // Persistence operations
  saveToFarm: () => Promise<boolean>
  restoreFromFarm: () => Promise<boolean>
  exportAgentData: () => Promise<any>
  importAgentData: (data: any) => Promise<boolean>
}

export function useAgentPersistence(agentId: string): [AgentPersistenceState, AgentPersistenceActions] {
  const {
    saveMemory,
    getMemory,
    saveDecision,
    getDecisionHistory,
    saveTradingExperience,
    getTradingExperience,
    isInitialized: memoryInitialized
  } = useAgentMemory()
  
  const { 
    config, 
    isLoading: configLoading, 
    error: configError, 
    saveConfig 
  } = useAgentConfig(agentId)

  const [state, setState] = useState<AgentPersistenceState>({
    config: null,
    decisionHistory: [],
    tradingExperience: [],
    isActive: false,
    currentPositions: [],
    performanceMetrics: {},
    isLoading: true,
    isInitialized: false,
    lastSyncTime: null,
    error: null
  })

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSyncIntervalRef = useRef<NodeJS.Interval | null>(null)

  // Initialize agent persistence
  useEffect(() => {
    const initialize = async () => {
      if (!memoryInitialized || configLoading) return

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Load all persistent data
        const [decisions, experiences] = await Promise.all([
          getDecisionHistory(agentId, 100),
          getTradingExperience(agentId)
        ])

        // Get current agent status from backend
        let agentStatus = null
        let positions = []
        let performance = {}

        try {
          const statusResponse = await backendApi.getAgentsStatus()
          if (statusResponse.data) {
            agentStatus = statusResponse.data.find((agent: any) => agent.agent_id === agentId)
          }

          const positionsResponse = await backendApi.getAgentPaperPositions(agentId)
          if (positionsResponse.data) {
            positions = positionsResponse.data
          }

          const performanceResponse = await backendApi.getAgentPaperPerformance(agentId)
          if (performanceResponse.data) {
            performance = performanceResponse.data
          }
        } catch (error) {
          console.warn('Failed to load live agent data, using cached state:', error)
        }

        setState(prev => ({
          ...prev,
          config,
          decisionHistory: decisions,
          tradingExperience: experiences,
          isActive: agentStatus?.status === 'active' || false,
          currentPositions: positions,
          performanceMetrics: performance,
          isLoading: false,
          isInitialized: true,
          lastSyncTime: new Date(),
          error: null
        }))

        console.log(`✅ Agent persistence initialized for ${agentId}`)
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Initialization failed'
        }))
        console.error(`Failed to initialize agent persistence for ${agentId}:`, error)
      }
    }

    initialize()
  }, [agentId, memoryInitialized, configLoading, config])

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!state.isInitialized) return

    autoSyncIntervalRef.current = setInterval(async () => {
      try {
        await syncAgentState()
      } catch (error) {
        console.warn('Auto-sync failed:', error)
      }
    }, 30000)

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current)
      }
    }
  }, [state.isInitialized])

  // Configuration management
  const updateConfig = useCallback(async (newConfig: any): Promise<boolean> => {
    try {
      const success = await saveConfig(newConfig)
      if (success) {
        setState(prev => ({
          ...prev,
          config: newConfig,
          lastSyncTime: new Date()
        }))
        
        // Archive config change
        await saveMemory(agentId, 'config_change', `config_${Date.now()}`, {
          old_config: state.config,
          new_config: newConfig,
          changed_at: new Date().toISOString()
        }, 0.7)
      }
      return success
    } catch (error) {
      console.error('Failed to update agent config:', error)
      return false
    }
  }, [agentId, saveConfig, saveMemory, state.config])

  const resetConfig = useCallback(async (): Promise<boolean> => {
    try {
      const defaultConfig = {
        agent_id: agentId,
        name: `Agent ${agentId}`,
        strategy_config: {},
        risk_config: {},
        trading_config: {},
        is_active: false,
        auto_start: false
      }
      
      return await updateConfig(defaultConfig)
    } catch (error) {
      console.error('Failed to reset agent config:', error)
      return false
    }
  }, [agentId, updateConfig])

  // Memory management
  const recordDecision = useCallback(async (decision: any): Promise<boolean> => {
    try {
      const success = await saveDecision(agentId, decision)
      if (success) {
        setState(prev => ({
          ...prev,
          decisionHistory: [decision, ...prev.decisionHistory.slice(0, 99)],
          lastSyncTime: new Date()
        }))
      }
      return success
    } catch (error) {
      console.error('Failed to record decision:', error)
      return false
    }
  }, [agentId, saveDecision])

  const recordTrade = useCallback(async (trade: any): Promise<boolean> => {
    try {
      const success = await saveTradingExperience(agentId, trade)
      if (success) {
        setState(prev => ({
          ...prev,
          tradingExperience: [trade, ...prev.tradingExperience.slice(0, 199)],
          lastSyncTime: new Date()
        }))
      }
      return success
    } catch (error) {
      console.error('Failed to record trade:', error)
      return false
    }
  }, [agentId, saveTradingExperience])

  const clearMemory = useCallback(async (type?: string): Promise<boolean> => {
    try {
      // Save clearing event
      await saveMemory(agentId, 'system', 'memory_cleared', {
        cleared_type: type || 'all',
        cleared_at: new Date().toISOString(),
        decision_count: state.decisionHistory.length,
        experience_count: state.tradingExperience.length
      }, 1.0)

      // Clear local state
      setState(prev => ({
        ...prev,
        decisionHistory: type === 'decisions' || !type ? [] : prev.decisionHistory,
        tradingExperience: type === 'experiences' || !type ? [] : prev.tradingExperience,
        lastSyncTime: new Date()
      }))

      return true
    } catch (error) {
      console.error('Failed to clear memory:', error)
      return false
    }
  }, [agentId, saveMemory, state.decisionHistory.length, state.tradingExperience.length])

  // Agent state management
  const startAgent = useCallback(async (): Promise<boolean> => {
    try {
      const response = await backendApi.startAgent(agentId)
      if (!response.error) {
        setState(prev => ({
          ...prev,
          isActive: true,
          lastSyncTime: new Date()
        }))
        
        await recordDecision({
          type: 'system',
          action: 'agent_started',
          timestamp: new Date().toISOString()
        })
      }
      return !response.error
    } catch (error) {
      console.error('Failed to start agent:', error)
      return false
    }
  }, [agentId, recordDecision])

  const stopAgent = useCallback(async (): Promise<boolean> => {
    try {
      const response = await backendApi.stopAgent(agentId)
      if (!response.error) {
        setState(prev => ({
          ...prev,
          isActive: false,
          lastSyncTime: new Date()
        }))
        
        await recordDecision({
          type: 'system',
          action: 'agent_stopped',
          timestamp: new Date().toISOString()
        })
      }
      return !response.error
    } catch (error) {
      console.error('Failed to stop agent:', error)
      return false
    }
  }, [agentId, recordDecision])

  const syncAgentState = useCallback(async (): Promise<boolean> => {
    try {
      // Get fresh data from backend
      const [statusResponse, positionsResponse, performanceResponse] = await Promise.all([
        backendApi.getAgentsStatus(),
        backendApi.getAgentPaperPositions(agentId),
        backendApi.getAgentPaperPerformance(agentId)
      ])

      let agentStatus = null
      if (statusResponse.data) {
        agentStatus = statusResponse.data.find((agent: any) => agent.agent_id === agentId)
      }

      setState(prev => ({
        ...prev,
        isActive: agentStatus?.status === 'active' || false,
        currentPositions: positionsResponse.data || prev.currentPositions,
        performanceMetrics: performanceResponse.data || prev.performanceMetrics,
        lastSyncTime: new Date(),
        error: null
      }))

      return true
    } catch (error) {
      console.error('Failed to sync agent state:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed'
      }))
      return false
    }
  }, [agentId])

  // Persistence operations
  const saveToFarm = useCallback(async (): Promise<boolean> => {
    try {
      // Archive current complete state to Trading Farm Brain
      const archiveData = {
        agent_id: agentId,
        config: state.config,
        decision_history: state.decisionHistory,
        trading_experience: state.tradingExperience,
        performance_metrics: state.performanceMetrics,
        positions: state.currentPositions,
        is_active: state.isActive,
        archived_at: new Date().toISOString()
      }

      await saveMemory(agentId, 'archive', `full_state_${Date.now()}`, archiveData, 1.0)
      
      setState(prev => ({
        ...prev,
        lastSyncTime: new Date()
      }))

      return true
    } catch (error) {
      console.error('Failed to save to farm:', error)
      return false
    }
  }, [agentId, saveMemory, state])

  const restoreFromFarm = useCallback(async (): Promise<boolean> => {
    try {
      const memories = await getMemory(agentId, 'archive')
      if (memories.length === 0) {
        console.warn('No archived state found for agent')
        return false
      }

      // Get most recent archive
      const latestArchive = memories
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      const archiveData = latestArchive.memory_data

      setState(prev => ({
        ...prev,
        config: archiveData.config || prev.config,
        decisionHistory: archiveData.decision_history || [],
        tradingExperience: archiveData.trading_experience || [],
        performanceMetrics: archiveData.performance_metrics || {},
        currentPositions: archiveData.positions || [],
        isActive: archiveData.is_active || false,
        lastSyncTime: new Date()
      }))

      return true
    } catch (error) {
      console.error('Failed to restore from farm:', error)
      return false
    }
  }, [agentId, getMemory])

  const exportAgentData = useCallback(async (): Promise<any> => {
    return {
      agent_id: agentId,
      config: state.config,
      decision_history: state.decisionHistory,
      trading_experience: state.tradingExperience,
      performance_metrics: state.performanceMetrics,
      current_positions: state.currentPositions,
      is_active: state.isActive,
      exported_at: new Date().toISOString(),
      memory_stats: {
        decision_count: state.decisionHistory.length,
        experience_count: state.tradingExperience.length,
        last_sync: state.lastSyncTime
      }
    }
  }, [agentId, state])

  const importAgentData = useCallback(async (data: any): Promise<boolean> => {
    try {
      if (data.agent_id !== agentId) {
        throw new Error('Agent ID mismatch')
      }

      // Update config if provided
      if (data.config) {
        await updateConfig(data.config)
      }

      // Import memories
      if (data.decision_history) {
        for (const decision of data.decision_history) {
          await recordDecision(decision)
        }
      }

      if (data.trading_experience) {
        for (const trade of data.trading_experience) {
          await recordTrade(trade)
        }
      }

      setState(prev => ({
        ...prev,
        performanceMetrics: data.performance_metrics || prev.performanceMetrics,
        currentPositions: data.current_positions || prev.currentPositions,
        lastSyncTime: new Date()
      }))

      return true
    } catch (error) {
      console.error('Failed to import agent data:', error)
      return false
    }
  }, [agentId, updateConfig, recordDecision, recordTrade])

  const actions: AgentPersistenceActions = {
    updateConfig,
    resetConfig,
    recordDecision,
    recordTrade,
    clearMemory,
    startAgent,
    stopAgent,
    syncAgentState,
    saveToFarm,
    restoreFromFarm,
    exportAgentData,
    importAgentData
  }

  // Combine all errors
  const combinedError = configError || state.error

  const finalState: AgentPersistenceState = {
    ...state,
    error: combinedError,
    isLoading: state.isLoading || configLoading
  }

  return [finalState, actions]
}