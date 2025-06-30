'use client'

import { unifiedLLMService, type AIDecisionRequest, type AIDecision } from '@/lib/ai/unified-llm-service'
import { backendApi } from '@/lib/api/backend-client'
import { agentWalletManager, type AgentWallet } from './agent-wallet-manager'
import { mcpIntegrationService, type MCPTool } from '@/lib/mcp/MCPIntegrationService'

export interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'stopped' | 'error'
  config: {
    decisionInterval: number // milliseconds
    maxRiskPerTrade: number
    symbols: string[]
    strategy: any
  }
  performance: {
    totalPnL: number
    winRate: number
    trades: number
    successfulDecisions: number
    totalDecisions: number
  }
  memory: {
    recentDecisions: AIDecision[]
    lessons: string[]
    performance: any
    thoughts: string[]
    context: string
    lastUpdate: number
  }
  wallet?: {
    address: string
    balance: number
    positions: any[]
  }
}

export interface MarketData {
  symbol: string
  price: number
  volume: number
  change: number
  timestamp: number
  indicators?: any
}

export interface Portfolio {
  totalValue: number
  cash: number
  positions: Array<{
    symbol: string
    quantity: number
    avgPrice: number
    currentPrice: number
    unrealizedPnL: number
  }>
  pnl: number
}

export class AgentDecisionLoop {
  private activeLoops = new Map<string, NodeJS.Timeout>()
  private agentStates = new Map<string, Agent>()
  
  async startAgent(agentId: string): Promise<void> {
    try {
      console.log(`🚀 Starting agent ${agentId}`)
      
      // Get agent configuration
      const agent = await this.loadAgent(agentId)
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`)
      }
      
      // Stop existing loop if running
      await this.stopAgent(agentId)
      
      // Initialize agent services
      await this.initializeServices(agent)
      
      // Register agent with MCP service for tool access
      await this.ensureMCPAgentRegistration(agentId)
      
      // Start decision loop
      const interval = setInterval(async () => {
        await this.executeDecisionCycle(agent)
      }, agent.config.decisionInterval || 30000) // Default 30 seconds
      
      this.activeLoops.set(agentId, interval)
      this.agentStates.set(agentId, { ...agent, status: 'active' })
      
      // Update agent status in backend
      await this.updateAgentStatus(agentId, 'active')
      
      console.log(`✅ Agent ${agentId} started with ${agent.config.decisionInterval}ms interval`)
      
    } catch (error) {
      console.error(`❌ Failed to start agent ${agentId}:`, error)
      await this.updateAgentStatus(agentId, 'error')
      throw error
    }
  }
  
  async stopAgent(agentId: string): Promise<void> {
    console.log(`⏹️ Stopping agent ${agentId}`)
    
    const interval = this.activeLoops.get(agentId)
    if (interval) {
      clearInterval(interval)
      this.activeLoops.delete(agentId)
    }
    
    const agent = this.agentStates.get(agentId)
    if (agent) {
      this.agentStates.set(agentId, { ...agent, status: 'stopped' })
    }
    
    await this.updateAgentStatus(agentId, 'stopped')
    console.log(`✅ Agent ${agentId} stopped`)
  }
  
  async pauseAgent(agentId: string): Promise<void> {
    console.log(`⏸️ Pausing agent ${agentId}`)
    
    const interval = this.activeLoops.get(agentId)
    if (interval) {
      clearInterval(interval)
      this.activeLoops.delete(agentId)
    }
    
    const agent = this.agentStates.get(agentId)
    if (agent) {
      this.agentStates.set(agentId, { ...agent, status: 'paused' })
    }
    
    await this.updateAgentStatus(agentId, 'paused')
    console.log(`✅ Agent ${agentId} paused`)
  }
  
  async executeDecisionCycle(agent: Agent): Promise<void> {
    try {
      console.log(`🧠 Decision cycle for agent ${agent.id}`)
      
      // 1. Gather market data
      const marketData = await this.gatherMarketData(agent.config.symbols)
      
      // 2. Get current portfolio state
      const portfolio = await this.getPortfolioState(agent.id)
      
      // 3. Get recent memory and performance
      const memory = await this.getRecentMemory(agent.id)
      
      // 4. Get assigned goals and current progress
      const goalsContext = await this.getGoalsContext(agent.id)
      
      // 5. Build decision request with goals context
      const decisionRequest: AIDecisionRequest = {
        agent: {
          id: agent.id,
          type: agent.type,
          config: agent.config,
          strategy: agent.config.strategy
        },
        marketData,
        portfolio,
        memory,
        goals: goalsContext, // Add goals to decision context
        context: `Agent ${agent.name} making goal-driven decision at ${new Date().toISOString()}. Active goals: ${goalsContext.activeGoals.length}`
      }
      
      // 6. Get available MCP tools for enhanced decision making
      const availableTools = mcpIntegrationService.getAvailableTools(agent.id)
      
      // 7. Use MCP tools to enhance market analysis if available
      const toolEnhancedContext = await this.enhanceDecisionWithMCPTools(agent.id, marketData, portfolio, availableTools)
      
      // 8. Make LLM decision with goals awareness and tool-enhanced context
      const enhancedRequest = {
        ...decisionRequest,
        context: `${decisionRequest.context}\n\nMCP Tool Analysis: ${toolEnhancedContext}`
      }
      const decision = await unifiedLLMService.makeDecision(enhancedRequest)
      console.log(`💡 Agent ${agent.id} MCP-enhanced decision:`, decision)
      
      // 9. Validate and execute decision
      if (this.validateDecision(decision, portfolio, agent.config)) {
        await this.executeDecision(agent.id, decision)
        
        // 10. Update memory with successful decision
        await this.updateMemory(agent.id, decision, marketData, 'executed')
        
        // 11. Update performance metrics and goal progress
        await this.updatePerformance(agent.id, decision, 'success')
        
      } else {
        console.warn(`⚠️ Invalid decision from agent ${agent.id}, skipping execution`)
        await this.updateMemory(agent.id, decision, marketData, 'rejected')
        await this.updatePerformance(agent.id, decision, 'validation_failed')
      }
      
      // 12. Update goal progress based on decision results
      await this.updateGoalProgress(agent.id, decision, portfolio)
      
      // 13. Check for learning opportunities
      await this.processLearning(agent.id, decision, marketData)
      
    } catch (error) {
      console.error(`❌ Decision cycle failed for agent ${agent.id}:`, error)
      await this.handleDecisionError(agent.id, error)
    }
  }
  
  private async loadAgent(agentId: string): Promise<Agent | null> {
    try {
      // Try to load from backend first
      const response = await backendApi.get(`/api/v1/agents/${agentId}`)
      if (response.data) {
        return this.transformBackendAgent(response.data)
      }
    } catch (error) {
      console.warn('Backend agent load failed, trying localStorage:', error)
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(`agent_${agentId}`)
    return stored ? JSON.parse(stored) : null
  }
  
  private transformBackendAgent(backendAgent: any): Agent {
    return {
      id: backendAgent.agent_id || backendAgent.id,
      name: backendAgent.name || backendAgent.agent_name,
      type: backendAgent.type || backendAgent.agent_type,
      status: backendAgent.status || 'stopped',
      config: {
        decisionInterval: backendAgent.decision_interval || 30000,
        maxRiskPerTrade: backendAgent.max_risk_per_trade || 0.05,
        symbols: backendAgent.symbols || ['BTC/USD', 'ETH/USD'],
        strategy: backendAgent.strategy || {}
      },
      performance: {
        totalPnL: backendAgent.total_pnl || 0,
        winRate: backendAgent.win_rate || 0,
        trades: backendAgent.trade_count || 0,
        successfulDecisions: backendAgent.successful_decisions || 0,
        totalDecisions: backendAgent.total_decisions || 0
      },
      memory: {
        recentDecisions: backendAgent.recent_decisions || [],
        lessons: backendAgent.lessons || [],
        performance: backendAgent.performance_data || {}
      }
    }
  }
  
  private async initializeServices(agent: Agent): Promise<void> {
    // Initialize any required services for the agent
    console.log(`🔧 Initializing services for agent ${agent.id}`)
    
    // Could include:
    // - Market data subscriptions
    // - Risk management setup
    // - Portfolio tracking
    // - Memory system initialization
  }
  
  private async gatherMarketData(symbols: string[]): Promise<MarketData[]> {
    try {
      // Try to get real market data from backend
      const response = await backendApi.get('/api/v1/market/live-data', {
        params: { symbols: symbols.join(',') }
      })
      
      if (response.data) {
        return response.data.map((item: any) => ({
          symbol: item.symbol,
          price: item.price,
          volume: item.volume,
          change: item.change_24h,
          timestamp: Date.now(),
          indicators: item.indicators
        }))
      }
    } catch (error) {
      console.warn('Backend market data failed, using mock data:', error)
    }
    
    // Fallback to mock data
    return this.generateMockMarketData(symbols)
  }
  
  private generateMockMarketData(symbols: string[]): MarketData[] {
    return symbols.map(symbol => {
      const basePrice = this.getBasePrice(symbol)
      const change = (Math.random() - 0.5) * 10 // -5% to +5%
      const price = basePrice * (1 + change / 100)
      
      return {
        symbol,
        price,
        volume: Math.random() * 1000000,
        change,
        timestamp: Date.now(),
        indicators: {
          rsi: 30 + Math.random() * 40,
          macd: Math.random() - 0.5,
          ema: price * (0.95 + Math.random() * 0.1)
        }
      }
    })
  }
  
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC/USD': 45000,
      'ETH/USD': 2500,
      'SOL/USD': 100,
      'ADA/USD': 0.5,
      'DOT/USD': 8,
      'MATIC/USD': 1.2
    }
    return prices[symbol] || 100
  }
  
  private async getPortfolioState(agentId: string): Promise<Portfolio> {
    try {
      // Try to get real wallet data first
      const wallet = await agentWalletManager.getWallet(agentId)
      if (wallet) {
        return {
          totalValue: wallet.totalValue,
          cash: wallet.balance,
          positions: wallet.positions.map(pos => ({
            symbol: pos.symbol,
            quantity: pos.quantity,
            avgPrice: pos.avgPrice,
            currentPrice: pos.currentPrice,
            unrealizedPnL: pos.unrealizedPnL
          })),
          pnl: wallet.realizedPnL + wallet.unrealizedPnL
        }
      }
      
      // Try backend second
      const response = await backendApi.get(`/api/v1/agents/${agentId}/portfolio`)
      if (response.data) {
        return response.data
      }
    } catch (error) {
      console.warn('Backend portfolio data failed, using mock:', error)
    }
    
    // Mock portfolio data as fallback
    return {
      totalValue: 10000 + Math.random() * 5000,
      cash: 5000 + Math.random() * 2000,
      positions: [
        {
          symbol: 'BTC/USD',
          quantity: 0.1,
          avgPrice: 44000,
          currentPrice: 45000,
          unrealizedPnL: 100
        }
      ],
      pnl: Math.random() * 1000 - 500
    }
  }
  
  private async getRecentMemory(agentId: string): Promise<any> {
    try {
      const response = await backendApi.get(`/api/v1/agents/${agentId}/memory`)
      if (response.data) {
        return response.data
      }
    } catch (error) {
      console.warn('Backend memory data failed, using empty:', error)
    }
    
    return {
      recentDecisions: [],
      performance: { winRate: 0.6, avgReturn: 0.02 },
      lessons: ['Be cautious during high volatility', 'Take profits gradually']
    }
  }
  
  private validateDecision(decision: AIDecision, portfolio: Portfolio, config: any): boolean {
    // Basic decision validation
    if (!decision.action || !decision.reasoning) {
      return false
    }
    
    // Risk validation
    if (decision.action === 'buy' && decision.quantity) {
      const cost = (decision.quantity * (decision.price || 0))
      const maxRisk = portfolio.cash * (config.maxRiskPerTrade || 0.05)
      if (cost > maxRisk) {
        console.warn(`Decision rejected: Risk too high (${cost} > ${maxRisk})`)
        return false
      }
    }
    
    // Symbol validation
    if (decision.symbol && !config.symbols.includes(decision.symbol)) {
      console.warn(`Decision rejected: Symbol ${decision.symbol} not in allowed list`)
      return false
    }
    
    return true
  }
  
  private async executeDecision(agentId: string, decision: AIDecision): Promise<void> {
    try {
      console.log(`📈 Executing decision for agent ${agentId}:`, decision)
      
      // Ensure agent has a wallet
      let wallet = await agentWalletManager.getWallet(agentId)
      if (!wallet) {
        console.log(`💳 Creating wallet for agent ${agentId}`)
        wallet = await agentWalletManager.createWalletForAgent(agentId, 10000)
      }
      
      // Execute through wallet system if it's a trading decision
      if ((decision.action === 'buy' || decision.action === 'sell') && decision.symbol && decision.quantity) {
        try {
          const transaction = await agentWalletManager.executeOrder(agentId, {
            symbol: decision.symbol,
            action: decision.action,
            quantity: decision.quantity,
            price: decision.price,
            orderType: 'market'
          })
          
          console.log(`✅ Trading decision executed via wallet system:`, transaction)
          
          // Update agent state with wallet info
          const agent = this.agentStates.get(agentId)
          if (agent) {
            agent.wallet = {
              address: wallet.address,
              balance: wallet.balance,
              positions: wallet.positions
            }
            this.agentStates.set(agentId, agent)
          }
          
          return
        } catch (walletError) {
          console.warn('Wallet execution failed, falling back to mock:', walletError)
        }
      }
      
      // Try backend execution for non-trading decisions
      try {
        await backendApi.post(`/api/v1/agents/${agentId}/execute-decision`, {
          decision,
          timestamp: Date.now()
        })
        console.log(`✅ Decision executed via backend`)
        return
      } catch (error) {
        console.warn('Backend execution failed, using mock:', error)
      }
      
      // Mock execution fallback
      const executionResult = {
        orderId: `order_${Date.now()}`,
        status: 'filled',
        fillPrice: decision.price || 0,
        fillQuantity: decision.quantity || 0,
        timestamp: Date.now()
      }
      
      // Store execution in localStorage
      const executions = JSON.parse(localStorage.getItem(`executions_${agentId}`) || '[]')
      executions.push({
        decision,
        execution: executionResult,
        timestamp: Date.now()
      })
      localStorage.setItem(`executions_${agentId}`, JSON.stringify(executions))
      
      console.log(`✅ Mock execution completed:`, executionResult)
      
    } catch (error) {
      console.error(`❌ Execution failed:`, error)
      throw error
    }
  }
  
  private async updateMemory(
    agentId: string, 
    decision: AIDecision, 
    marketData: MarketData[], 
    status: 'executed' | 'rejected'
  ): Promise<void> {
    // Generate agent thoughts based on decision and market conditions
    const thoughts = await this.generateAgentThoughts(agentId, decision, marketData, status)
    
    const memoryEntry = {
      timestamp: Date.now(),
      decision,
      marketData,
      status,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      thoughts: thoughts,
      context: this.generateContextDescription(marketData, decision)
    }
    
    try {
      await backendApi.post(`/api/v1/agents/${agentId}/memory`, memoryEntry)
    } catch (error) {
      // Store in localStorage as fallback with thoughts
      const memories = JSON.parse(localStorage.getItem(`memory_${agentId}`) || '[]')
      memories.push(memoryEntry)
      // Keep only last 100 memories
      if (memories.length > 100) {
        memories.splice(0, memories.length - 100)
      }
      localStorage.setItem(`memory_${agentId}`, JSON.stringify(memories))
      
      // Also store latest thoughts separately for dashboard access
      const agentThoughts = JSON.parse(localStorage.getItem(`thoughts_${agentId}`) || '[]')
      agentThoughts.push(...thoughts)
      if (agentThoughts.length > 50) {
        agentThoughts.splice(0, agentThoughts.length - 50)
      }
      localStorage.setItem(`thoughts_${agentId}`, JSON.stringify(agentThoughts))
    }
    
    // Update agent state with latest memory
    const agent = this.agentStates.get(agentId)
    if (agent) {
      agent.memory.recentDecisions.push(decision)
      agent.memory.thoughts.push(...thoughts)
      agent.memory.lastUpdate = Date.now()
      agent.memory.context = memoryEntry.context
      
      // Keep memory manageable
      if (agent.memory.recentDecisions.length > 20) {
        agent.memory.recentDecisions.splice(0, agent.memory.recentDecisions.length - 20)
      }
      if (agent.memory.thoughts.length > 30) {
        agent.memory.thoughts.splice(0, agent.memory.thoughts.length - 30)
      }
      
      this.agentStates.set(agentId, agent)
    }
  }

  private async generateAgentThoughts(
    agentId: string, 
    decision: AIDecision, 
    marketData: MarketData[], 
    status: string
  ): Promise<string[]> {
    const agent = this.agentStates.get(agentId)
    const thoughts: string[] = []
    
    // Generate contextual thoughts based on decision
    if (status === 'executed') {
      thoughts.push(`✅ Executed ${decision.action} decision for ${decision.symbol} with ${decision.confidence * 100}% confidence`)
      thoughts.push(`💭 Reasoning: ${decision.reasoning}`)
      
      if (decision.action === 'buy') {
        thoughts.push(`📈 Going long on ${decision.symbol} - expecting price increase`)
        thoughts.push(`💰 Risk management: Position size limited to ${((agent?.config.maxRiskPerTrade || 0.05) * 100).toFixed(1)}% of portfolio`)
      } else if (decision.action === 'sell') {
        thoughts.push(`📉 Selling ${decision.symbol} - taking profits or cutting losses`)
        thoughts.push(`⚖️ Portfolio rebalancing based on market conditions`)
      } else if (decision.action === 'hold') {
        thoughts.push(`⏳ Holding position - waiting for better market conditions`)
        thoughts.push(`📊 Current market volatility: ${this.calculateVolatility(marketData)}`)
      }
    } else {
      thoughts.push(`❌ Decision rejected: ${decision.reasoning}`)
      thoughts.push(`🔍 Need to reassess market conditions and risk parameters`)
    }
    
    // Add market analysis thoughts
    const marketTrend = this.analyzeMarketTrend(marketData)
    thoughts.push(`📈 Market trend analysis: ${marketTrend}`)
    
    // Add performance reflection
    if (agent?.performance) {
      const winRate = (agent.performance.successfulDecisions / Math.max(agent.performance.totalDecisions, 1)) * 100
      thoughts.push(`🎯 Current success rate: ${winRate.toFixed(1)}% (${agent.performance.successfulDecisions}/${agent.performance.totalDecisions})`)
    }
    
    return thoughts
  }

  private generateContextDescription(marketData: MarketData[], decision: AIDecision): string {
    const prices = marketData.map(m => `${m.symbol}: $${m.price.toFixed(2)} (${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%)`).join(', ')
    return `Market: ${prices} | Action: ${decision.action} | Confidence: ${(decision.confidence * 100).toFixed(1)}%`
  }

  private calculateVolatility(marketData: MarketData[]): string {
    const avgChange = marketData.reduce((sum, m) => sum + Math.abs(m.change), 0) / marketData.length
    if (avgChange > 5) return 'HIGH'
    if (avgChange > 2) return 'MEDIUM'
    return 'LOW'
  }

  private analyzeMarketTrend(marketData: MarketData[]): string {
    const positiveCount = marketData.filter(m => m.change > 0).length
    const ratio = positiveCount / marketData.length
    
    if (ratio > 0.7) return 'STRONG BULLISH'
    if (ratio > 0.5) return 'BULLISH'
    if (ratio > 0.3) return 'BEARISH'
    return 'STRONG BEARISH'
  }
  
  private async updatePerformance(
    agentId: string, 
    decision: AIDecision, 
    result: 'success' | 'validation_failed' | 'execution_failed'
  ): Promise<void> {
    const agent = this.agentStates.get(agentId)
    if (!agent) return
    
    // Update local performance metrics
    agent.performance.totalDecisions++
    if (result === 'success') {
      agent.performance.successfulDecisions++
    }
    
    this.agentStates.set(agentId, agent)
    
    try {
      await backendApi.post(`/api/v1/agents/${agentId}/performance`, {
        decision,
        result,
        timestamp: Date.now(),
        performance: agent.performance
      })
    } catch (error) {
      console.warn('Backend performance update failed:', error)
    }
  }
  
  private async processLearning(agentId: string, decision: AIDecision, marketData: MarketData[]): Promise<void> {
    // Simple learning: if decision confidence was low but market moved in predicted direction, increase confidence
    // This is a placeholder for more sophisticated learning algorithms
    
    console.log(`🧠 Processing learning for agent ${agentId}`)
    
    // In a real implementation, this would:
    // 1. Analyze decision outcomes after some time
    // 2. Update strategy parameters based on results
    // 3. Learn from successful/failed decisions
    // 4. Adjust risk parameters
    // 5. Update neural network weights if using ML
  }
  
  private async handleDecisionError(agentId: string, error: any): Promise<void> {
    console.error(`🚨 Decision error for agent ${agentId}:`, error)
    
    const agent = this.agentStates.get(agentId)
    if (agent) {
      // Mark agent as error state
      this.agentStates.set(agentId, { ...agent, status: 'error' })
      await this.updateAgentStatus(agentId, 'error')
      
      // Stop the agent if too many errors
      const errorCount = agent.performance.totalDecisions - agent.performance.successfulDecisions
      if (errorCount > 10) {
        console.error(`🛑 Stopping agent ${agentId} due to too many errors`)
        await this.stopAgent(agentId)
      }
    }
  }
  
  private async updateAgentStatus(agentId: string, status: string): Promise<void> {
    try {
      await backendApi.post(`/api/v1/agents/${agentId}/status`, {
        status,
        timestamp: Date.now()
      })
    } catch (error) {
      // Store status in localStorage as fallback
      localStorage.setItem(`agent_status_${agentId}`, JSON.stringify({
        status,
        timestamp: Date.now()
      }))
    }
  }
  
  // Public methods for agent management
  getActiveAgents(): string[] {
    return Array.from(this.activeLoops.keys())
  }
  
  getAgentStatus(agentId: string): string {
    const agent = this.agentStates.get(agentId)
    return agent?.status || 'unknown'
  }
  
  getAllAgentStates(): Map<string, Agent> {
    return new Map(this.agentStates)
  }
  
  async startAllAgents(): Promise<void> {
    // Load all agents and start them
    try {
      const response = await backendApi.get('/api/v1/agents')
      const agents = response.data || []
      
      for (const agent of agents) {
        if (agent.status === 'active' || agent.auto_start) {
          await this.startAgent(agent.id)
        }
      }
    } catch (error) {
      console.warn('Failed to load agents from backend:', error)
    }
  }
  
  async stopAllAgents(): Promise<void> {
    const activeAgents = this.getActiveAgents()
    for (const agentId of activeAgents) {
      await this.stopAgent(agentId)
    }
  }
  
  // Goals Integration Methods
  private async getGoalsContext(agentId: string): Promise<any> {
    try {
      // Get all goals from localStorage goals system
      const allGoals = JSON.parse(localStorage.getItem('trading_goals') || '[]')
      const assignedGoals = allGoals.filter((goal: any) => 
        goal.assigned_agents?.includes(agentId) || goal.individual_agent === agentId
      )
      
      // Filter active goals
      const activeGoals = assignedGoals.filter((goal: any) => 
        goal.status === 'active' || goal.status === 'in_progress'
      )
      
      // Get goal priorities and targets
      const goalTargets = activeGoals.map((goal: any) => ({
        id: goal.id,
        type: goal.goal_type,
        target: goal.target_amount,
        priority: goal.priority || 'medium',
        description: goal.description,
        deadline: goal.deadline,
        progress: goal.progress || 0
      }))
      
      return {
        activeGoals: goalTargets,
        totalGoals: assignedGoals.length,
        completedGoals: assignedGoals.filter((g: any) => g.status === 'completed').length,
        priorities: {
          high: goalTargets.filter(g => g.priority === 'high').length,
          medium: goalTargets.filter(g => g.priority === 'medium').length,
          low: goalTargets.filter(g => g.priority === 'low').length
        }
      }
    } catch (error) {
      console.warn('Failed to get goals context:', error)
      return { activeGoals: [], totalGoals: 0, completedGoals: 0, priorities: { high: 0, medium: 0, low: 0 } }
    }
  }
  
  private async updateGoalProgress(agentId: string, decision: AIDecision, portfolio: Portfolio): Promise<void> {
    try {
      // Get current goals
      const allGoals = JSON.parse(localStorage.getItem('trading_goals') || '[]')
      const assignedGoals = allGoals.filter((goal: any) => 
        goal.assigned_agents?.includes(agentId) || goal.individual_agent === agentId
      )
      
      let goalsUpdated = false
      
      // Update progress for each goal based on current portfolio state and decision
      const updatedGoals = allGoals.map((goal: any) => {
        if (!assignedGoals.find((g: any) => g.id === goal.id)) {
          return goal // Not assigned to this agent
        }
        
        let newProgress = goal.progress || 0
        const oldProgress = newProgress
        
        // Calculate progress based on goal type and current state
        switch(goal.goal_type) {
          case 'profit_target':
            newProgress = Math.min((portfolio.pnl / goal.target_amount) * 100, 100)
            break
          case 'win_rate':
            const agent = this.agentStates.get(agentId)
            if (agent && agent.performance.totalDecisions > 0) {
              const winRate = (agent.performance.successfulDecisions / agent.performance.totalDecisions) * 100
              newProgress = Math.min((winRate / goal.target_amount) * 100, 100)
            }
            break
          case 'trade_count':
            const currentAgent = this.agentStates.get(agentId)
            if (currentAgent) {
              newProgress = Math.min((currentAgent.performance.totalDecisions / goal.target_amount) * 100, 100)
            }
            break
          case 'portfolio_value':
            newProgress = Math.min((portfolio.totalValue / goal.target_amount) * 100, 100)
            break
        }
        
        // Update goal status based on progress
        let newStatus = goal.status
        if (newProgress >= 100 && goal.status !== 'completed') {
          newStatus = 'completed'
          console.log(`🎯 Goal completed by agent ${agentId}: ${goal.description}`)
        } else if (newProgress > 0 && goal.status === 'active') {
          newStatus = 'in_progress'
        }
        
        if (newProgress !== oldProgress || newStatus !== goal.status) {
          goalsUpdated = true
          return {
            ...goal,
            progress: Math.max(0, Math.min(100, newProgress)),
            status: newStatus,
            last_updated: Date.now(),
            last_updated_by: agentId
          }
        }
        
        return goal
      })
      
      // Save updated goals if any changes were made
      if (goalsUpdated) {
        localStorage.setItem('trading_goals', JSON.stringify(updatedGoals))
        console.log(`📊 Updated goal progress for agent ${agentId}`)
      }
      
    } catch (error) {
      console.error('Failed to update goal progress:', error)
    }
  }
  
  // MCP Tool Integration Methods
  private async enhanceDecisionWithMCPTools(
    agentId: string, 
    marketData: MarketData[], 
    portfolio: Portfolio, 
    availableTools: MCPTool[]
  ): Promise<string> {
    try {
      const toolResults: string[] = []
      
      // Register agent with MCP service if not already registered
      await this.ensureMCPAgentRegistration(agentId)
      
      // Use technical analysis tools if available
      const technicalTools = availableTools.filter(tool => 
        tool.category === 'analysis' && tool.name.includes('technical')
      )
      
      for (const tool of technicalTools.slice(0, 2)) { // Limit to 2 tools to avoid delays
        try {
          const result = await mcpIntegrationService.callTool(agentId, tool.id, {
            symbols: marketData.map(d => d.symbol),
            timeframe: '1h',
            indicators: ['RSI', 'MACD', 'SMA']
          })
          
          toolResults.push(`${tool.name}: ${JSON.stringify(result).substring(0, 200)}`)
        } catch (error) {
          console.warn(`MCP tool ${tool.name} failed:`, error)
        }
      }
      
      // Use risk analysis tools if available
      const riskTools = availableTools.filter(tool => 
        tool.category === 'analysis' && tool.name.includes('risk')
      )
      
      for (const tool of riskTools.slice(0, 1)) { // Limit to 1 risk tool
        try {
          const result = await mcpIntegrationService.callTool(agentId, tool.id, {
            portfolio: {
              totalValue: portfolio.totalValue,
              positions: portfolio.positions.map(p => ({
                symbol: p.symbol,
                value: p.quantity * p.currentPrice,
                unrealizedPnL: p.unrealizedPnL
              }))
            }
          })
          
          toolResults.push(`${tool.name}: ${JSON.stringify(result).substring(0, 200)}`)
        } catch (error) {
          console.warn(`MCP risk tool ${tool.name} failed:`, error)
        }
      }
      
      return toolResults.length > 0 
        ? `Enhanced analysis from ${toolResults.length} MCP tools: ${toolResults.join('; ')}`
        : 'No MCP tool analysis available'
        
    } catch (error) {
      console.error('MCP tool enhancement failed:', error)
      return 'MCP tool integration unavailable'
    }
  }
  
  private async ensureMCPAgentRegistration(agentId: string): Promise<void> {
    try {
      // Activate MCP infrastructure for the agent
      const result = await mcpIntegrationService.activateForAgent(agentId)
      
      if (result.success) {
        console.log(`📡 Agent ${agentId} activated with MCP service`)
      } else {
        console.warn(`MCP activation failed for agent ${agentId}:`, result.errors)
      }
    } catch (error) {
      console.warn('MCP agent activation failed:', error)
    }
  }
  
  // Get MCP tool recommendations for agent based on current context
  async getRecommendedMCPTools(agentId: string, context: string): Promise<MCPTool[]> {
    try {
      const availableTools = mcpIntegrationService.getAvailableTools(agentId)
      
      // Simple recommendation logic based on context keywords
      const recommendations: MCPTool[] = []
      
      if (context.includes('market') || context.includes('price')) {
        recommendations.push(...availableTools.filter(t => 
          t.category === 'analysis' && t.name.includes('market')
        ))
      }
      
      if (context.includes('risk') || context.includes('portfolio')) {
        recommendations.push(...availableTools.filter(t => 
          t.category === 'analysis' && t.name.includes('risk')
        ))
      }
      
      if (context.includes('trade') || context.includes('order')) {
        recommendations.push(...availableTools.filter(t => 
          t.category === 'trading'
        ))
      }
      
      return recommendations.slice(0, 5) // Limit to top 5 recommendations
    } catch (error) {
      console.error('Failed to get MCP tool recommendations:', error)
      return []
    }
  }
}

// Export singleton instance
export const agentDecisionLoop = new AgentDecisionLoop()