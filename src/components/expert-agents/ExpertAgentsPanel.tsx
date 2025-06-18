"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  TrendingUp,
  Activity,
  BarChart3,
  Waves,
  Target,
  RefreshCw,
  Power,
  PowerOff,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { backendApi } from '@/lib/api/backend-client';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface ExpertAgent {
  agent_id: string;
  agent_type: string;
  name: string;
  version: string;
  is_active: boolean;
  total_decisions: number;
  success_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  created_at: string;
}

interface ExpertAnalysis {
  agent_type: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  additional_data: Record<string, any>;
}

interface CoordinatedAnalysis {
  analysis_id: string;
  symbol: string;
  timestamp: string;
  expert_analyses: Record<string, ExpertAnalysis>;
  coordinated_decision: Record<string, any>;
  recommendation: string;
  confidence: number;
}

const agentTypeIcons: Record<string, React.ReactNode> = {
  DarvasBoxExpert: <BarChart3 className="h-4 w-4" />,
  ElliottWaveExpert: <Waves className="h-4 w-4" />,
  WilliamsAlligatorExpert: <Activity className="h-4 w-4" />,
  ADXExpert: <TrendingUp className="h-4 w-4" />,
  RenkoExpert: <Target className="h-4 w-4" />
};

const agentTypeDescriptions: Record<string, string> = {
  DarvasBoxExpert: "Specializes in box breakout patterns and volume analysis",
  ElliottWaveExpert: "Masters Elliott Wave theory and Fibonacci relationships",
  WilliamsAlligatorExpert: "Multi-timeframe trend analysis using Alligator indicators",
  ADXExpert: "Measures trend strength and directional movement",
  RenkoExpert: "Filters market noise using price action analysis"
};

export function ExpertAgentsPanel() {
  const [experts, setExperts] = useState<ExpertAgent[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<ExpertAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<CoordinatedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      setIsLoading(true);
      const response = await backendApi.listExpertAgents();
      setExperts(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load expert agents:', err);
      setError('Failed to load expert agents');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpertStatus = async (expert: ExpertAgent) => {
    try {
      if (expert.is_active) {
        await backendApi.deactivateExpertAgent(expert.agent_id);
      } else {
        await backendApi.activateExpertAgent(expert.agent_id);
      }
      await loadExperts();
    } catch (err) {
      console.error('Failed to toggle expert status:', err);
      setError('Failed to update expert status');
    }
  };

  const runMarketAnalysis = async (symbol: string = 'BTC/USD') => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const response = await backendApi.runExpertAnalysis(symbol, {
        timeframe: 'H1',
        include_history: true,
        market_data: {}
      });
      
      setLatestAnalysis(response.data);
    } catch (err) {
      console.error('Failed to run analysis:', err);
      setError('Failed to run market analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy': return 'text-green-600';
      case 'sell': return 'text-red-600';
      case 'hold': return 'text-yellow-600';
      case 'watch': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (confidence >= 0.6) return <Badge variant="default" className="bg-yellow-500">Medium</Badge>;
    return <Badge variant="default" className="bg-red-500">Low</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                Expert Trading Agents
              </CardTitle>
              <CardDescription>
                5 specialized AI agents with deep domain expertise
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => loadExperts()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => runMarketAnalysis()} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Expert Agents</TabsTrigger>
          <TabsTrigger value="analysis">Latest Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Expert Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <Card key={expert.agent_id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {agentTypeIcons[expert.agent_type]}
                      <CardTitle className="text-lg">{expert.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpertStatus(expert)}
                      className={expert.is_active ? 'text-green-600' : 'text-gray-400'}
                    >
                      {expert.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {agentTypeDescriptions[expert.agent_type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{formatPercentage(expert.success_rate)}</span>
                    </div>
                    <Progress value={expert.success_rate} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Decisions</span>
                      <p className="font-medium">{expert.total_decisions}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sharpe Ratio</span>
                      <p className="font-medium">{expert.sharpe_ratio.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Badge variant={expert.is_active ? 'default' : 'secondary'}>
                      {expert.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      v{expert.version}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Latest Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {latestAnalysis ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Coordinated Analysis Result</CardTitle>
                  <CardDescription>
                    Symbol: {latestAnalysis.symbol} | Time: {new Date(latestAnalysis.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Final Recommendation</p>
                        <p className={`text-2xl font-bold ${getRecommendationColor(latestAnalysis.recommendation)}`}>
                          {latestAnalysis.recommendation.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">{formatPercentage(latestAnalysis.confidence * 100)}</span>
                          {getConfidenceBadge(latestAnalysis.confidence)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Expert Opinions</h4>
                      {Object.entries(latestAnalysis.expert_analyses).map(([agentId, analysis]) => (
                        <Card key={agentId} className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {agentTypeIcons[analysis.agent_type] || <Brain className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{analysis.agent_type}</p>
                                <span className={`text-sm font-medium ${getRecommendationColor(analysis.recommendation)}`}>
                                  {analysis.recommendation.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{analysis.reasoning}</p>
                              <div className="flex items-center gap-2">
                                <Progress value={analysis.confidence * 100} className="h-1 flex-1" />
                                <span className="text-xs">{formatPercentage(analysis.confidence * 100)}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No analysis available yet. Click "Run Analysis" to generate expert insights.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collective Performance</CardTitle>
              <CardDescription>
                Combined performance metrics across all expert agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Decisions</p>
                  <p className="text-2xl font-bold">
                    {experts.reduce((sum, e) => sum + e.total_decisions, 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Success Rate</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(
                      experts.reduce((sum, e) => sum + e.success_rate, 0) / experts.length
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Experts</p>
                  <p className="text-2xl font-bold">
                    {experts.filter(e => e.is_active).length} / {experts.length}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Sharpe Ratio</p>
                  <p className="text-2xl font-bold">
                    {(experts.reduce((sum, e) => sum + e.sharpe_ratio, 0) / experts.length).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Individual Performance Rankings</h4>
                {experts
                  .sort((a, b) => b.success_rate - a.success_rate)
                  .map((expert, index) => (
                    <div key={expert.agent_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        <div className="flex items-center gap-2">
                          {agentTypeIcons[expert.agent_type]}
                          <span className="font-medium">{expert.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{formatPercentage(expert.success_rate)} success</span>
                        <span className="text-muted-foreground">|</span>
                        <span>{expert.total_decisions} decisions</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}