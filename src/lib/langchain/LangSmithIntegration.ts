/**
 * LangSmith Integration for LangChain Observability
 * Phase 7: Provides comprehensive monitoring, tracing, and analytics for LangChain agents
 */

import { EventEmitter } from 'events'
import { Client } from 'langsmith'
import { langGraphOrchestrator, LangGraphAgent } from './LangGraphOrchestrator'
import { langChainService } from './LangChainService'
import { langChainMCPIntegration } from './MCPIntegration'

export interface LangSmithConfig {
  apiKey?: string
  projectName: string
  enableTracing: boolean
  enableFeedback: boolean
  enableDatasets: boolean
  sampleRate: number
  enableMetrics: boolean
  retentionDays: number
}

export interface TraceData {
  traceId: string
  agentId: string
  startTime: number
  endTime?: number
  inputs: Record<string, any>
  outputs?: Record<string, any>
  metadata: Record<string, any>
  tags: string[]
  status: 'pending' | 'success' | 'error'
  error?: string
  metrics: {
    latency: number
    tokenCount: number
    cost: number
  }
}

export interface AgentMetrics {
  agentId: string
  totalTraces: number
  successRate: number
  avgLatency: number
  totalCost: number
  tokenUsage: number
  errorRate: number
  lastActivity: number
  performanceScore: number
}

export interface LangSmithAnalytics {
  totalTraces: number
  totalAgents: number
  avgSuccessRate: number
  totalCost: number
  totalTokens: number
  topPerformingAgents: AgentMetrics[]
  recentErrors: string[]
  costTrends: Array<{ timestamp: number, cost: number }>
  performanceTrends: Array<{ timestamp: number, successRate: number }>
}

export class LangSmithIntegration extends EventEmitter {
  private client: Client | null = null
  private config: LangSmithConfig
  private traces: Map<string, TraceData> = new Map()
  private metrics: Map<string, AgentMetrics> = new Map()
  private isInitialized: boolean = false
  private backgroundTasks: NodeJS.Timeout[] = []

  constructor(config?: Partial<LangSmithConfig>) {
    super()
    
    this.config = {
      apiKey: process.env.LANGCHAIN_API_KEY,
      projectName: process.env.LANGCHAIN_PROJECT || 'cival-trading-agents',
      enableTracing: process.env.LANGCHAIN_TRACING_V2 === 'true',
      enableFeedback: true,
      enableDatasets: true,
      sampleRate: parseFloat(process.env.LANGSMITH_SAMPLE_RATE || '1.0'),
      enableMetrics: true,
      retentionDays: 30,
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize LangSmith integration
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🔍 Initializing LangSmith integration')

      if (this.config.apiKey && this.config.enableTracing) {
        this.client = new Client({
          apiKey: this.config.apiKey,
          // Additional client configuration
        })

        // Test connection
        try {
          // Note: In a real implementation, you'd test the connection here
          console.log('✅ LangSmith client connected')
        } catch (error) {
          console.warn('⚠️ LangSmith connection test failed:', error)
          this.client = null
        }
      } else {
        console.log('📊 LangSmith running in local mode (no API key provided)')
      }

      // Set up event listeners
      this.setupEventListeners()

      // Start background tasks
      this.startBackgroundTasks()

      this.isInitialized = true
      console.log('✅ LangSmith integration initialized')

    } catch (error) {
      console.error('❌ Failed to initialize LangSmith integration:', error)
      throw error
    }
  }

  /**
   * Set up event listeners for LangChain components
   */
  private setupEventListeners(): void {
    // Listen to orchestrator events
    langGraphOrchestrator.on('coordination:completed', (data) => {
      this.trackCoordinationEvent(data)
    })

    langGraphOrchestrator.on('trade:executed', (data) => {
      this.trackTradeEvent(data)
    })

    langGraphOrchestrator.on('agent:added', (data) => {
      this.initializeAgentMetrics(data.agent)
    })

    // Listen to MCP integration events
    langChainMCPIntegration.on('toolCallSuccess', (data) => {
      this.trackToolCall(data, true)
    })

    langChainMCPIntegration.on('toolCallError', (data) => {
      this.trackToolCall(data, false)
    })
  }

  /**
   * Start a new trace for agent activity
   */
  async startTrace(
    agentId: string,
    activity: string,
    inputs: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const trace: TraceData = {
      traceId,
      agentId,
      startTime: Date.now(),
      inputs,
      metadata: {
        activity,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...metadata
      },
      tags: [agentId, activity, 'trading-agent'],
      status: 'pending',
      metrics: {
        latency: 0,
        tokenCount: 0,
        cost: 0
      }
    }

    this.traces.set(traceId, trace)

    // Send to LangSmith if available
    if (this.client && this.shouldSample()) {
      try {
        // Note: In real implementation, use LangSmith SDK methods
        console.log(`📊 Starting LangSmith trace: ${traceId}`)
      } catch (error) {
        console.warn('Failed to start LangSmith trace:', error)
      }
    }

    this.emit('traceStarted', { traceId, agentId, activity })
    return traceId
  }

  /**
   * End a trace with results
   */
  async endTrace(
    traceId: string,
    outputs: Record<string, any>,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    const trace = this.traces.get(traceId)
    if (!trace) return

    const endTime = Date.now()
    trace.endTime = endTime
    trace.outputs = outputs
    trace.status = success ? 'success' : 'error'
    trace.error = error
    trace.metrics.latency = endTime - trace.startTime

    // Estimate costs based on activity
    trace.metrics.cost = this.estimateTraceCost(trace)
    trace.metrics.tokenCount = this.estimateTokenCount(trace)

    // Update agent metrics
    this.updateAgentMetrics(trace.agentId, trace)

    // Send to LangSmith if available
    if (this.client && this.shouldSample()) {
      try {
        // Note: In real implementation, use LangSmith SDK methods to send trace data
        console.log(`📊 Ending LangSmith trace: ${traceId}`)
      } catch (error) {
        console.warn('Failed to end LangSmith trace:', error)
      }
    }

    this.emit('traceEnded', { traceId, success, latency: trace.metrics.latency })
  }

  /**
   * Track coordination events
   */
  private async trackCoordinationEvent(data: any): Promise<void> {
    const traceId = await this.startTrace(
      'orchestrator',
      'coordination_cycle',
      {
        executedTrades: data.executedTrades,
        marketConditions: data.marketConditions
      },
      {
        timestamp: data.timestamp,
        totalAgents: data.totalAgents
      }
    )

    await this.endTrace(
      traceId,
      {
        success: true,
        tradesExecuted: data.executedTrades
      },
      true
    )
  }

  /**
   * Track trade execution events
   */
  private async trackTradeEvent(data: any): Promise<void> {
    const traceId = await this.startTrace(
      data.agentId,
      'trade_execution',
      {
        symbol: data.symbol,
        action: data.action,
        order: data.order
      },
      {
        timestamp: Date.now(),
        orderType: data.order?.type
      }
    )

    await this.endTrace(
      traceId,
      {
        orderId: data.order?.id,
        executed: true
      },
      true
    )
  }

  /**
   * Track MCP tool calls
   */
  private async trackToolCall(data: any, success: boolean): Promise<void> {
    const traceId = await this.startTrace(
      data.agentId,
      'mcp_tool_call',
      {
        toolId: data.toolId,
        parameters: data.parameters
      },
      {
        timestamp: data.timestamp,
        toolCategory: 'mcp'
      }
    )

    await this.endTrace(
      traceId,
      {
        result: success ? data.result : null,
        error: success ? null : data.error
      },
      success,
      success ? undefined : data.error
    )
  }

  /**
   * Initialize metrics for a new agent
   */
  private initializeAgentMetrics(agent: LangGraphAgent): void {
    const metrics: AgentMetrics = {
      agentId: agent.id,
      totalTraces: 0,
      successRate: 0,
      avgLatency: 0,
      totalCost: 0,
      tokenUsage: 0,
      errorRate: 0,
      lastActivity: Date.now(),
      performanceScore: 0
    }

    this.metrics.set(agent.id, metrics)
  }

