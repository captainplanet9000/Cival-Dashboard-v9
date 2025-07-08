'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot, Settings, TrendingUp, Activity, Brain, Zap, Shield, Target, 
  DollarSign, RefreshCw, Plus, Play, Pause, StopCircle, Trash2,
  BarChart3, PieChart, LineChart, Users, MessageSquare, Globe,
  Layers, Database, Server, Key, Lock, Award, Star, Timer,
  ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'

// Import existing components that we'll integrate
import { useDashboardConnection } from './DashboardTabConnector'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'
import { enhancedAgentCreationService } from '@/lib/agents/enhanced-agent-creation-service'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'
import { strategyService } from '@/lib/supabase/strategy-service'
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'
import { useRealTimeAgentData } from '@/hooks/useRealTimeAgentData'
import { supabaseAgentsService } from '@/lib/services/supabase-agents-service'
import { toast } from 'react-hot-toast'

// Import strategy components
import { StrategyExecutionEngine } from '@/components/strategies/StrategyExecutionEngine'
import { HighFrequencyTradingEngine } from '@/components/trading/HighFrequencyTradingEngine'
import { OrderManagementSystem } from '@/components/trading/OrderManagementSystem'

// Import AI provider components
import { AIProviderIntegrationHub } from '@/components/ai-providers/AIProviderIntegrationHub'
import { MultiLLMDecisionEngine } from '@/components/ai-providers/MultiLLMDecisionEngine'
import { AIModelComparisonDashboard } from '@/components/ai-providers/AIModelComparisonDashboard'

// Import advanced components
import { BlockchainTradingInfrastructure } from '@/components/blockchain/BlockchainTradingInfrastructure'
import { DeFiProtocolIntegrationHub } from '@/components/defi/DeFiProtocolIntegrationHub'
import { CrossChainTradingCapabilities } from '@/components/cross-chain/CrossChainTradingCapabilities'
import { AutonomousFarmCoordination } from '@/components/farm-coordination/AutonomousFarmCoordination'
import { MultiAgentCommunicationProtocol } from '@/components/communication/MultiAgentCommunicationProtocol'
import { DistributedDecisionMakingSystem } from '@/components/distributed/DistributedDecisionMakingSystem'

// Import memory and learning components
import { AgentMemorySystem } from '@/components/agents/AgentMemorySystem'
import { AgentLearningEngine } from '@/components/agents/AgentLearningEngine'
import { AgentPerformanceAnalytics } from '@/components/agents/AgentPerformanceAnalytics'

// Import comprehensive agent creation component
import { ComprehensiveAgentCreation } from '@/components/agents/ComprehensiveAgentCreation'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'

// Import enhanced control center
import { EnhancedAgentControlCenter } from './EnhancedAgentControlCenter'

/**
 * Comprehensive Agents Tab - Unified agent management interface
 * Consolidates all agent-related functionality into 6 logical sections
 */

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

export function ComprehensiveAgentsTab({ className }: { className?: string }) {
  // State management
  const [currentSection, setCurrentSection] = useState('control-center')
  const [agents, setAgents] = useState<Agent[]>([])
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    totalCapital: 0,
    totalPnL: 0,
    avgWinRate: 0,
    totalTrades: 0
  })
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connected')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Hooks
  const sharedData = useSharedRealtimeData()
  const { isConnected, isSubscribed } = useDashboardConnection()
  const { agentData, loading: agentDataLoading } = useRealTimeAgentData()

  // Load initial data
  useEffect(() => {
    loadAgentData()
  }, [refreshTrigger])

  const loadAgentData = async () => {
    setLoading(true)
    try {
      // Load agents from various sources
      const persistentAgents = await persistentAgentService.getAllAgents()
      const enhancedAgents = await enhancedAgentCreationService.getAllAgents()
      
      // Combine and format agent data
      const allAgents = [
        ...persistentAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type || 'Standard',
          strategy: agent.strategy || 'Unknown',
          status: agent.status as 'active' | 'idle' | 'error' | 'stopped',
          capital: agent.capital || 10000,
          currentValue: agent.currentValue || agent.capital || 10000,
          pnl: (agent.currentValue || agent.capital || 10000) - (agent.capital || 10000),
          winRate: agent.winRate || 0,
          totalTrades: agent.totalTrades || 0,
          lastActive: new Date(agent.lastActive || Date.now()),
          createdAt: new Date(agent.createdAt || Date.now()),
          config: agent.config || {}
        })),
        ...enhancedAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: 'Enhanced',
          strategy: agent.strategy || 'Advanced',
          status: agent.status as 'active' | 'idle' | 'error' | 'stopped',
          capital: agent.initialCapital || 10000,
          currentValue: agent.performance?.totalValue || agent.initialCapital || 10000,
          pnl: (agent.performance?.totalPnL || 0),
          winRate: agent.performance?.winRate || 0,
          totalTrades: agent.performance?.totalTrades || 0,
          lastActive: new Date(agent.lastActivity || Date.now()),
          createdAt: new Date(agent.createdAt || Date.now()),
          config: agent.config || {}
        }))
      ]

      setAgents(allAgents)

      // Calculate metrics
      const totalAgents = allAgents.length
      const activeAgents = allAgents.filter(a => a.status === 'active').length
      const totalCapital = allAgents.reduce((sum, a) => sum + a.capital, 0)
      const totalPnL = allAgents.reduce((sum, a) => sum + a.pnl, 0)
      const avgWinRate = totalAgents > 0 ? allAgents.reduce((sum, a) => sum + a.winRate, 0) / totalAgents : 0
      const totalTrades = allAgents.reduce((sum, a) => sum + a.totalTrades, 0)

      setMetrics({
        totalAgents,
        activeAgents,
        totalCapital,
        totalPnL,
        avgWinRate,
        totalTrades
      })

    } catch (error) {
      console.error('Error loading agent data:', error)
      toast.error('Failed to load agent data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
    toast.success('Agent data refreshed')
  }

  // Main sections configuration
  const sections = [
    {
      id: 'control-center',
      label: 'Control Center',
      icon: Bot,
      description: 'Agent overview and real-time monitoring'
    },
    {
      id: 'creation-management',
      label: 'Create & Manage',
      icon: Plus,
      description: 'Create and manage agents'
    },
    {
      id: 'strategy-hub',
      label: 'Strategy Hub',
      icon: Brain,
      description: 'Strategy builder and management'
    },
    {
      id: 'trading-ops',
      label: 'Trading Ops',
      icon: Zap,
      description: 'HFT engine and order management'
    },
    {
      id: 'ai-intelligence',
      label: 'AI Intelligence',
      icon: Brain,
      description: 'Multi-LLM and learning systems'
    },
    {
      id: 'advanced-features',
      label: 'Advanced',
      icon: Settings,
      description: 'Blockchain and farm coordination'
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Comprehensive Agent Management
              <Badge variant="secondary" className="text-xs">All-in-One</Badge>
            </CardTitle>
            <CardDescription>
              {metrics.activeAgents} active • {metrics.totalAgents} total • 
              ${metrics.totalCapital.toLocaleString()} capital • 
              ${metrics.totalPnL.toFixed(2)} P&L
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "secondary"} 
              className={`text-xs ${isConnected ? 'bg-green-100 text-green-800' : ''}`}
            >
              {isConnected ? '🟢 Connected' : '🟡 Offline'}
            </Badge>
            <Badge 
              variant={isSubscribed ? "default" : "secondary"} 
              className={`text-xs ${isSubscribed ? 'bg-blue-100 text-blue-800' : ''}`}
            >
              {isSubscribed ? '🔄 Live' : '📴 Static'}
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <AnimatedPrice value={metrics.totalPnL} prefix="$" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter value={metrics.avgWinRate} suffix="%" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedCounter value={metrics.activeAgents} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                <AnimatedCounter value={metrics.totalTrades} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Section Navigation */}
        <Tabs value={currentSection} onValueChange={setCurrentSection} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Agent Control Center */}
          <TabsContent value="control-center" className="mt-6">
            <EnhancedAgentControlCenter 
              agents={agents}
              metrics={metrics}
              onRefresh={refreshData}
              loading={loading}
              onNavigateToCreate={() => setCurrentSection('creation-management')}
            />
          </TabsContent>

          {/* Agent Creation & Management */}
          <TabsContent value="creation-management" className="mt-6">
            <AgentCreationManagement 
              agents={agents}
              onAgentCreated={refreshData}
              onAgentUpdated={refreshData}
            />
          </TabsContent>

          {/* Strategy Hub */}
          <TabsContent value="strategy-hub" className="mt-6">
            <StrategyHub 
              agents={agents}
              onStrategyDeployed={refreshData}
            />
          </TabsContent>

          {/* Trading Operations */}
          <TabsContent value="trading-ops" className="mt-6">
            <TradingOperations 
              agents={agents}
              metrics={metrics}
            />
          </TabsContent>

          {/* AI Intelligence */}
          <TabsContent value="ai-intelligence" className="mt-6">
            <AIIntelligence 
              agents={agents}
              onUpdate={refreshData}
            />
          </TabsContent>

          {/* Advanced Features */}
          <TabsContent value="advanced-features" className="mt-6">
            <AdvancedFeatures 
              agents={agents}
              onUpdate={refreshData}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Enhanced Agent Control Center Component - Central hub for all agent operations
