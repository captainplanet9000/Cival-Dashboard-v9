'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Activity, AlertTriangle, CheckCircle, Clock, Cpu, Database, 
  HardDrive, Network, RefreshCw, Shield, AlertCircle, 
  TrendingUp, TrendingDown, Zap, Settings, Play, Pause, Stop
} from 'lucide-react'

// Interface matching the existing autonomous health monitor service
interface HealthMetric {
  metric_name: string
  value: number
  threshold: number
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  unit: string
  timestamp: string
  details?: any
}

interface ServiceStatus {
  service_name: string
  health: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  uptime_seconds: number
  response_time_ms: number
  error_count: number
  last_error?: string
  metrics: Record<string, HealthMetric>
  dependencies: string[]
  auto_recovery_enabled: boolean
  restart_count: number
  last_restart?: string
}

interface SystemAlert {
  alert_id: string
  service_name: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  details: any
  recovery_action?: string
  created_at: string
  resolved_at?: string
  auto_resolved: boolean
}

interface RecoveryAttempt {
  attempt_id: string
  service_name: string
  action: string
  started_at: string
  completed_at?: string
  success: boolean
  error_message?: string
  attempt_number: number
}

interface SystemHealthSummary {
  overall_health: 'healthy' | 'degraded' | 'critical'
  services: {
    total: number
    healthy: number
    unhealthy: number
  }
  alerts: {
    active: number
    critical: number
    warning: number
  }
  resources: {
    cpu_percent: number
    memory_percent: number
    memory_available_mb: number
    disk_percent: number
    disk_free_gb: number
  }
  recovery: {
    auto_recovery_enabled: boolean
    total_recovery_attempts: number
    successful_recoveries: number
  }
  monitoring: {
    monitored_services: number
    check_interval_seconds: number
    uptime_seconds: number
  }
}

