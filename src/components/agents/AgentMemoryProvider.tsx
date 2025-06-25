/**
 * Agent Memory Provider Component
 * Provides context for agent memory persistence across Railway deployments
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
// Lazy load persistence manager to avoid circular dependencies
const getPersistenceManager = () => import('@/lib/persistence/persistence-manager').then(m => m.persistenceManager)
import { backendApi } from '@/lib/api/backend-client'

interface AgentMemory {
  agent_id: string
  memory_type: string
  memory_key: string
  memory_data: any
  importance_score: number
  created_at: string
  updated_at: string
}

interface AgentMemoryContextType {
  // Memory operations
  saveMemory: (agentId: string, memoryType: string, key: string, data: any, importance?: number) => Promise<boolean>
  getMemory: (agentId: string, memoryType?: string) => Promise<AgentMemory[]>
  
  // Config operations
  saveAgentConfig: (agentId: string, config: any) => Promise<boolean>
  getAgentConfig: (agentId: string) => Promise<any>
  
  // Learning operations
  saveDecision: (agentId: string, decision: any) => Promise<boolean>
  getDecisionHistory: (agentId: string, limit?: number) => Promise<any[]>
  
  // Trading memory
  saveTradingExperience: (agentId: string, experience: any) => Promise<boolean>
  getTradingExperience: (agentId: string) => Promise<any[]>
  
  // State
  isInitialized: boolean
  error: string | null
}

const AgentMemoryContext = createContext<AgentMemoryContextType | undefined>(undefined)

export function AgentMemoryProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize the memory system
    const initialize = async () => {
      try {
        // Check if persistence manager is available (lazy loaded)
        const persistenceManager = await getPersistenceManager()
        if (persistenceManager.isInitialized()) {
          console.log('✅ Agent Memory System initialized')
          setIsInitialized(true)
        } else {
          console.warn('⚠️ Agent Memory System using fallback mode')
          setIsInitialized(true)
        }
      } catch (err) {
        console.error('Failed to initialize Agent Memory System:', err)
        setError(err instanceof Error ? err.message : 'Initialization failed')
        setIsInitialized(false)
      }
    }

    initialize()
  }, [])

  // Save agent memory with automatic persistence
  const saveMemory = useCallback(async (
    agentId: string,
    memoryType: string,
    key: string,
    data: any,
    importance: number = 0.5
  ): Promise<boolean> => {
    try {
      setError(null)
      
      // Save to Trading Farm Brain for persistence across deployments
      const response = await backendApi.persistFarmAgentMemory({
        agent_id: agentId,
        memory_type: memoryType,
        memory_key: key,
        memory_data: data,
        importance_score: importance
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Cache locally for performance (lazy loaded)
      const persistenceManager = await getPersistenceManager()
      const memoryKey = `agent_memory_${agentId}_${memoryType}_${key}`
      persistenceManager.saveSessionData(memoryKey, {
        agent_id: agentId,
        memory_type: memoryType,
        memory_key: key,
        memory_data: data,
        importance_score: importance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      console.log(`✅ Memory saved for agent ${agentId}: ${memoryType}/${key}`)
      return true
    } catch (err) {
      console.error(`Failed to save memory for agent ${agentId}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to save memory')
      return false
    }
  }, [])

  // Get agent memory
  const getMemory = useCallback(async (
    agentId: string,
    memoryType?: string
  ): Promise<AgentMemory[]> => {
    try {
      setError(null)
      
      // Try to get from Trading Farm Brain
      const response = await backendApi.getFarmAgentMemory(agentId, memoryType)
      
      if (response.data && Array.isArray(response.data)) {
        return response.data as AgentMemory[]
      }

      // Fallback to session storage
      const memories: AgentMemory[] = []
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith(`agent_memory_${agentId}`) && 
        (!memoryType || key.includes(`_${memoryType}_`))
      )

      sessionKeys.forEach(key => {
        try {
          const memory = JSON.parse(sessionStorage.getItem(key) || '{}')
          if (memory.agent_id) {
            memories.push(memory)
          }
        } catch (e) {
          console.warn(`Failed to parse memory from session storage: ${key}`)
        }
      })

      return memories
    } catch (err) {
      console.error(`Failed to get memory for agent ${agentId}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to get memory')
      return []
    }
  }, [])

  // Save agent configuration
  const saveAgentConfig = useCallback(async (agentId: string, config: any): Promise<boolean> => {
    const persistenceManager = await getPersistenceManager()
    return await persistenceManager.saveAgentConfig(agentId, config)
  }, [])

  // Get agent configuration
  const getAgentConfig = useCallback(async (agentId: string): Promise<any> => {
    const persistenceManager = await getPersistenceManager()
    return await persistenceManager.getAgentConfig(agentId)
  }, [])

  // Save agent decision for learning
  const saveDecision = useCallback(async (agentId: string, decision: any): Promise<boolean> => {
    const decisionData = {
      ...decision,
      timestamp: new Date().toISOString(),
      agent_id: agentId
    }

    return await saveMemory(agentId, 'decision', `decision_${Date.now()}`, decisionData, 0.8)
  }, [saveMemory])

  // Get decision history
  const getDecisionHistory = useCallback(async (agentId: string, limit: number = 50): Promise<any[]> => {
    const memories = await getMemory(agentId, 'decision')
    return memories
      .map(m => m.memory_data)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }, [getMemory])

  // Save trading experience for learning
  const saveTradingExperience = useCallback(async (agentId: string, experience: any): Promise<boolean> => {
    const experienceData = {
      ...experience,
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      learning_weight: experience.pnl > 0 ? 1.0 : 0.8 // Successful trades get higher weight
    }

    return await saveMemory(agentId, 'trading_experience', `trade_${Date.now()}`, experienceData, 0.9)
  }, [saveMemory])

  // Get trading experience
  const getTradingExperience = useCallback(async (agentId: string): Promise<any[]> => {
    const memories = await getMemory(agentId, 'trading_experience')
    return memories
      .map(m => m.memory_data)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [getMemory])

  const contextValue: AgentMemoryContextType = {
    saveMemory,
    getMemory,
    saveAgentConfig,
    getAgentConfig,
    saveDecision,
    getDecisionHistory,
    saveTradingExperience,
    getTradingExperience,
    isInitialized,
    error
  }

  return (
    <AgentMemoryContext.Provider value={contextValue}>
      {children}
    </AgentMemoryContext.Provider>
  )
}

// Hook to use agent memory context
export function useAgentMemory() {
  const context = useContext(AgentMemoryContext)
  if (context === undefined) {
    throw new Error('useAgentMemory must be used within an AgentMemoryProvider')
  }
  return context
}

// HOC for components that need agent memory
export function withAgentMemory<P extends object>(Component: React.ComponentType<P>) {
  return function AgentMemoryWrapper(props: P) {
    return (
      <AgentMemoryProvider>
        <Component {...props} />
      </AgentMemoryProvider>
    )
  }
}