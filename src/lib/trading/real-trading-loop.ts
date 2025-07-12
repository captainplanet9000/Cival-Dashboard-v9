'use client'

import { EventEmitter } from 'events'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'
import { realLLMDecisionService, type LLMDecision, type AgentDecisionContext } from '@/lib/llm/real-llm-decision-service'
import { EnhancedLiveMarketService, type EnhancedMarketPrice } from '@/lib/market/enhanced-live-market-service'
import { multiAgentCoordinator } from '@/lib/coordination/multi-agent-coordinator'
import { reinforcementLearningService, type RLState, type RLAction, type RLExperience } from '@/lib/ai/reinforcement-learning-service'
import { redisAgentService } from '@/lib/redis/redis-agent-service'
import { strategyService } from '@/lib/supabase/strategy-service'

export interface TradingExecution {
  id: string
  agentId: string
  decision: LLMDecision
  execution: {
    orderId: string
    status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'failed'
    executedPrice: number
    executedQuantity: number
    fees: number
    slippage: number
    executionTime: number // milliseconds
  }
  market: {
    symbolData: EnhancedMarketPrice
    liquidityScore: number
    marketImpact: number
    optimalTiming: boolean
  }
  risk: {
    positionRisk: number
    portfolioRisk: number
    varEstimate: number
    stopLossTriggered: boolean
    takeProfitHit: boolean
  }
  performance: {
    expectedReturn: number
    actualReturn: number
    accuracy: boolean
    profitFactor: number
    holdingPeriod: number
  }
  timestamp: string
}

export interface AgentTradingSession {
  agentId: string
  sessionId: string
  startTime: string
  endTime?: string
  totalDecisions: number
  executedTrades: number
  successfulTrades: number
  totalPnL: number
  maxDrawdown: number
  sharpeRatio: number
  averageDecisionTime: number
  learningEvents: number
  coordinationEvents: number
  status: 'active' | 'paused' | 'completed' | 'error'
}

class RealTradingLoop extends EventEmitter {
  private activeSessions = new Map<string, AgentTradingSession>()
  private tradingLoops = new Map<string, NodeJS.Timeout>()
  private executionQueue: TradingExecution[] = []
  private isRunning = false
  private marketHours = true
  private emergencyStop = false

  // Trading configuration
  private config = {
    maxConcurrentSessions: 10,
    decisionIntervalMs: 30000, // 30 seconds
    executionTimeoutMs: 10000, // 10 seconds
    maxSlippagePercent: 0.5,
    minLiquidityThreshold: 1000000, // $1M
    riskLimitPercent: 2.0, // 2% per trade
    emergencyDrawdownLimit: 15.0 // 15%
  }

  constructor() {
    super()
    this.initializeTradingSystem()
  }

  private async initializeTradingSystem() {
    console.log('🚀 Initializing Real Trading Loop System...')
    
    // Subscribe to market data events
    realMarketDataService.on('marketUpdate', this.handleMarketUpdate.bind(this))
    
    // Subscribe to coordination events
    multiAgentCoordinator.on('emergencyMode', this.handleEmergencyMode.bind(this))
    
    // Start main trading loop
    this.startMainLoop()
    
    this.isRunning = true
    this.emit('systemStarted')
    console.log('✅ Real Trading Loop System initialized')
  }

  // Start trading session for an agent
  async startTradingSession(agentId: string): Promise<string> {
    if (this.activeSessions.has(agentId)) {
      console.warn(`Trading session already active for agent ${agentId}`)
      return this.activeSessions.get(agentId)!.sessionId
    }

    if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
      throw new Error('Maximum concurrent trading sessions reached')
    }

