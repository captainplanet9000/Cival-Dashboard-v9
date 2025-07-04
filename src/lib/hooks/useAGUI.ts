/**
 * React Hook for AG-UI Protocol v2 Integration
 * Provides seamless real-time communication for AI agents
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { 
  AGUIProtocolV2,
  getAGUIInstance,
  AGUIMessage,
  EventName,
  EventData,
  AGUIConnectionConfig
} from '@/lib/ag-ui-protocol-v2'

// Type definitions for AG-UI data
export interface AgentDecisionData {
  agentId: string
  agentName?: string
  decisionType: string
  decision: string
  actionTaken?: boolean
  confidence?: number
  timestamp?: number
}

export interface TradeSignalData {
  symbol: string
  side: 'buy' | 'sell'
  action: string
  confidence: number
  price?: number
  quantity?: number
  strategy?: string
  timestamp?: number
}

export interface PortfolioUpdateData {
  totalValue: number
  change24h: number
  changePercentage: number
  timestamp?: number
}

export interface RiskAlertData {
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  value?: number
  timestamp?: number
}

export interface MarketDataUpdate {
  symbol: string
  price: number
  volume?: number
  timestamp?: number
}

// Hook configuration
interface UseAGUIConfig extends AGUIConnectionConfig {
  channels?: string[]
  autoConnect?: boolean
  onAgentDecision?: (data: AgentDecisionData) => void
  onTradeSignal?: (data: TradeSignalData) => void
  onPortfolioUpdate?: (data: PortfolioUpdateData) => void
  onRiskAlert?: (data: RiskAlertData) => void
  onMarketData?: (data: MarketDataUpdate) => void
  onError?: (error: any) => void
}

// Hook return type
interface UseAGUIReturn {
  // Connection state
  isConnected: boolean
  connectionState: string
  error: string | null
  
  // Connection methods
  connect: () => Promise<void>
  disconnect: () => void
  
  // Messaging methods
  sendAgentDecision: (agentId: string, decision: Partial<AgentDecisionData>) => void
  sendTradeSignal: (signal: TradeSignalData) => void
  sendPortfolioUpdate: (update: PortfolioUpdateData) => void
  sendRiskAlert: (alert: RiskAlertData) => void
  sendMarketDataUpdate: (marketData: MarketDataUpdate) => void
  executeAgentCommand: (agentId: string, command: string, params?: Record<string, any>) => void
  sendEvent: (event: { type: string; data: any }) => void
  
  // Statistics
  messagesReceived: number
  messagesSent: number
  lastMessage: AGUIMessage | null
  events: AGUIMessage[]
  
  // Protocol access
  protocol: AGUIProtocolV2
}

export function useAGUI(config: UseAGUIConfig = {}): UseAGUIReturn {
  const {
    channels = ['agents', 'trading', 'portfolio', 'market', 'risk', 'system', 'orchestration'],
    autoConnect = true,
    debug = false,
    onAgentDecision,
    onTradeSignal,
    onPortfolioUpdate,
    onRiskAlert,
    onMarketData,
    onError,
    ...aguiConfig
  } = config

  // State
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [messagesReceived, setMessagesReceived] = useState(0)
  const [messagesSent, setMessagesSent] = useState(0)
  const [lastMessage, setLastMessage] = useState<AGUIMessage | null>(null)
  const [events, setEvents] = useState<AGUIMessage[]>([])

  // Refs
  const protocolRef = useRef<AGUIProtocolV2 | null>(null)
  const callbacksRef = useRef({
    onAgentDecision,
    onTradeSignal,
    onPortfolioUpdate,
    onRiskAlert,
    onMarketData,
    onError
  })

  // Update callbacks ref when props change
  useEffect(() => {
    callbacksRef.current = {
      onAgentDecision,
      onTradeSignal,
      onPortfolioUpdate,
      onRiskAlert,
      onMarketData,
      onError
    }
  }, [onAgentDecision, onTradeSignal, onPortfolioUpdate, onRiskAlert, onMarketData, onError])

  // Initialize protocol
  useEffect(() => {
    if (!protocolRef.current) {
      protocolRef.current = getAGUIInstance({
        debug,
        ...aguiConfig
      })
    }
  }, [debug, aguiConfig])

  // Setup event handlers
  useEffect(() => {
    const protocol = protocolRef.current
    if (!protocol) return

    // Connection events
    const handleConnected = () => {
      setIsConnected(true)
      setConnectionState('connected')
      setError(null)
      
      if (debug) {
        console.log('[useAGUI] Connected to AG-UI server')
      }
    }

    const handleDisconnected = (data: any) => {
      setIsConnected(false)
      setConnectionState('disconnected')
      
      if (debug) {
        console.log('[useAGUI] Disconnected from AG-UI server:', data?.reason)
      }
    }

    const handleError = (err: any) => {
      setError(err.message || 'Unknown error')
      callbacksRef.current.onError?.(err)
      
      if (debug) {
        console.error('[useAGUI] Error:', err)
      }
    }

    const handleReconnectFailed = () => {
      setError('Failed to reconnect to server')
      toast.error('Lost connection to trading system')
    }

    // Message handlers
    const handleMessage = (message: AGUIMessage) => {
      setMessagesReceived(prev => prev + 1)
      setLastMessage(message)
      setEvents(prev => [...prev.slice(-99), message]) // Keep last 100 events
      
      if (debug) {
        console.log('[useAGUI] Message received:', message)
      }
    }

    const handleAgentDecision = (data: any) => {
      const agentData: AgentDecisionData = {
        agentId: data.agent_id || data.agentId || 'unknown',
        agentName: data.agent_name || data.agentName,
        decisionType: data.decision_type || data.decisionType || 'decision',
        decision: data.decision || 'Unknown decision',
        actionTaken: data.action_taken || data.actionTaken,
        confidence: data.confidence,
        timestamp: data.timestamp || Date.now()
      }
      
      callbacksRef.current.onAgentDecision?.(agentData)
      
      // Show toast for important decisions
      if (agentData.actionTaken) {
        toast.success(`${agentData.agentName || agentData.agentId}: ${agentData.decisionType} executed`, {
          duration: 4000,
          icon: '🤖'
        })
      }
    }

    const handleTradeSignal = (data: any) => {
      const signalData: TradeSignalData = {
        symbol: data.symbol || 'UNKNOWN',
        side: data.side || 'buy',
        action: data.action || 'signal',
        confidence: data.confidence || 0,
        price: data.price,
        quantity: data.quantity,
        strategy: data.strategy,
        timestamp: data.timestamp || Date.now()
      }
      
      callbacksRef.current.onTradeSignal?.(signalData)
      
      toast.success(`Trade Signal: ${signalData.side.toUpperCase()} ${signalData.symbol}`, {
        duration: 5000,
        icon: '📈'
      })
    }

    const handlePortfolioUpdate = (data: any) => {
      const portfolioData: PortfolioUpdateData = {
        totalValue: data.total_value || data.totalValue || 0,
        change24h: data.change_24h || data.change24h || 0,
        changePercentage: data.change_percentage || data.changePercentage || 0,
        timestamp: data.timestamp || Date.now()
      }
      
      callbacksRef.current.onPortfolioUpdate?.(portfolioData)
    }

    const handleRiskAlert = (data: any) => {
      const riskData: RiskAlertData = {
        message: data.message || 'Risk alert',
        severity: data.severity || 'medium',
        value: data.value,
        timestamp: data.timestamp || Date.now()
      }
      
      callbacksRef.current.onRiskAlert?.(riskData)
      
      const severity = riskData.severity
      const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : '⚡'
      const toastFn = severity === 'critical' ? toast.error : severity === 'high' ? toast : toast
      
      toastFn(`Risk Alert: ${riskData.message}`, {
        duration: severity === 'critical' ? 10000 : 6000,
        icon
      })
    }

    const handleMarketData = (data: any) => {
      const marketData: MarketDataUpdate = {
        symbol: data.symbol || 'UNKNOWN',
        price: data.price || 0,
        volume: data.volume,
        timestamp: data.timestamp || Date.now()
      }
      
      callbacksRef.current.onMarketData?.(marketData)
    }

    const handleSystemHealth = (data: any) => {
      if (data.health_score && data.health_score < 0.8) {
        toast.error('System health degraded', { icon: '⚠️' })
      }
    }

    // Register event listeners
    const unsubscribers = [
      protocol.on('connected', handleConnected),
      protocol.on('disconnected', handleDisconnected),
      protocol.on('error', handleError),
      protocol.on('reconnectFailed', handleReconnectFailed),
      protocol.on('message', handleMessage),
      protocol.on('agent.decision_made', handleAgentDecision),
      protocol.on('trade.signal_generated', handleTradeSignal),
      protocol.on('portfolio.value_updated', handlePortfolioUpdate),
      protocol.on('portfolio.risk_alert', handleRiskAlert),
      protocol.on('market_data.price_update', handleMarketData),
      protocol.on('system.health_update', handleSystemHealth)
    ]

    // Update connection state
    setConnectionState(protocol.connectionState)
    setIsConnected(protocol.connected)

    // Cleanup
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [debug])

  // Auto-connect
  useEffect(() => {
    if (autoConnect && protocolRef.current && !isConnected) {
      connect()
    }
  }, [autoConnect])

  // Connection methods
  const connect = useCallback(async () => {
    if (!protocolRef.current) return
    
    try {
      setConnectionState('connecting')
      await protocolRef.current.connect()
    } catch (err: any) {
      setError(err.message || 'Failed to connect')
      setConnectionState('disconnected')
      throw err
    }
  }, [])

  const disconnect = useCallback(() => {
    if (!protocolRef.current) return
    
    protocolRef.current.disconnect()
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  // Messaging methods
  const sendAgentDecision = useCallback((agentId: string, decision: Partial<AgentDecisionData>) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('agent.decision_made', {
      agent_id: agentId,
      agent_name: decision.agentName,
      decision: decision.decision || 'decision_made',
      action_taken: decision.actionTaken,
      timestamp: decision.timestamp || Date.now()
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendTradeSignal = useCallback((signal: TradeSignalData) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('trade.signal_generated', {
      symbol: signal.symbol,
      action: signal.action,
      confidence: signal.confidence,
      timestamp: signal.timestamp || Date.now(),
      price: signal.price,
      strategy: signal.strategy
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendPortfolioUpdate = useCallback((update: PortfolioUpdateData) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('portfolio.value_updated', {
      total_value: update.totalValue,
      change_24h: update.change24h,
      change_percentage: update.changePercentage
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendRiskAlert = useCallback((alert: RiskAlertData) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('portfolio.risk_alert', {
      message: alert.message,
      severity: alert.severity,
      value: alert.value,
      timestamp: alert.timestamp || Date.now()
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendMarketDataUpdate = useCallback((marketData: MarketDataUpdate) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('market_data.price_update', {
      symbol: marketData.symbol,
      price: marketData.price,
      timestamp: marketData.timestamp || Date.now(),
      volume: marketData.volume
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  const executeAgentCommand = useCallback((agentId: string, command: string, params: Record<string, any> = {}) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('agent.communication', {
      from_agent: 'dashboard',
      to_agent: agentId,
      message: JSON.stringify({ command, params }),
      timestamp: Date.now()
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendEvent = useCallback((event: { type: string; data: any }) => {
    if (!protocolRef.current) return
    
    protocolRef.current.publish('system.notification', {
      type: event.type,
      message: JSON.stringify(event.data),
      level: 'info',
      timestamp: Date.now()
    })
    setMessagesSent(prev => prev + 1)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (protocolRef.current && isConnected) {
        protocolRef.current.disconnect()
      }
    }
  }, [])

  return {
    // Connection state
    isConnected,
    connectionState,
    error,
    
    // Connection methods
    connect,
    disconnect,
    
    // Messaging methods
    sendAgentDecision,
    sendTradeSignal,
    sendPortfolioUpdate,
    sendRiskAlert,
    sendMarketDataUpdate,
    executeAgentCommand,
    sendEvent,
    
    // Statistics
    messagesReceived,
    messagesSent,
    lastMessage,
    events,
    
    // Protocol access
    protocol: protocolRef.current!
  }
}

// Specialized hooks for specific use cases
export function useAgentCommunication() {
  return useAGUI({
    channels: ['agents'],
    autoConnect: true
  })
}

export function useTradingCommunication() {
  return useAGUI({
    channels: ['trading', 'portfolio', 'risk'],
    autoConnect: true
  })
}

export function useMarketDataCommunication() {
  return useAGUI({
    channels: ['market'],
    autoConnect: true
  })
}

export default useAGUI