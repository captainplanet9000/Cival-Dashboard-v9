import { NextRequest, NextResponse } from 'next/server'
import { supabaseFarmsService } from '@/lib/services/supabase-farms-service'
import { getPersistentAgentService } from '@/lib/agents/persistent-agent-service'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

// LLM Integration for Farm Coordination
interface LLMCoordinationRequest {
  farmId: string
  action: 'analyze' | 'rebalance' | 'optimize' | 'group' | 'communicate'
  context?: {
    marketConditions?: string
    performanceData?: any
    riskMetrics?: any
    customInstructions?: string
  }
  groupingCriteria?: {
    type: 'performance' | 'strategy' | 'risk' | 'custom'
    parameters?: Record<string, any>
  }
}

interface CoordinationResponse {
  success: boolean
  action: string
  results: {
    analysis?: string
    recommendations?: string[]
    groupings?: {
      high: string[]
      medium: string[]
      low: string[]
    }
    rebalancing?: {
      from: string
      to: string
      amount: number
      reason: string
    }[]
    communication?: {
      agentId: string
      message: string
      priority: 'high' | 'medium' | 'low'
    }[]
  }
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const body: LLMCoordinationRequest = await request.json()
    const { farmId, action, context, groupingCriteria } = body

    // Get farm and associated agents
    const farm = await getFarmWithAgents(farmId)
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    let response: CoordinationResponse = {
      success: false,
      action,
      results: {},
      timestamp: Date.now()
    }

