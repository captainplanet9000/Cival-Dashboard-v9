"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TradingSymbolSelector, 
  TradingDateTimeRange, 
  PriceRangeSlider, 
  TradingNotes,
  LoadingButton,
  ProgressWithValue,
  type TradingSymbol
} from "./index";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock trading strategy execution
interface TradingStrategy {
  id: string;
  name: string;
  symbols: TradingSymbol[];
  priceRange: [number, number];
  startDate?: Date;
  endDate?: Date;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  results?: {
    totalTrades: number;
    profitableTrades: number;
    totalReturn: number;
    maxDrawdown: number;
  };
}

const TradingDashboardExample = () => {
  const [strategy, setStrategy] = React.useState<TradingStrategy>({
    id: "strategy-1",
    name: "Mean Reversion Strategy",
    symbols: [],
    priceRange: [100, 200],
    status: "idle",
    progress: 0,
  });

  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionLog, setExecutionLog] = React.useState<string[]>([]);

  const handleSymbolChange = (symbols: TradingSymbol[]) => {
    setStrategy(prev => ({ ...prev, symbols }));
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setStrategy(prev => ({ ...prev, priceRange: range }));
  };

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setStrategy(prev => ({ ...prev, startDate, endDate }));
  };

  const executeStrategy = async () => {
    setIsExecuting(true);
    setStrategy(prev => ({ ...prev, status: "running", progress: 0 }));
    setExecutionLog([]);

    const steps = [
      "Validating strategy parameters...",
      "Fetching historical data...",
      "Running backtesting simulation...",
      "Calculating performance metrics...",
      "Generating trade signals...",
      "Finalizing results..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setExecutionLog(prev => [...prev, steps[i]]);
      setStrategy(prev => ({ ...prev, progress: ((i + 1) / steps.length) * 100 }));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Mock results
    const mockResults = {
      totalTrades: 45,
      profitableTrades: 28,
      totalReturn: 12.7,
      maxDrawdown: -4.2,
    };

    setStrategy(prev => ({ 
      ...prev, 
      status: "completed", 
      progress: 100,
      results: mockResults 
    }));
    setIsExecuting(false);
  };

  const resetStrategy = () => {
    setStrategy(prev => ({ 
      ...prev, 
      status: "idle", 
      progress: 0, 
      results: undefined 
    }));
    setExecutionLog([]);
  };

  const getStatusColor = (status: TradingStrategy['status']) => {
    switch (status) {
      case "idle": return "bg-gray-100 text-gray-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: TradingStrategy['status']) => {
    switch (status) {
      case "running": return <Play className="h-4 w-4" />;
      case "completed": return <TrendingUp className="h-4 w-4" />;
      case "error": return <AlertTriangle className="h-4 w-4" />;
      default: return <Pause className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trading Strategy Builder</h1>
        <p className="text-muted-foreground">
          Build and backtest trading strategies using advanced UI components designed for financial applications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Strategy Configuration
                </div>
                <Badge className={getStatusColor(strategy.status)}>
                  {getStatusIcon(strategy.status)}
                  {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure your trading strategy parameters and execution settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">1. Select Trading Symbols</h4>
                <TradingSymbolSelector
                  value={strategy.symbols}
                  onChange={handleSymbolChange}
                  placeholder="Search and select trading symbols..."
                  maxSelected={5}
                  disabled={strategy.status === "running"}
                />
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">2. Set Price Range</h4>
                <PriceRangeSlider
                  value={strategy.priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={50}
                  max={500}
                  currentPrice={strategy.symbols[0]?.price}
                  symbol={strategy.symbols[0]?.symbol}
                  showPresets={true}
                  disabled={strategy.status === "running"}
                />
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">3. Select Time Range</h4>
                <TradingDateTimeRange
                  startDate={strategy.startDate}
                  endDate={strategy.endDate}
                  onRangeChange={handleDateRangeChange}
                  showPresets={true}
                  showAnalytics={true}
                  disabled={strategy.status === "running"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Execution Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategy Execution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategy.status === "running" && (
                <div className="space-y-3">
                  <ProgressWithValue
                    value={strategy.progress}
                    showValue={true}
                    valuePosition="right"
                    formatValue={(val) => `${Math.round(val)}% Complete`}
                    className="mb-4"
                  />
                  
                  <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <h5 className="text-sm font-medium mb-2">Execution Log</h5>
                    <div className="space-y-1 text-sm">
                      {executionLog.map((log, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span className="text-muted-foreground">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <LoadingButton
                  loading={isExecuting}
                  loadingText="Executing Strategy..."
                  onClick={executeStrategy}
                  disabled={strategy.symbols.length === 0 || strategy.status === "running"}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute Strategy
                </LoadingButton>

                <Button
                  variant="outline"
                  onClick={resetStrategy}
                  disabled={strategy.status === "running"}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {strategy.results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Strategy Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{strategy.results.totalTrades}</div>
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {strategy.results.profitableTrades}
                    </div>
                    <div className="text-sm text-muted-foreground">Profitable</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      +{strategy.results.totalReturn}%
                    </div>
                    <div className="text-sm text-muted-foreground">Total Return</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {strategy.results.maxDrawdown}%
                    </div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Strategy Notes */}
        <div className="space-y-6">
          <TradingNotes
            symbol={strategy.symbols[0]?.symbol}
            showHistory={true}
            maxLength={1000}
            className="h-fit"
          />

          {/* Strategy Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strategy Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Strategy Name</div>
                <div className="font-medium">{strategy.name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Selected Symbols</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {strategy.symbols.length > 0 ? (
                    strategy.symbols.map(symbol => (
                      <Badge key={symbol.value} variant="outline" className="text-xs">
                        {symbol.symbol}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No symbols selected</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Price Range</div>
                <div className="font-medium">
                  ${strategy.priceRange[0]} - ${strategy.priceRange[1]}
                </div>
              </div>

              {strategy.startDate && strategy.endDate && (
                <div>
                  <div className="text-sm text-muted-foreground">Time Range</div>
                  <div className="font-medium text-sm">
                    {strategy.startDate.toLocaleDateString()} - {strategy.endDate.toLocaleDateString()}
                  </div>
                </div>
              )}

              {strategy.results && (
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="font-medium text-lg">
                    {((strategy.results.profitableTrades / strategy.results.totalTrades) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboardExample;