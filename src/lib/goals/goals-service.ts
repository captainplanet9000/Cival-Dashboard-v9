'use client'

import { useState, useEffect } from 'react'

export interface Goal {
  id: string
  name: string
  description: string
  type: 'profit' | 'winRate' | 'trades' | 'drawdown' | 'sharpe' | 'portfolio' | 'farm'
  target: number
  current: number
  progress: number
  status: 'active' | 'completed' | 'failed' | 'paused'
  priority: 'low' | 'medium' | 'high'
  deadline?: string
  createdAt: string
  completedAt?: string
  reward?: string
  
  // Additional goal configuration
  farmId?: string // If this goal is tied to a specific farm
  agentId?: string // If this goal is tied to a specific agent
  category: 'trading' | 'farm' | 'portfolio' | 'risk'
  tags: string[]
  
  // Progress tracking
  milestones: {
    percentage: number
    description: string
    completedAt?: string
  }[]
  
  // Metrics tracking
  metrics: {
    startValue: number
    targetValue: number
    currentValue: number
    lastUpdated: string
  }
}

export interface GoalCreateConfig {
  name: string
  description: string
  type: Goal['type']
  target: number
  priority: Goal['priority']
  deadline?: string
  reward?: string
  farmId?: string
  agentId?: string
  category: Goal['category']
  tags?: string[]
}

class GoalsService {
  private static instance: GoalsService
  private goals: Goal[] = []
  private subscribers = new Set<() => void>()
  private useSupabase = false

  private constructor() {
    this.loadGoals()
    this.checkSupabaseAvailability()
  }

