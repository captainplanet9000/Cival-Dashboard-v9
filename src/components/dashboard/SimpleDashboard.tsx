'use client'

/**
 * SimpleDashboard Component
 * Lightweight dashboard implementation that doesn't depend on problematic external packages
 * Used as a fallback when ModernDashboard fails to load due to dependency issues
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Bot, Shield,
  BarChart3, RefreshCw, Bell, Users, Calendar, Wallet, PieChart,
  Menu, X, Clock, Settings, ArrowUpRight, ArrowDownRight, Search
} from 'lucide-react'

export default function SimpleDashboard() {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  // Mock data for the dashboard
  const marketOverview = {
    topGainers: [
      { symbol: 'APPL', name: 'Apple Inc', change: '+3.42%', price: '$198.45' },
      { symbol: 'NVDA', name: 'NVIDIA Corp', change: '+2.88%', price: '$487.12' },
      { symbol: 'MSFT', name: 'Microsoft', change: '+1.75%', price: '$324.67' }
    ],
    topLosers: [
      { symbol: 'META', name: 'Meta Platforms', change: '-2.18%', price: '$278.35' },
      { symbol: 'NFLX', name: 'Netflix Inc', change: '-1.43%', price: '$435.12' },
      { symbol: 'AMZN', name: 'Amazon.com', change: '-0.87%', price: '$143.56' }
    ]
  }

  const portfolioSummary = {
    totalValue: '$132,486.25',
    dailyChange: '+$3,245.68 (2.45%)',
    assets: [
      { name: 'Stocks', value: '$78,450.00', allocation: '59.2%' },
      { name: 'Crypto', value: '$32,780.25', allocation: '24.7%' },
      { name: 'Forex', value: '$15,256.00', allocation: '11.5%' },
      { name: 'Bonds', value: '$6,000.00', allocation: '4.6%' }
    ]
  }

  const recentTrades = [
    { id: '1', type: 'BUY', symbol: 'TSLA', amount: '5 shares', price: '$242.50', time: '10:32 AM' },
    { id: '2', type: 'SELL', symbol: 'ETH', amount: '2.5 ETH', price: '$3,245.00', time: '09:45 AM' },
    { id: '3', type: 'BUY', symbol: 'AMZN', amount: '10 shares', price: '$143.25', time: 'Yesterday' }
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-card border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex justify-between items-center">
          {!collapsed && <h2 className="font-semibold text-lg">TradingFarm</h2>}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu /> : <X className="h-4 w-4" />}
          </Button>
        </div>
        
        <nav className="p-2 flex-1">
          <ul className="space-y-1">
            <li>
              <Button 
                variant={selectedTab === 'overview' ? 'secondary' : 'ghost'} 
                className={`w-full justify-${collapsed ? 'center' : 'start'} px-3`}
                onClick={() => setSelectedTab('overview')}
              >
                <Activity className="h-4 w-4 mr-2" />
                {!collapsed && <span>Overview</span>}
              </Button>
            </li>
            <li>
              <Button 
                variant={selectedTab === 'trading' ? 'secondary' : 'ghost'} 
                className={`w-full justify-${collapsed ? 'center' : 'start'} px-3`}
                onClick={() => setSelectedTab('trading')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {!collapsed && <span>Trading</span>}
              </Button>
            </li>
            <li>
              <Button 
                variant={selectedTab === 'portfolio' ? 'secondary' : 'ghost'} 
                className={`w-full justify-${collapsed ? 'center' : 'start'} px-3`}
                onClick={() => setSelectedTab('portfolio')}
              >
                <PieChart className="h-4 w-4 mr-2" />
                {!collapsed && <span>Portfolio</span>}
              </Button>
            </li>
            <li>
              <Button 
                variant={selectedTab === 'agents' ? 'secondary' : 'ghost'} 
                className={`w-full justify-${collapsed ? 'center' : 'start'} px-3`}
                onClick={() => setSelectedTab('agents')}
              >
                <Bot className="h-4 w-4 mr-2" />
                {!collapsed && <span>AI Agents</span>}
              </Button>
            </li>
            <li>
              <Button 
                variant={selectedTab === 'risk' ? 'secondary' : 'ghost'} 
                className={`w-full justify-${collapsed ? 'center' : 'start'} px-3`}
                onClick={() => setSelectedTab('risk')}
              >
                <Shield className="h-4 w-4 mr-2" />
                {!collapsed && <span>Risk Management</span>}
              </Button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t mt-auto">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="h-3.5 w-3.5 mr-2" />
            {!collapsed && <span>Settings</span>}
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b bg-card p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </Button>
            </div>
          </div>
        </header>
        
        {/* Dashboard content */}
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Portfolio Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioSummary.totalValue}</div>
                <p className="text-xs flex items-center text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {portfolioSummary.dailyChange}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today's Profit/Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+$1,245.38</div>
                <p className="text-xs flex items-center text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +1.82% today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs flex items-center">
                  <Bot className="h-3 w-3 mr-1" />
                  5 AI-powered
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Top performing stocks and market movers</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="gainers">
                  <TabsList>
                    <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
                    <TabsTrigger value="losers">Top Losers</TabsTrigger>
                    <TabsTrigger value="volume">Highest Volume</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="gainers" className="p-1">
                    <div className="space-y-2 mt-2">
                      {marketOverview.topGainers.map(stock => (
                        <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md">
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div>
                            <div className="font-medium text-right">{stock.price}</div>
                            <div className="text-sm text-emerald-600">{stock.change}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="losers" className="p-1">
                    <div className="space-y-2 mt-2">
                      {marketOverview.topLosers.map(stock => (
                        <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md">
                          <div>
                            <div className="font-medium">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div>
                            <div className="font-medium text-right">{stock.price}</div>
                            <div className="text-sm text-red-500">{stock.change}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="volume" className="p-1">
                    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                      Market data currently unavailable
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTrades.map(trade => (
                    <div key={trade.id} className="flex items-center space-x-4 border-b pb-2 last:border-0">
                      <div className={`w-2 h-8 rounded-full ${trade.type === 'BUY' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm">{trade.time}</div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div className="text-muted-foreground">{trade.amount}</div>
                          <div>{trade.price}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
                <CardDescription>Asset distribution by class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {portfolioSummary.assets.map(asset => (
                    <div key={asset.name} className="p-4 border rounded-lg">
                      <div className="text-muted-foreground text-sm mb-1">{asset.name}</div>
                      <div className="font-medium">{asset.value}</div>
                      <div className="text-xs text-muted-foreground">{asset.allocation}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
