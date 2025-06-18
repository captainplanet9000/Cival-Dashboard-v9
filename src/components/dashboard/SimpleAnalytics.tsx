'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity, Target } from 'lucide-react';

export default function SimpleAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$156,247.82</div>
            <p className="text-xs text-muted-foreground">+8.97% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-violet-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.4%</div>
            <p className="text-xs text-muted-foreground">342 winning trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
            <Activity className="h-4 w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">5 performing above target</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Performance Analytics
          </CardTitle>
          <CardDescription>Trading performance metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Advanced analytics charts</p>
              <p className="text-sm mt-1">Real-time data visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}