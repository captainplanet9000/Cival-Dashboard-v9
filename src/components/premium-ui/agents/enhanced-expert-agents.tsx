'use client'

// Enhanced Expert Agents Panel - Premium version preserving ALL existing functionality
// Migrated from: src/components/agent-trading/ExpertAgentsPanel.tsx
// Preserves: 5 specialized agents, Real-time analysis, Agent coordination, Performance analytics

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  LineChart,
  PieChart
} from 'lucide-react'

// Import premium components
import { StrategySortable } from '../sortable/StrategySortable'
import { AdvancedDataTable, createStatusColumn, createChangeColumn } from '../tables/advanced-data-table'
import { AutoForm, StrategyConfigSchema } from '../forms/auto-form'
import { TradingSymbolSelector } from '../expansions/trading-symbol-selector'
import { ProgressWithValue } from '../../expansions/progress-with-value'

// Import enhanced clients
import { enhancedBackendClient } from '@/lib/api/enhanced-backend-client'
import { premiumWebSocketClient, ConnectionState } from '@/lib/websocket/premium-websocket'
import { cn } from '@/lib/utils'

// ===== PRESERVED TYPES FROM ORIGINAL =====

type AgentType = 'darvas' | 'elliott' | 'alligator' | 'adx' | 'renko'
type AgentStatus = 'active' | 'inactive' | 'analyzing' | 'error' | 'optimizing'

interface ExpertAgent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  description: string
  version: string
  symbols: string[]
  parameters: Record<string, any>
  performance: {
    totalSignals: number
    accurateSignals: number
    accuracy: number
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    lastSignal: Date | null
  }
  analysis: {
    currentSignal: 'buy' | 'sell' | 'hold' | null
    confidence: number
    reasoning: string
    technicalIndicators: Record<string, number>
    timeframe: string
  }
  goals: string[]
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  createdAt: Date
  lastActive: Date
  executionPriority: number
}

interface AgentDecision {
  id: string
  agentId: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  technicalData: Record<string, any>
  timestamp: Date
  executed: boolean
}

interface AgentCoordination {
  symbol: string
  decisions: AgentDecision[]
  consensus: 'buy' | 'sell' | 'hold' | 'conflict'
  confidence: number
  reasoning: string
}

// ===== AGENT CONFIGURATIONS =====

const AGENT_TYPES: Record<AgentType, {
  name: string
  description: string
  icon: React.ReactNode
  color: string
  defaultParams: Record<string, any>
}> = {
  darvas: {
    name: 'Darvas Box Agent',
    description: 'Advanced pattern recognition for box breakouts and consolidation patterns',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultParams: {
      boxPeriod: 55,
      volumeThreshold: 1.5,
      breakoutConfirmation: 2,
      stopLossPercent: 8
    }
  },
  elliott: {
    name: 'Elliott Wave Agent',
    description: 'Wave analysis and impulse/corrective pattern identification',
    icon: <LineChart className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    defaultParams: {
      waveDegree: 'primary',
      fibonacciLevels: [0.236, 0.382, 0.618, 0.786],
      confirmationCandles: 3,
      trendStrength: 0.7
    }
  },
  alligator: {
    name: 'Williams Alligator Agent',
    description: 'Trend detection using Bill Williams Alligator indicator system',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultParams: {
      jawPeriod: 13,
      teethPeriod: 8,
      lipsPeriod: 5,
      smoothing: 'SMMA',
      alertThreshold: 0.1
    }
  },
  adx: {
    name: 'ADX Momentum Agent',
    description: 'Momentum analysis using Average Directional Index and trend strength',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    defaultParams: {
      adxPeriod: 14,
      diPeriod: 14,
      strongTrend: 25,
      veryStrongTrend: 50,
      smoothing: 'RMA'
    }
  },
  renko: {
    name: 'Renko Pattern Agent',
    description: 'Brick pattern analysis for noise-filtered trend identification',
    icon: <PieChart className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 border-red-200',
    defaultParams: {
      brickSize: 'atr',
      atrPeriod: 14,
      reversalBricks: 3,
      confirmationBricks: 2,
      filterNoise: true
    }
  }
}

