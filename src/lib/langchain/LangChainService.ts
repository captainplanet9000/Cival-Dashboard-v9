/**
 * LangChain Service
 * Core service for managing LangChain LLM integrations, workflows, and agent coordination
 * Optimized for Railway deployment with fallback providers and cost controls
 */

import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'

export interface LangChainConfig {
  primaryProvider: 'openai' | 'anthropic' | 'openrouter'
  fallbackProviders: string[]
  maxTokens: number
  temperature: number
  timeout: number
  maxCostPerDay: number
  maxCallsPerHour: number
  enableTracing: boolean
}

export interface ModelChoice {
  provider: string
  model: string
  costPerToken: number
  maxTokens: number
  capabilities: string[]
}

export class LangChainService {
  private models: Map<string, BaseChatModel> = new Map()
  private config: LangChainConfig
  private costTracker: Map<string, { calls: number, cost: number, resetTime: number }> = new Map()
  private callCounter: Map<string, { calls: number, resetTime: number }> = new Map()

  constructor(config?: Partial<LangChainConfig>) {
    this.config = {
      primaryProvider: 'openai',
      fallbackProviders: ['anthropic', 'openrouter'],
      maxTokens: 4000,
      temperature: 0.1, // Low temperature for consistent trading decisions
      timeout: 30000, // 30s timeout for Railway
      maxCostPerDay: parseFloat(process.env.LLM_COST_LIMIT_DAILY || '50'),
      maxCallsPerHour: parseInt(process.env.MAX_LLM_CALLS_PER_HOUR || '100'),
      enableTracing: process.env.LANGCHAIN_TRACING_V2 === 'true',
      ...config
    }

    this.initializeModels()
    this.setupCostTracking()
  }

  private initializeModels(): void {
    // OpenAI Models
    if (process.env.OPENAI_API_KEY) {
      this.models.set('gpt-4o-mini', new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        timeout: this.config.timeout,
        openAIApiKey: process.env.OPENAI_API_KEY,
      }))

