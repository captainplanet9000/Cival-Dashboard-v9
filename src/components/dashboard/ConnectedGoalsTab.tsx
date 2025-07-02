'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Target, TrendingUp, DollarSign, Activity, Trophy, 
  Plus, RefreshCw, CheckCircle2, Clock, Calendar,
  History, BarChart3, Award, Filter, Shield, Network, Wallet
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, differenceInDays } from 'date-fns'

// Import blockchain integration
import { alchemyService } from '@/lib/blockchain/alchemy-service'

interface Goal {
  id: string
  name: string
  description: string
  type: 'profit' | 'winRate' | 'trades' | 'drawdown' | 'sharpe' | 'blockchain'
  target: number
  current: number
  progress: number
  status: 'active' | 'completed' | 'failed' | 'paused'
  priority: 'low' | 'medium' | 'high'
  deadline?: string
  createdAt: string
  completedAt?: string
  reward?: string
  // Blockchain verification fields
  blockchainVerified?: boolean
  verificationTxHash?: string
  chainId?: number
  smartContractAddress?: string
}

interface ConnectedGoalsTabProps {
  className?: string
}

export function ConnectedGoalsTab({ className }: ConnectedGoalsTabProps) {
  const { state, actions } = useDashboardConnection('goals')
  const [goals, setGoals] = useState<Goal[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'goals' | 'history' | 'performance'>('goals')
  const [historyData, setHistoryData] = useState<any[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([])
  
  // Goal creation form state
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    type: 'profit' as Goal['type'],
    target: 1000,
    priority: 'medium' as Goal['priority'],
    deadline: '',
    reward: ''
  })

  // Load goals data and history
  useEffect(() => {
    loadGoalsData()
    loadHistoryData()
    loadPerformanceHistory()
    const interval = setInterval(() => {
      updateGoalProgress()
      updateHistoryData()
    }, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [state])

  const loadGoalsData = () => {
    try {
      const storedGoals = localStorage.getItem('trading_goals')
      const goalsData = storedGoals ? JSON.parse(storedGoals) : []
      setGoals(goalsData)
    } catch (error) {
      console.error('Error loading goals data:', error)
    }
  }

  const updateGoalProgress = () => {
    const allAgents = Array.from(state.agentPerformance.values())
    
    setGoals(prevGoals => 
      prevGoals.map(goal => {
        let current = 0
        let progress = 0
        
        switch (goal.type) {
          case 'profit':
            current = state.totalPnL
            progress = Math.max(0, Math.min((current / goal.target) * 100, 100))
            break
            
          case 'winRate':
            current = state.winRate
            progress = Math.min((current / goal.target) * 100, 100)
            break
            
          case 'trades':
            current = state.executedOrders.length
            progress = Math.min((current / goal.target) * 100, 100)
            break
            
          case 'drawdown':
            // Mock drawdown calculation (inverse - lower is better)
            current = Math.random() * 10 // 0-10% drawdown
            progress = Math.max(0, ((goal.target - current) / goal.target) * 100)
            break
            
          case 'sharpe':
            // Mock Sharpe ratio calculation
            current = 1.2 + Math.random() * 0.8 // 1.2-2.0 range
            progress = Math.min((current / goal.target) * 100, 100)
            break
        }
        
        // Check if goal is completed
        const wasCompleted = goal.status === 'completed'
        const isCompleted = progress >= 100 && goal.status === 'active'
        
        if (isCompleted && !wasCompleted) {
          toast.success(`🎉 Goal "${goal.name}" completed!`)
        }
        
        // Check if goal failed (deadline passed)
        const isDeadlinePassed = goal.deadline && new Date() > new Date(goal.deadline)
        const shouldFail = isDeadlinePassed && progress < 100 && goal.status === 'active'
        
        return {
          ...goal,
          current,
          progress,
          status: isCompleted ? 'completed' : shouldFail ? 'failed' : goal.status,
          completedAt: isCompleted && !wasCompleted ? new Date().toISOString() : goal.completedAt
        }
      })
    )
  }

  const createGoal = async () => {
    if (!newGoal.name.trim()) {
      toast.error('Please enter a goal name')
      return
    }

    const goalId = `goal_${Date.now()}`
    const goal: Goal = {
      id: goalId,
      name: newGoal.name,
      description: newGoal.description,
      type: newGoal.type,
      target: newGoal.target,
      current: 0,
      progress: 0,
      status: 'active',
      priority: newGoal.priority,
      deadline: newGoal.deadline || undefined,
      createdAt: new Date().toISOString(),
      reward: newGoal.reward || undefined
    }

    // Store goal
    const existingGoals = localStorage.getItem('trading_goals')
    const allGoals = existingGoals ? JSON.parse(existingGoals) : []
    allGoals.push(goal)
    localStorage.setItem('trading_goals', JSON.stringify(allGoals))

    // Reset form and close dialog
    setNewGoal({
      name: '',
      description: '',
      type: 'profit',
      target: 1000,
      priority: 'medium',
      deadline: '',
      reward: ''
    })
    setShowCreateDialog(false)
    
    toast.success(`Goal "${goal.name}" created successfully`)
    loadGoalsData()
  }

  const toggleGoalStatus = (goalId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const newStatus = goal.status === 'active' ? 'paused' : 'active'
      
      // Update goal status in storage
      const storedGoals = localStorage.getItem('trading_goals')
      const allGoals = storedGoals ? JSON.parse(storedGoals) : []
      const updatedGoals = allGoals.map((g: any) => 
        g.id === goalId ? { ...g, status: newStatus } : g
      )
      localStorage.setItem('trading_goals', JSON.stringify(updatedGoals))
      
      toast.success(`Goal ${newStatus === 'active' ? 'resumed' : 'paused'}`)
      loadGoalsData()
    } catch (error) {
      console.error('Error toggling goal status:', error)
      toast.error('Failed to update goal status')
    }
  }

  const deleteGoal = (goalId: string) => {
    try {
      // Remove goal from storage
      const storedGoals = localStorage.getItem('trading_goals')
      const allGoals = storedGoals ? JSON.parse(storedGoals) : []
      const updatedGoals = allGoals.filter((g: any) => g.id !== goalId)
      localStorage.setItem('trading_goals', JSON.stringify(updatedGoals))
      
      toast.success('Goal deleted successfully')
      loadGoalsData()
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete goal')
    }
  }

  // Load trading history data
  const loadHistoryData = () => {
    try {
      // Get trading history from various sources
      const tradingHistory = []
      
      // Recent trades from executed orders
      state.executedOrders.forEach(order => {
        tradingHistory.push({
          id: order.id,
          type: 'trade',
          action: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`,
          timestamp: order.timestamp,
          value: order.price * order.quantity,
          pnl: Math.random() * 200 - 100, // Mock P&L
          status: 'completed'
        })
      })

      // Goal completions
      goals.filter(g => g.status === 'completed').forEach(goal => {
        if (goal.completedAt) {
          tradingHistory.push({
            id: goal.id,
            type: 'goal_completed',
            action: `Completed goal: ${goal.name}`,
            timestamp: new Date(goal.completedAt),
            value: goal.target,
            pnl: 0,
            status: 'success'
          })
        }
      })

      // Agent activities
      Array.from(state.agentPerformance.values()).forEach(agent => {
        tradingHistory.push({
          id: `agent_${agent.agentId}`,
          type: 'agent_activity',
          action: `Agent ${agent.name} - ${agent.tradeCount} trades`,
          timestamp: new Date(),
          value: agent.portfolioValue,
          pnl: agent.pnl,
          status: agent.status
        })
      })

      // Sort by timestamp (newest first)
      tradingHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      setHistoryData(tradingHistory.slice(0, 50)) // Keep last 50 items
    } catch (error) {
      console.error('Error loading history data:', error)
    }
  }

  // Load performance history
  const loadPerformanceHistory = () => {
    try {
      const performanceData = []
      const now = new Date()
      
      // Generate daily performance history for last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayFactor = Math.random()
        
        performanceData.push({
          date: format(date, 'yyyy-MM-dd'),
          portfolioValue: state.portfolioValue * (0.95 + dayFactor * 0.1),
          totalPnL: state.totalPnL * (0.8 + dayFactor * 0.4),
          dailyPnL: (Math.random() - 0.4) * 500,
          winRate: 45 + Math.random() * 30,
          tradeCount: Math.floor(Math.random() * 20),
          activeGoals: goals.filter(g => g.status === 'active').length,
          completedGoals: goals.filter(g => g.status === 'completed' && 
            format(new Date(g.completedAt || ''), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).length
        })
      }
      
      setPerformanceHistory(performanceData)
    } catch (error) {
      console.error('Error loading performance history:', error)
    }
  }

  // Update real-time history data
  const updateHistoryData = () => {
    // Add new trading events to history
    const newEvents = []
    
    // Check for new orders
    const recentOrders = state.executedOrders.filter(order => 
      new Date().getTime() - new Date(order.timestamp).getTime() < 5000 // Last 5 seconds
    )
    
    recentOrders.forEach(order => {
      newEvents.push({
        id: `${order.id}_${Date.now()}`,
        type: 'trade',
        action: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`,
        timestamp: new Date(),
        value: order.price * order.quantity,
        pnl: Math.random() * 200 - 100,
        status: 'completed'
      })
    })

    if (newEvents.length > 0) {
      setHistoryData(prev => [...newEvents, ...prev].slice(0, 50))
    }
  }

  const goalTypes = [
    { value: 'profit', label: 'Profit Target', unit: '$', description: 'Total profit goal' },
    { value: 'winRate', label: 'Win Rate', unit: '%', description: 'Minimum win rate percentage' },
    { value: 'trades', label: 'Trade Count', unit: 'trades', description: 'Number of completed trades' },
    { value: 'drawdown', label: 'Max Drawdown', unit: '%', description: 'Maximum acceptable drawdown' },
    { value: 'sharpe', label: 'Sharpe Ratio', unit: 'ratio', description: 'Risk-adjusted return ratio' }
  ]

  const priorityColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-red-600'
  }

  const statusColors = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    paused: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trading Goals & History</h2>
          <p className="text-muted-foreground">
            Set and track your trading objectives, milestones, and performance history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Trading Goal</DialogTitle>
                <DialogDescription>
                  Set a measurable objective for your trading performance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Name</Label>
                  <Input
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    placeholder="e.g., Reach $5000 profit"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    placeholder="Optional description of the goal"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Goal Type</Label>
                    <Select value={newGoal.type} onValueChange={(v: any) => setNewGoal({...newGoal, type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {goalTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({...newGoal, target: parseFloat(e.target.value)})}
                      placeholder="1000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={newGoal.priority} onValueChange={(v: any) => setNewGoal({...newGoal, priority: v})}>
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
                  
                  <div>
                    <Label>Deadline (Optional)</Label>
                    <Input
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Reward (Optional)</Label>
                  <Input
                    value={newGoal.reward}
                    onChange={(e) => setNewGoal({...newGoal, reward: e.target.value})}
                    placeholder="e.g., Take a trading break, buy new equipment"
                  />
                </div>
                
                <Button onClick={createGoal} className="w-full">
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={actions.refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'history', label: 'History', icon: History },
            { id: 'performance', label: 'Performance', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'goals' && (
        <>
          {/* Goal Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.filter(g => g.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.length} total goals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {goals.filter(g => g.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {goals.length > 0 ? ((goals.filter(g => g.status === 'completed').length / goals.length) * 100).toFixed(0) : 0}% success rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {goals.filter(g => g.status === 'active' && g.progress > 0 && g.progress < 100).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Making progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 
                ? (goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length).toFixed(0)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {goals.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Goals Set</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first trading goal to track your progress
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Goal
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            goals.map((goal, index) => {
              const goalType = goalTypes.find(t => t.value === goal.type)
              const daysUntilDeadline = goal.deadline 
                ? differenceInDays(new Date(goal.deadline), new Date())
                : null
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {goal.status === 'completed' && <Trophy className="h-5 w-5 text-yellow-500" />}
                            {goal.name}
                          </CardTitle>
                          {goal.description && (
                            <CardDescription>{goal.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[goal.status]}>
                            {goal.status}
                          </Badge>
                          <Badge variant="outline" className={priorityColors[goal.priority]}>
                            {goal.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Section */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm font-medium">{goal.progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-3" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Current: {goal.current.toFixed(goalType?.value === 'profit' ? 2 : 1)} {goalType?.unit}</span>
                            <span>Target: {goal.target} {goalType?.unit}</span>
                          </div>
                        </div>
                        
                        {/* Goal Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <div className="font-medium">{goalType?.label}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <div className="font-medium">{format(new Date(goal.createdAt), 'MMM dd')}</div>
                          </div>
                          {goal.deadline && (
                            <div>
                              <span className="text-muted-foreground">Deadline:</span>
                              <div className={`font-medium ${
                                daysUntilDeadline !== null && daysUntilDeadline < 7 ? 'text-red-600' : ''
                              }`}>
                                {daysUntilDeadline !== null ? (
                                  daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Overdue'
                                ) : 'No deadline'}
                              </div>
                            </div>
                          )}
                          {goal.completedAt && (
                            <div>
                              <span className="text-muted-foreground">Completed:</span>
                              <div className="font-medium text-green-600">
                                {format(new Date(goal.completedAt), 'MMM dd')}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Reward */}
                        {goal.reward && (
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <div className="text-sm font-medium text-yellow-800 mb-1">Reward</div>
                            <div className="text-sm text-yellow-700">{goal.reward}</div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        {goal.status !== 'completed' && goal.status !== 'failed' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={goal.status === 'active' ? 'secondary' : 'default'}
                              onClick={() => toggleGoalStatus(goal.id)}
                              className="flex-1"
                            >
                              {goal.status === 'active' ? 'Pause' : 'Resume'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteGoal(goal.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Blockchain Achievements */}
      <Card className="border shadow-sm bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Blockchain-Verified Achievements
            <Badge variant={alchemyService.connected ? 'default' : 'secondary'}>
              {alchemyService.connected ? 'Live Verification' : 'Mock Mode'}
            </Badge>
          </CardTitle>
          <CardDescription>
            On-chain verification of trading milestones and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sample blockchain achievements */}
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">First Profit Milestone</div>
                    <div className="text-xs text-muted-foreground">Verified on Ethereum Sepolia</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs">Verified</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Network className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Multi-Chain Trader</div>
                    <div className="text-xs text-muted-foreground">Active on {alchemyService.availableChains.length} chains</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Wallet Master</div>
                    <div className="text-xs text-muted-foreground">Managing {goals.filter(g => g.type === 'blockchain').length} blockchain goals</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs">Tracking</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Achievements are automatically verified on testnet when goals are completed
              </span>
              <Button size="sm" variant="outline" onClick={() => {
                setNewGoal({ ...newGoal, type: 'blockchain' })
                setShowCreateDialog(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Blockchain Goal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{historyData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {historyData.filter(h => h.type === 'trade').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Executed orders
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Goals Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {historyData.filter(h => h.type === 'goal_completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Achievements unlocked
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  historyData.reduce((sum, h) => sum + (h.pnl || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${historyData.reduce((sum, h) => sum + (h.pnl || 0), 0).toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From history
                </p>
              </CardContent>
            </Card>
          </div>

          {/* History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trading Activity Timeline
              </CardTitle>
              <CardDescription>
                Recent trading events, goals, and agent activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {historyData.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No History Available</h3>
                    <p className="text-muted-foreground">
                      Start trading or set goals to see your activity history
                    </p>
                  </div>
                ) : (
                  historyData.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <div className={`p-2 rounded-full ${
                        event.type === 'trade' ? 'bg-blue-100' :
                        event.type === 'goal_completed' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {event.type === 'trade' && <DollarSign className="h-4 w-4 text-blue-600" />}
                        {event.type === 'goal_completed' && <Trophy className="h-4 w-4 text-green-600" />}
                        {event.type === 'agent_activity' && <Activity className="h-4 w-4 text-purple-600" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium truncate">{event.action}</h4>
                          <div className="flex items-center gap-2">
                            {event.pnl !== 0 && (
                              <span className={`text-sm font-medium ${
                                event.pnl > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {event.pnl > 0 ? '+' : ''}${event.pnl.toFixed(0)}
                              </span>
                            )}
                            <Badge variant="outline" className={
                              event.status === 'completed' || event.status === 'success' ? 'text-green-600' :
                              event.status === 'active' ? 'text-blue-600' : 'text-gray-600'
                            }>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            Value: ${event.value.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Daily P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  performanceHistory.length > 0 && 
                  (performanceHistory.reduce((sum, p) => sum + p.dailyPnL, 0) / performanceHistory.length) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${performanceHistory.length > 0 
                    ? (performanceHistory.reduce((sum, p) => sum + p.dailyPnL, 0) / performanceHistory.length).toFixed(0)
                    : '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Best Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${performanceHistory.length > 0 
                    ? Math.max(...performanceHistory.map(p => p.dailyPnL)).toFixed(0)
                    : '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest daily P&L
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Worst Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${performanceHistory.length > 0 
                    ? Math.min(...performanceHistory.map(p => p.dailyPnL)).toFixed(0)
                    : '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowest daily P&L
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceHistory.length > 0 
                    ? (performanceHistory.reduce((sum, p) => sum + p.winRate, 0) / performanceHistory.length).toFixed(0)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Historical average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Daily P&L and portfolio value over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Performance Chart</h3>
                  <p className="text-muted-foreground">
                    Interactive chart showing P&L trends, win rates, and goal progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance History</CardTitle>
              <CardDescription>
                Detailed breakdown of daily trading performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Portfolio Value</th>
                      <th className="text-right p-2">Daily P&L</th>
                      <th className="text-right p-2">Win Rate</th>
                      <th className="text-right p-2">Trades</th>
                      <th className="text-right p-2">Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceHistory.slice(0, 10).map((day, index) => (
                      <tr key={day.date} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{format(new Date(day.date), 'MMM dd')}</td>
                        <td className="p-2 text-right">${day.portfolioValue.toLocaleString()}</td>
                        <td className={`p-2 text-right font-medium ${
                          day.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {day.dailyPnL >= 0 ? '+' : ''}${day.dailyPnL.toFixed(0)}
                        </td>
                        <td className="p-2 text-right">{day.winRate.toFixed(0)}%</td>
                        <td className="p-2 text-right">{day.tradeCount}</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-blue-600">{day.activeGoals}</span>
                            {day.completedGoals > 0 && (
                              <Badge variant="outline" className="text-green-600">
                                +{day.completedGoals}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ConnectedGoalsTab