/**
 * Multi-Chain Wallet View Component
 * Comprehensive wallet management for Ethereum, Solana, Sui, and Sonic
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Wallet, 
  Plus, 
  RefreshCw, 
  Send, 
  Copy, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Link as LinkIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Settings,
  History,
  Star,
  Target
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { useAppStore, MultiChainWallet, MultiChainBalance } from '@/lib/stores/app-store'
import { solanaWalletService, SolanaWalletAdapter } from '@/lib/services/solana-wallet-service'
import { suiWalletService, SuiWalletAdapter } from '@/lib/services/sui-wallet-service'
import { sonicWalletService, SonicWalletAdapter } from '@/lib/services/sonic-wallet-service'

interface NetworkInfo {
  id: string
  name: string
  symbol: string
  icon: string
  color: string
  rpcUrl: string
  explorerUrl: string
  service: any
}

interface WalletConnection {
  network: string
  adapter: SolanaWalletAdapter | SuiWalletAdapter | SonicWalletAdapter | null
  balances: MultiChainBalance[]
  isLoading: boolean
  lastSync: Date | null
}

export function MultiChainWalletView() {
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum')
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [showPrivateInfo, setShowPrivateInfo] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<MultiChainWallet | null>(null)
  const [sendForm, setSendForm] = useState({
    network: '',
    token: '',
    recipient: '',
    amount: '',
    memo: ''
  })

  // Wallet connections state
  const [connections, setConnections] = useState<Record<string, WalletConnection>>({
    ethereum: { network: 'ethereum', adapter: null, balances: [], isLoading: false, lastSync: null },
    solana: { network: 'solana', adapter: null, balances: [], isLoading: false, lastSync: null },
    sui: { network: 'sui', adapter: null, balances: [], isLoading: false, lastSync: null },
    sonic: { network: 'sonic', adapter: null, balances: [], isLoading: false, lastSync: null }
  })

  // Store integration
  const {
    multiChainWallets,
    addMultiChainWallet,
    updateMultiChainWallet,
    setSelectedNetwork: setStoreSelectedNetwork
  } = useAppStore()

  // Network configurations
  const networks: NetworkInfo[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: '⟠',
      color: 'from-blue-500 to-blue-600',
      rpcUrl: 'https://mainnet.infura.io/v3/',
      explorerUrl: 'https://etherscan.io',
      service: null // Would use ethers.js or web3.js
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      icon: '◎',
      color: 'from-purple-500 to-purple-600',
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://explorer.solana.com',
      service: solanaWalletService
    },
    {
      id: 'sui',
      name: 'Sui',
      symbol: 'SUI',
      icon: '💧',
      color: 'from-cyan-500 to-cyan-600',
      rpcUrl: 'https://fullnode.mainnet.sui.io',
      explorerUrl: 'https://explorer.sui.io',
      service: suiWalletService
    },
    {
      id: 'sonic',
      name: 'Sonic',
      symbol: 'SONIC',
      icon: '🚀',
      color: 'from-green-500 to-green-600',
      rpcUrl: 'https://rpc.sonic.network',
      explorerUrl: 'https://explorer.sonic.network',
      service: sonicWalletService
    }
  ]

  // Connect to wallet for specific network
  const connectToNetwork = async (networkId: string, walletName: string) => {
    const network = networks.find(n => n.id === networkId)
    if (!network?.service) return

    setConnections(prev => ({
      ...prev,
      [networkId]: { ...prev[networkId], isLoading: true }
    }))

    try {
      const adapter = await network.service.connectWallet(walletName)
      if (adapter) {
        setConnections(prev => ({
          ...prev,
          [networkId]: { 
            ...prev[networkId], 
            adapter, 
            isLoading: false,
            lastSync: new Date()
          }
        }))

        // Add to store
        const wallet: MultiChainWallet = {
          id: `${networkId}-${adapter.address || adapter.publicKey}-${Date.now()}`,
          network: networkId,
          address: adapter.address || adapter.publicKey || '',
          type: 'hot',
          balances: [],
          isActive: true,
          lastSync: new Date()
        }
        addMultiChainWallet(wallet)

        // Sync balances
        await syncWalletBalances(networkId, adapter.address || adapter.publicKey || '')
      }
    } catch (error) {
      console.error(`Error connecting to ${networkId}:`, error)
    } finally {
      setConnections(prev => ({
        ...prev,
        [networkId]: { ...prev[networkId], isLoading: false }
      }))
    }
  }

  // Sync wallet balances for a network
  const syncWalletBalances = async (networkId: string, address: string) => {
    const network = networks.find(n => n.id === networkId)
    if (!network?.service) return

    setConnections(prev => ({
      ...prev,
      [networkId]: { ...prev[networkId], isLoading: true }
    }))

    try {
      const balances = await network.service.getWalletBalances(address)
      setConnections(prev => ({
        ...prev,
        [networkId]: { 
          ...prev[networkId], 
          balances, 
          isLoading: false,
          lastSync: new Date()
        }
      }))
    } catch (error) {
      console.error(`Error syncing ${networkId} balances:`, error)
      setConnections(prev => ({
        ...prev,
        [networkId]: { ...prev[networkId], isLoading: false }
      }))
    }
  }

  // Disconnect from network
  const disconnectFromNetwork = async (networkId: string) => {
    const network = networks.find(n => n.id === networkId)
    if (network?.service) {
      await network.service.disconnectWallet()
    }
    
    setConnections(prev => ({
      ...prev,
      [networkId]: { 
        network: networkId, 
        adapter: null, 
        balances: [], 
        isLoading: false, 
        lastSync: null 
      }
    }))
  }

  // Calculate total portfolio value
  const getTotalPortfolioValue = (): number => {
    return Object.values(connections).reduce((total, connection) => {
      return total + connection.balances.reduce((sum, balance) => sum + balance.balanceUSD, 0)
    }, 0)
  }

  // Generate portfolio distribution data
  const getPortfolioDistribution = () => {
    const data = Object.entries(connections).map(([networkId, connection]) => {
      const network = networks.find(n => n.id === networkId)
      const totalValue = connection.balances.reduce((sum, balance) => sum + balance.balanceUSD, 0)
      
      return {
        name: network?.name || networkId,
        value: totalValue,
        color: network?.color || 'from-gray-500 to-gray-600'
      }
    }).filter(item => item.value > 0)

    return data
  }

  // Network card component
  const NetworkCard = ({ network }: { network: NetworkInfo }) => {
    const connection = connections[network.id]
    const totalValue = connection.balances.reduce((sum, balance) => sum + balance.balanceUSD, 0)
    const isConnected = !!connection.adapter

    return (
      <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selectedNetwork === network.id ? 'ring-2 ring-emerald-500 shadow-lg' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${network.color} flex items-center justify-center text-white text-lg font-bold`}>
                {network.icon}
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{network.name}</CardTitle>
                <CardDescription className="text-xs">{network.symbol}</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              )}
              <Badge variant={isConnected ? "default" : "outline"} className="text-xs">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Portfolio Value</span>
              <span className="font-semibold">${totalValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Assets</span>
              <span className="text-sm">{connection.balances.length} tokens</span>
            </div>
            {isConnected && connection.lastSync && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Sync</span>
                <span className="text-xs text-gray-400">
                  {connection.lastSync.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {isConnected ? (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => syncWalletBalances(network.id, connection.adapter?.address || connection.adapter?.publicKey || '')}
                  disabled={connection.isLoading}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${connection.isLoading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => disconnectFromNetwork(network.id)}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                className={`w-full bg-gradient-to-r ${network.color} hover:opacity-90 text-white`}
                onClick={() => {
                  setSelectedNetwork(network.id)
                  setIsConnectDialogOpen(true)
                }}
                disabled={connection.isLoading}
              >
                {connection.isLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Balance row component
  const BalanceRow = ({ balance, network }: { balance: MultiChainBalance; network: NetworkInfo }) => {
    const isPositive = balance.balanceUSD >= 0
    const changePercent = Math.random() * 10 - 5 // Mock data

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Token Info */}
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${network.color} flex items-center justify-center text-white text-xs font-bold`}>
                {balance.symbol.substring(0, 2)}
              </div>
              <div>
                <div className="font-semibold">{balance.symbol}</div>
                <div className="text-xs text-gray-500">{network.name}</div>
              </div>
            </div>

            {/* Balance */}
            <div className="text-right md:text-left">
              <div className="font-semibold">
                {balance.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
              <div className="text-xs text-gray-500">{balance.symbol}</div>
            </div>

            {/* USD Value */}
            <div className="text-right md:text-left">
              <div className="font-semibold">
                ${balance.balanceUSD.toLocaleString()}
              </div>
              <div className={`text-xs flex items-center ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(changePercent).toFixed(2)}%
              </div>
            </div>

            {/* Network Badge */}
            <div className="text-right md:text-left">
              <Badge variant="outline" className="text-xs">
                {balance.isNative ? 'Native' : 'Token'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSendForm({
                    network: network.id,
                    token: balance.symbol,
                    recipient: '',
                    amount: '',
                    memo: ''
                  })
                  setIsSendDialogOpen(true)
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(balance.address)
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const network = networks.find(n => n.id === balance.network)
                  if (network) {
                    window.open(`${network.explorerUrl}/address/${balance.address}`, '_blank')
                  }
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            Multi-Chain Wallets
          </h1>
          <p className="text-gray-500">Manage wallets across Ethereum, Solana, Sui, and Sonic</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </Button>
          <Button>
            <Activity className="w-4 h-4 mr-2" />
            Live Prices
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${getTotalPortfolioValue().toLocaleString()}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.4% today
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Connected Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Object.values(connections).filter(c => c.adapter).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">of {networks.length} available</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Object.values(connections).reduce((sum, c) => sum + c.balances.length, 0)}
            </div>
            <p className="text-xs text-violet-600 flex items-center mt-1">
              <Star className="h-3 w-3 mr-1" />
              Across all chains
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <Target className="h-3 w-3 mr-1" />
              Cross-chain swaps
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="networks">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4">
          {/* Networks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {networks.map(network => (
              <NetworkCard key={network.id} network={network} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          {/* All Balances */}
          <div className="space-y-3">
            {Object.entries(connections).map(([networkId, connection]) => {
              const network = networks.find(n => n.id === networkId)
              if (!network || connection.balances.length === 0) return null

              return (
                <div key={networkId}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className={`w-6 h-6 rounded-full bg-gradient-to-r ${network.color} flex items-center justify-center text-white text-xs font-bold mr-2`}>
                      {network.icon}
                    </span>
                    {network.name} Assets
                  </h3>
                  {connection.balances.map(balance => (
                    <BalanceRow key={balance.id} balance={balance} network={network} />
                  ))}
                </div>
              )
            })}
            
            {Object.values(connections).every(c => c.balances.length === 0) && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Wallet className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Balances Found</h3>
                  <p className="text-gray-500 mb-4">Connect wallets to see your cross-chain assets</p>
                  <Button onClick={() => setIsConnectDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <History className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Transaction History</h3>
              <p className="text-gray-500">Cross-chain transaction tracking coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Portfolio Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Portfolio Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPortfolioDistribution()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {getPortfolioDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Wallet Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {networks.find(n => n.id === selectedNetwork)?.name}</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to {networks.find(n => n.id === selectedNetwork)?.name} network
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNetwork === 'solana' && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => connectToNetwork('solana', 'Phantom')}>
                  <div className="w-4 h-4 mr-2 bg-purple-600 rounded" />
                  Phantom
                </Button>
                <Button variant="outline" onClick={() => connectToNetwork('solana', 'Solflare')}>
                  Solflare
                </Button>
              </div>
            )}
            {selectedNetwork === 'sui' && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => connectToNetwork('sui', 'Sui Wallet')}>
                  Sui Wallet
                </Button>
                <Button variant="outline" onClick={() => connectToNetwork('sui', 'Ethos Wallet')}>
                  Ethos
                </Button>
              </div>
            )}
            {selectedNetwork === 'sonic' && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => connectToNetwork('sonic', 'MetaMask')}>
                  MetaMask
                </Button>
                <Button variant="outline" onClick={() => connectToNetwork('sonic', 'WalletConnect')}>
                  WalletConnect
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Transaction Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {sendForm.token}</DialogTitle>
            <DialogDescription>
              Send tokens on {networks.find(n => n.id === sendForm.network)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                value={sendForm.recipient}
                onChange={(e) => setSendForm(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="Enter recipient address"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={sendForm.amount}
                onChange={(e) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Input
                id="memo"
                value={sendForm.memo}
                onChange={(e) => setSendForm(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="Enter memo"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsSendDialogOpen(false)}>
                Send Transaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}