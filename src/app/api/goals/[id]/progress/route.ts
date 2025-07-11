import { NextRequest, NextResponse } from 'next/server'

// This would be replaced with actual database operations
const goals = new Map()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { current } = body
    
    if (current === undefined || typeof current !== 'number') {
      return NextResponse.json({ error: 'Current value must be a number' }, { status: 400 })
    }
    
    // Mock goal progress update - replace with Supabase
    const goal = goals.get(id) || { 
      id, 
      target: 100, 
      current: 0, 
      progress: 0, 
      status: 'active',
      type: 'profit',
      milestones: [
        { percentage: 25, description: '25% milestone' },
        { percentage: 50, description: '50% milestone' },
        { percentage: 75, description: '75% milestone' },
        { percentage: 100, description: 'Goal completion' }
      ]
    }
    
    goal.current = current
    goal.metrics = { ...goal.metrics, currentValue: current, lastUpdated: new Date().toISOString() }
    
    // Calculate progress
    if (goal.type === 'drawdown') {
      const maxValue = goal.metrics?.startValue || 100
      goal.progress = Math.min(100, Math.max(0, ((maxValue - current) / (maxValue - goal.target)) * 100))
    } else {
      goal.progress = Math.min(100, (current / goal.target) * 100)
    }
    
    // Check if goal is completed
    if (goal.progress >= 100 && goal.status === 'active') {
      goal.status = 'completed'
      goal.completedAt = new Date().toISOString()
    }
    
    // Update milestones
    goal.milestones.forEach((milestone: any) => {
      if (goal.progress >= milestone.percentage && !milestone.completedAt) {
        milestone.completedAt = new Date().toISOString()
      }
    })
    
    goals.set(id, goal)
    
    return NextResponse.json({ 
      message: 'Goal progress updated successfully',
      goal 
    })
  } catch (error) {
    console.error('Error updating goal progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}