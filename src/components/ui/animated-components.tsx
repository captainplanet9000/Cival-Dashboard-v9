'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

// Animated Price Display Component
interface AnimatedPriceProps {
  value: number | undefined
  previousValue?: number
  symbol?: string
  currency?: string
  precision?: number
  className?: string
  showTrend?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AnimatedPrice({ 
  value, 
  previousValue, 
  symbol = '',
  currency = '$',
  precision = 2,
  className = '',
  showTrend = true,
  size = 'md'
}: AnimatedPriceProps) {
  // Handle undefined values gracefully
  const safeValue = value ?? 0
  const [displayValue, setDisplayValue] = useState(safeValue)
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null)
  const [showChange, setShowChange] = useState(false)
  
  // Return loading state if value is undefined
  if (value === undefined) {
    return (
      <div className={`text-gray-400 ${className}`}>
        Loading...
      </div>
    )
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  }

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== safeValue && value !== undefined) {
      setIsIncreasing(safeValue > previousValue)
      setShowChange(true)
      
      // Animate number change
      const startValue = displayValue
      const endValue = safeValue
      const duration = 1000
      const startTime = Date.now()

      const animateValue = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (endValue - startValue) * easeOutQuart
        
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animateValue)
        } else {
          setDisplayValue(endValue)
          setTimeout(() => setShowChange(false), 2000)
        }
      }
      
      requestAnimationFrame(animateValue)
    }
  }, [value, previousValue, displayValue])

  const changePercentage = previousValue && previousValue !== 0 
    ? ((safeValue - previousValue) / previousValue) * 100 
    : 0

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <motion.div 
        className={`font-bold ${sizeClasses[size]} ${
          showChange 
            ? isIncreasing 
              ? 'text-green-600' 
              : 'text-red-600'
            : 'text-foreground'
        }`}
        animate={{
          scale: showChange ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {currency}{displayValue.toFixed(precision)} {symbol}
      </motion.div>
      
      {showTrend && previousValue !== undefined && showChange && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 10 }}
          className={`flex items-center gap-1 text-sm ${
            isIncreasing ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isIncreasing ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>{Math.abs(changePercentage).toFixed(1)}%</span>
        </motion.div>
      )}
    </div>
  )
}

// Animated Number Counter
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  precision?: number
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className = '',
  prefix = '',
  suffix = '',
  precision = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startValue = displayValue
    const endValue = value
    const startTime = Date.now()

    const animateValue = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOutCubic
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animateValue)
      } else {
        setDisplayValue(endValue)
      }
    }
    
    requestAnimationFrame(animateValue)
  }, [value, duration, displayValue])

  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(precision)}{suffix}
    </span>
  )
}

// Animated Progress Bar
interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  size?: 'sm' | 'md' | 'lg'
}

export function AnimatedProgress({ 
  value, 
  max = 100, 
  className = '',
  showLabel = true,
  color = 'blue',
  size = 'md'
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{value.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">{max}</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// Animated Card with Hover Effects
interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export function AnimatedCard({ 
  children, 
  className = '', 
  hover = true,
  delay = 0
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { 
        scale: 1.02, 
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)" 
      } : undefined}
      className={`bg-white rounded-lg border shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Animated Status Badge
interface AnimatedStatusProps {
  status: 'active' | 'inactive' | 'error' | 'warning' | 'success'
  children: React.ReactNode
  pulse?: boolean
  className?: string
}

export function AnimatedStatus({ 
  status, 
  children, 
  pulse = false,
  className = ''
}: AnimatedStatusProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200'
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${statusColors[status]} ${className}`}
      animate={pulse ? { scale: [1, 1.05, 1] } : undefined}
      transition={pulse ? { duration: 2, repeat: Infinity } : undefined}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${
          status === 'active' || status === 'success' ? 'bg-green-500' :
          status === 'error' ? 'bg-red-500' :
          status === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
        }`}
        animate={status === 'active' ? { opacity: [1, 0.5, 1] } : undefined}
        transition={status === 'active' ? { duration: 1.5, repeat: Infinity } : undefined}
      />
      {children}
    </motion.div>
  )
}

// Animated Trading Signal
interface TradingSignalProps {
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  className?: string
}

export function AnimatedTradingSignal({ 
  signal, 
  confidence, 
  className = '' 
}: TradingSignalProps) {
  const signalColors = {
    BUY: 'text-green-600 bg-green-50 border-green-200',
    SELL: 'text-red-600 bg-red-50 border-red-200',
    HOLD: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border-2 ${signalColors[signal]} ${className}`}
    >
      <div className="text-lg font-bold">{signal}</div>
      <div className="text-sm">
        <AnimatedProgress 
          value={confidence} 
          max={100} 
          showLabel={false}
          color={signal === 'BUY' ? 'green' : signal === 'SELL' ? 'red' : 'yellow'}
          size="sm"
        />
        <div className="text-xs mt-1">{confidence}% confidence</div>
      </div>
    </motion.div>
  )
}

// Animated Market Data Ticker
interface MarketTickerProps {
  data: Array<{
    symbol: string
    price: number
    change: number
    changePercent: number
  }>
  className?: string
}

export function AnimatedMarketTicker({ data, className = '' }: MarketTickerProps) {
  return (
    <div className={`overflow-hidden bg-gray-900 text-white py-2 ${className}`}>
      <motion.div
        className="flex gap-8"
        animate={{ x: [-1000, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {data.concat(data).map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold">{item.symbol}</span>
            <AnimatedPrice 
              value={item.price}
              previousValue={item.price - item.change}
              currency="$"
              precision={2}
              size="sm"
              className="text-white"
            />
            <span className={`text-sm ${item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// Animated Loading Skeleton
interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function AnimatedLoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-gray-200 rounded"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

// All components are already exported with their function definitions above