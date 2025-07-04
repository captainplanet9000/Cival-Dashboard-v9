"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Activity, TrendingUp, Users, Target, DollarSign, BarChart3, Settings } from 'lucide-react'
import { useOrchestrationData } from '@/lib/hooks/useOrchestrationData'
import { AgentFarmView } from './AgentFarmView'
import { CapitalFlowView } from './CapitalFlowView'
import { PerformanceAttributionView } from './PerformanceAttributionView'
import { EventMonitorView } from './EventMonitorView'

interface OrchestrationMetrics {
  totalAgents: number
  activeFarms: number
  activeGoals: number
  totalCapitalDeployed: number
  averagePerformance: number
  eventCount24h: number
  systemHealth: number
}

export function OrchestrationDashboard() {
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

  const [selectedTab, setSelectedTab] = useState('overview')

  const defaultMetrics: OrchestrationMetrics = {
    totalAgents: 0,
    activeFarms: 0,
    activeGoals: 0,
    totalCapitalDeployed: 0,
    averagePerformance: 0,
    eventCount24h: 0,
    systemHealth: 95
  }

  const currentMetrics = metrics || defaultMetrics

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Error loading orchestration data: {error}</span>
          </div>
          <Button onClick={refreshData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Orchestration</h1>
          <p className="text-muted-foreground">
            Multi-level agent coordination and performance attribution
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refreshData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              Across {currentMetrics.activeFarms} farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.activeGoals}</div>
            <p className="text-xs text-muted-foreground">
              Performance targets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Deployed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(currentMetrics.totalCapitalDeployed || 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all strategies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(currentMetrics.averagePerformance || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              24h average return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Health</CardTitle>
          <CardDescription>
            Overall orchestration system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>System Health</span>
              <span>{currentMetrics.systemHealth}%</span>
            </div>
            <Progress value={currentMetrics.systemHealth} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>All services operational</span>
              <span>{currentMetrics.eventCount24h} events processed (24h)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agent-farms">Agent & Farms</TabsTrigger>
          <TabsTrigger value="capital-flow">Capital Flow</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Events</span>
                </CardTitle>
                <CardDescription>
                  Latest orchestration events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventData?.recent_events?.slice(0, 5).map((event: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={event.priority === 'high' ? 'destructive' : 'secondary'}>
                          {event.event_type}
                        </Badge>
                        <span className="text-sm">{event.description || 'Event processed'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-4">
                      No recent events
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Top Performers</span>
                </CardTitle>
                <CardDescription>
                  Best performing agents (24h)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData?.top_agents?.slice(0, 5).map((agent: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">#{index + 1}</span>
                        </div>
                        <div>
                          <span className="font-medium">{agent.agent_id}</span>
                          <p className="text-xs text-muted-foreground">{agent.strategy}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${agent.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {agent.performance > 0 ? '+' : ''}{(agent.performance || 0).toFixed(2)}%
                        </span>
                        <p className="text-xs text-muted-foreground">
                          ${(agent.pnl || 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-4">
                      No performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agent-farms">
          <AgentFarmView data={agentFarmData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="capital-flow">
          <CapitalFlowView data={capitalFlowData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceAttributionView data={performanceData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* Event Monitor (floating) */}
      <EventMonitorView events={eventData?.live_events} />
    </div>
  )
}