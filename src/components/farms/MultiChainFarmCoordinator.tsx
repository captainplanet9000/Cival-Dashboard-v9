'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Network, Users, Settings, Play, Pause, Trash2, Plus,
  RefreshCw, TrendingUp, DollarSign, Activity, Brain,
  BarChart3, Shield, Zap, Star, Coins, Target,
  ArrowUpDown, GitBranch, Layers, Bot
} from 'lucide-react'
import { alchemyService, type ChainConfig } from '@/lib/blockchain/alchemy-service'
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface FarmAgent {
  id: string
  name: string
  strategy: string
  chainId: number
  chainKey: string
  walletAddress: string
  portfolioValue: number
  pnl: number
  status: 'active' | 'paused' | 'stopped'
  lastActivity: string
}

interface MultichainFarm {
  id: string
  name: string
  description: string
  totalAgents: number
  coordinated: boolean
  chains: string[]
  totalValue: number
  totalPnL: number
  avgPerformance: number
  status: 'active' | 'paused' | 'stopped'
  createdAt: string
}

export function MultiChainFarmCoordinator() {
  const [farms, setFarms] = useState<MultichainFarm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [farmAgents, setFarmAgents] = useState<FarmAgent[]>([])

  // Get agent data from shared data manager
  const { agents } = useSharedRealtimeData()

  const availableChains = alchemyService.availableChains.map(chainKey => ({
    key: chainKey,
    config: alchemyService.getChainConfig(chainKey)
  })).filter(chain => chain.config)

  useEffect(() => {
    loadFarms()
    generateMockFarmAgents()
  }, [agents])

  const loadFarms = () => {
    // Generate mock multi-chain farms based on existing agents
    const mockFarms: MultichainFarm[] = [
      {
        id: 'farm_1',
        name: 'DeFi Arbitrage Farm',
        description: 'Cross-chain arbitrage opportunities across Ethereum and Arbitrum',
        totalAgents: 12,
        coordinated: true,
        chains: ['eth-sepolia', 'arb-sepolia'],
        totalValue: 150000,
        totalPnL: 8500,
        avgPerformance: 12.4,
        status: 'active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'farm_2',
        name: 'High-Frequency Trading Hub',
        description: 'Coordinated high-frequency trading across multiple chains',
        totalAgents: 8,
        coordinated: true,
        chains: ['eth-sepolia'],
        totalValue: 95000,
        totalPnL: 4200,
        avgPerformance: 8.7,
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'farm_3',
        name: 'Multi-Chain Yield Farm',
        description: 'Automated yield farming strategies across testnets',
        totalAgents: 6,
        coordinated: false,
        chains: ['eth-sepolia', 'arb-sepolia'],
        totalValue: 75000,
        totalPnL: -1200,
        avgPerformance: -2.1,
        status: 'paused',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    setFarms(mockFarms)
  }

  const generateMockFarmAgents = () => {
    const mockAgents: FarmAgent[] = []
    
    farms.forEach(farm => {
      for (let i = 0; i < farm.totalAgents; i++) {
        const chainKey = farm.chains[i % farm.chains.length]
        const chainConfig = alchemyService.getChainConfig(chainKey)
        
        mockAgents.push({
          id: `${farm.id}_agent_${i + 1}`,
          name: `Agent ${i + 1}`,
          strategy: ['darvas_box', 'williams_alligator', 'renko_breakout'][i % 3],
          chainId: chainConfig?.chainId || 11155111,
          chainKey,
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          portfolioValue: 5000 + Math.random() * 15000,
          pnl: (Math.random() - 0.3) * 2000,
          status: farm.status as any,
          lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString()
        })
      }
    })
    
    setFarmAgents(mockAgents)
  }

  const getAgentsForFarm = (farmId: string) => {
    return farmAgents.filter(agent => agent.id.startsWith(farmId))
  }

  const getChainDistribution = (farm: MultichainFarm) => {
    const agents = getAgentsForFarm(farm.id)
    const distribution: Record<string, number> = {}
    
    agents.forEach(agent => {
      distribution[agent.chainKey] = (distribution[agent.chainKey] || 0) + 1
    })
    
    return distribution
  }

  const createFarm = () => {
    toast.success('Farm creation wizard would open here')
  }

  const startFarm = (farmId: string) => {
    setFarms(farms.map(farm => 
      farm.id === farmId ? { ...farm, status: 'active' } : farm
    ))
    toast.success('Farm started successfully')
  }

  const pauseFarm = (farmId: string) => {
    setFarms(farms.map(farm => 
      farm.id === farmId ? { ...farm, status: 'paused' } : farm
    ))
    toast.success('Farm paused')
  }

  const deleteFarm = (farmId: string) => {
    setFarms(farms.filter(farm => farm.id !== farmId))
    toast.success('Farm deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Multi-Chain Farm Coordination</h3>
          <p className="text-sm text-muted-foreground">
            Coordinate autonomous agent farms across multiple blockchain testnets
          </p>
        </div>
        <Button onClick={createFarm}>
          <Plus className="h-4 w-4 mr-2" />
          Create Farm
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Active Farms</span>
              </div>
              <div className="text-2xl font-bold">{farms.filter(f => f.status === 'active').length}</div>
              <div className="text-xs text-muted-foreground">
                Total: {farms.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Total Agents</span>
              </div>
              <div className="text-2xl font-bold">{farmAgents.length}</div>
              <div className="text-xs text-muted-foreground">
                Across {availableChains.length} chains
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Value</span>
              </div>
              <div className="text-2xl font-bold">
                ${farms.reduce((sum, farm) => sum + farm.totalValue, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Testnet simulation
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Total P&L</span>
              </div>
              <div className={`text-2xl font-bold ${
                farms.reduce((sum, farm) => sum + farm.totalPnL, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${farms.reduce((sum, farm) => sum + farm.totalPnL, 0).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">
                Combined performance
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chain Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Multi-Chain Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableChains.map(({ key, config }) => {
              const agentCount = farmAgents.filter(agent => agent.chainKey === key).length
              const totalValue = farmAgents
                .filter(agent => agent.chainKey === key)
                .reduce((sum, agent) => sum + agent.portfolioValue, 0)
              
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Network className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">{config!.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agentCount} agents • ${totalValue.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={agentCount > 0 ? 'default' : 'secondary'}>
                    {agentCount > 0 ? 'Active' : 'Idle'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Farms List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {farms.map((farm, index) => {
          const chainDistribution = getChainDistribution(farm)
          
          return (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {farm.description}
                      </p>
                    </div>
                    <Badge variant={
                      farm.status === 'active' ? 'default' :
                      farm.status === 'paused' ? 'secondary' : 'destructive'
                    }>
                      {farm.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Farm Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Agents</div>
                      <div className="font-medium">{farm.totalAgents}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Chains</div>
                      <div className="font-medium">{farm.chains.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Portfolio</div>
                      <div className="font-medium">${farm.totalValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">P&L</div>
                      <div className={`font-medium ${farm.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {farm.totalPnL >= 0 ? '+' : ''}${farm.totalPnL.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* Chain Distribution */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Chain Distribution</div>
                    {Object.entries(chainDistribution).map(([chainKey, count]) => {
                      const chainConfig = alchemyService.getChainConfig(chainKey)
                      const percentage = (count / farm.totalAgents) * 100
                      
                      return (
                        <div key={chainKey} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{chainConfig?.name}</span>
                            <span>{count} agents ({percentage.toFixed(0)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>

                  {/* Coordination Status */}
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">
                      {farm.coordinated ? 'Coordinated Farm' : 'Independent Agents'}
                    </span>
                    {farm.coordinated && (
                      <Badge variant="outline" className="text-xs">
                        Real-time sync
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    {farm.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => pauseFarm(farm.id)}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => startFarm(farm.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600"
                      onClick={() => deleteFarm(farm.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Farm Creation Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Farm Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <ArrowUpDown className="h-6 w-6" />
              <span>Arbitrage Farm</span>
              <span className="text-xs opacity-70">Cross-chain price differences</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <Zap className="h-6 w-6" />
              <span>High-Frequency Farm</span>
              <span className="text-xs opacity-70">Ultra-fast trading coordination</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <Coins className="h-6 w-6" />
              <span>Yield Farming Hub</span>
              <span className="text-xs opacity-70">Multi-protocol yield optimization</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MultiChainFarmCoordinator