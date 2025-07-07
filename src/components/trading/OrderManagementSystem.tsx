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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  List, Activity, Clock, Target, TrendingUp, TrendingDown,
  Play, Pause, Settings, RefreshCw, AlertTriangle, CheckCircle2,
  BarChart3, LineChart, Gauge, Timer, Brain, Lightning,
  DollarSign, Percent, ArrowUp, ArrowDown, Minus, Eye,
  ShoppingCart, Package, Truck, AlertCircle, XCircle, CheckCircle,
  Filter, Search, Download, Upload, RotateCcw
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ComposedChart, PieChart, Cell
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Order Management System Component
 * Comprehensive order lifecycle management for high-frequency trading operations
 * Handles order creation, routing, execution, and risk management
 */

interface Order {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'ICEBERG' | 'TWAP' | 'VWAP'
  quantity: number
  price: number
  stopPrice?: number
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY'
  status: 'PENDING' | 'SUBMITTED' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED'
  createdAt: Date
  updatedAt: Date
  filledQuantity: number
  avgFillPrice: number
  commission: number
  strategy: string
  venue: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  parentOrderId?: string
  childOrderIds: string[]
  tags: string[]
  notes?: string
}

interface OrderFill {
  id: string
  orderId: string
  quantity: number
  price: number
  commission: number
  timestamp: Date
  venue: string
  liquidity: 'TAKER' | 'MAKER'
  tradeId: string
}

interface Position {
  symbol: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  realizedPnL: number
  dayPnL: number
  positionValue: number
  exposure: number
  marginUsed: number
  lastUpdated: Date
}

interface RiskLimit {
  id: string
  name: string
  type: 'POSITION_SIZE' | 'DAILY_LOSS' | 'CONCENTRATION' | 'LEVERAGE' | 'VOLATILITY'
  limit: number
  current: number
  utilization: number
  status: 'OK' | 'WARNING' | 'BREACH'
  lastChecked: Date
  isActive: boolean
}

interface OrderBook {
  symbol: string
  bids: PriceLevel[]
  asks: PriceLevel[]
  lastUpdate: Date
  depth: number
  spread: number
  midPrice: number
}

interface PriceLevel {
  price: number
  quantity: number
  orders: number
  timestamp: Date
}

interface ExecutionReport {
  orderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  status: Order['status']
  executionTime: number
  latency: number
  slippage: number
  marketImpact: number
  venue: string
  timestamp: Date
}

interface OrderMetrics {
  totalOrders: number
  filledOrders: number
  cancelledOrders: number
  rejectedOrders: number
  fillRate: number
  avgExecutionTime: number
  avgSlippage: number
  totalVolume: number
  avgOrderSize: number
  ordersPerSecond: number
  successRate: number
  avgLatency: number
}

interface OrderManagementSystemProps {
  onOrderSubmit?: (order: Order) => void
  onOrderCancel?: (orderId: string) => void
  onOrderModify?: (orderId: string, updates: Partial<Order>) => void
  onRiskBreach?: (limit: RiskLimit) => void
  isActive?: boolean
  className?: string
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6B7280',
  buy: '#10B981',
  sell: '#EF4444'
}

export function OrderManagementSystem({
  onOrderSubmit,
  onOrderCancel,
  onOrderModify,
  onRiskBreach,
  isActive = true,
  className = ''
}: OrderManagementSystemProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [riskLimits, setRiskLimits] = useState<RiskLimit[]>([])
  const [executions, setExecutions] = useState<ExecutionReport[]>([])
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null)
  
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD')
  const [orderType, setOrderType] = useState<Order['type']>('MARKET')
  const [orderSide, setOrderSide] = useState<Order['side']>('BUY')
  const [quantity, setQuantity] = useState('100')
  const [price, setPrice] = useState('50000')
  const [stopPrice, setStopPrice] = useState('')
  const [timeInForce, setTimeInForce] = useState<Order['timeInForce']>('GTC')
  const [strategy, setStrategy] = useState('Manual')
  const [venue, setVenue] = useState('Binance')
  const [priority, setPriority] = useState<Order['priority']>('MEDIUM')
  
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'ALL'>('ALL')
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL')
  const [filterSide, setFilterSide] = useState<Order['side'] | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [isAutoTrading, setIsAutoTrading] = useState(false)
  const [riskChecksEnabled, setRiskChecksEnabled] = useState(true)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock data generation
  const generateMockOrders = useCallback(() => {
    const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'DOTUSD']
    const types: Order['type'][] = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'ICEBERG', 'TWAP', 'VWAP']
    const statuses: Order['status'][] = ['PENDING', 'SUBMITTED', 'PARTIAL', 'FILLED', 'CANCELLED', 'REJECTED']
    const strategies = ['Momentum', 'Mean Reversion', 'Arbitrage', 'Market Making', 'DCA', 'Grid Trading']
    const venues = ['Binance', 'Coinbase', 'Kraken', 'FTX', 'Bitstamp']
    const priorities: Order['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    
    const newOrders: Order[] = []
    
    for (let i = 0; i < 150; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL'
      const type = types[Math.floor(Math.random() * types.length)]
      const basePrice = symbol === 'BTCUSD' ? 50000 : symbol === 'ETHUSD' ? 3000 : 100
      const orderPrice = basePrice * (0.95 + Math.random() * 0.1)
      const orderQuantity = Math.floor(Math.random() * 1000) + 10
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const filledQuantity = status === 'FILLED' ? orderQuantity : 
                            status === 'PARTIAL' ? Math.floor(orderQuantity * (0.1 + Math.random() * 0.8)) : 0
      
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 86400000))
      
      newOrders.push({
        id: `order-${i + 1}`,
        symbol,
        side,
        type,
        quantity: orderQuantity,
        price: orderPrice,
        stopPrice: type.includes('STOP') ? orderPrice * (side === 'BUY' ? 0.95 : 1.05) : undefined,
        timeInForce: 'GTC',
        status,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.floor(Math.random() * 3600000)),
        filledQuantity,
        avgFillPrice: status === 'FILLED' || status === 'PARTIAL' ? orderPrice * (0.998 + Math.random() * 0.004) : 0,
        commission: filledQuantity * orderPrice * 0.001,
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        venue: venues[Math.floor(Math.random() * venues.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        childOrderIds: [],
        tags: ['HFT', 'Auto']
      })
    }
    
    return newOrders
  }, [])

  const generateMockPositions = useCallback(() => {
    const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'DOTUSD']
    const newPositions: Position[] = []
    
    symbols.forEach(symbol => {
      const basePrice = symbol === 'BTCUSD' ? 50000 : symbol === 'ETHUSD' ? 3000 : 100
      const currentPrice = basePrice * (0.95 + Math.random() * 0.1)
      const quantity = Math.floor(Math.random() * 1000) + 10
      const avgCost = currentPrice * (0.98 + Math.random() * 0.04)
      const marketValue = quantity * currentPrice
      const unrealizedPnL = quantity * (currentPrice - avgCost)
      
      newPositions.push({
        symbol,
        quantity,
        avgCost,
        currentPrice,
        marketValue,
        unrealizedPnL,
        realizedPnL: Math.random() * 10000 - 5000,
        dayPnL: Math.random() * 2000 - 1000,
        positionValue: marketValue,
        exposure: marketValue / 100000,
        marginUsed: marketValue * 0.1,
        lastUpdated: new Date()
      })
    })
    
    return newPositions
  }, [])

  const generateMockRiskLimits = useCallback(() => {
    const limits: RiskLimit[] = [
      {
        id: 'position-size',
        name: 'Max Position Size',
        type: 'POSITION_SIZE',
        limit: 100000,
        current: 85000,
        utilization: 85,
        status: 'WARNING',
        lastChecked: new Date(),
        isActive: true
      },
      {
        id: 'daily-loss',
        name: 'Daily Loss Limit',
        type: 'DAILY_LOSS',
        limit: 10000,
        current: 3500,
        utilization: 35,
        status: 'OK',
        lastChecked: new Date(),
        isActive: true
      },
      {
        id: 'concentration',
        name: 'Concentration Limit',
        type: 'CONCENTRATION',
        limit: 25,
        current: 30,
        utilization: 120,
        status: 'BREACH',
        lastChecked: new Date(),
        isActive: true
      },
      {
        id: 'leverage',
        name: 'Leverage Limit',
        type: 'LEVERAGE',
        limit: 5,
        current: 3.2,
        utilization: 64,
        status: 'OK',
        lastChecked: new Date(),
        isActive: true
      },
      {
        id: 'volatility',
        name: 'Volatility Limit',
        type: 'VOLATILITY',
        limit: 50,
        current: 45,
        utilization: 90,
        status: 'WARNING',
        lastChecked: new Date(),
        isActive: true
      }
    ]
    
    return limits
  }, [])

  const generateMockOrderBook = useCallback(() => {
    const symbol = selectedSymbol
    const basePrice = symbol === 'BTCUSD' ? 50000 : symbol === 'ETHUSD' ? 3000 : 100
    const midPrice = basePrice * (0.99 + Math.random() * 0.02)
    
    const bids: PriceLevel[] = []
    const asks: PriceLevel[] = []
    
    for (let i = 0; i < 20; i++) {
      const bidPrice = midPrice * (1 - (i + 1) * 0.0001)
      const askPrice = midPrice * (1 + (i + 1) * 0.0001)
      
      bids.push({
        price: bidPrice,
        quantity: Math.floor(Math.random() * 1000) + 10,
        orders: Math.floor(Math.random() * 10) + 1,
        timestamp: new Date()
      })
      
      asks.push({
        price: askPrice,
        quantity: Math.floor(Math.random() * 1000) + 10,
        orders: Math.floor(Math.random() * 10) + 1,
        timestamp: new Date()
      })
    }
    
    return {
      symbol,
      bids,
      asks,
      lastUpdate: new Date(),
      depth: 20,
      spread: asks[0].price - bids[0].price,
      midPrice
    }
  }, [selectedSymbol])

  const generateMockMetrics = useCallback(() => {
    const totalOrders = orders.length
    const filledOrders = orders.filter(o => o.status === 'FILLED').length
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length
    const rejectedOrders = orders.filter(o => o.status === 'REJECTED').length
    
    return {
      totalOrders,
      filledOrders,
      cancelledOrders,
      rejectedOrders,
      fillRate: totalOrders > 0 ? (filledOrders / totalOrders) * 100 : 0,
      avgExecutionTime: 45 + Math.random() * 30,
      avgSlippage: 0.01 + Math.random() * 0.02,
      totalVolume: orders.reduce((sum, o) => sum + (o.filledQuantity * o.avgFillPrice), 0),
      avgOrderSize: totalOrders > 0 ? orders.reduce((sum, o) => sum + o.quantity, 0) / totalOrders : 0,
      ordersPerSecond: 8.5 + Math.random() * 3,
      successRate: totalOrders > 0 ? ((filledOrders + orders.filter(o => o.status === 'PARTIAL').length) / totalOrders) * 100 : 0,
      avgLatency: 15 + Math.random() * 10
    }
  }, [orders])

  // Initialize data
  useEffect(() => {
    const mockOrders = generateMockOrders()
    const mockPositions = generateMockPositions()
    const mockRiskLimits = generateMockRiskLimits()
    const mockOrderBook = generateMockOrderBook()
    
    setOrders(mockOrders)
    setPositions(mockPositions)
    setRiskLimits(mockRiskLimits)
    setOrderBook(mockOrderBook)
    setMetrics(generateMockMetrics())
  }, [generateMockOrders, generateMockPositions, generateMockRiskLimits, generateMockOrderBook, generateMockMetrics])

  // Real-time updates
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setOrderBook(generateMockOrderBook())
        setMetrics(generateMockMetrics())
        
        // Update some orders
        setOrders(prev => prev.map(order => {
          if (order.status === 'SUBMITTED' && Math.random() > 0.95) {
            return { ...order, status: 'FILLED', filledQuantity: order.quantity, updatedAt: new Date() }
          }
          return order
        }))
        
        // Update positions
        setPositions(prev => prev.map(pos => ({
          ...pos,
          currentPrice: pos.currentPrice * (0.999 + Math.random() * 0.002),
          lastUpdated: new Date()
        })))
        
        // Check risk limits
        setRiskLimits(prev => prev.map(limit => ({
          ...limit,
          current: limit.current * (0.98 + Math.random() * 0.04),
          utilization: (limit.current / limit.limit) * 100,
          lastChecked: new Date(),
          status: limit.utilization > 100 ? 'BREACH' : limit.utilization > 80 ? 'WARNING' : 'OK'
        })))
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, generateMockOrderBook, generateMockMetrics])

  const handleOrderSubmit = useCallback(() => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      symbol: selectedSymbol,
      side: orderSide,
      type: orderType,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      timeInForce,
      status: 'SUBMITTED',
      createdAt: new Date(),
      updatedAt: new Date(),
      filledQuantity: 0,
      avgFillPrice: 0,
      commission: 0,
      strategy,
      venue,
      priority,
      childOrderIds: [],
      tags: ['Manual']
    }
    
    setOrders(prev => [newOrder, ...prev])
    onOrderSubmit?.(newOrder)
    
    // Reset form
    setQuantity('100')
    setPrice('50000')
    setStopPrice('')
  }, [selectedSymbol, orderSide, orderType, quantity, price, stopPrice, timeInForce, strategy, venue, priority, onOrderSubmit])

  const handleOrderCancel = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'CANCELLED', updatedAt: new Date() } : order
    ))
    onOrderCancel?.(orderId)
  }, [onOrderCancel])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus
      const matchesSymbol = filterSymbol === 'ALL' || order.symbol === filterSymbol
      const matchesSide = filterSide === 'ALL' || order.side === filterSide
      const matchesSearch = !searchTerm || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.strategy.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesStatus && matchesSymbol && matchesSide && matchesSearch
    })
  }, [orders, filterStatus, filterSymbol, filterSide, searchTerm])

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'FILLED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskStatusColor = (status: RiskLimit['status']) => {
    switch (status) {
      case 'OK': return 'text-green-600'
      case 'WARNING': return 'text-yellow-600'
      case 'BREACH': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const orderBookData = useMemo(() => {
    if (!orderBook) return []
    
    const combined = [
      ...orderBook.bids.slice(0, 10).reverse().map(bid => ({
        price: bid.price,
        bidQuantity: bid.quantity,
        askQuantity: 0,
        side: 'bid' as const
      })),
      ...orderBook.asks.slice(0, 10).map(ask => ({
        price: ask.price,
        bidQuantity: 0,
        askQuantity: ask.quantity,
        side: 'ask' as const
      }))
    ]
    
    return combined
  }, [orderBook])

  const executionLatencyData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      time: new Date(Date.now() - (29 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latency: 10 + Math.random() * 20,
      target: 20
    }))
  }, [])

  const orderVolumeData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      orders: Math.floor(Math.random() * 100) + 50
    }))
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management System</h1>
            <p className="text-sm text-gray-600">Comprehensive order lifecycle management for HFT operations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Paused"}
          </Badge>
          <Button
            onClick={() => setIsAutoTrading(!isAutoTrading)}
            variant={isAutoTrading ? "default" : "outline"}
            size="sm"
          >
            {isAutoTrading ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isAutoTrading ? "Pause" : "Start"} Auto Trading
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedCounter value={metrics.totalOrders} />
                  </p>
                </div>
                <List className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.ordersPerSecond.toFixed(1)} orders/sec
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fill Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedCounter value={metrics.fillRate} suffix="%" />
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.filledOrders}/{metrics.totalOrders} filled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedCounter value={metrics.avgLatency} suffix="ms" />
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Target: &lt;20ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <AnimatedPrice value={metrics.totalVolume} prefix="$" />
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Avg: ${metrics.avgOrderSize.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Order Entry</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                    <SelectItem value="ETHUSD">ETH/USD</SelectItem>
                    <SelectItem value="SOLUSD">SOL/USD</SelectItem>
                    <SelectItem value="ADAUSD">ADA/USD</SelectItem>
                    <SelectItem value="DOTUSD">DOT/USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="side">Side</Label>
                <Select value={orderSide} onValueChange={(value) => setOrderSide(value as Order['side'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Order Type</Label>
                <Select value={orderType} onValueChange={(value) => setOrderType(value as Order['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                    <SelectItem value="STOP">Stop</SelectItem>
                    <SelectItem value="STOP_LIMIT">Stop Limit</SelectItem>
                    <SelectItem value="ICEBERG">Iceberg</SelectItem>
                    <SelectItem value="TWAP">TWAP</SelectItem>
                    <SelectItem value="VWAP">VWAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="50000"
                />
              </div>
            )}

            {(orderType === 'STOP' || orderType === 'STOP_LIMIT') && (
              <div>
                <Label htmlFor="stopPrice">Stop Price</Label>
                <Input
                  id="stopPrice"
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="49000"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="advancedOptions"
                checked={showAdvancedOptions}
                onCheckedChange={setShowAdvancedOptions}
              />
              <Label htmlFor="advancedOptions">Advanced Options</Label>
            </div>

            {showAdvancedOptions && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeInForce">Time in Force</Label>
                    <Select value={timeInForce} onValueChange={(value) => setTimeInForce(value as Order['timeInForce'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GTC">GTC</SelectItem>
                        <SelectItem value="IOC">IOC</SelectItem>
                        <SelectItem value="FOK">FOK</SelectItem>
                        <SelectItem value="DAY">DAY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as Order['priority'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="strategy">Strategy</Label>
                    <Select value={strategy} onValueChange={setStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Momentum">Momentum</SelectItem>
                        <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
                        <SelectItem value="Arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="Market Making">Market Making</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Select value={venue} onValueChange={setVenue}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Binance">Binance</SelectItem>
                        <SelectItem value="Coinbase">Coinbase</SelectItem>
                        <SelectItem value="Kraken">Kraken</SelectItem>
                        <SelectItem value="FTX">FTX</SelectItem>
                        <SelectItem value="Bitstamp">Bitstamp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={handleOrderSubmit} className="flex-1">
                <Truck className="w-4 h-4 mr-2" />
                Submit Order
              </Button>
              <Button variant="outline" onClick={() => {
                setQuantity('100')
                setPrice('50000')
                setStopPrice('')
              }}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Book */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Order Book - {selectedSymbol}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderBook && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Spread: ${orderBook.spread.toFixed(2)}</span>
                  <span>Mid: ${orderBook.midPrice.toFixed(2)}</span>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={orderBookData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="price" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'bidQuantity' ? 'Bid' : 'Ask']}
                        labelFormatter={(price) => `Price: $${price.toFixed(2)}`}
                      />
                      <Bar dataKey="bidQuantity" fill={COLORS.buy} />
                      <Bar dataKey="askQuantity" fill={COLORS.sell} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Risk Monitoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Checks</span>
                <Switch
                  checked={riskChecksEnabled}
                  onCheckedChange={setRiskChecksEnabled}
                />
              </div>
              
              <div className="space-y-3">
                {riskLimits.map((limit) => (
                  <div key={limit.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{limit.name}</span>
                      <span className={`text-sm font-medium ${getRiskStatusColor(limit.status)}`}>
                        {limit.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={limit.utilization} className="flex-1" />
                      <span className="text-xs text-gray-500">
                        {limit.utilization.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {limit.current.toLocaleString()} / {limit.limit.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order History</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as Order['status'] | 'ALL')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="FILLED">Filled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSymbol} onValueChange={setFilterSymbol}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Symbols</SelectItem>
                <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                <SelectItem value="ETHUSD">ETH/USD</SelectItem>
                <SelectItem value="SOLUSD">SOL/USD</SelectItem>
                <SelectItem value="ADAUSD">ADA/USD</SelectItem>
                <SelectItem value="DOTUSD">DOT/USD</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSide} onValueChange={(value) => setFilterSide(value as Order['side'] | 'ALL')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sides</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-left p-2">Side</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Filled</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 20).map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2 font-mono text-sm">{order.id}</td>
                    <td className="p-2 font-medium">{order.symbol}</td>
                    <td className="p-2">
                      <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'}>
                        {order.side}
                      </Badge>
                    </td>
                    <td className="p-2">{order.type}</td>
                    <td className="p-2">{order.quantity.toLocaleString()}</td>
                    <td className="p-2">${order.price.toFixed(2)}</td>
                    <td className="p-2">{order.filledQuantity.toLocaleString()}</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">{order.createdAt.toLocaleTimeString()}</td>
                    <td className="p-2">
                      <div className="flex space-x-1">
                        {(order.status === 'PENDING' || order.status === 'SUBMITTED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOrderCancel(order.id)}
                          >
                            <XCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredOrders.slice(0, 20).length} of {filteredOrders.length} orders
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Execution Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={executionLatencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="latency" stroke={COLORS.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="target" stroke={COLORS.danger} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={orderVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="volume" fill={COLORS.primary} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke={COLORS.success} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}