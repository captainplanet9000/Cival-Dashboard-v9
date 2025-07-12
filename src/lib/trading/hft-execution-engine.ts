'use client'

import { EventEmitter } from 'events'
import { productionRiskManager } from '@/lib/risk/production-risk-manager'
import { exchangeAPIService } from '@/lib/trading/exchange-api-service'
import { EnhancedLiveMarketService } from '@/lib/market/enhanced-live-market-service'

export interface HFTOrder {
  id: string
  agentId: string
  strategy: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  orderType: 'market' | 'limit' | 'iceberg' | 'stop' | 'maker_only'
  timeInForce: 'IOC' | 'FOK' | 'GTC' | 'GTT'
  priority: 'ultra_high' | 'high' | 'medium' | 'low'
  latencyTarget: number // microseconds
  createdAt: Date
  submittedAt?: Date
  executedAt?: Date
  status: 'pending' | 'queued' | 'submitted' | 'filled' | 'cancelled' | 'rejected'
}

export interface MarketMakingQuote {
  symbol: string
  bidPrice: number
  askPrice: number
  bidSize: number
  askSize: number
  spread: number
  skew: number
  confidence: number
}

export interface ArbitrageOpportunity {
  id: string
  symbol: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  profit: number
  profitPercent: number
  confidence: number
  latencyWindow: number
  timestamp: Date
}

export interface ExecutionMetrics {
  avgExecutionTime: number
  fillRate: number
  slippage: number
  latency: number
  rejectionRate: number
  profitFactor: number
  tradesPerSecond: number
  timestamp: Date
}

export class HFTExecutionEngine extends EventEmitter {
  private orderQueue: HFTOrder[] = []
  private activeOrders = new Map<string, HFTOrder>()
  private marketMakingQuotes = new Map<string, MarketMakingQuote>()
  private arbitrageOpportunities: ArbitrageOpportunity[] = []
  private executionMetrics: ExecutionMetrics
  private isRunning = false
  private processingInterval?: NodeJS.Timeout
  private marketMakingInterval?: NodeJS.Timeout
  private arbitrageInterval?: NodeJS.Timeout
  private metricsInterval?: NodeJS.Timeout

  constructor() {
    super()
    this.initializeMetrics()
    this.setupMarketDataListeners()
    this.startEngine()
  }

  private initializeMetrics() {
    this.executionMetrics = {
      avgExecutionTime: 0,
      fillRate: 0,
      slippage: 0,
      latency: 0,
      rejectionRate: 0,
      profitFactor: 1,
      tradesPerSecond: 0,
      timestamp: new Date()
    }
  }

  private setupMarketDataListeners() {
    // Listen for live market data updates
    liveMarketDataService.on('marketData', (data) => {
      this.processMarketUpdate(data)
    })
  }

  private startEngine() {
    if (this.isRunning) return

    this.isRunning = true
    console.log('⚡ HFT Execution Engine: Starting high-frequency operations')

    // Ultra-fast order processing (every 100ms)
    this.processingInterval = setInterval(() => {
      this.processOrderQueue()
    }, 100)

    // Market making updates (every 500ms)
    this.marketMakingInterval = setInterval(() => {
      this.updateMarketMakingQuotes()
    }, 500)

    // Arbitrage scanning (every 250ms)
    this.arbitrageInterval = setInterval(() => {
      this.scanArbitrageOpportunities()
    }, 250)

    // Metrics collection (every 5 seconds)
    this.metricsInterval = setInterval(() => {
      this.updateExecutionMetrics()
    }, 5000)

    this.emit('engineStarted')
  }

