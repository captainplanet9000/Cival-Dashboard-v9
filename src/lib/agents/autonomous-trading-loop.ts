'use client'

/**
 * Autonomous Trading Loop
 * Coordinates high-frequency trading operations for autonomous agents
 */

import { EventEmitter } from 'events'
import { llmDecisionIntegrationService, type AgentDecision } from './llm-decision-integration'
import { technicalAnalysisEngine, type TechnicalSignal } from '@/lib/strategies/technical-analysis-engine'
import { agentWalletManager } from '@/lib/agents/agent-wallet-manager'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { globalThrottler } from '@/lib/utils/request-throttle'
import type { CreatedAgent } from './enhanced-agent-creation-service'

export interface TradingLoopConfig {
  agentId: string
  frequency: number // milliseconds between cycles
  strategy: string
  targetProfitPerTrade: number
  maxConcurrentOrders: number
  riskThreshold: number
  enableHighFrequency: boolean
  adaptiveFrequency: boolean
  marketDataSources: string[]
  signalThreshold: number
  executionDelay: number // milliseconds
}

export interface TradingCycle {
  id: string
  agentId: string
  timestamp: Date
  cycleNumber: number
  marketAnalysis: {
    signals: TechnicalSignal[]
    marketCondition: string
    volatility: number
    trend: 'bullish' | 'bearish' | 'sideways'
  }
  decision: AgentDecision | null
  execution: {
    attempted: boolean
    successful: boolean
    orderId?: string
    latency: number
    slippage: number
  }
  performance: {
    pnl: number
    winRate: number
    efficiency: number
  }
  nextCycle: Date
}

export interface AgentPerformanceMetrics {
  agentId: string
  totalCycles: number
  successfulExecutions: number
  averageLatency: number
  totalPnL: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  tradesPerHour: number
  signalAccuracy: number
  strategyEfficiency: number
  lastUpdate: Date
}

class AutonomousTradingLoop extends EventEmitter {
  private activeLoops: Map<string, NodeJS.Timeout> = new Map()
  private loopConfigs: Map<string, TradingLoopConfig> = new Map()
  private cycleHistory: Map<string, TradingCycle[]> = new Map()
  private performanceMetrics: Map<string, AgentPerformanceMetrics> = new Map()
  private marketDataCache: Map<string, any> = new Map()
  private executionQueue: Map<string, any[]> = new Map()
  
  constructor() {
    super()
    this.initializePerformanceTracking()
  }
  
  /**
   * Initialize performance tracking system
   */
  private initializePerformanceTracking() {
    // Update performance metrics every 5 seconds
    setInterval(() => {
      this.updateAllPerformanceMetrics()
    }, 5000)
    
    // Clean old cycle history every hour
    setInterval(() => {
      this.cleanOldCycleHistory()
    }, 3600000)
  }
  
  /**
   * Start autonomous trading loop for an agent
   */
  async startTradingLoop(agent: CreatedAgent): Promise<boolean> {
    try {
      const config: TradingLoopConfig = {
        agentId: agent.id,
        frequency: this.calculateOptimalFrequency(agent),
        strategy: agent.config.strategy.type,
        targetProfitPerTrade: agent.config.strategy.targetProfitPerTrade,
        maxConcurrentOrders: 3,
        riskThreshold: agent.config.riskLimits.maxDrawdown,
        enableHighFrequency: agent.config.strategy.frequency === 'high',
        adaptiveFrequency: agent.config.autonomous.adaptiveStrategy,
        marketDataSources: ['binance', 'coinbase', 'kraken'],
        signalThreshold: 0.6,
        executionDelay: 50 // 50ms execution delay
      }
      
      this.loopConfigs.set(agent.id, config)
      this.cycleHistory.set(agent.id, [])
      this.executionQueue.set(agent.id, [])
      this.initializeAgentPerformanceMetrics(agent.id)
      
      // Register agent with LLM decision service
      await llmDecisionIntegrationService.registerAgent(agent)
      
      // Start the trading loop
      await this.startLoop(agent.id)
      
      console.log(`Autonomous trading loop started for agent ${agent.id}`)
      return true
      
    } catch (error) {
      console.error(`Failed to start trading loop for agent ${agent.id}:`, error)
      return false
    }
  }
  
  /**
   * Stop autonomous trading loop for an agent
   */
  stopTradingLoop(agentId: string): boolean {
    const intervalId = this.activeLoops.get(agentId)
    if (intervalId) {
      clearTimeout(intervalId)
      this.activeLoops.delete(agentId)
      
      // Stop LLM decision loop
      llmDecisionIntegrationService.stopDecisionLoop(agentId)
      
      console.log(`Trading loop stopped for agent ${agentId}`)
      return true
    }
    return false
  }
  
  /**
   * Start the core trading loop for an agent
   */
  private async startLoop(agentId: string) {
    const config = this.loopConfigs.get(agentId)
    if (!config) return
    
    const tradingLoop = async () => {
      try {
        // Execute trading cycle
        const cycle = await this.executeTradingCycle(agentId)
        
        if (cycle) {
          // Store cycle in history
          this.addCycleToHistory(agentId, cycle)
          
          // Update performance metrics
          this.updateAgentPerformanceMetrics(agentId, cycle)
          
          // Emit cycle completion event
          this.emit('tradingCycle', cycle)
          
          // Adapt frequency if enabled
          if (config.adaptiveFrequency) {
            config.frequency = this.adaptFrequency(agentId, cycle)
          }
        }
        
      } catch (error) {
        console.error(`Trading loop error for agent ${agentId}:`, error)
        this.emit('tradingError', { agentId, error })
      }
      
      // Schedule next cycle
      const intervalId = setTimeout(tradingLoop, config.frequency)
      this.activeLoops.set(agentId, intervalId)
    }
    
    // Start the loop
    tradingLoop()
  }
  
  /**
   * Execute a single trading cycle
   */
  private async executeTradingCycle(agentId: string): Promise<TradingCycle | null> {
    const config = this.loopConfigs.get(agentId)
    if (!config) return null
    
    const cycleStart = Date.now()
    const cycleId = `cycle_${agentId}_${cycleStart}`
    const cycleNumber = (this.cycleHistory.get(agentId) || []).length + 1
    
    try {
      // Phase 1: Market Analysis (5-10ms)
      const marketAnalysis = await this.performMarketAnalysis(agentId)
      
      // Phase 2: Decision Making (10-20ms)
      const decision = await this.makeAutonomousDecision(agentId, marketAnalysis)
      
      // Phase 3: Execution (20-50ms)
      const execution = await this.executeDecision(agentId, decision)
      
      // Phase 4: Performance Calculation (1-2ms)
      const performance = await this.calculateCyclePerformance(agentId, execution)
      
      const cycle: TradingCycle = {
        id: cycleId,
        agentId,
        timestamp: new Date(cycleStart),
        cycleNumber,
        marketAnalysis,
        decision,
        execution,
        performance,
        nextCycle: new Date(cycleStart + config.frequency)
      }
      
      return cycle
      
    } catch (error) {
      console.error(`Trading cycle error for agent ${agentId}:`, error)
      return null
    }
  }
  
  /**
   * Perform market analysis for the trading cycle
   */
  private async performMarketAnalysis(agentId: string): Promise<TradingCycle['marketAnalysis']> {
    const config = this.loopConfigs.get(agentId)
    if (!config) throw new Error(`No config for agent ${agentId}`)
    
    try {
      // Get cached market data or fetch new
      const marketData = await this.getMarketData(config.marketDataSources)
      
      // Analyze with technical analysis engine
      const signals = technicalAnalysisEngine.analyzeWithStrategy(config.strategy, marketData)
      
      // Assess market conditions
      const marketCondition = this.assessMarketCondition(marketData)
      const volatility = this.calculateVolatility(marketData)
      const trend = this.determineTrend(marketData)
      
      return {
        signals,
        marketCondition,
        volatility,
        trend
      }
      
    } catch (error) {
      console.error(`Market analysis error for agent ${agentId}:`, error)
      return {
        signals: [],
        marketCondition: 'unknown',
        volatility: 0,
        trend: 'sideways'
      }
    }
  }
  
