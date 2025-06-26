/**
 * LangChain Agent Registry for AG-UI
 * Extends AG-UI with LangChain agent registration and management
 */

import { AGUIAgent } from './types'
import { ServiceLocator } from '@/lib/langchain/service-locator'
import type { LangGraphAgent } from '@/lib/langchain/LangGraphOrchestrator'

export interface LangChainAGUIAgent extends AGUIAgent {
  langGraphId: string
  llmModel: string
  specialization: string[]
  performance: {
    totalTrades: number
    winRate: number
    totalPnL: number
    averageReturn: number
    lastUpdated: Date
  }
  config: {
    symbols: string[]
    maxPositionSize: number
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
    coordinationMode: 'independent' | 'collaborative' | 'consensus'
  }
}

export class LangChainAGUIRegistry {
  private registeredAgents: Map<string, LangChainAGUIAgent> = new Map()
  private isInitialized: boolean = false

  /**
   * Initialize the LangChain AG-UI registry
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('🔧 Initializing LangChain AG-UI Registry')

    // Get all LangGraph agents
    const langGraphOrchestrator = ServiceLocator.getLangGraphOrchestrator()
    const langGraphAgents = langGraphOrchestrator.getAgents()

    // Register each agent with AG-UI
    for (const agent of langGraphAgents) {
      await this.registerLangChainAgent(agent)
    }

    // Set up event listeners for agent lifecycle
    this.setupEventListeners()

    this.isInitialized = true
    console.log(`✅ LangChain AG-UI Registry initialized with ${this.registeredAgents.size} agents`)
  }

  /**
   * Register a LangGraph agent with AG-UI
   */
  async registerLangChainAgent(langGraphAgent: LangGraphAgent): Promise<void> {
    const agUIAgent: LangChainAGUIAgent = {
      id: `langchain_${langGraphAgent.id}`,
      name: langGraphAgent.name,
      type: this.mapAgentType(langGraphAgent.type),
      status: this.mapAgentStatus(langGraphAgent.status),
      capabilities: this.generateCapabilities(langGraphAgent),
      lastActivity: new Date(),
      langGraphId: langGraphAgent.id,
      llmModel: langGraphAgent.llmModel,
      specialization: langGraphAgent.specialization,
      performance: {
        totalTrades: langGraphAgent.performance.totalTrades,
        winRate: langGraphAgent.performance.winRate,
        totalPnL: langGraphAgent.performance.totalPnL,
        averageReturn: langGraphAgent.performance.averageReturn,
        lastUpdated: langGraphAgent.performance.lastUpdated
      },
      config: {
        symbols: langGraphAgent.config.symbols,
        maxPositionSize: langGraphAgent.config.maxPositionSize,
        riskTolerance: langGraphAgent.config.riskTolerance,
        coordinationMode: langGraphAgent.config.coordinationMode
      }
    }

    this.registeredAgents.set(agUIAgent.id, agUIAgent)
    console.log(`📝 Registered LangChain agent: ${agUIAgent.name}`)
  }

  /**
   * Update agent status and performance
   */
  async updateAgent(langGraphId: string, updates: Partial<LangGraphAgent>): Promise<void> {
    const agUIAgent = this.findAgentByLangGraphId(langGraphId)
    if (!agUIAgent) return

    // Update basic properties
    if (updates.status) {
      agUIAgent.status = this.mapAgentStatus(updates.status)
    }

    if (updates.performance) {
      agUIAgent.performance = {
        totalTrades: updates.performance.totalTrades,
        winRate: updates.performance.winRate,
        totalPnL: updates.performance.totalPnL,
        averageReturn: updates.performance.averageReturn,
        lastUpdated: updates.performance.lastUpdated
      }
    }

    if (updates.config) {
      agUIAgent.config = {
        symbols: updates.config.symbols,
        maxPositionSize: updates.config.maxPositionSize,
        riskTolerance: updates.config.riskTolerance,
        coordinationMode: updates.config.coordinationMode
      }
    }

    agUIAgent.lastActivity = new Date()
    this.registeredAgents.set(agUIAgent.id, agUIAgent)
  }

  /**
   * Remove agent from registry
   */
  async removeAgent(langGraphId: string): Promise<void> {
    const agUIAgent = this.findAgentByLangGraphId(langGraphId)
    if (agUIAgent) {
      this.registeredAgents.delete(agUIAgent.id)
      console.log(`🗑️ Removed LangChain agent: ${agUIAgent.name}`)
    }
  }

  /**
   * Get all registered LangChain agents
   */
  getRegisteredAgents(): LangChainAGUIAgent[] {
    return Array.from(this.registeredAgents.values())
  }

  /**
   * Get agent by AG-UI ID
   */
  getAgent(agUIId: string): LangChainAGUIAgent | undefined {
    return this.registeredAgents.get(agUIId)
  }

  /**
   * Find agent by LangGraph ID
   */
  findAgentByLangGraphId(langGraphId: string): LangChainAGUIAgent | undefined {
    return Array.from(this.registeredAgents.values())
      .find(agent => agent.langGraphId === langGraphId)
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): LangChainAGUIAgent[] {
    return Array.from(this.registeredAgents.values())
      .filter(agent => agent.type === type)
  }

  /**
   * Get active agents
   */
  getActiveAgents(): LangChainAGUIAgent[] {
    return Array.from(this.registeredAgents.values())
      .filter(agent => agent.status === 'online')
  }

  /**
   * Set up event listeners for LangGraph orchestrator
   */
  private setupEventListeners(): void {
    // Agent added
    langGraphOrchestrator.on('agent:added', async (data) => {
      await this.registerLangChainAgent(data.agent)
    })

    // Agent updated
    langGraphOrchestrator.on('agent:updated', async (data) => {
      await this.updateAgent(data.agent.id, data.agent)
    })

    // Agent removed
    langGraphOrchestrator.on('agent:removed', async (data) => {
      await this.removeAgent(data.agentId)
    })

    // Performance updated
    langGraphOrchestrator.on('performance:updated', async (data) => {
      for (const agentPerformance of data.agents) {
        const langGraphAgent = langGraphOrchestrator.getAgent(agentPerformance.id)
        if (langGraphAgent) {
          await this.updateAgent(agentPerformance.id, {
            performance: langGraphAgent.performance
          })
        }
      }
    })
  }

  /**
   * Map LangGraph agent type to AG-UI agent type
   */
  private mapAgentType(langGraphType: string): AGUIAgent['type'] {
    const typeMap: Record<string, AGUIAgent['type']> = {
      'momentum': 'trading',
      'mean_reversion': 'trading',
      'arbitrage': 'trading',
      'risk_manager': 'risk',
      'sentiment': 'analysis',
      'coordinator': 'execution'
    }

    return typeMap[langGraphType] || 'trading'
  }

  /**
   * Map LangGraph agent status to AG-UI agent status
   */
  private mapAgentStatus(langGraphStatus: string): AGUIAgent['status'] {
    const statusMap: Record<string, AGUIAgent['status']> = {
      'active': 'online',
      'paused': 'offline',
      'stopped': 'offline',
      'error': 'error'
    }

    return statusMap[langGraphStatus] || 'offline'
  }

  /**
   * Generate capabilities list for AG-UI display
   */
  private generateCapabilities(langGraphAgent: LangGraphAgent): string[] {
    const baseCapabilities = [
      'Market Analysis',
      'Trading Decisions',
      'Risk Assessment',
      'LLM Reasoning'
    ]

    const specializationCapabilities = langGraphAgent.specialization.map(spec => 
      spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    )

    const typeCapabilities: Record<string, string[]> = {
      'momentum': ['Trend Following', 'Breakout Detection', 'Momentum Signals'],
      'mean_reversion': ['Oversold Detection', 'Support/Resistance', 'Volatility Analysis'],
      'arbitrage': ['Price Discrepancies', 'Statistical Arbitrage', 'Cross-Market Analysis'],
      'risk_manager': ['Portfolio Risk', 'Position Sizing', 'Correlation Analysis'],
      'sentiment': ['News Analysis', 'Social Sentiment', 'Market Psychology']
    }

    return [
      ...baseCapabilities,
      ...specializationCapabilities,
      ...(typeCapabilities[langGraphAgent.type] || [])
    ]
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalAgents: number
    activeAgents: number
    agentsByType: Record<string, number>
    totalTrades: number
    averageWinRate: number
    totalPnL: number
  } {
    const agents = this.getRegisteredAgents()
    const activeAgents = this.getActiveAgents()

    const agentsByType = agents.reduce((acc, agent) => {
      acc[agent.type] = (acc[agent.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalTrades = agents.reduce((sum, agent) => sum + agent.performance.totalTrades, 0)
    const averageWinRate = agents.length > 0 ? 
      agents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / agents.length : 0
    const totalPnL = agents.reduce((sum, agent) => sum + agent.performance.totalPnL, 0)

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      agentsByType,
      totalTrades,
      averageWinRate,
      totalPnL
    }
  }

  /**
   * Health check for the registry
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    registeredAgents: number
    activeAgents: number
    lastUpdate: number
    errors: string[]
  }> {
    const errors: string[] = []
    const agents = this.getRegisteredAgents()
    const activeAgents = this.getActiveAgents()

    if (!this.isInitialized) {
      errors.push('Registry not initialized')
    }

    if (agents.length === 0) {
      errors.push('No agents registered')
    }

    if (activeAgents.length === 0) {
      errors.push('No active agents')
    }

    const status = errors.length === 0 ? 'healthy' :
                   agents.length > 0 ? 'degraded' : 'unhealthy'

    return {
      status,
      registeredAgents: agents.length,
      activeAgents: activeAgents.length,
      lastUpdate: Date.now(),
      errors
    }
  }
}

// Export singleton instance
export const langChainAGUIRegistry = new LangChainAGUIRegistry()