/**
 * Persistence Manager
 * Handles frontend state persistence across Railway deployments and browser sessions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { backendApi } from '@/lib/api/backend-client'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  dashboard_layout: 'grid' | 'list' | 'compact'
  default_timeframe: '1h' | '4h' | '1d' | '1w'
  notification_settings: {
    trades: boolean
    agent_alerts: boolean
    market_updates: boolean
    risk_alerts: boolean
  }
  chart_preferences: {
    chart_type: 'candlestick' | 'line' | 'area'
    indicators: string[]
    overlays: string[]
  }
  agent_preferences: {
    auto_start: boolean
    risk_tolerance: 'low' | 'medium' | 'high'
    preferred_strategies: string[]
  }
}

export interface DashboardState {
  active_tabs: string[]
  layout_config: any
  filter_states: { [componentId: string]: any }
  chart_configs: { [chartId: string]: any }
  agent_configs: { [agentId: string]: any }
  last_updated: string
}

export interface ChartConfiguration {
  chart_id: string
  chart_type: string
  symbols: string[]
  timeframe: string
  indicators: any[]
  layout: any
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface AgentConfiguration {
  agent_id: string
  name: string
  strategy_config: any
  risk_config: any
  trading_config: any
  is_active: boolean
  auto_start: boolean
  created_at: string
  updated_at: string
}

class PersistenceManager {
  private supabase: SupabaseClient | null = null
  private localStorage: Storage | null = null
  private sessionStorage: Storage | null = null
  private initialized = false

  constructor() {
    // Initialize browser storage
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage
      this.sessionStorage = window.sessionStorage
    }

    // Initialize Supabase client
    this.initializeSupabase()
  }

  private initializeSupabase() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey)
        this.initialized = true
        console.log('✅ Persistence Manager initialized with Supabase')
      } else {
        console.warn('⚠️ Supabase credentials not found, using local storage only')
      }
    } catch (error) {
      console.error('Failed to initialize Supabase:', error)
    }
  }

  // ==========================================
  // USER PREFERENCES
  // ==========================================

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<boolean> {
    try {
      // Save to Supabase
      if (this.supabase && userId) {
        const { error } = await this.supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preferences,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Failed to save preferences to Supabase:', error)
        } else {
          console.log('✅ User preferences saved to Supabase')
        }
      }

      // Fallback to localStorage
      if (this.localStorage) {
        this.localStorage.setItem(
          `user_preferences_${userId}`,
          JSON.stringify(preferences)
        )
        console.log('✅ User preferences saved to localStorage')
      }

      return true
    } catch (error) {
      console.error('Failed to save user preferences:', error)
      return false
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Try Supabase first
      if (this.supabase && userId) {
        const { data, error } = await this.supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .single()

        if (!error && data) {
          console.log('✅ User preferences loaded from Supabase')
          return data.preferences as UserPreferences
        }
      }

      // Fallback to localStorage
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`user_preferences_${userId}`)
        if (stored) {
          console.log('✅ User preferences loaded from localStorage')
          return JSON.parse(stored) as UserPreferences
        }
      }

      // Return default preferences
      return this.getDefaultPreferences()
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      return this.getDefaultPreferences()
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      dashboard_layout: 'grid',
      default_timeframe: '1h',
      notification_settings: {
        trades: true,
        agent_alerts: true,
        market_updates: false,
        risk_alerts: true
      },
      chart_preferences: {
        chart_type: 'candlestick',
        indicators: ['sma_20', 'rsi'],
        overlays: ['volume']
      },
      agent_preferences: {
        auto_start: false,
        risk_tolerance: 'medium',
        preferred_strategies: ['momentum', 'mean_reversion']
      }
    }
  }

  // ==========================================
  // DASHBOARD STATE
  // ==========================================

  async saveDashboardState(userId: string, componentName: string, state: any): Promise<boolean> {
    try {
      // Save to Supabase
      if (this.supabase && userId) {
        const { error } = await this.supabase
          .from('dashboard_states')
          .upsert({
            user_id: userId,
            component_name: componentName,
            state,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Failed to save dashboard state to Supabase:', error)
        }
      }

      // Save to localStorage for quick access
      if (this.localStorage) {
        this.localStorage.setItem(
          `dashboard_state_${userId}_${componentName}`,
          JSON.stringify(state)
        )
      }

      return true
    } catch (error) {
      console.error('Failed to save dashboard state:', error)
      return false
    }
  }

  async getDashboardState(userId: string, componentName: string): Promise<any> {
    try {
      // Try localStorage first for speed
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`dashboard_state_${userId}_${componentName}`)
        if (stored) {
          return JSON.parse(stored)
        }
      }

      // Fallback to Supabase
      if (this.supabase && userId) {
        const { data, error } = await this.supabase
          .from('dashboard_states')
          .select('state')
          .eq('user_id', userId)
          .eq('component_name', componentName)
          .single()

        if (!error && data) {
          // Cache in localStorage
          if (this.localStorage) {
            this.localStorage.setItem(
              `dashboard_state_${userId}_${componentName}`,
              JSON.stringify(data.state)
            )
          }
          return data.state
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get dashboard state:', error)
      return null
    }
  }

  // ==========================================
  // CHART CONFIGURATIONS
  // ==========================================

  async saveChartConfig(chartId: string, config: ChartConfiguration): Promise<boolean> {
    try {
      // Save via backend API for proper persistence
      const response = await backendApi.request('POST', '/api/v1/persistence/chart-config', {
        chart_id: chartId,
        config
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Cache locally
      if (this.localStorage) {
        this.localStorage.setItem(`chart_config_${chartId}`, JSON.stringify(config))
      }

      console.log(`✅ Chart config saved: ${chartId}`)
      return true
    } catch (error) {
      console.error('Failed to save chart config:', error)
      
      // Fallback to local storage
      if (this.localStorage) {
        this.localStorage.setItem(`chart_config_${chartId}`, JSON.stringify(config))
        return true
      }
      
      return false
    }
  }

  async getChartConfig(chartId: string): Promise<ChartConfiguration | null> {
    try {
      // Try localStorage first
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`chart_config_${chartId}`)
        if (stored) {
          return JSON.parse(stored) as ChartConfiguration
        }
      }

      // Fallback to backend API
      const response = await backendApi.request('GET', `/api/v1/persistence/chart-config/${chartId}`)
      if (response.data) {
        // Cache locally
        if (this.localStorage) {
          this.localStorage.setItem(`chart_config_${chartId}`, JSON.stringify(response.data))
        }
        return response.data as ChartConfiguration
      }

      return null
    } catch (error) {
      console.error('Failed to get chart config:', error)
      return null
    }
  }

  // ==========================================
  // AGENT CONFIGURATIONS
  // ==========================================

  async saveAgentConfig(agentId: string, config: AgentConfiguration): Promise<boolean> {
    try {
      // Save via Trading Farm Brain API for persistence across Railway deployments
      const response = await backendApi.persistFarmAgentMemory({
        agent_id: agentId,
        memory_type: 'config',
        memory_key: 'agent_configuration',
        memory_data: config,
        importance_score: 1.0 // High importance for configs
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Cache locally
      if (this.localStorage) {
        this.localStorage.setItem(`agent_config_${agentId}`, JSON.stringify(config))
      }

      console.log(`✅ Agent config saved: ${agentId}`)
      return true
    } catch (error) {
      console.error('Failed to save agent config:', error)
      
      // Fallback to local storage
      if (this.localStorage) {
        this.localStorage.setItem(`agent_config_${agentId}`, JSON.stringify(config))
        return true
      }
      
      return false
    }
  }

  async getAgentConfig(agentId: string): Promise<AgentConfiguration | null> {
    try {
      // Try localStorage first
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`agent_config_${agentId}`)
        if (stored) {
          return JSON.parse(stored) as AgentConfiguration
        }
      }

      // Fallback to Trading Farm Brain API
      const response = await backendApi.getFarmAgentMemory(agentId, 'config')
      if (response.data && response.data.length > 0) {
        const configData = response.data.find((mem: any) => mem.memory_key === 'agent_configuration')
        if (configData) {
          const config = configData.memory_data as AgentConfiguration
          
          // Cache locally
          if (this.localStorage) {
            this.localStorage.setItem(`agent_config_${agentId}`, JSON.stringify(config))
          }
          
          return config
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get agent config:', error)
      return null
    }
  }

  // ==========================================
  // FILTER STATES
  // ==========================================

  saveFilterState(componentId: string, filters: any): boolean {
    try {
      if (this.localStorage) {
        this.localStorage.setItem(`filters_${componentId}`, JSON.stringify(filters))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save filter state:', error)
      return false
    }
  }

  getFilterState(componentId: string): any {
    try {
      if (this.localStorage) {
        const stored = this.localStorage.getItem(`filters_${componentId}`)
        if (stored) {
          return JSON.parse(stored)
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get filter state:', error)
      return null
    }
  }

  // ==========================================
  // SESSION DATA
  // ==========================================

  saveSessionData(key: string, data: any): boolean {
    try {
      if (this.sessionStorage) {
        this.sessionStorage.setItem(key, JSON.stringify(data))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save session data:', error)
      return false
    }
  }

  getSessionData(key: string): any {
    try {
      if (this.sessionStorage) {
        const stored = this.sessionStorage.getItem(key)
        if (stored) {
          return JSON.parse(stored)
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get session data:', error)
      return null
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  clearUserData(userId: string): void {
    try {
      if (this.localStorage) {
        // Clear all user-specific data
        const keys = Object.keys(this.localStorage)
        keys.forEach(key => {
          if (key.includes(userId)) {
            this.localStorage!.removeItem(key)
          }
        })
      }
      console.log(`✅ Cleared local data for user: ${userId}`)
    } catch (error) {
      console.error('Failed to clear user data:', error)
    }
  }

  isInitialized(): boolean {
    return this.initialized || (this.localStorage !== null)
  }

  getStorageInfo(): any {
    return {
      supabase_available: this.supabase !== null,
      localStorage_available: this.localStorage !== null,
      sessionStorage_available: this.sessionStorage !== null,
      initialized: this.initialized
    }
  }
}

// Export singleton instance
export const persistenceManager = new PersistenceManager()

// Export class for testing
export { PersistenceManager }