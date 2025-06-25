/**
 * MCP Integration Panel Component
 * Displays MCP (Model Context Protocol) integration status and tool management for LangChain agents
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Activity, 
  Settings, 
  Tool, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  BarChart3,
  Zap,
  Shield,
  Brain,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { langChainMCPIntegration } from '@/lib/langchain/MCPIntegration'

interface MCPIntegrationPanelProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function MCPIntegrationPanel({ 
  className, 
  autoRefresh = true,
  refreshInterval = 10000 
}: MCPIntegrationPanelProps) {
  const [integrationStats, setIntegrationStats] = useState<any>({})
  const [agentStats, setAgentStats] = useState<Map<string, any>>(new Map())
  const [healthStatus, setHealthStatus] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all MCP integration data
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get overall integration stats
      const stats = langChainMCPIntegration.getIntegrationStats()
      setIntegrationStats(stats)

      // Get health status
      const health = await langChainMCPIntegration.healthCheck()
      setHealthStatus(health)

      // Get individual agent stats
      const agentStatsMap = new Map()
      // Note: In a real implementation, we'd get the agent list from the integration
      // For now, we'll use mock data
      const mockAgentIds = ['momentum_agent_llm', 'mean_reversion_agent_llm', 'risk_manager_llm']
      
      for (const agentId of mockAgentIds) {
        try {
          const agentStat = langChainMCPIntegration.getAgentMCPStats(agentId)
          agentStatsMap.set(agentId, agentStat)
        } catch (err) {
          console.warn(`Failed to get stats for agent ${agentId}:`, err)
        }
      }
      
      setAgentStats(agentStatsMap)

    } catch (err) {
      console.error('Failed to fetch MCP integration data:', err)
      setError(err.toString())
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Set up auto-refresh
   */
  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  /**
   * Get status color based on health
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'unhealthy': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  /**
   * Get status icon based on health
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tool className="h-5 w-5" />
            MCP Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading MCP integration data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tool className="h-5 w-5" />
                MCP Integration
              </CardTitle>
              <CardDescription>
                Model Context Protocol integration for enhanced agent capabilities
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(healthStatus.status)}
              <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.status || 'Unknown'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Integration Error</AlertTitle>
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{integrationStats.totalAgents || 0}</div>
                <div className="text-sm text-gray-500">Agents Registered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tool className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{integrationStats.totalTools || 0}</div>
                <div className="text-sm text-gray-500">Tools Available</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{integrationStats.totalCalls || 0}</div>
                <div className="text-sm text-gray-500">Tool Calls</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {((integrationStats.successRate || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
          <TabsTrigger value="calls">Recent Calls</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
        </TabsList>

        {/* Agent Status Tab */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent MCP Status</CardTitle>
              <CardDescription>
                Individual agent tool integration and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(agentStats.entries()).map(([agentId, stats]) => (
                  <Card key={agentId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{agentId}</h4>
                        <Badge variant={stats.session?.status === 'active' ? 'default' : 'secondary'}>
                          {stats.session?.status || 'Unknown'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{stats.toolsAvailable}</div>
                          <div className="text-gray-500">Tools Available</div>
                        </div>
                        <div>
                          <div className="font-medium">{stats.totalCalls}</div>
                          <div className="text-gray-500">Total Calls</div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {((stats.successfulCalls / Math.max(stats.totalCalls, 1)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-gray-500">Success Rate</div>
                        </div>
                        <div>
                          <div className="font-medium">{stats.avgResponseTime.toFixed(0)}ms</div>
                          <div className="text-gray-500">Avg Response</div>
                        </div>
                      </div>

                      {stats.totalCalls > 0 && (
                        <div className="mt-2">
                          <Progress 
                            value={(stats.successfulCalls / stats.totalCalls) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {agentStats.size === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No agents registered with MCP integration
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Available MCP Tools</CardTitle>
              <CardDescription>
                Tools available for LangChain agent integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationStats.mcpStats?.toolUsage?.map((tool: any) => (
                  <Card key={tool.toolId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{tool.name}</h4>
                          <p className="text-sm text-gray-600">{tool.toolId}</p>
                        </div>
                        <Badge variant="outline">{tool.category}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{tool.usage.totalCalls}</div>
                          <div className="text-gray-500">Total Calls</div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {(tool.usage.successRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-gray-500">Success Rate</div>
                        </div>
                        <div>
                          <div className="font-medium">{tool.usage.avgResponseTime.toFixed(0)}ms</div>
                          <div className="text-gray-500">Avg Response</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No tool usage data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Calls Tab */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tool Calls</CardTitle>
              <CardDescription>
                Latest MCP tool executions from LangChain agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {/* Mock recent calls data */}
                  <div className="text-center py-8 text-gray-500">
                    No recent tool calls to display
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Check Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Integration Health</CardTitle>
              <CardDescription>
                MCP integration system health and diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthStatus.status)}
                    <span className="font-medium">Overall Status</span>
                  </div>
                  <Badge 
                    variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}
                    className={getStatusColor(healthStatus.status)}
                  >
                    {healthStatus.status || 'Unknown'}
                  </Badge>
                </div>

                {/* MCP Service Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">MCP Service</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>Active Agents: {healthStatus.agentsRegistered || 0}</div>
                        <div>Tools Available: {healthStatus.toolsAvailable || 0}</div>
                        <div>Success Rate: {((integrationStats.successRate || 0) * 100).toFixed(1)}%</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Performance</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>Avg Response: {(integrationStats.avgResponseTime || 0).toFixed(0)}ms</div>
                        <div>Active Sessions: {integrationStats.activeSessions || 0}</div>
                        <div>Total Calls: {integrationStats.totalCalls || 0}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Errors */}
                {healthStatus.recentErrors && healthStatus.recentErrors.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="text-yellow-700">Recent Errors</AlertTitle>
                    <AlertDescription className="text-yellow-600">
                      <div className="space-y-1 mt-2">
                        {healthStatus.recentErrors.slice(0, 3).map((error: string, index: number) => (
                          <div key={index} className="text-sm font-mono bg-yellow-100 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MCPIntegrationPanel