'use client'

import { EventEmitter } from 'events'
import { testnetWalletManager, TestnetWallet } from './testnet-wallet-manager'
import { defiService, SwapQuote, ArbitrageOpportunity } from './defi-service'
import { alchemyService } from './alchemy-service'

export interface AgentWalletConfig {
  agentId: string
  agentName: string
  agentType: 'trading' | 'arbitrage' | 'liquidity' | 'yield_farming'
  chains: ('ethereum' | 'arbitrum')[]
  riskLevel: 'low' | 'medium' | 'high'
  maxTradeSize: number
  allowedTokens: string[]
  tradingStrategy: string
  autoTrading: boolean
}

export interface AgentTrade {
  id: string
  agentId: string
  walletId: string
  type: 'swap' | 'arbitrage' | 'liquidity_add' | 'liquidity_remove'
  inputToken: string
  outputToken: string
  inputAmount: string
  outputAmount: string
  txHash: string
  status: 'pending' | 'confirmed' | 'failed'
  gasUsed: number
  profit: number
  timestamp: Date
  blockNumber?: number
}

export interface AgentPerformance {
  agentId: string
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  successRate: number
  averageProfit: number
  bestTrade: number
  worstTrade: number
  totalGasSpent: number
  roiPercent: number
  sharpeRatio: number
}

class AgentWalletIntegration extends EventEmitter {
  private agentConfigs: Map<string, AgentWalletConfig> = new Map()
  private agentTrades: Map<string, AgentTrade[]> = new Map()
  private agentWallets: Map<string, TestnetWallet[]> = new Map()
  private tradingInterval?: NodeJS.Timeout
  private arbitrageInterval?: NodeJS.Timeout
  private isRunning = false

  constructor() {
    super()
    this.initializeIntegration()
  }

  private async initializeIntegration() {
    // Listen for wallet events
    testnetWalletManager.on('walletCreated', (wallet: TestnetWallet) => {
      this.emit('walletCreated', wallet)
    })

    testnetWalletManager.on('transactionCreated', (transaction: any) => {
      this.emit('transactionCreated', transaction)
    })

    testnetWalletManager.on('arbitrageCompleted', (result: any) => {
      this.handleArbitrageResult(result)
    })

    console.log('🔗 Agent-Wallet integration initialized')
  }

  // Register an agent for automated trading
  async registerAgent(config: AgentWalletConfig): Promise<boolean> {
    try {
      // Create wallets for the agent on specified chains
      const wallets: TestnetWallet[] = []
      
      for (const chain of config.chains) {
        const wallet = await testnetWalletManager.createWalletForAgent(
          config.agentId,
          config.agentName,
          chain
        )
        if (wallet) {
          wallets.push(wallet)
        }
      }

      this.agentConfigs.set(config.agentId, config)
      this.agentWallets.set(config.agentId, wallets)
      this.agentTrades.set(config.agentId, [])

      console.log(`✅ Agent ${config.agentName} registered with ${wallets.length} wallets`)
      this.emit('agentRegistered', { agentId: config.agentId, wallets })

      return true
    } catch (error) {
      console.error('Error registering agent:', error)
      return false
    }
  }

  // Start automated trading for an agent
  async startAgentTrading(agentId: string): Promise<boolean> {
    try {
      const config = this.agentConfigs.get(agentId)
      const wallets = this.agentWallets.get(agentId)

      if (!config || !wallets || wallets.length === 0) {
        throw new Error(`Agent ${agentId} not found or has no wallets`)
      }

      if (!config.autoTrading) {
        throw new Error(`Agent ${agentId} has auto-trading disabled`)
      }

      // Start trading based on agent type
      switch (config.agentType) {
        case 'trading':
          await this.startRegularTrading(agentId)
          break
        case 'arbitrage':
          await this.startArbitrageTrading(agentId)
          break
        case 'liquidity':
          await this.startLiquidityProviding(agentId)
          break
        case 'yield_farming':
          await this.startYieldFarming(agentId)
          break
      }

      this.emit('agentTradingStarted', { agentId, config })
      return true
    } catch (error) {
      console.error('Error starting agent trading:', error)
      return false
    }
  }

  // Stop automated trading for an agent
  async stopAgentTrading(agentId: string): Promise<boolean> {
    try {
      // Stop any running intervals for this agent
      if (this.tradingInterval) {
        clearInterval(this.tradingInterval)
        this.tradingInterval = undefined
      }

      if (this.arbitrageInterval) {
        clearInterval(this.arbitrageInterval)
        this.arbitrageInterval = undefined
      }

      this.emit('agentTradingStopped', { agentId })
      return true
    } catch (error) {
      console.error('Error stopping agent trading:', error)
      return false
    }
  }

  // Execute a manual trade for an agent
  async executeAgentTrade(
    agentId: string,
    inputToken: string,
    outputToken: string,
    amount: string,
    chainKey: string = 'eth-sepolia'
  ): Promise<AgentTrade | null> {
    try {
      const config = this.agentConfigs.get(agentId)
      const wallets = this.agentWallets.get(agentId)

      if (!config || !wallets) {
        throw new Error(`Agent ${agentId} not found`)
      }

      // Find appropriate wallet for the chain
      const wallet = wallets.find(w => 
        (chainKey === 'eth-sepolia' && w.chain === 'ethereum') ||
        (chainKey === 'arb-sepolia' && w.chain === 'arbitrum')
      )

      if (!wallet) {
        throw new Error(`No wallet found for chain ${chainKey}`)
      }

      // Check if trade is within risk limits
      if (parseFloat(amount) > config.maxTradeSize) {
        throw new Error(`Trade size exceeds maximum limit of ${config.maxTradeSize}`)
      }

      if (!config.allowedTokens.includes(inputToken) || !config.allowedTokens.includes(outputToken)) {
        throw new Error(`Token not allowed for this agent`)
      }

      // Get swap quote
      const quote = await defiService.getSwapQuote(inputToken, outputToken, amount, 'uniswap', chainKey)
      if (!quote) {
        throw new Error('Failed to get swap quote')
      }

      // Execute the swap
      const txHash = await defiService.executeSwap(wallet.privateKey, quote, 'uniswap', chainKey)
      if (!txHash) {
        throw new Error('Failed to execute swap')
      }

      // Record the trade
      const trade: AgentTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        walletId: wallet.id,
        type: 'swap',
        inputToken,
        outputToken,
        inputAmount: amount,
        outputAmount: quote.outputAmount,
        txHash,
        status: 'pending',
        gasUsed: quote.gasEstimate,
        profit: 0, // Will be calculated after confirmation
        timestamp: new Date()
      }

      const trades = this.agentTrades.get(agentId) || []
      trades.push(trade)
      this.agentTrades.set(agentId, trades)

      // Monitor transaction
      this.monitorTransaction(trade, chainKey)

      this.emit('agentTradeExecuted', trade)
      return trade
    } catch (error) {
      console.error('Error executing agent trade:', error)
      return null
    }
  }

  // Start regular trading for an agent
  private async startRegularTrading(agentId: string) {
    const config = this.agentConfigs.get(agentId)
    if (!config) return

    this.tradingInterval = setInterval(async () => {
      try {
        // Simple trading logic - buy/sell based on mock market conditions
        const wallets = this.agentWallets.get(agentId) || []
        
        for (const wallet of wallets) {
          // Check if we should trade based on wallet balance
          if (wallet.balance.usdc > 1000) { // Have enough USDC to trade
            const shouldTrade = Math.random() > 0.7 // 30% chance to trade
            
            if (shouldTrade) {
              const chainKey = wallet.chain === 'ethereum' ? 'eth-sepolia' : 'arb-sepolia'
              const amount = Math.min(500, wallet.balance.usdc * 0.1).toString() // Trade 10% of balance, max 500
              
              await this.executeAgentTrade(agentId, 'USDC', 'WETH', amount, chainKey)
            }
          }
        }
      } catch (error) {
        console.error('Error in regular trading:', error)
      }
    }, 60000) // Trade every minute
  }

  // Start arbitrage trading for an agent
  private async startArbitrageTrading(agentId: string) {
    const config = this.agentConfigs.get(agentId)
    if (!config) return

    this.arbitrageInterval = setInterval(async () => {
      try {
        const wallets = this.agentWallets.get(agentId) || []
        
        for (const wallet of wallets) {
          const chainKey = wallet.chain === 'ethereum' ? 'eth-sepolia' : 'arb-sepolia'
          
          // Find arbitrage opportunities
          const opportunities = await defiService.findArbitrageOpportunities('USDC/WETH', chainKey)
          
          for (const opportunity of opportunities) {
            if (opportunity.estimatedProfit > 10 && opportunity.confidence > 70) {
              // Execute arbitrage if profitable
              const amount = Math.min(1000, wallet.balance.usdc * 0.2).toString() // Max 20% of balance
              
              const result = await defiService.executeArbitrage(
                wallet.privateKey,
                opportunity,
                amount,
                chainKey
              )

              if (result.buyTx && result.sellTx) {
                // Record arbitrage trade
                const trade: AgentTrade = {
                  id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  agentId,
                  walletId: wallet.id,
                  type: 'arbitrage',
                  inputToken: 'USDC',
                  outputToken: 'WETH',
                  inputAmount: amount,
                  outputAmount: '0', // Will be calculated
                  txHash: result.buyTx,
                  status: 'pending',
                  gasUsed: opportunity.gasEstimate,
                  profit: opportunity.estimatedProfit,
                  timestamp: new Date()
                }

                const trades = this.agentTrades.get(agentId) || []
                trades.push(trade)
                this.agentTrades.set(agentId, trades)

                this.emit('arbitrageExecuted', { agentId, opportunity, trade })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in arbitrage trading:', error)
      }
    }, 30000) // Check for arbitrage every 30 seconds
  }

  // Start liquidity providing for an agent
  private async startLiquidityProviding(agentId: string) {
    // Implement liquidity providing logic
    console.log(`Starting liquidity providing for agent ${agentId}`)
  }

  // Start yield farming for an agent
  private async startYieldFarming(agentId: string) {
    // Implement yield farming logic
    console.log(`Starting yield farming for agent ${agentId}`)
  }

  // Monitor transaction status
  private async monitorTransaction(trade: AgentTrade, chainKey: string) {
    try {
      const receipt = await alchemyService.waitForTransaction(trade.txHash, chainKey)
      
      if (receipt) {
        trade.status = receipt.status === 'success' ? 'confirmed' : 'failed'
        trade.gasUsed = parseInt(receipt.gasUsed)
        trade.blockNumber = receipt.blockNumber

        // Calculate profit/loss
        if (trade.status === 'confirmed') {
          // Simple profit calculation (would be more complex in real scenario)
          const gasValue = (trade.gasUsed * 20) / 1e9 // Approximate gas cost in ETH
          const gasCostUSD = gasValue * 2300 // Approximate ETH price
          
          if (trade.type === 'swap') {
            // For swaps, profit is difference in token values minus gas
            trade.profit = -gasCostUSD // Negative because it's a cost
          }
        }

        this.emit('tradeConfirmed', trade)
      }
    } catch (error) {
      console.error('Error monitoring transaction:', error)
      trade.status = 'failed'
      this.emit('tradeConfirmed', trade)
    }
  }

  // Handle arbitrage results
  private handleArbitrageResult(result: any) {
    const { transaction, success, wallet } = result
    
    if (success) {
      // Update agent performance
      console.log(`✅ Arbitrage successful for wallet ${wallet.address}`)
    } else {
      console.log(`❌ Arbitrage failed for wallet ${wallet.address}`)
    }
  }

  // Get agent performance metrics
  getAgentPerformance(agentId: string): AgentPerformance | null {
    const trades = this.agentTrades.get(agentId) || []
    
    if (trades.length === 0) {
      return null
    }

    const successfulTrades = trades.filter(t => t.status === 'confirmed')
    const failedTrades = trades.filter(t => t.status === 'failed')
    const totalProfit = successfulTrades.reduce((sum, t) => sum + t.profit, 0)
    const totalLoss = failedTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0)
    const totalGasSpent = trades.reduce((sum, t) => sum + t.gasUsed * 20 / 1e9, 0) // Approximate gas cost

    return {
      agentId,
      totalTrades: trades.length,
      successfulTrades: successfulTrades.length,
      failedTrades: failedTrades.length,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      successRate: (successfulTrades.length / trades.length) * 100,
      averageProfit: totalProfit / Math.max(successfulTrades.length, 1),
      bestTrade: Math.max(...trades.map(t => t.profit)),
      worstTrade: Math.min(...trades.map(t => t.profit)),
      totalGasSpent,
      roiPercent: ((totalProfit - totalLoss) / 10000) * 100, // Assuming 10k initial capital
      sharpeRatio: this.calculateSharpeRatio(trades)
    }
  }

  // Calculate Sharpe ratio for agent performance
  private calculateSharpeRatio(trades: AgentTrade[]): number {
    if (trades.length < 2) return 0

    const returns = trades.map(t => t.profit / 1000) // Normalize returns
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )

    return stdDev > 0 ? avgReturn / stdDev : 0
  }

  // Get agent wallets
  getAgentWallets(agentId: string): TestnetWallet[] {
    return this.agentWallets.get(agentId) || []
  }

  // Get agent trades
  getAgentTrades(agentId: string): AgentTrade[] {
    return this.agentTrades.get(agentId) || []
  }

  // Get agent configuration
  getAgentConfig(agentId: string): AgentWalletConfig | undefined {
    return this.agentConfigs.get(agentId)
  }

  // Get all registered agents
  getAllAgents(): AgentWalletConfig[] {
    return Array.from(this.agentConfigs.values())
  }

  // Update agent configuration
  updateAgentConfig(agentId: string, updates: Partial<AgentWalletConfig>): boolean {
    const config = this.agentConfigs.get(agentId)
    if (!config) return false

    const updatedConfig = { ...config, ...updates }
    this.agentConfigs.set(agentId, updatedConfig)
    
    this.emit('agentConfigUpdated', { agentId, config: updatedConfig })
    return true
  }

  // Clean up resources
  destroy() {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval)
    }
    if (this.arbitrageInterval) {
      clearInterval(this.arbitrageInterval)
    }
    this.removeAllListeners()
  }
}

export const agentWalletIntegration = new AgentWalletIntegration()
export default agentWalletIntegration