'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3, TrendingUp, TrendingDown, Target, Activity,
  Brain, Zap, Award, AlertTriangle, CheckCircle2, Clock,
  DollarSign, Percent, Users, Calendar, Settings, RefreshCw,
  ArrowUp, ArrowDown, Minus, PieChart, LineChart, BarChart
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell,
  ComposedChart, Scatter, ScatterChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Agent Performance Analytics Component
 * Comprehensive performance analysis and benchmarking for AI trading agents
 * Provides detailed metrics, comparisons, and optimization insights
 */

interface PerformanceMetrics {
  agentId: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  averagePnL: number
  bestTrade: number
  worstTrade: number
  averageHoldTime: number
  sharpeRatio: number
  maxDrawdown: number
  profitFactor: number
  returnOnInvestment: number
  calmarRatio: number
  sortinoRatio: number
  informationRatio: number
  treynorRatio: number
  averageDailyReturn: number
  volatility: number
  var95: number // Value at Risk 95%
  expectedShortfall: number
  recoveryFactor: number
  ulcerIndex: number
  sterlingRatio: number
  lastUpdated: Date
}

interface TimeSeriesData {
  timestamp: Date
  portfolioValue: number
  dailyReturn: number
  cumulativeReturn: number
  drawdown: number
  rollingVolatility: number
  rollingShape: number
}

interface TradeAnalysis {
  symbol: string
  trades: number
  winRate: number
  avgPnL: number
  totalPnL: number
  sharpeRatio: number
  maxDrawdown: number
  bestStreak: number
  worstStreak: number
}

interface StrategyPerformance {
  strategyName: string
  allocatedCapital: number
  trades: number
  winRate: number
  totalPnL: number
  sharpeRatio: number
  maxDrawdown: number
  avgHoldTime: number
  profitFactor: number
  isActive: boolean
}

interface RiskMetrics {
  var95: number
  var99: number
  expectedShortfall95: number
  expectedShortfall99: number
  maxDrawdown: number
  currentDrawdown: number
  drawdownDuration: number
  recoveryTime: number
  volatility: number
  downDeviationRisk: number
  ulcerIndex: number
  calmarRatio: number
}

interface BenchmarkComparison {
  metric: string
  agentValue: number
  benchmarkValue: number
  percentile: number
  ranking: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
}

interface AgentPerformanceAnalyticsProps {
  agentId?: string
  benchmarkAgents?: string[]
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void
  onRiskAlert?: (alert: string) => void
  onBenchmarkComparison?: (comparison: BenchmarkComparison[]) => void
  isActive?: boolean
  className?: string
}

