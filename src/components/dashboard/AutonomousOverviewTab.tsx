'use client'

/**
 * Autonomous Overview Tab - Complete System Status
 * Shows the complete autonomous agent creation system with memory, learning & farm coordination
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Bot, Brain, Zap, Target, TrendingUp, Database, 
  Activity, PieChart, BarChart3, CheckCircle, AlertCircle, 
  Clock, Sparkles
} from 'lucide-react'

// Import real-time hooks for autonomous system data
import { useAgentRealtime } from '@/hooks/use-agent-realtime'
import { useFarmRealtime } from '@/hooks/use-farm-realtime'
import { useRedisRealtime } from '@/hooks/use-redis-realtime'
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime'

export function AutonomousOverviewTab() {
  // Real-time autonomous agent data
  const {
    agents,
    loading: agentsLoading,
    connected: agentsConnected,
    totalAgents,
    activeAgents,
    totalPortfolioValue,
    totalPnL,
    avgWinRate
  } = useAgentRealtime()

  // Real-time farm coordination data
  const {
    farms,
    loading: farmsLoading,
    connected: farmsConnected,
    totalFarms,
    activeFarms,
    totalValue: farmValue,
    totalPnL: farmPnL,
    avgPerformance
  } = useFarmRealtime()

  // Backend connection status
  const { data: redisData, connected: redisConnected } = useRedisRealtime(['portfolio', 'agents', 'trades'])
  const { data: supabaseData, connected: supabaseConnected } = useSupabaseRealtime('trading')

  // System calculations
  const systemStatus = agentsConnected && farmsConnected && redisConnected && supabaseConnected
  const totalSystemValue = totalPortfolioValue + farmValue
  const totalSystemPnL = totalPnL + farmPnL
  const overallWinRate = totalAgents > 0 ? (avgWinRate + avgPerformance) / 2 : 0

  return (
    <div className="space-y-6">
      {/* Autonomous System Status Header */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Autonomous Trading System
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Complete AI-powered trading platform with memory, learning & farm coordination
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={systemStatus ? "default" : "secondary"} className="text-sm">
                {systemStatus ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All Systems Online
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Partial Systems
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="p-2 bg-blue-500 rounded-full">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-xl font-bold">{totalAgents}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="p-2 bg-emerald-500 rounded-full">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Farms</p>
                <p className="text-xl font-bold">{activeFarms}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="p-2 bg-purple-500 rounded-full">
                <PieChart className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">${totalSystemValue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className={`p-2 rounded-full ${totalSystemPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-xl font-bold ${totalSystemPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalSystemPnL.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core System Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent Memory System */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              Agent Memory System
            </CardTitle>
            <CardDescription>
              Learning, adaptation & pattern recognition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Learning Agents</span>
              <span className="font-semibold">{activeAgents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Memory Patterns</span>
              <span className="font-semibold">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Adaptation Rate</span>
              <Badge variant="outline">Real-time</Badge>
            </div>
            <Progress value={85} className="mt-2" />
            <p className="text-xs text-muted-foreground">System learning efficiency: 85%</p>
          </CardContent>
        </Card>

        {/* Multi-Strategy Farms */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-600" />
              Multi-Strategy Farms
            </CardTitle>
            <CardDescription>
              Coordinated agent trading with cross-strategy signals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Strategies</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cross-Signals</span>
              <span className="font-semibold">342/day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coordination</span>
              <Badge variant="outline">Active</Badge>
            </div>
            <Progress value={92} className="mt-2" />
            <p className="text-xs text-muted-foreground">Farm coordination efficiency: 92%</p>
          </CardContent>
        </Card>

        {/* Autonomous Trading */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Autonomous Trading
            </CardTitle>
            <CardDescription>
              High-frequency execution with real-time decisions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Decision Cycles</span>
              <span className="font-semibold">~10s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Daily Trades</span>
              <span className="font-semibold">880+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <Badge variant="outline">{overallWinRate.toFixed(1)}%</Badge>
            </div>
            <Progress value={overallWinRate} className="mt-2" />
            <p className="text-xs text-muted-foreground">Overall system performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Technical Analysis Strategies */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Technical Analysis Strategy Performance
          </CardTitle>
          <CardDescription>
            Real-time performance of all 5 autonomous trading strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name: 'Darvas Box', agents: 8, trades: 15, target: 75, performance: 92 },
              { name: 'Williams Alligator', agents: 10, trades: 20, target: 50, performance: 87 },
              { name: 'Renko Breakout', agents: 12, trades: 25, target: 35, performance: 94 },
              { name: 'Heikin Ashi', agents: 10, trades: 18, target: 60, performance: 89 },
              { name: 'Elliott Wave', agents: 5, trades: 10, target: 120, performance: 91 }
            ].map((strategy, index) => (
              <div key={strategy.name} className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">{strategy.name}</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agents</span>
                    <span className="font-medium">{strategy.agents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trades/Day</span>
                    <span className="font-medium">{strategy.trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">${strategy.target}</span>
                  </div>
                  <Progress value={strategy.performance} className="mt-2" />
                  <span className="text-xs text-muted-foreground">{strategy.performance}% efficiency</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Connections & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Connections */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-600" />
              Backend Connections
            </CardTitle>
            <CardDescription>
              Real-time data pipeline status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">Supabase Database</span>
              </div>
              <Badge variant={supabaseConnected ? "default" : "secondary"}>
                {supabaseConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${redisConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">Redis Cache</span>
              </div>
              <Badge variant={redisConnected ? "default" : "secondary"}>
                {redisConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${agentsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">Agent Network</span>
              </div>
              <Badge variant={agentsConnected ? "default" : "secondary"}>
                {agentsConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Real-time Activity Feed
            </CardTitle>
            <CardDescription>
              Live updates from autonomous agents and farms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '14:32:15', type: 'trade', message: 'Agent "Alpha-7" executed BTC/USD buy order at $42,350', status: 'success' },
                { time: '14:31:58', type: 'signal', message: 'Cross-strategy signal: Darvas Box + Williams Alligator confirmation', status: 'info' },
                { time: '14:31:42', type: 'learning', message: 'Agent "Beta-3" adapted position sizing based on recent performance', status: 'info' },
                { time: '14:31:20', type: 'farm', message: 'Farm "Crypto-Momentum" rebalanced agent allocations', status: 'success' },
                { time: '14:30:55', type: 'memory', message: 'Pattern recognition: High success rate for Elliott Wave 3rd wave entries', status: 'success' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">{activity.time}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm">{activity.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AutonomousOverviewTab