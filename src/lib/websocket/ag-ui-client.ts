/**
 * AG-UI Protocol v2 Client
 * Advanced real-time communication for AI agent coordination
 */

import { io, Socket } from 'socket.io-client'
import { EventEmitter } from 'events'

// AG-UI Protocol v2 Message Types
export enum AGUIMessageType {
  // System Messages
  SYSTEM_HEALTH = 'system_health',
  AGENT_STATUS = 'agent_status',
  CONNECTION_STATUS = 'connection_status',
  
  // Agent Coordination
  AGENT_DECISION = 'agent_decision',
  AGENT_COMMAND = 'agent_command',
  AGENT_COORDINATION = 'agent_coordination',
  AGENT_HEARTBEAT = 'agent_heartbeat',
  
  // Trading Events
  TRADE_SIGNAL = 'trade_signal',
  TRADE_EXECUTION = 'trade_execution',
  PORTFOLIO_UPDATE = 'portfolio_update',
  POSITION_UPDATE = 'position_update',
  
  // Market Data
  MARKET_DATA = 'market_data',
  PRICE_UPDATE = 'price_update',
  VOLUME_UPDATE = 'volume_update',
  
  // Risk Management
  RISK_ALERT = 'risk_alert',
  RISK_LIMIT_BREACH = 'risk_limit_breach',
  MARGIN_CALL = 'margin_call',
  
  // User Interface
  UI_UPDATE = 'ui_update',
  NOTIFICATION = 'notification',
  TOAST_MESSAGE = 'toast_message',
  
  // Subscriptions
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  CHANNEL_JOIN = 'channel_join',
  CHANNEL_LEAVE = 'channel_leave'
}

// AG-UI Message Interface
export interface AGUIMessage {
  type: AGUIMessageType
  timestamp: string
  source: string
  target?: string
  channel?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  data: Record<string, any>
  metadata?: {
    version: string
    sessionId: string
    correlationId?: string
    retryCount?: number
  }
}

// Agent Decision Data
export interface AgentDecisionData {
  agentId: string
  agentName: string
  decisionType: 'trade' | 'hold' | 'rebalance' | 'analysis' | 'risk_check'
  symbol?: string
  reasoning: string
  confidenceScore: number
  marketData: Record<string, any>
  actionTaken: boolean
  result?: Record<string, any>
  executionTimeMs?: number
}

// Trade Signal Data
export interface TradeSignalData {
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit' | 'stop'
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
  strategy: string
  reasoning: string
  confidence: number
}

// Portfolio Update Data
export interface PortfolioUpdateData {
  agentId?: string
  totalValue: number
  availableBalance: number
  totalPnl: number
  unrealizedPnl: number
  realizedPnl: number
  positions: Array<{
    symbol: string
    quantity: number
    avgPrice: number
    currentPrice: number
    marketValue: number
    unrealizedPnl: number
  }>
  metrics: {
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
    totalTrades: number
  }
}

// Risk Alert Data
export interface RiskAlertData {
  agentId?: string
  alertType: 'position_size' | 'drawdown' | 'correlation' | 'volatility' | 'liquidity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  currentValue: number
  thresholdValue: number
  recommendations: string[]
}

// Market Data
export interface MarketDataUpdate {
  symbol: string
  price: number
  volume: number
  change: number
  changePercent: number
  high24h: number
  low24h: number
  timestamp: string
}

// Connection Configuration
export interface AGUIClientConfig {
  url: string
  channels: string[]
  reconnectAttempts: number
  reconnectInterval: number
  heartbeatInterval: number
  timeout: number
  debug: boolean
}

// Default configuration
const DEFAULT_CONFIG: AGUIClientConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  channels: ['agents', 'trading', 'portfolio', 'market', 'risk'],
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  timeout: 10000,
  debug: false
}

export class AGUIClient extends EventEmitter {
  private socket: Socket | null = null
  private config: AGUIClientConfig
  private reconnectCount = 0
  private isConnecting = false
  private heartbeatTimer: NodeJS.Timeout | null = null
  private sessionId: string
  private subscribedChannels = new Set<string>()
  private messageQueue: AGUIMessage[] = []

