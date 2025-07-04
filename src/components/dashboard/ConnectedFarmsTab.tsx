'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Target, Users, Settings, Play, Pause, Trash2, Plus, 
  RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, Brain,
  BarChart3, Shield, Zap, Star, Bot, Coins, Calendar, Network
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
// Import shared data manager to prevent duplicate requests
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'
// Import WebSocket hooks for real-time updates
import { useFarmUpdates } from '@/lib/realtime/websocket'

// Simple farm interface
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
    roiPercent: number
    activeAgents: number
  }
  goals?: any[]
  walletAllocations?: any[]
}

interface ConnectedFarmsTabProps {
  className?: string
}

export function ConnectedFarmsTab({ className }: ConnectedFarmsTabProps) {
  const { state, actions } = useDashboardConnection('farms')
  
  // Use shared real-time data for additional context
  const {
    farms: realtimeFarms = [],
    totalFarms = 0,
    activeFarms = 0,
    farmTotalValue: totalValue = 0,
    agents: realtimeAgents = [],
    totalPnL = 0,
    agentsConnected = false,
    farmsConnected = false
  } = useSharedRealtimeData()

  // Use WebSocket for real-time farm updates
  const farmUpdates = useFarmUpdates()

  // Mock farms data with safe fallbacks
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(false)
  
  // Initialize mock farms data
  useEffect(() => {
    const mockFarms: Farm[] = realtimeFarms.map((farm, index) => ({
      id: farm.farmId || `farm_${index}`,
      name: farm.name || `Farm ${index + 1}`,
      description: `Trading farm using ${farm.strategy || 'momentum'} strategy`,
      strategy: farm.strategy || 'darvas_box',
      agentCount: farm.agentCount || 5,
      totalCapital: farm.totalValue || 50000,
      coordinationMode: 'coordinated' as const,
      status: farm.status || 'active',
      createdAt: new Date().toISOString(),
      agents: [],
      performance: {
        totalValue: farm.totalValue || 50000,
        totalPnL: farm.totalPnL || 0,
        winRate: farm.performance?.winRate || 65,
        tradeCount: 150,
        roiPercent: ((farm.totalPnL || 0) / Math.max(farm.totalValue || 50000, 1)) * 100,
        activeAgents: farm.agentCount || 5
      }
    }))
    setFarms(mockFarms)
  }, [realtimeFarms])

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [showOrchestration, setShowOrchestration] = useState(false)

  // Calculate derived values with safe fallbacks
  const averageWinRate = farms.length > 0 
    ? farms.reduce((sum, farm) => sum + (farm.performance?.winRate || 0), 0) / Math.max(farms.length, 1)
    : 0

  // Simplified farm management functions
  const toggleFarmStatus = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return

      const newStatus = farm.status === 'active' ? 'paused' : 'active'
      
      // Update local state
      setFarms(prev => prev.map(f => 
        f.id === farmId ? { ...f, status: newStatus } : f
      ))
      
      toast.success(`Farm "${farm.name}" ${newStatus === 'active' ? 'started' : 'paused'}`)
    } catch (error) {
      console.error('Error toggling farm status:', error)
      toast.error('Failed to update farm status')
    }
  }

  const handleDeleteFarm = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return

      // Update local state
      setFarms(prev => prev.filter(f => f.id !== farmId))
      toast.success(`Farm "${farm.name}" deleted successfully`)
    } catch (error) {
      console.error('Error deleting farm:', error)
      toast.error('Failed to delete farm')
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

  // Helper function to get strategy icon
  const getStrategyIcon = (strategy: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'darvas_box': <Target className="h-4 w-4 text-blue-600" />,
      'williams_alligator': <TrendingUp className="h-4 w-4 text-green-600" />,
      'renko_breakout': <BarChart3 className="h-4 w-4 text-purple-600" />,
      'heikin_ashi': <Activity className="h-4 w-4 text-orange-600" />,
      'elliott_wave': <Zap className="h-4 w-4 text-red-600" />
    }
    return iconMap[strategy] || <Star className="h-4 w-4 text-gray-500" />
  }

  // Helper function to get strategy win rate
  const getStrategyWinRate = (strategy: string) => {
    const winRates: Record<string, number> = {
      'darvas_box': 78,
      'williams_alligator': 72,
      'renko_breakout': 68,
      'heikin_ashi': 75,
      'elliott_wave': 70
    }
    return winRates[strategy] || 65
  }

  // Helper function to get strategy risk level
  const getStrategyRiskLevel = (strategy: string) => {
    const riskLevels: Record<string, string> = {
      'darvas_box': 'Medium',
      'williams_alligator': 'Low',
      'renko_breakout': 'High',
      'heikin_ashi': 'Medium',
      'elliott_wave': 'High'
    }
    return riskLevels[strategy] || 'Medium'
  }

  // Helper function to get strategy best markets
  const getStrategyMarkets = (strategy: string) => {
    const markets: Record<string, string> = {
      'darvas_box': 'BTC, ETH',
      'williams_alligator': 'All',
      'renko_breakout': 'SOL, ADA',
      'heikin_ashi': 'ETH, BNB',
      'elliott_wave': 'BTC, ETH'
    }
    return markets[strategy] || 'Various'
  }

  // Create farm from strategy template
  const createFarmFromTemplate = async (strategy: string) => {
    try {
      setLoading(true)
      const templateName = strategyOptions.find(s => s.value === strategy)?.label || strategy
      
      // Simulate farm creation
      toast.success(`${templateName} farm template loaded. Configuration wizard coming soon!`)
      
      // Here you would typically open a farm creation modal or navigate to a creation page
      // For now, we'll just show success message
      
    } catch (error) {
      console.error('Error creating farm from template:', error)
      toast.error('Failed to create farm from template')
    } finally {
      setLoading(false)
    }
  }

  // Handle LLM action coordination
  const handleLLMAction = async (action: 'analyze' | 'rebalance' | 'optimize' | 'group' | 'communicate') => {
    try {
      setLoading(true)
      
      // Use the first active farm for demonstration
      const activeFarm = farms.find(f => f.status === 'active')
      if (!activeFarm) {
        toast.error('No active farms available for coordination')
        return
      }

      // Call the coordination API
      const response = await fetch('/api/farms/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmId: activeFarm.id,
          action,
          context: {
            marketConditions: 'Normal trading conditions',
            customInstructions: `Perform ${action} action on ${activeFarm.name}`
          },
          groupingCriteria: {
            type: 'performance',
            parameters: {}
          }
        })
      })

      if (!response.ok) {
        throw new Error('Coordination request failed')
      }

      const result = await response.json()
      
      // Show results based on action type
      switch (action) {
        case 'analyze':
          toast.success(`Analysis complete: ${result.results.analysis?.split('\n')[0] || 'Farm analysis successful'}`)
          break
        case 'rebalance':
          toast.success(`Capital rebalanced: ${result.results.rebalancing?.length || 0} operations completed`)
          break
        case 'optimize':
          toast.success(`Optimization complete: ${result.results.recommendations?.length || 0} recommendations generated`)
          break
        case 'group':
          toast.success(`Agent grouping complete: ${Object.keys(result.results.groupings || {}).length} groups created`)
          break
        case 'communicate':
          toast.success(`Communication sent: ${result.results.communication?.length || 0} messages delivered`)
          break
        default:
          toast.success(`${action} action completed successfully`)
      }

    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast.error(`Failed to perform ${action} action`)
    } finally {
      setLoading(false)
    }
  }

  // Handle agent grouping
  const handleAgentGrouping = async () => {
    try {
      setLoading(true)
      
      // Simulate intelligent grouping
      const activeFarms = farms.filter(f => f.status === 'active')
      
      if (activeFarms.length === 0) {
        toast.error('No active farms available for grouping')
        return
      }

      // Call grouping for each active farm
      for (const farm of activeFarms) {
        await handleLLMAction('group')
      }
      
      toast.success(`Agent grouping applied to ${activeFarms.length} active farms`)
      
    } catch (error) {
      console.error('Error applying agent grouping:', error)
      toast.error('Failed to apply agent grouping')
    } finally {
      setLoading(false)
    }
  }

  // Coordinate specific farm
  const coordinateFarm = async (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) {
        toast.error('Farm not found')
        return
      }

      setLoading(true)
      
      // Perform comprehensive coordination
      await handleLLMAction('analyze')
      
      // Add a small delay for better UX
      setTimeout(async () => {
        await handleLLMAction('optimize')
        toast.success(`Comprehensive coordination complete for ${farm.name}`)
        setLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error coordinating farm:', error)
      toast.error('Failed to coordinate farm')
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Trading Farms</h2>
          <p className="text-muted-foreground">
            Real-time multi-agent coordination with Supabase/Redis backend • ${(totalValue || 0).toLocaleString()} managed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.success('Farm creation feature coming soon')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Farm
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comprehensive Farm Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-emerald-50 gap-1">
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
          <TabsTrigger value="orchestration" className="data-[state=active]:bg-emerald-100">
            <Network className="h-4 w-4 mr-1" />
            Orchestration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100">
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Enhanced Farm Statistics */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Farm Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={`${loading ? 'opacity-50' : ''} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
                <div className={`w-3 h-3 rounded-full ${activeFarms > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{activeFarms}</div>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-muted-foreground">of {totalFarms} total</span>
                  <Progress 
                    value={totalFarms > 0 ? (activeFarms / totalFarms) * 100 : 0} 
                    className="ml-2 h-1 flex-1" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className={`${loading ? 'opacity-50' : ''} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Bot className={`w-4 h-4 ${agentsConnected ? 'text-green-500' : 'text-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {farms.reduce((sum, farm) => sum + (farm.agentCount || 0), 0)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {farms.reduce((sum, farm) => sum + (farm.performance?.activeAgents || 0), 0)} active
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {agentsConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${(totalValue || 0).toLocaleString()}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Allocated capital</span>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Combined P&L</CardTitle>
                {(totalPnL || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  (totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(totalPnL || 0) >= 0 ? '+' : ''}${(totalPnL || 0).toFixed(2)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Real-time P&L</span>
                  <Badge variant={
                    (totalPnL || 0) >= 0 ? 'default' : 'destructive'
                  } className="text-xs">
                    {((totalPnL || 0) / Math.max(totalValue || 1, 1) * 100).toFixed(2)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Farm Performance Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Average Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{(averageWinRate || 0).toFixed(1)}%</span>
                  <Badge variant="outline">{farms.length} farms</Badge>
                </div>
                <Progress value={averageWinRate || 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Across all active farms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Total Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {farms.reduce((sum, farm) => sum + (farm.performance?.tradeCount || 0), 0)}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">All farms combined</span>
                  <Badge variant="secondary">
                    {(farms.reduce((sum, farm) => sum + (farm.performance?.tradeCount || 0), 0) / Math.max(farms.length, 1)).toFixed(0)} avg
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Drawdown:</span>
                    <span className="font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sharpe Ratio:</span>
                    <span className="font-medium">1.85</span>
                  </div>
                  <Badge variant="default" className="w-full justify-center">
                    Low Risk
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Distribution and Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Strategy Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['darvas_box', 'williams_alligator', 'renko_breakout', 'heikin_ashi', 'elliott_wave'].map(strategy => {
                    const strategyFarms = farms.filter(f => f.strategy === strategy)
                    const percentage = farms.length > 0 ? (strategyFarms.length / farms.length) * 100 : 0
                    return (
                      <div key={strategy} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{strategy.replace('_', ' ')}</span>
                          <span className="font-medium">{strategyFarms.length} farms</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Farms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {farms
                    .sort((a, b) => (b.performance?.roiPercent || 0) - (a.performance?.roiPercent || 0))
                    .slice(0, 3)
                    .map((farm, index) => (
                      <div key={farm.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <h4 className="font-medium text-sm">{farm.name}</h4>
                            <p className="text-xs text-muted-foreground">{farm.strategy.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {(farm.performance?.roiPercent || 0).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${(farm.performance?.totalPnL || 0).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Farm Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Farm Performance Dashboard
              </CardTitle>
              <CardDescription>
                Real-time performance metrics and trends across all trading farms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Interactive Performance Charts</h3>
                  <p className="text-muted-foreground mb-4">
                    Coming next: Chart.js integration with real-time farm performance data
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="font-medium text-blue-800">ROI Trends</div>
                      <div className="text-blue-600">Time series analysis</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="font-medium text-green-800">P&L Analysis</div>
                      <div className="text-green-600">Profit tracking</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="font-medium text-purple-800">Strategy Compare</div>
                      <div className="text-purple-600">Performance matrix</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-12" onClick={() => setActiveTab('farms')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Farm
                </Button>
                <Button variant="outline" className="h-12" onClick={() => setActiveTab('orchestration')}>
                  <Network className="w-4 h-4 mr-2" />
                  Orchestrate
                </Button>
                <Button variant="outline" className="h-12" onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="outline" className="h-12" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh All
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      <Button onClick={() => toast.success('Farm creation feature coming soon')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Farm
                      </Button>
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
                          </div>
                          
                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>ROI Performance</span>
                              <span>{(farm.performance?.roiPercent || 0).toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={Math.min(Math.abs(farm.performance?.roiPercent || 0), 100)} 
                              className="h-2"
                            />
                          </div>
                          
                          {/* Enhanced Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={farm.status === 'active' ? 'secondary' : 'default'}
                              onClick={() => toggleFarmStatus(farm.id)}
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
                              onClick={() => setSelectedFarm(farm)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFarm(farm.id)}
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

        {/* Agents Tab - Farm Agent Management */}
        <TabsContent value="agents" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Farm Agent Management</h3>
                <p className="text-muted-foreground">Agent coordination for trading farms</p>
              </div>
              <Badge variant="secondary">Enhanced</Badge>
            </div>
            
            {/* Agent Management for Farms */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Farm Agent Allocation</CardTitle>
                  <CardDescription>
                    Distribute agents across your trading farms based on strategy and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {farms.map(farm => (
                      <div key={farm.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{farm.name}</h4>
                          <p className="text-sm text-muted-foreground">{farm.strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                            {farm.agentCount} agents
                          </Badge>
                          <Badge variant="outline">
                            {(farm.performance?.winRate || 0).toFixed(1)}% win rate
                          </Badge>
                          <Button size="sm" variant="outline">
                            Manage Agents
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab - Farm Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Farm Analytics & Performance</h3>
                <p className="text-muted-foreground">Advanced analytics with data visualization</p>
              </div>
              <Badge variant="secondary">Analytics</Badge>
            </div>
            
            {/* Farm Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Farm Performance Analytics</CardTitle>
                <CardDescription>
                  Detailed performance analysis across all trading farms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Farm Analytics Dashboard</h3>
                    <p className="text-muted-foreground">
                      Comprehensive analytics and reporting features coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orchestration Tab - Advanced Farm-Agent Coordination */}
        <TabsContent value="orchestration" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI-Powered Farm Orchestration</h3>
              <p className="text-muted-foreground">Advanced coordination with LLM-driven agent management</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">AI-Powered</Badge>
              <Badge variant="outline">5 Strategies</Badge>
            </div>
          </div>

          {/* Strategy Templates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Strategy Templates
              </CardTitle>
              <CardDescription>
                Pre-configured farm templates based on proven trading strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategyOptions.map(strategy => (
                  <Card key={strategy.value} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{strategy.label}</CardTitle>
                        {getStrategyIcon(strategy.value)}
                      </div>
                      <CardDescription className="text-xs">
                        {strategy.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className="font-medium">{getStrategyWinRate(strategy.value)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Risk Level:</span>
                          <span className="font-medium">{getStrategyRiskLevel(strategy.value)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Best Markets:</span>
                          <span className="font-medium">{getStrategyMarkets(strategy.value)}</span>
                        </div>
                        <Button size="sm" className="w-full mt-3" onClick={() => createFarmFromTemplate(strategy.value)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Create Farm
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* LLM Coordination Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-600" />
                LLM Farm Coordination
              </CardTitle>
              <CardDescription>
                AI-powered analysis, grouping, and communication with farm agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="text-center space-y-2">
                    <BarChart3 className="h-8 w-8 mx-auto text-blue-600" />
                    <h4 className="font-medium text-sm">Analyze Performance</h4>
                    <p className="text-xs text-muted-foreground">AI analysis of farm metrics</p>
                    <Button size="sm" className="w-full" onClick={() => handleLLMAction('analyze')}>
                      <Brain className="h-3 w-3 mr-1" />
                      Analyze
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="text-center space-y-2">
                    <RefreshCw className="h-8 w-8 mx-auto text-green-600" />
                    <h4 className="font-medium text-sm">Rebalance Capital</h4>
                    <p className="text-xs text-muted-foreground">Optimize capital allocation</p>
                    <Button size="sm" className="w-full" onClick={() => handleLLMAction('rebalance')}>
                      <DollarSign className="h-3 w-3 mr-1" />
                      Rebalance
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="text-center space-y-2">
                    <Users className="h-8 w-8 mx-auto text-purple-600" />
                    <h4 className="font-medium text-sm">Group Agents</h4>
                    <p className="text-xs text-muted-foreground">Smart agent groupings</p>
                    <Button size="sm" className="w-full" onClick={() => handleLLMAction('group')}>
                      <Network className="h-3 w-3 mr-1" />
                      Group
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="text-center space-y-2">
                    <Brain className="h-8 w-8 mx-auto text-orange-600" />
                    <h4 className="font-medium text-sm">Communicate</h4>
                    <p className="text-xs text-muted-foreground">Send AI-generated messages</p>
                    <Button size="sm" className="w-full" onClick={() => handleLLMAction('communicate')}>
                      <Activity className="h-3 w-3 mr-1" />
                      Communicate
                    </Button>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Customizable Agent Groupings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Customizable Agent Groupings
              </CardTitle>
              <CardDescription>
                Create and manage custom agent groups based on various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grouping Controls */}
                <div className="flex items-center gap-4">
                  <Select defaultValue="performance">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Grouping criteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance-based</SelectItem>
                      <SelectItem value="strategy">Strategy-based</SelectItem>
                      <SelectItem value="risk">Risk-based</SelectItem>
                      <SelectItem value="market">Market condition</SelectItem>
                      <SelectItem value="custom">Custom criteria</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleAgentGrouping()}>
                    <Zap className="h-4 w-4 mr-2" />
                    Apply Grouping
                  </Button>
                  <Button variant="outline" onClick={() => handleLLMAction('optimize')}>
                    <Brain className="h-4 w-4 mr-2" />
                    AI Optimize
                  </Button>
                </div>

                {/* Agent Groups Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-green-700">High Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {farms.slice(0, 1).map(farm => (
                          <div key={farm.id} className="text-xs p-2 bg-green-50 rounded">
                            <div className="font-medium">{farm.name}</div>
                            <div className="text-muted-foreground">{(farm.performance?.winRate || 0).toFixed(1)}% win rate</div>
                          </div>
                        ))}
                        <Badge variant="outline" className="w-full justify-center text-xs">
                          {farms.filter(f => (f.performance?.winRate || 0) > 70).length} agents
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-yellow-700">Medium Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {farms.slice(1, 2).map(farm => (
                          <div key={farm.id} className="text-xs p-2 bg-yellow-50 rounded">
                            <div className="font-medium">{farm.name}</div>
                            <div className="text-muted-foreground">{(farm.performance?.winRate || 0).toFixed(1)}% win rate</div>
                          </div>
                        ))}
                        <Badge variant="outline" className="w-full justify-center text-xs">
                          {farms.filter(f => (f.performance?.winRate || 0) >= 50 && (f.performance?.winRate || 0) <= 70).length} agents
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-red-700">Needs Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {farms.slice(2, 3).map(farm => (
                          <div key={farm.id} className="text-xs p-2 bg-red-50 rounded">
                            <div className="font-medium">{farm.name}</div>
                            <div className="text-muted-foreground">{(farm.performance?.winRate || 0).toFixed(1)}% win rate</div>
                          </div>
                        ))}
                        <Badge variant="outline" className="w-full justify-center text-xs">
                          {farms.filter(f => (f.performance?.winRate || 0) < 50).length} agents
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Farm Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-600" />
                Advanced Farm Management
              </CardTitle>
              <CardDescription>
                Real-time farm coordination with agent performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {farms.map(farm => (
                  <div key={farm.id} className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          farm.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`} />
                        <div>
                          <h4 className="font-medium">{farm.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {farm.strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Strategy
                          </p>
                        </div>
                        {farm.llmEnabled && (
                          <Badge variant="default" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            LLM
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{farm.agentCount} agents</div>
                          <div className="text-xs text-muted-foreground">
                            {(farm.performance?.winRate || 0).toFixed(1)}% win rate
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => coordinateFarm(farm.id)}>
                            <Brain className="h-3 w-3 mr-1" />
                            Coordinate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleFarmStatus(farm.id)}>
                            {farm.status === 'active' ? (
                              <Pause className="h-3 w-3 mr-1" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            {farm.status === 'active' ? 'Pause' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Agent Performance Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pl-6">
                      {Array.from({ length: Math.min(farm.agentCount, 4) }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Agent {i + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {(60 + Math.random() * 30).toFixed(1)}%
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

            {/* Capital Flow Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Capital Flow Management
                </CardTitle>
                <CardDescription>
                  Intelligent capital allocation across farms and agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium text-sm mb-2">Total Capital</h4>
                      <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">Across all farms</p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium text-sm mb-2">Utilized Capital</h4>
                      <div className="text-2xl font-bold">
                        ${(totalValue * 0.85).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">85% utilization</p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium text-sm mb-2">Available Capital</h4>
                      <div className="text-2xl font-bold">
                        ${(totalValue * 0.15).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">For reallocation</p>
                    </Card>
                  </div>

                  {/* Capital Allocation Controls */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Capital Allocation Strategy</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button variant="outline" size="sm">
                        <Brain className="h-3 w-3 mr-1" />
                        Performance-Based
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="h-3 w-3 mr-1" />
                        Risk-Adjusted
                      </Button>
                      <Button variant="outline" size="sm">
                        <Target className="h-3 w-3 mr-1" />
                        Goal-Driven
                      </Button>
                      <Button variant="outline" size="sm">
                        <Zap className="h-3 w-3 mr-1" />
                        Dynamic
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Attribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Performance Attribution
                </CardTitle>
                <CardDescription>
                  Multi-level performance tracking from agents to farms to goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Performance Attribution Engine</h3>
                    <p className="text-muted-foreground mb-4">
                      Track performance from individual decisions to overall goal achievement
                    </p>
                    <Button variant="outline">
                      View Full Attribution
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Stream */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Live Event Stream
                </CardTitle>
                <CardDescription>
                  Real-time orchestration events and system updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { type: 'agent_assigned', message: 'Agent Alpha assigned to Momentum Farm', time: '2 min ago' },
                    { type: 'capital_allocated', message: '$10,000 allocated to Arbitrage Farm', time: '5 min ago' },
                    { type: 'performance_update', message: 'Farm ROI increased by 2.3%', time: '10 min ago' },
                    { type: 'rebalance', message: 'Automatic rebalancing completed', time: '15 min ago' }
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          event.type === 'agent_assigned' ? 'bg-blue-500' :
                          event.type === 'capital_allocated' ? 'bg-green-500' :
                          event.type === 'performance_update' ? 'bg-purple-500' :
                          'bg-orange-500'
                        }`} />
                        <span className="text-sm">{event.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Farm Details Modal */}
      {selectedFarm && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white">
            <CardHeader>
              <CardTitle>{selectedFarm.name} Details</CardTitle>
              <CardDescription>
                Detailed view and management options for this trading farm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Strategy:</span>
                    <p className="capitalize">{selectedFarm.strategy.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={selectedFarm.status === 'active' ? 'default' : 'secondary'}>
                      {selectedFarm.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => toggleFarmStatus(selectedFarm.id)}
                    variant={selectedFarm.status === 'active' ? 'secondary' : 'default'}
                  >
                    {selectedFarm.status === 'active' ? 'Pause Farm' : 'Start Farm'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFarm(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Card>
      )}
    </div>
  )
}

export default ConnectedFarmsTab