'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Shield, 
  Activity, 
  DollarSign, 
  Plus, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Layers,
  BarChart3,
  Lock,
  Unlock,
  Gift,
  Repeat,
  Globe,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DeFiProtocol {
  id: string
  name: string
  category: 'lending' | 'dex' | 'yield' | 'staking' | 'derivative'
  tvl: number
  apy: number
  risk: 'low' | 'medium' | 'high'
  chain: string
  icon: string
  isConnected: boolean
  userPosition?: {
    deposited: number
    earned: number
    rewards: number
  }
}

interface YieldPosition {
  id: string
  protocol: string
  asset: string
  amount: number
  apy: number
  earned: number
  duration: number
  autoCompound: boolean
  status: 'active' | 'pending' | 'withdrawing'
}

interface LendingPosition {
  id: string
  protocol: string
  asset: string
  supplied: number
  borrowed: number
  collateralRatio: number
  liquidationThreshold: number
  netApy: number
  healthFactor: number
}

export function DeFiIntegrationHub() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)

  // Mock DeFi protocols data
  const [protocols] = useState<DeFiProtocol[]>([
    {
      id: 'aave',
      name: 'Aave',
      category: 'lending',
      tvl: 12500000000,
      apy: 8.5,
      risk: 'low',
      chain: 'Ethereum',
      icon: '🌊',
      isConnected: true,
      userPosition: { deposited: 50000, earned: 2150, rewards: 150 }
    },
    {
      id: 'compound',
      name: 'Compound',
      category: 'lending',
      tvl: 8200000000,
      apy: 6.2,
      risk: 'low',
      chain: 'Ethereum',
      icon: '🏛️',
      isConnected: true,
      userPosition: { deposited: 25000, earned: 980, rewards: 75 }
    },
    {
      id: 'uniswap',
      name: 'Uniswap V3',
      category: 'dex',
      tvl: 4500000000,
      apy: 12.8,
      risk: 'medium',
      chain: 'Ethereum',
      icon: '🦄',
      isConnected: false
    },
    {
      id: 'curve',
      name: 'Curve Finance',
      category: 'dex',
      tvl: 3800000000,
      apy: 15.2,
      risk: 'medium',
      chain: 'Ethereum',
      icon: '🌀',
      isConnected: true,
      userPosition: { deposited: 75000, earned: 5670, rewards: 340 }
    },
    {
      id: 'yearn',
      name: 'Yearn Finance',
      category: 'yield',
      tvl: 2100000000,
      apy: 18.9,
      risk: 'high',
      chain: 'Ethereum',
      icon: '🧙‍♂️',
      isConnected: false
    },
    {
      id: 'lido',
      name: 'Lido',
      category: 'staking',
      tvl: 9800000000,
      apy: 5.4,
      risk: 'low',
      chain: 'Ethereum',
      icon: '🔥',
      isConnected: true,
      userPosition: { deposited: 32000, earned: 1280, rewards: 45 }
    }
  ])

  const [yieldPositions] = useState<YieldPosition[]>([
    {
      id: 'pos-1',
      protocol: 'Curve Finance',
      asset: 'USDC-USDT LP',
      amount: 75000,
      apy: 15.2,
      earned: 5670,
      duration: 45,
      autoCompound: true,
      status: 'active'
    },
    {
      id: 'pos-2',
      protocol: 'Aave',
      asset: 'USDC',
      amount: 50000,
      apy: 8.5,
      earned: 2150,
      duration: 32,
      autoCompound: false,
      status: 'active'
    },
    {
      id: 'pos-3',
      protocol: 'Lido',
      asset: 'ETH',
      amount: 32000,
      apy: 5.4,
      earned: 1280,
      duration: 67,
      autoCompound: true,
      status: 'active'
    }
  ])

  const [lendingPositions] = useState<LendingPosition[]>([
    {
      id: 'lend-1',
      protocol: 'Aave',
      asset: 'ETH',
      supplied: 10,
      borrowed: 15000,
      collateralRatio: 65,
      liquidationThreshold: 82.5,
      netApy: 3.2,
      healthFactor: 2.45
    },
    {
      id: 'lend-2',
      protocol: 'Compound',
      asset: 'USDC',
      supplied: 25000,
      borrowed: 0,
      collateralRatio: 0,
      liquidationThreshold: 0,
      netApy: 6.2,
      healthFactor: 0
    }
  ])

  const getTotalDeposited = () => {
    return protocols
      .filter(p => p.isConnected && p.userPosition)
      .reduce((sum, p) => sum + (p.userPosition?.deposited || 0), 0)
  }

  const getTotalEarned = () => {
    return protocols
      .filter(p => p.isConnected && p.userPosition)
      .reduce((sum, p) => sum + (p.userPosition?.earned || 0), 0)
  }

  const getWeightedApy = () => {
    const connectedProtocols = protocols.filter(p => p.isConnected && p.userPosition)
    if (connectedProtocols.length === 0) return 0

    const totalDeposited = getTotalDeposited()
    if (totalDeposited === 0) return 0

    return connectedProtocols.reduce((weightedSum, p) => {
      const weight = (p.userPosition?.deposited || 0) / totalDeposited
      return weightedSum + (p.apy * weight)
    }, 0)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lending': return <DollarSign className="h-4 w-4" />
      case 'dex': return <Repeat className="h-4 w-4" />
      case 'yield': return <TrendingUp className="h-4 w-4" />
      case 'staking': return <Shield className="h-4 w-4" />
      case 'derivative': return <BarChart3 className="h-4 w-4" />
      default: return <Coins className="h-4 w-4" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-emerald-600 bg-emerald-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'withdrawing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
            DeFi Integration Hub
          </h1>
          <p className="text-muted-foreground">Decentralized finance protocols and yield optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Positions
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Connect Protocol
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Deposited</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  ${getTotalDeposited().toLocaleString()}
                </p>
                <p className="text-sm text-purple-600 mt-1">Across {protocols.filter(p => p.isConnected).length} protocols</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Earned</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  ${getTotalEarned().toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-sm text-emerald-600">+12.8% this month</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500 rounded-full">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Weighted APY</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getWeightedApy().toFixed(1)}%
                </p>
                <p className="text-sm text-blue-600 mt-1">Portfolio average</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Active Positions</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {yieldPositions.filter(p => p.status === 'active').length}
                </p>
                <p className="text-sm text-orange-600 mt-1">Yield generating</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="yield">Yield Farming</TabsTrigger>
          <TabsTrigger value="lending">Lending</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">Yield Optimization</h3>
                <p className="text-sm text-muted-foreground">Auto-compound and rebalance</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Liquid Staking</h3>
                <p className="text-sm text-muted-foreground">Stake ETH with Lido</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Repeat className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                <h3 className="font-semibold mb-2">LP Farming</h3>
                <p className="text-sm text-muted-foreground">Provide liquidity for rewards</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-semibold mb-2">Lending</h3>
                <p className="text-sm text-muted-foreground">Supply and borrow assets</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Positions */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Positions</CardTitle>
              <CardDescription>Highest yielding DeFi positions in your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yieldPositions
                  .sort((a, b) => b.apy - a.apy)
                  .slice(0, 3)
                  .map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                          <Coins className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{position.asset}</div>
                          <div className="text-sm text-muted-foreground">{position.protocol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-emerald-600">{position.apy}% APY</div>
                        <div className="text-sm text-muted-foreground">
                          ${position.amount.toLocaleString()} deposited
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <Card key={protocol.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{protocol.icon}</div>
                      <div>
                        <CardTitle className="text-sm">{protocol.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">{protocol.category}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {protocol.isConnected ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">TVL</span>
                        <p className="font-semibold">${(protocol.tvl / 1e9).toFixed(1)}B</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">APY</span>
                        <p className="font-semibold text-emerald-600">{protocol.apy}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getRiskColor(protocol.risk)}>
                        {protocol.risk} risk
                      </Badge>
                      <span className="text-xs text-muted-foreground">{protocol.chain}</span>
                    </div>

                    {protocol.isConnected && protocol.userPosition && (
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Deposited</span>
                            <p className="font-medium">${protocol.userPosition.deposited.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Earned</span>
                            <p className="font-medium text-emerald-600">
                              ${protocol.userPosition.earned.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      {protocol.isConnected ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="w-full">
                          <Plus className="h-3 w-3 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="yield" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Yield Positions</CardTitle>
              <CardDescription>Your current yield farming and staking positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yieldPositions.map((position) => (
                  <div key={position.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                          <Coins className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{position.asset}</div>
                          <div className="text-sm text-muted-foreground">{position.protocol}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-semibold">${position.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Deposited</div>
                      </div>
                      
                      <div>
                        <div className="font-semibold text-emerald-600">{position.apy}%</div>
                        <div className="text-xs text-muted-foreground">APY</div>
                      </div>
                      
                      <div>
                        <div className="font-semibold">${position.earned.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Earned</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(position.status)}>
                          {position.status}
                        </Badge>
                        {position.autoCompound && (
                          <Badge variant="outline" className="text-xs">
                            Auto
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lending Positions</CardTitle>
              <CardDescription>Your lending and borrowing positions across protocols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lendingPositions.map((position) => (
                  <div key={position.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{position.asset}</div>
                          <div className="text-sm text-muted-foreground">{position.protocol}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-semibold">{position.supplied.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Supplied</div>
                      </div>
                      
                      <div>
                        <div className="font-semibold">{position.borrowed.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Borrowed</div>
                      </div>
                      
                      <div>
                        <div className="font-semibold">{position.collateralRatio}%</div>
                        <div className="text-xs text-muted-foreground">Collateral</div>
                      </div>
                      
                      <div>
                        <div className="font-semibold text-emerald-600">{position.netApy}%</div>
                        <div className="text-xs text-muted-foreground">Net APY</div>
                      </div>
                      
                      <div>
                        {position.healthFactor > 0 && (
                          <>
                            <div className={`font-semibold ${
                              position.healthFactor > 2 ? 'text-emerald-600' :
                              position.healthFactor > 1.5 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {position.healthFactor.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Health</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BarChart3 className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">DeFi Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive analytics and performance tracking coming soon
              </p>
              <Button>
                <Activity className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DeFiIntegrationHub