'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Wallet, Network, Coins, TrendingUp, Shield,
  RefreshCw, ExternalLink, Plus, Activity, Zap
} from 'lucide-react'
import { alchemyService, type WalletInfo, type TokenBalance, type TransactionInfo } from '@/lib/blockchain/alchemy-service'
import { motion, AnimatePresence } from 'framer-motion'

interface LiveBlockchainDashboardProps {
  isConnected?: boolean
  marketData?: Map<string, any>
  agentUpdates?: Map<string, any>
}

export function LiveBlockchainDashboard({ 
  isConnected = false,
  marketData = new Map(),
  agentUpdates = new Map()
}: LiveBlockchainDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedChain, setSelectedChain] = useState('eth-sepolia')
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [transactions, setTransactions] = useState<TransactionInfo[]>([])
  const [ethPrice, setEthPrice] = useState(0)
  const [gasEstimate, setGasEstimate] = useState({ gasPrice: '0', maxFeePerGas: '0', maxPriorityFeePerGas: '0' })
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for demo
  const [blockchainStats] = useState({
    totalWallets: agentUpdates.size * 2,
    totalValue: Array.from(agentUpdates.values()).reduce((sum, agent) => sum + (agent.portfolioValue || 0), 0) * 0.1,
    activeChains: alchemyService.availableChains.length,
    totalTransactions: Math.floor(Math.random() * 100) + 50,
    gasPrice: '25.3',
    networkStatus: alchemyService.connected ? 'Connected' : 'Offline'
  })

  useEffect(() => {
    loadBlockchainData()
  }, [selectedChain])

  const loadBlockchainData = async () => {
    setIsLoading(true)
    try {
      // Load ETH price
      const price = await alchemyService.getETHPrice(selectedChain)
      setEthPrice(price)

      // Load gas estimates
      const gas = await alchemyService.estimateGas(selectedChain)
      setGasEstimate(gas)

      // Generate demo wallets and data
      if (!alchemyService.connected) {
        // Use mock data when Alchemy is not connected
        const mockWallets = Array.from({ length: 3 }, () => alchemyService.generateMockWallet(selectedChain))
        setWallets(mockWallets)
        setTokenBalances(alchemyService.generateMockTokenBalances())
        setTransactions(alchemyService.generateMockTransactions())
      }
    } catch (error) {
      console.error('Error loading blockchain data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewWallet = async () => {
    setIsLoading(true)
    try {
      const newWallet = await alchemyService.createWallet(selectedChain)
      if (newWallet) {
        setWallets(prev => [newWallet, ...prev])
      }
    } catch (error) {
      console.error('Error creating wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableChains = alchemyService.getAllChains()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Blockchain Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time multi-chain wallet management and DeFi integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={alchemyService.connected ? 'default' : 'secondary'}>
            {alchemyService.connected ? 'Alchemy Connected' : 'Demo Mode'}
          </Badge>
          <Button onClick={loadBlockchainData} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Wallets</p>
                  <p className="text-2xl font-bold">{blockchainStats.totalWallets}</p>
                </div>
                <Wallet className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${blockchainStats.totalValue.toFixed(2)}</p>
                </div>
                <Coins className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Chains</p>
                  <p className="text-2xl font-bold">{blockchainStats.activeChains}</p>
                </div>
                <Network className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gas Price</p>
                  <p className="text-2xl font-bold">{gasEstimate.gasPrice.slice(0, 5)} gwei</p>
                </div>
                <Zap className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chain Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Supported Chains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableChains.map((chain) => (
                    <div key={chain.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{chain.name}</p>
                        <p className="text-sm text-muted-foreground">Chain ID: {chain.chainId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alchemyService.connected ? 'default' : 'secondary'}>
                          {alchemyService.connected ? 'Active' : 'Demo'}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={chain.explorer} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ETH Price</span>
                    <span className="font-mono">${ethPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gas Price</span>
                    <span className="font-mono">{gasEstimate.gasPrice.slice(0, 6)} gwei</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Status</span>
                    <Badge variant={alchemyService.connected ? 'default' : 'secondary'}>
                      {blockchainStats.networkStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WebSocket</span>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Agent Wallets</h3>
            <Button onClick={createNewWallet} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Create Wallet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {wallets.map((wallet, index) => (
                <motion.div
                  key={wallet.address}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Wallet {index + 1}</Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`${availableChains.find(c => c.chainId === wallet.chainId)?.explorer}/address/${wallet.address}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-mono text-sm">{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="font-semibold">{parseFloat(wallet.balance).toFixed(4)} ETH</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nonce</p>
                          <p className="font-mono text-sm">{wallet.nonce}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 10).map((tx, index) => (
                  <div key={tx.hash} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</p>
                        <Badge variant={tx.status === 'success' ? 'default' : 'destructive'}>
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tx.from.slice(0, 8)}...{tx.from.slice(-6)} → {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{parseFloat(tx.value).toFixed(4)} ETH</p>
                      <p className="text-xs text-muted-foreground">Block {tx.blockNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tokenBalances.map((token, index) => (
                    <div key={token.contractAddress} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {token.logo && (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image 
                              src={token.logo} 
                              alt={token.symbol} 
                              width={32} 
                              height={32} 
                              className="rounded-full object-cover" 
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{parseFloat(token.balance).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{token.symbol}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Portfolio Value</span>
                    <span className="font-semibold">${blockchainStats.totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Wallets</span>
                    <span className="font-semibold">{wallets.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Transactions</span>
                    <span className="font-semibold">{transactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-semibold">
                      {((transactions.filter(tx => tx.status === 'success').length / transactions.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LiveBlockchainDashboard