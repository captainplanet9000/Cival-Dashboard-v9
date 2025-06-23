/**
 * MCP Integration Service
 * Comprehensive Model Context Protocol infrastructure for all agents
 */

import { EventEmitter } from 'events'
import { agentPersistenceService } from '@/lib/agents/AgentPersistenceService'
import { vaultIntegrationService } from '@/lib/vault/VaultIntegrationService'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'
import { testnetDeFiService } from '@/lib/defi/TestnetDeFiService'
import { geminiService } from '@/lib/ai/GeminiService'
import { agentTodoService } from '@/lib/agents/AgentTodoService'

export interface MCPTool {
  id: string
  name: string
  description: string
  category: 'trading' | 'defi' | 'analysis' | 'system' | 'communication' | 'data'
  version: string
  permissions: string[]
  parameters: MCPParameter[]
  enabled: boolean
  usage: {
    totalCalls: number
    lastUsed: number
    successRate: number
    avgResponseTime: number
  }
}

export interface MCPParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  default?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: string[]
  }
}

export interface MCPServerConfig {
  id: string
  name: string
  url: string
  version: string
  status: 'connected' | 'disconnected' | 'error' | 'initializing'
  capabilities: string[]
  tools: string[]
  lastHeartbeat: number
  metadata: Record<string, any>
}

export interface MCPAgentPermissions {
  agentId: string
  allowedTools: string[]
  allowedCategories: string[]
  restrictions: {
    maxCallsPerMinute: number
    maxCallsPerDay: number
    requireApproval: string[]
    blockedTools: string[]
  }
  audit: {
    enabled: boolean
    logLevel: 'minimal' | 'detailed' | 'verbose'
    retentionDays: number
  }
}

export interface MCPCallLog {
  id: string
  agentId: string
  toolId: string
  parameters: Record<string, any>
  response: any
  success: boolean
  error?: string
  timestamp: number
  duration: number
  context: {
    sessionId: string
    requestId: string
    userContext?: string
  }
}

export interface MCPSession {
  id: string
  agentId: string
  startTime: number
  endTime?: number
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  tools: string[]
  context: Record<string, any>
  status: 'active' | 'completed' | 'error' | 'timeout'
}

class MCPIntegrationService extends EventEmitter {
  private servers: Map<string, MCPServerConfig> = new Map()
  private tools: Map<string, MCPTool> = new Map()
  private agentPermissions: Map<string, MCPAgentPermissions> = new Map()
  private callLogs: MCPCallLog[] = []
  private sessions: Map<string, MCPSession> = new Map()
  private rateLimits: Map<string, { count: number, resetTime: number }> = new Map()
  
  constructor() {
    super()
    this.initializeDefaultTools()
    this.setupEventListeners()
    this.startHeartbeat()
    this.loadPersistedData()
  }