  /**
   * Make autonomous decision based on market analysis
   */
  private async makeAutonomousDecision(
    agentId: string, 
    marketAnalysis: TradingCycle['marketAnalysis']
  ): Promise<AgentDecision | null> {
    const config = this.loopConfigs.get(agentId)
    if (!config) return null
    
    try {
      // Filter signals by threshold
      const strongSignals = marketAnalysis.signals.filter(
        signal => signal.confidence >= config.signalThreshold
      )
      
      if (strongSignals.length === 0) {
        return null // No actionable signals
      }
      
      // Get decision from LLM service
      const decision = await llmDecisionIntegrationService.makeAutonomousDecision(agentId)
      
      // Validate decision against risk limits
      if (decision && this.validateDecisionRisk(agentId, decision)) {
        return decision
      }
      
      return null
      
    } catch (error) {
      console.error(`Decision making error for agent ${agentId}:`, error)
      return null
    }
  }
  
  /**
   * Execute trading decision
   */
  private async executeDecision(
    agentId: string, 
    decision: AgentDecision | null
  ): Promise<TradingCycle['execution']> {
    const config = this.loopConfigs.get(agentId)
    if (!config) throw new Error(`No config for agent ${agentId}`)
    
    const executionStart = Date.now()
    
    if (!decision || decision.decision.action === 'hold') {
      return {
        attempted: false,
        successful: false,
        latency: Date.now() - executionStart,
        slippage: 0
      }
    }
    
    try {
      // Add execution delay if configured
      if (config.executionDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.executionDelay))
      }
      
      // Execute through LLM decision service with throttling
      const executionResult = await globalThrottler.throttledRequest(
        async () => {
          return await llmDecisionIntegrationService.executeDecision(decision)
        },
        {
          priority: 'high',
          cacheKey: `execution_${agentId}_${Date.now()}`
        }
      )
      
      const latency = Date.now() - executionStart
      
