/**
 * LangChain MCP Integration
 * Phase 5: Connects LangChain agents with MCP (Model Context Protocol) tools and services
 * Enables LangChain agents to use MCP tools for enhanced trading capabilities
 */

import { EventEmitter } from 'events'
import { langGraphOrchestrator, LangGraphAgent } from './LangGraphOrchestrator'
import { langChainService } from './LangChainService'
import { mcpIntegrationService, MCPTool, MCPCallLog } from '@/lib/mcp/MCPIntegrationService'
import { Tool } from '@langchain/core/tools'
import { z } from 'zod'

export interface LangChainMCPConfig {
  enableToolIntegration: boolean
  autoRegisterAgents: boolean
  toolCallTimeout: number
  maxToolCallsPerAgent: number
  enableToolChaining: boolean
  toolCallLogging: boolean
}

export interface MCPToolCall {
  toolId: string
  parameters: Record<string, any>
  agentId: string
  timestamp: number
  result?: any
  error?: string
  success: boolean
  duration: number
}

export interface AgentMCPSession {
  agentId: string
  sessionId: string
  startTime: number
  toolCalls: MCPToolCall[]
  status: 'active' | 'completed' | 'error'
}

/**
 * LangChain Tool wrapper for MCP tools
 * Allows LangChain agents to call MCP tools seamlessly
 */
class LangChainMCPTool extends Tool {
  name: string
  description: string
  private mcpTool: MCPTool
  private agentId: string
  private mcpIntegration: LangChainMCPIntegration

  constructor(mcpTool: MCPTool, agentId: string, mcpIntegration: LangChainMCPIntegration) {
    const schema = LangChainMCPTool.createZodSchema(mcpTool)
    super({ schema })
    
    this.name = mcpTool.name.replace(/\s+/g, '_').toLowerCase()
    this.description = mcpTool.description
    this.mcpTool = mcpTool
    this.agentId = agentId
    this.mcpIntegration = mcpIntegration
  }

  /**
   * Create Zod schema from MCP tool parameters
   */
  private static createZodSchema(mcpTool: MCPTool): z.ZodSchema {
    const schemaFields: Record<string, z.ZodTypeAny> = {}

    for (const param of mcpTool.parameters) {
      let zodType: z.ZodTypeAny

      switch (param.type) {
        case 'string':
          zodType = z.string()
          if (param.validation?.enum) {
            zodType = z.enum(param.validation.enum as [string, ...string[]])
          }
          break
        case 'number':
          zodType = z.number()
          if (param.validation?.min !== undefined) {
            zodType = zodType.min(param.validation.min)
          }
          if (param.validation?.max !== undefined) {
            zodType = zodType.max(param.validation.max)
          }
          break
        case 'boolean':
          zodType = z.boolean()
          break
        case 'object':
          zodType = z.object({}).passthrough()
          break
        case 'array':
          zodType = z.array(z.any())
          break
        default:
          zodType = z.any()
      }

      if (!param.required) {
        zodType = zodType.optional()
      }

      if (param.default !== undefined) {
        zodType = zodType.default(param.default)
      }

      schemaFields[param.name] = zodType
    }

    return z.object(schemaFields)
  }

  /**
   * Execute the MCP tool call
   */
  async _call(arg: Record<string, any>): Promise<string> {
    try {
      const result = await this.mcpIntegration.callMCPTool(
        this.agentId,
        this.mcpTool.id,
        arg
      )

      // Convert result to string for LangChain compatibility
      return typeof result === 'string' ? result : JSON.stringify(result)

    } catch (error) {
      console.error(`MCP tool call failed for ${this.mcpTool.id}:`, error)
      throw new Error(`Tool execution failed: ${error}`)
    }
  }
}

export class LangChainMCPIntegration extends EventEmitter {
  private config: LangChainMCPConfig
  private agentSessions: Map<string, AgentMCPSession> = new Map()
  private agentTools: Map<string, LangChainMCPTool[]> = new Map()
  private toolCallHistory: MCPToolCall[] = []
  private isInitialized: boolean = false

