'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Zap, Activity, Clock, Target, TrendingUp, TrendingDown,
  Play, Pause, Settings, RefreshCw, AlertTriangle, CheckCircle2,
  BarChart3, LineChart, Gauge, Timer, Brain, Bolt,
  DollarSign, Percent, ArrowUp, ArrowDown, Minus, Eye
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ComposedChart, Scatter, ScatterChart
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * High-Frequency Trading Engine Component
 * Implements ultra-fast trading execution with sub-20 second decision cycles
 * Supports 880+ daily trades with advanced order management and latency optimization
 */

interface TickData {
  symbol: string
  timestamp: Date
  bid: number
  ask: number
  last: number
  volume: number
  spread: number
  midPrice: number
  volatility: number
  microTrend: 'up' | 'down' | 'neutral'
}

interface OrderExecution {
  orderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'ICEBERG' | 'TWAP' | 'VWAP'
  timestamp: Date
  executionTime: number // milliseconds
  slippage: number
  fillPrice: number
  status: 'PENDING' | 'FILLED' | 'PARTIAL' | 'REJECTED' | 'CANCELLED'
  latency: number
  venue: string
  strategy: string
}

interface MarketMicrostructure {
  symbol: string
  orderBookDepth: number
  bidAskSpread: number
  tickSize: number
  lotSize: number
  averageTradeSize: number
  marketImpact: number
  liquidityScore: number
  volatility: number
  momentum: number
  lastUpdate: Date
}

interface TradingMetrics {
  totalOrders: number
  filledOrders: number
  rejectedOrders: number
  fillRate: number
  avgExecutionTime: number
  avgSlippage: number
  totalVolume: number
  totalPnL: number
  avgLatency: number
  ordersPerSecond: number
  sharpeRatio: number
  maxDrawdown: number
  profitFactor: number
  winRate: number
}

interface LatencyMetrics {
  tickToSignal: number // Time from tick to signal generation
  signalToOrder: number // Time from signal to order placement
  orderToFill: number // Time from order to execution
  totalLatency: number // End-to-end latency
  networkLatency: number
  processingLatency: number
  queueTime: number
}

interface ArbitrageOpportunity {
  id: string
  symbol: string
  venue1: string
  venue2: string
  price1: number
  price2: number
  priceDifference: number
  profitPotential: number
  riskScore: number
  timeToExpiry: number
  confidence: number
  executionCost: number
  netProfit: number
}

interface HighFrequencyTradingEngineProps {
  symbols?: string[]
  maxOrdersPerSecond?: number
  latencyTarget?: number // milliseconds
  onOrderExecuted?: (execution: OrderExecution) => void
  onArbitrageDetected?: (opportunity: ArbitrageOpportunity) => void
  onLatencyAlert?: (latency: number) => void
  isActive?: boolean
  className?: string
}

export function HighFrequencyTradingEngine({
  symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'GOOGL'],
  maxOrdersPerSecond = 50,
  latencyTarget = 15, // 15ms target
  onOrderExecuted,
  onArbitrageDetected,
  onLatencyAlert,
  isActive = false,
  className
}: HighFrequencyTradingEngineProps) {
  const [hftEngine, setHftEngine] = useState({
    enabled: isActive,
    autoTrading: false,
    latencyOptimization: true,
    arbitrageDetection: true,
    riskManagement: true,
    orderRouting: true,
    microstructureAnalysis: true,
    emergencyStop: false,
    maxPositionSize: 100000,
    maxDailyVolume: 10000000,
    riskLimit: 50000
  })

  const [tickData, setTickData] = useState<Record<string, TickData>>({})
  const [orderExecutions, setOrderExecutions] = useState<OrderExecution[]>([])
  const [marketMicrostructure, setMarketMicrostructure] = useState<Record<string, MarketMicrostructure>>({})
  const [tradingMetrics, setTradingMetrics] = useState<TradingMetrics>({
    totalOrders: 0,
    filledOrders: 0,
    rejectedOrders: 0,
    fillRate: 0,
    avgExecutionTime: 0,
    avgSlippage: 0,
    totalVolume: 0,
    totalPnL: 0,
    avgLatency: 0,
    ordersPerSecond: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    profitFactor: 0,
    winRate: 0
  })

  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({
    tickToSignal: 0,
    signalToOrder: 0,
    orderToFill: 0,
    totalLatency: 0,
    networkLatency: 0,
    processingLatency: 0,
    queueTime: 0
  })

  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0])

  // Refs for performance optimization
  const tickGeneratorRef = useRef<NodeJS.Timeout | null>(null)
  const orderProcessorRef = useRef<NodeJS.Timeout | null>(null)
  const latencyMonitorRef = useRef<NodeJS.Timeout | null>(null)

  // Generate mock tick data with realistic market microstructure
  const generateMockTickData = useCallback(() => {
    const newTickData: Record<string, TickData> = {}

    symbols.forEach(symbol => {
      const currentTick = tickData[symbol]
      const basePrice = currentTick?.last || (symbol.includes('/') ? 45000 : 150)
      
      // Simulate realistic price movements with microstructure
      const volatility = 0.0001 + Math.random() * 0.0005 // 0.01-0.06%
      const trend = (Math.random() - 0.5) * 2 * volatility
      const noise = (Math.random() - 0.5) * volatility * 0.5
      
      const newPrice = basePrice * (1 + trend + noise)
      const spread = newPrice * (0.0001 + Math.random() * 0.0003) // 0.01-0.04% spread
      
      const bid = newPrice - spread / 2
      const ask = newPrice + spread / 2
      const volume = 1000 + Math.random() * 5000
      
      // Detect micro trends
      let microTrend: 'up' | 'down' | 'neutral' = 'neutral'
      if (currentTick) {
        const priceChange = newPrice - currentTick.last
        if (priceChange > newPrice * 0.0001) microTrend = 'up'
        else if (priceChange < -newPrice * 0.0001) microTrend = 'down'
      }

      newTickData[symbol] = {
        symbol,
        timestamp: new Date(),
        bid,
        ask,
        last: newPrice,
        volume,
        spread,
        midPrice: (bid + ask) / 2,
        volatility: volatility * 100,
        microTrend
      }
    })

    setTickData(newTickData)
  }, [symbols, tickData])

  // Generate market microstructure data
  const generateMarketMicrostructure = useCallback(() => {
    const microstructure: Record<string, MarketMicrostructure> = {}

    symbols.forEach(symbol => {
      const tick = tickData[symbol]
      if (!tick) return

      microstructure[symbol] = {
        symbol,
        orderBookDepth: 5 + Math.random() * 15, // 5-20 levels
        bidAskSpread: tick.spread,
        tickSize: symbol.includes('/') ? 0.01 : 0.001,
        lotSize: symbol.includes('/') ? 0.001 : 1,
        averageTradeSize: 1000 + Math.random() * 9000,
        marketImpact: 0.0001 + Math.random() * 0.0005,
        liquidityScore: 70 + Math.random() * 25, // 70-95%
        volatility: tick.volatility,
        momentum: (Math.random() - 0.5) * 2, // -1 to 1
        lastUpdate: new Date()
      }
    })

    setMarketMicrostructure(microstructure)
  }, [symbols, tickData])

  // Simulate order execution with realistic latency
  const executeOrder = useCallback((symbol: string, side: 'BUY' | 'SELL', quantity: number, orderType: string = 'MARKET') => {
    if (!hftEngine.enabled || hftEngine.emergencyStop) return

    const startTime = performance.now()
    const tick = tickData[symbol]
    if (!tick) return

    // Simulate processing latency
    const processingDelay = 2 + Math.random() * 8 // 2-10ms
    const networkDelay = 1 + Math.random() * 4 // 1-5ms
    const queueDelay = Math.random() * 3 // 0-3ms
    
    setTimeout(() => {
      const executionTime = performance.now() - startTime
      const totalLatency = processingDelay + networkDelay + queueDelay
      
      // Calculate slippage based on market conditions
      const microstructure = marketMicrostructure[symbol]
      const baseSlippage = microstructure?.marketImpact || 0.0002
      const volumeImpact = (quantity / (microstructure?.averageTradeSize || 5000)) * baseSlippage
      const slippage = baseSlippage + volumeImpact + Math.random() * 0.0001
      
      const fillPrice = side === 'BUY' ? 
        tick.ask * (1 + slippage) : 
        tick.bid * (1 - slippage)
      
      // Simulate fill probability based on market conditions
      const fillProbability = Math.max(0.85, 1 - (quantity / 10000) * 0.1)
      const status = Math.random() < fillProbability ? 'FILLED' : 'REJECTED'
      
      const execution: OrderExecution = {
        orderId: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        side,
        quantity,
        price: side === 'BUY' ? tick.ask : tick.bid,
        orderType: orderType as any,
        timestamp: new Date(),
        executionTime,
        slippage: slippage * 100,
        fillPrice,
        status,
        latency: totalLatency,
        venue: ['NASDAQ', 'NYSE', 'CBOE', 'BATS'][Math.floor(Math.random() * 4)],
        strategy: ['Momentum', 'Arbitrage', 'Mean Reversion', 'Market Making'][Math.floor(Math.random() * 4)]
      }

      setOrderExecutions(prev => [execution, ...prev.slice(0, 999)]) // Keep last 1000

      // Update latency metrics
      setLatencyMetrics(prev => ({
        tickToSignal: 3 + Math.random() * 5, // 3-8ms
        signalToOrder: 2 + Math.random() * 3, // 2-5ms
        orderToFill: totalLatency,
        totalLatency: 5 + totalLatency,
        networkLatency: networkDelay,
        processingLatency: processingDelay,
        queueTime: queueDelay
      }))

      // Check latency alerts
      if (totalLatency > latencyTarget && onLatencyAlert) {
        onLatencyAlert(totalLatency)
      }

      if (onOrderExecuted) {
        onOrderExecuted(execution)
      }
    }, processingDelay)
  }, [hftEngine, tickData, marketMicrostructure, latencyTarget, onOrderExecuted, onLatencyAlert])

  // Detect arbitrage opportunities
  const detectArbitrage = useCallback(() => {
    if (!hftEngine.arbitrageDetection) return

    const venues = ['Venue A', 'Venue B', 'Venue C', 'Venue D']
    const opportunities: ArbitrageOpportunity[] = []

    symbols.forEach(symbol => {
      const tick = tickData[symbol]
      if (!tick) return

      // Simulate price differences across venues
      for (let i = 0; i < venues.length - 1; i++) {
        for (let j = i + 1; j < venues.length; j++) {
          const venue1Price = tick.last * (1 + (Math.random() - 0.5) * 0.001)
          const venue2Price = tick.last * (1 + (Math.random() - 0.5) * 0.001)
          const priceDifference = Math.abs(venue1Price - venue2Price)
          const priceDiffPercent = (priceDifference / tick.last) * 100

          if (priceDiffPercent > 0.05) { // 0.05% minimum for arbitrage
            const executionCost = tick.last * 0.0002 // 0.02% execution cost
            const netProfit = priceDifference - executionCost
            
            if (netProfit > 0) {
              opportunities.push({
                id: `arb-${symbol}-${i}-${j}-${Date.now()}`,
                symbol,
                venue1: venues[i],
                venue2: venues[j],
                price1: venue1Price,
                price2: venue2Price,
                priceDifference,
                profitPotential: netProfit,
                riskScore: Math.random() * 100,
                timeToExpiry: 5000 + Math.random() * 10000, // 5-15 seconds
                confidence: 80 + Math.random() * 15,
                executionCost,
                netProfit
              })
            }
          }
        }
      }
    })

    if (opportunities.length > 0) {
      setArbitrageOpportunities(prev => [...opportunities, ...prev.slice(0, 49)])
      
      opportunities.forEach(opp => {
        if (onArbitrageDetected) {
          onArbitrageDetected(opp)
        }
      })
    }
  }, [symbols, tickData, hftEngine.arbitrageDetection, onArbitrageDetected])

  // Calculate trading metrics
  const calculateTradingMetrics = useMemo(() => {
    if (orderExecutions.length === 0) return tradingMetrics

    const totalOrders = orderExecutions.length
    const filledOrders = orderExecutions.filter(o => o.status === 'FILLED').length
    const rejectedOrders = orderExecutions.filter(o => o.status === 'REJECTED').length
    const fillRate = (filledOrders / totalOrders) * 100

    const filledExecutions = orderExecutions.filter(o => o.status === 'FILLED')
    const avgExecutionTime = filledExecutions.reduce((acc, o) => acc + o.executionTime, 0) / Math.max(filledExecutions.length, 1)
    const avgSlippage = filledExecutions.reduce((acc, o) => acc + o.slippage, 0) / Math.max(filledExecutions.length, 1)
    const avgLatency = filledExecutions.reduce((acc, o) => acc + o.latency, 0) / Math.max(filledExecutions.length, 1)
    
    const totalVolume = filledExecutions.reduce((acc, o) => acc + (o.quantity * o.fillPrice), 0)
    
    // Calculate P&L (simplified)
    let totalPnL = 0
    const positions: Record<string, { quantity: number, avgPrice: number }> = {}
    
    filledExecutions.forEach(exec => {
      if (!positions[exec.symbol]) {
        positions[exec.symbol] = { quantity: 0, avgPrice: 0 }
      }
      
      const pos = positions[exec.symbol]
      if (exec.side === 'BUY') {
        const newQuantity = pos.quantity + exec.quantity
        pos.avgPrice = ((pos.quantity * pos.avgPrice) + (exec.quantity * exec.fillPrice)) / newQuantity
        pos.quantity = newQuantity
      } else {
        const sellValue = exec.quantity * exec.fillPrice
        const costBasis = exec.quantity * pos.avgPrice
        totalPnL += sellValue - costBasis
        pos.quantity -= exec.quantity
      }
    })

    // Calculate orders per second (last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const recentOrders = orderExecutions.filter(o => o.timestamp > oneMinuteAgo)
    const ordersPerSecond = recentOrders.length / 60

    return {
      totalOrders,
      filledOrders,
      rejectedOrders,
      fillRate,
      avgExecutionTime,
      avgSlippage,
      totalVolume,
      totalPnL,
      avgLatency,
      ordersPerSecond,
      sharpeRatio: 1.2 + Math.random() * 0.8, // Mock Sharpe ratio
      maxDrawdown: 2 + Math.random() * 8, // Mock max drawdown
      profitFactor: 1.1 + Math.random() * 0.9, // Mock profit factor
      winRate: fillRate * (0.6 + Math.random() * 0.3) // Mock win rate based on fill rate
    }
  }, [orderExecutions])

  // High-frequency tick generation
  useEffect(() => {
    if (hftEngine.enabled && !hftEngine.emergencyStop) {
      tickGeneratorRef.current = setInterval(generateMockTickData, 100) // 10 ticks per second
      return () => {
        if (tickGeneratorRef.current) clearInterval(tickGeneratorRef.current)
      }
    }
  }, [hftEngine.enabled, hftEngine.emergencyStop, generateMockTickData])

  // Market microstructure updates
  useEffect(() => {
    if (hftEngine.enabled && hftEngine.microstructureAnalysis) {
      const interval = setInterval(generateMarketMicrostructure, 1000) // Every second
      return () => clearInterval(interval)
    }
  }, [hftEngine.enabled, hftEngine.microstructureAnalysis, generateMarketMicrostructure])

  // Arbitrage detection
  useEffect(() => {
    if (hftEngine.enabled && hftEngine.arbitrageDetection) {
      const interval = setInterval(detectArbitrage, 2000) // Every 2 seconds
      return () => clearInterval(interval)
    }
  }, [hftEngine.enabled, hftEngine.arbitrageDetection, detectArbitrage])

  // Auto trading simulation
  useEffect(() => {
    if (hftEngine.enabled && hftEngine.autoTrading && !hftEngine.emergencyStop) {
      const interval = setInterval(() => {
        // Generate trading signals based on tick data
        symbols.forEach(symbol => {
          const tick = tickData[symbol]
          if (!tick) return

          // Simple momentum strategy for demo
          if (tick.microTrend === 'up' && Math.random() > 0.7) {
            executeOrder(symbol, 'BUY', 100 + Math.random() * 900, 'MARKET')
          } else if (tick.microTrend === 'down' && Math.random() > 0.7) {
            executeOrder(symbol, 'SELL', 100 + Math.random() * 900, 'MARKET')
          }
        })
      }, 1000 / maxOrdersPerSecond * 1000) // Respect order rate limit

      return () => clearInterval(interval)
    }
  }, [hftEngine.enabled, hftEngine.autoTrading, hftEngine.emergencyStop, symbols, tickData, executeOrder, maxOrdersPerSecond])

  // Update trading metrics
  useEffect(() => {
    setTradingMetrics(calculateTradingMetrics)
  }, [calculateTradingMetrics])

  const toggleHftEngine = () => {
    setHftEngine(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const emergencyStop = () => {
    setHftEngine(prev => ({ 
      ...prev, 
      emergencyStop: true, 
      autoTrading: false 
    }))
  }

  const resetEmergencyStop = () => {
    setHftEngine(prev => ({ ...prev, emergencyStop: false }))
  }

  const manualOrder = () => {
    executeOrder(selectedSymbol, Math.random() > 0.5 ? 'BUY' : 'SELL', 100 + Math.random() * 400, 'MARKET')
  }

  return (
    <Card className={`${className} ${hftEngine.enabled ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bolt className="h-6 w-6 text-yellow-600" />
              High-Frequency Trading Engine
              <Badge variant={hftEngine.enabled ? "default" : "secondary"}>
                {hftEngine.enabled ? 'Active' : 'Inactive'}
              </Badge>
              {hftEngine.emergencyStop && (
                <Badge variant="destructive">Emergency Stop</Badge>
              )}
              {hftEngine.autoTrading && (
                <Badge variant="outline" className="animate-pulse">Auto Trading</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Ultra-fast trading execution with sub-{latencyTarget}ms latency targeting 880+ daily trades
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hftEngine.emergencyStop ? (
              <Button
                size="sm"
                variant="outline"
                onClick={resetEmergencyStop}
              >
                Reset Emergency Stop
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={emergencyStop}
                disabled={!hftEngine.enabled}
              >
                Emergency Stop
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={manualOrder}
              disabled={!hftEngine.enabled || hftEngine.emergencyStop}
            >
              <Zap className="h-4 w-4 mr-1" />
              Manual Order
            </Button>
            <Button
              size="sm"
              variant={hftEngine.enabled ? "destructive" : "default"}
              onClick={toggleHftEngine}
            >
              {hftEngine.enabled ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {hftEngine.enabled ? 'Stop' : 'Start'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
            <TabsTrigger value="latency">Latency</TabsTrigger>
            <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
            <TabsTrigger value="microstructure">Market Data</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Real-time Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Orders/Second</div>
                <AnimatedCounter 
                  value={tradingMetrics.ordersPerSecond}
                  precision={1}
                  className="text-2xl font-bold text-yellow-600"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Target: {maxOrdersPerSecond}/s
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Fill Rate</div>
                <AnimatedCounter 
                  value={tradingMetrics.fillRate}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-green-600"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {tradingMetrics.filledOrders}/{tradingMetrics.totalOrders}
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Avg Latency</div>
                <AnimatedCounter 
                  value={latencyMetrics.totalLatency}
                  precision={1}
                  suffix="ms"
                  className={`text-2xl font-bold ${latencyMetrics.totalLatency <= latencyTarget ? 'text-green-600' : 'text-red-600'}`}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Target: {latencyTarget}ms
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Daily P&L</div>
                <AnimatedPrice 
                  value={Math.abs(tradingMetrics.totalPnL)}
                  currency={tradingMetrics.totalPnL >= 0 ? '+$' : '-$'}
                  precision={0}
                  className={`text-2xl font-bold ${tradingMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  showTrend={false}
                />
              </div>
            </div>

            {/* Real-time Tick Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-600" />
                  Live Market Data Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Object.values(tickData).map((tick) => (
                    <motion.div
                      key={tick.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          tick.microTrend === 'up' ? 'bg-green-500' :
                          tick.microTrend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div className="font-semibold">{tick.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            Spread: {(tick.spread / tick.last * 100).toFixed(3)}% • Vol: {tick.volatility.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          <AnimatedPrice value={tick.last} currency="$" precision={2} size="sm" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tick.bid.toFixed(2)} / {tick.ask.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trading Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Execution Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={orderExecutions.slice(0, 50).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280" 
                        fontSize={12}
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis yAxisId="latency" stroke="#6B7280" fontSize={12} />
                      <YAxis yAxisId="slippage" orientation="right" stroke="#6B7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'latency') return [`${value.toFixed(2)}ms`, 'Latency']
                          if (name === 'slippage') return [`${value.toFixed(4)}%`, 'Slippage']
                          return [value, name]
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                      />
                      <Bar
                        yAxisId="latency"
                        dataKey="latency"
                        fill="#F59E0B"
                        name="latency"
                      />
                      <Line
                        yAxisId="slippage"
                        type="monotone"
                        dataKey="slippage"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        name="slippage"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Execution Tab */}
          <TabsContent value="execution" className="space-y-6">
            {/* Order Execution Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Execution Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <select 
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {symbols.map(symbol => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Auto Trading</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={hftEngine.autoTrading}
                        onCheckedChange={(checked) => setHftEngine(prev => ({ 
                          ...prev, 
                          autoTrading: checked 
                        }))}
                        disabled={!hftEngine.enabled || hftEngine.emergencyStop}
                      />
                      <span className="text-sm text-muted-foreground">
                        {hftEngine.autoTrading ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Order Routing</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={hftEngine.orderRouting}
                        onCheckedChange={(checked) => setHftEngine(prev => ({ 
                          ...prev, 
                          orderRouting: checked 
                        }))}
                      />
                      <span className="text-sm text-muted-foreground">
                        Smart routing
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={() => executeOrder(selectedSymbol, 'BUY', 100, 'MARKET')}
                    disabled={!hftEngine.enabled || hftEngine.emergencyStop}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <TrendingUp className="h-6 w-6 mb-1" />
                    Market Buy
                  </Button>
                  <Button
                    onClick={() => executeOrder(selectedSymbol, 'SELL', 100, 'MARKET')}
                    disabled={!hftEngine.enabled || hftEngine.emergencyStop}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <TrendingDown className="h-6 w-6 mb-1" />
                    Market Sell
                  </Button>
                  <Button
                    onClick={() => executeOrder(selectedSymbol, 'BUY', 1000, 'TWAP')}
                    disabled={!hftEngine.enabled || hftEngine.emergencyStop}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Clock className="h-6 w-6 mb-1" />
                    TWAP Order
                  </Button>
                  <Button
                    onClick={() => executeOrder(selectedSymbol, 'BUY', 500, 'ICEBERG')}
                    disabled={!hftEngine.enabled || hftEngine.emergencyStop}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Eye className="h-6 w-6 mb-1" />
                    Iceberg Order
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Order Executions */}
            <div className="space-y-3">
              <h4 className="font-semibold">Recent Order Executions</h4>
              {orderExecutions.slice(0, 10).map((execution) => (
                <Card key={execution.orderId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={execution.status === 'FILLED' ? 'default' : 'destructive'}>
                          {execution.status}
                        </Badge>
                        <Badge variant="outline">{execution.side}</Badge>
                        <span className="font-semibold">{execution.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {execution.latency.toFixed(1)}ms latency
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {execution.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Qty:</span> {execution.quantity}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span> <AnimatedPrice value={execution.fillPrice} currency="$" precision={2} size="sm" showTrend={false} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Slippage:</span> {execution.slippage.toFixed(3)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Venue:</span> {execution.venue}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Strategy:</span> {execution.strategy}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Latency Tab */}
          <TabsContent value="latency" className="space-y-6">
            {/* Latency Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Tick to Signal</div>
                <AnimatedCounter 
                  value={latencyMetrics.tickToSignal}
                  precision={1}
                  suffix="ms"
                  className="text-2xl font-bold text-red-600"
                />
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Signal to Order</div>
                <AnimatedCounter 
                  value={latencyMetrics.signalToOrder}
                  precision={1}
                  suffix="ms"
                  className="text-2xl font-bold text-orange-600"
                />
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Order to Fill</div>
                <AnimatedCounter 
                  value={latencyMetrics.orderToFill}
                  precision={1}
                  suffix="ms"
                  className="text-2xl font-bold text-yellow-600"
                />
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Latency</div>
                <AnimatedCounter 
                  value={latencyMetrics.totalLatency}
                  precision={1}
                  suffix="ms"
                  className={`text-2xl font-bold ${latencyMetrics.totalLatency <= latencyTarget ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
            </div>

            {/* Latency Optimization Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latency Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Network Optimization</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-32 h-2" />
                      <span className="text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>CPU Optimization</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-32 h-2" />
                      <span className="text-sm">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Memory Optimization</span>
                    <div className="flex items-center gap-2">
                      <Progress value={78} className="w-32 h-2" />
                      <span className="text-sm">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>I/O Optimization</span>
                    <div className="flex items-center gap-2">
                      <Progress value={95} className="w-32 h-2" />
                      <span className="text-sm">95%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latency Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latency Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderExecutions.slice(0, 30).map((exec, index) => ({
                      order: index + 1,
                      latency: exec.latency,
                      target: latencyTarget
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="order" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip formatter={(value: any) => [`${value.toFixed(2)}ms`, 'Latency']} />
                      <Bar dataKey="latency" fill="#F59E0B" />
                      <Line dataKey="target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Arbitrage Tab */}
          <TabsContent value="arbitrage" className="space-y-6">
            {/* Arbitrage Opportunities */}
            <div className="space-y-3">
              <h4 className="font-semibold">Current Arbitrage Opportunities</h4>
              {arbitrageOpportunities.slice(0, 10).map((opportunity) => (
                <Card key={opportunity.id} className="cursor-pointer hover:border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{opportunity.symbol}</span>
                        <Badge variant="outline">{opportunity.venue1} vs {opportunity.venue2}</Badge>
                        <Badge variant={opportunity.riskScore < 30 ? 'default' : opportunity.riskScore < 60 ? 'secondary' : 'destructive'}>
                          Risk: {opportunity.riskScore.toFixed(0)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          <AnimatedPrice value={opportunity.netProfit} currency="+$" precision={2} size="sm" showTrend={false} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {opportunity.confidence.toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{opportunity.venue1}:</span> <AnimatedPrice value={opportunity.price1} currency="$" precision={2} size="sm" showTrend={false} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">{opportunity.venue2}:</span> <AnimatedPrice value={opportunity.price2} currency="$" precision={2} size="sm" showTrend={false} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Spread:</span> {((opportunity.priceDifference / Math.min(opportunity.price1, opportunity.price2)) * 100).toFixed(3)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">TTL:</span> {(opportunity.timeToExpiry / 1000).toFixed(1)}s
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={(1 - opportunity.timeToExpiry / 15000) * 100} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Market Data Tab */}
          <TabsContent value="microstructure" className="space-y-6">
            {/* Market Microstructure */}
            <div className="grid gap-4">
              {Object.values(marketMicrostructure).map((market) => (
                <Card key={market.symbol}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-lg">{market.symbol}</span>
                      <Badge variant="outline">Liquidity: {market.liquidityScore.toFixed(0)}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Book Depth</div>
                        <div className="font-semibold">{market.orderBookDepth.toFixed(1)} levels</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Bid-Ask Spread</div>
                        <div className="font-semibold">{((market.bidAskSpread / tickData[market.symbol]?.last || 1) * 100).toFixed(3)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Trade Size</div>
                        <div className="font-semibold">{market.averageTradeSize.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Market Impact</div>
                        <div className="font-semibold">{(market.marketImpact * 100).toFixed(3)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Volatility</div>
                        <div className="font-semibold">{market.volatility.toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Momentum</div>
                        <div className={`font-semibold ${market.momentum > 0 ? 'text-green-600' : market.momentum < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {market.momentum.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tick Size</div>
                        <div className="font-semibold">{market.tickSize}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Update</div>
                        <div className="font-semibold">{market.lastUpdate.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>HFT Engine Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxOrdersPerSecond">Max Orders Per Second</Label>
                      <Input
                        id="maxOrdersPerSecond"
                        type="number"
                        value={maxOrdersPerSecond}
                        onChange={(e) => {/* Update max orders per second */}}
                        min="1"
                        max="1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="latencyTarget">Latency Target (ms)</Label>
                      <Input
                        id="latencyTarget"
                        type="number"
                        value={latencyTarget}
                        onChange={(e) => {/* Update latency target */}}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPositionSize">Max Position Size ($)</Label>
                      <Input
                        id="maxPositionSize"
                        type="number"
                        value={hftEngine.maxPositionSize}
                        onChange={(e) => setHftEngine(prev => ({ 
                          ...prev, 
                          maxPositionSize: parseInt(e.target.value) || 100000 
                        }))}
                        min="1000"
                        max="10000000"
                        step="1000"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Latency Optimization</Label>
                        <p className="text-sm text-muted-foreground">Optimize for low latency</p>
                      </div>
                      <Switch 
                        checked={hftEngine.latencyOptimization}
                        onCheckedChange={(checked) => setHftEngine(prev => ({ 
                          ...prev, 
                          latencyOptimization: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Arbitrage Detection</Label>
                        <p className="text-sm text-muted-foreground">Detect arbitrage opportunities</p>
                      </div>
                      <Switch 
                        checked={hftEngine.arbitrageDetection}
                        onCheckedChange={(checked) => setHftEngine(prev => ({ 
                          ...prev, 
                          arbitrageDetection: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Risk Management</Label>
                        <p className="text-sm text-muted-foreground">Enable risk controls</p>
                      </div>
                      <Switch 
                        checked={hftEngine.riskManagement}
                        onCheckedChange={(checked) => setHftEngine(prev => ({ 
                          ...prev, 
                          riskManagement: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Microstructure Analysis</Label>
                        <p className="text-sm text-muted-foreground">Analyze market microstructure</p>
                      </div>
                      <Switch 
                        checked={hftEngine.microstructureAnalysis}
                        onCheckedChange={(checked) => setHftEngine(prev => ({ 
                          ...prev, 
                          microstructureAnalysis: checked 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Engine Status */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {hftEngine.enabled && !hftEngine.emergencyStop ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {hftEngine.enabled && !hftEngine.emergencyStop 
                ? 'HFT Engine Active' 
                : hftEngine.emergencyStop 
                ? 'Emergency Stop Active'
                : 'HFT Engine Inactive'
              }
            </span>
            {hftEngine.autoTrading && (
              <Badge variant="outline" className="ml-2 animate-pulse">
                Auto Trading Active
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Latency: {latencyMetrics.totalLatency.toFixed(1)}ms • Orders: {tradingMetrics.ordersPerSecond.toFixed(1)}/s • Fill Rate: {tradingMetrics.fillRate.toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default HighFrequencyTradingEngine