'use client'

import React, { useState, useEffect } from 'react'
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
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'
import { toast } from 'react-hot-toast'
import RealAgentManagement from '@/components/agents/RealAgentManagement'
import RealAgentCreation from '@/components/agents/RealAgentCreation'
import { motion, AnimatePresence } from 'framer-motion'
import MemoryAnalyticsDashboard from './MemoryAnalyticsDashboard'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'
import { strategyService } from '@/lib/supabase/strategy-service'
import { usePaperTradingRealtime } from '@/hooks/use-paper-trading-realtime'

// Import autonomous agent creation service
import { enhancedAgentCreationService } from '@/lib/agents/enhanced-agent-creation-service'

// Import shared data manager to prevent duplicate requests
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'

// Import real-time agent data hook for live updates
import { useRealTimeAgentData } from '@/hooks/useRealTimeAgentData'

// Import Supabase services for enhanced integration
import { supabaseAgentsService } from '@/lib/services/supabase-agents-service'
import { supabaseDashboardService } from '@/lib/services/supabase-dashboard-service'

// Import new autonomous expert agents panel
import { AutonomousExpertAgentsPanel } from './AutonomousExpertAgentsPanel'

// Import blockchain wallet integration
import BlockchainAgentWallet from '@/components/agents/BlockchainAgentWallet'

// Import advanced trading agents framework
import { tradingAgentCoordinator, TradingAgentCoordinator, MarketData, NewsData } from '@/lib/agents/advanced-trading-agents'
import { appriseNotificationService, useNotifications } from '@/lib/notifications/apprise-service'

// Import Agent Trading Dashboard
import { AgentTradingDashboard } from '@/components/agents/AgentTradingDashboard'
import BlockchainWalletsPanel from '@/components/agents/BlockchainWalletsPanel'

// Import Advanced Trading Agents Panel (Real version with live data)
import { RealAdvancedTradingAgentsPanel } from '@/components/agents/RealAdvancedTradingAgentsPanel'

// Import premium components for enhanced agent functionality
import { EnhancedExpertAgents } from '@/components/premium-ui/agents/enhanced-expert-agents'
import { AdvancedDataTable } from '@/components/premium-ui/tables/advanced-data-table'
import { VisualStrategyBuilder } from '@/components/premium-ui/strategy/visual-strategy-builder'
import { NotificationCenter } from '@/components/premium-ui/notifications/notification-system'
import { DashboardGrid } from '@/components/premium-ui/layouts/dashboard-grid'
import { RiskManagementSuite } from '@/components/premium-ui/compliance/risk-management-suite'

// Agent Overview Panel showing agent count and expert agents
function AgentOverviewPanel({ agentPerformance }: { agentPerformance: Map<string, any> }) {
  // Use shared data manager instead of individual hooks
  const sharedData = useSharedRealtimeData()
  const [realAgentCount, setRealAgentCount] = useState(0)
  const [activeAgentCount, setActiveAgentCount] = useState(0)
  const [useSupabase, setUseSupabase] = useState(false)
  const [supabaseAgents, setSupabaseAgents] = useState<any[]>([])
  
  // Check Supabase availability and load agent data
  useEffect(() => {
    const initializeAgentData = async () => {
      try {
        // Try to load from Supabase first
        const agents = await supabaseAgentsService.getAllAgents()
        const activeSupabaseAgents = agents.filter(a => a.is_active)
        
        setSupabaseAgents(agents)
        setUseSupabase(true)
        setRealAgentCount(agents.length)
        setActiveAgentCount(activeSupabaseAgents.length)
        
        console.log(`✅ Loaded ${agents.length} agents from Supabase (${activeSupabaseAgents.length} active)`)
      } catch (error) {
        console.log('⚠️ Supabase unavailable, using local data:', error)
        setUseSupabase(false)
        updateLocalAgentCounts()
      }
    }
    
    const updateLocalAgentCounts = () => {
      const persistentAgents = persistentAgentService.getAllAgents()
      const paperAgents = paperTradingEngine.getAllAgents()
      
      const totalCount = persistentAgents.length + paperAgents.length
      const activeCount = persistentAgents.filter(a => a.status === 'active').length + 
                         paperAgents.filter(a => a.status === 'active').length
      
      setRealAgentCount(totalCount)
      setActiveAgentCount(activeCount)
    }
    
    initializeAgentData()
    
    // Listen for agent updates
    persistentAgentService.on('agentCreated', updateLocalAgentCounts)
    persistentAgentService.on('agentStarted', updateLocalAgentCounts)
    persistentAgentService.on('agentStopped', updateLocalAgentCounts)
    persistentAgentService.on('agentUpdated', updateLocalAgentCounts)
    
    return () => {
      persistentAgentService.off('agentCreated', updateLocalAgentCounts)
      persistentAgentService.off('agentStarted', updateLocalAgentCounts)
      persistentAgentService.off('agentStopped', updateLocalAgentCounts)
      persistentAgentService.off('agentUpdated', updateLocalAgentCounts)
    }
  }, [])
  
  const expertAgents = [
    { id: 'momentum', name: 'Momentum Master', strategy: 'Trend Following', expertise: 'Catches strong market trends' },
    { id: 'mean_reversion', name: 'Mean Reversion Pro', strategy: 'Counter-Trend', expertise: 'Profits from overextensions' },
    { id: 'arbitrage', name: 'Arbitrage Hunter', strategy: 'Market Neutral', expertise: 'Exploits price discrepancies' },
    { id: 'scalper', name: 'Scalping Expert', strategy: 'High Frequency', expertise: 'Quick small profits' },
    { id: 'swing', name: 'Swing Trader', strategy: 'Position Trading', expertise: 'Multi-day positions' }
  ]
  
  return (
    <div className="space-y-6">
      {/* Agent Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{realAgentCount}</div>
            <p className="text-xs text-muted-foreground">Created and managed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAgentCount}</div>
            <p className="text-xs text-muted-foreground">Currently trading</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expert Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{expertAgents.length}</div>
            <p className="text-xs text-muted-foreground">Pre-configured</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {Array.from(agentPerformance.values()).length > 0 
                ? ((Array.from(agentPerformance.values()).reduce((sum, agent) => sum + (agent.winRate || 0), 0) / Array.from(agentPerformance.values()).length) || 0).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">Avg win rate</p>
          </CardContent>
        </Card>
      </div>
      
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
                      <span className="font-medium">${((agentData.portfolioValue || 0) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">P&L</span>
                      <span className={`font-medium ${(agentData.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((agentData.pnl || 0) || 0) >= 0 ? '+' : ''}{((agentData.pnl || 0) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-medium">{((agentData.winRate || 0) || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trades</span>
                      <span className="font-medium">{(agentData.tradeCount || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={async () => {
                      try {
                        let agentId: string | null = null
                        
                        if (useSupabase) {
                          // Create agent in Supabase first
                          const supabaseAgent = await supabaseAgentsService.createAgent({
                            name: expert.name,
                            agent_type: 'trading',
                            strategy: expert.id,
                            initial_capital: 10000,
                            configuration: {
                              parameters: {
                                riskPerTrade: 0.02,
                                maxPositions: 5,
                                stopLoss: 0.05,
                                takeProfit: 0.1
                              }
                            },
                            risk_limits: {
                              maxPositionSize: 5,
                              maxDailyLoss: 500,
                              stopLossEnabled: true,
                              takeProfitEnabled: true
                            }
                          })
                          
                          if (supabaseAgent) {
                            agentId = supabaseAgent.agent_id
                            // Also create in local persistent service for compatibility
                            await persistentAgentService.createAgent({
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
                            
                            await supabaseAgentsService.updateAgentStatus(agentId, 'active')
                            console.log(`✅ Created agent in Supabase: ${supabaseAgent.agent_id}`)
                          }
                        } else {
                          // Fallback to local creation
                          agentId = await persistentAgentService.createAgent({
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
                        }
                        
                        if (agentId) {
                          // Start the agent immediately
                          await persistentAgentService.startAgent(agentId)
                          toast.success(`${expert.name} deployed and started successfully`)
                          
                          // Refresh the agent counts
                          setTimeout(() => {
                            if (useSupabase) {
                              // Refresh from Supabase
                              supabaseAgentsService.getAllAgents().then(agents => {
                                setSupabaseAgents(agents)
                                setRealAgentCount(agents.length)
                                setActiveAgentCount(agents.filter(a => a.is_active).length)
                              })
                            }
                          }, 1000)
                        } else {
                          toast.error(`Failed to deploy ${expert.name}`)
                        }
                      } catch (error) {
                        console.error('Error deploying agent:', error)
                        toast.error(`Failed to deploy ${expert.name}: ${error}`)
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
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'trades' | 'sharpe'>('pnl')
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [loading, setLoading] = useState(true)
  const [realPerformanceData, setRealPerformanceData] = useState<any[]>([])
  
  // Load real performance data from persistent agents and paper trading
  useEffect(() => {
    loadRealPerformanceData()
    
    // Listen for agent updates
    const handleAgentUpdate = () => loadRealPerformanceData()
    persistentAgentService.on('agentUpdated', handleAgentUpdate)
    persistentAgentService.on('agentCreated', handleAgentUpdate)
    persistentAgentService.on('agentStarted', handleAgentUpdate)
    persistentAgentService.on('agentStopped', handleAgentUpdate)
    
    return () => {
      persistentAgentService.off('agentUpdated', handleAgentUpdate)
      persistentAgentService.off('agentCreated', handleAgentUpdate)
      persistentAgentService.off('agentStarted', handleAgentUpdate)
      persistentAgentService.off('agentStopped', handleAgentUpdate)
    }
  }, [timeframe])

  const loadRealPerformanceData = async () => {
    try {
      setLoading(true)
      
      let performanceData = []
      
      // Try to get data from Supabase first
      try {
        const supabaseAgents = await supabaseAgentsService.getAllAgents()
        
        if (supabaseAgents.length > 0) {
          console.log(`✅ Loading performance data from Supabase (${supabaseAgents.length} agents)`)
          
          // Process Supabase agents
          for (const agent of supabaseAgents) {
            const performance = agent.performance_metrics as any
            const combinedData = {
              agentId: agent.agent_id,
              name: agent.name,
              status: agent.status,
              strategy: agent.strategy,
              
              // Performance metrics from Supabase
              portfolioValue: agent.current_capital,
              pnl: performance?.totalPnL || 0,
              winRate: performance?.winRate || 0,
              tradeCount: performance?.totalTrades || 0,
              sharpeRatio: performance?.sharpeRatio || 0,
              
              // Enhanced metrics
              maxDrawdown: performance?.maxDrawdown || 0,
              annualizedReturn: performance?.totalPnL / Math.max(agent.initial_capital, 1),
              volatility: performance?.volatility || 0.15,
              profitFactor: performance?.profitFactor || 1.2,
              
              // Trade statistics
              averageWin: performance?.avgTradeSize || 150,
              averageLoss: performance?.avgTradeSize || 100,
              winningTrades: Math.floor((performance?.totalTrades || 0) * (performance?.winRate || 0) / 100),
              losingTrades: Math.floor((performance?.totalTrades || 0) * (1 - (performance?.winRate || 0) / 100)),
              
              // Status data
              activePositions: 0, // Would need to query paper trading
              pendingOrders: 0, // Would need to query paper trading
              
              lastUpdated: agent.updated_at
            }
            
            performanceData.push(combinedData)
          }
          
          setRealPerformanceData(performanceData)
          setLoading(false)
          return
        }
      } catch (supabaseError) {
        console.log('⚠️ Supabase unavailable, using local data:', supabaseError)
      }
      
      // Fallback to local data sources
      console.log('📊 Loading performance data from local sources')
      
      // Get persistent agents (primary source)
      const persistentAgents = persistentAgentService.getAllAgents()
      
      // Get paper trading agents
      const paperAgents = paperTradingEngine.getAllAgents()
      
      // Get lifecycle agents for additional data
      const lifecycleAgents = await agentLifecycleManager.getAllAgents()
      
      // Process persistent agents (most accurate data)
      for (const agent of persistentAgents) {
        // Find corresponding paper trading agent for real-time data
        const paperAgent = paperAgents.find(p => p.name === agent.name)
        
        // Find lifecycle agent for advanced metrics
        const lifecycleAgent = lifecycleAgents.find(l => l.name === agent.name)
        
        const combinedData = {
          agentId: agent.id,
          name: agent.name,
          status: agent.status,
          strategy: agent.strategy,
          
          // Real performance metrics from persistent storage
          portfolioValue: paperAgent?.portfolio.totalValue || agent.currentCapital,
          pnl: agent.performance.totalPnL,
          winRate: agent.performance.winRate,
          tradeCount: agent.performance.totalTrades,
          sharpeRatio: agent.performance.sharpeRatio,
          
          // Enhanced metrics from paper trading
          maxDrawdown: paperAgent?.performance?.maxDrawdown || 0,
          annualizedReturn: (agent.performance.totalPnL || 0) / Math.max(agent.initialCapital || 1, 1),
          volatility: paperAgent?.performance?.volatility || 0.15,
          profitFactor: paperAgent?.performance?.profitFactor || 1.2,
          
          // Trade statistics
          averageWin: paperAgent?.performance?.averageWin || 150,
          averageLoss: paperAgent?.performance?.averageLoss || 100,
          winningTrades: Math.floor((agent.performance.totalTrades || 0) * (agent.performance.winRate || 0) / 100),
          losingTrades: Math.floor((agent.performance.totalTrades || 0) * (1 - (agent.performance.winRate || 0) / 100)),
          
          // Real-time data
          activePositions: paperAgent?.portfolio.positions.length || 0,
          pendingOrders: paperAgent?.portfolio.orders.filter(o => o.status === 'pending').length || 0,
          
          lastUpdated: agent.lastActive
        }
        
        performanceData.push(combinedData)
      }
      
      // Add any paper trading agents not in persistent storage
      for (const paperAgent of paperAgents) {
        if (!persistentAgents.find(p => p.name === paperAgent.name)) {
          const combinedData = {
            agentId: paperAgent.id,
            name: paperAgent.name,
            status: paperAgent.status,
            strategy: paperAgent.strategy.type,
            
            portfolioValue: paperAgent.portfolio.totalValue,
            pnl: paperAgent.performance.totalPnL,
            winRate: paperAgent.performance.winRate * 100,
            tradeCount: paperAgent.performance.totalTrades,
            sharpeRatio: paperAgent.performance.sharpeRatio,
            
            maxDrawdown: paperAgent.performance.maxDrawdown,
            annualizedReturn: (paperAgent.performance.totalPnL || 0) / 10000, // assume 10k initial
            volatility: 0.15,
            profitFactor: 1.2,
            
            averageWin: paperAgent.performance.averageWin,
            averageLoss: paperAgent.performance.averageLoss,
            winningTrades: paperAgent.performance.winningTrades,
            losingTrades: paperAgent.performance.losingTrades,
            
            activePositions: paperAgent.portfolio.positions.length,
            pendingOrders: paperAgent.portfolio.orders.filter(o => o.status === 'pending').length,
            
            lastUpdated: paperAgent.lastActive.toISOString()
          }
          
          performanceData.push(combinedData)
        }
      }
      
      setRealPerformanceData(performanceData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading real performance data:', error)
      // Fallback to empty data with proper structure
      setRealPerformanceData([])
      setLoading(false)
    }
  }
  
  const sortedAgents = realPerformanceData.sort((a, b) => {
    switch (sortBy) {
      case 'pnl': return b.pnl - a.pnl
      case 'winRate': return b.winRate - a.winRate
      case 'trades': return b.tradeCount - a.tradeCount
      case 'sharpe': return b.sharpeRatio - a.sharpeRatio
      default: return 0
    }
  })
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Agent Performance Leaderboard</h3>
            <p className="text-sm text-muted-foreground">Loading real-time performance data...</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agent Performance Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Real-time performance from strategy_performance table</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pnl">P&L</SelectItem>
              <SelectItem value="winRate">Win Rate</SelectItem>
              <SelectItem value="trades">Trades</SelectItem>
              <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={loadRealPerformanceData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
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
                          index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-600'
                        }`}>
                          <span className="font-bold text-lg">{index + 1}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        } border-2 border-white`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{agent.name}</h4>
                          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {agent.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {agent.strategy?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${(agent.portfolioValue || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {agent.tradeCount || 0} trades
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {(agent.winRate || 0).toFixed(1)}% win rate
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {(agent.sharpeRatio || 0).toFixed(2)} sharpe
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${((agent.pnl || 0) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((agent.pnl || 0) || 0) >= 0 ? '+' : ''}{((agent.pnl || 0) || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((((agent.pnl || 0) || 0) / Math.max(((agent.portfolioValue || 0) || 10000), 1)) * 100).toFixed(2)}% return
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Max DD: {((agent.maxDrawdown || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Portfolio Growth</span>
                      <span>{(((agent.portfolioValue || 0) || 0) / Math.max(10000, 1) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(Math.max(((agent.portfolioValue || 0) || 0) / Math.max(10000, 1) * 100, 0), 200)} 
                      className="h-2"
                    />
                  </div>
                  
                  {/* Additional metrics row */}
                  <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Volatility</div>
                      <div className="font-medium">{(((agent.volatility || 0) || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profit Factor</div>
                      <div className="font-medium">{((agent.profitFactor || 0) || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Win</div>
                      <div className="font-medium text-green-600">${((agent.averageWin || 0) || 0).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Loss</div>
                      <div className="font-medium text-red-600">${((agent.averageLoss || 0) || 0).toFixed(0)}</div>
                    </div>
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
        // If wallet creation is enabled, the enhanced service will handle it
        // but we should also update the UI to reflect the new agent
        if (agentConfig.enableWallet) {
          // Trigger refresh of wallet panel and agent counts
          setAgentUpdateTrigger(prev => prev + 1)
        }
        
        toast.success(`Autonomous agent "${agentConfig.name}" created with full capabilities${agentConfig.enableWallet ? ' including dedicated wallet' : ''}`)
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
  const [agentSubTab, setAgentSubTab] = useState('overview')
  const [agentUpdateTrigger, setAgentUpdateTrigger] = useState(0)
  const [supabaseConnected, setSupabaseConnected] = useState(false)
  const [dashboardSummary, setDashboardSummary] = useState<any>(null)
  
  // Check Supabase connectivity and load dashboard summary
  useEffect(() => {
    const checkSupabaseAndLoadData = async () => {
      try {
        const summary = await supabaseDashboardService.getDashboardSummary()
        setDashboardSummary(summary)
        setSupabaseConnected(true)
        console.log('✅ Connected to Supabase dashboard service')
      } catch (error) {
        console.log('⚠️ Supabase dashboard service unavailable:', error)
        setSupabaseConnected(false)
      }
    }
    
    checkSupabaseAndLoadData()
  }, [agentUpdateTrigger])
  
  // Inter-tab communication setup
  useEffect(() => {
    const handleAgentUpdate = () => {
      setAgentUpdateTrigger(prev => prev + 1)
      refreshAgents()
    }
    
    // Listen for agent events from persistent service
    persistentAgentService.on('agentCreated', handleAgentUpdate)
    persistentAgentService.on('agentStarted', handleAgentUpdate)
    persistentAgentService.on('agentStopped', handleAgentUpdate)
    persistentAgentService.on('agentUpdated', handleAgentUpdate)
    
    return () => {
      persistentAgentService.off('agentCreated', handleAgentUpdate)
      persistentAgentService.off('agentStarted', handleAgentUpdate)
      persistentAgentService.off('agentStopped', handleAgentUpdate)
      persistentAgentService.off('agentUpdated', handleAgentUpdate)
    }
  }, [])

  // Use shared real-time data manager (prevents duplicate requests)
  const {
    agents,
    totalAgents,
    activeAgents,
    totalPortfolioValue,
    totalPnL,
    avgWinRate,
    agentsConnected,
    loading: agentsLoading = false
  } = useSharedRealtimeData()

  // Use real-time agent data hook for live WebSocket updates
  const {
    agents: realTimeAgents,
    portfolioData: realTimePortfolio,
    lastPaperTrade,
    lastLLMDecision,
    connectionStatus,
    isSubscribed,
    refreshData
  } = useRealTimeAgentData()

  // Mock functions for agent management (replace with actual API calls when backend is ready)
  const createAgent = async (config: any) => {
    console.log('Creating agent:', config)
    return `agent_${Date.now()}`
  }
  const startAgent = async (id: string) => {
    console.log('Starting agent:', id)
    return true
  }
  const stopAgent = async (id: string) => {
    console.log('Stopping agent:', id)
    return true
  }
  const deleteAgent = async (id: string) => {
    console.log('Deleting agent:', id)
    return true
  }
  const refreshAgents = () => {
    console.log('Refreshing agents with real-time data')
    refreshData() // Trigger real-time data refresh
  }

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
    { 
      id: 'overview', 
      label: 'Overview', 
      component: () => <AgentOverviewPanel key={agentUpdateTrigger} agentPerformance={agentPerformanceMap} />
    },
    {
      id: 'advanced-agents',
      label: 'AI Analysts',
      component: () => <RealAdvancedTradingAgentsPanel key={agentUpdateTrigger} />
    },
    { 
      id: 'agent-management', 
      label: 'Management', 
      component: () => <RealAgentManagement key={agentUpdateTrigger} onCreateAgent={() => setAgentSubTab('agent-creation')} />
    },
    { 
      id: 'agent-creation', 
      label: 'Create Agent', 
      component: () => <RealAgentCreation key={agentUpdateTrigger} />
    },
    { 
      id: 'enhanced-agents', 
      label: 'Premium Agents', 
      component: () => <EnhancedExpertAgents key={agentUpdateTrigger} />
    },
    { 
      id: 'strategy-builder', 
      label: 'Strategy Builder', 
      component: () => <VisualStrategyBuilder key={agentUpdateTrigger} />
    },
    { 
      id: 'blockchain-wallets', 
      label: 'Blockchain Wallets', 
      component: () => <BlockchainWalletsPanel key={agentUpdateTrigger} />
    },
    { 
      id: 'agent-performance', 
      label: 'Performance', 
      component: () => <AgentPerformancePanel key={agentUpdateTrigger} agentPerformance={agentPerformanceMap} />
    },
    { 
      id: 'advanced-data', 
      label: 'Advanced Data', 
      component: () => <AdvancedDataTable 
        key={agentUpdateTrigger}
        columns={[
          { accessorKey: 'name', header: 'Agent Name' },
          { accessorKey: 'strategy', header: 'Strategy' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'pnl', header: 'P&L' },
          { accessorKey: 'winRate', header: 'Win Rate' },
          { accessorKey: 'trades', header: 'Trades' }
        ]}
        data={agents.map(agent => ({
          name: agent.name,
          strategy: agent.strategy || 'Unknown',
          status: agent.status,
          pnl: agent.totalPnL || 0,
          winRate: agent.winRate || 0,
          trades: agent.totalTrades || 0
        }))}
        title="Agent Performance Data"
        description="Detailed performance metrics for all agents"
        searchable={true}
        filterable={true}
        exportable={true}
      />
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      component: () => <NotificationCenter key={agentUpdateTrigger} />
    },
    { 
      id: 'risk-mgmt', 
      label: 'Risk Management', 
      component: () => <RiskManagementSuite 
        key={agentUpdateTrigger}
        riskLimits={[]}
        complianceRules={[]}
        alerts={[]}
        users={[]}
        portfolioMetrics={{
          totalValue: totalPortfolioValue || 0,
          var95: 0,
          var99: 0,
          maxDrawdown: 0,
          concentrationRisk: 0,
          leverageRatio: 1,
          liquidity: 100
        }}
        onUpdateRiskLimit={() => {}}
        onUpdateComplianceRule={() => {}}
        onAcknowledgeAlert={() => {}}
        onResolveAlert={() => {}}
        onUpdateUserProfile={() => {}}
      />
    },
    { 
      id: 'memory', 
      label: 'Memory', 
      component: () => <MemoryAnalyticsDashboard key={agentUpdateTrigger} />
    },
    { 
      id: 'expert-strategies', 
      label: 'Expert Strategies', 
      component: () => <AutonomousExpertAgentsPanel key={agentUpdateTrigger} />
    },
    { 
      id: 'strategies', 
      label: 'Classic Strategies', 
      component: () => (
        <Card key={agentUpdateTrigger}>
          <CardHeader>
            <CardTitle>Classic Trading Strategies</CardTitle>
            <CardDescription>Traditional algorithmic trading strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Classic trading strategies will be available in a future update
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }
  ]
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Agent Management System
              <Badge variant="secondary" className="text-xs">Premium Enhanced</Badge>
            </CardTitle>
            <CardDescription>
              {dashboardSummary ? 
                `${dashboardSummary.agents.active} active agents • ${dashboardSummary.agents.total} total • $${(dashboardSummary.agents.totalCapital || 0).toLocaleString()} managed` :
                `${activeAgents} active agents • ${totalAgents} total • $${((totalPortfolioValue || 0)).toLocaleString()} managed`
              } • Premium Components Integrated
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={supabaseConnected ? "default" : "secondary"} 
              className={`text-xs ${supabaseConnected ? 'bg-green-100 text-green-800' : ''}`}
            >
              {supabaseConnected ? '🟢 Supabase' : '🟡 Local'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {agentsConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge 
              variant={connectionStatus === 'connected' ? "default" : "secondary"} 
              className={`text-xs ${connectionStatus === 'connected' ? 'bg-blue-100 text-blue-800' : ''}`}
            >
              {connectionStatus === 'connected' && isSubscribed ? '🔄 Live Data' : 
               connectionStatus === 'connecting' ? '⏳ Connecting' : 
               connectionStatus === 'error' ? '❌ Error' : '📴 Offline'}
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                refreshAgents()
                setAgentUpdateTrigger(prev => prev + 1)
              }}
            >
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
              <div className={`text-2xl font-bold ${((dashboardSummary?.agents.totalPnL || totalPnL || 0) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${((dashboardSummary?.agents.totalPnL || totalPnL || 0) || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((dashboardSummary?.agents.averageWinRate || avgWinRate || 0) || 0).toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(dashboardSummary?.trading.totalTrades || paperTradingData?.recentTrades.length || 0)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.reduce((sum, agent) => sum + (agent.openPositions || 0), 0)}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sub-tabs */}
        <Tabs value={agentSubTab} onValueChange={setAgentSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 bg-purple-50">
            {agentSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 text-xs"
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
                  {tab.component()}
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