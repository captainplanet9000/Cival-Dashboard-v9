/**
 * Persistent Paper Trading Engine
 * Manages all trading operations for all agents with persistent state
 */

import { EventEmitter } from 'events'

export interface PersistentPosition {
  id: string
  agentId: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  realizedPnL: number
  marginUsed: number
  timestamp: number
  stopLoss?: number
  takeProfit?: number
  status: 'open' | 'closed' | 'partially_filled'
}

export interface PersistentOrder {
  id: string
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  size: number
  price?: number
  stopPrice?: number
  timeInForce: 'GTC' | 'IOC' | 'FOK'
  status: 'pending' | 'filled' | 'cancelled' | 'partially_filled'
  filledSize: number
  averageFillPrice: number
  timestamp: number
  expiryTime?: number
}

export interface AgentPortfolio {
  agentId: string
  cash: number
  totalValue: number
  unrealizedPnL: number
  realizedPnL: number
  margin: number
  marginUsed: number
  positions: Record<string, PersistentPosition>
  orders: Record<string, PersistentOrder>
  lastUpdate: number
}

export interface MarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  timestamp: number
  change24h: number
  changePercent24h: number
}

export interface TradeExecution {
  id: string
  orderId: string
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  fee: number
  timestamp: number
  type: 'fill' | 'partial_fill'
}

class PersistentTradingEngine extends EventEmitter {
  private portfolios: Map<string, AgentPortfolio> = new Map()
  private marketData: Map<string, MarketData> = new Map()
  private executionHistory: TradeExecution[] = []
  private orderBook: Map<string, PersistentOrder[]> = new Map()
  private isRunning: boolean = false
  private updateInterval: NodeJS.Timeout | null = null
  
  // Trading configuration
  private readonly FEE_RATE = 0.001 // 0.1% trading fee
  private readonly SLIPPAGE_TOLERANCE = 0.002 // 0.2% slippage
  private readonly MAX_LEVERAGE = 10
  private readonly MIN_ORDER_SIZE = 0.001

  constructor() {
    super()
    this.loadPersistedData()
    this.startEngine()
  }

  // Engine lifecycle management
  startEngine(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.updateInterval = setInterval(() => {
      this.processMarketUpdate()
      this.executeOrders()
      this.updatePortfolios()
      this.persistData()
    }, 1000) // 1 second updates

    this.emit('engineStarted')
    console.log('Persistent Trading Engine started')
  }

  stopEngine(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.persistData()
    this.emit('engineStopped')
    console.log('Persistent Trading Engine stopped')
  }

  // Agent portfolio management
  createAgentPortfolio(agentId: string, initialCash: number = 10000): AgentPortfolio {
    const portfolio: AgentPortfolio = {
      agentId,
      cash: initialCash,
      totalValue: initialCash,
      unrealizedPnL: 0,
      realizedPnL: 0,
      margin: 0,
      marginUsed: 0,
      positions: {},
      orders: {},
      lastUpdate: Date.now()
    }

    this.portfolios.set(agentId, portfolio)
    this.persistData()
    
    this.emit('portfolioCreated', { agentId, portfolio })
    return portfolio
  }

  getAgentPortfolio(agentId: string): AgentPortfolio | null {
    return this.portfolios.get(agentId) || null
  }

  getAllPortfolios(): Map<string, AgentPortfolio> {
    return new Map(this.portfolios)
  }

  // Order management
  async placeOrder(
    agentId: string,
    symbol: string,
    side: 'buy' | 'sell',
    size: number,
    type: 'market' | 'limit' | 'stop' | 'stop_limit' = 'market',
    price?: number,
    stopPrice?: number,
    timeInForce: 'GTC' | 'IOC' | 'FOK' = 'GTC'
  ): Promise<PersistentOrder | null> {
    
    const portfolio = this.portfolios.get(agentId)
    if (!portfolio) {
      throw new Error(`Agent portfolio not found: ${agentId}`)
    }

    // Validate order
    if (size < this.MIN_ORDER_SIZE) {
      throw new Error(`Order size too small. Minimum: ${this.MIN_ORDER_SIZE}`)
    }

    const marketPrice = this.getMarketPrice(symbol)
    if (!marketPrice) {
      throw new Error(`Market data not available for ${symbol}`)
    }

    // Calculate required cash/margin
    const orderValue = size * (price || marketPrice.price)
    const requiredCash = side === 'buy' ? orderValue : 0
    const fee = orderValue * this.FEE_RATE

    if (side === 'buy' && portfolio.cash < requiredCash + fee) {
      throw new Error('Insufficient cash for order')
    }

    // Create order
    const order: PersistentOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      symbol,
      side,
      type,
      size,
      price,
      stopPrice,
      timeInForce,
      status: type === 'market' ? 'filled' : 'pending',
      filledSize: 0,
      averageFillPrice: 0,
      timestamp: Date.now(),
      expiryTime: timeInForce === 'GTC' ? undefined : Date.now() + 24 * 60 * 60 * 1000 // 24h expiry
    }

    // Add to portfolio orders
    portfolio.orders[order.id] = order

    // Add to order book for processing
    if (!this.orderBook.has(symbol)) {
      this.orderBook.set(symbol, [])
    }
    this.orderBook.get(symbol)!.push(order)

    // Execute market orders immediately
    if (type === 'market') {
      await this.executeMarketOrder(order)
    }

    this.emit('orderPlaced', { agentId, order })
    return order
  }

  async cancelOrder(agentId: string, orderId: string): Promise<boolean> {
    const portfolio = this.portfolios.get(agentId)
    if (!portfolio || !portfolio.orders[orderId]) {
      return false
    }

    const order = portfolio.orders[orderId]
    if (order.status === 'filled') {
      return false // Cannot cancel filled order
    }

    order.status = 'cancelled'
    
    // Remove from order book
    const symbolOrders = this.orderBook.get(order.symbol)
    if (symbolOrders) {
      const index = symbolOrders.findIndex(o => o.id === orderId)
      if (index !== -1) {
        symbolOrders.splice(index, 1)
      }
    }

    this.emit('orderCancelled', { agentId, orderId })
    return true
  }

  // Market data management
  updateMarketData(symbol: string, data: Partial<MarketData>): void {
    const existing = this.marketData.get(symbol) || {
      symbol,
      price: 0,
      bid: 0,
      ask: 0,
      volume: 0,
      timestamp: Date.now(),
      change24h: 0,
      changePercent24h: 0
    }

    const updated = { ...existing, ...data, timestamp: Date.now() }
    this.marketData.set(symbol, updated)
    
    this.emit('marketDataUpdated', { symbol, data: updated })
  }

  getMarketPrice(symbol: string): MarketData | null {
    return this.marketData.get(symbol) || null
  }

  getAllMarketData(): Map<string, MarketData> {
    return new Map(this.marketData)
  }

  // Private execution methods
  private async executeMarketOrder(order: PersistentOrder): Promise<void> {
    const marketPrice = this.getMarketPrice(order.symbol)
    if (!marketPrice) return

    const portfolio = this.portfolios.get(order.agentId)
    if (!portfolio) return

    // Calculate execution price with slippage
    const slippage = order.side === 'buy' ? this.SLIPPAGE_TOLERANCE : -this.SLIPPAGE_TOLERANCE
    const executionPrice = marketPrice.price * (1 + slippage)
    const fee = order.size * executionPrice * this.FEE_RATE

    // Execute the order
    const execution: TradeExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      agentId: order.agentId,
      symbol: order.symbol,
      side: order.side,
      size: order.size,
      price: executionPrice,
      fee,
      timestamp: Date.now(),
      type: 'fill'
    }

    // Update order
    order.status = 'filled'
    order.filledSize = order.size
    order.averageFillPrice = executionPrice

    // Update portfolio
    if (order.side === 'buy') {
      portfolio.cash -= (order.size * executionPrice + fee)
      this.openPosition(portfolio, order.symbol, 'long', order.size, executionPrice)
    } else {
      portfolio.cash += (order.size * executionPrice - fee)
      this.closePosition(portfolio, order.symbol, order.size, executionPrice)
    }

    // Record execution
    this.executionHistory.push(execution)

    this.emit('orderExecuted', { execution, order })
  }

  private openPosition(
    portfolio: AgentPortfolio, 
    symbol: string, 
    side: 'long' | 'short', 
    size: number, 
    price: number
  ): void {
    const positionId = `${portfolio.agentId}_${symbol}`
    const existing = portfolio.positions[positionId]

    if (existing) {
      // Add to existing position
      const totalSize = existing.size + size
      const weightedPrice = (existing.size * existing.entryPrice + size * price) / totalSize
      existing.size = totalSize
      existing.entryPrice = weightedPrice
      existing.marginUsed += size * price / this.MAX_LEVERAGE
    } else {
      // Create new position
      const position: PersistentPosition = {
        id: positionId,
        agentId: portfolio.agentId,
        symbol,
        side,
        size,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnL: 0,
        realizedPnL: 0,
        marginUsed: size * price / this.MAX_LEVERAGE,
        timestamp: Date.now(),
        status: 'open'
      }
      portfolio.positions[positionId] = position
    }
  }

  private closePosition(
    portfolio: AgentPortfolio, 
    symbol: string, 
    size: number, 
    price: number
  ): void {
    const positionId = `${portfolio.agentId}_${symbol}`
    const position = portfolio.positions[positionId]

    if (position && position.size >= size) {
      const pnl = (price - position.entryPrice) * size * (position.side === 'long' ? 1 : -1)
      position.realizedPnL += pnl
      portfolio.realizedPnL += pnl
      
      position.size -= size
      if (position.size <= 0) {
        position.status = 'closed'
        delete portfolio.positions[positionId]
      }
    }
  }

  private processMarketUpdate(): void {
    // Simulate market data updates
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'LINK/USDT', 'UNI/USDT']
    
    symbols.forEach(symbol => {
      const existing = this.marketData.get(symbol)
      const basePrice = existing?.price || this.getBasePrice(symbol)
      
      // Simulate price movement
      const volatility = 0.002 // 0.2% volatility
      const change = (Math.random() - 0.5) * volatility
      const newPrice = basePrice * (1 + change)
      
      this.updateMarketData(symbol, {
        price: newPrice,
        bid: newPrice * 0.999,
        ask: newPrice * 1.001,
        volume: Math.random() * 1000000,
        change24h: change * 100,
        changePercent24h: change * 100
      })
    })
  }

  private getBasePrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTC/USDT': 45000,
      'ETH/USDT': 3000,
      'SOL/USDT': 100,
      'LINK/USDT': 15,
      'UNI/USDT': 8
    }
    return basePrices[symbol] || 100
  }

  private executeOrders(): void {
    this.orderBook.forEach((orders, symbol) => {
      const marketData = this.marketData.get(symbol)
      if (!marketData) return

      orders.forEach(async (order) => {
        if (order.status !== 'pending') return

        let shouldExecute = false

        switch (order.type) {
          case 'limit':
            shouldExecute = (order.side === 'buy' && marketData.price <= (order.price || 0)) ||
                           (order.side === 'sell' && marketData.price >= (order.price || 0))
            break
          case 'stop':
            shouldExecute = (order.side === 'buy' && marketData.price >= (order.stopPrice || 0)) ||
                           (order.side === 'sell' && marketData.price <= (order.stopPrice || 0))
            break
        }

        if (shouldExecute) {
          await this.executeMarketOrder(order)
        }

        // Check expiry
        if (order.expiryTime && Date.now() > order.expiryTime) {
          order.status = 'cancelled'
        }
      })
    })
  }

  private updatePortfolios(): void {
    this.portfolios.forEach((portfolio) => {
      let totalUnrealizedPnL = 0
      let totalMarginUsed = 0

      // Update positions with current market prices
      Object.values(portfolio.positions).forEach((position) => {
        const marketData = this.marketData.get(position.symbol)
        if (marketData) {
          position.currentPrice = marketData.price
          const pnl = (position.currentPrice - position.entryPrice) * position.size * 
                     (position.side === 'long' ? 1 : -1)
          position.unrealizedPnL = pnl
          totalUnrealizedPnL += pnl
          totalMarginUsed += position.marginUsed
        }
      })

      portfolio.unrealizedPnL = totalUnrealizedPnL
      portfolio.marginUsed = totalMarginUsed
      portfolio.totalValue = portfolio.cash + totalUnrealizedPnL
      portfolio.lastUpdate = Date.now()
    })
  }

  // Persistence methods
  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('persistent_trading_engine')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore portfolios
        if (data.portfolios) {
          this.portfolios = new Map(Object.entries(data.portfolios))
        }
        
        // Restore market data
        if (data.marketData) {
          this.marketData = new Map(Object.entries(data.marketData))
        }
        
        // Restore execution history
        if (data.executionHistory) {
          this.executionHistory = data.executionHistory
        }
        
        console.log('Loaded persistent trading data')
      }
    } catch (error) {
      console.error('Failed to load persistent trading data:', error)
    }
  }

  private persistData(): void {
    try {
      const data = {
        portfolios: Object.fromEntries(this.portfolios),
        marketData: Object.fromEntries(this.marketData),
        executionHistory: this.executionHistory.slice(-1000) // Keep last 1000 executions
      }
      
      localStorage.setItem('persistent_trading_engine', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist trading data:', error)
    }
  }

  // Analytics methods
  getAgentPerformance(agentId: string): {
    totalReturn: number
    totalReturnPercent: number
    winRate: number
    totalTrades: number
    sharpeRatio: number
  } | null {
    const portfolio = this.portfolios.get(agentId)
    if (!portfolio) return null

    const executions = this.executionHistory.filter(e => e.agentId === agentId)
    const totalTrades = executions.length
    const totalReturn = portfolio.realizedPnL + portfolio.unrealizedPnL
    
    // Calculate initial portfolio value (assumes 10k start)
    const initialValue = 10000
    const totalReturnPercent = (totalReturn / initialValue) * 100

    // Simple win rate calculation
    const wins = executions.filter(e => {
      // This is simplified - in reality we'd track position opens/closes
      return e.side === 'sell' && totalReturn > 0
    }).length
    const winRate = totalTrades > 0 ? wins / totalTrades : 0

    return {
      totalReturn,
      totalReturnPercent,
      winRate,
      totalTrades,
      sharpeRatio: totalReturn / Math.max(Math.abs(totalReturn), 1) // Simplified Sharpe
    }
  }

  // Event methods for real-time updates
  onPortfolioUpdate(callback: (data: { agentId: string, portfolio: AgentPortfolio }) => void): void {
    this.on('portfolioUpdated', callback)
  }

  onOrderUpdate(callback: (data: { agentId: string, order: PersistentOrder }) => void): void {
    this.on('orderPlaced', callback)
    this.on('orderExecuted', callback)
    this.on('orderCancelled', callback)
  }

  onMarketUpdate(callback: (data: { symbol: string, data: MarketData }) => void): void {
    this.on('marketDataUpdated', callback)
  }
}

// Singleton instance
export const persistentTradingEngine = new PersistentTradingEngine()

export default PersistentTradingEngine