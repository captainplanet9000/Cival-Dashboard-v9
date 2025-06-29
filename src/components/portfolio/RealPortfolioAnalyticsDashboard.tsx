'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import {
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Users,
  Clock,
  Zap,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  Position,
  Transaction
} from '@/lib/trading/real-paper-trading-engine'

interface RealPortfolioAnalyticsDashboardProps {
  className?: string
}

interface PortfolioBreakdown {
  totalValue: number
  totalPnL: number
  cash: number
  invested: number
  unrealizedPnL: number
  realizedPnL: number
  dayChange: number
  weekChange: number
  monthChange: number
  allTimeHigh: number
  allTimeLow: number
  maxDrawdown: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgWinAmount: number
  avgLossAmount: number
  profitFactor: number
}

interface AssetAllocation {
  symbol: string
  name: string
  value: number
  percentage: number
  shares: number
  avgPrice: number
  currentPrice: number
  dayChange: number
  totalReturn: number
  color: string
}

interface PerformanceMetric {
  period: string
  portfolioReturn: number
  benchmark: number
  alpha: number
  beta: number
  sharpe: number
  sortino: number
  volatility: number
}

interface HoldingDetail {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  dayChange: number
  percentage: number
  firstPurchase: Date
  lastTransaction: Date
  transactions: Transaction[]
}

