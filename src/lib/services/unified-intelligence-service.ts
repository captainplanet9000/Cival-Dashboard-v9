/**
 * Unified Intelligence Service
 * Combines OpenRouter LLM capabilities with SerpAPI web intelligence
 * Provides intelligent routing and cost optimization for trading AI
 */

import { openRouterService, OpenRouterRequest, OpenRouterResponse } from './openrouter-service'
import { serpApiService, SerpAPIRequest, SerpAPIResponse, MarketNewsResult } from './serpapi-service'

export interface UnifiedIntelligenceRequest {
  task: string
  prompt: string
  context?: {
    symbols?: string[]
    timeframe?: string
    market_data?: any
    strategy_type?: string
  }
  preferences?: {
    use_web_search?: boolean
    use_llm_analysis?: boolean
    cost_priority?: 'low' | 'medium' | 'high'
    quality_priority?: 'low' | 'medium' | 'high'
    max_cost?: number
  }
}

export interface UnifiedIntelligenceResponse {
  success: boolean
  data?: {
    analysis?: string
    web_results?: any[]
    sources?: string[]
    confidence?: number
    recommendations?: string[]
  }
  metadata?: {
    llm_used?: string
    web_searches?: number
    total_cost?: number
    processing_time?: number
    cache_hits?: number
  }
  error?: string
  timestamp: Date
}

export interface IntelligenceTask {
  id: string
  type: 'market_analysis' | 'news_analysis' | 'sentiment_analysis' | 'research' | 'strategy_generation' | 'risk_assessment'
  priority: 'low' | 'medium' | 'high'
  web_search_required: boolean
  llm_analysis_required: boolean
  estimated_cost: number
  complexity_score: number
}

export class UnifiedIntelligenceService {
  private taskQueue: IntelligenceTask[] = []
  private processingTasks: Map<string, boolean> = new Map()
  private taskHistory: Map<string, UnifiedIntelligenceResponse> = new Map()
  
  // Task routing configuration
  private readonly TASK_ROUTING = {
    'market_analysis': {
      web_search: true,
      llm_analysis: true,
      web_task: 'financial_news',
      llm_task: 'data_analysis',
      complexity: 0.8
    },
    'news_analysis': {
      web_search: true,
      llm_analysis: true,
      web_task: 'financial_news',
      llm_task: 'sentiment_analysis',
      complexity: 0.6
    },
    'sentiment_analysis': {
      web_search: true,
      llm_analysis: true,
      web_task: 'sentiment_analysis',
      llm_task: 'sentiment_analysis',
      complexity: 0.5
    },
    'research': {
      web_search: true,
      llm_analysis: true,
      web_task: 'company_research',
      llm_task: 'research',
      complexity: 0.9
    },
    'strategy_generation': {
      web_search: false,
      llm_analysis: true,
      web_task: null,
      llm_task: 'strategy_analysis',
      complexity: 0.7
    },
    'risk_assessment': {
      web_search: true,
      llm_analysis: true,
      web_task: 'regulatory_updates',
      llm_task: 'data_analysis',
      complexity: 0.8
    }
  }

  constructor() {
    this.initializeService()
  }

  private async initializeService(): Promise<void> {
    console.log('Unified Intelligence Service initialized')
    
    // Start task processor
    this.startTaskProcessor()
  }

