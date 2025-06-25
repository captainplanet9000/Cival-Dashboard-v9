/**
 * Autonomous Trading Dashboard
 * Real-time monitoring and control of autonomous trading agents
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Play, Pause, Square, Bot, Brain, TrendingUp, TrendingDown, 
  Activity, Shield, Zap, Target, AlertTriangle, CheckCircle,
  Settings, BarChart3, DollarSign, Clock, Users, Gauge
} from 'lucide-react'

import { getAutonomousTradingOrchestrator, AutonomousAgent, AgentDecision, MarketConditions } from '@/lib/autonomous/AutonomousTradingOrchestrator'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'

interface DashboardMetrics {
  totalAgents: number
  activeAgents: number
  totalValue: number
  dailyPnL: number
  totalTrades: number
  winRate: number
  avgReturn: number
  maxDrawdown: number
}

export default function AutonomousTradingDashboard() {
  const [agents, setAgents] = useState<AutonomousAgent[]>([])
  const [orchestratorRunning, setOrchestratorRunning] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    totalValue: 0,
    dailyPnL: 0,
    totalTrades: 0,
    winRate: 0,
    avgReturn: 0,
    maxDrawdown: 0
  })
  const [marketConditions, setMarketConditions] = useState<MarketConditions>({
    volatility: 'medium',
    trend: 'sideways',
    volume: 'normal',
    sentiment: 'neutral',
    regime: 'ranging'
  })
  const [recentDecisions, setRecentDecisions] = useState<AgentDecision[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Update data every 5 seconds
  useEffect(() => {
    const updateData = () => {
      const currentAgents = getAutonomousTradingOrchestrator().getAgents()
      setAgents(currentAgents)
      setOrchestratorRunning(getAutonomousTradingOrchestrator().isRunning())
      setMarketConditions(getAutonomousTradingOrchestrator().getMarketConditions())
      
      // Calculate metrics
      const activeAgents = currentAgents.filter(a => a.status === 'active')
      const totalValue = currentAgents.reduce((sum, agent) => {
        const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
        return sum + (portfolio?.totalValue || 0)
      }, 0)
      
      const totalTrades = currentAgents.reduce((sum, agent) => sum + agent.performance.totalTrades, 0)
      const avgWinRate = totalTrades > 0 ? 
        currentAgents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / currentAgents.length : 0

      setMetrics({
        totalAgents: currentAgents.length,
        activeAgents: activeAgents.length,
        totalValue,
        dailyPnL: currentAgents.reduce((sum, agent) => sum + agent.performance.totalReturn, 0),
        totalTrades,
        winRate: avgWinRate,
        avgReturn: currentAgents.reduce((sum, agent) => sum + agent.performance.totalReturnPercent, 0) / currentAgents.length,
        maxDrawdown: Math.max(...currentAgents.map(agent => agent.performance.maxDrawdown))
      })
    }

    updateData()
    const interval = setInterval(updateData, 5000)

    // Set up event listeners
    const handleDecisionGenerated = (data: any) => {
      setRecentDecisions(prev => [data.decision, ...prev.slice(0, 19)]) // Keep last 20
    }

    const handleDecisionExecuted = (data: any) => {
      setRecentDecisions(prev => 
        prev.map(d => d.id === data.decision.id ? { ...d, executed: true } : d)
      )
    }

    getAutonomousTradingOrchestrator().on('decision:generated', handleDecisionGenerated)
    getAutonomousTradingOrchestrator().on('decision:executed', handleDecisionExecuted)

    return () => {
      clearInterval(interval)
      getAutonomousTradingOrchestrator().off('decision:generated', handleDecisionGenerated)
      getAutonomousTradingOrchestrator().off('decision:executed', handleDecisionExecuted)
    }
  }, [])

  const handleStartOrchestrator = async () => {
    await getAutonomousTradingOrchestrator().start()
    setOrchestratorRunning(true)
  }

  const handleStopOrchestrator = async () => {
    await getAutonomousTradingOrchestrator().stop()
    setOrchestratorRunning(false)
  }

  const handlePauseOrchestrator = async () => {
    await getAutonomousTradingOrchestrator().pause()
  }

  const handleResumeOrchestrator = async () => {
    await getAutonomousTradingOrchestrator().resume()
  }

  const handleToggleAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    const newStatus = agent.status === 'active' ? 'paused' : 'active'
    await getAutonomousTradingOrchestrator().setAgentStatus(agentId, newStatus)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'stopped': return 'bg-red-500'
      case 'error': return 'bg-red-600'
      default: return 'bg-gray-500'
    }
  }

  const getMarketConditionColor = (condition: string) => {
    switch (condition) {
      case 'bullish': return 'text-green-500'
      case 'bearish': return 'text-red-500'
      case 'high': case 'extreme': return 'text-red-500'
      case 'low': return 'text-green-500'
      default: return 'text-yellow-500'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-500" />
            Autonomous Trading System
          </h1>
          <p className="text-muted-foreground">
            AI-powered paper trading with {metrics.totalAgents} autonomous agents
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={orchestratorRunning ? "default" : "secondary"} className="px-3 py-1">
            <Activity className="w-4 h-4 mr-1" />
            {orchestratorRunning ? 'Running' : 'Stopped'}
          </Badge>
          
          {!orchestratorRunning ? (
            <Button onClick={handleStartOrchestrator} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Start System
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handlePauseOrchestrator} variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause All
              </Button>
              <Button onClick={handleResumeOrchestrator} variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Resume All
              </Button>
              <Button onClick={handleStopOrchestrator} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop System
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <p className={`text-sm ${metrics.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(metrics.avgReturn)} today
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{metrics.activeAgents}/{metrics.totalAgents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Progress value={(metrics.activeAgents / metrics.totalAgents) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{metrics.totalTrades} total trades</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-500">{formatPercent(metrics.maxDrawdown)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Market Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Volatility</p>
              <p className={`text-lg font-semibold ${getMarketConditionColor(marketConditions.volatility)}`}>
                {marketConditions.volatility.toUpperCase()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className={`text-lg font-semibold ${getMarketConditionColor(marketConditions.trend)}`}>
                {marketConditions.trend.toUpperCase()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className={`text-lg font-semibold ${getMarketConditionColor(marketConditions.volume)}`}>
                {marketConditions.volume.toUpperCase()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sentiment</p>
              <p className={`text-lg font-semibold ${getMarketConditionColor(marketConditions.sentiment)}`}>
                {marketConditions.sentiment.toUpperCase()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Regime</p>
              <p className={`text-lg font-semibold ${getMarketConditionColor(marketConditions.regime)}`}>
                {marketConditions.regime.toUpperCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map((agent) => {
              const portfolio = persistentTradingEngine.getPortfolio(agent.portfolio)
              const isActive = agent.status === 'active'
              
              return (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                        <div>
                          <h3 className="text-lg font-semibold">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {agent.type.replace('_', ' ')} • {agent.strategy.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={isActive}
                          onCheckedChange={() => handleToggleAgent(agent.id)}
                          disabled={!orchestratorRunning}
                        />
                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Portfolio Value</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(portfolio?.totalValue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">P&L</p>
                        <p className={`text-lg font-semibold ${
                          agent.performance.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatPercent(agent.performance.totalReturnPercent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-lg font-semibold">{agent.performance.winRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Positions</p>
                        <p className="text-lg font-semibold">
                          {portfolio ? Object.keys(portfolio.positions).length : 0}
                        </p>
                      </div>
                    </div>

                    {agent.lastDecision && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Last Decision</p>
                            <p className="text-sm text-muted-foreground">
                              {agent.lastDecision.action.toUpperCase()} {agent.lastDecision.symbol} 
                              • Confidence: {(agent.lastDecision.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {agent.lastDecision.executed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(agent.lastDecision.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Decisions</CardTitle>
              <CardDescription>Latest autonomous trading decisions across all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDecisions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No decisions yet. Start the system to see autonomous decisions.
                  </p>
                ) : (
                  recentDecisions.map((decision) => (
                    <div key={decision.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          decision.executed ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {decision.action.toUpperCase()} {decision.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Size: {decision.size.toFixed(4)} • Confidence: {(decision.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {agents.find(a => a.id === decision.agentId)?.name || decision.agentId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(decision.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    {agent.name}
                  </CardTitle>
                  <CardDescription>{agent.strategy.name} Strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Return</p>
                        <p className={`text-xl font-bold ${
                          agent.performance.totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatPercent(agent.performance.totalReturnPercent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                        <p className="text-xl font-bold">{agent.performance.sharpeRatio.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Trades</p>
                        <p className="text-lg font-semibold">{agent.performance.totalTrades}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Wins</p>
                        <p className="text-lg font-semibold text-green-500">
                          {agent.performance.winningTrades}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Losses</p>
                        <p className="text-lg font-semibold text-red-500">
                          {agent.performance.losingTrades}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-muted-foreground">Risk Limits</p>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Max Position Size:</span>
                          <span>{(agent.riskLimits.maxPositionSize * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Loss Limit:</span>
                          <span>{formatCurrency(agent.riskLimits.maxDailyLoss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Drawdown:</span>
                          <span>{(agent.riskLimits.maxDrawdown * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}