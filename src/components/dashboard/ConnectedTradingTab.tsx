'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
  CheckCircle2, Clock, RefreshCw, Zap, BarChart3, PieChart
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { paperTradingEngine, Order } from '@/lib/trading/real-paper-trading-engine'
import { toast } from 'react-hot-toast'
import RealTradingInterface from '@/components/trading/RealTradingInterface'
import TradingCharts from '@/components/charts/TradingCharts'
import { TradingForm } from '@/components/forms/trading-form'
import { TradingInterface } from '@/components/trading/TradingInterface'
import RealPortfolioAnalyticsDashboard from '@/components/portfolio/RealPortfolioAnalyticsDashboard'
import RealBacktestingDashboard from '@/components/backtesting/RealBacktestingDashboard'
import RealRiskManagementDashboard from '@/components/risk/RealRiskManagementDashboard'
import { motion, AnimatePresence } from 'framer-motion'

// Import Interactive Trading Chart
import InteractiveTradingChart from '@/components/charts/InteractiveTradingChartWrapper'

// Import market data services
import { useGlobalMarketData } from '@/lib/market/global-market-data-manager'
import { agentMarketDataService } from '@/lib/agents/agent-market-data-service'
import { MarketPrice, TradingSignal } from '@/types/market-data'

// Import premium trading components (existing only)
import { AdvancedOrderEntry } from '@/components/premium-ui/trading/advanced-order-entry'
import { AdvancedOrderBook } from '@/components/premium-ui/trading/advanced-orderbook'
import { EnhancedTradingInterface } from '@/components/premium-ui/trading/enhanced-trading-interface'
import { RiskManagementSuite } from '@/components/premium-ui/compliance/risk-management-suite'
import { AdvancedDataTable } from '@/components/premium-ui/tables/advanced-data-table'

