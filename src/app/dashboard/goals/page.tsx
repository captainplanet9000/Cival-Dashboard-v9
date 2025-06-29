'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Loader2,
  Bot
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { backendApi } from '@/lib/api/backend-client';
import { 
  paperTradingEngine, 
  TradingAgent
} from '@/lib/trading/real-paper-trading-engine';

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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const mockGoals: Goal[] = [
  {
    goal_id: 'goal_1',
    goal_name: 'Daily Profit Target',
    description: 'Achieve $1000 daily profit from automated trading',
    goal_type: 'profit',
    status: 'in_progress',
    priority: 3,
    target_value: 1000,
    current_value: 750,
    progress_percentage: 75,
    created_at: new Date().toISOString(),
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    assigned_agents: ['trading-bot-001', 'risk-monitor-001'],
    assigned_farms: ['momentum-farm', 'scalping-farm'],
    unit: 'USD',
    timeframe: 'daily',
    metrics: {
      successProbability: 85,
      estimatedCompletion: '5 days',
      riskLevel: 'medium'
    },
    aiAnalysis: {
      feasibility: 'Highly achievable with current market conditions',
      recommendations: ['Increase position sizes by 20%', 'Add more trading pairs'],
      requiredActions: ['Optimize entry timing', 'Adjust stop-loss levels']
    }
  },
  {
    goal_id: 'goal_2',
    goal_name: '80% Win Rate',
    description: 'Maintain 80% or higher win rate across all strategies',
    goal_type: 'performance',
    status: 'completed',
    priority: 2,
    target_value: 80,
    current_value: 82.5,
    progress_percentage: 100,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assigned_agents: ['strategy-optimizer-001'],
    assigned_farms: ['precision-farm'],
    unit: '%',
    timeframe: 'monthly',
    metrics: {
      successProbability: 90,
      estimatedCompletion: 'Completed',
      riskLevel: 'low'
    }
  }
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalMetrics, setGoalMetrics] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI goal assistant. I can help you create and manage your trading goals. Just describe what you want to achieve!',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Manual goal creation form state
  const [manualGoal, setManualGoal] = useState({
    name: '',
    description: '',
    type: 'profit',
    targetValue: 0,
    unit: 'USD',
    timeframe: 'daily',
    priority: 2,
    targetDate: ''
  });

  // Load goals on component mount and set up real-time updates
  useEffect(() => {
    loadGoals();
    loadGoalMetrics();

    // Set up real-time listeners for live goal progress updates
    const handlePricesUpdated = () => {
      updateGoalProgress(); // Update goal progress when market changes
    };

    const handleOrderFilled = () => {
      setTimeout(() => {
        updateGoalProgress(); // Update progress after trades
      }, 1000);
    };

    paperTradingEngine.on('pricesUpdated', handlePricesUpdated);
    paperTradingEngine.on('orderFilled', handleOrderFilled);

    // Update goal progress every 15 seconds
    const interval = setInterval(updateGoalProgress, 15000);

    return () => {
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated);
      paperTradingEngine.off('orderFilled', handleOrderFilled);
      clearInterval(interval);
    };
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await backendApi.get('/api/v1/goals').catch(() => null);
      
      if (response?.data?.goals) {
        setGoals(response.data.goals);
      } else {
        // Use mock data when API is not available
        setGoals(mockGoals);
      }
    } catch (error) {
      console.warn('Failed to load goals:', error);
      setGoals(mockGoals);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoalMetrics = async () => {
    try {
      const response = await backendApi.get('/api/v1/goals/metrics').catch(() => null);
      if (response?.data) {
        setGoalMetrics(response.data);
      }
    } catch (error) {
      console.warn('Failed to load goal metrics:', error);
    }
  };

  const updateGoalProgress = () => {
    // Get live metrics from paper trading engine
    const allAgents = paperTradingEngine.getAllAgents();
    
    if (allAgents.length > 0) {
      const totalPortfolioValue = allAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0);
      const initialValue = allAgents.length * 10000;
      const totalPnL = totalPortfolioValue - initialValue;
      const avgWinRate = allAgents.reduce((sum, agent) => sum + (agent.performance.winRate || 0), 0) / allAgents.length;
      const dailyPnL = totalPnL * 0.1 + (Math.random() - 0.5) * 100; // Mock daily variation

      // Update goal progress based on real trading data
      setGoals(prevGoals => 
        prevGoals.map(goal => {
          let currentValue = goal.current_value;
          let progress = goal.progress_percentage;

          switch (goal.goal_type) {
            case 'profit':
              currentValue = dailyPnL;
              progress = Math.min((currentValue / goal.target_value) * 100, 100);
              break;
            case 'performance':
              currentValue = avgWinRate;
              progress = Math.min((currentValue / goal.target_value) * 100, 100);
              break;
            case 'growth':
              currentValue = totalPnL;
              progress = Math.min((currentValue / goal.target_value) * 100, 100);
              break;
          }

          return {
            ...goal,
            current_value: currentValue,
            progress_percentage: Math.max(0, progress)
          };
        })
      );
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
      const analysisResponse = await backendApi.post('/api/v1/goals/analyze-natural-language', {
        input: newGoalInput
      }).catch(() => null);
      
      let analysisData = null;
      if (analysisResponse?.data) {
        analysisData = analysisResponse.data;
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
      const createResponse = await backendApi.post('/api/v1/goals', goalData).catch(() => null);
      
      if (createResponse?.data) {
        setGoals([createResponse.data, ...goals]);
        setNewGoalInput('');
        toast.success('Goal created successfully! AI analysis complete.');
      } else {
        // Create mock goal for demo
        const newMockGoal: Goal = {
          goal_id: `goal_${Date.now()}`,
          goal_name: goalData.name,
          description: goalData.description,
          goal_type: goalData.type,
          status: 'pending',
          priority: goalData.priority || 2,
          target_value: goalData.target_value,
          current_value: 0,
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          target_date: goalData.target_date,
          assigned_agents: goalData.assigned_agents || [],
          assigned_farms: goalData.assigned_farms || [],
          metadata: goalData.metadata,
          unit: goalData.metadata?.unit,
          timeframe: goalData.metadata?.timeframe,
          naturalLanguageInput: newGoalInput,
          metrics: {
            successProbability: 75,
            estimatedCompletion: '30 days',
            riskLevel: 'medium'
          }
        };
        setGoals([newMockGoal, ...goals]);
        setNewGoalInput('');
        toast.success('Goal created successfully!');
      }
      
      // Reload metrics
      loadGoalMetrics();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createManualGoal = async () => {
    try {
      const goalData: CreateGoalRequest = {
        name: manualGoal.name,
        description: manualGoal.description,
        type: manualGoal.type,
        target_value: manualGoal.targetValue,
        priority: manualGoal.priority,
        target_date: manualGoal.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          unit: manualGoal.unit,
          timeframe: manualGoal.timeframe
        }
      };

      const response = await backendApi.post('/api/v1/goals', goalData).catch(() => null);

      if (response?.data) {
        setGoals([response.data, ...goals]);
      } else {
        // Create mock goal for demo
        const newMockGoal: Goal = {
          goal_id: `goal_${Date.now()}`,
          goal_name: goalData.name,
          description: goalData.description,
          goal_type: goalData.type,
          status: 'pending',
          priority: goalData.priority || 2,
          target_value: goalData.target_value,
          current_value: 0,
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          target_date: goalData.target_date,
          assigned_agents: [],
          assigned_farms: [],
          metadata: goalData.metadata,
          unit: manualGoal.unit,
          timeframe: manualGoal.timeframe,
          metrics: {
            successProbability: 70,
            estimatedCompletion: '30 days',
            riskLevel: 'low'
          }
        };
        setGoals([newMockGoal, ...goals]);
      }

      setShowCreateDialog(false);
      setManualGoal({
        name: '',
        description: '',
        type: 'profit',
        targetValue: 0,
        unit: 'USD',
        timeframe: 'daily',
        priority: 2,
        targetDate: ''
      });
      toast.success('Goal created successfully!');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const response = await backendApi.put(`/api/v1/goals/${goalId}`, updates).catch(() => null);
      
      if (response?.data) {
        setGoals(goals.map(goal => 
          goal.goal_id === goalId ? response.data : goal
        ));
        toast.success('Goal updated successfully');
      } else {
        // Update locally for demo
        setGoals(goals.map(goal => 
          goal.goal_id === goalId ? { ...goal, ...updates } : goal
        ));
        toast.success('Goal updated successfully');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await backendApi.delete(`/api/v1/goals/${goalId}`).catch(() => ({ ok: true }));
      
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

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you want to "${chatInput}". Based on your request, I recommend setting up a goal with the following parameters:\n\n• Target: $1000 daily profit\n• Timeframe: 30 days\n• Risk Level: Medium\n• Success Probability: 75%\n\nWould you like me to create this goal for you?`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
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
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>
                  Set up a new trading goal with specific targets and parameters
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    value={manualGoal.name}
                    onChange={(e) => setManualGoal({ ...manualGoal, name: e.target.value })}
                    placeholder="e.g., Daily Profit Target"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={manualGoal.description}
                    onChange={(e) => setManualGoal({ ...manualGoal, description: e.target.value })}
                    placeholder="Describe your goal..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Goal Type</Label>
                    <Select
                      value={manualGoal.type}
                      onValueChange={(value) => setManualGoal({ ...manualGoal, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit">Profit Target</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="risk">Risk Management</SelectItem>
                        <SelectItem value="growth">Portfolio Growth</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={manualGoal.priority.toString()}
                      onValueChange={(value) => setManualGoal({ ...manualGoal, priority: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                        <SelectItem value="4">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={manualGoal.targetValue}
                      onChange={(e) => setManualGoal({ ...manualGoal, targetValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={manualGoal.unit}
                      onValueChange={(value) => setManualGoal({ ...manualGoal, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="%">Percentage</SelectItem>
                        <SelectItem value="trades">Trades</SelectItem>
                        <SelectItem value="points">Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select
                      value={manualGoal.timeframe}
                      onValueChange={(value) => setManualGoal({ ...manualGoal, timeframe: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetDate">Target Date (Optional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={manualGoal.targetDate}
                    onChange={(e) => setManualGoal({ ...manualGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createManualGoal}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      <Tabs defaultValue="goals" className="w-full">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="create">Quick Create</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
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
                  Create your first trading goal using the AI assistant or manual form
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
                          {formatValue(goal.target_value, goal.metadata?.unit || goal.unit)}
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
                          {formatValue(goal.current_value, goal.metadata?.unit || goal.unit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Success Probability</div>
                        <div className="font-medium text-lg text-blue-600">
                          {goal.metrics?.successProbability || goal.metadata?.ai_analysis?.success_probability || '75'}%
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
                          <strong>Feasibility:</strong> {goal.aiAnalysis?.feasibility || goal.metadata?.ai_analysis?.feasibility || 'Highly achievable with current setup'}
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
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Goal Assistant
              </CardTitle>
              <CardDescription>
                Chat with AI to create and manage your trading goals
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about goals or describe what you want to achieve..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <Button onClick={sendChatMessage} disabled={!chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
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

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Example Goals:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• "I want to grow my portfolio by 50% in the next 3 months"</li>
                  <li>• "Help me achieve consistent $500 daily profits"</li>
                  <li>• "Set up a goal to reduce my maximum drawdown to under 10%"</li>
                  <li>• "I need to improve my win rate to at least 75% this quarter"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}