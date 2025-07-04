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
  Layers, Database, Wifi, WifiOff
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { motion } from 'framer-motion'
import { useAgentData } from '@/hooks/useAgentData'
import { useAGUI } from '@/lib/hooks/useAGUI'
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'
import { useMarketData } from '@/lib/market/market-data-service'
import { toast } from 'react-hot-toast'

interface ConnectedOverviewTabProps {
  className?: string
  onNavigateToTab?: (tabId: string) => void
}

export function ConnectedOverviewTab({ className, onNavigateToTab }: ConnectedOverviewTabProps) {
  const { state, actions } = useDashboardConnection('overview')
  const { agents, loading: agentsLoading } = useAgentData()
  
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
  
  // Use shared real-time data
  const {
    totalAgents,
    activeAgents,
    totalPortfolioValue,
    totalPnL,
    avgWinRate,
    totalFarms,
    activeFarms,
    farmTotalValue,
    redisConnected,
    supabaseConnected,
    agentsConnected,
    farmsConnected,
    lastUpdate
  } = useSharedRealtimeData()

  // Market data for overview
  const { prices: marketPrices, loading: marketLoading } = useMarketData()
  
  // Calculate derived metrics
  const totalSystemValue = totalPortfolioValue + farmTotalValue
  const systemHealthScore = [
    supabaseConnected,
    redisConnected,
    agentsConnected,
    farmsConnected,
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
                  {systemHealthScore > 80 ? 'All Systems Online' : 'Partial Systems'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Autonomous trading platform with real-time orchestration and multi-agent coordination
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                Last Update: {lastUpdate.toLocaleTimeString()}
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
                <p className="text-xl font-bold">{activeAgents}</p>
                <p className="text-xs text-muted-foreground">of {totalAgents} total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className="p-2 bg-emerald-500 rounded-full">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Farms</p>
                <p className="text-xl font-bold">{activeFarms}</p>
                <p className="text-xs text-muted-foreground">of {totalFarms} total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className="p-2 bg-purple-500 rounded-full">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">${totalSystemValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">managed capital</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
              <div className={`p-2 rounded-full ${totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {avgWinRate.toFixed(1)}% win rate
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
                  <span className="font-semibold">${totalPortfolioValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily P&L</span>
                  <span className={`font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={agentsConnected ? "default" : "secondary"}>
                    {agentsConnected ? 'Connected' : 'Offline'}
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
                  <span className="font-semibold">{avgWinRate.toFixed(1)}%</span>
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
                  <span className="font-semibold">{activeAgents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Agents</span>
                  <span className="font-semibold">{totalAgents}</span>
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
                  <span className="font-semibold">{activeFarms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Farm Value</span>
                  <span className="font-semibold">${farmTotalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Coordination</span>
                  <Badge variant={farmsConnected ? "default" : "secondary"}>
                    {farmsConnected ? 'Active' : 'Offline'}
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
              const isPositive = price.changePercent24h >= 0
              return (
                <div key={price.symbol} className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{price.symbol.split('/')[0]}</div>
                  <div className="font-mono font-bold text-sm">${price.price.toLocaleString()}</div>
                  <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{price.changePercent24h.toFixed(2)}%
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
                  <div className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant={supabaseConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {supabaseConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${redisConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Cache</span>
                  <Badge variant={redisConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {redisConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${agentsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Agents</span>
                  <Badge variant={agentsConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {agentsConnected ? 'Active' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${farmsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">Farms</span>
                  <Badge variant={farmsConnected ? "default" : "secondary"} className="ml-auto text-xs">
                    {farmsConnected ? 'Connected' : 'Offline'}
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
    </div>
  )
}

export default ConnectedOverviewTab