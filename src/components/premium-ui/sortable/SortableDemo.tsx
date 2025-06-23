'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

import { WatchlistSortable } from './WatchlistSortable'
import { PortfolioSortable } from './PortfolioSortable'
import { StrategySortable } from './StrategySortable'
import type { WatchlistItem, PortfolioPosition, TradingStrategy } from './types'

// Mock data generators
const generateMockWatchlistItems = (): WatchlistItem[] => [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.25,
    change: 2.15,
    changePercent: 1.22,
    volume: 58420000,
    priority: 'high',
    alerts: 2,
    lastUpdate: new Date(),
    order: 0,
  },
  {
    id: '2',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.87,
    change: -8.43,
    changePercent: -3.28,
    volume: 89320000,
    priority: 'high',
    alerts: 1,
    lastUpdate: new Date(),
    order: 1,
  },
  {
    id: '3',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 875.43,
    change: 15.78,
    changePercent: 1.84,
    volume: 34560000,
    priority: 'medium',
    alerts: 0,
    lastUpdate: new Date(),
    order: 2,
  },
  {
    id: '4',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 412.05,
    change: 3.21,
    changePercent: 0.78,
    volume: 23450000,
    priority: 'medium',
    alerts: 1,
    lastUpdate: new Date(),
    order: 3,
  },
  {
    id: '5',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 138.92,
    change: -1.47,
    changePercent: -1.05,
    volume: 19870000,
    priority: 'low',
    alerts: 0,
    lastUpdate: new Date(),
    order: 4,
  },
]

const generateMockPortfolioPositions = (): PortfolioPosition[] => [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 100,
    averagePrice: 175.50,
    currentPrice: 178.25,
    pnl: 275.00,
    pnlPercent: 1.57,
    portfolioWeight: 35.2,
    riskLevel: 'low',
    lastUpdate: new Date(),
    order: 0,
  },
  {
    id: '2',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    quantity: 50,
    averagePrice: 255.30,
    currentPrice: 248.87,
    pnl: -321.50,
    pnlPercent: -2.52,
    portfolioWeight: 24.8,
    riskLevel: 'high',
    lastUpdate: new Date(),
    order: 1,
  },
  {
    id: '3',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    quantity: 25,
    averagePrice: 820.15,
    currentPrice: 875.43,
    pnl: 1382.00,
    pnlPercent: 6.74,
    portfolioWeight: 21.5,
    riskLevel: 'medium',
    lastUpdate: new Date(),
    order: 2,
  },
  {
    id: '4',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    quantity: 75,
    averagePrice: 408.90,
    currentPrice: 412.05,
    pnl: 236.25,
    pnlPercent: 0.77,
    portfolioWeight: 18.5,
    riskLevel: 'low',
    lastUpdate: new Date(),
    order: 3,
  },
]

const generateMockTradingStrategies = (): TradingStrategy[] => [
  {
    id: '1',
    name: 'Momentum Breakout',
    description: 'Identifies and trades momentum breakouts above key resistance levels',
    status: 'running',
    priority: 'high',
    allocatedCapital: 50000,
    currentPnl: 2450.75,
    totalTrades: 24,
    winRate: 68.5,
    lastExecuted: new Date(),
    order: 0,
  },
  {
    id: '2',
    name: 'Mean Reversion',
    description: 'Buys oversold conditions and sells overbought conditions',
    status: 'paused',
    priority: 'medium',
    allocatedCapital: 30000,
    currentPnl: -875.25,
    totalTrades: 18,
    winRate: 55.2,
    lastExecuted: new Date(Date.now() - 3600000),
    order: 1,
  },
  {
    id: '3',
    name: 'Grid Trading',
    description: 'Places buy and sell orders at predetermined intervals',
    status: 'running',
    priority: 'low',
    allocatedCapital: 25000,
    currentPnl: 1120.50,
    totalTrades: 142,
    winRate: 72.8,
    lastExecuted: new Date(),
    order: 2,
  },
  {
    id: '4',
    name: 'Arbitrage Scanner',
    description: 'Exploits price differences between exchanges',
    status: 'stopped',
    priority: 'high',
    allocatedCapital: 75000,
    currentPnl: 3200.00,
    totalTrades: 8,
    winRate: 87.5,
    lastExecuted: new Date(Date.now() - 7200000),
    order: 3,
  },
]

export function SortableDemo() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(generateMockWatchlistItems())
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>(generateMockPortfolioPositions())
  const [tradingStrategies, setTradingStrategies] = useState<TradingStrategy[]>(generateMockTradingStrategies())

  const totalPortfolioValue = portfolioPositions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0)

  const refreshMockData = () => {
    setWatchlistItems(generateMockWatchlistItems())
    setPortfolioPositions(generateMockPortfolioPositions())
    setTradingStrategies(generateMockTradingStrategies())
  }

  const handleWatchlistActions = {
    onAddSymbol: () => console.log('Add symbol clicked'),
    onRemoveSymbol: (symbol: string) => {
      setWatchlistItems(items => items.filter(item => item.symbol !== symbol))
    },
    onToggleAlert: (symbol: string) => {
      setWatchlistItems(items =>
        items.map(item =>
          item.symbol === symbol
            ? { ...item, alerts: item.alerts && item.alerts > 0 ? 0 : 1 }
            : item
        )
      )
    },
    onViewChart: (symbol: string) => console.log('View chart for', symbol),
    onToggleVisibility: (symbol: string) => console.log('Toggle visibility for', symbol),
  }

  const handlePortfolioActions = {
    onClosePosition: (symbol: string) => {
      setPortfolioPositions(positions => positions.filter(pos => pos.symbol !== symbol))
    },
    onEditPosition: (symbol: string) => console.log('Edit position', symbol),
    onViewDetails: (symbol: string) => console.log('View details for', symbol),
  }

  const handleStrategyActions = {
    onStartStrategy: (id: string) => {
      setTradingStrategies(strategies =>
        strategies.map(strategy =>
          strategy.id === id ? { ...strategy, status: 'running' as const } : strategy
        )
      )
    },
    onPauseStrategy: (id: string) => {
      setTradingStrategies(strategies =>
        strategies.map(strategy =>
          strategy.id === id ? { ...strategy, status: 'paused' as const } : strategy
        )
      )
    },
    onStopStrategy: (id: string) => {
      setTradingStrategies(strategies =>
        strategies.map(strategy =>
          strategy.id === id ? { ...strategy, status: 'stopped' as const } : strategy
        )
      )
    },
    onEditStrategy: (id: string) => console.log('Edit strategy', id),
    onViewDetails: (id: string) => console.log('View strategy details', id),
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sortable Components Demo</h1>
          <p className="text-muted-foreground mt-2">
            Interactive demo of trading-specific sortable components with drag-and-drop functionality
          </p>
        </div>
        <Button onClick={refreshMockData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Features</CardTitle>
          <CardDescription>
            All components support drag-and-drop reordering, real-time updates, and persistent ordering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Watchlist Features</h4>
              <div className="space-y-1">
                <Badge variant="outline">Symbol search</Badge>
                <Badge variant="outline">Price alerts</Badge>
                <Badge variant="outline">Priority indicators</Badge>
                <Badge variant="outline">Chart integration</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Portfolio Features</h4>
              <div className="space-y-1">
                <Badge variant="outline">P&L tracking</Badge>
                <Badge variant="outline">Risk indicators</Badge>
                <Badge variant="outline">Position weights</Badge>
                <Badge variant="outline">Performance metrics</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Strategy Features</h4>
              <div className="space-y-1">
                <Badge variant="outline">Execution control</Badge>
                <Badge variant="outline">Performance tracking</Badge>
                <Badge variant="outline">Resource allocation</Badge>
                <Badge variant="outline">Priority ordering</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="watchlist" className="space-y-4">
          <WatchlistSortable
            items={watchlistItems}
            onItemsChange={setWatchlistItems}
            {...handleWatchlistActions}
            options={{
              enableMultiSelect: true,
              persistOrder: true,
              animationPreset: 'smooth',
            }}
          />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <PortfolioSortable
            positions={portfolioPositions}
            onPositionsChange={setPortfolioPositions}
            totalPortfolioValue={totalPortfolioValue}
            {...handlePortfolioActions}
            options={{
              enableMultiSelect: true,
              persistOrder: true,
              animationPreset: 'smooth',
            }}
          />
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <StrategySortable
            strategies={tradingStrategies}
            onStrategiesChange={setTradingStrategies}
            {...handleStrategyActions}
            options={{
              persistOrder: true,
              animationPreset: 'smooth',
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SortableDemo