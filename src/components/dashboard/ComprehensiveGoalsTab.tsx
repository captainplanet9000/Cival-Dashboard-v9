'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target, Trophy, TrendingUp, DollarSign, Activity, Calendar,
  Plus, RefreshCw, CheckCircle2, Clock, Award, Filter,
  BarChart3, Shield, Star, AlertTriangle, Users, Bot,
  Zap, Brain, Network, Settings, History, Archive
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useDashboardConnection } from './DashboardTabConnector'
import { useGoalUpdates } from '@/lib/realtime/websocket'
import { useGoals, Goal, GoalCreateConfig } from '@/lib/goals/goals-service'
import { useFarms } from '@/lib/farms/farms-service'
import { useAgentData } from '@/hooks/useAgentData'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns'

interface ComprehensiveGoalsTabProps {
  className?: string
}

export function ComprehensiveGoalsTab({ className }: ComprehensiveGoalsTabProps) {
  const { state, actions } = useDashboardConnection('goals')
  const [activeSection, setActiveSection] = useState('overview')
  
  // Real goals data integration
  const {
    goals = [],
    activeGoals = [],
    completedGoals = [],
    loading: goalsLoading,
    stats = { active: 0, completed: 0, total: 0, completionRate: 0, averageProgress: 0 },
    createGoal,
    updateGoalProgress,
    updateGoalStatus,
    deleteGoal,
    getGoalsByCategory,
    getGoalsByFarmId
  } = useGoals()
  
  // Integration data
  const { farms = [] } = useFarms()
  const { agents = [] } = useAgentData()
  
  // Real-time updates
  const goalUpdates = useGoalUpdates()
  
  const sections = [
    { id: 'overview', label: 'Goals Overview', icon: Target },
    { id: 'create', label: 'Create Goal', icon: Plus },
    { id: 'tracking', label: 'Progress Tracking', icon: BarChart3 },
    { id: 'milestones', label: 'Milestones', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  // Calculate goal categories
  const goalsByCategory = {
    trading: goals.filter(g => g.category === 'trading'),
    portfolio: goals.filter(g => g.category === 'portfolio'), 
    farm: goals.filter(g => g.category === 'farm'),
    risk: goals.filter(g => g.category === 'risk')
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Strategic Goals Management
              <Badge variant="secondary" className="text-xs">AI-Driven Targets</Badge>
            </CardTitle>
            <CardDescription>
              {stats.active} active goals • {stats.completed} completed • 
              {stats.completionRate.toFixed(1)}% completion rate • 
              {stats.averageProgress.toFixed(1)}% avg progress
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={stats.active > 0 ? "default" : "secondary"}>
              {stats.active > 0 ? '🎯 Goals Active' : '📝 No Active Goals'}
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid grid-cols-5 w-full">
            {sections.map(section => (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Goals Overview */}
          <TabsContent value="overview" className="mt-6">
            <GoalsOverview 
              goals={goals}
              stats={stats}
              goalsByCategory={goalsByCategory}
              onNavigateToCreate={() => setActiveSection('create')}
              onNavigateToTracking={() => setActiveSection('tracking')}
            />
          </TabsContent>

          {/* Create Goal */}
          <TabsContent value="create" className="mt-6">
            <GoalCreationWizard 
              farms={farms}
              agents={agents}
              onGoalCreated={(goal) => {
                toast.success(`Goal "${goal.name}" created successfully!`)
                setActiveSection('overview')
              }}
            />
          </TabsContent>

          {/* Progress Tracking */}
          <TabsContent value="tracking" className="mt-6">
            <GoalProgressTracking 
              goals={goals}
              farms={farms}
              agents={agents}
              onGoalUpdated={() => toast.success('Goal updated successfully')}
            />
          </TabsContent>

          {/* Milestones */}
          <TabsContent value="milestones" className="mt-6">
            <GoalMilestones 
              goals={goals}
            />
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <GoalAnalytics 
              goals={goals}
              stats={stats}
              goalsByCategory={goalsByCategory}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Goals Overview Component
function GoalsOverview({ 
  goals, 
  stats, 
  goalsByCategory,
  onNavigateToCreate, 
  onNavigateToTracking 
}: {
  goals: Goal[]
  stats: any
  goalsByCategory: any
  onNavigateToCreate: () => void
  onNavigateToTracking: () => void
}) {
  const urgentGoals = goals.filter(g => {
    if (!g.deadline) return false
    const deadline = new Date(g.deadline)
    const daysUntilDeadline = differenceInDays(deadline, new Date())
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && g.status === 'active'
  })

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <AnimatedCounter value={stats.active} className="text-2xl font-bold" />
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <AnimatedCounter value={stats.completed} className="text-2xl font-bold" />
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <AnimatedCounter 
                  value={stats.completionRate} 
                  suffix="%" 
                  className="text-2xl font-bold" 
                />
              </div>
              <Trophy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <AnimatedCounter 
                  value={stats.averageProgress} 
                  suffix="%" 
                  className="text-2xl font-bold text-green-600" 
                />
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Goals by Category</CardTitle>
          <CardDescription>Distribution of goals across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Bot className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="font-semibold">{goalsByCategory.trading.length}</p>
              <p className="text-sm text-muted-foreground">Trading Goals</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="font-semibold">{goalsByCategory.portfolio.length}</p>
              <p className="text-sm text-muted-foreground">Portfolio Goals</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="font-semibold">{goalsByCategory.farm.length}</p>
              <p className="text-sm text-muted-foreground">Farm Goals</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Shield className="h-8 w-8 mx-auto text-red-600 mb-2" />
              <p className="font-semibold">{goalsByCategory.risk.length}</p>
              <p className="text-sm text-muted-foreground">Risk Goals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Goals Alert */}
      {urgentGoals.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Urgent Goals - Deadline Approaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentGoals.map((goal) => {
                const daysLeft = differenceInDays(new Date(goal.deadline!), new Date())
                return (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={goal.progress} className="w-20" />
                      <span className="text-sm font-medium">{goal.progress.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with goal management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={onNavigateToCreate} className="h-20 flex-col gap-2">
              <Plus className="h-6 w-6" />
              Create New Goal
            </Button>
            <Button variant="outline" onClick={onNavigateToTracking} className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              Track Progress
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Trophy className="h-6 w-6" />
              View Milestones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Goals */}
      {goals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Goals</CardTitle>
            <CardDescription>Latest goal activity and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{goal.name}</h3>
                      <Badge variant={
                        goal.status === 'active' ? 'default' :
                        goal.status === 'completed' ? 'default' : 'secondary'
                      }>
                        {goal.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {goal.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Progress value={goal.progress} className="w-24" />
                        <span className="text-sm font-medium">{goal.progress.toFixed(0)}%</span>
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{goal.current.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">of {goal.target.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Goals Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first goal to track trading performance and objectives
              </p>
              <Button onClick={onNavigateToCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Goal Creation Wizard Component
function GoalCreationWizard({ 
  farms, 
  agents, 
  onGoalCreated 
}: {
  farms: any[]
  agents: any[]
  onGoalCreated: (goal: any) => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [goalConfig, setGoalConfig] = useState({
    name: '',
    description: '',
    type: 'profit' as const,
    category: 'trading' as const,
    target: 0,
    deadline: '',
    priority: 'medium' as const,
    farmId: '',
    agentId: '',
    tags: [] as string[],
    autoUpdate: true,
    notifications: true
  })

  const goalTypes = [
    { id: 'profit', name: 'Profit Target', description: 'Achieve specific profit amount' },
    { id: 'winRate', name: 'Win Rate', description: 'Maintain minimum win percentage' },
    { id: 'trades', name: 'Trade Count', description: 'Execute number of trades' },
    { id: 'drawdown', name: 'Max Drawdown', description: 'Stay within risk limits' },
    { id: 'portfolio', name: 'Portfolio Value', description: 'Reach portfolio milestone' },
    { id: 'sharpe', name: 'Sharpe Ratio', description: 'Achieve risk-adjusted returns' }
  ]

  const categories = [
    { id: 'trading', name: 'Trading', icon: Bot },
    { id: 'portfolio', name: 'Portfolio', icon: DollarSign },
    { id: 'farm', name: 'Farm', icon: Users },
    { id: 'risk', name: 'Risk Management', icon: Shield }
  ]

  const handleCreateGoal = async () => {
    try {
      const goalData = {
        ...goalConfig,
        id: `goal_${Date.now()}`,
        current: 0,
        progress: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        milestones: generateMilestones(goalConfig.target),
        metrics: {
          startValue: 0,
          targetValue: goalConfig.target,
          currentValue: 0,
          lastUpdated: new Date().toISOString()
        }
      }

      onGoalCreated(goalData)
      
      // Reset form
      setGoalConfig({
        name: '',
        description: '',
        type: 'profit',
        category: 'trading',
        target: 0,
        deadline: '',
        priority: 'medium',
        farmId: '',
        agentId: '',
        tags: [],
        autoUpdate: true,
        notifications: true
      })
      setCurrentStep(1)
      
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal')
    }
  }

  const generateMilestones = (target: number) => {
    const milestones = []
    for (let i = 25; i <= 100; i += 25) {
      milestones.push({
        percentage: i,
        description: `${i}% of target (${(target * i / 100).toFixed(2)})`,
        completedAt: undefined
      })
    }
    return milestones
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && <div className="w-16 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Goal Information</CardTitle>
            <CardDescription>Define your goal's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={goalConfig.name}
                onChange={(e) => setGoalConfig({...goalConfig, name: e.target.value})}
                placeholder="Achieve $10,000 profit"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={goalConfig.description}
                onChange={(e) => setGoalConfig({...goalConfig, description: e.target.value})}
                placeholder="Generate $10,000 in trading profits within Q1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Goal Type</Label>
                <Select value={goalConfig.type} onValueChange={(value: any) => setGoalConfig({...goalConfig, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={goalConfig.category} onValueChange={(value: any) => setGoalConfig({...goalConfig, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Target & Timeline</CardTitle>
            <CardDescription>Set your target value and deadline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="target">Target Value</Label>
              <Input
                id="target"
                type="number"
                value={goalConfig.target}
                onChange={(e) => setGoalConfig({...goalConfig, target: Number(e.target.value)})}
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={goalConfig.deadline}
                onChange={(e) => setGoalConfig({...goalConfig, deadline: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={goalConfig.priority} onValueChange={(value: any) => setGoalConfig({...goalConfig, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Scope & Assignment</CardTitle>
            <CardDescription>Link goal to specific farms or agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="farm">Associated Farm (Optional)</Label>
              <Select value={goalConfig.farmId} onValueChange={(value) => setGoalConfig({...goalConfig, farmId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific farm</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agent">Associated Agent (Optional)</Label>
              <Select value={goalConfig.agentId} onValueChange={(value) => setGoalConfig({...goalConfig, agentId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific agent</SelectItem>
                  {agents.slice(0, 10).map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Settings & Review</CardTitle>
            <CardDescription>Configure automation and review your goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Goal Name</Label>
                <p className="font-medium">{goalConfig.name}</p>
              </div>
              <div>
                <Label>Type</Label>
                <p className="font-medium">{goalTypes.find(t => t.id === goalConfig.type)?.name}</p>
              </div>
              <div>
                <Label>Target</Label>
                <p className="font-medium">{goalConfig.target.toLocaleString()}</p>
              </div>
              <div>
                <Label>Priority</Label>
                <p className="font-medium capitalize">{goalConfig.priority}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={goalConfig.autoUpdate}
                  onCheckedChange={(checked) => setGoalConfig({...goalConfig, autoUpdate: checked})}
                />
                <Label>Auto-update progress from trading data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={goalConfig.notifications}
                  onCheckedChange={(checked) => setGoalConfig({...goalConfig, notifications: checked})}
                />
                <Label>Send notifications on milestone completion</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 1 && !goalConfig.name}
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleCreateGoal}>
            Create Goal
          </Button>
        )}
      </div>
    </div>
  )
}

// Goal Progress Tracking Component
function GoalProgressTracking({ 
  goals, 
  farms, 
  agents, 
  onGoalUpdated 
}: {
  goals: Goal[]
  farms: any[]
  agents: any[]
  onGoalUpdated: () => void
}) {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredGoals = goals.filter(goal => {
    const statusMatch = filterStatus === 'all' || goal.status === filterStatus
    const categoryMatch = filterCategory === 'all' || goal.category === filterCategory
    return statusMatch && categoryMatch
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="trading">Trading</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="farm">Farm</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List with Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => (
          <Card key={goal.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedGoal(goal)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      goal.status === 'active' ? 'default' :
                      goal.status === 'completed' ? 'default' : 'secondary'
                    }>
                      {goal.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {goal.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {goal.priority}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{goal.progress.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{goal.current.toFixed(2)} / {goal.target.toFixed(2)}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
                
                {goal.deadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
                    {(() => {
                      const daysLeft = differenceInDays(new Date(goal.deadline), new Date())
                      return daysLeft <= 7 && daysLeft >= 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                        </Badge>
                      ) : null
                    })()}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(goal.metrics.lastUpdated), 'MMM dd, HH:mm')}
                  </div>
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation()
                    onGoalUpdated()
                  }}>
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Goals Match Filter</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or create a new goal
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Goal Milestones Component
function GoalMilestones({ goals }: { goals: Goal[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal Milestones</CardTitle>
          <CardDescription>Track milestone achievements across all goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Milestone Tracking</h3>
            <p className="text-muted-foreground mb-4">
              Advanced milestone management and achievement tracking
            </p>
            <Button variant="outline">
              <Award className="h-4 w-4 mr-2" />
              View Achievements
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Goal Analytics Component
function GoalAnalytics({ 
  goals, 
  stats, 
  goalsByCategory 
}: {
  goals: Goal[]
  stats: any
  goalsByCategory: any
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal Performance Analytics</CardTitle>
          <CardDescription>Detailed insights and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              Comprehensive goal analytics and reporting tools
            </p>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ComprehensiveGoalsTab