'use client'

import { EventEmitter } from 'events'
import { defiService, ArbitrageOpportunity } from './defi-service'
import { agentWalletIntegration } from './agent-wallet-integration'

export interface ArbitrageBot {
  id: string
  name: string
  agentId: string
  isActive: boolean
  targetTokenPairs: string[]
  minProfitThreshold: number
  maxTradeSize: number
  chains: string[]
  riskLevel: 'low' | 'medium' | 'high'
  performance: {
    totalTrades: number
    successfulTrades: number
    totalProfit: number
    successRate: number
    avgExecutionTime: number
  }
}

export interface ArbitrageExecution {
  id: string
  botId: string
  opportunity: ArbitrageOpportunity
  tradeSize: number
  buyTxHash: string | null
  sellTxHash: string | null
  status: 'pending' | 'partial' | 'completed' | 'failed'
  actualProfit: number
  gasSpent: number
  executionTime: number
  timestamp: Date
  error?: string
}

export interface ArbitrageMetrics {
  totalOpportunities: number
  exploitedOpportunities: number
  avgSpread: number
  avgProfit: number
  totalVolume: number
  successRate: number
  avgGasCost: number
  profitabilityRatio: number
}

class DexArbitrageService extends EventEmitter {
  private bots: Map<string, ArbitrageBot> = new Map()
  private executions: Map<string, ArbitrageExecution[]> = new Map()
  private scanningInterval?: NodeJS.Timeout
  private isScanning = false
  private opportunityHistory: ArbitrageOpportunity[] = []

  constructor() {
    super()
    this.initializeService()
  }

  private initializeService() {
    console.log('🔍 DEX Arbitrage service initialized')
    this.startOpportunityScanning()
  }

  // Start scanning for arbitrage opportunities
  private startOpportunityScanning() {
    if (this.isScanning) return

    this.isScanning = true
    this.scanningInterval = setInterval(async () => {
      await this.scanForOpportunities()
    }, 15000) // Scan every 15 seconds

    console.log('🔄 Started arbitrage opportunity scanning')
  }

