'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  Database,
  Globe,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { chainlinkService, ChainlinkPriceData } from '@/lib/chainlink/price-feeds'
import { MarketData } from '@/types/paper-trading.types'

interface ChainlinkMarketDataProps {
  onPriceUpdate?: (marketData: MarketData[]) => void
  className?: string
}

export function ChainlinkMarketData({ onPriceUpdate, className }: ChainlinkMarketDataProps) {
  const [priceData, setPriceData] = useState<ChainlinkPriceData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [useTestnet, setUseTestnet] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const symbols = ['ETH/USD', 'BTC/USD', 'LINK/USD', 'UNI/USD', 'AAVE/USD']

  useEffect(() => {
    fetchInitialPrices()
    const cleanup = startPriceSubscription()
    return cleanup
  }, [useTestnet])

  const fetchInitialPrices = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const service = await chainlinkService.get()
      const prices = await service.getMultiplePrices(symbols)
      setPriceData(prices)
      setIsConnected(true)
      setLastUpdate(new Date())
      
      // Convert to MarketData format and notify parent
      if (onPriceUpdate) {
        const marketDataArray = prices.map(price => ({
          symbol: price.symbol,
          price: price.price,
          volume: 1000000 + Math.random() * 5000000,
          change24h: (Math.random() - 0.5) * 0.1 * price.price,
          changePercent24h: (Math.random() - 0.5) * 10,
          high24h: price.price * (1 + Math.random() * 0.05),
          low24h: price.price * (1 - Math.random() * 0.05),
          marketCap: price.price * (10000000 + Math.random() * 90000000),
          timestamp: price.updatedAt,
          source: price.source,
          chainlinkData: {
            roundId: price.roundId,
            decimals: price.decimals,
            updatedAt: price.updatedAt
          }
        }))
        onPriceUpdate(marketDataArray)
      }
    } catch (err) {
      setError('Failed to fetch Chainlink prices')
      setIsConnected(false)
      console.error('Chainlink fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const startPriceSubscription = () => {
    const subscribeAsync = async () => {
      const service = await chainlinkService.get()
      return service.subscribeToPriceUpdates(
        symbols,
        (prices: ChainlinkPriceData[]) => {
        setPriceData(prices)
        setLastUpdate(new Date())
        setIsConnected(true)
        
        if (onPriceUpdate) {
          const marketDataArray = prices.map(price => ({
            symbol: price.symbol,
            price: price.price,
            volume: 1000000 + Math.random() * 5000000,
            change24h: (Math.random() - 0.5) * 0.1 * price.price,
            changePercent24h: (Math.random() - 0.5) * 10,
            high24h: price.price * (1 + Math.random() * 0.05),
            low24h: price.price * (1 - Math.random() * 0.05),
            marketCap: price.price * (10000000 + Math.random() * 90000000),
            timestamp: price.updatedAt,
            source: price.source,
            chainlinkData: {
              roundId: price.roundId,
              decimals: price.decimals,
              updatedAt: price.updatedAt
            }
          }))
          onPriceUpdate(marketDataArray)
        }
      }
      )
    }
    
    let cleanup = () => {}
    subscribeAsync().then(unsub => {
      cleanup = unsub
    })
    
    return () => cleanup()
  }

  const handleNetworkSwitch = async (testnet: boolean) => {
    setUseTestnet(testnet)
    const service = await chainlinkService.get()
    service.switchNetwork(testnet)
    fetchInitialPrices()
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'chainlink-mainnet':
        return <LinkIcon className="h-4 w-4 text-blue-600" />
      case 'chainlink-testnet':
        return <Database className="h-4 w-4 text-orange-600" />
      case 'fallback':
        return <Globe className="h-4 w-4 text-gray-600" />
      default:
        return <Zap className="h-4 w-4 text-purple-600" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'chainlink-mainnet':
        return 'Mainnet'
      case 'chainlink-testnet':
        return 'Testnet'
      case 'fallback':
        return 'Fallback'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Chainlink Price Feeds</CardTitle>
              <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Network Switch */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Mainnet</span>
                <Switch 
                  checked={useTestnet} 
                  onCheckedChange={handleNetworkSwitch}
                />
                <span className="text-sm text-gray-600">Testnet</span>
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInitialPrices}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span>{isConnected ? 'Live Data' : 'Disconnected'}</span>
              </div>
              
              {lastUpdate && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            
            <Badge variant="outline" className="text-xs">
              {useTestnet ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
            </Badge>
          </div>
        </CardHeader>
        
        {error && (
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Price Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {priceData.map((price, index) => (
          <motion.div
            key={price.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">{price.symbol}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {getSourceIcon(price.source)}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Source: {getSourceLabel(price.source)}</p>
                          <p>Round ID: {price.roundId}</p>
                          <p>Decimals: {price.decimals}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {getSourceLabel(price.source)}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    ${price.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: price.symbol.includes('BTC') ? 0 : 2
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Updated: {price.updatedAt.toLocaleTimeString()}</span>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Live</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {isLoading && priceData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Loading Chainlink Price Feeds</p>
              <p className="text-sm text-gray-600">
                Connecting to {useTestnet ? 'testnet' : 'mainnet'} price oracles...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ChainlinkMarketData