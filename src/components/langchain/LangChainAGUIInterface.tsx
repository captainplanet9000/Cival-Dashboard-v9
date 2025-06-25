/**
 * LangChain AG-UI Interface Component
 * Provides a React interface for LangChain AG-UI integration
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  Activity, 
  TrendingUp, 
  Shield, 
  Brain,
  MessageSquare,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
// Services will be lazy loaded to prevent circular dependencies
import { AGUIEvent, AGUITextEvent, AGUIProgressEvent } from '@/lib/ag-ui/types'
import MCPIntegrationPanel from './MCPIntegrationPanel'

interface LangChainAGUIInterfaceProps {
  className?: string
  autoStart?: boolean
  showThinking?: boolean
  maxEvents?: number
}

export function LangChainAGUIInterface({ 
  className, 
  autoStart = false,
  showThinking = true,
  maxEvents = 100
}: LangChainAGUIInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [events, setEvents] = useState<AGUIEvent[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [status, setStatus] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Lazy load services to prevent circular dependencies
   */
  useEffect(() => {
    const loadServices = async () => {
      try {
        // Only load on client side
        if (typeof window === 'undefined') {
          return
        }

        setIsLoading(true)
        
        const [
          { langChainAGUIIntegration },
          { langChainAGUIRegistry }
        ] = await Promise.all([
          import('@/lib/langchain/AGUIIntegration'),
          import('@/lib/ag-ui/langchain-registry')
        ])

        setServices({
          langChainAGUIIntegration,
          langChainAGUIRegistry
        })

      } catch (error) {
        console.error('Failed to load LangChain AG-UI services:', error)
        setError('Failed to load AG-UI services')
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  /**
   * Initialize the LangChain AG-UI integration
   */
  useEffect(() => {
    if (!services || isLoading) return

    const initializeIntegration = async () => {
      try {
        // Set up event listeners
        services.langChainAGUIIntegration.on('integration:started', () => {
          setIsStarted(true)
          setError(null)
        })

        services.langChainAGUIIntegration.on('integration:stopped', () => {
          setIsStarted(false)
        })

        services.langChainAGUIIntegration.on('agui:connected', () => {
          setIsConnected(true)
          setError(null)
        })

        services.langChainAGUIIntegration.on('agui:disconnected', () => {
          setIsConnected(false)
        })

        services.langChainAGUIIntegration.on('agui:error', (error) => {
          setError(error.message)
        })

        // Initialize registry
        await langChainAGUIRegistry.initialize()

        // Auto-start if configured
        if (autoStart) {
          await handleStart()
        }

        // Update agents and status periodically
        const updateInterval = setInterval(updateStatus, 5000)

        return () => {
          clearInterval(updateInterval)
        }

      } catch (error) {
        console.error('Failed to initialize LangChain AG-UI:', error)
        setError(error.toString())
      }
    }

    initializeIntegration()
  }, [services, isLoading, autoStart])

  /**
   * Update status and agents
   */
  const updateStatus = useCallback(async () => {
    if (!services) return
    
    try {
      const registeredAgents = services.langChainAGUIRegistry.getRegisteredAgents()
      const integrationStatus = services.langChainAGUIIntegration.getStatus()
      
      setAgents(registeredAgents)
      setStatus(integrationStatus)

      // Get recent events
      const eventHistory = langChainAGUIIntegration.getEventHistory()
      setEvents(eventHistory.slice(-maxEvents))

    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [maxEvents])

  /**
   * Start the integration
   */
  const handleStart = async () => {
    try {
      setIsProcessing(true)
      await services.langChainAGUIIntegration.start()
    } catch (error) {
      setError(error.toString())
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Stop the integration
   */
  const handleStop = async () => {
    try {
      setIsProcessing(true)
      await langChainAGUIIntegration.stop()
    } catch (error) {
      setError(error.toString())
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Send message to AG-UI
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    try {
      setIsProcessing(true)
      
      // Add user message to events
      const userEvent: AGUITextEvent = {
        id: `user_${Date.now()}`,
        type: 'text',
        timestamp: new Date(),
        source: 'human',
        content: inputMessage,
        role: 'user'
      }

      setEvents(prev => [...prev, userEvent])
      
      // Send to AG-UI system (this would be handled by the backend)
      // For now, we'll simulate a response
      await simulateAGUIResponse(inputMessage)
      
      setInputMessage('')
    } catch (error) {
      setError(error.toString())
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Simulate AG-UI response (replace with real integration)
   */
  const simulateAGUIResponse = async (message: string) => {
    // Simulate thinking
    if (showThinking) {
      const thinkingEvent: AGUIEvent = {
        id: `thinking_${Date.now()}`,
        type: 'thinking',
        timestamp: new Date(),
        source: 'agent',
        content: 'Processing your request...',
        visible: true
      }
      setEvents(prev => [...prev, thinkingEvent])
    }

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate response
    const responseEvent: AGUITextEvent = {
      id: `response_${Date.now()}`,
      type: 'text',
      timestamp: new Date(),
      source: 'agent',
      content: `I received your message: "${message}". The LangChain agents are processing this request.`,
      role: 'assistant'
    }

    setEvents(prev => [...prev, responseEvent])
  }

  /**
   * Render event item
   */
  const renderEvent = (event: AGUIEvent) => {
    switch (event.type) {
      case 'text':
        const textEvent = event as AGUITextEvent
        return (
          <div className={cn(
            'flex gap-3 p-3 rounded-lg',
            textEvent.source === 'human' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
          )}>
            <div className="flex-shrink-0">
              {textEvent.source === 'human' ? (
                <MessageSquare className="h-5 w-5 text-blue-500" />
              ) : (
                <Brain className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">
                {textEvent.source === 'human' ? 'You' : 'Assistant'}
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {textEvent.content}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {event.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        )

      case 'thinking':
        return (
          <div className="flex gap-3 p-3 rounded-lg bg-yellow-50 mr-8">
            <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-700">
                Thinking...
              </div>
              <div className="text-sm text-yellow-600">
                {(event as any).content}
              </div>
            </div>
          </div>
        )

      case 'progress':
        const progressEvent = event as AGUIProgressEvent
        return (
          <div className="p-3 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{progressEvent.message}</span>
            </div>
            <Progress 
              value={(progressEvent.current / progressEvent.total) * 100}
              className="h-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {progressEvent.current} / {progressEvent.total}
            </div>
          </div>
        )

      case 'error':
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-700">Error</AlertTitle>
            <AlertDescription className="text-red-600">
              {(event as any).error}
            </AlertDescription>
          </Alert>
        )

      default:
        return (
          <div className="p-3 rounded-lg bg-gray-100">
            <div className="text-sm font-medium">{event.type}</div>
            <div className="text-xs text-gray-500">
              {event.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center min-h-96', className)}>
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-purple-500 mx-auto mb-4" />
          <div className="text-lg font-semibold">Loading AG-UI Services...</div>
          <div className="text-gray-500 text-sm">Initializing LangChain integration</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                LangChain AG-UI Integration
              </CardTitle>
              <CardDescription>
                AI-powered trading agents with natural language interface
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant={isStarted ? 'default' : 'outline'}>
                {isStarted ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              onClick={isStarted ? handleStop : handleStart}
              disabled={isProcessing}
              variant={isStarted ? 'destructive' : 'default'}
            >
              {isStarted ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Integration
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Integration
                </>
              )}
            </Button>
            <Button
              onClick={updateStatus}
              variant="outline"
              disabled={isProcessing}
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Integration Error</AlertTitle>
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Agent Status ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{agent.name}</h4>
                    <Badge 
                      variant={agent.status === 'online' ? 'default' : 'secondary'}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Type: {agent.type}</div>
                    <div>Model: {agent.llmModel}</div>
                    <div>P&L: ${agent.performance.totalPnL.toFixed(2)}</div>
                    <div>Win Rate: {(agent.performance.winRate * 100).toFixed(1)}%</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agent Communication
          </CardTitle>
          <CardDescription>
            Interact with your trading agents using natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Events Display */}
          <ScrollArea className="h-96 w-full border rounded-lg p-4 mb-4">
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start a conversation with your agents!
                </div>
              ) : (
                events.map((event, index) => (
                  <div key={event.id || index}>
                    {renderEvent(event)}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask your agents about market conditions, portfolio status, or trading strategies..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="min-h-[60px]"
              disabled={!isConnected || isProcessing}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected || isProcessing}
            >
              Send
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage('Analyze the current market conditions')}
              disabled={isProcessing}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Market Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage('Show me my portfolio status')}
              disabled={isProcessing}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Portfolio Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage('Assess current risk levels')}
              disabled={isProcessing}
            >
              <Shield className="h-3 w-3 mr-1" />
              Risk Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{status.agentsRegistered || 0}</div>
              <div className="text-sm text-gray-500">Agents Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.eventHistory || 0}</div>
              <div className="text-sm text-gray-500">Events Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {isConnected ? (
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
                )}
              </div>
              <div className="text-sm text-gray-500">Connection Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {status.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString() : '--:--'}
              </div>
              <div className="text-sm text-gray-500">Last Update</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP Integration Panel */}
      <MCPIntegrationPanel />
    </div>
  )
}

export default LangChainAGUIInterface