  /**
   * Process unified intelligence request
   */
  public async processRequest(request: UnifiedIntelligenceRequest): Promise<UnifiedIntelligenceResponse> {
    const startTime = Date.now()
    
    try {
      // Determine task type
      const taskType = this.determineTaskType(request.task, request.prompt)
      
      // Create task
      const task: IntelligenceTask = {
        id: this.generateTaskId(),
        type: taskType,
        priority: this.determinePriority(request),
        web_search_required: this.shouldUseWebSearch(request, taskType),
        llm_analysis_required: this.shouldUseLLMAnalysis(request, taskType),
        estimated_cost: this.estimateCost(request, taskType),
        complexity_score: this.TASK_ROUTING[taskType]?.complexity || 0.5
      }

      // Check if task is already processing
      if (this.processingTasks.has(task.id)) {
        return {
          success: false,
          error: 'Task already processing',
          timestamp: new Date()
        }
      }

      // Process the task
      this.processingTasks.set(task.id, true)
      
      const result = await this.executeTask(task, request)
      
      // Calculate metadata
      const processingTime = Date.now() - startTime
      result.metadata = {
        ...result.metadata,
        processing_time: processingTime,
        total_cost: this.calculateTotalCost(result)
      }

      // Store in history
      this.taskHistory.set(task.id, result)

      // Clean up
      this.processingTasks.delete(task.id)

      return result
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processing_time: processingTime,
          total_cost: 0
        },
        timestamp: new Date()
      }
    }
  }

  /**
   * Execute a task using appropriate services
   */
  private async executeTask(task: IntelligenceTask, request: UnifiedIntelligenceRequest): Promise<UnifiedIntelligenceResponse> {
    const results: any = {
      web_results: [],
      analysis: '',
      sources: [],
      confidence: 0,
      recommendations: []
    }

    const metadata = {
      llm_used: '',
      web_searches: 0,
      cache_hits: 0
    }

    try {
      // Step 1: Web search if required
      if (task.web_search_required) {
        const webResults = await this.performWebSearch(task, request)
        results.web_results = webResults.data || []
        results.sources = this.extractSources(webResults)
        metadata.web_searches = 1
        metadata.cache_hits += webResults.cached ? 1 : 0
      }

      // Step 2: LLM analysis if required
      if (task.llm_analysis_required) {
        const llmResults = await this.performLLMAnalysis(task, request, results.web_results)
        results.analysis = llmResults.data || ''
        results.confidence = this.calculateConfidence(llmResults, results.web_results)
        results.recommendations = this.extractRecommendations(llmResults.data || '')
        metadata.llm_used = llmResults.model_used || ''
        metadata.cache_hits += llmResults.cached ? 1 : 0
      }

      // Step 3: Synthesize results if both web and LLM were used
      if (task.web_search_required && task.llm_analysis_required) {
        results.analysis = await this.synthesizeResults(results.analysis, results.web_results, task)
        results.confidence = Math.min(results.confidence + 0.1, 1.0) // Boost confidence for combined analysis
      }

      return {
        success: true,
        data: results,
        metadata,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task execution failed',
        metadata,
        timestamp: new Date()
      }
    }
  }

  /**
   * Perform web search using SerpAPI
   */
  private async performWebSearch(task: IntelligenceTask, request: UnifiedIntelligenceRequest): Promise<SerpAPIResponse> {
    const taskConfig = this.TASK_ROUTING[task.type]
    
    if (task.type === 'market_analysis' || task.type === 'news_analysis') {
      return await serpApiService.searchFinancialNews(
        request.prompt,
        request.context?.symbols
      )
    } else if (task.type === 'sentiment_analysis') {
      return await serpApiService.monitorMarketSentiment(
        request.context?.symbols || []
      )
    } else if (task.type === 'research') {
      // Extract company name from prompt
      const companyName = this.extractCompanyName(request.prompt)
      const ticker = request.context?.symbols?.[0]
      
      return await serpApiService.searchCompanyResearch(companyName, ticker)
    } else if (task.type === 'risk_assessment') {
      return await serpApiService.searchRegulatoryUpdates(request.prompt)
    }

    // Default search
    return await serpApiService.search({
      query: request.prompt,
      search_type: 'search',
      num_results: 10,
      task_type: taskConfig?.web_task || 'general'
    })
  }

  /**
   * Perform LLM analysis using OpenRouter
   */
  private async performLLMAnalysis(task: IntelligenceTask, request: UnifiedIntelligenceRequest, webResults: any[]): Promise<OpenRouterResponse> {
    const taskConfig = this.TASK_ROUTING[task.type]
    
    // Build enhanced prompt with web context
    let enhancedPrompt = request.prompt
    
    if (webResults.length > 0) {
      const contextSummary = this.buildContextSummary(webResults, task.type)
      enhancedPrompt = `${request.prompt}\n\nContext from web search:\n${contextSummary}`
    }

    // Add trading context if provided
    if (request.context) {
      enhancedPrompt += `\n\nTrading Context:\n`
      if (request.context.symbols) {
        enhancedPrompt += `Symbols: ${request.context.symbols.join(', ')}\n`
      }
      if (request.context.timeframe) {
        enhancedPrompt += `Timeframe: ${request.context.timeframe}\n`
      }
      if (request.context.strategy_type) {
        enhancedPrompt += `Strategy Type: ${request.context.strategy_type}\n`
      }
    }

    const llmRequest: OpenRouterRequest = {
      prompt: enhancedPrompt,
      task_type: taskConfig?.llm_task || 'analysis',
      cost_priority: request.preferences?.cost_priority || 'medium',
      quality_priority: request.preferences?.quality_priority || 'high',
      max_tokens: this.getMaxTokensForTask(task.type),
      temperature: this.getTemperatureForTask(task.type)
    }

    return await openRouterService.request(llmRequest)
  }

  /**
   * Synthesize results from web search and LLM analysis
   */
  private async synthesizeResults(analysis: string, webResults: any[], task: IntelligenceTask): Promise<string> {
    const synthesisPrompt = `
Please synthesize the following analysis with web search results:

Analysis: ${analysis}

Web Results Summary: ${JSON.stringify(webResults.slice(0, 5))}

Provide a comprehensive synthesis that combines the AI analysis with real-world data from the web search.
Focus on actionable insights for trading decisions.
`

    const synthesisRequest: OpenRouterRequest = {
      prompt: synthesisPrompt,
      task_type: 'analysis',
      cost_priority: 'medium',
      quality_priority: 'high',
      max_tokens: 1000,
      temperature: 0.3
    }

    const synthesisResponse = await openRouterService.request(synthesisRequest)
    return synthesisResponse.data || analysis
  }

  /**
   * Determine task type from request
   */
  private determineTaskType(task: string, prompt: string): keyof typeof this.TASK_ROUTING {
    const taskLower = task.toLowerCase()
    const promptLower = prompt.toLowerCase()
    
    if (taskLower.includes('market') || taskLower.includes('analysis')) {
      return 'market_analysis'
    } else if (taskLower.includes('news') || promptLower.includes('news')) {
      return 'news_analysis'
    } else if (taskLower.includes('sentiment') || promptLower.includes('sentiment')) {
      return 'sentiment_analysis'
    } else if (taskLower.includes('research') || promptLower.includes('research')) {
      return 'research'
    } else if (taskLower.includes('strategy') || promptLower.includes('strategy')) {
      return 'strategy_generation'
    } else if (taskLower.includes('risk') || promptLower.includes('risk')) {
      return 'risk_assessment'
    }
    
    return 'market_analysis' // Default
  }

  /**
   * Determine priority based on request
   */
  private determinePriority(request: UnifiedIntelligenceRequest): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'immediate', 'breaking', 'alert']
    const highKeywords = ['important', 'critical', 'significant']
    
    const text = (request.task + ' ' + request.prompt).toLowerCase()
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'high'
    } else if (highKeywords.some(keyword => text.includes(keyword))) {
      return 'high'
    } else if (request.context?.symbols && request.context.symbols.length > 0) {
      return 'medium'
    }
    
    return 'medium'
  }

  /**
   * Determine if web search should be used
   */
  private shouldUseWebSearch(request: UnifiedIntelligenceRequest, taskType: keyof typeof this.TASK_ROUTING): boolean {
    const preferences = request.preferences
    
    if (preferences?.use_web_search === false) {
      return false
    }
    
    if (preferences?.use_web_search === true) {
      return true
    }
    
    return this.TASK_ROUTING[taskType]?.web_search || false
  }

  /**
   * Determine if LLM analysis should be used
   */
  private shouldUseLLMAnalysis(request: UnifiedIntelligenceRequest, taskType: keyof typeof this.TASK_ROUTING): boolean {
    const preferences = request.preferences
    
    if (preferences?.use_llm_analysis === false) {
      return false
    }
    
    if (preferences?.use_llm_analysis === true) {
      return true
    }
    
    return this.TASK_ROUTING[taskType]?.llm_analysis || false
  }

  /**
   * Estimate cost for task
   */
  private estimateCost(request: UnifiedIntelligenceRequest, taskType: keyof typeof this.TASK_ROUTING): number {
    let cost = 0
    
    const taskConfig = this.TASK_ROUTING[taskType]
    
    if (taskConfig?.web_search) {
      cost += 0.01 // SerpAPI cost per search
    }
    
    if (taskConfig?.llm_analysis) {
      cost += 0.05 // Estimated LLM cost
    }
    
    return cost
  }

  /**
   * Extract sources from web results
   */
  private extractSources(webResults: SerpAPIResponse): string[] {
    const sources: string[] = []
    
    if (webResults.news_results) {
      sources.push(...webResults.news_results.map((item: any) => item.source).filter(Boolean))
    }
    
    if (webResults.organic_results) {
      sources.push(...webResults.organic_results.map((item: any) => item.source).filter(Boolean))
    }
    
    return [...new Set(sources)] // Remove duplicates
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(llmResults: OpenRouterResponse, webResults: any[]): number {
    let confidence = 0.5 // Base confidence
    
    // Boost confidence if LLM analysis was successful
    if (llmResults.success) {
      confidence += 0.3
    }
    
    // Boost confidence based on web results quality
    if (webResults.length > 0) {
      confidence += Math.min(0.2, webResults.length * 0.02)
    }
    
    // Boost confidence for financial sources
    const financialSources = webResults.filter(item => 
      item.source && ['bloomberg', 'reuters', 'cnbc', 'marketwatch'].some(source => 
        item.source.toLowerCase().includes(source)
      )
    )
    
    if (financialSources.length > 0) {
      confidence += 0.2
    }
    
    return Math.min(1.0, confidence)
  }

  /**
   * Extract recommendations from analysis
   */
  private extractRecommendations(analysis: string): string[] {
    const recommendations: string[] = []
    
    // Look for common recommendation patterns
    const patterns = [
      /recommend[s]?\s+([^.]+)/gi,
      /suggest[s]?\s+([^.]+)/gi,
      /consider\s+([^.]+)/gi,
      /should\s+([^.]+)/gi
    ]
    
    for (const pattern of patterns) {
      const matches = analysis.match(pattern)
      if (matches) {
        recommendations.push(...matches.slice(0, 3)) // Limit to 3 per pattern
      }
    }
    
    return recommendations.slice(0, 5) // Limit to 5 total recommendations
  }

  /**
   * Build context summary from web results
   */
  private buildContextSummary(webResults: any[], taskType: string): string {
    const summaryItems: string[] = []
    
    for (const item of webResults.slice(0, 5)) { // Use top 5 results
      if (item.title && item.snippet) {
        summaryItems.push(`${item.title}: ${item.snippet}`)
      }
    }
    
    return summaryItems.join('\n\n')
  }

  /**
   * Extract company name from prompt
   */
  private extractCompanyName(prompt: string): string {
    // Simple extraction - would be more sophisticated in real implementation
    const words = prompt.split(' ')
    
    // Look for capitalized words that might be company names
    const capitalizedWords = words.filter(word => 
      word.length > 2 && 
      word[0] === word[0].toUpperCase() &&
      !['The', 'And', 'Or', 'But', 'For', 'In', 'On', 'At', 'To', 'From'].includes(word)
    )
    
    return capitalizedWords.slice(0, 2).join(' ') || 'Unknown Company'
  }

  /**
   * Get max tokens for task type
   */
  private getMaxTokensForTask(taskType: string): number {
    const tokenMap = {
      'market_analysis': 2000,
      'news_analysis': 1500,
      'sentiment_analysis': 1000,
      'research': 3000,
      'strategy_generation': 2500,
      'risk_assessment': 2000
    }
    
    return tokenMap[taskType as keyof typeof tokenMap] || 2000
  }

  /**
   * Get temperature for task type
   */
  private getTemperatureForTask(taskType: string): number {
    const tempMap = {
      'market_analysis': 0.3,
      'news_analysis': 0.2,
      'sentiment_analysis': 0.1,
      'research': 0.4,
      'strategy_generation': 0.7,
      'risk_assessment': 0.2
    }
    
    return tempMap[taskType as keyof typeof tempMap] || 0.3
  }

  /**
   * Calculate total cost
   */
  private calculateTotalCost(result: UnifiedIntelligenceResponse): number {
    let cost = 0
    
    if (result.metadata?.web_searches) {
      cost += result.metadata.web_searches * 0.01
    }
    
    if (result.metadata?.llm_used) {
      cost += 0.05 // Estimated LLM cost
    }
    
    return cost
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Start task processor (for future queue processing)
   */
  private startTaskProcessor(): void {
    // This would implement queue processing for batch tasks
    console.log('Task processor started')
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{ 
    healthy: boolean; 
    services: { openrouter: boolean; serpapi: boolean }; 
    details: any 
  }> {
    try {
      const [openRouterHealth, serpApiHealth] = await Promise.all([
        openRouterService.healthCheck(),
        serpApiService.healthCheck()
      ])

      return {
        healthy: openRouterHealth.healthy && serpApiHealth.healthy,
        services: {
          openrouter: openRouterHealth.healthy,
          serpapi: serpApiHealth.healthy
        },
        details: {
          openrouter: openRouterHealth.details,
          serpapi: serpApiHealth.details,
          task_history: this.taskHistory.size,
          processing_tasks: this.processingTasks.size
        }
      }
    } catch (error) {
      return {
        healthy: false,
        services: {
          openrouter: false,
          serpapi: false
        },
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  /**
   * Get usage statistics
   */
  public getUsageStatistics(): {
    total_tasks: number
    successful_tasks: number
    failed_tasks: number
    average_cost: number
    average_processing_time: number
    task_types: { [key: string]: number }
  } {
    const totalTasks = this.taskHistory.size
    const successfulTasks = Array.from(this.taskHistory.values()).filter(t => t.success).length
    const failedTasks = totalTasks - successfulTasks
    
    const costs = Array.from(this.taskHistory.values()).map(t => t.metadata?.total_cost || 0)
    const averageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length || 0
    
    const processingTimes = Array.from(this.taskHistory.values()).map(t => t.metadata?.processing_time || 0)
    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length || 0
    
    return {
      total_tasks: totalTasks,
      successful_tasks: successfulTasks,
      failed_tasks: failedTasks,
      average_cost: averageCost,
      average_processing_time: averageProcessingTime,
      task_types: {} // Would be calculated from task history
    }
  }
}

// Export singleton instance
export const unifiedIntelligenceService = new UnifiedIntelligenceService()
export default unifiedIntelligenceService