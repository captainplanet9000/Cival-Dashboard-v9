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
  Target, Users, Settings, Play, Pause, Trash2, Plus, 
  RefreshCw, TrendingUp, DollarSign, Activity, Brain
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { EnhancedFarmCreationWizard } from '@/components/farms/EnhancedFarmCreationWizard'

interface Farm {
  id: string
  name: string
  description: string
  strategy: string
  agentCount: number
  totalCapital: number
  coordinationMode: 'independent' | 'coordinated' | 'hierarchical'
  status: 'active' | 'paused' | 'stopped'
  createdAt: string
  agents: string[]
  performance: {
    totalValue: number
    totalPnL: number
    winRate: number
    tradeCount: number
  }
}

interface ConnectedFarmsTabProps {
  className?: string
}

export function ConnectedFarmsTab({ className }: ConnectedFarmsTabProps) {
  const { state, actions } = useDashboardConnection('farms')
  const [farms, setFarms] = useState<Farm[]>([])

  // Load farms data
  useEffect(() => {
    loadFarmsData()
    const interval = setInterval(loadFarmsData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadFarmsData = () => {
    try {
      const storedFarms = localStorage.getItem('trading_farms')
      const farmsData = storedFarms ? JSON.parse(storedFarms) : []
      
      // Update farms with live performance data
      const updatedFarms = farmsData.map((farm: any) => {
        const farmAgents = Array.from(state.agentPerformance.values()).filter(
          agent => farm.agents?.includes(agent.agentId)
        )
        
        const performance = farmAgents.length > 0 ? {
          totalValue: farmAgents.reduce((sum, agent) => sum + agent.portfolioValue, 0),
          totalPnL: farmAgents.reduce((sum, agent) => sum + agent.pnl, 0),
          winRate: farmAgents.reduce((sum, agent) => sum + agent.winRate, 0) / farmAgents.length,
          tradeCount: farmAgents.reduce((sum, agent) => sum + agent.tradeCount, 0)
        } : {
          totalValue: 0,
          totalPnL: 0,
          winRate: 0,
          tradeCount: 0
        }
        
        return {
          ...farm,
          agentCount: farmAgents.length,
          performance
        }
      })
      
      setFarms(updatedFarms)
    } catch (error) {
      console.error('Error loading farms data:', error)
    }
  }


  const toggleFarmStatus = (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return

      const newStatus = farm.status === 'active' ? 'paused' : 'active'
      
      // Update agent status
      farm.agents.forEach(agentId => {
        if (newStatus === 'active') {
          paperTradingEngine.startAgent(agentId)
        } else {
          paperTradingEngine.stopAgent(agentId)
        }
      })

      // Update farm status in storage
      const storedFarms = localStorage.getItem('trading_farms')
      const allFarms = storedFarms ? JSON.parse(storedFarms) : []
      const updatedFarms = allFarms.map((f: any) => 
        f.id === farmId ? { ...f, status: newStatus } : f
      )
      localStorage.setItem('trading_farms', JSON.stringify(updatedFarms))
      
      toast.success(`Farm ${newStatus === 'active' ? 'started' : 'paused'}`)
      loadFarmsData()
    } catch (error) {
      console.error('Error toggling farm status:', error)
      toast.error('Failed to update farm status')
    }
  }

  const deleteFarm = (farmId: string) => {
    try {
      const farm = farms.find(f => f.id === farmId)
      if (!farm) return

      // Stop and remove agents
      farm.agents.forEach(agentId => {
        paperTradingEngine.stopAgent(agentId)
      })

      // Remove farm from storage
      const storedFarms = localStorage.getItem('trading_farms')
      const allFarms = storedFarms ? JSON.parse(storedFarms) : []
      const updatedFarms = allFarms.filter((f: any) => f.id !== farmId)
      localStorage.setItem('trading_farms', JSON.stringify(updatedFarms))
      
      toast.success('Farm deleted successfully')
      loadFarmsData()
    } catch (error) {
      console.error('Error deleting farm:', error)
      toast.error('Failed to delete farm')
    }
  }


  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trading Farms</h2>
          <p className="text-muted-foreground">
            Coordinate multiple agents for enhanced trading strategies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EnhancedFarmCreationWizard
            onFarmCreated={(farm) => {
              // Convert enhanced farm format to legacy format for compatibility
              const legacyFarm: Farm = {
                id: farm.farm_id,
                name: farm.farm_name,
                description: farm.description,
                strategy: farm.strategy_type,
                agentCount: farm.metadata?.agent_count || 0,
                totalCapital: farm.total_allocated_capital,
                coordinationMode: farm.coordination_mode,
                status: farm.status as 'active' | 'paused' | 'stopped',
                createdAt: farm.created_at,
                agents: farm.agents || [],
                performance: {
                  totalValue: farm.total_allocated_capital,
                  totalPnL: 0,
                  winRate: 0,
                  tradeCount: 0
                }
              }

              // Store in localStorage for ConnectedFarmsTab compatibility
              const existingFarms = localStorage.getItem('trading_farms')
              const allFarms = existingFarms ? JSON.parse(existingFarms) : []
              allFarms.push(farm) // Store enhanced format
              localStorage.setItem('trading_farms', JSON.stringify(allFarms))

              toast.success(`Farm "${farm.farm_name}" created with ${farm.metadata?.agent_count} agents`)
              loadFarmsData()
            }}
          />
          
          <Button variant="outline" size="sm" onClick={actions.refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Farm Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farms.filter(f => f.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {farms.length} total farms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farms.reduce((sum, farm) => sum + farm.agentCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all farms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Combined P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              farms.reduce((sum, farm) => sum + farm.performance.totalPnL, 0) >= 0 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              ${farms.reduce((sum, farm) => sum + farm.performance.totalPnL, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From all farms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farms.length > 0 
                ? (farms.reduce((sum, farm) => sum + farm.performance.winRate, 0) / farms.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all farms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {farms.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Farms Created</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first trading farm to coordinate multiple agents
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Farm
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            farms.map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{farm.name}</CardTitle>
                        <CardDescription>{farm.description}</CardDescription>
                      </div>
                      <Badge variant={
                        farm.status === 'active' ? 'default' :
                        farm.status === 'paused' ? 'secondary' : 'outline'
                      }>
                        {farm.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Farm Metrics */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Strategy:</span>
                          <div className="font-medium">
                            {farm.strategy === 'momentum' ? 'Momentum Trading' :
                             farm.strategy === 'mean_reversion' ? 'Mean Reversion' :
                             farm.strategy === 'arbitrage' ? 'Arbitrage' :
                             farm.strategy === 'breakout' ? 'Breakout Trading' :
                             farm.strategy === 'scalping' ? 'Scalping' : 
                             farm.strategy.charAt(0).toUpperCase() + farm.strategy.slice(1)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Agents:</span>
                          <div className="font-medium">{farm.agentCount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coordination:</span>
                          <div className="font-medium">
                            {farm.coordinationMode === 'independent' ? 'Independent' :
                             farm.coordinationMode === 'coordinated' ? 'Coordinated' :
                             farm.coordinationMode === 'hierarchical' ? 'Hierarchical' :
                             farm.coordinationMode.charAt(0).toUpperCase() + farm.coordinationMode.slice(1)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Capital:</span>
                          <div className="font-medium">${farm.totalCapital.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Performance Metrics */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Value:</span>
                          <span className="font-medium">${farm.performance.totalValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">P&L:</span>
                          <span className={`font-medium ${
                            farm.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {farm.performance.totalPnL >= 0 ? '+' : ''}{farm.performance.totalPnL.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className="font-medium">{farm.performance.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Trades:</span>
                          <span className="font-medium">{farm.performance.tradeCount}</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Performance</span>
                          <span>{((farm.performance.totalPnL / farm.totalCapital) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(Math.abs((farm.performance.totalPnL / farm.totalCapital) * 100), 100)} 
                          className="h-2"
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={farm.status === 'active' ? 'secondary' : 'default'}
                          onClick={() => toggleFarmStatus(farm.id)}
                          className="flex-1"
                        >
                          {farm.status === 'active' ? (
                            <>
                              <Pause className="mr-2 h-3 w-3" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-3 w-3" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteFarm(farm.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ConnectedFarmsTab