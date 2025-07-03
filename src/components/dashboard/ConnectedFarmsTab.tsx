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

// Import farms service
import { useFarms, Farm, FarmCreateConfig } from '@/lib/farms/farms-service'

// Import agent data
import { useAgentData } from '@/hooks/useAgentData'

// Import form components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Farm interface is now imported from farms-service

interface ConnectedFarmsTabProps {
  className?: string
}

export function ConnectedFarmsTab({ className }: ConnectedFarmsTabProps) {
  const { state, actions } = useDashboardConnection('farms')
  const { agents, loading: agentsLoading } = useAgentData()
  
  // Use farms service for real farm management
  const {
    farms,
    loading: farmsLoading,
    activeFarms,
    totalFarms,
    totalValue,
    totalPnL,
    averageWinRate,
    createFarm,
    updateFarmStatus,
    deleteFarm,
    addAgentToFarm,
    removeAgentFromFarm
  } = useFarms()
  
  // Use shared real-time data for additional context
  const {
    agents: realtimeAgents,
    agentsConnected,
    farmsConnected
  } = useSharedRealtimeData()

  // Farm management state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFarmConfig, setNewFarmConfig] = useState<Partial<FarmCreateConfig>>({
    name: '',
    description: '',
    strategy: 'darvas_box',
    targetAllocation: 10000,
    farmType: 'strategy'
  })
  
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)

  // Farm management functions
  const handleCreateFarm = async () => {
    try {
      if (!newFarmConfig.name || !newFarmConfig.strategy) {
        toast.error('Please fill in all required fields')
        return
      }

      const farmId = await createFarm(newFarmConfig as FarmCreateConfig)
      toast.success(`Farm "${newFarmConfig.name}" created successfully`)
      setShowCreateDialog(false)
      setNewFarmConfig({
        name: '',
        description: '',
        strategy: 'darvas_box',
        targetAllocation: 10000,
        farmType: 'strategy'
      })
    } catch (error) {
      console.error('Error creating farm:', error)
      toast.error('Failed to create farm')
    }
  }

  // Strategy options
  const strategyOptions = [
    { value: 'darvas_box', label: 'Darvas Box', description: 'Breakout pattern recognition' },
    { value: 'williams_alligator', label: 'Williams Alligator', description: 'Trend identification system' },
    { value: 'renko_breakout', label: 'Renko Breakout', description: 'Price movement analysis' },
    { value: 'heikin_ashi', label: 'Heikin Ashi', description: 'Smoothed candlestick patterns' },
    { value: 'elliott_wave', label: 'Elliott Wave', description: 'Wave pattern analysis' }
  ]

  const toggleFarmStatus = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return

      const newStatus = farm.status === 'active' ? 'paused' : 'active'
      
      const success = await updateFarmStatus(farmId, newStatus)
      if (success) {
        toast.success(`Farm "${farm.name}" ${newStatus === 'active' ? 'started' : 'paused'}`)
      } else {
        toast.error('Failed to update farm status')
      }
    } catch (error) {
      console.error('Error toggling farm status:', error)
      toast.error('Failed to update farm status')
    }
  }

  const handleDeleteFarm = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return

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

      {/* Comprehensive Farm Management Tabs - Enhanced with Premium Components */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-8 bg-emerald-50 gap-1">
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
          <TabsTrigger value="premium" className="data-[state=active]:bg-emerald-100">
            <Zap className="h-4 w-4 mr-1" />
            Premium
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
                  ${(totalPnL || 0).toFixed(2)}
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
                  {(avgPerformance || 0).toFixed(1)}%
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
                              <div className="font-medium">${(farm.totalCapital || 0).toLocaleString()}</div>
                            </div>
                          </div>
                          
                          {/* Enhanced Performance Metrics */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Value:</span>
                              <span className="font-medium">${(farm.performance?.totalValue || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">P&L:</span>
                              <span className={`font-medium ${
                                (farm.performance?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(farm.performance?.totalPnL || 0) >= 0 ? '+' : ''}{(farm.performance?.totalPnL || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Win Rate:</span>
                              <span className="font-medium">{(farm.performance?.winRate || 0).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Trades:</span>
                              <span className="font-medium">{farm.performance?.tradeCount || 0}</span>
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
                              <span>{(((farm.performance?.totalPnL || 0) / Math.max((farm.totalCapital || 1), 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={Math.min(Math.abs(((farm.performance?.totalPnL || 0) / Math.max((farm.totalCapital || 1), 1)) * 100), 100)} 
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

        {/* Agents Tab - Enhanced with Premium Agent Components */}
        <TabsContent value="agents" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Farm Agent Management</h3>
                <p className="text-muted-foreground">Premium agent coordination for trading farms</p>
              </div>
              <Badge variant="secondary">Premium Enhanced</Badge>
            </div>
            
            {/* Enhanced Agent Management with Premium Components */}
            <Tabs defaultValue="enhanced" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="enhanced">Enhanced Agents</TabsTrigger>
                <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="classic">Classic View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="enhanced">
                <EnhancedExpertAgents />
              </TabsContent>
              
              <TabsContent value="strategy">
                <VisualStrategyBuilder />
              </TabsContent>
              
              <TabsContent value="notifications">
                <NotificationCenter />
              </TabsContent>
              
              <TabsContent value="classic">
                <RealAgentManagement />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Analytics Tab - Enhanced with Premium Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Farm Analytics & Performance</h3>
                <p className="text-muted-foreground">Advanced analytics with premium data visualization</p>
              </div>
              <Badge variant="secondary">Premium Analytics</Badge>
            </div>
            
            {/* Enhanced Analytics with Premium Tables */}
            <Tabs defaultValue="dashboard" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">Analytics Dashboard</TabsTrigger>
                <TabsTrigger value="data-table">Advanced Data</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <RealAnalyticsDashboard />
              </TabsContent>
              
              <TabsContent value="data-table">
                <AdvancedDataTable />
              </TabsContent>
              
              <TabsContent value="risk">
                <RiskManagementSuite />
              </TabsContent>
            </Tabs>
          </div>
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

        {/* Premium Tab - Advanced Premium Features */}
        <TabsContent value="premium" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Premium Farm Features</h3>
                <p className="text-muted-foreground">Advanced premium components for farm management</p>
              </div>
              <Badge variant="default">Premium Only</Badge>
            </div>
            
            {/* Premium Features Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Grid Layout</CardTitle>
                  <CardDescription>Advanced grid layout for farm monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <DashboardGrid />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Farm Notifications</CardTitle>
                  <CardDescription>Real-time farm notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationCenter />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Data Management</CardTitle>
                  <CardDescription>Premium data tables for farm analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancedDataTable />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Risk Management Suite</CardTitle>
                  <CardDescription>Comprehensive risk management for farms</CardDescription>
                </CardHeader>
                <CardContent>
                  <RiskManagementSuite />
                </CardContent>
              </Card>
            </div>
            
            {/* Premium Strategy Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Visual Strategy Builder</CardTitle>
                <CardDescription>Create and manage farm strategies visually</CardDescription>
              </CardHeader>
              <CardContent>
                <VisualStrategyBuilder />
              </CardContent>
            </Card>
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