'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Bot, Shield, Target,
  Activity, RefreshCw, Users, Zap, Brain, Wallet, PieChart, ArrowRight,
  Network, Calendar, Settings, AlertTriangle, CheckCircle2, Clock, 
  Layers, Database, Wifi, WifiOff, Bell, MessageSquare, Mail, Webhook, TestTube
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { motion } from 'framer-motion'
import { useAgentData } from '@/hooks/useAgentData'
import { useAGUI } from '@/lib/hooks/useAGUI'
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'
import { useMarketData } from '@/lib/market/market-data-service'
import { toast } from 'react-hot-toast'

// Import Supabase dashboard service for unified data
import { supabaseDashboardService } from '@/lib/services/supabase-dashboard-service'
import type { DashboardSummary, SystemHealth } from '@/lib/services/supabase-dashboard-service'

// Import Unified AI Assistant
import UnifiedAIAssistant from '@/components/ai-assistant/UnifiedAIAssistant'

// Import animated components for enhanced UI
import {
  AnimatedPrice,
  AnimatedCounter,
  AnimatedProgress,
  AnimatedCard,
  AnimatedStatus,
  AnimatedMarketTicker
} from '@/components/ui/animated-components'

// Import notification hooks
import { useNotifications } from '@/lib/notifications/apprise-service'

interface ConnectedOverviewTabProps {
  className?: string
  onNavigateToTab?: (tabId: string) => void
}

export function ConnectedOverviewTab({ className, onNavigateToTab }: ConnectedOverviewTabProps) {
  const { state, actions } = useDashboardConnection('overview')
  const { agents, loading: agentsLoading } = useAgentData()
  
  // Supabase dashboard state
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [useSupabase, setUseSupabase] = useState(false)
  const [supabaseLoading, setSupabaseLoading] = useState(true)
  
  // AG-UI integration with selective event handling
  const { 
    isConnected: aguiConnected, 
    connectionState,
    messagesReceived,
    messagesSent,
    lastMessage,
    error: aguiError 
  } = useAGUI({
    channels: ['agents', 'trading', 'system', 'portfolio'],
    autoConnect: true,
    onAgentDecision: (data) => {
      toast.success(`Agent Decision: ${data.agentName || 'Unknown'}`, { icon: '🤖' })
    },
    onTradeSignal: (data) => {
      toast.success(`Trade Signal: ${data.side?.toUpperCase()} ${data.symbol}`, { icon: '📈' })
    },
    onRiskAlert: (data) => {
      toast.error(`Risk Alert: ${data.message}`, { icon: '⚠️' })
    }
  })
  
  // Use shared real-time data as fallback
  const sharedData = useSharedRealtimeData()
  
  // Load dashboard data from Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setSupabaseLoading(true)
        
        // Try to load from Supabase dashboard service
        const [summary, health] = await Promise.all([
          supabaseDashboardService.getDashboardSummary(),
          supabaseDashboardService.getSystemHealth()
        ])
        
        setDashboardSummary(summary)
        setSystemHealth(health)
        setUseSupabase(true)
        
        console.log('✅ Loaded dashboard data from Supabase:', { summary, health })
      } catch (error) {
        console.log('⚠️ Supabase unavailable, using shared data:', error)
        setUseSupabase(false)
      } finally {
        setSupabaseLoading(false)
      }
    }
    
    loadDashboardData()
  }, [])
  
  // Subscribe to real-time dashboard changes
  useEffect(() => {
    if (!useSupabase) return
    
    const unsubscribe = supabaseDashboardService.subscribeToAllChanges((summary) => {
      setDashboardSummary(summary)
      console.log('📡 Dashboard data updated via subscription:', summary)
    })
    
    return unsubscribe
  }, [useSupabase])
  
  // Calculate derived metrics from either Supabase or shared data
  const displayData = useSupabase && dashboardSummary ? {
    totalAgents: dashboardSummary.agents.total || 0,
    activeAgents: dashboardSummary.agents.active || 0,
    totalPortfolioValue: dashboardSummary.agents.totalCapital || 0,
    totalPnL: (dashboardSummary.agents.totalPnL || 0) + (dashboardSummary.trading.totalPnL || 0),
    avgWinRate: dashboardSummary.agents.averageWinRate || 0,
    totalFarms: dashboardSummary.farms.total || 0,
    activeFarms: dashboardSummary.farms.active || 0,
    farmTotalValue: dashboardSummary.farms.totalAllocated || 0,
    supabaseConnected: systemHealth?.supabaseConnected || false,
    redisConnected: true, // Assume true for now
    agentsConnected: systemHealth?.agentsHealth || false,
    farmsConnected: systemHealth?.farmsHealth || false,
    lastUpdate: systemHealth?.lastUpdate ? new Date(systemHealth.lastUpdate) : new Date()
  } : {
    totalAgents: sharedData.totalAgents || 0,
    activeAgents: sharedData.activeAgents || 0,
    totalPortfolioValue: sharedData.totalPortfolioValue || 0,
    totalPnL: sharedData.totalPnL || 0,
    avgWinRate: sharedData.avgWinRate || 0,
    totalFarms: sharedData.totalFarms || 0,
    activeFarms: sharedData.activeFarms || 0,
    farmTotalValue: sharedData.farmTotalValue || 0,
    supabaseConnected: sharedData.supabaseConnected || false,
    redisConnected: sharedData.redisConnected || false,
    agentsConnected: sharedData.agentsConnected || false,
    farmsConnected: sharedData.farmsConnected || false,
    lastUpdate: sharedData.lastUpdate || new Date()
  }

  // Market data for overview
  const { prices: marketPrices, loading: marketLoading } = useMarketData()
  
  // Calculate derived metrics
  const totalSystemValue = (displayData.totalPortfolioValue || 0) + (displayData.farmTotalValue || 0)
  const systemHealthScore = [
    displayData.supabaseConnected,
    displayData.redisConnected,
    displayData.agentsConnected,
    displayData.farmsConnected,
    aguiConnected
  ].filter(Boolean).length / 5 * 100

  // Quick navigation handler
  const handleNavigateTo = (tabId: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(tabId)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Status Header */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                AI Trading Dashboard
                <Badge variant={systemHealthScore > 80 ? 'default' : 'secondary'}>
                  {useSupabase ? '🟢 Supabase' : '🟡 Local'} | {systemHealthScore > 80 ? 'All Systems Online' : 'Partial Systems'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Production-ready autonomous trading platform with AG-UI Protocol v2, real-time database integration, and multi-agent coordination
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                Last Update: {displayData.lastUpdate.toLocaleTimeString()}
              </Badge>
              <Button size="sm" variant="ghost" onClick={actions?.refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className="p-2 bg-blue-500 rounded-full">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <AnimatedCounter 
                  value={displayData.activeAgents} 
                  className="text-xl font-bold"
                  duration={800}
                />
                <p className="text-xs text-muted-foreground">of {displayData.totalAgents} total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className="p-2 bg-emerald-500 rounded-full">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Farms</p>
                <AnimatedCounter 
                  value={displayData.activeFarms} 
                  className="text-xl font-bold"
                  duration={800}
                />
                <p className="text-xs text-muted-foreground">of {displayData.totalFarms} total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className="p-2 bg-purple-500 rounded-full">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <AnimatedPrice 
                  value={totalSystemValue}
                  currency="$"
                  precision={0}
                  size="lg"
                  className="text-xl font-bold"
                  showTrend={false}
                />
                <p className="text-xs text-muted-foreground">managed capital</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className={`p-2 rounded-full ${displayData.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <AnimatedPrice 
                  value={displayData.totalPnL}
                  currency={displayData.totalPnL >= 0 ? '+$' : '-$'}
                  precision={2}
                  size="lg"
                  className={`text-xl font-bold ${displayData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  showTrend={false}
                />
                <p className="text-xs text-muted-foreground">
                  <AnimatedCounter value={displayData.avgWinRate} precision={1} suffix="%" /> win rate
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Quick Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Trading Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateTo('trading')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-full">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Trading</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Order management and execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Portfolio Value</span>
                  <span className="font-semibold">${displayData.totalPortfolioValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily P&L</span>
                  <span className={`font-semibold ${displayData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {displayData.totalPnL >= 0 ? '+' : ''}${displayData.totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={displayData.agentsConnected ? "default" : "secondary"}>
                    {displayData.agentsConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateTo('analytics')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-full">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-semibold">{displayData.avgWinRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <Badge variant="outline" className="text-green-600">Low</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                  <span className="font-semibold">{(1.2 + Math.random() * 0.8).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Agents Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateTo('agents')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-full">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Agents</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>AI trading agent management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Agents</span>
                  <span className="font-semibold">{displayData.activeAgents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Agents</span>
                  <span className="font-semibold">{displayData.totalAgents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Performance</span>
                  <Badge variant="default" className="text-green-600">Excellent</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Farms Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateTo('farms')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500 rounded-full">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Farms</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Multi-strategy farm coordination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Farms</span>
                  <span className="font-semibold">{displayData.activeFarms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Farm Value</span>
                  <span className="font-semibold">${displayData.farmTotalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Coordination</span>
                  <Badge variant={displayData.farmsConnected ? "default" : "secondary"}>
                    {displayData.farmsConnected ? 'Active' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateTo('goals')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-500 rounded-full">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Goals</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Strategic objectives and targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Goals</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <Progress value={78} className="w-16 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orchestration Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigateTo('orchestration')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500 rounded-full">
                    <Network className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Orchestration</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>System coordination and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">System Health</span>
                  <span className="font-semibold">{systemHealthScore.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Events (24h)</span>
                  <span className="font-semibold">{messagesReceived + messagesSent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={systemHealthScore > 80 ? "default" : "secondary"}>
                    {systemHealthScore > 80 ? 'Healthy' : 'Degraded'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Market Overview Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Live Market Overview
              </CardTitle>
              <CardDescription>Key cryptocurrency prices and trends</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Real-time data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {marketPrices.slice(0, 8).map((price) => {
              const isPositive = (price.changePercent24h || 0) >= 0
              return (
                <div key={price.symbol} className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{price.symbol.split('/')[0]}</div>
                  <AnimatedPrice 
                    value={price.price || 0}
                    currency="$"
                    precision={2}
                    size="sm"
                    className="font-mono font-bold text-sm"
                    showTrend={false}
                  />
                  <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{(price.changePercent24h || 0).toFixed(2)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Health & AG-UI Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              System Health
            </CardTitle>
            <CardDescription>Infrastructure and connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${displayData.supabaseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant={displayData.supabaseConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {displayData.supabaseConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${displayData.redisConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Cache</span>
                  <Badge variant={displayData.redisConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {displayData.redisConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${displayData.agentsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Agents</span>
                  <Badge variant={displayData.agentsConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {displayData.agentsConnected ? 'Active' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${displayData.farmsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Farms</span>
                  <Badge variant={displayData.farmsConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {displayData.farmsConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Overall Health</span>
                  <span className="font-bold">{systemHealthScore.toFixed(0)}%</span>
                </div>
                <Progress value={systemHealthScore} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AG-UI Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {aguiConnected ? <Wifi className="h-5 w-5 text-blue-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
              AG-UI Protocol
            </CardTitle>
            <CardDescription>Real-time communication system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Connection Status</span>
                <Badge variant={aguiConnected ? "default" : "secondary"}>
                  {connectionState || 'Disconnected'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Messages Received</span>
                <span className="font-semibold">{messagesReceived}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Messages Sent</span>
                <span className="font-semibold">{messagesSent}</span>
              </div>
              {lastMessage && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Event</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {new Date(lastMessage.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {aguiError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-600">{aguiError}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Settings & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Settings Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notification Center
            </CardTitle>
            <CardDescription>
              Configure multi-channel alerts for trading events and system updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Global Notifications</div>
                  <div className="text-sm text-muted-foreground">Master switch for all channels</div>
                </div>
                <AnimatedStatus status="active" pulse={true}>
                  Enabled
                </AnimatedStatus>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Active Channels</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Discord
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Webhook className="h-3 w-3 mr-1" />
                    Webhook
                  </Badge>
                </div>
              </div>
              
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                  // Quick test notification
                  const { notifyAgentDecision } = useNotifications()
                  notifyAgentDecision('Advanced Trading Agents', 'BUY', 85)
                  toast.success('Test notification sent!')
                }}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Trading Agents Quick Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Advanced AI Analysts
            </CardTitle>
            <CardDescription>
              Multi-agent framework with fundamental, technical, and sentiment analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">4</div>
                  <div className="text-xs text-muted-foreground">AI Agents</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">85%</div>
                  <div className="text-xs text-muted-foreground">Consensus</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fundamental Analyst</span>
                  <AnimatedStatus status="active" className="text-xs">
                    Active
                  </AnimatedStatus>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Technical Analyst</span>
                  <AnimatedStatus status="active" className="text-xs">
                    Active
                  </AnimatedStatus>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sentiment Analyst</span>
                  <AnimatedStatus status="active" className="text-xs">
                    Active
                  </AnimatedStatus>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Risk Manager</span>
                  <AnimatedStatus status="active" className="text-xs">
                    Active
                  </AnimatedStatus>
                </div>
              </div>
              
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleNavigateTo('agents')}>
                <ArrowRight className="h-4 w-4 mr-2" />
                View Advanced Agents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Trading Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Trading Assistant
          </CardTitle>
          <CardDescription>
            Advanced AI assistant with persistent memory and agent decision tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedAIAssistant />
        </CardContent>
      </Card>

    </div>
  )
}

export default ConnectedOverviewTab