/**
 * React Hook for WebSocket Management
 * Wraps the TradingWebSocketClient for easy React integration
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  TradingWebSocketClient, 
  createWebSocketClient, 
  WebSocketConfig,
  WebSocketMessage 
} from '@/lib/websocket/websocket-client'

interface UseWebSocketOptions extends Partial<WebSocketConfig> {
  autoConnect?: boolean
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface UseWebSocketReturn {
  isConnected: boolean
  connectionState: string
  client: TradingWebSocketClient | null
  connect: () => Promise<void>
  disconnect: () => void
  sendMessage: (type: string, data?: any) => boolean
  subscribe: (messageType: string, handler: (message: WebSocketMessage) => void) => () => void
  error: string | null
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    ...config
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('disconnected')
  const [error, setError] = useState<string | null>(null)
  
  const clientRef = useRef<TradingWebSocketClient | null>(null)
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map())

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = createWebSocketClient(config)
      
      // Set up event handlers
      const unsubscribeConnect = clientRef.current.onConnect(() => {
        setIsConnected(true)
        setConnectionState('connected')
        setError(null)
        onConnect?.()
      })

      const unsubscribeDisconnect = clientRef.current.onDisconnect(() => {
        setIsConnected(false)
        setConnectionState('disconnected')
        onDisconnect?.()
      })

      const unsubscribeError = clientRef.current.onError((err) => {
        setError(err.toString())
        onError?.(err)
      })

      // Global message handler
      const unsubscribeMessages = clientRef.current.on('*', (message) => {
        onMessage?.(message)
      })

      // Update connection state periodically
      const stateInterval = setInterval(() => {
        if (clientRef.current) {
          setConnectionState(clientRef.current.connectionState)
          setIsConnected(clientRef.current.isConnected)
        }
      }, 1000)

      // Cleanup function
      return () => {
        unsubscribeConnect()
        unsubscribeDisconnect()
        unsubscribeError()
        unsubscribeMessages()
        clearInterval(stateInterval)
        
        // Clean up all subscriptions
        subscriptionsRef.current.forEach(unsub => unsub())
        subscriptionsRef.current.clear()
        
        if (clientRef.current) {
          clientRef.current.disconnect()
          clientRef.current = null
        }
      }
    }
  }, [config, onMessage, onError, onConnect, onDisconnect])

  // Auto-connect
  useEffect(() => {
    if (autoConnect && clientRef.current && !isConnected && connectionState === 'disconnected') {
      clientRef.current.connect().catch(err => {
        setError(err.toString())
      })
    }
  }, [autoConnect, isConnected, connectionState])

  // Connect function
  const connect = useCallback(async () => {
    if (clientRef.current) {
      setError(null)
      try {
        await clientRef.current.connect()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed'
        setError(errorMessage)
        throw err
      }
    }
  }, [])

  // Disconnect function
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect()
    }
  }, [])

  // Send message function
  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (clientRef.current) {
      return clientRef.current.send(type, data)
    }
    return false
  }, [])

  // Subscribe function
  const subscribe = useCallback((messageType: string, handler: (message: WebSocketMessage) => void) => {
    if (clientRef.current) {
      const unsubscribe = clientRef.current.on(messageType, handler)
      
      // Store the unsubscribe function
      const subscriptionKey = `${messageType}_${Date.now()}_${Math.random()}`
      subscriptionsRef.current.set(subscriptionKey, unsubscribe)
      
      // Return a function that removes the subscription
      return () => {
        unsubscribe()
        subscriptionsRef.current.delete(subscriptionKey)
      }
    }
    return () => {} // No-op if client not available
  }, [])

  return {
    isConnected,
    connectionState,
    client: clientRef.current,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    error
  }
}

export default useWebSocket