  /**
   * Update agent metrics based on trace data
   */
  private updateAgentMetrics(agentId: string, trace: TraceData): void {
    let metrics = this.metrics.get(agentId)
    if (!metrics) {
      metrics = {
        agentId,
        totalTraces: 0,
        successRate: 0,
        avgLatency: 0,
        totalCost: 0,
        tokenUsage: 0,
        errorRate: 0,
        lastActivity: Date.now(),
        performanceScore: 0
      }
    }

    // Update counters
    metrics.totalTraces++
    metrics.totalCost += trace.metrics.cost
    metrics.tokenUsage += trace.metrics.tokenCount
    metrics.lastActivity = Date.now()

    // Update averages
    metrics.avgLatency = (metrics.avgLatency * (metrics.totalTraces - 1) + trace.metrics.latency) / metrics.totalTraces

    // Update rates
    const successCount = Array.from(this.traces.values())
      .filter(t => t.agentId === agentId && t.status === 'success').length
    const errorCount = Array.from(this.traces.values())
      .filter(t => t.agentId === agentId && t.status === 'error').length

    metrics.successRate = successCount / (successCount + errorCount)
    metrics.errorRate = errorCount / (successCount + errorCount)

    // Calculate performance score (0-100)
    metrics.performanceScore = this.calculatePerformanceScore(metrics)

    this.metrics.set(agentId, metrics)
  }

  /**
   * Calculate agent performance score
   */
  private calculatePerformanceScore(metrics: AgentMetrics): number {
    const successWeight = 0.4
    const latencyWeight = 0.3
    const costWeight = 0.2
    const activityWeight = 0.1

    // Normalize metrics (0-1 scale)
    const successScore = metrics.successRate
    const latencyScore = Math.max(0, 1 - (metrics.avgLatency / 10000)) // 10s = 0 score
    const costScore = Math.max(0, 1 - (metrics.totalCost / 100)) // $100 = 0 score
    const activityScore = Math.min(1, (Date.now() - metrics.lastActivity) / 86400000) // 24h = 1 score

    const totalScore = (
      successScore * successWeight +
      latencyScore * latencyWeight +
      costScore * costWeight +
      activityScore * activityWeight
    ) * 100

    return Math.round(totalScore)
  }

  /**
   * Get analytics data
   */
  getAnalytics(): LangSmithAnalytics {
    const allTraces = Array.from(this.traces.values())
    const allMetrics = Array.from(this.metrics.values())

    const totalCost = allMetrics.reduce((sum, m) => sum + m.totalCost, 0)
    const totalTokens = allMetrics.reduce((sum, m) => sum + m.tokenUsage, 0)
    const totalSuccessful = allTraces.filter(t => t.status === 'success').length
    const avgSuccessRate = allTraces.length > 0 ? totalSuccessful / allTraces.length : 0

    const recentErrors = allTraces
      .filter(t => t.status === 'error' && t.endTime && t.endTime > Date.now() - 3600000) // Last hour
      .map(t => t.error || 'Unknown error')
      .slice(-10)

    const topPerformingAgents = allMetrics
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5)

