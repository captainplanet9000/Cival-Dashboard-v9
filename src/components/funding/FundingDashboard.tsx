'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { masterWalletManager, MasterWallet, FundingTransaction, AgentAllocation } from '@/lib/blockchain/master-wallet-manager'
import { testnetWalletManager } from '@/lib/blockchain/testnet-wallet-manager'
import { agentWalletIntegration } from '@/lib/blockchain/agent-wallet-integration'
import { Copy, ExternalLink, Wallet, Send, Users, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function FundingDashboard() {
  const [masterWallets, setMasterWallets] = useState<MasterWallet[]>([])
  const [fundingTransactions, setFundingTransactions] = useState<FundingTransaction[]>([])
  const [agentAllocations, setAgentAllocations] = useState<AgentAllocation[]>([])
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [allocationAmount, setAllocationAmount] = useState<string>('25')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadFundingData()
    setupEventListeners()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadFundingData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadFundingData = async () => {
    try {
      const wallets = masterWalletManager.getAllMasterWallets()
      setMasterWallets(wallets)
      
      const allocations = masterWalletManager.getAgentAllocations()
      setAgentAllocations(allocations)
      
      // Load transactions for all wallets
      const allTransactions: FundingTransaction[] = []
      wallets.forEach(wallet => {
        const txs = masterWalletManager.getFundingTransactions(wallet.id)
        allTransactions.push(...txs)
      })
      setFundingTransactions(allTransactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
    } catch (error) {
      console.error('Error loading funding data:', error)
      setError('Failed to load funding data')
    }
  }

  const setupEventListeners = () => {
    // Listen for deposit detection
    masterWalletManager.on('depositDetected', (data) => {
      setSuccess(`Deposit detected: $${data.amount.toFixed(2)}`)
      loadFundingData()
    })

    // Listen for allocation confirmations
    masterWalletManager.on('allocationConfirmed', (data) => {
      setSuccess(`Fund allocation confirmed: $${data.amount} to agent`)
      loadFundingData()
    })

    // Listen for withdrawal confirmations
    masterWalletManager.on('withdrawalInitiated', (data) => {
      setSuccess(`Withdrawal initiated: $${data.transaction.amount}`)
      loadFundingData()
    })

    return () => {
      masterWalletManager.removeAllListeners()
    }
  }

  const createMasterWallet = async () => {
    setLoading(true)
    setError(null)
    try {
      const wallet = await masterWalletManager.createMasterWallet(
        `Master Wallet ${selectedChain}`,
        selectedChain,
        false // Start with testnet for safety
      )
      
      if (wallet) {
        setSuccess(`Master wallet created! Address: ${wallet.address}`)
        loadFundingData()
      } else {
        setError('Failed to create master wallet')
      }
    } catch (error) {
      setError('Error creating master wallet')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const checkForDeposits = async (walletId: string) => {
    setLoading(true)
    setError(null)
    try {
      await masterWalletManager.checkForDeposits(walletId)
      setSuccess('Checked for new deposits')
      loadFundingData()
    } catch (error) {
      setError('Error checking for deposits')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const allocateFundsToAgent = async () => {
    if (!selectedAgentId || !allocationAmount) {
      setError('Please select an agent and enter allocation amount')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const success = await masterWalletManager.allocateFundsToAgent(
        selectedAgentId,
        `Agent ${selectedAgentId}`,
        parseFloat(allocationAmount),
        selectedChain
      )

      if (success) {
        setSuccess(`Allocated $${allocationAmount} to agent`)
        setAllocationAmount('25')
        setSelectedAgentId('')
        loadFundingData()
      } else {
        setError('Failed to allocate funds')
      }
    } catch (error) {
      setError('Error allocating funds')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Address copied to clipboard')
  }

  const openInExplorer = (address: string, txHash?: string) => {
    const baseUrl = selectedChain === 'ethereum' 
      ? 'https://sepolia.etherscan.io'
      : 'https://sepolia.arbiscan.io'
    
    const url = txHash 
      ? `${baseUrl}/tx/${txHash}`
      : `${baseUrl}/address/${address}`
    
    window.open(url, '_blank')
  }

  const masterWallet = masterWallets.find(w => w.chain === selectedChain)
  const summary = masterWalletManager.getAllocationSummary()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funding Dashboard</h1>
          <p className="text-muted-foreground">
            Deposit $100 and watch agents trade autonomously on DEXes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            Real Blockchain
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            {selectedChain} Testnet
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-muted-foreground">Total Deposited</div>
            </div>
            <div className="text-2xl font-bold">${summary.totalDeposited.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-blue-600" />
              <div className="text-sm font-medium text-muted-foreground">Allocated to Agents</div>
            </div>
            <div className="text-2xl font-bold">${summary.totalAllocated.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium text-muted-foreground">Available Funds</div>
            </div>
            <div className="text-2xl font-bold">${summary.totalAvailable.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-2xl font-bold">{summary.agentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedChain} onValueChange={(value) => setSelectedChain(value as 'ethereum' | 'arbitrum')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
          <TabsTrigger value="arbitrum">Arbitrum</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedChain} className="space-y-6">
          {/* Master Wallet Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Master Funding Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!masterWallet ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No master wallet exists for {selectedChain}. Create one to start funding.
                  </p>
                  <Button onClick={createMasterWallet} disabled={loading}>
                    Create Master Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Deposit Address</p>
                      <p className="text-sm text-muted-foreground font-mono">{masterWallet.address}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Send USDC, USDT, DAI, or ETH to this address
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(masterWallet.address)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInExplorer(masterWallet.address)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">ETH</p>
                      <p className="font-bold">{masterWallet.balance.eth.toFixed(4)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">USDC</p>
                      <p className="font-bold">{masterWallet.balance.usdc.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">USDT</p>
                      <p className="font-bold">{masterWallet.balance.usdt.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">DAI</p>
                      <p className="font-bold">{masterWallet.balance.dai.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">WBTC</p>
                      <p className="font-bold">{masterWallet.balance.wbtc.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => checkForDeposits(masterWallet.id)}
                      disabled={loading}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Check for Deposits
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fund Allocation Section */}
          {masterWallet && masterWallet.availableFunds > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Allocate Funds to Agents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Agent ID</label>
                    <Input
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      placeholder="e.g., agent_trading_001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount ($)</label>
                    <Input
                      type="number"
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      placeholder="25"
                      min="1"
                      max={masterWallet.availableFunds}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={allocateFundsToAgent}
                      disabled={loading || !selectedAgentId || !allocationAmount}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Allocate Funds
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Available for allocation: ${masterWallet.availableFunds.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Agent Allocations */}
          {agentAllocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Allocations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentAllocations.map((allocation) => (
                    <div key={allocation.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{allocation.agentName}</p>
                        <p className="text-sm text-muted-foreground">ID: {allocation.agentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${allocation.allocatedAmount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          Performance: {(allocation.performanceMultiplier * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {fundingTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Deposit funds to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {fundingTransactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          tx.type === 'deposit' ? 'default' :
                          tx.type === 'allocate' ? 'secondary' :
                          'outline'
                        }>
                          {tx.type}
                        </Badge>
                        <div>
                          <p className="font-medium">${tx.amount.toFixed(2)} {tx.token}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          tx.status === 'confirmed' ? 'default' :
                          tx.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {tx.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openInExplorer('', tx.txHash)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}