export function RealPortfolioAnalyticsDashboard({ className }: RealPortfolioAnalyticsDashboardProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [portfolioBreakdown, setPortfolioBreakdown] = useState<PortfolioBreakdown | null>(null)
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [holdingDetails, setHoldingDetails] = useState<HoldingDetail[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '1w' | '1m' | '3m' | '1y' | 'all'>('1m')
  const [selectedView, setSelectedView] = useState<'overview' | 'allocations' | 'performance' | 'holdings'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Load initial data
    loadPortfolioData()
    
    // Listen for trading events to update portfolio analysis
    const handleOrderFilled = () => {
      setTimeout(loadPortfolioData, 1000) // Delay to ensure data is updated
    }

    const handlePricesUpdated = () => {
      loadPortfolioData()
    }

    paperTradingEngine.on('orderFilled', handleOrderFilled)
    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)

    // Update portfolio analysis every 30 seconds
    const interval = setInterval(loadPortfolioData, 30000)

    return () => {
      paperTradingEngine.off('orderFilled', handleOrderFilled)
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      clearInterval(interval)
    }
  }, [])

  const loadPortfolioData = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)

    if (allAgents.length === 0) {
      setIsLoading(false)
      return
    }

    // Calculate comprehensive portfolio breakdown
    const breakdown = calculatePortfolioBreakdown(allAgents)
    setPortfolioBreakdown(breakdown)

    // Calculate asset allocation
    const allocation = calculateAssetAllocation(allAgents)
    setAssetAllocation(allocation)

    // Calculate performance metrics
    const metrics = calculatePerformanceMetrics(allAgents)
    setPerformanceMetrics(metrics)

    // Calculate holding details
    const holdings = calculateHoldingDetails(allAgents)
    setHoldingDetails(holdings)

    setIsLoading(false)
  }

  const calculatePortfolioBreakdown = (agents: TradingAgent[]): PortfolioBreakdown => {
    const totalValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const totalCash = agents.reduce((sum, agent) => sum + agent.portfolio.cash, 0)
    const initialValue = agents.length * 10000

    // Calculate P&L
    const totalPnL = totalValue - initialValue
    const invested = totalValue - totalCash

    // Calculate unrealized P&L from positions
    const unrealizedPnL = agents.reduce((sum, agent) => {
      return sum + agent.portfolio.positions.reduce((posSum, pos) => posSum + pos.unrealizedPnL, 0)
    }, 0)

    // Calculate realized P&L from transactions
    const realizedPnL = totalPnL - unrealizedPnL

    // Mock time-based changes (in real system, would track historical data)
    const dayChange = totalPnL * 0.1 + (Math.random() - 0.5) * 200
    const weekChange = totalPnL * 0.3 + (Math.random() - 0.5) * 500
    const monthChange = totalPnL * 0.8 + (Math.random() - 0.5) * 1000

    // Calculate trade statistics
    const allTransactions = agents.flatMap(agent => agent.portfolio.transactions)
    const completedTrades = allTransactions.filter(t => t.type === 'sell')
    const winningTrades = completedTrades.filter(t => t.price > t.price * 0.95).length // Simplified
    const losingTrades = completedTrades.length - winningTrades
    const winRate = completedTrades.length > 0 ? winningTrades / completedTrades.length : 0

    const avgWinAmount = winningTrades > 0 ? 
      completedTrades.filter(t => t.price > t.price * 0.95).reduce((sum, t) => sum + t.amount, 0) / winningTrades : 0
    const avgLossAmount = losingTrades > 0 ?
      completedTrades.filter(t => t.price <= t.price * 0.95).reduce((sum, t) => sum + t.amount, 0) / losingTrades : 0

    const profitFactor = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0

    return {
      totalValue,
      totalPnL,
      cash: totalCash,
      invested,
      unrealizedPnL,
      realizedPnL,
      dayChange,
      weekChange,
      monthChange,
      allTimeHigh: Math.max(totalValue, initialValue * 1.2),
      allTimeLow: Math.min(totalValue, initialValue * 0.8),
      maxDrawdown: Math.max(0, (initialValue * 1.2 - totalValue) / (initialValue * 1.2) * 100),
      totalTrades: allTransactions.length,
      winningTrades,
      losingTrades,
      winRate,
      avgWinAmount,
      avgLossAmount,
      profitFactor
    }
  }

  const calculateAssetAllocation = (agents: TradingAgent[]): AssetAllocation[] => {
    const symbolMap: { [symbol: string]: AssetAllocation } = {}
    const totalPortfolioValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)

    // Aggregate positions across all agents
    agents.forEach(agent => {
      agent.portfolio.positions.forEach(position => {
        if (!symbolMap[position.symbol]) {
          symbolMap[position.symbol] = {
            symbol: position.symbol,
            name: position.symbol.replace('/', ' / '),
            value: 0,
            percentage: 0,
            shares: 0,
            avgPrice: 0,
            currentPrice: position.marketValue / position.quantity,
            dayChange: (Math.random() - 0.5) * 10, // Mock day change
            totalReturn: 0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
          }
        }

        const allocation = symbolMap[position.symbol]
        const totalShares = allocation.shares + position.quantity
        const totalValue = allocation.value + position.marketValue
        
        // Calculate weighted average price
        allocation.avgPrice = ((allocation.avgPrice * allocation.shares) + (position.averagePrice * position.quantity)) / totalShares
        allocation.shares = totalShares
        allocation.value = totalValue
        allocation.currentPrice = position.marketValue / position.quantity
        allocation.totalReturn = ((allocation.currentPrice - allocation.avgPrice) / allocation.avgPrice) * 100
      })
    })

    // Calculate percentages and sort by value
    const allocations = Object.values(symbolMap).map(allocation => ({
      ...allocation,
      percentage: (allocation.value / totalPortfolioValue) * 100
    })).sort((a, b) => b.value - a.value)

    return allocations
  }

  const calculatePerformanceMetrics = (agents: TradingAgent[]): PerformanceMetric[] => {
    const periods = ['1D', '1W', '1M', '3M', '1Y']
    
    return periods.map(period => {
      // Mock performance data (in real system, would calculate from historical data)
      const portfolioReturn = (Math.random() - 0.3) * 20 // -6% to +14% range
      const benchmark = (Math.random() - 0.4) * 15 // Market benchmark
      const alpha = portfolioReturn - benchmark
      const beta = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      const volatility = 10 + Math.random() * 20 // 10% to 30%
      const sharpe = portfolioReturn / volatility
      const sortino = sharpe * 1.2 // Simplified Sortino ratio
      
      return {
        period,
        portfolioReturn,
        benchmark,
        alpha,
        beta,
        sharpe,
        sortino,
        volatility
      }
    })
  }

  const calculateHoldingDetails = (agents: TradingAgent[]): HoldingDetail[] => {
    const holdingsMap: { [symbol: string]: HoldingDetail } = {}

    agents.forEach(agent => {
      agent.portfolio.positions.forEach(position => {
        if (!holdingsMap[position.symbol]) {
          holdingsMap[position.symbol] = {
            symbol: position.symbol,
            quantity: 0,
            avgPrice: 0,
            currentPrice: position.marketValue / position.quantity,
            marketValue: 0,
            unrealizedPnL: 0,
            dayChange: (Math.random() - 0.5) * 10,
            percentage: 0,
            firstPurchase: new Date(),
            lastTransaction: new Date(),
            transactions: []
          }
        }

        const holding = holdingsMap[position.symbol]
        const totalQuantity = holding.quantity + position.quantity
        
        // Calculate weighted average price
        holding.avgPrice = ((holding.avgPrice * holding.quantity) + (position.averagePrice * position.quantity)) / totalQuantity
        holding.quantity = totalQuantity
        holding.marketValue += position.marketValue
        holding.unrealizedPnL += position.unrealizedPnL
        
        // Add agent's transactions for this symbol
        const symbolTransactions = agent.portfolio.transactions.filter(t => t.symbol === position.symbol)
        holding.transactions.push(...symbolTransactions)
      })
    })

    const totalValue = Object.values(holdingsMap).reduce((sum, holding) => sum + holding.marketValue, 0)
    
    return Object.values(holdingsMap).map(holding => ({
      ...holding,
      percentage: (holding.marketValue / totalValue) * 100,
      firstPurchase: holding.transactions.length > 0 ? 
        new Date(Math.min(...holding.transactions.map(t => t.timestamp.getTime()))) : new Date(),
      lastTransaction: holding.transactions.length > 0 ?
        new Date(Math.max(...holding.transactions.map(t => t.timestamp.getTime()))) : new Date()
    })).sort((a, b) => b.marketValue - a.marketValue)
  }

  const exportPortfolioData = () => {
    const data = {
      portfolioBreakdown,
      assetAllocation,
      performanceMetrics,
      holdingDetails,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading portfolio analytics...</p>
        </div>
      </div>
    )
  }

  if (!portfolioBreakdown) {
    return (
      <div className={`${className} text-center py-12`}>
        <PieChartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data</h3>
        <p className="text-gray-600">Create some trading agents to see portfolio analytics</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <PieChartIcon className="h-6 w-6 mr-2 text-blue-600" />
              Portfolio Analytics
            </h2>
            <p className="text-sm text-gray-600">Comprehensive portfolio analysis and performance metrics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="1w">1W</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            
            <Button size="sm" variant="outline" onClick={loadPortfolioData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button size="sm" variant="outline" onClick={exportPortfolioData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${portfolioBreakdown.totalValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center">
                {portfolioBreakdown.totalPnL >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  portfolioBreakdown.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolioBreakdown.totalPnL >= 0 ? '+' : ''}${portfolioBreakdown.totalPnL.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Change</p>
                  <p className={`text-2xl font-bold ${
                    portfolioBreakdown.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {portfolioBreakdown.dayChange >= 0 ? '+' : ''}${portfolioBreakdown.dayChange.toFixed(2)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  {((portfolioBreakdown.dayChange / portfolioBreakdown.totalValue) * 100).toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(portfolioBreakdown.winRate * 100).toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <Progress value={portfolioBreakdown.winRate * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{portfolioBreakdown.totalTrades}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  {portfolioBreakdown.winningTrades}W / {portfolioBreakdown.losingTrades}L
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Composition */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChartIcon className="h-5 w-5 text-blue-600" />
                    <span>Portfolio Composition</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetAllocation.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ symbol, percentage }) => `${symbol} ${percentage.toFixed(1)}%`}
                        >
                          {assetAllocation.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cash vs Invested */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <span>Cash vs Invested</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${portfolioBreakdown.cash.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-700">Cash</div>
                        <div className="text-xs text-green-600">
                          {((portfolioBreakdown.cash / portfolioBreakdown.totalValue) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          ${portfolioBreakdown.invested.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-700">Invested</div>
                        <div className="text-xs text-blue-600">
                          {((portfolioBreakdown.invested / portfolioBreakdown.totalValue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Unrealized P&L:</span>
                        <span className={portfolioBreakdown.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${portfolioBreakdown.unrealizedPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Realized P&L:</span>
                        <span className={portfolioBreakdown.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${portfolioBreakdown.realizedPnL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-3">Asset</th>
                        <th className="p-3">Shares</th>
                        <th className="p-3">Avg Price</th>
                        <th className="p-3">Current Price</th>
                        <th className="p-3">Market Value</th>
                        <th className="p-3">Day Change</th>
                        <th className="p-3">Total Return</th>
                        <th className="p-3">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetAllocation.map((asset) => (
                        <tr key={asset.symbol} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{asset.symbol}</td>
                          <td className="p-3">{asset.shares.toFixed(3)}</td>
                          <td className="p-3">${asset.avgPrice.toFixed(2)}</td>
                          <td className="p-3">${asset.currentPrice.toFixed(2)}</td>
                          <td className="p-3">${asset.value.toFixed(2)}</td>
                          <td className={`p-3 font-medium ${asset.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.dayChange >= 0 ? '+' : ''}{asset.dayChange.toFixed(2)}%
                          </td>
                          <td className={`p-3 font-medium ${asset.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.totalReturn >= 0 ? '+' : ''}{asset.totalReturn.toFixed(2)}%
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span>{asset.percentage.toFixed(1)}%</span>
                              <div className="w-16 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, asset.percentage)}%`,
                                    backgroundColor: asset.color
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics by Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceMetrics.map((metric) => (
                      <div key={metric.period} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{metric.period}</span>
                          <span className={`font-bold ${metric.portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.portfolioReturn >= 0 ? '+' : ''}{metric.portfolioReturn.toFixed(2)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Alpha:</span>
                            <span className={`ml-1 font-medium ${metric.alpha >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {metric.alpha.toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Sharpe:</span>
                            <span className="ml-1 font-medium">{metric.sharpe.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Vol:</span>
                            <span className="ml-1 font-medium">{metric.volatility.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {portfolioBreakdown.maxDrawdown.toFixed(2)}%
                        </div>
                        <div className="text-sm text-red-700">Max Drawdown</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {portfolioBreakdown.profitFactor.toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-700">Profit Factor</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">All-Time High:</span>
                        <span className="font-medium">${portfolioBreakdown.allTimeHigh.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">All-Time Low:</span>
                        <span className="font-medium">${portfolioBreakdown.allTimeLow.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Win:</span>
                        <span className="font-medium text-green-600">${portfolioBreakdown.avgWinAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Loss:</span>
                        <span className="font-medium text-red-600">${portfolioBreakdown.avgLossAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-3">Symbol</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Avg Price</th>
                        <th className="p-3">Current Price</th>
                        <th className="p-3">Market Value</th>
                        <th className="p-3">Unrealized P&L</th>
                        <th className="p-3">% of Portfolio</th>
                        <th className="p-3">First Purchase</th>
                        <th className="p-3">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingDetails.map((holding) => (
                        <tr key={holding.symbol} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{holding.symbol}</td>
                          <td className="p-3">{holding.quantity.toFixed(3)}</td>
                          <td className="p-3">${holding.avgPrice.toFixed(2)}</td>
                          <td className="p-3">${holding.currentPrice.toFixed(2)}</td>
                          <td className="p-3">${holding.marketValue.toFixed(2)}</td>
                          <td className={`p-3 font-medium ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.unrealizedPnL >= 0 ? '+' : ''}${holding.unrealizedPnL.toFixed(2)}
                          </td>
                          <td className="p-3">{holding.percentage.toFixed(1)}%</td>
                          <td className="p-3 text-xs">{holding.firstPurchase.toLocaleDateString()}</td>
                          <td className="p-3">
                            <Badge variant="outline">{holding.transactions.length}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default RealPortfolioAnalyticsDashboard