// ===== ENHANCED EXPERT AGENTS COMPONENT =====

export function EnhancedExpertAgents() {
  // ===== PRESERVED STATE FROM ORIGINAL =====
  const [agents, setAgents] = useState<ExpertAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<ExpertAgent | null>(null)
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([])
  const [coordination, setCoordination] = useState<AgentCoordination[]>([])
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [isLoading, setIsLoading] = useState(false)

  // ===== PREMIUM ENHANCEMENTS =====
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTCUSD', 'ETHUSD'])
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [agentPerformanceData, setAgentPerformanceData] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<'overview' | 'agents' | 'decisions' | 'coordination'>('overview')
  const [sortableAgents, setSortableAgents] = useState<any[]>([])

  // ===== PRESERVED WEBSOCKET INTEGRATION =====
  useEffect(() => {
    premiumWebSocketClient.onStateChange(setConnectionState)
    premiumWebSocketClient.connect().catch(console.error)

    return () => {
      premiumWebSocketClient.offStateChange(setConnectionState)
    }
  }, [])

  useEffect(() => {
    const handleAgentUpdate = (data: any) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.id ? { ...agent, ...data, lastActive: new Date() } : agent
      ))
    }

    const handleAgentDecision = (data: any) => {
      setAgentDecisions(prev => [data, ...prev.slice(0, 99)]) // Keep last 100 decisions
    }

    const handleCoordinationUpdate = (data: any) => {
      setCoordination(prev => {
        const updated = [...prev]
        const index = updated.findIndex(coord => coord.symbol === data.symbol)
        if (index >= 0) {
          updated[index] = data
        } else {
          updated.push(data)
        }
        return updated
      })
    }

    const handleAgentStatus = (data: any) => {
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentId ? { ...agent, status: data.status } : agent
      ))
    }

    premiumWebSocketClient.on('agent_update', handleAgentUpdate)
    premiumWebSocketClient.on('agent_decision', handleAgentDecision)
    premiumWebSocketClient.on('agent_coordination', handleCoordinationUpdate)
    premiumWebSocketClient.on('agent_status', handleAgentStatus)

    return () => {
      premiumWebSocketClient.off('agent_update', handleAgentUpdate)
      premiumWebSocketClient.off('agent_decision', handleAgentDecision)
      premiumWebSocketClient.off('agent_coordination', handleCoordinationUpdate)
      premiumWebSocketClient.off('agent_status', handleAgentStatus)
    }
  }, [])

  // ===== PRESERVED API INTEGRATION =====
  const loadAgentData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [agentsData, decisionsData, statusData] = await Promise.all([
        enhancedBackendClient.getExpertAgents(),
        enhancedBackendClient.getAgentDecisions(),
        enhancedBackendClient.getAgentStatus()
      ])

      setAgents(agentsData)
      setAgentDecisions(decisionsData)

      // Convert to sortable format for premium components
      const sortableData = agentsData.map((agent: ExpertAgent, index: number) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        priority: agent.riskProfile === 'aggressive' ? 'high' : agent.riskProfile === 'moderate' ? 'medium' : 'low',
        allocatedCapital: 10000, // Default allocation
        currentPnl: agent.performance.totalReturn,
        totalTrades: agent.performance.totalSignals,
        winRate: agent.performance.accuracy,
        lastExecuted: agent.lastActive,
        order: agent.executionPriority || index
      }))
      setSortableAgents(sortableData)

    } catch (error) {
      console.error('Failed to load agent data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAgentData()
  }, [loadAgentData])

  // ===== PRESERVED AGENT OPERATIONS =====
  const handleStartAgent = useCallback(async (agentId: string) => {
    try {
      await enhancedBackendClient.startAgent(agentId)
      premiumWebSocketClient.sendAgentCommand(agentId, 'start')
      await loadAgentData()
    } catch (error) {
      console.error('Failed to start agent:', error)
    }
  }, [loadAgentData])

  const handleStopAgent = useCallback(async (agentId: string) => {
    try {
      await enhancedBackendClient.stopAgent(agentId)
      premiumWebSocketClient.sendAgentCommand(agentId, 'stop')
      await loadAgentData()
    } catch (error) {
      console.error('Failed to stop agent:', error)
    }
  }, [loadAgentData])

  const handleAnalyzeSymbol = useCallback(async (agentId: string, symbol: string) => {
    try {
      const result = await enhancedBackendClient.analyzeSymbolWithAgent(agentId, symbol)
      premiumWebSocketClient.sendAgentCommand(agentId, 'analyze', { symbol })
      return result
    } catch (error) {
      console.error('Failed to analyze symbol:', error)
    }
  }, [])

  const handleOptimizeAgent = useCallback(async (agentId: string, params: any) => {
    try {
      await enhancedBackendClient.optimizeExpertAgent(agentId, params)
      await loadAgentData()
    } catch (error) {
      console.error('Failed to optimize agent:', error)
    }
  }, [loadAgentData])

  // ===== AGENT CREATION =====
  const handleCreateAgent = useCallback(async (agentData: any) => {
    try {
      setIsLoading(true)
      const newAgent = await enhancedBackendClient.createExpertAgent({
        ...agentData,
        symbols: selectedSymbols,
        type: agentData.agentType,
        parameters: AGENT_TYPES[agentData.agentType as AgentType].defaultParams
      })
      await loadAgentData()
      setShowCreateAgent(false)
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSymbols, loadAgentData])

  // ===== COORDINATION LOGIC =====
  const analyzeAllAgents = useCallback(async () => {
    if (selectedSymbols.length === 0) return

    setIsLoading(true)
    try {
      for (const symbol of selectedSymbols) {
        for (const agent of agents.filter(a => a.status === 'active')) {
          await handleAnalyzeSymbol(agent.id, symbol)
        }
      }
    } catch (error) {
      console.error('Failed to analyze with all agents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSymbols, agents, handleAnalyzeSymbol])

  // ===== UTILITY FUNCTIONS =====
  const getAgentStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'analyzing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'optimizing': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAgentStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'analyzing': return <Activity className="h-3 w-3 animate-pulse" />
      case 'optimizing': return <Settings className="h-3 w-3 animate-spin" />
      case 'error': return <AlertTriangle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // ===== TABLE COLUMNS =====
  const agentColumns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Agent',
      cell: ({ row }: any) => {
        const agent = agents.find(a => a.name === row.getValue('name'))
        const agentType = AGENT_TYPES[agent?.type as AgentType]
        return (
          <div className="flex items-center space-x-2">
            {agentType?.icon}
            <div>
              <div className="font-medium">{row.getValue('name')}</div>
              <div className="text-xs text-muted-foreground">{agentType?.name}</div>
            </div>
          </div>
        )
      },
    },
    createStatusColumn('status', 'Status'),
    {
      accessorKey: 'symbols',
      header: 'Symbols',
      cell: ({ row }: any) => {
        const agent = agents.find(a => a.name === row.getValue('name'))
        return (
          <div className="flex flex-wrap gap-1">
            {agent?.symbols.slice(0, 3).map(symbol => (
              <Badge key={symbol} variant="outline" className="text-xs">
                {symbol}
              </Badge>
            ))}
            {agent && agent.symbols.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{agent.symbols.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'accuracy',
      header: 'Accuracy',
      cell: ({ row }: any) => {
        const agent = agents.find(a => a.name === row.getValue('name'))
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium">{agent?.performance.accuracy.toFixed(1)}%</span>
            <Progress value={agent?.performance.accuracy || 0} className="h-1" />
          </div>
        )
      },
    },
    createChangeColumn('totalReturn', 'Return'),
    {
      accessorKey: 'totalSignals',
      header: 'Signals',
      cell: ({ row }: any) => {
        const agent = agents.find(a => a.name === row.getValue('name'))
        return (
          <span className="font-mono">{agent?.performance.totalSignals || 0}</span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const agent = agents.find(a => a.name === row.getValue('name'))
        if (!agent) return null

        return (
          <div className="flex items-center space-x-1">
            {agent.status === 'active' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStopAgent(agent.id)}
              >
                <Pause className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartAgent(agent.id)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedAgent(agent)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
  ], [agents, handleStartAgent, handleStopAgent])

  const decisionColumns = useMemo(() => [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }: any) => (
        <span className="text-xs font-mono">
          {new Date(row.getValue('timestamp')).toLocaleTimeString()}
        </span>
      ),
    },
    {
      accessorKey: 'agentId',
      header: 'Agent',
      cell: ({ row }: any) => {
        const agent = agents.find(a => a.id === row.getValue('agentId'))
        return (
          <span className="text-sm font-medium">{agent?.name || 'Unknown'}</span>
        )
      },
    },
    {
      accessorKey: 'symbol',
      header: 'Symbol',
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: any) => {
        const action = row.getValue('action')
        const colors = {
          buy: 'bg-green-100 text-green-800',
          sell: 'bg-red-100 text-red-800',
          hold: 'bg-gray-100 text-gray-800'
        }
        return (
          <Badge className={colors[action as keyof typeof colors]}>
            {action}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'confidence',
      header: 'Confidence',
      cell: ({ row }: any) => {
        const confidence = row.getValue('confidence')
        return (
          <div className="space-y-1">
            <span className="text-sm">{confidence.toFixed(0)}%</span>
            <Progress value={confidence} className="h-1" />
          </div>
        )
      },
    },
    {
      accessorKey: 'reasoning',
      header: 'Reasoning',
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground truncate max-w-32">
          {row.getValue('reasoning')}
        </span>
      ),
    },
  ], [agents])

  return (
    <div className="w-full space-y-6">
      {/* ===== ENHANCED HEADER ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Enhanced Expert Agents
              </CardTitle>
              <CardDescription>
                AI-powered trading agents with advanced pattern recognition and coordination
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateAgent(true)}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={analyzeAllAgents}
                disabled={isLoading || agents.filter(a => a.status === 'active').length === 0}
              >
                <Zap className="h-4 w-4 mr-2" />
                Analyze All
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={loadAgentData}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ===== SYMBOL SELECTION ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Symbol Analysis</CardTitle>
          <CardDescription>
            Select symbols for agent analysis and coordination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradingSymbolSelector
            value={selectedSymbols}
            onValueChange={setSelectedSymbols}
            maxSelected={10}
            showPrices={true}
            showCategories={true}
          />
        </CardContent>
      </Card>

      {/* ===== AGENT CREATION FORM ===== */}
      {showCreateAgent && (
        <Card>
          <CardHeader>
            <CardTitle>Create Expert Agent</CardTitle>
            <CardDescription>
              Configure a new AI trading agent with specialized analysis capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoForm
              schema={StrategyConfigSchema.extend({
                agentType: z.enum(['darvas', 'elliott', 'alligator', 'adx', 'renko'])
              })}
              onSubmit={handleCreateAgent}
              fieldConfig={{
                name: {
                  orderIndex: 1,
                  description: 'Unique name for the agent'
                },
                agentType: {
                  orderIndex: 2,
                  fieldType: 'select',
                  options: Object.entries(AGENT_TYPES).map(([key, value]) => ({
                    label: value.name,
                    value: key
                  })),
                  description: 'Type of analysis the agent will perform'
                },
                description: {
                  orderIndex: 3,
                  fieldType: 'textarea',
                  description: 'Description of the agent\'s purpose and strategy'
                },
                riskPerTrade: {
                  orderIndex: 4,
                  fieldType: 'percentage',
                  description: 'Risk percentage per trade signal'
                }
              }}
              submitText="Create Agent"
              isLoading={isLoading}
            />
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateAgent(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== MAIN AGENT INTERFACE ===== */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <div className="text-sm text-muted-foreground">
                  {agents.filter(a => a.status === 'active').length} active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agents.length > 0 
                    ? (agents.reduce((sum, a) => sum + a.performance.accuracy, 0) / agents.length).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <div className="text-sm text-muted-foreground">
                  All agents combined
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agents.reduce((sum, a) => sum + a.performance.totalSignals, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Generated today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Coordination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{coordination.length}</div>
                <div className="text-sm text-muted-foreground">
                  Active symbols
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Types Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(AGENT_TYPES).map(([type, config]) => {
              const agentCount = agents.filter(a => a.type === type).length
              const activeCount = agents.filter(a => a.type === type && a.status === 'active').length
              
              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {config.icon}
                      {config.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Agents:</span>
                        <span className="font-medium">{agentCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active:</span>
                        <span className="font-medium text-green-600">{activeCount}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {config.description}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <StrategySortable
            strategies={sortableAgents}
            onStrategiesChange={setSortableAgents}
            onStartStrategy={handleStartAgent}
            onPauseStrategy={handleStopAgent}
            onStopStrategy={handleStopAgent}
            showPerformanceMetrics={true}
            options={{
              persistOrder: true,
              animationPreset: 'smooth'
            }}
          />
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Agent Decisions</CardTitle>
              <CardDescription>
                Real-time trading signals and analysis from all agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                data={agentDecisions}
                columns={decisionColumns}
                searchable={true}
                filterable={true}
                exportable={true}
                realTime={true}
                pageSize={20}
                emptyMessage="No agent decisions available"
                title="Trading Decisions"
                description={`${agentDecisions.length} recent decisions`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coordination Tab */}
        <TabsContent value="coordination" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordination.map((coord) => (
              <Card key={coord.symbol}>
                <CardHeader>
                  <CardTitle className="text-lg">{coord.symbol}</CardTitle>
                  <CardDescription>
                    {coord.decisions.length} agent decision{coord.decisions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Consensus:</span>
                    <Badge className={
                      coord.consensus === 'buy' ? 'bg-green-100 text-green-800' :
                      coord.consensus === 'sell' ? 'bg-red-100 text-red-800' :
                      coord.consensus === 'conflict' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {coord.consensus}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Confidence:</span>
                      <span>{coord.confidence.toFixed(0)}%</span>
                    </div>
                    <ProgressWithValue
                      value={coord.confidence}
                      max={100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Agent Decisions:</div>
                    {coord.decisions.slice(0, 3).map((decision) => {
                      const agent = agents.find(a => a.id === decision.agentId)
                      return (
                        <div key={decision.id} className="flex justify-between text-xs">
                          <span>{agent?.name || 'Unknown'}</span>
                          <Badge 
                            variant="outline" 
                            className={
                              decision.action === 'buy' ? 'text-green-600' :
                              decision.action === 'sell' ? 'text-red-600' :
                              'text-gray-600'
                            }
                          >
                            {decision.action}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>

                  {coord.reasoning && (
                    <div>
                      <div className="text-sm font-medium mb-1">Reasoning:</div>
                      <div className="text-xs text-muted-foreground">
                        {coord.reasoning}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {coordination.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No coordination data available. Start agents and analyze symbols to see coordination.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== CONNECTION STATUS ALERT ===== */}
      {connectionState !== ConnectionState.CONNECTED && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Real-time agent updates are not available. Connection status: {connectionState}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default EnhancedExpertAgents