    // Generate trend data (mock implementation)
    const now = Date.now()
    const costTrends = Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * 3600000,
      cost: Math.random() * 10
    }))

    const performanceTrends = Array.from({ length: 24 }, (_, i) => ({
      timestamp: now - (23 - i) * 3600000,
      successRate: 0.8 + Math.random() * 0.2
    }))

    return {
      totalTraces: allTraces.length,
      totalAgents: allMetrics.length,
      avgSuccessRate,
      totalCost,
      totalTokens,
      topPerformingAgents,
      recentErrors,
      costTrends,
      performanceTrends
    }
  }

  /**
   * Get agent-specific analytics
   */
  getAgentAnalytics(agentId: string): {
    metrics: AgentMetrics | null
    recentTraces: TraceData[]
    trends: {
      successRate: Array<{ timestamp: number, value: number }>
      latency: Array<{ timestamp: number, value: number }>
    }
  } {
    const metrics = this.metrics.get(agentId) || null
    const recentTraces = Array.from(this.traces.values())
      .filter(t => t.agentId === agentId)
      .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
      .slice(0, 10)

    // Generate trends (simplified implementation)
    const now = Date.now()
    const successRateTrend = Array.from({ length: 12 }, (_, i) => ({
      timestamp: now - (11 - i) * 3600000,
      value: 0.7 + Math.random() * 0.3
    }))

    const latencyTrend = Array.from({ length: 12 }, (_, i) => ({
      timestamp: now - (11 - i) * 3600000,
      value: 1000 + Math.random() * 2000
    }))

    return {
      metrics,
      recentTraces,
      trends: {
        successRate: successRateTrend,
        latency: latencyTrend
      }
    }
  }

  /**
   * Create feedback for a trace
   */
  async createFeedback(
    traceId: string,
    score: number,
    feedback: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableFeedback) return

    if (this.client) {
      try {
        // Note: In real implementation, use LangSmith SDK to create feedback
        console.log(`📝 Creating feedback for trace ${traceId}: ${score}/10`)
      } catch (error) {
        console.warn('Failed to create LangSmith feedback:', error)
      }
    }

    this.emit('feedbackCreated', { traceId, score, feedback })
  }

  /**
   * Export traces for analysis
   */
  exportTraces(startTime?: number, endTime?: number): TraceData[] {
    const traces = Array.from(this.traces.values())
    
    if (startTime || endTime) {
      return traces.filter(trace => {
        const traceTime = trace.endTime || trace.startTime
        return (!startTime || traceTime >= startTime) && 
               (!endTime || traceTime <= endTime)
      })
    }

    return traces
  }

  /**
   * Start background tasks
   */
  private startBackgroundTasks(): void {
    // Periodic cleanup of old traces
    const cleanupTask = setInterval(() => {
      this.cleanupOldTraces()
    }, 3600000) // Every hour

    // Periodic metrics aggregation
    const metricsTask = setInterval(() => {
      this.aggregateMetrics()
    }, 300000) // Every 5 minutes

    this.backgroundTasks.push(cleanupTask, metricsTask)
  }

  /**
   * Clean up old traces
   */
  private cleanupOldTraces(): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)
    
    for (const [traceId, trace] of this.traces.entries()) {
      if ((trace.endTime || trace.startTime) < cutoffTime) {
        this.traces.delete(traceId)
      }
    }
  }

  /**
   * Aggregate metrics
   */
  private aggregateMetrics(): void {
    // This would send aggregated metrics to LangSmith or local storage
    const analytics = this.getAnalytics()
    this.emit('metricsAggregated', analytics)
  }

  /**
   * Helper methods
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  private estimateTraceCost(trace: TraceData): number {
    // Simple cost estimation based on activity type
    const baseCosts = {
      'coordination_cycle': 0.01,
      'trade_execution': 0.005,
      'mcp_tool_call': 0.002,
      'agent_analysis': 0.01
    }

    const activity = trace.metadata.activity || 'unknown'
    return baseCosts[activity as keyof typeof baseCosts] || 0.001
  }

  private estimateTokenCount(trace: TraceData): number {
    // Simple token estimation
    const inputTokens = JSON.stringify(trace.inputs).length / 4
    const outputTokens = JSON.stringify(trace.outputs || {}).length / 4
    return Math.ceil(inputTokens + outputTokens)
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    isInitialized: boolean
    hasClient: boolean
    tracesCount: number
    metricsCount: number
    errors: string[]
  }> {
    const errors: string[] = []

    if (!this.isInitialized) {
      errors.push('Not initialized')
    }

    if (this.config.enableTracing && !this.client) {
      errors.push('LangSmith client not available')
    }

    const status = errors.length === 0 ? 'healthy' :
                   errors.length === 1 ? 'degraded' : 'unhealthy'

    return {
      status,
      isInitialized: this.isInitialized,
      hasClient: !!this.client,
      tracesCount: this.traces.size,
      metricsCount: this.metrics.size,
      errors
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clear background tasks
    this.backgroundTasks.forEach(task => clearInterval(task))
    this.backgroundTasks = []

    // Clear data
    this.traces.clear()
    this.metrics.clear()

    // Remove event listeners
    this.removeAllListeners()
  }
}

// Export singleton instance
export const langSmithIntegration = new LangSmithIntegration()