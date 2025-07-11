/**
 * WebSocket Events for Autonomous Operations
 * Real-time event handling for autonomous trading systems
 */

import { io, Socket } from 'socket.io-client'

// Event types for autonomous operations
export interface AutonomousEvents {
  // Health monitoring events
  'health_monitor.service_status_change': {
    service_name: string
    old_status: string
    new_status: string
    timestamp: string
    metrics: Record<string, any>
  }
  
  'health_monitor.alert_created': {
    alert_id: string
    service_name: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: string
    auto_resolved: boolean
  }
  
  'health_monitor.recovery_attempt': {
    service_name: string
    action: string
    success: boolean
    timestamp: string
  }
  
  // Agent communication events
  'agent_communication.message_sent': {
    message_id: string
    conversation_id: string
    from_agent_id: string
    to_agent_id?: string
    message_type: string
    priority: string
    subject: string
    timestamp: string
  }
  
  'agent_communication.message_received': {
    message_id: string
    conversation_id: string
    recipient_agent_id: string
    timestamp: string
  }
  
  'agent_communication.conversation_created': {
    conversation_id: string
    participants: string[]
    topic: string
    timestamp: string
  }
  
  // Consensus decision events
  'consensus_decision.decision_created': {
    decision_id: string
    decision_type: string
    title: string
    required_agents: string[]
    consensus_algorithm: string
    expires_at: string
    timestamp: string
  }
  
  'consensus_decision.vote_cast': {
    vote_id: string
    decision_id: string
    agent_id: string
    vote_type: string
    confidence: number
    timestamp: string
  }
  
  'consensus_decision.consensus_reached': {
    decision_id: string
    final_decision: string
    vote_count: number
    approval_percentage: number
    timestamp: string
  }
  
  // Market regime events
  'market_regime.regime_detected': {
    regime_id: string
    primary_regime: string
    secondary_regimes: string[]
    confidence: string
    risk_level: number
    timestamp: string
  }
  
  'market_regime.regime_transition': {
    transition_id: string
    from_regime: string
    to_regime: string
    transition_probability: number
    timestamp: string
  }
  
  'market_regime.adaptations_generated': {
    regime_id: string
    primary_regime: string
    adaptations_count: number
    timestamp: string
  }
  
  // Emergency protocol events
  'emergency_protocols.emergency_triggered': {
    event_id: string
    emergency_type: string
    severity: string
    trigger_condition: string
    manual_trigger: boolean
    timestamp: string
  }
  
  'emergency_protocols.emergency_resolved': {
    event_id: string
    emergency_type: string
    resolution_notes: string
    auto_resolved: boolean
    duration_seconds: number
    timestamp: string
  }
  
  'emergency_protocols.circuit_breaker_activated': {
    breaker_id: string
    breaker_type: string
    threshold: number
    current_value: number
    timestamp: string
  }
  
  'emergency_protocols.trading_halted': {
    reason: string
    timestamp: string
  }
  
  'emergency_protocols.trading_resumed': {
    reason: string
    timestamp: string
  }
  
  // General system events
  'autonomous_system.status_update': {
    system_health: string
    active_agents: number
    emergency_mode: boolean
    timestamp: string
  }
}

export type AutonomousEventType = keyof AutonomousEvents
export type AutonomousEventHandler<T extends AutonomousEventType> = (data: AutonomousEvents[T]) => void

export class AutonomousWebSocketClient {
  private socket: Socket | null = null
  private eventHandlers: Map<AutonomousEventType, Set<AutonomousEventHandler<any>>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private isConnected = false
  
