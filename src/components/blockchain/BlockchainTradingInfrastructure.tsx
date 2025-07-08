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
  Bitcoin, Coins, Layers, Network, Shield, Zap, Activity, TrendingUp,
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock, Eye,
  DollarSign, Percent, ArrowUp, ArrowDown, Minus, Sparkles,
  Link, Lock, Key, Database, Server, Globe, ChevronRight
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Cell, ComposedChart
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Blockchain Trading Infrastructure Component
 * Comprehensive blockchain integration for decentralized trading
 * Features multi-chain support, DeFi protocols, and smart contract automation
 */

interface BlockchainNetwork {
  id: string
  name: string
  symbol: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  status: 'active' | 'inactive' | 'maintenance' | 'error'
  blockTime: number
  gasPrice: number
  gasLimit: number
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  supportedProtocols: string[]
  tvl: number
  volume24h: number
  transactions24h: number
  fees24h: number
  connectedWallets: number
  lastBlockNumber: number
  lastUpdate: Date
}

interface DeFiProtocol {
  id: string
  name: string
  type: 'dex' | 'lending' | 'farming' | 'staking' | 'bridge' | 'derivatives'
  network: string
  contractAddress: string
  tvl: number
  apy: number
  volume24h: number
  fees24h: number
  users24h: number
  isAudited: boolean
  riskScore: number
  supportedTokens: string[]
  features: string[]
  status: 'active' | 'deprecated' | 'beta'
  integration: 'native' | 'api' | 'sdk'
  gasOptimization: number
  lastUpdate: Date
}

interface SmartContract {
  id: string
  name: string
  type: 'trading' | 'automation' | 'yield' | 'arbitrage' | 'governance'
  network: string
  address: string
  abi: any[]
  isVerified: boolean
  gasUsage: number
  executionCount: number
  successRate: number
  totalValue: number
  permissions: string[]
  autoExecution: boolean
  conditions: any[]
  schedule: string
  lastExecution: Date
  nextExecution: Date
  status: 'deployed' | 'paused' | 'upgrading' | 'deprecated'
}

interface CrossChainBridge {
  id: string
  name: string
  sourceChain: string
  targetChain: string
  supportedTokens: string[]
  bridgeFee: number
  minAmount: number
  maxAmount: number
  transferTime: number
  securityLevel: 'high' | 'medium' | 'low'
  volume24h: number
  transactions24h: number
  successRate: number
  status: 'active' | 'maintenance' | 'disabled'
  lastUpdate: Date
}

interface BlockchainMetrics {
  totalNetworks: number
  totalProtocols: number
  totalContracts: number
  totalTVL: number
  total24hVolume: number
  total24hFees: number
  totalTransactions: number
  avgGasPrice: number
  crossChainVolume: number
  activeWallets: number
  protocolUtilization: number
  networkHealth: number
}

const MOCK_NETWORKS: BlockchainNetwork[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    status: 'active',
    blockTime: 12,
    gasPrice: 25,
    gasLimit: 21000,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    supportedProtocols: ['Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve'],
    tvl: 45600000000,
    volume24h: 2300000000,
    transactions24h: 1200000,
    fees24h: 8500000,
    connectedWallets: 850000,
    lastBlockNumber: 18650000,
    lastUpdate: new Date()
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    status: 'active',
    blockTime: 2,
    gasPrice: 2,
    gasLimit: 21000,
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    supportedProtocols: ['QuickSwap', 'SushiSwap', 'Curve', 'Balancer'],
    tvl: 12400000000,
    volume24h: 450000000,
    transactions24h: 3500000,
    fees24h: 250000,
    connectedWallets: 420000,
    lastBlockNumber: 48900000,
    lastUpdate: new Date()
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ARB',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    status: 'active',
    blockTime: 1,
    gasPrice: 0.5,
    gasLimit: 21000,
    nativeCurrency: { name: 'Arbitrum', symbol: 'ARB', decimals: 18 },
    supportedProtocols: ['Uniswap V3', 'GMX', 'Radiant', 'Camelot'],
    tvl: 8900000000,
    volume24h: 380000000,
    transactions24h: 890000,
    fees24h: 180000,
    connectedWallets: 280000,
    lastBlockNumber: 142000000,
    lastUpdate: new Date()
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    status: 'active',
    blockTime: 2,
    gasPrice: 1,
    gasLimit: 21000,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    supportedProtocols: ['Uniswap V3', 'Aerodrome', 'Compound'],
    tvl: 5600000000,
    volume24h: 120000000,
    transactions24h: 450000,
    fees24h: 85000,
    connectedWallets: 150000,
    lastBlockNumber: 8250000,
    lastUpdate: new Date()
  }
]

