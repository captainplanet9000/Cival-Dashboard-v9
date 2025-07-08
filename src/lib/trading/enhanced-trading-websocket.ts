/**
 * Enhanced High-Performance Trading WebSocket Client
 * Optimized for sub-second real-time trading data with advanced features
 */

import { getWebSocketClient, TradingWebSocketClient } from '@/lib/realtime/websocket'

export interface OrderBookUpdate {
  symbol: string
  exchange: string
  bids: [number, number][] // [price, quantity]
  asks: [number, number][]
  timestamp: number
  sequence: number
  latency: number // Client-side latency measurement
}

export interface TickerUpdate {
  symbol: string
  exchange: string
  price: number
  bid: number
  ask: number
  volume24h: number
  change24h: number
  timestamp: number
  sequence: number
  latency: number
}

export interface TradeUpdate {
  id: string
  symbol: string
  exchange: string
  price: number
  quantity: number
  side: 'buy' | 'sell'
  timestamp: number
  sequence: number
}

export interface OrderUpdate {
  orderId: string
  clientOrderId?: string
  symbol: string
  exchange: string
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired'
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop-limit'
  quantity: number
  price?: number
  filledQuantity: number
  averagePrice?: number
  remainingQuantity: number
  fees?: number
  timestamp: number
  updateTime: number
  isLive: boolean
}

export interface PositionUpdate {
  symbol: string
  exchange: string
  side: 'long' | 'short' | 'flat'
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  realizedPnl: number
  leverage: number
  margin: number
  timestamp: number
  isLive: boolean
}

export interface BalanceUpdate {
  exchange: string
  asset: string
  free: number
  locked: number
  total: number
  timestamp: number
  isLive: boolean
}

export interface ExchangeHealthUpdate {
  exchange: string
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  latency: number
  websocketConnected: boolean
  orderBookHealth: 'healthy' | 'stale' | 'disconnected'
  apiLimitsRemaining: number
  lastUpdate: number
  timestamp: number
}

export interface ArbitrageOpportunity {
  id: string
  symbol: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  spread: number
  spreadPercent: number
  estimatedProfit: number
  maxQuantity: number
  confidence: number
  timestamp: number
  expiresAt: number
}

export interface RiskEvent {
  id: string
  type: 'position_limit' | 'loss_limit' | 'exposure_limit' | 'correlation_limit' | 'liquidity_warning'
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  message: string
  symbol?: string
  exchange?: string
  currentValue: number
  threshold: number
  suggestedAction: string
  timestamp: number
  acknowledged: boolean
}

// Performance metrics for monitoring
export interface WebSocketPerformanceMetrics {
  messagesPerSecond: number
  averageLatency: number
  maxLatency: number
  minLatency: number
  reconnectCount: number
  uptime: number
  lastUpdate: number
}

export class EnhancedTradingWebSocket {
  private baseClient: TradingWebSocketClient
  private latencyTracker = new Map<string, number>()
  private messageQueue: any[] = []
  private processingQueue = false
  private performanceMetrics: WebSocketPerformanceMetrics = {
    messagesPerSecond: 0,
    averageLatency: 0,
    maxLatency: 0,
    minLatency: Infinity,
    reconnectCount: 0,
    uptime: 0,
    lastUpdate: Date.now()
  }
  private metricsUpdateInterval: NodeJS.Timeout | null = null
  private messageCount = 0
  private lastMetricsUpdate = Date.now()

  constructor() {
    this.baseClient = getWebSocketClient()
    this.setupEnhancedHandlers()
    this.startPerformanceMonitoring()
  }

  private setupEnhancedHandlers() {
    // Override the base URL for trading-specific endpoint
    this.baseClient['url'] = process.env.NEXT_PUBLIC_TRADING_WS_URL || 'ws://localhost:8000/ws/trading'

    // Enhanced message handling with latency tracking
    this.baseClient.on('connect', () => {
      console.log('Enhanced trading WebSocket connected')
      this.performanceMetrics.reconnectCount++
    })

    this.baseClient.on('disconnect', () => {
      console.log('Enhanced trading WebSocket disconnected')
    })

    // High-frequency market data handlers
    this.setupMarketDataHandlers()
    this.setupTradingHandlers()
    this.setupRiskHandlers()
  }

  private setupMarketDataHandlers() {
    // Order book updates (high frequency)
    this.baseClient.on('orderbook_update', (data: any) => {
      const latency = Date.now() - (data.serverTimestamp || 0)
      const update: OrderBookUpdate = {
        ...data,
        latency,
        timestamp: Date.now()
      }
      this.trackLatency('orderbook', latency)
      this.emit('orderbook_update', update)
    })

    // Ticker updates
    this.baseClient.on('ticker_update', (data: any) => {
      const latency = Date.now() - (data.serverTimestamp || 0)
      const update: TickerUpdate = {
        ...data,
        latency,
        timestamp: Date.now()
      }
      this.trackLatency('ticker', latency)
      this.emit('ticker_update', update)
    })

    // Trade stream
    this.baseClient.on('trade_update', (data: any) => {
      const update: TradeUpdate = {
        ...data,
        timestamp: Date.now()
      }
      this.emit('trade_update', update)
    })
  }

  private setupTradingHandlers() {
    // Order updates (critical for live trading)
    this.baseClient.on('order_update', (data: any) => {
      const update: OrderUpdate = {
        ...data,
        updateTime: Date.now(),
        isLive: data.isLive || false
      }
      this.emit('order_update', update)
    })

    // Position updates
    this.baseClient.on('position_update', (data: any) => {
      const update: PositionUpdate = {
        ...data,
        timestamp: Date.now(),
        isLive: data.isLive || false
      }
      this.emit('position_update', update)
    })

    // Balance updates
    this.baseClient.on('balance_update', (data: any) => {
      const update: BalanceUpdate = {
        ...data,
        timestamp: Date.now(),
        isLive: data.isLive || false
      }
      this.emit('balance_update', update)
    })

    // Exchange health monitoring
    this.baseClient.on('exchange_health', (data: any) => {
      const update: ExchangeHealthUpdate = {
        ...data,
        timestamp: Date.now()
      }
      this.emit('exchange_health', update)
    })
  }

  private setupRiskHandlers() {
    // Arbitrage opportunities (time-sensitive)
    this.baseClient.on('arbitrage_opportunity', (data: any) => {
      const opportunity: ArbitrageOpportunity = {
        ...data,
        timestamp: Date.now()
      }
      this.emit('arbitrage_opportunity', opportunity)
    })

    // Risk events
    this.baseClient.on('risk_event', (data: any) => {
      const event: RiskEvent = {
        ...data,
        timestamp: Date.now(),
        acknowledged: false
      }
      this.emit('risk_event', event)
    })
  }

