'use client'

import { useState, useEffect, useCallback } from 'react'
import { backendClient } from '@/lib/api/backend-client'

interface GoalRealtimeData {
  goalId: string
  name: string
  description: string
  goalType: 'profit_target' | 'risk_limit' | 'performance' | 'time_based' | 'custom'
  status: 'active' | 'completed' | 'paused' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  targetValue: number
  currentValue: number
  progressPercentage: number
  deadline: string
  timeRemaining: number
  estimatedCompletion: string
  achievementProbability: number
  createdAt: string
  lastUpdate: string
  linkedEntities: {
    portfolios: string[]
    agents: string[]
    farms: string[]
  }
  metrics: {
    dailyProgress: number
    weeklyProgress: number
    monthlyProgress: number
    velocity: number
    acceleration: number
    consistencyScore: number
  }
  milestones: Array<{
    id: string
    name: string
    targetValue: number
    completed: boolean
    completedAt?: string
    progressPercent: number
  }>
  strategy: {
    approach: string
    parameters: Record<string, any>
    aiRecommendations: Array<{
      recommendation: string
      confidence: number
      reasoning: string
      priority: 'low' | 'medium' | 'high'
      timestamp: string
    }>
    adaptiveAdjustments: Array<{
      adjustment: string
      previousValue: any
      newValue: any
      reason: string
      timestamp: string
    }>
  }
  performance: {
    efficiency: number
    consistency: number
    riskAdjustedProgress: number
    benchmarkComparison: number
    successRate: number
  }
}

interface UseGoalRealtimeReturn {
  goals: GoalRealtimeData[]
  loading: boolean
  error: string | null
  connected: boolean
  totalGoals: number
  activeGoals: number
  completedGoals: number
  avgProgress: number
  highPriorityGoals: number
  createGoal: (config: CreateGoalConfig) => Promise<string | null>
  updateGoal: (goalId: string, updates: Partial<GoalRealtimeData>) => Promise<boolean>
  pauseGoal: (goalId: string) => Promise<boolean>
  resumeGoal: (goalId: string) => Promise<boolean>
  deleteGoal: (goalId: string) => Promise<boolean>
  optimizeGoal: (goalId: string) => Promise<boolean>
  getAIRecommendations: (goalId: string) => Promise<any[] | null>
  refresh: () => Promise<void>
}

interface CreateGoalConfig {
  name: string
  description: string
  goalType: string
  targetValue: number
  deadline: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  linkedEntities: {
    portfolios?: string[]
    agents?: string[]
    farms?: string[]
  }
  strategy: {
    approach: string
    parameters: Record<string, any>
  }
}

/**
 * Real-time hook for intelligent goal management with AI optimization
 */
