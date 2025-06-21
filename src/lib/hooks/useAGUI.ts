/**
 * React Hook for AG-UI Protocol v2 Integration
 * Provides seamless real-time communication for AI agents
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { 
  AGUIClient, 
  AGUIMessageType, 
  AGUIMessage,
  AgentDecisionData,
  TradeSignalData,
  PortfolioUpdateData,
  RiskAlertData,
  MarketDataUpdate,
  getAGUIClient 
} from '@/lib/websocket/ag-ui-client'

// Hook configuration
interface UseAGUIConfig {
  channels?: string[]
  autoConnect?: boolean
  debug?: boolean
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
  
  // Channel management
  subscribeToChannel: (channel: string) => void
  unsubscribeFromChannel: (channel: string) => void
  subscribedChannels: string[]
  
  // Statistics
  messagesReceived: number
  messagesSent: number
  lastMessage: AGUIMessage | null
}

export function useAGUI(config: UseAGUIConfig = {}): UseAGUIReturn {
  const {
    channels = ['agents', 'trading', 'portfolio', 'market', 'risk'],
    autoConnect = true,
    debug = false,
    onAgentDecision,
    onTradeSignal,
    onPortfolioUpdate,
    onRiskAlert,
    onMarketData,
    onError
  } = config

  // State
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [messagesReceived, setMessagesReceived] = useState(0)
  const [messagesSent, setMessagesSent] = useState(0)
  const [lastMessage, setLastMessage] = useState<AGUIMessage | null>(null)
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([])

  // Refs
  const clientRef = useRef<AGUIClient | null>(null)
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

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = getAGUIClient({
        channels,
        debug
      })
    }
  }, [channels, debug])

  // Setup event handlers
  useEffect(() => {
    const client = clientRef.current
    if (!client) return

    // Connection events
    const handleConnected = () => {
      setIsConnected(true)
      setConnectionState('connected')
      setError(null)
      setSubscribedChannels(client.subscribedChannelsList)
      
      if (debug) {
        console.log('[useAGUI] Connected to AG-UI server')
      }
    }

    const handleDisconnected = (reason: string) => {
      setIsConnected(false)
      setConnectionState('disconnected')
      
      if (debug) {
        console.log('[useAGUI] Disconnected from AG-UI server:', reason)
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
      
      if (debug) {
        console.log('[useAGUI] Message received:', message)
      }
    }

    const handleAgentDecision = (data: AgentDecisionData) => {
      callbacksRef.current.onAgentDecision?.(data)
      
      // Show toast for important decisions
      if (data.actionTaken) {
        toast.success(`${data.agentName}: ${data.decisionType} executed`, {
          duration: 4000,
          icon: '🤖'
        })
      }
    }

    const handleTradeSignal = (data: TradeSignalData) => {
      callbacksRef.current.onTradeSignal?.(data)
      
      toast.success(`Trade Signal: ${data.side.toUpperCase()} ${data.symbol}`, {
        duration: 5000,
        icon: '📈'
      })
    }

    const handlePortfolioUpdate = (data: PortfolioUpdateData) => {
      callbacksRef.current.onPortfolioUpdate?.(data)
    }

    const handleRiskAlert = (data: RiskAlertData) => {
      callbacksRef.current.onRiskAlert?.(data)
      
      const severity = data.severity
      const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : '⚡'
      const toastFn = severity === 'critical' ? toast.error : severity === 'high' ? toast : toast
      
      toastFn(`Risk Alert: ${data.message}`, {
        duration: severity === 'critical' ? 10000 : 6000,
        icon
      })
    }

    const handleMarketData = (data: MarketDataUpdate) => {
      callbacksRef.current.onMarketData?.(data)
    }

    const handleSystemStatus = (data: any) => {
      if (data.health < 0.8) {
        toast.error('System health degraded', { icon: '⚠️' })
      }
    }

    // Register event listeners
    client.on('connected', handleConnected)
    client.on('disconnected', handleDisconnected)
    client.on('error', handleError)
    client.on('reconnectFailed', handleReconnectFailed)
    client.on('message', handleMessage)
    client.on(AGUIMessageType.AGENT_DECISION, handleAgentDecision)
    client.on(AGUIMessageType.TRADE_SIGNAL, handleTradeSignal)
    client.on(AGUIMessageType.PORTFOLIO_UPDATE, handlePortfolioUpdate)
    client.on(AGUIMessageType.RISK_ALERT, handleRiskAlert)
    client.on(AGUIMessageType.MARKET_DATA, handleMarketData)
    client.on('systemStatus', handleSystemStatus)

    // Update connection state
    setConnectionState(client.connectionState)
    setIsConnected(client.isConnected)

    // Cleanup
    return () => {
      client.off('connected', handleConnected)
      client.off('disconnected', handleDisconnected)
      client.off('error', handleError)
      client.off('reconnectFailed', handleReconnectFailed)
      client.off('message', handleMessage)
      client.off(AGUIMessageType.AGENT_DECISION, handleAgentDecision)
      client.off(AGUIMessageType.TRADE_SIGNAL, handleTradeSignal)
      client.off(AGUIMessageType.PORTFOLIO_UPDATE, handlePortfolioUpdate)
      client.off(AGUIMessageType.RISK_ALERT, handleRiskAlert)
      client.off(AGUIMessageType.MARKET_DATA, handleMarketData)
      client.off('systemStatus', handleSystemStatus)
    }
  }, [debug])

  // Auto-connect
  useEffect(() => {
    if (autoConnect && clientRef.current && !isConnected) {
      connect()
    }
  }, [autoConnect])

  // Connection methods
  const connect = useCallback(async () => {
    if (!clientRef.current) return
    
    try {
      setConnectionState('connecting')
      await clientRef.current.connect()
    } catch (err: any) {
      setError(err.message || 'Failed to connect')
      setConnectionState('disconnected')
      throw err
    }
  }, [])

  const disconnect = useCallback(() => {
    if (!clientRef.current) return
    
    clientRef.current.disconnect()
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  // Messaging methods
  const sendAgentDecision = useCallback((agentId: string, decision: Partial<AgentDecisionData>) => {
    if (!clientRef.current) return
    
    clientRef.current.sendAgentDecision(agentId, decision)
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendTradeSignal = useCallback((signal: TradeSignalData) => {
    if (!clientRef.current) return
    
    clientRef.current.sendTradeSignal(signal)
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendPortfolioUpdate = useCallback((update: PortfolioUpdateData) => {
    if (!clientRef.current) return
    
    clientRef.current.sendPortfolioUpdate(update)
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendRiskAlert = useCallback((alert: RiskAlertData) => {
    if (!clientRef.current) return
    
    clientRef.current.sendRiskAlert(alert)
    setMessagesSent(prev => prev + 1)
  }, [])

  const sendMarketDataUpdate = useCallback((marketData: MarketDataUpdate) => {
    if (!clientRef.current) return
    
    clientRef.current.sendMarketDataUpdate(marketData)
    setMessagesSent(prev => prev + 1)
  }, [])

  const executeAgentCommand = useCallback((agentId: string, command: string, params: Record<string, any> = {}) => {
    if (!clientRef.current) return
    
    clientRef.current.executeAgentCommand(agentId, command, params)
    setMessagesSent(prev => prev + 1)
  }, [])

  // Channel management
  const subscribeToChannel = useCallback((channel: string) => {
    if (!clientRef.current) return
    
    clientRef.current.subscribeToChannel(channel)
    setSubscribedChannels(clientRef.current.subscribedChannelsList)
  }, [])

  const unsubscribeFromChannel = useCallback((channel: string) => {
    if (!clientRef.current) return
    
    clientRef.current.unsubscribeFromChannel(channel)
    setSubscribedChannels(clientRef.current.subscribedChannelsList)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current && isConnected) {
        clientRef.current.disconnect()
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
    
    // Channel management
    subscribeToChannel,
    unsubscribeFromChannel,
    subscribedChannels,
    
    // Statistics
    messagesReceived,
    messagesSent,
    lastMessage
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