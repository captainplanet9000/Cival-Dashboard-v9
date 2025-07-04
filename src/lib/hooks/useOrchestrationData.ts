import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

interface OrchestrationMetrics {
  totalAgents: number
  activeFarms: number
  activeGoals: number
  totalCapitalDeployed: number
  averagePerformance: number
  eventCount24h: number
  systemHealth: number
}

interface AgentFarmData {
  farms: Array<{
    farm_id: string
    name: string
    strategy_type: string
    agent_count: number
    capital_allocated: number
    performance: number
    status: string
    agents: Array<{
      agent_id: string
      name: string
      status: string
      performance: number
      capital_assigned: number
      last_activity: string
    }>
  }>
}

interface CapitalFlowData {
  flows: Array<{
    flow_id: string
    source_type: string
    source_id: string
    target_type: string
    target_id: string
    amount: number
    flow_type: string
    timestamp: string
    status: string
  }>
  allocations: Array<{
    goal_id: string
    goal_name: string
    total_allocation: number
    farms: Array<{
      farm_id: string
      farm_name: string
      allocation: number
      utilization: number
    }>
  }>
}

interface PerformanceData {
  rankings: Array<{
    entity_id: string
    entity_type: string
    rank: number
    performance: number
    confidence: number
  }>
  attributions: Array<{
    entity_id: string
    level: string
    total_return: number
    attributed_return: number
    contributions: Record<string, number>
  }>
  top_agents: Array<{
    agent_id: string
    strategy: string
    performance: number
    pnl: number
    trades: number
  }>
}

interface EventData {
  recent_events: Array<{
    event_id: string
    event_type: string
    source_service: string
    priority: string
    timestamp: string
    description?: string
  }>
  live_events: Array<{
    event_id: string
    event_type: string
    data: any
    timestamp: string
  }>
  event_count_24h: number
}

export function useOrchestrationData() {
  const [metrics, setMetrics] = useState<OrchestrationMetrics | null>(null)
  const [agentFarmData, setAgentFarmData] = useState<AgentFarmData | null>(null)
  const [capitalFlowData, setCapitalFlowData] = useState<CapitalFlowData | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket connection for real-time updates
  const { isConnected, subscribe, sendMessage } = useWebSocket()

  // API endpoints
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/orchestration/metrics`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch orchestration metrics:', error)
      // Use mock data as fallback
      setMetrics({
        totalAgents: 12,
        activeFarms: 4,
        activeGoals: 6,
        totalCapitalDeployed: 250000,
        averagePerformance: 2.34,
        eventCount24h: 1247,
        systemHealth: 95
      })
    }
  }, [API_BASE])

  const fetchAgentFarmData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/orchestration/agent-farms`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setAgentFarmData(data)
    } catch (error) {
      console.error('Failed to fetch agent-farm data:', error)
      // Mock data fallback
      setAgentFarmData({
        farms: [
          {
            farm_id: 'farm_001',
            name: 'Momentum Trading Farm',
            strategy_type: 'momentum',
            agent_count: 3,
            capital_allocated: 75000,
            performance: 3.2,
            status: 'active',
            agents: [
              {
                agent_id: 'agent_001',
                name: 'Marcus Momentum',
                status: 'active',
                performance: 4.1,
                capital_assigned: 25000,
                last_activity: new Date().toISOString()
              },
              {
                agent_id: 'agent_002',
                name: 'Alpha Trader',
                status: 'active',
                performance: 2.8,
                capital_assigned: 25000,
                last_activity: new Date().toISOString()
              },
              {
                agent_id: 'agent_003',
                name: 'Beta Scalper',
                status: 'active',
                performance: 2.7,
                capital_assigned: 25000,
                last_activity: new Date().toISOString()
              }
            ]
          },
          {
            farm_id: 'farm_002',
            name: 'Arbitrage Farm',
            strategy_type: 'arbitrage',
            agent_count: 4,
            capital_allocated: 100000,
            performance: 1.8,
            status: 'active',
            agents: [
              {
                agent_id: 'agent_004',
                name: 'Alex Arbitrage',
                status: 'active',
                performance: 2.1,
                capital_assigned: 30000,
                last_activity: new Date().toISOString()
              },
              {
                agent_id: 'agent_005',
                name: 'Cross Exchange Bot',
                status: 'active',
                performance: 1.9,
                capital_assigned: 25000,
                last_activity: new Date().toISOString()
              }
            ]
          }
        ]
      })
    }
  }, [API_BASE])

  const fetchCapitalFlowData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/orchestration/capital-flow`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setCapitalFlowData(data)
    } catch (error) {
      console.error('Failed to fetch capital flow data:', error)
      // Mock data fallback
      setCapitalFlowData({
        flows: [
          {
            flow_id: 'flow_001',
            source_type: 'goal',
            source_id: 'goal_001',
            target_type: 'farm',
            target_id: 'farm_001',
            amount: 50000,
            flow_type: 'allocation',
            timestamp: new Date().toISOString(),
            status: 'completed'
          },
          {
            flow_id: 'flow_002',
            source_type: 'farm',
            source_id: 'farm_001',
            target_type: 'agent',
            target_id: 'agent_001',
            amount: 15000,
            flow_type: 'assignment',
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        ],
        allocations: [
          {
            goal_id: 'goal_001',
            goal_name: 'Q1 Growth Target',
            total_allocation: 150000,
            farms: [
              {
                farm_id: 'farm_001',
                farm_name: 'Momentum Trading Farm',
                allocation: 75000,
                utilization: 0.85
              },
              {
                farm_id: 'farm_002',
                farm_name: 'Arbitrage Farm',
                allocation: 75000,
                utilization: 0.92
              }
            ]
          }
        ]
      })
    }
  }, [API_BASE])

  const fetchPerformanceData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/orchestration/performance`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setPerformanceData(data)
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
      // Mock data fallback
      setPerformanceData({
        rankings: [
          {
            entity_id: 'agent_001',
            entity_type: 'agent',
            rank: 1,
            performance: 4.1,
            confidence: 0.95
          },
          {
            entity_id: 'agent_004',
            entity_type: 'agent',
            rank: 2,
            performance: 2.1,
            confidence: 0.88
          }
        ],
        attributions: [
          {
            entity_id: 'farm_001',
            level: 'farm',
            total_return: 2400,
            attributed_return: 2200,
            contributions: {
              'agent_001': 1200,
              'agent_002': 700,
              'agent_003': 500
            }
          }
        ],
        top_agents: [
          {
            agent_id: 'agent_001',
            strategy: 'momentum',
            performance: 4.1,
            pnl: 1025,
            trades: 24
          },
          {
            agent_id: 'agent_004',
            strategy: 'arbitrage',
            performance: 2.1,
            pnl: 630,
            trades: 18
          },
          {
            agent_id: 'agent_002',
            strategy: 'momentum',
            performance: 2.8,
            pnl: 700,
            trades: 19
          }
        ]
      })
    }
  }, [API_BASE])

  const fetchEventData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/orchestration/events`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setEventData(data)
    } catch (error) {
      console.error('Failed to fetch event data:', error)
      // Mock data fallback
      setEventData({
        recent_events: [
          {
            event_id: 'evt_001',
            event_type: 'agent_assigned',
            source_service: 'farm_orchestrator',
            priority: 'medium',
            timestamp: new Date().toISOString(),
            description: 'Agent assigned to momentum farm'
          },
          {
            event_id: 'evt_002',
            event_type: 'capital_allocated',
            source_service: 'capital_manager',
            priority: 'high',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            description: 'Capital allocated to arbitrage farm'
          },
          {
            event_id: 'evt_003',
            event_type: 'performance_calculated',
            source_service: 'attribution_engine',
            priority: 'low',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            description: 'Performance attribution updated'
          }
        ],
        live_events: [],
        event_count_24h: 1247
      })
    }
  }, [API_BASE])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchMetrics(),
        fetchAgentFarmData(),
        fetchCapitalFlowData(),
        fetchPerformanceData(),
        fetchEventData()
      ])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [fetchMetrics, fetchAgentFarmData, fetchCapitalFlowData, fetchPerformanceData, fetchEventData])

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return

    // Subscribe to orchestration events
    const unsubscribeMetrics = subscribe('orchestration_metrics_update', (data) => {
      setMetrics(data)
    })

    const unsubscribeAgentFarm = subscribe('agent_farm_update', (data) => {
      setAgentFarmData(current => {
        if (!current) return data
        // Merge with existing data
        return { ...current, ...data }
      })
    })

    const unsubscribeCapitalFlow = subscribe('capital_flow_update', (data) => {
      setCapitalFlowData(current => {
        if (!current) return data
        // Merge with existing data
        return { ...current, ...data }
      })
    })

    const unsubscribePerformance = subscribe('performance_update', (data) => {
      setPerformanceData(current => {
        if (!current) return data
        // Merge with existing data
        return { ...current, ...data }
      })
    })

    const unsubscribeEvents = subscribe('orchestration_event', (data) => {
      setEventData(current => {
        if (!current) return { recent_events: [data], live_events: [data], event_count_24h: 1 }
        
        return {
          ...current,
          recent_events: [data, ...current.recent_events].slice(0, 10),
          live_events: [data, ...current.live_events].slice(0, 5)
        }
      })
    })

    return () => {
      unsubscribeMetrics()
      unsubscribeAgentFarm()
      unsubscribeCapitalFlow()
      unsubscribePerformance()
      unsubscribeEvents()
    }
  }, [isConnected, subscribe])

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isLoading, refreshData])

  return {
    metrics,
    agentFarmData,
    capitalFlowData,
    performanceData,
    eventData,
    isLoading,
    error,
    refreshData,
    isConnected
  }
}