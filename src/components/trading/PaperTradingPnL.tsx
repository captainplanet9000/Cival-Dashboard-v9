'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, Users, Bot,
  ArrowUpRight, ArrowDownRight, RefreshCw, PieChart, Target,
  Zap, CheckCircle, AlertTriangle, BarChart3, Play, Pause
} from 'lucide-react'

// AG-UI Protocol integration
import { useAGUI } from '@/lib/hooks/useAGUI'
import { emit } from '@/lib/ag-ui-protocol-v2'

// Types
interface AgentPnL {
  agentId: string
  agentName: string
  totalPnl: number
  realizedPnl: number
  unrealizedPnl: number
  currentBalance: number
  initialBalance: number
  openPositions: number
  totalTrades: number
  winningTrades: number
  winRate: number
  dailyPnl: number
  maxDrawdown: number
  status: 'active' | 'inactive' | 'paused'
}

interface Position {
  symbol: string
  agentId: string
  agentName: string
  side: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  value: number
  timestamp: string
}

interface TradingSummary {
  totalPortfolioValue: number
  totalPnl: number
  totalRealizedPnl: number
  totalUnrealizedPnl: number
  dailyPnl: number
  activeAgents: number
  totalPositions: number
  totalTrades: number
  averageWinRate: number
  bestPerformer: AgentPnL | null
  worstPerformer: AgentPnL | null
}

export function PaperTradingPnL() {
  const [agentPnLs, setAgentPnLs] = useState<AgentPnL[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [summary, setSummary] = useState<TradingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)

  // AG-UI Protocol integration for real-time updates
  const agui = useAGUI({
    autoConnect: true,
    reconnectOnFailure: true
  })

  // Generate realistic mock data
  const generateMockData = useCallback(() => {
    const agents: AgentPnL[] = [
      {
        agentId: 'alpha_trading_bot',
        agentName: 'Alpha Trading Bot',
        totalPnl: 1245.67,
        realizedPnl: 890.23,
        unrealizedPnl: 355.44,
        currentBalance: 101245.67,
        initialBalance: 100000,
        openPositions: 3,
        totalTrades: 47,
        winningTrades: 32,
        winRate: 68.1,
        dailyPnl: 127.89,
        maxDrawdown: -234.56,
        status: 'active'
      },
      {
        agentId: 'risk_guardian',
        agentName: 'Risk Guardian',
        totalPnl: 789.12,
        realizedPnl: 456.78,
        unrealizedPnl: 332.34,
        currentBalance: 100789.12,
        initialBalance: 100000,
        openPositions: 2,
        totalTrades: 34,
        winningTrades: 28,
        winRate: 82.4,
        dailyPnl: 45.67,
        maxDrawdown: -123.45,
        status: 'active'
      },
      {
        agentId: 'sophia_reversion',
        agentName: 'Sophia Reversion',
        totalPnl: -156.78,
        realizedPnl: -89.45,
        unrealizedPnl: -67.33,
        currentBalance: 99843.22,
        initialBalance: 100000,
        openPositions: 1,
        totalTrades: 23,
        winningTrades: 11,
        winRate: 47.8,
        dailyPnl: -23.44,
        maxDrawdown: -345.67,
        status: 'active'
      },
      {
        agentId: 'marcus_momentum',
        agentName: 'Marcus Momentum',
        totalPnl: 567.89,
        realizedPnl: 234.56,
        unrealizedPnl: 333.33,
        currentBalance: 100567.89,
        initialBalance: 100000,
        openPositions: 4,
        totalTrades: 56,
        winningTrades: 34,
        winRate: 60.7,
        dailyPnl: 78.90,
        maxDrawdown: -189.45,
        status: 'active'
      },
      {
        agentId: 'alex_arbitrage',
        agentName: 'Alex Arbitrage',
        totalPnl: 345.67,
        realizedPnl: 123.45,
        unrealizedPnl: 222.22,
        currentBalance: 100345.67,
        initialBalance: 100000,
        openPositions: 2,
        totalTrades: 28,
        winningTrades: 21,
        winRate: 75.0,
        dailyPnl: 34.56,
        maxDrawdown: -67.89,
        status: 'paused'
      }
    ]

    const mockPositions: Position[] = [
      {
        symbol: 'BTC/USDT',
        agentId: 'alpha_trading_bot',
        agentName: 'Alpha Trading Bot',
        side: 'long',
        quantity: 0.05,
        entryPrice: 67500,
        currentPrice: 68200,
        unrealizedPnl: 35.00,
        unrealizedPnlPercent: 1.04,
        value: 3410,
        timestamp: '2024-12-15T10:30:00Z'
      },
      {
        symbol: 'ETH/USDT',
        agentId: 'risk_guardian',
        agentName: 'Risk Guardian',
        side: 'long',
        quantity: 2.5,
        entryPrice: 3850,
        currentPrice: 3920,
        unrealizedPnl: 175.00,
        unrealizedPnlPercent: 1.82,
        value: 9800,
        timestamp: '2024-12-15T09:15:00Z'
      },
      {
        symbol: 'SOL/USDT',
        agentId: 'marcus_momentum',
        agentName: 'Marcus Momentum',
        side: 'long',
        quantity: 15,
        entryPrice: 215,
        currentPrice: 228,
        unrealizedPnl: 195.00,
        unrealizedPnlPercent: 6.05,
        value: 3420,
        timestamp: '2024-12-15T11:45:00Z'
      },
      {
        symbol: 'ADA/USDT',
        agentId: 'sophia_reversion',
        agentName: 'Sophia Reversion',
        side: 'short',
        quantity: 1000,
        entryPrice: 1.25,
        currentPrice: 1.18,
        unrealizedPnl: 70.00,
        unrealizedPnlPercent: 5.60,
        value: 1180,
        timestamp: '2024-12-15T08:20:00Z'
      },
      {
        symbol: 'AVAX/USDT',
        agentId: 'alex_arbitrage',
        agentName: 'Alex Arbitrage',
        side: 'long',
        quantity: 25,
        entryPrice: 45.80,
        currentPrice: 47.20,
        unrealizedPnl: 35.00,
        unrealizedPnlPercent: 3.06,
        value: 1180,
        timestamp: '2024-12-15T12:10:00Z'
      }
    ]

    const totalPnl = agents.reduce((sum, agent) => sum + agent.totalPnl, 0)
    const totalRealizedPnl = agents.reduce((sum, agent) => sum + agent.realizedPnl, 0)
    const totalUnrealizedPnl = agents.reduce((sum, agent) => sum + agent.unrealizedPnl, 0)
    const totalPortfolioValue = agents.reduce((sum, agent) => sum + agent.currentBalance, 0)
    const dailyPnl = agents.reduce((sum, agent) => sum + agent.dailyPnl, 0)
    const activeAgents = agents.filter(a => a.status === 'active').length
    const totalTrades = agents.reduce((sum, agent) => sum + agent.totalTrades, 0)
    const totalWinningTrades = agents.reduce((sum, agent) => sum + agent.winningTrades, 0)
    const averageWinRate = totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0

    const bestPerformer = agents.reduce((best, current) => 
      current.totalPnl > best.totalPnl ? current : best
    )
    
    const worstPerformer = agents.reduce((worst, current) => 
      current.totalPnl < worst.totalPnl ? current : worst
    )

    const mockSummary: TradingSummary = {
      totalPortfolioValue,
      totalPnl,
      totalRealizedPnl,
      totalUnrealizedPnl,
      dailyPnl,
      activeAgents,
      totalPositions: mockPositions.length,
      totalTrades,
      averageWinRate,
      bestPerformer,
      worstPerformer
    }

    setAgentPnLs(agents)
    setPositions(mockPositions)
    setSummary(mockSummary)
    setLastUpdate(new Date())
  }, [])

  // Load data
  const fetchPaperTradingData = useCallback(async () => {
    setLoading(true)
    try {
      // Try to fetch real data from API
      const response = await fetch('/api/trading/paper/portfolio')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAgentPnLs(data.agents || [])
          setPositions(data.positions || [])
          setSummary(data.summary || null)
          setLastUpdate(new Date())
          return
        }
      }
      
      // Fallback to mock data
      generateMockData()
    } catch (error) {
      console.error('Failed to fetch paper trading data:', error)
      generateMockData()
    } finally {
      setLoading(false)
    }
  }, [generateMockData])

  // AG-UI Event Listeners for real-time updates
  useEffect(() => {
    if (!agui.isConnected) return

    // Listen for paper trading events
    const unsubscribeTrade = agui.subscribe('paper_trading.trade_executed', (data) => {
      console.log('AG-UI: Trade executed', data)
      // Update positions and agent P&L in real-time
      fetchPaperTradingData()
      
      // Emit notification for successful trade
      emit('notification.show', {
        type: 'success',
        title: 'Trade Executed',
        message: `${data.agentName} executed ${data.side} order for ${data.symbol}`,
        duration: 5000
      })
    })

    const unsubscribePosition = agui.subscribe('paper_trading.position_updated', (data) => {
      console.log('AG-UI: Position updated', data)
      setPositions(prev => prev.map(pos => 
        pos.agentId === data.agentId && pos.symbol === data.symbol 
          ? { ...pos, ...data.position }
          : pos
      ))
    })

    const unsubscribePnL = agui.subscribe('paper_trading.pnl_updated', (data) => {
      console.log('AG-UI: P&L updated', data)
      setAgentPnLs(prev => prev.map(agent =>
        agent.agentId === data.agentId
          ? { 
              ...agent, 
              totalPnl: data.totalPnl,
              unrealizedPnl: data.unrealizedPnl,
              dailyPnl: data.dailyPnl
            }
          : agent
      ))
    })

    const unsubscribeAgent = agui.subscribe('agent.status_changed', (data) => {
      console.log('AG-UI: Agent status changed', data)
      setAgentPnLs(prev => prev.map(agent =>
        agent.agentId === data.agentId
          ? { ...agent, status: data.status }
          : agent
      ))
    })

    return () => {
      unsubscribeTrade()
      unsubscribePosition()
      unsubscribePnL()
      unsubscribeAgent()
    }
  }, [agui.isConnected, fetchPaperTradingData])

  useEffect(() => {
    fetchPaperTradingData()
    
    // Set up periodic updates (longer interval when real-time is enabled)
    const interval = setInterval(fetchPaperTradingData, realTimeUpdates ? 60000 : 30000)
    return () => clearInterval(interval)
  }, [fetchPaperTradingData, realTimeUpdates])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'paused': return <Activity className="h-4 w-4 text-yellow-600" />
      case 'inactive': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  // AG-UI Control Functions
  const handleAgentAction = (agentId: string, action: 'start' | 'pause' | 'stop') => {
    emit('agent.control', {
      agentId,
      action,
      timestamp: new Date().toISOString()
    })

    // Optimistically update UI
    setAgentPnLs(prev => prev.map(agent =>
      agent.agentId === agentId
        ? { ...agent, status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'inactive' }
        : agent
    ))
  }

  const handleRefreshData = () => {
    emit('paper_trading.refresh_request', {
      timestamp: new Date().toISOString()
    })
    fetchPaperTradingData()
  }

  const handleToggleRealTime = () => {
    setRealTimeUpdates(!realTimeUpdates)
    emit('paper_trading.realtime_toggle', {
      enabled: !realTimeUpdates,
      timestamp: new Date().toISOString()
    })
  }

  const handleSimulateTrade = async () => {
    try {
      const response = await fetch('/api/trading/paper/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.trades.length > 0) {
          const trade = result.trades[0]
          
          // Emit AG-UI event for immediate UI update
          emit('paper_trading.trade_executed', {
            ...trade,
            type: 'simulated'
          })
          
          // Refresh data to get updated totals
          setTimeout(() => fetchPaperTradingData(), 1000)
        }
      }
    } catch (error) {
      console.error('Failed to simulate trade:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Paper Trading P&L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Paper Trading Portfolio
                </CardTitle>
                <CardDescription>
                  Simulated trading performance across all agents
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* AG-UI Status Indicator */}
                <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
                  <div className={`w-2 h-2 rounded-full ${agui.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-muted-foreground">
                    {agui.isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                
                {/* Real-time Toggle */}
                <Button 
                  variant={realTimeUpdates ? "default" : "outline"} 
                  size="sm" 
                  onClick={handleToggleRealTime}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Real-time
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleRefreshData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <span className="text-sm text-muted-foreground">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.totalPortfolioValue)}
                </div>
                <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.totalPnl >= 0 ? '+' : ''}{formatCurrency(summary.totalPnl)}
                </div>
                <div className="text-sm text-muted-foreground">Total P&L</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.dailyPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.dailyPnl >= 0 ? '+' : ''}{formatCurrency(summary.dailyPnl)}
                </div>
                <div className="text-sm text-muted-foreground">Daily P&L</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.averageWinRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Win Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Active Agents</span>
                </div>
                <span className="font-semibold">{summary.activeAgents}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Open Positions</span>
                </div>
                <span className="font-semibold">{summary.totalPositions}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Total Trades</span>
                </div>
                <span className="font-semibold">{summary.totalTrades}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tables */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="positions">Open Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Individual agent trading results</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {agentPnLs.map((agent) => (
                    <div key={agent.agentId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(agent.status)}
                          <div>
                            <div className="font-semibold">{agent.agentName}</div>
                            <div className="text-sm text-muted-foreground">
                              {agent.totalTrades} trades • {agent.winRate.toFixed(1)}% win rate
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={agent.totalPnl >= 0 ? "default" : "destructive"}>
                            {agent.totalPnl >= 0 ? '+' : ''}{formatCurrency(agent.totalPnl)}
                          </Badge>
                          
                          {/* AG-UI Agent Control Buttons */}
                          {agent.status === 'active' ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAgentAction(agent.agentId, 'pause')}
                            >
                              <Activity className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAgentAction(agent.agentId, 'start')}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Balance</div>
                          <div className="font-medium">{formatCurrency(agent.currentBalance)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Realized P&L</div>
                          <div className={`font-medium ${agent.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(agent.realizedPnl)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Unrealized P&L</div>
                          <div className={`font-medium ${agent.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(agent.unrealizedPnl)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Open Positions</div>
                          <div className="font-medium">{agent.openPositions}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Win Rate</span>
                          <span>{agent.winRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={agent.winRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>Current agent positions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {positions.map((position, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{position.symbol}</span>
                            <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                              {position.side.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{position.agentName}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(position.unrealizedPnl)}
                          </div>
                          <div className={`text-sm ${position.unrealizedPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(position.unrealizedPnlPercent)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Quantity</div>
                          <div className="font-medium">{position.quantity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Entry Price</div>
                          <div className="font-medium">{formatCurrency(position.entryPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Current Price</div>
                          <div className="font-medium">{formatCurrency(position.currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Value</div>
                          <div className="font-medium">{formatCurrency(position.value)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {positions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No open positions
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}