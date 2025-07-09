/**
 * AG-UI Protocol v2 - Production Implementation
 * Real-time WebSocket communication for AI agent coordination
 */

export interface TradingEvents {
  'portfolio.value_updated': { total_value: number; change_24h: number; change_percentage: number }
  'trade.order_placed': { symbol: string; side: string; order_id: string; quantity?: number; price?: number }
  'trade.order_filled': { symbol: string; side: string; quantity: number; fill_price: number; order_id: string; fees?: number; exchange: string }
  'trade.order_cancelled': { order_id: string; reason?: string }
  'trade.signal_generated': { symbol: string; action: string; confidence: number; timestamp?: number; price?: number; strategy?: string }
  'trade.position_update': { position_id: string; symbol: string; current_value: number; unrealized_pnl: number }
  'trade.executed': { symbol: string; action: string; quantity: number; price: number; timestamp?: number }
  'market_data.price_update': { symbol: string; price: number; timestamp?: number; volume?: number }
}

export interface AgentEvents {
  'agent.started': { agent_id: string; agent_name?: string; timestamp?: number }
  'agent.stopped': { agent_id: string; reason: string; timestamp?: number }
  'agent.decision_made': { agent_id: string; agent_name?: string; decision: string; action_taken?: boolean; timestamp?: number }
  'agent.communication': { from_agent: string; to_agent: string; message: string; timestamp?: number }
  'agent.consensus_reached': { decision_id: string; participants: string[]; agreement_level: number; decision?: string; reasoning?: string }
  'agent.performance_update': { agent_id: string; metrics: any; timestamp?: number }
  'conversation.create': { topic: string; participants: string[]; context: any; timestamp?: number }
  'conversation.send_message': { conversation_id: string; sender_id: string; content: string; timestamp?: number }
}

export interface SystemEvents {
  'system.notification': { type: string; message: string; level: string; timestamp?: number }
  'system.health_update': { health_score: number; services: Record<string, boolean>; timestamp?: number }
  'system.error': { error_id: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical'; timestamp?: number }
  'connection.established': { client_id: string; timestamp?: number }
  'connection.lost': { client_id: string; reason?: string; timestamp?: number }
  'connection.reconnected': { client_id: string; timestamp?: number }
}

export interface OrchestrationEvents {
  'orchestration.agent_assigned': { assignment_id: string; farm_id: string; agent_id: string; timestamp?: number }
  'orchestration.capital_reallocated': { reallocation_id: string; source_id: string; target_id: string; amount: number; timestamp?: number }
  'orchestration.performance_updated': { entity_id: string; entity_type: string; performance: number; timestamp?: number }
  'orchestration.farm_status_changed': { farm_id: string; status: string; timestamp?: number }
  'orchestration.goal_progress_updated': { goal_id: string; progress: number; timestamp?: number }
  'orchestration.event': { event_type: string; data: any; timestamp?: number }
}

export interface WalletEvents {
  'portfolio.risk_alert': { message: string; severity: 'low' | 'medium' | 'high' | 'critical'; value?: number; timestamp?: number }
  'portfolio.margin_warning': { utilization: number; threshold: number; timestamp?: number }
}

export type AllEvents = TradingEvents & AgentEvents & SystemEvents & OrchestrationEvents & WalletEvents
export type EventName = keyof AllEvents
export type EventData<T extends EventName> = AllEvents[T]

export interface AGUIMessage<T extends EventName = EventName> {
  id: string
  type: T
  data: EventData<T>
  timestamp: number
  source?: string
  target?: string
}

export interface EventSubscription {
  id: string
  eventType: EventName
  callback: (event: AGUIMessage) => void
  unsubscribe: () => void
}

export interface AGUIConnectionConfig {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  debug?: boolean
}

export class AGUIProtocolV2 {
  private websocket: WebSocket | null = null
  private subscriptions: Map<string, EventSubscription> = new Map()
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageQueue: AGUIMessage[] = []
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map()

  constructor(private config: AGUIConnectionConfig = {}) {
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || false
    }
  }

  private getWebSocketUrl(): string {
    if (typeof window !== 'undefined') {
      // Check for environment variable first
      const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_WS_URL
      if (envApiUrl) {
        const wsUrl = envApiUrl.replace(/^https?:/, envApiUrl.startsWith('https:') ? 'wss:' : 'ws:')
        return `${wsUrl}/ws/agui`
      }
      
      // Disable WebSocket connection if backend is not available (development mode)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AG-UI] Backend not configured, using mock mode')
        return '' // Return empty URL to disable connection
      }
      
      // Fallback to localhost backend
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//localhost:8000/ws/agui`
    }
    return 'ws://localhost:8000/ws/agui'
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[AG-UI Protocol v2] ${message}`, ...args)
    }
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error)
      }
    })
  }

  public on(eventType: string, listener: (data: any) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  public off(eventType: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Skip connection if URL is empty (development mode)
        if (!this.config.url || this.config.url === '') {
          this.log('AG-UI WebSocket connection disabled (no backend available)')
          resolve()
          return
        }
        
        this.log('Connecting to AG-UI WebSocket server:', this.config.url)
        
        this.websocket = new WebSocket(this.config.url!)
        
        this.websocket.onopen = () => {
          this.log('WebSocket connection established')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.emit('connected', { timestamp: Date.now() })
          resolve()
        }

        this.websocket.onmessage = (event) => {
          try {
            const message: AGUIMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse AG-UI message:', error)
          }
        }

        this.websocket.onclose = (event) => {
          this.log('WebSocket connection closed:', event.code, event.reason)
          this.isConnected = false
          this.stopHeartbeat()
          this.emit('disconnected', { reason: event.reason, code: event.code })
          
          if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect()
          } else {
            this.emit('reconnectFailed', { attempts: this.reconnectAttempts })
          }
        }

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', { error })
          reject(error)
        }

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            this.websocket?.close()
            reject(new Error('Connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  public disconnect(): void {
    this.log('Disconnecting from AG-UI WebSocket server')
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    
    this.isConnected = false
  }

  public subscribe<T extends EventName>(
    eventType: T,
    callback: (event: AGUIMessage<T>) => void
  ): EventSubscription {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const subscription: EventSubscription = {
      id,
      eventType,
      callback: callback as (event: AGUIMessage) => void,
      unsubscribe: () => {
        this.subscriptions.delete(id)
        this.log('Unsubscribed from event:', eventType)
      }
    }
    
    this.subscriptions.set(id, subscription)
    this.log('Subscribed to event:', eventType)
    
    return subscription
  }

  public publish<T extends EventName>(eventType: T, data: EventData<T>): void {
    const message: AGUIMessage<T> = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data,
      timestamp: Date.now(),
      source: 'dashboard'
    }

    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify(message))
      this.log('Published event:', eventType, data)
    } else {
      this.messageQueue.push(message)
      this.log('Queued event (not connected):', eventType, data)
    }
  }

  private handleMessage(message: AGUIMessage): void {
    this.log('Received message:', message.type, message.data)
    
    // Notify specific event subscribers
    this.subscriptions.forEach(subscription => {
      if (subscription.eventType === message.type) {
        try {
          subscription.callback(message)
        } catch (error) {
          console.error(`Error in subscription callback for ${message.type}:`, error)
        }
      }
    })

    // Emit to general event listeners
    this.emit('message', message)
    this.emit(message.type, message.data)
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
      })
    }, this.config.reconnectInterval)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.websocket) {
        this.publish('system.notification', {
          type: 'heartbeat',
          message: 'AG-UI client heartbeat',
          level: 'info',
          timestamp: Date.now()
        })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected && this.websocket) {
      const message = this.messageQueue.shift()!
      this.websocket.send(JSON.stringify(message))
      this.log('Sent queued message:', message.type)
    }
  }

  // Getters for status
  public get connectionState(): 'connected' | 'disconnected' | 'connecting' | 'reconnecting' {
    if (this.isConnected) return 'connected'
    if (this.reconnectTimer) return 'reconnecting'
    if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) return 'connecting'
    return 'disconnected'
  }

  public get connected(): boolean {
    return this.isConnected
  }

  public get messageQueueSize(): number {
    return this.messageQueue.length
  }

  public get subscriptionCount(): number {
    return this.subscriptions.size
  }
}

// Global instance
let globalAGUI: AGUIProtocolV2 | null = null

export function getAGUIInstance(config?: AGUIConnectionConfig): AGUIProtocolV2 {
  if (!globalAGUI) {
    globalAGUI = new AGUIProtocolV2(config)
  }
  return globalAGUI
}

// Legacy compatibility functions
export function subscribe<T extends EventName>(
  eventName: T, 
  callback: (event: { data: EventData<T> }) => void
): EventSubscription {
  const agui = getAGUIInstance()
  return agui.subscribe(eventName, (message) => {
    callback({ data: message.data })
  })
}

export function emit<T extends EventName>(eventName: T, data: EventData<T>): void {
  const agui = getAGUIInstance()
  agui.publish(eventName, data)
}

export interface AGUIEventBus {
  initialize: () => Promise<void>
  getProtocol: () => AGUIProtocolV2
}

export function getAGUIEventBus(config?: AGUIConnectionConfig): AGUIEventBus {
  const agui = getAGUIInstance(config)
  
  return {
    initialize: async () => {
      if (!agui.connected) {
        await agui.connect()
      }
    },
    getProtocol: () => agui
  }
}