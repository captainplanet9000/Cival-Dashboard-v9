'use client'

import { exchangeManager } from '@/lib/exchanges/exchange-manager'
import { enhancedRedisService } from '@/lib/redis/enhanced-redis-service'
import { n8nClient } from '@/lib/automation/n8n-client'
import type { MarketData, TradeOrder, OrderStatus } from '@/lib/exchanges/exchange-connector-base'
import type { TradingSignal } from '@/lib/automation/n8n-client'

export interface AgentConfig {
  id: string
  name: string
  type: 'momentum' | 'arbitrage' | 'mean_reversion' | 'scalping' | 'swing'
  isActive: boolean
  riskTolerance: 'low' | 'medium' | 'high'
  maxPositionSize: number
  maxDailyTrades: number
  allowedSymbols: string[]
  exchangePreferences: string[]
  strategies: AgentStrategy[]
  settings: AgentSettings
}

export interface AgentStrategy {
  id: string
  name: string
  type: string
  parameters: { [key: string]: any }
  isActive: boolean
  weight: number // Portfolio allocation weight
}

export interface AgentSettings {
  stopLoss: number // Percentage
  takeProfit: number // Percentage
  maxDrawdown: number // Percentage
  cooldownPeriod: number // Minutes between trades
  confidenceThreshold: number // Minimum confidence for trade execution
  enablePaperTrading: boolean
  notificationLevel: 'all' | 'errors_only' | 'none'
}

export interface AgentPerformance {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalPnL: number
  winRate: number
  averageReturn: number
  sharpeRatio: number
  maxDrawdown: number
  averageHoldTime: number // Minutes
  lastUpdated: Date
}

export interface AgentPosition {
  id: string
  symbol: string
  side: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  realizedPnL: number
  entryTime: Date
  stopLoss?: number
  takeProfit?: number
  exchange: string
}

export interface AgentDecision {
  id: string
  agentId: string
  timestamp: Date
  action: 'buy' | 'sell' | 'hold' | 'close'
  symbol: string
  confidence: number
  reasoning: string[]
  parameters: { [key: string]: any }
  marketData: Partial<MarketData>
  executed: boolean
  executionResult?: {
    orderId?: string
    executedPrice?: number
    executedQuantity?: number
    status: 'success' | 'failed' | 'partial'
    error?: string
  }
}

export interface AgentMemory {
  agentId: string
  marketConditions: MarketCondition[]
  priceHistory: { [symbol: string]: number[] }
  tradeHistory: AgentDecision[]
  learnedPatterns: Pattern[]
  riskMetrics: RiskMetrics
  adaptations: Adaptation[]
}

export interface MarketCondition {
  timestamp: Date
  volatility: number
  trend: 'bull' | 'bear' | 'sideways'
  volume: number
  sentiment: number // -1 to 1
  symbols: string[]
}

export interface Pattern {
  id: string
  type: 'price_pattern' | 'volume_pattern' | 'time_pattern'
  description: string
  conditions: any[]
  successRate: number
  profitability: number
  frequency: number
}

export interface RiskMetrics {
  currentDrawdown: number
  portfolioValue: number
  exposureBySymbol: { [symbol: string]: number }
  exposureByExchange: { [exchange: string]: number }
  dailyVaR: number
  correlation: { [pair: string]: number }
}

export interface Adaptation {
  timestamp: Date
  trigger: string
  oldParameter: any
  newParameter: any
  reason: string
  performance: number
}

export class EnhancedAgentTrading {
  private agents: Map<string, AgentConfig> = new Map()
  private agentMemories: Map<string, AgentMemory> = new Map()
  private agentPositions: Map<string, AgentPosition[]> = new Map()
  private agentPerformance: Map<string, AgentPerformance> = new Map()
  private recentDecisions: Map<string, AgentDecision[]> = new Map()
  private isRunning: boolean = false

  constructor() {
    this.initializeDefaultAgents()
  }

  // Agent Management
  async createAgent(config: Omit<AgentConfig, 'id'>): Promise<string> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullConfig: AgentConfig = {
      ...config,
      id: agentId
    }

    this.agents.set(agentId, fullConfig)
    
