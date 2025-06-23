'use client'

// Enhanced Trading Interface - Premium version preserving ALL existing functionality
// Migrated from: src/components/trading/TradingInterface.tsx
// Preserves: Multi-exchange routing, AG-UI Protocol v2, Paper trading P&L, Real-time data

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  BarChart3,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

// Import premium components
import { AutoForm, TradingOrderSchema } from '../forms/auto-form'
import { AdvancedDataTable, createPriceColumn, createChangeColumn, createVolumeColumn, createStatusColumn } from '../tables/advanced-data-table'
import { PriceRangeSlider } from '../expansions/price-range-slider'
import { TradingSymbolSelector } from '../expansions/trading-symbol-selector'
import { ProgressWithValue } from '../expansions/progress-with-value'

// Import enhanced API and WebSocket clients
import { enhancedBackendClient } from '@/lib/api/enhanced-backend-client'
import { premiumWebSocketClient, ConnectionState } from '@/lib/websocket/premium-websocket'
import { cn } from '@/lib/utils'

// ===== PRESERVED TYPES FROM ORIGINAL =====

interface TradingOrder {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop-limit'
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY'
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  exchange: 'binance' | 'coinbase' | 'hyperliquid'
  createdAt: Date
  filledQuantity: number
  averagePrice: number
}

interface MarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  change: number
  changePercent: number
  high: number
  low: number
  timestamp: Date
}

interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

interface OrderBook {
  symbol: string
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
}

interface PaperTradingMetrics {
  totalPnl: number
  totalPnlPercent: number
  totalTrades: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  balance: number
}

// ===== ENHANCED TRADING INTERFACE COMPONENT =====

export function EnhancedTradingInterface() {
  // ===== PRESERVED STATE FROM ORIGINAL =====
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD')
  const [selectedExchange, setSelectedExchange] = useState<'binance' | 'coinbase' | 'hyperliquid'>('binance')
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map())
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [orders, setOrders] = useState<TradingOrder[]>([])
  const [paperTradingMetrics, setPaperTradingMetrics] = useState<PaperTradingMetrics | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [isLoading, setIsLoading] = useState(false)

  // ===== PREMIUM ENHANCEMENTS =====
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTCUSD'])
  const [priceRange, setPriceRange] = useState<[number, number]>([40000, 50000])
  const [showAdvancedOrderEntry, setShowAdvancedOrderEntry] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)

  // ===== PRESERVED WEBSOCKET INTEGRATION =====
  useEffect(() => {
    // Monitor WebSocket connection state
    premiumWebSocketClient.onStateChange(setConnectionState)

    // Connect to WebSocket
    premiumWebSocketClient.connect().catch(console.error)

    return () => {
      premiumWebSocketClient.offStateChange(setConnectionState)
    }
  }, [])

  useEffect(() => {
    // Subscribe to market data for selected symbols
    if (connectionState === ConnectionState.CONNECTED) {
      premiumWebSocketClient.sendMarketDataSubscription(selectedSymbols)
    }

    // Set up AG-UI Protocol v2 event handlers
    const handleMarketData = (data: any) => {
      setMarketData(prev => new Map(prev.set(data.symbol, {
        ...data,
        timestamp: new Date()
      })))
    }

    const handleOrderUpdate = (data: any) => {
      setOrders(prev => {
        const updated = [...prev]
        const index = updated.findIndex(order => order.id === data.id)
        if (index >= 0) {
          updated[index] = { ...updated[index], ...data }
        } else {
          updated.push(data)
        }
        return updated
      })
    }

    const handleOrderBook = (data: any) => {
      if (data.symbol === selectedSymbol) {
        setOrderBook(data)
      }
    }

    const handlePaperTradingUpdate = (data: any) => {
      setPaperTradingMetrics(data)
    }

    // Register event handlers
    premiumWebSocketClient.on('market_data', handleMarketData)
    premiumWebSocketClient.on('order_update', handleOrderUpdate)
    premiumWebSocketClient.on('order_book', handleOrderBook)
    premiumWebSocketClient.on('paper_trading_update', handlePaperTradingUpdate)

    return () => {
      premiumWebSocketClient.off('market_data', handleMarketData)
      premiumWebSocketClient.off('order_update', handleOrderUpdate)
      premiumWebSocketClient.off('order_book', handleOrderBook)
      premiumWebSocketClient.off('paper_trading_update', handlePaperTradingUpdate)
    }
  }, [connectionState, selectedSymbols, selectedSymbol])

  // ===== PRESERVED API INTEGRATION =====
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [ordersData, portfolioData, metricsData] = await Promise.all([
        enhancedBackendClient.getOpenOrders(),
        enhancedBackendClient.getPaperPortfolio(),
        enhancedBackendClient.getPerformanceMetrics()
      ])

      setOrders(ordersData)
      setPaperTradingMetrics(portfolioData)
      setPerformanceMetrics(metricsData)
    } catch (error) {
      console.error('Failed to load trading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // ===== PRESERVED ORDER SUBMISSION =====
  const handleOrderSubmit = useCallback(async (orderData: any) => {
    try {
      setIsLoading(true)

      // Add exchange and current price data
      const enhancedOrderData = {
        ...orderData,
        exchange: selectedExchange,
        symbol: selectedSymbol,
        currentPrice: marketData.get(selectedSymbol)?.price
      }

      // Submit via enhanced backend client
      const result = await enhancedBackendClient.createOrder(enhancedOrderData)

      // Send via WebSocket for real-time updates
      premiumWebSocketClient.sendTradingOrder({
        ...enhancedOrderData,
        orderId: result.id
      })

      // Refresh orders
      await loadInitialData()

    } catch (error) {
      console.error('Order submission failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedExchange, selectedSymbol, marketData, loadInitialData])

  // ===== ENHANCED ORDER MANAGEMENT =====
  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await enhancedBackendClient.cancelOrder(orderId)
      await loadInitialData()
    } catch (error) {
      console.error('Order cancellation failed:', error)
    }
  }, [loadInitialData])

  // ===== PREMIUM FEATURES =====
  const currentMarketData = marketData.get(selectedSymbol)
  const currentPrice = currentMarketData?.price || 0

  const orderColumns = useMemo(() => [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
    },
    {
      accessorKey: 'side',
      header: 'Side',
      cell: ({ row }: any) => (
        <Badge variant={row.getValue('side') === 'buy' ? 'default' : 'destructive'}>
          {row.getValue('side')}
        </Badge>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }: any) => (
        <span className="font-mono">{row.getValue('quantity')}</span>
      ),
    },
    createPriceColumn('price', 'Price'),
    createStatusColumn('status', 'Status'),
    {
      accessorKey: 'exchange',
      header: 'Exchange',
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.getValue('exchange')}</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleCancelOrder(row.original.id)}
          disabled={row.original.status !== 'pending'}
        >
          Cancel
        </Button>
      ),
    },
  ], [handleCancelOrder])

  const marketDataArray = useMemo(() => {
    return Array.from(marketData.entries()).map(([symbol, data]) => ({
      symbol,
      ...data
    }))
  }, [marketData])

  const marketDataColumns = useMemo(() => [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
    },
    createPriceColumn('price', 'Price'),
    createChangeColumn('changePercent', 'Change'),
    createVolumeColumn('volume', 'Volume'),
    {
      accessorKey: 'timestamp',
      header: 'Updated',
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.getValue('timestamp')).toLocaleTimeString()}
        </span>
      ),
    },
  ], [])

  // ===== CONNECTION STATUS INDICATOR =====
  const getConnectionStatusColor = (state: ConnectionState) => {
    switch (state) {
      case ConnectionState.CONNECTED: return 'bg-green-500'
      case ConnectionState.CONNECTING: return 'bg-yellow-500'
      case ConnectionState.RECONNECTING: return 'bg-orange-500'
      case ConnectionState.ERROR: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getConnectionStatusText = (state: ConnectionState) => {
    switch (state) {
      case ConnectionState.CONNECTED: return 'Connected'
      case ConnectionState.CONNECTING: return 'Connecting'
      case ConnectionState.RECONNECTING: return 'Reconnecting'
      case ConnectionState.ERROR: return 'Error'
      default: return 'Disconnected'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* ===== ENHANCED HEADER WITH CONNECTION STATUS ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Enhanced Trading Interface
              </CardTitle>
              <CardDescription>
                Multi-exchange trading with real-time data and advanced order management
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={cn('w-2 h-2 rounded-full', getConnectionStatusColor(connectionState))} />
                <span className="text-sm text-muted-foreground">
                  {getConnectionStatusText(connectionState)}
                </span>
              </div>

              {/* Performance Metrics */}
              {performanceMetrics && (
                <div className="flex items-center space-x-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span>Avg: {performanceMetrics.averageResponseTime?.toFixed(0)}ms</span>
                </div>
              )}

              {/* Refresh Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={loadInitialData}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ===== SYMBOL SELECTION & MARKET DATA ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Symbol Selection</CardTitle>
            <CardDescription>Select trading symbols and monitor market data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TradingSymbolSelector
              value={selectedSymbols}
              onValueChange={setSelectedSymbols}
              maxSelected={10}
              showPrices={true}
              showCategories={true}
            />

            {currentMarketData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="text-lg font-mono font-semibold">
                    ${currentMarketData.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">24h Change</div>
                  <div className={cn('text-lg font-semibold flex items-center gap-1',
                    currentMarketData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {currentMarketData.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {currentMarketData.changePercent >= 0 ? '+' : ''}{currentMarketData.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="text-lg font-mono">
                    {currentMarketData.volume >= 1000000 
                      ? `${(currentMarketData.volume / 1000000).toFixed(1)}M`
                      : `${(currentMarketData.volume / 1000).toFixed(1)}K`
                    }
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Spread</div>
                  <div className="text-lg font-mono">
                    ${(currentMarketData.ask - currentMarketData.bid).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paper Trading Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Paper Trading P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paperTradingMetrics ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    <span className={cn('font-semibold',
                      paperTradingMetrics.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      ${paperTradingMetrics.totalPnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-semibold">{paperTradingMetrics.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Trades</span>
                    <span className="font-semibold">{paperTradingMetrics.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="font-semibold">${paperTradingMetrics.balance.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <ProgressWithValue
                  value={paperTradingMetrics.winRate}
                  max={100}
                  label="Win Rate"
                  showPercentage={true}
                  color={paperTradingMetrics.winRate >= 60 ? 'green' : paperTradingMetrics.winRate >= 40 ? 'yellow' : 'red'}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No paper trading data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== MAIN TRADING INTERFACE ===== */}
      <Tabs defaultValue="order-entry" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="order-entry">Order Entry</TabsTrigger>
          <TabsTrigger value="market-data">Market Data</TabsTrigger>
          <TabsTrigger value="orders">Open Orders</TabsTrigger>
          <TabsTrigger value="order-book">Order Book</TabsTrigger>
        </TabsList>

        {/* Order Entry Tab */}
        <TabsContent value="order-entry" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Order Entry Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Entry</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAdvancedOrderEntry(!showAdvancedOrderEntry)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showAdvancedOrderEntry ? 'Simple' : 'Advanced'}
                  </Button>
                </div>
                <CardDescription>
                  Place orders across multiple exchanges with enhanced validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutoForm
                  schema={TradingOrderSchema}
                  onSubmit={handleOrderSubmit}
                  fieldConfig={{
                    symbol: {
                      orderIndex: 1,
                      fieldType: 'input',
                      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
                      description: 'Trading symbol (e.g., BTCUSD)'
                    },
                    side: {
                      orderIndex: 2,
                      fieldType: 'select',
                      options: [
                        { label: 'Buy', value: 'buy' },
                        { label: 'Sell', value: 'sell' }
                      ]
                    },
                    orderType: {
                      orderIndex: 3,
                      fieldType: 'select',
                      options: [
                        { label: 'Market', value: 'market' },
                        { label: 'Limit', value: 'limit' },
                        { label: 'Stop', value: 'stop' },
                        { label: 'Stop Limit', value: 'stop-limit' }
                      ]
                    },
                    quantity: {
                      orderIndex: 4,
                      fieldType: 'input',
                      icon: <Target className="h-4 w-4 text-muted-foreground" />
                    },
                    price: {
                      orderIndex: 5,
                      fieldType: 'currency',
                      description: 'Required for limit and stop-limit orders'
                    },
                    timeInForce: {
                      orderIndex: 6,
                      fieldType: 'select',
                      options: [
                        { label: 'Good Till Cancelled', value: 'GTC' },
                        { label: 'Immediate or Cancel', value: 'IOC' },
                        { label: 'Fill or Kill', value: 'FOK' },
                        { label: 'Day Order', value: 'DAY' }
                      ]
                    }
                  }}
                  defaultValues={{
                    symbol: selectedSymbol,
                    side: 'buy',
                    orderType: 'limit',
                    timeInForce: 'GTC',
                    reduceOnly: false
                  }}
                  submitText="Place Order"
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Price Range for Stop Loss/Take Profit */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>
                  Set stop-loss and take-profit levels with visual price range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PriceRangeSlider
                  priceRange={{
                    min: Math.max(0, currentPrice * 0.5),
                    max: currentPrice * 1.5,
                    current: currentPrice,
                    precision: 2
                  }}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  currentPrice={currentPrice}
                  symbol={selectedSymbol}
                  showPresets={true}
                  showRiskIndicators={true}
                  onApply={(range) => {
                    console.log('Applied price range:', range)
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Data Tab */}
        <TabsContent value="market-data">
          <Card>
            <CardHeader>
              <CardTitle>Live Market Data</CardTitle>
              <CardDescription>
                Real-time price feeds for selected symbols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                data={marketDataArray}
                columns={marketDataColumns}
                searchable={true}
                filterable={true}
                exportable={true}
                realTime={true}
                pageSize={20}
                emptyMessage="No market data available. Select symbols to monitor."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Open Orders</CardTitle>
              <CardDescription>
                Manage your active trading orders across all exchanges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                data={orders}
                columns={orderColumns}
                searchable={true}
                filterable={true}
                exportable={true}
                realTime={true}
                pageSize={15}
                emptyMessage="No open orders. Place an order to see it here."
                onRefresh={loadInitialData}
                refreshable={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Book Tab */}
        <TabsContent value="order-book">
          <Card>
            <CardHeader>
              <CardTitle>Order Book - {selectedSymbol}</CardTitle>
              <CardDescription>
                Real-time order book data with bid/ask levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orderBook ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Bids */}
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Bids</h4>
                    <div className="space-y-1">
                      {orderBook.bids.slice(0, 10).map((bid, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-mono text-green-600">${bid.price.toFixed(2)}</span>
                          <span className="font-mono">{bid.quantity.toFixed(4)}</span>
                          <span className="font-mono text-muted-foreground">
                            ${bid.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asks */}
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Asks</h4>
                    <div className="space-y-1">
                      {orderBook.asks.slice(0, 10).map((ask, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-mono text-red-600">${ask.price.toFixed(2)}</span>
                          <span className="font-mono">{ask.quantity.toFixed(4)}</span>
                          <span className="font-mono text-muted-foreground">
                            ${ask.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Loading order book for {selectedSymbol}...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== STATUS ALERTS ===== */}
      {connectionState === ConnectionState.ERROR && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            WebSocket connection error. Real-time updates are not available.
          </AlertDescription>
        </Alert>
      )}

      {connectionState === ConnectionState.RECONNECTING && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Reconnecting to real-time data feed...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default EnhancedTradingInterface