'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CandlestickChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Volume2,
  Signal,
  Wifi,
  WifiOff
} from 'lucide-react'
import {
  paperTradingEngine,
  MarketPrice
} from '@/lib/trading/real-paper-trading-engine'

interface RealMarketDataDashboardProps {
  className?: string
}

interface MarketDataPoint {
  timestamp: string
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

interface TechnicalIndicator {
  name: string
  value: number
  signal: 'bullish' | 'bearish' | 'neutral'
  description: string
}

interface MarketSentiment {
  symbol: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  score: number
  volume: number
  momentum: number
  support: number
  resistance: number
  rsi: number
  macd: number
}

interface WatchlistItem {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  alerts: boolean
  favorite: boolean
}

interface MarketAlert {
  id: string
  symbol: string
  type: 'price' | 'volume' | 'change' | 'technical'
  condition: string
  value: number
  triggered: boolean
  timestamp: Date
}

export function RealMarketDataDashboard({ className }: RealMarketDataDashboardProps) {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h')
  const [chartData, setChartData] = useState<MarketDataPoint[]>([])
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([])
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([])
  const [isLiveUpdates, setIsLiveUpdates] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Load initial market data
    loadMarketData()
    
    // Listen for price updates
    const handlePricesUpdated = (prices: MarketPrice[]) => {
      setMarketPrices(prices)
      updateChartData(prices)
      updateMarketSentiment(prices)
      checkMarketAlerts(prices)
    }

    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)

    // Update market data every 5 seconds
    const interval = setInterval(() => {
      if (isLiveUpdates) {
        loadMarketData()
      }
    }, 5000)

