/**
 * AG-UI Integration for LangChain Agents
 * Phase 4: Connects LangGraph trading orchestrator with AG-UI protocol
 * Enables bidirectional communication between LLM agents and the dashboard
 */

import { EventEmitter } from 'events'
import { langGraphOrchestrator, LangGraphAgent, AgentPerformance } from './LangGraphOrchestrator'
import { langChainService } from './LangChainService'
import { agentFactory, MomentumAgent, MeanReversionAgent, RiskManagementAgent, SentimentAgent, ArbitrageAgent } from './EnhancedAgents'
import { createAGUIClient, getAGUIClient, AGUIClient } from '@/lib/ag-ui/client'
import { 
  AGUIEvent, 
  AGUITextEvent, 
  AGUITradingSignalEvent, 
  AGUIMarketAnalysisEvent,
  AGUIRiskAssessmentEvent,
  AGUIThinkingEvent,
  AGUIProgressEvent,
  AGUIToolCallEvent,
  AGUIContextEvent,
  AGUIUserActionEvent,
  AGUIAgent as AGUIAgentType
} from '@/lib/ag-ui/types'

export interface LangChainAGUIConfig {
  endpoint: string
  enableRealTimeUpdates: boolean
  updateInterval: number
  maxEventHistory: number
  autoStartAgents: boolean
  enableThinking: boolean
  enableProgress: boolean
}

export interface AGUIAgentMapping {
  langGraphId: string
  agentInstance: any
  agentType: 'momentum' | 'mean_reversion' | 'risk_manager' | 'sentiment' | 'arbitrage'
  status: 'active' | 'paused' | 'stopped' | 'error'
  lastUpdate: number
}

export class LangChainAGUIIntegration extends EventEmitter {
  private agUIClient: AGUIClient | null = null
  private config: LangChainAGUIConfig
  private agentMappings: Map<string, AGUIAgentMapping> = new Map()
  private isConnected: boolean = false
  private updateInterval: NodeJS.Timeout | null = null
  private eventHistory: AGUIEvent[] = []

  constructor(config?: Partial<LangChainAGUIConfig>) {
    super()
    
    this.config = {
      endpoint: process.env.NEXT_PUBLIC_AGUI_ENDPOINT || 'http://localhost:8001',
      enableRealTimeUpdates: true,
      updateInterval: 5000, // 5 seconds
      maxEventHistory: 1000,
      autoStartAgents: true,
      enableThinking: true,
      enableProgress: true,
      ...config
    }

    this.initializeIntegration()
  }

  /**
   * Initialize the AG-UI integration with LangChain agents
   */
  private async initializeIntegration(): Promise<void> {
    try {
      console.log('🔗 Initializing LangChain AG-UI Integration')

      // Create AG-UI client
      this.agUIClient = createAGUIClient({
        endpoint: this.config.endpoint,
        transport: 'websocket',
        reconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 2000,
        onConnect: this.handleAGUIConnect.bind(this),
        onDisconnect: this.handleAGUIDisconnect.bind(this),
        onError: this.handleAGUIError.bind(this)
      })

      // Set up event listeners
      this.setupAGUIEventHandlers()
      this.setupLangGraphEventHandlers()

      // Register LangGraph agents with AG-UI
      await this.registerLangGraphAgents()

      console.log('✅ LangChain AG-UI Integration initialized')
    } catch (error) {
      console.error('❌ Failed to initialize LangChain AG-UI Integration:', error)
      throw error
    }
  }

