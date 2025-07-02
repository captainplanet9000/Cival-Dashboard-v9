'use client'

/**
 * LLM Decision Integration Service
 * Provides real-time AI decision making for autonomous trading agents
 */

import { EventEmitter } from 'events'
import { technicalAnalysisEngine, type TechnicalSignal, type MarketData } from '@/lib/strategies/technical-analysis-engine'
import { unifiedLLMService, type AIDecisionRequest, type AIDecision } from '@/lib/ai/unified-llm-service'
import { agentWalletManager } from '@/lib/agents/agent-wallet-manager'
import type { CreatedAgent } from './enhanced-agent-creation-service'

export interface AgentDecisionContext {
  agentId: string
  currentMarketData: MarketData[]
  technicalSignals: TechnicalSignal[]
  portfolioState: {
    totalValue: number
    cash: number
    positions: any[]
    unrealizedPnL: number
    openOrders: any[]
  }
  walletState: {
    balance: number
    address: string
    recentTransactions: any[]
  }
  vaultState: {
    vaultId?: string
    lastBackup?: Date
    encryptionStatus: string
  }
  riskMetrics: {
    currentDrawdown: number
    dailyPnL: number
    positionSizes: number[]
    correlations: number[]
  }
  recentDecisions: AgentDecision[]
  strategyPerformance: {
    winRate: number
    avgProfit: number
    maxDrawdown: number
    sharpeRatio: number
  }
  goals: {
    activeGoals: any[]
    progressToTargets: number[]
    priorityAdjustments: string[]
  }
}

export interface AgentDecision {
  id: string
  agentId: string
  timestamp: Date
  decision: AIDecision
  context: AgentDecisionContext
  executionStatus: 'pending' | 'executed' | 'failed' | 'cancelled'
  executionResult?: {
    orderId?: string
    executedPrice?: number
    executedQuantity?: number
    fees?: number
    slippage?: number
  }
  confidence: number
  reasoning: string
  metadata: Record<string, any>
}

export interface LLMAgentConfig {
  agentId: string
  provider: 'gemini' | 'openai' | 'claude'
  model: string
  decisionFrequency: number
  temperature: number
  contextWindow: number
  enableLearning: boolean
  strategyType: string
  riskTolerance: number
  maxPositionSize: number
}

class LLMDecisionIntegrationService extends EventEmitter {
  private agentConfigs: Map<string, LLMAgentConfig> = new Map()
  private agentDecisionHistory: Map<string, AgentDecision[]> = new Map()
  private activeDecisionLoops: Map<string, NodeJS.Timeout> = new Map()
  private contextBuilders: Map<string, (agentId: string) => Promise<AgentDecisionContext>> = new Map()
  
  constructor() {
    super()
    this.initializeContextBuilders()
  }
  
  /**
   * Initialize context builders for different agent types
   */
  private initializeContextBuilders() {
    // Default context builder
    this.contextBuilders.set('default', this.buildDefaultContext.bind(this))
    
    // Strategy-specific context builders
    this.contextBuilders.set('darvas_box', this.buildDarvasBoxContext.bind(this))
    this.contextBuilders.set('williams_alligator', this.buildWilliamsAlligatorContext.bind(this))
    this.contextBuilders.set('renko_breakout', this.buildRenkoBreakoutContext.bind(this))
    this.contextBuilders.set('heikin_ashi', this.buildHeikinAshiContext.bind(this))
    this.contextBuilders.set('elliott_wave', this.buildElliottWaveContext.bind(this))
  }
  
  /**
   * Register an agent for LLM decision making
   */
  async registerAgent(agent: CreatedAgent): Promise<boolean> {
    try {
      const config: LLMAgentConfig = {
        agentId: agent.id,
        provider: agent.config.llmConfig.provider,
        model: agent.config.llmConfig.model,
        decisionFrequency: agent.config.llmConfig.decisionFrequency,
        temperature: agent.config.llmConfig.temperature,
        contextWindow: agent.config.llmConfig.contextWindow,
        enableLearning: agent.config.llmConfig.enableLearning,
        strategyType: agent.config.strategy.type,
        riskTolerance: agent.config.riskLimits.maxDrawdown,
        maxPositionSize: agent.config.riskLimits.maxPositionSize
      }
      
      this.agentConfigs.set(agent.id, config)
      this.agentDecisionHistory.set(agent.id, [])
      
      // Start autonomous decision loop if enabled
      if (agent.config.autonomous.autoStart) {
        await this.startDecisionLoop(agent.id)
      }
      
      console.log(`LLM decision integration registered for agent ${agent.id}`)
      return true
      
    } catch (error) {
      console.error(`Failed to register agent ${agent.id} for LLM decisions:`, error)
      return false
    }
  }
  
  /**
   * Start autonomous decision making loop for an agent
   */
  async startDecisionLoop(agentId: string): Promise<boolean> {
    const config = this.agentConfigs.get(agentId)
    if (!config) {
      throw new Error(`Agent ${agentId} not registered for LLM decisions`)
    }
    
    // Stop existing loop if running
    this.stopDecisionLoop(agentId)
    
    const decisionLoop = async () => {
      try {
        // Make autonomous decision
        const decision = await this.makeAutonomousDecision(agentId)
        
        if (decision) {
          // Execute decision if actionable
          if (decision.decision.action !== 'hold') {
            await this.executeDecision(decision)
          }
          
          // Store decision in history
          this.addDecisionToHistory(agentId, decision)
          
          // Emit decision event
          this.emit('agentDecision', decision)
        }
        
      } catch (error) {
        console.error(`Decision loop error for agent ${agentId}:`, error)
        this.emit('decisionError', { agentId, error })
      }
      
      // Schedule next decision
      const intervalId = setTimeout(decisionLoop, config.decisionFrequency)
      this.activeDecisionLoops.set(agentId, intervalId)
    }
    
    // Start the loop
    decisionLoop()
    
    console.log(`Decision loop started for agent ${agentId} with ${config.decisionFrequency}ms frequency`)
    return true
  }
  
  /**
   * Stop autonomous decision making loop for an agent
   */
  stopDecisionLoop(agentId: string): boolean {
    const intervalId = this.activeDecisionLoops.get(agentId)
    if (intervalId) {
      clearTimeout(intervalId)
      this.activeDecisionLoops.delete(agentId)
      console.log(`Decision loop stopped for agent ${agentId}`)
      return true
    }
    return false
  }
  
  /**
   * Make an autonomous decision for an agent
   */
  async makeAutonomousDecision(agentId: string): Promise<AgentDecision | null> {
    const config = this.agentConfigs.get(agentId)
    if (!config) return null
    
    try {
      // Build decision context
      const context = await this.buildDecisionContext(agentId)
      
      // Create LLM request
      const llmRequest: AIDecisionRequest = {
        agent: {
          id: agentId,
          type: config.strategyType,
          config: config,
          strategy: {
            type: config.strategyType,
            riskTolerance: config.riskTolerance
          }
        },
        marketData: context.currentMarketData.map(data => ({
          symbol: data.symbol,
          price: data.close,
          volume: data.volume,
          change: ((data.close - data.open) / data.open) * 100,
          indicators: this.extractTechnicalIndicators(data, context.technicalSignals)
        })),
        portfolio: {
          totalValue: context.portfolioState.totalValue,
          cash: context.portfolioState.cash,
          positions: context.portfolioState.positions,
          pnl: context.portfolioState.unrealizedPnL
        },
        memory: {
          recentDecisions: context.recentDecisions.slice(-10).map(d => ({
            decision: d.decision.action,
            reasoning: d.reasoning,
            outcome: d.executionStatus,
            timestamp: d.timestamp
          })),
          performance: context.strategyPerformance,
          lessons: this.extractLessonsFromHistory(agentId)
        },
        goals: {
          activeGoals: context.goals.activeGoals,
          totalGoals: context.goals.activeGoals.length,
          completedGoals: 0, // Would be calculated from goal service
          priorities: context.goals.priorityAdjustments
        },
        context: this.buildContextString(context)
      }
      
      // Get AI decision
      const aiDecision = await unifiedLLMService.makeDecision(llmRequest)
      
      // Create agent decision
      const agentDecision: AgentDecision = {
        id: `decision_${agentId}_${Date.now()}`,
        agentId,
        timestamp: new Date(),
        decision: aiDecision,
        context,
        executionStatus: 'pending',
        confidence: aiDecision.confidence,
        reasoning: aiDecision.reasoning,
        metadata: {
          strategyType: config.strategyType,
          technicalSignals: context.technicalSignals.length,
          riskLevel: aiDecision.riskLevel,
          marketConditions: this.assessMarketConditions(context.currentMarketData)
        }
      }
      
      return agentDecision
      
    } catch (error) {
      console.error(`Failed to make autonomous decision for agent ${agentId}:`, error)
      return null
    }
  }
  
  /**
   * Execute an agent decision
   */
  async executeDecision(decision: AgentDecision): Promise<boolean> {
    try {
      const { agentId } = decision
      const { action, symbol, quantity, price } = decision.decision
      
      // Get agent wallet
      const wallet = await agentWalletManager.getWallet(agentId)
      if (!wallet) {
        throw new Error(`No wallet found for agent ${agentId}`)
      }
      
      // Execute the trade based on decision
      let executionResult
      
      if (action === 'buy') {
        executionResult = await agentWalletManager.executeBuy(
          agentId,
          symbol || 'BTC/USD',
          quantity || this.calculateOptimalQuantity(decision),
          price
        )
      } else if (action === 'sell') {
        executionResult = await agentWalletManager.executeSell(
          agentId,
          symbol || 'BTC/USD',
          quantity || this.calculateOptimalQuantity(decision),
          price
        )
      }
      
      // Update decision with execution result
      decision.executionStatus = executionResult ? 'executed' : 'failed'
      decision.executionResult = executionResult
      
      // Emit execution event
      this.emit('decisionExecuted', decision)
      
      return true
      
    } catch (error) {
      console.error(`Failed to execute decision for agent ${decision.agentId}:`, error)
      decision.executionStatus = 'failed'
      return false
    }
  }
  
  /**
   * Build decision context for an agent
   */
  private async buildDecisionContext(agentId: string): Promise<AgentDecisionContext> {
    const config = this.agentConfigs.get(agentId)
    if (!config) {
      throw new Error(`Agent ${agentId} not found`)
    }
    
    // Use strategy-specific context builder if available
    const contextBuilder = this.contextBuilders.get(config.strategyType) || this.contextBuilders.get('default')!
    return await contextBuilder(agentId)
  }
  
  /**
   * Build default decision context
   */
  private async buildDefaultContext(agentId: string): Promise<AgentDecisionContext> {
    // Generate mock market data for now
    const marketData: MarketData[] = this.generateMockMarketData()
    
    // Get technical signals
    const technicalSignals = technicalAnalysisEngine.analyzeWithAllStrategies(marketData)
    const allSignals: TechnicalSignal[] = []
    for (const signals of technicalSignals.values()) {
      allSignals.push(...signals)
    }
    
    // Get wallet state
    const wallet = await agentWalletManager.getWallet(agentId)
    const walletState = {
      balance: wallet?.balance || 0,
      address: wallet?.address || '',
      recentTransactions: []
    }
    
    // Get portfolio state
    const portfolioState = {
      totalValue: wallet?.totalValue || 0,
      cash: wallet?.balance || 0,
      positions: wallet?.positions || [],
      unrealizedPnL: wallet?.unrealizedPnL || 0,
      openOrders: wallet?.orders || []
    }
    
    // Get recent decisions
    const recentDecisions = this.agentDecisionHistory.get(agentId) || []
    
    return {
      agentId,
      currentMarketData: marketData,
      technicalSignals: allSignals,
      portfolioState,
      walletState,
      vaultState: {
        encryptionStatus: 'encrypted'
      },
      riskMetrics: {
        currentDrawdown: 0,
        dailyPnL: wallet?.unrealizedPnL || 0,
        positionSizes: [],
        correlations: []
      },
      recentDecisions: recentDecisions.slice(-10),
      strategyPerformance: {
        winRate: 0.75,
        avgProfit: 100,
        maxDrawdown: 0.05,
        sharpeRatio: 1.5
      },
      goals: {
        activeGoals: [],
        progressToTargets: [],
        priorityAdjustments: []
      }
    }
  }
  
  /**
   * Build Darvas Box specific context
   */
  private async buildDarvasBoxContext(agentId: string): Promise<AgentDecisionContext> {
    const baseContext = await this.buildDefaultContext(agentId)
    
    // Add Darvas Box specific market analysis
    const darvasSignals = baseContext.technicalSignals.filter(s => s.strategy === 'darvas_box')
    
    return {
      ...baseContext,
      metadata: {
        ...baseContext,
        darvasBoxes: darvasSignals.filter(s => s.type === 'buy').length,
        breakoutStrength: darvasSignals.reduce((sum, s) => sum + s.strength, 0) / Math.max(darvasSignals.length, 1),
        volumeConfirmation: darvasSignals.filter(s => s.metadata?.volumeConfirmation).length
      }
    }
  }
  
  /**
   * Build Williams Alligator specific context
   */
  private async buildWilliamsAlligatorContext(agentId: string): Promise<AgentDecisionContext> {
    const baseContext = await this.buildDefaultContext(agentId)
    
    // Add Alligator specific analysis
    const alligatorSignals = baseContext.technicalSignals.filter(s => s.strategy === 'williams_alligator')
    
    return {
      ...baseContext,
      metadata: {
        ...baseContext,
        alligatorAwake: alligatorSignals.length > 0,
        trendStrength: alligatorSignals.reduce((sum, s) => sum + s.strength, 0) / Math.max(alligatorSignals.length, 1),
        momentumConfirmation: alligatorSignals.filter(s => s.metadata?.aoConfirmation).length
      }
    }
  }
  
  /**
   * Build Renko Breakout specific context
   */
  private async buildRenkoBreakoutContext(agentId: string): Promise<AgentDecisionContext> {
    const baseContext = await this.buildDefaultContext(agentId)
    
    // Add Renko specific analysis
    const renkoSignals = baseContext.technicalSignals.filter(s => s.strategy === 'renko_breakout')
    
    return {
      ...baseContext,
      metadata: {
        ...baseContext,
        consecutiveBricks: Math.max(...renkoSignals.map(s => s.metadata?.consecutiveBricks || 0)),
        brickDirection: renkoSignals.length > 0 ? renkoSignals[0].metadata?.latestBrickDirection : 'neutral',
        breakoutStrength: renkoSignals.reduce((sum, s) => sum + s.strength, 0) / Math.max(renkoSignals.length, 1)
      }
    }
  }
  
  /**
   * Build Heikin Ashi specific context
   */
  private async buildHeikinAshiContext(agentId: string): Promise<AgentDecisionContext> {
    const baseContext = await this.buildDefaultContext(agentId)
    
    // Add Heikin Ashi specific analysis
    const heikinSignals = baseContext.technicalSignals.filter(s => s.strategy === 'heikin_ashi')
    
    return {
      ...baseContext,
      metadata: {
        ...baseContext,
        trendConsistency: heikinSignals.reduce((sum, s) => sum + s.strength, 0) / Math.max(heikinSignals.length, 1),
        consecutiveCandles: Math.max(...heikinSignals.map(s => s.metadata?.consecutiveBullish || s.metadata?.consecutiveBearish || 0)),
        reversalDetection: heikinSignals.filter(s => s.metadata?.reversalType).length > 0
      }
    }
  }
  
  /**
   * Build Elliott Wave specific context
   */
  private async buildElliottWaveContext(agentId: string): Promise<AgentDecisionContext> {
    const baseContext = await this.buildDefaultContext(agentId)
    
    // Add Elliott Wave specific analysis
    const waveSignals = baseContext.technicalSignals.filter(s => s.strategy === 'elliott_wave')
    
    return {
      ...baseContext,
      metadata: {
        ...baseContext,
        currentWave: waveSignals.length > 0 ? waveSignals[0].metadata?.waveNumber : 0,
        waveDirection: waveSignals.length > 0 ? waveSignals[0].metadata?.direction : 'unknown',
        fibonacciLevel: waveSignals.filter(s => s.metadata?.fibonacciLevel).length,
        patternConfidence: waveSignals.reduce((sum, s) => sum + s.confidence, 0) / Math.max(waveSignals.length, 1)
      }
    }
  }
  
  /**
   * Extract technical indicators from market data and signals
   */
  private extractTechnicalIndicators(data: MarketData, signals: TechnicalSignal[]): any {
    const relevantSignals = signals.filter(s => s.symbol === data.symbol)
    
    return {
      rsi: 50 + (Math.random() - 0.5) * 40, // Mock RSI
      macd: (Math.random() - 0.5) * 2,
      signalStrength: relevantSignals.reduce((sum, s) => sum + s.strength, 0) / Math.max(relevantSignals.length, 1),
      signalCount: relevantSignals.length
    }
  }
  
  /**
   * Extract lessons from decision history for learning
   */
  private extractLessonsFromHistory(agentId: string): string[] {
    const history = this.agentDecisionHistory.get(agentId) || []
    const lessons: string[] = []
    
    // Analyze successful decisions
    const successfulDecisions = history.filter(d => d.executionStatus === 'executed' && d.executionResult)
    
    if (successfulDecisions.length > 0) {
      lessons.push(`${successfulDecisions.length} successful executions show good timing`)
    }
    
    // Analyze failed decisions
    const failedDecisions = history.filter(d => d.executionStatus === 'failed')
    
    if (failedDecisions.length > 0) {
      lessons.push(`${failedDecisions.length} failed executions suggest market timing issues`)
    }
    
    return lessons
  }
  
