'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Download,
  Maximize2,
  RefreshCw
} from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface PriceData {
  timestamp: Date
  price: number
  volume?: number
  high?: number
  low?: number
  open?: number
  close?: number
}

export interface TradingChartProps {
  data: PriceData[]
  symbol: string
  interval?: string
  height?: number
  showVolume?: boolean
  showIndicators?: boolean
  indicators?: string[]
  className?: string
  onIntervalChange?: (interval: string) => void
  onRefresh?: () => void
  loading?: boolean
}

// Premium chart themes
const CHART_THEMES = {
  light: {
    background: '#ffffff',
    grid: '#f1f5f9',
    text: '#1e293b',
    bullish: '#22c55e',
    bearish: '#ef4444',
    volume: '#94a3b8'
  },
  dark: {
    background: '#0f172a',
    grid: '#334155',
    text: '#f1f5f9',
    bullish: '#22c55e',
    bearish: '#ef4444',
    volume: '#64748b'
  }
}

// Trading intervals
const TRADING_INTERVALS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
]

export function PremiumTradingChart({
  data,
  symbol,
  interval = '1h',
  height = 400,
  showVolume = true,
  showIndicators = false,
  indicators = [],
  className,
  onIntervalChange,
  onRefresh,
  loading = false
}: TradingChartProps) {
  const [chartType, setChartType] = useState<'line' | 'candlestick' | 'bar'>('line')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Calculate price change
  const priceChange = useMemo(() => {
    if (data.length < 2) return { change: 0, percentage: 0 }
    
    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    const change = latest.price - previous.price
    const percentage = (change / previous.price) * 100
    
    return { change, percentage }
  }, [data])

  // Prepare chart data
  const chartData: ChartData<'line'> = useMemo(() => {
    const currentTheme = CHART_THEMES[theme]
    
    return {
      labels: data.map(item => 
        item.timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      ),
      datasets: [
        {
          label: `${symbol} Price`,
          data: data.map(item => item.price),
          borderColor: priceChange.change >= 0 ? currentTheme.bullish : currentTheme.bearish,
          backgroundColor: priceChange.change >= 0 
            ? `${currentTheme.bullish}20` 
            : `${currentTheme.bearish}20`,
          borderWidth: 2,
          fill: chartType === 'line',
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        ...(showVolume ? [{
          label: 'Volume',
          data: data.map(item => item.volume || 0),
          type: 'bar' as const,
          backgroundColor: currentTheme.volume,
          borderColor: currentTheme.volume,
          borderWidth: 1,
          yAxisID: 'y1',
        }] : [])
      ]
    }
  }, [data, symbol, theme, chartType, showVolume, priceChange])

  // Chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    const currentTheme = CHART_THEMES[theme]
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: currentTheme.background,
          titleColor: currentTheme.text,
          bodyColor: currentTheme.text,
          borderColor: currentTheme.grid,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              if (context.dataset.label === 'Volume') {
                return `Volume: ${context.parsed.y.toLocaleString()}`
              }
              return `Price: $${context.parsed.y.toFixed(2)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: currentTheme.grid,
          },
          ticks: {
            color: currentTheme.text,
          }
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          grid: {
            color: currentTheme.grid,
          },
          ticks: {
            color: currentTheme.text,
            callback: function(value) {
              return '$' + Number(value).toFixed(2)
            }
          }
        },
        ...(showVolume ? {
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: currentTheme.text,
            }
          }
        } : {})
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 4,
        }
      }
    }
  }, [theme, showVolume])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono">
                ${data[data.length - 1]?.price.toFixed(2) || '0.00'}
              </span>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                priceChange.change >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {priceChange.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {priceChange.change >= 0 ? '+' : ''}
                  {priceChange.change.toFixed(2)} 
                  ({priceChange.percentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={interval} onValueChange={onIntervalChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRADING_INTERVALS.map(int => (
                  <SelectItem key={int.value} value={int.value}>
                    {int.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Chart Type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setChartType('line')}>
                  <LineChart className="h-4 w-4 mr-2" />
                  Line Chart
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('bar')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Bar Chart
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  Light Theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  Dark Theme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Line data={chartData} options={chartOptions} />
        </div>
        
        {showIndicators && indicators.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {indicators.map(indicator => (
              <Badge key={indicator} variant="outline">
                {indicator}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Portfolio Performance Chart
export function PortfolioPerformanceChart({
  data,
  timeframe = '7d',
  className
}: {
  data: Array<{ date: Date; value: number; benchmark?: number }>
  timeframe?: string
  className?: string
}) {
  const chartData: ChartData<'line'> = {
    labels: data.map(item => item.date.toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio',
        data: data.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
      ...(data[0]?.benchmark ? [{
        label: 'Benchmark',
        data: data.map(item => item.benchmark || 0),
        borderColor: '#6b7280',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
      }] : [])
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + Number(value).toLocaleString()
          }
        }
      }
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

// Asset Allocation Chart
export function AssetAllocationChart({
  data,
  className
}: {
  data: Array<{ asset: string; value: number; color: string }>
  className?: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  const chartData: ChartData<'doughnut'> = {
    labels: data.map(item => item.asset),
    datasets: [{
      data: data.map(item => item.value),
      backgroundColor: data.map(item => item.color),
      borderWidth: 0,
    }]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.asset}</span>
              </div>
              <div className="text-sm font-medium">
                ${item.value.toLocaleString()} 
                <span className="text-muted-foreground ml-1">
                  ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// P&L Chart
export function PnLChart({
  data,
  timeframe = 'daily',
  className
}: {
  data: Array<{ date: Date; realized: number; unrealized: number }>
  timeframe?: string
  className?: string
}) {
  const chartData: ChartData<'bar'> = {
    labels: data.map(item => item.date.toLocaleDateString()),
    datasets: [
      {
        label: 'Realized P&L',
        data: data.map(item => item.realized),
        backgroundColor: data.map(item => item.realized >= 0 ? '#22c55e' : '#ef4444'),
        borderColor: data.map(item => item.realized >= 0 ? '#16a34a' : '#dc2626'),
        borderWidth: 1,
      },
      {
        label: 'Unrealized P&L',
        data: data.map(item => item.unrealized),
        backgroundColor: data.map(item => item.unrealized >= 0 ? '#22c55e80' : '#ef444480'),
        borderColor: data.map(item => item.unrealized >= 0 ? '#16a34a' : '#dc2626'),
        borderWidth: 1,
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          callback: function(value) {
            return '$' + Number(value).toLocaleString()
          }
        }
      }
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}