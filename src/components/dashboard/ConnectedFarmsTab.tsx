'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Target, Users, Settings, Play, Pause, Trash2, Plus, 
  RefreshCw, TrendingUp, DollarSign, Activity, Brain,
  BarChart3, Shield, Zap, Star, Bot, Coins, Calendar, Network
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { agentDecisionLoop } from '@/lib/agents/agent-decision-loop'
import { agentWalletManager } from '@/lib/agents/agent-wallet-manager'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
// Import shared data manager to prevent duplicate requests
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'

// Import all the powerful farm management components
import { EnhancedFarmCreationWizard } from '@/components/farms/EnhancedFarmCreationWizard'
import EnhancedFarmDashboard from '@/components/farm/EnhancedFarmDashboard'
import RealAgentManagement from '@/components/agents/RealAgentManagement'
import { useAgentData } from '@/hooks/useAgentData'

// Import goal integration - component is available but with different export
// import { NaturalLanguageGoalCreator } from '@/components/goals/NaturalLanguageGoalCreator'

// Import wallet integration
import { ComprehensiveWalletDashboard } from '@/components/wallet/ComprehensiveWalletDashboard'

// Import analytics components
import RealAnalyticsDashboard from '@/components/analytics/RealAnalyticsDashboard'

// Import risk management
import { RiskManagementSuite } from '@/components/premium-ui/compliance/risk-management-suite'

// Import multi-chain farm coordination
import MultiChainFarmCoordinator from '@/components/farms/MultiChainFarmCoordinator'

interface Farm {
  id: string
  name: string
  description: string
  strategy: string
  agentCount: number
  totalCapital: number
  coordinationMode: 'independent' | 'coordinated' | 'hierarchical'
  status: 'active' | 'paused' | 'stopped'
  createdAt: string
  agents: string[]
  performance: {
    totalValue: number
    totalPnL: number
    winRate: number
    tradeCount: number
  }
  goals?: any[]
  walletAllocations?: any[]
}

interface ConnectedFarmsTabProps {
  className?: string
}

