import { supabase } from '@/lib/supabase/client'
import { StrategyType } from '@/lib/supabase/strategy-service'

export interface StrategyPerformanceMetrics {
  strategyType: StrategyType
  totalExecutions: number
  successRate: number
  avgReturn: number
  avgReturnPercent: number
  totalReturn: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  avgWinAmount: number
  avgLossAmount: number
  profitFactor: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  avgHoldTime: number
  volatility: number
  lastUpdated: Date
}

export interface StrategyOptimizationSuggestion {
  strategyType: StrategyType
  parameter: string
  currentValue: number
  suggestedValue: number
  expectedImprovement: number
  confidence: number
  reason: string
  backtestedResults?: {
    originalPerformance: number
    optimizedPerformance: number
    improvementPercent: number
  }
}

export interface StrategyComparisonResult {
  period: string
  strategies: {
    strategyType: StrategyType
    performance: StrategyPerformanceMetrics
    ranking: number
    relativePerformance: number
  }[]
  marketBenchmark: {
    symbol: string
    return: number
    volatility: number
  }
}

export class StrategyPerformanceAnalytics {
  private static readonly MINIMUM_EXECUTIONS_FOR_ANALYSIS = 10
  private static readonly OPTIMIZATION_CONFIDENCE_THRESHOLD = 0.7
  
