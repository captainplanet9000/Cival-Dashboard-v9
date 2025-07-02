'use client'

import React, { useState } from 'react'
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
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import {
  Bot, Plus, Play, Pause, Trash2, Settings, TrendingUp, 
  Activity, Brain, Zap, Shield, Target, DollarSign, RefreshCw
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { toast } from 'react-hot-toast'
import RealAgentManagement from '@/components/agents/RealAgentManagement'
import RealAgentCreation from '@/components/agents/RealAgentCreation'
import { motion, AnimatePresence } from 'framer-motion'
import MemoryAnalyticsDashboard from './MemoryAnalyticsDashboard'
import { useAgentRealtime } from '@/hooks/use-agent-realtime'
import { usePaperTradingRealtime } from '@/hooks/use-paper-trading-realtime'

// Import autonomous agent creation service
import { enhancedAgentCreationService } from '@/lib/agents/enhanced-agent-creation-service'

// Agent Overview Panel showing expert agents
function AgentOverviewPanel({ agentPerformance }: { agentPerformance: Map<string, any> }) {
  const { createAgent } = useAgentRealtime()
  const expertAgents = [
    { id: 'momentum', name: 'Momentum Master', strategy: 'Trend Following', expertise: 'Catches strong market trends' },
    { id: 'mean_reversion', name: 'Mean Reversion Pro', strategy: 'Counter-Trend', expertise: 'Profits from overextensions' },
    { id: 'arbitrage', name: 'Arbitrage Hunter', strategy: 'Market Neutral', expertise: 'Exploits price discrepancies' },
    { id: 'scalper', name: 'Scalping Expert', strategy: 'High Frequency', expertise: 'Quick small profits' },
    { id: 'swing', name: 'Swing Trader', strategy: 'Position Trading', expertise: 'Multi-day positions' }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Expert Trading Agents</h3>
        <p className="text-sm text-muted-foreground">Pre-configured agents with proven strategies</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expertAgents.map((expert) => {
          const agentData = Array.from(agentPerformance.values()).find(
            a => a.name.toLowerCase().includes(expert.id)
          )
          
          return (
            <Card key={expert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{expert.name}</CardTitle>
                    <CardDescription>{expert.strategy}</CardDescription>
                  </div>
                  <Badge variant={agentData?.status === 'active' ? 'default' : 'secondary'}>
                    {agentData?.status || 'Not Deployed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{expert.expertise}</p>
                
                {agentData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Portfolio Value</span>
                      <span className="font-medium">${agentData.portfolioValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">P&L</span>
                      <span className={`font-medium ${agentData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {agentData.pnl >= 0 ? '+' : ''}{agentData.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-medium">{agentData.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trades</span>
                      <span className="font-medium">{agentData.tradeCount}</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={async () => {
                      const agentId = await createAgent({
                        name: expert.name,
                        strategy: expert.id,
                        initialCapital: 10000,
                        riskLimits: {
                          maxPositionSize: 5,
                          maxDailyLoss: 500,
                          stopLossEnabled: true,
                          takeProfitEnabled: true
                        },
                        parameters: {
                          riskPerTrade: 0.02,
                          maxPositions: 5,
                          stopLoss: 0.05,
                          takeProfit: 0.1
                        }
                      })
                      if (agentId) {
                        toast.success(`${expert.name} deployed successfully`)
                      } else {
                        toast.error(`Failed to deploy ${expert.name}`)
                      }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Deploy Agent
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Agent Performance Panel
function AgentPerformancePanel({ agentPerformance }: { agentPerformance: Map<string, any> }) {
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'trades'>('pnl')
  
  const sortedAgents = Array.from(agentPerformance.values()).sort((a, b) => {
    switch (sortBy) {
      case 'pnl': return b.pnl - a.pnl
      case 'winRate': return b.winRate - a.winRate
      case 'trades': return b.tradeCount - a.tradeCount
      default: return 0
    }
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agent Performance Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Real-time performance tracking</p>
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pnl">P&L</SelectItem>
            <SelectItem value="winRate">Win Rate</SelectItem>
            <SelectItem value="trades">Trades</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        {sortedAgents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No agents deployed yet</p>
              <p className="text-sm text-muted-foreground">Create or deploy agents to see performance</p>
            </CardContent>
          </Card>
        ) : (
          sortedAgents.map((agent, index) => (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100' : 
                          index === 1 ? 'bg-gray-100' :
                          index === 2 ? 'bg-orange-100' : 'bg-gray-50'
                        }`}>
                          <span className="font-bold text-lg">{index + 1}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        } animate-pulse`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{agent.name}</h4>
                          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${agent.portfolioValue.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {agent.tradeCount} trades
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {agent.winRate.toFixed(1)}% win rate
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {agent.pnl >= 0 ? '+' : ''}{agent.pnl.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((agent.pnl / 10000) * 100).toFixed(2)}% return
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Progress 
                      value={Math.min((agent.portfolioValue / 10000) * 100, 200)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// Trading Strategies Panel
function TradingStrategiesPanel() {
  const strategies = [
    {
      id: 'momentum',
      name: 'Momentum Trading',
      description: 'Follows strong price trends in either direction',
      riskLevel: 'Medium',
      allocation: 30,
      indicators: ['RSI', 'MACD', 'Moving Averages']
    },
    {
      id: 'mean_reversion',
      name: 'Mean Reversion',
      description: 'Trades against extreme price movements',
      riskLevel: 'Low',
      allocation: 25,
      indicators: ['Bollinger Bands', 'RSI', 'Stochastic']
    },
    {
      id: 'arbitrage',
      name: 'Arbitrage',
      description: 'Exploits price differences across markets',
      riskLevel: 'Low',
      allocation: 20,
      indicators: ['Spread Analysis', 'Correlation']
    },
    {
      id: 'breakout',
      name: 'Breakout Trading',
      description: 'Enters positions on key level breaks',
      riskLevel: 'High',
      allocation: 15,
      indicators: ['Support/Resistance', 'Volume', 'ATR']
    },
    {
      id: 'scalping',
      name: 'Scalping',
      description: 'Quick trades for small profits',
      riskLevel: 'High',
      allocation: 10,
      indicators: ['Order Flow', 'Level 2', 'Tick Charts']
    }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Trading Strategies</h3>
        <p className="text-sm text-muted-foreground">Configure and manage trading strategies</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </div>
                <Badge variant={
                  strategy.riskLevel === 'Low' ? 'secondary' :
                  strategy.riskLevel === 'Medium' ? 'default' : 'destructive'
                }>
                  {strategy.riskLevel} Risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Allocation</span>
                  <span className="font-medium">{strategy.allocation}%</span>
                </div>
                
                <Progress value={strategy.allocation} className="h-2" />
                
                <div>
                  <span className="text-sm text-muted-foreground">Indicators</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strategy.indicators.map((indicator) => (
                      <Badge key={indicator} variant="outline" className="text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="sm" 
                  variant="outline"
                  onClick={() => toast.success(`${strategy.name} configuration opened`)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Autonomous Agent Creation Panel
function AutonomousAgentCreationPanel() {
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    strategy: 'darvas_box',
    capital: 10000,
    enableMemory: true,
    enableLearning: true,
    enableVault: true,
    enableWallet: true,
    mcpTools: true
  })

  const strategies = [
    { id: 'darvas_box', name: 'Darvas Box', description: 'Box breakout pattern trading', agents: 8, efficiency: 92 },
    { id: 'williams_alligator', name: 'Williams Alligator', description: 'Trend following with alligator lines', agents: 10, efficiency: 87 },
    { id: 'renko_breakout', name: 'Renko Breakout', description: 'Price brick breakout trading', agents: 12, efficiency: 94 },
    { id: 'heikin_ashi', name: 'Heikin Ashi', description: 'Modified candlestick trend analysis', agents: 10, efficiency: 89 },
    { id: 'elliott_wave', name: 'Elliott Wave', description: 'Wave pattern recognition trading', agents: 5, efficiency: 91 }
  ]

  const createAutonomousAgent = async () => {
    if (!agentConfig.name.trim()) {
      toast.error('Agent name is required')
      return
    }

    setCreatingAgent(true)
    try {
      const config = {
        name: agentConfig.name,
        strategy: agentConfig.strategy,
        initialCapital: agentConfig.capital,
        
        // Autonomous features
        autonomousConfig: {
          enabled: true,
          decisionFrequency: 10, // 10 second cycles
          adaptiveParameters: true,
          learningEnabled: agentConfig.enableLearning
        },
        
        // Memory system
        memoryConfig: {
          enabled: agentConfig.enableMemory,
          patternRecognition: true,
          experienceStorage: true,
          adaptiveLearning: true
        },
        
        // Wallet integration
        walletConfig: {
          createDedicatedWallet: agentConfig.enableWallet,
          walletType: 'hot' as const,
          vaultIntegration: agentConfig.enableVault,
          backupToVault: true
        },
        
        // Vault security
        vaultConfig: {
          enabled: agentConfig.enableVault,
          encryptionLevel: 'high' as const,
          accessLevel: 'write' as const
        },
        
        // MCP Tools
        mcpConfig: {
          enabled: agentConfig.mcpTools,
          toolSuite: 'comprehensive' as const,
          permissionLevel: 'trading' as const
        },
        
        // LLM Integration
        llmConfig: {
          provider: 'gemini',
          model: 'gemini-pro',
          contextWindow: 'strategy_specific',
          decisionReasoning: true
        },
        
        // Paper Trading
        paperTradingConfig: {
          enabled: true,
          initialBalance: agentConfig.capital,
          realTimeExecution: true
        }
      }

      const agentId = await enhancedAgentCreationService.createAutonomousAgent(config)
      
      if (agentId) {
        toast.success(`Autonomous agent "${agentConfig.name}" created with full capabilities`)
        setAgentConfig(prev => ({ ...prev, name: '', capital: 10000 }))
      } else {
        toast.error('Failed to create autonomous agent')
      }
    } catch (error) {
      console.error('Error creating autonomous agent:', error)
      toast.error('Error creating autonomous agent')
    } finally {
      setCreatingAgent(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Autonomous Agent Creation</h3>
        <p className="text-sm text-muted-foreground">
          Create fully autonomous agents with memory, learning, and real-time decision making
        </p>
      </div>

      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Technical Analysis Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => (
              <Card 
                key={strategy.id} 
                className={`cursor-pointer transition-all ${
                  agentConfig.strategy === strategy.id 
                    ? 'ring-2 ring-purple-500 bg-purple-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setAgentConfig(prev => ({ ...prev, strategy: strategy.id }))}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{strategy.name}</h4>
                      <Badge variant="outline">{strategy.efficiency}% efficiency</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{strategy.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {strategy.agents} active agents
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                placeholder="Enter agent name"
                value={agentConfig.name}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="agent-capital">Initial Capital ($)</Label>
              <Input
                id="agent-capital"
                type="number"
                min="1000"
                max="500000"
                step="1000"
                value={agentConfig.capital}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, capital: parseInt(e.target.value) || 10000 }))}
              />
            </div>
          </div>
          
          {/* Autonomous Features */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-memory"
                checked={agentConfig.enableMemory}
                onCheckedChange={(checked) => setAgentConfig(prev => ({ ...prev, enableMemory: checked }))}
              />
              <Label htmlFor="enable-memory" className="text-sm">Memory System</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-learning"
                checked={agentConfig.enableLearning}
                onCheckedChange={(checked) => setAgentConfig(prev => ({ ...prev, enableLearning: checked }))}
              />
              <Label htmlFor="enable-learning" className="text-sm">Adaptive Learning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-vault"
                checked={agentConfig.enableVault}
                onCheckedChange={(checked) => setAgentConfig(prev => ({ ...prev, enableVault: checked }))}
              />
              <Label htmlFor="enable-vault" className="text-sm">Vault Security</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-wallet"
                checked={agentConfig.enableWallet}
                onCheckedChange={(checked) => setAgentConfig(prev => ({ ...prev, enableWallet: checked }))}
              />
              <Label htmlFor="enable-wallet" className="text-sm">Dedicated Wallet</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="mcp-tools"
                checked={agentConfig.mcpTools}
                onCheckedChange={(checked) => setAgentConfig(prev => ({ ...prev, mcpTools: checked }))}
              />
              <Label htmlFor="mcp-tools" className="text-sm">MCP Tools</Label>
            </div>
          </div>

          <Button 
            onClick={createAutonomousAgent}
            disabled={creatingAgent || !agentConfig.name.trim()}
            className="w-full"
          >
            {creatingAgent ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Autonomous Agent...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Create Autonomous Agent
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface ConnectedAgentsTabProps {
  className?: string
}

export function ConnectedAgentsTab({ className }: ConnectedAgentsTabProps) {
  const { state, actions } = useDashboardConnection('agents')
  const [agentSubTab, setAgentSubTab] = useState('agent-management')
  
  // Use real-time agent data
  const {
    agents,
    loading: agentsLoading,
    connected: agentsConnected,
    totalAgents,
    activeAgents,
    totalPortfolioValue,
    totalPnL,
    avgWinRate,
    createAgent,
    startAgent,
    stopAgent,
    deleteAgent,
    refresh: refreshAgents
  } = useAgentRealtime()

  // Use real-time paper trading data
  const {
    data: paperTradingData,
    loading: paperTradingLoading,
    connected: paperTradingConnected,
    engineRunning,
    startEngine,
    stopEngine
  } = usePaperTradingRealtime()
  
  // Convert agent data to the format expected by legacy components
  const agentPerformanceMap = new Map(
    agents.map(agent => [
      agent.agentId,
      {
        agentId: agent.agentId,
        name: agent.name,
        status: agent.status,
        portfolioValue: agent.portfolioValue,
        pnl: agent.totalPnL,
        winRate: agent.winRate,
        tradeCount: agent.totalTrades
      }
    ])
  )

  const agentSubTabs = [
    { id: 'agent-management', label: 'Management', component: <RealAgentManagement /> },
    { id: 'agent-creation', label: 'Create Agent', component: <RealAgentCreation /> },
    { id: 'autonomous-creation', label: 'Autonomous', component: <AutonomousAgentCreationPanel /> },
    { id: 'expert-agents', label: 'Expert Agents', component: <AgentOverviewPanel agentPerformance={agentPerformanceMap} /> },
    { id: 'agent-performance', label: 'Performance', component: <AgentPerformancePanel agentPerformance={agentPerformanceMap} /> },
    { id: 'memory-analytics', label: 'Memory Analytics', component: <MemoryAnalyticsDashboard /> },
    { id: 'strategies', label: 'Strategies', component: <TradingStrategiesPanel /> }
  ]
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Agent Management System
            </CardTitle>
            <CardDescription>
              {activeAgents} active agents • {totalAgents} total • ${totalPortfolioValue.toLocaleString()} managed
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {agentsConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button size="sm" variant="ghost" onClick={refreshAgents}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalPnL.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paperTradingData?.recentTrades.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.reduce((sum, agent) => sum + agent.openPositions, 0)}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sub-tabs */}
        <Tabs value={agentSubTab} onValueChange={setAgentSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {agentSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <AnimatePresence mode="wait">
            {agentSubTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.component}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ConnectedAgentsTab