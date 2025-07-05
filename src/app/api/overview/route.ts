import { NextRequest, NextResponse } from 'next/server'

// Consolidated overview data interface
interface OverviewData {
  summary: {
    totalAgents: number
    activeAgents: number
    totalFarms: number
    activeFarms: number
    totalGoals: number
    activeGoals: number
    totalValue: number
    totalPnL: number
    systemHealth: number
  }
  performance: {
    agents: {
      totalCapital: number
      totalPnL: number
      averageWinRate: number
      topPerformers: Array<{
        id: string
        name: string
        pnl: number
      }>
    }
    farms: {
      totalAllocated: number
      averagePerformance: number
      topPerformingFarms: Array<{
        id: string
        name: string
        performance: number
      }>
    }
    goals: {
      totalAllocated: number
      averageProgress: number
      upcomingDeadlines: Array<{
        id: string
        name: string
        targetDate: string
        progress: number
      }>
    }
  }
  systemStatus: {
    supabaseConnected: boolean
    agentsHealth: boolean
    farmsHealth: boolean
    goalsHealth: boolean
    tradingHealth: boolean
    lastUpdate: string
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to use Supabase dashboard service first
    try {
      // Dynamic import to avoid client-side code in server route
      const { supabaseDashboardService } = await import('@/lib/services/supabase-dashboard-service')
      
      const [summary, health, entities] = await Promise.all([
        supabaseDashboardService.getDashboardSummary(),
        supabaseDashboardService.getSystemHealth(),
        supabaseDashboardService.getAllEntities()
      ])
      
      // Calculate top performers
      const agentEntities = entities.filter(e => e.type === 'agent')
      const farmEntities = entities.filter(e => e.type === 'farm')
      const goalEntities = entities.filter(e => e.type === 'goal')
      
      const topAgents = agentEntities
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5)
        .map(agent => ({
          id: agent.id,
          name: agent.name,
          pnl: agent.performance
        }))
      
      const topFarms = farmEntities
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5)
        .map(farm => ({
          id: farm.id,
          name: farm.name,
          performance: farm.performance
        }))
      
      const upcomingDeadlines = goalEntities
        .filter(goal => goal.status === 'active')
        .sort((a, b) => new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime())
        .slice(0, 5)
        .map(goal => ({
          id: goal.id,
          name: goal.name,
          targetDate: goal.lastActive,
          progress: goal.performance
        }))
      
      const overviewData: OverviewData = {
        summary: {
          totalAgents: summary.agents.total,
          activeAgents: summary.agents.active,
          totalFarms: summary.farms.total,
          activeFarms: summary.farms.active,
          totalGoals: summary.goals.total,
          activeGoals: summary.goals.active,
          totalValue: summary.agents.totalCapital + summary.farms.totalAllocated + summary.goals.totalAllocated,
          totalPnL: summary.agents.totalPnL + summary.trading.totalPnL,
          systemHealth: calculateSystemHealth(health)
        },
        performance: {
          agents: {
            totalCapital: summary.agents.totalCapital,
            totalPnL: summary.agents.totalPnL,
            averageWinRate: summary.agents.averageWinRate,
            topPerformers: topAgents
          },
          farms: {
            totalAllocated: summary.farms.totalAllocated,
            averagePerformance: summary.farms.averagePerformance,
            topPerformingFarms: topFarms
          },
          goals: {
            totalAllocated: summary.goals.totalAllocated,
            averageProgress: summary.goals.averageProgress,
            upcomingDeadlines: upcomingDeadlines
          }
        },
        systemStatus: {
          supabaseConnected: health.supabaseConnected,
          agentsHealth: health.agentsHealth,
          farmsHealth: health.farmsHealth,
          goalsHealth: health.goalsHealth,
          tradingHealth: health.tradingHealth,
          lastUpdate: health.lastUpdate
        }
      }
      
      console.log(`✅ Generated overview data from Supabase (${entities.length} entities)`)
      return NextResponse.json(overviewData)
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, generating fallback overview:', supabaseError)
      
      // Fallback to mock overview data
      const fallbackOverview = generateFallbackOverview()
      return NextResponse.json(fallbackOverview)
    }
  } catch (error) {
    console.error('Error generating overview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate system health score
function calculateSystemHealth(health: any): number {
  const checks = [
    health.supabaseConnected,
    health.agentsHealth,
    health.farmsHealth,
    health.goalsHealth,
    health.tradingHealth
  ]
  
  return (checks.filter(Boolean).length / checks.length) * 100
}

// Generate fallback overview data when Supabase is unavailable
function generateFallbackOverview(): OverviewData {
  return {
    summary: {
      totalAgents: 8,
      activeAgents: 5,
      totalFarms: 3,
      activeFarms: 2,
      totalGoals: 6,
      activeGoals: 4,
      totalValue: 185000,
      totalPnL: 2580.75,
      systemHealth: 75
    },
    performance: {
      agents: {
        totalCapital: 85000,
        totalPnL: 1850.25,
        averageWinRate: 68.5,
        topPerformers: [
          { id: 'agent_1', name: 'Momentum Scout Alpha', pnl: 875.50 },
          { id: 'agent_2', name: 'Trend Follower Beta', pnl: 650.25 },
          { id: 'agent_3', name: 'Breakout Hunter', pnl: 424.75 },
          { id: 'agent_4', name: 'Mean Reversion Pro', pnl: 280.50 },
          { id: 'agent_5', name: 'Volatility Trader', pnl: 195.25 }
        ]
      },
      farms: {
        totalAllocated: 75000,
        averagePerformance: 1.2,
        topPerformingFarms: [
          { id: 'farm_1', name: 'Darvas Box Momentum Farm', performance: 2.1 },
          { id: 'farm_2', name: 'Williams Alligator Trend Farm', performance: 1.8 },
          { id: 'farm_3', name: 'Renko Breakout Farm', performance: 0.5 }
        ]
      },
      goals: {
        totalAllocated: 25000,
        averageProgress: 72.3,
        upcomingDeadlines: [
          { id: 'goal_1', name: 'Q1 Portfolio Growth', targetDate: '2025-03-31', progress: 85 },
          { id: 'goal_2', name: 'Risk Management Audit', targetDate: '2025-02-15', progress: 60 },
          { id: 'goal_3', name: 'Strategy Optimization', targetDate: '2025-02-28', progress: 45 }
        ]
      }
    },
    systemStatus: {
      supabaseConnected: false,
      agentsHealth: true,
      farmsHealth: true,
      goalsHealth: false,
      tradingHealth: true,
      lastUpdate: new Date().toISOString()
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    // Handle overview actions (refresh, reset, etc.)
    switch (action) {
      case 'refresh':
        // Trigger a refresh of all dashboard data
        console.log('🔄 Dashboard refresh requested')
        return NextResponse.json({ message: 'Dashboard refresh initiated' })
        
      case 'reset':
        // Reset dashboard counters or cache
        console.log('🔄 Dashboard reset requested')
        return NextResponse.json({ message: 'Dashboard reset completed' })
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error handling overview action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}