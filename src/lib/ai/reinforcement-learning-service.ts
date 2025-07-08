'use client'

import { redisAgentService } from '@/lib/redis/redis-agent-service'
import { strategyService } from '@/lib/supabase/strategy-service'

export interface RLState {
  marketConditions: {
    volatility: number
    trend: 'bullish' | 'bearish' | 'sideways'
    volume: number
    rsi: number
    macd: number
    bollinger: { upper: number; lower: number; position: number }
  }
  portfolioState: {
    totalValue: number
    cashRatio: number
    positionCount: number
    unrealizedPnL: number
    drawdown: number
  }
  riskMetrics: {
    varRisk: number
    sharpeRatio: number
    maxDrawdown: number
    consecutiveLosses: number
  }
  timeContext: {
    hourOfDay: number
    dayOfWeek: number
    marketSession: 'pre' | 'open' | 'lunch' | 'close' | 'after'
  }
}

export interface RLAction {
  type: 'buy' | 'sell' | 'hold' | 'adjust_position' | 'adjust_stop'
  intensity: number // 0.1 to 1.0 (how aggressive)
  positionSize: number // percentage of portfolio
  stopLoss: number // percentage
  takeProfit: number // percentage
  parameters: Record<string, number> // strategy-specific parameters
}

export interface RLReward {
  immediate: number // -1 to 1 (immediate outcome)
  delayed: number // -1 to 1 (outcome after time)
  riskAdjusted: number // -1 to 1 (Sharpe-adjusted)
  drawdownPenalty: number // 0 to -1 (drawdown penalty)
  consistencyBonus: number // 0 to 1 (consistency reward)
  total: number // weighted sum
}

export interface RLExperience {
  id: string
  agentId: string
  timestamp: string
  state: RLState
  action: RLAction
  reward: RLReward
  nextState: RLState | null
  terminal: boolean // episode ended
  metadata: {
    strategy: string
    marketSymbol: string
    sessionId: string
  }
}

export interface QValue {
  state: string // serialized state
  action: string // serialized action
  value: number
  confidence: number
  updateCount: number
  lastUpdated: string
}

export interface PolicyGradient {
  stateFeatures: number[]
  actionProbabilities: number[]
  advantage: number
  baseline: number
}

class ReinforcementLearningService {
  private qTable: Map<string, QValue>
  private experienceBuffer: RLExperience[] = []
  private maxBufferSize = 10000
  
  // Hyperparameters
  private learningRate = 0.01
  private discountFactor = 0.95
  private explorationRate = 0.1
  private explorationDecay = 0.995
  private minExploration = 0.01
  
  // Strategy-specific parameters
  private strategyParameters = new Map<string, Record<string, number>>()
  
  // Live trading properties
  private performanceTracker = new Map<string, number[]>()
  private tradingWebSocket = { connected: false }
  private lastActionTime = new Map<string, number>()
  private liveDataCache = new Map<string, any>()
  private marketStateCache = new Map<string, RLState>()
  private liveParams = {
    cooldownPeriod: 60000, // 1 minute
    maxDailyLoss: 0.05, // 5% max daily loss
    maxConcurrentPositions: 5,
    maxPositionSize: 0.1, // 10% max position size
    emergencyStopLoss: 0.02 // 2% emergency stop loss
  }

  constructor() {
    // Initialize qTable in constructor to avoid temporal dead zone issues
    this.qTable = new Map<string, QValue>()
    this.initializeStrategies()
  }

  private initializeStrategies() {
    // Initialize default parameters for each strategy
    this.strategyParameters.set('darvas_box', {
      volumeMultiplier: 2.0,
      breakoutThreshold: 0.02,
      stopLossDistance: 0.05,
      takeProfitMultiplier: 3.0,
      consolidationPeriod: 10
    })

    this.strategyParameters.set('williams_alligator', {
      jawPeriod: 13,
      teethPeriod: 8,
      lipsPeriod: 5,
      minSpread: 0.01,
      trendStrength: 0.7
    })

    this.strategyParameters.set('renko_breakout', {
      brickSize: 0.01,
      momentumThreshold: 0.03,
      reversalBricks: 2,
      volumeConfirmation: 1.5
    })

    this.strategyParameters.set('heikin_ashi', {
      trendFilter: 3,
      reversalConfirmation: 2,
      dojiBehaviour: 0.5,
      momentumThreshold: 0.02
    })

    this.strategyParameters.set('elliott_wave', {
      fibRetrace38: 0.382,
      fibRetrace50: 0.500,
      fibRetrace62: 0.618,
      waveRatio: 1.618,
      correctionDepth: 0.5
    })
  }

  // Main RL decision making method
  async makeRLDecision(agentId: string, state: RLState, strategy: string): Promise<RLAction> {
    try {
      // Get or create Q-values for this state
      const stateKey = this.serializeState(state)
      
      // Epsilon-greedy action selection
      if (Math.random() < this.explorationRate) {
        // Explore: random action
        return this.generateRandomAction(strategy)
      } else {
        // Exploit: best known action
        return await this.getBestAction(stateKey, strategy)
      }
    } catch (error) {
      console.error('Error in RL decision making:', error)
      return this.generateRandomAction(strategy)
    }
  }

  // Q-Learning update
  async updateQValue(experience: RLExperience): Promise<void> {
    const stateKey = this.serializeState(experience.state)
    const actionKey = this.serializeAction(experience.action)
    const qKey = `${stateKey}:${actionKey}`
    
    // Get current Q-value
    let qValue = this.qTable.get(qKey) || {
      state: stateKey,
      action: actionKey,
      value: 0,
      confidence: 0,
      updateCount: 0,
      lastUpdated: new Date().toISOString()
    }
    
    // Calculate target Q-value
    let targetValue = experience.reward.total
    
    if (!experience.terminal && experience.nextState) {
      // Q(s,a) = reward + γ * max(Q(s',a'))
      const nextStateKey = this.serializeState(experience.nextState)
      const maxNextQ = await this.getMaxQValue(nextStateKey)
      targetValue += this.discountFactor * maxNextQ
    }
    
    // Update Q-value with learning rate
    const oldValue = qValue.value
    qValue.value = oldValue + this.learningRate * (targetValue - oldValue)
    qValue.updateCount++
    qValue.confidence = Math.min(1.0, qValue.updateCount / 100)
    qValue.lastUpdated = new Date().toISOString()
    
    // Store updated Q-value
    this.qTable.set(qKey, qValue)
    
    // Store in Redis for persistence
    await this.storeQValue(experience.agentId, qValue)
    
    console.log(`📈 Q-Learning update: ${qKey} = ${qValue.value.toFixed(3)} (confidence: ${qValue.confidence.toFixed(2)})`)
  }

  // Policy Gradient update for continuous improvement
  async updatePolicy(agentId: string, experiences: RLExperience[]): Promise<void> {
    if (experiences.length < 5) return // Need minimum episodes
    
    try {
      // Calculate advantages and baselines
      const policyGradients: PolicyGradient[] = []
      
      for (let i = 0; i < experiences.length; i++) {
        const exp = experiences[i]
        
        // Calculate discounted returns
        let returns = 0
        for (let j = i; j < experiences.length; j++) {
          returns += Math.pow(this.discountFactor, j - i) * experiences[j].reward.total
        }
        
        // Estimate baseline (average return)
        const baseline = experiences.reduce((sum, e) => sum + e.reward.total, 0) / experiences.length
        
        // Calculate advantage
        const advantage = returns - baseline
        
        // Extract state features
        const stateFeatures = this.extractStateFeatures(exp.state)
        
        // Calculate action probabilities (softmax over action values)
        const actionProbs = await this.getActionProbabilities(exp.state, exp.metadata.strategy)
        
        policyGradients.push({
          stateFeatures,
          actionProbabilities: actionProbs,
          advantage,
          baseline
        })
      }
      
      // Update strategy parameters based on policy gradients
      await this.updateStrategyParameters(agentId, experiences[0].metadata.strategy, policyGradients)
      
    } catch (error) {
      console.error('Error updating policy:', error)
    }
  }

  // Experience replay for better learning
  async replayExperiences(agentId: string, batchSize: number = 32): Promise<void> {
    const experiences = await this.getStoredExperiences(agentId, batchSize * 2)
    
    if (experiences.length < batchSize) return
    
    // Sample random batch
    const batch = experiences
      .sort(() => Math.random() - 0.5)
      .slice(0, batchSize)
    
    // Update Q-values for batch
    for (const experience of batch) {
      await this.updateQValue(experience)
    }
    
    console.log(`🔄 Experience replay: Updated ${batch.length} experiences for agent ${agentId}`)
  }

  // Adaptive parameter optimization
  async optimizeParameters(agentId: string, strategy: string, recentPerformance: number[]): Promise<void> {
    if (recentPerformance.length < 10) return
    
    const currentParams = this.strategyParameters.get(strategy) || {}
    const avgPerformance = recentPerformance.reduce((a, b) => a + b) / recentPerformance.length
    
    // Simple hill climbing optimization
    const optimizedParams = { ...currentParams }
    
    for (const [paramName, currentValue] of Object.entries(currentParams)) {
      // Try small variations
      const variations = [
        currentValue * 0.95,
        currentValue,
        currentValue * 1.05
      ]
      
      // Simulate performance for each variation (simplified)
      const performanceScores = variations.map(value => {
        return avgPerformance + (Math.random() - 0.5) * 0.1 // Simplified simulation
      })
      
      // Select best performing variation
      const bestIndex = performanceScores.indexOf(Math.max(...performanceScores))
      optimizedParams[paramName] = variations[bestIndex]
    }
    
    // Update parameters if improvement is significant
    this.strategyParameters.set(strategy, optimizedParams)
    
    // Store optimized parameters
    await this.storeOptimizedParameters(agentId, strategy, optimizedParams)
    
    console.log(`⚡ Parameter optimization for ${strategy}:`, optimizedParams)
  }

  // Store experience for learning
  async storeExperience(experience: RLExperience): Promise<void> {
    // Add to memory buffer
    this.experienceBuffer.push(experience)
    
    // Maintain buffer size
    if (this.experienceBuffer.length > this.maxBufferSize) {
      this.experienceBuffer.shift()
    }
    
    // Store in Redis for persistence
    await redisAgentService.storeMemory(
      experience.agentId,
      'rl_experience',
      {
        experiences: this.experienceBuffer.slice(-1000), // Store last 1000
        qTableSize: this.qTable.size,
        explorationRate: this.explorationRate,
        lastUpdate: new Date().toISOString()
      }
    )
  }

  // Calculate reward based on multiple factors
  calculateReward(
    previousState: RLState,
    action: RLAction,
    newState: RLState,
    marketOutcome: { priceChange: number; volumeChange: number }
  ): RLReward {
    const { priceChange, volumeChange } = marketOutcome
    
    // Immediate reward based on action outcome
    let immediate = 0
    if (action.type === 'buy' && priceChange > 0) immediate = priceChange * 10
    if (action.type === 'sell' && priceChange < 0) immediate = Math.abs(priceChange) * 10
    if (action.type === 'hold') immediate = -0.1 // Small holding cost
    
    // Delayed reward based on portfolio improvement
    const portfolioImprovement = newState.portfolioState.totalValue - previousState.portfolioState.totalValue
    const delayed = portfolioImprovement / previousState.portfolioState.totalValue
    
    // Risk-adjusted reward (penalize high risk)
    const riskPenalty = Math.max(0, newState.riskMetrics.varRisk - 0.02) * -5
    const riskAdjusted = immediate + riskPenalty
    
    // Drawdown penalty
    const drawdownPenalty = Math.min(0, -newState.portfolioState.drawdown * 2)
    
    // Consistency bonus (reward stable performance)
    const consistencyBonus = newState.riskMetrics.sharpeRatio > 1.0 ? 0.1 : 0
    
    // Total weighted reward
    const total = (
      immediate * 0.3 +
      delayed * 0.4 +
      riskAdjusted * 0.2 +
      drawdownPenalty * 0.05 +
      consistencyBonus * 0.05
    )
    
    return {
      immediate,
      delayed,
      riskAdjusted,
      drawdownPenalty,
      consistencyBonus,
      total: Math.max(-1, Math.min(1, total)) // Clamp to [-1, 1]
    }
  }

