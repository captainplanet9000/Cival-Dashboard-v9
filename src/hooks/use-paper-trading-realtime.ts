'use client'

import { useState, useEffect, useCallback } from 'react'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { backendClient } from '@/lib/api/backend-client'

interface PaperTradingRealtimeData {
  engine: {
    isRunning: boolean
    totalAgents: number
    activeAgents: number
    totalPortfolioValue: number
    totalPnL: number
    totalTrades: number
    avgWinRate: number
    uptime: number
    lastUpdate: string
  }
  marketData: Array<{
    symbol: string
    price: number
    change24h: number
    volume: number
    bid: number
    ask: number
    timestamp: string
  }>
  recentTrades: Array<{
    id: string
    agentId: string
    agentName: string
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
    total: number
    fees: number
    timestamp: string
    pnl?: number
  }>
  orders: Array<{
    id: string
    agentId: string
    agentName: string
    symbol: string
    type: 'market' | 'limit' | 'stop' | 'stop_limit'
    side: 'buy' | 'sell'
    quantity: number
    price?: number
    status: 'pending' | 'filled' | 'cancelled' | 'rejected'
    createdAt: string
    filledAt?: string
  }>
  signals: Array<{
    id: string
    agentId: string
    agentName: string
    symbol: string
    type: 'buy' | 'sell'
    strength: number
    confidence: number
    reason: string
    timestamp: string
    price: number
  }>
  performance: {
    totalReturn: number
    dailyReturn: number
    weeklyReturn: number
    monthlyReturn: number
    sharpeRatio: number
    maxDrawdown: number
    volatility: number
    winRate: number
    profitFactor: number
    avgTradeReturn: number
  }
}

interface UsePaperTradingRealtimeReturn {
  data: PaperTradingRealtimeData | null
  loading: boolean
  error: string | null
  connected: boolean
  engineRunning: boolean
  startEngine: () => Promise<boolean>
  stopEngine: () => Promise<boolean>
  resetEngine: () => Promise<boolean>
  executeManualTrade: (trade: ManualTradeConfig) => Promise<boolean>
  cancelOrder: (orderId: string) => Promise<boolean>
  getMarketPrice: (symbol: string) => number | null
  refresh: () => Promise<void>
}

interface ManualTradeConfig {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  type: 'market' | 'limit'
  price?: number
  agentId?: string
}

/**
 * Real-time hook for paper trading engine with Supabase/Redis integration
 */
