'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Wallet, Network, Coins, TrendingUp, Shield,
  RefreshCw, ExternalLink, Plus, Settings
} from 'lucide-react'
import { alchemyService } from '@/lib/blockchain/alchemy-service'
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'
import { testnetWalletManager } from '@/lib/blockchain/testnet-wallet-manager'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'
import BlockchainAgentWallet from './BlockchainAgentWallet'
import { motion, AnimatePresence } from 'framer-motion'

export function BlockchainWalletsPanel() {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [selectedChain, setSelectedChain] = useState('ethereum')
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Get agent data
  const { agents } = useSharedRealtimeData()

  const availableChains = [
    { key: 'ethereum', name: 'Ethereum Sepolia', testnet: true },
    { key: 'arbitrum', name: 'Arbitrum Sepolia', testnet: true }
  ]

  const activeAgents = agents.filter(agent => agent.status === 'active')

  useEffect(() => {
    loadWallets()
    
    // Listen for wallet updates
    const handleWalletUpdate = () => loadWallets()
    testnetWalletManager.on('walletCreated', handleWalletUpdate)
    testnetWalletManager.on('balanceUpdated', handleWalletUpdate)
    testnetWalletManager.on('transactionCreated', handleWalletUpdate)
    
    return () => {
      testnetWalletManager.off('walletCreated', handleWalletUpdate)
      testnetWalletManager.off('balanceUpdated', handleWalletUpdate)
      testnetWalletManager.off('transactionCreated', handleWalletUpdate)
    }
  }, [])

  const loadWallets = () => {
    const allWallets = testnetWalletManager.getAllWallets()
    setWallets(allWallets)
  }

  const createWalletForAgent = async (agentId: string, agentName: string) => {
    setLoading(true)
    try {
      const newWallets = await testnetWalletManager.createWalletsForAgent(agentId, agentName)
      console.log(`✅ Created ${newWallets.length} wallets for ${agentName}`)
      loadWallets()
    } catch (error) {
      console.error('Error creating wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const walletStats = testnetWalletManager.getWalletStats()

  const [overviewStats] = useState({
    totalWallets: wallets.length,
    totalValue: walletStats.totalValue,
    connectedChains: availableChains.length,
    activeTransactions: walletStats.totalTransactions
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Blockchain Wallet Management</h3>
        <p className="text-sm text-muted-foreground">
          Multi-chain testnet wallets for autonomous trading agents with real blockchain integration
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Wallets</span>
              </div>
              <div className="text-2xl font-bold">{overviewStats.totalWallets}</div>
              <div className="text-xs text-muted-foreground">
                Across {overviewStats.connectedChains} chains
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Portfolio Value</span>
              </div>
              <div className="text-2xl font-bold">${overviewStats.totalValue.toFixed(2)}</div>
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
                <Network className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Connected Chains</span>
              </div>
              <div className="text-2xl font-bold">{overviewStats.connectedChains}</div>
              <div className="text-xs text-muted-foreground">
                Ethereum, Arbitrum testnets
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Active Transactions</span>
              </div>
              <div className="text-2xl font-bold">{overviewStats.activeTransactions}</div>
              <div className="text-xs text-muted-foreground">
                Last 24 hours
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chain Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Blockchain Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableChains.map((chain) => (
              <div key={chain.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">{chain.name}</div>
                    <div className="text-sm text-muted-foreground">Testnet: {chain.testnet ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Wallets Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent Wallets</CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                const persistentAgents = persistentAgentService.getAllAgents()
                if (persistentAgents.length > 0) {
                  const agent = persistentAgents[0]
                  createWalletForAgent(agent.id, agent.name)
                }
              }}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Wallets'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Wallets Grid */}
          {wallets.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Wallets Created</h3>
              <p className="text-muted-foreground mb-4">
                Create testnet wallets for your agents to enable blockchain trading
              </p>
              <Button onClick={() => {
                const persistentAgents = persistentAgentService.getAllAgents()
                if (persistentAgents.length > 0) {
                  const agent = persistentAgents[0]
                  createWalletForAgent(agent.id, agent.name)
                }
              }}>
                Create First Wallet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Wallet Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{wallet.agentName}</h3>
                        <p className="text-sm text-muted-foreground">{wallet.network}</p>
                      </div>
                      <Badge variant="outline">{wallet.chain.toUpperCase()}</Badge>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Address</label>
                      <div className="font-mono text-sm bg-gray-50 rounded p-2 break-all">
                        {wallet.address}
                      </div>
                    </div>

                    {/* Balances */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Balances</label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>ETH:</span>
                          <span className="font-medium">{wallet.balance.eth.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>USDC:</span>
                          <span className="font-medium">{wallet.balance.usdc.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>USDT:</span>
                          <span className="font-medium">{wallet.balance.usdt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>WBTC:</span>
                          <span className="font-medium">{wallet.balance.wbtc.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Value */}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Value:</span>
                        <span className="text-green-600">
                          ${(
                            wallet.balance.eth * 2300 +
                            wallet.balance.usdc +
                            wallet.balance.usdt +
                            wallet.balance.wbtc * 43000
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Transactions */}
                    <div className="text-xs text-muted-foreground">
                      {wallet.transactions.length} transactions
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trade
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DEX Arbitrage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            DEX Arbitrage Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">DEX Arbitrage Ready</h3>
            <p className="text-muted-foreground mb-4">
              Agents can detect and execute arbitrage opportunities across Uniswap, SushiSwap, and other DEXs
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="font-medium text-blue-800">Supported DEXs</div>
                <div className="text-blue-600">Uniswap V3, SushiSwap</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="font-medium text-green-800">Min Profit</div>
                <div className="text-green-600">0.5% after gas</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="font-medium text-purple-800">Execution</div>
                <div className="text-purple-600">Fully automated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BlockchainWalletsPanel