export function AgentPerformanceAnalytics({
  agentId = 'agent-001',
  benchmarkAgents = ['agent-002', 'agent-003', 'market-benchmark'],
  onPerformanceUpdate,
  onRiskAlert,
  onBenchmarkComparison,
  isActive = true,
  className
}: AgentPerformanceAnalyticsProps) {
  const [analyticsSystem, setAnalyticsSystem] = useState({
    enabled: isActive,
    realTimeUpdates: true,
    benchmarkComparison: true,
    riskMonitoring: true,
    performanceAlerts: true,
    detailedAnalytics: true,
    autoReporting: true,
    updateInterval: 60000 // 1 minute
  })

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    agentId,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    averagePnL: 0,
    bestTrade: 0,
    worstTrade: 0,
    averageHoldTime: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    profitFactor: 0,
    returnOnInvestment: 0,
    calmarRatio: 0,
    sortinoRatio: 0,
    informationRatio: 0,
    treynorRatio: 0,
    averageDailyReturn: 0,
    volatility: 0,
    var95: 0,
    expectedShortfall: 0,
    recoveryFactor: 0,
    ulcerIndex: 0,
    sterlingRatio: 0,
    lastUpdated: new Date()
  })

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [tradeAnalysis, setTradeAnalysis] = useState<TradeAnalysis[]>([])
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    var95: 0,
    var99: 0,
    expectedShortfall95: 0,
    expectedShortfall99: 0,
    maxDrawdown: 0,
    currentDrawdown: 0,
    drawdownDuration: 0,
    recoveryTime: 0,
    volatility: 0,
    downDeviationRisk: 0,
    ulcerIndex: 0,
    calmarRatio: 0
  })

  const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparison[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  // Generate mock performance data
  const generateMockPerformanceData = () => {
    // Generate time series data
    const timeSeriesData: TimeSeriesData[] = []
    let portfolioValue = 100000
    let cumulativeReturn = 0
    let maxValue = portfolioValue
    
    for (let i = 0; i < 90; i++) {
      const dailyReturn = (Math.random() - 0.45) * 0.03 // Slightly positive bias
      portfolioValue *= (1 + dailyReturn)
      cumulativeReturn += dailyReturn
      maxValue = Math.max(maxValue, portfolioValue)
      const drawdown = (maxValue - portfolioValue) / maxValue * 100
      
      timeSeriesData.push({
        timestamp: new Date(Date.now() - (90 - i) * 24 * 60 * 60 * 1000),
        portfolioValue,
        dailyReturn: dailyReturn * 100,
        cumulativeReturn: cumulativeReturn * 100,
        drawdown,
        rollingVolatility: (5 + Math.random() * 10),
        rollingShape: 0.8 + Math.random() * 1.4
      })
    }
    
    // Calculate performance metrics
    const totalDays = timeSeriesData.length
    const totalReturn = (portfolioValue - 100000) / 100000 * 100
    const dailyReturns = timeSeriesData.map(d => d.dailyReturn / 100)
    const avgDailyReturn = dailyReturns.reduce((acc, r) => acc + r, 0) / totalDays
    const volatility = Math.sqrt(dailyReturns.reduce((acc, r) => acc + Math.pow(r - avgDailyReturn, 2), 0) / totalDays) * Math.sqrt(252) * 100
    const sharpeRatio = (avgDailyReturn * 252) / (volatility / 100)
    const maxDrawdown = Math.max(...timeSeriesData.map(d => d.drawdown))
    
    const mockMetrics: PerformanceMetrics = {
      agentId,
      totalTrades: 847,
      winningTrades: 592,
      losingTrades: 255,
      winRate: (592 / 847) * 100,
      totalPnL: portfolioValue - 100000,
      averagePnL: (portfolioValue - 100000) / 847,
      bestTrade: 2450,
      worstTrade: -890,
      averageHoldTime: 4.7,
      sharpeRatio,
      maxDrawdown,
      profitFactor: 1.85,
      returnOnInvestment: totalReturn,
      calmarRatio: (avgDailyReturn * 252) / (maxDrawdown / 100),
      sortinoRatio: sharpeRatio * 1.2, // Typically higher than Sharpe
      informationRatio: 0.45,
      treynorRatio: 0.12,
      averageDailyReturn: avgDailyReturn * 100,
      volatility,
      var95: portfolioValue * 0.025, // 2.5% of portfolio
      expectedShortfall: portfolioValue * 0.035,
      recoveryFactor: 2.3,
      ulcerIndex: 3.8,
      sterlingRatio: 1.67,
      lastUpdated: new Date()
    }

    // Generate trade analysis by symbol
    const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'SPY']
    const mockTradeAnalysis: TradeAnalysis[] = symbols.map(symbol => ({
      symbol,
      trades: Math.floor(80 + Math.random() * 150),
      winRate: 60 + Math.random() * 30,
      avgPnL: (Math.random() - 0.3) * 200,
      totalPnL: (Math.random() - 0.3) * 15000,
      sharpeRatio: 0.5 + Math.random() * 1.5,
      maxDrawdown: 5 + Math.random() * 15,
      bestStreak: Math.floor(3 + Math.random() * 8),
      worstStreak: Math.floor(2 + Math.random() * 5)
    }))

    // Generate strategy performance
    const strategies = ['Darvas Box', 'Williams Alligator', 'Renko Breakout', 'Heikin Ashi', 'Elliott Wave']
    const mockStrategyPerformance: StrategyPerformance[] = strategies.map(strategyName => ({
      strategyName,
      allocatedCapital: 15000 + Math.random() * 25000,
      trades: Math.floor(50 + Math.random() * 200),
      winRate: 55 + Math.random() * 35,
      totalPnL: (Math.random() - 0.2) * 12000,
      sharpeRatio: 0.3 + Math.random() * 1.8,
      maxDrawdown: 3 + Math.random() * 12,
      avgHoldTime: 2 + Math.random() * 8,
      profitFactor: 1.1 + Math.random() * 1.4,
      isActive: Math.random() > 0.2
    }))

    // Generate risk metrics
    const mockRiskMetrics: RiskMetrics = {
      var95: mockMetrics.var95,
      var99: mockMetrics.var95 * 1.5,
      expectedShortfall95: mockMetrics.expectedShortfall,
      expectedShortfall99: mockMetrics.expectedShortfall * 1.4,
      maxDrawdown: mockMetrics.maxDrawdown,
      currentDrawdown: Math.random() * 5,
      drawdownDuration: Math.floor(Math.random() * 15),
      recoveryTime: Math.floor(Math.random() * 20),
      volatility: mockMetrics.volatility,
      downDeviationRisk: mockMetrics.volatility * 0.7,
      ulcerIndex: mockMetrics.ulcerIndex,
      calmarRatio: mockMetrics.calmarRatio
    }

    // Generate benchmark comparison
    const benchmarkMetrics = [
      'Win Rate', 'Sharpe Ratio', 'Max Drawdown', 'Profit Factor', 
      'Return on Investment', 'Volatility', 'Average Daily Return'
    ]
    const mockBenchmarkData: BenchmarkComparison[] = benchmarkMetrics.map(metric => {
      const percentile = 20 + Math.random() * 60 // 20-80th percentile
      const ranking = percentile >= 75 ? 'excellent' :
                     percentile >= 60 ? 'good' :
                     percentile >= 40 ? 'average' :
                     percentile >= 25 ? 'below_average' : 'poor'
      
      return {
        metric,
        agentValue: Math.random() * 100,
        benchmarkValue: Math.random() * 100,
        percentile,
        ranking
      }
    })

    setPerformanceMetrics(mockMetrics)
    setTimeSeriesData(timeSeriesData)
    setTradeAnalysis(mockTradeAnalysis)
    setStrategyPerformance(mockStrategyPerformance)
    setRiskMetrics(mockRiskMetrics)
    setBenchmarkData(mockBenchmarkData)
  }

  // Filter time series data based on selected timeframe
  const filteredTimeSeriesData = useMemo(() => {
    const now = new Date()
    const timeframeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    const days = timeframeMap[selectedTimeframe as keyof typeof timeframeMap] || 30
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    return timeSeriesData.filter(d => d.timestamp >= cutoffDate)
  }, [timeSeriesData, selectedTimeframe])

  // Calculate period-specific metrics
  const periodMetrics = useMemo(() => {
    if (filteredTimeSeriesData.length === 0) return null
    
    const firstValue = filteredTimeSeriesData[0].portfolioValue
    const lastValue = filteredTimeSeriesData[filteredTimeSeriesData.length - 1].portfolioValue
    const periodReturn = ((lastValue - firstValue) / firstValue) * 100
    const dailyReturns = filteredTimeSeriesData.map(d => d.dailyReturn / 100)
    const avgDailyReturn = dailyReturns.reduce((acc, r) => acc + r, 0) / dailyReturns.length
    const volatility = Math.sqrt(dailyReturns.reduce((acc, r) => acc + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length) * Math.sqrt(252) * 100
    const maxDrawdown = Math.max(...filteredTimeSeriesData.map(d => d.drawdown))
    
    return {
      periodReturn,
      avgDailyReturn: avgDailyReturn * 100,
      volatility,
      maxDrawdown,
      sharpeRatio: (avgDailyReturn * 252) / (volatility / 100)
    }
  }, [filteredTimeSeriesData])

  // Initialize mock data
  useEffect(() => {
    if (analyticsSystem.enabled) {
      generateMockPerformanceData()
    }
  }, [analyticsSystem.enabled, agentId])

  // Update performance metrics callback
  useEffect(() => {
    if (onPerformanceUpdate && analyticsSystem.enabled) {
      onPerformanceUpdate(performanceMetrics)
    }
  }, [performanceMetrics, onPerformanceUpdate, analyticsSystem.enabled])

  // Check for risk alerts
  useEffect(() => {
    if (onRiskAlert && analyticsSystem.riskMonitoring) {
      if (riskMetrics.currentDrawdown > 10) {
        onRiskAlert(`High drawdown detected: ${riskMetrics.currentDrawdown.toFixed(1)}%`)
      }
      if (riskMetrics.volatility > 25) {
        onRiskAlert(`High volatility detected: ${riskMetrics.volatility.toFixed(1)}%`)
      }
    }
  }, [riskMetrics, onRiskAlert, analyticsSystem.riskMonitoring])

  const toggleAnalyticsSystem = () => {
    setAnalyticsSystem(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const refreshAnalytics = () => {
    generateMockPerformanceData()
  }

  // Chart colors
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <Card className={`${className} ${analyticsSystem.enabled ? 'border-cyan-200 bg-cyan-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-cyan-600" />
              Agent Performance Analytics
              <Badge variant={analyticsSystem.enabled ? "default" : "secondary"}>
                {performanceMetrics.totalTrades} trades
              </Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive performance analysis and benchmarking for {agentId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-sm">Timeframe:</Label>
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="text-sm p-1 border rounded"
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="1y">1 Year</option>
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshAnalytics}
              disabled={!analyticsSystem.enabled}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant={analyticsSystem.enabled ? "destructive" : "default"}
              onClick={toggleAnalyticsSystem}
            >
              {analyticsSystem.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
                <AnimatedPrice 
                  value={Math.abs(performanceMetrics.totalPnL)}
                  currency={performanceMetrics.totalPnL >= 0 ? '+$' : '-$'}
                  precision={0}
                  className={`text-2xl font-bold ${performanceMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  showTrend={false}
                />
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                <AnimatedCounter 
                  value={performanceMetrics.winRate}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-green-600"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {performanceMetrics.winningTrades}W / {performanceMetrics.losingTrades}L
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Sharpe Ratio</div>
                <AnimatedCounter 
                  value={performanceMetrics.sharpeRatio}
                  precision={2}
                  className="text-2xl font-bold text-blue-600"
                />
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Max Drawdown</div>
                <AnimatedCounter 
                  value={performanceMetrics.maxDrawdown}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
            </div>

            {/* Portfolio Value Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Value Over Time</CardTitle>
                {periodMetrics && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-semibold ${periodMetrics.periodReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {periodMetrics.periodReturn >= 0 ? '+' : ''}{periodMetrics.periodReturn.toFixed(2)}% Return
                    </span>
                    <span>Volatility: {periodMetrics.volatility.toFixed(1)}%</span>
                    <span>Max DD: {periodMetrics.maxDrawdown.toFixed(1)}%</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredTimeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280" 
                        fontSize={12}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis yAxisId="portfolio" stroke="#6B7280" fontSize={12} />
                      <YAxis yAxisId="drawdown" orientation="right" stroke="#6B7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'portfolioValue') return [`$${value.toLocaleString()}`, 'Portfolio Value']
                          if (name === 'drawdown') return [`${value.toFixed(2)}%`, 'Drawdown']
                          return [value, name]
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Area
                        yAxisId="portfolio"
                        type="monotone"
                        dataKey="portfolioValue"
                        stroke="#06B6D4"
                        fill="#06B6D4"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        name="portfolioValue"
                      />
                      <Line
                        yAxisId="drawdown"
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        name="drawdown"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Trades</div>
                <div className="text-xl font-bold">{performanceMetrics.totalTrades}</div>
                <div className="text-xs text-muted-foreground">
                  Avg hold: {performanceMetrics.averageHoldTime.toFixed(1)}h
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Profit Factor</div>
                <div className="text-xl font-bold">{performanceMetrics.profitFactor.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  ROI: {performanceMetrics.returnOnInvestment.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Volatility</div>
                <div className="text-xl font-bold">{performanceMetrics.volatility.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  Daily: {performanceMetrics.averageDailyReturn.toFixed(2)}%
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-muted-foreground">Best Trade</div>
                <div className="text-xl font-bold text-green-600">
                  <AnimatedPrice value={performanceMetrics.bestTrade} currency="$" precision={0} size="sm" showTrend={false} />
                </div>
                <div className="text-xs text-red-600">
                  Worst: <AnimatedPrice value={Math.abs(performanceMetrics.worstTrade)} currency="-$" precision={0} size="sm" showTrend={false} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Advanced Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Calmar Ratio</div>
                <AnimatedCounter 
                  value={performanceMetrics.calmarRatio}
                  precision={2}
                  className="text-2xl font-bold text-indigo-600"
                />
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Sortino Ratio</div>
                <AnimatedCounter 
                  value={performanceMetrics.sortinoRatio}
                  precision={2}
                  className="text-2xl font-bold text-emerald-600"
                />
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Information Ratio</div>
                <AnimatedCounter 
                  value={performanceMetrics.informationRatio}
                  precision={3}
                  className="text-2xl font-bold text-rose-600"
                />
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Treynor Ratio</div>
                <AnimatedCounter 
                  value={performanceMetrics.treynorRatio}
                  precision={3}
                  className="text-2xl font-bold text-amber-600"
                />
              </div>
            </div>

            {/* Returns vs Drawdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Returns vs Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredTimeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280" 
                        fontSize={12}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis yAxisId="returns" stroke="#6B7280" fontSize={12} />
                      <YAxis yAxisId="drawdown" orientation="right" stroke="#6B7280" fontSize={12} />
                      <Tooltip />
                      <Bar
                        yAxisId="returns"
                        dataKey="dailyReturn"
                        fill="#10B981"
                        name="Daily Return (%)"
                      />
                      <Line
                        yAxisId="drawdown"
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        name="Drawdown (%)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Strategy Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strategy Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyPerformance.map((strategy, index) => (
                    <div key={strategy.strategyName} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{strategy.strategyName}</span>
                          <Badge variant={strategy.isActive ? 'default' : 'secondary'}>
                            {strategy.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${strategy.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <AnimatedPrice value={Math.abs(strategy.totalPnL)} currency={strategy.totalPnL >= 0 ? '+$' : '-$'} precision={0} size="sm" showTrend={false} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {strategy.winRate.toFixed(1)}% win rate
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Capital:</span> <AnimatedPrice value={strategy.allocatedCapital} currency="$" precision={0} size="sm" showTrend={false} />
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trades:</span> {strategy.trades}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sharpe:</span> {strategy.sharpeRatio.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max DD:</span> {strategy.maxDrawdown.toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Hold:</span> {strategy.avgHoldTime.toFixed(1)}h
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={(strategy.totalPnL + 5000) / 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            {/* Risk Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">VaR (95%)</div>
                <AnimatedPrice 
                  value={riskMetrics.var95}
                  currency="$"
                  precision={0}
                  className="text-2xl font-bold text-red-600"
                  showTrend={false}
                />
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Expected Shortfall</div>
                <AnimatedPrice 
                  value={riskMetrics.expectedShortfall95}
                  currency="$"
                  precision={0}
                  className="text-2xl font-bold text-orange-600"
                  showTrend={false}
                />
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Current Drawdown</div>
                <AnimatedCounter 
                  value={riskMetrics.currentDrawdown}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-yellow-600"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.drawdownDuration} days
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Ulcer Index</div>
                <AnimatedCounter 
                  value={riskMetrics.ulcerIndex}
                  precision={1}
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
            </div>

            {/* Risk Metrics Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip />
                        <RechartsPieChart
                          data={[
                            { name: 'Market Risk', value: 45, fill: '#EF4444' },
                            { name: 'Position Risk', value: 25, fill: '#F59E0B' },
                            { name: 'Liquidity Risk', value: 15, fill: '#8B5CF6' },
                            { name: 'Operational Risk', value: 15, fill: '#06B6D4' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {[{ name: 'Market Risk', value: 45, fill: '#EF4444' },
                            { name: 'Position Risk', value: 25, fill: '#F59E0B' },
                            { name: 'Liquidity Risk', value: 15, fill: '#8B5CF6' },
                            { name: 'Operational Risk', value: 15, fill: '#06B6D4' }].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </RechartsPieChart>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volatility Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredTimeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="timestamp" 
                          stroke="#6B7280" 
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="rollingVolatility"
                          stroke="#8B5CF6"
                          fill="#8B5CF6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                          name="Rolling Volatility (%)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Risk Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border-l-4 ${riskMetrics.currentDrawdown > 10 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                    <div className="font-semibold">Drawdown Risk</div>
                    <div className="text-sm text-muted-foreground">
                      Current drawdown: {riskMetrics.currentDrawdown.toFixed(1)}% 
                      {riskMetrics.currentDrawdown > 10 ? ' - HIGH RISK' : ' - Normal'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-l-4 ${riskMetrics.volatility > 25 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                    <div className="font-semibold">Volatility Risk</div>
                    <div className="text-sm text-muted-foreground">
                      Current volatility: {riskMetrics.volatility.toFixed(1)}% 
                      {riskMetrics.volatility > 25 ? ' - HIGH RISK' : ' - Normal'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                    <div className="font-semibold">Position Risk</div>
                    <div className="text-sm text-muted-foreground">
                      VaR exposure: <AnimatedPrice value={riskMetrics.var95} currency="$" precision={0} size="sm" showTrend={false} /> (2.5% of portfolio)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
            {/* Trade Analysis by Symbol */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance by Symbol</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tradeAnalysis.map((trade, index) => (
                    <div key={trade.symbol} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{trade.symbol}</span>
                          <Badge variant="outline">{trade.trades} trades</Badge>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${trade.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <AnimatedPrice value={Math.abs(trade.totalPnL)} currency={trade.totalPnL >= 0 ? '+$' : '-$'} precision={0} size="sm" showTrend={false} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trade.winRate.toFixed(1)}% win rate
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg P&L:</span> <AnimatedPrice value={Math.abs(trade.avgPnL)} currency={trade.avgPnL >= 0 ? '+$' : '-$'} precision={0} size="sm" showTrend={false} />
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sharpe:</span> {trade.sharpeRatio.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max DD:</span> {trade.maxDrawdown.toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-muted-foreground">Best Streak:</span> {trade.bestStreak}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Worst Streak:</span> {trade.worstStreak}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={trade.winRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trade Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip />
                        <RechartsPieChart
                          data={[
                            { name: 'Winning Trades', value: performanceMetrics.winningTrades, fill: '#10B981' },
                            { name: 'Losing Trades', value: performanceMetrics.losingTrades, fill: '#EF4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </RechartsPieChart>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trade Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Trade P&L</span>
                      <span className={`font-semibold ${performanceMetrics.averagePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <AnimatedPrice value={Math.abs(performanceMetrics.averagePnL)} currency={performanceMetrics.averagePnL >= 0 ? '+$' : '-$'} precision={0} size="sm" showTrend={false} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Best Trade</span>
                      <span className="font-semibold text-green-600">
                        <AnimatedPrice value={performanceMetrics.bestTrade} currency="+$" precision={0} size="sm" showTrend={false} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Worst Trade</span>
                      <span className="font-semibold text-red-600">
                        <AnimatedPrice value={Math.abs(performanceMetrics.worstTrade)} currency="-$" precision={0} size="sm" showTrend={false} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Hold Time</span>
                      <span className="font-semibold">{performanceMetrics.averageHoldTime.toFixed(1)} hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Profit Factor</span>
                      <span className="font-semibold">{performanceMetrics.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benchmark Comparison</CardTitle>
                <CardDescription>Performance relative to peer agents and market benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarkData.map((benchmark, index) => (
                    <div key={benchmark.metric} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{benchmark.metric}</span>
                        <Badge variant={
                          benchmark.ranking === 'excellent' ? 'default' :
                          benchmark.ranking === 'good' ? 'secondary' :
                          benchmark.ranking === 'average' ? 'outline' : 'destructive'
                        }>
                          {benchmark.ranking.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Agent:</span> {benchmark.agentValue.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Benchmark:</span> {benchmark.benchmarkValue.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Percentile:</span> {benchmark.percentile.toFixed(0)}th
                        </div>
                      </div>
                      <Progress value={benchmark.percentile} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Updates</Label>
                        <p className="text-sm text-muted-foreground">Update analytics in real-time</p>
                      </div>
                      <Switch 
                        checked={analyticsSystem.realTimeUpdates}
                        onCheckedChange={(checked) => setAnalyticsSystem(prev => ({ 
                          ...prev, 
                          realTimeUpdates: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Benchmark Comparison</Label>
                        <p className="text-sm text-muted-foreground">Compare with peer agents</p>
                      </div>
                      <Switch 
                        checked={analyticsSystem.benchmarkComparison}
                        onCheckedChange={(checked) => setAnalyticsSystem(prev => ({ 
                          ...prev, 
                          benchmarkComparison: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Risk Monitoring</Label>
                        <p className="text-sm text-muted-foreground">Monitor risk metrics</p>
                      </div>
                      <Switch 
                        checked={analyticsSystem.riskMonitoring}
                        onCheckedChange={(checked) => setAnalyticsSystem(prev => ({ 
                          ...prev, 
                          riskMonitoring: checked 
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Performance Alerts</Label>
                        <p className="text-sm text-muted-foreground">Alert on performance issues</p>
                      </div>
                      <Switch 
                        checked={analyticsSystem.performanceAlerts}
                        onCheckedChange={(checked) => setAnalyticsSystem(prev => ({ 
                          ...prev, 
                          performanceAlerts: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Detailed Analytics</Label>
                        <p className="text-sm text-muted-foreground">Show advanced metrics</p>
                      </div>
                      <Switch 
                        checked={analyticsSystem.detailedAnalytics}
                        onCheckedChange={(checked) => setAnalyticsSystem(prev => ({ 
                          ...prev, 
                          detailedAnalytics: checked 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="updateInterval">Update Interval (ms)</Label>
                      <Input
                        id="updateInterval"
                        type="number"
                        value={analyticsSystem.updateInterval}
                        onChange={(e) => setAnalyticsSystem(prev => ({ 
                          ...prev, 
                          updateInterval: parseInt(e.target.value) || 60000 
                        }))}
                        min="1000"
                        max="300000"
                        step="1000"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {analyticsSystem.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {analyticsSystem.enabled ? 'Performance Analytics Active' : 'Performance Analytics Inactive'}
            </span>
            {analyticsSystem.realTimeUpdates && (
              <Badge variant="outline" className="ml-2">
                Real-time monitoring
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Agent: {agentId} • Last updated: {performanceMetrics.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentPerformanceAnalytics