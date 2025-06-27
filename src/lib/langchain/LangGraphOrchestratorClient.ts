/**
 * Client-safe LangGraph Orchestrator interface
 * This file provides a client-side interface to the LangGraph orchestrator
 * without importing Node.js specific modules
 */

import { EventEmitter } from 'events'

export interface LangGraphAgent {
  id: string
  name: string
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'risk_manager' | 'coordinator' | 'sentiment'
  status: 'active' | 'paused' | 'stopped' | 'error'
  llmModel: string
  specialization: string[]
  portfolio: string
  performance: AgentPerformance
  lastDecision: any | null
  config: AgentConfig
  workflowState: any
}

export interface AgentPerformance {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  averageReturn: number
  sharpeRatio: number
  maxDrawdown: number
  averageDecisionTime: number
  confidenceAccuracy: number
  lastUpdated: Date
}

export interface AgentConfig {
  symbols: string[]
  maxPositionSize: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  decisionFrequency: number
  llmPreference: 'openai' | 'anthropic' | 'auto'
  enableSentimentAnalysis: boolean
  enableRiskOverride: boolean
  coordinationMode: 'independent' | 'collaborative' | 'consensus'
}

/**
 * Client-safe orchestrator that communicates with the server
 */
export class LangGraphTradingOrchestratorClient extends EventEmitter {
  private isRunning: boolean = false
  private agents: Map<string, LangGraphAgent> = new Map()

  constructor() {
    super()
    // Client-side initialization without LangGraph
    console.log('🧠 LangGraph Trading Orchestrator Client initialized')
  }

  /**
   * Get current orchestrator status
   */
  getStatus(): {
    isRunning: boolean
    totalAgents: number
    activeAgents: number
    performance: {
      totalTrades: number
      totalPnL: number
      winRate: number
    }
  } {
    return {
      isRunning: this.isRunning,
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length,
      performance: {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0
      }
    }
  }

  /**
   * Get all agents
   */
  getAgents(): LangGraphAgent[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get a specific agent
   */
  getAgent(agentId: string): LangGraphAgent | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): any {
    return {
      byAgent: {},
      overall: {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        sharpeRatio: 0
      },
      trends: {
        daily: [],
        weekly: []
      }
    }
  }

  /**
   * Start orchestrator (calls server API)
   */
  async start(): Promise<void> {
    // In production, this would call the server API
    this.isRunning = true
    this.emit('orchestrator:started', { timestamp: Date.now() })
  }

  /**
   * Stop orchestrator (calls server API)
   */
  async stop(): Promise<void> {
    // In production, this would call the server API
    this.isRunning = false
    this.emit('orchestrator:stopped', { timestamp: Date.now() })
  }

  /**
   * Update agent (calls server API)
   */
  async updateAgent(agentId: string, updates: Partial<LangGraphAgent>): Promise<boolean> {
    // In production, this would call the server API
    const agent = this.agents.get(agentId)
    if (agent) {
      Object.assign(agent, updates)
      this.emit('agent:updated', { agentId, updates })
      return true
    }
    return false
  }

  /**
   * Add agent (calls server API)
   */
  async addAgent(config: Partial<LangGraphAgent>): Promise<string> {
    // In production, this would call the server API
    const agentId = `agent_${Date.now()}`
    const agent: LangGraphAgent = {
      id: agentId,
      name: config.name || 'New Agent',
      type: config.type || 'momentum',
      status: 'paused',
      llmModel: config.llmModel || 'gpt-4o-mini',
      specialization: config.specialization || [],
      portfolio: agentId,
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        averageDecisionTime: 0,
        confidenceAccuracy: 0,
        lastUpdated: new Date()
      },
      lastDecision: null,
      config: config.config || {
        symbols: ['BTC/USDT'],
        maxPositionSize: 10000,
        riskTolerance: 'moderate',
        decisionFrequency: 15,
        llmPreference: 'auto',
        enableSentimentAnalysis: true,
        enableRiskOverride: true,
        coordinationMode: 'collaborative'
      },
      workflowState: null
    }
    
    this.agents.set(agentId, agent)
    this.emit('agent:added', { agentId, agent })
    return agentId
  }
}

// Export client-safe singleton
// TEMPORARILY DISABLED: Auto-instantiation causing circular dependency
// export const langGraphOrchestrator = new LangGraphTradingOrchestratorClient()