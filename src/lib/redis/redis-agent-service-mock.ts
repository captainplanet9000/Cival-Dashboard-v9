'use client'

import { EventEmitter } from 'events'

export interface AgentState {
  id: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  strategy: string
  portfolioValue: number
  totalPnL: number
  winRate: number
  lastActivity: string
  currentPositions: any[]
  pendingOrders: any[]
}

export interface AgentThought {
  agentId: string
  timestamp: string
  type: 'analysis' | 'decision' | 'learning' | 'risk' | 'strategy'
  content: string
  reasoning: string
  confidence: number
  marketContext?: any
  technicalSignals?: any
}

export interface AgentDecision {
  agentId: string
  timestamp: string
  action: 'buy' | 'sell' | 'hold'
  symbol: string
  quantity: number
  price: number
  reasoning: string
  expectedOutcome: any
}

export interface AgentPerformance {
  agentId: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  avgWinAmount: number
  avgLossAmount: number
  sharpeRatio: number
  maxDrawdown: number
  lastUpdated: string
}

class RedisAgentServiceMock extends EventEmitter {
  private connected = false
  private mockMode = true

  constructor() {
    super()
    // Simulate connection after a short delay
    setTimeout(() => {
      this.connected = true
      this.emit('connected')
    }, 100)
  }

  // Agent State Management
  async setAgentState(agentId: string, state: AgentState): Promise<void> {
    this.emit('stateUpdate', { agentId, state })
  }

  async getAgentState(agentId: string): Promise<AgentState | null> {
    return this.getMockAgentState(agentId)
  }

  async getActiveAgents(): Promise<string[]> {
    return ['agent_1', 'agent_2', 'agent_3']
  }

  // Thought Management
  async addThought(thought: AgentThought): Promise<void> {
    this.emit('thought', thought)
  }

  async getRecentThoughts(agentId: string, limit = 50): Promise<AgentThought[]> {
    return this.getMockThoughts(agentId)
  }

  // Decision Management
  async addDecision(decision: AgentDecision): Promise<void> {
    this.emit('decision', decision)
  }

  async getRecentDecisions(agentId: string, limit = 50): Promise<AgentDecision[]> {
    return this.getMockDecisions(agentId)
  }

  // Performance Management
  async updatePerformance(agentId: string, performance: Partial<AgentPerformance>): Promise<void> {
    this.emit('performance', { agentId, ...performance })
  }

  async getPerformance(agentId: string): Promise<AgentPerformance | null> {
    return this.getMockPerformance(agentId)
  }

  // Memory Management
  async storeMemory(agentId: string, memoryType: string, data: any): Promise<void> {
    console.log('Mock: Storing memory', { agentId, memoryType, data })
  }

  async getMemory(agentId: string, memoryType?: string): Promise<any> {
    return this.getMockMemory(agentId)
  }

  // Clean up
  async disconnect(): Promise<void> {
    this.connected = false
    this.emit('disconnected')
  }

  // Mock data methods
  private getMockAgentState(agentId: string): AgentState {
    return {
      id: agentId,
      name: `Agent ${agentId.split('_')[1]}`,
      status: 'active',
      strategy: 'darvas_box',
      portfolioValue: 25000 + Math.random() * 10000,
      totalPnL: (Math.random() - 0.4) * 2000,
      winRate: 0.5 + Math.random() * 0.3,
      lastActivity: new Date().toISOString(),
      currentPositions: [],
      pendingOrders: []
    }
  }

  private getMockThoughts(agentId: string): AgentThought[] {
    return [
      {
        agentId,
        timestamp: new Date().toISOString(),
        type: 'analysis',
        content: 'Analyzing market conditions for optimal entry',
        reasoning: 'Multiple indicators showing convergence',
        confidence: 0.85
      },
      {
        agentId,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'decision',
        content: 'Initiating long position',
        reasoning: 'Strong technical setup with favorable risk-reward',
        confidence: 0.82
      }
    ]
  }

  private getMockDecisions(agentId: string): AgentDecision[] {
    return [
      {
        agentId,
        timestamp: new Date().toISOString(),
        action: 'buy',
        symbol: 'BTC/USD',
        quantity: 0.5,
        price: 45000,
        reasoning: 'Breakout confirmed with volume',
        expectedOutcome: { target: 47000, stopLoss: 44000 }
      }
    ]
  }

  private getMockPerformance(agentId: string): AgentPerformance {
    return {
      agentId,
      totalTrades: 45,
      winningTrades: 28,
      losingTrades: 17,
      totalPnL: 3500,
      avgWinAmount: 250,
      avgLossAmount: 120,
      sharpeRatio: 1.8,
      maxDrawdown: 0.12,
      lastUpdated: new Date().toISOString()
    }
  }

  private getMockMemory(agentId: string): any {
    return {
      patterns: [
        { type: 'breakout', success: 0.75, occurrences: 23 },
        { type: 'reversal', success: 0.68, occurrences: 15 }
      ],
      learning: {
        bestTimeframes: ['4H', '1D'],
        avoidConditions: ['high_volatility', 'news_events']
      }
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.connected
  }

  get isMockMode(): boolean {
    return this.mockMode
  }
}

// Export singleton instance
export const redisAgentService = new RedisAgentServiceMock()

// Export types
export type { RedisAgentServiceMock as RedisAgentService }