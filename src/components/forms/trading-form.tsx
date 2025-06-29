'use client'

import React, { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import {
  paperTradingEngine,
  TradingAgent,
  MarketPrice
} from '@/lib/trading/real-paper-trading-engine'

// Trading form schema
const tradingFormSchema = z.object({
  orderType: z.enum(['market', 'limit', 'stop', 'stop-limit']),
  side: z.enum(['buy', 'sell']),
  symbol: z.string().min(1, 'Symbol is required'),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  price: z.string().optional(),
  stopPrice: z.string().optional(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK', 'GTD']),
  postOnly: z.boolean().default(false),
  reduceOnly: z.boolean().default(false),
})

type TradingFormValues = z.infer<typeof tradingFormSchema>

interface TradingFormProps {
  className?: string
}

export function TradingForm({ className }: TradingFormProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [portfolio, setPortfolio] = useState<any>(null)

  const form = useForm<TradingFormValues>({
    resolver: zodResolver(tradingFormSchema),
    defaultValues: {
      orderType: 'market',
      side: 'buy',
      symbol: 'BTC/USD',
      quantity: '',
      timeInForce: 'GTC',
      postOnly: false,
      reduceOnly: false,
    },
  })

  const orderType = form.watch('orderType')
  const side = form.watch('side')
  const symbol = form.watch('symbol')

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Load agents and market data
    loadData()

    // Listen for updates
    const handlePricesUpdated = (prices: MarketPrice[]) => {
      setMarketPrices(prices)
    }

    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)

    return () => {
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
    }
  }, [])

  const loadData = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)
    
    if (allAgents.length > 0 && !selectedAgent) {
      setSelectedAgent(allAgents[0].id)
      setPortfolio(allAgents[0].portfolio)
    }

    const prices = paperTradingEngine.getAllMarketPrices()
    setMarketPrices(prices)
  }

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId)
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      setPortfolio(agent.portfolio)
    }
  }

  const getCurrentPrice = (symbol: string): number => {
    const price = marketPrices.find(p => p.symbol === symbol)
    return price?.price || 0
  }

  const getAvailableBalance = (): number => {
    return portfolio?.cash || 0
  }

  const calculateOrderValue = (): number => {
    const quantity = parseFloat(form.getValues('quantity') || '0')
    const price = getCurrentPrice(symbol)
    return quantity * price
  }

  async function onSubmit(data: TradingFormValues) {
    if (!selectedAgent) {
      toast.error('Please select an agent to execute the trade')
      return
    }

    if (agents.length === 0) {
      toast.error('No trading agents available. Please create an agent first.')
      return
    }

    setIsSubmitting(true)

    try {
      const agent = agents.find(a => a.id === selectedAgent)
      if (!agent) {
        throw new Error('Selected agent not found')
      }

      // Validate order
      const currentPrice = getCurrentPrice(data.symbol)
      if (currentPrice === 0) {
        throw new Error('Unable to get current price for symbol')
      }

      const quantity = parseFloat(data.quantity)
      const orderValue = quantity * currentPrice
      
      if (data.side === 'buy' && orderValue > getAvailableBalance()) {
        throw new Error('Insufficient balance for this order')
      }

      // Create order
      const order = {
        agentId: selectedAgent,
        symbol: data.symbol,
        side: data.side,
        type: data.orderType,
        quantity: quantity,
        price: data.orderType === 'market' ? currentPrice : parseFloat(data.price || '0'),
        stopPrice: data.stopPrice ? parseFloat(data.stopPrice) : undefined,
        timeInForce: data.timeInForce.toLowerCase() as 'gtc' | 'ioc' | 'fok',
        postOnly: data.postOnly,
        reduceOnly: data.reduceOnly
      }

      // Execute the order
      const result = await paperTradingEngine.executeOrder(selectedAgent, order)
      
      if (result.success) {
        toast.success(`${data.side.toUpperCase()} order executed successfully!`)
        
        // Reset form
        form.reset({
          orderType: 'market',
          side: 'buy',
          symbol: data.symbol,
          quantity: '',
          timeInForce: 'GTC',
          postOnly: false,
          reduceOnly: false,
        })

        // Reload data to reflect changes
        setTimeout(loadData, 500)
      } else {
        throw new Error(result.error || 'Order execution failed')
      }

    } catch (error) {
      console.error('Order submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to execute order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Place Order</CardTitle>
        <CardDescription>Execute trades with advanced order types</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Agent Selection and Portfolio Info */}
        <div className="mb-6 space-y-4">
          {agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Trading Agent</label>
                <EnhancedDropdown
                  options={agents.map((agent): DropdownOption => ({
                    value: agent.id,
                    label: agent.name,
                    description: `$${agent.portfolio.cash.toFixed(2)} available`,
                    icon: <TrendingUp className="h-4 w-4" />
                  }))}
                  value={selectedAgent}
                  onValueChange={handleAgentChange}
                  placeholder="Select agent"
                  searchable
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance:</span>
                  <span className="font-medium">${getAvailableBalance().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Price ({symbol}):</span>
                  <span className="font-medium">${getCurrentPrice(symbol).toLocaleString()}</span>
                </div>
                {form.getValues('quantity') && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Value:</span>
                    <span className="font-medium">${calculateOrderValue().toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No trading agents found. Please create an agent first in the Agents tab.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Order Side Tabs */}
            <Tabs value={side} onValueChange={(value) => form.setValue('side', value as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  Sell
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Symbol and Order Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <EnhancedDropdown
                        options={marketPrices.length > 0 ? 
                          marketPrices.map((price): DropdownOption => ({
                            value: price.symbol,
                            label: price.symbol,
                            description: `$${price.price.toLocaleString()}`,
                            icon: <TrendingUp className="h-4 w-4" />
                          })) : [
                            { value: "BTC/USD", label: "BTC/USD", icon: <TrendingUp className="h-4 w-4" /> },
                            { value: "ETH/USD", label: "ETH/USD", icon: <TrendingUp className="h-4 w-4" /> },
                            { value: "SOL/USD", label: "SOL/USD", icon: <TrendingUp className="h-4 w-4" /> },
                            { value: "BNB/USD", label: "BNB/USD", icon: <TrendingUp className="h-4 w-4" /> }
                          ]
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select symbol"
                        searchable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Type</FormLabel>
                    <FormControl>
                      <EnhancedDropdown
                        options={[
                          { value: "market", label: "Market", description: "Execute immediately at current price" },
                          { value: "limit", label: "Limit", description: "Execute at specified price or better" },
                          { value: "stop", label: "Stop", description: "Execute when price reaches stop level" },
                          { value: "stop-limit", label: "Stop Limit", description: "Combine stop and limit orders" }
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select order type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    Available balance: <span className="font-semibold">$25,000.00</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price (for limit orders) */}
            {(orderType === 'limit' || orderType === 'stop-limit') && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit Price</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Current market price: <span className="font-semibold">$45,234.56</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Stop Price (for stop orders) */}
            {(orderType === 'stop' || orderType === 'stop-limit') && (
              <FormField
                control={form.control}
                name="stopPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Price</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Trigger price for the stop order
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Time in Force */}
            <FormField
              control={form.control}
              name="timeInForce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time in Force</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time in force" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GTC">Good Till Cancelled (GTC)</SelectItem>
                      <SelectItem value="IOC">Immediate or Cancel (IOC)</SelectItem>
                      <SelectItem value="FOK">Fill or Kill (FOK)</SelectItem>
                      <SelectItem value="GTD">Good Till Date (GTD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advanced Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="postOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Post Only</FormLabel>
                      <FormDescription>
                        Ensure the order will be added to the order book
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reduceOnly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reduce Only</FormLabel>
                      <FormDescription>
                        Only reduce your position size
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Order Summary */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Order Type:</span>
                    <Badge variant="outline">{orderType.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Side:</span>
                    <Badge variant={side === 'buy' ? 'default' : 'destructive'}>
                      {side.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Total:</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || agents.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing Order...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Place {side === 'buy' ? 'Buy' : 'Sell'} Order
                </>
              )}
            </Button>
            
            {agents.length === 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Create a trading agent first to place orders
                </p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default TradingForm