  constructor(config?: Partial<LangChainMCPConfig>) {
    super()
    
    this.config = {
      enableToolIntegration: true,
      autoRegisterAgents: true,
      toolCallTimeout: 30000, // 30 seconds
      maxToolCallsPerAgent: 1000,
      enableToolChaining: true,
      toolCallLogging: true,
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize the LangChain MCP integration
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing LangChain MCP Integration')

      // Set up event listeners
      this.setupEventListeners()

      // Register existing LangGraph agents with MCP
      if (this.config.autoRegisterAgents) {
        await this.registerAllLangGraphAgents()
      }

      this.isInitialized = true
      console.log('✅ LangChain MCP Integration initialized')

    } catch (error) {
      console.error('❌ Failed to initialize LangChain MCP Integration:', error)
      throw error
    }
  }

  /**
   * Register all LangGraph agents with MCP tools
   */
  async registerAllLangGraphAgents(): Promise<void> {
    const agents = langGraphOrchestrator.getAgents()

    for (const agent of agents) {
      await this.registerAgent(agent)
    }

    console.log(`📝 Registered ${agents.length} LangGraph agents with MCP`)
  }

  /**
   * Register individual LangGraph agent with MCP
   */
  async registerAgent(agent: LangGraphAgent): Promise<void> {
    try {
      console.log(`🤖 Registering LangGraph agent ${agent.name} with MCP`)

      // First activate agent in MCP system
      const activation = await mcpIntegrationService.activateForAgent(agent.id)
      if (!activation.success) {
        throw new Error(`MCP activation failed: ${activation.errors?.join(', ')}`)
      }

      // Create agent session
      const session: AgentMCPSession = {
        agentId: agent.id,
        sessionId: `langchain_${agent.id}_${Date.now()}`,
        startTime: Date.now(),
        toolCalls: [],
        status: 'active'
      }
      this.agentSessions.set(agent.id, session)

      // Get available MCP tools for this agent
      const availableTools = mcpIntegrationService.getAvailableTools(agent.id)
      
      // Create LangChain tool wrappers
      const langChainTools: LangChainMCPTool[] = availableTools.map(mcpTool =>
        new LangChainMCPTool(mcpTool, agent.id, this)
      )

      this.agentTools.set(agent.id, langChainTools)

      // Integrate tools with LangChain service (extend the agent's capabilities)
      await this.integrateLangChainTools(agent.id, langChainTools)

      this.emit('agentRegistered', {
        agentId: agent.id,
        agentName: agent.name,
        toolsCount: langChainTools.length,
        session
      })

      console.log(`✅ Agent ${agent.name} registered with ${langChainTools.length} MCP tools`)

    } catch (error) {
      console.error(`❌ Failed to register agent ${agent.id} with MCP:`, error)
      throw error
    }
  }

  /**
   * Integrate LangChain tools with the agent's workflow
   */
  private async integrateLangChainTools(agentId: string, tools: LangChainMCPTool[]): Promise<void> {
    // Store tools for agent and make them available for workflow execution
    console.log(`🔗 Integrating ${tools.length} tools for agent ${agentId}`)

    // The tools are now available via this.agentTools.get(agentId)
    // They can be used in LangGraph workflows by calling this.getAgentTools(agentId)
  }

  /**
   * Call MCP tool from LangChain agent
   */
  async callMCPTool(
    agentId: string,
    toolId: string,
    parameters: Record<string, any>,
    context?: Record<string, any>
  ): Promise<any> {
    const startTime = Date.now()

    try {
      // Check rate limits
      if (!this.checkAgentToolLimits(agentId)) {
        throw new Error('Agent has exceeded tool call limits')
      }

      // Call MCP service
      const result = await mcpIntegrationService.callTool(
        agentId,
        toolId,
        parameters,
        {
          ...context,
          source: 'langchain',
          timestamp: startTime
        }
      )

      // Log tool call
      const toolCall: MCPToolCall = {
        toolId,
        parameters,
        agentId,
        timestamp: startTime,
        result,
        success: true,
        duration: Date.now() - startTime
      }

      this.logToolCall(toolCall)
      this.emit('toolCallSuccess', toolCall)

      return result

    } catch (error) {
      // Log failed tool call
      const toolCall: MCPToolCall = {
        toolId,
        parameters,
        agentId,
        timestamp: startTime,
        error: error.toString(),
        success: false,
        duration: Date.now() - startTime
      }

      this.logToolCall(toolCall)
      this.emit('toolCallError', toolCall)

      throw error
    }
  }

