'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Line, Text, Circle, Group } from 'react-konva'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, TrendingDown, BarChart3, Crosshair, 
  ZoomIn, ZoomOut, RotateCcw, Activity 
} from 'lucide-react'
import { motion } from 'framer-motion'

interface PriceData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface InteractiveTradingChartProps {
  symbol?: string
  data?: PriceData[]
  width?: number
  height?: number
  className?: string
}

// Generate mock candlestick data
const generateMockData = (symbol: string, periods: number = 100): PriceData[] => {
  const data: PriceData[] = []
  let basePrice = 50000 // Starting price
  
  if (symbol.includes('ETH')) basePrice = 3000
  if (symbol.includes('SOL')) basePrice = 100
  if (symbol.includes('ADA')) basePrice = 0.5
  
  const now = Date.now()
  
  for (let i = 0; i < periods; i++) {
    const timestamp = now - (periods - i) * 60000 // 1 minute intervals
    const volatility = 0.02 // 2% volatility
    
    // Generate realistic price movement
    const change = (Math.random() - 0.5) * volatility * basePrice
    const open = i === 0 ? basePrice : data[i - 1].close
    const close = open + change
    
    // High and low with some randomness
    const high = Math.max(open, close) + Math.random() * 0.01 * basePrice
    const low = Math.min(open, close) - Math.random() * 0.01 * basePrice
    
    // Volume with some randomness
    const volume = Math.random() * 1000000 + 500000
    
    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    })
    
    basePrice = close // Update base price for next iteration
  }
  
  return data
}

export function InteractiveTradingChart({ 
  symbol = 'BTC/USD', 
  data, 
  width = 800, 
  height = 400,
  className 
}: InteractiveTradingChartProps) {
  const [chartData, setChartData] = useState<PriceData[]>([])
  const [timeframe, setTimeframe] = useState('1H')
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false })
  const [hoveredCandle, setHoveredCandle] = useState<PriceData | null>(null)
  const stageRef = useRef<any>(null)

  // Initialize or update chart data
  useEffect(() => {
    const newData = data || generateMockData(symbol, 100)
    setChartData(newData)
  }, [symbol, data])

  // Calculate chart dimensions and scaling
  const padding = { left: 60, right: 60, top: 40, bottom: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const priceRange = chartData.length > 0 ? {
    min: Math.min(...chartData.map(d => d.low)),
    max: Math.max(...chartData.map(d => d.high))
  } : { min: 0, max: 100 }

  const priceScale = chartHeight / (priceRange.max - priceRange.min)
  const timeScale = chartWidth / Math.max(chartData.length - 1, 1)

  // Convert price to Y coordinate
  const priceToY = useCallback((price: number) => {
    return padding.top + (priceRange.max - price) * priceScale * zoom + pan.y
  }, [priceRange.max, priceScale, zoom, pan.y, padding.top])

  // Convert index to X coordinate
  const indexToX = useCallback((index: number) => {
    return padding.left + index * timeScale * zoom + pan.x
  }, [padding.left, timeScale, zoom, pan.x])

  // Handle mouse move for crosshair
  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    
    setCrosshair({
      x: pointer.x,
      y: pointer.y,
      visible: pointer.x > padding.left && pointer.x < width - padding.right &&
               pointer.y > padding.top && pointer.y < height - padding.bottom
    })

    // Find hovered candle
    const dataIndex = Math.round((pointer.x - padding.left - pan.x) / (timeScale * zoom))
    if (dataIndex >= 0 && dataIndex < chartData.length) {
      setHoveredCandle(chartData[dataIndex])
    } else {
      setHoveredCandle(null)
    }
  }

  const handleMouseLeave = () => {
    setCrosshair(prev => ({ ...prev, visible: false }))
    setHoveredCandle(null)
  }

  // Render candlestick
  const renderCandlestick = (data: PriceData, index: number) => {
    const x = indexToX(index)
    const openY = priceToY(data.open)
    const closeY = priceToY(data.close)
    const highY = priceToY(data.high)
    const lowY = priceToY(data.low)
    
    const isPositive = data.close > data.open
    const color = isPositive ? '#10b981' : '#ef4444' // green : red
    const candleWidth = Math.max(timeScale * zoom * 0.6, 1)

    if (x < padding.left - candleWidth || x > width - padding.right + candleWidth) {
      return null // Skip rendering if outside visible area
    }

    return (
      <Group key={index}>
        {/* Wick */}
        <Line
          points={[x, highY, x, lowY]}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <Rect
          x={x - candleWidth / 2}
          y={Math.min(openY, closeY)}
          width={candleWidth}
          height={Math.abs(closeY - openY) || 1}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </Group>
    )
  }

  // Render line chart
  const renderLineChart = () => {
    const points: number[] = []
    chartData.forEach((data, index) => {
      const x = indexToX(index)
      if (x >= padding.left - 50 && x <= width - padding.right + 50) {
        points.push(x, priceToY(data.close))
      }
    })

    if (points.length < 4) return null

    return (
      <Line
        points={points}
        stroke="#3b82f6"
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
    )
  }

  // Render area chart
  const renderAreaChart = () => {
    const points: number[] = []
    chartData.forEach((data, index) => {
      const x = indexToX(index)
      if (x >= padding.left - 50 && x <= width - padding.right + 50) {
        points.push(x, priceToY(data.close))
      }
    })

    if (points.length < 4) return null

    // Add bottom points to close the area
    const areaPoints = [
      ...points,
      points[points.length - 2], height - padding.bottom,
      points[0], height - padding.bottom
    ]

    return (
      <Line
        points={areaPoints}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="#3b82f6"
        strokeWidth={2}
        closed={true}
        lineCap="round"
        lineJoin="round"
      />
    )
  }

  // Render grid lines
  const renderGrid = () => {
    const gridLines = []
    const priceStep = (priceRange.max - priceRange.min) / 5
    const timeStep = chartData.length / 5

    // Horizontal grid lines (price levels)
    for (let i = 0; i <= 5; i++) {
      const price = priceRange.min + i * priceStep
      const y = priceToY(price)
      
      if (y >= padding.top && y <= height - padding.bottom) {
        gridLines.push(
          <Line
            key={`h-grid-${i}`}
            points={[padding.left, y, width - padding.right, y]}
            stroke="#e5e7eb"
            strokeWidth={1}
            dash={[5, 5]}
          />
        )
      }
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 5; i++) {
      const index = i * timeStep
      const x = indexToX(index)
      
      if (x >= padding.left && x <= width - padding.right) {
        gridLines.push(
          <Line
            key={`v-grid-${i}`}
            points={[x, padding.top, x, height - padding.bottom]}
            stroke="#e5e7eb"
            strokeWidth={1}
            dash={[5, 5]}
          />
        )
      }
    }

    return gridLines
  }

  // Render price labels
  const renderPriceLabels = () => {
    const labels = []
    const priceStep = (priceRange.max - priceRange.min) / 5

    for (let i = 0; i <= 5; i++) {
      const price = priceRange.min + i * priceStep
      const y = priceToY(price)
      
      if (y >= padding.top && y <= height - padding.bottom) {
        labels.push(
          <Text
            key={`price-label-${i}`}
            x={width - padding.right + 5}
            y={y - 8}
            text={price.toFixed(2)}
            fontSize={12}
            fill="#6b7280"
            align="left"
          />
        )
      }
    }

    return labels
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Calculate current price change
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : currentPrice
  const priceChange = currentPrice - previousPrice
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Interactive Trading Chart - {symbol}
                <Badge variant="secondary" className="text-xs">
                  Konva.js Powered
                </Badge>
              </CardTitle>
              <CardDescription>
                High-performance interactive chart with real-time updates and advanced controls
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${currentPrice.toFixed(2)}
                </div>
                <div className={`text-sm flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {/* Chart Controls */}
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="5M">5M</SelectItem>
                  <SelectItem value="15M">15M</SelectItem>
                  <SelectItem value="1H">1H</SelectItem>
                  <SelectItem value="4H">4H</SelectItem>
                  <SelectItem value="1D">1D</SelectItem>
                </SelectContent>
              </Select>

              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="text-xs ml-2">
                Zoom: {zoom.toFixed(1)}x
              </Badge>
            </div>
          </div>

          {/* Hovered Data Display */}
          {hoveredCandle && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border rounded-lg p-3 mb-4"
            >
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time: </span>
                  <span className="font-medium">
                    {new Date(hoveredCandle.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">O: </span>
                  <span className="font-medium">${hoveredCandle.open.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">H: </span>
                  <span className="font-medium text-green-600">${hoveredCandle.high.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">L: </span>
                  <span className="font-medium text-red-600">${hoveredCandle.low.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">C: </span>
                  <span className="font-medium">${hoveredCandle.close.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Interactive Chart */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <Stage
              ref={stageRef}
              width={width}
              height={height}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              draggable={true}
              onDragEnd={(e) => {
                setPan({
                  x: e.target.x(),
                  y: e.target.y()
                })
                e.target.position({ x: 0, y: 0 })
              }}
            >
              <Layer>
                {/* Background */}
                <Rect width={width} height={height} fill="#ffffff" />
                
                {/* Chart Border */}
                <Rect
                  x={padding.left}
                  y={padding.top}
                  width={chartWidth}
                  height={chartHeight}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  fill="transparent"
                />

                {/* Grid */}
                {renderGrid()}

                {/* Chart Data */}
                {chartType === 'candlestick' && chartData.map((data, index) => renderCandlestick(data, index))}
                {chartType === 'line' && renderLineChart()}
                {chartType === 'area' && renderAreaChart()}

                {/* Price Labels */}
                {renderPriceLabels()}

                {/* Crosshair */}
                {crosshair.visible && (
                  <>
                    <Line
                      points={[crosshair.x, padding.top, crosshair.x, height - padding.bottom]}
                      stroke="#6b7280"
                      strokeWidth={1}
                      dash={[5, 5]}
                      opacity={0.7}
                    />
                    <Line
                      points={[padding.left, crosshair.y, width - padding.right, crosshair.y]}
                      stroke="#6b7280"
                      strokeWidth={1}
                      dash={[5, 5]}
                      opacity={0.7}
                    />
                    <Circle
                      x={crosshair.x}
                      y={crosshair.y}
                      radius={4}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  </>
                )}
              </Layer>
            </Stage>
          </div>

          {/* Chart Features */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Crosshair className="h-3 w-3" />
                Interactive Crosshair
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Real-time Updates
              </span>
              <span>Drag to Pan • Zoom Controls • Hover for Details</span>
            </div>
            <div>{chartData.length} data points</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InteractiveTradingChart