  constructor(config: Partial<AGUIClientConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = `agui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (this.config.debug) {
      console.log('[AG-UI] Client initialized with config:', this.config)
    }
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true
      
      if (this.config.debug) {
        console.log('[AG-UI] Connecting to:', this.config.url)
      }

      this.socket = io(this.config.url, {
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: this.config.timeout,
        forceNew: true
      })

      // Connection handlers
      this.socket.on('connect', () => {
        this.isConnecting = false
        this.reconnectCount = 0
        
        if (this.config.debug) {
          console.log('[AG-UI] Connected successfully')
        }

        // Subscribe to channels
        this.config.channels.forEach(channel => {
          this.subscribeToChannel(channel)
        })

        // Start heartbeat
        this.startHeartbeat()

        // Process queued messages
        this.processMessageQueue()

        this.emit('connected')
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false
        
        if (this.config.debug) {
          console.error('[AG-UI] Connection error:', error)
        }

        this.handleReconnect()
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        this.isConnecting = false
        
        if (this.config.debug) {
          console.log('[AG-UI] Disconnected:', reason)
        }

        this.stopHeartbeat()
        this.emit('disconnected', reason)

        if (reason === 'io server disconnect') {
          // Server disconnected, don't auto-reconnect
          return
        }

        this.handleReconnect()
      })

      // AG-UI Protocol message handlers
      this.setupMessageHandlers()
    })
  }

  // Disconnect from server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.stopHeartbeat()
    this.subscribedChannels.clear()
    this.messageQueue = []
  }

  // Send AG-UI message
  sendMessage(type: AGUIMessageType, data: Record<string, any>, options: {
    target?: string
    channel?: string
    priority?: 'low' | 'medium' | 'high' | 'critical'
    correlationId?: string
  } = {}): void {
    const message: AGUIMessage = {
      type,
      timestamp: new Date().toISOString(),
      source: this.sessionId,
      target: options.target,
      channel: options.channel,
      priority: options.priority || 'medium',
      data,
      metadata: {
        version: '2.0',
        sessionId: this.sessionId,
        correlationId: options.correlationId
      }
    }

    if (this.socket && this.socket.connected) {
      this.socket.emit('agui_message', message)
      
      if (this.config.debug) {
        console.log('[AG-UI] Message sent:', message)
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message)
      
      if (this.config.debug) {
        console.log('[AG-UI] Message queued (not connected):', message)
      }
    }
  }

  // Subscribe to channel
  subscribeToChannel(channel: string): void {
    if (this.subscribedChannels.has(channel)) {
      return
    }

    this.sendMessage(AGUIMessageType.SUBSCRIBE, { channel })
    this.subscribedChannels.add(channel)
    
    if (this.config.debug) {
      console.log('[AG-UI] Subscribed to channel:', channel)
    }
  }

  // Unsubscribe from channel
  unsubscribeFromChannel(channel: string): void {
    if (!this.subscribedChannels.has(channel)) {
      return
    }

    this.sendMessage(AGUIMessageType.UNSUBSCRIBE, { channel })
    this.subscribedChannels.delete(channel)
    
    if (this.config.debug) {
      console.log('[AG-UI] Unsubscribed from channel:', channel)
    }
  }

  // Agent-specific methods
  sendAgentDecision(agentId: string, decision: Partial<AgentDecisionData>): void {
    this.sendMessage(AGUIMessageType.AGENT_DECISION, {
      agentId,
      timestamp: new Date().toISOString(),
      ...decision
    }, { channel: 'agents', priority: 'high' })
  }

  sendTradeSignal(signal: TradeSignalData): void {
    this.sendMessage(AGUIMessageType.TRADE_SIGNAL, signal, {
      channel: 'trading',
      priority: 'high'
    })
  }

  sendPortfolioUpdate(update: PortfolioUpdateData): void {
    this.sendMessage(AGUIMessageType.PORTFOLIO_UPDATE, update, {
      channel: 'portfolio',
      priority: 'medium'
    })
  }

  sendRiskAlert(alert: RiskAlertData): void {
    this.sendMessage(AGUIMessageType.RISK_ALERT, alert, {
      channel: 'risk',
      priority: alert.severity === 'critical' ? 'critical' : 'high'
    })
  }

  sendMarketDataUpdate(marketData: MarketDataUpdate): void {
    this.sendMessage(AGUIMessageType.MARKET_DATA, marketData, {
      channel: 'market',
      priority: 'low'
    })
  }

  // Agent command execution
  executeAgentCommand(agentId: string, command: string, params: Record<string, any> = {}): void {
    this.sendMessage(AGUIMessageType.AGENT_COMMAND, {
      agentId,
      command,
      params,
      timestamp: new Date().toISOString()
    }, { channel: 'agents', priority: 'high' })
  }

  // Private methods
  private setupMessageHandlers(): void {
    if (!this.socket) return

    // Handle incoming AG-UI messages
    this.socket.on('agui_message', (message: AGUIMessage) => {
      if (this.config.debug) {
        console.log('[AG-UI] Message received:', message)
      }

      // Emit specific event based on message type
      this.emit(message.type, message.data, message)
      
      // Emit general message event
      this.emit('message', message)
    })

    // Handle system events
    this.socket.on('system_status', (data) => {
      this.emit('systemStatus', data)
    })

    this.socket.on('channel_joined', (data) => {
      if (this.config.debug) {
        console.log('[AG-UI] Joined channel:', data.channel)
      }
    })

    this.socket.on('channel_left', (data) => {
      if (this.config.debug) {
        console.log('[AG-UI] Left channel:', data.channel)
      }
    })

    this.socket.on('error', (error) => {
      console.error('[AG-UI] Socket error:', error)
      this.emit('error', error)
    })
  }

  private handleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      console.error('[AG-UI] Max reconnection attempts reached')
      this.emit('reconnectFailed')
      return
    }

    this.reconnectCount++
    
    if (this.config.debug) {
      console.log(`[AG-UI] Reconnecting... (attempt ${this.reconnectCount}/${this.config.reconnectAttempts})`)
    }

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[AG-UI] Reconnection failed:', error)
      })
    }, this.config.reconnectInterval)
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.sendMessage(AGUIMessageType.AGENT_HEARTBEAT, {
          timestamp: new Date().toISOString(),
          subscribedChannels: Array.from(this.subscribedChannels)
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
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.socket && this.socket.connected) {
        this.socket.emit('agui_message', message)
        
        if (this.config.debug) {
          console.log('[AG-UI] Queued message sent:', message)
        }
      }
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  get connectionState(): string {
    if (this.isConnecting) return 'connecting'
    if (this.socket?.connected) return 'connected'
    return 'disconnected'
  }

  get subscribedChannelsList(): string[] {
    return Array.from(this.subscribedChannels)
  }
}

// Singleton instance
let globalAGUIClient: AGUIClient | null = null

export function getAGUIClient(config?: Partial<AGUIClientConfig>): AGUIClient {
  if (!globalAGUIClient) {
    globalAGUIClient = new AGUIClient(config)
  }
  return globalAGUIClient
}

export function initializeAGUI(config?: Partial<AGUIClientConfig>): Promise<AGUIClient> {
  const client = getAGUIClient(config)
  return client.connect().then(() => client)
}

export default AGUIClient