    if (this.emergencyStop) {
      throw new Error('Trading halted due to emergency conditions')
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const session: AgentTradingSession = {
      agentId,
      sessionId,
      startTime: new Date().toISOString(),
      totalDecisions: 0,
      executedTrades: 0,
      successfulTrades: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      averageDecisionTime: 0,
      learningEvents: 0,
      coordinationEvents: 0,
      status: 'active'
    }

    this.activeSessions.set(agentId, session)
    
    // Start individual trading loop for this agent
    await this.startAgentTradingLoop(agentId)
    
    this.emit('sessionStarted', session)
    console.log(`🎯 Started trading session for agent ${agentId}: ${sessionId}`)
    
    return sessionId
  }

  // Stop trading session for an agent
  async stopTradingSession(agentId: string): Promise<void> {
    const session = this.activeSessions.get(agentId)
    if (!session) {
      console.warn(`No active trading session for agent ${agentId}`)
      return
    }

    // Stop the trading loop
    const loop = this.tradingLoops.get(agentId)
    if (loop) {
      clearInterval(loop)
      this.tradingLoops.delete(agentId)
    }

    // Cancel any pending executions
    await this.cancelPendingExecutions(agentId)

    // Finalize session
    session.endTime = new Date().toISOString()
    session.status = 'completed'
    
    // Calculate final metrics
    session.sharpeRatio = await this.calculateSessionSharpe(agentId)
    
    this.activeSessions.delete(agentId)
    
    this.emit('sessionEnded', session)
    console.log(`🏁 Ended trading session for agent ${agentId}`)
  }

  // Main trading loop for individual agent
  private async startAgentTradingLoop(agentId: string): Promise<void> {
    const loop = setInterval(async () => {
      try {
        await this.executeTradingCycle(agentId)
      } catch (error) {
        console.error(`Error in trading cycle for agent ${agentId}:`, error)
        await this.handleTradingError(agentId, error)
      }
    }, this.config.decisionIntervalMs)

    this.tradingLoops.set(agentId, loop)
  }

  // Execute complete trading cycle for agent
  private async executeTradingCycle(agentId: string): Promise<void> {
    const startTime = Date.now()
    
    // 1. Check if agent is still active
    const agent = await agentLifecycleManager.getAgent(agentId)
    if (!agent || agent.status !== 'active') {
      await this.stopTradingSession(agentId)
      return
    }

    // 2. Check market conditions
    if (!this.marketHours || this.emergencyStop) {
      console.log(`⏸️ Trading paused for agent ${agentId} - market hours: ${this.marketHours}, emergency: ${this.emergencyStop}`)
      return
    }

    // 3. Gather market context
    const marketContext = await this.gatherMarketContext(agentId)
    if (!marketContext) {
      console.warn(`No market context available for agent ${agentId}`)
      return
    }

    // 4. Create decision context
    const decisionContext = await this.createDecisionContext(agentId, marketContext)
    
    // 5. Get LLM decision
    const llmDecision = await realLLMDecisionService.makeDecision(decisionContext)
    
    // 6. Apply reinforcement learning
    const rlState = await this.createRLState(decisionContext, marketContext)
    const rlAction = await reinforcementLearningService.makeRLDecision(agentId, rlState, agent.strategy_type)
    
    // 7. Coordinate with other agents
    const coordinatedDecision = await multiAgentCoordinator.coordinateDecision(
      agentId, 
      llmDecision, 
      'balanced'
    )

    // 8. Execute trade if approved
    if (coordinatedDecision.coordinatedDecision.action !== 'hold') {
      await this.executeTradeDecision(agentId, coordinatedDecision.coordinatedDecision, marketContext)
    }

    // 9. Store decision and update learning
    await this.storeDecisionAndLearn(agentId, coordinatedDecision, rlState, rlAction)

    // 10. Update session metrics
    await this.updateSessionMetrics(agentId, Date.now() - startTime)

    console.log(`🔄 Completed trading cycle for agent ${agentId} in ${Date.now() - startTime}ms`)
  }

