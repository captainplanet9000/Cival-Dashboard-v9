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
  Wallet, Copy, RefreshCw, Send, ExternalLink,
  Coins, TrendingUp, Activity, Shield, Eye,
  Network, Zap, Target, ArrowUpRight
} from 'lucide-react'
import { alchemyService, type WalletInfo, type TokenBalance, type TransactionInfo } from '@/lib/blockchain/alchemy-service'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface BlockchainAgentWalletProps {
  agentId: string
  agentName: string
  className?: string
}

export function BlockchainAgentWallet({ agentId, agentName, className }: BlockchainAgentWalletProps) {
  const [selectedChain, setSelectedChain] = useState('eth-sepolia')
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [transactions, setTransactions] = useState<TransactionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [ethPrice, setETHPrice] = useState(0)

  const availableChains = alchemyService.availableChains.map(chainKey => ({
    key: chainKey,
    config: alchemyService.getChainConfig(chainKey)
  })).filter(chain => chain.config)

  useEffect(() => {
    loadWalletData()
    loadETHPrice()
  }, [selectedChain, agentId])

  const loadWalletData = async () => {
    setLoading(true)
    try {
      // Check if agent already has a wallet for this chain
      const existingWallet = localStorage.getItem(`agent_wallet_${agentId}_${selectedChain}`)
      
      let walletInfo: WalletInfo | null = null
      
      if (existingWallet) {
        // Load existing wallet
        const savedWallet = JSON.parse(existingWallet)
        // Update balance
        const balance = await alchemyService.getWalletBalance(savedWallet.address, selectedChain)
        walletInfo = { ...savedWallet, balance }
      } else {
        // Create new wallet for this agent and chain
        if (alchemyService.connected) {
          walletInfo = await alchemyService.createWallet(selectedChain)
          if (walletInfo) {
            // Save wallet to localStorage (in production, use secure storage)
            localStorage.setItem(`agent_wallet_${agentId}_${selectedChain}`, JSON.stringify(walletInfo))
          }
        } else {
          // Use mock wallet for development
          walletInfo = alchemyService.generateMockWallet(selectedChain)
        }
      }

      setWallet(walletInfo)

      if (walletInfo) {
        // Load token balances
        const tokens = alchemyService.connected 
          ? await alchemyService.getTokenBalances(walletInfo.address, selectedChain)
          : alchemyService.generateMockTokenBalances()
        setTokenBalances(tokens)

        // Load transaction history
        const txHistory = alchemyService.connected
          ? await alchemyService.getTransactionHistory(walletInfo.address, selectedChain)
          : alchemyService.generateMockTransactions()
        setTransactions(txHistory)
      }
    } catch (error) {
      console.error('Error loading wallet data:', error)
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const loadETHPrice = async () => {
    try {
      const price = await alchemyService.getETHPrice(selectedChain)
      setETHPrice(price)
    } catch (error) {
      console.error('Error loading ETH price:', error)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const openInExplorer = (address: string) => {
    const chainConfig = alchemyService.getChainConfig(selectedChain)
    if (chainConfig) {
      window.open(`${chainConfig.explorer}/address/${address}`, '_blank')
    }
  }

  const openTransactionInExplorer = (txHash: string) => {
    const chainConfig = alchemyService.getChainConfig(selectedChain)
    if (chainConfig) {
      window.open(`${chainConfig.explorer}/tx/${txHash}`, '_blank')
    }
  }

  const totalPortfolioValue = wallet && ethPrice 
    ? (parseFloat(wallet.balance) * ethPrice) + 
      tokenBalances.reduce((sum, token) => {
        // Simplified: assume all tokens are worth $1 for demo
        return sum + parseFloat(token.balance)
      }, 0)
    : 0

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Agent Wallet Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              {agentName} - Testnet Wallet
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Multi-chain testnet wallet with real blockchain integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={alchemyService.connected ? 'default' : 'secondary'}>
              {alchemyService.connected ? 'Live' : 'Mock'}
            </Badge>
            <Button size="sm" variant="outline" onClick={loadWalletData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chain Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Chain</label>
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

        {wallet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Portfolio Value</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ${totalPortfolioValue.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ETH: ${ethPrice.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Native Balance</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {parseFloat(wallet.balance).toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {alchemyService.getChainConfig(selectedChain)?.symbol || 'ETH'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Transactions</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {transactions.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total history
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm font-mono">{wallet.address}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.address, 'Address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openInExplorer(wallet.address)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs for detailed information */}
            <Tabs defaultValue="tokens" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tokens">Token Balances</TabsTrigger>
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                <TabsTrigger value="trading">Trading Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="tokens" className="space-y-4">
                {tokenBalances.length > 0 ? (
                  <div className="space-y-3">
                    {tokenBalances.map((token, index) => (
                      <motion.div
                        key={token.contractAddress}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {token.logo && (
                            <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{parseFloat(token.balance).toFixed(4)}</div>
                          <div className="text-sm text-muted-foreground">
                            ≈ ${(parseFloat(token.balance) * 1).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No token balances found</p>
                    <p className="text-sm text-muted-foreground">
                      Agent hasn't traded any tokens yet
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((tx, index) => (
                      <motion.div
                        key={tx.hash}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            tx.status === 'success' ? 'bg-green-500' : 
                            tx.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <div className="font-medium text-sm">
                              {tx.from === wallet.address ? 'Sent' : 'Received'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Block #{tx.blockNumber}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {parseFloat(tx.value).toFixed(4)} ETH
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => openTransactionInExplorer(tx.hash)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground">
                      Agent transactions will appear here
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trading" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="h-auto flex-col gap-2 p-4">
                    <Send className="h-6 w-6" />
                    <span>Execute Trade</span>
                    <span className="text-xs opacity-70">Place testnet order</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                    <Target className="h-6 w-6" />
                    <span>Set Strategy</span>
                    <span className="text-xs opacity-70">Configure trading rules</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                    <TrendingUp className="h-6 w-6" />
                    <span>View Performance</span>
                    <span className="text-xs opacity-70">Agent trading stats</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                    <Zap className="h-6 w-6" />
                    <span>Auto Trading</span>
                    <span className="text-xs opacity-70">Enable autonomous mode</span>
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Testnet Faucet</span>
                        <Badge variant="outline">Available</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get free testnet tokens to fund your agent's trading operations
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open('https://sepoliafaucet.com/', '_blank')}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Get Testnet ETH
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

export default BlockchainAgentWallet