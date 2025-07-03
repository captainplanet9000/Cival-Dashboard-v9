import { NextRequest, NextResponse } from 'next/server'

// Mock farms data - replace with Supabase integration
let farms = [
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const farmId = url.searchParams.get('id')
    
    if (farmId) {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) {
        return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
      }
      return NextResponse.json(farm)
    }
    
    return NextResponse.json(farms)
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newFarm = {
      id: `farm_${body.strategy}_${Date.now()}`,
      name: body.name,
      description: body.description,
      strategy: body.strategy,
      agentCount: body.agentCount || 0,
      totalCapital: body.totalCapital || 0,
      coordinationMode: body.coordinationMode || 'coordinated',
      status: 'active',
      createdAt: new Date().toISOString(),
      agents: body.agents || [],
      performance: {
        totalValue: body.totalCapital || 0,
        totalPnL: 0,
        winRate: 0,
        tradeCount: 0,
        roiPercent: 0,
        activeAgents: body.agentCount || 0,
        avgAgentPerformance: 0
      }
    }
    
    farms.push(newFarm)
    
    return NextResponse.json(newFarm, { status: 201 })
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    const farmIndex = farms.findIndex(f => f.id === id)
    if (farmIndex === -1) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }
    
    farms[farmIndex] = { ...farms[farmIndex], ...updateData }
    
    return NextResponse.json(farms[farmIndex])
  } catch (error) {
    console.error('Error updating farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const farmId = url.searchParams.get('id')
    
    if (!farmId) {
      return NextResponse.json({ error: 'Farm ID required' }, { status: 400 })
    }
    
    const farmIndex = farms.findIndex(f => f.id === farmId)
    if (farmIndex === -1) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }
    
    farms.splice(farmIndex, 1)
    
    return NextResponse.json({ message: 'Farm deleted successfully' })
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}