'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Bot, 
  Activity,
  Zap,
  DollarSign,
  BarChart3,
  Settings,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { backendApi } from '@/lib/api/backend-client';
import { formatPrice } from '@/lib/utils';

// Helper function for formatting percentages
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

interface Farm {
  id: string;
  name: string;
  description: string;
  strategy: string;
  agents: Agent[];
  status: 'active' | 'paused' | 'stopped';
  totalValue: number;
  dailyPnL: number;
  totalPnL: number;
  createdAt: string;
  performance: {
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
  };
  targets: {
    dailyTarget: number;
    currentProgress: number;
  };
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  allocation: number;
  pnl: number;
  trades: number;
}

// Mock data for farms
const mockFarms: Farm[] = [
  {
    id: 'farm-1',
    name: 'Darvas Box Farm',
    description: '8 agents executing Darvas Box breakout strategy with volume confirmation',
    strategy: 'Darvas Box',
    agents: [
      { id: 'darvas-1', name: 'Darvas Alpha', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 127.50, trades: 12 },
      { id: 'darvas-2', name: 'Darvas Beta', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 89.20, trades: 8 },
      { id: 'darvas-3', name: 'Darvas Gamma', type: 'Darvas Box', status: 'idle', allocation: 5000, pnl: -23.10, trades: 3 },
      { id: 'darvas-4', name: 'Darvas Delta', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 145.80, trades: 15 },
      { id: 'darvas-5', name: 'Darvas Epsilon', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 78.90, trades: 9 },
      { id: 'darvas-6', name: 'Darvas Zeta', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 167.30, trades: 18 },
      { id: 'darvas-7', name: 'Darvas Eta', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 95.40, trades: 11 },
      { id: 'darvas-8', name: 'Darvas Theta', type: 'Darvas Box', status: 'active', allocation: 5000, pnl: 112.60, trades: 14 }
    ],
    status: 'active',
    totalValue: 40000,
    dailyPnL: 793.60,
    totalPnL: 4250.30,
    createdAt: '2024-01-15',
    performance: {
      winRate: 0.742,
      sharpeRatio: 2.34,
      maxDrawdown: 0.089,
      totalTrades: 90
    },
    targets: {
      dailyTarget: 600,
      currentProgress: 793.60
    }
  },
  {
    id: 'farm-2',
    name: 'Elliott Wave Precision Farm',
    description: '5 specialized agents focusing on Elliott Wave pattern recognition',
    strategy: 'Elliott Wave',
    agents: [
      { id: 'elliott-1', name: 'Wave Master', type: 'Elliott Wave', status: 'active', allocation: 8000, pnl: 234.50, trades: 6 },
      { id: 'elliott-2', name: 'Impulse Hunter', type: 'Elliott Wave', status: 'active', allocation: 8000, pnl: 189.20, trades: 4 },
      { id: 'elliott-3', name: 'Correction Trader', type: 'Elliott Wave', status: 'active', allocation: 8000, pnl: 301.80, trades: 7 },
      { id: 'elliott-4', name: 'Fibonacci Agent', type: 'Elliott Wave', status: 'idle', allocation: 8000, pnl: -67.40, trades: 2 },
      { id: 'elliott-5', name: 'Wave Counter', type: 'Elliott Wave', status: 'active', allocation: 8000, pnl: 278.90, trades: 5 }
    ],
    status: 'active',
    totalValue: 40000,
    dailyPnL: 937.00,
    totalPnL: 6789.50,
    createdAt: '2024-01-10',
    performance: {
      winRate: 0.833,
      sharpeRatio: 3.12,
      maxDrawdown: 0.045,
      totalTrades: 24
    },
    targets: {
      dailyTarget: 800,
      currentProgress: 937.00
    }
  },
  {
    id: 'farm-3',
    name: 'Multi-Strategy Diversified Farm',
    description: '15 agents running integrated technical analysis strategies',
    strategy: 'Multi-Strategy',
    agents: [
      { id: 'multi-1', name: 'RSI Specialist', type: 'RSI', status: 'active', allocation: 3000, pnl: 87.30, trades: 8 },
      { id: 'multi-2', name: 'MACD Expert', type: 'MACD', status: 'active', allocation: 3000, pnl: 134.20, trades: 12 },
      { id: 'multi-3', name: 'Bollinger Agent', type: 'Bollinger Bands', status: 'active', allocation: 3000, pnl: 76.80, trades: 7 },
      { id: 'multi-4', name: 'Moving Average Bot', type: 'MA Cross', status: 'active', allocation: 3000, pnl: 145.60, trades: 15 },
      { id: 'multi-5', name: 'Volume Analyzer', type: 'Volume', status: 'active', allocation: 3000, pnl: 98.40, trades: 9 }
      // ... more agents
    ],
    status: 'active',
    totalValue: 45000,
    dailyPnL: 1284.50,
    totalPnL: 8945.20,
    createdAt: '2024-01-05',
    performance: {
      winRate: 0.694,
      sharpeRatio: 2.78,
      maxDrawdown: 0.123,
      totalTrades: 156
    },
    targets: {
      dailyTarget: 1200,
      currentProgress: 1284.50
    }
  }
];

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>(mockFarms);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showCreateFarm, setShowCreateFarm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-online bg-status-online/10';
      case 'paused': return 'text-status-warning bg-status-warning/10';
      case 'stopped': return 'text-status-error bg-status-error/10';
      case 'idle': return 'text-muted-foreground bg-muted/30';
      case 'error': return 'text-status-error bg-status-error/10';
      default: return 'text-muted-foreground bg-muted/30';
    }
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-trading-profit' : 'text-trading-loss';
  };

  const getPerformanceIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4 text-trading-profit" /> : <TrendingDown className="h-4 w-4 text-trading-loss" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const handleFarmAction = (farmId: string, action: 'start' | 'pause' | 'stop') => {
    setFarms(farms.map(farm => 
      farm.id === farmId 
        ? { ...farm, status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped' }
        : farm
    ));
    toast.success(`Farm ${action}ed successfully`);
  };

  const totalFarmValue = farms.reduce((sum, farm) => sum + farm.totalValue, 0);
  const totalDailyPnL = farms.reduce((sum, farm) => sum + farm.dailyPnL, 0);
  const activeFarms = farms.filter(farm => farm.status === 'active').length;
  const totalAgents = farms.reduce((sum, farm) => sum + farm.agents.length, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Farms</h1>
          <p className="text-muted-foreground">
            Coordinate and manage groups of trading agents working together
          </p>
        </div>
        <Button onClick={() => setShowCreateFarm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Farm
        </Button>
      </div>

      {/* Farm Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farm Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFarmValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {farms.length} farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            {getPerformanceIcon(totalDailyPnL)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(totalDailyPnL)}`}>
              {formatCurrency(totalDailyPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFarms}</div>
            <p className="text-xs text-muted-foreground">
              {totalAgents} agents running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(farms.reduce((sum, farm) => sum + farm.performance.winRate, 0) / farms.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average win rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farms List */}
      <div className="grid grid-cols-1 gap-6">
        {farms.map((farm) => (
          <Card key={farm.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {farm.name}
                    <Badge className={getStatusColor(farm.status)}>
                      {farm.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{farm.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFarmAction(farm.id, farm.status === 'active' ? 'pause' : 'start')}
                  >
                    {farm.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Strategy</div>
                  <div className="font-medium">{farm.strategy}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Agents</div>
                  <div className="font-medium">{farm.agents.length} agents</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="font-medium">{formatCurrency(farm.totalValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Daily P&L</div>
                  <div className={`font-medium ${getPerformanceColor(farm.dailyPnL)}`}>
                    {formatCurrency(farm.dailyPnL)}
                  </div>
                </div>
              </div>

              {/* Progress toward daily target */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Target Progress</span>
                  <span className="font-medium">
                    {formatCurrency(farm.targets.currentProgress)} / {formatCurrency(farm.targets.dailyTarget)}
                  </span>
                </div>
                <Progress 
                  value={Math.min((farm.targets.currentProgress / farm.targets.dailyTarget) * 100, 100)} 
                  className="h-2"
                />
              </div>

              {/* Agent Status Summary */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-status-online"></div>
                  <span>{farm.agents.filter(a => a.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <span>{farm.agents.filter(a => a.status === 'idle').length} Idle</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-status-error"></div>
                  <span>{farm.agents.filter(a => a.status === 'error').length} Error</span>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  Win Rate: {formatPercent(farm.performance.winRate)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Farm Modal would go here */}
      {showCreateFarm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Farm</CardTitle>
              <CardDescription>
                Set up a new group of coordinated trading agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Farm Name</label>
                <input
                  type="text"
                  placeholder="Enter farm name..."
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Strategy Type</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option value="">Select strategy...</option>
                  <option value="darvas">Darvas Box</option>
                  <option value="elliott">Elliott Wave</option>
                  <option value="multi">Multi-Strategy</option>
                  <option value="momentum">Momentum</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Number of Agents</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="5"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    toast.success('Farm created successfully!');
                    setShowCreateFarm(false);
                  }}
                >
                  Create Farm
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateFarm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}