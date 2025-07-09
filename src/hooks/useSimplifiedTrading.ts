/**
 * Simplified Trading Hook - Direct API calls without AG-UI complexity
 * Use this for immediate wizard integration and live trading
 */

import { useState, useEffect, useCallback } from 'react'
import { simplifiedTradingClient } from '@/lib/api/simplified-trading-client'

interface TradingAgent {
  id: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  wallet_address: string
  current_balance: number
  performance: {
    total_trades: number
    total_profit: number
    win_rate: number
    current_roi: number
  }
  goals: {
    profit_target: number
    current_progress: number
  }
}

interface Farm {
  id: string
  name: string
  type: string
  agents: TradingAgent[]
  total_allocation: number
  current_value: number
  performance: {
    total_profit: number
    roi: number
  }
}

interface Goal {
  id: string
  name: string
  type: string
  target_value: number
  current_value: number
  progress: number
  status: 'active' | 'completed' | 'paused'
  profit_collected: number
}

interface UseSimplifiedTradingReturn {
  // Data
  agents: TradingAgent[]
  farms: Farm[]
  goals: Goal[]
  portfolio: {
    total_value: number
    total_profit: number
    active_agents: number
    total_trades: number
    win_rate: number
  }
  system: {
    trading_active: boolean
    agents_running: number
    farms_active: number
    goals_monitoring: number
    last_trade_time: string
  }
  
  // Loading states
  loading: boolean
  error: string | null
  
  // Actions
  createAgent: (agentData: any) => Promise<TradingAgent | null>
  createFarm: (farmData: any) => Promise<Farm | null>
  createGoal: (goalData: any) => Promise<Goal | null>
  depositFunds: (amount: number) => Promise<boolean>
  startAgent: (agentId: string) => Promise<boolean>
  stopAgent: (agentId: string) => Promise<boolean>
  processWizardCompletions: (wizardResults: any) => Promise<any>
  
  // Data refresh
  refreshData: () => Promise<void>
  
  // Real-time updates
  startPolling: () => void
  stopPolling: () => void
  isPolling: boolean
}

export function useSimplifiedTrading(): UseSimplifiedTradingReturn {
  // State
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [portfolio, setPortfolio] = useState({
    total_value: 0,
    total_profit: 0,
    active_agents: 0,
    total_trades: 0,
    win_rate: 0
  })
  const [system, setSystem] = useState({
    trading_active: false,
    agents_running: 0,
    farms_active: 0,
    goals_monitoring: 0,
    last_trade_time: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Refresh all data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const updates = await simplifiedTradingClient.pollForUpdates()
      
      setAgents(updates.agents)
      setFarms(updates.farms)
      setGoals(updates.goals)
      setPortfolio(updates.portfolio)
      setSystem(updates.system)
      
    } catch (err: any) {
      console.error('Failed to refresh data:', err)
      setError(err.message || 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Polling for real-time updates
  const startPolling = useCallback(() => {
    if (isPolling) return
    
    setIsPolling(true)
    const interval = setInterval(async () => {
      await refreshData()
    }, 5000) // Poll every 5 seconds
    
    setPollingInterval(interval)
  }, [isPolling, refreshData])

  const stopPolling = useCallback(() => {
    if (!isPolling) return
    
    setIsPolling(false)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }, [isPolling, pollingInterval])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Agent actions
  const createAgent = useCallback(async (agentData: any): Promise<TradingAgent | null> => {
    try {
      const agent = await simplifiedTradingClient.createAgent(agentData)
      
      // Update local state
      setAgents(prev => [...prev, agent])
      
      // Refresh data to get updated portfolio
      await refreshData()
      
      return agent
    } catch (err: any) {
      console.error('Failed to create agent:', err)
      setError(err.message || 'Failed to create agent')
      return null
    }
  }, [refreshData])

  const startAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      const success = await simplifiedTradingClient.startAgent(agentId)
      
      if (success) {
        // Update local state
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, status: 'active' } : agent
        ))
        
        // Refresh data
        await refreshData()
      }
      
      return success
    } catch (err: any) {
      console.error('Failed to start agent:', err)
      setError(err.message || 'Failed to start agent')
      return false
    }
  }, [refreshData])

  const stopAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      const success = await simplifiedTradingClient.stopAgent(agentId)
      
      if (success) {
        // Update local state
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? { ...agent, status: 'stopped' } : agent
        ))
        
        // Refresh data
        await refreshData()
      }
      
      return success
    } catch (err: any) {
      console.error('Failed to stop agent:', err)
      setError(err.message || 'Failed to stop agent')
      return false
    }
  }, [refreshData])

  // Farm actions
  const createFarm = useCallback(async (farmData: any): Promise<Farm | null> => {
    try {
      const farm = await simplifiedTradingClient.createFarm(farmData)
      
      // Update local state
      setFarms(prev => [...prev, farm])
      
      // Refresh data to get updated portfolio
      await refreshData()
      
      return farm
    } catch (err: any) {
      console.error('Failed to create farm:', err)
      setError(err.message || 'Failed to create farm')
      return null
    }
  }, [refreshData])

  // Goal actions
  const createGoal = useCallback(async (goalData: any): Promise<Goal | null> => {
    try {
      const goal = await simplifiedTradingClient.createGoal(goalData)
      
      // Update local state
      setGoals(prev => [...prev, goal])
      
      // Refresh data to get updated portfolio
      await refreshData()
      
      return goal
    } catch (err: any) {
      console.error('Failed to create goal:', err)
      setError(err.message || 'Failed to create goal')
      return null
    }
  }, [refreshData])

  // Wallet actions
  const depositFunds = useCallback(async (amount: number): Promise<boolean> => {
    try {
      const success = await simplifiedTradingClient.depositFunds(amount)
      
      if (success) {
        // Refresh data to get updated portfolio
        await refreshData()
      }
      
      return success
    } catch (err: any) {
      console.error('Failed to deposit funds:', err)
      setError(err.message || 'Failed to deposit funds')
      return false
    }
  }, [refreshData])

  // Wizard integration
  const processWizardCompletions = useCallback(async (wizardResults: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const results = await simplifiedTradingClient.processWizardCompletions(wizardResults)
      
      if (results.success) {
        // Update local state with new entities
        setAgents(prev => [...prev, ...results.agents])
        setFarms(prev => [...prev, ...results.farms])
        setGoals(prev => [...prev, ...results.goals])
        
        // Refresh data to get updated portfolio
        await refreshData()
        
        // Start polling for real-time updates
        startPolling()
      } else {
        setError(results.errors.join(', '))
      }
      
      return results
    } catch (err: any) {
      console.error('Failed to process wizard completions:', err)
      setError(err.message || 'Failed to process wizard completions')
      return { success: false, errors: [err.message] }
    } finally {
      setLoading(false)
    }
  }, [refreshData, startPolling])

  return {
    // Data
    agents,
    farms,
    goals,
    portfolio,
    system,
    
    // Loading states
    loading,
    error,
    
    // Actions
    createAgent,
    createFarm,
    createGoal,
    depositFunds,
    startAgent,
    stopAgent,
    processWizardCompletions,
    
    // Data refresh
    refreshData,
    
    // Real-time updates
    startPolling,
    stopPolling,
    isPolling
  }
}

// Export for easy component integration
export default useSimplifiedTrading