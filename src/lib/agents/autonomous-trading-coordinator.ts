'use client'

import { EventEmitter } from 'events'
import { masterWalletManager, MasterWallet, AgentAllocation } from '../blockchain/master-wallet-manager'
import { testnetWalletManager, TestnetWallet } from '../blockchain/testnet-wallet-manager'
import { agentWalletIntegration, AgentWalletConfig } from '../blockchain/agent-wallet-integration'
import { dexTradingEngine, RealTrade, ArbitrageResult } from '../dex/dex-trading-engine'
import { defiService } from '../blockchain/defi-service'

export interface AutonomousAgent {
  id: string
  name: string
  type: 'scalper' | 'arbitrager' | 'trend_follower' | 'market_maker' | 'yield_farmer'
  status: 'active' | 'paused' | 'stopped'
  wallets: TestnetWallet[]
  allocation: AgentAllocation
  performance: AgentPerformance
  tradingParameters: TradingParameters
  riskLimits: RiskLimits
  lastActivity: Date
  createdAt: Date
}

export interface TradingParameters {
  maxTradeSize: number
  minTradeSize: number
  targetTokens: string[]
  preferredDEXes: string[]
  slippageTolerance: number
  maxConcurrentTrades: number
  tradingInterval: number // milliseconds
  stopLossPercentage: number
  takeProfitPercentage: number
}

export interface RiskLimits {
  maxDailyLoss: number
  maxDrawdown: number
  maxExposurePerToken: number
  maxGasSpendPerHour: number
  emergencyStopTrigger: number
}

export interface AgentPerformance {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalVolume: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  winRate: number
  avgTradeSize: number
  maxProfit: number
  maxLoss: number
  sharpeRatio: number
  dailyReturns: number[]
  riskScore: number
}

export interface TradingSignal {
  agentId: string
  type: 'buy' | 'sell' | 'arbitrage' | 'liquidity'
  tokenPair: string
  amount: number
  confidence: number
  reason: string
  urgency: 'low' | 'medium' | 'high'
  validUntil: Date
}

class AutonomousTradingCoordinator extends EventEmitter {
  private agents: Map<string, AutonomousAgent> = new Map()
  private tradingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private monitoringInterval?: NodeJS.Timeout
  private performanceInterval?: NodeJS.Timeout
  private isRunning = false
  
  // Pre-configured agent templates
  private readonly AGENT_TEMPLATES: Record<string, Partial<AutonomousAgent>> = {
    scalper: {
      type: 'scalper',
      tradingParameters: {
        maxTradeSize: 50,
        minTradeSize: 5,
        targetTokens: ['WETH', 'USDC', 'USDT'],
        preferredDEXes: ['uniswap_v3', '1inch'],
        slippageTolerance: 0.1,
        maxConcurrentTrades: 3,
        tradingInterval: 30000, // 30 seconds
        stopLossPercentage: 2,
        takeProfitPercentage: 1
      },
      riskLimits: {
        maxDailyLoss: 20,
        maxDrawdown: 10,
        maxExposurePerToken: 30,
        maxGasSpendPerHour: 5,
        emergencyStopTrigger: 50
      }
    },
    arbitrager: {
      type: 'arbitrager',
      tradingParameters: {
        maxTradeSize: 100,
        minTradeSize: 10,
        targetTokens: ['WETH', 'USDC', 'USDT', 'DAI'],
        preferredDEXes: ['uniswap_v3', 'sushiswap', '1inch'],
        slippageTolerance: 0.2,
        maxConcurrentTrades: 5,
        tradingInterval: 15000, // 15 seconds
        stopLossPercentage: 1,
        takeProfitPercentage: 0.5
      },
      riskLimits: {
        maxDailyLoss: 15,
        maxDrawdown: 8,
        maxExposurePerToken: 40,
        maxGasSpendPerHour: 8,
        emergencyStopTrigger: 40
      }
    },
    trend_follower: {
      type: 'trend_follower',
      tradingParameters: {
        maxTradeSize: 75,
        minTradeSize: 15,
        targetTokens: ['WETH', 'WBTC', 'USDC'],
        preferredDEXes: ['uniswap_v3', '1inch'],
        slippageTolerance: 0.5,
        maxConcurrentTrades: 2,
        tradingInterval: 300000, // 5 minutes
        stopLossPercentage: 5,
        takeProfitPercentage: 10
      },
      riskLimits: {
        maxDailyLoss: 30,
        maxDrawdown: 15,
        maxExposurePerToken: 60,
        maxGasSpendPerHour: 3,
        emergencyStopTrigger: 60
      }
    }
  }

  constructor() {
    super()
    this.initializeCoordinator()
  }

  private initializeCoordinator() {
    // Listen for funding events
    masterWalletManager.on('fundsAllocated', this.handleFundsAllocated.bind(this))
    masterWalletManager.on('depositDetected', this.handleNewDeposit.bind(this))
    
    // Listen for DEX trading events
    dexTradingEngine.on('tradeExecuted', this.handleTradeExecuted.bind(this))
    dexTradingEngine.on('tradeConfirmed', this.handleTradeConfirmed.bind(this))
    dexTradingEngine.on('arbitrageCompleted', this.handleArbitrageCompleted.bind(this))
    
    console.log('🤖 Autonomous Trading Coordinator initialized')
  }

  // Start the autonomous trading system
  async startAutonomousTrading(): Promise<boolean> {
    try {
      if (this.isRunning) {
        console.log('⚠️  Trading system already running')
        return true
      }

      // Check if we have master wallets with funds
      const masterWallets = masterWalletManager.getAllMasterWallets()
      const fundsAvailable = masterWallets.some(w => w.availableFunds > 0)
      
      if (!fundsAvailable) {
        throw new Error('No funds available in master wallets')
      }

      // Check DEX trading engine
      if (!dexTradingEngine.isTradingEnabled()) {
        throw new Error('DEX trading engine not enabled')
      }

      this.isRunning = true
      
      // Start monitoring and performance tracking
      this.startMonitoring()
      this.startPerformanceTracking()
      
      // Start all active agents
      for (const agent of this.agents.values()) {
        if (agent.status === 'active') {
          await this.startAgentTrading(agent.id)
        }
      }

      this.emit('tradingStarted')
      console.log('🚀 Autonomous trading system started with', this.agents.size, 'agents')
      
      return true
    } catch (error) {
      console.error('❌ Failed to start autonomous trading:', error)
      this.isRunning = false
      return false
    }
  }

