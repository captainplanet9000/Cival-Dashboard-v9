"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

// Import existing components
import LiveTradingDashboard from '@/components/trading/LiveTradingDashboard';
import { LiveMarketDataPanel } from '@/components/market/LiveMarketDataPanel';

export default function LiveTradingWithMarketData() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Live Trading & Market Data</h2>
      </div>
      
      <Tabs defaultValue="trading" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Trading
          </TabsTrigger>
          <TabsTrigger value="market-data" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="mt-6">
          <LiveTradingDashboard />
        </TabsContent>

        <TabsContent value="market-data" className="mt-6">
          <LiveMarketDataPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}