'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2, AlertCircle, Info, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'trade'
  title: string
  description: string
  timestamp: Date
  action?: {
    label: string
    onClick: () => void
  }
}

interface AnimatedNotificationsProps {
  className?: string
}

export function AnimatedNotifications({ className }: AnimatedNotificationsProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Order Executed',
      description: 'Buy order for 0.5 BTC at $45,123 has been filled',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      type: 'trade',
      title: 'Profit Target Reached',
      description: 'ETH/USD position closed with +2.46% profit ($126.50)',
      timestamp: new Date(Date.now() - 180000),
      action: {
        label: 'View Trade',
        onClick: () => console.log('View trade')
      }
    },
    {
      id: '3',
      type: 'warning',
      title: 'Risk Alert',
      description: 'Portfolio exposure to crypto assets exceeds 80% threshold',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '4',
      type: 'info',
      title: 'Market Update',
      description: 'Federal Reserve meeting scheduled for tomorrow at 2:00 PM EST',
      timestamp: new Date(Date.now() - 600000),
    },
  ])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'trade':
        return <TrendingUp className="h-5 w-5 text-purple-500" />
    }
  }

  const getAlertVariant = (type: Notification['type']): 'default' | 'destructive' => {
    return type === 'error' ? 'destructive' : 'default'
  }

  const formatTimestamp = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Notifications</h3>
        <Button variant="ghost" size="sm" onClick={() => setNotifications([])}>
          Clear All
        </Button>
      </div>
      
      <AnimatePresence>
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Alert
                variant={getAlertVariant(notification.type)}
                className="relative pr-10"
              >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1">
                <AlertTitle className="mb-1">{notification.title}</AlertTitle>
                <AlertDescription className="text-sm">
                  {notification.description}
                </AlertDescription>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                  {notification.action && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={notification.action.onClick}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
      
      {notifications.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No new notifications</p>
        </div>
      )}
    </div>
  )
}

export default AnimatedNotifications