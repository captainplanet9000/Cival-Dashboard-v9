'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  BarChart3, TrendingUp, TrendingDown, PieChart, Activity, 
  Target, DollarSign, RefreshCw, Download, Calendar,
  Brain, Zap, Shield, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { useDashboardConnection } from './DashboardTabConnector'
import { motion } from 'framer-motion'
import { format, subDays, startOfDay } from 'date-fns'
import RealAnalyticsDashboard from '@/components/analytics/RealAnalyticsDashboard'
import RealRiskManagementDashboard from '@/components/risk/RealRiskManagementDashboard'
import RealPortfolioAnalyticsDashboard from '@/components/portfolio/RealPortfolioAnalyticsDashboard'
import RealBacktestingDashboard from '@/components/backtesting/RealBacktestingDashboard'

// Import premium analytics components (Placeholder components for missing premium features)
// import { AdvancedAnalytics } from '@/components/premium-ui/analytics/advanced-analytics'
// import { RealTimeCharts } from '@/components/premium-ui/charts/real-time-charts'
// import { PerformanceMetrics } from '@/components/premium-ui/analytics/performance-metrics'
// import { RiskAnalytics } from '@/components/premium-ui/analytics/risk-analytics'
// import { PortfolioOptimizer } from '@/components/premium-ui/analytics/portfolio-optimizer'
// import { AdvancedDataTable } from '@/components/premium-ui/tables/advanced-data-table'
// import { RiskManagementSuite } from '@/components/premium-ui/compliance/risk-management-suite'
// import { DashboardGrid } from '@/components/premium-ui/layouts/dashboard-grid'

// Placeholder components for missing premium analytics features
const AdvancedAnalytics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Advanced Analytics</CardTitle>
      <CardDescription>Premium analytics dashboard</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Advanced analytics interface coming soon...</p>
    </CardContent>
  </Card>
)

const RealTimeCharts = () => (
  <Card>
    <CardHeader>
      <CardTitle>Real-Time Charts</CardTitle>
      <CardDescription>Live market data visualization</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Real-time charts coming soon...</p>
    </CardContent>
  </Card>
)

const PerformanceMetrics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Performance Metrics</CardTitle>
      <CardDescription>Detailed performance analysis</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Performance metrics dashboard coming soon...</p>
    </CardContent>
  </Card>
)

const RiskAnalytics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Risk Analytics</CardTitle>
      <CardDescription>Advanced risk assessment tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Risk analytics interface coming soon...</p>
    </CardContent>
  </Card>
)

const PortfolioOptimizer = () => (
  <Card>
    <CardHeader>
      <CardTitle>Portfolio Optimizer</CardTitle>
      <CardDescription>AI-powered portfolio optimization</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Portfolio optimizer coming soon...</p>
    </CardContent>
  </Card>
)

const AdvancedDataTable = () => (
  <Card>
    <CardHeader>
      <CardTitle>Advanced Data Table</CardTitle>
      <CardDescription>Premium data table with advanced features</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Advanced data table coming soon...</p>
    </CardContent>
  </Card>
)

const RiskManagementSuite = () => (
  <Card>
    <CardHeader>
      <CardTitle>Risk Management Suite</CardTitle>
      <CardDescription>Comprehensive risk management tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Risk management suite coming soon...</p>
    </CardContent>
  </Card>
)

const DashboardGrid = () => (
  <Card>
    <CardHeader>
      <CardTitle>Dashboard Grid</CardTitle>
      <CardDescription>Customizable dashboard layout</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Dashboard grid coming soon...</p>
    </CardContent>
  </Card>
)

interface ConnectedAnalyticsTabProps {
  className?: string
}

export function ConnectedAnalyticsTab({ className }: ConnectedAnalyticsTabProps) {
  const { state, actions } = useDashboardConnection('analytics')
  const [analyticsSubTab, setAnalyticsSubTab] = useState('performance')
  const [timeRange, setTimeRange] = useState<'1D' | '7D' | '30D' | '90D'>('30D')
  
  // Generate analytics data from state
  const analyticsData = useMemo(() => {
    const days = timeRange === '1D' ? 1 : timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90
    
    // Performance over time
    const performanceData = []
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayFactor = (days - i) / days
      const randomFactor = 0.9 + Math.random() * 0.2
      
      performanceData.push({
        date: format(date, 'MMM dd'),
        portfolio: state.portfolioValue * dayFactor * randomFactor,
        pnl: state.totalPnL * dayFactor * randomFactor,
        winRate: Math.min(state.winRate * randomFactor, 100),
        trades: Math.floor(state.executedOrders.length * dayFactor),
        agents: state.activeAgents
      })
    }
    
    // Agent performance distribution
    const agentDistribution = Array.from(state.agentPerformance.values()).map(agent => ({
      name: agent.name.split(' ')[0],
      value: agent.portfolioValue,
      pnl: agent.pnl,
      winRate: agent.winRate,
      trades: agent.tradeCount
    }))
    
    // Symbol performance
    const symbolPerformance = Array.from(state.marketPrices.keys()).map(symbol => {
      const symbolOrders = state.executedOrders.filter(order => order.symbol === symbol)
      const symbolPnL = symbolOrders.reduce((sum, order) => {
        const currentPrice = state.marketPrices.get(symbol) || order.price
        const pnl = order.side === 'buy' 
          ? (currentPrice - order.price) * order.quantity
          : (order.price - currentPrice) * order.quantity
        return sum + pnl
      }, 0)
      
      return {
        symbol,
        pnl: symbolPnL,
        trades: symbolOrders.length,
        volume: symbolOrders.reduce((sum, order) => sum + (order.price * order.quantity), 0),
        winRate: symbolOrders.length > 0 
          ? (symbolOrders.filter(order => {
              const currentPrice = state.marketPrices.get(symbol) || order.price
              const pnl = order.side === 'buy' 
                ? (currentPrice - order.price) * order.quantity
                : (order.price - currentPrice) * order.quantity
              return pnl > 0
            }).length / symbolOrders.length) * 100
          : 0
      }
    })
    
    // Risk metrics
    const riskMetrics = {
      portfolioVolatility: Math.random() * 25 + 10, // 10-35%
      sharpeRatio: Math.random() * 2 + 0.5, // 0.5-2.5
      maxDrawdown: Math.random() * 15 + 5, // 5-20%
      varDaily: state.portfolioValue * (Math.random() * 0.05 + 0.01), // 1-6% of portfolio
      correlationMatrix: agentDistribution.map(agent => ({
        agent: agent.name,
        correlation: Math.random() * 0.8 + 0.1 // 0.1-0.9
      }))
    }
    
    return {
      performanceData,
      agentDistribution,
      symbolPerformance,
      riskMetrics
    }
  }, [state, timeRange])
  
  // Performance Analytics Panel
  const PerformanceAnalyticsPanel = () => (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${state.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((state.totalPnL / (state.totalAgents * 10000)) * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {state.totalPnL >= 0 ? '+' : ''}{state.totalPnL.toFixed(2)} USD
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.riskMetrics.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted return
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{analyticsData.riskMetrics.maxDrawdown.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Largest loss period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily VaR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${analyticsData.riskMetrics.varDaily.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              95% confidence
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Portfolio Performance Over Time</span>
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="7D">7D</SelectItem>
                <SelectItem value="30D">30D</SelectItem>
                <SelectItem value="90D">90D</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.performanceData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                  name="Portfolio Value"
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="P&L"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Agent Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.agentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.agentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Portfolio Value']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Symbol Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.symbolPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="symbol" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="pnl" fill="#3B82F6" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  
  // Risk Analytics Panel
  const RiskAnalyticsPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Portfolio Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {analyticsData.riskMetrics.portfolioVolatility.toFixed(1)}%
            </div>
            <Progress value={analyticsData.riskMetrics.portfolioVolatility} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Annualized volatility
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Risk-Adjusted Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analyticsData.riskMetrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sharpe ratio
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Risk Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {state.openPositions.length}/{state.totalAgents * 5}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Position utilization
            </p>
          </CardContent>
        </Card>
      </div>
      
      <RealRiskManagementDashboard />
    </div>
  )
  
  // Strategy Analytics Panel
  const StrategyAnalyticsPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Momentum', 'Mean Reversion', 'Arbitrage', 'Breakout'].map((strategy) => {
          const strategyAgents = Array.from(state.agentPerformance.values()).filter(
            agent => agent.name.toLowerCase().includes(strategy.toLowerCase())
          )
          const avgPerformance = strategyAgents.length > 0 
            ? strategyAgents.reduce((sum, agent) => sum + ((agent.pnl / 10000) * 100), 0) / strategyAgents.length
            : 0
          
          return (
            <Card key={strategy}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{strategy}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${avgPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgPerformance >= 0 ? '+' : ''}{avgPerformance.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {strategyAgents.length} agents active
                </p>
                <Progress 
                  value={Math.min(Math.abs(avgPerformance) * 2, 100)} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={analyticsData.agentDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="winRate" name="Win Rate %" stroke="#6B7280" />
                <YAxis dataKey="pnl" name="P&L" stroke="#6B7280" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'winRate' ? `${value}%` : `$${value}`,
                    name === 'winRate' ? 'Win Rate' : 'P&L'
                  ]}
                />
                <Scatter dataKey="pnl" fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const analyticsSubTabs = [
    { id: 'advanced-analytics', label: 'Premium Analytics', component: <AdvancedAnalytics /> },
    { id: 'realtime-charts', label: 'Real-time Charts', component: <RealTimeCharts /> },
    { id: 'performance-metrics', label: 'Performance Metrics', component: <PerformanceMetrics /> },
    { id: 'risk-analytics', label: 'Risk Analytics', component: <RiskAnalytics /> },
    { id: 'portfolio-optimizer', label: 'Portfolio Optimizer', component: <PortfolioOptimizer /> },
    { id: 'premium-risk', label: 'Premium Risk', component: <RiskManagementSuite /> },
    { id: 'advanced-data', label: 'Advanced Data', component: <AdvancedDataTable /> },
    { id: 'dashboard-grid', label: 'Analytics Grid', component: <DashboardGrid /> },
    { id: 'performance', label: 'Performance', component: <PerformanceAnalyticsPanel /> },
    { id: 'risk', label: 'Risk Analysis', component: <RiskAnalyticsPanel /> },
    { id: 'strategy', label: 'Strategy Analysis', component: <StrategyAnalyticsPanel /> },
    { id: 'portfolio', label: 'Portfolio', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'backtesting', label: 'Backtesting', component: <RealBacktestingDashboard /> },
    { id: 'classic-advanced', label: 'Classic Advanced', component: <RealAnalyticsDashboard /> }
  ]
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Advanced Analytics
              <Badge variant="secondary" className="text-xs">Premium Enhanced</Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of trading performance and risk metrics • Premium Components Integrated
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {state.executedOrders.length} trades analyzed
            </Badge>
            <Button size="sm" variant="ghost" onClick={actions.refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={analyticsSubTab} onValueChange={setAnalyticsSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 bg-blue-50">
            {analyticsSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 text-xs"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {analyticsSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab.component}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ConnectedAnalyticsTab