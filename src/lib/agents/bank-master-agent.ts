'use client'

import { EventEmitter } from 'events'
import { enhancedAlchemyService } from '../blockchain/enhanced-alchemy-service'
import { masterWalletManager, MasterWallet, AgentAllocation } from '../blockchain/master-wallet-manager'
import { autonomousTradingCoordinator, AutonomousAgent } from './autonomous-trading-coordinator'
import GoalsService from '../goals/goals-service'
import FarmsService from '../farms/farms-service'
import { mcpClient } from '../mcp/mcp-client'

export interface BankMasterConfig {
  id: string
  name: string
  version: string
  capabilities: string[]
  riskTolerance: number
  maxAllocationPerAgent: number
  profitThreshold: number
  rebalanceInterval: number
  emergencyStopThreshold: number
  multiChainEnabled: boolean
  supportedChains: string[]
  llmEnabled: boolean
  mcpEnabled: boolean
}

export interface ProfitCollection {
  id: string
  source: 'goal' | 'agent' | 'farm' | 'manual'
  sourceId: string
  sourceName: string
  amount: number
  token: string
  chain: string
  timestamp: Date
  reason: string
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  vaultAddress: string
}

export interface VaultOperation {
  id: string
  type: 'deposit' | 'withdraw' | 'allocate' | 'rebalance' | 'emergency'
  amount: number
  token: string
  chain: string
  fromAddress: string
  toAddress: string
  timestamp: Date
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  gasUsed?: number
  reason: string
}

export interface BankMasterDecision {
  id: string
  type: 'allocation' | 'collection' | 'rebalance' | 'emergency' | 'optimization'
  reasoning: string
  confidence: number
  expectedOutcome: string
  riskAssessment: number
  timestamp: Date
  parameters: any
  result?: any
  executionTime?: number
}

export interface PerformanceMetrics {
  totalAssetsManaged: number
  totalProfitsCollected: number
  totalAllocated: number
  totalReturns: number
  avgROI: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalDecisions: number
  successfulDecisions: number
  chainDistribution: Record<string, number>
  topPerformingAgents: Array<{ agentId: string; roi: number }>
  riskExposure: Record<string, number>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: any
}

class BankMasterAgent extends EventEmitter {
  private config: BankMasterConfig
  private vaultWallets: Map<string, MasterWallet> = new Map()
  private profitCollections: Map<string, ProfitCollection> = new Map()
  private vaultOperations: Map<string, VaultOperation> = new Map()
  private decisions: Map<string, BankMasterDecision> = new Map()
  private chatHistory: ChatMessage[] = []
  private isActive = false
  private monitoringInterval?: NodeJS.Timeout
  private rebalanceInterval?: NodeJS.Timeout
  private performanceMetrics: PerformanceMetrics | null = null
  private llmContext: any = null

  constructor(config: BankMasterConfig) {
    super()
    this.config = config
    this.initializeBankMaster()
  }

  private async initializeBankMaster() {
    try {
      // Initialize vault wallets for each supported chain
      for (const chain of this.config.supportedChains) {
        const vault = await masterWalletManager.createMasterWallet(
          `Bank Master Vault ${chain}`,
          chain as any,
          false // Start with testnet
        )
        
        if (vault) {
          this.vaultWallets.set(chain, vault)
        }
      }

      // Initialize MCP client if enabled
      if (this.config.mcpEnabled) {
        await mcpClient.initialize()
      }

      // Set up event listeners
      this.setupEventListeners()

      // Initialize LLM context if enabled
      if (this.config.llmEnabled) {
        this.initializeLLMContext()
      }

      console.log(`🏦 Bank Master Agent ${this.config.name} initialized`)
      this.emit('initialized', { bankMaster: this.config })
    } catch (error) {
      console.error('Failed to initialize Bank Master:', error)
      this.emit('error', { error: 'Initialization failed' })
    }
  }

  private setupEventListeners() {
    // Listen for goal completions
    GoalsService.getInstance().on?.('goalCompleted', this.handleGoalCompletion.bind(this))

    // Listen for agent performance updates
    autonomousTradingCoordinator.on('agentPerformanceUpdate', this.handleAgentPerformance.bind(this))

    // Listen for farm performance updates
    FarmsService.getInstance().on?.('farmPerformanceUpdate', this.handleFarmPerformance.bind(this))

    // Listen for master wallet events
    masterWalletManager.on('depositDetected', this.handleDepositDetected.bind(this))
    masterWalletManager.on('fundsAllocated', this.handleFundsAllocated.bind(this))
  }

  private initializeLLMContext() {
    this.llmContext = {
      role: 'Bank Master Agent',
      capabilities: this.config.capabilities,
      currentState: {
        activeAgents: 0,
        totalAssets: 0,
        activeGoals: 0,
        activeFarms: 0,
        riskLevel: 'medium'
      },
      personality: {
        style: 'analytical',
        tone: 'professional',
        expertise: 'financial analysis and risk management'
      }
    }
  }

  // Main Bank Master activation
  async activate(): Promise<boolean> {
    try {
      if (this.isActive) {
        console.log('Bank Master already active')
        return true
      }

      this.isActive = true
      
      // Start monitoring
      this.startMonitoring()
      
      // Start rebalancing
      this.startRebalancing()
      
      // Perform initial analysis
      await this.performInitialAnalysis()
      
      this.emit('activated', { timestamp: new Date() })
      console.log('🚀 Bank Master Agent activated')
      
      return true
    } catch (error) {
      console.error('Failed to activate Bank Master:', error)
      this.isActive = false
      return false
    }
  }

  async deactivate(): Promise<boolean> {
    try {
      this.isActive = false
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
      }
      
      if (this.rebalanceInterval) {
        clearInterval(this.rebalanceInterval)
      }
      
      this.emit('deactivated', { timestamp: new Date() })
      console.log('⏹️ Bank Master Agent deactivated')
      
      return true
    } catch (error) {
      console.error('Failed to deactivate Bank Master:', error)
      return false
    }
  }

  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle()
    }, 30000) // Every 30 seconds
  }

  private startRebalancing() {
    this.rebalanceInterval = setInterval(async () => {
      await this.performRebalancing()
    }, this.config.rebalanceInterval)
  }

  private async performInitialAnalysis() {
    try {
      // Analyze current system state
      const agents = autonomousTradingCoordinator.getAllAgents()
      const goals = GoalsService.getInstance().getAllGoals()
      const farms = FarmsService.getInstance().getAllFarms()
      const allocations = masterWalletManager.getAgentAllocations()

      const decision: BankMasterDecision = {
        id: `decision_${Date.now()}`,
        type: 'optimization',
        reasoning: 'Initial system analysis and optimization',
        confidence: 85,
        expectedOutcome: 'Optimized fund allocation and risk management',
        riskAssessment: 30,
        timestamp: new Date(),
        parameters: {
          agentCount: agents.length,
          goalCount: goals.length,
          farmCount: farms.length,
          allocationCount: allocations.length
        }
      }

      this.decisions.set(decision.id, decision)
      this.emit('decisionMade', decision)

      console.log('📊 Initial analysis completed')
    } catch (error) {
      console.error('Error in initial analysis:', error)
    }
  }

  private async performMonitoringCycle() {
    try {
      if (!this.isActive) return

      // Monitor agent performance
      await this.monitorAgentPerformance()
      
      // Monitor vault balances
      await this.monitorVaultBalances()
      
      // Check for profit collection opportunities
      await this.checkProfitCollectionOpportunities()
      
      // Assess risk levels
      await this.assessRiskLevels()
      
      // Update performance metrics
      await this.updatePerformanceMetrics()
      
      this.emit('monitoringCycleCompleted', { timestamp: new Date() })
    } catch (error) {
      console.error('Error in monitoring cycle:', error)
    }
  }

  private async monitorAgentPerformance() {
    const agents = autonomousTradingCoordinator.getAllAgents()
    
    for (const agent of agents) {
      if (agent.performance.netProfit > this.config.profitThreshold) {
        await this.triggerProfitCollection('agent', agent.id, agent.name, agent.performance.netProfit)
      }
    }
  }

  private async monitorVaultBalances() {
    for (const [chain, vault] of this.vaultWallets) {
      const balances = await enhancedAlchemyService.getChainBalances(vault.address, chain)
      
      const totalValue = balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0)
      
      if (totalValue > 0) {
        console.log(`💰 Vault ${chain} balance: $${totalValue.toFixed(2)}`)
      }
    }
  }

  private async checkProfitCollectionOpportunities() {
    // Check completed goals
    const completedGoals = GoalsService.getInstance().getCompletedGoals()
    for (const goal of completedGoals) {
      // Check if profit collection is needed
      const existingCollection = Array.from(this.profitCollections.values())
        .find(c => c.source === 'goal' && c.sourceId === goal.id)
      
      if (!existingCollection) {
        await this.triggerProfitCollection('goal', goal.id, goal.name, goal.target)
      }
    }
  }

  private async assessRiskLevels() {
    if (this.config.mcpEnabled) {
      try {
        const systemStats = autonomousTradingCoordinator.getSystemStats()
        
        if (systemStats.systemROI < -this.config.emergencyStopThreshold) {
          await this.executeEmergencyStop('High system losses detected')
        }
      } catch (error) {
        console.error('Error assessing risk levels:', error)
      }
    }
  }

  private async updatePerformanceMetrics() {
    try {
      const agents = autonomousTradingCoordinator.getAllAgents()
      const systemStats = autonomousTradingCoordinator.getSystemStats()
      const allocations = masterWalletManager.getAgentAllocations()

      const totalProfitsCollected = Array.from(this.profitCollections.values())
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + c.amount, 0)

      const chainDistribution: Record<string, number> = {}
      for (const [chain, vault] of this.vaultWallets) {
        const balances = await enhancedAlchemyService.getChainBalances(vault.address, chain)
        chainDistribution[chain] = balances.reduce((sum, b) => sum + (b.usdValue || 0), 0)
      }

      this.performanceMetrics = {
        totalAssetsManaged: systemStats.totalAllocated,
        totalProfitsCollected,
        totalAllocated: systemStats.totalAllocated,
        totalReturns: systemStats.totalProfit,
        avgROI: systemStats.systemROI,
        sharpeRatio: this.calculateSharpeRatio(agents),
        maxDrawdown: this.calculateMaxDrawdown(agents),
        winRate: this.calculateWinRate(agents),
        totalDecisions: this.decisions.size,
        successfulDecisions: Array.from(this.decisions.values()).filter(d => d.result?.success).length,
        chainDistribution,
        topPerformingAgents: agents
          .sort((a, b) => b.performance.netProfit - a.performance.netProfit)
          .slice(0, 5)
          .map(a => ({ agentId: a.id, roi: a.performance.netProfit })),
        riskExposure: this.calculateRiskExposure(agents)
      }

      this.emit('performanceUpdated', this.performanceMetrics)
    } catch (error) {
      console.error('Error updating performance metrics:', error)
    }
  }

  // Profit collection system
  async triggerProfitCollection(
    source: 'goal' | 'agent' | 'farm' | 'manual',
    sourceId: string,
    sourceName: string,
    amount: number,
    reason?: string
  ): Promise<boolean> {
    try {
      const collection: ProfitCollection = {
        id: `collection_${Date.now()}`,
        source,
        sourceId,
        sourceName,
        amount,
        token: 'USDC',
        chain: 'ethereum', // Default chain
        timestamp: new Date(),
        reason: reason || `Profit collection from ${sourceName}`,
        status: 'pending',
        vaultAddress: this.vaultWallets.get('ethereum')?.address || ''
      }

      this.profitCollections.set(collection.id, collection)
      
      // Execute the collection
      const success = await this.executeProfitCollection(collection)
      
      if (success) {
        collection.status = 'completed'
        this.emit('profitCollected', collection)
        console.log(`💰 Profit collected: $${amount.toFixed(2)} from ${sourceName}`)
      } else {
        collection.status = 'failed'
        this.emit('profitCollectionFailed', collection)
      }

      return success
    } catch (error) {
      console.error('Error triggering profit collection:', error)
      return false
    }
  }

  private async executeProfitCollection(collection: ProfitCollection): Promise<boolean> {
    try {
      // In a real implementation, this would execute the actual blockchain transaction
      // For now, we'll simulate the collection
      
      const decision: BankMasterDecision = {
        id: `decision_${Date.now()}`,
        type: 'collection',
        reasoning: `Collecting profits from ${collection.sourceName}`,
        confidence: 90,
        expectedOutcome: `$${collection.amount.toFixed(2)} added to vault`,
        riskAssessment: 10,
        timestamp: new Date(),
        parameters: collection
      }

      this.decisions.set(decision.id, decision)
      
      // Simulate transaction
      collection.txHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      return true
    } catch (error) {
      console.error('Error executing profit collection:', error)
      return false
    }
  }

  // Rebalancing system
  private async performRebalancing() {
    try {
      const decision: BankMasterDecision = {
        id: `decision_${Date.now()}`,
        type: 'rebalance',
        reasoning: 'Periodic portfolio rebalancing',
        confidence: 75,
        expectedOutcome: 'Optimized risk-adjusted returns',
        riskAssessment: 25,
        timestamp: new Date(),
        parameters: {}
      }

      this.decisions.set(decision.id, decision)
      
      // Analyze current allocations
      const agents = autonomousTradingCoordinator.getAllAgents()
      const allocations = masterWalletManager.getAgentAllocations()
      
      // Find underperforming agents
      const underperformers = agents.filter(a => a.performance.netProfit < 0)
      
      // Find high performers
      const highPerformers = agents.filter(a => a.performance.netProfit > this.config.profitThreshold)
      
      // Rebalance funds
      for (const underperformer of underperformers) {
        // Reduce allocation or pause agent
        await this.reduceAgentAllocation(underperformer.id, 0.5)
      }
      
      for (const highPerformer of highPerformers) {
        // Increase allocation
        await this.increaseAgentAllocation(highPerformer.id, 1.2)
      }
      
      this.emit('rebalancingCompleted', { timestamp: new Date() })
      console.log('⚖️ Portfolio rebalancing completed')
    } catch (error) {
      console.error('Error in rebalancing:', error)
    }
  }

  private async reduceAgentAllocation(agentId: string, factor: number): Promise<boolean> {
    // Implementation would reduce agent allocation
    console.log(`📉 Reducing allocation for agent ${agentId} by ${((1 - factor) * 100).toFixed(1)}%`)
    return true
  }

  private async increaseAgentAllocation(agentId: string, factor: number): Promise<boolean> {
    // Implementation would increase agent allocation
    console.log(`📈 Increasing allocation for agent ${agentId} by ${((factor - 1) * 100).toFixed(1)}%`)
    return true
  }

  // Emergency systems
  async executeEmergencyStop(reason: string): Promise<boolean> {
    try {
      const decision: BankMasterDecision = {
        id: `decision_${Date.now()}`,
        type: 'emergency',
        reasoning: `Emergency stop triggered: ${reason}`,
        confidence: 100,
        expectedOutcome: 'System safely halted',
        riskAssessment: 0,
        timestamp: new Date(),
        parameters: { reason }
      }

      this.decisions.set(decision.id, decision)
      
      // Stop all agent trading
      await autonomousTradingCoordinator.stopAutonomousTrading()
      
      // Collect all available profits
      const agents = autonomousTradingCoordinator.getAllAgents()
      for (const agent of agents) {
        if (agent.performance.netProfit > 0) {
          await this.triggerProfitCollection('agent', agent.id, agent.name, agent.performance.netProfit, 'Emergency collection')
        }
      }
      
      this.emit('emergencyStopExecuted', { reason, timestamp: new Date() })
      console.log(`🚨 Emergency stop executed: ${reason}`)
      
      return true
    } catch (error) {
      console.error('Error executing emergency stop:', error)
      return false
    }
  }

  // Chat interface
  async processChat(message: string): Promise<string> {
    try {
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      }

      this.chatHistory.push(chatMessage)

      // Process with LLM if enabled
      let response = ''
      if (this.config.llmEnabled) {
        response = await this.processLLMChat(message)
      } else {
        response = this.processRuleBasedChat(message)
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      this.chatHistory.push(assistantMessage)
      this.emit('chatMessage', assistantMessage)

      return response
    } catch (error) {
      console.error('Error processing chat:', error)
      return 'I apologize, but I encountered an error processing your message.'
    }
  }

  private async processLLMChat(message: string): Promise<string> {
    // This would integrate with your existing LLM system
    const context = {
      ...this.llmContext,
      currentMetrics: this.performanceMetrics,
      recentDecisions: Array.from(this.decisions.values()).slice(-5),
      systemState: {
        activeAgents: autonomousTradingCoordinator.getAllAgents().length,
        totalAssets: this.performanceMetrics?.totalAssetsManaged || 0,
        totalProfits: this.performanceMetrics?.totalProfitsCollected || 0
      }
    }

    // Mock LLM response
    return `Based on my analysis of the current system state, I can provide insights on ${message}. Current system performance shows ${this.performanceMetrics?.avgROI.toFixed(2)}% ROI with ${this.performanceMetrics?.totalDecisions} decisions made.`
  }

  private processRuleBasedChat(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('status') || lowerMessage.includes('overview')) {
      return Promise.resolve(this.generateStatusReport())
    } else if (lowerMessage.includes('performance') || lowerMessage.includes('metrics')) {
      return Promise.resolve(this.generatePerformanceReport())
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('exposure')) {
      return Promise.resolve(this.generateRiskReport())
    } else if (lowerMessage.includes('agents')) {
      return Promise.resolve(this.generateAgentReport())
    } else if (lowerMessage.includes('goals')) {
      return Promise.resolve(this.generateGoalReport())
    } else if (lowerMessage.includes('farms')) {
      return Promise.resolve(this.generateFarmReport())
    } else {
      return Promise.resolve('I can help you with status updates, performance metrics, risk analysis, and information about agents, goals, and farms. What would you like to know?')
    }
  }

  private generateStatusReport(): string {
    const metrics = this.performanceMetrics
    if (!metrics) return 'Performance metrics not available.'

    return `Bank Master Status Report:
• Total Assets: $${metrics.totalAssetsManaged.toFixed(2)}
• Total Profits: $${metrics.totalProfitsCollected.toFixed(2)}
• Average ROI: ${metrics.avgROI.toFixed(2)}%
• Active Decisions: ${metrics.totalDecisions}
• System Status: ${this.isActive ? 'Active' : 'Inactive'}
• Supported Chains: ${this.config.supportedChains.join(', ')}`
  }

  private generatePerformanceReport(): string {
    const metrics = this.performanceMetrics
    if (!metrics) return 'Performance metrics not available.'

    return `Performance Report:
• Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
• Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%
• Win Rate: ${metrics.winRate.toFixed(1)}%
• Total Returns: $${metrics.totalReturns.toFixed(2)}
• Success Rate: ${((metrics.successfulDecisions / metrics.totalDecisions) * 100).toFixed(1)}%`
  }

  private generateRiskReport(): string {
    const metrics = this.performanceMetrics
    if (!metrics) return 'Risk metrics not available.'

    return `Risk Analysis:
• Current Risk Level: ${metrics.maxDrawdown < 5 ? 'Low' : metrics.maxDrawdown < 10 ? 'Medium' : 'High'}
• Risk Exposure: ${Object.entries(metrics.riskExposure).map(([key, value]) => `${key}: ${value.toFixed(2)}%`).join(', ')}
• Emergency Stop Threshold: ${this.config.emergencyStopThreshold}%`
  }

  private generateAgentReport(): string {
    const agents = autonomousTradingCoordinator.getAllAgents()
    const activeAgents = agents.filter(a => a.status === 'active')
    
    return `Agent Report:
• Total Agents: ${agents.length}
• Active Agents: ${activeAgents.length}
• Top Performers: ${this.performanceMetrics?.topPerformingAgents.map(a => `${a.agentId}: ${a.roi.toFixed(2)}%`).join(', ') || 'None'}`
  }

  private generateGoalReport(): string {
    const goals = GoalsService.getInstance().getAllGoals()
    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = goals.filter(g => g.status === 'completed')
    
    return `Goal Report:
• Total Goals: ${goals.length}
• Active Goals: ${activeGoals.length}
• Completed Goals: ${completedGoals.length}
• Completion Rate: ${((completedGoals.length / goals.length) * 100).toFixed(1)}%`
  }

  private generateFarmReport(): string {
    const farms = FarmsService.getInstance().getAllFarms()
    const activeFarms = farms.filter(f => f.is_active)
    
    return `Farm Report:
• Total Farms: ${farms.length}
• Active Farms: ${activeFarms.length}
• Total Allocated: $${farms.reduce((sum, f) => sum + f.total_allocated_usd, 0).toFixed(2)}`
  }

  // Utility methods
  private calculateSharpeRatio(agents: AutonomousAgent[]): number {
    if (agents.length === 0) return 0
    
    const returns = agents.map(a => a.performance.netProfit / Math.max(a.allocation.allocatedAmount, 1))
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    
    return stdDev > 0 ? avgReturn / stdDev : 0
  }

  private calculateMaxDrawdown(agents: AutonomousAgent[]): number {
    if (agents.length === 0) return 0
    
    const drawdowns = agents.map(a => {
      const allocation = a.allocation.allocatedAmount
      const currentValue = allocation + a.performance.netProfit
      return ((allocation - currentValue) / allocation) * 100
    })
    
    return Math.max(...drawdowns, 0)
  }

  private calculateWinRate(agents: AutonomousAgent[]): number {
    if (agents.length === 0) return 0
    
    const profitableAgents = agents.filter(a => a.performance.netProfit > 0).length
    return (profitableAgents / agents.length) * 100
  }

  private calculateRiskExposure(agents: AutonomousAgent[]): Record<string, number> {
    const totalAllocation = agents.reduce((sum, a) => sum + a.allocation.allocatedAmount, 0)
    const exposure: Record<string, number> = {}
    
    agents.forEach(agent => {
      const percentage = (agent.allocation.allocatedAmount / totalAllocation) * 100
      exposure[agent.type] = (exposure[agent.type] || 0) + percentage
    })
    
    return exposure
  }

  // Event handlers
  private async handleGoalCompletion(goal: any) {
    console.log(`🎯 Goal completed: ${goal.name}`)
    await this.triggerProfitCollection('goal', goal.id, goal.name, goal.target, 'Goal completion')
  }

  private async handleAgentPerformance(data: any) {
    console.log(`📊 Agent performance update: ${data.agentId}`)
    // Could trigger profit collection if thresholds are met
  }

  private async handleFarmPerformance(data: any) {
    console.log(`🚜 Farm performance update: ${data.farmId}`)
    // Could trigger profit collection if thresholds are met
  }

  private async handleDepositDetected(data: any) {
    console.log(`💵 Deposit detected: $${data.amount.toFixed(2)}`)
    // Could trigger automatic allocation decisions
  }

  private async handleFundsAllocated(data: any) {
    console.log(`💰 Funds allocated: $${data.amount} to ${data.agentId}`)
    // Update internal tracking
  }

  // Getters
  getConfig(): BankMasterConfig {
    return this.config
  }

  getPerformanceMetrics(): PerformanceMetrics | null {
    return this.performanceMetrics
  }

  getProfitCollections(): ProfitCollection[] {
    return Array.from(this.profitCollections.values())
  }

  getVaultOperations(): VaultOperation[] {
    return Array.from(this.vaultOperations.values())
  }

  getDecisions(): BankMasterDecision[] {
    return Array.from(this.decisions.values())
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory
  }

  getVaultBalances(): Record<string, number> {
    const balances: Record<string, number> = {}
    // Would implement actual balance fetching
    return balances
  }

  isActiveStatus(): boolean {
    return this.isActive
  }

  // Cleanup
  destroy() {
    this.deactivate()
    this.removeAllListeners()
  }
}

