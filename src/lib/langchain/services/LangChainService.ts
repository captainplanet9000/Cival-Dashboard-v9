/**
 * Core LangChain Service
 * Handles AI model interactions and conversation management
 */

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { 
  LangChainConfig, 
  AgentConfig, 
  AgentDecision, 
  ConversationState,
  LangChainMetrics,
  TradingSignal,
  MarketAnalysis
} from '../types'

export class LangChainService {
  private models: Map<string, BaseChatModel> = new Map()
  private conversations: Map<string, ConversationState> = new Map()
  private metrics: LangChainMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    tokensUsed: 0,
    costEstimate: 0,
    lastReset: new Date()
  }

  constructor() {
    this.initializeModels()
  }

  private initializeModels() {
    // Initialize Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      this.models.set('claude-3-sonnet', new ChatAnthropic({
        modelName: 'claude-3-sonnet-20240229',
        temperature: 0.1,
        maxTokens: 4096,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY
      }))

      this.models.set('claude-3-haiku', new ChatAnthropic({
        modelName: 'claude-3-haiku-20240307',
        temperature: 0.1,
        maxTokens: 2048,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY
      }))
    }

    // Initialize OpenAI GPT
    if (process.env.OPENAI_API_KEY) {
      this.models.set('gpt-4-turbo', new ChatOpenAI({
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.1,
        maxTokens: 4096,
        openAIApiKey: process.env.OPENAI_API_KEY
      }))

      this.models.set('gpt-3.5-turbo', new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.1,  
        maxTokens: 2048,
        openAIApiKey: process.env.OPENAI_API_KEY
      }))
    }
  }

  async createAgent(config: AgentConfig): Promise<string> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Initialize conversation state for agent
    const conversationState: ConversationState = {
      id: agentId,
      agentId,
      messages: [new SystemMessage(config.systemPrompt)],
      context: {
        type: config.type,
        tools: config.tools,
        maxHistory: config.maxHistory
      },
      lastUpdated: new Date()
    }

    this.conversations.set(agentId, conversationState)
    
    console.log(`🤖 Created LangChain agent: ${config.name} (${agentId})`)
    return agentId
  }

  async makeDecision(agentId: string, input: string, marketData?: any): Promise<AgentDecision> {
    const startTime = Date.now()
    this.metrics.totalRequests++

    try {
      const conversation = this.conversations.get(agentId)
      if (!conversation) {
        throw new Error(`Agent ${agentId} not found`)
      }

      // Get appropriate model
      const model = this.models.get('claude-3-sonnet') || this.models.get('gpt-4-turbo')
      if (!model) {
        throw new Error('No AI models available')
      }

      // Prepare context
      const contextMessage = marketData 
        ? `Market Context: ${JSON.stringify(marketData, null, 2)}\n\nDecision Request: ${input}`
        : input

      // Add user message to conversation
      conversation.messages.push(new HumanMessage(contextMessage))

      // Keep conversation history manageable
      if (conversation.messages.length > conversation.context.maxHistory) {
        const systemMsg = conversation.messages[0]
        const recentMessages = conversation.messages.slice(-conversation.context.maxHistory + 1)
        conversation.messages = [systemMsg, ...recentMessages]
      }

      // Get AI response
      const response = await model.invoke(conversation.messages)
      conversation.messages.push(response)
      conversation.lastUpdated = new Date()

      // Parse decision from response
      const decision = this.parseDecision(agentId, response.content.toString(), marketData)
      
      // Update metrics
      const responseTime = Date.now() - startTime
      this.updateMetrics(true, responseTime, response.content.toString().length)

      return decision

    } catch (error) {
      this.metrics.failedRequests++
      console.error(`❌ LangChain decision error for agent ${agentId}:`, error)
      
      // Return default decision on error
      return {
        id: `decision_${Date.now()}`,
        agentId,
        timestamp: new Date(),
        action: 'hold',
        reasoning: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        data: marketData || {},
        metadata: {
          model: 'error',
          tokenUsage: 0,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  async generateTradingSignal(symbol: string, marketData: any, agentId?: string): Promise<TradingSignal> {
    const model = this.models.get('claude-3-sonnet') || this.models.get('gpt-4-turbo')
    if (!model) {
      throw new Error('No AI models available for signal generation')
    }

    const prompt = `
    Analyze the following market data for ${symbol} and generate a trading signal:
    
    Market Data: ${JSON.stringify(marketData, null, 2)}
    
    Respond with a JSON object containing:
    - action: "buy", "sell", or "hold"
    - confidence: number between 0-100
    - reasoning: detailed explanation
    - priceTarget: optional target price
    - stopLoss: optional stop loss price
    
    Focus on technical indicators, volume, and recent price action.
    `

    try {
      const response = await model.invoke([new HumanMessage(prompt)])
      const content = response.content.toString()
      
      // Try to parse JSON response
      let signalData
      try {
        signalData = JSON.parse(content)
      } catch {
        // Fallback parsing
        signalData = {
          action: content.toLowerCase().includes('buy') ? 'buy' : 
                  content.toLowerCase().includes('sell') ? 'sell' : 'hold',
          confidence: 50,
          reasoning: content
        }
      }

      return {
        id: `signal_${Date.now()}`,
        symbol,
        action: signalData.action,
        price: marketData.price || 0,
        quantity: this.calculateQuantity(signalData.action, signalData.confidence),
        confidence: signalData.confidence / 100,
        reasoning: signalData.reasoning,
        timestamp: new Date(),
        agentId: agentId || 'langchain-service'
      }

    } catch (error) {
      console.error(`❌ Signal generation error for ${symbol}:`, error)
      throw error
    }
  }

  async analyzeMarket(symbols: string[], timeframe: string = '1h'): Promise<MarketAnalysis[]> {
    const model = this.models.get('claude-3-haiku') || this.models.get('gpt-3.5-turbo')
    if (!model) {
      throw new Error('No AI models available for market analysis')
    }

    const analyses: MarketAnalysis[] = []

    for (const symbol of symbols) {
      try {
        const prompt = `
        Provide a comprehensive market analysis for ${symbol} on ${timeframe} timeframe.
        
        Analyze:
        - Current trend direction and strength
        - Key technical indicators
        - Support and resistance levels
        - Volume patterns
        - Market sentiment
        
        Respond with JSON format:
        {
          "trend": "bullish|bearish|neutral",
          "strength": 0-100,
          "indicators": [{"name": "RSI", "value": 65, "signal": "neutral"}],
          "priceTarget": optional_number,
          "stopLoss": optional_number
        }
        `

        const response = await model.invoke([new HumanMessage(prompt)])
        const content = response.content.toString()
        
        let analysisData
        try {
          analysisData = JSON.parse(content)
        } catch {
          // Fallback analysis
          analysisData = {
            trend: 'neutral',
            strength: 50,
            indicators: []
          }
        }

        analyses.push({
          symbol,
          trend: analysisData.trend,
          strength: analysisData.strength,
          indicators: analysisData.indicators || [],
          priceTarget: analysisData.priceTarget,
          stopLoss: analysisData.stopLoss,
          timeframe,
          timestamp: new Date()
        })

      } catch (error) {
        console.error(`❌ Market analysis error for ${symbol}:`, error)
      }
    }

    return analyses
  }

  private parseDecision(agentId: string, response: string, marketData?: any): AgentDecision {
    // Simple decision parsing - can be enhanced with more sophisticated NLP
    const lowerResponse = response.toLowerCase()
    
    let action: 'buy' | 'sell' | 'hold' | 'analyze' = 'hold'
    let confidence = 0.5

    if (lowerResponse.includes('buy') || lowerResponse.includes('purchase')) {
      action = 'buy'
      confidence = 0.7
    } else if (lowerResponse.includes('sell') || lowerResponse.includes('close')) {
      action = 'sell'
      confidence = 0.7  
    } else if (lowerResponse.includes('hold') || lowerResponse.includes('wait')) {
      action = 'hold'
      confidence = 0.6
    } else if (lowerResponse.includes('analyze') || lowerResponse.includes('research')) {
      action = 'analyze'
      confidence = 0.8
    }

    // Extract confidence if mentioned
    const confidenceMatch = response.match(/confidence[:\s]*(\d+)%?/i)
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1]) / 100
    }

    return {
      id: `decision_${Date.now()}`,
      agentId,
      timestamp: new Date(),
      action,
      reasoning: response,
      confidence,
      data: marketData || {},
      metadata: {
        model: 'claude-3-sonnet',
        tokenUsage: response.length,
        processingTime: 0
      }
    }
  }

  private calculateQuantity(action: string, confidence: number): number {
    if (action === 'hold' || action === 'analyze') return 0
    
    // Base quantity calculation on confidence
    const baseQuantity = 100
    const confidenceFactor = confidence / 100
    
    return Math.round(baseQuantity * confidenceFactor)
  }

  private updateMetrics(success: boolean, responseTime: number, tokenCount: number) {
    if (success) {
      this.metrics.successfulRequests++
    }
    
    // Update average response time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests
    this.metrics.averageResponseTime = (
      (this.metrics.averageResponseTime * (totalRequests - 1)) + responseTime
    ) / totalRequests

    this.metrics.tokensUsed += tokenCount
    this.metrics.costEstimate += this.estimateCost(tokenCount)
  }

  private estimateCost(tokens: number): number {
    // Rough cost estimation (adjust based on actual pricing)
    const costPerToken = 0.00001
    return tokens * costPerToken
  }

  // Public getters
  getMetrics(): LangChainMetrics {
    return { ...this.metrics }
  }

  getAvailableModels(): string[] {
    return Array.from(this.models.keys())
  }

  getConversationState(agentId: string): ConversationState | undefined {
    return this.conversations.get(agentId)
  }

  clearConversation(agentId: string): boolean {
    return this.conversations.delete(agentId)
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      tokensUsed: 0,
      costEstimate: 0,
      lastReset: new Date()
    }
  }
}