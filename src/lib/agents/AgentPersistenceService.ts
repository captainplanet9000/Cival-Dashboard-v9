/**
 * Agent Persistence Service
 * Centralized service for managing agent data across the entire dashboard
 */

import { EventEmitter } from 'events'

// Lazy load all services to prevent circular dependencies
const getPersistentTradingEngine = () => import('@/lib/paper-trading/PersistentTradingEngine').then(m => m.persistentTradingEngine)
const getTestnetDeFiService = () => import('@/lib/defi/TestnetDeFiService').then(m => m.testnetDeFiService)
const getGeminiService = () => import('@/lib/ai/GeminiService').then(m => m.geminiService)
const getAgentTodoService = () => import('@/lib/agents/AgentTodoService').then(m => m.agentTodoService)
const getMcpIntegrationService = () => import('@/lib/mcp/MCPIntegrationService').then(m => m.mcpIntegrationService)

export interface AgentConfig {
  // Basic Info
  name: string
  description: string
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'risk_manager' | 'coordinator' | 'specialist'
  avatar?: string
  
  // Trading Configuration
  initialCapital: number
  maxPositionSize: number
  riskTolerance: number
  maxDrawdown: number
  timeHorizon: string
  tradingPairs: string[]
  strategies: string[]
  
  // DeFi Configuration
  enableDeFi: boolean
  defiNetworks: string[]
  defiProtocols: string[]
  autoCompound: boolean
  liquidityMining: boolean
  
  // AI Configuration
  llmProvider: 'gemini' | 'openai' | 'local'
  llmModel: string
  systemPrompt?: string
  decisionThreshold: number
  enableLearning: boolean
  
  // MCP Tools Configuration
  enabledTools: string[]
  toolPermissions: Record<string, string[]>
  
  // Hierarchy & Coordination
  parentAgentId?: string
  role: 'trader' | 'analyst' | 'coordinator' | 'risk_manager'
  permissions: string[]
  
  // Advanced Settings
  enableNotifications: boolean
  enableLogging: boolean
  enableWebhooks: boolean
  webhookUrl?: string
  
  // Metadata
  createdAt: number
  updatedAt: number
  version: string
}

export interface AgentInstance {
  id: string
  config: AgentConfig
  status: 'active' | 'inactive' | 'error' | 'paused' | 'initializing'
  
  // Runtime State
  portfolioId?: string
  walletIds: string[]
  memoryEntries: number
  totalTodos: number
  completedTodos: number
  
  // Performance Metrics
  performance: {
    totalTrades: number
    winRate: number
    totalReturn: number
    totalReturnPercent: number
    sharpeRatio: number
    maxDrawdown: number
    lastUpdate: number
  }
  
  // System Integration
  integrations: {
    tradingEngine: boolean
    defiService: boolean
    aiService: boolean
    todoService: boolean
    mcpTools: boolean
  }
  
  // Health & Monitoring
  lastActivity: number
  errorCount: number
  warnings: string[]
  metrics: Record<string, number>
}

export interface AgentCreationResult {
  success: boolean
  agentId?: string
  agent?: AgentInstance
  portfolioId?: string
  walletIds?: string[]
  errors?: string[]
  warnings?: string[]
}

class AgentPersistenceService extends EventEmitter {
  private agents: Map<string, AgentInstance> = new Map()
  private agentConfigs: Map<string, AgentConfig> = new Map()
  private agentRelationships: Map<string, string[]> = new Map() // parentId -> childIds
  
  // Lazy loaded services
  private persistentTradingEngine: any = null
  private testnetDeFiService: any = null
  private geminiService: any = null
  private agentTodoService: any = null
  private mcpIntegrationService: any = null
  
  constructor() {
    super()
    this.initializeAsync()
  }
  
  private async initializeAsync() {
    try {
      // Load services lazily
      this.persistentTradingEngine = await getPersistentTradingEngine()
      this.testnetDeFiService = await getTestnetDeFiService()
      this.geminiService = await getGeminiService()
      this.agentTodoService = await getAgentTodoService()
      this.mcpIntegrationService = await getMcpIntegrationService()
      
      this.loadPersistedData()
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to initialize AgentPersistenceService:', error)
    }
  }

