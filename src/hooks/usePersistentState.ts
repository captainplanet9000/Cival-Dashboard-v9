/**
 * React hooks for persistent state management across Railway deployments
 * Integrates with PersistenceManager for multi-tier storage
 */

import { useState, useEffect, useCallback } from 'react'
import { persistenceManager } from '@/lib/persistence/persistence-manager'

/**
 * Hook for persistent user state with automatic save/load
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  userId: string = 'solo-operator'
): [T, (value: T) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await persistenceManager.getDashboardState(userId, key)
        if (stored !== null) {
          setState(stored)
        }
      } catch (error) {
        console.error(`Failed to load persistent state for ${key}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadState()
  }, [key, userId])

  // Save state with debouncing
  const setPersistentState = useCallback(
    async (value: T) => {
      setState(value)
      try {
        await persistenceManager.saveDashboardState(userId, key, value)
      } catch (error) {
        console.error(`Failed to save persistent state for ${key}:`, error)
      }
    },
    [key, userId]
  )

  return [state, setPersistentState, isLoading]
}

/**
 * Hook for agent-specific persistent configuration
 */
export function useAgentConfig(agentId: string) {
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load agent configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const agentConfig = await persistenceManager.getAgentConfig(agentId)
        setConfig(agentConfig)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent config')
        console.error(`Failed to load config for agent ${agentId}:`, err)
      } finally {
        setIsLoading(false)
      }
    }

    if (agentId) {
      loadConfig()
    }
  }, [agentId])

  // Save agent configuration
  const saveConfig = useCallback(
    async (newConfig: any) => {
      try {
        setError(null)
        const configWithMeta = {
          agent_id: agentId,
          name: newConfig.name || `Agent ${agentId}`,
          strategy_config: newConfig.strategy_config || {},
          risk_config: newConfig.risk_config || {},
          trading_config: newConfig.trading_config || {},
          is_active: newConfig.is_active || false,
          auto_start: newConfig.auto_start || false,
          created_at: newConfig.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newConfig
        }

        const success = await persistenceManager.saveAgentConfig(agentId, configWithMeta)
        if (success) {
          setConfig(configWithMeta)
          console.log(`✅ Agent config saved successfully: ${agentId}`)
        } else {
          throw new Error('Failed to save configuration')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save agent config')
        console.error(`Failed to save config for agent ${agentId}:`, err)
      }
    },
    [agentId]
  )

  // Update specific config field
  const updateConfigField = useCallback(
    async (field: string, value: any) => {
      if (!config) return

      const updatedConfig = {
        ...config,
        [field]: value,
        updated_at: new Date().toISOString()
      }

      await saveConfig(updatedConfig)
    },
    [config, saveConfig]
  )

  return {
    config,
    isLoading,
    error,
    saveConfig,
    updateConfigField
  }
}

/**
 * Hook for chart configuration persistence
 */
export function useChartConfig(chartId: string) {
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load chart configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const chartConfig = await persistenceManager.getChartConfig(chartId)
        setConfig(chartConfig)
      } catch (error) {
        console.error(`Failed to load chart config for ${chartId}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    if (chartId) {
      loadConfig()
    }
  }, [chartId])

  // Save chart configuration
  const saveConfig = useCallback(
    async (newConfig: any) => {
      const configWithMeta = {
        chart_id: chartId,
        chart_type: newConfig.chart_type || 'candlestick',
        symbols: newConfig.symbols || [],
        timeframe: newConfig.timeframe || '1h',
        indicators: newConfig.indicators || [],
        layout: newConfig.layout || {},
        is_public: newConfig.is_public || false,
        created_at: newConfig.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newConfig
      }

      try {
        const success = await persistenceManager.saveChartConfig(chartId, configWithMeta)
        if (success) {
          setConfig(configWithMeta)
        }
      } catch (error) {
        console.error(`Failed to save chart config for ${chartId}:`, error)
      }
    },
    [chartId]
  )

  return {
    config,
    isLoading,
    saveConfig
  }
}

/**
 * Hook for filter state persistence
 */
export function useFilterState(componentId: string, defaultFilters: any = {}) {
  const [filters, setFilters] = useState(defaultFilters)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load filter state on mount
  useEffect(() => {
    const stored = persistenceManager.getFilterState(componentId)
    if (stored) {
      setFilters({ ...defaultFilters, ...stored })
    }
    setIsLoaded(true)
  }, [componentId, defaultFilters])

  // Save filter state with debouncing
  const updateFilters = useCallback(
    (newFilters: any) => {
      const updatedFilters = { ...filters, ...newFilters }
      setFilters(updatedFilters)
      persistenceManager.saveFilterState(componentId, updatedFilters)
    },
    [componentId, filters]
  )

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    persistenceManager.saveFilterState(componentId, defaultFilters)
  }, [componentId, defaultFilters])

  return {
    filters,
    updateFilters,
    resetFilters,
    isLoaded
  }
}

/**
 * Hook for session data (temporary storage)
 */
export function useSessionData<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [data, setData] = useState<T>(() => {
    const stored = persistenceManager.getSessionData(key)
    return stored !== null ? stored : defaultValue
  })

  const setSessionData = useCallback(
    (value: T) => {
      setData(value)
      persistenceManager.saveSessionData(key, value)
    },
    [key]
  )

  return [data, setSessionData]
}

/**
 * Hook for user preferences with automatic sync
 */
export function useUserPreferences(userId: string = 'solo-operator') {
  const [preferences, setPreferences] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userPrefs = await persistenceManager.getUserPreferences(userId)
        setPreferences(userPrefs)
      } catch (error) {
        console.error('Failed to load user preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [userId])

  // Save user preferences
  const updatePreferences = useCallback(
    async (newPreferences: any) => {
      try {
        const success = await persistenceManager.saveUserPreferences(userId, newPreferences)
        if (success) {
          setPreferences(newPreferences)
        }
      } catch (error) {
        console.error('Failed to save user preferences:', error)
      }
    },
    [userId]
  )

  // Update specific preference field
  const updatePreference = useCallback(
    async (field: string, value: any) => {
      if (!preferences) return

      const updatedPrefs = {
        ...preferences,
        [field]: value
      }

      await updatePreferences(updatedPrefs)
    },
    [preferences, updatePreferences]
  )

  return {
    preferences,
    isLoading,
    updatePreferences,
    updatePreference
  }
}

/**
 * Hook for dashboard layout persistence
 */
export function useDashboardLayout(pageId: string) {
  const [layout, setLayout] = usePersistentState(`dashboard_layout_${pageId}`, {
    columns: 2,
    rows: 3,
    widgets: []
  })

  const updateWidget = useCallback(
    (widgetId: string, updates: any) => {
      const updatedLayout = {
        ...layout,
        widgets: layout.widgets.map((widget: any) =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      }
      setLayout(updatedLayout)
    },
    [layout, setLayout]
  )

  const addWidget = useCallback(
    (widget: any) => {
      const updatedLayout = {
        ...layout,
        widgets: [...layout.widgets, { ...widget, id: widget.id || Date.now().toString() }]
      }
      setLayout(updatedLayout)
    },
    [layout, setLayout]
  )

  const removeWidget = useCallback(
    (widgetId: string) => {
      const updatedLayout = {
        ...layout,
        widgets: layout.widgets.filter((widget: any) => widget.id !== widgetId)
      }
      setLayout(updatedLayout)
    },
    [layout, setLayout]
  )

  return {
    layout,
    updateWidget,
    addWidget,
    removeWidget,
    setLayout
  }
}