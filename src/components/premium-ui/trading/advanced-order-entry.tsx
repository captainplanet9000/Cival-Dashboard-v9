'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calculator,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

export interface OrderData {
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
  quantity: number
  price?: number
  stopPrice?: number
  trailingAmount?: number
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY'
  reduceOnly?: boolean
  postOnly?: boolean
}

export interface MarketData {
  symbol: string
  lastPrice: number
  bidPrice: number
  askPrice: number
  volume24h: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
}

export interface PositionData {
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  markPrice: number
  unrealizedPnl: number
  leverage: number
}

export interface AdvancedOrderEntryProps {
  symbol: string
  marketData: MarketData
  position?: PositionData
  balance: number
  onSubmitOrder: (order: OrderData) => Promise<void>
  onCalculateMargin?: (order: OrderData) => number
  className?: string
  maxLeverage?: number
  minOrderSize?: number
  tickSize?: number
  stepSize?: number
  features?: {
    leverage?: boolean
    margin?: boolean
    advanced?: boolean
    oneClick?: boolean
  }
}

// Order type configurations
const ORDER_TYPES = {
  market: {
    label: 'Market',
    description: 'Execute immediately at current market price',
    icon: <Zap className="h-4 w-4" />,
    fields: ['quantity']
  },
  limit: {
    label: 'Limit',
    description: 'Execute only at specified price or better',
    icon: <DollarSign className="h-4 w-4" />,
    fields: ['quantity', 'price']
  },
  stop: {
    label: 'Stop',
    description: 'Market order triggered at stop price',
    icon: <AlertTriangle className="h-4 w-4" />,
    fields: ['quantity', 'stopPrice']
  },
  stop_limit: {
    label: 'Stop Limit',
    description: 'Limit order triggered at stop price',
    icon: <Calculator className="h-4 w-4" />,
    fields: ['quantity', 'price', 'stopPrice']
  },
  trailing_stop: {
    label: 'Trailing Stop',
    description: 'Stop that follows price by specified amount',
    icon: <TrendingUp className="h-4 w-4" />,
    fields: ['quantity', 'trailingAmount']
  }
}

const TIME_IN_FORCE_OPTIONS = [
  { value: 'GTC', label: 'GTC (Good Till Canceled)' },
  { value: 'IOC', label: 'IOC (Immediate or Cancel)' },
  { value: 'FOK', label: 'FOK (Fill or Kill)' },
  { value: 'DAY', label: 'DAY (Day Order)' }
]

const QUICK_PERCENTAGES = [10, 25, 50, 75, 100]

