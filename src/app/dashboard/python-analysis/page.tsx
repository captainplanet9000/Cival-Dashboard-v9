'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Play, 
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Brain,
  Database,
  Zap,
  Terminal,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle2
} from 'lucide-react';

interface AnalysisScript {
  id: string;
  name: string;
  description: string;
  category: 'backtest' | 'analysis' | 'optimization' | 'research';
  status: 'ready' | 'running' | 'completed' | 'error';
  lastRun: string;
  runtime: string;
  results?: any;
}

const mockScripts: AnalysisScript[] = [
  {
    id: 'backtest-1',
    name: 'Multi-Strategy Backtest',
    description: 'Comprehensive backtesting across all agent strategies with performance analysis',
    category: 'backtest',
    status: 'completed',
    lastRun: '2024-01-15 14:30:00',
    runtime: '45.3s',
    results: {
      totalReturn: 23.4,
      sharpeRatio: 2.1,
      maxDrawdown: 8.5,
      winRate: 67.8
    }
  },
  {
    id: 'optimize-1',
    name: 'Parameter Optimization',
    description: 'Genetic algorithm optimization for Darvas Box strategy parameters',
    category: 'optimization',
    status: 'running',
    lastRun: '2024-01-15 15:45:00',
    runtime: '12m 34s'
  },
  {
    id: 'research-1',
    name: 'Market Regime Analysis',
    description: 'Hidden Markov Model analysis for market regime identification',
    category: 'research',
    status: 'ready',
    lastRun: '2024-01-14 09:15:00',
    runtime: '2m 15s'
  }
];

export default function PythonAnalysisPage() {
  const [scripts] = useState<AnalysisScript[]>(mockScripts);
  const [selectedScript, setSelectedScript] = useState<AnalysisScript | null>(null);
  const [codeEditor, setCodeEditor] = useState(`
# Advanced Trading Strategy Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
import yfinance as yf

def analyze_strategy_performance(trades_df):
    """
    Comprehensive strategy performance analysis
    """
    # Calculate basic metrics
    total_return = (trades_df['pnl'].sum() / trades_df['capital'].iloc[0]) * 100
    win_rate = (trades_df['pnl'] > 0).mean() * 100
    
    # Risk metrics
    returns = trades_df['pnl'] / trades_df['capital'].shift(1)
    sharpe_ratio = returns.mean() / returns.std() * np.sqrt(252)
    
    # Drawdown analysis
    cumulative = (1 + returns).cumprod()
    rolling_max = cumulative.expanding().max()
    drawdown = (cumulative - rolling_max) / rolling_max
    max_drawdown = drawdown.min() * 100
    
    return {
        'total_return': total_return,
        'win_rate': win_rate,
        'sharpe_ratio': sharpe_ratio,
        'max_drawdown': abs(max_drawdown)
    }

def monte_carlo_simulation(strategy_returns, num_simulations=1000):
    """
    Monte Carlo simulation for strategy performance
    """
    results = []
    for _ in range(num_simulations):
        simulated_returns = np.random.choice(strategy_returns, len(strategy_returns), replace=True)
        final_return = np.prod(1 + simulated_returns) - 1
        results.append(final_return)
    
    return {
        'mean_return': np.mean(results),
        'std_return': np.std(results),
        'var_95': np.percentile(results, 5),
        'var_99': np.percentile(results, 1)
    }

# Run analysis
print("Starting comprehensive strategy analysis...")
# Analysis code would continue here...
`);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'ready': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'backtest': return 'text-purple-600 bg-purple-100';
      case 'analysis': return 'text-blue-600 bg-blue-100';
      case 'optimization': return 'text-orange-600 bg-orange-100';
      case 'research': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const runScript = (scriptId: string) => {
    console.log(`Running script: ${scriptId}`);
    // Implement script execution logic
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Python Analysis</h1>
          <p className="text-muted-foreground">
            Advanced quantitative analysis and backtesting with Python
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Script
          </Button>
          <Button>
            <Code className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scripts</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scripts.length}</div>
            <p className="text-xs text-muted-foreground">
              {scripts.filter(s => s.status === 'running').length} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backtests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scripts.filter(s => s.category === 'backtest').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Strategy validations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimizations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scripts.filter(s => s.category === 'optimization').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Parameter tuning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scripts.filter(s => s.category === 'research').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Market analysis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scripts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scripts">Analysis Scripts</TabsTrigger>
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          <TabsTrigger value="results">Results & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {scripts.map((script) => (
              <Card key={script.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{script.name}</CardTitle>
                        <Badge className={getStatusColor(script.status)}>
                          {script.status}
                        </Badge>
                        <Badge className={getCategoryColor(script.category)}>
                          {script.category}
                        </Badge>
                      </div>
                      <CardDescription>{script.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => runScript(script.id)}
                        disabled={script.status === 'running'}
                      >
                        {script.status === 'running' ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Last Run</div>
                      <div className="font-medium">{script.lastRun}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Runtime</div>
                      <div className="font-medium">{script.runtime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="flex items-center gap-2">
                        {script.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        <span className="font-medium capitalize">{script.status}</span>
                      </div>
                    </div>
                  </div>

                  {script.results && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-sm font-medium mb-2">Latest Results</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Return:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {script.results.totalReturn}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sharpe:</span>
                          <span className="ml-2 font-medium">{script.results.sharpeRatio}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Drawdown:</span>
                          <span className="ml-2 font-medium text-red-600">
                            -{script.results.maxDrawdown}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className="ml-2 font-medium">{script.results.winRate}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Python Code Editor</CardTitle>
                  <CardDescription>
                    Write and execute advanced trading analysis scripts
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-3 w-3" />
                    Load
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-3 w-3" />
                    Save
                  </Button>
                  <Button size="sm">
                    <Play className="mr-2 h-3 w-3" />
                    Run
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <textarea
                  value={codeEditor}
                  onChange={(e) => setCodeEditor(e.target.value)}
                  className="w-full h-96 p-4 font-mono text-sm bg-muted/30 border-0 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="# Enter your Python analysis code here..."
                />
              </div>
              
              {/* Console Output */}
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Console Output</div>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-32 overflow-y-auto">
                  <div>Python 3.11.0 | Analysis Environment Ready</div>
                  <div>>>> Loaded libraries: pandas, numpy, matplotlib, scipy, yfinance</div>
                  <div>>>> Trading data connection: ✓ Active</div>
                  <div>>>> Agent performance data: ✓ Available</div>
                  <div className="text-yellow-400">>>> Ready for analysis...</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Multi-Strategy Backtest</div>
                      <Badge className="bg-green-100 text-green-600">Completed</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Jan 15, 2024 • Runtime: 45.3s
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Return:</span>
                        <span className="ml-2 font-medium text-green-600">+23.4%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sharpe Ratio:</span>
                        <span className="ml-2 font-medium">2.1</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Market Regime Analysis</div>
                      <Badge className="bg-blue-100 text-blue-600">Available</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Jan 14, 2024 • Runtime: 2m 15s
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Identified:</span>
                      <span className="ml-2 font-medium">3 distinct market regimes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div>Performance charts will be displayed here</div>
                    <div className="text-sm mt-1">Run analysis scripts to generate visualizations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Downloadable Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                Download detailed analysis reports and data exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">Strategy Performance Report</div>
                      <div className="text-sm text-muted-foreground">PDF • 2.3 MB</div>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium">Backtest Data Export</div>
                      <div className="text-sm text-muted-foreground">CSV • 850 KB</div>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="font-medium">Risk Analysis Summary</div>
                      <div className="text-sm text-muted-foreground">XLSX • 1.1 MB</div>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}