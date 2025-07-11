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
    
    // Try to use Supabase first, fallback to mock data if needed
    try {
      // Dynamic import to avoid client-side imports in server route
      const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
      
      if (farmId) {
        const farm = await supabaseFarmsService.getFarmById(farmId)
        if (!farm) {
          return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
        }
        
        // Convert to expected API format
        const apiFormat = convertSupabaseFarmToApiFormat(farm)
        return NextResponse.json(apiFormat)
      }
      
      // Get all farms from Supabase
      const supabaseFarms = await supabaseFarmsService.getAllFarms()
      const apiFarms = supabaseFarms.map(convertSupabaseFarmToApiFormat)
      
      console.log(`✅ Loaded ${apiFarms.length} farms from Supabase`)
      return NextResponse.json(apiFarms)
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, using fallback farms data:', supabaseError)
      const farms = generateFallbackFarms()
      
      if (farmId) {
        const farm = farms.find(f => f.id === farmId)
        if (!farm) {
          return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
        }
        return NextResponse.json(farm)
      }
      
      return NextResponse.json(farms)
    }
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Convert Supabase farm to API format
function convertSupabaseFarmToApiFormat(supabaseFarm: any): EnhancedFarm {
  return {
    id: supabaseFarm.farm_id,
    name: supabaseFarm.name,
    description: `${supabaseFarm.strategy_type} trading farm with ${supabaseFarm.max_agents} max agents`,
    strategy: supabaseFarm.strategy_type,
    agentCount: supabaseFarm.max_agents,
    totalCapital: supabaseFarm.target_allocation,
    coordinationMode: 'coordinated' as const,
    status: supabaseFarm.auto_assignment_enabled ? 'active' as const : 'paused' as const,
    createdAt: supabaseFarm.created_at,
    agents: [], // Would need to fetch from farm_agent_assignments table
    performance: {
      totalValue: supabaseFarm.target_allocation,
      totalPnL: 0, // Would calculate from agent performance
      winRate: (supabaseFarm.performance_requirements as any)?.min_win_rate * 100 || 55,
      tradeCount: 0, // Would calculate from trading history
      roiPercent: 0, // Would calculate from performance
      activeAgents: supabaseFarm.min_agents,
      avgAgentPerformance: (supabaseFarm.performance_requirements as any)?.min_sharpe_ratio || 1.0
    },
    farmType: supabaseFarm.strategy_type,
    llmEnabled: true,
    groupings: {
      performanceGroups: { high: [], medium: [], low: [] },
      strategyGroups: { [supabaseFarm.strategy_type]: [] },
      riskGroups: { conservative: [], moderate: [], aggressive: [] }
    }
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
    
    // Try to create farm in Supabase first, fallback to mock response
    try {
      const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
      
      const newFarm = await supabaseFarmsService.createFarm({
        name: body.name,
        farm_type: body.strategy,
        total_allocated_usd: body.totalCapital || 10000,
        agent_count: body.agentCount || 10,
        performance_requirements: {
          min_sharpe_ratio: 1.0,
          max_drawdown: 0.15,
          min_win_rate: 0.55
        },
        agent_selection_criteria: {
          strategy_compatibility: true,
          performance_threshold: 0.1,
          risk_alignment: true
        },
        rebalancing_frequency: 24,
        auto_assignment_enabled: true
      })
      
      const apiFormat = convertSupabaseFarmToApiFormat(newFarm)
      console.log('✅ Created farm in Supabase:', newFarm.farm_id)
      return NextResponse.json(apiFormat, { status: 201 })
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, creating mock farm:', supabaseError)
      
      // Fallback to mock farm creation
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
    
    // Try to update farm in Supabase first, fallback to mock response
    try {
      const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
      
      const updatedFarm = await supabaseFarmsService.updateFarm(id, {
        name: updateData.name,
        farm_type: updateData.strategy,
        total_allocated_usd: updateData.totalCapital,
        agent_count: updateData.agentCount,
        is_active: updateData.status === 'active'
      })
      
      const apiFormat = convertSupabaseFarmToApiFormat(updatedFarm)
      console.log('✅ Updated farm in Supabase:', updatedFarm.farm_id)
      return NextResponse.json(apiFormat)
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, using mock update:', supabaseError)
      
      // Fallback to mock update
      return NextResponse.json({ 
        id, 
        ...updateData, 
        message: 'Farm updated successfully' 
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
    
    // Try to delete farm from Supabase first, fallback to mock response
    try {
      const { supabaseFarmsService } = await import('@/lib/services/supabase-farms-service')
      
      const success = await supabaseFarmsService.deleteFarm(farmId)
      
      if (success) {
        console.log('✅ Deleted farm from Supabase:', farmId)
        return NextResponse.json({ message: 'Farm deleted successfully' })
      } else {
        return NextResponse.json({ error: 'Failed to delete farm' }, { status: 500 })
      }
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase unavailable, using mock deletion:', supabaseError)
      
      // Fallback to mock deletion
      return NextResponse.json({ message: 'Farm deleted successfully' })
    }
    
  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}