"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  X, 
  Minimize2, 
  Maximize2,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Event {
  event_id: string
  event_type: string
  data: any
  timestamp: string
  priority?: string
  source_service?: string
}

interface EventMonitorViewProps {
  events: Event[]
}

export function EventMonitorView({ events = [] }: EventMonitorViewProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [displayEvents, setDisplayEvents] = useState<Event[]>([])

  useEffect(() => {
    if (events && events.length > 0) {
      // Keep only the latest 10 events
      setDisplayEvents(events.slice(0, 10))
    }
  }, [events])

  const getEventIcon = (eventType: string, priority?: string) => {
    if (priority === 'critical' || priority === 'high') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    
    switch (eventType) {
      case 'agent_assigned':
      case 'agent_unassigned':
      case 'farm_agent_added':
      case 'farm_agent_removed':
        return <Activity className="h-4 w-4 text-blue-500" />
      
      case 'capital_allocated':
      case 'capital_reallocated':
      case 'goal_capital_allocated':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      
      case 'performance_calculated':
      case 'attribution_updated':
      case 'ranking_changed':
        return <Info className="h-4 w-4 text-purple-500" />
      
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'agent_assigned': 'Agent Assigned',
      'agent_unassigned': 'Agent Unassigned',
      'agent_performance_update': 'Performance Update',
      'agent_decision_made': 'Decision Made',
      'agent_trade_executed': 'Trade Executed',
      'farm_created': 'Farm Created',
      'farm_updated': 'Farm Updated',
      'farm_rebalanced': 'Farm Rebalanced',
      'farm_agent_added': 'Agent Added to Farm',
      'farm_agent_removed': 'Agent Removed from Farm',
      'goal_created': 'Goal Created',
      'goal_updated': 'Goal Updated',
      'goal_achieved': 'Goal Achieved',
      'goal_progress_update': 'Goal Progress',
      'capital_allocated': 'Capital Allocated',
      'capital_reallocated': 'Capital Reallocated',
      'performance_calculated': 'Performance Calculated',
      'attribution_updated': 'Attribution Updated',
      'ranking_changed': 'Ranking Changed'
    }
    return labels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const formatEventData = (data: any) => {
    if (!data) return ''
    
    // Extract meaningful information from event data
    if (data.agent_id) return `Agent: ${data.agent_id}`
    if (data.farm_id) return `Farm: ${data.farm_id}`
    if (data.goal_id) return `Goal: ${data.goal_id}`
    if (data.amount) return `Amount: $${data.amount.toLocaleString()}`
    if (data.performance) return `Performance: ${data.performance > 0 ? '+' : ''}${data.performance.toFixed(2)}%`
    
    return JSON.stringify(data).slice(0, 50) + (JSON.stringify(data).length > 50 ? '...' : '')
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full shadow-lg"
          size="sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          Events ({displayEvents.length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-full">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Live Events</span>
              {displayEvents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {displayEvents.length}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {displayEvents.length > 0 ? (
                <div className="space-y-1">
                  {displayEvents.map((event, index) => (
                    <div
                      key={`${event.event_id}-${index}`}
                      className={cn(
                        "p-3 border-l-4 hover:bg-gray-50 transition-colors",
                        event.priority === 'critical' && "border-red-500 bg-red-50",
                        event.priority === 'high' && "border-orange-500 bg-orange-50",
                        event.priority === 'medium' && "border-blue-500 bg-blue-50",
                        !event.priority && "border-gray-300"
                      )}
                    >
                      <div className="flex items-start space-x-2">
                        {getEventIcon(event.event_type, event.priority)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">
                              {getEventTypeLabel(event.event_type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          
                          {event.data && (
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {formatEventData(event.data)}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            {event.priority && (
                              <Badge className={getPriorityColor(event.priority)} variant="outline">
                                {event.priority}
                              </Badge>
                            )}
                            
                            {event.source_service && (
                              <span className="text-xs text-muted-foreground">
                                {event.source_service}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent events</p>
                </div>
              )}
            </div>
            
            {displayEvents.length > 0 && (
              <div className="p-2 border-t bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setDisplayEvents([])}
                >
                  Clear Events
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}