    switch (action) {
      case 'analyze':
        response = await analyzeFarmPerformance(farm, context)
        break
      
      case 'rebalance':
        response = await rebalanceFarmCapital(farm, context)
        break
      
      case 'optimize':
        response = await optimizeFarmStrategy(farm, context)
        break
      
      case 'group':
        response = await groupFarmAgents(farm, groupingCriteria)
        break
      
      case 'communicate':
        response = await coordinateAgentCommunication(farm, context)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in farm coordination:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get farm with agents
async function getFarmWithAgents(farmId: string) {
  try {
    // Get farm from Supabase
    const farm = await supabaseFarmsService.getFarmById(farmId)
    if (!farm) return null

    // Get associated agents
    const allAgents = getPersistentAgentService().getAllAgents()
    const farmAgents = allAgents.filter(agent => 
      agent.config?.farmId === farmId
    )

    return {
      ...farm,
      agents: farmAgents
    }
  } catch (error) {
    console.error('Error getting farm with agents:', error)
    return null
  }
}

// LLM-powered farm analysis
async function analyzeFarmPerformance(farm: any, context?: any): Promise<CoordinationResponse> {
  const agents = farm.agents || []
  
  // Calculate comprehensive farm metrics
  const metrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter((a: any) => a.status === 'active').length,
    averageWinRate: agents.reduce((sum: number, a: any) => sum + (a.performance?.winRate || 0), 0) / Math.max(agents.length, 1),
    totalPnL: agents.reduce((sum: number, a: any) => sum + (a.performance?.totalPnL || 0), 0),
    riskDistribution: calculateRiskDistribution(agents),
    performanceVariance: calculatePerformanceVariance(agents)
  }

  // Generate LLM-style analysis (simulated)
  const analysis = generateFarmAnalysis(metrics, context)
  const recommendations = generateRecommendations(metrics, agents)

  return {
    success: true,
    action: 'analyze',
    results: {
      analysis,
      recommendations
    },
    timestamp: Date.now()
  }
}

// Capital rebalancing based on performance
async function rebalanceFarmCapital(farm: any, context?: any): Promise<CoordinationResponse> {
  const agents = farm.agents || []
  const totalCapital = farm.total_allocated_usd || 0
  
  // Calculate optimal capital allocation
  const rebalancing = calculateOptimalAllocation(agents, totalCapital)
  
  // Execute rebalancing
  for (const rebalance of rebalancing) {
    await executeCapitalRebalance(rebalance)
  }

  return {
    success: true,
    action: 'rebalance',
    results: {
      rebalancing,
      analysis: `Rebalanced capital across ${rebalancing.length} agents based on performance metrics`
    },
    timestamp: Date.now()
  }
}

// Strategy optimization
async function optimizeFarmStrategy(farm: any, context?: any): Promise<CoordinationResponse> {
  const agents = farm.agents || []
  
  // Analyze current strategy performance
  const strategyAnalysis = analyzeStrategyEffectiveness(agents, farm.farm_type)
  
  // Generate optimization recommendations
  const recommendations = generateOptimizationRecommendations(strategyAnalysis, context)

  return {
    success: true,
    action: 'optimize',
    results: {
      analysis: strategyAnalysis.summary,
      recommendations
    },
    timestamp: Date.now()
  }
}

// Dynamic agent grouping
async function groupFarmAgents(farm: any, criteria?: any): Promise<CoordinationResponse> {
  const agents = farm.agents || []
  
  let groupings: { high: any[], medium: any[], low: any[] } = { high: [], medium: [], low: [] }
  
  switch (criteria?.type || 'performance') {
    case 'performance':
      groupings = groupAgentsByPerformance(agents)
      break
    case 'risk':
      groupings = groupAgentsByRisk(agents)
      break
    case 'strategy':
      groupings = groupAgentsByStrategy(agents)
      break
    case 'custom':
      groupings = groupAgentsByCustomCriteria(agents, criteria.parameters)
      break
  }

  // Update agent configurations with group assignments
  await updateAgentGroupings(groupings)

  return {
    success: true,
    action: 'group',
    results: {
      groupings,
      analysis: `Agents grouped by ${criteria?.type || 'performance'} criteria`
    },
    timestamp: Date.now()
  }
}

// Agent communication coordination
async function coordinateAgentCommunication(farm: any, context?: any): Promise<CoordinationResponse> {
  const agents = farm.agents || []
  
  // Generate communication messages based on context
  const communication = generateAgentCommunications(agents, context)
  
  // Send communications to agents
  for (const comm of communication) {
    await sendAgentCommunication(comm)
  }

  return {
    success: true,
    action: 'communicate',
    results: {
      communication,
      analysis: `Sent ${communication.length} coordination messages to farm agents`
    },
    timestamp: Date.now()
  }
}

// Helper functions for farm coordination

function calculateRiskDistribution(agents: any[]) {
  const riskLevels = { low: 0, medium: 0, high: 0 }
  
  agents.forEach(agent => {
    const riskScore = calculateAgentRiskScore(agent)
    if (riskScore < 0.3) riskLevels.low++
    else if (riskScore < 0.7) riskLevels.medium++
    else riskLevels.high++
  })
  
  return riskLevels
}

function calculatePerformanceVariance(agents: any[]) {
  const performances = agents.map(a => a.performance?.winRate || 0)
  const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length
  const variance = performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / performances.length
  return Math.sqrt(variance)
}

function calculateAgentRiskScore(agent: any) {
  const maxDrawdown = agent.config?.riskLimits?.maxDrawdown || 15
  const leverage = agent.config?.riskLimits?.maxLeverage || 1
  const volatility = agent.performance?.volatility || 0.1
  
  return (maxDrawdown / 100 + leverage / 10 + volatility) / 3
}

function generateFarmAnalysis(metrics: any, context?: any) {
  return `Farm Analysis Report:
- Total Agents: ${metrics.totalAgents} (${metrics.activeAgents} active)
- Average Win Rate: ${metrics.averageWinRate.toFixed(1)}%
- Total P&L: $${metrics.totalPnL.toFixed(2)}
- Risk Distribution: ${JSON.stringify(metrics.riskDistribution)}
- Performance Variance: ${metrics.performanceVariance.toFixed(2)}

Market Context: ${context?.marketConditions || 'Normal trading conditions'}
Performance Assessment: ${metrics.averageWinRate > 60 ? 'Strong' : 'Needs improvement'}
Risk Level: ${metrics.riskDistribution.high > metrics.totalAgents * 0.3 ? 'High' : 'Moderate'}`
}

function generateRecommendations(metrics: any, agents: any[]) {
  const recommendations: string[] = []
  
  if (metrics.averageWinRate < 50) {
    recommendations.push('Consider reducing position sizes and implementing stricter risk controls')
  }
  
  if (metrics.performanceVariance > 20) {
    recommendations.push('High performance variance detected - consider rebalancing agent allocations')
  }
  
  if (metrics.riskDistribution.high > metrics.totalAgents * 0.5) {
    recommendations.push('Too many high-risk agents - diversify risk profile')
  }
  
  if (metrics.totalPnL < 0) {
    recommendations.push('Negative P&L detected - pause underperforming agents and analyze strategies')
  }
  
  return recommendations
}

function calculateOptimalAllocation(agents: any[], totalCapital: number) {
  const rebalancing: any[] = []
  const performanceScores = agents.map(agent => ({
    id: agent.id,
    score: calculatePerformanceScore(agent),
    currentCapital: agent.currentCapital || 0
  }))
  
  // Sort by performance score
  performanceScores.sort((a, b) => b.score - a.score)
  
  // Allocate more capital to better performing agents
  const totalScore = performanceScores.reduce((sum, agent) => sum + Math.max(agent.score, 0.1), 0)
  
  performanceScores.forEach(agent => {
    const targetAllocation = (Math.max(agent.score, 0.1) / totalScore) * totalCapital
    const difference = targetAllocation - agent.currentCapital
    
    if (Math.abs(difference) > 100) { // Only rebalance if difference is significant
      rebalancing.push({
        from: difference < 0 ? agent.id : 'farm_reserve',
        to: difference > 0 ? agent.id : 'farm_reserve',
        amount: Math.abs(difference),
        reason: `Performance-based reallocation (score: ${agent.score.toFixed(2)})`
      })
    }
  })
  
  return rebalancing
}

function calculatePerformanceScore(agent: any) {
  const winRate = agent.performance?.winRate || 0
  const pnl = agent.performance?.totalPnL || 0
  const trades = agent.performance?.totalTrades || 0
  
  // Normalize and weight the metrics
  const winRateScore = winRate / 100 // 0-1
  const pnlScore = Math.max(0, Math.min(1, (pnl + 1000) / 2000)) // Normalize PnL
  const activityScore = Math.min(1, trades / 50) // Reward active trading
  
  return (winRateScore * 0.5 + pnlScore * 0.3 + activityScore * 0.2)
}

async function executeCapitalRebalance(rebalance: any) {
  // Update agent capital allocation
  if (rebalance.to !== 'farm_reserve') {
    await getPersistentAgentService().updateAgentCapital(rebalance.to, rebalance.amount)
  }
  
  console.log(`💰 Capital rebalanced: ${rebalance.amount} from ${rebalance.from} to ${rebalance.to}`)
}

function analyzeStrategyEffectiveness(agents: any[], strategy: string) {
  const strategyAgents = agents.filter(a => a.strategy === strategy)
  const avgPerformance = strategyAgents.reduce((sum, a) => sum + (a.performance?.winRate || 0), 0) / Math.max(strategyAgents.length, 1)
  
  return {
    summary: `${strategy} strategy showing ${avgPerformance.toFixed(1)}% average win rate across ${strategyAgents.length} agents`,
    effectiveness: avgPerformance > 60 ? 'high' : avgPerformance > 45 ? 'medium' : 'low',
    agentCount: strategyAgents.length,
    avgWinRate: avgPerformance
  }
}

function generateOptimizationRecommendations(analysis: any, context?: any) {
  const recommendations: string[] = []
  
  if (analysis.effectiveness === 'low') {
    recommendations.push(`Consider switching from ${analysis.strategy} to a more suitable strategy`)
    recommendations.push('Implement additional risk controls and position sizing rules')
  }
  
  if (analysis.agentCount < 3) {
    recommendations.push('Consider adding more agents to improve strategy diversification')
  }
  
  if (analysis.avgWinRate < 50) {
    recommendations.push('Review strategy parameters and market conditions alignment')
  }
  
  return recommendations
}

function groupAgentsByPerformance(agents: any[]) {
  const sorted = agents.sort((a, b) => (b.performance?.winRate || 0) - (a.performance?.winRate || 0))
  const third = Math.ceil(agents.length / 3)
  
  return {
    high: sorted.slice(0, third).map(a => a.id),
    medium: sorted.slice(third, third * 2).map(a => a.id),
    low: sorted.slice(third * 2).map(a => a.id)
  }
}

function groupAgentsByRisk(agents: any[]) {
  const riskScores = agents.map(agent => ({
    id: agent.id,
    risk: calculateAgentRiskScore(agent)
  })).sort((a, b) => a.risk - b.risk)
  
  const third = Math.ceil(agents.length / 3)
  
  return {
    high: riskScores.slice(third * 2).map(a => a.id), // High risk
    medium: riskScores.slice(third, third * 2).map(a => a.id),
    low: riskScores.slice(0, third).map(a => a.id) // Low risk
  }
}

function groupAgentsByStrategy(agents: any[]) {
  const strategies: { [key: string]: string[] } = {}
  agents.forEach(agent => {
    const strategy = agent.strategy || 'default'
    if (!strategies[strategy]) strategies[strategy] = []
    strategies[strategy].push(agent.id)
  })
  
  const strategyNames = Object.keys(strategies)
  return {
    high: strategies[strategyNames[0]] || [],
    medium: strategies[strategyNames[1]] || [],
    low: strategies[strategyNames[2]] || []
  }
}

function groupAgentsByCustomCriteria(agents: any[], parameters: any) {
  // Custom grouping based on user-defined parameters
  return groupAgentsByPerformance(agents) // Fallback to performance-based
}

async function updateAgentGroupings(groupings: any) {
  // Update agent configurations with their group assignments
  for (const [group, agentIds] of Object.entries(groupings)) {
    for (const agentId of agentIds as string[]) {
      const agent = getPersistentAgentService().getAgent(agentId)
      if (agent) {
        agent.config.group = group
        await getPersistentAgentService().updateAgentPerformance(agentId, {
          totalPnL: agent.performance?.totalPnL || 0,
          winRate: agent.performance?.winRate || 0,
          totalTrades: agent.performance?.totalTrades || 0,
          sharpeRatio: agent.performance?.sharpeRatio || 0
        } as any)
      }
    }
  }
}

function generateAgentCommunications(agents: any[], context?: any) {
  const communications: any[] = []
  
  // Generate context-aware communications
  agents.forEach(agent => {
    const message = generateAgentMessage(agent, context)
    communications.push({
      agentId: agent.id,
      message,
      priority: determineMessagePriority(agent, context)
    })
  })
  
  return communications
}

function generateAgentMessage(agent: any, context?: any) {
  const performance = agent.performance?.winRate || 0
  
  if (performance > 70) {
    return `Excellent performance! Continue current strategy with ${agent.strategy}. Consider increasing position size.`
  } else if (performance > 50) {
    return `Good performance. Monitor closely and maintain current parameters for ${agent.strategy}.`
  } else {
    return `Performance below target. Consider reducing position size and reviewing ${agent.strategy} parameters.`
  }
}

function determineMessagePriority(agent: any, context?: any) {
  const performance = agent.performance?.winRate || 0
  const pnl = agent.performance?.totalPnL || 0
  
  if (performance < 30 || pnl < -500) return 'high'
  if (performance < 50 || pnl < 0) return 'medium'
  return 'low'
}

async function sendAgentCommunication(communication: any) {
  // Send communication to agent (could integrate with actual LLM API)
  console.log(`📢 Agent ${communication.agentId}: ${communication.message} (Priority: ${communication.priority})`)
  
  // Update agent with communication log
  const agent = getPersistentAgentService().getAgent(communication.agentId)
  if (agent) {
    if (!agent.config.communications) agent.config.communications = []
    agent.config.communications.push({
      message: communication.message,
      priority: communication.priority,
      timestamp: Date.now()
    })
    
    // Keep only last 10 communications
    agent.config.communications = agent.config.communications.slice(-10)
  }
}