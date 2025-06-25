/**
 * LangGraph Trading Orchestrator
 * Advanced multi-agent coordination using LangGraph workflows
 * Replaces the basic AutonomousTradingOrchestrator with intelligent LLM-powered agents
 */

import { EventEmitter } from 'events'
// import { StateGraph, END } from '@langchain/langgraph'
// Temporarily disabled for client build compatibility
const StateGraph: any = null
const END: any = null
import { langChainService } from './LangChainService'
import { tradingWorkflowEngine, TradingState, TradingDecision } from './TradingWorkflow'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'
import { langChainMCPIntegration } from './MCPIntegration'
import { agentMemorySystem } from './AgentMemorySystem'
import { advancedLearningCoordinator } from './AdvancedLearningCoordinator'

export interface LangGraphAgent {
  id: string
  name: string
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'risk_manager' | 'coordinator' | 'sentiment'
  status: 'active' | 'paused' | 'stopped' | 'error'
  llmModel: string
  specialization: string[]
  portfolio: string
  performance: AgentPerformance
  lastDecision: TradingDecision | null
  config: AgentConfig
  workflowState: any
}

export interface AgentPerformance {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  averageReturn: number
  sharpeRatio: number
  maxDrawdown: number
  averageDecisionTime: number
  confidenceAccuracy: number
  lastUpdated: Date
}

export interface AgentConfig {
  symbols: string[]
  maxPositionSize: number
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  decisionFrequency: number // minutes between decisions
  llmPreference: 'openai' | 'anthropic' | 'auto'
  enableSentimentAnalysis: boolean
  enableRiskOverride: boolean
  coordinationMode: 'independent' | 'collaborative' | 'consensus'
}

export interface MultiAgentState {
  marketConditions: any
  activeSymbols: string[]
  agents: LangGraphAgent[]
  decisions: TradingDecision[]
  consensus: any
  coordination: any
  riskAssessment: any
  executionQueue: any[]
  timestamp: number
}

export class LangGraphTradingOrchestrator extends EventEmitter {
  private agents: Map<string, LangGraphAgent> = new Map()
  private multiAgentWorkflow: StateGraph<MultiAgentState>
  private isRunning: boolean = false
  private coordinationInterval: NodeJS.Timeout | null = null
  private performanceTracking: Map<string, any[]> = new Map()

  constructor() {
    super()
    this.multiAgentWorkflow = this.createMultiAgentWorkflow()
    this.initializeDefaultAgents().catch(error => 
      console.error('Failed to initialize default agents:', error)
    )
    console.log('🧠 LangGraph Trading Orchestrator initialized')
  }

  /**
   * Create the multi-agent coordination workflow
   */
  private createMultiAgentWorkflow(): StateGraph<MultiAgentState> {
    const workflow = new StateGraph<MultiAgentState>({
      channels: {
        marketConditions: { value: null },
        activeSymbols: { value: [] },
        agents: { value: [] },
        decisions: { value: [] },
        consensus: { value: null },
        coordination: { value: null },
        riskAssessment: { value: null },
        executionQueue: { value: [] },
        timestamp: { value: Date.now() }
      }
    })

    workflow
      .addNode('assess_market', this.assessMarketConditions.bind(this))
      .addNode('gather_agent_insights', this.gatherAgentInsights.bind(this))
      .addNode('coordinate_decisions', this.coordinateDecisions.bind(this))
      .addNode('risk_management', this.performRiskManagement.bind(this))
      .addNode('execute_consensus', this.executeConsensus.bind(this))
      .addNode('monitor_performance', this.monitorPerformance.bind(this))

    workflow
      .addEdge('assess_market', 'gather_agent_insights')
      .addEdge('gather_agent_insights', 'coordinate_decisions')
      .addEdge('coordinate_decisions', 'risk_management')
      .addConditionalEdges(
        'risk_management',
        this.shouldExecuteDecisions.bind(this),
        {
          execute: 'execute_consensus',
          hold: 'monitor_performance',
          reassess: 'gather_agent_insights'
        }
      )
      .addEdge('execute_consensus', 'monitor_performance')
      .addEdge('monitor_performance', END)

    workflow.setEntryPoint('assess_market')

    return workflow
  }

  /**
   * Initialize default LangGraph agents
   */
  private async initializeDefaultAgents(): Promise<void> {
    const defaultAgents = [
      {
        id: 'momentum_agent_llm',
        name: 'LLM Momentum Trader',
        type: 'momentum' as const,
        llmModel: 'gpt-4o-mini',
        specialization: ['trend_following', 'breakout_detection', 'momentum_signals'],
        symbols: ['BTC/USDT', 'ETH/USDT'],
        config: {
          symbols: ['BTC/USDT', 'ETH/USDT'],
          maxPositionSize: 50000,
          riskTolerance: 'moderate' as const,
          decisionFrequency: 15,
          llmPreference: 'openai' as const,
          enableSentimentAnalysis: true,
          enableRiskOverride: true,
          coordinationMode: 'collaborative' as const
        }
      },
      {
        id: 'mean_reversion_agent_llm',
        name: 'LLM Mean Reversion Specialist',
        type: 'mean_reversion' as const,
        llmModel: 'claude-3-haiku',
        specialization: ['oversold_detection', 'resistance_levels', 'volatility_analysis'],
        symbols: ['BTC/USDT', 'SOL/USDT'],
        config: {
          symbols: ['BTC/USDT', 'SOL/USDT'],
          maxPositionSize: 30000,
          riskTolerance: 'conservative' as const,
          decisionFrequency: 30,
          llmPreference: 'anthropic' as const,
          enableSentimentAnalysis: false,
          enableRiskOverride: true,
          coordinationMode: 'consensus' as const
        }
      },
      {
        id: 'risk_manager_llm',
        name: 'LLM Risk Coordinator',
        type: 'risk_manager' as const,
        llmModel: 'claude-3-sonnet',
        specialization: ['portfolio_risk', 'correlation_analysis', 'position_sizing'],
        symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
        config: {
          symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
          maxPositionSize: 100000,
          riskTolerance: 'conservative' as const,
          decisionFrequency: 10,
          llmPreference: 'anthropic' as const,
          enableSentimentAnalysis: true,
          enableRiskOverride: false,
          coordinationMode: 'independent' as const
        }
      },
      {
        id: 'sentiment_agent_llm',
        name: 'LLM Sentiment Analyst',
        type: 'sentiment' as const,
        llmModel: 'gpt-3.5-turbo',
        specialization: ['news_analysis', 'social_sentiment', 'market_mood'],
        symbols: ['BTC/USDT', 'ETH/USDT'],
        config: {
          symbols: ['BTC/USDT', 'ETH/USDT'],
          maxPositionSize: 25000,
          riskTolerance: 'moderate' as const,
          decisionFrequency: 60,
          llmPreference: 'openai' as const,
          enableSentimentAnalysis: true,
          enableRiskOverride: true,
          coordinationMode: 'collaborative' as const
        }
      }
    ]

    for (const agentData of defaultAgents) {
      const agent: LangGraphAgent = {
        ...agentData,
        status: 'paused',
        portfolio: agentData.id,
        performance: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnL: 0,
          averageReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          averageDecisionTime: 0,
          confidenceAccuracy: 0,
          lastUpdated: new Date()
        },
        lastDecision: null,
        workflowState: null
      }

      this.agents.set(agent.id, agent)

      // Create portfolio for each agent
      persistentTradingEngine.createPortfolio(agent.id, 100000) // $100k starting capital

      // Register agent with MCP integration
      try {
        await langChainMCPIntegration.registerAgent(agent)
        console.log(`🔗 Registered ${agent.name} with MCP tools`)
      } catch (error) {
        console.warn(`⚠️ Failed to register ${agent.name} with MCP:`, error)
      }
    }

