'use client'

import { useState, useEffect } from 'react'

export interface Farm {
  id: string
  name: string
  description: string
  strategy: string
  agentCount: number
  totalCapital: number
  coordinationMode: 'independent' | 'coordinated' | 'hierarchical'
  status: 'active' | 'paused' | 'stopped'
  createdAt: string
  agents: string[]
  performance: {
    totalValue: number
    totalPnL: number
    winRate: number
    tradeCount: number
    roiPercent: number
    activeAgents: number
    avgAgentPerformance: number
  }
  goals?: any[]
  walletAllocations?: any[]
}

export interface FarmCreateConfig {
  name: string
  description: string
  farmType: string
  targetAllocation: number
  strategy: string
  parameters?: Record<string, any>
  riskLimits?: {
    maxDrawdown: number
    maxConcentration: number
    maxLeverage: number
  }
  agents?: string[]
}

class FarmsService {
  private static instance: FarmsService
  private farms: Farm[] = []
  private subscribers = new Set<() => void>()
  private useSupabase = false

  private constructor() {
    this.loadFarms()
    this.checkSupabaseAvailability()
  }

  private async checkSupabaseAvailability() {
    try {
      // Check if Supabase is configured and available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        // Try to dynamically import and use Supabase service
        const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
        if (supabaseFarmsService) {
          this.useSupabase = true
          console.log('🟢 Farms service: Using Supabase for persistence')
          // Load farms from Supabase
          await this.loadFromSupabase()
        }
      } else {
        console.log('🟡 Farms service: Using localStorage (Supabase not configured)')
      }
    } catch (error) {
      console.log('🟡 Farms service: Supabase unavailable, using localStorage fallback')
      this.useSupabase = false
    }
  }

  private async loadFromSupabase() {
    try {
      const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
      const supabaseFarms = await supabaseFarmsService.getAllFarms()
      
      // Convert Supabase farms to local format
      this.farms = supabaseFarms.map(sf => ({
        id: sf.farm_id,
        name: sf.name,
        description: sf.description || '',
        strategy: sf.farm_type,
        agentCount: sf.agent_count,
        totalCapital: Number(sf.total_allocated_usd),
        coordinationMode: 'coordinated' as const,
        status: sf.is_active ? 'active' as const : 'paused' as const,
        createdAt: sf.created_at,
        agents: [],
        performance: {
          totalValue: Number(sf.total_allocated_usd),
          totalPnL: (sf.performance_metrics as any)?.totalPnL || 0,
          winRate: (sf.performance_metrics as any)?.winRate || 0,
          tradeCount: (sf.performance_metrics as any)?.tradeCount || 0,
          roiPercent: (sf.performance_metrics as any)?.roiPercent || 0,
          activeAgents: sf.is_active ? sf.agent_count : 0,
          avgAgentPerformance: (sf.performance_metrics as any)?.avgAgentPerformance || 0
        }
      }))
      
      this.notifySubscribers()
    } catch (error) {
      console.error('Failed to load farms from Supabase:', error)
    }
  }

  static getInstance(): FarmsService {
    if (!FarmsService.instance) {
      FarmsService.instance = new FarmsService()
    }
    return FarmsService.instance
  }

  private loadFarms() {
    try {
      const stored = localStorage.getItem('trading_farms')
      if (stored && stored.trim() !== '') {
        this.farms = JSON.parse(stored)
      } else {
        // Initialize with default farms if none exist
        this.farms = this.createDefaultFarms()
        this.saveFarms()
      }
    } catch (error) {
      console.error('Failed to load farms:', error)
      this.farms = this.createDefaultFarms()
      this.saveFarms()
    }
  }

  private createDefaultFarms(): Farm[] {
    return [
      {
        id: 'farm_darvas_1',
        name: 'Darvas Box Momentum Farm',
        description: 'Specialized in breakout pattern recognition using Darvas Box methodology',
        strategy: 'darvas_box',
        agentCount: 3,
        totalCapital: 50000,
        coordinationMode: 'coordinated',
        status: 'active',
        createdAt: new Date().toISOString(),
        agents: ['darvas_agent_1', 'darvas_agent_2', 'darvas_agent_3'],
        performance: {
          totalValue: 52500,
          totalPnL: 2500,
          winRate: 92,
          tradeCount: 45,
          roiPercent: 5.0,
          activeAgents: 3,
          avgAgentPerformance: 833.33
        }
      },
      {
        id: 'farm_williams_1',
        name: 'Williams Alligator Trend Farm',
        description: 'Advanced trend identification using Williams Alligator indicator',
        strategy: 'williams_alligator',
        agentCount: 4,
        totalCapital: 75000,
        coordinationMode: 'hierarchical',
        status: 'active',
        createdAt: new Date().toISOString(),
        agents: ['williams_agent_1', 'williams_agent_2', 'williams_agent_3', 'williams_agent_4'],
        performance: {
          totalValue: 78750,
          totalPnL: 3750,
          winRate: 87,
          tradeCount: 62,
          roiPercent: 5.0,
          activeAgents: 4,
          avgAgentPerformance: 937.5
        }
      },
      {
        id: 'farm_renko_1',
        name: 'Renko Breakout Farm',
        description: 'Price movement analysis using Renko chart breakout patterns',
        strategy: 'renko_breakout',
        agentCount: 3,
        totalCapital: 60000,
        coordinationMode: 'coordinated',
        status: 'paused',
        createdAt: new Date().toISOString(),
        agents: ['renko_agent_1', 'renko_agent_2', 'renko_agent_3'],
        performance: {
          totalValue: 63600,
          totalPnL: 3600,
          winRate: 94,
          tradeCount: 38,
          roiPercent: 6.0,
          activeAgents: 0,
          avgAgentPerformance: 1200
        }
      }
    ]
  }

  private saveFarms() {
    try {
      localStorage.setItem('trading_farms', JSON.stringify(this.farms))
      this.notifySubscribers()
    } catch (error) {
      console.error('Failed to save farms:', error)
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback())
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  getAllFarms(): Farm[] {
    return [...this.farms]
  }

  getFarmById(id: string): Farm | undefined {
    return this.farms.find(farm => farm.id === id)
  }

  async createFarm(config: FarmCreateConfig): Promise<string> {
    if (this.useSupabase) {
      try {
        const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
        const supabaseFarm = await supabaseFarmsService.createFarm({
          name: config.name,
          description: config.description,
          farm_type: config.strategy,
          total_allocated_usd: config.targetAllocation,
          agent_count: config.agents?.length || 0
        })
        
        // Refresh local data
        await this.loadFromSupabase()
        return supabaseFarm.farm_id
      } catch (error) {
        console.error('Failed to create farm in Supabase, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    const farmId = `farm_${config.strategy}_${Date.now()}`
    
    const newFarm: Farm = {
      id: farmId,
      name: config.name,
      description: config.description,
      strategy: config.strategy,
      agentCount: config.agents?.length || 0,
      totalCapital: config.targetAllocation,
      coordinationMode: 'coordinated',
      status: 'active',
      createdAt: new Date().toISOString(),
      agents: config.agents || [],
      performance: {
        totalValue: config.targetAllocation,
        totalPnL: 0,
        winRate: 0,
        tradeCount: 0,
        roiPercent: 0,
        activeAgents: config.agents?.length || 0,
        avgAgentPerformance: 0
      }
    }

    this.farms.push(newFarm)
    this.saveFarms()
    
    return farmId
  }

  async updateFarmStatus(farmId: string, status: Farm['status']): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
        await supabaseFarmsService.updateFarmStatus(farmId, status === 'active')
        
        // Refresh local data
        await this.loadFromSupabase()
        return true
      } catch (error) {
        console.error('Failed to update farm status in Supabase, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    const farm = this.farms.find(f => f.id === farmId)
    if (!farm) return false

    farm.status = status
    
    // Update active agents count based on status
    if (status === 'active') {
      farm.performance.activeAgents = farm.agentCount
    } else {
      farm.performance.activeAgents = 0
    }

    this.saveFarms()
    return true
  }

  async deleteFarm(farmId: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
        await supabaseFarmsService.deleteFarm(farmId)
        
        // Refresh local data
        await this.loadFromSupabase()
        return true
      } catch (error) {
        console.error('Failed to delete farm in Supabase, falling back to localStorage:', error)
      }
    }

    // Fallback to localStorage
    const index = this.farms.findIndex(f => f.id === farmId)
    if (index === -1) return false

    this.farms.splice(index, 1)
    this.saveFarms()
    return true
  }

  async addAgentToFarm(farmId: string, agentId: string): Promise<boolean> {
    const farm = this.farms.find(f => f.id === farmId)
    if (!farm) return false

    if (!farm.agents.includes(agentId)) {
      farm.agents.push(agentId)
      farm.agentCount = farm.agents.length
      if (farm.status === 'active') {
        farm.performance.activeAgents = farm.agentCount
      }
      this.saveFarms()
    }
    
    return true
  }

  async removeAgentFromFarm(farmId: string, agentId: string): Promise<boolean> {
    const farm = this.farms.find(f => f.id === farmId)
    if (!farm) return false

    const index = farm.agents.indexOf(agentId)
    if (index !== -1) {
      farm.agents.splice(index, 1)
      farm.agentCount = farm.agents.length
      if (farm.status === 'active') {
        farm.performance.activeAgents = farm.agentCount
      }
      this.saveFarms()
    }
    
    return true
  }

  async updateFarmPerformance(farmId: string, performance: Partial<Farm['performance']>): Promise<boolean> {
    const farm = this.farms.find(f => f.id === farmId)
    if (!farm) return false

    farm.performance = { ...farm.performance, ...performance }
    this.saveFarms()
    return true
  }

  getActiveFarms(): Farm[] {
    return this.farms.filter(farm => farm.status === 'active')
  }

  getTotalFarmValue(): number {
    return this.farms.reduce((sum, farm) => sum + farm.performance.totalValue, 0)
  }

  getTotalFarmPnL(): number {
    return this.farms.reduce((sum, farm) => sum + farm.performance.totalPnL, 0)
  }

  getAverageWinRate(): number {
    const activeFarms = this.getActiveFarms()
    if (activeFarms.length === 0) return 0
    
    const totalWinRate = activeFarms.reduce((sum, farm) => sum + farm.performance.winRate, 0)
    return totalWinRate / activeFarms.length
  }
}

// Custom hook for React components
export function useFarms() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const service = FarmsService.getInstance()
    
    // Initial load
    setFarms(service.getAllFarms())
    setLoading(false)

    // Subscribe to updates
    const unsubscribe = service.subscribe(() => {
      setFarms(service.getAllFarms())
    })

    return unsubscribe
  }, [])

  const service = FarmsService.getInstance()

  return {
    farms,
    loading,
    
    // Computed values
    activeFarms: farms.filter(f => f.status === 'active'),
    totalFarms: farms.length,
    totalValue: service.getTotalFarmValue(),
    totalPnL: service.getTotalFarmPnL(),
    averageWinRate: service.getAverageWinRate(),
    
    // Actions
    createFarm: (config: FarmCreateConfig) => service.createFarm(config),
    updateFarmStatus: (farmId: string, status: Farm['status']) => service.updateFarmStatus(farmId, status),
    deleteFarm: (farmId: string) => service.deleteFarm(farmId),
    addAgentToFarm: (farmId: string, agentId: string) => service.addAgentToFarm(farmId, agentId),
    removeAgentFromFarm: (farmId: string, agentId: string) => service.removeAgentFromFarm(farmId, agentId),
    updateFarmPerformance: (farmId: string, performance: Partial<Farm['performance']>) => 
      service.updateFarmPerformance(farmId, performance)
  }
}

export default FarmsService