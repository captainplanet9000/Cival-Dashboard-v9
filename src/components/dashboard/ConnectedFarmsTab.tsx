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
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // Farm creation form state
  const [newFarm, setNewFarm] = useState({
    name: '',
    description: '',
    strategy: 'momentum',
    agentCount: 3,
    totalCapital: 30000,
    coordinationMode: 'coordinated' as 'independent' | 'coordinated' | 'hierarchical'
  })

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

  const createFarm = async () => {
    if (!newFarm.name.trim()) {
      toast.error('Please enter a farm name')
      return
    }

    const farmId = `farm_${Date.now()}`
    const createdAgents: string[] = []

    // Create agents for the farm
    for (let i = 0; i < newFarm.agentCount; i++) {
      const agentConfig = {
        name: `${newFarm.name} Agent ${i + 1}`,
        strategy: newFarm.strategy,
        capital: newFarm.totalCapital / newFarm.agentCount,
        config: {
          riskPerTrade: 0.02,
          maxPositions: 3,
          stopLoss: 0.05,
          takeProfit: 0.1,
          coordinationMode: newFarm.coordinationMode
        }
      }
      
      const agent = paperTradingEngine.createAgent(agentConfig)
      paperTradingEngine.startAgent(agent.id)
      createdAgents.push(agent.id)
    }

    const farm: Farm = {
      id: farmId,
      name: newFarm.name,
      description: newFarm.description,
      strategy: newFarm.strategy,
      agentCount: newFarm.agentCount,
      totalCapital: newFarm.totalCapital,
      coordinationMode: newFarm.coordinationMode,
      status: 'active',
      createdAt: new Date().toISOString(),
      agents: createdAgents,
      performance: {
        totalValue: newFarm.totalCapital,
        totalPnL: 0,
        winRate: 0,
        tradeCount: 0
      }
    }

    // Store farm
    const existingFarms = localStorage.getItem('trading_farms')
    const allFarms = existingFarms ? JSON.parse(existingFarms) : []
    allFarms.push(farm)
    localStorage.setItem('trading_farms', JSON.stringify(allFarms))

    // Reset form and close dialog
    setNewFarm({
      name: '',
      description: '',
      strategy: 'momentum',
      agentCount: 3,
      totalCapital: 30000,
      coordinationMode: 'coordinated'
    })
    setShowCreateDialog(false)
    
    toast.success(`Farm "${farm.name}" created with ${farm.agentCount} agents`)
    loadFarmsData()
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

  const coordinationModes = [
    { value: 'independent', label: 'Independent', description: 'Agents trade independently' },
    { value: 'coordinated', label: 'Coordinated', description: 'Agents share signals and coordinate' },
    { value: 'hierarchical', label: 'Hierarchical', description: 'Lead agent coordinates others' }
  ]

  const strategies = [
    { value: 'momentum', label: 'Momentum Trading' },
    { value: 'mean_reversion', label: 'Mean Reversion' },
    { value: 'arbitrage', label: 'Arbitrage' },
    { value: 'breakout', label: 'Breakout Trading' },
    { value: 'scalping', label: 'Scalping' }
  ]

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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Farm
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Trading Farm</DialogTitle>
                <DialogDescription>
                  Deploy multiple coordinated agents with a unified strategy
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Farm Name</Label>
                  <Input
                    value={newFarm.name}
                    onChange={(e) => setNewFarm({...newFarm, name: e.target.value})}
                    placeholder="e.g., Momentum Farm Alpha"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newFarm.description}
                    onChange={(e) => setNewFarm({...newFarm, description: e.target.value})}
                    placeholder="Brief description of the farm's purpose"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Strategy</Label>
                    <Select value={newFarm.strategy} onValueChange={(v) => setNewFarm({...newFarm, strategy: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies.map(strategy => (
                          <SelectItem key={strategy.value} value={strategy.value}>
                            {strategy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Agent Count</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newFarm.agentCount}
                      onChange={(e) => setNewFarm({...newFarm, agentCount: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Total Capital ($)</Label>
                  <Input
                    type="number"
                    min="1000"
                    value={newFarm.totalCapital}
                    onChange={(e) => setNewFarm({...newFarm, totalCapital: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(newFarm.totalCapital / newFarm.agentCount).toFixed(0)} per agent
                  </p>
                </div>
                
                <div>
                  <Label>Coordination Mode</Label>
                  <Select 
                    value={newFarm.coordinationMode} 
                    onValueChange={(v: any) => setNewFarm({...newFarm, coordinationMode: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinationModes.map(mode => (
                        <SelectItem key={mode.value} value={mode.value}>
                          <div>
                            <div className="font-medium">{mode.label}</div>
                            <div className="text-xs text-muted-foreground">{mode.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={createFarm} className="w-full">
                  Create Farm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
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
                          <div className="font-medium">{strategies.find(s => s.value === farm.strategy)?.label}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Agents:</span>
                          <div className="font-medium">{farm.agentCount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coordination:</span>
                          <div className="font-medium">{coordinationModes.find(m => m.value === farm.coordinationMode)?.label}</div>
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