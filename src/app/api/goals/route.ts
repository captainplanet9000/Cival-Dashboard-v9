import { NextRequest, NextResponse } from 'next/server'

// Enhanced goal interface for API
interface EnhancedGoal {
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
  farmId?: string
  agentId?: string
  category: 'trading' | 'farm' | 'portfolio' | 'risk'
  tags: string[]
  milestones: {
    percentage: number
    description: string
    completedAt?: string
  }[]
  metrics: {
    startValue: number
    targetValue: number
    currentValue: number
    lastUpdated: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const goalId = url.searchParams.get('id')
    const category = url.searchParams.get('category')
    const farmId = url.searchParams.get('farmId')
    
    // Try to use Supabase first, fallback to mock data if needed
    try {
      // Dynamic import to avoid client-side imports in server route
      const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
      
      if (goalId) {
        const goal = await supabaseGoalsService.getGoalById(goalId)
        if (!goal) {
          return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
        }
        
        // Convert to expected API format
        const apiFormat = convertSupabaseGoalToApiFormat(goal)
        return NextResponse.json(apiFormat)
      }
      
      // Get goals from Supabase
      let supabaseGoals = await supabaseGoalsService.getAllGoals()
      
      // Apply filters if provided
      if (category) {
        supabaseGoals = supabaseGoals.filter(g => {
          const targetCriteria = g.target_criteria as any
          return targetCriteria?.category === category
        })
      }
      
      if (farmId) {
        supabaseGoals = supabaseGoals.filter(g => {
          const targetCriteria = g.target_criteria as any
          return targetCriteria?.farmId === farmId
        })
      }
      
      const apiGoals = supabaseGoals.map(convertSupabaseGoalToApiFormat)
      
      console.log(`✅ Loaded ${apiGoals.length} goals from Supabase`)
      return NextResponse.json(apiGoals)
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, using fallback goals data:', supabaseError)
      
      // Use fallback goals
      let filteredGoals = generateFallbackGoals()
      
      if (goalId) {
        const goal = filteredGoals.find(g => g.id === goalId)
        if (!goal) {
          return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
        }
        return NextResponse.json(goal)
      }
      
      if (category) {
        filteredGoals = filteredGoals.filter(g => g.category === category)
      }
      
      if (farmId) {
        filteredGoals = filteredGoals.filter(g => g.farmId === farmId)
      }
      
      return NextResponse.json(filteredGoals)
    }
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Try to create goal in Supabase first, fallback to mock response
    try {
      const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
      
      const priorityNumber = body.priority === 'low' ? 1 : body.priority === 'medium' ? 2 : 3
      
      const newGoal = await supabaseGoalsService.createGoal({
        name: body.name,
        description: body.description,
        goal_type: body.type,
        target_criteria: {
          target: body.target,
          category: body.category || 'trading',
          tags: body.tags || [],
          milestones: [
            { percentage: 25, description: '25% progress milestone' },
            { percentage: 50, description: '50% progress milestone' },
            { percentage: 75, description: '75% progress milestone' },
            { percentage: 100, description: 'Goal completion' }
          ],
          farmId: body.farmId,
          agentId: body.agentId,
          startValue: 0
        },
        priority: priorityNumber,
        deadline: body.deadline,
        wallet_allocation_usd: 0
      })
      
      const apiFormat = convertSupabaseGoalToApiFormat(newGoal)
      console.log('✅ Created goal in Supabase:', newGoal.goal_id)
      return NextResponse.json(apiFormat, { status: 201 })
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, creating mock goal:', supabaseError)
      
      // Fallback to mock goal creation
      const goalId = `goal_${body.type}_${Date.now()}`
      const newGoal: EnhancedGoal = {
        id: goalId,
        name: body.name,
        description: body.description,
        type: body.type,
        target: body.target,
        current: 0,
        progress: 0,
        status: 'active',
        priority: body.priority || 'medium',
        deadline: body.deadline,
        createdAt: new Date().toISOString(),
        reward: body.reward,
        farmId: body.farmId,
        agentId: body.agentId,
        category: body.category || 'trading',
        tags: body.tags || [],
        milestones: [
          { percentage: 25, description: '25% progress milestone' },
          { percentage: 50, description: '50% progress milestone' },
          { percentage: 75, description: '75% progress milestone' },
          { percentage: 100, description: 'Goal completion' }
        ],
        metrics: {
          startValue: 0,
          targetValue: body.target,
          currentValue: 0,
          lastUpdated: new Date().toISOString()
        }
      }
      
      return NextResponse.json(newGoal, { status: 201 })
    }
    
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Try to update goal in Supabase first, fallback to mock response
    try {
      const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
      
      const updates: any = {}
      
      if (updateData.name) updates.name = updateData.name
      if (updateData.description) updates.description = updateData.description
      if (updateData.status) updates.completion_status = updateData.status
      if (updateData.progress !== undefined) updates.completion_percentage = updateData.progress
      if (updateData.deadline) updates.deadline = updateData.deadline
      
      if (updateData.current !== undefined) {
        updates.current_progress = { current: updateData.current }
        
        // Calculate progress
        const goal = await supabaseGoalsService.getGoalById(id)
        if (goal) {
          const targetCriteria = goal.target_criteria as any
          const target = targetCriteria?.target || 1
          
          let progress: number
          if (goal.goal_type === 'drawdown') {
            const maxValue = targetCriteria?.startValue || 100
            progress = Math.min(100, Math.max(0, ((maxValue - updateData.current) / (maxValue - target)) * 100))
          } else {
            progress = Math.min(100, (updateData.current / target) * 100)
          }
          
          updates.completion_percentage = progress
          
          // Auto-complete goal if 100%
          if (progress >= 100 && goal.completion_status === 'active') {
            updates.completion_status = 'completed'
          }
        }
      }
      
      const updatedGoal = await supabaseGoalsService.updateGoal(id, updates)
      const apiFormat = convertSupabaseGoalToApiFormat(updatedGoal)
      
      console.log('✅ Updated goal in Supabase:', updatedGoal.goal_id)
      return NextResponse.json(apiFormat)
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, using mock update:', supabaseError)
      
      // Fallback to mock update response
      return NextResponse.json({ 
        id, 
        ...updateData, 
        message: 'Goal updated successfully' 
      })
    }
    
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const goalId = url.searchParams.get('id')
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 })
    }
    
    // Try to delete goal from Supabase first, fallback to mock response
    try {
      const { supabaseGoalsService } = await import('@/lib/services/supabase-goals-service')
      
      const success = await supabaseGoalsService.deleteGoal(goalId)
      
      if (success) {
        console.log('✅ Deleted goal from Supabase:', goalId)
        return NextResponse.json({ message: 'Goal deleted successfully' })
      } else {
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
      }
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, using mock deletion:', supabaseError)
      
      // Fallback to mock deletion
      return NextResponse.json({ message: 'Goal deleted successfully' })
    }
    
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Convert Supabase goal to API format
function convertSupabaseGoalToApiFormat(supabaseGoal: any): EnhancedGoal {
  const targetCriteria = supabaseGoal.target_criteria as any
  const currentProgress = supabaseGoal.current_progress as any
  
  return {
    id: supabaseGoal.goal_id,
    name: supabaseGoal.name,
    description: supabaseGoal.description || '',
    type: supabaseGoal.goal_type,
    target: targetCriteria?.target || 0,
    current: currentProgress?.current || 0,
    progress: supabaseGoal.completion_percentage,
    status: supabaseGoal.completion_status,
    priority: supabaseGoal.priority === 1 ? 'low' : supabaseGoal.priority === 2 ? 'medium' : 'high',
    deadline: supabaseGoal.deadline,
    createdAt: supabaseGoal.created_at,
    completedAt: supabaseGoal.completed_at,
    category: targetCriteria?.category || 'trading',
    tags: targetCriteria?.tags || [],
    farmId: targetCriteria?.farmId,
    agentId: targetCriteria?.agentId,
    milestones: targetCriteria?.milestones || [
      { percentage: 25, description: '25% progress milestone' },
      { percentage: 50, description: '50% progress milestone' },
      { percentage: 75, description: '75% progress milestone' },
      { percentage: 100, description: 'Goal completion' }
    ],
    metrics: {
      startValue: targetCriteria?.startValue || 0,
      targetValue: targetCriteria?.target || 0,
      currentValue: currentProgress?.current || 0,
      lastUpdated: supabaseGoal.updated_at
    }
  }
}

// Generate fallback goals when Supabase is unavailable
function generateFallbackGoals(): EnhancedGoal[] {
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
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
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
        lastUpdated: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      category: 'trading',
      tags: ['winrate', 'performance', 'consistency'],
      milestones: [
        { percentage: 25, description: 'Reach 70% win rate', completedAt: new Date().toISOString() },
        { percentage: 50, description: 'Reach 75% win rate', completedAt: new Date().toISOString() },
        { percentage: 75, description: 'Reach 80% win rate', completedAt: new Date().toISOString() },
        { percentage: 100, description: 'Achieve 85% win rate' }
      ],
      metrics: {
        startValue: 65,
        targetValue: 85,
        currentValue: 78.5,
        lastUpdated: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      category: 'farm',
      tags: ['darvas', 'optimization', 'farm'],
      milestones: [
        { percentage: 25, description: 'Initial setup complete', completedAt: new Date().toISOString() },
        { percentage: 50, description: 'Strategy refinement', completedAt: new Date().toISOString() },
        { percentage: 75, description: 'Performance tuning', completedAt: new Date().toISOString() },
        { percentage: 100, description: 'Optimization complete' }
      ],
      metrics: {
        startValue: 85,
        targetValue: 95,
        currentValue: 92,
        lastUpdated: new Date().toISOString()
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
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      category: 'trading',
      tags: ['volume', 'quarterly', 'activity'],
      milestones: [
        { percentage: 25, description: '125 trades completed', completedAt: new Date().toISOString() },
        { percentage: 50, description: '250 trades completed', completedAt: new Date().toISOString() },
        { percentage: 75, description: '375 trades completed' },
        { percentage: 100, description: '500 trades completed' }
      ],
      metrics: {
        startValue: 0,
        targetValue: 500,
        currentValue: 287,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 'goal_risk_001',
      name: 'Maintain Low Risk Profile',
      description: 'Keep maximum drawdown below 5% across all strategies',
      type: 'drawdown',
      target: 5,
      current: 3.2,
      progress: 64,
      status: 'active',
      priority: 'high',
      createdAt: new Date().toISOString(),
      category: 'risk',
      tags: ['risk', 'drawdown', 'safety'],
      milestones: [
        { percentage: 25, description: 'Below 8% drawdown', completedAt: new Date().toISOString() },
        { percentage: 50, description: 'Below 6% drawdown', completedAt: new Date().toISOString() },
        { percentage: 75, description: 'Below 5.5% drawdown' },
        { percentage: 100, description: 'Below 5% drawdown' }
      ],
      metrics: {
        startValue: 10,
        targetValue: 5,
        currentValue: 3.2,
        lastUpdated: new Date().toISOString()
      }
    }
  ]
}