  private trackLatency(messageType: string, latency: number) {
    this.latencyTracker.set(`${messageType}_${Date.now()}`, latency)
    
    // Update performance metrics
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency + latency) / 2
    this.performanceMetrics.maxLatency = 
      Math.max(this.performanceMetrics.maxLatency, latency)
    this.performanceMetrics.minLatency = 
      Math.min(this.performanceMetrics.minLatency, latency)
  }

  private startPerformanceMonitoring() {
    this.metricsUpdateInterval = setInterval(() => {
      const now = Date.now()
      const timeDiff = (now - this.lastMetricsUpdate) / 1000 // seconds
      
      this.performanceMetrics.messagesPerSecond = this.messageCount / timeDiff
      this.performanceMetrics.uptime = now - this.performanceMetrics.lastUpdate
      this.performanceMetrics.lastUpdate = now
      
      // Reset counters
      this.messageCount = 0
      this.lastMetricsUpdate = now
      
      // Clean old latency data (keep last 1000 entries)
      if (this.latencyTracker.size > 1000) {
        const entries = Array.from(this.latencyTracker.entries())
        const recent = entries.slice(-1000)
        this.latencyTracker.clear()
        recent.forEach(([key, value]) => this.latencyTracker.set(key, value))
      }
      
      // Emit performance update
      this.emit('performance_metrics', this.performanceMetrics)
    }, 1000) // Update every second
  }

  // High-performance subscription methods
  subscribeOrderBook(symbol: string, exchange: string = 'all') {
    const channel = exchange === 'all' ? `orderbook:${symbol}` : `orderbook:${symbol}:${exchange}`
    this.baseClient.subscribe(channel)
  }

  subscribeTicker(symbol: string, exchange: string = 'all') {
    const channel = exchange === 'all' ? `ticker:${symbol}` : `ticker:${symbol}:${exchange}`
    this.baseClient.subscribe(channel)
  }

  subscribeTrades(symbol: string, exchange: string = 'all') {
    const channel = exchange === 'all' ? `trades:${symbol}` : `trades:${symbol}:${exchange}`
    this.baseClient.subscribe(channel)
  }

  subscribeOrders(exchange: string = 'all') {
    const channel = exchange === 'all' ? 'orders' : `orders:${exchange}`
    this.baseClient.subscribe(channel)
  }

  subscribePositions(exchange: string = 'all') {
    const channel = exchange === 'all' ? 'positions' : `positions:${exchange}`
    this.baseClient.subscribe(channel)
  }

  subscribeBalances(exchange: string = 'all') {
    const channel = exchange === 'all' ? 'balances' : `balances:${exchange}`
    this.baseClient.subscribe(channel)
  }

  subscribeArbitrage(symbols?: string[]) {
    if (symbols) {
      symbols.forEach(symbol => this.baseClient.subscribe(`arbitrage:${symbol}`))
    } else {
      this.baseClient.subscribe('arbitrage')
    }
  }

  subscribeRiskEvents() {
    this.baseClient.subscribe('risk_events')
  }

  subscribeExchangeHealth() {
    this.baseClient.subscribe('exchange_health')
  }

  // Batch subscription for efficiency
  subscribeToTradingData(config: {
    symbols: string[]
    exchanges?: string[]
    includeOrderBook?: boolean
    includeTicker?: boolean
    includeTrades?: boolean
    includeOrders?: boolean
    includePositions?: boolean
    includeBalances?: boolean
    includeArbitrage?: boolean
    includeRiskEvents?: boolean
  }) {
    const { symbols, exchanges = ['all'] } = config

    if (config.includeOrderBook) {
      symbols.forEach(symbol => {
        exchanges.forEach(exchange => this.subscribeOrderBook(symbol, exchange))
      })
    }

    if (config.includeTicker) {
      symbols.forEach(symbol => {
        exchanges.forEach(exchange => this.subscribeTicker(symbol, exchange))
      })
    }

    if (config.includeTrades) {
      symbols.forEach(symbol => {
        exchanges.forEach(exchange => this.subscribeTrades(symbol, exchange))
      })
    }

    if (config.includeOrders) {
      exchanges.forEach(exchange => this.subscribeOrders(exchange))
    }

    if (config.includePositions) {
      exchanges.forEach(exchange => this.subscribePositions(exchange))
    }

    if (config.includeBalances) {
      exchanges.forEach(exchange => this.subscribeBalances(exchange))
    }

    if (config.includeArbitrage) {
      this.subscribeArbitrage(symbols)
    }

    if (config.includeRiskEvents) {
      this.subscribeRiskEvents()
    }

    // Always subscribe to exchange health
    this.subscribeExchangeHealth()
  }

  // Event delegation
  private emit(event: string, data: any) {
    this.messageCount++
    
    // Add to processing queue for high-frequency events
    if (['orderbook_update', 'ticker_update'].includes(event)) {
      this.messageQueue.push({ event, data })
      this.processMessageQueue()
    } else {
      // Process immediately for critical events
      this.baseClient['emit'](event, data)
    }
  }

  private async processMessageQueue() {
    if (this.processingQueue || this.messageQueue.length === 0) return
    
    this.processingQueue = true
    
    // Process messages in batches to prevent blocking
    const batchSize = 10
    while (this.messageQueue.length > 0) {
      const batch = this.messageQueue.splice(0, batchSize)
      
      batch.forEach(({ event, data }) => {
        this.baseClient['emit'](event, data)
      })
      
      // Yield control to prevent blocking
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
    
    this.processingQueue = false
  }

  // Public interface
  connect() {
    return this.baseClient.connect()
  }

  disconnect() {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval)
    }
    this.baseClient.disconnect()
  }

  get connected() {
    return this.baseClient.connected
  }

  get performanceStats() {
    return { ...this.performanceMetrics }
  }

  on(event: string, handler: (data: any) => void) {
    this.baseClient.on(event, handler)
  }

  off(event: string, handler: (data: any) => void) {
    this.baseClient.off(event, handler)
  }
}

// Singleton for trading WebSocket
let tradingWS: EnhancedTradingWebSocket | null = null

export function getTradingWebSocket(): EnhancedTradingWebSocket {
  if (!tradingWS) {
    tradingWS = new EnhancedTradingWebSocket()
  }
  return tradingWS
}

export function disconnectTradingWebSocket() {
  if (tradingWS) {
    tradingWS.disconnect()
    tradingWS = null
  }
}

// React hooks for enhanced trading data
import { useEffect, useState } from 'react'