    console.log(`✅ Initialized ${this.agents.size} LangGraph agents`)
  }

  /**
   * Multi-agent workflow node: Assess overall market conditions
   */
  private async assessMarketConditions(state: MultiAgentState): Promise<Partial<MultiAgentState>> {
    try {
      console.log('🌍 Assessing market conditions')

      const marketPrompt = `Analyze current overall market conditions and provide assessment:

Consider:
1. Overall market trend (bull/bear/sideways)
2. Volatility levels
3. Market sentiment
4. Major news or events
5. Risk-on vs risk-off environment
6. Recommended trading approach

Provide assessment as JSON with: trend, volatility, sentiment, riskLevel, recommendations`

      const marketAnalysis = await langChainService.generateTradingAnalysis(
        marketPrompt,
        { timestamp: Date.now() },
        { modelPreference: 'anthropic' }
      )

      const activeSymbols = Array.from(new Set(
        Array.from(this.agents.values())
          .filter(agent => agent.status === 'active')
          .flatMap(agent => agent.config.symbols)
      ))

      return {
        marketConditions: marketAnalysis,
        activeSymbols,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Market assessment failed:', error)
      return {
        marketConditions: { error: error.toString(), trend: 'uncertain' },
        timestamp: Date.now()
      }
    }
  }

  /**
   * Multi-agent workflow node: Gather insights from all active agents
   */
  private async gatherAgentInsights(state: MultiAgentState): Promise<Partial<MultiAgentState>> {
    console.log('🤖 Gathering agent insights')

    const activeAgents = Array.from(this.agents.values()).filter(agent => agent.status === 'active')
    const decisions: TradingDecision[] = []

    // Run each agent's analysis in parallel
    const agentPromises = activeAgents.map(async (agent) => {
      try {
        for (const symbol of agent.config.symbols) {
          if (state.activeSymbols.includes(symbol)) {
            const startTime = Date.now()
            
            // Execute individual agent workflow
            const result = await tradingWorkflowEngine.executeTradingWorkflow(agent.id, symbol)
            
            if (result.decision) {
              decisions.push(result.decision)
              
              // Update agent performance tracking
              const decisionTime = Date.now() - startTime
              this.updateAgentPerformance(agent.id, {
                decisionTime,
                confidence: result.confidence
              })
            }

            // Update agent state
            agent.lastDecision = result.decision
            agent.workflowState = result
          }
        }
      } catch (error) {
        console.error(`Agent ${agent.id} analysis failed:`, error)
        agent.status = 'error'
      }
    })

    await Promise.all(agentPromises)

    return {
      agents: Array.from(this.agents.values()),
      decisions
    }
  }

  /**
   * Multi-agent workflow node: Coordinate and synthesize agent decisions
   */
  private async coordinateDecisions(state: MultiAgentState): Promise<Partial<MultiAgentState>> {
    console.log('🤝 Coordinating agent decisions')

    if (state.decisions.length === 0) {
      return {
        consensus: { action: 'hold', reasoning: 'No agent decisions to coordinate' }
      }
    }

    // Group decisions by symbol
    const decisionsBySymbol = state.decisions.reduce((acc, decision) => {
      if (!acc[decision.symbol]) acc[decision.symbol] = []
      acc[decision.symbol].push(decision)
      return acc
    }, {} as Record<string, TradingDecision[]>)

    const coordinationResults: any = {}

    for (const [symbol, decisions] of Object.entries(decisionsBySymbol)) {
      const coordinationPrompt = `Coordinate the following trading decisions for ${symbol}:

Agent Decisions:
${decisions.map((d, i) => `
Agent ${i + 1}: ${d.action} ${d.quantity} at confidence ${d.confidence}%
Reasoning: ${d.reasoning}
Risk Score: ${d.riskScore}
Urgency: ${d.urgency}
`).join('\n')}

Market Conditions: ${JSON.stringify(state.marketConditions)}

Provide coordination decision:
1. Final action (buy/sell/hold)
2. Consensus quantity
3. Confidence level
4. Reasoning for coordination
5. Risk assessment
6. Execution priority

Format as JSON with: action, quantity, confidence, reasoning, riskLevel, priority`

      try {
        const coordination = await langChainService.generateTradingAnalysis(
          coordinationPrompt,
          {
            decisions,
            marketConditions: state.marketConditions,
            symbol
          },
          { modelPreference: 'claude-3-sonnet' }
        )

        coordinationResults[symbol] = coordination
      } catch (error) {
        console.error(`Coordination failed for ${symbol}:`, error)
        coordinationResults[symbol] = {
          action: 'hold',
          reasoning: `Coordination failed: ${error}`,
          confidence: 0
        }
      }
    }

    return {
      coordination: coordinationResults
    }
  }

  /**
   * Multi-agent workflow node: Perform portfolio-level risk management
   */
  private async performRiskManagement(state: MultiAgentState): Promise<Partial<MultiAgentState>> {
    console.log('⚠️ Performing risk management')

    try {
      // Get overall portfolio status
      const portfolios = Array.from(this.agents.values()).map(agent => {
        const portfolio = persistentTradingEngine.getPortfolio(agent.id)
        return { agentId: agent.id, portfolio }
      }).filter(p => p.portfolio)

      const totalValue = portfolios.reduce((sum, p) => sum + (p.portfolio?.totalValue || 0), 0)
      const totalPnL = portfolios.reduce((sum, p) => sum + (p.portfolio?.totalPnL || 0), 0)

      const riskPrompt = `Perform portfolio-level risk management assessment:

Portfolio Overview:
- Total Value: $${totalValue}
- Total P&L: $${totalPnL}
- Number of Active Agents: ${portfolios.length}

Coordinated Decisions: ${JSON.stringify(state.coordination)}
Market Conditions: ${JSON.stringify(state.marketConditions)}

Assess:
1. Portfolio concentration risk
2. Total exposure limits
3. Correlation risk between positions
4. Market volatility impact
5. Risk/reward assessment
6. Execution recommendations

Provide risk assessment as JSON with: overallRisk, concentrationRisk, exposureLimit, correlationRisk, recommendation, maxAllowedExposure`

      const riskAssessment = await langChainService.generateTradingAnalysis(
        riskPrompt,
        {
          portfolios: portfolios.map(p => ({ ...p.portfolio, agentId: p.agentId })),
          coordination: state.coordination,
          marketConditions: state.marketConditions
        },
        { modelPreference: 'claude-3-sonnet' }
      )

      return {
        riskAssessment
      }
    } catch (error) {
      console.error('Risk management failed:', error)
      return {
        riskAssessment: {
          error: error.toString(),
          overallRisk: 100,
          recommendation: 'hold'
        }
      }
    }
  }

  /**
   * Conditional edge: Determine if decisions should be executed
   */
  private shouldExecuteDecisions(state: MultiAgentState): string {
    if (!state.riskAssessment) return 'hold'
    
    const risk = state.riskAssessment
    
    if (risk.error || risk.overallRisk > 80) {
      return 'hold'
    }
    
    if (risk.recommendation === 'reassess') {
      return 'reassess'
    }
    
    return 'execute'
  }

  /**
   * Multi-agent workflow node: Execute consensus decisions
   */
  private async executeConsensus(state: MultiAgentState): Promise<Partial<MultiAgentState>> {
    console.log('🚀 Executing consensus decisions')

    const executionQueue: any[] = []

    try {
      for (const [symbol, coordination] of Object.entries(state.coordination || {})) {
        if (coordination.action !== 'hold') {
          // Find the primary agent for this symbol
          const primaryAgent = Array.from(this.agents.values()).find(agent => 
            agent.config.symbols.includes(symbol) && agent.status === 'active'
          )

          if (primaryAgent && coordination.confidence > 60) {
            try {
              const order = await persistentTradingEngine.placeOrder({
                agentId: primaryAgent.id,
                portfolioId: primaryAgent.id,
                symbol,
                side: coordination.action,
                quantity: coordination.quantity || 1,
                type: 'market',
                timeInForce: 'gtc'
              })

              executionQueue.push({
                orderId: order.id,
                agentId: primaryAgent.id,
                symbol,
                action: coordination.action,
                status: 'executed',
                timestamp: Date.now()
              })

              this.emit('trade:executed', {
                agentId: primaryAgent.id,
                symbol,
                action: coordination.action,
                order
              })

              console.log(`✅ Executed ${coordination.action} for ${symbol} via ${primaryAgent.name}`)
            } catch (error) {
              console.error(`Failed to execute ${coordination.action} for ${symbol}:`, error)
              executionQueue.push({
                agentId: primaryAgent.id,
                symbol,
                action: coordination.action,
                status: 'failed',
                error: error.toString(),
                timestamp: Date.now()
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Execution failed:', error)
    }

    return {
      executionQueue
    }
  }

  /**
   * Multi-agent workflow node: Monitor performance and update metrics
   */
  private async monitorPerformance(state: MultiAgentState): Promise<Partial<MultiAgentState>> {
    console.log('📊 Monitoring performance')

    // Update performance metrics for all agents
    for (const agent of state.agents) {
      const portfolio = persistentTradingEngine.getPortfolio(agent.id)
      if (portfolio) {
        this.updateAgentPerformance(agent.id, {
          portfolioValue: portfolio.totalValue,
          pnl: portfolio.totalPnL
        })
      }
    }

    this.emit('performance:updated', {
      agents: Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        performance: agent.performance
      }))
    })

    return {
      timestamp: Date.now()
    }
  }

  /**
   * Update agent performance metrics
   */
  private updateAgentPerformance(agentId: string, data: any): void {
    const agent = this.agents.get(agentId)
    if (!agent) return

    const history = this.performanceTracking.get(agentId) || []
    history.push({ ...data, timestamp: Date.now() })
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift()
    }
    
    this.performanceTracking.set(agentId, history)

    // Update performance metrics
    if (data.portfolioValue !== undefined) {
      const initialValue = 100000 // Starting capital
      const totalReturn = ((data.portfolioValue - initialValue) / initialValue) * 100
      
      agent.performance.totalPnL = data.pnl || 0
      agent.performance.averageReturn = totalReturn
      agent.performance.lastUpdated = new Date()
    }

    if (data.decisionTime !== undefined) {
      const currentAvg = agent.performance.averageDecisionTime
      const totalDecisions = agent.performance.totalTrades || 1
      agent.performance.averageDecisionTime = (currentAvg * totalDecisions + data.decisionTime) / (totalDecisions + 1)
    }
  }

  /**
   * Start the orchestrator
   */
  public async start(): Promise<void> {
    if (this.isRunning) return

    console.log('🚀 Starting LangGraph Trading Orchestrator')
    
    // Activate all agents
    for (const agent of this.agents.values()) {
      if (agent.status === 'paused') {
        agent.status = 'active'
      }
    }

    this.isRunning = true

    // Start coordination cycle
    this.coordinationInterval = setInterval(async () => {
      try {
        await this.runCoordinationCycle()
      } catch (error) {
        console.error('Coordination cycle failed:', error)
      }
    }, 60000) // Every minute

    this.emit('orchestrator:started', { agents: this.agents.size })
  }

  /**
   * Stop the orchestrator
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log('🛑 Stopping LangGraph Trading Orchestrator')

    // Pause all agents
    for (const agent of this.agents.values()) {
      if (agent.status === 'active') {
        agent.status = 'paused'
      }
    }

    this.isRunning = false

    if (this.coordinationInterval) {
      clearInterval(this.coordinationInterval)
      this.coordinationInterval = null
    }

    this.emit('orchestrator:stopped')
  }

  /**
   * Run a complete coordination cycle
   */
  private async runCoordinationCycle(): Promise<void> {
    try {
      const initialState: MultiAgentState = {
        marketConditions: null,
        activeSymbols: [],
        agents: Array.from(this.agents.values()),
        decisions: [],
        consensus: null,
        coordination: null,
        riskAssessment: null,
        executionQueue: [],
        timestamp: Date.now()
      }

      const compiled = this.multiAgentWorkflow.compile()
      const result = await compiled.invoke(initialState)

      this.emit('coordination:completed', {
        executedTrades: result.executionQueue?.filter(e => e.status === 'executed').length || 0,
        marketConditions: result.marketConditions,
        timestamp: result.timestamp
      })

    } catch (error) {
      console.error('Coordination cycle failed:', error)
      this.emit('coordination:failed', { error: error.toString() })
    }
  }

  /**
   * Get all agents
   */
  public getAgents(): LangGraphAgent[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): LangGraphAgent | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Add a new agent
   */
  public async addAgent(agentConfig: Partial<LangGraphAgent>): Promise<string> {
    const agentId = agentConfig.id || `agent_${Date.now()}`
    
    const agent: LangGraphAgent = {
      id: agentId,
      name: agentConfig.name || `Agent ${agentId}`,
      type: agentConfig.type || 'momentum',
      status: 'paused',
      llmModel: agentConfig.llmModel || 'gpt-4o-mini',
      specialization: agentConfig.specialization || [],
      portfolio: agentId,
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        averageDecisionTime: 0,
        confidenceAccuracy: 0,
        lastUpdated: new Date()
      },
      lastDecision: null,
      config: agentConfig.config || {
        symbols: ['BTC/USDT'],
        maxPositionSize: 10000,
        riskTolerance: 'moderate',
        decisionFrequency: 30,
        llmPreference: 'auto',
        enableSentimentAnalysis: true,
        enableRiskOverride: true,
        coordinationMode: 'collaborative'
      },
      workflowState: null
    }

    this.agents.set(agentId, agent)
    
    // Create portfolio
    persistentTradingEngine.createPortfolio(agentId, 100000)

    this.emit('agent:added', { agent })
    return agentId
  }

  /**
   * Remove an agent
   */
  public async removeAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    // Stop agent if running
    agent.status = 'stopped'
    this.agents.delete(agentId)

    this.emit('agent:removed', { agentId })
    return true
  }

  /**
   * Update agent configuration
   */
  public async updateAgent(agentId: string, updates: Partial<LangGraphAgent>): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false

    Object.assign(agent, updates)
    this.emit('agent:updated', { agent })
    return true
  }

  /**
   * Get orchestrator status
   */
  public getStatus(): {
    isRunning: boolean
    totalAgents: number
    activeAgents: number
    totalValue: number
    totalPnL: number
    lastCoordination: number
  } {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active')
    
    let totalValue = 0
    let totalPnL = 0

    for (const agent of this.agents.values()) {
      const portfolio = persistentTradingEngine.getPortfolio(agent.id)
      if (portfolio) {
        totalValue += portfolio.totalValue
        totalPnL += portfolio.totalPnL
      }
    }

    return {
      isRunning: this.isRunning,
      totalAgents: this.agents.size,
      activeAgents: activeAgents.length,
      totalValue,
      totalPnL,
      lastCoordination: Date.now()
    }
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(): any {
    const analytics = {
      agents: Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        performance: agent.performance,
        status: agent.status
      })),
      overall: this.getStatus(),
      llmUsage: langChainService.getUsageStats()
    }

    return analytics
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<any> {
    const langChainHealth = await langChainService.healthCheck()
    const orchestratorHealth = {
      isRunning: this.isRunning,
      agentsCount: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length
    }

    return {
      orchestrator: orchestratorHealth,
      langchain: langChainHealth,
      status: langChainHealth.status === 'healthy' && this.isRunning ? 'healthy' : 'degraded'
    }
  }
}

// Export singleton instance
export const langGraphOrchestrator = new LangGraphTradingOrchestrator()