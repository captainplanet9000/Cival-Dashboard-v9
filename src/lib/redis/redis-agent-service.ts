'use client'

import { createClient, RedisClientType } from 'redis'
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

class RedisAgentService extends EventEmitter {
  private client: RedisClientType | null = null
  private pubClient: RedisClientType | null = null
  private subClient: RedisClientType | null = null
  private connected = false
  private mockMode = true

  constructor() {
    super()
    this.initializeRedis()
  }

  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL

    if (!redisUrl || redisUrl.includes('mock')) {
      console.log('🔴 Redis: Running in mock mode')
      this.mockMode = true
      this.connected = true
      this.emit('connected')
      return
    }

    try {
      // Create Redis clients
      this.client = createClient({ url: redisUrl }) as RedisClientType
      this.pubClient = createClient({ url: redisUrl }) as RedisClientType
      this.subClient = createClient({ url: redisUrl }) as RedisClientType

      // Error handlers
      this.client.on('error', (err) => console.error('Redis Client Error:', err))
      this.pubClient.on('error', (err) => console.error('Redis Pub Error:', err))
      this.subClient.on('error', (err) => console.error('Redis Sub Error:', err))

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ])

      this.connected = true
      this.mockMode = false
      console.log('✅ Redis: Connected successfully')
      this.emit('connected')

      // Set up subscriptions
      this.setupSubscriptions()
    } catch (error) {
      console.error('❌ Redis connection failed:', error)
      this.mockMode = true
      this.connected = true
      this.emit('connected')
    }
  }

  private setupSubscriptions() {
    if (this.mockMode || !this.subClient) return

    // Subscribe to agent thoughts channel
    this.subClient.subscribe('agent:thoughts', (message) => {
      try {
        const thought = JSON.parse(message)
        this.emit('thought', thought)
      } catch (error) {
        console.error('Error parsing thought:', error)
      }
    })

    // Subscribe to agent decisions channel
    this.subClient.subscribe('agent:decisions', (message) => {
      try {
        const decision = JSON.parse(message)
        this.emit('decision', decision)
      } catch (error) {
        console.error('Error parsing decision:', error)
      }
    })

    // Subscribe to performance updates
    this.subClient.subscribe('agent:performance', (message) => {
      try {
        const performance = JSON.parse(message)
        this.emit('performance', performance)
      } catch (error) {
        console.error('Error parsing performance:', error)
      }
    })
  }

  // Agent State Management
  async setAgentState(agentId: string, state: AgentState): Promise<void> {
    if (this.mockMode) {
      this.emit('stateUpdate', { agentId, state })
      return
    }

    try {
      const key = `agents:${agentId}:state`
      await this.client!.hSet(key, {
        ...state,
        lastActivity: new Date().toISOString(),
        currentPositions: JSON.stringify(state.currentPositions || []),
        pendingOrders: JSON.stringify(state.pendingOrders || [])
      })

      // Set agent as active
      if (state.status === 'active') {
        await this.client!.sAdd('agents:active', agentId)
      } else {
        await this.client!.sRem('agents:active', agentId)
      }

      this.emit('stateUpdate', { agentId, state })
    } catch (error) {
      console.error('Error setting agent state:', error)
    }
  }

  async getAgentState(agentId: string): Promise<AgentState | null> {
    if (this.mockMode) {
      return this.getMockAgentState(agentId)
    }

    try {
      const key = `agents:${agentId}:state`
      const state = await this.client!.hGetAll(key) as any

      if (!state || Object.keys(state).length === 0) {
        return null
      }

      return {
        ...state,
        portfolioValue: parseFloat(state.portfolioValue),
        totalPnL: parseFloat(state.totalPnL),
        winRate: parseFloat(state.winRate),
        currentPositions: JSON.parse(state.currentPositions || '[]'),
        pendingOrders: JSON.parse(state.pendingOrders || '[]')
      }
    } catch (error) {
      console.error('Error getting agent state:', error)
      return null
    }
  }

  async getActiveAgents(): Promise<string[]> {
    if (this.mockMode) {
      return ['agent_1', 'agent_2', 'agent_3']
    }

    try {
      return await this.client!.sMembers('agents:active')
    } catch (error) {
      console.error('Error getting active agents:', error)
      return []
    }
  }

  // Thought Management
  async addThought(thought: AgentThought): Promise<void> {
    if (this.mockMode) {
      this.emit('thought', thought)
      return
    }

    try {
      const key = `agents:${thought.agentId}:thoughts`
      
      // Add to list (capped at 100)
      await this.client!.lPush(key, JSON.stringify(thought))
      await this.client!.lTrim(key, 0, 99)

      // Publish to channel
      await this.pubClient!.publish('agent:thoughts', JSON.stringify(thought))
    } catch (error) {
      console.error('Error adding thought:', error)
    }
  }

  async getRecentThoughts(agentId: string, limit = 50): Promise<AgentThought[]> {
    if (this.mockMode) {
      return this.getMockThoughts(agentId)
    }

    try {
      const key = `agents:${agentId}:thoughts`
      const thoughts = await this.client!.lRange(key, 0, limit - 1)
      
      return thoughts.map(t => JSON.parse(t))
    } catch (error) {
      console.error('Error getting thoughts:', error)
      return []
    }
  }

  // Decision Management
  async addDecision(decision: AgentDecision): Promise<void> {
    if (this.mockMode) {
      this.emit('decision', decision)
      return
    }

    try {
      const key = `agents:${decision.agentId}:decisions`
      
      // Add to list (capped at 100)
      await this.client!.lPush(key, JSON.stringify(decision))
      await this.client!.lTrim(key, 0, 99)

      // Publish to channel
      await this.pubClient!.publish('agent:decisions', JSON.stringify(decision))
    } catch (error) {
      console.error('Error adding decision:', error)
    }
  }

  async getRecentDecisions(agentId: string, limit = 50): Promise<AgentDecision[]> {
    if (this.mockMode) {
      return this.getMockDecisions(agentId)
    }

    try {
      const key = `agents:${agentId}:decisions`
      const decisions = await this.client!.lRange(key, 0, limit - 1)
      
      return decisions.map(d => JSON.parse(d))
    } catch (error) {
      console.error('Error getting decisions:', error)
      return []
    }
  }

  // Performance Management
  async updatePerformance(agentId: string, performance: Partial<AgentPerformance>): Promise<void> {
    if (this.mockMode) {
      this.emit('performance', { agentId, ...performance })
      return
    }

    try {
      const key = `agents:${agentId}:performance`
      
      await this.client!.hSet(key, {
        ...performance,
        lastUpdated: new Date().toISOString()
      })

      // Publish update
      await this.pubClient!.publish('agent:performance', JSON.stringify({
        agentId,
        ...performance
      }))
    } catch (error) {
      console.error('Error updating performance:', error)
    }
  }

  async getPerformance(agentId: string): Promise<AgentPerformance | null> {
    if (this.mockMode) {
      return this.getMockPerformance(agentId)
    }

    try {
      const key = `agents:${agentId}:performance`
      const performance = await this.client!.hGetAll(key) as any

      if (!performance || Object.keys(performance).length === 0) {
        return null
      }

      return {
        agentId,
        totalTrades: parseInt(performance.totalTrades || '0'),
        winningTrades: parseInt(performance.winningTrades || '0'),
        losingTrades: parseInt(performance.losingTrades || '0'),
        totalPnL: parseFloat(performance.totalPnL || '0'),
        avgWinAmount: parseFloat(performance.avgWinAmount || '0'),
        avgLossAmount: parseFloat(performance.avgLossAmount || '0'),
        sharpeRatio: parseFloat(performance.sharpeRatio || '0'),
        maxDrawdown: parseFloat(performance.maxDrawdown || '0'),
        lastUpdated: performance.lastUpdated
      }
    } catch (error) {
      console.error('Error getting performance:', error)
      return null
    }
  }

  // Memory Management
  async storeMemory(agentId: string, memoryType: string, data: any): Promise<void> {
    if (this.mockMode) {
      console.log('Mock: Storing memory', { agentId, memoryType, data })
      return
    }

    try {
      const key = `agents:${agentId}:memory`
      await this.client!.hSet(key, memoryType, JSON.stringify(data))
    } catch (error) {
      console.error('Error storing memory:', error)
    }
  }

  async getMemory(agentId: string, memoryType?: string): Promise<any> {
    if (this.mockMode) {
      return this.getMockMemory(agentId)
    }

    try {
      const key = `agents:${agentId}:memory`
      
      if (memoryType) {
        const memory = await this.client!.hGet(key, memoryType)
        return memory ? JSON.parse(memory) : null
      } else {
        const memories = await this.client!.hGetAll(key)
        const parsed: any = {}
        
        for (const [type, data] of Object.entries(memories)) {
          parsed[type] = JSON.parse(data)
        }
        
        return parsed
      }
    } catch (error) {
      console.error('Error getting memory:', error)
      return null
    }
  }

  // Clean up
  async disconnect(): Promise<void> {
    if (!this.mockMode) {
      await Promise.all([
        this.client?.quit(),
        this.pubClient?.quit(),
        this.subClient?.quit()
      ])
    }
    
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
export const redisAgentService = new RedisAgentService()

// Export types
export type { RedisAgentService }