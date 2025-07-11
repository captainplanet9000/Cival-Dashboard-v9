'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity, AlertTriangle, Brain, CheckCircle, Clock, Cpu, Database, 
  HardDrive, MessageCircle, Network, Power, RefreshCw, Settings, 
  Shield, Users, Zap, TrendingUp, TrendingDown, Pause, Play,
  AlertCircle, Info, Calendar, Target, DollarSign, BarChart3,
  HeartHandshake, CircuitBoard, TrendingUp as MarketIcon, Vote
} from 'lucide-react'

// Import autonomous components
import HealthMonitorDashboard from './HealthMonitorDashboard'
import AgentCommunicationPanel from './AgentCommunicationPanel'
import DecisionVoting from './DecisionVoting'
import MarketRegimeMonitor from './MarketRegimeMonitor'
import EmergencyProtocolsMonitor from './EmergencyProtocolsMonitor'

// Types for autonomous system state
interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  uptime: number
  responseTime: number
  errorCount: number
  lastCheck: string
  autoRecovery: boolean
}

interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
  activeConnections: number
}

interface AutonomousAgent {
  id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'stopped'
  performance: number
  allocation: number
  lastActivity: string
  decisions: number
  success_rate: number
}

interface HealthAlert {
  id: string
  service: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
  autoResolved: boolean
}

export default function AutonomousControlCenter() {
  const [activeSubTab, setActiveSubTab] = useState('overview')
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0
  })
  const [agents, setAgents] = useState<AutonomousAgent[]>([])
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autonomousEnabled, setAutonomousEnabled] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Mock data initialization
  useEffect(() => {
    // Initialize mock services
    const mockServices: ServiceStatus[] = [
      {
        name: 'Autonomous Health Monitor',
        status: 'healthy',
        uptime: 99.9,
        responseTime: 45,
        errorCount: 0,
        lastCheck: '2 seconds ago',
        autoRecovery: true
      },
      {
        name: 'Agent Coordinator',
        status: 'healthy',
        uptime: 99.8,
        responseTime: 78,
        errorCount: 1,
        lastCheck: '5 seconds ago',
        autoRecovery: true
      },
      {
        name: 'Task Scheduler',
        status: 'healthy',
        uptime: 99.7,
        responseTime: 32,
        errorCount: 0,
        lastCheck: '10 seconds ago',
        autoRecovery: true
      },
      {
        name: 'State Persistence',
        status: 'degraded',
        uptime: 98.5,
        responseTime: 156,
        errorCount: 3,
        lastCheck: '1 minute ago',
        autoRecovery: true
      },
      {
        name: 'Risk Management',
        status: 'healthy',
        uptime: 99.9,
        responseTime: 67,
        errorCount: 0,
        lastCheck: '3 seconds ago',
        autoRecovery: true
      },
      {
        name: 'Market Data Feed',
        status: 'healthy',
        uptime: 99.6,
        responseTime: 89,
        errorCount: 2,
        lastCheck: '8 seconds ago',
        autoRecovery: false
      }
    ]

    // Initialize mock agents
    const mockAgents: AutonomousAgent[] = [
      {
        id: 'agent-1',
        name: 'Marcus Momentum',
        type: 'Trend Following',
        status: 'active',
        performance: 87.5,
        allocation: 25000,
        lastActivity: '12 seconds ago',
        decisions: 156,
        success_rate: 78.2
      },
      {
        id: 'agent-2',
        name: 'Alex Arbitrage',
        type: 'Cross-Exchange',
        status: 'active',
        performance: 92.3,
        allocation: 35000,
        lastActivity: '5 seconds ago',
        decisions: 89,
        success_rate: 84.3
      },
      {
        id: 'agent-3',
        name: 'Sophia Reversion',
        type: 'Mean Reversion',
        status: 'paused',
        performance: 76.8,
        allocation: 18000,
        lastActivity: '2 minutes ago',
        decisions: 234,
        success_rate: 72.1
      },
      {
        id: 'agent-4',
        name: 'Riley Risk',
        type: 'Risk Manager',
        status: 'active',
        performance: 94.1,
        allocation: 15000,
        lastActivity: '8 seconds ago',
        decisions: 67,
        success_rate: 89.6
      }
    ]

    // Initialize mock alerts
    const mockAlerts: HealthAlert[] = [
      {
        id: 'alert-1',
        service: 'State Persistence',
        severity: 'warning',
        message: 'Response time above threshold (156ms)',
        timestamp: '2 minutes ago',
        autoResolved: false
      },
      {
        id: 'alert-2',
        service: 'Market Data Feed',
        severity: 'info',
        message: 'Connection recovered after brief interruption',
        timestamp: '5 minutes ago',
        autoResolved: true
      },
      {
        id: 'alert-3',
        service: 'Agent Coordinator',
        severity: 'info',
        message: 'Minor error in decision consensus (recovered)',
        timestamp: '8 minutes ago',
        autoResolved: true
      }
    ]

    setServices(mockServices)
    setAgents(mockAgents)
    setAlerts(mockAlerts)
    setIsLoading(false)
  }, [])

  // Update system metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics({
        cpuUsage: 35 + Math.random() * 20,
        memoryUsage: 65 + Math.random() * 10,
        diskUsage: 23 + Math.random() * 5,
        networkLatency: 45 + Math.random() * 15,
        activeConnections: 12 + Math.floor(Math.random() * 8)
      })
      setLastUpdate(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const handleEmergencyStop = () => {
    // Emergency stop logic would go here
    console.log('Emergency stop triggered')
  }

  const handleServiceRestart = (serviceName: string) => {
    // Service restart logic would go here
    console.log(`Restarting ${serviceName}`)
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-green-600">99.2%</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold text-blue-600">{agents.filter(a => a.status === 'active').length}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Autonomous Mode</p>
                <p className="text-2xl font-bold text-purple-600">
                  {autonomousEnabled ? 'ON' : 'OFF'}
                </p>
              </div>
              <Power className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-emerald-600">7d 12h</p>
              </div>
              <Clock className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
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
                <span>{systemMetrics.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={systemMetrics.cpuUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{systemMetrics.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={systemMetrics.memoryUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Disk Usage</span>
                <span>{systemMetrics.diskUsage.toFixed(1)}%</span>
              </div>
              <Progress value={systemMetrics.diskUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Network Latency</span>
                <span>{systemMetrics.networkLatency.toFixed(0)}ms</span>
              </div>
              <Progress value={systemMetrics.networkLatency / 2} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.slice(0, 3).map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 
                      agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{agent.performance.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{agent.success_rate.toFixed(1)}% success</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
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
              <Alert key={alert.id} className="border-l-4 border-l-blue-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    <strong>{alert.service}:</strong> {alert.message}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.autoResolved ? 'default' : 'secondary'}>
                      {alert.autoResolved ? 'Auto-resolved' : 'Active'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{alert.timestamp}</span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ServiceHealthTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Health Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring of all autonomous services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {services.map(service => (
          <Card key={service.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="text-base">{service.name}</span>
                </div>
                <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                  {service.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Uptime:</span>
                  <span className="font-medium">{service.uptime.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Response Time:</span>
                  <span className="font-medium">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Error Count:</span>
                  <span className="font-medium">{service.errorCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Auto Recovery:</span>
                  <Switch 
                    checked={service.autoRecovery} 
                    onCheckedChange={() => {}}
                    disabled
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Check:</span>
                  <span className="font-medium">{service.lastCheck}</span>
                </div>
                {service.status !== 'healthy' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleServiceRestart(service.name)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Restart Service
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const AgentCoordinationTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agent Coordination</h3>
          <p className="text-sm text-muted-foreground">
            Manage and monitor autonomous trading agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            Agent Chat
          </Button>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1" />
            Add Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => (
          <Card key={agent.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' : 
                    agent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-base">{agent.name}</span>
                </div>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status}
                </Badge>
              </CardTitle>
              <CardDescription>{agent.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Performance:</span>
                  <span className="font-medium">{agent.performance.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Allocation:</span>
                  <span className="font-medium">${agent.allocation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Success Rate:</span>
                  <span className="font-medium">{agent.success_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Decisions:</span>
                  <span className="font-medium">{agent.decisions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Activity:</span>
                  <span className="font-medium">{agent.lastActivity}</span>
                </div>
                <div className="flex gap-2">
                  {agent.status === 'active' ? (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Config
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const EmergencyControlsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Emergency Controls</h3>
          <p className="text-sm text-muted-foreground">
            Critical system controls and emergency procedures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={autonomousEnabled} 
            onCheckedChange={setAutonomousEnabled}
          />
          <span className="text-sm font-medium">Autonomous Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency Procedures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleEmergencyStop}
            >
              <Power className="h-4 w-4 mr-2" />
              Emergency Stop All Trading
            </Button>
            <Button variant="outline" className="w-full">
              <Pause className="h-4 w-4 mr-2" />
              Pause All Agents
            </Button>
            <Button variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Enable Risk Override
            </Button>
            <Button variant="outline" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Force State Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Recovery</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Monitoring</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agent Communication</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Data Feed</span>
                <Switch defaultChecked />
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart All Services
            </Button>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Emergency controls are designed for critical situations. Use with caution as they may affect active trading positions.
        </AlertDescription>
      </Alert>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading autonomous systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Autonomous Control Center</h2>
          <p className="text-muted-foreground">
            Monitor and control 24/7 autonomous trading operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autonomousEnabled ? 'default' : 'secondary'}>
            {autonomousEnabled ? 'AUTONOMOUS' : 'MANUAL'}
          </Badge>
          <Badge variant="outline">
            {services.filter(s => s.status === 'healthy').length}/{services.length} Services Healthy
          </Badge>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="health">
          <HealthMonitorDashboard />
        </TabsContent>

        <TabsContent value="communication">
          <AgentCommunicationPanel />
        </TabsContent>

        <TabsContent value="voting">
          <DecisionVoting />
        </TabsContent>

        <TabsContent value="market">
          <MarketRegimeMonitor />
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyProtocolsMonitor />
        </TabsContent>
      </Tabs>
    </div>
  )
}