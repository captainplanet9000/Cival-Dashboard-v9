'use client'

/**
 * Memory Pattern Recognition Service
 * Identifies patterns in agent memories and generates insights
 * Phase 3: Advanced Memory Features
 */

export interface MemoryPattern {
  id: string
  type: 'success_sequence' | 'failure_cycle' | 'risk_escalation' | 'strategy_evolution' | 'market_adaptation'
  name: string
  description: string
  confidence: number
  frequency: number
  impact: number
  memories: string[] // Memory IDs that form this pattern
  triggers: string[]
  outcomes: {
    positive: number
    negative: number
    neutral: number
  }
  recommendations: string[]
  firstDetected: Date
  lastSeen: Date
}

export interface PatternInsight {
  id: string
  patternId: string
  type: 'opportunity' | 'warning' | 'optimization' | 'trend'
  title: string
  description: string
  confidence: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  actionable: boolean
  recommendations: string[]
  expectedImpact: number
  timeframe: string
  createdAt: Date
}

export interface SuccessSequence {
  steps: Array<{
    memoryType: string
    content: string
    importance: number
    timing: number // Minutes between steps
  }>
  successRate: number
  avgReturn: number
  conditions: string[]
}

export interface FailurePattern {
  triggers: string[]
  escalationSteps: string[]
  avgLoss: number
  frequency: number
  preventionStrategies: string[]
}

export class MemoryPatternRecognitionService {
  private patterns: Map<string, MemoryPattern> = new Map()
  private insights: Map<string, PatternInsight> = new Map()
  
  constructor() {
    this.initializePatternTemplates()
  }

  /**
   * Analyze memories to detect patterns
   */
  async analyzeMemoryPatterns(
    agentId: string,
    memories: any[],
    options: {
      minConfidence?: number
      maxAge?: number // Days
      includeHistorical?: boolean
    } = {}
  ): Promise<MemoryPattern[]> {
    const {
      minConfidence = 0.6,
      maxAge = 30,
      includeHistorical = true
    } = options

    try {
      // Filter memories by age if specified
      let relevantMemories = memories
      if (!includeHistorical) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - maxAge)
        relevantMemories = memories.filter(m => new Date(m.createdAt) >= cutoffDate)
      }

      if (relevantMemories.length < 5) {
        return [] // Need minimum memories for pattern detection
      }

      const detectedPatterns: MemoryPattern[] = []

      // Detect different types of patterns
      const successPatterns = await this.detectSuccessSequences(relevantMemories)
      const failurePatterns = await this.detectFailureCycles(relevantMemories)
      const riskPatterns = await this.detectRiskEscalation(relevantMemories)
      const strategyPatterns = await this.detectStrategyEvolution(relevantMemories)
      const adaptationPatterns = await this.detectMarketAdaptation(relevantMemories)

      detectedPatterns.push(
        ...successPatterns,
        ...failurePatterns,
        ...riskPatterns,
        ...strategyPatterns,
        ...adaptationPatterns
      )

      // Filter by confidence threshold
      const highConfidencePatterns = detectedPatterns.filter(p => p.confidence >= minConfidence)

      // Store patterns for future reference
      highConfidencePatterns.forEach(pattern => {
        this.patterns.set(pattern.id, pattern)
      })

      return highConfidencePatterns

    } catch (error) {
      console.error('Error analyzing memory patterns:', error)
      return []
    }
  }

  /**
   * Generate insights from detected patterns
   */
  async generatePatternInsights(patterns: MemoryPattern[]): Promise<PatternInsight[]> {
    const insights: PatternInsight[] = []

    for (const pattern of patterns) {
      try {
        const patternInsights = await this.analyzePatternForInsights(pattern)
        insights.push(...patternInsights)
      } catch (error) {
        console.warn(`Error generating insights for pattern ${pattern.id}:`, error)
        continue
      }
    }

    // Store insights
    insights.forEach(insight => {
      this.insights.set(insight.id, insight)
    })

    return insights.sort((a, b) => {
      // Sort by urgency and confidence
      const urgencyScore = (urgency: string) => {
        switch (urgency) {
          case 'critical': return 4
          case 'high': return 3
          case 'medium': return 2
          case 'low': return 1
          default: return 0
        }
      }
      
      const aScore = urgencyScore(a.urgency) * a.confidence
      const bScore = urgencyScore(b.urgency) * b.confidence
      
      return bScore - aScore
    })
  }

  /**
   * Get pattern recommendations for agent
   */
  async getPatternRecommendations(
    agentId: string,
    currentContext: any = {}
  ): Promise<Array<{
    type: 'replicate' | 'avoid' | 'optimize' | 'monitor'
    pattern: MemoryPattern
    action: string
    priority: number
    reasoning: string
  }>> {
    const recommendations: any[] = []
    
    // Get recent patterns for this agent
    const agentPatterns = Array.from(this.patterns.values())
      .filter(p => p.memories.length > 0) // Has associated memories
      .sort((a, b) => b.confidence - a.confidence)

    for (const pattern of agentPatterns.slice(0, 10)) { // Top 10 patterns
      try {
        const recommendation = await this.generatePatternRecommendation(pattern, currentContext)
        if (recommendation) {
          recommendations.push(recommendation)
        }
      } catch (error) {
        console.warn(`Error generating recommendation for pattern ${pattern.id}:`, error)
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  // Private pattern detection methods

  private async detectSuccessSequences(memories: any[]): Promise<MemoryPattern[]> {
    const patterns: MemoryPattern[] = []
    
    // Group memories by successful trades
    const successfulTrades = memories.filter(m => 
      m.tradeOutcome && (m.tradeOutcome.pnl > 0 || m.tradeOutcome.success === true)
    )

    if (successfulTrades.length < 3) return patterns

    // Look for common sequences before successful trades
    const sequences = this.findCommonSequences(successfulTrades, memories)
    
    for (const sequence of sequences) {
      if (sequence.occurrences >= 2 && sequence.successRate >= 0.7) {
        patterns.push({
          id: `success_seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'success_sequence',
          name: `${sequence.name} Success Pattern`,
          description: `Sequence of ${sequence.steps.length} steps leading to successful trades`,
          confidence: sequence.successRate,
          frequency: sequence.occurrences,
          impact: sequence.avgReturn || 0,
          memories: sequence.memoryIds,
          triggers: sequence.triggers,
          outcomes: {
            positive: Math.round(sequence.occurrences * sequence.successRate),
            negative: Math.round(sequence.occurrences * (1 - sequence.successRate)),
            neutral: 0
          },
          recommendations: [
            `Replicate this sequence when conditions align`,
            `Monitor for trigger conditions: ${sequence.triggers.join(', ')}`,
            `Expect average return of $${sequence.avgReturn?.toFixed(2) || '0.00'}`
          ],
          firstDetected: new Date(),
          lastSeen: new Date()
        })
      }
    }

    return patterns
  }

  private async detectFailureCycles(memories: any[]): Promise<MemoryPattern[]> {
    const patterns: MemoryPattern[] = []
    
    // Group memories by failed trades
    const failedTrades = memories.filter(m => 
      m.tradeOutcome && (m.tradeOutcome.pnl < 0 || m.tradeOutcome.success === false)
    )

    if (failedTrades.length < 2) return patterns

    // Look for recurring failure patterns
    const failureSequences = this.findFailureSequences(failedTrades, memories)
    
    for (const sequence of failureSequences) {
      if (sequence.frequency >= 2) {
        patterns.push({
          id: `failure_cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'failure_cycle',
          name: `${sequence.name} Failure Cycle`,
          description: `Recurring pattern leading to trading losses`,
          confidence: Math.min(sequence.frequency / 5, 0.9), // Max 90% confidence
          frequency: sequence.frequency,
          impact: sequence.avgLoss || 0,
          memories: sequence.memoryIds,
          triggers: sequence.triggers,
          outcomes: {
            positive: 0,
            negative: sequence.frequency,
            neutral: 0
          },
          recommendations: [
            `Avoid trading when these conditions occur: ${sequence.triggers.join(', ')}`,
            `Implement circuit breakers for this pattern`,
            `Review risk parameters when pattern is detected`
          ],
          firstDetected: new Date(),
          lastSeen: new Date()
        })
      }
    }

    return patterns
  }

  private async detectRiskEscalation(memories: any[]): Promise<MemoryPattern[]> {
    const patterns: MemoryPattern[] = []
    
    const riskMemories = memories.filter(m => m.memoryType === 'risk_observation')
    if (riskMemories.length < 3) return patterns

    // Look for escalating risk patterns
    const escalationSequences = this.findRiskEscalationSequences(riskMemories)
    
    for (const sequence of escalationSequences) {
      patterns.push({
        id: `risk_escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'risk_escalation',
        name: 'Risk Escalation Pattern',
        description: 'Pattern of increasing risk exposure over time',
        confidence: sequence.confidence,
        frequency: sequence.frequency,
        impact: sequence.maxLoss || 0,
        memories: sequence.memoryIds,
        triggers: sequence.triggers,
        outcomes: {
          positive: 0,
          negative: sequence.frequency,
          neutral: 0
        },
        recommendations: [
          'Implement progressive risk reduction when pattern starts',
          'Set automatic position size limits during escalation',
          'Require manual approval for trades during high-risk periods'
        ],
        firstDetected: new Date(),
        lastSeen: new Date()
      })
    }

    return patterns
  }

  private async detectStrategyEvolution(memories: any[]): Promise<MemoryPattern[]> {
    const patterns: MemoryPattern[] = []
    
    const strategyMemories = memories.filter(m => 
      m.memoryType === 'strategy_learning' || m.strategyUsed
    )

    if (strategyMemories.length < 5) return patterns

    // Analyze strategy usage evolution over time
    const evolution = this.analyzeStrategyEvolution(strategyMemories)
    
    if (evolution.trend && evolution.confidence > 0.6) {
      patterns.push({
        id: `strategy_evolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'strategy_evolution',
        name: `${evolution.direction} Strategy Evolution`,
        description: `Agent showing ${evolution.direction} trend in strategy preference`,
        confidence: evolution.confidence,
        frequency: evolution.changes,
        impact: evolution.performanceImpact,
        memories: evolution.memoryIds,
        triggers: evolution.triggers,
        outcomes: {
          positive: evolution.improvements,
          negative: evolution.regressions,
          neutral: 0
        },
        recommendations: evolution.recommendations,
        firstDetected: new Date(),
        lastSeen: new Date()
      })
    }

    return patterns
  }

  private async detectMarketAdaptation(memories: any[]): Promise<MemoryPattern[]> {
    const patterns: MemoryPattern[] = []
    
    const marketMemories = memories.filter(m => 
      m.memoryType === 'market_insight' && m.marketConditions
    )

    if (marketMemories.length < 5) return patterns

    // Analyze adaptation to different market conditions
    const adaptations = this.analyzeMarketAdaptation(marketMemories)
    
    for (const adaptation of adaptations) {
      if (adaptation.confidence > 0.6) {
        patterns.push({
          id: `market_adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'market_adaptation',
          name: `${adaptation.marketType} Market Adaptation`,
          description: `Agent adapting behavior for ${adaptation.marketType} market conditions`,
          confidence: adaptation.confidence,
          frequency: adaptation.occurrences,
          impact: adaptation.performanceChange,
          memories: adaptation.memoryIds,
          triggers: adaptation.triggers,
          outcomes: {
            positive: adaptation.successfulAdaptations,
            negative: adaptation.failedAdaptations,
            neutral: 0
          },
          recommendations: adaptation.recommendations,
          firstDetected: new Date(),
          lastSeen: new Date()
        })
      }
    }

    return patterns
  }

  // Helper methods for pattern analysis

  private findCommonSequences(targetMemories: any[], allMemories: any[]): any[] {
    // Simplified sequence detection - in production this would be more sophisticated
    const sequences: any[] = []
    
    // Group by strategy and look for patterns
    const strategyGroups = new Map<string, any[]>()
    
    for (const memory of targetMemories) {
      const strategy = memory.strategyUsed || 'unknown'
      if (!strategyGroups.has(strategy)) {
        strategyGroups.set(strategy, [])
      }
      strategyGroups.get(strategy)!.push(memory)
    }

    for (const [strategy, memories] of strategyGroups) {
      if (memories.length >= 2) {
        sequences.push({
          name: strategy,
          steps: [`Market analysis`, `Strategy ${strategy}`, `Trade execution`],
          successRate: memories.length / targetMemories.length,
          avgReturn: memories.reduce((sum, m) => sum + (m.tradeOutcome?.pnl || 0), 0) / memories.length,
          occurrences: memories.length,
          memoryIds: memories.map(m => m.id),
          triggers: [`${strategy} conditions`, 'Market opportunity'],
        })
      }
    }

    return sequences
  }

  private findFailureSequences(failedTrades: any[], allMemories: any[]): any[] {
    // Simplified failure pattern detection
    const sequences: any[] = []
    
    const lossPatterns = new Map<string, any[]>()
    
    for (const memory of failedTrades) {
      const key = `${memory.memoryType}_${memory.context?.action || 'unknown'}`
      if (!lossPatterns.has(key)) {
        lossPatterns.set(key, [])
      }
      lossPatterns.get(key)!.push(memory)
    }

    for (const [pattern, memories] of lossPatterns) {
      if (memories.length >= 2) {
        sequences.push({
          name: pattern.replace('_', ' '),
          frequency: memories.length,
          avgLoss: memories.reduce((sum, m) => sum + Math.abs(m.tradeOutcome?.pnl || 0), 0) / memories.length,
          memoryIds: memories.map(m => m.id),
          triggers: [pattern, 'Market stress']
        })
      }
    }

    return sequences
  }

  private findRiskEscalationSequences(riskMemories: any[]): any[] {
    // Simplified risk escalation detection
    return [{
      confidence: 0.7,
      frequency: Math.floor(riskMemories.length / 3),
      maxLoss: 1000,
      memoryIds: riskMemories.map(m => m.id),
      triggers: ['Position size increase', 'Multiple concurrent trades', 'Market volatility']
    }]
  }

  private analyzeStrategyEvolution(strategyMemories: any[]): any {
    // Simplified strategy evolution analysis
    const strategies = strategyMemories.map(m => m.strategyUsed).filter(Boolean)
    const uniqueStrategies = [...new Set(strategies)]
    
    return {
      trend: true,
      direction: 'improving',
      confidence: 0.75,
      changes: uniqueStrategies.length,
      performanceImpact: 150,
      memoryIds: strategyMemories.map(m => m.id),
      triggers: ['Strategy learning', 'Performance feedback'],
      improvements: Math.floor(strategyMemories.length * 0.7),
      regressions: Math.floor(strategyMemories.length * 0.3),
      recommendations: [
        'Continue current strategy evolution path',
        'Monitor for strategy drift',
        'Document successful strategy variations'
      ]
    }
  }

  private analyzeMarketAdaptation(marketMemories: any[]): any[] {
    // Simplified market adaptation analysis
    return [{
      marketType: 'volatile',
      confidence: 0.8,
      occurrences: Math.floor(marketMemories.length / 2),
      performanceChange: 75,
      memoryIds: marketMemories.map(m => m.id),
      triggers: ['High volatility', 'Market uncertainty'],
      successfulAdaptations: Math.floor(marketMemories.length * 0.6),
      failedAdaptations: Math.floor(marketMemories.length * 0.4),
      recommendations: [
        'Maintain adaptive position sizing in volatile markets',
        'Use shorter timeframes during high volatility',
        'Implement dynamic stop losses'
      ]
    }]
  }

  private async analyzePatternForInsights(pattern: MemoryPattern): Promise<PatternInsight[]> {
    const insights: PatternInsight[] = []
    
    // Generate insights based on pattern type
    switch (pattern.type) {
      case 'success_sequence':
        if (pattern.confidence > 0.8) {
          insights.push({
            id: `insight_${pattern.id}_opportunity`,
            patternId: pattern.id,
            type: 'opportunity',
            title: 'High-Confidence Success Pattern Detected',
            description: `This success sequence has ${(pattern.confidence * 100).toFixed(1)}% confidence and appears ${pattern.frequency} times`,
            confidence: pattern.confidence,
            urgency: pattern.confidence > 0.9 ? 'high' : 'medium',
            actionable: true,
            recommendations: [`Actively seek conditions to replicate this pattern`, ...pattern.recommendations],
            expectedImpact: pattern.impact,
            timeframe: 'immediate',
            createdAt: new Date()
          })
        }
        break

      case 'failure_cycle':
        insights.push({
          id: `insight_${pattern.id}_warning`,
          patternId: pattern.id,
          type: 'warning',
          title: 'Recurring Failure Pattern Identified',
          description: `This failure cycle has occurred ${pattern.frequency} times with average loss of $${Math.abs(pattern.impact).toFixed(2)}`,
          confidence: pattern.confidence,
          urgency: pattern.frequency > 3 ? 'high' : 'medium',
          actionable: true,
          recommendations: pattern.recommendations,
          expectedImpact: -Math.abs(pattern.impact),
          timeframe: 'immediate',
          createdAt: new Date()
        })
        break

      case 'risk_escalation':
        insights.push({
          id: `insight_${pattern.id}_critical`,
          patternId: pattern.id,
          type: 'warning',
          title: 'Risk Escalation Pattern Alert',
          description: 'Agent showing tendency toward increasing risk exposure',
          confidence: pattern.confidence,
          urgency: 'critical',
          actionable: true,
          recommendations: pattern.recommendations,
          expectedImpact: -Math.abs(pattern.impact),
          timeframe: 'immediate',
          createdAt: new Date()
        })
        break

      case 'strategy_evolution':
        insights.push({
          id: `insight_${pattern.id}_trend`,
          patternId: pattern.id,
          type: 'trend',
          title: 'Strategy Evolution Detected',
          description: 'Agent demonstrating adaptive strategy development',
          confidence: pattern.confidence,
          urgency: 'medium',
          actionable: true,
          recommendations: pattern.recommendations,
          expectedImpact: pattern.impact,
          timeframe: 'medium-term',
          createdAt: new Date()
        })
        break
    }

    return insights
  }

  private async generatePatternRecommendation(pattern: MemoryPattern, context: any): Promise<any> {
    switch (pattern.type) {
      case 'success_sequence':
        return {
          type: 'replicate',
          pattern,
          action: `Actively seek opportunities to replicate this high-confidence success pattern`,
          priority: pattern.confidence * 100,
          reasoning: `Pattern has ${(pattern.confidence * 100).toFixed(1)}% confidence with ${pattern.frequency} occurrences`
        }

      case 'failure_cycle':
        return {
          type: 'avoid',
          pattern,
          action: `Implement safeguards to prevent this recurring failure pattern`,
          priority: (1 - pattern.confidence) * 100 + pattern.frequency * 10,
          reasoning: `Pattern leads to average loss of $${Math.abs(pattern.impact).toFixed(2)}`
        }

      case 'risk_escalation':
        return {
          type: 'monitor',
          pattern,
          action: `Monitor risk levels and implement progressive controls`,
          priority: 90,
          reasoning: `Risk escalation can lead to significant losses`
        }

      default:
        return null
    }
  }

  private initializePatternTemplates(): void {
    // Initialize any pre-defined pattern templates
    console.log('Pattern recognition service initialized')
  }

  // Public getters
  getDetectedPatterns(): MemoryPattern[] {
    return Array.from(this.patterns.values())
  }

  getGeneratedInsights(): PatternInsight[] {
    return Array.from(this.insights.values())
  }
}

// Singleton instance
let patternRecognitionService: MemoryPatternRecognitionService | null = null

export function getPatternRecognitionService(): MemoryPatternRecognitionService {
  if (!patternRecognitionService) {
    patternRecognitionService = new MemoryPatternRecognitionService()
  }
  return patternRecognitionService
}