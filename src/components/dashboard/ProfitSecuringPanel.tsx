/**
 * Profit Securing Panel
 * Monitor and manage profit securing milestones and DeFi deposits
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp, DollarSign, Shield, Target, Coins, 
  RefreshCw, CheckCircle, Clock, AlertCircle, Zap
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ProfitMilestone {
  milestone_id: string
  amount: number
  secure_percentage: number
  triggered: boolean
  triggered_at?: string
  secured_amount?: number
  borrowed_amount?: number
  protocol: string
}

interface ProfitMetrics {
  agent_id: string
  total_secured: number
  total_borrowed: number
  total_milestones_triggered: number
  total_goals_completed: number
  net_yield: number
  average_health_factor: number
  compounding_rate: number
  risk_score: number
}

interface HealthStatus {
  timestamp: string
  total_positions_monitored: number
  alerts: Array<{
    agent_id: string
    position_id: string
    protocol: string
    health_factor: number
    severity: 'critical' | 'warning'
  }>
  rebalancing_needed: Array<{
    agent_id: string
    position_id: string
    action: string
  }>
  overall_health: 'good' | 'needs_attention'
}

interface ProfitSecuringPanelProps {
  className?: string
}

export default function ProfitSecuringPanel({ className }: ProfitSecuringPanelProps) {
  const [agentMilestones, setAgentMilestones] = useState<Record<string, ProfitMilestone[]>>({})
  const [agentMetrics, setAgentMetrics] = useState<ProfitMetrics[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Demo agent IDs
  const agentIds = ['agent_001', 'agent_002', 'agent_003']

  // Fetch profit securing data
  const fetchProfitData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch milestones for each agent
      const milestonesPromises = agentIds.map(async (agentId) => {
        const response = await fetch(`/api/v1/profit-securing/agents/${agentId}/milestones`)
        const data = await response.json()
        return { agentId, milestones: data.milestones || [] }
      })
      
      const milestonesResults = await Promise.all(milestonesPromises)
      const milestonesMap = milestonesResults.reduce((acc, { agentId, milestones }) => {
        acc[agentId] = milestones
        return acc
      }, {} as Record<string, ProfitMilestone[]>)
      setAgentMilestones(milestonesMap)
      
      // Fetch metrics for each agent
      const metricsPromises = agentIds.map(async (agentId) => {
        const response = await fetch(`/api/v1/profit-securing/agents/${agentId}/metrics`)
        return response.json()
      })
      
      const metricsResults = await Promise.all(metricsPromises)
      setAgentMetrics(metricsResults.filter(m => m.agent_id))
      
      // Fetch health status
      const healthResponse = await fetch('/api/v1/profit-securing/health-monitor')
      const healthData = await healthResponse.json()
      setHealthStatus(healthData)
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching profit securing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfitData()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchProfitData, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate summary statistics
  const summaryStats = {
    totalSecured: agentMetrics.reduce((sum, m) => sum + m.total_secured, 0),
    totalBorrowed: agentMetrics.reduce((sum, m) => sum + m.total_borrowed, 0),
    totalMilestones: agentMetrics.reduce((sum, m) => sum + m.total_milestones_triggered, 0),
    totalGoalsCompleted: agentMetrics.reduce((sum, m) => sum + m.total_goals_completed, 0),
    averageYield: agentMetrics.length > 0 ? 
      agentMetrics.reduce((sum, m) => sum + m.net_yield, 0) / agentMetrics.length : 0,
    averageHealthFactor: agentMetrics.length > 0 ?
      agentMetrics.reduce((sum, m) => sum + m.average_health_factor, 0) / agentMetrics.length : 0
  }

  // Protocol distribution data
  const protocolDistribution = agentMetrics.reduce((acc, metrics) => {
    // This would normally come from actual protocol data
    const protocols = ['aave', 'compound', 'makerdao']
    const secured_per_protocol = metrics.total_secured / protocols.length
    
    protocols.forEach(protocol => {
      acc[protocol] = (acc[protocol] || 0) + secured_per_protocol
    })
    return acc
  }, {} as Record<string, number>)

  const protocolChartData = Object.entries(protocolDistribution).map(([protocol, amount]) => ({
    protocol: protocol.charAt(0).toUpperCase() + protocol.slice(1),
    amount,
    percentage: (amount / summaryStats.totalSecured * 100).toFixed(1)
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  // Performance chart data
  const performanceData = agentMetrics.map(metrics => ({
    agent: metrics.agent_id.replace('agent_', 'Agent '),
    secured: metrics.total_secured,
    borrowed: metrics.total_borrowed,
    yield: metrics.net_yield,
    compound_rate: metrics.compounding_rate
  }))

  const getMilestoneStatusBadge = (milestone: ProfitMilestone) => {
    if (milestone.triggered) {
      return <Badge variant="default" className="text-green-600 border-green-600">Triggered</Badge>
    }
    return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
  }

  const getHealthFactorColor = (factor: number) => {
    if (factor >= 2.0) return 'text-green-600'
    if (factor >= 1.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleSecureMilestone = async (agentId: string, milestoneAmount: number) => {
    try {
      const response = await fetch(`/api/v1/profit-securing/agents/${agentId}/secure-milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_amount: milestoneAmount,
          total_profit: milestoneAmount * 1.2 // Assume 20% over milestone
        })
      })
      
      if (response.ok) {
        await fetchProfitData() // Refresh data
      }
    } catch (error) {
      console.error('Error securing milestone:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit Securing</h1>
          <p className="text-muted-foreground">
            Monitor profit milestones and DeFi deposits across all agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProfitData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <span className="text-sm text-muted-foreground">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Health Alerts */}
      {healthStatus && healthStatus.alerts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {healthStatus.alerts.length} position(s) require attention due to low health factors.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Secured</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalSecured.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Secured in DeFi protocols
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalBorrowed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Borrowed for compound growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalMilestones}</div>
            <p className="text-xs text-muted-foreground">
              Milestones triggered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Complete</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalGoalsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Goals with profit secured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.averageYield.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Net yield across positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Factor</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthFactorColor(summaryStats.averageHealthFactor)}`}>
              {summaryStats.averageHealthFactor.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average health factor
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="health">Health Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          {/* Agent Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {agentIds.map((agentId, index) => (
              <motion.div
                key={agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{agentId.replace('agent_', 'Agent ')}</span>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Profit milestones and securing status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agentMilestones[agentId]?.map((milestone, idx) => (
                        <div key={milestone.milestone_id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                            {getMilestoneStatusBadge(milestone)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Secure:</span>
                              <span>{milestone.secure_percentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Protocol:</span>
                              <span className="capitalize">{milestone.protocol}</span>
                            </div>
                            {milestone.triggered && milestone.secured_amount && (
                              <div className="flex justify-between">
                                <span>Secured:</span>
                                <span className="text-green-600 font-medium">
                                  ${milestone.secured_amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {milestone.triggered && milestone.borrowed_amount && (
                              <div className="flex justify-between">
                                <span>Borrowed:</span>
                                <span className="text-blue-600 font-medium">
                                  ${milestone.borrowed_amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {!milestone.triggered && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleSecureMilestone(agentId, milestone.amount)}
                            >
                              Secure Now
                            </Button>
                          )}
                        </div>
                      )) || (
                        <div className="text-center py-4 text-muted-foreground">
                          No milestones configured
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Metrics</CardTitle>
              <CardDescription>
                Secured amounts, borrowed capital, and yield performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agent" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="secured"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Secured ($)"
                    />
                    <Area
                      type="monotone"
                      dataKey="borrowed"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Borrowed ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Agent Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentMetrics.map((metrics, index) => (
              <motion.div
                key={metrics.agent_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{metrics.agent_id.replace('agent_', 'Agent ')}</span>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Secured:</span>
                        <span className="font-medium">${metrics.total_secured.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Borrowed:</span>
                        <span className="font-medium">${metrics.total_borrowed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Net Yield:</span>
                        <span className="font-medium text-green-600">{metrics.net_yield.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compound Rate:</span>
                        <span className="font-medium text-blue-600">{metrics.compounding_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Health Factor:</span>
                        <span className={`font-medium ${getHealthFactorColor(metrics.average_health_factor)}`}>
                          {metrics.average_health_factor.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Risk Score:</span>
                        <span className={`font-medium ${
                          metrics.risk_score > 70 ? 'text-red-600' :
                          metrics.risk_score > 40 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {metrics.risk_score.toFixed(0)}/100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protocol Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Protocol Distribution</CardTitle>
                <CardDescription>
                  Distribution of secured funds across DeFi protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={protocolChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ protocol, percentage }) => `${protocol} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {protocolChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Protocol Details */}
            <Card>
              <CardHeader>
                <CardTitle>Protocol Details</CardTitle>
                <CardDescription>
                  APY and health metrics by protocol
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {protocolChartData.map((protocol, index) => (
                    <div key={protocol.protocol} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{protocol.protocol}</h4>
                        <Badge variant="outline">{protocol.percentage}%</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-medium">${protocol.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">APY:</span>
                          <p className="font-medium text-green-600">
                            {index === 0 ? '3.5%' : index === 1 ? '2.9%' : '4.1%'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {/* Health Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Health Factor Monitoring</CardTitle>
              <CardDescription>
                Real-time monitoring of position health across all protocols
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{healthStatus.total_positions_monitored}</div>
                      <p className="text-sm text-muted-foreground">Positions Monitored</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${healthStatus.alerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {healthStatus.alerts.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Alerts</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${healthStatus.overall_health === 'good' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {healthStatus.overall_health === 'good' ? 'Good' : 'Attention'}
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Health</p>
                    </div>
                  </div>

                  {healthStatus.alerts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Active Alerts</h4>
                      {healthStatus.alerts.map((alert, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Agent {alert.agent_id.replace('agent_', '')} on {alert.protocol}: 
                            Health factor {alert.health_factor.toFixed(2)} ({alert.severity})
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {healthStatus.rebalancing_needed.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Rebalancing Recommendations</h4>
                      {healthStatus.rebalancing_needed.map((rebalance, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span>Agent {rebalance.agent_id.replace('agent_', '')}</span>
                            <Badge variant="outline">{rebalance.action}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading health status...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}