  /**
   * Get available MCP tools for LangChain agent
   */
  getAgentTools(agentId: string): LangChainMCPTool[] {
    return this.agentTools.get(agentId) || []
  }

  /**
   * Execute tool chain for complex operations
   */
  async executeToolChain(
    agentId: string,
    toolChain: Array<{
      toolId: string
      parameters: Record<string, any>
      dependsOn?: string[]
    }>
  ): Promise<any[]> {
    if (!this.config.enableToolChaining) {
      throw new Error('Tool chaining is disabled')
    }

    const results: any[] = []
    const executionContext: Record<string, any> = {}

    for (const step of toolChain) {
      try {
        // Wait for dependencies
        if (step.dependsOn) {
          for (const dep of step.dependsOn) {
            if (!(dep in executionContext)) {
              throw new Error(`Dependency ${dep} not satisfied`)
            }
          }
        }

        // Execute tool with context from previous steps
        const result = await this.callMCPTool(
          agentId,
          step.toolId,
          step.parameters,
          { executionContext }
        )

        results.push(result)
        executionContext[step.toolId] = result

      } catch (error) {
        console.error(`Tool chain execution failed at step ${step.toolId}:`, error)
        throw error
      }
    }

    return results
  }

  /**
   * Generate LangChain prompt with available tools
   */
  generateToolAwarePrompt(agentId: string, basePrompt: string): string {
    const tools = this.getAgentTools(agentId)
    
    if (tools.length === 0) {
      return basePrompt
    }

    const toolDescriptions = tools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n')

    return `${basePrompt}

Available Tools:
${toolDescriptions}

You can use these tools by calling them with appropriate parameters. Each tool will help you gather information or execute actions to provide better trading analysis and decisions.`
  }

