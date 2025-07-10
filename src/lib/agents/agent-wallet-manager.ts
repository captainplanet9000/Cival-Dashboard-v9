'use client'

import { paperTradingEngine, type Position, type Order } from '@/lib/trading/real-paper-trading-engine'
import { backendApi } from '@/lib/api/backend-client'

export interface AgentWallet {
  agentId: string
  address: string
  balance: number
  currency: string
  positions: Position[]
  orders: Order[]
  totalValue: number
  realizedPnL: number
  unrealizedPnL: number
  lastUpdate: number
}

export interface WalletTransaction {
  id: string
  agentId: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal'
  symbol: string
  quantity: number
  price: number
  fee: number
  timestamp: number
  status: 'pending' | 'completed' | 'failed'
}

class AgentWalletManager {
  private wallets = new Map<string, AgentWallet>()
  private transactions = new Map<string, WalletTransaction[]>()

  constructor() {
    this.initializeWalletStorage()
  }

  private initializeWalletStorage() {
    if (typeof window !== 'undefined') {
      const savedWallets = localStorage.getItem('agentWallets')
      if (savedWallets) {
        try {
          const parsed = JSON.parse(savedWallets)
          Object.entries(parsed).forEach(([agentId, wallet]) => {
            this.wallets.set(agentId, wallet as AgentWallet)
          })
        } catch (error) {
          console.warn('Failed to restore wallets from storage:', error)
        }
      }
    }
  }

  private saveWalletState() {
    if (typeof window !== 'undefined') {
      const walletsObj = Object.fromEntries(this.wallets)
      localStorage.setItem('agentWallets', JSON.stringify(walletsObj))
    }
  }

  async createWalletForAgent(agentId: string, initialBalance: number = 10000): Promise<AgentWallet> {
    console.log(`💳 Creating wallet for agent ${agentId} with initial balance: $${initialBalance}`)

    const wallet: AgentWallet = {
      agentId,
      address: this.generateWalletAddress(agentId),
      balance: initialBalance,
      currency: 'USD',
      positions: [],
      orders: [],
      totalValue: initialBalance,
      realizedPnL: 0,
      unrealizedPnL: 0,
      lastUpdate: Date.now()
    }

    this.wallets.set(agentId, wallet)
    this.transactions.set(agentId, [])
    this.saveWalletState()

    // Try to sync with backend
    try {
      await backendApi.post('/api/v1/agents/wallets', wallet)
    } catch (error) {
      console.warn('Backend wallet creation failed, using local storage:', error)
    }

    return wallet
  }

  async getWallet(agentId: string): Promise<AgentWallet | null> {
    let wallet = this.wallets.get(agentId)
    
    if (!wallet) {
      // Try to load from backend
      try {
        const response = await backendApi.get(`/api/v1/agents/${agentId}/wallet`)
        if (response.data) {
          wallet = response.data
          this.wallets.set(agentId, wallet)
        }
      } catch (error) {
        console.warn('Backend wallet load failed:', error)
      }
    }

    return wallet || null
  }

  async executeOrder(agentId: string, order: {
    symbol: string
    action: 'buy' | 'sell'
    quantity: number
    price?: number
    orderType: 'market' | 'limit'
  }): Promise<WalletTransaction> {
    const wallet = await this.getWallet(agentId)
    if (!wallet) {
      throw new Error(`No wallet found for agent ${agentId}`)
    }

    console.log(`📊 Executing ${order.action} order for agent ${agentId}:`, order)

    // Use paper trading engine for execution
    const result = await paperTradingEngine.executeOrder({
      id: `${Date.now()}-${agentId}`,
      symbol: order.symbol,
      type: order.action,
      quantity: order.quantity,
      price: order.price,
      orderType: order.orderType,
      timestamp: Date.now(),
      status: 'pending'
    })

    // Create transaction record
    const transaction: WalletTransaction = {
      id: result.id,
      agentId,
      type: order.action,
      symbol: order.symbol,
      quantity: order.quantity,
      price: result.executedPrice || order.price || 0,
      fee: this.calculateFee(order.quantity, result.executedPrice || order.price || 0),
      timestamp: Date.now(),
      status: result.status === 'filled' ? 'completed' : 'pending'
    }

    // Update wallet based on execution
    await this.updateWalletFromTransaction(wallet, transaction)

    // Store transaction
    const agentTransactions = this.transactions.get(agentId) || []
    agentTransactions.push(transaction)
    this.transactions.set(agentId, agentTransactions)

    // Save state
    this.saveWalletState()

    // Try to sync with backend
    try {
      await backendApi.post(`/api/v1/agents/${agentId}/transactions`, transaction)
    } catch (error) {
      console.warn('Backend transaction sync failed:', error)
    }

    console.log(`✅ Order executed for agent ${agentId}:`, transaction)
    return transaction
  }

  private async updateWalletFromTransaction(wallet: AgentWallet, transaction: WalletTransaction): Promise<void> {
    const cost = transaction.quantity * transaction.price + transaction.fee

    if (transaction.type === 'buy') {
      // Check if we have enough balance
      if (wallet.balance < cost) {
        throw new Error(`Insufficient balance: ${wallet.balance} < ${cost}`)
      }

      // Reduce balance
      wallet.balance -= cost

      // Add or update position
      const existingPosition = wallet.positions.find(p => p.symbol === transaction.symbol)
      if (existingPosition) {
        const totalQuantity = existingPosition.quantity + transaction.quantity
        const avgPrice = ((existingPosition.avgPrice * existingPosition.quantity) + (transaction.price * transaction.quantity)) / totalQuantity
        existingPosition.quantity = totalQuantity
        existingPosition.avgPrice = avgPrice
      } else {
        wallet.positions.push({
          symbol: transaction.symbol,
          quantity: transaction.quantity,
          avgPrice: transaction.price,
          currentPrice: transaction.price,
          unrealizedPnL: 0
        })
      }
    } else if (transaction.type === 'sell') {
      // Find position to sell from
      const position = wallet.positions.find(p => p.symbol === transaction.symbol)
      if (!position || position.quantity < transaction.quantity) {
        throw new Error(`Insufficient position: ${position?.quantity || 0} < ${transaction.quantity}`)
      }

      // Calculate realized P&L
      const costBasis = position.avgPrice * transaction.quantity
      const saleProceeds = transaction.price * transaction.quantity - transaction.fee
      const realizedPnL = saleProceeds - costBasis
      wallet.realizedPnL += realizedPnL

      // Add proceeds to balance
      wallet.balance += saleProceeds

      // Update position
      position.quantity -= transaction.quantity
      if (position.quantity === 0) {
        wallet.positions = wallet.positions.filter(p => p.symbol !== transaction.symbol)
      }
    }

    // Update unrealized P&L and total value
    await this.updateWalletValue(wallet)
    
    wallet.lastUpdate = Date.now()
    this.wallets.set(wallet.agentId, wallet)
  }

  private async updateWalletValue(wallet: AgentWallet): Promise<void> {
    let totalUnrealizedPnL = 0
    
    // Update current prices and calculate unrealized P&L
    for (const position of wallet.positions) {
      const currentPrice = await this.getCurrentPrice(position.symbol)
      position.currentPrice = currentPrice
      
      const costBasis = position.avgPrice * position.quantity
      const currentValue = currentPrice * position.quantity
      position.unrealizedPnL = currentValue - costBasis
      totalUnrealizedPnL += position.unrealizedPnL
    }

    wallet.unrealizedPnL = totalUnrealizedPnL
    
    // Calculate total wallet value
    const positionsValue = wallet.positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.quantity), 0)
    wallet.totalValue = wallet.balance + positionsValue
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await backendApi.get(`/api/v1/market/price/${symbol}`)
      return response.data?.price || this.getMockPrice(symbol)
    } catch (error) {
      return this.getMockPrice(symbol)
    }
  }

  private getMockPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC/USD': 43500 + (Math.random() - 0.5) * 2000,
      'ETH/USD': 2650 + (Math.random() - 0.5) * 200,
      'SOL/USD': 68 + (Math.random() - 0.5) * 10,
      'ADA/USD': 0.47 + (Math.random() - 0.5) * 0.1,
      'DOT/USD': 7.2 + (Math.random() - 0.5) * 1.5
    }
    return prices[symbol] || 100
  }

  private calculateFee(quantity: number, price: number): number {
    // 0.1% trading fee
    return quantity * price * 0.001
  }

  private generateWalletAddress(agentId: string): string {
    // Generate a mock wallet address based on agent ID
    return `0x${agentId.slice(0, 8).toLowerCase()}${'0'.repeat(32)}`
  }

  async getTransactions(agentId: string): Promise<WalletTransaction[]> {
    return this.transactions.get(agentId) || []
  }

  async getWalletSummary(agentId: string): Promise<{
    balance: number
    totalValue: number
    totalPnL: number
    positionCount: number
    transactionCount: number
  }> {
    const wallet = await this.getWallet(agentId)
    const transactions = await this.getTransactions(agentId)

    if (!wallet) {
      return {
        balance: 0,
        totalValue: 0,
        totalPnL: 0,
        positionCount: 0,
        transactionCount: 0
      }
    }

    return {
      balance: wallet.balance,
      totalValue: wallet.totalValue,
      totalPnL: wallet.realizedPnL + wallet.unrealizedPnL,
      positionCount: wallet.positions.length,
      transactionCount: transactions.length
    }
  }

  async getAllAgentWallets(): Promise<AgentWallet[]> {
    const wallets = Array.from(this.wallets.values())
    
    // Update all wallet values
    for (const wallet of wallets) {
      await this.updateWalletValue(wallet)
    }
    
    return wallets
  }
}

// Singleton instance with lazy initialization
let agentWalletManagerInstance: AgentWalletManager | null = null

export function getAgentWalletManager(): AgentWalletManager {
  if (!agentWalletManagerInstance) {
    agentWalletManagerInstance = new AgentWalletManager()
  }
  return agentWalletManagerInstance
}

// For backward compatibility - but use getAgentWalletManager() instead
export const agentWalletManager = {
  get instance() {
    return getAgentWalletManager()
  }
}

export default getAgentWalletManager