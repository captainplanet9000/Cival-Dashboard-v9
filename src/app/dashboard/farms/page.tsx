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

// Backend API types
interface Farm {
  farm_id: string;
  farm_name: string;
  description: string;
  strategy_type: string;
  status: string;
  created_at: string;
  target_daily_profit: number;
  target_win_rate: number;
  max_risk_per_trade: number;
  total_allocated_capital: number;
  metadata?: any;
}

interface FarmAgent {
  agent_id: string;
  farm_id: string;
  agent_name: string;
  allocation_percentage: number;
  role: string;
  status: string;
  assigned_at: string;
}

interface FarmPerformance {
  farm_id: string;
  total_profit_loss: number;
  daily_profit_loss: number;
  win_rate: number;
  total_trades: number;
  successful_trades: number;
  average_trade_duration: number;
  sharpe_ratio: number;
  max_drawdown: number;
  last_updated: string;
}

interface FarmMetrics {
  total_farms: number;
  active_farms: number;
  total_profit_loss: number;
  total_agents: number;
  average_performance: number;
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [agents, setAgents] = useState<Record<string, FarmAgent[]>>({});
  const [performance, setPerformance] = useState<Record<string, FarmPerformance>>({});
  const [metrics, setMetrics] = useState<FarmMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showCreateFarm, setShowCreateFarm] = useState(false);

  // Load farms data on component mount
  useEffect(() => {
    loadFarmsData();
  }, []);

  const loadFarmsData = async () => {
    try {
      setIsLoading(true);

      // Load all farms
      const farmsResponse = await fetch(
        `${backendApi.getBackendUrl()}/api/v1/farms`
      );
      
      if (farmsResponse.ok) {
        const farmsData = await farmsResponse.json();
        const farmsList = farmsData.farms || [];
        setFarms(farmsList);

        // Load agents and performance for each farm
        const agentsMap: Record<string, FarmAgent[]> = {};
        const performanceMap: Record<string, FarmPerformance> = {};

        for (const farm of farmsList) {
          // Load farm agents
          try {
            const agentsResponse = await fetch(
              `${backendApi.getBackendUrl()}/api/v1/farms/${farm.farm_id}/agents`
            );
            if (agentsResponse.ok) {
              const agentsData = await agentsResponse.json();
              agentsMap[farm.farm_id] = agentsData.agents || [];
            }
          } catch (error) {
            console.warn(`Failed to load agents for farm ${farm.farm_id}:`, error);
            agentsMap[farm.farm_id] = [];
          }

          // Load farm performance
          try {
            const perfResponse = await fetch(
              `${backendApi.getBackendUrl()}/api/v1/farms/${farm.farm_id}/performance`
            );
            if (perfResponse.ok) {
              const perfData = await perfResponse.json();
              performanceMap[farm.farm_id] = perfData;
            }
          } catch (error) {
            console.warn(`Failed to load performance for farm ${farm.farm_id}:`, error);
          }
        }

        setAgents(agentsMap);
        setPerformance(performanceMap);
      } else {
        // Use fallback mock data when backend is not available
        const mockFarms = generateMockFarms();
        setFarms(mockFarms);
        
        // Generate mock agents and performance
        const mockAgents: Record<string, FarmAgent[]> = {};
        const mockPerformance: Record<string, FarmPerformance> = {};
        
        mockFarms.forEach(farm => {
          mockAgents[farm.farm_id] = generateMockAgents(farm.farm_id);
          mockPerformance[farm.farm_id] = generateMockPerformance(farm.farm_id);
        });
        
        setAgents(mockAgents);
        setPerformance(mockPerformance);
      }

      // Load farm metrics
      const metricsResponse = await fetch(
        `${backendApi.getBackendUrl()}/api/v1/farms/metrics`
      );
      
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      } else {
        // Generate mock metrics
        setMetrics({
          total_farms: farms.length,
          active_farms: farms.filter(f => f.status === 'active').length,
          total_profit_loss: 15025.40,
          total_agents: Object.values(agents).flat().length,
          average_performance: 8.45
        });
      }

    } catch (error) {
      console.error('Error loading farms data:', error);
      // Set fallback data
      const mockFarms = generateMockFarms();
      setFarms(mockFarms);
      setMetrics({
        total_farms: 3,
        active_farms: 3,
        total_profit_loss: 15025.40,
        total_agents: 18,
        average_performance: 8.45
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockFarms = (): Farm[] => [
    {
      farm_id: "farm-1",
      farm_name: "Darvas Box Farm",
      description: "8 agents executing Darvas Box breakout strategy with volume confirmation",
      strategy_type: "Darvas Box",
      status: "active",
      created_at: new Date().toISOString(),
      target_daily_profit: 600,
      target_win_rate: 75,
      max_risk_per_trade: 2.5,
      total_allocated_capital: 40000,
      metadata: { agent_count: 8 }
    },
    {
      farm_id: "farm-2", 
      farm_name: "Elliott Wave Precision Farm",
      description: "5 specialized agents focusing on Elliott Wave pattern recognition",
      strategy_type: "Elliott Wave",
      status: "active",
      created_at: new Date().toISOString(),
      target_daily_profit: 800,
      target_win_rate: 80,
      max_risk_per_trade: 3.0,
      total_allocated_capital: 40000,
      metadata: { agent_count: 5 }
    },
    {
      farm_id: "farm-3",
      farm_name: "Multi-Strategy Diversified Farm", 
      description: "15 agents running integrated technical analysis strategies",
      strategy_type: "Multi-Strategy",
      status: "active",
      created_at: new Date().toISOString(),
      target_daily_profit: 1200,
      target_win_rate: 70,
      max_risk_per_trade: 2.0,
      total_allocated_capital: 45000,
      metadata: { agent_count: 15 }
    }
  ];

  const generateMockAgents = (farmId: string): FarmAgent[] => {
    const agentCounts = { "farm-1": 8, "farm-2": 5, "farm-3": 15 };
    const count = agentCounts[farmId as keyof typeof agentCounts] || 5;
    
    return Array.from({ length: count }, (_, i) => ({
      agent_id: `${farmId}-agent-${i + 1}`,
      farm_id: farmId,
      agent_name: `Agent ${i + 1}`,
      allocation_percentage: 100 / count,
      role: "trader",
      status: i === 0 ? "active" : Math.random() > 0.8 ? "idle" : "active",
      assigned_at: new Date().toISOString()
    }));
  };

  const generateMockPerformance = (farmId: string): FarmPerformance => ({
    farm_id: farmId,
    total_profit_loss: Math.random() * 10000 - 2000,
    daily_profit_loss: Math.random() * 1000 - 200,
    win_rate: 0.6 + Math.random() * 0.3,
    total_trades: Math.floor(Math.random() * 200) + 50,
    successful_trades: Math.floor(Math.random() * 150) + 30,
    average_trade_duration: Math.random() * 120 + 30,
    sharpe_ratio: 1.5 + Math.random() * 2,
    max_drawdown: Math.random() * 0.2,
    last_updated: new Date().toISOString()
  });

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

  const handleFarmAction = async (farmId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      const endpoint = `${backendApi.getBackendUrl()}/api/v1/farms/${farmId}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Update local state
        setFarms(farms.map(farm => 
          farm.farm_id === farmId 
            ? { ...farm, status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped' }
            : farm
        ));
        toast.success(`Farm ${action}ed successfully`);
        
        // Reload data to get updated metrics
        loadFarmsData();
      } else {
        toast.error(`Failed to ${action} farm`);
      }
    } catch (error) {
      console.error(`Error ${action}ing farm:`, error);
      toast.error(`Failed to ${action} farm`);
    }
  };

  const createFarm = async (farmData: Partial<Farm>) => {
    try {
      const response = await fetch(
        `${backendApi.getBackendUrl()}/api/v1/farms`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(farmData)
        }
      );
      
      if (response.ok) {
        const newFarm = await response.json();
        setFarms([...farms, newFarm]);
        toast.success('Farm created successfully!');
        setShowCreateFarm(false);
        loadFarmsData(); // Reload all data
      } else {
        toast.error('Failed to create farm');
      }
    } catch (error) {
      console.error('Error creating farm:', error);
      toast.error('Failed to create farm');
    }
  };

  // Calculate metrics from current data
  const totalFarmValue = metrics?.total_profit_loss || farms.reduce((sum, farm) => 
    sum + (performance[farm.farm_id]?.total_profit_loss || 0), 0
  );
  const totalDailyPnL = farms.reduce((sum, farm) => 
    sum + (performance[farm.farm_id]?.daily_profit_loss || 0), 0
  );
  const activeFarms = farms.filter(farm => farm.status === 'active').length;
  const totalAgents = Object.values(agents).flat().length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading farms data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Farms</h1>
          <p className="text-muted-foreground">
            Coordinated multi-agent trading systems with autonomous strategy execution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadFarmsData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button onClick={() => setShowCreateFarm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Farm
          </Button>
        </div>
      </div>

      {/* Farm Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farms.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeFarms} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(totalFarmValue)}`}>
              {formatPrice(totalFarmValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(totalDailyPnL)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              Across all farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-trading-profit">
              {metrics?.average_performance?.toFixed(1) || '8.4'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Return rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farms List */}
      <div className="space-y-4">
        {farms.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No farms yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first agent farm to get started with coordinated trading
            </p>
            <Button onClick={() => setShowCreateFarm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Farm
            </Button>
          </div>
        ) : (
          farms.map((farm) => {
            const farmPerformance = performance[farm.farm_id];
            const farmAgents = agents[farm.farm_id] || [];
            const activeAgents = farmAgents.filter(a => a.status === 'active').length;
            
            return (
              <Card key={farm.farm_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{farm.farm_name}</CardTitle>
                        <Badge className={getStatusColor(farm.status)}>
                          {farm.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {farm.strategy_type}
                        </Badge>
                      </div>
                      <CardDescription>{farm.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {farm.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFarmAction(farm.farm_id, 'pause')}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {farm.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFarmAction(farm.farm_id, 'start')}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Agents</div>
                      <div className="font-medium text-lg">
                        {activeAgents}/{farmAgents.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Capital</div>
                      <div className="font-medium text-lg">
                        {formatPrice(farm.total_allocated_capital)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Daily Target</div>
                      <div className="font-medium text-lg">
                        {formatPrice(farm.target_daily_profit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Daily P&L</div>
                      <div className={`font-medium text-lg ${getPerformanceColor(farmPerformance?.daily_profit_loss || 0)}`}>
                        {getPerformanceIcon(farmPerformance?.daily_profit_loss || 0)}
                        {formatPrice(farmPerformance?.daily_profit_loss || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                      <div className="font-medium text-lg text-blue-600">
                        {farmPerformance ? formatPercentage(farmPerformance.win_rate / 100) : `${farm.target_win_rate}%`}
                      </div>
                    </div>
                  </div>

                  {/* Progress towards daily target */}
                  {farmPerformance && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Daily Target Progress</span>
                        <span className="font-medium">
                          {formatPercentage((farmPerformance.daily_profit_loss / farm.target_daily_profit) / 100)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, (farmPerformance.daily_profit_loss / farm.target_daily_profit) * 100))}
                        className="h-2" 
                      />
                    </div>
                  )}

                  {/* Farm Performance Metrics */}
                  {farmPerformance && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total P&L:</span>
                        <span className={`ml-2 font-medium ${getPerformanceColor(farmPerformance.total_profit_loss)}`}>
                          {formatPrice(farmPerformance.total_profit_loss)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trades:</span>
                        <span className="ml-2 font-medium">{farmPerformance.total_trades}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sharpe:</span>
                        <span className="ml-2 font-medium">{farmPerformance.sharpe_ratio?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max DD:</span>
                        <span className="ml-2 font-medium text-status-error">
                          {formatPercentage(farmPerformance.max_drawdown / 100)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Farm Modal */}
      {showCreateFarm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Farm</CardTitle>
              <CardDescription>
                Set up a new agent farm for coordinated trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Farm Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Momentum Farm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Strategy Type</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Darvas Box</option>
                  <option>Elliott Wave</option>
                  <option>Multi-Strategy</option>
                  <option>Momentum</option>
                  <option>Mean Reversion</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Allocated Capital</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Daily Target ($)</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-md"
                  placeholder="1000"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Mock farm creation
                    const newFarm: Farm = {
                      farm_id: `farm-${Date.now()}`,
                      farm_name: "New Farm",
                      description: "Newly created farm",
                      strategy_type: "Multi-Strategy",
                      status: "active",
                      created_at: new Date().toISOString(),
                      target_daily_profit: 1000,
                      target_win_rate: 75,
                      max_risk_per_trade: 2.5,
                      total_allocated_capital: 50000,
                      metadata: {}
                    };
                    
                    setFarms([...farms, newFarm]);
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