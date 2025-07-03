'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Activity, TrendingUp, TrendingDown, Plus, Settings,
  Wifi, WifiOff, RefreshCw, DollarSign, BarChart3,
  ArrowRightLeft, AlertTriangle, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { exchangeManager, type ExchangeConnection, type ArbitrageOpportunity, type MultiExchangeMarketData } from '@/lib/exchanges/exchange-manager'

interface ExchangeManagerDashboardProps {
  isConnected?: boolean
}

export function ExchangeManagerDashboard({ isConnected = false }: ExchangeManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [exchanges, setExchanges] = useState<ExchangeConnection[]>([])
  const [marketData, setMarketData] = useState<{ [symbol: string]: MultiExchangeMarketData }>({})
  const [arbitrageOps, setArbitrageOps] = useState<ArbitrageOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newExchangeConfig, setNewExchangeConfig] = useState({
    id: '',
    type: 'hyperliquid' as const,
    apiKey: '',
    testnet: true
  })

  // Monitored symbols
  const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'AAPL', 'MSFT']

  useEffect(() => {
    // Initialize with demo exchanges
    initializeDemoExchanges()
    loadMarketData()
    findArbitrageOpportunities()

    const interval = setInterval(() => {
      loadMarketData()
      findArbitrageOpportunities()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const initializeDemoExchanges = async () => {
    try {
      // Add Hyperliquid testnet
      await exchangeManager.addExchange('hyperliquid_testnet', 'hyperliquid', {
        testnet: true
      })

      // Add Interactive Brokers paper trading
      await exchangeManager.addExchange('ib_paper', 'interactive_brokers', {
        paperTrading: true,
        host: 'localhost',
        port: 7497
      })

      updateExchangesList()
    } catch (error) {
      console.error('Error initializing demo exchanges:', error)
    }
  }

  const updateExchangesList = () => {
    setExchanges(exchangeManager.getAllExchanges())
  }

  const loadMarketData = async () => {
    const data: { [symbol: string]: MultiExchangeMarketData } = {}
    
    for (const symbol of symbols) {
      try {
        const multiData = await exchangeManager.getMultiExchangeMarketData(symbol)
        if (multiData) {
          data[symbol] = multiData
        }
      } catch (error) {
        console.error(`Error loading market data for ${symbol}:`, error)
      }
    }
    
    setMarketData(data)
  }

  const findArbitrageOpportunities = async () => {
    try {
      const opportunities = await exchangeManager.findArbitrageOpportunities(symbols)
      setArbitrageOps(opportunities.slice(0, 10)) // Top 10
    } catch (error) {
      console.error('Error finding arbitrage opportunities:', error)
    }
  }

  const addExchange = async () => {
    if (!newExchangeConfig.id) return

    setIsLoading(true)
    try {
      const config = newExchangeConfig.type === 'hyperliquid' 
        ? { testnet: newExchangeConfig.testnet, apiKey: newExchangeConfig.apiKey }
        : { paperTrading: true, host: 'localhost', port: 7497 }

      await exchangeManager.addExchange(
        newExchangeConfig.id,
        newExchangeConfig.type,
        config
      )

      updateExchangesList()
      setNewExchangeConfig({ id: '', type: 'hyperliquid', apiKey: '', testnet: true })
    } catch (error) {
      console.error('Error adding exchange:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeExchange = async (id: string) => {
    try {
      await exchangeManager.removeExchange(id)
      updateExchangesList()
    } catch (error) {
      console.error('Error removing exchange:', error)
    }
  }

  const healthCheckAll = async () => {
    setIsLoading(true)
    try {
      await exchangeManager.healthCheckAll()
      updateExchangesList()
    } catch (error) {
      console.error('Error in health check:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectedExchanges = exchanges.filter(e => e.isConnected)
  const totalVolume = Object.values(marketData).reduce((sum, data) => sum + data.totalVolume, 0)
  const avgSpread = arbitrageOps.length > 0 
    ? arbitrageOps.reduce((sum, op) => sum + op.spreadPercentage, 0) / arbitrageOps.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exchange Manager</h2>
          <p className="text-muted-foreground">
            Multi-exchange trading and arbitrage opportunities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={connectedExchanges.length > 0 ? 'default' : 'secondary'}>
            {connectedExchanges.length} Connected
          </Badge>
          <Button onClick={healthCheckAll} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Exchanges</p>
                  <p className="text-2xl font-bold">{connectedExchanges.length}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold">${(totalVolume / 1000000).toFixed(1)}M</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Arbitrage Ops</p>
                  <p className="text-2xl font-bold">{arbitrageOps.length}</p>
                </div>
                <ArrowRightLeft className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Spread</p>
                  <p className="text-2xl font-bold">{avgSpread.toFixed(3)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="market-data">Market Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exchange Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Exchange Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exchanges.map((exchange) => (
                    <div key={exchange.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {exchange.isConnected ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{exchange.name}</p>
                          <p className="text-sm text-muted-foreground">{exchange.id}</p>
                        </div>
                      </div>
                      <Badge variant={exchange.isConnected ? 'default' : 'secondary'}>
                        {exchange.isConnected ? 'Connected' : 'Offline'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Arbitrage Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Top Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {arbitrageOps.slice(0, 5).map((op, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{op.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {op.buyExchange} → {op.sellExchange}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+{op.spreadPercentage.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">${op.profitPotential.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exchanges" className="space-y-4">
          {/* Add New Exchange */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Exchange
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="exchange-id">Exchange ID</Label>
                  <Input
                    id="exchange-id"
                    value={newExchangeConfig.id}
                    onChange={(e) => setNewExchangeConfig(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="unique-id"
                  />
                </div>
                <div>
                  <Label htmlFor="exchange-type">Type</Label>
                  <Select
                    value={newExchangeConfig.type}
                    onValueChange={(value: 'hyperliquid' | 'interactive_brokers') => 
                      setNewExchangeConfig(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hyperliquid">Hyperliquid</SelectItem>
                      <SelectItem value="interactive_brokers">Interactive Brokers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="api-key">API Key (Optional)</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={newExchangeConfig.apiKey}
                    onChange={(e) => setNewExchangeConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="optional"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="testnet"
                    checked={newExchangeConfig.testnet}
                    onChange={(e) => setNewExchangeConfig(prev => ({ ...prev, testnet: e.target.checked }))}
                  />
                  <Label htmlFor="testnet">Testnet</Label>
                </div>
                <Button onClick={addExchange} disabled={isLoading || !newExchangeConfig.id} className="mt-6">
                  Add Exchange
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exchange List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exchanges.map((exchange) => (
              <Card key={exchange.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{exchange.name}</h3>
                      <div className="flex items-center gap-2">
                        {exchange.isConnected ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={exchange.isConnected ? 'default' : 'secondary'}>
                          {exchange.isConnected ? 'Connected' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ID: {exchange.id}</p>
                      <p className="text-sm text-muted-foreground">Type: {exchange.type}</p>
                      {exchange.lastError && (
                        <p className="text-sm text-red-500">Error: {exchange.lastError}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExchange(exchange.id)}
                      className="w-full"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arbitrage Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {arbitrageOps.map((op, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{op.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            Buy: {op.buyExchange} @ ${op.buyPrice.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Sell: {op.sellExchange} @ ${op.sellPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            +{op.spreadPercentage.toFixed(3)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${op.spread.toFixed(2)} spread
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${op.profitPotential.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Est. Profit</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Exchange Market Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(marketData).map(([symbol, data]) => (
                  <div key={symbol} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{symbol}</h3>
                      <div className="text-right">
                        <p className="font-bold">${data.avgPrice.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Avg Price</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(data.exchanges).map(([exchangeId, exchangeData]) => (
                        <div key={exchangeId} className="p-3 bg-background rounded border">
                          <p className="font-medium text-sm">{exchangeId}</p>
                          <p className="text-lg font-bold">${exchangeData.price.toFixed(2)}</p>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Bid: ${exchangeData.bid.toFixed(2)}</span>
                            <span>Ask: ${exchangeData.ask.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
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

export default ExchangeManagerDashboard