  /**
   * Calculate comprehensive performance metrics for a strategy
   */
  async calculateStrategyPerformance(
    strategyType: StrategyType,
    agentId?: string,
    timeframe?: string
  ): Promise<StrategyPerformanceMetrics> {
    try {
      // Build query with optional filters
      let query = supabase
        .from('strategy_executions')
        .select('*')
        .eq('strategy_type', strategyType)
        .eq('status', 'completed')
        .order('executed_at', { ascending: false })

      if (agentId) {
        query = query.eq('agent_id', agentId)
      }

      if (timeframe) {
        const since = this.getTimeframeSince(timeframe)
        query = query.gte('executed_at', since.toISOString())
      }

      const { data: executions, error } = await query

      if (error) throw error
      if (!executions || executions.length === 0) {
        return this.getEmptyMetrics(strategyType)
      }

      // Calculate basic metrics
      const totalExecutions = executions.length
      const completedExecutions = executions.filter(e => e.result && e.result.return_amount !== null)
      
      if (completedExecutions.length === 0) {
        return this.getEmptyMetrics(strategyType)
      }

      const returns = completedExecutions.map(e => e.result.return_amount || 0)
      const returnPercents = completedExecutions.map(e => e.result.return_percent || 0)
      
      const totalReturn = returns.reduce((sum, ret) => sum + ret, 0)
      const avgReturn = totalReturn / completedExecutions.length
      const avgReturnPercent = returnPercents.reduce((sum, ret) => sum + ret, 0) / completedExecutions.length
      
      // Win/Loss analysis
      const wins = returns.filter(r => r > 0)
      const losses = returns.filter(r => r < 0)
      const winRate = wins.length / completedExecutions.length
      const avgWinAmount = wins.length > 0 ? wins.reduce((sum, w) => sum + w, 0) / wins.length : 0
      const avgLossAmount = losses.length > 0 ? Math.abs(losses.reduce((sum, l) => sum + l, 0) / losses.length) : 0
      
      // Advanced metrics
      const profitFactor = avgLossAmount > 0 ? (avgWinAmount * wins.length) / (avgLossAmount * losses.length) : 0
      const volatility = this.calculateVolatility(returnPercents)
      const sharpeRatio = volatility > 0 ? (avgReturnPercent / volatility) : 0
      const maxDrawdown = this.calculateMaxDrawdown(returns)
      
      // Consecutive wins/losses
      const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutiveStreaks(returns)
      
      // Average holding time
      const avgHoldTime = this.calculateAvgHoldTime(completedExecutions)
      
      return {
        strategyType,
        totalExecutions,
        successRate: winRate,
        avgReturn,
        avgReturnPercent,
        totalReturn,
        maxDrawdown,
        sharpeRatio,
        winRate,
        avgWinAmount,
        avgLossAmount,
        profitFactor,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        avgHoldTime,
        volatility,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error calculating strategy performance:', error)
      return this.getEmptyMetrics(strategyType)
    }
  }

  /**
   * Generate optimization suggestions for a strategy
   */
  async generateOptimizationSuggestions(
    strategyType: StrategyType,
    agentId?: string
  ): Promise<StrategyOptimizationSuggestion[]> {
    try {
      // Get recent optimization results from database
      let query = supabase
        .from('strategy_optimizations')
        .select('*')
        .eq('strategy_type', strategyType)
        .order('created_at', { ascending: false })
        .limit(10)

      if (agentId) {
        query = query.eq('agent_id', agentId)
      }

      const { data: optimizations, error } = await query
      if (error) throw error

      // Get current performance metrics
      const currentMetrics = await this.calculateStrategyPerformance(strategyType, agentId)
      
      if (currentMetrics.totalExecutions < this.MINIMUM_EXECUTIONS_FOR_ANALYSIS) {
        return []
      }

      // Generate strategy-specific optimization suggestions
      const suggestions = await this.generateStrategySpecificSuggestions(
        strategyType,
        currentMetrics,
        optimizations || []
      )

      return suggestions.filter(s => s.confidence >= this.OPTIMIZATION_CONFIDENCE_THRESHOLD)
    } catch (error) {
      console.error('Error generating optimization suggestions:', error)
      return []
    }
  }

  /**
   * Compare performance across multiple strategies
   */
  async compareStrategies(
    strategies: StrategyType[],
    period: string = '30d',
    agentId?: string
  ): Promise<StrategyComparisonResult> {
    try {
      const strategyPerformances = await Promise.all(
        strategies.map(async (strategyType) => {
          const performance = await this.calculateStrategyPerformance(
            strategyType,
            agentId,
            period
          )
          return { strategyType, performance }
        })
      )

      // Sort by total return and assign rankings
      const sortedStrategies = strategyPerformances
        .sort((a, b) => b.performance.totalReturn - a.performance.totalReturn)
        .map((item, index) => ({
          ...item,
          ranking: index + 1,
          relativePerformance: this.calculateRelativePerformance(
            item.performance.totalReturn,
            strategyPerformances
          )
        }))

      // Get market benchmark (using BTC as default)
      const marketBenchmark = await this.getMarketBenchmark('BTC', period)

      return {
        period,
        strategies: sortedStrategies,
        marketBenchmark
      }
    } catch (error) {
      console.error('Error comparing strategies:', error)
      return {
        period,
        strategies: [],
        marketBenchmark: { symbol: 'BTC', return: 0, volatility: 0 }
      }
    }
  }

  /**
   * Track strategy learning and adaptation
   */
  async trackStrategyLearning(
    strategyType: StrategyType,
    agentId: string,
    learningData: {
      marketCondition: string
      adaptationMade: string
      performanceImpact: number
      confidence: number
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('strategy_learning')
        .insert([{
          strategy_type: strategyType,
          agent_id: agentId,
          market_condition: learningData.marketCondition,
          adaptation_made: learningData.adaptationMade,
          performance_impact: learningData.performanceImpact,
          confidence_score: learningData.confidence,
          created_at: new Date().toISOString()
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error tracking strategy learning:', error)
    }
  }

  /**
   * Get strategy performance trends over time
   */
  async getPerformanceTrends(
    strategyType: StrategyType,
    agentId?: string,
    periods: string[] = ['7d', '30d', '90d']
  ): Promise<{ period: string; metrics: StrategyPerformanceMetrics }[]> {
    try {
      const trends = await Promise.all(
        periods.map(async (period) => {
          const metrics = await this.calculateStrategyPerformance(
            strategyType,
            agentId,
            period
          )
          return { period, metrics }
        })
      )

      return trends
    } catch (error) {
      console.error('Error getting performance trends:', error)
      return []
    }
  }

  // Private helper methods
  private getEmptyMetrics(strategyType: StrategyType): StrategyPerformanceMetrics {
    return {
      strategyType,
      totalExecutions: 0,
      successRate: 0,
      avgReturn: 0,
      avgReturnPercent: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      avgWinAmount: 0,
      avgLossAmount: 0,
      profitFactor: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgHoldTime: 0,
      volatility: 0,
      lastUpdated: new Date()
    }
  }

  private getTimeframeSince(timeframe: string): Date {
    const now = new Date()
    const matches = timeframe.match(/(\d+)([dhwmy])/)
    if (!matches) return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
    
    const [, amount, unit] = matches
    const num = parseInt(amount)
    
    switch (unit) {
      case 'd': return new Date(now.getTime() - num * 24 * 60 * 60 * 1000)
      case 'h': return new Date(now.getTime() - num * 60 * 60 * 1000)
      case 'w': return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000)
      case 'm': return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000)
      case 'y': return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000)
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
  }

  private calculateMaxDrawdown(returns: number[]): number {
    if (returns.length === 0) return 0
    
    let maxDrawdown = 0
    let peak = 0
    let runningSum = 0
    
    for (const ret of returns) {
      runningSum += ret
      if (runningSum > peak) {
        peak = runningSum
      }
      const drawdown = peak - runningSum
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
    
    return maxDrawdown
  }

  private calculateConsecutiveStreaks(returns: number[]): { maxConsecutiveWins: number; maxConsecutiveLosses: number } {
    let maxConsecutiveWins = 0
    let maxConsecutiveLosses = 0
    let currentWinStreak = 0
    let currentLossStreak = 0
    
    for (const ret of returns) {
      if (ret > 0) {
        currentWinStreak++
        currentLossStreak = 0
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak)
      } else if (ret < 0) {
        currentLossStreak++
        currentWinStreak = 0
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak)
      } else {
        currentWinStreak = 0
        currentLossStreak = 0
      }
    }
    
    return { maxConsecutiveWins, maxConsecutiveLosses }
  }

  private calculateAvgHoldTime(executions: any[]): number {
    const holdTimes = executions
      .filter(e => e.result && e.result.hold_time_hours)
      .map(e => e.result.hold_time_hours)
    
    return holdTimes.length > 0 ? holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length : 0
  }

  private async generateStrategySpecificSuggestions(
    strategyType: StrategyType,
    currentMetrics: StrategyPerformanceMetrics,
    optimizations: any[]
  ): Promise<StrategyOptimizationSuggestion[]> {
    const suggestions: StrategyOptimizationSuggestion[] = []

    // Strategy-specific optimization logic
    switch (strategyType) {
      case 'darvas_box':
        if (currentMetrics.winRate < 0.6) {
          suggestions.push({
            strategyType,
            parameter: 'boxPeriod',
            currentValue: 20,
            suggestedValue: 25,
            expectedImprovement: 0.15,
            confidence: 0.8,
            reason: 'Longer box formation period may improve signal quality'
          })
        }
        break
      
      case 'williams_alligator':
        if (currentMetrics.maxDrawdown > 0.15) {
          suggestions.push({
            strategyType,
            parameter: 'stopLossPercent',
            currentValue: 5,
            suggestedValue: 3,
            expectedImprovement: 0.20,
            confidence: 0.75,
            reason: 'Tighter stop loss may reduce maximum drawdown'
          })
        }
        break
      
      case 'elliott_wave':
        if (currentMetrics.sharpeRatio < 1.0) {
          suggestions.push({
            strategyType,
            parameter: 'waveConfidence',
            currentValue: 0.7,
            suggestedValue: 0.8,
            expectedImprovement: 0.25,
            confidence: 0.85,
            reason: 'Higher wave confidence threshold may improve risk-adjusted returns'
          })
        }
        break
      
      case 'heikin_ashi':
        if (currentMetrics.profitFactor < 1.5) {
          suggestions.push({
            strategyType,
            parameter: 'trendStrength',
            currentValue: 0.6,
            suggestedValue: 0.75,
            expectedImprovement: 0.18,
            confidence: 0.72,
            reason: 'Stronger trend confirmation may improve profit factor'
          })
        }
        break
      
      case 'renko':
        if (currentMetrics.volatility > 0.3) {
          suggestions.push({
            strategyType,
            parameter: 'brickSize',
            currentValue: 2,
            suggestedValue: 3,
            expectedImprovement: 0.12,
            confidence: 0.78,
            reason: 'Larger brick size may reduce volatility and noise'
          })
        }
        break
    }

    return suggestions
  }

  private calculateRelativePerformance(
    strategyReturn: number,
    allStrategies: { performance: StrategyPerformanceMetrics }[]
  ): number {
    const avgReturn = allStrategies.reduce((sum, s) => sum + s.performance.totalReturn, 0) / allStrategies.length
    return avgReturn > 0 ? (strategyReturn - avgReturn) / avgReturn : 0
  }

  private async getMarketBenchmark(symbol: string, period: string): Promise<{ symbol: string; return: number; volatility: number }> {
    // This would typically fetch from your market data service
    // For now, returning mock data
    return {
      symbol,
      return: 0.05, // 5% return
      volatility: 0.25 // 25% volatility
    }
  }
}

// Export singleton instance
export const strategyPerformanceAnalytics = new StrategyPerformanceAnalytics()