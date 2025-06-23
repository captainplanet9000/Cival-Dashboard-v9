'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Bot,
  Brain,
  Zap,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Square,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  MessageSquare,
  Network,
  Cpu,
  Clock,
  DollarSign,
  Percent,
  Shield,
  Code,
  Database,
  Workflow,
  GitBranch,
  Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Doughnut, Radar } from 'react-chartjs-2'

export interface Agent {
  id: string
  name: string
  type: 'trading' | 'analytics' | 'risk' | 'arbitrage' | 'market_making' | 'sentiment'
  status: 'active' | 'paused' | 'stopped' | 'error' | 'initializing'
  model: string
  version: string
  performance: {
    accuracy: number
    latency: number
    uptime: number
    errorRate: number
    profitability: number
    sharpeRatio: number
    maxDrawdown: number
    tradesExecuted: number
    lastActive: Date
  }
  configuration: {
    riskTolerance: number
    maxPositionSize: number
    tradingPairs: string[]
    strategy: string
    parameters: Record<string, any>
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    networkLatency: number
    apiCalls: number
    rateLimit: number
  }
  dependencies: string[]
  communications: Array<{
    id: string
    from: string
    to: string
    message: string
    timestamp: Date
    type: 'coordination' | 'data' | 'signal' | 'alert'
  }>
}

export interface AgentOrchestrationProps {
  agents: Agent[]
  onAgentUpdate: (agentId: string, updates: Partial<Agent>) => void
  onAgentAction: (agentId: string, action: 'start' | 'pause' | 'stop' | 'restart') => void
  onCreateAgent: (config: Partial<Agent>) => void
  onDeleteAgent: (agentId: string) => void
  className?: string
  maxAgents?: number
  autoScaling?: boolean
  loadBalancing?: boolean
}

// Agent type configurations
const AGENT_TYPES = {
  trading: {
    name: 'Trading Agent',
    icon: <TrendingUp className="h-4 w-4" />,
    color: '#22c55e',
    description: 'Executes trades based on market signals',
    defaultModel: 'gpt-4-turbo',
    capabilities: ['order_execution', 'position_management', 'risk_assessment']
  },
  analytics: {
    name: 'Analytics Agent',
    icon: <BarChart3 className="h-4 w-4" />,
    color: '#3b82f6',
    description: 'Analyzes market data and generates insights',
    defaultModel: 'claude-3-opus',
    capabilities: ['data_analysis', 'pattern_recognition', 'forecasting']
  },
  risk: {
    name: 'Risk Management',
    icon: <Shield className="h-4 w-4" />,
    color: '#ef4444',
    description: 'Monitors and controls portfolio risk',
    defaultModel: 'gpt-4',
    capabilities: ['risk_monitoring', 'compliance_checking', 'alert_generation']
  },
  arbitrage: {
    name: 'Arbitrage Bot',
    icon: <GitBranch className="h-4 w-4" />,
    color: '#8b5cf6',
    description: 'Finds and exploits price differences',
    defaultModel: 'claude-3-sonnet',
    capabilities: ['price_comparison', 'latency_arbitrage', 'statistical_arbitrage']
  },
  market_making: {
    name: 'Market Maker',
    icon: <Layers className="h-4 w-4" />,
    color: '#f59e0b',
    description: 'Provides liquidity to markets',
    defaultModel: 'gpt-4-turbo',
    capabilities: ['order_book_management', 'spread_optimization', 'inventory_management']
  },
  sentiment: {
    name: 'Sentiment Agent',
    icon: <MessageSquare className="h-4 w-4" />,
    color: '#06b6d4',
    description: 'Analyzes market sentiment from various sources',
    defaultModel: 'claude-3-haiku',
    capabilities: ['sentiment_analysis', 'news_processing', 'social_media_monitoring']
  }
}

const AGENT_MODELS = [
  'gpt-4-turbo',
  'gpt-4',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro',
  'custom-model'
]

