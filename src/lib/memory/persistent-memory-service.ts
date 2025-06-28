'use client'

/**
 * Persistent Memory Service with Real Storage
 * Provides actual persistent memory with localStorage/IndexedDB backup
 * Simulates LLM responses but maintains real memory connections
 */

import { getSimpleMemoryService, type AgentMemoryNode, type AgentPersonality } from './simple-agent-memory'

export interface MemoryConnection {
  id: string
  sourceMemoryId: string
  targetMemoryId: string
  connectionType: 'similar_strategy' | 'opposite_outcome' | 'temporal_sequence' | 'causal_relationship'
  strength: number
  createdAt: Date
}

export interface AgentThought {
  id: string
  agentId: string
  thought: string
  context: string
  confidence: number
  relatedMemories: string[]
  timestamp: Date
  thoughtType: 'analysis' | 'prediction' | 'reflection' | 'planning'
}

export interface AgentDecision {
  id: string
  agentId: string
  symbol: string
  decision: 'buy' | 'sell' | 'hold'
  quantity?: number
  price?: number
  confidence: number
  reasoning: string
  influencingMemories: string[]
  thoughts: AgentThought[]
  marketContext: any
  timestamp: Date
  executed: boolean
  outcome?: {
    actualPrice: number
    profitLoss: number
    executedAt: Date
  }
}

export interface RealTimeMemoryUpdate {
  type: 'memory_stored' | 'connection_created' | 'thought_generated' | 'decision_made'
  agentId: string
  data: any
  timestamp: Date
}

class PersistentMemoryService {
  private simpleMemory = getSimpleMemoryService()
  private connections: Map<string, MemoryConnection[]> = new Map()
  private thoughts: Map<string, AgentThought[]> = new Map()
  private decisions: Map<string, AgentDecision[]> = new Map()
  private updateListeners: ((update: RealTimeMemoryUpdate) => void)[] = []
  private connectionCounter = 0
  private thoughtCounter = 0
  private decisionCounter = 0

  constructor() {
    this.loadFromStorage()
    this.initializeMemoryConnections()
    this.startBackgroundProcessing()
  }

  // Real persistent storage methods
  private saveToStorage() {
    try {
      const data = {
        connections: Array.from(this.connections.entries()),
        thoughts: Array.from(this.thoughts.entries()),
        decisions: Array.from(this.decisions.entries()),
        counters: {
          connection: this.connectionCounter,
          thought: this.thoughtCounter,
          decision: this.decisionCounter
        }
      }
      localStorage.setItem('persistent_memory_data', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save memory data to localStorage:', error)
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('persistent_memory_data')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore connections
        data.connections?.forEach(([agentId, connections]: [string, MemoryConnection[]]) => {
          this.connections.set(agentId, connections.map(c => ({
            ...c,
            createdAt: new Date(c.createdAt)
          })))
        })

        // Restore thoughts
        data.thoughts?.forEach(([agentId, thoughts]: [string, AgentThought[]]) => {
          this.thoughts.set(agentId, thoughts.map(t => ({
            ...t,
            timestamp: new Date(t.timestamp)
          })))
        })

        // Restore decisions
        data.decisions?.forEach(([agentId, decisions]: [string, AgentDecision[]]) => {
          this.decisions.set(agentId, decisions.map(d => ({
            ...d,
            timestamp: new Date(d.timestamp),
            outcome: d.outcome ? {
              ...d.outcome,
              executedAt: new Date(d.outcome.executedAt)
            } : undefined
          })))
        })

        // Restore counters
        if (data.counters) {
          this.connectionCounter = data.counters.connection || 0
          this.thoughtCounter = data.counters.thought || 0
          this.decisionCounter = data.counters.decision || 0
        }
      }
    } catch (error) {
      console.warn('Failed to load memory data from localStorage:', error)
    }
  }

  // Real-time update system
  addUpdateListener(listener: (update: RealTimeMemoryUpdate) => void) {
    this.updateListeners.push(listener)
  }

  removeUpdateListener(listener: (update: RealTimeMemoryUpdate) => void) {
    const index = this.updateListeners.indexOf(listener)
    if (index > -1) {
      this.updateListeners.splice(index, 1)
    }
  }

  private notifyUpdate(update: RealTimeMemoryUpdate) {
    this.updateListeners.forEach(listener => {
      try {
        listener(update)
      } catch (error) {
        console.warn('Error in memory update listener:', error)
      }
    })
  }

  // Memory connection system (real)
  private initializeMemoryConnections() {
    const agents = this.simpleMemory.getAllAgents()
    
    agents.forEach(agent => {
      if (!this.connections.has(agent.agentId)) {
        this.connections.set(agent.agentId, [])
        this.thoughts.set(agent.agentId, [])
        this.decisions.set(agent.agentId, [])
      }
      
      // Create initial connections for existing memories
      this.analyzeAndCreateConnections(agent.agentId)
    })
  }

  private analyzeAndCreateConnections(agentId: string) {
    const memories = this.simpleMemory.retrieveMemories(agentId, undefined, undefined, 50)
    const existingConnections = this.connections.get(agentId) || []

    // Find memories that should be connected
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const memory1 = memories[i]
        const memory2 = memories[j]

        // Check if connection already exists
        const connectionExists = existingConnections.some(c => 
          (c.sourceMemoryId === memory1.id && c.targetMemoryId === memory2.id) ||
          (c.sourceMemoryId === memory2.id && c.targetMemoryId === memory1.id)
        )

        if (!connectionExists) {
          const connection = this.analyzeMemoryRelationship(memory1, memory2)
          if (connection) {
            this.createConnection(agentId, memory1.id, memory2.id, connection.type, connection.strength)
          }
        }
      }
    }
  }

  private analyzeMemoryRelationship(
    memory1: AgentMemoryNode, 
    memory2: AgentMemoryNode
  ): { type: MemoryConnection['connectionType'], strength: number } | null {
    // Same symbol connection
    if (memory1.metadata.symbol === memory2.metadata.symbol && memory1.metadata.symbol) {
      return { type: 'similar_strategy', strength: 0.8 }
    }

    // Same strategy connection
    if (memory1.metadata.strategy === memory2.metadata.strategy && memory1.metadata.strategy) {
      return { type: 'similar_strategy', strength: 0.7 }
    }

    // Opposite outcomes (learning opportunity)
    if (memory1.metadata.outcome && memory2.metadata.outcome && 
        memory1.metadata.outcome !== memory2.metadata.outcome) {
      return { type: 'opposite_outcome', strength: 0.9 }
    }

    // Temporal sequence (close in time)
    const timeDiff = Math.abs(memory1.timestamp.getTime() - memory2.timestamp.getTime())
    if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
      return { type: 'temporal_sequence', strength: 0.6 }
    }

    // Content similarity (simple keyword matching)
    const commonWords = this.findCommonKeywords(memory1.content, memory2.content)
    if (commonWords.length >= 2) {
      return { type: 'causal_relationship', strength: Math.min(0.5 + commonWords.length * 0.1, 0.9) }
    }

    return null
  }

  private findCommonKeywords(text1: string, text2: string): string[] {
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    
    return words1.filter(word => words2.includes(word))
  }

  createConnection(
    agentId: string,
    sourceMemoryId: string,
    targetMemoryId: string,
    connectionType: MemoryConnection['connectionType'],
    strength: number
  ): string {
    const connectionId = `conn_${this.connectionCounter++}`
    const connection: MemoryConnection = {
      id: connectionId,
      sourceMemoryId,
      targetMemoryId,
      connectionType,
      strength,
      createdAt: new Date()
    }

    if (!this.connections.has(agentId)) {
      this.connections.set(agentId, [])
    }

    this.connections.get(agentId)!.push(connection)
    this.saveToStorage()

    this.notifyUpdate({
      type: 'connection_created',
      agentId,
      data: connection,
      timestamp: new Date()
    })

    return connectionId
  }

  getConnections(agentId: string, memoryId?: string): MemoryConnection[] {
    const connections = this.connections.get(agentId) || []
    
    if (memoryId) {
      return connections.filter(c => 
        c.sourceMemoryId === memoryId || c.targetMemoryId === memoryId
      )
    }
    
    return connections
  }

  // Simulated LLM thought generation (but with real storage)
  generateAgentThought(
    agentId: string,
    context: string,
    thoughtType: AgentThought['thoughtType'] = 'analysis'
  ): string {
    const agent = this.simpleMemory.getAgentPersonality(agentId)
    if (!agent) return ''

    // Get relevant memories for context
    const relevantMemories = this.simpleMemory.retrieveMemories(agentId, context, undefined, 3)
    const relatedConnections = relevantMemories.flatMap(m => this.getConnections(agentId, m.id))

    // Simulate different thinking patterns based on agent personality
    let simulatedThought = ''
    
    switch (agent.learningStyle) {
      case 'quick_adapt':
        simulatedThought = this.generateQuickAdaptThought(context, relevantMemories, agent.riskTolerance)
        break
      case 'gradual_learn':
        simulatedThought = this.generateGradualLearnThought(context, relevantMemories, relatedConnections)
        break
      case 'pattern_focused':
        simulatedThought = this.generatePatternFocusedThought(context, relevantMemories, relatedConnections)
        break
    }

    // Store the thought with real persistence
    const thoughtId = `thought_${this.thoughtCounter++}`
    const thought: AgentThought = {
      id: thoughtId,
      agentId,
      thought: simulatedThought,
      context,
      confidence: 0.7 + Math.random() * 0.3,
      relatedMemories: relevantMemories.map(m => m.id),
      timestamp: new Date(),
      thoughtType
    }

    if (!this.thoughts.has(agentId)) {
      this.thoughts.set(agentId, [])
    }

    this.thoughts.get(agentId)!.unshift(thought)
    
    // Keep only last 50 thoughts per agent
    const agentThoughts = this.thoughts.get(agentId)!
    if (agentThoughts.length > 50) {
      this.thoughts.set(agentId, agentThoughts.slice(0, 50))
    }

    this.saveToStorage()

    this.notifyUpdate({
      type: 'thought_generated',
      agentId,
      data: thought,
      timestamp: new Date()
    })

    return thoughtId
  }

  private generateQuickAdaptThought(context: string, memories: AgentMemoryNode[], riskTolerance: string): string {
    const recentSuccess = memories.find(m => m.metadata.outcome === 'success')
    const recentFailure = memories.find(m => m.metadata.outcome === 'failure')

    if (recentFailure && Math.random() > 0.5) {
      return `Quick adaptation needed: Recent failure in ${recentFailure.metadata.symbol} suggests I should ${riskTolerance === 'aggressive' ? 'adjust position sizing but maintain momentum strategy' : 'be more conservative and wait for clearer signals'}. Learning from this mistake immediately.`
    }

    if (recentSuccess) {
      return `Building on recent success with ${recentSuccess.metadata.strategy}: Current ${context} shows similar patterns. ${riskTolerance === 'aggressive' ? 'Increasing position size' : 'Maintaining steady approach'} based on proven performance.`
    }

    return `Analyzing ${context} for quick adaptation opportunities. No strong historical precedent, so ${riskTolerance === 'aggressive' ? 'taking measured risk with tight stops' : 'proceeding cautiously with small position'}.`
  }

  private generateGradualLearnThought(context: string, memories: AgentMemoryNode[], connections: MemoryConnection[]): string {
    const patterns = memories.filter(m => m.type === 'market_insight')
    const strongConnections = connections.filter(c => c.strength > 0.7)

    if (strongConnections.length > 0) {
      return `Gradual learning pattern emerging: Multiple connected experiences suggest ${context} requires patience. Historical analysis shows ${patterns.length} similar market conditions with gradual development. Building position slowly based on accumulated evidence.`
    }

    return `Continuing gradual learning approach for ${context}. Accumulating data points from ${memories.length} related experiences. Pattern not yet complete - maintaining current strategy until more evidence emerges.`
  }

  private generatePatternFocusedThought(context: string, memories: AgentMemoryNode[], connections: MemoryConnection[]): string {
    const similarPatterns = connections.filter(c => c.connectionType === 'similar_strategy')
    const temporalSequences = connections.filter(c => c.connectionType === 'temporal_sequence')

    if (similarPatterns.length >= 2) {
      return `Strong pattern recognition in ${context}: Identified ${similarPatterns.length} similar strategy connections with ${temporalSequences.length} temporal sequences. Pattern confidence high - executing based on historical success patterns.`
    }

    return `Pattern analysis for ${context}: Insufficient pattern strength detected. Found ${connections.length} weak connections but no dominant pattern. Waiting for clearer technical setup before execution.`
  }

  getAgentThoughts(agentId: string, limit: number = 10): AgentThought[] {
    const thoughts = this.thoughts.get(agentId) || []
    return thoughts.slice(0, limit)
  }

  // Real decision making with simulated reasoning
  makeAgentDecision(
    agentId: string,
    symbol: string,
    marketData: any
  ): AgentDecision {
    // Generate thought process
    const thoughtId1 = this.generateAgentThought(agentId, `market analysis for ${symbol}`, 'analysis')
    const thoughtId2 = this.generateAgentThought(agentId, `trading decision for ${symbol}`, 'planning')

    // Get decision from simple memory service
    const simpleDecision = this.simpleMemory.simulateAgentDecision(agentId, symbol, marketData)
    
    // Create real decision record
    const decisionId = `decision_${this.decisionCounter++}`
    const decision: AgentDecision = {
      id: decisionId,
      agentId,
      symbol,
      decision: simpleDecision.decision,
      confidence: simpleDecision.confidence,
      reasoning: simpleDecision.reasoning,
      influencingMemories: simpleDecision.memoryInfluence.map(m => m.id),
      thoughts: this.getAgentThoughts(agentId, 2),
      marketContext: marketData,
      timestamp: new Date(),
      executed: false
    }

    if (!this.decisions.has(agentId)) {
      this.decisions.set(agentId, [])
    }

    this.decisions.get(agentId)!.unshift(decision)
    this.saveToStorage()

    this.notifyUpdate({
      type: 'decision_made',
      agentId,
      data: decision,
      timestamp: new Date()
    })

    return decision
  }

  executeDecision(decisionId: string, executionPrice: number): boolean {
    // Find and update the decision
    for (const [agentId, decisions] of this.decisions.entries()) {
      const decision = decisions.find(d => d.id === decisionId)
      if (decision) {
        decision.executed = true
        decision.outcome = {
          actualPrice: executionPrice,
          profitLoss: 0, // Will be calculated later
          executedAt: new Date()
        }
        
        this.saveToStorage()
        return true
      }
    }
    return false
  }

  updateDecisionOutcome(decisionId: string, profitLoss: number): boolean {
    for (const [agentId, decisions] of this.decisions.entries()) {
      const decision = decisions.find(d => d.id === decisionId)
      if (decision && decision.outcome) {
        decision.outcome.profitLoss = profitLoss
        
        // Store learning memory based on outcome
        const outcome = profitLoss > 0 ? 'success' : 'failure'
        this.simpleMemory.learnFromTrade(
          agentId,
          decision.symbol,
          decision.reasoning.includes('momentum') ? 'momentum' : 'general',
          outcome,
          profitLoss
        )

        this.saveToStorage()
        return true
      }
    }
    return false
  }

  getAgentDecisions(agentId: string, limit: number = 10): AgentDecision[] {
    const decisions = this.decisions.get(agentId) || []
    return decisions.slice(0, limit)
  }

  // Background processing for continuous learning
  private startBackgroundProcessing() {
    setInterval(() => {
      this.processMemoryConnections()
      this.cleanupOldData()
    }, 60000) // Every minute
  }

  private processMemoryConnections() {
    const agents = this.simpleMemory.getAllAgents()
    agents.forEach(agent => {
      // Periodically analyze new connections
      if (Math.random() < 0.1) { // 10% chance per minute
        this.analyzeAndCreateConnections(agent.agentId)
      }
    })
  }

  private cleanupOldData() {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7) // Keep last 7 days

    // Clean up old thoughts
    for (const [agentId, thoughts] of this.thoughts.entries()) {
      const filteredThoughts = thoughts.filter(t => t.timestamp > cutoffDate)
      this.thoughts.set(agentId, filteredThoughts)
    }

    // Clean up old connections (keep important ones)
    for (const [agentId, connections] of this.connections.entries()) {
      const filteredConnections = connections.filter(c => 
        c.createdAt > cutoffDate || c.strength > 0.8
      )
      this.connections.set(agentId, filteredConnections)
    }

    this.saveToStorage()
  }

  // Advanced memory retrieval with connections
  getConnectedMemories(agentId: string, memoryId: string, depth: number = 2): AgentMemoryNode[] {
    const visited = new Set<string>()
    const result: AgentMemoryNode[] = []
    
    const traverse = (currentMemoryId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentMemoryId)) return
      
      visited.add(currentMemoryId)
      const connections = this.getConnections(agentId, currentMemoryId)
      
      connections.forEach(connection => {
        const nextMemoryId = connection.sourceMemoryId === currentMemoryId 
          ? connection.targetMemoryId 
          : connection.sourceMemoryId
          
        if (!visited.has(nextMemoryId)) {
          const memories = this.simpleMemory.retrieveMemories(agentId, undefined, undefined, 100)
          const memory = memories.find(m => m.id === nextMemoryId)
          if (memory) {
            result.push(memory)
            traverse(nextMemoryId, currentDepth + 1)
          }
        }
      })
    }
    
    traverse(memoryId, 0)
    return result
  }

  // Real-time memory statistics
  getMemorySystemStats() {
    const agents = this.simpleMemory.getAllAgents()
    
    return {
      totalAgents: agents.length,
      totalMemories: agents.reduce((sum, agent) => {
        return sum + this.simpleMemory.retrieveMemories(agent.agentId, undefined, undefined, 1000).length
      }, 0),
      totalConnections: Array.from(this.connections.values()).reduce((sum, conns) => sum + conns.length, 0),
      totalThoughts: Array.from(this.thoughts.values()).reduce((sum, thoughts) => sum + thoughts.length, 0),
      totalDecisions: Array.from(this.decisions.values()).reduce((sum, decisions) => sum + decisions.length, 0),
      averageConnectionStrength: this.calculateAverageConnectionStrength(),
      lastUpdate: new Date()
    }
  }

  private calculateAverageConnectionStrength(): number {
    const allConnections = Array.from(this.connections.values()).flat()
    if (allConnections.length === 0) return 0
    
    const totalStrength = allConnections.reduce((sum, conn) => sum + conn.strength, 0)
    return totalStrength / allConnections.length
  }
}

// Export singleton instance
let _persistentMemoryService: PersistentMemoryService | null = null

export function getPersistentMemoryService(): PersistentMemoryService {
  if (!_persistentMemoryService) {
    _persistentMemoryService = new PersistentMemoryService()
  }
  return _persistentMemoryService
}

export const persistentMemoryService = getPersistentMemoryService()