export function AdvancedOrderEntry({
  symbol,
  marketData,
  position,
  balance,
  onSubmitOrder,
  onCalculateMargin,
  className,
  maxLeverage = 10,
  minOrderSize = 0.001,
  tickSize = 0.01,
  stepSize = 0.001,
  features = {
    leverage: true,
    margin: true,
    advanced: true,
    oneClick: false
  }
}: AdvancedOrderEntryProps) {
  const [order, setOrder] = useState<OrderData>({
    symbol,
    side: 'buy',
    type: 'market',
    quantity: 0,
    timeInForce: 'GTC'
  })
  
  const [leverage, setLeverage] = useState(1)
  const [riskPercentage, setRiskPercentage] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [quickTrade, setQuickTrade] = useState(false)

  // Calculate order details
  const orderCalculations = useMemo(() => {
    const isBuy = order.side === 'buy'
    const price = order.type === 'market' 
      ? (isBuy ? marketData.askPrice : marketData.bidPrice)
      : order.price || marketData.lastPrice
    
    const notional = order.quantity * price
    const marginRequired = features.margin ? notional / leverage : notional
    const fee = notional * 0.001 // 0.1% fee
    const total = isBuy ? notional + fee : notional - fee
    
    const maxQuantity = features.margin 
      ? (balance * leverage) / price
      : balance / price
    
    const riskAmount = balance * (riskPercentage / 100)
    const suggestedQuantity = riskAmount / price
    
    return {
      price,
      notional,
      marginRequired,
      fee,
      total,
      maxQuantity,
      suggestedQuantity,
      canSubmit: order.quantity > 0 && 
                 order.quantity >= minOrderSize && 
                 marginRequired <= balance,
      warnings: [
        ...(order.quantity > maxQuantity ? ['Insufficient balance'] : []),
        ...(order.quantity < minOrderSize ? [`Minimum order size: ${minOrderSize}`] : []),
        ...(order.type === 'limit' && order.price && Math.abs(order.price - marketData.lastPrice) / marketData.lastPrice > 0.1 ? ['Price is far from market'] : [])
      ]
    }
  }, [order, marketData, balance, leverage, riskPercentage, minOrderSize, features])

  // Handle form changes
  const updateOrder = (updates: Partial<OrderData>) => {
    setOrder(prev => ({ ...prev, ...updates }))
  }

  const setQuantityPercentage = (percentage: number) => {
    const quantity = (orderCalculations.maxQuantity * percentage) / 100
    updateOrder({ quantity: Number(quantity.toFixed(6)) })
  }

  const handleSubmit = async () => {
    if (!orderCalculations.canSubmit) return
    
    setIsSubmitting(true)
    try {
      await onSubmitOrder(order)
      // Reset form after successful submission
      setOrder({
        symbol,
        side: 'buy',
        type: 'market',
        quantity: 0,
        timeInForce: 'GTC'
      })
    } catch (error) {
      console.error('Failed to submit order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                ${marketData.lastPrice.toFixed(2)}
              </Badge>
              <Badge 
                variant={marketData.changePercent24h >= 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {marketData.changePercent24h >= 0 ? '+' : ''}
                {marketData.changePercent24h.toFixed(2)}%
              </Badge>
            </div>
          </div>
          
          {/* Market Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Bid:</span>
              <span className="ml-2 font-mono">${marketData.bidPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ask:</span>
              <span className="ml-2 font-mono">${marketData.askPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Buy/Sell Toggle */}
          <Tabs 
            value={order.side} 
            onValueChange={(value) => updateOrder({ side: value as 'buy' | 'sell' })}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="text-green-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="text-red-600">
                <TrendingDown className="h-4 w-4 mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select 
              value={order.type} 
              onValueChange={(value) => updateOrder({ type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORDER_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leverage (if enabled) */}
          {features.leverage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Leverage</Label>
                <span className="text-sm font-mono">{leverage}x</span>
              </div>
              <Slider
                value={[leverage]}
                onValueChange={(value) => setLeverage(value[0])}
                max={maxLeverage}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Price Fields */}
          <AnimatePresence>
            {order.type !== 'market' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {(order.type === 'limit' || order.type === 'stop_limit') && (
                  <div className="space-y-2">
                    <Label>Limit Price</Label>
                    <Input
                      type="number"
                      value={order.price || ''}
                      onChange={(e) => updateOrder({ price: Number(e.target.value) })}
                      placeholder="0.00"
                      step={tickSize}
                    />
                  </div>
                )}
                
                {(order.type === 'stop' || order.type === 'stop_limit') && (
                  <div className="space-y-2">
                    <Label>Stop Price</Label>
                    <Input
                      type="number"
                      value={order.stopPrice || ''}
                      onChange={(e) => updateOrder({ stopPrice: Number(e.target.value) })}
                      placeholder="0.00"
                      step={tickSize}
                    />
                  </div>
                )}
                
                {order.type === 'trailing_stop' && (
                  <div className="space-y-2">
                    <Label>Trailing Amount</Label>
                    <Input
                      type="number"
                      value={order.trailingAmount || ''}
                      onChange={(e) => updateOrder({ trailingAmount: Number(e.target.value) })}
                      placeholder="0.00"
                      step={tickSize}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quantity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Quantity</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Max: {orderCalculations.maxQuantity.toFixed(6)} {symbol}</p>
                  <p>Suggested (2% risk): {orderCalculations.suggestedQuantity.toFixed(6)} {symbol}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={order.quantity || ''}
              onChange={(e) => updateOrder({ quantity: Number(e.target.value) })}
              placeholder="0.000000"
              step={stepSize}
            />
            
            {/* Quick percentage buttons */}
            <div className="flex gap-1">
              {QUICK_PERCENTAGES.map(percentage => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setQuantityPercentage(percentage)}
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          {/* Risk Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Risk Percentage</Label>
              <span className="text-sm font-mono">{riskPercentage}%</span>
            </div>
            <Slider
              value={[riskPercentage]}
              onValueChange={(value) => setRiskPercentage(value[0])}
              max={10}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Advanced Options */}
          {features.advanced && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Advanced Options</Label>
                <Switch
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </div>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-2">
                      <Label>Time in Force</Label>
                      <Select 
                        value={order.timeInForce} 
                        onValueChange={(value) => updateOrder({ timeInForce: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_IN_FORCE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={order.reduceOnly || false}
                        onCheckedChange={(checked) => updateOrder({ reduceOnly: checked })}
                      />
                      <Label>Reduce Only</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={order.postOnly || false}
                        onCheckedChange={(checked) => updateOrder({ postOnly: checked })}
                      />
                      <Label>Post Only</Label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h4 className="font-medium">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-mono">${orderCalculations.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notional:</span>
                <span className="font-mono">${orderCalculations.notional.toFixed(2)}</span>
              </div>
              {features.margin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin:</span>
                  <span className="font-mono">${orderCalculations.marginRequired.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-mono">${orderCalculations.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="font-mono">${orderCalculations.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Warnings */}
            {orderCalculations.warnings.length > 0 && (
              <div className="space-y-1">
                {orderCalculations.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className={cn(
              "w-full",
              order.side === 'buy' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
            disabled={!orderCalculations.canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Clock className="h-4 w-4" />
              </motion.div>
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {order.side === 'buy' ? 'Buy' : 'Sell'} {symbol}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}