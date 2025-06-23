'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WatchlistSortable } from './WatchlistSortable';
import { PortfolioSortable } from './PortfolioSortable';
import { StrategySortable } from './StrategySortable';
import { WatchlistItem, PortfolioPosition, TradingStrategy } from './types';

// Mock data for demonstration
const mockWatchlistData: WatchlistItem[] = [
  {
    id: 'AAPL',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.43,
    change: 2.18,
    changePercent: 1.26,
    volume: 58432100,
    marketCap: 2800000000000,
    priority: 'high',
    alerts: 2,
  },
  {
    id: 'TSLA',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.87,
    change: -5.32,
    changePercent: -2.09,
    volume: 89234567,
    marketCap: 790000000000,
    priority: 'high',
    alerts: 1,
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 461.23,
    change: 12.45,
    changePercent: 2.78,
    volume: 45678901,
    marketCap: 1100000000000,
    priority: 'medium',
    alerts: 0,
  },
  {
    id: 'MSFT',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 338.91,
    change: 1.87,
    changePercent: 0.55,
    volume: 32145678,
    marketCap: 2500000000000,
    priority: 'medium',
    alerts: 1,
  },
  {
    id: 'AMZN',
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    price: 127.86,
    change: -0.94,
    changePercent: -0.73,
    volume: 78901234,
    marketCap: 1300000000000,
    priority: 'low',
    alerts: 0,
  },
];

const mockPortfolioData: PortfolioPosition[] = [
  {
    id: 'pos-AAPL',
    symbol: 'AAPL',
    quantity: 100,
    averagePrice: 170.25,
    currentPrice: 175.43,
    marketValue: 17543,
    unrealizedPnL: 518,
    unrealizedPnLPercent: 3.04,
    weight: 35.2,
    priority: 'high',
    riskLevel: 'low',
  },
  {
    id: 'pos-TSLA',
    symbol: 'TSLA',
    quantity: 50,
    averagePrice: 255.50,
    currentPrice: 248.87,
    marketValue: 12443.50,
    unrealizedPnL: -331.50,
    unrealizedPnLPercent: -2.60,
    weight: 24.9,
    priority: 'high',
    riskLevel: 'high',
  },
  {
    id: 'pos-NVDA',
    symbol: 'NVDA',
    quantity: 25,
    averagePrice: 445.20,
    currentPrice: 461.23,
    marketValue: 11530.75,
    unrealizedPnL: 400.75,
    unrealizedPnLPercent: 3.60,
    weight: 23.1,
    priority: 'medium',
    riskLevel: 'medium',
  },
  {
    id: 'pos-MSFT',
    symbol: 'MSFT',
    quantity: 30,
    averagePrice: 335.80,
    currentPrice: 338.91,
    marketValue: 10167.30,
    unrealizedPnL: 93.30,
    unrealizedPnLPercent: 0.93,
    weight: 20.4,
    priority: 'medium',
    riskLevel: 'low',
  },
];

const mockStrategyData: TradingStrategy[] = [
  {
    id: 'strategy-1',
    name: 'Momentum Breakout',
    type: 'momentum',
    status: 'active',
    executionOrder: 1,
    allocatedCapital: 50000,
    currentPnL: 2450.75,
    winRate: 68.5,
    sharpeRatio: 1.42,
    maxDrawdown: -8.3,
    lastExecuted: new Date(Date.now() - 300000), // 5 minutes ago
    priority: 'high',
  },
  {
    id: 'strategy-2',
    name: 'Mean Reversion',
    type: 'mean-reversion',
    status: 'active',
    executionOrder: 2,
    allocatedCapital: 30000,
    currentPnL: -125.30,
    winRate: 72.1,
    sharpeRatio: 0.98,
    maxDrawdown: -12.1,
    lastExecuted: new Date(Date.now() - 900000), // 15 minutes ago
    priority: 'medium',
  },
  {
    id: 'strategy-3',
    name: 'Arbitrage Scanner',
    type: 'arbitrage',
    status: 'paused',
    executionOrder: 3,
    allocatedCapital: 25000,
    currentPnL: 895.40,
    winRate: 85.2,
    sharpeRatio: 2.15,
    maxDrawdown: -3.7,
    lastExecuted: new Date(Date.now() - 3600000), // 1 hour ago
    priority: 'high',
  },
  {
    id: 'strategy-4',
    name: 'Market Making Bot',
    type: 'market-making',
    status: 'stopped',
    executionOrder: 4,
    allocatedCapital: 15000,
    currentPnL: -567.20,
    winRate: 55.8,
    sharpeRatio: 0.34,
    maxDrawdown: -18.5,
    lastExecuted: new Date(Date.now() - 7200000), // 2 hours ago
    priority: 'low',
  },
];

