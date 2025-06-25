'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bot,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Zap,
  Brain,
  Target,
  BarChart3,
  Settings,
  CheckCircle2
} from 'lucide-react'

// Import Todo System
import { AgentTodoSystem } from '@/components/agents/AgentTodoSystem'
// Lazy load services to avoid circular dependencies
const getAgentTodoService = () => import('@/lib/agents/AgentTodoService').then(m => m.agentTodoService)

interface TradingAgent {
  id: string
  name: string
  type: 'trend_follower' | 'arbitrage' | 'mean_reversion' | 'risk_manager' | 'market_maker'
  status: 'active' | 'paused' | 'stopped' | 'error'
  llm_provider: string
  performance: {
    total_trades: number
    win_rate: number
    profit_loss: number
    sharpe_ratio: number
    max_drawdown: number
  }
  current_positions: number
  last_decision: {
    action: string
    symbol: string
    confidence: number
    timestamp: string
  }
  risk_metrics: {
    var_95: number
    exposure: number
    leverage: number
  }
  settings: {
    max_position_size: number
    risk_limit: number
    auto_trading: boolean
  }
}

interface AgentControlPanelProps {
  className?: string
}

export function AgentControlPanel({ className }: AgentControlPanelProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([
    {
      id: 'trend_follower_001',
      name: 'Trend Hunter Alpha',
      type: 'trend_follower',
      status: 'active',
      llm_provider: 'Gemini Flash',
      performance: {
        total_trades: 1247,
        win_rate: 0.68,
        profit_loss: 15420.55,
        sharpe_ratio: 1.85,
        max_drawdown: 0.08
      },
      current_positions: 3,
      last_decision: {
        action: 'BUY',
        symbol: 'BTCUSD',
        confidence: 0.82,
        timestamp: '2025-01-19T14:23:00Z'
      },
      risk_metrics: {
        var_95: 0.025,
        exposure: 0.65,
        leverage: 1.2
      },
      settings: {
        max_position_size: 0.05,
        risk_limit: 0.02,
        auto_trading: true
      }
    },
    {
      id: 'arbitrage_bot_003',
      name: 'Arbitrage Scanner',
      type: 'arbitrage',
      status: 'active',
      llm_provider: 'Gemini Flash',
      performance: {
        total_trades: 2843,
        win_rate: 0.94,
        profit_loss: 8934.22,
        sharpe_ratio: 2.45,
        max_drawdown: 0.03
      },
      current_positions: 0,
      last_decision: {
        action: 'SCAN',
        symbol: 'Multiple',
        confidence: 0.95,
        timestamp: '2025-01-19T14:25:15Z'
      },
      risk_metrics: {
        var_95: 0.01,
        exposure: 0.15,
        leverage: 1.0
      },
      settings: {
        max_position_size: 0.02,
        risk_limit: 0.01,
        auto_trading: true
      }
    },
    {
      id: 'mean_reversion_002',
      name: 'Mean Reversion Pro',
      type: 'mean_reversion',
      status: 'paused',
      llm_provider: 'OpenRouter Claude',
      performance: {
        total_trades: 856,
        win_rate: 0.72,
        profit_loss: 12876.88,
        sharpe_ratio: 1.63,
        max_drawdown: 0.12
      },
      current_positions: 2,
      last_decision: {
        action: 'HOLD',
        symbol: 'ETHUSD',
        confidence: 0.67,
        timestamp: '2025-01-19T14:15:30Z'
      },
      risk_metrics: {
        var_95: 0.03,
        exposure: 0.45,
        leverage: 1.5
      },
      settings: {
        max_position_size: 0.08,
        risk_limit: 0.03,
        auto_trading: false
      }
    },
    {
      id: 'risk_manager_004',
      name: 'Risk Guardian',
      type: 'risk_manager',
      status: 'active',
      llm_provider: 'OpenRouter GPT-4',
      performance: {
        total_trades: 45,
        win_rate: 0.89,
        profit_loss: 2145.33,
        sharpe_ratio: 3.2,
        max_drawdown: 0.02
      },
      current_positions: 0,
      last_decision: {
        action: 'ALERT',
        symbol: 'Portfolio',
        confidence: 0.91,
        timestamp: '2025-01-19T14:26:00Z'
      },
      risk_metrics: {
        var_95: 0.015,
        exposure: 0.25,
        leverage: 1.0
      },
      settings: {
        max_position_size: 0.01,
        risk_limit: 0.005,
        auto_trading: true
      }
    }
  ])

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Calculate aggregate metrics
  const totalProfitLoss = agents.reduce((sum, agent) => sum + agent.performance.profit_loss, 0)
  const averageWinRate = agents.reduce((sum, agent) => sum + agent.performance.win_rate, 0) / agents.length
  const activeAgents = agents.filter(agent => agent.status === 'active').length
  const totalPositions = agents.reduce((sum, agent) => sum + agent.current_positions, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'stopped': return <Square className="h-4 w-4 text-gray-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'trend_follower': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'arbitrage': return <Zap className="h-5 w-5 text-purple-500" />
      case 'mean_reversion': return <Target className="h-5 w-5 text-orange-500" />
      case 'risk_manager': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'market_maker': return <BarChart3 className="h-5 w-5 text-green-500" />
      default: return <Bot className="h-5 w-5" />
    }
  }

  const getPerformanceColor = (value: number, type: 'profit' | 'winrate' | 'sharpe' | 'drawdown') => {
    switch (type) {
      case 'profit':
        return value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500'
      case 'winrate':
        return value > 0.7 ? 'text-green-500' : value > 0.5 ? 'text-yellow-500' : 'text-red-500'
      case 'sharpe':
        return value > 1.5 ? 'text-green-500' : value > 1.0 ? 'text-yellow-500' : 'text-red-500'
      case 'drawdown':
        return value < 0.05 ? 'text-green-500' : value < 0.1 ? 'text-yellow-500' : 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleAgentAction = async (agentId: string, action: 'start' | 'pause' | 'stop') => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped' }
        : agent
    ))
  }

  const handleEmergencyStop = async () => {
    setAgents(agents.map(agent => ({ ...agent, status: 'stopped' })))
  }

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="control">Control</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                    <p className="text-2xl font-bold">{activeAgents}/{agents.length}</p>
                  </div>
                  <Bot className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((activeAgents / agents.length) * 100).toFixed(0)}% operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(totalProfitLoss, 'profit')}`}>
                      ${totalProfitLoss.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across all agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Win Rate</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(averageWinRate, 'winrate')}`}>
                      {(averageWinRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Combined performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Positions</p>
                    <p className="text-2xl font-bold">{totalPositions}</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Active trades
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Emergency Controls
              </CardTitle>
              <CardDescription>Immediate action controls for all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  variant="destructive" 
                  onClick={handleEmergencyStop}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Emergency Stop All
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Pause All
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Resume All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agent Status Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Status</CardTitle>
              <CardDescription>Real-time status of all trading agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getAgentTypeIcon(agent.type)}
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.llm_provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(agent.status)}
                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">P&L:</span>
                        <span className={`ml-1 font-medium ${getPerformanceColor(agent.performance.profit_loss, 'profit')}`}>
                          ${agent.performance.profit_loss.toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="ml-1 font-medium">{(agent.performance.win_rate * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Positions:</span>
                        <span className="ml-1 font-medium">{agent.current_positions}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last:</span>
                        <span className="ml-1 font-medium">{agent.last_decision.action}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAgentTypeIcon(agent.type)}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {agent.name}
                          {getStatusIcon(agent.status)}
                        </CardTitle>
                        <CardDescription>
                          {agent.type.replace('_', ' ').toUpperCase()} • {agent.llm_provider}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={agent.status === 'active'}
                        onCheckedChange={(checked) => {
                          handleAgentAction(agent.id, checked ? 'start' : 'pause')
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                      <p className="text-sm font-bold">{agent.performance.total_trades}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(agent.performance.win_rate, 'winrate')}`}>
                        {(agent.performance.win_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">P&L</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(agent.performance.profit_loss, 'profit')}`}>
                        ${agent.performance.profit_loss.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(agent.performance.sharpe_ratio, 'sharpe')}`}>
                        {agent.performance.sharpe_ratio.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(agent.performance.max_drawdown, 'drawdown')}`}>
                        {(agent.performance.max_drawdown * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Last Decision:</p>
                        <p className="font-medium">
                          {agent.last_decision.action} {agent.last_decision.symbol} 
                          <span className="text-muted-foreground ml-2">
                            ({(agent.last_decision.confidence * 100).toFixed(0)}% confidence)
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAgentAction(agent.id, 'start')}
                          disabled={agent.status === 'active'}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAgentAction(agent.id, 'pause')}
                          disabled={agent.status !== 'active'}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAgentAction(agent.id, 'stop')}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{agent.name}</span>
                        <span className={`text-sm font-bold ${getPerformanceColor(agent.performance.profit_loss, 'profit')}`}>
                          ${agent.performance.profit_loss.toFixed(0)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, ((agent.performance.profit_loss + 5000) / 20000) * 100))} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{agent.name}</span>
                        <Badge variant={agent.risk_metrics.var_95 < 0.02 ? 'default' : 'destructive'}>
                          VaR: {(agent.risk_metrics.var_95 * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Exposure:</span>
                          <p className="font-medium">{(agent.risk_metrics.exposure * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Leverage:</span>
                          <p className="font-medium">{agent.risk_metrics.leverage.toFixed(1)}x</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Positions:</span>
                          <p className="font-medium">{agent.current_positions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Advanced settings and controls for trading agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getAgentTypeIcon(agent.type)}
                        <h4 className="font-medium">{agent.name}</h4>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Max Position Size</label>
                        <p className="text-sm text-muted-foreground">
                          {(agent.settings.max_position_size * 100).toFixed(0)}% of portfolio
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Risk Limit</label>
                        <p className="text-sm text-muted-foreground">
                          {(agent.settings.risk_limit * 100).toFixed(0)}% max loss per trade
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Auto Trading</label>
                        <Switch 
                          checked={agent.settings.auto_trading}
                          onCheckedChange={() => {
                            setAgents(agents.map(a => 
                              a.id === agent.id 
                                ? { ...a, settings: { ...a.settings, auto_trading: !a.settings.auto_trading } }
                                : a
                            ))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Goals & Tasks Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle>Agent Goals & Task Management</CardTitle>
              </div>
              <CardDescription>
                Manage tasks, goals, and coordination for your trading agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show todo system for each agent */}
              <Tabs defaultValue={agents[0]?.id || 'all'} className="w-full">
                <TabsList className="grid w-full grid-cols-auto max-w-fit">
                  <TabsTrigger value="all">All Agents</TabsTrigger>
                  {agents.slice(0, 4).map((agent) => (
                    <TabsTrigger key={agent.id} value={agent.id}>
                      {agent.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an agent to view and manage their tasks</p>
                  </div>
                </TabsContent>

                {agents.map((agent) => (
                  <TabsContent key={agent.id} value={agent.id} className="mt-4">
                    <AgentTodoSystem
                      agentId={agent.id}
                      agentHierarchy={[]} // TODO: Get from agent configuration
                      className="min-h-96"
                      onTodoUpdate={(todo) => {
                        console.log(`Todo updated for ${agent.name}:`, todo)
                        // Optionally emit events for real-time updates
                      }}
                      onSystemUpdate={(stats) => {
                        console.log(`Todo stats updated for ${agent.name}:`, stats)
                        // Update agent performance metrics
                      }}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AgentControlPanel