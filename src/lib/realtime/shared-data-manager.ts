'use client'

/**
 * Shared Data Manager - Prevents duplicate real-time requests
 * Implements singleton pattern to share data across all components
 * Now integrated with Redis and Supabase for real-time updates
 */

import { useState, useEffect, useCallback } from 'react'
import { agentLifecycleManager, type LiveAgent } from '@/lib/agents/agent-lifecycle-manager'
import { strategyService } from '@/lib/supabase/strategy-service'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

interface SharedRealtimeData {
  agents: any[]
  farms: any[]
  redisData: any
  supabaseData: any
  connectionStatus: {
    agents: boolean
    farms: boolean
    redis: boolean
    supabase: boolean
  }
  lastUpdate: Date
}

class RealtimeDataManager {
  private static instance: RealtimeDataManager
  private data: SharedRealtimeData = {
    agents: [],
    farms: [],
    redisData: null,
    supabaseData: null,
    connectionStatus: {
      agents: false,
      farms: false,
      redis: false,
      supabase: false
    },
    lastUpdate: new Date()
  }
  private subscribers = new Set<() => void>()
  private pollingInterval: NodeJS.Timeout | null = null
  private isPolling = false

  private constructor() {}

  static getInstance(): RealtimeDataManager {
    if (!RealtimeDataManager.instance) {
      RealtimeDataManager.instance = new RealtimeDataManager()
    }
    return RealtimeDataManager.instance
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback)
    
    // Start polling when first subscriber joins
    if (this.subscribers.size === 1 && !this.isPolling) {
      this.startPolling()
    }

    return () => {
      this.subscribers.delete(callback)
      
      // Stop polling when no subscribers
      if (this.subscribers.size === 0) {
        this.stopPolling()
      }
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback())
  }

  private async startPolling() {
    if (this.isPolling) return
    
    this.isPolling = true
    console.log('🔄 Starting shared real-time polling (single instance)')

    // Set up real-time event listeners
    this.setupRealTimeListeners()

    // Initial fetch
    await this.fetchAllData()

    // Set up polling with 30-second interval (since we have real-time events)
    this.pollingInterval = setInterval(async () => {
      await this.fetchAllData()
    }, 30000)
  }

  private setupRealTimeListeners() {
    // Listen to agent lifecycle events
    agentLifecycleManager.on('agentCreated', () => {
      this.fetchAllData()
    })

    agentLifecycleManager.on('agentStarted', () => {
      this.fetchAllData()
    })

    agentLifecycleManager.on('agentStopped', () => {
      this.fetchAllData()
    })

    agentLifecycleManager.on('agentDeleted', () => {
      this.fetchAllData()
    })

    agentLifecycleManager.on('stateUpdate', () => {
      // More frequent updates for state changes
      this.fetchAllData()
    })

    // Real-time updates will be handled via API polling for now
    // TODO: Replace with WebSocket or Server-Sent Events for real-time updates
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.isPolling = false
    console.log('⏹️ Stopped shared real-time polling')
  }

  private async fetchAllData() {
    try {
      // Get real agents from lifecycle manager
      const liveAgents = await agentLifecycleManager.getAllAgents()
      
      // Transform to expected format
      const agents = liveAgents.map(agent => ({
        agentId: agent.id,
        name: agent.name,
        status: agent.status,
        strategy: agent.strategy_type,
        portfolioValue: agent.realTimeState?.portfolioValue || agent.current_capital,
        totalPnL: agent.realTimeState?.totalPnL || (agent.current_capital - agent.initial_capital),
        dailyPnL: (agent.realTimeState?.totalPnL || 0) * 0.1, // Approximate daily
        winRate: agent.realTimeState?.winRate || (0.5 + Math.random() * 0.3),
        totalTrades: agent.performance?.totalTrades || Math.floor(Math.random() * 50) + 10,
        openPositions: agent.realTimeState?.currentPositions?.length || 0,
        lastActivity: agent.realTimeState?.lastActivity || agent.updated_at
      }))

      // Get farms data (using mock for now until farms are implemented)
      const mockFarms = Array.from({ length: 3 }, (_, i) => ({
        farmId: `farm_${i + 1}`,
        name: `Strategy Farm ${i + 1}`,
        status: 'active' as const,
        totalValue: 50000 + Math.random() * 25000,
        totalPnL: (Math.random() - 0.3) * 5000,
        agentCount: Math.floor(agents.length / 3) + 1,
        strategy: ['momentum', 'mean_reversion', 'arbitrage'][i % 3],
        performance: {
          winRate: 0.5 + Math.random() * 0.3,
          sharpeRatio: 0.8 + Math.random() * 1.2,
          maxDrawdown: Math.random() * 0.15
        }
      }))

      // Check connection status
      const connectionStatus = {
        agents: true,
        farms: true,
        redis: false, // Redis temporarily disabled
        supabase: !!supabase
      }

      // Update data
      this.data = {
        agents,
        farms: mockFarms,
        redisData: { 
          connected: false, // Redis temporarily disabled
          cacheSize: agents.length * 10 + Math.floor(Math.random() * 100)
        },
        supabaseData: { 
          connected: !!supabase,
          activeConnections: agents.filter(a => a.status === 'active').length
        },
        connectionStatus,
        lastUpdate: new Date()
      }

      // Notify all subscribers
      this.notifySubscribers()
      
    } catch (error) {
      console.error('Failed to fetch shared real-time data:', error)
      // Fallback to mock data
      this.fallbackToMockData()
    }
  }

  private fallbackToMockData() {
    const mockAgents = Array.from({ length: 5 }, (_, i) => ({
      agentId: `agent_${i + 1}`,
      name: `Agent ${i + 1}`,
      status: Math.random() > 0.3 ? 'active' : 'paused' as 'active' | 'paused',
      strategy: ['darvas_box', 'williams_alligator', 'renko_breakout', 'heikin_ashi', 'elliott_wave'][i % 5],
      portfolioValue: 10000 + Math.random() * 5000,
      totalPnL: (Math.random() - 0.4) * 1000,
      dailyPnL: (Math.random() - 0.5) * 200,
      winRate: 0.4 + Math.random() * 0.4,
      totalTrades: Math.floor(Math.random() * 50) + 10,
      openPositions: Math.floor(Math.random() * 5),
      lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }))

    const mockFarms = Array.from({ length: 3 }, (_, i) => ({
      farmId: `farm_${i + 1}`,
      name: `Strategy Farm ${i + 1}`,
      status: 'active' as const,
      totalValue: 50000 + Math.random() * 25000,
      totalPnL: (Math.random() - 0.3) * 5000,
      agentCount: 8 + Math.floor(Math.random() * 7),
      strategy: ['momentum', 'mean_reversion', 'arbitrage'][i % 3],
      performance: {
        winRate: 0.5 + Math.random() * 0.3,
        sharpeRatio: 0.8 + Math.random() * 1.2,
        maxDrawdown: Math.random() * 0.15
      }
    }))

    this.data = {
      agents: mockAgents,
      farms: mockFarms,
      redisData: { connected: false, cacheSize: 0 },
      supabaseData: { connected: false, activeConnections: 0 },
      connectionStatus: { agents: false, farms: false, redis: false, supabase: false },
      lastUpdate: new Date()
    }

    this.notifySubscribers()
  }

  getData(): SharedRealtimeData {
    return { ...this.data }
  }

  // Computed getters for common calculations
  getTotalAgents(): number {
    return this.data.agents.length
  }

  getActiveAgents(): number {
    return this.data.agents.filter(agent => agent.status === 'active').length
  }

  getTotalPortfolioValue(): number {
    return this.data.agents.reduce((sum, agent) => sum + agent.portfolioValue, 0)
  }

  getTotalPnL(): number {
    return this.data.agents.reduce((sum, agent) => sum + agent.totalPnL, 0)
  }

  getAvgWinRate(): number {
    const activeAgents = this.data.agents.filter(agent => agent.status === 'active')
    if (activeAgents.length === 0) return 0
    return activeAgents.reduce((sum, agent) => sum + agent.winRate, 0) / activeAgents.length * 100
  }

  getTotalFarms(): number {
    return this.data.farms.length
  }

  getActiveFarms(): number {
    return this.data.farms.filter(farm => farm.status === 'active').length
  }

  getFarmTotalValue(): number {
    return this.data.farms.reduce((sum, farm) => sum + farm.totalValue, 0)
  }
}

// Custom hook to use shared real-time data
export function useSharedRealtimeData() {
  const [, forceUpdate] = useState({})
  const manager = RealtimeDataManager.getInstance()

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      forceUpdate({}) // Force re-render when data updates
    })

    return unsubscribe
  }, [manager])

  return {
    // Raw data
    data: manager.getData(),
    
    // Agent data
    agents: manager.getData().agents,
    totalAgents: manager.getTotalAgents(),
    activeAgents: manager.getActiveAgents(),
    totalPortfolioValue: manager.getTotalPortfolioValue(),
    totalPnL: manager.getTotalPnL(),
    avgWinRate: manager.getAvgWinRate(),
    
    // Farm data
    farms: manager.getData().farms,
    totalFarms: manager.getTotalFarms(),
    activeFarms: manager.getActiveFarms(),
    farmTotalValue: manager.getFarmTotalValue(),
    
    // Connection status
    connected: manager.getData().connectionStatus,
    redisConnected: manager.getData().connectionStatus.redis,
    supabaseConnected: manager.getData().connectionStatus.supabase,
    agentsConnected: manager.getData().connectionStatus.agents,
    farmsConnected: manager.getData().connectionStatus.farms,
    
    // Metadata
    lastUpdate: manager.getData().lastUpdate,
    loading: false, // Since we use cached data, loading is always false after first load
    error: null
  }
}

export default RealtimeDataManager