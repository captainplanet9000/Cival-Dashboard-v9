'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { AnimatedNumber } from 'motion-primitives'

interface AnimatedMetricsProps {
  className?: string
}

export function AnimatedMetrics({ className }: AnimatedMetricsProps) {
  const [portfolioValue, setPortfolioValue] = React.useState(125000)
  const [dailyChange, setDailyChange] = React.useState(2.45)
  const [volume, setVolume] = React.useState(1250000)
  const [activePositions, setActivePositions] = React.useState(12)

  // Simulate live updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioValue(prev => prev + (Math.random() - 0.5) * 1000)
      setDailyChange(prev => prev + (Math.random() - 0.5) * 0.1)
      setVolume(prev => prev + Math.floor((Math.random() - 0.5) * 10000))
      setActivePositions(prev => Math.max(0, prev + Math.floor((Math.random() - 0.5) * 2)))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const metrics = [
    {
      title: 'Portfolio Value',
      icon: DollarSign,
      value: portfolioValue,
      format: (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-green-500',
    },
    {
      title: 'Daily Change',
      icon: dailyChange >= 0 ? TrendingUp : TrendingDown,
      value: dailyChange,
      format: (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`,
      color: dailyChange >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      title: '24h Volume',
      icon: Activity,
      value: volume,
      format: (value: number) => `$${(value / 1000000).toFixed(2)}M`,
      color: 'text-blue-500',
    },
    {
      title: 'Active Positions',
      icon: Activity,
      value: activePositions,
      format: (value: number) => value.toString(),
      color: 'text-purple-500',
    },
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedNumber
                  value={metric.value}
                  format={metric.format}
                  duration={1000}
                  className={metric.color}
                />
              </div>
              {metric.title === 'Daily Change' && (
                <Badge 
                  variant={dailyChange >= 0 ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {dailyChange >= 0 ? 'Profit' : 'Loss'}
                </Badge>
              )}
            </CardContent>
            {/* Animated background gradient */}
            <div 
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${50 + Math.sin(Date.now() / 1000) * 20}% ${50 + Math.cos(Date.now() / 1000) * 20}%, ${metric.color.replace('text-', 'bg-')} 0%, transparent 70%)`,
              }}
            />
          </Card>
        )
      })}
    </div>
  )
}

export default AnimatedMetrics