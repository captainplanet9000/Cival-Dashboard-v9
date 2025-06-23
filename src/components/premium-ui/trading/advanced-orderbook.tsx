'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  RefreshCw,
  Filter,
  Layers,
  Target,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

export interface OrderBookLevel {
  price: number
  quantity: number
  total: number
  count?: number
  timestamp?: Date
}

export interface OrderBookData {
  symbol: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  lastUpdateId: number
  timestamp: Date
}

export interface RecentTrade {
  id: string
  price: number
  quantity: number
  side: 'buy' | 'sell'
  timestamp: Date
  isMaker?: boolean
}

export interface MarketDepth {
  price: number
  cumulativeVolume: number
  percentage: number
  side: 'bid' | 'ask'
}

export interface AdvancedOrderBookProps {
  data: OrderBookData
  recentTrades: RecentTrade[]
  currentPrice: number
  onLevelClick?: (level: OrderBookLevel, side: 'bid' | 'ask') => void
  onPriceClick?: (price: number) => void
  className?: string
  precision?: number
  maxLevels?: number
  showDepthChart?: boolean
  showTrades?: boolean
  showSpread?: boolean
  groupingOptions?: number[]
  theme?: 'default' | 'pro' | 'minimal'
  updateInterval?: number
}

// Premium themes for the order book
const ORDERBOOK_THEMES = {
  default: {
    bidColor: 'rgb(34, 197, 94)',
    askColor: 'rgb(239, 68, 68)',
    bidBg: 'rgba(34, 197, 94, 0.1)',
    askBg: 'rgba(239, 68, 68, 0.1)',
    textColor: 'rgb(15, 23, 42)',
    mutedColor: 'rgb(100, 116, 139)',
    borderColor: 'rgb(226, 232, 240)'
  },
  pro: {
    bidColor: 'rgb(0, 255, 127)',
    askColor: 'rgb(255, 69, 58)',
    bidBg: 'rgba(0, 255, 127, 0.15)',
    askBg: 'rgba(255, 69, 58, 0.15)',
    textColor: 'rgb(255, 255, 255)',
    mutedColor: 'rgb(156, 163, 175)',
    borderColor: 'rgb(55, 65, 81)'
  },
  minimal: {
    bidColor: 'rgb(16, 185, 129)',
    askColor: 'rgb(220, 38, 38)',
    bidBg: 'rgba(16, 185, 129, 0.05)',
    askBg: 'rgba(220, 38, 38, 0.05)',
    textColor: 'rgb(17, 24, 39)',
    mutedColor: 'rgb(107, 114, 128)',
    borderColor: 'rgb(229, 231, 235)'
  }
}

export function AdvancedOrderBook({
  data,
  recentTrades,
  currentPrice,
  onLevelClick,
  onPriceClick,
  className,
  precision = 2,
  maxLevels = 20,
  showDepthChart = true,
  showTrades = true,
  showSpread = true,
  groupingOptions = [0.01, 0.1, 1, 10],
  theme = 'default',
  updateInterval = 100
}: AdvancedOrderBookProps) {
  const [grouping, setGrouping] = useState(groupingOptions[0])
  const [showOnlyMyOrders, setShowOnlyMyOrders] = useState(false)
  const [flashUpdates, setFlashUpdates] = useState(true)
  const [depthPercentage, setDepthPercentage] = useState([100])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const [priceFilter, setPriceFilter] = useState<{ min?: number; max?: number }>({})
  
  const prevDataRef = useRef<OrderBookData | null>(null)
  const updateAnimationRef = useRef<Map<string, boolean>>(new Map())

  const currentTheme = ORDERBOOK_THEMES[theme]

  // Group order book levels based on grouping setting
  const groupedOrderBook = useMemo(() => {
    const groupLevel = (level: OrderBookLevel) => {
      const groupedPrice = Math.floor(level.price / grouping) * grouping
      return { ...level, price: groupedPrice }
    }

    const groupLevels = (levels: OrderBookLevel[]) => {
      const grouped = new Map<number, OrderBookLevel>()
      
      levels.forEach(level => {
        const groupedLevel = groupLevel(level)
        const existing = grouped.get(groupedLevel.price)
        
        if (existing) {
          grouped.set(groupedLevel.price, {
            ...existing,
            quantity: existing.quantity + level.quantity,
            total: existing.total + level.total,
            count: (existing.count || 0) + (level.count || 1)
          })
        } else {
          grouped.set(groupedLevel.price, groupedLevel)
        }
      })
      
      return Array.from(grouped.values())
    }

    return {
      bids: groupLevels(data.bids)
        .sort((a, b) => b.price - a.price)
        .slice(0, maxLevels),
      asks: groupLevels(data.asks)
        .sort((a, b) => a.price - b.price)
        .slice(0, maxLevels)
    }
  }, [data, grouping, maxLevels])

  // Calculate market depth data for visualization
  const marketDepth = useMemo(() => {
    const calculateDepth = (levels: OrderBookLevel[], side: 'bid' | 'ask') => {
      let cumulativeVolume = 0
      return levels.map(level => {
        cumulativeVolume += level.quantity
        return {
          price: level.price,
          cumulativeVolume,
          percentage: 0, // Will be calculated after we know max volume
          side
        }
      })
    }

    const bidDepth = calculateDepth(groupedOrderBook.bids, 'bid')
    const askDepth = calculateDepth(groupedOrderBook.asks, 'ask')
    
    const maxVolume = Math.max(
      bidDepth[bidDepth.length - 1]?.cumulativeVolume || 0,
      askDepth[askDepth.length - 1]?.cumulativeVolume || 0
    )

    // Calculate percentages
    const normalizeDepth = (depth: MarketDepth[]) => 
      depth.map(d => ({ ...d, percentage: (d.cumulativeVolume / maxVolume) * 100 }))

    return {
      bids: normalizeDepth(bidDepth),
      asks: normalizeDepth(askDepth),
      maxVolume
    }
  }, [groupedOrderBook])

  // Calculate spread
  const spread = useMemo(() => {
    const bestBid = groupedOrderBook.bids[0]?.price || 0
    const bestAsk = groupedOrderBook.asks[0]?.price || 0
    const spreadValue = bestAsk - bestBid
    const spreadPercentage = bestBid > 0 ? (spreadValue / bestBid) * 100 : 0
    
    return {
      value: spreadValue,
      percentage: spreadPercentage,
      bestBid,
      bestAsk
    }
  }, [groupedOrderBook])

  // Detect price level updates for flash animation
  useEffect(() => {
    if (prevDataRef.current && flashUpdates) {
      const newUpdateMap = new Map<string, boolean>()
      
      // Check for updated bids
      groupedOrderBook.bids.forEach(bid => {
        const key = `bid-${bid.price}`
        const prevBid = prevDataRef.current?.bids.find(b => b.price === bid.price)
        if (!prevBid || prevBid.quantity !== bid.quantity) {
          newUpdateMap.set(key, true)
          setTimeout(() => {
            updateAnimationRef.current.delete(key)
          }, 500)
        }
      })
      
      // Check for updated asks
      groupedOrderBook.asks.forEach(ask => {
        const key = `ask-${ask.price}`
        const prevAsk = prevDataRef.current?.asks.find(a => a.price === ask.price)
        if (!prevAsk || prevAsk.quantity !== ask.quantity) {
          newUpdateMap.set(key, true)
          setTimeout(() => {
            updateAnimationRef.current.delete(key)
          }, 500)
        }
      })
      
      updateAnimationRef.current = newUpdateMap
    }
    
    prevDataRef.current = data
    setLastUpdateTime(new Date())
  }, [data, groupedOrderBook, flashUpdates])

  // Format price with proper precision
  const formatPrice = useCallback((price: number) => {
    return price.toFixed(precision)
  }, [precision])

  // Format quantity
  const formatQuantity = useCallback((quantity: number) => {
    if (quantity < 1) return quantity.toFixed(6)
    if (quantity < 1000) return quantity.toFixed(3)
    if (quantity < 1000000) return (quantity / 1000).toFixed(2) + 'K'
    return (quantity / 1000000).toFixed(2) + 'M'
  }, [])

  // Handle level click
  const handleLevelClick = useCallback((level: OrderBookLevel, side: 'bid' | 'ask') => {
    onLevelClick?.(level, side)
    onPriceClick?.(level.price)
  }, [onLevelClick, onPriceClick])

  // Order book level component
  const OrderBookLevel = ({ 
    level, 
    side, 
    maxQuantity,
    isAnimated 
  }: { 
    level: OrderBookLevel
    side: 'bid' | 'ask'
    maxQuantity: number
    isAnimated?: boolean
  }) => {
    const volumePercentage = (level.quantity / maxQuantity) * 100
    const key = `${side}-${level.price}`
    const shouldFlash = updateAnimationRef.current.has(key)
    
    return (
      <motion.div
        key={key}
        layout
        animate={shouldFlash ? {
          backgroundColor: side === 'bid' ? currentTheme.bidColor : currentTheme.askColor,
          transition: { duration: 0.2 }
        } : {}}
        className={cn(
          "relative grid grid-cols-3 gap-2 px-2 py-1 text-sm font-mono cursor-pointer transition-all hover:bg-opacity-20",
          side === 'bid' ? "hover:bg-green-500" : "hover:bg-red-500"
        )}
        onClick={() => handleLevelClick(level, side)}
      >
        {/* Volume bar background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: side === 'bid' 
              ? `linear-gradient(to left, ${currentTheme.bidColor}, transparent)`
              : `linear-gradient(to right, ${currentTheme.askColor}, transparent)`,
            width: `${volumePercentage}%`,
            [side === 'bid' ? 'right' : 'left']: 0
          }}
        />
        
        <div className="relative z-10 text-right">
          <span className={cn(
            "font-semibold",
            side === 'bid' ? "text-green-600" : "text-red-600"
          )}>
            {formatPrice(level.price)}
          </span>
        </div>
        
        <div className="relative z-10 text-right">
          {formatQuantity(level.quantity)}
        </div>
        
        <div className="relative z-10 text-right text-muted-foreground">
          {formatQuantity(level.total)}
        </div>
      </motion.div>
    )
  }

  // Recent trades component
  const RecentTradesPanel = () => (
    <div className="h-64 overflow-y-auto">
      <div className="grid grid-cols-3 gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground border-b">
        <div className="text-right">Price</div>
        <div className="text-right">Quantity</div>
        <div className="text-right">Time</div>
      </div>
      <AnimatePresence initial={false}>
        {recentTrades.slice(0, 50).map((trade) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "grid grid-cols-3 gap-2 px-2 py-1 text-sm font-mono",
              trade.side === 'buy' ? "text-green-600" : "text-red-600"
            )}
          >
            <div className="text-right font-semibold">
              {formatPrice(trade.price)}
            </div>
            <div className="text-right">
              {formatQuantity(trade.quantity)}
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {trade.timestamp.toLocaleTimeString().slice(-8)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )

  // Depth chart component
  const DepthChart = () => {
    const chartHeight = 100
    const chartWidth = 300

    const bidPoints = marketDepth.bids.map((d, i) => 
      `${i * (chartWidth / marketDepth.bids.length)},${chartHeight - (d.percentage * chartHeight / 100)}`
    ).join(' ')

    const askPoints = marketDepth.asks.map((d, i) => 
      `${chartWidth/2 + i * (chartWidth/2 / marketDepth.asks.length)},${chartHeight - (d.percentage * chartHeight / 100)}`
    ).join(' ')

    return (
      <div className="p-4">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          <defs>
            <linearGradient id="bidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.bidColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={currentTheme.bidColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="askGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.askColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={currentTheme.askColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Bid area */}
          <polygon
            points={`0,${chartHeight} ${bidPoints} ${chartWidth/2},${chartHeight}`}
            fill="url(#bidGradient)"
            stroke={currentTheme.bidColor}
            strokeWidth="2"
          />
          
          {/* Ask area */}
          <polygon
            points={`${chartWidth/2},${chartHeight} ${askPoints} ${chartWidth},${chartHeight}`}
            fill="url(#askGradient)"
            stroke={currentTheme.askColor}
            strokeWidth="2"
          />
          
          {/* Current price line */}
          <line
            x1={chartWidth/2}
            y1="0"
            x2={chartWidth/2}
            y2={chartHeight}
            stroke={currentTheme.textColor}
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        </svg>
      </div>
    )
  }

  const maxBidQuantity = Math.max(...groupedOrderBook.bids.map(b => b.quantity), 0)
  const maxAskQuantity = Math.max(...groupedOrderBook.asks.map(a => a.quantity), 0)
  const maxQuantity = Math.max(maxBidQuantity, maxAskQuantity)

  return (
    <TooltipProvider>
      <Card className={cn("w-full max-w-2xl", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Order Book - {data.symbol}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {lastUpdateTime.toLocaleTimeString()}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Grouping</DropdownMenuLabel>
                  {groupingOptions.map(option => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setGrouping(option)}
                      className={grouping === option ? "bg-accent" : ""}
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  
                  <div className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Flash Updates</Label>
                      <Switch
                        checked={flashUpdates}
                        onCheckedChange={setFlashUpdates}
                        size="sm"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">My Orders Only</Label>
                      <Switch
                        checked={showOnlyMyOrders}
                        onCheckedChange={setShowOnlyMyOrders}
                        size="sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Depth %</Label>
                      <Slider
                        value={depthPercentage}
                        onValueChange={setDepthPercentage}
                        max={100}
                        min={10}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Spread information */}
          {showSpread && (
            <div className="flex items-center justify-center gap-4 py-2 text-sm">
              <div className="text-green-600 font-mono">
                Bid: {formatPrice(spread.bestBid)}
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Spread</div>
                <div className="font-mono">
                  {formatPrice(spread.value)} ({spread.percentage.toFixed(3)}%)
                </div>
              </div>
              <div className="text-red-600 font-mono">
                Ask: {formatPrice(spread.bestAsk)}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Order Book */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="grid grid-cols-3 gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground border-b bg-muted/20">
                <div className="text-right">Price ({data.symbol.split('USDT')[0]})</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Total</div>
              </div>

              {/* Asks (sell orders) */}
              <div className="h-64 overflow-y-auto">
                <div className="flex flex-col-reverse">
                  {groupedOrderBook.asks.map((ask, index) => (
                    <OrderBookLevel
                      key={`ask-${ask.price}-${index}`}
                      level={ask}
                      side="ask"
                      maxQuantity={maxQuantity}
                    />
                  ))}
                </div>
              </div>

              {/* Current price */}
              <div className="px-2 py-3 bg-muted/10 border-y">
                <div className="text-center">
                  <div className="text-lg font-bold font-mono">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current Price
                  </div>
                </div>
              </div>

              {/* Bids (buy orders) */}
              <div className="h-64 overflow-y-auto">
                {groupedOrderBook.bids.map((bid, index) => (
                  <OrderBookLevel
                    key={`bid-${bid.price}-${index}`}
                    level={bid}
                    side="bid"
                    maxQuantity={maxQuantity}
                  />
                ))}
              </div>
            </div>

            {/* Side panels */}
            <div className="border-l">
              {showDepthChart && (
                <div className="border-b">
                  <div className="p-2 text-sm font-semibold text-muted-foreground">
                    Market Depth
                  </div>
                  <DepthChart />
                </div>
              )}
              
              {showTrades && (
                <div>
                  <div className="p-2 text-sm font-semibold text-muted-foreground border-b">
                    Recent Trades
                  </div>
                  <RecentTradesPanel />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}