function AgentControlCenter({ 
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
      {/* Bulk Actions */}
      {selectedAgents.length > 0 && (
        <Card>
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

      {agents.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Agents Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first agent to get started with automated trading
              </p>
              <Button onClick={onNavigateToCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Agent Creation & Management Section
function AgentCreationManagement({ 
  agents, 
  onAgentCreated, 
  onAgentUpdated 
}: { 
  agents: Agent[]
  onAgentCreated: () => void
  onAgentUpdated: () => void
}) {
  const [activeTab, setActiveTab] = useState('create')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create New Agent</TabsTrigger>
          <TabsTrigger value="manage">Manage Existing</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <ComprehensiveAgentCreation
            onAgentCreated={() => {
              onAgentCreated()
              setActiveTab('manage') // Switch to management tab to see the new agent
              toast.success('Agent created and ready for management!')
            }}
          />
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <AgentManagementPanel 
            agents={agents}
            onAgentSelected={setSelectedAgent}
            onAgentUpdated={onAgentUpdated}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <AgentTemplatesPanel
            onTemplateSelected={(template) => {
              // Switch to create tab with template pre-filled
              setActiveTab('create')
              toast.success(`Template "${template.name}" loaded`)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Agent Management Panel
function AgentManagementPanel({ 
  agents, 
  onAgentSelected, 
  onAgentUpdated 
}: {
  agents: Agent[]
  onAgentSelected: (agent: Agent) => void
  onAgentUpdated: () => void
}) {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredAgents = agents.filter(agent => {
    const matchesName = agent.name.toLowerCase().includes(filter.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
    return matchesName && matchesStatus
  })

  const deleteAgent = async (agentId: string) => {
    try {
      await persistentAgentService.deleteAgent(agentId)
      toast.success('Agent deleted successfully')
      onAgentUpdated()
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast.error('Failed to delete agent')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search agents..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent List */}
      <div className="space-y-3">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{agent.type}</Badge>
                      <Badge variant={
                        agent.status === 'active' ? 'default' :
                        agent.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {agent.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {agent.strategy}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <div className={`font-semibold ${agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${agent.pnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {agent.winRate.toFixed(1)}% WR
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAgentSelected(agent)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-8">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Agents Found</h3>
          <p className="text-muted-foreground">
            {filter || statusFilter !== 'all' 
              ? 'No agents match your current filters' 
              : 'Create your first agent to get started'
            }
          </p>
        </div>
      )}
    </div>
  )
}

// Agent Templates Panel
function AgentTemplatesPanel({ 
  onTemplateSelected 
}: {
  onTemplateSelected: (template: any) => void
}) {
  const templates = [
    {
      id: 'conservative_trader',
      name: 'Conservative Trader',
      description: 'Low-risk trading with capital preservation focus',
      config: {
        riskLevel: 'low',
        maxDrawdown: 5,
        positionSize: 2,
        strategy: 'bollinger_reversion',
        enableMemory: true,
        enableLearning: false
      }
    },
    {
      id: 'momentum_hunter',
      name: 'Momentum Hunter',
      description: 'Aggressive momentum trading for high returns',
      config: {
        riskLevel: 'high',
        maxDrawdown: 20,
        positionSize: 10,
        strategy: 'momentum_rsi',
        enableMemory: true,
        enableLearning: true
      }
    },
    {
      id: 'scalper_pro',
      name: 'HFT Scalper Pro',
      description: 'High-frequency scalping with advanced features',
      config: {
        type: 'hft',
        riskLevel: 'medium',
        maxDrawdown: 8,
        positionSize: 5,
        strategy: 'hft_scalping',
        enableHFT: true,
        enableMemory: true
      }
    },
    {
      id: 'defi_yield_farmer',
      name: 'DeFi Yield Farmer',
      description: 'Automated DeFi yield farming and optimization',
      config: {
        type: 'defi',
        riskLevel: 'medium',
        strategy: 'yield_optimization',
        enableDeFi: true,
        enableBlockchain: true,
        enableCrossChain: true
      }
    },
    {
      id: 'arbitrage_master',
      name: 'Arbitrage Master',
      description: 'Cross-exchange arbitrage opportunities',
      config: {
        type: 'arbitrage',
        riskLevel: 'low',
        strategy: 'arbitrage_triangular',
        enableCommunication: true,
        coordinationLevel: 'advanced'
      }
    },
    {
      id: 'ai_ensemble',
      name: 'AI Ensemble Trader',
      description: 'Multi-LLM consensus trading with advanced AI',
      config: {
        type: 'enhanced',
        aiProvider: 'multi_llm',
        enableMemory: true,
        enableLearning: true,
        enableCommunication: true,
        coordinationLevel: 'distributed'
      }
    }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onTemplateSelected(template)}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {template.name}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <Badge variant={
                    template.config.riskLevel === 'low' ? 'secondary' :
                    template.config.riskLevel === 'medium' ? 'default' : 'destructive'
                  }>
                    {template.config.riskLevel}
                  </Badge>
                </div>
                {template.config.strategy && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Strategy:</span>
                    <span className="text-xs">{template.config.strategy}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.config.enableMemory && <Badge variant="outline" className="text-xs">Memory</Badge>}
                  {template.config.enableLearning && <Badge variant="outline" className="text-xs">Learning</Badge>}
                  {template.config.enableHFT && <Badge variant="outline" className="text-xs">HFT</Badge>}
                  {template.config.enableDeFi && <Badge variant="outline" className="text-xs">DeFi</Badge>}
                  {template.config.enableBlockchain && <Badge variant="outline" className="text-xs">Blockchain</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StrategyHub({ agents, onStrategyDeployed }: any) {
  return (
    <div className="space-y-6">
      <StrategyExecutionEngine />
    </div>
  )
}

function TradingOperations({ 
  agents, 
  metrics 
}: { 
  agents: Agent[]
  metrics: AgentMetrics
}) {
  const [activeOperationsTab, setActiveOperationsTab] = useState('overview')
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Trading Operations Center
          </CardTitle>
          <CardDescription>
            High-frequency trading engine and order management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeOperationsTab} onValueChange={setActiveOperationsTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hft">HFT Engine</TabsTrigger>
              <TabsTrigger value="orders">Order Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <TradingOperationsOverview agents={agents} metrics={metrics} />
            </TabsContent>
            
            <TabsContent value="hft" className="mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>High-Frequency Trading Engine</CardTitle>
                    <CardDescription>Sub-20ms execution latency trading system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HighFrequencyTradingEngine />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Management System</CardTitle>
                    <CardDescription>Real-time order execution and management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OrderManagementSystem />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Trading Operations Overview Component
function TradingOperationsOverview({ 
  agents, 
  metrics 
}: { 
  agents: Agent[]
  metrics: AgentMetrics
}) {
  const activeTraders = agents.filter(a => a.status === 'active').length
  const hftAgents = agents.filter(a => a.type === 'hft').length
  const totalOrders = agents.reduce((sum, a) => sum + a.totalTrades, 0)
  
  return (
    <div className="space-y-6">
      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Traders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={activeTraders} />
            </div>
            <p className="text-xs text-muted-foreground">Currently trading</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">HFT Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={hftAgents} />
            </div>
            <p className="text-xs text-muted-foreground">High-frequency traders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={totalOrders} />
            </div>
            <p className="text-xs text-muted-foreground">Orders executed</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Trading Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.slice(0, 5).map((agent, index) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">{agent.strategy}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${agent.pnl.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">{agent.totalTrades} trades</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AIIntelligence({ agents, onUpdate }: any) {
  return (
    <div className="space-y-6">
      <AIProviderIntegrationHub />
      <MultiLLMDecisionEngine />
      <AIModelComparisonDashboard />
      <AgentMemorySystem />
      <AgentLearningEngine />
      <AgentPerformanceAnalytics />
    </div>
  )
}

function AdvancedFeatures({ agents, onUpdate }: any) {
  return (
    <div className="space-y-6">
      <BlockchainTradingInfrastructure />
      <DeFiProtocolIntegrationHub />
      <CrossChainTradingCapabilities />
      <AutonomousFarmCoordination />
      <MultiAgentCommunicationProtocol />
      <DistributedDecisionMakingSystem />
    </div>
  )
}

export default ComprehensiveAgentsTab