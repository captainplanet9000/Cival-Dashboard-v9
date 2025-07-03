import { NextRequest, NextResponse } from 'next/server'

// This would be replaced with actual database operations
const farms = new Map()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body
    
    if (!status || !['active', 'paused', 'stopped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    // Mock farm status update - replace with Supabase
    const farm = farms.get(id) || { id, status: 'active' }
    farm.status = status
    farm.updatedAt = new Date().toISOString()
    
    // Update active agents count based on status
    if (status === 'active') {
      farm.performance = { ...farm.performance, activeAgents: farm.agentCount }
    } else {
      farm.performance = { ...farm.performance, activeAgents: 0 }
    }
    
    farms.set(id, farm)
    
    return NextResponse.json({ 
      message: `Farm ${status} successfully`,
      farm 
    })
  } catch (error) {
    console.error('Error updating farm status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}