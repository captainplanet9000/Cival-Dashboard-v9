'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown, 
  AlertTriangle,
  Activity,
  Shield,
  Timer,
  DollarSign,
  Target,
  Zap,
  RefreshCw,
  Eye,
  Bell
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Types
interface LeverageMetrics {
  agent_id: string
  agent_name: string
  portfolio_leverage: number
  margin_usage: number
  var_1d: number
  var_5d: number
  liquidation_risk_score: number
  time_to_liquidation_hours: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  risk_score: number
  positions_count: number
  total_margin_used: number
  available_margin: number
  daily_pnl: number
  recommendations: string[]
  immediate_actions: string[]
}

interface PortfolioLeverageData {
  timestamp: string
  total_leverage: number
  margin_usage: number
  var_amount: number
  risk_score: number
}

interface LeverageMonitoringDashboardProps {
  agents: LeverageMetrics[]
  portfolioHistory: PortfolioLeverageData[]
  onRefresh: () => void
  onEmergencyAction: (agentId: string) => void
}

export function LeverageMonitoringDashboard({
  agents,
  portfolioHistory,
  onRefresh,
  onEmergencyAction
}: LeverageMonitoringDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      onRefresh()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh])

  // Portfolio-wide calculations
  const portfolioStats = {
    totalMarginUsed: agents.reduce((sum, agent) => sum + agent.total_margin_used, 0),
    totalAvailableMargin: agents.reduce((sum, agent) => sum + agent.available_margin, 0),
    avgLeverage: agents.length > 0 
      ? agents.reduce((sum, agent) => sum + agent.portfolio_leverage, 0) / agents.length 
      : 0,
    avgRiskScore: agents.length > 0 
      ? agents.reduce((sum, agent) => sum + agent.risk_score, 0) / agents.length 
      : 0,
    highRiskAgents: agents.filter(agent => agent.risk_level === 'HIGH').length,
    criticalMarginAgents: agents.filter(agent => agent.margin_usage >= 0.8).length,
    totalVar1d: agents.reduce((sum, agent) => sum + agent.var_1d, 0),
    totalDailyPnl: agents.reduce((sum, agent) => sum + agent.daily_pnl, 0)
  }

  // Risk distribution for pie chart
  const riskDistribution = [
    { name: 'Low Risk', value: agents.filter(a => a.risk_level === 'LOW').length, color: '#10B981' },
    { name: 'Medium Risk', value: agents.filter(a => a.risk_level === 'MEDIUM').length, color: '#F59E0B' },
    { name: 'High Risk', value: agents.filter(a => a.risk_level === 'HIGH').length, color: '#EF4444' }
  ]

  // Leverage distribution
  const leverageDistribution = [
    { name: '1-5x', value: agents.filter(a => a.portfolio_leverage <= 5).length, color: '#10B981' },
    { name: '5-10x', value: agents.filter(a => a.portfolio_leverage > 5 && a.portfolio_leverage <= 10).length, color: '#3B82F6' },
    { name: '10-15x', value: agents.filter(a => a.portfolio_leverage > 10 && a.portfolio_leverage <= 15).length, color: '#F59E0B' },
    { name: '15-20x', value: agents.filter(a => a.portfolio_leverage > 15).length, color: '#EF4444' }
  ]

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getMarginColor = (usage: number) => {
    if (usage >= 0.9) return 'text-red-600'
    if (usage >= 0.7) return 'text-yellow-600'
    if (usage >= 0.5) return 'text-blue-600'
    return 'text-green-600'
  }

  // Urgent alerts
  const urgentAlerts = agents.filter(agent => 
    agent.immediate_actions.length > 0 || 
    agent.margin_usage >= 0.9 || 
    agent.time_to_liquidation_hours < 24
  )

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leverage Monitoring Dashboard</h2>
          <p className="text-gray-600">Real-time leverage risk monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && alertsOpen && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-red-800">
                  {urgentAlerts.length} Critical Alert{urgentAlerts.length > 1 ? 's' : ''} Detected
                </strong>
                <p className="text-red-700 mt-1">
                  Immediate attention required for: {urgentAlerts.map(a => a.agent_name).join(', ')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAlertsOpen(false)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Leverage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolioStats.avgLeverage.toFixed(1)}x
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average across {agents.length} agents
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margin Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((portfolioStats.totalMarginUsed / (portfolioStats.totalMarginUsed + portfolioStats.totalAvailableMargin)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ${portfolioStats.totalMarginUsed.toLocaleString()} used
                </p>
              </div>
              <Target className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily VaR</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolioStats.totalVar1d.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  95% confidence, 1-day
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolioStats.avgRiskScore.toFixed(0)}/100
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {portfolioStats.highRiskAgents} high risk agents
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${portfolioStats.avgRiskScore >= 70 ? 'text-red-600' : portfolioStats.avgRiskScore >= 40 ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio History Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Leverage History</CardTitle>
                <CardDescription>Real-time leverage and risk metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portfolioHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="total_leverage" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Portfolio Leverage"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="risk_score" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Risk Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Agent risk levels and leverage distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Levels</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`risk-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Leverage Ranges</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={leverageDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {leverageDistribution.map((entry, index) => (
                            <Cell key={`leverage-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.agent_id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                    <Badge className={getRiskColor(agent.risk_level)}>
                      {agent.risk_level}
                    </Badge>
                  </div>
                  <CardDescription>
                    Risk Score: {agent.risk_score}/100
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Leverage</p>
                      <p className="font-bold text-lg">{agent.portfolio_leverage.toFixed(1)}x</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Margin Usage</p>
                      <p className={`font-bold text-lg ${getMarginColor(agent.margin_usage)}`}>
                        {(agent.margin_usage * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Daily VaR</p>
                      <p className="font-bold">${agent.var_1d.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Positions</p>
                      <p className="font-bold">{agent.positions_count}</p>
                    </div>
                  </div>

                  {/* Liquidation Risk */}
                  {agent.time_to_liquidation_hours < 168 && ( // 1 week
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Liquidation Risk: {agent.time_to_liquidation_hours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Immediate Actions */}
                  {agent.immediate_actions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Immediate Actions Required</span>
                      </div>
                      {agent.immediate_actions.map((action, index) => (
                        <Alert key={index} className="border-red-200 bg-red-50 py-2">
                          <AlertDescription className="text-xs text-red-800">
                            {action}
                          </AlertDescription>
                        </Alert>
                      ))}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => onEmergencyAction(agent.agent_id)}
                      >
                        Emergency Action
                      </Button>
                    </div>
                  )}

                  {/* Recommendations */}
                  {agent.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">Recommendations:</p>
                      {agent.recommendations.slice(0, 2).map((rec, index) => (
                        <p key={index} className="text-xs text-gray-600">• {rec}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Margin Usage Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Margin Usage Trend</CardTitle>
                <CardDescription>Portfolio margin utilization over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={portfolioHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="margin_usage" 
                      stroke="#F59E0B" 
                      fill="#FEF3C7"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* VaR Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Value at Risk Analysis</CardTitle>
                <CardDescription>Risk exposure across time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={portfolioHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="var_amount" 
                      stroke="#EF4444" 
                      fill="#FEE2E2"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {urgentAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Systems Normal</h3>
                  <p className="text-gray-600">No urgent alerts or actions required at this time.</p>
                </CardContent>
              </Card>
            ) : (
              urgentAlerts.map((agent) => (
                <Card key={`alert-${agent.agent_id}`} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-red-800">{agent.agent_name} - Critical Alert</CardTitle>
                      <Badge variant="destructive">URGENT</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {agent.immediate_actions.map((action, index) => (
                      <Alert key={index} className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          {action}
                        </AlertDescription>
                      </Alert>
                    ))}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="destructive"
                        onClick={() => onEmergencyAction(agent.agent_id)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Execute Emergency Protocol
                      </Button>
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}