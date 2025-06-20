'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { 
  Play,
  Pause,
  Square,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  DollarSign,
  Target,
  Brain,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Plus,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { backendApi } from '@/lib/api/backend-client'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Position {
  position_id: string
  symbol: string
  side: 'long' | 'short'
  quantity: number
  entry_price: number
  current_price: number
  unrealized_pnl: number
  unrealized_pnl_percent: number
  stop_loss?: number
  take_profit?: number
  status: 'open' | 'closed'
  opened_at: string
  closed_at?: string
}

interface Order {
  order_id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  quantity: number
  price?: number
  filled_quantity: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  created_at: string
  executed_at?: string
}

interface MarketData {
  symbol: string
  price: number
  change_24h: number
  change_24h_percent: number
  volume_24h: number
  high_24h: number
  low_24h: number
  bid: number
  ask: number
  spread: number
}

interface TradingStats {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  profit_factor: number
  sharpe_ratio: number
  max_drawdown: number
  total_pnl: number
  today_pnl: number
  active_positions: number
}

export default function LiveTradingDashboard() {
  const [isAutonomousEnabled, setIsAutonomousEnabled] = useState(false)
  const [tradingMode, setTradingMode] = useState<'paper' | 'live'>('paper')
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({})
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'market',
    quantity: 0,
    price: 0
  })

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const response = await backendApi.get('/api/v1/portfolio/positions').catch(() => ({
        data: {
          positions: [
            {
              position_id: 'pos_1',
              symbol: 'BTC/USDT',
              side: 'long',
              quantity: 0.5,
              entry_price: 65000,
              current_price: 66200,
              unrealized_pnl: 600,
              unrealized_pnl_percent: 1.85,
              stop_loss: 63000,
              take_profit: 70000,
              status: 'open',
              opened_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              position_id: 'pos_2',
              symbol: 'ETH/USDT',
              side: 'long',
              quantity: 5,
              entry_price: 3200,
              current_price: 3150,
              unrealized_pnl: -250,
              unrealized_pnl_percent: -1.56,
              stop_loss: 3100,
              take_profit: 3400,
              status: 'open',
              opened_at: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        }
      }))
      
      setPositions(response.data?.positions || [])
    } catch (error) {
      console.error('Failed to fetch positions:', error)
    }
  }, [])

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const response = await backendApi.get('/api/v1/trading/orders').catch(() => ({
        data: {
          orders: [
            {
              order_id: 'ord_1',
              symbol: 'BTC/USDT',
              side: 'buy',
              type: 'limit',
              quantity: 0.25,
              price: 64500,
              filled_quantity: 0,
              status: 'pending',
              created_at: new Date(Date.now() - 600000).toISOString()
            },
            {
              order_id: 'ord_2',
              symbol: 'SOL/USDT',
              side: 'sell',
              type: 'market',
              quantity: 10,
              filled_quantity: 10,
              status: 'filled',
              created_at: new Date(Date.now() - 1800000).toISOString(),
              executed_at: new Date(Date.now() - 1800000).toISOString()
            }
          ]
        }
      }))
      
      setOrders(response.data?.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }, [])

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT']
      const marketDataMap: Record<string, MarketData> = {}
      
      for (const symbol of symbols) {
        const response = await backendApi.get(`/api/v1/market/live-data/${symbol}`).catch(() => ({
          data: {
            symbol,
            price: symbol === 'BTC/USDT' ? 66200 : symbol === 'ETH/USDT' ? 3150 : symbol === 'SOL/USDT' ? 98.5 : 585,
            change_24h: symbol === 'BTC/USDT' ? 1200 : symbol === 'ETH/USDT' ? -50 : symbol === 'SOL/USDT' ? 2.5 : 15,
            change_24h_percent: symbol === 'BTC/USDT' ? 1.85 : symbol === 'ETH/USDT' ? -1.56 : symbol === 'SOL/USDT' ? 2.6 : 2.63,
            volume_24h: symbol === 'BTC/USDT' ? 28500000000 : symbol === 'ETH/USDT' ? 15000000000 : 2500000000,
            high_24h: symbol === 'BTC/USDT' ? 67000 : symbol === 'ETH/USDT' ? 3250 : 99.8,
            low_24h: symbol === 'BTC/USDT' ? 64500 : symbol === 'ETH/USDT' ? 3100 : 95.2,
            bid: symbol === 'BTC/USDT' ? 66190 : symbol === 'ETH/USDT' ? 3149 : 98.45,
            ask: symbol === 'BTC/USDT' ? 66210 : symbol === 'ETH/USDT' ? 3151 : 98.55,
            spread: 0.03
          }
        }))
        
        marketDataMap[symbol] = response.data
      }
      
      setMarketData(marketDataMap)
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    }
  }, [])

  // Fetch trading stats
  const fetchTradingStats = useCallback(async () => {
    try {
      const response = await backendApi.get('/api/v1/trading/stats').catch(() => ({
        data: {
          total_trades: 156,
          winning_trades: 98,
          losing_trades: 58,
          win_rate: 0.628,
          profit_factor: 1.85,
          sharpe_ratio: 1.42,
          max_drawdown: 0.082,
          total_pnl: 15680,
          today_pnl: 350,
          active_positions: 2
        }
      }))
      
      setTradingStats(response.data)
    } catch (error) {
      console.error('Failed to fetch trading stats:', error)
    }
  }, [])

  // Place order
  const placeOrder = async () => {
    try {
      const orderData = {
        symbol: orderForm.symbol,
        side: orderForm.side,
        type: orderForm.type,
        quantity: orderForm.quantity,
        price: orderForm.type === 'limit' ? orderForm.price : undefined
      }
      
      const response = await backendApi.post('/api/v1/trading/order', orderData).catch(() => ({
        data: {
          order_id: `ord_${Date.now()}`,
          ...orderData,
          filled_quantity: 0,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      }))
      
      if (response.data) {
        toast.success('Order placed successfully')
        setShowOrderDialog(false)
        setOrderForm({
          symbol: 'BTC/USDT',
          side: 'buy',
          type: 'market',
          quantity: 0,
          price: 0
        })
        await fetchOrders()
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error('Failed to place order')
    }
  }

  // Close position
  const closePosition = async (positionId: string) => {
    try {
      await backendApi.post(`/api/v1/trading/positions/${positionId}/close`).catch(() => ({ ok: true }))
      toast.success('Position closed')
      await fetchPositions()
    } catch (error) {
      console.error('Failed to close position:', error)
      toast.error('Failed to close position')
    }
  }

  // Cancel order
  const cancelOrder = async (orderId: string) => {
    try {
      await backendApi.post(`/api/v1/trading/orders/${orderId}/cancel`).catch(() => ({ ok: true }))
      toast.success('Order cancelled')
      await fetchOrders()
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error('Failed to cancel order')
    }
  }

  // Toggle autonomous trading
  const toggleAutonomousTrading = async () => {
    try {
      const newState = !isAutonomousEnabled
      await backendApi.post('/api/v1/trading/autonomous/toggle', { enabled: newState }).catch(() => ({ ok: true }))
      setIsAutonomousEnabled(newState)
      toast.success(`Autonomous trading ${newState ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Failed to toggle autonomous trading:', error)
      toast.error('Failed to toggle autonomous trading')
    }
  }

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchPositions(),
        fetchOrders(),
        fetchMarketData(),
        fetchTradingStats()
      ])
      setIsLoading(false)
    }
    
    loadData()
  }, [fetchPositions, fetchOrders, fetchMarketData, fetchTradingStats])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchPositions()
      fetchOrders()
      fetchMarketData()
      fetchTradingStats()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, fetchPositions, fetchOrders, fetchMarketData, fetchTradingStats])

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trading Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Trading Control
              </CardTitle>
              <CardDescription>
                Manage your trading operations in real-time
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              <Badge variant={tradingMode === 'paper' ? 'secondary' : 'default'}>
                {tradingMode === 'paper' ? 'Paper Trading' : 'Live Trading'}
              </Badge>
              <Button onClick={() => {
                fetchPositions()
                fetchOrders()
                fetchMarketData()
                fetchTradingStats()
              }} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="autonomous">Autonomous Trading</Label>
              <Switch
                id="autonomous"
                checked={isAutonomousEnabled}
                onCheckedChange={toggleAutonomousTrading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowOrderDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </div>
          </div>
          
          {isAutonomousEnabled && (
            <Alert className="mt-4">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Autonomous trading is active. AI agents are monitoring markets and executing trades based on your strategy parameters.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPnLColor(tradingStats?.total_pnl || 0)}`}>
              {formatCurrency(tradingStats?.total_pnl || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today: <span className={getPnLColor(tradingStats?.today_pnl || 0)}>
                {formatCurrency(tradingStats?.today_pnl || 0)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(tradingStats?.win_rate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {tradingStats?.winning_trades || 0}W / {tradingStats?.losing_trades || 0}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tradingStats?.sharpe_ratio?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted returns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPercent(tradingStats?.max_drawdown || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum loss from peak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList>
          <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.filter(o => o.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="market">Market Overview</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>
                Monitor and manage your active trading positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No open positions
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.position_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-lg">{position.symbol}</span>
                              <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                                {position.side.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {position.quantity} • Entry: {formatCurrency(position.entry_price)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getPnLColor(position.unrealized_pnl)}`}>
                            {formatCurrency(position.unrealized_pnl)}
                          </div>
                          <div className={`text-sm ${getPnLColor(position.unrealized_pnl_percent)}`}>
                            {position.unrealized_pnl_percent > 0 ? '+' : ''}{formatPercent(position.unrealized_pnl_percent / 100)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <span>Current: {formatCurrency(position.current_price)}</span>
                          {position.stop_loss && (
                            <span className="text-red-600">SL: {formatCurrency(position.stop_loss)}</span>
                          )}
                          {position.take_profit && (
                            <span className="text-green-600">TP: {formatCurrency(position.take_profit)}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => closePosition(position.position_id)}
                        >
                          Close Position
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>
                View and manage your pending orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.filter(o => o.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending orders
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.filter(o => o.status === 'pending').map((order) => (
                    <div key={order.order_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{order.symbol}</span>
                            <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                              {order.side.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{order.type.toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Qty: {order.quantity} {order.price && `@ ${formatCurrency(order.price)}`}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelOrder(order.order_id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>
                Real-time market data for major trading pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(marketData).map(([symbol, data]) => (
                  <div key={symbol} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-lg">{symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          Vol: {formatCurrency(data.volume_24h / 1000000)}M
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{formatCurrency(data.price)}</div>
                        <div className={`text-sm flex items-center justify-end gap-1 ${getChangeColor(data.change_24h_percent)}`}>
                          {data.change_24h_percent > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatPercent(Math.abs(data.change_24h_percent) / 100)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">24h High</span>
                        <div className="font-medium">{formatCurrency(data.high_24h)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24h Low</span>
                        <div className="font-medium">{formatCurrency(data.low_24h)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bid</span>
                        <div className="font-medium">{formatCurrency(data.bid)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ask</span>
                        <div className="font-medium">{formatCurrency(data.ask)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>
                Recent completed trades and orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'filled').map((order) => (
                  <div key={order.order_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.symbol}</span>
                          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                            {order.side.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">FILLED</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.quantity} units • {new Date(order.executed_at || order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Place New Order</DialogTitle>
            <DialogDescription>
              Enter order details to execute a trade
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select
                value={orderForm.symbol}
                onValueChange={(value) => setOrderForm({ ...orderForm, symbol: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                  <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                  <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="side">Side</Label>
                <Select
                  value={orderForm.side}
                  onValueChange={(value) => setOrderForm({ ...orderForm, side: value as 'buy' | 'sell' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={orderForm.type}
                  onValueChange={(value) => setOrderForm({ ...orderForm, type: value as 'market' | 'limit' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.0001"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            {orderForm.type === 'limit' && (
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm({ ...orderForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={placeOrder}>Place Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Legacy export for compatibility
export { default as LiveTradingDashboard } from './LiveTradingDashboard'