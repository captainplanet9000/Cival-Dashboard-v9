/**
 * LangSmith Observability Dashboard
 * Phase 7: Complete observability dashboard for LangChain analytics and monitoring
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  Activity, 
  Clock, 
  DollarSign,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import LangSmith integration
import { langSmithIntegration, type TraceData, type AgentMetrics, type LangSmithAnalytics } from '@/lib/langchain/LangSmithIntegration'

interface LangSmithObservabilityDashboardProps {
  className?: string
}

export function LangSmithObservabilityDashboard({ className }: LangSmithObservabilityDashboardProps) {
  const [analytics, setAnalytics] = useState<LangSmithAnalytics | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [agentAnalytics, setAgentAnalytics] = useState<any>(null)
  const [traces, setTraces] = useState<TraceData[]>([])
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('24h')
  const [searchTerm, setSearchTerm] = useState('')

  /**
   * Load analytics data
   */
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)

      // Get overall analytics
      const overallAnalytics = langSmithIntegration.getAnalytics()
      setAnalytics(overallAnalytics)

      // Get health status
      const health = await langSmithIntegration.healthCheck()
      setHealthStatus(health)

      // Export recent traces
      const startTime = Date.now() - (timeRange === '1h' ? 3600000 : 
                                     timeRange === '24h' ? 86400000 : 
                                     timeRange === '7d' ? 604800000 : 86400000)
      const recentTraces = langSmithIntegration.exportTraces(startTime)
      setTraces(recentTraces)

      // Get agent-specific analytics if agent is selected
      if (selectedAgent) {
        const agentData = langSmithIntegration.getAgentAnalytics(selectedAgent)
        setAgentAnalytics(agentData)
      }

    } catch (error) {
      console.error('Failed to load LangSmith analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, selectedAgent])

  /**
   * Auto-refresh data
   */
  useEffect(() => {
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [loadAnalytics])

  /**
   * Filter traces based on search term
   */
  const filteredTraces = traces.filter(trace => 
    !searchTerm || 
    trace.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trace.metadata.activity?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            LangSmith Observability
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and analyze LangChain agent performance and behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={cn(
                  'text-lg font-bold',
                  healthStatus.status === 'healthy' ? 'text-green-600' : 
                  healthStatus.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {healthStatus.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-500">Overall Status</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{healthStatus.tracesCount}</div>
                <div className="text-sm text-gray-500">Active Traces</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{healthStatus.metricsCount}</div>
                <div className="text-sm text-gray-500">Tracked Agents</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {healthStatus.hasClient ? 'Connected' : 'Local'}
                </div>
                <div className="text-sm text-gray-500">LangSmith</div>
              </div>
            </div>
            {healthStatus.errors.length > 0 && (
              <div className="mt-4 space-y-1">
                {healthStatus.errors.map((error: string, index: number) => (
                  <div key={index} className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview Metrics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics.totalAgents}</div>
                  <div className="text-sm text-gray-500">Total Agents</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics.totalTraces}</div>
                  <div className="text-sm text-gray-500">Total Traces</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{(analytics.avgSuccessRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">${analytics.totalCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Total Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="traces">Traces</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Agents */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Performing Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topPerformingAgents.slice(0, 5).map((agent, index) => (
                      <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{agent.agentId}</div>
                            <div className="text-sm text-gray-500">{agent.totalTraces} traces</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{agent.performanceScore}</div>
                          <div className="text-sm text-gray-500">score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Errors */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Recent Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {analytics.recentErrors.length > 0 ? (
                        analytics.recentErrors.map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                            {error}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          No recent errors
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {analytics?.topPerformingAgents.map(agent => (
                  <SelectItem key={agent.agentId} value={agent.agentId}>
                    {agent.agentId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAgent && agentAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Metrics: {selectedAgent}</CardTitle>
                </CardHeader>
                <CardContent>
                  {agentAnalytics.metrics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{agentAnalytics.metrics.totalTraces}</div>
                          <div className="text-sm text-gray-500">Total Traces</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {(agentAnalytics.metrics.successRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">Success Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{agentAnalytics.metrics.avgLatency.toFixed(0)}ms</div>
                          <div className="text-sm text-gray-500">Avg Latency</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">${agentAnalytics.metrics.totalCost.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Total Cost</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Performance Score</span>
                          <span className="font-bold">{agentAnalytics.metrics.performanceScore}/100</span>
                        </div>
                        <Progress value={agentAnalytics.metrics.performanceScore} className="h-2" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Agent Traces */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Traces</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {agentAnalytics.recentTraces.map((trace: TraceData) => (
                        <div key={trace.traceId} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(trace.status)}>
                              {trace.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDuration(trace.metrics.latency)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{trace.metadata.activity}</div>
                            <div className="text-gray-500">
                              {new Date(trace.startTime).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Traces Tab */}
        <TabsContent value="traces" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search traces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trace History</CardTitle>
              <CardDescription>
                Showing {filteredTraces.length} traces from the last {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredTraces.map((trace) => (
                    <div key={trace.traceId} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(trace.status)}>
                            {trace.status}
                          </Badge>
                          <span className="font-medium">{trace.agentId}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatDuration(trace.metrics.latency)}</span>
                          <span>${trace.metrics.cost.toFixed(3)}</span>
                          <span>{trace.metrics.tokenCount} tokens</span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{trace.metadata.activity}</div>
                        <div className="text-gray-500 mt-1">
                          {new Date(trace.startTime).toLocaleString()}
                        </div>
                        {trace.error && (
                          <div className="text-red-600 mt-2 p-2 bg-red-50 rounded text-xs">
                            {trace.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Cost trend chart will be displayed here
                  <br />
                  <small>Integration with Chart.js coming soon</small>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Performance trend chart will be displayed here
                  <br />
                  <small>Integration with Chart.js coming soon</small>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Error Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {traces.filter(t => t.status === 'error').map((trace) => (
                    <div key={trace.traceId} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{trace.agentId}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(trace.startTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{trace.metadata.activity}</div>
                        {trace.error && (
                          <div className="text-red-600 mt-2 p-2 bg-white rounded text-xs">
                            {trace.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {traces.filter(t => t.status === 'error').length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No errors found in the selected time range
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LangSmithObservabilityDashboard