'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  Activity,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { StrategyOptimizationDashboard } from '@/components/strategy/StrategyOptimizationDashboard'
import { StrategyLearningTracker } from '@/components/strategy/StrategyLearningTracker'
import StrategyPerformancePanel from '@/components/strategy/StrategyPerformancePanel'
import StrategySignalFeed from '@/components/strategy/StrategySignalFeed'
import { agentMarketDataService } from '@/lib/agents/agent-market-data-service'
import { StrategyType } from '@/lib/supabase/strategy-service'

export default function StrategyAnalyticsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType | ''>('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [systemHealth, setSystemHealth] = useState({
    strategyService: 'operational',
    database: 'operational',
    analytics: 'operational',
    websocket: 'operational'
  })

  // Mock agent data - in production this would come from your agent registry
  const [availableAgents] = useState([
    { id: 'agent-001', name: 'Primary Trading Agent', status: 'active' },
    { id: 'agent-002', name: 'Market Maker Bot', status: 'active' },
    { id: 'agent-003', name: 'Arbitrage Hunter', status: 'active' },
    { id: 'agent-004', name: 'Trend Follower', status: 'active' },
    { id: 'agent-005', name: 'Mean Reversion Bot', status: 'active' }
  ])

  const strategies: { type: StrategyType; name: string; description: string }[] = [
    {
      type: 'darvas_box',
      name: 'Darvas Box',
      description: 'Breakout strategy based on box formations and volume'
    },
    {
      type: 'williams_alligator',
      name: 'Williams Alligator',
      description: 'Trend-following strategy using moving averages'
    },
    {
      type: 'elliott_wave',
      name: 'Elliott Wave',
      description: 'Pattern recognition for wave analysis'
    },
    {
      type: 'heikin_ashi',
      name: 'Heikin Ashi',
      description: 'Candlestick analysis for trend identification'
    },
    {
      type: 'renko_breakout',
      name: 'Renko',
      description: 'Brick-based price movement analysis'
    }
  ]

  useEffect(() => {
    initializeAnalytics()
  }, [])

  const initializeAnalytics = async () => {
    try {
      setIsLoading(true)
      
      // Check system health
      await checkSystemHealth()
      
      // Set default agent if available
      if (availableAgents.length > 0) {
        setSelectedAgent(availableAgents[0].id)
      }
      
    } catch (error) {
      console.error('Failed to initialize analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkSystemHealth = async () => {
    try {
      // Check if we can access the market data service
      const healthCheck = await agentMarketDataService.getCurrentPrices('system', ['BTC'])
      
      setSystemHealth({
        strategyService: 'operational',
        database: healthCheck.success ? 'operational' : 'degraded',
        analytics: 'operational',
        websocket: 'operational'
      })
    } catch (error) {
      console.error('Health check failed:', error)
      setSystemHealth({
        strategyService: 'degraded',
        database: 'degraded',
        analytics: 'degraded',
        websocket: 'degraded'
      })
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800'
      case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'down': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Strategy Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive analysis and optimization of AI trading strategies
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Agent:</span>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Agents</option>
                {availableAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Strategy:</span>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as StrategyType)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Strategies</option>
                {strategies.map(strategy => (
                  <option key={strategy.type} value={strategy.type}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={checkSystemHealth}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Activity className="w-5 h-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Strategy Service</span>
                <Badge className={`text-xs ${getHealthColor(systemHealth.strategyService)}`}>
                  {systemHealth.strategyService}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Database</span>
                <Badge className={`text-xs ${getHealthColor(systemHealth.database)}`}>
                  {systemHealth.database}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Analytics</span>
                <Badge className={`text-xs ${getHealthColor(systemHealth.analytics)}`}>
                  {systemHealth.analytics}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">WebSocket</span>
                <Badge className={`text-xs ${getHealthColor(systemHealth.websocket)}`}>
                  {systemHealth.websocket}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Learning
            </TabsTrigger>
            <TabsTrigger value="signals" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Signals
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StrategyPerformancePanel />
              <StrategySignalFeed />
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <StrategyOptimizationDashboard 
              agentId={selectedAgent || undefined}
              refreshInterval={30000}
            />
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="space-y-6">
            <StrategyLearningTracker 
              agentId={selectedAgent || undefined}
              strategyType={selectedStrategy || undefined}
              refreshInterval={30000}
            />
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <StrategySignalFeed />
            </div>
          </TabsContent>
        </Tabs>

        {/* Strategy Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Strategy Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map(strategy => (
                <div key={strategy.type} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{strategy.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {strategy.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStrategy(strategy.type)}
                    >
                      Analyze
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStrategy(strategy.type)
                        setActiveTab('optimization')
                      }}
                    >
                      Optimize
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}