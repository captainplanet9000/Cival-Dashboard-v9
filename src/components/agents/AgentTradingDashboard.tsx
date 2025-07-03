'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Bot, Play, Pause, Square, Plus, Settings, Activity, 
  TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle,
  CheckCircle, XCircle, Clock, BarChart3, Users, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentTrading, useAgentMonitoring } from '@/hooks/useAgentTrading'
import type { AgentConfig } from '@/lib/agents/enhanced-agent-trading'

interface AgentTradingDashboardProps {
  className?: string
}

export function AgentTradingDashboard({ className }: AgentTradingDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    type: 'momentum' as const,
    riskTolerance: 'medium' as const,
    maxPositionSize: 1000,
    maxDailyTrades: 10,
    allowedSymbols: ['BTC/USD'],
    exchangePreferences: ['hyperliquid'],
    stopLoss: 2,
    takeProfit: 4,
    maxDrawdown: 10,
    cooldownPeriod: 5,
    confidenceThreshold: 0.7,
    enablePaperTrading: true
  })

  const {
    agents,
    isRunning,
    totalAgents,
    activeAgents,
    totalTrades,
    totalPnL,
    isLoading,
    createAgent,
    activateAgent,
    deactivateAgent,
    startTradingEngine,
    stopTradingEngine,
    getAllPositions,
    getAllDecisions
  } = useAgentTrading()

  const { alerts, clearAlert, clearAllAlerts } = useAgentMonitoring()

  const handleCreateAgent = async () => {
    const agentConfig = {
      name: newAgent.name,
      type: newAgent.type,
      isActive: false,
      riskTolerance: newAgent.riskTolerance,
      maxPositionSize: newAgent.maxPositionSize,
      maxDailyTrades: newAgent.maxDailyTrades,
      allowedSymbols: newAgent.allowedSymbols,
      exchangePreferences: newAgent.exchangePreferences,
      strategies: [],
      settings: {
        stopLoss: newAgent.stopLoss,
        takeProfit: newAgent.takeProfit,
        maxDrawdown: newAgent.maxDrawdown,
        cooldownPeriod: newAgent.cooldownPeriod,
        confidenceThreshold: newAgent.confidenceThreshold,
        enablePaperTrading: newAgent.enablePaperTrading,
        notificationLevel: 'all' as const
      }
    }

    const agentId = await createAgent(agentConfig)
    if (agentId) {
      setIsCreateDialogOpen(false)
      setNewAgent({
        name: '',
        description: '',
        type: 'momentum',
        riskTolerance: 'medium',
        maxPositionSize: 1000,
        maxDailyTrades: 10,
        allowedSymbols: ['BTC/USD'],
        exchangePreferences: ['hyperliquid'],
        stopLoss: 2,
        takeProfit: 4,
        maxDrawdown: 10,
        cooldownPeriod: 5,
        confidenceThreshold: 0.7,
        enablePaperTrading: true
      })
    }
  }

  const handleToggleAgent = async (agent: AgentConfig) => {
    if (agent.isActive) {
      await deactivateAgent(agent.id)
    } else {
      await activateAgent(agent.id)
    }
  }

  const handleToggleEngine = async () => {
    if (isRunning) {
      await stopTradingEngine()
    } else {
      await startTradingEngine()
    }
  }

  const allPositions = getAllPositions()
  const recentDecisions = getAllDecisions().slice(0, 10)
  const openPositions = allPositions.filter(p => p.unrealizedPnL !== 0)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Agent Trading System
          </h2>
          <p className="text-muted-foreground">
            Autonomous trading agents with adaptive learning
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
          <Button onClick={handleToggleEngine} variant={isRunning ? 'destructive' : 'default'}>
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Engine
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Engine
              </>
            )}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Trading Agent</DialogTitle>
                <DialogDescription>
                  Configure a new autonomous trading agent
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Trading Agent"
                    />
                  </div>
                  <div>
                    <Label>Agent Type</Label>
                    <Select value={newAgent.type} onValueChange={(value: any) => setNewAgent(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="momentum">Momentum</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                        <SelectItem value="scalping">Scalping</SelectItem>
                        <SelectItem value="swing">Swing Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Risk Tolerance</Label>
                    <Select value={newAgent.riskTolerance} onValueChange={(value: any) => setNewAgent(prev => ({ ...prev, riskTolerance: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="max-position">Max Position Size</Label>
                    <Input
                      id="max-position"
                      type="number"
                      value={newAgent.maxPositionSize}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, maxPositionSize: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-trades">Max Daily Trades</Label>
                    <Input
                      id="max-trades"
                      type="number"
                      value={newAgent.maxDailyTrades}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, maxDailyTrades: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                    <Input
                      id="stop-loss"
                      type="number"
                      step="0.1"
                      value={newAgent.stopLoss}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="take-profit">Take Profit (%)</Label>
                    <Input
                      id="take-profit"
                      type="number"
                      step="0.1"
                      value={newAgent.takeProfit}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence Threshold</Label>
                    <Input
                      id="confidence"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={newAgent.confidenceThreshold}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent} disabled={!newAgent.name}>
                  Create Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Agent Alerts ({alerts.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAllAlerts}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div className="flex items-center gap-2">
                    {alert.type === 'error' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => clearAlert(alert.id)}>
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold">{totalAgents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                  <p className="text-2xl font-bold">{activeAgents}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{totalTrades}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalPnL.toFixed(2)}
                  </p>
                </div>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.filter(agent => agent.isActive).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {agent.type.replace('_', ' ')} • {agent.riskTolerance} risk
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Active</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAgent(agent)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Decisions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recent Decisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDecisions.map((decision) => (
                    <div key={decision.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          decision.executed ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{decision.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {decision.action.toUpperCase()} • {(decision.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </div>
                      <Badge variant={decision.executed ? 'default' : 'secondary'}>
                        {decision.executed ? 'Executed' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {agent.type.replace('_', ' ')} Strategy
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Risk Level</p>
                        <p className="font-semibold capitalize">{agent.riskTolerance}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max Position</p>
                        <p className="font-semibold">${agent.maxPositionSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Daily Trades</p>
                        <p className="font-semibold">{agent.maxDailyTrades}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paper Trading</p>
                        <p className="font-semibold">{agent.settings.enablePaperTrading ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAgent(agent)}
                        className="flex-1"
                      >
                        {agent.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openPositions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No open positions</p>
                ) : (
                  openPositions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{position.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {position.side.toUpperCase()} • {position.quantity} @ ${position.entryPrice}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${position.unrealizedPnL.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Current: ${position.currentPrice}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDecisions.map((decision) => (
                  <div key={decision.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {decision.executed ? (
                          decision.executionResult?.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <Badge variant={
                          decision.executed ? 
                            decision.executionResult?.status === 'success' ? 'default' : 'destructive'
                            : 'secondary'
                        }>
                          {decision.executed ? decision.executionResult?.status : 'pending'}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{decision.symbol} • {decision.action.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(decision.timestamp).toLocaleString()} • {(decision.confidence * 100).toFixed(0)}% confidence
                        </p>
                        {decision.reasoning.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {decision.reasoning[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${decision.parameters.entryPrice}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {decision.parameters.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AgentTradingDashboard