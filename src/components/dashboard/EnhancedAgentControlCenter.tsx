'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Bot, Settings, TrendingUp, Activity, Brain, Zap, Shield, Target, 
  DollarSign, RefreshCw, Plus, Play, Pause, StopCircle, Trash2,
  BarChart3, PieChart, LineChart, Users, MessageSquare, Globe,
  Layers, Database, Server, Key, Lock, Award, Star, Timer,
  ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'
import { toast } from 'react-hot-toast'

interface Agent {
  id: string
  name: string
  type: string
  strategy: string
  status: 'active' | 'idle' | 'error' | 'stopped'
  capital: number
  currentValue: number
  pnl: number
  winRate: number
  totalTrades: number
  lastActive: Date
  createdAt: Date
  config: any
}

interface AgentMetrics {
  totalAgents: number
  activeAgents: number
  totalCapital: number
  totalPnL: number
  avgWinRate: number
  totalTrades: number
}

// Enhanced Agent Control Center Component - Central hub for all agent operations
export function EnhancedAgentControlCenter({ 
  agents, 
  metrics, 
  onRefresh, 
  loading,
  onNavigateToCreate
}: { 
  agents: Agent[]
  metrics: AgentMetrics
  onRefresh: () => void
  loading: boolean
  onNavigateToCreate: () => void
}) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [systemHealth, setSystemHealth] = useState({
    agentsOnline: 0,
    strategiesActive: 0,
    tradingPairs: 0,
    aiModelsConnected: 0,
    systemLoad: 0
  })
  
  // Calculate system health metrics
  useEffect(() => {
    const activeAgents = agents.filter(a => a.status === 'active').length
    const strategiesActive = new Set(agents.map(a => a.strategy)).size
    const tradingPairs = Math.floor(Math.random() * 12) + 8 // Mock trading pairs
    const aiModelsConnected = Math.floor(Math.random() * 5) + 3 // Mock AI models
    const systemLoad = Math.floor(Math.random() * 30) + 15 // Mock system load
    
    setSystemHealth({
      agentsOnline: activeAgents,
      strategiesActive,
      tradingPairs,
      aiModelsConnected,
      systemLoad
    })
  }, [agents])

  const toggleAgent = async (agentId: string, action: 'start' | 'stop') => {
    try {
      const agent = agents.find(a => a.id === agentId)
      if (!agent) return

      if (action === 'start') {
        await agentLifecycleManager.startAgent(agentId)
        toast.success(`Agent "${agent.name}" started`)
      } else {
        await agentLifecycleManager.stopAgent(agentId)
        toast.success(`Agent "${agent.name}" stopped`)
      }
      
      onRefresh()
    } catch (error) {
      console.error(`Error ${action}ing agent:`, error)
      toast.error(`Failed to ${action} agent`)
    }
  }

  const bulkAction = async (action: 'start' | 'stop' | 'delete') => {
    if (selectedAgents.length === 0) {
      toast.error('No agents selected')
      return
    }

    try {
      for (const agentId of selectedAgents) {
        if (action === 'start') {
          await agentLifecycleManager.startAgent(agentId)
        } else if (action === 'stop') {
          await agentLifecycleManager.stopAgent(agentId)
        } else if (action === 'delete') {
          await persistentAgentService.deleteAgent(agentId)
        }
      }
      
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)}ed ${selectedAgents.length} agents`)
      setSelectedAgents([])
      onRefresh()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to ${action} agents`)
    }
  }

  return (
    <div className="space-y-6">
      {/* System Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(100 - systemHealth.systemLoad)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemHealth.systemLoad}% load • All systems operational
            </p>
            <Progress value={100 - systemHealth.systemLoad} className="mt-2 h-1" />
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Trading</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.agentsOnline}</div>
            <p className="text-xs text-muted-foreground mt-1">
              agents trading • {systemHealth.tradingPairs} pairs
            </p>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Intelligence</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.aiModelsConnected}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI models • {systemHealth.strategiesActive} strategies
            </p>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-600">Processing</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={metrics.avgWinRate} suffix="%" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              win rate • {metrics.totalTrades} trades
            </p>
            <div className="text-xs font-medium text-green-600 mt-2">
              +{((metrics.avgWinRate - 65) || 0).toFixed(1)}% vs benchmark
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Action Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions & Navigation
          </CardTitle>
          <CardDescription>
            Central command center for all agent operations and system navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 text-center"
              onClick={onNavigateToCreate}
            >
              <Plus className="h-6 w-6 text-blue-500" />
              <span className="text-sm">Create Agent</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 text-center"
              onClick={() => {
                // Navigate to strategy hub
                const strategyTab = document.querySelector('[data-value="strategy-hub"]') as HTMLElement
                if (strategyTab) strategyTab.click()
              }}
            >
              <Brain className="h-6 w-6 text-purple-500" />
              <span className="text-sm">Strategies</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 text-center"
              onClick={() => {
                // Navigate to trading ops
                const tradingTab = document.querySelector('[data-value="trading-ops"]') as HTMLElement
                if (tradingTab) tradingTab.click()
              }}
            >
              <Zap className="h-6 w-6 text-green-500" />
              <span className="text-sm">Trading Ops</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 text-center"
              onClick={() => {
                // Navigate to AI intelligence
                const aiTab = document.querySelector('[data-value="ai-intelligence"]') as HTMLElement
                if (aiTab) aiTab.click()
              }}
            >
              <Globe className="h-6 w-6 text-indigo-500" />
              <span className="text-sm">AI Intel</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 text-center"
              onClick={() => {
                // Navigate to advanced features
                const advancedTab = document.querySelector('[data-value="advanced-features"]') as HTMLElement
                if (advancedTab) advancedTab.click()
              }}
            >
              <Settings className="h-6 w-6 text-gray-500" />
              <span className="text-sm">Advanced</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 text-center"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-6 w-6 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Agent Performance Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Agent Performance Matrix
              </CardTitle>
              <CardDescription>
                Real-time performance overview of all trading agents
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {agents.filter(a => a.status === 'active').length} Active
              </Badge>
              <Badge variant="outline">
                ${metrics.totalPnL.toFixed(2)} Total P&L
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.slice(0, 6).map((agent) => (
              <Card key={agent.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                        agent.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium text-sm">{agent.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {agent.strategy}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">P&L:</span>
                      <div className={`font-medium ${
                        agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${agent.pnl.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Win Rate:</span>
                      <div className="font-medium">{agent.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress 
                    value={agent.winRate} 
                    className="mt-2 h-1" 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {agents.length > 6 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Navigate to manage existing tab
                  const manageTab = document.querySelector('[data-value="creation-management"]') as HTMLElement
                  if (manageTab) manageTab.click()
                }}
              >
                View All {agents.length} Agents
                <ArrowUp className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Welcome / Empty State */}
      {agents.length === 0 && !loading && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Agent Control Center</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first AI trading agent to begin automated trading with advanced strategies, 
                real-time monitoring, and multi-model intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={onNavigateToCreate} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Agent
                </Button>
                <Button variant="outline" size="lg">
                  <Star className="h-5 w-5 mr-2" />
                  View Templates
                </Button>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-medium mb-3">What you can do:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-left max-w-lg mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Deploy AI trading strategies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Monitor real-time performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Multi-model AI intelligence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Risk management & alerts</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Detailed Agent Management (when agents exist) */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Agent Fleet Management
                </CardTitle>
                <CardDescription>
                  Comprehensive control and monitoring of all trading agents
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const allAgentIds = agents.map(a => a.id)
                    setSelectedAgents(selectedAgents.length === allAgentIds.length ? [] : allAgentIds)
                  }}
                >
                  {selectedAgents.length === agents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            {selectedAgents.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedAgents.length} agents selected
                    </span>
                    <Button size="sm" onClick={() => bulkAction('start')}>
                      <Play className="h-4 w-4 mr-1" />
                      Start All
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkAction('stop')}>
                      <Pause className="h-4 w-4 mr-1" />
                      Stop All
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => bulkAction('delete')}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete All
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedAgents([])}>
                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedAgents.includes(agent.id) ? 'ring-2 ring-blue-500' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAgents.includes(agent.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAgents(prev => [...prev, agent.id])
                              } else {
                                setSelectedAgents(prev => prev.filter(id => id !== agent.id))
                              }
                            }}
                            className="rounded"
                          />
                          <div>
                            <CardTitle className="text-sm">{agent.name}</CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {agent.type}
                              </Badge>
                              <Badge 
                                variant={
                                  agent.status === 'active' ? 'default' :
                                  agent.status === 'error' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {agent.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {agent.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => toggleAgent(agent.id, 'stop')}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => toggleAgent(agent.id, 'start')}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Strategy:</span>
                          <span>{agent.strategy}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">P&L:</span>
                          <span className={agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${agent.pnl.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span>{agent.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Trades:</span>
                          <span>{agent.totalTrades}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}