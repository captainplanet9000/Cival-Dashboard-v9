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

// Import premium trading components (existing only)
import { AdvancedOrderEntry } from '@/components/premium-ui/trading/advanced-order-entry'
import { AdvancedOrderBook } from '@/components/premium-ui/trading/advanced-orderbook'
import { EnhancedTradingInterface } from '@/components/premium-ui/trading/enhanced-trading-interface'
import { RiskManagementSuite } from '@/components/premium-ui/compliance/risk-management-suite'
import { AdvancedDataTable } from '@/components/premium-ui/tables/advanced-data-table'

// Placeholder components for missing premium trading features
const TradingDashboard = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Premium Trading Dashboard</CardTitle>
        <CardDescription>Advanced trading interface with real-time data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Premium trading dashboard coming soon...</p>
      </CardContent>
    </Card>
  </div>
)

const TradingTerminal = () => (
  <Card>
    <CardHeader>
      <CardTitle>Trading Terminal</CardTitle>
      <CardDescription>Professional trading terminal interface</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Trading terminal coming soon...</p>
    </CardContent>
  </Card>
)

const PositionManager = () => (
  <Card>
    <CardHeader>
      <CardTitle>Position Manager</CardTitle>
      <CardDescription>Advanced position management tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Position manager coming soon...</p>
    </CardContent>
  </Card>
)

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