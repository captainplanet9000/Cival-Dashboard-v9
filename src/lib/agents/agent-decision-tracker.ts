'use client'

import { EventEmitter } from 'events'

export interface AgentDecision {
  id: string
  agentId: string
  agentName: string
  type: 'trade' | 'risk' | 'strategy' | 'communication' | 'learning'
  decision: string
  reasoning: string
  confidence: number
  context: {
    marketData?: any
    portfolioState?: any
    riskMetrics?: any
    previousDecisions?: string[]
  }
  outcome?: {
    success: boolean
    result: string
    impact: number
    learnings: string[]
  }
  timestamp: Date
  executionTime?: number
  communicatedTo?: string[]
  relatedDecisions?: string[]
}

export interface AgentCommunication {
  id: string
  fromAgent: string
  toAgent: string
  messageType: 'signal' | 'advice' | 'warning' | 'coordination' | 'data_share'
  content: string
  data?: any
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  acknowledged: boolean
  response?: string
}

export interface DecisionPattern {
  id: string
  agentId: string
  pattern: string
  frequency: number
  successRate: number
  contexts: string[]
  lastSeen: Date
  confidence: number
}

class AgentDecisionTracker extends EventEmitter {
  private decisions: Map<string, AgentDecision> = new Map()
  private communications: Map<string, AgentCommunication> = new Map()
  private patterns: Map<string, DecisionPattern> = new Map()
  private readonly STORAGE_KEY = 'cival_agent_decisions'
  private readonly COMM_STORAGE_KEY = 'cival_agent_communications'

  constructor() {
    super()
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize() {
    this.loadFromStorage()
    this.generateMockData()
    console.log(`🧠 Agent Decision Tracker initialized with ${this.decisions.size} decisions`)
  }

  private loadFromStorage() {
    try {
      // Load decisions
      const decisionsStored = localStorage.getItem(this.STORAGE_KEY)
      if (decisionsStored) {
        const decisions = JSON.parse(decisionsStored)
        for (const decision of decisions) {
          decision.timestamp = new Date(decision.timestamp)
          this.decisions.set(decision.id, decision)
        }
      }

      // Load communications
      const commStored = localStorage.getItem(this.COMM_STORAGE_KEY)
      if (commStored) {
        const communications = JSON.parse(commStored)
        for (const comm of communications) {
          comm.timestamp = new Date(comm.timestamp)
          this.communications.set(comm.id, comm)
        }
      }
    } catch (error) {
      console.error('Error loading decisions from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.decisions.values())))
      localStorage.setItem(this.COMM_STORAGE_KEY, JSON.stringify(Array.from(this.communications.values())))
    } catch (error) {
      console.error('Error saving decisions to storage:', error)
    }
  }

  private generateMockData() {
    const mockAgents = [
      'Momentum Master', 'Mean Reversion Pro', 'Arbitrage Hunter',
      'Darvas Box Master', 'Williams Alligator Pro'
    ]

    const mockDecisionTypes = [
      {
        type: 'trade' as const,
        decisions: [
          'Execute BTC long position based on momentum signals',
          'Close ETH position due to resistance level',
          'Enter USDC/ETH swap for arbitrage opportunity',
          'Scale into SOL position with DCA strategy',
          'Exit all positions due to market volatility'
        ]
      },
      {
        type: 'risk' as const,
        decisions: [
          'Reduce position size due to high VaR',
          'Increase stop-loss to 2% for risk management',
          'Diversify portfolio to reduce concentration risk',
          'Limit leverage to 1.5x due to market conditions',
          'Implement portfolio hedging strategy'
        ]
      },
      {
        type: 'strategy' as const,
        decisions: [
          'Switch to range trading in sideways market',
          'Activate trend following mode on breakout',
          'Implement mean reversion for oversold conditions',
          'Adjust parameters based on volatility regime',
          'Enable arbitrage scanning on multiple DEXs'
        ]
      },
      {
        type: 'communication' as const,
        decisions: [
          'Share market analysis with risk management agents',
          'Request portfolio correlation data from other agents',
          'Alert all agents about potential market crash',
          'Coordinate position sizing with portfolio managers',
          'Send technical analysis signals to trading agents'
        ]
      }
    ]

    // Generate mock decisions for the last 24 hours
    for (let i = 0; i < 50; i++) {
      const agent = mockAgents[Math.floor(Math.random() * mockAgents.length)]
      const decisionCategory = mockDecisionTypes[Math.floor(Math.random() * mockDecisionTypes.length)]
      const decision = decisionCategory.decisions[Math.floor(Math.random() * decisionCategory.decisions.length)]
      
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      
      this.recordDecision({
        agentId: `agent_${agent.replace(/\s+/g, '_').toLowerCase()}`,
        agentName: agent,
        type: decisionCategory.type,
        decision,
        reasoning: this.generateReasoning(decisionCategory.type, decision),
        confidence: 0.6 + Math.random() * 0.4,
        context: this.generateContext(decisionCategory.type),
        timestamp
      })
    }

    // Generate mock communications
    for (let i = 0; i < 20; i++) {
      const fromAgent = mockAgents[Math.floor(Math.random() * mockAgents.length)]
      let toAgent = mockAgents[Math.floor(Math.random() * mockAgents.length)]
      while (toAgent === fromAgent) {
        toAgent = mockAgents[Math.floor(Math.random() * mockAgents.length)]
      }

      this.recordCommunication({
        fromAgent,
        toAgent,
        messageType: ['signal', 'advice', 'warning', 'coordination', 'data_share'][Math.floor(Math.random() * 5)] as any,
        content: this.generateCommunicationContent(),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000)
      })
    }
  }

  private generateReasoning(type: string, decision: string): string {
    const reasoningTemplates = {
      trade: [
        'Technical indicators showing strong momentum',
        'Price action breaking key resistance levels',
        'Volume confirming directional bias',
        'Risk-reward ratio favorable at current levels',
        'Market structure supporting this move'
      ],
      risk: [
        'Portfolio exposure exceeding risk limits',
        'Market volatility increasing beyond comfort zone',
        'Correlation between positions too high',
        'Maximum drawdown approaching threshold',
        'Stress test results indicating potential losses'
      ],
      strategy: [
        'Market regime change detected',
        'Strategy performance degrading',
        'New opportunities identified in current conditions',
        'Backtesting results supporting this approach',
        'Machine learning model recommending adjustment'
      ],
      communication: [
        'Critical information needs to be shared',
        'Coordination required for optimal execution',
        'Risk alert needs immediate attention',
        'Collaborative analysis would improve decisions',
        'Portfolio optimization requires agent cooperation'
      ]
    }

    const templates = reasoningTemplates[type as keyof typeof reasoningTemplates] || reasoningTemplates.trade
    return templates[Math.floor(Math.random() * templates.length)]
  }

  private generateContext(type: string): any {
    return {
      marketData: {
        btcPrice: 43000 + (Math.random() - 0.5) * 2000,
        ethPrice: 2300 + (Math.random() - 0.5) * 200,
        vix: 15 + Math.random() * 10,
        trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
      },
      portfolioState: {
        totalValue: 50000 + Math.random() * 100000,
        exposure: Math.random() * 0.8,
        pnl: (Math.random() - 0.5) * 5000
      },
      riskMetrics: {
        var95: Math.random() * 0.05,
        sharpe: 0.5 + Math.random() * 1.5,
        maxDrawdown: Math.random() * 0.15
      }
    }
  }

  private generateCommunicationContent(): string {
    const messages = [
      'BTC showing strong momentum, consider increasing allocation',
      'Risk metrics indicating potential downturn, reduce exposure',
      'Arbitrage opportunity detected on ETH/USDC pair',
      'Portfolio correlation too high, need diversification',
      'Technical analysis suggests trend reversal incoming',
      'Market making strategy performing well in current conditions',
      'Options flow indicating institutional buying interest',
      'Cross-asset analysis revealing hidden opportunities'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  recordDecision(params: Omit<AgentDecision, 'id'>): AgentDecision {
    const id = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const decision: AgentDecision = {
      id,
      ...params
    }

    this.decisions.set(id, decision)
    this.analyzePattern(decision)
    this.saveToStorage()
    this.emit('decisionRecorded', decision)

    return decision
  }

  recordCommunication(params: Omit<AgentCommunication, 'id' | 'acknowledged'>): AgentCommunication {
    const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const communication: AgentCommunication = {
      id,
      acknowledged: false,
      ...params
    }

    this.communications.set(id, communication)
    this.saveToStorage()
    this.emit('communicationRecorded', communication)

    return communication
  }

  updateDecisionOutcome(decisionId: string, outcome: AgentDecision['outcome']) {
    const decision = this.decisions.get(decisionId)
    if (decision) {
      decision.outcome = outcome
      this.saveToStorage()
      this.emit('decisionUpdated', decision)
    }
  }

  private analyzePattern(decision: AgentDecision) {
    const patternKey = `${decision.agentId}_${decision.type}_${decision.decision.substring(0, 20)}`
    
    let pattern = this.patterns.get(patternKey)
    if (!pattern) {
      pattern = {
        id: patternKey,
        agentId: decision.agentId,
        pattern: decision.decision,
        frequency: 0,
        successRate: 0,
        contexts: [],
        lastSeen: decision.timestamp,
        confidence: 0
      }
      this.patterns.set(patternKey, pattern)
    }

    pattern.frequency++
    pattern.lastSeen = decision.timestamp
    pattern.confidence = Math.min(pattern.frequency / 10, 1)

    if (decision.outcome) {
      const totalOutcomes = Array.from(this.decisions.values())
        .filter(d => d.agentId === decision.agentId && d.type === decision.type && d.outcome)
        .length
      
      const successfulOutcomes = Array.from(this.decisions.values())
        .filter(d => d.agentId === decision.agentId && d.type === decision.type && d.outcome?.success)
        .length

      pattern.successRate = totalOutcomes > 0 ? successfulOutcomes / totalOutcomes : 0
    }
  }

  getDecisionsForAgent(agentId: string): AgentDecision[] {
    return Array.from(this.decisions.values())
      .filter(d => d.agentId === agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getCommunicationsForAgent(agentId: string): AgentCommunication[] {
    return Array.from(this.communications.values())
      .filter(c => c.fromAgent === agentId || c.toAgent === agentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getRecentDecisions(limit: number = 50): AgentDecision[] {
    return Array.from(this.decisions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  getRecentCommunications(limit: number = 20): AgentCommunication[] {
    return Array.from(this.communications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  getPatternsForAgent(agentId: string): DecisionPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.agentId === agentId)
      .sort((a, b) => b.frequency - a.frequency)
  }

  getDecisionStats() {
    const decisions = Array.from(this.decisions.values())
    const communications = Array.from(this.communications.values())
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = decisions.filter(d => d.timestamp > last24h)
    
    const typeDistribution = decisions.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length || 0
    
    const successfulDecisions = decisions.filter(d => d.outcome?.success).length
    const totalWithOutcomes = decisions.filter(d => d.outcome).length
    const successRate = totalWithOutcomes > 0 ? successfulDecisions / totalWithOutcomes : 0

    return {
      totalDecisions: decisions.length,
      recentDecisions: recent.length,
      totalCommunications: communications.length,
      typeDistribution,
      avgConfidence,
      successRate,
      totalPatterns: this.patterns.size
    }
  }

  getCommunicationNetwork() {
    const communications = Array.from(this.communications.values())
    const nodes = new Set<string>()
    const edges: { from: string; to: string; weight: number }[] = []

    communications.forEach(comm => {
      nodes.add(comm.fromAgent)
      nodes.add(comm.toAgent)
      
      const existingEdge = edges.find(e => e.from === comm.fromAgent && e.to === comm.toAgent)
      if (existingEdge) {
        existingEdge.weight++
      } else {
        edges.push({ from: comm.fromAgent, to: comm.toAgent, weight: 1 })
      }
    })

    return {
      nodes: Array.from(nodes),
      edges
    }
  }
}

// Lazy initialization to prevent circular dependencies
let _agentDecisionTrackerInstance: AgentDecisionTracker | null = null

export const getAgentDecisionTracker = (): AgentDecisionTracker => {
  if (!_agentDecisionTrackerInstance) {
    _agentDecisionTrackerInstance = new AgentDecisionTracker()
  }
  return _agentDecisionTrackerInstance
}

// Backward compatibility
export const agentDecisionTracker = {
  get instance() {
    return getAgentDecisionTracker()
  }
}

export default agentDecisionTracker