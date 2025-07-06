'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target, TrendingUp, DollarSign, Activity, Trophy, 
  Calendar, Shield, BarChart3, Award, ArrowRight, ArrowLeft,
  CheckCircle2, Info, Clock, Users, Network
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, addDays } from 'date-fns'

// Import goals service
import { useGoals, GoalCreateConfig } from '@/lib/goals/goals-service'
import { useFarms } from '@/lib/farms/farms-service'

interface GoalCreationWizardProps {
  onGoalCreated?: (goal: any) => void
  onCancel?: () => void
  className?: string
}

const GOAL_TYPES = {
  profit: {
    name: 'Profit Target',
    description: 'Achieve a specific profit amount',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-green-600',
    defaultTarget: 1000,
    unit: '$'
  },
  winrate: {
    name: 'Win Rate',
    description: 'Maintain a target win rate percentage',
    icon: <Trophy className="h-4 w-4" />,
    color: 'text-yellow-600',
    defaultTarget: 75,
    unit: '%'
  },
  portfolio: {
    name: 'Portfolio Growth',
    description: 'Grow portfolio value by percentage',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-blue-600',
    defaultTarget: 20,
    unit: '%'
  },
  trades: {
    name: 'Trade Volume',
    description: 'Execute a number of successful trades',
    icon: <Activity className="h-4 w-4" />,
    color: 'text-purple-600',
    defaultTarget: 100,
    unit: 'trades'
  },
  sharpe: {
    name: 'Sharpe Ratio',
    description: 'Achieve target risk-adjusted returns',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'text-indigo-600',
    defaultTarget: 2.0,
    unit: 'ratio'
  },
  drawdown: {
    name: 'Max Drawdown',
    description: 'Limit maximum portfolio drawdown',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-red-600',
    defaultTarget: 10,
    unit: '%'
  }
}

const CATEGORIES = [
  { value: 'trading', label: 'Trading', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'risk', label: 'Risk Management', icon: <Shield className="h-4 w-4" /> },
  { value: 'performance', label: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'growth', label: 'Growth', icon: <Trophy className="h-4 w-4" /> },
  { value: 'milestone', label: 'Milestone', icon: <Target className="h-4 w-4" /> }
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

export function GoalCreationWizard({ onGoalCreated, onCancel, className }: GoalCreationWizardProps) {
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { createGoal } = useGoals()
  const { farms = [] } = useFarms()
  
  const [config, setConfig] = useState<GoalCreateConfig>({
    name: '',
    description: '',
    type: 'profit',
    target: 1000,
    priority: 'medium',
    deadline: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    reward: '',
    category: 'trading',
    farmId: '',
    tags: [],
    metrics: {
      trackingFrequency: 'daily',
      measurementMethod: 'absolute',
      compoundingEnabled: false,
      partialCreditEnabled: true
    },
    notifications: {
      milestoneAlerts: true,
      deadlineReminders: true,
      achievementCelebration: true,
      progressReports: 'weekly'
    }
  })

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepNumber) {
      case 1:
        if (!config.name.trim()) {
          newErrors.name = 'Goal name is required'
        } else if (config.name.length < 3) {
          newErrors.name = 'Goal name must be at least 3 characters'
        }
        if (!config.type) {
          newErrors.type = 'Goal type is required'
        }
        if (!config.target || config.target <= 0) {
          newErrors.target = 'Target value must be greater than 0'
        }
        break

      case 2:
        if (!config.deadline) {
          newErrors.deadline = 'Deadline is required'
        } else if (new Date(config.deadline) <= new Date()) {
          newErrors.deadline = 'Deadline must be in the future'
        }
        if (!config.category) {
          newErrors.category = 'Category is required'
        }
        if (!config.priority) {
          newErrors.priority = 'Priority is required'
        }
        break

      case 3:
        if (!config.metrics?.trackingFrequency) {
          newErrors.trackingFrequency = 'Tracking frequency is required'
        }
        if (!config.metrics?.measurementMethod) {
          newErrors.measurementMethod = 'Measurement method is required'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1)
      } else {
        handleCreateGoal()
      }
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCreateGoal = async () => {
    setIsCreating(true)
    try {
      const goalData = {
        ...config,
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        progress: 0,
        achievements: [],
        milestones: generateMilestones(config.target, config.type)
      }

      await createGoal(goalData)
      
      toast.success(`Goal "${config.name}" created successfully!`)
      
      if (onGoalCreated) {
        onGoalCreated(goalData)
      }
      
      // Reset form
      setConfig({
        name: '',
        description: '',
        type: 'profit',
        target: 1000,
        priority: 'medium',
        deadline: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        reward: '',
        category: 'trading',
        farmId: '',
        tags: [],
        metrics: {
          trackingFrequency: 'daily',
          measurementMethod: 'absolute',
          compoundingEnabled: false,
          partialCreditEnabled: true
        },
        notifications: {
          milestoneAlerts: true,
          deadlineReminders: true,
          achievementCelebration: true,
          progressReports: 'weekly'
        }
      })
      setStep(1)
      
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal')
    } finally {
      setIsCreating(false)
    }
  }

  const generateMilestones = (target: number, type: string) => {
    const milestones = []
    const percentages = [25, 50, 75, 90, 100]
    
    for (const percentage of percentages) {
      milestones.push({
        id: `milestone_${percentage}`,
        name: `${percentage}% Complete`,
        target: (target * percentage) / 100,
        achieved: false,
        achievedAt: null
      })
    }
    
    return milestones
  }

  const getStepProgress = () => {
    return (step / 4) * 100
  }

  const selectedGoalType = GOAL_TYPES[config.type as keyof typeof GOAL_TYPES]

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className || ''}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Goal</h1>
            <p className="text-gray-600">Set up a strategic objective for your trading success</p>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > stepNum ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Target & Timeline'}
            {step === 3 && 'Metrics & Tracking'}
            {step === 4 && 'Review & Create'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="goal-name">Goal Name *</Label>
                <Input
                  id="goal-name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter goal name..."
                  className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="goal-description">Description</Label>
                <Textarea
                  id="goal-description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Goal Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {Object.entries(GOAL_TYPES).map(([key, type]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        config.type === key
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        type: key as any,
                        target: type.defaultTarget 
                      }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-full bg-gray-100 ${type.color}`}>
                            {type.icon}
                          </div>
                          {config.type === key && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{type.name}</h4>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
              </div>

              <div>
                <Label htmlFor="goal-target">Target Value *</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="goal-target"
                    type="number"
                    value={config.target}
                    onChange={(e) => setConfig(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                    className={errors.target ? 'border-red-500' : ''}
                  />
                  <span className="text-sm text-gray-600 min-w-[40px]">
                    {selectedGoalType?.unit}
                  </span>
                </div>
                {errors.target && <p className="text-sm text-red-600 mt-1">{errors.target}</p>}
              </div>
            </motion.div>
          )}

          {/* Step 2: Target & Timeline */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="goal-deadline">Deadline *</Label>
                  <Input
                    id="goal-deadline"
                    type="date"
                    value={config.deadline}
                    onChange={(e) => setConfig(prev => ({ ...prev, deadline: e.target.value }))}
                    className={`mt-1 ${errors.deadline ? 'border-red-500' : ''}`}
                  />
                  {errors.deadline && <p className="text-sm text-red-600 mt-1">{errors.deadline}</p>}
                </div>

                <div>
                  <Label htmlFor="goal-priority">Priority *</Label>
                  <Select 
                    value={config.priority} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger className={`mt-1 ${errors.priority ? 'border-red-500' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={priority.color}>{priority.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-sm text-red-600 mt-1">{errors.priority}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="goal-category">Category *</Label>
                <Select 
                  value={config.category} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger className={`mt-1 ${errors.category ? 'border-red-500' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
              </div>

              <div>
                <Label htmlFor="goal-farm">Associated Farm (Optional)</Label>
                <Select 
                  value={config.farmId || ''} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, farmId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a farm..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No farm association</SelectItem>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        <div className="flex items-center space-x-2">
                          <Network className="h-4 w-4" />
                          <span>{farm.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goal-reward">Reward (Optional)</Label>
                <Input
                  id="goal-reward"
                  value={config.reward}
                  onChange={(e) => setConfig(prev => ({ ...prev, reward: e.target.value }))}
                  placeholder="Celebrate your achievement..."
                  className="mt-1"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Metrics & Tracking */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tracking-frequency">Tracking Frequency *</Label>
                  <Select 
                    value={config.metrics?.trackingFrequency} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      metrics: { ...prev.metrics, trackingFrequency: value as any }
                    }))}
                  >
                    <SelectTrigger className={`mt-1 ${errors.trackingFrequency ? 'border-red-500' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.trackingFrequency && <p className="text-sm text-red-600 mt-1">{errors.trackingFrequency}</p>}
                </div>

                <div>
                  <Label htmlFor="measurement-method">Measurement Method *</Label>
                  <Select 
                    value={config.metrics?.measurementMethod} 
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      metrics: { ...prev.metrics, measurementMethod: value as any }
                    }))}
                  >
                    <SelectTrigger className={`mt-1 ${errors.measurementMethod ? 'border-red-500' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absolute">Absolute Value</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="cumulative">Cumulative</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.measurementMethod && <p className="text-sm text-red-600 mt-1">{errors.measurementMethod}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Compounding Enabled</div>
                    <div className="text-sm text-gray-600">Allow progress to compound over time</div>
                  </div>
                  <Switch
                    checked={config.metrics?.compoundingEnabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ 
                      ...prev, 
                      metrics: { ...prev.metrics, compoundingEnabled: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Partial Credit</div>
                    <div className="text-sm text-gray-600">Award partial progress towards goal</div>
                  </div>
                  <Switch
                    checked={config.metrics?.partialCreditEnabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ 
                      ...prev, 
                      metrics: { ...prev.metrics, partialCreditEnabled: checked }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Notification Preferences</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Milestone Alerts</div>
                      <div className="text-sm text-gray-600">Get notified when reaching milestones</div>
                    </div>
                    <Switch
                      checked={config.notifications?.milestoneAlerts}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, milestoneAlerts: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Deadline Reminders</div>
                      <div className="text-sm text-gray-600">Remind me as deadlines approach</div>
                    </div>
                    <Switch
                      checked={config.notifications?.deadlineReminders}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, deadlineReminders: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Achievement Celebration</div>
                      <div className="text-sm text-gray-600">Celebrate when goals are achieved</div>
                    </div>
                    <Switch
                      checked={config.notifications?.achievementCelebration}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, achievementCelebration: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Create */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Goal Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedGoalType?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium">{config.target} {selectedGoalType?.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium capitalize">{config.category}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Timeline & Priority</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deadline:</span>
                        <span className="font-medium">{format(new Date(config.deadline), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <Badge className={PRIORITIES.find(p => p.value === config.priority)?.color}>
                          {PRIORITIES.find(p => p.value === config.priority)?.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking:</span>
                        <span className="font-medium capitalize">{config.metrics?.trackingFrequency}</span>
                      </div>
                      {config.farmId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Farm:</span>
                          <span className="font-medium">{farms.find(f => f.id === config.farmId)?.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {config.description && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded">{config.description}</p>
                  </div>
                )}

                {config.reward && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Reward</h4>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded">{config.reward}</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Ready to Create</div>
                  <div className="text-sm text-blue-800 mt-1">
                    Your goal will be created and begin tracking progress immediately. 
                    {config.notifications?.milestoneAlerts && ' You will receive milestone notifications as configured.'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={isCreating}
              className="min-w-[120px]"
            >
              {isCreating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : step === 4 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create Goal
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GoalCreationWizard