  private async checkSupabaseAvailability() {
    try {
      // Check if Supabase is configured and available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        // Try to dynamically import and use Supabase service
        const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
        if (supabaseGoalsService) {
          this.useSupabase = true
          console.log('🟢 Goals service: Using Supabase for persistence')
          // Load goals from Supabase
          await this.loadFromSupabase()
        }
      } else {
        console.log('🟡 Goals service: Using localStorage (Supabase not configured)')
      }
    } catch (error) {
      console.log('🟡 Goals service: Supabase unavailable, using localStorage fallback')
      this.useSupabase = false
    }
  }

  private async loadFromSupabase() {
    try {
      const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
      const supabaseGoals = await supabaseGoalsService.getAllGoals()
      
      // Convert Supabase goals to local format
      this.goals = supabaseGoals.map(sg => ({
        id: sg.goal_id,
        name: sg.name,
        description: sg.description || '',
        type: sg.goal_type as Goal['type'],
        target: (sg.target_criteria as any)?.target || 0,
        current: (sg.current_progress as any)?.current || 0,
        progress: sg.completion_percentage,
        status: sg.completion_status as Goal['status'],
        priority: sg.priority === 1 ? 'low' : sg.priority === 2 ? 'medium' : 'high',
        deadline: sg.deadline,
        createdAt: sg.created_at,
        completedAt: sg.completed_at,
        category: (sg.target_criteria as any)?.category || 'trading',
        tags: (sg.target_criteria as any)?.tags || [],
        milestones: (sg.target_criteria as any)?.milestones || [],
        metrics: {
          startValue: (sg.target_criteria as any)?.startValue || 0,
          targetValue: (sg.target_criteria as any)?.target || 0,
          currentValue: (sg.current_progress as any)?.current || 0,
          lastUpdated: sg.updated_at
        }
      }))
      
      this.notifySubscribers()
    } catch (error) {
      console.error('Failed to load goals from Supabase:', error)
    }
  }

  static getInstance(): GoalsService {
    if (!GoalsService.instance) {
      GoalsService.instance = new GoalsService()
    }
    return GoalsService.instance
  }

  private loadGoals() {
    try {
      const stored = localStorage.getItem('trading_goals')
      if (stored && stored.trim() !== '') {
        this.goals = JSON.parse(stored)
      } else {
        // Initialize with default goals if none exist
        this.goals = this.createDefaultGoals()
        this.saveGoals()
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
      this.goals = this.createDefaultGoals()
      this.saveGoals()
    }
  }

  private createDefaultGoals(): Goal[] {
    const now = new Date().toISOString()
    
    return [
      {
        id: 'goal_profit_001',
        name: 'Monthly Profit Target',
        description: 'Achieve $5,000 profit this month across all trading activities',
        type: 'profit',
        target: 5000,
        current: 2350,
        progress: 47,
        status: 'active',
        priority: 'high',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        createdAt: now,
        category: 'portfolio',
        tags: ['monthly', 'profit', 'primary'],
        milestones: [
          { percentage: 25, description: 'First quarter milestone', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { percentage: 50, description: 'Halfway point' },
          { percentage: 75, description: 'Three quarters complete' },
          { percentage: 100, description: 'Goal achieved' }
        ],
        metrics: {
          startValue: 0,
          targetValue: 5000,
          currentValue: 2350,
          lastUpdated: now
        }
      },
      {
        id: 'goal_winrate_001',
        name: 'Achieve 85% Win Rate',
        description: 'Maintain a consistent 85% win rate across all trading strategies',
        type: 'winRate',
        target: 85,
        current: 78.5,
        progress: 92.4,
        status: 'active',
        priority: 'medium',
        createdAt: now,
        category: 'trading',
        tags: ['winrate', 'performance', 'consistency'],
        milestones: [
          { percentage: 25, description: 'Reach 70% win rate', completedAt: now },
          { percentage: 50, description: 'Reach 75% win rate', completedAt: now },
          { percentage: 75, description: 'Reach 80% win rate', completedAt: now },
          { percentage: 100, description: 'Achieve 85% win rate' }
        ],
        metrics: {
          startValue: 65,
          targetValue: 85,
          currentValue: 78.5,
          lastUpdated: now
        }
      },
      {
        id: 'goal_farm_001',
        name: 'Darvas Box Farm Optimization',
        description: 'Optimize Darvas Box farm to achieve 95% performance rating',
        type: 'farm',
        target: 95,
        current: 92,
        progress: 96.8,
        status: 'active',
        priority: 'high',
        farmId: 'farm_darvas_1',
        createdAt: now,
        category: 'farm',
        tags: ['darvas', 'optimization', 'farm'],
        milestones: [
          { percentage: 25, description: 'Initial setup complete', completedAt: now },
          { percentage: 50, description: 'Strategy refinement', completedAt: now },
          { percentage: 75, description: 'Performance tuning', completedAt: now },
          { percentage: 100, description: 'Optimization complete' }
        ],
        metrics: {
          startValue: 85,
          targetValue: 95,
          currentValue: 92,
          lastUpdated: now
        }
      },
      {
        id: 'goal_trades_001',
        name: 'Complete 500 Trades',
        description: 'Execute 500 successful trades this quarter',
        type: 'trades',
        target: 500,
        current: 287,
        progress: 57.4,
        status: 'active',
        priority: 'medium',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        createdAt: now,
        category: 'trading',
        tags: ['volume', 'quarterly', 'activity'],
        milestones: [
          { percentage: 25, description: '125 trades completed', completedAt: now },
          { percentage: 50, description: '250 trades completed', completedAt: now },
          { percentage: 75, description: '375 trades completed' },
          { percentage: 100, description: '500 trades completed' }
        ],
        metrics: {
          startValue: 0,
          targetValue: 500,
          currentValue: 287,
          lastUpdated: now
        }
      },
      {
        id: 'goal_risk_001',
        name: 'Maintain Low Risk Profile',
        description: 'Keep maximum drawdown below 5% across all strategies',
        type: 'drawdown',
        target: 5,
        current: 3.2,
        progress: 64, // Inverted progress for drawdown (lower is better)
        status: 'active',
        priority: 'high',
        createdAt: now,
        category: 'risk',
        tags: ['risk', 'drawdown', 'safety'],
        milestones: [
          { percentage: 25, description: 'Below 8% drawdown', completedAt: now },
          { percentage: 50, description: 'Below 6% drawdown', completedAt: now },
          { percentage: 75, description: 'Below 5.5% drawdown' },
          { percentage: 100, description: 'Below 5% drawdown' }
        ],
        metrics: {
          startValue: 10,
          targetValue: 5,
          currentValue: 3.2,
          lastUpdated: now
        }
      }
    ]
  }

  private saveGoals() {
    try {
      localStorage.setItem('trading_goals', JSON.stringify(this.goals))
      this.notifySubscribers()
    } catch (error) {
      console.error('Failed to save goals:', error)
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback())
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  getAllGoals(): Goal[] {
    return [...this.goals]
  }

  getGoalById(id: string): Goal | undefined {
    return this.goals.find(goal => goal.id === id)
  }

  getGoalsByCategory(category: Goal['category']): Goal[] {
    return this.goals.filter(goal => goal.category === category)
  }

  getGoalsByFarmId(farmId: string): Goal[] {
    return this.goals.filter(goal => goal.farmId === farmId)
  }

  async createGoal(config: GoalCreateConfig): Promise<string> {
    if (this.useSupabase) {
      try {
        const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
        
        // Convert local format to Supabase format
        const priorityNumber = config.priority === 'low' ? 1 : config.priority === 'medium' ? 2 : 3
        
        const supabaseGoal = await supabaseGoalsService.createGoal({
          name: config.name,
          description: config.description,
          goal_type: config.type,
          target_criteria: {
            target: config.target,
            category: config.category,
            tags: config.tags || [],
            milestones: [
              { percentage: 25, description: '25% progress milestone' },
              { percentage: 50, description: '50% progress milestone' },
              { percentage: 75, description: '75% progress milestone' },
              { percentage: 100, description: 'Goal completion' }
            ],
            farmId: config.farmId,
            agentId: config.agentId,
            startValue: 0
          },
          priority: priorityNumber,
          deadline: config.deadline
        })
        
        // Refresh local data
        await this.loadFromSupabase()
        return supabaseGoal.goal_id
      } catch (error) {
        console.error('Failed to create goal in Supabase, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    const goalId = `goal_${config.type}_${Date.now()}`
    
    const newGoal: Goal = {
      id: goalId,
      name: config.name,
      description: config.description,
      type: config.type,
      target: config.target,
      current: 0,
      progress: 0,
      status: 'active',
      priority: config.priority,
      deadline: config.deadline,
      createdAt: new Date().toISOString(),
      reward: config.reward,
      farmId: config.farmId,
      agentId: config.agentId,
      category: config.category,
      tags: config.tags || [],
      milestones: [
        { percentage: 25, description: '25% progress milestone' },
        { percentage: 50, description: '50% progress milestone' },
        { percentage: 75, description: '75% progress milestone' },
        { percentage: 100, description: 'Goal completion' }
      ],
      metrics: {
        startValue: 0,
        targetValue: config.target,
        currentValue: 0,
        lastUpdated: new Date().toISOString()
      }
    }

    this.goals.push(newGoal)
    this.saveGoals()
    
    return goalId
  }

  async updateGoalProgress(goalId: string, currentValue: number): Promise<boolean> {
    const goal = this.goals.find(g => g.id === goalId)
    if (!goal) return false

    goal.current = currentValue
    goal.metrics.currentValue = currentValue
    goal.metrics.lastUpdated = new Date().toISOString()

    // Calculate progress
    if (goal.type === 'drawdown') {
      // For drawdown, progress is inverted (lower current value is better)
      const maxValue = goal.metrics.startValue
      goal.progress = Math.min(100, Math.max(0, ((maxValue - currentValue) / (maxValue - goal.target)) * 100))
    } else {
      // For other types, higher current value is better
      goal.progress = Math.min(100, (currentValue / goal.target) * 100)
    }

    // Check if goal is completed
    if (goal.progress >= 100 && goal.status === 'active') {
      goal.status = 'completed'
      goal.completedAt = new Date().toISOString()
    }

    // Update milestones
    goal.milestones.forEach(milestone => {
      if (goal.progress >= milestone.percentage && !milestone.completedAt) {
        milestone.completedAt = new Date().toISOString()
      }
    })

    // Broadcast real-time update via WebSocket
    await this.broadcastGoalUpdate(goalId, { 
      progress: goal.progress, 
      status: goal.status, 
      currentValue: goal.current 
    })

    this.saveGoals()
    return true
  }

  async updateGoalStatus(goalId: string, status: Goal['status']): Promise<boolean> {
    const goal = this.goals.find(g => g.id === goalId)
    if (!goal) return false

    goal.status = status
    
    if (status === 'completed' && !goal.completedAt) {
      goal.completedAt = new Date().toISOString()
    }

    // Broadcast real-time update via WebSocket
    await this.broadcastGoalUpdate(goalId, { 
      status: goal.status, 
      progress: goal.progress, 
      currentValue: goal.current 
    })

    this.saveGoals()
    return true
  }

  // WebSocket integration for real-time updates
  private async broadcastGoalUpdate(goalId: string, updates: { progress?: number; status?: Goal['status']; currentValue?: number }) {
    try {
      // Import WebSocket service dynamically to avoid circular dependencies
      const { getWebSocketClient } = await import('@/lib/realtime/websocket')
      
      const client = getWebSocketClient()
      if (client.connected) {
        const goal = this.goals.find(g => g.id === goalId)
        if (goal) {
          // Send WebSocket message for goal update
          client.send({ 
            type: 'goal_update', 
            data: {
              goalId,
              progress: updates.progress ?? goal.progress,
              status: updates.status ?? goal.status,
              currentValue: updates.currentValue ?? goal.current,
              targetValue: goal.target,
              timestamp: Date.now()
            }
          })
          console.log(`🎯 Goal update broadcast: ${goalId}`)
        }
      }
    } catch (error) {
      console.log('🟡 WebSocket not available for goal updates')
    }
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const index = this.goals.findIndex(g => g.id === goalId)
    if (index === -1) return false

    this.goals.splice(index, 1)
    this.saveGoals()
    return true
  }

  getActiveGoals(): Goal[] {
    return this.goals.filter(goal => goal.status === 'active')
  }

  getCompletedGoals(): Goal[] {
    return this.goals.filter(goal => goal.status === 'completed')
  }

  getGoalsByPriority(priority: Goal['priority']): Goal[] {
    return this.goals.filter(goal => goal.priority === priority)
  }

  getAverageProgress(): number {
    if (this.goals.length === 0) return 0
    const totalProgress = this.goals.reduce((sum, goal) => sum + goal.progress, 0)
    return totalProgress / this.goals.length
  }

  getGoalStats() {
    const total = this.goals.length
    const active = this.getActiveGoals().length
    const completed = this.getCompletedGoals().length
    const failed = this.goals.filter(g => g.status === 'failed').length
    
    return {
      total,
      active,
      completed,
      failed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageProgress: this.getAverageProgress()
    }
  }
}

// Custom hook for React components
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const service = GoalsService.getInstance()
    
    // Initial load
    setGoals(service.getAllGoals())
    setLoading(false)

    // Subscribe to updates
    const unsubscribe = service.subscribe(() => {
      setGoals(service.getAllGoals())
    })

    return unsubscribe
  }, [])

  const service = GoalsService.getInstance()

  return {
    goals,
    loading,
    
    // Computed values
    activeGoals: goals.filter(g => g.status === 'active'),
    completedGoals: goals.filter(g => g.status === 'completed'),
    stats: service.getGoalStats(),
    
    // Actions
    createGoal: (config: GoalCreateConfig) => service.createGoal(config),
    updateGoalProgress: (goalId: string, currentValue: number) => service.updateGoalProgress(goalId, currentValue),
    updateGoalStatus: (goalId: string, status: Goal['status']) => service.updateGoalStatus(goalId, status),
    deleteGoal: (goalId: string) => service.deleteGoal(goalId),
    getGoalsByCategory: (category: Goal['category']) => service.getGoalsByCategory(category),
    getGoalsByFarmId: (farmId: string) => service.getGoalsByFarmId(farmId),
    getGoalsByPriority: (priority: Goal['priority']) => service.getGoalsByPriority(priority)
  }
}

export default GoalsService