// Live Market Data Trading Dashboard
const TradingDashboard = () => {
  const { prices, loading, error } = useGlobalMarketData(['BTC/USD', 'ETH/USD', 'SOL/USD', 'AAPL', 'TSLA', 'MSFT', 'NVDA'])
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD')
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([])
  
  const selectedPrice = prices.find(p => p.symbol === selectedSymbol)

  // Get agent trading signals
  useEffect(() => {
    const signals = agentMarketDataService.getActiveSignals('trading-dashboard')
    setTradingSignals(signals.slice(0, 5)) // Show top 5 signals
  }, [prices])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading market data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading market data: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {prices.slice(0, 4).map((price) => (
          <Card key={price.symbol} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSymbol(price.symbol)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{price.symbol}</span>
                <Badge variant={price.changePercent24h >= 0 ? 'default' : 'destructive'}>
                  {price.changePercent24h >= 0 ? '+' : ''}{price.changePercent24h.toFixed(2)}%
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                ${price.price.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: price.price > 100 ? 2 : 6 
                })}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                {price.changePercent24h >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                )}
                ${Math.abs(price.change24h).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Symbol Details */}
      {selectedPrice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {selectedPrice.symbol} - Live Trading Data
            </CardTitle>
            <CardDescription>
              Real-time market data and trading analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Price</Label>
                    <div className="text-2xl font-bold">
                      ${selectedPrice.price.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: selectedPrice.price > 100 ? 2 : 6 
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">24h Change</Label>
                    <div className={`text-2xl font-bold ${selectedPrice.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedPrice.changePercent24h >= 0 ? '+' : ''}{selectedPrice.changePercent24h.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">24h High</Label>
                    <div className="text-lg font-semibold">
                      ${selectedPrice.high24h?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">24h Low</Label>
                    <div className="text-lg font-semibold">
                      ${selectedPrice.low24h?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Volume 24h</Label>
                    <div className="text-lg font-semibold">
                      ${selectedPrice.volume24h?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Source</Label>
                    <div className="text-lg font-semibold">
                      {selectedPrice.source}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trading Signals */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <Label className="font-medium">AI Trading Signals</Label>
                </div>
                {tradingSignals.length > 0 ? (
                  <div className="space-y-2">
                    {tradingSignals.map((signal) => (
                      <div key={signal.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{signal.symbol}</span>
                          <Badge variant={
                            signal.type === 'buy' ? 'default' : 
                            signal.type === 'sell' ? 'destructive' : 'secondary'
                          }>
                            {signal.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Confidence: {signal.confidence.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {signal.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active trading signals</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const TradingTerminal = () => {
  const { prices, loading } = useGlobalMarketData()
  const [selectedPair, setSelectedPair] = useState('BTC/USD')
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')

  const selectedPrice = prices.find(p => p.symbol === selectedPair)

  const handlePlaceOrder = async () => {
    if (!selectedPrice || !amount) return

    try {
      // Create paper trading order
      const order: Order = {
        id: `order_${Date.now()}`,
        symbol: selectedPair,
        side,
        type: orderType,
        amount: parseFloat(amount),
        price: orderType === 'market' ? selectedPrice.price : parseFloat(price || '0'),
        status: 'pending',
        timestamp: new Date(),
        agentId: 'trading-terminal'
      }

      const result = await paperTradingEngine.placeOrder(order)
      if (result.success) {
        toast.success(`${side.toUpperCase()} order placed for ${amount} ${selectedPair}`)
        setAmount('')
        setPrice('')
      } else {
        toast.error(result.error || 'Failed to place order')
      }
    } catch (error) {
      toast.error('Failed to place order')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trading Terminal
        </CardTitle>
        <CardDescription>Live market data with order placement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Data */}
          <div className="space-y-4">
            <div>
              <Label>Select Trading Pair</Label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prices.map(price => (
                    <SelectItem key={price.symbol} value={price.symbol}>
                      {price.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPrice && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <div className="font-bold text-lg">
                      ${selectedPrice.price.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Change:</span>
                    <div className={`font-bold text-lg ${selectedPrice.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedPrice.changePercent24h >= 0 ? '+' : ''}{selectedPrice.changePercent24h.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">High 24h:</span>
                    <div className="font-semibold">
                      ${selectedPrice.high24h?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Low 24h:</span>
                    <div className="font-semibold">
                      ${selectedPrice.low24h?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Entry */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={side === 'buy' ? 'default' : 'outline'}
                onClick={() => setSide('buy')}
                className="flex-1"
              >
                Buy
              </Button>
              <Button
                variant={side === 'sell' ? 'destructive' : 'outline'}
                onClick={() => setSide('sell')}
                className="flex-1"
              >
                Sell
              </Button>
            </div>

            <div>
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {orderType !== 'market' && (
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handlePlaceOrder}
              disabled={!amount || loading || (orderType !== 'market' && !price)}
              className="w-full"
              variant={side === 'buy' ? 'default' : 'destructive'}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Place {side.toUpperCase()} Order
            </Button>

            {selectedPrice && amount && (
              <div className="p-3 border rounded-lg bg-muted/20">
                <div className="text-sm text-muted-foreground">Order Summary</div>
                <div className="font-semibold">
                  {side.toUpperCase()} {amount} {selectedPair}
                </div>
                <div className="text-sm">
                  Est. Total: ${((parseFloat(amount) || 0) * selectedPrice.price).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PositionManager = () => {
  const { prices } = useGlobalMarketData()
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current positions from paper trading engine
    const loadPositions = async () => {
      try {
        const portfolio = await paperTradingEngine.getPortfolio('trading-terminal')
        if (portfolio.success && portfolio.data) {
          setPositions(portfolio.data.positions || [])
        }
      } catch (error) {
        console.error('Failed to load positions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPositions()
    const interval = setInterval(loadPositions, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const calculatePnL = (position: any) => {
    const currentPrice = prices.find(p => p.symbol === position.symbol)
    if (!currentPrice) return { pnl: 0, pnlPercent: 0 }

    const pnl = (currentPrice.price - position.entryPrice) * position.quantity * (position.side === 'long' ? 1 : -1)
    const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100

    return { pnl, pnlPercent }
  }

  const totalPnL = positions.reduce((sum, pos) => sum + calculatePnL(pos).pnl, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Position Manager
        </CardTitle>
        <CardDescription>Live position tracking with real-time P&L</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading positions...</span>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No open positions</p>
            <p className="text-sm text-muted-foreground">Place some trades to see your positions here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Portfolio Summary */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Positions</div>
                  <div className="text-xl font-bold">{positions.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                  <div className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-xl font-bold text-blue-600">Active</div>
                </div>
              </div>
            </div>

            {/* Positions List */}
            <div className="space-y-3">
              {positions.map((position, index) => {
                const { pnl, pnlPercent } = calculatePnL(position)
                const currentPrice = prices.find(p => p.symbol === position.symbol)

                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{position.symbol}</span>
                        <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                          {position.side?.toUpperCase() || 'LONG'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </div>
                        <div className={`text-sm ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <div className="font-medium">{position.quantity?.toFixed(4) || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Entry Price:</span>
                        <div className="font-medium">${position.entryPrice?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current Price:</span>
                        <div className="font-medium">
                          ${currentPrice?.price.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Market Value:</span>
                        <div className="font-medium">
                          ${currentPrice ? (currentPrice.price * (position.quantity || 0)).toFixed(2) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Modify
                      </Button>
                      <Button size="sm" variant="destructive">
                        Close Position
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const RealTimeCharts = () => (
  <InteractiveTradingChart
    symbol="BTC/USD"
    width={800}
    height={400}
    className="w-full"
  />
)

interface ConnectedTradingTabProps {
  className?: string
}

export function ConnectedTradingTab({ className }: ConnectedTradingTabProps) {
  const { state, actions } = useDashboardConnection('trading')
  const [tradingSubTab, setTradingSubTab] = useState('real-trading')
  
  // Order placement state
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTC/USD',
    side: 'buy' as 'buy' | 'sell',
    type: 'market' as 'market' | 'limit',
    quantity: 0.1,
    price: 0,
    agentId: ''
  })
  
  // Live order book state
  const [orderBook, setOrderBook] = useState<{
    bids: Array<{ price: number; size: number; total: number }>
    asks: Array<{ price: number; size: number; total: number }>
  }>({
    bids: [],
    asks: []
  })
  
  // Generate mock order book data
  useEffect(() => {
    const updateOrderBook = () => {
      const basePrice = state.marketPrices.get(orderForm.symbol) || 45000
      
      // Generate bids (buy orders)
      const bids = []
      let bidTotal = 0
      for (let i = 0; i < 10; i++) {
        const price = basePrice - (i * 10)
        const size = Math.random() * 2
        bidTotal += size
        bids.push({ price, size, total: bidTotal })
      }
      
      // Generate asks (sell orders)
      const asks = []
      let askTotal = 0
      for (let i = 0; i < 10; i++) {
        const price = basePrice + ((i + 1) * 10)
        const size = Math.random() * 2
        askTotal += size
        asks.push({ price, size, total: askTotal })
      }
      
      setOrderBook({ bids, asks })
    }
    
    updateOrderBook()
    const interval = setInterval(updateOrderBook, 5000)
    return () => clearInterval(interval)
  }, [orderForm.symbol, state.marketPrices])
  
  // Paper trading panel component
  const PaperTradingPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Virtual Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(state.portfolioValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Initial: ${((state.totalAgents || 0) * 10000).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${state.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {state.totalPnL >= 0 ? '+' : ''}{(state.totalPnL || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(((state.totalPnL || 0) / Math.max(((state.totalAgents || 0) * 10000), 1)) * 100).toFixed(2)}% return
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.openPositions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {state.activeAgents} agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(state.winRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {state.executedOrders.length} total trades
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Placement */}
        <Card>
          <CardHeader>
            <CardTitle>Place Paper Order</CardTitle>
            <CardDescription>Execute trades with virtual funds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Symbol</Label>
                <Select value={orderForm.symbol} onValueChange={(v) => setOrderForm({...orderForm, symbol: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(state.marketPrices.keys()).map(symbol => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Side</Label>
                <Select value={orderForm.side} onValueChange={(v: 'buy' | 'sell') => setOrderForm({...orderForm, side: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order Type</Label>
                <Select value={orderForm.type} onValueChange={(v: 'market' | 'limit') => setOrderForm({...orderForm, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quantity</Label>
                <Input 
                  type="number" 
                  value={orderForm.quantity} 
                  onChange={(e) => setOrderForm({...orderForm, quantity: parseFloat(e.target.value)})}
                  step="0.01"
                />
              </div>
            </div>
            
            {orderForm.type === 'limit' && (
              <div>
                <Label>Limit Price</Label>
                <Input 
                  type="number" 
                  value={orderForm.price} 
                  onChange={(e) => setOrderForm({...orderForm, price: parseFloat(e.target.value)})}
                  placeholder={state.marketPrices.get(orderForm.symbol)?.toString() || 'Market Price'}
                />
              </div>
            )}
            
            <div>
              <Label>Agent</Label>
              <Select value={orderForm.agentId} onValueChange={(v) => setOrderForm({...orderForm, agentId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(state.agentPerformance.values()).map(agent => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      {agent.name} (${(agent.portfolioValue || 0).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                variant={orderForm.side === 'buy' ? 'default' : 'destructive'}
                onClick={() => {
                  if (!orderForm.agentId) {
                    toast.error('Please select an agent')
                    return
                  }
                  
                  actions.placeOrder(orderForm.agentId, {
                    symbol: orderForm.symbol,
                    side: orderForm.side,
                    type: orderForm.type,
                    quantity: orderForm.quantity,
                    price: orderForm.type === 'market' 
                      ? state.marketPrices.get(orderForm.symbol) || 0
                      : orderForm.price
                  })
                }}
              >
                {orderForm.side === 'buy' ? 'Buy' : 'Sell'} {orderForm.symbol}
              </Button>
              <Button variant="outline" onClick={actions.refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Order Book */}
        <Card>
          <CardHeader>
            <CardTitle>Order Book - {orderForm.symbol}</CardTitle>
            <CardDescription>Live market depth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <h4 className="font-medium text-sm text-green-600 mb-2">Bids</h4>
                <div className="space-y-1">
                  {orderBook.bids.slice(0, 8).map((bid, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{(bid.size || 0).toFixed(4)}</span>
                      <span className="font-medium text-green-600">${(bid.price || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Asks */}
              <div>
                <h4 className="font-medium text-sm text-red-600 mb-2">Asks</h4>
                <div className="space-y-1">
                  {orderBook.asks.slice(0, 8).map((ask, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-red-600">${(ask.price || 0).toFixed(2)}</span>
                      <span className="text-muted-foreground">{(ask.size || 0).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Spread */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spread</span>
                <span className="font-medium">
                  ${orderBook.asks[0] && orderBook.bids[0] 
                    ? ((orderBook.asks[0].price || 0) - (orderBook.bids[0].price || 0)).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Market Price</span>
                <span className="font-medium">
                  ${(state.marketPrices.get(orderForm.symbol) || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Paper Trades</CardTitle>
          <CardDescription>Latest executed orders from all agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {state.executedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trades executed yet. Place an order to start trading.
              </p>
            ) : (
              state.executedOrders.slice(0, 10).map((order) => {
                const agent = state.agentPerformance.get(order.agentId)
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        order.side === 'buy' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.symbol}</span>
                          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'} className="text-xs">
                            {order.side.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent?.name || 'Unknown Agent'} • {order.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{order.quantity} @ ${(order.price || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        Total: ${((order.quantity || 0) * (order.price || 0)).toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Strategy panel component
  const TradingStrategiesPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Momentum', 'Mean Reversion', 'Arbitrage'].map((strategy) => {
          const strategyAgents = Array.from(state.agentPerformance.values()).filter(
            agent => agent.name.toLowerCase().includes(strategy.toLowerCase())
          )
          const totalValue = strategyAgents.reduce((sum, agent) => sum + (agent.portfolioValue || 0), 0)
          const totalPnL = strategyAgents.reduce((sum, agent) => sum + (agent.pnl || 0), 0)
          
          return (
            <Card key={strategy}>
              <CardHeader>
                <CardTitle className="text-lg">{strategy}</CardTitle>
                <CardDescription>{strategyAgents.length} agents active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-medium">${(totalValue || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">P&L</span>
                    <span className={`font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPnL >= 0 ? '+' : ''}{(totalPnL || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Win Rate</span>
                    <span className="font-medium">
                      {strategyAgents.length > 0 
                        ? (strategyAgents.reduce((sum, a) => sum + (a.winRate || 0), 0) / Math.max(strategyAgents.length, 1)).toFixed(1)
                        : '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Momentum', 'Mean Reversion', 'Arbitrage', 'Market Making', 'Trend Following'].map((strategy) => {
              const performance = Math.random() * 30 - 5 // Mock performance
              return (
                <div key={strategy} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{strategy}</span>
                    <span className={`text-sm ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performance >= 0 ? '+' : ''}{(performance || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${performance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(performance) * 3}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const tradingSubTabs = [
    { id: 'trading-dashboard', label: 'Premium Dashboard', component: <TradingDashboard /> },
    { id: 'enhanced-trading', label: 'Enhanced Trading', component: <EnhancedTradingInterface /> },
    { id: 'advanced-order', label: 'Advanced Orders', component: <AdvancedOrderEntry /> },
    { id: 'advanced-orderbook', label: 'Advanced OrderBook', component: <AdvancedOrderBook /> },
    { id: 'trading-terminal', label: 'Trading Terminal', component: <TradingTerminal /> },
    { id: 'position-manager', label: 'Position Manager', component: <PositionManager /> },
    { id: 'realtime-charts', label: 'Real-time Charts', component: <RealTimeCharts /> },
    { id: 'premium-risk', label: 'Premium Risk', component: <RiskManagementSuite /> },
    { id: 'advanced-data', label: 'Advanced Data', component: <AdvancedDataTable /> },
    { id: 'real-trading', label: 'Real Trading', component: <RealTradingInterface /> },
    { id: 'charts', label: 'Charts', component: <TradingCharts /> },
    { id: 'live-trading', label: 'Live Trading', component: <TradingInterface /> },
    { id: 'paper-trading', label: 'Paper Trading', component: <PaperTradingPanel /> },
    { id: 'portfolio', label: 'Portfolio', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'strategies', label: 'Strategies', component: <TradingStrategiesPanel /> },
    { id: 'backtesting', label: 'Backtesting', component: <RealBacktestingDashboard /> },
    { id: 'risk', label: 'Risk Monitor', component: <RealRiskManagementDashboard /> }
  ]
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Unified Trading Interface
          <Badge variant="secondary" className="text-xs">Premium Enhanced</Badge>
        </CardTitle>
        <CardDescription>Live trading, paper trading, and strategy management connected to {state.activeAgents} active agents • Premium Components Integrated</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tradingSubTab} onValueChange={setTradingSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 bg-green-50">
            {tradingSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900 text-xs"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <AnimatePresence mode="wait">
            {tradingSubTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.component}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ConnectedTradingTab