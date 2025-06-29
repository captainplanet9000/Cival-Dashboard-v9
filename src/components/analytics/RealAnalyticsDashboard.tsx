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
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Award,
  Activity,
  Clock,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  PerformanceMetrics
} from '@/lib/trading/real-paper-trading-engine'

interface RealAnalyticsDashboardProps {
  className?: string
}

interface AgentPerformanceData {
  agent: TradingAgent
  dailyReturns: Array<{ date: string; return: number; value: number }>
  monthlyStats: { trades: number; profit: number; winRate: number }
  riskMetrics: { sharpe: number; maxDrawdown: number; volatility: number }
}

interface PortfolioMetrics {
  totalValue: number
  totalPnL: number
  dailyChange: number
  monthlyChange: number
  bestPerformer: string
  worstPerformer: string
  totalTrades: number
  winRate: number
}

export function RealAnalyticsDashboard({ className }: RealAnalyticsDashboardProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d'>('30d')
  const [performanceData, setPerformanceData] = useState<AgentPerformanceData[]>([])
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial data
    loadAnalyticsData()
    
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Listen for trading events to update analytics
    const handleOrderFilled = () => {
      setTimeout(loadAnalyticsData, 1000) // Slight delay to ensure data is updated
    }

    const handleAgentCreated = () => {
      loadAnalyticsData()
    }

    paperTradingEngine.on('orderFilled', handleOrderFilled)
    paperTradingEngine.on('agentCreated', handleAgentCreated)

    // Update analytics every 10 seconds
    const interval = setInterval(loadAnalyticsData, 10000)

    return () => {
      paperTradingEngine.off('orderFilled', handleOrderFilled)
      paperTradingEngine.off('agentCreated', handleAgentCreated)
      clearInterval(interval)
    }
  }, [])

  const loadAnalyticsData = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)

    if (allAgents.length === 0) {
      setIsLoading(false)
      return
    }

    // Generate performance data for each agent
    const agentPerformanceData: AgentPerformanceData[] = allAgents.map(agent => {
      // Generate daily returns for the selected timeframe
      const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      const dailyReturns = generateDailyReturns(agent, days)
      
      // Calculate monthly stats
      const monthlyStats = calculateMonthlyStats(agent)
      
      // Calculate risk metrics
      const riskMetrics = calculateRiskMetrics(agent, dailyReturns)

      return {
        agent,
        dailyReturns,
        monthlyStats,
        riskMetrics
      }
    })

    setPerformanceData(agentPerformanceData)

    // Calculate portfolio-wide metrics
    const portfolioMetrics = calculatePortfolioMetrics(allAgents, agentPerformanceData)
    setPortfolioMetrics(portfolioMetrics)

    setIsLoading(false)
  }

  const generateDailyReturns = (agent: TradingAgent, days: number) => {
    const returns = []
    const initialValue = 10000 // Starting portfolio value
    let currentValue = agent.portfolio.totalValue
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate realistic daily returns based on agent performance
      const baseReturn = (currentValue - initialValue) / days
      const dailyVolatility = 0.02 // 2% daily volatility
      const randomFactor = (Math.random() - 0.5) * dailyVolatility
      
      const dailyReturn = baseReturn + (baseReturn * randomFactor)
      currentValue = Math.max(initialValue * 0.8, currentValue + dailyReturn) // Don't go below 80% of initial
      
      returns.push({
        date: date.toISOString().split('T')[0],
        return: dailyReturn,
        value: currentValue
      })
    }
    
    return returns
  }

  const calculateMonthlyStats = (agent: TradingAgent) => {
    const transactions = agent.portfolio.transactions
    const monthlyTrades = transactions.length
    const monthlyProfit = agent.portfolio.totalValue - 10000 // Initial value
    
    return {
      trades: monthlyTrades,
      profit: monthlyProfit,
      winRate: agent.performance.winRate
    }
  }

  const calculateRiskMetrics = (agent: TradingAgent, dailyReturns: any[]) => {
    if (dailyReturns.length < 2) {
      return { sharpe: 0, maxDrawdown: 0, volatility: 0 }
    }

    // Calculate Sharpe ratio (simplified)
    const returns = dailyReturns.map(d => d.return)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance)
    const sharpe = volatility > 0 ? (avgReturn / volatility) * Math.sqrt(252) : 0 // Annualized

    // Calculate max drawdown
    let peak = dailyReturns[0].value
    let maxDrawdown = 0
    
    for (const point of dailyReturns) {
      if (point.value > peak) {
        peak = point.value
      }
      const drawdown = (peak - point.value) / peak
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }

    return {
      sharpe: Math.max(-3, Math.min(3, sharpe)), // Clamp between -3 and 3
      maxDrawdown: maxDrawdown * 100, // Convert to percentage
      volatility: volatility * 100 * Math.sqrt(252) // Annualized volatility %
    }
  }

  const calculatePortfolioMetrics = (agents: TradingAgent[], performanceData: AgentPerformanceData[]): PortfolioMetrics => {
    const totalValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const initialValue = agents.length * 10000
    const totalPnL = totalValue - initialValue
    
    // Calculate daily and monthly changes
    const dailyChange = performanceData.reduce((sum, data) => {
      const latestReturn = data.dailyReturns[data.dailyReturns.length - 1]?.return || 0
      return sum + latestReturn
    }, 0)
    
    const monthlyChange = totalPnL // Simplified monthly change
    
    // Find best and worst performers
    const sortedAgents = [...agents].sort((a, b) => {
      const aReturn = (a.portfolio.totalValue - 10000) / 10000
      const bReturn = (b.portfolio.totalValue - 10000) / 10000
      return bReturn - aReturn
    })
    
    const bestPerformer = sortedAgents[0]?.name || 'None'
    const worstPerformer = sortedAgents[sortedAgents.length - 1]?.name || 'None'
    
    // Calculate overall stats
    const totalTrades = agents.reduce((sum, agent) => sum + agent.portfolio.transactions.length, 0)
    const avgWinRate = agents.length > 0 
      ? agents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / agents.length 
      : 0

    return {
      totalValue,
      totalPnL,
      dailyChange,
      monthlyChange,
      bestPerformer,
      worstPerformer,
      totalTrades,
      winRate: avgWinRate
    }
  }

  const getFilteredData = () => {
    if (selectedAgent === 'all') {
      // Aggregate data for all agents
      const aggregatedReturns: { [key: string]: { date: string; return: number; value: number } } = {}
      
      performanceData.forEach(data => {
        data.dailyReturns.forEach(point => {
          if (!aggregatedReturns[point.date]) {
            aggregatedReturns[point.date] = { date: point.date, return: 0, value: 0 }
          }
          aggregatedReturns[point.date].return += point.return
          aggregatedReturns[point.date].value += point.value
        })
      })
      
      return Object.values(aggregatedReturns).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
    
    const agentData = performanceData.find(data => data.agent.id === selectedAgent)
    return agentData?.dailyReturns || []
  }

  const pieChartData = agents.map(agent => ({
    name: agent.name,
    value: agent.portfolio.totalValue,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }))

  const strategyPerformanceData = agents.reduce((acc, agent) => {
    const existing = acc.find(item => item.strategy === agent.strategy.type)
    if (existing) {
      existing.value += agent.portfolio.totalValue - 10000
      existing.count += 1
    } else {
      acc.push({
        strategy: agent.strategy.type,
        value: agent.portfolio.totalValue - 10000,
        count: 1
      })
    }
    return acc
  }, [] as Array<{ strategy: string; value: number; count: number }>)

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data to analyze</h3>
            <p className="text-gray-600 mb-4">Create some trading agents to see analytics</p>
            <Button>Create Agent</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trading Analytics</h2>
            <p className="text-sm text-gray-600">Real-time performance analysis and insights</p>
          </div>
          
          <div className="flex space-x-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1D</SelectItem>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
                <SelectItem value="90d">90D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        {portfolioMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${portfolioMetrics.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2 flex items-center">
                  {portfolioMetrics.totalPnL >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    portfolioMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {portfolioMetrics.totalPnL >= 0 ? '+' : ''}${portfolioMetrics.totalPnL.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Trades</p>
                    <p className="text-2xl font-bold text-gray-900">{portfolioMetrics.totalTrades}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    Avg Win Rate: {(portfolioMetrics.winRate * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Best Performer</p>
                    <p className="text-lg font-bold text-gray-900">{portfolioMetrics.bestPerformer}</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    {agents.length} Active Agent{agents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Change</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {portfolioMetrics.dailyChange >= 0 ? '+' : ''}${portfolioMetrics.dailyChange.toFixed(2)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={Math.min(100, Math.abs(portfolioMetrics.dailyChange / 100) * 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Portfolio Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getFilteredData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      name="Portfolio Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
                <span>Portfolio Allocation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span>Strategy Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="strategy" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                    labelFormatter={(label) => `Strategy: ${label}`}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span>Agent Performance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Agent</th>
                    <th className="p-3">Strategy</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">P&L</th>
                    <th className="p-3">Trades</th>
                    <th className="p-3">Win Rate</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map(({ agent, monthlyStats }) => {
                    const pnl = agent.portfolio.totalValue - 10000
                    return (
                      <tr key={agent.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{agent.name}</td>
                        <td className="p-3">
                          <Badge variant="outline">{agent.strategy.type}</Badge>
                        </td>
                        <td className="p-3">${agent.portfolio.totalValue.toFixed(2)}</td>
                        <td className={`p-3 font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </td>
                        <td className="p-3">{monthlyStats.trades}</td>
                        <td className="p-3">{(agent.performance.winRate * 100).toFixed(1)}%</td>
                        <td className="p-3">
                          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RealAnalyticsDashboard