const MOCK_PROTOCOLS: DeFiProtocol[] = [
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    type: 'dex',
    network: 'ethereum',
    contractAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    tvl: 8500000000,
    apy: 12.5,
    volume24h: 980000000,
    fees24h: 2800000,
    users24h: 25000,
    isAudited: true,
    riskScore: 2,
    supportedTokens: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'],
    features: ['Concentrated Liquidity', 'Multiple Fee Tiers', 'NFT Positions'],
    status: 'active',
    integration: 'sdk',
    gasOptimization: 85,
    lastUpdate: new Date()
  },
  {
    id: 'aave-v3',
    name: 'Aave V3',
    type: 'lending',
    network: 'ethereum',
    contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    tvl: 6200000000,
    apy: 8.2,
    volume24h: 450000000,
    fees24h: 850000,
    users24h: 15000,
    isAudited: true,
    riskScore: 1,
    supportedTokens: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'LINK'],
    features: ['Flash Loans', 'Isolation Mode', 'High Efficiency Mode'],
    status: 'active',
    integration: 'api',
    gasOptimization: 90,
    lastUpdate: new Date()
  },
  {
    id: 'curve-finance',
    name: 'Curve Finance',
    type: 'dex',
    network: 'ethereum',
    contractAddress: '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46',
    tvl: 4800000000,
    apy: 15.8,
    volume24h: 320000000,
    fees24h: 650000,
    users24h: 12000,
    isAudited: true,
    riskScore: 2,
    supportedTokens: ['USDC', 'USDT', 'DAI', 'FRAX', '3CRV'],
    features: ['Stable Swaps', 'Metapool', 'Gauge Voting'],
    status: 'active',
    integration: 'native',
    gasOptimization: 92,
    lastUpdate: new Date()
  }
]

const MOCK_CONTRACTS: SmartContract[] = [
  {
    id: 'arbitrage-bot',
    name: 'Cross-DEX Arbitrage',
    type: 'arbitrage',
    network: 'ethereum',
    address: '0x742d35Cc6634C0532925a3b8D9d2F8c19b40eF3f',
    abi: [],
    isVerified: true,
    gasUsage: 180000,
    executionCount: 1247,
    successRate: 94.2,
    totalValue: 2850000,
    permissions: ['EXECUTE_TRADES', 'ACCESS_FUNDS'],
    autoExecution: true,
    conditions: [
      { type: 'price_diff', threshold: 0.5, comparison: 'gt' },
      { type: 'gas_price', threshold: 50, comparison: 'lt' }
    ],
    schedule: '*/30 * * * * *', // Every 30 seconds
    lastExecution: new Date(Date.now() - 45 * 1000),
    nextExecution: new Date(Date.now() + 15 * 1000),
    status: 'deployed'
  },
  {
    id: 'yield-optimizer',
    name: 'Yield Optimization Strategy',
    type: 'yield',
    network: 'polygon',
    address: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
    abi: [],
    isVerified: true,
    gasUsage: 95000,
    executionCount: 847,
    successRate: 98.5,
    totalValue: 1250000,
    permissions: ['COMPOUND_REWARDS', 'REBALANCE_PORTFOLIO'],
    autoExecution: true,
    conditions: [
      { type: 'reward_threshold', threshold: 100, comparison: 'gt' },
      { type: 'gas_optimization', threshold: 80, comparison: 'gt' }
    ],
    schedule: '0 */6 * * *', // Every 6 hours
    lastExecution: new Date(Date.now() - 3 * 60 * 60 * 1000),
    nextExecution: new Date(Date.now() + 3 * 60 * 60 * 1000),
    status: 'deployed'
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

interface BlockchainTradingInfrastructureProps {
  onNetworkConnect?: (networkId: string) => void
  onProtocolIntegrate?: (protocolId: string) => void
  onContractDeploy?: (contractId: string) => void
  className?: string
}

export function BlockchainTradingInfrastructure({
  onNetworkConnect,
  onProtocolIntegrate,
  onContractDeploy,
  className = ''
}: BlockchainTradingInfrastructureProps) {
  const [networks, setNetworks] = useState<BlockchainNetwork[]>(MOCK_NETWORKS)
  const [protocols, setProtocols] = useState<DeFiProtocol[]>(MOCK_PROTOCOLS)
  const [contracts, setContracts] = useState<SmartContract[]>(MOCK_CONTRACTS)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState(0)

  // Calculate blockchain metrics
  const metrics = useMemo<BlockchainMetrics>(() => {
    const totalTVL = networks.reduce((sum, network) => sum + network.tvl, 0)
    const total24hVolume = networks.reduce((sum, network) => sum + network.volume24h, 0)
    const total24hFees = networks.reduce((sum, network) => sum + network.fees24h, 0)
    const totalTransactions = networks.reduce((sum, network) => sum + network.transactions24h, 0)
    const avgGasPrice = networks.reduce((sum, network) => sum + network.gasPrice, 0) / networks.length
    const activeWallets = networks.reduce((sum, network) => sum + network.connectedWallets, 0)
    
    return {
      totalNetworks: networks.length,
      totalProtocols: protocols.length,
      totalContracts: contracts.length,
      totalTVL,
      total24hVolume,
      total24hFees,
      totalTransactions,
      avgGasPrice,
      crossChainVolume: total24hVolume * 0.15, // Estimate 15% cross-chain
      activeWallets,
      protocolUtilization: protocols.filter(p => p.status === 'active').length / protocols.length * 100,
      networkHealth: networks.filter(n => n.status === 'active').length / networks.length * 100
    }
  }, [networks, protocols, contracts])

  // Network comparison chart data
  const networkChartData = useMemo(() => {
    return networks.map(network => ({
      name: network.name,
      tvl: network.tvl / 1000000000, // Convert to billions
      volume: network.volume24h / 1000000, // Convert to millions
      transactions: network.transactions24h / 1000, // Convert to thousands
      gasPrice: network.gasPrice,
      fees: network.fees24h / 1000 // Convert to thousands
    }))
  }, [networks])

  // Protocol distribution data
  const protocolDistributionData = useMemo(() => {
    const typeCount = protocols.reduce((acc, protocol) => {
      acc[protocol.type] = (acc[protocol.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: (count / protocols.length) * 100
    }))
  }, [protocols])

  // TVL trend data (mock historical data)
  const tvlTrendData = useMemo(() => {
    const data = []
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - 30)
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalTVL: metrics.totalTVL * (0.8 + Math.random() * 0.4) / 1000000000,
        volume: metrics.total24hVolume * (0.7 + Math.random() * 0.6) / 1000000,
        protocols: protocols.length + Math.floor((Math.random() - 0.5) * 5)
      })
    }
    
    return data
  }, [metrics, protocols])

  // Deploy smart contract simulation
  const deployContract = useCallback(async (contractType: string) => {
    if (isDeploying) return
    
    setIsDeploying(true)
    setDeploymentProgress(0)
    
    try {
      // Simulate deployment steps
      const steps = [
        'Compiling contract...',
        'Optimizing bytecode...',
        'Estimating gas...',
        'Broadcasting transaction...',
        'Waiting for confirmation...',
        'Verifying contract...',
        'Deployment complete!'
      ]
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setDeploymentProgress(((i + 1) / steps.length) * 100)
      }
      
      // Add new contract to list
      const newContract: SmartContract = {
        id: `contract-${Date.now()}`,
        name: `${contractType} Contract`,
        type: contractType as any,
        network: selectedNetwork,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        abi: [],
        isVerified: true,
        gasUsage: 150000 + Math.floor(Math.random() * 100000),
        executionCount: 0,
        successRate: 100,
        totalValue: 0,
        permissions: ['BASIC_EXECUTION'],
        autoExecution: false,
        conditions: [],
        schedule: '',
        lastExecution: new Date(),
        nextExecution: new Date(),
        status: 'deployed'
      }
      
      setContracts(prev => [newContract, ...prev])
      
      if (onContractDeploy) {
        onContractDeploy(newContract.id)
      }
    } catch (error) {
      console.error('Contract deployment failed:', error)
    } finally {
      setIsDeploying(false)
      setDeploymentProgress(0)
    }
  }, [isDeploying, selectedNetwork, onContractDeploy])

  // Network status indicator
  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Protocol risk score color
  const getRiskScoreColor = (score: number) => {
    if (score <= 2) return 'text-green-600'
    if (score <= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-blue-600" />
                Blockchain Trading Infrastructure
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Multi-Chain
                </Badge>
              </CardTitle>
              <CardDescription>
                Decentralized trading across {metrics.totalNetworks} networks with {metrics.totalProtocols} DeFi protocols
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => deployContract('trading')}
                disabled={isDeploying}
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Deploy Contract
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Deployment Progress */}
      <AnimatePresence>
        {isDeploying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Deploying Smart Contract</span>
                  <span className="text-sm text-muted-foreground">{deploymentProgress.toFixed(0)}%</span>
                </div>
                <Progress value={deploymentProgress} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={metrics.totalTVL / 1000000000} precision={1} suffix="B" />
            </div>
            <div className="text-sm text-muted-foreground">Total TVL</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={metrics.total24hVolume / 1000000} precision={0} suffix="M" />
            </div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={metrics.totalNetworks} />
            </div>
            <div className="text-sm text-muted-foreground">Networks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={metrics.totalProtocols} />
            </div>
            <div className="text-sm text-muted-foreground">DeFi Protocols</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              <AnimatedCounter value={metrics.totalContracts} />
            </div>
            <div className="text-sm text-muted-foreground">Smart Contracts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              <AnimatedCounter value={metrics.networkHealth} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Network Health</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="networks" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="protocols">DeFi Protocols</TabsTrigger>
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="bridges">Cross-Chain</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Networks Tab */}
        <TabsContent value="networks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {networks.map(network => (
              <Card key={network.id} className={`${
                selectedNetwork === network.id ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getNetworkStatusColor(network.status)}`} />
                      <CardTitle className="text-base">{network.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{network.symbol}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>TVL:</span>
                      <span className="font-medium">
                        ${(network.tvl / 1000000000).toFixed(1)}B
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>24h Volume:</span>
                      <span className="font-medium">
                        ${(network.volume24h / 1000000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gas Price:</span>
                      <span className="font-medium">{network.gasPrice} gwei</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Block Time:</span>
                      <span className="font-medium">{network.blockTime}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Wallets:</span>
                      <span className="font-medium">
                        {(network.connectedWallets / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    variant={selectedNetwork === network.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedNetwork(network.id)
                      if (onNetworkConnect) onNetworkConnect(network.id)
                    }}
                  >
                    {selectedNetwork === network.id ? 'Connected' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Network Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={networkChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tvl" fill="#3B82F6" name="TVL (B)" />
                    <Bar dataKey="volume" fill="#10B981" name="Volume (M)" />
                    <Line
                      type="monotone"
                      dataKey="gasPrice"
                      stroke="#F59E0B"
                      name="Gas Price"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DeFi Protocols Tab */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map(protocol => (
              <Card key={protocol.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{protocol.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {protocol.type}
                      </Badge>
                      {protocol.isAudited && (
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
                      <span className="font-medium">{protocol.apy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>24h Volume:</span>
                      <span className="font-medium">
                        ${(protocol.volume24h / 1000000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Risk Score:</span>
                      <span className={`font-medium ${getRiskScoreColor(protocol.riskScore)}`}>
                        {protocol.riskScore}/10
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Integration:</span>
                      <span className="font-medium capitalize">{protocol.integration}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {protocol.features.slice(0, 2).map(feature => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {protocol.features.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{protocol.features.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => {
                      if (onProtocolIntegrate) onProtocolIntegrate(protocol.id)
                    }}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Integrate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Protocol Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={protocolDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                      >
                        {protocolDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {protocolDistributionData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.value} protocols
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Deployed Smart Contracts</h3>
              <p className="text-sm text-muted-foreground">
                Manage automated trading and yield strategies
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networks.map(network => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => deployContract('trading')}
                disabled={isDeploying}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Deploy New
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map(contract => (
              <Card key={contract.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{contract.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {contract.type}
                      </Badge>
                      {contract.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Network:</span>
                      <span className="font-medium capitalize">{contract.network}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Executions:</span>
                      <span className="font-medium">{contract.executionCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className="font-medium">{contract.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Value:</span>
                      <span className="font-medium">
                        ${contract.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gas Usage:</span>
                      <span className="font-medium">{contract.gasUsage.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        contract.status === 'deployed' ? 'bg-green-500' :
                        contract.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs capitalize">{contract.status}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 px-2">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TVL and Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tvlTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="totalTVL"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      stroke="#3B82F6"
                      name="TVL (B)"
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Volume (M)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {networks.map((network, index) => (
                    <div key={network.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{network.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${(network.volume24h / 1000000).toFixed(0)}M
                        </span>
                      </div>
                      <Progress
                        value={(network.volume24h / Math.max(...networks.map(n => n.volume24h))) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protocol Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {protocols.map((protocol, index) => (
                    <div key={protocol.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{protocol.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {protocol.apy.toFixed(1)}% APY
                        </span>
                      </div>
                      <Progress
                        value={(protocol.tvl / Math.max(...protocols.map(p => p.tvl))) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cross-Chain Bridges Tab */}
        <TabsContent value="bridges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Chain Bridge Infrastructure</CardTitle>
              <CardDescription>
                Seamless asset transfer across multiple blockchain networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bridge Integration Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced cross-chain bridging capabilities will be available in the next release
                </p>
                <Button variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultNetwork">Default Network</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map(network => (
                      <SelectItem key={network.id} value={network.id}>
                        {network.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gasOptimization">Gas Price Optimization</Label>
                  <Switch id="gasOptimization" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoDeployment">Auto Contract Deployment</Label>
                  <Switch id="autoDeployment" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="crossChainRouting">Cross-Chain Auto Routing</Label>
                  <Switch id="crossChainRouting" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="protocolMonitoring">Protocol Health Monitoring</Label>
                  <Switch id="protocolMonitoring" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BlockchainTradingInfrastructure