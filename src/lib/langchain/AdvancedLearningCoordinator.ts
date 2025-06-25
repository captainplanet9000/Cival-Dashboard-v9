/**
 * Advanced Learning Coordinator
 * Phase 8: Coordinates learning across multiple agents with shared knowledge and collective intelligence
 */

import { EventEmitter } from 'events'
import { agentMemorySystem, type LearningPattern, type StrategyEvolution } from './AgentMemorySystem'
import { langGraphOrchestrator } from './LangGraphOrchestrator'
import { langSmithIntegration } from './LangSmithIntegration'

export interface CollectiveLearning {
  id: string
  type: 'market_pattern' | 'risk_pattern' | 'strategy_pattern' | 'coordination_pattern'
  pattern: string
  contributingAgents: string[]
  confidence: number
  effectiveness: number
  validationCount: number
  timestamp: number
  sharedKnowledge: Record<string, any>
}

export interface AgentCollaboration {
  id: string
  participatingAgents: string[]
  collaborationType: 'knowledge_sharing' | 'strategy_consensus' | 'risk_assessment' | 'market_analysis'
  outcome: 'successful' | 'failed' | 'partial'
  performanceImprovement: number
  timestamp: number
  details: Record<string, any>
}

export interface LearningGoal {
  id: string
  agentId: string
  goalType: 'improve_accuracy' | 'reduce_risk' | 'increase_profit' | 'enhance_speed' | 'learn_pattern'
  target: number
  currentValue: number
  progress: number
  deadline: number
  strategies: string[]
  adaptations: string[]
}

export interface KnowledgeGraph {
  concepts: Map<string, ConceptNode>
  relationships: Map<string, RelationshipEdge>
}

interface ConceptNode {
  id: string
  concept: string
  importance: number
  agentAssociations: Set<string>
  relatedConcepts: Set<string>
  learningHistory: Array<{
    agentId: string
    timestamp: number
    confidence: number
    context: Record<string, any>
  }>
}

interface RelationshipEdge {
  id: string
  fromConcept: string
  toConcept: string
  relationshipType: 'causes' | 'correlates' | 'enables' | 'prevents' | 'similar_to'
  strength: number
  discoveredBy: string[]
  validatedBy: string[]
}

export class AdvancedLearningCoordinator extends EventEmitter {
  private collectiveLearnings: Map<string, CollectiveLearning> = new Map()
  private collaborations: Map<string, AgentCollaboration> = new Map()
  private learningGoals: Map<string, LearningGoal> = new Map()
  private knowledgeGraph: KnowledgeGraph = {
    concepts: new Map(),
    relationships: new Map()
  }
  private isInitialized: boolean = false
  private learningCycles: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.initialize()
  }

  /**
   * Initialize the learning coordinator
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🎓 Initializing Advanced Learning Coordinator')

      // Set up learning cycles
      this.learningCycles = setInterval(() => {
        this.performLearningCycle()
      }, 300000) // Every 5 minutes

      // Listen to memory system events
      agentMemorySystem.on('patternLearned', (data) => {
        this.processNewPattern(data)
      })

      agentMemorySystem.on('strategyEvolved', (data) => {
        this.processStrategyEvolution(data)
      })

      // Listen to orchestrator events
      langGraphOrchestrator.on('coordination:completed', (data) => {
        this.processCoordinationEvent(data)
      })

      this.isInitialized = true
      console.log('✅ Advanced Learning Coordinator initialized')

    } catch (error) {
      console.error('❌ Failed to initialize Advanced Learning Coordinator:', error)
      throw error
    }
  }

  /**
   * Create a learning goal for an agent
   */
  async createLearningGoal(
    agentId: string,
    goalType: LearningGoal['goalType'],
    target: number,
    deadline: number,
    strategies: string[] = []
  ): Promise<string> {
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const goal: LearningGoal = {
      id: goalId,
      agentId,
      goalType,
      target,
      currentValue: 0,
      progress: 0,
      deadline,
      strategies,
      adaptations: []
    }

    this.learningGoals.set(goalId, goal)

    // Store in agent memory
    await agentMemorySystem.storeMemory(
      agentId,
      'decision',
      `Learning goal created: ${goalType} target ${target}`,
      {
        goalId,
        goalType,
        target,
        deadline
      },
      0.7,
      ['learning_goal', goalType]
    )

    this.emit('learningGoalCreated', { agentId, goalId, goal })
    return goalId
  }

  /**
   * Update learning goal progress
   */
  async updateLearningGoal(goalId: string, currentValue: number): Promise<void> {
    const goal = this.learningGoals.get(goalId)
    if (!goal) return

    goal.currentValue = currentValue
    goal.progress = Math.min(100, (currentValue / goal.target) * 100)

    // Check if goal is achieved
    if (goal.progress >= 100) {
      await this.achieveLearningGoal(goalId)
    }

    this.emit('learningGoalUpdated', { goalId, progress: goal.progress })
  }

  /**
   * Achieve a learning goal
   */
  private async achieveLearningGoal(goalId: string): Promise<void> {
    const goal = this.learningGoals.get(goalId)
    if (!goal) return

    // Record achievement in memory
    await agentMemorySystem.storeMemory(
      goal.agentId,
      'outcome',
      `Learning goal achieved: ${goal.goalType}`,
      {
        goalId,
        target: goal.target,
        actualValue: goal.currentValue,
        strategies: goal.strategies,
        adaptations: goal.adaptations
      },
      0.9,
      ['achievement', 'learning_goal', goal.goalType]
    )

    // Share successful strategies with other agents
    await this.shareSuccessfulStrategy(goal)

    this.emit('learningGoalAchieved', { goalId, goal })
  }

  /**
   * Share successful strategy with other agents
   */
  private async shareSuccessfulStrategy(goal: LearningGoal): Promise<void> {
    try {
      // Create collective learning entry
      const collectiveId = `collective_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const collectiveLearning: CollectiveLearning = {
        id: collectiveId,
        type: 'strategy_pattern',
        pattern: `Successful ${goal.goalType} improvement strategy`,
        contributingAgents: [goal.agentId],
        confidence: 0.8,
        effectiveness: goal.progress / 100,
        validationCount: 1,
        timestamp: Date.now(),
        sharedKnowledge: {
          goalType: goal.goalType,
          strategies: goal.strategies,
          adaptations: goal.adaptations,
          targetAchieved: goal.target,
          timeToAchievement: Date.now() - goal.deadline
        }
      }

      this.collectiveLearnings.set(collectiveId, collectiveLearning)
      this.emit('knowledgeShared', { collectiveId, pattern: collectiveLearning.pattern })

    } catch (error) {
      console.error('Failed to share successful strategy:', error)
    }
  }

  /**
   * Facilitate agent collaboration
   */
  async facilitateCollaboration(
    agentIds: string[],
    collaborationType: AgentCollaboration['collaborationType'],
    context: Record<string, any> = {}
  ): Promise<string> {
    const collaborationId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Get relevant knowledge from each agent
      const agentKnowledge = await Promise.all(
        agentIds.map(async (agentId) => {
          const memories = await agentMemorySystem.retrieveMemories(agentId, undefined, undefined, 5)
          const patterns = agentMemorySystem.getLearningPatterns(agentId)
          return { agentId, memories, patterns }
        })
      )

      // Synthesize knowledge
      const synthesizedKnowledge = this.synthesizeKnowledge(agentKnowledge, collaborationType)

      // Create collaboration record
      const collaboration: AgentCollaboration = {
        id: collaborationId,
        participatingAgents: agentIds,
        collaborationType,
        outcome: 'successful', // Will be updated based on results
        performanceImprovement: 0, // Will be calculated
        timestamp: Date.now(),
        details: {
          context,
          synthesizedKnowledge,
          agentContributions: agentKnowledge.length
        }
      }

      this.collaborations.set(collaborationId, collaboration)

      // Store collaboration memory in each agent
      for (const agentId of agentIds) {
        await agentMemorySystem.storeMemory(
          agentId,
          'interaction',
          `Collaborated on ${collaborationType}`,
          {
            collaborationId,
            otherAgents: agentIds.filter(id => id !== agentId),
            synthesizedKnowledge
          },
          0.6,
          ['collaboration', collaborationType]
        )
      }

      this.emit('collaborationStarted', { collaborationId, agentIds, collaborationType })
      return collaborationId

    } catch (error) {
      console.error('Failed to facilitate collaboration:', error)
      throw error
    }
  }

  /**
   * Synthesize knowledge from multiple agents
   */
  private synthesizeKnowledge(
    agentKnowledge: Array<{
      agentId: string
      memories: any[]
      patterns: any[]
    }>,
    collaborationType: string
  ): Record<string, any> {
    const synthesis: Record<string, any> = {
      commonPatterns: [],
      uniqueInsights: [],
      consensusViews: [],
      conflictingViews: [],
      recommendedActions: []
    }

    // Find common patterns across agents
    const allPatterns = agentKnowledge.flatMap(ak => ak.patterns)
    const patternCounts = new Map<string, number>()
    
    allPatterns.forEach(pattern => {
      const key = pattern.pattern
      patternCounts.set(key, (patternCounts.get(key) || 0) + 1)
    })

    // Common patterns (seen by multiple agents)
    synthesis.commonPatterns = Array.from(patternCounts.entries())
      .filter(([pattern, count]) => count > 1)
      .map(([pattern, count]) => ({ pattern, agentCount: count }))

    // Unique insights (patterns seen by only one agent)
    synthesis.uniqueInsights = Array.from(patternCounts.entries())
      .filter(([pattern, count]) => count === 1)
      .map(([pattern]) => ({ pattern, needsValidation: true }))

    // Generate consensus recommendations
    if (collaborationType === 'strategy_consensus') {
      synthesis.recommendedActions = this.generateStrategicConsensus(agentKnowledge)
    } else if (collaborationType === 'risk_assessment') {
      synthesis.recommendedActions = this.generateRiskConsensus(agentKnowledge)
    }

    return synthesis
  }

  /**
   * Generate strategic consensus from agent knowledge
   */
  private generateStrategicConsensus(agentKnowledge: any[]): string[] {
    const recommendations: string[] = []
    
    // Simple consensus logic
    const riskPatterns = agentKnowledge.flatMap(ak => 
      ak.patterns.filter((p: any) => p.type === 'risk_pattern')
    )
    
    if (riskPatterns.length > agentKnowledge.length * 0.5) {
      recommendations.push('Increase risk management measures')
    }

    const successPatterns = agentKnowledge.flatMap(ak => 
      ak.patterns.filter((p: any) => p.type === 'success_pattern')
    )
    
    if (successPatterns.length > 0) {
      recommendations.push('Replicate successful trading patterns')
    }

    return recommendations
  }

  /**
   * Generate risk consensus from agent knowledge
   */
  private generateRiskConsensus(agentKnowledge: any[]): string[] {
    const recommendations: string[] = []
    
    // Analyze risk-related memories
    const riskMemories = agentKnowledge.flatMap(ak => 
      ak.memories.filter((m: any) => m.tags.includes('risk') || m.tags.includes('failure'))
    )
    
    if (riskMemories.length > 2) {
      recommendations.push('Consider reducing position sizes')
      recommendations.push('Implement additional risk checks')
    }

    return recommendations
  }

  /**
   * Update knowledge graph with new concept
   */
  async updateKnowledgeGraph(
    concept: string,
    agentId: string,
    confidence: number,
    context: Record<string, any>
  ): Promise<void> {
    let conceptNode = this.knowledgeGraph.concepts.get(concept)
    
    if (!conceptNode) {
      conceptNode = {
        id: concept,
        concept,
        importance: 0.1,
        agentAssociations: new Set(),
        relatedConcepts: new Set(),
        learningHistory: []
      }
      this.knowledgeGraph.concepts.set(concept, conceptNode)
    }

    // Update concept
    conceptNode.agentAssociations.add(agentId)
    conceptNode.importance = Math.min(1.0, conceptNode.importance + 0.1)
    conceptNode.learningHistory.push({
      agentId,
      timestamp: Date.now(),
      confidence,
      context
    })

    this.emit('knowledgeGraphUpdated', { concept, agentId })
  }

  /**
   * Find related concepts in knowledge graph
   */
  findRelatedConcepts(concept: string, maxResults: number = 5): string[] {
    const conceptNode = this.knowledgeGraph.concepts.get(concept)
    if (!conceptNode) return []

    return Array.from(conceptNode.relatedConcepts).slice(0, maxResults)
  }

  /**
   * Process new learning pattern
   */
  private async processNewPattern(data: any): Promise<void> {
    try {
      const { agentId, patternId, type } = data
      
      // Check if this pattern should be shared with other agents
      const pattern = agentMemorySystem.getLearningPatterns(agentId, type, 0.1)[0]
      if (!pattern) return

      // If it's a high-confidence pattern, share it
      if (pattern.confidence > 0.7) {
        const collectiveId = `collective_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const collectiveLearning: CollectiveLearning = {
          id: collectiveId,
          type: type as any,
          pattern: pattern.pattern,
          contributingAgents: [agentId],
          confidence: pattern.confidence,
          effectiveness: pattern.effectiveness,
          validationCount: 1,
          timestamp: Date.now(),
          sharedKnowledge: pattern.conditions
        }

        this.collectiveLearnings.set(collectiveId, collectiveLearning)
        this.emit('patternShared', { collectiveId, agentId, pattern: pattern.pattern })
      }

    } catch (error) {
      console.error('Failed to process new pattern:', error)
    }
  }

  /**
   * Process strategy evolution
   */
  private async processStrategyEvolution(data: any): Promise<void> {
    try {
      const { agentId, evolutionId, evolution } = data
      
      // Update knowledge graph with strategy concepts
      await this.updateKnowledgeGraph(
        'strategy_evolution',
        agentId,
        0.8,
        {
          evolutionId,
          reason: evolution.evolutionReason,
          originalStrategy: evolution.originalStrategy,
          evolvedStrategy: evolution.evolvedStrategy
        }
      )

    } catch (error) {
      console.error('Failed to process strategy evolution:', error)
    }
  }

  /**
   * Process coordination event
   */
  private async processCoordinationEvent(data: any): Promise<void> {
    try {
      // Learn from successful coordination
      if (data.executedTrades > 0) {
        const participatingAgents = Object.keys(data.agentDecisions || {})
        
        if (participatingAgents.length > 1) {
          await this.facilitateCollaboration(
            participatingAgents,
            'strategy_consensus',
            {
              executedTrades: data.executedTrades,
              marketConditions: data.marketConditions
            }
          )
        }
      }

    } catch (error) {
      console.error('Failed to process coordination event:', error)
    }
  }

  /**
   * Perform periodic learning cycle
   */
  private async performLearningCycle(): Promise<void> {
    try {
      console.log('🎓 Performing learning cycle')

      // Update learning goal progress
      await this.updateLearningGoalProgress()

      // Validate collective learnings
      await this.validateCollectiveLearnings()

      // Suggest new collaborations
      await this.suggestCollaborations()

      this.emit('learningCycleCompleted', {
        totalGoals: this.learningGoals.size,
        collectiveLearnings: this.collectiveLearnings.size,
        collaborations: this.collaborations.size
      })

    } catch (error) {
      console.error('Failed to perform learning cycle:', error)
    }
  }

  /**
   * Update learning goal progress
   */
  private async updateLearningGoalProgress(): Promise<void> {
    for (const goal of this.learningGoals.values()) {
      // Get agent's recent performance
      const agentMetrics = langSmithIntegration.getAgentAnalytics(goal.agentId)
      
      if (agentMetrics.metrics) {
        let currentValue = 0
        
        switch (goal.goalType) {
          case 'improve_accuracy':
            currentValue = agentMetrics.metrics.successRate * 100
            break
          case 'reduce_risk':
            currentValue = 100 - agentMetrics.metrics.errorRate * 100
            break
          case 'enhance_speed':
            currentValue = Math.max(0, 100 - agentMetrics.metrics.avgLatency / 100)
            break
        }

        await this.updateLearningGoal(goal.id, currentValue)
      }
    }
  }

  /**
   * Validate collective learnings
   */
  private async validateCollectiveLearnings(): Promise<void> {
    for (const learning of this.collectiveLearnings.values()) {
      // Increase validation count if it's been successful
      if (learning.effectiveness > 0.7) {
        learning.validationCount++
        learning.confidence = Math.min(1.0, learning.confidence + 0.05)
      }
    }
  }

  /**
   * Suggest new collaborations
   */
  private async suggestCollaborations(): Promise<void> {
    // Find agents with complementary patterns
    const allAgents = Array.from(new Set(
      Array.from(this.learningGoals.values()).map(g => g.agentId)
    ))

    if (allAgents.length >= 2) {
      // Suggest risk assessment collaboration
      await this.facilitateCollaboration(
        allAgents.slice(0, 3),
        'risk_assessment',
        { periodic: true }
      )
    }
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    totalGoals: number
    activeGoals: number
    achievedGoals: number
    collectiveLearnings: number
    collaborations: number
    knowledgeGraphSize: number
  } {
    const activeGoals = Array.from(this.learningGoals.values()).filter(g => g.progress < 100).length
    const achievedGoals = Array.from(this.learningGoals.values()).filter(g => g.progress >= 100).length

    return {
      totalGoals: this.learningGoals.size,
      activeGoals,
      achievedGoals,
      collectiveLearnings: this.collectiveLearnings.size,
      collaborations: this.collaborations.size,
      knowledgeGraphSize: this.knowledgeGraph.concepts.size
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    isInitialized: boolean
    learningGoals: number
    collectiveLearnings: number
    errors: string[]
  }> {
    const errors: string[] = []

    if (!this.isInitialized) {
      errors.push('Not initialized')
    }

    const status = errors.length === 0 ? 'healthy' :
                   errors.length === 1 ? 'degraded' : 'unhealthy'

    return {
      status,
      isInitialized: this.isInitialized,
      learningGoals: this.learningGoals.size,
      collectiveLearnings: this.collectiveLearnings.size,
      errors
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.learningCycles) {
      clearInterval(this.learningCycles)
      this.learningCycles = null
    }

    this.collectiveLearnings.clear()
    this.collaborations.clear()
    this.learningGoals.clear()
    this.knowledgeGraph.concepts.clear()
    this.knowledgeGraph.relationships.clear()
    this.removeAllListeners()
  }
}

// Export singleton instance
export const advancedLearningCoordinator = new AdvancedLearningCoordinator()