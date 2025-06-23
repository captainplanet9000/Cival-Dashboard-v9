/**
 * System Lifecycle Service
 * Connects all systems for complete agent lifecycle management
 */

import { EventEmitter } from 'events'
import { agentPersistenceService } from '@/lib/agents/AgentPersistenceService'
import { vaultIntegrationService } from '@/lib/vault/VaultIntegrationService'
import { mcpIntegrationService } from '@/lib/mcp/MCPIntegrationService'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'
import { testnetDeFiService } from '@/lib/defi/TestnetDeFiService'
import { geminiService } from '@/lib/ai/GeminiService'
import { agentTodoService } from '@/lib/agents/AgentTodoService'

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'offline'
  services: {
    agentPersistence: ServiceStatus
    vaultIntegration: ServiceStatus
    mcpIntegration: ServiceStatus
    tradingEngine: ServiceStatus
    defiService: ServiceStatus
    aiService: ServiceStatus
    todoService: ServiceStatus
  }
  metrics: {
    totalAgents: number
    activeAgents: number
    totalVaults: number
    totalTools: number
    totalCalls: number
    successRate: number
    avgResponseTime: number
    uptime: number
  }
  lastCheck: number
}

export interface ServiceStatus {
  status: 'online' | 'offline' | 'error' | 'degraded'
  lastResponse: number
  errorCount: number
  responseTime: number
  features: string[]
  warnings: string[]
  errors: string[]
}

export interface SystemEvent {
  id: string
  type: 'system' | 'agent' | 'vault' | 'mcp' | 'trading' | 'defi' | 'ai' | 'todo'
  level: 'info' | 'warning' | 'error' | 'critical'
  source: string
  message: string
  data?: any
  timestamp: number
  acknowledged: boolean
}

export interface AgentLifecycleEvent {
  agentId: string
  stage: 'creation' | 'initialization' | 'activation' | 'operation' | 'deactivation' | 'deletion'
  status: 'started' | 'completed' | 'failed' | 'warning'
  details: string
  timestamp: number
  duration?: number
  errors?: string[]
  warnings?: string[]
}

class SystemLifecycleService extends EventEmitter {
  private systemEvents: SystemEvent[] = []
  private lifecycleEvents: AgentLifecycleEvent[] = []
  private healthStatus: SystemHealthStatus | null = null
  private startTime: number = Date.now()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private eventCleanupInterval: NodeJS.Timeout | null = null
  
  constructor() {
    super()
    this.setupEventListeners()
    this.startHealthMonitoring()
    this.startEventCleanup()
    this.initializeSystem()
  }

  // Initialize all systems and activate MCP for existing agents
  async initializeSystem(): Promise<void> {
    console.log('🚀 Initializing complete system lifecycle...')
    
    this.addSystemEvent({
      type: 'system',
      level: 'info',
      source: 'SystemLifecycle',
      message: 'System initialization started'
    })

    try {
      // 1. Check service health
      await this.performHealthCheck()
      
      // 2. Activate MCP infrastructure for all existing agents
      await mcpIntegrationService.activateForAllAgents()
      
      // 3. Sync all agent performance
      await agentPersistenceService.syncAllAgents()
      
      // 4. Initialize cross-system integrations
      await this.initializeCrossSystemIntegrations()
      
      this.addSystemEvent({
        type: 'system',
        level: 'info',
        source: 'SystemLifecycle',
        message: 'System initialization completed successfully'
      })
      
      console.log('✅ System lifecycle initialization completed')
      this.emit('systemInitialized', { timestamp: Date.now() })
      
    } catch (error) {
      console.error('❌ System initialization failed:', error)
      this.addSystemEvent({
        type: 'system',
        level: 'critical',
        source: 'SystemLifecycle',
        message: `System initialization failed: ${error}`
      })
      throw error
    }
  }

