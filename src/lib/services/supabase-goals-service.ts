import { supabaseService } from './supabase-service'
import { Database } from '@/types/database.types'

// Type definitions based on Supabase schema
export interface SupabaseGoal {
  goal_id: string
  name: string
  description?: string
  goal_type: string
  target_criteria: Record<string, any>
  current_progress: Record<string, any>
  assigned_entities: any[]
  completion_status: 'active' | 'completed' | 'failed' | 'paused'
  completion_percentage: number
  wallet_allocation_usd: number
  priority: number
  deadline?: string
  created_at: string
  completed_at?: string
  updated_at: string
}

export interface CreateGoalInput {
  name: string
  description?: string
  goal_type: string
  target_criteria: Record<string, any>
  assigned_entities?: any[]
  wallet_allocation_usd?: number
  priority?: number
  deadline?: string
}

export interface UpdateGoalInput {
  name?: string
  description?: string
  goal_type?: string
  target_criteria?: Record<string, any>
  current_progress?: Record<string, any>
  assigned_entities?: any[]
  completion_status?: 'active' | 'completed' | 'failed' | 'paused'
  completion_percentage?: number
  wallet_allocation_usd?: number
  priority?: number
  deadline?: string
}

export class SupabaseGoalsService {
  private static instance: SupabaseGoalsService
  private client = supabaseService

  private constructor() {}

  static getInstance(): SupabaseGoalsService {
    if (!SupabaseGoalsService.instance) {
      SupabaseGoalsService.instance = new SupabaseGoalsService()
    }
    return SupabaseGoalsService.instance
  }

  async getAllGoals(): Promise<SupabaseGoal[]> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching goals:', error)
        throw error
      }

      return data as SupabaseGoal[]
    } catch (error) {
      console.error('Error in getAllGoals:', error)
      throw error
    }
  }

  async getGoalById(goalId: string): Promise<SupabaseGoal | null> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .eq('goal_id', goalId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Goal not found
        }
        console.error('Error fetching goal:', error)
        throw error
      }

      return data as SupabaseGoal
    } catch (error) {
      console.error('Error in getGoalById:', error)
      throw error
    }
  }

  async createGoal(goalData: CreateGoalInput): Promise<SupabaseGoal> {
    try {
      const newGoal = {
        name: goalData.name,
        description: goalData.description,
        goal_type: goalData.goal_type,
        target_criteria: goalData.target_criteria,
        current_progress: {},
        assigned_entities: goalData.assigned_entities || [],
        completion_status: 'active' as const,
        completion_percentage: 0,
        wallet_allocation_usd: goalData.wallet_allocation_usd || 0,
        priority: goalData.priority || 1,
        deadline: goalData.deadline
      }

      const { data, error } = await this.client.client
        .from('goals')
        .insert(newGoal)
        .select()
        .single()

      if (error) {
        console.error('Error creating goal:', error)
        throw error
      }

      return data as SupabaseGoal
    } catch (error) {
      console.error('Error in createGoal:', error)
      throw error
    }
  }

  async updateGoal(goalId: string, updates: UpdateGoalInput): Promise<SupabaseGoal> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .update(updates)
        .eq('goal_id', goalId)
        .select()
        .single()

      if (error) {
        console.error('Error updating goal:', error)
        throw error
      }

      return data as SupabaseGoal
    } catch (error) {
      console.error('Error in updateGoal:', error)
      throw error
    }
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await this.client.client
        .from('goals')
        .delete()
        .eq('goal_id', goalId)

      if (error) {
        console.error('Error deleting goal:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteGoal:', error)
      throw error
    }
  }

  async updateGoalProgress(
    goalId: string, 
    progress: Record<string, any>,
    completionPercentage?: number
  ): Promise<SupabaseGoal> {
    const updates: UpdateGoalInput = {
      current_progress: progress,
    }

    if (completionPercentage !== undefined) {
      updates.completion_percentage = completionPercentage
      
      // Auto-complete goal if 100%
      if (completionPercentage >= 100) {
        updates.completion_status = 'completed'
        updates.completed_at = new Date().toISOString()
      }
    }

    return this.updateGoal(goalId, updates)
  }

  async updateGoalStatus(
    goalId: string, 
    status: 'active' | 'completed' | 'failed' | 'paused'
  ): Promise<SupabaseGoal> {
    const updates: UpdateGoalInput = {
      completion_status: status
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    return this.updateGoal(goalId, updates)
  }

  async getActiveGoals(): Promise<SupabaseGoal[]> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .eq('completion_status', 'active')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching active goals:', error)
        throw error
      }

      return data as SupabaseGoal[]
    } catch (error) {
      console.error('Error in getActiveGoals:', error)
      throw error
    }
  }

  async getCompletedGoals(): Promise<SupabaseGoal[]> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .eq('completion_status', 'completed')
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching completed goals:', error)
        throw error
      }

      return data as SupabaseGoal[]
    } catch (error) {
      console.error('Error in getCompletedGoals:', error)
      throw error
    }
  }

  async getGoalsByType(goalType: string): Promise<SupabaseGoal[]> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .eq('goal_type', goalType)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching goals by type:', error)
        throw error
      }

      return data as SupabaseGoal[]
    } catch (error) {
      console.error('Error in getGoalsByType:', error)
      throw error
    }
  }

  async getGoalsByPriority(priority: number): Promise<SupabaseGoal[]> {
    try {
      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .eq('priority', priority)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching goals by priority:', error)
        throw error
      }

      return data as SupabaseGoal[]
    } catch (error) {
      console.error('Error in getGoalsByPriority:', error)
      throw error
    }
  }

  async getGoalStats(): Promise<{
    totalGoals: number
    activeGoals: number
    completedGoals: number
    averageProgress: number
    totalAllocated: number
  }> {
    try {
      const goals = await this.getAllGoals()
      const activeGoals = goals.filter(g => g.completion_status === 'active')
      const completedGoals = goals.filter(g => g.completion_status === 'completed')
      
      const totalAllocated = goals.reduce((sum, goal) => 
        sum + Number(goal.wallet_allocation_usd), 0
      )

      const averageProgress = goals.length > 0 
        ? goals.reduce((sum, goal) => sum + goal.completion_percentage, 0) / goals.length
        : 0

      return {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        averageProgress,
        totalAllocated
      }
    } catch (error) {
      console.error('Error in getGoalStats:', error)
      throw error
    }
  }

  async getUpcomingDeadlines(daysAhead: number = 30): Promise<SupabaseGoal[]> {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)

      const { data, error } = await this.client.client
        .from('goals')
        .select('*')
        .eq('completion_status', 'active')
        .not('deadline', 'is', null)
        .lte('deadline', futureDate.toISOString())
        .order('deadline', { ascending: true })

      if (error) {
        console.error('Error fetching upcoming deadlines:', error)
        throw error
      }

      return data as SupabaseGoal[]
    } catch (error) {
      console.error('Error in getUpcomingDeadlines:', error)
      throw error
    }
  }

  // Real-time subscription to goal changes
  subscribeToGoals(callback: (goals: SupabaseGoal[]) => void) {
    const subscription = this.client.client
      .channel('goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals'
        },
        async () => {
          // Refresh goals data
          try {
            const goals = await this.getAllGoals()
            callback(goals)
          } catch (error) {
            console.error('Error in goal subscription callback:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}

export const supabaseGoalsService = SupabaseGoalsService.getInstance()
export default supabaseGoalsService