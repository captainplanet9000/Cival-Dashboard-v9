'use client'

import { useState, useEffect, useCallback } from 'react'
import { agentDecisionLoop, type Agent } from '@/lib/agents/agent-decision-loop'
import { agentWalletManager, type AgentWallet } from '@/lib/agents/agent-wallet-manager'
import { type AIDecision } from '@/lib/ai/unified-llm-service'

export interface AgentWithData extends Agent {
  wallet?: AgentWallet
  recentDecisions: AIDecision[]
  liveThoughts: string[]
  tradingActivity: any[]
  isActive: boolean
  assignedGoals: any[]
  goalProgress: Record<string, number>
  completedGoals: any[]
  goalDrivenActions: any[]
}

export function useAgentData() {
  const [agents, setAgents] = useState<AgentWithData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshAgentData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all active agents
      const activeAgents = agentDecisionLoop.getAllActiveAgents()
      const agentWallets = await agentWalletManager.getAllAgentWallets()
      
      const agentsWithData: AgentWithData[] = await Promise.all(
        activeAgents.map(async (agent) => {
          // Get wallet data
          const wallet = agentWallets.find(w => w.agentId === agent.id)
          
          // Get recent thoughts and decisions from localStorage
          const thoughts = JSON.parse(localStorage.getItem(`thoughts_${agent.id}`) || '[]')
          const memories = JSON.parse(localStorage.getItem(`memory_${agent.id}`) || '[]')
          const recentDecisions = memories.slice(-10).map((m: any) => m.decision)
          
          // Get trading activity
          const transactions = await agentWalletManager.getTransactions(agent.id)
          
          // Get assigned goals from localStorage goals system
          const allGoals = JSON.parse(localStorage.getItem('trading_goals') || '[]')
          const assignedGoals = allGoals.filter((goal: any) => 
            goal.assigned_agents?.includes(agent.id) || goal.individual_agent === agent.id
          )
          
          // Calculate goal progress based on agent performance
          const goalProgress: Record<string, number> = {}
          const goalDrivenActions: any[] = []
          
          assignedGoals.forEach((goal: any) => {
            let progress = 0
            
            // Calculate progress based on goal type
            switch(goal.goal_type) {
              case 'profit_target':
                const currentPnL = wallet ? wallet.realizedPnL + wallet.unrealizedPnL : 0
                progress = Math.min((currentPnL / goal.target_amount) * 100, 100)
                break
              case 'win_rate':
                const winRate = agent.performance.totalDecisions > 0 ? 
                  (agent.performance.successfulDecisions / agent.performance.totalDecisions) * 100 : 0
                progress = Math.min((winRate / goal.target_amount) * 100, 100)
                break
              case 'trade_count':
                progress = Math.min((agent.performance.totalDecisions / goal.target_amount) * 100, 100)
                break
              case 'risk_management':
                // Progress based on staying within risk limits
                const maxDrawdown = wallet?.maxDrawdown || 0
                progress = maxDrawdown <= goal.target_amount ? 100 : (goal.target_amount / Math.abs(maxDrawdown)) * 100
                break
              default:
                progress = goal.progress || 0
            }
            
            goalProgress[goal.id] = Math.max(0, Math.min(100, progress))
            
            // Track goal-driven actions
            if (progress > (goal.last_progress || 0)) {
              goalDrivenActions.push({
                goalId: goal.id,
                action: 'progress_made',
                oldProgress: goal.last_progress || 0,
                newProgress: progress,
                timestamp: Date.now()
              })
            }
          })
          
          // Get completed goals
          const completedGoals = assignedGoals.filter((goal: any) => 
            goalProgress[goal.id] >= 100 || goal.status === 'completed'
          )
          
          return {
            ...agent,
            wallet,
            recentDecisions,
            liveThoughts: thoughts.slice(-15), // Last 15 thoughts
            tradingActivity: transactions.slice(-20), // Last 20 trades
            isActive: agent.status === 'active',
            assignedGoals,
            goalProgress,
            completedGoals,
            goalDrivenActions
          }
        })
      )

      setAgents(agentsWithData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh data every 30 seconds (reduced from 5 seconds to prevent DB overload)
  useEffect(() => {
    refreshAgentData()
    const interval = setInterval(refreshAgentData, 30000)
    return () => clearInterval(interval)
  }, [refreshAgentData])

  const createAgent = useCallback(async (agentConfig: {
    name: string
    type: string
    strategy: any
    symbols: string[]
    maxRiskPerTrade: number
    decisionInterval: number
  }) => {
    try {
      setLoading(true)
      
      const agentId = await agentDecisionLoop.startAgent({
        id: `agent_${Date.now()}`,
        name: agentConfig.name,
        type: agentConfig.type,
        status: 'active',
        config: {
          decisionInterval: agentConfig.decisionInterval,
          maxRiskPerTrade: agentConfig.maxRiskPerTrade,
          symbols: agentConfig.symbols,
          strategy: agentConfig.strategy
        },
        performance: {
          totalPnL: 0,
          winRate: 0,
          trades: 0,
          successfulDecisions: 0,
          totalDecisions: 0
        },
        memory: {
          recentDecisions: [],
          lessons: [],
          performance: {},
          thoughts: [],
          context: '',
          lastUpdate: Date.now()
        }
      })

      // Create wallet for the agent
      await agentWalletManager.createWalletForAgent(agentId, 10000)
      
      // Refresh data to include new agent
      await refreshAgentData()
      
      return agentId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
      throw err
    } finally {
      setLoading(false)
    }
  }, [refreshAgentData])

  const pauseAgent = useCallback(async (agentId: string) => {
    try {
      await agentDecisionLoop.pauseAgent(agentId)
      await refreshAgentData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause agent')
    }
  }, [refreshAgentData])

  const stopAgent = useCallback(async (agentId: string) => {
    try {
      await agentDecisionLoop.stopAgent(agentId)
      await refreshAgentData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop agent')
    }
  }, [refreshAgentData])

  const resumeAgent = useCallback(async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId)
      if (agent) {
        await agentDecisionLoop.startAgent(agent)
        await refreshAgentData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume agent')
    }
  }, [agents, refreshAgentData])

  return {
    agents,
    loading,
    error,
    refreshAgentData,
    createAgent,
    pauseAgent,
    stopAgent,
    resumeAgent
  }
}

