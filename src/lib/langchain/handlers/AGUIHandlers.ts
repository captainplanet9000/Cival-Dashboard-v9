/**
 * AG-UI Handlers for LangChain Integration
 * Manages communication between LangChain agents and AG-UI protocol
 */

import type { AGUIMessage, AGUIHandlerConfig } from '../types'

interface HandlerFunction {
  (message: AGUIMessage): Promise<AGUIMessage | null>
}

export class AGUIHandlers {
  private handlers: Map<string, HandlerFunction> = new Map()
  private config: AGUIHandlerConfig = {
    handlers: [],
    enableLogging: true,
    retryAttempts: 3,
    timeout: 30000
  }
  private messageQueue: AGUIMessage[] = []
  private processing = false

  constructor(config?: Partial<AGUIHandlerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.initializeHandlers()
  }

  private initializeHandlers() {
    // Trading decision handler
    this.registerHandler('trading_decision', async (message: AGUIMessage) => {
      if (this.config.enableLogging) {
        console.log('🎯 Processing trading decision from LangChain agent')
      }

      try {
        const decisionData = message.data
        
        // Lazy load LangChain service to avoid circular dependencies
        const { getLangChainService } = await import('../index')
        const langChainService = await getLangChainService()

        // Generate enhanced decision with market context
        const enhancedDecision = await langChainService.makeDecision(
          message.agentId || 'agui-handler',
          decisionData.request || 'Analyze current market conditions',
          decisionData.marketData
        )

        return {
          id: `response_${Date.now()}`,
          type: 'response',
          agentId: message.agentId,
          data: {
            decision: enhancedDecision,
            status: 'processed',
            confidence: enhancedDecision.confidence,
            reasoning: enhancedDecision.reasoning
          },
          timestamp: new Date()
        }

      } catch (error) {
        console.error('❌ Trading decision handler error:', error)
        return this.createErrorResponse(message, error)
      }
    })

    // Market analysis handler
    this.registerHandler('market_analysis', async (message: AGUIMessage) => {
      if (this.config.enableLogging) {
        console.log('📊 Processing market analysis request')
      }

      try {
        const { symbols, timeframe } = message.data
        
        // Lazy load LangChain service
        const { getLangChainService } = await import('../index')
        const langChainService = await getLangChainService()

        const analyses = await langChainService.analyzeMarket(symbols, timeframe)

        return {
          id: `analysis_${Date.now()}`,
          type: 'response',
          agentId: message.agentId,
          data: {
            analyses,
            symbols,
            timeframe,
            generatedAt: new Date().toISOString()
          },
          timestamp: new Date()
        }

      } catch (error) {
        console.error('❌ Market analysis handler error:', error)
        return this.createErrorResponse(message, error)
      }
    })

    // Agent coordination handler
    this.registerHandler('agent_coordination', async (message: AGUIMessage) => {
      if (this.config.enableLogging) {
        console.log('🤝 Processing agent coordination request')
      }

      try {
        const { workflowId, coordinationData } = message.data
        
        // Lazy load LangGraph orchestrator
        const { getLangGraphOrchestrator } = await import('../index')
        const orchestrator = await getLangGraphOrchestrator()

        const stateId = await orchestrator.executeWorkflow(workflowId, coordinationData)
        const workflowState = orchestrator.getWorkflowState(stateId)

        return {
          id: `coordination_${Date.now()}`,
          type: 'response',
          agentId: message.agentId,
          data: {
            workflowId,
            stateId,
            status: workflowState?.status,
            result: workflowState?.data
          },
          timestamp: new Date()
        }

      } catch (error) {
        console.error('❌ Agent coordination handler error:', error)
        return this.createErrorResponse(message, error)
      }
    })

    // Memory management handler
    this.registerHandler('memory_operation', async (message: AGUIMessage) => {
      if (this.config.enableLogging) {
        console.log('🧠 Processing memory operation')
      }

      try {
        const { operation, data } = message.data
        
        // Lazy load memory system
        const { getAgentMemorySystem } = await import('../index')
        const memorySystem = await getAgentMemorySystem()

        let result

        switch (operation) {
          case 'store':
            result = await memorySystem.storeMemory(message.agentId || 'unknown', data)
            break
          case 'recall':
            result = await memorySystem.recallMemories(message.agentId || 'unknown', data.query)
            break
          case 'stats':
            result = await memorySystem.getMemoryStats(message.agentId)
            break
          default:
            throw new Error(`Unknown memory operation: ${operation}`)
        }

        return {
          id: `memory_${Date.now()}`,
          type: 'response',
          agentId: message.agentId,
          data: {
            operation,
            result,
            success: true
          },
          timestamp: new Date()
        }

      } catch (error) {
        console.error('❌ Memory operation handler error:', error)
        return this.createErrorResponse(message, error)
      }
    })

    // Signal generation handler
    this.registerHandler('generate_signal', async (message: AGUIMessage) => {
      if (this.config.enableLogging) {
        console.log('⚡ Processing signal generation request')
      }

      try {
        const { symbol, marketData } = message.data
        
        const { getLangChainService } = await import('../index')
        const langChainService = await getLangChainService()

        const signal = await langChainService.generateTradingSignal(
          symbol, 
          marketData, 
          message.agentId
        )

        return {
          id: `signal_${Date.now()}`,
          type: 'response',
          agentId: message.agentId,
          data: {
            signal,
            symbol,
            confidence: signal.confidence,
            action: signal.action
          },
          timestamp: new Date()
        }

      } catch (error) {
        console.error('❌ Signal generation handler error:', error)
        return this.createErrorResponse(message, error)
      }
    })

    console.log(`✅ Initialized ${this.handlers.size} AG-UI handlers`)
  }

  private createErrorResponse(originalMessage: AGUIMessage, error: any): AGUIMessage {
    return {
      id: `error_${Date.now()}`,
      type: 'error',
      agentId: originalMessage.agentId,
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalMessageId: originalMessage.id,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    }
  }

  registerHandler(messageType: string, handler: HandlerFunction): void {
    this.handlers.set(messageType, handler)
    if (this.config.enableLogging) {
      console.log(`📝 Registered AG-UI handler: ${messageType}`)
    }
  }

  unregisterHandler(messageType: string): boolean {
    const removed = this.handlers.delete(messageType)
    if (removed && this.config.enableLogging) {
      console.log(`🗑️ Unregistered AG-UI handler: ${messageType}`)
    }
    return removed
  }

  async processMessage(message: AGUIMessage): Promise<AGUIMessage | null> {
    const messageType = this.extractMessageType(message)
    const handler = this.handlers.get(messageType)

    if (!handler) {
      console.warn(`⚠️ No handler found for message type: ${messageType}`)
      return this.createErrorResponse(message, new Error(`No handler for message type: ${messageType}`))
    }

    try {
      // Process with timeout
      const result = await Promise.race([
        handler(message),
        this.createTimeoutPromise(message)
      ])

      if (this.config.enableLogging) {
        console.log(`✅ Processed AG-UI message: ${messageType}`)
      }

      return result

    } catch (error) {
      console.error(`❌ Handler error for ${messageType}:`, error)
      return this.createErrorResponse(message, error)
    }
  }

  private extractMessageType(message: AGUIMessage): string {
    // Extract message type from message data or default patterns
    if (message.data && message.data.type) {
      return message.data.type
    }

    if (message.data && message.data.action) {
      return message.data.action
    }

    // Infer from data structure
    if (message.data && message.data.symbol && message.data.marketData) {
      return 'generate_signal'
    }

    if (message.data && message.data.symbols) {
      return 'market_analysis'
    }

    if (message.data && message.data.workflowId) {
      return 'agent_coordination'
    }

    if (message.data && message.data.operation) {
      return 'memory_operation'
    }

    // Default
    return 'trading_decision'
  }

  private createTimeoutPromise(message: AGUIMessage): Promise<AGUIMessage> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Handler timeout after ${this.config.timeout}ms`))
      }, this.config.timeout)
    })
  }

  async processMessageQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) {
      return
    }

    this.processing = true

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!
        await this.processMessage(message)
      }
    } catch (error) {
      console.error('❌ Message queue processing error:', error)
    } finally {
      this.processing = false
    }
  }

  queueMessage(message: AGUIMessage): void {
    this.messageQueue.push(message)
    
    // Auto-process if not already processing
    if (!this.processing) {
      this.processMessageQueue()
    }
  }

  getQueueLength(): number {
    return this.messageQueue.length
  }

  clearQueue(): number {
    const length = this.messageQueue.length
    this.messageQueue = []
    return length
  }

  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys())
  }

  getHandlerStats(): any {
    return {
      totalHandlers: this.handlers.size,
      queueLength: this.messageQueue.length,
      processing: this.processing,
      config: this.config
    }
  }

  updateConfig(newConfig: Partial<AGUIHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Updated AG-UI handler configuration')
  }

  // Utility method for testing handlers
  async testHandler(messageType: string, testData: any): Promise<AGUIMessage | null> {
    const testMessage: AGUIMessage = {
      id: `test_${Date.now()}`,
      type: 'request',
      agentId: 'test-agent',
      data: { type: messageType, ...testData },
      timestamp: new Date()
    }

    return await this.processMessage(testMessage)
  }
}