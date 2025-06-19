'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  PieChart, 
  BarChart3, 
  LineChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { AnimatedCards } from '@/components/motion/animated-cards'
import { AnimatedNotifications } from '@/components/motion/animated-notifications'
import { AnimatedChart } from '@/components/motion/animated-chart'

interface AdvancedAnalyticsProps {
  className?: string
}

export function AdvancedAnalytics({ className }: AdvancedAnalyticsProps) {
  // Mock data for performance metrics
  const performanceMetrics = [
    { name: 'Total Return', value: '+24.5%', trend: 'up', change: '+2.3%' },
    { name: 'Sharpe Ratio', value: '1.85', trend: 'up', change: '+0.15' },
    { name: 'Max Drawdown', value: '-8.2%', trend: 'down', change: '-1.1%' },
    { name: 'Win Rate', value: '68%', trend: 'up', change: '+3%' },
  ]

  const riskMetrics = [
    { name: 'Portfolio Beta', value: '0.92', status: 'good' },
    { name: 'Value at Risk (95%)', value: '$12,450', status: 'warning' },
    { name: 'Expected Shortfall', value: '$18,230', status: 'warning' },
    { name: 'Correlation Risk', value: '0.34', status: 'good' },
  ]

  const recentAlerts = [
    { type: 'success', message: 'Strategy optimization completed', time: '2 hours ago' },
    { type: 'warning', message: 'High volatility detected in BTCUSD', time: '4 hours ago' },
    { type: 'error', message: 'Risk limit exceeded for Strategy Alpha', time: '6 hours ago' },
    { type: 'info', message: 'Market correlation analysis updated', time: '8 hours ago' },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className={className}>
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="chart">Live Chart</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className={`text-sm ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change} vs last period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Cumulative returns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <LineChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Performance chart visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance</CardTitle>
              <CardDescription>Individual strategy contribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Momentum Alpha', 'Mean Reversion Beta', 'Arbitrage Gamma', 'Market Neutral Delta'].map((strategy, idx) => (
                <div key={strategy} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{strategy}</span>
                    <span className="text-sm text-muted-foreground">{20 + idx * 10}%</span>
                  </div>
                  <Progress value={20 + idx * 10} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {/* Risk Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {riskMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    <Badge 
                      variant={metric.status === 'good' ? 'default' : 'destructive'}
                      className={metric.status === 'good' ? 'bg-green-500' : ''}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Portfolio risk across different factors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Risk distribution chart</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stress Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Stress Test Scenarios</CardTitle>
              <CardDescription>Portfolio performance under different market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { scenario: 'Market Crash (-20%)', impact: '-15.2%', color: 'text-red-500' },
                  { scenario: 'Volatility Spike', impact: '-8.5%', color: 'text-orange-500' },
                  { scenario: 'Interest Rate Hike', impact: '-3.2%', color: 'text-yellow-500' },
                  { scenario: 'Currency Devaluation', impact: '+2.1%', color: 'text-green-500' },
                ].map((test) => (
                  <div key={test.scenario} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{test.scenario}</span>
                    <span className={`text-sm font-bold ${test.color}`}>{test.impact}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          {/* Asset Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Current Allocation</CardTitle>
              <CardDescription>Portfolio distribution across asset classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Asset allocation chart</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Asset Class</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { asset: 'Equities', allocation: 45, target: 50 },
                  { asset: 'Fixed Income', allocation: 25, target: 20 },
                  { asset: 'Commodities', allocation: 15, target: 15 },
                  { asset: 'Crypto', allocation: 10, target: 10 },
                  { asset: 'Cash', allocation: 5, target: 5 },
                ].map((item) => (
                  <div key={item.asset} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.asset}</span>
                      <span>{item.allocation}% / {item.target}%</span>
                    </div>
                    <Progress value={item.allocation} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Region</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { region: 'North America', allocation: 40 },
                  { region: 'Europe', allocation: 25 },
                  { region: 'Asia Pacific', allocation: 20 },
                  { region: 'Emerging Markets', allocation: 10 },
                  { region: 'Global', allocation: 5 },
                ].map((item) => (
                  <div key={item.region} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.region}</span>
                      <span>{item.allocation}%</span>
                    </div>
                    <Progress value={item.allocation} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <AnimatedCards />
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <AnimatedChart />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* AI Insights Summary */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Machine learning analysis of your portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Market Sentiment</span>
                  </div>
                  <p className="text-2xl font-bold">Bullish</p>
                  <p className="text-sm text-muted-foreground">78% confidence</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Trend Strength</span>
                  </div>
                  <p className="text-2xl font-bold">Strong</p>
                  <p className="text-sm text-muted-foreground">Momentum increasing</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Risk Level</span>
                  </div>
                  <p className="text-2xl font-bold">Medium</p>
                  <p className="text-sm text-muted-foreground">Within tolerance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts with Motion */}
          <AnimatedNotifications />

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Suggested actions based on current analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'Rebalance portfolio to target allocation', priority: 'high' },
                  { action: 'Consider reducing exposure to volatile assets', priority: 'medium' },
                  { action: 'Increase position in defensive sectors', priority: 'medium' },
                  { action: 'Review stop-loss levels for active positions', priority: 'low' },
                ].map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">{rec.action}</span>
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">Review All Recommendations</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdvancedAnalytics