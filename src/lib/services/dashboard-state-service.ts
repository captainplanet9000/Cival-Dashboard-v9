'use client'

/**
 * Dashboard State Service
 * Handles storing and retrieving dashboard UI state with fallbacks
 */

interface DashboardState {
  id?: string
  dashboardType: string
  stateData: Record<string, any>
  metadata?: Record<string, any>
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
}

class DashboardStateService {
  private static instance: DashboardStateService
  private useSupabase = false
  private fallbackData = new Map<string, DashboardState>()

  private constructor() {
    this.checkSupabaseAvailability()
    this.initializeFallbackData()
  }

  static getInstance(): DashboardStateService {
    if (!DashboardStateService.instance) {
      DashboardStateService.instance = new DashboardStateService()
    }
    return DashboardStateService.instance
  }

  private async checkSupabaseAvailability() {
    try {
      const { isSupabaseAvailable } = await import('@/lib/supabase/client')
      const available = await isSupabaseAvailable()
      
      if (available) {
        // Check if dashboard_state table exists
        const { supabase } = await import('@/lib/supabase/client')
        const { data, error } = await supabase
          .from('dashboard_state')
          .select('id')
          .limit(1)
        
        if (!error) {
          this.useSupabase = true
          console.log('🟢 Dashboard state: Using Supabase for persistence')
        }
      }
    } catch (error) {
      console.log('🟡 Dashboard state: Using localStorage fallback (Supabase not available)')
      this.useSupabase = false
    }
  }

  private initializeFallbackData() {
    // Initialize with default dashboard states
    const defaultStates: DashboardState[] = [
      {
        id: 'main_default',
        dashboardType: 'main',
        stateData: {
          activeTab: 'overview',
          layout: 'default',
          preferences: { theme: 'light' }
        },
        metadata: { source: 'default' },
        createdAt: new Date().toISOString()
      },
      {
        id: 'trading_default',
        dashboardType: 'trading',
        stateData: {
          activePair: 'BTC/USD',
          chartType: 'candlestick',
          timeframe: '1h'
        },
        metadata: { source: 'default' },
        createdAt: new Date().toISOString()
      },
      {
        id: 'analytics_default',
        dashboardType: 'analytics',
        stateData: {
          dateRange: '7d',
          metrics: ['portfolio', 'performance'],
          view: 'summary'
        },
        metadata: { source: 'default' },
        createdAt: new Date().toISOString()
      }
    ]

    defaultStates.forEach(state => {
      this.fallbackData.set(`${state.dashboardType}_default`, state)
    })

    // Try to load from localStorage
    try {
      const stored = localStorage.getItem('dashboard_states')
      if (stored) {
        const states: DashboardState[] = JSON.parse(stored)
        states.forEach(state => {
          if (state.id) {
            this.fallbackData.set(state.id, state)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load dashboard states from localStorage:', error)
    }
  }

  private saveFallbackData() {
    try {
      const states = Array.from(this.fallbackData.values())
      localStorage.setItem('dashboard_states', JSON.stringify(states))
    } catch (error) {
      console.warn('Failed to save dashboard states to localStorage:', error)
    }
  }

  async getDashboardState(dashboardType: string): Promise<DashboardState | null> {
    if (this.useSupabase) {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data, error } = await supabase
          .from('dashboard_state')
          .select('*')
          .eq('dashboard_type', dashboardType)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && data) {
          return {
            id: data.id,
            dashboardType: data.dashboard_type,
            stateData: data.state_data || {},
            metadata: data.metadata || {},
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            expiresAt: data.expires_at
          }
        }
      } catch (error) {
        console.warn('Failed to get dashboard state from Supabase:', error)
      }
    }

    // Fallback to local data
    const fallbackKey = `${dashboardType}_default`
    return this.fallbackData.get(fallbackKey) || null
  }

  async saveDashboardState(state: Omit<DashboardState, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const stateId = `${state.dashboardType}_${Date.now()}`
    const now = new Date().toISOString()

    const fullState: DashboardState = {
      ...state,
      id: stateId,
      createdAt: now,
      updatedAt: now
    }

    if (this.useSupabase) {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        
        // Try to update existing state first
        const { data: existing } = await supabase
          .from('dashboard_state')
          .select('id')
          .eq('dashboard_type', state.dashboardType)
          .limit(1)
          .single()

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('dashboard_state')
            .update({
              state_data: state.stateData,
              metadata: state.metadata,
              updated_at: now
            })
            .eq('id', existing.id)

          if (!error) {
            console.log('🟢 Dashboard state updated in Supabase')
            return existing.id
          }
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('dashboard_state')
            .insert({
              dashboard_type: state.dashboardType,
              state_data: state.stateData,
              metadata: state.metadata
            })
            .select('id')
            .single()

          if (!error && data) {
            console.log('🟢 Dashboard state saved to Supabase')
            return data.id
          }
        }
      } catch (error) {
        console.warn('Failed to save dashboard state to Supabase:', error)
      }
    }

    // Fallback to local storage
    this.fallbackData.set(stateId, fullState)
    this.saveFallbackData()
    console.log('🟡 Dashboard state saved to localStorage')
    
    return stateId
  }

  async getAllDashboardStates(): Promise<DashboardState[]> {
    if (this.useSupabase) {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data, error } = await supabase
          .from('dashboard_state')
          .select('*')
          .order('updated_at', { ascending: false })

        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            dashboardType: row.dashboard_type,
            stateData: row.state_data || {},
            metadata: row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at
          }))
        }
      } catch (error) {
        console.warn('Failed to get all dashboard states from Supabase:', error)
      }
    }

    // Fallback to local data
    return Array.from(this.fallbackData.values())
  }

  async deleteDashboardState(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { error } = await supabase
          .from('dashboard_state')
          .delete()
          .eq('id', id)

        if (!error) {
          console.log('🟢 Dashboard state deleted from Supabase')
          return true
        }
      } catch (error) {
        console.warn('Failed to delete dashboard state from Supabase:', error)
      }
    }

    // Fallback to local storage
    const deleted = this.fallbackData.delete(id)
    if (deleted) {
      this.saveFallbackData()
      console.log('🟡 Dashboard state deleted from localStorage')
    }
    
    return deleted
  }

  // Helper method to get a specific state value
  async getStateValue(dashboardType: string, key: string, defaultValue: any = null): Promise<any> {
    const state = await this.getDashboardState(dashboardType)
    if (!state || !state.stateData) {
      return defaultValue
    }
    
    const keys = key.split('.')
    let value = state.stateData
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return defaultValue
      }
    }
    
    return value
  }

  // Helper method to set a specific state value
  async setStateValue(dashboardType: string, key: string, value: any): Promise<boolean> {
    const state = await this.getDashboardState(dashboardType)
    const stateData = state?.stateData || {}
    
    const keys = key.split('.')
    let current = stateData
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {}
      }
      current = current[k]
    }
    
    // Set the final value
    current[keys[keys.length - 1]] = value
    
    // Save the updated state
    try {
      await this.saveDashboardState({
        dashboardType,
        stateData,
        metadata: state?.metadata || { lastModified: new Date().toISOString() }
      })
      return true
    } catch (error) {
      console.error('Failed to save state value:', error)
      return false
    }
  }
}

// Custom React hook for dashboard state
export function useDashboardState(dashboardType: string) {
  const service = DashboardStateService.getInstance()
  
  const getState = async (key: string, defaultValue?: any) => {
    return service.getStateValue(dashboardType, key, defaultValue)
  }
  
  const setState = async (key: string, value: any) => {
    return service.setStateValue(dashboardType, key, value)
  }
  
  const getFullState = async () => {
    return service.getDashboardState(dashboardType)
  }
  
  const saveFullState = async (stateData: Record<string, any>, metadata?: Record<string, any>) => {
    return service.saveDashboardState({
      dashboardType,
      stateData,
      metadata
    })
  }
  
  return {
    getState,
    setState,
    getFullState,
    saveFullState
  }
}

export default DashboardStateService
export type { DashboardState }