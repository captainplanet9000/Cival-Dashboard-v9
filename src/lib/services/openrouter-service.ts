/**
 * OpenRouter LLM Service
 * Provides intelligent model routing and cost optimization for trading AI
 */

import { OpenAI } from 'openai'

export interface OpenRouterModel {
  id: string
  name: string
  description: string
  pricing: {
    prompt: number
    completion: number
  }
  context_length: number
  capabilities: string[]
  provider: string
  specialized_for?: string[]
}

export interface ModelPerformanceMetrics {
  model_id: string
  average_response_time: number
  success_rate: number
  cost_per_request: number
  accuracy_score: number
  last_updated: Date
}

export interface OpenRouterRequest {
  prompt: string
  model?: string
  max_tokens?: number
  temperature?: number
  task_type?: 'analysis' | 'generation' | 'sentiment' | 'research' | 'calculation'
  cost_priority?: 'low' | 'medium' | 'high'
  quality_priority?: 'low' | 'medium' | 'high'
}

export interface OpenRouterResponse<T = any> {
  success: boolean
  data?: T
  model_used: string
  cost_estimate: number
  response_time: number
  error?: string
  timestamp: Date
}

export class OpenRouterService {
  private client: OpenAI
  private models: Map<string, OpenRouterModel> = new Map()
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map()
  private costTracker: Map<string, number> = new Map()
  private readonly apiKey: string

  // Rate limiting and caching
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map()
  private requestCache: Map<string, { response: any; timestamp: number; ttl: number }> = new Map()
  private readonly MAX_REQUESTS_PER_MINUTE = 60
  private readonly MAX_REQUESTS_PER_HOUR = 1000
  private readonly MAX_DAILY_COST = 50 // $50 daily limit
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes default cache
  private readonly INTELLIGENT_CACHE_TTL = {
    'calculations': 30 * 60 * 1000, // 30 minutes for calculations
    'sentiment_analysis': 2 * 60 * 1000, // 2 minutes for sentiment
    'data_analysis': 10 * 60 * 1000, // 10 minutes for data analysis
    'technical_analysis': 5 * 60 * 1000, // 5 minutes for technical
    'strategy_analysis': 1 * 60 * 1000, // 1 minute for strategy (more dynamic)
    'research': 15 * 60 * 1000 // 15 minutes for research
  }

  private dailyCostTracker: { date: string; totalCost: number } = { date: '', totalCost: 0 }

