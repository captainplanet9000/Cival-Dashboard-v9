'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bot,
  Target,
  BarChart3,
  Users,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  MarketPrice,
  Order,
  Position
} from '@/lib/trading/real-paper-trading-engine'

interface RealTimeDashboardProps {
  className?: string
}

interface DashboardMetrics {
  totalPortfolioValue: number
  totalPnL: number
  totalAgents: number
  activeAgents: number
  totalTrades: number
  avgWinRate: number
  totalPositions: number
  dailyPnL: number
  weeklyPnL: number
  monthlyPnL: number
}

interface PerformanceData {
  time: string
  portfolioValue: number
  pnl: number
  trades: number
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export function RealTimeDashboard({ className }: RealTimeDashboardProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Load initial data
    loadDashboardData()

    // Set up real-time listeners
    const handlePricesUpdated = (prices: MarketPrice[]) => {
      setMarketPrices(prices)
      setLastUpdate(new Date())
      if (isLive) {
        loadDashboardData()
      }
    }

    const handleOrderFilled = () => {
      setTimeout(() => {
        if (isLive) {
          loadDashboardData()
        }
      }, 1000)
    }

    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)
    paperTradingEngine.on('orderFilled', handleOrderFilled)

    // Update dashboard every 5 seconds if live
    const interval = setInterval(() => {
      if (isLive) {
        loadDashboardData()
      }
    }, 5000)

    return () => {
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      paperTradingEngine.off('orderFilled', handleOrderFilled)
      clearInterval(interval)
    }
  }, [isLive])

  const loadDashboardData = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)

    if (allAgents.length > 0) {
      // Calculate comprehensive metrics
      const totalPortfolioValue = allAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
      const initialValue = allAgents.length * 10000 // Assuming 10k initial per agent
      const totalPnL = totalPortfolioValue - initialValue
      const activeAgents = allAgents.filter(a => a.status === 'active').length
      const totalTrades = allAgents.reduce((sum, agent) => sum + (agent.performance.totalTrades || 0), 0)
      const avgWinRate = allAgents.reduce((sum, agent) => sum + (agent.performance.winRate || 0), 0) / allAgents.length
      const totalPositions = allAgents.reduce((sum, agent) => sum + agent.portfolio.positions.length, 0)

      // Mock time-based P&L (in real system, would track historical data)
      const dailyPnL = totalPnL * 0.1 + (Math.random() - 0.5) * 100
      const weeklyPnL = totalPnL * 0.3 + (Math.random() - 0.5) * 300
      const monthlyPnL = totalPnL * 0.8 + (Math.random() - 0.5) * 500

      const dashboardMetrics: DashboardMetrics = {
        totalPortfolioValue,
        totalPnL,
        totalAgents: allAgents.length,
        activeAgents,
        totalTrades,
        avgWinRate,
        totalPositions,
        dailyPnL,
        weeklyPnL,
        monthlyPnL
      }

      setMetrics(dashboardMetrics)

      // Generate performance timeline data
      const newPerformanceData: PerformanceData[] = []
      const now = new Date()
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000) // 24 hours of hourly data
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        
        // Simulate portfolio growth over time
        const baseValue = initialValue
        const growthFactor = 1 + (totalPnL / initialValue) * (1 - i / 24)
        const variance = (Math.random() - 0.5) * 0.02 // 2% variance
        const portfolioValue = baseValue * growthFactor * (1 + variance)
        
        newPerformanceData.push({
          time: timeStr,
          portfolioValue,
          pnl: portfolioValue - baseValue,
          trades: Math.floor(totalTrades * (1 - i / 24))
        })
      }
      
      setPerformanceData(newPerformanceData)
    }
  }

  const getStrategyDistribution = () => {
    if (agents.length === 0) return []
    
    const strategyGroups: Record<string, number> = {}
    agents.forEach(agent => {
      const strategy = agent.strategy.type
      strategyGroups[strategy] = (strategyGroups[strategy] || 0) + 1
    })

    return Object.entries(strategyGroups).map(([strategy, count], index) => ({
      name: strategy.charAt(0).toUpperCase() + strategy.slice(1),
      value: count,
      fill: COLORS[index % COLORS.length]
    }))
  }

  const getTopPerformers = () => {
    return agents
      .filter(agent => agent.performance.totalTrades && agent.performance.totalTrades > 0)
      .sort((a, b) => (b.portfolio.totalValue - 10000) - (a.portfolio.totalValue - 10000))
      .slice(0, 5)
  }

  if (!metrics) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading real-time dashboard...</p>
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Trading Agents</h3>
        <p className="text-gray-600 mb-4">Create trading agents to see live dashboard data</p>
        <Button>Create Your First Agent</Button>
      </div>
    )
  }

  const strategyDistribution = getStrategyDistribution()
  const topPerformers = getTopPerformers()

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Live Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Activity className="h-6 w-6 mr-2 text-green-600" />
              Real-Time Trading Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-600">
                {isLive ? 'Live Updates' : 'Paused'}
              </span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            
            <Button size="sm" onClick={loadDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics.totalPortfolioValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center">
                {metrics.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.activeAgents}/{metrics.totalAgents}
                  </p>
                </div>
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Progress 
                  value={(metrics.activeAgents / metrics.totalAgents) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalTrades}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  Avg Win Rate: {metrics.avgWinRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Positions</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalPositions}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2">
                <Badge variant="outline">
                  {metrics.totalPositions > 0 ? 'Active Trading' : 'No Positions'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value: number, name: string) => [
                      name === 'portfolioValue' ? `$${value.toFixed(2)}` : value,
                      name === 'portfolioValue' ? 'Portfolio Value' : 'P&L'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={strategyDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {strategyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.length > 0 ? (
                  topPerformers.map((agent, index) => {
                    const pnl = agent.portfolio.totalValue - 10000
                    const pnlPercent = (pnl / 10000) * 100
                    
                    return (
                      <div key={agent.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-gray-600">{agent.strategy.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-gray-600 py-4">
                    No trading data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-16 flex flex-col items-center justify-center">
                <Bot className="h-6 w-6 mb-1" />
                <span className="text-xs">Create Agent</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <DollarSign className="h-6 w-6 mb-1" />
                <span className="text-xs">Place Order</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <BarChart3 className="h-6 w-6 mb-1" />
                <span className="text-xs">View Analytics</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <Shield className="h-6 w-6 mb-1" />
                <span className="text-xs">Risk Monitor</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RealTimeDashboard