// Default configuration
const DEFAULT_BANK_MASTER_CONFIG: BankMasterConfig = {
  id: 'bank_master_001',
  name: 'Primary Bank Master',
  version: '1.0.0',
  capabilities: [
    'profit_collection',
    'fund_allocation',
    'risk_management',
    'portfolio_optimization',
    'emergency_controls',
    'cross_chain_operations',
    'llm_integration',
    'mcp_integration'
  ],
  riskTolerance: 0.15, // 15% max drawdown
  maxAllocationPerAgent: 1000, // $1000 max per agent
  profitThreshold: 50, // $50 profit threshold
  rebalanceInterval: 300000, // 5 minutes
  emergencyStopThreshold: 50, // 50% loss threshold
  multiChainEnabled: true,
  supportedChains: ['ethereum', 'arbitrum', 'base', 'sonic', 'solana', 'berachain', 'bitcoin', 'monad', 'sui'],
  llmEnabled: true,
  mcpEnabled: true
}

// Lazy initialization
let bankMasterAgentInstance: BankMasterAgent | null = null

export function getBankMasterAgent(): BankMasterAgent {
  if (!bankMasterAgentInstance) {
    bankMasterAgentInstance = new BankMasterAgent(DEFAULT_BANK_MASTER_CONFIG)
  }
  return bankMasterAgentInstance
}

// For backward compatibility
export const bankMasterAgent = {
  get instance() {
    return getBankMasterAgent()
  }
}
export default bankMasterAgent