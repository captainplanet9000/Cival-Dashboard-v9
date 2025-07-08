'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users, Network, Bot, Brain, Zap, Activity, TrendingUp, Target,
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  DollarSign, Percent, BarChart3, PieChart, Globe, Shield,
  Play, Pause, StopCircle, Eye, MessageSquare, Layers,
  Award, Star, Timer, Cpu, Database, Server, GitBranch
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Autonomous Farm Coordination Component
 * Advanced multi-agent farm coordination and management system
 * Features agent orchestration, task distribution, and performance optimization
 */

interface TradingAgent {
  id: string
  name: string
  type: 'scalper' | 'swing' | 'arbitrage' | 'dca' | 'grid' | 'momentum'
  status: 'active' | 'idle' | 'error' | 'maintenance'
  farmId: string
  strategies: string[]
  performance: AgentPerformance
  resources: AgentResources
  tasks: AgentTask[]
  capabilities: string[]
  lastActivity: Date
  uptime: number
  version: string
}

interface AgentPerformance {
  totalTrades: number
  successRate: number
  profitLoss: number
  dailyReturn: number
  weeklyReturn: number
  monthlyReturn: number
  sharpeRatio: number
  maxDrawdown: number
  avgTradeTime: number
  winRate: number
  avgWin: number
  avgLoss: number
}

interface AgentResources {
  cpuUsage: number
  memoryUsage: number
  networkLatency: number
  diskUsage: number
  allocatedCapital: number
  availableCapital: number
  riskAllocation: number
  maxPositionSize: number
}

interface AgentTask {
  id: string
  type: 'trade' | 'analysis' | 'monitor' | 'optimize' | 'report'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'running' | 'completed' | 'failed'
  assignedTo: string
  createdAt: Date
  completedAt?: Date
  progress: number
  estimatedTime: number
  actualTime?: number
  dependencies: string[]
  result?: any
}

interface AgentFarm {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'maintenance' | 'scaling'
  agentCount: number
  maxAgents: number
  totalCapital: number
  allocatedCapital: number
  performance: FarmPerformance
  configuration: FarmConfiguration
  agents: string[]
  createdAt: Date
  lastUpdate: Date
}

interface FarmPerformance {
  totalProfit: number
  dailyProfit: number
  weeklyProfit: number
  monthlyProfit: number
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  avgTradeTime: number
  bestPerformer: string
  worstPerformer: string
  efficiency: number
  utilization: number
}

interface FarmConfiguration {
  maxConcurrentTrades: number
  riskPerTrade: number
  stopLossPercent: number
  takeProfitPercent: number
  rebalanceFrequency: number
  autoScaling: boolean
  loadBalancing: boolean
  failoverEnabled: boolean
  maxDrawdown: number
  emergencyStop: boolean
}

interface CoordinationMetrics {
  totalAgents: number
  activeAgents: number
  totalFarms: number
  activeFarms: number
  totalCapital: number
  allocatedCapital: number
  totalTasks: number
  completedTasks: number
  averageEfficiency: number
  systemUptime: number
  communicationLatency: number
  taskThroughput: number
}

const MOCK_AGENTS: TradingAgent[] = [
  {
    id: 'agent-001',
    name: 'Alpha Scalper',
    type: 'scalper',
    status: 'active',
    farmId: 'farm-001',
    strategies: ['Scalping', 'Momentum'],
    performance: {
      totalTrades: 1247,
      successRate: 78.5,
      profitLoss: 18750,
      dailyReturn: 2.4,
      weeklyReturn: 12.8,
      monthlyReturn: 35.6,
      sharpeRatio: 2.1,
      maxDrawdown: -8.5,
      avgTradeTime: 3.2,
      winRate: 72.3,
      avgWin: 85.2,
      avgLoss: -32.1
    },
    resources: {
      cpuUsage: 65,
      memoryUsage: 42,
      networkLatency: 12,
      diskUsage: 28,
      allocatedCapital: 50000,
      availableCapital: 15000,
      riskAllocation: 2.5,
      maxPositionSize: 5000
    },
    tasks: [],
    capabilities: ['High-frequency trading', 'Market making', 'Risk management'],
    lastActivity: new Date(Date.now() - 2 * 60 * 1000),
    uptime: 99.8,
    version: '2.1.4'
  },
  {
    id: 'agent-002',
    name: 'Beta Swing',
    type: 'swing',
    status: 'active',
    farmId: 'farm-001',
    strategies: ['Swing Trading', 'Mean Reversion'],
    performance: {
      totalTrades: 342,
      successRate: 82.1,
      profitLoss: 24300,
      dailyReturn: 1.8,
      weeklyReturn: 9.2,
      monthlyReturn: 28.4,
      sharpeRatio: 1.9,
      maxDrawdown: -12.3,
      avgTradeTime: 45.8,
      winRate: 68.9,
      avgWin: 142.6,
      avgLoss: -58.4
    },
    resources: {
      cpuUsage: 45,
      memoryUsage: 38,
      networkLatency: 8,
      diskUsage: 22,
      allocatedCapital: 75000,
      availableCapital: 25000,
      riskAllocation: 3.0,
      maxPositionSize: 7500
    },
    tasks: [],
    capabilities: ['Technical analysis', 'Pattern recognition', 'Trend following'],
    lastActivity: new Date(Date.now() - 5 * 60 * 1000),
    uptime: 98.9,
    version: '2.0.8'
  },
  {
    id: 'agent-003',
    name: 'Gamma Arbitrage',
    type: 'arbitrage',
    status: 'active',
    farmId: 'farm-002',
    strategies: ['Cross-exchange Arbitrage', 'Statistical Arbitrage'],
    performance: {
      totalTrades: 2156,
      successRate: 85.4,
      profitLoss: 32100,
      dailyReturn: 3.1,
      weeklyReturn: 15.7,
      monthlyReturn: 42.8,
      sharpeRatio: 2.8,
      maxDrawdown: -5.2,
      avgTradeTime: 1.8,
      winRate: 79.6,
      avgWin: 62.3,
      avgLoss: -18.9
    },
    resources: {
      cpuUsage: 78,
      memoryUsage: 56,
      networkLatency: 6,
      diskUsage: 34,
      allocatedCapital: 100000,
      availableCapital: 30000,
      riskAllocation: 2.0,
      maxPositionSize: 10000
    },
    tasks: [],
    capabilities: ['Multi-exchange trading', 'Latency optimization', 'Statistical analysis'],
    lastActivity: new Date(Date.now() - 1 * 60 * 1000),
    uptime: 99.9,
    version: '2.2.1'
  }
]