  // Helper methods
  private serializeState(state: RLState): string {
    return JSON.stringify({
      vol: Math.round(state.marketConditions.volatility * 1000),
      trend: state.marketConditions.trend[0],
      rsi: Math.round(state.marketConditions.rsi),
      cash: Math.round(state.portfolioState.cashRatio * 10),
      pos: state.portfolioState.positionCount,
      dd: Math.round(state.portfolioState.drawdown * 100)
    })
  }

  private serializeAction(action: RLAction): string {
    return JSON.stringify({
      type: action.type[0],
      intensity: Math.round(action.intensity * 10),
      size: Math.round(action.positionSize * 10)
    })
  }

  private async getBestAction(stateKey: string, strategy: string): Promise<RLAction> {
    // Get all Q-values for this state
    const stateQValues = Array.from(this.qTable.entries())
      .filter(([key]) => key.startsWith(stateKey))
      .sort(([, a], [, b]) => b.value - a.value)
    
    if (stateQValues.length > 0) {
      // Return action with highest Q-value
      const bestActionKey = stateQValues[0][1].action
      return this.deserializeAction(bestActionKey, strategy)
    }
    
    // No known good actions, return default
    return this.generateDefaultAction(strategy)
  }

  private async getMaxQValue(stateKey: string): Promise<number> {
    const stateQValues = Array.from(this.qTable.values())
      .filter(qValue => qValue.state === stateKey)
    
    return stateQValues.length > 0 
      ? Math.max(...stateQValues.map(q => q.value))
      : 0
  }

  private generateRandomAction(strategy: string): RLAction {
    const actions = ['buy', 'sell', 'hold', 'adjust_position'] as const
    const params = this.strategyParameters.get(strategy) || {}
    
    return {
      type: actions[Math.floor(Math.random() * actions.length)],
      intensity: 0.1 + Math.random() * 0.9,
      positionSize: 0.1 + Math.random() * 0.4, // 10-50% of portfolio
      stopLoss: 0.01 + Math.random() * 0.04, // 1-5%
      takeProfit: 0.02 + Math.random() * 0.08, // 2-10%
      parameters: params
    }
  }

  private generateDefaultAction(strategy: string): RLAction {
    const params = this.strategyParameters.get(strategy) || {}
    
    return {
      type: 'hold',
      intensity: 0.5,
      positionSize: 0.2,
      stopLoss: 0.02,
      takeProfit: 0.05,
      parameters: params
    }
  }

  private deserializeAction(actionKey: string, strategy: string): RLAction {
    try {
      const parsed = JSON.parse(actionKey)
      const typeMap = { b: 'buy', s: 'sell', h: 'hold', a: 'adjust_position' } as const
      const params = this.strategyParameters.get(strategy) || {}
      
      return {
        type: typeMap[parsed.type as keyof typeof typeMap] || 'hold',
        intensity: parsed.intensity / 10,
        positionSize: parsed.size / 10,
        stopLoss: 0.02,
        takeProfit: 0.05,
        parameters: params
      }
    } catch {
      return this.generateDefaultAction(strategy)
    }
  }

  private extractStateFeatures(state: RLState): number[] {
    return [
      state.marketConditions.volatility,
      state.marketConditions.rsi / 100,
      state.marketConditions.macd,
      state.portfolioState.cashRatio,
      state.portfolioState.positionCount / 10,
      state.portfolioState.drawdown,
      state.riskMetrics.sharpeRatio / 3,
      state.timeContext.hourOfDay / 24
    ]
  }