export function useAgentThoughts(agentId: string) {
  const [thoughts, setThoughts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const refreshThoughts = useCallback(() => {
    setLoading(true)
    try {
      const storedThoughts = JSON.parse(localStorage.getItem(`thoughts_${agentId}`) || '[]')
      setThoughts(storedThoughts.slice(-20)) // Last 20 thoughts
    } catch (error) {
      console.warn('Failed to load thoughts:', error)
      setThoughts([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    refreshThoughts()
    const interval = setInterval(refreshThoughts, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [refreshThoughts])

  return { thoughts, loading, refreshThoughts }
}

export function useAgentDecisions(agentId: string) {
  const [decisions, setDecisions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const refreshDecisions = useCallback(() => {
    setLoading(true)
    try {
      const memories = JSON.parse(localStorage.getItem(`memory_${agentId}`) || '[]')
      const recentDecisions = memories.slice(-15).map((m: any) => ({
        ...m.decision,
        timestamp: m.timestamp,
        status: m.status,
        context: m.context
      }))
      setDecisions(recentDecisions)
    } catch (error) {
      console.warn('Failed to load decisions:', error)
      setDecisions([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    refreshDecisions()
    const interval = setInterval(refreshDecisions, 2000) // Refresh every 2 seconds
    return () => clearInterval(interval)
  }, [refreshDecisions])

  return { decisions, loading, refreshDecisions }
}

export function useWalletData(agentId: string) {
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const refreshWalletData = useCallback(async () => {
    setLoading(true)
    try {
      const [walletData, transactionData] = await Promise.all([
        agentWalletManager.getWallet(agentId),
        agentWalletManager.getTransactions(agentId)
      ])
      
      setWallet(walletData)
      setTransactions(transactionData.slice(-10)) // Last 10 transactions
    } catch (error) {
      console.warn('Failed to load wallet data:', error)
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    refreshWalletData()
    const interval = setInterval(refreshWalletData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [refreshWalletData])

  return { wallet, transactions, loading, refreshWalletData }
}