      return {
        attempted: true,
        successful: executionResult,
        orderId: decision.executionResult?.orderId,
        latency,
        slippage: decision.executionResult?.slippage || 0
      }
      
    } catch (error) {
      console.error(`Execution error for agent ${agentId}:`, error)
      return {
        attempted: true,
        successful: false,
        latency: Date.now() - executionStart,
        slippage: 0
      }
    }
  }
  
  /**
   * Calculate cycle performance metrics
   */
  private async calculateCyclePerformance(
    agentId: string, 
    execution: TradingCycle['execution']
  ): Promise<TradingCycle['performance']> {
    try {
      // Get current wallet state
      const wallet = await agentWalletManager.getWallet(agentId)
      const currentPnL = wallet?.unrealizedPnL || 0
      
      // Get recent performance
      const recentCycles = this.getCycleHistory(agentId).slice(-10)
      const recentSuccesses = recentCycles.filter(c => c.execution.successful).length
      const winRate = recentCycles.length > 0 ? recentSuccesses / recentCycles.length : 0
      
      // Calculate efficiency (successful executions / total attempts)
      const efficiency = execution.attempted ? (execution.successful ? 1 : 0) : 0.5
      
      return {
        pnl: currentPnL,
        winRate,
        efficiency
      }
      
    } catch (error) {
      console.error(`Performance calculation error for agent ${agentId}:`, error)
      return {
        pnl: 0,
        winRate: 0,
        efficiency: 0
      }
    }
  }
  
  /**
   * Calculate optimal frequency for agent based on strategy
   */
  private calculateOptimalFrequency(agent: CreatedAgent): number {
    const baseFrequency = {
      'darvas_box': 15000,        // 15 seconds - Box formation analysis
      'williams_alligator': 8000,  // 8 seconds - Momentum tracking
      'renko_breakout': 5000,     // 5 seconds - Pure price action
      'heikin_ashi': 12000,       // 12 seconds - Trend confirmation
      'elliott_wave': 20000,      // 20 seconds - Pattern analysis
      'multi_strategy': 6000      // 6 seconds - Coordinated approach
    }
    
    let frequency = baseFrequency[agent.config.strategy.type as keyof typeof baseFrequency] || 10000
    
    // Adjust for configured frequency
    if (agent.config.strategy.frequency === 'high') {
      frequency *= 0.5 // 2x faster
    } else if (agent.config.strategy.frequency === 'low') {
      frequency *= 2 // 2x slower
    }
    
    return frequency
  }
  
  /**
   * Get market data with caching
   */
  private async getMarketData(sources: string[]): Promise<any[]> {
    const cacheKey = `market_data_${sources.join('_')}`
    const cached = this.marketDataCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < 1000) {
      return cached.data
    }
    
    // Generate mock market data for now
    const mockData = this.generateRealtimeMarketData()
    
    this.marketDataCache.set(cacheKey, {
      data: mockData,
      timestamp: Date.now()
    })
    
    return mockData
  }
  
  /**
   * Generate realtime market data for testing
   */
  private generateRealtimeMarketData(): any[] {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD']
    const data = []
    
    for (const symbol of symbols) {
      const basePrice = symbol === 'BTC/USD' ? 50000 : 
                       symbol === 'ETH/USD' ? 3000 : 
                       symbol === 'SOL/USD' ? 100 : 0.5
      
      // Create recent price action
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date(Date.now() - (5 - i) * 60000)
        const randomChange = (Math.random() - 0.5) * 0.01 // ±0.5% change
        const price = basePrice * (1 + randomChange)
        
        data.push({
          symbol,
          timestamp,
          open: price * 0.9995,
          high: price * 1.0005,
          low: price * 0.9995,
          close: price,
          volume: Math.random() * 1000000
        })
      }
    }
    
    return data
  }
  
  /**
   * Assess market condition
   */
  private assessMarketCondition(marketData: any[]): string {
    if (marketData.length === 0) return 'no_data'
    
    const volatilities = marketData.map(data => Math.abs((data.high - data.low) / data.close))
    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length
    
    if (avgVolatility > 0.02) return 'high_volatility'
    if (avgVolatility < 0.005) return 'low_volatility'
    return 'normal'
  }
  
  /**
   * Calculate market volatility
   */
  private calculateVolatility(marketData: any[]): number {
    if (marketData.length < 2) return 0
    
    const returns = []
    for (let i = 1; i < marketData.length; i++) {
      const ret = (marketData[i].close - marketData[i-1].close) / marketData[i-1].close
      returns.push(ret)
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance)
  }
  
  /**
   * Determine market trend
   */
  private determineTrend(marketData: any[]): 'bullish' | 'bearish' | 'sideways' {
    if (marketData.length < 3) return 'sideways'
    
    const recent = marketData.slice(-3)
    const totalChange = (recent[2].close - recent[0].close) / recent[0].close
    
    if (totalChange > 0.005) return 'bullish'
    if (totalChange < -0.005) return 'bearish'
    return 'sideways'
  }
  
  /**
   * Validate decision against risk limits
   */
  private validateDecisionRisk(agentId: string, decision: AgentDecision): boolean {
    const config = this.loopConfigs.get(agentId)
    if (!config) return false
    
    // Check confidence threshold
    if (decision.confidence < config.signalThreshold) {
      return false
    }
    
    // Check risk level
    if (decision.decision.riskLevel === 'high' && config.riskThreshold < 0.1) {
      return false
    }
    
    // Check concurrent orders
    const currentOrders = this.executionQueue.get(agentId) || []
    if (currentOrders.length >= config.maxConcurrentOrders) {
      return false
    }
    
    return true
  }
  
  /**
   * Adapt frequency based on performance
   */
  private adaptFrequency(agentId: string, cycle: TradingCycle): number {
    const config = this.loopConfigs.get(agentId)
    if (!config) return 10000
    
    const recentCycles = this.getCycleHistory(agentId).slice(-20)
    if (recentCycles.length < 5) return config.frequency
    
    const successRate = recentCycles.filter(c => c.execution.successful).length / recentCycles.length
    const avgLatency = recentCycles.reduce((sum, c) => sum + c.execution.latency, 0) / recentCycles.length
    
    let newFrequency = config.frequency
    
    // Increase frequency if performing well and low latency
    if (successRate > 0.7 && avgLatency < 100) {
      newFrequency *= 0.9 // 10% faster
    }
    
    // Decrease frequency if poor performance or high latency
    if (successRate < 0.3 || avgLatency > 200) {
      newFrequency *= 1.2 // 20% slower
    }
    
    // Keep within reasonable bounds
    return Math.max(1000, Math.min(60000, newFrequency))
  }
  
  /**
   * Initialize performance metrics for an agent
   */
  private initializeAgentPerformanceMetrics(agentId: string) {
    this.performanceMetrics.set(agentId, {
      agentId,
      totalCycles: 0,
      successfulExecutions: 0,
      averageLatency: 0,
      totalPnL: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      tradesPerHour: 0,
      signalAccuracy: 0,
      strategyEfficiency: 0,
      lastUpdate: new Date()
    })
  }
  
  /**
   * Update performance metrics for an agent
   */
  private updateAgentPerformanceMetrics(agentId: string, cycle: TradingCycle) {
    const metrics = this.performanceMetrics.get(agentId)
    if (!metrics) return
    
    metrics.totalCycles++
    if (cycle.execution.successful) {
      metrics.successfulExecutions++
    }
    
    // Update running averages
    metrics.averageLatency = (metrics.averageLatency * (metrics.totalCycles - 1) + cycle.execution.latency) / metrics.totalCycles
    metrics.totalPnL = cycle.performance.pnl
    metrics.winRate = cycle.performance.winRate
    metrics.strategyEfficiency = cycle.performance.efficiency
    metrics.lastUpdate = new Date()
    
    // Calculate trades per hour
    const recentCycles = this.getCycleHistory(agentId).slice(-60) // Last hour of cycles
    const hourSpan = recentCycles.length > 0 ? 
      (Date.now() - recentCycles[0].timestamp.getTime()) / (1000 * 60 * 60) : 1
    metrics.tradesPerHour = recentCycles.filter(c => c.execution.successful).length / hourSpan
  }
  
  /**
   * Update all performance metrics
   */
  private updateAllPerformanceMetrics() {
    for (const agentId of this.performanceMetrics.keys()) {
      const recentCycles = this.getCycleHistory(agentId).slice(-10)
      if (recentCycles.length > 0) {
        this.updateAgentPerformanceMetrics(agentId, recentCycles[recentCycles.length - 1])
      }
    }
  }
  
  /**
   * Add cycle to history
   */
  private addCycleToHistory(agentId: string, cycle: TradingCycle) {
    const history = this.cycleHistory.get(agentId) || []
    history.push(cycle)
    
    // Keep only last 1000 cycles
    if (history.length > 1000) {
      history.splice(0, history.length - 1000)
    }
    
    this.cycleHistory.set(agentId, history)
  }
  
  /**
   * Clean old cycle history
   */
  private cleanOldCycleHistory() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    for (const [agentId, history] of this.cycleHistory.entries()) {
      const filtered = history.filter(cycle => cycle.timestamp.getTime() > cutoffTime)
      this.cycleHistory.set(agentId, filtered)
    }
  }
  
  /**
   * Get cycle history for an agent
   */
  getCycleHistory(agentId: string): TradingCycle[] {
    return this.cycleHistory.get(agentId) || []
  }
  
  /**
   * Get performance metrics for an agent
   */
  getPerformanceMetrics(agentId: string): AgentPerformanceMetrics | undefined {
    return this.performanceMetrics.get(agentId)
  }
  
  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics(): Map<string, AgentPerformanceMetrics> {
    return new Map(this.performanceMetrics)
  }
  
  /**
   * Get active trading loops
   */
  getActiveLoops(): string[] {
    return Array.from(this.activeLoops.keys())
  }
  
  /**
   * Stop all trading loops
   */
  stopAllLoops() {
    for (const agentId of this.activeLoops.keys()) {
      this.stopTradingLoop(agentId)
    }
  }
  
  /**
   * Get loop configuration for an agent
   */
  getLoopConfig(agentId: string): TradingLoopConfig | undefined {
    return this.loopConfigs.get(agentId)
  }
  
  /**
   * Update loop configuration for an agent
   */
  updateLoopConfig(agentId: string, updates: Partial<TradingLoopConfig>): boolean {
    const config = this.loopConfigs.get(agentId)
    if (!config) return false
    
    const updatedConfig = { ...config, ...updates }
    this.loopConfigs.set(agentId, updatedConfig)
    
    // Restart loop if frequency changed
    if (updates.frequency && this.activeLoops.has(agentId)) {
      this.stopTradingLoop(agentId)
      this.startLoop(agentId)
    }
    
    return true
  }
}

// Export singleton instance
export const autonomousTradingLoop = new AutonomousTradingLoop()