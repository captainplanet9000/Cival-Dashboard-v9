/**
 * Universal Trading Mode Hook
 * Provides system-wide trading mode coordination between paper and live trading
 * Integrates with backend universal trading mode service
 */

import React, { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { backendClient } from '@/lib/api/backend-client'
import { toast } from 'react-hot-toast'

export type TradingMode = 'paper' | 'live' | 'simulation' | 'backtest'

export interface TradingModeConfig {
  mode: TradingMode
  enabledExchanges: string[]
  riskLimits: Record<string, number>
  positionLimits: Record<string, number>
  safetyChecks: boolean
  realFunds: boolean
  liveData: boolean
  notifications: boolean
  auditLogging: boolean
  paperBalance: number
}

export interface ComponentModeStatus {
  componentId: string
  componentType: string
  currentMode: TradingMode
  lastUpdated: string
  status: 'synced' | 'updating' | 'error'
  errorMessage?: string
}

export interface ModeStatus {
  service: string
  currentMode: TradingMode
  config: TradingModeConfig
  components: Record<string, ComponentModeStatus>
  totalComponents: number
  syncedComponents: number
  errorComponents: number
  modeChangesToday: number
  lastModeChange?: string
}

export interface UseUniversalTradingModeReturn {
  // Current state
  currentMode: TradingMode
  config: TradingModeConfig | null
  modeStatus: ModeStatus | null
  loading: boolean
  error: string | null
  
  // Actions
  setTradingMode: (mode: TradingMode, config?: Partial<TradingModeConfig>) => Promise<boolean>
  toggleTradingMode: () => Promise<boolean>
  refreshStatus: () => Promise<void>
  registerComponent: (componentId: string, componentType: string) => Promise<boolean>
  unregisterComponent: (componentId: string) => Promise<boolean>
  
  // Computed properties
  isLiveMode: boolean
  isPaperMode: boolean
  isSimulationMode: boolean
  allComponentsSynced: boolean
  hasErrors: boolean
}

const DEFAULT_CONFIG: TradingModeConfig = {
  mode: 'paper',
  enabledExchanges: ['binance', 'coinbase'],
  riskLimits: {
    maxPositionSize: 0.1,
    maxDailyLoss: 0.05,
    maxPortfolioRisk: 0.15
  },
  positionLimits: {
    maxSinglePosition: 0.05,
    maxSectorAllocation: 0.3,
    maxLeverage: 1.0
  },
  safetyChecks: true,
  realFunds: false,
  liveData: false,
  notifications: true,
  auditLogging: true,
  paperBalance: 100000.0
}

export function useUniversalTradingMode(): UseUniversalTradingModeReturn {
  const [currentMode, setCurrentMode] = useState<TradingMode>('paper')
  const [config, setConfig] = useState<TradingModeConfig | null>(null)
  const [modeStatus, setModeStatus] = useState<ModeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize and load current mode
  useEffect(() => {
    const initializeTradingMode = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current trading mode
        const modeResponse = await backendClient.get('/api/v1/trading-mode/current')
        if (modeResponse.success && modeResponse.data) {
          setCurrentMode(modeResponse.data.mode)
        }

        // Get mode configuration
        const configResponse = await backendClient.get('/api/v1/trading-mode/config')
        if (configResponse.success && configResponse.data) {
          setConfig(configResponse.data)
        } else {
          setConfig(DEFAULT_CONFIG)
        }

        // Get mode status
        await refreshStatus()

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize trading mode'
        setError(errorMsg)
        console.error('Trading mode initialization error:', err)
        
        // Fallback to defaults
        setCurrentMode('paper')
        setConfig(DEFAULT_CONFIG)
      } finally {
        setLoading(false)
      }
    }

    initializeTradingMode()
  }, [])

  // Refresh mode status
  const refreshStatus = useCallback(async () => {
    try {
      const response = await backendClient.get('/api/v1/trading-mode/status')
      if (response.success && response.data) {
        setModeStatus(response.data)
        setCurrentMode(response.data.currentMode)
        setConfig(response.data.config)
      }
    } catch (err) {
      console.error('Failed to refresh mode status:', err)
    }
  }, [])

  // Set trading mode
  const setTradingMode = useCallback(async (
    mode: TradingMode, 
    configOverrides?: Partial<TradingModeConfig>
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Prepare request data
      const requestData: any = { mode }
      if (configOverrides) {
        requestData.config = { ...config, ...configOverrides }
      }

      const response = await backendClient.post('/api/v1/trading-mode/set', requestData)
      
      if (response.success) {
        setCurrentMode(mode)
        if (requestData.config) {
          setConfig(requestData.config)
        }
        
        // Refresh status to get component sync status
        await refreshStatus()
        
        toast.success(`Switched to ${mode.toUpperCase()} trading mode`)
        return true
      } else {
        const errorMsg = response.error || 'Failed to set trading mode'
        setError(errorMsg)
        toast.error(errorMsg)
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set trading mode'
      setError(errorMsg)
      toast.error(errorMsg)
      return false
    } finally {
      setLoading(false)
    }
  }, [config, refreshStatus])

  // Toggle between paper and live mode
  const toggleTradingMode = useCallback(async (): Promise<boolean> => {
    const newMode = currentMode === 'paper' ? 'live' : 'paper'
    return await setTradingMode(newMode)
  }, [currentMode, setTradingMode])

  // Register component for mode coordination
  const registerComponent = useCallback(async (
    componentId: string, 
    componentType: string
  ): Promise<boolean> => {
    try {
      const response = await backendClient.post('/api/v1/trading-mode/register-component', {
        componentId,
        componentType
      })
      
      if (response.success) {
        await refreshStatus()
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to register component:', err)
      return false
    }
  }, [refreshStatus])

  // Unregister component
  const unregisterComponent = useCallback(async (componentId: string): Promise<boolean> => {
    try {
      const response = await backendClient.post('/api/v1/trading-mode/unregister-component', {
        componentId
      })
      
      if (response.success) {
        await refreshStatus()
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to unregister component:', err)
      return false
    }
  }, [refreshStatus])

  // Computed properties
  const isLiveMode = currentMode === 'live'
  const isPaperMode = currentMode === 'paper'
  const isSimulationMode = currentMode === 'simulation'
  const allComponentsSynced = modeStatus ? modeStatus.syncedComponents === modeStatus.totalComponents : false
  const hasErrors = modeStatus ? modeStatus.errorComponents > 0 : false

  return {
    // Current state
    currentMode,
    config,
    modeStatus,
    loading,
    error,
    
    // Actions
    setTradingMode,
    toggleTradingMode,
    refreshStatus,
    registerComponent,
    unregisterComponent,
    
    // Computed properties
    isLiveMode,
    isPaperMode,
    isSimulationMode,
    allComponentsSynced,
    hasErrors
  }
}

// Component registration hook for automatic registration/cleanup
export function useComponentRegistration(
  componentId: string,
  componentType: string,
  enabled: boolean = true
) {
  const { registerComponent, unregisterComponent } = useUniversalTradingMode()

  useEffect(() => {
    if (enabled) {
      registerComponent(componentId, componentType)
    }

    return () => {
      if (enabled) {
        unregisterComponent(componentId)
      }
    }
  }, [componentId, componentType, enabled, registerComponent, unregisterComponent])
}

// HOC for automatic component registration
export function withTradingModeRegistration<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentId: string,
  componentType: string
): React.FC<P> {
  return function TradingModeRegisteredComponent(props: P) {
    useComponentRegistration(componentId, componentType)
    return React.createElement(WrappedComponent, props)
  }
}

// Context provider for trading mode
const TradingModeContext = createContext<UseUniversalTradingModeReturn | null>(null)

export function TradingModeProvider({ children }: { children: ReactNode }): React.ReactElement {
  const tradingMode = useUniversalTradingMode()
  
  return (
    React.createElement(
      TradingModeContext.Provider, 
      { value: tradingMode },
      children
    )
  )
}

export function useTradingModeContext(): UseUniversalTradingModeReturn {
  const context = useContext(TradingModeContext)
  if (!context) {
    throw new Error('useTradingModeContext must be used within a TradingModeProvider')
  }
  return context
}