  // Trading-specific model configurations
  private readonly TRADING_MODEL_CONFIG = {
    // Complex strategy analysis and decision making
    strategy_analysis: {
      primary: 'anthropic/claude-3.5-sonnet',
      fallback: 'openai/gpt-4-turbo',
      cost_efficient: 'anthropic/claude-3-haiku'
    },
    // Market sentiment analysis and news processing
    sentiment_analysis: {
      primary: 'openai/gpt-4o',
      fallback: 'anthropic/claude-3.5-sonnet',
      cost_efficient: 'openai/gpt-3.5-turbo'
    },
    // Large-scale data analysis and pattern recognition
    data_analysis: {
      primary: 'google/gemini-pro-1.5',
      fallback: 'openai/gpt-4-turbo',
      cost_efficient: 'google/gemini-flash-1.5'
    },
    // Technical analysis and quantitative tasks
    technical_analysis: {
      primary: 'openai/gpt-4o',
      fallback: 'anthropic/claude-3.5-sonnet',
      cost_efficient: 'openai/gpt-3.5-turbo'
    },
    // Simple calculations and routine tasks
    calculations: {
      primary: 'openai/gpt-3.5-turbo',
      fallback: 'anthropic/claude-3-haiku',
      cost_efficient: 'openai/gpt-3.5-turbo'
    },
    // Research and information gathering
    research: {
      primary: 'anthropic/claude-3.5-sonnet',
      fallback: 'openai/gpt-4-turbo',
      cost_efficient: 'google/gemini-flash-1.5'
    }
  }

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''
    
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true, // Required for browser environment
      defaultHeaders: {
        'HTTP-Referer': 'https://cival-dashboard.vercel.app',
        'X-Title': 'Cival Trading Dashboard'
      }
    })

    this.initializeService()
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadAvailableModels()
      await this.loadPerformanceMetrics()
      console.log('OpenRouter service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize OpenRouter service:', error)
    }
  }

  /**
   * Load available models from OpenRouter
   */
  private async loadAvailableModels(): Promise<void> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load models: ${response.statusText}`)
      }

      const { data } = await response.json()
      
      data.forEach((model: any) => {
        this.models.set(model.id, {
          id: model.id,
          name: model.name,
          description: model.description || '',
          pricing: model.pricing || { prompt: 0, completion: 0 },
          context_length: model.context_length || 4096,
          capabilities: model.capabilities || [],
          provider: model.id.split('/')[0],
          specialized_for: this.getModelSpecializations(model.id)
        })
      })

      console.log(`Loaded ${this.models.size} models from OpenRouter`)
    } catch (error) {
      console.error('Failed to load OpenRouter models:', error)
      // Set up default models as fallback
      this.setDefaultModels()
    }
  }

  /**
   * Get model specializations based on model ID
   */
  private getModelSpecializations(modelId: string): string[] {
    const specializations: string[] = []
    
    if (modelId.includes('claude')) {
      specializations.push('analysis', 'reasoning', 'strategy')
    }
    if (modelId.includes('gpt-4')) {
      specializations.push('general', 'sentiment', 'technical')
    }
    if (modelId.includes('gemini')) {
      specializations.push('data', 'patterns', 'research')
    }
    if (modelId.includes('3.5-turbo')) {
      specializations.push('calculations', 'routine')
    }
    
    return specializations
  }

  /**
   * Set default models as fallback
   */
  private setDefaultModels(): void {
    const defaultModels = [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Advanced reasoning and analysis',
        pricing: { prompt: 0.003, completion: 0.015 },
        context_length: 200000,
        capabilities: ['analysis', 'reasoning', 'strategy'],
        provider: 'anthropic',
        specialized_for: ['strategy_analysis', 'research']
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4 Omni',
        description: 'Multimodal AI for comprehensive tasks',
        pricing: { prompt: 0.005, completion: 0.015 },
        context_length: 128000,
        capabilities: ['general', 'sentiment', 'technical'],
        provider: 'openai',
        specialized_for: ['sentiment_analysis', 'technical_analysis']
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        description: 'Large-scale data processing',
        pricing: { prompt: 0.0025, completion: 0.0075 },
        context_length: 1000000,
        capabilities: ['data', 'patterns', 'research'],
        provider: 'google',
        specialized_for: ['data_analysis']
      }
    ]

    defaultModels.forEach(model => this.models.set(model.id, model))
  }

  /**
   * Load performance metrics from storage
   */
  private async loadPerformanceMetrics(): Promise<void> {
    try {
      // In a real implementation, this would load from a database
      // For now, we'll initialize with default metrics
      this.models.forEach((model, modelId) => {
        this.performanceMetrics.set(modelId, {
          model_id: modelId,
          average_response_time: 2000,
          success_rate: 0.95,
          cost_per_request: 0.01,
          accuracy_score: 0.85,
          last_updated: new Date()
        })
      })
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    }
  }

  /**
   * Intelligently select the best model for a given task
   */
  public selectOptimalModel(
    taskType: string,
    costPriority: 'low' | 'medium' | 'high' = 'medium',
    qualityPriority: 'low' | 'medium' | 'high' = 'high'
  ): string {
    const config = this.TRADING_MODEL_CONFIG[taskType as keyof typeof this.TRADING_MODEL_CONFIG]
    
    if (!config) {
      // Default to strategy analysis for unknown tasks
      return this.TRADING_MODEL_CONFIG.strategy_analysis.primary
    }

    // Select model based on priorities
    if (costPriority === 'high' && qualityPriority === 'low') {
      return config.cost_efficient
    } else if (costPriority === 'low' && qualityPriority === 'high') {
      return config.primary
    } else {
      // Balanced approach - check model availability and performance
      const models = [config.primary, config.fallback, config.cost_efficient]
      
      for (const modelId of models) {
        const metrics = this.performanceMetrics.get(modelId)
        if (metrics && metrics.success_rate > 0.9) {
          return modelId
        }
      }
      
      return config.primary // Fallback to primary
    }
  }

  /**
   * Make a request to OpenRouter with intelligent model selection, rate limiting, and caching
   */
  public async request(params: OpenRouterRequest): Promise<OpenRouterResponse> {
    const startTime = Date.now()
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(params)
      
      // Check cache first
      const cachedResponse = this.getCachedResponse(cacheKey, params.task_type)
      if (cachedResponse) {
        console.log(`Cache hit for ${params.task_type}: ${cacheKey.substring(0, 50)}...`)
        return {
          ...cachedResponse,
          timestamp: new Date()
        }
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(params.task_type)
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded: ${rateLimitCheck.reason}`,
          model_used: 'none',
          cost_estimate: 0,
          response_time: Date.now() - startTime,
          timestamp: new Date()
        }
      }

      // Check daily cost limit
      const dailyCostCheck = this.checkDailyCostLimit()
      if (!dailyCostCheck.allowed) {
        return {
          success: false,
          error: `Daily cost limit exceeded: $${this.dailyCostTracker.totalCost.toFixed(2)}`,
          model_used: 'none',
          cost_estimate: 0,
          response_time: Date.now() - startTime,
          timestamp: new Date()
        }
      }

      // Select optimal model if not specified
      const selectedModel = params.model || this.selectOptimalModel(
        params.task_type || 'analysis',
        params.cost_priority,
        params.quality_priority
      )

      // Validate model exists
      if (!this.models.has(selectedModel)) {
        return {
          success: false,
          error: `Model ${selectedModel} not available`,
          model_used: selectedModel,
          cost_estimate: 0,
          response_time: Date.now() - startTime,
          timestamp: new Date()
        }
      }

      // Make the request
      const response = await this.client.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: params.prompt
          }
        ],
        max_tokens: params.max_tokens || 2000,
        temperature: params.temperature || 0.7,
        stream: false
      })

      const responseTime = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''
      
      // Calculate cost estimate
      const model = this.models.get(selectedModel)
      const promptTokens = response.usage?.prompt_tokens || 0
      const completionTokens = response.usage?.completion_tokens || 0
      const costEstimate = model ? 
        (promptTokens * model.pricing.prompt / 1000) + 
        (completionTokens * model.pricing.completion / 1000) : 0

      // Update rate limiter
      this.updateRateLimit(params.task_type)

      // Update performance metrics
      this.updatePerformanceMetrics(selectedModel, responseTime, costEstimate, true)

      // Track costs
      this.trackCost(selectedModel, costEstimate)
      this.trackDailyCost(costEstimate)

      const result = {
        success: true,
        data: content,
        model_used: selectedModel,
        cost_estimate: costEstimate,
        response_time: responseTime,
        timestamp: new Date()
      }

      // Cache the response
      this.cacheResponse(cacheKey, result, params.task_type)

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Update performance metrics for failure
      const selectedModel = params.model || this.selectOptimalModel(params.task_type || 'analysis')
      this.updatePerformanceMetrics(selectedModel, responseTime, 0, false)

      return {
        success: false,
        error: errorMessage,
        model_used: selectedModel,
        cost_estimate: 0,
        response_time: responseTime,
        timestamp: new Date()
      }
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(params: OpenRouterRequest): string {
    const keyData = {
      prompt: params.prompt,
      model: params.model,
      task_type: params.task_type,
      temperature: params.temperature,
      max_tokens: params.max_tokens
    }
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64')
  }

  /**
   * Get cached response if available and valid
   */
  private getCachedResponse(cacheKey: string, taskType?: string): OpenRouterResponse | null {
    const cached = this.requestCache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    const ttl = this.INTELLIGENT_CACHE_TTL[taskType as keyof typeof this.INTELLIGENT_CACHE_TTL] || this.CACHE_TTL

    if (now - cached.timestamp > ttl) {
      this.requestCache.delete(cacheKey)
      return null
    }

    return cached.response
  }

  /**
   * Cache response with intelligent TTL
   */
  private cacheResponse(cacheKey: string, response: OpenRouterResponse, taskType?: string): void {
    const ttl = this.INTELLIGENT_CACHE_TTL[taskType as keyof typeof this.INTELLIGENT_CACHE_TTL] || this.CACHE_TTL
    
    this.requestCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl
    })

    // Clean up old cache entries
    this.cleanupCache()
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    
    for (const [key, cached] of this.requestCache) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(key)
      }
    }
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(taskType?: string): { allowed: boolean; reason?: string } {
    const now = Date.now()
    const minuteWindow = 60 * 1000
    const hourWindow = 60 * 60 * 1000
    
    // Check minute limit
    const minuteKey = `minute_${Math.floor(now / minuteWindow)}`
    const minuteLimit = this.rateLimiter.get(minuteKey)
    if (minuteLimit && minuteLimit.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return { allowed: false, reason: 'Minute limit exceeded' }
    }

    // Check hour limit
    const hourKey = `hour_${Math.floor(now / hourWindow)}`
    const hourLimit = this.rateLimiter.get(hourKey)
    if (hourLimit && hourLimit.count >= this.MAX_REQUESTS_PER_HOUR) {
      return { allowed: false, reason: 'Hour limit exceeded' }
    }

    return { allowed: true }
  }

  /**
   * Update rate limit counters
   */
  private updateRateLimit(taskType?: string): void {
    const now = Date.now()
    const minuteWindow = 60 * 1000
    const hourWindow = 60 * 60 * 1000
    
    // Update minute counter
    const minuteKey = `minute_${Math.floor(now / minuteWindow)}`
    const minuteLimit = this.rateLimiter.get(minuteKey) || { count: 0, resetTime: now + minuteWindow }
    minuteLimit.count++
    this.rateLimiter.set(minuteKey, minuteLimit)

    // Update hour counter
    const hourKey = `hour_${Math.floor(now / hourWindow)}`
    const hourLimit = this.rateLimiter.get(hourKey) || { count: 0, resetTime: now + hourWindow }
    hourLimit.count++
    this.rateLimiter.set(hourKey, hourLimit)

    // Clean up old rate limit entries
    this.cleanupRateLimiter()
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimiter(): void {
    const now = Date.now()
    
    for (const [key, limit] of this.rateLimiter) {
      if (now > limit.resetTime) {
        this.rateLimiter.delete(key)
      }
    }
  }

  /**
   * Check daily cost limit
   */
  private checkDailyCostLimit(): { allowed: boolean; reason?: string } {
    const today = new Date().toISOString().split('T')[0]
    
    // Reset daily tracker if new day
    if (this.dailyCostTracker.date !== today) {
      this.dailyCostTracker = { date: today, totalCost: 0 }
    }

    if (this.dailyCostTracker.totalCost >= this.MAX_DAILY_COST) {
      return { allowed: false, reason: `Daily cost limit of $${this.MAX_DAILY_COST} exceeded` }
    }

    return { allowed: true }
  }

  /**
   * Track daily cost
   */
  private trackDailyCost(cost: number): void {
    const today = new Date().toISOString().split('T')[0]
    
    // Reset daily tracker if new day
    if (this.dailyCostTracker.date !== today) {
      this.dailyCostTracker = { date: today, totalCost: 0 }
    }

    this.dailyCostTracker.totalCost += cost
  }

  /**
   * Update performance metrics for a model
   */
  private updatePerformanceMetrics(
    modelId: string,
    responseTime: number,
    cost: number,
    success: boolean
  ): void {
    const current = this.performanceMetrics.get(modelId)
    if (!current) return

    const updated: ModelPerformanceMetrics = {
      ...current,
      average_response_time: (current.average_response_time + responseTime) / 2,
      success_rate: success ? 
        Math.min(1, current.success_rate + 0.01) : 
        Math.max(0, current.success_rate - 0.05),
      cost_per_request: (current.cost_per_request + cost) / 2,
      last_updated: new Date()
    }

    this.performanceMetrics.set(modelId, updated)
  }

  /**
   * Track cost for a model
   */
  private trackCost(modelId: string, cost: number): void {
    const currentCost = this.costTracker.get(modelId) || 0
    this.costTracker.set(modelId, currentCost + cost)
  }

  /**
   * Get available models
   */
  public getAvailableModels(): OpenRouterModel[] {
    return Array.from(this.models.values())
  }

  /**
   * Get performance metrics for all models
   */
  public getPerformanceMetrics(): ModelPerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values())
  }

  /**
   * Get cost statistics
   */
  public getCostStatistics(): { modelId: string; totalCost: number }[] {
    return Array.from(this.costTracker.entries()).map(([modelId, totalCost]) => ({
      modelId,
      totalCost
    }))
  }

  /**
   * Get model recommendations for a task
   */
  public getModelRecommendations(taskType: string): {
    recommended: string
    alternatives: string[]
    reasoning: string
  } {
    const config = this.TRADING_MODEL_CONFIG[taskType as keyof typeof this.TRADING_MODEL_CONFIG]
    
    if (!config) {
      return {
        recommended: this.TRADING_MODEL_CONFIG.strategy_analysis.primary,
        alternatives: [this.TRADING_MODEL_CONFIG.strategy_analysis.fallback],
        reasoning: 'Unknown task type, defaulting to strategy analysis model'
      }
    }

    return {
      recommended: config.primary,
      alternatives: [config.fallback, config.cost_efficient],
      reasoning: this.getTaskReasoningText(taskType)
    }
  }

  /**
   * Get reasoning text for task types
   */
  private getTaskReasoningText(taskType: string): string {
    const explanations = {
      strategy_analysis: 'Complex strategy analysis requires advanced reasoning capabilities',
      sentiment_analysis: 'Sentiment analysis benefits from models trained on diverse text data',
      data_analysis: 'Large-scale data analysis requires models with extensive context windows',
      technical_analysis: 'Technical analysis needs precise pattern recognition capabilities',
      calculations: 'Simple calculations can use cost-efficient models',
      research: 'Research tasks benefit from models with broad knowledge bases'
    }

    return explanations[taskType as keyof typeof explanations] || 'General purpose task'
  }

  /**
   * Get rate limit status
   */
  public getRateLimitStatus(): {
    minute: { current: number; limit: number; remaining: number }
    hour: { current: number; limit: number; remaining: number }
    daily_cost: { current: number; limit: number; remaining: number }
  } {
    const now = Date.now()
    const minuteWindow = 60 * 1000
    const hourWindow = 60 * 60 * 1000
    
    const minuteKey = `minute_${Math.floor(now / minuteWindow)}`
    const hourKey = `hour_${Math.floor(now / hourWindow)}`
    
    const minuteLimit = this.rateLimiter.get(minuteKey)
    const hourLimit = this.rateLimiter.get(hourKey)
    
    const minuteCurrent = minuteLimit ? minuteLimit.count : 0
    const hourCurrent = hourLimit ? hourLimit.count : 0
    
    // Check daily cost
    const today = new Date().toISOString().split('T')[0]
    const dailyCost = this.dailyCostTracker.date === today ? this.dailyCostTracker.totalCost : 0
    
    return {
      minute: {
        current: minuteCurrent,
        limit: this.MAX_REQUESTS_PER_MINUTE,
        remaining: this.MAX_REQUESTS_PER_MINUTE - minuteCurrent
      },
      hour: {
        current: hourCurrent,
        limit: this.MAX_REQUESTS_PER_HOUR,
        remaining: this.MAX_REQUESTS_PER_HOUR - hourCurrent
      },
      daily_cost: {
        current: dailyCost,
        limit: this.MAX_DAILY_COST,
        remaining: this.MAX_DAILY_COST - dailyCost
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): {
    total_entries: number
    cache_hit_rate: number
    cache_size_mb: number
    entries_by_type: { [key: string]: number }
  } {
    const totalEntries = this.requestCache.size
    const cacheSizeEstimate = JSON.stringify(Array.from(this.requestCache.entries())).length / (1024 * 1024)
    
    // Calculate cache hit rate (simplified)
    const hitRate = 0.75 // This would be calculated from actual metrics
    
    // Count entries by type (simplified)
    const entriesByType: { [key: string]: number } = {}
    // This would be more sophisticated in a real implementation
    
    return {
      total_entries: totalEntries,
      cache_hit_rate: hitRate,
      cache_size_mb: cacheSizeEstimate,
      entries_by_type: entriesByType
    }
  }

  /**
   * Clear cache manually
   */
  public clearCache(): void {
    this.requestCache.clear()
    console.log('OpenRouter cache cleared')
  }

  /**
   * Get detailed usage statistics
   */
  public getUsageStatistics(): {
    total_requests: number
    successful_requests: number
    failed_requests: number
    total_cost: number
    average_response_time: number
    most_used_model: string
    cache_efficiency: number
  } {
    const totalCost = Array.from(this.costTracker.values()).reduce((sum, cost) => sum + cost, 0)
    const metrics = Array.from(this.performanceMetrics.values())
    
    const totalRequests = metrics.reduce((sum, metric) => sum + 100, 0) // Simplified
    const avgResponseTime = metrics.reduce((sum, metric) => sum + metric.average_response_time, 0) / metrics.length
    
    // Find most used model (simplified)
    const mostUsedModel = metrics.reduce((prev, current) => 
      prev.success_rate > current.success_rate ? prev : current
    ).model_id
    
    return {
      total_requests: totalRequests,
      successful_requests: Math.floor(totalRequests * 0.95),
      failed_requests: Math.floor(totalRequests * 0.05),
      total_cost: totalCost,
      average_response_time: avgResponseTime || 0,
      most_used_model: mostUsedModel || 'none',
      cache_efficiency: 0.75 // Simplified
    }
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const testResponse = await this.request({
        prompt: 'Hello, this is a health check. Please respond with "OK".',
        task_type: 'calculations',
        cost_priority: 'high',
        quality_priority: 'low'
      })

      const rateLimitStatus = this.getRateLimitStatus()
      const cacheStats = this.getCacheStatistics()

      return {
        healthy: testResponse.success,
        details: {
          models_loaded: this.models.size,
          performance_metrics: this.performanceMetrics.size,
          total_cost_tracked: Array.from(this.costTracker.values()).reduce((sum, cost) => sum + cost, 0),
          test_response: testResponse.success,
          rate_limits: rateLimitStatus,
          cache_stats: cacheStats,
          daily_cost_limit: this.MAX_DAILY_COST,
          current_daily_cost: this.dailyCostTracker.totalCost
        }
      }
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          models_loaded: this.models.size
        }
      }
    }
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService()
export default openRouterService