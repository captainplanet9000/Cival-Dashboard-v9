/**
 * Autonomous Trading Orchestrator
 * Coordinates all autonomous trading activities using the paper trading engine
 * Manages multiple AI agents, strategies, and real-time decision making
 */

import { EventEmitter } from 'events'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'
import { agentPersistenceService } from '@/lib/agents/AgentPersistenceService'
import { testnetDeFiService } from '@/lib/defi/TestnetDeFiService'

export interface AutonomousAgent {
  id: string
  name: string
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'risk_manager' | 'coordinator'
  status: 'active' | 'paused' | 'stopped' | 'error'
  strategy: TradingStrategy
  portfolio: string // Portfolio ID in paper trading engine
  performance: AgentPerformance
  lastDecision: AgentDecision | null
  riskLimits: RiskLimits
  config: AgentConfig
}

export interface TradingStrategy {
  id: string
  name: string
  description: string
  type: 'technical' | 'fundamental' | 'sentiment' | 'arbitrage' | 'ml'
  parameters: Record<string, any>
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  symbols: string[]
  enabled: boolean
  performance: StrategyPerformance
}

export interface AgentDecision {
  id: string
  agentId: string
  timestamp: number
  action: 'buy' | 'sell' | 'hold' | 'close' | 'reduce'
  symbol: string
  confidence: number
  reasoning: string
  expectedReturn: number
  riskAssessment: number
  size: number
  stopLoss?: number
  takeProfit?: number
  executed: boolean
  result?: 'success' | 'failed' | 'partial'
}

export interface AgentPerformance {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalReturn: number
  totalReturnPercent: number
  maxDrawdown: number
  sharpeRatio: number
  dailyReturns: number[]
  monthlyReturns: number[]
  lastUpdate: number
}

export interface StrategyPerformance {
  totalSignals: number
  successfulSignals: number
  failedSignals: number
  accuracy: number
  avgReturn: number
  maxDrawdown: number
  sharpeRatio: number
  calmarRatio: number
  enabled: boolean
  lastUpdate: number
}

export interface RiskLimits {
  maxPositionSize: number // Max position size as % of portfolio
  maxDailyLoss: number // Max daily loss in USD
  maxDrawdown: number // Max drawdown as %
  maxLeverage: number // Max leverage multiplier
  maxCorrelation: number // Max correlation between positions
  stopLossPercent: number // Default stop loss %
  takeProfitPercent: number // Default take profit %
}

export interface AgentConfig {
  tradingPairs: string[]
  initialCapital: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  timeHorizon: 'scalping' | 'intraday' | 'swing' | 'position'
  enableStopLoss: boolean
  enableTakeProfit: boolean
  enableTrailingStop: boolean
  rebalanceFrequency: number // in minutes
  decisionCooldown: number // min time between decisions in seconds
}

export interface MarketConditions {
  volatility: 'low' | 'medium' | 'high' | 'extreme'
  trend: 'bullish' | 'bearish' | 'sideways'
  volume: 'low' | 'normal' | 'high'
  sentiment: 'fear' | 'neutral' | 'greed'
  regime: 'trending' | 'ranging' | 'volatile'
}

class AutonomousTradingOrchestrator extends EventEmitter {
  private agents: Map<string, AutonomousAgent> = new Map()
  private strategies: Map<string, TradingStrategy> = new Map()
  private marketConditions: MarketConditions = {
    volatility: 'medium',
    trend: 'sideways',
    volume: 'normal',
    sentiment: 'neutral',
    regime: 'ranging'
  }
  
  private isRunning = false
  private decisionInterval: NodeJS.Timeout | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private riskCheckInterval: NodeJS.Timeout | null = null
  
  // Configuration
  private readonly DECISION_INTERVAL = 30000 // 30 seconds
  private readonly MONITORING_INTERVAL = 5000 // 5 seconds
  private readonly RISK_CHECK_INTERVAL = 10000 // 10 seconds
  private readonly MAX_CONCURRENT_ORDERS = 10
  private readonly GLOBAL_RISK_LIMIT = 0.02 // 2% max portfolio risk per trade

  constructor() {
    super()
    this.initializeDefaultAgents()
    this.initializeDefaultStrategies()
    this.loadPersistedData()
  }

  // ================================
  // LIFECYCLE MANAGEMENT
  // ================================

  async start(): Promise<void> {
    if (this.isRunning) return

    console.log('🚀 Starting Autonomous Trading Orchestrator')
    this.isRunning = true

    // Start all intervals
    this.startDecisionLoop()
    this.startMonitoringLoop()
    this.startRiskManagement()

    // Initialize all active agents
    for (const agent of this.agents.values()) {
      if (agent.status === 'active') {
        await this.initializeAgentPortfolio(agent)
      }
    }

    this.emit('orchestrator:started')
    console.log('✅ Autonomous Trading Orchestrator started successfully')
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log('🛑 Stopping Autonomous Trading Orchestrator')
    this.isRunning = false

    // Clear all intervals
    if (this.decisionInterval) clearInterval(this.decisionInterval)
    if (this.monitoringInterval) clearInterval(this.monitoringInterval)
    if (this.riskCheckInterval) clearInterval(this.riskCheckInterval)

    // Close all open positions
    await this.emergencyCloseAllPositions()

    this.emit('orchestrator:stopped')
    console.log('✅ Autonomous Trading Orchestrator stopped')
  }

  async pause(): Promise<void> {
    console.log('⏸️ Pausing all autonomous agents')
    for (const agent of this.agents.values()) {
      if (agent.status === 'active') {
        agent.status = 'paused'
      }
    }
    this.emit('orchestrator:paused')
  }

  async resume(): Promise<void> {
    console.log('▶️ Resuming all autonomous agents')
    for (const agent of this.agents.values()) {
      if (agent.status === 'paused') {
        agent.status = 'active'
      }
    }
    this.emit('orchestrator:resumed')
  }

  // ================================
  // CORE AUTONOMOUS LOOPS
  // ================================

  private startDecisionLoop(): void {
    this.decisionInterval = setInterval(async () => {
      if (!this.isRunning) return

      try {
        await this.runDecisionCycle()
      } catch (error) {
        console.error('Error in decision cycle:', error)
        this.emit('error', { type: 'decision_cycle', error })
      }
    }, this.DECISION_INTERVAL)
  }

  private startMonitoringLoop(): void {
    this.monitoringInterval = setInterval(async () => {
      if (!this.isRunning) return

      try {
        await this.updateMarketConditions()
        await this.updateAgentPerformance()
        await this.executeStopLossAndTakeProfit()
      } catch (error) {
        console.error('Error in monitoring loop:', error)
        this.emit('error', { type: 'monitoring', error })
      }
    }, this.MONITORING_INTERVAL)
  }

  private startRiskManagement(): void {
    this.riskCheckInterval = setInterval(async () => {
      if (!this.isRunning) return

      try {
        await this.performRiskChecks()
        await this.rebalancePortfolios()
      } catch (error) {
        console.error('Error in risk management:', error)
        this.emit('error', { type: 'risk_management', error })
      }
    }, this.RISK_CHECK_INTERVAL)
  }

  // ================================
  // DECISION MAKING ENGINE
  // ================================

  private async runDecisionCycle(): Promise<void> {
    const activeAgents = Array.from(this.agents.values()).filter(
      agent => agent.status === 'active'
    )

    console.log(`🧠 Running decision cycle for ${activeAgents.length} active agents`)

    // Process each agent's decision
    const decisions = await Promise.allSettled(
      activeAgents.map(agent => this.makeAgentDecision(agent))
    )

    // Execute approved decisions
    let executedCount = 0
    for (let i = 0; i < decisions.length; i++) {
      const result = decisions[i]
      if (result.status === 'fulfilled' && result.value) {
        const executed = await this.executeDecision(result.value)
        if (executed) executedCount++
      }
    }

    console.log(`✅ Decision cycle complete: ${executedCount} decisions executed`)
    this.emit('decision:cycle_complete', { 
      totalAgents: activeAgents.length, 
      decisionsExecuted: executedCount 
    })
  }

  private async makeAgentDecision(agent: AutonomousAgent): Promise<AgentDecision | null> {
    // Check decision cooldown
    if (agent.lastDecision && 
        Date.now() - agent.lastDecision.timestamp < agent.config.decisionCooldown * 1000) {
      return null
    }

    // Get current portfolio state
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
    if (!portfolio) return null

    // Analyze market conditions for agent's symbols
    const marketAnalysis = await this.analyzeMarketForAgent(agent)
    
    // Generate decision based on strategy
    const decision = await this.generateDecisionFromStrategy(agent, marketAnalysis)
    
    if (decision) {
      // Risk assessment
      const riskCheck = await this.assessDecisionRisk(agent, decision)
      if (!riskCheck.approved) {
        console.log(`🚫 Decision rejected for ${agent.name}: ${riskCheck.reason}`)
        return null
      }

      agent.lastDecision = decision
      this.emit('decision:generated', { agent: agent.id, decision })
    }

    return decision
  }

  private async analyzeMarketForAgent(agent: AutonomousAgent): Promise<any> {
    const analysis: any = {
      symbols: {},
      conditions: this.marketConditions,
      timestamp: Date.now()
    }

    // Analyze each symbol the agent trades
    for (const symbol of agent.config.tradingPairs) {
      const marketData = persistentTradingEngine.getMarketPrice(symbol)
      if (marketData) {
        // Calculate technical indicators
        const indicators = await this.calculateTechnicalIndicators(symbol)
        
        analysis.symbols[symbol] = {
          price: marketData.price,
          change24h: marketData.changePercent24h,
          volume: marketData.volume,
          indicators,
          signal: this.generateSignal(agent.strategy, indicators)
        }
      }
    }

    return analysis
  }

