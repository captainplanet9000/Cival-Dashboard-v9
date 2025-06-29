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

interface ConnectedOverviewTabProps {
  className?: string
}

export function ConnectedOverviewTab({ className }: ConnectedOverviewTabProps) {
  const { state, actions } = useDashboardConnection('overview')
  const [overviewTab, setOverviewTab] = useState('dashboard')
  const [chartData, setChartData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  
  // Generate chart data from state
  useEffect(() => {
    // Create 30-day chart data
    const days = 30
    const data = []
    const perfData = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate historical data based on current values
      const dayFactor = (days - i) / days
      const randomFactor = 0.9 + Math.random() * 0.2
      
      data.push({
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: state.portfolioValue * dayFactor * randomFactor,
        pnl: state.totalPnL * dayFactor * randomFactor
      })
      
      perfData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        winRate: state.winRate * randomFactor,
        trades: Math.floor(state.executedOrders.length * dayFactor),
        agents: state.activeAgents
      })
    }
    
    setChartData(data)
    setPerformanceData(perfData)
  }, [state])
  
  const overviewSubTabs = [
    { id: 'dashboard', label: 'Live Dashboard', component: <LiveDashboardOrchestrator /> },
    { id: 'realtime', label: 'Real-Time', component: <RealTimeDashboard /> },
    { id: 'portfolio', label: 'Portfolio', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'trading', label: 'Trading', component: <RealTradingInterface /> },
    { id: 'agents', label: 'Agent Manager', component: <RealAgentManagement /> },
    { id: 'risk', label: 'Risk Monitor', component: <RealRiskManagementDashboard /> }
  ]

  // Format currency with null safety
  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeValue)
  }

  // Format percentage with null safety
  const formatPercentage = (value: number | undefined | null) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
    return `${safeValue.toFixed(2)}%`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm text-gray-600">
            {state.isConnected ? 'Connected to Paper Trading Engine' : 'Disconnected'}
          </span>
          <Badge variant="outline" className="text-xs">
            Last Update: {state.lastUpdate.toLocaleTimeString()}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={actions.refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Live Market Ticker */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <LiveMarketTicker />
        </CardContent>
      </Card>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(state.portfolioValue)}</div>
              <div className="flex items-center mt-1">
                {state.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${state.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(state.totalPnL || 0))} ({formatPercentage(state.totalAgents > 0 ? (state.totalPnL / (state.totalAgents * 10000)) * 100 : 0)})
                </span>
              </div>
              <Progress 
                value={state.totalAgents > 0 ? (state.portfolioValue / (state.totalAgents * 10000)) * 100 : 0} 
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
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.activeAgents}/{state.totalAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {state.activeFarms} Active Farms
              </p>
              <div className="flex gap-1 mt-2">
                {Array.from(state.agentPerformance.values()).slice(0, 3).map((agent) => (
                  <Badge 
                    key={agent.agentId} 
                    variant={agent.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {agent.name.split(' ')[0]}
                  </Badge>
                ))}
                {state.totalAgents > 3 && (
                  <Badge variant="outline" className="text-xs">+{state.totalAgents - 3}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(state.winRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {state.executedOrders.length} Total Trades
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Daily P&L</span>
                  <span className={state.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(state.dailyPnL)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Weekly P&L</span>
                  <span className={state.weeklyPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(state.weeklyPnL)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.openPositions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {state.pendingOrders.length} Pending Orders
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {state.marketPrices.size > 0 && Array.from(state.marketPrices.entries()).slice(0, 2).map(([symbol, price]) => (
                  <div key={symbol} className="flex justify-between">
                    <span className="text-muted-foreground">{symbol}</span>
                    <span className="font-medium">${price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Overview Sub-Navigation */}
      <Tabs value={overviewTab} onValueChange={setOverviewTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2">
          {overviewSubTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {overviewSubTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Portfolio Performance
            </CardTitle>
            <CardDescription>30-day portfolio value trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Trading Activity
            </CardTitle>
            <CardDescription>Agent performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="trades" fill="#10B981" name="Trades" />
                  <Bar dataKey="winRate" fill="#8B5CF6" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Data Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(state.agentPerformance.values()).slice(0, 5).map((agent) => (
                <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {agent.tradeCount} trades • {formatPercentage(agent.winRate)} win rate
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(agent.pnl)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(agent.portfolioValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.activeGoals === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active goals. Create goals to track your progress.
                </p>
              ) : (
                Array.from(state.goalProgress.entries()).slice(0, 5).map(([goalId, progress]) => (
                  <div key={goalId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Goal {goalId.slice(-4)}</span>
                      <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations for dashboard management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => actions.createAgent({
                name: `Agent ${state.totalAgents + 1}`,
                strategy: 'momentum',
                capital: 10000
              })}
            >
              <Bot className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Place Order
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Create Farm
            </Button>
            <Button variant="outline" className="justify-start">
              <Target className="mr-2 h-4 w-4" />
              Set Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConnectedOverviewTab