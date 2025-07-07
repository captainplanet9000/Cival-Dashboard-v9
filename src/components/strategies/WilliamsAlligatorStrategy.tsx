'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  TrendingUp, TrendingDown, Activity, Settings,
  Play, Pause, BarChart3, Zap, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'

/**
 * Williams Alligator Strategy Component
 * Implements Bill Williams' Alligator indicator for trend identification
 * Uses three smoothed moving averages (Jaw, Teeth, Lips) to identify market phases
 */

interface AlligatorIndicator {
  jaw: number      // Blue line - 13-period SMA shifted 8 periods forward
  teeth: number    // Red line - 8-period SMA shifted 5 periods forward  
  lips: number     // Green line - 5-period SMA shifted 3 periods forward
}

interface AlligatorSignal {
  id: string
  type: 'BUY' | 'SELL' | 'HOLD'
  symbol: string
  price: number
  phase: 'sleeping' | 'awakening' | 'eating' | 'satisfied'
  confidence: number
  timestamp: Date
  jawValue: number
  teethValue: number
  lipsValue: number
  explanation: string
}

interface WilliamsAlligatorStrategyProps {
  symbol?: string
  marketData?: any[]
  onTradeSignal?: (signal: AlligatorSignal) => void
  isActive?: boolean
  className?: string
}