const MOCK_FARMS: AgentFarm[] = [
  {
    id: 'farm-001',
    name: 'Alpha Trading Farm',
    description: 'High-frequency trading farm focused on scalping and momentum strategies',
    status: 'active',
    agentCount: 12,
    maxAgents: 20,
    totalCapital: 500000,
    allocatedCapital: 380000,
    performance: {
      totalProfit: 67890,
      dailyProfit: 2340,
      weeklyProfit: 12450,
      monthlyProfit: 48970,
      totalTrades: 3847,
      successfulTrades: 3012,
      failedTrades: 835,
      avgTradeTime: 8.5,
      bestPerformer: 'agent-001',
      worstPerformer: 'agent-008',
      efficiency: 87.2,
      utilization: 76.0
    },
    configuration: {
      maxConcurrentTrades: 50,
      riskPerTrade: 2.0,
      stopLossPercent: 3.0,
      takeProfitPercent: 1.5,
      rebalanceFrequency: 15,
      autoScaling: true,
      loadBalancing: true,
      failoverEnabled: true,
      maxDrawdown: 15.0,
      emergencyStop: false
    },
    agents: ['agent-001', 'agent-002'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastUpdate: new Date()
  },
  {
    id: 'farm-002',
    name: 'Beta Arbitrage Farm',
    description: 'Cross-exchange arbitrage and statistical trading farm',
    status: 'active',
    agentCount: 8,
    maxAgents: 15,
    totalCapital: 300000,
    allocatedCapital: 240000,
    performance: {
      totalProfit: 45680,
      dailyProfit: 1890,
      weeklyProfit: 9850,
      monthlyProfit: 38970,
      totalTrades: 5234,
      successfulTrades: 4456,
      failedTrades: 778,
      avgTradeTime: 3.2,
      bestPerformer: 'agent-003',
      worstPerformer: 'agent-012',
      efficiency: 91.5,
      utilization: 80.0
    },
    configuration: {
      maxConcurrentTrades: 100,
      riskPerTrade: 1.5,
      stopLossPercent: 2.0,
      takeProfitPercent: 1.0,
      rebalanceFrequency: 30,
      autoScaling: true,
      loadBalancing: true,
      failoverEnabled: true,
      maxDrawdown: 10.0,
      emergencyStop: false
    },
    agents: ['agent-003'],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    lastUpdate: new Date()
  }
]

const MOCK_TASKS: AgentTask[] = [
  {
    id: 'task-001',
    type: 'trade',
    priority: 'high',
    status: 'running',
    assignedTo: 'agent-001',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    progress: 75,
    estimatedTime: 180,
    dependencies: [],
    result: null
  },
  {
    id: 'task-002',
    type: 'analysis',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'agent-002',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 1000),
    progress: 100,
    estimatedTime: 600,
    actualTime: 480,
    dependencies: [],
    result: { recommendation: 'BUY', confidence: 85 }
  },
  {
    id: 'task-003',
    type: 'optimize',
    priority: 'low',
    status: 'pending',
    assignedTo: 'agent-003',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    progress: 0,
    estimatedTime: 1200,
    dependencies: ['task-002'],
    result: null
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

interface AutonomousFarmCoordinationProps {
  onAgentAction?: (agentId: string, action: string) => void
  onFarmAction?: (farmId: string, action: string) => void
  onTaskAssign?: (taskId: string, agentId: string) => void
  className?: string
}

export function AutonomousFarmCoordination({
  onAgentAction,
  onFarmAction,
  onTaskAssign,
  className = ''
}: AutonomousFarmCoordinationProps) {
  const [agents, setAgents] = useState<TradingAgent[]>(MOCK_AGENTS)
  const [farms, setFarms] = useState<AgentFarm[]>(MOCK_FARMS)
  const [tasks, setTasks] = useState<AgentTask[]>(MOCK_TASKS)
  const [selectedFarm, setSelectedFarm] = useState<string>('farm-001')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [autoCoordination, setAutoCoordination] = useState(true)

  // Calculate coordination metrics
  const metrics = useMemo<CoordinationMetrics>(() => {
    const totalAgents = agents.length
    const activeAgents = agents.filter(a => a.status === 'active').length
    const totalFarms = farms.length
    const activeFarms = farms.filter(f => f.status === 'active').length
    const totalCapital = farms.reduce((sum, farm) => sum + farm.totalCapital, 0)
    const allocatedCapital = farms.reduce((sum, farm) => sum + farm.allocatedCapital, 0)
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const averageEfficiency = farms.reduce((sum, farm) => sum + farm.performance.efficiency, 0) / farms.length
    const systemUptime = agents.reduce((sum, agent) => sum + agent.uptime, 0) / agents.length

    return {
      totalAgents,
      activeAgents,
      totalFarms,
      activeFarms,
      totalCapital,
      allocatedCapital,
      totalTasks,
      completedTasks,
      averageEfficiency,
      systemUptime,
      communicationLatency: 8.5,
      taskThroughput: 145.2
    }
  }, [agents, farms, tasks])

  // Get agents for selected farm
  const farmAgents = useMemo(() => {
    return agents.filter(agent => agent.farmId === selectedFarm)
  }, [agents, selectedFarm])

  // Performance comparison data
  const performanceData = useMemo(() => {
    return agents.map(agent => ({
      name: agent.name,
      successRate: agent.performance.successRate,
      profitLoss: agent.performance.profitLoss,
      sharpeRatio: agent.performance.sharpeRatio,
      trades: agent.performance.totalTrades,
      uptime: agent.uptime
    }))
  }, [agents])

  // Resource utilization data
  const resourceData = useMemo(() => {
    return agents.map(agent => ({
      name: agent.name,
      cpu: agent.resources.cpuUsage,
      memory: agent.resources.memoryUsage,
      network: agent.resources.networkLatency,
      disk: agent.resources.diskUsage
    }))
  }, [agents])

  // Task distribution data
  const taskDistributionData = useMemo(() => {
    const distribution = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: COLORS[index % COLORS.length]
    }))
  }, [tasks])

  // Farm performance trends (mock data)
  const farmTrendsData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        time: timestamp.toISOString().slice(11, 16),
        profit: Math.random() * 1000 + 500,
        trades: Math.floor(Math.random() * 50) + 20,
        efficiency: Math.random() * 20 + 80,
        agents: Math.floor(Math.random() * 5) + 8
      })
    }
    
    return data
  }, [])

  // Optimize farm coordination
  const optimizeFarmCoordination = useCallback(async () => {
    setIsOptimizing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate optimization results
      setAgents(prev => prev.map(agent => ({
        ...agent,
        resources: {
          ...agent.resources,
          cpuUsage: Math.max(10, agent.resources.cpuUsage - Math.random() * 20),
          memoryUsage: Math.max(10, agent.resources.memoryUsage - Math.random() * 15)
        },
        performance: {
          ...agent.performance,
          successRate: Math.min(95, agent.performance.successRate + Math.random() * 5)
        }
      })))
      
      setFarms(prev => prev.map(farm => ({
        ...farm,
        performance: {
          ...farm.performance,
          efficiency: Math.min(100, farm.performance.efficiency + Math.random() * 10)
        }
      })))
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }, [])

  // Agent action handler
  const handleAgentAction = useCallback((agentId: string, action: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { 
            ...agent, 
            status: action === 'start' ? 'active' : action === 'stop' ? 'idle' : agent.status,
            lastActivity: new Date()
          }
        : agent
    ))
    
    if (onAgentAction) {
      onAgentAction(agentId, action)
    }
  }, [onAgentAction])

  // Farm action handler
  const handleFarmAction = useCallback((farmId: string, action: string) => {
    setFarms(prev => prev.map(farm => 
      farm.id === farmId 
        ? { 
            ...farm, 
            status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : farm.status,
            lastUpdate: new Date()
          }
        : farm
    ))
    
    if (onFarmAction) {
      onFarmAction(farmId, action)
    }
  }, [onFarmAction])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'idle': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'maintenance': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                Autonomous Farm Coordination
                <Badge variant="default" className="bg-purple-100 text-purple-800">
                  {metrics.activeAgents}/{metrics.totalAgents} Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Advanced multi-agent coordination across {metrics.totalFarms} trading farms
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="autoCoord" className="text-sm">Auto Coordination</Label>
                <Switch
                  id="autoCoord"
                  checked={autoCoordination}
                  onCheckedChange={setAutoCoordination}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={optimizeFarmCoordination}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Optimize
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={metrics.totalAgents} />
            </div>
            <div className="text-sm text-muted-foreground">Total Agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={metrics.activeAgents} />
            </div>
            <div className="text-sm text-muted-foreground">Active Agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={metrics.totalFarms} />
            </div>
            <div className="text-sm text-muted-foreground">Total Farms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedPrice value={metrics.totalCapital} currency="$" precision={0} />
            </div>
            <div className="text-sm text-muted-foreground">Total Capital</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              <AnimatedCounter value={metrics.averageEfficiency} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Avg Efficiency</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              <AnimatedCounter value={metrics.systemUptime} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">System Uptime</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="farms">Farms</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Farm Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={farmTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        stroke="#3B82F6"
                        name="Profit ($)"
                      />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Efficiency (%)"
                      />
                      <Bar dataKey="agents" fill="#F59E0B" name="Active Agents" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Success Rate"
                        dataKey="successRate"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="Uptime"
                        dataKey="uptime"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={taskDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span>58%</span>
                    </div>
                    <Progress value={58} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span>42%</span>
                    </div>
                    <Progress value={42} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Network Latency</span>
                      <span>8.5ms</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Task Queue</span>
                      <span>12 pending</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Agent Alpha completed trade analysis</span>
                    <span className="text-muted-foreground ml-auto">2m ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>Farm Beta scaled to 15 agents</span>
                    <span className="text-muted-foreground ml-auto">5m ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span>Optimization cycle completed</span>
                    <span className="text-muted-foreground ml-auto">8m ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span>High-priority task assigned</span>
                    <span className="text-muted-foreground ml-auto">12m ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Trading Agents</h3>
              <p className="text-sm text-muted-foreground">
                {farmAgents.length} agents in selected farm
              </p>
            </div>
            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {farms.map(farm => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmAgents.map(agent => (
              <Card key={agent.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Type</div>
                        <div className="font-medium capitalize">{agent.type}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Uptime</div>
                        <div className="font-medium">{agent.uptime.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div className="font-medium">{agent.performance.successRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">P&L</div>
                        <div className="font-medium text-green-600">
                          ${agent.performance.profitLoss.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Resource Usage</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>CPU</span>
                            <span>{agent.resources.cpuUsage}%</span>
                          </div>
                          <Progress value={agent.resources.cpuUsage} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Memory</span>
                            <span>{agent.resources.memoryUsage}%</span>
                          </div>
                          <Progress value={agent.resources.memoryUsage} className="h-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAgentAction(agent.id, agent.status === 'active' ? 'stop' : 'start')}
                      >
                        {agent.status === 'active' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cpu" fill="#3B82F6" name="CPU %" />
                    <Bar dataKey="memory" fill="#10B981" name="Memory %" />
                    <Bar dataKey="disk" fill="#F59E0B" name="Disk %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Farms Tab */}
        <TabsContent value="farms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map(farm => (
              <Card key={farm.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-green-600" />
                        {farm.name}
                      </CardTitle>
                      <CardDescription>{farm.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(farm.status)}>
                      {farm.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Agents</div>
                        <div className="text-lg font-semibold">
                          {farm.agentCount}/{farm.maxAgents}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Capital</div>
                        <div className="text-lg font-semibold">
                          ${(farm.allocatedCapital / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="text-lg font-semibold">
                          {farm.performance.efficiency.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Daily P&L</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${farm.performance.dailyProfit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilization:</span>
                        <span>{farm.performance.utilization.toFixed(1)}%</span>
                      </div>
                      <Progress value={farm.performance.utilization} className="h-2" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleFarmAction(farm.id, farm.status === 'active' ? 'pause' : 'start')}
                      >
                        {farm.status === 'active' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Queue</CardTitle>
              <CardDescription>
                {tasks.length} total tasks • {tasks.filter(t => t.status === 'running').length} running • {tasks.filter(t => t.status === 'pending').length} pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                        <span className="font-medium">Task {task.id}</span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    
                    {task.status === 'running' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Assigned To</div>
                        <div className="font-medium">{task.assignedTo}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div className="font-medium">
                          {task.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Estimated Time</div>
                        <div className="font-medium">{(task.estimatedTime / 60).toFixed(0)}min</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Dependencies</div>
                        <div className="font-medium">{task.dependencies.length}</div>
                      </div>
                    </div>
                    
                    {task.result && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <strong>Result:</strong> {JSON.stringify(task.result)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid />
                      <XAxis 
                        dataKey="successRate" 
                        name="Success Rate"
                        type="number"
                        domain={[0, 100]}
                      />
                      <YAxis 
                        dataKey="profitLoss" 
                        name="Profit/Loss"
                        type="number"
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Scatter
                        name="Agents"
                        data={performanceData}
                        fill="#3B82F6"
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Farm Efficiency Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {farms.map((farm, index) => (
                    <div key={farm.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{farm.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {farm.performance.efficiency.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={farm.performance.efficiency}
                        className="h-3"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coordination Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.communicationLatency.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Comm Latency</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.taskThroughput.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tasks/Hour</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {((metrics.allocatedCapital / metrics.totalCapital) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Capital Utilization</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coordination Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoCoordination">Auto Coordination</Label>
                  <Switch
                    id="autoCoordination"
                    checked={autoCoordination}
                    onCheckedChange={setAutoCoordination}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="loadBalancing">Load Balancing</Label>
                  <Switch id="loadBalancing" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoScaling">Auto Scaling</Label>
                  <Switch id="autoScaling" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="failover">Failover Protection</Label>
                  <Switch id="failover" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="healthMonitoring">Health Monitoring</Label>
                  <Switch id="healthMonitoring" defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAgentsPerFarm">Max Agents Per Farm</Label>
                <Input
                  id="maxAgentsPerFarm"
                  type="number"
                  defaultValue="20"
                  placeholder="Maximum agents per farm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rebalanceInterval">Rebalance Interval (minutes)</Label>
                <Input
                  id="rebalanceInterval"
                  type="number"
                  defaultValue="15"
                  placeholder="Rebalance frequency"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                <Input
                  id="maxDrawdown"
                  type="number"
                  step="0.1"
                  defaultValue="15.0"
                  placeholder="Maximum drawdown threshold"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AutonomousFarmCoordination