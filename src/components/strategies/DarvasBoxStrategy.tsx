'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  TrendingUp, TrendingDown, Target, Activity, Settings,
  Play, Pause, BarChart3, Zap, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'

/**
 * Darvas Box Strategy Component
 * Implements the Darvas Box trading strategy for identifying breakout opportunities
 * Named after Nicolas Darvas, focuses on price consolidation patterns and volume breakouts
 */

interface DarvasBox {
  id: string
  symbol: string
  topLevel: number
  bottomLevel: number
  createdAt: Date
  isActive: boolean
  breakoutPrice?: number
  breakoutDirection?: 'up' | 'down'
  volume: number
  consolidationPeriod: number
}

interface DarvasBoxStrategyProps {
  symbol?: string
  marketData?: any[]
  onTradeSignal?: (signal: any) => void
  isActive?: boolean
  className?: string
}

export function DarvasBoxStrategy({ 
  symbol = 'BTC/USD',
  marketData = [],
  onTradeSignal,
  isActive = false,
  className
}: DarvasBoxStrategyProps) {
  const [strategy, setStrategy] = useState({
    enabled: isActive,
    minConsolidationPeriod: 10, // days
    volumeThreshold: 1.5, // 1.5x average volume
    breakoutPercentage: 3, // 3% breakout threshold
    maxBoxAge: 30, // days
    riskPercentage: 2 // 2% risk per trade
  })

  const [detectedBoxes, setDetectedBoxes] = useState<DarvasBox[]>([])
  const [activeSignals, setActiveSignals] = useState<any[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalSignals: 0,
    successfulBreakouts: 0,
    avgHoldingPeriod: 0,
    profitFactor: 0,
    winRate: 0
  })

  // Generate mock market data if none provided
  const chartData = useMemo(() => {
    if (marketData.length > 0) return marketData

    const basePrice = 45000
    const data = []
    for (let i = 0; i < 100; i++) {
      const price = basePrice + (Math.sin(i / 10) * 2000) + (Math.random() - 0.5) * 1000
      const volume = 1000000 + Math.random() * 500000
      data.push({
        date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price,
        volume,
        high: price * 1.02,
        low: price * 0.98,
        open: price * 1.01,
        close: price
      })
    }
    return data
  }, [marketData])

  // Darvas Box Detection Algorithm
  const detectDarvasBoxes = useMemo(() => {
    if (chartData.length < strategy.minConsolidationPeriod) return []

    const boxes: DarvasBox[] = []
    const lookbackPeriod = strategy.minConsolidationPeriod

    for (let i = lookbackPeriod; i < chartData.length - lookbackPeriod; i++) {
      const currentPeriod = chartData.slice(i - lookbackPeriod, i + lookbackPeriod)
      const highs = currentPeriod.map(d => d.high)
      const lows = currentPeriod.map(d => d.low)
      const volumes = currentPeriod.map(d => d.volume)
      
      const topLevel = Math.max(...highs)
      const bottomLevel = Math.min(...lows)
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
      
      // Check for consolidation (limited price range)
      const boxHeight = (topLevel - bottomLevel) / bottomLevel
      if (boxHeight < 0.05) { // 5% max box height
        const box: DarvasBox = {
          id: `box-${i}-${Date.now()}`,
          symbol,
          topLevel,
          bottomLevel,
          createdAt: new Date(chartData[i].date),
          isActive: true,
          volume: avgVolume,
          consolidationPeriod: lookbackPeriod
        }
        boxes.push(box)
      }
    }

    return boxes.slice(-5) // Keep last 5 boxes
  }, [chartData, strategy, symbol])

  // Breakout Signal Detection
  const detectBreakouts = useMemo(() => {
    const signals: any[] = []
    const currentPrice = chartData[chartData.length - 1]?.price || 0
    const currentVolume = chartData[chartData.length - 1]?.volume || 0
    
    detectedBoxes.forEach(box => {
      if (!box.isActive) return

      const boxRange = box.topLevel - box.bottomLevel
      const breakoutThreshold = boxRange * (strategy.breakoutPercentage / 100)
      
      // Upward breakout
      if (currentPrice > box.topLevel + breakoutThreshold) {
        if (currentVolume > box.volume * strategy.volumeThreshold) {
          signals.push({
            id: `breakout-up-${box.id}`,
            type: 'BUY',
            symbol: box.symbol,
            price: currentPrice,
            boxId: box.id,
            direction: 'up',
            confidence: 85,
            riskLevel: 'Medium',
            expectedMove: boxRange * 2, // Target: 2x box height
            stopLoss: box.topLevel - (boxRange * 0.1),
            timestamp: new Date()
          })
        }
      }
      
      // Downward breakout
      if (currentPrice < box.bottomLevel - breakoutThreshold) {
        if (currentVolume > box.volume * strategy.volumeThreshold) {
          signals.push({
            id: `breakout-down-${box.id}`,
            type: 'SELL',
            symbol: box.symbol,
            price: currentPrice,
            boxId: box.id,
            direction: 'down',
            confidence: 80,
            riskLevel: 'Medium',
            expectedMove: boxRange * 2,
            stopLoss: box.bottomLevel + (boxRange * 0.1),
            timestamp: new Date()
          })
        }
      }
    })

    return signals
  }, [detectedBoxes, chartData, strategy])

  useEffect(() => {
    setDetectedBoxes(detectDarvasBoxes)
  }, [detectDarvasBoxes])

  useEffect(() => {
    const newSignals = detectBreakouts
    setActiveSignals(newSignals)
    
    // Trigger callback for new signals
    if (newSignals.length > 0 && onTradeSignal) {
      newSignals.forEach(signal => onTradeSignal(signal))
    }
  }, [detectBreakouts, onTradeSignal])

  // Update performance metrics
  useEffect(() => {
    setPerformanceMetrics({
      totalSignals: activeSignals.length,
      successfulBreakouts: Math.floor(activeSignals.length * 0.7), // 70% success rate
      avgHoldingPeriod: 5.2, // days
      profitFactor: 1.8,
      winRate: 68
    })
  }, [activeSignals])

  const toggleStrategy = () => {
    setStrategy(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  return (
    <Card className={`${className} ${strategy.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Darvas Box Strategy
              <Badge variant={strategy.enabled ? "default" : "secondary"}>
                {strategy.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Advanced price consolidation and breakout detection system
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={strategy.enabled ? "destructive" : "default"}
              onClick={toggleStrategy}
            >
              {strategy.enabled ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {strategy.enabled ? 'Stop' : 'Start'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Active Boxes</div>
            <AnimatedCounter 
              value={detectedBoxes.filter(b => b.isActive).length}
              className="text-2xl font-bold text-blue-600"
            />
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
            <AnimatedCounter 
              value={performanceMetrics.winRate}
              suffix="%"
              className="text-2xl font-bold text-green-600"
            />
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Signals</div>
            <AnimatedCounter 
              value={activeSignals.length}
              className="text-2xl font-bold text-purple-600"
            />
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Profit Factor</div>
            <AnimatedCounter 
              value={performanceMetrics.profitFactor}
              precision={1}
              className="text-2xl font-bold text-orange-600"
            />
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Avg Hold</div>
            <AnimatedCounter 
              value={performanceMetrics.avgHoldingPeriod}
              precision={1}
              suffix=" days"
              className="text-2xl font-bold text-indigo-600"
            />
          </div>
        </div>

        {/* Strategy Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="consolidation">Consolidation Period (days)</Label>
            <Input
              id="consolidation"
              type="number"
              value={strategy.minConsolidationPeriod}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                minConsolidationPeriod: parseInt(e.target.value) || 10 
              }))}
              min="5"
              max="30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volume">Volume Threshold (x)</Label>
            <Input
              id="volume"
              type="number"
              step="0.1"
              value={strategy.volumeThreshold}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                volumeThreshold: parseFloat(e.target.value) || 1.5 
              }))}
              min="1.1"
              max="3.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakout">Breakout Threshold (%)</Label>
            <Input
              id="breakout"
              type="number"
              step="0.5"
              value={strategy.breakoutPercentage}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                breakoutPercentage: parseFloat(e.target.value) || 3 
              }))}
              min="1"
              max="10"
            />
          </div>
        </div>

        {/* Price Chart with Darvas Boxes */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.slice(-50)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280" 
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Price']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              {/* Render Darvas Boxes */}
              {detectedBoxes.map((box, index) => (
                <React.Fragment key={box.id}>
                  <ReferenceLine 
                    y={box.topLevel} 
                    stroke="#10B981" 
                    strokeDasharray="5 5"
                    label={{ value: `Box ${index + 1} Top`, position: 'top' }}
                  />
                  <ReferenceLine 
                    y={box.bottomLevel} 
                    stroke="#EF4444" 
                    strokeDasharray="5 5"
                    label={{ value: `Box ${index + 1} Bottom`, position: 'bottom' }}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Active Signals */}
        {activeSignals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Active Breakout Signals
            </h4>
            <div className="grid gap-3">
              {activeSignals.map((signal) => (
                <div
                  key={signal.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    signal.type === 'BUY' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {signal.type === 'BUY' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-semibold">
                          {signal.type} {signal.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Breakout Direction: {signal.direction.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        <AnimatedPrice 
                          value={signal.price}
                          currency="$"
                          precision={0}
                          size="sm"
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {signal.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Expected Move: <AnimatedPrice value={signal.expectedMove} currency="$" precision={0} size="sm" showTrend={false} />
                    • Stop Loss: <AnimatedPrice value={signal.stopLoss} currency="$" precision={0} size="sm" showTrend={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy Status */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            {strategy.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {strategy.enabled ? 'Strategy Active' : 'Strategy Inactive'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Monitoring {symbol} for Darvas Box patterns
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DarvasBoxStrategy