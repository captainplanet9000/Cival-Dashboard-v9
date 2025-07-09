'use client'

import React, { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Settings, AlertTriangle } from 'lucide-react'

// Fallback AG-UI Provider - Safe wrapper with no dependencies
export function AGUIProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Fallback AG-UI Chat - Safe component with no WebSocket dependencies
export function AGUIChat() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AG-UI Chat System
          </CardTitle>
          <Badge variant="secondary">Disabled</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The AG-UI Chat system has been temporarily disabled to prevent initialization errors.
            This system is now available in the Advanced tab as an experimental feature.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            The AG-UI system provides real-time communication between AI agents but requires
            complex WebSocket infrastructure. To maintain system stability, it has been
            moved to the Advanced tab.
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
            <Button variant="outline" size="sm" disabled>
              Enable AG-UI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export hooks that return safe defaults
export function useAGUI() {
  return {
    isConnected: false,
    connectionState: 'disabled',
    error: null,
    connect: async () => {},
    disconnect: () => {},
    sendMessage: () => {},
    messagesReceived: 0,
    messagesSent: 0,
    events: []
  }
}

// Export simplified trading communication hook
export function useTradingCommunication() {
  return useAGUI()
}

// Export simplified agent communication hook  
export function useAgentCommunication() {
  return useAGUI()
}