  constructor(private serverUrl: string = 'ws://localhost:8000') {}
  
  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }
      
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        upgrade: false,
        rememberUpgrade: false,
        timeout: 10000,
        forceNew: true
      })
      
      this.socket.on('connect', () => {
        console.log('Connected to autonomous WebSocket server')
        this.isConnected = true
        this.reconnectAttempts = 0
        resolve()
      })
      
      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from autonomous WebSocket server:', reason)
        this.isConnected = false
        this.handleReconnect()
      })
      
      this.socket.on('connect_error', (error) => {
        console.error('Failed to connect to autonomous WebSocket server:', error)
        this.isConnected = false
        if (this.reconnectAttempts === 0) {
          reject(error)
        }
        this.handleReconnect()
      })
      
      // Set up event listeners for all autonomous events
      this.setupEventListeners()
    })
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }
  
  /**
   * Subscribe to an autonomous event
   */
  subscribe<T extends AutonomousEventType>(
    eventType: T,
    handler: AutonomousEventHandler<T>
  ): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    
    this.eventHandlers.get(eventType)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType)
        }
      }
    }
  }
  
  /**
   * Emit an event to the server
   */
  emit<T extends AutonomousEventType>(eventType: T, data: AutonomousEvents[T]): void {
    if (this.socket?.connected) {
      this.socket.emit(eventType, data)
    } else {
      console.warn(`Cannot emit event ${eventType}: not connected to server`)
    }
  }
  
  /**
   * Check if connected to server
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }
  
  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean
    reconnectAttempts: number
    lastError?: string
  } {
    return {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return
    
    // Health monitoring events
    this.socket.on('health_monitor.service_status_change', (data) => {
      this.handleEvent('health_monitor.service_status_change', data)
    })
    
    this.socket.on('health_monitor.alert_created', (data) => {
      this.handleEvent('health_monitor.alert_created', data)
    })
    
    this.socket.on('health_monitor.recovery_attempt', (data) => {
      this.handleEvent('health_monitor.recovery_attempt', data)
    })
    
    // Agent communication events
    this.socket.on('agent_communication.message_sent', (data) => {
      this.handleEvent('agent_communication.message_sent', data)
    })
    
    this.socket.on('agent_communication.message_received', (data) => {
      this.handleEvent('agent_communication.message_received', data)
    })
    
    this.socket.on('agent_communication.conversation_created', (data) => {
      this.handleEvent('agent_communication.conversation_created', data)
    })
    
    // Consensus decision events
    this.socket.on('consensus_decision.decision_created', (data) => {
      this.handleEvent('consensus_decision.decision_created', data)
    })
    
    this.socket.on('consensus_decision.vote_cast', (data) => {
      this.handleEvent('consensus_decision.vote_cast', data)
    })
    
    this.socket.on('consensus_decision.consensus_reached', (data) => {
      this.handleEvent('consensus_decision.consensus_reached', data)
    })
    
    // Market regime events
    this.socket.on('market_regime.regime_detected', (data) => {
      this.handleEvent('market_regime.regime_detected', data)
    })
    
    this.socket.on('market_regime.regime_transition', (data) => {
      this.handleEvent('market_regime.regime_transition', data)
    })
    
    this.socket.on('market_regime.adaptations_generated', (data) => {
      this.handleEvent('market_regime.adaptations_generated', data)
    })
    
    // Emergency protocol events
    this.socket.on('emergency_protocols.emergency_triggered', (data) => {
      this.handleEvent('emergency_protocols.emergency_triggered', data)
    })
    
    this.socket.on('emergency_protocols.emergency_resolved', (data) => {
      this.handleEvent('emergency_protocols.emergency_resolved', data)
    })
    
    this.socket.on('emergency_protocols.circuit_breaker_activated', (data) => {
      this.handleEvent('emergency_protocols.circuit_breaker_activated', data)
    })
    
    this.socket.on('emergency_protocols.trading_halted', (data) => {
      this.handleEvent('emergency_protocols.trading_halted', data)
    })
    
    this.socket.on('emergency_protocols.trading_resumed', (data) => {
      this.handleEvent('emergency_protocols.trading_resumed', data)
    })
    
    // General system events
    this.socket.on('autonomous_system.status_update', (data) => {
      this.handleEvent('autonomous_system.status_update', data)
    })
  }
  
  private handleEvent<T extends AutonomousEventType>(
    eventType: T,
    data: AutonomousEvents[T]
  ): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error handling event ${eventType}:`, error)
        }
      })
    }
  }
  
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }
}

// Global instance
export const autonomousWebSocket = new AutonomousWebSocketClient()

// React hook for autonomous WebSocket events
export function useAutonomousWebSocket() {
  const [isConnected, setIsConnected] = React.useState(false)
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0)
  
  React.useEffect(() => {
    const connect = async () => {
      try {
        await autonomousWebSocket.connect()
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to connect to autonomous WebSocket:', error)
        setIsConnected(false)
      }
    }
    
    // Monitor connection status
    const statusInterval = setInterval(() => {
      const status = autonomousWebSocket.getStatus()
      setIsConnected(status.connected)
      setReconnectAttempts(status.reconnectAttempts)
    }, 1000)
    
    connect()
    
    return () => {
      clearInterval(statusInterval)
      autonomousWebSocket.disconnect()
    }
  }, [])
  
  return {
    isConnected,
    reconnectAttempts,
    subscribe: autonomousWebSocket.subscribe.bind(autonomousWebSocket),
    emit: autonomousWebSocket.emit.bind(autonomousWebSocket),
    disconnect: autonomousWebSocket.disconnect.bind(autonomousWebSocket)
  }
}

// React hook for specific autonomous events
export function useAutonomousEvent<T extends AutonomousEventType>(
  eventType: T,
  handler: AutonomousEventHandler<T>,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    const unsubscribe = autonomousWebSocket.subscribe(eventType, handler)
    return unsubscribe
  }, deps)
}

// For non-React environments
declare global {
  interface Window {
    autonomousWebSocket: AutonomousWebSocketClient
  }
}

if (typeof window !== 'undefined') {
  window.autonomousWebSocket = autonomousWebSocket
}

// Import React for hooks
import React from 'react'