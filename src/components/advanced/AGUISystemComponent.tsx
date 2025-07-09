'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MessageSquare, 
  Network, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'

interface ConnectionStatus {
  connected: boolean
  url: string
  lastPing: number
  messagesReceived: number
  messagesSent: number
  errors: number
}

export function AGUISystemComponent() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    url: '',
    lastPing: 0,
    messagesReceived: 0,
    messagesSent: 0,
    errors: 0
  })
  const [wsUrl, setWsUrl] = useState('ws://localhost:8000/ws/agui')
  const [isAttemptingConnection, setIsAttemptingConnection] = useState(false)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [systemEnabled, setSystemEnabled] = useState(false)

  // Mock WebSocket connection for demonstration
  const attemptConnection = async () => {
    setIsAttemptingConnection(true)
    
    try {
      // Simulate connection attempt
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo, randomly succeed or fail
      const success = Math.random() > 0.7
      
      if (success) {
        setConnectionStatus({
          connected: true,
          url: wsUrl,
          lastPing: Date.now(),
          messagesReceived: 0,
          messagesSent: 0,
          errors: 0
        })
        setSystemEnabled(true)
      } else {
        throw new Error('Connection failed - backend not available')
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, errors: prev.errors + 1 }))
      console.error('AG-UI Connection failed:', error)
    } finally {
      setIsAttemptingConnection(false)
    }
  }

  const disconnect = () => {
    setConnectionStatus({
      connected: false,
      url: '',
      lastPing: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0
    })
    setSystemEnabled(false)
  }

  const sendTestMessage = () => {
    if (connectionStatus.connected) {
      const testMessage = {
        type: 'test',
        data: { message: 'Test message from dashboard', timestamp: Date.now() }
      }
      
      setRecentMessages(prev => [...prev.slice(-9), testMessage])
      setConnectionStatus(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }))
    }
  }

  // Simulate incoming messages
  useEffect(() => {
    if (!connectionStatus.connected) return

    const interval = setInterval(() => {
      const mockMessages = [
        { type: 'agent.decision_made', data: { agent_id: 'agent_001', decision: 'Buy BTC' } },
        { type: 'trade.executed', data: { symbol: 'BTC/USD', action: 'buy', price: 43500 } },
        { type: 'portfolio.updated', data: { total_value: 12345.67 } },
        { type: 'system.health_check', data: { status: 'healthy' } }
      ]
      
      const message = mockMessages[Math.floor(Math.random() * mockMessages.length)]
      setRecentMessages(prev => [...prev.slice(-9), message])
      setConnectionStatus(prev => ({ ...prev, messagesReceived: prev.messagesReceived + 1 }))
    }, 3000)

    return () => clearInterval(interval)
  }, [connectionStatus.connected])

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4" />
              Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {connectionStatus.connected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>Received: {connectionStatus.messagesReceived}</div>
              <div>Sent: {connectionStatus.messagesSent}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="text-red-500">
                {connectionStatus.errors} errors
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>
            Configure and manage AG-UI WebSocket connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-url">WebSocket URL</Label>
            <Input
              id="ws-url"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:8000/ws/agui"
              disabled={connectionStatus.connected}
            />
          </div>
          
          <div className="flex gap-2">
            {!connectionStatus.connected ? (
              <Button
                onClick={attemptConnection}
                disabled={isAttemptingConnection}
                className="flex items-center gap-2"
              >
                {isAttemptingConnection ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAttemptingConnection ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={disconnect}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Disconnect
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={sendTestMessage}
              disabled={!connectionStatus.connected}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Send Test Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>
            Live stream of AG-UI protocol messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet. Connect to start receiving messages.
              </p>
            ) : (
              recentMessages.map((message, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {message.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    {JSON.stringify(message.data).slice(0, 50)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Warnings */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Experimental Feature:</strong> The AG-UI system requires a running backend server
          with WebSocket support. Connection failures are expected during development.
          This system was disabled from the main dashboard to prevent initialization errors.
        </AlertDescription>
      </Alert>
    </div>
  )
}