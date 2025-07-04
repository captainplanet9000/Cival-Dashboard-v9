'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Bot,
  Play,
  Pause,
  Square,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Settings,
  Eye,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  PieChart,
  Target,
  Zap,
  Trash2
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  Position,
  Order,
  Transaction
} from '@/lib/trading/real-paper-trading-engine'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'

interface RealAgentManagementProps {
  className?: string
  onCreateAgent?: () => void
}

type AgentWithSource = TradingAgent & { source: string }

export function RealAgentManagement({ className, onCreateAgent }: RealAgentManagementProps) {
  const [agents, setAgents] = useState<AgentWithSource[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentWithSource | null>(null)
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load agents
    loadAgents()
    
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Listen for engine events
    const handleAgentCreated = (agent: TradingAgent) => {
      const agentWithSource: AgentWithSource = { ...agent, source: 'paper' }
      setAgents(prev => [...prev, agentWithSource])
    }

    const handlePricesUpdated = (prices: any[]) => {
      const priceMap: Record<string, number> = {}
      prices.forEach(price => {
        priceMap[price.symbol] = price.price
      })
      setMarketPrices(priceMap)
      
      // Update agent portfolios
      loadAgents()
    }

    const handleOrderFilled = () => {
      loadAgents() // Refresh agents when orders are filled
    }

    // Handle lifecycle manager events
    const handleLifecycleAgentEvent = () => {
      loadAgents() // Refresh agents when lifecycle events occur
    }

    paperTradingEngine.on('agentCreated', handleAgentCreated)
    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)
    paperTradingEngine.on('orderFilled', handleOrderFilled)
    
    // Listen to lifecycle manager events
    agentLifecycleManager.on('agentCreated', handleLifecycleAgentEvent)
    agentLifecycleManager.on('agentStarted', handleLifecycleAgentEvent)
    agentLifecycleManager.on('agentStopped', handleLifecycleAgentEvent)
    agentLifecycleManager.on('agentDeleted', handleLifecycleAgentEvent)

    // Listen to persistent agent events
    const handlePersistentAgentEvent = () => {
      loadAgents() // Refresh when persistent agents update
    }
    
    persistentAgentService.on('agentCreated', handlePersistentAgentEvent)
    persistentAgentService.on('agentStarted', handlePersistentAgentEvent)
    persistentAgentService.on('agentStopped', handlePersistentAgentEvent)
    persistentAgentService.on('agentDeleted', handlePersistentAgentEvent)
    persistentAgentService.on('portfolioUpdated', handlePersistentAgentEvent)
    persistentAgentService.on('agentUpdated', handlePersistentAgentEvent)

    // Update agents every 5 seconds
    const interval = setInterval(loadAgents, 5000)

    return () => {
      paperTradingEngine.off('agentCreated', handleAgentCreated)
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      paperTradingEngine.off('orderFilled', handleOrderFilled)
      
      // Remove lifecycle manager listeners
      agentLifecycleManager.off('agentCreated', handleLifecycleAgentEvent)
      agentLifecycleManager.off('agentStarted', handleLifecycleAgentEvent)
      agentLifecycleManager.off('agentStopped', handleLifecycleAgentEvent)
      agentLifecycleManager.off('agentDeleted', handleLifecycleAgentEvent)
      
      // Remove persistent agent listeners
      persistentAgentService.off('agentCreated', handlePersistentAgentEvent)
      persistentAgentService.off('agentStarted', handlePersistentAgentEvent)
      persistentAgentService.off('agentStopped', handlePersistentAgentEvent)
      persistentAgentService.off('agentDeleted', handlePersistentAgentEvent)
      persistentAgentService.off('portfolioUpdated', handlePersistentAgentEvent)
      persistentAgentService.off('agentUpdated', handlePersistentAgentEvent)
      
      clearInterval(interval)
    }
  }, [])

  const loadAgents = async () => {
    try {
      // Load agents from all sources
      const paperAgents = paperTradingEngine.getAllAgents()
      const lifecycleAgents = await agentLifecycleManager.getAllAgents()
      const persistentAgents = persistentAgentService.getAllAgents()
      
      // Start with paper trading agents
      const allAgents: AgentWithSource[] = paperAgents.map(agent => ({
        ...agent,
        source: 'paper'
      })) as unknown as AgentWithSource[]
      
      // Add persistent agents that might not be in paper trading yet
      persistentAgents.forEach(pAgent => {
        // Check if this persistent agent exists in paper trading
        const existingAgent = allAgents.find(a => a.name === pAgent.name)
        
        if (!existingAgent) {
          // Convert persistent agent to display format
          const displayAgent: AgentWithSource = {
            id: pAgent.id,
            name: pAgent.name,
            status: pAgent.status,
            strategy: {
              id: pAgent.strategy,
              name: pAgent.strategy,
              type: pAgent.strategy as any,
              parameters: pAgent.config.parameters || {},
              signals: [],
              description: ''
            },
            portfolio: {
              id: pAgent.id,
              agentId: pAgent.id,
              cash: pAgent.currentCapital,
              totalValue: pAgent.currentCapital,
              positions: [],
              orders: [],
              transactions: [],
              performance: {
                totalReturn: (pAgent.currentCapital - pAgent.initialCapital) / pAgent.initialCapital,
                sharpeRatio: pAgent.performance.sharpeRatio,
                maxDrawdown: 0,
                winRate: pAgent.performance.winRate / 100,
                totalTrades: pAgent.performance.totalTrades
              }
            },
            performance: {
              totalTrades: pAgent.performance.totalTrades,
              winningTrades: Math.floor(pAgent.performance.totalTrades * pAgent.performance.winRate / 100),
              losingTrades: Math.floor(pAgent.performance.totalTrades * (1 - pAgent.performance.winRate / 100)),
              totalPnL: pAgent.performance.totalPnL,
              winRate: pAgent.performance.winRate / 100,
              sharpeRatio: pAgent.performance.sharpeRatio,
              maxDrawdown: 0,
              averageWin: 0,
              averageLoss: 0
            },
            riskLimits: pAgent.config.riskLimits || {
              maxPositionSize: 10,
              maxDailyLoss: 500,
              maxDrawdown: 20,
              maxLeverage: 1,
              allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
              stopLossEnabled: true,
              takeProfitEnabled: true
            },
            createdAt: new Date(pAgent.createdAt),
            lastActive: new Date(pAgent.lastActive),
            source: 'persistent'
          } as any
          
          allAgents.push(displayAgent)
        } else {
          // Update existing agent with persistent data for more accurate metrics
          existingAgent.portfolio.totalValue = pAgent.currentCapital
          
          // Update performance data from persistent source
          if (existingAgent.performance) {
            existingAgent.performance.totalPnL = pAgent.performance.totalPnL
            existingAgent.performance.winRate = pAgent.performance.winRate / 100
            existingAgent.performance.totalTrades = pAgent.performance.totalTrades
            existingAgent.performance.sharpeRatio = pAgent.performance.sharpeRatio
            
            // Calculate additional metrics if possible
            if (pAgent.performance.totalTrades > 0) {
              existingAgent.performance.winningTrades = Math.floor(pAgent.performance.totalTrades * pAgent.performance.winRate / 100)
              existingAgent.performance.losingTrades = pAgent.performance.totalTrades - existingAgent.performance.winningTrades
              
              // Calculate average win if we have winning trades
              if (existingAgent.performance.winningTrades > 0 && pAgent.performance.totalPnL > 0) {
                existingAgent.performance.averageWin = pAgent.performance.totalPnL / existingAgent.performance.winningTrades
              }
            }
          }
          
          // Update last active time
          existingAgent.lastActive = new Date(pAgent.lastActive)
        }
      })
      
      // Convert lifecycle agents to TradingAgent format for display
      const convertedLifecycleAgents = lifecycleAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        status: agent.status as TradingAgent['status'],
        strategy: agent.strategy_type,
        strategyParams: {},
        portfolio: {
          cash: agent.current_capital,
          totalValue: agent.current_capital,
          positions: agent.realTimeState?.currentPositions || [],
          unrealizedPnL: agent.realTimeState?.totalPnL || 0,
          realizedPnL: 0
        },
        performance: {
          totalTrades: agent.performance?.totalTrades || 0,
          winningTrades: agent.performance?.winningTrades || 0,
          losingTrades: agent.performance?.losingTrades || 0,
          totalPnL: agent.realTimeState?.totalPnL || (agent.current_capital - agent.initial_capital),
          winRate: agent.realTimeState?.winRate || 0,
          sharpeRatio: agent.performance?.sharpeRatio || 0,
          maxDrawdown: agent.performance?.maxDrawdown || 0,
          averageWin: agent.performance?.avgWinAmount || 0,
          averageLoss: agent.performance?.avgLossAmount || 0
        },
        riskManagement: {
          maxPositionSize: 1000,
          stopLossPercentage: 0.02,
          takeProfitPercentage: 0.05,
          maxDailyLoss: 500,
          maxOpenPositions: 3
        },
        riskLimits: {
          maxPositionSize: 1000,
          maxDailyLoss: 500,
          maxDrawdown: 0.15,
          maxLeverage: 1
        },
        createdAt: new Date(agent.created_at),
        lastActive: new Date(agent.updated_at),
        isActive: agent.status === 'active',
        executionCount: agent.realTimeState?.currentPositions?.length || 0,
        lastDecision: agent.recentDecisions?.[0] || null,
        currentPositions: agent.realTimeState?.currentPositions || [],
        pendingOrders: agent.realTimeState?.pendingOrders || [],
        source: 'lifecycle'
      })) as unknown as AgentWithSource[]
      
      // Add lifecycle agents that aren't already in the list
      convertedLifecycleAgents.forEach(agent => {
        if (!allAgents.find(a => a.id === agent.id || a.name === agent.name)) {
          allAgents.push(agent)
        }
      })
      
      console.log(`📊 Loaded ${allAgents.length} agents (${paperAgents.length} paper, ${persistentAgents.length} persistent, ${convertedLifecycleAgents.length} lifecycle)`)
      setAgents(allAgents)
      
    } catch (error) {
      console.error('Error loading agents:', error)
      // Fallback to just paper trading agents
      const paperAgents = paperTradingEngine.getAllAgents()
      const agentsWithSource = paperAgents.map(agent => ({ ...agent, source: 'paper' })) as unknown as AgentWithSource[]
      setAgents(agentsWithSource)
    }
  }

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete agent "${agentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete from persistent service
      const persistentAgent = persistentAgentService.getAgent(agentId)
      if (persistentAgent) {
        await persistentAgentService.deleteAgent(agentId)
      }

      // Delete from paper trading engine
      const paperAgent = paperTradingEngine.getAgent(agentId)
      if (paperAgent) {
        paperTradingEngine.deleteAgent(agentId)
      }

      // Delete from lifecycle manager
      try {
        await agentLifecycleManager.deleteAgent(agentId)
      } catch (error) {
        console.log('Agent not found in lifecycle manager:', error)
      }

      // Refresh the agent list
      await loadAgents()
      
      console.log(`🗑️ Deleted agent ${agentName}`)
      // Note: Using console.log instead of toast to avoid circular dependency
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const handleAgentAction = async (agentId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      // Check if it's a persistent agent
      const persistentAgent = persistentAgentService.getAgent(agentId)
      
      if (persistentAgent) {
        // Handle persistent agent
        let success = false
        
        switch (action) {
          case 'start':
            success = await persistentAgentService.startAgent(agentId)
            break
          case 'stop':
            success = await persistentAgentService.stopAgent(agentId)
            break
          case 'pause':
            // For now, treat pause as stop
            success = await persistentAgentService.stopAgent(agentId)
            break
        }
        
        if (success) {
          // Reload agents to reflect the changes
          await loadAgents()
          console.log(`🎮 Persistent Agent ${persistentAgent.name} ${action}ed`)
        }
      } else {
        // Try to find the agent in paper trading engine
        const paperAgent = paperTradingEngine.getAgent(agentId)
        
        if (paperAgent) {
          // Handle paper trading agent
          paperAgent.status = action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped'
          paperAgent.lastActive = new Date()
          const updatedAgent: AgentWithSource = { ...paperAgent, source: 'paper' }
          setAgents(prev => prev.map(a => a.id === agentId ? updatedAgent : a))
          console.log(`🎮 Paper Agent ${paperAgent.name} ${action}ed`)
        } else {
          // Handle lifecycle manager agent
          let success = false
          
          switch (action) {
            case 'start':
              success = await agentLifecycleManager.startAgent(agentId)
              break
            case 'stop':
              success = await agentLifecycleManager.stopAgent(agentId)
              break
            case 'pause':
              // For now, treat pause as stop in lifecycle manager
              success = await agentLifecycleManager.stopAgent(agentId)
              break
          }
          
          if (success) {
            // Reload agents to reflect the changes
            await loadAgents()
            console.log(`🎮 Lifecycle Agent ${agentId} ${action}ed`)
          } else {
            console.error(`Failed to ${action} agent ${agentId}`)
          }
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing agent:`, error)
    }
  }

  const calculatePortfolioChange = (agent: AgentWithSource): { value: number; percentage: number } => {
    // Get initial capital from agent data
    let initialValue = 10000 // Default fallback
    
    if (agent.source === 'persistent') {
      const persistentAgent = persistentAgentService.getAgent(agent.id)
      if (persistentAgent) {
        initialValue = persistentAgent.initialCapital
      }
    } else if (agent.source === 'paper') {
      // For paper trading agents, try to get from performance data or use reasonable default
      initialValue = 10000
    } else if (agent.source === 'lifecycle') {
      // For lifecycle agents, calculate from current - total PnL
      const totalPnL = agent.performance?.totalPnL || 0
      initialValue = (agent.portfolio?.totalValue || 10000) - totalPnL
    }
    
    const currentValue = agent.portfolio?.totalValue || initialValue
    const change = currentValue - initialValue
    const percentage = initialValue > 0 ? (change / initialValue) * 100 : 0
    
    return { value: change, percentage }
  }

  const getAgentStats = (agent: AgentWithSource) => {
    // Get active positions count
    const activePositions = agent.portfolio?.positions?.length || 0
    
    // Get pending orders count
    const pendingOrders = agent.portfolio?.orders?.filter(o => o.status === 'pending')?.length || 0
    
    // Get total trades - try different sources
    let totalTrades = 0
    if (agent.performance?.totalTrades) {
      totalTrades = agent.performance.totalTrades
    } else if (agent.portfolio?.transactions?.length) {
      totalTrades = agent.portfolio.transactions.length
    }
    
    // Get win rate - normalize to 0-1 range
    let winRate = 0
    if (agent.performance?.winRate !== undefined) {
      winRate = agent.performance.winRate
      // If winRate is > 1, it's probably in percentage form, convert to decimal
      if (winRate > 1) {
        winRate = winRate / 100
      }
    }
    
    // Get total PnL
    let totalPnL = 0
    if (agent.performance?.totalPnL !== undefined) {
      totalPnL = agent.performance.totalPnL
    } else {
      // Calculate from portfolio change
      const portfolioChange = calculatePortfolioChange(agent)
      totalPnL = portfolioChange.value
    }
    
    // Get average win
    let averageWin = 0
    if (agent.performance?.averageWin) {
      averageWin = agent.performance.averageWin
    } else if (agent.performance?.winningTrades && agent.performance?.winningTrades > 0 && totalPnL > 0) {
      // Estimate average win from available data
      averageWin = totalPnL / agent.performance.winningTrades
    }
    
    return {
      activePositions,
      pendingOrders,
      totalTrades,
      winRate,
      totalPnL,
      averageWin
    }
  }

  const getStatusColor = (status: TradingAgent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'stopped':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStrategyIcon = (strategyType: string) => {
    switch (strategyType) {
      case 'momentum':
        return <TrendingUp className="h-4 w-4" />
      case 'mean_reversion':
        return <TrendingDown className="h-4 w-4" />
      case 'arbitrage':
        return <Zap className="h-4 w-4" />
      case 'grid':
        return <BarChart3 className="h-4 w-4" />
      case 'dca':
        return <Clock className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
            <p className="text-sm text-gray-600">Monitor and control your trading agents</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {agents.length} Agent{agents.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant={agents.some(a => a.status === 'active') ? 'default' : 'secondary'}>
              {agents.filter(a => a.status === 'active').length} Active
            </Badge>
          </div>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents created yet</h3>
              <p className="text-gray-600 mb-4">Create your first trading agent to get started</p>
              <Button onClick={onCreateAgent}>Create Agent</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const portfolioChange = calculatePortfolioChange(agent)
              const agentStats = getAgentStats(agent)

              return (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                          <h3 className="font-semibold text-lg">{agent.name}</h3>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {agent.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleAgentAction(agent.id, 'start')}>
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </DropdownMenuItem>
                            )}
                            {agent.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleAgentAction(agent.id, 'pause')}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAgentAction(agent.id, 'stop')}>
                              <Square className="h-4 w-4 mr-2" />
                              Stop
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedAgent(agent)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAgent(agent.id, agent.name)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Agent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStrategyIcon(agent.strategy.type)}
                        <span className="text-sm text-gray-600">{agent.strategy.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {agent.strategy.type}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Portfolio Value */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Portfolio Value</span>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ${agent.portfolio.totalValue.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Cash: ${agent.portfolio.cash.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">P&L</span>
                          <div className="flex items-center space-x-1">
                            {portfolioChange.value >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                portfolioChange.value >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {portfolioChange.value >= 0 ? '+' : ''}${portfolioChange.value.toFixed(2)}
                              </div>
                              <div className={`text-xs ${
                                portfolioChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {portfolioChange.percentage >= 0 ? '+' : ''}{portfolioChange.percentage.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Real-time status indicator */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Source: {agent.source}</span>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              agent.status === 'active' ? 'bg-green-500 animate-pulse' : 
                              agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-gray-500">
                              {agent.lastActive ? new Date(agent.lastActive).toLocaleTimeString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center bg-blue-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">{agentStats.activePositions}</div>
                          <div className="text-xs text-gray-600">Positions</div>
                        </div>
                        <div className="text-center bg-orange-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-orange-600">{agentStats.pendingOrders}</div>
                          <div className="text-xs text-gray-600">Pending</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{agentStats.totalTrades}</div>
                          <div className="text-xs text-gray-600">Trades</div>
                        </div>
                      </div>

                      {/* Trading Activity */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Recent Activity</span>
                          <span className="text-gray-500">
                            {agent.portfolio.transactions.length > 0 
                              ? `${agent.portfolio.transactions.length} transactions` 
                              : 'No activity'}
                          </span>
                        </div>
                        
                        {/* Show latest transaction if exists */}
                        {agent.portfolio.transactions.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600">
                              Latest: {agent.portfolio.transactions[agent.portfolio.transactions.length - 1].side} {' '}
                              {agent.portfolio.transactions[agent.portfolio.transactions.length - 1].symbol} {' '}
                              ${agent.portfolio.transactions[agent.portfolio.transactions.length - 1].total.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Performance Metrics */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Win Rate</span>
                          <span className="font-medium">{(agentStats.winRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={agentStats.winRate * 100} className="h-2" />
                      </div>

                      {/* Additional Performance Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center bg-green-50 rounded p-2">
                          <div className="font-semibold text-green-700">
                            ${agentStats.totalPnL >= 0 ? '+' : ''}{agentStats.totalPnL.toFixed(2)}
                          </div>
                          <div className="text-gray-600">Total P&L</div>
                        </div>
                        <div className="text-center bg-blue-50 rounded p-2">
                          <div className="font-semibold text-blue-700">
                            ${agentStats.averageWin.toFixed(2)}
                          </div>
                          <div className="text-gray-600">Avg Win</div>
                        </div>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last active</span>
                        <span>{agent.lastActive.toLocaleTimeString()}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        {agent.status !== 'active' ? (
                          <Button
                            size="sm"
                            onClick={() => handleAgentAction(agent.id, 'start')}
                            className="flex-1"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAgentAction(agent.id, 'pause')}
                            className="flex-1"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Agent Details Modal */}
        <Dialog open={selectedAgent !== null} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedAgent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-blue-600" />
                    <span>{selectedAgent.name}</span>
                    <Badge variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}>
                      {selectedAgent.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {selectedAgent.strategy.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Portfolio Overview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Portfolio Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-2" />
                          <div className="text-sm text-gray-600">Cash</div>
                          <div className="text-lg font-bold">${selectedAgent.portfolio.cash.toFixed(2)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <PieChart className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                          <div className="text-sm text-gray-600">Total Value</div>
                          <div className="text-lg font-bold">${selectedAgent.portfolio.totalValue.toFixed(2)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                          <div className="text-sm text-gray-600">Positions</div>
                          <div className="text-lg font-bold">{selectedAgent.portfolio.positions.length}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Activity className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                          <div className="text-sm text-gray-600">Total Trades</div>
                          <div className="text-lg font-bold">{selectedAgent.performance.totalTrades}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Positions */}
                  {selectedAgent.portfolio.positions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Open Positions</h3>
                      <div className="space-y-2">
                        {selectedAgent.portfolio.positions.map((position) => (
                          <Card key={position.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{position.symbol}</div>
                                  <div className="text-sm text-gray-600">
                                    {position.quantity} @ ${position.averagePrice.toFixed(2)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">${position.marketValue.toFixed(2)}</div>
                                  <div className={`text-sm ${
                                    position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Orders */}
                  {selectedAgent.portfolio.orders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Recent Orders</h3>
                      <div className="space-y-2">
                        {selectedAgent.portfolio.orders.slice(-5).map((order) => (
                          <Card key={order.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium flex items-center space-x-2">
                                    <span>{order.symbol}</span>
                                    <Badge variant={order.side === 'buy' ? 'default' : 'secondary'}>
                                      {order.side}
                                    </Badge>
                                    <Badge variant="outline">
                                      {order.type}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {order.quantity} @ ${order.price?.toFixed(2) || 'Market'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant={
                                    order.status === 'filled' ? 'default' :
                                    order.status === 'pending' ? 'secondary' : 'destructive'
                                  }>
                                    {order.status}
                                  </Badge>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {order.createdAt.toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default RealAgentManagement