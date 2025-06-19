/**
 * Memory Analytics Dashboard
 * Comprehensive memory system monitoring and optimization
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Brain,
  Database,
  TrendingUp,
  TrendingDown,
  Zap,
  Archive,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  Clock,
  HardDrive,
  Cpu
} from 'lucide-react'
import { backendApi } from '@/lib/api/backend-client'

interface MemoryAnalytics {
  memory_efficiency: number
  learning_progress: number
  decision_quality: number
  memory_utilization: {
    total_allocated_mb: number
    actually_used_mb: number
    efficiency_ratio: number
    hot_memory_mb: number
    warm_memory_mb: number
    cold_memory_mb: number
    fragmentation_ratio: number
  }
  recommended_optimizations: string[]
  tier_distribution: {
    hot: number
    warm: number
    cold: number
    archive: number
  }
  total_size_mb: number
  cleanup_candidates: number
}

interface AgentMemoryStatus {
  agent_id: string
  agent_name: string
  memory_size_mb: number
  efficiency: number
  last_cleanup: string
  needs_optimization: boolean
  status: 'healthy' | 'warning' | 'critical'
}

export function MemoryAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<MemoryAnalytics | null>(null)
  const [agentStatuses, setAgentStatuses] = useState<AgentMemoryStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  useEffect(() => {
    fetchMemoryAnalytics()
    fetchAgentStatuses()
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      if (!isOptimizing) {
        fetchMemoryAnalytics()
        fetchAgentStatuses()
      }
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [isOptimizing])

  const fetchMemoryAnalytics = async () => {
    try {
      const response = await backendApi.get('/api/v1/memory/analytics')
      if (response.data) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch memory analytics:', error)
      // Mock data for development
      setAnalytics({
        memory_efficiency: 0.82,
        learning_progress: 0.75,
        decision_quality: 0.68,
        memory_utilization: {
          total_allocated_mb: 120.5,
          actually_used_mb: 98.2,
          efficiency_ratio: 0.815,
          hot_memory_mb: 35.2,
          warm_memory_mb: 45.8,
          cold_memory_mb: 17.2,
          fragmentation_ratio: 0.12
        },
        recommended_optimizations: [
          'Consider archiving old cold memories',
          'Optimize decision history cleanup',
          'Compress rarely accessed data'
        ],
        tier_distribution: {
          hot: 125,
          warm: 340,
          cold: 89,
          archive: 23
        },
        total_size_mb: 98.2,
        cleanup_candidates: 45
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgentStatuses = async () => {
    try {
      const response = await backendApi.get('/api/v1/memory/agent-statuses')
      if (response.data) {
        setAgentStatuses(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch agent statuses:', error)
      // Mock data for development
      setAgentStatuses([
        {
          agent_id: 'marcus_momentum',
          agent_name: 'Marcus Momentum',
          memory_size_mb: 25.3,
          efficiency: 0.85,
          last_cleanup: '2025-01-01T12:00:00Z',
          needs_optimization: false,
          status: 'healthy'
        },
        {
          agent_id: 'alex_arbitrage',
          agent_name: 'Alex Arbitrage',
          memory_size_mb: 32.1,
          efficiency: 0.72,
          last_cleanup: '2024-12-28T08:30:00Z',
          needs_optimization: true,
          status: 'warning'
        },
        {
          agent_id: 'sophia_reversion',
          agent_name: 'Sophia Reversion',
          memory_size_mb: 18.7,
          efficiency: 0.91,
          last_cleanup: '2025-01-01T15:45:00Z',
          needs_optimization: false,
          status: 'healthy'
        },
        {
          agent_id: 'riley_risk',
          agent_name: 'Riley Risk',
          memory_size_mb: 22.1,
          efficiency: 0.67,
          last_cleanup: '2024-12-25T14:20:00Z',
          needs_optimization: true,
          status: 'critical'
        }
      ])
    }
  }

  const handleOptimizeAgent = async (agentId: string) => {
    setIsOptimizing(true)
    try {
      const response = await backendApi.post(`/api/v1/memory/optimize/${agentId}`)
      if (response.data) {
        // Refresh data after optimization
        await fetchMemoryAnalytics()
        await fetchAgentStatuses()
      }
    } catch (error) {
      console.error('Failed to optimize agent memory:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleOptimizeAll = async () => {
    setIsOptimizing(true)
    try {
      const response = await backendApi.post('/api/v1/memory/optimize-all')
      if (response.data) {
        // Refresh data after optimization
        await fetchMemoryAnalytics()
        await fetchAgentStatuses()
      }
    } catch (error) {
      console.error('Failed to optimize all agents:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'critical': return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Memory Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive memory system monitoring and optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMemoryAnalytics}
            disabled={isOptimizing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOptimizeAll}
            disabled={isOptimizing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isOptimizing ? 'Optimizing...' : 'Optimize All'}
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory Efficiency</p>
                <p className="text-2xl font-bold">{((analytics?.memory_efficiency || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={(analytics?.memory_efficiency || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Progress</p>
                <p className="text-2xl font-bold">{((analytics?.learning_progress || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={(analytics?.learning_progress || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Memory</p>
                <p className="text-2xl font-bold">{analytics?.total_size_mb.toFixed(1) || '0.0'} MB</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics?.cleanup_candidates || 0} cleanup candidates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Decision Quality</p>
                <p className="text-2xl font-bold">{((analytics?.decision_quality || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <Progress value={(analytics?.decision_quality || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Memory</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Memory Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Memory Tier Distribution
              </CardTitle>
              <CardDescription>
                Distribution of memories across hot, warm, cold, and archive tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-600">{analytics?.tier_distribution.hot || 0}</p>
                    <p className="text-sm text-red-600">Hot Memory</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-600">{analytics?.tier_distribution.warm || 0}</p>
                    <p className="text-sm text-yellow-600">Warm Memory</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">{analytics?.tier_distribution.cold || 0}</p>
                    <p className="text-sm text-blue-600">Cold Memory</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-2xl font-bold text-gray-600">{analytics?.tier_distribution.archive || 0}</p>
                    <p className="text-sm text-gray-600">Archive</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recommended_optimizations.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Memory Status</CardTitle>
              <CardDescription>
                Individual memory usage and health for each trading agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentStatuses.map((agent) => (
                  <div
                    key={agent.agent_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          agent.status === 'healthy' ? 'bg-green-500' :
                          agent.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{agent.agent_name}</span>
                      </div>
                      {getStatusBadge(agent.status)}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{agent.memory_size_mb.toFixed(1)} MB</p>
                        <p className="text-muted-foreground">Memory Size</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{(agent.efficiency * 100).toFixed(1)}%</p>
                        <p className="text-muted-foreground">Efficiency</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {new Date(agent.last_cleanup).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">Last Cleanup</p>
                      </div>
                    </div>
                    
                    <Button
                      variant={agent.needs_optimization ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOptimizeAgent(agent.agent_id)}
                      disabled={isOptimizing}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      {agent.needs_optimization ? 'Optimize' : 'Tuned'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Memory Utilization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Allocated</span>
                    <span className="font-medium">{analytics?.memory_utilization.total_allocated_mb.toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Actually Used</span>
                    <span className="font-medium">{analytics?.memory_utilization.actually_used_mb.toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Efficiency Ratio</span>
                    <span className="font-medium">{((analytics?.memory_utilization.efficiency_ratio || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fragmentation</span>
                    <span className="font-medium">{((analytics?.memory_utilization.fragmentation_ratio || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Hot Memory</span>
                      <span>{analytics?.memory_utilization.hot_memory_mb.toFixed(1)} MB</span>
                    </div>
                    <Progress 
                      value={(analytics?.memory_utilization.hot_memory_mb / analytics?.memory_utilization.total_allocated_mb * 100) || 0} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Warm Memory</span>
                      <span>{analytics?.memory_utilization.warm_memory_mb.toFixed(1)} MB</span>
                    </div>
                    <Progress 
                      value={(analytics?.memory_utilization.warm_memory_mb / analytics?.memory_utilization.total_allocated_mb * 100) || 0} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cold Memory</span>
                      <span>{analytics?.memory_utilization.cold_memory_mb.toFixed(1)} MB</span>
                    </div>
                    <Progress 
                      value={(analytics?.memory_utilization.cold_memory_mb / analytics?.memory_utilization.total_allocated_mb * 100) || 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Memory Optimization Controls</CardTitle>
              <CardDescription>
                Advanced memory management and optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Cleanup Operations</h3>
                  <Button
                    className="w-full"
                    onClick={handleOptimizeAll}
                    disabled={isOptimizing}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Full System Cleanup
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Automated Cleanup
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Analysis Tools</h3>
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Memory Fragmentation Analysis
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Cpu className="h-4 w-4 mr-2" />
                    Performance Impact Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}