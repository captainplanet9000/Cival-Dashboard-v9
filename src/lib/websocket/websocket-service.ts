'use client'

import { io, Socket } from 'socket.io-client'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

export interface MarketDataUpdate {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: string
}

export interface FarmUpdate {
  farmId: string
  status: 'active' | 'paused' | 'stopped'
  performance: {
    totalValue: number
    totalPnL: number
    winRate: number
    activeAgents: number
  }
  timestamp: string
}

export interface GoalUpdate {
  goalId: string
  progress: number
  status: 'active' | 'completed' | 'failed' | 'paused'
  currentValue: number
  timestamp: string
}

export interface TradingSignal {
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  price: number
  confidence: number
  strategy: string
  timestamp: string
}

export interface AgentUpdate {
  agentId: string
  status: 'online' | 'offline' | 'trading' | 'idle'
  performance: {
    totalTrades: number
    winRate: number
    pnl: number
  }
  timestamp: string
}

class WebSocketService {
  private static instance: WebSocketService
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private subscribers = new Map<string, Set<(data: any) => void>>()
  private messageQueue: WebSocketMessage[] = []

  private constructor() {
    this.connect()
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  private connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
      
      console.log('🔌 Connecting to WebSocket server:', wsUrl)
      
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        autoConnect: true
      })

      this.setupEventHandlers()
    } catch (error) {
      console.error('❌ WebSocket connection error:', error)
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Send queued messages
      this.flushMessageQueue()
      
      // Subscribe to all data streams
      this.subscribeToStreams()
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      this.isConnected = false
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.scheduleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      this.isConnected = false
      this.scheduleReconnect()
    })

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error)
    })

    // Market data updates
    this.socket.on('market_data', (data: MarketDataUpdate) => {
      this.notifySubscribers('market_data', data)
    })

    // Farm updates
    this.socket.on('farm_update', (data: FarmUpdate) => {
      this.notifySubscribers('farm_update', data)
    })

    // Goal updates
    this.socket.on('goal_update', (data: GoalUpdate) => {
      this.notifySubscribers('goal_update', data)
    })

    // Trading signals
    this.socket.on('trading_signal', (data: TradingSignal) => {
      this.notifySubscribers('trading_signal', data)
    })

    // Agent updates
    this.socket.on('agent_update', (data: AgentUpdate) => {
      this.notifySubscribers('agent_update', data)
    })

    // Portfolio updates
    this.socket.on('portfolio_update', (data: any) => {
      this.notifySubscribers('portfolio_update', data)
    })

    // System notifications
    this.socket.on('notification', (data: any) => {
      this.notifySubscribers('notification', data)
    })

    // Risk alerts
    this.socket.on('risk_alert', (data: any) => {
      this.notifySubscribers('risk_alert', data)
    })
  }

  private subscribeToStreams() {
    if (!this.isConnected || !this.socket) return

    // Subscribe to market data
    this.socket.emit('subscribe', { 
      streams: [
        'market_data',
        'farm_updates', 
        'goal_updates',
        'trading_signals',
        'agent_updates',
        'portfolio_updates',
        'notifications',
        'risk_alerts'
      ]
    })
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  private notifySubscribers(event: string, data: any) {
    const eventSubscribers = this.subscribers.get(event)
    if (eventSubscribers) {
      eventSubscribers.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket subscriber for ${event}:`, error)
        }
      })
    }
  }

  // Public methods
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set())
    }
    
    this.subscribers.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event)
      if (eventSubscribers) {
        eventSubscribers.delete(callback)
        if (eventSubscribers.size === 0) {
          this.subscribers.delete(event)
        }
      }
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (!this.isConnected || !this.socket) {
      // Queue message for later delivery
      this.messageQueue.push(message)
      return false
    }

    try {
      this.socket.emit('message', message)
      return true
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error)
      return false
    }
  }

  // Specific message senders
  sendFarmUpdate(farmId: string, updates: any) {
    this.sendMessage({
      type: 'farm_update',
      data: { farmId, ...updates },
      timestamp: new Date().toISOString()
    })
  }

  sendGoalUpdate(goalId: string, updates: any) {
    this.sendMessage({
      type: 'goal_update', 
      data: { goalId, ...updates },
      timestamp: new Date().toISOString()
    })
  }

  sendTradingOrder(orderData: any) {
    this.sendMessage({
      type: 'trading_order',
      data: orderData,
      timestamp: new Date().toISOString()
    })
  }

  requestMarketData(symbols: string[]) {
    this.sendMessage({
      type: 'request_market_data',
      data: { symbols },
      timestamp: new Date().toISOString()
    })
  }

  // Connection status
  isConnectedToServer(): boolean {
    return this.isConnected
  }

  getConnectionInfo() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      subscribedEvents: Array.from(this.subscribers.keys()),
      socketId: this.socket?.id
    }
  }

  // Manual reconnection
  reconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
    this.reconnectAttempts = 0
    this.connect()
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.subscribers.clear()
    this.messageQueue = []
  }
}

// React hook for WebSocket functionality
export function useWebSocket() {
  const service = WebSocketService.getInstance()
  
  return {
    subscribe: service.subscribe.bind(service),
    sendMessage: service.sendMessage.bind(service),
    sendFarmUpdate: service.sendFarmUpdate.bind(service),
    sendGoalUpdate: service.sendGoalUpdate.bind(service),
    sendTradingOrder: service.sendTradingOrder.bind(service),
    requestMarketData: service.requestMarketData.bind(service),
    isConnected: service.isConnectedToServer(),
    connectionInfo: service.getConnectionInfo(),
    reconnect: service.reconnect.bind(service),
    disconnect: service.disconnect.bind(service)
  }
}

export const webSocketService = WebSocketService.getInstance()
export default webSocketService