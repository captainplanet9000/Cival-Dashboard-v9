/**
 * Autonomous Persistence Orchestrator
 * Self-healing, multi-layer persistence system for Railway deployment
 */
import { DEFAULT_USER_UUID } from '../constants/system-constants';

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { backendApi } from '@/lib/api/backend-client'

// Persistence layers in order of preference
type PersistenceLayer = 'supabase' | 'redis' | 'localStorage' | 'sessionStorage' | 'memory'

interface PersistenceConfig {
  enableAutoBackup: boolean
  backupIntervalMs: number
  maxRetries: number
  healthCheckIntervalMs: number
  syncIntervalMs: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
}

interface PersistenceHealth {
  layer: PersistenceLayer
  status: 'healthy' | 'degraded' | 'failed'
  latency: number
  lastCheck: Date
  errorCount: number
  errorMessage?: string
}

interface PersistenceMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageLatency: number
  lastOperation: Date
  dataSize: number
  compressionRatio: number
}

export interface DashboardState {
  // UI State
  activeTab: string
  sidebarCollapsed: boolean
  layoutMode: 'grid' | 'list' | 'compact'
  themeMode: 'light' | 'dark' | 'system'
  
  // Dashboard Data
  agents: any[]
  farms: any[]
  goals: any[]
  portfolio: any
  marketData: any[]
  
  // User Preferences
  notifications: boolean
  autoRefresh: boolean
  refreshInterval: number
  riskTolerance: 'low' | 'medium' | 'high'
  
  // Performance Data
  lastUpdate: string
  version: string
  sessionId: string
}

class AutonomousPersistenceOrchestrator {
  private static instance: AutonomousPersistenceOrchestrator
  private supabase: SupabaseClient | null = null
  private redis: any = null
  private localStorage: Storage | null = null
  private sessionStorage: Storage | null = null
  private memoryStore: Map<string, any> = new Map()
  
  private config: PersistenceConfig = {
    enableAutoBackup: true,
    backupIntervalMs: 60000, // 1 minute
    maxRetries: 3,
    healthCheckIntervalMs: 30000, // 30 seconds
    syncIntervalMs: 5000, // 5 seconds
    compressionEnabled: true,
    encryptionEnabled: false
  }
  
  private health: Map<PersistenceLayer, PersistenceHealth> = new Map()
  private metrics: Map<PersistenceLayer, PersistenceMetrics> = new Map()
  private subscribers: Set<(state: DashboardState) => void> = new Set()
  private currentState: DashboardState | null = null
  private sessionId: string = this.generateSessionId()
  
  private healthCheckInterval: NodeJS.Timeout | null = null
  private backupInterval: NodeJS.Timeout | null = null
  private syncInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.initializePersistenceLayers()
    this.startHealthChecks()
    this.startAutoBackup()
    this.startStateSync()
  }

  public static getInstance(): AutonomousPersistenceOrchestrator {
    if (!AutonomousPersistenceOrchestrator.instance) {
      AutonomousPersistenceOrchestrator.instance = new AutonomousPersistenceOrchestrator()
    }
    return AutonomousPersistenceOrchestrator.instance
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  private async initializePersistenceLayers(): Promise<void> {
    console.log('🔧 Initializing autonomous persistence layers...')
    
    // Initialize browser storage
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage
      this.sessionStorage = window.sessionStorage
      console.log('✅ Browser storage initialized')
    }

    // Initialize Supabase
    await this.initializeSupabase()
    
    // Initialize Redis (server-side only)
    await this.initializeRedis()
    
    // Initialize health tracking
    this.initializeHealthTracking()
    
    console.log('✅ Autonomous persistence orchestrator ready')
  }

  private async initializeSupabase(): Promise<void> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey)
        
        // Test connection
        const { data, error } = await this.supabase.from('dashboard_state').select('id').limit(1)
        if (error) {
          console.warn('⚠️ Supabase connection test failed:', error.message)
          this.updateHealth('supabase', 'failed', 0, error.message)
        } else {
          console.log('✅ Supabase persistence layer active')
          this.updateHealth('supabase', 'healthy', 50)
        }
      } else {
        console.warn('⚠️ Supabase credentials not found')
        this.updateHealth('supabase', 'failed', 0, 'Missing credentials')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error)
      this.updateHealth('supabase', 'failed', 0, String(error))
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Redis initialization depends on server-side environment
      if (typeof window === 'undefined') {
        const redisUrl = process.env.REDIS_URL
        if (redisUrl) {
          // Redis will be handled by the Redis service
          console.log('✅ Redis persistence layer configured')
          this.updateHealth('redis', 'healthy', 20)
        } else {
          console.log('ℹ️ Redis not configured, skipping')
          this.updateHealth('redis', 'failed', 0, 'Not configured')
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error)
      this.updateHealth('redis', 'failed', 0, String(error))
    }
  }

  private initializeHealthTracking(): void {
    // Initialize health status for all layers
    const layers: PersistenceLayer[] = ['supabase', 'redis', 'localStorage', 'sessionStorage', 'memory']
    
    layers.forEach(layer => {
      if (!this.health.has(layer)) {
        this.health.set(layer, {
          layer,
          status: 'healthy',
          latency: 0,
          lastCheck: new Date(),
          errorCount: 0
        })
      }
      
      if (!this.metrics.has(layer)) {
        this.metrics.set(layer, {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          averageLatency: 0,
          lastOperation: new Date(),
          dataSize: 0,
          compressionRatio: 1
        })
      }
    })
  }

  // ==========================================
  // CORE PERSISTENCE OPERATIONS
  // ==========================================

  public async saveState(state: DashboardState): Promise<boolean> {
    const startTime = Date.now()
    this.currentState = { ...state, lastUpdate: new Date().toISOString(), sessionId: this.sessionId }
    
    console.log('💾 Saving dashboard state across all layers...')
    
    // Try to save to all available layers
    const results = await Promise.allSettled([
      this.saveToSupabase(this.currentState),
      this.saveToRedis(this.currentState),
      this.saveToLocalStorage(this.currentState),
      this.saveToSessionStorage(this.currentState),
      this.saveToMemory(this.currentState)
    ])
    
    // Check if at least one layer succeeded
    const successCount = results.filter(result => result.status === 'fulfilled').length
    const success = successCount > 0
    
    const latency = Date.now() - startTime
    console.log(`💾 State save completed: ${successCount}/5 layers successful (${latency}ms)`)
    
    // Notify subscribers
    this.notifySubscribers(this.currentState)
    
    return success
  }

  public async loadState(): Promise<DashboardState | null> {
    console.log('📁 Loading dashboard state from available layers...')
    
    // Try layers in order of preference
    const layers: PersistenceLayer[] = ['supabase', 'redis', 'localStorage', 'sessionStorage', 'memory']
    
    for (const layer of layers) {
      try {
        const state = await this.loadFromLayer(layer)
        if (state && this.validateState(state)) {
          console.log(`✅ State loaded from ${layer}`)
          this.currentState = state
          return state
        }
      } catch (error) {
        console.log(`⚠️ Failed to load from ${layer}:`, error)
        this.updateHealth(layer, 'degraded', 0, String(error))
      }
    }
    
    console.log('⚠️ No valid state found in any layer, creating default state')
    return this.createDefaultState()
  }

  private async loadFromLayer(layer: PersistenceLayer): Promise<DashboardState | null> {
    switch (layer) {
      case 'supabase':
        return this.loadFromSupabase()
      case 'redis':
        return this.loadFromRedis()
      case 'localStorage':
        return this.loadFromLocalStorage()
      case 'sessionStorage':
        return this.loadFromSessionStorage()
      case 'memory':
        return this.loadFromMemory()
      default:
        return null
    }
  }

  // ==========================================
  // SUPABASE OPERATIONS
  // ==========================================

  private async saveToSupabase(state: DashboardState): Promise<boolean> {
    if (!this.supabase) return false
    
    try {
      const { error } = await this.supabase
        .from('dashboard_state')
        .upsert({
          session_id: this.sessionId,
          user_id: DEFAULT_USER_UUID, // Use proper UUID format for user_id
          state_data: state,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      this.updateMetrics('supabase', true, JSON.stringify(state).length)
      this.updateHealth('supabase', 'healthy', 50)
      return true
    } catch (error) {
      console.error('❌ Supabase save failed:', error)
      this.updateMetrics('supabase', false, 0)
      this.updateHealth('supabase', 'failed', 0, String(error))
      return false
    }
  }

  private async loadFromSupabase(): Promise<DashboardState | null> {
    if (!this.supabase) return null
    
    try {
      const { data, error } = await this.supabase
        .from('dashboard_state')
        .select('state_data')
        .eq('user_id', DEFAULT_USER_UUID)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      
      this.updateHealth('supabase', 'healthy', 30)
      return data?.state_data || null
    } catch (error) {
      console.error('❌ Supabase load failed:', error)
      this.updateHealth('supabase', 'failed', 0, String(error))
      return null
    }
  }

  // ==========================================
  // REDIS OPERATIONS (Server-side only)
  // ==========================================

  private async saveToRedis(state: DashboardState): Promise<boolean> {
    try {
      // Use Redis service if available
      const { redisService } = await import('@/lib/services/redis-service')
      if (!redisService.isHealthy()) return false
      
      const key = `dashboard_state:${this.sessionId}`
      const serializedState = JSON.stringify(state)
      
      await redisService.set(key, serializedState, 3600) // 1 hour TTL
      
      this.updateMetrics('redis', true, serializedState.length)
      this.updateHealth('redis', 'healthy', 20)
      return true
    } catch (error) {
      console.error('❌ Redis save failed:', error)
      this.updateMetrics('redis', false, 0)
      this.updateHealth('redis', 'degraded', 0, String(error))
      return false
    }
  }

  private async loadFromRedis(): Promise<DashboardState | null> {
    try {
      const { redisService } = await import('@/lib/services/redis-service')
      if (!redisService.isHealthy()) return null
      
      const key = `dashboard_state:${this.sessionId}`
      const serializedState = await redisService.get(key)
      
      if (!serializedState) return null
      
      this.updateHealth('redis', 'healthy', 15)
      return JSON.parse(serializedState)
    } catch (error) {
      console.error('❌ Redis load failed:', error)
      this.updateHealth('redis', 'degraded', 0, String(error))
      return null
    }
  }

  // ==========================================
  // BROWSER STORAGE OPERATIONS
  // ==========================================

  private async saveToLocalStorage(state: DashboardState): Promise<boolean> {
    if (!this.localStorage) return false
    
    try {
      const key = 'dashboard_state'
      const serializedState = JSON.stringify(state)
      
      this.localStorage.setItem(key, serializedState)
      
      this.updateMetrics('localStorage', true, serializedState.length)
      this.updateHealth('localStorage', 'healthy', 5)
      return true
    } catch (error) {
      console.error('❌ localStorage save failed:', error)
      this.updateMetrics('localStorage', false, 0)
      this.updateHealth('localStorage', 'failed', 0, String(error))
      return false
    }
  }

  private async loadFromLocalStorage(): Promise<DashboardState | null> {
    if (!this.localStorage) return null
    
    try {
      const key = 'dashboard_state'
      const serializedState = this.localStorage.getItem(key)
      
      if (!serializedState) return null
      
      this.updateHealth('localStorage', 'healthy', 2)
      return JSON.parse(serializedState)
    } catch (error) {
      console.error('❌ localStorage load failed:', error)
      this.updateHealth('localStorage', 'failed', 0, String(error))
      return null
    }
  }

  private async saveToSessionStorage(state: DashboardState): Promise<boolean> {
    if (!this.sessionStorage) return false
    
    try {
      const key = 'dashboard_state_session'
      const serializedState = JSON.stringify(state)
      
      this.sessionStorage.setItem(key, serializedState)
      
      this.updateMetrics('sessionStorage', true, serializedState.length)
      this.updateHealth('sessionStorage', 'healthy', 3)
      return true
    } catch (error) {
      console.error('❌ sessionStorage save failed:', error)
      this.updateMetrics('sessionStorage', false, 0)
      this.updateHealth('sessionStorage', 'failed', 0, String(error))
      return false
    }
  }

  private async loadFromSessionStorage(): Promise<DashboardState | null> {
    if (!this.sessionStorage) return null
    
    try {
      const key = 'dashboard_state_session'
      const serializedState = this.sessionStorage.getItem(key)
      
      if (!serializedState) return null
      
      this.updateHealth('sessionStorage', 'healthy', 1)
      return JSON.parse(serializedState)
    } catch (error) {
      console.error('❌ sessionStorage load failed:', error)
      this.updateHealth('sessionStorage', 'failed', 0, String(error))
      return null
    }
  }

  // ==========================================
  // MEMORY OPERATIONS (Fallback)
  // ==========================================

  private async saveToMemory(state: DashboardState): Promise<boolean> {
    try {
      this.memoryStore.set('dashboard_state', state)
      
      this.updateMetrics('memory', true, JSON.stringify(state).length)
      this.updateHealth('memory', 'healthy', 1)
      return true
    } catch (error) {
      console.error('❌ Memory save failed:', error)
      this.updateMetrics('memory', false, 0)
      this.updateHealth('memory', 'failed', 0, String(error))
      return false
    }
  }

  private async loadFromMemory(): Promise<DashboardState | null> {
    try {
      const state = this.memoryStore.get('dashboard_state')
      
      if (!state) return null
      
      this.updateHealth('memory', 'healthy', 0)
      return state
    } catch (error) {
      console.error('❌ Memory load failed:', error)
      this.updateHealth('memory', 'failed', 0, String(error))
      return null
    }
  }

  // ==========================================
  // HEALTH & MONITORING
  // ==========================================

  private updateHealth(layer: PersistenceLayer, status: 'healthy' | 'degraded' | 'failed', latency: number, errorMessage?: string): void {
    const health = this.health.get(layer) || {
      layer,
      status: 'healthy',
      latency: 0,
      lastCheck: new Date(),
      errorCount: 0
    }
    
    health.status = status
    health.latency = latency
    health.lastCheck = new Date()
    
    if (status === 'failed') {
      health.errorCount += 1
      health.errorMessage = errorMessage
    } else {
      health.errorCount = 0
      health.errorMessage = undefined
    }
    
    this.health.set(layer, health)
  }

  private updateMetrics(layer: PersistenceLayer, success: boolean, dataSize: number): void {
    const metrics = this.metrics.get(layer) || {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      lastOperation: new Date(),
      dataSize: 0,
      compressionRatio: 1
    }
    
    metrics.totalOperations += 1
    metrics.lastOperation = new Date()
    metrics.dataSize = dataSize
    
    if (success) {
      metrics.successfulOperations += 1
    } else {
      metrics.failedOperations += 1
    }
    
    this.metrics.set(layer, metrics)
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, this.config.healthCheckIntervalMs)
    
    console.log('💓 Health monitoring started')
  }

  private async performHealthChecks(): Promise<void> {
    // Health check for each layer
    const layers: PersistenceLayer[] = ['supabase', 'redis', 'localStorage', 'sessionStorage', 'memory']
    
    for (const layer of layers) {
      try {
        const startTime = Date.now()
        
        switch (layer) {
          case 'supabase':
            if (this.supabase) {
              await this.supabase.from('dashboard_state').select('id').limit(1)
            }
            break
          case 'localStorage':
            if (this.localStorage) {
              this.localStorage.setItem('health_check', 'test')
              this.localStorage.removeItem('health_check')
            }
            break
          case 'sessionStorage':
            if (this.sessionStorage) {
              this.sessionStorage.setItem('health_check', 'test')
              this.sessionStorage.removeItem('health_check')
            }
            break
          case 'memory':
            this.memoryStore.set('health_check', 'test')
            this.memoryStore.delete('health_check')
            break
        }
        
        const latency = Date.now() - startTime
        this.updateHealth(layer, 'healthy', latency)
      } catch (error) {
        this.updateHealth(layer, 'failed', 0, String(error))
      }
    }
  }

  // ==========================================
  // AUTO-BACKUP & SYNC
  // ==========================================

  private startAutoBackup(): void {
    if (!this.config.enableAutoBackup) return
    
    this.backupInterval = setInterval(() => {
      this.performAutoBackup()
    }, this.config.backupIntervalMs)
    
    console.log('💾 Auto-backup started')
  }

  private async performAutoBackup(): Promise<void> {
    if (!this.currentState) return
    
    try {
      console.log('🔄 Performing automatic backup...')
      await this.saveState(this.currentState)
    } catch (error) {
      console.error('❌ Auto-backup failed:', error)
    }
  }

  private startStateSync(): void {
    this.syncInterval = setInterval(() => {
      this.syncStateAcrossSessions()
    }, this.config.syncIntervalMs)
    
    console.log('🔄 State synchronization started')
  }

  private async syncStateAcrossSessions(): Promise<void> {
    // Check for newer state from other sessions
    try {
      const latestState = await this.loadFromSupabase()
      
      if (latestState && this.currentState) {
        const latestUpdate = new Date(latestState.lastUpdate).getTime()
        const currentUpdate = new Date(this.currentState.lastUpdate).getTime()
        
        if (latestUpdate > currentUpdate && latestState.sessionId !== this.sessionId) {
          console.log('🔄 Newer state found from another session, syncing...')
          this.currentState = latestState
          this.notifySubscribers(latestState)
        }
      }
    } catch (error) {
      console.error('❌ State sync failed:', error)
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private validateState(state: any): boolean {
    return (
      state &&
      typeof state === 'object' &&
      typeof state.lastUpdate === 'string' &&
      typeof state.sessionId === 'string'
    )
  }

  private createDefaultState(): DashboardState {
    return {
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
      sessionId: this.sessionId
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private notifySubscribers(state: DashboardState): void {
    this.subscribers.forEach(callback => {
      try {
        callback(state)
      } catch (error) {
        console.error('❌ Subscriber notification failed:', error)
      }
    })
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  public subscribe(callback: (state: DashboardState) => void): () => void {
    this.subscribers.add(callback)
    
    // Immediately notify with current state if available
    if (this.currentState) {
      callback(this.currentState)
    }
    
    return () => {
      this.subscribers.delete(callback)
    }
  }

  public getCurrentState(): DashboardState | null {
    return this.currentState
  }

  public getHealth(): Map<PersistenceLayer, PersistenceHealth> {
    return new Map(this.health)
  }

  public getMetrics(): Map<PersistenceLayer, PersistenceMetrics> {
    return new Map(this.metrics)
  }

  public async backup(): Promise<boolean> {
    if (!this.currentState) return false
    return this.saveState(this.currentState)
  }

  public async restore(): Promise<DashboardState | null> {
    return this.loadState()
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.subscribers.clear()
    this.memoryStore.clear()
    
    console.log('🛑 Autonomous persistence orchestrator destroyed')
  }
}

// Export singleton instance
export const autonomousPersistenceOrchestrator = AutonomousPersistenceOrchestrator.getInstance()
export default autonomousPersistenceOrchestrator
export type { DashboardState, PersistenceHealth, PersistenceMetrics }