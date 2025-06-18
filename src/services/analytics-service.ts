/**
 * Comprehensive Analytics Service
 * Phase 4: Advanced analytics combining farm brain data with knowledge graph insights
 */

import { backendApi } from '@/lib/api/backend-client'

export interface AnalyticsTimeRange {
  start: string
  end: string
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercent: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  totalTrades: number
  volatility: number
}

export interface StrategyAnalysis {
  strategyId: string
  name: string
  type: string
  performance: PerformanceMetrics
  trades: TradeAnalysis[]
  riskMetrics: RiskMetrics
  optimization: StrategyOptimization
}

export interface TradeAnalysis {
  tradeId: string
  symbol: string
  entryTime: string
  exitTime: string
  pnl: number
  pnlPercent: number
  holdingPeriod: number
  drawdown: number
  volume: number
  tags: string[]
}

export interface RiskMetrics {
  var95: number
  var99: number
  expectedShortfall: number
  beta: number
  alpha: number
  correlations: Record<string, number>
  concentrationRisk: number
}

export interface AgentAnalysis {
  agentId: string
  name: string
  specialization: string
  performance: PerformanceMetrics
  decisionQuality: DecisionQuality
  learningMetrics: LearningMetrics
  coordination: AgentCoordination
}

export interface DecisionQuality {
  averageConfidence: number
  confidenceAccuracy: number
  decisionSpeed: number
  overrideRate: number
  consensusParticipation: number
}

export interface LearningMetrics {
  adaptationRate: number
  memoryRetention: number
  patternRecognition: number
  improvementTrend: number
  knowledgeGrowth: number
}

export interface AgentCoordination {
  collaborationFrequency: number
  influenceScore: number
  consensusAlignment: number
  conflictResolution: number
}

export interface MarketAnalysis {
  symbol: string
  timeRange: AnalyticsTimeRange
  priceAction: PriceActionAnalysis
  volumeAnalysis: VolumeAnalysis
  volatilityMetrics: VolatilityMetrics
  technicalIndicators: TechnicalAnalysis
  sentimentAnalysis: SentimentAnalysis
}

export interface PriceActionAnalysis {
  trend: 'bullish' | 'bearish' | 'sideways'
  trendStrength: number
  support: number[]
  resistance: number[]
  keyLevels: number[]
  patterns: PatternDetection[]
}

export interface VolumeAnalysis {
  averageVolume: number
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  volumePrice: number
  onBalanceVolume: number
  volumeProfile: VolumeProfile[]
}

export interface VolumeProfile {
  price: number
  volume: number
  percentage: number
}

export interface VolatilityMetrics {
  historicalVolatility: number
  impliedVolatility?: number
  garch: number
  parkinson: number
  garmanKlass: number
  rogersActiveMeasure: number
}

export interface TechnicalAnalysis {
  rsi: number
  macd: MACDIndicator
  bollingerBands: BollingerBands
  stochastic: StochasticIndicator
  adx: number
  cci: number
}

export interface MACDIndicator {
  macd: number
  signal: number
  histogram: number
  trend: 'bullish' | 'bearish' | 'neutral'
}

export interface BollingerBands {
  upper: number
  middle: number
  lower: number
  bandwidth: number
  position: number
}

export interface StochasticIndicator {
  k: number
  d: number
  trend: 'bullish' | 'bearish' | 'neutral'
}

export interface SentimentAnalysis {
  overall: 'bullish' | 'bearish' | 'neutral'
  score: number
  fearGreedIndex: number
  socialSentiment: number
  newsSentiment: number
  optionsFlow?: 'bullish' | 'bearish' | 'neutral'
}

export interface PatternDetection {
  pattern: string
  confidence: number
  timeframe: string
  target: number
  stopLoss: number
}

export interface PortfolioAnalysis {
  timeRange: AnalyticsTimeRange
  performance: PerformanceMetrics
  allocation: AssetAllocation[]
  risk: PortfolioRisk
  optimization: PortfolioOptimization
  attribution: PerformanceAttribution
}

export interface AssetAllocation {
  symbol: string
  weight: number
  value: number
  performance: number
  contribution: number
}

export interface PortfolioRisk {
  totalRisk: number
  systematicRisk: number
  specificRisk: number
  correlationMatrix: Record<string, Record<string, number>>
  riskContribution: Record<string, number>
}

export interface PortfolioOptimization {
  currentSharpe: number
  optimizedSharpe: number
  suggestions: OptimizationSuggestion[]
  efficientFrontier: EfficiientFrontierPoint[]
}

export interface OptimizationSuggestion {
  type: 'rebalance' | 'add' | 'remove' | 'reduce' | 'increase'
  symbol: string
  currentWeight: number
  suggestedWeight: number
  rationale: string
  expectedImprovement: number
}

export interface EfficiientFrontierPoint {
  risk: number
  return: number
  sharpe: number
}

export interface PerformanceAttribution {
  assetSelection: number
  timing: number
  interaction: number
  total: number
  breakdown: Record<string, number>
}

export interface StrategyOptimization {
  currentParameters: Record<string, any>
  optimizedParameters: Record<string, any>
  backtestResults: BacktestResults
  optimizationMethod: string
  confidence: number
}

export interface BacktestResults {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  profitFactor: number
}

class AnalyticsService {
  /**
   * Get comprehensive analytics for a time range
   */
  async getComprehensiveAnalytics(timeRange: AnalyticsTimeRange) {
    try {
      const [farmAnalytics, knowledgeGraphStats] = await Promise.all([
        backendApi.getFarmComprehensiveAnalytics(),
        backendApi.getKnowledgeGraphStats()
      ])

      return {
        farm: farmAnalytics.data,
        knowledge: knowledgeGraphStats.data,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get comprehensive analytics:', error)
      return null
    }
  }

  /**
   * Analyze strategy performance with advanced metrics
   */
  async analyzeStrategy(strategyId: string, timeRange: AnalyticsTimeRange): Promise<StrategyAnalysis | null> {
    try {
      const [patterns, timeline] = await Promise.all([
        backendApi.getStrategyPatterns(),
        backendApi.getEntityTimeline(`strategy_${strategyId}`, this.getDaysFromRange(timeRange))
      ])

      const strategyPattern = patterns.data?.patterns?.find((p: any) => p.strategy_id.includes(strategyId))
      
      if (!strategyPattern) {
        return null
      }

      return {
        strategyId,
        name: strategyPattern.strategy_name,
        type: strategyPattern.strategy_type,
        performance: this.calculatePerformanceMetrics(strategyPattern),
        trades: timeline.data?.timeline?.filter((event: any) => event.entity_type === 'trade') || [],
        riskMetrics: await this.calculateRiskMetrics(strategyId),
        optimization: await this.optimizeStrategy(strategyId)
      }
    } catch (error) {
      console.error('Failed to analyze strategy:', error)
      return null
    }
  }

  /**
   * Analyze agent performance and learning
   */
  async analyzeAgent(agentId: string, timeRange: AnalyticsTimeRange): Promise<AgentAnalysis | null> {
    try {
      const [specializations, timeline, correlations] = await Promise.all([
        backendApi.getAgentSpecializations(),
        backendApi.getEntityTimeline(`agent_${agentId}`, this.getDaysFromRange(timeRange)),
        backendApi.getDecisionCorrelations()
      ])

      const agentSpec = specializations.data?.specializations?.[agentId]
      
      if (!agentSpec) {
        return null
      }

      return {
        agentId,
        name: agentId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        specialization: agentSpec.preferred_symbol,
        performance: this.calculateAgentPerformance(agentSpec),
        decisionQuality: this.analyzeDecisionQuality(agentId, correlations.data?.correlations || []),
        learningMetrics: await this.calculateLearningMetrics(agentId),
        coordination: await this.analyzeAgentCoordination(agentId)
      }
    } catch (error) {
      console.error('Failed to analyze agent:', error)
      return null
    }
  }

  /**
   * Perform market analysis for a symbol
   */
  async analyzeMarket(symbol: string, timeRange: AnalyticsTimeRange): Promise<MarketAnalysis | null> {
    try {
      // Get market data from backend
      const marketData = await backendApi.getMarketData(symbol)
      
      if (!marketData.data) {
        return null
      }

      return {
        symbol,
        timeRange,
        priceAction: this.analyzePriceAction(marketData.data),
        volumeAnalysis: this.analyzeVolume(marketData.data),
        volatilityMetrics: this.calculateVolatilityMetrics(marketData.data),
        technicalIndicators: this.calculateTechnicalIndicators(marketData.data),
        sentimentAnalysis: this.analyzeSentiment(symbol)
      }
    } catch (error) {
      console.error('Failed to analyze market:', error)
      return null
    }
  }

  /**
   * Analyze portfolio performance and risk
   */
  async analyzePortfolio(timeRange: AnalyticsTimeRange): Promise<PortfolioAnalysis | null> {
    try {
      const [portfolio, positions, performance] = await Promise.all([
        backendApi.getPortfolioSummary(),
        backendApi.getPortfolioPositions(),
        backendApi.getPerformanceMetrics()
      ])

      return {
        timeRange,
        performance: this.convertToPerformanceMetrics(performance.data),
        allocation: this.calculateAssetAllocation(positions.data || []),
        risk: await this.calculatePortfolioRisk(positions.data || []),
        optimization: await this.optimizePortfolio(positions.data || []),
        attribution: await this.attributePerformance(positions.data || [])
      }
    } catch (error) {
      console.error('Failed to analyze portfolio:', error)
      return null
    }
  }

  /**
   * Search for patterns using knowledge graph
   */
  async searchPatterns(query: string, entityType?: string) {
    try {
      const results = await backendApi.searchKnowledgeGraph(query, entityType, 50)
      return results.data?.results || []
    } catch (error) {
      console.error('Failed to search patterns:', error)
      return []
    }
  }

  /**
   * Get optimization suggestions for strategies
   */
  async getOptimizationSuggestions(strategyId: string) {
    try {
      const patterns = await backendApi.getStrategyPatterns()
      const bestPatterns = patterns.data?.patterns?.slice(0, 5) || []
      
      return bestPatterns.map((pattern: any) => ({
        type: 'parameter_adjustment',
        suggestion: `Consider adopting parameters from ${pattern.strategy_name}`,
        confidence: pattern.win_rate,
        expectedImprovement: pattern.avg_pnl
      }))
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error)
      return []
    }
  }

  // Helper methods
  private getDaysFromRange(timeRange: AnalyticsTimeRange): number {
    const start = new Date(timeRange.start)
    const end = new Date(timeRange.end)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculatePerformanceMetrics(data: any): PerformanceMetrics {
    return {
      totalReturn: data.total_pnl || 0,
      totalReturnPercent: data.win_rate || 0,
      sharpeRatio: this.calculateSharpeRatio(data),
      maxDrawdown: 0.1, // Mock for now
      winRate: data.win_rate || 0,
      profitFactor: Math.abs(data.avg_pnl || 0) / 100,
      averageWin: data.avg_pnl || 0,
      averageLoss: data.avg_pnl || 0,
      totalTrades: data.total_trades || 0,
      volatility: 0.2 // Mock for now
    }
  }

  private calculateSharpeRatio(data: any): number {
    // Simple Sharpe ratio calculation
    const returns = data.avg_pnl || 0
    const riskFreeRate = 0.02 // 2% risk-free rate
    const volatility = 0.2 // Mock volatility
    
    return (returns - riskFreeRate) / volatility
  }

  private async calculateRiskMetrics(strategyId: string): Promise<RiskMetrics> {
    // Mock implementation - would integrate with risk service
    return {
      var95: 0.05,
      var99: 0.01,
      expectedShortfall: 0.08,
      beta: 1.2,
      alpha: 0.03,
      correlations: {},
      concentrationRisk: 0.3
    }
  }

  private async optimizeStrategy(strategyId: string): Promise<StrategyOptimization> {
    // Mock implementation - would integrate with optimization service
    return {
      currentParameters: {},
      optimizedParameters: {},
      backtestResults: {
        totalReturn: 0.15,
        annualizedReturn: 0.12,
        volatility: 0.18,
        sharpeRatio: 0.67,
        maxDrawdown: 0.08,
        winRate: 0.62,
        totalTrades: 150,
        profitFactor: 1.4
      },
      optimizationMethod: 'genetic_algorithm',
      confidence: 0.85
    }
  }

  private calculateAgentPerformance(spec: any): PerformanceMetrics {
    return {
      totalReturn: spec.total_pnl || 0,
      totalReturnPercent: (spec.total_pnl || 0) / 10000, // Assuming starting capital
      sharpeRatio: 0.8, // Mock
      maxDrawdown: 0.12,
      winRate: 0.65,
      profitFactor: 1.3,
      averageWin: 150,
      averageLoss: -80,
      totalTrades: spec.trade_count || 0,
      volatility: 0.22
    }
  }

  private analyzeDecisionQuality(agentId: string, correlations: any[]): DecisionQuality {
    // Analyze correlations to determine decision quality
    const agentCorrelations = correlations.filter(c => 
      c.confidence_level > 0 && c.total_trades > 0
    )

    const avgConfidence = agentCorrelations.reduce((acc, c) => acc + c.confidence_level, 0) / agentCorrelations.length || 0
    const avgWinRate = agentCorrelations.reduce((acc, c) => acc + c.win_rate, 0) / agentCorrelations.length || 0

    return {
      averageConfidence: avgConfidence,
      confidenceAccuracy: avgWinRate,
      decisionSpeed: 0.8, // Mock
      overrideRate: 0.1,
      consensusParticipation: 0.75
    }
  }

  private async calculateLearningMetrics(agentId: string): Promise<LearningMetrics> {
    // Mock implementation - would analyze agent memory and adaptation
    return {
      adaptationRate: 0.7,
      memoryRetention: 0.9,
      patternRecognition: 0.8,
      improvementTrend: 0.15,
      knowledgeGrowth: 0.12
    }
  }

  private async analyzeAgentCoordination(agentId: string): Promise<AgentCoordination> {
    // Mock implementation - would analyze agent interactions
    return {
      collaborationFrequency: 0.6,
      influenceScore: 0.4,
      consensusAlignment: 0.8,
      conflictResolution: 0.7
    }
  }

  private analyzePriceAction(data: any): PriceActionAnalysis {
    // Mock implementation - would analyze price patterns
    return {
      trend: 'bullish',
      trendStrength: 0.7,
      support: [45000, 42000],
      resistance: [52000, 55000],
      keyLevels: [50000],
      patterns: []
    }
  }

  private analyzeVolume(data: any): VolumeAnalysis {
    return {
      averageVolume: data.volume || 1000000,
      volumeTrend: 'increasing',
      volumePrice: 1.2,
      onBalanceVolume: 500000,
      volumeProfile: []
    }
  }

  private calculateVolatilityMetrics(data: any): VolatilityMetrics {
    return {
      historicalVolatility: 0.25,
      garch: 0.23,
      parkinson: 0.22,
      garmanKlass: 0.24,
      rogersActiveMeasure: 0.26
    }
  }

  private calculateTechnicalIndicators(data: any): TechnicalAnalysis {
    return {
      rsi: 65,
      macd: {
        macd: 0.02,
        signal: 0.015,
        histogram: 0.005,
        trend: 'bullish'
      },
      bollingerBands: {
        upper: 52000,
        middle: 50000,
        lower: 48000,
        bandwidth: 0.08,
        position: 0.6
      },
      stochastic: {
        k: 70,
        d: 68,
        trend: 'bullish'
      },
      adx: 45,
      cci: 120
    }
  }

  private analyzeSentiment(symbol: string): SentimentAnalysis {
    return {
      overall: 'bullish',
      score: 0.7,
      fearGreedIndex: 65,
      socialSentiment: 0.6,
      newsSentiment: 0.8
    }
  }

  private convertToPerformanceMetrics(data: any): PerformanceMetrics {
    return {
      totalReturn: data?.total_pnl || 0,
      totalReturnPercent: data?.total_return_percent || 0,
      sharpeRatio: data?.sharpe_ratio || 0,
      maxDrawdown: data?.max_drawdown || 0,
      winRate: data?.win_rate || 0,
      profitFactor: 1.0,
      averageWin: data?.best_trade || 0,
      averageLoss: data?.worst_trade || 0,
      totalTrades: data?.total_trades || 0,
      volatility: data?.volatility || 0
    }
  }

  private calculateAssetAllocation(positions: any[]): AssetAllocation[] {
    const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0)
    
    return positions.map(pos => ({
      symbol: pos.symbol,
      weight: pos.market_value / totalValue,
      value: pos.market_value,
      performance: pos.pnl_percent,
      contribution: (pos.market_value / totalValue) * pos.pnl_percent
    }))
  }

  private async calculatePortfolioRisk(positions: any[]): Promise<PortfolioRisk> {
    // Mock implementation - would calculate actual portfolio risk
    return {
      totalRisk: 0.18,
      systematicRisk: 0.12,
      specificRisk: 0.06,
      correlationMatrix: {},
      riskContribution: {}
    }
  }

  private async optimizePortfolio(positions: any[]): Promise<PortfolioOptimization> {
    // Mock implementation - would run portfolio optimization
    return {
      currentSharpe: 0.8,
      optimizedSharpe: 1.2,
      suggestions: [],
      efficientFrontier: []
    }
  }

  private async attributePerformance(positions: any[]): Promise<PerformanceAttribution> {
    // Mock implementation - would attribute performance
    return {
      assetSelection: 0.03,
      timing: 0.02,
      interaction: 0.01,
      total: 0.06,
      breakdown: {}
    }
  }
}

export const analyticsService = new AnalyticsService()