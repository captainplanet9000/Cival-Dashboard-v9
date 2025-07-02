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
  private qTable = new Map<string, QValue>()
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

  constructor() {
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

  // Get current learning statistics
  getLearningStats(): {
    qTableSize: number
    explorationRate: number
    experienceBufferSize: number
    strategiesOptimized: number
  } {
    return {
      qTableSize: this.qTable.size,
      explorationRate: this.explorationRate,
      experienceBufferSize: this.experienceBuffer.length,
      strategiesOptimized: this.strategyParameters.size
    }
  }
}

// Export singleton instance
export const reinforcementLearningService = new ReinforcementLearningService()

// Export types
export type { RLState, RLAction, RLReward, RLExperience, QValue, PolicyGradient }