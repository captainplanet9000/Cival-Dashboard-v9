'use client'

/**
 * Shared Data Manager - Prevents duplicate real-time requests
 * Implements singleton pattern to share data across all components
 */

import { useState, useEffect, useCallback } from 'react'

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

    // Initial fetch
    await this.fetchAllData()

    // Set up polling with 15-second interval (reduced from multiple 8-second intervals)
    this.pollingInterval = setInterval(async () => {
      await this.fetchAllData()
    }, 15000)
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
      // Mock data for now - replace with actual API calls when backend is ready
      const mockAgents = Array.from({ length: 5 }, (_, i) => ({
        agentId: `agent_${i + 1}`,
        name: `Agent ${i + 1}`,
        status: Math.random() > 0.3 ? 'active' : 'paused',
        portfolioValue: 10000 + Math.random() * 5000,
        totalPnL: (Math.random() - 0.4) * 1000,
        winRate: 0.4 + Math.random() * 0.4,
        totalTrades: Math.floor(Math.random() * 50) + 10
      }))

      const mockFarms = Array.from({ length: 3 }, (_, i) => ({
        farmId: `farm_${i + 1}`,
        name: `Farm ${i + 1}`,
        status: 'active',
        totalValue: 50000 + Math.random() * 25000,
        agentCount: 8 + Math.floor(Math.random() * 7)
      }))

      // Update data
      this.data = {
        agents: mockAgents,
        farms: mockFarms,
        redisData: { 
          connected: Math.random() > 0.1,
          cacheSize: Math.floor(Math.random() * 1000) + 500
        },
        supabaseData: { 
          connected: Math.random() > 0.05,
          activeConnections: Math.floor(Math.random() * 10) + 3
        },
        connectionStatus: {
          agents: true,
          farms: true,
          redis: Math.random() > 0.1,
          supabase: Math.random() > 0.05
        },
        lastUpdate: new Date()
      }

      // Notify all subscribers
      this.notifySubscribers()
      
    } catch (error) {
      console.error('Failed to fetch shared real-time data:', error)
    }
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