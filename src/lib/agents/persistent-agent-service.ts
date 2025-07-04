'use client'

import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { agentLifecycleManager } from './agent-lifecycle-manager'
import { enhancedAgentCreationService } from './enhanced-agent-creation-service'
import { toast } from 'react-hot-toast'

export interface PersistentAgent {
  id: string
  name: string
  strategy: string
  status: 'active' | 'paused' | 'stopped'
  initialCapital: number
  currentCapital: number
  createdAt: string
  lastActive: string
  config: any
  performance: {
    totalPnL: number
    winRate: number
    totalTrades: number
    sharpeRatio: number
  }
}

class PersistentAgentService extends EventEmitter {
  private readonly STORAGE_KEY = 'cival_persistent_agents'
  private agents: Map<string, PersistentAgent> = new Map()
  private initialized = false

  constructor() {
    super()
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private async initialize() {
    // Load agents from localStorage
    this.loadAgentsFromStorage()
    
    // Start paper trading engine if not running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Restore agents to paper trading engine
    for (const agent of this.agents.values()) {
      await this.restoreAgentToEngine(agent)
    }

    this.initialized = true
    console.log(`✅ Persistent Agent Service initialized with ${this.agents.size} agents`)
  }

  private loadAgentsFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const agents = JSON.parse(stored)
        for (const agent of agents) {
          this.agents.set(agent.id, agent)
        }
      }
    } catch (error) {
      console.error('Error loading agents from storage:', error)
    }
  }

  private saveAgentsToStorage() {
    try {
      const agents = Array.from(this.agents.values())
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(agents))
    } catch (error) {
      console.error('Error saving agents to storage:', error)
    }
  }

  private async restoreAgentToEngine(agent: PersistentAgent) {
    try {
      // Create agent in paper trading engine
      const tradingAgent = paperTradingEngine.createAgent({
        name: agent.name,
        description: `Restored agent: ${agent.name}`,
        strategy: {
          name: agent.strategy,
          type: agent.strategy as any,
          parameters: agent.config.strategy?.parameters || {},
          description: ''
        },
        initialCapital: agent.currentCapital,
        riskLimits: agent.config.riskLimits || {
          maxPositionSize: 10,
          maxDailyLoss: 500,
          maxDrawdown: 20,
          maxLeverage: 1,
          allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
          stopLossEnabled: true,
          takeProfitEnabled: true
        }
      })

      // Update agent status
      if (agent.status === 'active') {
        tradingAgent.status = 'active'
      }

      console.log(`♻️ Restored agent ${agent.name} to trading engine`)
    } catch (error) {
      console.error(`Error restoring agent ${agent.name}:`, error)
    }
  }

  async createAgent(config: any): Promise<string | null> {
    try {
      const agentId = uuidv4()
      
      // Create persistent agent record
      const agent: PersistentAgent = {
        id: agentId,
        name: config.name,
        strategy: config.strategy,
        status: 'stopped',
        initialCapital: config.initialCapital,
        currentCapital: config.initialCapital,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        config: config,
        performance: {
          totalPnL: 0,
          winRate: 0,
          totalTrades: 0,
          sharpeRatio: 0
        }
      }

      // Save to storage
      this.agents.set(agentId, agent)
      this.saveAgentsToStorage()

      // Create in paper trading engine
      const tradingAgent = paperTradingEngine.createAgent({
        name: config.name,
        description: config.description || '',
        strategy: {
          name: config.strategy,
          type: config.strategy,
          parameters: config.parameters || {},
          description: ''
        },
        initialCapital: config.initialCapital,
        riskLimits: config.riskLimits
      })

      // Also create in lifecycle manager if autonomous features enabled
      if (config.autonomousConfig?.enabled) {
        await agentLifecycleManager.createAgent(config)
      }

      // Create autonomous agent if LLM enabled
      if (config.llmConfig) {
        await enhancedAgentCreationService.createAutonomousAgent(config)
      }

      this.emit('agentCreated', agent)
      toast.success(`Agent "${config.name}" created successfully`)
      
      return agentId
    } catch (error) {
      console.error('Error creating persistent agent:', error)
      toast.error('Failed to create agent')
      return null
    }
  }

  async startAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) return false

      // Find agent in paper trading engine
      const tradingAgents = paperTradingEngine.getAllAgents()
      const tradingAgent = tradingAgents.find(a => a.name === agent.name)
      
      if (tradingAgent) {
        tradingAgent.status = 'active'
        tradingAgent.lastActive = new Date()
      }

      // Update persistent record
      agent.status = 'active'
      agent.lastActive = new Date().toISOString()
      this.saveAgentsToStorage()

      // Start in lifecycle manager if exists
      await agentLifecycleManager.startAgent(agentId)

      this.emit('agentStarted', agent)
      toast.success(`Agent "${agent.name}" started`)
      return true
    } catch (error) {
      console.error('Error starting agent:', error)
      return false
    }
  }

  async stopAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) return false

      // Find agent in paper trading engine
      const tradingAgents = paperTradingEngine.getAllAgents()
      const tradingAgent = tradingAgents.find(a => a.name === agent.name)
      
      if (tradingAgent) {
        tradingAgent.status = 'stopped'
        tradingAgent.lastActive = new Date()
      }

      // Update persistent record
      agent.status = 'stopped'
      agent.lastActive = new Date().toISOString()
      this.saveAgentsToStorage()

      // Stop in lifecycle manager if exists
      await agentLifecycleManager.stopAgent(agentId)

      this.emit('agentStopped', agent)
      toast.success(`Agent "${agent.name}" stopped`)
      return true
    } catch (error) {
      console.error('Error stopping agent:', error)
      return false
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) return false

      // Remove from storage
      this.agents.delete(agentId)
      this.saveAgentsToStorage()

      // Delete from lifecycle manager if exists
      await agentLifecycleManager.deleteAgent(agentId)

      this.emit('agentDeleted', agent)
      toast.success(`Agent "${agent.name}" deleted`)
      return true
    } catch (error) {
      console.error('Error deleting agent:', error)
      return false
    }
  }

  getAllAgents(): PersistentAgent[] {
    return Array.from(this.agents.values())
  }

  getAgent(agentId: string): PersistentAgent | null {
    return this.agents.get(agentId) || null
  }

  updateAgentPerformance(agentId: string, performance: Partial<PersistentAgent['performance']>) {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.performance = { ...agent.performance, ...performance }
      agent.lastActive = new Date().toISOString()
      this.saveAgentsToStorage()
      this.emit('agentUpdated', agent)
    }
  }

  updateAgentCapital(agentId: string, newCapital: number) {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.currentCapital = newCapital
      agent.performance.totalPnL = newCapital - agent.initialCapital
      agent.lastActive = new Date().toISOString()
      this.saveAgentsToStorage()
      this.emit('agentUpdated', agent)
    }
  }
}

// Export singleton instance
export const persistentAgentService = new PersistentAgentService()

// Export types
export type { PersistentAgent }