  /**
   * Build context string for LLM
   */
  private buildContextString(context: AgentDecisionContext): string {
    const signals = context.technicalSignals
    const portfolio = context.portfolioState
    
    return `
    Market Analysis: ${signals.length} technical signals detected
    Portfolio Status: $${portfolio.totalValue.toFixed(2)} total value, $${portfolio.cash.toFixed(2)} cash
    Wallet Balance: $${context.walletState.balance.toFixed(2)}
    Recent Performance: ${context.strategyPerformance.winRate * 100}% win rate
    Risk Level: Current drawdown ${context.riskMetrics.currentDrawdown * 100}%
    Active Goals: ${context.goals.activeGoals.length} objectives in progress
    `
  }
  
  /**
   * Assess current market conditions
   */
  private assessMarketConditions(marketData: MarketData[]): string {
    if (marketData.length === 0) return 'no_data'
    
    const latest = marketData[marketData.length - 1]
    const previous = marketData[marketData.length - 2]
    
    if (!previous) return 'insufficient_data'
    
    const priceChange = (latest.close - previous.close) / previous.close
    const volumeChange = (latest.volume - previous.volume) / previous.volume
    
    if (priceChange > 0.02 && volumeChange > 0.1) return 'bullish_momentum'
    if (priceChange < -0.02 && volumeChange > 0.1) return 'bearish_momentum'
    if (Math.abs(priceChange) < 0.005) return 'sideways'
    
    return 'neutral'
  }
  
  /**
   * Calculate optimal quantity for trade
   */
  private calculateOptimalQuantity(decision: AgentDecision): number {
    const { portfolioState } = decision.context
    const { confidence, riskLevel } = decision.decision
    
    // Base position size on confidence and risk
    let baseSize = portfolioState.totalValue * 0.02 // 2% base position
    
    // Adjust for confidence
    baseSize *= confidence
    
    // Adjust for risk level
    const riskMultiplier = riskLevel === 'low' ? 0.5 : riskLevel === 'high' ? 2 : 1
    baseSize *= riskMultiplier
    
    // Convert to quantity (simplified - would need actual price)
    return Math.max(0.001, baseSize / 50000) // Assuming $50k asset price
  }
  
  /**
   * Generate mock market data for testing
   */
  private generateMockMarketData(): MarketData[] {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD']
    const data: MarketData[] = []
    
    for (const symbol of symbols) {
      const basePrice = symbol === 'BTC/USD' ? 50000 : symbol === 'ETH/USD' ? 3000 : 100
      
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(Date.now() - (20 - i) * 60000) // 1 minute intervals
        const randomChange = (Math.random() - 0.5) * 0.02 // ±1% random change
        const price = basePrice * (1 + randomChange * i * 0.1)
        
        data.push({
          symbol,
          timestamp,
          open: price * 0.999,
          high: price * 1.001,
          low: price * 0.998,
          close: price,
          volume: Math.random() * 1000000
        })
      }
    }
    
    return data
  }
  
  /**
   * Add decision to agent history
   */
  private addDecisionToHistory(agentId: string, decision: AgentDecision) {
    const history = this.agentDecisionHistory.get(agentId) || []
    history.push(decision)
    
    // Keep only last 100 decisions
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
    
    this.agentDecisionHistory.set(agentId, history)
  }
  
  /**
   * Get agent decision history
   */
  getAgentDecisionHistory(agentId: string): AgentDecision[] {
    return this.agentDecisionHistory.get(agentId) || []
  }
  
  /**
   * Get agent configuration
   */
  getAgentConfig(agentId: string): LLMAgentConfig | undefined {
    return this.agentConfigs.get(agentId)
  }
  
  /**
   * Update agent configuration
   */
  updateAgentConfig(agentId: string, updates: Partial<LLMAgentConfig>): boolean {
    const config = this.agentConfigs.get(agentId)
    if (!config) return false
    
    const updatedConfig = { ...config, ...updates }
    this.agentConfigs.set(agentId, updatedConfig)
    
    // Restart decision loop if frequency changed
    if (updates.decisionFrequency && this.activeDecisionLoops.has(agentId)) {
      this.stopDecisionLoop(agentId)
      this.startDecisionLoop(agentId)
    }
    
    return true
  }
  
  /**
   * Get all active decision loops
   */
  getActiveLoops(): string[] {
    return Array.from(this.activeDecisionLoops.keys())
  }
  
  /**
   * Stop all decision loops
   */
  stopAllLoops() {
    for (const agentId of this.activeDecisionLoops.keys()) {
      this.stopDecisionLoop(agentId)
    }
  }
}

// Export singleton instance
export const llmDecisionIntegrationService = new LLMDecisionIntegrationService()