  // Stop scanning for opportunities
  stopScanning() {
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval)
      this.scanningInterval = undefined
    }
    this.isScanning = false
    console.log('⏹️ Stopped arbitrage opportunity scanning')
  }

  // Scan for arbitrage opportunities across all token pairs and chains
  private async scanForOpportunities() {
    try {
      const tokenPairs = [
        'WETH/USDC',
        'WETH/USDT',
        'USDC/USDT',
        'WBTC/WETH',
        'WBTC/USDC'
      ]

      const chains = ['eth-sepolia', 'arb-sepolia']
      const allOpportunities: ArbitrageOpportunity[] = []

      for (const chain of chains) {
        for (const pair of tokenPairs) {
          try {
            const opportunities = await defiService.findArbitrageOpportunities(pair, chain)
            allOpportunities.push(...opportunities.map(op => ({ ...op, chain })))
          } catch (error) {
            console.error(`Error scanning ${pair} on ${chain}:`, error)
          }
        }
      }

      // Filter profitable opportunities
      const profitableOpportunities = allOpportunities.filter(op => 
        op.estimatedProfit > 5 && op.priceSpread > 0.3 && op.confidence > 60
      )

      // Store opportunity history
      this.opportunityHistory.push(...profitableOpportunities)
      if (this.opportunityHistory.length > 1000) {
        this.opportunityHistory = this.opportunityHistory.slice(-500) // Keep last 500
      }

      if (profitableOpportunities.length > 0) {
        console.log(`🎯 Found ${profitableOpportunities.length} arbitrage opportunities`)
        this.emit('opportunitiesFound', profitableOpportunities)

        // Execute opportunities for active bots
        await this.executeOpportunities(profitableOpportunities)
      }
    } catch (error) {
      console.error('Error scanning for opportunities:', error)
    }
  }

  // Execute opportunities for active bots
  private async executeOpportunities(opportunities: ArbitrageOpportunity[]) {
    const activeBots = Array.from(this.bots.values()).filter(bot => bot.isActive)

    for (const bot of activeBots) {
      for (const opportunity of opportunities) {
        // Check if bot should trade this opportunity
        if (this.shouldExecuteOpportunity(bot, opportunity)) {
          await this.executeArbitrage(bot, opportunity)
        }
      }
    }
  }

  // Check if bot should execute an opportunity
  private shouldExecuteOpportunity(bot: ArbitrageBot, opportunity: ArbitrageOpportunity): boolean {
    // Check profit threshold
    if (opportunity.estimatedProfit < bot.minProfitThreshold) {
      return false
    }

    // Check token pair
    if (!bot.targetTokenPairs.includes(opportunity.tokenPair)) {
      return false
    }

    // Check risk level compatibility
    const riskScore = this.calculateRiskScore(opportunity)
    switch (bot.riskLevel) {
      case 'low':
        return riskScore < 30 && opportunity.confidence > 80
      case 'medium':
        return riskScore < 60 && opportunity.confidence > 70
      case 'high':
        return riskScore < 90 && opportunity.confidence > 60
      default:
        return false
    }
  }

  // Calculate risk score for an opportunity
  private calculateRiskScore(opportunity: ArbitrageOpportunity): number {
    let riskScore = 0

    // Price spread risk (lower spread = higher risk)
    if (opportunity.priceSpread < 0.5) riskScore += 30
    else if (opportunity.priceSpread < 1.0) riskScore += 15

    // Execution time risk (longer time = higher risk)
    if (opportunity.executionTime > 60) riskScore += 25
    else if (opportunity.executionTime > 30) riskScore += 10

    // Gas cost risk (higher gas = higher risk)
    if (opportunity.gasEstimate > 500000) riskScore += 20
    else if (opportunity.gasEstimate > 300000) riskScore += 10

    // Confidence risk
    if (opportunity.confidence < 70) riskScore += 25
    else if (opportunity.confidence < 80) riskScore += 10

    return Math.min(riskScore, 100)
  }

  // Execute arbitrage for a bot
  async executeArbitrage(bot: ArbitrageBot, opportunity: ArbitrageOpportunity): Promise<ArbitrageExecution | null> {
    try {
      const startTime = Date.now()

      // Calculate trade size based on bot configuration
      const tradeSize = Math.min(
        bot.maxTradeSize,
        opportunity.minimumAmount,
        opportunity.estimatedProfit * 10 // Conservative sizing
      )

      // Create execution record
      const execution: ArbitrageExecution = {
        id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        botId: bot.id,
        opportunity,
        tradeSize,
        buyTxHash: null,
        sellTxHash: null,
        status: 'pending',
        actualProfit: 0,
        gasSpent: 0,
        executionTime: 0,
        timestamp: new Date()
      }

      // Store execution
      const botExecutions = this.executions.get(bot.id) || []
      botExecutions.push(execution)
      this.executions.set(bot.id, botExecutions)

      this.emit('arbitrageStarted', execution)

      // Get agent configuration
      const agentConfig = agentWalletIntegration.getAgentConfig(bot.agentId)
      if (!agentConfig) {
        throw new Error(`Agent configuration not found for ${bot.agentId}`)
      }

      // Get agent wallets
      const wallets = agentWalletIntegration.getAgentWallets(bot.agentId)
      if (wallets.length === 0) {
        throw new Error(`No wallets found for agent ${bot.agentId}`)
      }

      // Find appropriate wallet for the chain
      const wallet = wallets.find(w => {
        const chainKey = (opportunity as any).chain || 'eth-sepolia'
        return (chainKey === 'eth-sepolia' && w.chain === 'ethereum') ||
               (chainKey === 'arb-sepolia' && w.chain === 'arbitrum')
      })

      if (!wallet) {
        throw new Error('No suitable wallet found for arbitrage execution')
      }

      // Execute the arbitrage
      const chainKey = (opportunity as any).chain || 'eth-sepolia'
      const result = await defiService.executeArbitrage(
        wallet.privateKey,
        opportunity,
        tradeSize.toString(),
        chainKey
      )

      execution.buyTxHash = result.buyTx
      execution.sellTxHash = result.sellTx

      if (result.buyTx && result.sellTx) {
        execution.status = 'completed'
        execution.actualProfit = opportunity.estimatedProfit * 0.85 // Conservative estimate
      } else if (result.buyTx || result.sellTx) {
        execution.status = 'partial'
        execution.actualProfit = -20 // Loss due to incomplete arbitrage
      } else {
        execution.status = 'failed'
        execution.actualProfit = -5 // Small loss due to failed execution
      }

      execution.executionTime = Date.now() - startTime
      execution.gasSpent = opportunity.gasEstimate * 20 / 1e9 // Approximate gas cost in ETH

      // Update bot performance
      this.updateBotPerformance(bot, execution)

      this.emit('arbitrageCompleted', execution)
      console.log(`${execution.status === 'completed' ? '✅' : '❌'} Arbitrage ${execution.status} for bot ${bot.name}`)

      return execution
    } catch (error) {
      console.error('Error executing arbitrage:', error)
      
      // Update execution with error
      const botExecutions = this.executions.get(bot.id) || []
      const execution = botExecutions[botExecutions.length - 1]
      if (execution) {
        execution.status = 'failed'
        execution.error = error instanceof Error ? error.message : 'Unknown error'
        execution.actualProfit = -10 // Loss due to failed execution
        this.updateBotPerformance(bot, execution)
        this.emit('arbitrageCompleted', execution)
      }

      return null
    }
  }

  // Update bot performance metrics
  private updateBotPerformance(bot: ArbitrageBot, execution: ArbitrageExecution) {
    bot.performance.totalTrades++
    
    if (execution.status === 'completed') {
      bot.performance.successfulTrades++
      bot.performance.totalProfit += execution.actualProfit
    }

    bot.performance.successRate = 
      (bot.performance.successfulTrades / bot.performance.totalTrades) * 100

    bot.performance.avgExecutionTime = 
      ((bot.performance.avgExecutionTime * (bot.performance.totalTrades - 1)) + execution.executionTime) / 
      bot.performance.totalTrades
  }

  // Create a new arbitrage bot
  createArbitrageBot(config: {
    name: string
    agentId: string
    targetTokenPairs: string[]
    minProfitThreshold: number
    maxTradeSize: number
    chains: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }): ArbitrageBot {
    const bot: ArbitrageBot = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      agentId: config.agentId,
      isActive: false,
      targetTokenPairs: config.targetTokenPairs,
      minProfitThreshold: config.minProfitThreshold,
      maxTradeSize: config.maxTradeSize,
      chains: config.chains,
      riskLevel: config.riskLevel,
      performance: {
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: 0,
        successRate: 0,
        avgExecutionTime: 0
      }
    }

    this.bots.set(bot.id, bot)
    this.executions.set(bot.id, [])

    console.log(`🤖 Created arbitrage bot: ${bot.name}`)
    this.emit('botCreated', bot)

    return bot
  }

  // Start/stop a bot
  toggleBot(botId: string, isActive: boolean): boolean {
    const bot = this.bots.get(botId)
    if (!bot) return false

    bot.isActive = isActive
    console.log(`${isActive ? '▶️' : '⏸️'} Bot ${bot.name} ${isActive ? 'started' : 'stopped'}`)
    this.emit('botToggled', { botId, isActive })

    return true
  }

  // Get all bots
  getAllBots(): ArbitrageBot[] {
    return Array.from(this.bots.values())
  }

  // Get bot executions
  getBotExecutions(botId: string): ArbitrageExecution[] {
    return this.executions.get(botId) || []
  }

  // Get arbitrage metrics
  getArbitrageMetrics(): ArbitrageMetrics {
    const allExecutions = Array.from(this.executions.values()).flat()
    const successfulExecutions = allExecutions.filter(e => e.status === 'completed')

    return {
      totalOpportunities: this.opportunityHistory.length,
      exploitedOpportunities: allExecutions.length,
      avgSpread: this.opportunityHistory.reduce((sum, op) => sum + op.priceSpread, 0) / 
                 Math.max(this.opportunityHistory.length, 1),
      avgProfit: successfulExecutions.reduce((sum, e) => sum + e.actualProfit, 0) / 
                 Math.max(successfulExecutions.length, 1),
      totalVolume: allExecutions.reduce((sum, e) => sum + e.tradeSize, 0),
      successRate: (successfulExecutions.length / Math.max(allExecutions.length, 1)) * 100,
      avgGasCost: allExecutions.reduce((sum, e) => sum + e.gasSpent, 0) / 
                  Math.max(allExecutions.length, 1),
      profitabilityRatio: this.calculateProfitabilityRatio(allExecutions)
    }
  }

  // Calculate profitability ratio
  private calculateProfitabilityRatio(executions: ArbitrageExecution[]): number {
    const totalProfit = executions.reduce((sum, e) => sum + Math.max(0, e.actualProfit), 0)
    const totalLoss = executions.reduce((sum, e) => sum + Math.abs(Math.min(0, e.actualProfit)), 0)
    
    return totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 10 : 0
  }

  // Get recent opportunities
  getRecentOpportunities(limit: number = 50): ArbitrageOpportunity[] {
    return this.opportunityHistory.slice(-limit)
  }

  // Delete a bot
  deleteBot(botId: string): boolean {
    const bot = this.bots.get(botId)
    if (!bot) return false

    this.bots.delete(botId)
    this.executions.delete(botId)

    console.log(`🗑️ Deleted arbitrage bot: ${bot.name}`)
    this.emit('botDeleted', { botId })

    return true
  }

  // Clean up resources
  destroy() {
    this.stopScanning()
    this.removeAllListeners()
  }
}

export const dexArbitrageService = new DexArbitrageService()
export default dexArbitrageService