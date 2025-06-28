'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity,
  Bot,
  ArrowUpIcon,
  ArrowDownIcon,
  Clock,
  Target
} from 'lucide-react'
import { 
  getMockDataService, 
  type MockPriceData, 
  type MockPortfolioPosition,
  type MockTrade,
  type MockAgentPerformance,
  type MockSymbol,
  MOCK_SYMBOLS
} from '@/lib/mock/comprehensive-mock-data'

export default function PaperTradingDashboard() {
  const [priceData, setPriceData] = useState<MockPriceData[]>([])
  const [portfolio, setPortfolio] = useState<MockPortfolioPosition[]>([])
  const [trades, setTrades] = useState<MockTrade[]>([])
  const [agents, setAgents] = useState<MockAgentPerformance[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null)
  const [marketSummary, setMarketSummary] = useState<any>(null)

  // Trading form state
  const [selectedSymbol, setSelectedSymbol] = useState<MockSymbol>('BTC/USD')
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState('')

  const mockService = getMockDataService()

  useEffect(() => {
    // Initial data load
    updateAllData()

    // Set up real-time updates every 2 seconds
    const interval = setInterval(() => {
      updateAllData()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const updateAllData = () => {
    setPriceData(mockService.getPriceData())
    setPortfolio(mockService.getPortfolio())
    setTrades(mockService.getTradeHistory(10))
    setAgents(mockService.getAgentPerformance())
    setPortfolioSummary(mockService.getPortfolioSummary())
    setMarketSummary(mockService.getMarketSummary())
  }

  const executeTrade = () => {
    if (!quantity || parseFloat(quantity) <= 0) return

    const trade = mockService.simulateTrade(selectedSymbol, tradeType, parseFloat(quantity))
    setQuantity('')
    updateAllData()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Paper Trading Dashboard</h1>
          <p className="text-muted-foreground">Complete simulation environment with real-time mock data</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="w-4 h-4 mr-1" />
          Live Simulation
        </Badge>
      </div>

      {/* Portfolio Summary Cards */}
      {portfolioSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                {portfolioSummary.positionsCount} positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
              {portfolioSummary.totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioSummary.totalPnL)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(portfolioSummary.totalPnLPercent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.cash)}</div>
              <p className="text-xs text-muted-foreground">
                Ready for trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.filter(a => a.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">
                of {agents.length} total agents
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trading" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Execute Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Symbol</label>
                  <Select value={selectedSymbol} onValueChange={(value) => setSelectedSymbol(value as MockSymbol)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_SYMBOLS.map(symbol => (
                        <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Side</label>
                  <Select value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <Button 
                  onClick={executeTrade} 
                  className="w-full"
                  disabled={!quantity || parseFloat(quantity) <= 0}
                >
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trades.slice(0, 8).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        {trade.side === 'buy' ? (
                          <ArrowUpIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.quantity.toFixed(4)} @ {formatCurrency(trade.price)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{formatCurrency(trade.quantity * trade.price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {trade.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.map((position) => (
                  <div key={position.symbol} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {position.quantity.toFixed(4)} units @ {formatCurrency(position.averagePrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(position.marketValue)}</div>
                      <div className={`text-sm ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(position.unrealizedPnL)} ({formatPercent(position.unrealizedPnLPercent)})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Data Tab */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Market Data</CardTitle>
              {marketSummary && (
                <p className="text-sm text-muted-foreground">
                  {marketSummary.gainers} gainers, {marketSummary.losers} losers
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceData.map((data) => (
                  <div key={data.symbol} className="p-4 border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{data.symbol}</div>
                      <Badge variant={data.changePercent24h >= 0 ? "default" : "destructive"}>
                        {formatPercent(data.changePercent24h)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatCurrency(data.price)}</div>
                    <div className="text-sm text-muted-foreground">
                      24h: {formatCurrency(data.low24h)} - {formatCurrency(data.high24h)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.agentId} className="p-4 border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.totalTrades} trades • {formatPercent(agent.winRate * 100)} win rate
                        </div>
                      </div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total P&L</div>
                        <div className={`font-medium ${agent.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(agent.totalPnL)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Sharpe Ratio</div>
                        <div className="font-medium">{agent.sharpeRatio.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max Drawdown</div>
                        <div className="font-medium">{formatPercent(-agent.maxDrawdown * 100)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}