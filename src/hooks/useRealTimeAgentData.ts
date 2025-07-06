/**
 * Real-Time Agent Data Hook
 * Subscribes to WebSocket events for live agent updates from paper trading and LLM decisions
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useWebSocket } from '@/lib/websocket/enhanced-websocket-client'

export interface RealTimeAgentData {
  agentId: string
  name: string
  strategy: string
  status: 'active' | 'stopped' | 'paused'
  performance: {
    portfolioValue: number
    pnl: number
    winRate: number
    tradeCount: number
    sharpeRatio: number
    maxDrawdown: number
    activePositions: number
    pendingOrders: number
  }
  lastUpdate: string
  lastTrade?: any
  lastDecision?: any
}

export interface RealTimePortfolioData {
  totalAgents: number
  activeAgents: number
  totalValue: number
  totalPnL: number
  totalTrades: number
  avgWinRate: number
  lastUpdate: string
}

interface UseRealTimeAgentDataReturn {
  agents: Map<string, RealTimeAgentData>
  portfolioData: RealTimePortfolioData | null
  lastPaperTrade: any | null
  lastLLMDecision: any | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  isSubscribed: boolean
  subscribe: () => void
  unsubscribe: () => void
  refreshData: () => void
}

export function useRealTimeAgentData(): UseRealTimeAgentDataReturn {
  const { client, connectionState, subscribe: wsSubscribe, isConnected } = useWebSocket()
  
  const [agents, setAgents] = useState<Map<string, RealTimeAgentData>>(new Map())
  const [portfolioData, setPortfolioData] = useState<RealTimePortfolioData | null>(null)
  const [lastPaperTrade, setLastPaperTrade] = useState<any | null>(null)
  const [lastLLMDecision, setLastLLMDecision] = useState<any | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Handle agent updates
  const handleAgentUpdate = useCallback((data: any) => {
    console.log('📊 Real-time agent update received:', data)
    
    const agentData: RealTimeAgentData = {
      agentId: data.agentId || data.id,
      name: data.name || 'Unknown Agent',
      strategy: data.strategy || 'unknown',
      status: data.status || 'stopped',
      performance: {
        portfolioValue: data.currentCapital || data.portfolioValue || 0,
        pnl: data.performance?.totalPnL || data.pnl || 0,
        winRate: data.performance?.winRate || data.winRate || 0,
        tradeCount: data.performance?.totalTrades || data.tradeCount || 0,
        sharpeRatio: data.performance?.sharpeRatio || data.sharpeRatio || 0,
        maxDrawdown: data.performance?.maxDrawdown || data.maxDrawdown || 0,
        activePositions: data.performance?.activePositions || 0,
        pendingOrders: data.performance?.pendingOrders || 0
      },
      lastUpdate: data.lastActive || data.timestamp || new Date().toISOString(),
      lastTrade: data.lastTrade,
      lastDecision: data.lastDecision
    }

    setAgents(prev => {
      const updated = new Map(prev)
      updated.set(agentData.agentId, agentData)
      return updated
    })
  }, [])

  // Handle portfolio updates
  const handlePortfolioUpdate = useCallback((data: any) => {
    console.log('💼 Real-time portfolio update received:', data)
    
    setPortfolioData({
      totalAgents: data.totalAgents || 0,
      activeAgents: data.activeAgents || 0,
      totalValue: data.totalValue || 0,
      totalPnL: data.totalPnL || 0,
      totalTrades: data.totalTrades || 0,
      avgWinRate: data.avgWinRate || 0,
      lastUpdate: data.lastUpdate || new Date().toISOString()
    })
  }, [])

  // Handle paper trade events
  const handlePaperTrade = useCallback((data: any) => {
    console.log('🎯 Real-time paper trade received:', data)
    setLastPaperTrade(data)
    
    // Update agent performance based on trade
    if (data.agentId) {
      setAgents(prev => {
        const updated = new Map(prev)
        const existingAgent = updated.get(data.agentId)
        
        if (existingAgent) {
          updated.set(data.agentId, {
            ...existingAgent,
            performance: {
              ...existingAgent.performance,
              tradeCount: existingAgent.performance.tradeCount + 1,
              pnl: existingAgent.performance.pnl + (data.pnl || 0)
            },
            lastTrade: data,
            lastUpdate: data.timestamp || new Date().toISOString()
          })
        } else {
          // Create new agent data from trade
          updated.set(data.agentId, {
            agentId: data.agentId,
            name: data.agentName || 'Unknown Agent',
            strategy: data.strategy || 'unknown',
            status: 'active',
            performance: {
              portfolioValue: 10000, // Default
              pnl: data.pnl || 0,
              winRate: data.pnl > 0 ? 100 : 0,
              tradeCount: 1,
              sharpeRatio: 0,
              maxDrawdown: 0,
              activePositions: 1,
              pendingOrders: 0
            },
            lastUpdate: data.timestamp || new Date().toISOString(),
            lastTrade: data
          })
        }
        
        return updated
      })
    }
  }, [])

  // Handle LLM trading decisions
  const handleTradingDecision = useCallback((data: any) => {
    console.log('🧠 Real-time LLM decision received:', data)
    setLastLLMDecision(data)
    
    // Update agent with decision data
    if (data.agentId) {
      setAgents(prev => {
        const updated = new Map(prev)
        const existingAgent = updated.get(data.agentId)
        
        if (existingAgent) {
          updated.set(data.agentId, {
            ...existingAgent,
            lastDecision: data,
            lastUpdate: data.timestamp || new Date().toISOString()
          })
        }
        
        return updated
      })
    }
  }, [])

  // Handle market data updates
  const handleMarketData = useCallback((data: any) => {
    console.log('📈 Real-time market data received:', data)
    // Market data can trigger strategy recalculations
  }, [])

  // Subscribe to WebSocket events
  const subscribe = useCallback(() => {
    if (!isConnected() || isSubscribed) return
    
    console.log('🔌 Subscribing to real-time agent data events...')
    
    const unsubscribers = [
      wsSubscribe('agent_update', handleAgentUpdate),
      wsSubscribe('portfolio_update', handlePortfolioUpdate),
      wsSubscribe('paper_trade', handlePaperTrade),
      wsSubscribe('trading_decision', handleTradingDecision),
      wsSubscribe('market_data', handleMarketData)
    ]
    
    setIsSubscribed(true)
    
    // Store unsubscribers for cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub())
      setIsSubscribed(false)
    }
  }, [isConnected, isSubscribed, wsSubscribe, handleAgentUpdate, handlePortfolioUpdate, handlePaperTrade, handleTradingDecision, handleMarketData])

  // Unsubscribe from WebSocket events
  const unsubscribe = useCallback(() => {
    setIsSubscribed(false)
    console.log('🔌 Unsubscribed from real-time agent data events')
  }, [])

  // Refresh data from API
  const refreshData = useCallback(async () => {
    try {
      // Trigger paper trade simulation to get fresh data
      const response = await fetch('/api/trading/paper/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      })
      
      if (response.ok) {
        console.log('🔄 Triggered data refresh via paper trade simulation')
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }, [])

  // Auto-subscribe when WebSocket connects
  useEffect(() => {
    if (isConnected() && !isSubscribed) {
      subscribe()
    }
  }, [isConnected, isSubscribed, subscribe])

  // Auto-refresh data periodically
  useEffect(() => {
    const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [refreshData])

  return {
    agents,
    portfolioData,
    lastPaperTrade,
    lastLLMDecision,
    connectionStatus: connectionState,
    isSubscribed,
    subscribe,
    unsubscribe,
    refreshData
  }
}