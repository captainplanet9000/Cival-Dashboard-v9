'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Plus,
  Trash2,
  Activity,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import { backendApi } from '@/lib/api/backend-client';

interface ExpertAgent {
  agent_id: string;
  agent_type: string;
  name: string;
  expertise_level: number;
  learning_phase: string;
  accuracy_rate: number;
  total_decisions: number;
  active_goals: number;
  completed_goals: number;
}

interface ExpertAnalysis {
  agent_type: string;
  agent_name: string;
  decision: {
    signal: string;
    confidence: string;
    confidence_score: number;
    reasoning: string;
    expected_outcome: any;
  };
  expertise_level: number;
}

interface CoordinationResult {
  consensus_decision: {
    signal: string;
    confidence: number;
    supporting_experts: number;
    total_experts: number;
  };
  coordination_confidence: number;
  expert_agreement: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AGENT_TYPES = [
  { value: 'darvas_box', label: 'Darvas Box Expert', description: 'Breakout and consolidation patterns' },
  { value: 'elliott_wave', label: 'Elliott Wave Expert', description: 'Wave pattern analysis' },
  { value: 'williams_alligator', label: 'Williams Alligator Expert', description: 'Trend following analysis' },
  { value: 'adx', label: 'ADX Expert', description: 'Trend strength measurement' },
  { value: 'renko', label: 'Renko Expert', description: 'Price action filtering' }
];

export function ExpertAgentsPanel() {
  const [expertAgents, setExpertAgents] = useState<Record<string, ExpertAgent>>({});
  const [analysisResults, setAnalysisResults] = useState<{
    individual_analyses: Record<string, ExpertAnalysis>;
    coordinated_analysis: CoordinationResult;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [createAgentDialog, setCreateAgentDialog] = useState(false);
  const [goalDialog, setGoalDialog] = useState<{ open: boolean; agentId: string | null }>({ open: false, agentId: null });
  const [newAgentType, setNewAgentType] = useState('');
  const [newAgentName, setNewAgentName] = useState('');

  useEffect(() => {
    loadExpertAgents();
  }, []);

  const loadExpertAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await backendApi.getExpertAgentsStatus();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setExpertAgents(response.data?.agents || {});
      
    } catch (err) {
      console.error('Error loading expert agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expert agents');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSymbol = async () => {
    try {
      setError(null);

      // Create mock market data for analysis
      const marketData = {
        symbol: selectedSymbol,
        price: Math.random() * 1000 + 100,
        volume: Math.random() * 1000000 + 100000,
        timestamp: new Date().toISOString(),
        high: Math.random() * 1100 + 150,
        low: Math.random() * 900 + 50,
        open: Math.random() * 1000 + 100,
        close: Math.random() * 1000 + 100
      };

      const response = await backendApi.analyzeSymbolWithExperts(selectedSymbol, marketData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setAnalysisResults(response.data);
      
    } catch (err) {
      console.error('Error analyzing symbol:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze symbol');
    }
  };

  const createExpertAgent = async () => {
    try {
      if (!newAgentType) return;

      const config = newAgentName ? { name: newAgentName } : {};
      
      const response = await backendApi.createExpertAgent(newAgentType, config);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh agents list
      await loadExpertAgents();
      
      // Reset form
      setNewAgentType('');
      setNewAgentName('');
      setCreateAgentDialog(false);
      
    } catch (err) {
      console.error('Error creating expert agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create expert agent');
    }
  };

  const deleteExpertAgent = async (agentId: string) => {
    try {
      const response = await backendApi.deleteExpertAgent(agentId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh agents list
      await loadExpertAgents();
      
    } catch (err) {
      console.error('Error deleting expert agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expert agent');
    }
  };

  const assignGoalToAgent = async (agentId: string, goalData: any) => {
    try {
      const response = await backendApi.assignGoalToExpertAgent(agentId, goalData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh agents list to show updated goals
      await loadExpertAgents();
      setGoalDialog({ open: false, agentId: null });
      
    } catch (err) {
      console.error('Error assigning goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign goal');
    }
  };

  const optimizeAgent = async (agentId: string) => {
    try {
      const response = await backendApi.optimizeExpertAgent(agentId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh agents list
      await loadExpertAgents();
      
    } catch (err) {
      console.error('Error optimizing agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize agent');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading expert agents...</p>
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
            <p className="text-red-600 font-medium">Error Loading Expert Agents</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button onClick={loadExpertAgents} className="mt-3" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const agentsList = Object.values(expertAgents);
  const totalAgents = agentsList.length;
  const averageExpertise = totalAgents > 0 ? agentsList.reduce((sum, agent) => sum + agent.expertise_level, 0) / totalAgents : 0;
  const totalDecisions = agentsList.reduce((sum, agent) => sum + agent.total_decisions, 0);
  const averageAccuracy = totalAgents > 0 ? agentsList.reduce((sum, agent) => sum + agent.accuracy_rate, 0) / totalAgents : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2" />
            Expert Agents System
          </h2>
          <p className="text-sm text-gray-600">
            Specialized AI agents with domain expertise in trading strategies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={createAgentDialog} onOpenChange={setCreateAgentDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Expert Agent</DialogTitle>
                <DialogDescription>
                  Create a new specialized expert agent with domain expertise
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agent-type">Agent Type</Label>
                  <Select value={newAgentType} onValueChange={setNewAgentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="agent-name">Agent Name (Optional)</Label>
                  <Input
                    id="agent-name"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Custom agent name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateAgentDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createExpertAgent} disabled={!newAgentType}>
                    Create Agent
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadExpertAgents} size="sm" variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Expertise</p>
                <p className="text-2xl font-bold text-gray-900">{(averageExpertise * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-900">{totalDecisions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{(averageAccuracy * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Expert Agents</TabsTrigger>
          <TabsTrigger value="analysis">Live Analysis</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agentsList.map((agent) => (
              <Card key={agent.agent_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant="secondary">
                      {agent.agent_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    Learning Phase: {agent.learning_phase.charAt(0).toUpperCase() + agent.learning_phase.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Expertise Level */}
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Expertise Level</span>
                        <span>{(agent.expertise_level * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${agent.expertise_level * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Accuracy Rate */}
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Accuracy Rate</span>
                        <span>{(agent.accuracy_rate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${agent.accuracy_rate * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Decisions</p>
                        <p className="font-medium">{agent.total_decisions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Active Goals</p>
                        <p className="font-medium">{agent.active_goals}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setGoalDialog({ open: true, agentId: agent.agent_id })}
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => optimizeAgent(agent.agent_id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteExpertAgent(agent.agent_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <div className="space-y-6">
            {/* Analysis Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Live Symbol Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div>
                    <Label htmlFor="symbol">Trading Symbol</Label>
                    <Input
                      id="symbol"
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                      placeholder="BTC/USD"
                      className="w-32"
                    />
                  </div>
                  <Button onClick={analyzeSymbol} className="mt-6">
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResults && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Individual Expert Analyses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Individual Expert Analyses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analysisResults.individual_analyses).map(([agentId, analysis]) => (
                        <div key={agentId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{analysis.agent_name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                analysis.decision.signal === 'BUY' ? 'default' :
                                analysis.decision.signal === 'SELL' ? 'destructive' : 
                                'secondary'
                              }>
                                {analysis.decision.signal}
                              </Badge>
                              <Badge variant="outline">
                                {(analysis.decision.confidence_score * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{analysis.decision.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Coordinated Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coordinated Decision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <Badge 
                          variant={
                            analysisResults.coordinated_analysis.consensus_decision.signal === 'BUY' ? 'default' :
                            analysisResults.coordinated_analysis.consensus_decision.signal === 'SELL' ? 'destructive' : 
                            'secondary'
                          }
                          className="text-lg px-4 py-2"
                        >
                          {analysisResults.coordinated_analysis.consensus_decision.signal}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Consensus Confidence</p>
                          <p className="font-medium">{(analysisResults.coordinated_analysis.consensus_decision.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expert Agreement</p>
                          <p className="font-medium">{analysisResults.coordinated_analysis.consensus_decision.supporting_experts}/{analysisResults.coordinated_analysis.consensus_decision.total_experts}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coordination Confidence</span>
                          <span>{(analysisResults.coordinated_analysis.coordination_confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${analysisResults.coordinated_analysis.coordination_confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="coordination" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Coordination Settings</CardTitle>
              <CardDescription>
                Configure how expert agents coordinate their decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Coordination settings and real-time coordination status will be displayed here.
                </p>
                {/* Coordination settings would go here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={AGENT_TYPES.map(type => ({
                        name: type.label,
                        value: agentsList.filter(agent => agent.agent_type === type.value).length
                      })).filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {AGENT_TYPES.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentsList.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />
                    <Bar dataKey="accuracy_rate" fill="#8884d8" name="Accuracy Rate" />
                    <Bar dataKey="expertise_level" fill="#82ca9d" name="Expertise Level" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Goal Assignment Dialog */}
      <Dialog open={goalDialog.open} onOpenChange={(open) => setGoalDialog({ open, agentId: goalDialog.agentId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Goal to Expert Agent</DialogTitle>
            <DialogDescription>
              Set a performance goal for the selected expert agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-type">Goal Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">Accuracy Target</SelectItem>
                  <SelectItem value="win_rate">Win Rate Target</SelectItem>
                  <SelectItem value="learning_cycles">Learning Cycles</SelectItem>
                  <SelectItem value="expertise_level">Expertise Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target-value">Target Value</Label>
              <Input
                id="target-value"
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="0.8"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setGoalDialog({ open: false, agentId: null })}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (goalDialog.agentId) {
                  assignGoalToAgent(goalDialog.agentId, {
                    goal_type: 'accuracy',
                    target_value: 0.8
                  });
                }
              }}>
                Assign Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}