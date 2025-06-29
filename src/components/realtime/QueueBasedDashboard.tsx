'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Bot, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { getSupabaseQueueService, type DashboardMessage } from '@/lib/queues/supabase-queue-service'
import { getQueueTradingService, type QueuedTradingOrder, type TradingSignal, type RiskAlert } from '@/lib/trading/queue-trading-service'
import { getPersistentMemoryService } from '@/lib/memory/persistent-memory-service'

interface DashboardUpdate {
  id: string
  type: string
  component: string
  data: any
  timestamp: Date
}

interface SystemStatus {
  queuesHealthy: boolean
  tradingActive: boolean
  agentsActive: number
  memorySystemActive: boolean
  lastUpdate: Date
}

export default function QueueBasedDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    queuesHealthy: false,
    tradingActive: false,
    agentsActive: 0,
    memorySystemActive: false,
    lastUpdate: new Date()
  })

  const [recentUpdates, setRecentUpdates] = useState<DashboardUpdate[]>([])
  const [tradingOrders, setTradingOrders] = useState<QueuedTradingOrder[]>([])
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([])
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const queueService = getSupabaseQueueService()
  const tradingService = getQueueTradingService()
  const memoryService = getPersistentMemoryService()

  useEffect(() => {
    initializeServices()
  }, [])

  const initializeServices = async () => {
    try {
      // Initialize queue service
      await queueService.initialize()
      
      // Initialize trading service
      await tradingService.initialize()

      // Set up dashboard update listeners
      await queueService.receiveDashboardUpdates(async (message) => {
        const update: DashboardUpdate = {
          id: `update_${Date.now()}`,
          type: message.payload.type,
          component: message.payload.component,
          data: message.payload.data,
          timestamp: message.payload.timestamp
        }
        
        setRecentUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50
        await processDashboardUpdate(update)
      })

      // Set up trading order listeners
      tradingService.onOrderUpdate((order) => {
        setTradingOrders(prev => [order, ...prev.slice(0, 9)]) // Keep last 10
        publishDashboardUpdate('order_update', 'trading', { order })
      })

      // Set up trading signal listeners
      tradingService.onTradingSignal((signal) => {
        setTradingSignals(prev => [signal, ...prev.slice(0, 9)]) // Keep last 10
        publishDashboardUpdate('trading_signal', 'signals', { signal })
      })

      // Set up risk alert listeners
      tradingService.onRiskAlert((alert) => {
        setRiskAlerts(prev => [alert, ...prev.slice(0, 19)]) // Keep last 20
        publishDashboardUpdate('risk_alert', 'risk', { alert })
      })

      // Load initial data
      await loadInitialData()

      // Start real-time status monitoring
      startStatusMonitoring()

      setIsInitialized(true)
      console.log('✅ Queue-based dashboard initialized')

    } catch (error) {
      console.error('❌ Failed to initialize queue-based dashboard:', error)
    }
  }

  const loadInitialData = async () => {
    try {
      // Load recent trading orders
      const orders = await tradingService.getOrderHistory(undefined, 10)
      setTradingOrders(orders)

      // Load recent trading signals
      const signals = await tradingService.getTradingSignals(undefined, 10)
      setTradingSignals(signals)

      // Load recent risk alerts
      const alerts = await tradingService.getRiskAlerts(undefined, 20)
      setRiskAlerts(alerts)

    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const startStatusMonitoring = () => {
    const updateStatus = async () => {
      try {
        // Check queue health
        const queueStats = await queueService.getAllQueueStats()
        const queuesHealthy = Object.values(queueStats).every(stat => 
          stat && (stat.queue_length || 0) < 100
        )

        // Check trading status
        const recentOrders = await tradingService.getOrderHistory(undefined, 5)
        const tradingActive = recentOrders.some(order => 
          order.status === 'pending' || order.status === 'processing'
        )

        // Check agent activity
        const agents = memoryService.simpleMemory.getAllAgents()
        const agentsActive = agents.length

        // Check memory system
        const memorySystemActive = true // Memory service is always active if loaded

        setSystemStatus({
          queuesHealthy,
          tradingActive,
          agentsActive,
          memorySystemActive,
          lastUpdate: new Date()
        })

      } catch (error) {
        console.error('Error updating system status:', error)
      }
    }

    // Update status every 30 seconds
    updateStatus()
    const interval = setInterval(updateStatus, 30000)
    
    return () => clearInterval(interval)
  }

  const publishDashboardUpdate = async (type: string, component: string, data: any) => {
    try {
      await queueService.sendDashboardUpdate({
        type,
        component,
        data,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error publishing dashboard update:', error)
    }
  }

  const processDashboardUpdate = async (update: DashboardUpdate) => {
    // Process specific update types for real-time dashboard changes
    switch (update.type) {
      case 'portfolio_update':
        // Handle portfolio updates
        console.log('📊 Portfolio update received:', update.data)
        break
      
      case 'market_data':
        // Handle market data updates
        console.log('📈 Market data update:', update.data)
        break
      
      case 'agent_status':
        // Handle agent status updates
        console.log('🤖 Agent status update:', update.data)
        break
      
      case 'system_event':
        // Handle system events
        console.log('⚡ System event:', update.data)
        break
    }
  }

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Initializing queue-based dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Real-time Dashboard</h2>
          <p className="text-muted-foreground">
            Queue-powered real-time updates and system monitoring
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          Last updated: {systemStatus.lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue System</CardTitle>
            {getStatusIcon(systemStatus.queuesHealthy)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(systemStatus.queuesHealthy)}`}>
              {systemStatus.queuesHealthy ? 'Healthy' : 'Issues'}
            </div>
            <p className="text-xs text-muted-foreground">
              All message queues operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading System</CardTitle>
            {getStatusIcon(systemStatus.tradingActive)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(systemStatus.tradingActive)}`}>
              {systemStatus.tradingActive ? 'Active' : 'Idle'}
            </div>
            <p className="text-xs text-muted-foreground">
              Order processing status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.agentsActive}</div>
            <p className="text-xs text-muted-foreground">
              Active agents with memory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory System</CardTitle>
            {getStatusIcon(systemStatus.memorySystemActive)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(systemStatus.memorySystemActive)}`}>
              {systemStatus.memorySystemActive ? 'Active' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Agent memory processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trading Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Recent Trading Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {tradingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                        {order.side.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="text-sm font-medium">{order.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.quantity} @ {order.orderType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={
                        order.status === 'filled' ? 'border-green-500 text-green-700' :
                        order.status === 'pending' ? 'border-yellow-500 text-yellow-700' :
                        order.status === 'rejected' ? 'border-red-500 text-red-700' :
                        'border-gray-500 text-gray-700'
                      }>
                        {order.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {order.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {tradingOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent trading orders
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Updates Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Real-time Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="text-sm font-medium">{update.component}</div>
                        <div className="text-xs text-muted-foreground">
                          {update.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {update.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {recentUpdates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Waiting for real-time updates...
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {riskAlerts.map((alert) => (
                  <div key={alert.id} className="p-2 border rounded">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'destructive' :
                        alert.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {alert.type.replace('_', ' ')} • Action: {alert.action}
                    </div>
                  </div>
                ))}
                {riskAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    No active risk alerts
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Trading Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trading Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {tradingSignals.map((signal) => (
                  <div key={signal.id} className="p-2 border rounded">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={
                        signal.signal === 'buy' ? 'default' :
                        signal.signal === 'sell' ? 'destructive' : 'secondary'
                      }>
                        {signal.signal.toUpperCase()} {signal.symbol}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {signal.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Strength: {(signal.strength * 100).toFixed(0)}% • 
                      Confidence: {(signal.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs mt-1">{signal.reasoning}</div>
                  </div>
                ))}
                {tradingSignals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent trading signals
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}