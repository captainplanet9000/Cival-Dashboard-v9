'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import FundingDashboard from '@/components/funding/FundingDashboard'
import { autonomousTradingCoordinator, AutonomousAgent } from '@/lib/agents/autonomous-trading-coordinator'
import { getMasterWalletManager } from '@/lib/blockchain/master-wallet-manager'
import { dexTradingEngine } from '@/lib/dex/dex-trading-engine'
import { Wallet, Bot, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle, Play, Pause, Square } from 'lucide-react'

export default function FundingPage() {
  const [agents, setAgents] = useState<AutonomousAgent[]>([])
  const [systemStats, setSystemStats] = useState<any>({})
  const [isSystemRunning, setIsSystemRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSystemData()
    setupEventListeners()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSystemData = async () => {
    try {
      const allAgents = autonomousTradingCoordinator.getAllAgents()
      setAgents(allAgents)
      
      const stats = autonomousTradingCoordinator.getSystemStats()
      setSystemStats(stats)
      setIsSystemRunning(stats.isRunning)
    } catch (error) {
      console.error('Error loading system data:', error)
    }
  }

  const setupEventListeners = () => {
    // System events
    autonomousTradingCoordinator.on('tradingStarted', () => {
      setSuccess('Autonomous trading system started')
      setIsSystemRunning(true)
      loadSystemData()
    })

    autonomousTradingCoordinator.on('tradingStopped', () => {
      setSuccess('Autonomous trading system stopped')
      setIsSystemRunning(false)
      loadSystemData()
    })

    // Agent events
    autonomousTradingCoordinator.on('agentDeployed', (agent) => {
      setSuccess(`Agent ${agent.name} deployed successfully`)
      loadSystemData()
    })

    autonomousTradingCoordinator.on('agentStarted', (agent) => {
      setSuccess(`Agent ${agent.name} started trading`)
      loadSystemData()
    })

    autonomousTradingCoordinator.on('agentStopped', (agent) => {
      setSuccess(`Agent ${agent.name} stopped trading`)
      loadSystemData()
    })

    autonomousTradingCoordinator.on('agentPaused', (data) => {
      setError(`Agent ${data.agent.name} paused: ${data.reason}`)
      loadSystemData()
    })

    return () => {
      autonomousTradingCoordinator.removeAllListeners()
    }
  }

  const startTradingSystem = async () => {
    setLoading(true)
    setError(null)
    try {
      const success = await autonomousTradingCoordinator.startAutonomousTrading()
      if (!success) {
        setError('Failed to start trading system')
      }
    } catch (error) {
      setError('Error starting trading system')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const stopTradingSystem = async () => {
    setLoading(true)
    setError(null)
    try {
      const success = await autonomousTradingCoordinator.stopAutonomousTrading()
      if (!success) {
        setError('Failed to stop trading system')
      }
    } catch (error) {
      setError('Error stopping trading system')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deployAgent = async (type: 'scalper' | 'arbitrager' | 'trend_follower', allocation: number) => {
    setLoading(true)
    setError(null)
    try {
      const agent = await autonomousTradingCoordinator.deployAgent(
        `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`,
        type,
        allocation
      )
      
      if (!agent) {
        setError('Failed to deploy agent')
      }
    } catch (error) {
      setError('Error deploying agent')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const startAgent = async (agentId: string) => {
    setLoading(true)
    try {
      await autonomousTradingCoordinator.startAgentTrading(agentId)
    } finally {
      setLoading(false)
    }
  }

  const stopAgent = async (agentId: string) => {
    setLoading(true)
    try {
      await autonomousTradingCoordinator.stopAgentTrading(agentId)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />
      case 'stopped': return <Square className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'paused': return 'secondary'
      case 'stopped': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Real Money Trading System</h1>
          <p className="text-muted-foreground">
            Deposit $100 → Agents trade autonomously on live DEXes → Earn profits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <DollarSign className="h-3 w-3 mr-1" />
            Real Blockchain
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            <Bot className="h-3 w-3 mr-1" />
            AI Agents
          </Badge>
          <Badge variant={isSystemRunning ? "default" : "secondary"}>
            {isSystemRunning ? 'LIVE' : 'STOPPED'}
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-muted-foreground">Total Allocated</div>
            </div>
            <div className="text-2xl font-bold">${(systemStats.totalAllocated || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-muted-foreground">Total Profit</div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${(systemStats.totalProfit || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-2xl font-bold">
              {systemStats.activeAgents || 0}/{systemStats.totalAgents || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-2xl font-bold">{systemStats.totalTrades || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trading System Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autonomous Trading System</p>
              <p className="text-sm text-muted-foreground">
                {isSystemRunning 
                  ? 'System is running - agents are trading autonomously'
                  : 'System is stopped - no trading activity'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {!isSystemRunning ? (
                <Button onClick={startTradingSystem} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Trading
                </Button>
              ) : (
                <Button onClick={stopTradingSystem} disabled={loading} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Trading
                </Button>
              )}
            </div>
          </div>
          
          {systemStats.systemROI !== undefined && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">System Performance</div>
              <div className="text-lg font-bold">
                ROI: {systemStats.systemROI.toFixed(2)}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="funding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funding">Funding & Wallets</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="deploy">Deploy New Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="funding">
          <FundingDashboard />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployed Agents</CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No agents deployed yet</p>
                  <p className="text-sm text-muted-foreground">Deploy your first agent to start autonomous trading</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(agent.status)}
                          <div>
                            <h3 className="font-medium">{agent.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Type: {agent.type} • Allocation: ${agent.allocation.allocatedAmount}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                          {agent.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => stopAgent(agent.id)}
                              disabled={loading}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startAgent(agent.id)}
                              disabled={loading}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Trades</p>
                          <p className="font-medium">{agent.performance.totalTrades}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className="font-medium">{agent.performance.winRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Net Profit</p>
                          <p className={`font-medium ${agent.performance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${agent.performance.netProfit.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risk Score</p>
                          <p className="font-medium">{agent.performance.riskScore.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Activity</p>
                          <p className="font-medium">{new Date(agent.lastActivity).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Scalper Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  High-frequency trader that captures small price movements
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trade Frequency:</span>
                    <span>30 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Trade Size:</span>
                    <span>$50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Profit:</span>
                    <span>1%</span>
                  </div>
                </div>
                <Button 
                  onClick={() => deployAgent('scalper', 25)}
                  disabled={loading}
                  className="w-full"
                >
                  Deploy for $25
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arbitrage Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exploits price differences between DEXes
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trade Frequency:</span>
                    <span>15 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Trade Size:</span>
                    <span>$100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Profit:</span>
                    <span>0.5%</span>
                  </div>
                </div>
                <Button 
                  onClick={() => deployAgent('arbitrager', 40)}
                  disabled={loading}
                  className="w-full"
                >
                  Deploy for $40
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Follower</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Follows market trends for larger profits
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Trade Frequency:</span>
                    <span>5 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Trade Size:</span>
                    <span>$75</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Profit:</span>
                    <span>10%</span>
                  </div>
                </div>
                <Button 
                  onClick={() => deployAgent('trend_follower', 35)}
                  disabled={loading}
                  className="w-full"
                >
                  Deploy for $35
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}