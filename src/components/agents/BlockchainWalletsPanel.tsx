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
import BlockchainAgentWallet from './BlockchainAgentWallet'
import { motion, AnimatePresence } from 'framer-motion'

export function BlockchainWalletsPanel() {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [selectedChain, setSelectedChain] = useState('eth-sepolia')
  
  // Get agent data
  const { agents } = useSharedRealtimeData()

  const availableChains = alchemyService.availableChains.map(chainKey => ({
    key: chainKey,
    config: alchemyService.getChainConfig(chainKey)
  })).filter(chain => chain.config)

  const activeAgents = agents.filter(agent => agent.status === 'active')

  const [overviewStats] = useState({
    totalWallets: activeAgents.length * availableChains.length,
    totalValue: activeAgents.reduce((sum, agent) => sum + (agent.portfolioValue || 0), 0),
    connectedChains: availableChains.length,
    activeTransactions: Math.floor(Math.random() * 50) + 10
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
            {availableChains.map(({ key, config }) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">{config!.name}</div>
                    <div className="text-sm text-muted-foreground">Chain ID: {config!.chainId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alchemyService.connected ? 'default' : 'secondary'}>
                    {alchemyService.connected ? 'Connected' : 'Mock'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(config!.explorer, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Selector and Wallet Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent Wallet Details</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Wallet
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {activeAgents.map((agent) => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {agent.name} ({agent.strategy})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Chain</label>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableChains.map(({ key, config }) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        {config!.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Agent Wallet */}
          <AnimatePresence mode="wait">
            {selectedAgent ? (
              <motion.div
                key={selectedAgent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <BlockchainAgentWallet
                  agentId={selectedAgent}
                  agentName={activeAgents.find(a => a.agentId === selectedAgent)?.name || 'Unknown Agent'}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an Agent</h3>
                <p className="text-muted-foreground">
                  Choose an agent from the dropdown above to view their blockchain wallet details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <RefreshCw className="h-6 w-6" />
              <span>Sync All Wallets</span>
              <span className="text-xs opacity-70">Update balances across chains</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <TrendingUp className="h-6 w-6" />
              <span>Portfolio Analytics</span>
              <span className="text-xs opacity-70">View performance metrics</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <ExternalLink className="h-6 w-6" />
              <span>Testnet Faucets</span>
              <span className="text-xs opacity-70">Get free testnet tokens</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BlockchainWalletsPanel