    // Initialize agent memory and performance
    this.agentMemories.set(agentId, this.createInitialMemory(agentId))
    this.agentPositions.set(agentId, [])
    this.agentPerformance.set(agentId, this.createInitialPerformance())
    this.recentDecisions.set(agentId, [])

    // Cache agent data
    await enhancedRedisService.cacheAgentStatus(agentId, fullConfig)
    
    console.log(`Agent created: ${agentId} (${config.name})`)
    return agentId
  }

  async updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    const updatedAgent = { ...agent, ...updates }
    this.agents.set(agentId, updatedAgent)
    
    await enhancedRedisService.cacheAgentStatus(agentId, updatedAgent)
    return true
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    if (!this.agents.has(agentId)) return false

    // Stop agent if running
    await this.deactivateAgent(agentId)
    
    // Clean up data
    this.agents.delete(agentId)
    this.agentMemories.delete(agentId)
    this.agentPositions.delete(agentId)
    this.agentPerformance.delete(agentId)
    this.recentDecisions.delete(agentId)

    return true
  }

  async activateAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    agent.isActive = true
    this.agents.set(agentId, agent)
    
    await enhancedRedisService.cacheAgentStatus(agentId, agent)
    console.log(`Agent activated: ${agentId}`)
    return true
  }

  async deactivateAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    agent.isActive = false
    this.agents.set(agentId, agent)
    
    // Close all positions
    await this.closeAllPositions(agentId)
    
    await enhancedRedisService.cacheAgentStatus(agentId, agent)
    console.log(`Agent deactivated: ${agentId}`)
    return true
  }

  // Trading Engine
  async startTradingEngine(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    console.log('Trading engine started')

    // Main trading loop
    const tradingLoop = async () => {
      while (this.isRunning) {
        try {
          await this.processTradingCycle()
          await this.sleep(5000) // 5 second cycle
        } catch (error) {
          console.error('Trading cycle error:', error)
          await this.sleep(10000) // Longer delay on error
        }
      }
    }

    tradingLoop()
  }

  async stopTradingEngine(): Promise<void> {
    this.isRunning = false
    console.log('Trading engine stopped')
  }

  private async processTradingCycle(): Promise<void> {
    const activeAgents = Array.from(this.agents.values()).filter(agent => agent.isActive)
    
    for (const agent of activeAgents) {
      try {
        await this.processAgentCycle(agent)
      } catch (error) {
        console.error(`Error processing agent ${agent.id}:`, error)
      }
    }
  }

  private async processAgentCycle(agent: AgentConfig): Promise<void> {
    // 1. Gather market data
    const marketData = await this.gatherMarketData(agent.allowedSymbols)
    
    // 2. Update agent memory
    await this.updateAgentMemory(agent.id, marketData)
    
    // 3. Generate trading decisions
    const decisions = await this.generateTradingDecisions(agent, marketData)
    
    // 4. Execute decisions
    for (const decision of decisions) {
      await this.executeDecision(agent, decision)
    }
    
    // 5. Update positions and performance
    await this.updateAgentPositions(agent.id)
    await this.updateAgentPerformance(agent.id)
    
    // 6. Adaptive learning
    await this.performAdaptiveLearning(agent.id)
  }

  private async gatherMarketData(symbols: string[]): Promise<{ [symbol: string]: MarketData }> {
    const marketData: { [symbol: string]: MarketData } = {}
    
    for (const symbol of symbols) {
      try {
        const multiData = await exchangeManager.getMultiExchangeMarketData(symbol)
        if (multiData && Object.keys(multiData.exchanges).length > 0) {
          // Use average price from all exchanges
          marketData[symbol] = {
            symbol,
            price: multiData.avgPrice,
            bid: multiData.bestBid.price,
            ask: multiData.bestAsk.price,
            volume: multiData.totalVolume,
            change24h: 0, // Calculate from price history
            high24h: multiData.avgPrice * 1.02,
            low24h: multiData.avgPrice * 0.98,
            timestamp: multiData.timestamp
          }
        }
      } catch (error) {
        console.error(`Error getting market data for ${symbol}:`, error)
      }
    }
    
    return marketData
  }

  private async updateAgentMemory(agentId: string, marketData: { [symbol: string]: MarketData }): Promise<void> {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return

    // Update price history
    Object.entries(marketData).forEach(([symbol, data]) => {
      if (!memory.priceHistory[symbol]) {
        memory.priceHistory[symbol] = []
      }
      memory.priceHistory[symbol].push(data.price)
      
      // Keep only last 1000 prices
      if (memory.priceHistory[symbol].length > 1000) {
        memory.priceHistory[symbol] = memory.priceHistory[symbol].slice(-1000)
      }
    })

    // Analyze market conditions
    const condition: MarketCondition = {
      timestamp: new Date(),
      volatility: this.calculateVolatility(marketData),
      trend: this.analyzeTrend(marketData),
      volume: Object.values(marketData).reduce((sum, data) => sum + data.volume, 0),
      sentiment: this.calculateSentiment(marketData),
      symbols: Object.keys(marketData)
    }

    memory.marketConditions.push(condition)
    if (memory.marketConditions.length > 100) {
      memory.marketConditions = memory.marketConditions.slice(-100)
    }

    this.agentMemories.set(agentId, memory)
  }

  private async generateTradingDecisions(agent: AgentConfig, marketData: { [symbol: string]: MarketData }): Promise<AgentDecision[]> {
    const decisions: AgentDecision[] = []
    const memory = this.agentMemories.get(agent.id)
    if (!memory) return decisions

    for (const symbol of agent.allowedSymbols) {
      const data = marketData[symbol]
      if (!data) continue

      // Check cooldown period
      const lastDecision = this.getLastDecision(agent.id, symbol)
      if (lastDecision && this.isInCooldown(lastDecision, agent.settings.cooldownPeriod)) {
        continue
      }

      // Generate decision based on agent type and strategies
      const decision = await this.generateDecisionForSymbol(agent, symbol, data, memory)
      if (decision && decision.confidence >= agent.settings.confidenceThreshold) {
        decisions.push(decision)
      }
    }

    return decisions
  }

  private async generateDecisionForSymbol(
    agent: AgentConfig, 
    symbol: string, 
    marketData: MarketData, 
    memory: AgentMemory
  ): Promise<AgentDecision | null> {
    const priceHistory = memory.priceHistory[symbol] || []
    if (priceHistory.length < 10) return null // Need minimum history

    let action: 'buy' | 'sell' | 'hold' | 'close' = 'hold'
    let confidence = 0
    let reasoning: string[] = []

    // Apply strategies based on agent type
    switch (agent.type) {
      case 'momentum':
        const momentum = this.calculateMomentum(priceHistory)
        if (momentum > 0.02) {
          action = 'buy'
          confidence = Math.min(momentum * 10, 0.9)
          reasoning.push(`Strong upward momentum detected: ${(momentum * 100).toFixed(2)}%`)
        } else if (momentum < -0.02) {
          action = 'sell'
          confidence = Math.min(Math.abs(momentum) * 10, 0.9)
          reasoning.push(`Strong downward momentum detected: ${(momentum * 100).toFixed(2)}%`)
        }
        break

      case 'mean_reversion':
        const deviation = this.calculateStandardDeviation(priceHistory)
        const currentDeviation = (marketData.price - this.calculateMean(priceHistory)) / deviation
        if (currentDeviation > 2) {
          action = 'sell'
          confidence = Math.min(currentDeviation / 3, 0.9)
          reasoning.push(`Price significantly above mean (${currentDeviation.toFixed(2)} std dev)`)
        } else if (currentDeviation < -2) {
          action = 'buy'
          confidence = Math.min(Math.abs(currentDeviation) / 3, 0.9)
          reasoning.push(`Price significantly below mean (${currentDeviation.toFixed(2)} std dev)`)
        }
        break

      case 'arbitrage':
        // This would check for arbitrage opportunities across exchanges
        const arbitrageOpp = await exchangeManager.findArbitrageOpportunities([symbol])
        if (arbitrageOpp.length > 0) {
          const opp = arbitrageOpp[0]
          if (opp.spreadPercentage > 0.5) {
            action = 'buy' // Simplified - would need more complex logic
            confidence = Math.min(opp.spreadPercentage / 2, 0.9)
            reasoning.push(`Arbitrage opportunity: ${opp.spreadPercentage.toFixed(2)}% spread`)
          }
        }
        break

      case 'scalping':
        const shortTermMomentum = this.calculateMomentum(priceHistory.slice(-5))
        const volatility = this.calculateVolatility({ [symbol]: marketData })
        if (volatility > 0.01 && Math.abs(shortTermMomentum) > 0.005) {
          action = shortTermMomentum > 0 ? 'buy' : 'sell'
          confidence = Math.min(volatility * 50, 0.8)
          reasoning.push(`High volatility scalping opportunity: ${(volatility * 100).toFixed(3)}%`)
        }
        break
    }

    if (action === 'hold') return null

    const decision: AgentDecision = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      timestamp: new Date(),
      action,
      symbol,
      confidence,
      reasoning,
      parameters: {
        entryPrice: marketData.price,
        stopLoss: this.calculateStopLoss(marketData.price, action, agent.settings.stopLoss),
        takeProfit: this.calculateTakeProfit(marketData.price, action, agent.settings.takeProfit),
        quantity: this.calculatePositionSize(agent, marketData.price)
      },
      marketData,
      executed: false
    }

    return decision
  }

  private async executeDecision(agent: AgentConfig, decision: AgentDecision): Promise<void> {
    try {
      // Store decision
      let agentDecisions = this.recentDecisions.get(agent.id) || []
      agentDecisions.push(decision)
      this.recentDecisions.set(agent.id, agentDecisions.slice(-100)) // Keep last 100

      // Check risk limits
      if (!await this.checkRiskLimits(agent, decision)) {
        decision.executionResult = {
          status: 'failed',
          error: 'Risk limits exceeded'
        }
        return
      }

      if (agent.settings.enablePaperTrading) {
        // Paper trading execution
        await this.executePaperTrade(agent, decision)
      } else {
        // Real trading execution
        await this.executeRealTrade(agent, decision)
      }

      decision.executed = true

      // Send signal to N8N workflows
      const signal: TradingSignal = {
        symbol: decision.symbol,
        action: decision.action,
        quantity: decision.parameters.quantity,
        price: decision.parameters.entryPrice,
        confidence: decision.confidence,
        source: `agent_${agent.id}`,
        timestamp: decision.timestamp.toISOString(),
        metadata: {
          agentType: agent.type,
          reasoning: decision.reasoning
        }
      }
      
      await n8nClient.sendTradingSignal(signal)

    } catch (error) {
      console.error(`Error executing decision for agent ${agent.id}:`, error)
      decision.executionResult = {
        status: 'failed',
        error: error.message
      }
    }
  }

  private async executePaperTrade(agent: AgentConfig, decision: AgentDecision): Promise<void> {
    // Simulate trade execution with mock data
    const executionDelay = Math.random() * 1000 + 500 // 0.5-1.5s delay
    await this.sleep(executionDelay)

    const slippage = (Math.random() - 0.5) * 0.002 // ±0.1% slippage
    const executedPrice = decision.parameters.entryPrice * (1 + slippage)

    decision.executionResult = {
      orderId: `paper_${Date.now()}`,
      executedPrice,
      executedQuantity: decision.parameters.quantity,
      status: 'success'
    }

    // Create position
    if (decision.action === 'buy' || decision.action === 'sell') {
      const position: AgentPosition = {
        id: `pos_${Date.now()}`,
        symbol: decision.symbol,
        side: decision.action === 'buy' ? 'long' : 'short',
        quantity: decision.parameters.quantity,
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        unrealizedPnL: 0,
        realizedPnL: 0,
        entryTime: new Date(),
        stopLoss: decision.parameters.stopLoss,
        takeProfit: decision.parameters.takeProfit,
        exchange: 'paper'
      }

      let positions = this.agentPositions.get(agent.id) || []
      positions.push(position)
      this.agentPositions.set(agent.id, positions)
    }
  }

  private async executeRealTrade(agent: AgentConfig, decision: AgentDecision): Promise<void> {
    // Find best execution venue
    const order: TradeOrder = {
      symbol: decision.symbol,
      side: decision.action === 'buy' ? 'buy' : 'sell',
      type: 'market',
      quantity: decision.parameters.quantity
    }

    const bestExecution = await exchangeManager.findBestExecution(order)
    if (!bestExecution) {
      throw new Error('No suitable exchange found for execution')
    }

    const orderResult = await exchangeManager.executeOrder(bestExecution.exchange, order)
    if (!orderResult) {
      throw new Error('Order execution failed')
    }

    decision.executionResult = {
      orderId: orderResult.id,
      executedPrice: orderResult.price,
      executedQuantity: orderResult.filledQuantity,
      status: orderResult.status === 'filled' ? 'success' : 'partial'
    }
  }

  // Utility Methods
  private calculateMomentum(prices: number[]): number {
    if (prices.length < 2) return 0
    const recent = prices.slice(-5)
    const older = prices.slice(-10, -5)
    
    const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length
    const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length
    
    return (recentAvg - olderAvg) / olderAvg
  }

  private calculateMean(prices: number[]): number {
    return prices.reduce((sum, p) => sum + p, 0) / prices.length
  }

  private calculateStandardDeviation(prices: number[]): number {
    const mean = this.calculateMean(prices)
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / squaredDiffs.length
    return Math.sqrt(avgSquaredDiff)
  }

  private calculateVolatility(marketData: { [symbol: string]: MarketData }): number {
    // Simplified volatility calculation
    return Object.values(marketData).reduce((sum, data) => {
      const change = Math.abs(data.change24h) / 100
      return sum + change
    }, 0) / Object.keys(marketData).length
  }

  private analyzeTrend(marketData: { [symbol: string]: MarketData }): 'bull' | 'bear' | 'sideways' {
    const changes = Object.values(marketData).map(data => data.change24h)
    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length
    
    if (avgChange > 2) return 'bull'
    if (avgChange < -2) return 'bear'
    return 'sideways'
  }

  private calculateSentiment(marketData: { [symbol: string]: MarketData }): number {
    // Simplified sentiment based on price changes
    const changes = Object.values(marketData).map(data => data.change24h)
    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length
    return Math.max(-1, Math.min(1, avgChange / 10))
  }

  private async checkRiskLimits(agent: AgentConfig, decision: AgentDecision): Promise<boolean> {
    const positions = this.agentPositions.get(agent.id) || []
    const performance = this.agentPerformance.get(agent.id)
    
    // Check max position size
    if (decision.parameters.quantity > agent.maxPositionSize) {
      return false
    }
    
    // Check daily trade limit
    const today = new Date().toDateString()
    const todayDecisions = this.recentDecisions.get(agent.id)?.filter(
      d => d.timestamp.toDateString() === today
    ) || []
    
    if (todayDecisions.length >= agent.maxDailyTrades) {
      return false
    }
    
    // Check drawdown limit
    if (performance && performance.maxDrawdown > agent.settings.maxDrawdown) {
      return false
    }
    
    return true
  }

  private calculateStopLoss(price: number, action: 'buy' | 'sell', stopLossPercent: number): number {
    if (action === 'buy') {
      return price * (1 - stopLossPercent / 100)
    } else {
      return price * (1 + stopLossPercent / 100)
    }
  }

  private calculateTakeProfit(price: number, action: 'buy' | 'sell', takeProfitPercent: number): number {
    if (action === 'buy') {
      return price * (1 + takeProfitPercent / 100)
    } else {
      return price * (1 - takeProfitPercent / 100)
    }
  }

  private calculatePositionSize(agent: AgentConfig, price: number): number {
    // Simple position sizing based on risk tolerance
    const baseSize = agent.maxPositionSize
    
    switch (agent.riskTolerance) {
      case 'low': return baseSize * 0.5
      case 'medium': return baseSize * 0.75
      case 'high': return baseSize
      default: return baseSize * 0.5
    }
  }

  private getLastDecision(agentId: string, symbol: string): AgentDecision | null {
    const decisions = this.recentDecisions.get(agentId) || []
    return decisions
      .filter(d => d.symbol === symbol)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null
  }

  private isInCooldown(lastDecision: AgentDecision, cooldownMinutes: number): boolean {
    const now = new Date().getTime()
    const lastTime = lastDecision.timestamp.getTime()
    return (now - lastTime) < (cooldownMinutes * 60 * 1000)
  }

  private async closeAllPositions(agentId: string): Promise<void> {
    // Implementation would close all open positions for the agent
    this.agentPositions.set(agentId, [])
  }

  private async updateAgentPositions(agentId: string): Promise<void> {
    // Update position values with current market prices
    // This would be implemented with real market data
  }

  private async updateAgentPerformance(agentId: string): Promise<void> {
    const decisions = this.recentDecisions.get(agentId) || []
    const executedDecisions = decisions.filter(d => d.executed)
    
    const performance: AgentPerformance = {
      totalTrades: executedDecisions.length,
      successfulTrades: executedDecisions.filter(d => d.executionResult?.status === 'success').length,
      failedTrades: executedDecisions.filter(d => d.executionResult?.status === 'failed').length,
      totalPnL: 0, // Would calculate from positions
      winRate: 0,
      averageReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      averageHoldTime: 0,
      lastUpdated: new Date()
    }
    
    if (performance.totalTrades > 0) {
      performance.winRate = (performance.successfulTrades / performance.totalTrades) * 100
    }
    
    this.agentPerformance.set(agentId, performance)
    await enhancedRedisService.cacheAgentPerformance(agentId, performance)
  }

  private async performAdaptiveLearning(agentId: string): Promise<void> {
    // Implement adaptive learning algorithms
    // This would analyze recent performance and adjust parameters
  }

  private createInitialMemory(agentId: string): AgentMemory {
    return {
      agentId,
      marketConditions: [],
      priceHistory: {},
      tradeHistory: [],
      learnedPatterns: [],
      riskMetrics: {
        currentDrawdown: 0,
        portfolioValue: 10000,
        exposureBySymbol: {},
        exposureByExchange: {},
        dailyVaR: 0,
        correlation: {}
      },
      adaptations: []
    }
  }

  private createInitialPerformance(): AgentPerformance {
    return {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalPnL: 0,
      winRate: 0,
      averageReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      averageHoldTime: 0,
      lastUpdated: new Date()
    }
  }

  private initializeDefaultAgents(): void {
    // Create default demo agents
    const defaultAgents = [
      {
        name: 'Marcus Momentum',
        type: 'momentum' as const,
        isActive: false,
        riskTolerance: 'medium' as const,
        maxPositionSize: 1000,
        maxDailyTrades: 10,
        allowedSymbols: ['BTC/USD', 'ETH/USD'],
        exchangePreferences: ['hyperliquid'],
        strategies: [],
        settings: {
          stopLoss: 2,
          takeProfit: 4,
          maxDrawdown: 10,
          cooldownPeriod: 5,
          confidenceThreshold: 0.7,
          enablePaperTrading: true,
          notificationLevel: 'all' as const
        }
      },
      {
        name: 'Alex Arbitrage',
        type: 'arbitrage' as const,
        isActive: false,
        riskTolerance: 'low' as const,
        maxPositionSize: 500,
        maxDailyTrades: 20,
        allowedSymbols: ['BTC/USD', 'ETH/USD'],
        exchangePreferences: ['hyperliquid', 'ib_paper'],
        strategies: [],
        settings: {
          stopLoss: 1,
          takeProfit: 2,
          maxDrawdown: 5,
          cooldownPeriod: 1,
          confidenceThreshold: 0.8,
          enablePaperTrading: true,
          notificationLevel: 'errors_only' as const
        }
      }
    ]

    defaultAgents.forEach(agent => this.createAgent(agent))
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public API
  getAgents(): AgentConfig[] {
    return Array.from(this.agents.values())
  }

  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId)
  }

  getAgentPerformance(agentId: string): AgentPerformance | undefined {
    return this.agentPerformance.get(agentId)
  }

  getAgentPositions(agentId: string): AgentPosition[] {
    return this.agentPositions.get(agentId) || []
  }

  getAgentDecisions(agentId: string, limit: number = 50): AgentDecision[] {
    return (this.recentDecisions.get(agentId) || [])
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  get running(): boolean {
    return this.isRunning
  }
}

// Export singleton instance
export const enhancedAgentTrading = new EnhancedAgentTrading()
export default enhancedAgentTrading