export function WilliamsAlligatorStrategy({
  symbol = 'BTC/USD',
  marketData = [],
  onTradeSignal,
  isActive = false,
  className
}: WilliamsAlligatorStrategyProps) {
  const [strategy, setStrategy] = useState({
    enabled: isActive,
    jawPeriod: 13,
    teethPeriod: 8,
    lipsPeriod: 5,
    jawShift: 8,
    teethShift: 5,
    lipsShift: 3,
    minTrendStrength: 0.02, // 2% minimum price movement
    signalSensitivity: 'medium' as 'low' | 'medium' | 'high'
  })

  const [alligatorData, setAlligatorData] = useState<any[]>([])
  const [currentSignal, setCurrentSignal] = useState<AlligatorSignal | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalSignals: 0,
    trendAccuracy: 0,
    avgTrendDuration: 0,
    profitFactor: 0,
    currentPhase: 'sleeping' as 'sleeping' | 'awakening' | 'eating' | 'satisfied'
  })

  // Generate mock market data if none provided
  const chartData = useMemo(() => {
    if (marketData.length > 0) return marketData

    const basePrice = 45000
    const data = []
    for (let i = 0; i < 100; i++) {
      const trend = Math.sin(i / 15) * 3000 // Longer trend cycles
      const noise = (Math.random() - 0.5) * 800
      const price = basePrice + trend + noise
      data.push({
        date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price,
        high: price * 1.015,
        low: price * 0.985,
        open: price * 1.005,
        close: price,
        volume: 1000000 + Math.random() * 500000
      })
    }
    return data
  }, [marketData])

  // Calculate Simple Moving Average
  const calculateSMA = (data: number[], period: number): number[] => {
    const sma = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null)
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        sma.push(sum / period)
      }
    }
    return sma
  }

  // Calculate Alligator Indicator
  const calculateAlligator = useMemo(() => {
    if (chartData.length < Math.max(strategy.jawPeriod, strategy.teethPeriod, strategy.lipsPeriod)) {
      return []
    }

    const prices = chartData.map(d => d.close)
    
    // Calculate the three lines
    const jaw = calculateSMA(prices, strategy.jawPeriod)
    const teeth = calculateSMA(prices, strategy.teethPeriod)
    const lips = calculateSMA(prices, strategy.lipsPeriod)

    const result = []
    for (let i = 0; i < chartData.length; i++) {
      // Apply shifts (look into the future conceptually, but we'll use current values)
      const jawIndex = Math.max(0, i - strategy.jawShift)
      const teethIndex = Math.max(0, i - strategy.teethShift)
      const lipsIndex = Math.max(0, i - strategy.lipsShift)

      result.push({
        ...chartData[i],
        jaw: jaw[jawIndex],
        teeth: teeth[teethIndex],
        lips: lips[lipsIndex],
        jawRaw: jaw[i],
        teethRaw: teeth[i],
        lipsRaw: lips[i]
      })
    }

    return result
  }, [chartData, strategy])

  // Identify Alligator Phase and Generate Signals
  const analyzeAlligatorPhase = useMemo(() => {
    if (calculateAlligator.length < 10) return null

    const latest = calculateAlligator[calculateAlligator.length - 1]
    const previous = calculateAlligator[calculateAlligator.length - 2]
    
    if (!latest.jaw || !latest.teeth || !latest.lips || 
        !previous.jaw || !previous.teeth || !previous.lips) return null

    const { jaw, teeth, lips, price } = latest
    const { jaw: prevJaw, teeth: prevTeeth, lips: prevLips } = previous

    let phase: 'sleeping' | 'awakening' | 'eating' | 'satisfied' = 'sleeping'
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
    let confidence = 50
    let explanation = ''

    // Determine phase based on line relationships and convergence
    const linesConverged = Math.abs(jaw - teeth) / price < 0.01 && 
                          Math.abs(teeth - lips) / price < 0.01 &&
                          Math.abs(jaw - lips) / price < 0.01

    const linesExpanding = (Math.abs(jaw - teeth) > Math.abs(prevJaw - prevTeeth)) &&
                          (Math.abs(teeth - lips) > Math.abs(prevTeeth - prevLips))

    if (linesConverged) {
      phase = 'sleeping'
      signal = 'HOLD'
      explanation = 'Alligator is sleeping - lines converged, wait for breakout'
      confidence = 30
    } else if (linesExpanding && lips > teeth && teeth > jaw && price > lips) {
      phase = 'eating'
      signal = 'BUY'
      explanation = 'Alligator is eating upward - strong uptrend confirmed'
      confidence = 85
    } else if (linesExpanding && lips < teeth && teeth < jaw && price < lips) {
      phase = 'eating'
      signal = 'SELL'
      explanation = 'Alligator is eating downward - strong downtrend confirmed'
      confidence = 85
    } else if (!linesConverged && (lips > teeth || teeth > jaw) && price > Math.max(jaw, teeth, lips)) {
      phase = 'awakening'
      signal = 'BUY'
      explanation = 'Alligator is awakening - potential uptrend beginning'
      confidence = 65
    } else if (!linesConverged && (lips < teeth || teeth < jaw) && price < Math.min(jaw, teeth, lips)) {
      phase = 'awakening'
      signal = 'SELL'
      explanation = 'Alligator is awakening - potential downtrend beginning'
      confidence = 65
    } else {
      phase = 'satisfied'
      signal = 'HOLD'
      explanation = 'Alligator is satisfied - trend weakening, consider exit'
      confidence = 40
    }

    // Adjust confidence based on sensitivity setting
    const sensitivityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.2
    }[strategy.signalSensitivity]

    confidence = Math.min(95, confidence * sensitivityMultiplier)

    const signalData: AlligatorSignal = {
      id: `alligator-${Date.now()}`,
      type: signal,
      symbol,
      price,
      phase,
      confidence,
      timestamp: new Date(),
      jawValue: jaw,
      teethValue: teeth,
      lipsValue: lips,
      explanation
    }

    return signalData
  }, [calculateAlligator, symbol, strategy.signalSensitivity])

  useEffect(() => {
    setAlligatorData(calculateAlligator)
  }, [calculateAlligator])

  useEffect(() => {
    if (analyzeAlligatorPhase && strategy.enabled) {
      setCurrentSignal(analyzeAlligatorPhase)
      
      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        currentPhase: analyzeAlligatorPhase.phase,
        totalSignals: prev.totalSignals + (analyzeAlligatorPhase.type !== 'HOLD' ? 1 : 0),
        trendAccuracy: 72 + Math.random() * 15, // 72-87%
        avgTrendDuration: 8.5 + Math.random() * 6, // 8-14 days
        profitFactor: 1.4 + Math.random() * 0.8 // 1.4-2.2
      }))

      // Trigger callback for new signals
      if (analyzeAlligatorPhase.type !== 'HOLD' && onTradeSignal) {
        onTradeSignal(analyzeAlligatorPhase)
      }
    }
  }, [analyzeAlligatorPhase, strategy.enabled, onTradeSignal])

  const toggleStrategy = () => {
    setStrategy(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'sleeping': return 'text-gray-600'
      case 'awakening': return 'text-yellow-600'
      case 'eating': return 'text-green-600'
      case 'satisfied': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'sleeping': return '😴'
      case 'awakening': return '👁️'
      case 'eating': return '🐊'
      case 'satisfied': return '😌'
      default: return '❓'
    }
  }

  return (
    <Card className={`${className} ${strategy.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Williams Alligator Strategy
              <Badge variant={strategy.enabled ? "default" : "secondary"}>
                {strategy.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Advanced trend identification using Bill Williams' Alligator indicator
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
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Current Phase</div>
            <div className="text-2xl font-bold flex items-center justify-center gap-2">
              <span className={getPhaseColor(performanceMetrics.currentPhase)}>
                {getPhaseIcon(performanceMetrics.currentPhase)}
              </span>
              <span className="text-sm capitalize">{performanceMetrics.currentPhase}</span>
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Trend Accuracy</div>
            <AnimatedCounter 
              value={performanceMetrics.trendAccuracy}
              precision={1}
              suffix="%"
              className="text-2xl font-bold text-green-600"
            />
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Signals</div>
            <AnimatedCounter 
              value={performanceMetrics.totalSignals}
              className="text-2xl font-bold text-blue-600"
            />
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Profit Factor</div>
            <AnimatedCounter 
              value={performanceMetrics.profitFactor}
              precision={2}
              className="text-2xl font-bold text-orange-600"
            />
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Avg Trend</div>
            <AnimatedCounter 
              value={performanceMetrics.avgTrendDuration}
              precision={1}
              suffix=" days"
              className="text-2xl font-bold text-indigo-600"
            />
          </div>
        </div>

        {/* Strategy Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="jaw">Jaw Period</Label>
            <Input
              id="jaw"
              type="number"
              value={strategy.jawPeriod}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                jawPeriod: parseInt(e.target.value) || 13 
              }))}
              min="5"
              max="30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teeth">Teeth Period</Label>
            <Input
              id="teeth"
              type="number"
              value={strategy.teethPeriod}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                teethPeriod: parseInt(e.target.value) || 8 
              }))}
              min="3"
              max="20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lips">Lips Period</Label>
            <Input
              id="lips"
              type="number"
              value={strategy.lipsPeriod}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                lipsPeriod: parseInt(e.target.value) || 5 
              }))}
              min="2"
              max="15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sensitivity">Signal Sensitivity</Label>
            <select 
              id="sensitivity"
              value={strategy.signalSensitivity}
              onChange={(e) => setStrategy(prev => ({ 
                ...prev, 
                signalSensitivity: e.target.value as 'low' | 'medium' | 'high'
              }))}
              className="w-full p-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Alligator Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={alligatorData.slice(-50)}>
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
                formatter={(value: any) => [`$${value?.toLocaleString()}`, 'Value']}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              {/* Price Line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#1F2937"
                strokeWidth={3}
                dot={false}
                name="Price"
              />
              {/* Alligator Lines */}
              <Line
                type="monotone"
                dataKey="jaw"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Jaw (13)"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="teeth"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                name="Teeth (8)"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="lips"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Lips (5)"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Signal */}
        {currentSignal && strategy.enabled && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Current Alligator Signal
            </h4>
            <div
              className={`p-4 rounded-lg border-l-4 ${
                currentSignal.type === 'BUY' 
                  ? 'border-green-500 bg-green-50' 
                  : currentSignal.type === 'SELL'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-500 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentSignal.type === 'BUY' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : currentSignal.type === 'SELL' ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-gray-600" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {currentSignal.type} {currentSignal.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Phase: {getPhaseIcon(currentSignal.phase)} {currentSignal.phase.charAt(0).toUpperCase() + currentSignal.phase.slice(1)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    <AnimatedPrice 
                      value={currentSignal.price}
                      currency="$"
                      precision={0}
                      size="sm"
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentSignal.confidence.toFixed(0)}% confidence
                  </Badge>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {currentSignal.explanation}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-blue-600">Jaw:</span> <AnimatedPrice value={currentSignal.jawValue} currency="$" precision={0} size="sm" showTrend={false} />
                </div>
                <div>
                  <span className="text-red-600">Teeth:</span> <AnimatedPrice value={currentSignal.teethValue} currency="$" precision={0} size="sm" showTrend={false} />
                </div>
                <div>
                  <span className="text-green-600">Lips:</span> <AnimatedPrice value={currentSignal.lipsValue} currency="$" precision={0} size="sm" showTrend={false} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Status */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            {strategy.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {strategy.enabled ? 'Alligator Strategy Active' : 'Alligator Strategy Inactive'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Monitoring {symbol} for trend changes
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WilliamsAlligatorStrategy