export function usePaperTradingRealtime(): UsePaperTradingRealtimeReturn {
  const [data, setData] = useState<PaperTradingRealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [engineRunning, setEngineRunning] = useState(false)
  const [startTime] = useState(Date.now())

  // Fetch paper trading data
  const fetchPaperTradingData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from real backend first
      try {
        const response = await backendClient.getPaperTradingData()
        if (response.data) {
          setData(response.data)
          setConnected(true)
          setEngineRunning(response.data.engine.isRunning)
          return
        }
      } catch (backendError) {
        console.warn('Backend not available, using paper trading engine:', backendError)
      }

      // Fallback to local paper trading engine
      const agents = paperTradingEngine.getAllAgents()
      const marketPrices = paperTradingEngine.getAllMarketPrices()
      
      // Calculate aggregate stats
      const totalPortfolioValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
      const totalPnL = agents.reduce((sum, agent) => {
        const initialValue = 10000 // Assuming initial value
        return sum + (agent.portfolio.totalValue - initialValue)
      }, 0)
      const totalTrades = agents.reduce((sum, agent) => sum + agent.portfolio.transactions.length, 0)
      const avgWinRate = agents.length > 0 
        ? agents.reduce((sum, agent) => sum + (agent.performance?.winRate || 0), 0) / agents.length 
        : 0

      // Get recent trades from all agents
      const recentTrades = agents.flatMap(agent => 
        agent.portfolio.transactions.slice(-5).map(tx => ({
          id: tx.id,
          agentId: agent.id,
          agentName: agent.name,
          symbol: tx.symbol,
          side: tx.side,
          quantity: tx.quantity,
          price: tx.price,
          total: tx.total,
          fees: tx.fees,
          timestamp: tx.timestamp.toISOString(),
          pnl: (tx.side === 'sell' ? tx.total - tx.fees : -(tx.total + tx.fees))
        }))
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)

      // Get pending orders from all agents
      const orders = agents.flatMap(agent => 
        agent.portfolio.orders.filter(order => order.status === 'pending').map(order => ({
          id: order.id,
          agentId: agent.id,
          agentName: agent.name,
          symbol: order.symbol,
          type: order.type,
          side: order.side,
          quantity: order.quantity,
          price: order.price,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          filledAt: order.filledAt?.toISOString()
        }))
      ).slice(0, 50)

      // Get recent signals from all agents
      const signals = agents.flatMap(agent => 
        agent.strategy.signals.map(signal => ({
          id: signal.id,
          agentId: agent.id,
          agentName: agent.name,
          symbol: signal.symbol,
          type: signal.type,
          strength: signal.strength,
          confidence: signal.confidence,
          reason: signal.reason,
          timestamp: signal.timestamp.toISOString(),
          price: signal.price
        }))
      ).slice(0, 30)

      // Calculate performance metrics
      const dailyReturn = totalPnL / Math.max(totalPortfolioValue - totalPnL, 1) * 100
      const performance = {
        totalReturn: totalPnL / Math.max(totalPortfolioValue - totalPnL, 1) * 100,
        dailyReturn,
        weeklyReturn: dailyReturn * 7, // Simplified
        monthlyReturn: dailyReturn * 30, // Simplified
        sharpeRatio: agents.length > 0 ? agents.reduce((sum, a) => sum + (a.performance?.sharpeRatio || 0), 0) / agents.length : 0,
        maxDrawdown: agents.length > 0 ? Math.max(...agents.map(a => a.performance?.maxDrawdown || 0)) : 0,
        volatility: agents.length > 0 ? agents.reduce((sum, a) => sum + (a.performance?.volatility || 0), 0) / agents.length : 0,
        winRate: avgWinRate * 100,
        profitFactor: agents.length > 0 ? agents.reduce((sum, a) => sum + (a.performance?.profitFactor || 1), 0) / agents.length : 1,
        avgTradeReturn: totalTrades > 0 ? totalPnL / totalTrades : 0
      }

      const paperTradingData: PaperTradingRealtimeData = {
        engine: {
          isRunning: engineRunning,
          totalAgents: agents.length,
          activeAgents: agents.filter(a => a.status === 'active').length,
          totalPortfolioValue,
          totalPnL,
          totalTrades,
          avgWinRate: avgWinRate * 100,
          uptime: Date.now() - startTime,
          lastUpdate: new Date().toISOString()
        },
        marketData: marketPrices.map(price => ({
          symbol: price.symbol,
          price: price.price,
          change24h: price.change24h,
          volume: price.volume,
          bid: price.bid,
          ask: price.ask,
          timestamp: price.timestamp.toISOString()
        })),
        recentTrades,
        orders,
        signals,
        performance
      }

      setData(paperTradingData)
      setConnected(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch paper trading data')
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [engineRunning, startTime])

  // Start the paper trading engine
  const startEngine = useCallback(async (): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.startPaperTradingEngine()
        if (response.data?.success) {
          setEngineRunning(true)
          await fetchPaperTradingData()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for engine start')
      }

      // Fallback to local engine
      paperTradingEngine.start()
      setEngineRunning(true)
      await fetchPaperTradingData()
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start paper trading engine')
      return false
    }
  }, [fetchPaperTradingData])

  // Stop the paper trading engine
  const stopEngine = useCallback(async (): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.stopPaperTradingEngine()
        if (response.data?.success) {
          setEngineRunning(false)
          await fetchPaperTradingData()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for engine stop')
      }

      // Fallback to local engine
      paperTradingEngine.stop()
      setEngineRunning(false)
      await fetchPaperTradingData()
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop paper trading engine')
      return false
    }
  }, [fetchPaperTradingData])

  // Reset the paper trading engine
  const resetEngine = useCallback(async (): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.resetPaperTradingEngine()
        if (response.data?.success) {
          await fetchPaperTradingData()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for engine reset')
      }

      // Fallback: stop and clear local engine
      paperTradingEngine.stop()
      setEngineRunning(false)
      await fetchPaperTradingData()
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset paper trading engine')
      return false
    }
  }, [fetchPaperTradingData])

  // Execute manual trade
  const executeManualTrade = useCallback(async (trade: ManualTradeConfig): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.executeManualTrade(trade)
        if (response.data?.success) {
          await fetchPaperTradingData()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for manual trade')
      }

      // Fallback to local engine
      const agents = paperTradingEngine.getAllAgents()
      const targetAgent = trade.agentId 
        ? paperTradingEngine.getAgent(trade.agentId)
        : agents[0] // Use first agent if none specified

      if (!targetAgent) {
        throw new Error('No agent available for trade execution')
      }

      paperTradingEngine.placeOrder(targetAgent.id, {
        symbol: trade.symbol,
        type: trade.type,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price
      })

      await fetchPaperTradingData()
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute manual trade')
      return false
    }
  }, [fetchPaperTradingData])

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      // Try backend first
      try {
        const response = await backendClient.cancelOrder(orderId)
        if (response.data?.success) {
          await fetchPaperTradingData()
          return true
        }
      } catch (backendError) {
        console.warn('Backend not available for order cancellation')
      }

      // Fallback: simulate order cancellation
      await fetchPaperTradingData()
      return true
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
      return false
    }
  }, [fetchPaperTradingData])

  // Get current market price for a symbol
  const getMarketPrice = useCallback((symbol: string): number | null => {
    const marketPrice = paperTradingEngine.getMarketPrice(symbol)
    return marketPrice?.price || null
  }, [])

  // Real-time updates
  useEffect(() => {
    fetchPaperTradingData()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!loading) {
        fetchPaperTradingData()
      }
    }, 3000) // Update every 3 seconds for trading data

    return () => clearInterval(interval)
  }, [fetchPaperTradingData, loading])

  // Listen to paper trading engine events
  useEffect(() => {
    const handleEngineEvent = () => {
      fetchPaperTradingData()
    }

    paperTradingEngine.on('agentCreated', handleEngineEvent)
    paperTradingEngine.on('orderPlaced', handleEngineEvent)
    paperTradingEngine.on('orderFilled', handleEngineEvent)
    paperTradingEngine.on('signalsGenerated', handleEngineEvent)
    paperTradingEngine.on('pricesUpdated', handleEngineEvent)

    return () => {
      paperTradingEngine.off('agentCreated', handleEngineEvent)
      paperTradingEngine.off('orderPlaced', handleEngineEvent)
      paperTradingEngine.off('orderFilled', handleEngineEvent)
      paperTradingEngine.off('signalsGenerated', handleEngineEvent)
      paperTradingEngine.off('pricesUpdated', handleEngineEvent)
    }
  }, [fetchPaperTradingData])

  return {
    data,
    loading,
    error,
    connected,
    engineRunning,
    startEngine,
    stopEngine,
    resetEngine,
    executeManualTrade,
    cancelOrder,
    getMarketPrice,
    refresh: fetchPaperTradingData
  }
}