import { NextRequest, NextResponse } from 'next/server'

// Enhanced farm interface for API
interface EnhancedFarm {
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
  farmType?: string
  llmEnabled?: boolean
  groupings?: {
    performanceGroups: { high: string[], medium: string[], low: string[] }
    strategyGroups: Record<string, string[]>
    riskGroups: { conservative: string[], moderate: string[], aggressive: string[] }
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const farmId = url.searchParams.get('id')
    
    // For now, always use fallback data until Supabase connection is stable
    console.log('Using fallback farms data for Railway deployment')
    const farms = generateFallbackFarms()
    
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


// Helper function to generate fallback farms 
function generateFallbackFarms(): EnhancedFarm[] {
  
  const farmTemplates = [
    {
      id: 'farm_darvas_1',
      name: 'Darvas Box Momentum Farm',
      description: 'Specialized in breakout pattern recognition using Darvas Box methodology',
      strategy: 'darvas_box',
      totalCapital: 50000,
      coordinationMode: 'coordinated' as const,
      status: 'active' as const,
      llmEnabled: true
    },
    {
      id: 'farm_williams_1',
      name: 'Williams Alligator Trend Farm', 
      description: 'Advanced trend identification using Williams Alligator indicator',
      strategy: 'williams_alligator',
      totalCapital: 75000,
      coordinationMode: 'hierarchical' as const,
      status: 'active' as const,
      llmEnabled: true
    },
    {
      id: 'farm_renko_1',
      name: 'Renko Breakout Farm',
      description: 'Price movement analysis using Renko chart breakout patterns',
      strategy: 'renko_breakout',
      totalCapital: 60000,
      coordinationMode: 'coordinated' as const,
      status: 'paused' as const,
      llmEnabled: false
    }
  ]
  
  return farmTemplates.map(template => {    
    const groupings = {
      performanceGroups: { high: [], medium: [], low: [] },
      strategyGroups: { [template.strategy]: [] },
      riskGroups: { conservative: [], moderate: [], aggressive: [] }
    }
    
    // Generate mock performance data
    const performance = {
      totalValue: template.totalCapital + Math.random() * 5000,
      totalPnL: (Math.random() - 0.3) * 10000,
      winRate: 65 + Math.random() * 30,
      tradeCount: Math.floor(Math.random() * 100) + 20,
      roiPercent: (Math.random() - 0.2) * 20,
      activeAgents: template.status === 'active' ? 3 : 0,
      avgAgentPerformance: Math.random() * 2000
    }
    
    return {
      ...template,
      agentCount: 3,
      createdAt: new Date().toISOString(),
      agents: [`${template.strategy}_agent_1`, `${template.strategy}_agent_2`, `${template.strategy}_agent_3`],
      performance,
      farmType: template.strategy,
      groupings
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // For now, simulate farm creation with mock data
    const farmId = `farm_${body.strategy}_${Date.now()}`
    const newFarm: EnhancedFarm = {
      id: farmId,
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
      },
      farmType: body.strategy,
      llmEnabled: body.llmEnabled || false,
      groupings: {
        performanceGroups: { high: [], medium: [], low: [] },
        strategyGroups: { [body.strategy]: [] },
        riskGroups: { conservative: [], moderate: [], aggressive: [] }
      }
    }
    
    return NextResponse.json(newFarm, { status: 201 })
    
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: Agent creation and strategy parameter functions would be implemented here

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // For now, simulate farm update
    return NextResponse.json({ 
      id, 
      ...updateData, 
      message: 'Farm updated successfully' 
    })
    
  } catch (error) {
    console.error('Error updating farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: Farm agent update functions would be implemented here

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const farmId = url.searchParams.get('id')
    
    if (!farmId) {
      return NextResponse.json({ error: 'Farm ID required' }, { status: 400 })
    }
    
    // For now, simulate farm deletion
    return NextResponse.json({ message: 'Farm deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}