      this.models.set('gpt-3.5-turbo', new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        timeout: this.config.timeout,
        openAIApiKey: process.env.OPENAI_API_KEY,
      }))
    }

    // Anthropic Models
    if (process.env.ANTHROPIC_API_KEY) {
      this.models.set('claude-3-haiku', new ChatAnthropic({
        modelName: 'claude-3-haiku-20240307',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        timeout: this.config.timeout,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      }))

      this.models.set('claude-3-sonnet', new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-20241022',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        timeout: this.config.timeout,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      }))
    }

    console.log(`✅ LangChain Service initialized with ${this.models.size} models`)
  }

  private setupCostTracking(): void {
    // Reset counters every hour/day
    setInterval(() => {
      const now = Date.now()
      
      // Reset hourly call counters
      for (const [key, data] of this.callCounter.entries()) {
        if (now - data.resetTime > 3600000) { // 1 hour
          this.callCounter.set(key, { calls: 0, resetTime: now })
        }
      }

      // Reset daily cost counters
      for (const [key, data] of this.costTracker.entries()) {
        if (now - data.resetTime > 86400000) { // 24 hours
          this.costTracker.set(key, { calls: 0, cost: 0, resetTime: now })
        }
      }
    }, 300000) // Check every 5 minutes
  }

  /**
   * Get the best available model based on cost, availability, and requirements
   */
  public async getBestModel(requirements?: {
    maxCost?: number
    preferredProvider?: string
    capabilities?: string[]
  }): Promise<BaseChatModel | null> {
    const models = this.getAvailableModels()
    
    // Filter by cost and rate limits
    const viableModels = models.filter(modelName => {
      const dailyData = this.costTracker.get(modelName) || { calls: 0, cost: 0, resetTime: Date.now() }
      const hourlyData = this.callCounter.get(modelName) || { calls: 0, resetTime: Date.now() }
      
      return dailyData.cost < this.config.maxCostPerDay && 
             hourlyData.calls < this.config.maxCallsPerHour
    })

    if (viableModels.length === 0) {
      console.warn('⚠️ No viable models available due to cost/rate limits')
      return null
    }

    // Prefer specific provider if requested
    if (requirements?.preferredProvider) {
      const preferredModel = viableModels.find(name => 
        name.includes(requirements.preferredProvider!))
      if (preferredModel) {
        return this.models.get(preferredModel) || null
      }
    }

    // Default to most cost-effective model
    const costEffectiveModel = viableModels.includes('gpt-4o-mini') ? 'gpt-4o-mini' :
                              viableModels.includes('claude-3-haiku') ? 'claude-3-haiku' :
                              viableModels.includes('gpt-3.5-turbo') ? 'gpt-3.5-turbo' :
                              viableModels[0]

    return this.models.get(costEffectiveModel) || null
  }

  /**
   * Generate trading analysis with automatic fallback and MCP tool awareness
   */
  public async generateTradingAnalysis(
    prompt: string,
    context: {
      marketData?: any
      portfolio?: any
      riskLimits?: any
      agentId?: string
    },
    options?: {
      modelPreference?: string
      maxRetries?: number
      enableMCPTools?: boolean
    }
  ): Promise<{
    analysis: string
    reasoning: string
    confidence: number
    modelUsed: string
    cost: number
    mcpToolsUsed?: string[]
  } | null> {
    const maxRetries = options?.maxRetries || 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = await this.getBestModel({
          preferredProvider: options?.modelPreference
        })

        if (!model) {
          throw new Error('No available models within cost/rate limits')
        }

        const modelName = this.getModelName(model)
        
        // Create structured prompt for trading analysis with MCP tools awareness
        let baseSystemPrompt = `You are an expert trading analyst. Analyze the provided market data and context to make informed trading recommendations.

Rules:
1. Provide clear, actionable analysis
2. Include confidence score (0-100)
3. Consider risk management
4. Be concise but thorough
5. Format response as JSON with: analysis, reasoning, confidence`

        // MCP tools enhancement disabled to prevent circular dependencies
        // TODO: Refactor MCP integration to avoid circular imports

        const systemPrompt = new SystemMessage(baseSystemPrompt)

        const humanPrompt = new HumanMessage(`${prompt}

Context:
${JSON.stringify(context, null, 2)}`)

        // Track API call
        this.trackAPICall(modelName)

        const result = await model.invoke([systemPrompt, humanPrompt], {
          timeout: this.config.timeout
        } as RunnableConfig)

        try {
          const parsed = JSON.parse(result.content as string)
          return {
            analysis: parsed.analysis || result.content as string,
            reasoning: parsed.reasoning || 'No specific reasoning provided',
            confidence: parsed.confidence || 50,
            modelUsed: modelName,
            cost: this.estimateCost(modelName, prompt + JSON.stringify(context))
          }
        } catch {
          // Fallback if not JSON
          return {
            analysis: result.content as string,
            reasoning: 'Analysis provided without structured reasoning',
            confidence: 50,
            modelUsed: modelName,
            cost: this.estimateCost(modelName, prompt + JSON.stringify(context))
          }
        }

      } catch (error) {
        lastError = error as Error
        console.warn(`LangChain attempt ${attempt + 1} failed:`, error)
        
        // Wait before retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    console.error('All LangChain attempts failed:', lastError)
    return null
  }

  /**
   * Quick decision making for time-sensitive trading scenarios
   */
  public async quickDecision(
    scenario: string,
    options: string[],
    context?: any
  ): Promise<{
    decision: string
    reasoning: string
    confidence: number
  } | null> {
    try {
      const model = await this.getBestModel({
        preferredProvider: 'openai' // Prefer faster models for quick decisions
      })

      if (!model) return null

      const prompt = new HumanMessage(`Quick trading decision needed:

Scenario: ${scenario}
Options: ${options.join(', ')}
Context: ${JSON.stringify(context || {})}

Respond with JSON: {"decision": "option", "reasoning": "brief explanation", "confidence": 0-100}`)

      const result = await model.invoke([prompt], {
        timeout: 10000 // Shorter timeout for quick decisions
      } as RunnableConfig)

      try {
        return JSON.parse(result.content as string)
      } catch {
        return {
          decision: options[0], // Fallback to first option
          reasoning: 'Could not parse LLM response, using fallback',
          confidence: 25
        }
      }
    } catch (error) {
      console.error('Quick decision failed:', error)
      return null
    }
  }

  private getAvailableModels(): string[] {
    return Array.from(this.models.keys())
  }

  private getModelName(model: BaseChatModel): string {
    // Extract model name from the model instance
    return this.getAvailableModels().find(name => 
      this.models.get(name) === model) || 'unknown'
  }

  private trackAPICall(modelName: string): void {
    const now = Date.now()
    
    // Track hourly calls
    const hourlyData = this.callCounter.get(modelName) || { calls: 0, resetTime: now }
    hourlyData.calls++
    this.callCounter.set(modelName, hourlyData)

    // Track daily calls
    const dailyData = this.costTracker.get(modelName) || { calls: 0, cost: 0, resetTime: now }
    dailyData.calls++
    this.costTracker.set(modelName, dailyData)
  }

  private estimateCost(modelName: string, input: string): number {
    const tokenCount = Math.ceil(input.length / 4) // Rough estimate
    
    // Cost per 1K tokens (approximate)
    const costs: Record<string, number> = {
      'gpt-4o-mini': 0.00015,
      'gpt-3.5-turbo': 0.0005,
      'claude-3-haiku': 0.00025,
      'claude-3-sonnet': 0.003
    }

    const costPer1K = costs[modelName] || 0.001
    const estimatedCost = (tokenCount / 1000) * costPer1K

    // Track cost
    const dailyData = this.costTracker.get(modelName) || { calls: 0, cost: 0, resetTime: Date.now() }
    dailyData.cost += estimatedCost
    this.costTracker.set(modelName, dailyData)

    return estimatedCost
  }

  /**
   * Get current usage statistics
   */
  public getUsageStats(): {
    dailyCosts: Record<string, number>
    hourlyCalls: Record<string, number>
    availableModels: string[]
    totalDailyCost: number
  } {
    const dailyCosts: Record<string, number> = {}
    const hourlyCalls: Record<string, number> = {}
    let totalDailyCost = 0

    for (const [model, data] of this.costTracker.entries()) {
      dailyCosts[model] = data.cost
      totalDailyCost += data.cost
    }

    for (const [model, data] of this.callCounter.entries()) {
      hourlyCalls[model] = data.calls
    }

    return {
      dailyCosts,
      hourlyCalls,
      availableModels: this.getAvailableModels(),
      totalDailyCost
    }
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    availableModels: number
    withinCostLimits: boolean
    withinRateLimits: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    const availableModels = this.getAvailableModels().length
    const stats = this.getUsageStats()

    const withinCostLimits = stats.totalDailyCost < this.config.maxCostPerDay
    const withinRateLimits = Object.values(stats.hourlyCalls).every(calls => 
      calls < this.config.maxCallsPerHour)

    if (availableModels === 0) {
      errors.push('No models available')
    }

    if (!withinCostLimits) {
      errors.push('Exceeded daily cost limit')
    }

    if (!withinRateLimits) {
      errors.push('Exceeded hourly rate limit')
    }

    const status = errors.length === 0 ? 'healthy' :
                   availableModels > 0 && (withinCostLimits || withinRateLimits) ? 'degraded' :
                   'unhealthy'

    return {
      status,
      availableModels,
      withinCostLimits,
      withinRateLimits,
      errors
    }
  }
}

// Export singleton instance
export const langChainService = new LangChainService()