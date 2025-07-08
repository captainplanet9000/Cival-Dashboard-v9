'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Coins, Layers, TrendingUp, Zap, Activity, Shield, Lock,
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  DollarSign, Percent, ArrowUp, ArrowDown, BarChart3,
  Link, Unlink, Play, Pause, StopCircle, Eye, Target,
  Bitcoin, Wallet, CreditCard, PieChart, LineChart,
  Sparkles, Award, Users, Database, Server, Globe
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, ComposedChart, Radar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * DeFi Protocol Integration Hub Component
 * Comprehensive DeFi protocol management and integration system
 * Features protocol discovery, yield optimization, and risk management
 */

interface DeFiProtocol {
  id: string
  name: string
  category: 'dex' | 'lending' | 'farming' | 'staking' | 'bridge' | 'derivatives' | 'insurance'
  network: string
  tvl: number
  apy: number
  volume24h: number
  fees24h: number
  users24h: number
  riskScore: number
  auditStatus: 'audited' | 'unaudited' | 'pending'
  integrationStatus: 'connected' | 'available' | 'unavailable'
  autoCompounding: boolean
  minimumDeposit: number
  lockupPeriod: number
  yieldType: 'stable' | 'variable' | 'leveraged'
  tokens: string[]
  features: string[]
  strategies: ProtocolStrategy[]
  performance: ProtocolPerformance
  lastUpdate: Date
}

interface ProtocolStrategy {
  id: string
  name: string
  description: string
  apy: number
  risk: 'low' | 'medium' | 'high'
  tvl: number
  minimumAmount: number
  lockupDays: number
  autoCompound: boolean
  rewards: string[]
}

interface ProtocolPerformance {
  daily: number
  weekly: number
  monthly: number
  quarterly: number
  yearly: number
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
  consistency: number
}

interface YieldOpportunity {
  id: string
  protocolId: string
  protocolName: string
  strategy: string
  apy: number
  tvl: number
  risk: 'low' | 'medium' | 'high'
  lockupDays: number
  minimumAmount: number
  rewards: string[]
  allocation: number
  projectedReturn: number
  isActive: boolean
}

interface PortfolioAllocation {
  protocolId: string
  protocolName: string
  amount: number
  percentage: number
  apy: number
  dailyRewards: number
  totalRewards: number
  entryDate: Date
  lockupEnd?: Date
  status: 'active' | 'pending' | 'unstaking'
}

