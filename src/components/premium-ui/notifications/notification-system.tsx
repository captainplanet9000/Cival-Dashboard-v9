'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Info,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bell,
  BellOff,
  Volume2,
  VolumeX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { AnimatePresence, motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'trade' | 'price-alert'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  data?: any
  sound?: boolean
  read?: boolean
}

export interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification sounds
const NOTIFICATION_SOUNDS = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  warning: '/sounds/warning.mp3',
  info: '/sounds/info.mp3',
  trade: '/sounds/trade.mp3',
  'price-alert': '/sounds/price-alert.mp3'
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playSound = useCallback((type: NotificationType) => {
    if (!soundEnabled) return
    
    // Simple beep sound using Web Audio API as fallback
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = type === 'success' ? 800 : type === 'error' ? 400 : 600
    gainNode.gain.value = 0.1
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }, [soundEnabled])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])
    
    if (notification.sound !== false) {
      playSound(notification.type)
    }

    // Auto-remove non-persistent notifications
    if (!notification.persistent && notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, notification.duration || 5000)
    }
  }, [playSound])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }, [])

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    markAsRead,
    markAllAsRead,
    soundEnabled,
    setSoundEnabled
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToasts />
    </NotificationContext.Provider>
  )
}

// Toast notifications component
function NotificationToasts() {
  const { notifications, removeNotification } = useNotifications()
  
  const toastNotifications = notifications.filter(n => !n.persistent)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toastNotifications.slice(0, 5).map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function NotificationToast({
  notification,
  onDismiss
}: {
  notification: Notification
  onDismiss: () => void
}) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    trade: <DollarSign className="h-5 w-5 text-purple-500" />,
    'price-alert': notification.data?.direction === 'up' 
      ? <TrendingUp className="h-5 w-5 text-green-500" />
      : <TrendingDown className="h-5 w-5 text-red-500" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="pointer-events-auto"
    >
      <Card className="w-96 p-4 shadow-lg">
        <div className="flex gap-3">
          {icons[notification.type]}
          <div className="flex-1">
            <h4 className="font-semibold">{notification.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
            {notification.action && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-1"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

// Notification center component
export function NotificationCenter({ className }: { className?: string }) {
  const { 
    notifications, 
    clearAll, 
    markAllAsRead, 
    soundEnabled, 
    setSoundEnabled 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all')
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const groupedByDate = filteredNotifications.reduce((acc, notification) => {
    const date = notification.timestamp.toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead}>
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearAll}>
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="trade">Trades</TabsTrigger>
            <TabsTrigger value="price-alert">Alerts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="h-[400px]">
        {Object.entries(groupedByDate).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedByDate).map(([date, dateNotifications]) => (
              <div key={date} className="mb-4">
                <div className="text-xs text-muted-foreground font-medium px-2 py-1">
                  {date}
                </div>
                {dateNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, removeNotification } = useNotifications()
  
  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.action) {
      notification.action.onClick()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "p-3 rounded-lg mb-2 cursor-pointer transition-colors",
        notification.read ? "bg-muted/50" : "bg-muted hover:bg-muted/80"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <NotificationIcon type={notification.type} data={notification.data} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                !notification.read && "font-medium"
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notification.message}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  removeNotification(notification.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function NotificationIcon({ type, data }: { type: NotificationType; data?: any }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    trade: <DollarSign className="h-5 w-5 text-purple-500" />,
    'price-alert': data?.direction === 'up' 
      ? <TrendingUp className="h-5 w-5 text-green-500" />
      : <TrendingDown className="h-5 w-5 text-red-500" />
  }
  
  return icons[type]
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

// Helper components for dropdown menu (imported from shadcn/ui)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Trading notification helpers
export function useTradingNotifications() {
  const { addNotification } = useNotifications()
  
  const notifyOrderFilled = useCallback((order: {
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    price: number
  }) => {
    addNotification({
      type: 'trade',
      title: 'Order Filled',
      message: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol} @ $${order.price}`,
      data: order
    })
  }, [addNotification])
  
  const notifyPriceAlert = useCallback((alert: {
    symbol: string
    price: number
    condition: 'above' | 'below'
    targetPrice: number
  }) => {
    addNotification({
      type: 'price-alert',
      title: `Price Alert: ${alert.symbol}`,
      message: `${alert.symbol} is ${alert.condition} $${alert.targetPrice} at $${alert.price}`,
      data: { ...alert, direction: alert.condition === 'above' ? 'up' : 'down' },
      action: {
        label: 'View Chart',
        onClick: () => console.log('View chart for', alert.symbol)
      }
    })
  }, [addNotification])
  
  const notifyStrategyAlert = useCallback((strategy: {
    name: string
    message: string
    severity: 'info' | 'warning' | 'error'
  }) => {
    addNotification({
      type: strategy.severity,
      title: `Strategy: ${strategy.name}`,
      message: strategy.message,
      persistent: strategy.severity === 'error'
    })
  }, [addNotification])
  
  return {
    notifyOrderFilled,
    notifyPriceAlert,
    notifyStrategyAlert
  }
}