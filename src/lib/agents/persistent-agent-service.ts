'use client'

import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { agentLifecycleManager } from './agent-lifecycle-manager'
import { enhancedAgentCreationService } from './enhanced-agent-creation-service'
import { toast } from 'react-hot-toast'
import { broadcastAgentUpdate, broadcastPortfolioUpdate } from '@/lib/api/websocket-broadcaster'

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
  private portfolioSyncInterval?: NodeJS.Timeout
  private useSupabase = false

  constructor() {
    super()
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private async initialize() {
    // Check Supabase availability first
    await this.checkSupabaseAvailability()
    
    // Load agents from preferred source
    if (this.useSupabase) {
      await this.loadAgentsFromSupabase()
    } else {
      this.loadAgentsFromStorage()
    }
    
    // Start paper trading engine if not running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Restore agents to paper trading engine
    for (const agent of this.agents.values()) {
      await this.restoreAgentToEngine(agent)
    }

    // Start real-time portfolio synchronization
    this.startPortfolioSync()

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

  private async checkSupabaseAvailability() {
    try {
      const { isSupabaseAvailable } = await import('@/lib/supabase/client')
      const available = await isSupabaseAvailable()
      
      if (available) {
        this.useSupabase = true
        console.log('🟢 Agent service: Using Supabase for persistence')
      } else {
        console.log('🟡 Agent service: Using localStorage (Supabase not available)')
      }
    } catch (error) {
      console.log('🟡 Agent service: Supabase unavailable, using localStorage fallback')
      this.useSupabase = false
    }
  }

  private async loadAgentsFromSupabase() {
    try {
      const { supabaseAgentsService } = await import('@/lib/services/supabase-agents-service')
      const supabaseAgents = await supabaseAgentsService.getAllAgents()
      
      // Convert Supabase agents to local format
      this.agents.clear()
      for (const sa of supabaseAgents) {
        const localAgent: PersistentAgent = {
          id: sa.agent_id,
          name: sa.name,
          strategy: sa.strategy,
          status: sa.status,
          initialCapital: Number(sa.initial_capital),
          currentCapital: Number(sa.current_capital),
          createdAt: sa.created_at,
          lastActive: sa.updated_at,
          config: sa.configuration || {},
          performance: {
            totalPnL: (sa.performance_metrics as any)?.totalPnL || 0,
            winRate: (sa.performance_metrics as any)?.winRate || 0,
            totalTrades: (sa.performance_metrics as any)?.totalTrades || 0,
            sharpeRatio: (sa.performance_metrics as any)?.sharpeRatio || 0
          }
        }
        this.agents.set(sa.agent_id, localAgent)
      }
      
      console.log(`📥 Loaded ${this.agents.size} agents from Supabase`)
    } catch (error) {
      console.error('Failed to load agents from Supabase:', error)
      this.useSupabase = false
      this.loadAgentsFromStorage()
    }
  }

  private async saveAgentToSupabase(agent: PersistentAgent) {
    if (!this.useSupabase) return
    
    try {
      const { supabaseAgentsService } = await import('@/lib/services/supabase-agents-service')
      
      // Check if agent exists
      const existing = await supabaseAgentsService.getAgentById(agent.id)
      
      if (existing) {
        // Update existing agent
        await supabaseAgentsService.updateAgent(agent.id, {
          name: agent.name,
          status: agent.status,
          current_capital: agent.currentCapital,
          performance_metrics: agent.performance
        })
      } else {
        // Create new agent  
        await supabaseAgentsService.createAgent({
          name: agent.name,
          agent_type: 'trading',
          strategy: agent.strategy,
          initial_capital: agent.initialCapital,
          configuration: agent.config
        })
      }
    } catch (error) {
      console.error('Failed to save agent to Supabase:', error)
    }
  }

  private startPortfolioSync() {
    // Sync portfolio data every 30 seconds
    this.portfolioSyncInterval = setInterval(() => {
      this.syncPortfolioData()
    }, 30000)

    // Also sync immediately
    this.syncPortfolioData()
  }

  private async syncPortfolioData() {
    try {
      const tradingAgents = paperTradingEngine.getAllAgents()
      let hasUpdates = false

      for (const [agentId, agent] of this.agents.entries()) {
        // Find corresponding trading agent
        const tradingAgent = tradingAgents.find(ta => ta.name === agent.name)
        
        if (tradingAgent && tradingAgent.portfolio) {
          const newCapital = tradingAgent.portfolio.totalValue
          const newPnL = tradingAgent.portfolio.totalValue - agent.initialCapital
          const newTrades = tradingAgent.performance?.totalTrades || 0
          const newWinRate = tradingAgent.performance?.winRate || 0
          const newSharpe = tradingAgent.performance?.sharpeRatio || 0

          // Check if values have changed
          if (
            Math.abs(agent.currentCapital - newCapital) > 0.01 ||
            Math.abs(agent.performance.totalPnL - newPnL) > 0.01 ||
            agent.performance.totalTrades !== newTrades ||
            Math.abs(agent.performance.winRate - newWinRate * 100) > 0.1
          ) {
            // Update agent with new values
            agent.currentCapital = newCapital
            agent.performance.totalPnL = newPnL
            agent.performance.totalTrades = newTrades
            agent.performance.winRate = newWinRate * 100 // Convert to percentage
            agent.performance.sharpeRatio = newSharpe
            agent.lastActive = new Date().toISOString()

            hasUpdates = true
            console.log(`📊 Updated ${agent.name}: $${newCapital.toFixed(2)} (${newPnL >= 0 ? '+' : ''}${newPnL.toFixed(2)} P&L)`)
          }
        }
      }

      if (hasUpdates) {
        this.saveAgentsToStorage()
        
        // Broadcast real-time portfolio updates
        const updatedAgents = Array.from(this.agents.values())
        await broadcastPortfolioUpdate({
          totalAgents: updatedAgents.length,
          activeAgents: updatedAgents.filter(a => a.status === 'active').length,
          totalValue: updatedAgents.reduce((sum, a) => sum + a.currentCapital, 0),
          totalPnL: updatedAgents.reduce((sum, a) => sum + a.performance.totalPnL, 0),
          totalTrades: updatedAgents.reduce((sum, a) => sum + a.performance.totalTrades, 0),
          avgWinRate: updatedAgents.length > 0 ? 
            updatedAgents.reduce((sum, a) => sum + a.performance.winRate, 0) / updatedAgents.length : 0,
          lastUpdate: new Date().toISOString(),
          eventType: 'portfolio_sync'
        })
        
        this.emit('portfolioUpdated', updatedAgents)
        this.emit('agentUpdated')
      }
    } catch (error) {
      console.error('Error syncing portfolio data:', error)
    }
  }

  stopPortfolioSync() {
    if (this.portfolioSyncInterval) {
      clearInterval(this.portfolioSyncInterval)
      this.portfolioSyncInterval = undefined
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
      
      // Also save to Supabase if available
      await this.saveAgentToSupabase(agent)

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

      // Broadcast real-time agent creation event
      await broadcastAgentUpdate(agentId, {
        agentId,
        name: agent.name,
        strategy: agent.strategy,
        status: agent.status,
        initialCapital: agent.initialCapital,
        currentCapital: agent.currentCapital,
        performance: agent.performance,
        createdAt: agent.createdAt,
        eventType: 'agent_created'
      })

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
      
      // Also update in Supabase
      await this.saveAgentToSupabase(agent)

      // Start in lifecycle manager if exists
      await agentLifecycleManager.startAgent(agentId)

      // Broadcast real-time agent status change
      await broadcastAgentUpdate(agentId, {
        agentId,
        name: agent.name,
        strategy: agent.strategy,
        status: agent.status,
        currentCapital: agent.currentCapital,
        performance: agent.performance,
        lastActive: agent.lastActive,
        eventType: 'agent_started'
      })

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
      
      // Also update in Supabase
      await this.saveAgentToSupabase(agent)

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
// Lazy initialization
let persistentAgentServiceInstance: PersistentAgentService | null = null

export function getPersistentAgentService(): PersistentAgentService {
  if (!persistentAgentServiceInstance) {
    persistentAgentServiceInstance = new PersistentAgentService()
  }
  return persistentAgentServiceInstance
}

// For backward compatibility
export const persistentAgentService = {
  get instance() {
    return getPersistentAgentService()
  }
}

// Export types
export type { PersistentAgent }