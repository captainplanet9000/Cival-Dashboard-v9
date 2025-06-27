/**
 * Agent Memory System
 * Phase 8: Advanced memory, learning, and strategy evolution for LangChain agents
 */

import { EventEmitter } from 'events'
import { langSmithIntegration } from './LangSmithIntegration'

export interface MemoryEntry {
  id: string
  agentId: string
  type: 'decision' | 'outcome' | 'market_condition' | 'strategy_adjustment' | 'interaction'
  content: string
  context: Record<string, any>
  timestamp: number
  importance: number // 0-1 scale
  retrieved: number // How many times this memory has been retrieved
  lastAccessed: number
  tags: string[]
  embedding?: number[] // Vector embedding for semantic search
}

export interface AgentPersonality {
  agentId: string
  riskTolerance: number // 0-1 scale
  learningRate: number // How quickly agent adapts
  memoryRetention: number // How long memories are kept
  decisionStyle: 'conservative' | 'aggressive' | 'adaptive'
  specializations: string[]
  communicationStyle: 'technical' | 'casual' | 'formal'
  lastUpdated: number
}

export interface LearningPattern {
  patternId: string
  agentId: string
  type: 'success_pattern' | 'failure_pattern' | 'market_pattern' | 'strategy_pattern'
  pattern: string
  conditions: Record<string, any>
  confidence: number
  occurrences: number
  lastSeen: number
  effectiveness: number
}

export interface StrategyEvolution {
  evolutionId: string
  agentId: string
  originalStrategy: Record<string, any>
  evolvedStrategy: Record<string, any>
  evolutionReason: string
  performanceImprovement: number
  timestamp: number
  validated: boolean
  rollbackData?: Record<string, any>
}