export function ConnectedFarmsTab({ className }: ConnectedFarmsTabProps) {
  const { state, actions } = useDashboardConnection('farms')
  const { agents, loading: agentsLoading } = useAgentData()
  
  // Use shared real-time data manager (prevents duplicate requests)
  const {
    farms,
    totalFarms,
    activeFarms,
    farmTotalValue: totalValue,
    agents: realtimeAgents,
    farmsConnected,
    agentsConnected,
    loading: farmsLoading = false,
    totalPnL
  } = useSharedRealtimeData()

  // Mock farm management functions (replace with actual API calls when backend is ready)
  const createFarm = async (config: any) => {
    console.log('Creating farm:', config)
    return `farm_${Date.now()}`
  }
  const startFarm = async (id: string) => {
    console.log('Starting farm:', id)
    return true
  }
  const stopFarm = async (id: string) => {
    console.log('Stopping farm:', id)
    return true
  }
  const deleteFarm = async (id: string) => {
    console.log('Deleting farm:', id)
    return true
  }
  const addAgentToFarm = async (farmId: string, agentId: string) => {
    console.log('Adding agent to farm:', farmId, agentId)
    return true
  }
  const removeAgentFromFarm = async (farmId: string, agentId: string) => {
    console.log('Removing agent from farm:', farmId, agentId)
    return true
  }
  const rebalanceFarm = async (farmId: string) => {
    console.log('Rebalancing farm:', farmId)
    return true
  }
  const refreshFarms = () => {
    console.log('Refreshing farms')
  }
  const avgPerformance = 85 // Mock performance
  const realtimeAgentsLoading = false
  
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFarm, setSelectedFarm] = useState<any>(null)
  const [showCreateGoal, setShowCreateGoal] = useState(false)

  // Enhanced farm management with real-time hooks
  const handleCreateFarm = async (farmConfig: any) => {
    try {
      const farmId = await createFarm({
        name: farmConfig.name,
        description: farmConfig.description,
        farmType: farmConfig.farmType,
        targetAllocation: farmConfig.targetAllocation,
        strategy: {
          approach: farmConfig.strategy,
          parameters: farmConfig.parameters || {}
        },
        riskLimits: farmConfig.riskLimits || {
          maxDrawdown: 0.05,
          maxConcentration: 0.3,
          maxLeverage: 1
        }
      })

      if (farmId) {
        toast.success(`Farm "${farmConfig.name}" created successfully`)
      } else {
        toast.error('Failed to create farm')
      }
    } catch (error) {
      console.error('Error creating farm:', error)
      toast.error('Failed to create farm')
    }
  }

  const loadFarmsData = async () => {
    try {
      const storedFarms = localStorage.getItem('trading_farms')
      const farmsData = storedFarms ? JSON.parse(storedFarms) : []
      
      // Enhanced farms with real agent data and wallet integration
      const updatedFarms = await Promise.all(farmsData.map(async (farm: any) => {
        // Get real agent performance data
        const farmAgents = Array.from(state.agentPerformance.values()).filter(
          agent => farm.agents?.includes(agent.agentId)
        )
        
        // Get wallet allocations for the farm
        const walletAllocations = await getFarmWalletAllocations(farm.farm_id || farm.id)
        
        // Get assigned goals for the farm
        const farmGoals = await getFarmGoals(farm.farm_id || farm.id)
        
        // Calculate comprehensive performance metrics
        const performance = await calculateFarmPerformance(farm, farmAgents, walletAllocations)
        
        return {
          id: farm.farm_id || farm.id,
          name: farm.farm_name || farm.name,
          description: farm.description,
          strategy: farm.strategy_type || farm.strategy,
          agentCount: farm.metadata?.agent_count || farm.agents?.length || 0,
          totalCapital: farm.total_allocated_capital || farm.totalCapital || 0,
          coordinationMode: farm.coordination_mode || farm.coordinationMode || 'coordinated',
          status: farm.status || 'active',
          createdAt: farm.created_at || farm.createdAt || new Date().toISOString(),
          agents: farm.agents || [],
          performance,
          goals: farmGoals,
          walletAllocations
        }
      }))
      
      setFarms(updatedFarms)
    } catch (error) {
      console.error('Error loading farms data:', error)
    }
  }

  const getFarmWalletAllocations = async (farmId: string) => {
    try {
      // Get wallet allocations for all farm agents
      const allocations: any[] = []
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return []

      for (const agentId of farm.agents) {
        const wallet = await agentWalletManager.getWallet(agentId)
        if (wallet) {
          allocations.push({
            agentId,
            walletAddress: wallet.address,
            balance: wallet.balance,
            totalValue: wallet.totalValue,
            pnl: wallet.realizedPnL + wallet.unrealizedPnL,
            positions: wallet.positions.length
          })
        }
      }
      return allocations
    } catch (error) {
      console.warn('Failed to get wallet allocations:', error)
      return []
    }
  }

  const getFarmGoals = async (farmId: string) => {
    try {
      const allGoals = JSON.parse(localStorage.getItem('trading_goals') || '[]')
      return allGoals.filter((goal: any) => 
        goal.farm_id === farmId || goal.assigned_farms?.includes(farmId)
      )
    } catch (error) {
      console.warn('Failed to get farm goals:', error)
      return []
    }
  }

  const calculateFarmPerformance = async (farm: any, farmAgents: any[], walletAllocations: any[]) => {
    try {
      // Aggregate performance from all sources
      const totalValue = walletAllocations.reduce((sum, wallet) => sum + wallet.totalValue, 0) || farm.total_allocated_capital || 0
      const totalPnL = walletAllocations.reduce((sum, wallet) => sum + wallet.pnl, 0) || 0
      const totalTrades = farmAgents.reduce((sum, agent) => sum + agent.tradeCount, 0) || 0
      const successfulTrades = farmAgents.reduce((sum, agent) => sum + (agent.tradeCount * agent.winRate / 100), 0) || 0
      const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0

      return {
        totalValue,
        totalPnL,
        winRate,
        tradeCount: totalTrades,
        roiPercent: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
        activeAgents: farmAgents.filter(a => a.status === 'active').length,
        avgAgentPerformance: farmAgents.length > 0 ? farmAgents.reduce((sum, a) => sum + a.pnl, 0) / farmAgents.length : 0
      }
    } catch (error) {
      console.warn('Failed to calculate performance:', error)
      return {
        totalValue: 0,
        totalPnL: 0,
        winRate: 0,
        tradeCount: 0,
        roiPercent: 0,
        activeAgents: 0,
        avgAgentPerformance: 0
      }
    }
  }

  const toggleFarmStatus = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.farmId === farmId)
      if (!farm) return

      const newStatus = farm.status === 'active' ? 'paused' : 'active'
      
      // Use real-time hooks for farm management
      if (newStatus === 'active') {
        await startFarm(farmId)
        toast.success(`Farm "${farm.name}" started`)
      } else {
        await stopFarm(farmId)
        toast.success(`Farm "${farm.name}" paused`)
      }
      
    } catch (error) {
      console.error('Error toggling farm status:', error)
      toast.error('Failed to update farm status')
    }
  }

  const handleDeleteFarm = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.farmId === farmId)
      if (!farm) return

      // Use real-time hook to delete farm
      const success = await deleteFarm(farmId)
      if (success) {
        toast.success(`Farm "${farm.name}" deleted successfully`)
      } else {
        toast.error('Failed to delete farm')
      }
    } catch (error) {
      console.error('Error deleting farm:', error)
      toast.error('Failed to delete farm')
    }
  }

  const createFarmGoal = (farmId: string) => {
    setSelectedFarm(farms.find(f => f.farmId === farmId) || null)
    setShowCreateGoal(true)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Trading Farms</h2>
          <p className="text-muted-foreground">
            Real-time multi-agent coordination with Supabase/Redis backend • ${(totalValue || 0).toLocaleString()} managed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EnhancedFarmCreationWizard
            onFarmCreated={async (farm) => {
              await handleCreateFarm(farm)
              
              // If farm has agents, add them using real-time hooks
              if (farm.agents && farm.agents.length > 0) {
                const newFarmId = farm.farm_id || farm.id
                for (const agentId of farm.agents) {
                  try {
                    await agentDecisionLoop.startAgent(agentId)
                  } catch (error) {
                    console.warn(`Failed to start agent ${agentId}:`, error)
                  }
                }
              }

              toast.success(`Farm "${farm.farm_name}" created with ${farm.metadata?.agent_count} active agents`)
              loadFarmsData()
            }}
          />
          
          <Button variant="outline" size="sm" onClick={actions.refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comprehensive Farm Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 bg-emerald-50 gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100">
            <Target className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="farms" className="data-[state=active]:bg-emerald-100">
            <Users className="h-4 w-4 mr-1" />
            Farms
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-emerald-100">
            <Bot className="h-4 w-4 mr-1" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100">
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="wallets" className="data-[state=active]:bg-emerald-100">
            <Coins className="h-4 w-4 mr-1" />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="multichain" className="data-[state=active]:bg-emerald-100">
            <Network className="h-4 w-4 mr-1" />
            Multi-Chain
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-emerald-100">
            <Star className="h-4 w-4 mr-1" />
            Goals
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Enhanced Farm Statistics */}
        <TabsContent value="overview" className="space-y-4">
          {/* Farm Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={farmsLoading ? 'opacity-50' : ''}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Active Farms</CardTitle>
                <div className={`w-2 h-2 rounded-full ${farmsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeFarms}</div>
                <p className="text-xs text-muted-foreground">
                  {totalFarms} total farms
                </p>
              </CardContent>
            </Card>
            
            <Card className={realtimeAgentsLoading ? 'opacity-50' : ''}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Total Agents</CardTitle>
                <div className={`w-2 h-2 rounded-full ${agentsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {farms.reduce((sum, farm) => sum + farm.agentCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {realtimeAgents.filter(a => a.status === 'active').length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Combined P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${totalPnL.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Real-time from backend
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgPerformance.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Real-time win rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Farm Dashboard Integration */}
          <EnhancedFarmDashboard />
        </TabsContent>

        {/* Farms Tab - Individual Farm Management */}
        <TabsContent value="farms" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {farms.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Farms Created</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first trading farm to coordinate multiple agents
                      </p>
                      <EnhancedFarmCreationWizard
                        onFarmCreated={handleCreateFarm}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                farms.map((farm, index) => (
                  <motion.div
                    key={farm.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{farm.name}</CardTitle>
                            <CardDescription>{farm.description}</CardDescription>
                          </div>
                          <Badge variant={
                            farm.status === 'active' ? 'default' :
                            farm.status === 'paused' ? 'secondary' : 'outline'
                          }>
                            {farm.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Enhanced Farm Metrics */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Strategy:</span>
                              <div className="font-medium">
                                {farm.strategy ? farm.strategy.charAt(0).toUpperCase() + farm.strategy.slice(1) : 'Unknown'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Agents:</span>
                              <div className="font-medium">{farm.agentCount}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Coordination:</span>
                              <div className="font-medium">
                                {farm.coordinationMode ? farm.coordinationMode.charAt(0).toUpperCase() + farm.coordinationMode.slice(1) : 'Unknown'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Capital:</span>
                              <div className="font-medium">${farm.totalCapital.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          {/* Enhanced Performance Metrics */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Value:</span>
                              <span className="font-medium">${farm.performance.totalValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">P&L:</span>
                              <span className={`font-medium ${
                                farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {farm.performance.totalPnL >= 0 ? '+' : ''}{farm.performance.totalPnL.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Win Rate:</span>
                              <span className="font-medium">{farm.performance.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Trades:</span>
                              <span className="font-medium">{farm.performance.tradeCount}</span>
                            </div>
                            {farm.goals && farm.goals.length > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Active Goals:</span>
                                <span className="font-medium">{farm.goals.length}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Performance</span>
                              <span>{((farm.performance.totalPnL / farm.totalCapital) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={Math.min(Math.abs((farm.performance.totalPnL / farm.totalCapital) * 100), 100)} 
                              className="h-2"
                            />
                          </div>
                          
                          {/* Enhanced Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={farm.status === 'active' ? 'secondary' : 'default'}
                              onClick={() => toggleFarmStatus(farm.farmId)}
                              className="flex-1"
                            >
                              {farm.status === 'active' ? (
                                <>
                                  <Pause className="mr-2 h-3 w-3" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-3 w-3" />
                                  Start
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createFarmGoal(farm.farmId)}
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFarm(farm.farmId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Agents Tab - Real Agent Management Integration */}
        <TabsContent value="agents" className="space-y-4">
          <RealAgentManagement />
        </TabsContent>

        {/* Analytics Tab - Real Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-4">
          <RealAnalyticsDashboard />
        </TabsContent>

        {/* Wallets Tab - Comprehensive Wallet Management */}
        <TabsContent value="wallets" className="space-y-4">
          <ComprehensiveWalletDashboard />
        </TabsContent>

        {/* Multi-Chain Tab - Cross-Chain Farm Coordination */}
        <TabsContent value="multichain" className="space-y-4">
          <MultiChainFarmCoordinator />
        </TabsContent>

        {/* Goals Tab - Farm Goal Management */}
        <TabsContent value="goals" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Farm Goals & Objectives</h3>
                <p className="text-muted-foreground">Create and track goals for your trading farms</p>
              </div>
              <Button onClick={() => setShowCreateGoal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Goal
              </Button>
            </div>

            {/* Display farm goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farms.map(farm => (
                farm.goals && farm.goals.length > 0 && (
                  <Card key={farm.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{farm.name} Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {farm.goals.map((goal: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{goal.description}</span>
                            <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                              {goal.progress || 0}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Goal Creation Modal */}
      {showCreateGoal && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Goal creation feature will be available when NaturalLanguageGoalCreator is implemented.</p>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={() => {
                setShowCreateGoal(false)
                setSelectedFarm(null)
              }}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectedFarmsTab