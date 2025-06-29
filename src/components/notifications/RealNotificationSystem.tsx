'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Bell,
  BellRing,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Shield,
  Zap,
  Clock,
  Settings,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Filter
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  Order,
  MarketPrice
} from '@/lib/trading/real-paper-trading-engine'

interface TradingNotification {
  id: string
  type: 'order_filled' | 'price_alert' | 'risk_alert' | 'agent_status' | 'portfolio_alert' | 'system'
  title: string
  message: string
  severity: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  agentId?: string
  symbol?: string
  value?: number
  actionRequired?: boolean
  autoHide?: boolean
}

interface NotificationRule {
  id: string
  name: string
  type: 'price' | 'volume' | 'portfolio' | 'agent' | 'risk'
  condition: string
  value: number
  symbol?: string
  agentId?: string
  enabled: boolean
  sound: boolean
  email: boolean
  push: boolean
}

interface NotificationSettings {
  enabled: boolean
  sound: boolean
  showInApp: boolean
  maxNotifications: number
  autoHideDelay: number
  groupSimilar: boolean
  soundVolume: number
}

interface NotificationContextType {
  notifications: TradingNotification[]
  addNotification: (notification: Omit<TradingNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<TradingNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    showInApp: true,
    maxNotifications: 50,
    autoHideDelay: 5000,
    groupSimilar: true,
    soundVolume: 0.7
  })

  const addNotification = (notification: Omit<TradingNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!settings.enabled) return

    const newNotification: TradingNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      return updated.slice(0, settings.maxNotifications)
    })

    // Play sound if enabled
    if (settings.sound && notification.severity !== 'info') {
      playNotificationSound(notification.severity)
    }

    // Auto-hide if specified
    if (notification.autoHide !== false && settings.autoHideDelay > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, settings.autoHideDelay)
    }
  }

  const playNotificationSound = (severity: TradingNotification['severity']) => {
    if (!settings.sound) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Different frequencies for different severities
      const frequencies = {
        info: 440,
        success: 523,
        warning: 659,
        error: 880
      }

      oscillator.frequency.setValueAtTime(frequencies[severity], audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(settings.soundVolume * 0.1, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

interface RealNotificationSystemProps {
  className?: string
}

export function RealNotificationSystem({ className }: RealNotificationSystemProps) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications()
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'today'>('all')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    loadAgents()
    loadDefaultRules()
    
    // Set up trading event listeners for notifications
    setupTradingEventListeners()

    return () => {
      // Cleanup listeners would go here
    }
  }, [])

  const loadAgents = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)
  }

  const loadDefaultRules = () => {
    const defaultRules: NotificationRule[] = [
      {
        id: 'portfolio_loss_5',
        name: 'Portfolio Loss > 5%',
        type: 'portfolio',
        condition: 'loss_percent_above',
        value: 5,
        enabled: true,
        sound: true,
        email: false,
        push: true
      },
      {
        id: 'agent_stopped',
        name: 'Agent Stopped Trading',
        type: 'agent',
        condition: 'status_changed',
        value: 0,
        enabled: true,
        sound: true,
        email: true,
        push: true
      },
      {
        id: 'large_order',
        name: 'Large Order Filled',
        type: 'portfolio',
        condition: 'order_value_above',
        value: 1000,
        enabled: true,
        sound: false,
        email: false,
        push: true
      },
      {
        id: 'risk_threshold',
        name: 'High Risk Detected',
        type: 'risk',
        condition: 'risk_score_above',
        value: 80,
        enabled: true,
        sound: true,
        email: true,
        push: true
      }
    ]
    
    setNotificationRules(defaultRules)
  }

  const setupTradingEventListeners = () => {
    const { addNotification } = useNotifications()

    // Order filled notifications
    const handleOrderFilled = (order: Order) => {
      addNotification({
        type: 'order_filled',
        title: 'Order Filled',
        message: `${order.side} ${order.quantity} ${order.symbol} @ $${order.price?.toFixed(2)}`,
        severity: 'success',
        symbol: order.symbol,
        value: order.price,
        autoHide: true
      })
    }

    // Agent status changes
    const handleAgentStatusChange = (agent: TradingAgent) => {
      addNotification({
        type: 'agent_status',
        title: 'Agent Status Changed',
        message: `Agent ${agent.name} is now ${agent.status}`,
        severity: agent.status === 'active' ? 'success' : 'warning',
        agentId: agent.id,
        autoHide: true
      })
    }

    // Price alerts (simulated)
    const handlePriceUpdates = (prices: MarketPrice[]) => {
      prices.forEach(price => {
        // Check for significant price movements (>5%)
        if (Math.abs(price.change24h / price.price * 100) > 5) {
          addNotification({
            type: 'price_alert',
            title: 'Significant Price Movement',
            message: `${price.symbol} ${price.change24h > 0 ? 'gained' : 'dropped'} ${Math.abs(price.change24h / price.price * 100).toFixed(1)}%`,
            severity: Math.abs(price.change24h / price.price * 100) > 10 ? 'warning' : 'info',
            symbol: price.symbol,
            value: price.price,
            autoHide: true
          })
        }
      })
    }

    paperTradingEngine.on('orderFilled', handleOrderFilled)
    paperTradingEngine.on('pricesUpdated', handlePriceUpdates)
    
    // Simulate some notifications for demo
    setTimeout(() => {
      addNotification({
        type: 'system',
        title: 'System Update',
        message: 'Paper trading engine initialized successfully',
        severity: 'success',
        autoHide: true
      })
    }, 2000)
  }

  const getFilteredNotifications = () => {
    let filtered = notifications

    switch (selectedFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read)
        break
      case 'today':
        const today = new Date().toDateString()
        filtered = notifications.filter(n => n.timestamp.toDateString() === today)
        break
      default:
        filtered = notifications
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const getSeverityIcon = (severity: TradingNotification['severity']) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: TradingNotification['severity']) => {
    switch (severity) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getTypeIcon = (type: TradingNotification['type']) => {
    switch (type) {
      case 'order_filled':
        return <CheckCircle2 className="h-4 w-4" />
      case 'price_alert':
        return <TrendingUp className="h-4 w-4" />
      case 'risk_alert':
        return <Shield className="h-4 w-4" />
      case 'agent_status':
        return <Activity className="h-4 w-4" />
      case 'portfolio_alert':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = getFilteredNotifications()

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-purple-600" />
              Notification Center
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
              )}
            </h2>
            <p className="text-sm text-gray-600">Real-time alerts and trading notifications</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="today">Today</SelectItem>
              </SelectContent>
            </Select>
            
            <Button size="sm" variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Mark All Read
            </Button>
            
            <Button size="sm" variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                  <DialogDescription>Configure your notification preferences and rules</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Notification Rules */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notification Rules</h3>
                    <div className="space-y-3">
                      {notificationRules.map((rule) => (
                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-gray-600">
                              {rule.type} - {rule.condition} {rule.value}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch checked={rule.enabled} />
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`${getSeverityColor(notification.severity)} ${
                    !notification.read ? 'ring-2 ring-blue-200' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getSeverityIcon(notification.severity)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(notification.type)}
                              <span className="font-medium text-gray-900">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {notification.timestamp.toLocaleTimeString()}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {notification.symbol && (
                                <span>Symbol: {notification.symbol}</span>
                              )}
                              {notification.value && (
                                <span>Value: ${notification.value.toFixed(2)}</span>
                              )}
                              <span>Type: {notification.type.replace('_', ' ')}</span>
                            </div>
                            
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs h-6"
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'order_filled').length}
              </div>
              <div className="text-sm text-gray-600">Order Alerts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => n.severity === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RealNotificationSystem