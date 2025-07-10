'use client'

import { EventEmitter } from 'events'
import { createClient } from '@supabase/supabase-js'
import { redisAgentService, type AgentState, type AgentThought, type AgentDecision } from '@/lib/redis/redis-agent-service'
import { strategyService } from '@/lib/supabase/strategy-service'
import { enhancedAgentCreationService, type EnhancedAgentConfig } from './enhanced-agent-creation-service'
import { autonomousTradingLoop } from './autonomous-trading-loop'
import { llmDecisionIntegrationService } from './llm-decision-integration'

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface LiveAgent {
  id: string
  name: string
  strategy_type: string
  status: 'active' | 'paused' | 'stopped'
  wallet_address?: string
  vault_id?: string
  initial_capital: number
  current_capital: number
  created_at: string
  updated_at: string
  
  // Real-time state from Redis
  realTimeState?: AgentState
  recentThoughts?: AgentThought[]
  recentDecisions?: AgentDecision[]
  performance?: any
}

class AgentLifecycleManager extends EventEmitter {
  private activeAgents = new Map<string, LiveAgent>()
  private tradingLoops = new Map<string, any>()
  private mockMode = !supabase

  constructor() {
    super()
    this.initialize()
  }

  private async initialize() {
    // Listen to Redis events
    redisAgentService.on('thought', (thought: AgentThought) => {
      this.handleThought(thought)
    })

    redisAgentService.on('decision', (decision: AgentDecision) => {
      this.handleDecision(decision)
    })

    redisAgentService.on('performance', (performance: any) => {
      this.handlePerformanceUpdate(performance)
    })

    redisAgentService.on('stateUpdate', ({ agentId, state }: { agentId: string, state: AgentState }) => {
      this.handleStateUpdate(agentId, state)
    })

    // Load existing agents from database
    await this.loadExistingAgents()
  }

  private async loadExistingAgents() {
    if (this.mockMode) {
      this.loadMockAgents()
      return
    }

    try {
      const { data: agents, error } = await supabase!
        .from('agents')
        .select('*')
        .in('status', ['active', 'paused'])

      if (error) {
        console.error('Error loading agents:', error)
        this.loadMockAgents()
        return
      }

      for (const agent of agents || []) {
        await this.restoreAgent(agent)
      }

      console.log(`✅ Loaded ${agents?.length || 0} existing agents`)
    } catch (error) {
      console.error('Failed to load agents:', error)
      this.loadMockAgents()
    }
  }

  private loadMockAgents() {
    const mockAgents = [
      {
        id: 'agent_1',
        name: 'Darvas Box Expert',
        strategy_type: 'darvas_box',
        status: 'active' as const,
        initial_capital: 25000,
        current_capital: 27500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'agent_2',
        name: 'Williams Alligator Pro',
        strategy_type: 'williams_alligator',
        status: 'active' as const,
        initial_capital: 30000,
        current_capital: 28750,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    mockAgents.forEach(agent => {
      this.activeAgents.set(agent.id, agent)
    })

    this.emit('agentsLoaded', mockAgents)
  }

  // Create new agent
  async createAgent(config: any): Promise<string | null> {
    try {
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const agent: LiveAgent = {
        id: agentId,
        name: config.name,
        strategy_type: config.strategy,
        status: 'stopped',
        wallet_address: config.walletAddress,
        vault_id: config.vaultId,
        initial_capital: config.initialCapital || 25000,
        current_capital: config.initialCapital || 25000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Store in database if available
      if (!this.mockMode) {
        const { error } = await supabase!
          .from('agents')
          .insert([{
            id: agentId,
            name: agent.name,
            strategy_type: agent.strategy_type,
            status: agent.status,
            wallet_address: agent.wallet_address,
            vault_id: agent.vault_id,
            initial_capital: agent.initial_capital,
            current_capital: agent.current_capital
          }])

        if (error) {
          console.error('Error creating agent in database:', error)
          return null
        }
      }

      // Initialize Redis state
      const initialState: AgentState = {
        id: agentId,
        name: agent.name,
        status: 'stopped',
        strategy: agent.strategy_type,
        portfolioValue: agent.initial_capital,
        totalPnL: 0,
        winRate: 0,
        lastActivity: new Date().toISOString(),
        currentPositions: [],
        pendingOrders: []
      }

      await redisAgentService.setAgentState(agentId, initialState)

      // Store agent locally
      this.activeAgents.set(agentId, agent)

      this.emit('agentCreated', agent)
      console.log(`✅ Created agent: ${agent.name} (${agentId})`)

      return agentId
    } catch (error) {
      console.error('Error creating agent:', error)
      return null
    }
  }

  // Start agent
  async startAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.activeAgents.get(agentId)
      if (!agent) {
        console.error('Agent not found:', agentId)
        return false
      }

      // Update status in database
      if (!this.mockMode) {
        const { error } = await supabase!
          .from('agents')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId)

        if (error) {
          console.error('Error updating agent status:', error)
          return false
        }
      }

      // Update Redis state
      const state = await redisAgentService.getAgentState(agentId)
      if (state) {
        state.status = 'active'
        await redisAgentService.setAgentState(agentId, state)
      }

      // Start trading loop
      await this.startTradingLoop(agentId, agent)

      // Update local state
      agent.status = 'active'
      this.activeAgents.set(agentId, agent)

      this.emit('agentStarted', agent)
      console.log(`🚀 Started agent: ${agent.name}`)

      return true
    } catch (error) {
      console.error('Error starting agent:', error)
      return false
    }
  }