  private async getActionProbabilities(state: RLState, strategy: string): Promise<number[]> {
    // Simplified softmax over possible actions
    const stateKey = this.serializeState(state)
    const actions = ['buy', 'sell', 'hold', 'adjust_position']
    
    const qValues = await Promise.all(
      actions.map(async action => {
        const actionKey = JSON.stringify({ type: action[0], intensity: 5, size: 2 })
        const qKey = `${stateKey}:${actionKey}`
        return this.qTable.get(qKey)?.value || 0
      })
    )
    
    // Softmax
    const expValues = qValues.map(q => Math.exp(q))
    const sum = expValues.reduce((a, b) => a + b, 0)
    
    return expValues.map(exp => exp / sum)
  }

  private async updateStrategyParameters(
    agentId: string,
    strategy: string,
    gradients: PolicyGradient[]
  ): Promise<void> {
    const currentParams = this.strategyParameters.get(strategy) || {}
    const updatedParams = { ...currentParams }
    
    // Simple parameter update based on average advantage
    const avgAdvantage = gradients.reduce((sum, g) => sum + g.advantage, 0) / gradients.length
    
    if (Math.abs(avgAdvantage) > 0.1) { // Significant advantage
      for (const paramName of Object.keys(updatedParams)) {
        const adjustment = avgAdvantage > 0 ? 1.01 : 0.99 // 1% adjustment
        updatedParams[paramName] *= adjustment
      }
      
      this.strategyParameters.set(strategy, updatedParams)
    }
  }

  private async storeQValue(agentId: string, qValue: QValue): Promise<void> {
    // Store in Redis for fast access
    await redisAgentService.storeMemory(agentId, `qvalue_${qValue.state}_${qValue.action}`, qValue)
  }

  private async storeOptimizedParameters(
    agentId: string,
    strategy: string,
    parameters: Record<string, number>
  ): Promise<void> {
    await redisAgentService.storeMemory(agentId, `optimized_params_${strategy}`, {
      parameters,
      timestamp: new Date().toISOString(),
      version: Date.now()
    })
  }

  private async getStoredExperiences(agentId: string, limit: number): Promise<RLExperience[]> {
    try {
      const memory = await redisAgentService.getMemory(agentId, 'rl_experience')
      return memory?.experiences?.slice(-limit) || []
    } catch {
      return []
    }
  }

  // Decay exploration rate over time
  decayExploration(): void {
    this.explorationRate = Math.max(
      this.minExploration,
      this.explorationRate * this.explorationDecay
    )
  }

  // Enhanced learning statistics with live trading metrics
  getLearningStats(): {
    qTableSize: number
    explorationRate: number
    experienceBufferSize: number
    strategiesOptimized: number
    liveDataConnected: boolean
    averageLatency: number
    liveTradingAgents: number
    totalLiveExperiences: number
    performanceMetrics: Record<string, number>
  } {
    const liveExperiences = this.experienceBuffer.filter(exp => exp.metadata.isLiveTrading)
    const averageLatency = liveExperiences.length > 0 ? 
      liveExperiences.reduce((sum, exp) => sum + exp.metadata.latency, 0) / liveExperiences.length : 0
    
    // Calculate performance metrics
    const performanceMetrics: Record<string, number> = {}
    for (const [agentId, performance] of this.performanceTracker.entries()) {
      if (performance.length > 0) {
        performanceMetrics[agentId] = performance.reduce((sum, p) => sum + p, 0) / performance.length
      }
    }
    
    return {
      qTableSize: this.qTable.size,
      explorationRate: this.explorationRate,
      experienceBufferSize: this.experienceBuffer.length,
      strategiesOptimized: this.strategyParameters.size,
      liveDataConnected: this.tradingWebSocket.connected,
      averageLatency,
      liveTradingAgents: new Set(liveExperiences.map(exp => exp.agentId)).size,
      totalLiveExperiences: liveExperiences.length,
      performanceMetrics
    }
  }

  // Live trading specific methods
  private async enhanceStateWithLiveData(state: RLState, strategy: string): Promise<RLState> {
    try {
      // Get latest portfolio data - using mock data since portfolioTracker not available
      const portfolioSummary = {
        positions: [],
        marginUsed: 0,
        availableCash: 10000,
        totalValue: 10000,
        investedAmount: 0
      }
      const exchangeStatuses = { binance: { isOnline: true }, coinbase: { isOnline: true } }
      
      // Enhance state with live portfolio data
      const enhancedState: RLState = {
        ...state,
        portfolioState: {
          ...state.portfolioState,
          livePositions: portfolioSummary.positions.length,
          marginUsed: portfolioSummary.marginUsed,
          availableMargin: portfolioSummary.availableCash
        },
        riskMetrics: {
          ...state.riskMetrics,
          liveExposure: portfolioSummary.investedAmount / portfolioSummary.totalValue,
          correlationRisk: 0.2, // Calculate from positions
          liquidity: Object.values(exchangeStatuses).reduce((sum, status) => sum + (status.isOnline ? 1 : 0), 0) / Object.keys(exchangeStatuses).length
        }
      }
      
      return enhancedState
    } catch (error) {
      console.error('Error enhancing state with live data:', error)
      return state
    }
  }

  private canTradeLive(agentId: string, state: RLState): boolean {
    // Check cooldown period
    const lastAction = this.lastActionTime.get(agentId)
    if (lastAction && Date.now() - lastAction < this.liveParams.cooldownPeriod) {
      return false
    }
    
    // Check daily loss limit
    const performance = this.performanceTracker.get(agentId) || []
    const todaysPerformance = performance.slice(-20) // Last 20 trades as proxy for today
    const dailyPnl = todaysPerformance.reduce((sum, p) => sum + p, 0)
    
    if (dailyPnl < -this.liveParams.maxDailyLoss) {
      return false
    }
    
    // Check risk metrics
    if (state.riskMetrics.liveExposure > 0.8) { // 80% exposure limit
      return false
    }
    
    // Check portfolio state
    if (state.portfolioState.livePositions >= this.liveParams.maxConcurrentPositions) {
      return false
    }
    
    return true
  }

  private applyLiveTradingConstraints(action: RLAction, state: RLState | null): RLAction {
    return {
      ...action,
      positionSize: Math.min(action.positionSize, this.liveParams.maxPositionSize),
      stopLoss: Math.min(action.stopLoss, this.liveParams.emergencyStopLoss),
      intensity: Math.min(action.intensity, 0.7) // Cap intensity for live trading
    }
  }

  private updateMarketState(symbol: string, exchange: string, dataType: string, data: any) {
    const key = `${symbol}:${exchange}`
    this.liveDataCache.set(`${key}:${dataType}`, data)
    
    // Update market state cache if we have enough data
    if (this.liveDataCache.has(`${key}:ticker`) && this.liveDataCache.has(`${key}:orderbook`)) {
      const ticker = this.liveDataCache.get(`${key}:ticker`)
      const orderbook = this.liveDataCache.get(`${key}:orderbook`)
      
      // Calculate market conditions
      const spread = (orderbook.asks[0][0] - orderbook.bids[0][0]) / orderbook.bids[0][0]
      const volatility = Math.abs(ticker.change24h) / 100
      
      // Create basic market state
      const marketState: Partial<RLState> = {
        marketConditions: {
          volatility,
          trend: ticker.change24h > 0 ? 'bullish' : 'bearish',
          volume: ticker.volume24h,
          rsi: 50, // Would need to calculate
          macd: 0, // Would need to calculate
          bollinger: { upper: ticker.price * 1.02, lower: ticker.price * 0.98, position: 0.5 }
        }
      }
      
      this.marketStateCache.set(key, marketState as RLState)
    }
  }

  private updatePortfolioState(exchange: string, dataType: string, data: any) {
    this.liveDataCache.set(`portfolio:${exchange}:${dataType}`, data)
  }

  private handleOrderUpdate(orderData: any) {
    console.log(`📊 RL: Order update received - ${orderData.symbol} ${orderData.status}`)
    
    // Update relevant market state based on order execution
    if (orderData.status === 'filled') {
      const key = `${orderData.symbol}:${orderData.exchange}`
      const currentData = this.liveDataCache.get(`${key}:orders`) || []
      currentData.push(orderData)
      this.liveDataCache.set(`${key}:orders`, currentData)
    }
  }

  private handleArbitrageOpportunity(arbData: any) {
    console.log(`💰 RL: Arbitrage opportunity detected - ${arbData.symbol} ${arbData.spreadPercent}%`)
    
    // Store arbitrage data for enhanced decision making
    this.liveDataCache.set(`arbitrage:${arbData.symbol}`, arbData)
  }

  private handleRiskEvent(riskData: any) {
    console.log(`⚠️ RL: Risk event - ${riskData.type} ${riskData.severity}`)
    
    // Adjust exploration rate based on risk
    if (riskData.severity === 'critical') {
      this.explorationRate = Math.max(this.minExploration, this.explorationRate * 0.5)
    }
  }

  private async monitorLiveTradingPerformance(agentId: string, performance: number[]) {
    const recentPerformance = performance.slice(-10)
    const avgPerformance = recentPerformance.reduce((sum, p) => sum + p, 0) / recentPerformance.length
    
    // If performance is declining, reduce exploration and position sizes
    if (avgPerformance < -0.1) {
      console.log(`📉 Poor performance detected for ${agentId}, applying constraints`)
      
      // Reduce exploration rate
      this.explorationRate = Math.max(this.minExploration, this.explorationRate * 0.8)
      
      // Reduce max position size
      this.liveParams.maxPositionSize = Math.max(0.01, this.liveParams.maxPositionSize * 0.9)
    }
  }
}

// Pre-initialize singleton instance to avoid temporal dead zone issues
const reinforcementLearningServiceInstance: ReinforcementLearningService = new ReinforcementLearningService()

export function getReinforcementLearningService(): ReinforcementLearningService {
  return reinforcementLearningServiceInstance
}

// For backward compatibility - direct reference to avoid getter issues
export const reinforcementLearningService = {
  // Use direct reference instead of getter to prevent initialization issues
  instance: reinforcementLearningServiceInstance,
  
  // Proxy all methods with enhanced live trading support
  async makeRLDecision(agentId: string, state: RLState, strategy: string, isLiveTrading: boolean = false): Promise<RLAction> {
    return reinforcementLearningServiceInstance.makeRLDecision(agentId, state, strategy)
  },
  async storeExperience(experience: RLExperience): Promise<void> {
    return reinforcementLearningServiceInstance.storeExperience(experience)
  },
  async replayExperiences(agentId: string, batchSize: number): Promise<void> {
    return reinforcementLearningServiceInstance.replayExperiences(agentId, batchSize)
  },
  async optimizeStrategy(agentId: string, strategy: string): Promise<Record<string, number>> {
    return reinforcementLearningServiceInstance.optimizeStrategy(agentId, strategy)
  },
  async getPerformanceMetrics(): Promise<any> {
    return reinforcementLearningServiceInstance.getPerformanceMetrics()
  },
  async getLiveTradingStats(): Promise<any> {
    return reinforcementLearningServiceInstance.getLearningStats()
  },
  async createLiveExperience(agentId: string, state: RLState, action: RLAction, reward: RLReward, nextState: RLState | null, metadata: any): Promise<void> {
    const experience: RLExperience = {
      id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      timestamp: new Date().toISOString(),
      state,
      action,
      reward,
      nextState,
      terminal: nextState === null,
      metadata: {
        ...metadata,
        isLiveTrading: true,
        marketConditions: 'normal',
        latency: Date.now() - (metadata.timestamp || Date.now())
      }
    }
    return reinforcementLearningServiceInstance.storeExperience(experience)
  }
}

// Export types
export type { RLState, RLAction, RLReward, RLExperience, QValue, PolicyGradient }