export function useGoalRealtime(): UseGoalRealtimeReturn {
  const [goals, setGoals] = useState<GoalRealtimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Generate mock goal data
  const generateMockGoals = useCallback((): GoalRealtimeData[] => {
    const goalTemplates = [
      {
        name: 'Q4 Profit Target',
        description: 'Achieve 15% portfolio return by end of Q4',
        goalType: 'profit_target' as const,
        targetValue: 15000,
        priority: 'high' as const,
        deadline: new Date(Date.now() + 86400000 * 90).toISOString()
      },
      {
        name: 'Risk Management Goal',
        description: 'Keep maximum drawdown below 5%',
        goalType: 'risk_limit' as const,
        targetValue: 5,
        priority: 'critical' as const,
        deadline: new Date(Date.now() + 86400000 * 365).toISOString()
      },
      {
        name: 'Sharpe Ratio Improvement',
        description: 'Improve portfolio Sharpe ratio to 2.0+',
        goalType: 'performance' as const,
        targetValue: 2.0,
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 86400000 * 180).toISOString()
      },
      {
        name: 'Agent Coordination Efficiency',
        description: 'Achieve 95% agent coordination efficiency',
        goalType: 'performance' as const,
        targetValue: 95,
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 86400000 * 60).toISOString()
      },
      {
        name: 'Weekly Consistency Target',
        description: 'Maintain positive returns for 8 consecutive weeks',
        goalType: 'time_based' as const,
        targetValue: 8,
        priority: 'high' as const,
        deadline: new Date(Date.now() + 86400000 * 56).toISOString()
      }
    ]

    return goalTemplates.map((template, index) => {
      const progress = Math.random() * 0.8 + 0.1 // 10-90% progress
      const currentValue = template.targetValue * progress
      const timeLeft = new Date(template.deadline).getTime() - Date.now()
      const daysLeft = Math.max(0, Math.floor(timeLeft / 86400000))
      
      return {
        goalId: `goal_${index + 1}`,
        name: template.name,
        description: template.description,
        goalType: template.goalType,
        status: progress > 0.9 ? 'completed' : (Math.random() > 0.9 ? 'paused' : 'active') as any,
        priority: template.priority,
        targetValue: template.targetValue,
        currentValue,
        progressPercentage: progress * 100,
        deadline: template.deadline,
        timeRemaining: timeLeft,
        estimatedCompletion: new Date(Date.now() + (timeLeft / progress)).toISOString(),
        achievementProbability: Math.max(0.2, Math.min(0.95, progress + (Math.random() - 0.5) * 0.3)),
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        linkedEntities: {
          portfolios: [`portfolio_${Math.floor(Math.random() * 3) + 1}`],
          agents: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => `agent_${i + 1}`),
          farms: Math.random() > 0.5 ? [`farm_${Math.floor(Math.random() * 2) + 1}`] : []
        },
        metrics: {
          dailyProgress: (Math.random() - 0.5) * 2,
          weeklyProgress: (Math.random() - 0.3) * 5,
          monthlyProgress: (Math.random() - 0.2) * 10,
          velocity: Math.random() * 2,
          acceleration: (Math.random() - 0.5) * 0.5,
          consistencyScore: 0.6 + Math.random() * 0.4
        },
        milestones: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, i) => {
          const milestoneProgress = template.targetValue * (i + 1) / 5
          return {
            id: `milestone_${index}_${i}`,
            name: `Milestone ${i + 1}`,
            targetValue: milestoneProgress,
            completed: currentValue >= milestoneProgress,
            completedAt: currentValue >= milestoneProgress 
              ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() 
              : undefined,
            progressPercent: Math.min(100, (currentValue / milestoneProgress) * 100)
          }
        }),
        strategy: {
          approach: ['aggressive', 'conservative', 'balanced', 'adaptive'][Math.floor(Math.random() * 4)],
          parameters: {
            riskTolerance: Math.random(),
            timeHorizon: daysLeft,
            allocationStrategy: 'dynamic',
            rebalanceFrequency: 'weekly'
          },
          aiRecommendations: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
            recommendation: [
              'Increase momentum allocation by 15%',
              'Reduce risk exposure in volatile markets',
              'Optimize agent coordination frequency',
              'Implement dynamic rebalancing'
            ][Math.floor(Math.random() * 4)],
            confidence: 0.7 + Math.random() * 0.3,
            reasoning: [
              'Market conditions favor momentum strategies',
              'Risk metrics approaching threshold levels',
              'Agent efficiency metrics show improvement potential',
              'Portfolio drift detected from target allocation'
            ][Math.floor(Math.random() * 4)],
            priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
          })),
          adaptiveAdjustments: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, i) => ({
            adjustment: [
              'Target value adjusted based on market conditions',
              'Timeline extended due to market volatility',
              'Strategy approach modified for better efficiency'
            ][Math.floor(Math.random() * 3)],
            previousValue: template.targetValue,
            newValue: template.targetValue * (0.9 + Math.random() * 0.2),
            reason: 'AI-driven optimization based on performance analysis',
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
          }))
        },
        performance: {
          efficiency: 0.6 + Math.random() * 0.4,
          consistency: 0.5 + Math.random() * 0.5,
          riskAdjustedProgress: progress * (0.8 + Math.random() * 0.4),
          benchmarkComparison: (Math.random() - 0.3) * 0.2,
          successRate: 0.7 + Math.random() * 0.3
        }
      }
    })
  }, [])

  // Fetch goals from backend
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from real backend first
      try {
        const response = await backendClient.getGoals()
        if (response.data) {
          setGoals(response.data)
          setConnected(true)
          return
        }
      } catch (backendError) {
        console.warn('Backend not available, using mock data:', backendError)
      }

      // Fallback to mock data
      const mockGoals = generateMockGoals()
      setGoals(mockGoals)
      setConnected(false)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [generateMockGoals])

  // Create new goal
  const createGoal = useCallback(async (config: CreateGoalConfig): Promise<string | null> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.createGoal(config)
        if (response.data?.id) {
          await fetchGoals()
          return response.data.id
        }
      } catch (backendError) {
        console.warn('Backend not available for goal creation')
      }

      // Fallback: simulate goal creation
      const newGoal: GoalRealtimeData = {
        goalId: `goal_${Date.now()}`,
        name: config.name,
        description: config.description,
        goalType: config.goalType as any,
        status: 'active',
        priority: config.priority,
        targetValue: config.targetValue,
        currentValue: 0,
        progressPercentage: 0,
        deadline: config.deadline,
        timeRemaining: new Date(config.deadline).getTime() - Date.now(),
        estimatedCompletion: config.deadline,
        achievementProbability: 0.5,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        linkedEntities: config.linkedEntities,
        metrics: {
          dailyProgress: 0,
          weeklyProgress: 0,
          monthlyProgress: 0,
          velocity: 0,
          acceleration: 0,
          consistencyScore: 1
        },
        milestones: [],
        strategy: config.strategy,
        performance: {
          efficiency: 1,
          consistency: 1,
          riskAdjustedProgress: 0,
          benchmarkComparison: 0,
          successRate: 0.5
        }
      }

      setGoals(prev => [...prev, newGoal])
      return newGoal.goalId
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
      return null
    }
  }, [fetchGoals])

  // Update goal
  const updateGoal = useCallback(async (goalId: string, updates: Partial<GoalRealtimeData>): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.updateGoal(goalId, updates)
        if (response.data?.success) {
          await fetchGoals()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for goal update')
      }

      // Fallback: simulate goal update
      setGoals(prev => prev.map(goal => 
        goal.goalId === goalId 
          ? { ...goal, ...updates, lastUpdate: new Date().toISOString() }
          : goal
      ))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
      return false
    }
  }, [fetchGoals])

  // Pause goal
  const pauseGoal = useCallback(async (goalId: string): Promise<boolean> => {
    return updateGoal(goalId, { status: 'paused' })
  }, [updateGoal])

  // Resume goal
  const resumeGoal = useCallback(async (goalId: string): Promise<boolean> => {
    return updateGoal(goalId, { status: 'active' })
  }, [updateGoal])

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.deleteGoal(goalId)
        if (response.data?.success) {
          await fetchGoals()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for goal deletion')
      }

      // Fallback: simulate deleting goal
      setGoals(prev => prev.filter(goal => goal.goalId !== goalId))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
      return false
    }
  }, [fetchGoals])

  // Optimize goal with AI
  const optimizeGoal = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.optimizeGoal(goalId)
        if (response.data?.success) {
          await fetchGoals()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for goal optimization')
      }

      // Fallback: simulate goal optimization
      setGoals(prev => prev.map(goal => {
        if (goal.goalId === goalId) {
          return {
            ...goal,
            strategy: {
              ...goal.strategy,
              aiRecommendations: [
                {
                  recommendation: 'Optimized allocation strategy implemented',
                  confidence: 0.9,
                  reasoning: 'AI analysis suggests improved performance potential',
                  priority: 'high' as const,
                  timestamp: new Date().toISOString()
                },
                ...goal.strategy.aiRecommendations
              ]
            },
            lastUpdate: new Date().toISOString()
          }
        }
        return goal
      }))
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize goal')
      return false
    }
  }, [fetchGoals])

  // Get AI recommendations
  const getAIRecommendations = useCallback(async (goalId: string): Promise<any[] | null> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.getGoalRecommendations(goalId)
        if (response.data) {
          return response.data
        }
      } catch (backendError) {
        console.warn('Backend not available for AI recommendations')
      }

      // Fallback: return existing recommendations
      const goal = goals.find(g => g.goalId === goalId)
      return goal?.strategy.aiRecommendations || null
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI recommendations')
      return null
    }
  }, [goals])

  // Calculate derived stats
  const totalGoals = goals.length
  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const avgProgress = goals.length > 0 
    ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length 
    : 0
  const highPriorityGoals = goals.filter(g => g.priority === 'high' || g.priority === 'critical').length

  // Real-time updates
  useEffect(() => {
    fetchGoals()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!loading) {
        fetchGoals()
      }
    }, 10000) // Update every 10 seconds (goals change less frequently)

    return () => clearInterval(interval)
  }, [fetchGoals, loading])

  return {
    goals,
    loading,
    error,
    connected,
    totalGoals,
    activeGoals,
    completedGoals,
    avgProgress,
    highPriorityGoals,
    createGoal,
    updateGoal,
    pauseGoal,
    resumeGoal,
    deleteGoal,
    optimizeGoal,
    getAIRecommendations,
    refresh: fetchGoals
  }
}