  // Gather comprehensive market context
  private async gatherMarketContext(agentId: string): Promise<any> {
    const agent = await agentLifecycleManager.getAgent(agentId)
    if (!agent) return null

    // Get primary trading symbol for this agent's strategy
    const primarySymbol = this.getPrimarySymbolForStrategy(agent.strategy_type)
    
    // Get current market data
    const marketData = realMarketDataService.getMarketData(primarySymbol)
    const indicators = realMarketDataService.getTechnicalIndicators(primarySymbol)
    const sentiment = await realMarketDataService.getMarketSentiment(primarySymbol)
    
    if (!marketData) {
      // Subscribe to symbol if not already subscribed
      realMarketDataService.subscribe(primarySymbol)
      return null
    }

    return {
      primarySymbol,
      marketData,
      indicators,
      sentiment,
      liquidityScore: this.calculateLiquidityScore(marketData),
      volatilityLevel: this.categorizeVolatility(indicators?.volatility || 0.02)
    }
  }

  // Create decision context for LLM
  private async createDecisionContext(agentId: string, marketContext: any): Promise<AgentDecisionContext> {
    const agent = await agentLifecycleManager.getAgent(agentId)!
    const state = await redisAgentService.getAgentState(agentId)
    const performance = await redisAgentService.getPerformance(agentId)
    const recentThoughts = await redisAgentService.getRecentThoughts(agentId, 5)
    const learningData = await redisAgentService.getMemory(agentId)

    return {
      agentId,
      strategy: agent.strategy_type,
      portfolioValue: state?.portfolioValue || agent.current_capital,
      currentPositions: state?.currentPositions || [],
      availableCash: agent.current_capital * 0.95, // Keep 5% as cash buffer
      riskLimits: {
        maxPositionSize: agent.current_capital * (this.config.riskLimitPercent / 100),
        maxDailyLoss: agent.current_capital * 0.05,
        maxDrawdown: agent.current_capital * 0.15
      },
      recentPerformance: {
        winRate: performance?.winningTrades / Math.max(performance?.totalTrades || 1, 1) || 0.5,
        avgReturn: performance?.totalPnL / Math.max(performance?.totalTrades || 1, 1) || 0,
        sharpeRatio: performance?.sharpeRatio || 0,
        maxDrawdown: performance?.maxDrawdown || 0
      },
      marketContext: {
        symbol: marketContext.primarySymbol,
        price: marketContext.marketData.price,
        volume: marketContext.marketData.volume,
        volatility: marketContext.indicators?.volatility || 0.02,
        trend: marketContext.indicators?.trend || 'sideways',
        technicalIndicators: {
          rsi: marketContext.indicators?.rsi || 50,
          macd: {
            signal: marketContext.indicators?.macd?.signal || 0,
            histogram: marketContext.indicators?.macd?.histogram || 0
          },
          ema20: marketContext.indicators?.ema?.ema12 || marketContext.marketData.price,
          ema50: marketContext.indicators?.ema?.ema50 || marketContext.marketData.price,
          support: marketContext.indicators?.support || marketContext.marketData.price * 0.95,
          resistance: marketContext.indicators?.resistance || marketContext.marketData.price * 1.05
        },
        marketSentiment: marketContext.sentiment?.overall || 0,
        newsImpact: marketContext.sentiment?.newsImpact > 0 ? 'positive' : 
                    marketContext.sentiment?.newsImpact < 0 ? 'negative' : 'neutral'
      },
      recentThoughts: recentThoughts.map(t => t.content),
      learningData
    }
  }

