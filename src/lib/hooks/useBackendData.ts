/**
 * Backend Data Hook
 * React hook for managing backend API data with caching and error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { backendClient, APIResponse, PortfolioSummary, Position, AgentOverview, MonitoringHealth, SystemMetrics } from '@/lib/api/backend-client'

export interface BackendDataState {
  portfolio: PortfolioSummary | null
  positions: Position[]
  agents: AgentOverview | null
  monitoring: MonitoringHealth | null
  systemMetrics: SystemMetrics | null
  isConnected: boolean
  isLoading: boolean
  lastUpdate: Date | null
  error: string | null
}

export interface UseBackendDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  retryCount?: number
  enableMonitoring?: boolean
}

export function useBackendData(options: UseBackendDataOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds
    retryCount = 3,
    enableMonitoring = true
  } = options

  const [state, setState] = useState<BackendDataState>({
    portfolio: null,
    positions: [],
    agents: null,
    monitoring: null,
    systemMetrics: null,
    isConnected: false,
    isLoading: true,
    lastUpdate: null,
    error: null
  })

  const intervalRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)
  const isUnmountedRef = useRef(false)

  // Test backend connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const health = await backendClient.healthCheck()
      return health.status === 'healthy'
    } catch {
      return false
    }
  }, [])

  // Load portfolio data
  const loadPortfolioData = useCallback(async (): Promise<void> => {
    try {
      const [portfolioResponse, positionsResponse] = await Promise.all([
        backendClient.getPortfolioSummary(),
        backendClient.getPositions()
      ])

      if (!isUnmountedRef.current) {
        setState(prev => ({
          ...prev,
          portfolio: portfolioResponse.success ? portfolioResponse.data : null,
          positions: positionsResponse.success ? positionsResponse.data : [],
          error: portfolioResponse.success && positionsResponse.success ? null : 'Failed to load portfolio data'
        }))
      }
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('Portfolio data load error:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown portfolio error'
        }))
      }
    }
  }, [])

  // Load agent data
  const loadAgentData = useCallback(async (): Promise<void> => {
    try {
      const agentsResponse = await backendClient.getAgentsStatus()

      if (!isUnmountedRef.current) {
        setState(prev => ({
          ...prev,
          agents: agentsResponse.success ? agentsResponse.data : null,
          error: agentsResponse.success ? prev.error : 'Failed to load agent data'
        }))
      }
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('Agent data load error:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown agent error'
        }))
      }
    }
  }, [])

  // Load monitoring data
  const loadMonitoringData = useCallback(async (): Promise<void> => {
    if (!enableMonitoring) return

    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        backendClient.getOverallHealth(),
        backendClient.getSystemMetrics()
      ])

      if (!isUnmountedRef.current) {
        setState(prev => ({
          ...prev,
          monitoring: healthResponse.success ? healthResponse.data : null,
          systemMetrics: metricsResponse.success ? metricsResponse.data : null,
        }))
      }
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('Monitoring data load error:', error)
      }
    }
  }, [enableMonitoring])

  // Load all data
  const loadAllData = useCallback(async (): Promise<void> => {
    if (isUnmountedRef.current) return

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Test connection first
      const connected = await testConnection()
      
      if (!isUnmountedRef.current) {
        setState(prev => ({ ...prev, isConnected: connected }))
      }

      if (connected) {
        await Promise.all([
          loadPortfolioData(),
          loadAgentData(),
          loadMonitoringData()
        ])

        retryCountRef.current = 0 // Reset retry count on success

        if (!isUnmountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            lastUpdate: new Date(),
            error: null
          }))
        }
      } else {
        // Connection failed, but don't set error immediately - might be starting up
        if (!isUnmountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: retryCountRef.current >= retryCount ? 'Backend connection failed' : null
          }))
        }
      }
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('Data load error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }
  }, [testConnection, loadPortfolioData, loadAgentData, loadMonitoringData, retryCount])

  // Retry mechanism
  const retryLoad = useCallback(async (): Promise<void> => {
    if (retryCountRef.current < retryCount) {
      retryCountRef.current++
      console.log(`Retrying data load (${retryCountRef.current}/${retryCount})...`)
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000)
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          loadAllData()
        }
      }, delay)
    }
  }, [retryCount, loadAllData])

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    retryCountRef.current = 0
    await loadAllData()
  }, [loadAllData])

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(async () => {
        if (!isUnmountedRef.current) {
          await loadAllData()
        }
      }, refreshInterval)
    }

    setupInterval()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, loadAllData])

  // Initial load
  useEffect(() => {
    loadAllData()

    return () => {
      isUnmountedRef.current = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Auto-retry on errors
  useEffect(() => {
    if (state.error && !state.isLoading && retryCountRef.current < retryCount) {
      retryLoad()
    }
  }, [state.error, state.isLoading, retryLoad, retryCount])

  return {
    ...state,
    refresh,
    retryLoad,
    actions: {
      // Agent actions
      startAgent: async (agentId: string) => {
        const response = await backendClient.startAgent(agentId)
        if (response.success) {
          await loadAgentData()
        }
        return response
      },
      
      stopAgent: async (agentId: string) => {
        const response = await backendClient.stopAgent(agentId)
        if (response.success) {
          await loadAgentData()
        }
        return response
      },

      // Trading actions
      createOrder: async (order: any) => {
        const response = await backendClient.createOrder(order)
        if (response.success) {
          await loadPortfolioData()
        }
        return response
      },

      // Monitoring actions
      acknowledgeAlert: async (alertId: string) => {
        const response = await backendClient.acknowledgeAlert(alertId)
        if (response.success && enableMonitoring) {
          await loadMonitoringData()
        }
        return response
      },

      resolveAlert: async (alertId: string) => {
        const response = await backendClient.resolveAlert(alertId)
        if (response.success && enableMonitoring) {
          await loadMonitoringData()
        }
        return response
      }
    }
  }
}

// Export types
export type BackendDataActions = ReturnType<typeof useBackendData>['actions']