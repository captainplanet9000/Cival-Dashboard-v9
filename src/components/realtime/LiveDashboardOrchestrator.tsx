'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Bot,
  Target,
  Zap,
  DollarSign,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { 
  paperTradingEngine, 
  TradingAgent, 
  MarketPrice, 
  Order, 
  Position,
  Transaction
} from '@/lib/trading/real-paper-trading-engine'

interface LiveMetrics {
  totalAgents: number
  activeAgents: number
  totalPortfolioValue: number
  totalPnL: number
  totalTrades: number
  totalOpenPositions: number
  avgWinRate: number
  dailyPnL: number
  recentTransactions: Transaction[]
  activeOrders: Order[]
  marketPrices: MarketPrice[]
}

interface FarmMetrics {
  farmId: string
  farmName: string
  agentCount: number
  totalValue: number
  pnl: number
  activePositions: number
  recentTrades: number
  coordination: 'active' | 'idle' | 'coordinating'
  lastActivity: Date
}

interface GoalProgress {
  goalId: string
  goalName: string
  targetValue: number
  currentValue: number
  progress: number
  timeframe: string
  status: 'active' | 'completed' | 'behind' | 'ahead'
  lastUpdate: Date
}

interface LiveDashboardOrchestratorProps {
  className?: string
  onMetricsUpdate?: (metrics: LiveMetrics) => void
}

export function LiveDashboardOrchestrator({ className, onMetricsUpdate }: LiveDashboardOrchestratorProps) {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [farms, setFarms] = useState<FarmMetrics[]>([])
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string
    type: 'trade' | 'order' | 'goal' | 'farm'
    message: string
    timestamp: Date
    status: 'success' | 'warning' | 'error'
  }>>([])

  // Load and update all dashboard data
  const updateDashboardData = useCallback(() => {
    if (!isLive) return

    // Start trading engine if not running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    const allAgents = paperTradingEngine.getAllAgents()
    const marketPrices = paperTradingEngine.getAllMarketPrices()

    if (allAgents.length > 0) {
      // Calculate live metrics
      const totalPortfolioValue = allAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
      const initialValue = allAgents.length * 10000 // Assuming 10k initial per agent
      const totalPnL = totalPortfolioValue - initialValue
      const activeAgents = allAgents.filter(a => a.status === 'active').length
      const totalTrades = allAgents.reduce((sum, agent) => sum + (agent.performance.totalTrades || 0), 0)
      const totalOpenPositions = allAgents.reduce((sum, agent) => sum + agent.portfolio.positions.length, 0)
      const avgWinRate = allAgents.length > 0 
        ? allAgents.reduce((sum, agent) => sum + (agent.performance.winRate || 0), 0) / allAgents.length 
        : 0

      // Get recent transactions
      const recentTransactions = allAgents
        .flatMap(agent => agent.portfolio.transactions)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      // Get active orders
      const activeOrders = allAgents
        .flatMap(agent => agent.portfolio.orders)
        .filter(order => order.status === 'pending')
        .slice(0, 20)

      const liveMetrics: LiveMetrics = {
        totalAgents: allAgents.length,
        activeAgents,
        totalPortfolioValue,
        totalPnL,
        totalTrades,
        totalOpenPositions,
        avgWinRate,
        dailyPnL: totalPnL * 0.1 + (Math.random() - 0.5) * 100, // Mock daily variation
        recentTransactions,
        activeOrders,
        marketPrices
      }

      setMetrics(liveMetrics)
      onMetricsUpdate?.(liveMetrics)

      // Update farm metrics
      updateFarmMetrics(allAgents)

      // Update goal progress
      updateGoalProgress(liveMetrics)

      // Add recent activity
      if (recentTransactions.length > 0) {
        const latestTransaction = recentTransactions[0]
        addActivity({
          id: `trade_${Date.now()}`,
          type: 'trade',
          message: `${latestTransaction.side.toUpperCase()} ${latestTransaction.quantity} ${latestTransaction.symbol} @ $${latestTransaction.price}`,
          timestamp: new Date(latestTransaction.timestamp),
          status: 'success'
        })
      }

      if (activeOrders.length > 0) {
        const pendingOrders = activeOrders.length
        addActivity({
          id: `orders_${Date.now()}`,
          type: 'order',
          message: `${pendingOrders} orders pending execution`,
          timestamp: new Date(),
          status: pendingOrders > 10 ? 'warning' : 'success'
        })
      }
    }

    setLastUpdate(new Date())
  }, [isLive, onMetricsUpdate])

  const updateFarmMetrics = (agents: TradingAgent[]) => {
    // Load farms from localStorage
    const storedFarms = JSON.parse(localStorage.getItem('trading_farms') || '[]')
    
    // Group agents by strategy type to create logical farms
    const strategyGroups: Record<string, TradingAgent[]> = {}
    agents.forEach(agent => {
      const farmKey = agent.strategy.type
      if (!strategyGroups[farmKey]) {
        strategyGroups[farmKey] = []
      }
      strategyGroups[farmKey].push(agent)
    })

    const farmMetrics: FarmMetrics[] = []

    // Add stored farms
    storedFarms.forEach((farm: any) => {
      const farmAgents = agents.filter(agent => farm.agents?.includes(agent.id))
      if (farmAgents.length > 0) {
        const totalValue = farmAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
        const initialValue = farmAgents.length * 10000
        const pnl = totalValue - initialValue
        const activePositions = farmAgents.reduce((sum, agent) => sum + agent.portfolio.positions.length, 0)
        const recentTrades = farmAgents.reduce((sum, agent) => sum + (agent.performance.totalTrades || 0), 0)

        farmMetrics.push({
          farmId: farm.farm_id,
          farmName: farm.farm_name,
          agentCount: farmAgents.length,
          totalValue,
          pnl,
          activePositions,
          recentTrades,
          coordination: activePositions > 0 ? 'active' : 'idle',
          lastActivity: new Date()
        })
      }
    })

    // Add strategy-based farms
    Object.entries(strategyGroups).forEach(([strategyType, farmAgents]) => {
      const farmId = `farm_${strategyType}`
      const existingFarm = farmMetrics.find(f => f.farmId === farmId)
      
      if (!existingFarm && farmAgents.length > 0) {
        const totalValue = farmAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
        const initialValue = farmAgents.length * 10000
        const pnl = totalValue - initialValue
        const activePositions = farmAgents.reduce((sum, agent) => sum + agent.portfolio.positions.length, 0)
        const recentTrades = farmAgents.reduce((sum, agent) => sum + (agent.performance.totalTrades || 0), 0)

        farmMetrics.push({
          farmId,
          farmName: `${strategyType.charAt(0).toUpperCase() + strategyType.slice(1)} Farm`,
          agentCount: farmAgents.length,
          totalValue,
          pnl,
          activePositions,
          recentTrades,
          coordination: activePositions > 0 ? 'coordinating' : 'idle',
          lastActivity: new Date()
        })
      }
    })

    setFarms(farmMetrics)

    // Add farm activity
    if (farmMetrics.length > 0) {
      const activeFarms = farmMetrics.filter(f => f.coordination === 'active' || f.coordination === 'coordinating')
      if (activeFarms.length > 0) {
        addActivity({
          id: `farm_${Date.now()}`,
          type: 'farm',
          message: `${activeFarms.length} farms actively coordinating trades`,
          timestamp: new Date(),
          status: 'success'
        })
      }
    }
  }

  const updateGoalProgress = (metrics: LiveMetrics) => {
    // Load goals from localStorage or mock data
    const storedGoals = JSON.parse(localStorage.getItem('trading_goals') || '[]')
    
    const goalProgress: GoalProgress[] = storedGoals.map((goal: any) => {
      let currentValue = 0
      let progress = 0

      // Calculate progress based on goal type
      switch (goal.goal_type || goal.type) {
        case 'profit':
          currentValue = metrics.dailyPnL
          progress = Math.min((currentValue / goal.target_value) * 100, 100)
          break
        case 'performance':
          currentValue = metrics.avgWinRate
          progress = Math.min((currentValue / goal.target_value) * 100, 100)
          break
        case 'growth':
          currentValue = metrics.totalPnL
          progress = Math.min((currentValue / goal.target_value) * 100, 100)
          break
        default:
          currentValue = goal.current_value || 0
          progress = goal.progress_percentage || 0
      }

      return {
        goalId: goal.goal_id || goal.id,
        goalName: goal.goal_name || goal.name,
        targetValue: goal.target_value,
        currentValue,
        progress,
        timeframe: goal.metadata?.timeframe || goal.timeframe || 'daily',
        status: progress >= 100 ? 'completed' : progress >= 80 ? 'ahead' : progress <= 20 ? 'behind' : 'active',
        lastUpdate: new Date()
      }
    })

    // Add default goals if none exist
    if (goalProgress.length === 0) {
      goalProgress.push({
        goalId: 'default_profit',
        goalName: 'Daily Profit Target',
        targetValue: 1000,
        currentValue: metrics.dailyPnL,
        progress: Math.min((metrics.dailyPnL / 1000) * 100, 100),
        timeframe: 'daily',
        status: metrics.dailyPnL >= 800 ? 'ahead' : metrics.dailyPnL >= 1000 ? 'completed' : 'active',
        lastUpdate: new Date()
      })

      goalProgress.push({
        goalId: 'default_winrate',
        goalName: 'Win Rate Target',
        targetValue: 75,
        currentValue: metrics.avgWinRate,
        progress: Math.min((metrics.avgWinRate / 75) * 100, 100),
        timeframe: 'weekly',
        status: metrics.avgWinRate >= 75 ? 'completed' : metrics.avgWinRate >= 60 ? 'active' : 'behind',
        lastUpdate: new Date()
      })
    }

    setGoals(goalProgress)

    // Add goal activity
    const progressingGoals = goalProgress.filter(g => g.status === 'ahead' || g.status === 'completed')
    if (progressingGoals.length > 0) {
      const goal = progressingGoals[0]
      addActivity({
        id: `goal_${Date.now()}`,
        type: 'goal',
        message: `Goal "${goal.goalName}" is ${goal.status === 'completed' ? 'completed' : 'ahead of schedule'} (${goal.progress.toFixed(1)}%)`,
        timestamp: new Date(),
        status: goal.status === 'completed' ? 'success' : 'warning'
      })
    }
  }

  const addActivity = (activity: any) => {
    setRecentActivity(prev => {
      const newActivity = [activity, ...prev.slice(0, 19)] // Keep latest 20 activities
      return newActivity
    })
  }

  // Set up real-time listeners and intervals
  useEffect(() => {
    if (!isLive) return

    // Initial load
    updateDashboardData()

    // Listen to trading engine events
    const handlePricesUpdated = () => {
      updateDashboardData()
    }

    const handleOrderFilled = (order: Order) => {
      addActivity({
        id: `filled_${Date.now()}`,
        type: 'trade',
        message: `Order filled: ${order.side} ${order.quantity} ${order.symbol}`,
        timestamp: new Date(),
        status: 'success'
      })
      setTimeout(updateDashboardData, 1000) // Update after order processing
    }

    const handleAgentCreated = (agent: TradingAgent) => {
      addActivity({
        id: `agent_${Date.now()}`,
        type: 'farm',
        message: `New agent created: ${agent.name}`,
        timestamp: new Date(),
        status: 'success'
      })
      updateDashboardData()
    }

    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)
    paperTradingEngine.on('orderFilled', handleOrderFilled)
    paperTradingEngine.on('agentCreated', handleAgentCreated)

    // Update every 5 seconds
    const interval = setInterval(updateDashboardData, 5000)

    return () => {
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      paperTradingEngine.off('orderFilled', handleOrderFilled)  
      paperTradingEngine.off('agentCreated', handleAgentCreated)
      clearInterval(interval)
    }
  }, [isLive, updateDashboardData])

  if (!metrics) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Initializing live dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Live Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm font-medium">
                {isLive ? 'Live Trading' : 'Paused'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600">
              {metrics.totalAgents} Agents
            </Badge>
            <Badge variant="outline" className="text-blue-600">
              {farms.length} Farms
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              {goals.length} Goals
            </Badge>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Live Activity Feed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              <AnimatePresence>
                {recentActivity.slice(0, 10).map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      {activity.type === 'trade' && <DollarSign className="h-4 w-4 text-green-600" />}
                      {activity.type === 'order' && <Clock className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'farm' && <Users className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'goal' && <Target className="h-4 w-4 text-orange-600" />}
                      <span>{activity.message}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">${metrics.totalPortfolioValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center">
                {metrics.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                  <p className="text-2xl font-bold">{metrics.activeAgents}/{metrics.totalAgents}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Progress value={(metrics.activeAgents / metrics.totalAgents) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Positions</p>
                  <p className="text-2xl font-bold">{metrics.totalOpenPositions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  {metrics.activeOrders.length} pending orders
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{metrics.avgWinRate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  {metrics.totalTrades} total trades
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Farm Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Farm Coordination Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farms.map((farm) => (
                <motion.div
                  key={farm.farmId}
                  className="p-4 border rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{farm.farmName}</h4>
                    <Badge 
                      variant={farm.coordination === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {farm.coordination}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agents:</span>
                      <span>{farm.agentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Value:</span>
                      <span>${farm.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P&L:</span>
                      <span className={farm.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {farm.pnl >= 0 ? '+' : ''}${farm.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Positions:</span>
                      <span>{farm.activePositions}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span>Goal Progress Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => (
                <motion.div
                  key={goal.goalId}
                  className="p-4 border rounded-lg"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{goal.goalName}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          goal.status === 'completed' ? 'default' : 
                          goal.status === 'ahead' ? 'secondary' :
                          goal.status === 'behind' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {goal.status}
                      </Badge>
                      {goal.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {goal.status === 'behind' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(goal.progress, 100)} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current: {goal.currentValue.toFixed(2)}</span>
                      <span className="text-muted-foreground">Target: {goal.targetValue}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LiveDashboardOrchestrator