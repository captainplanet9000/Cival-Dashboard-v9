"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart3, TrendingUp, TrendingDown, Activity, Target, DollarSign,
  Users, Zap, Brain, Shield, AlertTriangle, Clock, RefreshCw
} from 'lucide-react'
import { useOrchestrationData } from '@/lib/hooks/useOrchestrationData'
import { useRealTimeOrchestration } from '@/lib/hooks/useRealTimeOrchestration'
import { PerformanceAttributionChart } from './PerformanceAttributionChart'
import { CapitalFlowChart } from './CapitalFlowChart'
import { AgentPerformanceRanking } from './AgentPerformanceRanking'

interface OrchestrationAnalyticsProps {
  className?: string
}

export function OrchestrationAnalytics({ className }: OrchestrationAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedMetric, setSelectedMetric] = useState('performance')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Get orchestration data
  const {
    metrics,
    agentFarmData,
    capitalFlowData,
    performanceData,
    eventData,
    isLoading,
    error,
    refreshData
  } = useOrchestrationData()
  
  // Get real-time orchestration data
  const {
    data: realtimeData,
    metrics: realtimeMetrics,
    isConnected: isRealtimeConnected
  } = useRealTimeOrchestration({
    maxEvents: 50,
    eventTypes: ['performance_updated', 'capital_reallocated', 'agent_assigned']
  })
  
  // Calculate derived metrics
  const derivedMetrics = React.useMemo(() => {
    if (!metrics) return null
    
    return {
      totalValue: metrics.totalCapitalDeployed || 0,
      performanceScore: metrics.averagePerformance || 0,
      efficiencyRatio: metrics.totalAgents > 0 ? (metrics.totalCapitalDeployed / metrics.totalAgents) : 0,
      systemUptime: metrics.systemHealth || 0,
      eventRate: realtimeMetrics.totalEvents || 0,
      activeEntities: (metrics.totalAgents || 0) + (metrics.activeFarms || 0) + (metrics.activeGoals || 0)
    }
  }, [metrics, realtimeMetrics])
  
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading orchestration analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orchestration Analytics</h2>
          <p className="text-muted-foreground">
            Advanced analytics and insights for agent-farm-goal orchestration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isRealtimeConnected ? 'Live Data' : 'Offline'}
            </span>
          </div>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(derivedMetrics?.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {metrics?.activeFarms || 0} farms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(derivedMetrics?.performanceScore || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average system performance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAgents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {metrics?.activeFarms || 0} farms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(derivedMetrics?.efficiencyRatio || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Capital per agent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-600" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {realtimeMetrics.criticalEventsCount} critical
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(derivedMetrics?.systemUptime || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              System uptime
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="capital">Capital Flow</TabsTrigger>
          <TabsTrigger value="agents">Agent Ranking</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  System Performance Overview
                </CardTitle>
                <CardDescription>
                  Real-time system metrics and health indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Agent Efficiency</span>
                      <span>{(derivedMetrics?.performanceScore || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={derivedMetrics?.performanceScore || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Capital Utilization</span>
                      <span>87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Health</span>
                      <span>{(derivedMetrics?.systemUptime || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={derivedMetrics?.systemUptime || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Goal Progress</span>
                      <span>72.5%</span>
                    </div>
                    <Progress value={72.5} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Real-time Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Real-time Activity
                </CardTitle>
                <CardDescription>
                  Live orchestration events and system updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {realtimeData.systemEvents.slice(0, 8).map((event, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        event.priority === 'critical' ? 'bg-red-500' :
                        event.priority === 'high' ? 'bg-orange-500' :
                        event.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.sourceService} • {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant={
                        event.priority === 'critical' ? 'destructive' :
                        event.priority === 'high' ? 'default' : 'secondary'
                      }>
                        {event.priority}
                      </Badge>
                    </div>
                  ))}
                  {realtimeData.systemEvents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Farm and Goal Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Farm Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentFarmData?.farms?.slice(0, 4).map((farm, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{farm.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {farm.agent_count} agents • ${farm.capital_allocated.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                          {farm.performance.toFixed(1)}%
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${farm.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Goal Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {capitalFlowData?.allocations?.slice(0, 4).map((allocation, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{allocation.goal_name}</span>
                        <span>{((allocation.total_allocation / 250000) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(allocation.total_allocation / 250000) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        ${allocation.total_allocation.toLocaleString()} across {allocation.farms.length} farms
                      </p>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceAttributionChart 
            data={performanceData}
            timeRange={selectedTimeRange}
          />
        </TabsContent>
        
        {/* Capital Flow Tab */}
        <TabsContent value="capital" className="space-y-4">
          <CapitalFlowChart 
            data={capitalFlowData}
            timeRange={selectedTimeRange}
          />
        </TabsContent>
        
        {/* Agent Ranking Tab */}
        <TabsContent value="agents" className="space-y-4">
          <AgentPerformanceRanking 
            data={performanceData}
            agentFarmData={agentFarmData}
            timeRange={selectedTimeRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OrchestrationAnalytics