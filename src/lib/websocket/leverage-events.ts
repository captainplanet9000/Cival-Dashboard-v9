/**
 * Leverage WebSocket Events
 * Real-time leverage monitoring and risk alerts
 */

export interface LeverageEvents {
  // Leverage Updates
  'leverage_update': {
    agent_id: string
    asset: string
    old_leverage: number
    new_leverage: number
    timestamp: string
  }

  // Margin Alerts
  'margin_alert': {
    agent_id: string
    agent_name: string
    margin_usage: number
    margin_threshold: number
    severity: 'warning' | 'critical' | 'emergency'
    recommended_action: string
    timestamp: string
  }

  // Liquidation Warnings
  'liquidation_warning': {
    agent_id: string
    agent_name: string
    position_id: string
    asset: string
    current_price: number
    liquidation_price: number
    distance_to_liquidation: number
    time_to_liquidation_hours: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: string
  }

  // Position Updates
  'position_update': {
    position_id: string
    agent_id: string
    asset: string
    side: 'long' | 'short'
    leverage: number
    unrealized_pnl: number
    margin_used: number
    risk_score: number
    status: 'open' | 'closed' | 'liquidated'
    timestamp: string
  }

  // Risk Score Changes
  'risk_score_update': {
    agent_id: string
    agent_name: string
    old_risk_score: number
    new_risk_score: number
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
    contributing_factors: string[]
    timestamp: string
  }

  // Coordination Events
  'leverage_coordination': {
    coordination_id: string
    strategy: string
    participant_agents: string[]
    total_portfolio_leverage: number
    optimization_score: number
    agent_allocations: Record<string, {
      agent_id: string
      old_leverage: number
      new_leverage: number
      capital_allocation: number
    }>
    status: 'started' | 'completed' | 'failed'
    timestamp: string
  }

  // Emergency Actions
  'emergency_delever': {
    agent_id: string
    agent_name: string
    trigger_reason: string
    positions_closed: number
    margin_freed: number
    new_leverage: number
    status: 'initiated' | 'completed' | 'failed'
    timestamp: string
  }

  // System Alerts
  'leverage_system_alert': {
    alert_type: 'maintenance' | 'circuit_breaker' | 'system_error' | 'performance_warning'
    severity: 'info' | 'warning' | 'critical'
    message: string
    affected_agents: string[]
    estimated_resolution: string
    timestamp: string
  }

  // Portfolio Risk Updates
  'portfolio_risk_update': {
    total_agents: number
    portfolio_leverage: number
    total_margin_used: number
    high_risk_agents: number
    portfolio_var: number
    risk_distribution: Record<string, number>
    timestamp: string
  }

  // Performance Metrics
  'leverage_performance': {
    agent_id: string
    metric_type: 'daily' | 'hourly' | 'real_time'
    metrics: {
      leverage_efficiency: number
      risk_adjusted_return: number
      margin_utilization: number
      successful_positions_ratio: number
      average_holding_time: number
    }
    timestamp: string
  }

  // Market Impact Alerts
  'market_impact_alert': {
    asset: string
    price_change: number
    volatility_spike: number
    affected_agents: string[]
    liquidation_risk_agents: string[]
    recommended_actions: string[]
    timestamp: string
  }
}

// Event priority levels
export const LEVERAGE_EVENT_PRIORITIES = {
  'leverage_update': 'low',
  'margin_alert': 'high',
  'liquidation_warning': 'critical',
  'position_update': 'medium',
  'risk_score_update': 'medium',
  'leverage_coordination': 'medium',
  'emergency_delever': 'critical',
  'leverage_system_alert': 'high',
  'portfolio_risk_update': 'low',
  'leverage_performance': 'low',
  'market_impact_alert': 'high'
} as const

