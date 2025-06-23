'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

// Animation presets for trading components
export const TRADING_ANIMATIONS = {
  // Price movement animations
  priceUp: {
    initial: { scale: 1, color: '#22c55e' },
    animate: { 
      scale: [1, 1.1, 1], 
      color: ['#22c55e', '#16a34a', '#22c55e'],
      transition: { duration: 0.5, times: [0, 0.5, 1] }
    }
  },
  priceDown: {
    initial: { scale: 1, color: '#ef4444' },
    animate: { 
      scale: [1, 0.9, 1], 
      color: ['#ef4444', '#dc2626', '#ef4444'],
      transition: { duration: 0.5, times: [0, 0.5, 1] }
    }
  },
  
  // Order animations
  orderFilled: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 }
  },
  
  // Portfolio animations
  portfolioGain: {
    animate: {
      backgroundColor: ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0)'],
      transition: { duration: 2 }
    }
  },
  portfolioLoss: {
    animate: {
      backgroundColor: ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)'],
      transition: { duration: 2 }
    }
  },

  // Card animations
  cardHover: {
    whileHover: { 
      scale: 1.02, 
      y: -2,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      transition: { duration: 0.2 }
    }
  },

  // Stagger animations for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
}

// Animated Price Component
export function AnimatedPrice({
  value,
  previousValue,
  className,
  showArrow = true,
  currency = '$',
  decimals = 2
}: {
  value: number
  previousValue?: number
  className?: string
  showArrow?: boolean
  currency?: string
  decimals?: number
}) {
  const [isAnimating, setIsAnimating] = useState(false)
  const controls = useAnimation()
  
  const direction = previousValue ? (value > previousValue ? 'up' : value < previousValue ? 'down' : 'none') : 'none'
  
  useEffect(() => {
    if (previousValue && value !== previousValue) {
      setIsAnimating(true)
      const animation = direction === 'up' ? TRADING_ANIMATIONS.priceUp : TRADING_ANIMATIONS.priceDown
      controls.start(animation.animate)
      
      setTimeout(() => setIsAnimating(false), 500)
    }
  }, [value, previousValue, direction, controls])

  return (
    <motion.div
      animate={controls}
      className={cn(
        "flex items-center gap-1 font-mono font-semibold",
        direction === 'up' && "text-green-600",
        direction === 'down' && "text-red-600",
        direction === 'none' && "text-foreground",
        className
      )}
    >
      <span>
        {currency}{value.toFixed(decimals)}
      </span>
      {showArrow && direction !== 'none' && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          {direction === 'up' ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

// Animated Portfolio Card
export function AnimatedPortfolioCard({
  title,
  value,
  change,
  changePercent,
  children,
  className
}: {
  title: string
  value: number
  change: number
  changePercent: number
  children?: React.ReactNode
  className?: string
}) {
  const isPositive = change >= 0
  const controls = useAnimation()
  
  useEffect(() => {
    if (change !== 0) {
      const animation = isPositive ? TRADING_ANIMATIONS.portfolioGain : TRADING_ANIMATIONS.portfolioLoss
      controls.start(animation.animate)
    }
  }, [change, isPositive, controls])

  return (
    <motion.div
      animate={controls}
      {...TRADING_ANIMATIONS.cardHover}
      className={cn(
        "p-6 rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex items-center justify-between">
          <AnimatedPrice value={value} showArrow={false} />
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? '+' : ''}{change.toFixed(2)}</span>
            <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

// Animated Order Book Entry
export function AnimatedOrderEntry({
  order,
  type = 'bid'
}: {
  order: {
    id: string
    price: number
    quantity: number
    total: number
  }
  type?: 'bid' | 'ask'
}) {
  return (
    <motion.div
      layout
      {...TRADING_ANIMATIONS.orderFilled}
      className={cn(
        "grid grid-cols-3 gap-2 p-2 text-sm font-mono",
        type === 'bid' ? "text-green-600" : "text-red-600"
      )}
    >
      <span>{order.price.toFixed(2)}</span>
      <span>{order.quantity.toFixed(4)}</span>
      <span>{order.total.toFixed(2)}</span>
    </motion.div>
  )
}

// Staggered List Animation
export function StaggeredList({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      {...TRADING_ANIMATIONS.staggerContainer}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          {...TRADING_ANIMATIONS.staggerItem}
          transition={{ delay: index * 0.1 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Pulsing Activity Indicator
export function ActivityIndicator({
  active = false,
  size = 'md',
  color = 'green'
}: {
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'red' | 'blue' | 'yellow'
}) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }
  
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className="relative">
      <motion.div
        className={cn(
          "rounded-full",
          sizeClasses[size],
          colorClasses[color]
        )}
        animate={active ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: active ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      {active && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            colorClasses[color],
            "opacity-30"
          )}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

// Number Counter Animation
export function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className
}: {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let startValue = displayValue
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (value - startValue) * easeOutQuart
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration, displayValue])
  
  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  )
}

// Progress Ring Animation
export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'blue',
  backgroundColor = 'gray',
  children
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        <circle
          stroke={backgroundColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

// Trading Status Indicator
export function TradingStatusIndicator({
  status,
  label
}: {
  status: 'online' | 'offline' | 'trading' | 'paused' | 'error'
  label?: string
}) {
  const statusConfig = {
    online: { color: 'green', pulse: false },
    offline: { color: 'gray', pulse: false },
    trading: { color: 'blue', pulse: true },
    paused: { color: 'yellow', pulse: false },
    error: { color: 'red', pulse: true }
  }
  
  const config = statusConfig[status]
  
  return (
    <div className="flex items-center gap-2">
      <ActivityIndicator
        active={config.pulse}
        color={config.color as any}
        size="sm"
      />
      {label && (
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
}