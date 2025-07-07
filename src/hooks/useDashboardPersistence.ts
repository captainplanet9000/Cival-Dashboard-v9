/**
 * React Hook for Autonomous Dashboard Persistence
 * Provides seamless state management across browser sessions and deployments
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { autonomousPersistenceOrchestrator, DashboardState, PersistenceHealth, PersistenceMetrics } from '@/lib/persistence/autonomous-persistence-orchestrator'
import { toast } from 'react-hot-toast'

interface DashboardPersistenceHook {
  // State management
  dashboardState: DashboardState | null
  isLoading: boolean
  error: string | null
  
  // Persistence operations
  saveState: (state: Partial<DashboardState>) => Promise<boolean>
  loadState: () => Promise<void>
  resetState: () => void
  
  // State updates
  updateActiveTab: (tab: string) => void
  updateLayoutMode: (mode: 'grid' | 'list' | 'compact') => void
  updateThemeMode: (mode: 'light' | 'dark' | 'system') => void
  updateSidebarCollapsed: (collapsed: boolean) => void
  updateAgents: (agents: any[]) => void
  updateFarms: (farms: any[]) => void
  updateGoals: (goals: any[]) => void
  updatePortfolio: (portfolio: any) => void
  updateMarketData: (marketData: any[]) => void
  updatePreferences: (preferences: Partial<DashboardState>) => void
  
  // Monitoring
  health: Map<string, PersistenceHealth>
  metrics: Map<string, PersistenceMetrics>
  lastSaved: Date | null
  lastLoaded: Date | null
  
  // Sync status
  isSyncing: boolean
  syncCount: number
  
  // Manual operations
  backup: () => Promise<boolean>
  restore: () => Promise<boolean>
}

export function useDashboardPersistence(): DashboardPersistenceHook {
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<Map<string, PersistenceHealth>>(new Map())
  const [metrics, setMetrics] = useState<Map<string, PersistenceMetrics>>(new Map())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCount, setSyncCount] = useState(0)
  
  const orchestrator = autonomousPersistenceOrchestrator
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize persistence on mount
  useEffect(() => {
    const initializePersistence = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔧 Initializing dashboard persistence...')
        
        // Load existing state
        const loadedState = await orchestrator.loadState()
        if (loadedState) {
          setDashboardState(loadedState)
          setLastLoaded(new Date())
          console.log('✅ Dashboard state loaded from persistence')
        } else {
          console.log('ℹ️ No existing state found, using default state')
        }
        
        // Subscribe to state changes from other sessions
        unsubscribeRef.current = orchestrator.subscribe((newState) => {
          console.log('🔄 State synchronized from another session')
          setDashboardState(newState)
          setLastLoaded(new Date())
          setSyncCount(prev => prev + 1)
          
          // Show sync notification
          toast.success('State synchronized', {
            icon: '🔄',
            duration: 2000,
            position: 'bottom-right'
          })
        })
        
        // Start health monitoring
        const healthInterval = setInterval(() => {
          setHealth(orchestrator.getHealth())
          setMetrics(orchestrator.getMetrics())
        }, 5000)
        
        setIsLoading(false)
        
        return () => {
          clearInterval(healthInterval)
        }
      } catch (err) {
        console.error('❌ Failed to initialize dashboard persistence:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize persistence')
        setIsLoading(false)
      }
    }
    
    initializePersistence()
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Debounced save function
  const debouncedSave = useCallback(async (newState: DashboardState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true)
        const success = await orchestrator.saveState(newState)
        
        if (success) {
          setLastSaved(new Date())
          console.log('💾 Dashboard state saved successfully')
        } else {
          console.warn('⚠️ Dashboard state save failed')
          toast.error('Failed to save dashboard state', {
            icon: '⚠️',
            duration: 3000
          })
        }
      } catch (err) {
        console.error('❌ Save error:', err)
        setError(err instanceof Error ? err.message : 'Save failed')
        toast.error('Save error occurred', {
          icon: '❌',
          duration: 3000
        })
      } finally {
        setIsSyncing(false)
      }
    }, 1000) // 1 second debounce
  }, [])

  // Generic state update function
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setDashboardState(prevState => {
      if (!prevState) return null
      
      const newState: DashboardState = {
        ...prevState,
        ...updates,
        lastUpdate: new Date().toISOString()
      }
      
      // Trigger debounced save
      debouncedSave(newState)
      
      return newState
    })
  }, [debouncedSave])

  // State management functions
  const saveState = useCallback(async (updates: Partial<DashboardState>): Promise<boolean> => {
    try {
      if (!dashboardState) return false
      
      const newState: DashboardState = {
        ...dashboardState,
        ...updates,
        lastUpdate: new Date().toISOString()
      }
      
      setIsSyncing(true)
      const success = await orchestrator.saveState(newState)
      
      if (success) {
        setDashboardState(newState)
        setLastSaved(new Date())
      }
      
      return success
    } catch (err) {
      console.error('❌ Save state error:', err)
      setError(err instanceof Error ? err.message : 'Save failed')
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [dashboardState])

  const loadState = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const loadedState = await orchestrator.loadState()
      if (loadedState) {
        setDashboardState(loadedState)
        setLastLoaded(new Date())
      }
    } catch (err) {
      console.error('❌ Load state error:', err)
      setError(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetState = useCallback(() => {
    const defaultState: DashboardState = {
      activeTab: 'overview',
      sidebarCollapsed: false,
      layoutMode: 'grid',
      themeMode: 'system',
      agents: [],
      farms: [],
      goals: [],
      portfolio: {},
      marketData: [],
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30000,
      riskTolerance: 'medium',
      lastUpdate: new Date().toISOString(),
      version: '1.0.0',
      sessionId: `session_${Date.now()}`
    }
    
    setDashboardState(defaultState)
    debouncedSave(defaultState)
  }, [debouncedSave])

  // Specific update functions
  const updateActiveTab = useCallback((tab: string) => {
    updateState({ activeTab: tab })
  }, [updateState])

  const updateLayoutMode = useCallback((mode: 'grid' | 'list' | 'compact') => {
    updateState({ layoutMode: mode })
  }, [updateState])

  const updateThemeMode = useCallback((mode: 'light' | 'dark' | 'system') => {
    updateState({ themeMode: mode })
  }, [updateState])

  const updateSidebarCollapsed = useCallback((collapsed: boolean) => {
    updateState({ sidebarCollapsed: collapsed })
  }, [updateState])

  const updateAgents = useCallback((agents: any[]) => {
    updateState({ agents })
  }, [updateState])

  const updateFarms = useCallback((farms: any[]) => {
    updateState({ farms })
  }, [updateState])

  const updateGoals = useCallback((goals: any[]) => {
    updateState({ goals })
  }, [updateState])

  const updatePortfolio = useCallback((portfolio: any) => {
    updateState({ portfolio })
  }, [updateState])

  const updateMarketData = useCallback((marketData: any[]) => {
    updateState({ marketData })
  }, [updateState])

  const updatePreferences = useCallback((preferences: Partial<DashboardState>) => {
    updateState(preferences)
  }, [updateState])

  // Manual operations
  const backup = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true)
      const success = await orchestrator.backup()
      
      if (success) {
        setLastSaved(new Date())
        toast.success('Backup completed', {
          icon: '💾',
          duration: 2000
        })
      } else {
        toast.error('Backup failed', {
          icon: '❌',
          duration: 3000
        })
      }
      
      return success
    } catch (err) {
      console.error('❌ Backup error:', err)
      toast.error('Backup error occurred', {
        icon: '❌',
        duration: 3000
      })
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const restoredState = await orchestrator.restore()
      
      if (restoredState) {
        setDashboardState(restoredState)
        setLastLoaded(new Date())
        toast.success('State restored', {
          icon: '📥',
          duration: 2000
        })
        return true
      } else {
        toast.error('Restore failed', {
          icon: '❌',
          duration: 3000
        })
        return false
      }
    } catch (err) {
      console.error('❌ Restore error:', err)
      toast.error('Restore error occurred', {
        icon: '❌',
        duration: 3000
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    dashboardState,
    isLoading,
    error,
    
    // Operations
    saveState,
    loadState,
    resetState,
    
    // Updates
    updateActiveTab,
    updateLayoutMode,
    updateThemeMode,
    updateSidebarCollapsed,
    updateAgents,
    updateFarms,
    updateGoals,
    updatePortfolio,
    updateMarketData,
    updatePreferences,
    
    // Monitoring
    health,
    metrics,
    lastSaved,
    lastLoaded,
    
    // Sync status
    isSyncing,
    syncCount,
    
    // Manual operations
    backup,
    restore
  }
}

export default useDashboardPersistence