    return () => {
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      clearInterval(interval)
    }
  }, [isLiveUpdates, selectedTimeframe])

  const loadMarketData = () => {
    const prices = paperTradingEngine.getAllMarketPrices()
    setMarketPrices(prices)
    
    if (prices.length > 0) {
      // Auto-select first symbol if none selected
      if (!selectedSymbol && prices.length > 0) {
        setSelectedSymbol(prices[0].symbol)
      }
      
      updateChartData(prices)
      updateTechnicalIndicators(prices)
      updateMarketSentiment(prices)
      updateWatchlist(prices)
    }
  }

  const updateChartData = (prices: MarketPrice[]) => {
    // Generate candlestick data for the selected symbol
    const symbolPrice = prices.find(p => p.symbol === selectedSymbol)
    if (!symbolPrice) return

    const timeframes = {
      '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440
    }
    
    const minutes = timeframes[selectedTimeframe]
    const points = selectedTimeframe === '1d' ? 30 : selectedTimeframe === '4h' ? 48 : 100
    
    const newChartData: MarketDataPoint[] = []
    const basePrice = symbolPrice.price
    let currentPrice = basePrice
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date()
      timestamp.setMinutes(timestamp.getMinutes() - (i * minutes))
      
      // Generate realistic OHLC data
      const volatility = 0.02 // 2% volatility
      const trend = (Math.random() - 0.5) * 0.001 // Small trend
      
      const open = currentPrice
      const priceMove = (Math.random() - 0.5) * volatility * basePrice
      const high = open + Math.abs(priceMove) + (Math.random() * 0.01 * basePrice)
      const low = open - Math.abs(priceMove) - (Math.random() * 0.01 * basePrice)
      const close = open + priceMove + (trend * basePrice)
      
      currentPrice = close
      
      newChartData.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString(),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        change: close - open,
        changePercent: ((close - open) / open) * 100
      })
    }
    
    setChartData(newChartData)
  }

  const updateTechnicalIndicators = (prices: MarketPrice[]) => {
    const symbolPrice = prices.find(p => p.symbol === selectedSymbol)
    if (!symbolPrice) return

    // Generate realistic technical indicators
    const indicators: TechnicalIndicator[] = [
      {
        name: 'RSI (14)',
        value: 30 + Math.random() * 40, // 30-70 range
        signal: Math.random() > 0.5 ? 'bullish' : 'bearish',
        description: 'Relative Strength Index momentum oscillator'
      },
      {
        name: 'MACD',
        value: (Math.random() - 0.5) * 10,
        signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish',
        description: 'Moving Average Convergence Divergence'
      },
      {
        name: 'Bollinger Bands',
        value: Math.random() * 100,
        signal: Math.random() > 0.7 ? 'bullish' : 'neutral',
        description: 'Price volatility and momentum indicator'
      },
      {
        name: 'Moving Average (20)',
        value: symbolPrice.price * (0.98 + Math.random() * 0.04),
        signal: symbolPrice.price > (symbolPrice.price * 0.99) ? 'bullish' : 'bearish',
        description: '20-period simple moving average'
      },
      {
        name: 'Stochastic',
        value: Math.random() * 100,
        signal: Math.random() > 0.4 ? 'bullish' : 'bearish',
        description: 'Momentum oscillator comparing closing price'
      },
      {
        name: 'Williams %R',
        value: -Math.random() * 100,
        signal: Math.random() > 0.5 ? 'neutral' : 'bearish',
        description: 'Momentum indicator measuring overbought/oversold'
      }
    ]
    
    setTechnicalIndicators(indicators)
  }

  const updateMarketSentiment = (prices: MarketPrice[]) => {
    const sentiment: MarketSentiment[] = prices.map(price => {
      const rsi = 30 + Math.random() * 40
      const macd = (Math.random() - 0.5) * 5
      const momentum = (Math.random() - 0.5) * 20
      
      let sentimentScore = 50 // Base neutral
      if (rsi > 60) sentimentScore += 20
      if (rsi < 40) sentimentScore -= 20
      if (macd > 0) sentimentScore += 15
      if (momentum > 0) sentimentScore += 10
      
      const finalScore = Math.max(0, Math.min(100, sentimentScore))
      
      return {
        symbol: price.symbol,
        sentiment: finalScore > 60 ? 'bullish' : finalScore < 40 ? 'bearish' : 'neutral',
        score: finalScore,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        momentum,
        support: price.price * (0.95 + Math.random() * 0.03),
        resistance: price.price * (1.02 + Math.random() * 0.03),
        rsi,
        macd
      }
    })
    
    setMarketSentiment(sentiment)
  }

  const updateWatchlist = (prices: MarketPrice[]) => {
    const watchlistItems: WatchlistItem[] = prices.map(price => ({
      symbol: price.symbol,
      price: price.price,
      change: price.change24h,
      changePercent: (price.change24h / price.price) * 100,
      volume: Math.floor(Math.random() * 100000000) + 10000000,
      marketCap: price.price * (Math.random() * 1000000000 + 100000000),
      alerts: Math.random() > 0.7,
      favorite: Math.random() > 0.8
    }))
    
    setWatchlist(watchlistItems)
  }

  const checkMarketAlerts = (prices: MarketPrice[]) => {
    // Generate sample market alerts
    const alerts: MarketAlert[] = []
    
    prices.forEach(price => {
      if (Math.random() > 0.95) { // 5% chance of alert
        alerts.push({
          id: `alert_${Date.now()}_${price.symbol}`,
          symbol: price.symbol,
          type: Math.random() > 0.5 ? 'price' : 'volume',
          condition: Math.random() > 0.5 ? 'above' : 'below',
          value: price.price,
          triggered: true,
          timestamp: new Date()
        })
      }
    })
    
    setMarketAlerts(prev => [...prev, ...alerts].slice(-20)) // Keep last 20 alerts
  }

  const addToWatchlist = (symbol: string) => {
    const symbolData = marketPrices.find(p => p.symbol === symbol)
    if (!symbolData) return

    const newItem: WatchlistItem = {
      symbol,
      price: symbolData.price,
      change: symbolData.change24h,
      changePercent: (symbolData.change24h / symbolData.price) * 100,
      volume: Math.floor(Math.random() * 100000000) + 10000000,
      marketCap: symbolData.price * (Math.random() * 1000000000 + 100000000),
      alerts: false,
      favorite: false
    }
    
    setWatchlist(prev => [...prev, newItem])
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'text-green-600 bg-green-100'
      case 'bearish': return 'text-red-600 bg-red-100'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600'
      case 'bearish': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const filteredMarketData = marketPrices.filter(price =>
    price.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedSymbolData = marketPrices.find(p => p.symbol === selectedSymbol)

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
              Market Data Dashboard
            </h2>
            <p className="text-sm text-gray-600">Real-time market analysis with advanced charting and technical indicators</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLiveUpdates ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-600">
                {isLiveUpdates ? 'Live' : 'Paused'}
              </span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLiveUpdates(!isLiveUpdates)}
            >
              {isLiveUpdates ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
              {isLiveUpdates ? 'Live' : 'Paused'}
            </Button>
            
            <Button size="sm" onClick={loadMarketData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Market Alerts */}
        {marketAlerts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Market Alerts ({marketAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {marketAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium">{alert.symbol}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        {alert.type} {alert.condition} ${alert.value.toFixed(2)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Symbol Selection and Timeframe */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select symbol" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketPrices.map((price) => (
                          <SelectItem key={price.symbol} value={price.symbol}>
                            <div className="flex items-center justify-between w-full">
                              <span>{price.symbol}</span>
                              <span className="text-sm text-gray-600 ml-4">
                                ${price.price.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedSymbolData && (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">${selectedSymbolData.price.toFixed(2)}</span>
                        <div className={`flex items-center ${
                          selectedSymbolData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedSymbolData.change24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          <span className="font-medium">
                            {selectedSymbolData.change24h >= 0 ? '+' : ''}${selectedSymbolData.change24h.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((timeframe) => (
                      <Button
                        key={timeframe}
                        size="sm"
                        variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className="text-xs px-2 py-1"
                      >
                        {timeframe}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#666"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#666" 
                        fontSize={12}
                        domain={['dataMin - 10', 'dataMax + 10']}
                      />
                      <Tooltip 
                        labelFormatter={(value) => `Time: ${value}`}
                        formatter={(value: number, name: string) => [
                          `$${value.toFixed(2)}`, 
                          name === 'close' ? 'Price' : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#2563eb" 
                        strokeWidth={2} 
                        dot={false}
                        name="Price"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="high" 
                        stroke="#16a34a" 
                        strokeWidth={1} 
                        dot={false}
                        name="High"
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="low" 
                        stroke="#dc2626" 
                        strokeWidth={1} 
                        dot={false}
                        name="Low"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Technical Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Signal className="h-5 w-5 text-purple-600" />
                  <span>Technical Indicators</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {technicalIndicators.map((indicator, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{indicator.name}</span>
                        <Badge className={getSignalColor(indicator.signal)}>
                          {indicator.signal}
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {indicator.value.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {indicator.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Market Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-gray-600" />
                  <span>Market Search</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search Symbol</Label>
                    <Input
                      id="search"
                      placeholder="e.g. BTC, ETH, SOL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredMarketData.slice(0, 10).map((price) => (
                      <div
                        key={price.symbol}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          price.symbol === selectedSymbol ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSymbol(price.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{price.symbol}</span>
                          <span className="text-sm">${price.price.toFixed(2)}</span>
                        </div>
                        <div className={`text-xs ${
                          price.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span>Market Sentiment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketSentiment.slice(0, 8).map((sentiment) => (
                    <div key={sentiment.symbol} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{sentiment.symbol}</div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={getSentimentColor(sentiment.sentiment)}>
                            {sentiment.sentiment}
                          </span>
                          <span className="text-gray-600">
                            RSI: {sentiment.rsi.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{sentiment.score.toFixed(0)}</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              sentiment.score > 60 ? 'bg-green-500' :
                              sentiment.score < 40 ? 'bg-red-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${sentiment.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Markets:</span>
                    <span className="font-medium">{marketPrices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bullish Signals:</span>
                    <span className="font-medium text-green-600">
                      {marketSentiment.filter(s => s.sentiment === 'bullish').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bearish Signals:</span>
                    <span className="font-medium text-red-600">
                      {marketSentiment.filter(s => s.sentiment === 'bearish').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Alerts:</span>
                    <span className="font-medium text-yellow-600">{marketAlerts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Update:</span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealMarketDataDashboard