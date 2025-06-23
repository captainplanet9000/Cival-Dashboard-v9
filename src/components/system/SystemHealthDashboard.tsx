'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  Database, 
  Bot, 
  Shield,
  Clock,
  TrendingUp,
  Cpu,
  Server
} from 'lucide-react'

import { systemLifecycleService } from '@/lib/system/SystemLifecycleService'

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical'
  services: {
    [key: string]: {
      status: 'online' | 'offline' | 'degraded'
      responseTime: number
      lastCheck: number
      details?: string
    }
  }
  metrics: {
    totalAgents: number
    activeAgents: number
    totalVaults: number
    totalTools: number
    totalCalls: number
    successRate: number
    avgResponseTime: number
    uptime: string
  }
}

const serviceIcons = {
  agentPersistence: Bot,
  vaultIntegration: Shield,
  mcpIntegration: Zap,
  tradingEngine: TrendingUp,
  defiService: Database,
  aiService: Cpu,
  todoService: Server
}

const serviceNames = {
  agentPersistence: 'Agent Persistence',
  vaultIntegration: 'Vault Integration',
  mcpIntegration: 'MCP Integration', 
  tradingEngine: 'Trading Engine',
  defiService: 'DeFi Service',
  aiService: 'AI Service',
  todoService: 'Todo Service'
}

export function SystemHealthDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    services: {},
    metrics: {
      totalAgents: 0,
      activeAgents: 0,
      totalVaults: 0,
      totalTools: 0,
      totalCalls: 0,
      successRate: 0,
      avgResponseTime: 0,
      uptime: '0s'
    }
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateSystemHealth = async () => {
      try {
        const health = await systemLifecycleService.getSystemHealth()
        setSystemStatus(health)
      } catch (error) {
        console.error('Failed to fetch system health:', error)
      } finally {
        setLoading(false)
      }
    }

    updateSystemHealth()
    const interval = setInterval(updateSystemHealth, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-500'
      case 'warning':
      case 'degraded':
        return 'text-yellow-500'
      case 'critical':
      case 'offline':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return CheckCircle
      case 'warning':
      case 'degraded':
        return AlertTriangle
      case 'critical':
      case 'offline':
        return XCircle
      default:
        return Activity
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Loading system status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const StatusIcon = getStatusIcon(systemStatus.overall)

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${getStatusColor(systemStatus.overall)}`} />
            System Health - {systemStatus.overall.toUpperCase()}
          </CardTitle>
          <CardDescription>
            Real-time monitoring of all integrated services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{systemStatus.metrics.totalAgents}</div>
              <div className="text-sm text-muted-foreground">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{systemStatus.metrics.activeAgents}</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{systemStatus.metrics.totalVaults}</div>
              <div className="text-sm text-muted-foreground">Total Vaults</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{systemStatus.metrics.totalCalls}</div>
              <div className="text-sm text-muted-foreground">API Calls</div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Success Rate</span>
                <span>{(systemStatus.metrics.successRate * 100).toFixed(1)}%</span>
              </div>
              <Progress value={systemStatus.metrics.successRate * 100} className="h-2" />
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Average Response Time</span>
              <span>{systemStatus.metrics.avgResponseTime}ms</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>System Uptime</span>
              <span>{systemStatus.metrics.uptime}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(systemStatus.services).map(([serviceId, service]) => {
          const ServiceIcon = serviceIcons[serviceId as keyof typeof serviceIcons] || Server
          const StatusIconComponent = getStatusIcon(service.status)
          
          return (
            <motion.div
              key={serviceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <ServiceIcon className="h-4 w-4" />
                      {serviceNames[serviceId as keyof typeof serviceNames] || serviceId}
                    </div>
                    <StatusIconComponent className={`h-4 w-4 ${getStatusColor(service.status)}`} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status</span>
                      <Badge variant={service.status === 'online' ? 'default' : 'destructive'}>
                        {service.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span>{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Check</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(service.lastCheck).toLocaleTimeString()}
                      </span>
                    </div>
                    {service.details && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {service.details}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* System Alerts */}
      {systemStatus.overall !== 'healthy' && (
        <Alert variant={systemStatus.overall === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {systemStatus.overall === 'critical' 
              ? 'Critical system issues detected. Some services may be unavailable.'
              : 'System performance degraded. Monitoring for issues.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}