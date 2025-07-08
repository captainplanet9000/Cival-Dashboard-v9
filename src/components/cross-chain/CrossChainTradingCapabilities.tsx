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
  Network, Link, Zap, Activity, TrendingUp, ArrowRight, ArrowLeft,
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  DollarSign, Percent, BarChart3, PieChart, Globe, Shield,
  Layers, Bitcoin, Coins, CreditCard, Wallet, Users,
  ArrowUpDown, Repeat, Timer, Target, Award, Eye
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart,
  Sankey, Flow, ScatterChart, Scatter
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Cross-Chain Trading Capabilities Component
 * Advanced cross-chain trading and bridging infrastructure
 * Features multi-chain arbitrage, asset bridging, and liquidity management
 */

interface CrossChainBridge {
  id: string
  name: string
  type: 'native' | 'wrapped' | 'liquidity' | 'atomic_swap'
  sourceChain: string
  targetChain: string
  supportedAssets: string[]
  fee: number
  feeType: 'fixed' | 'percentage'
  minAmount: number
  maxAmount: number
  averageTime: number
  successRate: number
  volume24h: number
  tvl: number
  securityScore: number
  isActive: boolean
  lastUpdate: Date
}

interface ArbitrageOpportunity {
  id: string
  asset: string
  sourceChain: string
  targetChain: string
  sourcePrice: number
  targetPrice: number
  priceSpread: number
  profitPotential: number
  gasEstimate: number
  netProfit: number
  confidence: number
  liquiditySource: number
  liquidityTarget: number
  executionTime: number
  riskLevel: 'low' | 'medium' | 'high'
  volume24h: number
  lastUpdated: Date
}

interface CrossChainTransaction {
  id: string
  type: 'bridge' | 'arbitrage' | 'swap' | 'transfer'
  sourceChain: string
  targetChain: string
  asset: string
  amount: number
  sourceHash: string
  targetHash?: string
  status: 'pending' | 'processing' | 'confirming' | 'completed' | 'failed'
  progress: number
  estimatedTime: number
  actualTime?: number
  fees: number
  timestamp: Date
  bridgeUsed: string
}

interface LiquidityPool {
  id: string
  name: string
  chains: string[]
  assets: string[]
  totalLiquidity: number
  volume24h: number
  apy: number
  impermanentLoss: number
  fees24h: number
  utilization: number
  isActive: boolean
  rebalanceThreshold: number
  lastRebalance: Date
}

const MOCK_BRIDGES: CrossChainBridge[] = [
  {
    id: 'wormhole',
    name: 'Wormhole',
    type: 'native',
    sourceChain: 'ethereum',
    targetChain: 'solana',
    supportedAssets: ['ETH', 'USDC', 'USDT', 'WBTC'],
    fee: 0.001,
    feeType: 'percentage',
    minAmount: 10,
    maxAmount: 1000000,
    averageTime: 15,
    successRate: 99.2,
    volume24h: 45000000,
    tvl: 850000000,
    securityScore: 9,
    isActive: true,
    lastUpdate: new Date()
  },
  {
    id: 'layerzero',
    name: 'LayerZero',
    type: 'native',
    sourceChain: 'ethereum',
    targetChain: 'arbitrum',
    supportedAssets: ['ETH', 'USDC', 'USDT', 'DAI'],
    fee: 0.0005,
    feeType: 'percentage',
    minAmount: 1,
    maxAmount: 500000,
    averageTime: 8,
    successRate: 99.8,
    volume24h: 78000000,
    tvl: 1200000000,
    securityScore: 10,
    isActive: true,
    lastUpdate: new Date()
  },
  {
    id: 'stargate',
    name: 'Stargate Finance',
    type: 'liquidity',
    sourceChain: 'polygon',
    targetChain: 'ethereum',
    supportedAssets: ['USDC', 'USDT', 'DAI', 'FRAX'],
    fee: 0.0006,
    feeType: 'percentage',
    minAmount: 5,
    maxAmount: 250000,
    averageTime: 12,
    successRate: 99.5,
    volume24h: 32000000,
    tvl: 450000000,
    securityScore: 8,
    isActive: true,
    lastUpdate: new Date()
  },
  {
    id: 'hop-protocol',
    name: 'Hop Protocol',
    type: 'liquidity',
    sourceChain: 'arbitrum',
    targetChain: 'polygon',
    supportedAssets: ['ETH', 'USDC', 'USDT', 'DAI', 'MATIC'],
    fee: 0.001,
    feeType: 'percentage',
    minAmount: 10,
    maxAmount: 100000,
    averageTime: 20,
    successRate: 98.9,
    volume24h: 18000000,
    tvl: 280000000,
    securityScore: 8,
    isActive: true,
    lastUpdate: new Date()
  }
]

const MOCK_ARBITRAGE_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    id: 'arb-eth-poly-1',
    asset: 'ETH',
    sourceChain: 'ethereum',
    targetChain: 'polygon',
    sourcePrice: 2245.50,
    targetPrice: 2251.80,
    priceSpread: 0.28,
    profitPotential: 0.28,
    gasEstimate: 45,
    netProfit: 0.08,
    confidence: 85,
    liquiditySource: 2800000,
    liquidityTarget: 1200000,
    executionTime: 25,
    riskLevel: 'medium',
    volume24h: 1200000,
    lastUpdated: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    id: 'arb-usdc-arb-2',
    asset: 'USDC',
    sourceChain: 'arbitrum',
    targetChain: 'base',
    sourcePrice: 1.0008,
    targetPrice: 1.0015,
    priceSpread: 0.07,
    profitPotential: 0.07,
    gasEstimate: 12,
    netProfit: 0.04,
    confidence: 92,
    liquiditySource: 5600000,
    liquidityTarget: 3200000,
    executionTime: 18,
    riskLevel: 'low',
    volume24h: 2800000,
    lastUpdated: new Date(Date.now() - 1 * 60 * 1000)
  },
  {
    id: 'arb-wbtc-sol-3',
    asset: 'WBTC',
    sourceChain: 'ethereum',
    targetChain: 'solana',
    sourcePrice: 43250.00,
    targetPrice: 43380.00,
    priceSpread: 0.30,
    profitPotential: 0.30,
    gasEstimate: 75,
    netProfit: 0.12,
    confidence: 78,
    liquiditySource: 850000,
    liquidityTarget: 420000,
    executionTime: 35,
    riskLevel: 'high',
    volume24h: 450000,
    lastUpdated: new Date(Date.now() - 3 * 60 * 1000)
  }
]

const MOCK_TRANSACTIONS: CrossChainTransaction[] = [
  {
    id: 'tx-001',
    type: 'bridge',
    sourceChain: 'ethereum',
    targetChain: 'arbitrum',
    asset: 'ETH',
    amount: 2.5,
    sourceHash: '0x742d35Cc6634C0532925a3b8D9d2F8c19b40eF3f',
    targetHash: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
    status: 'completed',
    progress: 100,
    estimatedTime: 8,
    actualTime: 7,
    fees: 0.008,
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    bridgeUsed: 'LayerZero'
  },
  {
    id: 'tx-002',
    type: 'arbitrage',
    sourceChain: 'polygon',
    targetChain: 'ethereum',
    asset: 'USDC',
    amount: 10000,
    sourceHash: '0x894A7B32c8b0934D7583C8C0F8E8E0F8D6B2A7C9',
    status: 'processing',
    progress: 65,
    estimatedTime: 12,
    fees: 8.5,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    bridgeUsed: 'Stargate Finance'
  },
  {
    id: 'tx-003',
    type: 'swap',
    sourceChain: 'arbitrum',
    targetChain: 'base',
    asset: 'USDT',
    amount: 5000,
    sourceHash: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    status: 'pending',
    progress: 0,
    estimatedTime: 18,
    fees: 2.5,
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    bridgeUsed: 'Hop Protocol'
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

interface CrossChainTradingCapabilitiesProps {
  onBridgeTransaction?: (bridgeId: string, amount: number) => void
  onArbitrageExecute?: (opportunityId: string) => void
  className?: string
}

export function CrossChainTradingCapabilities({
  onBridgeTransaction,
  onArbitrageExecute,
  className = ''
}: CrossChainTradingCapabilitiesProps) {
  const [bridges, setBridges] = useState<CrossChainBridge[]>(MOCK_BRIDGES)
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>(MOCK_ARBITRAGE_OPPORTUNITIES)
  const [transactions, setTransactions] = useState<CrossChainTransaction[]>(MOCK_TRANSACTIONS)
  const [selectedSourceChain, setSelectedSourceChain] = useState<string>('ethereum')
  const [selectedTargetChain, setSelectedTargetChain] = useState<string>('arbitrum')
  const [selectedAsset, setSelectedAsset] = useState<string>('ETH')
  const [bridgeAmount, setBridgeAmount] = useState<number>(1)
  const [autoArbitrage, setAutoArbitrage] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Calculate cross-chain metrics
  const metrics = useMemo(() => {
    const totalVolume24h = bridges.reduce((sum, bridge) => sum + bridge.volume24h, 0)
    const totalTVL = bridges.reduce((sum, bridge) => sum + bridge.tvl, 0)
    const avgSuccessRate = bridges.reduce((sum, bridge) => sum + bridge.successRate, 0) / bridges.length
    const activeArbitrageOpps = arbitrageOpportunities.filter(opp => opp.confidence > 70).length
    const totalArbitrageProfit = arbitrageOpportunities.reduce((sum, opp) => sum + opp.profitPotential, 0)
    const pendingTransactions = transactions.filter(tx => tx.status === 'pending' || tx.status === 'processing').length

    return {
      totalVolume24h,
      totalTVL,
      avgSuccessRate,
      activeArbitrageOpps,
      totalArbitrageProfit,
      pendingTransactions,
      activeBridges: bridges.filter(b => b.isActive).length
    }
  }, [bridges, arbitrageOpportunities, transactions])

  // Get available bridges for selected chains
  const availableBridges = useMemo(() => {
    return bridges.filter(bridge => 
      bridge.sourceChain === selectedSourceChain && 
      bridge.targetChain === selectedTargetChain &&
      bridge.supportedAssets.includes(selectedAsset)
    )
  }, [bridges, selectedSourceChain, selectedTargetChain, selectedAsset])

  // Bridge volume distribution data
  const bridgeVolumeData = useMemo(() => {
    return bridges.map(bridge => ({
      name: bridge.name,
      volume: bridge.volume24h / 1000000, // Convert to millions
      tvl: bridge.tvl / 1000000000, // Convert to billions
      successRate: bridge.successRate,
      securityScore: bridge.securityScore
    }))
  }, [bridges])

  // Chain distribution data
  const chainDistributionData = useMemo(() => {
    const chainVolumes = bridges.reduce((acc, bridge) => {
      acc[bridge.sourceChain] = (acc[bridge.sourceChain] || 0) + bridge.volume24h
      acc[bridge.targetChain] = (acc[bridge.targetChain] || 0) + bridge.volume24h
      return acc
    }, {} as Record<string, number>)

    return Object.entries(chainVolumes).map(([chain, volume], index) => ({
      name: chain.charAt(0).toUpperCase() + chain.slice(1),
      value: volume / 1000000, // Convert to millions
      color: COLORS[index % COLORS.length]
    }))
  }, [bridges])

  // Arbitrage trend data
  const arbitrageTrendData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        time: timestamp.toISOString().slice(11, 16),
        opportunities: Math.floor(Math.random() * 10) + 5,
        avgProfit: Math.random() * 0.5 + 0.1,
        volume: Math.random() * 2000000 + 500000
      })
    }
    
    return data
  }, [])

  // Execute arbitrage opportunity
  const executeArbitrage = useCallback(async (opportunityId: string) => {
    setIsExecuting(true)
    
    try {
      // Simulate arbitrage execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update opportunity status
      setArbitrageOpportunities(prev => 
        prev.filter(opp => opp.id !== opportunityId)
      )
      
      // Add transaction record
      const opportunity = arbitrageOpportunities.find(opp => opp.id === opportunityId)
      if (opportunity) {
        const newTransaction: CrossChainTransaction = {
          id: `tx-${Date.now()}`,
          type: 'arbitrage',
          sourceChain: opportunity.sourceChain,
          targetChain: opportunity.targetChain,
          asset: opportunity.asset,
          amount: 1000, // Mock amount
          sourceHash: `0x${Math.random().toString(16).substr(2, 40)}`,
          status: 'processing',
          progress: 0,
          estimatedTime: opportunity.executionTime,
          fees: opportunity.gasEstimate,
          timestamp: new Date(),
          bridgeUsed: 'Auto-Selected'
        }
        
        setTransactions(prev => [newTransaction, ...prev])
        
        if (onArbitrageExecute) {
          onArbitrageExecute(opportunityId)
        }
      }
    } catch (error) {
      console.error('Arbitrage execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }, [arbitrageOpportunities, onArbitrageExecute])

  // Execute bridge transaction
  const executeBridge = useCallback(async (bridgeId: string) => {
    const bridge = bridges.find(b => b.id === bridgeId)
    if (!bridge) return

    try {
      const newTransaction: CrossChainTransaction = {
        id: `tx-${Date.now()}`,
        type: 'bridge',
        sourceChain: selectedSourceChain,
        targetChain: selectedTargetChain,
        asset: selectedAsset,
        amount: bridgeAmount,
        sourceHash: `0x${Math.random().toString(16).substr(2, 40)}`,
        status: 'pending',
        progress: 0,
        estimatedTime: bridge.averageTime,
        fees: bridge.feeType === 'percentage' ? bridgeAmount * bridge.fee : bridge.fee,
        timestamp: new Date(),
        bridgeUsed: bridge.name
      }
      
      setTransactions(prev => [newTransaction, ...prev])
      
      if (onBridgeTransaction) {
        onBridgeTransaction(bridgeId, bridgeAmount)
      }
    } catch (error) {
      console.error('Bridge transaction failed:', error)
    }
  }, [bridges, selectedSourceChain, selectedTargetChain, selectedAsset, bridgeAmount, onBridgeTransaction])

  // Update transaction progress (simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => prev.map(tx => {
        if (tx.status === 'processing' && tx.progress < 100) {
          const newProgress = Math.min(100, tx.progress + Math.random() * 15)
          return {
            ...tx,
            progress: newProgress,
            status: newProgress === 100 ? 'completed' : 'processing'
          }
        }
        if (tx.status === 'pending') {
          return { ...tx, status: 'processing', progress: 5 }
        }
        return tx
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
                <Network className="h-6 w-6 text-blue-600" />
                Cross-Chain Trading Capabilities
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {metrics.activeBridges} Bridges Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Advanced cross-chain arbitrage and asset bridging across multiple networks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="autoArbitrage" className="text-sm">Auto Arbitrage</Label>
                <Switch
                  id="autoArbitrage"
                  checked={autoArbitrage}
                  onCheckedChange={setAutoArbitrage}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={metrics.totalVolume24h / 1000000} precision={0} suffix="M" />
            </div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={metrics.totalTVL / 1000000000} precision={1} suffix="B" />
            </div>
            <div className="text-sm text-muted-foreground">Total TVL</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={metrics.avgSuccessRate} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={metrics.activeArbitrageOpps} />
            </div>
            <div className="text-sm text-muted-foreground">Arbitrage Ops</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              <AnimatedCounter value={metrics.totalArbitrageProfit} precision={2} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              <AnimatedCounter value={metrics.pendingTransactions} />
            </div>
            <div className="text-sm text-muted-foreground">Pending Txs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              <AnimatedCounter value={metrics.activeBridges} />
            </div>
            <div className="text-sm text-muted-foreground">Active Bridges</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="bridge" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="bridge">Bridge Assets</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="bridges">Bridge Network</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Bridge Assets Tab */}
        <TabsContent value="bridge" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bridge Configuration</CardTitle>
                <CardDescription>
                  Configure cross-chain asset transfer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceChain">Source Chain</Label>
                    <Select value={selectedSourceChain} onValueChange={setSelectedSourceChain}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetChain">Target Chain</Label>
                    <Select value={selectedTargetChain} onValueChange={setSelectedTargetChain}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="asset">Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="WBTC">WBTC</SelectItem>
                      <SelectItem value="DAI">DAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(Number(e.target.value) || 0)}
                    placeholder="Enter amount"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Bridges</CardTitle>
                <CardDescription>
                  {availableBridges.length} bridge(s) available for this route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableBridges.length > 0 ? (
                    availableBridges.map(bridge => (
                      <div key={bridge.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              bridge.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">{bridge.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {bridge.type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>Fee: {bridge.feeType === 'percentage' ? `${(bridge.fee * 100).toFixed(2)}%` : `$${bridge.fee}`}</div>
                          <div>Time: ~{bridge.averageTime}min</div>
                          <div>Success: {bridge.successRate.toFixed(1)}%</div>
                          <div>Security: {bridge.securityScore}/10</div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => executeBridge(bridge.id)}
                          disabled={!bridge.isActive || bridgeAmount < bridge.minAmount}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Bridge via {bridge.name}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No bridges available for this route</p>
                      <p className="text-sm">Try selecting different chains or assets</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Arbitrage Tab */}
        <TabsContent value="arbitrage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Arbitrage Opportunities</CardTitle>
                  <CardDescription>
                    {arbitrageOpportunities.length} opportunities identified
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setArbitrageOpportunities([...MOCK_ARBITRAGE_OPPORTUNITIES])}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {arbitrageOpportunities.map(opp => (
                  <div key={opp.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{opp.asset}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opp.sourceChain} → {opp.targetChain}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(opp.riskLevel)}>
                          {opp.riskLevel} risk
                        </Badge>
                        <Badge variant="outline">
                          {opp.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-muted-foreground">Source Price</div>
                        <div className="font-semibold">${opp.sourcePrice.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-muted-foreground">Target Price</div>
                        <div className="font-semibold">${opp.targetPrice.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className="font-semibold text-green-600">
                          {opp.profitPotential.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm text-muted-foreground">Net Profit</div>
                        <div className="font-semibold text-blue-600">
                          {opp.netProfit.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Est. time: {opp.executionTime}min • Gas: ${opp.gasEstimate}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => executeArbitrage(opp.id)}
                        disabled={isExecuting || opp.confidence < 70}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Execute
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arbitrage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={arbitrageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      stroke="#3B82F6"
                      name="Volume ($)"
                    />
                    <Line
                      type="monotone"
                      dataKey="opportunities"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Opportunities"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgProfit"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Avg Profit (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                {transactions.length} cross-chain transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {tx.type}
                          </Badge>
                          <span className="font-medium">{tx.amount} {tx.asset}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tx.sourceChain} → {tx.targetChain}
                        </div>
                      </div>
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                    
                    {tx.status === 'processing' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{tx.progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={tx.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Bridge</div>
                        <div className="font-medium">{tx.bridgeUsed}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fees</div>
                        <div className="font-medium">${tx.fees.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time</div>
                        <div className="font-medium">
                          {tx.actualTime ? `${tx.actualTime}min` : `~${tx.estimatedTime}min`}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Timestamp</div>
                        <div className="font-medium">
                          {tx.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      <div>Source: {tx.sourceHash}</div>
                      {tx.targetHash && (
                        <div>Target: {tx.targetHash}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bridge Volume Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bridgeVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="volume" fill="#3B82F6" name="Volume (M)" />
                      <Bar dataKey="tvl" fill="#10B981" name="TVL (B)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chain Volume Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chainDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, value }) => `${name}: ${value.toFixed(0)}M`}
                      >
                        {chainDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value.toFixed(0)}M`, 'Volume']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bridge Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bridges.map(bridge => (
                  <div key={bridge.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        bridge.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{bridge.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="font-semibold">{bridge.successRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{bridge.averageTime}min</div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{bridge.securityScore}/10</div>
                        <div className="text-xs text-muted-foreground">Security</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">${(bridge.volume24h / 1000000).toFixed(0)}M</div>
                        <div className="text-xs text-muted-foreground">24h Vol</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bridge Network Tab */}
        <TabsContent value="bridges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bridge Network Overview</CardTitle>
              <CardDescription>
                Complete network of cross-chain bridges and their capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bridges.map(bridge => (
                  <Card key={bridge.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{bridge.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {bridge.type}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${
                            bridge.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Route:</span>
                          <span className="font-medium capitalize">
                            {bridge.sourceChain} → {bridge.targetChain}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>TVL:</span>
                          <span className="font-medium">
                            ${(bridge.tvl / 1000000000).toFixed(1)}B
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>24h Volume:</span>
                          <span className="font-medium">
                            ${(bridge.volume24h / 1000000).toFixed(0)}M
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate:</span>
                          <span className="font-medium">{bridge.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Time:</span>
                          <span className="font-medium">{bridge.averageTime}min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Security Score:</span>
                          <span className="font-medium">{bridge.securityScore}/10</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          Supported Assets:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {bridge.supportedAssets.slice(0, 3).map(asset => (
                            <Badge key={asset} variant="secondary" className="text-xs">
                              {asset}
                            </Badge>
                          ))}
                          {bridge.supportedAssets.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{bridge.supportedAssets.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Chain Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoArbitrageToggle">Auto Arbitrage Execution</Label>
                  <Switch
                    id="autoArbitrageToggle"
                    checked={autoArbitrage}
                    onCheckedChange={setAutoArbitrage}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gasOptimization">Gas Price Optimization</Label>
                  <Switch id="gasOptimization" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="slippageTolerance">Slippage Protection</Label>
                  <Switch id="slippageTolerance" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bridgeMonitoring">Bridge Health Monitoring</Label>
                  <Switch id="bridgeMonitoring" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="riskManagement">Risk Management</Label>
                  <Switch id="riskManagement" defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGasPrice">Max Gas Price (gwei)</Label>
                <Input
                  id="maxGasPrice"
                  type="number"
                  defaultValue="50"
                  placeholder="Maximum gas price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minProfitThreshold">Min Profit Threshold (%)</Label>
                <Input
                  id="minProfitThreshold"
                  type="number"
                  step="0.01"
                  defaultValue="0.05"
                  placeholder="Minimum profit threshold"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CrossChainTradingCapabilities