  // Stop agent
  async stopAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.activeAgents.get(agentId)
      if (!agent) {
        console.error('Agent not found:', agentId)
        return false
      }

      // Stop trading loop
      await this.stopTradingLoop(agentId)

      // Update status in database
      if (!this.mockMode) {
        const { error } = await supabase!
          .from('agents')
          .update({ 
            status: 'stopped',
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId)

        if (error) {
          console.error('Error updating agent status:', error)
          return false
        }
      }

      // Update Redis state
      const state = await redisAgentService.getAgentState(agentId)
      if (state) {
        state.status = 'stopped'
        await redisAgentService.setAgentState(agentId, state)
      }

      // Update local state
      agent.status = 'stopped'
      this.activeAgents.set(agentId, agent)

      this.emit('agentStopped', agent)
      console.log(`⏹️ Stopped agent: ${agent.name}`)

      return true
    } catch (error) {
      console.error('Error stopping agent:', error)
      return false
    }
  }

  // Delete agent
  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.activeAgents.get(agentId)
      if (!agent) {
        console.error('Agent not found:', agentId)
        return false
      }

      // Stop if running
      if (agent.status === 'active') {
        await this.stopAgent(agentId)
      }

      // Delete from database
      if (!this.mockMode) {
        const { error } = await supabase!
          .from('agents')
          .delete()
          .eq('id', agentId)

        if (error) {
          console.error('Error deleting agent from database:', error)
          return false
        }
      }

      // Clean up Redis data
      // Note: In a real implementation, you'd want to clean up Redis keys
      // For now, we'll just remove from active set
      
      // Remove from local state
      this.activeAgents.delete(agentId)

      this.emit('agentDeleted', { agentId, agent })
      console.log(`🗑️ Deleted agent: ${agent.name}`)

      return true
    } catch (error) {
      console.error('Error deleting agent:', error)
      return false
    }
  }

  // Get all agents
  async getAllAgents(): Promise<LiveAgent[]> {
    const agents = Array.from(this.activeAgents.values())
    
    // Enrich with real-time data
    for (const agent of agents) {
      agent.realTimeState = await redisAgentService.getAgentState(agent.id)
      agent.recentThoughts = await redisAgentService.getRecentThoughts(agent.id, 10)
      agent.recentDecisions = await redisAgentService.getRecentDecisions(agent.id, 10)
      agent.performance = await redisAgentService.getPerformance(agent.id)
    }

    return agents
  }

  // Get single agent
  async getAgent(agentId: string): Promise<LiveAgent | null> {
    const agent = this.activeAgents.get(agentId)
    if (!agent) return null

    // Enrich with real-time data
    agent.realTimeState = await redisAgentService.getAgentState(agentId)
    agent.recentThoughts = await redisAgentService.getRecentThoughts(agentId, 20)
    agent.recentDecisions = await redisAgentService.getRecentDecisions(agentId, 20)
    agent.performance = await redisAgentService.getPerformance(agentId)

    return agent
  }

  // Private methods
  private async restoreAgent(agentData: any) {
    const agent: LiveAgent = {
      ...agentData,
      realTimeState: await redisAgentService.getAgentState(agentData.id)
    }

    this.activeAgents.set(agent.id, agent)

    // Restart trading loop if agent was active
    if (agent.status === 'active') {
      await this.startTradingLoop(agent.id, agent)
    }
  }

  private async startTradingLoop(agentId: string, agent: LiveAgent) {
    try {
      // Initialize LLM decision making
      const llmConfig = {
        provider: 'gemini',
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        model: 'gemini-pro'
      }

      // Start autonomous trading loop
      const tradingLoop = {
        // Mock trading loop for now
        interval: setInterval(async () => {
          await this.simulateAgentActivity(agentId)
        }, 10000) // Every 10 seconds
      }

      this.tradingLoops.set(agentId, tradingLoop)
    } catch (error) {
      console.error('Error starting trading loop:', error)
    }
  }

  private async stopTradingLoop(agentId: string) {
    const tradingLoop = this.tradingLoops.get(agentId)
    if (tradingLoop?.interval) {
      clearInterval(tradingLoop.interval)
      this.tradingLoops.delete(agentId)
    }
  }

  private async simulateAgentActivity(agentId: string) {
    const agent = this.activeAgents.get(agentId)
    if (!agent || agent.status !== 'active') return

    // Generate mock thought
    const thoughts = [
      'Analyzing current market conditions for potential opportunities',
      'Monitoring technical indicators for entry signals',
      'Evaluating risk-reward ratios for active positions',
      'Learning from recent trading patterns',
      'Optimizing strategy parameters based on performance'
    ]

    const thought: AgentThought = {
      agentId,
      timestamp: new Date().toISOString(),
      type: ['analysis', 'decision', 'learning', 'risk', 'strategy'][Math.floor(Math.random() * 5)] as any,
      content: thoughts[Math.floor(Math.random() * thoughts.length)],
      reasoning: 'AI-driven analysis based on current market conditions and historical patterns',
      confidence: 0.7 + Math.random() * 0.3
    }

    await redisAgentService.addThought(thought)

    // Occasionally generate a decision
    if (Math.random() < 0.3) {
      const decision: AgentDecision = {
        agentId,
        timestamp: new Date().toISOString(),
        action: ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)] as any,
        symbol: ['BTC/USD', 'ETH/USD', 'SOL/USD'][Math.floor(Math.random() * 3)],
        quantity: Math.random() * 2,
        price: 40000 + Math.random() * 10000,
        reasoning: 'Strategy-based decision with favorable risk-reward ratio',
        expectedOutcome: {
          target: 45000,
          stopLoss: 38000,
          probability: 0.75
        }
      }

      await redisAgentService.addDecision(decision)
    }
  }

  // Event handlers
  private handleThought(thought: AgentThought) {
    const agent = this.activeAgents.get(thought.agentId)
    if (agent) {
      this.emit('agentThought', { agent, thought })
    }
  }

  private handleDecision(decision: AgentDecision) {
    const agent = this.activeAgents.get(decision.agentId)
    if (agent) {
      this.emit('agentDecision', { agent, decision })
    }
  }

  private handlePerformanceUpdate(performance: any) {
    const agent = this.activeAgents.get(performance.agentId)
    if (agent) {
      this.emit('performanceUpdate', { agent, performance })
    }
  }

  private handleStateUpdate(agentId: string, state: AgentState) {
    const agent = this.activeAgents.get(agentId)
    if (agent) {
      agent.realTimeState = state
      this.emit('stateUpdate', { agent, state })
    }
  }

  // Getters
  get activeAgentCount(): number {
    return Array.from(this.activeAgents.values()).filter(a => a.status === 'active').length
  }

  get totalAgentCount(): number {
    return this.activeAgents.size
  }

  get isMockMode(): boolean {
    return this.mockMode
  }
}

// Lazy initialization to prevent circular dependencies
let _agentLifecycleManagerInstance: AgentLifecycleManager | null = null

export const getAgentLifecycleManager = (): AgentLifecycleManager => {
  if (!_agentLifecycleManagerInstance) {
    _agentLifecycleManagerInstance = new AgentLifecycleManager()
  }
  return _agentLifecycleManagerInstance
}

// Backward compatibility
export const agentLifecycleManager = {
  get instance() {
    return getAgentLifecycleManager()
  }
}

// Export types
export type { AgentLifecycleManager, LiveAgent }