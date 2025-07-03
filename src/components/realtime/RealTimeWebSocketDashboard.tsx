'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, Wifi, WifiOff, RefreshCw, 
  TrendingUp, TrendingDown, Target, Bot,
  AlertTriangle, CheckCircle, Clock, Zap
} from 'lucide-react'
import { useWebSocket, MarketDataUpdate, FarmUpdate, GoalUpdate, TradingSignal, AgentUpdate } from '@/lib/websocket/websocket-service'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface RealTimeWebSocketDashboardProps {
  className?: string
}

export function RealTimeWebSocketDashboard({ className }: RealTimeWebSocketDashboardProps) {
  const { 
    subscribe, 
    isConnected, 
    connectionInfo, 
    reconnect,
    sendMessage,
    requestMarketData
  } = useWebSocket()

  // Real-time data states
  const [marketData, setMarketData] = useState<MarketDataUpdate[]>([])
  const [farmUpdates, setFarmUpdates] = useState<FarmUpdate[]>([])
  const [goalUpdates, setGoalUpdates] = useState<GoalUpdate[]>([])
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([])
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [connectionStats, setConnectionStats] = useState({
    messagesReceived: 0,
    lastMessageTime: null as Date | null,
    uptime: 0
  })

  // Connection monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStats(prev => ({
        ...prev,
        uptime: isConnected ? prev.uptime + 1 : 0
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected])

  // WebSocket subscriptions
  useEffect(() => {
    const subscriptions = [
      // Market data updates
      subscribe('market_data', (data: MarketDataUpdate) => {
        setMarketData(prev => [data, ...prev.slice(0, 9)]) // Keep last 10
        setConnectionStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
      }),

      // Farm updates
      subscribe('farm_update', (data: FarmUpdate) => {
        setFarmUpdates(prev => [data, ...prev.slice(0, 4)]) // Keep last 5
        setConnectionStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        
        // Show toast notification for significant changes
        if (data.performance.totalPnL > 0) {
          toast.success(`Farm ${data.farmId}: +$${data.performance.totalPnL.toFixed(2)} P&L`)
        }
      }),

      // Goal updates
      subscribe('goal_update', (data: GoalUpdate) => {
        setGoalUpdates(prev => [data, ...prev.slice(0, 4)]) // Keep last 5
        setConnectionStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        
        // Celebrate goal completion
        if (data.status === 'completed') {
          toast.success(`🎉 Goal completed: ${data.goalId}`)
        }
      }),

      // Trading signals
      subscribe('trading_signal', (data: TradingSignal) => {
        setTradingSignals(prev => [data, ...prev.slice(0, 9)]) // Keep last 10
        setConnectionStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        
        // Show signal notifications
        const actionColor = data.action === 'buy' ? '🟢' : data.action === 'sell' ? '🔴' : '🟡'
        toast(`${actionColor} ${data.action.toUpperCase()} ${data.symbol} - ${(data.confidence * 100).toFixed(0)}% confidence`)
      }),

      // Agent updates
      subscribe('agent_update', (data: AgentUpdate) => {
        setAgentUpdates(prev => [data, ...prev.slice(0, 4)]) // Keep last 5
        setConnectionStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
      }),

      // Notifications
      subscribe('notification', (data: any) => {
        setNotifications(prev => [data, ...prev.slice(0, 9)]) // Keep last 10
        setConnectionStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: new Date()
        }))
        
        // Show toast for notifications
        toast(data.message, { 
          icon: data.type === 'success' ? '✅' : data.type === 'warning' ? '⚠️' : 'ℹ️' 
        })
      }),

      // Risk alerts
      subscribe('risk_alert', (data: any) => {
        setNotifications(prev => [{
          type: 'risk_alert',
          severity: data.severity,
          message: data.message,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)])
        
        // Show urgent toast for risk alerts
        toast.error(`🚨 Risk Alert: ${data.message}`)
      })
    ]

    // Request initial market data
    requestMarketData(['BTC/USD', 'ETH/USD', 'SOL/USD'])

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe())
    }
  }, [subscribe, requestMarketData])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getSignalColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-600'
      case 'sell': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              WebSocket Connection
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button size="sm" variant="outline" onClick={reconnect}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Messages:</span>
              <div className="font-bold">{connectionStats.messagesReceived}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Uptime:</span>
              <div className="font-bold">{connectionStats.uptime}s</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Message:</span>
              <div className="font-bold">
                {connectionStats.lastMessageTime 
                  ? connectionStats.lastMessageTime.toLocaleTimeString()
                  : 'None'
                }
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Socket ID:</span>
              <div className="font-bold text-xs">{connectionInfo.socketId || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Market Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Live Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {marketData.map((data, index) => (
                <motion.div
                  key={`${data.symbol}-${data.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{data.symbol}</div>
                    <div className="text-sm text-muted-foreground">{formatTime(data.timestamp)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${data.price.toLocaleString()}</div>
                    <div className={`text-sm ${data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {marketData.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Waiting for market data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Trading Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {tradingSignals.map((signal, index) => (
                <motion.div
                  key={`${signal.symbol}-${signal.timestamp}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{signal.symbol}</div>
                    <div className="text-sm text-muted-foreground">{signal.strategy}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold uppercase ${getSignalColor(signal.action)}`}>
                      {signal.action}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(signal.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {tradingSignals.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Waiting for trading signals...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Farm Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              Farm Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {farmUpdates.map((farm, index) => (
                <motion.div
                  key={`${farm.farmId}-${farm.timestamp}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{farm.farmId}</div>
                    <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                      {farm.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Value:</span> ${farm.performance.totalValue.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">P&L:</span> 
                      <span className={farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {farm.performance.totalPnL >= 0 ? '+' : ''}${farm.performance.totalPnL.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {farmUpdates.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Waiting for farm updates...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {goalUpdates.map((goal, index) => (
                <motion.div
                  key={`${goal.goalId}-${goal.timestamp}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{goal.goalId}</div>
                    <div className="flex items-center gap-2">
                      {goal.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                        {goal.progress.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {goalUpdates.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Waiting for goal updates...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {notifications.slice(0, 5).map((notification, index) => (
                  <motion.div
                    key={`${notification.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 rounded-lg border-l-4 ${
                      notification.type === 'risk_alert' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{notification.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RealTimeWebSocketDashboard