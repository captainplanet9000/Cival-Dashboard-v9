'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LineChart, BarChart3, CandlestickChart, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'

interface AnimatedChartProps {
  className?: string
}

export function AnimatedChart({ className }: AnimatedChartProps) {
  const [timeframe, setTimeframe] = React.useState('1h')
  const [chartType, setChartType] = React.useState<'line' | 'area' | 'candle'>('area')
  const [currentPrice, setCurrentPrice] = React.useState(45234.56)
  const [priceChange, setPriceChange] = React.useState(1247.32)
  const [percentChange, setPercentChange] = React.useState(2.84)

  // Generate mock chart data
  const generateChartData = () => {
    const points = 50
    const basePrice = 44000
    const volatility = 500
    
    return Array.from({ length: points }, (_, i) => {
      const time = new Date(Date.now() - (points - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const value = basePrice + Math.sin(i / 5) * volatility + Math.random() * 200
      return { time, value }
    })
  }

  const [chartData, setChartData] = React.useState(generateChartData())

  // Simulate live price updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newPrice = currentPrice + (Math.random() - 0.5) * 100
      const newChange = newPrice - 44000
      const newPercent = (newChange / 44000) * 100
      
      setCurrentPrice(newPrice)
      setPriceChange(newChange)
      setPercentChange(newPercent)
      
      // Update chart data
      setChartData(prev => {
        const newData = [...prev.slice(1)]
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: newPrice
        })
        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [currentPrice])

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>BTC/USD</CardTitle>
            <CardDescription>Bitcoin to US Dollar</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="4h">4h</SelectItem>
                <SelectItem value="1d">1d</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-md">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType('line')}
              >
                <LineChart className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType('area')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'candle' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType('candle')}
              >
                <CandlestickChart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price Display */}
          <div className="flex items-baseline gap-4">
            <motion.div 
              className="text-3xl font-bold"
              key={currentPrice}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatCurrency(currentPrice)}
            </motion.div>
            <motion.div 
              className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
              key={priceChange}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {priceChange >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span className="font-semibold">
                ${Math.abs(priceChange).toFixed(2)}
              </span>
              <span className="text-sm">
                ({priceChange >= 0 ? '+' : '-'}{Math.abs(percentChange).toFixed(2)}%)
              </span>
            </motion.div>
          </div>

          {/* Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              ) : (
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </RechartsLineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">24h High</p>
              <p className="text-sm font-semibold">$45,892</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Low</p>
              <p className="text-sm font-semibold">$43,567</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Volume</p>
              <p className="text-sm font-semibold">$1.23B</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold">$884.5B</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AnimatedChart