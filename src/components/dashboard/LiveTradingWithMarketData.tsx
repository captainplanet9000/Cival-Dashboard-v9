"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity, BarChart3, LineChart, Target, BookOpen, DollarSign } from 'lucide-react';

// Import existing components
import LiveTradingDashboard from '@/components/trading/LiveTradingDashboard';
import { LiveMarketDataPanel } from '@/components/market/LiveMarketDataPanel';
import { TradingInterface } from '@/components/trading/TradingInterface';
import { PortfolioMonitor } from '@/components/trading/PortfolioMonitor';
import { TradingCharts } from '@/components/charts/TradingCharts';
import { PaperTradingPnL } from '@/components/trading/PaperTradingPnL';

export default function LiveTradingWithMarketData() {
  const [activeView, setActiveView] = useState('trading');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Live Trading Center</h2>
      </div>
      
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="market-data" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="paper" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Paper
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="mt-6">
          <LiveTradingDashboard />
        </TabsContent>

        <TabsContent value="market-data" className="mt-6">
          <LiveMarketDataPanel />
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <TradingCharts />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <PortfolioMonitor />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <TradingInterface />
        </TabsContent>

        <TabsContent value="paper" className="mt-6">
          <PaperTradingPnL />
        </TabsContent>
      </Tabs>
    </div>
  );
}