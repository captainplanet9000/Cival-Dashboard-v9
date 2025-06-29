'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Bot, 
  RefreshCw, Zap, AlertCircle, CheckCircle, Wifi, WifiOff,
  BarChart3, PieChart, Clock, Database, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { useEnhancedDashboardConnection } from './EnhancedDashboardConnector'
import { LiveMarketTicker } from '@/components/realtime/LiveMarketTicker'
import { LiveDashboardOrchestrator } from '@/components/realtime/LiveDashboardOrchestrator'

interface EnhancedOverviewTabProps {
  className?: string
}

export function EnhancedOverviewTab({ className }: EnhancedOverviewTabProps) {
  const { state, actions, isLoading, error, connectionQuality } = useEnhancedDashboardConnection('overview')
  const [overviewSubTab, setOverviewSubTab] = useState('metrics')

  // Generate mock chart data for performance visualization
  const generateChartData = () => {
    const data = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const baseValue = state.portfolioValue || 125000
      const variation = Math.sin(i * 0.1) * 5000 + Math.random() * 2000
      
      data.push({
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.max(0, baseValue + variation - 25000),
        pnl: (variation * 0.1) + (state.dailyPnL || 0)
      })
    }
    
    return data
  }

  const chartData = generateChartData()

  // Asset allocation data
  const assetAllocation = [
    { name: 'Crypto', value: 45, color: '#3B82F6' },
    { name: 'Stocks', value: 25, color: '#10B981' },
    { name: 'Forex', value: 20, color: '#F59E0B' },
    { name: 'Cash', value: 10, color: '#6B7280' }
  ]

  // Connection quality indicator
  const ConnectionIndicator = () => {
    const getQualityColor = (quality: string) => {
      switch (quality) {
        case 'excellent': return 'text-green-600'
        case 'good': return 'text-blue-600'
        case 'poor': return 'text-yellow-600'
        case 'disconnected': return 'text-red-600'
        default: return 'text-gray-600'
      }
    }

    const getQualityIcon = (quality: string) => {
      switch (quality) {
        case 'excellent': return <Wifi className="h-4 w-4" />
        case 'good': return <Wifi className="h-4 w-4" />
        case 'poor': return <Wifi className="h-4 w-4" />
        case 'disconnected': return <WifiOff className="h-4 w-4" />
        default: return <WifiOff className="h-4 w-4" />
      }
    }

    return (
      <div className={`flex items-center gap-2 ${getQualityColor(connectionQuality)}`}>
        {getQualityIcon(connectionQuality)}
        <span className="text-xs font-medium capitalize">{connectionQuality}</span>
      </div>
    )
  }

  // Performance metrics panel
  const PerformanceMetricsPanel = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${state.portfolioValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {state.totalPnL >= 0 ? '+' : ''}{((state.totalPnL / state.portfolioValue) * 100).toFixed(1)}% total return
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Daily P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${state.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {state.dailyPnL >= 0 ? '+' : ''}${state.dailyPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {state.dailyPnL >= 0 ? 'Profit' : 'Loss'} today
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.activeAgents}</div>
              <p className="text-xs text-muted-foreground">
                {state.totalAgents} total agents
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-600" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {state.executedOrders.length} trades
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>30-day portfolio value trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Current portfolio distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Allocation']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {assetAllocation.map((asset, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="text-sm">{asset.name} ({asset.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // System monitoring panel
  const SystemMonitoringPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Update Latency</span>
                <span className="text-sm font-medium">{state.updateLatency.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cache Hit Rate</span>
                <span className="text-sm font-medium">{state.cacheHitRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">
                  {(state.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Connection</span>
                <ConnectionIndicator />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Data Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Last Update</span>
                <span className="text-sm font-medium">
                  {state.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Open Positions</span>
                <span className="text-sm font-medium">{state.openPositions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending Orders</span>
                <span className="text-sm font-medium">{state.pendingOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Market Symbols</span>
                <span className="text-sm font-medium">{state.marketPrices.size}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Trading Engine</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Market Data</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Risk Monitor</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cache System</span>
                <Badge className="bg-green-100 text-green-800">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Dashboard performance optimization controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cache Statistics</p>
              <p className="text-xs text-muted-foreground">
                Hit Rate: {state.cacheHitRate.toFixed(1)}% | 
                Size: {actions.getCacheStats().size} entries
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.clearCache}
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const overviewSubTabs = [
    { id: 'metrics', label: 'Performance', component: <PerformanceMetricsPanel />, icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'live', label: 'Live Data', component: <LiveDashboardOrchestrator />, icon: <Activity className="h-4 w-4" /> },
    { id: 'market', label: 'Market', component: <LiveMarketTicker />, icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'system', label: 'System', component: <SystemMonitoringPanel />, icon: <Zap className="h-4 w-4" /> }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading enhanced dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Dashboard Error</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button onClick={actions.refresh} className="mt-3" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Enhanced Trading Overview
            </CardTitle>
            <CardDescription>
              Real-time portfolio monitoring with advanced performance metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionIndicator />
            <Badge variant="outline" className="text-xs">
              ${state.portfolioValue.toLocaleString()} managed
            </Badge>
            <Button size="sm" variant="ghost" onClick={actions.refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={overviewSubTab} onValueChange={setOverviewSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            {overviewSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs flex items-center gap-1"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
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
      </CardContent>
    </Card>
  )
}

export default EnhancedOverviewTab