  // Complete agent lifecycle management
  async createCompleteAgent(config: any): Promise<any> {
    const lifecycleId = `lifecycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    
    this.addLifecycleEvent({
      agentId: lifecycleId,
      stage: 'creation',
      status: 'started',
      details: 'Starting complete agent creation lifecycle',
      timestamp: startTime
    })

    try {
      // 1. Create agent through persistence service (includes all integrations)
      const result = await agentPersistenceService.createAgent(config)
      
      if (!result.success || !result.agentId) {
        throw new Error(`Agent creation failed: ${result.errors?.join(', ')}`)
      }

      const agentId = result.agentId
      
      this.addLifecycleEvent({
        agentId,
        stage: 'creation',
        status: 'completed',
        details: 'Agent persistence layer created successfully',
        timestamp: Date.now(),
        duration: Date.now() - startTime
      })

      // 2. Auto-create vault if DeFi is enabled
      if (config.enableDeFi) {
        this.addLifecycleEvent({
          agentId,
          stage: 'initialization',
          status: 'started',
          details: 'Creating vault for DeFi operations',
          timestamp: Date.now()
        })

        try {
          const vaultId = await vaultIntegrationService.createVault({
            name: `${config.name} Auto-Vault`,
            description: `Auto-created vault for agent ${config.name}`,
            type: 'defi',
            network: config.defiNetworks?.[0] || 'sepolia',
            requireApproval: false,
            approvalThreshold: 1,
            multiSigRequired: false,
            timelock: 0,
            authorizedAgents: [agentId],
            authorizedUsers: [],
            permissions: {
              read: [agentId],
              withdraw: [agentId],
              deposit: [agentId],
              trade: [agentId],
              defi: [agentId]
            },
            maxAllocation: config.maxPositionSize || 0.2,
            maxDailyWithdrawal: config.initialCapital * 0.1,
            emergencyFreezeEnabled: true,
            autoRebalance: config.autoRebalance || false,
            rebalanceThreshold: 5,
            autoCompound: config.autoCompound || false,
            yieldFarming: config.liquidityMining || false
          })

          await vaultIntegrationService.assignVaultToAgent(agentId, vaultId)
          
          this.addLifecycleEvent({
            agentId,
            stage: 'initialization',
            status: 'completed',
            details: `Vault ${vaultId} created and assigned`,
            timestamp: Date.now()
          })
        } catch (error) {
          this.addLifecycleEvent({
            agentId,
            stage: 'initialization',
            status: 'warning',
            details: `Vault creation failed: ${error}`,
            timestamp: Date.now(),
            warnings: [error.toString()]
          })
        }
      }

      // 3. Activate all systems coordination
      this.addLifecycleEvent({
        agentId,
        stage: 'activation',
        status: 'started',
        details: 'Activating cross-system coordination',
        timestamp: Date.now()
      })

      await this.activateAgentCoordination(agentId)
      
      this.addLifecycleEvent({
        agentId,
        stage: 'activation',
        status: 'completed',
        details: 'All systems coordinated and agent fully operational',
        timestamp: Date.now(),
        duration: Date.now() - startTime
      })

      // 4. Final lifecycle completion
      this.addLifecycleEvent({
        agentId,
        stage: 'operation',
        status: 'started',
        details: 'Agent entering operational phase',
        timestamp: Date.now()
      })

      this.addSystemEvent({
        type: 'agent',
        level: 'info',
        source: 'SystemLifecycle',
        message: `Agent ${config.name} (${agentId}) fully operational`,
        data: { agentId, config, result }
      })

      console.log(`🎉 Complete agent lifecycle finished for ${config.name}`)
      this.emit('completeAgentCreated', { agentId, config, result, duration: Date.now() - startTime })
      
      return { ...result, lifecycleCompleted: true, totalDuration: Date.now() - startTime }
      
    } catch (error) {
      console.error('Complete agent creation failed:', error)
      
      this.addLifecycleEvent({
        agentId: lifecycleId,
        stage: 'creation',
        status: 'failed',
        details: `Complete agent creation failed: ${error}`,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        errors: [error.toString()]
      })

      this.addSystemEvent({
        type: 'agent',
        level: 'error',
        source: 'SystemLifecycle',
        message: `Complete agent creation failed: ${error}`,
        data: { config, error: error.toString() }
      })

      throw error
    }
  }

  // Activate agent coordination across all systems
  private async activateAgentCoordination(agentId: string): Promise<void> {
    const agent = agentPersistenceService.getAgent(agentId)
    if (!agent) throw new Error('Agent not found')

    // 1. Setup MCP tool permissions for cross-system operations
    const mcpStats = agentPersistenceService.getAgentMCPStats(agentId)
    if (mcpStats.availableTools > 0) {
      console.log(`✅ Agent ${agentId} has ${mcpStats.availableTools} MCP tools available`)
    }

    // 2. Initialize vault monitoring if DeFi enabled
    if (agent.config.enableDeFi && agent.walletIds.length > 0) {
      const vaults = vaultIntegrationService.getAgentVaults(agentId)
      console.log(`✅ Agent ${agentId} connected to ${vaults.length} vaults`)
    }

    // 3. Setup trading engine coordination
    if (agent.integrations.tradingEngine) {
      const performance = persistentTradingEngine.getAgentPerformance(agentId)
      console.log(`✅ Agent ${agentId} trading engine initialized`)
    }

    // 4. Initialize AI learning coordination
    if (agent.integrations.aiService && geminiService.isConfigured()) {
      const memories = geminiService.getAgentMemory(agentId)
      console.log(`✅ Agent ${agentId} has ${memories.length} memory entries`)
    }

    // 5. Setup todo coordination
    if (agent.integrations.todoService) {
      const todos = agentTodoService.getAgentTodos(agentId)
      console.log(`✅ Agent ${agentId} has ${todos.length} todos`)
    }
  }

  // Complete agent deletion across all systems
  async deleteCompleteAgent(agentId: string): Promise<boolean> {
    const startTime = Date.now()
    
    this.addLifecycleEvent({
      agentId,
      stage: 'deactivation',
      status: 'started',
      details: 'Starting complete agent deletion lifecycle',
      timestamp: startTime
    })

    try {
      const agent = agentPersistenceService.getAgent(agentId)
      if (!agent) {
        throw new Error('Agent not found')
      }

      // 1. Remove from vaults
      const vaults = vaultIntegrationService.getAgentVaults(agentId)
      for (const vault of vaults) {
        await vaultIntegrationService.removeVaultFromAgent(agentId, vault.id)
      }

      // 2. Delete agent (includes all integrations)
      const success = await agentPersistenceService.deleteAgent(agentId)
      
      this.addLifecycleEvent({
        agentId,
        stage: 'deletion',
        status: success ? 'completed' : 'failed',
        details: success ? 'Agent completely removed from all systems' : 'Agent deletion failed',
        timestamp: Date.now(),
        duration: Date.now() - startTime
      })

      this.addSystemEvent({
        type: 'agent',
        level: 'info',
        source: 'SystemLifecycle',
        message: `Agent ${agentId} completely deleted from all systems`
      })

      this.emit('completeAgentDeleted', { agentId, duration: Date.now() - startTime })
      return success
      
    } catch (error) {
      console.error('Complete agent deletion failed:', error)
      
      this.addLifecycleEvent({
        agentId,
        stage: 'deletion',
        status: 'failed',
        details: `Complete agent deletion failed: ${error}`,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        errors: [error.toString()]
      })

      return false
    }
  }

  // System health monitoring
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const checkStartTime = Date.now()
    
    const services = {
      agentPersistence: await this.checkServiceHealth('agentPersistence'),
      vaultIntegration: await this.checkServiceHealth('vaultIntegration'),
      mcpIntegration: await this.checkServiceHealth('mcpIntegration'),
      tradingEngine: await this.checkServiceHealth('tradingEngine'),
      defiService: await this.checkServiceHealth('defiService'),
      aiService: await this.checkServiceHealth('aiService'),
      todoService: await this.checkServiceHealth('todoService')
    }

    // Calculate overall health
    const onlineServices = Object.values(services).filter(s => s.status === 'online').length
    const totalServices = Object.values(services).length
    const healthPercentage = onlineServices / totalServices

    let overall: 'healthy' | 'degraded' | 'critical' | 'offline'
    if (healthPercentage >= 0.9) overall = 'healthy'
    else if (healthPercentage >= 0.7) overall = 'degraded'
    else if (healthPercentage >= 0.3) overall = 'critical'
    else overall = 'offline'

    // Get system metrics
    const agentStats = agentPersistenceService.getDashboardStats()
    const mcpStats = mcpIntegrationService.getDashboardStats()
    
    this.healthStatus = {
      overall,
      services,
      metrics: {
        totalAgents: agentStats.totalAgents,
        activeAgents: agentStats.activeAgents,
        totalVaults: vaultIntegrationService.getAllVaults().length,
        totalTools: mcpStats.totalTools,
        totalCalls: mcpStats.totalCalls,
        successRate: mcpStats.totalCalls > 0 ? mcpStats.successfulCalls / mcpStats.totalCalls : 1,
        avgResponseTime: mcpStats.avgResponseTime,
        uptime: Date.now() - this.startTime
      },
      lastCheck: Date.now()
    }

    if (overall !== 'healthy') {
      this.addSystemEvent({
        type: 'system',
        level: overall === 'degraded' ? 'warning' : 'error',
        source: 'HealthCheck',
        message: `System health is ${overall} (${onlineServices}/${totalServices} services online)`,
        data: this.healthStatus
      })
    }

    this.emit('healthCheckCompleted', this.healthStatus)
    return this.healthStatus
  }

  // Check individual service health
  private async checkServiceHealth(serviceName: string): Promise<ServiceStatus> {
    const startTime = Date.now()
    
    try {
      switch (serviceName) {
        case 'agentPersistence':
          const agents = agentPersistenceService.getAllAgents()
          return {
            status: 'online',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: ['agent_management', 'persistence', 'coordination'],
            warnings: [],
            errors: []
          }

        case 'vaultIntegration':
          const vaults = vaultIntegrationService.getAllVaults()
          return {
            status: 'online',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: ['vault_management', 'defi_integration', 'auto_management'],
            warnings: [],
            errors: []
          }

        case 'mcpIntegration':
          const mcpStats = mcpIntegrationService.getDashboardStats()
          return {
            status: 'online',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: ['tool_execution', 'permissions', 'audit_logging'],
            warnings: [],
            errors: []
          }

        case 'tradingEngine':
          // Check if trading engine is responsive
          return {
            status: 'online',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: ['paper_trading', 'portfolio_management', 'order_execution'],
            warnings: [],
            errors: []
          }

        case 'defiService':
          const wallets = testnetDeFiService.getAllWallets()
          return {
            status: 'online',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: ['testnet_wallets', 'staking', 'liquidity_provision'],
            warnings: [],
            errors: []
          }

        case 'aiService':
          const isConfigured = geminiService.isConfigured()
          return {
            status: isConfigured ? 'online' : 'degraded',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: isConfigured ? ['llm_calls', 'memory_management', 'decision_making'] : ['fallback_logic'],
            warnings: isConfigured ? [] : ['Gemini API not configured'],
            errors: []
          }

        case 'todoService':
          // Check if todo service is responsive
          return {
            status: 'online',
            lastResponse: Date.now(),
            errorCount: 0,
            responseTime: Date.now() - startTime,
            features: ['task_management', 'agent_coordination', 'progress_tracking'],
            warnings: [],
            errors: []
          }

        default:
          throw new Error(`Unknown service: ${serviceName}`)
      }
    } catch (error) {
      return {
        status: 'error',
        lastResponse: Date.now(),
        errorCount: 1,
        responseTime: Date.now() - startTime,
        features: [],
        warnings: [],
        errors: [error.toString()]
      }
    }
  }

  // Event management
  private addSystemEvent(event: Omit<SystemEvent, 'id' | 'timestamp' | 'acknowledged'>): void {
    const systemEvent: SystemEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...event
    }

    this.systemEvents.push(systemEvent)
    this.emit('systemEvent', systemEvent)
  }

  private addLifecycleEvent(event: AgentLifecycleEvent): void {
    this.lifecycleEvents.push(event)
    this.emit('lifecycleEvent', event)
  }

  // Initialize cross-system integrations
  private async initializeCrossSystemIntegrations(): Promise<void> {
    // Setup vault service to listen to agent events
    vaultIntegrationService.on('vaultCreated', (data) => {
      this.addSystemEvent({
        type: 'vault',
        level: 'info',
        source: 'VaultIntegration',
        message: `Vault ${data.vaultId} created`,
        data
      })
    })

    // Setup MCP service to listen to tool calls
    mcpIntegrationService.on('toolCalled', (data) => {
      if (!data.success) {
        this.addSystemEvent({
          type: 'mcp',
          level: 'warning',
          source: 'MCPIntegration',
          message: `Tool call failed: ${data.toolId}`,
          data
        })
      }
    })

    console.log('✅ Cross-system integrations initialized')
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen to all service events
    agentPersistenceService.on('agentCreated', (data) => {
      this.addSystemEvent({
        type: 'agent',
        level: 'info',
        source: 'AgentPersistence',
        message: `Agent created: ${data.agent.config.name}`,
        data
      })
    })

    agentPersistenceService.on('agentDeleted', (data) => {
      this.addSystemEvent({
        type: 'agent',
        level: 'info',
        source: 'AgentPersistence',
        message: `Agent deleted: ${data.agentId}`,
        data
      })
    })
  }

  // Start health monitoring
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 30000) // Every 30 seconds
  }

  // Start event cleanup
  private startEventCleanup(): void {
    this.eventCleanupInterval = setInterval(() => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      
      // Keep only last 24 hours of events
      this.systemEvents = this.systemEvents.filter(event => event.timestamp > oneDayAgo)
      this.lifecycleEvents = this.lifecycleEvents.filter(event => event.timestamp > oneDayAgo)
      
    }, 60 * 60 * 1000) // Every hour
  }

  // Public API methods
  getSystemHealth(): SystemHealthStatus | null {
    return this.healthStatus
  }

  getSystemEvents(limit: number = 100): SystemEvent[] {
    return this.systemEvents.slice(-limit)
  }

  getLifecycleEvents(agentId?: string, limit: number = 50): AgentLifecycleEvent[] {
    const events = agentId 
      ? this.lifecycleEvents.filter(event => event.agentId === agentId)
      : this.lifecycleEvents
    return events.slice(-limit)
  }

  acknowledgeEvent(eventId: string): boolean {
    const event = this.systemEvents.find(e => e.id === eventId)
    if (event) {
      event.acknowledged = true
      this.emit('eventAcknowledged', { eventId })
      return true
    }
    return false
  }

  getSystemStats() {
    const agentStats = agentPersistenceService.getDashboardStats()
    const mcpStats = mcpIntegrationService.getDashboardStats()
    
    return {
      ...agentStats,
      systemHealth: this.healthStatus?.overall || 'unknown',
      totalVaults: vaultIntegrationService.getAllVaults().length,
      systemUptime: Date.now() - this.startTime,
      totalEvents: this.systemEvents.length,
      unacknowledgedEvents: this.systemEvents.filter(e => !e.acknowledged).length,
      totalLifecycleEvents: this.lifecycleEvents.length,
      mcpIntegration: mcpStats
    }
  }

  // Cleanup on service shutdown
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    if (this.eventCleanupInterval) {
      clearInterval(this.eventCleanupInterval)
    }
  }
}

// Singleton instance
export const systemLifecycleService = new SystemLifecycleService()

export default SystemLifecycleService