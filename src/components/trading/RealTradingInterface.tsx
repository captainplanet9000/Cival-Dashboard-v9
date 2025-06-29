'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  Activity
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  MarketPrice,
  Order
} from '@/lib/trading/real-paper-trading-engine'

interface RealTradingInterfaceProps {
  className?: string
}

interface OrderForm {
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  quantity: string
  price: string
  stopPrice: string
}

export function RealTradingInterface({ className }: RealTradingInterfaceProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const [orderForm, setOrderForm] = useState<OrderForm>({
    agentId: '',
    symbol: '',
    side: 'buy',
    type: 'market',
    quantity: '',
    price: '',
    stopPrice: ''
  })

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Load initial data
    loadAgents()
    loadMarketPrices()
    loadRecentOrders()

    // Listen for engine events
    const handlePricesUpdated = (prices: MarketPrice[]) => {
      setMarketPrices(prices)
    }

    const handleOrderPlaced = (order: Order) => {
      setRecentOrders(prev => [order, ...prev.slice(0, 19)]) // Keep last 20 orders
      setOrderStatus({
        type: 'success',
        message: `Order placed: ${order.side} ${order.quantity} ${order.symbol}`
      })
      setTimeout(() => setOrderStatus({ type: null, message: '' }), 3000)
    }

    const handleOrderFilled = (order: Order) => {
      setRecentOrders(prev => prev.map(o => o.id === order.id ? order : o))
      loadAgents() // Refresh agent data
    }

    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)
    paperTradingEngine.on('orderPlaced', handleOrderPlaced)
    paperTradingEngine.on('orderFilled', handleOrderFilled)

    // Update data every 5 seconds
    const interval = setInterval(() => {
      loadAgents()
      loadRecentOrders()
    }, 5000)

    return () => {
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      paperTradingEngine.off('orderPlaced', handleOrderPlaced)
      paperTradingEngine.off('orderFilled', handleOrderFilled)
      clearInterval(interval)
    }
  }, [])

  const loadAgents = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)
    
    // Auto-select first active agent if none selected
    if (!selectedAgent && allAgents.length > 0) {
      const activeAgent = allAgents.find(a => a.status === 'active') || allAgents[0]
      setSelectedAgent(activeAgent.id)
      setOrderForm(prev => ({ ...prev, agentId: activeAgent.id }))
    }
  }

  const loadMarketPrices = () => {
    const prices = paperTradingEngine.getAllMarketPrices()
    setMarketPrices(prices)
    
    // Auto-select first symbol if none selected
    if (!orderForm.symbol && prices.length > 0) {
      setOrderForm(prev => ({ ...prev, symbol: prices[0].symbol }))
    }
  }

  const loadRecentOrders = () => {
    const allOrders: Order[] = []
    agents.forEach(agent => {
      allOrders.push(...agent.portfolio.orders)
    })
    
    // Sort by creation time, most recent first
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setRecentOrders(allOrders.slice(0, 20))
  }

  const handleSubmitOrder = async () => {
    if (!orderForm.agentId || !orderForm.symbol || !orderForm.quantity) {
      setOrderStatus({
        type: 'error',
        message: 'Please fill in all required fields'
      })
      return
    }

    const quantity = parseFloat(orderForm.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      setOrderStatus({
        type: 'error',
        message: 'Invalid quantity'
      })
      return
    }

    let price: number | undefined
    let stopPrice: number | undefined

    if (orderForm.type === 'limit' || orderForm.type === 'stop_limit') {
      price = parseFloat(orderForm.price)
      if (isNaN(price) || price <= 0) {
        setOrderStatus({
          type: 'error',
          message: 'Invalid price'
        })
        return
      }
    }

    if (orderForm.type === 'stop' || orderForm.type === 'stop_limit') {
      stopPrice = parseFloat(orderForm.stopPrice)
      if (isNaN(stopPrice) || stopPrice <= 0) {
        setOrderStatus({
          type: 'error',
          message: 'Invalid stop price'
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      await paperTradingEngine.placeOrder(orderForm.agentId, {
        symbol: orderForm.symbol,
        type: orderForm.type,
        side: orderForm.side,
        quantity,
        price,
        stopPrice
      })

      // Reset form
      setOrderForm(prev => ({
        ...prev,
        quantity: '',
        price: '',
        stopPrice: ''
      }))
    } catch (error) {
      setOrderStatus({
        type: 'error',
        message: `Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentPrice = (symbol: string): number => {
    const marketPrice = marketPrices.find(p => p.symbol === symbol)
    return marketPrice?.price || 0
  }

  const calculateOrderValue = (): number => {
    const quantity = parseFloat(orderForm.quantity) || 0
    const price = orderForm.type === 'market' 
      ? getCurrentPrice(orderForm.symbol)
      : parseFloat(orderForm.price) || 0
    
    return quantity * price
  }

  const getSelectedAgent = (): TradingAgent | undefined => {
    return agents.find(a => a.id === selectedAgent)
  }

  const canPlaceOrder = (): boolean => {
    const agent = getSelectedAgent()
    if (!agent || agent.status !== 'active') return false
    
    if (orderForm.side === 'buy') {
      const orderValue = calculateOrderValue()
      return agent.portfolio.cash >= orderValue
    }
    
    // For sell orders, check if agent has position
    const position = agent.portfolio.positions.find(p => p.symbol === orderForm.symbol)
    return position ? position.quantity >= parseFloat(orderForm.quantity || '0') : false
  }

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'filled':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'cancelled':
        return 'text-gray-600 bg-gray-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Placement */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Place Order</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agent Selection */}
              <div>
                <Label htmlFor="agent">Trading Agent</Label>
                <Select
                  value={selectedAgent}
                  onValueChange={(value) => {
                    setSelectedAgent(value)
                    setOrderForm(prev => ({ ...prev, agentId: value }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <span>{agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            ${agent.portfolio.cash.toFixed(0)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol Selection */}
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Select
                  value={orderForm.symbol}
                  onValueChange={(value) => setOrderForm(prev => ({ ...prev, symbol: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketPrices.map((price) => (
                      <SelectItem key={price.symbol} value={price.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <span>{price.symbol}</span>
                          <span className="text-sm text-gray-600">
                            ${price.price.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Side and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Side</Label>
                  <Tabs value={orderForm.side} onValueChange={(value: 'buy' | 'sell') => 
                    setOrderForm(prev => ({ ...prev, side: value }))
                  }>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="buy" className="text-green-600">Buy</TabsTrigger>
                      <TabsTrigger value="sell" className="text-red-600">Sell</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={orderForm.type}
                    onValueChange={(value: OrderForm['type']) => setOrderForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                      <SelectItem value="stop_limit">Stop Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0.00"
                  step="0.001"
                />
              </div>

              {/* Price (for limit orders) */}
              {(orderForm.type === 'limit' || orderForm.type === 'stop_limit') && (
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}

              {/* Stop Price (for stop orders) */}
              {(orderForm.type === 'stop' || orderForm.type === 'stop_limit') && (
                <div>
                  <Label htmlFor="stopPrice">Stop Price</Label>
                  <Input
                    id="stopPrice"
                    type="number"
                    value={orderForm.stopPrice}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, stopPrice: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}

              {/* Order Value */}
              {orderForm.quantity && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Estimated Value:</span>
                    <span className="font-medium">${calculateOrderValue().toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmitOrder}
                disabled={!canPlaceOrder() || isSubmitting}
                className={`w-full ${orderForm.side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    {orderForm.side === 'buy' ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
                    {orderForm.side === 'buy' ? 'Buy' : 'Sell'} {orderForm.symbol}
                  </>
                )}
              </Button>

              {/* Status Message */}
              {orderStatus.type && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  orderStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {orderStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{orderStatus.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Market Data & Order Book */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Market Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Live Market Prices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {marketPrices.slice(0, 10).map((price) => (
                    <motion.div
                      key={price.symbol}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        orderForm.symbol === price.symbol ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderForm(prev => ({ ...prev, symbol: price.symbol }))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm font-medium">{price.symbol}</div>
                      <div className="text-lg font-bold">${price.price.toFixed(2)}</div>
                      <div className={`text-xs flex items-center ${
                        price.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {price.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>Recent Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant={order.side === 'buy' ? 'default' : 'secondary'}>
                            {order.side}
                          </Badge>
                          <div>
                            <div className="font-medium">{order.symbol}</div>
                            <div className="text-sm text-gray-600">
                              {order.quantity} @ {order.price ? `$${order.price}` : 'Market'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTradingInterface