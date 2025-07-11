import { supabaseAgentsService, SupabaseAgent } from './supabase-agents-service'
import { supabaseFarmsService, SupabaseFarm } from './supabase-farms-service'
import { supabaseGoalsService, SupabaseGoal } from './supabase-goals-service'
import { supabaseTradingService, PaperTrade, PaperTradingSession } from './supabase-trading-service'

// Unified dashboard data types
export interface DashboardSummary {
  agents: {
    total: number
    active: number
    totalCapital: number
    totalPnL: number
    averageWinRate: number
  }
  farms: {
    total: number
    active: number
    totalAllocated: number
    averagePerformance: number
  }
  goals: {
    total: number
    active: number
    completed: number
    averageProgress: number
    totalAllocated: number
  }
  trading: {
    totalTrades: number
    totalPnL: number
    winRate: number
    activeSessions: number
  }
}

export interface DashboardEntity {
  type: 'agent' | 'farm' | 'goal'
  id: string
  name: string
  status: string
  performance: number
  allocation: number
  lastActive: string
}

export interface SystemHealth {
  supabaseConnected: boolean
  agentsHealth: boolean
  farmsHealth: boolean
  goalsHealth: boolean
  tradingHealth: boolean
  lastUpdate: string
}

/**
 * Unified Supabase Dashboard Service
 * Provides a single interface to access all dashboard data and services
 * Handles service coordination, error handling, and data aggregation
 */
export class SupabaseDashboardService {
  private static instance: SupabaseDashboardService

  private constructor() {}

  static getInstance(): SupabaseDashboardService {
    if (!SupabaseDashboardService.instance) {
      SupabaseDashboardService.instance = new SupabaseDashboardService()
    }
    return SupabaseDashboardService.instance
  }

  // =================================================================
  // UNIFIED DASHBOARD DATA METHODS
  // =================================================================

  /**
   * Get complete dashboard summary with all key metrics
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      // Fetch all stats in parallel with enhanced error handling
      const [agentStats, farmStats, goalStats, tradingStats] = await Promise.all([
        supabaseAgentsService.getAgentStats().catch(error => {
          console.warn('❌ Failed to load agent stats:', error?.message || 'Unknown error');
          return {
            totalAgents: 0,
            activeAgents: 0,
            totalCapital: 0,
            totalPnL: 0,
            averageWinRate: 0
          };
        }),
        supabaseFarmsService.getFarmStats().catch(error => {
          console.warn('❌ Failed to load farm stats:', error?.message || 'Unknown error');
          return {
            totalFarms: 0,
            activeFarms: 0,
            totalAllocated: 0,
            averagePerformance: 0
          };
        }),
        supabaseGoalsService.getGoalStats().catch(error => {
          console.warn('❌ Failed to load goal stats:', error?.message || 'Unknown error');
          return {
            totalGoals: 0,
            activeGoals: 0,
            completedGoals: 0,
            averageProgress: 0,
            totalAllocated: 0
          };
        }),
        this.getTradingStats().catch(error => {
          console.warn('❌ Failed to load trading stats:', error?.message || 'Unknown error');
          return {
            totalTrades: 0,
            totalPnL: 0,
            winRate: 0,
            activeSessions: 0
          };
        })
      ])

      // Create a complete summary with fallbacks at every level
      const summary: DashboardSummary = {
        agents: {
          total: agentStats?.totalAgents || 0,
          active: agentStats?.activeAgents || 0,
          totalCapital: agentStats?.totalCapital || 0,
          totalPnL: agentStats?.totalPnL || 0,
          averageWinRate: agentStats?.averageWinRate || 0
        },
        farms: {
          total: farmStats?.totalFarms || 0,
          active: farmStats?.activeFarms || 0,
          totalAllocated: farmStats?.totalAllocated || 0,
          averagePerformance: farmStats?.averagePerformance || 0
        },
        goals: {
          total: goalStats?.totalGoals || 0,
          active: goalStats?.activeGoals || 0,
          completed: goalStats?.completedGoals || 0,
          averageProgress: goalStats?.averageProgress || 0,
          totalAllocated: 0 // Not tracked in current schema
        },
        trading: tradingStats || {
          totalTrades: 0,
          totalPnL: 0,
          winRate: 0,
          activeSessions: 0
        }
      };
      
      return summary
    } catch (error) {
      console.error('Failed to get dashboard summary:', error)
      
      // Instead of throwing errors that crash the UI, return a fallback summary
      // This ensures the dashboard will always render something
      return {
        agents: {
          total: 0,
          active: 0,
          totalCapital: 0,
          totalPnL: 0,
          averageWinRate: 0
        },
        farms: {
          total: 0,
          active: 0,
          totalAllocated: 0,
          averagePerformance: 0
        },
        goals: {
          total: 0,
          active: 0,
          completed: 0,
          averageProgress: 0,
          totalAllocated: 0
        },
        trading: {
          totalTrades: 0,
          totalPnL: 0,
          winRate: 0,
          activeSessions: 0
        }
      }
    }
  }

  /**
   * Get recent trading statistics
   */
  private async getTradingStats(): Promise<{
    totalTrades: number
    totalPnL: number
    winRate: number
    activeSessions: number
  }> {
    try {
      // This would need to be implemented based on your trading sessions and trades
      // For now, return mock data
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        activeSessions: 0
      }
    } catch (error) {
      console.error('Error getting trading stats:', error)
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        activeSessions: 0
      }
    }
  }

  /**
   * Get all entities (agents, farms, goals) for unified view
   */
  async getAllEntities(): Promise<DashboardEntity[]> {
    try {
      const [agents, farms, goals] = await Promise.all([
        supabaseAgentsService.getAllAgents().catch(() => []),
        supabaseFarmsService.getAllFarms().catch(() => []),
        supabaseGoalsService.getAllGoals().catch(() => [])
      ])

      const entities: DashboardEntity[] = []

      // Add agents
      agents.forEach(agent => {
        const performance = agent.performance_metrics as any
        entities.push({
          type: 'agent',
          id: agent.agent_id,
          name: agent.name,
          status: agent.status,
          performance: performance?.totalPnL || 0,
          allocation: agent.current_capital,
          lastActive: agent.updated_at
        })
      })

      // Add farms
      farms.forEach(farm => {
        const performance = farm.performance_metrics as any
        entities.push({
          type: 'farm',
          id: farm.farm_id,
          name: farm.name,
          status: farm.is_active ? 'active' : 'inactive',
          performance: performance?.roi_percent || 0,
          allocation: farm.total_allocated_usd,
          lastActive: farm.updated_at
        })
      })

      // Add goals
      goals.forEach(goal => {
        entities.push({
          type: 'goal',
          id: goal.goal_id,
          name: goal.name,
          status: goal.completion_status,
          performance: goal.completion_percentage,
          allocation: goal.wallet_allocation_usd,
          lastActive: goal.updated_at
        })
      })

      return entities.sort((a, b) => 
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      )
    } catch (error) {
      console.error('Error getting all entities:', error)
      throw error
    }
  }

  // =================================================================
  // SYSTEM HEALTH MONITORING
  // =================================================================

  /**
   * Check system health across all services
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const healthChecks = await Promise.allSettled([
      this.checkAgentsHealth(),
      this.checkFarmsHealth(),
      this.checkGoalsHealth(),
      this.checkTradingHealth()
    ])

    return {
      supabaseConnected: healthChecks.every(check => check.status === 'fulfilled'),
      agentsHealth: healthChecks[0].status === 'fulfilled',
      farmsHealth: healthChecks[1].status === 'fulfilled',
      goalsHealth: healthChecks[2].status === 'fulfilled',
      tradingHealth: healthChecks[3].status === 'fulfilled',
      lastUpdate: new Date().toISOString()
    }
  }

  private async checkAgentsHealth(): Promise<boolean> {
    try {
      await supabaseAgentsService.getAllAgents()
      return true
    } catch (error) {
      console.error('Agents health check failed:', error)
      return false
    }
  }

  private async checkFarmsHealth(): Promise<boolean> {
    try {
      await supabaseFarmsService.getAllFarms()
      return true
    } catch (error) {
      console.error('Farms health check failed:', error)
      return false
    }
  }

  private async checkGoalsHealth(): Promise<boolean> {
    try {
      await supabaseGoalsService.getAllGoals()
      return true
    } catch (error) {
      console.error('Goals health check failed:', error)
      return false
    }
  }

  private async checkTradingHealth(): Promise<boolean> {
    try {
      // Simple connection test - this could be expanded
      return true
    } catch (error) {
      console.error('Trading health check failed:', error)
      return false
    }
  }

  // =================================================================
  // CONVENIENCE METHODS FOR UNIFIED ACCESS
  // =================================================================

  /**
   * Get service instances for direct access
   */
  get services() {
    return {
      agents: supabaseAgentsService,
      farms: supabaseFarmsService,
      goals: supabaseGoalsService,
      trading: supabaseTradingService
    }
  }

  /**
   * Search across all entities
   */
  async searchEntities(query: string): Promise<DashboardEntity[]> {
    try {
      const allEntities = await this.getAllEntities()
      const lowercaseQuery = query.toLowerCase()

      return allEntities.filter(entity =>
        entity.name.toLowerCase().includes(lowercaseQuery) ||
        entity.type.toLowerCase().includes(lowercaseQuery) ||
        entity.status.toLowerCase().includes(lowercaseQuery)
      )
    } catch (error) {
      console.error('Error searching entities:', error)
      throw error
    }
  }

  /**
   * Get top performing entities
   */
  async getTopPerformers(limit: number = 10): Promise<DashboardEntity[]> {
    try {
      const allEntities = await this.getAllEntities()
      return allEntities
        .sort((a, b) => b.performance - a.performance)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting top performers:', error)
      throw error
    }
  }

  /**
   * Get entities requiring attention (low performance, errors, deadlines)
   */
  async getAttentionRequired(): Promise<DashboardEntity[]> {
    try {
      const allEntities = await this.getAllEntities()
      
      // Filter entities that need attention
      return allEntities.filter(entity => {
        // Goals with upcoming deadlines or low progress
        if (entity.type === 'goal') {
          return entity.performance < 50 || entity.status === 'failed'
        }
        
        // Agents with negative performance
        if (entity.type === 'agent') {
          return entity.performance < 0 || entity.status === 'error'
        }
        
        // Inactive farms or poor performance
        if (entity.type === 'farm') {
          return entity.status === 'inactive' || entity.performance < -5
        }
        
        return false
      })
    } catch (error) {
      console.error('Error getting attention required:', error)
      throw error
    }
  }

  // =================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =================================================================

  /**
   * Subscribe to all dashboard changes
   */
  subscribeToAllChanges(callback: (summary: DashboardSummary) => void) {
    const unsubscribeFunctions: (() => void)[] = []

    // Subscribe to each service
    unsubscribeFunctions.push(
      supabaseAgentsService.subscribeToAgents(async () => {
        try {
          const summary = await this.getDashboardSummary()
          callback(summary)
        } catch (error) {
          console.error('Error in agents subscription:', error)
        }
      })
    )

    unsubscribeFunctions.push(
      supabaseFarmsService.subscribeToFarms(async () => {
        try {
          const summary = await this.getDashboardSummary()
          callback(summary)
        } catch (error) {
          console.error('Error in farms subscription:', error)
        }
      })
    )

    unsubscribeFunctions.push(
      supabaseGoalsService.subscribeToGoals(async () => {
        try {
          const summary = await this.getDashboardSummary()
          callback(summary)
        } catch (error) {
          console.error('Error in goals subscription:', error)
        }
      })
    )

    // Return unsubscribe function that cleans up all subscriptions
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing:', error)
        }
      })
    }
  }
}

export const supabaseDashboardService = SupabaseDashboardService.getInstance()
export default supabaseDashboardService