export function AgentOrchestration({
  agents,
  onAgentUpdate,
  onAgentAction,
  onCreateAgent,
  onDeleteAgent,
  className,
  maxAgents = 20,
  autoScaling = true,
  loadBalancing = true
}: AgentOrchestrationProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'network'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [orchestrationMode, setOrchestrationMode] = useState<'manual' | 'auto'>('auto')
  const [globalSettings, setGlobalSettings] = useState({
    autoScaling: true,
    loadBalancing: true,
    maxConcurrentAgents: 10,
    resourceThreshold: 80,
    errorThreshold: 5
  })

  // Calculate system metrics
  const systemMetrics = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === 'active')
    const totalTrades = agents.reduce((sum, a) => sum + a.performance.tradesExecuted, 0)
    const avgAccuracy = agents.reduce((sum, a) => sum + a.performance.accuracy, 0) / agents.length
    const avgLatency = agents.reduce((sum, a) => sum + a.performance.latency, 0) / agents.length
    const totalCpuUsage = agents.reduce((sum, a) => sum + a.resources.cpuUsage, 0)
    const totalMemoryUsage = agents.reduce((sum, a) => sum + a.resources.memoryUsage, 0)
    const avgProfitability = agents.reduce((sum, a) => sum + a.performance.profitability, 0) / agents.length

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalTrades,
      avgAccuracy,
      avgLatency,
      totalCpuUsage,
      totalMemoryUsage,
      avgProfitability,
      systemHealth: calculateSystemHealth(agents),
      coordination: calculateCoordinationScore(agents)
    }
  }, [agents])

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      if (filterType !== 'all' && agent.type !== filterType) return false
      if (filterStatus !== 'all' && agent.status !== filterStatus) return false
      return true
    })
  }, [agents, filterType, filterStatus])

  // Calculate system health
  function calculateSystemHealth(agents: Agent[]) {
    if (agents.length === 0) return 0
    
    const healthFactors = agents.map(agent => {
      const performance = (agent.performance.accuracy + agent.performance.uptime) / 2
      const resources = 1 - Math.max(agent.resources.cpuUsage, agent.resources.memoryUsage) / 100
      const errors = Math.max(0, 1 - agent.performance.errorRate / 10)
      
      return (performance + resources + errors) / 3
    })
    
    return healthFactors.reduce((sum, health) => sum + health, 0) / healthFactors.length * 100
  }

  // Calculate coordination score
  function calculateCoordinationScore(agents: Agent[]) {
    const totalCommunications = agents.reduce((sum, agent) => sum + agent.communications.length, 0)
    const recentCommunications = agents.reduce((sum, agent) => 
      sum + agent.communications.filter(c => 
        Date.now() - c.timestamp.getTime() < 300000 // Last 5 minutes
      ).length, 0
    )
    
    return Math.min(100, (recentCommunications / Math.max(1, totalCommunications)) * 100)
  }

  // Agent status color mapping
  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'stopped': return 'text-gray-600 bg-gray-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'initializing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // System overview component
  const SystemOverview = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Active Agents</span>
        </div>
        <div className="text-2xl font-bold text-blue-700">
          {systemMetrics.activeAgents}/{systemMetrics.totalAgents}
        </div>
        <div className="text-sm text-blue-600">
          {((systemMetrics.activeAgents / systemMetrics.totalAgents) * 100).toFixed(0)}% utilization
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">System Health</span>
        </div>
        <div className="text-2xl font-bold text-green-700">
          {systemMetrics.systemHealth.toFixed(1)}%
        </div>
        <div className="text-sm text-green-600">
          All systems operational
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Network className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Coordination</span>
        </div>
        <div className="text-2xl font-bold text-purple-700">
          {systemMetrics.coordination.toFixed(1)}%
        </div>
        <div className="text-sm text-purple-600">
          Agent collaboration
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Avg Profit</span>
        </div>
        <div className="text-2xl font-bold text-orange-700">
          {systemMetrics.avgProfitability.toFixed(1)}%
        </div>
        <div className="text-sm text-orange-600">
          {systemMetrics.totalTrades} trades executed
        </div>
      </motion.div>
    </div>
  )

  // Agent card component
  const AgentCard = ({ agent }: { agent: Agent }) => {
    const typeConfig = AGENT_TYPES[agent.type]
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className="p-4 border rounded-lg bg-card hover:shadow-md transition-all cursor-pointer"
        onClick={() => setSelectedAgent(agent.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
            >
              {typeConfig.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{typeConfig.name}</p>
            </div>
          </div>
          
          <Badge className={cn("text-xs", getStatusColor(agent.status))}>
            {agent.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-mono">{agent.performance.accuracy.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-mono">{agent.performance.uptime.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">P&L</span>
            <span className={cn(
              "font-mono",
              agent.performance.profitability >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {agent.performance.profitability >= 0 ? '+' : ''}{agent.performance.profitability.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span>CPU</span>
            <span>{agent.resources.cpuUsage.toFixed(0)}%</span>
          </div>
          <Progress value={agent.resources.cpuUsage} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Memory</span>
            <span>{agent.resources.memoryUsage.toFixed(0)}%</span>
          </div>
          <Progress value={agent.resources.memoryUsage} className="h-1" />
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onAgentAction(agent.id, agent.status === 'active' ? 'pause' : 'start')
            }}
          >
            {agent.status === 'active' ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onAgentAction(agent.id, 'stop')
            }}
          >
            <Square className="h-3 w-3" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedAgent(agent.id)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAgentAction(agent.id, 'restart')}>
                Restart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDeleteAgent(agent.id)}
              >
                Delete Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    )
  }

  // Agent details modal
  const AgentDetailsModal = ({ agent }: { agent: Agent }) => {
    const typeConfig = AGENT_TYPES[agent.type]
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
          >
            {typeConfig.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold">{agent.name}</h2>
            <p className="text-muted-foreground">{typeConfig.description}</p>
          </div>
          <Badge className={cn("ml-auto", getStatusColor(agent.status))}>
            {agent.status}
          </Badge>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="configuration">Config</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="communications">Comms</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Accuracy</Label>
                <div className="text-2xl font-bold">{agent.performance.accuracy.toFixed(1)}%</div>
                <Progress value={agent.performance.accuracy} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Uptime</Label>
                <div className="text-2xl font-bold">{agent.performance.uptime.toFixed(1)}%</div>
                <Progress value={agent.performance.uptime} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Profitability</Label>
                <div className={cn(
                  "text-2xl font-bold",
                  agent.performance.profitability >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {agent.performance.profitability >= 0 ? '+' : ''}{agent.performance.profitability.toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sharpe Ratio</Label>
                <div className="text-2xl font-bold">{agent.performance.sharpeRatio.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Trades Executed</Label>
                <div className="font-mono text-lg">{agent.performance.tradesExecuted.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Error Rate</Label>
                <div className="font-mono text-lg">{agent.performance.errorRate.toFixed(2)}%</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Latency</Label>
                <div className="font-mono text-lg">{agent.performance.latency.toFixed(0)}ms</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Model</Label>
                  <Select value={agent.model}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_MODELS.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Strategy</Label>
                  <Input value={agent.configuration.strategy} readOnly />
                </div>
              </div>
              
              <div>
                <Label>Risk Tolerance: {agent.configuration.riskTolerance}%</Label>
                <Slider
                  value={[agent.configuration.riskTolerance]}
                  onValueChange={(value) => 
                    onAgentUpdate(agent.id, {
                      configuration: { ...agent.configuration, riskTolerance: value[0] }
                    })
                  }
                  max={100}
                  min={0}
                  step={1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Max Position Size: ${agent.configuration.maxPositionSize.toLocaleString()}</Label>
                <Slider
                  value={[agent.configuration.maxPositionSize]}
                  onValueChange={(value) => 
                    onAgentUpdate(agent.id, {
                      configuration: { ...agent.configuration, maxPositionSize: value[0] }
                    })
                  }
                  max={1000000}
                  min={1000}
                  step={1000}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Trading Pairs</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.configuration.tradingPairs.map(pair => (
                    <Badge key={pair} variant="outline">{pair}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>CPU Usage</Label>
                    <span className="text-sm font-mono">{agent.resources.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={agent.resources.cpuUsage} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Memory Usage</Label>
                    <span className="text-sm font-mono">{agent.resources.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={agent.resources.memoryUsage} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Network Latency</Label>
                    <span className="text-sm font-mono">{agent.resources.networkLatency}ms</span>
                  </div>
                  <Progress value={Math.min(agent.resources.networkLatency / 10, 100)} className="h-3" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">API Usage</Label>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Calls Today</span>
                      <span className="font-mono">{agent.resources.apiCalls.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rate Limit</span>
                      <span className="font-mono">{agent.resources.rateLimit.toLocaleString()}/hr</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Dependencies</Label>
                  <div className="mt-2 space-y-1">
                    {agent.dependencies.map(dep => (
                      <Badge key={dep} variant="outline" className="mr-1 mb-1">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communications" className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-2">
              {agent.communications.map(comm => (
                <div key={comm.id} className="p-3 border rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{comm.type}</Badge>
                      <span className="font-medium">{comm.from} → {comm.to}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {comm.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comm.message}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Create agent form
  const CreateAgentForm = () => {
    const [newAgent, setNewAgent] = useState({
      name: '',
      type: 'trading' as keyof typeof AGENT_TYPES,
      model: 'gpt-4-turbo',
      strategy: '',
      riskTolerance: 50,
      maxPositionSize: 10000,
      tradingPairs: ['BTC/USDT', 'ETH/USDT']
    })

    const handleCreate = () => {
      const typeConfig = AGENT_TYPES[newAgent.type]
      onCreateAgent({
        name: newAgent.name,
        type: newAgent.type,
        model: newAgent.model,
        version: '1.0.0',
        status: 'initializing',
        configuration: {
          riskTolerance: newAgent.riskTolerance,
          maxPositionSize: newAgent.maxPositionSize,
          tradingPairs: newAgent.tradingPairs,
          strategy: newAgent.strategy,
          parameters: {}
        },
        performance: {
          accuracy: 0,
          latency: 0,
          uptime: 0,
          errorRate: 0,
          profitability: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          tradesExecuted: 0,
          lastActive: new Date()
        },
        resources: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkLatency: 0,
          apiCalls: 0,
          rateLimit: 1000
        },
        dependencies: typeConfig.capabilities,
        communications: []
      })
      setShowCreateDialog(false)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Agent Name</Label>
            <Input
              value={newAgent.name}
              onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              placeholder="My Trading Agent"
            />
          </div>
          
          <div>
            <Label>Agent Type</Label>
            <Select 
              value={newAgent.type} 
              onValueChange={(value: any) => setNewAgent({ ...newAgent, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>AI Model</Label>
            <Select 
              value={newAgent.model} 
              onValueChange={(value) => setNewAgent({ ...newAgent, model: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_MODELS.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Strategy</Label>
            <Input
              value={newAgent.strategy}
              onChange={(e) => setNewAgent({ ...newAgent, strategy: e.target.value })}
              placeholder="Momentum Trading"
            />
          </div>
        </div>

        <div>
          <Label>Risk Tolerance: {newAgent.riskTolerance}%</Label>
          <Slider
            value={[newAgent.riskTolerance]}
            onValueChange={(value) => setNewAgent({ ...newAgent, riskTolerance: value[0] })}
            max={100}
            min={0}
            step={1}
            className="mt-2"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!newAgent.name}>
            Create Agent
          </Button>
        </div>
      </div>
    )
  }

  const selectedAgentData = selectedAgent ? agents.find(a => a.id === selectedAgent) : null

  return (
    <TooltipProvider>
      <div className={cn("w-full space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8" />
              AI Agent Orchestration
            </h1>
            <p className="text-muted-foreground">
              Manage and coordinate intelligent trading agents
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={orchestrationMode} onValueChange={(value: any) => setOrchestrationMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Mode</SelectItem>
                <SelectItem value="manual">Manual Mode</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Bot className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Agent</DialogTitle>
                  <DialogDescription>
                    Configure a new AI agent for your trading system
                  </DialogDescription>
                </DialogHeader>
                <CreateAgentForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* System Overview */}
        <SystemOverview />

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'network' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('network')}
              >
                <Network className="h-4 w-4" />
              </Button>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(AGENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredAgents.length} of {agents.length} agents
          </div>
        </div>

        {/* Agent Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Agent Details Dialog */}
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedAgentData && <AgentDetailsModal agent={selectedAgentData} />}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}