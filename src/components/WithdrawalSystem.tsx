'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabaseBankMasterService, VaultWallet, WalletBalance } from '@/lib/services/supabase-bank-master-service'
import { enhancedAlchemyService, MULTI_CHAIN_CONFIG } from '@/lib/blockchain/enhanced-alchemy-service'
import { 
  Wallet, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react'

interface WithdrawalRequest {
  id: string
  amount: number
  token: string
  chain: string
  toAddress: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  txHash?: string
  timestamp: Date
  reason: string
  fees: number
}

interface PersonalWallet {
  id: string
  name: string
  address: string
  chain: string
  isVerified: boolean
  balance?: number
}

export default function WithdrawalSystem() {
  const [vaultWallets, setVaultWallets] = useState<VaultWallet[]>([])
  const [walletBalances, setWalletBalances] = useState<Map<string, WalletBalance[]>>(new Map())
  const [personalWallets, setPersonalWallets] = useState<PersonalWallet[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [selectedVault, setSelectedVault] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [estimatedFees, setEstimatedFees] = useState<number>(0)
  const [selectedTab, setSelectedTab] = useState('withdraw')

  useEffect(() => {
    loadWithdrawalData()
    loadPersonalWallets()
  }, [])

  const loadWithdrawalData = async () => {
    try {
      const wallets = await supabaseBankMasterService.getVaultWallets()
      setVaultWallets(wallets)

      const balancesMap = new Map<string, WalletBalance[]>()
      for (const wallet of wallets) {
        const balances = await supabaseBankMasterService.getWalletBalances(wallet.id)
        balancesMap.set(wallet.id, balances)
      }
      setWalletBalances(balancesMap)

      // Load withdrawal history
      const operations = await supabaseBankMasterService.getVaultOperations()
      const withdrawals = operations
        .filter(op => op.operation_type === 'withdraw')
        .map(op => ({
          id: op.id,
          amount: op.amount,
          token: op.token,
          chain: op.chain,
          toAddress: op.to_address,
          status: op.status as any,
          txHash: op.tx_hash,
          timestamp: new Date(op.created_at),
          reason: op.reason,
          fees: op.gas_used || 0
        }))
      setWithdrawalRequests(withdrawals)

    } catch (error) {
      console.error('Failed to load withdrawal data:', error)
    }
  }

  const loadPersonalWallets = () => {
    // Load from localStorage or user preferences
    const saved = localStorage.getItem('personal_wallets')
    if (saved) {
      setPersonalWallets(JSON.parse(saved))
    }
  }

  const savePersonalWallets = (wallets: PersonalWallet[]) => {
    localStorage.setItem('personal_wallets', JSON.stringify(wallets))
    setPersonalWallets(wallets)
  }

  const addPersonalWallet = () => {
    if (!recipientAddress || !selectedChain) return

    const newWallet: PersonalWallet = {
      id: `wallet_${Date.now()}`,
      name: `My ${selectedChain} Wallet`,
      address: recipientAddress,
      chain: selectedChain,
      isVerified: false
    }

    const updatedWallets = [...personalWallets, newWallet]
    savePersonalWallets(updatedWallets)
    setRecipientAddress('')
  }

  const verifyWallet = async (walletId: string) => {
    try {
      setIsLoading(true)
      const wallet = personalWallets.find(w => w.id === walletId)
      if (!wallet) return

      // Verify wallet address exists on chain
      const balance = await enhancedAlchemyService.getChainBalances(wallet.address, wallet.chain)
      
      const updatedWallets = personalWallets.map(w => 
        w.id === walletId 
          ? { ...w, isVerified: true, balance: balance.reduce((sum, b) => sum + (b.usdValue || 0), 0) }
          : w
      )
      savePersonalWallets(updatedWallets)

    } catch (error) {
      console.error('Failed to verify wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const estimateFees = async () => {
    if (!selectedChain || !withdrawalAmount) return

    try {
      const gasEstimates = await enhancedAlchemyService.estimateGasAcrossChains(
        'transfer',
        withdrawalAmount,
        selectedChain
      )
      
      const chainEstimate = gasEstimates[selectedChain]
      if (chainEstimate) {
        setEstimatedFees(parseFloat(chainEstimate.totalCost))
      }
    } catch (error) {
      console.error('Failed to estimate fees:', error)
    }
  }

  const executeWithdrawal = async () => {
    if (!selectedVault || !selectedToken || !withdrawalAmount || !recipientAddress || !selectedChain) return

    try {
      setIsLoading(true)
      
      const vault = vaultWallets.find(v => v.id === selectedVault)
      if (!vault) return

      const bankMasterConfig = await supabaseBankMasterService.getBankMasterConfig()
      if (!bankMasterConfig) return

      // Create withdrawal operation
      const operationId = `withdrawal_${Date.now()}`
      await supabaseBankMasterService.createVaultOperation({
        bank_master_id: bankMasterConfig.id,
        operation_id: operationId,
        operation_type: 'withdraw',
        amount: parseFloat(withdrawalAmount),
        token: selectedToken,
        chain: selectedChain,
        from_address: vault.address,
        to_address: recipientAddress,
        reason: `Manual withdrawal to personal wallet`,
        status: 'pending'
      })

      // Execute blockchain transaction
      const txInfo = await enhancedAlchemyService.executeTransaction(
        'dummy_private_key', // In real implementation, use secure key management
        recipientAddress,
        withdrawalAmount,
        selectedChain,
        selectedToken !== 'ETH' ? getTokenAddress(selectedToken, selectedChain) : undefined
      )

      if (txInfo) {
        // Update operation with transaction hash
        await supabaseBankMasterService.createVaultOperation({
          bank_master_id: bankMasterConfig.id,
          operation_id: `${operationId}_update`,
          operation_type: 'withdraw',
          amount: parseFloat(withdrawalAmount),
          token: selectedToken,
          chain: selectedChain,
          from_address: vault.address,
          to_address: recipientAddress,
          reason: `Withdrawal completed`,
          status: 'completed'
        })

        // Create withdrawal request record
        const newRequest: WithdrawalRequest = {
          id: operationId,
          amount: parseFloat(withdrawalAmount),
          token: selectedToken,
          chain: selectedChain,
          toAddress: recipientAddress,
          status: 'completed',
          txHash: txInfo.hash,
          timestamp: new Date(),
          reason: 'Manual withdrawal',
          fees: estimatedFees
        }

        setWithdrawalRequests(prev => [newRequest, ...prev])
        
        // Reset form
        setWithdrawalAmount('')
        setRecipientAddress('')
        
        // Refresh data
        await loadWithdrawalData()
      }

    } catch (error) {
      console.error('Failed to execute withdrawal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTokenAddress = (symbol: string, chain: string) => {
    // This would return the token contract address for the given symbol and chain
    // Implementation depends on your token configuration
    return '0x0000000000000000000000000000000000000000'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getAvailableTokens = () => {
    if (!selectedVault) return []
    
    const balances = walletBalances.get(selectedVault) || []
    return balances.filter(b => b.balance > 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Withdrawal System
          </h1>
          <p className="text-muted-foreground">
            Withdraw funds from vault to your personal wallets
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSensitiveData ? 'Hide' : 'Show'} Amounts
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadWithdrawalData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="wallets">My Wallets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Withdrawal Form */}
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>Transfer funds from vault to your personal wallet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vault">Select Vault</Label>
                  <select 
                    id="vault"
                    className="w-full p-2 border rounded"
                    value={selectedVault}
                    onChange={(e) => setSelectedVault(e.target.value)}
                  >
                    <option value="">Select a vault</option>
                    {vaultWallets.map(vault => (
                      <option key={vault.id} value={vault.id}>
                        {vault.name} ({vault.chain}) - {showSensitiveData ? formatCurrency(vault.balance_usd) : '••••••'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Select Token</Label>
                  <select 
                    id="token"
                    className="w-full p-2 border rounded"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    disabled={!selectedVault}
                  >
                    <option value="">Select a token</option>
                    {getAvailableTokens().map(token => (
                      <option key={token.token_symbol} value={token.token_symbol}>
                        {token.token_symbol} - {showSensitiveData ? token.balance.toFixed(4) : '••••••'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    onBlur={estimateFees}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chain">Target Chain</Label>
                  <select 
                    id="chain"
                    className="w-full p-2 border rounded"
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(e.target.value)}
                  >
                    <option value="">Select chain</option>
                    {Object.entries(MULTI_CHAIN_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Recipient Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={addPersonalWallet}>
                      Save
                    </Button>
                  </div>
                </div>

                {estimatedFees > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Estimated network fees: ${estimatedFees.toFixed(6)}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  className="w-full" 
                  onClick={executeWithdrawal}
                  disabled={isLoading || !selectedVault || !selectedToken || !withdrawalAmount || !recipientAddress}
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Processing...' : 'Withdraw Funds'}
                </Button>
              </CardContent>
            </Card>

            {/* Vault Balances */}
            <Card>
              <CardHeader>
                <CardTitle>Available Balances</CardTitle>
                <CardDescription>Your vault balances across all chains</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {vaultWallets.map(vault => {
                      const balances = walletBalances.get(vault.id) || []
                      return (
                        <div key={vault.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{vault.name}</h4>
                            <Badge variant="outline">{vault.chain}</Badge>
                          </div>
                          <div className="space-y-2">
                            {balances.map(balance => (
                              <div key={balance.token_symbol} className="flex justify-between text-sm">
                                <span>{balance.token_symbol}</span>
                                <span className="font-medium">
                                  {showSensitiveData ? balance.balance.toFixed(4) : '••••••'}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between font-medium">
                              <span>Total USD</span>
                              <span>{showSensitiveData ? formatCurrency(vault.balance_usd) : '••••••'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Wallets Tab */}
        <TabsContent value="wallets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Wallets</CardTitle>
              <CardDescription>Manage your personal wallet addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personalWallets.map(wallet => (
                  <div key={wallet.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{wallet.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={wallet.isVerified ? "default" : "outline"}>
                          {wallet.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                        <Badge variant="outline">{wallet.chain}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(wallet.address)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {wallet.balance && (
                      <div className="mt-2 text-sm">
                        Balance: {showSensitiveData ? formatCurrency(wallet.balance) : '••••••'}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      {!wallet.isVerified && (
                        <Button size="sm" variant="outline" onClick={() => verifyWallet(wallet.id)}>
                          <Shield className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setRecipientAddress(wallet.address)}>
                        <Send className="h-3 w-3 mr-1" />
                        Use for Withdrawal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>All your withdrawal transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {withdrawalRequests.map(request => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className="font-medium">
                            {showSensitiveData ? formatCurrency(request.amount) : '••••••'} {request.token}
                          </span>
                        </div>
                        <Badge variant="outline">{request.chain}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>To: {request.toAddress.slice(0, 6)}...{request.toAddress.slice(-4)}</div>
                        <div>Time: {request.timestamp.toLocaleString()}</div>
                        {request.txHash && (
                          <div className="flex items-center gap-2">
                            <span>Tx: {request.txHash.slice(0, 6)}...{request.txHash.slice(-4)}</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(request.txHash!)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {request.fees > 0 && (
                          <div>Fees: ${request.fees.toFixed(6)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Settings</CardTitle>
              <CardDescription>Configure your withdrawal preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Chain</Label>
                <select className="w-full p-2 border rounded">
                  <option value="ethereum">Ethereum</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Gas Price Strategy</Label>
                <select className="w-full p-2 border rounded">
                  <option value="fast">Fast</option>
                  <option value="standard">Standard</option>
                  <option value="slow">Slow</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="confirm-withdrawals" />
                <Label htmlFor="confirm-withdrawals">Require confirmation for withdrawals</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="email-notifications" />
                <Label htmlFor="email-notifications">Email notifications for withdrawals</Label>
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}