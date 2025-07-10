/**
 * Enhanced WebSocket Client for Real-time Trading Platform
 * Provides robust WebSocket connection with automatic reconnection,
 * event handling, and integration with the enhanced database system
 */

import { EventEmitter } from 'events'

export interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  debug?: boolean
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export class EnhancedWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private connectionState: ConnectionState = 'disconnected'
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map()

  constructor(config: WebSocketConfig) {
    super()
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || false
    }
  }

  // Connection Management
  connect(): void {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      this.log('Already connected or connecting')
      return
    }

    this.connectionState = 'connecting'
    this.emit('connecting')

    try {
      this.ws = new WebSocket(this.config.url)
      this.setupEventHandlers()
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  disconnect(): void {
    this.connectionState = 'disconnected'
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.emit('disconnected')
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      this.emit('connected')
      this.startHeartbeat()
      this.flushMessageQueue()
      this.log('WebSocket connected')
    }

    this.ws.onclose = (event) => {
      this.connectionState = 'disconnected'
      this.stopHeartbeat()
      this.emit('disconnected', event)
      this.log(`WebSocket disconnected: ${event.code} - ${event.reason}`)
      
      if (event.code !== 1000) { // Abnormal closure
        this.attemptReconnect()
      }
    }

    this.ws.onerror = (error) => {
      this.handleError(new Error('WebSocket error'))
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        this.handleMessage(message)
      } catch (error) {
        this.log('Failed to parse message:', event.data)
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    this.emit('message', message)
    
    // Handle specific message types
    switch (message.type) {
      case 'pong':
        this.log('Heartbeat acknowledged')
        break
        
      case 'system.event':
        this.handleSystemEvent(message.data)
        break
        
      case 'notification':
        this.handleNotification(message.data)
        break
        
      case 'market.update':
        this.handleMarketUpdate(message.data)
        break
        
      case 'portfolio.update':
        this.handlePortfolioUpdate(message.data)
        break
        
      case 'agent.update':
        this.handleAgentUpdate(message.data)
        break
        
      case 'trade.executed':
        this.handleTradeExecuted(message.data)
        break
        
      case 'risk.alert':
        this.handleRiskAlert(message.data)
        break
        
      default:
        // Emit custom event for unhandled message types
        this.emit(`custom:${message.type}`, message.data)
    }

    // Notify type-specific subscribers
    const subscribers = this.subscriptions.get(message.type)
    if (subscribers) {
      subscribers.forEach(callback => callback(message.data))
    }
  }

  // Message Handlers
  private handleSystemEvent(data: any): void {
    this.emit('system:event', data)
  }

  private handleNotification(data: any): void {
    this.emit('notification', data)
  }

  private handleMarketUpdate(data: any): void {
    this.emit('market:update', data)
  }

  private handlePortfolioUpdate(data: any): void {
    this.emit('portfolio:update', data)
  }

  private handleAgentUpdate(data: any): void {
    this.emit('agent:update', data)
  }

  private handleTradeExecuted(data: any): void {
    this.emit('trade:executed', data)
  }

  private handleRiskAlert(data: any): void {
    this.emit('risk:alert', data)
  }

  // Send Methods
  send(message: WebSocketMessage): void {
    if (this.connectionState !== 'connected' || !this.ws) {
      this.messageQueue.push(message)
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
      this.emit('sent', message)
    } catch (error) {
      this.handleError(error as Error)
      this.messageQueue.push(message)
    }
  }

  sendEvent(type: string, data: any): void {
    this.send({
      type,
      data,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId()
    })
  }

  // Subscription Management
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set())
    }
    
    this.subscriptions.get(type)!.add(callback)
    
    // Send subscription message to server
    this.sendEvent('subscribe', { types: [type] })
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(type)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.subscriptions.delete(type)
          this.sendEvent('unsubscribe', { types: [type] })
        }
      }
    }
  }

  // Request-Response Pattern
  async request<T = any>(type: string, data: any, timeout = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.generateMessageId()
      const timer = setTimeout(() => {
        this.off(`response:${id}`, handleResponse)
        reject(new Error(`Request timeout: ${type}`))
      }, timeout)

      const handleResponse = (response: any) => {
        clearTimeout(timer)
        if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response.data)
        }
      }

      this.once(`response:${id}`, handleResponse)
      this.send({ type, data, timestamp: new Date().toISOString(), id })
    })
  }

  // Heartbeat Management
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.sendEvent('ping', { timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // Reconnection Logic
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      60000 // Max 60 seconds
    )

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      if (this.connectionState !== 'connected') {
        this.connect()
      }
    }, delay)
  }

  // Queue Management
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  // Utilities
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private handleError(error: Error): void {
    this.connectionState = 'error'
    this.emit('error', error)
    this.log('WebSocket error:', error.message)
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args)
    }
  }

  // Status Methods
  isConnected(): boolean {
    return this.connectionState === 'connected'
  }

  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  getQueueSize(): number {
    return this.messageQueue.length
  }

  // Static factory method
  static create(url: string, options?: Partial<WebSocketConfig>): EnhancedWebSocketClient {
    return new EnhancedWebSocketClient({
      url,
      ...options
    })
  }
}

// Export singleton instance for global use
let wsClient: EnhancedWebSocketClient | null = null

export function getWebSocketClient(): EnhancedWebSocketClient {
  if (!wsClient) {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/agui'
      wsClient = EnhancedWebSocketClient.create(wsUrl, {
        debug: process.env.NODE_ENV === 'development'
      })
    } catch (error) {
      console.error('Failed to create WebSocket client:', error)
      // Create a mock client that doesn't cause initialization errors
      wsClient = {
        connect: () => {},
        disconnect: () => {},
        send: () => {},
        sendEvent: () => {},
        subscribe: () => () => {},
        request: () => Promise.resolve({}),
        on: () => {},
        off: () => {},
        emit: () => {},
        isConnected: () => false,
        getConnectionState: () => 'disconnected',
        getQueueSize: () => 0
      } as any
    }
  }
  return wsClient
}

// React Hook for WebSocket
export function useWebSocket() {
  const client = getWebSocketClient()
  
  return {
    client,
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    send: (type: string, data: any) => client.sendEvent(type, data),
    subscribe: (type: string, callback: (data: any) => void) => client.subscribe(type, callback),
    request: <T = any>(type: string, data: any) => client.request<T>(type, data),
    isConnected: () => client.isConnected(),
    connectionState: client.getConnectionState()
  }
}