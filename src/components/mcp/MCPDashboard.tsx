/**
 * MCP Dashboard Component - Central MCP Management Interface
 * Provides comprehensive view and control of all MCP servers and tools
 * Real-time monitoring, health status, and tool execution interface
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Shield,
  DollarSign,
  BarChart3,
  Workflow,
  Play,
  Pause,
  RefreshCw,
  Settings
} from 'lucide-react';

import {
  useMCPClient,
  useMCPTools,
  useMCPHealth,
  useMCPEvents,
  useArbitrageOpportunities,
  useMarketData,
  usePortfolioRisk,
  useFunding
} from '@/lib/mcp/mcp-hooks';

// ==================== SERVER STATUS COMPONENT ====================

const ServerStatusCard: React.FC<{
  server: any;
  onToggle: (serverName: string) => void;
}> = ({ server, onToggle }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'error': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{server.name}</CardTitle>
          <Badge variant={server.status === 'online' ? 'default' : 'destructive'}>
            <div className="flex items-center gap-1">
              {getStatusIcon(server.status)}
              {server.status}
            </div>
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Port {server.port} • {server.tools_count} tools
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {server.specialization}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span>Latency:</span>
            <span className={server.latency_ms > 100 ? 'text-yellow-600' : 'text-green-600'}>
              {server.latency_ms || 0}ms
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {server.capabilities.map((capability: string) => (
              <Badge key={capability} variant="outline" className="text-xs">
                {capability}
              </Badge>
            ))}
          </div>
          
          <Button
            size="sm"
            variant={server.status === 'online' ? 'outline' : 'default'}
            className="w-full"
            onClick={() => onToggle(server.name)}
          >
            {server.status === 'online' ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Disconnect
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Connect
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== TOOL EXECUTION COMPONENT ====================

const ToolExecutionPanel: React.FC = () => {
  const { tools } = useMCPTools();
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArguments, setToolArguments] = useState<string>('{}');
  const [agentId, setAgentId] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const selectedToolInfo = tools.find(t => t.name === selectedTool);

  const executeTool = async () => {
    if (!selectedTool) return;
    
    setExecuting(true);
    setExecutionResult(null);
    
    try {
      const args = JSON.parse(toolArguments);
      const response = await fetch('/api/mcp/execute-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          arguments: args,
          agent_id: agentId || undefined
        })
      });
      
      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      });
    } finally {
      setExecuting(false);
    }
  };

  const generateExampleArgs = () => {
    if (!selectedToolInfo) return;
    
    const schema = selectedToolInfo.inputSchema;
    if (schema?.properties) {
      const example: any = {};
      
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.default !== undefined) {
          example[key] = prop.default;
        } else if (prop.type === 'string') {
          example[key] = prop.enum ? prop.enum[0] : 'example_value';
        } else if (prop.type === 'number') {
          example[key] = 100;
        } else if (prop.type === 'boolean') {
          example[key] = false;
        } else if (prop.type === 'array') {
          example[key] = [];
        }
      });
      
      setToolArguments(JSON.stringify(example, null, 2));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tool-select">Select Tool</Label>
          <select
            id="tool-select"
            className="w-full mt-1 p-2 border rounded"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            <option value="">Choose a tool...</option>
            {tools.map(tool => (
              <option key={tool.name} value={tool.name}>
                {tool.name} ({tool.server})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="agent-id">Agent ID (Optional)</Label>
          <Input
            id="agent-id"
            placeholder="agent_123"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
        </div>
      </div>

      {selectedToolInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{selectedToolInfo.name}</CardTitle>
            <CardDescription>{selectedToolInfo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Server: {selectedToolInfo.server}</Badge>
              <Badge variant="outline">Latency: ~{selectedToolInfo.estimated_latency_ms}ms</Badge>
              
              <Button
                size="sm"
                variant="outline"
                onClick={generateExampleArgs}
              >
                Generate Example
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <Label htmlFor="arguments">Tool Arguments (JSON)</Label>
        <Textarea
          id="arguments"
          placeholder='{"key": "value"}'
          value={toolArguments}
          onChange={(e) => setToolArguments(e.target.value)}
          className="font-mono text-sm"
          rows={6}
        />
      </div>

      <Button
        onClick={executeTool}
        disabled={!selectedTool || executing}
        className="w-full"
      >
        {executing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Execute Tool
          </>
        )}
      </Button>

      {executionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Execution Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-3 rounded border ${
              executionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== ARBITRAGE MONITOR COMPONENT ====================

const ArbitrageMonitor: React.FC = () => {
  const { opportunities, loading, error, refresh, totalOpportunities } = useArbitrageOpportunities(
    {
      min_profit_usd: 10,
      min_confidence_score: 0.7
    },
    true, // auto-refresh
    5000  // 5-second intervals
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-semibold">Arbitrage Opportunities</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={totalOpportunities > 0 ? 'default' : 'outline'}>
            {totalOpportunities} opportunities
          </Badge>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-96">
        <div className="space-y-2">
          {opportunities.map((opp, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{opp.token_pair}</div>
                    <div className="text-xs text-muted-foreground">
                      {opp.chains?.join(' → ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      +{opp.profit_percentage?.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${opp.net_profit?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    Confidence: {(opp.confidence_score * 100)?.toFixed(0)}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ~{opp.execution_time_estimate}s
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {opportunities.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-8">
              No arbitrage opportunities found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ==================== MARKET DATA MONITOR ====================

const MarketDataMonitor: React.FC = () => {
  const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'USDC/USD'];
  const { marketData, loading, error, dataAge } = useMarketData(symbols, false, true, 1000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h3 className="font-semibold">Live Market Data</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {dataAge < 5000 ? 'Live' : `${Math.round(dataAge / 1000)}s old`}
        </Badge>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        {symbols.map(symbol => {
          const data = marketData[symbol];
          if (!data) return (
            <Card key={symbol}>
              <CardContent className="p-3">
                <div className="text-sm font-medium">{symbol}</div>
                <div className="text-xs text-muted-foreground">Loading...</div>
              </CardContent>
            </Card>
          );

          const changeColor = data.change_24h_percentage >= 0 ? 'text-green-600' : 'text-red-600';

          return (
            <Card key={symbol}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{symbol}</div>
                  <div className={`text-xs ${changeColor}`}>
                    {data.change_24h_percentage >= 0 ? '+' : ''}
                    {data.change_24h_percentage?.toFixed(2)}%
                  </div>
                </div>
                <div className="text-lg font-bold">
                  ${data.price?.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vol: ${(data.volume_24h / 1000000).toFixed(1)}M</span>
                  <span>{data.latency_ms}ms</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ==================== MAIN MCP DASHBOARD ====================

export const MCPDashboard: React.FC = () => {
  const { isInitialized, isInitializing, error, healthStatus, reinitialize } = useMCPClient();
  const { tools, loading: toolsLoading } = useMCPTools();
  const { servers, healthScore, isHealthy } = useMCPHealth();
  const { events, toolCalls, averageLatency } = useMCPEvents();

  const [activeTab, setActiveTab] = useState('overview');

  const handleServerToggle = (serverName: string) => {
    console.log(`Toggle server: ${serverName}`);
    // In a real implementation, would send request to enable/disable server
  };

  if (!isInitialized && isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Initializing MCP Client...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to initialize MCP Client: {error}
            <Button size="sm" variant="outline" onClick={reinitialize} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MCP Control Center</h1>
          <p className="text-muted-foreground">
            Model Context Protocol integration dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isHealthy ? 'default' : 'destructive'}>
            Health: {healthScore.toFixed(0)}%
          </Badge>
          <Button size="sm" variant="outline" onClick={reinitialize}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Servers</p>
                <p className="text-2xl font-bold">
                  {healthStatus?.servers.online}/{healthStatus?.servers.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tools</p>
                <p className="text-2xl font-bold">
                  {healthStatus?.tools.available}/{healthStatus?.tools.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{averageLatency.toFixed(0)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tool Calls</p>
                <p className="text-2xl font-bold">{toolCalls.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <ArbitrageMonitor />
            <MarketDataMonitor />
          </div>
        </TabsContent>

        <TabsContent value="servers" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {servers.map(server => (
              <ServerStatusCard
                key={server.name}
                server={server}
                onToggle={handleServerToggle}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <ToolExecutionPanel />
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-4">
          <ArbitrageMonitor />
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <MarketDataMonitor />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <div key={index} className="text-xs p-2 rounded bg-muted">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{event.tool_name}</span>
                          <Badge variant={event.type === 'success' ? 'default' : 'destructive'}>
                            {event.type}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {event.timestamp?.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Successful Calls</span>
                    <Badge>{toolCalls.filter(c => c.type !== 'error').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Latency</span>
                    <Badge variant="outline">{averageLatency.toFixed(0)}ms</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Health Score</span>
                    <Badge variant={isHealthy ? 'default' : 'destructive'}>
                      {healthScore.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MCPDashboard;