export function SortableDemo() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(mockWatchlistData);
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>(mockPortfolioData);
  const [strategies, setStrategies] = useState<TradingStrategy[]>(mockStrategyData);

  const totalPortfolioValue = portfolioPositions.reduce((sum, pos) => sum + pos.marketValue, 0);

  const handleAddWatchlistSymbol = () => {
    const newSymbol: WatchlistItem = {
      id: `NEW${Date.now()}`,
      symbol: 'NEW',
      name: 'New Symbol',
      price: 100,
      change: 0,
      changePercent: 0,
      volume: 1000000,
      priority: 'medium',
      alerts: 0,
    };
    setWatchlistItems([...watchlistItems, newSymbol]);
  };

  const handleCreateStrategy = () => {
    const newStrategy: TradingStrategy = {
      id: `strategy-${Date.now()}`,
      name: 'New Strategy',
      type: 'custom',
      status: 'stopped',
      executionOrder: strategies.length + 1,
      allocatedCapital: 10000,
      currentPnL: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      lastExecuted: new Date(),
      priority: 'low',
    };
    setStrategies([...strategies, newStrategy]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Trading Sortable Components Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Drag and drop functionality for watchlists, portfolio positions, and trading strategies
        </p>
      </div>

      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist Sortable Component</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag symbols to reorder your watchlist by priority. Click the menu to add alerts or remove symbols.
              </p>
            </CardHeader>
            <CardContent>
              <WatchlistSortable
                items={watchlistItems}
                onItemsChange={setWatchlistItems}
                onAddSymbol={handleAddWatchlistSymbol}
                onRemoveSymbol={(symbol) => {
                  setWatchlistItems(watchlistItems.filter(item => item.symbol !== symbol));
                }}
                onToggleAlert={(symbol) => {
                  console.log(`Toggle alert for ${symbol}`);
                }}
                onViewChart={(symbol) => {
                  console.log(`View chart for ${symbol}`);
                }}
                options={{
                  enableMultiSelect: true,
                  enablePriorityIndicators: true,
                  maxItems: 10,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Sortable Component</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag positions to reorder by priority. View P&L, risk levels, and portfolio allocation.
              </p>
            </CardHeader>
            <CardContent>
              <PortfolioSortable
                positions={portfolioPositions}
                onPositionsChange={setPortfolioPositions}
                totalPortfolioValue={totalPortfolioValue}
                onRebalance={() => {
                  console.log('Rebalance portfolio');
                }}
                onClosePosition={(symbol) => {
                  setPortfolioPositions(portfolioPositions.filter(pos => pos.symbol !== symbol));
                }}
                onAdjustPosition={(symbol) => {
                  console.log(`Adjust position for ${symbol}`);
                }}
                onViewAnalysis={(symbol) => {
                  console.log(`View analysis for ${symbol}`);
                }}
                options={{
                  enableMultiSelect: true,
                  enablePriorityIndicators: true,
                  enableRiskIndicators: true,
                  maxItems: 20,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Sortable Component</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag strategies to reorder execution priority. Control strategy states and view performance metrics.
              </p>
            </CardHeader>
            <CardContent>
              <StrategySortable
                strategies={strategies}
                onStrategiesChange={setStrategies}
                onCreateStrategy={handleCreateStrategy}
                onStartStrategy={(strategyId) => {
                  console.log(`Start strategy ${strategyId}`);
                }}
                onPauseStrategy={(strategyId) => {
                  console.log(`Pause strategy ${strategyId}`);
                }}
                onStopStrategy={(strategyId) => {
                  console.log(`Stop strategy ${strategyId}`);
                }}
                onConfigureStrategy={(strategyId) => {
                  console.log(`Configure strategy ${strategyId}`);
                }}
                onViewPerformance={(strategyId) => {
                  console.log(`View performance for strategy ${strategyId}`);
                }}
                onDeleteStrategy={(strategyId) => {
                  setStrategies(strategies.filter(s => s.id !== strategyId));
                }}
                options={{
                  enableMultiSelect: true,
                  enablePriorityIndicators: true,
                  maxItems: 15,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature overview */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Drag & Drop</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Smooth dragging animations</li>
                <li>• Visual feedback during drag</li>
                <li>• Touch device support</li>
                <li>• Keyboard navigation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Trading Features</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Priority indicators</li>
                <li>• Risk level badges</li>
                <li>• Real-time P&L updates</li>
                <li>• Portfolio weight visualization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Customization</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Multi-select support</li>
                <li>• Bulk operations</li>
                <li>• Configurable limits</li>
                <li>• Persistent ordering</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SortableDemo;