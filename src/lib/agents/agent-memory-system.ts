'use client'

/**
 * Agent Memory System
 * Provides learning, adaptation, and performance optimization for autonomous trading agents
 */

import { EventEmitter } from 'events'
import type { CreatedAgent } from './enhanced-agent-creation-service'
import type { AgentDecision } from './llm-decision-integration'
import type { TradingCycle, AgentPerformanceMetrics } from './autonomous-trading-loop'
import type { TechnicalSignal } from '@/lib/strategies/technical-analysis-engine'

export interface AgentMemory {
  agentId: string
  createdAt: Date
  lastUpdated: Date
  
  // Decision History with Outcomes
  decisions: {
    history: DecisionMemory[]
    patterns: DecisionPattern[]
    successFactors: SuccessFactor[]
    failureReasons: FailureReason[]
  }
  
  // Market Learning
  marketLearning: {
    symbolPreferences: Map<string, SymbolPreference>
    timeframeEffectiveness: Map<string, TimeframeEffectiveness>
    conditionAdaptations: MarketConditionAdaptation[]
    volatilityResponses: VolatilityResponse[]
  }
  
  // Strategy Performance
  strategyPerformance: {
    baselineMetrics: StrategyMetrics
    adaptiveParameters: AdaptiveParameter[]
    optimizationHistory: OptimizationEvent[]
    strategyEvolution: StrategyEvolution[]
  }
  
  // Risk Learning
  riskLearning: {
    drawdownExperiences: DrawdownEvent[]
    riskToleranceEvolution: RiskToleranceChange[]
    positionSizingLessons: PositionSizingLesson[]
    correlationInsights: CorrelationInsight[]
  }
  
  // Goal Achievement
  goalTracking: {
    achievedGoals: AchievedGoal[]
    failedGoals: FailedGoal[]
    progressPatterns: ProgressPattern[]
    priorityShifts: PriorityShift[]
  }
  
  // Performance Patterns
  performancePatterns: {
    dailyPerformance: DailyPerformancePattern[]
    weeklyTrends: WeeklyTrendPattern[]
    sessionEffectiveness: SessionEffectivenessPattern[]
    environmentalFactors: EnvironmentalFactor[]
  }
}

export interface DecisionMemory {
  id: string
  timestamp: Date
  decision: AgentDecision
  outcome: {
    pnl: number
    executionSuccess: boolean
    marketMovement: number
    timeToRealization: number
    slippage: number
    fees: number
  }
  context: {
    marketCondition: string
    volatility: number
    signalStrength: number
    confidence: number
    riskLevel: string
  }
  lessons: string[]
}

export interface DecisionPattern {
  id: string
  patternType: 'timing' | 'symbol_selection' | 'position_sizing' | 'risk_management'
  description: string
  frequency: number
  successRate: number
  avgPnL: number
  conditions: string[]
  confidence: number
  examples: string[]
}

export interface SuccessFactor {
  factor: string
  importance: number
  description: string
  frequency: number
  avgImpact: number
  examples: DecisionMemory[]
}

export interface FailureReason {
  reason: string
  frequency: number
  avgLoss: number
  description: string
  preventionStrategies: string[]
  examples: DecisionMemory[]
}

export interface SymbolPreference {
  symbol: string
  winRate: number
  avgPnL: number
  totalTrades: number
  volatilityPreference: number
  timeframeOptimal: string[]
  bestConditions: string[]
  avoidConditions: string[]
}

export interface TimeframeEffectiveness {
  timeframe: string
  winRate: number
  avgPnL: number
  totalTrades: number
  optimalConditions: string[]
  effectiveness: number
}

export interface MarketConditionAdaptation {
  condition: string
  adaptations: AdaptiveParameter[]
  effectiveness: number
  learningDate: Date
  examples: DecisionMemory[]
}

export interface VolatilityResponse {
  volatilityRange: string
  optimalStrategy: string
  positionSizeAdjustment: number
  riskAdjustment: number
  winRate: number
  examples: DecisionMemory[]
}

export interface StrategyMetrics {
  strategy: string
  winRate: number
  avgPnL: number
  maxDrawdown: number
  sharpeRatio: number
  totalTrades: number
  avgHoldTime: number
  profitFactor: number
}

export interface AdaptiveParameter {
  parameter: string
  originalValue: any
  currentValue: any
  adjustmentReason: string
  impact: number
  adjustmentDate: Date
  effectiveness: number
}

export interface OptimizationEvent {
  id: string
  timestamp: Date
  optimizationType: 'parameter_tuning' | 'strategy_mixing' | 'risk_adjustment' | 'timing_optimization'
  changes: AdaptiveParameter[]
  reason: string
  expectedImpact: number
  actualImpact?: number
  success: boolean
}

export interface StrategyEvolution {
  version: string
  timestamp: Date
  changes: string[]
  reason: string
  performance: StrategyMetrics
  adoptionDecision: boolean
}

export interface DrawdownEvent {
  id: string
  timestamp: Date
  maxDrawdown: number
  duration: number
  cause: string
  recovery: {
    time: number
    method: string
    effectiveness: number
  }
  lessons: string[]
  preventionStrategy: string
}

export interface RiskToleranceChange {
  timestamp: Date
  oldTolerance: number
  newTolerance: number
  reason: string
  triggerEvent?: string
  impact: number
}

export interface PositionSizingLesson {
  id: string
  timestamp: Date
  originalSize: number
  optimalSize: number
  pnlDifference: number
  lesson: string
  conditions: string[]
}

export interface CorrelationInsight {
  symbols: string[]
  correlation: number
  impact: string
  discoveryDate: Date
  examples: DecisionMemory[]
  actionTaken: string
}

export interface AchievedGoal {
  goalId: string
  description: string
  achievedDate: Date
  timeToAchieve: number
  method: string
  keyFactors: string[]
  celebration: boolean
}

export interface FailedGoal {
  goalId: string
  description: string
  failureDate: Date
  timeAttempted: number
  reason: string
  lessons: string[]
  retryStrategy?: string
}

export interface ProgressPattern {
  patternType: string
  description: string
  frequency: number
  effectiveness: number
  examples: string[]
}

export interface PriorityShift {
  timestamp: Date
  oldPriorities: string[]
  newPriorities: string[]
  reason: string
  impact: number
}

export interface DailyPerformancePattern {
  timeRange: string
  avgPnL: number
  winRate: number
  tradeCount: number
  effectiveness: number
  optimalConditions: string[]
}

export interface WeeklyTrendPattern {
  dayOfWeek: string
  avgPerformance: number
  volatility: number
  optimalStrategies: string[]
  effectiveness: number
}

export interface SessionEffectivenessPattern {
  sessionType: string
  duration: number
  avgPnL: number
  winRate: number
  optimalConditions: string[]
  fatigueIndicators: string[]
}

export interface EnvironmentalFactor {
  factor: string
  correlation: number
  impact: number
  description: string
  adaptationStrategy: string
}

export interface LearningInsight {
  id: string
  type: 'pattern' | 'optimization' | 'risk' | 'goal' | 'performance'
  title: string
  description: string
  confidence: number
  impact: number
  actionable: boolean
  recommendations: string[]
  evidence: any[]
  createdAt: Date
}

export interface MemoryAnalysis {
  agentId: string
  analysisDate: Date
  totalDecisions: number
  totalPnL: number
  winRate: number
  learningProgress: number
  adaptationScore: number
  insights: LearningInsight[]
  recommendations: string[]
  warnings: string[]
}

class AgentMemorySystem extends EventEmitter {
  private agentMemories: Map<string, AgentMemory> = new Map()
  private memoryAnalysisCache: Map<string, MemoryAnalysis> = new Map()
  private learningSchedules: Map<string, NodeJS.Timeout> = new Map()
  
  constructor() {
    super()
    this.initializeMemorySystem()
  }
  
  /**
   * Initialize the memory system with periodic learning cycles
   */
  private initializeMemorySystem() {
    // Run deep learning analysis every hour
    setInterval(() => {
      this.performDeepLearningAnalysis()
    }, 3600000)
    
    // Run pattern recognition every 30 minutes
    setInterval(() => {
      this.recognizePatterns()
    }, 1800000)
    
    // Clean old memories every 6 hours
    setInterval(() => {
      this.cleanOldMemories()
    }, 21600000)
  }
  
  /**
   * Initialize memory for a new agent
   */
  initializeAgentMemory(agent: CreatedAgent): AgentMemory {
    const memory: AgentMemory = {
      agentId: agent.id,
      createdAt: new Date(),
      lastUpdated: new Date(),
      
      decisions: {
        history: [],
        patterns: [],
        successFactors: [],
        failureReasons: []
      },
      
      marketLearning: {
        symbolPreferences: new Map(),
        timeframeEffectiveness: new Map(),
        conditionAdaptations: [],
        volatilityResponses: []
      },
      
      strategyPerformance: {
        baselineMetrics: {
          strategy: agent.config.strategy.type,
          winRate: 0,
          avgPnL: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          totalTrades: 0,
          avgHoldTime: 0,
          profitFactor: 0
        },
        adaptiveParameters: [],
        optimizationHistory: [],
        strategyEvolution: []
      },
      
      riskLearning: {
        drawdownExperiences: [],
        riskToleranceEvolution: [],
        positionSizingLessons: [],
        correlationInsights: []
      },
      
      goalTracking: {
        achievedGoals: [],
        failedGoals: [],
        progressPatterns: [],
        priorityShifts: []
      },
      
      performancePatterns: {
        dailyPerformance: [],
        weeklyTrends: [],
        sessionEffectiveness: [],
        environmentalFactors: []
      }
    }
    
    this.agentMemories.set(agent.id, memory)
    
    // Start learning schedule for this agent
    this.startLearningSchedule(agent.id)
    
    console.log(`Memory system initialized for agent ${agent.id}`)
    return memory
  }
  
