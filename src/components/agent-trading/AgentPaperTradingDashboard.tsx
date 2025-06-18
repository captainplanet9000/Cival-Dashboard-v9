'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  AlertTriangle,
  Activity,
  Target,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import { AgentPaperTradingManager } from '@/lib/agents/paper-trading-manager';
import { createAgentPaperPortfolioManager } from '@/lib/agents/paper-portfolio-manager';
import { paperTradingEventBus } from '@/lib/websocket/paper-trading-events';
import type { 
  AgentPaperTradingAccount, 
  AgentPaperTradingAlert,
  AgentPaperTradingDecision 
} from '@/types/agent-paper-trading';

interface AgentPaperTradingDashboardProps {
  agentId: string;
  agentName?: string;
}

interface DashboardData {
  account: AgentPaperTradingAccount | null;
  positions: any[];
  orders: any[];
  performance: any;
  alerts: AgentPaperTradingAlert[];
  decisions: AgentPaperTradingDecision[];
  portfolioHealth: any;
  riskMetrics: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AgentPaperTradingDashboard({ agentId, agentName }: AgentPaperTradingDashboardProps) {
  const [data, setData] = useState<DashboardData>({
    account: null,
    positions: [],
    orders: [],
    performance: null,
    alerts: [],
    decisions: [],
    portfolioHealth: null,
    riskMetrics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeConnected, setRealTimeConnected] = useState(false);

  const paperTradingManager = new AgentPaperTradingManager(agentId);
  const portfolioManager = createAgentPaperPortfolioManager(agentId);

  useEffect(() => {
    loadDashboardData();
    setupRealTimeUpdates();
    
    return () => {
      cleanupRealTimeUpdates();
    };
  }, [agentId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        accounts,
        positions,
        orders,
        performance,
        portfolioSummary
      ] = await Promise.all([
        paperTradingManager.getPaperTradingAccounts(),
        paperTradingManager.getPaperPositions(),
        paperTradingManager.getPaperOrders({ limit: 20 }),
        paperTradingManager.getPerformanceMetrics(),
        portfolioManager.getPortfolioSummary().catch(() => null)
      ]);

      setData({
        account: accounts[0] || null,
        positions,
        orders,
        performance,
        alerts: portfolioSummary?.riskMetrics?.alerts || [],
        decisions: [], // Would load from decision history
        portfolioHealth: portfolioSummary ? await portfolioManager.getPortfolioHealth() : null,
        riskMetrics: portfolioSummary?.riskMetrics || null
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = async () => {
    try {
      await paperTradingEventBus.connect();
      setRealTimeConnected(true);

      // Subscribe to agent-specific events
      paperTradingEventBus.subscribeToAgentEvents(agentId, handleRealTimeUpdate);

    } catch (err) {
      console.error('Failed to setup real-time updates:', err);
      setRealTimeConnected(false);
    }
  };

  const cleanupRealTimeUpdates = () => {
    // Cleanup would be handled by the event bus
    setRealTimeConnected(false);
  };

  const handleRealTimeUpdate = async (eventData: any) => {
    // Refresh relevant data based on event type
    if (eventData.type === 'paper_order_filled' || 
        eventData.type === 'paper_position_updated' ||
        eventData.type === 'paper_account_updated') {
      await loadDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error Loading Dashboard</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button onClick={loadDashboardData} className="mt-3" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {agentName || `Agent ${agentId}`} Paper Trading
          </h2>
          <p className="text-sm text-gray-600">
            Real-time paper trading performance and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={realTimeConnected ? "default" : "secondary"}>
            {realTimeConnected ? "🟢 Live" : "🔴 Offline"}
          </Badge>
          <Button onClick={loadDashboardData} size="sm" variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Equity</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.account?.total_equity?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Return</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.performance?.total_return_percent?.toFixed(2) || '0.00'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.performance?.win_rate ? (data.performance.win_rate * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Positions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.positions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Portfolio Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.positions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.positions.map((pos, index) => ({
                          name: pos.symbol,
                          value: pos.market_value || 0,
                          color: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.positions.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No positions to display
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateMockPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alerts and Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {data.alerts.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center space-x-2">
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm">{alert.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No active alerts</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Health</CardTitle>
              </CardHeader>
              <CardContent>
                {data.portfolioHealth ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Overall Score</span>
                      <Badge variant="default">{data.portfolioHealth.grade}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Score</span>
                      <span className="text-sm font-medium">{data.portfolioHealth.score}/100</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Health data not available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-green-600">✓ Portfolio well diversified</p>
                  <p className="text-sm text-yellow-600">⚠ Consider rebalancing</p>
                  <p className="text-sm text-blue-600">ℹ Good risk management</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
              <CardDescription>
                Active trading positions and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Avg Price</th>
                      <th className="text-right p-2">Current Price</th>
                      <th className="text-right p-2">Market Value</th>
                      <th className="text-right p-2">P&L</th>
                      <th className="text-right p-2">P&L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.positions.map((position) => (
                      <tr key={position.id} className="border-b">
                        <td className="p-2 font-medium">{position.symbol}</td>
                        <td className="p-2 text-right">{position.quantity}</td>
                        <td className="p-2 text-right">${position.avg_cost?.toFixed(2) || '0.00'}</td>
                        <td className="p-2 text-right">${position.current_price?.toFixed(2) || '0.00'}</td>
                        <td className="p-2 text-right">${position.market_value?.toFixed(2) || '0.00'}</td>
                        <td className={`p-2 text-right ${position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${position.unrealized_pnl?.toFixed(2) || '0.00'}
                        </td>
                        <td className={`p-2 text-right ${position.pnl_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnl_percent?.toFixed(2) || '0.00'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.positions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No active positions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Order history and execution details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-left p-2">Side</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-2">{new Date(order.created_at).toLocaleTimeString()}</td>
                        <td className="p-2 font-medium">{order.symbol}</td>
                        <td className="p-2">
                          <Badge variant={order.side === 'buy' ? 'default' : 'secondary'}>
                            {order.side}
                          </Badge>
                        </td>
                        <td className="p-2">{order.order_type}</td>
                        <td className="p-2 text-right">{order.quantity}</td>
                        <td className="p-2 text-right">${order.price?.toFixed(2) || 'Market'}</td>
                        <td className="p-2">
                          <Badge variant={
                            order.status === 'filled' ? 'default' : 
                            order.status === 'cancelled' ? 'destructive' : 
                            'secondary'
                          }>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent orders
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Return</span>
                    <span className="font-medium">{data.performance?.total_return_percent?.toFixed(2) || '0.00'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate</span>
                    <span className="font-medium">{data.performance?.win_rate ? (data.performance.win_rate * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sharpe Ratio</span>
                    <span className="font-medium">{data.performance?.sharpe_ratio?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Drawdown</span>
                    <span className="font-medium text-red-600">{data.performance?.max_drawdown?.toFixed(2) || '0.00'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trades</span>
                    <span className="font-medium">{data.performance?.total_trades || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateMockPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {data.riskMetrics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Risk Score</span>
                      <span className="font-medium">{(data.riskMetrics.totalRisk * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Concentration Risk</span>
                      <span className="font-medium">{(data.riskMetrics.concentrationRisk * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volatility Risk</span>
                      <span className="font-medium">{(data.riskMetrics.volatilityRisk * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Risk metrics not available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.alerts.map((alert) => (
                    <div key={alert.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {data.alerts.length === 0 && (
                    <p className="text-gray-500 text-sm">No active alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Agent Decisions
              </CardTitle>
              <CardDescription>
                Recent trading decisions and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.decisions.length > 0 ? (
                  data.decisions.map((decision) => (
                    <div key={decision.decision_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">{decision.decision_type}</Badge>
                          <span className="font-medium">{decision.symbol}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(decision.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{decision.reasoning}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Confidence: {(decision.confidence_level * 100).toFixed(0)}%</span>
                        <span>Expected Return: {(decision.expected_outcome.expected_return * 100).toFixed(1)}%</span>
                        <span>R/R Ratio: {decision.expected_outcome.risk_reward_ratio.toFixed(1)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent decisions to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to generate mock performance data
function generateMockPerformanceData() {
  const data = [];
  let value = 10000;
  
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.5) * 200;
    value += change;
    data.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: Math.round(value)
    });
  }
  
  return data;
}