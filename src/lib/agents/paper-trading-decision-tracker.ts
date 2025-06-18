// Paper Trading Decision Tracking and Learning System
import type {
  AgentPaperTradingDecision,
  AgentPaperOrderRequest,
  AgentPaperPosition
} from '@/types/agent-paper-trading';
import { PaperTradingEventEmitter } from '@/lib/websocket/paper-trading-events';

export interface DecisionOutcome {
  decision_id: string;
  execution_orders: string[];
  final_pnl: number;
  duration_hours: number;
  outcome_type: 'profit' | 'loss' | 'breakeven';
  success_factors: string[];
  failure_factors: string[];
  lessons_learned: string[];
  market_conditions_at_exit: any;
}

export interface DecisionPattern {
  pattern_id: string;
  pattern_type: 'timing' | 'symbol_selection' | 'size_adjustment' | 'exit_strategy';
  description: string;
  frequency: number;
  success_rate: number;
  avg_return: number;
  conditions: string[];
  examples: string[];
}

export interface LearningInsight {
  insight_id: string;
  category: 'strategy' | 'risk' | 'psychology' | 'execution';
  title: string;
  description: string;
  evidence: string[];
  confidence_level: number;
  actionable_steps: string[];
  impact_potential: 'low' | 'medium' | 'high';
  created_at: Date;
}

export interface DecisionAnalysis {
  decision: AgentPaperTradingDecision;
  outcome?: DecisionOutcome;
  similar_decisions: AgentPaperTradingDecision[];
  pattern_matches: DecisionPattern[];
  performance_comparison: {
    vs_average: number;
    vs_similar: number;
    confidence_accuracy: number;
  };
  improvement_suggestions: string[];
}

export class PaperTradingDecisionTracker {
  private readonly agentId: string;
  private decisions: Map<string, AgentPaperTradingDecision> = new Map();
  private outcomes: Map<string, DecisionOutcome> = new Map();
  private patterns: Map<string, DecisionPattern> = new Map();
  private insights: Map<string, LearningInsight> = new Map();

  constructor(agentId: string) {
    this.agentId = agentId;
    this.initializePatternDetection();
  }

  // Decision Recording
  async recordDecision(decision: AgentPaperTradingDecision): Promise<void> {
    this.decisions.set(decision.decision_id, decision);
    
    // Emit decision event
    PaperTradingEventEmitter.emitAgentDecision(
      this.agentId,
      decision.decision_id, // Using decision_id as account_id temporarily
      decision
    );

    // Analyze decision patterns
    await this.analyzeDecisionPatterns(decision);
    
    // Update learning insights
    await this.updateLearningInsights(decision);
  }

  async recordDecisionOutcome(
    decisionId: string,
    orders: string[],
    finalPnl: number,
    durationHours: number,
    marketConditions?: any
  ): Promise<void> {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      console.warn(`Decision ${decisionId} not found for outcome recording`);
      return;
    }

    const outcome: DecisionOutcome = {
      decision_id: decisionId,
      execution_orders: orders,
      final_pnl: finalPnl,
      duration_hours: durationHours,
      outcome_type: finalPnl > 0 ? 'profit' : finalPnl < 0 ? 'loss' : 'breakeven',
      success_factors: this.identifySuccessFactors(decision, finalPnl),
      failure_factors: this.identifyFailureFactors(decision, finalPnl),
      lessons_learned: [],
      market_conditions_at_exit: marketConditions || {}
    };

    // Generate lessons learned
    outcome.lessons_learned = await this.generateLessonsLearned(decision, outcome);

    this.outcomes.set(decisionId, outcome);

    // Update decision with outcome
    decision.outcome_tracking = {
      actual_return: finalPnl,
      hold_duration: durationHours,
      exit_reason: this.determineExitReason(outcome),
      lesson_learned: outcome.lessons_learned.join('; ')
    };

    // Analyze performance for insights
    await this.analyzeDecisionPerformance(decision, outcome);
  }

  // Pattern Detection
  private async analyzeDecisionPatterns(decision: AgentPaperTradingDecision): Promise<void> {
    // Timing patterns
    await this.detectTimingPatterns(decision);
    
    // Symbol selection patterns
    await this.detectSymbolPatterns(decision);
    
    // Confidence level patterns
    await this.detectConfidencePatterns(decision);
    
    // Market condition patterns
    await this.detectMarketConditionPatterns(decision);
  }

  private async detectTimingPatterns(decision: AgentPaperTradingDecision): Promise<void> {
    const hour = new Date(decision.created_at).getHours();
    const dayOfWeek = new Date(decision.created_at).getDay();

    // Check for timing-based patterns
    const timingPatternId = `timing-${hour}-${dayOfWeek}`;
    let pattern = this.patterns.get(timingPatternId);

    if (!pattern) {
      pattern = {
        pattern_id: timingPatternId,
        pattern_type: 'timing',
        description: `Decisions made at ${hour}:00 on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}`,
        frequency: 0,
        success_rate: 0,
        avg_return: 0,
        conditions: [`hour=${hour}`, `day_of_week=${dayOfWeek}`],
        examples: []
      };
      this.patterns.set(timingPatternId, pattern);
    }

    pattern.frequency++;
    pattern.examples.push(decision.decision_id);

    // Update success rate when outcomes are available
    this.updatePatternMetrics(pattern);
  }

  private async detectSymbolPatterns(decision: AgentPaperTradingDecision): Promise<void> {
    const symbolPatternId = `symbol-${decision.symbol}`;
    let pattern = this.patterns.get(symbolPatternId);

    if (!pattern) {
      pattern = {
        pattern_id: symbolPatternId,
        pattern_type: 'symbol_selection',
        description: `Decisions for ${decision.symbol}`,
        frequency: 0,
        success_rate: 0,
        avg_return: 0,
        conditions: [`symbol=${decision.symbol}`],
        examples: []
      };
      this.patterns.set(symbolPatternId, pattern);
    }

    pattern.frequency++;
    pattern.examples.push(decision.decision_id);
    this.updatePatternMetrics(pattern);
  }

  private async detectConfidencePatterns(decision: AgentPaperTradingDecision): Promise<void> {
    const confidenceRange = this.getConfidenceRange(decision.confidence_level);
    const confidencePatternId = `confidence-${confidenceRange}`;
    
    let pattern = this.patterns.get(confidencePatternId);

    if (!pattern) {
      pattern = {
        pattern_id: confidencePatternId,
        pattern_type: 'size_adjustment',
        description: `Decisions with ${confidenceRange} confidence`,
        frequency: 0,
        success_rate: 0,
        avg_return: 0,
        conditions: [`confidence_range=${confidenceRange}`],
        examples: []
      };
      this.patterns.set(confidencePatternId, pattern);
    }

    pattern.frequency++;
    pattern.examples.push(decision.decision_id);
    this.updatePatternMetrics(pattern);
  }

  private async detectMarketConditionPatterns(decision: AgentPaperTradingDecision): Promise<void> {
    const trend = decision.market_context.trend;
    const volatility = this.categorizeVolatility(decision.market_context.volatility);
    
    const marketPatternId = `market-${trend}-${volatility}`;
    let pattern = this.patterns.get(marketPatternId);

    if (!pattern) {
      pattern = {
        pattern_id: marketPatternId,
        pattern_type: 'timing',
        description: `Decisions in ${trend} trend with ${volatility} volatility`,
        frequency: 0,
        success_rate: 0,
        avg_return: 0,
        conditions: [`trend=${trend}`, `volatility=${volatility}`],
        examples: []
      };
      this.patterns.set(marketPatternId, pattern);
    }

    pattern.frequency++;
    pattern.examples.push(decision.decision_id);
    this.updatePatternMetrics(pattern);
  }

  private updatePatternMetrics(pattern: DecisionPattern): void {
    const outcomes = pattern.examples
      .map(id => this.outcomes.get(id))
      .filter(outcome => outcome !== undefined) as DecisionOutcome[];

    if (outcomes.length > 0) {
      const successfulOutcomes = outcomes.filter(o => o.final_pnl > 0);
      pattern.success_rate = successfulOutcomes.length / outcomes.length;
      pattern.avg_return = outcomes.reduce((sum, o) => sum + o.final_pnl, 0) / outcomes.length;
    }
  }

  // Learning Insights Generation
  private async updateLearningInsights(decision: AgentPaperTradingDecision): Promise<void> {
    // Generate insights based on decision patterns
    await this.generateConfidenceCalibrationInsights();
    await this.generateStrategyEffectivenessInsights();
    await this.generateRiskManagementInsights();
    await this.generateMarketTimingInsights();
  }

  private async generateConfidenceCalibrationInsights(): Promise<void> {
    const decisions = Array.from(this.decisions.values());
    const decisionOutcomes = decisions
      .map(d => ({ decision: d, outcome: this.outcomes.get(d.decision_id) }))
      .filter(pair => pair.outcome);

    if (decisionOutcomes.length < 10) return; // Need sufficient data

    // Analyze confidence vs actual outcomes
    const highConfidenceDecisions = decisionOutcomes.filter(pair => 
      pair.decision.confidence_level > 0.8
    );
    
    const highConfidenceSuccessRate = highConfidenceDecisions.filter(pair => 
      pair.outcome!.final_pnl > 0
    ).length / highConfidenceDecisions.length;

    if (highConfidenceSuccessRate < 0.6) {
      const insight: LearningInsight = {
        insight_id: `confidence-calibration-${Date.now()}`,
        category: 'psychology',
        title: 'Overconfidence Detected',
        description: 'High confidence decisions are not performing as expected, suggesting potential overconfidence bias.',
        evidence: [
          `High confidence (>80%) decisions: ${highConfidenceDecisions.length}`,
          `Success rate: ${(highConfidenceSuccessRate * 100).toFixed(1)}%`,
          'Expected success rate for high confidence should be >80%'
        ],
        confidence_level: 0.8,
        actionable_steps: [
          'Review criteria for high confidence decisions',
          'Implement additional validation checks',
          'Consider reducing position sizes for high confidence trades',
          'Study market conditions where overconfidence occurs'
        ],
        impact_potential: 'high',
        created_at: new Date()
      };

      this.insights.set(insight.insight_id, insight);
    }
  }

  private async generateStrategyEffectivenessInsights(): Promise<void> {
    const strategies = this.groupDecisionsByStrategy();
    
    Object.entries(strategies).forEach(([strategyId, strategyDecisions]) => {
      const outcomes = strategyDecisions
        .map(d => this.outcomes.get(d.decision_id))
        .filter(o => o) as DecisionOutcome[];

      if (outcomes.length >= 5) {
        const avgReturn = outcomes.reduce((sum, o) => sum + o.final_pnl, 0) / outcomes.length;
        const successRate = outcomes.filter(o => o.final_pnl > 0).length / outcomes.length;

        if (avgReturn < 0 || successRate < 0.4) {
          const insight: LearningInsight = {
            insight_id: `strategy-${strategyId}-${Date.now()}`,
            category: 'strategy',
            title: `${strategyId} Strategy Underperforming`,
            description: `The ${strategyId} strategy is showing poor performance and may need optimization.`,
            evidence: [
              `Average return: ${avgReturn.toFixed(4)}`,
              `Success rate: ${(successRate * 100).toFixed(1)}%`,
              `Total decisions: ${strategyDecisions.length}`
            ],
            confidence_level: 0.7,
            actionable_steps: [
              `Review ${strategyId} strategy parameters`,
              'Analyze market conditions where strategy fails',
              'Consider strategy modifications or replacement',
              'Implement additional filters for strategy signals'
            ],
            impact_potential: 'high',
            created_at: new Date()
          };

          this.insights.set(insight.insight_id, insight);
        }
      }
    });
  }

  private async generateRiskManagementInsights(): Promise<void> {
    const decisions = Array.from(this.decisions.values());
    const largePositions = decisions.filter(d => 
      d.expected_outcome.risk_reward_ratio < 1.5
    );

    if (largePositions.length > decisions.length * 0.3) {
      const insight: LearningInsight = {
        insight_id: `risk-management-${Date.now()}`,
        category: 'risk',
        title: 'Poor Risk-Reward Ratios Detected',
        description: 'Too many decisions have unfavorable risk-reward ratios, indicating poor risk management.',
        evidence: [
          `Decisions with R/R < 1.5: ${largePositions.length}`,
          `Percentage of total: ${(largePositions.length / decisions.length * 100).toFixed(1)}%`,
          'Recommended threshold: <20%'
        ],
        confidence_level: 0.9,
        actionable_steps: [
          'Implement minimum risk-reward ratio requirements',
          'Improve stop-loss and take-profit calculations',
          'Focus on higher probability setups',
          'Review position sizing methodology'
        ],
        impact_potential: 'high',
        created_at: new Date()
      };

      this.insights.set(insight.insight_id, insight);
    }
  }

  private async generateMarketTimingInsights(): Promise<void> {
    const timingPatterns = Array.from(this.patterns.values())
      .filter(p => p.pattern_type === 'timing' && p.frequency >= 5);

    const bestTimingPattern = timingPatterns.reduce((best, current) => 
      current.success_rate > best.success_rate ? current : best, 
      timingPatterns[0]
    );

    const worstTimingPattern = timingPatterns.reduce((worst, current) => 
      current.success_rate < worst.success_rate ? current : worst, 
      timingPatterns[0]
    );

    if (bestTimingPattern && worstTimingPattern && 
        bestTimingPattern.success_rate - worstTimingPattern.success_rate > 0.2) {
      
      const insight: LearningInsight = {
        insight_id: `timing-${Date.now()}`,
        category: 'execution',
        title: 'Market Timing Patterns Identified',
        description: 'Significant differences in success rates across different timing patterns detected.',
        evidence: [
          `Best timing: ${bestTimingPattern.description} (${(bestTimingPattern.success_rate * 100).toFixed(1)}% success)`,
          `Worst timing: ${worstTimingPattern.description} (${(worstTimingPattern.success_rate * 100).toFixed(1)}% success)`,
          `Performance gap: ${((bestTimingPattern.success_rate - worstTimingPattern.success_rate) * 100).toFixed(1)}%`
        ],
        confidence_level: 0.8,
        actionable_steps: [
          `Focus trading during: ${bestTimingPattern.description}`,
          `Avoid or reduce trading during: ${worstTimingPattern.description}`,
          'Analyze market conditions during best/worst timing periods',
          'Implement timing-based position sizing adjustments'
        ],
        impact_potential: 'medium',
        created_at: new Date()
      };

      this.insights.set(insight.insight_id, insight);
    }
  }

  // Decision Analysis
  async analyzeDecision(decisionId: string): Promise<DecisionAnalysis> {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    const outcome = this.outcomes.get(decisionId);
    const similarDecisions = this.findSimilarDecisions(decision);
    const patternMatches = this.findMatchingPatterns(decision);
    
    const performanceComparison = await this.compareDecisionPerformance(decision, outcome);
    const improvementSuggestions = this.generateImprovementSuggestions(
      decision, outcome, similarDecisions
    );

    return {
      decision,
      outcome,
      similar_decisions: similarDecisions,
      pattern_matches: patternMatches,
      performance_comparison: performanceComparison,
      improvement_suggestions: improvementSuggestions
    };
  }

  private findSimilarDecisions(targetDecision: AgentPaperTradingDecision): AgentPaperTradingDecision[] {
    const allDecisions = Array.from(this.decisions.values());
    
    return allDecisions.filter(decision => {
      if (decision.decision_id === targetDecision.decision_id) return false;
      
      let similarity = 0;
      
      // Symbol similarity
      if (decision.symbol === targetDecision.symbol) similarity += 0.3;
      
      // Strategy similarity
      if (decision.strategy_id === targetDecision.strategy_id) similarity += 0.3;
      
      // Decision type similarity
      if (decision.decision_type === targetDecision.decision_type) similarity += 0.2;
      
      // Confidence similarity
      const confidenceDiff = Math.abs(decision.confidence_level - targetDecision.confidence_level);
      if (confidenceDiff < 0.2) similarity += 0.2;
      
      return similarity >= 0.6; // 60% similarity threshold
    }).slice(0, 5); // Return top 5 similar decisions
  }

  private findMatchingPatterns(decision: AgentPaperTradingDecision): DecisionPattern[] {
    return Array.from(this.patterns.values()).filter(pattern => {
      return pattern.examples.includes(decision.decision_id);
    });
  }

  private async compareDecisionPerformance(
    decision: AgentPaperTradingDecision,
    outcome?: DecisionOutcome
  ): Promise<any> {
    if (!outcome) {
      return {
        vs_average: 0,
        vs_similar: 0,
        confidence_accuracy: 0
      };
    }

    const allOutcomes = Array.from(this.outcomes.values());
    const avgReturn = allOutcomes.reduce((sum, o) => sum + o.final_pnl, 0) / allOutcomes.length;
    
    const similarDecisions = this.findSimilarDecisions(decision);
    const similarOutcomes = similarDecisions
      .map(d => this.outcomes.get(d.decision_id))
      .filter(o => o) as DecisionOutcome[];
    
    const avgSimilarReturn = similarOutcomes.length > 0 
      ? similarOutcomes.reduce((sum, o) => sum + o.final_pnl, 0) / similarOutcomes.length
      : 0;

    // Calculate confidence accuracy
    const expectedSuccess = decision.confidence_level > 0.5;
    const actualSuccess = outcome.final_pnl > 0;
    const confidenceAccuracy = expectedSuccess === actualSuccess ? 1 : 0;

    return {
      vs_average: outcome.final_pnl - avgReturn,
      vs_similar: outcome.final_pnl - avgSimilarReturn,
      confidence_accuracy: confidenceAccuracy
    };
  }

  private generateImprovementSuggestions(
    decision: AgentPaperTradingDecision,
    outcome?: DecisionOutcome,
    similarDecisions?: AgentPaperTradingDecision[]
  ): string[] {
    const suggestions: string[] = [];

    if (!outcome) {
      suggestions.push('Decision outcome not yet available for analysis');
      return suggestions;
    }

    // Confidence calibration suggestions
    if (decision.confidence_level > 0.8 && outcome.final_pnl < 0) {
      suggestions.push('Consider being more conservative with high confidence assessments');
    }

    // Risk-reward suggestions
    if (decision.expected_outcome.risk_reward_ratio < 1.5 && outcome.final_pnl < 0) {
      suggestions.push('Focus on setups with better risk-reward ratios (>2:1)');
    }

    // Market condition suggestions
    if (decision.market_context.volatility > 0.2 && outcome.final_pnl < 0) {
      suggestions.push('Consider avoiding trades during high volatility periods');
    }

    // Pattern-based suggestions
    const matchingPatterns = this.findMatchingPatterns(decision);
    const poorPerformingPatterns = matchingPatterns.filter(p => p.success_rate < 0.5);
    
    if (poorPerformingPatterns.length > 0) {
      suggestions.push(`Review decisions matching pattern: ${poorPerformingPatterns[0].description}`);
    }

    // Similar decision suggestions
    if (similarDecisions && similarDecisions.length > 0) {
      const betterSimilarDecisions = similarDecisions.filter(d => {
        const similarOutcome = this.outcomes.get(d.decision_id);
        return similarOutcome && similarOutcome.final_pnl > outcome.final_pnl;
      });

      if (betterSimilarDecisions.length > 0) {
        suggestions.push('Study better-performing similar decisions for improvement opportunities');
      }
    }

    return suggestions;
  }

  // Helper Methods
  private identifySuccessFactors(decision: AgentPaperTradingDecision, pnl: number): string[] {
    if (pnl <= 0) return [];

    const factors: string[] = [];

    if (decision.confidence_level > 0.7) {
      factors.push('High confidence level');
    }

    if (decision.expected_outcome.risk_reward_ratio > 2) {
      factors.push('Good risk-reward ratio');
    }

    if (decision.decision_factors.technical_signals.length > 2) {
      factors.push('Multiple confirming signals');
    }

    if (decision.market_context.trend !== 'neutral') {
      factors.push('Clear market trend');
    }

    return factors;
  }

  private identifyFailureFactors(decision: AgentPaperTradingDecision, pnl: number): string[] {
    if (pnl >= 0) return [];

    const factors: string[] = [];

    if (decision.confidence_level < 0.5) {
      factors.push('Low confidence level');
    }

    if (decision.expected_outcome.risk_reward_ratio < 1.5) {
      factors.push('Poor risk-reward ratio');
    }

    if (decision.decision_factors.risk_considerations.length === 0) {
      factors.push('Insufficient risk analysis');
    }

    if (decision.market_context.volatility > 0.2) {
      factors.push('High market volatility');
    }

    return factors;
  }

  private async generateLessonsLearned(
    decision: AgentPaperTradingDecision,
    outcome: DecisionOutcome
  ): Promise<string[]> {
    const lessons: string[] = [];

    // Confidence vs outcome lessons
    if (decision.confidence_level > 0.8 && outcome.final_pnl < 0) {
      lessons.push('High confidence does not guarantee success - maintain humility');
    }

    // Risk management lessons
    if (outcome.final_pnl < decision.expected_outcome.expected_return * -2) {
      lessons.push('Actual loss exceeded expected risk - review stop-loss strategy');
    }

    // Timing lessons
    if (outcome.duration_hours < 2 && outcome.final_pnl < 0) {
      lessons.push('Quick losses may indicate poor entry timing - consider more analysis');
    }

    // Market condition lessons
    if (decision.market_context.volatility > 0.15 && outcome.final_pnl < 0) {
      lessons.push('High volatility environments require extra caution');
    }

    return lessons;
  }

  private determineExitReason(outcome: DecisionOutcome): string {
    if (outcome.final_pnl > 0) {
      return outcome.duration_hours > 24 ? 'profit_target' : 'quick_profit';
    } else {
      return outcome.final_pnl < -0.05 ? 'stop_loss' : 'manual_exit';
    }
  }

  private async analyzeDecisionPerformance(
    decision: AgentPaperTradingDecision,
    outcome: DecisionOutcome
  ): Promise<void> {
    // This method analyzes the decision performance and updates internal metrics
    // Could trigger additional insights or pattern updates
    console.log(`Analyzed decision ${decision.decision_id} with outcome ${outcome.outcome_type}`);
  }

  private getConfidenceRange(confidence: number): string {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    if (confidence >= 0.4) return 'low';
    return 'very_low';
  }

  private categorizeVolatility(volatility: number): string {
    if (volatility >= 0.3) return 'high';
    if (volatility >= 0.15) return 'medium';
    return 'low';
  }

  private groupDecisionsByStrategy(): Record<string, AgentPaperTradingDecision[]> {
    const strategies: Record<string, AgentPaperTradingDecision[]> = {};
    
    for (const decision of this.decisions.values()) {
      const strategyId = decision.strategy_id;
      if (!strategies[strategyId]) {
        strategies[strategyId] = [];
      }
      strategies[strategyId].push(decision);
    }
    
    return strategies;
  }

  // Public API
  getDecision(decisionId: string): AgentPaperTradingDecision | undefined {
    return this.decisions.get(decisionId);
  }

  getOutcome(decisionId: string): DecisionOutcome | undefined {
    return this.outcomes.get(decisionId);
  }

  getAllDecisions(): AgentPaperTradingDecision[] {
    return Array.from(this.decisions.values());
  }

  getAllOutcomes(): DecisionOutcome[] {
    return Array.from(this.outcomes.values());
  }

  getPatterns(): DecisionPattern[] {
    return Array.from(this.patterns.values());
  }

  getInsights(): LearningInsight[] {
    return Array.from(this.insights.values());
  }

  getRecentInsights(limit: number = 10): LearningInsight[] {
    return Array.from(this.insights.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  getPerformanceSummary(): any {
    const outcomes = Array.from(this.outcomes.values());
    if (outcomes.length === 0) return null;

    const totalPnL = outcomes.reduce((sum, o) => sum + o.final_pnl, 0);
    const winRate = outcomes.filter(o => o.final_pnl > 0).length / outcomes.length;
    const avgDuration = outcomes.reduce((sum, o) => sum + o.duration_hours, 0) / outcomes.length;

    return {
      total_decisions: this.decisions.size,
      completed_outcomes: outcomes.length,
      total_pnl: totalPnL,
      win_rate: winRate,
      avg_duration_hours: avgDuration,
      patterns_identified: this.patterns.size,
      insights_generated: this.insights.size
    };
  }

  private initializePatternDetection(): void {
    // Initialize any default patterns or detection algorithms
    console.log(`Decision tracker initialized for agent ${this.agentId}`);
  }
}

// Factory function
export function createPaperTradingDecisionTracker(agentId: string): PaperTradingDecisionTracker {
  return new PaperTradingDecisionTracker(agentId);
}