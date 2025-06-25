'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap,
  Users,
  BarChart3,
  DollarSign
} from 'lucide-react'

interface DashboardMetrics {
  totalValue: number
  dailyPnL: number
  totalPnL: number
  activePositions: number
  activeAgents: number
  activeFarms: number
  farmPerformance: number
  winRate: number
  avgReturn: number
  riskScore: number
  systemHealth: number
}

interface AgentOverviewPanelProps {
  metrics: DashboardMetrics
}

export function AgentOverviewPanel({ metrics }: AgentOverviewPanelProps) {
  return (
    <div className="space-y-6">
      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${metrics.dailyPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Daily performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Agent win rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Overview</CardTitle>
          <CardDescription>
            Real-time performance metrics for all trading agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agent Health Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Health</span>
              <span className="text-sm text-muted-foreground">{metrics.systemHealth}%</span>
            </div>
            <Progress value={metrics.systemHealth} className="w-full" />
          </div>

          {/* Active Farms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Farm Utilization</span>
              <span className="text-sm text-muted-foreground">{metrics.activeFarms}/5 farms</span>
            </div>
            <Progress value={(metrics.activeFarms / 5) * 100} className="w-full" />
          </div>

          {/* Risk Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Risk Level</span>
              <Badge variant={metrics.riskScore > 80 ? 'destructive' : metrics.riskScore > 60 ? 'default' : 'secondary'}>
                {metrics.riskScore > 80 ? 'High' : metrics.riskScore > 60 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <Progress value={metrics.riskScore} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Individual Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Agent Status</CardTitle>
          <CardDescription>
            Performance breakdown by individual trading agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: metrics.activeAgents }, (_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Agent {i + 1}</div>
                    <div className="text-sm text-muted-foreground">
                      {['Momentum', 'Mean Reversion', 'Breakout', 'Scalping'][i % 4]} Strategy
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      ${(Math.random() * 2000 - 1000).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(60 + Math.random() * 30).toFixed(1)}% win rate
                    </div>
                  </div>
                  <Badge variant={i % 3 === 0 ? 'default' : i % 3 === 1 ? 'secondary' : 'outline'}>
                    {i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Paused' : 'Standby'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common agent management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm">Start All</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="text-sm">Pause All</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Analytics</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm">Add Agent</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AgentOverviewPanel