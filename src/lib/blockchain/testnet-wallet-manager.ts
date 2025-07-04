'use client'

import { EventEmitter } from 'events'
import { ethers } from 'ethers'

export interface TestnetWallet {
  id: string
  agentId: string
  agentName: string
  address: string
  privateKey: string
  chain: 'ethereum' | 'arbitrum' | 'polygon'
  network: string
  balance: {
    eth: number
    usdc: number
    usdt: number
    wbtc: number
  }
  transactions: WalletTransaction[]
  createdAt: Date
  lastUpdated: Date
}

export interface WalletTransaction {
  id: string
  hash: string
  type: 'send' | 'receive' | 'swap' | 'arbitrage'
  amount: number
  token: string
  to?: string
  from?: string
  status: 'pending' | 'confirmed' | 'failed'
  gasUsed: number
  gasPrice: number
  timestamp: Date
  blockNumber?: number
}

export interface ChainConfig {
  name: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: string
  testTokens: Record<string, string>
}

class TestnetWalletManager extends EventEmitter {
  private wallets: Map<string, TestnetWallet> = new Map()
  private readonly STORAGE_KEY = 'cival_testnet_wallets'
  private balanceUpdateInterval?: NodeJS.Timeout

  private readonly CHAIN_CONFIGS: Record<string, ChainConfig> = {
    ethereum: {
      name: 'Ethereum Sepolia',
      chainId: 11155111,
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      explorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: 'ETH',
      testTokens: {
        USDC: '0xA0b86a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
        USDT: '0xB1c9a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
        WBTC: '0xC2d8a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F'
      }
    },
    arbitrum: {
      name: 'Arbitrum Sepolia',
      chainId: 421614,
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      nativeCurrency: 'ETH',
      testTokens: {
        USDC: '0xD3c9a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
        USDT: '0xE4e0a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
        WBTC: '0xF5f1a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F'
      }
    }
  }

