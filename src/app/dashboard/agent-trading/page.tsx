'use client';

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import the AgentTradingList to avoid SSR issues
const AgentTradingList = dynamic(
  () => import('@/components/agent-trading/AgentTradingList').then(mod => ({ default: mod.AgentTradingList })),
  { 
    ssr: false,
    loading: () => <div>Loading agent trading interface...</div>
  }
);

/**
 * Page component for agent trading functionality
 * Using client component to avoid initialization errors
 */
export default function AgentTradingPage() {
  // Mock data for now to avoid server-side issues
  const activePermissions = 3;
  const totalPermissions = 5;
  const totalDailyTrades = 150;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Trading</h1>
        <p className="text-muted-foreground">
          Manage your AI trading agents with comprehensive monitoring and controls
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePermissions}</div>
            <p className="text-xs text-muted-foreground">
              of {totalPermissions} total agents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Trade Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDailyTrades}</div>
            <p className="text-xs text-muted-foreground">
              across all active agents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground">
              All systems running normally
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="permissions">Trading Permissions</TabsTrigger>
          <TabsTrigger value="active-trades">Active Trades</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Trading Permissions</CardTitle>
              <CardDescription>
                Configure trading permissions and limits for your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentTradingList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active-trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Trades</CardTitle>
              <CardDescription>
                Monitor ongoing trades executed by your agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No active trades at the moment</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
              <CardDescription>
                View all open positions managed by your agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No open positions</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track the performance of your AI trading agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Performance data will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}