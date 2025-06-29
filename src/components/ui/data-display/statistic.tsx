"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Statistic Component like Ant Design

export interface StatisticProps {
  title?: React.ReactNode
  value?: string | number | React.ReactNode
  valueStyle?: React.CSSProperties
  precision?: number
  decimalSeparator?: string
  groupSeparator?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  formatter?: (value?: string | number) => React.ReactNode
  parser?: (value?: string) => string | number
  loading?: boolean
  valueRender?: (node: React.ReactNode, props: StatisticProps) => React.ReactNode
  className?: string
}

export interface CountdownProps extends Omit<StatisticProps, 'value'> {
  value: number | Date
  format?: string
  onFinish?: () => void
  onChange?: (value: number) => void
}

const Statistic: React.FC<StatisticProps> = ({
  title,
  value,
  valueStyle,
  precision,
  decimalSeparator = '.',
  groupSeparator = ',',
  prefix,
  suffix,
  formatter,
  parser,
  loading = false,
  valueRender,
  className
}) => {
  const formatNumber = (num: string | number): string => {
    if (typeof num !== 'number') return String(num)
    
    let formattedNum = num.toFixed(precision)
    
    if (decimalSeparator !== '.') {
      formattedNum = formattedNum.replace('.', decimalSeparator)
    }
    
    if (groupSeparator) {
      const parts = formattedNum.split(decimalSeparator)
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
      formattedNum = parts.join(decimalSeparator)
    }
    
    return formattedNum
  }

  const renderValue = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      )
    }

    let displayValue: React.ReactNode

    if (formatter && (typeof value === 'string' || typeof value === 'number')) {
      displayValue = formatter(value)
    } else if (typeof value === 'number') {
      displayValue = formatNumber(value)
    } else {
      displayValue = value
    }

    const valueNode = (
      <span className="text-2xl font-bold text-gray-900" style={valueStyle}>
        {prefix}
        {displayValue}
        {suffix}
      </span>
    )

    return valueRender ? valueRender(valueNode, { title, value, valueStyle, precision, decimalSeparator, groupSeparator, prefix, suffix, formatter, parser, loading, valueRender, className }) : valueNode
  }

  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <div className="text-sm text-gray-600 font-medium">{title}</div>
      )}
      <div className="flex items-baseline">
        {renderValue()}
      </div>
    </div>
  )
}

const Countdown: React.FC<CountdownProps> = ({
  value,
  format = 'HH:mm:ss',
  onFinish,
  onChange,
  title,
  valueStyle,
  prefix,
  suffix,
  loading = false,
  className,
  ...props
}) => {
  const [timeLeft, setTimeLeft] = React.useState<number>(0)

  React.useEffect(() => {
    const targetTime = typeof value === 'number' ? value : value.getTime()
    
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, targetTime - now)
      
      setTimeLeft(remaining)
      onChange?.(remaining)
      
      if (remaining === 0) {
        onFinish?.()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [value, onFinish, onChange])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / (24 * 3600))
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    // Simple format parsing
    let formatted = format
    formatted = formatted.replace('DD', days.toString().padStart(2, '0'))
    formatted = formatted.replace('HH', hours.toString().padStart(2, '0'))
    formatted = formatted.replace('mm', minutes.toString().padStart(2, '0'))
    formatted = formatted.replace('ss', seconds.toString().padStart(2, '0'))
    formatted = formatted.replace('D', days.toString())
    formatted = formatted.replace('H', hours.toString())
    formatted = formatted.replace('m', minutes.toString())
    formatted = formatted.replace('s', seconds.toString())

    return formatted
  }

  return (
    <Statistic
      {...props}
      title={title}
      value={formatTime(timeLeft)}
      valueStyle={valueStyle}
      prefix={prefix}
      suffix={suffix}
      loading={loading}
      className={className}
    />
  )
}

// Trend Statistic Component
export interface TrendStatisticProps extends StatisticProps {
  trend?: 'up' | 'down'
  trendValue?: string | number
  trendColor?: {
    up?: string
    down?: string
  }
}

const TrendStatistic: React.FC<TrendStatisticProps> = ({
  trend,
  trendValue,
  trendColor = { up: 'text-green-600', down: 'text-red-600' },
  suffix,
  ...props
}) => {
  const trendIcon = trend === 'up' ? <TrendingUp className="h-4 w-4" /> : trend === 'down' ? <TrendingDown className="h-4 w-4" /> : null
  const trendClass = trend === 'up' ? trendColor.up : trend === 'down' ? trendColor.down : ''

  const trendSuffix = (
    <div className="flex items-center gap-1">
      {suffix}
      {trendValue && (
        <span className={cn("text-sm flex items-center gap-1", trendClass)}>
          {trendIcon}
          {trendValue}
        </span>
      )}
    </div>
  )

  return <Statistic {...props} suffix={trendSuffix} />
}

export { Statistic, Countdown, TrendStatistic }