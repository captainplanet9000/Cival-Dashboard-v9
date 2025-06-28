'use client'

/**
 * Simplified Agent Memory System
 * Builds on existing mock data system with memory-like capabilities
 * No external dependencies - works with current architecture
 */

export interface AgentMemoryNode {
  id: string
  agentId: string
  content: string
  type: 'trade_decision' | 'market_insight' | 'strategy_learning' | 'risk_observation'
  importance: number
  timestamp: Date
  metadata: {
    symbol?: string
    strategy?: string
    outcome?: 'success' | 'failure' | 'neutral'
    profitLoss?: number
    confidence?: number
  }
  accessCount: number
}

export interface AgentPersonality {
  agentId: string
  name: string
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  preferredStrategies: string[]
  learningStyle: 'quick_adapt' | 'gradual_learn' | 'pattern_focused'
  tradingHistory: {
    totalTrades: number
    successRate: number
    avgProfitLoss: number
    bestStrategy: string
  }
  memoryPreferences: {
    maxMemoryNodes: number
    importanceThreshold: number
    forgetAfterDays: number
  }
}

class SimpleAgentMemoryService {
  private memories: Map<string, AgentMemoryNode[]> = new Map()
  private personalities: Map<string, AgentPersonality> = new Map()
  private memoryCounter = 0

  constructor() {
    this.initializeDefaultAgents()
  }

  private initializeDefaultAgents() {
    const defaultAgents: AgentPersonality[] = [
      {
        agentId: 'alpha-momentum',
        name: 'Alpha Momentum Trader',
        riskTolerance: 'aggressive',
        preferredStrategies: ['momentum', 'breakout', 'trend_following'],
        learningStyle: 'quick_adapt',
        tradingHistory: {
          totalTrades: 156,
          successRate: 0.67,
          avgProfitLoss: 127.50,
          bestStrategy: 'momentum'
        },
        memoryPreferences: {
          maxMemoryNodes: 100,
          importanceThreshold: 0.6,
          forgetAfterDays: 30
        }
      },
      {
        agentId: 'beta-arbitrage',
        name: 'Beta Arbitrage Master',
        riskTolerance: 'conservative',
        preferredStrategies: ['arbitrage', 'pairs_trading', 'mean_reversion'],
        learningStyle: 'pattern_focused',
        tradingHistory: {
          totalTrades: 89,
          successRate: 0.84,
          avgProfitLoss: 45.30,
          bestStrategy: 'arbitrage'
        },
        memoryPreferences: {
          maxMemoryNodes: 200,
          importanceThreshold: 0.4,
          forgetAfterDays: 60
        }
      },
      {
        agentId: 'gamma-grid',
        name: 'Gamma Grid Bot',
        riskTolerance: 'moderate',
        preferredStrategies: ['grid_trading', 'dollar_cost_average', 'rebalancing'],
        learningStyle: 'gradual_learn',
        tradingHistory: {
          totalTrades: 234,
          successRate: 0.72,
          avgProfitLoss: 89.20,
          bestStrategy: 'grid_trading'
        },
        memoryPreferences: {
          maxMemoryNodes: 150,
          importanceThreshold: 0.5,
          forgetAfterDays: 45
        }
      }
    ]

    defaultAgents.forEach(agent => {
      this.personalities.set(agent.agentId, agent)
      this.memories.set(agent.agentId, [])
      this.generateInitialMemories(agent.agentId)
    })
  }

  private generateInitialMemories(agentId: string) {
    const agent = this.personalities.get(agentId)
    if (!agent) return

    const sampleMemories: Omit<AgentMemoryNode, 'id' | 'agentId' | 'timestamp' | 'accessCount'>[] = [
      {
        content: `BTC showed strong momentum above 45k resistance. Strategy: momentum worked well with 3.2% gain`,
        type: 'trade_decision',
        importance: 0.8,
        metadata: {
          symbol: 'BTC/USD',
          strategy: 'momentum',
          outcome: 'success',
          profitLoss: 432.10,
          confidence: 0.85
        }
      },
      {
        content: `ETH correlation with BTC weakened during high volatility. Consider reduced position sizing`,
        type: 'market_insight',
        importance: 0.7,
        metadata: {
          symbol: 'ETH/USD',
          confidence: 0.75
        }
      },
      {
        content: `Risk management: Stop loss at 2% proved effective for volatile altcoins`,
        type: 'risk_observation',
        importance: 0.9,
        metadata: {
          outcome: 'success',
          confidence: 0.9
        }
      }
    ]

    sampleMemories.forEach(memory => {
      this.storeMemory(agentId, memory.content, memory.type, memory.importance, memory.metadata)
    })
  }

  storeMemory(
    agentId: string,
    content: string,
    type: AgentMemoryNode['type'],
    importance: number,
    metadata: AgentMemoryNode['metadata'] = {}
  ): string {
    const memoryId = `mem_${this.memoryCounter++}`
    const memory: AgentMemoryNode = {
      id: memoryId,
      agentId,
      content,
      type,
      importance,
      timestamp: new Date(),
      metadata,
      accessCount: 0
    }

    if (!this.memories.has(agentId)) {
      this.memories.set(agentId, [])
    }

    const agentMemories = this.memories.get(agentId)!
    agentMemories.unshift(memory) // Add to beginning (most recent first)

    // Apply memory limits
    const agent = this.personalities.get(agentId)
    if (agent) {
      this.enforceMemoryLimits(agentId, agent.memoryPreferences)
    }

    return memoryId
  }

  private enforceMemoryLimits(agentId: string, preferences: AgentPersonality['memoryPreferences']) {
    const memories = this.memories.get(agentId)
    if (!memories) return

    // Remove old memories
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - preferences.forgetAfterDays)
    
    let filteredMemories = memories.filter(m => 
      m.timestamp > cutoffDate && m.importance >= preferences.importanceThreshold
    )

    // Limit total count
    if (filteredMemories.length > preferences.maxMemoryNodes) {
      // Keep most important memories
      filteredMemories.sort((a, b) => b.importance - a.importance)
      filteredMemories = filteredMemories.slice(0, preferences.maxMemoryNodes)
    }