  // Main agent creation method that integrates all systems
  async createAgent(config: AgentConfig): Promise<AgentCreationResult> {
    try {
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const result: AgentCreationResult = {
        success: false,
        agentId,
        errors: [],
        warnings: []
      }

      // 1. Create base agent instance
      const agent: AgentInstance = {
        id: agentId,
        config: {
          ...config,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0'
        },
        status: 'initializing',
        walletIds: [],
        memoryEntries: 0,
        totalTodos: 0,
        completedTodos: 0,
        performance: {
          totalTrades: 0,
          winRate: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          lastUpdate: Date.now()
        },
        integrations: {
          tradingEngine: false,
          defiService: false,
          aiService: false,
          todoService: false,
          mcpTools: false
        },
        lastActivity: Date.now(),
        errorCount: 0,
        warnings: [],
        metrics: {}
      }

      // 2. Initialize Paper Trading Engine
      try {
        const portfolio = persistentTradingEngine.createAgentPortfolio(agentId, config.initialCapital)
        agent.portfolioId = agentId
        agent.integrations.tradingEngine = true
        console.log(`✅ Created trading portfolio for agent ${agentId}`)
      } catch (error) {
        result.errors?.push(`Trading engine initialization failed: ${error}`)
        console.error('Trading engine error:', error)
      }

      // 3. Initialize DeFi Wallets (if enabled)
      if (config.enableDeFi) {
        try {
          const walletPromises = config.defiNetworks.map(async (network) => {
            const wallet = await testnetDeFiService.createTestnetWallet(network)
            return wallet.id
          })
          
          const walletIds = await Promise.all(walletPromises)
          agent.walletIds = walletIds
          agent.integrations.defiService = true
          result.walletIds = walletIds
          console.log(`✅ Created ${walletIds.length} DeFi wallets for agent ${agentId}`)
        } catch (error) {
          result.errors?.push(`DeFi wallet creation failed: ${error}`)
          console.error('DeFi wallet error:', error)
        }
      }

      // 4. Initialize AI Service
      try {
        if (this.geminiService?.isConfigured()) {
          // Initialize agent memory
          this.geminiService?.clearAgentMemory(agentId) // Start fresh
          
          // Add initial system memory
          const systemMemory = {
            id: `system_${Date.now()}`,
            agentId,
            type: 'learning' as const,
            content: `Agent ${config.name} initialized with ${config.type} strategy. System prompt: ${config.systemPrompt || 'Default trading agent'}`,
            context: { agentConfig: config },
            importance: 0.8,
            timestamp: Date.now(),
            tags: ['system', 'initialization', config.type]
          }
          
          geminiService['addToMemory'](agentId, systemMemory)
          agent.memoryEntries = 1
          agent.integrations.aiService = true
          console.log(`✅ Initialized AI service for agent ${agentId}`)
        } else {
          result.warnings?.push('Gemini API not configured - AI features will use fallback logic')
        }
      } catch (error) {
        result.errors?.push(`AI service initialization failed: ${error}`)
        console.error('AI service error:', error)
      }

      // 5. Initialize Todo System
      try {
        // Create default todos based on agent type
        await this.createDefaultTodos(agentId, config)
        
        const todos = this.agentTodoService?.getAgentTodos(agentId)
        agent.totalTodos = todos.length
        agent.completedTodos = todos.filter(t => t.status === 'completed').length
        agent.integrations.todoService = true
        console.log(`✅ Created ${todos.length} default todos for agent ${agentId}`)
      } catch (error) {
        result.errors?.push(`Todo system initialization failed: ${error}`)
        console.error('Todo system error:', error)
      }

      // 6. Setup Agent Hierarchy
      if (config.parentAgentId) {
        try {
          await this.addToHierarchy(config.parentAgentId, agentId)
          console.log(`✅ Added agent ${agentId} to hierarchy under ${config.parentAgentId}`)
        } catch (error) {
          result.warnings?.push(`Hierarchy setup failed: ${error}`)
        }
      }

      // 7. Initialize MCP Tools
      try {
        const mcpResult = await this.mcpIntegrationService?.activateForAgent(agentId)
        if (mcpResult.success) {
          agent.integrations.mcpTools = true
          console.log(`✅ Initialized MCP tools for agent ${agentId}`)
        } else {
          result.warnings?.push(`MCP tools initialization failed: ${mcpResult.errors?.join(', ')}`)
        }
      } catch (error) {
        result.warnings?.push(`MCP tools initialization failed: ${error}`)
      }

      // 8. Finalize agent creation
      agent.status = result.errors?.length > 0 ? 'error' : 'active'
      this.agents.set(agentId, agent)
      this.agentConfigs.set(agentId, agent.config)
      
      result.success = result.errors?.length === 0
      result.agent = agent
      result.portfolioId = agent.portfolioId
      
      // 9. Persist all data
      this.persistData()
      
      // 10. Emit events for dashboard updates
      this.emit('agentCreated', { agentId, agent, result })
      this.emit('dashboardUpdate', { type: 'agentCreated', agentId, agent })
      
      console.log(`🎉 Agent ${agentId} creation ${result.success ? 'completed successfully' : 'completed with errors'}`)
      
      return result
      
    } catch (error) {
      console.error('Agent creation failed:', error)
      return {
        success: false,
        errors: [`Critical error: ${error}`]
      }
    }
  }

  // Update agent configuration and sync across systems
  async updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`)
      }

      const oldConfig = agent.config
      const newConfig = {
        ...oldConfig,
        ...updates,
        updatedAt: Date.now()
      }

      // Update trading engine if trading config changed
      if (updates.maxPositionSize || updates.riskTolerance) {
        // Update portfolio settings in trading engine
        console.log(`Updated trading configuration for agent ${agentId}`)
      }

      // Update DeFi wallets if DeFi config changed
      if (updates.enableDeFi !== undefined || updates.defiNetworks) {
        if (updates.enableDeFi && !oldConfig.enableDeFi) {
          // Create new DeFi wallets
          const walletPromises = (updates.defiNetworks || oldConfig.defiNetworks).map(async (network) => {
            const wallet = await testnetDeFiService.createTestnetWallet(network)
            return wallet.id
          })
          agent.walletIds = await Promise.all(walletPromises)
        }
      }

      // Update AI configuration if changed
      if (updates.systemPrompt || updates.llmProvider) {
        // Add memory entry about configuration change
        if (this.geminiService?.isConfigured()) {
          const memoryEntry = {
            id: `config_update_${Date.now()}`,
            agentId,
            type: 'learning' as const,
            content: `Configuration updated: ${Object.keys(updates).join(', ')}`,
            context: { oldConfig, newConfig, updates },
            importance: 0.6,
            timestamp: Date.now(),
            tags: ['config_update', 'system']
          }
          geminiService['addToMemory'](agentId, memoryEntry)
        }
      }

      agent.config = newConfig
      this.agentConfigs.set(agentId, newConfig)
      this.persistData()

      this.emit('agentUpdated', { agentId, agent, updates })
      this.emit('dashboardUpdate', { type: 'agentUpdated', agentId, agent })

      return true
    } catch (error) {
      console.error('Agent update failed:', error)
      return false
    }
  }

  // Delete agent and cleanup all associated data
  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) return false

      // Cleanup trading portfolio
      if (agent.portfolioId) {
        // Note: persistentTradingEngine doesn't have delete method, but we'll remove from our tracking
        console.log(`Cleaned up trading portfolio for agent ${agentId}`)
      }

      // Cleanup DeFi wallets
      agent.walletIds.forEach(walletId => {
        // Note: testnetDeFiService doesn't have delete method, but wallets are tracked separately
        console.log(`Cleaned up DeFi wallet ${walletId} for agent ${agentId}`)
      })

      // Cleanup AI memory
      this.geminiService?.clearAgentMemory(agentId)

      // Cleanup todos
      const todos = this.agentTodoService?.getAgentTodos(agentId)
      for (const todo of todos) {
        await this.agentTodoService?.deleteTodo(agentId, todo.id)
      }

      // Remove from hierarchy
      if (agent.config.parentAgentId) {
        await this.removeFromHierarchy(agent.config.parentAgentId, agentId)
      }

      // Remove children from hierarchy
      const children = this.agentRelationships.get(agentId) || []
      for (const childId of children) {
        const childAgent = this.agents.get(childId)
        if (childAgent) {
          childAgent.config.parentAgentId = undefined
        }
      }
      this.agentRelationships.delete(agentId)

      // Remove agent from storage
      this.agents.delete(agentId)
      this.agentConfigs.delete(agentId)
      
      this.persistData()

      this.emit('agentDeleted', { agentId })
      this.emit('dashboardUpdate', { type: 'agentDeleted', agentId })

      console.log(`🗑️ Agent ${agentId} deleted successfully`)
      return true
    } catch (error) {
      console.error('Agent deletion failed:', error)
      return false
    }
  }

  // Get all agents for dashboard display
  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values())
  }

  // Get agent by ID
  getAgent(agentId: string): AgentInstance | null {
    return this.agents.get(agentId) || null
  }

  // Get agents by type
  getAgentsByType(type: string): AgentInstance[] {
    return Array.from(this.agents.values()).filter(agent => agent.config.type === type)
  }

  // Get agent hierarchy
  getAgentHierarchy(parentId?: string): AgentInstance[] {
    if (!parentId) {
      // Return top-level agents
      return Array.from(this.agents.values()).filter(agent => !agent.config.parentAgentId)
    }
    
    const childIds = this.agentRelationships.get(parentId) || []
    return childIds.map(id => this.agents.get(id)).filter(Boolean) as AgentInstance[]
  }

  // Update agent performance metrics
  updateAgentPerformance(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (!agent) return

    try {
      // Get performance from trading engine
      const performance = persistentTradingEngine.getAgentPerformance(agentId)
      if (performance) {
        agent.performance = {
          ...performance,
          lastUpdate: Date.now()
        }
      }

      // Update todo completion rate
      const todos = this.agentTodoService?.getAgentTodos(agentId)
      agent.totalTodos = todos.length
      agent.completedTodos = todos.filter(t => t.status === 'completed').length

      // Update memory count
      const memories = this.geminiService?.getAgentMemory(agentId)
      agent.memoryEntries = memories.length

      agent.lastActivity = Date.now()
      this.persistData()

      this.emit('agentPerformanceUpdated', { agentId, performance: agent.performance })
    } catch (error) {
      console.error('Performance update failed:', error)
      agent.errorCount++
    }
  }

  // Private helper methods
  private async createDefaultTodos(agentId: string, config: AgentConfig): Promise<void> {
    const defaultTodos = [
      {
        title: 'Initialize Trading Strategy',
        description: `Set up ${config.type} trading strategy with configured parameters`,
        priority: 'high' as const,
        category: 'strategy' as const,
        estimatedDuration: 1800000, // 30 minutes
        tags: ['initialization', 'strategy', config.type]
      },
      {
        title: 'Perform Risk Assessment',
        description: 'Analyze current market conditions and assess risk parameters',
        priority: 'high' as const,
        category: 'analysis' as const,
        estimatedDuration: 900000, // 15 minutes
        tags: ['risk', 'analysis', 'assessment']
      },
      {
        title: 'Review Portfolio Allocation',
        description: 'Analyze current portfolio allocation and optimize position sizes',
        priority: 'medium' as const,
        category: 'trading' as const,
        estimatedDuration: 1200000, // 20 minutes
        tags: ['portfolio', 'allocation', 'optimization']
      }
    ]

    if (config.enableDeFi) {
      defaultTodos.push({
        title: 'Setup DeFi Operations',
        description: 'Initialize DeFi wallets and configure protocol interactions',
        priority: 'medium' as const,
        category: 'trading' as const,
        estimatedDuration: 2400000, // 40 minutes
        tags: ['defi', 'wallets', 'protocols']
      })
    }

    for (const todoData of defaultTodos) {
      await this.agentTodoService?.createTodo(agentId, todoData)
    }
  }

  // Get MCP stats for agent
  getAgentMCPStats(agentId: string) {
    return this.mcpIntegrationService?.getAgentStats(agentId)
  }

  // Call MCP tool for agent
  async callMCPTool(agentId: string, toolId: string, parameters: Record<string, any>, context?: Record<string, any>) {
    return await this.mcpIntegrationService?.callTool(agentId, toolId, parameters, context)
  }

  // Get available MCP tools for agent
  getAvailableMCPTools(agentId: string) {
    return this.mcpIntegrationService?.getAvailableTools(agentId)
  }

  private async addToHierarchy(parentId: string, childId: string): Promise<void> {
    if (!this.agentRelationships.has(parentId)) {
      this.agentRelationships.set(parentId, [])
    }
    this.agentRelationships.get(parentId)!.push(childId)
  }

  private async removeFromHierarchy(parentId: string, childId: string): Promise<void> {
    const children = this.agentRelationships.get(parentId) || []
    const index = children.indexOf(childId)
    if (index !== -1) {
      children.splice(index, 1)
    }
  }

  private setupEventListeners(): void {
    // Listen to trading engine events
    persistentTradingEngine.on('portfolioUpdated', (data) => {
      this.updateAgentPerformance(data.agentId)
    })

    // Listen to todo system events
    this.agentTodoService?.on('todoCreated', (data) => {
      const agent = this.agents.get(data.agentId)
      if (agent) {
        agent.totalTodos++
        this.persistData()
      }
    })

    this.agentTodoService?.on('todoUpdated', (data) => {
      const agent = this.agents.get(data.agentId)
      if (agent && data.todo.status === 'completed' && data.previousTodo?.status !== 'completed') {
        agent.completedTodos++
        this.persistData()
      }
    })
  }

  private persistData(): void {
    try {
      // Check if running in browser
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      const data = {
        agents: Object.fromEntries(this.agents),
        agentConfigs: Object.fromEntries(this.agentConfigs),
        agentRelationships: Object.fromEntries(this.agentRelationships),
        version: '1.0.0',
        lastUpdate: Date.now()
      }
      localStorage.setItem('agent_persistence_service', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist agent data:', error)
    }
  }

  private loadPersistedData(): void {
    try {
      // Check if running in browser
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      const stored = localStorage.getItem('agent_persistence_service')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.agents) {
          this.agents = new Map(Object.entries(data.agents))
        }
        
        if (data.agentConfigs) {
          this.agentConfigs = new Map(Object.entries(data.agentConfigs))
        }
        
        if (data.agentRelationships) {
          this.agentRelationships = new Map(Object.entries(data.agentRelationships))
        }
        
        console.log('Loaded agent persistence data')
      }
    } catch (error) {
      console.error('Failed to load agent persistence data:', error)
    }
  }

  // Public method to sync all agent data
  async syncAllAgents(): Promise<void> {
    for (const agentId of this.agents.keys()) {
      this.updateAgentPerformance(agentId)
    }
  }

  // Get dashboard stats
  getDashboardStats() {
    const agents = Array.from(this.agents.values())
    const mcpStats = this.mcpIntegrationService?.getDashboardStats()
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      inactiveAgents: agents.filter(a => a.status === 'inactive').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      totalTodos: agents.reduce((sum, a) => sum + a.totalTodos, 0),
      completedTodos: agents.reduce((sum, a) => sum + a.completedTodos, 0),
      totalWallets: agents.reduce((sum, a) => sum + a.walletIds.length, 0),
      integrationHealth: {
        tradingEngine: agents.filter(a => a.integrations.tradingEngine).length,
        defiService: agents.filter(a => a.integrations.defiService).length,
        aiService: agents.filter(a => a.integrations.aiService).length,
        todoService: agents.filter(a => a.integrations.todoService).length,
        mcpTools: agents.filter(a => a.integrations.mcpTools).length
      },
      mcpStats: {
        totalTools: mcpStats.totalTools,
        enabledTools: mcpStats.enabledTools,
        totalCalls: mcpStats.totalCalls,
        successfulCalls: mcpStats.successfulCalls,
        avgResponseTime: mcpStats.avgResponseTime,
        activeSessions: mcpStats.activeSessions,
        topTools: mcpStats.toolUsage.slice(0, 5)
      }
    }
  }
}

// Singleton instance - lazy initialization to avoid circular dependencies
// Export lazy singleton to prevent circular dependencies
let _agentPersistenceService: AgentPersistenceService | null = null

export function getAgentPersistenceService(): AgentPersistenceService {
  if (!_agentPersistenceService) {
    _agentPersistenceService = new AgentPersistenceService()
  }
  return _agentPersistenceService
}

// Keep the old export for backward compatibility but make it lazy
// Using a function instead of Proxy to prevent circular dependency issues
export const agentPersistenceService = {
  get: () => getAgentPersistenceService()
}

export default AgentPersistenceService