  /**
   * Enhanced agent analysis with MCP tools
   */
  async enhancedAgentAnalysis(
    agentId: string,
    symbol: string,
    analysisType: 'market' | 'risk' | 'sentiment' | 'technical'
  ): Promise<any> {
    const tools = this.getAgentTools(agentId)
    const relevantTools = tools.filter(tool => 
      tool.mcpTool.category === 'analysis' || 
      tool.mcpTool.category === 'trading'
    )

    if (relevantTools.length === 0) {
      throw new Error('No analysis tools available for agent')
    }

    const analysisResults: any = {}

    try {
      // Get portfolio status
      const portfolioTool = relevantTools.find(t => t.mcpTool.id === 'trading.get_portfolio')
      if (portfolioTool) {
        analysisResults.portfolio = await this.callMCPTool(
          agentId,
          'trading.get_portfolio',
          {}
        )
      }

      // Get market sentiment if available
      const sentimentTool = relevantTools.find(t => t.mcpTool.id === 'analysis.market_sentiment')
      if (sentimentTool && (analysisType === 'sentiment' || analysisType === 'market')) {
        analysisResults.sentiment = await this.callMCPTool(
          agentId,
          'analysis.market_sentiment',
          { symbol, timeframe: '1h' }
        )
      }

      // Store analysis in memory
      const memoryTool = relevantTools.find(t => t.mcpTool.id === 'data.store_memory')
      if (memoryTool) {
        await this.callMCPTool(
          agentId,
          'data.store_memory',
          {
            type: 'analysis',
            content: `${analysisType} analysis for ${symbol}: ${JSON.stringify(analysisResults)}`,
            importance: 0.7
          }
        )
      }

      return {
        success: true,
        analysisType,
        symbol,
        results: analysisResults,
        timestamp: Date.now(),
        toolsUsed: Object.keys(analysisResults)
      }

    } catch (error) {
      console.error('Enhanced analysis failed:', error)
      return {
        success: false,
        error: error.toString(),
        analysisType,
        symbol,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to LangGraph orchestrator events
    langGraphOrchestrator.on('agent:added', async (data) => {
      if (this.config.autoRegisterAgents) {
        await this.registerAgent(data.agent)
      }
    })

    langGraphOrchestrator.on('agent:removed', (data) => {
      this.unregisterAgent(data.agentId)
    })

    // Listen to MCP events
    mcpIntegrationService.on('toolCalled', (callLog: MCPCallLog) => {
      if (callLog.context?.source === 'langchain') {
        this.emit('mcpToolCalled', callLog)
      }
    })
  }

  /**
   * Unregister agent from MCP integration
   */
  private unregisterAgent(agentId: string): void {
    // Close agent session
    const session = this.agentSessions.get(agentId)
    if (session) {
      session.status = 'completed'
      session.toolCalls = this.toolCallHistory.filter(call => call.agentId === agentId)
    }

    // Remove agent tools
    this.agentTools.delete(agentId)
    this.agentSessions.delete(agentId)

    this.emit('agentUnregistered', { agentId })
  }

  /**
   * Check agent tool call limits
   */
  private checkAgentToolLimits(agentId: string): boolean {
    const agentCalls = this.toolCallHistory.filter(call => 
      call.agentId === agentId &&
      call.timestamp > Date.now() - 86400000 // Last 24 hours
    )

    return agentCalls.length < this.config.maxToolCallsPerAgent
  }

  /**
   * Log tool call
   */
  private logToolCall(toolCall: MCPToolCall): void {
    if (!this.config.toolCallLogging) return

    this.toolCallHistory.push(toolCall)

    // Add to agent session
    const session = this.agentSessions.get(toolCall.agentId)
    if (session) {
      session.toolCalls.push(toolCall)
    }

    // Keep history manageable
    if (this.toolCallHistory.length > 1000) {
      this.toolCallHistory = this.toolCallHistory.slice(-1000)
    }
  }

  /**
   * Get agent MCP statistics
   */
  getAgentMCPStats(agentId: string): {
    session: AgentMCPSession | null
    toolsAvailable: number
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    avgResponseTime: number
    recentCalls: MCPToolCall[]
    mcpStats: any
  } {
    const session = this.agentSessions.get(agentId)
    const tools = this.getAgentTools(agentId)
    const calls = this.toolCallHistory.filter(call => call.agentId === agentId)
    const mcpStats = mcpIntegrationService.getAgentStats(agentId)

    return {
      session: session || null,
      toolsAvailable: tools.length,
      totalCalls: calls.length,
      successfulCalls: calls.filter(c => c.success).length,
      failedCalls: calls.filter(c => !c.success).length,
      avgResponseTime: calls.length > 0 ? calls.reduce((sum, c) => sum + c.duration, 0) / calls.length : 0,
      recentCalls: calls.slice(-10),
      mcpStats
    }
  }

  /**
   * Get integration statistics
   */
  getIntegrationStats(): {
    totalAgents: number
    totalTools: number
    totalCalls: number
    successRate: number
    avgResponseTime: number
    activeSessions: number
    mcpStats: any
  } {
    const mcpStats = mcpIntegrationService.getDashboardStats()

    return {
      totalAgents: this.agentSessions.size,
      totalTools: Array.from(this.agentTools.values()).reduce((sum, tools) => sum + tools.length, 0),
      totalCalls: this.toolCallHistory.length,
      successRate: this.toolCallHistory.length > 0 ? 
        this.toolCallHistory.filter(c => c.success).length / this.toolCallHistory.length : 0,
      avgResponseTime: this.toolCallHistory.length > 0 ? 
        this.toolCallHistory.reduce((sum, c) => sum + c.duration, 0) / this.toolCallHistory.length : 0,
      activeSessions: Array.from(this.agentSessions.values()).filter(s => s.status === 'active').length,
      mcpStats
    }
  }

  /**
   * Execute agent workflow with MCP tools
   */
  async executeWorkflowWithMCPTools(
    agentId: string,
    workflowType: 'analysis' | 'trading' | 'risk_assessment',
    parameters: Record<string, any>
  ): Promise<any> {
    const tools = this.getAgentTools(agentId)
    
    if (tools.length === 0) {
      throw new Error('No MCP tools available for workflow execution')
    }

    switch (workflowType) {
      case 'analysis':
        return await this.enhancedAgentAnalysis(
          agentId,
          parameters.symbol,
          parameters.analysisType || 'market'
        )

      case 'trading':
        return await this.executeTradeWorkflow(agentId, parameters)

      case 'risk_assessment':
        return await this.executeRiskAssessmentWorkflow(agentId, parameters)

      default:
        throw new Error(`Unknown workflow type: ${workflowType}`)
    }
  }

  /**
   * Execute trading workflow with MCP tools
   */
  private async executeTradeWorkflow(agentId: string, parameters: any): Promise<any> {
    const results: any = {}

    try {
      // 1. Get current portfolio
      results.portfolio = await this.callMCPTool(agentId, 'trading.get_portfolio', {})

      // 2. Analyze market sentiment
      if (parameters.symbol) {
        results.sentiment = await this.callMCPTool(
          agentId,
          'analysis.market_sentiment',
          { symbol: parameters.symbol }
        )
      }

      // 3. Execute trade if conditions are met
      if (parameters.executeOrder && parameters.side && parameters.amount) {
        results.order = await this.callMCPTool(
          agentId,
          'trading.place_order',
          {
            symbol: parameters.symbol,
            side: parameters.side,
            amount: parameters.amount,
            type: parameters.type || 'market'
          }
        )
      }

      // 4. Store workflow results in memory
      await this.callMCPTool(
        agentId,
        'data.store_memory',
        {
          type: 'decision',
          content: `Trading workflow executed: ${JSON.stringify(results)}`,
          importance: 0.8
        }
      )

      return {
        success: true,
        workflow: 'trading',
        results,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error('Trading workflow failed:', error)
      return {
        success: false,
        workflow: 'trading',
        error: error.toString(),
        timestamp: Date.now()
      }
    }
  }

  /**
   * Execute risk assessment workflow
   */
  private async executeRiskAssessmentWorkflow(agentId: string, parameters: any): Promise<any> {
    const results: any = {}

    try {
      // 1. Get portfolio status
      results.portfolio = await this.callMCPTool(agentId, 'trading.get_portfolio', {})

      // 2. Store risk assessment in memory
      await this.callMCPTool(
        agentId,
        'data.store_memory',
        {
          type: 'insight',
          content: `Risk assessment completed: ${JSON.stringify(results)}`,
          importance: 0.6
        }
      )

      return {
        success: true,
        workflow: 'risk_assessment',
        results,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error('Risk assessment workflow failed:', error)
      return {
        success: false,
        workflow: 'risk_assessment',
        error: error.toString(),
        timestamp: Date.now()
      }
    }
  }

  /**
   * Health check for MCP integration
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    mcpService: any
    agentsRegistered: number
    toolsAvailable: number
    recentErrors: string[]
  }> {
    const mcpHealth = mcpIntegrationService.getDashboardStats()
    const recentErrors = this.toolCallHistory
      .filter(call => !call.success && call.timestamp > Date.now() - 300000) // Last 5 minutes
      .map(call => call.error || 'Unknown error')
      .slice(-5)

    const status = recentErrors.length === 0 ? 'healthy' :
                   recentErrors.length < 3 ? 'degraded' : 'unhealthy'

    return {
      status,
      mcpService: mcpHealth,
      agentsRegistered: this.agentSessions.size,
      toolsAvailable: Array.from(this.agentTools.values()).reduce((sum, tools) => sum + tools.length, 0),
      recentErrors
    }
  }
}

// Export singleton instance
export const langChainMCPIntegration = new LangChainMCPIntegration()