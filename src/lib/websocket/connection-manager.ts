import { EventEmitter } from 'events'
import {
  WebSocketMessage,
  WebSocketSubscription,
  MarketData,
  OrderBookData,
  PaperTradingEvent,
  EventType
} from '@/types/paper-trading.types'

export class WebSocketConnectionManager extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private subscriptions = new Map<string, WebSocketSubscription>()
  private isConnecting = false
  private connectionUrl: string
  private heartbeatInterval: NodeJS.Timeout | null = null
  private lastPong = Date.now()

  constructor(url: string = 'ws://localhost:8000/ws') {
    super()
    this.connectionUrl = url
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    
    try {
      this.ws = new WebSocket(this.connectionUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      // Wait for connection to open
      await new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket not initialized'))
          return
        }

        const openHandler = () => {
          this.ws?.removeEventListener('open', openHandler)
          this.ws?.removeEventListener('error', errorHandler)
          resolve(void 0)
        }

        const errorHandler = (event: Event) => {
          this.ws?.removeEventListener('open', openHandler)
          this.ws?.removeEventListener('error', errorHandler)
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.addEventListener('open', openHandler)
        this.ws.addEventListener('error', errorHandler)
      })

    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.subscriptions.clear()
    this.emit('disconnected')
  }

  private handleOpen(): void {
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.lastPong = Date.now()

    // Start heartbeat
    this.startHeartbeat()

    // Resubscribe to all channels
    this.resubscribeAll()

    this.emit('connected')
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle heartbeat response
      if (message.type === 'pong') {
        this.lastPong = Date.now()
        return
      }

      // Route message to appropriate handler
      this.routeMessage(message)
      
      this.emit('message', message)
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent): void {
    this.isConnecting = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    this.emit('disconnected', event.code, event.reason)

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  private handleError(event: Event): void {
    this.emit('error', event)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Check if we received a pong recently
        if (Date.now() - this.lastPong > 60000) { // 60 seconds timeout
          console.warn('WebSocket heartbeat timeout')
          this.ws.close(1000, 'Heartbeat timeout')
          return
        }

        // Send ping
        this.send({
          type: 'ping',
          channel: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: new Date()
        })
      }
    }, 30000) // Send ping every 30 seconds
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    this.emit('reconnecting', this.reconnectAttempts, delay)

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        } else {
          this.emit('reconnect_failed')
        }
      })
    }, delay)
  }

  private resubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      this.sendSubscription(subscription)
    }
  }

  private routeMessage(message: WebSocketMessage): void {
    switch (message.channel) {
      case 'market_data':
        this.handleMarketDataMessage(message)
        break
      case 'order_book':
        this.handleOrderBookMessage(message)
        break
      case 'paper_trading_events':
        this.handlePaperTradingEventMessage(message)
        break
      case 'agent_status':
        this.handleAgentStatusMessage(message)
        break
      case 'portfolio_updates':
        this.handlePortfolioUpdateMessage(message)
        break
      default:
        this.emit('unknown_message', message)
    }
  }

  private handleMarketDataMessage(message: WebSocketMessage): void {
    const marketData: MarketData = message.data
    this.emit('market_data', marketData)
  }

  private handleOrderBookMessage(message: WebSocketMessage): void {
    const orderBook: OrderBookData = message.data
    this.emit('order_book', orderBook)
  }

  private handlePaperTradingEventMessage(message: WebSocketMessage): void {
    const event: PaperTradingEvent = message.data
    this.emit('paper_trading_event', event)
  }

  private handleAgentStatusMessage(message: WebSocketMessage): void {
    this.emit('agent_status', message.data)
  }

  private handlePortfolioUpdateMessage(message: WebSocketMessage): void {
    this.emit('portfolio_update', message.data)
  }

  // Subscription management
  subscribe(subscription: WebSocketSubscription): void {
    const key = this.getSubscriptionKey(subscription)
    this.subscriptions.set(key, subscription)
    
    if (this.isConnected()) {
      this.sendSubscription(subscription)
    }
  }

  unsubscribe(subscription: WebSocketSubscription): void {
    const key = this.getSubscriptionKey(subscription)
    this.subscriptions.delete(key)

    if (this.isConnected()) {
      this.send({
        type: 'unsubscribe',
        channel: subscription.channel,
        data: subscription,
        timestamp: new Date()
      })
    }
  }

  // Market data subscriptions
  subscribeToMarketData(symbols: string[]): void {
    this.subscribe({
      channel: 'market_data',
      symbols,
      eventTypes: [EventType.PERFORMANCE_UPDATE]
    })
  }

  subscribeToOrderBook(symbols: string[]): void {
    this.subscribe({
      channel: 'order_book',
      symbols,
      eventTypes: [EventType.ORDER_FILLED, EventType.ORDER_PLACED]
    })
  }

  // Agent subscriptions
  subscribeToAgentStatus(agentIds: string[]): void {
    this.subscribe({
      channel: 'agent_status',
      agentIds,
      eventTypes: [
        EventType.AGENT_CREATED,
        EventType.AGENT_STOPPED,
        EventType.GRADUATION_ELIGIBLE
      ]
    })
  }

  // Portfolio subscriptions
  subscribeToPortfolioUpdates(agentIds: string[]): void {
    this.subscribe({
      channel: 'portfolio_updates',
      agentIds,
      eventTypes: [
        EventType.POSITION_OPENED,
        EventType.POSITION_CLOSED,
        EventType.PERFORMANCE_UPDATE
      ]
    })
  }

  // Paper trading events
  subscribeToPaperTradingEvents(agentIds?: string[]): void {
    this.subscribe({
      channel: 'paper_trading_events',
      agentIds,
      eventTypes: [
        EventType.ORDER_PLACED,
        EventType.ORDER_FILLED,
        EventType.ORDER_CANCELLED,
        EventType.RISK_LIMIT_BREACHED,
        EventType.GOAL_ACHIEVED,
        EventType.GRADUATION_ELIGIBLE
      ]
    })
  }

  private sendSubscription(subscription: WebSocketSubscription): void {
    this.send({
      type: 'subscribe',
      channel: subscription.channel,
      data: subscription,
      timestamp: new Date()
    })
  }

  private getSubscriptionKey(subscription: WebSocketSubscription): string {
    return `${subscription.channel}:${subscription.symbols?.join(',') || ''}:${subscription.agentIds?.join(',') || ''}`
  }

  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'unknown'
    }
  }

  getSubscriptions(): WebSocketSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  // Simulation mode for development
  startSimulation(): void {
    if (this.isConnected()) {
      console.warn('Cannot start simulation while connected to real WebSocket')
      return
    }

    this.startMarketDataSimulation()
    this.startOrderBookSimulation()
    this.startEventSimulation()
  }

  private startMarketDataSimulation(): void {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD']
    const prices: Record<string, number> = {
      'BTC/USD': 45000,
      'ETH/USD': 2500,
      'SOL/USD': 100,
      'AVAX/USD': 35
    }

    setInterval(() => {
      symbols.forEach(symbol => {
        const currentPrice = prices[symbol]
        const change = (Math.random() - 0.5) * currentPrice * 0.02 // ±2% change
        const newPrice = Math.max(0.01, currentPrice + change)
        prices[symbol] = newPrice

        const marketData: MarketData = {
          symbol,
          price: newPrice,
          bid: newPrice * 0.999,
          ask: newPrice * 1.001,
          volume: Math.random() * 1000000,
          change24h: change,
          changePercent24h: (change / currentPrice) * 100,
          high24h: newPrice * 1.05,
          low24h: newPrice * 0.95,
          marketCap: newPrice * 21000000, // Simplified
          timestamp: new Date()
        }

        this.emit('market_data', marketData)
      })
    }, 1000) // Update every second
  }

  private startOrderBookSimulation(): void {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD']
    
    setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = 45000 // Simplified
        
        const orderBook: OrderBookData = {
          symbol,
          bids: Array.from({ length: 20 }, (_, i) => ({
            price: basePrice - (i + 1) * 10,
            quantity: Math.random() * 5 + 0.1,
            orders: Math.floor(Math.random() * 10) + 1
          })),
          asks: Array.from({ length: 20 }, (_, i) => ({
            price: basePrice + (i + 1) * 10,
            quantity: Math.random() * 5 + 0.1,
            orders: Math.floor(Math.random() * 10) + 1
          })),
          timestamp: new Date()
        }

        this.emit('order_book', orderBook)
      })
    }, 2000) // Update every 2 seconds
  }

  private startEventSimulation(): void {
    const eventTypes = [
      EventType.ORDER_PLACED,
      EventType.ORDER_FILLED,
      EventType.POSITION_OPENED,
      EventType.PERFORMANCE_UPDATE
    ]

    setInterval(() => {
      const randomEvent: PaperTradingEvent = {
        id: `sim_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        agentId: `agent_${Math.floor(Math.random() * 5) + 1}`,
        timestamp: new Date(),
        data: {
          message: 'Simulated event',
          value: Math.random() * 1000
        },
        processed: false
      }

      this.emit('paper_trading_event', randomEvent)
    }, 5000) // Send event every 5 seconds
  }
}

// Singleton instance
export const wsManager = new WebSocketConnectionManager()

// React hook for WebSocket connection
export function useWebSocket() {
  const [isConnected, setIsConnected] = React.useState(wsManager.isConnected())
  const [lastMessage, setLastMessage] = React.useState<WebSocketMessage | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handleMessage = (message: WebSocketMessage) => setLastMessage(message)
    const handleError = (error: Event) => setError('Connection error')

    wsManager.on('connected', handleConnect)
    wsManager.on('disconnected', handleDisconnect)
    wsManager.on('message', handleMessage)
    wsManager.on('error', handleError)

    // Try to connect if not already connected
    if (!wsManager.isConnected()) {
      wsManager.connect().catch(err => {
        console.warn('WebSocket connection failed, starting simulation mode')
        wsManager.startSimulation()
      })
    }

    return () => {
      wsManager.off('connected', handleConnect)
      wsManager.off('disconnected', handleDisconnect)
      wsManager.off('message', handleMessage)
      wsManager.off('error', handleError)
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    error,
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    subscribe: (subscription: WebSocketSubscription) => wsManager.subscribe(subscription),
    unsubscribe: (subscription: WebSocketSubscription) => wsManager.unsubscribe(subscription)
  }
}

// Import React for the hook
import React from 'react'