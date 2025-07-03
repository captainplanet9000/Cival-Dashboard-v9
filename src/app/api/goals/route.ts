import { NextRequest, NextResponse } from 'next/server'

// Mock goals data - replace with Supabase integration
let goals = [
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
  }
]

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const goalId = url.searchParams.get('id')
    const category = url.searchParams.get('category')
    const farmId = url.searchParams.get('farmId')
    
    if (goalId) {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }
      return NextResponse.json(goal)
    }
    
    let filteredGoals = goals
    
    if (category) {
      filteredGoals = filteredGoals.filter(g => g.category === category)
    }
    
    if (farmId) {
      filteredGoals = filteredGoals.filter(g => g.farmId === farmId)
    }
    
    return NextResponse.json(filteredGoals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newGoal = {
      id: `goal_${body.type}_${Date.now()}`,
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
    
    goals.push(newGoal)
    
    return NextResponse.json(newGoal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    const goalIndex = goals.findIndex(g => g.id === id)
    if (goalIndex === -1) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    goals[goalIndex] = { ...goals[goalIndex], ...updateData }
    
    // Update progress if current value changed
    if (updateData.current !== undefined) {
      const goal = goals[goalIndex]
      if (goal.type === 'drawdown') {
        const maxValue = goal.metrics.startValue
        goal.progress = Math.min(100, Math.max(0, ((maxValue - goal.current) / (maxValue - goal.target)) * 100))
      } else {
        goal.progress = Math.min(100, (goal.current / goal.target) * 100)
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
    }
    
    return NextResponse.json(goals[goalIndex])
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
    
    const goalIndex = goals.findIndex(g => g.id === goalId)
    if (goalIndex === -1) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    goals.splice(goalIndex, 1)
    
    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}