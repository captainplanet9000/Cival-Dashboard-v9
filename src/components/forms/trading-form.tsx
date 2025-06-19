'use client'

import React from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const form = useForm<TradingFormValues>({
    resolver: zodResolver(tradingFormSchema),
    defaultValues: {
      orderType: 'market',
      side: 'buy',
      symbol: 'BTCUSD',
      quantity: '',
      timeInForce: 'GTC',
      postOnly: false,
      reduceOnly: false,
    },
  })

  const orderType = form.watch('orderType')
  const side = form.watch('side')

  function onSubmit(data: TradingFormValues) {
    console.log('Order submitted:', data)
    // Here you would send the order to your trading API
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Place Order</CardTitle>
        <CardDescription>Execute trades with advanced order types</CardDescription>
      </CardHeader>
      <CardContent>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select symbol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                        <SelectItem value="ETHUSD">ETH/USD</SelectItem>
                        <SelectItem value="SOLUSD">SOL/USD</SelectItem>
                        <SelectItem value="BNBUSD">BNB/USD</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="stop">Stop</SelectItem>
                        <SelectItem value="stop-limit">Stop Limit</SelectItem>
                      </SelectContent>
                    </Select>
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

            <Button type="submit" className="w-full" size="lg">
              <TrendingUp className="mr-2 h-4 w-4" />
              Place {side === 'buy' ? 'Buy' : 'Sell'} Order
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default TradingForm