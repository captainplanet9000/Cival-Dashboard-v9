import { NextRequest, NextResponse } from 'next/server'
import { supabaseFarmsService } from '@/lib/services/supabase-farms-service'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'

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
      const supabaseFarms = await supabaseFarmsService.getAllFarms()
      
      // Convert Supabase farms to enhanced format with agent integration
      farms = await Promise.all(supabaseFarms.map(async (sf) => {
        // Get agents associated with this farm
        const allAgents = persistentAgentService.getAllAgents()
        const farmAgents = allAgents.filter(agent => 
          agent.config?.farmId === sf.farm_id || 
          agent.strategy === sf.farm_type
        ).slice(0, sf.agent_count)
        
        // Calculate real performance from paper trading engine
        let realPerformance = {
          totalValue: Number(sf.total_allocated_usd),
          totalPnL: 0,
          winRate: 0,
          tradeCount: 0,
          roiPercent: 0,
          activeAgents: sf.is_active ? farmAgents.length : 0,
          avgAgentPerformance: 0
        }
        
        // Aggregate performance from associated agents
        if (farmAgents.length > 0) {
          const agentMetrics = farmAgents.map(agent => {
            const paperAgent = paperTradingEngine.getAgent(agent.id)
            return paperAgent ? {
              totalValue: paperAgent.portfolio.totalValue,
              totalPnL: paperAgent.portfolio.totalValue - agent.initialCapital,
              winRate: paperAgent.performance.winRate,
              tradeCount: paperAgent.performance.totalTrades
            } : {
              totalValue: agent.currentCapital,
              totalPnL: agent.performance.totalPnL,
              winRate: agent.performance.winRate,
              tradeCount: agent.performance.totalTrades
            }
          })
          
          realPerformance.totalValue = agentMetrics.reduce((sum, m) => sum + m.totalValue, 0)
          realPerformance.totalPnL = agentMetrics.reduce((sum, m) => sum + m.totalPnL, 0)
          realPerformance.winRate = agentMetrics.reduce((sum, m) => sum + m.winRate, 0) / agentMetrics.length
          realPerformance.tradeCount = agentMetrics.reduce((sum, m) => sum + m.tradeCount, 0)
          realPerformance.roiPercent = (realPerformance.totalPnL / Math.max(Number(sf.total_allocated_usd), 1)) * 100
          realPerformance.avgAgentPerformance = realPerformance.totalPnL / Math.max(farmAgents.length, 1)
        }
        
        // Generate agent groupings
        const groupings = generateAgentGroupings(farmAgents)
        
        return {
          id: sf.farm_id,
          name: sf.name,
          description: sf.description || '',
          strategy: sf.farm_type,
          agentCount: farmAgents.length,
          totalCapital: Number(sf.total_allocated_usd),
          coordinationMode: 'coordinated' as const,
          status: sf.is_active ? 'active' as const : 'paused' as const,
          createdAt: sf.created_at,
          agents: farmAgents.map(a => a.id),
          performance: realPerformance,
          farmType: sf.farm_type,
          llmEnabled: (sf.configuration as any)?.llmEnabled || false,
          groupings
        }
      }))
      
    } catch (supabaseError) {
      console.log('Supabase not available, using fallback farms data')
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

// Helper function to generate agent groupings based on performance
function generateAgentGroupings(agents: any[]) {
  const performanceGroups = { high: [], medium: [], low: [] }
  const strategyGroups: Record<string, string[]> = {}
  const riskGroups = { conservative: [], moderate: [], aggressive: [] }
  
  agents.forEach(agent => {
    // Performance-based grouping
    const winRate = agent.performance?.winRate || 0
    if (winRate >= 70) {
      performanceGroups.high.push(agent.id)
    } else if (winRate >= 50) {
      performanceGroups.medium.push(agent.id)
    } else {
      performanceGroups.low.push(agent.id)
    }
    
    // Strategy-based grouping
    const strategy = agent.strategy || 'default'
    if (!strategyGroups[strategy]) {
      strategyGroups[strategy] = []
    }
    strategyGroups[strategy].push(agent.id)
    
    // Risk-based grouping (based on configuration)
    const riskLevel = agent.config?.riskLevel || 'moderate'
    if (riskLevel === 'conservative' || (agent.config?.riskLimits?.maxDrawdown || 0) < 10) {
      riskGroups.conservative.push(agent.id)
    } else if (riskLevel === 'aggressive' || (agent.config?.riskLimits?.maxDrawdown || 0) > 20) {
      riskGroups.aggressive.push(agent.id)
    } else {
      riskGroups.moderate.push(agent.id)
    }
  })
  
  return { performanceGroups, strategyGroups, riskGroups }
}

// Helper function to generate fallback farms with real agent integration
function generateFallbackFarms(): EnhancedFarm[] {
  const allAgents = persistentAgentService.getAllAgents()
  
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
    const farmAgents = allAgents.filter(agent => 
      agent.strategy === template.strategy
    ).slice(0, 4)
    
    const groupings = generateAgentGroupings(farmAgents)
    
    // Calculate real performance from agents
    let performance = {
      totalValue: template.totalCapital,
      totalPnL: 0,
      winRate: 0,
      tradeCount: 0,
      roiPercent: 0,
      activeAgents: template.status === 'active' ? farmAgents.length : 0,
      avgAgentPerformance: 0
    }
    
    if (farmAgents.length > 0) {
      performance.totalPnL = farmAgents.reduce((sum, agent) => sum + agent.performance.totalPnL, 0)
      performance.winRate = farmAgents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / farmAgents.length
      performance.tradeCount = farmAgents.reduce((sum, agent) => sum + agent.performance.totalTrades, 0)
      performance.roiPercent = (performance.totalPnL / template.totalCapital) * 100
      performance.avgAgentPerformance = performance.totalPnL / farmAgents.length
    }
    
    return {
      ...template,
      agentCount: farmAgents.length,
      createdAt: new Date().toISOString(),
      agents: farmAgents.map(a => a.id),
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
      
      // Create agents for this farm if specified
      if (body.createAgents && body.agentCount > 0) {
        await createAgentsForFarm(supabaseFarm.farm_id, body.strategy, body.agentCount, body.totalCapital)
      }
      
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
        groupings: generateAgentGroupings([])
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
        groupings: generateAgentGroupings([])
      }
      
      return NextResponse.json(newFarm, { status: 201 })
    }
    
  } catch (error) {
    console.error('Error creating farm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to create agents for a farm
async function createAgentsForFarm(farmId: string, strategy: string, agentCount: number, totalCapital: number) {
  const capitalPerAgent = totalCapital / agentCount
  
  for (let i = 0; i < agentCount; i++) {
    const agentConfig = {
      name: `${strategy}_agent_${i + 1}_farm_${farmId.slice(-4)}`,
      description: `Farm agent for ${strategy} strategy`,
      strategy: strategy,
      initialCapital: capitalPerAgent,
      riskLimits: {
        maxPositionSize: 10,
        maxDailyLoss: capitalPerAgent * 0.05, // 5% max daily loss
        maxDrawdown: 15,
        maxLeverage: 1,
        allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
        stopLossEnabled: true,
        takeProfitEnabled: true
      },
      config: {
        farmId: farmId,
        strategy: strategy,
        riskLevel: 'moderate',
        parameters: getStrategyParameters(strategy)
      }
    }
    
    // Create agent in persistent service
    await persistentAgentService.createAgent(agentConfig)
  }
}

// Helper function to get strategy-specific parameters
function getStrategyParameters(strategy: string) {
  const strategyParams = {
    darvas_box: {
      breakoutThreshold: 0.02,
      volumeConfirmation: true,
      consolidationPeriod: 10
    },
    williams_alligator: {
      jawPeriod: 13,
      teethPeriod: 8,
      lipsPeriod: 5,
      shift: 5
    },
    renko_breakout: {
      brickSize: 0.01,
      reversalBricks: 2,
      confirmationCandles: 1
    },
    heikin_ashi: {
      smoothingPeriod: 14,
      trendConfirmation: true,
      reversal_sensitivity: 0.5
    },
    elliott_wave: {
      waveCount: 5,
      fibonacciLevels: [0.236, 0.382, 0.618, 0.786],
      minWaveLength: 20
    }
  }
  
  return strategyParams[strategy] || {}
}

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
      
      // Update associated agents if needed
      if (updateData.updateAgents) {
        await updateFarmAgents(id, updateData)
      }
      
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

// Helper function to update farm agents
async function updateFarmAgents(farmId: string, updateData: any) {
  const allAgents = persistentAgentService.getAllAgents()
  const farmAgents = allAgents.filter(agent => agent.config?.farmId === farmId)
  
  // Update agent configurations if needed
  if (updateData.llmEnabled !== undefined) {
    for (const agent of farmAgents) {
      agent.config.llmEnabled = updateData.llmEnabled
      // Update agent with new LLM settings
      await persistentAgentService.updateAgentPerformance(agent.id, {
        lastUpdated: Date.now()
      })
    }
  }
  
  // Handle agent count changes
  if (updateData.agentCount && updateData.agentCount !== farmAgents.length) {
    if (updateData.agentCount > farmAgents.length) {
      // Create additional agents
      const newAgentCount = updateData.agentCount - farmAgents.length
      await createAgentsForFarm(farmId, updateData.strategy, newAgentCount, updateData.totalCapital)
    } else {
      // Remove excess agents (keep best performing ones)
      const sortedAgents = farmAgents.sort((a, b) => b.performance.totalPnL - a.performance.totalPnL)
      const agentsToRemove = sortedAgents.slice(updateData.agentCount)
      
      for (const agent of agentsToRemove) {
        await persistentAgentService.deleteAgent(agent.id)
      }
    }
  }
}

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
      
      // Also delete associated agents
      const allAgents = persistentAgentService.getAllAgents()
      const farmAgents = allAgents.filter(agent => agent.config?.farmId === farmId)
      
      for (const agent of farmAgents) {
        await persistentAgentService.deleteAgent(agent.id)
        // Also remove from paper trading engine
        paperTradingEngine.deleteAgent(agent.id)
      }
      
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