    this.memories.set(agentId, filteredMemories)
  }

  retrieveMemories(
    agentId: string,
    query?: string,
    type?: AgentMemoryNode['type'],
    limit: number = 10
  ): AgentMemoryNode[] {
    const memories = this.memories.get(agentId) || []
    
    let filtered = memories

    // Filter by type
    if (type) {
      filtered = filtered.filter(m => m.type === type)
    }

    // Simple text search
    if (query) {
      const queryLower = query.toLowerCase()
      filtered = filtered.filter(m => 
        m.content.toLowerCase().includes(queryLower) ||
        (m.metadata.symbol && m.metadata.symbol.toLowerCase().includes(queryLower)) ||
        (m.metadata.strategy && m.metadata.strategy.toLowerCase().includes(queryLower))
      )
    }

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    // Update access count
    filtered.slice(0, limit).forEach(memory => {
      memory.accessCount++
    })

    return filtered.slice(0, limit)
  }

  getAgentPersonality(agentId: string): AgentPersonality | null {
    return this.personalities.get(agentId) || null
  }

  updateAgentPersonality(agentId: string, updates: Partial<AgentPersonality>) {
    const current = this.personalities.get(agentId)
    if (current) {
      this.personalities.set(agentId, { ...current, ...updates })
    }
  }

  simulateAgentDecision(agentId: string, symbol: string, marketData: any): {
    decision: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
    memoryInfluence: AgentMemoryNode[]
  } {
    const agent = this.personalities.get(agentId)
    if (!agent) {
      return {
        decision: 'hold',
        confidence: 0.5,
        reasoning: 'Agent not found',
        memoryInfluence: []
      }
    }

    // Retrieve relevant memories
    const relevantMemories = this.retrieveMemories(agentId, symbol, undefined, 5)
    const strategicMemories = this.retrieveMemories(agentId, undefined, 'strategy_learning', 3)
    const riskMemories = this.retrieveMemories(agentId, undefined, 'risk_observation', 2)

    // Simulate decision based on agent personality and memories
    const baseConfidence = 0.6
    let decision: 'buy' | 'sell' | 'hold' = 'hold'
    let confidence = baseConfidence

    // Factor in risk tolerance
    if (agent.riskTolerance === 'aggressive' && marketData.changePercent24h > 5) {
      decision = 'buy'
      confidence += 0.2
    } else if (agent.riskTolerance === 'conservative' && marketData.changePercent24h < -3) {
      decision = 'sell'
      confidence += 0.1
    }

    // Factor in memory influence
    const successfulMemories = relevantMemories.filter(m => m.metadata.outcome === 'success')
    if (successfulMemories.length > 0) {
      confidence += 0.1 * successfulMemories.length
    }

    // Generate reasoning
    const reasoning = this.generateDecisionReasoning(agent, relevantMemories, marketData)

    return {
      decision,
      confidence: Math.min(confidence, 1.0),
      reasoning,
      memoryInfluence: [...relevantMemories, ...strategicMemories, ...riskMemories]
    }
  }

  private generateDecisionReasoning(
    agent: AgentPersonality,
    memories: AgentMemoryNode[],
    marketData: any
  ): string {
    const memoryInsights = memories.slice(0, 2).map(m => m.content).join('. ')
    const riskAdjustment = agent.riskTolerance === 'conservative' ? 'with cautious position sizing' : 
                          agent.riskTolerance === 'aggressive' ? 'targeting higher returns' : 
                          'with balanced risk'

    return `Based on ${agent.name}'s ${agent.learningStyle} approach and ${memories.length} relevant memories: ${memoryInsights}. Current market conditions suggest proceeding ${riskAdjustment}.`
  }

  getMemoryStats(agentId: string) {
    const memories = this.memories.get(agentId) || []
    const agent = this.personalities.get(agentId)
    
    const typeDistribution = memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgImportance = memories.length > 0 
      ? memories.reduce((sum, m) => sum + m.importance, 0) / memories.length 
      : 0

    const recentActivity = memories
      .filter(m => m.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .length

    return {
      agentId,
      agentName: agent?.name || 'Unknown Agent',
      totalMemories: memories.length,
      typeDistribution,
      averageImportance: Number(avgImportance.toFixed(2)),
      recentActivity,
      memoryUtilization: agent ? (memories.length / agent.memoryPreferences.maxMemoryNodes) : 0
    }
  }

  getAllAgents(): AgentPersonality[] {
    return Array.from(this.personalities.values())
  }

  // Learning simulation - update agent based on trade outcome
  learnFromTrade(
    agentId: string,
    symbol: string,
    strategy: string,
    outcome: 'success' | 'failure',
    profitLoss: number
  ) {
    const agent = this.personalities.get(agentId)
    if (!agent) return

    // Store memory
    const importance = outcome === 'success' ? 0.8 : 0.9 // Failures are slightly more important to remember
    const content = outcome === 'success' 
      ? `Successful ${strategy} trade on ${symbol} with ${profitLoss > 0 ? 'profit' : 'loss'} of $${Math.abs(profitLoss).toFixed(2)}`
      : `Failed ${strategy} trade on ${symbol} resulted in loss of $${Math.abs(profitLoss).toFixed(2)}`

    this.storeMemory(agentId, content, 'trade_decision', importance, {
      symbol,
      strategy,
      outcome,
      profitLoss,
      confidence: outcome === 'success' ? 0.8 : 0.3
    })

    // Update agent personality
    const newTotalTrades = agent.tradingHistory.totalTrades + 1
    const newSuccessRate = outcome === 'success' 
      ? (agent.tradingHistory.successRate * agent.tradingHistory.totalTrades + 1) / newTotalTrades
      : (agent.tradingHistory.successRate * agent.tradingHistory.totalTrades) / newTotalTrades

    const newAvgProfitLoss = (agent.tradingHistory.avgProfitLoss * agent.tradingHistory.totalTrades + profitLoss) / newTotalTrades

    this.updateAgentPersonality(agentId, {
      tradingHistory: {
        ...agent.tradingHistory,
        totalTrades: newTotalTrades,
        successRate: Number(newSuccessRate.toFixed(3)),
        avgProfitLoss: Number(newAvgProfitLoss.toFixed(2)),
        bestStrategy: outcome === 'success' && profitLoss > agent.tradingHistory.avgProfitLoss 
          ? strategy 
          : agent.tradingHistory.bestStrategy
      }
    })
  }
}

// Export singleton instance
let _memoryService: SimpleAgentMemoryService | null = null

export function getSimpleMemoryService(): SimpleAgentMemoryService {
  if (!_memoryService) {
    _memoryService = new SimpleAgentMemoryService()
  }
  return _memoryService
}

export const simpleMemoryService = getSimpleMemoryService()