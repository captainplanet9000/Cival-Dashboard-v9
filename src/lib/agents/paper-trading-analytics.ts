// Advanced Analytics for Agent Paper Trading
import type {
  AgentPaperTradingAccount,
  AgentPaperPosition,
  AgentPaperTradingDecision,
  AgentPaperTradingPerformance
} from '@/types/agent-paper-trading';

export interface TradingAnalytics {
  performance: PerformanceAnalytics;
  risk: RiskAnalytics;
  behavior: BehaviorAnalytics;
  strategy: StrategyAnalytics;
  market: MarketAnalytics;
  recommendations: AnalyticsRecommendations;
}

export interface PerformanceAnalytics {
  returns: {
    total: number;
    annualized: number;
    monthly: number[];
    daily: number[];
    benchmark_comparison: number;
  };
  risk_adjusted: {
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
    information_ratio: number;
  };
  drawdown: {
    max_drawdown: number;
    current_drawdown: number;
    drawdown_duration: number;
    underwater_periods: Array<{ start: Date; end: Date; depth: number }>;
  };
  consistency: {
    win_rate: number;
    profit_factor: number;
    expectancy: number;
    consistency_score: number;
  };
}

export interface RiskAnalytics {
  portfolio_risk: {
    var_95: number;
    var_99: number;
    expected_shortfall: number;
    beta: number;
    tracking_error: number;
  };
  position_risk: {
    concentration: number;
    largest_position: number;
    sector_exposure: Record<string, number>;
    correlation_risk: number;
  };
  behavioral_risk: {
    overtrading_score: number;
    revenge_trading_incidents: number;
    discipline_score: number;
    emotional_trading_score: number;
  };
}

export interface BehaviorAnalytics {
  decision_patterns: {
    avg_holding_period: number;
    trade_frequency: number;
    size_consistency: number;
    timing_patterns: Record<string, number>; // hour of day, day of week
  };
  psychological_metrics: {
    confidence_calibration: number;
    overconfidence_bias: number;
    loss_aversion_coefficient: number;
    disposition_effect: number;
  };
  learning_progression: {
    skill_development_trend: number;
    mistake_reduction_rate: number;
    adaptation_speed: number;
    knowledge_retention: number;
  };
}

export interface StrategyAnalytics {
  strategy_performance: Array<{
    strategy_id: string;
    name: string;
    returns: number;
    win_rate: number;
    trades: number;
    avg_return: number;
    consistency: number;
  }>;
  signal_quality: {
    prediction_accuracy: number;
    signal_strength_correlation: number;
    false_positive_rate: number;
    signal_timing_efficiency: number;
  };
  execution_quality: {
    slippage: number;
    fill_rate: number;
    execution_delay: number;
    order_efficiency: number;
  };
}

export interface MarketAnalytics {
  market_correlation: {
    correlation_to_market: number;
    sector_correlations: Record<string, number>;
    style_exposure: Record<string, number>;
  };
  regime_performance: {
    bull_market: number;
    bear_market: number;
    sideways_market: number;
    high_volatility: number;
    low_volatility: number;
  };
  timing_analysis: {
    market_timing_skill: number;
    sector_rotation_skill: number;
    volatility_timing: number;
  };
}

export interface AnalyticsRecommendations {
  performance_improvements: string[];
  risk_adjustments: string[];
  strategy_optimizations: string[];
  behavioral_modifications: string[];
  next_learning_objectives: string[];
}

export class PaperTradingAnalyticsEngine {
  private readonly agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  async generateComprehensiveAnalytics(
    account: AgentPaperTradingAccount,
    positions: AgentPaperPosition[],
    decisions: AgentPaperTradingDecision[],
    orders: any[],
    marketData: any[]
  ): Promise<TradingAnalytics> {
    const [
      performance,
      risk,
      behavior,
      strategy,
      market
    ] = await Promise.all([
      this.analyzePerformance(account, positions, orders),
      this.analyzeRisk(account, positions, decisions),
      this.analyzeBehavior(decisions, orders),
      this.analyzeStrategy(decisions, orders),
      this.analyzeMarketInteraction(positions, marketData)
    ]);

    const recommendations = this.generateRecommendations(
      performance, risk, behavior, strategy, market
    );

    return {
      performance,
      risk,
      behavior,
      strategy,
      market,
      recommendations
    };
  }

  // Performance Analytics
  private async analyzePerformance(
    account: AgentPaperTradingAccount,
    positions: AgentPaperPosition[],
    orders: any[]
  ): Promise<PerformanceAnalytics> {
    const totalReturn = (account.total_equity - account.initial_balance) / account.initial_balance;
    const trades = orders.filter(order => order.status === 'filled');
    
    // Calculate monthly and daily returns
    const dailyReturns = this.calculateDailyReturns(orders);
    const monthlyReturns = this.calculateMonthlyReturns(dailyReturns);

    // Risk-adjusted metrics
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
    const sortinoRatio = this.calculateSortinoRatio(dailyReturns);

    // Drawdown analysis
    const drawdownAnalysis = this.calculateDrawdownMetrics(orders);

    // Consistency metrics
    const winRate = this.calculateWinRate(trades);
    const profitFactor = this.calculateProfitFactor(trades);

    return {
      returns: {
        total: totalReturn,
        annualized: this.annualizeReturn(totalReturn, this.getTradingDays(orders)),
        monthly: monthlyReturns,
        daily: dailyReturns,
        benchmark_comparison: totalReturn - 0.05 // Assume 5% benchmark
      },
      risk_adjusted: {
        sharpe_ratio: sharpeRatio,
        sortino_ratio: sortinoRatio,
        calmar_ratio: totalReturn / Math.abs(drawdownAnalysis.max_drawdown),
        information_ratio: sharpeRatio * 0.8 // Simplified calculation
      },
      drawdown: drawdownAnalysis,
      consistency: {
        win_rate: winRate,
        profit_factor: profitFactor,
        expectancy: this.calculateExpectancy(trades),
        consistency_score: this.calculateConsistencyScore(monthlyReturns)
      }
    };
  }

  // Risk Analytics
  private async analyzeRisk(
    account: AgentPaperTradingAccount,
    positions: AgentPaperPosition[],
    decisions: AgentPaperTradingDecision[]
  ): Promise<RiskAnalytics> {
    const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);
    
    // Portfolio risk metrics
    const var95 = this.calculateVaR(positions, 0.95);
    const concentration = this.calculateConcentration(positions, totalValue);

    // Behavioral risk analysis
    const tradingFrequency = decisions.length / this.getTradingDays(decisions);
    const overtradingScore = Math.min(tradingFrequency / 5, 1); // Normalize to 0-1

    return {
      portfolio_risk: {
        var_95: var95,
        var_99: this.calculateVaR(positions, 0.99),
        expected_shortfall: var95 * 1.5, // Simplified ES calculation
        beta: this.calculateBeta(positions),
        tracking_error: 0.15 // Mock value
      },
      position_risk: {
        concentration,
        largest_position: Math.max(...positions.map(p => p.market_value / totalValue)),
        sector_exposure: this.calculateSectorExposure(positions),
        correlation_risk: this.estimateCorrelationRisk(positions)
      },
      behavioral_risk: {
        overtrading_score: overtradingScore,
        revenge_trading_incidents: this.detectRevengeTradingIncidents(decisions),
        discipline_score: this.calculateDisciplineScore(decisions),
        emotional_trading_score: this.calculateEmotionalTradingScore(decisions)
      }
    };
  }

  // Behavior Analytics
  private async analyzeBehavior(
    decisions: AgentPaperTradingDecision[],
    orders: any[]
  ): Promise<BehaviorAnalytics> {
    const avgHoldingPeriod = this.calculateAverageHoldingPeriod(orders);
    const tradeFrequency = orders.length / this.getTradingDays(orders);

    return {
      decision_patterns: {
        avg_holding_period: avgHoldingPeriod,
        trade_frequency: tradeFrequency,
        size_consistency: this.calculateSizeConsistency(orders),
        timing_patterns: this.analyzeTimingPatterns(orders)
      },
      psychological_metrics: {
        confidence_calibration: this.calculateConfidenceCalibration(decisions),
        overconfidence_bias: this.detectOverconfidenceBias(decisions),
        loss_aversion_coefficient: this.calculateLossAversion(decisions),
        disposition_effect: this.calculateDispositionEffect(orders)
      },
      learning_progression: {
        skill_development_trend: this.calculateSkillTrend(decisions),
        mistake_reduction_rate: this.calculateMistakeReduction(decisions),
        adaptation_speed: this.calculateAdaptationSpeed(decisions),
        knowledge_retention: 0.85 // Mock value
      }
    };
  }

  // Strategy Analytics
  private async analyzeStrategy(
    decisions: AgentPaperTradingDecision[],
    orders: any[]
  ): Promise<StrategyAnalytics> {
    const strategiesByType = this.groupDecisionsByStrategy(decisions);
    const strategyPerformance = Object.entries(strategiesByType).map(([strategyId, strategyDecisions]) => {
      const strategyOrders = orders.filter(order => order.strategy_id === strategyId);
      return {
        strategy_id: strategyId,
        name: strategyId,
        returns: this.calculateStrategyReturns(strategyOrders),
        win_rate: this.calculateWinRate(strategyOrders),
        trades: strategyOrders.length,
        avg_return: this.calculateAverageReturn(strategyOrders),
        consistency: this.calculateStrategyConsistency(strategyOrders)
      };
    });

    return {
      strategy_performance: strategyPerformance,
      signal_quality: {
        prediction_accuracy: this.calculatePredictionAccuracy(decisions),
        signal_strength_correlation: this.calculateSignalStrengthCorrelation(decisions),
        false_positive_rate: this.calculateFalsePositiveRate(decisions),
        signal_timing_efficiency: this.calculateTimingEfficiency(decisions)
      },
      execution_quality: {
        slippage: this.calculateAverageSlippage(orders),
        fill_rate: orders.filter(o => o.status === 'filled').length / orders.length,
        execution_delay: this.calculateExecutionDelay(orders),
        order_efficiency: 0.92 // Mock value
      }
    };
  }

  // Market Analytics
  private async analyzeMarketInteraction(
    positions: AgentPaperPosition[],
    marketData: any[]
  ): Promise<MarketAnalytics> {
    return {
      market_correlation: {
        correlation_to_market: this.calculateMarketCorrelation(positions, marketData),
        sector_correlations: this.calculateSectorCorrelations(positions),
        style_exposure: {
          growth: 0.6,
          value: 0.4,
          momentum: 0.7,
          quality: 0.5
        }
      },
      regime_performance: {
        bull_market: 0.15,
        bear_market: -0.08,
        sideways_market: 0.02,
        high_volatility: -0.05,
        low_volatility: 0.12
      },
      timing_analysis: {
        market_timing_skill: this.calculateMarketTimingSkill(positions, marketData),
        sector_rotation_skill: 0.3,
        volatility_timing: 0.25
      }
    };
  }

  // Helper Methods
  private calculateDailyReturns(orders: any[]): number[] {
    // Simplified daily return calculation
    const returns = [];
    for (let i = 1; i < Math.min(orders.length, 30); i++) {
      returns.push((Math.random() - 0.5) * 0.04); // Mock daily returns
    }
    return returns;
  }

  private calculateMonthlyReturns(dailyReturns: number[]): number[] {
    const monthlyReturns = [];
    for (let i = 0; i < dailyReturns.length; i += 21) { // ~21 trading days per month
      const monthReturn = dailyReturns.slice(i, i + 21).reduce((sum, ret) => sum + ret, 0);
      monthlyReturns.push(monthReturn);
    }
    return monthlyReturns;
  }

  private calculateSharpeRatio(returns: number[]): number {
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    return avgReturn / volatility;
  }

  private calculateSortinoRatio(returns: number[]): number {
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const downside = returns.filter(ret => ret < 0);
    const downsideVariance = downside.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / downside.length;
    const downsideVolatility = Math.sqrt(downsideVariance);
    return avgReturn / downsideVolatility;
  }

  private calculateDrawdownMetrics(orders: any[]): any {
    // Simplified drawdown calculation
    let peak = 10000;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    
    // Mock calculation
    const underwaterPeriods = [];
    
    return {
      max_drawdown: -0.15, // 15% max drawdown
      current_drawdown: -0.05, // 5% current drawdown
      drawdown_duration: 14, // 14 days
      underwater_periods: underwaterPeriods
    };
  }

  private calculateWinRate(trades: any[]): number {
    if (trades.length === 0) return 0;
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
    return winningTrades.length / trades.length;
  }

  private calculateProfitFactor(trades: any[]): number {
    const profits = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const losses = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    return losses === 0 ? profits : profits / losses;
  }

  private calculateExpectancy(trades: any[]): number {
    if (trades.length === 0) return 0;
    const avgPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / trades.length;
    return avgPnL;
  }

  private calculateConsistencyScore(monthlyReturns: number[]): number {
    if (monthlyReturns.length < 2) return 0;
    const positiveMonths = monthlyReturns.filter(ret => ret > 0).length;
    return positiveMonths / monthlyReturns.length;
  }

  private calculateVaR(positions: AgentPaperPosition[], confidence: number): number {
    // Simplified VaR calculation
    const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);
    const volatility = 0.15; // Assume 15% portfolio volatility
    const zScore = confidence === 0.95 ? 1.645 : 2.326;
    return totalValue * volatility * zScore / Math.sqrt(252);
  }

  private calculateConcentration(positions: AgentPaperPosition[], totalValue: number): number {
    if (positions.length === 0) return 0;
    const weights = positions.map(pos => pos.market_value / totalValue);
    return weights.reduce((sum, weight) => sum + weight * weight, 0); // Herfindahl index
  }

  private calculateBeta(positions: AgentPaperPosition[]): number {
    // Simplified beta calculation
    return 1.2; // Mock beta
  }

  private calculateSectorExposure(positions: AgentPaperPosition[]): Record<string, number> {
    // Mock sector exposure
    return {
      technology: 0.4,
      finance: 0.2,
      healthcare: 0.15,
      consumer: 0.15,
      energy: 0.1
    };
  }

  private estimateCorrelationRisk(positions: AgentPaperPosition[]): number {
    // Estimate correlation risk based on position concentration
    if (positions.length < 2) return 1;
    return Math.min(1, 1 / Math.sqrt(positions.length));
  }

  private detectRevengeTradingIncidents(decisions: AgentPaperTradingDecision[]): number {
    let incidents = 0;
    for (let i = 1; i < decisions.length; i++) {
      const current = decisions[i];
      const previous = decisions[i - 1];
      
      // Look for rapid decisions after losses (simplified)
      const timeDiff = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
      if (timeDiff < 3600000 && current.confidence_level < 0.5) { // Less than 1 hour and low confidence
        incidents++;
      }
    }
    return incidents;
  }

  private calculateDisciplineScore(decisions: AgentPaperTradingDecision[]): number {
    // Calculate discipline based on adherence to strategy rules
    let disciplineScore = 0;
    decisions.forEach(decision => {
      if (decision.confidence_level >= 0.6) disciplineScore += 1;
      if (decision.decision_factors.risk_considerations.length > 0) disciplineScore += 0.5;
    });
    return decisions.length > 0 ? disciplineScore / (decisions.length * 1.5) : 0;
  }

  private calculateEmotionalTradingScore(decisions: AgentPaperTradingDecision[]): number {
    // Detect emotional trading patterns
    let emotionalScore = 0;
    decisions.forEach(decision => {
      if (decision.confidence_level > 0.9 || decision.confidence_level < 0.3) {
        emotionalScore += 1; // Extreme confidence suggests emotion
      }
    });
    return decisions.length > 0 ? emotionalScore / decisions.length : 0;
  }

  private calculateAverageHoldingPeriod(orders: any[]): number {
    // Calculate average holding period in hours
    return 48; // Mock: 48 hours average
  }

  private calculateSizeConsistency(orders: any[]): number {
    if (orders.length < 2) return 1;
    const sizes = orders.map(order => order.quantity);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    const cv = Math.sqrt(variance) / avgSize; // Coefficient of variation
    return Math.max(0, 1 - cv); // Higher consistency = lower CV
  }

  private analyzeTimingPatterns(orders: any[]): Record<string, number> {
    // Analyze timing patterns
    return {
      morning: 0.3,
      afternoon: 0.4,
      evening: 0.3,
      monday: 0.15,
      tuesday: 0.2,
      wednesday: 0.2,
      thursday: 0.25,
      friday: 0.2
    };
  }

  private calculateConfidenceCalibration(decisions: AgentPaperTradingDecision[]): number {
    // Measure how well confidence predicts outcomes
    return 0.75; // Mock calibration score
  }

  private detectOverconfidenceBias(decisions: AgentPaperTradingDecision[]): number {
    const highConfidenceDecisions = decisions.filter(d => d.confidence_level > 0.8);
    return highConfidenceDecisions.length / decisions.length;
  }

  private calculateLossAversion(decisions: AgentPaperTradingDecision[]): number {
    // Measure loss aversion coefficient
    return 2.5; // Typical loss aversion coefficient
  }

  private calculateDispositionEffect(orders: any[]): number {
    // Measure tendency to hold losers and sell winners too early
    return 0.3; // Mock disposition effect score
  }

  private calculateSkillTrend(decisions: AgentPaperTradingDecision[]): number {
    // Calculate skill development trend over time
    if (decisions.length < 10) return 0;
    
    const recentDecisions = decisions.slice(-10);
    const earlyDecisions = decisions.slice(0, 10);
    
    const recentAvgConfidence = recentDecisions.reduce((sum, d) => sum + d.confidence_level, 0) / recentDecisions.length;
    const earlyAvgConfidence = earlyDecisions.reduce((sum, d) => sum + d.confidence_level, 0) / earlyDecisions.length;
    
    return recentAvgConfidence - earlyAvgConfidence;
  }

  private calculateMistakeReduction(decisions: AgentPaperTradingDecision[]): number {
    // Measure reduction in mistakes over time
    return 0.15; // Mock: 15% mistake reduction rate
  }

  private calculateAdaptationSpeed(decisions: AgentPaperTradingDecision[]): number {
    // Measure how quickly the agent adapts to new information
    return 0.8; // Mock adaptation speed
  }

  private groupDecisionsByStrategy(decisions: AgentPaperTradingDecision[]): Record<string, AgentPaperTradingDecision[]> {
    return decisions.reduce((acc, decision) => {
      const strategy = decision.strategy_id;
      if (!acc[strategy]) acc[strategy] = [];
      acc[strategy].push(decision);
      return acc;
    }, {} as Record<string, AgentPaperTradingDecision[]>);
  }

  private calculateStrategyReturns(orders: any[]): number {
    return orders.reduce((sum, order) => sum + (order.pnl || 0), 0);
  }

  private calculateAverageReturn(orders: any[]): number {
    if (orders.length === 0) return 0;
    return orders.reduce((sum, order) => sum + (order.pnl || 0), 0) / orders.length;
  }

  private calculateStrategyConsistency(orders: any[]): number {
    if (orders.length < 2) return 1;
    const returns = orders.map(order => order.pnl || 0);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    return 1 / (1 + Math.sqrt(variance)); // Higher consistency = lower variance
  }

  private calculatePredictionAccuracy(decisions: AgentPaperTradingDecision[]): number {
    // Measure prediction accuracy
    return 0.68; // Mock: 68% accuracy
  }

  private calculateSignalStrengthCorrelation(decisions: AgentPaperTradingDecision[]): number {
    // Correlation between signal strength and outcomes
    return 0.55; // Mock correlation
  }

  private calculateFalsePositiveRate(decisions: AgentPaperTradingDecision[]): number {
    // Rate of false positive signals
    return 0.25; // Mock: 25% false positive rate
  }

  private calculateTimingEfficiency(decisions: AgentPaperTradingDecision[]): number {
    // Measure timing efficiency of decisions
    return 0.72; // Mock timing efficiency
  }

  private calculateAverageSlippage(orders: any[]): number {
    // Calculate average slippage
    return 0.002; // Mock: 0.2% average slippage
  }

  private calculateExecutionDelay(orders: any[]): number {
    // Calculate average execution delay in milliseconds
    return 150; // Mock: 150ms average delay
  }

  private calculateMarketCorrelation(positions: AgentPaperPosition[], marketData: any[]): number {
    // Calculate correlation with market
    return 0.75; // Mock market correlation
  }

  private calculateSectorCorrelations(positions: AgentPaperPosition[]): Record<string, number> {
    // Calculate correlations with different sectors
    return {
      technology: 0.8,
      finance: 0.6,
      healthcare: 0.4,
      energy: 0.3
    };
  }

  private calculateMarketTimingSkill(positions: AgentPaperPosition[], marketData: any[]): number {
    // Measure market timing skill
    return 0.35; // Mock timing skill
  }

  private annualizeReturn(totalReturn: number, tradingDays: number): number {
    return Math.pow(1 + totalReturn, 252 / tradingDays) - 1;
  }

  private getTradingDays(data: any[]): number {
    if (data.length === 0) return 1;
    const firstDate = new Date(data[0].created_at || data[0].timestamp);
    const lastDate = new Date(data[data.length - 1].created_at || data[data.length - 1].timestamp);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); // Convert to days
  }

  // Recommendations Generation
  private generateRecommendations(
    performance: PerformanceAnalytics,
    risk: RiskAnalytics,
    behavior: BehaviorAnalytics,
    strategy: StrategyAnalytics,
    market: MarketAnalytics
  ): AnalyticsRecommendations {
    const recommendations: AnalyticsRecommendations = {
      performance_improvements: [],
      risk_adjustments: [],
      strategy_optimizations: [],
      behavioral_modifications: [],
      next_learning_objectives: []
    };

    // Performance recommendations
    if (performance.returns.total < 0.05) {
      recommendations.performance_improvements.push('Focus on improving strategy selection and timing');
    }
    if (performance.risk_adjusted.sharpe_ratio < 1) {
      recommendations.performance_improvements.push('Work on risk-adjusted returns through better risk management');
    }

    // Risk recommendations
    if (risk.portfolio_risk.var_95 > 0.1) {
      recommendations.risk_adjustments.push('Reduce portfolio risk through diversification');
    }
    if (risk.position_risk.concentration > 0.5) {
      recommendations.risk_adjustments.push('Reduce position concentration');
    }

    // Strategy recommendations
    const bestStrategy = strategy.strategy_performance.reduce((best, current) => 
      current.returns > best.returns ? current : best, strategy.strategy_performance[0]);
    if (bestStrategy) {
      recommendations.strategy_optimizations.push(`Focus more on ${bestStrategy.name} strategy`);
    }

    // Behavioral recommendations
    if (behavior.psychological_metrics.overconfidence_bias > 0.7) {
      recommendations.behavioral_modifications.push('Work on reducing overconfidence in trading decisions');
    }
    if (risk.behavioral_risk.overtrading_score > 0.6) {
      recommendations.behavioral_modifications.push('Reduce trading frequency and focus on quality over quantity');
    }

    // Learning objectives
    recommendations.next_learning_objectives.push('Study market regime identification');
    recommendations.next_learning_objectives.push('Improve position sizing techniques');
    recommendations.next_learning_objectives.push('Develop better exit strategies');

    return recommendations;
  }
}

// Factory function
export function createPaperTradingAnalyticsEngine(agentId: string): PaperTradingAnalyticsEngine {
  return new PaperTradingAnalyticsEngine(agentId);
}