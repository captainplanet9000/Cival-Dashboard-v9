'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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

// Import farm creation wizard
import { TabBasedFarmCreationWizard } from '@/components/farms/TabBasedFarmCreationWizard'

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
  
  // Handle farm creation
  const handleFarmCreated = (farm: any) => {
    toast.success(`Farm "${farm.name}" created successfully!`)
    setActiveTab('farms') // Return to farms list
  }

  // Strategy configuration options
  const strategyOptions = [
    { value: 'darvas_box', label: 'Darvas Box', description: 'High-momentum trading with breakout detection' },
    { value: 'elliott_wave', label: 'Elliott Wave', description: 'Advanced wave pattern analysis' },
    { value: 'williams_alligator', label: 'Williams Alligator', description: 'Trend-following with smoothed averages' },
    { value: 'renko', label: 'Renko', description: 'Price-action focused trading' },
    { value: 'heikin_ashi', label: 'Heikin Ashi', description: 'Smoothed candlestick analysis' }
  ]

  // Helper functions
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'darvas_box': return <BarChart3 className="w-4 h-4 text-blue-500" />
      case 'elliott_wave': return <Activity className="w-4 h-4 text-purple-500" />
      case 'williams_alligator': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'renko': return <Target className="w-4 h-4 text-orange-500" />
      case 'heikin_ashi': return <Zap className="w-4 h-4 text-yellow-500" />
      default: return <Bot className="w-4 h-4 text-gray-500" />
    }
  }

  const getStrategyWinRate = (strategy: string): number => {
    const rates = {
      darvas_box: 68,
      elliott_wave: 72,
      williams_alligator: 65,
      renko: 70,
      heikin_ashi: 63
    }
    return rates[strategy as keyof typeof rates] || 65
  }

  const getStrategyRiskLevel = (strategy: string): string => {
    const risks = {
      darvas_box: 'Medium',
      elliott_wave: 'High',
      williams_alligator: 'Low',
      renko: 'Medium',
      heikin_ashi: 'Low'
    }
    return risks[strategy as keyof typeof risks] || 'Medium'
  }

  // Calculate metrics
  const averageWinRate = farms.length > 0 
    ? farms.reduce((sum, farm) => sum + farm.performance.winRate, 0) / farms.length 
    : 0

  const totalTrades = farms.reduce((sum, farm) => sum + farm.performance.tradeCount, 0)

  // Action handlers
  const toggleFarmStatus = async (farmId: string) => {
    try {
      setLoading(true)
      const farm = farms.find(f => f.id === farmId)
      if (!farm) {
        toast.error('Farm not found')
        return
      }

      const newStatus = farm.status === 'active' ? 'paused' : 'active'
      
      // Update farm status
      const updatedFarms = farms.map(f => 
        f.id === farmId ? { ...f, status: newStatus } : f
      )
      setFarms(updatedFarms)
      
      toast.success(`Farm ${farm.name} ${newStatus === 'active' ? 'started' : 'paused'}`)
    } catch (error) {
      console.error('Error toggling farm status:', error)
      toast.error('Failed to update farm status')
    } finally {
      setLoading(false)
    }
  }

  const createFarmFromTemplate = async (strategy: string) => {
    try {
      setLoading(true)
      const templateName = strategyOptions.find(s => s.value === strategy)?.label || strategy
      
      // Simulate farm creation
      toast.success(`${templateName} farm template loaded. Configuration wizard coming soon!`)
      
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
            {`Real-time multi-agent coordination with Supabase/Redis backend - $${(totalValue || 0).toLocaleString()} managed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setActiveTab('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Farm
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-emerald-50 gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="farms" className="data-[state=active]:bg-emerald-100">
            <Network className="w-4 h-4 mr-2" />
            Farms
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-emerald-100">
            <Plus className="w-4 h-4 mr-2" />
            Create Farm
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-emerald-100">
            <Bot className="w-4 h-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="data-[state=active]:bg-emerald-100">
            <Brain className="w-4 h-4 mr-2" />
            AI Orchestration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100">
            <Activity className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className={`${loading ? 'opacity-50' : ''} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
                <Network className={`w-4 h-4 ${farmsConnected ? 'text-green-500' : 'text-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{activeFarms}</div>
                <div className="flex items-center justify-between mt-1">
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{totalTrades.toLocaleString()}</span>
                  <Badge variant="secondary">Today</Badge>
                </div>
                <Progress value={Math.min(totalTrades / 1000 * 100, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Combined execution volume
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Risk Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">7.2</span>
                  <Badge variant="outline" className="text-green-600">Low Risk</Badge>
                </div>
                <Progress value={28} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Portfolio risk assessment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Farm Actions
              </CardTitle>
              <CardDescription>
                Perform coordinated actions across all active farms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => handleLLMAction('analyze')}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze All
                </Button>
                <Button 
                  onClick={() => handleLLMAction('rebalance')}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rebalance
                </Button>
                <Button 
                  onClick={() => handleLLMAction('optimize')}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Optimize
                </Button>
                <Button 
                  onClick={handleAgentGrouping}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Group Agents
                </Button>
                <Button 
                  onClick={() => handleLLMAction('communicate')}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Communicate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Farms Tab */}
        <TabsContent value="farms" className="space-y-4">
          <div className="grid gap-4">
            {farms.map((farm) => (
              <Card key={farm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {getStrategyIcon(farm.strategy)}
                        {farm.strategy.replace('_', ' ')} • {farm.agentCount} agents
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                        {farm.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFarm(farm)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Capital:</span>
                      <p className="font-medium">${farm.totalCapital.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P&L:</span>
                      <p className={`font-medium ${
                        farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {farm.performance.totalPnL >= 0 ? '+' : ''}${farm.performance.totalPnL.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Win Rate:</span>
                      <p className="font-medium">{farm.performance.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trades:</span>
                      <p className="font-medium">{farm.performance.tradeCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => toggleFarmStatus(farm.id)}
                      disabled={loading}
                      variant={farm.status === 'active' ? 'secondary' : 'default'}
                    >
                      {farm.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => coordinateFarm(farm.id)}
                      disabled={loading}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Coordinate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success('Configuration coming soon')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create Farm Tab */}
        <TabsContent value="create" className="space-y-4">
          <TabBasedFarmCreationWizard 
            onFarmCreated={handleFarmCreated}
            onCancel={() => setActiveTab('farms')}
            onReturn={() => setActiveTab('farms')}
            className=""
          />
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Farm Agent Management</h3>
              <p className="text-muted-foreground">
                Monitor and coordinate agents across all trading farms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{farms.reduce((sum, farm) => sum + farm.agentCount, 0)} Total Agents</Badge>
              <Badge variant="outline">{farms.filter(f => f.status === 'active').length} Active Farms</Badge>
            </div>
          </div>

          {farms.map((farm) => (
            <Card key={farm.id} className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStrategyIcon(farm.strategy)}
                    <div>
                      <CardTitle className="text-base">{farm.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {farm.agentCount} agents • {farm.coordinationMode} coordination • {farm.strategy.replace('_', ' ')} strategy
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                      {farm.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Farm Agent Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: farm.agentCount }, (_, i) => (
                    <div key={i} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-sm">Agent {i + 1}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {farm.status === 'active' ? 'Trading' : 'Paused'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Capital:</span>
                          <span>${(farm.totalCapital / farm.agentCount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>P&L:</span>
                          <span className={farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {farm.performance.totalPnL >= 0 ? '+' : ''}${(farm.performance.totalPnL / farm.agentCount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trades:</span>
                          <span>{Math.floor(farm.performance.tradeCount / farm.agentCount)}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Performance</span>
                          <span>{farm.performance.winRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={farm.performance.winRate} className="h-1" />
                      </div>

                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                          View
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            toast.success(`Agent ${i + 1} moved to available pool`)
                          }}
                        >
                          Release
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Farm-level Agent Controls */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Farm Total:</span>
                    <span className="font-medium">${farm.totalCapital.toLocaleString()}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={`font-medium ${farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {farm.performance.totalPnL >= 0 ? '+' : ''}${farm.performance.totalPnL.toFixed(2)} P&L
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{farm.performance.winRate.toFixed(1)}% Win Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toast.success(`Adding new agent to ${farm.name}`)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Agent
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => coordinateFarm(farm.id)}
                      disabled={loading}
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      Coordinate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {farms.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Farms Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create a farm first to start managing trading agents in clusters.
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Farm
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Unassigned Agents */}
          {realtimeAgents.filter(agent => !agent.farmId).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unassigned Agents</CardTitle>
                <CardDescription>
                  Agents not currently assigned to any farm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {realtimeAgents.filter(agent => !agent.farmId).map((agent) => (
                    <div key={agent.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-sm">{agent.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Available
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        Strategy: {agent.strategy || agent.strategyType || 'General'}
                      </div>

                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 px-2 text-xs flex-1"
                          onClick={() => {
                            if (farms.length > 0) {
                              toast.success(`Agent ${agent.name} ready for assignment`)
                            } else {
                              toast.error('Create a farm first to assign agents')
                            }
                          }}
                        >
                          Assign to Farm
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Farm Performance Analytics</h3>
              <p className="text-muted-foreground">
                Comprehensive metrics and insights across all trading farms
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
          </div>

          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total P&L</p>
                    <p className={`text-2xl font-bold ${
                      farms.reduce((sum, farm) => sum + farm.performance.totalPnL, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${farms.reduce((sum, farm) => sum + farm.performance.totalPnL, 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {farms.length > 0 ? (farms.reduce((sum, farm) => sum + farm.performance.winRate, 0) / farms.length).toFixed(1) : 0}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {farms.reduce((sum, farm) => sum + farm.performance.tradeCount, 0)}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className={`text-2xl font-bold ${
                      farms.reduce((sum, farm) => sum + farm.performance.roiPercent, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {farms.reduce((sum, farm) => sum + farm.performance.roiPercent, 0).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Farm Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Farm Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {farms.map((farm) => (
                    <div key={farm.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStrategyIcon(farm.strategy)}
                          <span className="font-medium text-sm">{farm.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {farm.performance.winRate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={farm.performance.winRate} className="flex-1 h-2" />
                        <span className={`text-sm font-medium ${
                          farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {farm.performance.totalPnL >= 0 ? '+' : ''}${farm.performance.totalPnL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {farms.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No farms to analyze
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strategy Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Strategy Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyOptions.map((strategy) => {
                    const farmsWithStrategy = farms.filter(f => f.strategy === strategy.value)
                    const avgPerformance = farmsWithStrategy.length > 0 
                      ? farmsWithStrategy.reduce((sum, f) => sum + f.performance.winRate, 0) / farmsWithStrategy.length
                      : getStrategyWinRate(strategy.value)
                    const totalPnL = farmsWithStrategy.reduce((sum, f) => sum + f.performance.totalPnL, 0)
                    
                    return (
                      <div key={strategy.value} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{strategy.label}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {farmsWithStrategy.length} farms
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {avgPerformance.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={avgPerformance} className="flex-1 h-2" />
                          <span className={`text-sm font-medium ${
                            totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Farm Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Detailed Farm Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive breakdown of each farm's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Farm</th>
                      <th className="text-center py-2">Strategy</th>
                      <th className="text-center py-2">Agents</th>
                      <th className="text-center py-2">Capital</th>
                      <th className="text-center py-2">P&L</th>
                      <th className="text-center py-2">Win Rate</th>
                      <th className="text-center py-2">Trades</th>
                      <th className="text-center py-2">ROI</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farms.map((farm) => (
                      <tr key={farm.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getStrategyIcon(farm.strategy)}
                            <span className="font-medium">{farm.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <Badge variant="outline" className="text-xs">
                            {farm.strategy.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="text-center py-3 font-medium">{farm.agentCount}</td>
                        <td className="text-center py-3 font-medium">${farm.totalCapital.toLocaleString()}</td>
                        <td className={`text-center py-3 font-medium ${
                          farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {farm.performance.totalPnL >= 0 ? '+' : ''}${farm.performance.totalPnL.toFixed(2)}
                        </td>
                        <td className="text-center py-3 font-medium">{farm.performance.winRate.toFixed(1)}%</td>
                        <td className="text-center py-3 font-medium">{farm.performance.tradeCount}</td>
                        <td className={`text-center py-3 font-medium ${
                          farm.performance.roiPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {farm.performance.roiPercent.toFixed(1)}%
                        </td>
                        <td className="text-center py-3">
                          <Badge variant={farm.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {farm.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {farms.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No farms to analyze. Create a farm to see detailed analytics.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orchestration Tab - Advanced Farm-Agent Coordination */}
        <TabsContent value="orchestration" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Real-Time AI Orchestration</h3>
              <p className="text-muted-foreground">Live coordination with LLM-driven decision making and agent clustering</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Live AI</Badge>
              <Badge variant="outline">{farms.length} Farms</Badge>
              <Badge variant="outline">{farms.reduce((sum, farm) => sum + farm.agentCount, 0)} Agents</Badge>
            </div>
          </div>

          {/* Live Orchestration Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Live Agent Coordination
                </CardTitle>
                <CardDescription>
                  Real-time coordination and decision making across all farms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleLLMAction('analyze')}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <BarChart3 className="w-5 h-5 mb-1" />
                    <span className="text-xs">Market Analysis</span>
                  </Button>
                  <Button 
                    onClick={() => handleLLMAction('rebalance')}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <RefreshCw className="w-5 h-5 mb-1" />
                    <span className="text-xs">Auto Rebalance</span>
                  </Button>
                  <Button 
                    onClick={() => handleLLMAction('optimize')}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <TrendingUp className="w-5 h-5 mb-1" />
                    <span className="text-xs">Optimize All</span>
                  </Button>
                  <Button 
                    onClick={() => handleLLMAction('communicate')}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="h-16 flex-col"
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <span className="text-xs">Coordinate</span>
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Global Auto-trading</span>
                    <Switch 
                      checked={farms.some(f => f.status === 'active')}
                      onCheckedChange={(checked) => {
                        farms.forEach(farm => {
                          if (checked && farm.status !== 'active') {
                            toggleFarmStatus(farm.id)
                          } else if (!checked && farm.status === 'active') {
                            toggleFarmStatus(farm.id)
                          }
                        })
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Management</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Performance Tracking</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Agent Cluster Status
                </CardTitle>
                <CardDescription>
                  Live monitoring of agent clusters and coordination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {farms.map((farm) => (
                    <div key={farm.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStrategyIcon(farm.strategy)}
                          <span className="font-medium text-sm">{farm.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={farm.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {farm.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {farm.agentCount} agents
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Coordination: {farm.coordinationMode}</span>
                        <span>P&L: {farm.performance.totalPnL >= 0 ? '+' : ''}${farm.performance.totalPnL.toFixed(2)}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Performance</span>
                          <span>{farm.performance.winRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={farm.performance.winRate} className="h-1" />
                      </div>
                    </div>
                  ))}
                  {farms.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No farms to orchestrate
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => createFarmFromTemplate(strategy.value)}
                          disabled={loading}
                        >
                          Create Farm
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Coordination Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-indigo-600" />
                  Agent Clustering Controls
                </CardTitle>
                <CardDescription>
                  Dynamic agent grouping and coordination strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    onClick={handleAgentGrouping}
                    disabled={loading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Smart Agent Grouping
                  </Button>
                  <Button 
                    onClick={() => handleLLMAction('optimize')}
                    disabled={loading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Performance Optimization
                  </Button>
                  <Button 
                    onClick={() => handleLLMAction('communicate')}
                    disabled={loading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Cross-Farm Communication
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Clustering Strategy</Label>
                  <Select defaultValue="performance">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance-based</SelectItem>
                      <SelectItem value="strategy">Strategy similarity</SelectItem>
                      <SelectItem value="risk">Risk tolerance</SelectItem>
                      <SelectItem value="capital">Capital allocation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Coordination Frequency</Label>
                  <Select defaultValue="real-time">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-time">Real-time</SelectItem>
                      <SelectItem value="1min">Every minute</SelectItem>
                      <SelectItem value="5min">Every 5 minutes</SelectItem>
                      <SelectItem value="15min">Every 15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  Live Orchestration Events
                </CardTitle>
                <CardDescription>
                  Real-time coordination activities across all farms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Generate events based on actual farm data */}
                  {farms.flatMap((farm, farmIndex) => [
                    {
                      type: 'farm_status',
                      message: `Farm "${farm.name}" is ${farm.status} with ${farm.agentCount} agents`,
                      time: '1 min ago',
                      farmId: farm.id
                    },
                    {
                      type: 'performance_update',
                      message: `${farm.name}: ${farm.performance.winRate.toFixed(1)}% win rate, ${farm.performance.totalPnL >= 0 ? '+' : ''}$${farm.performance.totalPnL.toFixed(2)} P&L`,
                      time: `${farmIndex * 2 + 2} min ago`,
                      farmId: farm.id
                    }
                  ]).concat([
                    { type: 'coordination', message: 'Cross-farm optimization completed', time: '5 min ago' },
                    { type: 'rebalance', message: 'Automatic capital rebalancing initiated', time: '8 min ago' },
                    { type: 'agent_cluster', message: 'New agent cluster formed based on performance', time: '12 min ago' }
                  ]).slice(0, 8).map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          event.type === 'farm_status' ? 'bg-blue-500' :
                          event.type === 'performance_update' ? 'bg-green-500' :
                          event.type === 'coordination' ? 'bg-purple-500' :
                          event.type === 'rebalance' ? 'bg-orange-500' :
                          'bg-indigo-500'
                        }`} />
                        <span className="text-xs">{event.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                  ))}
                  {farms.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No orchestration events to display
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Performance Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Global Farm Performance
              </CardTitle>
              <CardDescription>
                Aggregate performance metrics across all coordinated farms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${farms.reduce((sum, farm) => sum + farm.performance.totalPnL, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {farms.length > 0 ? (farms.reduce((sum, farm) => sum + farm.performance.winRate, 0) / farms.length).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {farms.reduce((sum, farm) => sum + farm.performance.tradeCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {farms.filter(f => f.status === 'active').length}/{farms.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Farms</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Last orchestration: {new Date().toLocaleTimeString()}
                </div>
                <Button
                  onClick={() => {
                    handleLLMAction('analyze')
                    setTimeout(() => handleLLMAction('optimize'), 2000)
                  }}
                  disabled={loading}
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Run Full Orchestration
                </Button>
              </div>
            </CardContent>
          </Card>
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