  private async generateDecisionFromStrategy(
    agent: AutonomousAgent, 
    marketAnalysis: any
  ): Promise<AgentDecision | null> {
    const strategy = agent.strategy
    
    // Find the best signal from analyzed symbols
    let bestSignal: any = null
    let bestSymbol = ''
    
    for (const [symbol, data] of Object.entries(marketAnalysis.symbols)) {
      const signal = (data as any).signal
      if (signal && (!bestSignal || signal.confidence > bestSignal.confidence)) {
        bestSignal = signal
        bestSymbol = symbol
      }
    }

    if (!bestSignal || bestSignal.confidence < 0.6) return null

    // Calculate position size based on strategy and risk limits
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)!
    const positionSize = this.calculatePositionSize(agent, bestSymbol, bestSignal.confidence)

    const decision: AgentDecision = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      timestamp: Date.now(),
      action: bestSignal.action,
      symbol: bestSymbol,
      confidence: bestSignal.confidence,
      reasoning: `${strategy.name} strategy: ${bestSignal.reasoning}`,
      expectedReturn: bestSignal.expectedReturn || 0.02,
      riskAssessment: this.calculateRiskScore(agent, bestSymbol, positionSize),
      size: positionSize,
      stopLoss: bestSignal.stopLoss,
      takeProfit: bestSignal.takeProfit,
      executed: false
    }

    return decision
  }

  // ================================
  // SIGNAL GENERATION
  // ================================

  private generateSignal(strategy: TradingStrategy, indicators: any): any {
    switch (strategy.type) {
      case 'technical':
        return this.generateTechnicalSignal(strategy, indicators)
      case 'momentum':
        return this.generateMomentumSignal(strategy, indicators)
      case 'mean_reversion':
        return this.generateMeanReversionSignal(strategy, indicators)
      default:
        return null
    }
  }

  private generateTechnicalSignal(strategy: TradingStrategy, indicators: any): any {
    const { rsi, macd, ema20, ema50, bollinger } = indicators
    
    let signal = 0
    let confidence = 0
    let reasoning = ''

    // RSI signals
    if (rsi < 30) {
      signal += 1; confidence += 0.3; reasoning += 'RSI oversold, '
    } else if (rsi > 70) {
      signal -= 1; confidence += 0.3; reasoning += 'RSI overbought, '
    }

    // MACD signals
    if (macd.histogram > 0 && macd.signal > 0) {
      signal += 1; confidence += 0.4; reasoning += 'MACD bullish, '
    } else if (macd.histogram < 0 && macd.signal < 0) {
      signal -= 1; confidence += 0.4; reasoning += 'MACD bearish, '
    }

    // EMA crossover
    if (ema20 > ema50) {
      signal += 0.5; confidence += 0.2; reasoning += 'EMA bullish, '
    } else {
      signal -= 0.5; confidence += 0.2; reasoning += 'EMA bearish, '
    }

    // Bollinger Bands
    if (indicators.price < bollinger.lower) {
      signal += 0.5; confidence += 0.3; reasoning += 'Below BB lower, '
    } else if (indicators.price > bollinger.upper) {
      signal -= 0.5; confidence += 0.3; reasoning += 'Above BB upper, '
    }

    const action = signal > 0.5 ? 'buy' : signal < -0.5 ? 'sell' : 'hold'
    
    return action !== 'hold' ? {
      action,
      confidence: Math.min(confidence, 1.0),
      reasoning: reasoning.slice(0, -2),
      expectedReturn: Math.abs(signal) * 0.02,
      stopLoss: action === 'buy' ? indicators.price * 0.98 : indicators.price * 1.02,
      takeProfit: action === 'buy' ? indicators.price * 1.04 : indicators.price * 0.96
    } : null
  }

  private generateMomentumSignal(strategy: TradingStrategy, indicators: any): any {
    const { momentum, roc, stoch } = indicators
    
    let signal = 0
    let confidence = 0
    let reasoning = ''

    // Momentum indicators
    if (momentum > 0 && roc > 0.02) {
      signal += 1; confidence += 0.5; reasoning += 'Strong upward momentum, '
    } else if (momentum < 0 && roc < -0.02) {
      signal -= 1; confidence += 0.5; reasoning += 'Strong downward momentum, '
    }

    // Stochastic
    if (stoch.k > stoch.d && stoch.k > 20) {
      signal += 0.5; confidence += 0.3; reasoning += 'Stoch bullish, '
    } else if (stoch.k < stoch.d && stoch.k < 80) {
      signal -= 0.5; confidence += 0.3; reasoning += 'Stoch bearish, '
    }

    const action = signal > 0.7 ? 'buy' : signal < -0.7 ? 'sell' : 'hold'
    
    return action !== 'hold' ? {
      action,
      confidence: Math.min(confidence, 1.0),
      reasoning: reasoning.slice(0, -2),
      expectedReturn: Math.abs(signal) * 0.025,
      stopLoss: action === 'buy' ? indicators.price * 0.97 : indicators.price * 1.03,
      takeProfit: action === 'buy' ? indicators.price * 1.05 : indicators.price * 0.95
    } : null
  }

  private generateMeanReversionSignal(strategy: TradingStrategy, indicators: any): any {
    const { rsi, bollinger, zscore } = indicators
    
    let signal = 0
    let confidence = 0
    let reasoning = ''

    // Mean reversion signals (opposite of momentum)
    if (rsi < 25 && indicators.price < bollinger.lower) {
      signal += 1; confidence += 0.6; reasoning += 'Extreme oversold, '
    } else if (rsi > 75 && indicators.price > bollinger.upper) {
      signal -= 1; confidence += 0.6; reasoning += 'Extreme overbought, '
    }

    // Z-score mean reversion
    if (zscore < -2) {
      signal += 0.8; confidence += 0.4; reasoning += 'Price far below mean, '
    } else if (zscore > 2) {
      signal -= 0.8; confidence += 0.4; reasoning += 'Price far above mean, '
    }

    const action = signal > 0.8 ? 'buy' : signal < -0.8 ? 'sell' : 'hold'
    
    return action !== 'hold' ? {
      action,
      confidence: Math.min(confidence, 1.0),
      reasoning: reasoning.slice(0, -2),
      expectedReturn: Math.abs(signal) * 0.015,
      stopLoss: action === 'buy' ? indicators.price * 0.985 : indicators.price * 1.015,
      takeProfit: action === 'buy' ? indicators.price * 1.03 : indicators.price * 0.97
    } : null
  }

  // ================================
  // TECHNICAL INDICATORS
  // ================================

  private async calculateTechnicalIndicators(symbol: string): Promise<any> {
    // Mock implementation - in real system, this would calculate actual indicators
    // from historical price data
    const marketData = persistentTradingEngine.getMarketPrice(symbol)
    if (!marketData) return {}

    const price = marketData.price
    const change24h = marketData.changePercent24h

    return {
      price,
      rsi: 50 + (change24h * 2), // Mock RSI
      macd: {
        signal: change24h > 0 ? 1 : -1,
        histogram: Math.abs(change24h) * 10
      },
      ema20: price * 0.99,
      ema50: price * 0.98,
      bollinger: {
        upper: price * 1.02,
        middle: price,
        lower: price * 0.98
      },
      momentum: change24h,
      roc: change24h,
      stoch: {
        k: 50 + (change24h * 2),
        d: 50 + (change24h * 1.5)
      },
      zscore: (price - (price * 0.995)) / (price * 0.01)
    }
  }

  // ================================
  // RISK MANAGEMENT
  // ================================

  private async assessDecisionRisk(
    agent: AutonomousAgent, 
    decision: AgentDecision
  ): Promise<{ approved: boolean; reason?: string }> {
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)!
    
    // Check position size limits
    const positionValue = decision.size * persistentTradingEngine.getMarketPrice(decision.symbol)!.price
    const maxPositionValue = portfolio.totalValue * agent.riskLimits.maxPositionSize
    
    if (positionValue > maxPositionValue) {
      return { approved: false, reason: 'Position size exceeds risk limit' }
    }

    // Check daily loss limits
    const todayPnL = this.calculateTodayPnL(agent)
    if (todayPnL < -agent.riskLimits.maxDailyLoss) {
      return { approved: false, reason: 'Daily loss limit reached' }
    }

    // Check maximum drawdown
    const currentDrawdown = this.calculateCurrentDrawdown(agent)
    if (currentDrawdown > agent.riskLimits.maxDrawdown) {
      return { approved: false, reason: 'Maximum drawdown exceeded' }
    }

    // Check correlation with existing positions
    const correlation = await this.calculatePortfolioCorrelation(agent, decision.symbol)
    if (correlation > agent.riskLimits.maxCorrelation) {
      return { approved: false, reason: 'High correlation with existing positions' }
    }

    return { approved: true }
  }

  private async performRiskChecks(): Promise<void> {
    for (const agent of this.agents.values()) {
      if (agent.status !== 'active') continue

      const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
      if (!portfolio) continue

      // Check if any risk limits are breached
      const todayPnL = this.calculateTodayPnL(agent)
      const currentDrawdown = this.calculateCurrentDrawdown(agent)

      // Emergency stop if limits exceeded
      if (todayPnL < -agent.riskLimits.maxDailyLoss * 1.5) {
        await this.emergencyStopAgent(agent, 'Daily loss limit severely exceeded')
      }

      if (currentDrawdown > agent.riskLimits.maxDrawdown * 1.2) {
        await this.emergencyStopAgent(agent, 'Maximum drawdown severely exceeded')
      }
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private calculatePositionSize(agent: AutonomousAgent, symbol: string, confidence: number): number {
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)!
    const marketData = persistentTradingEngine.getMarketPrice(symbol)!
    
    // Base position size as percentage of portfolio
    const basePositionPercent = agent.riskLimits.maxPositionSize * confidence
    const positionValue = portfolio.totalValue * basePositionPercent
    
    return Math.max(positionValue / marketData.price, 0.001) // Minimum 0.001 units
  }

  private calculateRiskScore(agent: AutonomousAgent, symbol: string, size: number): number {
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)!
    const marketData = persistentTradingEngine.getMarketPrice(symbol)!
    
    const positionValue = size * marketData.price
    const portfolioRisk = positionValue / portfolio.totalValue
    
    // Risk score based on position size and volatility
    const volatilityMultiplier = this.marketConditions.volatility === 'high' ? 1.5 : 
                                this.marketConditions.volatility === 'extreme' ? 2.0 : 1.0
    
    return portfolioRisk * volatilityMultiplier
  }

  private calculateTodayPnL(agent: AutonomousAgent): number {
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
    if (!portfolio) return 0

    // Calculate today's PnL from execution history
    const today = new Date().setHours(0, 0, 0, 0)
    const todayExecutions = persistentTradingEngine.getExecutionHistory()
      .filter(exec => exec.agentId === agent.portfolio && exec.timestamp >= today)

    return todayExecutions.reduce((pnl, exec) => {
      // Simplified PnL calculation
      return pnl + (exec.side === 'buy' ? -exec.size * exec.price : exec.size * exec.price)
    }, 0)
  }

  private calculateCurrentDrawdown(agent: AutonomousAgent): number {
    const performance = agent.performance
    const currentValue = persistentTradingEngine.getPortfolio(agent.portfolio)?.totalValue || 0
    const peakValue = Math.max(...performance.dailyReturns.map((_, i) => 
      performance.dailyReturns.slice(0, i + 1).reduce((a, b) => a + b, agent.config.initialCapital)
    ))
    
    return Math.max(0, (peakValue - currentValue) / peakValue)
  }

  private async calculatePortfolioCorrelation(agent: AutonomousAgent, newSymbol: string): Promise<number> {
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)!
    const existingSymbols = Object.keys(portfolio.positions)
    
    if (existingSymbols.length === 0) return 0
    
    // Simplified correlation - in real system, calculate actual price correlations
    const sameAssetClass = existingSymbols.some(symbol => 
      this.getAssetClass(symbol) === this.getAssetClass(newSymbol)
    )
    
    return sameAssetClass ? 0.7 : 0.2 // High correlation if same asset class
  }

  private getAssetClass(symbol: string): string {
    if (symbol.includes('BTC') || symbol.includes('ETH')) return 'crypto'
    if (symbol.includes('USD') || symbol.includes('EUR')) return 'forex'
    return 'unknown'
  }

  // ================================
  // INITIALIZATION
  // ================================

  private initializeDefaultAgents(): void {
    const defaultAgents = [
      {
        id: 'momentum_trader_1',
        name: 'Momentum Hunter',
        type: 'momentum' as const,
        status: 'active' as const,
        strategy: {
          id: 'momentum_strategy_1',
          name: 'Momentum Trading',
          description: 'Follows price momentum and trends',
          type: 'momentum' as const,
          parameters: { lookback: 20, threshold: 0.02 },
          timeframe: '15m' as const,
          symbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
          enabled: true,
          performance: this.createDefaultStrategyPerformance()
        },
        portfolio: 'momentum_trader_1',
        performance: this.createDefaultAgentPerformance(),
        lastDecision: null,
        riskLimits: {
          maxPositionSize: 0.1, // 10% per position
          maxDailyLoss: 500,
          maxDrawdown: 0.15,
          maxLeverage: 2,
          maxCorrelation: 0.7,
          stopLossPercent: 0.02,
          takeProfitPercent: 0.04
        },
        config: {
          tradingPairs: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
          initialCapital: 10000,
          riskTolerance: 'moderate',
          timeHorizon: 'intraday',
          enableStopLoss: true,
          enableTakeProfit: true,
          enableTrailingStop: false,
          rebalanceFrequency: 60,
          decisionCooldown: 300
        }
      },
      {
        id: 'mean_reversion_1',
        name: 'Mean Reversion Bot',
        type: 'mean_reversion' as const,
        status: 'active' as const,
        strategy: {
          id: 'mean_reversion_strategy_1',
          name: 'Mean Reversion',
          description: 'Trades against extreme price movements',
          type: 'technical' as const,
          parameters: { rsi_oversold: 25, rsi_overbought: 75 },
          timeframe: '5m' as const,
          symbols: ['BTC/USD', 'ETH/USD'],
          enabled: true,
          performance: this.createDefaultStrategyPerformance()
        },
        portfolio: 'mean_reversion_1',
        performance: this.createDefaultAgentPerformance(),
        lastDecision: null,
        riskLimits: {
          maxPositionSize: 0.08,
          maxDailyLoss: 300,
          maxDrawdown: 0.12,
          maxLeverage: 1.5,
          maxCorrelation: 0.6,
          stopLossPercent: 0.015,
          takeProfitPercent: 0.03
        },
        config: {
          tradingPairs: ['BTC/USD', 'ETH/USD'],
          initialCapital: 8000,
          riskTolerance: 'conservative',
          timeHorizon: 'scalping',
          enableStopLoss: true,
          enableTakeProfit: true,
          enableTrailingStop: true,
          rebalanceFrequency: 30,
          decisionCooldown: 180
        }
      },
      {
        id: 'risk_manager_1',
        name: 'Risk Guardian',
        type: 'risk_manager' as const,
        status: 'active' as const,
        strategy: {
          id: 'risk_management_strategy_1',
          name: 'Portfolio Risk Management',
          description: 'Monitors and manages overall portfolio risk',
          type: 'fundamental' as const,
          parameters: { max_portfolio_risk: 0.02 },
          timeframe: '1h' as const,
          symbols: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD'],
          enabled: true,
          performance: this.createDefaultStrategyPerformance()
        },
        portfolio: 'risk_manager_1',
        performance: this.createDefaultAgentPerformance(),
        lastDecision: null,
        riskLimits: {
          maxPositionSize: 0.05,
          maxDailyLoss: 200,
          maxDrawdown: 0.08,
          maxLeverage: 1,
          maxCorrelation: 0.4,
          stopLossPercent: 0.01,
          takeProfitPercent: 0.02
        },
        config: {
          tradingPairs: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD'],
          initialCapital: 5000,
          riskTolerance: 'conservative',
          timeHorizon: 'position',
          enableStopLoss: true,
          enableTakeProfit: false,
          enableTrailingStop: false,
          rebalanceFrequency: 120,
          decisionCooldown: 600
        }
      }
    ]

    defaultAgents.forEach(agent => this.agents.set(agent.id, agent))
  }

  private initializeDefaultStrategies(): void {
    // Strategies are embedded in agents for now
    // Could be extracted to separate management later
  }

  private createDefaultAgentPerformance(): AgentPerformance {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      dailyReturns: [],
      monthlyReturns: [],
      lastUpdate: Date.now()
    }
  }

  private createDefaultStrategyPerformance(): StrategyPerformance {
    return {
      totalSignals: 0,
      successfulSignals: 0,
      failedSignals: 0,
      accuracy: 0,
      avgReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      calmarRatio: 0,
      enabled: true,
      lastUpdate: Date.now()
    }
  }

  private async initializeAgentPortfolio(agent: AutonomousAgent): Promise<void> {
    // Create portfolio in paper trading engine if it doesn't exist
    const existing = persistentTradingEngine.getPortfolio(agent.portfolio)
    if (!existing) {
      await persistentTradingEngine.createPortfolio(agent.portfolio, agent.config.initialCapital)
      console.log(`📊 Created portfolio for ${agent.name} with $${agent.config.initialCapital}`)
    }
  }

  // ================================
  // MORE AUTONOMOUS METHODS TO CONTINUE...
  // ================================
  
  private async executeDecision(decision: AgentDecision): Promise<boolean> {
    try {
      const marketData = persistentTradingEngine.getMarketPrice(decision.symbol)
      if (!marketData) return false

      // Execute the order
      const order = await persistentTradingEngine.placeOrder(
        decision.agentId,
        decision.symbol,
        decision.action === 'buy' ? 'buy' : 'sell',
        'market',
        decision.size
      )

      if (order) {
        decision.executed = true
        decision.result = 'success'
        
        this.emit('decision:executed', { decision, order })
        console.log(`✅ Executed ${decision.action} ${decision.size} ${decision.symbol} for ${decision.agentId}`)
        return true
      }
      
      return false
    } catch (error) {
      decision.executed = false
      decision.result = 'failed'
      console.error(`❌ Failed to execute decision for ${decision.agentId}:`, error)
      return false
    }
  }

  private async updateMarketConditions(): Promise<void> {
    // Analyze overall market conditions
    const allMarketData = persistentTradingEngine.getAllMarketData()
    const symbols = Array.from(allMarketData.keys())
    
    if (symbols.length === 0) return

    // Calculate average volatility
    const avgVolatility = symbols.reduce((sum, symbol) => {
      const data = allMarketData.get(symbol)!
      return sum + Math.abs(data.changePercent24h)
    }, 0) / symbols.length

    // Determine volatility level
    if (avgVolatility > 0.1) this.marketConditions.volatility = 'extreme'
    else if (avgVolatility > 0.05) this.marketConditions.volatility = 'high'
    else if (avgVolatility > 0.02) this.marketConditions.volatility = 'medium'
    else this.marketConditions.volatility = 'low'

    // Determine trend
    const positiveMoves = symbols.filter(symbol => 
      allMarketData.get(symbol)!.changePercent24h > 0
    ).length
    
    if (positiveMoves / symbols.length > 0.7) this.marketConditions.trend = 'bullish'
    else if (positiveMoves / symbols.length < 0.3) this.marketConditions.trend = 'bearish'
    else this.marketConditions.trend = 'sideways'

    this.emit('market:conditions_updated', this.marketConditions)
  }

  private async updateAgentPerformance(): Promise<void> {
    for (const agent of this.agents.values()) {
      const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
      if (!portfolio) continue

      // Update performance metrics
      const performance = agent.performance
      const currentValue = portfolio.totalValue
      const initialValue = agent.config.initialCapital

      performance.totalReturn = currentValue - initialValue
      performance.totalReturnPercent = (currentValue / initialValue - 1) * 100
      performance.lastUpdate = Date.now()

      // Calculate win rate from recent trades
      const recentExecutions = persistentTradingEngine.getExecutionHistory()
        .filter(exec => exec.agentId === agent.portfolio)
        .slice(-100) // Last 100 trades

      if (recentExecutions.length > 0) {
        // Simplified win rate calculation
        performance.totalTrades = recentExecutions.length
        performance.winningTrades = Math.floor(recentExecutions.length * 0.6) // Mock 60% win rate
        performance.losingTrades = performance.totalTrades - performance.winningTrades
        performance.winRate = performance.winningTrades / performance.totalTrades * 100
      }

      this.emit('agent:performance_updated', { agentId: agent.id, performance })
    }
  }

  private async executeStopLossAndTakeProfit(): Promise<void> {
    for (const agent of this.agents.values()) {
      if (agent.status !== 'active') continue

      const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
      if (!portfolio) continue

      // Check each position for stop loss / take profit
      for (const [symbol, position] of Object.entries(portfolio.positions)) {
        if (position.status !== 'open') continue

        const marketData = persistentTradingEngine.getMarketPrice(symbol)
        if (!marketData) continue

        const currentPrice = marketData.price
        let shouldClose = false
        let reason = ''

        // Check stop loss
        if (position.stopLoss) {
          if ((position.side === 'long' && currentPrice <= position.stopLoss) ||
              (position.side === 'short' && currentPrice >= position.stopLoss)) {
            shouldClose = true
            reason = 'Stop loss triggered'
          }
        }

        // Check take profit
        if (position.takeProfit && !shouldClose) {
          if ((position.side === 'long' && currentPrice >= position.takeProfit) ||
              (position.side === 'short' && currentPrice <= position.takeProfit)) {
            shouldClose = true
            reason = 'Take profit triggered'
          }
        }

        if (shouldClose) {
          await this.closePosition(agent, position, reason)
        }
      }
    }
  }

  private async closePosition(agent: AutonomousAgent, position: PersistentPosition, reason: string): Promise<void> {
    try {
      const order = await persistentTradingEngine.placeOrder(
        agent.portfolio,
        position.symbol,
        position.side === 'long' ? 'sell' : 'buy',
        'market',
        position.size
      )

      if (order) {
        console.log(`🔄 Closed position ${position.symbol} for ${agent.name}: ${reason}`)
        this.emit('position:closed', { agent: agent.id, position, reason, order })
      }
    } catch (error) {
      console.error(`❌ Failed to close position for ${agent.name}:`, error)
    }
  }

  private async rebalancePortfolios(): Promise<void> {
    for (const agent of this.agents.values()) {
      if (agent.status !== 'active') continue

      const shouldRebalance = this.shouldRebalanceAgent(agent)
      if (shouldRebalance) {
        await this.rebalanceAgentPortfolio(agent)
      }
    }
  }

  private shouldRebalanceAgent(agent: AutonomousAgent): boolean {
    const lastRebalance = agent.performance.lastUpdate
    const rebalanceInterval = agent.config.rebalanceFrequency * 60 * 1000 // minutes to ms
    
    return Date.now() - lastRebalance > rebalanceInterval
  }

  private async rebalanceAgentPortfolio(agent: AutonomousAgent): Promise<void> {
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
    if (!portfolio) return

    console.log(`⚖️ Rebalancing portfolio for ${agent.name}`)
    
    // Simple rebalancing: close positions that are too large
    for (const [symbol, position] of Object.entries(portfolio.positions)) {
      if (position.status !== 'open') continue

      const positionValue = position.size * position.currentPrice
      const positionPercent = positionValue / portfolio.totalValue

      if (positionPercent > agent.riskLimits.maxPositionSize * 1.2) {
        // Position is too large, reduce it
        const targetSize = portfolio.totalValue * agent.riskLimits.maxPositionSize / position.currentPrice
        const reduceSize = position.size - targetSize

        if (reduceSize > 0) {
          await persistentTradingEngine.placeOrder(
            agent.portfolio,
            symbol,
            position.side === 'long' ? 'sell' : 'buy',
            'market',
            reduceSize
          )

          console.log(`📉 Reduced ${symbol} position by ${reduceSize} for ${agent.name}`)
        }
      }
    }

    this.emit('agent:rebalanced', { agentId: agent.id })
  }

  private async emergencyStopAgent(agent: AutonomousAgent, reason: string): Promise<void> {
    console.log(`🚨 EMERGENCY STOP for ${agent.name}: ${reason}`)
    
    agent.status = 'stopped'
    
    // Close all positions
    const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
    if (portfolio) {
      for (const position of Object.values(portfolio.positions)) {
        if (position.status === 'open') {
          await this.closePosition(agent, position, 'Emergency stop')
        }
      }
    }

    this.emit('agent:emergency_stop', { agentId: agent.id, reason })
  }

  private async emergencyCloseAllPositions(): Promise<void> {
    console.log('🚨 EMERGENCY: Closing all positions across all agents')
    
    for (const agent of this.agents.values()) {
      const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
      if (!portfolio) continue

      for (const position of Object.values(portfolio.positions)) {
        if (position.status === 'open') {
          await this.closePosition(agent, position, 'System shutdown')
        }
      }
    }
  }

  private loadPersistedData(): void {
    // Load from localStorage with proper browser checks
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      const stored = localStorage.getItem('autonomous_trading_orchestrator')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.agents) {
          // Restore agent states (but not the full objects to avoid stale strategies)
          for (const [agentId, storedAgent] of Object.entries(data.agents as any)) {
            const agent = this.agents.get(agentId)
            if (agent) {
              agent.status = storedAgent.status
              agent.performance = storedAgent.performance
              agent.lastDecision = storedAgent.lastDecision
            }
          }
        }

        console.log('✅ Loaded autonomous trading orchestrator data')
      }
    } catch (error) {
      console.error('Failed to load orchestrator data:', error)
    }
  }

  private persistData(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }

    try {
      const data = {
        agents: Object.fromEntries(
          Array.from(this.agents.entries()).map(([id, agent]) => [
            id,
            {
              status: agent.status,
              performance: agent.performance,
              lastDecision: agent.lastDecision
            }
          ])
        ),
        marketConditions: this.marketConditions,
        lastUpdate: Date.now()
      }

      localStorage.setItem('autonomous_trading_orchestrator', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist orchestrator data:', error)
    }
  }

  // ================================
  // PUBLIC API METHODS
  // ================================

  getAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values())
  }

  getAgent(agentId: string): AutonomousAgent | undefined {
    return this.agents.get(agentId)
  }

  getStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values())
  }

  getMarketConditions(): MarketConditions {
    return { ...this.marketConditions }
  }

  isRunning(): boolean {
    return this.isRunning
  }

  async addAgent(config: Partial<AutonomousAgent>): Promise<string> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const agent: AutonomousAgent = {
      id: agentId,
      name: config.name || `Agent ${agentId}`,
      type: config.type || 'momentum',
      status: 'paused',
      strategy: config.strategy || this.strategies.values().next().value,
      portfolio: agentId,
      performance: this.createDefaultAgentPerformance(),
      lastDecision: null,
      riskLimits: config.riskLimits || {
        maxPositionSize: 0.05,
        maxDailyLoss: 100,
        maxDrawdown: 0.1,
        maxLeverage: 1,
        maxCorrelation: 0.5,
        stopLossPercent: 0.02,
        takeProfitPercent: 0.04
      },
      config: config.config || {
        tradingPairs: ['BTC/USD'],
        initialCapital: 1000,
        riskTolerance: 'conservative',
        timeHorizon: 'intraday',
        enableStopLoss: true,
        enableTakeProfit: true,
        enableTrailingStop: false,
        rebalanceFrequency: 60,
        decisionCooldown: 300
      }
    }

    this.agents.set(agentId, agent)
    await this.initializeAgentPortfolio(agent)
    
    this.emit('agent:added', { agentId })
    return agentId
  }

  async removeAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    // Stop the agent first
    await this.emergencyStopAgent(agent, 'Agent removed')
    
    // Remove from orchestrator
    this.agents.delete(agentId)
    
    this.emit('agent:removed', { agentId })
    return true
  }

  async setAgentStatus(agentId: string, status: AutonomousAgent['status']): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    agent.status = status
    this.emit('agent:status_changed', { agentId, status })
    return true
  }
}

// Create singleton instance with lazy initialization
let _autonomousTradingOrchestrator: AutonomousTradingOrchestrator | null = null

export function getAutonomousTradingOrchestrator(): AutonomousTradingOrchestrator {
  if (!_autonomousTradingOrchestrator) {
    _autonomousTradingOrchestrator = new AutonomousTradingOrchestrator()
  }
  return _autonomousTradingOrchestrator
}

// For backwards compatibility - lazy export to prevent initialization issues
export function getAutonomousTradingOrchestratorInstance() {
  return getAutonomousTradingOrchestrator()
}

// Default export as function to prevent immediate initialization
export default getAutonomousTradingOrchestrator