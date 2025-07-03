'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { EnhancedWebSocketClient, ConnectionState, getWebSocketClient } from '@/lib/websocket/enhanced-websocket-client'
import { useToast } from '@/components/ui/use-toast'

interface WebSocketContextType {
  client: EnhancedWebSocketClient
  connectionState: ConnectionState
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  sendMessage: (type: string, data: any) => void
  subscribe: (type: string, callback: (data: any) => void) => () => void
  request: <T = any>(type: string, data: any) => Promise<T>
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const client = useRef(getWebSocketClient())
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const ws = client.current

    // Set up event listeners
    const handleConnected = () => {
      setConnectionState('connected')
      setIsConnected(true)
      toast({
        title: 'Connected',
        description: 'Real-time connection established',
        variant: 'default'
      })
    }

    const handleDisconnected = () => {
      setConnectionState('disconnected')
      setIsConnected(false)
      toast({
        title: 'Disconnected',
        description: 'Real-time connection lost',
        variant: 'destructive'
      })
    }

    const handleConnecting = () => {
      setConnectionState('connecting')
    }

    const handleError = (error: Error) => {
      setConnectionState('error')
      toast({
        title: 'Connection Error',
        description: error.message,
        variant: 'destructive'
      })
    }

    const handleNotification = (data: any) => {
      toast({
        title: data.title || 'Notification',
        description: data.message,
        variant: data.priority > 7 ? 'destructive' : 'default'
      })
    }

    // Register event handlers
    ws.on('connected', handleConnected)
    ws.on('disconnected', handleDisconnected)
    ws.on('connecting', handleConnecting)
    ws.on('error', handleError)
    ws.on('notification', handleNotification)

    // Auto-connect on mount
    ws.connect()

    // Cleanup
    return () => {
      ws.off('connected', handleConnected)
      ws.off('disconnected', handleDisconnected)
      ws.off('connecting', handleConnecting)
      ws.off('error', handleError)
      ws.off('notification', handleNotification)
      ws.disconnect()
    }
  }, [toast])

  const sendMessage = useCallback((type: string, data: any) => {
    client.current.sendEvent(type, data)
  }, [])

  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    return client.current.subscribe(type, callback)
  }, [])

  const request = useCallback(<T = any>(type: string, data: any) => {
    return client.current.request<T>(type, data)
  }, [])

  const value: WebSocketContextType = {
    client: client.current,
    connectionState,
    isConnected,
    connect: () => client.current.connect(),
    disconnect: () => client.current.disconnect(),
    sendMessage,
    subscribe,
    request
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}

// Specialized hooks for common subscriptions
export function useMarketData(symbol: string) {
  const { subscribe } = useWebSocketContext()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = subscribe(`market.update.${symbol}`, (newData) => {
      setData(newData)
    })

    return unsubscribe
  }, [symbol, subscribe])

  return data
}

export function usePortfolioUpdates() {
  const { subscribe } = useWebSocketContext()
  const [portfolio, setPortfolio] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = subscribe('portfolio.update', (data) => {
      setPortfolio(data)
    })

    return unsubscribe
  }, [subscribe])

  return portfolio
}

export function useAgentUpdates(agentId?: string) {
  const { subscribe } = useWebSocketContext()
  const [agents, setAgents] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    const eventType = agentId ? `agent.update.${agentId}` : 'agent.update'
    
    const unsubscribe = subscribe(eventType, (data) => {
      setAgents(prev => {
        const newMap = new Map(prev)
        newMap.set(data.id, data)
        return newMap
      })
    })

    return unsubscribe
  }, [agentId, subscribe])

  return agentId ? agents.get(agentId) : Array.from(agents.values())
}

export function useTradeNotifications() {
  const { subscribe } = useWebSocketContext()
  const [trades, setTrades] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = subscribe('trade.executed', (trade) => {
      setTrades(prev => [trade, ...prev].slice(0, 100)) // Keep last 100 trades
    })

    return unsubscribe
  }, [subscribe])

  return trades
}

export function useRiskAlerts() {
  const { subscribe } = useWebSocketContext()
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = subscribe('risk.alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)) // Keep last 50 alerts
    })

    return unsubscribe
  }, [subscribe])

  return alerts
}

// Connection status component
export function WebSocketStatus() {
  const { connectionState, isConnected } = useWebSocketContext()

  const statusColor = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
    error: 'bg-red-700'
  }[connectionState]

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
      <span className="text-xs text-muted-foreground capitalize">
        {connectionState}
      </span>
    </div>
  )
}