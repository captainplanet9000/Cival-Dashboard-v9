'use client'

/**
 * Queue-Based Trading Service
 * Handles trading orders through Supabase Queues for guaranteed delivery and processing
 * Integrates with the existing mock trading system while adding reliability
 */

import { getSupabaseQueueService, type TradingMessage } from '../queues/supabase-queue-service'
import { backendClient, type TradingOrder, type OrderResponse } from '../api/backend-client'
import { EnhancedMarketPrice } from '../market/enhanced-live-market-service'

export interface QueuedTradingOrder {
  id: string
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  orderType: 'market' | 'limit' | 'stop_loss' | 'take_profit'
  price?: number
  stopPrice?: number
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY'
  priority: number
  createdAt: Date
  status: 'pending' | 'processing' | 'filled' | 'rejected' | 'cancelled'
  metadata?: {
    strategy?: string
    riskLimit?: number
    notes?: string
  }
}

export interface OrderExecutionResult {
  orderId: string
  status: 'filled' | 'partial' | 'rejected'
  executedQuantity: number
  executedPrice: number
  fees: number
  timestamp: Date
  trade?: OrderResponse
  reason?: string
}

export interface TradingSignal {
  id: string
  agentId: string
  symbol: string
  signal: 'buy' | 'sell' | 'hold'
  strength: number // 0-1
  confidence: number // 0-1
  reasoning: string
  marketContext: any
  timestamp: Date
  priority: number
}

export interface RiskAlert {
  id: string
  type: 'position_limit' | 'loss_limit' | 'concentration' | 'volatility' | 'liquidity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  agentId?: string
  symbol?: string
  currentValue: number
  limitValue: number
  action: 'monitor' | 'reduce_position' | 'stop_trading' | 'force_close'
  timestamp: Date
}

export interface MarketDataUpdate {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: Date
  source: 'mock' | 'live'
}

class QueueTradingService {
  private queueService = getSupabaseQueueService()
  private initialized = false
  private backendConnected = false
  private orderCounter = 0
  private signalCounter = 0
  private alertCounter = 0

  // Order tracking
  private pendingOrders = new Map<string, QueuedTradingOrder>()
  private executionResults = new Map<string, OrderExecutionResult>()
  private tradingSignals: TradingSignal[] = []
  private riskAlerts: RiskAlert[] = []

  // Event listeners
  private orderListeners: ((order: QueuedTradingOrder) => void)[] = []
  private executionListeners: ((result: OrderExecutionResult) => void)[] = []
  private signalListeners: ((signal: TradingSignal) => void)[] = []
  private alertListeners: ((alert: RiskAlert) => void)[] = []

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize queue service
      await this.queueService.initialize()

      // Set up trading order queue handler
      await this.queueService.receiveTradingOrders(async (message) => {
        await this.processTradingOrder(message.payload)
      })

      // Set up risk alert queue handler
      await this.queueService.receiveRiskAlerts(async (message) => {
        await this.processRiskAlert(message.payload)
      })

      // Set up market data queue handler
      await this.queueService.receiveMarketData(async (message) => {
        await this.processMarketData(message.payload)
      })

      this.initialized = true
      console.log('✅ Queue Trading Service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Queue Trading Service:', error)
      throw error
    }
  }

  // Order Management
  async submitOrder(orderData: Omit<QueuedTradingOrder, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const orderId = `order_${Date.now()}_${this.orderCounter++}`
    
    const order: QueuedTradingOrder = {
      ...orderData,
      id: orderId,
      createdAt: new Date(),
      status: 'pending'
    }

    // Store locally for tracking
    this.pendingOrders.set(orderId, order)

    // Send to queue for processing
    await this.queueService.sendTradingOrder({
      type: 'order',
      symbol: order.symbol,
      data: order,
      priority: order.priority,
      timestamp: new Date()
    })

    // Notify listeners
    this.orderListeners.forEach(listener => listener(order))

    console.log(`📋 Order ${orderId} submitted to queue: ${order.side} ${order.quantity} ${order.symbol}`)
    return orderId
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.pendingOrders.get(orderId)
    if (!order || order.status !== 'pending') {
      return false
    }

    // Update status
    order.status = 'cancelled'
    this.pendingOrders.set(orderId, order)

    // Send cancellation to queue
    await this.queueService.sendTradingOrder({
      type: 'order',
      symbol: order.symbol,
      data: { ...order, action: 'cancel' },
      priority: 5, // High priority for cancellations
      timestamp: new Date()
    })

    console.log(`❌ Order ${orderId} cancelled`)
    return true
  }

  async getOrderStatus(orderId: string): Promise<QueuedTradingOrder | null> {
    return this.pendingOrders.get(orderId) || null
  }

  async getOrderHistory(agentId?: string, limit: number = 50): Promise<QueuedTradingOrder[]> {
    const orders = Array.from(this.pendingOrders.values())
    const filtered = agentId ? orders.filter(o => o.agentId === agentId) : orders
    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Trading Signal Management
  async publishTradingSignal(signalData: Omit<TradingSignal, 'id' | 'timestamp'>): Promise<string> {
    const signalId = `signal_${Date.now()}_${this.signalCounter++}`
    
    const signal: TradingSignal = {
      ...signalData,
      id: signalId,
      timestamp: new Date()
    }

    this.tradingSignals.unshift(signal)
    this.tradingSignals = this.tradingSignals.slice(0, 100) // Keep last 100

    // Send to queue for distribution
    await this.queueService.sendTradingOrder({
      type: 'signal',
      symbol: signal.symbol,
      data: signal,
      priority: signal.priority,
      timestamp: new Date()
    })

    // Notify listeners
    this.signalListeners.forEach(listener => listener(signal))

    console.log(`📡 Trading signal ${signalId} published: ${signal.signal} ${signal.symbol}`)
    return signalId
  }

  async getTradingSignals(agentId?: string, limit: number = 20): Promise<TradingSignal[]> {
    const filtered = agentId 
      ? this.tradingSignals.filter(s => s.agentId === agentId)
      : this.tradingSignals
    
    return filtered.slice(0, limit)
  }

  // Risk Management
  async triggerRiskAlert(alertData: Omit<RiskAlert, 'id' | 'timestamp'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${this.alertCounter++}`
    
    const alert: RiskAlert = {
      ...alertData,
      id: alertId,
      timestamp: new Date()
    }

    this.riskAlerts.unshift(alert)
    this.riskAlerts = this.riskAlerts.slice(0, 200) // Keep last 200

    // Send to queue for immediate processing
    await this.queueService.sendRiskAlert({
      type: 'alert',
      level: alert.severity,
      data: alert,
      timestamp: new Date()
    })

    // Notify listeners
    this.alertListeners.forEach(listener => listener(alert))

    console.log(`🚨 Risk alert ${alertId} triggered: ${alert.type} - ${alert.severity}`)
    return alertId
  }

  async getRiskAlerts(severity?: RiskAlert['severity'], limit: number = 50): Promise<RiskAlert[]> {
    const filtered = severity 
      ? this.riskAlerts.filter(a => a.severity === severity)
      : this.riskAlerts
    
    return filtered.slice(0, limit)
  }

  // Market Data Management
  async publishMarketData(data: MarketDataUpdate): Promise<void> {
    await this.queueService.sendMarketData({
      symbol: data.symbol,
      price: data.price,
      change24h: data.change24h,
      volume24h: data.volume24h,
      timestamp: data.timestamp,
      source: data.source
    })
  }

  // Event Listeners
  onOrderUpdate(listener: (order: QueuedTradingOrder) => void): void {
    this.orderListeners.push(listener)
  }

  onOrderExecution(listener: (result: OrderExecutionResult) => void): void {
    this.executionListeners.push(listener)
  }

  onTradingSignal(listener: (signal: TradingSignal) => void): void {
    this.signalListeners.push(listener)
  }

  onRiskAlert(listener: (alert: RiskAlert) => void): void {
    this.alertListeners.push(listener)
  }

  // Queue Message Processors
  private async processTradingOrder(message: TradingMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'order':
          await this.executeOrder(message.data)
          break
        case 'signal':
          await this.processSignal(message.data)
          break
        case 'execution':
          await this.handleExecution(message.data)
          break
        case 'settlement':
          await this.handleSettlement(message.data)
          break
      }
    } catch (error) {
      console.error('Error processing trading order:', error)
    }
  }

  private async executeOrder(orderData: QueuedTradingOrder): Promise<void> {
    if (orderData.action === 'cancel') {
      // Handle cancellation
      const order = this.pendingOrders.get(orderData.id)
      if (order) {
        order.status = 'cancelled'
        this.pendingOrders.set(orderData.id, order)
      }
      return
    }

    // Update order status
    const order = this.pendingOrders.get(orderData.id)
    if (!order) return

    order.status = 'processing'
    this.pendingOrders.set(orderData.id, order)

    try {
      // Execute through mock service
      const trade = this.mockService.simulateTrade(
        order.symbol,
        order.side,
        order.quantity,
        order.price
      )

      // Create execution result
      const result: OrderExecutionResult = {
        orderId: order.id,
        status: 'filled',
        executedQuantity: order.quantity,
        executedPrice: trade.price,
        fees: trade.quantity * trade.price * 0.001, // 0.1% fee
        timestamp: new Date(),
        trade
      }

      // Update order status
      order.status = 'filled'
      this.pendingOrders.set(order.id, order)

      // Store execution result
      this.executionResults.set(order.id, result)

      // Notify listeners
      this.executionListeners.forEach(listener => listener(result))

      console.log(`✅ Order ${order.id} executed: ${result.executedQuantity} ${order.symbol} @ ${result.executedPrice}`)

    } catch (error) {
      // Handle execution failure
      const result: OrderExecutionResult = {
        orderId: order.id,
        status: 'rejected',
        executedQuantity: 0,
        executedPrice: 0,
        fees: 0,
        timestamp: new Date(),
        reason: error instanceof Error ? error.message : 'Unknown error'
      }

      order.status = 'rejected'
      this.pendingOrders.set(order.id, order)
      this.executionResults.set(order.id, result)

      console.error(`❌ Order ${order.id} rejected:`, error)
    }
  }

  private async processSignal(signalData: TradingSignal): Promise<void> {
    // Process trading signals - could trigger automatic orders
    console.log(`📊 Processing signal: ${signalData.signal} ${signalData.symbol} (${signalData.confidence})`)

    // Auto-trade logic could go here
    if (signalData.confidence > 0.8 && signalData.strength > 0.7) {
      // High confidence signal - could trigger automated order
      console.log(`🎯 High confidence signal detected for ${signalData.symbol}`)
    }
  }

  private async handleExecution(executionData: any): Promise<void> {
    console.log('📝 Handling execution data:', executionData)
  }

  private async handleSettlement(settlementData: any): Promise<void> {
    console.log('💰 Handling settlement data:', settlementData)
  }

  private async processRiskAlert(message: any): Promise<void> {
    const alert = message.data as RiskAlert
    
    // Handle risk alert based on severity and action
    switch (alert.action) {
      case 'stop_trading':
        console.log(`🛑 STOPPING TRADING due to ${alert.type} alert`)
        // Could cancel all pending orders
        break
      case 'reduce_position':
        console.log(`📉 REDUCING POSITION due to ${alert.type} alert`)
        // Could trigger position reduction orders
        break
      case 'force_close':
        console.log(`❌ FORCE CLOSING POSITIONS due to ${alert.type} alert`)
        // Could trigger emergency close orders
        break
      default:
        console.log(`⚠️ Risk alert: ${alert.message}`)
    }
  }

  private async processMarketData(marketData: any): Promise<void> {
    // Process real-time market data updates
    console.log(`📈 Market data update: ${marketData.symbol} @ ${marketData.price}`)
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.queueService.cleanup()
    
    this.orderListeners.length = 0
    this.executionListeners.length = 0
    this.signalListeners.length = 0
    this.alertListeners.length = 0
    
    console.log('✅ Queue Trading Service cleaned up')
  }
}

// Singleton instance
let queueTradingService: QueueTradingService | null = null

export function getQueueTradingService(): QueueTradingService {
  if (!queueTradingService) {
    queueTradingService = new QueueTradingService()
  }
  return queueTradingService
}

export default QueueTradingService