// Event handlers interface
export interface LeverageEventHandlers {
  onLeverageUpdate?: (data: LeverageEvents['leverage_update']) => void
  onMarginAlert?: (data: LeverageEvents['margin_alert']) => void
  onLiquidationWarning?: (data: LeverageEvents['liquidation_warning']) => void
  onPositionUpdate?: (data: LeverageEvents['position_update']) => void
  onRiskScoreUpdate?: (data: LeverageEvents['risk_score_update']) => void
  onLeverageCoordination?: (data: LeverageEvents['leverage_coordination']) => void
  onEmergencyDelever?: (data: LeverageEvents['emergency_delever']) => void
  onSystemAlert?: (data: LeverageEvents['leverage_system_alert']) => void
  onPortfolioRiskUpdate?: (data: LeverageEvents['portfolio_risk_update']) => void
  onLeveragePerformance?: (data: LeverageEvents['leverage_performance']) => void
  onMarketImpactAlert?: (data: LeverageEvents['market_impact_alert']) => void
}

// WebSocket leverage monitoring service
export class LeverageWebSocketService {
  private ws: WebSocket | null = null
  private handlers: LeverageEventHandlers = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('Leverage WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('Leverage WebSocket disconnected:', event.code, event.reason)
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('Leverage WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: any) {
    const { type, data } = message

    switch (type) {
      case 'leverage_update':
        this.handlers.onLeverageUpdate?.(data)
        break
      case 'margin_alert':
        this.handlers.onMarginAlert?.(data)
        break
      case 'liquidation_warning':
        this.handlers.onLiquidationWarning?.(data)
        break
      case 'position_update':
        this.handlers.onPositionUpdate?.(data)
        break
      case 'risk_score_update':
        this.handlers.onRiskScoreUpdate?.(data)
        break
      case 'leverage_coordination':
        this.handlers.onLeverageCoordination?.(data)
        break
      case 'emergency_delever':
        this.handlers.onEmergencyDelever?.(data)
        break
      case 'leverage_system_alert':
        this.handlers.onSystemAlert?.(data)
        break
      case 'portfolio_risk_update':
        this.handlers.onPortfolioRiskUpdate?.(data)
        break
      case 'leverage_performance':
        this.handlers.onLeveragePerformance?.(data)
        break
      case 'market_impact_alert':
        this.handlers.onMarketImpactAlert?.(data)
        break
      default:
        console.warn('Unknown leverage event type:', type)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect().catch(() => {
        // Will trigger another reconnect attempt
      })
    }, delay)
  }

  setHandlers(handlers: LeverageEventHandlers) {
    this.handlers = { ...this.handlers, ...handlers }
  }

  // Send commands to server
  setLeverage(agentId: string, asset: string, leverage: number) {
    this.send({
      type: 'set_leverage',
      data: { agent_id: agentId, asset, leverage }
    })
  }

  emergencyDelever(agentId: string) {
    this.send({
      type: 'emergency_delever',
      data: { agent_id: agentId }
    })
  }

  coordinateAgents(agentIds: string[], strategy: string) {
    this.send({
      type: 'coordinate_agents',
      data: { agent_ids: agentIds, strategy }
    })
  }

  subscribeToAgent(agentId: string) {
    this.send({
      type: 'subscribe_agent',
      data: { agent_id: agentId }
    })
  }

