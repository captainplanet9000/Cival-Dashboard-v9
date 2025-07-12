/**
 * Leverage Monitoring Dashboard
 * Real-time monitoring of agent leverage positions and risk metrics
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp, TrendingDown, AlertTriangle, Shield, Zap, 
  BarChart3, RefreshCw, Target, DollarSign, Activity
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface LeveragePosition {
  position_id: string
  agent_id: string
  asset: string
  side: 'long' | 'short'
  size: number
  entry_price: number
  current_price: number
  leverage_ratio: number
  margin_used: number
  unrealized_pnl: number
  liquidation_price: number
  margin_status: 'safe' | 'warning' | 'critical' | 'liquidation'
}

interface LeverageMetrics {
  agent_id: string
  portfolio_leverage: number
  margin_usage_percentage: number
  available_margin: number
  total_margin_used: number
  liquidation_risk_score: number
  positions: LeveragePosition[]
}

interface LeverageMonitoringDashboardProps {
  className?: string
}

export default function LeverageMonitoringDashboard({ className }: LeverageMonitoringDashboardProps) {
  const [leveragePositions, setLeveragePositions] = useState<LeveragePosition[]>([])
  const [agentMetrics, setAgentMetrics] = useState<LeverageMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Fetch leverage data
  const fetchLeverageData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all leverage positions
      const positionsResponse = await fetch('/api/v1/leverage/positions')
      const positionsData = await positionsResponse.json()
      setLeveragePositions(positionsData.positions || [])
      
      // Fetch agent metrics (for demo agents)
      const agentIds = ['agent_001', 'agent_002', 'agent_003']
      const metricsPromises = agentIds.map(async (agentId) => {
        const response = await fetch(`/api/v1/leverage/agents/${agentId}/metrics`)
        return response.json()
      })
      
      const metricsResults = await Promise.all(metricsPromises)
      setAgentMetrics(metricsResults.filter(m => m.agent_id))
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching leverage data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeverageData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeverageData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calculate summary statistics
  const summaryStats = {
    totalPositions: leveragePositions.length,
    totalMarginUsed: leveragePositions.reduce((sum, pos) => sum + pos.margin_used, 0),
    totalUnrealizedPnL: leveragePositions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0),
    averageLeverage: leveragePositions.length > 0 ? 
      leveragePositions.reduce((sum, pos) => sum + pos.leverage_ratio, 0) / leveragePositions.length : 0,
    riskPositions: leveragePositions.filter(pos => 
      pos.margin_status === 'warning' || pos.margin_status === 'critical'
    ).length
  }

  // Generate chart data for leverage utilization
  const leverageChartData = agentMetrics.map(metrics => ({
    agent: metrics.agent_id.replace('agent_', 'Agent '),
    leverage: metrics.portfolio_leverage,
    margin_usage: metrics.margin_usage_percentage,
    risk_score: metrics.liquidation_risk_score
  }))

  // Position distribution by asset
  const assetDistribution = leveragePositions.reduce((acc, pos) => {
    acc[pos.asset] = (acc[pos.asset] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const assetChartData = Object.entries(assetDistribution).map(([asset, count]) => ({
    asset,
    count,
    percentage: (count / leveragePositions.length * 100).toFixed(1)
  }))

  const getMarginStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      case 'liquidation': return 'text-red-800'
      default: return 'text-gray-600'
    }
  }

  const getMarginStatusBadge = (status: string) => {
    switch (status) {
      case 'safe': return <Badge variant="outline" className="text-green-600 border-green-600">Safe</Badge>
      case 'warning': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Warning</Badge>
      case 'critical': return <Badge variant="outline" className="text-red-600 border-red-600">Critical</Badge>
      case 'liquidation': return <Badge variant="destructive">Liquidation</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leverage Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of agent leverage positions and risk metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeverageData}
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

      {/* Risk Alerts */}
      {summaryStats.riskPositions > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {summaryStats.riskPositions} position(s) require attention due to elevated risk levels.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              Active leverage positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalMarginUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Margin currently used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {summaryStats.totalUnrealizedPnL >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> :
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summaryStats.totalUnrealizedPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total unrealized P&L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Leverage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.averageLeverage.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">
              Average position leverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Positions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.riskPositions > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summaryStats.riskPositions}
            </div>
            <p className="text-xs text-muted-foreground">
              Positions at risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Leverage Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Leverage Utilization</CardTitle>
            <CardDescription>
              Leverage ratio and margin usage by agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leverageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leverage" fill="#8884d8" name="Leverage (x)" />
                  <Bar dataKey="margin_usage" fill="#82ca9d" name="Margin Usage (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Position Distribution</CardTitle>
            <CardDescription>
              Distribution of positions across assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetChartData.map((item, index) => (
                <div key={item.asset} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">{item.asset}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Progress value={parseFloat(item.percentage)} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.percentage}%
                    </span>
                    <span className="text-sm font-medium w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Leverage Positions</CardTitle>
          <CardDescription>
            Detailed view of all active leveraged positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Position</th>
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 font-medium">Asset</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Leverage</th>
                  <th className="pb-2 font-medium">Entry Price</th>
                  <th className="pb-2 font-medium">Current Price</th>
                  <th className="pb-2 font-medium">P&L</th>
                  <th className="pb-2 font-medium">Margin Used</th>
                  <th className="pb-2 font-medium">Liq. Price</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leveragePositions.map((position, index) => (
                  <motion.tr
                    key={position.position_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="py-2 font-mono text-sm">
                      {position.position_id.slice(-8)}
                    </td>
                    <td className="py-2">{position.agent_id.replace('agent_', 'Agent ')}</td>
                    <td className="py-2 font-medium">{position.asset}</td>
                    <td className="py-2">
                      <Badge variant={position.side === 'long' ? 'default' : 'secondary'}>
                        {position.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2">{position.size}</td>
                    <td className="py-2 font-medium">{position.leverage_ratio}x</td>
                    <td className="py-2">${position.entry_price.toLocaleString()}</td>
                    <td className="py-2">${position.current_price.toLocaleString()}</td>
                    <td className={`py-2 font-medium ${position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${position.unrealized_pnl.toLocaleString()}
                    </td>
                    <td className="py-2">${position.margin_used.toLocaleString()}</td>
                    <td className="py-2">${position.liquidation_price.toLocaleString()}</td>
                    <td className="py-2">
                      {getMarginStatusBadge(position.margin_status)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {leveragePositions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No active leverage positions
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Risk Metrics</CardTitle>
          <CardDescription>
            Risk assessment and margin utilization by agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentMetrics.map((metrics, index) => (
              <motion.div
                key={metrics.agent_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{metrics.agent_id.replace('agent_', 'Agent ')}</h3>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Portfolio Leverage:</span>
                    <span className="font-medium">{metrics.portfolio_leverage.toFixed(1)}x</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Margin Usage:</span>
                      <span className="font-medium">{metrics.margin_usage_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.margin_usage_percentage} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Available Margin:</span>
                    <span className="font-medium">${metrics.available_margin.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Risk Score:</span>
                    <span className={`font-medium ${
                      metrics.liquidation_risk_score > 70 ? 'text-red-600' :
                      metrics.liquidation_risk_score > 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {metrics.liquidation_risk_score.toFixed(0)}/100
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}