  // Initialize all agents with MCP infrastructure
  async activateForAllAgents(): Promise<void> {
    console.log('🚀 Activating MCP infrastructure for all agents...')
    
    const agents = agentPersistenceService.getAllAgents()
    const results = []
    
    for (const agent of agents) {
      try {
        const result = await this.activateForAgent(agent.id)
        results.push({ agentId: agent.id, success: result.success, errors: result.errors })
        
        if (result.success) {
          console.log(`✅ MCP activated for agent: ${agent.config.name}`)
        } else {
          console.error(`❌ MCP activation failed for agent: ${agent.config.name}`, result.errors)
        }
      } catch (error) {
        console.error(`💥 Critical error activating MCP for agent ${agent.id}:`, error)
        results.push({ agentId: agent.id, success: false, errors: [`Critical error: ${error}`] })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`🎉 MCP infrastructure activated for ${successCount}/${agents.length} agents`)
    
    this.emit('mcpActivatedForAll', { 
      totalAgents: agents.length, 
      successCount, 
      results 
    })
  }

  // Activate MCP for a specific agent
  async activateForAgent(agentId: string): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const agent = agentPersistenceService.getAgent(agentId)
      if (!agent) {
        return { success: false, errors: ['Agent not found'] }
      }

      // 1. Setup agent permissions based on agent config
      const permissions = this.createAgentPermissions(agent)
      this.agentPermissions.set(agentId, permissions)

      // 2. Create MCP session for agent
      const session = this.createSession(agentId)
      this.sessions.set(session.id, session)

      // 3. Register agent-specific tools based on capabilities
      await this.registerAgentTools(agentId, agent.config)

      // 4. Initialize tool contexts
      await this.initializeToolContexts(agentId)

      // 5. Update agent integration status
      const agentUpdate = agentPersistenceService.getAgent(agentId)
      if (agentUpdate) {
        agentUpdate.integrations.mcpTools = true
        agentPersistenceService['agents'].set(agentId, agentUpdate)
      }

      this.persistData()
      this.emit('mcpActivatedForAgent', { agentId, session, permissions })
      
      return { success: true }
    } catch (error) {
      console.error('MCP activation failed:', error)
      return { success: false, errors: [`Activation failed: ${error}`] }
    }
  }

  // Execute MCP tool call for agent
  async callTool(
    agentId: string, 
    toolId: string, 
    parameters: Record<string, any>,
    context?: Record<string, any>
  ): Promise<any> {
    const startTime = Date.now()
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // 1. Validate agent permissions
      const permissions = this.agentPermissions.get(agentId)
      if (!permissions) {
        throw new Error('Agent not registered for MCP')
      }

      // 2. Check tool permissions
      if (!this.hasToolPermission(agentId, toolId)) {
        throw new Error('Agent does not have permission for this tool')
      }

      // 3. Check rate limits
      if (!this.checkRateLimit(agentId, toolId)) {
        throw new Error('Rate limit exceeded')
      }

      // 4. Get tool definition
      const tool = this.tools.get(toolId)
      if (!tool || !tool.enabled) {
        throw new Error(`Tool not found or disabled: ${toolId}`)
      }

      // 5. Validate parameters
      this.validateParameters(tool, parameters)

      // 6. Execute tool
      const response = await this.executeTool(tool, parameters, { agentId, ...context })

      // 7. Log successful call
      const callLog: MCPCallLog = {
        id: callId,
        agentId,
        toolId,
        parameters,
        response,
        success: true,
        timestamp: startTime,
        duration: Date.now() - startTime,
        context: {
          sessionId: this.getActiveSessionId(agentId),
          requestId: callId,
          userContext: context?.userContext
        }
      }

      this.logCall(callLog)
      this.updateToolUsage(toolId, true, Date.now() - startTime)
      
      return response
    } catch (error) {
      // Log failed call
      const callLog: MCPCallLog = {
        id: callId,
        agentId,
        toolId,
        parameters,
        response: null,
        success: false,
        error: error.toString(),
        timestamp: startTime,
        duration: Date.now() - startTime,
        context: {
          sessionId: this.getActiveSessionId(agentId),
          requestId: callId,
          userContext: context?.userContext
        }
      }

      this.logCall(callLog)
      this.updateToolUsage(toolId, false, Date.now() - startTime)
      
      throw error
    }
  }

  // Get available tools for agent
  getAvailableTools(agentId: string): MCPTool[] {
    const permissions = this.agentPermissions.get(agentId)
    if (!permissions) return []

    return Array.from(this.tools.values()).filter(tool => 
      tool.enabled && 
      (permissions.allowedTools.includes(tool.id) || 
       permissions.allowedCategories.includes(tool.category)) &&
      !permissions.restrictions.blockedTools.includes(tool.id)
    )
  }

  // Get agent session statistics
  getAgentStats(agentId: string) {
    const calls = this.callLogs.filter(log => log.agentId === agentId)
    const sessions = Array.from(this.sessions.values()).filter(s => s.agentId === agentId)
    const permissions = this.agentPermissions.get(agentId)

    return {
      totalCalls: calls.length,
      successfulCalls: calls.filter(c => c.success).length,
      failedCalls: calls.filter(c => !c.success).length,
      successRate: calls.length > 0 ? calls.filter(c => c.success).length / calls.length : 0,
      avgResponseTime: calls.length > 0 ? calls.reduce((sum, c) => sum + c.duration, 0) / calls.length : 0,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      availableTools: this.getAvailableTools(agentId).length,
      permissions,
      recentCalls: calls.slice(-10)
    }
  }

  // Private helper methods
  private initializeDefaultTools(): void {
    // Trading Tools
    this.tools.set('trading.place_order', {
      id: 'trading.place_order',
      name: 'Place Trading Order',
      description: 'Execute a trading order through the paper trading engine',
      category: 'trading',
      version: '1.0.0',
      permissions: ['trading.execute'],
      parameters: [
        { name: 'symbol', type: 'string', description: 'Trading pair symbol', required: true },
        { name: 'side', type: 'string', description: 'Order side (buy/sell)', required: true, validation: { enum: ['buy', 'sell'] } },
        { name: 'amount', type: 'number', description: 'Order amount', required: true, validation: { min: 0 } },
        { name: 'type', type: 'string', description: 'Order type', required: false, validation: { enum: ['market', 'limit'] } },
        { name: 'price', type: 'number', description: 'Limit price (for limit orders)', required: false }
      ],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })

    this.tools.set('trading.get_portfolio', {
      id: 'trading.get_portfolio',
      name: 'Get Portfolio Status',
      description: 'Retrieve current portfolio status and positions',
      category: 'trading',
      version: '1.0.0',
      permissions: ['trading.read'],
      parameters: [],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })

    // DeFi Tools
    this.tools.set('defi.stake_tokens', {
      id: 'defi.stake_tokens',
      name: 'Stake Tokens',
      description: 'Stake tokens to DeFi protocols',
      category: 'defi',
      version: '1.0.0',
      permissions: ['defi.execute'],
      parameters: [
        { name: 'protocol', type: 'string', description: 'DeFi protocol name', required: true },
        { name: 'token', type: 'string', description: 'Token to stake', required: true },
        { name: 'amount', type: 'string', description: 'Amount to stake', required: true }
      ],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })

    // Analysis Tools
    this.tools.set('analysis.market_sentiment', {
      id: 'analysis.market_sentiment',
      name: 'Analyze Market Sentiment',
      description: 'Get market sentiment analysis using AI',
      category: 'analysis',
      version: '1.0.0',
      permissions: ['analysis.read'],
      parameters: [
        { name: 'symbol', type: 'string', description: 'Asset symbol to analyze', required: true },
        { name: 'timeframe', type: 'string', description: 'Analysis timeframe', required: false, validation: { enum: ['1h', '4h', '1d', '1w'] } }
      ],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })

    // System Tools
    this.tools.set('system.create_todo', {
      id: 'system.create_todo',
      name: 'Create Todo Item',
      description: 'Create a new todo item for the agent',
      category: 'system',
      version: '1.0.0',
      permissions: ['system.write'],
      parameters: [
        { name: 'title', type: 'string', description: 'Todo title', required: true },
        { name: 'description', type: 'string', description: 'Todo description', required: false },
        { name: 'priority', type: 'string', description: 'Todo priority', required: false, validation: { enum: ['low', 'medium', 'high'] } }
      ],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })

    // Communication Tools
    this.tools.set('communication.agent_message', {
      id: 'communication.agent_message',
      name: 'Send Agent Message',
      description: 'Send a message to another agent',
      category: 'communication',
      version: '1.0.0',
      permissions: ['communication.send'],
      parameters: [
        { name: 'targetAgentId', type: 'string', description: 'Target agent ID', required: true },
        { name: 'message', type: 'string', description: 'Message content', required: true },
        { name: 'priority', type: 'string', description: 'Message priority', required: false, validation: { enum: ['low', 'medium', 'high'] } }
      ],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })

    // Data Tools
    this.tools.set('data.store_memory', {
      id: 'data.store_memory',
      name: 'Store Memory',
      description: 'Store information in agent memory',
      category: 'data',
      version: '1.0.0',
      permissions: ['data.write'],
      parameters: [
        { name: 'type', type: 'string', description: 'Memory type', required: true, validation: { enum: ['learning', 'observation', 'decision', 'insight'] } },
        { name: 'content', type: 'string', description: 'Memory content', required: true },
        { name: 'importance', type: 'number', description: 'Importance score (0-1)', required: false, validation: { min: 0, max: 1 } }
      ],
      enabled: true,
      usage: { totalCalls: 0, lastUsed: 0, successRate: 0, avgResponseTime: 0 }
    })
  }

  private createAgentPermissions(agent: any): MCPAgentPermissions {
    // Create permissions based on agent type and configuration
    const basePermissions = ['trading.read', 'analysis.read', 'system.write', 'data.write']
    const agentTypePermissions = {
      'momentum': [...basePermissions, 'trading.execute'],
      'mean_reversion': [...basePermissions, 'trading.execute'],
      'arbitrage': [...basePermissions, 'trading.execute', 'communication.send'],
      'risk_manager': [...basePermissions, 'communication.send'],
      'coordinator': [...basePermissions, 'communication.send']
    }

    const allowedTools = this.getToolsForPermissions(agentTypePermissions[agent.config.type] || basePermissions)
    const allowedCategories = agent.config.enableDeFi ? ['trading', 'analysis', 'system', 'data', 'defi'] : ['trading', 'analysis', 'system', 'data']

    return {
      agentId: agent.id,
      allowedTools,
      allowedCategories,
      restrictions: {
        maxCallsPerMinute: agent.config.type === 'arbitrage' ? 100 : 60,
        maxCallsPerDay: agent.config.type === 'risk_manager' ? 10000 : 5000,
        requireApproval: ['trading.place_order'], // Require approval for trading
        blockedTools: []
      },
      audit: {
        enabled: true,
        logLevel: 'detailed',
        retentionDays: 30
      }
    }
  }

  private getToolsForPermissions(permissions: string[]): string[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.permissions.some(perm => permissions.includes(perm)))
      .map(tool => tool.id)
  }

  private createSession(agentId: string): MCPSession {
    return {
      id: `session_${agentId}_${Date.now()}`,
      agentId,
      startTime: Date.now(),
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      tools: [],
      context: {},
      status: 'active'
    }
  }

  private async registerAgentTools(agentId: string, agentConfig: any): Promise<void> {
    // Register additional tools based on agent configuration
    if (agentConfig.enabledTools && agentConfig.enabledTools.length > 0) {
      console.log(`Registering custom tools for agent ${agentId}:`, agentConfig.enabledTools)
    }
  }

  private async initializeToolContexts(agentId: string): Promise<void> {
    // Initialize any tool-specific contexts for the agent
    console.log(`Initializing tool contexts for agent ${agentId}`)
  }

  private hasToolPermission(agentId: string, toolId: string): boolean {
    const permissions = this.agentPermissions.get(agentId)
    if (!permissions) return false

    return permissions.allowedTools.includes(toolId) || 
           permissions.restrictions.blockedTools.includes(toolId) === false
  }

  private checkRateLimit(agentId: string, toolId: string): boolean {
    const permissions = this.agentPermissions.get(agentId)
    if (!permissions) return false

    const key = `${agentId}:${toolId}`
    const now = Date.now()
    const limit = this.rateLimits.get(key)

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute window
      return true
    }

    if (limit.count >= permissions.restrictions.maxCallsPerMinute) {
      return false
    }

    limit.count++
    return true
  }

  private validateParameters(tool: MCPTool, parameters: Record<string, any>): void {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter missing: ${param.name}`)
      }

      if (param.name in parameters) {
        const value = parameters[param.name]
        
        // Type validation
        if (param.type === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number`)
        }

        // Range validation
        if (param.validation?.min !== undefined && value < param.validation.min) {
          throw new Error(`Parameter ${param.name} must be >= ${param.validation.min}`)
        }

        if (param.validation?.max !== undefined && value > param.validation.max) {
          throw new Error(`Parameter ${param.name} must be <= ${param.validation.max}`)
        }

        // Enum validation
        if (param.validation?.enum && !param.validation.enum.includes(value)) {
          throw new Error(`Parameter ${param.name} must be one of: ${param.validation.enum.join(', ')}`)
        }
      }
    }
  }

  private async executeTool(tool: MCPTool, parameters: Record<string, any>, context: any): Promise<any> {
    switch (tool.id) {
      case 'trading.place_order':
        return await this.executeTradeOrder(parameters, context)
      
      case 'trading.get_portfolio':
        return await this.getPortfolioStatus(context)
      
      case 'defi.stake_tokens':
        return await this.stakeTokens(parameters, context)
      
      case 'analysis.market_sentiment':
        return await this.analyzeMarketSentiment(parameters, context)
      
      case 'system.create_todo':
        return await this.createTodo(parameters, context)
      
      case 'communication.agent_message':
        return await this.sendAgentMessage(parameters, context)
      
      case 'data.store_memory':
        return await this.storeMemory(parameters, context)
      
      default:
        throw new Error(`Tool not implemented: ${tool.id}`)
    }
  }

  // Tool implementations
  private async executeTradeOrder(params: any, context: any): Promise<any> {
    const order = await persistentTradingEngine.placeOrder(
      context.agentId,
      params.symbol,
      params.side,
      params.amount,
      params.type || 'market',
      params.price
    )
    return { success: true, orderId: order.id, order }
  }

  private async getPortfolioStatus(context: any): Promise<any> {
    const performance = persistentTradingEngine.getAgentPerformance(context.agentId)
    const positions = persistentTradingEngine.getAgentPositions(context.agentId)
    return { performance, positions }
  }

  private async stakeTokens(params: any, context: any): Promise<any> {
    const agent = agentPersistenceService.getAgent(context.agentId)
    if (!agent || agent.walletIds.length === 0) {
      throw new Error('No DeFi wallets available for staking')
    }

    const position = await testnetDeFiService.stake(
      agent.walletIds[0],
      params.protocol,
      params.token,
      params.amount
    )
    return { success: true, position }
  }

  private async analyzeMarketSentiment(params: any, context: any): Promise<any> {
    if (geminiService.isConfigured()) {
      const prompt = `Analyze market sentiment for ${params.symbol} over ${params.timeframe || '1d'}. Provide a sentiment score between -1 (very bearish) and 1 (very bullish) with reasoning.`
      const response = await geminiService.generateResponse(prompt, context.agentId)
      return { symbol: params.symbol, sentiment: response, timestamp: Date.now() }
    } else {
      // Fallback mock sentiment
      return { 
        symbol: params.symbol, 
        sentiment: 'Neutral market sentiment (mock data)', 
        score: 0.1,
        timestamp: Date.now() 
      }
    }
  }

  private async createTodo(params: any, context: any): Promise<any> {
    const todo = await agentTodoService.createTodo(context.agentId, {
      title: params.title,
      description: params.description || '',
      priority: params.priority || 'medium',
      category: 'agent-generated',
      estimatedDuration: 1800000, // 30 minutes default
      tags: ['mcp-generated']
    })
    return { success: true, todoId: todo.id, todo }
  }

  private async sendAgentMessage(params: any, context: any): Promise<any> {
    // Store message in agent memory for coordination
    if (geminiService.isConfigured()) {
      const memory = {
        id: `msg_${Date.now()}`,
        agentId: params.targetAgentId,
        type: 'communication' as const,
        content: `Message from agent ${context.agentId}: ${params.message}`,
        context: { fromAgent: context.agentId, priority: params.priority },
        importance: params.priority === 'high' ? 0.8 : 0.5,
        timestamp: Date.now(),
        tags: ['inter-agent', 'communication', params.priority || 'medium']
      }
      
      geminiService['addToMemory'](params.targetAgentId, memory)
    }
    
    this.emit('agentMessage', {
      from: context.agentId,
      to: params.targetAgentId,
      message: params.message,
      priority: params.priority,
      timestamp: Date.now()
    })
    
    return { success: true, messageId: `msg_${Date.now()}` }
  }

  private async storeMemory(params: any, context: any): Promise<any> {
    if (geminiService.isConfigured()) {
      const memory = {
        id: `mem_${Date.now()}`,
        agentId: context.agentId,
        type: params.type,
        content: params.content,
        context: { source: 'mcp-tool' },
        importance: params.importance || 0.5,
        timestamp: Date.now(),
        tags: ['mcp-stored', params.type]
      }
      
      geminiService['addToMemory'](context.agentId, memory)
      return { success: true, memoryId: memory.id }
    }
    
    return { success: false, error: 'Gemini service not available' }
  }

  private getActiveSessionId(agentId: string): string {
    const sessions = Array.from(this.sessions.values()).filter(s => 
      s.agentId === agentId && s.status === 'active'
    )
    return sessions.length > 0 ? sessions[0].id : 'no-session'
  }

  private logCall(callLog: MCPCallLog): void {
    this.callLogs.push(callLog)
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.callLogs.length > 1000) {
      this.callLogs = this.callLogs.slice(-1000)
    }
    
    this.emit('toolCalled', callLog)
  }

  private updateToolUsage(toolId: string, success: boolean, duration: number): void {
    const tool = this.tools.get(toolId)
    if (tool) {
      tool.usage.totalCalls++
      tool.usage.lastUsed = Date.now()
      
      const successCount = tool.usage.totalCalls * tool.usage.successRate + (success ? 1 : 0)
      tool.usage.successRate = successCount / tool.usage.totalCalls
      
      const totalTime = tool.usage.avgResponseTime * (tool.usage.totalCalls - 1) + duration
      tool.usage.avgResponseTime = totalTime / tool.usage.totalCalls
    }
  }

  private setupEventListeners(): void {
    // Listen to agent events
    agentPersistenceService.on('agentCreated', async (data) => {
      await this.activateForAgent(data.agentId)
    })

    agentPersistenceService.on('agentDeleted', (data) => {
      this.deactivateForAgent(data.agentId)
    })
  }

  private deactivateForAgent(agentId: string): void {
    // Close active sessions
    const sessions = Array.from(this.sessions.values()).filter(s => s.agentId === agentId)
    sessions.forEach(session => {
      session.status = 'completed'
      session.endTime = Date.now()
    })

    // Remove permissions
    this.agentPermissions.delete(agentId)
    
    // Clean up rate limits
    for (const [key] of this.rateLimits.entries()) {
      if (key.startsWith(`${agentId}:`)) {
        this.rateLimits.delete(key)
      }
    }

    this.persistData()
    this.emit('mcpDeactivatedForAgent', { agentId })
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.performHealthCheck()
    }, 30000) // Every 30 seconds
  }

  private performHealthCheck(): void {
    // Update server status and emit health events
    for (const [serverId, server] of this.servers.entries()) {
      server.lastHeartbeat = Date.now()
      // In real implementation, this would ping the actual MCP server
    }

    this.emit('healthCheck', {
      timestamp: Date.now(),
      servers: Array.from(this.servers.values()),
      tools: Array.from(this.tools.values()).filter(t => t.enabled).length,
      activeAgents: this.agentPermissions.size
    })
  }

  private persistData(): void {
    try {
      const data = {
        servers: Object.fromEntries(this.servers),
        tools: Object.fromEntries(this.tools),
        agentPermissions: Object.fromEntries(this.agentPermissions),
        sessions: Object.fromEntries(this.sessions),
        callLogs: this.callLogs.slice(-100), // Keep last 100 logs
        version: '1.0.0',
        lastUpdate: Date.now()
      }
      localStorage.setItem('mcp_integration_service', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist MCP data:', error)
    }
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('mcp_integration_service')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.servers) {
          this.servers = new Map(Object.entries(data.servers))
        }
        
        if (data.agentPermissions) {
          this.agentPermissions = new Map(Object.entries(data.agentPermissions))
        }
        
        if (data.sessions) {
          this.sessions = new Map(Object.entries(data.sessions))
        }
        
        if (data.callLogs) {
          this.callLogs = data.callLogs
        }
        
        console.log('Loaded MCP integration data')
      }
    } catch (error) {
      console.error('Failed to load MCP integration data:', error)
    }
  }

  // Public API methods
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values())
  }

  getAgentPermissions(agentId: string): MCPAgentPermissions | null {
    return this.agentPermissions.get(agentId) || null
  }

  getCallLogs(agentId?: string): MCPCallLog[] {
    return agentId ? this.callLogs.filter(log => log.agentId === agentId) : this.callLogs
  }

  getDashboardStats() {
    const agents = Array.from(this.agentPermissions.keys())
    const tools = Array.from(this.tools.values())
    const sessions = Array.from(this.sessions.values())
    
    return {
      totalAgents: agents.length,
      totalTools: tools.length,
      enabledTools: tools.filter(t => t.enabled).length,
      totalCalls: this.callLogs.length,
      successfulCalls: this.callLogs.filter(l => l.success).length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalSessions: sessions.length,
      avgResponseTime: this.callLogs.length > 0 ? 
        this.callLogs.reduce((sum, log) => sum + log.duration, 0) / this.callLogs.length : 0,
      toolUsage: tools.map(t => ({
        toolId: t.id,
        name: t.name,
        category: t.category,
        usage: t.usage
      })).sort((a, b) => b.usage.totalCalls - a.usage.totalCalls)
    }
  }
}

// Singleton instance
export const mcpIntegrationService = new MCPIntegrationService()

export default MCPIntegrationService