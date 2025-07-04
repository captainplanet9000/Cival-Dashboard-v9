/**
 * Real-Time Orchestration Hook
 * Provides real-time updates for orchestration system with WebSocket integration
 */

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '../realtime/websocket'
import type {
  AgentAssignmentEvent,
  CapitalReallocationEvent,
  PerformanceUpdateEvent,
  FarmStatusEvent,
  GoalProgressEvent,
  OrchestrationSystemEvent
} from '../realtime/websocket'

interface OrchestrationRealTimeData {
  agentAssignments: AgentAssignmentEvent[]
  capitalReallocations: CapitalReallocationEvent[]
  performanceUpdates: PerformanceUpdateEvent[]
  farmStatusChanges: FarmStatusEvent[]
  goalProgressUpdates: GoalProgressEvent[]
  systemEvents: OrchestrationSystemEvent[]
}

interface OrchestrationMetrics {
  totalEvents: number
  criticalEventsCount: number
  recentAgentAssignments: number
  totalCapitalReallocated: number
  activePerformanceUpdates: number
  farmStatusChanges: number
  goalProgressEvents: number
  lastUpdateTime: number
}

interface UseRealTimeOrchestrationOptions {
  maxEvents?: number
  eventTypes?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
  autoSubscribe?: boolean
}

export function useRealTimeOrchestration(options: UseRealTimeOrchestrationOptions = {}) {
  const {
    maxEvents = 100,
    eventTypes = ['agent_assigned', 'capital_reallocated', 'performance_updated', 'farm_status_changed', 'goal_progress_updated'],
    priority,
    autoSubscribe = true
  } = options

  const { client, isConnected, on, off, subscribe, unsubscribe } = useWebSocket()

  // Real-time data state
  const [data, setData] = useState<OrchestrationRealTimeData>({
    agentAssignments: [],
    capitalReallocations: [],
    performanceUpdates: [],
    farmStatusChanges: [],
    goalProgressUpdates: [],
    systemEvents: []
  })

  // Metrics state
  const [metrics, setMetrics] = useState<OrchestrationMetrics>({
    totalEvents: 0,
    criticalEventsCount: 0,
    recentAgentAssignments: 0,
    totalCapitalReallocated: 0,
    activePerformanceUpdates: 0,
    farmStatusChanges: 0,
    goalProgressEvents: 0,
    lastUpdateTime: 0
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to update metrics
  const updateMetrics = useCallback((newData: OrchestrationRealTimeData) => {
    setMetrics(prev => ({
      totalEvents: newData.systemEvents.length,
      criticalEventsCount: newData.systemEvents.filter(e => e.priority === 'critical').length,
      recentAgentAssignments: newData.agentAssignments.filter(a => Date.now() - a.timestamp < 3600000).length, // Last hour
      totalCapitalReallocated: newData.capitalReallocations.reduce((sum, r) => sum + r.amount, 0),
      activePerformanceUpdates: newData.performanceUpdates.filter(p => Date.now() - p.timestamp < 300000).length, // Last 5 min
      farmStatusChanges: newData.farmStatusChanges.length,
      goalProgressEvents: newData.goalProgressUpdates.length,
      lastUpdateTime: Date.now()
    }))
  }, [])

  // Event handlers
  const handleAgentAssignment = useCallback((event: AgentAssignmentEvent) => {
    if (priority && event.assignmentType !== priority) return

    setData(prev => {
      const updated = {
        ...prev,
        agentAssignments: [event, ...prev.agentAssignments].slice(0, maxEvents)
      }
      updateMetrics(updated)
      return updated
    })
  }, [maxEvents, priority, updateMetrics])

  const handleCapitalReallocation = useCallback((event: CapitalReallocationEvent) => {
    setData(prev => {
      const updated = {
        ...prev,
        capitalReallocations: [event, ...prev.capitalReallocations].slice(0, maxEvents)
      }
      updateMetrics(updated)
      return updated
    })
  }, [maxEvents, updateMetrics])

  const handlePerformanceUpdate = useCallback((event: PerformanceUpdateEvent) => {
    setData(prev => {
      const updated = {
        ...prev,
        performanceUpdates: [event, ...prev.performanceUpdates].slice(0, maxEvents)
      }
      updateMetrics(updated)
      return updated
    })
  }, [maxEvents, updateMetrics])

  const handleFarmStatusChange = useCallback((event: FarmStatusEvent) => {
    setData(prev => {
      const updated = {
        ...prev,
        farmStatusChanges: [event, ...prev.farmStatusChanges].slice(0, maxEvents)
      }
      updateMetrics(updated)
      return updated
    })
  }, [maxEvents, updateMetrics])

  const handleGoalProgressUpdate = useCallback((event: GoalProgressEvent) => {
    setData(prev => {
      const updated = {
        ...prev,
        goalProgressUpdates: [event, ...prev.goalProgressUpdates].slice(0, maxEvents)
      }
      updateMetrics(updated)
      return updated
    })
  }, [maxEvents, updateMetrics])

  const handleOrchestrationEvent = useCallback((event: OrchestrationSystemEvent) => {
    if (priority && event.priority !== priority) return

    setData(prev => {
      const updated = {
        ...prev,
        systemEvents: [event, ...prev.systemEvents].slice(0, maxEvents)
      }
      updateMetrics(updated)
      return updated
    })
  }, [maxEvents, priority, updateMetrics])

  // Subscribe to events
  useEffect(() => {
    if (!isConnected || !autoSubscribe) return

    const cleanup: (() => void)[] = []

    // Subscribe to individual event types
    if (eventTypes.includes('agent_assigned')) {
      on('agent_assigned', handleAgentAssignment)
      subscribe('agent_assignments')
      cleanup.push(() => {
        off('agent_assigned', handleAgentAssignment)
        unsubscribe('agent_assignments')
      })
    }

    if (eventTypes.includes('capital_reallocated')) {
      on('capital_reallocated', handleCapitalReallocation)
      subscribe('capital_reallocations')
      cleanup.push(() => {
        off('capital_reallocated', handleCapitalReallocation)
        unsubscribe('capital_reallocations')
      })
    }

    if (eventTypes.includes('performance_updated')) {
      on('performance_updated', handlePerformanceUpdate)
      subscribe('performance_updates')
      cleanup.push(() => {
        off('performance_updated', handlePerformanceUpdate)
        unsubscribe('performance_updates')
      })
    }

    if (eventTypes.includes('farm_status_changed')) {
      on('farm_status_changed', handleFarmStatusChange)
      subscribe('farm_status_changes')
      cleanup.push(() => {
        off('farm_status_changed', handleFarmStatusChange)
        unsubscribe('farm_status_changes')
      })
    }

    if (eventTypes.includes('goal_progress_updated')) {
      on('goal_progress_updated', handleGoalProgressUpdate)
      subscribe('goal_progress_updates')
      cleanup.push(() => {
        off('goal_progress_updated', handleGoalProgressUpdate)
        unsubscribe('goal_progress_updates')
      })
    }

    // Subscribe to general orchestration events
    on('orchestration_event', handleOrchestrationEvent)
    subscribe('orchestration_events')
    cleanup.push(() => {
      off('orchestration_event', handleOrchestrationEvent)
      unsubscribe('orchestration_events')
    })

    setIsLoading(false)
    setError(null)

    return () => {
      cleanup.forEach(fn => fn())
    }
  }, [
    isConnected,
    autoSubscribe,
    eventTypes,
    on,
    off,
    subscribe,
    unsubscribe,
    handleAgentAssignment,
    handleCapitalReallocation,
    handlePerformanceUpdate,
    handleFarmStatusChange,
    handleGoalProgressUpdate,
    handleOrchestrationEvent
  ])

  // Manual subscription controls
  const subscribeToEvent = useCallback((eventType: string) => {
    if (!isConnected) return

    switch (eventType) {
      case 'agent_assigned':
        on('agent_assigned', handleAgentAssignment)
        subscribe('agent_assignments')
        break
      case 'capital_reallocated':
        on('capital_reallocated', handleCapitalReallocation)
        subscribe('capital_reallocations')
        break
      case 'performance_updated':
        on('performance_updated', handlePerformanceUpdate)
        subscribe('performance_updates')
        break
      case 'farm_status_changed':
        on('farm_status_changed', handleFarmStatusChange)
        subscribe('farm_status_changes')
        break
      case 'goal_progress_updated':
        on('goal_progress_updated', handleGoalProgressUpdate)
        subscribe('goal_progress_updates')
        break
    }
  }, [
    isConnected,
    on,
    subscribe,
    handleAgentAssignment,
    handleCapitalReallocation,
    handlePerformanceUpdate,
    handleFarmStatusChange,
    handleGoalProgressUpdate
  ])

  const unsubscribeFromEvent = useCallback((eventType: string) => {
    switch (eventType) {
      case 'agent_assigned':
        off('agent_assigned', handleAgentAssignment)
        unsubscribe('agent_assignments')
        break
      case 'capital_reallocated':
        off('capital_reallocated', handleCapitalReallocation)
        unsubscribe('capital_reallocations')
        break
      case 'performance_updated':
        off('performance_updated', handlePerformanceUpdate)
        unsubscribe('performance_updates')
        break
      case 'farm_status_changed':
        off('farm_status_changed', handleFarmStatusChange)
        unsubscribe('farm_status_changes')
        break
      case 'goal_progress_updated':
        off('goal_progress_updated', handleGoalProgressUpdate)
        unsubscribe('goal_progress_updates')
        break
    }
  }, [
    off,
    unsubscribe,
    handleAgentAssignment,
    handleCapitalReallocation,
    handlePerformanceUpdate,
    handleFarmStatusChange,
    handleGoalProgressUpdate
  ])

  // Filter functions
  const getEventsByPriority = useCallback((priority: 'low' | 'medium' | 'high' | 'critical') => {
    return data.systemEvents.filter(event => event.priority === priority)
  }, [data.systemEvents])

  const getEventsByTimeRange = useCallback((hours: number) => {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return {
      agentAssignments: data.agentAssignments.filter(e => e.timestamp > cutoff),
      capitalReallocations: data.capitalReallocations.filter(e => e.timestamp > cutoff),
      performanceUpdates: data.performanceUpdates.filter(e => e.timestamp > cutoff),
      farmStatusChanges: data.farmStatusChanges.filter(e => e.timestamp > cutoff),
      goalProgressUpdates: data.goalProgressUpdates.filter(e => e.timestamp > cutoff),
      systemEvents: data.systemEvents.filter(e => e.timestamp > cutoff)
    }
  }, [data])

  const getEventsByType = useCallback((eventType: string) => {
    return data.systemEvents.filter(event => event.eventType === eventType)
  }, [data.systemEvents])

  // Clear data functions
  const clearAllData = useCallback(() => {
    setData({
      agentAssignments: [],
      capitalReallocations: [],
      performanceUpdates: [],
      farmStatusChanges: [],
      goalProgressUpdates: [],
      systemEvents: []
    })
    setMetrics({
      totalEvents: 0,
      criticalEventsCount: 0,
      recentAgentAssignments: 0,
      totalCapitalReallocated: 0,
      activePerformanceUpdates: 0,
      farmStatusChanges: 0,
      goalProgressEvents: 0,
      lastUpdateTime: 0
    })
  }, [])

  const clearEventType = useCallback((eventType: keyof OrchestrationRealTimeData) => {
    setData(prev => {
      const updated = { ...prev, [eventType]: [] }
      updateMetrics(updated)
      return updated
    })
  }, [updateMetrics])

  return {
    // Data
    data,
    metrics,
    
    // State
    isLoading,
    error,
    isConnected,
    
    // Controls
    subscribeToEvent,
    unsubscribeFromEvent,
    clearAllData,
    clearEventType,
    
    // Filters
    getEventsByPriority,
    getEventsByTimeRange,
    getEventsByType,
    
    // Raw WebSocket client access
    client
  }
}

export default useRealTimeOrchestration