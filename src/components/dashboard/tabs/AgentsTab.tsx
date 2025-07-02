'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, Play, Pause, Settings, TrendingUp } from 'lucide-react'

const AgentsTab: React.FC = () => {
  const agents = [
    {
      id: 'momentum-1',
      name: 'Momentum Trader',
      status: 'active',
      strategy: 'Momentum',
      pnl: 2400,
      trades: 45,
      winRate: 72.5,
      lastAction: '2 min ago'
    },
    {
      id: 'arbitrage-1', 
      name: 'Arbitrage Bot',
      status: 'active',
      strategy: 'Arbitrage',
      pnl: 1800,
      trades: 23,
      winRate: 84.2,
      lastAction: '5 min ago'
    },
    {
      id: 'reversal-1',
      name: 'Mean Reversion',
      status: 'paused',
      strategy: 'Mean Reversion',
      pnl: -200,
      trades: 12,
      winRate: 45.8,
      lastAction: '1 hour ago'
    },
    {
      id: 'scalper-1',
      name: 'Scalp Master',
      status: 'idle',
      strategy: 'Scalping',
      pnl: 950,
      trades: 89,
      winRate: 58.7,
      lastAction: '30 min ago'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'idle': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />
      case 'paused': return <Pause className="h-3 w-3" />
      default: return <Bot className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">2</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className="text-2xl font-bold text-green-600">$4,950</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                <p className="text-2xl font-bold">65.3%</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Trading Agents</CardTitle>
          <CardDescription>Manage your autonomous trading agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.strategy} Strategy</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(agent.pnl).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">P&L</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">{agent.trades}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">{agent.winRate}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>

                  <Badge className={getStatusColor(agent.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(agent.status)}
                      {agent.status}
                    </div>
                  </Badge>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      {agent.status === 'active' ? 'Pause' : 'Start'}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
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
          <CardDescription>Manage all agents at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button>Create New Agent</Button>
            <Button variant="outline">Start All</Button>
            <Button variant="outline">Pause All</Button>
            <Button variant="outline">Performance Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AgentsTab