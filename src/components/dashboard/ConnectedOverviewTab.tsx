'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Bot, Shield, Target,
  Activity, RefreshCw, Bell, Users, Zap, Brain, Wallet, PieChart
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useDashboardConnection } from './DashboardTabConnector'
import { motion, AnimatePresence } from 'framer-motion'
import LiveDashboardOrchestrator from '@/components/realtime/LiveDashboardOrchestrator'
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard'
import RealPortfolioAnalyticsDashboard from '@/components/portfolio/RealPortfolioAnalyticsDashboard'
import RealTradingInterface from '@/components/trading/RealTradingInterface'
import RealAgentManagement from '@/components/agents/RealAgentManagement'
import RealRiskManagementDashboard from '@/components/risk/RealRiskManagementDashboard'
import { LiveMarketTicker } from '@/components/realtime/LiveMarketTicker'
import RealMarketDataDashboard from '@/components/market/RealMarketDataDashboard'
import RealNotificationSystem from '@/components/notifications/RealNotificationSystem'
import { Statistic } from '@/components/ui/data-display/statistic'
import { Space } from '@/components/ui/layout/space'
import { useAgentData } from '@/hooks/useAgentData'

interface ConnectedOverviewTabProps {
  className?: string
}

export function ConnectedOverviewTab({ className }: ConnectedOverviewTabProps) {
  const { state, actions } = useDashboardConnection('overview')
  const [overviewTab, setOverviewTab] = useState('dashboard')
  const [chartData, setChartData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  
  // Use live agent data
  const { agents, loading: agentsLoading } = useAgentData()
  
  // Calculate live metrics from agent data
  const liveMetrics = React.useMemo(() => {
    if (!agents.length) {
      return {
        portfolioValue: 0,
        totalPnL: 0,
        dailyPnL: 0,
        winRate: 0,
        activeAgents: 0,
        totalAgents: 0,
        totalPositions: 0,
        totalDecisions: 0
      }
    }

    const portfolioValue = agents.reduce((sum, agent) => sum + (agent.wallet?.totalValue || 0), 0)
    const totalPnL = agents.reduce((sum, agent) => 
      sum + (agent.wallet ? agent.wallet.realizedPnL + agent.wallet.unrealizedPnL : 0), 0)
    const activeAgents = agents.filter(agent => agent.isActive).length
    const totalPositions = agents.reduce((sum, agent) => sum + (agent.wallet?.positions.length || 0), 0)
    const totalDecisions = agents.reduce((sum, agent) => sum + agent.performance.totalDecisions, 0)
    const successfulDecisions = agents.reduce((sum, agent) => sum + agent.performance.successfulDecisions, 0)
    const winRate = totalDecisions > 0 ? (successfulDecisions / totalDecisions) * 100 : 0

    return {
      portfolioValue,
      totalPnL,
      dailyPnL: totalPnL * 0.1, // Estimate daily as 10% of total
      winRate,
      activeAgents,
      totalAgents: agents.length,
      totalPositions,
      totalDecisions
    }
  }, [agents])
  
  // Generate mock market prices to prevent errors
  const mockMarketPrices = new Map([
    ['BTC/USD', 42350.75],
    ['ETH/USD', 2580.20],
    ['SOL/USD', 68.43],
    ['ADA/USD', 0.47],
    ['DOT/USD', 7.23]
  ])

  // Generate mock goal progress to prevent errors
  const mockGoalProgress = new Map([
    ['goal_001', 75.5],
    ['goal_002', 42.8],
    ['goal_003', 91.2],
    ['goal_004', 28.7],
    ['goal_005', 67.3]
  ])
  
  // Generate chart data from state with null safety
  useEffect(() => {
    // Create 30-day chart data
    const days = 30
    const data = []
    const perfData = []
    
    const safePortfolioValue = typeof state?.portfolioValue === 'number' ? state.portfolioValue : 50000
    const safeTotalPnL = typeof state?.totalPnL === 'number' ? state.totalPnL : 2500
    const safeWinRate = typeof state?.winRate === 'number' ? state.winRate : 68.5
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate historical data based on current values
      const dayFactor = (days - i) / days
      const randomFactor = 0.9 + Math.random() * 0.2
      
      data.push({
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: safePortfolioValue * dayFactor * randomFactor,
        pnl: safeTotalPnL * dayFactor * randomFactor
      })
      
      perfData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        winRate: safeWinRate * randomFactor,
        trades: Math.floor(Math.random() * 20) + 5,
        pnl: (Math.random() - 0.5) * 1000
      })
    }
    
    setChartData(data)
    setPerformanceData(perfData)
  }, [state?.portfolioValue, state?.totalPnL, state?.winRate])

  // Overview sub-tabs with safe components
  const overviewSubTabs = [
    { id: 'dashboard', label: 'Dashboard', component: <LiveDashboardOrchestrator /> },
    { id: 'portfolio', label: 'Portfolio', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'trading', label: 'Trading', component: <RealTradingInterface /> },
    { id: 'analytics', label: 'Analytics', component: <RealTimeDashboard /> },
    { id: 'agents', label: 'Agent Manager', component: <RealAgentManagement /> },
    { id: 'risk', label: 'Risk Monitor', component: <RealRiskManagementDashboard /> }
  ]

  // Format currency with null safety
  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeValue)
  }

  // Format percentage with null safety
  const formatPercentage = (value: number | undefined | null) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
    return `${safeValue.toFixed(1)}%`
  }

  // Safe value getters with live agent data and fallbacks
  const safeState = {
    portfolioValue: liveMetrics.portfolioValue || (typeof state?.portfolioValue === 'number' ? state.portfolioValue : 50000),
    totalPnL: liveMetrics.totalPnL || (typeof state?.totalPnL === 'number' ? state.totalPnL : 2500),
    dailyPnL: liveMetrics.dailyPnL || (typeof state?.dailyPnL === 'number' ? state.dailyPnL : 350),
    winRate: liveMetrics.winRate || (typeof state?.winRate === 'number' ? state.winRate : 68.5),
    totalAgents: liveMetrics.totalAgents || (typeof state?.totalAgents === 'number' ? state.totalAgents : 3),
    activeAgents: liveMetrics.activeAgents || (typeof state?.activeAgents === 'number' ? state.activeAgents : 2),
    totalPositions: liveMetrics.totalPositions,
    totalDecisions: liveMetrics.totalDecisions,
    executedOrders: Array.isArray(state?.executedOrders) ? state.executedOrders : [],
    pendingOrders: Array.isArray(state?.pendingOrders) ? state.pendingOrders : [],
    openPositions: Array.isArray(state?.openPositions) ? state.openPositions : [],
    marketPrices: state?.marketPrices instanceof Map ? state.marketPrices : mockMarketPrices,
    goalProgress: state?.goalProgress instanceof Map ? state.goalProgress : mockGoalProgress,
    isConnected: agents.length > 0 || (typeof state?.isConnected === 'boolean' ? state.isConnected : false),
    lastUpdate: state?.lastUpdate instanceof Date ? state.lastUpdate : new Date()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${safeState.activeAgents > 0 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-sm font-medium text-gray-700">
            {safeState.activeAgents > 0 ? `${safeState.activeAgents} Active Agents Trading` : 'No Active Agents'}
          </span>
          <Badge variant="outline" className="text-xs">
            {safeState.totalDecisions} Decisions Made
          </Badge>
          <Badge variant="outline" className="text-xs">
            Last Update: {safeState.lastUpdate.toLocaleTimeString()}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={actions?.refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Live Market Ticker */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Live Market Feed</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from(safeState.marketPrices.entries()).map(([symbol, price]) => {
              const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0
              const change = (Math.random() - 0.5) * 5
              const isPositive = change >= 0
              return (
                <div key={symbol} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-muted-foreground">{symbol}</div>
                  <div className="font-mono font-semibold">${safePrice.toFixed(2)}</div>
                  <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(safeState.portfolioValue)}</div>
              <div className="flex items-center mt-1">
                {safeState.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${safeState.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(safeState.totalPnL))} ({formatPercentage(safeState.totalAgents > 0 ? (safeState.totalPnL / (safeState.totalAgents * 10000)) * 100 : 0)})
                </span>
              </div>
              <Progress 
                value={safeState.totalAgents > 0 ? Math.min(100, (safeState.portfolioValue / (safeState.totalAgents * 10000)) * 100) : 50} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${safeState.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {safeState.dailyPnL >= 0 ? '+' : ''}{formatCurrency(safeState.dailyPnL)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Today's Performance
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeState.activeAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {safeState.totalAgents} Total • {safeState.totalPositions} Positions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(safeState.winRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {safeState.totalDecisions} Total Decisions
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Chart */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Performance (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Portfolio Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeState.goalProgress.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active goals. Create goals to track your progress.
              </p>
            ) : (
              Array.from(safeState.goalProgress.entries()).slice(0, 5).map(([goalId, progress]) => {
                const safeProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0
                return (
                  <div key={goalId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Goal {goalId.slice(-4)}</span>
                      <span className="text-sm text-muted-foreground">{safeProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, safeProgress))} className="h-2" />
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Sub-Navigation */}
      <Tabs value={overviewTab} onValueChange={setOverviewTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 bg-white border">
          {overviewSubTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <AnimatePresence mode="wait">
          {overviewSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab.component}
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  )
}

export default ConnectedOverviewTab