export class AgentMemorySystem extends EventEmitter {
  private memories: Map<string, MemoryEntry> = new Map()
  private personalities: Map<string, AgentPersonality> = new Map()
  private learningPatterns: Map<string, LearningPattern> = new Map()
  private strategyEvolutions: Map<string, StrategyEvolution> = new Map()
  private isInitialized: boolean = false
  private maxMemories: number = 10000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.initialize()
  }

  /**
   * Initialize the memory system
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🧠 Initializing Agent Memory System')

      // Set up periodic cleanup
      this.cleanupInterval = setInterval(() => {
        this.performMemoryMaintenance()
      }, 3600000) // Every hour

      // Listen to LangSmith events for automatic memory creation
      langSmithIntegration.on('traceEnded', (data) => {
        this.processTraceForMemory(data)
      })

      this.isInitialized = true
      console.log('✅ Agent Memory System initialized')

    } catch (error) {
      console.error('❌ Failed to initialize Agent Memory System:', error)
      throw error
    }
  }

  /**
   * Store a memory for an agent
   */
  async storeMemory(
    agentId: string,
    type: MemoryEntry['type'],
    content: string,
    context: Record<string, any> = {},
    importance: number = 0.5,
    tags: string[] = []
  ): Promise<string> {
    const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const memory: MemoryEntry = {
      id: memoryId,
      agentId,
      type,
      content,
      context,
      timestamp: Date.now(),
      importance,
      retrieved: 0,
      lastAccessed: Date.now(),
      tags: [...tags, type, agentId]
    }

    this.memories.set(memoryId, memory)

    // Trigger memory consolidation if needed
    if (this.memories.size > this.maxMemories) {
      await this.consolidateMemories()
    }

    this.emit('memoryStored', { agentId, memoryId, type })
    return memoryId
  }

  /**
   * Retrieve relevant memories for an agent
   */
  async retrieveMemories(
    agentId: string,
    query?: string,
    type?: MemoryEntry['type'],
    limit: number = 10
  ): Promise<MemoryEntry[]> {
    const agentMemories = Array.from(this.memories.values())
      .filter(memory => memory.agentId === agentId)
      .filter(memory => !type || memory.type === type)

    // Simple relevance scoring (in a real implementation, you'd use vector embeddings)
    let scoredMemories = agentMemories.map(memory => {
      let score = memory.importance

      // Boost score for recent memories
      const daysSinceCreated = (Date.now() - memory.timestamp) / 86400000
      score += Math.max(0, 1 - daysSinceCreated / 30) * 0.2

      // Boost score for frequently accessed memories
      score += Math.min(memory.retrieved / 10, 0.3)

      // Query relevance (simple keyword matching)
      if (query) {
        const queryLower = query.toLowerCase()
        const contentMatch = memory.content.toLowerCase().includes(queryLower)
        const tagMatch = memory.tags.some(tag => tag.toLowerCase().includes(queryLower))
        if (contentMatch || tagMatch) {
          score += 0.5
        }
      }

      return { memory, score }
    })

    // Sort by score and update access tracking
    const results = scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ memory }) => {
        memory.retrieved++
        memory.lastAccessed = Date.now()
        return memory
      })

    this.emit('memoriesRetrieved', { agentId, count: results.length, query })
    return results
  }

  /**
   * Create or update agent personality
   */
  async updatePersonality(
    agentId: string,
    updates: Partial<AgentPersonality>
  ): Promise<AgentPersonality> {
    const existing = this.personalities.get(agentId)
    
    const personality: AgentPersonality = {
      agentId,
      riskTolerance: 0.5,
      learningRate: 0.3,
      memoryRetention: 30, // days
      decisionStyle: 'adaptive',
      specializations: [],
      communicationStyle: 'technical',
      lastUpdated: Date.now(),
      ...existing,
      ...updates
    }

    this.personalities.set(agentId, personality)
    this.emit('personalityUpdated', { agentId, personality })
    return personality
  }

  /**
   * Get agent personality
   */
  getPersonality(agentId: string): AgentPersonality | null {
    return this.personalities.get(agentId) || null
  }

  /**
   * Record a learning pattern
   */
  async recordLearningPattern(
    agentId: string,
    type: LearningPattern['type'],
    pattern: string,
    conditions: Record<string, any>,
    effectiveness: number
  ): Promise<string> {
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const learningPattern: LearningPattern = {
      patternId,
      agentId,
      type,
      pattern,
      conditions,
      confidence: 0.1, // Start with low confidence
      occurrences: 1,
      lastSeen: Date.now(),
      effectiveness
    }

    this.learningPatterns.set(patternId, learningPattern)
    this.emit('patternLearned', { agentId, patternId, type })
    return patternId
  }

  /**
   * Get learning patterns for an agent
   */
  getLearningPatterns(
    agentId: string,
    type?: LearningPattern['type'],
    minConfidence: number = 0.3
  ): LearningPattern[] {
    return Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.agentId === agentId)
      .filter(pattern => !type || pattern.type === type)
      .filter(pattern => pattern.confidence >= minConfidence)
      .sort((a, b) => b.effectiveness - a.effectiveness)
  }

  /**
   * Evolve agent strategy based on performance
   */
  async evolveStrategy(
    agentId: string,
    currentStrategy: Record<string, any>,
    performanceMetrics: Record<string, any>,
    reason: string
  ): Promise<StrategyEvolution | null> {
    try {
      // Get agent personality to determine learning rate
      const personality = this.getPersonality(agentId)
      const learningRate = personality?.learningRate || 0.3

      // Get relevant learning patterns
      const patterns = this.getLearningPatterns(agentId)
      
      // Simple strategy evolution (in a real implementation, this would be more sophisticated)
      const evolvedStrategy = { ...currentStrategy }
      
      // Apply learning patterns
      patterns.forEach(pattern => {
        if (pattern.type === 'success_pattern' && pattern.effectiveness > 0.7) {
          // Increase confidence in successful patterns
          if (pattern.pattern.includes('risk_management')) {
            evolvedStrategy.riskLevel = Math.max(0.1, (evolvedStrategy.riskLevel || 0.5) - 0.1)
          }
          if (pattern.pattern.includes('momentum_trading')) {
            evolvedStrategy.momentumSensitivity = (evolvedStrategy.momentumSensitivity || 0.5) + 0.1
          }
        }
      })

      // Performance-based adjustments
      if (performanceMetrics.winRate < 0.4) {
        evolvedStrategy.riskLevel = Math.max(0.1, (evolvedStrategy.riskLevel || 0.5) - 0.2)
        evolvedStrategy.positionSize = Math.max(0.1, (evolvedStrategy.positionSize || 0.5) - 0.1)
      }

      const evolutionId = `evolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const evolution: StrategyEvolution = {
        evolutionId,
        agentId,
        originalStrategy: currentStrategy,
        evolvedStrategy,
        evolutionReason: reason,
        performanceImprovement: 0, // Will be calculated after validation
        timestamp: Date.now(),
        validated: false,
        rollbackData: currentStrategy
      }

      this.strategyEvolutions.set(evolutionId, evolution)

      // Store memory of this evolution
      await this.storeMemory(
        agentId,
        'strategy_adjustment',
        `Strategy evolved: ${reason}`,
        {
          evolutionId,
          originalStrategy: currentStrategy,
          evolvedStrategy,
          performanceMetrics
        },
        0.8,
        ['strategy_evolution', 'learning']
      )

      this.emit('strategyEvolved', { agentId, evolutionId, evolution })
      return evolution

    } catch (error) {
      console.error('Failed to evolve strategy:', error)
      return null
    }
  }

  /**
   * Validate strategy evolution performance
   */
  async validateStrategyEvolution(
    evolutionId: string,
    newPerformanceMetrics: Record<string, any>
  ): Promise<boolean> {
    const evolution = this.strategyEvolutions.get(evolutionId)
    if (!evolution) return false

    // Simple validation logic
    const improvementThreshold = 0.05 // 5% improvement required
    const improvement = newPerformanceMetrics.winRate - (newPerformanceMetrics.previousWinRate || 0)
    
    evolution.performanceImprovement = improvement
    evolution.validated = improvement > improvementThreshold

    if (evolution.validated) {
      // Record successful pattern
      await this.recordLearningPattern(
        evolution.agentId,
        'success_pattern',
        evolution.evolutionReason,
        evolution.evolvedStrategy,
        improvement
      )
    } else {
      // Record failure pattern
      await this.recordLearningPattern(
        evolution.agentId,
        'failure_pattern',
        evolution.evolutionReason,
        evolution.evolvedStrategy,
        improvement
      )
    }

    this.emit('strategyValidated', { evolutionId, validated: evolution.validated, improvement })
    return evolution.validated
  }

  /**
   * Get strategy evolution history
   */
  getStrategyEvolutions(agentId: string): StrategyEvolution[] {
    return Array.from(this.strategyEvolutions.values())
      .filter(evolution => evolution.agentId === agentId)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Process trace data for automatic memory creation
   */
  private async processTraceForMemory(data: any): Promise<void> {
    try {
      if (!data.traceId) return

      // Create memory based on trace outcome
      if (data.success) {
        await this.storeMemory(
          data.agentId || 'unknown',
          'outcome',
          `Successful operation: ${data.latency}ms`,
          {
            traceId: data.traceId,
            latency: data.latency,
            success: true
          },
          0.6,
          ['success', 'performance']
        )
      } else {
        await this.storeMemory(
          data.agentId || 'unknown',
          'outcome',
          `Failed operation`,
          {
            traceId: data.traceId,
            success: false
          },
          0.8, // Failures are more important to remember
          ['failure', 'error']
        )
      }
    } catch (error) {
      console.error('Failed to process trace for memory:', error)
    }
  }

  /**
   * Consolidate memories by removing less important ones
   */
  private async consolidateMemories(): Promise<void> {
    const memoriesArray = Array.from(this.memories.values())
    
    // Sort by importance and age
    const sortedMemories = memoriesArray.sort((a, b) => {
      const scoreA = a.importance + (a.retrieved * 0.1) - ((Date.now() - a.timestamp) / 86400000 * 0.01)
      const scoreB = b.importance + (b.retrieved * 0.1) - ((Date.now() - b.timestamp) / 86400000 * 0.01)
      return scoreB - scoreA
    })

    // Remove bottom 20% of memories
    const removeCount = Math.floor(memoriesArray.length * 0.2)
    const memoriesToRemove = sortedMemories.slice(-removeCount)

    memoriesToRemove.forEach(memory => {
      this.memories.delete(memory.id)
    })

    console.log(`🧠 Consolidated memories: removed ${removeCount} entries`)
    this.emit('memoriesConsolidated', { removed: removeCount, remaining: this.memories.size })
  }

  /**
   * Perform periodic memory maintenance
   */
  private async performMemoryMaintenance(): Promise<void> {
    try {
      // Remove very old memories based on agent personality
      for (const [agentId, personality] of this.personalities.entries()) {
        const cutoffTime = Date.now() - (personality.memoryRetention * 24 * 60 * 60 * 1000)
        
        for (const [memoryId, memory] of this.memories.entries()) {
          if (memory.agentId === agentId && memory.timestamp < cutoffTime && memory.importance < 0.7) {
            this.memories.delete(memoryId)
          }
        }
      }

      // Update learning pattern confidence based on recent occurrences
      for (const pattern of this.learningPatterns.values()) {
        const daysSinceLastSeen = (Date.now() - pattern.lastSeen) / 86400000
        if (daysSinceLastSeen > 7) {
          pattern.confidence = Math.max(0.1, pattern.confidence - 0.05)
        }
      }

      console.log('🧠 Memory maintenance completed')
      this.emit('maintenanceCompleted', { 
        totalMemories: this.memories.size,
        totalPatterns: this.learningPatterns.size
      })

    } catch (error) {
      console.error('Failed to perform memory maintenance:', error)
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalMemories: number
    totalPatterns: number
    totalEvolutions: number
    agentCount: number
    memoryByType: Record<string, number>
    patternByType: Record<string, number>
  } {
    const memoryByType: Record<string, number> = {}
    const patternByType: Record<string, number> = {}

    for (const memory of this.memories.values()) {
      memoryByType[memory.type] = (memoryByType[memory.type] || 0) + 1
    }

    for (const pattern of this.learningPatterns.values()) {
      patternByType[pattern.type] = (patternByType[pattern.type] || 0) + 1
    }

    return {
      totalMemories: this.memories.size,
      totalPatterns: this.learningPatterns.size,
      totalEvolutions: this.strategyEvolutions.size,
      agentCount: this.personalities.size,
      memoryByType,
      patternByType
    }
  }

  /**
   * Export memories for analysis
   */
  exportMemories(agentId?: string): MemoryEntry[] {
    const memories = Array.from(this.memories.values())
    return agentId ? memories.filter(m => m.agentId === agentId) : memories
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    isInitialized: boolean
    totalMemories: number
    totalPatterns: number
    errors: string[]
  }> {
    const errors: string[] = []

    if (!this.isInitialized) {
      errors.push('Not initialized')
    }

    if (this.memories.size > this.maxMemories * 1.2) {
      errors.push('Memory usage too high')
    }

    const status = errors.length === 0 ? 'healthy' :
                   errors.length === 1 ? 'degraded' : 'unhealthy'

    return {
      status,
      isInitialized: this.isInitialized,
      totalMemories: this.memories.size,
      totalPatterns: this.learningPatterns.size,
      errors
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    this.memories.clear()
    this.personalities.clear()
    this.learningPatterns.clear()
    this.strategyEvolutions.clear()
    this.removeAllListeners()
  }
}

// Export singleton instance
// TEMPORARILY DISABLED: Auto-instantiation causing circular dependency
// export const agentMemorySystem = new AgentMemorySystem()