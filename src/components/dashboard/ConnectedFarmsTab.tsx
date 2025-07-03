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
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
// Import shared data manager to prevent duplicate requests
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'

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
    farms: realtimeFarms,
    totalFarms,
    activeFarms,
    farmTotalValue: totalValue,
    agents: realtimeAgents,
    totalPnL,
    agentsConnected,
    farmsConnected
  } = useSharedRealtimeData()

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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-emerald-50 gap-1">
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
        </TabsList>

        {/* Overview Tab - Enhanced Farm Statistics */}
        <TabsContent value="overview" className="space-y-4">
          {/* Farm Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={loading ? 'opacity-50' : ''}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Active Farms</CardTitle>
                <div className={`w-2 h-2 rounded-full ${activeFarms > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeFarms}</div>
                <p className="text-xs text-muted-foreground">
                  {totalFarms} total farms
                </p>
              </CardContent>
            </Card>
            
            <Card className={loading ? 'opacity-50' : ''}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Total Agents</CardTitle>
                <div className={`w-2 h-2 rounded-full ${agentsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {farms.reduce((sum, farm) => sum + (farm.agentCount || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {farms.reduce((sum, farm) => sum + (farm.performance?.activeAgents || 0), 0)} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Combined P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
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
                  {(averageWinRate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average win rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Farm Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Farm Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Farm Performance Chart</h3>
                  <p className="text-muted-foreground">
                    Interactive chart showing farm performance, P&L trends, and strategy comparison
                  </p>
                </div>
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