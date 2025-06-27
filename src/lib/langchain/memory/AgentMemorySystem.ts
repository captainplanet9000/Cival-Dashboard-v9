/**
 * Agent Memory System
 * Manages persistent memory for AI agents with importance-based retention
 */

import type { 
  MemoryItem, 
  MemoryQuery, 
  ConversationState,
  AgentDecision 
} from '../types'

interface MemoryConfig {
  maxMemoryItems: number
  importanceThreshold: number
  retentionDays: number
  enableCompression: boolean
}

export class AgentMemorySystem {
  private memory: Map<string, MemoryItem[]> = new Map()
  private config: MemoryConfig = {
    maxMemoryItems: 1000,
    importanceThreshold: 0.3,
    retentionDays: 30,
    enableCompression: true
  }

  constructor(config?: Partial<MemoryConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.initializeMemory()
  }

  private initializeMemory() {
    // Initialize memory storage
    console.log('🧠 Initializing Agent Memory System')
    
    // Start periodic cleanup
    setInterval(() => {
      this.cleanupExpiredMemories()
    }, 60 * 60 * 1000) // Every hour
  }

  async storeMemory(agentId: string, item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const memoryItem: MemoryItem = {
      id: memoryId,
      agentId,
      timestamp: new Date(),
      ...item
    }

    // Get or create agent memory array
    if (!this.memory.has(agentId)) {
      this.memory.set(agentId, [])
    }

    const agentMemory = this.memory.get(agentId)!
    agentMemory.push(memoryItem)

    // Sort by importance and timestamp
    agentMemory.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    // Trim if exceeding max items
    if (agentMemory.length > this.config.maxMemoryItems) {
      const removed = agentMemory.splice(this.config.maxMemoryItems)
      console.log(`🗑️ Removed ${removed.length} low-importance memories for agent ${agentId}`)
    }

    console.log(`💾 Stored memory for agent ${agentId}: ${item.type}`)
    return memoryId
  }

  async recallMemories(agentId: string, query?: MemoryQuery): Promise<MemoryItem[]> {
    const agentMemory = this.memory.get(agentId) || []
    
    if (!query) {
      return agentMemory.slice(0, 10) // Return most recent/important 10 items
    }

    let filtered = agentMemory

    // Filter by type
    if (query.type) {
      filtered = filtered.filter(item => item.type === query.type)
    }

    // Filter by time range
    if (query.timeRange) {
      filtered = filtered.filter(item => 
        item.timestamp >= query.timeRange!.start && 
        item.timestamp <= query.timeRange!.end
      )
    }

    // Filter by importance
    if (query.importance) {
      filtered = filtered.filter(item => 
        item.importance >= query.importance!.min && 
        item.importance <= query.importance!.max
      )
    }

    // Apply limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit)
    }