  // Stop the autonomous trading system
  async stopAutonomousTrading(): Promise<boolean> {
    try {
      this.isRunning = false
      
      // Stop all agent trading
      for (const agentId of this.agents.keys()) {
        await this.stopAgentTrading(agentId)
      }
      
      // Clear intervals
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
      }
      if (this.performanceInterval) {
        clearInterval(this.performanceInterval)
      }
      
      this.emit('tradingStopped')
      console.log('🛑 Autonomous trading system stopped')
      
      return true
    } catch (error) {
      console.error('❌ Failed to stop autonomous trading:', error)
      return false
    }
  }

  // Create and deploy a new autonomous agent
  async deployAgent(
    name: string,
    type: 'scalper' | 'arbitrager' | 'trend_follower' | 'market_maker' | 'yield_farmer',
    allocation: number,
    chain: 'ethereum' | 'arbitrum' = 'ethereum',
    customParameters?: Partial<TradingParameters>
  ): Promise<AutonomousAgent | null> {
    try {
      const agentId = `agent_${type}_${Date.now()}`
      
      // Check if we have sufficient funds
      const masterWallet = masterWalletManager.getMasterWallet(chain)
      if (!masterWallet || masterWallet.availableFunds < allocation) {
        throw new Error(`Insufficient funds. Available: $${masterWallet?.availableFunds || 0}`)
      }

      // Allocate funds to agent
      const allocationSuccess = await masterWalletManager.allocateFundsToAgent(
        agentId,
        name,
        allocation,
        chain
      )
      
      if (!allocationSuccess) {
        throw new Error('Failed to allocate funds to agent')
      }

      // Get agent allocation info
      const agentAllocation = masterWalletManager.getAgentAllocations()
        .find(a => a.agentId === agentId)
      
      if (!agentAllocation) {
        throw new Error('Agent allocation not found')
      }

      // Create agent wallets
      const wallets = await testnetWalletManager.createWalletsForAgent(agentId, name)
      
      // Get template configuration
      const template = this.AGENT_TEMPLATES[type]
      if (!template) {
        throw new Error(`Unknown agent type: ${type}`)
      }

      // Create agent
      const agent: AutonomousAgent = {
        id: agentId,
        name,
        type,
        status: 'paused',
        wallets,
        allocation: agentAllocation,
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          failedTrades: 0,
          totalVolume: 0,
          totalProfit: 0,
          totalLoss: 0,
          netProfit: 0,
          winRate: 0,
          avgTradeSize: 0,
          maxProfit: 0,
          maxLoss: 0,
          sharpeRatio: 0,
          dailyReturns: [],
          riskScore: 0
        },
        tradingParameters: {
          ...template.tradingParameters!,
          ...customParameters
        },
        riskLimits: template.riskLimits!,
        lastActivity: new Date(),
        createdAt: new Date()
      }

      this.agents.set(agentId, agent)
      this.emit('agentDeployed', agent)
      
      console.log(`🤖 Agent ${name} deployed with $${allocation} allocation`)
      
      return agent
    } catch (error) {
      console.error('❌ Failed to deploy agent:', error)
      return null
    }
  }

  // Start trading for a specific agent
  async startAgentTrading(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`)
      }

      if (agent.status === 'active') {
        console.log(`⚠️  Agent ${agent.name} already active`)
        return true
      }

      agent.status = 'active'
      agent.lastActivity = new Date()

      // Start trading interval based on agent type
      const interval = setInterval(async () => {
        await this.executeAgentTradingCycle(agentId)
      }, agent.tradingParameters.tradingInterval)

      this.tradingIntervals.set(agentId, interval)
      
      this.emit('agentStarted', agent)
      console.log(`▶️  Started trading for agent ${agent.name}`)
      
      return true
    } catch (error) {
      console.error(`❌ Failed to start agent ${agentId}:`, error)
      return false
    }
  }

  // Stop trading for a specific agent
  async stopAgentTrading(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) return false

      agent.status = 'stopped'
      
      const interval = this.tradingIntervals.get(agentId)
      if (interval) {
        clearInterval(interval)
        this.tradingIntervals.delete(agentId)
      }

      this.emit('agentStopped', agent)
      console.log(`⏹️  Stopped trading for agent ${agent.name}`)
      
      return true
    } catch (error) {
      console.error(`❌ Failed to stop agent ${agentId}:`, error)
      return false
    }
  }

  // Execute a single trading cycle for an agent
  private async executeAgentTradingCycle(agentId: string) {
    try {
      const agent = this.agents.get(agentId)
      if (!agent || agent.status !== 'active') return

      // Check risk limits
      if (!this.checkRiskLimits(agent)) {
        agent.status = 'paused'
        this.emit('agentPaused', { agent, reason: 'Risk limits exceeded' })
        return
      }

      // Get trading signal based on agent type
      const signal = await this.generateTradingSignal(agent)
      if (!signal) return

      // Execute trade based on signal
      await this.executeTradingSignal(agent, signal)
      
      agent.lastActivity = new Date()
    } catch (error) {
      console.error(`❌ Error in trading cycle for agent ${agentId}:`, error)
    }
  }

  // Generate trading signal for agent
  private async generateTradingSignal(agent: AutonomousAgent): Promise<TradingSignal | null> {
    try {
      const wallet = agent.wallets[0] // Use first wallet
      if (!wallet) return null

      const chainKey = wallet.chain === 'ethereum' ? 'eth-sepolia' : 'arb-sepolia'

      switch (agent.type) {
        case 'arbitrager':
          // Look for arbitrage opportunities
          const opportunities = await defiService.findArbitrageOpportunities('USDC/WETH', chainKey)
          const bestOpportunity = opportunities.find(o => 
            o.estimatedProfit > agent.tradingParameters.minTradeSize && 
            o.confidence > 70
          )
          
          if (bestOpportunity) {
            return {
              agentId: agent.id,
              type: 'arbitrage',
              tokenPair: bestOpportunity.tokenPair,
              amount: Math.min(bestOpportunity.estimatedProfit * 10, agent.tradingParameters.maxTradeSize),
              confidence: bestOpportunity.confidence,
              reason: `Arbitrage opportunity: ${bestOpportunity.priceSpread.toFixed(2)}% spread`,
              urgency: bestOpportunity.estimatedProfit > 50 ? 'high' : 'medium',
              validUntil: new Date(Date.now() + 30000) // 30 seconds
            }
          }
          break

        case 'scalper':
          // Simple scalping logic (mock)
          if (Math.random() > 0.7) { // 30% chance to trade
            return {
              agentId: agent.id,
              type: Math.random() > 0.5 ? 'buy' : 'sell',
              tokenPair: 'USDC/WETH',
              amount: agent.tradingParameters.minTradeSize + Math.random() * 20,
              confidence: 60 + Math.random() * 30,
              reason: 'Scalping opportunity detected',
              urgency: 'medium',
              validUntil: new Date(Date.now() + 60000) // 1 minute
            }
          }
          break

        case 'trend_follower':
          // Trend following logic (mock)
          if (Math.random() > 0.8) { // 20% chance to trade
            return {
              agentId: agent.id,
              type: 'buy', // Assuming uptrend
              tokenPair: 'USDC/WETH',
              amount: agent.tradingParameters.maxTradeSize * 0.5,
              confidence: 70 + Math.random() * 20,
              reason: 'Uptrend detected',
              urgency: 'low',
              validUntil: new Date(Date.now() + 300000) // 5 minutes
            }
          }
          break
      }

      return null
    } catch (error) {
      console.error(`Error generating signal for agent ${agent.id}:`, error)
      return null
    }
  }

  // Execute trading signal
  private async executeTradingSignal(agent: AutonomousAgent, signal: TradingSignal) {
    try {
      const wallet = agent.wallets[0]
      if (!wallet) return

      console.log(`🎯 Executing ${signal.type} signal for ${agent.name}: ${signal.reason}`)

      if (signal.type === 'arbitrage') {
        // Execute arbitrage
        const result = await dexTradingEngine.executeRealArbitrage(
          agent.id,
          wallet.address,
          wallet.privateKey,
          signal.tokenPair,
          signal.amount.toString(),
          wallet.chain as 'ethereum' | 'arbitrager'
        )
        
        if (result) {
          console.log(`✅ Arbitrage executed for ${agent.name}`)
        }
      } else {
        // Execute regular trade
        const quote = await dexTradingEngine.getRealDEXQuote(
          signal.tokenPair.split('/')[0],
          signal.tokenPair.split('/')[1],
          signal.amount.toString(),
          wallet.chain as 'ethereum' | 'arbitrum'
        )
        
        if (quote) {
          const trade = await dexTradingEngine.executeRealTrade(
            agent.id,
            wallet.address,
            wallet.privateKey,
            quote,
            wallet.chain as 'ethereum' | 'arbitrum'
          )
          
          if (trade) {
            console.log(`✅ Trade executed for ${agent.name}: ${trade.txHash}`)
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error executing signal for agent ${agent.id}:`, error)
    }
  }

  // Check risk limits for agent
  private checkRiskLimits(agent: AutonomousAgent): boolean {
    const limits = agent.riskLimits
    const performance = agent.performance

    // Check daily loss limit
    if (performance.totalLoss > limits.maxDailyLoss) {
      console.log(`⚠️  Agent ${agent.name} hit daily loss limit`)
      return false
    }

    // Check drawdown limit
    const drawdown = performance.totalLoss / Math.max(agent.allocation.allocatedAmount, 1) * 100
    if (drawdown > limits.maxDrawdown) {
      console.log(`⚠️  Agent ${agent.name} hit drawdown limit`)
      return false
    }

    // Check emergency stop
    const totalLossPercent = performance.totalLoss / agent.allocation.allocatedAmount * 100
    if (totalLossPercent > limits.emergencyStopTrigger) {
      console.log(`🚨 EMERGENCY STOP for agent ${agent.name}`)
      return false
    }

    return true
  }

  // Handle events
  private handleFundsAllocated(data: any) {
    console.log(`💰 Funds allocated to agent: $${data.amount}`)
  }

  private handleNewDeposit(data: any) {
    console.log(`💵 New deposit detected: $${data.amount.toFixed(2)}`)
    // Could trigger automatic agent deployment here
  }

  private handleTradeExecuted(trade: RealTrade) {
    const agent = this.agents.get(trade.agentId)
    if (agent) {
      agent.performance.totalTrades++
      agent.performance.totalVolume += parseFloat(trade.inputAmount)
    }
    
    console.log(`📈 Trade executed by ${agent?.name}: ${trade.txHash}`)
  }

  private handleTradeConfirmed(trade: RealTrade) {
    const agent = this.agents.get(trade.agentId)
    if (agent) {
      if (trade.status === 'confirmed') {
        agent.performance.successfulTrades++
        if (trade.profitLoss > 0) {
          agent.performance.totalProfit += trade.profitLoss
        } else {
          agent.performance.totalLoss += Math.abs(trade.profitLoss)
        }
      } else {
        agent.performance.failedTrades++
      }
      
      this.updateAgentPerformance(agent)
    }
  }

  private handleArbitrageCompleted(result: ArbitrageResult) {
    console.log(`💎 Arbitrage completed with profit: $${result.netProfit.toFixed(2)}`)
  }

  // Update agent performance metrics
  private updateAgentPerformance(agent: AutonomousAgent) {
    const perf = agent.performance
    
    perf.netProfit = perf.totalProfit - perf.totalLoss
    perf.winRate = perf.totalTrades > 0 ? (perf.successfulTrades / perf.totalTrades) * 100 : 0
    perf.avgTradeSize = perf.totalTrades > 0 ? perf.totalVolume / perf.totalTrades : 0
    
    // Calculate risk score (simplified)
    perf.riskScore = Math.min(100, (perf.totalLoss / agent.allocation.allocatedAmount) * 100)
  }

  // Start monitoring
  private startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.monitorAgents()
    }, 60000) // Every minute
  }

  // Start performance tracking
  private startPerformanceTracking() {
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics()
    }, 300000) // Every 5 minutes
  }

  // Monitor all agents
  private monitorAgents() {
    for (const agent of this.agents.values()) {
      if (agent.status === 'active') {
        // Check if agent is still healthy
        if (!this.checkRiskLimits(agent)) {
          this.stopAgentTrading(agent.id)
        }
      }
    }
  }

  // Update performance metrics
  private updatePerformanceMetrics() {
    for (const agent of this.agents.values()) {
      this.updateAgentPerformance(agent)
    }
  }

  // Get all agents
  getAllAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values())
  }

  // Get agent by ID
  getAgent(agentId: string): AutonomousAgent | null {
    return this.agents.get(agentId) || null
  }

  // Get system statistics
  getSystemStats() {
    const agents = Array.from(this.agents.values())
    const totalAllocated = agents.reduce((sum, a) => sum + a.allocation.allocatedAmount, 0)
    const totalProfit = agents.reduce((sum, a) => sum + a.performance.netProfit, 0)
    const totalTrades = agents.reduce((sum, a) => sum + a.performance.totalTrades, 0)
    const activeAgents = agents.filter(a => a.status === 'active').length

    return {
      totalAgents: agents.length,
      activeAgents,
      totalAllocated,
      totalProfit,
      totalTrades,
      systemROI: totalAllocated > 0 ? (totalProfit / totalAllocated) * 100 : 0,
      isRunning: this.isRunning
    }
  }

  // Clean up
  destroy() {
    this.stopAutonomousTrading()
    this.removeAllListeners()
  }
}

// Lazy initialization
let autonomousTradingCoordinatorInstance: AutonomousTradingCoordinator | null = null

export function getAutonomousTradingCoordinator(): AutonomousTradingCoordinator {
  if (!autonomousTradingCoordinatorInstance) {
    autonomousTradingCoordinatorInstance = new AutonomousTradingCoordinator()
  }
  return autonomousTradingCoordinatorInstance
}

// For backward compatibility
export const autonomousTradingCoordinator = {
  get instance() {
    return getAutonomousTradingCoordinator()
  }
}

export default autonomousTradingCoordinator