  /**
   * Record a decision and its outcome for learning
   */
  recordDecision(
    agentId: string, 
    decision: AgentDecision, 
    cycle: TradingCycle,
    outcome: {
      pnl: number
      executionSuccess: boolean
      marketMovement: number
      timeToRealization: number
      slippage: number
      fees: number
    }
  ) {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return
    
    const decisionMemory: DecisionMemory = {
      id: `mem_${agentId}_${Date.now()}`,
      timestamp: decision.timestamp,
      decision,
      outcome,
      context: {
        marketCondition: cycle.marketAnalysis.marketCondition,
        volatility: cycle.marketAnalysis.volatility,
        signalStrength: cycle.marketAnalysis.signals.reduce((sum, s) => sum + s.strength, 0) / Math.max(cycle.marketAnalysis.signals.length, 1),
        confidence: decision.confidence,
        riskLevel: decision.decision.riskLevel
      },
      lessons: this.extractLessonsFromDecision(decision, outcome, cycle)
    }
    
    memory.decisions.history.push(decisionMemory)
    memory.lastUpdated = new Date()
    
    // Keep only last 1000 decisions
    if (memory.decisions.history.length > 1000) {
      memory.decisions.history = memory.decisions.history.slice(-1000)
    }
    
    // Trigger immediate learning if significant decision
    if (Math.abs(outcome.pnl) > 1000 || outcome.executionSuccess === false) {
      this.analyzeDecisionImmediate(agentId, decisionMemory)
    }
    
    this.emit('decisionRecorded', { agentId, decisionMemory })
  }
  
  /**
   * Update strategy performance metrics
   */
  updateStrategyPerformance(agentId: string, metrics: AgentPerformanceMetrics) {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return
    
    memory.strategyPerformance.baselineMetrics = {
      strategy: memory.strategyPerformance.baselineMetrics.strategy,
      winRate: metrics.winRate,
      avgPnL: metrics.totalPnL / Math.max(metrics.totalCycles, 1),
      maxDrawdown: metrics.maxDrawdown,
      sharpeRatio: metrics.sharpeRatio,
      totalTrades: metrics.successfulExecutions,
      avgHoldTime: 0, // Would be calculated from actual hold times
      profitFactor: metrics.winRate > 0 ? (metrics.totalPnL / Math.abs(metrics.maxDrawdown || 1)) : 0
    }
    
    memory.lastUpdated = new Date()
    this.emit('strategyPerformanceUpdated', { agentId, metrics })
  }
  
  /**
   * Learn from performance and adapt parameters
   */
  async adaptFromLearning(agentId: string): Promise<AdaptiveParameter[]> {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return []
    
    const adaptations: AdaptiveParameter[] = []
    
    // Analyze recent performance
    const recentDecisions = memory.decisions.history.slice(-50)
    if (recentDecisions.length < 10) return []
    
    const recentWinRate = recentDecisions.filter(d => d.outcome.pnl > 0).length / recentDecisions.length
    const recentAvgPnL = recentDecisions.reduce((sum, d) => sum + d.outcome.pnl, 0) / recentDecisions.length
    
    // Risk adjustment based on drawdown
    if (memory.strategyPerformance.baselineMetrics.maxDrawdown > 0.1) {
      adaptations.push({
        parameter: 'positionSize',
        originalValue: 1.0,
        currentValue: 0.8,
        adjustmentReason: 'High drawdown detected, reducing position size',
        impact: 0.15,
        adjustmentDate: new Date(),
        effectiveness: 0
      })
    }
    
    // Confidence threshold adjustment based on win rate
    if (recentWinRate < 0.4) {
      adaptations.push({
        parameter: 'confidenceThreshold',
        originalValue: 0.6,
        currentValue: 0.75,
        adjustmentReason: 'Low win rate, increasing confidence threshold',
        impact: 0.1,
        adjustmentDate: new Date(),
        effectiveness: 0
      })
    }
    
    // Frequency adjustment based on performance
    if (recentAvgPnL < 0) {
      adaptations.push({
        parameter: 'decisionFrequency',
        originalValue: 10000,
        currentValue: 15000,
        adjustmentReason: 'Negative PnL, slowing down decision frequency',
        impact: 0.2,
        adjustmentDate: new Date(),
        effectiveness: 0
      })
    }
    
    // Store adaptations in memory
    memory.strategyPerformance.adaptiveParameters.push(...adaptations)
    memory.lastUpdated = new Date()
    
    this.emit('parametersAdapted', { agentId, adaptations })
    return adaptations
  }
  
  /**
   * Generate learning insights from memory analysis
   */
  generateInsights(agentId: string): LearningInsight[] {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return []
    
    const insights: LearningInsight[] = []
    
    // Pattern insights
    if (memory.decisions.patterns.length > 0) {
      const bestPattern = memory.decisions.patterns
        .sort((a, b) => b.successRate - a.successRate)[0]
      
      insights.push({
        id: `insight_pattern_${Date.now()}`,
        type: 'pattern',
        title: `Strong ${bestPattern.patternType} Pattern Detected`,
        description: `${bestPattern.description} with ${(bestPattern.successRate * 100).toFixed(1)}% success rate`,
        confidence: bestPattern.confidence,
        impact: bestPattern.avgPnL,
        actionable: true,
        recommendations: [`Focus on ${bestPattern.patternType} opportunities`, 'Increase position size for this pattern'],
        evidence: bestPattern.examples,
        createdAt: new Date()
      })
    }
    
    // Risk insights
    if (memory.riskLearning.drawdownExperiences.length > 0) {
      const recentDrawdown = memory.riskLearning.drawdownExperiences
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      
      insights.push({
        id: `insight_risk_${Date.now()}`,
        type: 'risk',
        title: 'Risk Management Learning',
        description: `Recent drawdown of ${(recentDrawdown.maxDrawdown * 100).toFixed(1)}% provided valuable lessons`,
        confidence: 0.85,
        impact: -Math.abs(recentDrawdown.maxDrawdown),
        actionable: true,
        recommendations: recentDrawdown.lessons,
        evidence: [recentDrawdown],
        createdAt: new Date()
      })
    }
    
    // Performance insights
    const recentPerformance = memory.decisions.history.slice(-20)
    if (recentPerformance.length > 10) {
      const winRate = recentPerformance.filter(d => d.outcome.pnl > 0).length / recentPerformance.length
      const avgPnL = recentPerformance.reduce((sum, d) => sum + d.outcome.pnl, 0) / recentPerformance.length
      
      insights.push({
        id: `insight_performance_${Date.now()}`,
        type: 'performance',
        title: 'Recent Performance Analysis',
        description: `Win rate: ${(winRate * 100).toFixed(1)}%, Avg PnL: $${avgPnL.toFixed(2)}`,
        confidence: 0.9,
        impact: avgPnL,
        actionable: avgPnL < 0,
        recommendations: avgPnL < 0 ? 
          ['Consider strategy adjustment', 'Review risk parameters', 'Analyze market conditions'] :
          ['Maintain current approach', 'Consider scaling up'],
        evidence: recentPerformance,
        createdAt: new Date()
      })
    }
    
    return insights
  }
  
  /**
   * Get comprehensive memory analysis for an agent
   */
  getMemoryAnalysis(agentId: string): MemoryAnalysis | null {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return null
    
    const totalDecisions = memory.decisions.history.length
    const totalPnL = memory.decisions.history.reduce((sum, d) => sum + d.outcome.pnl, 0)
    const winRate = totalDecisions > 0 ? 
      memory.decisions.history.filter(d => d.outcome.pnl > 0).length / totalDecisions : 0
    
    const learningProgress = this.calculateLearningProgress(memory)
    const adaptationScore = this.calculateAdaptationScore(memory)
    const insights = this.generateInsights(agentId)
    
    const analysis: MemoryAnalysis = {
      agentId,
      analysisDate: new Date(),
      totalDecisions,
      totalPnL,
      winRate,
      learningProgress,
      adaptationScore,
      insights,
      recommendations: this.generateRecommendations(memory, insights),
      warnings: this.generateWarnings(memory)
    }
    
    this.memoryAnalysisCache.set(agentId, analysis)
    return analysis
  }
  
  /**
   * Extract lessons from a trading decision and outcome
   */
  private extractLessonsFromDecision(
    decision: AgentDecision, 
    outcome: any, 
    cycle: TradingCycle
  ): string[] {
    const lessons: string[] = []
    
    // Execution lessons
    if (!outcome.executionSuccess) {
      lessons.push('Execution failed - review market liquidity and timing')
    }
    
    // Slippage lessons
    if (outcome.slippage > 0.005) {
      lessons.push('High slippage detected - consider limit orders')
    }
    
    // Market movement lessons
    if (outcome.pnl < 0 && outcome.marketMovement > 0 && decision.decision.action === 'sell') {
      lessons.push('Sold before upward movement - improve timing signals')
    }
    
    // Confidence lessons
    if (decision.confidence > 0.8 && outcome.pnl < 0) {
      lessons.push('High confidence decision failed - review signal analysis')
    }
    
    // Volatility lessons
    if (cycle.marketAnalysis.volatility > 0.03 && outcome.pnl < 0) {
      lessons.push('High volatility trade failed - adjust risk for volatile markets')
    }
    
    return lessons
  }
  
  /**
   * Analyze a decision immediately for critical learning
   */
  private async analyzeDecisionImmediate(agentId: string, decisionMemory: DecisionMemory) {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return
    
    // Check for patterns
    this.updateDecisionPatterns(memory, decisionMemory)
    
    // Update success factors or failure reasons
    if (decisionMemory.outcome.pnl > 0) {
      this.updateSuccessFactors(memory, decisionMemory)
    } else {
      this.updateFailureReasons(memory, decisionMemory)
    }
    
    this.emit('immediateAnalysisComplete', { agentId, decisionMemory })
  }
  
  /**
   * Start learning schedule for an agent
   */
  private startLearningSchedule(agentId: string) {
    // Stop existing schedule if any
    this.stopLearningSchedule(agentId)
    
    // Schedule learning every 30 minutes
    const schedule = setInterval(async () => {
      await this.performAgentLearning(agentId)
    }, 1800000)
    
    this.learningSchedules.set(agentId, schedule)
  }
  
  /**
   * Stop learning schedule for an agent
   */
  private stopLearningSchedule(agentId: string) {
    const schedule = this.learningSchedules.get(agentId)
    if (schedule) {
      clearInterval(schedule)
      this.learningSchedules.delete(agentId)
    }
  }
  
  /**
   * Perform learning for a specific agent
   */
  private async performAgentLearning(agentId: string) {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return
    
    // Update decision patterns
    this.recognizePatternsForAgent(agentId)
    
    // Adapt parameters if needed
    const adaptations = await this.adaptFromLearning(agentId)
    
    // Generate new insights
    const insights = this.generateInsights(agentId)
    
    this.emit('learningCycleComplete', { agentId, adaptations, insights })
  }
  
  /**
   * Perform deep learning analysis across all agents
   */
  private performDeepLearningAnalysis() {
    for (const agentId of this.agentMemories.keys()) {
      const analysis = this.getMemoryAnalysis(agentId)
      if (analysis) {
        this.emit('deepAnalysisComplete', analysis)
      }
    }
  }
  
  /**
   * Recognize patterns across all agents
   */
  private recognizePatterns() {
    for (const agentId of this.agentMemories.keys()) {
      this.recognizePatternsForAgent(agentId)
    }
  }
  
  /**
   * Recognize patterns for a specific agent
   */
  private recognizePatternsForAgent(agentId: string) {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return
    
    const recentDecisions = memory.decisions.history.slice(-100)
    if (recentDecisions.length < 20) return
    
    // Look for timing patterns
    this.recognizeTimingPatterns(memory, recentDecisions)
    
    // Look for symbol selection patterns
    this.recognizeSymbolPatterns(memory, recentDecisions)
    
    // Look for position sizing patterns
    this.recognizePositionSizingPatterns(memory, recentDecisions)
    
    // Look for risk management patterns
    this.recognizeRiskManagementPatterns(memory, recentDecisions)
  }
  
  /**
   * Update decision patterns in memory
   */
  private updateDecisionPatterns(memory: AgentMemory, decisionMemory: DecisionMemory) {
    // This is a simplified pattern update - in practice would be more sophisticated
    const patternType = this.classifyDecisionPattern(decisionMemory)
    
    let pattern = memory.decisions.patterns.find(p => p.patternType === patternType)
    if (!pattern) {
      pattern = {
        id: `pattern_${patternType}_${Date.now()}`,
        patternType,
        description: `${patternType} pattern`,
        frequency: 0,
        successRate: 0,
        avgPnL: 0,
        conditions: [],
        confidence: 0,
        examples: []
      }
      memory.decisions.patterns.push(pattern)
    }
    
    pattern.frequency++
    const wasSuccessful = decisionMemory.outcome.pnl > 0
    pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + (wasSuccessful ? 1 : 0)) / pattern.frequency
    pattern.avgPnL = (pattern.avgPnL * (pattern.frequency - 1) + decisionMemory.outcome.pnl) / pattern.frequency
    pattern.examples = [decisionMemory.id, ...pattern.examples.slice(0, 9)] // Keep last 10 examples
    pattern.confidence = Math.min(pattern.frequency / 10, 1) // Confidence builds with frequency
  }
  
  /**
   * Update success factors
   */
  private updateSuccessFactors(memory: AgentMemory, decisionMemory: DecisionMemory) {
    const factors = this.identifySuccessFactors(decisionMemory)
    
    for (const factorName of factors) {
      let factor = memory.decisions.successFactors.find(f => f.factor === factorName)
      if (!factor) {
        factor = {
          factor: factorName,
          importance: 0,
          description: `Success factor: ${factorName}`,
          frequency: 0,
          avgImpact: 0,
          examples: []
        }
        memory.decisions.successFactors.push(factor)
      }
      
      factor.frequency++
      factor.avgImpact = (factor.avgImpact * (factor.frequency - 1) + decisionMemory.outcome.pnl) / factor.frequency
      factor.importance = factor.frequency * factor.avgImpact / 1000 // Normalize importance
      factor.examples = [decisionMemory, ...factor.examples.slice(0, 4)] // Keep last 5 examples
    }
  }
  
  /**
   * Update failure reasons
   */
  private updateFailureReasons(memory: AgentMemory, decisionMemory: DecisionMemory) {
    const reasons = this.identifyFailureReasons(decisionMemory)
    
    for (const reasonText of reasons) {
      let reason = memory.decisions.failureReasons.find(r => r.reason === reasonText)
      if (!reason) {
        reason = {
          reason: reasonText,
          frequency: 0,
          avgLoss: 0,
          description: `Failure reason: ${reasonText}`,
          preventionStrategies: [],
          examples: []
        }
        memory.decisions.failureReasons.push(reason)
      }
      
      reason.frequency++
      reason.avgLoss = (reason.avgLoss * (reason.frequency - 1) + Math.abs(decisionMemory.outcome.pnl)) / reason.frequency
      reason.examples = [decisionMemory, ...reason.examples.slice(0, 4)] // Keep last 5 examples
      
      // Generate prevention strategies based on lessons
      reason.preventionStrategies = [...new Set([...reason.preventionStrategies, ...decisionMemory.lessons])]
    }
  }
  
  /**
   * Calculate learning progress score (0-1)
   */
  private calculateLearningProgress(memory: AgentMemory): number {
    const totalDecisions = memory.decisions.history.length
    const patterns = memory.decisions.patterns.length
    const adaptations = memory.strategyPerformance.adaptiveParameters.length
    
    // Score based on experience and adaptation
    let score = 0
    score += Math.min(totalDecisions / 100, 0.4) // Up to 40% for decision experience
    score += Math.min(patterns / 10, 0.3) // Up to 30% for pattern recognition
    score += Math.min(adaptations / 5, 0.3) // Up to 30% for adaptations
    
    return Math.min(score, 1)
  }
  
  /**
   * Calculate adaptation score (0-1)
   */
  private calculateAdaptationScore(memory: AgentMemory): number {
    const adaptations = memory.strategyPerformance.adaptiveParameters
    if (adaptations.length === 0) return 0
    
    const avgEffectiveness = adaptations
      .filter(a => a.effectiveness !== undefined)
      .reduce((sum, a) => sum + a.effectiveness, 0) / adaptations.length
    
    return Math.max(0, Math.min(1, avgEffectiveness))
  }
  
  /**
   * Generate recommendations based on memory analysis
   */
  private generateRecommendations(memory: AgentMemory, insights: LearningInsight[]): string[] {
    const recommendations: string[] = []
    
    // Based on win rate
    const winRate = memory.strategyPerformance.baselineMetrics.winRate
    if (winRate < 0.4) {
      recommendations.push('Consider strategy adjustment - low win rate detected')
    }
    
    // Based on adaptations
    const recentAdaptations = memory.strategyPerformance.adaptiveParameters.slice(-5)
    if (recentAdaptations.length > 3) {
      recommendations.push('Too many recent adaptations - allow time for stabilization')
    }
    
    // Based on insights
    const actionableInsights = insights.filter(i => i.actionable)
    recommendations.push(...actionableInsights.flatMap(i => i.recommendations))
    
    return [...new Set(recommendations)] // Remove duplicates
  }
  
  /**
   * Generate warnings based on memory analysis
   */
  private generateWarnings(memory: AgentMemory): string[] {
    const warnings: string[] = []
    
    // High drawdown warning
    if (memory.strategyPerformance.baselineMetrics.maxDrawdown > 0.15) {
      warnings.push('High drawdown detected - review risk management')
    }
    
    // Frequent failures warning
    const recentFailures = memory.decisions.history.slice(-20).filter(d => d.outcome.pnl < 0)
    if (recentFailures.length > 15) {
      warnings.push('High failure rate in recent decisions')
    }
    
    // No learning progress warning
    const learningProgress = this.calculateLearningProgress(memory)
    if (learningProgress < 0.1 && memory.decisions.history.length > 50) {
      warnings.push('Low learning progress despite experience')
    }
    
    return warnings
  }
  
  /**
   * Helper methods for pattern recognition
   */
  private classifyDecisionPattern(decisionMemory: DecisionMemory): 'timing' | 'symbol_selection' | 'position_sizing' | 'risk_management' {
    // Simplified classification logic
    if (decisionMemory.context.confidence > 0.8) return 'timing'
    if (decisionMemory.context.signalStrength > 0.7) return 'symbol_selection'
    if (decisionMemory.context.riskLevel === 'high') return 'risk_management'
    return 'position_sizing'
  }
  
  private identifySuccessFactors(decisionMemory: DecisionMemory): string[] {
    const factors: string[] = []
    
    if (decisionMemory.context.confidence > 0.8) factors.push('high_confidence')
    if (decisionMemory.context.signalStrength > 0.7) factors.push('strong_signals')
    if (decisionMemory.context.volatility < 0.02) factors.push('low_volatility')
    if (decisionMemory.outcome.slippage < 0.001) factors.push('good_execution')
    
    return factors
  }
  
  private identifyFailureReasons(decisionMemory: DecisionMemory): string[] {
    const reasons: string[] = []
    
    if (!decisionMemory.outcome.executionSuccess) reasons.push('execution_failure')
    if (decisionMemory.outcome.slippage > 0.005) reasons.push('high_slippage')
    if (decisionMemory.context.volatility > 0.03) reasons.push('high_volatility')
    if (decisionMemory.context.confidence < 0.5) reasons.push('low_confidence')
    
    return reasons
  }
  
  private recognizeTimingPatterns(memory: AgentMemory, decisions: DecisionMemory[]) {
    // Analyze timing patterns - simplified implementation
    const hourlyPerformance = new Map<number, { pnl: number, count: number }>()
    
    for (const decision of decisions) {
      const hour = decision.timestamp.getHours()
      const current = hourlyPerformance.get(hour) || { pnl: 0, count: 0 }
      current.pnl += decision.outcome.pnl
      current.count++
      hourlyPerformance.set(hour, current)
    }
    
    // Find best and worst hours
    const hourlyAvgs = Array.from(hourlyPerformance.entries())
      .map(([hour, data]) => ({ hour, avgPnL: data.pnl / data.count }))
      .sort((a, b) => b.avgPnL - a.avgPnL)
    
    if (hourlyAvgs.length > 0) {
      // Update daily performance patterns
      memory.performancePatterns.dailyPerformance = hourlyAvgs.map(h => ({
        timeRange: `${h.hour}:00-${h.hour + 1}:00`,
        avgPnL: h.avgPnL,
        winRate: 0.5, // Would calculate actual win rate
        tradeCount: hourlyPerformance.get(h.hour)?.count || 0,
        effectiveness: h.avgPnL > 0 ? 0.8 : 0.2,
        optimalConditions: []
      }))
    }
  }
  
  private recognizeSymbolPatterns(memory: AgentMemory, decisions: DecisionMemory[]) {
    // Group by symbol and analyze performance
    const symbolPerformance = new Map<string, { pnl: number, wins: number, total: number }>()
    
    for (const decision of decisions) {
      const symbol = decision.decision.decision.symbol || 'BTC/USD'
      const current = symbolPerformance.get(symbol) || { pnl: 0, wins: 0, total: 0 }
      current.pnl += decision.outcome.pnl
      current.total++
      if (decision.outcome.pnl > 0) current.wins++
      symbolPerformance.set(symbol, current)
    }
    
    // Update symbol preferences
    for (const [symbol, perf] of symbolPerformance.entries()) {
      memory.marketLearning.symbolPreferences.set(symbol, {
        symbol,
        winRate: perf.wins / perf.total,
        avgPnL: perf.pnl / perf.total,
        totalTrades: perf.total,
        volatilityPreference: 0.02, // Would calculate from actual data
        timeframeOptimal: ['5m', '15m'],
        bestConditions: [],
        avoidConditions: []
      })
    }
  }
  
  private recognizePositionSizingPatterns(memory: AgentMemory, decisions: DecisionMemory[]) {
    // Analyze position sizing effectiveness - simplified
    const sizeGroups = {
      small: decisions.filter(d => d.context.confidence < 0.6),
      medium: decisions.filter(d => d.context.confidence >= 0.6 && d.context.confidence < 0.8),
      large: decisions.filter(d => d.context.confidence >= 0.8)
    }
    
    for (const [size, group] of Object.entries(sizeGroups)) {
      if (group.length > 5) {
        const avgPnL = group.reduce((sum, d) => sum + d.outcome.pnl, 0) / group.length
        const winRate = group.filter(d => d.outcome.pnl > 0).length / group.length
        
        if (avgPnL < 0 || winRate < 0.4) {
          memory.riskLearning.positionSizingLessons.push({
            id: `sizing_lesson_${Date.now()}`,
            timestamp: new Date(),
            originalSize: size === 'small' ? 0.5 : size === 'medium' ? 1.0 : 1.5,
            optimalSize: avgPnL < 0 ? 0.5 : 1.0,
            pnlDifference: avgPnL,
            lesson: `${size} position sizing showing ${avgPnL < 0 ? 'losses' : 'suboptimal'} performance`,
            conditions: [`confidence_${size}`]
          })
        }
      }
    }
  }
  
  private recognizeRiskManagementPatterns(memory: AgentMemory, decisions: DecisionMemory[]) {
    // Analyze risk patterns by risk level
    const riskGroups = {
      low: decisions.filter(d => d.context.riskLevel === 'low'),
      medium: decisions.filter(d => d.context.riskLevel === 'medium'),
      high: decisions.filter(d => d.context.riskLevel === 'high')
    }
    
    for (const [riskLevel, group] of Object.entries(riskGroups)) {
      if (group.length > 3) {
        const avgPnL = group.reduce((sum, d) => sum + d.outcome.pnl, 0) / group.length
        const maxLoss = Math.min(...group.map(d => d.outcome.pnl))
        
        if (maxLoss < -1000) {
          memory.riskLearning.drawdownExperiences.push({
            id: `drawdown_${Date.now()}`,
            timestamp: new Date(),
            maxDrawdown: Math.abs(maxLoss) / 10000, // Normalize to percentage
            duration: 1, // Would calculate actual duration
            cause: `High ${riskLevel} risk decisions`,
            recovery: {
              time: 0,
              method: 'risk_reduction',
              effectiveness: 0
            },
            lessons: [`Reduce ${riskLevel} risk position sizing`, 'Implement stricter stop losses'],
            preventionStrategy: `Lower exposure for ${riskLevel} risk trades`
          })
        }
      }
    }
  }
  
  /**
   * Clean old memories to prevent memory bloat
   */
  private cleanOldMemories() {
    const cutoffDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) // 30 days
    
    for (const [agentId, memory] of this.agentMemories.entries()) {
      // Clean decision history
      memory.decisions.history = memory.decisions.history
        .filter(d => d.timestamp > cutoffDate)
        .slice(-500) // Keep max 500 decisions
      
      // Clean other time-based data
      memory.strategyPerformance.optimizationHistory = 
        memory.strategyPerformance.optimizationHistory
          .filter(o => o.timestamp > cutoffDate)
          .slice(-50)
      
      memory.lastUpdated = new Date()
    }
  }
  
  /**
   * Get agent memory
   */
  getAgentMemory(agentId: string): AgentMemory | undefined {
    return this.agentMemories.get(agentId)
  }
  
  /**
   * Get all agent memories
   */
  getAllAgentMemories(): Map<string, AgentMemory> {
    return new Map(this.agentMemories)
  }
  
  /**
   * Remove agent memory
   */
  removeAgentMemory(agentId: string): boolean {
    this.stopLearningSchedule(agentId)
    return this.agentMemories.delete(agentId)
  }
  
  /**
   * Export agent memory for backup
   */
  exportAgentMemory(agentId: string): string | null {
    const memory = this.agentMemories.get(agentId)
    if (!memory) return null
    
    return JSON.stringify(memory, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value)
      }
      return value
    }, 2)
  }
  
  /**
   * Import agent memory from backup
   */
  importAgentMemory(agentId: string, memoryData: string): boolean {
    try {
      const memory = JSON.parse(memoryData)
      
      // Restore Maps
      if (memory.marketLearning.symbolPreferences) {
        memory.marketLearning.symbolPreferences = new Map(
          Object.entries(memory.marketLearning.symbolPreferences)
        )
      }
      if (memory.marketLearning.timeframeEffectiveness) {
        memory.marketLearning.timeframeEffectiveness = new Map(
          Object.entries(memory.marketLearning.timeframeEffectiveness)
        )
      }
      
      this.agentMemories.set(agentId, memory)
      this.startLearningSchedule(agentId)
      
      return true
    } catch (error) {
      console.error(`Failed to import memory for agent ${agentId}:`, error)
      return false
    }
  }
}

// Lazy initialization to prevent circular dependencies
let _agentMemorySystemInstance: AgentMemorySystem | null = null

export const getAgentMemorySystem = (): AgentMemorySystem => {
  if (!_agentMemorySystemInstance) {
    _agentMemorySystemInstance = new AgentMemorySystem()
  }
  return _agentMemorySystemInstance
}

// Backward compatibility
export const agentMemorySystem = {
  get instance() {
    return getAgentMemorySystem()
  }
}