    return filtered
  }

  async storeConversation(conversation: ConversationState): Promise<void> {
    const memoryItem = {
      agentId: conversation.agentId,
      type: 'conversation' as const,
      content: {
        messages: conversation.messages.slice(-5), // Store last 5 messages
        context: conversation.context
      },
      importance: this.calculateConversationImportance(conversation),
      expiresAt: new Date(Date.now() + this.config.retentionDays * 24 * 60 * 60 * 1000)
    }

    await this.storeMemory(conversation.agentId, memoryItem)
  }

  async storeDecision(decision: AgentDecision): Promise<void> {
    const memoryItem = {
      agentId: decision.agentId,
      type: 'decision' as const,
      content: {
        action: decision.action,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        data: decision.data
      },
      importance: this.calculateDecisionImportance(decision),
      expiresAt: new Date(Date.now() + this.config.retentionDays * 24 * 60 * 60 * 1000)
    }

    await this.storeMemory(decision.agentId, memoryItem)
  }

  async storeMarketData(agentId: string, marketData: any): Promise<void> {
    const memoryItem = {
      agentId,
      type: 'market_data' as const,
      content: marketData,
      importance: this.calculateMarketDataImportance(marketData),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for market data
    }

    await this.storeMemory(agentId, memoryItem)
  }

  async storePerformance(agentId: string, performance: any): Promise<void> {
    const memoryItem = {
      agentId,
      type: 'performance' as const,
      content: performance,
      importance: this.calculatePerformanceImportance(performance),
      expiresAt: new Date(Date.now() + this.config.retentionDays * 24 * 60 * 60 * 1000)
    }

    await this.storeMemory(agentId, memoryItem)
  }

  private calculateConversationImportance(conversation: ConversationState): number {
    // Base importance
    let importance = 0.5

    // Recent conversations are more important
    const hoursOld = (Date.now() - conversation.lastUpdated.getTime()) / (1000 * 60 * 60)
    importance += Math.max(0, (24 - hoursOld) / 24) * 0.3

    // Longer conversations might be more important
    importance += Math.min(conversation.messages.length / 20, 0.2)

    return Math.min(importance, 1.0)
  }

  private calculateDecisionImportance(decision: AgentDecision): number {
    // Base importance from confidence
    let importance = decision.confidence

    // Action type affects importance
    const actionWeights = {
      'buy': 0.8,
      'sell': 0.8,
      'hold': 0.4,
      'analyze': 0.6
    }
    importance *= actionWeights[decision.action] || 0.5

    // Recent decisions are more important
    const hoursOld = (Date.now() - decision.timestamp.getTime()) / (1000 * 60 * 60)
    importance += Math.max(0, (6 - hoursOld) / 6) * 0.2

    return Math.min(importance, 1.0)
  }

  private calculateMarketDataImportance(marketData: any): number {
    // Market data importance based on volatility and recency
    let importance = 0.6

    // High volatility data is more important
    if (marketData.volatility && marketData.volatility > 0.02) {
      importance += 0.3
    }

    // Volume spikes are important
    if (marketData.volume && marketData.volumeRatio && marketData.volumeRatio > 2) {
      importance += 0.2
    }

    return Math.min(importance, 1.0)
  }

  private calculatePerformanceImportance(performance: any): number {
    // Performance data importance
    let importance = 0.7

    // Strong performance or losses are more important
    if (performance.returnPercent) {
      const absReturn = Math.abs(performance.returnPercent)
      if (absReturn > 0.05) { // 5% return/loss
        importance += 0.3
      }
    }

    return Math.min(importance, 1.0)
  }

  private cleanupExpiredMemories(): void {
    const now = new Date()
    let totalCleaned = 0

    for (const [agentId, memories] of this.memory.entries()) {
      const initialLength = memories.length
      
      // Remove expired memories
      const filtered = memories.filter(item => 
        !item.expiresAt || item.expiresAt > now
      )

      // Remove low-importance memories if still too many
      const finalMemories = filtered
        .filter(item => item.importance >= this.config.importanceThreshold)
        .slice(0, this.config.maxMemoryItems)

      this.memory.set(agentId, finalMemories)
      totalCleaned += initialLength - finalMemories.length
    }

    if (totalCleaned > 0) {
      console.log(`🧹 Cleaned up ${totalCleaned} expired/low-importance memories`)
    }
  }

  // Public API methods
  async getMemoryStats(agentId?: string): Promise<any> {
    if (agentId) {
      const agentMemory = this.memory.get(agentId) || []
      return {
        agentId,
        totalItems: agentMemory.length,
        typeBreakdown: this.getTypeBreakdown(agentMemory),
        averageImportance: this.getAverageImportance(agentMemory),
        oldestItem: agentMemory.length > 0 ? agentMemory[agentMemory.length - 1].timestamp : null,
        newestItem: agentMemory.length > 0 ? agentMemory[0].timestamp : null
      }
    }

    // Global stats
    let totalItems = 0
    const allMemories: MemoryItem[] = []
    
    for (const memories of this.memory.values()) {
      totalItems += memories.length
      allMemories.push(...memories)
    }

    return {
      totalAgents: this.memory.size,
      totalItems,
      typeBreakdown: this.getTypeBreakdown(allMemories),
      averageImportance: this.getAverageImportance(allMemories),
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  private getTypeBreakdown(memories: MemoryItem[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    memories.forEach(item => {
      breakdown[item.type] = (breakdown[item.type] || 0) + 1
    })
    return breakdown
  }

  private getAverageImportance(memories: MemoryItem[]): number {
    if (memories.length === 0) return 0
    const sum = memories.reduce((acc, item) => acc + item.importance, 0)
    return sum / memories.length
  }

  private estimateMemoryUsage(): string {
    const totalItems = Array.from(this.memory.values()).reduce((sum, arr) => sum + arr.length, 0)
    const estimatedBytes = totalItems * 1024 // Rough estimate
    return `${(estimatedBytes / 1024 / 1024).toFixed(2)} MB`
  }

  clearAgentMemory(agentId: string): boolean {
    const deleted = this.memory.delete(agentId)
    if (deleted) {
      console.log(`🗑️ Cleared all memory for agent ${agentId}`)
    }
    return deleted
  }

  clearAllMemory(): void {
    const agentCount = this.memory.size
    this.memory.clear()
    console.log(`🗑️ Cleared memory for ${agentCount} agents`)
  }

  exportMemory(agentId: string): MemoryItem[] | null {
    return this.memory.get(agentId) || null
  }

  importMemory(agentId: string, memories: MemoryItem[]): void {
    this.memory.set(agentId, memories)
    console.log(`📥 Imported ${memories.length} memories for agent ${agentId}`)
  }

  getConfig(): MemoryConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Updated memory system configuration')
  }
}