const MOCK_PROTOCOLS: DeFiProtocol[] = [
  {
    id: 'aave-v3',
    name: 'Aave V3',
    category: 'lending',
    network: 'ethereum',
    tvl: 6200000000,
    apy: 8.2,
    volume24h: 450000000,
    fees24h: 850000,
    users24h: 15000,
    riskScore: 2,
    auditStatus: 'audited',
    integrationStatus: 'connected',
    autoCompounding: true,
    minimumDeposit: 100,
    lockupPeriod: 0,
    yieldType: 'variable',
    tokens: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'],
    features: ['Flash Loans', 'Isolation Mode', 'E-Mode', 'Credit Delegation'],
    strategies: [
      {
        id: 'aave-eth-supply',
        name: 'ETH Supply',
        description: 'Supply ETH to earn yield and use as collateral',
        apy: 3.2,
        risk: 'low',
        tvl: 2800000000,
        minimumAmount: 0.1,
        lockupDays: 0,
        autoCompound: true,
        rewards: ['aETH', 'stkAAVE']
      },
      {
        id: 'aave-usdc-supply',
        name: 'USDC Supply',
        description: 'Supply USDC for stable yield generation',
        apy: 4.8,
        risk: 'low',
        tvl: 1900000000,
        minimumAmount: 1000,
        lockupDays: 0,
        autoCompound: true,
        rewards: ['aUSDC', 'stkAAVE']
      }
    ],
    performance: {
      daily: 0.025,
      weekly: 0.18,
      monthly: 0.68,
      quarterly: 2.1,
      yearly: 8.2,
      maxDrawdown: -3.2,
      sharpeRatio: 2.4,
      volatility: 12.5,
      consistency: 92
    },
    lastUpdate: new Date()
  },
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    category: 'dex',
    network: 'ethereum',
    tvl: 8500000000,
    apy: 15.6,
    volume24h: 980000000,
    fees24h: 2800000,
    users24h: 25000,
    riskScore: 4,
    auditStatus: 'audited',
    integrationStatus: 'connected',
    autoCompounding: false,
    minimumDeposit: 500,
    lockupPeriod: 0,
    yieldType: 'variable',
    tokens: ['ETH', 'USDC', 'USDT', 'WBTC', 'UNI'],
    features: ['Concentrated Liquidity', 'Multiple Fee Tiers', 'Range Orders'],
    strategies: [
      {
        id: 'uni-eth-usdc',
        name: 'ETH/USDC LP',
        description: 'Provide liquidity to ETH/USDC pair with concentrated liquidity',
        apy: 18.5,
        risk: 'medium',
        tvl: 1200000000,
        minimumAmount: 2000,
        lockupDays: 0,
        autoCompound: false,
        rewards: ['Trading Fees', 'UNI']
      },
      {
        id: 'uni-wbtc-eth',
        name: 'WBTC/ETH LP',
        description: 'Provide liquidity to WBTC/ETH pair for high yield',
        apy: 22.3,
        risk: 'high',
        tvl: 850000000,
        minimumAmount: 5000,
        lockupDays: 0,
        autoCompound: false,
        rewards: ['Trading Fees', 'UNI']
      }
    ],
    performance: {
      daily: 0.042,
      weekly: 0.31,
      monthly: 1.25,
      quarterly: 3.8,
      yearly: 15.6,
      maxDrawdown: -18.5,
      sharpeRatio: 1.8,
      volatility: 28.2,
      consistency: 76
    },
    lastUpdate: new Date()
  },
  {
    id: 'curve-finance',
    name: 'Curve Finance',
    category: 'dex',
    network: 'ethereum',
    tvl: 4800000000,
    apy: 12.8,
    volume24h: 320000000,
    fees24h: 650000,
    users24h: 12000,
    riskScore: 3,
    auditStatus: 'audited',
    integrationStatus: 'connected',
    autoCompounding: true,
    minimumDeposit: 1000,
    lockupPeriod: 0,
    yieldType: 'stable',
    tokens: ['USDC', 'USDT', 'DAI', 'FRAX', '3CRV'],
    features: ['Stable Swaps', 'Gauge Voting', 'veCRV Boosting'],
    strategies: [
      {
        id: 'curve-3pool',
        name: '3Pool LP',
        description: 'Provide liquidity to stable coin pool (USDC/USDT/DAI)',
        apy: 8.5,
        risk: 'low',
        tvl: 1800000000,
        minimumAmount: 1000,
        lockupDays: 0,
        autoCompound: true,
        rewards: ['CRV', 'Trading Fees']
      },
      {
        id: 'curve-frax-usdc',
        name: 'FRAX/USDC LP',
        description: 'Concentrated stable pool with FRAX rewards',
        apy: 16.2,
        risk: 'medium',
        tvl: 650000000,
        minimumAmount: 2000,
        lockupDays: 0,
        autoCompound: true,
        rewards: ['CRV', 'FXS', 'Trading Fees']
      }
    ],
    performance: {
      daily: 0.035,
      weekly: 0.24,
      monthly: 1.05,
      quarterly: 3.2,
      yearly: 12.8,
      maxDrawdown: -8.5,
      sharpeRatio: 2.1,
      volatility: 15.8,
      consistency: 88
    },
    lastUpdate: new Date()
  },
  {
    id: 'compound-v3',
    name: 'Compound V3',
    category: 'lending',
    network: 'ethereum',
    tvl: 3400000000,
    apy: 6.8,
    volume24h: 180000000,
    fees24h: 420000,
    users24h: 8500,
    riskScore: 2,
    auditStatus: 'audited',
    integrationStatus: 'available',
    autoCompounding: true,
    minimumDeposit: 50,
    lockupPeriod: 0,
    yieldType: 'variable',
    tokens: ['ETH', 'USDC', 'WBTC'],
    features: ['Algorithmic Interest', 'Liquidation Protection', 'COMP Rewards'],
    strategies: [
      {
        id: 'comp-usdc-supply',
        name: 'USDC Supply',
        description: 'Supply USDC to earn algorithmic interest',
        apy: 5.2,
        risk: 'low',
        tvl: 1500000000,
        minimumAmount: 100,
        lockupDays: 0,
        autoCompound: true,
        rewards: ['cUSDC', 'COMP']
      }
    ],
    performance: {
      daily: 0.018,
      weekly: 0.13,
      monthly: 0.56,
      quarterly: 1.7,
      yearly: 6.8,
      maxDrawdown: -2.1,
      sharpeRatio: 2.8,
      volatility: 8.5,
      consistency: 95
    },
    lastUpdate: new Date()
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

interface DeFiProtocolIntegrationHubProps {
  onProtocolConnect?: (protocolId: string) => void
  onStrategyAllocate?: (strategyId: string, amount: number) => void
  className?: string
}

export function DeFiProtocolIntegrationHub({
  onProtocolConnect,
  onStrategyAllocate,
  className = ''
}: DeFiProtocolIntegrationHubProps) {
  const [protocols, setProtocols] = useState<DeFiProtocol[]>(MOCK_PROTOCOLS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'risk' | 'volume'>('apy')
  const [portfolioAllocations, setPortfolioAllocations] = useState<PortfolioAllocation[]>([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(250000)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Filter and sort protocols
  const filteredProtocols = useMemo(() => {
    let filtered = protocols

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (selectedNetwork !== 'all') {
      filtered = filtered.filter(p => p.network === selectedNetwork)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'apy': return b.apy - a.apy
        case 'tvl': return b.tvl - a.tvl
        case 'risk': return a.riskScore - b.riskScore
        case 'volume': return b.volume24h - a.volume24h
        default: return 0
      }
    })
  }, [protocols, selectedCategory, selectedNetwork, sortBy])

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (portfolioAllocations.length === 0) {
      return {
        totalValue: 0,
        totalAPY: 0,
        dailyRewards: 0,
        totalRewards: 0,
        riskScore: 0,
        diversification: 0
      }
    }

    const totalValue = portfolioAllocations.reduce((sum, allocation) => sum + allocation.amount, 0)
    const weightedAPY = portfolioAllocations.reduce((sum, allocation) => {
      return sum + (allocation.apy * allocation.amount / totalValue)
    }, 0)
    const dailyRewards = portfolioAllocations.reduce((sum, allocation) => sum + allocation.dailyRewards, 0)
    const totalRewards = portfolioAllocations.reduce((sum, allocation) => sum + allocation.totalRewards, 0)
    const diversification = Math.min(100, (portfolioAllocations.length / 10) * 100)

    // Calculate weighted risk score
    const riskScore = portfolioAllocations.reduce((sum, allocation) => {
      const protocol = protocols.find(p => p.id === allocation.protocolId)
      return sum + ((protocol?.riskScore || 5) * allocation.amount / totalValue)
    }, 0)

    return {
      totalValue,
      totalAPY: weightedAPY,
      dailyRewards,
      totalRewards,
      riskScore,
      diversification
    }
  }, [portfolioAllocations, protocols])

  // Yield opportunities ranking
  const yieldOpportunities = useMemo(() => {
    const opportunities: YieldOpportunity[] = []

    protocols.forEach(protocol => {
      protocol.strategies.forEach(strategy => {
        opportunities.push({
          id: `${protocol.id}-${strategy.id}`,
          protocolId: protocol.id,
          protocolName: protocol.name,
          strategy: strategy.name,
          apy: strategy.apy,
          tvl: strategy.tvl,
          risk: strategy.risk,
          lockupDays: strategy.lockupDays,
          minimumAmount: strategy.minimumAmount,
          rewards: strategy.rewards,
          allocation: 0,
          projectedReturn: 0,
          isActive: false
        })
      })
    })

    return opportunities.sort((a, b) => b.apy - a.apy)
  }, [protocols])

  // Protocol category distribution
  const categoryDistribution = useMemo(() => {
    const distribution = protocols.reduce((acc, protocol) => {
      acc[protocol.category] = (acc[protocol.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
      color: COLORS[Object.keys(distribution).indexOf(category) % COLORS.length]
    }))
  }, [protocols])

  // TVL distribution chart data
  const tvlDistributionData = useMemo(() => {
    return protocols.map(protocol => ({
      name: protocol.name,
      tvl: protocol.tvl / 1000000000, // Convert to billions
      apy: protocol.apy,
      risk: protocol.riskScore,
      volume: protocol.volume24h / 1000000 // Convert to millions
    }))
  }, [protocols])

  // Performance comparison data
  const performanceData = useMemo(() => {
    return protocols.map(protocol => ({
      name: protocol.name,
      monthly: protocol.performance.monthly,
      quarterly: protocol.performance.quarterly,
      yearly: protocol.performance.yearly,
      sharpe: protocol.performance.sharpeRatio,
      volatility: protocol.performance.volatility
    }))
  }, [protocols])

  // Optimize portfolio allocation
  const optimizePortfolio = useCallback(async () => {
    setIsOptimizing(true)
    
    try {
      // Simulate portfolio optimization
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate optimized allocations
      const totalAmount = totalPortfolioValue
      const optimizedAllocations: PortfolioAllocation[] = []
      
      // Allocate based on risk-adjusted returns
      const topOpportunities = yieldOpportunities
        .filter(opp => opp.risk !== 'high')
        .slice(0, 5)
      
      const totalWeight = topOpportunities.reduce((sum, opp) => sum + (opp.apy / opp.risk === 'low' ? 1 : 2), 0)
      
      topOpportunities.forEach((opp, index) => {
        const weight = (opp.apy / (opp.risk === 'low' ? 1 : 2)) / totalWeight
        const amount = totalAmount * weight
        const dailyReward = amount * (opp.apy / 100) / 365
        
        optimizedAllocations.push({
          protocolId: opp.protocolId,
          protocolName: opp.protocolName,
          amount,
          percentage: weight * 100,
          apy: opp.apy,
          dailyRewards: dailyReward,
          totalRewards: dailyReward * 30, // 30 days
          entryDate: new Date(),
          status: 'active'
        })
      })
      
      setPortfolioAllocations(optimizedAllocations)
    } catch (error) {
      console.error('Portfolio optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }, [totalPortfolioValue, yieldOpportunities])

  // Connect to protocol
  const connectProtocol = useCallback((protocolId: string) => {
    setProtocols(prev => prev.map(protocol => 
      protocol.id === protocolId 
        ? { ...protocol, integrationStatus: 'connected' as const }
        : protocol
    ))
    
    if (onProtocolConnect) {
      onProtocolConnect(protocolId)
    }
  }, [onProtocolConnect])

  // Get risk color
  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 2) return 'text-green-600 bg-green-100'
    if (riskScore <= 4) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dex': return BarChart3
      case 'lending': return CreditCard
      case 'farming': return Sparkles
      case 'staking': return Lock
      case 'bridge': return Link
      case 'derivatives': return TrendingUp
      case 'insurance': return Shield
      default: return Coins
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-green-600" />
                DeFi Protocol Integration Hub
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {protocols.filter(p => p.integrationStatus === 'connected').length} Connected
                </Badge>
              </CardTitle>
              <CardDescription>
                Unified access to {protocols.length} DeFi protocols across multiple networks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={optimizePortfolio}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Optimize Portfolio
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Portfolio Overview */}
      {portfolioAllocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedPrice value={portfolioMetrics.totalValue} currency="$" precision={0} />
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  <AnimatedCounter value={portfolioMetrics.totalAPY} precision={1} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">Weighted APY</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  <AnimatedPrice value={portfolioMetrics.dailyRewards} currency="$" precision={2} />
                </div>
                <div className="text-sm text-muted-foreground">Daily Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedPrice value={portfolioMetrics.totalRewards} currency="$" precision={0} />
                </div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  <AnimatedCounter value={portfolioMetrics.riskScore} precision={1} />
                </div>
                <div className="text-sm text-muted-foreground">Risk Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">
                  <AnimatedCounter value={portfolioMetrics.diversification} precision={0} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">Diversification</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="protocols" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Protocols Tab */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="dex">DEX</SelectItem>
                  <SelectItem value="lending">Lending</SelectItem>
                  <SelectItem value="farming">Farming</SelectItem>
                  <SelectItem value="staking">Staking</SelectItem>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="derivatives">Derivatives</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apy">APY</SelectItem>
                  <SelectItem value="tvl">TVL</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProtocols.map(protocol => {
              const CategoryIcon = getCategoryIcon(protocol.category)
              return (
                <Card key={protocol.id} className={`${
                  protocol.integrationStatus === 'connected' ? 'border-green-200 bg-green-50' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base">{protocol.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {protocol.category}
                        </Badge>
                        {protocol.auditStatus === 'audited' && (
                          <Shield className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>TVL:</span>
                        <span className="font-medium">
                          ${(protocol.tvl / 1000000000).toFixed(1)}B
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>APY:</span>
                        <span className="font-medium text-green-600">
                          {protocol.apy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>24h Volume:</span>
                        <span className="font-medium">
                          ${(protocol.volume24h / 1000000).toFixed(0)}M
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Risk Score:</span>
                        <Badge className={`text-xs ${getRiskColor(protocol.riskScore)}`}>
                          {protocol.riskScore}/10
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Network:</span>
                        <span className="font-medium capitalize">{protocol.network}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Strategies: {protocol.strategies.length}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Tokens: {protocol.tokens.slice(0, 3).join(', ')}
                        {protocol.tokens.length > 3 && ` +${protocol.tokens.length - 3}`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      variant={protocol.integrationStatus === 'connected' ? 'default' : 'outline'}
                      onClick={() => connectProtocol(protocol.id)}
                      disabled={protocol.integrationStatus === 'unavailable'}
                    >
                      {protocol.integrationStatus === 'connected' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </>
                      ) : protocol.integrationStatus === 'available' ? (
                        <>
                          <Link className="h-3 w-3 mr-1" />
                          Connect
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unavailable
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Yield Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Yield Opportunities</CardTitle>
              <CardDescription>
                Ranked by APY with risk-adjusted scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {yieldOpportunities.slice(0, 10).map((opp, index) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{opp.protocolName}</div>
                        <div className="text-sm text-muted-foreground">{opp.strategy}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {opp.apy.toFixed(1)}% APY
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${(opp.tvl / 1000000000).toFixed(1)}B TVL
                        </div>
                      </div>
                      <Badge className={`${
                        opp.risk === 'low' ? 'bg-green-100 text-green-800' :
                        opp.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {opp.risk} risk
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          {portfolioAllocations.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Current Allocations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioAllocations.map(allocation => (
                      <div key={allocation.protocolId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Coins className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{allocation.protocolName}</div>
                            <div className="text-sm text-muted-foreground">
                              {allocation.percentage.toFixed(1)}% allocation
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">
                              ${allocation.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {allocation.apy.toFixed(1)}% APY
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              ${allocation.dailyRewards.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              daily rewards
                            </div>
                          </div>
                          <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                            {allocation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={portfolioAllocations.map((allocation, index) => ({
                            name: allocation.protocolName,
                            value: allocation.amount,
                            color: COLORS[index % COLORS.length]
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ name, value, percent }) => 
                            `${name}: $${(value / 1000).toFixed(0)}K (${(percent * 100).toFixed(1)}%)`
                          }
                        >
                          {portfolioAllocations.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Portfolio Allocations</h3>
                <p className="text-muted-foreground mb-4">
                  Optimize your portfolio to see allocations across DeFi protocols
                </p>
                <Button onClick={optimizePortfolio} disabled={isOptimizing}>
                  <Target className="h-4 w-4 mr-2" />
                  Optimize Portfolio
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Protocol Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TVL vs APY Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={tvlDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tvl" fill="#3B82F6" name="TVL (B)" />
                      <Line
                        type="monotone"
                        dataKey="apy"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="APY (%)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                    <Radar
                      name="Monthly Return"
                      dataKey="monthly"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Sharpe Ratio"
                      dataKey="sharpe"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Strategies</CardTitle>
              <CardDescription>
                Pre-configured DeFi strategies for different risk profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protocols.map(protocol => 
                  protocol.strategies.map(strategy => (
                    <div key={strategy.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{protocol.name} - {strategy.name}</h4>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                        <Badge className={`${
                          strategy.risk === 'low' ? 'bg-green-100 text-green-800' :
                          strategy.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {strategy.risk} risk
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground">APY</div>
                          <div className="font-semibold text-green-600">{strategy.apy.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">TVL</div>
                          <div className="font-semibold">${(strategy.tvl / 1000000000).toFixed(1)}B</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Min Amount</div>
                          <div className="font-semibold">${strategy.minimumAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Lockup</div>
                          <div className="font-semibold">
                            {strategy.lockupDays === 0 ? 'None' : `${strategy.lockupDays} days`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {strategy.rewards.map(reward => (
                            <Badge key={reward} variant="outline" className="text-xs">
                              {reward}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Deploy Strategy
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DeFi Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portfolioValue">Total Portfolio Value</Label>
                <Input
                  id="portfolioValue"
                  type="number"
                  value={totalPortfolioValue}
                  onChange={(e) => setTotalPortfolioValue(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoCompound">Auto-Compound Rewards</Label>
                  <Switch id="autoCompound" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="riskManagement">Risk Management</Label>
                  <Switch id="riskManagement" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gasOptimization">Gas Optimization</Label>
                  <Switch id="gasOptimization" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="rebalancing">Auto Rebalancing</Label>
                  <Switch id="rebalancing" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DeFiProtocolIntegrationHub