  constructor() {
    super()
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private async initialize() {
    this.loadWalletsFromStorage()
    this.startBalanceUpdates()
    console.log(`🔗 Testnet Wallet Manager initialized with ${this.wallets.size} wallets`)
  }

  private loadWalletsFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const wallets = JSON.parse(stored)
        for (const wallet of wallets) {
          // Restore dates
          wallet.createdAt = new Date(wallet.createdAt)
          wallet.lastUpdated = new Date(wallet.lastUpdated)
          wallet.transactions = wallet.transactions.map((tx: any) => ({
            ...tx,
            timestamp: new Date(tx.timestamp)
          }))
          this.wallets.set(wallet.id, wallet)
        }
      }
    } catch (error) {
      console.error('Error loading wallets from storage:', error)
    }
  }

  private saveWalletsToStorage() {
    try {
      const wallets = Array.from(this.wallets.values())
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wallets))
    } catch (error) {
      console.error('Error saving wallets to storage:', error)
    }
  }

  private startBalanceUpdates() {
    // Update balances every 60 seconds
    this.balanceUpdateInterval = setInterval(() => {
      this.updateAllBalances()
    }, 60000)

    // Initial update
    this.updateAllBalances()
  }

  private async updateAllBalances() {
    for (const wallet of this.wallets.values()) {
      await this.updateWalletBalance(wallet)
    }
  }

  private async updateWalletBalance(wallet: TestnetWallet) {
    try {
      // Simulate balance updates (in real implementation, query blockchain)
      const variation = () => (Math.random() - 0.5) * 0.1 // ±5% variation
      
      wallet.balance.eth = Math.max(0, wallet.balance.eth + wallet.balance.eth * variation())
      wallet.balance.usdc = Math.max(0, wallet.balance.usdc + wallet.balance.usdc * variation())
      wallet.balance.usdt = Math.max(0, wallet.balance.usdt + wallet.balance.usdt * variation())
      wallet.balance.wbtc = Math.max(0, wallet.balance.wbtc + wallet.balance.wbtc * variation())
      
      wallet.lastUpdated = new Date()
      
      this.emit('balanceUpdated', wallet)
    } catch (error) {
      console.error(`Error updating balance for wallet ${wallet.address}:`, error)
    }
  }

  async createWalletForAgent(agentId: string, agentName: string, chain: 'ethereum' | 'arbitrum' = 'ethereum'): Promise<TestnetWallet | null> {
    try {
      // Generate new wallet
      const wallet = ethers.Wallet.createRandom()
      
      const testnetWallet: TestnetWallet = {
        id: `wallet_${agentId}_${chain}`,
        agentId,
        agentName,
        address: wallet.address,
        privateKey: wallet.privateKey,
        chain,
        network: this.CHAIN_CONFIGS[chain].name,
        balance: {
          eth: 5 + Math.random() * 10, // 5-15 ETH testnet
          usdc: 1000 + Math.random() * 9000, // 1k-10k USDC testnet
          usdt: 500 + Math.random() * 4500, // 500-5k USDT testnet
          wbtc: Math.random() * 2 // 0-2 WBTC testnet
        },
        transactions: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      }

      this.wallets.set(testnetWallet.id, testnetWallet)
      this.saveWalletsToStorage()
      
      console.log(`🔗 Created ${chain} testnet wallet for ${agentName}: ${wallet.address}`)
      this.emit('walletCreated', testnetWallet)
      
      return testnetWallet
    } catch (error) {
      console.error('Error creating testnet wallet:', error)
      return null
    }
  }

  async createWalletsForAgent(agentId: string, agentName: string): Promise<TestnetWallet[]> {
    const wallets: TestnetWallet[] = []
    
    // Create wallets on multiple chains
    for (const chain of ['ethereum', 'arbitrum'] as const) {
      const wallet = await this.createWalletForAgent(agentId, agentName, chain)
      if (wallet) wallets.push(wallet)
    }
    
    return wallets
  }

  getWalletsForAgent(agentId: string): TestnetWallet[] {
    return Array.from(this.wallets.values()).filter(w => w.agentId === agentId)
  }

  getAllWallets(): TestnetWallet[] {
    return Array.from(this.wallets.values())
  }

  getWallet(walletId: string): TestnetWallet | undefined {
    return this.wallets.get(walletId)
  }

  async sendTransaction(
    walletId: string, 
    to: string, 
    amount: number, 
    token: string = 'ETH'
  ): Promise<WalletTransaction | null> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) return null

    try {
      // Simulate transaction
      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        type: 'send',
        amount,
        token,
        to,
        from: wallet.address,
        status: 'pending',
        gasUsed: Math.floor(Math.random() * 50000 + 21000),
        gasPrice: Math.floor(Math.random() * 20 + 10),
        timestamp: new Date()
      }

      wallet.transactions.push(transaction)
      
      // Simulate transaction confirmation after 30 seconds
      setTimeout(() => {
        transaction.status = Math.random() > 0.1 ? 'confirmed' : 'failed'
        transaction.blockNumber = Math.floor(Math.random() * 1000000 + 18000000)
        
        if (transaction.status === 'confirmed') {
          // Deduct balance
          const tokenKey = token.toLowerCase() as keyof typeof wallet.balance
          if (wallet.balance[tokenKey] !== undefined) {
            wallet.balance[tokenKey] = Math.max(0, wallet.balance[tokenKey] - amount)
          }
        }
        
        this.saveWalletsToStorage()
        this.emit('transactionUpdated', transaction)
      }, 30000)

      this.saveWalletsToStorage()
      this.emit('transactionCreated', transaction)
      
      return transaction
    } catch (error) {
      console.error('Error sending transaction:', error)
      return null
    }
  }

  async executeArbitrage(
    walletId: string,
    opportunity: any
  ): Promise<WalletTransaction | null> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) return null

    try {
      const transaction: WalletTransaction = {
        id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        type: 'arbitrage',
        amount: 1000, // $1000 trade
        token: opportunity.symbol.split('/')[0],
        status: 'pending',
        gasUsed: Math.floor(opportunity.gasEstimate * 1000),
        gasPrice: Math.floor(Math.random() * 30 + 15),
        timestamp: new Date()
      }

      wallet.transactions.push(transaction)
      
      // Simulate arbitrage execution
      setTimeout(() => {
        const success = Math.random() > 0.15 // 85% success rate
        transaction.status = success ? 'confirmed' : 'failed'
        transaction.blockNumber = Math.floor(Math.random() * 1000000 + 18000000)
        
        if (success) {
          // Add profit to USDC balance
          wallet.balance.usdc += opportunity.netProfit
          console.log(`💰 Arbitrage successful: +$${opportunity.netProfit.toFixed(2)} USDC`)
        }
        
        this.saveWalletsToStorage()
        this.emit('arbitrageCompleted', { transaction, success, wallet })
      }, opportunity.estimatedExecutionTime * 1000)

      this.saveWalletsToStorage()
      this.emit('arbitrageStarted', transaction)
      
      return transaction
    } catch (error) {
      console.error('Error executing arbitrage:', error)
      return null
    }
  }

  getChainConfig(chain: string): ChainConfig | undefined {
    return this.CHAIN_CONFIGS[chain]
  }

  getTotalPortfolioValue(): number {
    return Array.from(this.wallets.values()).reduce((total, wallet) => {
      // Convert all balances to USD (mock prices)
      const ethPrice = 2300
      const btcPrice = 43000
      
      return total + 
        (wallet.balance.eth * ethPrice) +
        wallet.balance.usdc +
        wallet.balance.usdt +
        (wallet.balance.wbtc * btcPrice)
    }, 0)
  }

  getWalletStats() {
    const wallets = Array.from(this.wallets.values())
    const totalValue = this.getTotalPortfolioValue()
    const totalTransactions = wallets.reduce((sum, w) => sum + w.transactions.length, 0)
    const successfulTxs = wallets.reduce((sum, w) => 
      sum + w.transactions.filter(tx => tx.status === 'confirmed').length, 0)
    
    return {
      totalWallets: wallets.length,
      totalValue,
      totalTransactions,
      successRate: totalTransactions > 0 ? (successfulTxs / totalTransactions) * 100 : 0,
      chainDistribution: wallets.reduce((acc, w) => {
        acc[w.chain] = (acc[w.chain] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  stop() {
    if (this.balanceUpdateInterval) {
      clearInterval(this.balanceUpdateInterval)
      this.balanceUpdateInterval = undefined
    }
  }
}

export const testnetWalletManager = new TestnetWalletManager()
export default testnetWalletManager