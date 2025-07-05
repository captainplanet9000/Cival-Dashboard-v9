import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

// Type definitions based on Supabase farm_configurations schema
export interface SupabaseFarm {
  farm_id: string
  name: string
  strategy_type: string
  target_allocation: number
  max_agents: number
  min_agents: number
  risk_tolerance: number
  performance_requirements: Record<string, any>
  agent_selection_criteria: Record<string, any>
  rebalancing_frequency: number
  auto_assignment_enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreateFarmInput {
  name: string
  strategy_type: string
  target_allocation?: number
  max_agents?: number
  min_agents?: number
  risk_tolerance?: number
  performance_requirements?: Record<string, any>
  agent_selection_criteria?: Record<string, any>
  rebalancing_frequency?: number
  auto_assignment_enabled?: boolean
}

export interface UpdateFarmInput {
  name?: string
  strategy_type?: string
  target_allocation?: number
  max_agents?: number
  min_agents?: number
  risk_tolerance?: number
  performance_requirements?: Record<string, any>
  agent_selection_criteria?: Record<string, any>
  rebalancing_frequency?: number
  auto_assignment_enabled?: boolean
}

export class SupabaseFarmsService {
  private static instance: SupabaseFarmsService
  private client = supabase

  private constructor() {}

  static getInstance(): SupabaseFarmsService {
    if (!SupabaseFarmsService.instance) {
      SupabaseFarmsService.instance = new SupabaseFarmsService()
    }
    return SupabaseFarmsService.instance
  }

  async getAllFarms(): Promise<SupabaseFarm[]> {
    try {
      const { data, error } = await this.client
        .from('farm_configurations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching farms:', error)
        throw error
      }

      return data as SupabaseFarm[]
    } catch (error) {
      console.error('Error in getAllFarms:', error)
      throw error
    }
  }

  async getFarmById(farmId: string): Promise<SupabaseFarm | null> {
    try {
      const { data, error } = await this.client
        .from('farm_configurations')
        .select('*')
        .eq('farm_id', farmId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Farm not found
        }
        console.error('Error fetching farm:', error)
        throw error
      }

      return data as SupabaseFarm
    } catch (error) {
      console.error('Error in getFarmById:', error)
      throw error
    }
  }

  async createFarm(farmData: CreateFarmInput): Promise<SupabaseFarm> {
    try {
      const newFarm = {
        name: farmData.name,
        strategy_type: farmData.strategy_type,
        target_allocation: farmData.target_allocation || 10000,
        max_agents: farmData.max_agents || 10,
        min_agents: farmData.min_agents || 1,
        risk_tolerance: farmData.risk_tolerance || 0.5,
        performance_requirements: farmData.performance_requirements || {
          min_sharpe_ratio: 1.0,
          max_drawdown: 0.15,
          min_win_rate: 0.55
        },
        agent_selection_criteria: farmData.agent_selection_criteria || {
          strategy_compatibility: true,
          performance_threshold: 0.1,
          risk_alignment: true
        },
        rebalancing_frequency: farmData.rebalancing_frequency || 24,
        auto_assignment_enabled: farmData.auto_assignment_enabled !== false
      }

      const { data, error } = await this.client
        .from('farm_configurations')
        .insert(newFarm)
        .select()
        .single()

      if (error) {
        console.error('Error creating farm:', error)
        throw error
      }

      return data as SupabaseFarm
    } catch (error) {
      console.error('Error in createFarm:', error)
      throw error
    }
  }

  async updateFarm(farmId: string, updates: UpdateFarmInput): Promise<SupabaseFarm> {
    try {
      const { data, error } = await this.client
        .from('farm_configurations')
        .update(updates)
        .eq('farm_id', farmId)
        .select()
        .single()

      if (error) {
        console.error('Error updating farm:', error)
        throw error
      }

      return data as SupabaseFarm
    } catch (error) {
      console.error('Error in updateFarm:', error)
      throw error
    }
  }

  async deleteFarm(farmId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('farm_configurations')
        .delete()
        .eq('farm_id', farmId)

      if (error) {
        console.error('Error deleting farm:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteFarm:', error)
      throw error
    }
  }

  async updateFarmStatus(farmId: string, isActive: boolean): Promise<SupabaseFarm> {
    return this.updateFarm(farmId, { auto_assignment_enabled: isActive })
  }

  async updateFarmPerformance(
    farmId: string, 
    performanceRequirements: Record<string, any>
  ): Promise<SupabaseFarm> {
    return this.updateFarm(farmId, { performance_requirements: performanceRequirements })
  }

  async getActiveFarms(): Promise<SupabaseFarm[]> {
    try {
      const { data, error } = await this.client
        .from('farm_configurations')
        .select('*')
        .eq('auto_assignment_enabled', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching active farms:', error)
        throw error
      }

      return data as SupabaseFarm[]
    } catch (error) {
      console.error('Error in getActiveFarms:', error)
      throw error
    }
  }

  async getFarmsByType(strategyType: string): Promise<SupabaseFarm[]> {
    try {
      const { data, error } = await this.client
        .from('farm_configurations')
        .select('*')
        .eq('strategy_type', strategyType)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching farms by type:', error)
        throw error
      }

      return data as SupabaseFarm[]
    } catch (error) {
      console.error('Error in getFarmsByType:', error)
      throw error
    }
  }

  async getFarmStats(): Promise<{
    totalFarms: number
    activeFarms: number
    totalAllocated: number
    averagePerformance: number
  }> {
    try {
      const farms = await this.getAllFarms()
      const activeFarms = farms.filter(f => f.auto_assignment_enabled)
      
      const totalAllocated = farms.reduce((sum, farm) => 
        sum + Number(farm.target_allocation), 0
      )

      const averagePerformance = farms.length > 0 
        ? farms.reduce((sum, farm) => {
            const requirements = farm.performance_requirements as any
            return sum + (requirements?.min_sharpe_ratio || 0)
          }, 0) / farms.length
        : 0

      return {
        totalFarms: farms.length,
        activeFarms: activeFarms.length,
        totalAllocated,
        averagePerformance
      }
    } catch (error) {
      console.error('Error in getFarmStats:', error)
      throw error
    }
  }

  // Real-time subscription to farm changes
  subscribeToFarms(callback: (farms: SupabaseFarm[]) => void) {
    const subscription = this.client
      .channel('farm_configurations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farm_configurations'
        },
        async () => {
          // Refresh farms data
          try {
            const farms = await this.getAllFarms()
            callback(farms)
          } catch (error) {
            console.error('Error in farm subscription callback:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}

export const supabaseFarmsService = SupabaseFarmsService.getInstance()
export default supabaseFarmsService