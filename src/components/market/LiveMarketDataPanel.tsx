/**
 * Live Market Data Panel
 * Real-time market data display with technical indicators and trading signals
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  Signal,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react'

interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  bid?: number
  ask?: number
  high24h?: number
  low24h?: number
  timestamp: string
  provider: string
}

interface TechnicalIndicators {
  symbol: string
  rsi?: number
  macd?: number
  macdSignal?: number
  sma20?: number
  sma50?: number
  sma200?: number
  bollingerUpper?: number
  bollingerMiddle?: number
  bollingerLower?: number
  atr?: number
  timestamp: string
}

interface TradingSignal {
  symbol: string
  signalType: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  source: string
  reasoning: string
  timeframe: string
  riskScore?: number
  timestamp: string
}

interface MarketOverview {
  marketStatus: string
  majorIndices: Record<string, number>
  marketSentiment: number
  volatilityIndex?: number
  sectorPerformance: Record<string, number>
  trendingSymbols: string[]
  topGainers: string[]
  topLosers: string[]
  timestamp: string
}

export function LiveMarketDataPanel() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC-USD', 'ETH-USD', 'SPY'])
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({})
  const [technicalData, setTechnicalData] = useState<Record<string, TechnicalIndicators>>({})
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([])
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [error, setError] = useState<string | null>(null)

  // Fetch real-time price data
  const fetchPriceData = useCallback(async () => {
    try {
      const response = await fetch('/api/market/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: selectedSymbols })
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const quotes = await response.json()
      const priceMap: Record<string, PriceData> = {}
      
      quotes.forEach((quote: any) => {
        priceMap[quote.symbol] = {
          symbol: quote.symbol,
          price: quote.price,
          change: quote.change || 0,
          changePercent: quote.change_percent || 0,
          volume: quote.volume || 0,
          bid: quote.bid,
          ask: quote.ask,
          high24h: quote.high_24h,
          low24h: quote.low_24h,
          timestamp: quote.timestamp,
          provider: quote.provider
        }
      })
      
      setPriceData(priceMap)
      setLastUpdate(new Date())
      setError(null)
      
    } catch (err) {
      console.error('Error fetching price data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price data')
    }
  }, [selectedSymbols])

  // Fetch technical indicators
  const fetchTechnicalData = useCallback(async () => {
    try {
      const technicalPromises = selectedSymbols.map(async (symbol) => {
        const response = await fetch(`/api/market/technical-analysis/${symbol}`)
        if (!response.ok) return null
        const data = await response.json()
        return { symbol, ...data }
      })
      
      const results = await Promise.all(technicalPromises)
      const technicalMap: Record<string, TechnicalIndicators> = {}
      
      results.forEach((result) => {
        if (result) {
          technicalMap[result.symbol] = result
        }
      })
      
      setTechnicalData(technicalMap)
      
    } catch (err) {
      console.error('Error fetching technical data:', err)
    }
  }, [selectedSymbols])

  // Fetch trading signals
  const fetchTradingSignals = useCallback(async () => {
    try {
      const signalPromises = selectedSymbols.map(async (symbol) => {
        const response = await fetch(`/api/market/trading-signals/${symbol}`)
        if (!response.ok) return []
        return await response.json()
      })
      
      const results = await Promise.all(signalPromises)
      const allSignals = results.flat()
      
      setTradingSignals(allSignals)
      
    } catch (err) {
      console.error('Error fetching trading signals:', err)
    }
  }, [selectedSymbols])

  // Fetch market overview
  const fetchMarketOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/market/overview')
      if (!response.ok) return
      
      const overview = await response.json()
      setMarketOverview(overview)
      
    } catch (err) {
      console.error('Error fetching market overview:', err)
    }
  }, [])

  // Auto-refresh data
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        fetchPriceData()
        fetchTechnicalData()
        fetchTradingSignals()
        fetchMarketOverview()
      }, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    }
  }, [isStreaming, fetchPriceData, fetchTechnicalData, fetchTradingSignals, fetchMarketOverview])

  // Initial load
  useEffect(() => {
    fetchPriceData()
    fetchTechnicalData()
    fetchTradingSignals()
    fetchMarketOverview()
  }, [fetchPriceData, fetchTechnicalData, fetchTradingSignals, fetchMarketOverview])

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  const getRSIColor = (rsi?: number) => {
    if (!rsi) return 'gray'
    if (rsi < 30) return 'green' // Oversold
    if (rsi > 70) return 'red'   // Overbought
    return 'blue' // Normal
  }

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return 'green'
      case 'SELL': return 'red'
      default: return 'gray'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Live Market Data</h2>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={isStreaming ? "default" : "outline"}
            size="sm"
            onClick={toggleStreaming}
          >
            {isStreaming ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isStreaming ? 'Pause' : 'Start'} Stream
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchPriceData()
              fetchTechnicalData()
              fetchTradingSignals()
              fetchMarketOverview()
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Overview */}
      {marketOverview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Market Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {marketOverview.marketStatus}
                </div>
                <div className="text-sm text-gray-500">Market Status</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(marketOverview.marketSentiment * 100).toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">Sentiment Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {marketOverview.trendingSymbols.length}
                </div>
                <div className="text-sm text-gray-500">Trending</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(marketOverview.majorIndices).length}
                </div>
                <div className="text-sm text-gray-500">Indices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prices">Live Prices</TabsTrigger>
          <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
          <TabsTrigger value="signals">Trading Signals</TabsTrigger>
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
        </TabsList>

        {/* Live Prices Tab */}
        <TabsContent value="prices" className="space-y-4">
          <div className="grid gap-4">
            {selectedSymbols.map((symbol) => {
              const price = priceData[symbol]
              if (!price) return null

              return (
                <Card key={symbol}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-bold text-lg">{symbol}</div>
                          <div className="text-sm text-gray-500">{price.provider}</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatPrice(price.price)}
                          </div>
                          <div className={`text-sm ${price.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {price.change >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                            {formatPercent(price.changePercent)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {price.bid && (
                          <div>
                            <div className="text-gray-500">Bid</div>
                            <div className="font-semibold">{formatPrice(price.bid)}</div>
                          </div>
                        )}
                        {price.ask && (
                          <div>
                            <div className="text-gray-500">Ask</div>
                            <div className="font-semibold">{formatPrice(price.ask)}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-500">Volume</div>
                          <div className="font-semibold">{price.volume.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">24h Range</div>
                          <div className="font-semibold">
                            {price.low24h && price.high24h && 
                              `${formatPrice(price.low24h)} - ${formatPrice(price.high24h)}`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Technical Analysis Tab */}
        <TabsContent value="technical" className="space-y-4">
          <div className="grid gap-4">
            {selectedSymbols.map((symbol) => {
              const technical = technicalData[symbol]
              if (!technical) return null

              return (
                <Card key={symbol}>
                  <CardHeader>
                    <CardTitle>{symbol} - Technical Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {technical.rsi && (
                        <div>
                          <div className="text-sm text-gray-500">RSI (14)</div>
                          <div className={`text-lg font-bold text-${getRSIColor(technical.rsi)}-600`}>
                            {technical.rsi.toFixed(2)}
                          </div>
                          <Progress value={technical.rsi} className="h-2 mt-1" />
                        </div>
                      )}
                      
                      {technical.macd && (
                        <div>
                          <div className="text-sm text-gray-500">MACD</div>
                          <div className="text-lg font-bold">
                            {technical.macd.toFixed(4)}
                          </div>
                          {technical.macdSignal && (
                            <div className="text-xs text-gray-500">
                              Signal: {technical.macdSignal.toFixed(4)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {technical.sma20 && (
                        <div>
                          <div className="text-sm text-gray-500">SMA 20</div>
                          <div className="text-lg font-bold">
                            {formatPrice(technical.sma20)}
                          </div>
                        </div>
                      )}
                      
                      {technical.sma50 && (
                        <div>
                          <div className="text-sm text-gray-500">SMA 50</div>
                          <div className="text-lg font-bold">
                            {formatPrice(technical.sma50)}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Trading Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {tradingSignals.map((signal, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant={signal.signalType === 'BUY' ? 'default' : signal.signalType === 'SELL' ? 'destructive' : 'secondary'}>
                          {signal.signalType}
                        </Badge>
                        
                        <div>
                          <div className="font-semibold">{signal.symbol}</div>
                          <div className="text-sm text-gray-500">{signal.source}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {(signal.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      {signal.reasoning}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Timeframe: {signal.timeframe}</span>
                      <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tradingSignals.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <Signal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div>No trading signals available</div>
                    <div className="text-sm">Signals will appear when market conditions are favorable</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Market Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {marketOverview && (
            <div className="grid gap-4">
              {/* Major Indices */}
              <Card>
                <CardHeader>
                  <CardTitle>Major Indices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(marketOverview.majorIndices).map(([symbol, price]) => (
                      <div key={symbol} className="text-center">
                        <div className="font-semibold">{symbol}</div>
                        <div className="text-lg">{formatPrice(price)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Sector Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Sector Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(marketOverview.sectorPerformance).map(([sector, performance]) => (
                      <div key={sector} className="flex items-center justify-between">
                        <span>{sector}</span>
                        <span className={`font-semibold ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(performance * 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}