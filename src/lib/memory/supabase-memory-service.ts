'use client'

/**
 * Supabase Memory Service
 * Integrates AI memory system with existing Supabase database
 * Provides persistent memory with real-time updates
 */

import { createClient } from '@/lib/supabase'
import { 
  getSimpleMemoryService, 
  type AgentMemoryNode, 
  type AgentPersonality 
} from './simple-agent-memory'

export interface SupabaseMemoryNode {
  id: string
  memory_id: string
  agent_id: string
  content: string
  memory_type: 'trade_decision' | 'market_insight' | 'strategy_learning' | 'risk_observation'
  importance_score: number
  embedding?: number[]
  metadata: Record<string, any>
  access_count: number
  created_at: string
  updated_at: string
}

export interface SupabaseAgentPersonality {
  id: string
  agent_id: string
  name: string
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  preferred_strategies: string[]
  learning_style: 'quick_adapt' | 'gradual_learn' | 'pattern_focused'
  trading_history: Record<string, any>
  memory_preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SupabaseMemoryConnection {
  id: string
  connection_id: string
  agent_id: string
  source_memory_id: string
  target_memory_id: string
  connection_type: 'similar_strategy' | 'opposite_outcome' | 'temporal_sequence' | 'causal_relationship'
  strength: number
  created_at: string
}

export interface SupabaseAgentThought {
  id: string
  thought_id: string
  agent_id: string
  thought: string
  context: string
  confidence: number
  related_memories: string[]
  thought_type: 'analysis' | 'prediction' | 'reflection' | 'planning'
  created_at: string
}

export interface SupabaseAgentDecision {
  id: string
  decision_id: string
  agent_id: string
  symbol: string
  decision: 'buy' | 'sell' | 'hold'
  quantity?: number
  price?: number
  confidence: number
  reasoning: string
  influencing_memories: string[]
  market_context: Record<string, any>
  executed: boolean
  outcome: Record<string, any>
  created_at: string
}

class SupabaseMemoryService {
  private supabase = createClient()
  private simpleMemory = getSimpleMemoryService()
  private updateListeners: ((update: any) => void)[] = []
  private realtimeSubscription: any = null

  constructor() {
    this.initializeRealtimeSubscription()
    this.syncWithLocalMemory()
  }

  private initializeRealtimeSubscription() {
    // Subscribe to real-time updates
    this.realtimeSubscription = this.supabase
      .channel('memory-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_memory_nodes' },
        (payload) => this.handleRealtimeUpdate('memory_stored', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_thoughts' },
        (payload) => this.handleRealtimeUpdate('thought_generated', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_decisions' },
        (payload) => this.handleRealtimeUpdate('decision_made', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'memory_connections' },
        (payload) => this.handleRealtimeUpdate('connection_created', payload)
      )
      .subscribe()
  }

  private handleRealtimeUpdate(type: string, payload: any) {
    this.updateListeners.forEach(listener => {
      try {
        listener({
          type,
          agentId: payload.new?.agent_id || payload.old?.agent_id,
          data: payload.new || payload.old,
          timestamp: new Date()
        })
      } catch (error) {
        console.warn('Error in realtime update listener:', error)
      }
    })
  }

  private async syncWithLocalMemory() {
    try {
      // Sync agent personalities
      const { data: personalities } = await this.supabase
        .from('agent_personalities')
        .select('*')

      if (personalities) {
        personalities.forEach(personality => {
          const localAgent = this.simpleMemory.getAgentPersonality(personality.agent_id)
          if (!localAgent) {
            // Create local agent from Supabase data
            this.simpleMemory.updateAgentPersonality(personality.agent_id, {
              agentId: personality.agent_id,
              name: personality.name,
              riskTolerance: personality.risk_tolerance,
              preferredStrategies: personality.preferred_strategies,
              learningStyle: personality.learning_style,
              tradingHistory: personality.trading_history,
              memoryPreferences: personality.memory_preferences
            } as AgentPersonality)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to sync with Supabase:', error)
    }
  }

  // Memory operations
  async storeMemory(
    agentId: string,
    content: string,
    memoryType: SupabaseMemoryNode['memory_type'],
    importance: number,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store in Supabase
      const { data, error } = await this.supabase
        .from('agent_memory_nodes')
        .insert({
          memory_id: memoryId,
          agent_id: agentId,
          content,
          memory_type: memoryType,
          importance_score: importance,
          metadata,
          access_count: 0
        })
        .select()
        .single()

      if (error) throw error

      // Also store in local memory for immediate access
      this.simpleMemory.storeMemory(agentId, content, memoryType, importance, metadata)

      return memoryId
    } catch (error) {
      console.error('Failed to store memory in Supabase:', error)
      // Fallback to local storage
      return this.simpleMemory.storeMemory(agentId, content, memoryType, importance, metadata)
    }
  }

  async retrieveMemories(
    agentId: string,
    query?: string,
    memoryType?: SupabaseMemoryNode['memory_type'],
    limit: number = 10
  ): Promise<SupabaseMemoryNode[]> {
    try {
      let queryBuilder = this.supabase
        .from('agent_memory_nodes')
        .select('*')
        .eq('agent_id', agentId)
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (memoryType) {
        queryBuilder = queryBuilder.eq('memory_type', memoryType)
      }

      if (query) {
        queryBuilder = queryBuilder.textSearch('content', query)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      // Update access counts
      if (data && data.length > 0) {
        const memoryIds = data.map(m => m.memory_id)
        await this.supabase
          .from('agent_memory_nodes')
          .update({ access_count: this.supabase.rpc('increment_access_count') })
          .in('memory_id', memoryIds)
      }

      return data || []
    } catch (error) {
      console.error('Failed to retrieve memories from Supabase:', error)
      // Fallback to local memory
      const localMemories = this.simpleMemory.retrieveMemories(agentId, query, memoryType, limit)
      return localMemories.map(this.convertLocalToSupabase)
    }
  }

  async storeThought(
    agentId: string,
    thought: string,
    context: string,
    thoughtType: SupabaseAgentThought['thought_type'],
    confidence: number,
    relatedMemories: string[] = []
  ): Promise<string> {
    try {
      const thoughtId = `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { data, error } = await this.supabase
        .from('agent_thoughts')
        .insert({
          thought_id: thoughtId,
          agent_id: agentId,
          thought,
          context,
          confidence,
          related_memories: relatedMemories,
          thought_type: thoughtType
        })
        .select()
        .single()

      if (error) throw error

      return thoughtId
    } catch (error) {
      console.error('Failed to store thought in Supabase:', error)
      return `thought_local_${Date.now()}`
    }
  }

  async getAgentThoughts(agentId: string, limit: number = 10): Promise<SupabaseAgentThought[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_thoughts')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get thoughts from Supabase:', error)
      return []
    }
  }

  async storeDecision(
    agentId: string,
    symbol: string,
    decision: SupabaseAgentDecision['decision'],
    confidence: number,
    reasoning: string,
    influencingMemories: string[],
    marketContext: Record<string, any>
  ): Promise<string> {
    try {
      const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { data, error } = await this.supabase
        .from('agent_decisions')
        .insert({
          decision_id: decisionId,
          agent_id: agentId,
          symbol,
          decision,
          confidence,
          reasoning,
          influencing_memories: influencingMemories,
          market_context: marketContext,
          executed: false,
          outcome: {}
        })
        .select()
        .single()

      if (error) throw error

      return decisionId
    } catch (error) {
      console.error('Failed to store decision in Supabase:', error)
      return `decision_local_${Date.now()}`
    }
  }

  async getAgentDecisions(agentId: string, limit: number = 10): Promise<SupabaseAgentDecision[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_decisions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get decisions from Supabase:', error)
      return []
    }
  }

  async updateDecisionOutcome(decisionId: string, outcome: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('agent_decisions')
        .update({ 
          outcome,
          executed: true
        })
        .eq('decision_id', decisionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update decision outcome:', error)
      return false
    }
  }

  async createConnection(
    agentId: string,
    sourceMemoryId: string,
    targetMemoryId: string,
    connectionType: SupabaseMemoryConnection['connection_type'],
    strength: number
  ): Promise<string> {
    try {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { data, error } = await this.supabase
        .from('memory_connections')
        .insert({
          connection_id: connectionId,
          agent_id: agentId,
          source_memory_id: sourceMemoryId,
          target_memory_id: targetMemoryId,
          connection_type: connectionType,
          strength
        })
        .select()
        .single()

      if (error) throw error

      return connectionId
    } catch (error) {
      console.error('Failed to create connection in Supabase:', error)
      return `conn_local_${Date.now()}`
    }
  }

  async getConnections(agentId: string, memoryId?: string): Promise<SupabaseMemoryConnection[]> {
    try {
      let queryBuilder = this.supabase
        .from('memory_connections')
        .select('*')
        .eq('agent_id', agentId)

      if (memoryId) {
        queryBuilder = queryBuilder.or(`source_memory_id.eq.${memoryId},target_memory_id.eq.${memoryId}`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get connections from Supabase:', error)
      return []
    }
  }

  // Real-time update management
  addUpdateListener(listener: (update: any) => void) {
    this.updateListeners.push(listener)
  }

  removeUpdateListener(listener: (update: any) => void) {
    const index = this.updateListeners.indexOf(listener)
    if (index > -1) {
      this.updateListeners.splice(index, 1)
    }
  }

  // Utility methods
  private convertLocalToSupabase(local: AgentMemoryNode): SupabaseMemoryNode {
    return {
      id: local.id,
      memory_id: local.id,
      agent_id: local.agentId,
      content: local.content,
      memory_type: local.type,
      importance_score: local.importance,
      metadata: local.metadata,
      access_count: local.accessCount,
      created_at: local.timestamp.toISOString(),
      updated_at: local.timestamp.toISOString()
    }
  }

  async getMemorySystemStats() {
    try {
      const [memoriesResult, thoughtsResult, decisionsResult, connectionsResult] = await Promise.all([
        this.supabase.from('agent_memory_nodes').select('agent_id', { count: 'exact' }),
        this.supabase.from('agent_thoughts').select('agent_id', { count: 'exact' }),
        this.supabase.from('agent_decisions').select('agent_id', { count: 'exact' }),
        this.supabase.from('memory_connections').select('agent_id', { count: 'exact' })
      ])

      return {
        totalMemories: memoriesResult.count || 0,
        totalThoughts: thoughtsResult.count || 0,
        totalDecisions: decisionsResult.count || 0,
        totalConnections: connectionsResult.count || 0,
        lastUpdate: new Date()
      }
    } catch (error) {
      console.error('Failed to get stats from Supabase:', error)
      return this.simpleMemory.getMemorySystemStats()
    }
  }

  // Cleanup
  destroy() {
    if (this.realtimeSubscription) {
      this.supabase.removeChannel(this.realtimeSubscription)
    }
  }
}

// Export singleton instance
let _supabaseMemoryService: SupabaseMemoryService | null = null

export function getSupabaseMemoryService(): SupabaseMemoryService {
  if (!_supabaseMemoryService) {
    _supabaseMemoryService = new SupabaseMemoryService()
  }
  return _supabaseMemoryService
}

export const supabaseMemoryService = getSupabaseMemoryService()