export default function HealthMonitorDashboard() {
  const [healthSummary, setHealthSummary] = useState<SystemHealthSummary | null>(null)
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [recoveryAttempts, setRecoveryAttempts] = useState<RecoveryAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data that matches the existing service structure
  useEffect(() => {
    const mockHealthSummary: SystemHealthSummary = {
      overall_health: 'healthy',
      services: {
        total: 6,
        healthy: 5,
        unhealthy: 1
      },
      alerts: {
        active: 2,
        critical: 0,
        warning: 2
      },
      resources: {
        cpu_percent: 45.2,
        memory_percent: 67.8,
        memory_available_mb: 2048,
        disk_percent: 23.4,
        disk_free_gb: 125
      },
      recovery: {
        auto_recovery_enabled: true,
        total_recovery_attempts: 8,
        successful_recoveries: 7
      },
      monitoring: {
        monitored_services: 6,
        check_interval_seconds: 30,
        uptime_seconds: 634800 // 7 days, 12 hours
      }
    }

    const mockServiceStatuses: ServiceStatus[] = [
      {
        service_name: 'autonomous_health_monitor',
        health: 'healthy',
        uptime_seconds: 634800,
        response_time_ms: 45,
        error_count: 0,
        metrics: {
          response_time: {
            metric_name: 'response_time',
            value: 45,
            threshold: 5000,
            status: 'healthy',
            unit: 'ms',
            timestamp: new Date().toISOString()
          }
        },
        dependencies: ['enhanced_database_service'],
        auto_recovery_enabled: true,
        restart_count: 0
      },
      {
        service_name: 'autonomous_agent_coordinator',
        health: 'healthy',
        uptime_seconds: 634567,
        response_time_ms: 78,
        error_count: 1,
        last_error: 'Minor coordination timeout (recovered)',
        metrics: {
          response_time: {
            metric_name: 'response_time',
            value: 78,
            threshold: 5000,
            status: 'healthy',
            unit: 'ms',
            timestamp: new Date().toISOString()
          }
        },
        dependencies: ['autonomous_state_persistence'],
        auto_recovery_enabled: true,
        restart_count: 0
      },
      {
        service_name: 'autonomous_state_persistence',
        health: 'degraded',
        uptime_seconds: 634200,
        response_time_ms: 156,
        error_count: 3,
        last_error: 'Database connection timeout',
        metrics: {
          response_time: {
            metric_name: 'response_time',
            value: 156,
            threshold: 5000,
            status: 'degraded',
            unit: 'ms',
            timestamp: new Date().toISOString()
          }
        },
        dependencies: ['enhanced_database_service'],
        auto_recovery_enabled: true,
        restart_count: 1,
        last_restart: '2025-01-10T14:30:00Z'
      },
      {
        service_name: 'autonomous_task_scheduler',
        health: 'healthy',
        uptime_seconds: 634800,
        response_time_ms: 32,
        error_count: 0,
        metrics: {
          response_time: {
            metric_name: 'response_time',
            value: 32,
            threshold: 5000,
            status: 'healthy',
            unit: 'ms',
            timestamp: new Date().toISOString()
          }
        },
        dependencies: ['autonomous_health_monitor'],
        auto_recovery_enabled: true,
        restart_count: 0
      },
      {
        service_name: 'advanced_risk_management',
        health: 'healthy',
        uptime_seconds: 634600,
        response_time_ms: 67,
        error_count: 0,
        metrics: {
          response_time: {
            metric_name: 'response_time',
            value: 67,
            threshold: 5000,
            status: 'healthy',
            unit: 'ms',
            timestamp: new Date().toISOString()
          }
        },
        dependencies: ['enhanced_database_service'],
        auto_recovery_enabled: true,
        restart_count: 0
      },
      {
        service_name: 'multi_exchange_integration',
        health: 'healthy',
        uptime_seconds: 634300,
        response_time_ms: 89,
        error_count: 2,
        last_error: 'Exchange API rate limit (recovered)',
        metrics: {
          response_time: {
            metric_name: 'response_time',
            value: 89,
            threshold: 5000,
            status: 'healthy',
            unit: 'ms',
            timestamp: new Date().toISOString()
          }
        },
        dependencies: [],
        auto_recovery_enabled: false,
        restart_count: 0
      }
    ]

    const mockAlerts: SystemAlert[] = [
      {
        alert_id: 'alert-001',
        service_name: 'autonomous_state_persistence',
        severity: 'warning',
        message: 'Response time above threshold (156ms)',
        details: { response_time: 156, threshold: 100 },
        recovery_action: 'restart_service',
        created_at: new Date(Date.now() - 120000).toISOString(),
        auto_resolved: false
      },
      {
        alert_id: 'alert-002',
        service_name: 'multi_exchange_integration',
        severity: 'info',
        message: 'Connection recovered after brief interruption',
        details: { downtime_seconds: 45 },
        created_at: new Date(Date.now() - 300000).toISOString(),
        resolved_at: new Date(Date.now() - 250000).toISOString(),
        auto_resolved: true
      }
    ]

    const mockRecoveryAttempts: RecoveryAttempt[] = [
      {
        attempt_id: 'recovery-001',
        service_name: 'autonomous_state_persistence',
        action: 'restart_service',
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3590000).toISOString(),
        success: true,
        attempt_number: 1
      },
      {
        attempt_id: 'recovery-002',
        service_name: 'multi_exchange_integration',
        action: 'restart_database',
        started_at: new Date(Date.now() - 7200000).toISOString(),
        completed_at: new Date(Date.now() - 7190000).toISOString(),
        success: true,
        attempt_number: 1
      }
    ]

    setHealthSummary(mockHealthSummary)
    setServiceStatuses(mockServiceStatuses)
    setAlerts(mockAlerts)
    setRecoveryAttempts(mockRecoveryAttempts)
    setIsLoading(false)
  }, [])

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate live data updates
      setLastUpdate(new Date())
      
      // Update response times and metrics
      setServiceStatuses(prev => 
        prev.map(service => ({
          ...service,
          response_time_ms: service.response_time_ms + (Math.random() - 0.5) * 20,
          metrics: {
            ...service.metrics,
            response_time: {
              ...service.metrics.response_time,
              value: service.response_time_ms + (Math.random() - 0.5) * 20,
              timestamp: new Date().toISOString()
            }
          }
        }))
      )

      // Update resource usage
      setHealthSummary(prev => prev ? {
        ...prev,
        resources: {
          ...prev.resources,
          cpu_percent: Math.max(0, Math.min(100, prev.resources.cpu_percent + (Math.random() - 0.5) * 10)),
          memory_percent: Math.max(0, Math.min(100, prev.resources.memory_percent + (Math.random() - 0.5) * 5))
        }
      } : prev)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const handleServiceAction = (serviceName: string, action: string) => {
    console.log(`${action} service: ${serviceName}`)
    // In a real implementation, this would call the backend API
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading health monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Monitor Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of autonomous system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Badge variant="outline">
            Last update: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {healthSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                  <p className={`text-2xl font-bold ${getHealthColor(healthSummary.overall_health)}`}>
                    {healthSummary.overall_health.toUpperCase()}
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${getHealthColor(healthSummary.overall_health)}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold">
                    {healthSummary.services.healthy}/{healthSummary.services.total}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {healthSummary.alerts.active}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatUptime(healthSummary.monitoring.uptime_seconds)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Resources */}
      {healthSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{healthSummary.resources.cpu_percent.toFixed(1)}%</span>
                </div>
                <Progress value={healthSummary.resources.cpu_percent} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{healthSummary.resources.memory_percent.toFixed(1)}%</span>
                </div>
                <Progress value={healthSummary.resources.memory_percent} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Disk Usage</span>
                  <span>{healthSummary.resources.disk_percent.toFixed(1)}%</span>
                </div>
                <Progress value={healthSummary.resources.disk_percent} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                Available: {healthSummary.resources.memory_available_mb}MB RAM, {healthSummary.resources.disk_free_gb}GB disk
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 3).map(alert => (
                  <Alert key={alert.alert_id}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.service_name}:
                        </span>
                        <span className="ml-2">{alert.message}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.auto_resolved ? 'default' : 'destructive'}>
                          {alert.auto_resolved ? 'Resolved' : 'Active'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {serviceStatuses.map(service => (
          <Card key={service.service_name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getHealthIcon(service.health)}
                  <span className="text-base">{service.service_name.replace(/_/g, ' ')}</span>
                </div>
                <Badge variant={service.health === 'healthy' ? 'default' : 'destructive'}>
                  {service.health}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Uptime:</span>
                    <div className="font-medium">{formatUptime(service.uptime_seconds)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Response Time:</span>
                    <div className="font-medium">{service.response_time_ms.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>
                    <div className="font-medium">{service.error_count}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Restarts:</span>
                    <div className="font-medium">{service.restart_count}</div>
                  </div>
                </div>
                
                {service.last_error && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Last Error:</span>
                    <div className="text-red-600 font-medium">{service.last_error}</div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={service.auto_recovery_enabled} 
                      onCheckedChange={() => {}}
                      disabled
                    />
                    <span className="text-sm">Auto Recovery</span>
                  </div>
                  <div className="flex gap-2">
                    {service.health !== 'healthy' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleServiceAction(service.service_name, 'restart')}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Restart
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleServiceAction(service.service_name, 'configure')}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Config
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recovery Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Recovery Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recoveryAttempts.map(attempt => (
              <div key={attempt.attempt_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{attempt.service_name.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-muted-foreground">
                    {attempt.action.replace(/_/g, ' ')} (Attempt #{attempt.attempt_number})
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={attempt.success ? 'default' : 'destructive'}>
                    {attempt.success ? 'Success' : 'Failed'}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {new Date(attempt.started_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}