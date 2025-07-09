'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Cpu, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Network, 
  Server, 
  Zap,
  Clock,
  AlertTriangle,
  Monitor,
  Wifi,
  Globe
} from 'lucide-react'

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  threshold: number
  lastUpdated: string
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  responseTime: number
  uptime: number
  lastCheck: string
  endpoint: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  component: string
  details?: any
}

export function SystemDiagnostics() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const systemMetrics: SystemMetric[] = [
    {
      name: 'CPU Usage',
      value: 23.4,
      unit: '%',
      status: 'healthy',
      threshold: 80,
      lastUpdated: '2 seconds ago'
    },
    {
      name: 'Memory Usage',
      value: 67.8,
      unit: '%',
      status: 'warning',
      threshold: 85,
      lastUpdated: '2 seconds ago'
    },
    {
      name: 'Disk Usage',
      value: 45.2,
      unit: '%',
      status: 'healthy',
      threshold: 90,
      lastUpdated: '5 seconds ago'
    },
    {
      name: 'Network I/O',
      value: 12.3,
      unit: 'MB/s',
      status: 'healthy',
      threshold: 100,
      lastUpdated: '1 second ago'
    },
    {
      name: 'Response Time',
      value: 89.5,
      unit: 'ms',
      status: 'healthy',
      threshold: 500,
      lastUpdated: '3 seconds ago'
    },
    {
      name: 'Error Rate',
      value: 2.1,
      unit: '%',
      status: 'warning',
      threshold: 5,
      lastUpdated: '10 seconds ago'
    }
  ]

  const serviceStatuses: ServiceStatus[] = [
    {
      name: 'WebSocket Server',
      status: 'online',
      responseTime: 23,
      uptime: 99.9,
      lastCheck: '30 seconds ago',
      endpoint: 'ws://localhost:8000/ws'
    },
    {
      name: 'Database (Supabase)',
      status: 'online',
      responseTime: 45,
      uptime: 99.8,
      lastCheck: '15 seconds ago',
      endpoint: 'https://api.supabase.co'
    },
    {
      name: 'Redis Cache',
      status: 'online',
      responseTime: 12,
      uptime: 100,
      lastCheck: '20 seconds ago',
      endpoint: 'redis://localhost:6379'
    },
    {
      name: 'Trading API',
      status: 'degraded',
      responseTime: 234,
      uptime: 98.5,
      lastCheck: '1 minute ago',
      endpoint: 'https://api.binance.com'
    },
    {
      name: 'AI Service',
      status: 'offline',
      responseTime: 0,
      uptime: 95.2,
      lastCheck: '5 minutes ago',
      endpoint: 'http://localhost:8001'
    }
  ]

  const recentLogs: LogEntry[] = [
    {
      timestamp: '2025-01-09 14:23:45',
      level: 'info',
      message: 'WebSocket connection established',
      component: 'WebSocket',
      details: { clientId: 'client_123', endpoint: '/ws' }
    },
    {
      timestamp: '2025-01-09 14:23:42',
      level: 'warn',
      message: 'High memory usage detected',
      component: 'System Monitor',
      details: { usage: '67.8%', threshold: '65%' }
    },
    {
      timestamp: '2025-01-09 14:23:38',
      level: 'error',
      message: 'AI Service connection timeout',
      component: 'AI Service',
      details: { endpoint: 'http://localhost:8001', timeout: '5000ms' }
    },
    {
      timestamp: '2025-01-09 14:23:35',
      level: 'info',
      message: 'Database query executed successfully',
      component: 'Database',
      details: { query: 'SELECT * FROM agents', duration: '45ms' }
    },
    {
      timestamp: '2025-01-09 14:23:30',
      level: 'debug',
      message: 'Cache hit for market data',
      component: 'Redis Cache',
      details: { key: 'market_data_BTC', ttl: '25s' }
    }
  ]

  const runDiagnostics = async () => {
    setDiagnosticsRunning(true)
    
    // Simulate diagnostic tests
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setDiagnosticsRunning(false)
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600'
      case 'critical':
      case 'offline':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'critical':
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'cpu usage':
        return <Cpu className="h-4 w-4" />
      case 'memory usage':
        return <MemoryStick className="h-4 w-4" />
      case 'disk usage':
        return <HardDrive className="h-4 w-4" />
      case 'network i/o':
        return <Network className="h-4 w-4" />
      case 'response time':
        return <Clock className="h-4 w-4" />
      case 'error rate':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600'
      case 'warn': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      case 'debug': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Operational</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              All core systems running normally
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-xs text-muted-foreground">Overall Health Score</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Real-time monitoring status
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getMetricIcon(metric.name)}
                    {metric.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {metric.value} {metric.unit}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(metric.status)}
                        <span className={`text-xs ${getStatusColor(metric.status)}`}>
                          {metric.status}
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={metric.value} 
                      className="h-2"
                      max={metric.threshold}
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Threshold: {metric.threshold}{metric.unit}</span>
                      <span>{metric.lastUpdated}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="space-y-4">
            {serviceStatuses.map((service, index) => (
              <Card key={index} className={`transition-all ${selectedService === service.name ? 'border-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">
                          {service.endpoint}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Badge variant={service.status === 'online' ? 'default' : 'destructive'}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{service.responseTime}ms</div>
                      <div className="text-xs text-muted-foreground">Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{service.uptime}%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{service.lastCheck}</div>
                      <div className="text-xs text-muted-foreground">Last Check</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recent System Logs
              </CardTitle>
              <CardDescription>
                Latest system events and error messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex-shrink-0 text-xs text-muted-foreground font-mono">
                      {log.timestamp}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{log.component}</span>
                      </div>
                      <div className="text-sm">{log.message}</div>
                      {log.details && (
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Diagnostic Tools
              </CardTitle>
              <CardDescription>
                System diagnostic and monitoring tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">System Health</div>
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Active Alerts</div>
                  <div className="text-2xl font-bold text-yellow-600">3</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  {diagnosticsRunning ? 'Running...' : 'Run Diagnostics'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={toggleMonitoring}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {isMonitoring ? 'Stop' : 'Start'} Monitoring
                </Button>
                <Button variant="outline" disabled>
                  <Globe className="h-4 w-4 mr-2" />
                  Network Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Alerts */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>System Monitoring:</strong> Advanced diagnostic tools provide deep insights into system performance.
          Monitor resource usage and service health to maintain optimal performance.
        </AlertDescription>
      </Alert>
    </div>
  )
}