  /**
   * Start the AG-UI integration
   */
  public async start(): Promise<void> {
    try {
      if (!this.agUIClient) {
        throw new Error('AG-UI client not initialized')
      }

      console.log('🚀 Starting LangChain AG-UI Integration')

      // Connect to AG-UI backend
      await this.agUIClient.connect()

      // Start LangGraph orchestrator
      await langGraphOrchestrator.start()

      // Start real-time updates
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeUpdates()
      }

      // Auto-start agents if configured
      if (this.config.autoStartAgents) {
        await this.startAllAgents()
      }

      this.emit('integration:started')
      console.log('✅ LangChain AG-UI Integration started successfully')

    } catch (error) {
      console.error('❌ Failed to start LangChain AG-UI Integration:', error)
      throw error
    }
  }

  /**
   * Stop the AG-UI integration
   */
  public async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping LangChain AG-UI Integration')

      // Stop real-time updates
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }

      // Stop LangGraph orchestrator
      await langGraphOrchestrator.stop()

      // Disconnect AG-UI client
      if (this.agUIClient) {
        this.agUIClient.disconnect()
      }

      this.isConnected = false
      this.emit('integration:stopped')
      console.log('✅ LangChain AG-UI Integration stopped')

    } catch (error) {
      console.error('❌ Error stopping LangChain AG-UI Integration:', error)
    }
  }

  /**
   * Register all LangGraph agents with AG-UI system
   */
  private async registerLangGraphAgents(): Promise<void> {
    const langGraphAgents = langGraphOrchestrator.getAgents()

    for (const agent of langGraphAgents) {
      await this.registerAgent(agent)
    }

    console.log(`📝 Registered ${langGraphAgents.length} LangGraph agents with AG-UI`)
  }

  /**
   * Register individual agent with AG-UI
   */
  private async registerAgent(langGraphAgent: LangGraphAgent): Promise<void> {
    try {
      // Create specialized agent instance
      const agentInstance = agentFactory.createAgent(langGraphAgent.type, langGraphAgent.id)

      // Create AG-UI agent mapping
      const mapping: AGUIAgentMapping = {
        langGraphId: langGraphAgent.id,
        agentInstance,
        agentType: langGraphAgent.type,
        status: langGraphAgent.status === 'active' ? 'active' : 'paused',
        lastUpdate: Date.now()
      }

      this.agentMappings.set(langGraphAgent.id, mapping)

      // Send agent registration event to AG-UI
      await this.sendAGUIEvent({
        type: 'text',
        content: `🤖 Agent ${langGraphAgent.name} registered and ready for trading analysis`,
        role: 'system',
        metadata: {
          agentId: langGraphAgent.id,
          agentType: langGraphAgent.type,
          capabilities: langGraphAgent.specialization,
          status: langGraphAgent.status
        }
      })

      console.log(`✅ Registered agent ${langGraphAgent.name} (${langGraphAgent.type})`)

    } catch (error) {
      console.error(`❌ Failed to register agent ${langGraphAgent.id}:`, error)
    }
  }

  /**
   * Setup AG-UI event handlers
   */
  private setupAGUIEventHandlers(): void {
    if (!this.agUIClient) return

    // Handle user action events from AG-UI
    this.agUIClient.on('user_action', this.handleUserAction.bind(this))

    // Handle context updates from AG-UI
    this.agUIClient.on('context', this.handleContextUpdate.bind(this))

    // Handle all events for history tracking
    this.agUIClient.on('*', this.trackEvent.bind(this))
  }

  /**
   * Setup LangGraph orchestrator event handlers
   */
  private setupLangGraphEventHandlers(): void {
    // Agent coordination completed
    langGraphOrchestrator.on('coordination:completed', this.handleCoordinationCompleted.bind(this))

    // Trade executed
    langGraphOrchestrator.on('trade:executed', this.handleTradeExecuted.bind(this))

    // Performance updated
    langGraphOrchestrator.on('performance:updated', this.handlePerformanceUpdated.bind(this))

    // Agent added/removed/updated
    langGraphOrchestrator.on('agent:added', this.handleAgentAdded.bind(this))
    langGraphOrchestrator.on('agent:removed', this.handleAgentRemoved.bind(this))
    langGraphOrchestrator.on('agent:updated', this.handleAgentUpdated.bind(this))
  }

  /**
   * Handle AG-UI connection established
   */
  private handleAGUIConnect(): void {
    console.log('🔗 AG-UI connection established')
    this.isConnected = true
    this.emit('agui:connected')

    // Send initial context
    this.sendInitialContext()
  }

  /**
   * Handle AG-UI connection lost
   */
  private handleAGUIDisconnect(): void {
    console.log('📡 AG-UI connection lost')
    this.isConnected = false
    this.emit('agui:disconnected')
  }

  /**
   * Handle AG-UI errors
   */
  private handleAGUIError(error: Error): void {
    console.error('❌ AG-UI error:', error)
    this.emit('agui:error', error)
  }

  /**
   * Handle user actions from AG-UI
   */
  private async handleUserAction(event: AGUIUserActionEvent): Promise<void> {
    try {
      console.log('👤 User action received:', event.action, event.value)

      switch (event.action) {
        case 'start_agent':
          await this.startAgent(event.value.agentId)
          break

        case 'stop_agent':
          await this.stopAgent(event.value.agentId)
          break

        case 'analyze_symbol':
          await this.analyzeSymbol(event.value.symbol, event.value.agentId)
          break

        case 'request_market_analysis':
          await this.requestMarketAnalysis(event.value.symbols)
          break

        case 'update_agent_config':
          await this.updateAgentConfig(event.value.agentId, event.value.config)
          break

        default:
          console.warn('🤷 Unknown user action:', event.action)
      }

    } catch (error) {
      console.error('❌ Error handling user action:', error)
      
      await this.sendAGUIEvent({
        type: 'error',
        error: `Failed to handle user action: ${error}`,
        recoverable: true
      })
    }
  }

  /**
   * Handle context updates from AG-UI
   */
  private async handleContextUpdate(event: AGUIContextEvent): Promise<void> {
    console.log('📋 Context update received')
    
    // Update LangGraph orchestrator with new context
    if (event.context.market_data) {
      // Update market data context for all agents
      this.updateAgentContext('market_data', event.context.market_data)
    }

    if (event.context.portfolio) {
      // Update portfolio context
      this.updateAgentContext('portfolio', event.context.portfolio)
    }
  }

  /**
   * Handle LangGraph coordination completed
   */
  private async handleCoordinationCompleted(data: any): Promise<void> {
    await this.sendAGUIEvent({
      type: 'progress',
      current: data.executedTrades || 0,
      total: data.totalDecisions || 1,
      message: `Coordination cycle completed. ${data.executedTrades} trades executed.`,
      stage: 'coordination'
    })

    // Send market analysis event
    await this.sendAGUIEvent({
      type: 'market_analysis',
      analysis: {
        symbol: 'MARKET',
        timeframe: '1m',
        sentiment: this.determineSentiment(data.marketConditions),
        key_levels: {
          support: [],
          resistance: []
        },
        indicators: {},
        summary: `Market coordination completed at ${new Date().toISOString()}`
      }
    })
  }

  /**
   * Handle trade execution from LangGraph
   */
  private async handleTradeExecuted(data: any): Promise<void> {
    console.log('💰 Trade executed by LangGraph:', data)

    // Send trading signal event to AG-UI
    await this.sendAGUIEvent({
      type: 'trading_signal',
      signal: {
        symbol: data.symbol,
        action: data.action,
        confidence: data.order?.confidence || 75,
        price: data.order?.price || 0,
        quantity: data.order?.quantity,
        reasoning: [`Agent ${data.agentId} executed ${data.action} order`],
        risk_level: this.calculateRiskLevel(data.order)
      }
    })

    // Send confirmation text
    await this.sendAGUIEvent({
      type: 'text',
      content: `✅ Trade executed: ${data.action.toUpperCase()} ${data.order?.quantity} ${data.symbol} by ${data.agentId}`,
      role: 'assistant',
      metadata: {
        agentId: data.agentId,
        orderId: data.order?.id,
        tradeType: 'execution'
      }
    })
  }

  /**
   * Handle performance updates from LangGraph
   */
  private async handlePerformanceUpdated(data: any): Promise<void> {
    // Update AG-UI context with latest performance data
    if (this.agUIClient) {
      this.agUIClient.updateContext({
        agent_performance: data.agents
      })
    }

    // Send performance summary
    const totalPnL = data.agents.reduce((sum: number, agent: any) => sum + (agent.performance.totalPnL || 0), 0)
    
    await this.sendAGUIEvent({
      type: 'text',
      content: `📊 Performance update: ${data.agents.length} agents, Total P&L: $${totalPnL.toFixed(2)}`,
      role: 'system',
      metadata: {
        performanceUpdate: true,
        totalAgents: data.agents.length,
        totalPnL
      }
    })
  }

  /**
   * Start individual agent
   */
  private async startAgent(agentId: string): Promise<void> {
    const mapping = this.agentMappings.get(agentId)
    if (!mapping) {
      throw new Error(`Agent ${agentId} not found`)
    }

    // Update LangGraph agent status
    await langGraphOrchestrator.updateAgent(agentId, { status: 'active' })
    
    // Update mapping
    mapping.status = 'active'
    mapping.lastUpdate = Date.now()

    await this.sendAGUIEvent({
      type: 'text',
      content: `🚀 Agent ${agentId} started and ready for trading`,
      role: 'assistant',
      metadata: { agentId, action: 'started' }
    })
  }

  /**
   * Stop individual agent
   */
  private async stopAgent(agentId: string): Promise<void> {
    const mapping = this.agentMappings.get(agentId)
    if (!mapping) {
      throw new Error(`Agent ${agentId} not found`)
    }

    // Update LangGraph agent status
    await langGraphOrchestrator.updateAgent(agentId, { status: 'paused' })
    
    // Update mapping
    mapping.status = 'paused'
    mapping.lastUpdate = Date.now()

    await this.sendAGUIEvent({
      type: 'text',
      content: `⏸️ Agent ${agentId} stopped and paused`,
      role: 'assistant',
      metadata: { agentId, action: 'stopped' }
    })
  }

  /**
   * Analyze specific symbol with specific agent
   */
  private async analyzeSymbol(symbol: string, agentId?: string): Promise<void> {
    try {
      if (this.config.enableThinking) {
        await this.sendAGUIEvent({
          type: 'thinking',
          content: `Analyzing ${symbol} for trading opportunities...`,
          visible: true
        })
      }

      let agent: any
      let agentType: string

      if (agentId) {
        const mapping = this.agentMappings.get(agentId)
        if (!mapping) {
          throw new Error(`Agent ${agentId} not found`)
        }
        agent = mapping.agentInstance
        agentType = mapping.agentType
      } else {
        // Use momentum agent as default
        agent = agentFactory.createAgent('momentum', 'temp_momentum')
        agentType = 'momentum'
      }

      // Create market context for analysis
      const marketContext = {
        symbol,
        price: 50000 + Math.random() * 10000, // Mock data
        volume: Math.random() * 1000000,
        technicalIndicators: {},
        marketConditions: {},
        portfolio: { cashBalance: 100000, totalValue: 100000, positions: [] },
        riskLimits: { maxPositionSize: 10000 },
        recentTrades: [],
        newsEvents: []
      }

      // Perform analysis
      const analysis = await agent.analyze(marketContext)

      // Send analysis results to AG-UI
      await this.sendAGUIEvent({
        type: 'market_analysis',
        analysis: {
          symbol,
          timeframe: analysis.timeframe || '1h',
          sentiment: this.mapAnalysisToSentiment(analysis),
          key_levels: {
            support: [],
            resistance: []
          },
          indicators: {
            confidence: analysis.confidence,
            riskAssessment: analysis.riskAssessment
          },
          summary: analysis.reasoning
        }
      })

      // Send detailed text analysis
      await this.sendAGUIEvent({
        type: 'text',
        content: `📈 Analysis for ${symbol} by ${agentType} agent:\n\n${analysis.reasoning}\n\nConfidence: ${analysis.confidence}%\nRisk Level: ${analysis.riskAssessment}/100`,
        role: 'assistant',
        metadata: {
          agentId: agentId || 'temp_momentum',
          agentType,
          symbol,
          analysis
        }
      })

    } catch (error) {
      console.error(`❌ Analysis failed for ${symbol}:`, error)
      
      await this.sendAGUIEvent({
        type: 'error',
        error: `Analysis failed for ${symbol}: ${error}`,
        recoverable: true
      })
    }
  }

  /**
   * Request market analysis from all active agents
   */
  private async requestMarketAnalysis(symbols: string[] = ['BTC/USDT', 'ETH/USDT']): Promise<void> {
    if (this.config.enableProgress) {
      await this.sendAGUIEvent({
        type: 'progress',
        current: 0,
        total: symbols.length,
        message: 'Starting comprehensive market analysis...',
        stage: 'analysis'
      })
    }

    let completed = 0
    for (const symbol of symbols) {
      try {
        await this.analyzeSymbol(symbol)
        completed++

        if (this.config.enableProgress) {
          await this.sendAGUIEvent({
            type: 'progress',
            current: completed,
            total: symbols.length,
            message: `Analyzed ${symbol}`,
            stage: 'analysis'
          })
        }

      } catch (error) {
        console.error(`❌ Failed to analyze ${symbol}:`, error)
      }
    }

    await this.sendAGUIEvent({
      type: 'text',
      content: `✅ Market analysis completed for ${completed}/${symbols.length} symbols`,
      role: 'assistant',
      metadata: {
        analysisComplete: true,
        symbolsAnalyzed: completed,
        totalSymbols: symbols.length
      }
    })
  }

  /**
   * Update agent configuration
   */
  private async updateAgentConfig(agentId: string, config: any): Promise<void> {
    await langGraphOrchestrator.updateAgent(agentId, { config })
    
    await this.sendAGUIEvent({
      type: 'text',
      content: `⚙️ Agent ${agentId} configuration updated`,
      role: 'system',
      metadata: { agentId, configUpdated: true }
    })
  }

  /**
   * Start all registered agents
   */
  private async startAllAgents(): Promise<void> {
    const agentIds = Array.from(this.agentMappings.keys())
    
    for (const agentId of agentIds) {
      try {
        await this.startAgent(agentId)
      } catch (error) {
        console.error(`❌ Failed to start agent ${agentId}:`, error)
      }
    }
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.sendPeriodicUpdates()
      } catch (error) {
        console.error('❌ Error in periodic updates:', error)
      }
    }, this.config.updateInterval)
  }

  /**
   * Send periodic updates to AG-UI
   */
  private async sendPeriodicUpdates(): Promise<void> {
    if (!this.isConnected) return

    const status = langGraphOrchestrator.getStatus()
    const analytics = langGraphOrchestrator.getPerformanceAnalytics()

    // Update context with latest status
    if (this.agUIClient) {
      this.agUIClient.updateContext({
        orchestrator_status: status,
        performance_analytics: analytics,
        last_update: new Date().toISOString()
      })
    }
  }

  /**
   * Send initial context to AG-UI
   */
  private async sendInitialContext(): Promise<void> {
    const status = langGraphOrchestrator.getStatus()
    const agents = langGraphOrchestrator.getAgents()

    if (this.agUIClient) {
      this.agUIClient.updateContext({
        langchain_integration: {
          status: 'connected',
          version: '1.0.0',
          agents_count: agents.length,
          orchestrator_status: status
        },
        available_agents: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          specialization: agent.specialization
        }))
      })
    }

    await this.sendAGUIEvent({
      type: 'text',
      content: '🔗 LangChain AG-UI Integration connected and ready',
      role: 'system',
      metadata: {
        integration: 'langchain-agui',
        agentsAvailable: agents.length,
        status: 'ready'
      }
    })
  }

  /**
   * Send event to AG-UI
   */
  private async sendAGUIEvent(eventData: Partial<AGUIEvent>): Promise<void> {
    if (!this.agUIClient || !this.isConnected) return

    try {
      await this.agUIClient.sendEvent(eventData)
    } catch (error) {
      console.error('❌ Failed to send AG-UI event:', error)
    }
  }

  /**
   * Track event in history
   */
  private trackEvent(event: AGUIEvent): void {
    this.eventHistory.push(event)
    
    // Limit history size
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory.shift()
    }
  }

  /**
   * Update agent context
   */
  private updateAgentContext(key: string, value: any): void {
    // This would update the context for all agents
    console.log(`📋 Updating agent context: ${key}`)
  }

  /**
   * Helper methods
   */
  private determineSentiment(marketConditions: any): 'bullish' | 'bearish' | 'neutral' {
    // Simple sentiment determination logic
    if (marketConditions?.trend === 'bullish') return 'bullish'
    if (marketConditions?.trend === 'bearish') return 'bearish'
    return 'neutral'
  }

  private calculateRiskLevel(order: any): 'low' | 'medium' | 'high' {
    const riskScore = order?.riskScore || 50
    if (riskScore < 30) return 'low'
    if (riskScore < 70) return 'medium'
    return 'high'
  }

  private mapAnalysisToSentiment(analysis: any): 'bullish' | 'bearish' | 'neutral' {
    if (analysis.confidence > 70 && analysis.signals?.includes('buy')) return 'bullish'
    if (analysis.confidence > 70 && analysis.signals?.includes('sell')) return 'bearish'
    return 'neutral'
  }

  // Event handlers for agent lifecycle
  private async handleAgentAdded(data: any): Promise<void> {
    await this.registerAgent(data.agent)
  }

  private async handleAgentRemoved(data: any): Promise<void> {
    this.agentMappings.delete(data.agentId)
    
    await this.sendAGUIEvent({
      type: 'text',
      content: `🗑️ Agent ${data.agentId} removed from system`,
      role: 'system',
      metadata: { agentId: data.agentId, action: 'removed' }
    })
  }

  private async handleAgentUpdated(data: any): Promise<void> {
    const mapping = this.agentMappings.get(data.agent.id)
    if (mapping) {
      mapping.status = data.agent.status
      mapping.lastUpdate = Date.now()
    }
  }

  /**
   * Get integration status
   */
  public getStatus(): {
    isConnected: boolean
    agentsRegistered: number
    eventHistory: number
    lastUpdate: number
  } {
    return {
      isConnected: this.isConnected,
      agentsRegistered: this.agentMappings.size,
      eventHistory: this.eventHistory.length,
      lastUpdate: Date.now()
    }
  }

  /**
   * Get agent mappings
   */
  public getAgentMappings(): Map<string, AGUIAgentMapping> {
    return this.agentMappings
  }

  /**
   * Get event history
   */
  public getEventHistory(): AGUIEvent[] {
    return [...this.eventHistory]
  }
}

// Export singleton instance
export const langChainAGUIIntegration = new LangChainAGUIIntegration()