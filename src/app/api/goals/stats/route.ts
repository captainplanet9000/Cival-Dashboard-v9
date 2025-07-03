import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock goal statistics - replace with Supabase aggregations
    const stats = {
      totalGoals: 5,
      activeGoals: 4,
      completedGoals: 1,
      failedGoals: 0,
      pausedGoals: 0,
      completionRate: 20.0,
      averageProgress: 71.6,
      categories: {
        trading: { total: 2, active: 2, completed: 0 },
        farm: { total: 1, active: 1, completed: 0 },
        portfolio: { total: 1, active: 1, completed: 0 },
        risk: { total: 1, active: 1, completed: 0 }
      },
      priorities: {
        high: { total: 3, active: 3, completed: 0 },
        medium: { total: 2, active: 1, completed: 1 },
        low: { total: 0, active: 0, completed: 0 }
      },
      upcomingDeadlines: [
        {
          id: 'goal_profit_001',
          name: 'Monthly Profit Target',
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 15,
          progress: 47
        },
        {
          id: 'goal_trades_001',
          name: 'Complete 500 Trades',
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 60,
          progress: 57.4
        }
      ],
      recentCompletions: [
        {
          id: 'goal_milestone_001',
          name: 'Reach 70% Win Rate',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'milestone'
        }
      ],
      lastUpdated: new Date().toISOString()
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching goal stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}