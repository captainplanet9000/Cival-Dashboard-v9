'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LineChart, CandlestickChart, BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface TradingChartsProps {
  className?: string
}

export function TradingCharts({ className }: TradingChartsProps) {
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trading Charts</CardTitle>
              <CardDescription>Real-time market analysis and technical indicators</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="1h">
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <CandlestickChart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <LineChart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="price" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="price">Price Action</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="indicators">Indicators</TabsTrigger>
              <TabsTrigger value="depth">Market Depth</TabsTrigger>
            </TabsList>
            
            <TabsContent value="price" className="space-y-4">
              {/* Price Chart Placeholder */}
              <div className="h-[400px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <CandlestickChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Candlestick chart will be rendered here</p>
                </div>
              </div>
              
              {/* Price Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">24h High</p>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">$45,234</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">24h Low</p>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold">$43,567</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Volume</p>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">1.2M</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Change</p>
                      <Badge variant={"default"} className="bg-green-500">
                        +2.4%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">$44,123</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="volume" className="space-y-4">
              <div className="h-[400px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Volume chart will be rendered here</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="indicators" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">RSI (14)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">68.5</span>
                      <Badge variant="outline">Neutral</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">MACD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-500">+0.023</span>
                      <Badge variant="outline" className="border-green-500 text-green-500">Bullish</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="h-[300px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <LineChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Technical indicators chart</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="depth" className="space-y-4">
              <div className="h-[400px] bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Order book depth chart</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default TradingCharts