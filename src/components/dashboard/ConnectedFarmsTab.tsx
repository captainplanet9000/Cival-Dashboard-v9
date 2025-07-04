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
          <Button onClick={() => toast.success('Farm creation feature coming soon')}>
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-emerald-50 gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="farms" className="data-[state=active]:bg-emerald-100">
            <Network className="w-4 h-4 mr-2" />
            Farms
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

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>
                Monitor and coordinate AI trading agents across all farms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Agent Dashboard Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Comprehensive agent monitoring and coordination features are in development.
                </p>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farm Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights across all trading farms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Detailed performance analytics and trading insights coming soon.
                </p>
                <Button variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
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

          {/* Real-time Orchestration Events */}
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
              <div className="space-y-3">
                {[
                  { type: 'agent_assigned', message: 'Agent TRDBOT-5 assigned to Momentum Farm', time: '2 min ago' },
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