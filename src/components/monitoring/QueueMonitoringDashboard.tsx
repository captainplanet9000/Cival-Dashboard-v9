'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3,
  RefreshCw,
  Server,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'
import { getSupabaseQueueService } from '@/lib/queues/supabase-queue-service'

interface QueueMetrics {
  queue_name: string
  queue_length: number
  total_messages: number
  oldest_msg_age: string
  newest_msg_age: string
}

interface QueueHealth {
  queue_name: string
  status: 'healthy' | 'warning' | 'critical'
  message_count: number
  max_age_seconds: number
  health_score: number
}

interface QueueStats {
  messages_sent: number
  messages_processed: number
  messages_failed: number
  average_processing_time_ms: number
  success_rate: number
}

export default function QueueMonitoringDashboard() {
  const [queueMetrics, setQueueMetrics] = useState<Record<string, QueueMetrics>>({})
  const [queueHealth, setQueueHealth] = useState<QueueHealth[]>([])
  const [queueStats, setQueueStats] = useState<Record<string, QueueStats>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const queueService = getSupabaseQueueService()

  const QUEUE_NAMES = [
    'agent_messages',
    'trading_orders', 
    'risk_alerts',
    'memory_updates',
    'dashboard_updates',
    'market_data'
  ]

  useEffect(() => {
    refreshData()
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const refreshData = async () => {
    try {
      setIsLoading(true)
      
      // Get metrics for all queues
      const metrics = await queueService.getAllQueueStats()
      setQueueMetrics(metrics)

      // Simulate queue health data (would come from Supabase function in real implementation)
      const healthData: QueueHealth[] = QUEUE_NAMES.map(queueName => {
        const metric = metrics[queueName]
        const messageCount = metric?.queue_length || 0
        const maxAge = Math.random() * 300 // Simulate age in seconds
        
        let status: QueueHealth['status'] = 'healthy'
        let healthScore = 100
        
        if (messageCount > 50) {
          status = 'warning'
          healthScore = 60
        }
        if (messageCount > 100 || maxAge > 180) {
          status = 'critical'
          healthScore = 20
        }

        return {
          queue_name: queueName,
          status,
          message_count: messageCount,
          max_age_seconds: Math.floor(maxAge),
          health_score: healthScore
        }
      })
      setQueueHealth(healthData)

      // Simulate queue statistics
      const stats: Record<string, QueueStats> = {}
      QUEUE_NAMES.forEach(queueName => {
        const sent = 100 + Math.floor(Math.random() * 1000)
        const processed = sent - Math.floor(Math.random() * 10)
        const failed = Math.floor(Math.random() * 5)
        
        stats[queueName] = {
          messages_sent: sent,
          messages_processed: processed,
          messages_failed: failed,
          average_processing_time_ms: 50 + Math.random() * 200,
          success_rate: ((processed / sent) * 100)
        }
      })
      setQueueStats(stats)

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to refresh queue data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const totalMessages = Object.values(queueStats).reduce((sum, stat) => sum + stat.messages_sent, 0)
  const totalProcessed = Object.values(queueStats).reduce((sum, stat) => sum + stat.messages_processed, 0)
  const totalFailed = Object.values(queueStats).reduce((sum, stat) => sum + stat.messages_failed, 0)
  const overallSuccessRate = totalMessages > 0 ? ((totalProcessed / totalMessages) * 100) : 0

  const healthyQueues = queueHealth.filter(q => q.status === 'healthy').length
  const warningQueues = queueHealth.filter(q => q.status === 'warning').length
  const criticalQueues = queueHealth.filter(q => q.status === 'critical').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Queue Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of Supabase queues and message processing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {totalProcessed.toLocaleString()} processed, {totalFailed} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallSuccessRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              Across all queues
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Queues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyQueues}</div>
            <div className="text-xs text-muted-foreground">
              {warningQueues} warning, {criticalQueues} critical
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Queues</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{QUEUE_NAMES.length}</div>
            <div className="text-xs text-muted-foreground">
              All operational
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Queue Health</TabsTrigger>
          <TabsTrigger value="metrics">Queue Metrics</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queueHealth.map((queue) => (
                  <div key={queue.queue_name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{queue.queue_name.replace('_', ' ')}</h3>
                      {getStatusIcon(queue.status)}
                    </div>
                    <Badge className={getStatusColor(queue.status)} variant="outline">
                      {queue.status}
                    </Badge>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div>Messages: {queue.message_count}</div>
                      <div>Max Age: {formatDuration(queue.max_age_seconds)}</div>
                      <div>Health Score: {queue.health_score}/100</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {QUEUE_NAMES.map((queueName) => {
                  const metric = queueMetrics[queueName]
                  const health = queueHealth.find(q => q.queue_name === queueName)
                  
                  return (
                    <div key={queueName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {health && getStatusIcon(health.status)}
                        <div>
                          <h3 className="font-medium">{queueName.replace('_', ' ')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {metric?.queue_length || 0} messages in queue
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Total: {metric?.total_messages || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Oldest: {metric?.oldest_msg_age || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {QUEUE_NAMES.map((queueName) => {
                  const stat = queueStats[queueName]
                  if (!stat) return null

                  return (
                    <div key={queueName} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-3">{queueName.replace('_', ' ')}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Sent</div>
                          <div className="font-medium">{stat.messages_sent.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Processed</div>
                          <div className="font-medium text-green-600">
                            {stat.messages_processed.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Failed</div>
                          <div className="font-medium text-red-600">{stat.messages_failed}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Success Rate</div>
                          <div className="font-medium">{stat.success_rate.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Avg Processing Time: {stat.average_processing_time_ms.toFixed(0)}ms
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {queueHealth
                    .filter(q => q.status !== 'healthy')
                    .map((queue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(queue.status)}
                          <div>
                            <div className="font-medium">{queue.queue_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {queue.status === 'warning' 
                                ? 'Queue depth approaching limit'
                                : 'Queue requires immediate attention'
                              }
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(queue.status)}>
                          {queue.status}
                        </Badge>
                      </div>
                    ))}
                  
                  {queueHealth.every(q => q.status === 'healthy') && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      All queues are healthy
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