  // Order submission and management
  async submitOrder(order: Omit<HFTOrder, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const orderId = `hft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const hftOrder: HFTOrder = {
      ...order,
      id: orderId,
      createdAt: new Date(),
      status: 'pending'
    }

    // Pre-trade risk check
    const riskCheck = await productionRiskManager.checkPreTrade(order.agentId, {
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price || 0,
      portfolio: {} // Would pass actual portfolio
    })

    if (!riskCheck.allowed) {
      hftOrder.status = 'rejected'
      this.emit('orderRejected', hftOrder, riskCheck.reason)
      return orderId
    }

    // Queue order based on priority
    this.queueOrder(hftOrder)
    this.emit('orderSubmitted', hftOrder)
    
    console.log(`⚡ HFT Order queued: ${order.strategy} ${order.side} ${order.quantity} ${order.symbol}`)
    return orderId
  }

  private queueOrder(order: HFTOrder) {
    order.status = 'queued'
    
    // Insert order based on priority and latency target
    let insertIndex = this.orderQueue.length
    
    for (let i = 0; i < this.orderQueue.length; i++) {
      const queuedOrder = this.orderQueue[i]
      
      if (this.shouldPrioritize(order, queuedOrder)) {
        insertIndex = i
        break
      }
    }
    
    this.orderQueue.splice(insertIndex, 0, order)
  }

  private shouldPrioritize(newOrder: HFTOrder, existingOrder: HFTOrder): boolean {
    // Priority levels
    const priorityWeight = {
      'ultra_high': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    }
    
    const newPriority = priorityWeight[newOrder.priority]
    const existingPriority = priorityWeight[existingOrder.priority]
    
    if (newPriority > existingPriority) return true
    if (newPriority < existingPriority) return false
    
    // If same priority, prioritize by latency target
    return newOrder.latencyTarget < existingOrder.latencyTarget
  }

  // Order processing
  private async processOrderQueue() {
    if (this.orderQueue.length === 0) return

    const batchSize = Math.min(10, this.orderQueue.length) // Process up to 10 orders per cycle
    const ordersToProcess = this.orderQueue.splice(0, batchSize)

    // Process orders concurrently for maximum speed
    const processPromises = ordersToProcess.map(order => this.executeOrder(order))
    await Promise.allSettled(processPromises)
  }

  private async executeOrder(order: HFTOrder): Promise<void> {
    const startTime = performance.now()
    
    try {
      order.status = 'submitted'
      order.submittedAt = new Date()
      this.activeOrders.set(order.id, order)

      // Determine best execution venue
      const venue = await this.selectOptimalVenue(order)
      
      // Execute order based on type
      let executionResult
      
      switch (order.orderType) {
        case 'market':
          executionResult = await this.executeMarketOrder(order, venue)
          break
        case 'limit':
          executionResult = await this.executeLimitOrder(order, venue)
          break
        case 'iceberg':
          executionResult = await this.executeIcebergOrder(order, venue)
          break
        case 'maker_only':
          executionResult = await this.executeMakerOnlyOrder(order, venue)
          break
        default:
          throw new Error(`Unsupported order type: ${order.orderType}`)
      }

      if (executionResult) {
        order.status = 'filled'
        order.executedAt = new Date()
        
        const executionTime = performance.now() - startTime
        this.emit('orderFilled', order, executionResult, executionTime)
        
        console.log(`✅ HFT Order filled: ${order.id} in ${executionTime.toFixed(2)}ms`)
      }

    } catch (error) {
      order.status = 'rejected'
      this.emit('orderError', order, error)
      console.error(`❌ HFT Order failed: ${order.id}`, error)
    } finally {
      this.activeOrders.delete(order.id)
    }
  }

  private async selectOptimalVenue(order: HFTOrder): Promise<string> {
    const configuredExchanges = exchangeAPIService.getConfiguredExchanges()
    
    if (configuredExchanges.length === 0) {
      return 'paper' // Fallback to paper trading
    }
    
    // For now, use first available exchange
    // In production, would implement smart order routing
    return configuredExchanges[0]
  }

  private async executeMarketOrder(order: HFTOrder, venue: string): Promise<any> {
    if (venue === 'paper') {
      // Paper trading execution
      return this.simulateExecution(order)
    }
    
    return exchangeAPIService.placeOrder(venue, {
      symbol: order.symbol,
      side: order.side.toUpperCase() as any,
      type: 'MARKET',
      quantity: order.quantity,
      clientOrderId: order.id
    })
  }

  private async executeLimitOrder(order: HFTOrder, venue: string): Promise<any> {
    if (venue === 'paper') {
      return this.simulateExecution(order)
    }
    
    return exchangeAPIService.placeOrder(venue, {
      symbol: order.symbol,
      side: order.side.toUpperCase() as any,
      type: 'LIMIT',
      quantity: order.quantity,
      price: order.price,
      clientOrderId: order.id
    })
  }

  private async executeIcebergOrder(order: HFTOrder, venue: string): Promise<any> {
    // Iceberg orders break large orders into smaller chunks
    const chunkSize = Math.min(order.quantity * 0.1, 1000) // 10% or max 1000 units
    const chunks = Math.ceil(order.quantity / chunkSize)
    
    console.log(`🧊 Executing iceberg order: ${chunks} chunks of ${chunkSize}`)
    
    // For simplicity, execute as regular limit order
    // In production, would implement proper iceberg logic
    return this.executeLimitOrder(order, venue)
  }

  private async executeMakerOnlyOrder(order: HFTOrder, venue: string): Promise<any> {
    // Maker-only orders provide liquidity and receive rebates
    // Ensure price is better than current market
    const marketData = liveMarketDataService.getLatestData(order.symbol)
    
    if (marketData) {
      if (order.side === 'buy' && order.price! >= marketData.ask) {
        order.price = marketData.bid - 0.01 // Ensure we're on the bid side
      } else if (order.side === 'sell' && order.price! <= marketData.bid) {
        order.price = marketData.ask + 0.01 // Ensure we're on the ask side
      }
    }
    
    return this.executeLimitOrder(order, venue)
  }

  private simulateExecution(order: HFTOrder): any {
    // Simulate execution for paper trading
    const marketData = liveMarketDataService.getLatestData(order.symbol)
    const executionPrice = marketData ? 
      (order.side === 'buy' ? marketData.ask : marketData.bid) : 
      (order.price || 100)

    return {
      id: order.id,
      price: executionPrice,
      quantity: order.quantity,
      timestamp: new Date()
    }
  }

  // Market making strategies
  private updateMarketMakingQuotes() {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'] // Major pairs
    
    symbols.forEach(symbol => {
      const quote = this.generateMarketMakingQuote(symbol)
      if (quote) {
        this.marketMakingQuotes.set(symbol, quote)
        this.emit('marketMakingQuote', quote)
      }
    })
  }

  private generateMarketMakingQuote(symbol: string): MarketMakingQuote | null {
    const marketData = liveMarketDataService.getLatestData(symbol)
    if (!marketData) return null

    const midPrice = (marketData.bid + marketData.ask) / 2
    const spread = marketData.ask - marketData.bid
    const targetSpread = Math.max(spread * 1.1, midPrice * 0.001) // Minimum 0.1% spread

    // Calculate optimal bid/ask based on order flow and inventory
    const skew = this.calculateMarketMakingSkew(symbol)
    const bidPrice = midPrice - (targetSpread / 2) + skew
    const askPrice = midPrice + (targetSpread / 2) + skew

    return {
      symbol,
      bidPrice,
      askPrice,
      bidSize: 100, // Dynamic sizing based on volatility
      askSize: 100,
      spread: targetSpread,
      skew,
      confidence: 0.8
    }
  }

  private calculateMarketMakingSkew(symbol: string): number {
    // Calculate inventory skew to manage risk
    // Positive skew = long inventory, prefer selling
    // Negative skew = short inventory, prefer buying
    return (Math.random() - 0.5) * 0.01 // Mock skew calculation
  }

  // Arbitrage detection
  private scanArbitrageOpportunities() {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD']
    const exchanges = exchangeAPIService.getConfiguredExchanges()
    
    if (exchanges.length < 2) return // Need at least 2 exchanges for arbitrage
    
    symbols.forEach(symbol => {
      const opportunity = this.detectArbitrage(symbol, exchanges)
      if (opportunity) {
        this.arbitrageOpportunities.push(opportunity)
        this.emit('arbitrageOpportunity', opportunity)
        
        // Auto-execute if profitable enough
        if (opportunity.profitPercent > 0.5) { // 0.5% minimum profit
          this.executeArbitrageOpportunity(opportunity)
        }
      }
    })
    
    // Clean old opportunities
    this.arbitrageOpportunities = this.arbitrageOpportunities.filter(
      opp => Date.now() - opp.timestamp.getTime() < 10000 // Keep for 10 seconds
    )
  }

  private detectArbitrage(symbol: string, exchanges: string[]): ArbitrageOpportunity | null {
    // Mock arbitrage detection
    // In production, would compare real-time prices across exchanges
    
    const basePrice = 50000 // Mock BTC price
    const exchange1Price = basePrice + (Math.random() - 0.5) * basePrice * 0.002
    const exchange2Price = basePrice + (Math.random() - 0.5) * basePrice * 0.002
    
    const profit = Math.abs(exchange2Price - exchange1Price)
    const profitPercent = (profit / Math.min(exchange1Price, exchange2Price)) * 100
    
    if (profitPercent > 0.1) { // Minimum 0.1% profit threshold
      return {
        id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        buyExchange: exchange1Price < exchange2Price ? exchanges[0] : exchanges[1],
        sellExchange: exchange1Price < exchange2Price ? exchanges[1] : exchanges[0],
        buyPrice: Math.min(exchange1Price, exchange2Price),
        sellPrice: Math.max(exchange1Price, exchange2Price),
        profit,
        profitPercent,
        confidence: 0.9,
        latencyWindow: 5000, // 5 second window
        timestamp: new Date()
      }
    }
    
    return null
  }

  private async executeArbitrageOpportunity(opportunity: ArbitrageOpportunity) {
    console.log(`⚡ Executing arbitrage: ${opportunity.profitPercent.toFixed(3)}% profit on ${opportunity.symbol}`)
    
    try {
      // Simultaneous buy and sell orders
      const quantity = 1 // Dynamic sizing based on opportunity size
      
      const buyOrderId = await this.submitOrder({
        agentId: 'arbitrage_agent',
        strategy: 'arbitrage',
        symbol: opportunity.symbol,
        side: 'buy',
        quantity,
        price: opportunity.buyPrice,
        orderType: 'limit',
        timeInForce: 'IOC',
        priority: 'ultra_high',
        latencyTarget: 50 // 50 microseconds
      })
      
      const sellOrderId = await this.submitOrder({
        agentId: 'arbitrage_agent',
        strategy: 'arbitrage',
        symbol: opportunity.symbol,
        side: 'sell',
        quantity,
        price: opportunity.sellPrice,
        orderType: 'limit',
        timeInForce: 'IOC',
        priority: 'ultra_high',
        latencyTarget: 50
      })
      
      this.emit('arbitrageExecuted', opportunity, { buyOrderId, sellOrderId })
      
    } catch (error) {
      console.error('Arbitrage execution failed:', error)
    }
  }

  // Market data processing
  private processMarketUpdate(marketData: any) {
    // Update internal market state
    // Trigger any price-based strategies
    
    // Check for price anomalies
    if (Math.abs(marketData.change24h) > 10) {
      this.emit('priceAnomaly', marketData)
    }
    
    // Update market making quotes
    if (this.marketMakingQuotes.has(marketData.symbol)) {
      // Regenerate quotes for this symbol
      const quote = this.generateMarketMakingQuote(marketData.symbol)
      if (quote) {
        this.marketMakingQuotes.set(marketData.symbol, quote)
      }
    }
  }

  // Performance metrics
  private updateExecutionMetrics() {
    // Calculate real-time metrics
    const recentOrders = Array.from(this.activeOrders.values())
    const filledOrders = recentOrders.filter(o => o.status === 'filled')
    const rejectedOrders = recentOrders.filter(o => o.status === 'rejected')
    
    this.executionMetrics = {
      avgExecutionTime: this.calculateAvgExecutionTime(filledOrders),
      fillRate: filledOrders.length / Math.max(recentOrders.length, 1) * 100,
      slippage: this.calculateAvgSlippage(filledOrders),
      latency: this.calculateAvgLatency(filledOrders),
      rejectionRate: rejectedOrders.length / Math.max(recentOrders.length, 1) * 100,
      profitFactor: this.calculateProfitFactor(),
      tradesPerSecond: filledOrders.length / 60, // Trades per minute / 60
      timestamp: new Date()
    }
    
    this.emit('metricsUpdated', this.executionMetrics)
  }

  private calculateAvgExecutionTime(orders: HFTOrder[]): number {
    if (orders.length === 0) return 0
    
    const total = orders.reduce((sum, order) => {
      if (order.submittedAt && order.executedAt) {
        return sum + (order.executedAt.getTime() - order.submittedAt.getTime())
      }
      return sum
    }, 0)
    
    return total / orders.length
  }

  private calculateAvgSlippage(orders: HFTOrder[]): number {
    // Mock slippage calculation
    return Math.random() * 0.01 // 0-1% slippage
  }

  private calculateAvgLatency(orders: HFTOrder[]): number {
    // Mock latency calculation
    return Math.random() * 100 + 50 // 50-150ms
  }

  private calculateProfitFactor(): number {
    // Mock profit factor calculation
    return 1 + Math.random() * 0.5 // 1.0-1.5
  }

  // Public API
  getActiveOrders(): HFTOrder[] {
    return Array.from(this.activeOrders.values())
  }

  getOrderQueue(): HFTOrder[] {
    return [...this.orderQueue]
  }

  getMarketMakingQuotes(): MarketMakingQuote[] {
    return Array.from(this.marketMakingQuotes.values())
  }

  getArbitrageOpportunities(): ArbitrageOpportunity[] {
    return [...this.arbitrageOpportunities]
  }

  getExecutionMetrics(): ExecutionMetrics {
    return this.executionMetrics
  }

  cancelOrder(orderId: string): boolean {
    const order = this.activeOrders.get(orderId)
    if (order) {
      order.status = 'cancelled'
      this.activeOrders.delete(orderId)
      this.emit('orderCancelled', order)
      return true
    }
    
    // Remove from queue if not yet processed
    const queueIndex = this.orderQueue.findIndex(o => o.id === orderId)
    if (queueIndex >= 0) {
      const order = this.orderQueue.splice(queueIndex, 1)[0]
      order.status = 'cancelled'
      this.emit('orderCancelled', order)
      return true
    }
    
    return false
  }

  // Cleanup
  stop() {
    this.isRunning = false
    
    if (this.processingInterval) clearInterval(this.processingInterval)
    if (this.marketMakingInterval) clearInterval(this.marketMakingInterval)
    if (this.arbitrageInterval) clearInterval(this.arbitrageInterval)
    if (this.metricsInterval) clearInterval(this.metricsInterval)
    
    console.log('⚡ HFT Execution Engine stopped')
    this.emit('engineStopped')
  }
}

// Lazy initialization
let hftExecutionEngineInstance: HFTExecutionEngine | null = null

export function getHftExecutionEngine(): HFTExecutionEngine {
  if (!hftExecutionEngineInstance) {
    hftExecutionEngineInstance = new HFTExecutionEngine()
  }
  return hftExecutionEngineInstance
}

// For backward compatibility
export const hftExecutionEngine = {
  get instance() {
    return getHftExecutionEngine()
  }
}