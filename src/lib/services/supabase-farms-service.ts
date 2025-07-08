import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

// Type definitions based on existing Supabase farms table schema
export interface SupabaseFarm {
  farm_id: string
  name: string
  description?: string
  farm_type: string
  total_allocated_usd: number
  agent_count: number
  performance_metrics?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateFarmInput {
  name: string
  description?: string
  farm_type: string
  total_allocated_usd?: number
  agent_count?: number
  performance_metrics?: Record<string, any>
  is_active?: boolean
}

export interface UpdateFarmInput {
  name?: string
  description?: string
  farm_type?: string
  total_allocated_usd?: number
  agent_count?: number
  performance_metrics?: Record<string, any>
  is_active?: boolean
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
        .from('farms')
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
        .from('farms')
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
        description: farmData.description || '',
        farm_type: farmData.farm_type,
        total_allocated_usd: farmData.total_allocated_usd || 10000,
        agent_count: farmData.agent_count || 0,
        performance_metrics: farmData.performance_metrics || {
          totalPnL: 0,
          winRate: 0,
          tradeCount: 0,
          roiPercent: 0
        },
        is_active: farmData.is_active !== false
      }

      const { data, error } = await this.client
        .from('farms')
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
        .from('farms')
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
        .from('farms')
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
    return this.updateFarm(farmId, { is_active: isActive })
  }

  async updateFarmPerformance(
    farmId: string, 
    performanceMetrics: Record<string, any>
  ): Promise<SupabaseFarm> {
    return this.updateFarm(farmId, { performance_metrics: performanceMetrics })
  }

  async getActiveFarms(): Promise<SupabaseFarm[]> {
    try {
      const { data, error } = await this.client
        .from('farms')
        .select('*')
        .eq('is_active', true)
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

  async getFarmsByType(farmType: string): Promise<SupabaseFarm[]> {
    try {
      const { data, error } = await this.client
        .from('farms')
        .select('*')
        .eq('farm_type', farmType)
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
      const activeFarms = farms.filter(f => f.is_active)
      
      const totalAllocated = farms.reduce((sum, farm) => 
        sum + Number(farm.total_allocated_usd), 0
      )

      const averagePerformance = farms.length > 0 
        ? farms.reduce((sum, farm) => {
            const metrics = farm.performance_metrics as any
            return sum + (metrics?.roiPercent || 0)
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
      .channel('farms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farms'
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