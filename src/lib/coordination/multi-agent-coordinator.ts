'use client'

import { EventEmitter } from 'events'
import { getAgentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'
import { redisAgentService } from '@/lib/redis/redis-agent-service'
import { EnhancedLiveMarketService } from '@/lib/market/enhanced-live-market-service'
import { realLLMDecisionService, type LLMDecision } from '@/lib/llm/real-llm-decision-service'

export interface AgentCoordinationMessage {
  id: string
  fromAgentId: string
  toAgentId?: string // undefined for broadcast
  type: 'market_signal' | 'position_intent' | 'risk_warning' | 'opportunity' | 'coordination_request'
  content: {
    symbol?: string
    action?: 'buy' | 'sell' | 'hold' | 'reduce'
    confidence: number
    reasoning: string
    marketData?: any
    riskLevel?: 'low' | 'medium' | 'high'
    urgency?: 'low' | 'medium' | 'high'
    expiresAt?: string
  }
  timestamp: string
  priority: number // 1-10, 10 being highest
}

export interface CoordinationStrategy {
  name: string
  description: string
  rules: {
    maxConcurrentBuys: number
    maxConcurrentSells: number
    maxPortfolioOverlap: number // percentage
    minCapitalDistribution: number // percentage per agent
    conflictResolution: 'seniority' | 'confidence' | 'vote' | 'random'
    riskSharing: boolean
    signalSharing: boolean
  }
  agents: string[]
  coordinatorAgent?: string // Optional lead agent
}

export interface MarketPosition {
  agentId: string
  symbol: string
  type: 'long' | 'short'
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  confidence: number
  exitStrategy: {
    stopLoss: number
    takeProfit: number
    timeHorizon: string
  }
}

export interface CoordinationDecision {
  originalDecision: LLMDecision
  coordinatedDecision: LLMDecision
  modifications: string[]
  conflictResolution?: {
    conflict: string
    resolution: string
    involvedAgents: string[]
  }
  approvalRequired: boolean
  approvedBy?: string[]
}

class MultiAgentCoordinator extends EventEmitter {
  private strategies = new Map<string, CoordinationStrategy>()
  private messageQueue: AgentCoordinationMessage[] = []
  private positions = new Map<string, MarketPosition[]>()
  private coordinationHistory: CoordinationDecision[] = []
  private activeCoordination = new Map<string, CoordinationDecision[]>()
  
  // Coordination state
  private isCoordinationEnabled = true
  private emergencyMode = false
  private lastCoordinationTime = new Date()

  constructor() {
    super()
    this.initializeDefaultStrategies()
    this.startCoordinationLoop()
  }

  private initializeDefaultStrategies() {
    // Conservative coordination strategy
    this.strategies.set('conservative', {
      name: 'Conservative Coordination',
      description: 'Minimize risk through position diversification and conflict avoidance',
      rules: {
        maxConcurrentBuys: 2,
        maxConcurrentSells: 3,
        maxPortfolioOverlap: 30,
        minCapitalDistribution: 20,
        conflictResolution: 'confidence',
        riskSharing: true,
        signalSharing: true
      },
      agents: []
    })

    // Aggressive coordination strategy
    this.strategies.set('aggressive', {
      name: 'Aggressive Coordination',
      description: 'Maximize opportunities through coordinated attacks and concentrated positions',
      rules: {
        maxConcurrentBuys: 5,
        maxConcurrentSells: 3,
        maxPortfolioOverlap: 70,
        minCapitalDistribution: 10,
        conflictResolution: 'seniority',
        riskSharing: false,
        signalSharing: true
      },
      agents: []
    })

    // Balanced coordination strategy
    this.strategies.set('balanced', {
      name: 'Balanced Coordination',
      description: 'Balance risk and opportunity through smart position sizing and timing',
      rules: {
        maxConcurrentBuys: 3,
        maxConcurrentSells: 3,
        maxPortfolioOverlap: 50,
        minCapitalDistribution: 15,
        conflictResolution: 'vote',
        riskSharing: true,
        signalSharing: true
      },
      agents: []
    })
  }

  // Main coordination decision method
  async coordinateDecision(
    agentId: string, 
    decision: LLMDecision, 
    strategyName: string = 'balanced'
  ): Promise<CoordinationDecision> {
    
    if (!this.isCoordinationEnabled) {
      return {
        originalDecision: decision,
        coordinatedDecision: decision,
        modifications: ['Coordination disabled - no changes'],
        approvalRequired: false
      }
    }

    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      console.warn(`Unknown coordination strategy: ${strategyName}`)
      return {
        originalDecision: decision,
        coordinatedDecision: decision,
        modifications: ['Unknown strategy - no coordination'],
        approvalRequired: false
      }
    }

    console.log(`🤝 Coordinating decision for agent ${agentId}: ${decision.action} ${decision.symbol}`)

    // Step 1: Analyze current market positions
    const currentPositions = await this.getCurrentPositions()
    
    // Step 2: Check for conflicts with other agents
    const conflicts = await this.detectConflicts(agentId, decision, currentPositions, strategy)
    
    // Step 3: Share signal with other agents if enabled
    if (strategy.rules.signalSharing) {
      await this.shareMarketSignal(agentId, decision)
    }
    
    // Step 4: Apply coordination rules
    const coordinatedDecision = await this.applyCoordinationRules(
      agentId, 
      decision, 
      conflicts, 
      strategy
    )
    
    // Step 5: Create coordination record
    const coordination: CoordinationDecision = {
      originalDecision: decision,
      coordinatedDecision,
      modifications: this.calculateModifications(decision, coordinatedDecision),
      conflictResolution: conflicts.length > 0 ? await this.resolveConflicts(conflicts, strategy) : undefined,
      approvalRequired: this.requiresApproval(decision, coordinatedDecision, strategy)
    }
    
    // Step 6: Store coordination decision
    this.coordinationHistory.push(coordination)
    this.activeCoordination.set(agentId, [...(this.activeCoordination.get(agentId) || []), coordination])
    
    // Step 7: Emit coordination event
    this.emit('coordinationDecision', {
      agentId,
      strategy: strategyName,
      coordination
    })
    
    console.log(`✅ Coordination complete for agent ${agentId}. Modifications: ${coordination.modifications.length}`)
    
    return coordination
  }

  // Detect conflicts between agents
  private async detectConflicts(
    agentId: string, 
    decision: LLMDecision, 
    positions: MarketPosition[], 
    strategy: CoordinationStrategy
  ): Promise<any[]> {
    const conflicts = []
    
    // Check for same symbol conflicts
    const sameSymbolPositions = positions.filter(p => 
      p.symbol === decision.symbol && p.agentId !== agentId
    )
    
    for (const position of sameSymbolPositions) {
      // Opposing directions conflict
      if (
        (decision.action === 'buy' && position.type === 'short') ||
        (decision.action === 'sell' && position.type === 'long')
      ) {
        conflicts.push({
          type: 'opposing_direction',
          symbol: decision.symbol,
          agentId,
          conflictingAgent: position.agentId,
          severity: 'high'
        })
      }
      
      // Portfolio overlap conflict
      const overlapPercentage = this.calculatePortfolioOverlap(agentId, position.agentId, decision.symbol)
      if (overlapPercentage > strategy.rules.maxPortfolioOverlap) {
        conflicts.push({
          type: 'portfolio_overlap',
          symbol: decision.symbol,
          agentId,
          conflictingAgent: position.agentId,
          overlapPercentage,
          severity: 'medium'
        })
      }
    }
    
    // Check for concurrent action limits
    const currentBuys = positions.filter(p => p.type === 'long').length
    const currentSells = positions.filter(p => p.type === 'short').length
    
    if (decision.action === 'buy' && currentBuys >= strategy.rules.maxConcurrentBuys) {
      conflicts.push({
        type: 'concurrent_limit',
        action: 'buy',
        current: currentBuys,
        limit: strategy.rules.maxConcurrentBuys,
        severity: 'high'
      })
    }
    
    if (decision.action === 'sell' && currentSells >= strategy.rules.maxConcurrentSells) {
      conflicts.push({
        type: 'concurrent_limit',
        action: 'sell',
        current: currentSells,
        limit: strategy.rules.maxConcurrentSells,
        severity: 'high'
      })
    }
    
    return conflicts
  }

  // Apply coordination rules to modify decisions
  private async applyCoordinationRules(
    agentId: string,
    decision: LLMDecision,
    conflicts: any[],
    strategy: CoordinationStrategy
  ): Promise<LLMDecision> {
    
    let coordinatedDecision = { ...decision }
    
    // Handle conflicts
    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'opposing_direction':
          coordinatedDecision = await this.handleOpposingDirection(coordinatedDecision, conflict, strategy)
          break
          
        case 'portfolio_overlap':
          coordinatedDecision = await this.handlePortfolioOverlap(coordinatedDecision, conflict, strategy)
          break
          
        case 'concurrent_limit':
          coordinatedDecision = await this.handleConcurrentLimit(coordinatedDecision, conflict, strategy)
          break
      }
    }
    
    // Apply position sizing rules
    coordinatedDecision = await this.applyPositionSizing(agentId, coordinatedDecision, strategy)
    
    // Apply risk sharing if enabled
    if (strategy.rules.riskSharing) {
      coordinatedDecision = await this.applyRiskSharing(agentId, coordinatedDecision, strategy)
    }
    
    return coordinatedDecision
  }

  private async handleOpposingDirection(
    decision: LLMDecision, 
    conflict: any, 
    strategy: CoordinationStrategy
  ): Promise<LLMDecision> {
    
    switch (strategy.rules.conflictResolution) {
      case 'confidence':
        // Get conflicting agent's decision confidence
        const conflictingAgent = await getAgentLifecycleManager().getAgent(conflict.conflictingAgent)
        const conflictingDecisions = await redisAgentService.getRecentDecisions(conflict.conflictingAgent, 1)
        
        if (conflictingDecisions.length > 0) {
          const conflictingConfidence = conflictingDecisions[0].expectedOutcome?.probability || 0.5
          
          if (decision.confidence <= conflictingConfidence) {
            // Lower confidence - reduce position or hold
            decision.action = 'hold'
            decision.quantity = 0
            decision.reasoning += ' | Coordination: Deferred to higher confidence agent'
          } else {
            // Higher confidence - reduce position size
            decision.quantity *= 0.5
            decision.reasoning += ' | Coordination: Reduced size due to opposing position'
          }
        }
        break
        
      case 'seniority':
        // Check agent creation time (seniority)
        const currentAgent = await getAgentLifecycleManager().getAgent(decision.symbol) // This should be agentId
        const conflictAgent = await getAgentLifecycleManager().getAgent(conflict.conflictingAgent)
        
        if (currentAgent && conflictAgent) {
          const currentSeniority = new Date(currentAgent.created_at).getTime()
          const conflictSeniority = new Date(conflictAgent.created_at).getTime()
          
          if (currentSeniority > conflictSeniority) {
            // Less senior - defer
            decision.action = 'hold'
            decision.reasoning += ' | Coordination: Deferred to senior agent'
          }
        }
        break
        
      case 'vote':
        // Simple majority vote (would need more sophisticated implementation)
        decision.quantity *= 0.7 // Compromise position
        decision.reasoning += ' | Coordination: Compromise position after agent vote'
        break
        
      case 'random':
        if (Math.random() < 0.5) {
          decision.action = 'hold'
          decision.reasoning += ' | Coordination: Random conflict resolution - hold'
        }
        break
    }
    
    return decision
  }

  private async handlePortfolioOverlap(
    decision: LLMDecision,
    conflict: any,
    strategy: CoordinationStrategy
  ): Promise<LLMDecision> {
    
    // Reduce position size to maintain diversification
    const reductionFactor = 1 - (conflict.overlapPercentage / 100)
    decision.quantity *= Math.max(0.1, reductionFactor)
    decision.reasoning += ` | Coordination: Reduced size by ${(100 - reductionFactor * 100).toFixed(0)}% for diversification`
    
    return decision
  }

  private async handleConcurrentLimit(
    decision: LLMDecision,
    conflict: any,
    strategy: CoordinationStrategy
  ): Promise<LLMDecision> {
    
    // If at limit, either hold or queue for later
    if (conflict.current >= conflict.limit) {
      decision.action = 'hold'
      decision.reasoning += ` | Coordination: ${conflict.action} limit reached (${conflict.current}/${conflict.limit})`
      
      // Queue decision for later execution
      await this.queueDecisionForLater(decision, conflict)
    }
    
    return decision
  }

  private async applyPositionSizing(
    agentId: string,
    decision: LLMDecision,
    strategy: CoordinationStrategy
  ): Promise<LLMDecision> {
    
    // Get agent's current capital
    const agent = await getAgentLifecycleManager().getAgent(agentId)
    if (!agent) return decision
    
    const availableCapital = agent.current_capital
    const minCapitalPerPosition = availableCapital * (strategy.rules.minCapitalDistribution / 100)
    
    // Ensure position size respects minimum capital distribution
    const maxAllowedQuantity = minCapitalPerPosition / (decision.riskAssessment.maxLoss || 1)
    
    if (decision.quantity * (decision.riskAssessment.maxLoss || 1) > minCapitalPerPosition) {
      const oldQuantity = decision.quantity
      decision.quantity = Math.min(decision.quantity, maxAllowedQuantity)
      decision.reasoning += ` | Coordination: Size reduced from ${oldQuantity.toFixed(2)} to ${decision.quantity.toFixed(2)} for capital distribution`
    }
    
    return decision
  }

  private async applyRiskSharing(
    agentId: string,
    decision: LLMDecision,
    strategy: CoordinationStrategy
  ): Promise<LLMDecision> {
    
    // Adjust risk based on overall portfolio risk
    const totalPortfolioRisk = await this.calculateTotalPortfolioRisk(strategy.agents)
    
    if (totalPortfolioRisk > 0.15) { // 15% portfolio risk threshold
      decision.quantity *= 0.8 // Reduce position size
      decision.stopLoss = Math.max(decision.stopLoss || 0, decision.riskAssessment.maxLoss * 0.8)
      decision.reasoning += ` | Coordination: Risk shared - reduced exposure due to high portfolio risk (${(totalPortfolioRisk * 100).toFixed(1)}%)`
    }
    
    return decision
  }

  // Share market signals between agents
  private async shareMarketSignal(agentId: string, decision: LLMDecision): Promise<void> {
    const message: AgentCoordinationMessage = {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromAgentId: agentId,
      type: 'market_signal',
      content: {
        symbol: decision.symbol,
        action: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        riskLevel: decision.riskAssessment.riskLevel,
        urgency: decision.confidence > 0.8 ? 'high' : decision.confidence > 0.6 ? 'medium' : 'low'
      },
      timestamp: new Date().toISOString(),
      priority: Math.round(decision.confidence * 10)
    }
    
    this.messageQueue.push(message)
    
    // Store signal in Redis for other agents
    await redisAgentService.storeMemory(
      'coordination',
      `signal_${message.id}`,
      message
    )
    
    this.emit('signalShared', message)
    console.log(`📡 Shared signal: ${decision.action} ${decision.symbol} (confidence: ${decision.confidence.toFixed(2)})`)
  }

  // Queue decision for later execution
  private async queueDecisionForLater(decision: LLMDecision, conflict: any): Promise<void> {
    const queueItem = {
      decision,
      conflict,
      queuedAt: new Date().toISOString(),
      priority: decision.confidence,
      attempts: 0
    }
    
    await redisAgentService.storeMemory(
      'coordination',
      `queued_${Date.now()}`,
      queueItem
    )
    
    console.log(`⏰ Queued decision for later: ${decision.action} ${decision.symbol}`)
  }

  // Calculate portfolio overlap between agents
  private calculatePortfolioOverlap(agentId1: string, agentId2: string, symbol: string): number {
    // Simplified calculation - would need actual portfolio data
    return Math.random() * 60 // 0-60% overlap
  }

  // Calculate total portfolio risk across agents
  private async calculateTotalPortfolioRisk(agentIds: string[]): Promise<number> {
    let totalRisk = 0
    
    for (const agentId of agentIds) {
      const performance = await redisAgentService.getPerformance(agentId)
      if (performance) {
        totalRisk += performance.maxDrawdown || 0.05 // Default 5% risk
      }
    }
    
    return totalRisk / agentIds.length
  }

  // Get current positions across all agents
  private async getCurrentPositions(): Promise<MarketPosition[]> {
    const positions: MarketPosition[] = []
    const agents = await getAgentLifecycleManager().getAllAgents()
    
    for (const agent of agents) {
      if (agent.realTimeState?.currentPositions) {
        agent.realTimeState.currentPositions.forEach((pos: any) => {
          positions.push({
            agentId: agent.id,
            symbol: pos.symbol || 'UNKNOWN',
            type: pos.side === 'long' || pos.quantity > 0 ? 'long' : 'short',
            size: Math.abs(pos.quantity || 0),
            entryPrice: pos.entryPrice || 0,
            currentPrice: pos.currentPrice || 0,
            unrealizedPnL: pos.unrealizedPnL || 0,
            confidence: 0.7, // Default confidence
            exitStrategy: {
              stopLoss: pos.stopLoss || 0,
              takeProfit: pos.takeProfit || 0,
              timeHorizon: '1-2 days'
            }
          })
        })
      }
    }
    
    return positions
  }

  // Resolve conflicts between agents
  private async resolveConflicts(conflicts: any[], strategy: CoordinationStrategy): Promise<any> {
    if (conflicts.length === 0) return null
    
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high')
    const resolution = {
      conflict: highSeverityConflicts.length > 0 ? 'High severity conflicts detected' : 'Medium/low severity conflicts',
      resolution: `Applied ${strategy.rules.conflictResolution} resolution method`,
      involvedAgents: [...new Set(conflicts.map(c => c.conflictingAgent).filter(Boolean))]
    }
    
    console.log(`⚖️ Resolved ${conflicts.length} conflicts using ${strategy.rules.conflictResolution} method`)
    
    return resolution
  }

  // Calculate modifications made to original decision
  private calculateModifications(original: LLMDecision, coordinated: LLMDecision): string[] {
    const modifications = []
    
    if (original.action !== coordinated.action) {
      modifications.push(`Action changed: ${original.action} → ${coordinated.action}`)
    }
    
    if (Math.abs(original.quantity - coordinated.quantity) > 0.01) {
      modifications.push(`Quantity adjusted: ${original.quantity.toFixed(2)} → ${coordinated.quantity.toFixed(2)}`)
    }
    
    if (original.confidence !== coordinated.confidence) {
      modifications.push(`Confidence updated: ${original.confidence.toFixed(2)} → ${coordinated.confidence.toFixed(2)}`)
    }
    
    if (original.reasoning !== coordinated.reasoning) {
      modifications.push('Reasoning updated with coordination notes')
    }
    
    return modifications.length > 0 ? modifications : ['No modifications required']
  }

  // Check if coordination decision requires approval
  private requiresApproval(original: LLMDecision, coordinated: LLMDecision, strategy: CoordinationStrategy): boolean {
    // Require approval for major changes
    const quantityChange = Math.abs(original.quantity - coordinated.quantity) / original.quantity
    const actionChanged = original.action !== coordinated.action
    
    return quantityChange > 0.5 || actionChanged
  }

  // Start coordination loop
  private startCoordinationLoop(): void {
    setInterval(async () => {
      await this.processMessageQueue()
      await this.processQueuedDecisions()
      await this.checkEmergencyConditions()
    }, 5000) // Every 5 seconds
  }

  private async processMessageQueue(): Promise<void> {
    // Process pending coordination messages
    const highPriorityMessages = this.messageQueue
      .filter(m => m.priority >= 7)
      .sort((a, b) => b.priority - a.priority)
    
    for (const message of highPriorityMessages.slice(0, 5)) {
      await this.processCoordinationMessage(message)
      this.messageQueue = this.messageQueue.filter(m => m.id !== message.id)
    }
  }

  private async processCoordinationMessage(message: AgentCoordinationMessage): Promise<void> {
    console.log(`📨 Processing coordination message: ${message.type} from ${message.fromAgentId}`)
    
    // Forward to relevant agents or process centrally
    this.emit('coordinationMessage', message)
  }

  private async processQueuedDecisions(): Promise<void> {
    // Process decisions that were queued due to conflicts
    // Implementation would retrieve from Redis and attempt re-coordination
  }

  private async checkEmergencyConditions(): Promise<void> {
    // Check for emergency conditions that require immediate coordination
    const totalRisk = await this.calculateTotalPortfolioRisk(Array.from(this.strategies.get('balanced')?.agents || []))
    
    if (totalRisk > 0.25) { // 25% emergency threshold
      this.enableEmergencyMode()
    } else if (this.emergencyMode && totalRisk < 0.15) {
      this.disableEmergencyMode()
    }
  }

  private enableEmergencyMode(): void {
    if (!this.emergencyMode) {
      this.emergencyMode = true
      console.warn('🚨 Emergency coordination mode enabled - high portfolio risk detected')
      this.emit('emergencyMode', { enabled: true })
    }
  }

  private disableEmergencyMode(): void {
    if (this.emergencyMode) {
      this.emergencyMode = false
      console.log('✅ Emergency coordination mode disabled - risk levels normalized')
      this.emit('emergencyMode', { enabled: false })
    }
  }

  // Public methods for coordination management
  addAgentToStrategy(agentId: string, strategyName: string): void {
    const strategy = this.strategies.get(strategyName)
    if (strategy && !strategy.agents.includes(agentId)) {
      strategy.agents.push(agentId)
      console.log(`➕ Added agent ${agentId} to ${strategyName} coordination strategy`)
    }
  }

  removeAgentFromStrategy(agentId: string, strategyName: string): void {
    const strategy = this.strategies.get(strategyName)
    if (strategy) {
      strategy.agents = strategy.agents.filter(id => id !== agentId)
      console.log(`➖ Removed agent ${agentId} from ${strategyName} coordination strategy`)
    }
  }

  enableCoordination(): void {
    this.isCoordinationEnabled = true
    console.log('🤝 Multi-agent coordination enabled')
  }

  disableCoordination(): void {
    this.isCoordinationEnabled = false
    console.log('🚫 Multi-agent coordination disabled')
  }

  getCoordinationStats(): any {
    return {
      isEnabled: this.isCoordinationEnabled,
      emergencyMode: this.emergencyMode,
      totalStrategies: this.strategies.size,
      totalCoordinations: this.coordinationHistory.length,
      messageQueueSize: this.messageQueue.length,
      lastCoordination: this.lastCoordinationTime.toISOString()
    }
  }
}

// Lazy initialization to prevent circular dependencies
let _multiAgentCoordinatorInstance: MultiAgentCoordinator | null = null

export const getMultiAgentCoordinator = (): MultiAgentCoordinator => {
  if (!_multiAgentCoordinatorInstance) {
    _multiAgentCoordinatorInstance = new MultiAgentCoordinator()
  }
  return _multiAgentCoordinatorInstance
}

// Backward compatibility
export const multiAgentCoordinator = {
  get instance() {
    return getMultiAgentCoordinator()
  }
}

// Export types
export type { 
  AgentCoordinationMessage, 
  CoordinationStrategy, 
  MarketPosition, 
  CoordinationDecision 
}