  // Create RL state representation
  private async createRLState(context: AgentDecisionContext, marketContext: any): Promise<RLState> {
    const now = new Date()
    
    return {
      marketConditions: {
        volatility: context.marketContext.volatility,
        trend: context.marketContext.trend,
        volume: context.marketContext.volume,
        rsi: context.marketContext.technicalIndicators.rsi,
        macd: context.marketContext.technicalIndicators.macd.signal,
        bollinger: {
          upper: context.marketContext.resistance,
          lower: context.marketContext.support,
          position: (context.marketContext.price - context.marketContext.support) / 
                   (context.marketContext.resistance - context.marketContext.support)
        }
      },
      portfolioState: {
        totalValue: context.portfolioValue,
        cashRatio: context.availableCash / context.portfolioValue,
        positionCount: context.currentPositions.length,
        unrealizedPnL: context.currentPositions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0),
        drawdown: context.recentPerformance.maxDrawdown
      },
      riskMetrics: {
        varRisk: context.portfolioValue * 0.02, // Simplified VaR
        sharpeRatio: context.recentPerformance.sharpeRatio,
        maxDrawdown: context.recentPerformance.maxDrawdown,
        consecutiveLosses: 0 // Would track from recent decisions
      },
      timeContext: {
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        marketSession: this.getMarketSession(now)
      }
    }
  }

  // Execute trade decision with real market execution
  private async executeTradeDecision(
    agentId: string, 
    decision: LLMDecision, 
    marketContext: any
  ): Promise<TradingExecution | null> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // 1. Pre-execution validation
      const validation = await this.validateTradeExecution(agentId, decision, marketContext)
      if (!validation.valid) {
        console.warn(`Trade validation failed for agent ${agentId}: ${validation.reason}`)
        return null
      }

      // 2. Calculate optimal execution parameters
      const executionParams = await this.calculateOptimalExecution(decision, marketContext)
      
      // 3. Execute trade (mock implementation - replace with real broker integration)
      const executionResult = await this.executeTrade(agentId, decision, executionParams)
      
      // 4. Create execution record
      const execution: TradingExecution = {
        id: executionId,
        agentId,
        decision,
        execution: executionResult,
        market: {
          symbolData: marketContext.marketData,
          liquidityScore: marketContext.liquidityScore,
          marketImpact: this.calculateMarketImpact(decision.quantity, marketContext.marketData.volume),
          optimalTiming: executionResult.slippage < this.config.maxSlippagePercent
        },
        risk: {
          positionRisk: this.calculatePositionRisk(decision, marketContext.marketData.price),
          portfolioRisk: 0, // Calculate from current portfolio
          varEstimate: decision.riskAssessment.maxLoss,
          stopLossTriggered: false,
          takeProfitHit: false
        },
        performance: {
          expectedReturn: decision.riskAssessment.expectedReturn,
          actualReturn: 0, // Will be updated when position is closed
          accuracy: true, // Will be determined later
          profitFactor: 0,
          holdingPeriod: 0
        },
        timestamp: new Date().toISOString()
      }

      // 5. Store execution
      this.executionQueue.push(execution)
      await this.storeExecution(execution)
      
      // 6. Update agent state
      await this.updateAgentStateAfterExecution(agentId, execution)

      this.emit('tradeExecuted', execution)
      console.log(`✅ Executed trade for agent ${agentId}: ${decision.action} ${decision.symbol} @ ${executionResult.executedPrice}`)
      
      return execution

    } catch (error) {
      console.error(`Trade execution failed for agent ${agentId}:`, error)
      await this.handleExecutionError(agentId, decision, error)
      return null
    }
  }

  // Mock trade execution (replace with real broker integration)
  private async executeTrade(agentId: string, decision: LLMDecision, params: any): Promise<any> {
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500))
    
    const marketData = realMarketDataService.getMarketData(decision.symbol)
    if (!marketData) {
      throw new Error(`No market data available for ${decision.symbol}`)
    }

    // Simulate slippage
    const slippage = (Math.random() - 0.5) * 0.002 // ±0.2% slippage
    const executedPrice = marketData.price * (1 + slippage)
    
    // Simulate partial fills
    const fillRatio = Math.random() > 0.1 ? 1.0 : 0.5 + Math.random() * 0.5
    const executedQuantity = decision.quantity * fillRatio
    
    // Calculate fees (0.1% trading fee)
    const fees = executedPrice * executedQuantity * 0.001

    return {
      orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: fillRatio === 1.0 ? 'filled' : 'partial',
      executedPrice,
      executedQuantity,
      fees,
      slippage: Math.abs(slippage),
      executionTime: 100 + Math.random() * 400
    }
  }

  // Store decision and update learning systems
  private async storeDecisionAndLearn(
    agentId: string,
    coordinatedDecision: any,
    rlState: RLState,
    rlAction: RLAction
  ): Promise<void> {
    
    // Store LLM decision
    await realLLMDecisionService.storeDecision(agentId, coordinatedDecision.coordinatedDecision)
    
    // Create RL experience
    const reward = this.calculateImmediateReward(coordinatedDecision.coordinatedDecision)
    const experience: RLExperience = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      timestamp: new Date().toISOString(),
      state: rlState,
      action: rlAction,
      reward,
      nextState: null, // Will be updated in next cycle
      terminal: false,
      metadata: {
        strategy: coordinatedDecision.coordinatedDecision.symbol,
        marketSymbol: coordinatedDecision.coordinatedDecision.symbol,
        sessionId: this.activeSessions.get(agentId)?.sessionId || 'unknown'
      }
    }
    
    // Store experience and update learning
    await reinforcementLearningService.storeExperience(experience)
    
    // Trigger experience replay occasionally
    if (Math.random() < 0.1) { // 10% chance
      await reinforcementLearningService.replayExperiences(agentId, 16)
    }
  }

  // Handle market updates
  private handleMarketUpdate(marketData: MarketData): void {
    // Update any position tracking
    this.updatePositionValues(marketData)
    
    // Check for stop losses and take profits
    this.checkStopLossesAndTakeProfits(marketData)
    
    // Emit market update event
    this.emit('marketUpdate', marketData)
  }

  // Handle emergency mode
  private handleEmergencyMode(event: { enabled: boolean }): void {
    this.emergencyStop = event.enabled
    
    if (event.enabled) {
      console.warn('🚨 Emergency mode activated - halting all trading')
      this.emit('emergencyStop')
    } else {
      console.log('✅ Emergency mode deactivated - resuming trading')
      this.emit('emergencyResume')
    }
  }

  // Utility methods
  private getPrimarySymbolForStrategy(strategy: string): string {
    const strategySymbols = {
      'darvas_box': 'BTC/USD',
      'williams_alligator': 'ETH/USD',
      'renko_breakout': 'SOL/USD',
      'heikin_ashi': 'ADA/USD',
      'elliott_wave': 'BTC/USD'
    }
    
    return strategySymbols[strategy as keyof typeof strategySymbols] || 'BTC/USD'
  }

  private calculateLiquidityScore(marketData: MarketData): number {
    // Simple liquidity score based on volume and spread
    const volumeScore = Math.min(marketData.volume / 1000000, 1) // Normalize to $1M
    const spreadScore = 1 - Math.min(Math.abs(marketData.ask - marketData.bid) / marketData.price, 0.01)
    
    return (volumeScore + spreadScore) / 2
  }

  private categorizeVolatility(volatility: number): 'low' | 'medium' | 'high' {
    if (volatility < 0.02) return 'low'
    if (volatility < 0.05) return 'medium'
    return 'high'
  }

  private getMarketSession(date: Date): 'pre' | 'open' | 'lunch' | 'close' | 'after' {
    const hour = date.getHours()
    
    if (hour < 9) return 'pre'
    if (hour < 12) return 'open'
    if (hour < 13) return 'lunch'
    if (hour < 16) return 'close'
    return 'after'
  }

  private async validateTradeExecution(agentId: string, decision: LLMDecision, marketContext: any): Promise<{ valid: boolean; reason?: string }> {
    // Check liquidity
    if (marketContext.liquidityScore < 0.5) {
      return { valid: false, reason: 'Insufficient liquidity' }
    }
    
    // Check position size
    if (decision.quantity <= 0) {
      return { valid: false, reason: 'Invalid quantity' }
    }
    
    // Check agent capital
    const agent = await agentLifecycleManager.getAgent(agentId)
    if (!agent) {
      return { valid: false, reason: 'Agent not found' }
    }
    
    const tradeValue = decision.quantity * marketContext.marketData.price
    if (tradeValue > agent.current_capital * 0.95) {
      return { valid: false, reason: 'Insufficient capital' }
    }
    
    return { valid: true }
  }

  private async calculateOptimalExecution(decision: LLMDecision, marketContext: any): Promise<any> {
    return {
      orderType: 'market', // Could be 'limit', 'stop', etc.
      timeInForce: 'ioc', // Immediate or cancel
      maxSlippage: this.config.maxSlippagePercent / 100
    }
  }

  private calculateMarketImpact(quantity: number, dailyVolume: number): number {
    return Math.min(quantity / dailyVolume, 0.01) // Max 1% impact
  }

  private calculatePositionRisk(decision: LLMDecision, price: number): number {
    return (decision.quantity * price) / 10000 // Normalize to 10k portfolio
  }

  private calculateImmediateReward(decision: LLMDecision): any {
    // Simple reward based on confidence and risk assessment
    const baseReward = decision.confidence - 0.5 // -0.5 to 0.5
    const riskAdjustment = decision.riskAssessment.riskLevel === 'low' ? 0.1 : 
                          decision.riskAssessment.riskLevel === 'high' ? -0.1 : 0
    
    return {
      immediate: baseReward + riskAdjustment,
      delayed: 0,
      riskAdjusted: baseReward,
      drawdownPenalty: 0,
      consistencyBonus: 0,
      total: baseReward + riskAdjustment
    }
  }

  private updatePositionValues(marketData: MarketData): void {
    // Update unrealized P&L for all positions
    // Implementation would track all open positions and update their values
  }

  private checkStopLossesAndTakeProfits(marketData: MarketData): void {
    // Check all open positions for stop loss and take profit triggers
    // Implementation would automatically close positions when triggered
  }

  private async updateSessionMetrics(agentId: string, cycleTime: number): Promise<void> {
    const session = this.activeSessions.get(agentId)
    if (!session) return
    
    session.totalDecisions++
    session.averageDecisionTime = (session.averageDecisionTime * (session.totalDecisions - 1) + cycleTime) / session.totalDecisions
  }

  private startMainLoop(): void {
    // Main system loop for monitoring and cleanup
    setInterval(async () => {
      await this.performSystemMaintenance()
    }, 60000) // Every minute
  }

  private async performSystemMaintenance(): Promise<void> {
    // Clean up completed executions
    this.executionQueue = this.executionQueue.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 3600000 // Keep for 1 hour
    )
    
    // Check for stale sessions
    for (const [agentId, session] of this.activeSessions.entries()) {
      const sessionAge = Date.now() - new Date(session.startTime).getTime()
      if (sessionAge > 86400000) { // 24 hours
        console.warn(`Stopping stale session for agent ${agentId}`)
        await this.stopTradingSession(agentId)
      }
    }
    
    // Update market hours
    this.marketHours = this.isMarketOpen()
  }

  private isMarketOpen(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    
    // Simple market hours check (9 AM - 4 PM, Monday - Friday)
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16
  }

  // Public interface methods
  async getActiveSessions(): Promise<AgentTradingSession[]> {
    return Array.from(this.activeSessions.values())
  }

  async getExecutionHistory(agentId?: string, limit: number = 100): Promise<TradingExecution[]> {
    let executions = this.executionQueue
    
    if (agentId) {
      executions = executions.filter(e => e.agentId === agentId)
    }
    
    return executions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  getSystemStatus(): any {
    return {
      isRunning: this.isRunning,
      marketHours: this.marketHours,
      emergencyStop: this.emergencyStop,
      activeSessions: this.activeSessions.size,
      totalExecutions: this.executionQueue.length,
      systemUptime: Date.now() // Would track actual uptime
    }
  }

  // Emergency controls
  async emergencyStopAll(): Promise<void> {
    this.emergencyStop = true
    
    // Stop all sessions
    for (const agentId of this.activeSessions.keys()) {
      await this.stopTradingSession(agentId)
    }
    
    console.warn('🛑 Emergency stop activated - all trading halted')
    this.emit('emergencyStopAll')
  }

  async resumeTrading(): Promise<void> {
    this.emergencyStop = false
    console.log('▶️ Trading resumed')
    this.emit('tradingResumed')
  }

  // Cleanup
  async shutdown(): Promise<void> {
    this.isRunning = false
    
    // Stop all trading sessions
    for (const agentId of this.activeSessions.keys()) {
      await this.stopTradingSession(agentId)
    }
    
    // Clear all intervals
    for (const loop of this.tradingLoops.values()) {
      clearInterval(loop)
    }
    
    this.emit('systemShutdown')
    console.log('🔌 Real Trading Loop System shutdown complete')
  }

  // Private helper methods for async operations
  private async storeExecution(execution: TradingExecution): Promise<void> {
    // Store execution in database/Redis
    await redisAgentService.storeMemory(
      execution.agentId,
      `execution_${execution.id}`,
      execution
    )
  }

  private async updateAgentStateAfterExecution(agentId: string, execution: TradingExecution): Promise<void> {
    // Update agent's real-time state
    const currentState = await redisAgentService.getAgentState(agentId)
    if (currentState) {
      // Add new position or update existing
      // Implementation would manage position tracking
    }
  }

  private async cancelPendingExecutions(agentId: string): Promise<void> {
    // Cancel any pending trade executions for the agent
    this.executionQueue
      .filter(e => e.agentId === agentId && e.execution.status === 'pending')
      .forEach(e => {
        e.execution.status = 'cancelled'
      })
  }

  private async calculateSessionSharpe(agentId: string): Promise<number> {
    // Calculate Sharpe ratio for the trading session
    const executions = this.executionQueue.filter(e => e.agentId === agentId)
    
    if (executions.length < 2) return 0
    
    const returns = executions.map(e => e.performance.actualReturn)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)
    
    return stdDev === 0 ? 0 : avgReturn / stdDev
  }

  private async handleTradingError(agentId: string, error: any): Promise<void> {
    console.error(`Trading error for agent ${agentId}:`, error)
    
    const session = this.activeSessions.get(agentId)
    if (session) {
      session.status = 'error'
    }
    
    // Store error for analysis
    await redisAgentService.addThought({
      agentId,
      timestamp: new Date().toISOString(),
      type: 'strategy',
      content: `Trading error occurred: ${error.message}`,
      reasoning: 'System error during trading cycle',
      confidence: 0
    })
    
    this.emit('tradingError', { agentId, error })
  }

  private async handleExecutionError(agentId: string, decision: LLMDecision, error: any): Promise<void> {
    console.error(`Execution error for agent ${agentId}:`, error)
    
    // Store failed execution attempt
    await redisAgentService.addDecision({
      agentId,
      timestamp: new Date().toISOString(),
      action: decision.action,
      symbol: decision.symbol,
      quantity: 0,
      price: 0,
      reasoning: `Execution failed: ${error.message}`,
      expectedOutcome: {
        target: 0,
        stopLoss: 0,
        probability: 0
      }
    })
    
    this.emit('executionError', { agentId, decision, error })
  }
}

// Export singleton instance
export const realTradingLoop = new RealTradingLoop()

// Export types
export type { TradingExecution, AgentTradingSession }