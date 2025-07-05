import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

// Type definitions based on Supabase schema
export interface SupabaseAgent {
  agent_id: string
  name: string
  description?: string
  agent_type: string
  strategy: string
  status: 'active' | 'paused' | 'stopped'
  farm_id?: string
  initial_capital: number
  current_capital: number
  configuration: Record<string, any>
  performance_metrics: Record<string, any>
  risk_limits: Record<string, any>
  trading_session_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateAgentInput {
  name: string
  description?: string
  agent_type: string
  strategy: string
  farm_id?: string
  initial_capital?: number
  configuration?: Record<string, any>
  risk_limits?: Record<string, any>
}

export interface UpdateAgentInput {
  name?: string
  description?: string
  status?: 'active' | 'paused' | 'stopped'
  current_capital?: number
  performance_metrics?: Record<string, any>
  risk_limits?: Record<string, any>
  is_active?: boolean
  trading_session_id?: string
}

export class SupabaseAgentsService {
  private static instance: SupabaseAgentsService
  private client = supabase

  private constructor() {}

  static getInstance(): SupabaseAgentsService {
    if (!SupabaseAgentsService.instance) {
      SupabaseAgentsService.instance = new SupabaseAgentsService()
    }
    return SupabaseAgentsService.instance
  }

  async getAllAgents(): Promise<SupabaseAgent[]> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agents:', error)
        throw error
      }

      return data as SupabaseAgent[]
    } catch (error) {
      console.error('Error in getAllAgents:', error)
      throw error
    }
  }

  async getAgentById(agentId: string): Promise<SupabaseAgent | null> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .select('*')
        .eq('agent_id', agentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Agent not found
        }
        console.error('Error fetching agent:', error)
        throw error
      }

      return data as SupabaseAgent
    } catch (error) {
      console.error('Error in getAgentById:', error)
      throw error
    }
  }

  async createAgent(agentData: CreateAgentInput): Promise<SupabaseAgent> {
    try {
      const newAgent = {
        name: agentData.name,
        description: agentData.description,
        agent_type: agentData.agent_type,
        strategy: agentData.strategy,
        status: 'active' as const,
        farm_id: agentData.farm_id,
        initial_capital: agentData.initial_capital || 10000,
        current_capital: agentData.initial_capital || 10000,
        configuration: agentData.configuration || {},
        performance_metrics: {
          totalPnL: 0,
          winRate: 0,
          totalTrades: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          avgTradeSize: 0
        },
        risk_limits: agentData.risk_limits || {
          maxPositionSize: 0.1,
          maxDailyLoss: 1000,
          maxDrawdown: 0.15,
          stopLossEnabled: true,
          takeProfitEnabled: true
        },
        is_active: true
      }

      const { data, error } = await this.client
        .from('agents')
        .insert(newAgent)
        .select()
        .single()

      if (error) {
        console.error('Error creating agent:', error)
        throw error
      }

      return data as SupabaseAgent
    } catch (error) {
      console.error('Error in createAgent:', error)
      throw error
    }
  }

  async updateAgent(agentId: string, updates: UpdateAgentInput): Promise<SupabaseAgent> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .update(updates)
        .eq('agent_id', agentId)
        .select()
        .single()

      if (error) {
        console.error('Error updating agent:', error)
        throw error
      }

      return data as SupabaseAgent
    } catch (error) {
      console.error('Error in updateAgent:', error)
      throw error
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('agents')
        .delete()
        .eq('agent_id', agentId)

      if (error) {
        console.error('Error deleting agent:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteAgent:', error)
      throw error
    }
  }

  async updateAgentStatus(agentId: string, status: 'active' | 'paused' | 'stopped'): Promise<SupabaseAgent> {
    return this.updateAgent(agentId, { 
      status, 
      is_active: status === 'active' 
    })
  }

  async updateAgentPerformance(
    agentId: string, 
    performanceMetrics: Record<string, any>
  ): Promise<SupabaseAgent> {
    return this.updateAgent(agentId, { performance_metrics: performanceMetrics })
  }

  async getActiveAgents(): Promise<SupabaseAgent[]> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching active agents:', error)
        throw error
      }

      return data as SupabaseAgent[]
    } catch (error) {
      console.error('Error in getActiveAgents:', error)
      throw error
    }
  }

  async getAgentsByFarm(farmId: string): Promise<SupabaseAgent[]> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agents by farm:', error)
        throw error
      }

      return data as SupabaseAgent[]
    } catch (error) {
      console.error('Error in getAgentsByFarm:', error)
      throw error
    }
  }

  async getAgentsByStrategy(strategy: string): Promise<SupabaseAgent[]> {
    try {
      const { data, error } = await this.client
        .from('agents')
        .select('*')
        .eq('strategy', strategy)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agents by strategy:', error)
        throw error
      }

      return data as SupabaseAgent[]
    } catch (error) {
      console.error('Error in getAgentsByStrategy:', error)
      throw error
    }
  }

  async getAgentStats(): Promise<{
    totalAgents: number
    activeAgents: number
    totalCapital: number
    totalPnL: number
    averageWinRate: number
  }> {
    try {
      const agents = await this.getAllAgents()
      const activeAgents = agents.filter(a => a.is_active)
      
      const totalCapital = agents.reduce((sum, agent) => 
        sum + Number(agent.current_capital), 0
      )

      const totalPnL = agents.reduce((sum, agent) => {
        const performance = agent.performance_metrics as any
        return sum + (performance?.totalPnL || 0)
      }, 0)

      const averageWinRate = agents.length > 0 
        ? agents.reduce((sum, agent) => {
            const performance = agent.performance_metrics as any
            return sum + (performance?.winRate || 0)
          }, 0) / agents.length
        : 0

      return {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        totalCapital,
        totalPnL,
        averageWinRate
      }
    } catch (error) {
      console.error('Error in getAgentStats:', error)
      throw error
    }
  }

  // Real-time subscription to agent changes
  subscribeToAgents(callback: (agents: SupabaseAgent[]) => void) {
    const subscription = this.client
      .channel('agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents'
        },
        async () => {
          // Refresh agents data
          try {
            const agents = await this.getAllAgents()
            callback(agents)
          } catch (error) {
            console.error('Error in agent subscription callback:', error)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}

export const supabaseAgentsService = SupabaseAgentsService.getInstance()
export default supabaseAgentsService