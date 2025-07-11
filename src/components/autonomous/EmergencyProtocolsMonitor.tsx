'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertTriangle, Shield, Power, Pause, Play, StopCircle, 
  CheckCircle, XCircle, Clock, Zap, AlertCircle, 
  Activity, TrendingDown, Settings, Eye, Timer,
  CircuitBoard, RefreshCw, Database, Bell, Target, Calendar
} from 'lucide-react'

// Types matching the backend service
interface EmergencyEvent {
  event_id: string
  emergency_type: string
  severity: string
  trigger_condition: string
  triggered_at: string
  resolved_at?: string
  actions_taken: string[]
  impact_assessment: Record<string, any>
  resolution_notes: string
  auto_resolved: boolean
  metadata: Record<string, any>
}

interface CircuitBreaker {
  breaker_id: string
  breaker_type: string
  threshold: number
  cooldown_seconds: number
  max_triggers_per_day: number
  enabled: boolean
  last_triggered?: string
  triggers_today: number
  recovery_conditions: string[]
  emergency_actions: string[]
}

interface EmergencyStatus {
  emergency_mode_active: boolean
  system_halted: boolean
  autonomous_mode_suspended: boolean
  active_emergencies: number
  active_emergency_details: Array<{
    event_id: string
    type: string
    severity: string
    triggered_at: string
    duration_seconds: number
  }>
  circuit_breakers_active: number
  emergency_conditions_monitored: number
  metrics: {
    total_emergencies: number
    emergencies_today: number
    circuit_breaker_triggers: number
    auto_recoveries: number
    manual_interventions: number
    system_downtime_seconds: number
    average_response_time: number
  }
  last_health_check: string
}

export default function EmergencyProtocolsMonitor() {
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus | null>(null)
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyEvent[]>([])
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data that matches the backend service
  useEffect(() => {
    const mockEmergencyStatus: EmergencyStatus = {
      emergency_mode_active: false,
      system_halted: false,
      autonomous_mode_suspended: false,
      active_emergencies: 0,
      active_emergency_details: [],
      circuit_breakers_active: 4,
      emergency_conditions_monitored: 4,
      metrics: {
        total_emergencies: 12,
        emergencies_today: 0,
        circuit_breaker_triggers: 3,
        auto_recoveries: 8,
        manual_interventions: 4,
        system_downtime_seconds: 0,
        average_response_time: 2.3
      },
      last_health_check: new Date().toISOString()
    }

    const mockEmergencyHistory: EmergencyEvent[] = [
      {
        event_id: 'event-001',
        emergency_type: 'risk_breach',
        severity: 'high',
        trigger_condition: 'Portfolio loss exceeded 4.2% threshold',
        triggered_at: new Date(Date.now() - 3600000).toISOString(),
        resolved_at: new Date(Date.now() - 3300000).toISOString(),
        actions_taken: ['reduce_positions', 'pause_agents', 'notify_operators'],
        impact_assessment: {
          portfolio_impact: -0.042,
          recovery_time: 300,
          financial_impact: -15000
        },
        resolution_notes: 'Auto-recovery: positions reduced by 30%, risk normalized',
        auto_resolved: true,
        metadata: {
          trigger_value: 0.042,
          threshold: 0.04
        }
      },
      {
        event_id: 'event-002',
        emergency_type: 'market_crash',
        severity: 'critical',
        trigger_condition: 'Volatility spike detected at 6.8%',
        triggered_at: new Date(Date.now() - 7200000).toISOString(),
        resolved_at: new Date(Date.now() - 6900000).toISOString(),
        actions_taken: ['halt_all_trading', 'emergency_hedge', 'notify_operators'],
        impact_assessment: {
          portfolio_impact: -0.018,
          recovery_time: 180,
          financial_impact: -8500
        },
        resolution_notes: 'Manual intervention: trading resumed after market stabilization',
        auto_resolved: false,
        metadata: {
          volatility_level: 0.068,
          market_conditions: 'extreme'
        }
      },
      {
        event_id: 'event-003',
        emergency_type: 'agent_malfunction',
        severity: 'medium',
        trigger_condition: 'Agent error rate exceeded 12% threshold',
        triggered_at: new Date(Date.now() - 10800000).toISOString(),
        resolved_at: new Date(Date.now() - 10500000).toISOString(),
        actions_taken: ['pause_agents', 'switch_to_manual', 'isolate_failed_component'],
        impact_assessment: {
          portfolio_impact: -0.005,
          recovery_time: 300,
          financial_impact: -2100
        },
        resolution_notes: 'Auto-recovery: agent restarted, error rate normalized',
        auto_resolved: true,
        metadata: {
          error_rate: 0.12,
          affected_agents: ['marcus_momentum']
        }
      }
    ]

    const mockCircuitBreakers: CircuitBreaker[] = [
      {
        breaker_id: 'portfolio_loss_breaker',
        breaker_type: 'portfolio_loss',
        threshold: 0.05,
        cooldown_seconds: 300,
        max_triggers_per_day: 3,
        enabled: true,
        last_triggered: new Date(Date.now() - 3600000).toISOString(),
        triggers_today: 1,
        recovery_conditions: ['portfolio_stabilized', 'manual_override'],
        emergency_actions: ['halt_all_trading', 'notify_operators']
      },
      {
        breaker_id: 'daily_drawdown_breaker',
        breaker_type: 'daily_drawdown',
        threshold: 0.03,
        cooldown_seconds: 600,
        max_triggers_per_day: 5,
        enabled: true,
        triggers_today: 0,
        recovery_conditions: ['drawdown_recovered'],
        emergency_actions: ['reduce_positions', 'pause_agents']
      },
      {
        breaker_id: 'volatility_spike_breaker',
        breaker_type: 'volatility_spike',
        threshold: 0.05,
        cooldown_seconds: 180,
        max_triggers_per_day: 10,
        enabled: true,
        last_triggered: new Date(Date.now() - 7200000).toISOString(),
        triggers_today: 1,
        recovery_conditions: ['volatility_normalized'],
        emergency_actions: ['reduce_positions', 'emergency_hedge']
      },
      {
        breaker_id: 'agent_error_rate_breaker',
        breaker_type: 'agent_error_rate',
        threshold: 0.10,
        cooldown_seconds: 900,
        max_triggers_per_day: 3,
        enabled: true,
        last_triggered: new Date(Date.now() - 10800000).toISOString(),
        triggers_today: 1,
        recovery_conditions: ['agent_errors_resolved'],
        emergency_actions: ['pause_agents', 'switch_to_manual']
      }
    ]

    setEmergencyStatus(mockEmergencyStatus)
    setEmergencyHistory(mockEmergencyHistory)
    setCircuitBreakers(mockCircuitBreakers)
    setIsLoading(false)
  }, [])

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate status updates
      if (emergencyStatus) {
        setEmergencyStatus(prev => prev ? {
          ...prev,
          last_health_check: new Date().toISOString()
        } : null)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, emergencyStatus])

  const getEmergencyTypeIcon = (type: string) => {
    switch (type) {
      case 'market_crash': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'risk_breach': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'system_failure': return <XCircle className="h-4 w-4 text-red-600" />
      case 'agent_malfunction': return <Settings className="h-4 w-4 text-yellow-600" />
      case 'liquidity_crisis': return <Activity className="h-4 w-4 text-purple-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getEmergencyTypeColor = (type: string) => {
    switch (type) {
      case 'market_crash': return 'text-red-600 bg-red-50 border-red-200'
      case 'risk_breach': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'system_failure': return 'text-red-600 bg-red-50 border-red-200'
      case 'agent_malfunction': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'liquidity_crisis': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'halt_all_trading': return <StopCircle className="h-4 w-4 text-red-600" />
      case 'reduce_positions': return <TrendingDown className="h-4 w-4 text-orange-600" />
      case 'pause_agents': return <Pause className="h-4 w-4 text-yellow-600" />
      case 'emergency_hedge': return <Shield className="h-4 w-4 text-blue-600" />
      case 'notify_operators': return <Bell className="h-4 w-4 text-purple-600" />
      case 'switch_to_manual': return <Settings className="h-4 w-4 text-gray-600" />
      default: return <Zap className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const handleEmergencyTrigger = (type: string) => {
    console.log(`Manual emergency trigger: ${type}`)
    // In real implementation, this would call the backend API
    setShowEmergencyDialog(false)
  }

  const handleSystemHalt = () => {
    console.log('System halt triggered')
    // In real implementation, this would call the backend API
  }

  const handleSystemResume = () => {
    console.log('System resume triggered')
    // In real implementation, this would call the backend API
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading emergency protocols...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Emergency Protocols Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of emergency systems and circuit breakers
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
          <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Emergency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Emergency Trigger</DialogTitle>
                <DialogDescription>
                  Select the type of emergency to trigger manually. This should only be used in critical situations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleEmergencyTrigger('market_crash')}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Market Crash
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleEmergencyTrigger('risk_breach')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Risk Breach
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleEmergencyTrigger('system_failure')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  System Failure
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleEmergencyTrigger('agent_malfunction')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Agent Malfunction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Status Overview */}
      {emergencyStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`border-2 ${
            emergencyStatus.emergency_mode_active ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Mode</p>
                  <p className={`text-2xl font-bold ${
                    emergencyStatus.emergency_mode_active ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {emergencyStatus.emergency_mode_active ? 'ACTIVE' : 'INACTIVE'}
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${
                  emergencyStatus.emergency_mode_active ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${
            emergencyStatus.system_halted ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className={`text-2xl font-bold ${
                    emergencyStatus.system_halted ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {emergencyStatus.system_halted ? 'HALTED' : 'RUNNING'}
                  </p>
                </div>
                <Power className={`h-8 w-8 ${
                  emergencyStatus.system_halted ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Emergencies</p>
                  <p className={`text-2xl font-bold ${
                    emergencyStatus.active_emergencies > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {emergencyStatus.active_emergencies}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${
                  emergencyStatus.active_emergencies > 0 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Circuit Breakers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {emergencyStatus.circuit_breakers_active}
                  </p>
                </div>
                <CircuitBoard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Controls */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Power className="h-5 w-5" />
            Emergency Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              variant="destructive"
              onClick={handleSystemHalt}
              disabled={emergencyStatus?.system_halted}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Emergency Halt
            </Button>
            <Button 
              variant="outline"
              onClick={handleSystemResume}
              disabled={!emergencyStatus?.system_halted}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume System
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Backup State
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Active Emergencies */}
          {emergencyStatus && emergencyStatus.active_emergencies > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Active Emergencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyStatus.active_emergency_details.map(emergency => (
                    <Alert key={emergency.event_id} className="border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <span className="font-medium capitalize">{emergency.type.replace('_', ' ')}</span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            Duration: {formatDuration(emergency.duration_seconds)}
                          </span>
                        </div>
                        <Badge variant="destructive" className="capitalize">
                          {emergency.severity}
                        </Badge>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency Mode</span>
                    <Badge variant={emergencyStatus?.emergency_mode_active ? 'destructive' : 'default'}>
                      {emergencyStatus?.emergency_mode_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Halted</span>
                    <Badge variant={emergencyStatus?.system_halted ? 'destructive' : 'default'}>
                      {emergencyStatus?.system_halted ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autonomous Mode</span>
                    <Badge variant={emergencyStatus?.autonomous_mode_suspended ? 'destructive' : 'default'}>
                      {emergencyStatus?.autonomous_mode_suspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency Conditions</span>
                    <span className="font-medium">{emergencyStatus?.emergency_conditions_monitored}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Circuit Breakers</span>
                    <span className="font-medium">{emergencyStatus?.circuit_breakers_active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Health Check</span>
                    <span className="font-medium text-sm">
                      {emergencyStatus && new Date(emergencyStatus.last_health_check).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakers" className="space-y-4">
          {/* Circuit Breakers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {circuitBreakers.map(breaker => (
              <Card key={breaker.breaker_id} className={`border-2 ${
                breaker.enabled ? 'border-green-200' : 'border-gray-200'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircuitBoard className="h-5 w-5" />
                      <span className="capitalize">{breaker.breaker_type.replace('_', ' ')}</span>
                    </div>
                    <Switch 
                      checked={breaker.enabled} 
                      onCheckedChange={() => {}}
                      disabled
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Threshold:</span>
                        <div className="font-medium">{(breaker.threshold * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cooldown:</span>
                        <div className="font-medium">{breaker.cooldown_seconds}s</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Triggers Today:</span>
                        <div className="font-medium">{breaker.triggers_today}/{breaker.max_triggers_per_day}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Triggered:</span>
                        <div className="font-medium text-xs">
                          {breaker.last_triggered 
                            ? new Date(breaker.last_triggered).toLocaleString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Emergency Actions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {breaker.emergency_actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                            {getActionIcon(action)}
                            <span className="capitalize">{action.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Emergency History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Emergency History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emergencyHistory.map(event => (
                  <Card key={event.event_id} className={`border-l-4 ${getEmergencyTypeColor(event.emergency_type)}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEmergencyTypeIcon(event.emergency_type)}
                          <span className="font-medium capitalize">{event.emergency_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <Badge variant={event.auto_resolved ? 'default' : 'secondary'}>
                            {event.auto_resolved ? 'Auto-resolved' : 'Manual'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Trigger:</span> {event.trigger_condition}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Duration:</span> {
                            event.resolved_at 
                              ? formatDuration((new Date(event.resolved_at).getTime() - new Date(event.triggered_at).getTime()) / 1000)
                              : 'Ongoing'
                          }
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Actions Taken:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.actions_taken.map((action, index) => (
                              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                {getActionIcon(action)}
                                <span className="capitalize">{action.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {event.resolution_notes && (
                          <div className="text-sm">
                            <span className="font-medium">Resolution:</span> {event.resolution_notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.triggered_at).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Emergencies</p>
                    <p className="text-2xl font-bold">{emergencyStatus?.metrics.total_emergencies}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emergencies Today</p>
                    <p className="text-2xl font-bold">{emergencyStatus?.metrics.emergencies_today}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Circuit Breaker Triggers</p>
                    <p className="text-2xl font-bold">{emergencyStatus?.metrics.circuit_breaker_triggers}</p>
                  </div>
                  <CircuitBoard className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Auto Recoveries</p>
                    <p className="text-2xl font-bold text-green-600">{emergencyStatus?.metrics.auto_recoveries}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Manual Interventions</p>
                    <p className="text-2xl font-bold text-yellow-600">{emergencyStatus?.metrics.manual_interventions}</p>
                  </div>
                  <Settings className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{emergencyStatus?.metrics.average_response_time.toFixed(1)}s</p>
                  </div>
                  <Timer className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}