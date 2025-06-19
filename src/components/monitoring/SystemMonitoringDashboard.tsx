'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity,
  Cpu,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Server,
  Brain,
  Target,
  DollarSign,
  Eye,
  RefreshCw,
  Settings
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  uptime: string
  response_time: number
  cpu_usage: number
  memory_usage: number
  last_check: string
  error_count: number
  dependencies: string[]
}

interface PerformanceMetric {
  metric: string
  current_value: number
  threshold: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface SystemAlert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  timestamp: string
  service: string
  acknowledged: boolean
}

interface LLMMetrics {
  provider: string
  requests_today: number
  tokens_used: number
  cost_today: number
  avg_response_time: number
  success_rate: number
  error_count: number
}

interface SystemMonitoringDashboardProps {
  className?: string
}

export function SystemMonitoringDashboard({ className }: SystemMonitoringDashboardProps) {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Autonomous Trading Engine',
      status: 'healthy',
      uptime: '2d 14h 23m',
      response_time: 45,
      cpu_usage: 35.2,
      memory_usage: 1024,
      last_check: '2025-01-19T14:25:00Z',
      error_count: 0,
      dependencies: ['LLM Service', 'Market Data', 'Risk Management']
    },
    {
      name: 'Real-Time Market Service',
      status: 'healthy',
      uptime: '2d 14h 15m',
      response_time: 28,
      cpu_usage: 28.7,
      memory_usage: 512,
      last_check: '2025-01-19T14:25:00Z',
      error_count: 2,
      dependencies: ['WebSocket Feeds', 'Database']
    },
    {
      name: 'LLM Integration Service',
      status: 'warning',
      uptime: '2d 12h 45m',
      response_time: 2340,
      cpu_usage: 15.8,
      memory_usage: 256,
      last_check: '2025-01-19T14:24:45Z',
      error_count: 5,
      dependencies: ['OpenRouter API', 'Gemini API']
    },
    {
      name: 'Agent Coordinator',
      status: 'healthy',
      uptime: '2d 14h 20m',
      response_time: 67,
      cpu_usage: 22.1,
      memory_usage: 384,
      last_check: '2025-01-19T14:25:00Z',
      error_count: 1,
      dependencies: ['LLM Service', 'Decision Engine']
    },
    {
      name: 'Risk Management',
      status: 'healthy',
      uptime: '2d 14h 18m',
      response_time: 52,
      cpu_usage: 18.5,
      memory_usage: 128,
      last_check: '2025-01-19T14:25:00Z',
      error_count: 0,
      dependencies: ['Portfolio Service', 'Market Data']
    },
    {
      name: 'MCP Trading Tools',
      status: 'healthy',
      uptime: '2d 13h 55m',
      response_time: 89,
      cpu_usage: 31.4,
      memory_usage: 768,
      last_check: '2025-01-19T14:25:00Z',
      error_count: 3,
      dependencies: ['Trading Gateway', 'Analysis Tools']
    }
  ])

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    {
      metric: 'System CPU Usage',
      current_value: 42.5,
      threshold: 80,
      status: 'good',
      trend: 'stable',
      description: 'Overall system CPU utilization'
    },
    {
      metric: 'Memory Usage',
      current_value: 68.2,
      threshold: 85,
      status: 'good',
      trend: 'up',
      description: 'System memory consumption'
    },
    {
      metric: 'Database Connections',
      current_value: 47,
      threshold: 100,
      status: 'good',
      trend: 'stable',
      description: 'Active database connections'
    },
    {
      metric: 'WebSocket Connections',
      current_value: 234,
      threshold: 500,
      status: 'good',
      trend: 'up',
      description: 'Active real-time connections'
    },
    {
      metric: 'API Response Time',
      current_value: 156,
      threshold: 500,
      status: 'good',
      trend: 'down',
      description: 'Average API response time (ms)'
    },
    {
      metric: 'Trading Success Rate',
      current_value: 73.5,
      threshold: 60,
      status: 'good',
      trend: 'up',
      description: 'Successful trade execution rate (%)'
    }
  ])

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: 'alert_001',
      severity: 'warning',
      title: 'LLM Service High Latency',
      message: 'OpenRouter API response time above 2000ms threshold',
      timestamp: '2025-01-19T14:20:00Z',
      service: 'LLM Integration Service',
      acknowledged: false
    },
    {
      id: 'alert_002',
      severity: 'info',
      title: 'High Trading Volume Detected',
      message: 'Market data processing increased by 45% in the last hour',
      timestamp: '2025-01-19T14:15:00Z',
      service: 'Real-Time Market Service',
      acknowledged: true
    },
    {
      id: 'alert_003',
      severity: 'warning',
      title: 'Memory Usage Spike',
      message: 'MCP Trading Tools memory usage exceeded 700MB',
      timestamp: '2025-01-19T14:10:00Z',
      service: 'MCP Trading Tools',
      acknowledged: false
    }
  ])

  const [llmMetrics, setLlmMetrics] = useState<LLMMetrics[]>([
    {
      provider: 'Gemini Flash',
      requests_today: 1247,
      tokens_used: 234567,
      cost_today: 0.0,
      avg_response_time: 1200,
      success_rate: 98.5,
      error_count: 18
    },
    {
      provider: 'OpenRouter GPT-4',
      requests_today: 89,
      tokens_used: 45632,
      cost_today: 12.45,
      avg_response_time: 4200,
      success_rate: 97.8,
      error_count: 2
    },
    {
      provider: 'OpenRouter Claude',
      requests_today: 45,
      tokens_used: 23145,
      cost_today: 8.23,
      avg_response_time: 3800,
      success_rate: 99.1,
      error_count: 0
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update service metrics
      setServices(services => services.map(service => ({
        ...service,
        cpu_usage: Math.max(0, Math.min(100, service.cpu_usage + (Math.random() - 0.5) * 10)),
        response_time: Math.max(10, service.response_time + (Math.random() - 0.5) * 20),
        last_check: new Date().toISOString()
      })))

      // Update performance metrics
      setPerformanceMetrics(metrics => metrics.map(metric => ({
        ...metric,
        current_value: Math.max(0, metric.current_value + (Math.random() - 0.5) * 5)
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getMetricStatus = (metric: PerformanceMetric) => {
    const percentage = (metric.current_value / metric.threshold) * 100
    if (percentage >= 90) return 'critical'
    if (percentage >= 70) return 'warning'
    return 'good'
  }

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'good': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(alerts => alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const criticalServices = services.filter(service => service.status === 'error')
  const warningServices = services.filter(service => service.status === 'warning')

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="llm-metrics">LLM Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Health</p>
                    <p className="text-2xl font-bold text-green-500">
                      {services.filter(s => s.status === 'healthy').length}/{services.length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Services operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                    <p className={`text-2xl font-bold ${unacknowledgedAlerts.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {unacknowledgedAlerts.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Unacknowledged alerts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {Math.round(services.reduce((sum, s) => sum + s.response_time, 0) / services.length)}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  System performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">LLM Cost Today</p>
                    <p className="text-2xl font-bold">
                      ${llmMetrics.reduce((sum, m) => sum + m.cost_today, 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI processing costs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {unacknowledgedAlerts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {unacknowledgedAlerts.length} unacknowledged alerts requiring attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Service Status Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Service Status</CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.name} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                        {service.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="ml-1 font-medium">{service.uptime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response:</span>
                        <span className="ml-1 font-medium">{service.response_time}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CPU:</span>
                        <span className="ml-1 font-medium">{service.cpu_usage.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Errors:</span>
                        <span className="ml-1 font-medium">{service.error_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {performanceMetrics.slice(0, 6).map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        <span className={`text-sm font-bold ${getMetricColor(getMetricStatus(metric))}`}>
                          {metric.metric.includes('Rate') || metric.metric.includes('CPU') || metric.metric.includes('Memory') 
                            ? `${metric.current_value.toFixed(1)}%` 
                            : Math.round(metric.current_value)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(metric.current_value / metric.threshold) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Comprehensive service monitoring and health status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <Card key={service.name} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Server className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Last check: {formatTimestamp(service.last_check)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                            {service.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Uptime</p>
                          <p className="font-medium">{service.uptime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Response Time</p>
                          <p className="font-medium">{service.response_time}ms</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CPU Usage</p>
                          <div className="flex items-center gap-2">
                            <Progress value={service.cpu_usage} className="w-16 h-2" />
                            <span className="text-sm font-medium">{service.cpu_usage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Memory</p>
                          <p className="font-medium">{service.memory_usage}MB</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Dependencies:</p>
                        <div className="flex gap-1 flex-wrap">
                          {service.dependencies.map((dep, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Real-time system performance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceMetrics.map((metric) => (
                  <Card key={metric.metric} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{metric.metric}</h4>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metric.trend)}
                          <Badge variant={getMetricStatus(metric) === 'good' ? 'default' : 'destructive'}>
                            {getMetricStatus(metric)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Value</span>
                          <span className={`font-bold ${getMetricColor(getMetricStatus(metric))}`}>
                            {metric.metric.includes('Rate') || metric.metric.includes('CPU') || metric.metric.includes('Memory') 
                              ? `${metric.current_value.toFixed(1)}%` 
                              : `${Math.round(metric.current_value)}${metric.metric.includes('Time') ? 'ms' : ''}`}
                          </span>
                        </div>
                        <Progress 
                          value={(metric.current_value / metric.threshold) * 100} 
                          className="h-3"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>0</span>
                          <span>Threshold: {metric.threshold}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Active alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Card key={alert.id} className={`p-4 ${!alert.acknowledged ? 'border-yellow-500' : ''}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSeverityIcon(alert.severity)}
                            <div>
                              <h4 className="font-medium">{alert.title}</h4>
                              <p className="text-sm text-muted-foreground">{alert.service}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                              {alert.severity}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="secondary">Acknowledged</Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm">{alert.message}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          {!alert.acknowledged && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm-metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LLM Performance Metrics</CardTitle>
              <CardDescription>AI model usage, costs, and performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {llmMetrics.map((provider) => (
                  <Card key={provider.provider} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium">{provider.provider}</h4>
                        </div>
                        <Badge variant={provider.cost_today === 0 ? 'default' : 'outline'}>
                          {provider.cost_today === 0 ? 'FREE' : `$${provider.cost_today.toFixed(2)}`}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Requests Today</p>
                          <p className="font-medium">{provider.requests_today.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tokens Used</p>
                          <p className="font-medium">{provider.tokens_used.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Response</p>
                          <p className="font-medium">{provider.avg_response_time}ms</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Success Rate</p>
                          <p className="font-medium text-green-500">{provider.success_rate.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Errors: </span>
                          <span className="font-medium">{provider.error_count}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SystemMonitoringDashboard