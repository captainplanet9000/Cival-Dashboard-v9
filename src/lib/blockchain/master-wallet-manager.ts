'use client'

import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { alchemyService } from './alchemy-service'
import { testnetWalletManager } from './testnet-wallet-manager'
import { agentWalletIntegration } from './agent-wallet-integration'

export interface MasterWallet {
  id: string
  name: string
  address: string
  privateKey: string // Encrypted in production
  chain: 'ethereum' | 'arbitrum' | 'polygon'
  network: 'mainnet' | 'testnet'
  balance: {
    eth: number
    usdc: number
    usdt: number
    dai: number
    wbtc: number
  }
  totalDeposited: number
  totalWithdrawn: number
  allocatedFunds: number
  availableFunds: number
  lastActivity: Date
  createdAt: Date
}

export interface FundingTransaction {
  id: string
  type: 'deposit' | 'withdraw' | 'allocate' | 'deallocate'
  amount: number
  token: string
  from: string
  to: string
  txHash: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: Date
  gasUsed?: number
  blockNumber?: number
}

export interface AgentAllocation {
  agentId: string
  agentName: string
  allocatedAmount: number
  allocatedTokens: Record<string, number>
  performanceMultiplier: number
  lastUpdated: Date
}

class MasterWalletManager extends EventEmitter {
  private masterWallets: Map<string, MasterWallet> = new Map()
  private fundingTransactions: Map<string, FundingTransaction[]> = new Map()
  private agentAllocations: Map<string, AgentAllocation> = new Map()
  private readonly STORAGE_KEY = 'cival_master_wallets'
  private balanceUpdateInterval?: NodeJS.Timeout
  
  // Production configuration - REAL MONEY
  private readonly PRODUCTION_CONFIG = {
    // Mainnet configurations
    ethereum: {
      chainId: 1,
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
      tokens: {
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
      }
    },
    arbitrum: {
      chainId: 42161,
      rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
      tokens: {
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
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
    console.log(`💰 Master Wallet Manager initialized with ${this.masterWallets.size} wallets`)
  }

  private loadWalletsFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        data.wallets?.forEach((wallet: any) => {
          wallet.lastActivity = new Date(wallet.lastActivity)
          wallet.createdAt = new Date(wallet.createdAt)
          this.masterWallets.set(wallet.id, wallet)
        })
        data.transactions?.forEach((tx: any) => {
          tx.timestamp = new Date(tx.timestamp)
          const walletTxs = this.fundingTransactions.get(tx.walletId) || []
          walletTxs.push(tx)
          this.fundingTransactions.set(tx.walletId, walletTxs)
        })
        data.allocations?.forEach((allocation: any) => {
          allocation.lastUpdated = new Date(allocation.lastUpdated)
          this.agentAllocations.set(allocation.agentId, allocation)
        })
      }
    } catch (error) {
      console.error('Error loading master wallets:', error)
    }
  }

  private saveToStorage() {
    try {
      const data = {
        wallets: Array.from(this.masterWallets.values()),
        transactions: Array.from(this.fundingTransactions.entries()).flatMap(([walletId, txs]) => 
          txs.map(tx => ({ ...tx, walletId }))
        ),
        allocations: Array.from(this.agentAllocations.values())
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving master wallets:', error)
    }
  }

  // Create or get master funding wallet
  async createMasterWallet(
    name: string,
    chain: 'ethereum' | 'arbitrum' = 'ethereum',
    useMainnet: boolean = false
  ): Promise<MasterWallet | null> {
    try {
      // Check if master wallet already exists for this chain
      const existingWallet = Array.from(this.masterWallets.values())
        .find(w => w.chain === chain && w.network === (useMainnet ? 'mainnet' : 'testnet'))
      
      if (existingWallet) {
        console.log(`✅ Using existing master wallet on ${chain}:`, existingWallet.address)
        return existingWallet
      }

      // Create new wallet
      const wallet = ethers.Wallet.createRandom()
      
      const masterWallet: MasterWallet = {
        id: `master_${chain}_${Date.now()}`,
        name,
        address: wallet.address,
        privateKey: wallet.privateKey, // In production, encrypt this!
        chain,
        network: useMainnet ? 'mainnet' : 'testnet',
        balance: {
          eth: 0,
          usdc: 0,
          usdt: 0,
          dai: 0,
          wbtc: 0
        },
        totalDeposited: 0,
        totalWithdrawn: 0,
        allocatedFunds: 0,
        availableFunds: 0,
        lastActivity: new Date(),
        createdAt: new Date()
      }

      this.masterWallets.set(masterWallet.id, masterWallet)
      this.saveToStorage()
      
      console.log(`💰 Created master wallet on ${chain}:`, wallet.address)
      console.log(`🔑 SAVE THIS PRIVATE KEY SECURELY:`, wallet.privateKey)
      
      this.emit('masterWalletCreated', masterWallet)
      return masterWallet
    } catch (error) {
      console.error('Error creating master wallet:', error)
      return null
    }
  }

  // Get deposit address for funding
  getDepositAddress(chain: 'ethereum' | 'arbitrum' = 'ethereum'): string | null {
    const wallet = Array.from(this.masterWallets.values())
      .find(w => w.chain === chain)
    
    return wallet?.address || null
  }

  // Monitor incoming deposits
  async checkForDeposits(walletId: string): Promise<FundingTransaction[]> {
    try {
      const wallet = this.masterWallets.get(walletId)
      if (!wallet) return []

      const chainKey = wallet.network === 'mainnet' 
        ? wallet.chain 
        : `${wallet.chain}-sepolia`
      
      // Get current balance
      const ethBalance = await alchemyService.getWalletBalance(wallet.address, chainKey)
      const tokenBalances = await alchemyService.getTokenBalances(wallet.address, chainKey)
      
      // Update wallet balance
      wallet.balance.eth = parseFloat(ethBalance)
      
      tokenBalances.forEach(token => {
        const symbol = token.symbol.toLowerCase()
        if (symbol in wallet.balance) {
          wallet.balance[symbol as keyof typeof wallet.balance] = parseFloat(token.balance)
        }
      })
      
      // Calculate total USD value (simplified pricing)
      const totalValue = 
        wallet.balance.eth * 2300 + // ETH price
        wallet.balance.usdc +
        wallet.balance.usdt +
        wallet.balance.dai +
        wallet.balance.wbtc * 43000 // BTC price
      
      // Check for new deposits
      const previousTotal = wallet.totalDeposited
      if (totalValue > previousTotal) {
        const depositAmount = totalValue - previousTotal
        
        const transaction: FundingTransaction = {
          id: `deposit_${Date.now()}`,
          type: 'deposit',
          amount: depositAmount,
          token: 'USD',
          from: 'external',
          to: wallet.address,
          txHash: '0x' + Math.random().toString(16).substr(2, 64),
          status: 'confirmed',
          timestamp: new Date()
        }
        
        const txs = this.fundingTransactions.get(walletId) || []
        txs.push(transaction)
        this.fundingTransactions.set(walletId, txs)
        
        wallet.totalDeposited = totalValue
        wallet.availableFunds = totalValue - wallet.allocatedFunds
        wallet.lastActivity = new Date()
        
        this.saveToStorage()
        this.emit('depositDetected', { wallet, transaction, amount: depositAmount })
        
        console.log(`💵 Deposit detected: $${depositAmount.toFixed(2)} - Total: $${totalValue.toFixed(2)}`)
      }
      
      return this.fundingTransactions.get(walletId) || []
    } catch (error) {
      console.error('Error checking deposits:', error)
      return []
    }
  }

  // Allocate funds to agent
  async allocateFundsToAgent(
    agentId: string,
    agentName: string,
    amount: number,
    chain: 'ethereum' | 'arbitrum' = 'ethereum'
  ): Promise<boolean> {
    try {
      // Find master wallet
      const masterWallet = Array.from(this.masterWallets.values())
        .find(w => w.chain === chain)
      
      if (!masterWallet) {
        throw new Error('No master wallet found for chain')
      }
      
      if (masterWallet.availableFunds < amount) {
        throw new Error(`Insufficient funds. Available: $${masterWallet.availableFunds.toFixed(2)}`)
      }
      
      // Get or create agent wallets
      let agentWallets = testnetWalletManager.getWalletsForAgent(agentId)
      if (agentWallets.length === 0) {
        agentWallets = await testnetWalletManager.createWalletsForAgent(agentId, agentName)
      }
      
      const agentWallet = agentWallets.find(w => w.chain === chain)
      if (!agentWallet) {
        throw new Error('No agent wallet found for chain')
      }
      
      // Execute transfer
      const chainKey = masterWallet.network === 'mainnet' ? chain : `${chain}-sepolia`
      const usdcAmount = amount.toString()
      
      const txInfo = await alchemyService.sendTokenTransaction(
        masterWallet.privateKey,
        masterWallet.network === 'mainnet' 
          ? this.PRODUCTION_CONFIG[chain].tokens.USDC
          : '0xA0b86a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F', // Testnet USDC
        agentWallet.address,
        usdcAmount,
        chainKey
      )
      
      if (!txInfo) {
        throw new Error('Failed to send allocation transaction')
      }
      
      // Record allocation
      const allocation: AgentAllocation = {
        agentId,
        agentName,
        allocatedAmount: amount,
        allocatedTokens: { USDC: amount },
        performanceMultiplier: 1.0,
        lastUpdated: new Date()
      }
      
      this.agentAllocations.set(agentId, allocation)
      
      // Update master wallet
      masterWallet.allocatedFunds += amount
      masterWallet.availableFunds -= amount
      masterWallet.lastActivity = new Date()
      
      // Record transaction
      const transaction: FundingTransaction = {
        id: `allocate_${Date.now()}`,
        type: 'allocate',
        amount,
        token: 'USDC',
        from: masterWallet.address,
        to: agentWallet.address,
        txHash: txInfo.hash,
        status: 'pending',
        timestamp: new Date()
      }
      
      const txs = this.fundingTransactions.get(masterWallet.id) || []
      txs.push(transaction)
      this.fundingTransactions.set(masterWallet.id, txs)
      
      // Wait for confirmation
      alchemyService.waitForTransaction(txInfo.hash, chainKey).then(receipt => {
        if (receipt) {
          transaction.status = receipt.status === 'success' ? 'confirmed' : 'failed'
          transaction.gasUsed = parseInt(receipt.gasUsed)
          transaction.blockNumber = receipt.blockNumber
          this.saveToStorage()
          this.emit('allocationConfirmed', { agentId, amount, transaction })
        }
      })
      
      this.saveToStorage()
      this.emit('fundsAllocated', { agentId, amount, allocation })
      
      console.log(`💸 Allocated $${amount} to agent ${agentName}`)
      return true
    } catch (error) {
      console.error('Error allocating funds:', error)
      return false
    }
  }

  // Start balance monitoring
  private startBalanceUpdates() {
    this.balanceUpdateInterval = setInterval(() => {
      this.masterWallets.forEach(wallet => {
        this.checkForDeposits(wallet.id)
      })
    }, 30000) // Check every 30 seconds
    
    // Initial check
    this.masterWallets.forEach(wallet => {
      this.checkForDeposits(wallet.id)
    })
  }

  // Get master wallet info
  getMasterWallet(chain: 'ethereum' | 'arbitrum' = 'ethereum'): MasterWallet | null {
    return Array.from(this.masterWallets.values())
      .find(w => w.chain === chain) || null
  }

  // Get all master wallets
  getAllMasterWallets(): MasterWallet[] {
    return Array.from(this.masterWallets.values())
  }

  // Get funding transactions
  getFundingTransactions(walletId: string): FundingTransaction[] {
    return this.fundingTransactions.get(walletId) || []
  }

  // Get agent allocations
  getAgentAllocations(): AgentAllocation[] {
    return Array.from(this.agentAllocations.values())
  }

  // Get total portfolio value
  getTotalPortfolioValue(): number {
    return Array.from(this.masterWallets.values()).reduce((total, wallet) => {
      return total + wallet.totalDeposited
    }, 0)
  }

  // Get allocation summary
  getAllocationSummary() {
    const totalAllocated = Array.from(this.agentAllocations.values())
      .reduce((sum, a) => sum + a.allocatedAmount, 0)
    
    const totalAvailable = Array.from(this.masterWallets.values())
      .reduce((sum, w) => sum + w.availableFunds, 0)
    
    const totalDeposited = Array.from(this.masterWallets.values())
      .reduce((sum, w) => sum + w.totalDeposited, 0)
    
    return {
      totalDeposited,
      totalAllocated,
      totalAvailable,
      utilizationRate: totalDeposited > 0 ? (totalAllocated / totalDeposited) * 100 : 0,
      agentCount: this.agentAllocations.size
    }
  }

  // Emergency withdraw (in case needed)
  async emergencyWithdraw(
    walletId: string,
    toAddress: string,
    amount: number,
    token: string = 'USDC'
  ): Promise<boolean> {
    try {
      const wallet = this.masterWallets.get(walletId)
      if (!wallet) return false
      
      const chainKey = wallet.network === 'mainnet' 
        ? wallet.chain 
        : `${wallet.chain}-sepolia`
      
      let txInfo
      if (token === 'ETH') {
        txInfo = await alchemyService.sendTransaction(
          wallet.privateKey,
          toAddress,
          amount.toString(),
          chainKey
        )
      } else {
        const tokenAddress = wallet.network === 'mainnet'
          ? this.PRODUCTION_CONFIG[wallet.chain].tokens[token as keyof typeof this.PRODUCTION_CONFIG.ethereum.tokens]
          : '0xA0b86a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F' // Testnet token
        
        txInfo = await alchemyService.sendTokenTransaction(
          wallet.privateKey,
          tokenAddress,
          toAddress,
          amount.toString(),
          chainKey
        )
      }
      
      if (txInfo) {
        wallet.totalWithdrawn += amount
        wallet.lastActivity = new Date()
        
        const transaction: FundingTransaction = {
          id: `withdraw_${Date.now()}`,
          type: 'withdraw',
          amount,
          token,
          from: wallet.address,
          to: toAddress,
          txHash: txInfo.hash,
          status: 'pending',
          timestamp: new Date()
        }
        
        const txs = this.fundingTransactions.get(walletId) || []
        txs.push(transaction)
        this.fundingTransactions.set(walletId, txs)
        
        this.saveToStorage()
        this.emit('withdrawalInitiated', { wallet, transaction })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      return false
    }
  }

  // Clean up
  destroy() {
    if (this.balanceUpdateInterval) {
      clearInterval(this.balanceUpdateInterval)
    }
    this.removeAllListeners()
  }
}

export const masterWalletManager = new MasterWalletManager()
export default masterWalletManager