export function useEnhancedTradingWebSocket() {
  const [client] = useState(() => getTradingWebSocket())
  const [isConnected, setIsConnected] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<WebSocketPerformanceMetrics | null>(null)

  useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handlePerformance = (metrics: WebSocketPerformanceMetrics) => setPerformanceMetrics(metrics)

    client.on('connect', handleConnect)
    client.on('disconnect', handleDisconnect)
    client.on('performance_metrics', handlePerformance)

    // Auto-connect
    if (!client.connected) {
      client.connect()
    } else {
      setIsConnected(true)
    }

    return () => {
      client.off('connect', handleConnect)
      client.off('disconnect', handleDisconnect)
      client.off('performance_metrics', handlePerformance)
    }
  }, [client])

  return {
    client,
    isConnected,
    performanceMetrics,
    connect: () => client.connect(),
    disconnect: () => client.disconnect()
  }
}

export function useOrderBookStream(symbol: string, exchange: string = 'all') {
  const { client, isConnected } = useEnhancedTradingWebSocket()
  const [orderBook, setOrderBook] = useState<OrderBookUpdate | null>(null)

  useEffect(() => {
    if (!isConnected) return

    const handleUpdate = (data: OrderBookUpdate) => {
      if (data.symbol === symbol && (exchange === 'all' || data.exchange === exchange)) {
        setOrderBook(data)
      }
    }

    client.on('orderbook_update', handleUpdate)
    client.subscribeOrderBook(symbol, exchange)

    return () => {
      client.off('orderbook_update', handleUpdate)
    }
  }, [client, isConnected, symbol, exchange])

  return orderBook
}

export function useTickerStream(symbols: string[]) {
  const { client, isConnected } = useEnhancedTradingWebSocket()
  const [tickers, setTickers] = useState<Map<string, TickerUpdate>>(new Map())

  useEffect(() => {
    if (!isConnected) return

    const handleUpdate = (data: TickerUpdate) => {
      if (symbols.includes(data.symbol)) {
        setTickers(prev => new Map(prev.set(data.symbol, data)))
      }
    }

    client.on('ticker_update', handleUpdate)
    symbols.forEach(symbol => client.subscribeTicker(symbol))

    return () => {
      client.off('ticker_update', handleUpdate)
    }
  }, [client, isConnected, symbols])

  return tickers
}

export function useLiveOrders() {
  const { client, isConnected } = useEnhancedTradingWebSocket()
  const [orders, setOrders] = useState<OrderUpdate[]>([])

  useEffect(() => {
    if (!isConnected) return

    const handleUpdate = (data: OrderUpdate) => {
      setOrders(prev => {
        const index = prev.findIndex(o => o.orderId === data.orderId)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        } else {
          return [data, ...prev.slice(0, 99)] // Keep last 100 orders
        }
      })
    }

    client.on('order_update', handleUpdate)
    client.subscribeOrders()

    return () => {
      client.off('order_update', handleUpdate)
    }
  }, [client, isConnected])

  return orders
}

export function useLivePositions() {
  const { client, isConnected } = useEnhancedTradingWebSocket()
  const [positions, setPositions] = useState<PositionUpdate[]>([])

  useEffect(() => {
    if (!isConnected) return

    const handleUpdate = (data: PositionUpdate) => {
      setPositions(prev => {
        const index = prev.findIndex(p => p.symbol === data.symbol && p.exchange === data.exchange)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        } else {
          return [data, ...prev]
        }
      })
    }

    client.on('position_update', handleUpdate)
    client.subscribePositions()

    return () => {
      client.off('position_update', handleUpdate)
    }
  }, [client, isConnected])

  return positions
}

export function useArbitrageOpportunities() {
  const { client, isConnected } = useEnhancedTradingWebSocket()
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])

  useEffect(() => {
    if (!isConnected) return

    const handleOpportunity = (data: ArbitrageOpportunity) => {
      setOpportunities(prev => {
        // Remove expired opportunities and add new one
        const now = Date.now()
        const active = prev.filter(op => op.expiresAt > now)
        return [data, ...active.slice(0, 19)] // Keep 20 most recent
      })
    }

    client.on('arbitrage_opportunity', handleOpportunity)
    client.subscribeArbitrage()

    return () => {
      client.off('arbitrage_opportunity', handleOpportunity)
    }
  }, [client, isConnected])

  return opportunities
}

export function useRiskEvents() {
  const { client, isConnected } = useEnhancedTradingWebSocket()
  const [events, setEvents] = useState<RiskEvent[]>([])

  useEffect(() => {
    if (!isConnected) return

    const handleEvent = (data: RiskEvent) => {
      setEvents(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 events
    }

    client.on('risk_event', handleEvent)
    client.subscribeRiskEvents()

    return () => {
      client.off('risk_event', handleEvent)
    }
  }, [client, isConnected])

  return events
}