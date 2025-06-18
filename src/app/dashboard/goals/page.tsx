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
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  naturalLanguageInput: string;
  type: 'profit' | 'performance' | 'risk' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target: {
    value: number;
    unit: string;
    timeframe: string;
  };
  current: {
    value: number;
    progress: number;
  };
  createdAt: string;
  deadline: string;
  assignedAgents: string[];
  metrics: {
    successProbability: number;
    estimatedCompletion: string;
    riskLevel: string;
  };
  aiAnalysis: {
    feasibility: string;
    recommendations: string[];
    requiredActions: string[];
  };
}

// Mock goals data
const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Achieve $5000 Daily Profit',
    description: 'Generate consistent daily profit of $5000 through coordinated agent trading',
    naturalLanguageInput: 'I want to make $5000 every day using my trading agents',
    type: 'profit',
    status: 'in_progress',
    priority: 'high',
    target: {
      value: 5000,
      unit: 'USD',
      timeframe: 'daily'
    },
    current: {
      value: 3247.50,
      progress: 64.95
    },
    createdAt: '2024-01-15',
    deadline: '2024-02-15',
    assignedAgents: ['Darvas Farm', 'Elliott Wave Farm', 'Multi-Strategy Farm'],
    metrics: {
      successProbability: 78.5,
      estimatedCompletion: '2024-01-28',
      riskLevel: 'medium'
    },
    aiAnalysis: {
      feasibility: 'Highly achievable with current agent performance and market conditions',
      recommendations: [
        'Increase allocation to high-performing Darvas Box agents',
        'Optimize Elliott Wave farm for current market volatility',
        'Implement dynamic position sizing based on market conditions'
      ],
      requiredActions: [
        'Monitor daily performance against target',
        'Adjust agent parameters based on market feedback',
        'Implement risk controls to protect gains'
      ]
    }
  },
  {
    id: 'goal-2',
    title: 'Improve Overall Win Rate to 75%',
    description: 'Optimize agent performance to achieve 75% win rate across all strategies',
    naturalLanguageInput: 'Help me get my trading win rate up to 75% or higher',
    type: 'performance',
    status: 'in_progress',
    priority: 'medium',
    target: {
      value: 75,
      unit: '%',
      timeframe: 'monthly'
    },
    current: {
      value: 68.2,
      progress: 90.93
    },
    createdAt: '2024-01-10',
    deadline: '2024-02-10',
    assignedAgents: ['All Active Agents'],
    metrics: {
      successProbability: 85.2,
      estimatedCompletion: '2024-01-25',
      riskLevel: 'low'
    },
    aiAnalysis: {
      feasibility: 'Very achievable through strategy optimization and better market timing',
      recommendations: [
        'Focus on high-probability setups during optimal market hours',
        'Implement stricter entry criteria for lower-performing strategies',
        'Enhance risk management to reduce losing trades'
      ],
      requiredActions: [
        'Analyze losing trades to identify patterns',
        'Optimize agent parameters for current market regime',
        'Implement dynamic strategy switching based on market conditions'
      ]
    }
  },
  {
    id: 'goal-3',
    title: 'Reduce Maximum Drawdown Below 5%',
    description: 'Implement risk controls to keep maximum drawdown under 5%',
    naturalLanguageInput: 'Keep my maximum losses under 5% of my trading capital',
    type: 'risk',
    status: 'completed',
    priority: 'critical',
    target: {
      value: 5,
      unit: '%',
      timeframe: 'ongoing'
    },
    current: {
      value: 3.2,
      progress: 100
    },
    createdAt: '2024-01-05',
    deadline: '2024-01-20',
    assignedAgents: ['Risk Management System'],
    metrics: {
      successProbability: 95.8,
      estimatedCompletion: '2024-01-18',
      riskLevel: 'low'
    },
    aiAnalysis: {
      feasibility: 'Successfully achieved through improved position sizing and stop-loss implementation',
      recommendations: [
        'Maintain current risk management protocols',
        'Continue monitoring correlation between strategies',
        'Implement dynamic position sizing based on volatility'
      ],
      requiredActions: [
        'Regular review of risk metrics',
        'Continuous monitoring of portfolio exposure',
        'Adjust position sizes based on market volatility'
      ]
    }
  }
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

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
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI analysis of natural language input
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: 'AI Generated Goal',
      description: `Goal created from: "${newGoalInput}"`,
      naturalLanguageInput: newGoalInput,
      type: 'custom',
      status: 'pending',
      priority: 'medium',
      target: {
        value: 1000,
        unit: 'USD',
        timeframe: 'daily'
      },
      current: {
        value: 0,
        progress: 0
      },
      createdAt: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedAgents: ['To be assigned'],
      metrics: {
        successProbability: 75.0,
        estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskLevel: 'medium'
      },
      aiAnalysis: {
        feasibility: 'AI analysis in progress...',
        recommendations: ['Analyzing requirements...'],
        requiredActions: ['Setting up goal parameters...']
      }
    };

    setGoals([newGoal, ...goals]);
    setNewGoalInput('');
    setIsProcessing(false);
    toast.success('Goal created successfully! AI analysis complete.');
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    } else if (unit === '%') {
      return `${value}%`;
    }
    return `${value} ${unit}`;
  };

  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = goals.filter(goal => goal.status === 'in_progress').length;
  const totalProgress = goals.reduce((sum, goal) => sum + goal.current.progress, 0) / goals.length;

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
          <Button variant="outline">
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
            <div className="text-2xl font-bold">{goals.length}</div>
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
            <div className="text-2xl font-bold">{inProgressGoals}</div>
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
            <div className="text-2xl font-bold">{totalProgress.toFixed(1)}%</div>
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
              {goals.length > 0 ? ((completedGoals / goals.length) * 100).toFixed(1) : 0}%
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
        {goals.map((goal) => (
          <Card key={goal.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{goal.title}</CardTitle>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                  </div>
                  <CardDescription>{goal.description}</CardDescription>
                  {goal.naturalLanguageInput && (
                    <div className="text-xs text-muted-foreground italic">
                      "{goal.naturalLanguageInput}"
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
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
                    {formatValue(goal.target.value, goal.target.unit)}
                    <span className="text-sm text-muted-foreground ml-1">
                      / {goal.target.timeframe}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current</div>
                  <div className="font-medium text-lg">
                    {formatValue(goal.current.value, goal.target.unit)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Success Probability</div>
                  <div className="font-medium text-lg text-blue-600">
                    {goal.metrics.successProbability}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{goal.current.progress.toFixed(1)}%</span>
                </div>
                <Progress value={goal.current.progress} className="h-2" />
              </div>

              {/* AI Analysis Summary */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Feasibility:</strong> {goal.aiAnalysis.feasibility}
                </div>
                <div className="text-sm">
                  <strong>Risk Level:</strong> 
                  <span className={`ml-1 ${getRiskColor(goal.metrics.riskLevel)}`}>
                    {goal.metrics.riskLevel}
                  </span>
                </div>
                <div className="text-sm">
                  <strong>Est. Completion:</strong> {goal.metrics.estimatedCompletion}
                </div>
              </div>

              {/* Assigned Agents */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Assigned to:</span>
                {goal.assignedAgents.map((agent, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {agent}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}