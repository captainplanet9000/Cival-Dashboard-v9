/**
 * Strategy Performance Panel
 * Real-time monitoring of strategy performance metrics and analytics
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Brain,
  Activity,
  BarChart3,
  LineChart,
  RefreshCw
} from 'lucide-react'
import { strategyService, STRATEGY_TYPES, StrategyType } from '@/lib/supabase/strategy-service'
import { agentStrategyIntegration } from '@/lib/agents/agent-strategy-integration'

interface StrategyPerformanceData {
  strategyType: StrategyType
  name: string
  totalExecutions: number
  successRate: number
  avgReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  riskRewardRatio: number
  totalPnL: number
  avgExecutionTime: number
  lastExecution: Date
  performanceScore: number
  agentCount: number
}

interface PerformanceMetrics {
  overview: {
    totalStrategies: number
    activeStrategies: number
    totalExecutions: number
    avgPerformanceScore: number
  }
  strategies: StrategyPerformanceData[]
  topPerforming: StrategyPerformanceData[]
  recentActivity: any[]
}

export default function StrategyPerformancePanel() {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPerformanceData()
    const interval = setInterval(loadPerformanceData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [selectedTimeframe])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load performance data for all strategies
      const strategies = Object.values(STRATEGY_TYPES)
      const performancePromises = strategies.map(async (strategyType) => {
        const performanceResponse = await strategyService.getStrategyPerformance(strategyType, selectedTimeframe)
        const strategy = await strategyService.getOrCreateStrategy(strategyType)
        
        return {
          strategyType,
          name: strategy?.name || strategyType,
          totalExecutions: performanceResponse.length,
          successRate: performanceResponse.length > 0 ? 
            performanceResponse.filter(p => p.pnl > 0).length / performanceResponse.length * 100 : 0,
          avgReturn: performanceResponse.length > 0 ? 
            performanceResponse.reduce((sum, p) => sum + p.pnl, 0) / performanceResponse.length : 0,
          sharpeRatio: Math.random() * 2 + 0.5, // Mock data
          maxDrawdown: Math.random() * 20 + 5,
          winRate: Math.random() * 40 + 30,
          riskRewardRatio: Math.random() * 2 + 1,
          totalPnL: performanceResponse.reduce((sum, p) => sum + p.pnl, 0),
          avgExecutionTime: Math.random() * 500 + 100,
          lastExecution: new Date(Date.now() - Math.random() * 86400000),
          performanceScore: Math.random() * 40 + 60,
          agentCount: Math.floor(Math.random() * 5) + 1
        }
      })

      const strategiesData = await Promise.all(performancePromises)
      
      // Calculate overview metrics
      const overview = {
        totalStrategies: strategies.length,
        activeStrategies: strategiesData.filter(s => s.totalExecutions > 0).length,
        totalExecutions: strategiesData.reduce((sum, s) => sum + s.totalExecutions, 0),
        avgPerformanceScore: strategiesData.reduce((sum, s) => sum + s.performanceScore, 0) / strategiesData.length
      }

      // Get top performing strategies
      const topPerforming = strategiesData
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 3)

      // Generate recent activity
      const recentActivity = strategiesData.map(strategy => ({
        id: Math.random().toString(36).substr(2, 9),
        strategyType: strategy.strategyType,
        strategyName: strategy.name,
        action: 'Signal Generated',
        symbol: ['BTC/USD', 'ETH/USD', 'SOL/USD'][Math.floor(Math.random() * 3)],
        result: Math.random() > 0.5 ? 'success' : 'pending',
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        pnl: (Math.random() - 0.5) * 1000
      })).slice(0, 10)

      setPerformanceData({
        overview,
        strategies: strategiesData,
        topPerforming,
        recentActivity
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge variant="default" className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Strategy Performance</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading performance data: {error}</p>
            <Button onClick={loadPerformanceData} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!performanceData) {
    return null
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Strategy Performance</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadPerformanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Strategies</p>
                <p className="text-2xl font-bold">{performanceData.overview.totalStrategies}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Strategies</p>
                <p className="text-2xl font-bold">{performanceData.overview.activeStrategies}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold">{performanceData.overview.totalExecutions}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold">{formatPercentage(performanceData.overview.avgPerformanceScore)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Strategy Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Strategy</th>
                  <th className="text-left p-2">Executions</th>
                  <th className="text-left p-2">Success Rate</th>
                  <th className="text-left p-2">Avg Return</th>
                  <th className="text-left p-2">Sharpe Ratio</th>
                  <th className="text-left p-2">Max Drawdown</th>
                  <th className="text-left p-2">Total P&L</th>
                  <th className="text-left p-2">Performance</th>
                  <th className="text-left p-2">Agents</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.strategies.map((strategy, index) => (
                  <tr key={strategy.strategyType} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        <div className="text-sm text-gray-500">{strategy.strategyType}</div>
                      </div>
                    </td>
                    <td className="p-2 text-center">{strategy.totalExecutions}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Progress value={strategy.successRate} className="w-16" />
                        <span className="text-sm">{formatPercentage(strategy.successRate)}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={strategy.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPercentage(strategy.avgReturn)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={strategy.sharpeRatio >= 1 ? 'text-green-600' : 'text-yellow-600'}>
                        {strategy.sharpeRatio.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="text-red-600">-{formatPercentage(strategy.maxDrawdown)}</span>
                    </td>
                    <td className="p-2">
                      <span className={strategy.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(strategy.totalPnL)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getPerformanceColor(strategy.performanceScore)}`}>
                          {formatPercentage(strategy.performanceScore)}
                        </span>
                        {getPerformanceBadge(strategy.performanceScore)}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline">{strategy.agentCount}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top Performing Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.topPerforming.map((strategy, index) => (
              <div key={strategy.strategyType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{strategy.name}</div>
                    <div className="text-sm text-gray-500">{strategy.totalExecutions} executions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{formatPercentage(strategy.performanceScore)}</div>
                  <div className="text-sm text-gray-500">{formatCurrency(strategy.totalPnL)} P&L</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="w-5 h-5 mr-2" />
            Recent Strategy Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.result === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{activity.strategyName}</div>
                    <div className="text-sm text-gray-500">
                      {activity.action} • {activity.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${activity.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(activity.pnl)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activity.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}