'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  DollarSign,
  Percent,
  BarChart3,
  Send,
  Mic,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { backendApi } from '@/lib/api/backend-client';

interface Goal {
  goal_id: string;
  goal_name: string;
  description: string;
  goal_type: string;
  status: string;
  priority: number;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  created_at: string;
  target_date?: string;
  completed_at?: string;
  assigned_agents: string[];
  assigned_farms: string[];
  metadata?: any;
  // Additional fields for display
  naturalLanguageInput?: string;
  unit?: string;
  timeframe?: string;
  metrics?: {
    successProbability: number;
    estimatedCompletion: string;
    riskLevel: string;
  };
  aiAnalysis?: {
    feasibility: string;
    recommendations: string[];
    requiredActions: string[];
  };
}

interface CreateGoalRequest {
  name: string;
  description: string;
  type: string;
  target_value: number;
  priority?: number;
  target_date?: string;
  assigned_agents?: string[];
  assigned_farms?: string[];
  metadata?: any;
}


export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalMetrics, setGoalMetrics] = useState<any>(null);

  // Load goals on component mount
  useEffect(() => {
    loadGoals();
    loadGoalMetrics();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/goals`
      );
      
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      } else {
        console.warn('Failed to load goals, using fallback data');
        // Fallback to mock data when API is not available
        setGoals([]);
      }
    } catch (error) {
      console.warn('Failed to load goals:', error);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoalMetrics = async () => {
    try {
      const response = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/goals/metrics`
      );
      
      if (response.ok) {
        const data = await response.json();
        setGoalMetrics(data);
      }
    } catch (error) {
      console.warn('Failed to load goal metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-status-online bg-status-online/10';
      case 'in_progress': return 'text-blue-600 bg-blue-100/50';
      case 'pending': return 'text-status-warning bg-status-warning/10';
      case 'failed': return 'text-status-error bg-status-error/10';
      case 'paused': return 'text-muted-foreground bg-muted/30';
      default: return 'text-muted-foreground bg-muted/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100/50';
      case 'high': return 'text-orange-600 bg-orange-100/50';
      case 'medium': return 'text-blue-600 bg-blue-100/50';
      case 'low': return 'text-gray-600 bg-gray-100/50';
      default: return 'text-gray-600 bg-gray-100/50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const processNaturalLanguageGoal = async () => {
    if (!newGoalInput.trim()) {
      toast.error('Please enter a goal description');
      return;
    }

    setIsProcessing(true);
    
    try {
      // First, analyze the natural language input
      const analysisResponse = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/goals/analyze-natural-language`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: newGoalInput })
        }
      );
      
      let analysisData = null;
      if (analysisResponse.ok) {
        analysisData = await analysisResponse.json();
      }
      
      // Create the goal with analyzed data or fallback
      const goalData: CreateGoalRequest = {
        name: analysisData?.suggested_name || `Goal: ${newGoalInput.slice(0, 50)}...`,
        description: analysisData?.description || `Goal created from: "${newGoalInput}"`,
        type: analysisData?.goal_type || 'custom',
        target_value: analysisData?.target_value || 1000,
        priority: analysisData?.priority || 2,
        target_date: analysisData?.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_agents: analysisData?.suggested_agents || [],
        assigned_farms: analysisData?.suggested_farms || [],
        metadata: {
          natural_language_input: newGoalInput,
          ai_analysis: analysisData,
          unit: analysisData?.unit || 'USD',
          timeframe: analysisData?.timeframe || 'daily'
        }
      };
      
      // Create the goal
      const createResponse = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/goals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData)
        }
      );
      
      if (createResponse.ok) {
        const newGoal = await createResponse.json();
        setGoals([newGoal, ...goals]);
        setNewGoalInput('');
        toast.success('Goal created successfully! AI analysis complete.');
        
        // Reload metrics
        loadGoalMetrics();
      } else {
        toast.error('Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const response = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/goals/${goalId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      
      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(goals.map(goal => 
          goal.goal_id === goalId ? updatedGoal : goal
        ));
        toast.success('Goal updated successfully');
      } else {
        toast.error('Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/goals/${goalId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setGoals(goals.filter(goal => goal.goal_id !== goalId));
        toast.success('Goal deleted successfully');
        loadGoalMetrics();
      } else {
        toast.error('Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'USD' || (!unit && value > 10)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    } else if (unit === '%') {
      return `${value}%`;
    }
    return `${value} ${unit || ''}`;
  };

  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = goals.filter(goal => goal.status === 'in_progress').length;
  const totalProgress = goals.length > 0 
    ? goals.reduce((sum, goal) => sum + goal.progress_percentage, 0) / goals.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Goals</h1>
          <p className="text-muted-foreground">
            Set and track your trading objectives with AI-powered goal management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadGoals}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Analysis
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Quick Goal
          </Button>
        </div>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                goals.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedGoals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                inProgressGoals
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active objectives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${totalProgress.toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${goals.length > 0 ? ((completedGoals / goals.length) * 100).toFixed(1) : 0}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Goal completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Natural Language Goal Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Create Goal with Natural Language
          </CardTitle>
          <CardDescription>
            Describe your trading goal in plain English and let AI analyze and set it up for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                placeholder="e.g., 'I want to make $1000 per day with low risk' or 'Help me achieve 80% win rate this month'"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                className="w-full pl-10 pt-2 pb-2 pr-3 border rounded-md resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={processNaturalLanguageGoal}
                disabled={isProcessing || !newGoalInput.trim()}
                className="px-6"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Brain className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">AI is analyzing your goal...</span>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                Processing natural language, determining feasibility, and setting up tracking parameters...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first trading goal using natural language above
            </p>
          </div>
        ) : (
          goals.map((goal) => (
            <Card key={goal.goal_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{goal.goal_name}</CardTitle>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(
                        goal.priority === 1 ? 'low' :
                        goal.priority === 2 ? 'medium' :
                        goal.priority === 3 ? 'high' : 'critical'
                      )}>
                        {goal.priority === 1 ? 'low' :
                         goal.priority === 2 ? 'medium' :
                         goal.priority === 3 ? 'high' : 'critical'}
                      </Badge>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                    {goal.metadata?.natural_language_input && (
                      <div className="text-xs text-muted-foreground italic">
                        "{goal.metadata.natural_language_input}"
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteGoal(goal.goal_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Target</div>
                    <div className="font-medium text-lg">
                      {formatValue(goal.target_value, goal.metadata?.unit)}
                      {goal.metadata?.timeframe && (
                        <span className="text-sm text-muted-foreground ml-1">
                          / {goal.metadata.timeframe}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current</div>
                    <div className="font-medium text-lg">
                      {formatValue(goal.current_value, goal.metadata?.unit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Success Probability</div>
                    <div className="font-medium text-lg text-blue-600">
                      {goal.metrics?.successProbability || goal.metadata?.ai_analysis?.success_probability || 'TBD'}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{goal.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={goal.progress_percentage} className="h-2" />
                </div>

                {/* AI Analysis Summary */}
                {(goal.aiAnalysis || goal.metadata?.ai_analysis) && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Feasibility:</strong> {goal.aiAnalysis?.feasibility || goal.metadata?.ai_analysis?.feasibility || 'Analysis pending...'}
                    </div>
                    <div className="text-sm">
                      <strong>Risk Level:</strong> 
                      <span className={`ml-1 ${getRiskColor(goal.metrics?.riskLevel || goal.metadata?.ai_analysis?.risk_level || 'medium')}`}>
                        {goal.metrics?.riskLevel || goal.metadata?.ai_analysis?.risk_level || 'medium'}
                      </span>
                    </div>
                    {goal.target_date && (
                      <div className="text-sm">
                        <strong>Target Date:</strong> {new Date(goal.target_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned Agents and Farms */}
                <div className="mt-3 space-y-2">
                  {goal.assigned_agents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Agents:</span>
                      {goal.assigned_agents.map((agent, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {goal.assigned_farms.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Farms:</span>
                      {goal.assigned_farms.map((farm, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                          {farm}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}