  unsubscribeFromAgent(agentId: string) {
    this.send({
      type: 'unsubscribe_agent',
      data: { agent_id: agentId }
    })
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// React hook for leverage WebSocket
import { useEffect, useRef, useState } from 'react'

export function useLeverageWebSocket(url: string = 'ws://localhost:8000/ws/leverage') {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [leverageData, setLeverageData] = useState<Record<string, any>>({})
  const serviceRef = useRef<LeverageWebSocketService | null>(null)

  useEffect(() => {
    serviceRef.current = new LeverageWebSocketService(url)

    // Set up event handlers
    serviceRef.current.setHandlers({
      onLeverageUpdate: (data) => {
        setLastMessage({ type: 'leverage_update', data })
        setLeverageData(prev => ({
          ...prev,
          [data.agent_id]: {
            ...prev[data.agent_id],
            leverage: data.new_leverage,
            lastUpdate: data.timestamp
          }
        }))
      },

      onMarginAlert: (data) => {
        setLastMessage({ type: 'margin_alert', data })
        // Show urgent notification for critical margin alerts
        if (data.severity === 'critical' || data.severity === 'emergency') {
          console.error('CRITICAL MARGIN ALERT:', data)
        }
      },

      onLiquidationWarning: (data) => {
        setLastMessage({ type: 'liquidation_warning', data })
        // Show urgent notification for liquidation warnings
        if (data.severity === 'critical') {
          console.error('LIQUIDATION WARNING:', data)
        }
      },

      onPositionUpdate: (data) => {
        setLastMessage({ type: 'position_update', data })
        setLeverageData(prev => ({
          ...prev,
          [data.agent_id]: {
            ...prev[data.agent_id],
            positions: {
              ...prev[data.agent_id]?.positions,
              [data.position_id]: data
            }
          }
        }))
      },

      onRiskScoreUpdate: (data) => {
        setLastMessage({ type: 'risk_score_update', data })
        setLeverageData(prev => ({
          ...prev,
          [data.agent_id]: {
            ...prev[data.agent_id],
            riskScore: data.new_risk_score,
            riskLevel: data.risk_level
          }
        }))
      },

      onEmergencyDelever: (data) => {
        setLastMessage({ type: 'emergency_delever', data })
        console.warn('EMERGENCY DELEVER:', data)
      },

      onSystemAlert: (data) => {
        setLastMessage({ type: 'leverage_system_alert', data })
        if (data.severity === 'critical') {
          console.error('SYSTEM ALERT:', data)
        }
      },

      onPortfolioRiskUpdate: (data) => {
        setLastMessage({ type: 'portfolio_risk_update', data })
        setLeverageData(prev => ({
          ...prev,
          portfolio: data
        }))
      }
    })

    // Connect
    serviceRef.current.connect()
      .then(() => setIsConnected(true))
      .catch((error) => {
        console.error('Failed to connect to leverage WebSocket:', error)
        setIsConnected(false)
      })

    return () => {
      serviceRef.current?.disconnect()
      setIsConnected(false)
    }
  }, [url])

  const setLeverage = (agentId: string, asset: string, leverage: number) => {
    serviceRef.current?.setLeverage(agentId, asset, leverage)
  }

  const emergencyDelever = (agentId: string) => {
    serviceRef.current?.emergencyDelever(agentId)
  }

  const coordinateAgents = (agentIds: string[], strategy: string) => {
    serviceRef.current?.coordinateAgents(agentIds, strategy)
  }

  const subscribeToAgent = (agentId: string) => {
    serviceRef.current?.subscribeToAgent(agentId)
  }

  return {
    isConnected,
    lastMessage,
    leverageData,
    setLeverage,
    emergencyDelever,
    coordinateAgents,
    subscribeToAgent,
    service: serviceRef.current
  }
}

// Leverage event utilities
export const formatLeverageAlert = (alert: LeverageEvents['margin_alert'] | LeverageEvents['liquidation_warning']) => {
  if ('margin_usage' in alert) {
    return {
      title: `Margin Alert - ${alert.agent_name}`,
      message: `Margin usage: ${(alert.margin_usage * 100).toFixed(1)}%`,
      severity: alert.severity,
      action: alert.recommended_action
    }
  } else {
    return {
      title: `Liquidation Warning - ${alert.agent_name}`,
      message: `${alert.time_to_liquidation_hours.toFixed(1)} hours to liquidation`,
      severity: alert.severity,
      action: `Monitor ${alert.asset} position closely`
    }
  }
}

export const getLeverageEventColor = (eventType: keyof LeverageEvents) => {
  const priority = LEVERAGE_EVENT_PRIORITIES[eventType]
  switch (priority) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'blue'
    default: return 'gray'
  }
}