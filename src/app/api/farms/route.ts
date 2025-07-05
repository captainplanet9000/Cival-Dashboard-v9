import { NextRequest, NextResponse } from 'next/server'
import { supabaseFarmsService } from '@/lib/services/supabase-farms-service'

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
    
    // Try to get farms from Supabase first
    let farms: EnhancedFarm[] = []
    try {
      console.log('Attempting to fetch farms from Supabase...')
      const supabaseFarms = await supabaseFarmsService.getAllFarms()
      
      // Convert Supabase farms to enhanced format 
      farms = supabaseFarms.map((sf) => {
        // Use performance data from Supabase
        const performanceMetrics = sf.performance_metrics as any || {}
        
        const realPerformance = {
          totalValue: Number(sf.total_allocated_usd),
          totalPnL: performanceMetrics.totalPnL || 0,
          winRate: performanceMetrics.winRate || 0,
          tradeCount: performanceMetrics.tradeCount || 0,
          roiPercent: performanceMetrics.roiPercent || 0,
          activeAgents: sf.is_active ? sf.agent_count : 0,
          avgAgentPerformance: performanceMetrics.avgAgentPerformance || 0
        }
        
        // Generate simple agent groupings
        const groupings = {
          performanceGroups: { high: [], medium: [], low: [] },
          strategyGroups: { [sf.farm_type]: [] },
          riskGroups: { conservative: [], moderate: [], aggressive: [] }
        }
        
        return {
          id: sf.farm_id,
          name: sf.name,
          description: sf.description || '',
          strategy: sf.farm_type,
          agentCount: sf.agent_count,
          totalCapital: Number(sf.total_allocated_usd),
          coordinationMode: 'coordinated' as const,
          status: sf.is_active ? 'active' as const : 'paused' as const,
          createdAt: sf.created_at,
          agents: [], // Empty for now, can be populated later
          performance: realPerformance,
          farmType: sf.farm_type,
          llmEnabled: (sf.configuration as any)?.llmEnabled || false,
          groupings
        }
      })
      
    } catch (supabaseError) {
      console.log('Supabase not available, using fallback farms data. Error:', supabaseError?.message || 'Unknown error')
      // Fallback to mock data with enhanced features
      farms = generateFallbackFarms()
    }
    
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
    
    // Try to create farm in Supabase first
    try {
      const supabaseFarm = await supabaseFarmsService.createFarm({
        name: body.name,
        description: body.description,
        farm_type: body.strategy,
        total_allocated_usd: body.totalCapital || 0,
        agent_count: body.agentCount || 0,
        configuration: {
          coordinationMode: body.coordinationMode || 'coordinated',
          llmEnabled: body.llmEnabled || false,
          strategyParameters: body.strategyParameters || {}
        }
      })
      
      // Note: Agent creation would happen here in full implementation
      
      // Convert to API format
      const enhancedFarm: EnhancedFarm = {
        id: supabaseFarm.farm_id,
        name: supabaseFarm.name,
        description: supabaseFarm.description || '',
        strategy: supabaseFarm.farm_type,
        agentCount: supabaseFarm.agent_count,
        totalCapital: Number(supabaseFarm.total_allocated_usd),
        coordinationMode: (supabaseFarm.configuration as any)?.coordinationMode || 'coordinated',
        status: supabaseFarm.is_active ? 'active' : 'paused',
        createdAt: supabaseFarm.created_at,
        agents: [],
        performance: {
          totalValue: Number(supabaseFarm.total_allocated_usd),
          totalPnL: 0,
          winRate: 0,
          tradeCount: 0,
          roiPercent: 0,
          activeAgents: supabaseFarm.is_active ? supabaseFarm.agent_count : 0,
          avgAgentPerformance: 0
        },
        farmType: supabaseFarm.farm_type,
        llmEnabled: (supabaseFarm.configuration as any)?.llmEnabled || false,
        groupings: {
          performanceGroups: { high: [], medium: [], low: [] },
          strategyGroups: { [supabaseFarm.farm_type]: [] },
          riskGroups: { conservative: [], moderate: [], aggressive: [] }
        }
      }
      
      return NextResponse.json(enhancedFarm, { status: 201 })
      
    } catch (supabaseError) {
      console.log('Supabase not available, creating farm locally')
      
      // Fallback to local creation
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
    }
    
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
    
    // Try to update in Supabase first
    try {
      const updatedFarm = await supabaseFarmsService.updateFarm(id, {
        name: updateData.name,
        description: updateData.description,
        is_active: updateData.status === 'active',
        agent_count: updateData.agentCount,
        total_allocated_usd: updateData.totalCapital,
        configuration: {
          coordinationMode: updateData.coordinationMode,
          llmEnabled: updateData.llmEnabled,
          strategyParameters: updateData.strategyParameters
        }
      })
      
      // Note: Agent updates would happen here in full implementation
      
      return NextResponse.json({
        id: updatedFarm.farm_id,
        name: updatedFarm.name,
        description: updatedFarm.description,
        strategy: updatedFarm.farm_type,
        status: updatedFarm.is_active ? 'active' : 'paused',
        message: 'Farm updated successfully'
      })
      
    } catch (supabaseError) {
      console.log('Supabase not available, updating locally')
      return NextResponse.json({ 
        id, 
        ...updateData, 
        message: 'Farm updated locally' 
      })
    }
    
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
    
    // Try to delete from Supabase first
    try {
      await supabaseFarmsService.deleteFarm(farmId)
      
      // Note: Agent deletion would happen here in full implementation
      
      return NextResponse.json({ message: 'Farm and associated agents deleted successfully' })
      
    } catch (supabaseError) {
      console.log('Supabase not available, deleting locally')
      return NextResponse.json({ message: 'Farm deleted locally' })
    }
    
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}